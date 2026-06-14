# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe.utils import getdate, get_time

from erpnext.accounts.doctype.pos_invoice_merge_log.pos_invoice_merge_log import POSInvoiceMergeLog

from imogi_pos.imogi_pos.utils.pos_consolidation import should_skip_consolidated_stock


class ImogiPOSInvoiceMergeLog(POSInvoiceMergeLog):
	def _save_submit_consolidated_invoice(self, sales_invoice):
		# Cashiers lack Sales Invoice create permission; consolidation runs on their behalf.
		sales_invoice.flags.ignore_permissions = True
		sales_invoice.save()
		sales_invoice.submit()
		return sales_invoice

	def process_merging_into_sales_invoice(self, data):
		sales_invoice = self.get_new_sales_invoice()
		sales_invoice = self.merge_pos_invoice_into(sales_invoice, data)

		sales_invoice.is_consolidated = 1
		sales_invoice.set_posting_time = 1
		sales_invoice.update_stock = 0 if should_skip_consolidated_stock(sales_invoice) else 1

		if not sales_invoice.posting_date:
			sales_invoice.posting_date = getdate(self.posting_date)

		if not sales_invoice.posting_time:
			sales_invoice.posting_time = get_time(self.posting_time)

		sales_invoice = self._save_submit_consolidated_invoice(sales_invoice)

		self.consolidated_invoice = sales_invoice.name

		return sales_invoice

	def process_merging_into_credit_notes(self, data):
		credit_notes = {}
		for key, value in data.items():
			if not value:
				continue

			credit_note = self.get_new_sales_invoice()
			credit_note.is_return = 1
			credit_note = self.merge_pos_invoice_into(credit_note, value)
			credit_note.return_against = key
			credit_note.is_consolidated = 1
			credit_note.set_posting_time = 1
			credit_note.update_stock = 0 if should_skip_consolidated_stock(credit_note) else 1
			credit_note.posting_date = getdate(self.posting_date)
			credit_note.posting_time = get_time(self.posting_time)

			credit_note = self._save_submit_consolidated_invoice(credit_note)
			self.consolidated_credit_note = credit_note.name
			credit_notes[credit_note.name] = [d.name for d in value]

		return credit_notes

	def update_pos_invoices(self, invoice_docs, sales_invoice="", credit_notes=None):
		for doc in invoice_docs:
			doc.load_from_db()
			inv = sales_invoice
			if doc.is_return and credit_notes:
				for key, value in credit_notes.items():
					if doc.name in value:
						inv = key
						break
			doc.update({"consolidated_invoice": None if self.docstatus == 2 else inv})
			doc.set_status(update=True)
			doc.flags.ignore_permissions = True
			doc.save()
