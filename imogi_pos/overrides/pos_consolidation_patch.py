# Copyright (c) 2026, Imogi and contributors
"""Patch ERPNext POS consolidation — always sync merge, safe failure handling."""

from __future__ import annotations

import json

import frappe
from frappe.utils import getdate, get_time, nowdate, nowtime

_PATCHED = False


def _closing_entry_name(closing_entry):
	if not closing_entry:
		return None
	if isinstance(closing_entry, str):
		return closing_entry
	return closing_entry.get("name") if isinstance(closing_entry, dict) else getattr(closing_entry, "name", None)


def _closing_field(closing_entry, fieldname):
	if not closing_entry:
		return None
	if isinstance(closing_entry, dict):
		return closing_entry.get(fieldname)
	return getattr(closing_entry, fieldname, None)


def _prepare_imogi_merge(closing_entry):
	if not closing_entry:
		return

	from imogi_pos.imogi_pos.utils.pos_consolidation import repair_mode_of_payment_accounts
	from imogi_pos.imogi_pos.utils.shift_closing import repair_pos_invoice_order_links

	company = _closing_field(closing_entry, "company")
	if not company:
		closing_name = _closing_entry_name(closing_entry)
		if closing_name:
			company = frappe.db.get_value("POS Closing Entry", closing_name, "company")

	repair_mode_of_payment_accounts(company)
	repair_pos_invoice_order_links(_closing_field(closing_entry, "pos_transactions") or [])


def _mark_closing_failed_safe(closing_name, error_message):
	if not closing_name or not frappe.db.exists("POS Closing Entry", closing_name):
		return

	if isinstance(error_message, list):
		error_message = json.dumps(error_message)

	frappe.db.set_value(
		"POS Closing Entry",
		closing_name,
		{"status": "Failed", "error_message": error_message or ""},
		update_modified=True,
	)


def _mark_closing_submitted_safe(closing_entry, closing_name):
	if not closing_name or not frappe.db.exists("POS Closing Entry", closing_name):
		return

	frappe.db.set_value(
		"POS Closing Entry",
		closing_name,
		{"status": "Submitted", "error_message": ""},
		update_modified=True,
	)
	closing_doc = frappe.get_doc("POS Closing Entry", closing_name)
	closing_doc.update_opening_entry()


def imogi_create_merge_logs(invoice_by_customer, closing_entry=None):
	"""Run POS invoice merge synchronously with IMOGI repairs and safe error updates."""
	from erpnext.accounts.doctype.pos_invoice_merge_log.pos_invoice_merge_log import (
		get_error_message,
		split_invoices,
	)

	closing_name = _closing_entry_name(closing_entry)
	if closing_name and not frappe.db.exists("POS Closing Entry", closing_name):
		frappe.logger("imogi_pos").warning(
			"Skip stale POS merge job for missing closing entry %s", closing_name
		)
		return

	_prepare_imogi_merge(closing_entry)

	try:
		for customer, invoices_acc_dim in invoice_by_customer.items():
			for invoices in invoices_acc_dim.values():
				for invoice_group in split_invoices(invoices):
					merge_log = frappe.new_doc("POS Invoice Merge Log")
					merge_log.posting_date = getdate(_closing_field(closing_entry, "posting_date") or nowdate())
					merge_log.posting_time = get_time(_closing_field(closing_entry, "posting_time") or nowtime())
					merge_log.company = _closing_field(closing_entry, "company")
					merge_log.customer = customer
					merge_log.pos_closing_entry = closing_name
					merge_log.set("pos_invoices", invoice_group)
					merge_log.save(ignore_permissions=True)
					merge_log.submit()

		if closing_entry:
			_mark_closing_submitted_safe(closing_entry, closing_name)

	except Exception as exc:
		frappe.db.rollback()
		message_log = frappe.message_log.pop() if frappe.message_log else str(exc)
		error_message = get_error_message(message_log)
		_mark_closing_failed_safe(closing_name, error_message)
		raise

	finally:
		frappe.db.commit()
		frappe.publish_realtime("closing_process_complete", user=frappe.session.user)


def imogi_consolidate_pos_invoices(pos_invoices=None, closing_entry=None):
	"""Always consolidate synchronously — avoid stale background merge jobs."""
	from erpnext.accounts.doctype.pos_invoice_merge_log.pos_invoice_merge_log import (
		get_all_unconsolidated_invoices,
		get_invoice_customer_map,
	)

	invoices = pos_invoices or (_closing_field(closing_entry, "pos_transactions") if closing_entry else None)
	if frappe.flags.in_test and not invoices:
		invoices = get_all_unconsolidated_invoices()

	invoice_by_customer = get_invoice_customer_map(invoices)
	imogi_create_merge_logs(invoice_by_customer, closing_entry=closing_entry)


def apply_pos_consolidation_patches():
	global _PATCHED
	if _PATCHED:
		return

	import erpnext.accounts.doctype.pos_invoice_merge_log.pos_invoice_merge_log as merge_module

	merge_module.create_merge_logs = imogi_create_merge_logs
	merge_module.consolidate_pos_invoices = imogi_consolidate_pos_invoices
	_PATCHED = True
