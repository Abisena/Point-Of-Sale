# Copyright (c) 2026, Imogi and contributors
"""Grant Customer/Contact permissions to IMOGI Cashier on existing sites."""

from imogi_pos.install import ensure_imogi_role_permissions


def execute():
	ensure_imogi_role_permissions()
