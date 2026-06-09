# Copyright (c) 2026, Imogi and contributors

import json

import frappe
from frappe import _

from imogi_pos.imogi_pos.utils.flow import get_settings


STATUS_EVENTS = {
	"Awaiting Payment": "order.created",
	"Paid": "order.paid",
	"Completed": "order.completed",
	"Cancelled": "order.cancelled",
	"Refunded": "order.refunded",
}


def emit_order_webhook(order_name, event=None):
	"""Serialize order and queue webhook if enabled."""
	from imogi_pos.api.order import _serialize_order

	order = frappe.get_doc("IMOGI POS Order", order_name)
	webhook_event = event or STATUS_EVENTS.get(order.status, "order.status_changed")
	dispatch_order_webhook(order_name, webhook_event, _serialize_order(order))


def dispatch_order_webhook(order_name, event, order_data=None):
	"""Queue HTTP POST to configured webhook URL on order lifecycle events."""
	settings = get_settings()
	if not settings.enable_order_api_webhook or not settings.order_api_webhook_url:
		return

	payload = {
		"event": event,
		"order_name": order_name,
		"order": order_data or {},
	}

	frappe.enqueue(
		"imogi_pos.imogi_pos.utils.webhook._send_webhook",
		queue="short",
		url=settings.order_api_webhook_url,
		payload=payload,
		now=frappe.flags.in_test,
	)


def _send_webhook(url, payload):
	try:
		import requests

		response = requests.post(
			url,
			data=json.dumps(payload),
			headers={"Content-Type": "application/json"},
			timeout=15,
		)
		if response.status_code >= 400:
			frappe.log_error(
				title=_("IMOGI Order webhook failed ({0})").format(payload.get("event")),
				message=f"URL: {url}\nStatus: {response.status_code}\nBody: {response.text[:2000]}",
			)
	except Exception:
		frappe.log_error(
			title=_("IMOGI Order webhook error ({0})").format(payload.get("event")),
			message=frappe.get_traceback(),
		)
