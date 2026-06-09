# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _


def _get_users_for_roles(roles):
	users = set()
	for role in roles:
		for user in frappe.get_all("Has Role", filters={"role": role}, pluck="parent"):
			if frappe.db.get_value("User", user, "enabled"):
				users.add(user)
	return list(users)


def notify_pos_event(event_type, message, roles=None, doc=None, user=None):
	settings = frappe.get_single("IMOGI POS Settings")
	if not settings.enable_realtime_notifications:
		return

	roles = roles or []
	role_text = (settings.low_stock_alert_roles or "Sales Manager, System Manager").split(",")
	default_roles = [r.strip() for r in role_text if r.strip()]
	recipients = _get_users_for_roles(roles or default_roles)

	payload = {
		"type": event_type,
		"message": message,
		"doc": doc,
	}

	for recipient in recipients:
		frappe.publish_realtime("imogi_pos_notification", payload, user=recipient)

	if user:
		frappe.publish_realtime("imogi_pos_notification", payload, user=user)

	frappe.publish_realtime(f"imogi_pos_{event_type}", payload)


def notify_kitchen_new(order_name, kitchen_order):
	notify_pos_event(
		"kitchen_new",
		_("New kitchen order {0} from {1}").format(kitchen_order, order_name),
		roles=["IMOGI Kitchen Staff", "Sales Manager", "System Manager"],
		doc={"doctype": "IMOGI Kitchen Order", "name": kitchen_order},
	)


def notify_fulfillment_new(order_name, fulfillment_task):
	notify_pos_event(
		"fulfillment_new",
		_("New fulfillment task {0} from {1}").format(fulfillment_task, order_name),
		roles=["IMOGI Fulfillment Staff", "Sales Manager", "System Manager"],
		doc={"doctype": "IMOGI Fulfillment Task", "name": fulfillment_task},
	)


def notify_order_status(order_name, status):
	notify_pos_event(
		"order_status",
		_("Order {0} is now {1}").format(order_name, status),
		roles=["IMOGI Cashier", "Sales Manager", "System Manager"],
		doc={"doctype": "IMOGI POS Order", "name": order_name},
	)
