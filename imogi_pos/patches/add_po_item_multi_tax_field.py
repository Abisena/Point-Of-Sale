# Copyright (c) 2026, Imogi and contributors
"""Replace the single Item Tax Template column in the Purchase Order Items
grid with a tag-style multi-select ("Taxes") so one item row can carry
several taxes at once (e.g. VAT 11% + PPh 4(2)) without needing to
pre-combine them into one Item Tax Template first.

Relies on the new child doctype IMOGI Purchase Order Item Tax (a single
Link to Item Tax Template, istable=1) — the standard Frappe pattern for a
Table MultiSelect field's `options` target (see core's "User Role" /
"roles" field for the same shape).
"""

from __future__ import annotations

import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields


def execute():
	create_custom_fields(
		{
			"Purchase Order Item": [
				{
					"fieldname": "imogi_item_taxes",
					"fieldtype": "Table MultiSelect",
					"options": "IMOGI Purchase Order Item Tax",
					"insert_after": "item_tax_template",
					"label": "Taxes",
					"in_list_view": 1,
					"description": "Bisa pilih lebih dari satu tax per item (tag). Menggantikan Item Tax Template bawaan di grid — dipakai bareng oleh purchase_order_hooks.sync_item_tax_rows.",
				}
			]
		},
		update=True,
	)

	# The native single-select column is superseded by imogi_item_taxes —
	# hide it from the grid (field itself stays, just unused in the UI now).
	frappe.make_property_setter(
		{
			"doctype": "Purchase Order Item",
			"fieldname": "item_tax_template",
			"property": "in_list_view",
			"value": "0",
			"property_type": "Check",
		},
		is_system_generated=False,
	)

	frappe.clear_cache(doctype="Purchase Order Item")
	frappe.clear_cache(doctype="IMOGI Purchase Order Item Tax")
