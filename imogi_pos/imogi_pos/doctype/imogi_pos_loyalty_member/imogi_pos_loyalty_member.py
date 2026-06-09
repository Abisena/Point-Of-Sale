# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.model.document import Document


class IMOGIPOSLoyaltyMember(Document):
	def validate(self):
		self.points = max(0, int(self.points or 0))
		self.total_earned = max(0, int(self.total_earned or 0))
		self.total_redeemed = max(0, int(self.total_redeemed or 0))
		self._ensure_unique_customer_company()

	def _ensure_unique_customer_company(self):
		if not self.customer or not self.company:
			return
		existing = frappe.db.get_value(
			"IMOGI POS Loyalty Member",
			{"customer": self.customer, "company": self.company, "name": ["!=", self.name]},
			"name",
		)
		if existing:
			frappe.throw(
				_("Loyalty member untuk customer {0} di company {1} sudah ada").format(
					self.customer, self.company
				)
			)
