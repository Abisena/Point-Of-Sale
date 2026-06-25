# Copyright (c) 2026, Imogi and contributors

import frappe

from imogi_pos.imogi_pos.utils.flow import get_settings


def get_kitchen_item_groups(settings=None):
	settings = settings or get_settings()
	groups = []
	for row in settings.get("kitchen_item_group_rows") or []:
		item_group = (row.get("item_group") if isinstance(row, dict) else getattr(row, "item_group", None)) or ""
		item_group = item_group.strip()
		if item_group:
			groups.append(item_group)
	if groups:
		return groups

	legacy = settings.get("kitchen_item_groups") if isinstance(settings, dict) else getattr(settings, "kitchen_item_groups", None)
	return [g.strip() for g in (legacy or "").split(",") if g.strip()]


def get_fulfillment_order_types(settings=None):
	settings = settings or get_settings()
	types = []
	for row in settings.get("fulfillment_order_type_rows") or []:
		order_type = (row.get("order_type") if isinstance(row, dict) else getattr(row, "order_type", None)) or ""
		order_type = order_type.strip()
		if order_type:
			types.append(order_type)
	if types:
		return types

	legacy = (
		settings.get("fulfillment_for_order_types")
		if isinstance(settings, dict)
		else getattr(settings, "fulfillment_for_order_types", None)
	)
	return [t.strip() for t in (legacy or "").split("\n") if t.strip()]


def append_kitchen_item_groups_from_text(settings, raw_value):
	if not raw_value:
		return
	for name in [g.strip() for g in str(raw_value).split(",") if g.strip()]:
		if not frappe.db.exists("Item Group", name):
			continue
		existing = get_kitchen_item_groups(settings)
		if name in existing:
			continue
		settings.append("kitchen_item_group_rows", {"item_group": name})


def append_fulfillment_order_types_from_text(settings, raw_value):
	if not raw_value:
		return
	for order_type in [t.strip() for t in str(raw_value).replace(",", "\n").split("\n") if t.strip()]:
		existing = get_fulfillment_order_types(settings)
		if order_type in existing:
			continue
		settings.append("fulfillment_order_type_rows", {"order_type": order_type})
