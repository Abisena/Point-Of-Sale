# Copyright (c) 2026, Imogi and contributors
"""Audit IMOGI Owner / Manager / Cashier against Free-tier role spec."""

from __future__ import annotations

import frappe

from imogi_pos.imogi_pos.utils.feature_gating import is_feature_operational
from imogi_pos.imogi_pos.utils.role_gating import is_role_allowed_for_feature

PAGES = [
	"imogi-pos-dashboard",
	"imogi-pos-sales-report",
	"imogi-pos-menu",
	"imogi-pos-menu-category",
	"imogi-pos-cashier",
	"imogi-pos-order-history",
]

FEATURES = [
	"dashboard_sales",
	"sales_report",
	"menu",
	"menu_category",
	"pos_order",
	"order_history",
]

EXPECTED = {
	"Owner": {
		"role": "IMOGI Owner",
		"home": "imogi-pos-dashboard",
		"pages": {"imogi-pos-dashboard", "imogi-pos-sales-report"},
		"features": {"dashboard_sales", "sales_report"},
	},
	"Manager": {
		"role": "IMOGI Manager",
		"home": "imogi-pos-menu",
		"pages": {"imogi-pos-menu", "imogi-pos-menu-category"},
		"features": {"menu", "menu_category"},
	},
	"Cashier": {
		"role": "IMOGI Cashier",
		"home": "imogi-pos-cashier",
		"pages": {"imogi-pos-cashier", "imogi-pos-order-history"},
		"features": {"pos_order", "order_history"},
	},
}


def _find_user(role: str) -> str | None:
	for user in frappe.get_all(
		"Has Role", filters={"role": role, "parenttype": "User"}, pluck="parent"
	):
		if user in ("Administrator", "Guest"):
			continue
		if frappe.db.get_value("User", user, "enabled"):
			return user
	return None


def _page_allowed_for_role(page_name: str, frappe_role: str, user: str) -> bool:
	page_doc = frappe.get_doc("Page", page_name)
	roles = {r.role for r in page_doc.roles}
	user_roles = set(frappe.get_roles(user))
	return bool(roles & user_roles)


def run():
	settings = frappe.get_single("IMOGI POS Settings")
	orig_gating = settings.enable_role_gating
	issues: list[str] = []

	for label, spec in EXPECTED.items():
		user = _find_user(spec["role"])
		if not user:
			issues.append(f"{label}: no enabled user with role {spec['role']}")
			continue

		home = frappe.db.get_value("Role", spec["role"], "home_page")
		if home != spec["home"]:
			issues.append(f"{label}: home_page={home!r}, expected {spec['home']!r}")

		for page in PAGES:
			allowed = _page_allowed_for_role(page, spec["role"], user)
			should = page in spec["pages"]
			if allowed != should:
				state = "allowed" if allowed else "denied"
				issues.append(f"{label}: page {page} is {state}, expected {'allowed' if should else 'denied'}")

		for fid in FEATURES:
			role_ok = is_role_allowed_for_feature(fid, user=user, settings=settings)
			should = fid in spec["features"]
			if role_ok != should:
				issues.append(
					f"{label}: feature {fid} access={'OK' if role_ok else 'BLOCK'}, "
					f"expected {'OK' if should else 'BLOCK'}"
				)

	if orig_gating != settings.enable_role_gating:
		settings.enable_role_gating = orig_gating
		settings.save(ignore_permissions=True)
		frappe.db.commit()

	if issues:
		print("ROLE AUDIT — ISSUES:")
		for row in issues:
			print(f"  - {row}")
		return {"ok": False, "issues": issues}

	print("ROLE AUDIT — ALL OK")
	for label, spec in EXPECTED.items():
		user = _find_user(spec["role"])
		print(f"  {label}: user={user}, home={spec['home']}, pages={sorted(spec['pages'])}")
	return {"ok": True, "issues": []}
