# Copyright (c) 2026, Imogi and contributors
"""Ensure WhatsApp receipt settings fields exist with safe defaults."""

import frappe

from imogi_pos.imogi_pos.utils.receipt_branding import DEFAULT_WHATSAPP_RECEIPT_MESSAGE


def execute():
	frappe.reload_doc("imogi_pos", "doctype", "imogi_pos_settings")
	settings = frappe.get_single("IMOGI POS Settings")
	changed = False

	if not hasattr(settings, "auto_print_receipt_on_success"):
		return

	if settings.get("auto_print_receipt_on_success") is None:
		settings.auto_print_receipt_on_success = 0
		changed = True
	if settings.get("enable_whatsapp_receipt") is None:
		settings.enable_whatsapp_receipt = 0
		changed = True
	if not (settings.get("whatsapp_receipt_message") or "").strip():
		settings.whatsapp_receipt_message = DEFAULT_WHATSAPP_RECEIPT_MESSAGE
		changed = True

	if changed:
		settings.save(ignore_permissions=True)
	frappe.db.commit()
	frappe.clear_cache()
