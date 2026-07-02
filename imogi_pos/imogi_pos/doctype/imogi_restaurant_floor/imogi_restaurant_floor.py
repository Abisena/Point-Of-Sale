# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint


class IMOGIRestaurantFloor(Document):
	def autoname(self):
		self.floor_name = (self.floor_name or "").strip()
		if not self.floor_name:
			frappe.throw(_("Nama lantai wajib diisi"))
		if self.company:
			self.name = f"{self.company} · {self.floor_name}"
		else:
			self.name = self.floor_name

	def validate(self):
		self.floor_name = (self.floor_name or "").strip()
		if not self.floor_name:
			frappe.throw(_("Nama lantai wajib diisi"))

		filters = {"floor_name": self.floor_name, "name": ["!=", self.name or ""]}
		if self.company:
			filters["company"] = self.company
		if frappe.db.exists("IMOGI Restaurant Floor", filters):
			frappe.throw(_("Lantai {0} sudah ada").format(self.floor_name))

	def on_trash(self):
		areas = frappe.db.count("IMOGI Restaurant Area", {"restaurant_floor": self.name})
		if cint(areas):
			frappe.throw(_("Lantai masih punya {0} area/ruangan").format(areas))
		tables = frappe.db.count("IMOGI Restaurant Table", {"restaurant_floor": self.name})
		if cint(tables):
			frappe.throw(_("Lantai masih punya {0} meja").format(tables))
