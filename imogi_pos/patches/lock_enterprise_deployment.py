# Copyright (c) 2026, Imogi and contributors

import frappe


def execute():
	if not frappe.db.exists("DocType", "IMOGI POS Settings"):
		return

	frappe.db.set_single_value("IMOGI POS Settings", "subscription_tier", "Enterprise")
	frappe.db.set_single_value("IMOGI POS Settings", "enable_saas_billing_sync", 0)
