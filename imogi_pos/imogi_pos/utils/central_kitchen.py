# Copyright (c) 2026, Imogi and contributors
"""Route kitchen orders to a central kitchen station when enabled."""

import frappe
from frappe.utils import cint

from imogi_pos.imogi_pos.utils.flow import get_settings


def is_central_kitchen_enabled(settings=None) -> bool:
	settings = settings or get_settings()
	return bool(cint(getattr(settings, "enable_central_kitchen", 0)))


def resolve_kitchen_station(order, settings=None):
	"""Pick kitchen station — central kitchen overrides branch station when configured."""
	settings = settings or get_settings()
	if is_central_kitchen_enabled(settings):
		central_station = getattr(settings, "central_kitchen_station", None)
		if central_station and frappe.db.exists("IMOGI Kitchen Station", central_station):
			return central_station

	return frappe.db.get_value(
		"IMOGI Kitchen Station",
		{"is_active": 1, "company": order.company},
		"name",
		order_by="modified desc",
	)
