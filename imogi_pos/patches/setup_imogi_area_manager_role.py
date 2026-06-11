# Copyright (c) 2026, Imogi and contributors

import frappe

from imogi_pos.install import ensure_imogi_role_permissions
from imogi_pos.imogi_pos.utils.flow import get_settings
from imogi_pos.imogi_pos.utils.workspace import sync_workspaces


def execute():
	ensure_imogi_role_permissions()

	if not frappe.db.exists("Role", "IMOGI Area Manager"):
		frappe.get_doc(
			{"doctype": "Role", "role_name": "IMOGI Area Manager", "desk_access": 1}
		).insert(ignore_permissions=True)

	frappe.db.set_value("Role", "IMOGI Area Manager", "home_page", "imogi-pos-dashboard")

	for page_name, roles in {
		"imogi-pos-dashboard": ["IMOGI Manager", "IMOGI Area Manager"],
		"imogi-pos-add-branch": ["IMOGI Owner", "IMOGI Area Manager"],
	}.items():
		if not frappe.db.exists("Page", page_name):
			continue
		page = frappe.get_doc("Page", page_name)
		existing = {row.role for row in page.roles or []}
		changed = False
		for role in roles:
			if role not in existing:
				page.append("roles", {"role": role})
				changed = True
		if changed:
			page.save(ignore_permissions=True)

	from imogi_pos.imogi_pos.utils import workspace_tier_gating as gating

	gating._WORKSPACE_LINK_LABEL_FEATURES = None

	settings = get_settings()
	if settings.setup_complete and settings.business_type:
		sync_workspaces(settings.business_type)
	else:
		sync_workspaces()

	frappe.clear_cache()
