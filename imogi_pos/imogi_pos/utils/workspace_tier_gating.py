# Copyright (c) 2026, Imogi and contributors
"""Hide IMOGI POS workspace links that are not in the current subscription tier."""

from __future__ import annotations

import frappe

from imogi_pos.imogi_pos.utils.feature_registry import (
	SUBSCRIPTION_TIERS,
	get_feature,
	get_subscription_tier,
	is_feature_in_plan,
)

# link_type + link_to → feature_registry id (None = always visible in workspace)
WORKSPACE_LINK_FEATURES: dict[tuple[str, str], str | None] = {
	# Pages
	("Page", "imogi-pos-cashier"): "pos_order",
	("Page", "imogi-pos-dashboard"): "dashboard_sales",
	("Page", "imogi-pos-open-shift"): "open_shift",
	("Page", "imogi-pos-close-shift"): "close_shift",
	("Page", "kitchen-display"): "kitchen_display",
	("Page", "fulfillment-queue"): "delivery_order",
	("Page", "imogi-pos-add-branch"): "multi_outlet",
	("Page", "imogi-pos-feature-matrix"): None,
	("Page", "imogi-pos-setup"): None,
	# Core IMOGI
	("DocType", "IMOGI POS Order"): "pos_order",
	("DocType", "IMOGI POS Settings"): None,
	("DocType", "POS Invoice"): "pos_order",
	("DocType", "IMOGI Restaurant Table"): "table_management",
	("DocType", "IMOGI POS Approval Request"): "approval_void",
	("DocType", "IMOGI POS Gateway Payment"): "qris",
	("DocType", "IMOGI Kitchen Order"): "kitchen_queue",
	("DocType", "IMOGI Kitchen Station"): "kitchen_station",
	("DocType", "IMOGI Fulfillment Task"): "delivery_order",
	("DocType", "IMOGI Delivery Task"): "delivery_order",
	("DocType", "IMOGI POS Combo Package"): "combo_package",
	("DocType", "IMOGI POS Table Reservation"): "table_reservation",
	("DocType", "IMOGI POS Waiting List"): "waiting_list",
	("DocType", "Item"): "menu",
	("DocType", "IMOGI POS Loyalty Member"): "membership",
	("DocType", "IMOGI POS Loyalty Tier"): "membership_tier",
	("DocType", "IMOGI POS Voucher"): "voucher",
	("DocType", "IMOGI POS Promo Rule"): "voucher",
	("DocType", "IMOGI POS Loyalty Transaction"): "point_reward",
	("DocType", "IMOGI POS Shift Opening"): "open_shift",
	("DocType", "IMOGI POS Shift Closing"): "close_shift",
	("DocType", "POS Opening Entry"): "open_shift",
	("DocType", "POS Closing Entry"): "end_of_day",
	("DocType", "IMOGI Branch"): "multi_outlet",
	("DocType", "IMOGI POS Offline Checkout"): "api_access",
	("DocType", "IMOGI POS Subscription Event"): "api_access",
	("DocType", "IMOGI POS Royalty Accrual"): "approval_discount",
	# ERPNext bridges
	("DocType", "BOM"): "recipe_management",
	("DocType", "Stock Entry"): "waste_management",
	("DocType", "Stock Reconciliation"): "stock_opname",
	("DocType", "Batch"): "batch_tracking",
	("DocType", "Supplier"): "supplier",
	("DocType", "Material Request"): "purchase_request",
	("DocType", "Purchase Order"): "purchase_order",
	("DocType", "Purchase Receipt"): "goods_receiving",
	("DocType", "Payment Entry"): "cash_bank",
	("DocType", "Purchase Invoice"): "supplier_payable",
	("DocType", "Version"): "audit_log",
	("DocType", "Activity Log"): "login_history",
	# Reports
	("Report", "IMOGI UMKM Daily Sales"): "sales_report",
	("Report", "IMOGI Branch Sales Summary"): "multi_outlet",
	("Report", "IMOGI POS Order Summary"): "sales_report",
	("Report", "Stock Ledger"): "stock_raw",
	("Report", "Profit and Loss Statement"): "profit_loss",
	("Report", "Cash Flow"): "cash_flow",
	("Report", "Sales Register"): "tax_report",
}


def workspace_link_key(link_type: str | None, link_to: str | None) -> tuple[str, str]:
	return ((link_type or "").strip(), (link_to or "").strip())


def get_workspace_link_feature_id(link_type: str | None, link_to: str | None) -> str | None:
	return WORKSPACE_LINK_FEATURES.get(workspace_link_key(link_type, link_to))


def is_workspace_item_in_plan(
	link_type: str | None,
	link_to: str | None,
	tier: str | None = None,
) -> bool:
	feature_id = get_workspace_link_feature_id(link_type, link_to)
	if not feature_id:
		return True
	return is_feature_in_plan(feature_id, tier)


def serialize_workspace_link_access(tier: str | None = None) -> dict:
	tier = tier or get_subscription_tier()
	links: dict[str, dict] = {}
	for (link_type, link_to), feature_id in WORKSPACE_LINK_FEATURES.items():
		key = f"{link_type}/{link_to}"
		feature = get_feature(feature_id) if feature_id else None
		allowed = is_workspace_item_in_plan(link_type, link_to, tier)
		links[key] = {
			"allowed": allowed,
			"feature_id": feature_id,
			"min_tier": (feature or {}).get("min_tier"),
			"label": (feature or {}).get("label"),
		}
	return {"tier": tier, "tiers": list(SUBSCRIPTION_TIERS), "links": links}


def _filter_link_items(items: list, link_type_key: str, tier: str | None) -> list:
	filtered = []
	for item in items:
		link_type = item.get(link_type_key) or item.get("type")
		link_to = item.get("link_to")
		if is_workspace_item_in_plan(link_type, link_to, tier):
			filtered.append(item)
	return filtered


def apply_workspace_tier_filters(page_data: dict, tier: str | None = None) -> dict:
	"""Remove workspace shortcuts/cards not included in the subscription tier."""
	if not page_data:
		return page_data

	tier = tier or get_subscription_tier()
	page_data = frappe._dict(page_data)

	shortcuts = page_data.get("shortcuts") or {}
	if shortcuts.get("items"):
		shortcuts["items"] = _filter_link_items(shortcuts["items"], "type", tier)

	cards = page_data.get("cards") or {}
	new_cards = []
	for card in cards.get("items") or []:
		links = _filter_link_items(card.get("links") or [], "link_type", tier)
		if links:
			new_card = dict(card)
			new_card["links"] = links
			new_cards.append(new_card)
	cards["items"] = new_cards

	page_data["imogi_pos_tier"] = tier
	page_data["imogi_pos_tier_label"] = tier
	return page_data
