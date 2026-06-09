# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, flt, getdate


class IMOGIPOSPromoRule(Document):
	def validate(self):
		self.min_qty = max(1, cint(self.min_qty))
		if not self.trigger_item_code and not self.trigger_item_group:
			frappe.throw(_("Isi Item Trigger atau Item Group Trigger"))
		if self.rule_type == "Buy X Get Other Free" and not self.reward_item_code:
			frappe.throw(_("Item Reward wajib untuk rule Buy X Get Other Free"))
		if self.rule_type == "Qty Discount Percent":
			if flt(self.reward_value) <= 0 or flt(self.reward_value) > 100:
				frappe.throw(_("Nilai diskon persen harus antara 0 dan 100"))
		if self.valid_from and self.valid_upto and getdate(self.valid_from) > getdate(self.valid_upto):
			frappe.throw(_("Tanggal berlaku tidak valid"))
