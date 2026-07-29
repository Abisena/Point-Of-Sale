# Copyright (c) 2026, Imogi and contributors
"""Replace the broken Table-MultiSelect-in-a-child-table "Taxes" column
(imogi_item_taxes / IMOGI Purchase Order Item Tax) with a plain-field +
dialog approach.

Verified directly against the DB: Frappe does not persist a child table
nested inside another child table at all — doc.insert() silently drops
those grandchild rows, so the Table MultiSelect column never actually
saved anything despite looking fine in the UI. Storing the selection as a
JSON array on a plain field instead sidesteps that entirely: no nested
child table, so no persistence gap. Editing happens through a dialog
(triggered by the new imogi_edit_taxes_button) using Frappe's
MultiSelectPills control — the exact same widget core uses for the
"Assign To" dialog, just not asked to live inside a grid cell this time.
"""

from __future__ import annotations

import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields


def execute():
	create_custom_fields(
		{
			"Purchase Order Item": [
				{
					"fieldname": "imogi_item_tax_templates",
					"fieldtype": "Long Text",
					"insert_after": "item_tax_template",
					"label": "Tax Templates (JSON)",
					"hidden": 1,
					"no_copy": 1,
					"description": "Array JSON nama Item Tax Template terpilih untuk baris ini — diisi lewat dialog Pilih Tax, jangan diedit manual.",
				},
				{
					"fieldname": "imogi_item_taxes_display",
					"fieldtype": "Small Text",
					"insert_after": "imogi_item_tax_templates",
					"label": "Taxes",
					"read_only": 1,
					"in_list_view": 1,
					"no_copy": 1,
				},
				{
					"fieldname": "imogi_edit_taxes_button",
					"fieldtype": "Button",
					"insert_after": "imogi_item_taxes_display",
					"label": "Pilih Tax",
				},
				# supersedes the earlier broken attempt — kept (not deleted)
				# so no data-loss surprises, just hidden from the grid.
				{
					"fieldname": "imogi_item_taxes",
					"fieldtype": "Table MultiSelect",
					"options": "IMOGI Purchase Order Item Tax",
					"in_list_view": 0,
				},
			]
		},
		update=True,
	)

	frappe.clear_cache(doctype="Purchase Order Item")
