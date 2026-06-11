# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _


@frappe.whitelist()
def get_fulfillment_queue():
	frappe.only_for(("IMOGI Fulfillment Staff", "Sales Manager", "Sales User", "System Manager"))

	return frappe.db.sql(
		"""
		select
			ft.name, ft.pos_order, ft.status,
			ft.picking_done, ft.packaging_done,
			ft.quality_assurance_passed, ft.final_check_done,
			ft.assigned_to,
			po.order_type, po.order_channel, po.customer_name, po.grand_total
		from `tabIMOGI Fulfillment Task` ft
		left join `tabRiwayat Order` po on po.name = ft.pos_order
		where ft.status not in ('Done', 'Cancelled')
			and ft.docstatus < 2
		order by ft.creation asc
		""",
		as_dict=True,
	)


@frappe.whitelist()
def update_fulfillment_checks(fulfillment_task, field, value):
	frappe.only_for(("IMOGI Fulfillment Staff", "Sales Manager", "System Manager"))
	ft = frappe.get_doc("IMOGI Fulfillment Task", fulfillment_task)
	ft.check_permission("write")

	allowed = {
		"picking_done",
		"packaging_done",
		"quality_assurance_passed",
		"final_check_done",
	}
	if field not in allowed:
		frappe.throw(_("Invalid field"))

	ft.db_set(field, 1 if frappe.utils.cint(value) else 0)

	if ft.picking_done and ft.status == "Open":
		ft.db_set("status", "Picking")
	elif ft.packaging_done and ft.status in ("Open", "Picking"):
		ft.db_set("status", "Packaging")
	elif ft.quality_assurance_passed:
		ft.db_set("status", "Quality Check")

	frappe.publish_realtime("imogi_fulfillment_updated", {"task": fulfillment_task})
	return ft.name


@frappe.whitelist()
def complete_fulfillment_from_queue(fulfillment_task):
	frappe.only_for(("IMOGI Fulfillment Staff", "Sales Manager", "System Manager"))
	ft = frappe.get_doc("IMOGI Fulfillment Task", fulfillment_task)
	ft.check_permission("write")

	if not ft.pos_order:
		frappe.throw(_("Fulfillment task is not linked to a POS order"))

	pos_order = frappe.get_doc("Riwayat Order", ft.pos_order)
	return pos_order.action_complete_fulfillment()
