# Copyright (c) 2026, Imogi and contributors
"""Midtrans / Xendit QRIS payment helpers for IMOGI Kasir."""

import json
import re
import base64

import frappe
import requests
from frappe import _
from frappe.utils import cint, flt, get_datetime, now_datetime

from imogi_pos.imogi_pos.utils.branch import resolve_active_branch
from imogi_pos.imogi_pos.utils.flow import get_settings


PAID_STATUSES = frozenset({"settlement", "capture", "success", "paid", "completed", "succeeded"})
FAILED_STATUSES = frozenset({"deny", "cancel", "expire", "failure", "failed", "expired"})


def get_gateway_settings():
	settings = get_settings()
	if not cint(settings.enable_payment_gateway):
		return None
	provider = (settings.payment_gateway_provider or settings.payment_gateway or "").strip()
	if provider not in ("Midtrans", "Xendit"):
		low = provider.lower()
		if "midtrans" in low:
			provider = "Midtrans"
		elif "xendit" in low:
			provider = "Xendit"
		else:
			return None
	server_key = settings.get_password("payment_gateway_key", raise_exception=False) or ""
	if not server_key:
		frappe.throw(_("Isi Gateway Server Key di IMOGI POS Settings"))
	return {
		"provider": provider,
		"server_key": server_key,
		"client_key": (settings.payment_gateway_client_key or "").strip(),
		"sandbox": cint(settings.payment_gateway_sandbox),
	}


def is_gateway_enabled():
	try:
		return bool(get_gateway_settings())
	except frappe.ValidationError:
		return False


def is_qris_payment_mode(mode_of_payment):
	if not mode_of_payment:
		return False
	name = (mode_of_payment or "").strip().lower()
	return "qris" in name or name in ("e-wallet", "ewallet", "go-pay", "gopay")


def _unique_external_id(prefix="IMOGI"):
	return f"{prefix}-{frappe.generate_hash(length=12)}"


def _midtrans_base_url(sandbox):
	return "https://api.sandbox.midtrans.com" if sandbox else "https://api.midtrans.com"


def _xendit_base_url():
	return "https://api.xendit.co"


def _create_midtrans_qris(external_id, amount, currency="IDR", sandbox=1):
	cfg = get_gateway_settings()
	auth = (cfg["server_key"], "")
	url = f"{_midtrans_base_url(sandbox)}/v2/charge"
	payload = {
		"payment_type": "qris",
		"transaction_details": {
			"order_id": external_id,
			"gross_amount": int(round(flt(amount))),
		},
		"qris": {"acquirer": "gopay"},
	}
	resp = requests.post(url, json=payload, auth=auth, timeout=30)
	data = resp.json() if resp.content else {}
	if resp.status_code >= 400 or str(data.get("status_code")) not in ("201", "200", ""):
		message = data.get("status_message") or data.get("error_messages") or resp.text
		frappe.throw(_("Midtrans error: {0}").format(message))
	actions = data.get("actions") or []
	qr_url = next((a.get("url") for a in actions if a.get("name") == "generate-qr-code"), None)
	qr_string = (data.get("qr_string") or "").strip()
	return {
		"external_id": external_id,
		"transaction_id": data.get("transaction_id"),
		"qr_url": qr_url,
		"qr_string": qr_string,
		"raw": data,
	}


def _create_xendit_qris(external_id, amount, currency="IDR"):
	cfg = get_gateway_settings()
	token = base64.b64encode(f"{cfg['server_key']}:".encode()).decode()
	headers = {"Authorization": f"Basic {token}"}
	callback = get_webhook_url("Xendit")
	payload = {
		"external_id": external_id,
		"type": "DYNAMIC",
		"amount": int(round(flt(amount))),
		"currency": currency or "IDR",
	}
	if callback:
		payload["callback_url"] = callback
	url = f"{_xendit_base_url()}/qr_codes"
	resp = requests.post(url, json=payload, headers=headers, timeout=30)
	data = resp.json() if resp.content else {}
	if resp.status_code >= 400:
		message = data.get("message") or resp.text
		frappe.throw(_("Xendit error: {0}").format(message))
	return {
		"external_id": external_id,
		"transaction_id": data.get("id"),
		"qr_url": data.get("qr_string") or data.get("callback_url"),
		"qr_string": data.get("qr_string") or "",
		"raw": data,
	}


def get_webhook_url(provider=None):
	try:
		return frappe.utils.get_url(
			f"/api/method/imogi_pos.api.payment_gateway_api.gateway_webhook?provider={provider or ''}"
		)
	except Exception:
		return ""


def create_gateway_payment(
	items,
	customer=None,
	discount_type=None,
	discount_value=None,
	voucher_code=None,
	loyalty_points_redeem=0,
	branch=None,
	pos_profile=None,
	mode_of_payment="QRIS",
):
	"""Create QRIS charge and persist IMOGI POS Gateway Payment."""
	cfg = get_gateway_settings()
	branch_ctx = resolve_active_branch(branch_code=branch, pos_profile=pos_profile)
	from imogi_pos.imogi_pos.utils.loyalty import compute_checkout_totals

	totals = compute_checkout_totals(
		items,
		discount_type=discount_type,
		discount_value=discount_value,
		voucher_code=voucher_code,
		loyalty_points_redeem=loyalty_points_redeem,
		customer=customer,
		company=branch_ctx["company"],
	)
	amount = flt(totals["grand_total"])
	if amount <= 0:
		frappe.throw(_("Total pembayaran harus lebih dari 0"))

	external_id = _unique_external_id()
	currency = branch_ctx.get("currency") or frappe.db.get_value("Company", branch_ctx["company"], "default_currency") or "IDR"

	if cfg["provider"] == "Midtrans":
		charge = _create_midtrans_qris(external_id, amount, currency=currency, sandbox=cfg["sandbox"])
	else:
		charge = _create_xendit_qris(external_id, amount, currency=currency)

	doc = frappe.get_doc(
		{
			"doctype": "IMOGI POS Gateway Payment",
			"status": "Pending",
			"provider": cfg["provider"],
			"external_id": external_id,
			"company": branch_ctx["company"],
			"pos_profile": branch_ctx["pos_profile"],
			"branch_code": branch_ctx.get("branch_code") or "",
			"amount": amount,
			"currency": currency,
			"customer": customer,
			"discount_type": discount_type or "",
			"discount_value": flt(discount_value),
			"qris_payload": json.dumps(charge, default=str),
			"cart_snapshot": json.dumps(
				{
					"items": items,
					"mode_of_payment": mode_of_payment,
					"order_type": "Takeaway",
					"order_channel": "Walk-in",
					"voucher_code": totals.get("voucher_code") or "",
					"loyalty_points_redeem": totals.get("loyalty_points_redeemed") or 0,
				}
			),
		}
	)
	doc.insert(ignore_permissions=True)
	frappe.db.commit()

	return {
		"name": doc.name,
		"external_id": external_id,
		"amount": amount,
		"currency": currency,
		"provider": cfg["provider"],
		"qr_string": charge.get("qr_string") or "",
		"qr_url": charge.get("qr_url") or "",
		"status": doc.status,
	}


def _cart_total(items, discount_type=None, discount_value=None):
	subtotal = 0
	for row in items or []:
		subtotal += flt(row.get("qty")) * flt(row.get("rate"))
	discount_value = flt(discount_value)
	if discount_type == "Percent":
		subtotal -= subtotal * discount_value / 100
	elif discount_type == "Amount":
		subtotal -= discount_value
	return max(0, flt(subtotal))


def _midtrans_status(external_id, sandbox=1):
	cfg = get_gateway_settings()
	url = f"{_midtrans_base_url(sandbox)}/v2/{external_id}/status"
	resp = requests.get(url, auth=(cfg["server_key"], ""), timeout=20)
	return resp.json() if resp.content else {}


def _normalize_status(raw_status):
	status = (raw_status or "").strip().lower()
	if status in PAID_STATUSES:
		return "Paid"
	if status in FAILED_STATUSES:
		return "Failed"
	return "Pending"


def refresh_gateway_payment(name):
	doc = frappe.get_doc("IMOGI POS Gateway Payment", name)
	if doc.status in ("Paid", "Cancelled"):
		return serialize_gateway_payment(doc)

	cfg = get_gateway_settings()
	raw_status = ""
	if doc.provider == "Midtrans":
		data = _midtrans_status(doc.external_id, sandbox=cfg["sandbox"])
		raw_status = data.get("transaction_status") or data.get("status_code")
	elif doc.provider == "Xendit":
		# Xendit dynamic QR — poll by external_id via payments API fallback
		raw_status = doc.status

	new_status = _normalize_status(raw_status)
	if new_status == "Paid" and doc.status != "Paid":
		doc.status = "Paid"
		doc.paid_at = now_datetime()
		doc.save(ignore_permissions=True)
		_complete_gateway_payment(doc)
	elif new_status == "Failed" and doc.status == "Pending":
		doc.status = "Failed"
		doc.save(ignore_permissions=True)

	frappe.db.commit()
	doc.reload()
	return serialize_gateway_payment(doc)


def mark_gateway_paid(doc, remarks=None):
	if doc.status == "Paid":
		return serialize_gateway_payment(doc)
	doc.status = "Paid"
	doc.paid_at = now_datetime()
	if remarks:
		doc.remarks = remarks
	doc.save(ignore_permissions=True)
	order = _complete_gateway_payment(doc)
	frappe.db.commit()
	doc.reload()
	result = serialize_gateway_payment(doc)
	result["order"] = order
	return result


def _complete_gateway_payment(doc):
	if doc.order:
		return frappe.get_doc("IMOGI POS Order", doc.order)

	snapshot = json.loads(doc.cart_snapshot or "{}")
	items = snapshot.get("items") or []
	mode = snapshot.get("mode_of_payment") or "QRIS"

	from imogi_pos.api.cashier import _create_cashier_order

	order = _create_cashier_order(
		items,
		doc.customer,
		snapshot.get("order_channel") or "Walk-in",
		snapshot.get("order_type") or "Takeaway",
		[{"mode_of_payment": mode, "amount": flt(doc.amount)}],
		doc.discount_type,
		doc.discount_value,
		pos_profile=doc.pos_profile,
		company=doc.company,
		voucher_code=snapshot.get("voucher_code"),
		loyalty_points_redeem=snapshot.get("loyalty_points_redeem") or 0,
	)
	order.action_process_payment(silent=True)
	order.reload()
	doc.db_set("order", order.name, update_modified=False)
	return order.name


def serialize_gateway_payment(doc):
	payload = {}
	try:
		payload = json.loads(doc.qris_payload or "{}")
	except Exception:
		payload = {}
	return {
		"name": doc.name,
		"status": doc.status,
		"provider": doc.provider,
		"external_id": doc.external_id,
		"amount": flt(doc.amount),
		"currency": doc.currency,
		"qr_string": payload.get("qr_string") or "",
		"qr_url": payload.get("qr_url") or "",
		"order": doc.order,
		"paid_at": doc.paid_at,
	}


def handle_gateway_webhook(provider, payload):
	provider = (provider or "").strip()
	data = payload
	if isinstance(payload, str):
		try:
			data = json.loads(payload)
		except Exception:
			data = frappe.parse_json(payload)

	external_id = (
		data.get("order_id")
		or data.get("external_id")
		or (data.get("data") or {}).get("reference_id")
		or data.get("id")
	)
	if not external_id:
		return {"ok": False, "reason": "missing external_id"}

	name = frappe.db.get_value("IMOGI POS Gateway Payment", {"external_id": str(external_id)}, "name")
	if not name:
		return {"ok": False, "reason": "payment not found"}

	doc = frappe.get_doc("IMOGI POS Gateway Payment", name)
	status_raw = (
		data.get("transaction_status")
		or data.get("status")
		or (data.get("data") or {}).get("status")
		or ""
	)
	if _normalize_status(status_raw) == "Paid":
		mark_gateway_paid(doc, remarks=f"webhook:{provider}")
		return {"ok": True, "order": doc.order}
	if _normalize_status(status_raw) == "Failed":
		doc.status = "Failed"
		doc.save(ignore_permissions=True)
		frappe.db.commit()
	return {"ok": True, "status": doc.status}
