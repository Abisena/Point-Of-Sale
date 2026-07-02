# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.model.document import Document


class IMOGIRestaurantTable(Document):
	def validate(self):
		if not self.restaurant_area:
			return
		if not frappe.db.exists("IMOGI Restaurant Area", self.restaurant_area):
			frappe.throw(_("Area {0} tidak ditemukan").format(self.restaurant_area))

		area = frappe.db.get_value(
			"IMOGI Restaurant Area",
			self.restaurant_area,
			["area_name", "restaurant_floor", "company"],
			as_dict=True,
		)
		self.restaurant_floor = area.restaurant_floor
		self.location = area.area_name
		if self.company and area.company and self.company != area.company:
			frappe.throw(_("Area tidak sesuai dengan company meja"))
