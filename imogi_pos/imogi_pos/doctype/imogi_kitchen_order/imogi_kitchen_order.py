# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_to_date, now_datetime


class IMOGIKitchenOrder(Document):
	def validate(self):
		if self.started_at and self.timer_minutes:
			self.expected_ready_at = add_to_date(
				self.started_at, minutes=self.timer_minutes
			)

	def on_submit(self):
		if not self.quality_check_passed:
			frappe.msgprint(
				_("Quality check not marked — confirm before serving"),
				indicator="orange",
			)
