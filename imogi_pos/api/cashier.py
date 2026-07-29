# Copyright (c) 2026, Imogi and contributors

import base64
import json
import re
from urllib.parse import quote

import frappe
from frappe import _
from frappe.utils import cint, flt, fmt_money, get_url

from imogi_pos.api.auth import ensure_setup_ready
from imogi_pos.api.order import _parse_json, _serialize_order
from imogi_pos.imogi_pos.utils.bom_stock import COMBO_PACKAGE_CATEGORY, POS_CATEGORIES
from imogi_pos.imogi_pos.utils.branch import (
	get_accessible_branches,
	resolve_active_branch,
	set_user_default_branch_code,
)
from imogi_pos.imogi_pos.utils.feature_gating import is_feature_operational
from imogi_pos.imogi_pos.utils.flow import get_settings
from imogi_pos.imogi_pos.utils.pos_profile import validate_pos_profile
from imogi_pos.imogi_pos.utils.receipt_branding import get_receipt_logo_url, get_whatsapp_receipt_config
from imogi_pos.imogi_pos.utils.webhook import emit_order_webhook


def _require_cashier_access():
	if frappe.session.user == "Guest":
		frappe.throw(_("Login required"), frappe.AuthenticationError)
	if not frappe.has_permission("Riwayat Order", "write"):
		frappe.throw(_("Not permitted to use cashier"), frappe.PermissionError)


def _resolve_customer(customer, pos_profile):
	if customer:
		return customer

	customer = frappe.db.get_value("POS Profile", pos_profile, "customer")
	if customer:
		return customer

	customer = frappe.db.get_value(
		"Customer",
		{"disabled": 0},
		"name",
		order_by="modified desc",
	)
	if customer:
		return customer

	frappe.throw(_("Set a default customer on POS Profile or create a Customer first"))


def _is_pos_shift_enabled():
	from imogi_pos.imogi_pos.utils.feature_gating import is_setting_enabled

	return is_setting_enabled("enable_pos_shift")


def _get_opening_balance_details(company, pos_profile=None):
	from imogi_pos.imogi_pos.utils.shift_opening import get_cash_payment_mode

	cash_mode = get_cash_payment_mode(company)
	return [{"mode_of_payment": cash_mode, "opening_amount": 0}]


def _get_pos_opening(user=None):
	from erpnext.selling.page.point_of_sale.point_of_sale import check_opening_entry

	user = user or frappe.session.user
	entries = check_opening_entry(user) or []
	return entries[0] if entries else None


def _opening_pos_profile(opening):
	if not opening:
		return None
	if isinstance(opening, dict):
		return opening.get("pos_profile")
	return getattr(opening, "pos_profile", None)


def _resolve_cashier_branch(branch=None, pos_profile=None, strict=False):
	"""Resolve cabang kasir. Shift terbuka mengunci cabang ke POS Profile shift."""
	from imogi_pos.imogi_pos.utils.branch import get_accessible_branches, pick_branch_for_pos_profile

	user = frappe.session.user
	opening = _get_pos_opening() if _is_pos_shift_enabled() and not strict else None
	shift_profile = _opening_pos_profile(opening)

	if shift_profile and not strict:
		accessible = get_accessible_branches(user=user)
		shift_branch = pick_branch_for_pos_profile(accessible, shift_profile, user=user)
		if shift_branch:
			branch = shift_branch["branch_code"]
			pos_profile = shift_profile
		else:
			pos_profile = shift_profile
			branch = None

	ctx = resolve_active_branch(
		branch_code=branch,
		pos_profile=pos_profile,
		strict=strict,
		user=user,
	)

	if strict and ctx.get("branch_code"):
		set_user_default_branch_code(ctx["branch_code"], user=user)

	return ctx


def _requires_cashier_shift(user=None):
	from imogi_pos.boot import requires_cashier_shift

	return requires_cashier_shift(user)


def _require_pos_opening():
	if not _is_pos_shift_enabled():
		return None
	if not _requires_cashier_shift():
		return None
	opening = _get_pos_opening()
	if not opening:
		frappe.throw(
			_("Buka shift kasir dulu. Klik <b>Buka Shift</b> di halaman kasir atau buat POS Opening Entry."),
			title=_("Shift Belum Dibuka"),
		)
	return opening


def _resolve_checkout_customer_phone(customer=None, customer_phone=None, *, pos_profile=None, order_name=None):
	"""Best-effort phone for WA receipt — kasir input, order field, then Contact."""
	phone = (customer_phone or "").strip()
	if phone:
		return phone
	if order_name and frappe.db.exists("Riwayat Order", order_name):
		phone = (frappe.db.get_value("Riwayat Order", order_name, "customer_phone") or "").strip()
		if phone:
			return phone
	if customer:
		return _resolve_customer_phone(customer)
	return ""


def _require_whatsapp_customer_phone(customer, customer_phone, pos_profile, order_name=None):
	settings = get_settings()
	wa_cfg = get_whatsapp_receipt_config(settings)
	if not wa_cfg["enable_whatsapp_receipt"]:
		return (customer_phone or "").strip()

	default_customer = frappe.db.get_value("POS Profile", pos_profile, "customer")
	effective_customer = customer
	if order_name and frappe.db.exists("Riwayat Order", order_name):
		if not effective_customer:
			effective_customer = frappe.db.get_value("Riwayat Order", order_name, "customer")
	if not effective_customer:
		return (customer_phone or "").strip()
	if default_customer and effective_customer == default_customer:
		return (customer_phone or "").strip()

	phone = _resolve_checkout_customer_phone(
		customer=effective_customer,
		customer_phone=customer_phone,
		pos_profile=pos_profile,
		order_name=order_name,
	)
	if not phone:
		frappe.throw(
			_(
				"Nomor HP belum tersimpan. Isi <b>No. HP / WhatsApp</b> lalu klik <b>Simpan & Pilih</b> di dialog customer."
			),
			title=_("Nomor HP wajib"),
		)
	return phone


def _resolve_customer_phone(customer, customer_phone=None):
	"""Phone for WA receipt — prefer kasir input, then Customer Contact."""
	phone = (customer_phone or "").strip()
	if phone:
		return phone
	if not customer:
		return ""
	from imogi_pos.api.customer_api import _get_customer_contact

	contact = _get_customer_contact(customer)
	if contact:
		from imogi_pos.api.customer_api import _contact_phone

		return _contact_phone(contact)
	return ""


def _apply_customer_phone(order, customer, customer_phone=None):
	phone = _resolve_customer_phone(customer, customer_phone)
	if phone:
		order.customer_phone = phone


def _create_cashier_order(
	items,
	customer,
	order_channel,
	order_type,
	payments_list,
	discount_type=None,
	discount_value=None,
	pos_profile=None,
	warehouse=None,
	company=None,
	voucher_code=None,
	loyalty_points_redeem=0,
	offline_client_id=None,
	restaurant_table=None,
	branch=None,
	customer_phone=None,
):
	"""Build and submit order without importing order._build_order (avoids stale worker signatures)."""
	settings = get_settings()
	branch_ctx = _resolve_cashier_branch(branch=branch, pos_profile=pos_profile)
	pos_profile = branch_ctx["pos_profile"]
	company = company or branch_ctx["company"]
	default_warehouse = warehouse or branch_ctx["warehouse"]

	parsed_items = _parse_json(items, "items") if isinstance(items, str) else (items or [])
	if not parsed_items:
		frappe.throw(_("At least one item is required"))

	from imogi_pos.imogi_pos.utils.loyalty import apply_promotions_to_order, compute_checkout_totals

	totals = compute_checkout_totals(
		parsed_items,
		discount_type=discount_type,
		discount_value=discount_value,
		voucher_code=voucher_code,
		loyalty_points_redeem=loyalty_points_redeem,
		customer=customer,
		customer_phone=customer_phone,
		company=company,
		settings=settings,
		branch=branch_ctx.get("branch_code"),
	)

	order = frappe.new_doc("Riwayat Order")
	order.company = company
	order.pos_profile = pos_profile
	order.cashier = frappe.session.user
	order.order_channel = order_channel or "Walk-in"
	order.order_type = order_type or "Takeaway"
	order.order_source = "IMOGI POS"
	order.customer = _resolve_customer(customer, pos_profile)
	_apply_customer_phone(order, order.customer, customer_phone)
	order.discount_type = discount_type or ""
	order.discount_value = flt(discount_value)
	apply_promotions_to_order(order, totals)
	if offline_client_id:
		order.offline_client_id = offline_client_id
	if restaurant_table:
		order.restaurant_table = restaurant_table
		_assert_no_duplicate_table_order(restaurant_table, company=company)

	for row in totals.get("items") or parsed_items:
		if not row.get("item_code"):
			frappe.throw(_("Each item must include item_code"))
		item_code = row["item_code"]
		from imogi_pos.api.order import _resolve_item_display_name

		order.append(
			"items",
			{
				"item_code": item_code,
				"item_name": _resolve_item_display_name(item_code, row.get("item_name")),
				"qty": flt(row.get("qty") or 1),
				"rate": flt(row.get("rate") or 0),
				"warehouse": row.get("warehouse") or default_warehouse,
				"uom": row.get("uom"),
			},
		)

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

	order.insert(ignore_permissions=True)
	order.flags.ignore_permissions = True
	order.submit()
	if restaurant_table:
		from imogi_pos.imogi_pos.utils.flow import reserve_restaurant_table

		reserve_restaurant_table(order)
	return order


def _verify_cashier_pending_order(order):
	if order.docstatus != 1:
		frappe.throw(_("Order {0} is not awaiting payment").format(order.name))
	from imogi_pos.imogi_pos.utils.qr_table_order import is_unpaid_qr_cash_order

	if is_unpaid_qr_cash_order(order):
		return
	if order.status != "Awaiting Payment":
		frappe.throw(_("Order {0} is not awaiting payment").format(order.name))
	user = frappe.session.user
	cashier = (order.cashier or order.owner or "").strip()
	if cashier and cashier != user:
		frappe.throw(_("Not permitted to access this order"), frappe.PermissionError)


def _claim_qr_cash_order(order):
	from imogi_pos.imogi_pos.utils.qr_table_order import is_unpaid_qr_cash_order

	if not is_unpaid_qr_cash_order(order):
		return
	user = frappe.session.user
	if (order.cashier or "").strip() != user:
		order.db_set("cashier", user, update_modified=False)


def _apply_order_guest_name(order, guest_name):
	guest_name = (guest_name or "").strip()
	if not guest_name:
		return
	frappe.db.set_value("Riwayat Order", order.name, "customer_name", guest_name, update_modified=False)
	order.customer_name = guest_name


def _guest_name_to_preserve(order, customer_label=None):
	"""Keep tamu/QR display name instead of default POS customer link name."""
	guest_name = (customer_label or order.customer_name or "").strip()
	if not guest_name:
		return ""
	linked_name = ""
	if order.customer:
		linked_name = (frappe.db.get_value("Customer", order.customer, "customer_name") or order.customer or "").strip()
	if (order.order_channel or "").strip().upper() == "QR":
		return guest_name
	if linked_name and guest_name != linked_name:
		return guest_name
	return ""


def _sync_awaiting_order_from_checkout(
	order,
	parsed_items,
	*,
	discount_type=None,
	discount_value=None,
	voucher_code=None,
	loyalty_points_redeem=0,
	customer=None,
	customer_phone=None,
	customer_label=None,
	warehouse=None,
	branch_code=None,
	settings=None,
):
	settings = settings or get_settings()
	guest_name = _guest_name_to_preserve(order, customer_label=customer_label)
	if customer and frappe.db.exists("Customer", customer):
		order.customer = customer
	_apply_customer_phone(order, order.customer, customer_phone)

	from imogi_pos.imogi_pos.utils.loyalty import apply_promotions_to_order, compute_checkout_totals

	totals = compute_checkout_totals(
		parsed_items,
		discount_type=discount_type,
		discount_value=discount_value,
		voucher_code=voucher_code,
		loyalty_points_redeem=loyalty_points_redeem,
		customer=order.customer,
		customer_phone=customer_phone,
		company=order.company,
		settings=settings,
		branch=branch_code,
	)

	order.items = []
	for row in totals.get("items") or parsed_items:
		if not row.get("item_code"):
			frappe.throw(_("Each item must include item_code"))
		order.append(
			"items",
			{
				"item_code": row["item_code"],
				"qty": flt(row.get("qty") or 1),
				"rate": flt(row.get("rate") or 0),
				"warehouse": row.get("warehouse") or warehouse,
				"uom": row.get("uom"),
			},
		)

	order.discount_type = discount_type or ""
	order.discount_value = flt(discount_value)
	apply_promotions_to_order(order, totals)
	order.calculate_totals()
	order.flags.ignore_validate_update_after_submit = True
	order.save(ignore_permissions=True)
	if guest_name:
		_apply_order_guest_name(order, guest_name)
	order.reload()
	return order


def _apply_payments_to_order(order, payments_list):
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


TABLE_ORDER_ADDON_STATUSES = (
	"Awaiting Payment",
	"Paid",
	"In Kitchen",
	"Kitchen Ready",
	"In Fulfillment",
	"Fulfilled",
	"In Service",
)


def _get_open_orders_on_table(restaurant_table, *, company=None):
	restaurant_table = (restaurant_table or "").strip()
	if not restaurant_table:
		return []
	from imogi_pos.imogi_pos.utils.table_service import get_open_orders_by_table

	return get_open_orders_by_table(company=company).get(restaurant_table) or []


def _resolve_table_addon_order(restaurant_table, addon_order_name=None, *, company=None):
	addon_order_name = (addon_order_name or "").strip()
	if addon_order_name:
		return addon_order_name
	restaurant_table = (restaurant_table or "").strip()
	if not restaurant_table:
		return None
	existing = _get_open_orders_on_table(restaurant_table, company=company)
	return existing[0].name if existing else None


def _assert_no_duplicate_table_order(
	restaurant_table, *, addon_order_name=None, order_name=None, company=None
):
	if not restaurant_table or addon_order_name or order_name:
		return
	existing = _get_open_orders_on_table(restaurant_table, company=company)
	if existing:
		frappe.throw(
			_("Meja ini sudah punya order aktif ({0}). Gunakan <b>Tambah Order</b> di Table Service.").format(
				existing[0].name
			),
			title=_("Order meja sudah ada"),
		)


def _verify_table_order_addon(order):
	if order.docstatus != 1:
		frappe.throw(_("Order {0} is not submitted").format(order.name))
	if order.status not in TABLE_ORDER_ADDON_STATUSES:
		frappe.throw(
			_("Tidak bisa menambah item pada order berstatus {0}").format(order.status)
		)
	if not order.restaurant_table:
		frappe.throw(_("Order tidak terhubung ke meja"))


def _append_payments_to_order(order, payments_list):
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
	order.reload()


def _append_addon_to_table_order(
	order,
	parsed_items,
	payments_list,
	*,
	warehouse,
	settings=None,
):
	from imogi_pos.api.order import _resolve_item_display_name
	from imogi_pos.imogi_pos.utils.flow import (
		create_kitchen_order_for_items,
		create_pos_invoice_from_addon_items,
		is_kitchen_item,
		set_order_flags,
	)
	from imogi_pos.imogi_pos.utils.feature_gating import is_setting_enabled

	settings = settings or get_settings()
	new_rows = []
	for row in parsed_items:
		if not row.get("item_code"):
			frappe.throw(_("Each item must include item_code"))
		item_code = row["item_code"]
		child = {
			"item_code": item_code,
			"item_name": _resolve_item_display_name(item_code, row.get("item_name")),
			"qty": flt(row.get("qty") or 1),
			"rate": flt(row.get("rate") or 0),
			"warehouse": row.get("warehouse") or warehouse,
			"uom": row.get("uom"),
			"is_kitchen_item": 1 if is_kitchen_item(item_code) else 0,
		}
		order.append("items", child)
		new_rows.append(child)

	set_order_flags(order)
	order.calculate_totals()
	order.flags.ignore_validate_update_after_submit = True
	order.save(ignore_permissions=True)

	create_pos_invoice_from_addon_items(order, new_rows, payments_list)
	_append_payments_to_order(order, payments_list)

	if is_setting_enabled("enable_kitchen_display", settings):
		kitchen_rows = [row for row in new_rows if row.get("is_kitchen_item")]
		if kitchen_rows:
			try:
				create_kitchen_order_for_items(order, kitchen_rows)
				if not order.requires_kitchen:
					order.db_set("requires_kitchen", 1, update_modified=False)
			except Exception:
				frappe.log_error(
					title=_("IMOGI addon kitchen order failed for {0}").format(order.name),
					message=frappe.get_traceback(),
				)

	frappe.publish_realtime(
		"imogi_table_service_updated",
		{"pos_order": order.name, "restaurant_table": order.restaurant_table},
	)
	order.reload()
	return order


def _validate_cashier_cart(
	*,
	items,
	customer=None,
	customer_phone=None,
	order_type="Takeaway",
	voucher_code=None,
	loyalty_points_redeem=0,
	marketplace_order_name=None,
	restaurant_table=None,
	branch=None,
	pos_profile=None,
	discount_type=None,
	discount_value=None,
	approval_code=None,
):
	branch_ctx = _resolve_cashier_branch(branch=branch, pos_profile=pos_profile)
	settings = get_settings()
	default_customer = _resolve_customer(customer, branch_ctx["pos_profile"])
	from imogi_pos.imogi_pos.utils.feature_gating import validate_checkout_features

	validate_checkout_features(
		order_type=order_type,
		voucher_code=voucher_code,
		loyalty_points_redeem=loyalty_points_redeem,
		marketplace_order_name=marketplace_order_name,
		customer=customer,
		default_customer=default_customer,
		settings=settings,
	)

	parsed_items = _parse_json(items, "items") if isinstance(items, str) else (items or [])
	if not parsed_items and not marketplace_order_name:
		frappe.throw(_("At least one item is required"))

	if parsed_items:
		from imogi_pos.imogi_pos.utils.offline_stock import ensure_cart_stock_or_throw

		ensure_cart_stock_or_throw(
			parsed_items,
			branch_ctx["warehouse"],
			pos_profile=branch_ctx["pos_profile"],
		)

	if restaurant_table:
		from imogi_pos.imogi_pos.utils.feature_gating import require_feature_operational

		require_feature_operational("table_management", settings)

	from imogi_pos.imogi_pos.utils.approval import discount_requires_approval, require_supervisor_approval
	from imogi_pos.imogi_pos.utils.loyalty import compute_checkout_totals

	checkout_totals = compute_checkout_totals(
		parsed_items,
		discount_type=discount_type,
		discount_value=discount_value,
		voucher_code=voucher_code,
		loyalty_points_redeem=loyalty_points_redeem,
		customer=customer,
		customer_phone=customer_phone,
		company=branch_ctx["company"],
		settings=settings,
		branch=branch_ctx.get("branch_code"),
	)
	discount_total = flt(checkout_totals.get("discount_amount"))
	subtotal = flt(checkout_totals.get("subtotal"))
	if discount_requires_approval(discount_total, subtotal, settings):
		require_supervisor_approval(
			"Discount",
			amount=discount_total,
			approval_code=approval_code,
			reason=_("Diskon kasir melebihi batas approval"),
		)

	return branch_ctx, settings, parsed_items, checkout_totals


@frappe.whitelist()
def submit_awaiting_order(
	items,
	customer=None,
	customer_phone=None,
	customer_label=None,
	order_channel="Walk-in",
	order_type="Takeaway",
	discount_type=None,
	discount_value=None,
	voucher_code=None,
	loyalty_points_redeem=0,
	pos_profile=None,
	branch=None,
	restaurant_table=None,
	marketplace_order_name=None,
	addon_order_name=None,
	approval_code=None,
):
	"""Submit cart as Riwayat Order in Awaiting Payment when cashier opens payment."""
	_require_cashier_access()
	ensure_setup_ready()
	_require_pos_opening()

	if marketplace_order_name:
		order = frappe.get_doc("Riwayat Order", marketplace_order_name)
		order.check_permission("write")
		_verify_cashier_pending_order(order)
		return _serialize_order(order)

	branch_ctx, settings, parsed_items, _checkout_totals = _validate_cashier_cart(
		items=items,
		customer=customer,
		customer_phone=customer_phone,
		order_type=order_type,
		voucher_code=voucher_code,
		loyalty_points_redeem=loyalty_points_redeem,
		restaurant_table=restaurant_table,
		branch=branch,
		pos_profile=pos_profile,
		discount_type=discount_type,
		discount_value=discount_value,
		approval_code=approval_code,
	)

	addon_order_name = _resolve_table_addon_order(
		restaurant_table,
		addon_order_name,
		company=branch_ctx.get("company"),
	)
	if addon_order_name:
		order = frappe.get_doc("Riwayat Order", addon_order_name)
		order.check_permission("write")
		_verify_table_order_addon(order)
		result = _serialize_order(order)
		result["is_table_addon"] = True
		return result

	_assert_no_duplicate_table_order(
		restaurant_table,
		company=branch_ctx.get("company"),
	)

	order = _create_cashier_order(
		items,
		customer,
		order_channel,
		order_type,
		[],
		discount_type,
		discount_value,
		pos_profile=branch_ctx["pos_profile"],
		warehouse=branch_ctx["warehouse"],
		company=branch_ctx["company"],
		voucher_code=voucher_code,
		loyalty_points_redeem=loyalty_points_redeem,
		restaurant_table=restaurant_table,
		branch=branch_ctx.get("branch_code"),
		customer_phone=customer_phone,
	)
	frappe.db.commit()
	result = _serialize_order(order)
	emit_order_webhook(order.name, "order.created")
	return result


def _void_awaiting_cashier_order(order, reason=None, approval_code=None):
	"""Void the cashier's own unpaid order (payment modal); skips back-office void tier gate."""
	from imogi_pos.imogi_pos.utils.approval import require_supervisor_approval

	require_supervisor_approval(
		"Void",
		reference_name=order.name,
		reason=reason,
		amount=flt(order.grand_total),
		approval_code=approval_code,
	)

	if order.status in ("Cancelled", "Refunded"):
		frappe.throw(_("Order is already {0}").format(order.status))

	if order.pos_invoice and order.status not in ("Awaiting Payment", "Draft"):
		frappe.throw(
			_("Paid orders cannot be voided. Use <b>Refund Order</b> instead."),
			title=_("Use Refund"),
		)

	if reason:
		order.db_set("remarks", reason)

	if order.docstatus == 1:
		order.cancel()
	else:
		order.db_set("status", "Cancelled")

	if order.order_source != "IMOGI API":
		from imogi_pos.imogi_pos.utils.webhook import emit_order_webhook

		emit_order_webhook(order.name, "order.cancelled")
	return order.name


@frappe.whitelist()
def void_cashier_order(order_name, reason=None, approval_code=None):
	"""Void an unpaid cashier order (Awaiting Payment) from payment dialog."""
	_require_cashier_access()
	ensure_setup_ready()

	order = frappe.get_doc("Riwayat Order", order_name)
	order.check_permission("cancel")
	_verify_cashier_pending_order(order)
	_void_awaiting_cashier_order(order, reason=reason, approval_code=approval_code)
	order.reload()
	frappe.db.commit()
	return _serialize_order(order)


@frappe.whitelist()
def get_cashier_context(branch=None, pos_profile=None):
	"""Bootstrap data for IMOGI touch cashier page."""
	_require_cashier_access()
	ensure_setup_ready()

	settings = get_settings()
	shift_enabled = _is_pos_shift_enabled()
	opening = _get_pos_opening() if shift_enabled else None
	branch_ctx = _resolve_cashier_branch(branch=branch, pos_profile=pos_profile)
	pos_profile = branch_ctx["pos_profile"]
	profile = frappe.get_doc("POS Profile", pos_profile)
	from imogi_pos.imogi_pos.utils.feature_gating import (
		get_cashier_feature_flags,
		serialize_cashier_feature_meta,
	)
	from imogi_pos.imogi_pos.utils.role_gating import serialize_user_role_context as _serialize_user_role_context
	from imogi_pos.imogi_pos.utils.payment_gateway import is_qris_payment_mode

	feature_flags = get_cashier_feature_flags(settings, user=frappe.session.user)
	payment_rows = []
	for row in profile.payments:
		if is_qris_payment_mode(row.mode_of_payment) and not feature_flags.get("qris"):
			continue
		mode_type = frappe.db.get_value("Mode of Payment", row.mode_of_payment, "type") or "General"
		payment_rows.append(
			{
				"mode_of_payment": row.mode_of_payment,
				"default": cint(row.default),
				"type": mode_type,
			}
		)
	default_mode = next(
		(row["mode_of_payment"] for row in payment_rows if row["default"]),
		payment_rows[0]["mode_of_payment"] if payment_rows else None,
	)
	default_customer = frappe.db.get_value("POS Profile", pos_profile, "customer")

	from imogi_pos.imogi_pos.utils.branch_menu import get_branch_menu_summary, get_item_groups_for_branch
	from erpnext.selling.page.point_of_sale.point_of_sale import get_parent_item_group

	parent_group = get_parent_item_group()
	allowed_groups = get_item_groups_for_branch(
		branch_code=branch_ctx.get("branch_code"), pos_profile=pos_profile
	) or []
	menu_summary = get_branch_menu_summary(
		branch_code=branch_ctx.get("branch_code"), pos_profile=pos_profile
	)
	group_filters = {"is_group": 0}
	if allowed_groups:
		group_filters["name"] = ["in", allowed_groups]
	else:
		group_filters["parent_item_group"] = parent_group

	groups = frappe.get_all(
		"Item Group",
		filters=group_filters,
		fields=["name", "item_group_name"],
		order_by="name asc",
		limit=40,
	)

	requires_shift = _requires_cashier_shift()
	from imogi_pos.api.hold import list_holds
	from imogi_pos.imogi_pos.utils.sales_target import get_sales_target_progress

	from imogi_pos.imogi_pos.utils.payment_gateway import is_gateway_enabled
	from imogi_pos.imogi_pos.utils.loyalty import get_loyalty_config, is_loyalty_enabled
	from imogi_pos.imogi_pos.utils.feature_gating import is_setting_enabled
	from imogi_pos.imogi_pos.utils.offline_checkout import is_offline_cashier_enabled
	from imogi_pos.imogi_pos.utils.promo_rules import is_promo_enabled
	from imogi_pos.imogi_pos.utils.sales_tax import get_sales_tax_config
	from imogi_pos.imogi_pos.utils.franchise import get_branch_franchise_meta
	from imogi_pos.imogi_pos.utils.stamp_card import get_stamp_config, is_stamp_enabled
	from imogi_pos.imogi_pos.utils.feature_registry import get_subscription_tier
	from imogi_pos.imogi_pos.utils.marketplace import is_marketplace_enabled
	from imogi_pos.imogi_pos.utils.transfer_payment import get_transfer_payment_config

	branches = get_accessible_branches(company=branch_ctx["company"])
	held = list_holds(pos_profile=pos_profile).get("holds") or []
	wa_cfg = get_whatsapp_receipt_config(settings)

	return {
		"company": branch_ctx["company"],
		"pos_profile": pos_profile,
		"warehouse": branch_ctx["warehouse"],
		"currency": branch_ctx.get("currency") or profile.currency,
		"business_type": settings.business_type,
		"default_customer": default_customer,
		"enable_receipt_print": cint(settings.enable_receipt_print),
		"thermal_print_mode": settings.thermal_print_mode or "Browser",
		"thermal_printer_width": settings.thermal_printer_width or "58mm",
		"receipt_header": settings.receipt_header or "",
		"receipt_footer": settings.receipt_footer or "",
		"receipt_logo_url": get_receipt_logo_url(settings),
		"receipt_store_name": settings.default_company or branch_ctx["company"],
		"auto_print_receipt_on_success": wa_cfg["auto_print_receipt_on_success"],
		"enable_whatsapp_receipt": wa_cfg["enable_whatsapp_receipt"],
		"payment_gateway_enabled": is_gateway_enabled(),
		"payment_gateway_provider": settings.payment_gateway_provider or settings.payment_gateway or "",
		"transfer_payment": get_transfer_payment_config(settings),
		"loyalty_enabled": is_loyalty_enabled(settings),
		"loyalty": get_loyalty_config(settings),
		"birthday_promo": {
			"enabled": is_setting_enabled("enable_birthday_promo", settings),
			"discount_percent": flt(getattr(settings, "birthday_discount_percent", 10)) or 10,
			"window_days": cint(getattr(settings, "birthday_window_days", 0)),
		},
		"enable_promo_rules": is_promo_enabled(settings),
		"sales_tax": get_sales_tax_config(settings),
		"enable_offline_cashier": is_offline_cashier_enabled(settings),
		"enable_stamp_card": is_stamp_enabled(settings),
		"stamp": get_stamp_config(settings),
		"enable_marketplace_orders": is_marketplace_enabled(settings),
		"franchise": get_branch_franchise_meta(
			branch_code=branch_ctx.get("branch_code"), pos_profile=pos_profile
		)
		or {"branch_model": "Owned"},
		"enable_pos_shift": _is_pos_shift_enabled(),
		"requires_shift_workflow": requires_shift and _is_pos_shift_enabled(),
		"subscription_tier": get_subscription_tier(settings),
		"features": feature_flags,
		"feature_meta": serialize_cashier_feature_meta(settings, user=frappe.session.user),
		"role_context": _serialize_user_role_context(frappe.session.user, settings),
		"payment_modes": payment_rows,
		"default_payment_mode": default_mode,
		"item_groups": [{"name": "", "label": _("Semua")}] + [
			{"name": g.name, "label": g.item_group_name or g.name} for g in groups
		],
		"pos_categories": [{"name": "", "label": _("Semua")}] + [
			{"name": category, "label": category}
			for category in POS_CATEGORIES
			if category != COMBO_PACKAGE_CATEGORY
			or is_feature_operational("combo_package", settings, user=frappe.session.user)
		],
		"pos_opening": opening,
		"held_orders": held,
		"sales_target": get_sales_target_progress(
			company=branch_ctx["company"],
			target_amount=branch_ctx.get("target_monthly_sales"),
			pos_profile=pos_profile,
		),
		"multi_branch_enabled": (cint(settings.multi_branch) or len(branches) > 1)
		and feature_flags.get("multi_outlet", False),
		"branches": branches,
		"active_branch": {
			"branch_code": branch_ctx.get("branch_code"),
			"branch_name": branch_ctx.get("branch_name"),
			"warehouse": branch_ctx.get("warehouse"),
			"pos_profile": pos_profile,
			"city": branch_ctx.get("city"),
			"selling_price_list": branch_ctx.get("selling_price_list"),
			"use_custom_menu": cint(branch_ctx.get("use_custom_menu")),
		},
		"menu_summary": menu_summary,
		"selling_price_list": branch_ctx.get("selling_price_list"),
		"branch_locked_by_shift": bool(_opening_pos_profile(opening)),
	}


@frappe.whitelist()
def set_active_branch(branch_code):
	"""Persist cashier branch choice for the current user."""
	_require_cashier_access()
	ensure_setup_ready()

	if _is_pos_shift_enabled() and _opening_pos_profile(_get_pos_opening()):
		frappe.throw(
			_("Shift masih terbuka. Tutup shift dulu sebelum ganti cabang."),
			title=_("Cabang Terkunci"),
		)

	_resolve_cashier_branch(branch=branch_code, strict=True)
	return get_cashier_context()


@frappe.whitelist()
def checkout(
	items,
	payments,
	customer=None,
	customer_phone=None,
	customer_label=None,
	order_channel="Walk-in",
	order_type="Takeaway",
	discount_type=None,
	discount_value=None,
	voucher_code=None,
	loyalty_points_redeem=0,
	offline_client_id=None,
	marketplace_order_name=None,
	order_name=None,
	addon_order_name=None,
	pos_profile=None,
	branch=None,
	restaurant_table=None,
	approval_code=None,
):
	"""Create or complete an order from the touch cashier."""
	_require_cashier_access()
	ensure_setup_ready()
	_require_pos_opening()

	payments_list = _parse_json(payments, "payments") or []
	if not payments_list:
		frappe.throw(_("payments is required"))

	branch_ctx, settings, parsed_items, checkout_totals = _validate_cashier_cart(
		items=items,
		customer=customer,
		customer_phone=customer_phone,
		order_type=order_type,
		voucher_code=voucher_code,
		loyalty_points_redeem=loyalty_points_redeem,
		marketplace_order_name=marketplace_order_name,
		restaurant_table=restaurant_table,
		branch=branch,
		pos_profile=pos_profile,
		discount_type=discount_type,
		discount_value=discount_value,
		approval_code=approval_code,
	)

	customer_phone = _require_whatsapp_customer_phone(
		customer,
		customer_phone,
		branch_ctx["pos_profile"],
		order_name=order_name or addon_order_name,
	)

	addon_order_name = _resolve_table_addon_order(
		restaurant_table,
		addon_order_name,
		company=branch_ctx.get("company"),
	)

	if len(payments_list) > 1:
		from imogi_pos.imogi_pos.utils.feature_gating import require_feature_operational

		require_feature_operational("multi_payment", settings)

	if offline_client_id:
		from imogi_pos.imogi_pos.utils.offline_checkout import get_existing_offline_order

		existing = get_existing_offline_order(offline_client_id)
		if existing and existing.order:
			order = frappe.get_doc("Riwayat Order", existing.order)
			return _serialize_order(order)

	if marketplace_order_name:
		from imogi_pos.imogi_pos.utils.marketplace import complete_marketplace_order

		order = complete_marketplace_order(
			marketplace_order_name,
			payments_list,
			customer=customer,
			discount_type=discount_type,
			discount_value=discount_value,
			voucher_code=voucher_code,
			loyalty_points_redeem=loyalty_points_redeem,
			items=parsed_items,
		)
	elif addon_order_name:
		order = frappe.get_doc("Riwayat Order", addon_order_name)
		order.check_permission("write")
		_verify_table_order_addon(order)
		order = _append_addon_to_table_order(
			order,
			parsed_items,
			payments_list,
			warehouse=branch_ctx["warehouse"],
			settings=settings,
		)
	elif order_name:
		order = frappe.get_doc("Riwayat Order", order_name)
		order.check_permission("write")
		_verify_cashier_pending_order(order)
		_claim_qr_cash_order(order)
		order = _sync_awaiting_order_from_checkout(
			order,
			parsed_items,
			discount_type=discount_type,
			discount_value=discount_value,
			voucher_code=voucher_code,
			loyalty_points_redeem=loyalty_points_redeem,
			customer=customer,
			customer_phone=customer_phone,
			customer_label=customer_label,
			warehouse=branch_ctx["warehouse"],
			branch_code=branch_ctx.get("branch_code"),
			settings=settings,
		)
		_apply_payments_to_order(order, payments_list)
	else:
		_assert_no_duplicate_table_order(
			restaurant_table,
			company=branch_ctx.get("company"),
		)
		order = _create_cashier_order(
			items,
			customer,
			order_channel,
			order_type,
			payments_list,
			discount_type,
			discount_value,
			pos_profile=branch_ctx["pos_profile"],
			warehouse=branch_ctx["warehouse"],
			company=branch_ctx["company"],
			voucher_code=voucher_code,
			loyalty_points_redeem=loyalty_points_redeem,
			offline_client_id=offline_client_id,
			restaurant_table=restaurant_table,
			branch=branch_ctx.get("branch_code"),
			customer_phone=customer_phone,
		)
	if not addon_order_name:
		order.action_process_payment(silent=True)
	order.reload()
	frappe.db.commit()

	if offline_client_id:
		from imogi_pos.imogi_pos.utils.offline_checkout import record_offline_checkout

		record_offline_checkout(
			offline_client_id,
			{
				"items": items,
				"payments": payments,
				"customer": customer,
				"voucher_code": voucher_code,
				"loyalty_points_redeem": loyalty_points_redeem,
			},
			order_name=order.name,
		)
		frappe.db.commit()

	result = _serialize_order(order)
	if getattr(frappe.flags, "imogi_stamp_reward", None):
		result["stamp_reward"] = frappe.flags.imogi_stamp_reward
	event = "order.completed" if order.status == "Completed" else "order.created"
	emit_order_webhook(order.name, event)
	return result


@frappe.whitelist()
def get_pos_opening_status():
	"""Current user's open POS shift."""
	_require_cashier_access()
	if not _is_pos_shift_enabled():
		return {"enabled": False, "open": False}
	opening = _get_pos_opening()
	if not opening:
		return {"enabled": True, "open": False}
	return {
		"enabled": True,
		"open": True,
		"name": opening.get("name"),
		"pos_profile": opening.get("pos_profile"),
		"company": opening.get("company"),
		"period_start_date": opening.get("period_start_date"),
	}


@frappe.whitelist()
def get_cashier_landing_status():
	"""Fresh landing target for IMOGI Cashier (used after login redirect)."""
	from imogi_pos.boot import get_cashier_landing, should_use_cashier_home

	if not should_use_cashier_home():
		return {"active": False}

	from imogi_pos.imogi_pos.utils.flow import get_settings, resolve_company

	settings = get_settings()
	company = resolve_company(None, settings)
	return {
		"active": True,
		"landing": get_cashier_landing(),
		"has_open_shift": get_cashier_landing() == "cashier",
		"requires_shift_workflow": True,
		"company": company,
		"pos_profile": settings.default_pos_profile,
	}


@frappe.whitelist()
def finalize_pending_shift_close():
	"""Finish queued POS Closing Entry merge so Buka Shift page can load."""
	_require_cashier_access()

	from imogi_pos.boot import get_cashier_landing
	from imogi_pos.imogi_pos.utils.shift_closing import _ensure_opening_closed_after_closing

	opening = _get_pos_opening()
	if not opening:
		landing = get_cashier_landing()
		return {"landing": landing, "already_open": landing == "cashier"}

	opening_name = opening.get("name") if isinstance(opening, dict) else opening
	opening_company = (
		opening.get("company")
		if isinstance(opening, dict)
		else frappe.db.get_value("POS Opening Entry", opening_name, "company")
	)

	from imogi_pos.imogi_pos.utils.pos_consolidation import repair_mode_of_payment_accounts
	from imogi_pos.imogi_pos.utils.shift_closing import _ensure_opening_closed_after_closing

	repair_mode_of_payment_accounts(opening_company)

	closing = frappe.db.get_value(
		"POS Closing Entry",
		{"pos_opening_entry": opening_name, "docstatus": 1},
		["name", "status", "error_message"],
		as_dict=True,
		order_by="creation desc",
	)
	if closing:
		_ensure_opening_closed_after_closing(opening_name, closing.name)

	landing = get_cashier_landing()
	return {
		"landing": landing,
		"already_open": landing == "cashier",
		"pos_opening_entry": opening_name,
	}


@frappe.whitelist()
def get_shift_opening_page_context(pos_profile=None, branch=None):
	"""Context for custom Buka Shift page."""
	_require_cashier_access()
	ensure_setup_ready()

	if not _is_pos_shift_enabled():
		frappe.throw(_("Shift kasir dinonaktifkan di IMOGI POS Settings"))

	opening = _get_pos_opening()
	if opening:
		from imogi_pos.boot import get_cashier_landing

		landing = get_cashier_landing()
		return {
			"already_open": landing == "cashier",
			"landing": landing,
			"pos_opening_entry": opening.get("name") if isinstance(opening, dict) else opening,
		}

	from imogi_pos.imogi_pos.utils.shift_opening import get_shift_opening_page_context as _context

	branch_ctx = _resolve_cashier_branch(branch=branch, pos_profile=pos_profile)
	ctx = _context(pos_profile=branch_ctx["pos_profile"])
	ctx["branch_code"] = branch_ctx.get("branch_code")
	return ctx


@frappe.whitelist()
def submit_shift_opening(payments, remarks=None, pos_profile=None, branch=None):
	"""Create/submit IMOGI POS Shift Opening from custom page."""
	_require_cashier_access()
	ensure_setup_ready()

	if not _is_pos_shift_enabled():
		frappe.throw(_("Shift kasir dinonaktifkan di IMOGI POS Settings"))

	if _get_pos_opening():
		frappe.throw(_("Shift kasir sudah dibuka"))

	from imogi_pos.imogi_pos.utils.shift_opening import create_and_submit_shift_opening

	branch_ctx = _resolve_cashier_branch(branch=branch, pos_profile=pos_profile)
	result = create_and_submit_shift_opening(
		payments,
		remarks=remarks,
		pos_profile=branch_ctx["pos_profile"],
		company=branch_ctx["company"],
	)
	result.update(
		{
			"branch_code": branch_ctx.get("branch_code"),
			"company": branch_ctx.get("company"),
			"pos_profile": branch_ctx.get("pos_profile"),
		}
	)
	return result


@frappe.whitelist()
def get_shift_closing_page_context(pos_opening_entry=None):
	"""Context for custom Tutup Shift page."""
	_require_cashier_access()
	ensure_setup_ready()

	if not _is_pos_shift_enabled():
		frappe.throw(_("Shift kasir dinonaktifkan di IMOGI POS Settings"))

	from imogi_pos.imogi_pos.utils.shift_closing import get_shift_closing_page_context as _context

	return _context(pos_opening_entry=pos_opening_entry)


@frappe.whitelist()
def submit_shift_closing(pos_opening_entry, actual_cash=0, expenses=0, remarks=None, draft_name=None):
	"""Submit IMOGI POS Shift Closing and sync to POS Closing Entry."""
	_require_cashier_access()
	ensure_setup_ready()

	if not _is_pos_shift_enabled():
		frappe.throw(_("Shift kasir dinonaktifkan di IMOGI POS Settings"))

	if not _get_pos_opening():
		frappe.throw(_("Tidak ada shift terbuka."))

	from imogi_pos.imogi_pos.utils.shift_closing import create_and_submit_shift_closing

	return create_and_submit_shift_closing(
		pos_opening_entry,
		actual_cash=actual_cash,
		expenses=expenses,
		remarks=remarks,
		draft_name=draft_name,
	)


@frappe.whitelist()
def save_shift_closing_draft(pos_opening_entry, actual_cash=0, expenses=0, remarks=None, draft_name=None):
	"""Save draft IMOGI POS Shift Closing without submitting."""
	_require_cashier_access()
	ensure_setup_ready()

	if not _is_pos_shift_enabled():
		frappe.throw(_("Shift kasir dinonaktifkan di IMOGI POS Settings"))

	if not _get_pos_opening():
		frappe.throw(_("Tidak ada shift terbuka."))

	from imogi_pos.imogi_pos.utils.shift_closing import save_shift_closing_draft as _save

	return _save(
		pos_opening_entry,
		actual_cash=actual_cash,
		expenses=expenses,
		remarks=remarks,
		draft_name=draft_name,
	)


@frappe.whitelist()
def create_cash_movement_api(pos_opening_entry, movement_type, amount, reason, approval_code=None):
	"""Catat kas masuk/keluar ad-hoc selama shift masih terbuka."""
	_require_cashier_access()
	ensure_setup_ready()

	if not _is_pos_shift_enabled():
		frappe.throw(_("Shift kasir dinonaktifkan di IMOGI POS Settings"))

	from imogi_pos.imogi_pos.utils.shift_closing import create_cash_movement

	return create_cash_movement(pos_opening_entry, movement_type, amount, reason, approval_code=approval_code)


@frappe.whitelist()
def list_cash_movements_api(pos_opening_entry):
	"""Histori Cash In/Out buat shift ini — dipakai selama shift jalan & di halaman Tutup Shift."""
	_require_cashier_access()
	ensure_setup_ready()

	from imogi_pos.imogi_pos.utils.shift_closing import list_cash_movements

	return list_cash_movements(pos_opening_entry)


@frappe.whitelist()
def get_shift_opening_defaults():
	"""Defaults for IMOGI POS Shift Opening form (company, profile, payment rows)."""
	_require_cashier_access()
	ensure_setup_ready()

	from imogi_pos.imogi_pos.utils.shift_opening import get_shift_opening_defaults as _defaults

	return _defaults()


@frappe.whitelist()
def get_opening_entry_defaults():
	"""Backward-compatible alias for native POS Opening Entry form."""
	data = get_shift_opening_defaults()
	return {
		"company": data["company"],
		"pos_profile": data["pos_profile"],
		"balance_details": [
			{"mode_of_payment": row["mode_of_payment"], "opening_amount": row["opening_amount"]}
			for row in data["payments"]
		],
	}


@frappe.whitelist()
def create_pos_opening(balance_details=None, pos_profile=None, branch=None):
	"""Open POS shift for current user (ERPNext POS Opening Entry)."""
	_require_cashier_access()
	ensure_setup_ready()

	if not _is_pos_shift_enabled():
		frappe.throw(_("Shift kasir dinonaktifkan di IMOGI POS Settings"))

	if _get_pos_opening():
		frappe.throw(_("Shift kasir sudah dibuka"))

	branch_ctx = _resolve_cashier_branch(branch=branch, pos_profile=pos_profile)
	from erpnext.selling.page.point_of_sale.point_of_sale import create_opening_voucher

	if balance_details:
		if isinstance(balance_details, str):
			details = balance_details
		else:
			details = json.dumps(balance_details)
	else:
		details = json.dumps(
			_get_opening_balance_details(branch_ctx["company"], branch_ctx["pos_profile"])
		)

	result = create_opening_voucher(
		branch_ctx["pos_profile"],
		branch_ctx["company"],
		details,
	)
	frappe.db.commit()
	return result


@frappe.whitelist()
def search_customers(search=None, limit=10):
	"""Search customers for cashier picker."""
	_require_cashier_access()
	from imogi_pos.api.customer_api import _find_customers
	from imogi_pos.imogi_pos.utils.loyalty import get_customer_loyalty, is_loyalty_enabled

	customers = _find_customers(search, limit)
	if is_loyalty_enabled():
		for row in customers:
			loyalty = get_customer_loyalty(row.get("name"))
			row["loyalty_points"] = loyalty.get("points", 0)
	return {"customers": customers}


@frappe.whitelist()
def create_customer(customer_name, customer_type="Individual", mobile_no=None, email_id=None, date_of_birth=None):
	"""Quick-create customer from IMOGI Kasir."""
	_require_cashier_access()
	ensure_setup_ready()
	from imogi_pos.api.customer_api import create_customer_record

	return create_customer_record(
		customer_name, customer_type, mobile_no, email_id, date_of_birth=date_of_birth
	)


@frappe.whitelist()
def update_customer_phone(customer, mobile_no):
	"""Add or update customer mobile number from IMOGI Kasir."""
	_require_cashier_access()
	ensure_setup_ready()
	if not customer or not frappe.db.exists("Customer", customer):
		frappe.throw(_("Customer {0} not found").format(customer))

	mobile_no = (mobile_no or "").strip()
	if not mobile_no:
		frappe.throw(_("Nomor HP wajib diisi"))

	from imogi_pos.api.customer_api import _serialize_customer, _upsert_customer_contact

	doc = frappe.get_doc("Customer", customer)
	_upsert_customer_contact(doc, doc.customer_name, mobile_no=mobile_no)
	frappe.db.commit()
	return _serialize_customer(doc, mobile_no=mobile_no)


@frappe.whitelist()
def scan_barcode(barcode, pos_profile=None, branch=None):
	"""Resolve barcode / item code for cashier scanner (auto-add to cart)."""
	_require_cashier_access()
	ensure_setup_ready()

	barcode = (barcode or "").strip()
	if not barcode:
		frappe.throw(_("Barcode is required"))

	from imogi_pos.api.catalog import (
		_allowed_item_groups,
		_get_pos_context,
		_get_item_price_rate,
		_serialize_item,
		get_item,
	)
	from erpnext.selling.page.point_of_sale.point_of_sale import filter_result_items, search_by_term

	ctx = _get_pos_context(pos_profile or get_settings().default_pos_profile, branch=branch)
	result = search_by_term(barcode, ctx["warehouse"], ctx["price_list"])
	items = []
	if result and result.get("items"):
		filter_result_items(result, ctx["pos_profile"])
		items = result.get("items") or []

	if not items and frappe.db.exists("Item", barcode):
		from imogi_pos.api.catalog import get_item

		meta = frappe.db.get_value(
			"Item",
			barcode,
			["name", "item_name", "item_group", "has_variants", "disabled", "is_sales_item"],
			as_dict=True,
		)
		if meta and not meta.disabled and meta.is_sales_item:
			from imogi_pos.imogi_pos.utils.bom_stock import needs_variant_picker

			if needs_variant_picker(meta.name):
				return _serialize_item(
					{
						"item_code": meta.name,
						"item_name": meta.item_name,
						"item_group": meta.item_group,
						"price_list_rate": _get_item_price_rate(meta.name, ctx),
						"currency": ctx["currency"],
						"has_variants": 1,
					},
					warehouse=ctx["warehouse"],
				)

		try:
			return get_item(barcode, ctx["pos_profile"], branch=branch)
		except frappe.ValidationError:
			pass

	if not items:
		frappe.throw(_("Barcode not found: {0}").format(barcode))

	item = items[0]
	allowed_groups = _allowed_item_groups(ctx)
	if allowed_groups and item.get("item_group") not in allowed_groups:
		frappe.throw(_("Item not allowed for this branch"))

	return _serialize_item(item, warehouse=ctx["warehouse"])


@frappe.whitelist()
def get_receipt_url(order_name):
	"""Print view URL for order receipt."""
	_require_cashier_access()
	if not frappe.db.exists("Riwayat Order", order_name):
		frappe.throw(_("Order {0} not found").format(order_name))

	settings = get_settings()
	print_format = settings.receipt_print_format or "IMOGI POS Receipt"
	return {
		"url": f"/printview?doctype=Riwayat Order&name={order_name}&format={print_format}&trigger_print=1",
		"print_format": print_format,
	}


def _normalize_whatsapp_phone(phone):
	if not phone:
		return ""
	digits = re.sub(r"\D", "", str(phone).strip())
	if not digits:
		return ""
	if digits.startswith("0"):
		digits = "62" + digits[1:]
	elif not digits.startswith("62"):
		digits = "62" + digits
	return digits


def _get_order_whatsapp_phone(order, settings, customer_phone=None):
	phone = (customer_phone or "").strip()
	customer = None
	if not phone:
		if isinstance(order, dict):
			phone = (order.get("customer_phone") or "").strip()
			customer = order.get("customer")
		else:
			phone = (getattr(order, "customer_phone", None) or "").strip()
			customer = getattr(order, "customer", None)
	if not phone and customer:
		phone = _resolve_customer_phone(customer)
	return _normalize_whatsapp_phone(phone)


def _build_receipt_pdf_path(order_name, print_format):
	query = (
		f"doctype={quote('Riwayat Order')}"
		f"&name={quote(order_name)}"
		f"&format={quote(print_format)}"
		"&no_letterhead=1"
	)
	return f"/api/method/frappe.utils.print_format.download_pdf?{query}"


def _build_receipt_pdf_url(order_name, print_format):
	from imogi_pos.imogi_pos.utils.receipt_branding import build_public_site_url

	return build_public_site_url(_build_receipt_pdf_path(order_name, print_format))


def _generate_receipt_pdf_bytes(order_name, print_format):
	"""Render receipt print format to PDF bytes for WhatsApp attachment."""
	from imogi_pos.imogi_pos.utils.receipt_branding import generate_receipt_pdf_bytes

	return generate_receipt_pdf_bytes(order_name, print_format)


def _format_whatsapp_message(template, *, order_name, total, customer, pdf_url="", strip_pdf_lines=False):
	message = (template or "").format(
		order_name=order_name,
		total=total,
		pdf_url=pdf_url or "",
		customer=customer or "",
	)
	# Optionally drop pdf-link lines when sending file attachment.
	lines = []
	for line in message.splitlines():
		stripped = line.strip()
		if not stripped:
			lines.append("")
			continue
		if strip_pdf_lines and pdf_url and pdf_url in stripped:
			continue
		if strip_pdf_lines and stripped.lower().startswith("unduh struk pdf"):
			continue
		lines.append(line)
	text = "\n".join(lines)
	while "\n\n\n" in text:
		text = text.replace("\n\n\n", "\n\n")
	return text.strip()


@frappe.whitelist()
def get_receipt_whatsapp_share(order_name, customer_phone=None):
	"""WhatsApp share payload for receipt PDF (manual / browser fallback)."""
	_require_cashier_access()
	payload = _prepare_whatsapp_receipt(order_name, customer_phone)
	payload["pdf_base64"] = base64.b64encode(payload.pop("_pdf_bytes")).decode("ascii")
	payload["sent"] = False
	return payload


def send_order_receipt_whatsapp_auto(order_name, customer_phone=None):
	"""Auto-send receipt WA (Fonnte Free-safe: text + PDF link)."""
	try:
		if cint(frappe.db.get_value("Riwayat Order", order_name, "whatsapp_receipt_sent")):
			return {"sent": False, "reason": "already_sent"}

		settings = get_settings()
		wa_cfg = get_whatsapp_receipt_config(settings)
		if not wa_cfg["enable_whatsapp_receipt"]:
			return {"sent": False, "reason": "disabled"}
		if (wa_cfg.get("whatsapp_api_provider") or "").strip() != "Fonnte":
			return {"sent": False, "reason": "manual_only"}

		from imogi_pos.imogi_pos.utils.qr_table_order import _mark_qr_wa_sent, _qr_wa_already_sent

		if _qr_wa_already_sent(order_name, "receipt"):
			return {"sent": False, "reason": "already_sent"}

		payload = _prepare_whatsapp_receipt(
			order_name,
			customer_phone,
			include_pdf_bytes=False,
			use_guest_receipt_link=True,
		)
		payload.pop("_pdf_bytes", None)
		from imogi_pos.imogi_pos.utils.whatsapp_send import send_fonnte_message

		result = send_fonnte_message(
			wa_cfg["fonnte_api_token"],
			payload["phone"],
			payload["message_with_pdf_link"] or payload["message"],
		)
		frappe.db.set_value(
			"Riwayat Order",
			order_name,
			"whatsapp_receipt_sent",
			1,
			update_modified=False,
		)
		frappe.db.commit()
		_mark_qr_wa_sent(order_name, "receipt")
		frappe.enqueue(
			"imogi_pos.imogi_pos.utils.receipt_branding.publish_receipt_pdf_job",
			queue="long",
			order_name=order_name,
			job_id=f"imogi_pdf_{order_name}",
			deduplicate=True,
			timeout=600,
		)
		return {"sent": True, "phone": result.get("phone") or payload["phone"]}
	except Exception:
		frappe.log_error(
			title=_("IMOGI auto WhatsApp receipt failed for {0}").format(order_name),
			message=frappe.get_traceback(),
		)
		return {"sent": False, "reason": "error"}


@frappe.whitelist()
def send_whatsapp_receipt(order_name, customer_phone=None):
	"""Send receipt via WhatsApp — Fonnte Free-safe text + PDF link."""
	_require_cashier_access()
	payload = _prepare_whatsapp_receipt(
		order_name,
		customer_phone,
		include_pdf_bytes=False,
		use_guest_receipt_link=True,
	)
	pdf_bytes = payload.pop("_pdf_bytes", b"")
	settings = get_settings()
	wa_cfg = get_whatsapp_receipt_config(settings)

	if (wa_cfg.get("whatsapp_api_provider") or "").strip() == "Fonnte":
		from imogi_pos.imogi_pos.utils.whatsapp_send import send_fonnte_message

		result = send_fonnte_message(
			wa_cfg["fonnte_api_token"],
			payload["phone"],
			payload["message_with_pdf_link"] or payload["message"],
		)
		frappe.db.set_value(
			"Riwayat Order",
			order_name,
			"whatsapp_receipt_sent",
			1,
			update_modified=False,
		)
		frappe.db.commit()
		frappe.enqueue(
			"imogi_pos.imogi_pos.utils.receipt_branding.publish_receipt_pdf_job",
			queue="long",
			order_name=order_name,
			job_id=f"imogi_pdf_{order_name}",
			deduplicate=True,
			timeout=600,
		)
		return {
			"sent": True,
			"method": "fonnte",
			"phone": result.get("phone") or payload["phone"],
			"message": payload["message_with_pdf_link"] or payload["message"],
		}

	payload["pdf_base64"] = base64.b64encode(pdf_bytes).decode("ascii")
	payload["sent"] = False
	return payload


def _prepare_whatsapp_receipt(
	order_name,
	customer_phone=None,
	include_pdf_bytes=True,
	use_guest_receipt_link=False,
):
	"""Build WhatsApp receipt payload + PDF bytes."""
	if not frappe.db.exists("Riwayat Order", order_name):
		frappe.throw(_("Order {0} not found").format(order_name))

	settings = get_settings()
	wa_cfg = get_whatsapp_receipt_config(settings)
	if not wa_cfg["enable_whatsapp_receipt"]:
		frappe.throw(_("Fitur kirim struk WhatsApp tidak aktif di Settings."))

	order = frappe.get_doc("Riwayat Order", order_name)
	print_format = settings.receipt_print_format or "IMOGI POS Receipt"
	pdf_path = _build_receipt_pdf_path(order_name, print_format)
	phone = _get_order_whatsapp_phone(order, settings, customer_phone=customer_phone)

	if not phone:
		frappe.throw(
			_("Nomor HP customer tidak ditemukan. Isi <b>No. HP / WhatsApp</b> saat membuat customer di kasir.")
		)

	template = wa_cfg["whatsapp_receipt_message"]
	total = fmt_money(order.grand_total, currency=order.currency)
	customer_label = order.customer_name or order.customer or ""
	if use_guest_receipt_link:
		from imogi_pos.api.receipt_api import build_guest_receipt_url

		pdf_public_url = build_guest_receipt_url(order_name)
	else:
		from imogi_pos.imogi_pos.utils.receipt_branding import ensure_receipt_pdf_published

		pdf_public_url = ensure_receipt_pdf_published(order_name, print_format)
	message = _format_whatsapp_message(
		template,
		order_name=order.name,
		total=total,
		customer=customer_label,
		pdf_url="",
	)
	message_with_pdf_link = _format_whatsapp_message(
		template,
		order_name=order.name,
		total=total,
		customer=customer_label,
		pdf_url=pdf_public_url,
	)
	if "{pdf_url}" not in (template or ""):
		message_with_pdf_link = (
			f"{message_with_pdf_link}\n\nUnduh struk PDF:\n{pdf_public_url}".strip()
			if message_with_pdf_link
			else f"Unduh struk PDF:\n{pdf_public_url}"
		)
	wa_url = f"https://wa.me/{phone}?text={quote(message_with_pdf_link)}" if phone else ""
	pdf_bytes = b""
	if include_pdf_bytes:
		pdf_bytes = _generate_receipt_pdf_bytes(order_name, print_format)

	return {
		"phone": phone,
		"message": message,
		"message_with_pdf_link": message_with_pdf_link,
		"pdf_path": pdf_path,
		"pdf_url": pdf_public_url or get_url(pdf_path),
		"pdf_public_url": pdf_public_url,
		"wa_url": wa_url,
		"filename": f"{order.name}.pdf",
		"server_send_enabled": (wa_cfg.get("whatsapp_api_provider") or "").strip() == "Fonnte"
		and bool((wa_cfg.get("fonnte_api_token") or "").strip()),
		"_pdf_bytes": pdf_bytes,
	}


@frappe.whitelist()
def update_awaiting_order_customer(order_name, customer=None, customer_phone=None, customer_label=None):
	"""Sync customer + phone on unpaid cashier order or table addon checkout."""
	_require_cashier_access()
	order = frappe.get_doc("Riwayat Order", order_name)
	order.check_permission("write")
	if order.status == "Awaiting Payment":
		_verify_cashier_pending_order(order)
	elif order.restaurant_table and order.status in TABLE_ORDER_ADDON_STATUSES:
		_verify_table_order_addon(order)
	else:
		frappe.throw(_("Order {0} is not awaiting payment").format(order.name))

	resolved_customer = customer if customer and frappe.db.exists("Customer", customer) else order.customer
	phone = (customer_phone or "").strip() or _resolve_checkout_customer_phone(
		customer=resolved_customer,
		order_name=order.name,
	)

	updates = {}
	if customer and frappe.db.exists("Customer", customer):
		updates["customer"] = customer
	if phone:
		updates["customer_phone"] = phone
	guest_name = _guest_name_to_preserve(order, customer_label=customer_label)
	if guest_name:
		updates["customer_name"] = guest_name

	if updates:
		for field, value in updates.items():
			frappe.db.set_value("Riwayat Order", order.name, field, value, update_modified=True)

	frappe.db.commit()
	return {
		"customer": updates.get("customer") or order.customer,
		"customer_phone": updates.get("customer_phone") or order.customer_phone or "",
		"customer_name": updates.get("customer_name") or order.customer_name or "",
	}


@frappe.whitelist()
def get_customer_contact(customer):
	"""Mobile/email for customer picker in IMOGI Kasir."""
	_require_cashier_access()
	if not customer or not frappe.db.exists("Customer", customer):
		return {"mobile_no": "", "email_id": ""}
	from imogi_pos.api.customer_api import _get_customer_contact

	contact = _get_customer_contact(customer) or {}
	from imogi_pos.api.customer_api import _contact_phone

	return {
		"mobile_no": _contact_phone(contact),
		"email_id": (contact.get("email_id") or "").strip(),
	}


@frappe.whitelist()
def resolve_checkout_customer_phone(customer=None, customer_phone=None, order_name=None):
	"""Resolve customer phone for cashier checkout validation."""
	_require_cashier_access()
	pos_profile = _resolve_cashier_branch().get("pos_profile")
	phone = _resolve_checkout_customer_phone(
		customer=customer,
		customer_phone=customer_phone,
		pos_profile=pos_profile,
		order_name=order_name,
	)
	return {"phone": phone, "ok": bool(phone)}


@frappe.whitelist()
def get_receipt_delivery_flags():
	"""Latest receipt auto-print / WhatsApp flags for cashier UI."""
	_require_cashier_access()
	return get_whatsapp_receipt_config(get_settings())


@frappe.whitelist()
def get_awaiting_orders(limit=10):
	"""Open orders waiting for payment (for dashboard/cashier)."""
	_require_cashier_access()
	limit = min(cint(limit) or 10, 50)
	return frappe.get_all(
		"Riwayat Order",
		filters={"status": "Awaiting Payment", "docstatus": 1},
		fields=["name", "grand_total", "customer", "modified", "order_channel"],
		order_by="modified desc",
		limit=limit,
	)


@frappe.whitelist()
def load_checkout_order(order_name, pos_profile=None, branch=None):
	"""Load an awaiting QR Cash order into cashier checkout."""
	_require_cashier_access()
	ensure_setup_ready()
	order_name = (order_name or "").strip()
	if not order_name:
		frappe.throw(_("Order wajib diisi"))
	order = frappe.get_doc("Riwayat Order", order_name)
	order.check_permission("read")
	_verify_cashier_pending_order(order)
	_claim_qr_cash_order(order)
	frappe.db.commit()
	return _serialize_order(order)
