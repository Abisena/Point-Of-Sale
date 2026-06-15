import frappe


def execute():
	field = frappe.db.get_value(
		"Custom Field",
		{"dt": "Item", "fieldname": "imogi_pos_category"},
		"name",
	)
	if not field:
		return

	options = "Food\nBeverage\nDessert\nService\nCombo Package"
	frappe.db.set_value("Custom Field", field, "options", options)
	frappe.clear_cache(doctype="Item")
