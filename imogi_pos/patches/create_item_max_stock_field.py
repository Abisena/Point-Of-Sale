# Copyright (c) 2026, Imogi and contributors
"""Add the IMOGI POS max-stock custom field to Item."""

import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields


def execute():
	create_custom_fields(
		{
			"Item": [
				{
					"fieldname": "imogi_max_stock",
					"fieldtype": "Float",
					"insert_after": "imogi_pos_add_ons",
					"label": "Maksimal Stok (IMOGI POS)",
					"description": (
						"Batas maksimal stok per produk. Dipakai untuk peringatan "
						"overstock di IMOGI POS. 0 = tanpa batas."
					),
					"non_negative": 1,
				}
			]
		},
		ignore_validate=True,
	)
	frappe.clear_cache(doctype="Item")
