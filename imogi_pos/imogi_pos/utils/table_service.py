# Copyright (c) 2026, Imogi and contributors
"""Table lifecycle helpers for dine-in operations."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint

from imogi_pos.imogi_pos.utils.flow import get_settings, release_restaurant_table, reserve_restaurant_table


def get_table_doc(table_name: str):
	if not table_name:
		frappe.throw(_("Meja wajib dipilih"))
	if not frappe.db.exists("IMOGI Restaurant Table", table_name):
		frappe.throw(_("Meja {0} tidak ditemukan").format(table_name))
	return frappe.get_doc("IMOGI Restaurant Table", table_name)


def validate_table_assignable(table_name: str, *, allow_reserved: bool = False, exclude_order: str | None = None):
	"""Ensure a table can be reserved or assigned to a new party."""
	table = get_table_doc(table_name)
	if table.status == "Occupied":
		if table.current_order and table.current_order != exclude_order:
			frappe.throw(_("Meja {0} sedang dipakai").format(table.table_number))
	if table.status == "Reserved" and not allow_reserved:
		frappe.throw(_("Meja {0} sedang direservasi").format(table.table_number))
	return table


def mark_table_reserved(table_name: str):
	table = get_table_doc(table_name)
	if table.status == "Occupied" and table.current_order:
		frappe.throw(_("Meja {0} sedang dipakai").format(table.table_number))
	frappe.db.set_value("IMOGI Restaurant Table", table_name, {"status": "Reserved", "current_order": None})


def release_table_if_reserved(table_name: str):
	if not table_name:
		return
	table = get_table_doc(table_name)
	if table.status == "Reserved" and not table.current_order:
		frappe.db.set_value("IMOGI Restaurant Table", table_name, "status", "Available")


def release_table_reservation_link(table_name: str):
	release_table_if_reserved(table_name)


def sync_reservation_table_status(reservation_doc, previous_table: str | None = None):
	"""Keep restaurant table status aligned with reservation lifecycle."""
	if previous_table and previous_table != reservation_doc.restaurant_table:
		release_table_if_reserved(previous_table)

	table_name = reservation_doc.restaurant_table
	if not table_name:
		return

	status = (reservation_doc.status or "").strip()
	if status == "Booked":
		mark_table_reserved(table_name)
	elif status in ("Cancelled", "No Show", "Seated"):
		release_table_if_reserved(table_name)


def seat_waiting_guest_on_table(waiting_name: str, restaurant_table: str | None = None):
	doc = frappe.get_doc("IMOGI POS Waiting List", waiting_name)
	if doc.status != "Waiting":
		frappe.throw(_("Tamu sudah tidak dalam antrian"))

	updates = {"status": "Seated", "seated_at": frappe.utils.now_datetime()}
	if restaurant_table:
		validate_table_assignable(restaurant_table, allow_reserved=True)
		updates["restaurant_table"] = restaurant_table
		mark_table_reserved(restaurant_table)

	doc.db_set(updates)
	return doc.name


def cancel_table_reservation(reservation_name: str, status: str = "Cancelled"):
	if status not in ("Cancelled", "No Show"):
		frappe.throw(_("Status reservasi tidak valid"))

	doc = frappe.get_doc("IMOGI POS Table Reservation", reservation_name)
	table_name = doc.restaurant_table
	doc.db_set("status", status)
	if table_name:
		release_table_if_reserved(table_name)
	return doc.name


def seat_table_reservation(reservation_name: str):
	doc = frappe.get_doc("IMOGI POS Table Reservation", reservation_name)
	if doc.status != "Booked":
		frappe.throw(_("Reservasi sudah tidak aktif"))

	table_name = doc.restaurant_table
	doc.db_set("status", "Seated")
	if table_name:
		# Tamu sudah datang — lepas status dipesan agar meja siap dipakai / dibuka di kasir.
		release_table_if_reserved(table_name)

	return {
		"name": doc.name,
		"status": "Seated",
		"restaurant_table": table_name,
		"table_number": frappe.db.get_value("IMOGI Restaurant Table", table_name, "table_number")
		if table_name
		else None,
		"customer_name": doc.customer_name,
		"party_size": doc.party_size,
	}


def get_open_orders_by_table(company: str | None = None) -> dict[str, dict]:
	settings = get_settings()
	company = company or settings.default_company
	filters = {
		"docstatus": 1,
		"status": ["not in", ["Completed", "Cancelled", "Refunded"]],
		"restaurant_table": ["is", "set"],
	}
	if company:
		filters["company"] = company

	rows = frappe.get_all(
		"Riwayat Order",
		filters=filters,
		fields=["name", "restaurant_table", "status", "grand_total", "customer_name"],
		order_by="modified desc",
		limit=200,
	)
	by_table: dict[str, dict] = {}
	for row in rows:
		if row.restaurant_table and row.restaurant_table not in by_table:
			by_table[row.restaurant_table] = row
	return by_table


def list_tables_for_service(company=None, include_occupied=1, status=None):
	settings = get_settings()
	company = company or settings.default_company
	filters = {}
	if company:
		filters["company"] = company
	if status:
		filters["status"] = status
	elif not cint(include_occupied):
		filters["status"] = "Available"

	rows = frappe.get_all(
		"IMOGI Restaurant Table",
		filters=filters,
		fields=[
			"name",
			"table_number",
			"capacity",
			"status",
			"location",
			"current_order",
			"company",
		],
		order_by="table_number asc",
	)
	open_orders = get_open_orders_by_table(company)
	for row in rows:
		order = open_orders.get(row.name)
		row["open_order"] = order.name if order else None
		row["open_order_status"] = order.status if order else None
		row["open_order_total"] = order.grand_total if order else None
		row["open_order_customer"] = order.customer_name if order else None
	return rows
