# Copyright (c) 2026, Imogi and contributors
"""Bootstrap default IMOGI Branch records and permissions."""

from imogi_pos.imogi_pos.utils.branch import ensure_default_branch
from imogi_pos.install import ensure_imogi_role_permissions


def execute():
	ensure_imogi_role_permissions()
	ensure_default_branch()
