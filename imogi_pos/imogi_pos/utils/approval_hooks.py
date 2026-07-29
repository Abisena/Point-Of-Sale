# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import cint, flt

from imogi_pos.imogi_pos.utils.approval import (
	PO_FINAL_APPROVER_ROLE,
	get_po_approver_role,
	is_approval_enabled,
	po_requires_approval,
	require_supervisor_approval,
	user_can_approve_po_tier,
)
from imogi_pos.imogi_pos.utils.feature_gating import is_feature_operational
from imogi_pos.imogi_pos.utils.flow import get_settings


def _approval_flag_set(doc) -> bool:
	return bool(getattr(doc.flags, "imogi_approval_ok", False))


def purchase_order_before_submit(doc, method=None):
	"""Approval gate is controlled purely by the merchant's Enable Approval Workflow
	setting, not by subscription tier — Purchase Order commitments need review
	regardless of which plan the merchant is on. Odoo-style double validation:
	only POs at/above the configured threshold actually need approval.

	Two-stage chain: the tier hierarchy (IMOGI POS Settings.po_approval_tiers)
	decides who reviews first; once that stage is approved,
	_post_purchase_order_from_approval() escalates to a second, mandatory
	Owner approval before the PO actually submits — Owner always ends up
	reviewing every PO that went through approval, not just the tier
	approver. The only case skipping straight through is when the tier
	itself already resolves to Owner and the submitter already is Owner —
	there's nobody left to escalate to."""
	if _approval_flag_set(doc):
		return
	if cint(doc.get("__islocal")):
		return
	if not po_requires_approval(flt(doc.grand_total)):
		return

	required_role = get_po_approver_role(flt(doc.grand_total))

	if required_role and user_can_approve_po_tier(required_role):
		if required_role == PO_FINAL_APPROVER_ROLE:
			# Submitter already is Owner (or holds an admin bypass role) and the
			# tier itself is Owner-level — nothing above Owner to escalate to.
			return
		# Submitter already satisfies the tier requirement themselves, so there's
		# no separate person to review stage one — but Owner still hasn't seen
		# this PO, so go straight to the mandatory Owner sign-off instead of
		# letting it through untouched.
		require_supervisor_approval(
			"Purchase Order",
			reference_name=doc.name,
			reason=_("Persetujuan akhir Owner untuk PO {0} - {1}").format(
				doc.name, doc.supplier_name or doc.supplier
			),
			amount=flt(doc.grand_total),
			payload={"purchase_order": doc.name},
			required_role_override=PO_FINAL_APPROVER_ROLE,
		)
		return

	require_supervisor_approval(
		"Purchase Order",
		reference_name=doc.name,
		reason=_("Purchase Order {0} - {1}").format(doc.name, doc.supplier_name or doc.supplier),
		amount=flt(doc.grand_total),
		payload={"purchase_order": doc.name},
	)


def stock_entry_before_submit(doc, method=None):
	if _approval_flag_set(doc):
		return
	if doc.stock_entry_type not in ("Material Issue", "Material Receipt"):
		return
	if not is_feature_operational("approval_stock_adjustment"):
		return
	if not is_approval_enabled():
		return
	frappe.throw(
		_("Stock adjustment/issue memerlukan approval supervisor."),
		title=_("Perlu Approval"),
	)


def complimentary_discount_check(order_doc):
	"""Call from order validate when discount_type is Complimentary.
	Merchant gak pakai approval PIN buat Diskon/Void/Refund/Complimentary lagi."""
	return
