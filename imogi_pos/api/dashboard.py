# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import add_days, cint, flt, getdate, today

from imogi_pos.boot import requires_cashier_shift
from imogi_pos.imogi_pos.utils.branch import (
	get_accessible_branches,
	get_branch_sales_breakdown_with_meta,
	resolve_active_branch,
)
from imogi_pos.imogi_pos.utils.business_profile import BUSINESS_UMKM
from imogi_pos.imogi_pos.utils.flow import get_settings, resolve_company
from imogi_pos.imogi_pos.utils.low_stock import get_low_stock_items
from imogi_pos.imogi_pos.utils.sales_target import get_sales_target_progress


def _require_dashboard_access():
	"""Owner dashboard API — tier + role gate (blocks Manager/Cashier cross-access)."""
	if frappe.session.user == "Guest":
		frappe.throw(_("Not permitted"), frappe.AuthenticationError)
	from imogi_pos.imogi_pos.utils.feature_gating import require_feature_operational

	require_feature_operational("dashboard_sales")


def _day_bounds(date=None):
	day = getdate(date) if date else getdate(today())
	return day, add_days(day, 1)


def _scoped_clauses(company=None, pos_profile=None, alias=None):
	values = {}
	clauses = []
	if company:
		field = f"{alias}.company" if alias else "company"
		clauses.append(f" and {field} = %(company)s")
		values["company"] = company
	if pos_profile:
		field = f"{alias}.pos_profile" if alias else "pos_profile"
		clauses.append(f" and {field} = %(pos_profile)s")
		values["pos_profile"] = pos_profile
	return "".join(clauses), values


def _resolve_dashboard_scope(branch=None, pos_profile=None, company=None):
	settings = get_settings()
	company = resolve_company(company, settings)
	branches = get_accessible_branches(company=company)
	multi_branch = cint(settings.multi_branch) or len(branches) > 1

	if not branch and not pos_profile:
		return {
			"multi_branch_enabled": multi_branch,
			"branches": branches,
			"active_branch": None,
			"pos_profile": None,
			"warehouse": None,
			"company": company,
			"branch_ctx": None,
		}

	ctx = resolve_active_branch(branch_code=branch, pos_profile=pos_profile)
	return {
		"multi_branch_enabled": multi_branch,
		"branches": branches,
		"active_branch": {
			"branch_code": ctx.get("branch_code"),
			"branch_name": ctx.get("branch_name"),
			"warehouse": ctx.get("warehouse"),
			"pos_profile": ctx.get("pos_profile"),
			"city": ctx.get("city"),
		},
		"pos_profile": ctx.get("pos_profile"),
		"warehouse": ctx.get("warehouse"),
		"company": ctx.get("company") or company,
		"branch_ctx": ctx,
	}


def _get_pos_shift_status(company=None):
	from imogi_pos.imogi_pos.utils.feature_gating import is_setting_enabled

	settings = get_settings()
	if not is_setting_enabled("enable_pos_shift", settings):
		return {"enabled": False, "open": False}

	if not requires_cashier_shift():
		return {"enabled": False, "open": False}

	from erpnext.selling.page.point_of_sale.point_of_sale import check_opening_entry

	user = frappe.session.user
	if user == "Guest":
		return {"enabled": True, "open": False}

	entries = check_opening_entry(user) or []
	if not entries:
		return {"enabled": True, "open": False}

	opening = entries[0]
	if company and opening.get("company") and opening.get("company") != company:
		return {"enabled": True, "open": False}

	return {
		"enabled": True,
		"open": True,
		"name": opening.get("name"),
		"company": opening.get("company"),
		"pos_profile": opening.get("pos_profile"),
		"period_start_date": opening.get("period_start_date"),
		"opening_url": f"/app/pos-opening-entry/{opening.get('name')}",
	}


@frappe.whitelist()
def get_dashboard_metrics(date=None, branch=None, pos_profile=None, company=None):
	_require_dashboard_access()
	settings = get_settings()
	day_start, day_end = _day_bounds(date)
	scope = _resolve_dashboard_scope(branch=branch, pos_profile=pos_profile, company=company)
	pos_profile = scope["pos_profile"]
	warehouse = scope["warehouse"]
	company = scope["company"]
	branch_ctx = scope.get("branch_ctx")

	target_kwargs = {"company": company}
	if branch_ctx:
		target_kwargs["target_amount"] = branch_ctx.get("target_monthly_sales")
		target_kwargs["pos_profile"] = branch_ctx.get("pos_profile")

	payload = {
		"date": str(day_start),
		"company": company,
		"multi_branch_enabled": scope["multi_branch_enabled"],
		"branches": scope["branches"],
		"active_branch": scope["active_branch"],
		"top_products": _get_top_products(day_start, day_end, company=company, pos_profile=pos_profile),
		"awaiting_orders": _get_awaiting_orders(company=company, pos_profile=pos_profile),
		"low_stock_items": get_low_stock_items(limit=10, warehouse=warehouse),
		"pos_shift": _get_pos_shift_status(company=company),
		"sales_target": get_sales_target_progress(date, **target_kwargs),
	}
	if scope["multi_branch_enabled"] and not pos_profile:
		breakdown_meta = get_branch_sales_breakdown_with_meta(day_start, day_end, company=company)
		payload["branch_breakdown"] = breakdown_meta["rows"]
		payload["branch_breakdown_mixed_currency"] = breakdown_meta["mixed_currency"]
		if breakdown_meta["mixed_currency"]:
			payload["branch_breakdown_currency_note"] = _(
				"Total cabang dijumlahkan tanpa konversi mata uang. "
				"Pastikan semua company memakai mata uang yang sama (mis. IDR)."
			)
		else:
			payload["branch_breakdown_currency"] = breakdown_meta.get("currency")
	else:
		payload["branch_breakdown"] = []

	if settings.business_type == BUSINESS_UMKM:
		payload.update(_get_umkm_metrics(day_start, day_end, company=company, pos_profile=pos_profile))
	else:
		payload.update(_get_restaurant_metrics(day_start, day_end, company=company, pos_profile=pos_profile))

	payload["insights"] = _get_saas_insights(
		day_start,
		day_end,
		company=company,
		pos_profile=pos_profile,
		sales_today=payload.get("sales_today"),
		completed_today=payload.get("completed_today"),
		orders_today=payload.get("orders_today"),
		avg_ticket=payload.get("avg_ticket"),
	)

	try:
		from imogi_pos.api.reports_api import get_extended_reports

		payload["extended_reports"] = get_extended_reports(
			date=str(day_start),
			company=company,
			pos_profile=pos_profile,
			branch=branch,
		)
	except Exception:
		payload["extended_reports"] = {}

	return payload


def _pct_change(current, previous):
	current = flt(current)
	previous = flt(previous)
	if previous == 0:
		if current == 0:
			return 0
		return 100
	return round(((current - previous) / abs(previous)) * 100, 1)


def _day_sales_snapshot(day_start, day_end, company=None, pos_profile=None):
	scope_clause, scope_values = _scoped_clauses(company, pos_profile)
	values = {"day_start": day_start, "day_end": day_end, **scope_values}
	row = frappe.db.sql(
		f"""
		select
			count(*) as orders,
			sum(case when status = 'Completed' then 1 else 0 end) as completed,
			sum(case when status = 'Cancelled' then 1 else 0 end) as cancelled,
			sum(case when status = 'Awaiting Payment' then 1 else 0 end) as awaiting,
			coalesce(sum(case when status = 'Completed' then grand_total else 0 end), 0) as sales
		from `tabRiwayat Order`
		where creation >= %(day_start)s and creation < %(day_end)s
		{scope_clause}
		""",
		values,
		as_dict=True,
	)[0]
	completed = cint(row.completed)
	sales = flt(row.sales)
	return {
		"orders": cint(row.orders),
		"completed": completed,
		"cancelled": cint(row.cancelled),
		"awaiting": cint(row.awaiting),
		"sales": sales,
		"avg_ticket": flt(sales / completed) if completed else 0,
	}


def _get_saas_insights(
	day_start,
	day_end,
	company=None,
	pos_profile=None,
	sales_today=None,
	completed_today=None,
	orders_today=None,
	avg_ticket=None,
):
	"""SaaS-style comparisons, funnel, and trend series for the dashboard."""
	scope_clause, scope_values = _scoped_clauses(company, pos_profile)

	yesterday_start = add_days(day_start, -1)
	yesterday_end = day_start
	yesterday = _day_sales_snapshot(yesterday_start, yesterday_end, company, pos_profile)

	if sales_today is None or completed_today is None or orders_today is None:
		today = _day_sales_snapshot(day_start, day_end, company, pos_profile)
		today_sales = today["sales"]
		today_completed = today["completed"]
		today_orders = today["orders"]
		today_avg = today["avg_ticket"]
	else:
		today_sales = flt(sales_today)
		today_completed = cint(completed_today)
		today_orders = cint(orders_today)
		today_avg = (
			flt(avg_ticket)
			if avg_ticket is not None
			else (flt(today_sales / today_completed) if today_completed else 0)
		)

	# Week starts Monday
	weekday = day_start.weekday()  # Mon=0
	week_start = add_days(day_start, -weekday)
	month_start = day_start.replace(day=1)

	wtd = _day_sales_snapshot(week_start, day_end, company, pos_profile)
	mtd = _day_sales_snapshot(month_start, day_end, company, pos_profile)

	trend_start = add_days(day_start, -6)
	trend_rows = frappe.db.sql(
		f"""
		select date(creation) as day,
			count(*) as orders,
			sum(case when status = 'Completed' then 1 else 0 end) as completed,
			coalesce(sum(case when status = 'Completed' then grand_total else 0 end), 0) as sales
		from `tabRiwayat Order`
		where creation >= %(trend_start)s and creation < %(day_end)s
		{scope_clause}
		group by date(creation)
		order by day asc
		""",
		{"trend_start": trend_start, "day_end": day_end, **scope_values},
		as_dict=True,
	)
	by_day = {str(r.day): r for r in trend_rows}
	last_7_days = []
	for offset in range(7):
		d = add_days(trend_start, offset)
		key = str(d)
		row = by_day.get(key)
		last_7_days.append(
			{
				"date": key,
				"label": d.strftime("%d/%m"),
				"weekday": d.strftime("%a"),
				"orders": cint(row.orders) if row else 0,
				"completed": cint(row.completed) if row else 0,
				"sales": flt(row.sales) if row else 0,
			}
		)

	funnel_rows = frappe.db.sql(
		f"""
		select status, count(*) as count
		from `tabRiwayat Order`
		where creation >= %(day_start)s and creation < %(day_end)s
		{scope_clause}
		group by status
		order by count desc
		""",
		{"day_start": day_start, "day_end": day_end, **scope_values},
		as_dict=True,
	)

	hour_rows = frappe.db.sql(
		f"""
		select hour(creation) as hour_slot,
			count(*) as order_count,
			coalesce(sum(case when status = 'Completed' then grand_total else 0 end), 0) as sales
		from `tabRiwayat Order`
		where creation >= %(day_start)s and creation < %(day_end)s
			and status not in ('Cancelled', 'Draft')
		{scope_clause}
		group by hour(creation)
		order by sales desc
		limit 1
		""",
		{"day_start": day_start, "day_end": day_end, **scope_values},
		as_dict=True,
	)
	peak = hour_rows[0] if hour_rows else None

	cancelled_today = next((cint(r.count) for r in funnel_rows if r.status == "Cancelled"), 0)
	awaiting_today = next((cint(r.count) for r in funnel_rows if r.status == "Awaiting Payment"), 0)
	conversion = round((today_completed / today_orders) * 100, 1) if today_orders else 0

	return {
		"yesterday": yesterday,
		"deltas": {
			"sales_pct": _pct_change(today_sales, yesterday["sales"]),
			"completed_pct": _pct_change(today_completed, yesterday["completed"]),
			"orders_pct": _pct_change(today_orders, yesterday["orders"]),
			"avg_ticket_pct": _pct_change(today_avg, yesterday["avg_ticket"]),
			"awaiting_pct": _pct_change(awaiting_today, yesterday["awaiting"]),
			"cancelled_pct": _pct_change(cancelled_today, yesterday["cancelled"]),
		},
		"week_to_date": wtd,
		"month_to_date": mtd,
		"last_7_days": last_7_days,
		"status_funnel": [{"status": r.status, "count": cint(r.count)} for r in funnel_rows],
		"cancelled_today": cancelled_today,
		"conversion_rate": conversion,
		"peak_hour": (
			{
				"hour": cint(peak.hour_slot),
				"label": f"{int(peak.hour_slot):02d}:00",
				"orders": cint(peak.order_count),
				"sales": flt(peak.sales),
			}
			if peak
			else None
		),
	}


def _get_top_products(day_start, day_end, company=None, pos_profile=None, limit=5):
	scope_clause, scope_values = _scoped_clauses(company, pos_profile, alias="o")
	return frappe.db.sql(
		f"""
		select oi.item_code, oi.item_name,
			coalesce(sum(oi.qty), 0) as qty,
			coalesce(sum(oi.amount), 0) as sales
		from `tabIMOGI POS Order Item` oi
		inner join `tabRiwayat Order` o on o.name = oi.parent
		where o.status = 'Completed'
			and o.creation >= %(day_start)s and o.creation < %(day_end)s
			{scope_clause}
		group by oi.item_code, oi.item_name
		order by qty desc
		limit %(limit)s
		""",
		{
			"day_start": day_start,
			"day_end": day_end,
			"limit": limit,
			**scope_values,
		},
		as_dict=True,
	)


def _get_awaiting_orders(company=None, pos_profile=None, limit=10):
	filters = {"status": "Awaiting Payment", "docstatus": 1}
	if company:
		filters["company"] = company
	if pos_profile:
		filters["pos_profile"] = pos_profile
	return frappe.get_all(
		"Riwayat Order",
		filters=filters,
		fields=["name", "grand_total", "customer", "modified", "order_channel", "pos_profile"],
		order_by="modified desc",
		limit=limit,
	)


def _get_restaurant_metrics(day_start, day_end, company=None, pos_profile=None):
	scope_clause, scope_values = _scoped_clauses(company, pos_profile)
	base_values = {"day_start": day_start, "day_end": day_end, **scope_values}

	orders = frappe.db.sql(
		f"""
		select count(*) from `tabRiwayat Order`
		where creation >= %(day_start)s and creation < %(day_end)s
		{scope_clause}
		""",
		base_values,
	)[0][0]

	completed = frappe.db.sql(
		f"""
		select count(*) from `tabRiwayat Order`
		where status = 'Completed' and creation >= %(day_start)s and creation < %(day_end)s
		{scope_clause}
		""",
		base_values,
	)[0][0]

	in_kitchen = frappe.db.sql(
		f"""
		select count(*) from `tabRiwayat Order`
		where status = 'In Kitchen' and creation >= %(day_start)s and creation < %(day_end)s
		{scope_clause}
		""",
		base_values,
	)[0][0]

	in_service = frappe.db.sql(
		f"""
		select count(*) from `tabRiwayat Order`
		where status = 'In Service' and creation >= %(day_start)s and creation < %(day_end)s
		{scope_clause}
		""",
		base_values,
	)[0][0]

	sales = frappe.db.sql(
		f"""
		select coalesce(sum(grand_total), 0)
		from `tabRiwayat Order`
		where status not in ('Cancelled', 'Draft')
			and creation >= %(day_start)s and creation < %(day_end)s
		{scope_clause}
		""",
		base_values,
	)[0][0]

	by_channel = frappe.db.sql(
		f"""
		select order_channel, count(*) as count
		from `tabRiwayat Order`
		where creation >= %(day_start)s and creation < %(day_end)s and status != 'Cancelled'
		{scope_clause}
		group by order_channel
		""",
		base_values,
		as_dict=True,
	)

	by_type = frappe.db.sql(
		f"""
		select order_type, count(*) as count
		from `tabRiwayat Order`
		where creation >= %(day_start)s and creation < %(day_end)s and status != 'Cancelled'
		{scope_clause}
		group by order_type
		""",
		base_values,
		as_dict=True,
	)

	kitchen_filters = {"status": ["in", ["Pending", "Preparing"]], "docstatus": ["<", 2]}
	if company:
		kitchen_filters["company"] = company
	open_kitchen = frappe.db.count("IMOGI Kitchen Order", filters=kitchen_filters)

	return {
		"mode": "restaurant",
		"orders_today": orders,
		"completed_today": completed,
		"in_kitchen": in_kitchen,
		"in_service": in_service,
		"sales_today": flt(sales),
		"avg_ticket": flt(sales / completed) if completed else 0,
		"by_channel": by_channel,
		"by_type": by_type,
		"open_kitchen_orders": open_kitchen,
		"timestamp": frappe.utils.now(),
	}


def _get_umkm_metrics(day_start, day_end, company=None, pos_profile=None):
	scope_clause, scope_values = _scoped_clauses(company, pos_profile)
	base_values = {"day_start": day_start, "day_end": day_end, **scope_values}
	pay_scope_clause, _ = _scoped_clauses(company, pos_profile, alias="o")

	orders = frappe.db.sql(
		f"""
		select count(*) from `tabRiwayat Order`
		where creation >= %(day_start)s and creation < %(day_end)s
		{scope_clause}
		""",
		base_values,
	)[0][0]

	completed = frappe.db.sql(
		f"""
		select count(*) from `tabRiwayat Order`
		where status = 'Completed' and creation >= %(day_start)s and creation < %(day_end)s
		{scope_clause}
		""",
		base_values,
	)[0][0]

	awaiting = frappe.db.sql(
		f"""
		select count(*) from `tabRiwayat Order`
		where status = 'Awaiting Payment' and creation >= %(day_start)s and creation < %(day_end)s
		{scope_clause}
		""",
		base_values,
	)[0][0]

	sales = frappe.db.sql(
		f"""
		select coalesce(sum(grand_total), 0)
		from `tabRiwayat Order`
		where status = 'Completed' and creation >= %(day_start)s and creation < %(day_end)s
		{scope_clause}
		""",
		base_values,
	)[0][0]

	sales = flt(sales)
	avg_ticket = flt(sales / completed) if completed else 0

	by_source = frappe.db.sql(
		f"""
		select coalesce(order_source, 'IMOGI POS') as order_source, count(*) as count,
			coalesce(sum(grand_total), 0) as sales
		from `tabRiwayat Order`
		where status = 'Completed' and creation >= %(day_start)s and creation < %(day_end)s
		{scope_clause}
		group by order_source
		""",
		base_values,
		as_dict=True,
	)

	by_payment = frappe.db.sql(
		f"""
		select pay.mode_of_payment, coalesce(sum(pay.amount), 0) as amount, count(*) as count
		from `tabIMOGI POS Order Payment` pay
		inner join `tabRiwayat Order` o on o.name = pay.parent
		where o.status = 'Completed' and o.creation >= %(day_start)s and o.creation < %(day_end)s
		{pay_scope_clause}
		group by pay.mode_of_payment
		order by amount desc
		""",
		base_values,
		as_dict=True,
	)

	invoice_values = {"day_start": day_start, "day_end": day_end, **scope_values}
	invoice_scope = ""
	if company:
		invoice_scope += " and company = %(company)s"
	if pos_profile:
		invoice_scope += " and pos_profile = %(pos_profile)s"

	pos_invoices_today = frappe.db.sql(
		f"""
		select count(*) from `tabPOS Invoice`
		where docstatus = 1 and is_return = 0
			and creation >= %(day_start)s and creation < %(day_end)s
		{invoice_scope}
		""",
		invoice_values,
	)[0][0]

	return {
		"mode": "umkm",
		"orders_today": orders,
		"completed_today": completed,
		"awaiting_payment": awaiting,
		"sales_today": sales,
		"avg_ticket": avg_ticket,
		"by_source": by_source,
		"by_payment": by_payment,
		"pos_invoices_today": pos_invoices_today,
		"timestamp": frappe.utils.now(),
	}


@frappe.whitelist()
def get_ui_refresh_seconds():
	"""Ops UI refresh interval — avoids client read on IMOGI POS Settings."""
	if frappe.session.user == "Guest":
		frappe.throw(_("Login required"), frappe.AuthenticationError)
	return cint(get_settings().dashboard_refresh_seconds) or 30
