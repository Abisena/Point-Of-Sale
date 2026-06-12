# Copyright (c) 2026, Imogi and contributors
"""IMOGI Inventory / Purchasing / Finance roles, DocType perms, ERPNext report access."""

import frappe

from imogi_pos.imogi_pos.utils.role_permissions import INTEGRATION_REPORT_ROLES


def _grant_report_roles(report_name: str, roles: tuple[str, ...]):
	if not frappe.db.exists("Report", report_name):
		return
	doc = frappe.get_doc("Report", report_name)
	existing = {row.role for row in doc.roles}
	changed = False
	for role in roles:
		if role not in existing:
			doc.append("roles", {"role": role})
			changed = True
	if changed:
		doc.save(ignore_permissions=True)


def execute():
	from imogi_pos.install import ensure_imogi_role_permissions
	from imogi_pos.imogi_pos.utils.workspace import sync_workspaces

	ensure_imogi_role_permissions()
	for report_name, roles in INTEGRATION_REPORT_ROLES.items():
		_grant_report_roles(report_name, roles)
	sync_workspaces()
	frappe.db.commit()
	frappe.clear_cache()
