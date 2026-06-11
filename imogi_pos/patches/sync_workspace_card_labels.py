# Copyright (c) 2026, Imogi and contributors
"""Resync Imogi POS workspace content/links after catalog card label changes."""

import frappe

from imogi_pos.imogi_pos.utils.flow import get_settings
from imogi_pos.imogi_pos.utils.workspace import sync_workspaces


def execute():
	settings = get_settings()
	business_type = settings.business_type if settings.setup_complete else None
	sync_workspaces(business_type)
	frappe.clear_cache()
