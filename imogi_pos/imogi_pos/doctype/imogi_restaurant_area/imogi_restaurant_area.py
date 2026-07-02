# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint


class IMOGIRestaurantArea(Document):
	def autoname(self):
		floor = (self.restaurant_floor or "").strip()
		area = (self.area_name or "").strip()
		if not floor or not area:
			frappe.throw(_("Lantai dan nama area wajib diisi"))
		self.name = f"{floor} / {area}"

	def validate(self):
		self.area_name = (self.area_name or "").strip()
		if not self.area_name:
			frappe.throw(_("Nama ruangan wajib diisi"))
		if not self.restaurant_floor:
			frappe.throw(_("Lantai wajib dipilih"))

		floor_company = frappe.db.get_value("IMOGI Restaurant Floor", self.restaurant_floor, "company")
		if floor_company:
			self.company = floor_company

		duplicate = frappe.db.exists(
			"IMOGI Restaurant Area",
			{
				"restaurant_floor": self.restaurant_floor,
				"area_name": self.area_name,
				"name": ["!=", self.name or ""],
			},
		)
		if duplicate:
			frappe.throw(
				_("Area {0} sudah ada di lantai {1}").format(self.area_name, self.restaurant_floor)
			)

	def on_trash(self):
		in_use = frappe.db.count("IMOGI Restaurant Table", {"restaurant_area": self.name})
		if cint(in_use):
			frappe.throw(
				_("Area {0} masih dipakai oleh {1} meja").format(self.area_name, in_use)
			)
