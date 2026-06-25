# Copyright (c) 2026, Imogi and contributors
"""Midtrans / Xendit QRIS payment helpers for IMOGI Kasir."""

import base64
import io
import json
import re

import frappe
import requests
from frappe import _
from frappe.utils import cint, flt, get_datetime, now_datetime

from imogi_pos.imogi_pos.utils.branch import resolve_active_branch
from imogi_pos.imogi_pos.utils.flow import get_settings


PAID_STATUSES = frozenset({"settlement", "capture", "success", "paid", "completed", "succeeded", "inactive"})
FAILED_STATUSES = frozenset({"deny", "cancel", "expire", "failure", "failed", "expired"})


def get_gateway_settings():
	from imogi_pos.imogi_pos.utils.feature_gating import is_setting_enabled

	settings = get_settings()
	if not is_setting_enabled("enable_payment_gateway", settings):
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


def _normalize_qr_fields(qr_url="", qr_string=""):
	qr_url = (qr_url or "").strip()
	qr_string = (qr_string or "").strip()
	if qr_url and not qr_url.startswith(("http://", "https://")):
		if not qr_string:
			qr_string = qr_url
		qr_url = ""
	return qr_url, qr_string


def _qr_string_to_png_bytes(qr_string):
	qr_string = (qr_string or "").strip()
	if not qr_string or qr_string.startswith(("http://", "https://")):
		return b""
	try:
		import qrcode
		from qrcode.constants import ERROR_CORRECT_L

		qr = qrcode.QRCode(error_correction=ERROR_CORRECT_L, box_size=8, border=2)
		qr.add_data(qr_string)
		qr.make(fit=True)
		buf = io.BytesIO()
		qr.make_image(fill_color="black", back_color="white").save(buf, format="PNG")
		return buf.getvalue()
	except Exception:
		frappe.log_error(title="IMOGI POS QR render failed")
		return b""


def _qr_string_to_data_url(qr_string):
	png = _qr_string_to_png_bytes(qr_string)
	if not png:
		return ""
	return "data:image/png;base64," + base64.b64encode(png).decode()


def _payment_qr_image_url(payment_name):
	"""Relative URL — always same-origin so session cookie is sent with <img> requests."""
	return f"/api/method/imogi_pos.api.payment_gateway_api.get_qr_image?payment_name={payment_name}"


def _serialize_qr_response(qr_url="", qr_string="", payment_name=None):
	qr_url, qr_string = _normalize_qr_fields(qr_url, qr_string)
	image_url = _payment_qr_image_url(payment_name) if payment_name and qr_string else ""
	return {
		"qr_url": image_url or qr_url,
		"qr_string": qr_string,
		"qr_image": _qr_string_to_data_url(qr_string),
	}


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


def _is_public_https_url(url):
	if not url:
		return False
	low = url.lower()
	if not low.startswith("https://"):
		return False
	if "localhost" in low or "127.0.0.1" in low:
		return False
	return True


def _format_xendit_error(data, fallback=""):
	parts = []
	message = (data.get("message") or "").strip()
	error_code = (data.get("error_code") or "").strip()
	if error_code:
		parts.append(error_code)
	if message:
		parts.append(message)
	for err in data.get("errors") or []:
		if isinstance(err, dict):
			field = err.get("field") or err.get("path") or ""
			detail = err.get("message") or err.get("detail") or str(err)
			parts.append(f"{field}: {detail}".strip(": "))
		else:
			parts.append(str(err))
	return " — ".join(p for p in parts if p) or fallback or _("Unknown Xendit error")


def _validate_xendit_callback_url(callback):
	if not callback:
		frappe.throw(
			_(
				"Webhook URL Xendit belum dikonfigurasi. "
				"Tambahkan host_name HTTPS publik di site_config.json, lalu restart bench."
			)
		)
	if not _is_public_https_url(callback):
		frappe.throw(
			_(
				"Xendit membutuhkan callback URL HTTPS yang dapat diakses publik (bukan localhost). "
				"URL saat ini: {0}. "
				"Untuk development, gunakan ngrok atau set host_name di site_config.json."
			).format(callback)
		)


def _create_xendit_qris(external_id, amount, currency="IDR"):
	cfg = get_gateway_settings()
	token = base64.b64encode(f"{cfg['server_key']}:".encode()).decode()
	headers = {"Authorization": f"Basic {token}", "Content-Type": "application/json"}
	callback = get_webhook_url("Xendit")
	_validate_xendit_callback_url(callback)
	# Xendit /qr_codes (QRIS) only accepts external_id, type, callback_url, amount — no currency field.
	payload = {
		"external_id": external_id,
		"type": "DYNAMIC",
		"amount": int(round(flt(amount))),
		"callback_url": callback,
	}
	url = f"{_xendit_base_url()}/qr_codes"
	resp = requests.post(url, json=payload, headers=headers, timeout=30)
	data = resp.json() if resp.content else {}
	if resp.status_code >= 400:
		frappe.log_error(
			title="Xendit QRIS create failed",
			message=json.dumps({"status": resp.status_code, "payload": payload, "response": data}, default=str),
		)
		frappe.throw(_("Xendit error: {0}").format(_format_xendit_error(data, resp.text)))
	return {
		"external_id": external_id,
		"transaction_id": data.get("id"),
		"qr_url": "",
		"qr_string": data.get("qr_string") or "",
		"raw": data,
	}


def get_webhook_url(provider=None):
	path = f"/api/method/imogi_pos.api.payment_gateway_api.gateway_webhook?provider={provider or ''}"
	host_name = (frappe.conf.host_name or frappe.conf.hostname or "").strip().rstrip("/")
	if host_name:
		if not host_name.startswith(("http://", "https://")):
			host_name = f"https://{host_name}"
		if host_name.startswith("https://"):
			return f"{host_name}{path}"
	try:
		return frappe.utils.get_url(path)
	except Exception:
		return ""


def create_gateway_payment(
	items,
	customer=None,
	customer_phone=None,
	discount_type=None,
	discount_value=None,
	voucher_code=None,
	loyalty_points_redeem=0,
	branch=None,
	pos_profile=None,
	mode_of_payment="QRIS",
	order_name=None,
	order_type="Takeaway",
	order_channel="Walk-in",
	charge_amount=None,
	checkout_mode="full",
	pending_payments=None,
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
		customer_phone=customer_phone,
		company=branch_ctx["company"],
		branch=branch_ctx.get("branch_code"),
	)
	grand_total = flt(totals["grand_total"])
	if grand_total <= 0:
		frappe.throw(_("Total pembayaran harus lebih dari 0"))

	partial = flt(charge_amount)
	if partial > 0:
		if partial > grand_total + 0.01:
			frappe.throw(_("Nominal QRIS tidak boleh melebihi total tagihan"))
		amount = partial
	else:
		amount = grand_total

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
					"order_type": order_type or "Takeaway",
					"order_channel": order_channel or "Walk-in",
					"voucher_code": totals.get("voucher_code") or "",
					"loyalty_points_redeem": totals.get("loyalty_points_redeemed") or 0,
					"order_name": order_name or "",
					"discount_type": discount_type or "",
					"discount_value": flt(discount_value),
					"customer": customer,
					"checkout_mode": checkout_mode or "full",
					"pending_payments": pending_payments or [],
					"grand_total": grand_total,
				}
			),
		}
	)
	doc.insert(ignore_permissions=True)
	frappe.db.commit()

	result = {
		"name": doc.name,
		"external_id": external_id,
		"amount": amount,
		"currency": currency,
		"provider": cfg["provider"],
		"status": doc.status,
	}
	result.update(_serialize_qr_response(charge.get("qr_url"), charge.get("qr_string"), payment_name=doc.name))
	return result


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


def _xendit_auth_headers():
	cfg = get_gateway_settings()
	token = base64.b64encode(f"{cfg['server_key']}:".encode()).decode()
	return {"Authorization": f"Basic {token}"}


def _xendit_qr_status(external_id):
	"""Poll Xendit QRIS status by external_id (QR inactive or payment completed)."""
	headers = _xendit_auth_headers()
	base = _xendit_base_url()

	resp = requests.get(f"{base}/qr_codes/{external_id}", headers=headers, timeout=20)
	if resp.status_code == 200:
		data = resp.json() if resp.content else {}
		qr_status = (data.get("status") or "").strip().upper()
		if qr_status == "INACTIVE":
			return "COMPLETED"

	resp = requests.get(
		f"{base}/qr_codes/payments",
		headers=headers,
		params={"external_id": external_id, "limit": 5},
		timeout=20,
	)
	if resp.status_code == 200:
		data = resp.json() if resp.content else {}
		payments = data if isinstance(data, list) else (data.get("data") or data.get("payments") or [])
		for payment in payments:
			if (payment.get("status") or "").strip().upper() == "COMPLETED":
				return "COMPLETED"

	return ""


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
		result = serialize_gateway_payment(doc)
		if doc.order:
			result["order"] = doc.order
		return result

	cfg = get_gateway_settings()
	raw_status = ""
	if doc.provider == "Midtrans":
		data = _midtrans_status(doc.external_id, sandbox=cfg["sandbox"])
		raw_status = data.get("transaction_status") or data.get("status_code")
	elif doc.provider == "Xendit":
		raw_status = _xendit_qr_status(doc.external_id)

	new_status = _normalize_status(raw_status)
	if new_status == "Paid":
		try:
			return mark_gateway_paid(doc)
		except frappe.TimestampMismatchError:
			doc.reload()
			if doc.status == "Paid":
				result = serialize_gateway_payment(doc)
				result["order"] = doc.order or frappe.db.get_value(
					"IMOGI POS Gateway Payment", doc.name, "order"
				)
				return result
			raise
	if new_status == "Failed" and doc.status == "Pending":
		frappe.db.set_value(
			"IMOGI POS Gateway Payment",
			doc.name,
			{"status": "Failed"},
			update_modified=True,
		)
		frappe.db.commit()
		doc.reload()

	return serialize_gateway_payment(doc)


def mark_gateway_paid(doc, remarks=None):
	"""Mark gateway payment paid and ensure exactly one Riwayat Order exists."""
	doc.reload()
	if doc.status == "Paid":
		result = serialize_gateway_payment(doc)
		order_name = doc.order or _ensure_gateway_order(doc)
		result["order"] = order_name
		return result

	updates = {"status": "Paid", "paid_at": now_datetime()}
	if remarks:
		updates["remarks"] = remarks
	frappe.db.set_value("IMOGI POS Gateway Payment", doc.name, updates, update_modified=True)
	frappe.db.commit()

	order_name = _ensure_gateway_order(doc)
	doc.reload()
	result = serialize_gateway_payment(doc)
	result["order"] = order_name
	return result


def _acquire_redis_lock(cache, lock_key, expires_in_sec=120):
	"""SET NX lock — frappe.cache() has no .add(); use native Redis SET NX."""
	key = cache.make_key(lock_key)
	try:
		return bool(cache.set(name=key, value=b"1", nx=True, ex=expires_in_sec))
	except Exception:
		return True


def _release_redis_lock(cache, lock_key):
	cache.delete_value(lock_key)


def _ensure_gateway_order(doc):
	"""Create and pay order once per gateway payment (safe under concurrent poll/webhook)."""
	order_name = frappe.db.get_value("IMOGI POS Gateway Payment", doc.name, "order")
	if order_name:
		return order_name

	lock_key = f"imogi_gw_order:{doc.name}"
	cache = frappe.cache()
	acquired = _acquire_redis_lock(cache, lock_key, expires_in_sec=120)
	if not acquired:
		for _ in range(50):
			order_name = frappe.db.get_value("IMOGI POS Gateway Payment", doc.name, "order")
			if order_name:
				return order_name
			frappe.db.commit()
			frappe.sleep(0.1)
		frappe.throw(_("Pembayaran sedang diproses. Silakan refresh halaman."))

	try:
		order_name = frappe.db.get_value("IMOGI POS Gateway Payment", doc.name, "order")
		if order_name:
			return order_name

		snapshot = json.loads(doc.cart_snapshot or "{}")
		checkout_mode = snapshot.get("checkout_mode") or "full"
		items = snapshot.get("items") or []
		mode = snapshot.get("mode_of_payment") or "QRIS"
		pending_order_name = (snapshot.get("order_name") or "").strip()

		if checkout_mode == "multi_pending":
			if pending_order_name and frappe.db.exists("Riwayat Order", pending_order_name):
				frappe.db.set_value(
					"IMOGI POS Gateway Payment",
					doc.name,
					"order",
					pending_order_name,
					update_modified=False,
				)
				frappe.db.commit()
				return pending_order_name
			return pending_order_name or ""

		if pending_order_name and frappe.db.exists("Riwayat Order", pending_order_name):
			from imogi_pos.api.cashier import (
				_apply_payments_to_order,
				_sync_awaiting_order_from_checkout,
				_verify_cashier_pending_order,
			)

			order = frappe.get_doc("Riwayat Order", pending_order_name)
			_verify_cashier_pending_order(order)
			branch_ctx = resolve_active_branch(pos_profile=doc.pos_profile, branch_code=doc.branch_code)
			order = _sync_awaiting_order_from_checkout(
				order,
				items,
				discount_type=snapshot.get("discount_type"),
				discount_value=snapshot.get("discount_value"),
				voucher_code=snapshot.get("voucher_code"),
				loyalty_points_redeem=snapshot.get("loyalty_points_redeem") or 0,
				customer=snapshot.get("customer") or doc.customer,
				warehouse=branch_ctx.get("warehouse"),
				branch_code=branch_ctx.get("branch_code"),
			)
			_apply_payments_to_order(order, [{"mode_of_payment": mode, "amount": flt(doc.amount)}])
			order.action_process_payment(silent=True)
			order.reload()
		else:
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
		frappe.db.set_value(
			"IMOGI POS Gateway Payment",
			doc.name,
			"order",
			order.name,
			update_modified=False,
		)
		frappe.db.commit()
		return order.name
	finally:
		if acquired:
			_release_redis_lock(cache, lock_key)


def _complete_gateway_payment(doc):
	return _ensure_gateway_order(doc)


def serialize_gateway_payment(doc):
	payload = {}
	try:
		payload = json.loads(doc.qris_payload or "{}")
	except Exception:
		payload = {}
	result = {
		"name": doc.name,
		"status": doc.status,
		"provider": doc.provider,
		"external_id": doc.external_id,
		"amount": flt(doc.amount),
		"currency": doc.currency,
		"order": doc.order,
		"paid_at": doc.paid_at,
	}
	result.update(_serialize_qr_response(payload.get("qr_url"), payload.get("qr_string"), payment_name=doc.name))
	return result


def handle_gateway_webhook(provider, payload):
	provider = (provider or "").strip()
	data = payload
	if isinstance(payload, str):
		try:
			data = json.loads(payload)
		except Exception:
			data = frappe.parse_json(payload)

	qr_code = data.get("qr_code") or {}
	external_id = (
		data.get("order_id")
		or data.get("external_id")
		or qr_code.get("external_id")
		or (data.get("data") or {}).get("reference_id")
		or (data.get("data") or {}).get("external_id")
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
		result = mark_gateway_paid(doc, remarks=f"webhook:{provider}")
		return {"ok": True, "order": result.get("order") or doc.order}
	if _normalize_status(status_raw) == "Failed":
		doc.status = "Failed"
		doc.save(ignore_permissions=True)
		frappe.db.commit()
	return {"ok": True, "status": doc.status}
