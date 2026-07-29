# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt, now_datetime

from imogi_pos.imogi_pos.utils.flow import get_settings


class IMOGIPOSCashMovement(Document):
	def before_insert(self):
		self.apply_defaults()

	def validate(self):
		self.apply_defaults()
		if flt(self.amount) <= 0:
			frappe.throw(_("Jumlah harus lebih besar dari 0."))

		from imogi_pos.imogi_pos.utils.shift_closing import _get_open_pos_opening

		# Reuses the same "still open" check the shift-closing flow relies on —
		# a cash movement only makes sense against a shift that hasn't been
		# closed yet.
		_get_open_pos_opening(self.user, self.pos_opening_entry)

	def apply_defaults(self):
		settings = get_settings()
		if not self.company:
			self.company = settings.default_company
		if not self.pos_profile:
			self.pos_profile = settings.default_pos_profile
		# Always the actual session user — the ownership check right after this
		# (in validate()) trusts self.user, so a client-supplied value here would
		# let a cashier inject cash in/out entries under a colleague's name.
		self.user = frappe.session.user
		if not self.posting_datetime:
			self.posting_datetime = now_datetime()
