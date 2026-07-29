# Copyright (c) 2026, Imogi and contributors

import json

import frappe
from frappe import _
from frappe.utils import cint, flt

from imogi_pos.api.auth import ensure_setup_ready, validate_order_api_access
from imogi_pos.imogi_pos.utils.flow import get_settings, resolve_company, settings_for_company
from imogi_pos.imogi_pos.utils.webhook import emit_order_webhook


def _parse_json(value, label):
	if value is None:
		return None
	if isinstance(value, (list, dict)):
		return value
	try:
		return json.loads(value)
	except Exception:
		frappe.throw(_("{0} must be valid JSON").format(label))


def _resolve_item_display_name(item_code, item_name=None):
	name = (item_name or "").strip()
	if name:
		return name
	code = (item_code or "").strip()
	if not code:
		return ""
	return frappe.db.get_value("Item", code, "item_name") or code


def _serialize_order(order):
	return {
		"name": order.name,
		"creation": order.creation,
		"status": order.status,
		"docstatus": order.docstatus,
		"company": order.company,
		"customer": order.customer,
		"customer_name": order.customer_name,
		"customer_phone": order.customer_phone or "",
		"order_channel": order.order_channel,
		"order_type": order.order_type,
		"order_source": order.order_source,
		"restaurant_table": order.restaurant_table,
		"grand_total": flt(order.grand_total),
		"subtotal": flt(order.subtotal),
		"discount_type": order.discount_type,
		"discount_value": flt(order.discount_value),
		"discount_amount": flt(order.discount_amount),
		"promo_discount_amount": flt(order.promo_discount_amount),
		"voucher_discount_amount": flt(order.voucher_discount_amount),
		"loyalty_discount_amount": flt(order.loyalty_discount_amount),
		"taxable_amount": flt(order.taxable_amount),
		"tax_amount": flt(order.tax_amount),
		"refunded_amount": flt(order.refunded_amount),
		"paid_amount": flt(order.paid_amount),
		"payment_method": order.payment_method or "",
		"currency": order.currency,
		"pos_invoice": order.pos_invoice,
		"return_pos_invoice": order.return_pos_invoice,
		"items": [
			{
				"item_code": row.item_code,
				"item_name": _resolve_item_display_name(row.item_code, row.item_name),
				"qty": flt(row.qty),
				"rate": flt(row.rate),
				"amount": flt(row.amount),
				"uom": row.uom,
			}
			for row in order.items
		],
		"payments": [
			{"mode_of_payment": row.mode_of_payment, "amount": flt(row.amount)}
			for row in order.payments
		],
	}


def _build_order(
	items,
	customer=None,
	order_channel="Web",
	order_type="Takeaway",
	remarks=None,
	payments=None,
	discount_type=None,
	discount_value=None,
	company=None,
):
	settings = get_settings()
	company = ensure_setup_ready(company)
	settings = settings_for_company(company, settings)

	items = _parse_json(items, "items") or []
	if not items:
		frappe.throw(_("At least one item is required"))

	order = frappe.new_doc("Riwayat Order")
	order.company = company
	order.pos_profile = settings.default_pos_profile
	order.order_channel = order_channel or "Web"
	order.order_type = order_type or "Takeaway"
	order.order_source = "IMOGI API"
	order.customer = customer or _default_customer(settings.default_pos_profile)
	order.remarks = remarks
	order.discount_type = discount_type or ""
	order.discount_value = flt(discount_value)

	default_warehouse = settings.default_warehouse
	for row in items:
		if not row.get("item_code"):
			frappe.throw(_("Each item must include item_code"))
		order.append(
			"items",
			{
				"item_code": row["item_code"],
				"qty": flt(row.get("qty") or 1),
				"rate": flt(row.get("rate") or 0),
				"warehouse": row.get("warehouse") or default_warehouse,
				"uom": row.get("uom"),
			},
		)

	if payments:
		_append_payments(order, payments)

	order.insert(ignore_permissions=True)
	order.submit()
	return order


def _append_payments(order, payments):
	for row in payments:
		if not row.get("mode_of_payment"):
			frappe.throw(_("Each payment must include mode_of_payment"))
		order.append(
			"payments",
			{
				"mode_of_payment": row["mode_of_payment"],
				"amount": flt(row.get("amount") or 0),
			},
		)


def _default_customer(pos_profile):
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


@frappe.whitelist(allow_guest=True)
def create_order(
	items,
	customer=None,
	payments=None,
	order_channel="Web",
	order_type="Takeaway",
	remarks=None,
	auto_pay=0,
	order_source="IMOGI API",
	discount_type=None,
	discount_value=None,
	company=None,
):
	"""Create and submit an Riwayat Order. Optional auto_pay with payments JSON."""
	validate_order_api_access()
	ensure_setup_ready(company)

	payments_list = None
	if cint(auto_pay):
		payments_list = _parse_json(payments, "payments") or []
		if not payments_list:
			frappe.throw(_("payments required when auto_pay=1"))

	order = _build_order(
		items,
		customer,
		order_channel,
		order_type,
		remarks,
		payments_list,
		discount_type,
		discount_value,
		company=company,
	)
	if order_source and order_source != order.order_source:
		frappe.db.set_value(
			"Riwayat Order",
			order.name,
			"order_source",
			order_source,
			update_modified=False,
		)
		order.order_source = order_source

	if cint(auto_pay):
		order.action_process_payment()
		order.reload()

	frappe.db.commit()
	result = _serialize_order(order)
	emit_order_webhook(order.name, "order.completed" if order.status == "Completed" else "order.created")
	return result


@frappe.whitelist(allow_guest=True)
def pay_order(order_name, payments=None, company=None):
	"""Process payment for an order awaiting payment."""
	validate_order_api_access()
	ensure_setup_ready(company)

	order = frappe.get_doc("Riwayat Order", order_name)
	order.check_permission("write")

	payments = _parse_json(payments, "payments") or []
	if not payments:
		frappe.throw(_("payments is required"))

	_apply_payments(order, payments)
	order.reload()
	order.action_process_payment()
	order.reload()
	frappe.db.commit()
	result = _serialize_order(order)
	emit_order_webhook(order.name, "order.completed")
	return result


def _apply_payments(order, payments):
	order.payments = []
	_append_payments(order, payments)
	order.calculate_totals()
	if order.docstatus == 1:
		order.flags.ignore_validate_update_after_submit = True
	order.save(ignore_permissions=True)


@frappe.whitelist(allow_guest=True)
def get_order_status(order_name):
	validate_order_api_access()
	order = frappe.get_doc("Riwayat Order", order_name)
	order.check_permission("read")
	return _serialize_order(order)


@frappe.whitelist(allow_guest=True)
def void_order(order_name, reason=None, approval_code=None):
	validate_order_api_access()
	order = frappe.get_doc("Riwayat Order", order_name)
	order.check_permission("write")
	order.action_void_order(reason=reason, approval_code=approval_code)
	order.reload()
	frappe.db.commit()
	result = _serialize_order(order)
	emit_order_webhook(order.name, "order.cancelled")
	return result


@frappe.whitelist(allow_guest=True)
def refund_order(order_name, reason=None, approval_code=None):
	validate_order_api_access()
	order = frappe.get_doc("Riwayat Order", order_name)
	order.check_permission("write")
	order.action_refund_order(reason=reason, approval_code=approval_code)
	order.reload()
	frappe.db.commit()
	result = _serialize_order(order)
	emit_order_webhook(order.name, "order.refunded")
	return result


@frappe.whitelist(allow_guest=True)
def partial_refund_order(order_name, refund_items=None, reason=None, company=None):
	"""Partial refund for selected line items."""
	validate_order_api_access()
	ensure_setup_ready(company)

	order = frappe.get_doc("Riwayat Order", order_name)
	order.check_permission("write")
	order.action_partial_refund(refund_items=refund_items, reason=reason)
	order.reload()
	frappe.db.commit()
	result = _serialize_order(order)
	event = "order.refunded" if order.status == "Refunded" else "order.partially_refunded"
	emit_order_webhook(order.name, event)
	return result


@frappe.whitelist()
def get_api_info():
	"""Desk-only helper for IMOGI POS Settings."""
	from imogi_pos.api.settings_api import _can_manage_order_api, get_api_documentation

	if not _can_manage_order_api() and not frappe.has_permission("IMOGI POS Settings", "read"):
		frappe.throw(_("Not permitted"))

	return get_api_documentation()
