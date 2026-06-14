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

	closing_name = doc.pos_closing_entry or frappe.db.get_value(
		"IMOGI POS Shift Closing", doc.name, "pos_closing_entry"
	)
	if closing_name:
		_ensure_opening_closed_after_closing(doc.pos_opening_entry, closing_name)
		frappe.db.commit()

	from imogi_pos.boot import get_cashier_landing

	return {
		"name": doc.name,
		"pos_closing_entry": doc.pos_closing_entry,
		"landing": get_cashier_landing(user=user or frappe.session.user),
	}


def _extract_closing_failure_message():
	"""ERPNext rolls back the closing doc then may raise a misleading LinkValidationError."""
	if frappe.message_log:
		parts = []
		for entry in frappe.message_log:
			if isinstance(entry, dict):
				message = entry.get("message") or str(entry)
			else:
				message = str(entry)
			if "Reference Name" in message or "Could not find" in message:
				continue
			parts.append(message)
		if parts:
			return "<br>".join(parts)

	return _(
		"Gagal konsolidasi POS Invoice saat tutup shift. "
		"Periksa stok item retail, atau pastikan item menu dengan BOM sudah benar."
	)


def get_latest_closing_failure_message(closing):
	"""Return a user-facing message for a failed POS Closing Entry."""
	if isinstance(closing, str):
		closing = frappe.db.get_value(
			"POS Closing Entry",
			closing,
			["name", "status", "error_message"],
			as_dict=True,
		)
	if not closing:
		return None

	message = (closing.error_message or "").strip()
	if message:
		return message

	if closing.status == "Failed":
		return _(
			"Gagal konsolidasi POS Invoice saat tutup shift. "
			"Periksa konfigurasi Mode of Payment (QRIS harus ke akun Bank/Kas, bukan Piutang)."
		)

	return None


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

	from imogi_pos.imogi_pos.utils.pos_consolidation import repair_mode_of_payment_accounts

	repair_mode_of_payment_accounts(opening.company)

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
	except (frappe.LinkValidationError, frappe.PermissionError):
		frappe.throw(_extract_closing_failure_message(), title=_("Gagal Tutup Shift"))
	except frappe.ValidationError as exc:
		if "Reference Name" in str(exc):
			frappe.throw(_extract_closing_failure_message(), title=_("Gagal Tutup Shift"))
		raise
	finally:
		frappe.flags.ignore_permissions = prev_ignore_permissions

	return closing.name


def on_pos_closing_entry_after_submit(doc, method=None):
	"""Wait for invoice merge after POS Closing Entry is committed."""
	if not doc.pos_opening_entry:
		return

	opening_name = doc.pos_opening_entry
	closing_name = doc.name
	frappe.db.after_commit.add(
		lambda: _ensure_opening_closed_after_closing(opening_name, closing_name)
	)


def repair_pos_invoice_order_links(pos_invoices):
	"""Drop stale Riwayat Order links so shift closing consolidation can save invoices."""
	invoice_names = []
	for row in pos_invoices or []:
		if isinstance(row, str):
			invoice_name = row
		elif isinstance(row, dict):
			invoice_name = row.get("pos_invoice")
		else:
			invoice_name = getattr(row, "pos_invoice", None)
		if invoice_name:
			invoice_names.append(invoice_name)

	if not invoice_names:
		return []

	stale = frappe.db.sql(
		"""
		SELECT pi.name
		FROM `tabPOS Invoice` pi
		LEFT JOIN `tabRiwayat Order` ro ON ro.name = pi.imogi_pos_order
		WHERE pi.name IN %(names)s
			AND IFNULL(pi.imogi_pos_order, '') != ''
			AND ro.name IS NULL
		""",
		{"names": invoice_names},
		as_dict=True,
	)
	for row in stale:
		frappe.db.set_value(
			"POS Invoice",
			row.name,
			"imogi_pos_order",
			None,
			update_modified=False,
		)
	return [row.name for row in stale]


def _ensure_opening_closed_after_closing(opening_name, closing_name):
	"""POS Closing Entry may queue invoice merge; opening stays open until merge finishes."""
	import time

	from erpnext.accounts.doctype.pos_invoice_merge_log.pos_invoice_merge_log import (
		create_merge_logs,
		get_invoice_customer_map,
	)

	opening = frappe.get_doc("POS Opening Entry", opening_name)
	if opening.pos_closing_entry:
		return opening.pos_closing_entry

	closing = frappe.get_doc("POS Closing Entry", closing_name)
	closing.reload()

	if closing.status == "Failed":
		from imogi_pos.imogi_pos.utils.pos_consolidation import repair_mode_of_payment_accounts

		repair_mode_of_payment_accounts(opening.company)
		frappe.db.set_value(
			"POS Closing Entry",
			closing_name,
			{"status": "Queued", "error_message": ""},
			update_modified=False,
		)
		closing.reload()

	merge_started = frappe.db.exists(
		"POS Invoice Merge Log",
		{"pos_closing_entry": closing_name},
	)

	if closing.status == "Queued" and not merge_started:
		repair_pos_invoice_order_links(closing.pos_transactions or [])
		invoice_by_customer = get_invoice_customer_map(closing.pos_transactions or [])
		create_merge_logs(invoice_by_customer, closing_entry=closing)
	elif closing.docstatus == 1:
		closing.reload()
		if closing.status == "Submitted":
			closing.update_opening_entry()
		elif closing.status == "Queued" and merge_started:
			# Background merge may have finished without linking opening.
			if frappe.db.exists(
				"POS Invoice Merge Log",
				{"pos_closing_entry": closing_name, "docstatus": 1},
			):
				closing.reload()
				if closing.status == "Submitted":
					closing.update_opening_entry()

	opening.reload()
	if opening.pos_closing_entry:
		return opening.pos_closing_entry

	for attempt in range(120):
		time.sleep(0.5)
		frappe.db.commit()
		opening.reload()
		if opening.pos_closing_entry:
			return opening.pos_closing_entry
		closing.reload()
		if closing.status == "Failed":
			error = get_latest_closing_failure_message(closing) or _(
				"Konsolidasi POS Invoice gagal saat tutup shift."
			)
			frappe.throw(error, title=_("Gagal Tutup Shift"))

	frappe.throw(
		_("Gagal menutup shift kasir. POS Opening Entry {0} masih terbuka.").format(
			frappe.bold(opening_name)
		),
		title=_("Gagal Tutup Shift"),
	)


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
