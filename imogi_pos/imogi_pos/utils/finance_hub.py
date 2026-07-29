# Copyright (c) 2026, Imogi and contributors
"""Finance Hub: kas/bank, hutang, piutang, pintasan P&L & arus kas."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, flt, add_days, getdate, today, get_first_day, get_last_day

from imogi_pos.imogi_pos.utils.flow import get_settings


def _settings():
	return get_settings()


def _company() -> str | None:
	return _settings().default_company


def _require_finance_read():
	if frappe.session.user == "Guest":
		frappe.throw(_("Not permitted"), frappe.PermissionError)
	if not (
		frappe.has_permission("Payment Entry", "read")
		or frappe.has_permission("Purchase Invoice", "read")
		or frappe.has_permission("Sales Invoice", "read")
		or frappe.has_permission("Account", "read")
	):
		frappe.throw(_("Tidak punya akses keuangan"), frappe.PermissionError)


def _money_sum(doctype: str, field: str, filters: dict) -> float:
	rows = frappe.get_all(doctype, filters=filters, fields=[f"sum(`{field}`) as total"], limit=1)
	return flt(rows[0].total) if rows else 0.0


def get_finance_summary() -> dict:
	_require_finance_read()
	company = _company()
	filters_company = {"company": company} if company else {}

	payable = _money_sum(
		"Purchase Invoice",
		"outstanding_amount",
		{**filters_company, "docstatus": 1, "outstanding_amount": [">", 0]},
	)
	receivable = _money_sum(
		"Sales Invoice",
		"outstanding_amount",
		{**filters_company, "docstatus": 1, "outstanding_amount": [">", 0]},
	)
	payments_30d = frappe.db.count(
		"Payment Entry",
		{
			**filters_company,
			"docstatus": 1,
			"posting_date": [">=", add_days(getdate(today()), -30)],
		},
	)

	cash_balance = 0.0
	try:
		from erpnext.accounts.utils import get_balance_on

		accounts = frappe.get_all(
			"Account",
			filters={
				**({"company": company} if company else {}),
				"is_group": 0,
				"account_type": ["in", ["Bank", "Cash"]],
				"disabled": 0,
			},
			fields=["name"],
			limit_page_length=50,
		)
		for acc in accounts:
			cash_balance += flt(get_balance_on(account=acc.name, date=today(), company=company))
	except Exception:
		cash_balance = 0.0

	return {
		"cash_balance": cash_balance,
		"payable": payable,
		"receivable": receivable,
		"payments_30d": payments_30d,
		"company": company,
		"period_start": str(get_first_day(today())),
		"period_end": str(get_last_day(today())),
	}


def list_cash_bank(search: str | None = None, limit: int = 50) -> dict:
	_require_finance_read()
	company = _company()
	accounts = []
	try:
		from erpnext.accounts.utils import get_balance_on

		acc_filters: dict = {
			"is_group": 0,
			"account_type": ["in", ["Bank", "Cash"]],
			"disabled": 0,
		}
		if company:
			acc_filters["company"] = company
		for acc in frappe.get_all(
			"Account",
			filters=acc_filters,
			fields=["name", "account_name", "account_type", "account_currency"],
			order_by="account_type asc, name asc",
			limit_page_length=cint(limit) or 50,
		):
			if search and search.strip().lower() not in f"{acc.name} {acc.account_name}".lower():
				continue
			accounts.append(
				{
					**acc,
					"balance": flt(get_balance_on(account=acc.name, date=today(), company=company)),
				}
			)
	except Exception as e:
		frappe.log_error(title="Finance Hub cash accounts", message=str(e))

	pe_filters: dict = {}
	if company:
		pe_filters["company"] = company
	or_filters = None
	if search:
		term = f"%{search.strip()}%"
		or_filters = [
			["name", "like", term],
			["party", "like", term],
			["party_name", "like", term],
			["mode_of_payment", "like", term],
		]
	payments = frappe.get_all(
		"Payment Entry",
		filters=pe_filters,
		or_filters=or_filters,
		fields=[
			"name",
			"posting_date",
			"payment_type",
			"party_type",
			"party",
			"party_name",
			"mode_of_payment",
			"paid_amount",
			"received_amount",
			"status",
			"docstatus",
		],
		order_by="posting_date desc, modified desc",
		limit_page_length=cint(limit) or 50,
	)
	return {"accounts": accounts, "rows": payments, "count": len(payments)}


def list_payables(search: str | None = None, limit: int = 50) -> dict:
	_require_finance_read()
	company = _company()
	filters: dict = {"docstatus": 1, "outstanding_amount": [">", 0]}
	if company:
		filters["company"] = company
	or_filters = None
	if search:
		term = f"%{search.strip()}%"
		or_filters = [["name", "like", term], ["supplier", "like", term], ["supplier_name", "like", term]]
	rows = frappe.get_all(
		"Purchase Invoice",
		filters=filters,
		or_filters=or_filters,
		fields=[
			"name",
			"supplier",
			"supplier_name",
			"posting_date",
			"due_date",
			"grand_total",
			"outstanding_amount",
			"status",
			"currency",
			"docstatus",
		],
		order_by="due_date asc, posting_date desc",
		limit_page_length=cint(limit) or 50,
	)
	total_outstanding = sum(flt(r.outstanding_amount) for r in rows)
	return {"rows": rows, "count": len(rows), "total_outstanding": total_outstanding}


def list_receivables(search: str | None = None, limit: int = 50) -> dict:
	_require_finance_read()
	company = _company()
	filters: dict = {"docstatus": 1, "outstanding_amount": [">", 0]}
	if company:
		filters["company"] = company
	or_filters = None
	if search:
		term = f"%{search.strip()}%"
		or_filters = [["name", "like", term], ["customer", "like", term], ["customer_name", "like", term]]
	rows = frappe.get_all(
		"Sales Invoice",
		filters=filters,
		or_filters=or_filters,
		fields=[
			"name",
			"customer",
			"customer_name",
			"posting_date",
			"due_date",
			"grand_total",
			"outstanding_amount",
			"status",
			"currency",
			"docstatus",
		],
		order_by="due_date asc, posting_date desc",
		limit_page_length=cint(limit) or 50,
	)
	total_outstanding = sum(flt(r.outstanding_amount) for r in rows)
	return {"rows": rows, "count": len(rows), "total_outstanding": total_outstanding}


def get_report_links() -> dict:
	_require_finance_read()
	company = _company()
	period_start = str(get_first_day(today()))
	period_end = str(get_last_day(today()))
	return {
		"company": company,
		"period_start": period_start,
		"period_end": period_end,
		"profit_loss": {
			"report": "Profit and Loss Statement",
			"route": ["query-report", "Profit and Loss Statement"],
			"filters": {
				"company": company,
				"from_date": period_start,
				"to_date": period_end,
				"periodicity": "Monthly",
			},
		},
		"cash_flow": {
			"report": "Cash Flow",
			"route": ["query-report", "Cash Flow"],
			"filters": {
				"company": company,
				"from_date": period_start,
				"to_date": period_end,
			},
		},
	}


def list_bank_statement_imports(limit: int = 20) -> list:
	_require_finance_read()
	return frappe.get_all(
		"IMOGI Bank Statement Import",
		fields=[
			"name",
			"bank_account",
			"uploaded_on",
			"transaction_date_from",
			"transaction_date_to",
			"status",
			"created_count",
			"skipped_count",
			"error_count",
		],
		order_by="uploaded_on desc",
		limit_page_length=cint(limit) or 20,
	)


def get_bank_transaction_tree(company: str | None = None) -> dict:
	_require_finance_read()
	filters: dict = {}
	if company:
		filters["company"] = company

	rows = frappe.get_all(
		"Bank Transaction",
		filters=filters,
		fields=["bank_account", "date", "deposit", "withdrawal"],
		order_by="date desc",
		limit_page_length=5000,
	)

	tree: dict = {}
	for row in rows:
		if not row.date or not row.bank_account:
			continue
		bank_node = tree.setdefault(
			row.bank_account, {"count": 0, "deposit": 0.0, "withdrawal": 0.0, "years": {}}
		)
		year_node = bank_node["years"].setdefault(
			row.date.year, {"count": 0, "deposit": 0.0, "withdrawal": 0.0, "months": {}}
		)
		month_node = year_node["months"].setdefault(
			row.date.month, {"count": 0, "deposit": 0.0, "withdrawal": 0.0, "days": {}}
		)
		day_node = month_node["days"].setdefault(
			row.date.day, {"count": 0, "deposit": 0.0, "withdrawal": 0.0}
		)
		for node in (bank_node, year_node, month_node, day_node):
			node["count"] += 1
			node["deposit"] += flt(row.deposit)
			node["withdrawal"] += flt(row.withdrawal)

	return tree


def get_finance_hub(tab: str | None = None, search: str | None = None) -> dict:
	tab = (tab or "cash").strip().lower()
	summary = get_finance_summary()
	payload: dict = {"tab": tab, "summary": summary}
	if tab in ("cash", "cash_bank", "kas"):
		payload.update(list_cash_bank(search=search))
	elif tab in ("payables", "payable", "hutang"):
		payload.update(list_payables(search=search))
	elif tab in ("receivables", "receivable", "piutang"):
		payload.update(list_receivables(search=search))
	else:
		payload.update(get_report_links())
	return payload
