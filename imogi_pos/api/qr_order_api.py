# Copyright (c) 2026, Imogi and contributors

import json

import frappe
from frappe import _
from frappe.utils import cint, flt

from imogi_pos.api.auth import ensure_setup_ready
from imogi_pos.api.cashier import (
	_create_cashier_order,
	_parse_json,
	_require_pos_opening,
	_resolve_cashier_branch,
)
from imogi_pos.api.order import _serialize_order
from imogi_pos.imogi_pos.utils.feature_gating import require_feature_operational
from imogi_pos.imogi_pos.utils.flow import get_settings
from imogi_pos.imogi_pos.utils.payment_gateway import create_gateway_payment, is_gateway_enabled
from imogi_pos.imogi_pos.utils.qr_table_order import (
	build_table_qr_url,
	get_table_public_context,
	is_qr_self_service_enabled,
	require_qr_self_service,
	send_qr_order_whatsapp,
	sign_table_token,
	validate_table_for_qr_order,
	verify_table_token,
)


def _parse_items(items):
	if isinstance(items, str):
		return _parse_json(items, "items") or []
	return items or []


def _require_guest_table(table, token):
	table = (table or "").strip()
	token = (token or "").strip()
	if not table or not token:
		frappe.throw(_("Parameter meja tidak lengkap."), frappe.ValidationError)
	if not verify_table_token(table, token):
		frappe.throw(_("QR meja tidak valid."), frappe.PermissionError)
	return table


@frappe.whitelist(allow_guest=True)
def get_table_qr_link(table):
	"""Staff: get signed QR URL for a restaurant table."""
	frappe.only_for(("System Manager", "IMOGI Manager", "IMOGI Owner", "IMOGI Supervisor", "IMOGI Waiter", "IMOGI Cashier", "Administrator"))
	require_qr_self_service()
	if not frappe.db.exists("IMOGI Restaurant Table", table):
		frappe.throw(_("Meja tidak ditemukan"))
	return {
		"table": table,
		"token": sign_table_token(table),
		"url": build_table_qr_url(table),
	}


@frappe.whitelist(allow_guest=True)
def get_qr_menu_board(table, token, search=None, pos_category=None, start=0, limit=40):
	"""Guest menu payload for QR table order page."""
	require_qr_self_service()
	ensure_setup_ready()
	table = _require_guest_table(table, token)
	ctx = get_table_public_context(table, token)

	settings = get_settings()
	api_user = settings.order_api_user or "Administrator"
	previous_user = frappe.session.user
	frappe.set_user(api_user)
	try:
		from imogi_pos.api.catalog import get_items

		catalog = get_items(
			search=search,
			pos_category=pos_category,
			start=cint(start),
			limit=min(cint(limit) or 40, 60),
			skip_cache=1,
		)
	finally:
		frappe.set_user(previous_user)

	settings = get_settings()
	return {
		"table": ctx,
		"catalog": catalog,
		"payment": {
			"gateway_enabled": bool(is_gateway_enabled()),
			"default_mode": (getattr(settings, "qr_self_service_payment_mode", None) or "QRIS").strip(),
		},
	}


@frappe.whitelist(allow_guest=True)
def submit_qr_table_order(
	table,
	token,
	items,
	customer_phone,
	customer_name=None,
	payment_mode=None,
):
	"""Guest checkout: create dine-in order, pay, notify WA, occupy table."""
	require_qr_self_service()
	require_feature_operational("qr_self_service")
	require_feature_operational("table_management")
	ensure_setup_ready()

	table = _require_guest_table(table, token)
	validate_table_for_qr_order(table)

	phone = (customer_phone or "").strip()
	if not phone:
		frappe.throw(_("Nomor WhatsApp wajib diisi untuk notifikasi pesanan."))

	parsed_items = _parse_items(items)
	if not parsed_items:
		frappe.throw(_("Keranjang kosong"))

	settings = get_settings()
	payment_mode = (payment_mode or getattr(settings, "qr_self_service_payment_mode", None) or "Cash").strip()
	api_user = settings.order_api_user or "Administrator"
	previous_user = frappe.session.user
	frappe.set_user(api_user)
	try:
		_require_pos_opening()
		branch_ctx = _resolve_cashier_branch()

		if payment_mode.upper() == "QRIS":
			if not is_gateway_enabled():
				frappe.throw(_("Pembayaran QRIS belum dikonfigurasi. Hubungi staff restoran."))
			gateway = create_gateway_payment(
				parsed_items,
				customer_phone=phone,
				pos_profile=branch_ctx["pos_profile"],
				branch=branch_ctx.get("branch_code"),
				mode_of_payment="QRIS",
				order_type="Dine-in",
				order_channel="QR",
			)
			snapshot = json.loads(
				frappe.db.get_value("IMOGI POS Gateway Payment", gateway["name"], "cart_snapshot") or "{}"
			)
			snapshot.update(
				{
					"restaurant_table": table,
					"customer_name": (customer_name or "").strip(),
					"customer_phone": phone,
					"order_type": "Dine-in",
					"order_channel": "QR",
				}
			)
			frappe.db.set_value(
				"IMOGI POS Gateway Payment",
				gateway["name"],
				"cart_snapshot",
				json.dumps(snapshot),
				update_modified=False,
			)
			frappe.db.commit()
			return {
				"payment_type": "qris",
				"gateway": gateway,
				"table": table,
			}

		order = _create_cashier_order(
			parsed_items,
			customer=None,
			order_channel="QR",
			order_type="Dine-in",
			payments_list=[],
			pos_profile=branch_ctx["pos_profile"],
			warehouse=branch_ctx["warehouse"],
			company=branch_ctx["company"],
			restaurant_table=table,
			branch=branch_ctx.get("branch_code"),
			customer_phone=phone,
		)
		if customer_name:
			order.db_set("customer_name", customer_name.strip(), update_modified=False)

		total = flt(order.grand_total)
		order.append("payments", {"mode_of_payment": payment_mode or "Cash", "amount": total})
		order.calculate_totals()
		order.flags.ignore_validate_update_after_submit = True
		order.save(ignore_permissions=True)
		order.reload()
		order.action_process_payment(silent=True)
		order.reload()
		frappe.db.commit()

		try:
			send_qr_order_whatsapp(order.name, event="received", customer_phone=phone)
		except Exception:
			frappe.log_error(title="IMOGI QR Order WhatsApp")

		return {
			"payment_type": "instant",
			"order": _serialize_order(order),
			"table": table,
		}
	finally:
		frappe.set_user(previous_user)


@frappe.whitelist(allow_guest=True)
def poll_qr_gateway_payment(table, token, payment_name):
	"""Guest: poll QRIS payment and return order when paid."""
	require_qr_self_service()
	table = _require_guest_table(table, token)
	payment_name = (payment_name or "").strip()
	if not payment_name or not frappe.db.exists("IMOGI POS Gateway Payment", payment_name):
		frappe.throw(_("Pembayaran tidak ditemukan."), frappe.ValidationError)

	snapshot = json.loads(
		frappe.db.get_value("IMOGI POS Gateway Payment", payment_name, "cart_snapshot") or "{}"
	)
	if (snapshot.get("order_channel") or "").upper() != "QR":
		frappe.throw(_("Pembayaran bukan untuk QR meja."), frappe.PermissionError)
	if (snapshot.get("restaurant_table") or "").strip() != table:
		frappe.throw(_("Pembayaran tidak cocok dengan meja ini."), frappe.PermissionError)

	from imogi_pos.imogi_pos.utils.payment_gateway import refresh_gateway_payment

	row = refresh_gateway_payment(payment_name)
	if row.get("status") == "Paid" and row.get("order"):
		row["order_detail"] = _serialize_order(frappe.get_doc("Riwayat Order", row["order"]))
	return row
