# Copyright (c) 2026, Imogi and contributors
"""Full smoke test: Kitchen + Table Service + QR guest."""

from __future__ import annotations

import os

import frappe
from frappe.utils import cint

from imogi_pos.imogi_pos.utils.feature_gating import is_feature_operational
from imogi_pos.imogi_pos.utils.flow import get_settings
from imogi_pos.imogi_pos.utils.qr_table_order import build_table_qr_url, is_qr_self_service_enabled

from imogi_pos.scripts.smoke_kitchen_features import KITCHEN_FEATURES, execute as kitchen_execute


PAGE_FOLDER_MAP = {
	"kitchen-display": "kitchen_display",
	"kitchen-order": "kitchen_order",
	"kitchen-station": "kitchen_station",
	"table-service": "table_service",
}


def _page_assets(page_name: str) -> dict:
	folder = PAGE_FOLDER_MAP.get(page_name, page_name.replace("-", "_"))
	base = frappe.get_app_path("imogi_pos", "imogi_pos", "page", folder)
	if not os.path.isdir(base):
		base = frappe.get_app_path("imogi_pos", "imogi_pos", "page", page_name)
		folder = page_name
	return {
		"folder": folder,
		"js_exists": os.path.isfile(os.path.join(base, f"{folder}.js")),
		"json_exists": os.path.isfile(os.path.join(base, f"{folder}.json")),
		"page_exists": bool(frappe.db.exists("Page", page_name)),
	}


def execute():
	report = {"kitchen": kitchen_execute(), "table_service": {}, "qr_self_service": {}, "routes": {}}

	settings = get_settings()
	frappe.set_user("Administrator")

	# Table Service
	try:
		from imogi_pos.api.table_api import get_table_service_board

		board = get_table_service_board()
		report["table_service"] = {
			"operational": is_feature_operational("table_management", settings),
			"settings_on": cint(settings.enable_table_service),
			"tables": len(board.get("tables") or []),
			"floors": len(board.get("floors") or []),
			"features": board.get("features") or {},
			"page_assets": _page_assets("table_service"),
			"page_exists": bool(frappe.db.exists("Page", "table-service")),
		}
	except Exception as exc:
		report["table_service"] = {"ok": False, "error": str(exc)}

	# QR Self-Service
	try:
		table = "TS-01" if frappe.db.exists("IMOGI Restaurant Table", "TS-01") else None
		url = build_table_qr_url(table) if table else None
		report["qr_self_service"] = {
			"operational": is_qr_self_service_enabled(settings),
			"settings_on": cint(getattr(settings, "enable_qr_self_service", 0)),
			"settings_table_service": cint(settings.enable_table_service),
			"payment_mode": getattr(settings, "qr_self_service_payment_mode", None) or "Cash",
			"sample_table": table,
			"sample_url": url,
			"url_has_bad_port": bool(url and ":8003" in url),
			"guest_page_assets": _page_assets("table-order"),
		}
		if table and report["qr_self_service"]["operational"]:
			from imogi_pos.api.qr_order_api import get_qr_menu_board
			from imogi_pos.imogi_pos.utils.qr_table_order import sign_table_token

			token = sign_table_token(table)
			board = get_qr_menu_board(table=table, token=token)
			report["qr_self_service"]["menu_items"] = len((board.get("catalog") or {}).get("items") or [])
			report["qr_self_service"]["can_order"] = (board.get("table") or {}).get("can_order")
	except Exception as exc:
		report["qr_self_service"] = {"ok": False, "error": str(exc)}

	# Fix kitchen page asset paths in report
	for row in report["kitchen"].get("features") or []:
		if row.get("kind") == "page" and row.get("target"):
			assets = _page_assets(row["target"])
			row["js_exists"] = assets["js_exists"]
			row["json_exists"] = assets["json_exists"]
			row["asset_folder"] = assets["folder"]

	report["host_name"] = frappe.conf.host_name
	report["summary"] = _summarize(report)
	return report


def _summarize(report: dict) -> dict:
	k = report.get("kitchen") or {}
	ts = report.get("table_service") or {}
	qr = report.get("qr_self_service") or {}

	kitchen_ok = sum(
		1 for f in (k.get("features") or []) if f.get("operational") or f.get("id") == "kitchen_printer"
	)
	kitchen_fail = []
	for f in k.get("features") or []:
		if f.get("id") == "kitchen_printer" and not f.get("operational"):
			kitchen_fail.append("kitchen_printer (toggle OFF)")
		elif f.get("kind") == "page" and not f.get("js_exists"):
			kitchen_fail.append(f"{f['label']} (assets missing)")
		elif not f.get("operational") and f.get("id") != "kitchen_printer":
			kitchen_fail.append(f"{f['label']} (not operational)")

	apis = k.get("apis") or {}
	api_fail = [name for name, data in apis.items() if isinstance(data, dict) and not data.get("ok")]

	return {
		"kitchen_features_operational": k.get("enable_kitchen_display") == 1,
		"kitchen_queue_empty": (apis.get("get_kitchen_queue") or {}).get("count") == 0,
		"kitchen_orders_total": (k.get("counts") or {}).get("kitchen_orders", 0),
		"table_service_ok": ts.get("operational") and ts.get("settings_on"),
		"qr_ok": qr.get("operational") and not qr.get("url_has_bad_port"),
		"issues": kitchen_fail + api_fail
		+ (["QR URL still has :8003"] if qr.get("url_has_bad_port") else [])
		+ (["QR not operational"] if not qr.get("operational") else [])
		+ (["Table Service off"] if not ts.get("operational") else []),
	}
