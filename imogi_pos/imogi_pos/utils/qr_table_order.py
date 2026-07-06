# Copyright (c) 2026, Imogi and contributors
"""Signed table tokens and QR self-service helpers."""

from __future__ import annotations

import hashlib
import hmac
import secrets

import frappe
from frappe import _
from frappe.utils import cint, flt, get_url

from imogi_pos.imogi_pos.utils.flow import get_settings, reserve_restaurant_table
from imogi_pos.imogi_pos.utils.table_service import get_table_doc, validate_table_assignable


DEFAULT_QR_ORDER_RECEIVED_MESSAGE = (
	"Terima kasih, {customer}!\n\n"
	"Pesanan *{order_name}* di Meja *{table_number}* sudah kami terima.\n"
	"Total: {total}\n\n"
	"Pesanan sedang diproses. Mohon tunggu di meja Anda."
)

DEFAULT_QR_ORDER_COMPLETE_MESSAGE = (
	"Terima kasih sudah makan di {store_name}!\n\n"
	"Pesanan *{order_name}* · Meja *{table_number}* sudah selesai.\n"
	"Total: {total}"
)


def _signing_secret() -> bytes:
	raw = (
		frappe.local.conf.get("encryption_key")
		or frappe.get_site_config().get("secret")
		or "imogi-qr-table-order"
	)
	return str(raw).encode()


def sign_table_token(table_name: str) -> str:
	table_name = (table_name or "").strip()
	if not table_name:
		return ""
	return hmac.new(_signing_secret(), table_name.encode(), hashlib.sha256).hexdigest()[:24]


def verify_table_token(table_name: str, token: str) -> bool:
	if not table_name or not token:
		return False
	expected = sign_table_token(table_name)
	return secrets.compare_digest(expected, str(token).strip())


def is_qr_self_service_enabled(settings=None) -> bool:
	settings = settings or get_settings()
	if not cint(getattr(settings, "enable_table_service", 0)):
		return False
	if not cint(getattr(settings, "enable_qr_self_service", 0)):
		return False
	from imogi_pos.imogi_pos.utils.feature_gating import is_feature_operational

	return is_feature_operational("qr_self_service", settings)


def require_qr_self_service(settings=None):
	if not is_qr_self_service_enabled(settings):
		frappe.throw(_("QR Self-Service tidak aktif di IMOGI POS Settings."), frappe.PermissionError)


def build_table_qr_url(table_name: str) -> str:
	"""Public guest URL for table QR — never append :8003 on HTTPS tunnel hosts."""
	token = sign_table_token(table_name)
	path = f"/table-order?table={frappe.utils.quote(table_name)}&token={token}"
	host_name = (frappe.conf.host_name or frappe.conf.hostname or "").strip().rstrip("/")
	if host_name:
		if not host_name.startswith(("http://", "https://")):
			host_name = f"https://{host_name}"
		# Cloudflare/ngrok HTTPS endpoints are reached on 443, not bench webserver_port.
		if host_name.startswith("https://"):
			return f"{host_name}{path}"
	return get_url(path)


def get_qr_whatsapp_config(settings=None):
	settings = settings or get_settings()
	from imogi_pos.imogi_pos.utils.receipt_branding import get_whatsapp_receipt_config

	wa = get_whatsapp_receipt_config(settings)
	wa["whatsapp_qr_order_received_message"] = (
		getattr(settings, "whatsapp_qr_order_received_message", None) or DEFAULT_QR_ORDER_RECEIVED_MESSAGE
	)
	wa["whatsapp_qr_order_complete_message"] = (
		getattr(settings, "whatsapp_qr_order_complete_message", None) or DEFAULT_QR_ORDER_COMPLETE_MESSAGE
	)
	return wa


def format_qr_whatsapp_message(template, **kwargs):
	message = (template or "").format(
		order_name=kwargs.get("order_name") or "",
		total=kwargs.get("total") or "",
		customer=kwargs.get("customer") or __("Tamu"),
		table_number=kwargs.get("table_number") or "",
		store_name=kwargs.get("store_name") or "",
		status=kwargs.get("status") or "",
	)
	return message.strip()


def get_table_public_context(table_name: str, token: str) -> dict:
	require_qr_self_service()
	if not verify_table_token(table_name, token):
		frappe.throw(_("QR meja tidak valid atau sudah kedaluwarsa."), frappe.PermissionError)

	table = get_table_doc(table_name)
	area_label = table.location or ""
	floor_label = ""
	if table.restaurant_area and frappe.db.exists("IMOGI Restaurant Area", table.restaurant_area):
		area = frappe.db.get_value(
			"IMOGI Restaurant Area",
			table.restaurant_area,
			["area_name", "restaurant_floor"],
			as_dict=True,
		)
		if area:
			area_label = area.area_name or area_label
			if area.restaurant_floor:
				floor_label = (
					frappe.db.get_value("IMOGI Restaurant Floor", area.restaurant_floor, "floor_name") or ""
				)

	settings = get_settings()
	store_name = settings.default_company or "IMOGI POS"
	logo = ""
	if getattr(settings, "receipt_logo", None):
		logo = get_url(settings.receipt_logo)

	open_order = None
	if table.current_order and frappe.db.exists("Riwayat Order", table.current_order):
		order = frappe.db.get_value(
			"Riwayat Order",
			table.current_order,
			["name", "status", "grand_total", "customer_name"],
			as_dict=True,
		)
		if order and order.status not in ("Completed", "Cancelled", "Refunded"):
			open_order = order

	return {
		"name": table.name,
		"table_number": table.table_number or table.name,
		"capacity": cint(table.capacity),
		"status": table.status,
		"area": area_label,
		"floor": floor_label,
		"can_order": table.status in ("Available", "Reserved") or bool(open_order),
		"open_order": open_order,
		"store_name": store_name,
		"store_logo": logo,
	}


def send_qr_order_whatsapp(order_name, *, event="received", customer_phone=None):
	"""Send text WA for QR dine-in order events."""
	settings = get_settings()
	wa_cfg = get_qr_whatsapp_config(settings)
	if not cint(wa_cfg.get("enable_whatsapp_receipt")):
		return {"sent": False, "reason": "disabled"}

	if (wa_cfg.get("whatsapp_api_provider") or "").strip() != "Fonnte":
		return {"sent": False, "reason": "manual_only"}

	order = frappe.get_doc("Riwayat Order", order_name)
	phone = (customer_phone or order.customer_phone or "").strip()
	if not phone:
		return {"sent": False, "reason": "no_phone"}

	table_number = ""
	if order.restaurant_table:
		table_number = frappe.db.get_value("IMOGI Restaurant Table", order.restaurant_table, "table_number") or order.restaurant_table

	store_name = settings.default_company or "IMOGI POS"
	template = wa_cfg["whatsapp_qr_order_received_message"]
	if event == "complete":
		template = wa_cfg["whatsapp_qr_order_complete_message"]

	message = format_qr_whatsapp_message(
		template,
		order_name=order.name,
		total=frappe.utils.fmt_money(order.grand_total, currency=order.currency),
		customer=order.customer_name or __("Tamu"),
		table_number=table_number,
		store_name=store_name,
		status=order.status,
	)

	from imogi_pos.imogi_pos.utils.whatsapp_send import send_fonnte_message

	result = send_fonnte_message(wa_cfg["fonnte_api_token"], phone, message)
	if event == "complete" and cint(wa_cfg.get("enable_whatsapp_receipt")):
		try:
			from imogi_pos.api.cashier import send_whatsapp_receipt

			send_whatsapp_receipt(order.name, customer_phone=phone)
		except Exception:
			frappe.log_error(title="IMOGI QR WA Receipt")
	return {"sent": True, **result}


def validate_table_for_qr_order(table_name: str):
	require_qr_self_service()
	table = get_table_doc(table_name)
	if table.status == "Occupied" and table.current_order:
		order_status = frappe.db.get_value("Riwayat Order", table.current_order, "status")
		if order_status not in ("Completed", "Cancelled", "Refunded"):
			frappe.throw(
				_("Meja {0} sedang dipakai. Panggil waiter untuk menambah pesanan.").format(table.table_number),
				frappe.ValidationError,
			)
	validate_table_assignable(table_name, allow_reserved=True)
	return table
