# Copyright (c) 2026, Imogi and contributors
"""Remove tier-based workspace cards; sync role-strict workspace catalog."""

import frappe

from imogi_pos.imogi_pos.utils.workspace import sync_workspaces


def execute():
	sync_workspaces()
	frappe.db.commit()
	frappe.clear_cache()
