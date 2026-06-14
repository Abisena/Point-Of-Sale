# Copyright (c) 2026, Imogi and contributors
"""Demo / test users per IMOGI role (Owner, Manager, Cashier excluded — provision separately)."""

from __future__ import annotations

import frappe

DEFAULT_PASSWORD = "imogi123"

# email, frappe_role, display_name
DEMO_ROLE_USERS: tuple[tuple[str, str, str], ...] = (
	("inventory@gmail.com", "IMOGI Inventory", "Inventory Demo"),
	("purchasing@gmail.com", "IMOGI Purchasing", "Purchasing Demo"),
	("finance@gmail.com", "IMOGI Finance", "Finance Demo"),
	("areamanager@gmail.com", "IMOGI Area Manager", "Area Manager Demo"),
	("waiter@gmail.com", "IMOGI Waiter", "Waiter Demo"),
	("supervisor@gmail.com", "IMOGI Supervisor", "Supervisor Demo"),
	("chef@gmail.com", "IMOGI Chef", "Chef Demo"),
	("kitchen@gmail.com", "IMOGI Kitchen Staff", "Kitchen Staff Demo"),
	("fulfillment@gmail.com", "IMOGI Fulfillment Staff", "Fulfillment Demo"),
	("rider@gmail.com", "IMOGI Rider", "Rider Demo"),
	("auditor@gmail.com", "IMOGI Auditor", "Auditor Demo"),
)


def ensure_demo_user(email: str, role: str, full_name: str) -> str:
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


def ensure_demo_role_users() -> list[str]:
	from imogi_pos.install import ensure_imogi_role_permissions

	ensure_imogi_role_permissions()
	created = []
	for email, role, name in DEMO_ROLE_USERS:
		created.append(ensure_demo_user(email, role, name))
	frappe.db.commit()
	frappe.clear_cache()
	return created
