# Copyright (c) 2026, Imogi and contributors

import frappe

from imogi_pos.imogi_pos.utils.settings_flow import (
	append_fulfillment_order_types_from_text,
	append_kitchen_item_groups_from_text,
)


def _legacy_single_value(fieldname):
	row = frappe.db.sql(
		"""
		SELECT `value`
		FROM `tabSingles`
		WHERE `doctype` = %s AND `field` = %s
		LIMIT 1
		""",
		("IMOGI POS Settings", fieldname),
	)
	return row[0][0] if row else None


def execute():
	settings = frappe.get_single("IMOGI POS Settings")
	changed = False

	legacy_kitchen = _legacy_single_value("kitchen_item_groups")
	if legacy_kitchen and not settings.kitchen_item_group_rows:
		append_kitchen_item_groups_from_text(settings, legacy_kitchen)
		changed = True

	legacy_fulfillment = _legacy_single_value("fulfillment_for_order_types")
	if legacy_fulfillment and not settings.fulfillment_order_type_rows:
		append_fulfillment_order_types_from_text(settings, legacy_fulfillment)
		changed = True

	if not settings.kitchen_item_group_rows and not legacy_kitchen:
		for item_group in ("Consumable",):
			if frappe.db.exists("Item Group", item_group):
				settings.append("kitchen_item_group_rows", {"item_group": item_group})
				changed = True

	if not settings.fulfillment_order_type_rows and not legacy_fulfillment:
		for order_type in ("Takeaway", "Delivery"):
			settings.append("fulfillment_order_type_rows", {"order_type": order_type})
			changed = True

	if changed:
		settings.flags.ignore_validate = True
		settings.save(ignore_permissions=True)
