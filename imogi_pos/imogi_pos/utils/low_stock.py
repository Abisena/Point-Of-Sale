# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe.utils import flt

from imogi_pos.imogi_pos.utils.flow import get_settings


def get_item_reorder_level(item_code, warehouse):
	"""Read reorder threshold from ERPNext Item Reorder child table."""
	if not item_code or not warehouse:
		return 0

	level = frappe.db.get_value(
		"Item Reorder",
		{"parent": item_code, "warehouse": warehouse},
		"warehouse_reorder_level",
	)
	if level is not None:
		return flt(level)

	# Fallback: reorder row may target a warehouse group containing this warehouse.
	group = frappe.db.get_value("Warehouse", warehouse, "parent_warehouse")
	while group:
		level = frappe.db.get_value(
			"Item Reorder",
			{"parent": item_code, "warehouse_group": group},
			"warehouse_reorder_level",
		)
		if level is not None:
			return flt(level)
		group = frappe.db.get_value("Warehouse", group, "parent_warehouse")

	return 0


def set_item_reorder_level(item, warehouse, reorder_level, reorder_qty=None):
	"""Write reorder threshold to Item Reorder child table."""
	if not warehouse:
		return

	reorder_level = flt(reorder_level)
	reorder_qty = flt(reorder_qty) if reorder_qty is not None else max(reorder_level, 1)

	for row in item.get("reorder_levels") or []:
		if row.warehouse == warehouse:
			row.warehouse_reorder_level = reorder_level
			row.warehouse_reorder_qty = reorder_qty
			if not row.material_request_type:
				row.material_request_type = "Purchase"
			return

	item.append(
		"reorder_levels",
		{
			"warehouse": warehouse,
			"warehouse_reorder_level": reorder_level,
			"warehouse_reorder_qty": reorder_qty,
			"material_request_type": "Purchase",
		},
	)


def get_low_stock_items(limit=20, warehouse=None):
	"""Return items at or below reorder threshold in the default warehouse."""
	settings = get_settings()
	warehouse = warehouse or settings.default_warehouse
	if not warehouse:
		return []

	threshold_mode = settings.reorder_level_field or "reorder_level"

	items = frappe.get_all(
		"Item",
		filters={"is_stock_item": 1, "disabled": 0},
		fields=["name", "item_name"],
		limit=500,
	)

	low_items = []
	for item in items:
		bin_data = frappe.db.get_value(
			"Bin",
			{"item_code": item.name, "warehouse": warehouse},
			["actual_qty", "projected_qty"],
			as_dict=True,
		)
		actual_qty = flt(bin_data.actual_qty) if bin_data else 0

		if threshold_mode == "projected_qty":
			threshold = flt(bin_data.projected_qty) if bin_data else 0
		else:
			threshold = get_item_reorder_level(item.name, warehouse)

		if threshold and actual_qty <= threshold:
			low_items.append(
				{
					"item_code": item.name,
					"item_name": item.item_name,
					"actual_qty": actual_qty,
					"reorder_level": threshold,
					"warehouse": warehouse,
				}
			)

	low_items.sort(key=lambda row: (row["actual_qty"], row["item_code"]))
	return low_items[: max(int(limit or 20), 1)]
