# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe.utils import cint

from imogi_pos.imogi_pos.utils.branch import get_branch, resolve_active_branch


def _expand_item_group_rows(item_group_rows):
	from erpnext.accounts.doctype.pos_profile.pos_profile import get_child_nodes, get_permitted_nodes

	item_groups = []
	permitted = get_permitted_nodes("Item Group")
	for row in item_group_rows:
		group = row.item_group if hasattr(row, "item_group") else row.get("item_group")
		if not group:
			continue
		item_groups.extend(
			[
				d.name
				for d in get_child_nodes("Item Group", group)
				if not permitted or d.name in permitted
			]
		)
	return list(set(item_groups))


def get_branch_doc(branch_code=None, pos_profile=None):
	if branch_code:
		return frappe.get_doc("IMOGI Branch", branch_code) if frappe.db.exists("IMOGI Branch", branch_code) else None

	if pos_profile:
		name = frappe.db.get_value("IMOGI Branch", {"pos_profile": pos_profile, "is_active": 1}, "name")
		if name:
			return frappe.get_doc("IMOGI Branch", name)
	return None


def get_item_groups_for_branch(branch_code=None, pos_profile=None):
	"""Allowed item groups for a branch (custom menu or POS Profile default)."""
	from erpnext.accounts.doctype.pos_profile.pos_profile import get_item_groups

	branch_doc = get_branch_doc(branch_code=branch_code, pos_profile=pos_profile)
	if branch_doc and cint(branch_doc.use_custom_menu) and branch_doc.item_groups:
		groups = _expand_item_group_rows(branch_doc.item_groups)
		if groups:
			return groups

	ctx = resolve_active_branch(branch_code=branch_code, pos_profile=pos_profile)
	return get_item_groups(ctx["pos_profile"])


def get_branch_menu_summary(branch_code=None, pos_profile=None):
	"""Metadata for desk/cashier UI."""
	from erpnext.accounts.doctype.pos_profile.pos_profile import get_item_groups

	ctx = resolve_active_branch(branch_code=branch_code, pos_profile=pos_profile)
	branch_doc = get_branch_doc(branch_code=ctx.get("branch_code"), pos_profile=ctx.get("pos_profile"))
	custom = bool(branch_doc and cint(branch_doc.use_custom_menu) and branch_doc.item_groups)
	groups = get_item_groups_for_branch(branch_code=ctx.get("branch_code"), pos_profile=ctx.get("pos_profile"))
	profile_groups = get_item_groups(ctx["pos_profile"]) if ctx.get("pos_profile") else []

	return {
		"menu_mode": "custom" if custom else ("restricted" if profile_groups else "full"),
		"use_custom_menu": custom,
		"item_group_count": len(groups or []),
		"item_groups": groups or [],
		"pos_profile": ctx.get("pos_profile"),
	}
