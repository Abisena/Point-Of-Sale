# Copyright (c) 2026, Imogi and contributors

import frappe

from imogi_pos.install import ensure_imogi_role_permissions


def execute():
	ensure_imogi_role_permissions()
	for page_name, roles in (
		(
			"imogi-pos-dashboard",
			["System Manager", "Sales Manager", "IMOGI Owner", "IMOGI Supervisor"],
		),
		(
			"imogi-pos-sales-report",
			["System Manager", "Sales Manager", "IMOGI Owner"],
		),
		(
			"imogi-pos-menu",
			["System Manager", "Sales Manager", "IMOGI Manager"],
		),
		(
			"imogi-pos-menu-category",
			["System Manager", "Sales Manager", "IMOGI Manager"],
		),
		(
			"imogi-pos-order-history",
			["System Manager", "Sales Manager", "IMOGI Cashier"],
		),
		(
			"imogi-pos-feature-matrix",
			["System Manager", "Sales Manager", "IMOGI Owner"],
		),
	):
		if not frappe.db.exists("Page", page_name):
			continue
		doc = frappe.get_doc("Page", page_name)
		doc.roles = []
		for role in roles:
			doc.append("roles", {"role": role})
		doc.save(ignore_permissions=True)
	frappe.db.commit()
