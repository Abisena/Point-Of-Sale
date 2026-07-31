# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import cint

from imogi_pos.api.cashier import _require_cashier_access
from imogi_pos.imogi_pos.utils.feature_gating import is_feature_operational, require_feature_operational
from imogi_pos.imogi_pos.utils.floor_area import (
	assert_table_number_available_on_floor,
	get_area_background,
	get_floor_background,
	list_areas_for_service,
	list_floors_for_service,
	sync_table_area_fields,
)
from imogi_pos.imogi_pos.utils.flow import get_settings, release_restaurant_table, reserve_restaurant_table
from imogi_pos.imogi_pos.utils.qr_table_order import is_qr_self_service_enabled
from imogi_pos.imogi_pos.utils.table_service import (
	get_table_doc,
	list_tables_for_service,
	validate_table_assignable,
)


def _require_table_service_access():
	if frappe.session.user == "Guest":
		frappe.throw(_("Login required"), frappe.AuthenticationError)
	if not (
		frappe.has_permission("IMOGI Restaurant Table", "read")
		or frappe.has_permission("Riwayat Order", "read")
	):
		frappe.throw(_("Not permitted"), frappe.PermissionError)


@frappe.whitelist()
def list_restaurant_tables(company=None, status=None, include_occupied=1, ensure_table=None):
	"""List restaurant tables for cashier table picker."""
	_require_cashier_access()
	require_feature_operational("table_management")

	ensure_table = (ensure_table or "").strip()
	if ensure_table:
		include_occupied = 1

	rows = list_tables_for_service(company=company, include_occupied=include_occupied, status=status)
	if ensure_table and ensure_table not in {row.get("name") for row in rows}:
		occupied_rows = list_tables_for_service(company=company, include_occupied=1)
		for row in occupied_rows:
			if row.get("name") == ensure_table:
				rows.append(row)
				break
	rows.sort(key=lambda row: (row.get("table_number") or row.get("name") or ""))
	return {"tables": rows}


@frappe.whitelist()
def get_table_service_board(company=None, floor=None):
	"""Unified payload for the Table Service desk page."""
	_require_table_service_access()
	require_feature_operational("table_management")
	settings = get_settings()
	company = company or settings.default_company

	floors = list_floors_for_service(company=company)
	if not floor and floors:
		floor = floors[0].name
	elif floor and not frappe.db.exists("IMOGI Restaurant Floor", floor):
		floor = floors[0].name if floors else None

	floor_background = get_floor_background(floor)
	if not floor_background:
		floor_background = settings.get("table_floor_background") or None

	board = {
		"company": company,
		"floors": floors,
		"areas": list_areas_for_service(company=company, active_only=0),
		"active_floor": floor,
		"tables": list_tables_for_service(company=company, include_occupied=1),
		"reservations": [],
		"waiting": [],
		"floor_background": floor_background,
		"refresh_seconds": cint(settings.dashboard_refresh_seconds) or 30,
		"features": {
			"table_management": True,
			"move_table": is_feature_operational("move_table"),
			"merge_table": is_feature_operational("merge_table"),
			"table_reservation": is_feature_operational("table_reservation"),
			"waiting_list": is_feature_operational("waiting_list"),
			"qr_self_service": is_qr_self_service_enabled(settings),
		},
	}

	if board["features"]["table_reservation"]:
		from imogi_pos.api.planned_features_api import list_table_reservations

		board["reservations"] = list_table_reservations(company=company, status="Booked").get("rows", [])

	if board["features"]["waiting_list"]:
		from imogi_pos.api.planned_features_api import list_waiting_queue

		board["waiting"] = list_waiting_queue(company=company).get("rows", [])

	return board


@frappe.whitelist()
def get_pos_order_kitchen_tracking(pos_order):
	"""Kitchen item progress for Table Service order popup."""
	_require_table_service_access()
	from imogi_pos.api.kitchen import build_pos_order_kitchen_tracking

	return build_pos_order_kitchen_tracking(pos_order)


@frappe.whitelist()
def get_table_kitchen_tracking(restaurant_table, pos_order=None):
	"""Kitchen progress aggregated across all open orders on a table."""
	_require_table_service_access()
	from imogi_pos.api.kitchen import build_table_kitchen_tracking

	if pos_order:
		from imogi_pos.api.kitchen import build_pos_order_kitchen_tracking

		return build_pos_order_kitchen_tracking(pos_order)
	if restaurant_table:
		return build_table_kitchen_tracking(restaurant_table)
	return {
		"has_kitchen": False,
		"items": [],
		"summary": {"pending": 0, "preparing": 0, "ready": 0, "total": 0},
		"message": _("Meja atau order tidak ditemukan"),
	}


_TABLE_SHAPES = ("Square", "Round", "Bar")
_AREA_TYPES = ("Indoor", "Outdoor", "VIP", "Bar", "Private Room", "Smoking", "Other")


def _normalize_area_type(area_type):
	area_type = (area_type or "Indoor").strip()
	return area_type if area_type in _AREA_TYPES else "Other"


def _area_service_row(doc):
	return {
		"name": doc.name,
		"area_name": doc.area_name,
		"area_type": doc.area_type,
		"restaurant_floor": doc.restaurant_floor,
		"company": doc.company,
		"sort_order": doc.sort_order,
		"is_active": doc.is_active,
		"floor_background": doc.floor_background or None,
		"description": doc.description,
	}


def _normalize_shape(shape):
	shape = (shape or "").strip().title()
	return shape if shape in _TABLE_SHAPES else "Square"


def _resolve_area(restaurant_area=None, location=None, restaurant_floor=None):
	"""Accept area link or legacy free-text zone label."""
	restaurant_area = (restaurant_area or "").strip()
	if restaurant_area and frappe.db.exists("IMOGI Restaurant Area", restaurant_area):
		return restaurant_area

	location = (location or "").strip()
	if not location and not restaurant_area:
		return None

	label = location or restaurant_area
	if restaurant_floor:
		candidate = f"{restaurant_floor} / {label}"
		if frappe.db.exists("IMOGI Restaurant Area", candidate):
			return candidate

	areas = frappe.get_all(
		"IMOGI Restaurant Area",
		filters={"area_name": label, "is_active": 1},
		pluck="name",
		limit=1,
	)
	return areas[0] if areas else None


@frappe.whitelist()
def create_restaurant_table(
	table_number,
	capacity=4,
	location=None,
	company=None,
	shape=None,
	restaurant_area=None,
	restaurant_floor=None,
):
	"""Create a restaurant table from Table Service desk."""
	_require_table_service_access()
	require_feature_operational("table_management")
	frappe.has_permission("IMOGI Restaurant Table", "create", throw=True)

	table_number = (table_number or "").strip()
	if not table_number:
		frappe.throw(_("Nomor meja wajib diisi"))

	settings = get_settings()
	company = company or settings.default_company
	capacity = cint(capacity) or 4
	if capacity < 1:
		frappe.throw(_("Kapasitas minimal 1 orang"))

	area = _resolve_area(restaurant_area, location, restaurant_floor)
	if not area:
		frappe.throw(_("Ruangan / area wajib dipilih"))

	floor = frappe.db.get_value("IMOGI Restaurant Area", area, "restaurant_floor")
	assert_table_number_available_on_floor(floor, table_number)

	doc = frappe.get_doc(
		{
			"doctype": "IMOGI Restaurant Table",
			"table_number": table_number,
			"company": company,
			"capacity": capacity,
			"restaurant_area": area,
			"shape": _normalize_shape(shape),
			"status": "Available",
		}
	)
	doc.insert(ignore_permissions=False)
	frappe.db.commit()
	return {
		"name": doc.name,
		"table_number": doc.table_number,
		"capacity": doc.capacity,
		"location": doc.location,
		"restaurant_area": doc.restaurant_area,
		"restaurant_floor": doc.restaurant_floor,
		"area_name": doc.location,
		"shape": doc.shape,
		"status": doc.status,
	}


@frappe.whitelist()
def update_restaurant_table(
	name,
	capacity=None,
	location=None,
	table_number=None,
	shape=None,
	restaurant_area=None,
):
	"""Edit capacity / area / number / shape of an existing table from Table Service desk."""
	_require_table_service_access()
	require_feature_operational("table_management")
	frappe.has_permission("IMOGI Restaurant Table", "write", throw=True)

	doc = get_table_doc(name)

	if table_number is not None:
		new_number = (table_number or "").strip()
		if not new_number:
			frappe.throw(_("Nomor meja wajib diisi"))
		doc.table_number = new_number

	if capacity is not None:
		capacity = cint(capacity)
		if capacity < 1:
			frappe.throw(_("Kapasitas minimal 1 orang"))
		doc.capacity = capacity

	if restaurant_area is not None:
		area = _resolve_area(restaurant_area, location, doc.restaurant_floor)
		if not area:
			frappe.throw(_("Ruangan / area wajib dipilih"))
		doc.restaurant_area = area
	elif location is not None:
		area = _resolve_area(None, location, doc.restaurant_floor)
		if area:
			doc.restaurant_area = area

	if shape is not None:
		doc.shape = _normalize_shape(shape)

	doc.save(ignore_permissions=False)
	frappe.db.commit()
	doc.reload()

	return {
		"name": doc.name,
		"table_number": doc.table_number,
		"capacity": doc.capacity,
		"location": doc.location,
		"restaurant_area": doc.restaurant_area,
		"restaurant_floor": doc.restaurant_floor,
		"area_name": doc.location,
		"shape": doc.shape,
		"status": doc.status,
	}


@frappe.whitelist()
def create_restaurant_area(
	area_name,
	restaurant_floor,
	area_type=None,
	sort_order=None,
	description=None,
):
	"""Create a restaurant area/zone from Table Service desk."""
	_require_table_service_access()
	require_feature_operational("table_management")
	frappe.has_permission("IMOGI Restaurant Area", "create", throw=True)

	area_name = (area_name or "").strip()
	restaurant_floor = (restaurant_floor or "").strip()
	if not area_name:
		frappe.throw(_("Nama ruangan wajib diisi"))
	if not restaurant_floor or not frappe.db.exists("IMOGI Restaurant Floor", restaurant_floor):
		frappe.throw(_("Lantai tidak ditemukan"))

	if sort_order is None:
		sort_order = frappe.db.count("IMOGI Restaurant Area", {"restaurant_floor": restaurant_floor})
	else:
		sort_order = cint(sort_order)

	doc = frappe.get_doc(
		{
			"doctype": "IMOGI Restaurant Area",
			"area_name": area_name,
			"restaurant_floor": restaurant_floor,
			"area_type": _normalize_area_type(area_type),
			"sort_order": sort_order,
			"is_active": 1,
			"description": (description or "").strip() or None,
		}
	)
	doc.insert(ignore_permissions=False)
	frappe.db.commit()
	return _area_service_row(doc)


@frappe.whitelist()
def update_restaurant_area(
	name,
	area_name=None,
	area_type=None,
	sort_order=None,
	is_active=None,
	description=None,
):
	"""Edit an existing restaurant area/zone from Table Service desk."""
	_require_table_service_access()
	require_feature_operational("table_management")
	frappe.has_permission("IMOGI Restaurant Area", "write", throw=True)

	name = (name or "").strip()
	if not name or not frappe.db.exists("IMOGI Restaurant Area", name):
		frappe.throw(_("Ruangan tidak ditemukan"))

	doc = frappe.get_doc("IMOGI Restaurant Area", name)
	old_name = doc.name

	if area_name is not None:
		area_name = (area_name or "").strip()
		if not area_name:
			frappe.throw(_("Nama ruangan wajib diisi"))
		doc.area_name = area_name
	if area_type is not None:
		doc.area_type = _normalize_area_type(area_type)
	if sort_order is not None:
		doc.sort_order = cint(sort_order)
	if is_active is not None:
		doc.is_active = cint(is_active)
	if description is not None:
		doc.description = (description or "").strip() or None

	doc.save(ignore_permissions=False)

	expected_name = f"{doc.restaurant_floor} / {doc.area_name}"
	if expected_name != old_name:
		frappe.rename_doc("IMOGI Restaurant Area", old_name, expected_name, force=True)
		doc = frappe.get_doc("IMOGI Restaurant Area", expected_name)
		frappe.db.set_value(
			"IMOGI Restaurant Table",
			{"restaurant_area": expected_name},
			"location",
			doc.area_name,
			update_modified=False,
		)

	frappe.db.commit()
	return _area_service_row(doc)


@frappe.whitelist()
def delete_restaurant_area(name):
	"""Remove a restaurant area/zone from Table Service desk."""
	_require_table_service_access()
	require_feature_operational("table_management")
	frappe.has_permission("IMOGI Restaurant Area", "delete", throw=True)

	name = (name or "").strip()
	if not name or not frappe.db.exists("IMOGI Restaurant Area", name):
		frappe.throw(_("Ruangan tidak ditemukan"))

	area_name = frappe.db.get_value("IMOGI Restaurant Area", name, "area_name")
	frappe.delete_doc("IMOGI Restaurant Area", name, ignore_permissions=False)
	frappe.db.commit()
	return {"deleted": name, "area_name": area_name}


@frappe.whitelist()
def set_floor_background(image_url=None, floor=None):
	"""Set or clear the floor-plan background for a restaurant floor."""
	_require_table_service_access()
	require_feature_operational("table_management")
	frappe.has_permission("IMOGI Restaurant Floor", "write", throw=True)

	value = (image_url or "").strip() or None
	settings = get_settings()
	floor = (floor or "").strip()
	if not floor:
		floors = list_floors_for_service(company=settings.default_company)
		floor = floors[0].name if floors else None
	if not floor or not frappe.db.exists("IMOGI Restaurant Floor", floor):
		frappe.throw(_("Lantai tidak ditemukan"))

	frappe.db.set_value("IMOGI Restaurant Floor", floor, "floor_background", value)
	frappe.db.commit()
	frappe.clear_cache(doctype="IMOGI Restaurant Floor")
	return {"floor_background": value, "floor": floor}


@frappe.whitelist()
def set_area_background(image_url=None, area=None):
	"""Set or clear the floor-plan background for a restaurant area/zone."""
	_require_table_service_access()
	require_feature_operational("table_management")
	frappe.has_permission("IMOGI Restaurant Area", "write", throw=True)

	value = (image_url or "").strip() or None
	area = (area or "").strip()
	if not area or not frappe.db.exists("IMOGI Restaurant Area", area):
		frappe.throw(_("Ruangan tidak ditemukan"))

	frappe.db.set_value("IMOGI Restaurant Area", area, "floor_background", value)
	frappe.db.commit()
	frappe.clear_cache(doctype="IMOGI Restaurant Area")
	return {"floor_background": value, "area": area}


@frappe.whitelist()
def save_table_positions(positions):
	"""Persist floor-plan coordinates (percent 0-100) for one or more tables."""
	_require_table_service_access()
	require_feature_operational("table_management")
	frappe.has_permission("IMOGI Restaurant Table", "write", throw=True)

	if isinstance(positions, str):
		positions = frappe.parse_json(positions)
	if not isinstance(positions, list):
		frappe.throw(_("Format posisi tidak valid"))

	def _clamp(value):
		try:
			return max(0.0, min(100.0, round(float(value), 2)))
		except (TypeError, ValueError):
			return None

	def _clamp_scale(value):
		try:
			return max(0.5, min(2.5, round(float(value), 2)))
		except (TypeError, ValueError):
			return None

	def _clamp_rotation(value):
		try:
			return round(float(value) % 360, 1)
		except (TypeError, ValueError):
			return None

	saved = 0
	for entry in positions:
		name = (entry or {}).get("name")
		if not name or not frappe.db.exists("IMOGI Restaurant Table", name):
			continue
		x = _clamp(entry.get("pos_x"))
		y = _clamp(entry.get("pos_y"))
		if x is None or y is None:
			continue
		updates = {"pos_x": x, "pos_y": y}
		scale = _clamp_scale(entry.get("pos_scale")) if entry.get("pos_scale") is not None else None
		rotation = _clamp_rotation(entry.get("pos_rotation")) if entry.get("pos_rotation") is not None else None
		if scale is not None:
			updates["pos_scale"] = scale
		if rotation is not None:
			updates["pos_rotation"] = rotation
		frappe.db.set_value("IMOGI Restaurant Table", name, updates, update_modified=False)
		saved += 1

	frappe.db.commit()
	return {"saved": saved}


@frappe.whitelist()
def delete_restaurant_table(name):
	"""Remove a table from Table Service desk (blocked while in use)."""
	_require_table_service_access()
	require_feature_operational("table_management")
	frappe.has_permission("IMOGI Restaurant Table", "delete", throw=True)

	doc = get_table_doc(name)
	if doc.status == "Occupied" or doc.current_order:
		frappe.throw(_("Meja {0} sedang dipakai — selesaikan order dulu").format(doc.table_number))

	open_orders = frappe.get_all(
		"Riwayat Order",
		filters={
			"restaurant_table": doc.name,
			"docstatus": 1,
			"status": ["not in", ["Completed", "Cancelled", "Refunded"]],
		},
		limit=1,
	)
	if open_orders:
		frappe.throw(_("Meja {0} masih punya order aktif").format(doc.table_number))

	table_number = doc.table_number
	frappe.delete_doc("IMOGI Restaurant Table", doc.name)
	frappe.db.commit()
	return {"deleted": table_number}


@frappe.whitelist()
def move_restaurant_table(order_name, new_table, company=None):
	"""Move an open order to another table."""
	_require_cashier_access()
	require_feature_operational("move_table")

	if not order_name or not new_table:
		frappe.throw(_("Order dan meja tujuan wajib dipilih"))

	order = frappe.get_doc("Riwayat Order", order_name)
	order.check_permission("write")
	if order.status in ("Completed", "Cancelled", "Refunded"):
		frappe.throw(_("Order sudah selesai — tidak bisa pindah meja"))

	new_table_doc = validate_table_assignable(new_table, allow_reserved=True, exclude_order=order_name)

	if order.restaurant_table:
		release_restaurant_table(order)

	order.db_set("restaurant_table", new_table)
	reserve_restaurant_table(order)
	frappe.db.commit()

	return {
		"order": order_name,
		"restaurant_table": new_table,
		"table_number": new_table_doc.table_number,
	}


@frappe.whitelist()
def complete_table_service(order_name):
	"""Close out a Dine-in order once service is done (In Service -> Completed)
	and free its table. Table Service has no other way to reach this — the
	only prior entry point was the Riwayat Order desk form."""
	_require_cashier_access()
	if not order_name:
		frappe.throw(_("Order wajib dipilih"))
	order = frappe.get_doc("Riwayat Order", order_name)
	order.check_permission("write")
	order.action_complete_service()
	frappe.db.commit()
	return {"order": order_name, "status": "Completed"}
