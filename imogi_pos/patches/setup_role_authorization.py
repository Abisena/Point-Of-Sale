# Copyright (c) 2026, Imogi and contributors
"""Seed role authorization defaults and sync optional desk permissions."""

import frappe

from imogi_pos.imogi_pos.utils.role_authorization import (
	ensure_default_role_authorizations,
	sync_role_authorization_permissions,
)


def execute():
	settings = frappe.get_single("IMOGI POS Settings")
	if not frappe.utils.cint(getattr(settings, "enable_role_authorization", 0)):
		settings.enable_role_authorization = 1

	ensure_default_role_authorizations(settings)
	settings.flags.ignore_validate = True
	settings.save(ignore_permissions=True)
	sync_role_authorization_permissions(settings)
	frappe.db.commit()
