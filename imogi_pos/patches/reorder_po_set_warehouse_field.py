# Copyright (c) 2026, Imogi and contributors
"""Move Purchase Order's "Set Target Warehouse" (set_warehouse) field to sit
right under "Company" in the header, instead of its default spot next to
"Scan Barcode" above the Items table."""

from __future__ import annotations

import json

import frappe


def execute():
	doctype = "Purchase Order"
	meta = frappe.get_meta(doctype)
	order = [df.fieldname for df in meta.fields]

	if "set_warehouse" not in order or "company" not in order:
		return

	order.remove("set_warehouse")
	order.insert(order.index("company") + 1, "set_warehouse")

	frappe.make_property_setter(
		{
			"doctype": doctype,
			"doctype_or_field": "DocType",
			"property": "field_order",
			"value": json.dumps(order),
		},
		is_system_generated=False,
	)
	frappe.clear_cache(doctype=doctype)
