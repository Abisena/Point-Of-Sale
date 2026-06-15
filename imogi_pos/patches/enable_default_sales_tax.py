# Copyright (c) 2026, Imogi and contributors
"""Enable default PPN 11% breakdown for existing sites."""

import frappe
from frappe.utils import cint, flt


def execute():
	settings = frappe.get_single("IMOGI POS Settings")
	changed = False
	if not cint(getattr(settings, "enable_sales_tax", 0)):
		settings.enable_sales_tax = 1
		changed = True
	if not flt(getattr(settings, "sales_tax_rate", 0)):
		settings.sales_tax_rate = 11
		changed = True
	if not cint(getattr(settings, "prices_include_tax", 0)):
		settings.prices_include_tax = 1
		changed = True
	if changed:
		settings.save(ignore_permissions=True)
	frappe.db.commit()
	frappe.clear_cache()
