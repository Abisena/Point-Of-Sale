# Copyright (c) 2026, Imogi and contributors

import calendar

import frappe
from frappe import _
from frappe.utils import add_days, flt, formatdate, get_first_day, get_last_day, getdate, today

from imogi_pos.imogi_pos.utils.flow import get_settings


def get_target_amount():
	settings = get_settings()
	return flt(settings.target_monthly_sales)


def get_month_bounds(reference_date=None):
	day = getdate(reference_date) if reference_date else getdate(today())
	return getdate(get_first_day(day)), getdate(get_last_day(day))


def get_monthly_actual_sales(company, month_start, month_end, pos_profile=None):
	"""Net POS sales for the month (submitted invoices, returns included as negative)."""
	if not company:
		return 0

	conditions = [
		"docstatus = 1",
		"company = %s",
		"posting_date >= %s",
		"posting_date <= %s",
	]
	params = [company, month_start, month_end]
	if pos_profile:
		conditions.append("pos_profile = %s")
		params.append(pos_profile)

	return flt(
		frappe.db.sql(
			f"""
			select coalesce(sum(grand_total), 0)
			from `tabPOS Invoice`
			where {" and ".join(conditions)}
			""",
			tuple(params),
		)[0][0]
	)


def get_sales_target_progress(reference_date=None, company=None, target_amount=None, pos_profile=None):
	"""Return monthly target progress for dashboard and cashier."""
	settings = get_settings()
	company = company or settings.default_company
	target = flt(target_amount) if target_amount is not None else get_target_amount()
	month_start, month_end = get_month_bounds(reference_date)
	ref_day = getdate(reference_date) if reference_date else getdate(today())

	if not target:
		return {"enabled": False}

	actual = get_monthly_actual_sales(company, month_start, month_end, pos_profile=pos_profile)
	remaining = max(0, target - actual)
	progress_pct = min(100, round((actual / target) * 100, 1)) if target else 0

	days_in_month = calendar.monthrange(ref_day.year, ref_day.month)[1]
	day_of_month = ref_day.day
	days_remaining = max(0, days_in_month - day_of_month)
	daily_average = flt(actual / day_of_month) if day_of_month else 0
	daily_pace_needed = flt(remaining / max(1, days_remaining + 1))

	expected_pct = round((day_of_month / days_in_month) * 100, 1) if days_in_month else 0
	on_track = progress_pct >= expected_pct

	status = "on_track" if on_track else "behind"
	if progress_pct >= 100:
		status = "achieved"

	return {
		"enabled": True,
		"company": company,
		"month_start": str(month_start),
		"month_end": str(month_end),
		"month_label": formatdate(month_start, "MMMM yyyy"),
		"target_amount": target,
		"actual_amount": actual,
		"remaining_amount": remaining,
		"progress_pct": progress_pct,
		"expected_pct": expected_pct,
		"day_of_month": day_of_month,
		"days_in_month": days_in_month,
		"days_remaining": days_remaining,
		"daily_average": daily_average,
		"daily_pace_needed": daily_pace_needed,
		"on_track": on_track,
		"status": status,
		"status_label": _status_label(status),
	}


def _status_label(status):
	return {
		"on_track": _("Sesuai target"),
		"behind": _("Perlu ditingkatkan"),
		"achieved": _("Target tercapai"),
	}.get(status, status)


@frappe.whitelist()
def get_sales_target_progress_api(reference_date=None, pos_profile=None, branch=None):
	frappe.only_for(
		(
			"IMOGI Owner",
			"IMOGI Manager",
			"IMOGI Cashier",
			"IMOGI Supervisor",
			"Sales Manager",
			"Sales User",
			"Accounts Manager",
			"Administrator",
		)
	)
	from imogi_pos.imogi_pos.utils.branch import resolve_active_branch

	branch_ctx = resolve_active_branch(branch_code=branch, pos_profile=pos_profile)
	return get_sales_target_progress(
		reference_date,
		company=branch_ctx["company"],
		target_amount=branch_ctx.get("target_monthly_sales"),
		pos_profile=branch_ctx["pos_profile"],
	)
