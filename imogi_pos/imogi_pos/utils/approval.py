# Copyright (c) 2026, Imogi and contributors
"""Supervisor approval workflow for discount, void, and refund."""

from __future__ import annotations

import hashlib

import frappe
from frappe import _
from frappe.utils import cint, flt, now_datetime

from imogi_pos.imogi_pos.utils.feature_gating import require_feature_operational
from imogi_pos.imogi_pos.utils.flow import get_settings

APPROVAL_TYPES = (
	"Discount",
	"Void",
	"Refund",
	"Complimentary",
)


def _hash_pin(pin: str) -> str:
	return hashlib.sha256((pin or "").strip().encode("utf-8")).hexdigest()


def is_approval_enabled(settings=None) -> bool:
	settings = settings or get_settings()
	return bool(cint(getattr(settings, "enable_approval_workflow", 0)))


def _verify_pin(pin: str, settings=None) -> bool:
	settings = settings or get_settings()
	stored = (getattr(settings, "approval_supervisor_pin", None) or "").strip()
	if not stored:
		return False
	if len(stored) == 64 and all(c in "0123456789abcdef" for c in stored.lower()):
		return _hash_pin(pin) == stored
	return pin == stored


def create_approval_request(
	*,
	approval_type: str,
	reference_name: str | None = None,
	reason: str | None = None,
	amount: float = 0,
	payload: dict | None = None,
) -> str:
	doc = frappe.get_doc(
		{
			"doctype": "IMOGI POS Approval Request",
			"approval_type": approval_type,
			"reference_name": reference_name,
			"reason": reason,
			"amount": flt(amount),
			"payload_json": frappe.as_json(payload or {}),
			"requested_by": frappe.session.user,
			"status": "Pending",
		}
	)
	doc.insert(ignore_permissions=True)
	return doc.name


def approve_request(request_name: str, pin: str | None = None) -> dict:
	settings = get_settings()
	if not _verify_pin(pin or "", settings):
		frappe.throw(_("PIN supervisor tidak valid"), title=_("Approval Ditolak"))

	doc = frappe.get_doc("IMOGI POS Approval Request", request_name)
	if doc.status != "Pending":
		frappe.throw(_("Permintaan approval sudah diproses"))

	doc.db_set(
		{
			"status": "Approved",
			"approved_by": frappe.session.user,
			"approved_at": now_datetime(),
		}
	)
	return {"name": doc.name, "status": "Approved", "approval_type": doc.approval_type}


def require_supervisor_approval(
	approval_type: str,
	*,
	reference_name: str | None = None,
	reason: str | None = None,
	amount: float = 0,
	approval_code: str | None = None,
	payload: dict | None = None,
):
	"""Raise unless workflow disabled, feature allowed, and approval_code is valid."""
	feature_map = {
		"Discount": "approval_discount",
		"Void": "approval_void",
		"Refund": "approval_refund",
		"Complimentary": "approval_complimentary",
	}
	feature_id = feature_map.get(approval_type)
	if feature_id:
		require_feature_operational(feature_id)

	settings = get_settings()
	if not is_approval_enabled(settings):
		return

	if approval_code:
		doc = frappe.db.get_value(
			"IMOGI POS Approval Request",
			approval_code,
			["name", "status", "approval_type"],
			as_dict=True,
		)
		if doc and doc.status == "Approved" and doc.approval_type == approval_type:
			return

	request_name = create_approval_request(
		approval_type=approval_type,
		reference_name=reference_name,
		reason=reason,
		amount=amount,
		payload=payload,
	)
	frappe.throw(
		_(
			"Aksi ini memerlukan approval supervisor. Kode permintaan: <b>{0}</b>. "
			"Minta supervisor menyetujui di IMOGI POS Approval Request."
		).format(request_name),
		title=_("Perlu Approval Supervisor"),
		exc=frappe.PermissionError,
	)


def discount_requires_approval(discount_amount: float, subtotal: float, settings=None) -> bool:
	settings = settings or get_settings()
	if not is_approval_enabled(settings):
		return False
	threshold = flt(getattr(settings, "approval_discount_threshold_percent", 0))
	if threshold <= 0 or subtotal <= 0:
		return False
	pct = (flt(discount_amount) / flt(subtotal)) * 100
	return pct >= threshold


@frappe.whitelist()
def verify_supervisor_pin(pin: str):
	frappe.only_for(("System Manager", "Sales Manager", "IMOGI Cashier", "Sales User"))
	if _verify_pin(pin):
		return {"valid": True}
	frappe.throw(_("PIN supervisor tidak valid"))
