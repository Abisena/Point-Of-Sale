# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe.model.document import Document


class IMOGIPOSRoyaltyAccrual(Document):
	@frappe.whitelist()
	def post_journal_entry(self):
		from imogi_pos.imogi_pos.utils.royalty_journal import post_royalty_accrual

		je = post_royalty_accrual(self.name)
		frappe.msgprint(frappe._("Journal Entry {0} created").format(frappe.bold(je)))
		return je
