# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _

from imogi_pos.imogi_pos.utils.subscription_billing import (
	apply_billing_payload,
	serialize_billing_status,
	sync_tier_from_billing,
	verify_billing_signature,
)


def _require_billing_admin():
	if frappe.session.user == "Administrator":
		return
	if frappe.has_permission("IMOGI POS Settings", "write"):
		return
	frappe.throw(_("Not permitted"), frappe.PermissionError)


@frappe.whitelist(allow_guest=True)
def billing_webhook():
	"""Inbound SaaS billing webhook (generic JSON).

	Headers:
	  X-IMOGI-Billing-Signature: HMAC-SHA256 hex of raw body (if secret configured)

	Body example:
	{
	  "event": "subscription.updated",
	  "subscription_id": "sub_abc123",
	  "plan": "starter-monthly",
	  "tier": "Starter",
	  "status": "active",
	  "current_period_end": "2026-07-09"
	}
	"""
	payload = frappe.request.get_data(as_text=True) if frappe.request else ""
	if not payload and frappe.form_dict:
		payload = frappe.as_json(frappe.form_dict)

	signature = (
		frappe.get_request_header("X-IMOGI-Billing-Signature")
		or frappe.get_request_header("X-IMOGI-Signature")
		or frappe.form_dict.get("signature")
	)
	if not verify_billing_signature(payload, signature):
		frappe.throw(_("Invalid billing webhook signature"), frappe.AuthenticationError)

	try:
		import json

		data = json.loads(payload) if isinstance(payload, str) else payload
		result = apply_billing_payload(data, source="webhook")
		frappe.local.response["http_status_code"] = 200
		return result
	except Exception as exc:
		frappe.log_error(title=_("Billing webhook failed"), message=frappe.get_traceback())
		frappe.local.response["http_status_code"] = 400
		return {"error": str(exc)}


@frappe.whitelist()
def get_billing_status():
	_require_billing_admin()
	return serialize_billing_status()


@frappe.whitelist()
def sync_subscription_tier():
	"""Manual re-sync tier from billing fields (Settings button)."""
	_require_billing_admin()
	return sync_tier_from_billing()
