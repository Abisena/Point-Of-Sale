# Copyright (c) 2026, Imogi and contributors
"""Route kitchen orders to kitchen/bar stations."""

from __future__ import annotations

import frappe
from frappe.utils import cint

from imogi_pos.imogi_pos.utils.flow import get_settings

KDS_MODE_KITCHEN_ONLY = "Kitchen Only"
KDS_MODE_SEPARATE = "Separate Kitchen and Bar"
KDS_MODE_COMBINED = "Combined Kitchen & Bar"

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


def get_kds_station_mode(settings=None) -> str:
	settings = settings or get_settings()
	mode = (getattr(settings, "kds_station_mode", None) or "").strip()
	if mode in (KDS_MODE_KITCHEN_ONLY, KDS_MODE_SEPARATE, KDS_MODE_COMBINED):
		return mode
	return KDS_MODE_SEPARATE


def is_bar_station_routing_enabled(settings=None) -> bool:
	"""True when KDS should split / filter Bar separately."""
	return get_kds_station_mode(settings) == KDS_MODE_SEPARATE


def is_central_kitchen_enabled(settings=None) -> bool:
	settings = settings or get_settings()
	return bool(cint(getattr(settings, "enable_central_kitchen", 0)))


def _configured_bar_item_groups(settings=None) -> set[str]:
	settings = settings or get_settings()
	groups = set()
	for row in getattr(settings, "bar_item_group_rows", None) or []:
		group = (getattr(row, "item_group", None) or "").strip()
		if group:
			groups.add(group)
	return groups


def is_bar_kitchen_item(item_code: str, settings=None) -> bool:
	"""Beverage / bar item — explicit settings groups first, then name hints."""
	if not item_code:
		return False
	settings = settings or get_settings()
	group = frappe.db.get_value("Item", item_code, "item_group") or ""
	configured = _configured_bar_item_groups(settings)
	if configured:
		return group in configured
	group_l = group.lower()
	return any(hint in group_l for hint in BAR_ITEM_GROUP_HINTS)


def partition_kitchen_item_codes(item_codes, settings=None) -> dict[str, list[str]]:
	"""Split item codes into Kitchen vs Bar buckets for Separate mode."""
	settings = settings or get_settings()
	food, drinks = [], []
	for code in item_codes or []:
		if not code:
			continue
		if is_bar_kitchen_item(code, settings):
			drinks.append(code)
		else:
			food.append(code)
	return {"Kitchen": food, "Bar": drinks}


def infer_station_type_for_order(order, settings=None) -> str:
	from imogi_pos.imogi_pos.utils.flow import is_kitchen_item

	settings = settings or get_settings()
	mode = get_kds_station_mode(settings)
	if mode == KDS_MODE_KITCHEN_ONLY:
		return "Kitchen"
	if mode == KDS_MODE_COMBINED:
		return "Kitchen & Bar"

	bar_count = 0
	kitchen_count = 0
	for row in order.items:
		if not (cint(getattr(row, "is_kitchen_item", 0)) or is_kitchen_item(row.item_code)):
			continue
		if is_bar_kitchen_item(row.item_code, settings):
			bar_count += 1
		else:
			kitchen_count += 1
	if bar_count > 0 and kitchen_count == 0:
		return "Bar"
	return "Kitchen"


def get_active_kitchen_station(company, station_type="Kitchen"):
	if not company:
		return None

	# Combined mode prefers dedicated "Kitchen & Bar" station, then Kitchen.
	type_priority = [station_type]
	if station_type == "Kitchen & Bar":
		type_priority = ["Kitchen & Bar", "Kitchen"]
	elif station_type == "Kitchen":
		type_priority = ["Kitchen", "Kitchen & Bar"]

	for stype in type_priority:
		station = frappe.db.get_value(
			"IMOGI Kitchen Station",
			{"is_active": 1, "company": company, "station_type": stype},
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
	"""Create default stations for a company if missing."""
	settings = get_settings()
	company = company or settings.default_company
	if not company:
		return {"company": None, "created": []}

	mode = get_kds_station_mode(settings)
	created = []
	if mode == KDS_MODE_COMBINED:
		defaults = (("Kitchen & Bar Utama", "Kitchen & Bar"),)
	elif mode == KDS_MODE_KITCHEN_ONLY:
		defaults = (("Dapur Utama", "Kitchen"),)
	else:
		defaults = (
			("Dapur Utama", "Kitchen"),
			("Bar Utama", "Bar"),
		)

	for station_name, station_type in defaults:
		if frappe.db.exists("IMOGI Kitchen Station", station_name):
			# Keep type in sync if station already exists with old type.
			existing_type = frappe.db.get_value("IMOGI Kitchen Station", station_name, "station_type")
			if existing_type != station_type and station_name.startswith(("Dapur", "Bar", "Kitchen")):
				# Don't overwrite custom renames aggressively — only create missing.
				pass
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
		station_type = infer_station_type_for_order(order, settings)
		return get_active_kitchen_station(order.company or company, station_type)

	items = frappe.get_all(
		"IMOGI Kitchen Order Item",
		filters={"parent": kitchen_order_name},
		fields=["item_code"],
	)
	mode = get_kds_station_mode(settings)
	if mode == KDS_MODE_COMBINED:
		station_type = "Kitchen & Bar"
	elif mode == KDS_MODE_KITCHEN_ONLY:
		station_type = "Kitchen"
	else:
		bar_count = sum(1 for item in items if is_bar_kitchen_item(item.item_code, settings))
		kitchen_count = len(items) - bar_count
		station_type = "Bar" if bar_count > 0 and kitchen_count == 0 else "Kitchen"
	return get_active_kitchen_station(company, station_type)


def resolve_kitchen_station(order, settings=None, station_type=None):
	"""Pick kitchen station — central kitchen overrides when configured."""
	settings = settings or get_settings()
	if is_central_kitchen_enabled(settings):
		central_station = getattr(settings, "central_kitchen_station", None)
		if central_station and frappe.db.exists("IMOGI Kitchen Station", central_station):
			return central_station

	stype = station_type or infer_station_type_for_order(order, settings)
	return get_active_kitchen_station(order.company, stype)


def resolve_station_for_item_rows(order, item_rows, settings=None) -> str | None:
	"""Resolve station for a specific subset of kitchen item rows."""
	settings = settings or get_settings()
	if is_central_kitchen_enabled(settings):
		central_station = getattr(settings, "central_kitchen_station", None)
		if central_station and frappe.db.exists("IMOGI Kitchen Station", central_station):
			return central_station

	mode = get_kds_station_mode(settings)
	if mode == KDS_MODE_COMBINED:
		return get_active_kitchen_station(order.company, "Kitchen & Bar")
	if mode == KDS_MODE_KITCHEN_ONLY:
		return get_active_kitchen_station(order.company, "Kitchen")

	bar_count = 0
	kitchen_count = 0
	for row in item_rows or []:
		item_code = row.item_code if hasattr(row, "item_code") else row.get("item_code")
		if not item_code:
			continue
		if is_bar_kitchen_item(item_code, settings):
			bar_count += 1
		else:
			kitchen_count += 1
	station_type = "Bar" if bar_count > 0 and kitchen_count == 0 else "Kitchen"
	return get_active_kitchen_station(order.company, station_type)
