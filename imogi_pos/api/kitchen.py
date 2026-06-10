# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import now_datetime


def _require_kitchen_access():
	from imogi_pos.imogi_pos.utils.feature_gating import require_feature_operational

	require_feature_operational("kitchen_display")


@frappe.whitelist()
def get_kitchen_queue(station_type=None):
	_require_kitchen_access()
	from imogi_pos.imogi_pos.utils.feature_gating import is_feature_operational

	station_filter = ""
	values = {}
	if station_type and is_feature_operational("bar_station"):
		station_filter = " and ks.station_type = %(station_type)s"
		values["station_type"] = station_type

	orders = frappe.db.sql(
		f"""
		select
			ko.name, ko.pos_order, ko.status, ko.kitchen_station,
			ko.started_at, ko.expected_ready_at, ko.timer_minutes,
			po.order_type, po.order_channel, po.customer_name, po.grand_total,
			ks.station_type
		from `tabIMOGI Kitchen Order` ko
		left join `tabIMOGI POS Order` po on po.name = ko.pos_order
		left join `tabIMOGI Kitchen Station` ks on ks.name = ko.kitchen_station
		where ko.status in ('Pending', 'Preparing')
			and ko.docstatus < 2
			{station_filter}
		order by ko.creation asc
		""",
		values,
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
	_require_kitchen_access()
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
