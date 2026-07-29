# Copyright (c) 2026, Imogi and contributors
"""Turn off fulfillment toggle — QC is handled in kitchen (KDS) for now."""

import frappe


def execute():
	settings = frappe.get_single("IMOGI POS Settings")
	if settings.enable_fulfillment:
		settings.enable_fulfillment = 0
		settings.save(ignore_permissions=True)

	from imogi_pos.imogi_pos.utils.workspace import sync_workspaces

	sync_workspaces(settings.business_type)
	frappe.db.commit()
	frappe.clear_cache()
