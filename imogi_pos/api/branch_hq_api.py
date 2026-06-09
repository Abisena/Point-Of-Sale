# Copyright (c) 2026, Imogi and contributors

import json

import frappe

from imogi_pos.imogi_pos.utils.branch_hq import (
	ensure_all_branches_have_price_lists,
	get_hq_operations_context,
	push_master_prices_to_branches,
	push_menu_template_to_branches,
)


@frappe.whitelist()
def get_hq_dashboard(company=None):
	return get_hq_operations_context(company=company)


@frappe.whitelist()
def hq_push_prices(company=None, branch_codes=None):
	if isinstance(branch_codes, str):
		try:
			branch_codes = json.loads(branch_codes)
		except Exception:
			branch_codes = [c.strip() for c in branch_codes.split(",") if c.strip()]
	return push_master_prices_to_branches(company=company, branch_codes=branch_codes)


@frappe.whitelist()
def hq_push_menu_template(source_branch_code, target_branch_codes=None, company=None):
	if isinstance(target_branch_codes, str):
		try:
			target_branch_codes = json.loads(target_branch_codes)
		except Exception:
			target_branch_codes = None
	return push_menu_template_to_branches(
		source_branch_code=source_branch_code,
		target_branch_codes=target_branch_codes,
		company=company,
	)


@frappe.whitelist()
def hq_ensure_branch_price_lists(company=None):
	return ensure_all_branches_have_price_lists(company=company)
