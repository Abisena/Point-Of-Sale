# Copyright (c) 2026, Imogi and contributors
"""Hide the redundant "Taxes and Charges Added" / "Taxes and Charges
Deducted" breakdown fields on Purchase Order. In the common case (no
deductions, only added tax) they show the exact same figure as "Total Taxes
and Charges" right next to them, reading as a duplicate. Keep only the
"Total Taxes and Charges" summary field visible."""

from __future__ import annotations

import frappe


def execute():
	for fieldname in ("taxes_and_charges_added", "taxes_and_charges_deducted"):
		frappe.make_property_setter(
			{
				"doctype": "Purchase Order",
				"fieldname": fieldname,
				"property": "hidden",
				"value": "1",
				"property_type": "Check",
			},
			is_system_generated=False,
		)

	frappe.clear_cache(doctype="Purchase Order")
