# Copyright (c) 2026, Imogi and contributors
"""Allow IMOGI Owner to provision branches (DocType perms + role sync)."""

import frappe

from imogi_pos.install import ensure_imogi_role_permissions


def execute():
	ensure_imogi_role_permissions()
	frappe.db.commit()
	frappe.clear_cache()
