# Copyright (c) 2026, Imogi and contributors
"""Grant Material Request (Purchase Request) permissions to IMOGI Inventory
on existing sites — Inventory raises the request, Purchasing still owns the
Purchase Order / supplier decision."""

from imogi_pos.install import ensure_imogi_role_permissions


def execute():
	ensure_imogi_role_permissions()
