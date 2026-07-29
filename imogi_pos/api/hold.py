# Copyright (c) 2026, Imogi and contributors

import json

import frappe
from frappe import _
from frappe.utils import flt, now_datetime

from imogi_pos.api.cashier import _require_cashier_access


def _enrich_cart_item_names(cart):
	from imogi_pos.api.order import _resolve_item_display_name

	enriched = []
	for row in cart or []:
		if not isinstance(row, dict):
			continue
		next_row = dict(row)
		next_row["item_name"] = _resolve_item_display_name(
			next_row.get("item_code"), next_row.get("item_name")
		)
		enriched.append(next_row)
	return enriched

MAX_HELD_ORDERS = 5
HOLD_CACHE_TTL = 86400 * 7


def _holds_cache_key(pos_profile=None):
	profile = (pos_profile or "").strip()
	if profile:
		return f"imogi_pos_holds:{frappe.session.user}:{profile}"
	return f"imogi_pos_holds:{frappe.session.user}"


def _branch_holds_cache_key(pos_profile):
	profile = (pos_profile or "").strip()
	if not profile:
		frappe.throw(_("POS Profile wajib untuk antrian hold cabang"))
	return f"imogi_pos_branch_holds:{profile}"


def _get_holds(pos_profile=None):
	raw = frappe.cache.get_value(_holds_cache_key(pos_profile))
	if not raw:
		return []
	try:
		holds = json.loads(raw) if isinstance(raw, str) else raw
	except Exception:
		return []
	return holds if isinstance(holds, list) else []


def _get_branch_holds(pos_profile):
	if not (pos_profile or "").strip():
		return []
	raw = frappe.cache.get_value(_branch_holds_cache_key(pos_profile))
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


def _set_branch_holds(holds, pos_profile):
	frappe.cache.set_value(
		_branch_holds_cache_key(pos_profile), json.dumps(holds), expires_in_sec=HOLD_CACHE_TTL
	)


def _merge_hold_lists(user_holds, branch_holds):
	seen_orders = set()
	merged = []
	for hold in (branch_holds or []) + (user_holds or []):
		order_name = (hold.get("order_name") or "").strip()
		if order_name:
			if order_name in seen_orders:
				continue
			seen_orders.add(order_name)
		merged.append(hold)
	merged.sort(key=lambda row: row.get("saved_at") or "", reverse=True)
	return merged


def _hold_total_amount(hold):
	order_name = (hold.get("order_name") or "").strip()
	if order_name and frappe.db.exists("Riwayat Order", order_name):
		return flt(frappe.db.get_value("Riwayat Order", order_name, "grand_total"))
	cart = hold.get("cart") or []
	return sum(flt(row.get("rate")) * flt(row.get("qty")) for row in cart)


def _summarize_hold(hold):
	cart = hold.get("cart") or []
	qty = sum(flt(row.get("qty")) for row in cart)
	return {
		"id": hold.get("id"),
		"label": hold.get("label") or _("Order ditahan"),
		"order_name": hold.get("order_name") or "",
		"source": hold.get("source") or "manual",
		"item_count": len(cart),
		"total_qty": qty,
		"total_amount": _hold_total_amount(hold),
		"saved_at": hold.get("saved_at"),
	}


def _find_hold(hold_id, pos_profile=None):
	for hold in _get_branch_holds(pos_profile):
		if hold.get("id") == hold_id:
			return hold, "branch"
	for hold in _get_holds(pos_profile):
		if hold.get("id") == hold_id:
			return hold, "user"
	return None, None


def _remove_hold(hold_id, pos_profile=None):
	branch_holds = _get_branch_holds(pos_profile)
	next_branch = [h for h in branch_holds if h.get("id") != hold_id]
	if len(next_branch) != len(branch_holds):
		_set_branch_holds(next_branch, pos_profile)
		return True

	user_holds = _get_holds(pos_profile)
	next_user = [h for h in user_holds if h.get("id") != hold_id]
	if len(next_user) != len(user_holds):
		_set_holds(next_user, pos_profile)
		return True
	return False


def list_all_holds(pos_profile=None):
	user_holds = _get_holds(pos_profile)
	branch_holds = _get_branch_holds(pos_profile)
	merged = _merge_hold_lists(user_holds, branch_holds)
	return [_summarize_hold(h) for h in merged]


@frappe.whitelist()
def list_holds(pos_profile=None):
	_require_cashier_access()
	return {"holds": list_all_holds(pos_profile), "max": MAX_HELD_ORDERS}


def save_branch_hold(
	*,
	order_name,
	cart,
	customer_label="",
	order_type="Dine-in",
	label=None,
	pos_profile=None,
	source="qr_cash",
):
	"""Shared cashier queue for a POS Profile (e.g. QR Cash awaiting payment)."""
	pos_profile = (pos_profile or "").strip()
	if not pos_profile:
		frappe.throw(_("POS Profile wajib untuk antrian hold cabang"))

	parsed = _enrich_cart_item_names(
		json.loads(cart) if isinstance(cart, str) else (cart or [])
	)
	order_name = (order_name or "").strip()
	if not order_name:
		frappe.throw(_("Order wajib untuk hold cabang"))

	holds = _get_branch_holds(pos_profile)
	for hold in holds:
		if hold.get("order_name") == order_name:
			return {"hold": _summarize_hold(hold), "holds": list_all_holds(pos_profile)}

	if len(holds) >= MAX_HELD_ORDERS:
		frappe.throw(_("Maksimal {0} order ditahan di kasir").format(MAX_HELD_ORDERS))

	hold = {
		"id": frappe.generate_hash(length=10),
		"label": (label or "").strip() or order_name,
		"order_name": order_name,
		"source": source,
		"cart": parsed,
		"customer_label": customer_label or "",
		"order_type": order_type or "Dine-in",
		"saved_at": str(now_datetime()),
	}
	holds.append(hold)
	_set_branch_holds(holds, pos_profile)
	return {"hold": _summarize_hold(hold), "holds": list_all_holds(pos_profile)}


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
	parsed = _enrich_cart_item_names(json.loads(cart) if isinstance(cart, str) else cart)
	if not parsed:
		frappe.throw(_("Keranjang kosong"))

	holds = _get_holds(pos_profile)
	if len(holds) >= MAX_HELD_ORDERS:
		frappe.throw(_("Maksimal {0} order ditahan").format(MAX_HELD_ORDERS))

	hold = {
		"id": frappe.generate_hash(length=10),
		"label": (label or "").strip() or _("Order {0}").format(len(holds) + 1),
		"source": "manual",
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
	return {"hold": _summarize_hold(hold), "holds": list_all_holds(pos_profile)}


@frappe.whitelist()
def get_hold(hold_id, pos_profile=None):
	_require_cashier_access()
	hold, _scope = _find_hold(hold_id, pos_profile)
	if not hold:
		frappe.throw(_("Order ditahan tidak ditemukan"))
	hold = dict(hold)
	hold["cart"] = _enrich_cart_item_names(hold.get("cart"))
	return hold


@frappe.whitelist()
def delete_hold(hold_id, pos_profile=None):
	_require_cashier_access()
	if not _remove_hold(hold_id, pos_profile):
		frappe.throw(_("Order ditahan tidak ditemukan"))
	return {"holds": list_all_holds(pos_profile)}


@frappe.whitelist()
def take_hold(hold_id, pos_profile=None):
	"""Return hold payload and remove from queue."""
	_require_cashier_access()
	hold, _scope = _find_hold(hold_id, pos_profile)
	if not hold:
		frappe.throw(_("Order ditahan tidak ditemukan"))
	_remove_hold(hold_id, pos_profile)
	hold = dict(hold)
	hold["cart"] = _enrich_cart_item_names(hold.get("cart"))
	return hold
