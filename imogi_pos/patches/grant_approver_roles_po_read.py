# Copyright (c) 2026, Imogi and contributors
"""Grant Purchase Order/Material Request read to IMOGI Manager, IMOGI Finance,
and IMOGI POS Approval Request read to Inventory/Manager/Finance — all valid
approver roles in the PO approval hierarchy tiers, but previously missing the
base DocPerm needed to even open/view a Purchase Order they're approving."""

from imogi_pos.install import ensure_imogi_role_permissions


def execute():
	ensure_imogi_role_permissions()
