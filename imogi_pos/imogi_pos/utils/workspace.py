# Copyright (c) 2026, Imogi and contributors

import json

import frappe
from frappe.modules.import_file import import_file_by_path

from imogi_pos.imogi_pos.utils.business_profile import BUSINESS_RESTAURANT, BUSINESS_UMKM
from imogi_pos.imogi_pos.utils.flow import get_settings
from imogi_pos.imogi_pos.utils.workspace_catalog import build_workspace_profile

WORKSPACE_NAME = "Imogi POS"
WORKSPACE_ROUTE = "imogi-pos"
WORKSPACE_UMKM_LEGACY = "Imogi POS UMKM"


def get_workspace_route(business_type=None):
	return WORKSPACE_ROUTE


def _workspace_json_path(folder):
	return frappe.get_app_path("imogi_pos", "imogi_pos", "workspace", folder, f"{folder}.json")


def _load_workspace_json(folder):
	with open(_workspace_json_path(folder)) as handle:
		return json.load(handle)


def import_workspaces():
	path = _workspace_json_path("imogi_pos")
	import_file_by_path(path, force=True, ignore_version=True)


def sync_workspaces(business_type=None):
	"""Apply one Imogi POS workspace; content changes by business profile."""
	business_type = business_type or get_settings().business_type or BUSINESS_RESTAURANT
	variant = "umkm" if business_type == BUSINESS_UMKM else "restaurant"
	profile = build_workspace_profile(variant=variant)

	import_workspaces()
	_apply_profile_to_workspace(profile)
	_remove_legacy_umkm_workspace()
	frappe.clear_cache()


def _apply_profile_to_workspace(profile):
	ws = frappe.get_doc("Workspace", WORKSPACE_NAME)
	ws.title = "Imogi POS"
	ws.label = "Imogi POS"
	ws.icon = profile.get("icon") or "retail"
	ws.is_hidden = 0
	ws.public = 1
	ws.content = profile.get("content") or ws.content

	ws.links = []
	for row in profile.get("links", []):
		ws.append("links", _child_row(row))

	ws.shortcuts = []
	for row in profile.get("shortcuts", []):
		ws.append("shortcuts", _child_row(row))

	ws.flags.ignore_links = True
	ws.save(ignore_permissions=True)


def _child_row(row):
	return {key: value for key, value in row.items() if key not in ("doctype", "name", "parent", "parentfield", "parenttype")}


def _remove_legacy_umkm_workspace():
	if frappe.db.exists("Workspace", WORKSPACE_UMKM_LEGACY):
		frappe.delete_doc("Workspace", WORKSPACE_UMKM_LEGACY, force=True, ignore_permissions=True)
