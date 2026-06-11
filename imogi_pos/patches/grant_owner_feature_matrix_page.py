# Copyright (c) 2026, Imogi and contributors
"""Allow IMOGI Owner to open Matrix Paket & Fitur (upgrade comparison)."""

import frappe


def execute():
	page_name = "imogi-pos-feature-matrix"
	if not frappe.db.exists("Page", page_name):
		return
	doc = frappe.get_doc("Page", page_name)
	roles = {row.role for row in doc.roles}
	if "IMOGI Owner" in roles:
		return
	doc.append("roles", {"role": "IMOGI Owner"})
	doc.save(ignore_permissions=True)
	frappe.db.commit()
