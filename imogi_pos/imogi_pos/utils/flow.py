# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import add_to_date, flt, get_datetime, now_datetime


def get_settings():
	"""Singleton POS config for runtime gating — not a user-facing settings form."""
	return frappe.get_cached_doc("IMOGI POS Settings", "IMOGI POS Settings", ignore_permissions=True)


def resolve_company(company=None, settings=None):
	"""Resolve active company: explicit arg → user default → IMOGI settings."""
	settings = settings or get_settings()
	resolved = (company or "").strip()
	if not resolved:
		resolved = (
			frappe.defaults.get_user_default("Company")
			or settings.default_company
			or ""
		)
	resolved = (resolved or "").strip()
	if not resolved:
		frappe.throw(_("Company is required. Set default company in IMOGI POS Settings."))
	if not frappe.db.exists("Company", resolved):
		frappe.throw(_("Company {0} does not exist").format(resolved))
	return resolved


def settings_for_company(company=None, settings=None):
	"""Settings dict with company override for multi-company API/import calls."""
	settings = settings or get_settings()
	company = resolve_company(company, settings)
	if company == settings.default_company:
		return settings
	data = settings.as_dict()
	data["default_company"] = company
	return frappe._dict(data)


from imogi_pos.imogi_pos.utils.settings_flow import get_kitchen_item_groups, get_fulfillment_order_types


def is_kitchen_item(item_code: str) -> bool:
	if frappe.db.get_value("Item", item_code, "imogi_is_kitchen_item"):
		return True

	settings = get_settings()
	groups = get_kitchen_item_groups(settings)
	if not groups:
		return False

	item_group = frappe.db.get_value("Item", item_code, "item_group")
	return item_group in groups


def set_order_flags(order):
	from imogi_pos.imogi_pos.utils.feature_gating import is_fulfillment_operational, is_setting_enabled

	settings = get_settings()
	kitchen_types = get_fulfillment_order_types(settings)

	order.requires_kitchen = 0
	if is_setting_enabled("enable_kitchen_display", settings):
		for row in order.items:
			if row.is_kitchen_item or is_kitchen_item(row.item_code):
				order.requires_kitchen = 1
				break

	order.requires_fulfillment = 0
	if is_fulfillment_operational(settings):
		types = kitchen_types or ["Takeaway", "Delivery"]
		if order.order_type in types:
			order.requires_fulfillment = 1


def _pos_invoice_order_channel(order_channel):
	"""Map IMOGI order channel to a valid POS Invoice select option."""
	channel = order_channel or "Walk-in"
	allowed = {
		"Walk-in",
		"Mobile",
		"Web",
		"QR",
		"GrabFood",
		"GoFood",
		"ShopeeFood",
	}
	if channel in allowed:
		return channel
	return "Web"


def create_pos_invoice_from_order(order):
	settings = get_settings()
	pos_profile = order.pos_profile or settings.default_pos_profile
	if not pos_profile:
		frappe.throw(_("Set POS Profile on the order or in IMOGI POS Settings"))

	from imogi_pos.imogi_pos.utils.shift_opening import ensure_system_pos_opening_entry

	ensure_system_pos_opening_entry(pos_profile, order.company)

	profile = frappe.get_doc("POS Profile", pos_profile)
	invoice = frappe.new_doc("POS Invoice")
	invoice.is_pos = 1
	invoice.pos_profile = pos_profile
	invoice.company = order.company
	invoice.customer = order.customer
	invoice.imogi_pos_order = order.name
	invoice.imogi_order_channel = _pos_invoice_order_channel(order.order_channel)
	invoice.imogi_order_type = order.order_type

	default_warehouse = order.items[0].warehouse if order.items else None
	default_warehouse = default_warehouse or settings.default_warehouse or profile.warehouse

	for row in order.items:
		invoice.append(
			"items",
			{
				"item_code": row.item_code,
				"qty": row.qty,
				"rate": row.rate,
				"warehouse": row.warehouse or default_warehouse,
				"uom": row.uom,
			},
		)

	if flt(order.discount_amount):
		invoice.apply_discount_on = "Grand Total"
		# IMOGI stacks manual + promo + voucher discounts into discount_amount.
		invoice.discount_amount = flt(order.discount_amount)

	invoice.set_missing_values()
	invoice.calculate_taxes_and_totals()

	invoice_total = flt(invoice.rounded_total) or flt(invoice.grand_total)
	# set_missing_values() may pre-fill POS Profile payment rows — replace with order splits.
	invoice.set("payments", [])

	paid_total = 0
	for pay in order.payments or []:
		amount = flt(pay.amount)
		if amount <= 0:
			continue
		invoice.append(
			"payments",
			{
				"mode_of_payment": pay.mode_of_payment,
				"amount": amount,
			},
		)
		paid_total += amount

	if not order.payments:
		# Caller gave no payment info at all — default to one full payment.
		default_mode = (order.payment_method or "Cash").split(",")[0].strip() or "Cash"
		invoice.append(
			"payments",
			{"mode_of_payment": default_mode, "amount": invoice_total},
		)
		paid_total = invoice_total

	if abs(paid_total - invoice_total) > 0.01:
		frappe.throw(
			_("Total pembayaran ({0}) tidak sama dengan tagihan ({1})").format(
				paid_total, invoice_total
			)
		)

	invoice.paid_amount = paid_total
	invoice.base_paid_amount = paid_total
	invoice.insert(ignore_permissions=True)
	invoice.submit()

	return invoice


def create_pos_invoice_from_addon_items(order, item_rows, payments_list):
	"""POS Invoice for add-on items on an existing paid table order."""
	settings = get_settings()
	pos_profile = order.pos_profile or settings.default_pos_profile
	if not pos_profile:
		frappe.throw(_("Set POS Profile on the order or in IMOGI POS Settings"))

	from imogi_pos.imogi_pos.utils.shift_opening import ensure_system_pos_opening_entry

	ensure_system_pos_opening_entry(pos_profile, order.company)

	profile = frappe.get_doc("POS Profile", pos_profile)
	invoice = frappe.new_doc("POS Invoice")
	invoice.is_pos = 1
	invoice.pos_profile = pos_profile
	invoice.company = order.company
	invoice.customer = order.customer
	invoice.imogi_pos_order = order.name
	invoice.imogi_order_channel = _pos_invoice_order_channel(order.order_channel)
	invoice.imogi_order_type = order.order_type

	default_warehouse = settings.default_warehouse or profile.warehouse
	for row in item_rows or []:
		invoice.append(
			"items",
			{
				"item_code": row["item_code"],
				"qty": flt(row.get("qty") or 1),
				"rate": flt(row.get("rate") or 0),
				"warehouse": row.get("warehouse") or default_warehouse,
				"uom": row.get("uom"),
			},
		)

	if not invoice.items:
		frappe.throw(_("At least one item is required"))

	invoice.set_missing_values()
	invoice.calculate_taxes_and_totals()

	invoice_total = flt(invoice.rounded_total) or flt(invoice.grand_total)
	invoice.set("payments", [])

	paid_total = 0
	for pay in payments_list or []:
		amount = flt(pay.get("amount") if isinstance(pay, dict) else getattr(pay, "amount", 0))
		if amount <= 0:
			continue
		mode = (pay.get("mode_of_payment") if isinstance(pay, dict) else pay.mode_of_payment) or ""
		if not mode:
			frappe.throw(_("Each payment must include mode_of_payment"))
		invoice.append("payments", {"mode_of_payment": mode, "amount": amount})
		paid_total += amount

	if not payments_list:
		# Caller gave no payment info at all — default to one full payment.
		default_mode = (order.payment_method or "Cash").split(",")[0].strip() or "Cash"
		invoice.append("payments", {"mode_of_payment": default_mode, "amount": invoice_total})
		paid_total = invoice_total

	if abs(paid_total - invoice_total) > 0.01:
		frappe.throw(
			_("Total pembayaran ({0}) tidak sama dengan tagihan ({1})").format(
				paid_total, invoice_total
			)
		)

	invoice.paid_amount = paid_total
	invoice.base_paid_amount = paid_total
	invoice.insert(ignore_permissions=True)
	invoice.submit()
	return invoice


def create_kitchen_order(order):
	return create_kitchen_order_for_items(order, order.items)


def create_kitchen_order_for_items(order, item_rows):
	"""Create one or more kitchen tickets based on KDS station mode.

	Separate mode splits makanan → Dapur and minuman → Bar.
	Returns the primary kitchen order (Kitchen / Combined) for linking on Riwayat Order.
	"""
	from imogi_pos.imogi_pos.utils.feature_gating import is_setting_enabled
	from imogi_pos.imogi_pos.utils.central_kitchen import (
		KDS_MODE_SEPARATE,
		get_kds_station_mode,
		is_bar_kitchen_item,
		resolve_station_for_item_rows,
	)

	settings = get_settings()

	kitchen_rows = []
	for row in item_rows or []:
		item_code = row.item_code if hasattr(row, "item_code") else row.get("item_code")
		if not item_code:
			continue
		is_kitchen = row.is_kitchen_item if hasattr(row, "is_kitchen_item") else row.get("is_kitchen_item")
		if not is_kitchen and not is_kitchen_item(item_code):
			continue
		kitchen_rows.append(row)

	if not kitchen_rows:
		frappe.throw(_("No kitchen items found on this order"))

	mode = get_kds_station_mode(settings)
	buckets = []
	if mode == KDS_MODE_SEPARATE and is_setting_enabled("enable_kitchen_display", settings):
		food_rows = [
			r
			for r in kitchen_rows
			if not is_bar_kitchen_item(
				r.item_code if hasattr(r, "item_code") else r.get("item_code"), settings
			)
		]
		bar_rows = [
			r
			for r in kitchen_rows
			if is_bar_kitchen_item(
				r.item_code if hasattr(r, "item_code") else r.get("item_code"), settings
			)
		]
		if food_rows:
			buckets.append(food_rows)
		if bar_rows:
			buckets.append(bar_rows)
	else:
		buckets.append(kitchen_rows)

	created = []
	for bucket in buckets:
		ko = _insert_kitchen_order(order, bucket, settings, resolve_station_for_item_rows)
		created.append(ko)

	# Prefer non-Bar ticket as the primary link on Riwayat Order.
	primary = created[0]
	for ko in created:
		station_type = (
			frappe.db.get_value("IMOGI Kitchen Station", ko.kitchen_station, "station_type")
			if ko.kitchen_station
			else None
		)
		if station_type != "Bar":
			primary = ko
			break
	return primary


def _insert_kitchen_order(order, item_rows, settings, resolve_station_fn):
	from imogi_pos.imogi_pos.utils.notifications import notify_kitchen_new

	ko = frappe.new_doc("IMOGI Kitchen Order")
	ko.pos_order = order.name
	ko.company = order.company
	ko.timer_minutes = 15

	station = resolve_station_fn(order, item_rows, settings)
	if station:
		ko.kitchen_station = station

	for row in item_rows or []:
		item_code = row.item_code if hasattr(row, "item_code") else row.get("item_code")
		if not item_code:
			continue
		item_name = row.item_name if hasattr(row, "item_name") else row.get("item_name")
		qty = row.qty if hasattr(row, "qty") else row.get("qty")
		ko.append(
			"items",
			{
				"item_code": item_code,
				"item_name": item_name,
				"qty": qty,
				"status": "Pending",
			},
		)

	if not ko.items:
		frappe.throw(_("No kitchen items found on this order"))

	ko.status = "Pending"
	ko.insert(ignore_permissions=True)
	notify_kitchen_new(order.name, ko.name)
	frappe.publish_realtime("imogi_kitchen_updated", {"kitchen_order": ko.name, "action": "new"})
	return ko


def create_fulfillment_task(order):
	if frappe.db.exists("IMOGI Fulfillment Task", {"pos_order": order.name, "docstatus": ["<", 2]}):
		return frappe.get_doc(
			"IMOGI Fulfillment Task",
			frappe.db.get_value(
				"IMOGI Fulfillment Task", {"pos_order": order.name}, "name"
			),
		)

	ft = frappe.new_doc("IMOGI Fulfillment Task")
	ft.pos_order = order.name
	ft.company = order.company
	ft.status = "Open"
	ft.insert(ignore_permissions=True)

	from imogi_pos.imogi_pos.utils.notifications import notify_fulfillment_new

	notify_fulfillment_new(order.name, ft.name)
	frappe.publish_realtime("imogi_fulfillment_updated", {"task": ft.name, "action": "new"})
	return ft


def create_delivery_task(order):
	if frappe.db.exists("IMOGI Delivery Task", {"pos_order": order.name, "docstatus": ["<", 2]}):
		return frappe.get_doc(
			"IMOGI Delivery Task",
			frappe.db.get_value("IMOGI Delivery Task", {"pos_order": order.name}, "name"),
		)

	dt = frappe.new_doc("IMOGI Delivery Task")
	dt.pos_order = order.name
	dt.company = order.company
	dt.order_type = order.order_type

	if order.order_type == "Delivery":
		dt.status = "Pending"
	elif order.order_type == "Takeaway":
		dt.status = "Pending"
	else:
		dt.status = "Pending"

	dt.insert(ignore_permissions=True)
	return dt


def reserve_restaurant_table(order):
	if not order.restaurant_table:
		return
	frappe.db.set_value(
		"IMOGI Restaurant Table",
		order.restaurant_table,
		{"status": "Occupied", "current_order": order.name},
	)
	frappe.publish_realtime("imogi_table_service_updated", {"table": order.restaurant_table, "action": "occupied"})


def release_restaurant_table(order):
	if not order.restaurant_table:
		return
	table = frappe.get_doc("IMOGI Restaurant Table", order.restaurant_table)
	if table.current_order == order.name:
		table.db_set({"status": "Available", "current_order": None})
		frappe.publish_realtime("imogi_table_service_updated", {"table": order.restaurant_table, "action": "released"})
