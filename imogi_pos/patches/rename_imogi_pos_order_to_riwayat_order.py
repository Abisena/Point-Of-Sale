# Copyright (c) 2026, Imogi and contributors

import frappe

OLD_DOCTYPE = "IMOGI POS Order"
NEW_DOCTYPE = "Riwayat Order"


def execute():
	if frappe.db.exists("DocType", OLD_DOCTYPE) and not frappe.db.exists("DocType", NEW_DOCTYPE):
		frappe.rename_doc("DocType", OLD_DOCTYPE, NEW_DOCTYPE, force=True)

	_sync_print_formats()
	_sync_custom_field_options()
	_sync_report_ref_doctype()
	frappe.clear_cache()


def _sync_report_ref_doctype():
	for report_name in (
		"IMOGI UMKM Daily Sales",
		"IMOGI POS Order Summary",
		"IMOGI Branch Sales Summary",
	):
		if frappe.db.exists("Report", report_name):
			frappe.db.set_value(
				"Report", report_name, "ref_doctype", NEW_DOCTYPE, update_modified=False
			)


def _sync_print_formats():
	for name in frappe.get_all("Print Format", filters={"doc_type": OLD_DOCTYPE}, pluck="name"):
		frappe.db.set_value("Print Format", name, "doc_type", NEW_DOCTYPE, update_modified=False)


def _sync_custom_field_options():
	for row in frappe.get_all(
		"Custom Field",
		filters={"options": OLD_DOCTYPE},
		fields=["name", "options"],
	):
		frappe.db.set_value("Custom Field", row.name, "options", NEW_DOCTYPE, update_modified=False)
