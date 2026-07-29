# Copyright (c) 2026, Imogi and contributors
"""Relabel Purchase Order header date fields so they read clearly next to
the Items table's own per-row "Required By" column:
- transaction_date: "Date" -> "Order Date" (when the PO itself was made)
- schedule_date (header default): "Required By" -> "Receipt Date" (target
  date for the whole order; each Item row keeps its own "Required By" that
  can still be overridden per line)."""

from __future__ import annotations

import frappe


def execute():
	doctype = "Purchase Order"
	meta = frappe.get_meta(doctype)
	labels = {
		"transaction_date": "Order Date",
		"schedule_date": "Receipt Date",
	}

	for fieldname, label in labels.items():
		if not meta.has_field(fieldname):
			continue
		frappe.make_property_setter(
			{
				"doctype": doctype,
				"fieldname": fieldname,
				"property": "label",
				"value": label,
				"property_type": "Data",
			},
			is_system_generated=False,
		)

	frappe.clear_cache(doctype=doctype)
