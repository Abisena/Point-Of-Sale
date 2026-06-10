# Copyright (c) 2026, Imogi and contributors

import json

import frappe
from frappe import _
from frappe.utils import cint, flt, now_datetime

from imogi_pos.api.cashier import _require_cashier_access

MAX_HELD_ORDERS = 5
HOLD_CACHE_TTL = 86400 * 7


def _holds_cache_key(pos_profile=None):
	profile = (pos_profile or "").strip()
	if profile:
		return f"imogi_pos_holds:{frappe.session.user}:{profile}"
	return f"imogi_pos_holds:{frappe.session.user}"


def _get_holds(pos_profile=None):
	raw = frappe.cache.get_value(_holds_cache_key(pos_profile))
	if not raw:
		return []
	try:
		holds = json.loads(raw) if isinstance(raw, str) else raw
	except Exception:
		return []
	return holds if isinstance(holds, list) else []


def _set_holds(holds, pos_profile=None):
	frappe.cache.set_value(
		_holds_cache_key(pos_profile), json.dumps(holds), expires_in_sec=HOLD_CACHE_TTL
	)


def _summarize_hold(hold):
	cart = hold.get("cart") or []
	qty = sum(flt(row.get("qty")) for row in cart)
	total = sum(flt(row.get("rate")) * flt(row.get("qty")) for row in cart)
	return {
		"id": hold.get("id"),
		"label": hold.get("label") or _("Order ditahan"),
		"item_count": len(cart),
		"total_qty": qty,
		"total_amount": total,
		"saved_at": hold.get("saved_at"),
	}


@frappe.whitelist()
def list_holds(pos_profile=None):
	_require_cashier_access()
	holds = [_summarize_hold(h) for h in _get_holds(pos_profile)]
	return {"holds": holds, "max": MAX_HELD_ORDERS}


@frappe.whitelist()
def save_hold(
	cart,
	selected_customer=None,
	customer_label=None,
	discount_type=None,
	discount_value=None,
	order_type=None,
	label=None,
	pos_profile=None,
):
	_require_cashier_access()
	from imogi_pos.imogi_pos.utils.feature_gating import require_feature_operational, validate_order_type

	require_feature_operational("hold_order")
	if order_type:
		validate_order_type(order_type)
	parsed = json.loads(cart) if isinstance(cart, str) else cart
	if not parsed:
		frappe.throw(_("Keranjang kosong"))

	holds = _get_holds(pos_profile)
	if len(holds) >= MAX_HELD_ORDERS:
		frappe.throw(_("Maksimal {0} order ditahan").format(MAX_HELD_ORDERS))

	hold = {
		"id": frappe.generate_hash(length=10),
		"label": (label or "").strip() or _("Order {0}").format(len(holds) + 1),
		"cart": parsed,
		"selected_customer": selected_customer,
		"customer_label": customer_label or "",
		"discount_type": discount_type or "",
		"discount_value": flt(discount_value),
		"order_type": order_type or "Takeaway",
		"saved_at": str(now_datetime()),
	}
	holds.append(hold)
	_set_holds(holds, pos_profile)
	return {"hold": _summarize_hold(hold), "holds": [_summarize_hold(h) for h in holds]}


@frappe.whitelist()
def get_hold(hold_id, pos_profile=None):
	_require_cashier_access()
	for hold in _get_holds(pos_profile):
		if hold.get("id") == hold_id:
			return hold
	frappe.throw(_("Order ditahan tidak ditemukan"))


@frappe.whitelist()
def delete_hold(hold_id, pos_profile=None):
	_require_cashier_access()
	holds = [h for h in _get_holds(pos_profile) if h.get("id") != hold_id]
	if len(holds) == len(_get_holds(pos_profile)):
		frappe.throw(_("Order ditahan tidak ditemukan"))
	_set_holds(holds, pos_profile)
	return {"holds": [_summarize_hold(h) for h in holds]}


@frappe.whitelist()
def take_hold(hold_id, pos_profile=None):
	"""Return hold payload and remove from queue."""
	_require_cashier_access()
	holds = _get_holds(pos_profile)
	hold = next((h for h in holds if h.get("id") == hold_id), None)
	if not hold:
		frappe.throw(_("Order ditahan tidak ditemukan"))
	_set_holds([h for h in holds if h.get("id") != hold_id])
	return hold
