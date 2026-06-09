# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import now_datetime


@frappe.whitelist()
def get_kitchen_queue():
	frappe.only_for(("IMOGI Kitchen Staff", "Sales Manager", "Sales User", "System Manager"))

	orders = frappe.db.sql(
		"""
		select
			ko.name, ko.pos_order, ko.status, ko.kitchen_station,
			ko.started_at, ko.expected_ready_at, ko.timer_minutes,
			po.order_type, po.order_channel, po.customer_name, po.grand_total
		from `tabIMOGI Kitchen Order` ko
		left join `tabIMOGI POS Order` po on po.name = ko.pos_order
		where ko.status in ('Pending', 'Preparing')
			and ko.docstatus < 2
		order by ko.creation asc
		""",
		as_dict=True,
	)

	for row in orders:
		row["items"] = frappe.get_all(
			"IMOGI Kitchen Order Item",
			filters={"parent": row.name},
			fields=["item_code", "item_name", "qty", "status", "notes"],
		)

	return orders


@frappe.whitelist()
def update_kitchen_status(kitchen_order, status):
	frappe.only_for(("IMOGI Kitchen Staff", "Sales Manager", "System Manager"))
	ko = frappe.get_doc("IMOGI Kitchen Order", kitchen_order)
	ko.check_permission("write")

	if status not in ("Pending", "Preparing", "Ready", "Done"):
		frappe.throw(_("Invalid kitchen status"))

	ko.db_set("status", status)
	if status == "Preparing" and not ko.started_at:
		ko.db_set("started_at", now_datetime())

	frappe.publish_realtime("imogi_kitchen_updated", {"kitchen_order": kitchen_order, "status": status})
	return ko.name


@frappe.whitelist()
def complete_kitchen_from_display(kitchen_order):
	frappe.only_for(("IMOGI Kitchen Staff", "Sales Manager", "System Manager"))
	ko = frappe.get_doc("IMOGI Kitchen Order", kitchen_order)
	ko.check_permission("write")

	if not ko.pos_order:
		frappe.throw(_("Kitchen order is not linked to a POS order"))

	ko.db_set("status", "Done")
	pos_order = frappe.get_doc("IMOGI POS Order", ko.pos_order)
	return pos_order.action_complete_kitchen()
