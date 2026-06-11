# Copyright (c) 2026, Imogi and contributors
"""Consolidate dashboard workspace links + enable deep-link focus metadata."""

import frappe

from imogi_pos.imogi_pos.utils.flow import get_settings
from imogi_pos.imogi_pos.utils.workspace import sync_workspaces


def execute():
	if not frappe.db.exists("DocType", "IMOGI POS Settings"):
		return

	settings = get_settings()
	sync_workspaces(settings.business_type if settings.setup_complete else None)
