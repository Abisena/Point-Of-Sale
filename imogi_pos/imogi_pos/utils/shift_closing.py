# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import flt, get_datetime, now_datetime

from imogi_pos.imogi_pos.utils.shift_opening import get_cash_payment_mode


def _payment_label(mode_of_payment):
	name = (mode_of_payment or "").lower()
	if "cash" in name:
		return _("Tunai")
	if "card" in name or "credit" in name or "debit" in name:
		return _("Kartu Debit/Kredit")
	if "wallet" in name or "qris" in name or "ewallet" in name:
		return _("E-Wallet")
	return mode_of_payment


def _get_open_pos_opening(user=None, pos_opening_entry=None):
	user = user or frappe.session.user
	if pos_opening_entry:
		opening = frappe.get_doc("POS Opening Entry", pos_opening_entry)
		if opening.docstatus != 1 or opening.pos_closing_entry:
			frappe.throw(_("Shift tidak ditemukan atau sudah ditutup."))
		if opening.user != user and opening.owner != user:
			frappe.throw(_("Not permitted"), frappe.PermissionError)
		return opening

	from erpnext.selling.page.point_of_sale.point_of_sale import check_opening_entry

	entries = check_opening_entry(user) or []
	if not entries:
		return None
	return frappe.get_doc("POS Opening Entry", entries[0].name)


def build_closing_summary(opening):
	from erpnext.accounts.doctype.pos_closing_entry.pos_closing_entry import make_closing_entry_from_opening

	closing = make_closing_entry_from_opening(opening)
	cash_mode = get_cash_payment_mode(opening.company)
	cash_row = next(
		(row for row in closing.payment_reconciliation if row.mode_of_payment == cash_mode),
		None,
	)

	opening_cash = flt(cash_row.opening_amount) if cash_row else 0
	expected_cash = flt(cash_row.expected_amount) if cash_row else 0
	cash_sales = expected_cash - opening_cash

	payment_breakdown = []
	for row in closing.payment_reconciliation:
		sales_amount = flt(row.expected_amount) - flt(row.opening_amount)
		if sales_amount <= 0 and row.mode_of_payment != cash_mode:
			continue
		payment_breakdown.append(
			{
				"mode_of_payment": row.mode_of_payment,
				"label": _payment_label(row.mode_of_payment),
				"sales_amount": sales_amount if row.mode_of_payment != cash_mode else cash_sales,
				"expected_amount": flt(row.expected_amount),
			}
		)

	return {
		"pos_opening_entry": opening.name,
		"company": opening.company,
		"pos_profile": opening.pos_profile,
		"period_start_date": opening.period_start_date,
		"period_end_date": now_datetime(),
		"cash_mode": cash_mode,
		"total_transactions": len(closing.pos_transactions),
		"total_sales": flt(closing.grand_total),
		"opening_cash": opening_cash,
		"cash_sales": cash_sales,
		"expected_cash": expected_cash,
		"payment_breakdown": payment_breakdown,
	}


def get_pending_shift_closing(user=None, pos_opening_entry=None):
	user = user or frappe.session.user
	filters = {"owner": user, "docstatus": 0}
	if pos_opening_entry:
		filters["pos_opening_entry"] = pos_opening_entry
	return frappe.db.get_value(
		"IMOGI POS Shift Closing",
		filters,
		"name",
		order_by="creation desc",
	)


def get_shift_closing_page_context(user=None, pos_opening_entry=None):
	user = user or frappe.session.user
	opening = _get_open_pos_opening(user, pos_opening_entry)
	if not opening:
		return {"no_open_shift": True}

	summary = build_closing_summary(opening)
	pending = get_pending_shift_closing(user, opening.name)

	context = {
		**summary,
		"user": user,
		"user_fullname": frappe.db.get_value("User", user, "full_name") or user,
		"draft_name": pending,
		"expenses": 0,
		"actual_cash": 0,
		"remarks": "",
	}

	if pending:
		doc = frappe.get_doc("IMOGI POS Shift Closing", pending)
		context["expenses"] = flt(doc.expenses)
		context["actual_cash"] = flt(doc.actual_cash)
		context["remarks"] = getattr(doc, "remarks", None) or ""

	return context


def _build_shift_closing_doc(data, draft_name=None, user=None):
	user = user or frappe.session.user
	opening_name = data.get("pos_opening_entry")
	opening = _get_open_pos_opening(user, opening_name)
	summary = build_closing_summary(opening)

	if draft_name:
		doc = frappe.get_doc("IMOGI POS Shift Closing", draft_name)
		if doc.docstatus != 0:
			frappe.throw(_("Draft tutup shift sudah diproses."))
		if doc.pos_opening_entry != opening.name:
			frappe.throw(_("Draft tidak sesuai dengan shift terbuka."))
	else:
		doc = frappe.new_doc("IMOGI POS Shift Closing")

	doc.company = summary["company"]
	doc.pos_profile = summary["pos_profile"]
	doc.user = user
	doc.pos_opening_entry = opening.name
	doc.total_transactions = summary["total_transactions"]
	doc.total_sales = summary["total_sales"]
	doc.opening_cash = summary["opening_cash"]
	doc.cash_sales = summary["cash_sales"]
	doc.expenses = flt(data.get("expenses"))
	doc.actual_cash = flt(data.get("actual_cash"))
	doc.remarks = data.get("remarks") or ""
	doc.recalculate_cash_fields()

	return doc


def save_shift_closing_draft(pos_opening_entry, actual_cash=0, expenses=0, remarks=None, draft_name=None, user=None):
	doc = _build_shift_closing_doc(
		{
			"pos_opening_entry": pos_opening_entry,
			"actual_cash": actual_cash,
			"expenses": expenses,
			"remarks": remarks,
		},
		draft_name=draft_name,
		user=user,
	)
	doc.save()
	frappe.db.commit()
	return {"name": doc.name}


def create_and_submit_shift_closing(
	pos_opening_entry, actual_cash=0, expenses=0, remarks=None, draft_name=None, user=None
):
	doc = _build_shift_closing_doc(
		{
			"pos_opening_entry": pos_opening_entry,
			"actual_cash": actual_cash,
			"expenses": expenses,
			"remarks": remarks,
		},
		draft_name=draft_name,
		user=user,
	)
	doc.save()
	doc.submit()
	frappe.db.commit()
	return {"name": doc.name, "pos_closing_entry": doc.pos_closing_entry}


def _extract_closing_failure_message():
	"""ERPNext rolls back the closing doc then may raise a misleading LinkValidationError."""
	if frappe.message_log:
		parts = []
		for entry in frappe.message_log:
			if isinstance(entry, dict):
				message = entry.get("message") or str(entry)
			else:
				message = str(entry)
			if "Reference Name" in message:
				continue
			parts.append(message)
		if parts:
			return "<br>".join(parts)

	return _(
		"Gagal konsolidasi POS Invoice saat tutup shift. "
		"Periksa stok item retail, atau pastikan item menu dengan BOM sudah benar."
	)


def _resolve_shift_cashier_user(doc, opening):
	user = doc.user or opening.user or opening.owner
	if not user or user == "Guest":
		frappe.throw(_("Kasir tidak valid. Silakan login ulang."), frappe.AuthenticationError)
	return user


def sync_to_pos_closing_entry(doc):
	if doc.pos_closing_entry:
		return doc.pos_closing_entry

	from erpnext.accounts.doctype.pos_closing_entry.pos_closing_entry import make_closing_entry_from_opening

	opening = frappe.get_doc("POS Opening Entry", doc.pos_opening_entry)
	cashier_user = _resolve_shift_cashier_user(doc, opening)
	if not opening.user:
		opening.db_set("user", cashier_user, update_modified=False)
		opening.user = cashier_user

	closing = make_closing_entry_from_opening(opening)
	if not closing.user:
		closing.user = cashier_user

	cash_mode = get_cash_payment_mode(doc.company)
	expenses = flt(doc.expenses)
	actual_cash = flt(doc.actual_cash)

	for row in closing.payment_reconciliation:
		if row.mode_of_payment == cash_mode:
			row.expected_amount = flt(row.expected_amount) - expenses
			row.closing_amount = actual_cash
			row.difference = flt(row.closing_amount) - flt(row.expected_amount)
		else:
			row.closing_amount = flt(row.expected_amount)
			row.difference = 0

	closing.insert(ignore_permissions=True)

	prev_ignore_permissions = frappe.flags.ignore_permissions
	closing.flags.ignore_permissions = True
	frappe.flags.ignore_permissions = True
	try:
		closing.submit()
	except frappe.LinkValidationError:
		frappe.throw(_extract_closing_failure_message(), title=_("Gagal Tutup Shift"))
	except frappe.ValidationError as exc:
		if "Reference Name" in str(exc):
			frappe.throw(_extract_closing_failure_message(), title=_("Gagal Tutup Shift"))
		raise
	finally:
		frappe.flags.ignore_permissions = prev_ignore_permissions

	return closing.name


def validate_shift_closing(doc):
	if not doc.pos_opening_entry:
		frappe.throw(_("POS Opening Entry wajib diisi."))

	opening = frappe.get_doc("POS Opening Entry", doc.pos_opening_entry)
	if opening.pos_closing_entry:
		frappe.throw(_("Shift sudah ditutup."))

	if flt(doc.actual_cash) < 0:
		frappe.throw(_("Kas aktual tidak boleh negatif."))

	if flt(doc.expenses) < 0:
		frappe.throw(_("Pengeluaran tidak boleh negatif."))
