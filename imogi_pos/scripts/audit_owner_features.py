# Copyright (c) 2026, Imogi and contributors
"""Full audit: IMOGI Owner vs Owner-matrix features, Frappe perms, workspace links."""

from __future__ import annotations

import frappe
from frappe.boot import get_allowed_pages, get_allowed_reports
from json import dumps

from imogi_pos.imogi_pos.utils.feature_registry import FEATURES, get_subscription_tier, is_feature_operational
from imogi_pos.imogi_pos.utils.feature_workspace_bridge import get_feature_workspace_route
from imogi_pos.imogi_pos.utils.role_gating import (
	get_effective_feature_roles,
	get_user_matrix_roles,
	is_role_allowed_for_feature,
)
from imogi_pos.imogi_pos.utils.workspace_catalog import WORKSPACE_SECTIONS
from imogi_pos.imogi_pos.utils.workspace_tier_gating import (
	_is_frappe_link_permitted,
	is_workspace_item_allowed_for_user,
)


def _find_owner_user() -> str | None:
	for user in frappe.get_all(
		"Has Role", filters={"role": "IMOGI Owner", "parenttype": "User"}, pluck="parent"
	):
		if user not in ("Administrator", "Guest") and frappe.db.get_value("User", user, "enabled"):
			return user
	return None


def run():
	settings = frappe.get_single("IMOGI POS Settings")
	owner = _find_owner_user()
	if not owner:
		print("AUDIT FAILED: no enabled IMOGI Owner user")
		return {"ok": False}

	frappe.set_user(owner)
	tier = get_subscription_tier(settings)
	issues: list[str] = []
	warnings: list[str] = []

	owner_features = [f for f in FEATURES if f["role"] == "Owner"]
	print(f"owner={owner} tier={tier} role_gating={settings.enable_role_gating}")
	print(f"matrix_roles={sorted(get_user_matrix_roles(owner))}")
	print(f"effective_roles={sorted(get_effective_feature_roles(owner))}")
	print()

	# 1) Owner-matrix features: role + operational + route
	print("=== OWNER MATRIX FEATURES (14) ===")
	for f in owner_features:
		fid = f["id"]
		role_ok = is_role_allowed_for_feature(fid, user=owner, settings=settings)
		op = is_feature_operational(fid, settings, tier, user=owner)
		route = (get_feature_workspace_route(fid) or {}).get("route")
		sk = f.get("settings_key")
		sk_val = getattr(settings, sk, None) if sk else None
		status = "OK" if role_ok and op else ("ROLE" if not role_ok else "OFF")
		if not role_ok:
			issues.append(f"feature {fid}: role blocked")
		elif not op and f["status"] == "built":
			warnings.append(f"feature {fid}: not operational (toggle={sk}={sk_val}, min_tier={f['min_tier']})")
		print(
			f"  [{status:4}] {f['label']:28} role_ok={role_ok} operational={op} "
			f"tier>={f['min_tier']} route={route}"
		)

	# 2) Required pages for Owner
	print("\n=== OWNER PAGES (Frappe Page role) ===")
	required_pages = {
		"imogi-pos-dashboard",
		"imogi-pos-sales-report",
		"imogi-pos-feature-matrix",
		"imogi-pos-add-branch",
	}
	allowed_pages = get_allowed_pages(cache=False)
	for page in sorted(required_pages):
		ok = page in allowed_pages
		doc = frappe.get_doc("Page", page) if frappe.db.exists("Page", page) else None
		page_roles = sorted({r.role for r in doc.roles}) if doc else []
		if not ok:
			issues.append(f"page {page}: not in allowed_pages")
		print(f"  [{'OK' if ok else 'FAIL'}] {page} roles={page_roles}")

	# Pages Owner should NOT have (security)
	forbidden_pages = {
		"imogi-pos-cashier",
		"imogi-pos-menu",
		"imogi-pos-menu-category",
		"imogi-pos-order-history",
		"imogi-pos-setup",
	}
	print("\n=== PAGES OWNER SHOULD NOT OPEN ===")
	for page in sorted(forbidden_pages):
		ok = page not in allowed_pages
		if not ok:
			warnings.append(f"page {page}: Owner has access (may be too broad via inheritance display)")
		print(f"  [{'OK' if ok else 'WARN'}] {page} blocked={ok}")

	# 3) DocTypes
	print("\n=== OWNER DOCTYPES ===")
	doctypes = {
		"IMOGI POS Settings": ("read", True),
		"IMOGI POS Settings": ("write", True),
		"Riwayat Order": ("read", True),
		"POS Invoice": ("read", True),
		"Sales Invoice": ("read", True),
		"IMOGI Branch": ("read", True),
		"IMOGI Area Manager Assignment": ("read", True),
		"IMOGI Area Manager Assignment": ("write", True),
		"Item": ("read", False),
		"Material Request": ("read", True),
		"Purchase Order": ("read", True),
	}
	checked = set()
	for dt, (ptype, should) in doctypes.items():
		key = (dt, ptype)
		if key in checked:
			continue
		checked.add(key)
		has = frappe.has_permission(dt, ptype, user=owner)
		if has != should:
			issues.append(f"doctype {dt} {ptype}={has}, expected {should}")
		print(f"  [{'OK' if has == should else 'FAIL'}] {dt} {ptype}={has} (expect {should})")

	# 4) Reports
	print("\n=== OWNER REPORTS ===")
	required_reports = {
		"IMOGI UMKM Daily Sales",
		"IMOGI POS Order Summary",
		"IMOGI Branch Sales Summary",
	}
	allowed_reports = get_allowed_reports(cache=False)
	for report in sorted(required_reports):
		ok = report in allowed_reports
		if not ok:
			issues.append(f"report {report}: not allowed")
		print(f"  [{'OK' if ok else 'FAIL'}] {report}")

	# 5) APIs
	print("\n=== OWNER APIs ===")
	api_checks = [
		("imogi_pos.api.dashboard.get_dashboard_metrics", []),
		("imogi_pos.api.feature_api.get_feature_matrix", []),
		("imogi_pos.api.free_tier_api.get_sales_report_limits", []),
		("imogi_pos.api.branch_provisioning_api.get_branch_provisioning_context", []),
		("imogi_pos.api.free_tier_api.list_menu_items", []),
		("imogi_pos.api.cashier.get_cashier_context", []),
	]
	for method, args in api_checks:
		try:
			frappe.get_attr(method)(*args)
			result = "OK"
			if "list_menu_items" in method:
				issues.append("api list_menu_items: Owner should not access menu API")
				result = "LEAK"
		except Exception as exc:
			result = f"BLOCKED {type(exc).__name__}"
			expect_ok = "get_cashier_context" not in method
			if expect_ok and "list_menu_items" not in method:
				issues.append(f"api {method}: {exc}")
		print(f"  [{result}] {method}")

	# 6) Workspace links visible to Owner
	print("\n=== WORKSPACE LINKS FOR OWNER ===")
	visible_owner_links = []
	broken_visible = []
	for section in WORKSPACE_SECTIONS:
		for link in section.get("links", []):
			if link.get("feature_id") and link["feature_id"] not in {f["id"] for f in owner_features}:
				# also show owner-relevant sections
				pass
			allowed_ws = is_workspace_item_allowed_for_user(
				link.get("link_type"),
				link.get("link_to"),
				tier,
				owner,
				settings=settings,
				label=link.get("label"),
				feature_id=link.get("feature_id"),
			)
			if not allowed_ws:
				continue
			frappe_ok = _is_frappe_link_permitted(link.get("link_type"), link.get("link_to"), owner)
			row = f"{section['label']} / {link['label']}: {link['link_type']}/{link['link_to']}"
			if not frappe_ok:
				broken_visible.append(row)
				issues.append(f"workspace link visible but frappe denied: {row}")
			else:
				visible_owner_links.append(row)

	print(f"  visible & openable: {len(visible_owner_links)}")
	print(f"  visible but blocked: {len(broken_visible)}")
	for row in broken_visible[:10]:
		print(f"    BROKEN: {row}")

	# Owner-specific workspace links (from owner feature routes)
	print("\n=== OWNER FEATURE ROUTES vs PAGE PERM ===")
	for f in owner_features:
		bridge = get_feature_workspace_route(f["id"]) or {}
		route = bridge.get("route") or ""
		page_name = route.split("?")[0] if route else ""
		if page_name.startswith("imogi-pos-"):
			page_ok = page_name in allowed_pages
			if not page_ok:
				issues.append(f"route {page_name} for {f['id']} not in allowed_pages")
			print(f"  [{'OK' if page_ok else 'FAIL'}] {f['id']} -> {page_name}")
		elif route.startswith("List/") or route.startswith("imogi-pos-settings"):
			print(f"  [SKIP] {f['id']} -> {route} (DocType route)")

	frappe.set_user("Administrator")

	print("\n=== SUMMARY ===")
	if warnings:
		print(f"WARNINGS ({len(warnings)}):")
		for w in warnings:
			print(f"  - {w}")
	if issues:
		print(f"ISSUES ({len(issues)}):")
		for i in issues:
			print(f"  - {i}")
		print("RESULT: NOT SAFE — fix issues above")
		return {"ok": False, "issues": issues, "warnings": warnings}

	print("RESULT: OWNER FEATURES AMAN (no blocking issues)")
	if warnings:
		print(f"({len(warnings)} warnings — non-operational toggles or expected restrictions)")
	return {"ok": True, "issues": [], "warnings": warnings}
