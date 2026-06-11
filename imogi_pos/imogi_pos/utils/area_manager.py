# Copyright (c) 2026, Imogi and contributors
"""IMOGI Area Manager — outlet assignment and branch scope."""

from __future__ import annotations

import frappe
from frappe.utils import cint

AREA_MANAGER_ROLE = "IMOGI Area Manager"
ASSIGNMENT_DOCTYPE = "IMOGI Area Manager Assignment"


def user_is_area_manager(user: str | None = None) -> bool:
	user = user or frappe.session.user
	return bool(user and user != "Guest" and AREA_MANAGER_ROLE in frappe.get_roles(user))


def get_assignment_doc(user: str | None = None):
	user = user or frappe.session.user
	if not user or user == "Guest":
		return None
	if not frappe.db.exists(ASSIGNMENT_DOCTYPE, user):
		return None
	doc = frappe.get_doc(ASSIGNMENT_DOCTYPE, user)
	if not cint(doc.is_active):
		return None
	return doc


def get_assigned_branch_codes(user: str | None = None) -> list[str]:
	doc = get_assignment_doc(user)
	if not doc:
		return []
	return [row.branch for row in doc.assigned_branches or [] if row.branch]


def get_assigned_branch_context(user: str | None = None) -> dict:
	doc = get_assignment_doc(user)
	if not doc:
		return {
			"is_area_manager": user_is_area_manager(user),
			"area_label": "",
			"branches": [],
		}
	return {
		"is_area_manager": True,
		"area_label": doc.area_label or "",
		"branches": get_assigned_branch_codes(user),
	}


def user_can_access_branch(branch_code: str | None, user: str | None = None) -> bool:
	user = user or frappe.session.user
	if not branch_code or not user_is_area_manager(user):
		return True
	assigned = set(get_assigned_branch_codes(user))
	if not assigned:
		return False
	return branch_code in assigned


def assignment_permission_query(user: str) -> str:
	if not user or user == "Guest":
		return "1=0"
	roles = set(frappe.get_roles(user))
	if roles & {"Administrator", "System Manager", "IMOGI Owner", "Sales Manager"}:
		return ""
	if AREA_MANAGER_ROLE in roles:
		return f"`tab{ASSIGNMENT_DOCTYPE}`.`user` = {frappe.db.escape(user)}"
	return "1=0"
