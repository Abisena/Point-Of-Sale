# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import cint

from imogi_pos.imogi_pos.utils.branch_pricing import (
	collect_branch_price_lists,
	ensure_branch_price_list,
	get_master_selling_price_list,
	sync_prices_from_master,
)
from imogi_pos.imogi_pos.utils.menu_import_helpers import require_import_access


@frappe.whitelist()
def sync_all_branch_prices():
	require_import_access()
	stats = sync_prices_from_master()
	frappe.db.commit()
	return stats


@frappe.whitelist()
def sync_branch_prices(branch_code=None):
	require_import_access()
	if branch_code:
		stats = sync_prices_from_master(branch_codes=[branch_code])
	else:
		stats = sync_prices_from_master()
	frappe.db.commit()
	return stats


@frappe.whitelist()
def create_branch_price_list(branch_code, copy_from_master=1):
	require_import_access()
	return ensure_branch_price_list(branch_code, copy_from_master=cint(copy_from_master))


@frappe.whitelist()
def get_branch_pricing_context():
	require_import_access()
	from imogi_pos.imogi_pos.utils.flow import get_settings

	settings = get_settings()
	return {
		"master_selling_price_list": get_master_selling_price_list(settings),
		"branch_price_lists": collect_branch_price_lists(include_master=0),
		"multi_branch": settings.multi_branch,
	}
