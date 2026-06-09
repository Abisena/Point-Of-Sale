# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.model.document import Document


class IMOGIFulfillmentTask(Document):
	def validate_completion(self):
		if not self.picking_done:
			frappe.throw(_("Complete order picking first"))
		if not self.packaging_done:
			frappe.throw(_("Complete packaging first"))
		if not self.quality_assurance_passed:
			frappe.throw(_("Quality assurance must pass"))
		if not self.final_check_done:
			frappe.throw(_("Final check must be completed"))

	def on_update(self):
		if self.picking_done and self.packaging_done and self.quality_assurance_passed:
			if self.status == "Open":
				self.db_set("status", "Quality Check")
