# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import flt, getdate


def execute(filters=None):
	columns = get_columns()
	data, summary = get_data(filters)
	return columns, data, None, None, summary


def get_columns():
	return [
		{
			"label": _("Shift Closing"),
			"fieldname": "name",
			"fieldtype": "Link",
			"options": "IMOGI POS Shift Closing",
			"width": 150,
		},
		{"label": _("Kasir"), "fieldname": "user", "fieldtype": "Link", "options": "User", "width": 150},
		{"label": _("Perusahaan"), "fieldname": "company", "fieldtype": "Link", "options": "Company", "width": 110},
		{"label": _("Tanggal"), "fieldname": "posting_date", "fieldtype": "Date", "width": 100},
		{"label": _("Saldo Awal"), "fieldname": "opening_cash", "fieldtype": "Currency", "width": 110},
		{"label": _("Penjualan Tunai"), "fieldname": "cash_sales", "fieldtype": "Currency", "width": 120},
		{"label": _("Cash In"), "fieldname": "cash_in_total", "fieldtype": "Currency", "width": 110},
		{"label": _("Cash Out"), "fieldname": "cash_out_total", "fieldtype": "Currency", "width": 110},
		{"label": _("Pengeluaran"), "fieldname": "expenses", "fieldtype": "Currency", "width": 110},
		{"label": _("Kas Diharapkan"), "fieldname": "expected_cash", "fieldtype": "Currency", "width": 120},
		{"label": _("Kas Aktual"), "fieldname": "actual_cash", "fieldtype": "Currency", "width": 110},
		{"label": _("Selisih"), "fieldname": "difference", "fieldtype": "Currency", "width": 100},
	]


def get_data(filters):
	filters = filters or {}
	from_date = getdate(filters.get("from_date")) if filters.get("from_date") else None
	to_date = getdate(filters.get("to_date")) if filters.get("to_date") else None

	from imogi_pos.imogi_pos.utils.branch import get_accessible_branches

	# Role alone (e.g. IMOGI Supervisor/Manager, granted this report for their
	# own branch) isn't enough to scope the query — without this, anyone with
	# report access sees every branch/company's cash discrepancies, not just
	# their own, by simply leaving the company/user filters blank.
	accessible = get_accessible_branches(company=filters.get("company"))
	pos_profiles = [row["pos_profile"] for row in accessible if row.get("pos_profile")]
	if not pos_profiles:
		return [], []

	conditions = ["docstatus = 1", "pos_profile in %(pos_profiles)s"]
	values = {"pos_profiles": pos_profiles}

	if from_date:
		conditions.append("posting_date >= %(from_date)s")
		values["from_date"] = from_date
	if to_date:
		conditions.append("posting_date <= %(to_date)s")
		values["to_date"] = to_date
	if filters.get("company"):
		conditions.append("company = %(company)s")
		values["company"] = filters["company"]
	if filters.get("user"):
		conditions.append("user = %(user)s")
		values["user"] = filters["user"]

	where = " and ".join(conditions)
	rows = frappe.db.sql(
		f"""
		select name, user, company, posting_date, opening_cash, cash_sales,
			cash_in_total, cash_out_total, expenses, expected_cash, actual_cash, difference
		from `tabIMOGI POS Shift Closing`
		where {where}
		order by posting_date desc, creation desc
		""",
		values,
		as_dict=True,
	)

	total_sales = sum(flt(r.cash_sales) for r in rows)
	total_cash_in = sum(flt(r.cash_in_total) for r in rows)
	total_cash_out = sum(flt(r.cash_out_total) for r in rows)
	total_difference = sum(flt(r.difference) for r in rows)
	discrepancy_count = sum(1 for r in rows if flt(r.difference) != 0)

	summary = [
		{"label": _("Jumlah Shift"), "value": len(rows), "datatype": "Int"},
		{"label": _("Total Penjualan Tunai"), "value": total_sales, "datatype": "Currency", "indicator": "Green"},
		{"label": _("Total Cash In"), "value": total_cash_in, "datatype": "Currency"},
		{"label": _("Total Cash Out"), "value": total_cash_out, "datatype": "Currency"},
		{
			"label": _("Total Selisih"),
			"value": total_difference,
			"datatype": "Currency",
			"indicator": "Red" if total_difference != 0 else "Green",
		},
		{
			"label": _("Shift dengan Selisih"),
			"value": discrepancy_count,
			"datatype": "Int",
			"indicator": "Red" if discrepancy_count else "Green",
		},
	]

	return rows, summary
