# Copyright (c) 2026, Imogi and contributors

import json

import frappe
from frappe import _
from frappe.utils import cint

from imogi_pos.api.cashier import _require_cashier_access
from imogi_pos.imogi_pos.utils.payment_gateway import (
	_qr_string_to_png_bytes,
	create_gateway_payment,
	get_gateway_settings,
	get_webhook_url,
	is_gateway_enabled,
	is_qris_payment_mode,
	refresh_gateway_payment,
	serialize_gateway_payment,
)


@frappe.whitelist()
def get_payment_gateway_status():
	"""Cashier/settings: whether PG is configured."""
	try:
		cfg = get_gateway_settings()
		return {
			"enabled": True,
			"provider": cfg["provider"],
			"sandbox": cint(cfg["sandbox"]),
			"webhook_url": get_webhook_url(cfg["provider"]),
		}
	except frappe.ValidationError:
		return {"enabled": False}


@frappe.whitelist()
def create_qris_payment(
	items,
	customer=None,
	discount_type=None,
	discount_value=None,
	voucher_code=None,
	loyalty_points_redeem=0,
	mode_of_payment="QRIS",
	branch=None,
	pos_profile=None,
):
	"""Create dynamic QRIS charge for current cart."""
	_require_cashier_access()
	if not is_gateway_enabled():
		frappe.throw(_("Payment gateway belum diaktifkan di IMOGI POS Settings"))

	parsed_items = _parse_json(items, "items") or []
	if not parsed_items:
		frappe.throw(_("Keranjang kosong"))

	return create_gateway_payment(
		parsed_items,
		customer=customer,
		discount_type=discount_type,
		discount_value=discount_value,
		voucher_code=voucher_code,
		loyalty_points_redeem=loyalty_points_redeem,
		branch=branch,
		pos_profile=pos_profile,
		mode_of_payment=mode_of_payment,
	)


@frappe.whitelist()
def poll_gateway_payment(payment_name):
	_require_cashier_access()
	return refresh_gateway_payment(payment_name)


@frappe.whitelist()
def get_gateway_payment(payment_name):
	_require_cashier_access()
	doc = frappe.get_doc("IMOGI POS Gateway Payment", payment_name)
	return serialize_gateway_payment(doc)


@frappe.whitelist()
def get_qr_image(payment_name):
	"""Return QRIS PNG for <img src> (works even when client JS is cached)."""
	_require_cashier_access()
	doc = frappe.get_doc("IMOGI POS Gateway Payment", payment_name)
	doc.check_permission("read")
	payload = {}
	try:
		payload = json.loads(doc.qris_payload or "{}")
	except Exception:
		payload = {}
	qr_string = (payload.get("qr_string") or "").strip()
	if not qr_string and payload.get("qr_url") and not str(payload.get("qr_url")).startswith(("http://", "https://")):
		qr_string = str(payload.get("qr_url")).strip()
	png = _qr_string_to_png_bytes(qr_string)
	if not png:
		frappe.throw(_("QR code tidak tersedia"))
	frappe.local.response.filename = f"qris-{payment_name}.png"
	frappe.local.response.filecontent = png
	frappe.local.response.type = "binary"


@frappe.whitelist()
def get_gateway_order(order_name):
	_require_cashier_access()
	from imogi_pos.api.order import _serialize_order

	order = frappe.get_doc("Riwayat Order", order_name)
	order.check_permission("read")
	return _serialize_order(order)


@frappe.whitelist(allow_guest=True)
def gateway_webhook(provider=None):
	"""Webhook endpoint for Midtrans / Xendit."""
	from imogi_pos.imogi_pos.utils.payment_gateway import handle_gateway_webhook

	payload = frappe.request.get_data(as_text=True) if frappe.request else ""
	if not payload and frappe.form_dict:
		payload = frappe.form_dict

	try:
		result = handle_gateway_webhook(provider, payload)
		frappe.local.response["http_status_code"] = 200
		return result
	except Exception as exc:
		frappe.log_error(title="IMOGI Gateway Webhook", message=frappe.get_traceback())
		frappe.local.response["http_status_code"] = 400
		return {"ok": False, "error": str(exc)}


def _parse_json(value, label):
	if value is None:
		return None
	if isinstance(value, (list, dict)):
		return value
	try:
		return json.loads(value)
	except Exception:
		frappe.throw(_("{0} must be valid JSON").format(label))
