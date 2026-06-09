# Copyright (c) 2026, Imogi and contributors

import frappe


def execute():
	from imogi_pos.install import ensure_imogi_role_permissions

	ensure_imogi_role_permissions()
	frappe.db.commit()
