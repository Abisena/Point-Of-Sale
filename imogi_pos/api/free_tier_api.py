# Copyright (c) 2026, Imogi and contributors
"""Whitelisted APIs for Free-tier role pages (Owner / Manager / Cashier)."""

from __future__ import annotations

import json

import frappe
from frappe import _
from frappe.utils import add_days, flt, getdate, today

from imogi_pos.imogi_pos.utils.bom_stock import POS_CATEGORIES
from imogi_pos.imogi_pos.utils.branch import get_branch, resolve_active_branch
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


def _effective_order_cashier(order):
	return (order.cashier or order.owner or "").strip()


def _order_history_access(branch=None, pos_profile=None):
	"""Scope Riwayat Order list/detail by role: kasir own rows, owner all branches."""
	from imogi_pos.boot import (
		AREA_MANAGER_ROLE,
		MANAGER_ROLE,
		MANAGER_ROLES,
		OWNER_ROLE,
		requires_cashier_shift,
	)
	from imogi_pos.imogi_pos.utils.area_manager import get_assigned_branch_codes, user_is_area_manager

	user = frappe.session.user
	roles = set(frappe.get_roles(user))
	scope = _branch_scope(branch, pos_profile)

	access = {
		"scope": scope,
		"filter_cashier": None,
		"filter_pos_profile": None,
		"filter_pos_profiles": None,
		"view_all_branches": False,
		"view_mode": "branch",
	}

	if requires_cashier_shift(user):
		access["filter_cashier"] = user
		access["filter_pos_profile"] = scope.get("pos_profile")
		access["view_mode"] = "own"
	elif roles & MANAGER_ROLES or OWNER_ROLE in roles:
		access["view_all_branches"] = True
		access["view_mode"] = "all"
	elif user_is_area_manager(user):
		if scope.get("pos_profile"):
			access["filter_pos_profile"] = scope["pos_profile"]
		else:
			profiles = []
			for code in get_assigned_branch_codes(user):
				branch_row = get_branch(branch_code=code)
				if branch_row and branch_row.get("pos_profile"):
					profiles.append(branch_row["pos_profile"])
			if profiles:
				access["filter_pos_profiles"] = profiles
		access["view_mode"] = "area"
	elif MANAGER_ROLE in roles or "Sales Manager" in roles:
		access["filter_pos_profile"] = scope.get("pos_profile")
		access["view_mode"] = "branch"
	else:
		access["filter_pos_profile"] = scope.get("pos_profile")

	return access


def _assert_order_history_access(order, access):
	if access.get("filter_cashier"):
		if _effective_order_cashier(order) != access["filter_cashier"]:
			frappe.throw(_("Order {0} not found").format(order.name), frappe.DoesNotExistError)

	if access.get("view_all_branches"):
		return

	pos_profile = order.pos_profile
	if not pos_profile:
		return

	if access.get("filter_pos_profile") and pos_profile != access["filter_pos_profile"]:
		frappe.throw(_("Order {0} not found").format(order.name), frappe.DoesNotExistError)

	allowed_profiles = access.get("filter_pos_profiles") or []
	if allowed_profiles and pos_profile not in allowed_profiles:
		frappe.throw(_("Order {0} not found").format(order.name), frappe.DoesNotExistError)


def _order_history_where(filters, access):
	conditions = ["ro.docstatus < 2"]
	values = {}

	if filters.get("from_date"):
		conditions.append("ro.creation >= %(from_date)s")
		values["from_date"] = filters["from_date"]
	if filters.get("to_date"):
		conditions.append("ro.creation <= %(to_date)s")
		values["to_date"] = filters["to_date"]
	if filters.get("status"):
		conditions.append("ro.status = %(status)s")
		values["status"] = filters["status"]
	if filters.get("search"):
		conditions.append(
			"""(
				ro.name like %(search)s
				or ro.customer_name like %(search)s
				or COALESCE(NULLIF(ro.cashier_name, ''), u.full_name, ro.owner) like %(search)s
				or COALESCE(NULLIF(ro.cashier, ''), ro.owner) like %(search)s
			)"""
		)
		values["search"] = filters["search"]

	if access.get("filter_cashier"):
		conditions.append("COALESCE(NULLIF(ro.cashier, ''), ro.owner) = %(cashier)s")
		values["cashier"] = access["filter_cashier"]

	if not access.get("view_all_branches"):
		if access.get("filter_pos_profiles"):
			conditions.append("ro.pos_profile in %(pos_profiles)s")
			values["pos_profiles"] = tuple(access["filter_pos_profiles"])
		elif access.get("filter_pos_profile"):
			conditions.append("ro.pos_profile = %(pos_profile)s")
			values["pos_profile"] = access["filter_pos_profile"]

	return " and ".join(conditions), values


def _attach_payment_methods(rows):
	if not rows:
		return rows
	parents = [row.name for row in rows if row.get("name")]
	if not parents:
		return rows
	payments = frappe.get_all(
		"IMOGI POS Order Payment",
		filters={"parent": ["in", parents]},
		fields=["parent", "mode_of_payment"],
		order_by="parent asc, idx asc",
	)
	by_parent = {}
	for pay in payments:
		mode = (pay.mode_of_payment or "").strip()
		if not mode:
			continue
		bucket = by_parent.setdefault(pay.parent, [])
		if mode not in bucket:
			bucket.append(mode)
	for row in rows:
		if row.get("payment_method"):
			continue
		modes = by_parent.get(row.name) or []
		row["payment_method"] = ", ".join(modes) if modes else ""
	return rows


def _count_order_history_rows(filters, access):
	where, values = _order_history_where(filters, access)
	return frappe.db.sql(
		f"""
		select count(*)
		from `tabRiwayat Order` ro
		left join `tabUser` u on u.name = COALESCE(NULLIF(ro.cashier, ''), ro.owner)
		where {where}
		""",
		values,
	)[0][0]


def _fetch_order_history_rows(filters, access, limit=50, offset=0):
	where, values = _order_history_where(filters, access)
	limit = max(1, int(limit or 50))
	offset = max(0, int(offset or 0))
	return frappe.db.sql(
		f"""
		select
			ro.name,
			ro.creation,
			ro.order_channel,
			ro.order_type,
			ro.status,
			ro.customer_name,
			ro.grand_total,
			ro.pos_invoice,
			ro.kitchen_order,
			ro.delivery_task,
			ro.pos_profile,
			ro.payment_method,
			ro.promo_discount_amount,
			ro.applied_promo,
			COALESCE(NULLIF(ro.cashier, ''), ro.owner) as cashier,
			COALESCE(NULLIF(ro.cashier_name, ''), u.full_name, ro.owner) as cashier_name
		from `tabRiwayat Order` ro
		left join `tabUser` u on u.name = COALESCE(NULLIF(ro.cashier, ''), ro.owner)
		where {where}
		order by ro.creation desc
		limit {limit} offset {offset}
		""",
		values,
		as_dict=True,
	)


def _fetch_order_history_summary(access):
	where, values = _order_history_where(
		{
			"from_date": getdate(today()),
			"to_date": add_days(getdate(today()), 1),
		},
		access,
	)
	row = frappe.db.sql(
		f"""
		select
			count(*) as total_count,
			sum(case when ro.status = 'Completed' then 1 else 0 end) as completed_count,
			sum(case when ro.status = 'Completed' then ro.grand_total else 0 end) as revenue
		from `tabRiwayat Order` ro
		left join `tabUser` u on u.name = COALESCE(NULLIF(ro.cashier, ''), ro.owner)
		where {where}
		""",
		values,
		as_dict=True,
	)
	row = row[0] if row else {}
	total = int(row.get("total_count") or 0)
	completed = int(row.get("completed_count") or 0)
	revenue = flt(row.get("revenue"))
	return {
		"total_today": total,
		"completed_today": completed,
		"revenue_today": revenue,
		"average_today": (revenue / completed) if completed else 0,
	}


@frappe.whitelist()
def list_order_history(
	branch=None,
	pos_profile=None,
	from_date=None,
	to_date=None,
	status=None,
	search=None,
	page=1,
	page_size=10,
	limit=50,
):
	"""Cashier order history for imogi-pos-order-history page."""
	_require_login()
	require_feature_doctype_access("order_history")

	access = _order_history_access(branch, pos_profile)
	scope = access["scope"]
	page = max(1, int(page or 1))
	page_size = min(max(1, int(page_size or 10)), 50)
	# Backward compat: explicit limit without page_size uses old behaviour.
	if frappe.form_dict.get("page_size") is None and frappe.form_dict.get("page") is None:
		page_size = min(int(limit or 50), 200)
		page = 1

	filters = {}
	if from_date:
		filters["from_date"] = getdate(from_date)
	if to_date:
		filters["to_date"] = add_days(getdate(to_date), 1)
	if status:
		filters["status"] = status
	search_term = (search or "").strip()
	if search_term:
		filters["search"] = f"%{search_term}%"

	total = _count_order_history_rows(filters, access)
	offset = (page - 1) * page_size
	rows = _fetch_order_history_rows(filters, access, limit=page_size, offset=offset)
	rows = _attach_payment_methods(rows)
	total_pages = max(1, (total + page_size - 1) // page_size)

	return {
		"orders": rows,
		"total": total,
		"page": page,
		"page_size": page_size,
		"total_pages": total_pages,
		"scope": scope,
		"view_mode": access["view_mode"],
		"summary": _fetch_order_history_summary(access),
	}


def _parse_applied_promo(raw):
	if not raw:
		return []
	if isinstance(raw, list):
		return raw
	try:
		parsed = json.loads(raw)
	except (TypeError, ValueError):
		return []
	return parsed if isinstance(parsed, list) else []


def _promo_display_name(promo: dict) -> str:
	name = (promo.get("promo") or "").strip()
	if name:
		return name
	label = (promo.get("label") or "").strip()
	if not label:
		return _("Promo")
	if ":" in label:
		return label.split(":", 1)[0].strip()
	return label


@frappe.whitelist()
def get_order_history_promo_summary(
	branch=None,
	pos_profile=None,
	from_date=None,
	to_date=None,
	search=None,
):
	"""Aggregate promo usage for Riwayat Order summary tab."""
	_require_login()
	require_feature_doctype_access("order_history")

	access = _order_history_access(branch, pos_profile)
	filters = {}
	if from_date:
		filters["from_date"] = getdate(from_date)
	if to_date:
		filters["to_date"] = add_days(getdate(to_date), 1)
	search_term = (search or "").strip()
	if search_term:
		filters["search"] = f"%{search_term}%"

	where, values = _order_history_where(filters, access)
	rows = frappe.db.sql(
		f"""
		select ro.name, ro.promo_discount_amount, ro.applied_promo
		from `tabRiwayat Order` ro
		left join `tabUser` u on u.name = COALESCE(NULLIF(ro.cashier, ''), ro.owner)
		where {where}
			and coalesce(ro.promo_discount_amount, 0) > 0
		""",
		values,
		as_dict=True,
	)

	buckets: dict[str, dict] = {}
	total_discount = 0.0
	for order in rows:
		order_discount = flt(order.promo_discount_amount)
		total_discount += order_discount
		promos = _parse_applied_promo(order.applied_promo)
		if not promos:
			key = "__promo__"
			entry = buckets.setdefault(
				key,
				{
					"promo": "",
					"label": _("Promo otomatis"),
					"order_count": 0,
					"total_discount": 0.0,
				},
			)
			entry["order_count"] += 1
			entry["total_discount"] += order_discount
			continue

		for promo in promos:
			key = promo.get("promo") or promo.get("label") or "__promo__"
			entry = buckets.setdefault(
				key,
				{
					"promo": promo.get("promo") or "",
					"label": _promo_display_name(promo),
					"order_count": 0,
					"total_discount": 0.0,
				},
			)
			entry["order_count"] += 1
			entry["total_discount"] += flt(promo.get("discount")) or order_discount

	summary_rows = sorted(
		buckets.values(),
		key=lambda row: (-flt(row.get("total_discount")), row.get("label") or ""),
	)

	return {
		"rows": summary_rows,
		"order_count": len(rows),
		"total_discount": flt(total_discount),
		"view_mode": access["view_mode"],
	}


@frappe.whitelist()
def get_order_history_product_sales(
	branch=None,
	pos_profile=None,
	from_date=None,
	to_date=None,
	search=None,
	limit=20,
):
	"""Top-selling products for Riwayat Order summary tab."""
	_require_login()
	require_feature_doctype_access("order_history")

	access = _order_history_access(branch, pos_profile)
	filters = {}
	if from_date:
		filters["from_date"] = getdate(from_date)
	if to_date:
		filters["to_date"] = add_days(getdate(to_date), 1)
	search_term = (search or "").strip()
	if search_term:
		filters["search"] = f"%{search_term}%"

	where, values = _order_history_where(filters, access)
	limit = min(max(1, int(limit or 20)), 50)

	rows = frappe.db.sql(
		f"""
		select
			oi.item_code,
			max(oi.item_name) as item_name,
			coalesce(sum(oi.qty), 0) as qty,
			coalesce(sum(oi.amount), 0) as sales,
			count(distinct oi.parent) as order_count
		from `tabIMOGI POS Order Item` oi
		inner join `tabRiwayat Order` ro on ro.name = oi.parent
		left join `tabUser` u on u.name = COALESCE(NULLIF(ro.cashier, ''), ro.owner)
		where {where}
			and ro.status = 'Completed'
			and coalesce(oi.rate, 0) > 0
		group by oi.item_code
		order by qty desc, sales desc
		limit {limit}
		""",
		values,
		as_dict=True,
	)

	total_qty = sum(flt(row.qty) for row in rows)
	total_sales = sum(flt(row.sales) for row in rows)

	return {
		"rows": rows,
		"total_qty": flt(total_qty),
		"total_sales": flt(total_sales),
		"view_mode": access["view_mode"],
	}


@frappe.whitelist()
def get_order_history_detail(order_name, branch=None, pos_profile=None):
	"""Full order payload for Riwayat Order detail modal."""
	_require_login()
	require_feature_doctype_access("order_history")

	if not order_name:
		frappe.throw(_("order_name is required"))

	access = _order_history_access(branch, pos_profile)
	scope = access["scope"]
	order = frappe.get_doc("Riwayat Order", order_name)
	order.check_permission("read")
	_assert_order_history_access(order, access)

	from imogi_pos.api.order import _serialize_order

	detail = _serialize_order(order)
	cashier_user = _effective_order_cashier(order)
	cashier_name = order.cashier_name or frappe.db.get_value("User", cashier_user, "full_name") if cashier_user else ""
	detail.update(
		{
			"customer_name": order.customer_name,
			"pos_profile": order.pos_profile,
			"cashier": cashier_user,
			"cashier_name": cashier_name or cashier_user,
			"remarks": order.remarks,
			"voucher_code": order.voucher_code,
			"voucher_discount_amount": flt(order.voucher_discount_amount),
			"loyalty_points_redeemed": flt(order.loyalty_points_redeemed),
			"loyalty_discount_amount": flt(order.loyalty_discount_amount),
			"loyalty_points_earned": flt(order.loyalty_points_earned),
			"promo_discount_amount": flt(order.promo_discount_amount),
			"applied_promo": order.applied_promo or "",
			"taxable_amount": flt(order.taxable_amount),
			"tax_amount": flt(order.tax_amount),
			"payment_method": order.payment_method,
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
def get_order_receipt_url(order_name, branch=None, pos_profile=None):
	"""Receipt print URL for order history reprint."""
	_require_login()
	require_feature_doctype_access("order_history")

	if not order_name:
		frappe.throw(_("order_name is required"))

	access = _order_history_access(branch, pos_profile)
	order = frappe.get_doc("Riwayat Order", order_name)
	order.check_permission("read")
	_assert_order_history_access(order, access)

	from imogi_pos.imogi_pos.utils.flow import get_settings

	settings = get_settings()
	print_format = settings.receipt_print_format or "IMOGI POS Receipt"
	return {
		"url": f"/printview?doctype=Riwayat Order&name={order_name}&format={print_format}&trigger_print=1",
		"print_format": print_format,
	}


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
