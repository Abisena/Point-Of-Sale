# Copyright (c) 2026, Imogi and contributors

import time

import frappe
from frappe.utils import cint, now_datetime


def check_low_stock_scheduled():
	settings = frappe.get_single("IMOGI POS Settings")
	interval = max(int(settings.low_stock_check_interval or 180), 60)
	cache_key = "imogi_last_stock_check"
	last = frappe.cache.get_value(cache_key) or 0
	now = time.time()
	if now - float(last) < interval:
		return
	frappe.cache.set_value(cache_key, now, expires_in_sec=interval * 2)
	check_low_stock()


def _branch_warehouses(settings):
	warehouses = []
	if cint(settings.multi_branch):
		warehouses = frappe.get_all(
			"IMOGI Branch",
			filters={"is_active": 1, "company": settings.default_company},
			pluck="warehouse",
		)
	if settings.default_warehouse and settings.default_warehouse not in warehouses:
		warehouses.append(settings.default_warehouse)
	return [wh for wh in warehouses if wh]


def check_low_stock():
	"""Step 06 — periodic low stock alerts + optional auto Purchase Request per warehouse."""
	from imogi_pos.imogi_pos.utils.low_stock import create_auto_purchase_requests, get_low_stock_items

	settings = frappe.get_single("IMOGI POS Settings")
	warehouses = _branch_warehouses(settings)
	if not warehouses:
		return

	all_low_items = []
	for warehouse in warehouses:
		low_items = get_low_stock_items(limit=50, warehouse=warehouse)
		for row in low_items:
			row["warehouse"] = warehouse
		all_low_items.extend(low_items)

	if not all_low_items:
		return

	created_mrs = create_auto_purchase_requests(all_low_items, settings=settings)
	if created_mrs:
		frappe.db.commit()

	all_low_items.sort(key=lambda row: (row.get("warehouse") or "", row.get("actual_qty", 0)))
	by_warehouse = {}
	for row in all_low_items:
		by_warehouse.setdefault(row["warehouse"], []).append(row)

	message_parts = []
	for warehouse, items in by_warehouse.items():
		lines = "".join(
			f"<li>{i['item_code']}: {i['actual_qty']} / {i['reorder_level']}</li>" for i in items[:10]
		)
		message_parts.append(f"<p><b>{warehouse}</b></p><ul>{lines}</ul>")

	message = "".join(message_parts)

	roles = [r.strip() for r in (settings.low_stock_alert_roles or "").split(",") if r.strip()]
	recipients = []
	for role in roles:
		recipients.extend(
			frappe.get_all("Has Role", filters={"role": role}, pluck="parent", distinct=True)
		)

	recipients = list(set(recipients))
	if recipients and settings.enable_realtime_notifications:
		for user in recipients:
			frappe.publish_realtime(
				"imogi_low_stock_alert",
				{
					"items": all_low_items[:20],
					"warehouses": list(by_warehouse.keys()),
					"material_requests": created_mrs,
				},
				user=user,
			)

	frappe.logger("imogi_pos").info(
		f"Low stock check: {len(all_low_items)} items across {len(by_warehouse)} warehouse(s)"
		+ (f"; auto MR: {', '.join(created_mrs)}" if created_mrs else "")
	)


def check_billing_expiry_scheduled():
	from imogi_pos.imogi_pos.utils.subscription_billing import check_billing_expiry

	check_billing_expiry()
