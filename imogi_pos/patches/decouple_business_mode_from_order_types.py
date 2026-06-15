# Copyright (c) 2026, Imogi and contributors
"""Stop hiding order types / kitchen settings by legacy UMKM business mode."""

import frappe

from imogi_pos.imogi_pos.utils.workspace import sync_workspaces


def execute():
	sync_workspaces()
	frappe.clear_cache()
