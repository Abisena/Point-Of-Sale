# Copyright (c) 2026, Imogi and contributors

import re

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, flt


class IMOGIBranch(Document):
	def before_insert(self):
		self._clear_auto_defaulted_price_list()

	def validate(self):
		self._normalize_branch_code()
		self._validate_company_links()
		self._validate_price_list()
		self._validate_custom_menu()
		if cint(self.is_default):
			self._ensure_single_default()

	def _clear_auto_defaulted_price_list(self):
		"""Frappe auto-fills any Link field named like a known global default (e.g.
		"selling_price_list") on new docs of ANY doctype — not just Selling ones. Without
		this, every new branch looks like it already has its own price list and
		ensure_branch_price_list() never creates a dedicated one."""
		if self.selling_price_list and self.selling_price_list == frappe.defaults.get_global_default(
			"selling_price_list"
		):
			self.selling_price_list = None

	def _validate_price_list(self):
		if not self.selling_price_list:
			return
		currency = frappe.db.get_value("Company", self.company, "default_currency")
		pl_currency = frappe.db.get_value("Price List", self.selling_price_list, "currency")
		if pl_currency and currency and pl_currency != currency:
			frappe.throw(
				_("Price List {0} ({1}) harus satu mata uang dengan Company ({2})").format(
					self.selling_price_list, pl_currency, currency
				)
			)

	def _validate_custom_menu(self):
		if cint(self.use_custom_menu) and not self.item_groups:
			frappe.throw(_("Tambahkan minimal satu Item Group untuk menu khusus cabang."))

	def _normalize_branch_code(self):
		code = (self.branch_code or "").strip().upper()
		code = re.sub(r"[^\w\s-]", "", code, flags=re.UNICODE)
		code = re.sub(r"[\s_]+", "-", code.strip())
		self.branch_code = code[:140] if code else self.branch_code

	def _validate_company_links(self):
		if self.warehouse and frappe.db.get_value("Warehouse", self.warehouse, "company") != self.company:
			frappe.throw(_("Warehouse {0} harus milik Company {1}").format(self.warehouse, self.company))

		if self.pos_profile and frappe.db.get_value("POS Profile", self.pos_profile, "company") != self.company:
			frappe.throw(_("POS Profile {0} harus milik Company {1}").format(self.pos_profile, self.company))

		profile_wh = frappe.db.get_value("POS Profile", self.pos_profile, "warehouse")
		if profile_wh and profile_wh != self.warehouse:
			frappe.msgprint(
				_("POS Profile memakai warehouse {0}, berbeda dari warehouse cabang {1}. Stok kasir mengikuti warehouse cabang.").format(
					profile_wh, self.warehouse
				),
				indicator="orange",
			)

	def _ensure_single_default(self):
		frappe.db.sql(
			"""
			update `tabIMOGI Branch`
			set is_default = 0
			where company = %s and name != %s and is_default = 1
			""",
			(self.company, self.name or ""),
		)
