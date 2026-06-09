# Copyright (c) 2026, Imogi and contributors
"""Server-side offline checkout queue with idempotency."""

import json

import frappe
from frappe import _
from frappe.utils import cint, now_datetime

from imogi_pos.imogi_pos.utils.flow import get_settings


def is_offline_cashier_enabled(settings=None):
	settings = settings or get_settings()
	return cint(settings.enable_offline_cashier)


def get_existing_offline_order(client_id):
	if not client_id:
		return None
	return frappe.db.get_value(
		"IMOGI POS Offline Checkout",
		{"client_id": client_id, "status": "Synced"},
		["name", "order"],
		as_dict=True,
	)


def record_offline_checkout(client_id, payload, order_name=None, status="Synced", error=None):
	doc = frappe.get_doc(
		{
			"doctype": "IMOGI POS Offline Checkout",
			"client_id": client_id,
			"status": status,
			"payload": json.dumps(payload, default=str),
			"order": order_name,
			"synced_at": now_datetime() if status == "Synced" else None,
			"error_message": error,
		}
	)
	doc.insert(ignore_permissions=True)
	return doc.name


def mark_offline_failed(client_id, payload, error):
	return record_offline_checkout(client_id, payload, status="Failed", error=error)
