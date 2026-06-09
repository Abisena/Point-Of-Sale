# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe.model.document import Document
from frappe.utils import flt, nowdate

from imogi_pos.imogi_pos.utils.shift_closing import sync_to_pos_closing_entry, validate_shift_closing


class IMOGIPOSShiftClosing(Document):
	def validate(self):
		self.recalculate_cash_fields()
		validate_shift_closing(self)

	def on_submit(self):
		closing_name = sync_to_pos_closing_entry(self)
		if closing_name and closing_name != self.pos_closing_entry:
			self.db_set("pos_closing_entry", closing_name)

	def recalculate_cash_fields(self):
		self.expected_cash = flt(self.opening_cash) + flt(self.cash_sales) - flt(self.expenses)
		self.difference = flt(self.actual_cash) - flt(self.expected_cash)
		if not self.posting_date:
			self.posting_date = nowdate()
