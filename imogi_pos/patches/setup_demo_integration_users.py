# Copyright (c) 2026, Imogi and contributors
"""Demo users for IMOGI Inventory / Purchasing / Finance integration roles."""

import frappe

DEMO_USERS = (
	("inventory@gmail.com", "IMOGI Inventory", "Inventory Demo"),
	("purchasing@gmail.com", "IMOGI Purchasing", "Purchasing Demo"),
	("finance@gmail.com", "IMOGI Finance", "Finance Demo"),
)
DEFAULT_PASSWORD = "imogi123"


def _ensure_user(email: str, role: str, full_name: str):
	if frappe.db.exists("User", email):
		user = frappe.get_doc("User", email)
	else:
		user = frappe.get_doc(
			{
				"doctype": "User",
				"email": email,
				"first_name": full_name,
				"send_welcome_email": 0,
				"user_type": "System User",
			}
		)
		user.insert(ignore_permissions=True)

	user.enabled = 1
	user.save(ignore_permissions=True)

	if role not in {r.role for r in user.roles}:
		user.add_roles(role)

	from frappe.utils.password import update_password

	update_password(user=email, pwd=DEFAULT_PASSWORD)
	return email


def execute():
	from imogi_pos.install import ensure_imogi_role_permissions

	ensure_imogi_role_permissions()
	created = []
	for email, role, name in DEMO_USERS:
		created.append(_ensure_user(email, role, name))
	frappe.db.commit()
	frappe.clear_cache()
