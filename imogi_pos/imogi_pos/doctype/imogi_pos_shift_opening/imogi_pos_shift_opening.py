# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe.model.document import Document
from frappe.utils import nowdate

from imogi_pos.imogi_pos.utils.flow import get_settings
from imogi_pos.imogi_pos.utils.shift_opening import sync_to_pos_opening_entry, validate_shift_opening


class IMOGIPOSShiftOpening(Document):
	def before_insert(self):
		self.apply_defaults()

	def validate(self):
		self.apply_defaults()
		validate_shift_opening(self)

	def on_submit(self):
		opening_name = sync_to_pos_opening_entry(self)
		if opening_name and opening_name != self.pos_opening_entry:
			self.db_set("pos_opening_entry", opening_name)

	def apply_defaults(self):
		settings = get_settings()
		if not self.company:
			self.company = settings.default_company
		if not self.pos_profile:
			self.pos_profile = settings.default_pos_profile
		if not self.user:
			self.user = frappe.session.user
		if not self.posting_date:
			self.posting_date = nowdate()
