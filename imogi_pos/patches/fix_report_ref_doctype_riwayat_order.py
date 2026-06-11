# Copyright (c) 2026, Imogi and contributors
"""Point IMOGI sales reports at Riwayat Order (post-rename from IMOGI POS Order)."""

import frappe

REPORTS = (
	"IMOGI UMKM Daily Sales",
	"IMOGI POS Order Summary",
	"IMOGI Branch Sales Summary",
)
NEW_REF = "Riwayat Order"
OLD_REF = "IMOGI POS Order"


def execute():
	if not frappe.db.exists("DocType", NEW_REF):
		return

	for report_name in REPORTS:
		if not frappe.db.exists("Report", report_name):
			continue
		current = frappe.db.get_value("Report", report_name, "ref_doctype")
		if current in (OLD_REF, None) or current != NEW_REF:
			frappe.db.set_value("Report", report_name, "ref_doctype", NEW_REF, update_modified=False)

	frappe.clear_cache()
