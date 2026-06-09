# Copyright (c) 2026, Imogi and contributors
"""Dedicated API for BOM component stock (opening) import."""

import frappe
from frappe import _
from frappe.utils import cint

from imogi_pos.api.branch_stock_api import (
	build_branch_transfer_context,
	build_stock_import_template,
	run_branch_stock_transfer,
	run_import_stock_from_file,
)
from imogi_pos.imogi_pos.utils.menu_import_helpers import require_import_access


@frappe.whitelist()
def get_stock_import_template():
	require_import_access()
	return build_stock_import_template()


@frappe.whitelist()
def import_stock_from_file(file_url=None, update_rate=1, warehouse=None, branch_code=None, company=None):
	"""Import opening stock for BOM components via Material Receipt."""
	return run_import_stock_from_file(
		file_url=file_url,
		update_rate=cint(update_rate),
		warehouse=warehouse,
		branch_code=branch_code,
		company=company,
	)


@frappe.whitelist()
def get_branch_transfer_context(from_branch_code=None, to_branch_code=None):
	return build_branch_transfer_context(from_branch_code=from_branch_code, to_branch_code=to_branch_code)


@frappe.whitelist()
def create_branch_stock_transfer(from_branch_code, to_branch_code, items):
	"""Material Transfer between branch warehouses."""
	return run_branch_stock_transfer(from_branch_code, to_branch_code, items)
