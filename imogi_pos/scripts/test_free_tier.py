# Copyright (c) 2026, Imogi and contributors
"""Integration smoke test for subscription tier Free."""

from __future__ import annotations

import frappe

from imogi_pos.imogi_pos.utils.feature_gating import (
	enforce_settings_tier_limits,
	get_settings_field_locks,
	serialize_cashier_feature_meta,
)
from imogi_pos.imogi_pos.utils.feature_registry import FEATURES, is_feature_in_plan
from imogi_pos.imogi_pos.utils.workspace_tier_gating import (
	apply_workspace_tier_filters,
	is_workspace_item_in_plan,
)

FREE_FEATURE_IDS = tuple(f["id"] for f in FEATURES if f["min_tier"] == "Free")

BLOCKED_ON_FREE = (
	"hold_order",
	"kitchen_display",
	"open_shift",
	"qris",
	"grabfood_integration",
	"point_reward",
	"multi_outlet",
	"table_management",
	"delivery_order",
	"voucher",
)

WORKSPACE_VISIBLE = (
	("Page", "imogi-pos-cashier"),
	("Page", "imogi-pos-dashboard"),
	("DocType", "Riwayat Order"),
	("DocType", "IMOGI POS Settings"),
	("Report", "IMOGI POS Order Summary"),
)

WORKSPACE_HIDDEN = (
	("Page", "kitchen-display"),
	("Page", "fulfillment-queue"),
	("Page", "imogi-pos-open-shift"),
	("Page", "imogi-pos-close-shift"),
	("Page", "imogi-pos-add-branch"),
	("DocType", "IMOGI Kitchen Order"),
	("DocType", "IMOGI POS Loyalty Member"),
	("DocType", "IMOGI Restaurant Table"),
	("Report", "Profit and Loss Statement"),
)

LOCKED_SETTINGS_FIELDS = (
	"enable_loyalty",
	"enable_pos_shift",
	"enable_kitchen_display",
	"enable_payment_gateway",
	"enable_marketplace_orders",
	"multi_branch",
)


def run():
	settings = frappe.get_single("IMOGI POS Settings")
	original_tier = settings.subscription_tier or "Enterprise"
	saved_toggles = {field: settings.get(field) for field in LOCKED_SETTINGS_FIELDS}
	results = {"pass": [], "fail": []}

	def check(name: str, cond: bool, detail: str = ""):
		if cond:
			results["pass"].append(name)
		else:
			results["fail"].append(f"{name}: {detail}")

	try:
		settings.subscription_tier = "Free"
		settings.save(ignore_permissions=True)
		frappe.db.commit()
		settings.reload()

		check("free_feature_count_6", len(FREE_FEATURE_IDS) == 6, str(FREE_FEATURE_IDS))
		for feature_id in FREE_FEATURE_IDS:
			check(f"in_plan_{feature_id}", is_feature_in_plan(feature_id, "Free"))

		for feature_id in BLOCKED_ON_FREE:
			check(
				f"blocked_{feature_id}",
				not is_feature_in_plan(feature_id, "Free"),
				"still allowed",
			)

		for link_type, link_to in WORKSPACE_VISIBLE:
			check(f"ws_visible_{link_to}", is_workspace_item_in_plan(link_type, link_to, "Free"))

		for link_type, link_to in WORKSPACE_HIDDEN:
			check(
				f"ws_hidden_{link_to}",
				not is_workspace_item_in_plan(link_type, link_to, "Free"),
				"visible",
			)

		locks = get_settings_field_locks("Free")
		for fieldname in LOCKED_SETTINGS_FIELDS:
			row = locks["locks"][fieldname]
			check(f"lock_{fieldname}", not row["allowed"], row.get("min_tier"))

		meta = serialize_cashier_feature_meta(settings)
		check("cashier_hold_tier_block", meta["hold_order"]["blocked_reason"] == "tier")
		check("cashier_hold_not_allowed", not meta["hold_order"]["allowed"])
		check("cashier_qris_tier_block", meta["qris"]["blocked_reason"] == "tier")

		page = {
			"shortcuts": {
				"items": [
					{"type": "Page", "link_to": "imogi-pos-cashier", "label": "Kasir"},
					{"type": "Page", "link_to": "kitchen-display", "label": "KDS"},
				]
			},
			"cards": {
				"items": [
					{
						"links": [
							{"link_type": "Page", "link_to": "imogi-pos-cashier"},
							{"link_type": "Page", "link_to": "kitchen-display"},
						]
					}
				]
			},
		}
		filtered = apply_workspace_tier_filters(page, "Free")
		shortcut_links = [item.get("link_to") for item in (filtered.get("shortcuts") or {}).get("items", [])]
		check("filter_shortcuts", shortcut_links == ["imogi-pos-cashier"], str(shortcut_links))
		card_links = [
			link.get("link_to")
			for link in ((filtered.get("cards") or {}).get("items") or [{}])[0].get("links", [])
		]
		check("filter_cards", card_links == ["imogi-pos-cashier"], str(card_links))

		settings.subscription_tier = "Professional"
		settings.enable_loyalty = 1
		settings.enable_pos_shift = 1
		settings.save(ignore_permissions=True)
		frappe.db.commit()
		settings.reload()
		settings.subscription_tier = "Free"
		settings.save(ignore_permissions=True)
		frappe.db.commit()
		settings.reload()
		check("downgrade_loyalty_off", not settings.enable_loyalty)
		check("downgrade_shift_off", not settings.enable_pos_shift)

		from imogi_pos.imogi_pos.utils.feature_gating import (
			require_feature_operational,
			validate_checkout_features,
			validate_order_type,
		)

		for order_type in ("Takeaway", "Dine-in", "Delivery"):
			try:
				validate_order_type(order_type, settings)
				check(f"checkout_order_type_{order_type}", True)
			except Exception as exc:
				check(f"checkout_order_type_{order_type}", False, str(exc))

		try:
			validate_checkout_features(order_type="Takeaway", settings=settings)
			check("checkout_features_takeaway", True)
		except Exception as exc:
			check("checkout_features_takeaway", False, str(exc))

		for feature_id, should_block in (
			("pos_order", False),
			("hold_order", True),
			("kitchen_display", True),
			("open_shift", True),
		):
			blocked = False
			try:
				require_feature_operational(feature_id, settings)
			except Exception:
				blocked = True
			check(
				f"api_require_{feature_id}",
				blocked if should_block else not blocked,
				"blocked" if blocked else "allowed",
			)

		def _user_for_role(role):
			for user in frappe.get_all(
				"Has Role", filters={"role": role, "parenttype": "User"}, pluck="parent"
			):
				if user in ("Administrator", "Guest"):
					continue
				if frappe.db.get_value("User", user, "enabled"):
					return user
			return None

		from imogi_pos.api.dashboard import get_dashboard_metrics

		owner_user = _user_for_role("IMOGI Owner")
		manager_user = _user_for_role("IMOGI Manager")
		cashier_user = _user_for_role("IMOGI Cashier")

		if owner_user:
			frappe.set_user(owner_user)
			try:
				get_dashboard_metrics()
				check("api_dashboard_owner", True)
			except Exception as exc:
				check("api_dashboard_owner", False, str(exc))

		for role_label, user in (("manager", manager_user), ("cashier", cashier_user)):
			if not user:
				continue
			frappe.set_user(user)
			blocked = False
			try:
				get_dashboard_metrics()
			except Exception:
				blocked = True
			check(f"api_dashboard_{role_label}_blocked", blocked)

		if cashier_user:
			frappe.set_user(cashier_user)
			check(
				"api_cashier_no_settings_read",
				not frappe.has_permission("IMOGI POS Settings", "read"),
			)

		frappe.set_user("Administrator")
		from imogi_pos.api.cashier import get_cashier_context
		from imogi_pos.api.feature_api import get_workspace_tier_context

		context = get_cashier_context()
		check("api_cashier_tier", context.get("subscription_tier") == "Free")
		check("api_cashier_hold", not context.get("features", {}).get("hold_order"))
		check("api_cashier_shift", not context.get("features", {}).get("open_shift"))

		ctx = get_workspace_tier_context()
		kds = ctx["tier_access"]["links"].get("Page/kitchen-display", {})
		check("api_ws_ctx_tier", ctx.get("tier") == "Free")
		check("api_ws_ctx_kds", not kds.get("allowed"))

		from json import dumps

		from imogi_pos.overrides.desktop import get_desktop_page

		page = get_desktop_page(dumps({"name": "Imogi POS", "title": "Imogi POS"}))
		shortcut_links = [
			item.get("link_to") or item.get("label")
			for item in (page.get("shortcuts") or {}).get("items", [])
		]
		card_links = []
		for card in (page.get("cards") or {}).get("items", []):
			for link in card.get("links", []):
				card_links.append(link.get("link_to") or link.get("label"))

		check("desktop_tier_label", page.get("imogi_pos_tier") == "Free")
		for link_to in ("kitchen-display", "fulfillment-queue", "imogi-pos-open-shift"):
			check(
				f"desktop_hidden_{link_to}",
				link_to not in shortcut_links and link_to not in card_links,
				"leaked",
			)
		for link_to in ("imogi-pos-cashier", "imogi-pos-dashboard"):
			check(
				f"desktop_visible_{link_to}",
				link_to in shortcut_links or link_to in card_links,
				"missing",
			)
	finally:
		settings.subscription_tier = original_tier
		for fieldname, value in saved_toggles.items():
			settings.set(fieldname, value)
		settings.save(ignore_permissions=True)
		frappe.db.commit()

	print("=== FREE TIER TEST ===")
	print("Free features:", list(FREE_FEATURE_IDS))
	print("PASS:", len(results["pass"]))
	print("FAIL:", len(results["fail"]))
	for failure in results["fail"]:
		print("  X", failure)

	if results["fail"]:
		raise frappe.ValidationError(f"Free tier tests failed: {len(results['fail'])}")

	print("All Free tier checks passed.")
	return results
