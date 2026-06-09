# Copyright (c) 2026, Imogi and contributors
"""Marketplace order ingestion (GrabFood / GoFood / ShopeeFood)."""

import hashlib
import hmac
import json

import frappe
from frappe import _
from frappe.utils import cint, flt

from imogi_pos.imogi_pos.utils.flow import get_settings, resolve_company

MARKETPLACE_CHANNELS = ("GrabFood", "GoFood", "ShopeeFood")


def is_marketplace_enabled(settings=None):
	settings = settings or get_settings()
	return cint(settings.enable_marketplace_orders)


def verify_marketplace_signature(payload, signature, settings=None):
	settings = settings or get_settings()
	secret = settings.get_password("marketplace_webhook_secret") if settings.marketplace_webhook_secret else ""
	if not secret:
		return True
	if not signature:
		return False
	body = payload if isinstance(payload, str) else json.dumps(payload, sort_keys=True)
	expected = hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()
	return hmac.compare_digest(expected, signature)


def ingest_marketplace_order(payload, company=None):
	"""Create awaiting-payment order from marketplace webhook payload."""
	settings = get_settings()
	company = resolve_company(company, settings)
	if not is_marketplace_enabled(settings):
		frappe.throw(_("Marketplace orders are disabled in IMOGI POS Settings"))

	data = _parse_payload(payload)
	platform = data.get("platform") or data.get("order_channel")
	if platform not in MARKETPLACE_CHANNELS:
		frappe.throw(_("Unsupported marketplace platform: {0}").format(platform))

	external_id = (data.get("external_order_id") or data.get("order_id") or "").strip()
	if not external_id:
		frappe.throw(_("external_order_id is required"))

	existing = frappe.db.get_value(
		"IMOGI POS Order",
		{"external_order_id": external_id, "marketplace_platform": platform},
		"name",
	)
	if existing:
		order = frappe.get_doc("IMOGI POS Order", existing)
		return _serialize_marketplace_order(order)

	pos_profile = data.get("pos_profile") or settings.default_pos_profile
	warehouse = data.get("warehouse") or settings.default_warehouse
	customer = data.get("customer")
	if customer and not frappe.db.exists("Customer", customer):
		customer = None

	order = frappe.new_doc("IMOGI POS Order")
	order.company = company
	order.pos_profile = pos_profile
	order.order_channel = platform
	order.order_type = data.get("order_type") or "Delivery"
	order.order_source = "Marketplace"
	order.marketplace_platform = platform
	order.external_order_id = external_id
	order.customer = customer or _default_customer(pos_profile)
	order.remarks = data.get("remarks") or data.get("customer_note")
	order.delivery_address = data.get("delivery_address")

	items = data.get("items") or []
	if not items:
		frappe.throw(_("items is required"))

	for row in items:
		order.append(
			"items",
			{
				"item_code": row["item_code"],
				"qty": flt(row.get("qty") or 1),
				"rate": flt(row.get("rate") or 0),
				"warehouse": row.get("warehouse") or warehouse,
			},
		)

	order.insert(ignore_permissions=True)
	order.submit()
	order.db_set("status", "Awaiting Payment")
	frappe.db.commit()
	return _serialize_marketplace_order(order)


def complete_marketplace_order(
	order_name,
	payments_list,
	customer=None,
	discount_type=None,
	discount_value=None,
	voucher_code=None,
	loyalty_points_redeem=0,
	items=None,
):
	"""Apply cashier payment to an existing marketplace order instead of creating a duplicate."""
	order = frappe.get_doc("IMOGI POS Order", order_name)
	order.check_permission("write")
	if order.order_source != "Marketplace" or order.status != "Awaiting Payment" or order.docstatus != 1:
		frappe.throw(_("Order is not a pending marketplace order"))

	if customer and frappe.db.exists("Customer", customer):
		order.customer = customer

	parsed_items = items or [
		{
			"item_code": row.item_code,
			"qty": row.qty,
			"rate": row.rate,
			"uom": row.uom,
		}
		for row in order.items
	]
	if not parsed_items:
		frappe.throw(_("Order marketplace tidak memiliki item"))

	from imogi_pos.imogi_pos.utils.loyalty import apply_promotions_to_order, compute_checkout_totals

	settings = get_settings()
	totals = compute_checkout_totals(
		parsed_items,
		discount_type=discount_type,
		discount_value=discount_value,
		voucher_code=voucher_code,
		loyalty_points_redeem=loyalty_points_redeem,
		customer=order.customer,
		company=order.company,
		settings=settings,
	)

	order.discount_type = discount_type or ""
	order.discount_value = flt(discount_value)
	apply_promotions_to_order(order, totals)
	order.calculate_totals()

	order.db_set(
		{
			"customer": order.customer,
			"discount_type": order.discount_type,
			"discount_value": order.discount_value,
			"subtotal": flt(totals["subtotal"]),
			"discount_amount": flt(totals["discount_amount"]),
			"grand_total": flt(totals["grand_total"]),
			"promo_discount_amount": flt(totals["promo_discount"]),
			"applied_promo": totals.get("applied_promo_json") or "",
			"voucher_code": totals.get("voucher_code") or "",
			"voucher_discount_amount": flt(totals["voucher_discount"]),
			"loyalty_points_redeemed": cint(totals["loyalty_points_redeemed"]),
			"loyalty_discount_amount": flt(totals["loyalty_discount"]),
			"loyalty_points_earned": cint(totals["loyalty_points_earned"]),
		}
	)
	order.reload()

	order.payments = []
	for row in payments_list:
		if not row.get("mode_of_payment"):
			frappe.throw(_("Each payment must include mode_of_payment"))
		order.append(
			"payments",
			{
				"mode_of_payment": row["mode_of_payment"],
				"amount": flt(row.get("amount") or 0),
			},
		)

	order.calculate_totals()
	order.flags.ignore_validate_update_after_submit = True
	order.save(ignore_permissions=True)
	order.db_set("paid_amount", flt(order.paid_amount), update_modified=False)
	order.reload()
	return order


def list_pending_marketplace_orders(company=None, limit=20):
	company = resolve_company(company)
	rows = frappe.get_all(
		"IMOGI POS Order",
		filters={
			"company": company,
			"order_source": "Marketplace",
			"status": "Awaiting Payment",
			"docstatus": 1,
		},
		fields=[
			"name",
			"marketplace_platform",
			"external_order_id",
			"customer_name",
			"grand_total",
			"modified",
			"delivery_address",
		],
		order_by="modified desc",
		limit=cint(limit) or 20,
	)
	return rows


def _default_customer(pos_profile):
	customer = frappe.db.get_value("POS Profile", pos_profile, "customer")
	if customer:
		return customer
	customer = frappe.db.get_value("Customer", {"disabled": 0}, "name")
	if not customer:
		frappe.throw(_("Set a default customer on POS Profile"))
	return customer


def _parse_payload(payload):
	if isinstance(payload, dict):
		return payload
	if isinstance(payload, str):
		try:
			return json.loads(payload)
		except Exception:
			frappe.throw(_("Invalid marketplace payload JSON"))
	return frappe._dict(payload or {})


def _serialize_marketplace_order(order):
	return {
		"name": order.name,
		"status": order.status,
		"marketplace_platform": order.marketplace_platform,
		"external_order_id": order.external_order_id,
		"grand_total": flt(order.grand_total),
		"customer": order.customer,
		"delivery_address": order.delivery_address,
	}
