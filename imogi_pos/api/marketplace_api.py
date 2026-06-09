# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _

from imogi_pos.api.cashier import _require_cashier_access
from imogi_pos.imogi_pos.utils.flow import resolve_company
from imogi_pos.imogi_pos.utils.marketplace import (
	ingest_marketplace_order,
	is_marketplace_enabled,
	list_pending_marketplace_orders,
	verify_marketplace_signature,
)


@frappe.whitelist()
def list_marketplace_orders(company=None, limit=20):
	_require_cashier_access()
	return {
		"enabled": is_marketplace_enabled(),
		"orders": list_pending_marketplace_orders(company=resolve_company(company), limit=limit),
	}


@frappe.whitelist(allow_guest=True)
def marketplace_webhook():
	"""Webhook for GrabFood / GoFood / ShopeeFood order payloads."""
	payload = frappe.request.get_data(as_text=True) if frappe.request else ""
	if not payload and frappe.form_dict:
		payload = frappe.form_dict

	signature = frappe.get_request_header("X-IMOGI-Signature") or frappe.form_dict.get("signature")
	if not verify_marketplace_signature(payload, signature):
		frappe.throw(_("Invalid marketplace signature"), frappe.AuthenticationError)

	try:
		result = ingest_marketplace_order(payload)
		frappe.local.response["http_status_code"] = 200
		return result
	except Exception as exc:
		frappe.log_error(title=_("Marketplace webhook failed"), message=frappe.get_traceback())
		frappe.local.response["http_status_code"] = 400
		return {"error": str(exc)}


@frappe.whitelist()
def import_marketplace_order(order_name):
	"""Cashier loads marketplace order items into context."""
	_require_cashier_access()
	order = frappe.get_doc("IMOGI POS Order", order_name)
	order.check_permission("read")
	if order.order_source != "Marketplace" or order.status != "Awaiting Payment":
		frappe.throw(_("Order is not a pending marketplace order"))

	return {
		"name": order.name,
		"marketplace_platform": order.marketplace_platform,
		"external_order_id": order.external_order_id,
		"customer": order.customer,
		"grand_total": order.grand_total,
		"delivery_address": order.delivery_address,
		"items": [
			{
				"item_code": row.item_code,
				"item_name": row.item_name,
				"qty": row.qty,
				"rate": row.rate,
				"uom": row.uom,
			}
			for row in order.items
		],
	}
