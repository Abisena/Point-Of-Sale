# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import cint

from imogi_pos.api.cashier import _require_cashier_access
from imogi_pos.imogi_pos.utils.feature_gating import is_feature_operational, require_feature_operational
from imogi_pos.imogi_pos.utils.flow import get_settings, release_restaurant_table, reserve_restaurant_table
from imogi_pos.imogi_pos.utils.table_service import (
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
def list_restaurant_tables(company=None, status=None, include_occupied=1):
	"""List restaurant tables for cashier table picker."""
	_require_cashier_access()
	require_feature_operational("table_management")

	rows = list_tables_for_service(company=company, include_occupied=include_occupied, status=status)
	return {"tables": rows}


@frappe.whitelist()
def get_table_service_board(company=None):
	"""Unified payload for the Table Service desk page."""
	_require_table_service_access()
	require_feature_operational("table_management")
	settings = get_settings()
	company = company or settings.default_company

	board = {
		"company": company,
		"tables": list_tables_for_service(company=company, include_occupied=1),
		"reservations": [],
		"waiting": [],
		"refresh_seconds": cint(settings.dashboard_refresh_seconds) or 30,
		"features": {
			"table_management": True,
			"move_table": is_feature_operational("move_table"),
			"merge_table": is_feature_operational("merge_table"),
			"table_reservation": is_feature_operational("table_reservation"),
			"waiting_list": is_feature_operational("waiting_list"),
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
def create_restaurant_table(table_number, capacity=4, location=None, company=None):
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

	if frappe.db.exists("IMOGI Restaurant Table", table_number):
		frappe.throw(_("Meja {0} sudah ada").format(table_number))

	doc = frappe.get_doc(
		{
			"doctype": "IMOGI Restaurant Table",
			"table_number": table_number,
			"company": company,
			"capacity": capacity,
			"location": (location or "").strip() or None,
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
		"status": doc.status,
	}


@frappe.whitelist()
def move_restaurant_table(order_name, new_table, company=None):
	"""Move an open order to another table."""
	_require_cashier_access()
	require_feature_operational("move_table")

	if not order_name or not new_table:
		frappe.throw(_("Order dan meja tujuan wajib diisi"))

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
