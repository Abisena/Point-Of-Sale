# Copyright (c) 2026, Imogi and contributors
"""Hide IMOGI POS workspace links that are not in the current subscription tier."""

from __future__ import annotations

import json

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
	("Page", "imogi-pos-sales-report"): "sales_report",
	("Page", "imogi-pos-menu"): "menu",
	("Page", "imogi-pos-menu-category"): "menu_category",
	("Page", "imogi-pos-order-history"): "order_history",
	("Page", "imogi-pos-open-shift"): "open_shift",
	("Page", "imogi-pos-close-shift"): "close_shift",
	("Page", "kitchen-display"): "kitchen_display",
	("Page", "fulfillment-queue"): "delivery_order",
	("Page", "imogi-pos-add-branch"): "multi_outlet",
	("Page", "imogi-pos-feature-matrix"): None,
	("Page", "imogi-pos-setup"): None,
	# Core IMOGI
	("DocType", "Riwayat Order"): "pos_order",
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
	("DocType", "Item Group"): "menu_category",
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
	("DocType", "Sales Invoice"): "accounting_integration",
	("DocType", "IMOGI Area Manager Assignment"): None,
	("DocType", "IMOGI POS Loyalty Transaction"): "point_reward",
}

_WORKSPACE_LINK_LABEL_FEATURES: dict[tuple[str, str, str], str] | None = None


def _workspace_link_label_features() -> dict[tuple[str, str, str], str]:
	global _WORKSPACE_LINK_LABEL_FEATURES
	if _WORKSPACE_LINK_LABEL_FEATURES is not None:
		return _WORKSPACE_LINK_LABEL_FEATURES

	from imogi_pos.imogi_pos.utils.workspace_catalog import WORKSPACE_SECTIONS

	mapping: dict[tuple[str, str, str], str] = {}
	for section in WORKSPACE_SECTIONS:
		for link in section.get("links", []):
			feature_id = link.get("feature_id")
			if not feature_id:
				continue
			mapping[
				(
					(link.get("link_type") or "").strip(),
					(link.get("link_to") or "").strip(),
					(link.get("label") or "").strip(),
				)
			] = feature_id
	_WORKSPACE_LINK_LABEL_FEATURES = mapping
	return mapping

# Owner: upgrade langganan & matriks fitur. Admin: setup wizard.
WORKSPACE_OWNER_UPGRADE_KEYS = frozenset(
	{
		("DocType", "IMOGI POS Settings"),
		("Page", "imogi-pos-feature-matrix"),
	}
)
WORKSPACE_ADMIN_ONLY_KEYS = frozenset({("Page", "imogi-pos-setup")})
WORKSPACE_AREA_ASSIGNMENT_KEY = ("DocType", "IMOGI Area Manager Assignment")

# Legacy workspace card titles → current WORKSPACE_SECTIONS labels
WORKSPACE_CARD_ALIASES: dict[str, str] = {
	"Order & Pembayaran": "Operasional Harian",
	"Shift & Operasional": "Shift & Tutup Hari",
	"Master & Cabang": "Pengaturan Sistem",
	"Laporan": "Laporan & Analitik",
}


def _resolve_workspace_section(section_map: dict, card_name: str | None):
	if not card_name:
		return None
	section = section_map.get(card_name)
	if section:
		return section
	alias = WORKSPACE_CARD_ALIASES.get(card_name)
	if alias:
		return section_map.get(alias)
	return None


def workspace_link_key(link_type: str | None, link_to: str | None) -> tuple[str, str]:
	return ((link_type or "").strip(), (link_to or "").strip())


def get_workspace_link_feature_id(
	link_type: str | None,
	link_to: str | None,
	*,
	label: str | None = None,
	feature_id: str | None = None,
) -> str | None:
	if feature_id:
		return feature_id
	if label:
		override = _workspace_link_label_features().get(
			((link_type or "").strip(), (link_to or "").strip(), label.strip())
		)
		if override:
			return override
	return WORKSPACE_LINK_FEATURES.get(workspace_link_key(link_type, link_to))


def is_workspace_item_in_plan(
	link_type: str | None,
	link_to: str | None,
	tier: str | None = None,
	*,
	label: str | None = None,
	feature_id: str | None = None,
) -> bool:
	from imogi_pos.imogi_pos.utils.deployment_mode import is_subscription_tier_disabled

	if is_subscription_tier_disabled():
		return True
	resolved = get_workspace_link_feature_id(
		link_type, link_to, label=label, feature_id=feature_id
	)
	if not resolved:
		return True
	return is_feature_in_plan(resolved, tier)


def is_workspace_admin_link(link_type: str | None, link_to: str | None) -> bool:
	return workspace_link_key(link_type, link_to) in WORKSPACE_ADMIN_ONLY_KEYS


def is_workspace_owner_upgrade_link(link_type: str | None, link_to: str | None) -> bool:
	return workspace_link_key(link_type, link_to) in WORKSPACE_OWNER_UPGRADE_KEYS


def _user_is_imogi_owner(user: str | None) -> bool:
	return bool(user and "IMOGI Owner" in frappe.get_roles(user))


def _user_is_imogi_area_manager(user: str | None) -> bool:
	return bool(user and "IMOGI Area Manager" in frappe.get_roles(user))


CASHIER_ESCALATION_ROLES = frozenset(
	{
		"Administrator",
		"System Manager",
		"Sales Manager",
		"IMOGI Owner",
		"IMOGI Manager",
		"IMOGI Area Manager",
		"IMOGI Supervisor",
	}
)


def _user_is_dedicated_cashier(user: str | None) -> bool:
	"""Pure kasir — tidak pakai workspace ERPNext, hanya halaman web kasir."""
	user = user or getattr(frappe.session, "user", None)
	if not user or user == "Guest":
		return False
	roles = set(frappe.get_roles(user))
	if "IMOGI Cashier" not in roles:
		return False
	return not bool(roles & CASHIER_ESCALATION_ROLES)


def is_workspace_area_assignment_link(link_type: str | None, link_to: str | None) -> bool:
	return workspace_link_key(link_type, link_to) == WORKSPACE_AREA_ASSIGNMENT_KEY


def _is_frappe_link_permitted(
	link_type: str | None, link_to: str | None, user: str | None = None
) -> bool:
	"""Frappe Page / DocType / Report permission (actual navigation gate)."""
	user = user or getattr(frappe.session, "user", None)
	if not user or user == "Guest":
		return False

	link_type = (link_type or "").strip()
	link_to = (link_to or "").strip()
	if not link_to:
		return True

	if link_type == "Page":
		from frappe.boot import get_allowed_pages

		return link_to in get_allowed_pages(cache=False)
	if link_type == "DocType":
		return bool(frappe.has_permission(link_to, "read", user=user))
	if link_type == "Report":
		from frappe.boot import get_allowed_reports

		return link_to in get_allowed_reports(cache=False)
	return True


def is_workspace_item_allowed_for_user(
	link_type: str | None,
	link_to: str | None,
	tier: str | None = None,
	user: str | None = None,
	settings=None,
	*,
	label: str | None = None,
	feature_id: str | None = None,
) -> bool:
	"""Tier + role filter for IMOGI POS workspace links."""
	from imogi_pos.imogi_pos.utils.role_gating import (
		is_role_allowed_for_feature,
		user_bypasses_role_gating,
	)

	tier = tier or get_subscription_tier()
	user = user or getattr(frappe.session, "user", None)
	if _user_is_dedicated_cashier(user):
		return False
	if not is_workspace_item_in_plan(
		link_type, link_to, tier, label=label, feature_id=feature_id
	):
		return False
	if is_workspace_owner_upgrade_link(link_type, link_to):
		if user_bypasses_role_gating(user):
			return True
		if _user_is_imogi_owner(user):
			return True
		return bool(set(frappe.get_roles(user)) & {"Sales Manager", "Administrator"})
	if is_workspace_admin_link(link_type, link_to):
		if user_bypasses_role_gating(user):
			return True
		return bool(set(frappe.get_roles(user)) & {"Sales Manager", "Administrator"})
	if is_workspace_area_assignment_link(link_type, link_to):
		if user_bypasses_role_gating(user):
			return True
		if _user_is_imogi_owner(user) or _user_is_imogi_area_manager(user):
			return True
		return bool(set(frappe.get_roles(user)) & {"Sales Manager", "Administrator"})
	resolved = get_workspace_link_feature_id(
		link_type, link_to, label=label, feature_id=feature_id
	)
	if not resolved:
		return _is_frappe_link_permitted(link_type, link_to, user)
	if not is_role_allowed_for_feature(resolved, user=user, settings=settings):
		return False
	return _is_frappe_link_permitted(link_type, link_to, user)


def serialize_workspace_link_access(tier: str | None = None, user: str | None = None) -> dict:
	from imogi_pos.imogi_pos.utils.deployment_mode import is_subscription_tier_disabled

	user = user or getattr(frappe.session, "user", None)
	if is_subscription_tier_disabled():
		return {"tier": None, "tiers": [], "tier_disabled": True, "links": {}}

	tier = tier or get_subscription_tier()
	links: dict[str, dict] = {}
	for (link_type, link_to), feature_id in WORKSPACE_LINK_FEATURES.items():
		key = f"{link_type}/{link_to}"
		feature = get_feature(feature_id) if feature_id else None
		allowed = is_workspace_item_allowed_for_user(link_type, link_to, tier, user)
		links[key] = {
			"allowed": allowed,
			"feature_id": feature_id,
			"min_tier": (feature or {}).get("min_tier"),
			"label": (feature or {}).get("label"),
		}
	return {"tier": tier, "tiers": list(SUBSCRIPTION_TIERS), "links": links}


def _filter_link_items(
	items: list, link_type_key: str, tier: str | None, user: str | None = None
) -> list:
	filtered = []
	for item in items:
		link_type = item.get(link_type_key) or item.get("type")
		link_to = item.get("link_to")
		if is_workspace_item_allowed_for_user(
			link_type,
			link_to,
			tier,
			user,
			label=item.get("label"),
			feature_id=item.get("feature_id"),
		):
			filtered.append(item)
	return filtered


def filter_workspace_content_blocks(
	content_json: str | None, tier: str | None = None, user: str | None = None
) -> str:
	"""Drop shortcut/card EditorJS blocks that are not in the active subscription tier."""
	from imogi_pos.imogi_pos.utils.workspace_catalog import WORKSPACE_SECTIONS, WORKSPACE_SHORTCUTS

	tier = tier or get_subscription_tier()
	try:
		blocks = json.loads(content_json or "[]")
	except json.JSONDecodeError:
		return "[]"

	shortcut_map = {row["label"]: row for row in WORKSPACE_SHORTCUTS}
	section_map = {section["label"]: section for section in WORKSPACE_SECTIONS}

	filtered = []
	for block in blocks:
		block_type = block.get("type")
		data = block.get("data") or {}
		if block_type == "shortcut":
			shortcut = shortcut_map.get(data.get("shortcut_name"))
			if shortcut and is_workspace_item_allowed_for_user(
				shortcut.get("type"),
				shortcut.get("link_to"),
				tier,
				user,
				label=shortcut.get("label"),
				feature_id=shortcut.get("feature_id"),
			):
				filtered.append(block)
			continue
		if block_type == "card":
			section = _resolve_workspace_section(section_map, data.get("card_name"))
			if section and any(
				is_workspace_item_allowed_for_user(
					link["link_type"],
					link["link_to"],
					tier,
					user,
					label=link.get("label"),
					feature_id=link.get("feature_id"),
				)
				for link in section.get("links", [])
			):
				filtered.append(block)
			continue
		filtered.append(block)

	return json.dumps(filtered, ensure_ascii=False)


def apply_workspace_tier_filters(
	page_data: dict,
	tier: str | None = None,
	*,
	content_json: str | None = None,
	user: str | None = None,
) -> dict:
	"""Remove workspace shortcuts/cards blocked by tier or role."""
	if not page_data:
		return page_data

	tier = tier or get_subscription_tier()
	user = user or getattr(frappe.session, "user", None)
	page_data = frappe._dict(page_data)

	shortcuts = page_data.get("shortcuts") or {}
	if shortcuts.get("items"):
		shortcuts["items"] = _filter_link_items(shortcuts["items"], "type", tier, user)

	cards = page_data.get("cards") or {}
	new_cards = []
	for card in cards.get("items") or []:
		links = _filter_link_items(card.get("links") or [], "link_type", tier, user)
		if links:
			new_card = dict(card)
			new_card["links"] = links
			new_cards.append(new_card)
	cards["items"] = new_cards

	if content_json is not None:
		page_data["imogi_pos_filtered_content"] = filter_workspace_content_blocks(
			content_json, tier, user
		)

	from imogi_pos.imogi_pos.utils.deployment_mode import is_subscription_tier_disabled

	if not is_subscription_tier_disabled():
		page_data["imogi_pos_tier"] = tier
		page_data["imogi_pos_tier_label"] = tier
	return page_data
