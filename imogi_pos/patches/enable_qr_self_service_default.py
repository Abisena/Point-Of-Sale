# Copyright (c) 2026, Imogi and contributors
"""Enable QR Self-Service when Table Service is already on.

Existing dine-in outlets keep table service enabled; turn on QR self-service
so staff can generate table QR codes without a manual settings toggle.
"""

import frappe
from frappe.utils import cint


def execute():
	settings = frappe.get_single("IMOGI POS Settings")
	changed = False
	if cint(getattr(settings, "enable_table_service", 0)) and not cint(
		getattr(settings, "enable_qr_self_service", 0)
	):
		settings.enable_qr_self_service = 1
		changed = True
	if changed:
		settings.save(ignore_permissions=True)
		frappe.db.commit()
	frappe.clear_cache()
