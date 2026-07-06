# Copyright (c) 2026, Imogi and contributors
"""Smoke test Kitchen section features from feature registry."""

from __future__ import annotations

import os

import frappe
from frappe.utils import cint

from imogi_pos.imogi_pos.utils.feature_gating import is_feature_in_plan, is_feature_operational
from imogi_pos.imogi_pos.utils.flow import get_settings


KITCHEN_FEATURES = [
	("kitchen_display", "Kitchen Display System", "page", "kitchen-display"),
	("kitchen_queue", "Kitchen Queue", "page", "kitchen-order"),
	("cooking_status", "Status Cooking", "api", "update_kitchen_status"),
	("kitchen_printer", "Kitchen Printer", "setting", "enable_kitchen_printer"),
	("kitchen_station", "Kitchen Station", "page", "kitchen-station"),
	("bar_station", "Bar Station", "capability", "station_type=Bar"),
	("bump_screen", "Bump Screen", "api", "complete_kitchen_from_display"),
	("kitchen_performance", "Kitchen Performance", "dashboard", "kitchen_performance"),
]


def _page_assets(page_name: str) -> dict:
	base = frappe.get_app_path("imogi_pos", "imogi_pos", "page", page_name)
	return {
		"page_exists": bool(frappe.db.exists("Page", page_name)),
		"js_exists": os.path.isfile(os.path.join(base, f"{page_name}.js")),
		"json_exists": os.path.isfile(os.path.join(base, f"{page_name}.json")),
	}


def execute():
	settings = get_settings()
	tier = settings.subscription_tier or "Free"
	report = {
		"tier": tier,
		"enable_kitchen_display": cint(settings.enable_kitchen_display),
		"enable_kitchen_printer": cint(getattr(settings, "enable_kitchen_printer", 0)),
		"features": [],
		"apis": {},
		"counts": {
			"kitchen_orders": frappe.db.count("IMOGI Kitchen Order", {"docstatus": ["<", 2]}),
			"kitchen_stations": frappe.db.count("IMOGI Kitchen Station"),
			"bar_stations": frappe.db.count("IMOGI Kitchen Station", {"station_type": "Bar"}),
		},
	}

	for fid, label, kind, target in KITCHEN_FEATURES:
		row = {
			"id": fid,
			"label": label,
			"kind": kind,
			"target": target,
			"in_plan": is_feature_in_plan(fid, tier),
			"operational": is_feature_operational(fid, settings),
		}
		if kind == "page":
			row.update(_page_assets(target))
		if fid == "kitchen_printer":
			row["setting_on"] = cint(getattr(settings, "enable_kitchen_printer", 0))
		report["features"].append(row)

	frappe.set_user("Administrator")
	try:
		from imogi_pos.api.kitchen import (
			get_kitchen_order_status_counts,
			get_kitchen_queue,
			list_kitchen_orders,
			list_kitchen_stations,
		)

		report["apis"]["get_kitchen_queue"] = {"ok": True, "count": len(get_kitchen_queue())}
		report["apis"]["get_kitchen_queue_bar"] = {"ok": True, "count": len(get_kitchen_queue(station_type="Bar"))}
		report["apis"]["list_kitchen_orders"] = {"ok": True, "count": len(list_kitchen_orders())}
		report["apis"]["get_kitchen_order_status_counts"] = {
			"ok": True,
			"data": get_kitchen_order_status_counts(),
		}
		report["apis"]["list_kitchen_stations"] = {"ok": True, "count": len(list_kitchen_stations())}
	except Exception as exc:
		report["apis"]["kitchen_error"] = str(exc)

	try:
		from imogi_pos.api.planned_features_api import get_kitchen_performance_api

		perf = get_kitchen_performance_api()
		report["apis"]["get_kitchen_performance_api"] = {
			"ok": True,
			"rows": len(perf.get("rows", [])),
		}
	except Exception as exc:
		report["apis"]["get_kitchen_performance_api"] = {"ok": False, "error": str(exc)}

	try:
		from imogi_pos.imogi_pos.utils.planned_features import print_kitchen_ticket

		ko = frappe.db.get_value("IMOGI Kitchen Order", {}, "name")
		report["apis"]["print_kitchen_ticket"] = {
			"ok": True,
			"callable": callable(print_kitchen_ticket),
			"sample_order": ko,
			"skipped_run": True,
		}
	except Exception as exc:
		report["apis"]["print_kitchen_ticket"] = {"ok": False, "error": str(exc)}

	# Workspace / tier bridge routes
	try:
		from imogi_pos.imogi_pos.utils.feature_workspace_bridge import FEATURE_WORKSPACE_LINKS

		report["workspace_links"] = {
			k: v for k, v in FEATURE_WORKSPACE_LINKS.items() if k.startswith("kitchen")
		}
	except Exception as exc:
		report["workspace_links_error"] = str(exc)

	return report


def execute_with_kds_on():
	"""Temporarily enable KDS and re-test queue (does not restore — dev helper)."""
	settings = get_settings()
	settings.enable_kitchen_display = 1
	settings.save(ignore_permissions=True)
	frappe.db.commit()
	frappe.clear_cache()
	return execute()
