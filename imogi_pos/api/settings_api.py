# Copyright (c) 2026, Imogi and contributors

import secrets

import frappe
from frappe import _

from imogi_pos.imogi_pos.utils.flow import get_settings


def _cache_key(user=None):
	return f"imogi_order_api_secret:{user or frappe.session.user}"


def _generate_credentials():
	api_key = secrets.token_urlsafe(12)[:20]
	api_secret = secrets.token_urlsafe(24)
	return api_key, api_secret


def _store_pending_secret(api_secret):
	frappe.cache().set_value(_cache_key(), api_secret, expires_in_sec=600)


def _pop_pending_secret():
	key = _cache_key()
	secret = frappe.cache().get_value(key)
	if secret:
		frappe.cache().delete_value(key)
	return secret


def _can_manage_order_api():
	if frappe.session.user == "Guest":
		return False
	if frappe.session.user == "Administrator":
		return True
	if any(role in frappe.get_roles() for role in ("System Manager", "Sales Manager")):
		return True
	return frappe.has_permission("IMOGI POS Settings", "write")


@frappe.whitelist()
def regenerate_order_api_credentials():
	if not _can_manage_order_api():
		frappe.throw(_("Not permitted to manage Order API credentials"), frappe.PermissionError)

	settings = frappe.get_single("IMOGI POS Settings")
	api_key, api_secret = _generate_credentials()

	settings.enable_order_api = 1
	settings.order_api_key = api_key
	settings.order_api_secret = api_secret
	settings.save(ignore_permissions=True)
	frappe.db.commit()

	return {
		"api_key": api_key,
		"api_secret": api_secret,
		"message": _("New API credentials generated. Copy the secret now — it will not be shown again."),
	}


@frappe.whitelist()
def get_pending_api_credentials():
	"""Return one-time secret after save/generate (same session user)."""
	if not _can_manage_order_api():
		return None

	settings = get_settings()
	secret = _pop_pending_secret()
	if not secret or not settings.order_api_key:
		return None

	return {
		"api_key": settings.order_api_key,
		"api_secret": secret,
	}


def assign_credentials_on_enable(doc):
	"""Called from IMOGI POS Settings.validate when API is first enabled."""
	if not doc.enable_order_api:
		return

	if doc.order_api_key and doc.get_password("order_api_secret", raise_exception=False):
		return

	api_key, api_secret = _generate_credentials()
	doc.order_api_key = api_key
	doc.order_api_secret = api_secret
	_store_pending_secret(api_secret)


def get_api_documentation():
	settings = get_settings()
	site = frappe.utils.get_url()

	endpoints = {
		"create": {
			"label": _("Create order"),
			"method": "POST",
			"url": f"{site}/api/method/imogi_pos.api.order.create_order",
			"params": "items (JSON), order_channel, order_type, customer, auto_pay, payments (JSON)",
		},
		"pay": {
			"label": _("Pay order"),
			"method": "POST",
			"url": f"{site}/api/method/imogi_pos.api.order.pay_order",
			"params": "order_name, payments (JSON)",
		},
		"status": {
			"label": _("Order status"),
			"method": "GET/POST",
			"url": f"{site}/api/method/imogi_pos.api.order.get_order_status",
			"params": "order_name",
		},
		"void": {
			"label": _("Void order"),
			"method": "POST",
			"url": f"{site}/api/method/imogi_pos.api.order.void_order",
			"params": "order_name, reason",
		},
		"refund": {
			"label": _("Refund order"),
			"method": "POST",
			"url": f"{site}/api/method/imogi_pos.api.order.refund_order",
			"params": "order_name, reason",
		},
		"partial_refund": {
			"label": _("Partial refund"),
			"method": "POST",
			"url": f"{site}/api/method/imogi_pos.api.order.partial_refund_order",
			"params": "order_name, refund_items (JSON), reason",
		},
		"items": {
			"label": _("List products"),
			"method": "GET/POST",
			"url": f"{site}/api/method/imogi_pos.api.catalog.get_items",
			"params": "search, item_group, start, limit, pos_profile",
		},
		"item": {
			"label": _("Get product"),
			"method": "GET/POST",
			"url": f"{site}/api/method/imogi_pos.api.catalog.get_item",
			"params": "item_code, pos_profile",
		},
		"customers": {
			"label": _("Search customers"),
			"method": "GET/POST",
			"url": f"{site}/api/method/imogi_pos.api.customer_api.search_customers",
			"params": "search, limit",
		},
		"customer": {
			"label": _("Get customer"),
			"method": "GET/POST",
			"url": f"{site}/api/method/imogi_pos.api.customer_api.get_customer",
			"params": "customer",
		},
		"create_customer": {
			"label": _("Create customer"),
			"method": "POST",
			"url": f"{site}/api/method/imogi_pos.api.customer_api.create_customer",
			"params": "customer_name, customer_type, mobile_no, email_id",
		},
	}

	example_items = [{"item_code": "ITEM-001", "qty": 1, "rate": 15000}]
	example_payments = [{"mode_of_payment": "Cash", "amount": 15000}]

	return {
		"enabled": bool(settings.enable_order_api),
		"has_credentials": bool(
			settings.order_api_key and settings.get_password("order_api_secret", raise_exception=False)
		),
		"api_key": settings.order_api_key or "",
		"api_user": settings.order_api_user or "Administrator",
		"base_url": site,
		"auth_header": "X-Imogi-Api-Key: {api_key}\nX-Imogi-Api-Secret: {api_secret}",
		"webhook_enabled": bool(settings.enable_order_api_webhook),
		"webhook_url": settings.order_api_webhook_url or "",
		"webhook_events": [
			"order.created",
			"order.completed",
			"order.cancelled",
			"order.refunded",
			"order.partially_refunded",
		],
		"endpoints": endpoints,
		"example_create_body": {
			"items": example_items,
			"order_channel": "Web",
			"order_type": "Takeaway",
			"auto_pay": 1,
			"payments": example_payments,
			"discount_type": "Percent",
			"discount_value": 10,
		},
		"example_curl": (
			f'curl -X POST "{site}/api/method/imogi_pos.api.order.create_order" \\\n'
			f'  -H "X-Imogi-Api-Key: {{api_key}}" \\\n'
			f'  -H "X-Imogi-Api-Secret: {{api_secret}}" \\\n'
			f"  --data-urlencode 'items={frappe.as_json(example_items)}' \\\n"
			f"  --data-urlencode 'auto_pay=1' \\\n"
			f"  --data-urlencode 'payments={frappe.as_json(example_payments)}'"
		),
		"example_python": (
			"export IMOGI_API_URL='"
			+ site
			+ "' IMOGI_API_KEY='...' IMOGI_API_SECRET='...'\n"
			"python apps/imogi_pos/scripts/test_order_api.py create --auto-pay"
		),
		"test_scripts": [
			"apps/imogi_pos/scripts/test_order_api.py",
			"apps/imogi_pos/scripts/test_phase1_api.py",
			"apps/imogi_pos/scripts/test_order_api.sh",
			"apps/imogi_pos/scripts/test_order_api.env.example",
		],
	}
