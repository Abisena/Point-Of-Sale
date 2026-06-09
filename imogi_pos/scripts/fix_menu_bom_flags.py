# Copyright (c) 2026, Imogi and contributors
"""One-time repair: template flags, enable BOM variants, BOM stock flags."""

import frappe

from imogi_pos.imogi_pos.utils.menu_variant_import import set_bom_finished_item_stock_flag


def run():
	frappe.set_user("Administrator")
	fixed_templates = 0
	enabled_variants = 0
	stock_flags = 0

	parents = frappe.db.sql(
		"""
		SELECT DISTINCT variant_of AS name
		FROM `tabItem`
		WHERE variant_of IS NOT NULL AND variant_of != ''
		""",
		as_dict=True,
	)
	for row in parents:
		name = row.name
		from imogi_pos.imogi_pos.utils.bom_stock import (
			get_enabled_variant_codes,
			template_has_configured_attributes,
		)

		variants = get_enabled_variant_codes(name)
		should_flag = template_has_configured_attributes(name) or len(variants) > 1
		if should_flag and not frappe.db.get_value("Item", name, "has_variants"):
			frappe.db.set_value("Item", name, "has_variants", 1, update_modified=False)
			fixed_templates += 1

	for bom in frappe.get_all(
		"BOM",
		filters={"is_active": 1, "docstatus": ["<", 2]},
		fields=["item"],
	):
		item_code = bom.item
		if frappe.db.get_value("Item", item_code, "disabled"):
			frappe.db.set_value("Item", item_code, "disabled", 0, update_modified=False)
			enabled_variants += 1
		if frappe.db.get_value("Item", item_code, "is_stock_item"):
			set_bom_finished_item_stock_flag(item_code)
			stock_flags += 1

	frappe.db.commit()
	print(
		f"Fixed templates: {fixed_templates}, enabled BOM variants: {enabled_variants}, "
		f"stock flags cleared: {stock_flags}"
	)
