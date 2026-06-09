# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import get_first_day, get_last_day, today

from imogi_pos.api.cashier import _require_cashier_access
from imogi_pos.imogi_pos.utils.flow import resolve_company
from imogi_pos.imogi_pos.utils.franchise import generate_royalty_accruals, get_franchise_sales_summary


@frappe.whitelist()
def get_franchise_summary(company=None, from_date=None, to_date=None):
	frappe.only_for(("System Manager", "Sales Manager", "Administrator"))
	company = resolve_company(company)
	return get_franchise_sales_summary(company=company, from_date=from_date, to_date=to_date)


@frappe.whitelist()
def generate_monthly_royalty(company=None, from_date=None, to_date=None):
	frappe.only_for(("System Manager", "Sales Manager", "Administrator"))
	company = resolve_company(company)
	from_date = from_date or get_first_day(today())
	to_date = to_date or get_last_day(from_date)
	return generate_royalty_accruals(company=company, from_date=from_date, to_date=to_date)


@frappe.whitelist()
def post_monthly_royalty_journals(company=None):
	frappe.only_for(("System Manager", "Sales Manager", "Administrator"))
	from imogi_pos.imogi_pos.utils.franchise import post_royalty_journals

	return post_royalty_journals(company=resolve_company(company))


@frappe.whitelist()
def get_active_branch_franchise(branch=None, pos_profile=None):
	_require_cashier_access()
	from imogi_pos.imogi_pos.utils.branch import resolve_active_branch
	from imogi_pos.imogi_pos.utils.franchise import get_branch_franchise_meta

	ctx = resolve_active_branch(branch_code=branch, pos_profile=pos_profile)
	meta = get_branch_franchise_meta(branch_code=ctx.get("branch_code"), pos_profile=ctx.get("pos_profile"))
	return meta or {"branch_model": "Owned"}
