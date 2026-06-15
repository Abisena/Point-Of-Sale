# Copyright (c) 2026, Imogi and contributors
"""Hide kitchen/fulfillment for UMKM sites and align settings toggles."""

import frappe

from imogi_pos.imogi_pos.utils.business_profile import BUSINESS_UMKM


def execute():
	settings = frappe.get_single("IMOGI POS Settings")
	if settings.business_type == BUSINESS_UMKM:
		changed = False
		if settings.enable_kitchen_display:
			settings.enable_kitchen_display = 0
			changed = True
		if settings.enable_fulfillment:
			settings.enable_fulfillment = 0
			changed = True
		if changed:
			settings.save(ignore_permissions=True)

	from imogi_pos.imogi_pos.utils.workspace import sync_workspaces

	sync_workspaces(settings.business_type)
	frappe.db.commit()
	frappe.clear_cache()
