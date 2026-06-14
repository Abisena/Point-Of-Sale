# Copyright (c) 2026, Imogi and contributors
"""Demo users for all IMOGI roles except Owner / Manager / Cashier."""

import frappe

from imogi_pos.imogi_pos.utils.demo_users import ensure_demo_role_users


def execute():
	ensure_demo_role_users()
