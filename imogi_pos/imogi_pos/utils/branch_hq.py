# Copyright (c) 2026, Imogi and contributors
"""HQ operations: push prices and menu policy to all branches."""

import frappe
from frappe import _
from frappe.utils import cint

from imogi_pos.imogi_pos.utils.branch import get_accessible_branches, get_branch
from imogi_pos.imogi_pos.utils.branch_pricing import (
	collect_branch_price_lists,
	get_master_selling_price_list,
	sync_prices_from_master,
)
from imogi_pos.imogi_pos.utils.flow import get_settings


def _require_hq_access():
	frappe.only_for(("System Manager", "Sales Manager", "Administrator"))


def get_hq_operations_context(company=None):
	_require_hq_access()
	settings = get_settings()
	company = company or settings.default_company
	branches = frappe.get_all(
		"IMOGI Branch",
		filters={"company": company, "is_active": 1} if company else {"is_active": 1},
		fields=["branch_code", "branch_name", "company", "pos_profile", "selling_price_list", "use_custom_menu"],
		order_by="branch_name asc",
	)
	return {
		"company": company,
		"multi_branch": cint(settings.multi_branch),
		"master_selling_price_list": get_master_selling_price_list(settings, company=company),
		"branch_price_lists": collect_branch_price_lists(company=company, include_master=0),
		"branches": branches,
		"sync_on_import": cint(settings.sync_prices_to_branches_on_import),
	}


def push_master_prices_to_branches(company=None, branch_codes=None):
	"""Sync master selling price list to all (or selected) branch price lists."""
	_require_hq_access()
	settings = get_settings()
	company = company or settings.default_company
	stats = sync_prices_from_master(branch_codes=branch_codes)
	stats["company"] = company
	frappe.db.commit()
	return stats


def push_menu_template_to_branches(source_branch_code, target_branch_codes=None, company=None):
	"""
	Copy custom menu item groups from a template branch to other branches.
	Does not change prices — use push_master_prices_to_branches for that.
	"""
	_require_hq_access()
	source = get_branch(branch_code=source_branch_code)
	if not source:
		frappe.throw(_("Cabang template tidak ditemukan"))

	source_doc = frappe.get_doc("IMOGI Branch", source["name"] or source["branch_code"])
	if not cint(source_doc.use_custom_menu) or not source_doc.item_groups:
		frappe.throw(_("Cabang template harus punya menu khusus (item groups)"))

	company = company or source_doc.company
	targets = target_branch_codes or []
	if not targets:
		targets = [
			row["branch_code"]
			for row in get_accessible_branches(company=company, include_inactive=0)
			if row["branch_code"] != source_branch_code
		]

	updated = []
	for code in targets:
		if not frappe.db.exists("IMOGI Branch", code):
			continue
		doc = frappe.get_doc("IMOGI Branch", code)
		doc.use_custom_menu = 1
		doc.item_groups = []
		for row in source_doc.item_groups:
			doc.append("item_groups", {"item_group": row.item_group})
		doc.save(ignore_permissions=True)
		updated.append(code)

	frappe.db.commit()
	return {
		"source_branch": source_branch_code,
		"updated_branches": updated,
		"item_group_count": len(source_doc.item_groups),
	}


def ensure_all_branches_have_price_lists(company=None):
	"""Create missing branch price lists and sync from master."""
	_require_hq_access()
	from imogi_pos.imogi_pos.utils.branch_pricing import ensure_branch_price_list

	settings = get_settings()
	company = company or settings.default_company
	created = []
	for row in get_accessible_branches(company=company, include_inactive=0):
		if row.get("selling_price_list"):
			continue
		result = ensure_branch_price_list(row["branch_code"], copy_from_master=1)
		created.append({"branch_code": row["branch_code"], "price_list": result.get("price_list")})

	frappe.db.commit()
	return {"created": created, "count": len(created)}
