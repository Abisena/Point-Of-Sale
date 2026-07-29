# Copyright (c) 2026, Imogi and contributors
"""Supervisor approval workflow for discount, void, and refund."""

from __future__ import annotations

import hashlib

import frappe
from frappe import _
from frappe.utils import cint, flt, now_datetime

from imogi_pos.imogi_pos.utils.flow import get_settings

APPROVAL_TYPES = (
	"Discount",
	"Void",
	"Refund",
	"Complimentary",
	"Waste",
	"Spoilage",
	"Opname",
	"Adjustment",
	"Purchase Order",
	"Cash In",
	"Cash Out",
)

WASTE_APPROVAL_TYPES = ("Waste", "Spoilage")
OPNAME_APPROVAL_TYPES = ("Opname",)
ADJUSTMENT_APPROVAL_TYPES = ("Adjustment",)
# Waste/Spoilage, Opname & Adjustment: HO boleh approve pakai role saja (tanpa PIN).
STOCK_APPROVAL_TYPES = WASTE_APPROVAL_TYPES + OPNAME_APPROVAL_TYPES + ADJUSTMENT_APPROVAL_TYPES

# Roles yang boleh approve waste/spoilage/opname tanpa PIN (HO / supervisor desk).
STOCK_APPROVER_ROLES = (
	"System Manager",
	"Sales Manager",
	"Stock Manager",
	"Purchase Manager",
)

# Every Purchase Order approval chain ends with Owner — the tier hierarchy
# (IMOGI POS Settings.po_approval_tiers) only decides who reviews first; see
# purchase_order_before_submit (approval_hooks.py) and
# _post_purchase_order_from_approval below.
PO_FINAL_APPROVER_ROLE = "IMOGI Owner"


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
	required_role: str | None = None,
) -> str:
	doc = frappe.get_doc(
		{
			"doctype": "IMOGI POS Approval Request",
			"approval_type": approval_type,
			"reference_name": reference_name,
			"reason": reason,
			"amount": flt(amount),
			"required_role": required_role,
			"payload_json": frappe.as_json(payload or {}),
			"requested_by": frappe.session.user,
			"status": "Pending",
		}
	)
	doc.insert(ignore_permissions=True)
	return doc.name


def _user_can_approve_stock_ops_without_pin() -> bool:
	roles = set(frappe.get_roles(frappe.session.user))
	return bool(roles.intersection(STOCK_APPROVER_ROLES))


def get_po_approver_role(grand_total: float, settings=None) -> str | None:
	"""Cari role approver dari tabel Hirarki Approval PO (IMOGI POS Settings.po_approval_tiers)
	untuk nominal ini. None kalau tabel tier kosong (sinyal: pakai mode PIN lama)."""
	settings = settings or get_settings()
	rows = getattr(settings, "po_approval_tiers", None) or []
	if not rows:
		return None
	grand_total = flt(grand_total)
	for row in sorted(rows, key=lambda r: flt(r.from_amount)):
		to_amount = flt(row.to_amount)
		if flt(row.from_amount) <= grand_total and (to_amount == 0 or grand_total <= to_amount):
			return row.approver_role
	return None


def user_can_approve_po_tier(required_role: str, user: str | None = None) -> bool:
	"""True kalau user (lewat role Frappe-nya) berwenang approve tier ini — termasuk
	eskalasi otomatis dari role yang lebih tinggi, pakai hierarki role_gating.py yang
	sudah ada supaya konsisten dengan gating fitur lain di app ini."""
	from imogi_pos.imogi_pos.utils.role_gating import (
		BYPASS_ROLE_GATING_ROLES,
		FRAPPE_ROLE_TO_MATRIX,
		ROLE_PRIVILEGES,
	)

	user = user or frappe.session.user
	user_roles = set(frappe.get_roles(user))
	if user_roles & BYPASS_ROLE_GATING_ROLES:
		return True

	required_persona = FRAPPE_ROLE_TO_MATRIX.get(required_role)
	if not required_persona:
		return False

	for frappe_role in user_roles:
		persona = FRAPPE_ROLE_TO_MATRIX.get(frappe_role)
		if not persona:
			continue
		if required_persona in ROLE_PRIVILEGES.get(persona, frozenset()):
			return True
	return False


def _assert_can_approve(doc, pin: str | None = None):
	"""Purchase Order dengan tier role: cek role (+eskalasi), tanpa PIN.
	Waste/Spoilage/Opname: HO role OK tanpa PIN. Selain itu: PIN supervisor."""
	if doc.approval_type == "Purchase Order" and doc.required_role:
		if user_can_approve_po_tier(doc.required_role):
			return
		frappe.throw(
			_("Approval PO ini butuh role <b>{0}</b> (atau role yang lebih tinggi).").format(doc.required_role),
			title=_("Approval Ditolak"),
			exc=frappe.PermissionError,
		)

	role_bypass = doc.approval_type in STOCK_APPROVAL_TYPES
	if role_bypass and _user_can_approve_stock_ops_without_pin():
		return
	settings = get_settings()
	if not _verify_pin(pin or "", settings):
		frappe.throw(_("PIN supervisor tidak valid"), title=_("Approval Ditolak"))


def _post_waste_from_approval(doc) -> str | None:
	"""Create Material Issue from approved Waste/Spoilage payload. Returns stock entry name."""
	if doc.approval_type not in WASTE_APPROVAL_TYPES:
		return None

	payload = {}
	if doc.payload_json:
		try:
			payload = frappe.parse_json(doc.payload_json) or {}
		except Exception:
			payload = {}

	item_code = (payload.get("item_code") or "").strip()
	qty = flt(payload.get("qty"))
	warehouse = payload.get("warehouse") or None
	remarks = (payload.get("remarks") or doc.reason or "").strip()
	if not item_code or qty <= 0:
		frappe.throw(_("Payload waste/spoilage tidak valid"))

	from imogi_pos.imogi_pos.utils.planned_features import create_spoilage_entry

	stock_entry = create_spoilage_entry(
		item_code,
		qty,
		warehouse=warehouse,
		reason=remarks or None,
		approval_ok=True,
	)
	doc.db_set("reference_name", stock_entry)

	# Salin bukti ke Stock Entry supaya tetap terlihat di dokumen stok
	for f in frappe.get_all(
		"File",
		filters={
			"attached_to_doctype": "IMOGI POS Approval Request",
			"attached_to_name": doc.name,
		},
		fields=["name", "file_url", "file_name", "is_private"],
	):
		exists = frappe.db.exists(
			"File",
			{
				"file_url": f.file_url,
				"attached_to_doctype": "Stock Entry",
				"attached_to_name": stock_entry,
			},
		)
		if exists:
			continue
		frappe.get_doc(
			{
				"doctype": "File",
				"file_url": f.file_url,
				"file_name": f.file_name,
				"attached_to_doctype": "Stock Entry",
				"attached_to_name": stock_entry,
				"is_private": cint(f.is_private),
			}
		).insert(ignore_permissions=True)

	return stock_entry


def _post_opname_from_approval(doc) -> str | None:
	"""Create & submit Stock Reconciliation dari payload Opname yang di-approve."""
	if doc.approval_type != "Opname":
		return None

	payload = {}
	if doc.payload_json:
		try:
			payload = frappe.parse_json(doc.payload_json) or {}
		except Exception:
			payload = {}

	items = payload.get("items") or []
	warehouse = payload.get("warehouse") or None
	posting_date = payload.get("posting_date") or None
	if not items:
		frappe.throw(_("Payload opname tidak valid"))

	from imogi_pos.imogi_pos.utils.inventory_hub import submit_opname_reconciliation

	stock_reconciliation = submit_opname_reconciliation(
		items=items, warehouse=warehouse, posting_date=posting_date
	)
	doc.db_set("reference_name", stock_reconciliation)

	# Salin bukti ke Stock Reconciliation supaya tetap terlihat di dokumen stok
	for f in frappe.get_all(
		"File",
		filters={
			"attached_to_doctype": "IMOGI POS Approval Request",
			"attached_to_name": doc.name,
		},
		fields=["name", "file_url", "file_name", "is_private"],
	):
		exists = frappe.db.exists(
			"File",
			{
				"file_url": f.file_url,
				"attached_to_doctype": "Stock Reconciliation",
				"attached_to_name": stock_reconciliation,
			},
		)
		if exists:
			continue
		frappe.get_doc(
			{
				"doctype": "File",
				"file_url": f.file_url,
				"file_name": f.file_name,
				"attached_to_doctype": "Stock Reconciliation",
				"attached_to_name": stock_reconciliation,
				"is_private": cint(f.is_private),
			}
		).insert(ignore_permissions=True)

	return stock_reconciliation


def _post_adjustment_from_approval(doc) -> str | None:
	"""Create & submit Stock Entry dari payload Adjustment (negatif) yang di-approve."""
	if doc.approval_type != "Adjustment":
		return None

	payload = {}
	if doc.payload_json:
		try:
			payload = frappe.parse_json(doc.payload_json) or {}
		except Exception:
			payload = {}

	item_code = (payload.get("item_code") or "").strip()
	qty = flt(payload.get("qty"))
	warehouse = payload.get("warehouse") or None
	reason = payload.get("reason") or doc.reason or None
	if not item_code or qty == 0:
		frappe.throw(_("Payload adjustment tidak valid"))

	from imogi_pos.imogi_pos.utils.inventory_hub import submit_stock_adjustment

	result = submit_stock_adjustment(item_code, qty, warehouse=warehouse, reason=reason)
	stock_entry = result["stock_entry"]
	doc.db_set("reference_name", stock_entry)
	return stock_entry


def _post_purchase_order_from_approval(doc) -> str | None:
	"""Submit the draft Purchase Order referenced by an approved request.

	Two-stage chain: if the request just approved was a tier-level approval
	(required_role set and below Owner), the PO is NOT submitted yet — instead
	a second, mandatory Owner approval request is opened. The PO only actually
	submits once a request with required_role == PO_FINAL_APPROVER_ROLE gets
	approved (or, per purchase_order_before_submit, when there is no tier at
	all and this was a plain PIN approval)."""
	if doc.approval_type != "Purchase Order":
		return None

	payload = {}
	if doc.payload_json:
		try:
			payload = frappe.parse_json(doc.payload_json) or {}
		except Exception:
			payload = {}

	po_name = (payload.get("purchase_order") or doc.reference_name or "").strip()
	if not po_name:
		frappe.throw(_("Payload Purchase Order tidak valid"))

	po = frappe.get_doc("Purchase Order", po_name)

	if doc.required_role and doc.required_role != PO_FINAL_APPROVER_ROLE:
		create_approval_request(
			approval_type="Purchase Order",
			reference_name=po.name,
			reason=_("Persetujuan akhir Owner untuk PO {0} - {1}").format(
				po.name, po.supplier_name or po.supplier
			),
			amount=flt(po.grand_total),
			payload={"purchase_order": po.name},
			required_role=PO_FINAL_APPROVER_ROLE,
		)
		return None

	if cint(po.docstatus) == 0:
		po.flags.imogi_approval_ok = True
		# Otorisasi approver sudah dicek di _assert_can_approve (role tier / PIN) —
		# approver gak harus punya permission "submit" Frappe standar di Purchase
		# Order (tugasnya cuma approve, bukan bikin PO), jadi bypass di sini.
		po.flags.ignore_permissions = True
		po.submit()
		po.db_set("imogi_approval_status", "")
	doc.db_set("reference_name", po.name)
	return po.name


def approve_request(request_name: str, pin: str | None = None) -> dict:
	doc = frappe.get_doc("IMOGI POS Approval Request", request_name)
	if doc.status != "Pending":
		frappe.throw(_("Permintaan approval sudah diproses"))

	_assert_can_approve(doc, pin)

	stock_entry = None
	if doc.approval_type in WASTE_APPROVAL_TYPES:
		stock_entry = _post_waste_from_approval(doc)
	elif doc.approval_type == "Opname":
		stock_entry = _post_opname_from_approval(doc)
	elif doc.approval_type == "Adjustment":
		stock_entry = _post_adjustment_from_approval(doc)
	elif doc.approval_type == "Purchase Order":
		stock_entry = _post_purchase_order_from_approval(doc)

	doc.db_set(
		{
			"status": "Approved",
			"approved_by": frappe.session.user,
			"approved_at": now_datetime(),
		}
	)
	out = {"name": doc.name, "status": "Approved", "approval_type": doc.approval_type}
	if stock_entry:
		out["stock_entry"] = stock_entry
		if doc.approval_type == "Opname":
			out["stock_reconciliation"] = stock_entry
		if doc.approval_type == "Purchase Order":
			out["purchase_order"] = stock_entry
	return out


def reject_request(request_name: str, pin: str | None = None, reason: str | None = None) -> dict:
	doc = frappe.get_doc("IMOGI POS Approval Request", request_name)
	if doc.status != "Pending":
		frappe.throw(_("Permintaan approval sudah diproses"))

	_assert_can_approve(doc, pin)

	note = (reason or "").strip()
	if note:
		existing = (doc.reason or "").strip()
		doc.db_set("reason", f"{existing}\n[Rejected] {note}".strip() if existing else f"[Rejected] {note}")

	doc.db_set(
		{
			"status": "Rejected",
			"approved_by": frappe.session.user,
			"approved_at": now_datetime(),
		}
	)

	if doc.approval_type == "Purchase Order" and doc.reference_name:
		frappe.db.set_value("Purchase Order", doc.reference_name, "imogi_approval_status", "Ditolak")

	return {"name": doc.name, "status": "Rejected", "approval_type": doc.approval_type}


def cancel_own_request(request_name: str) -> dict:
	"""Requester menarik lagi pengajuan approval mereka sendiri — beda dari
	reject_request (yang dilakukan approver): tidak butuh role/PIN approver,
	cukup jadi orang yang mengajukan (atau Administrator). Dokumen terkait
	(PO) balik jadi Draft biasa yang bisa diedit & disubmit ulang."""
	doc = frappe.get_doc("IMOGI POS Approval Request", request_name)
	if doc.status != "Pending":
		frappe.throw(_("Permintaan approval sudah diproses"))

	if frappe.session.user != doc.requested_by and frappe.session.user != "Administrator":
		frappe.throw(_("Cuma pemohon yang bisa membatalkan pengajuan ini"), frappe.PermissionError)

	doc.db_set(
		{
			"status": "Dibatalkan",
			"approved_by": frappe.session.user,
			"approved_at": now_datetime(),
		}
	)

	if doc.approval_type == "Purchase Order" and doc.reference_name:
		frappe.db.set_value("Purchase Order", doc.reference_name, "imogi_approval_status", "")

	return {"name": doc.name, "status": "Dibatalkan", "approval_type": doc.approval_type}


def require_supervisor_approval(
	approval_type: str,
	*,
	reference_name: str | None = None,
	reason: str | None = None,
	amount: float = 0,
	approval_code: str | None = None,
	payload: dict | None = None,
	required_role_override: str | None = None,
):
	"""Raise unless workflow disabled and approval_code is valid.
	Like Purchase Order / Stock Adjustment (see approval_hooks.py), this gate is
	controlled purely by the merchant's "Enable Approval Workflow" setting, not by
	subscription tier — fraud control (Discount/Void/Refund/Complimentary) needs to
	work regardless of plan, so there is deliberately no require_feature_operational()
	tier check here."""
	settings = get_settings()
	if not is_approval_enabled(settings):
		return

	if approval_code:
		doc = frappe.db.get_value(
			"IMOGI POS Approval Request",
			approval_code,
			["name", "status", "approval_type", "reference_name", "amount"],
			as_dict=True,
		)
		# A code only counts for the exact thing it was approved for — otherwise
		# one approved discount/void code could be replayed against any other
		# order or amount. reference_name covers Void/Refund/Complimentary
		# (tied to an existing order); amount covers Discount, which is
		# requested before the order even exists so there's no reference yet.
		matches_reference = not reference_name or (doc and doc.reference_name == reference_name)
		matches_amount = not amount or (doc and abs(flt(doc.amount) - flt(amount)) < 0.01)
		if (
			doc
			and doc.status == "Approved"
			and doc.approval_type == approval_type
			and matches_reference
			and matches_amount
		):
			return

	if required_role_override:
		required_role = required_role_override
	else:
		required_role = get_po_approver_role(amount, settings) if approval_type == "Purchase Order" else None

	def _block_message(code: str) -> str:
		if required_role:
			return _(
				"PO senilai <b>{0}</b> ini perlu di-approve oleh role <b>{1}</b> (sesuai Hirarki Approval PO) "
				"sebelum bisa lanjut. Kode permintaan: <b>{2}</b>. Buka IMOGI POS Approval Request dan klik "
				"Approve — PO akan otomatis ke-submit setelah disetujui."
			).format(frappe.utils.fmt_money(amount), required_role, code)
		return _(
			"Aksi ini memerlukan approval supervisor. Kode permintaan: <b>{0}</b>. "
			"Minta supervisor menyetujui di IMOGI POS Approval Request."
		).format(code)

	# Kalau sudah ada request Pending buat reference yang sama, pakai itu lagi —
	# tanpa ini, tiap kali user retry Submit (mis. sebelum sempat di-approve)
	# bakal numpuk request baru terus-terusan untuk dokumen yang sama.
	if reference_name:
		existing_pending = frappe.db.get_value(
			"IMOGI POS Approval Request",
			{"approval_type": approval_type, "reference_name": reference_name, "status": "Pending"},
			"name",
		)
		if existing_pending:
			frappe.throw(
				_block_message(existing_pending),
				title=_("Menunggu Approval: {0}").format(required_role) if required_role else _("Perlu Approval Supervisor"),
				exc=frappe.PermissionError,
			)

	request_name = create_approval_request(
		approval_type=approval_type,
		reference_name=reference_name,
		reason=reason,
		amount=amount,
		payload=payload,
		required_role=required_role,
	)
	# frappe.throw() below aborts this request, which makes Frappe roll back the
	# whole transaction — without an explicit commit here, the approval request
	# we just inserted would vanish along with it and the code would point at a
	# record that never actually existed.
	frappe.db.commit()
	frappe.throw(
		_block_message(request_name),
		title=_("Menunggu Approval: {0}").format(required_role) if required_role else _("Perlu Approval Supervisor"),
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


def po_requires_approval(grand_total: float, settings=None) -> bool:
	"""Kalau tabel Hirarki Approval PO terisi, approval selalu perlu ketika ada tier
	yang cocok (tier from_amount=0 yang menentukan apakah nominal kecil butuh approval
	atau tidak). Kalau tabel kosong, pakai mode lama: Odoo-style 'double validation' —
	below the configured threshold a PO auto-confirms; at/above it, approval is required.
	Threshold 0 means every PO needs approval whenever the workflow is enabled."""
	settings = settings or get_settings()
	if not is_approval_enabled(settings):
		return False

	if get_po_approver_role(grand_total, settings) is not None:
		return True
	if getattr(settings, "po_approval_tiers", None):
		# Tiers configured but none matched this amount (shouldn't happen given the
		# contiguous-coverage validation) — fail safe by requiring approval.
		return True

	threshold = flt(getattr(settings, "approval_po_threshold_amount", 0))
	if threshold > 0 and flt(grand_total) < threshold:
		return False
	return True


def cash_movement_requires_approval(amount: float, settings=None) -> bool:
	"""Odoo-style double validation, same as po_requires_approval: below the
	configured threshold a cash in/out auto-confirms; at/above it, PIN
	approval is required. Threshold 0 means every movement needs approval
	whenever the workflow is enabled."""
	settings = settings or get_settings()
	if not is_approval_enabled(settings):
		return False
	threshold = flt(getattr(settings, "approval_cash_movement_threshold_amount", 0))
	if threshold > 0 and flt(amount) < threshold:
		return False
	return True


@frappe.whitelist()
def verify_supervisor_pin(pin: str):
	frappe.only_for(("System Manager", "Sales Manager", "IMOGI Cashier", "Sales User"))
	if _verify_pin(pin):
		return {"valid": True}
	frappe.throw(_("PIN supervisor tidak valid"))
