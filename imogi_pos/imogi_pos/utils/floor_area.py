# Copyright (c) 2026, Imogi and contributors
"""Restaurant floor & area helpers for Table Service."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint

from imogi_pos.imogi_pos.utils.flow import get_settings


def resolve_company(company=None):
	settings = get_settings()
	return company or settings.default_company


def list_floors_for_service(company=None, active_only=1):
	company = resolve_company(company)
	filters = {}
	if company:
		filters["company"] = company
	if cint(active_only):
		filters["is_active"] = 1

	rows = frappe.get_all(
		"IMOGI Restaurant Floor",
		filters=filters,
		fields=[
			"name",
			"floor_name",
			"company",
			"sort_order",
			"floor_background",
			"is_active",
			"description",
		],
		order_by="sort_order asc, floor_name asc",
	)
	return rows


def list_areas_for_service(company=None, floor=None, active_only=1):
	company = resolve_company(company)
	filters = {}
	if floor:
		filters["restaurant_floor"] = floor
	elif company:
		filters["company"] = company
	if cint(active_only):
		filters["is_active"] = 1

	rows = frappe.get_all(
		"IMOGI Restaurant Area",
		filters=filters,
		fields=[
			"name",
			"area_name",
			"area_type",
			"restaurant_floor",
			"company",
			"sort_order",
			"is_active",
			"description",
		],
		order_by="sort_order asc, area_name asc",
	)
	for row in rows:
		row["floor_name"] = frappe.db.get_value(
			"IMOGI Restaurant Floor", row.restaurant_floor, "floor_name"
		)
	return rows


def get_floor_background(floor_name: str | None) -> str | None:
	if not floor_name or not frappe.db.exists("IMOGI Restaurant Floor", floor_name):
		return None
	return frappe.db.get_value("IMOGI Restaurant Floor", floor_name, "floor_background") or None


def ensure_default_floor(company=None, floor_label: str = "Lantai Utama"):
	company = resolve_company(company)
	existing = frappe.db.get_value(
		"IMOGI Restaurant Floor",
		{"company": company, "floor_name": floor_label},
		"name",
	)
	if existing:
		return existing

	doc = frappe.get_doc(
		{
			"doctype": "IMOGI Restaurant Floor",
			"floor_name": floor_label,
			"company": company,
			"sort_order": 0,
			"is_active": 1,
		}
	)
	doc.insert(ignore_permissions=True)
	return doc.name


def ensure_area(
	floor_name: str,
	area_label: str,
	*,
	area_type: str = "Indoor",
	company=None,
):
	area_label = (area_label or "").strip() or "Indoor"
	doc_name = f"{floor_name} / {area_label}"
	if frappe.db.exists("IMOGI Restaurant Area", doc_name):
		return doc_name

	floor_company = frappe.db.get_value("IMOGI Restaurant Floor", floor_name, "company") or resolve_company(
		company
	)
	doc = frappe.get_doc(
		{
			"doctype": "IMOGI Restaurant Area",
			"area_name": area_label,
			"restaurant_floor": floor_name,
			"area_type": area_type if area_type in _AREA_TYPES else "Other",
			"company": floor_company,
			"sort_order": 0,
			"is_active": 1,
		}
	)
	doc.insert(ignore_permissions=True)
	return doc.name


def guess_area_type(area_label: str) -> str:
	label = (area_label or "").strip().lower()
	if "out" in label or "teras" in label or "outdoor" in label:
		return "Outdoor"
	if "vip" in label:
		return "VIP"
	if "bar" in label:
		return "Bar"
	if "private" in label or "room" in label:
		return "Private Room"
	if "smok" in label:
		return "Smoking"
	return "Indoor"


_AREA_TYPES = {
	"Indoor",
	"Outdoor",
	"VIP",
	"Bar",
	"Private Room",
	"Smoking",
	"Other",
}


def sync_table_area_fields(table_name: str, restaurant_area: str | None):
	"""Keep floor + legacy location in sync when area changes."""
	if not restaurant_area:
		return
	if not frappe.db.exists("IMOGI Restaurant Area", restaurant_area):
		frappe.throw(_("Area {0} tidak ditemukan").format(restaurant_area))

	area = frappe.db.get_value(
		"IMOGI Restaurant Area",
		restaurant_area,
		["area_name", "restaurant_floor"],
		as_dict=True,
	)
	frappe.db.set_value(
		"IMOGI Restaurant Table",
		table_name,
		{
			"restaurant_area": restaurant_area,
			"restaurant_floor": area.restaurant_floor,
			"location": area.area_name,
		},
		update_modified=False,
	)
