# Copyright (c) 2026, Imogi and contributors
"""IMOGI Purchasing never had read access to Item Tax Template or Accounts
Settings — two base ERPNext doctypes the standard Purchase User/Manager roles
get by default, which our custom role never inherited. Without them, the
"Pilih Tax" multi-tax dialog on Purchase Order items throws 'No permission
for Item Tax Template', and just opening a fresh Purchase Order form throws
'No permission for Accounts Settings' (core buying/transaction JS reads it
on load). Grant both missing DocPerms."""

from imogi_pos.install import ensure_imogi_role_permissions


def execute():
	ensure_imogi_role_permissions()
