# Copyright (c) 2026, Imogi and contributors

from __future__ import annotations

import frappe
from frappe.utils import getdate


def set_order_month(doc, method=None):
	"""Keep imogi_order_month (YYYY-MM) in sync with Order Date.

	Purely a facet field for the Purchase Order List View's sidebar Group By
	— Frappe's group-by only supports Select/Link/Data/Int/Check fieldtypes,
	not Date, so this string mirror is what lets "group by month" work there.
	"""
	doc.imogi_order_month = getdate(doc.transaction_date).strftime("%Y-%m") if doc.transaction_date else None


def sync_item_tax_rows(doc, method=None):
	"""Auto-manage the (hidden) header Purchase Taxes and Charges table from
	each Item row's Taxes selection (imogi_item_tax_templates — a JSON array
	of Item Tax Template names edited via the "Pilih Tax" dialog, so one
	item can carry several taxes at once).

	A Table MultiSelect column was tried first but had to be abandoned:
	Frappe silently drops a child table nested inside another child table on
	save (verified directly against the DB — doc.insert() never persisted
	those grandchild rows at all), so it looked fine in the UI but never
	actually saved anything. Storing the selection as plain JSON on the item
	row sidesteps that; imogi_item_taxes/IMOGI Purchase Order Item Tax are
	the leftover, now-hidden fields from that attempt.

	ERPNext's calculate_taxes() only distributes tax amounts across accounts
	that already exist as header-level rows in `taxes` — an empty header
	table makes it no-op entirely, regardless of what's set per item. Since
	the header Taxes and Charges section is hidden from the form, this keeps
	that hidden table in sync: one row per distinct tax account referenced
	by any item's selection, added/removed as items change. Rate is left at
	0 so items that don't use that account get no tax — the actual per-item
	amount comes from item.item_tax_rate (set below), which calculate_taxes()
	prefers over the header row's rate when present.
	"""
	import json

	from erpnext.controllers.taxes_and_totals import calculate_taxes_and_totals as TaxCalculator
	from erpnext.stock.get_item_details import get_item_tax_map

	item_maps = {}
	required_accounts = []
	seen = set()

	for item in doc.items:
		try:
			templates = [t for t in json.loads(item.get("imogi_item_tax_templates") or "[]") if t]
		except ValueError:
			templates = []

		item.imogi_item_taxes_display = ", ".join(templates)

		merged = {}
		for template in templates:
			merged.update(get_item_tax_map(doc.company, template, as_json=False))
		item_maps[item.name] = merged
		for account_head in merged:
			if account_head not in seen:
				seen.add(account_head)
				required_accounts.append(account_head)

	for row in list(doc.taxes):
		if row.account_head not in seen:
			doc.remove(row)

	existing_accounts = {t.account_head for t in doc.taxes}
	default_cost_center = frappe.get_cached_value("Company", doc.company, "cost_center") if doc.company else None

	for account_head in required_accounts:
		if account_head in existing_accounts:
			continue
		doc.append(
			"taxes",
			{
				"charge_type": "On Net Total",
				"category": "Total",
				"add_deduct_tax": "Add",
				"account_head": account_head,
				"description": frappe.get_cached_value("Account", account_head, "account_name") or account_head,
				"cost_center": default_cost_center,
				"rate": 0,
			},
		)

	if not seen:
		return

	# ERPNext's own update_item_tax_map() only reads the single, now-unused
	# item_tax_template field and would clobber the merged map built above
	# from imogi_item_taxes — swap it out for the duration of this one
	# recompute so calculate_taxes() sees our combined per-item rates.
	def _use_combined_item_tax_map(calculator_self):
		for item in calculator_self.doc.items:
			item.item_tax_rate = json.dumps(item_maps.get(item.name, {}))

	original = TaxCalculator.update_item_tax_map
	TaxCalculator.update_item_tax_map = _use_combined_item_tax_map
	try:
		doc.calculate_taxes_and_totals()
	finally:
		TaxCalculator.update_item_tax_map = original
