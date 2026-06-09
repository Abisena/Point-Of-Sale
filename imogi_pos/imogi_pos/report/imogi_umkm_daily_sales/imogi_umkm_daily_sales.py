# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import flt, getdate, today


def execute(filters=None):
	columns = get_columns()
	data, summary = get_data(filters)
	return columns, data, None, None, summary


def get_columns():
	return [
		{
			"label": _("Order"),
			"fieldname": "name",
			"fieldtype": "Link",
			"options": "IMOGI POS Order",
			"width": 130,
		},
		{"label": _("Waktu"), "fieldname": "creation", "fieldtype": "Datetime", "width": 150},
		{"label": _("Sumber"), "fieldname": "order_source", "fieldtype": "Data", "width": 110},
		{"label": _("Status"), "fieldname": "status", "fieldtype": "Data", "width": 110},
		{"label": _("Pembayaran"), "fieldname": "payment_modes", "fieldtype": "Data", "width": 160},
		{
			"label": _("Total"),
			"fieldname": "grand_total",
			"fieldtype": "Currency",
			"width": 120,
		},
	]


def get_data(filters):
	filters = filters or {}
	report_date = getdate(filters.get("date") or today())
	company = filters.get("company")

	conditions = [
		"docstatus < 2",
		"date(creation) = %(report_date)s",
		"status in ('Completed', 'Paid')",
	]
	values = {"report_date": report_date}

	if company:
		conditions.append("company = %(company)s")
		values["company"] = company

	if filters.get("branch"):
		from imogi_pos.imogi_pos.utils.branch import get_branch

		branch = get_branch(name=filters["branch"]) or get_branch(branch_code=filters["branch"])
		if branch and branch.get("pos_profile"):
			conditions.append("pos_profile = %(pos_profile)s")
			values["pos_profile"] = branch["pos_profile"]
	elif filters.get("pos_profile"):
		conditions.append("pos_profile = %(pos_profile)s")
		values["pos_profile"] = filters["pos_profile"]

	where = " and ".join(conditions)
	orders = frappe.db.sql(
		f"""
		select name, creation, order_source, status, grand_total
		from `tabIMOGI POS Order`
		where {where}
		order by creation asc
		""",
		values,
		as_dict=True,
	)

	total_sales = 0
	payment_totals = {}

	for row in orders:
		payments = frappe.get_all(
			"IMOGI POS Order Payment",
			filters={"parent": row.name},
			fields=["mode_of_payment", "amount"],
		)
		row.payment_modes = ", ".join(
			f"{p.mode_of_payment} ({flt(p.amount):.0f})" for p in payments if p.mode_of_payment
		) or "-"
		total_sales += flt(row.grand_total)

		for pay in payments:
			mode = pay.mode_of_payment or _("Unknown")
			payment_totals[mode] = payment_totals.get(mode, 0) + flt(pay.amount)

	count = len(orders)
	avg_ticket = flt(total_sales / count) if count else 0

	summary = [
		{"label": _("Tanggal"), "value": report_date, "datatype": "Date"},
		{"label": _("Jumlah Transaksi"), "value": count, "datatype": "Int"},
		{"label": _("Total Penjualan"), "value": total_sales, "datatype": "Currency", "indicator": "Green"},
		{"label": _("Rata-rata / Transaksi"), "value": avg_ticket, "datatype": "Currency"},
	]

	for mode, amount in sorted(payment_totals.items(), key=lambda x: x[1], reverse=True):
		summary.append(
			{
				"label": _("Pembayaran {0}").format(mode),
				"value": amount,
				"datatype": "Currency",
			}
		)

	return orders, summary
