"""Allow IMOGI Cashier to cancel (void) own Awaiting Payment orders from Kasir."""

import frappe

from imogi_pos.install import ensure_imogi_role_permissions


def execute():
	ensure_imogi_role_permissions()
	frappe.clear_cache(doctype="Riwayat Order")
