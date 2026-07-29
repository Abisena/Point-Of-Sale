# Copyright (c) 2026, Imogi and contributors
"""Reset occupied restaurant tables for manual QA (dev/staging only).

Clears table occupancy and closes dangling open orders so Table Service starts clean.

Run:
  bench --site project.pos execute imogi_pos.scripts.reset_table_service_tables.run
"""

from __future__ import annotations

import frappe

from imogi_pos.imogi_pos.utils.flow import release_restaurant_table


OPEN_ORDER_STATUSES = (
	"Draft",
	"Awaiting Payment",
	"Paid",
	"In Kitchen",
	"Kitchen Ready",
	"In Fulfillment",
	"Fulfilled",
	"In Service",
)


def _close_order(order_name: str) -> dict:
	order = frappe.get_doc("Riwayat Order", order_name)
	result = {"order": order_name, "table": order.restaurant_table, "action": None}

	if order.status in ("Completed", "Cancelled", "Refunded"):
		release_restaurant_table(order)
		result["action"] = "released_table_only"
		return result

	# Dev reset: avoid refund/cancel chains on paid POS invoices — mark completed.
	if order.pos_invoice:
		order.db_set({"status": "Completed"}, update_modified=True)
		release_restaurant_table(order)
		result["action"] = "completed_with_invoice"
		return result

	if order.docstatus == 1:
		try:
			order.cancel()
			result["action"] = "cancelled"
			return result
		except Exception as exc:
			order.db_set("status", "Cancelled", update_modified=True)
			release_restaurant_table(order)
			result["action"] = f"cancel_fallback:{exc.__class__.__name__}"
			return result

	order.db_set("status", "Cancelled", update_modified=True)
	release_restaurant_table(order)
	result["action"] = "cancelled_draft"
	return result


def run(dry_run: int = 0):
	frappe.set_user("Administrator")
	dry_run = int(dry_run or 0)

	tables = frappe.get_all(
		"IMOGI Restaurant Table",
		filters={"status": ["!=", "Available"]},
		fields=["name", "table_number", "status", "current_order", "restaurant_floor"],
	)
	orphan_orders = frappe.get_all(
		"Riwayat Order",
		filters={
			"restaurant_table": ["is", "set"],
			"status": ["in", list(OPEN_ORDER_STATUSES)],
		},
		fields=["name", "restaurant_table", "status", "pos_invoice"],
	)

	report = {
		"dry_run": bool(dry_run),
		"tables_before": len(tables),
		"orders_before": len(orphan_orders),
		"closed_orders": [],
		"released_tables": [],
	}

	order_names = set()
	for row in tables:
		if row.current_order:
			order_names.add(row.current_order)
	for row in orphan_orders:
		order_names.add(row.name)

	if dry_run:
		report["would_close_orders"] = sorted(order_names)
		report["would_reset_tables"] = [row.name for row in tables]
		print("Dry run — no changes committed.")
		print(report)
		return report

	for order_name in sorted(order_names):
		if not frappe.db.exists("Riwayat Order", order_name):
			continue
		report["closed_orders"].append(_close_order(order_name))

	# Force-release any table still marked occupied.
	still_busy = frappe.get_all(
		"IMOGI Restaurant Table",
		filters={"status": ["!=", "Available"]},
		fields=["name", "table_number", "current_order"],
	)
	for row in still_busy:
		frappe.db.set_value(
			"IMOGI Restaurant Table",
			row.name,
			{"status": "Available", "current_order": None},
			update_modified=True,
		)
		report["released_tables"].append(row.name)

	frappe.db.commit()
	frappe.publish_realtime("imogi_table_service_updated", {"action": "reset_tables"})

	available = frappe.db.count("IMOGI Restaurant Table", {"status": "Available"})
	occupied = frappe.db.count("IMOGI Restaurant Table", {"status": "Occupied"})
	report["available_after"] = available
	report["occupied_after"] = occupied

	print(f"Table Service reset done — {available} kosong, {occupied} terisi.")
	print(report)
	return report
