# Copyright (c) 2026, Imogi and contributors
"""ERPNext desk: disable SaaS subscription tier billing and locks."""

import frappe


def execute():
	if not frappe.db.exists("DocType", "IMOGI POS Settings"):
		return

	frappe.db.set_single_value("IMOGI POS Settings", "enable_saas_billing_sync", 0)
	frappe.db.set_single_value("IMOGI POS Settings", "billing_auto_apply_tier", 0)
