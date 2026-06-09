# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime


class IMOGIDeliveryTask(Document):
	def mark_completed(self):
		status = "Delivered"
		if self.order_type == "Takeaway":
			status = "Picked Up"
		elif self.order_type == "Dine-in":
			status = "Served"

		self.db_set(
			{
				"status": status,
				"delivered_at": now_datetime(),
			}
		)

	@frappe.whitelist()
	def update_gps(self, latitude, longitude):
		self.check_permission("write")
		self.db_set(
			{
				"gps_latitude": latitude,
				"gps_longitude": longitude,
			}
		)
		frappe.publish_realtime(
			"imogi_delivery_gps_update",
			{"task": self.name, "lat": latitude, "lng": longitude},
		)
		return True
