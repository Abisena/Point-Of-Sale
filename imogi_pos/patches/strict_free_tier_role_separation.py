# Copyright (c) 2026, Imogi and contributors

import frappe

from imogi_pos.install import ensure_imogi_role_permissions
from imogi_pos.patches.setup_free_tier_owner_manager_roles import execute as sync_free_tier_pages


def execute():
	ensure_imogi_role_permissions()
	sync_free_tier_pages()
	frappe.clear_cache()
