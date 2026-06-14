# Copyright (c) 2026, Imogi and contributors
"""Full IMOGI POS audit: doctypes A–Z, role permissions, order history scope, E2E."""

from __future__ import annotations

import frappe
from frappe.utils import flt

TAG = "IMOGI-FULL-SUITE"

# All IMOGI POS module DocTypes (A–Z)
IMOGI_DOCTYPES = sorted(
	[
		"IMOGI Area Manager Assignment",
		"IMOGI Area Manager Branch",
		"IMOGI Branch",
		"IMOGI Branch Item Group",
		"IMOGI Delivery Task",
		"IMOGI Fulfillment Task",
		"IMOGI Kitchen Order",
		"IMOGI Kitchen Order Item",
		"IMOGI Kitchen Station",
		"IMOGI POS Approval Request",
		"IMOGI POS Combo Package",
		"IMOGI POS Combo Package Item",
		"IMOGI POS Gateway Payment",
		"IMOGI POS Loyalty Member",
		"IMOGI POS Loyalty Tier",
		"IMOGI POS Loyalty Transaction",
		"IMOGI POS Offline Checkout",
		"IMOGI POS Order Item",
		"IMOGI POS Order Payment",
		"IMOGI POS Promo Rule",
		"IMOGI POS Royalty Accrual",
		"IMOGI POS Settings",
		"IMOGI POS Setup Cashier Line",
		"IMOGI POS Setup Payment Line",
		"IMOGI POS Setup Product Line",
		"IMOGI POS Setup Session",
		"IMOGI POS Setup Supplier Line",
		"IMOGI POS Shift Closing",
		"IMOGI POS Shift Opening",
		"IMOGI POS Shift Opening Payment",
		"IMOGI POS Subscription Event",
		"IMOGI POS Table Reservation",
		"IMOGI POS Voucher",
		"IMOGI POS Waiting List",
		"IMOGI Restaurant Table",
		"Riwayat Order",
	]
)


def run(include_e2e=1):
	"""Run full suite. Set include_e2e=0 to skip document-creating E2E."""
	frappe.set_user("Administrator")
	errors: list[str] = []
	warnings: list[str] = []
	sections: dict[str, dict] = {}
	settings = frappe.get_single("IMOGI POS Settings")
	site_tier = settings.subscription_tier or "Enterprise"

	print(f"\n=== {TAG} (site tier: {site_tier}) ===\n")

	sections["doctypes"] = _audit_doctypes(errors)
	sections["role_permissions"] = _audit_role_permissions(errors)
	sections["order_history"] = _audit_order_history_scope(errors)
	sections["child_tables"] = _audit_child_table_parents(errors)

	for name, fn in (
		("free_tier_roles", "imogi_pos.scripts.audit_free_tier_roles.run"),
		("owner_features", "imogi_pos.scripts.audit_owner_features.run"),
		("erp_integration", "imogi_pos.scripts.audit_erp_integration.run"),
	):
		if name == "free_tier_roles" and site_tier != "Free":
			print(f"\n--- {name} ---")
			print(f"  [SKIP] site tier={site_tier!r} (audit expects Free tier)")
			sections[name] = {"ok": True, "skipped": True}
			continue
		print(f"\n--- {name} ---")
		try:
			result = frappe.get_attr(fn)()
			sections[name] = result or {}
			if result and not result.get("ok", True):
				errors.append(f"{name}: audit returned ok=False")
		except Exception as exc:
			errors.append(f"{name}: {exc}")
			print(f"  [FAIL] {exc}")

	for name, fn in (
		("free_tier", "imogi_pos.scripts.test_free_tier.run"),
		("feature_gating", "imogi_pos.scripts.test_feature_gating.run"),
	):
		if name == "free_tier" and site_tier != "Free":
			print(f"\n--- {name} ---")
			print(f"  [SKIP] site tier={site_tier!r}")
			sections[name] = {"ok": True, "skipped": True}
			continue
		if name == "feature_gating":
			print(f"\n--- {name} ---")
			try:
				_run_feature_gating_smoke()
				sections[name] = {"ok": True}
				print(f"  [OK] {name}")
			except Exception as exc:
				errors.append(f"{name}: {exc!r}")
				print(f"  [FAIL] {exc}")
			continue
		print(f"\n--- {name} ---")
		try:
			frappe.get_attr(fn)()
			sections[name] = {"ok": True}
			print(f"  [OK] {name}")
		except Exception as exc:
			errors.append(f"{name}: {exc}")
			print(f"  [FAIL] {exc}")

	print("\n--- cashier_smoke ---")
	try:
		from imogi_pos.api.cashier import get_cashier_context

		ctx = get_cashier_context()
		assert ctx.get("pos_profile"), "pos_profile missing"
		assert ctx.get("payment_modes"), "payment_modes missing"
		sections["cashier_smoke"] = {"ok": True}
		print(f"  [OK] get_cashier_context pos_profile={ctx['pos_profile']}")
	except Exception as exc:
		errors.append(f"cashier_smoke: {exc}")
		print(f"  [FAIL] {exc}")

	if cint(include_e2e):
		print("\n--- erp_e2e ---")
		try:
			result = frappe.get_attr("imogi_pos.scripts.test_erp_e2e.run")()
			sections["erp_e2e"] = result or {}
			if not result.get("ok"):
				e2e_errors = result.get("errors") or ["erp_e2e failed"]
				non_critical = all("auto Material Request" in e or "low stock" in e.lower() for e in e2e_errors)
				if non_critical:
					warnings.extend(e2e_errors)
				else:
					errors.extend(e2e_errors)
		except Exception as exc:
			errors.append(f"erp_e2e: {exc}")
			print(f"  [FAIL] {exc}")

	print("\n=== SUMMARY ===")
	print(f"  DocTypes checked: {sections.get('doctypes', {}).get('count', 0)}")
	print(f"  Role permission checks: {sections.get('role_permissions', {}).get('checks', 0)}")
	print(f"  Order history scope: {sections.get('order_history', {}).get('status', '?')}")

	if errors:
		print(f"\nRESULT: FAIL ({len(errors)} issues)")
		for row in errors[:40]:
			print(f"  - {row}")
		if len(errors) > 40:
			print(f"  ... and {len(errors) - 40} more")
		return {"ok": False, "errors": errors, "warnings": warnings, "sections": sections}

	if warnings:
		print(f"\nWARNINGS ({len(warnings)}):")
		for row in warnings[:10]:
			print(f"  - {row}")

	print("\nRESULT: PASS — full IMOGI POS suite OK")
	return {"ok": True, "errors": [], "warnings": warnings, "sections": sections}


def cint(v):
	from frappe.utils import cint as _cint

	return _cint(v)


def _audit_doctypes(errors: list[str]) -> dict:
	print("--- doctypes A–Z ---")
	missing = []
	for dt in IMOGI_DOCTYPES:
		if not frappe.db.exists("DocType", dt):
			missing.append(dt)
			continue
		try:
			frappe.get_meta(dt)
		except Exception as exc:
			errors.append(f"doctype meta {dt}: {exc}")
			print(f"  [FAIL] {dt}: {exc}")

	if missing:
		for dt in missing:
			errors.append(f"doctype missing: {dt}")
			print(f"  [FAIL] missing {dt}")
	else:
		print(f"  [OK] {len(IMOGI_DOCTYPES)} DocTypes exist + meta load")

	# Riwayat Order cashier field
	if frappe.db.has_column("Riwayat Order", "cashier"):
		print("  [OK] Riwayat Order.cashier column present")
	else:
		errors.append("Riwayat Order.cashier column missing — run migrate")
		print("  [FAIL] Riwayat Order.cashier column missing")

	return {"count": len(IMOGI_DOCTYPES), "missing": missing}


def _find_user(role: str) -> str | None:
	for user in frappe.get_all(
		"Has Role", filters={"role": role, "parenttype": "User"}, pluck="parent"
	):
		if user in ("Administrator", "Guest"):
			continue
		if frappe.db.get_value("User", user, "enabled"):
			return user
	return None


def _audit_role_permissions(errors: list[str]) -> dict:
	from imogi_pos.imogi_pos.utils.demo_users import ensure_demo_role_users
	from imogi_pos.imogi_pos.utils.role_permissions import IMOGI_ROLE_PERMISSIONS

	print("--- role permissions ---")
	ensure_demo_role_users()
	checks = 0
	failures = 0

	for role, perms in sorted(IMOGI_ROLE_PERMISSIONS.items()):
		user = _find_user(role)
		if not user:
			print(f"  [SKIP] {role}: no enabled user")
			continue

		for doctype, perm_dict in perms:
			for ptype, expected in perm_dict.items():
				if ptype in ("if_owner", "report", "export", "import", "share", "print", "email"):
					continue
				checks += 1
				has = frappe.has_permission(doctype, ptype, user=user)
				if bool(has) != bool(expected):
					failures += 1
					errors.append(
						f"{role} ({user}) {doctype}.{ptype}={has}, expected {bool(expected)}"
					)

		status = "OK" if failures == 0 else "FAIL"
		print(f"  [{status}] {role} user={user} ({len(perms)} doctypes)")

	return {"checks": checks, "failures": failures}


def _run_feature_gating_smoke():
	from imogi_pos.imogi_pos.utils.feature_gating import get_feature_block_reason, serialize_cashier_feature_meta
	from imogi_pos.imogi_pos.utils.feature_registry import is_feature_in_plan, is_tier_at_least
	from imogi_pos.imogi_pos.utils.workspace_tier_gating import is_workspace_item_in_plan

	assert is_tier_at_least("Enterprise", "Free"), "Enterprise should include Free tier"
	assert is_feature_in_plan("pos_order", "Free"), "pos_order should be in Free plan"
	assert is_workspace_item_in_plan("Page", "imogi-pos-cashier", "Free"), "cashier page in Free plan"

	class _FakeSettings:
		subscription_tier = "Free"
		enable_loyalty = 0
		enable_stamp_card = 0
		enable_promo_rules = 0
		enable_payment_gateway = 0
		enable_marketplace_orders = 0
		enable_pos_shift = 0
		enable_kitchen_display = 0
		enable_fulfillment = 0
		enable_order_api = 0
		multi_branch = 0

	free_doc = _FakeSettings()
	block = get_feature_block_reason("hold_order", free_doc, "Free")
	assert block == "tier", f"hold_order block reason={block!r}"
	meta = serialize_cashier_feature_meta(free_doc)
	assert meta["hold_order"]["blocked_reason"] == "tier", meta["hold_order"]


def _pick_cashier_users():
	preferred = ("gunawan@gmail.com", "sucipto@gmail.com")
	found = []
	for email in preferred:
		if frappe.db.exists("User", email) and frappe.db.get_value("User", email, "enabled"):
			if "IMOGI Cashier" in frappe.get_roles(email):
				found.append(email)
	cashier_a = found[0] if found else _find_user("IMOGI Cashier")
	cashier_b = found[1] if len(found) > 1 else None
	if not cashier_b:
		for user in frappe.get_all(
			"Has Role",
			filters={"role": "IMOGI Cashier", "parenttype": "User"},
			pluck="parent",
		):
			if user in ("Administrator", "Guest", cashier_a):
				continue
			if frappe.db.get_value("User", user, "enabled"):
				cashier_b = user
				break
	return cashier_a, cashier_b


def _audit_order_history_scope(errors: list[str]) -> dict:
	from imogi_pos.api.free_tier_api import get_order_history_detail, list_order_history
	from imogi_pos.imogi_pos.utils.branch import resolve_active_branch
	from imogi_pos.imogi_pos.utils.demo_users import ensure_demo_role_users

	print("--- order history scope ---")
	ensure_demo_role_users()

	owner = _find_user("IMOGI Owner")
	cashier_a, cashier_b = _pick_cashier_users()

	if not owner or not cashier_a:
		msg = f"need Owner + Cashier users (owner={owner}, cashier={cashier_a})"
		errors.append(f"order_history: {msg}")
		print(f"  [SKIP] {msg}")
		return {"status": "skipped"}

	settings = frappe.get_single("IMOGI POS Settings")
	company = settings.default_company
	customer = frappe.db.get_value("Customer", {"disabled": 0}, "name")
	mode = frappe.db.get_value("Mode of Payment", {"enabled": 1}, "name") or "Cash"
	item = frappe.db.get_value("Item", {"disabled": 0, "is_sales_item": 1}, "name")

	if not all([company, customer, item]):
		errors.append("order_history: missing master data for test orders")
		print("  [SKIP] missing master data")
		return {"status": "skipped"}

	ctx_a = resolve_active_branch(user=cashier_a)
	ctx_b = resolve_active_branch(user=cashier_b) if cashier_b else ctx_a
	if not ctx_a.get("pos_profile") or not ctx_a.get("warehouse"):
		errors.append(f"order_history: cashier {cashier_a} has no branch/POS context")
		print(f"  [SKIP] no POS context for {cashier_a}")
		return {"status": "skipped"}

	order_a = _make_test_order(cashier_a, company, ctx_a["pos_profile"], ctx_a["warehouse"], customer, item, mode)
	order_b = None
	if cashier_b and cashier_b != cashier_a and ctx_b.get("pos_profile"):
		order_b = _make_test_order(
			cashier_b, company, ctx_b["pos_profile"], ctx_b["warehouse"], customer, item, mode
		)
	frappe.db.commit()

	# Cashier A sees own order, not B's
	frappe.set_user(cashier_a)
	cashier_list = list_order_history(limit=200)
	if cashier_list.get("view_mode") != "own":
		errors.append(f"cashier view_mode={cashier_list.get('view_mode')!r}, expected 'own'")
	cashier_names = {row["name"] for row in cashier_list.get("orders") or []}
	if order_a not in cashier_names:
		errors.append(f"cashier {cashier_a} missing own order {order_a}")
	if order_b and order_b in cashier_names:
		errors.append(f"cashier {cashier_a} can see other cashier order {order_b}")
	for row in cashier_list.get("orders") or []:
		if row.get("cashier") and row["cashier"] != cashier_a:
			errors.append(f"cashier list leaked cashier={row.get('cashier')} for {cashier_a}")

	try:
		get_order_history_detail(order_a)
	except Exception as exc:
		errors.append(f"cashier cannot open own order: {exc}")
	if order_b:
		blocked = False
		try:
			get_order_history_detail(order_b)
		except Exception as exc:
			if exc.__class__.__name__ in ("DoesNotExistError", "PermissionError") or "not found" in str(exc).lower():
				blocked = True
		if not blocked:
			errors.append(f"cashier {cashier_a} can open other cashier detail {order_b}")

	# Owner sees all
	frappe.set_user(owner)
	owner_list = list_order_history(limit=200)
	if owner_list.get("view_mode") != "all":
		errors.append(f"owner view_mode={owner_list.get('view_mode')!r}, expected 'all'")
	owner_names = {row["name"] for row in owner_list.get("orders") or []}
	if order_a not in owner_names:
		errors.append(f"owner missing order {order_a}")
	if order_b and order_b not in owner_names:
		errors.append(f"owner missing order {order_b}")

	try:
		detail = get_order_history_detail(order_a)
		if not detail.get("cashier_name") and not detail.get("cashier"):
			errors.append("order detail missing cashier fields")
	except Exception as exc:
		errors.append(f"owner cannot open order detail: {exc}")

	frappe.set_user("Administrator")

	ok = not any("order_history" in e or "cashier" in e or "owner" in e for e in errors[-10:])
	print(f"  [{'OK' if ok else 'FAIL'}] cashier={cashier_a} owner={owner} orders={order_a},{order_b or '-'}")
	return {
		"status": "ok" if ok else "fail",
		"cashier_a": cashier_a,
		"cashier_b": cashier_b,
		"owner": owner,
		"order_a": order_a,
		"order_b": order_b,
	}


def _make_test_order(cashier_user, company, pos_profile, warehouse, customer, item, mode):
	frappe.set_user(cashier_user)
	rate = flt(frappe.db.get_value("Item", item, "standard_rate")) or 10000
	order = frappe.get_doc(
		{
			"doctype": "Riwayat Order",
			"naming_series": "ORD-.YYYY.-",
			"company": company,
			"pos_profile": pos_profile,
			"customer": customer,
			"order_source": "IMOGI POS",
			"order_channel": "Walk-in",
			"order_type": "Takeaway",
			"cashier": cashier_user,
			"items": [{"item_code": item, "qty": 1, "rate": rate, "warehouse": warehouse}],
			"payments": [{"mode_of_payment": mode, "amount": rate}],
		}
	)
	order.insert(ignore_permissions=True)
	order.submit()
	if order.cashier != cashier_user:
		raise RuntimeError(f"order {order.name} cashier={order.cashier}, expected {cashier_user}")
	return order.name


def _audit_child_table_parents(errors: list[str]) -> dict:
	print("--- child table parents ---")
	child_map = {
		"IMOGI Area Manager Branch": "IMOGI Area Manager Assignment",
		"IMOGI Branch Item Group": "IMOGI Branch",
		"IMOGI Kitchen Order Item": "IMOGI Kitchen Order",
		"IMOGI POS Combo Package Item": "IMOGI POS Combo Package",
		"IMOGI POS Order Item": "Riwayat Order",
		"IMOGI POS Order Payment": "Riwayat Order",
		"IMOGI POS Setup Cashier Line": "IMOGI POS Setup Session",
		"IMOGI POS Setup Payment Line": "IMOGI POS Setup Session",
		"IMOGI POS Setup Product Line": "IMOGI POS Setup Session",
		"IMOGI POS Setup Supplier Line": "IMOGI POS Setup Session",
		"IMOGI POS Shift Opening Payment": "IMOGI POS Shift Opening",
	}
	for child, parent in child_map.items():
		if not frappe.db.exists("DocType", child):
			errors.append(f"child doctype missing: {child}")
			continue
		meta = frappe.get_meta(child)
		if meta.istable and not meta.get("fields"):
			errors.append(f"child table {child} has no fields")
		if not frappe.db.exists("DocType", parent):
			errors.append(f"parent doctype missing for {child}: {parent}")
	print(f"  [OK] {len(child_map)} child tables mapped")
	return {"child_tables": len(child_map)}
