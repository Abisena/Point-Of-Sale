# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint


class IMOGIAreaManagerAssignment(Document):
	def validate(self):
		self._validate_user_role()
		self._validate_branches()

	def _validate_user_role(self):
		if not self.user:
			return
		roles = set(frappe.get_roles(self.user))
		if "IMOGI Area Manager" not in roles and not roles & {"System Manager", "Administrator"}:
			frappe.throw(
				_("User {0} harus memiliki role IMOGI Area Manager.").format(self.user),
				title=_("Role Tidak Valid"),
			)

	def _validate_branches(self):
		if not cint(self.is_active):
			return
		seen: set[str] = set()
		for row in self.assigned_branches or []:
			branch = (row.branch or "").strip()
			if not branch:
				continue
			if branch in seen:
				frappe.throw(_("Cabang {0} terdaftar lebih dari sekali.").format(branch))
			seen.add(branch)
