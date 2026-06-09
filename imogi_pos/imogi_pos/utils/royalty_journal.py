# Copyright (c) 2026, Imogi and contributors
"""Post franchise royalty accruals to ERPNext Journal Entry."""

import frappe
from frappe import _
from frappe.utils import flt, getdate

from imogi_pos.imogi_pos.utils.flow import get_settings, resolve_company


def get_royalty_accounts(settings=None, company=None):
	settings = settings or get_settings()
	company = resolve_company(company, settings)
	expense = settings.royalty_expense_account
	payable = settings.royalty_payable_account
	if not expense or not payable:
		frappe.throw(
			_("Set Royalty Expense Account and Royalty Payable Account in IMOGI POS Settings")
		)
	return {"expense_account": expense, "payable_account": payable, "company": company}


def post_royalty_accrual(accrual_name):
	accrual = frappe.get_doc("IMOGI POS Royalty Accrual", accrual_name)
	if accrual.status == "Posted":
		frappe.throw(_("Royalty accrual {0} already posted").format(accrual.name))
	if flt(accrual.royalty_amount) <= 0:
		frappe.throw(_("Royalty amount must be greater than zero"))

	accounts = get_royalty_accounts(company=accrual.company)
	if accrual.journal_entry and frappe.db.exists("Journal Entry", accrual.journal_entry):
		accrual.db_set("status", "Posted")
		return accrual.journal_entry

	je = frappe.new_doc("Journal Entry")
	je.voucher_type = "Journal Entry"
	je.company = accrual.company
	je.posting_date = getdate(accrual.period_end)
	je.user_remark = _("IMOGI POS royalty {0} ({1})").format(accrual.branch_code, accrual.name)

	je.append(
		"accounts",
		{
			"account": accounts["expense_account"],
			"debit_in_account_currency": flt(accrual.royalty_amount),
			"credit_in_account_currency": 0,
		},
	)

	payable_row = {
		"account": accounts["payable_account"],
		"debit_in_account_currency": 0,
		"credit_in_account_currency": flt(accrual.royalty_amount),
	}
	party_type = None
	party = None
	if accrual.franchisee:
		party_type = "Customer"
		party = accrual.franchisee
	elif frappe.get_cached_value("Account", accounts["payable_account"], "account_type") == "Payable":
		party = frappe.db.get_value("Supplier", {"disabled": 0}, "name")
		if party:
			party_type = "Supplier"
	if party_type and party:
		payable_row["party_type"] = party_type
		payable_row["party"] = party

	je.append("accounts", payable_row)
	je.insert(ignore_permissions=True)
	je.submit()

	accrual.db_set({"journal_entry": je.name, "status": "Posted"})
	frappe.db.commit()
	return je.name


def post_draft_accruals(company=None):
	company = resolve_company(company)
	names = frappe.get_all(
		"IMOGI POS Royalty Accrual",
		filters={"company": company, "status": "Draft"},
		pluck="name",
	)
	posted = []
	errors = 0
	for name in names:
		try:
			posted.append(post_royalty_accrual(name))
		except Exception:
			errors += 1
			frappe.log_error(title=_("Royalty journal failed for {0}").format(name))
	return {"posted": posted, "failed": errors, "total": len(names)}
