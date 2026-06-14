# Copyright (c) 2026, Imogi and contributors
"""Whitelisted APIs for Free-tier role pages (Owner / Manager / Cashier)."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import add_days, flt, getdate, today

from imogi_pos.imogi_pos.utils.bom_stock import POS_CATEGORIES
from imogi_pos.imogi_pos.utils.branch import resolve_active_branch
from imogi_pos.imogi_pos.utils.branch_pricing import resolve_selling_price_rate
from imogi_pos.imogi_pos.utils.feature_gating import require_feature_doctype_access
from imogi_pos.imogi_pos.utils.sales_report_limits import (
	resolve_sales_report_period,
	sales_report_limits_payload,
	validate_sales_report_range,
)


def _require_login():
	if frappe.session.user == "Guest":
		frappe.throw(_("Login required"), frappe.AuthenticationError)


def _branch_scope(branch=None, pos_profile=None):
	ctx = resolve_active_branch(branch_code=branch, pos_profile=pos_profile)
	return {
		"company": ctx.get("company"),
		"pos_profile": ctx.get("pos_profile"),
		"branch_code": ctx.get("branch_code"),
		"warehouse": ctx.get("warehouse"),
		"selling_price_list": ctx.get("selling_price_list"),
		"currency": ctx.get("currency")
		or frappe.get_cached_value("Company", ctx.get("company"), "default_currency"),
	}


@frappe.whitelist()
def list_order_history(branch=None, pos_profile=None, from_date=None, to_date=None, status=None, limit=50):
	"""Cashier order history for imogi-pos-order-history page."""
	_require_login()
	require_feature_doctype_access("order_history")

	scope = _branch_scope(branch, pos_profile)
	limit = min(int(limit or 50), 200)
	filters = {}
	if from_date:
		filters["from_date"] = getdate(from_date)
	if to_date:
		filters["to_date"] = add_days(getdate(to_date), 1)
	if status:
		filters["status"] = status
	if scope.get("pos_profile"):
		filters["pos_profile"] = scope["pos_profile"]

	from imogi_pos.imogi_pos.report.imogi_pos_order_summary.imogi_pos_order_summary import get_data

	rows = get_data(filters)[:limit]
	return {
		"orders": rows,
		"scope": scope,
	}


@frappe.whitelist()
def get_order_history_detail(order_name, branch=None, pos_profile=None):
	"""Full order payload for Riwayat Order detail modal."""
	_require_login()
	require_feature_doctype_access("order_history")

	if not order_name:
		frappe.throw(_("order_name is required"))

	scope = _branch_scope(branch, pos_profile)
	order = frappe.get_doc("Riwayat Order", order_name)
	order.check_permission("read")

	if scope.get("pos_profile") and order.pos_profile and order.pos_profile != scope["pos_profile"]:
		frappe.throw(_("Order {0} not found").format(order_name), frappe.DoesNotExistError)

	from imogi_pos.api.order import _serialize_order

	detail = _serialize_order(order)
	detail.update(
		{
			"customer_name": order.customer_name,
			"pos_profile": order.pos_profile,
			"remarks": order.remarks,
			"voucher_code": order.voucher_code,
			"voucher_discount_amount": flt(order.voucher_discount_amount),
			"loyalty_points_redeemed": flt(order.loyalty_points_redeemed),
			"loyalty_discount_amount": flt(order.loyalty_discount_amount),
			"loyalty_points_earned": flt(order.loyalty_points_earned),
			"kitchen_order": order.kitchen_order,
			"delivery_task": order.delivery_task,
		}
	)
	detail["items"] = [
		{
			"item_code": row.item_code,
			"item_name": row.item_name,
			"qty": flt(row.qty),
			"rate": flt(row.rate),
			"amount": flt(row.amount),
			"uom": row.uom,
		}
		for row in order.items
	]
	return detail


@frappe.whitelist()
def list_menu_items(search=None, category=None, branch=None, pos_profile=None, limit=100):
	"""Manager menu list for imogi-pos-menu page."""
	_require_login()
	require_feature_doctype_access("menu")

	scope = _branch_scope(branch, pos_profile)
	limit = min(int(limit or 100), 300)
	filters = {"disabled": 0, "is_sales_item": 1}
	if category:
		filters["imogi_pos_category"] = category

	or_filters = []
	term = (search or "").strip()
	if term:
		or_filters = [
			["name", "like", f"%{term}%"],
			["item_name", "like", f"%{term}%"],
		]

	items = frappe.get_all(
		"Item",
		filters=filters,
		or_filters=or_filters or None,
		fields=[
			"name",
			"item_name",
			"item_group",
			"imogi_pos_category",
			"stock_uom",
			"standard_rate",
			"image",
			"has_variants",
			"variant_of",
		],
		order_by="item_name asc",
		limit=limit,
	)

	ctx = {
		"price_list": scope.get("selling_price_list"),
		"company": scope.get("company"),
	}
	for row in items:
		row["rate"] = resolve_selling_price_rate(
			row.name,
			ctx.get("price_list"),
			company=ctx.get("company"),
		)
		row["currency"] = scope.get("currency")

	return {"items": items, "scope": scope, "categories": list(POS_CATEGORIES)}


@frappe.whitelist()
def list_menu_categories(branch=None, pos_profile=None):
	"""Manager category overview for imogi-pos-menu-category page."""
	_require_login()
	require_feature_doctype_access("menu_category")

	scope = _branch_scope(branch, pos_profile)
	categories = []
	for name in POS_CATEGORIES:
		count = frappe.db.count("Item", {"disabled": 0, "is_sales_item": 1, "imogi_pos_category": name})
		categories.append({"name": name, "item_count": count, "source": "pos_category"})

	groups = frappe.get_all(
		"Item Group",
		filters={"is_group": 0},
		fields=["name", "parent_item_group"],
		order_by="name asc",
		limit=100,
	)
	for group in groups:
		count = frappe.db.count("Item", {"disabled": 0, "is_sales_item": 1, "item_group": group.name})
		if count:
			categories.append(
				{
					"name": group.name,
					"parent": group.parent_item_group,
					"item_count": count,
					"source": "item_group",
				}
			)

	return {"categories": categories, "scope": scope}


@frappe.whitelist()
def get_sales_report_limits():
	"""Date filter rules for Laporan Penjualan page."""
	_require_login()
	require_feature_doctype_access("sales_report")
	return sales_report_limits_payload()


@frappe.whitelist()
def get_sales_report(branch=None, pos_profile=None, from_date=None, to_date=None, period=None):
	"""Owner sales report summary for imogi-pos-sales-report page."""
	_require_login()
	require_feature_doctype_access("sales_report")

	scope = _branch_scope(branch, pos_profile)
	from_day, to_day, normalized_period = resolve_sales_report_period(period, from_date, to_date)
	validate_sales_report_range(normalized_period, from_day, to_day)

	filters = {
		"from_date": from_day,
		"to_date": add_days(to_day, 1),
	}
	if scope.get("pos_profile"):
		filters["pos_profile"] = scope["pos_profile"]

	from imogi_pos.imogi_pos.report.imogi_pos_order_summary.imogi_pos_order_summary import get_data

	rows = get_data(filters)
	total_sales = sum(flt(row.get("grand_total")) for row in rows)
	completed = sum(1 for row in rows if row.get("status") == "Completed")
	limits = sales_report_limits_payload()
	by_channel_rows: list[dict] = []
	if limits.get("show_channel_breakdown"):
		by_channel: dict[str, float] = {}
		for row in rows:
			channel = row.get("order_channel") or "Walk-in"
			by_channel[channel] = by_channel.get(channel, 0) + flt(row.get("grand_total"))
		by_channel_rows = [
			{"channel": k, "amount": v} for k, v in sorted(by_channel.items(), key=lambda x: -x[1])
		]

	return {
		"scope": scope,
		"period": normalized_period,
		"from_date": str(from_day),
		"to_date": str(to_day),
		"limits": limits,
		"summary": {
			"order_count": len(rows),
			"completed_count": completed,
			"total_sales": total_sales,
			"currency": scope.get("currency"),
		},
		"by_channel": by_channel_rows,
		"orders": rows[:100],
	}
