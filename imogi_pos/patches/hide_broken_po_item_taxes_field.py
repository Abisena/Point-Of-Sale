# Copyright (c) 2026, Imogi and contributors
"""imogi_item_taxes (the abandoned Table MultiSelect attempt) was only
taken out of the grid column list (in_list_view=0), not hidden outright —
so it still gets instantiated whenever an Item row is expanded (pencil
icon), and its control throws synchronously because the client no longer
preloads "IMOGI Purchase Order Item Tax" metadata (that preload was ripped
out when the field was replaced by the Pilih Tax dialog). The error aborts
the row-expand render entirely, taking the new Taxes column/edit icon down
with it. Hide it completely so it's never rendered anywhere."""

from __future__ import annotations

import frappe


def execute():
	frappe.make_property_setter(
		{
			"doctype": "Purchase Order Item",
			"fieldname": "imogi_item_taxes",
			"property": "hidden",
			"value": "1",
			"property_type": "Check",
		},
		is_system_generated=False,
	)

	frappe.clear_cache(doctype="Purchase Order Item")
