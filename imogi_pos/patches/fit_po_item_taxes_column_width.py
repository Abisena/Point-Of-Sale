# Copyright (c) 2026, Imogi and contributors
"""The Items grid has a hard total-width budget (Frappe's grid.js caps
total_colsize at 11, Bootstrap-12-column style) — the 5 already-visible
columns (Item Code, Quantity, UOM, Rate, Amount) already consume exactly
that budget at their fieldtype defaults, so the new Taxes column never got
a slot at all and silently disappeared from the grid.

Quantity and UOM show short values (numbers, short unit codes) and don't
need their default 2-unit width — narrow them to 1 each to free 2 units,
just enough for a 2-unit Taxes column to fit within the same 11-unit cap."""

from __future__ import annotations

import frappe


def execute():
	for fieldname, columns in (
		("qty", 1),
		("uom", 1),
		("imogi_item_taxes_display", 2),
	):
		frappe.make_property_setter(
			{
				"doctype": "Purchase Order Item",
				"fieldname": fieldname,
				"property": "columns",
				"value": str(columns),
				"property_type": "Int",
			},
			is_system_generated=False,
		)

	frappe.clear_cache(doctype="Purchase Order Item")
