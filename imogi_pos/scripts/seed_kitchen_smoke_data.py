# Copyright (c) 2026, Imogi and contributors
"""Seed Kitchen Display smoke-test queue (Pending + Preparing).

Safe to re-run: resets demo kitchen orders back to active queue states.
"""

from __future__ import annotations

import frappe
from frappe.utils import now_datetime

from imogi_pos.imogi_pos.utils.central_kitchen import (
	backfill_kitchen_order_stations,
	ensure_default_kitchen_stations,
)


# Kitchen orders shown on KDS smoke test (must exist on site).
SMOKE_PENDING = ("IMO-KIT-2026-00003", "IMO-KIT-2026-00004")
SMOKE_PREPARING = ("IMO-KIT-2026-00002",)


def _sync_pos_order_in_kitchen(kitchen_order_name: str):
	pos_order = frappe.db.get_value("IMOGI Kitchen Order", kitchen_order_name, "pos_order")
	if pos_order and frappe.db.exists("Riwayat Order", pos_order):
		frappe.db.set_value("Riwayat Order", pos_order, "status", "In Kitchen", update_modified=False)
		return pos_order
	return None


def _set_kitchen_status(name: str, status: str, *, started_at=None):
	if not frappe.db.exists("IMOGI Kitchen Order", name):
		return {"name": name, "skipped": True, "reason": "not_found"}
	updates = {"status": status}
	if status == "Pending":
		updates["started_at"] = None
		updates["expected_ready_at"] = None
	elif status == "Preparing":
		updates["started_at"] = started_at or now_datetime()
	frappe.db.set_value("IMOGI Kitchen Order", name, updates, update_modified=True)
	pos_order = _sync_pos_order_in_kitchen(name)
	result = {"name": name, "status": status}
	if pos_order:
		result["pos_order"] = pos_order
	return result


def execute():
	if not frappe.db.get_single_value("IMOGI POS Settings", "enable_kitchen_display"):
		settings = frappe.get_single("IMOGI POS Settings")
		settings.enable_kitchen_display = 1
		settings.save(ignore_permissions=True)

	company = frappe.db.get_single_value("IMOGI POS Settings", "default_company")
	stations = ensure_default_kitchen_stations(company)
	backfill = backfill_kitchen_order_stations(company)

	results = []
	for name in SMOKE_PENDING:
		results.append(_set_kitchen_status(name, "Pending"))
	for name in SMOKE_PREPARING:
		results.append(_set_kitchen_status(name, "Preparing"))

	frappe.db.commit()
	frappe.publish_realtime("imogi_kitchen_updated", {"action": "smoke_seed"})

	from imogi_pos.api.kitchen import get_kitchen_queue

	queue = get_kitchen_queue()
	return {
		"stations": stations,
		"backfill": backfill,
		"seeded": results,
		"queue_count": len(queue),
		"pending": sum(1 for row in queue if row.get("status") == "Pending"),
		"preparing": sum(1 for row in queue if row.get("status") == "Preparing"),
		"orders": [row.get("name") for row in queue],
	}


def test_bump(kitchen_order="IMO-KIT-2026-00002"):
	"""Dev helper: verify Siap/Ready API after seed."""
	frappe.set_user("Administrator")
	from imogi_pos.api.kitchen import complete_kitchen_from_display

	return complete_kitchen_from_display(kitchen_order)
