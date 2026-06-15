# Copyright (c) 2026, Imogi and contributors
"""Stock Entry forms read Stock Settings — grant Owner read to avoid desk warning."""

import frappe

from imogi_pos.install import ensure_imogi_role_permissions


def execute():
	ensure_imogi_role_permissions()
	frappe.db.commit()
	frappe.clear_cache()
