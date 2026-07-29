# Copyright (c) 2026, Imogi and contributors
"""Smoke test: kitchen item tracking for Table Service order popup.

Run:
  bench --site project.pos execute imogi_pos.scripts.smoke_kitchen_tracking.run
"""

from __future__ import annotations

import frappe
from frappe.utils import cint

from imogi_pos.api.kitchen import (
	_sync_kitchen_order_items,
	build_pos_order_kitchen_tracking,
	update_kitchen_status,
)
from imogi_pos.api.table_api import get_pos_order_kitchen_tracking


def _fail(msg: str):
	raise RuntimeError(msg)


def _find_sample_kitchen_order():
	row = frappe.db.sql(
		"""
		select ko.name, ko.pos_order, ko.status, po.requires_kitchen
		from `tabIMOGI Kitchen Order` ko
		inner join `tabRiwayat Order` po on po.name = ko.pos_order
		where ko.docstatus < 2
			and po.requires_kitchen = 1
		order by ko.modified desc
		limit 1
		""",
		as_dict=True,
	)
	return row[0] if row else None


def _assert_tracking_shape(tracking: dict, *, label: str):
	if not isinstance(tracking, dict):
		_fail(f"{label}: response is not a dict")
	for key in ("has_kitchen", "pos_order", "items", "summary"):
		if key not in tracking:
			_fail(f"{label}: missing key {key}")
	summary = tracking.get("summary") or {}
	for key in ("pending", "preparing", "ready", "total"):
		if key not in summary:
			_fail(f"{label}: summary missing {key}")
	if tracking.get("has_kitchen") and not tracking.get("items"):
		_fail(f"{label}: has_kitchen=true but items empty")
	if tracking.get("items"):
		item = tracking["items"][0]
		for key in ("item_name", "qty", "status", "status_label"):
			if key not in item:
				_fail(f"{label}: item missing {key}")


def run():
	frappe.set_user("Administrator")
	report = {"steps": [], "ok": False}

	sample = _find_sample_kitchen_order()
	if not sample:
		_fail("No kitchen order with requires_kitchen POS order found on site")

	pos_order = sample.pos_order
	ko_name = sample.name
	report["sample"] = {"kitchen_order": ko_name, "pos_order": pos_order, "status": sample.status}

	# 1) Direct builder
	tracking = build_pos_order_kitchen_tracking(pos_order)
	_assert_tracking_shape(tracking, label="build_pos_order_kitchen_tracking")
	report["steps"].append(
		{
			"step": "build_tracking",
			"ok": True,
			"item_count": len(tracking.get("items") or []),
			"summary": tracking.get("summary"),
		}
	)

	if not tracking.get("has_kitchen"):
		_fail("Expected has_kitchen=true for sample order")

	# 2) Whitelisted API (table service)
	api_tracking = get_pos_order_kitchen_tracking(pos_order)
	_assert_tracking_shape(api_tracking, label="get_pos_order_kitchen_tracking")
	if len(api_tracking.get("items") or []) != len(tracking.get("items") or []):
		_fail("API item count mismatch vs builder")
	report["steps"].append({"step": "api_tracking", "ok": True})

	# 3) Status sync: Preparing -> items should move to Diproses
	original_status = frappe.db.get_value("IMOGI Kitchen Order", ko_name, "status")
	try:
		update_kitchen_status(ko_name, "Preparing")
		after_prep = build_pos_order_kitchen_tracking(pos_order)
		prep_count = (after_prep.get("summary") or {}).get("preparing", 0)
		if prep_count < 1:
			_fail("After Preparing, expected at least 1 item in preparing summary")
		report["steps"].append(
			{"step": "sync_preparing", "ok": True, "preparing": prep_count, "summary": after_prep.get("summary")}
		)

		# 4) Done -> items should be Ready/Selesai
		_sync_kitchen_order_items(ko_name, "Done")
		frappe.db.set_value("IMOGI Kitchen Order", ko_name, "status", "Done", update_modified=False)
		after_done = build_pos_order_kitchen_tracking(pos_order)
		ready_count = (after_done.get("summary") or {}).get("ready", 0)
		total = (after_done.get("summary") or {}).get("total", 0)
		if ready_count != total or total < 1:
			_fail(f"After Done, expected all items ready (ready={ready_count}, total={total})")
		report["steps"].append(
			{"step": "sync_done", "ok": True, "ready": ready_count, "summary": after_done.get("summary")}
		)
	finally:
		# Restore original kitchen status for dev data
		if original_status and original_status != "Done":
			frappe.db.set_value("IMOGI Kitchen Order", ko_name, "status", original_status, update_modified=True)
			if original_status == "Pending":
				_sync_kitchen_order_items(ko_name, "Pending")
				for row in frappe.get_all(
					"IMOGI Kitchen Order Item",
					filters={"parent": ko_name},
					pluck="name",
				):
					frappe.db.set_value("IMOGI Kitchen Order Item", row, "status", "Pending", update_modified=False)
			elif original_status == "Preparing":
				update_kitchen_status(ko_name, "Preparing")
		frappe.db.commit()

	report["ok"] = True
	print("Kitchen tracking smoke tests passed.")
	print(report)
	return report
