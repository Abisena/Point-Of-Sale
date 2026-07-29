"""Allow duplicate table numbers on different floors; rename docs to {floor} / {number}."""

import frappe

from imogi_pos.imogi_pos.utils.floor_area import restaurant_table_doc_name


def execute():
	frappe.reload_doc("imogi_pos", "doctype", "imogi_restaurant_table")

	tables = frappe.get_all(
		"IMOGI Restaurant Table",
		fields=["name", "table_number", "restaurant_floor", "restaurant_area"],
		order_by="creation asc",
	)
	for row in tables:
		floor = row.restaurant_floor
		if not floor and row.restaurant_area:
			floor = frappe.db.get_value("IMOGI Restaurant Area", row.restaurant_area, "restaurant_floor")
		if not floor or not row.table_number:
			continue

		new_name = restaurant_table_doc_name(floor, row.table_number)
		if row.name == new_name:
			continue
		if frappe.db.exists("IMOGI Restaurant Table", new_name):
			frappe.log_error(
				title="IMOGI table rename conflict",
				message=f"Cannot rename {row.name} to {new_name}: target exists",
			)
			continue
		frappe.rename_doc("IMOGI Restaurant Table", row.name, new_name, force=True)

	frappe.db.commit()
