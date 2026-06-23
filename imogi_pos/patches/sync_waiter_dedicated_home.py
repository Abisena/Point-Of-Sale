# Copyright (c) 2026, Imogi and contributors
"""Dedicated waiter lands on Table Service (not workspace / cashier)."""

import frappe


def execute():
	if frappe.db.exists("Role", "IMOGI Waiter"):
		frappe.db.set_value("Role", "IMOGI Waiter", "home_page", "table-service")
	frappe.clear_cache()
