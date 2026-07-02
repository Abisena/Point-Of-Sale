# Copyright (c) 2026, Imogi and contributors
"""Backfill enable_table_service for existing sites.

The toggle is brand new; existing installs ran with Table Management gated only
by subscription tier (effectively ON). The field defaults to 0 on the existing
Single record, so enable it once to preserve current behavior. Outlets that
don't do dine-in can switch it off afterwards in IMOGI POS Settings.
"""

import frappe
from frappe.utils import cint


def execute():
	settings = frappe.get_single("IMOGI POS Settings")
	if not cint(getattr(settings, "enable_table_service", 0)):
		settings.enable_table_service = 1
		settings.save(ignore_permissions=True)
		frappe.db.commit()
	frappe.clear_cache()
