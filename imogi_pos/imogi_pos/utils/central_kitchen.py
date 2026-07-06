# Copyright (c) 2026, Imogi and contributors
"""Route kitchen orders to kitchen/bar stations."""

import frappe
from frappe.utils import cint

from imogi_pos.imogi_pos.utils.flow import get_settings

BAR_ITEM_GROUP_HINTS = (
	"beverage",
	"beverages",
	"minuman",
	"drink",
	"drinks",
	"bar",
	"coffee",
	"tea",
	"juice",
	"boba",
)


def is_central_kitchen_enabled(settings=None) -> bool:
	settings = settings or get_settings()
	return bool(cint(getattr(settings, "enable_central_kitchen", 0)))


def is_bar_kitchen_item(item_code: str) -> bool:
	group = (frappe.db.get_value("Item", item_code, "item_group") or "").lower()
	return any(hint in group for hint in BAR_ITEM_GROUP_HINTS)


def infer_station_type_for_order(order) -> str:
	from imogi_pos.imogi_pos.utils.flow import is_kitchen_item

	bar_count = 0
	kitchen_count = 0
	for row in order.items:
		if not (cint(getattr(row, "is_kitchen_item", 0)) or is_kitchen_item(row.item_code)):
			continue
		if is_bar_kitchen_item(row.item_code):
			bar_count += 1
		else:
			kitchen_count += 1
	if bar_count > 0 and kitchen_count == 0:
		return "Bar"
	return "Kitchen"


def get_active_kitchen_station(company, station_type="Kitchen"):
	if not company:
		return None
	station = frappe.db.get_value(
		"IMOGI Kitchen Station",
		{"is_active": 1, "company": company, "station_type": station_type},
		"name",
		order_by="station_name asc",
	)
	if station:
		return station
	return frappe.db.get_value(
		"IMOGI Kitchen Station",
		{"is_active": 1, "company": company},
		"name",
		order_by="modified desc",
	)


def ensure_default_kitchen_stations(company=None):
	"""Create default Kitchen + Bar stations for a company if missing."""
	settings = get_settings()
	company = company or settings.default_company
	if not company:
		return {"company": None, "created": []}

	created = []
	defaults = (
		("Dapur Utama", "Kitchen"),
		("Bar Utama", "Bar"),
	)
	for station_name, station_type in defaults:
		if frappe.db.exists("IMOGI Kitchen Station", station_name):
			continue
		doc = frappe.get_doc(
			{
				"doctype": "IMOGI Kitchen Station",
				"station_name": station_name,
				"station_type": station_type,
				"company": company,
				"is_active": 1,
			}
		)
		doc.insert(ignore_permissions=True)
		created.append(doc.name)
	return {"company": company, "created": created}


def backfill_kitchen_order_stations(company=None, limit=500):
	"""Assign kitchen_station on legacy kitchen orders that have none."""
	settings = get_settings()
	company = company or settings.default_company
	filters = {"kitchen_station": ["in", ("", None)], "docstatus": ["<", 2]}
	if company:
		filters["company"] = company

	rows = frappe.get_all(
		"IMOGI Kitchen Order",
		filters=filters,
		fields=["name", "pos_order", "company"],
		limit=limit,
		order_by="creation desc",
	)
	updated = []
	for row in rows:
		station = _resolve_station_for_kitchen_order(row.name, row.pos_order, row.company, settings)
		if not station:
			continue
		frappe.db.set_value("IMOGI Kitchen Order", row.name, "kitchen_station", station, update_modified=False)
		updated.append({"name": row.name, "kitchen_station": station})
	return updated


def _resolve_station_for_kitchen_order(kitchen_order_name, pos_order_name, company, settings=None):
	settings = settings or get_settings()
	if is_central_kitchen_enabled(settings):
		central_station = getattr(settings, "central_kitchen_station", None)
		if central_station and frappe.db.exists("IMOGI Kitchen Station", central_station):
			return central_station

	if pos_order_name and frappe.db.exists("Riwayat Order", pos_order_name):
		order = frappe.get_doc("Riwayat Order", pos_order_name)
		station_type = infer_station_type_for_order(order)
		return get_active_kitchen_station(order.company or company, station_type)

	items = frappe.get_all(
		"IMOGI Kitchen Order Item",
		filters={"parent": kitchen_order_name},
		fields=["item_code"],
	)
	bar_count = 0
	kitchen_count = 0
	for item in items:
		if is_bar_kitchen_item(item.item_code):
			bar_count += 1
		else:
			kitchen_count += 1
	station_type = "Bar" if bar_count > 0 and kitchen_count == 0 else "Kitchen"
	return get_active_kitchen_station(company, station_type)


def resolve_kitchen_station(order, settings=None):
	"""Pick kitchen station — central kitchen overrides branch station when configured."""
	settings = settings or get_settings()
	if is_central_kitchen_enabled(settings):
		central_station = getattr(settings, "central_kitchen_station", None)
		if central_station and frappe.db.exists("IMOGI Kitchen Station", central_station):
			return central_station

	station_type = infer_station_type_for_order(order)
	return get_active_kitchen_station(order.company, station_type)
