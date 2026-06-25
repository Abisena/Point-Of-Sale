# Copyright (c) 2026, Imogi and contributors
"""Add Fonnte WhatsApp auto-send settings fields."""

import frappe


def execute():
	if not frappe.db.exists("DocType", "IMOGI POS Settings"):
		return

	settings = frappe.get_single("IMOGI POS Settings")
	changed = False
	if not (settings.get("whatsapp_api_provider") or "").strip():
		settings.whatsapp_api_provider = "Manual"
		changed = True
	if changed:
		settings.flags.ignore_permissions = True
		settings.save(ignore_permissions=True)
		frappe.db.commit()
