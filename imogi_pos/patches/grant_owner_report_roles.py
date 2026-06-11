# Copyright (c) 2026, Imogi and contributors
"""Grant IMOGI Owner / Area Manager access to IMOGI POS script reports."""

import frappe

REPORTS = (
	"IMOGI UMKM Daily Sales",
	"IMOGI POS Order Summary",
	"IMOGI Branch Sales Summary",
)
OWNER_ROLES = ("IMOGI Owner", "IMOGI Area Manager")


def execute():
	for report_name in REPORTS:
		if not frappe.db.exists("Report", report_name):
			continue
		doc = frappe.get_doc("Report", report_name)
		roles = {row.role for row in doc.roles}
		changed = False
		for role in OWNER_ROLES:
			if role not in roles:
				doc.append("roles", {"role": role})
				changed = True
		if changed:
			doc.save(ignore_permissions=True)
	frappe.db.commit()
	frappe.clear_cache(user="Administrator")
