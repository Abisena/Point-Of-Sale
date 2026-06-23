# Copyright (c) 2026, Imogi and contributors
"""Master IMOGI POS workspace links — one label per target, role filter at runtime."""

from __future__ import annotations

import json

WORKSPACE_SECTIONS = [
	{
		"label": "Dashboard & Laporan",
		"links": [
			{
				"label": "Dashboard & Analitik",
				"link_type": "Page",
				"link_to": "imogi-pos-dashboard",
				"dashboard_focus": "sales",
				"onboard": 1,
			},
			{
				"label": "Laporan Penjualan",
				"link_type": "Page",
				"link_to": "imogi-pos-sales-report",
				"feature_id": "sales_report",
				"onboard": 1,
			},
			{
				"label": "Penjualan Harian UMKM",
				"link_type": "Report",
				"link_to": "IMOGI UMKM Daily Sales",
				"is_query_report": 1,
				"feature_id": "sales_report",
			},
			{
				"label": "Order Summary",
				"link_type": "Report",
				"link_to": "IMOGI POS Order Summary",
				"is_query_report": 1,
				"feature_id": "sales_report",
			},
			{
				"label": "Ringkasan Penjualan Cabang",
				"link_type": "Report",
				"link_to": "IMOGI Branch Sales Summary",
				"is_query_report": 1,
				"feature_id": "multi_outlet",
			},
		],
	},
	{
		"label": "Kasir & Penjualan",
		"links": [
			{"label": "IMOGI Kasir", "link_type": "Page", "link_to": "imogi-pos-cashier", "feature_id": "pos_order", "onboard": 1},
			{
				"label": "Riwayat Transaksi",
				"link_type": "Page",
				"link_to": "imogi-pos-order-history",
				"feature_id": "order_history",
				"onboard": 1,
			},
			{"label": "POS Invoice", "link_type": "DocType", "link_to": "POS Invoice", "feature_id": "pos_order"},
			{"label": "Buka Shift", "link_type": "Page", "link_to": "imogi-pos-open-shift", "feature_id": "open_shift"},
			{"label": "Tutup Shift", "link_type": "Page", "link_to": "imogi-pos-close-shift", "feature_id": "close_shift"},
		],
	},
	{
		"label": "Supervisi & Kontrol",
		"links": [
			{
				"label": "Manajemen Order",
				"link_type": "DocType",
				"link_to": "Riwayat Order",
				"feature_id": "order_management",
				"onboard": 1,
			},
			{
				"label": "Approval Request",
				"link_type": "DocType",
				"link_to": "IMOGI POS Approval Request",
				"feature_id": "approval_void",
			},
		],
	},
	{
		"label": "Kitchen & Fulfillment",
		"links": [
			{"label": "Kitchen Display", "link_type": "Page", "link_to": "kitchen-display", "feature_id": "kitchen_display", "onboard": 1},
			{"label": "Kitchen Order", "link_type": "DocType", "link_to": "IMOGI Kitchen Order", "feature_id": "kitchen_queue"},
			{"label": "Kitchen Station", "link_type": "DocType", "link_to": "IMOGI Kitchen Station", "feature_id": "kitchen_station"},
			{"label": "Fulfillment Queue", "link_type": "Page", "link_to": "fulfillment-queue", "feature_id": "delivery_order", "onboard": 1},
			{"label": "Fulfillment Task", "link_type": "DocType", "link_to": "IMOGI Fulfillment Task", "feature_id": "delivery_order"},
			{"label": "Delivery Task", "link_type": "DocType", "link_to": "IMOGI Delivery Task", "feature_id": "delivery_order"},
		],
	},
	{
		"label": "Meja & Layanan",
		"links": [
			{"label": "Table Service", "link_type": "Page", "link_to": "table-service", "feature_id": "table_management", "onboard": 1},
			{"label": "Restaurant Table", "link_type": "DocType", "link_to": "IMOGI Restaurant Table", "feature_id": "table_management"},
			{"label": "Table Reservation", "link_type": "DocType", "link_to": "IMOGI POS Table Reservation", "feature_id": "table_reservation"},
			{"label": "Waiting List", "link_type": "DocType", "link_to": "IMOGI POS Waiting List", "feature_id": "waiting_list"},
		],
	},
	{
		"label": "Menu & Produk",
		"links": [
			{"label": "Menu Produk", "link_type": "Page", "link_to": "imogi-pos-menu", "feature_id": "menu", "onboard": 1},
			{"label": "Kategori Menu", "link_type": "Page", "link_to": "imogi-pos-menu-category", "feature_id": "menu_category"},
			{"label": "Item / Produk", "link_type": "DocType", "link_to": "Item", "feature_id": "menu"},
			{"label": "Combo Package", "link_type": "DocType", "link_to": "IMOGI POS Combo Package", "feature_id": "combo_package"},
			{"label": "BOM / Recipe", "link_type": "DocType", "link_to": "BOM", "feature_id": "recipe_management"},
		],
	},
	{
		"label": "Loyalty & Promo",
		"links": [
			{"label": "Loyalty Member", "link_type": "DocType", "link_to": "IMOGI POS Loyalty Member", "feature_id": "membership"},
			{"label": "Loyalty Tier", "link_type": "DocType", "link_to": "IMOGI POS Loyalty Tier", "feature_id": "membership_tier"},
			{"label": "Voucher", "link_type": "DocType", "link_to": "IMOGI POS Voucher", "feature_id": "voucher"},
			{"label": "Promo Rule", "link_type": "DocType", "link_to": "IMOGI POS Promo Rule", "feature_id": "voucher"},
			{"label": "Loyalty Transaction", "link_type": "DocType", "link_to": "IMOGI POS Loyalty Transaction", "feature_id": "point_reward"},
		],
	},
	{
		"label": "Shift & Tutup Hari",
		"links": [
			{"label": "IMOGI Shift Opening", "link_type": "DocType", "link_to": "IMOGI POS Shift Opening", "feature_id": "open_shift"},
			{"label": "IMOGI Shift Closing", "link_type": "DocType", "link_to": "IMOGI POS Shift Closing", "feature_id": "close_shift"},
			{"label": "POS Opening Entry", "link_type": "DocType", "link_to": "POS Opening Entry", "feature_id": "open_shift"},
			{"label": "POS Closing Entry", "link_type": "DocType", "link_to": "POS Closing Entry", "feature_id": "end_of_day"},
		],
	},
	{
		"label": "Inventori & Stok",
		"links": [
			{"label": "Stock Entry", "link_type": "DocType", "link_to": "Stock Entry", "feature_id": "waste_management"},
			{"label": "Stock Reconciliation", "link_type": "DocType", "link_to": "Stock Reconciliation", "feature_id": "stock_opname"},
			{"label": "Stock Ledger", "link_type": "Report", "link_to": "Stock Ledger", "is_query_report": 1, "feature_id": "stock_raw"},
			{"label": "Batch", "link_type": "DocType", "link_to": "Batch", "feature_id": "batch_tracking"},
		],
	},
	{
		"label": "Pembelian",
		"links": [
			{"label": "Supplier", "link_type": "DocType", "link_to": "Supplier", "feature_id": "supplier"},
			{"label": "Purchase Request", "link_type": "DocType", "link_to": "Material Request", "feature_id": "purchase_request"},
			{"label": "Purchase Order", "link_type": "DocType", "link_to": "Purchase Order", "feature_id": "purchase_order"},
			{"label": "Receiving Barang", "link_type": "DocType", "link_to": "Purchase Receipt", "feature_id": "goods_receiving"},
		],
	},
	{
		"label": "Keuangan & Audit",
		"links": [
			{"label": "Kas & Bank", "link_type": "DocType", "link_to": "Payment Entry", "feature_id": "cash_bank"},
			{"label": "Hutang Supplier", "link_type": "DocType", "link_to": "Purchase Invoice", "feature_id": "supplier_payable"},
			{"label": "Sales Invoice", "link_type": "DocType", "link_to": "Sales Invoice", "feature_id": "accounting_integration"},
			{"label": "Royalty Accrual", "link_type": "DocType", "link_to": "IMOGI POS Royalty Accrual", "feature_id": "supplier_payable"},
			{
				"label": "Profit and Loss",
				"link_type": "Report",
				"link_to": "Profit and Loss Statement",
				"is_query_report": 1,
				"feature_id": "profit_loss",
			},
			{"label": "Cash Flow", "link_type": "Report", "link_to": "Cash Flow", "is_query_report": 1, "feature_id": "cash_flow"},
			{"label": "Sales Register", "link_type": "Report", "link_to": "Sales Register", "is_query_report": 1, "feature_id": "tax_report"},
			{"label": "Version Log", "link_type": "DocType", "link_to": "Version", "feature_id": "audit_log"},
			{"label": "Activity Log", "link_type": "DocType", "link_to": "Activity Log", "feature_id": "login_history"},
		],
	},
	{
		"label": "Multi Outlet",
		"links": [
			{"label": "Penugasan Area Manager", "link_type": "DocType", "link_to": "IMOGI Area Manager Assignment"},
			{"label": "IMOGI Branch", "link_type": "DocType", "link_to": "IMOGI Branch", "feature_id": "multi_outlet"},
			{"label": "Tambah Company & Cabang", "link_type": "Page", "link_to": "imogi-pos-add-branch", "feature_id": "multi_outlet"},
		],
	},
	{
		"label": "Integrasi & Payment",
		"links": [
			{"label": "QRIS / Payment Gateway", "link_type": "DocType", "link_to": "IMOGI POS Gateway Payment", "feature_id": "qris"},
			{"label": "Offline Checkout Log", "link_type": "DocType", "link_to": "IMOGI POS Offline Checkout", "feature_id": "api_access"},
			{"label": "Subscription Event", "link_type": "DocType", "link_to": "IMOGI POS Subscription Event", "feature_id": "api_access"},
		],
	},
	{
		"label": "Pengaturan Sistem",
		"links": [
			{"label": "IMOGI POS Settings", "link_type": "DocType", "link_to": "IMOGI POS Settings"},
			{"label": "Matrix Paket & Fitur", "link_type": "Page", "link_to": "imogi-pos-feature-matrix"},
			{"label": "Setup Wizard", "link_type": "Page", "link_to": "imogi-pos-setup"},
		],
	},
]

WORKSPACE_SHORTCUTS = [
	{
		"color": "Blue",
		"label": "Dashboard & Analitik",
		"link_to": "imogi-pos-dashboard",
		"type": "Page",
		"dashboard_focus": "sales",
	},
	{"color": "Green", "label": "Laporan Penjualan", "link_to": "imogi-pos-sales-report", "type": "Page", "feature_id": "sales_report"},
	{"color": "Orange", "label": "IMOGI Kasir", "link_to": "imogi-pos-cashier", "type": "Page", "feature_id": "pos_order"},
	{"color": "Yellow", "label": "Riwayat Transaksi", "link_to": "imogi-pos-order-history", "type": "Page", "feature_id": "order_history"},
	{"color": "Purple", "label": "Menu Produk", "link_to": "imogi-pos-menu", "type": "Page", "feature_id": "menu"},
	{"color": "Red", "label": "Kitchen Display", "link_to": "kitchen-display", "type": "Page", "feature_id": "kitchen_display"},
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
			'<span class="text-muted">Modul IMOGI POS — satu menu per halaman, akses menyesuaikan role.</span>'
		)
	else:
		header = (
			'<span class="h4"><b>IMOGI POS — Restoran &amp; Cafe</b></span><br>'
			'<span class="text-muted">Modul IMOGI POS — satu menu per halaman, akses menyesuaikan role.</span>'
		)

	blocks = [
		{"id": "hdr", "type": "header", "data": {"text": header, "col": 12}},
	]
	if variant == "umkm":
		blocks.extend(
			[
				{"id": "sc1", "type": "shortcut", "data": {"shortcut_name": "IMOGI Kasir", "col": 3}},
				{"id": "sc2", "type": "shortcut", "data": {"shortcut_name": "Riwayat Transaksi", "col": 3}},
				{"id": "sc3", "type": "shortcut", "data": {"shortcut_name": "Dashboard & Analitik", "col": 3}},
				{"id": "sc4", "type": "shortcut", "data": {"shortcut_name": "IMOGI POS Settings", "col": 3}},
			]
		)
	else:
		blocks.extend(
			[
				{"id": "sc1", "type": "shortcut", "data": {"shortcut_name": "IMOGI Kasir", "col": 2}},
				{"id": "sc2", "type": "shortcut", "data": {"shortcut_name": "Riwayat Transaksi", "col": 2}},
				{"id": "sc3", "type": "shortcut", "data": {"shortcut_name": "Kitchen Display", "col": 2}},
				{"id": "sc4", "type": "shortcut", "data": {"shortcut_name": "Dashboard & Analitik", "col": 2}},
				{"id": "sc5", "type": "shortcut", "data": {"shortcut_name": "Menu Produk", "col": 2}},
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
	shortcuts = WORKSPACE_SHORTCUTS
	if variant == "umkm":
		shortcuts = [
			row
			for row in WORKSPACE_SHORTCUTS
			if row.get("feature_id") not in {"kitchen_display"}
		]
	return {
		"icon": "retail",
		"content": build_workspace_content(variant=variant),
		"links": build_workspace_links(),
		"shortcuts": shortcuts,
	}
