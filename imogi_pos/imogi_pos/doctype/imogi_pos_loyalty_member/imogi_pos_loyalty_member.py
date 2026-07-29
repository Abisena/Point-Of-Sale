# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.model.document import Document


class IMOGIPOSLoyaltyMember(Document):
	def validate(self):
		# points is derived, never trusted from input directly — otherwise anyone
		# with write access to this doctype (even just via the standard REST
		# resource endpoint) could set an arbitrary balance. total_earned/
		# total_redeemed are themselves only ever incremented by
		# loyalty.apply_loyalty_after_payment(), which always moves both that
		# counter and points together, so this recomputation matches how the
		# balance is actually meant to change.
		self.total_earned = max(0, int(self.total_earned or 0))
		self.total_redeemed = max(0, int(self.total_redeemed or 0))
		if self.total_redeemed > self.total_earned:
			frappe.throw(_("Total poin ditukar tidak boleh melebihi total poin diperoleh."))
		self.points = self.total_earned - self.total_redeemed
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
