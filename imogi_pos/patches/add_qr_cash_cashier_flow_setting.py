# Copyright (c) 2026, Imogi and contributors
"""Default QR Cash → Kasir flow setting."""

import frappe

from imogi_pos.imogi_pos.utils.qr_table_order import QR_CASH_FLOW_KITCHEN_FIRST


def execute():
	frappe.reload_doc("imogi_pos", "doctype", "imogi_pos_settings")
	settings = frappe.get_single("IMOGI POS Settings")
	if not (getattr(settings, "qr_cash_cashier_flow", None) or "").strip():
		settings.qr_cash_cashier_flow = QR_CASH_FLOW_KITCHEN_FIRST
		settings.save(ignore_permissions=True)
	frappe.db.commit()
	frappe.clear_cache()
