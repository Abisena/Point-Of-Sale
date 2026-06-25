# Copyright (c) 2026, Imogi and contributors
"""Per-role optional desk authorizations stored on IMOGI POS Settings."""

from __future__ import annotations

import frappe
from frappe.utils import cint

from imogi_pos.imogi_pos.utils.flow import get_settings
from imogi_pos.imogi_pos.utils.role_authorization_catalog import (
	ROLE_AUTH_GRANTS,
	get_grant_ids_for_feature,
	get_role_auth_grant,
	get_role_auth_grants,
)
from imogi_pos.imogi_pos.utils.role_permissions import get_imogi_role_permissions

PERM_TYPES = (
	"select",
	"read",
	"write",
	"create",
	"delete",
	"submit",
	"cancel",
	"amend",
	"print",
	"email",
	"report",
	"import",
	"export",
	"share",
)


def is_role_authorization_enabled(settings=None) -> bool:
	settings = settings or get_settings()
	return bool(cint(getattr(settings, "enable_role_authorization", 0)))


def _base_role_doctype_perms(role: str, doctype: str) -> dict[str, int]:
	for dt, perms in get_imogi_role_permissions().get(role, []):
		if dt == doctype:
			return {k: cint(v) for k, v in perms.items() if cint(v)}
	return {}


def _merge_perm_dict(*parts: dict[str, int]) -> dict[str, int]:
	merged: dict[str, int] = {}
	for part in parts:
		for ptype, val in part.items():
			if cint(val):
				merged[ptype] = 1
	return merged


def _settings_grant_map(settings) -> dict[tuple[str, str], bool]:
	rows = getattr(settings, "role_authorizations", None) or []
	mapping: dict[tuple[str, str], bool] = {}
	for row in rows:
		role = (getattr(row, "frappe_role", None) or "").strip()
		grant_id = (getattr(row, "grant_id", None) or "").strip()
		if not role or not grant_id:
			continue
		mapping[(role, grant_id)] = bool(cint(getattr(row, "enabled", 0)))
	return mapping


def is_grant_enabled(role: str, grant_id: str, settings=None) -> bool:
	if not is_role_authorization_enabled(settings):
		grant = get_role_auth_grant(grant_id)
		if not grant:
			return False
		return role in grant["default_enabled"]

	settings = settings or get_settings()
	key = ((role or "").strip(), (grant_id or "").strip())
	if key in _settings_grant_map(settings):
		return _settings_grant_map(settings)[key]
	grant = get_role_auth_grant(grant_id)
	if not grant:
		return False
	return role in grant["default_enabled"]


def user_has_grant(user: str | None, grant_id: str, settings=None) -> bool:
	user = user or getattr(frappe.session, "user", None)
	if not user or user == "Guest":
		return False
	for role in frappe.get_roles(user):
		if is_grant_enabled(role, grant_id, settings):
			return True
	return False


def user_has_grant_for_feature(user: str | None, feature_id: str, settings=None) -> bool:
	if not is_role_authorization_enabled(settings):
		return False
	for grant_id in get_grant_ids_for_feature(feature_id):
		if user_has_grant(user, grant_id, settings):
			return True
	return False


def ensure_default_role_authorizations(settings_doc) -> None:
	"""Populate missing child rows using catalog defaults."""
	existing = {
		(
			(getattr(row, "frappe_role", None) or "").strip(),
			(getattr(row, "grant_id", None) or "").strip(),
		)
		for row in (settings_doc.role_authorizations or [])
	}
	for grant in get_role_auth_grants():
		for role in grant["eligible_roles"]:
			key = (role, grant["id"])
			if key in existing:
				continue
			settings_doc.append(
				"role_authorizations",
				{
					"frappe_role": role,
					"grant_id": grant["id"],
					"enabled": 1 if role in grant["default_enabled"] else 0,
				},
			)
			existing.add(key)


def _effective_doctype_perms(role: str, doctype: str, settings) -> dict[str, int]:
	if not (doctype or "").strip():
		return {}
	base = _base_role_doctype_perms(role, doctype)
	if not is_role_authorization_enabled(settings):
		return base

	grant_perms: dict[str, int] = {}
	for grant in get_role_auth_grants():
		if grant["doctype"] != doctype or role not in grant["eligible_roles"]:
			continue
		if is_grant_enabled(role, grant["id"], settings):
			grant_perms = _merge_perm_dict(grant_perms, grant["perms"])
	return _merge_perm_dict(base, grant_perms)


def _apply_role_doctype_perms(role: str, doctype: str, perms: dict[str, int]) -> None:
	from frappe.permissions import add_permission, update_permission_property

	if not frappe.db.exists("Custom DocPerm", {"parent": doctype, "role": role, "permlevel": 0}):
		if not perms:
			return
		add_permission(doctype, role, 0)

	for ptype in PERM_TYPES:
		update_permission_property(
			doctype, role, 0, ptype, cint(perms.get(ptype, 0)), validate=False
		)


def sync_role_authorization_permissions(settings=None) -> None:
	"""Apply merged base + grant permissions to Frappe Custom DocPerm."""
	settings = settings or get_settings()
	seen: set[tuple[str, str]] = set()
	for grant in get_role_auth_grants():
		doctype = (grant.get("doctype") or "").strip()
		if not doctype:
			continue
		for role in grant["eligible_roles"]:
			key = (role, doctype)
			if key in seen:
				continue
			seen.add(key)
			perms = _effective_doctype_perms(role, doctype, settings)
			_apply_role_doctype_perms(role, doctype, perms)

	frappe.clear_cache()
	frappe.cache.delete_key("roles")


def serialize_role_authorization_matrix(settings=None) -> dict:
	settings = settings or get_settings()
	grant_map = _settings_grant_map(settings)
	grants = []
	for grant in get_role_auth_grants():
		roles = []
		for role in grant["eligible_roles"]:
			key = (role, grant["id"])
			enabled = grant_map.get(key, role in grant["default_enabled"])
			roles.append({"role": role, "enabled": bool(enabled)})
		grants.append(
			{
				"id": grant["id"],
				"label": grant["label"],
				"description": grant["description"],
				"feature_id": grant["feature_id"],
				"doctype": grant["doctype"],
				"roles": roles,
			}
		)
	return {
		"enabled": is_role_authorization_enabled(settings),
		"grants": grants,
	}
