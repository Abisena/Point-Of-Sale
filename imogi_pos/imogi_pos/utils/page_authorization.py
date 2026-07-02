# Copyright (c) 2026, Imogi and contributors
"""Per-role IMOGI POS page (menu) access, configurable from IMOGI POS Settings.

Unlike `role_authorization` (which grants DocType permissions), this module only
controls *which IMOGI POS desk pages a role is allowed to open*. It powers the
"dedicated" lock used by single-purpose users (e.g. Kitchen) so an admin can open
extra pages for a role from Settings without touching code.
"""

from __future__ import annotations

from typing import TypedDict

import frappe
from frappe.utils import cint

from imogi_pos.imogi_pos.utils.flow import get_settings


class PageAccessEntry(TypedDict):
	id: str
	label: str
	description: str
	eligible_roles: tuple[str, ...]
	default_enabled: frozenset[str]


# All IMOGI personas that can be configured in the matrix.
IMOGI_ROLES: tuple[str, ...] = (
	"IMOGI Owner",
	"IMOGI Area Manager",
	"IMOGI Manager",
	"IMOGI Supervisor",
	"IMOGI Finance",
	"IMOGI Inventory",
	"IMOGI Purchasing",
	"IMOGI Cashier",
	"IMOGI Waiter",
	"IMOGI Kitchen Staff",
	"IMOGI Chef",
	"IMOGI Fulfillment Staff",
	"IMOGI Rider",
	"IMOGI Auditor",
)

# Catalog of IMOGI POS desk pages that can be authorized per role.
# `id` is the desk route slug (the part after /app/).
PAGE_ACCESS_CATALOG: tuple[PageAccessEntry, ...] = (
	{
		"id": "imogi-pos-cashier",
		"label": "Kasir",
		"description": "Halaman transaksi kasir / POS",
		"eligible_roles": IMOGI_ROLES,
		"default_enabled": frozenset({"IMOGI Cashier", "IMOGI Supervisor", "IMOGI Manager", "IMOGI Area Manager"}),
	},
	{
		"id": "table-service",
		"label": "Table Service (Waiter)",
		"description": "Kelola meja dan pesanan waiter",
		"eligible_roles": IMOGI_ROLES,
		"default_enabled": frozenset({"IMOGI Waiter", "IMOGI Cashier", "IMOGI Supervisor", "IMOGI Manager"}),
	},
	{
		"id": "kitchen-display",
		"label": "Kitchen Display",
		"description": "Layar antrian dapur (KDS)",
		"eligible_roles": IMOGI_ROLES,
		"default_enabled": frozenset({"IMOGI Kitchen Staff", "IMOGI Chef", "IMOGI Supervisor", "IMOGI Manager"}),
	},
	{
		"id": "kitchen-order",
		"label": "Kitchen Order",
		"description": "Pantau & kelola seluruh order dapur",
		"eligible_roles": IMOGI_ROLES,
		"default_enabled": frozenset(
			{"IMOGI Kitchen Staff", "IMOGI Chef", "IMOGI Supervisor", "IMOGI Manager", "IMOGI Area Manager"}
		),
	},
	{
		"id": "kitchen-station",
		"label": "Kitchen Station",
		"description": "Kelola stasiun dapur, bar, pastry & grill",
		"eligible_roles": IMOGI_ROLES,
		"default_enabled": frozenset({"IMOGI Supervisor", "IMOGI Manager", "IMOGI Area Manager"}),
	},
	{
		"id": "fulfillment-queue",
		"label": "Antrian Fulfillment",
		"description": "Layar packing / fulfillment",
		"eligible_roles": IMOGI_ROLES,
		"default_enabled": frozenset({"IMOGI Fulfillment Staff", "IMOGI Supervisor", "IMOGI Manager"}),
	},
	{
		"id": "imogi-pos-dashboard",
		"label": "Dashboard",
		"description": "Dashboard ringkasan operasional",
		"eligible_roles": IMOGI_ROLES,
		"default_enabled": frozenset(
			{"IMOGI Owner", "IMOGI Area Manager", "IMOGI Manager", "IMOGI Supervisor", "IMOGI Finance"}
		),
	},
	{
		"id": "imogi-pos-menu",
		"label": "Menu & Produk",
		"description": "Kelola menu, produk, dan stok",
		"eligible_roles": IMOGI_ROLES,
		"default_enabled": frozenset({"IMOGI Manager", "IMOGI Area Manager", "IMOGI Inventory"}),
	},
	{
		"id": "imogi-pos-menu-category",
		"label": "Kategori Menu",
		"description": "Kelola kategori menu",
		"eligible_roles": IMOGI_ROLES,
		"default_enabled": frozenset({"IMOGI Manager", "IMOGI Area Manager", "IMOGI Inventory"}),
	},
	{
		"id": "imogi-pos-order-history",
		"label": "Riwayat Order",
		"description": "Daftar riwayat transaksi",
		"eligible_roles": IMOGI_ROLES,
		"default_enabled": frozenset(
			{"IMOGI Cashier", "IMOGI Supervisor", "IMOGI Manager", "IMOGI Area Manager", "IMOGI Auditor"}
		),
	},
	{
		"id": "imogi-pos-order-management",
		"label": "Manajemen Order",
		"description": "Kontrol, audit, void & refund transaksi",
		"eligible_roles": IMOGI_ROLES,
		"default_enabled": frozenset(
			{"IMOGI Supervisor", "IMOGI Manager", "IMOGI Area Manager", "IMOGI Auditor"}
		),
	},
	{
		"id": "imogi-pos-sales-report",
		"label": "Laporan Penjualan",
		"description": "Laporan penjualan & rekap",
		"eligible_roles": IMOGI_ROLES,
		"default_enabled": frozenset(
			{"IMOGI Manager", "IMOGI Area Manager", "IMOGI Finance", "IMOGI Auditor", "IMOGI Supervisor"}
		),
	},
	{
		"id": "imogi-pos-feature-matrix",
		"label": "Feature Matrix",
		"description": "Status fitur & langganan",
		"eligible_roles": IMOGI_ROLES,
		"default_enabled": frozenset({"IMOGI Owner", "IMOGI Manager", "IMOGI Area Manager"}),
	},
)

_PAGES_BY_ID: dict[str, PageAccessEntry] = {page["id"]: page for page in PAGE_ACCESS_CATALOG}

# Pages that are always reachable regardless of the matrix (shift/setup flow,
# the dedicated landing pages, etc.) so a locked user is never stranded.
ALWAYS_ALLOWED_PAGES: frozenset[str] = frozenset(
	{
		"imogi-pos-open-shift",
		"imogi-pos-close-shift",
		"imogi-pos-setup",
	}
)


def get_page_access_catalog() -> tuple[PageAccessEntry, ...]:
	return PAGE_ACCESS_CATALOG


def get_page_access_entry(page_id: str) -> PageAccessEntry | None:
	return _PAGES_BY_ID.get((page_id or "").strip())


def is_page_authorization_enabled(settings=None) -> bool:
	settings = settings or get_settings()
	return bool(cint(getattr(settings, "enable_page_authorization", 0)))


def _settings_page_map(settings) -> dict[tuple[str, str], bool]:
	rows = getattr(settings, "page_authorizations", None) or []
	mapping: dict[tuple[str, str], bool] = {}
	for row in rows:
		role = (getattr(row, "frappe_role", None) or "").strip()
		page_id = (getattr(row, "page_id", None) or "").strip()
		if not role or not page_id:
			continue
		mapping[(role, page_id)] = bool(cint(getattr(row, "enabled", 0)))
	return mapping


def is_page_enabled_for_role(role: str, page_id: str, settings=None) -> bool:
	page = get_page_access_entry(page_id)
	if not page or role not in page["eligible_roles"]:
		return False

	if not is_page_authorization_enabled(settings):
		return role in page["default_enabled"]

	settings = settings or get_settings()
	key = ((role or "").strip(), (page_id or "").strip())
	page_map = _settings_page_map(settings)
	if key in page_map:
		return page_map[key]
	return role in page["default_enabled"]


def get_allowed_pages_for_user(user: str | None = None, settings=None) -> list[str]:
	"""Return the IMOGI POS page slugs the user's roles may open."""
	user = user or getattr(frappe.session, "user", None)
	if not user or user == "Guest":
		return []

	settings = settings or get_settings()
	roles = set(frappe.get_roles(user))
	allowed: set[str] = set(ALWAYS_ALLOWED_PAGES)
	for page in PAGE_ACCESS_CATALOG:
		for role in roles:
			if is_page_enabled_for_role(role, page["id"], settings):
				allowed.add(page["id"])
				break
	return sorted(allowed)


def ensure_default_page_authorizations(settings_doc) -> None:
	"""Populate missing child rows using catalog defaults."""
	existing = {
		(
			(getattr(row, "frappe_role", None) or "").strip(),
			(getattr(row, "page_id", None) or "").strip(),
		)
		for row in (settings_doc.page_authorizations or [])
	}
	for page in PAGE_ACCESS_CATALOG:
		for role in page["eligible_roles"]:
			key = (role, page["id"])
			if key in existing:
				continue
			settings_doc.append(
				"page_authorizations",
				{
					"frappe_role": role,
					"page_id": page["id"],
					"enabled": 1 if role in page["default_enabled"] else 0,
				},
			)
			existing.add(key)


def serialize_page_authorization_matrix(settings=None) -> dict:
	settings = settings or get_settings()
	page_map = _settings_page_map(settings)
	pages = []
	for page in PAGE_ACCESS_CATALOG:
		roles = []
		for role in page["eligible_roles"]:
			key = (role, page["id"])
			enabled = page_map.get(key, role in page["default_enabled"])
			roles.append({"role": role, "enabled": bool(enabled)})
		pages.append(
			{
				"id": page["id"],
				"label": page["label"],
				"description": page["description"],
				"roles": roles,
			}
		)
	return {
		"enabled": is_page_authorization_enabled(settings),
		"pages": pages,
	}
