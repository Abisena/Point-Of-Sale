# Copyright (c) 2026, Imogi and contributors

import frappe


def execute():
	"""Ensure Administrator can open the Table Service desk page."""
	page_name = "table-service"
	if not frappe.db.exists("Page", page_name):
		return

	page = frappe.get_doc("Page", page_name)
	existing = {row.role for row in page.roles or []}
	if "Administrator" in existing:
		return

	page.append("roles", {"role": "Administrator"})
	page.save(ignore_permissions=True)
	frappe.clear_cache()
