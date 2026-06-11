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


def is_kitchen_item(item_code: str) -> bool:
	if frappe.db.get_value("Item", item_code, "imogi_is_kitchen_item"):
		return True

	settings = get_settings()
	groups = [g.strip() for g in (settings.kitchen_item_groups or "").split(",") if g.strip()]
	if not groups:
		return False

	item_group = frappe.db.get_value("Item", item_code, "item_group")
	return item_group in groups


def set_order_flags(order):
	from imogi_pos.imogi_pos.utils.feature_gating import is_setting_enabled

	settings = get_settings()
	if settings.business_type == "UMKM":
		order.requires_kitchen = 0
		order.requires_fulfillment = 0
		return

	kitchen_types = [t.strip() for t in (settings.fulfillment_for_order_types or "").split("\n") if t.strip()]

	order.requires_kitchen = 0
	if is_setting_enabled("enable_kitchen_display", settings):
		for row in order.items:
			if row.is_kitchen_item or is_kitchen_item(row.item_code):
				order.requires_kitchen = 1
				break

	order.requires_fulfillment = 0
	if is_setting_enabled("enable_fulfillment", settings):
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
		if order.discount_type == "Percent" and flt(order.discount_value):
			invoice.additional_discount_percentage = flt(order.discount_value)
		else:
			invoice.discount_amount = flt(order.discount_amount)

	invoice.set_missing_values()

	for pay in order.payments:
		invoice.append(
			"payments",
			{
				"mode_of_payment": pay.mode_of_payment,
				"amount": pay.amount,
			},
		)

	invoice.paid_amount = flt(order.paid_amount)
	invoice.base_paid_amount = flt(order.paid_amount)
	invoice.insert(ignore_permissions=True)
	invoice.submit()

	return invoice


def create_kitchen_order(order):
	from imogi_pos.imogi_pos.utils.feature_gating import is_setting_enabled

	settings = get_settings()
	ko = frappe.new_doc("IMOGI Kitchen Order")
	ko.pos_order = order.name
	ko.company = order.company
	ko.timer_minutes = 15

	if is_setting_enabled("enable_kitchen_display", settings):
		from imogi_pos.imogi_pos.utils.central_kitchen import resolve_kitchen_station

		station = resolve_kitchen_station(order, settings)
		if station:
			ko.kitchen_station = station

	for row in order.items:
		if not row.is_kitchen_item and not is_kitchen_item(row.item_code):
			continue
		ko.append(
			"items",
			{
				"item_code": row.item_code,
				"item_name": row.item_name,
				"qty": row.qty,
				"status": "Pending",
			},
		)

	if not ko.items:
		frappe.throw(_("No kitchen items found on this order"))

	ko.insert(ignore_permissions=True)
	ko.status = "Preparing"
	ko.started_at = now_datetime()
	ko.expected_ready_at = add_to_date(ko.started_at, minutes=ko.timer_minutes or 15)
	ko.save(ignore_permissions=True)

	from imogi_pos.imogi_pos.utils.notifications import notify_kitchen_new

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


def release_restaurant_table(order):
	if not order.restaurant_table:
		return
	table = frappe.get_doc("IMOGI Restaurant Table", order.restaurant_table)
	if table.current_order == order.name:
		table.db_set({"status": "Available", "current_order": None})
