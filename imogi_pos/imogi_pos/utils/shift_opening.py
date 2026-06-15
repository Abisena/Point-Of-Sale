# Copyright (c) 2026, Imogi and contributors

import json

import frappe
from frappe import _
from frappe.utils import cint, flt

from imogi_pos.imogi_pos.utils.flow import get_settings


def get_opening_payment_modes(company=None):
	return frappe.get_all(
		"Mode of Payment",
		filters={"enabled": 1},
		pluck="name",
		order_by="name asc",
	)


def get_cash_payment_mode(company=None):
	modes = get_opening_payment_modes(company)
	for mode in modes:
		if mode.lower() == "cash":
			return mode
	for mode in modes:
		if "cash" in mode.lower():
			return mode
	frappe.throw(_("Mode of Payment Cash tidak ditemukan. Aktifkan metode Cash di ERPNext."))


def get_shift_opening_defaults(pos_profile=None, company=None):
	settings = get_settings()
	from imogi_pos.imogi_pos.utils.branch import resolve_active_branch

	branch_ctx = resolve_active_branch(pos_profile=pos_profile)
	company = company or branch_ctx["company"]
	pos_profile = branch_ctx["pos_profile"]
	cash_mode = get_cash_payment_mode(company)
	return {
		"company": company,
		"pos_profile": pos_profile,
		"warehouse": branch_ctx.get("warehouse"),
		"cash_mode": cash_mode,
		"payments": [{"mode_of_payment": cash_mode, "opening_amount": 0}],
	}


def get_pending_shift_opening(user=None):
	user = user or frappe.session.user
	return frappe.db.get_value(
		"IMOGI POS Shift Opening",
		{"owner": user, "docstatus": 0},
		"name",
		order_by="creation desc",
	)


def get_shift_opening_page_context(user=None, pos_profile=None):
	user = user or frappe.session.user
	defaults = get_shift_opening_defaults(pos_profile=pos_profile)
	settings = get_settings()
	return {
		"company": defaults["company"],
		"pos_profile": defaults["pos_profile"],
		"cash_mode": defaults["cash_mode"],
		"user": user,
		"user_fullname": frappe.db.get_value("User", user, "full_name") or user,
		"remarks": "",
		"payments": defaults["payments"],
		"enable_shift_cash_detail": cint(getattr(settings, "enable_shift_cash_detail", 0)),
	}


def _build_shift_opening_doc(payments, draft_name=None, remarks=None, user=None, pos_profile=None, company=None):
	user = user or frappe.session.user
	if isinstance(payments, str):
		payments = json.loads(payments)

	from imogi_pos.imogi_pos.utils.branch import resolve_active_branch

	branch_ctx = resolve_active_branch(pos_profile=pos_profile)
	company = company or branch_ctx["company"]
	pos_profile = branch_ctx["pos_profile"]

	if draft_name:
		doc = frappe.get_doc("IMOGI POS Shift Opening", draft_name)
		if doc.docstatus != 0:
			frappe.throw(_("Draft buka shift sudah diproses."))
		if doc.user != user and doc.owner != user:
			frappe.throw(_("Not permitted"), frappe.PermissionError)
	else:
		doc = frappe.new_doc("IMOGI POS Shift Opening")
		doc.company = company
		doc.pos_profile = pos_profile

	cash_mode = get_cash_payment_mode(company)
	cash_amount = 0
	for row in payments or []:
		if row.get("mode_of_payment") == cash_mode:
			cash_amount = flt(row.get("opening_amount"))
			break

	doc.payments = []
	doc.append(
		"payments",
		{
			"mode_of_payment": cash_mode,
			"opening_amount": cash_amount,
		},
	)

	if remarks is not None:
		doc.remarks = remarks

	return doc


def create_and_submit_shift_opening(payments, remarks=None, user=None, pos_profile=None, company=None):
	user = user or frappe.session.user
	doc = _build_shift_opening_doc(
		payments,
		draft_name=get_pending_shift_opening(user),
		remarks=remarks,
		user=user,
		pos_profile=pos_profile,
		company=company,
	)
	doc.submit()
	frappe.db.commit()

	return {
		"name": doc.name,
		"pos_opening_entry": doc.pos_opening_entry,
	}


def sync_to_pos_opening_entry(doc):
	"""Create and submit native ERPNext POS Opening Entry."""
	if doc.pos_opening_entry:
		return doc.pos_opening_entry

	user = doc.user or frappe.session.user
	if not user or user == "Guest":
		frappe.throw(_("Login required"), frappe.AuthenticationError)

	balance_details = [
		{
			"mode_of_payment": row.mode_of_payment,
			"opening_amount": flt(row.opening_amount),
		}
		for row in doc.payments
		if row.mode_of_payment
	]

	new_pos_opening = frappe.get_doc(
		{
			"doctype": "POS Opening Entry",
			"period_start_date": frappe.utils.get_datetime(),
			"posting_date": frappe.utils.getdate(),
			"user": user,
			"pos_profile": doc.pos_profile,
			"company": doc.company,
		}
	)
	new_pos_opening.set("balance_details", balance_details)
	new_pos_opening.flags.ignore_permissions = True
	new_pos_opening.submit()
	return new_pos_opening.name


def validate_shift_opening(doc):
	if not doc.payments:
		frappe.throw(_("Tambahkan minimal satu metode pembayaran."))

	has_amount = any(flt(row.opening_amount) > 0 for row in doc.payments)
	if not has_amount:
		frappe.throw(_("Isi Opening Amount minimal pada satu metode pembayaran (mis. Cash)."))

	user = doc.user or frappe.session.user
	if frappe.db.exists(
		"POS Opening Entry",
		{"user": user, "pos_closing_entry": ["in", ["", None]], "docstatus": 1},
	):
		frappe.throw(_("Shift kasir sudah dibuka."))
