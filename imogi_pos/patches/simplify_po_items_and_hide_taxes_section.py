# Copyright (c) 2026, Imogi and contributors
"""Simplify the Purchase Order Items grid and hide the header-level Taxes
and Charges section:

- Items grid: swap the "Required By" column for "Item Tax Template" so tax
  can be set per line. schedule_date still gets a value (copied down from
  the header's Receipt Date default), it's just no longer shown as a grid
  column. item_tax_template is a native ERPNext field — picking it per row
  still auto-computes into Grand Total behind the scenes.
- Hide "Taxes and Charges" (Tax Category, Purchase Taxes and Charges
  Template, Shipping Rule, Incoterm, and the Purchase Taxes and Charges
  table itself — the table technically lives in the following section break
  since it's visually seamless with hide_border) and the "Total Quantity" /
  "Total (IDR)" summary fields under the Items grid.
"""

from __future__ import annotations

import frappe


def execute():
	property_setters = [
		# Items grid: replace Required By column with Item Tax Template.
		("Purchase Order Item", "schedule_date", "in_list_view", "0"),
		("Purchase Order Item", "item_tax_template", "in_list_view", "1"),
		# Totals under the Items grid.
		("Purchase Order", "total_qty", "hidden", "1"),
		("Purchase Order", "total", "hidden", "1"),
		# Taxes and Charges section (spans two Section Breaks — hide_border
		# makes them look like one block, but "taxes" table lives in the
		# second one).
		("Purchase Order", "taxes_section", "hidden", "1"),
		("Purchase Order", "section_break_52", "hidden", "1"),
	]

	for doctype, fieldname, prop, value in property_setters:
		frappe.make_property_setter(
			{
				"doctype": doctype,
				"fieldname": fieldname,
				"property": prop,
				"value": value,
				"property_type": "Check",
			},
			is_system_generated=False,
		)

	frappe.clear_cache(doctype="Purchase Order")
	frappe.clear_cache(doctype="Purchase Order Item")
