# Copyright (c) 2026, Imogi and contributors
"""Re-sync setup wizard child table DocTypes (migrate may drop them as orphaned)."""

import frappe


def execute():
	for doctype in (
		"imogi_pos_setup_cashier_line",
		"imogi_pos_setup_product_line",
		"imogi_pos_setup_supplier_line",
		"imogi_pos_setup_payment_line",
	):
		frappe.reload_doc("imogi_pos", "doctype", doctype)
