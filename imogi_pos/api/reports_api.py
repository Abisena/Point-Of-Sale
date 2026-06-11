# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import add_days, flt, getdate, today

from imogi_pos.api.dashboard import _day_bounds, _scoped_clauses
from imogi_pos.imogi_pos.utils.feature_gating import is_feature_operational, require_feature_operational
from imogi_pos.imogi_pos.utils.flow import get_settings, resolve_company


def _require_report_access():
	if frappe.session.user == "Guest":
		frappe.throw(_("Not permitted"), frappe.PermissionError)
	settings = get_settings()
	user = frappe.session.user
	if is_feature_operational("sales_report", settings, user=user) or is_feature_operational(
		"dashboard_sales", settings, user=user
	):
		return
	require_feature_operational("sales_report", settings, user=user)


def _report_bounds(date_from=None, date_to=None):
	day_start = getdate(date_from) if date_from else getdate(today())
	day_end = add_days(getdate(date_to) if date_to else day_start, 1)
	return day_start, day_end


def _scope(company=None, pos_profile=None, branch=None):
	settings = get_settings()
	company = resolve_company(company, settings)
	pos_profile = pos_profile
	if branch and not pos_profile:
		from imogi_pos.imogi_pos.utils.branch import resolve_active_branch

		ctx = resolve_active_branch(branch_code=branch)
		pos_profile = ctx.get("pos_profile")
		company = ctx.get("company") or company
	return company, pos_profile


@frappe.whitelist()
def get_sales_by_hour(date=None, date_from=None, date_to=None, company=None, pos_profile=None, branch=None):
	_require_report_access()
	require_feature_operational("sales_by_hour")
	day_start, day_end = _report_bounds(date_from or date, date_to or date_from or date)
	company, pos_profile = _scope(company, pos_profile, branch)
	scope_clause, scope_values = _scoped_clauses(company, pos_profile)

	rows = frappe.db.sql(
		f"""
		select hour(creation) as hour_slot,
			count(*) as order_count,
			coalesce(sum(grand_total), 0) as sales
		from `tabRiwayat Order`
		where status not in ('Cancelled', 'Draft')
			and creation >= %(day_start)s and creation < %(day_end)s
			{scope_clause}
		group by hour(creation)
		order by hour_slot asc
		""",
		{"day_start": day_start, "day_end": day_end, **scope_values},
		as_dict=True,
	)
	return {"rows": rows, "date_from": str(day_start), "date_to": str(add_days(day_end, -1))}


@frappe.whitelist()
def get_sales_by_category(date=None, date_from=None, date_to=None, company=None, pos_profile=None, branch=None):
	_require_report_access()
	require_feature_operational("sales_by_category")
	day_start, day_end = _report_bounds(date_from or date, date_to or date_from or date)
	company, pos_profile = _scope(company, pos_profile, branch)
	scope_clause, scope_values = _scoped_clauses(company, pos_profile, alias="o")

	rows = frappe.db.sql(
		f"""
		select coalesce(ig.item_group_name, ig.name, 'Uncategorized') as category,
			coalesce(sum(oi.qty), 0) as qty,
			coalesce(sum(oi.amount), 0) as sales
		from `tabIMOGI POS Order Item` oi
		inner join `tabRiwayat Order` o on o.name = oi.parent
		left join `tabItem` i on i.name = oi.item_code
		left join `tabItem Group` ig on ig.name = i.item_group
		where o.status = 'Completed'
			and o.creation >= %(day_start)s and o.creation < %(day_end)s
			{scope_clause}
		group by coalesce(ig.item_group_name, ig.name, 'Uncategorized')
		order by sales desc
		limit 20
		""",
		{"day_start": day_start, "day_end": day_end, **scope_values},
		as_dict=True,
	)
	return {"rows": rows, "date_from": str(day_start), "date_to": str(add_days(day_end, -1))}


@frappe.whitelist()
def get_discount_report(date=None, date_from=None, date_to=None, company=None, pos_profile=None, branch=None):
	_require_report_access()
	require_feature_operational("discount_report")
	day_start, day_end = _report_bounds(date_from or date, date_to or date_from or date)
	company, pos_profile = _scope(company, pos_profile, branch)
	scope_clause, scope_values = _scoped_clauses(company, pos_profile)

	rows = frappe.db.sql(
		f"""
		select name, customer, grand_total, discount_amount, discount_type, discount_value,
			voucher_discount_amount, loyalty_discount_amount, promo_discount_amount, creation
		from `tabRiwayat Order`
		where status not in ('Cancelled', 'Draft')
			and (
				coalesce(discount_amount, 0) > 0
				or coalesce(voucher_discount_amount, 0) > 0
				or coalesce(loyalty_discount_amount, 0) > 0
				or coalesce(promo_discount_amount, 0) > 0
			)
			and creation >= %(day_start)s and creation < %(day_end)s
			{scope_clause}
		order by creation desc
		limit 100
		""",
		{"day_start": day_start, "day_end": day_end, **scope_values},
		as_dict=True,
	)
	total_discount = sum(
		flt(r.discount_amount)
		+ flt(r.voucher_discount_amount)
		+ flt(r.loyalty_discount_amount)
		+ flt(r.promo_discount_amount)
		for r in rows
	)
	return {
		"rows": rows,
		"total_discount": total_discount,
		"count": len(rows),
		"date_from": str(day_start),
		"date_to": str(add_days(day_end, -1)),
	}


@frappe.whitelist()
def get_refund_report(date=None, date_from=None, date_to=None, company=None, pos_profile=None, branch=None):
	_require_report_access()
	require_feature_operational("refund_report")
	day_start, day_end = _report_bounds(date_from or date, date_to or date_from or date)
	company, pos_profile = _scope(company, pos_profile, branch)
	scope_clause, scope_values = _scoped_clauses(company, pos_profile)

	rows = frappe.db.sql(
		f"""
		select name, customer, grand_total, refunded_amount, status, return_pos_invoice,
			remarks, modified, creation
		from `tabRiwayat Order`
		where status in ('Refunded', 'Partially Refunded')
			and modified >= %(day_start)s and modified < %(day_end)s
			{scope_clause}
		order by modified desc
		limit 100
		""",
		{"day_start": day_start, "day_end": day_end, **scope_values},
		as_dict=True,
	)
	return {
		"rows": rows,
		"total_refunded": sum(flt(r.refunded_amount) for r in rows),
		"count": len(rows),
		"date_from": str(day_start),
		"date_to": str(add_days(day_end, -1)),
	}


@frappe.whitelist()
def get_extended_reports(date=None, company=None, pos_profile=None, branch=None):
	"""Bundle report panels for dashboard (skips locked tiers gracefully)."""
	_require_report_access()
	from imogi_pos.imogi_pos.utils.feature_gating import is_feature_operational

	settings = get_settings()
	common = {"date": date, "company": company, "pos_profile": pos_profile, "branch": branch}
	from imogi_pos.imogi_pos.utils.planned_features import (
		get_customer_visit_report,
		get_discount_analysis,
		get_food_cost_report,
		get_kitchen_performance_report,
		get_table_turnover_report,
		get_void_analysis,
		get_waste_report,
	)

	specs = (
		("sales_by_hour", "sales_by_hour", get_sales_by_hour),
		("sales_by_category", "sales_by_category", get_sales_by_category),
		("discount_report", "discount_report", get_discount_report),
		("refund_report", "refund_report", get_refund_report),
		("food_cost_report", "food_cost_report", get_food_cost_report),
		("waste_report", "waste_report", get_waste_report),
		("table_turnover_report", "table_turnover_report", get_table_turnover_report),
		("customer_visit_report", "customer_visit_report", get_customer_visit_report),
		("kitchen_performance", "kitchen_performance", get_kitchen_performance_report),
		("discount_analysis", "discount_analysis", get_discount_analysis),
		("void_analysis", "void_analysis", get_void_analysis),
	)
	out = {}
	for key, feature_id, fn in specs:
		if is_feature_operational(feature_id, settings):
			try:
				out[key] = fn(**common)
			except Exception:
				out[key] = {"rows": [], "error": True}
		else:
			out[key] = {"rows": [], "locked": True}
	return out
