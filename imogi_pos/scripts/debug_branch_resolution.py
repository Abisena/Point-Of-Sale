# Copyright (c) 2026, Imogi and contributors

from __future__ import annotations

import frappe

from imogi_pos.api.cashier import _get_pos_opening, _resolve_cashier_branch
from imogi_pos.imogi_pos.utils.branch import (
	get_accessible_branches,
	get_user_default_branch_code,
	set_user_default_branch_code,
)


def reset_user_default(user="gunawan@gmail.com", branch_code="IMOGI-UMKM-POS"):
	frappe.set_user(user)
	set_user_default_branch_code(branch_code, user)
	frappe.db.commit()
	return {"user": user, "branch_code": branch_code}


def run(user="gunawan@gmail.com"):
	frappe.set_user(user)
	print(f"user={user}")
	print("user_default_branch:", get_user_default_branch_code(user))
	for b in get_accessible_branches(user):
		print(
			f"  branch={b['branch_code']} name={b['branch_name']} "
			f"is_default={b.get('is_default')} pos_profile={b.get('pos_profile')}"
		)
	opening = _get_pos_opening(user)
	print("pos_opening:", opening)
	ctx = _resolve_cashier_branch()
	print(
		"resolved:",
		ctx.get("branch_code"),
		ctx.get("branch_name"),
		ctx.get("warehouse"),
		ctx.get("pos_profile"),
	)
	return ctx
