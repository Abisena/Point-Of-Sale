# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.model.document import Document

from imogi_pos.imogi_pos.utils.floor_area import (
	assert_table_number_available_on_floor,
	restaurant_table_doc_name,
)


class IMOGIRestaurantTable(Document):
	def autoname(self):
		self._sync_floor_from_area()
		table_number = (self.table_number or "").strip()
		if not table_number:
			frappe.throw(_("Nomor meja wajib diisi"))
		if not self.restaurant_floor:
			frappe.throw(_("Ruangan / lantai wajib dipilih"))
		self.name = restaurant_table_doc_name(self.restaurant_floor, table_number)

	def validate(self):
		self.table_number = (self.table_number or "").strip()
		if not self.table_number:
			frappe.throw(_("Nomor meja wajib diisi"))
		if not self.restaurant_area:
			frappe.throw(_("Ruangan / area wajib dipilih"))
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

		assert_table_number_available_on_floor(
			self.restaurant_floor, self.table_number, exclude_name=self.name
		)

	def before_save(self):
		if not self.restaurant_floor:
			return
		expected = restaurant_table_doc_name(self.restaurant_floor, self.table_number)
		if self.name and self.name != expected:
			self.flags.rename_to = expected

	def on_update(self):
		rename_to = getattr(self.flags, "rename_to", None)
		if rename_to and rename_to != self.name:
			frappe.rename_doc(self.doctype, self.name, rename_to, force=True)
			self.name = rename_to

	def _sync_floor_from_area(self):
		if not self.restaurant_area:
			return
		if not frappe.db.exists("IMOGI Restaurant Area", self.restaurant_area):
			return
		area = frappe.db.get_value(
			"IMOGI Restaurant Area",
			self.restaurant_area,
			["area_name", "restaurant_floor", "company"],
			as_dict=True,
		)
		if area:
			self.restaurant_floor = area.restaurant_floor
			self.location = area.area_name
			if not self.company and area.company:
				self.company = area.company
