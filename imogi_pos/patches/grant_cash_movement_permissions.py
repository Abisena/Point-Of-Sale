# Copyright (c) 2026, Imogi and contributors
"""Grant IMOGI POS Cash Movement permissions: Cashier gets full create/submit
access (logs cash in/out during their own shift), Supervisor/Manager/Owner/
Finance get read+report access for reconciliation and the new Shift Closing
Report. Also grants those same roles read access to IMOGI POS Shift Closing
for the same reporting purpose."""

from imogi_pos.install import ensure_imogi_role_permissions


def execute():
	ensure_imogi_role_permissions()
