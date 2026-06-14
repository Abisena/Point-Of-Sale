# Copyright (c) 2026, Imogi and contributors
"""Restore child table IMOGI Area Manager Branch (controller was missing → orphaned on migrate)."""

import frappe
from frappe.modules.import_file import import_file_by_path


def execute():
	app_path = frappe.get_app_path("imogi_pos")
	for doctype_folder in ("imogi_area_manager_branch", "imogi_area_manager_assignment"):
		path = f"{app_path}/imogi_pos/doctype/{doctype_folder}/{doctype_folder}.json"
		import_file_by_path(path, force=True, ignore_version=True)
	frappe.clear_cache()
