# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import flt


def execute(filters=None):
	columns = get_columns()
	data = get_data(filters)
	return columns, data


def get_columns():
	return [
		{"label": _("Order"), "fieldname": "name", "fieldtype": "Link", "options": "Riwayat Order", "width": 140},
		{"label": _("Date"), "fieldname": "creation", "fieldtype": "Datetime", "width": 150},
		{"label": _("Channel"), "fieldname": "order_channel", "fieldtype": "Data", "width": 90},
		{"label": _("Type"), "fieldname": "order_type", "fieldtype": "Data", "width": 90},
		{"label": _("Status"), "fieldname": "status", "fieldtype": "Data", "width": 120},
		{"label": _("Customer"), "fieldname": "customer_name", "fieldtype": "Data", "width": 150},
		{"label": _("Grand Total"), "fieldname": "grand_total", "fieldtype": "Currency", "width": 110},
		{"label": _("POS Invoice"), "fieldname": "pos_invoice", "fieldtype": "Link", "options": "POS Invoice", "width": 140},
		{"label": _("Kitchen"), "fieldname": "kitchen_order", "fieldtype": "Link", "options": "IMOGI Kitchen Order", "width": 130},
		{"label": _("Delivery"), "fieldname": "delivery_task", "fieldtype": "Link", "options": "IMOGI Delivery Task", "width": 130},
	]


def get_data(filters):
	filters = filters or {}
	conditions = ["docstatus < 2"]
	values = {}

	if filters.get("from_date"):
		conditions.append("creation >= %(from_date)s")
		values["from_date"] = filters["from_date"]
	if filters.get("to_date"):
		conditions.append("creation <= %(to_date)s")
		values["to_date"] = filters["to_date"]
	if filters.get("status"):
		conditions.append("status = %(status)s")
		values["status"] = filters["status"]
	if filters.get("order_channel"):
		conditions.append("order_channel = %(order_channel)s")
		values["order_channel"] = filters["order_channel"]
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
	return frappe.db.sql(
		f"""
		select name, creation, order_channel, order_type, status, customer_name,
			grand_total, pos_invoice, kitchen_order, delivery_task
		from `tabRiwayat Order`
		where {where}
		order by creation desc
		limit 500
		""",
		values,
		as_dict=True,
	)
