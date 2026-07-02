# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe.utils import add_days, cint, flt, today

from imogi_pos.imogi_pos.utils.flow import get_settings

AUTO_MR_REMARKS = "IMOGI Auto Low Stock"


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


def get_item_reorder_qty(item_code, warehouse):
	"""Read default reorder quantity from ERPNext Item Reorder child table."""
	if not item_code or not warehouse:
		return 0

	qty = frappe.db.get_value(
		"Item Reorder",
		{"parent": item_code, "warehouse": warehouse},
		"warehouse_reorder_qty",
	)
	if qty is not None:
		return flt(qty)

	group = frappe.db.get_value("Warehouse", warehouse, "parent_warehouse")
	while group:
		qty = frappe.db.get_value(
			"Item Reorder",
			{"parent": item_code, "warehouse_group": group},
			"warehouse_reorder_qty",
		)
		if qty is not None:
			return flt(qty)
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
					"reorder_qty": get_item_reorder_qty(item.name, warehouse),
					"warehouse": warehouse,
				}
			)

	low_items.sort(key=lambda row: (row["actual_qty"], row["item_code"]))
	return low_items[: max(int(limit or 20), 1)]


def get_overstock_items(limit=20, warehouse=None):
	"""Return items whose actual stock exceeds their IMOGI max stock (per product)."""
	settings = get_settings()
	warehouse = warehouse or settings.default_warehouse
	if not warehouse:
		return []

	items = frappe.get_all(
		"Item",
		filters={"is_stock_item": 1, "disabled": 0, "imogi_max_stock": [">", 0]},
		fields=["name", "item_name", "imogi_max_stock"],
		limit=500,
	)

	over_items = []
	for item in items:
		max_stock = flt(item.imogi_max_stock)
		if max_stock <= 0:
			continue
		actual_qty = flt(
			frappe.db.get_value(
				"Bin", {"item_code": item.name, "warehouse": warehouse}, "actual_qty"
			)
		)
		if actual_qty > max_stock:
			over_items.append(
				{
					"item_code": item.name,
					"item_name": item.item_name,
					"actual_qty": actual_qty,
					"max_stock": max_stock,
					"excess_qty": flt(actual_qty - max_stock),
					"warehouse": warehouse,
				}
			)

	over_items.sort(key=lambda row: (-row["excess_qty"], row["item_code"]))
	return over_items[: max(int(limit or 20), 1)]


def has_open_purchase_request(item_code, warehouse):
	"""True when an open Purchase Material Request already exists for item + warehouse."""
	if not item_code or not warehouse:
		return False

	return bool(
		frappe.db.sql(
			"""
			select 1
			from `tabMaterial Request Item` mri
			inner join `tabMaterial Request` mr on mr.name = mri.parent
			where mri.item_code = %(item_code)s
			  and mri.warehouse = %(warehouse)s
			  and mr.material_request_type = 'Purchase'
			  and mr.docstatus < 2
			  and (
			    mr.docstatus = 0
			    or (
			      mr.docstatus = 1
			      and mr.status not in ('Stopped', 'Received', 'Cancelled')
			      and ifnull(mr.per_ordered, 0) < 100
			    )
			  )
			limit 1
			""",
			{"item_code": item_code, "warehouse": warehouse},
		)
	)


def suggested_purchase_qty(actual_qty, reorder_level, reorder_qty=None):
	reorder_qty = flt(reorder_qty)
	if reorder_qty > 0:
		return reorder_qty
	shortfall = flt(reorder_level) - flt(actual_qty)
	return max(shortfall, 1)


def create_auto_purchase_requests(low_items, settings=None):
	"""Create submitted Purchase Material Requests for low-stock items (one MR per warehouse)."""
	settings = settings or get_settings()
	if not cint(getattr(settings, "enable_auto_purchase_request", 0)):
		return []

	company = settings.default_company or frappe.db.get_single_value("Global Defaults", "default_company")
	if not company:
		return []

	by_warehouse: dict[str, list[dict]] = {}
	for row in low_items or []:
		warehouse = row.get("warehouse")
		item_code = row.get("item_code")
		if not warehouse or not item_code:
			continue
		if has_open_purchase_request(item_code, warehouse):
			continue

		qty = suggested_purchase_qty(
			row.get("actual_qty"),
			row.get("reorder_level"),
			row.get("reorder_qty"),
		)
		if qty <= 0:
			continue

		by_warehouse.setdefault(warehouse, []).append(
			{
				"item_code": item_code,
				"qty": qty,
				"warehouse": warehouse,
				"schedule_date": add_days(today(), 3),
			}
		)

	created: list[str] = []
	for warehouse, items in by_warehouse.items():
		if not items:
			continue
		mr = frappe.get_doc(
			{
				"doctype": "Material Request",
				"material_request_type": "Purchase",
				"company": company,
				"transaction_date": today(),
				"schedule_date": add_days(today(), 3),
				"remarks": AUTO_MR_REMARKS,
				"items": items,
			}
		)
		mr.insert(ignore_permissions=True)
		mr.submit()
		created.append(mr.name)

	return created
