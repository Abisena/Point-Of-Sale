# Copyright (c) 2026, Imogi and contributors
"""Create IMOGI Waiter / Supervisor / Chef roles and permissions."""

from imogi_pos.install import ensure_imogi_role_permissions


def execute():
	ensure_imogi_role_permissions()
