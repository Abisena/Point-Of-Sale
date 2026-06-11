# Copyright (c) 2026, Imogi and contributors
"""Cashier does not need desk access to IMOGI POS Settings (server uses get_settings)."""

import frappe
from frappe.permissions import update_permission_property


def execute():
	if not frappe.db.exists(
		"Custom DocPerm", {"parent": "IMOGI POS Settings", "role": "IMOGI Cashier", "permlevel": 0}
	):
		return
	update_permission_property("IMOGI POS Settings", "IMOGI Cashier", 0, "read", 0)
