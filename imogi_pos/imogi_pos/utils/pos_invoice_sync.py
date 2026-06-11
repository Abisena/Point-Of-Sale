# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import flt


def sync_imogi_order_from_pos_invoice(doc, method=None):
	"""Option B — mirror ERPNext POS Invoice into Riwayat Order for unified dashboard."""
	if not doc.is_pos or doc.is_return or doc.docstatus != 1:
		return

	if doc.get("imogi_pos_order"):
		return

	existing = frappe.db.get_value("Riwayat Order", {"pos_invoice": doc.name}, "name")
	if existing:
		frappe.db.set_value(
			"POS Invoice",
			doc.name,
			"imogi_pos_order",
			existing,
			update_modified=False,
		)
		return

	order = _build_order_from_pos_invoice(doc)
	frappe.flags.syncing_from_pos_invoice = True

	try:
		order.insert(ignore_permissions=True)
		order.submit()

		frappe.db.set_value(
			"POS Invoice",
			doc.name,
			{
				"imogi_pos_order": order.name,
				"imogi_order_channel": order.order_channel,
				"imogi_order_type": order.order_type,
			},
			update_modified=False,
		)

		order.db_set({"pos_invoice": doc.name, "status": "Paid"})
		order.reload()
		order._run_post_payment_steps()
	except Exception:
		frappe.log_error(
			title=_("IMOGI POS sync from POS Invoice failed for {0}").format(doc.name),
			message=frappe.get_traceback(),
		)
	finally:
		frappe.flags.syncing_from_pos_invoice = False


def cancel_imogi_order_from_pos_invoice(doc, method=None):
	if not doc.get("imogi_pos_order"):
		return

	order = frappe.get_doc("Riwayat Order", doc.imogi_pos_order)
	if order.docstatus != 1:
		return

	frappe.flags.syncing_from_pos_invoice = True
	try:
		order.cancel()
	except frappe.ValidationError:
		frappe.log_error(
			title=_("Could not cancel Riwayat Order for invoice {0}").format(doc.name),
			message=frappe.get_traceback(),
		)
	finally:
		frappe.flags.syncing_from_pos_invoice = False


def _build_order_from_pos_invoice(invoice):
	order = frappe.new_doc("Riwayat Order")
	order.naming_series = "ORD-.YYYY.-"
	order.company = invoice.company
	order.pos_profile = invoice.pos_profile
	order.customer = invoice.customer
	order.currency = invoice.currency
	order.order_source = "ERPNext POS"
	order.order_channel = invoice.get("imogi_order_channel") or "Walk-in"
	order.order_type = invoice.get("imogi_order_type") or "Dine-in"
	order.status = "Awaiting Payment"
	order.pos_invoice = invoice.name
	order.remarks = _("Synced from ERPNext POS Invoice {0}").format(invoice.name)

	for row in invoice.items:
		order.append(
			"items",
			{
				"item_code": row.item_code,
				"item_name": row.item_name,
				"qty": row.qty,
				"uom": row.uom,
				"rate": row.rate,
				"amount": row.amount,
				"warehouse": row.warehouse,
			},
		)

	for pay in invoice.payments:
		if not pay.mode_of_payment:
			continue
		order.append(
			"payments",
			{
				"mode_of_payment": pay.mode_of_payment,
				"amount": pay.amount,
			},
		)

	if not order.payments and flt(invoice.paid_amount):
		mode = _default_mode_of_payment(invoice)
		if mode:
			order.append(
				"payments",
				{"mode_of_payment": mode, "amount": flt(invoice.paid_amount)},
			)

	return order


def _default_mode_of_payment(invoice):
	if invoice.payments:
		return invoice.payments[0].mode_of_payment

	if invoice.pos_profile:
		modes = frappe.get_all(
			"POS Payment Method",
			filters={"parent": invoice.pos_profile},
			pluck="mode_of_payment",
			limit=1,
		)
		if modes:
			return modes[0]

	return frappe.db.get_value("Mode of Payment", {"enabled": 1}, "name")
