# Copyright (c) 2026, Imogi and contributors
"""Set master selling price list from default POS profile."""

import frappe

from imogi_pos.imogi_pos.utils.flow import get_settings


def execute():
	settings = get_settings()
	if settings.get("master_selling_price_list"):
		return

	pos_profile = settings.default_pos_profile
	if not pos_profile:
		return

	price_list = frappe.db.get_value("POS Profile", pos_profile, "selling_price_list")
	if not price_list:
		return

	frappe.db.set_single_value("IMOGI POS Settings", "master_selling_price_list", price_list)
	if not frappe.db.get_single_value("IMOGI POS Settings", "sync_prices_to_branches_on_import"):
		frappe.db.set_single_value("IMOGI POS Settings", "sync_prices_to_branches_on_import", 1)
