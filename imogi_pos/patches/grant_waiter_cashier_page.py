# Copyright (c) 2026, Imogi and contributors

import frappe


def execute():
	"""Allow waiter/supervisor to open IMOGI Kasir from Table Service (order baru / datang)."""
	for page_name, roles in {
		"imogi-pos-cashier": ["IMOGI Waiter", "IMOGI Supervisor"],
	}.items():
		if not frappe.db.exists("Page", page_name):
			continue
		page = frappe.get_doc("Page", page_name)
		existing = {row.role for row in page.roles or []}
		changed = False
		for role in roles:
			if role not in existing:
				page.append("roles", {"role": role})
				changed = True
		if changed:
			page.save(ignore_permissions=True)

	frappe.clear_cache()
