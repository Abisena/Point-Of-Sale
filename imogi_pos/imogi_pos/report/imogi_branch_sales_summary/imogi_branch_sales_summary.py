# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import flt, getdate

from imogi_pos.imogi_pos.utils.branch import get_accessible_branches, get_branch
from imogi_pos.imogi_pos.utils.flow import get_settings
from imogi_pos.imogi_pos.utils.sales_target import get_monthly_actual_sales, get_month_bounds


def execute(filters=None):
	columns = get_columns()
	data = get_data(filters or {})
	return columns, data


def get_columns():
	return [
		{"label": _("Cabang"), "fieldname": "branch_name", "fieldtype": "Data", "width": 180},
		{"label": _("Kode"), "fieldname": "branch_code", "fieldtype": "Data", "width": 120},
		{"label": _("Kota"), "fieldname": "city", "fieldtype": "Data", "width": 100},
		{"label": _("POS Profile"), "fieldname": "pos_profile", "fieldtype": "Link", "options": "POS Profile", "width": 150},
		{"label": _("Warehouse"), "fieldname": "warehouse", "fieldtype": "Link", "options": "Warehouse", "width": 150},
		{"label": _("Transaksi"), "fieldname": "order_count", "fieldtype": "Int", "width": 90},
		{"label": _("Selesai"), "fieldname": "completed_count", "fieldtype": "Int", "width": 90},
		{"label": _("Omzet"), "fieldname": "sales_total", "fieldtype": "Currency", "width": 130},
		{"label": _("Rata-rata"), "fieldname": "avg_ticket", "fieldtype": "Currency", "width": 110},
		{"label": _("Target Bulan"), "fieldname": "target_amount", "fieldtype": "Currency", "width": 120},
		{"label": _("Actual Bulan"), "fieldname": "monthly_actual", "fieldtype": "Currency", "width": 120},
		{"label": _("% Target"), "fieldname": "target_pct", "fieldtype": "Percent", "width": 90},
	]


def get_data(filters):
	settings = get_settings()
	from_date = getdate(filters.get("from_date"))
	to_date = getdate(filters.get("to_date"))
	company = settings.default_company

	branches = get_accessible_branches(company=company)
	if filters.get("branch"):
		branch = get_branch(name=filters.get("branch")) or get_branch(branch_code=filters.get("branch"))
		if branch:
			branches = [row for row in branches if row["branch_code"] == branch["branch_code"]]

	if not branches:
		return []

	month_start, month_end = get_month_bounds(to_date)
	rows = []

	for branch in branches:
		pos_profile = branch["pos_profile"]
		stats = frappe.db.sql(
			"""
			select
				count(*) as order_count,
				coalesce(sum(case when status = 'Completed' then 1 else 0 end), 0) as completed_count,
				coalesce(sum(case when status = 'Completed' then grand_total else 0 end), 0) as sales_total
			from `tabRiwayat Order`
			where docstatus < 2
				and pos_profile = %s
				and date(creation) >= %s and date(creation) <= %s
			""",
			(pos_profile, from_date, to_date),
			as_dict=True,
		)[0]

		sales = flt(stats.sales_total)
		completed = int(stats.completed_count or 0)
		target = flt(branch.get("target_monthly_sales"))
		monthly_actual = get_monthly_actual_sales(company, month_start, month_end, pos_profile=pos_profile)
		target_pct = flt((monthly_actual / target) * 100, 1) if target else 0

		rows.append(
			{
				"branch_name": branch.get("branch_name"),
				"branch_code": branch.get("branch_code"),
				"city": branch.get("city"),
				"pos_profile": pos_profile,
				"warehouse": branch.get("warehouse"),
				"order_count": int(stats.order_count or 0),
				"completed_count": completed,
				"sales_total": sales,
				"avg_ticket": flt(sales / completed) if completed else 0,
				"target_amount": target,
				"monthly_actual": monthly_actual,
				"target_pct": target_pct,
			}
		)

	rows.sort(key=lambda row: (-row["sales_total"], row["branch_name"] or ""))
	return rows
