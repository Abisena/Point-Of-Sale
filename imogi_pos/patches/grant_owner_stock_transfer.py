# Copyright (c) 2026, Imogi and contributors
"""Owner/Area Manager: Stock Entry + Item read for inter-branch stock transfer."""

import frappe

from imogi_pos.install import ensure_imogi_role_permissions


def execute():
	ensure_imogi_role_permissions()
	frappe.db.commit()
	frappe.clear_cache()
