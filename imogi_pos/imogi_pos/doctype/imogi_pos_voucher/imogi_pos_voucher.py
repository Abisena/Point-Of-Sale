# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt, getdate, today


def _find_customer_by_phone(phone):
	"""Best-effort: cari Customer dari No. HP lewat Contact."""
	from imogi_pos.imogi_pos.utils.loyalty import normalize_phone

	target = normalize_phone(phone)
	if not target:
		return None

	like = f"%{target[-8:]}%"
	rows = frappe.db.sql(
		"""
		SELECT dl.link_name AS customer, ct.mobile_no, ct.phone
		FROM `tabContact` ct
		INNER JOIN `tabDynamic Link` dl
			ON dl.parent = ct.name AND dl.parenttype = 'Contact'
		WHERE dl.link_doctype = 'Customer'
			AND (ct.mobile_no LIKE %(like)s OR ct.phone LIKE %(like)s)
		ORDER BY ct.modified DESC
		LIMIT 50
		""",
		{"like": like},
		as_dict=True,
	)
	for row in rows:
		if normalize_phone(row.mobile_no) == target or normalize_phone(row.phone) == target:
			return row.customer
	return None


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
		self._sync_owner()

	def _sync_owner(self):
		"""Selaraskan relasi pemilik: Customer <-> No. HP unik."""
		from imogi_pos.imogi_pos.utils.loyalty import normalize_phone

		self.customer_mobile = normalize_phone(self.customer_mobile)

		if self.customer and not self.customer_mobile:
			from imogi_pos.api.customer_api import _contact_phone, _get_customer_contact

			contact = _get_customer_contact(self.customer)
			if contact:
				self.customer_mobile = normalize_phone(_contact_phone(contact))

		if self.customer_mobile and not self.customer:
			self.customer = _find_customer_by_phone(self.customer_mobile)
