# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt


class IMOGIPOSLoyaltyTier(Document):
	def validate(self):
		if flt(self.point_multiplier) <= 0:
			frappe.throw(_("Multiplier harus lebih dari 0"))
