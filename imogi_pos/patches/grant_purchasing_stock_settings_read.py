# Copyright (c) 2026, Imogi and contributors
"""Grant Stock Settings read to IMOGI Purchasing/Area Manager — ERPNext's
transaction.js checks Stock Settings (batch/serial dialog) on every item row
in Purchase Order, so without this the form throws PermissionError for
purchasing staff editing a plain draft PO."""

from imogi_pos.install import ensure_imogi_role_permissions


def execute():
	ensure_imogi_role_permissions()
