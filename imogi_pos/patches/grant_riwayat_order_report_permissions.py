# Copyright (c) 2026, Imogi and contributors
"""Grant report permission on Riwayat Order for Owner / finance / area reports."""

import frappe

from imogi_pos.install import ensure_imogi_role_permissions


def execute():
	ensure_imogi_role_permissions()
	frappe.db.commit()
	frappe.clear_cache()
