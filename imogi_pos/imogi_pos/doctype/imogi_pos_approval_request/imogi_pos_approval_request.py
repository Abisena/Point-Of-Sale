# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.model.document import Document


class IMOGIPOSApprovalRequest(Document):
	def validate(self):
		# Approve/Reject/Cancel always go through approval.py, which writes the
		# status transition with db_set() — that bypasses validate() entirely, so
		# this only ever fires for a direct save() (Desk form or REST PUT). Any
		# such save changing status is someone bypassing PIN/role approval by
		# editing the record instead of using the Approve/Reject buttons.
		if not self.is_new() and self.has_value_changed("status"):
			frappe.throw(
				_("Status approval hanya boleh diubah lewat tombol Approve/Reject, bukan dengan menyimpan dokumen secara langsung."),
				frappe.PermissionError,
			)
