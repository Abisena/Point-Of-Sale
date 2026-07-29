# Copyright (c) 2026, Imogi and contributors
"""Refresh QR ready WhatsApp template when still on legacy default."""

import frappe

from imogi_pos.imogi_pos.utils.qr_table_order import DEFAULT_QR_ORDER_COMPLETE_MESSAGE

LEGACY_COMPLETE_TEMPLATE = (
	"Terima kasih sudah makan di {store_name}!\n\n"
	"Pesanan *{order_name}* · Meja *{table_number}* sudah selesai.\n"
	"Total: {total}"
)


def execute():
	frappe.reload_doc("imogi_pos", "doctype", "imogi_pos_settings")
	settings = frappe.get_single("IMOGI POS Settings")
	current = (settings.get("whatsapp_qr_order_complete_message") or "").strip()
	if current in ("", LEGACY_COMPLETE_TEMPLATE):
		settings.whatsapp_qr_order_complete_message = DEFAULT_QR_ORDER_COMPLETE_MESSAGE
		settings.save(ignore_permissions=True)
	frappe.db.commit()
	frappe.clear_cache()
