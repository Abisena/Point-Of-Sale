# Copyright (c) 2026, Imogi and contributors
"""Catalog of optional per-role desk authorizations (menu + DocType access)."""

from __future__ import annotations

from typing import TypedDict


class RoleAuthGrant(TypedDict):
	id: str
	label: str
	description: str
	feature_id: str
	doctype: str
	perms: dict[str, int]
	eligible_roles: tuple[str, ...]
	default_enabled: frozenset[str]


ROLE_AUTH_GRANTS: tuple[RoleAuthGrant, ...] = (
	{
		"id": "promo_rule",
		"label": "Promo Rule",
		"description": "Kelola aturan promo otomatis (Buy X Get Y) di desk",
		"feature_id": "voucher",
		"doctype": "IMOGI POS Promo Rule",
		"perms": {"read": 1, "write": 1, "create": 1},
		"eligible_roles": (
			"IMOGI Cashier",
			"IMOGI Waiter",
			"IMOGI Supervisor",
			"IMOGI Manager",
			"IMOGI Area Manager",
		),
		"default_enabled": frozenset({"IMOGI Manager", "IMOGI Area Manager"}),
	},
	{
		"id": "voucher",
		"label": "Voucher",
		"description": "Kelola kode voucher promo",
		"feature_id": "voucher",
		"doctype": "IMOGI POS Voucher",
		"perms": {"read": 1, "write": 1, "create": 1},
		"eligible_roles": (
			"IMOGI Cashier",
			"IMOGI Supervisor",
			"IMOGI Manager",
			"IMOGI Area Manager",
		),
		"default_enabled": frozenset({"IMOGI Manager", "IMOGI Area Manager"}),
	},
	{
		"id": "loyalty_member",
		"label": "Loyalty Member",
		"description": "Kelola data member loyalty",
		"feature_id": "membership",
		"doctype": "IMOGI POS Loyalty Member",
		"perms": {"read": 1, "write": 1, "create": 1},
		"eligible_roles": (
			"IMOGI Cashier",
			"IMOGI Waiter",
			"IMOGI Supervisor",
			"IMOGI Manager",
			"IMOGI Area Manager",
		),
		"default_enabled": frozenset({"IMOGI Manager", "IMOGI Area Manager", "IMOGI Cashier"}),
	},
	{
		"id": "loyalty_tier",
		"label": "Loyalty Tier",
		"description": "Kelola tier membership",
		"feature_id": "membership_tier",
		"doctype": "IMOGI POS Loyalty Tier",
		"perms": {"read": 1, "write": 1, "create": 1},
		"eligible_roles": ("IMOGI Supervisor", "IMOGI Manager", "IMOGI Area Manager"),
		"default_enabled": frozenset({"IMOGI Manager", "IMOGI Area Manager"}),
	},
	{
		"id": "combo_package",
		"label": "Combo Package",
		"description": "Kelola paket combo menu",
		"feature_id": "combo_package",
		"doctype": "IMOGI POS Combo Package",
		"perms": {"read": 1, "write": 1, "create": 1},
		"eligible_roles": ("IMOGI Supervisor", "IMOGI Manager", "IMOGI Area Manager"),
		"default_enabled": frozenset({"IMOGI Manager", "IMOGI Area Manager"}),
	},
	{
		"id": "menu_products",
		"label": "Menu Produk",
		"description": "Kelola item/produk menu dari desk",
		"feature_id": "menu",
		"doctype": "Item",
		"perms": {"read": 1, "write": 1, "create": 1},
		"eligible_roles": (
			"IMOGI Cashier",
			"IMOGI Supervisor",
			"IMOGI Manager",
			"IMOGI Area Manager",
			"IMOGI Inventory",
		),
		"default_enabled": frozenset(
			{"IMOGI Manager", "IMOGI Area Manager", "IMOGI Inventory"}
		),
	},
	{
		"id": "sales_report",
		"label": "Laporan Penjualan",
		"description": "Buka halaman laporan penjualan",
		"feature_id": "sales_report",
		"doctype": "",
		"perms": {},
		"eligible_roles": (
			"IMOGI Cashier",
			"IMOGI Supervisor",
			"IMOGI Manager",
			"IMOGI Area Manager",
			"IMOGI Finance",
			"IMOGI Auditor",
		),
		"default_enabled": frozenset(
			{
				"IMOGI Manager",
				"IMOGI Area Manager",
				"IMOGI Finance",
				"IMOGI Auditor",
				"IMOGI Supervisor",
			}
		),
	},
)

_GRANTS_BY_ID: dict[str, RoleAuthGrant] = {grant["id"]: grant for grant in ROLE_AUTH_GRANTS}
_FEATURE_TO_GRANTS: dict[str, list[str]] = {}
for _grant in ROLE_AUTH_GRANTS:
	_FEATURE_TO_GRANTS.setdefault(_grant["feature_id"], []).append(_grant["id"])


def get_role_auth_grants() -> tuple[RoleAuthGrant, ...]:
	return ROLE_AUTH_GRANTS


def get_role_auth_grant(grant_id: str) -> RoleAuthGrant | None:
	return _GRANTS_BY_ID.get((grant_id or "").strip())


def get_grant_ids_for_feature(feature_id: str) -> list[str]:
	return list(_FEATURE_TO_GRANTS.get((feature_id or "").strip(), []))
