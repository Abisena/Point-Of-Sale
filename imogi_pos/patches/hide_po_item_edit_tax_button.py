# Copyright (c) 2026, Imogi and contributors
"""The "Pilih Tax" button field was the original entry point into the tax
dialog (only reachable by expanding a row). Now that the "Taxes" grid
column itself is clickable, the button is a redundant, awkwardly-styled
duplicate — hide it. The click handler stays wired (imogi_edit_taxes_button
doc_event), it's just never shown."""

from __future__ import annotations

import frappe


def execute():
	frappe.make_property_setter(
		{
			"doctype": "Purchase Order Item",
			"fieldname": "imogi_edit_taxes_button",
			"property": "hidden",
			"value": "1",
			"property_type": "Check",
		},
		is_system_generated=False,
	)

	frappe.clear_cache(doctype="Purchase Order Item")
