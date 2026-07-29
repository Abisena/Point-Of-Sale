# Copyright (c) 2026, Imogi and contributors
"""Add Purchase Order.imogi_order_month and backfill it from Order Date on
existing records. Created here (not left to fixture sync, which only runs
after post_model_sync patches) so the column exists in time for the backfill
in this same patch."""

from __future__ import annotations

import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields
from frappe.utils import getdate


def execute():
	create_custom_fields(
		{
			"Purchase Order": [
				{
					"fieldname": "imogi_order_month",
					"fieldtype": "Data",
					"insert_after": "imogi_approval_status",
					"label": "Bulan Order",
					"read_only": 1,
					"hidden": 1,
					"no_copy": 1,
					"description": "Auto-terisi dari Order Date (format YYYY-MM), dipakai sebagai facet Group By di List View.",
				}
			]
		},
		update=True,
	)

	rows = frappe.get_all("Purchase Order", fields=["name", "transaction_date"])
	for row in rows:
		if not row.transaction_date:
			continue
		month = getdate(row.transaction_date).strftime("%Y-%m")
		frappe.db.set_value("Purchase Order", row.name, "imogi_order_month", month, update_modified=False)
	frappe.db.commit()
