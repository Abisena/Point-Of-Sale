# Copyright (c) 2026, Imogi and contributors
"""Master IMOGI POS workspace links — tier visibility applied at runtime."""

from __future__ import annotations

import json

WORKSPACE_SECTIONS = [
	{
		"label": "Tier Free",
		"links": [
			{
				"label": "Dashboard & Analitik",
				"link_type": "Page",
				"link_to": "imogi-pos-dashboard",
				"feature_id": "dashboard_sales",
				"dashboard_focus": "sales",
				"onboard": 1,
			},
			{"label": "Laporan Penjualan", "link_type": "Page", "link_to": "imogi-pos-sales-report", "onboard": 1},
			{"label": "Menu Produk", "link_type": "Page", "link_to": "imogi-pos-menu", "onboard": 1},
			{"label": "Kategori Menu", "link_type": "Page", "link_to": "imogi-pos-menu-category", "onboard": 1},
			{"label": "IMOGI Kasir", "link_type": "Page", "link_to": "imogi-pos-cashier", "onboard": 1},
			{"label": "Riwayat Order", "link_type": "Page", "link_to": "imogi-pos-order-history", "onboard": 1},
		],
	},
	{
		"label": "Operasional Harian",
		"links": [
			{"label": "IMOGI Kasir", "link_type": "Page", "link_to": "imogi-pos-cashier", "onboard": 1},
			{"label": "Riwayat Order", "link_type": "DocType", "link_to": "Riwayat Order", "onboard": 1},
			{
				"label": "Dashboard & Analitik",
				"link_type": "Page",
				"link_to": "imogi-pos-dashboard",
				"feature_id": "dashboard_sales",
				"dashboard_focus": "sales",
			},
			{"label": "POS Invoice", "link_type": "DocType", "link_to": "POS Invoice"},
		],
	},
	{
		"label": "Kitchen & Fulfillment",
		"links": [
			{"label": "Kitchen Display", "link_type": "Page", "link_to": "kitchen-display", "onboard": 1},
			{"label": "Kitchen Order", "link_type": "DocType", "link_to": "IMOGI Kitchen Order"},
			{"label": "Kitchen Station", "link_type": "DocType", "link_to": "IMOGI Kitchen Station"},
			{"label": "Fulfillment Queue", "link_type": "Page", "link_to": "fulfillment-queue", "onboard": 1},
			{"label": "Fulfillment Task", "link_type": "DocType", "link_to": "IMOGI Fulfillment Task"},
			{"label": "Delivery Task", "link_type": "DocType", "link_to": "IMOGI Delivery Task"},
		],
	},
	{
		"label": "Meja & Layanan",
		"links": [
			{"label": "Restaurant Table", "link_type": "DocType", "link_to": "IMOGI Restaurant Table"},
			{"label": "Combo Package", "link_type": "DocType", "link_to": "IMOGI POS Combo Package"},
			{"label": "Table Reservation", "link_type": "DocType", "link_to": "IMOGI POS Table Reservation"},
			{"label": "Waiting List", "link_type": "DocType", "link_to": "IMOGI POS Waiting List"},
			{"label": "Item / Produk", "link_type": "DocType", "link_to": "Item"},
		],
	},
	{
		"label": "Loyalty & Promo",
		"links": [
			{"label": "Loyalty Member", "link_type": "DocType", "link_to": "IMOGI POS Loyalty Member"},
			{"label": "Loyalty Tier", "link_type": "DocType", "link_to": "IMOGI POS Loyalty Tier"},
			{"label": "Voucher", "link_type": "DocType", "link_to": "IMOGI POS Voucher"},
			{"label": "Promo Rule", "link_type": "DocType", "link_to": "IMOGI POS Promo Rule"},
			{"label": "Loyalty Transaction", "link_type": "DocType", "link_to": "IMOGI POS Loyalty Transaction"},
		],
	},
	{
		"label": "Shift & Tutup Hari",
		"links": [
			{"label": "Buka Shift (Kasir)", "link_type": "Page", "link_to": "imogi-pos-open-shift"},
			{"label": "Tutup Shift (Kasir)", "link_type": "Page", "link_to": "imogi-pos-close-shift"},
			{"label": "IMOGI Shift Opening", "link_type": "DocType", "link_to": "IMOGI POS Shift Opening"},
			{"label": "IMOGI Shift Closing", "link_type": "DocType", "link_to": "IMOGI POS Shift Closing"},
			{"label": "POS Opening Entry", "link_type": "DocType", "link_to": "POS Opening Entry"},
			{"label": "POS Closing Entry", "link_type": "DocType", "link_to": "POS Closing Entry"},
		],
	},
	{
		"label": "Pengaturan Sistem",
		"links": [
			{"label": "IMOGI POS Settings", "link_type": "DocType", "link_to": "IMOGI POS Settings"},
			{"label": "Matrix Paket & Fitur", "link_type": "Page", "link_to": "imogi-pos-feature-matrix"},
			{"label": "IMOGI Branch", "link_type": "DocType", "link_to": "IMOGI Branch"},
			{"label": "Tambah Company & Cabang", "link_type": "Page", "link_to": "imogi-pos-add-branch"},
			{"label": "Setup Wizard", "link_type": "Page", "link_to": "imogi-pos-setup"},
			{"label": "Approval Request", "link_type": "DocType", "link_to": "IMOGI POS Approval Request"},
			{"label": "Gateway Payment", "link_type": "DocType", "link_to": "IMOGI POS Gateway Payment"},
			{"label": "Offline Checkout Log", "link_type": "DocType", "link_to": "IMOGI POS Offline Checkout"},
			{"label": "Subscription Event", "link_type": "DocType", "link_to": "IMOGI POS Subscription Event"},
		],
	},
	{
		"label": "Laporan & Analitik",
		"links": [
			{
				"label": "Dashboard & Analitik",
				"link_type": "Page",
				"link_to": "imogi-pos-dashboard",
				"feature_id": "dashboard_sales",
				"dashboard_focus": "sales",
			},
			{"label": "Laporan Penjualan", "link_type": "Page", "link_to": "imogi-pos-sales-report", "feature_id": "sales_report"},
			{"label": "Penjualan Harian UMKM", "link_type": "Report", "link_to": "IMOGI UMKM Daily Sales", "is_query_report": 1},
			{"label": "Order Summary", "link_type": "Report", "link_to": "IMOGI POS Order Summary", "is_query_report": 1},
			{"label": "Ringkasan Penjualan Cabang", "link_type": "Report", "link_to": "IMOGI Branch Sales Summary", "is_query_report": 1},
		],
	},
	{
		"label": "Modul Kasir",
		"links": [
			{"label": "POS Order / Kasir", "link_type": "Page", "link_to": "imogi-pos-cashier", "feature_id": "pos_order"},
			{"label": "Riwayat Order", "link_type": "Page", "link_to": "imogi-pos-order-history", "feature_id": "order_history"},
			{"label": "Customer", "link_type": "Page", "link_to": "imogi-pos-cashier", "feature_id": "customer"},
			{"label": "Take Away", "link_type": "Page", "link_to": "imogi-pos-cashier", "feature_id": "take_away"},
			{"label": "Delivery Order", "link_type": "Page", "link_to": "imogi-pos-cashier", "feature_id": "delivery_order"},
			{"label": "Hold Order", "link_type": "Page", "link_to": "imogi-pos-cashier", "feature_id": "hold_order"},
			{"label": "Multi Payment", "link_type": "Page", "link_to": "imogi-pos-cashier", "feature_id": "multi_payment"},
			{"label": "Split Bill", "link_type": "Page", "link_to": "imogi-pos-cashier", "feature_id": "split_bill"},
			{"label": "Buka Shift", "link_type": "Page", "link_to": "imogi-pos-open-shift", "feature_id": "open_shift"},
			{"label": "Tutup Shift", "link_type": "Page", "link_to": "imogi-pos-close-shift", "feature_id": "close_shift"},
			{"label": "Cash In/Out", "link_type": "Page", "link_to": "imogi-pos-close-shift", "feature_id": "cash_in_out"},
		],
	},
	{
		"label": "Modul Manager",
		"links": [
			{
				"label": "Dashboard Operasional",
				"link_type": "Page",
				"link_to": "imogi-pos-dashboard",
				"feature_id": "dashboard_operational",
				"dashboard_focus": "operational",
			},
			{"label": "Menu Produk", "link_type": "Page", "link_to": "imogi-pos-menu", "feature_id": "menu"},
			{"label": "Kategori Menu", "link_type": "Page", "link_to": "imogi-pos-menu-category", "feature_id": "menu_category"},
			{"label": "Modifier Produk", "link_type": "DocType", "link_to": "Item", "feature_id": "modifier"},
			{"label": "Add-On Produk", "link_type": "Page", "link_to": "imogi-pos-menu", "feature_id": "add_on"},
			{"label": "Combo Package", "link_type": "DocType", "link_to": "IMOGI POS Combo Package", "feature_id": "combo_package"},
			{"label": "Membership", "link_type": "DocType", "link_to": "IMOGI POS Loyalty Member", "feature_id": "membership"},
			{"label": "Stock Forecast", "link_type": "Report", "link_to": "Stock Ledger", "is_query_report": 1, "feature_id": "stock_forecast"},
			{"label": "Voucher", "link_type": "DocType", "link_to": "IMOGI POS Voucher", "feature_id": "voucher"},
			{"label": "Point Reward", "link_type": "DocType", "link_to": "IMOGI POS Loyalty Transaction", "feature_id": "point_reward"},
			{"label": "Cashback", "link_type": "Page", "link_to": "imogi-pos-settings", "feature_id": "cashback"},
			{"label": "Birthday Promo", "link_type": "Page", "link_to": "imogi-pos-settings", "feature_id": "birthday_promo"},
			{"label": "Membership Tier", "link_type": "DocType", "link_to": "IMOGI POS Loyalty Tier", "feature_id": "membership_tier"},
		],
	},
	{
		"label": "Multi Outlet (Area Manager)",
		"links": [
			{"label": "Penugasan Area Manager", "link_type": "DocType", "link_to": "IMOGI Area Manager Assignment"},
			{"label": "Multi Outlet / Cabang", "link_type": "DocType", "link_to": "IMOGI Branch", "feature_id": "multi_outlet"},
			{"label": "Tambah Company & Cabang", "link_type": "Page", "link_to": "imogi-pos-add-branch", "feature_id": "multi_outlet"},
			{"label": "Ringkasan Penjualan Cabang", "link_type": "Report", "link_to": "IMOGI Branch Sales Summary", "is_query_report": 1, "feature_id": "multi_outlet"},
			{"label": "Central Kitchen", "link_type": "Page", "link_to": "imogi-pos-settings", "feature_id": "central_kitchen"},
			{"label": "Central Inventory", "link_type": "DocType", "link_to": "IMOGI Branch", "feature_id": "central_inventory"},
			{"label": "Central Purchasing", "link_type": "DocType", "link_to": "Material Request", "feature_id": "central_purchasing"},
			{"label": "Central Menu Management", "link_type": "Page", "link_to": "imogi-pos-settings", "feature_id": "central_menu_management"},
		],
	},
	{
		"label": "Integrasi Owner",
		"links": [
			{"label": "QRIS / Payment Gateway", "link_type": "DocType", "link_to": "IMOGI POS Gateway Payment", "feature_id": "qris"},
			{"label": "GoFood Integration", "link_type": "Page", "link_to": "imogi-pos-settings", "feature_id": "gofood_integration"},
			{"label": "GrabFood Integration", "link_type": "Page", "link_to": "imogi-pos-settings", "feature_id": "grabfood_integration"},
			{"label": "Integrasi Akuntansi", "link_type": "DocType", "link_to": "Sales Invoice", "feature_id": "accounting_integration"},
		],
	},
	{
		"label": "Inventori & Pembelian",
		"links": [
			{"label": "BOM / Recipe", "link_type": "DocType", "link_to": "BOM"},
			{"label": "Stock Entry", "link_type": "DocType", "link_to": "Stock Entry"},
			{"label": "Stock Ledger", "link_type": "Report", "link_to": "Stock Ledger", "is_query_report": 1},
			{"label": "Stock Reconciliation", "link_type": "DocType", "link_to": "Stock Reconciliation"},
			{"label": "Batch", "link_type": "DocType", "link_to": "Batch"},
			{"label": "Supplier", "link_type": "DocType", "link_to": "Supplier"},
			{"label": "Material Request", "link_type": "DocType", "link_to": "Material Request"},
			{"label": "Purchase Order", "link_type": "DocType", "link_to": "Purchase Order"},
			{"label": "Purchase Receipt", "link_type": "DocType", "link_to": "Purchase Receipt"},
		],
	},
	{
		"label": "Keuangan & Audit",
		"links": [
			{"label": "Payment Entry", "link_type": "DocType", "link_to": "Payment Entry"},
			{"label": "Purchase Invoice", "link_type": "DocType", "link_to": "Purchase Invoice"},
			{"label": "Royalty Accrual", "link_type": "DocType", "link_to": "IMOGI POS Royalty Accrual"},
			{"label": "Profit and Loss", "link_type": "Report", "link_to": "Profit and Loss Statement", "is_query_report": 1},
			{"label": "Cash Flow", "link_type": "Report", "link_to": "Cash Flow", "is_query_report": 1},
			{"label": "Sales Register", "link_type": "Report", "link_to": "Sales Register", "is_query_report": 1},
			{"label": "Version Log", "link_type": "DocType", "link_to": "Version"},
			{"label": "Activity Log", "link_type": "DocType", "link_to": "Activity Log"},
		],
	},
]

WORKSPACE_SHORTCUTS = [
	{
		"color": "Blue",
		"label": "Dashboard & Analitik",
		"link_to": "imogi-pos-dashboard",
		"type": "Page",
		"feature_id": "dashboard_sales",
		"dashboard_focus": "sales",
	},
	{"color": "Green", "label": "Laporan Penjualan", "link_to": "imogi-pos-sales-report", "type": "Page"},
	{"color": "Purple", "label": "Menu Produk", "link_to": "imogi-pos-menu", "type": "Page"},
	{"color": "Cyan", "label": "Kategori Menu", "link_to": "imogi-pos-menu-category", "type": "Page"},
	{"color": "Orange", "label": "IMOGI Kasir", "link_to": "imogi-pos-cashier", "type": "Page"},
	{"color": "Yellow", "label": "Riwayat Order", "link_to": "imogi-pos-order-history", "type": "Page"},
	{"color": "Orange", "label": "Riwayat Order", "link_to": "Riwayat Order", "type": "DocType"},
	{"color": "Red", "label": "Kitchen Display", "link_to": "kitchen-display", "type": "Page"},
	{"color": "Yellow", "label": "Fulfillment Queue", "link_to": "fulfillment-queue", "type": "Page"},
	{"color": "Grey", "label": "IMOGI POS Settings", "link_to": "IMOGI POS Settings", "type": "DocType"},
]


def build_workspace_links() -> list[dict]:
	rows: list[dict] = []
	for section in WORKSPACE_SECTIONS:
		links = section["links"]
		rows.append(
			{
				"hidden": 0,
				"is_query_report": 0,
				"label": section["label"],
				"link_count": len(links),
				"onboard": 0,
				"type": "Card Break",
			}
		)
		for link in links:
			row = {
				"hidden": 0,
				"is_query_report": link.get("is_query_report", 0),
				"label": link["label"],
				"link_count": 0,
				"link_to": link["link_to"],
				"link_type": link["link_type"],
				"onboard": link.get("onboard", 0),
				"type": "Link",
			}
			rows.append(row)
	return rows


def build_workspace_content(*, variant: str = "restaurant") -> str:
	if variant == "umkm":
		header = (
			'<span class="h4"><b>IMOGI POS — UMKM</b></span><br>'
			'<span class="text-muted">Semua modul IMOGI POS — akses menyesuaikan role pengguna.</span>'
		)
	else:
		header = (
			'<span class="h4"><b>IMOGI POS — Restoran &amp; Cafe</b></span><br>'
			'<span class="text-muted">Semua modul IMOGI POS — akses menyesuaikan role pengguna.</span>'
		)

	blocks = [
		{"id": "hdr", "type": "header", "data": {"text": header, "col": 12}},
	]
	if variant == "umkm":
		blocks.extend(
			[
				{"id": "sc1", "type": "shortcut", "data": {"shortcut_name": "IMOGI Kasir", "col": 3}},
				{"id": "sc2", "type": "shortcut", "data": {"shortcut_name": "Riwayat Order", "col": 3}},
				{"id": "sc3", "type": "shortcut", "data": {"shortcut_name": "Dashboard & Analitik", "col": 3}},
				{"id": "sc4", "type": "shortcut", "data": {"shortcut_name": "IMOGI POS Settings", "col": 3}},
			]
		)
	else:
		blocks.extend(
			[
				{"id": "sc1", "type": "shortcut", "data": {"shortcut_name": "IMOGI Kasir", "col": 2}},
				{"id": "sc2", "type": "shortcut", "data": {"shortcut_name": "Riwayat Order", "col": 2}},
				{"id": "sc3", "type": "shortcut", "data": {"shortcut_name": "Kitchen Display", "col": 2}},
				{"id": "sc4", "type": "shortcut", "data": {"shortcut_name": "Fulfillment Queue", "col": 2}},
				{"id": "sc5", "type": "shortcut", "data": {"shortcut_name": "Dashboard & Analitik", "col": 2}},
				{"id": "sc6", "type": "shortcut", "data": {"shortcut_name": "IMOGI POS Settings", "col": 2}},
			]
		)
	blocks.extend(
		[
			{"id": "sp1", "type": "spacer", "data": {"col": 12}},
			{"id": "hdr_cards", "type": "header", "data": {"text": '<span class="h4"><b>Modul IMOGI POS</b></span>', "col": 12}},
		]
	)
	for idx, section in enumerate(WORKSPACE_SECTIONS, start=1):
		blocks.append(
			{
				"id": f"c{idx}",
				"type": "card",
				"data": {"card_name": section["label"], "col": 4},
			}
		)
	return json.dumps(blocks, ensure_ascii=False)


def build_workspace_profile(*, variant: str = "restaurant") -> dict:
	return {
		"icon": "retail",
		"content": build_workspace_content(variant=variant),
		"links": build_workspace_links(),
		"shortcuts": WORKSPACE_SHORTCUTS,
	}
