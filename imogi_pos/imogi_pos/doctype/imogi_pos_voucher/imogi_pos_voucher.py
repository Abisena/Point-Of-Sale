# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt, getdate, today


class IMOGIPOSVoucher(Document):
	def validate(self):
		self.voucher_code = (self.voucher_code or "").strip().upper()
		if not self.voucher_code:
			frappe.throw(_("Kode voucher wajib diisi"))
		if flt(self.discount_value) <= 0:
			frappe.throw(_("Nilai diskon harus lebih dari 0"))
		if self.discount_type == "Percent" and flt(self.discount_value) > 100:
			frappe.throw(_("Diskon persen maksimal 100%"))
		if self.valid_from and self.valid_upto and getdate(self.valid_from) > getdate(self.valid_upto):
			frappe.throw(_("Tanggal berlaku tidak valid"))
