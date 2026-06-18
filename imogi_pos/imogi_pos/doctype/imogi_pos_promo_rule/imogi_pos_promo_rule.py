# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, flt, getdate, today


class IMOGIPOSPromoRule(Document):
	def validate(self):
		self.min_qty = max(1, cint(self.min_qty))
		if not self.trigger_item_code and not self.trigger_item_group:
			frappe.throw(_("Isi Item Trigger atau Item Group Trigger"))

		if self.rule_type == "Buy X Get Other Free":
			self._sync_legacy_reward_items()
			if not self.reward_items:
				frappe.throw(_("Tambahkan minimal satu item reward untuk rule Buy X Get Other Free"))
			for row in self.reward_items:
				row.qty = max(1, flt(row.qty or 1))

		if self.rule_type == "Qty Discount Percent":
			if flt(self.reward_value) <= 0 or flt(self.reward_value) > 100:
				frappe.throw(_("Nilai diskon persen harus antara 0 dan 100"))

		if self.rule_type == "Qty Discount Amount":
			if flt(self.reward_value) <= 0:
				frappe.throw(_("Nilai diskon nominal harus lebih dari 0"))

		if self.valid_from and self.valid_upto and getdate(self.valid_from) > getdate(self.valid_upto):
			frappe.throw(_("Tanggal berlaku tidak valid"))

		seen_branches = set()
		for row in self.outlets or []:
			if not row.branch:
				continue
			if row.branch in seen_branches:
				frappe.throw(_("Outlet {0} sudah ditambahkan").format(row.branch))
			seen_branches.add(row.branch)

		self._sync_active_flag()

	def _sync_active_flag(self):
		"""Status aktif mengikuti masa berlaku, bukan checkbox manual."""
		if not self.valid_from or not self.valid_upto:
			self.is_active = 0
			return
		today_date = getdate(today())
		start = getdate(self.valid_from)
		end = getdate(self.valid_upto)
		self.is_active = 1 if start <= today_date <= end else 0

	def _sync_legacy_reward_items(self):
		if self.reward_items:
			self.reward_item_code = self.reward_items[0].item_code
			return
		if self.reward_item_code:
			self.append("reward_items", {"item_code": self.reward_item_code, "qty": 1})
