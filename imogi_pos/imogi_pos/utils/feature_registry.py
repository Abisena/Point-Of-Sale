# Copyright (c) 2026, Imogi and contributors
"""IMOGI POS F&B — subscription tier feature matrix (99 features).

Source of truth for Free / Starter / Professional / Enterprise gating.
Tier counts (cumulative): Free 7, Starter 15, Professional 79, Enterprise 99.

Status (honest progress for Matrix UI):
  built   = Sudah ada — Imogi UI/flow nyata atau integrasi POS yang dipakai operasional
  partial = Partial / Sebagian — capability ada (sering lewat ERPNext / API tipis) tapi UX Imogi belum lengkap
  planned = Belum ada — belum diimplementasi / belum dipakai di alur nyata

Note: APPROVAL lists 6 rows from the matrix screenshots (header says 8 total).
Add the remaining 2 when confirmed from the HTML matrix.
"""

from __future__ import annotations

import frappe
from frappe import _

from imogi_pos.imogi_pos.utils.flow import get_settings

SUBSCRIPTION_TIERS = ("Free", "Starter", "Professional", "Enterprise")

TIER_RANK = {name: index for index, name in enumerate(SUBSCRIPTION_TIERS)}

FEATURE_STATUS_BUILT = "built"
FEATURE_STATUS_PARTIAL = "partial"
FEATURE_STATUS_PLANNED = "planned"

# Hidden from workspace, feature matrix, and cashier UI (not in FEATURES catalog
# for GoFood/GrabFood — kept here so Settings marketplace fields stay hidden).
HIDDEN_UI_FEATURE_IDS = frozenset(
	{
		"gofood_integration",
		"grabfood_integration",
		"kitchen_printer",
		"cashback",
		"qris",
		"accounting_integration",
		"api_access",
		"audit_log",
		"login_history",
		"activity_timeline",
		"discount_analysis",
		"void_analysis",
		"approval_discount",
		"approval_void",
		"approval_complimentary",
	}
)

# Built features kept in codebase but turned off for current POS rollout.
# Remove ids from this set (or clear it) to re-enable refund flows.
DISABLED_OPERATIONAL_FEATURE_IDS = frozenset(
	{
		"refund",
		"approval_refund",
		"refund_report",
		"kitchen_printer",
	}
)

# Fulfillment/packing queue — QC is handled in kitchen (KDS). Set True to re-enable.
FULFILLMENT_ROLLOUT_ENABLED = False

FULFILLMENT_WORKSPACE_KEYS = frozenset(
	{
		("Page", "fulfillment-queue"),
		("DocType", "IMOGI Fulfillment Task"),
	}
)


def is_fulfillment_rollout_enabled() -> bool:
	return FULFILLMENT_ROLLOUT_ENABLED


def is_feature_temporarily_disabled(feature_id: str | None) -> bool:
	return bool(feature_id and feature_id in DISABLED_OPERATIONAL_FEATURE_IDS)


def is_feature_ui_visible(feature_id: str | None) -> bool:
	if not feature_id:
		return True
	if feature_id in HIDDEN_UI_FEATURE_IDS:
		return False
	if is_feature_temporarily_disabled(feature_id):
		return False
	return True

# fmt: off
FEATURES: tuple[dict, ...] = (
	# ── DASHBOARD (2) ─────────────────────────────────────────────────────────
	{
		"id": "dashboard_sales",
		"label": "Dashboard Penjualan",
		"category": "DASHBOARD",
		"role": "Owner",
		"min_tier": "Free",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": None,
		"module": "imogi-pos-dashboard",
	},
	{
		"id": "dashboard_operational",
		"label": "Dashboard Operasional",
		"category": "DASHBOARD",
		"role": "Manager",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Monitoring outlet",
		"module": "imogi-pos-dashboard",
		"notes": "Metrik operasional ada di dashboard; belum halaman terpisah.",
	},
	# ── MASTER DATA (7) ─────────────────────────────────────────────────────
	{
		"id": "menu",
		"label": "Menu",
		"category": "MASTER DATA",
		"role": "Manager",
		"min_tier": "Free",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": None,
		"module": "imogi-pos-menu",
	},
	{
		"id": "menu_category",
		"label": "Kategori Menu",
		"category": "MASTER DATA",
		"role": "Manager",
		"min_tier": "Free",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": None,
		"module": "imogi-pos-menu-category",
	},
	{
		"id": "modifier",
		"label": "Modifier",
		"category": "MASTER DATA",
		"role": "Manager",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Extra topping",
		"module": "Item Variant",
		"notes": "Pakai variant ERPNext; belum modul modifier terpisah.",
	},
	{
		"id": "add_on",
		"label": "Add-On",
		"category": "MASTER DATA",
		"role": "Manager",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Upselling",
		"module": "menu_import add_on column",
	},
	{
		"id": "combo_package",
		"label": "Combo Package",
		"category": "MASTER DATA",
		"role": "Manager",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Paket menu",
	},
	{
		"id": "customer",
		"label": "Customer",
		"category": "MASTER DATA",
		"role": "Kasir",
		"min_tier": "Starter",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Customer tetap",
		"module": "cashier customer search",
	},
	{
		"id": "membership",
		"label": "Membership",
		"category": "MASTER DATA",
		"role": "Manager",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": "enable_loyalty",
		"trigger_upgrade": "Loyalitas",
		"module": "IMOGI POS Loyalty Member",
	},
	# ── ORDER TYPE (3) ──────────────────────────────────────────────────────
	{
		"id": "dine_in",
		"label": "Dine In",
		"category": "ORDER TYPE",
		"role": "Kasir",
		"min_tier": "Starter",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Makan di tempat",
		"module": "cashier order_type",
	},
	{
		"id": "take_away",
		"label": "Take Away",
		"category": "ORDER TYPE",
		"role": "Kasir",
		"min_tier": "Starter",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Bungkus",
		"module": "cashier order_type",
	},
	{
		"id": "delivery_order",
		"label": "Delivery Order",
		"category": "ORDER TYPE",
		"role": "Kasir",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Delivery",
		"module": "cashier order_type + IMOGI Delivery Task",
	},
	# ── TRANSAKSI (7) ─────────────────────────────────────────────────────
	{
		"id": "pos_order",
		"label": "POS Order",
		"category": "TRANSAKSI",
		"role": "Kasir",
		"min_tier": "Free",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": None,
		"module": "imogi-pos-cashier",
	},
	{
		"id": "hold_order",
		"label": "Hold Order",
		"category": "TRANSAKSI",
		"role": "Kasir",
		"min_tier": "Starter",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Order ramai",
		"module": "imogi_pos.api.hold",
	},
	{
		"id": "multi_payment",
		"label": "Multi Payment",
		"category": "TRANSAKSI",
		"role": "Kasir",
		"min_tier": "Starter",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
	"trigger_upgrade": "Cashless",
		"module": "imogi-pos-cashier + POS Invoice split payments",
	},
	{
		"id": "split_bill",
		"label": "Split Bill",
		"category": "TRANSAKSI",
		"role": "Kasir",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Group customer",
	},
	{
		"id": "refund",
		"label": "Refund",
		"category": "TRANSAKSI",
		"role": "Supervisor",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Kontrol transaksi",
		"module": "Riwayat Order.action_refund_order",
		"notes": "Sementara dinonaktifkan via DISABLED_OPERATIONAL_FEATURE_IDS.",
	},
	{
		"id": "void_order",
		"label": "Void Order",
		"category": "TRANSAKSI",
		"role": "Kasir",
		"min_tier": "Free",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Kontrol transaksi",
		"module": "Riwayat Order.action_void_order",
	},
	{
		"id": "order_history",
		"label": "Riwayat Transaksi",
		"category": "TRANSAKSI",
		"role": "Kasir",
		"min_tier": "Free",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": None,
		"module": "imogi-pos-order-history",
	},
	{
		"id": "order_management",
		"label": "Manajemen Order",
		"category": "TRANSAKSI",
		"role": "Supervisor",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Kontrol transaksi",
		"module": "Riwayat Order",
	},
	# ── TABLE SERVICE (6) ───────────────────────────────────────────────────
	{
		"id": "table_management",
		"label": "Table Management",
		"category": "TABLE SERVICE",
		"role": "Waiter",
		"min_tier": "Starter",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Dine In",
		"module": "table-service",
	},
	{
		"id": "move_table",
		"label": "Pindah Meja",
		"category": "TABLE SERVICE",
		"role": "Waiter",
		"min_tier": "Starter",
		"status": FEATURE_STATUS_BUILT,
		"module": "table-service",
		"settings_key": None,
		"trigger_upgrade": "Operasional",
	},
	{
		"id": "merge_table",
		"label": "Gabung Meja",
		"category": "TABLE SERVICE",
		"role": "Waiter",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Group customer",
		"module": "table-service",
	},
	{
		"id": "table_reservation",
		"label": "Reservasi Meja",
		"category": "TABLE SERVICE",
		"role": "Waiter",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Reservasi",
		"module": "table-service",
	},
	{
		"id": "waiting_list",
		"label": "Waiting List",
		"category": "TABLE SERVICE",
		"role": "Waiter",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Peak Hour",
		"module": "table-service",
	},
	{
		"id": "qr_self_service",
		"label": "QR Self-Service Order",
		"category": "TABLE SERVICE",
		"role": "Waiter",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": "enable_qr_self_service",
		"trigger_upgrade": "Pesan mandiri via QR",
		"module": "table-service",
		"notes": "Pelanggan scan QR di meja, pesan via web, bayar, dan terima notifikasi WhatsApp.",
	},
	# ── KITCHEN (8) ────────────────────────────────────────────────────────
	{
		"id": "kitchen_display",
		"label": "Kitchen Display System",
		"category": "KITCHEN",
		"role": "Kitchen Staff",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": "enable_kitchen_display",
		"trigger_upgrade": "Banyak order",
		"module": "kitchen-display",
	},
	{
		"id": "kitchen_queue",
		"label": "Kitchen Queue",
		"category": "KITCHEN",
		"role": "Kitchen Staff",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": "enable_kitchen_display",
		"trigger_upgrade": "Banyak order",
		"module": "IMOGI Kitchen Order",
	},
	{
		"id": "cooking_status",
		"label": "Status Cooking",
		"category": "KITCHEN",
		"role": "Kitchen Staff",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": "enable_kitchen_display",
		"trigger_upgrade": "Monitoring",
		"module": "IMOGI Kitchen Order status",
	},
	{
		"id": "kitchen_printer",
		"label": "Kitchen Printer",
		"category": "KITCHEN",
		"role": "Kitchen Staff",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": "enable_kitchen_printer",
		"trigger_upgrade": "Tiket dapur",
	},
	{
		"id": "kitchen_station",
		"label": "Kitchen Station",
		"category": "KITCHEN",
		"role": "Kitchen Staff",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": "enable_kitchen_display",
		"trigger_upgrade": "Dapur terpisah",
		"module": "IMOGI Kitchen Station",
	},
	{
		"id": "bar_station",
		"label": "Bar Station",
		"category": "KITCHEN",
		"role": "Barista",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": "enable_kitchen_display",
		"trigger_upgrade": "Minuman",
	},
	{
		"id": "bump_screen",
		"label": "Bump Screen",
		"category": "KITCHEN",
		"role": "Kitchen Staff",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": "enable_kitchen_display",
		"trigger_upgrade": "Selesaikan order",
		"module": "kitchen-display complete action",
	},
	{
		"id": "kitchen_performance",
		"label": "Kitchen Performance",
		"category": "KITCHEN",
		"role": "Manager",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "KPI dapur",
		"module": "kitchen-performance",
	},
	# ── RECIPE (5) ─────────────────────────────────────────────────────────
	{
		"id": "recipe_management",
		"label": "Recipe Management",
		"category": "RECIPE",
		"role": "Chef",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Standarisasi resep",
		"module": "recipe-hub + BOM + import_bom",
	},
	{
		"id": "food_costing",
		"label": "Food Costing",
		"category": "RECIPE",
		"role": "Chef",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Margin",
		"module": "recipe-hub food cost + BOM costing",
	},
	{
		"id": "portion_control",
		"label": "Portion Control",
		"category": "RECIPE",
		"role": "Chef",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Konsistensi",
		"module": "recipe-hub portion + BOM quantity",
	},
	{
		"id": "ingredient_substitution",
		"label": "Ingredient Substitution",
		"category": "RECIPE",
		"role": "Chef",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Pengganti bahan",
		"module": "recipe-hub + Item Alternative",
	},
	{
		"id": "recipe_versioning",
		"label": "Recipe Versioning",
		"category": "RECIPE",
		"role": "Chef",
		"min_tier": "Enterprise",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Histori resep",
		"module": "recipe-hub versions + Version",
	},
	# ── INVENTORY (10) ──────────────────────────────────────────────────────
	{
		"id": "raw_material",
		"label": "Bahan Baku",
		"category": "INVENTORY",
		"role": "Inventory",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Kontrol bahan",
		"module": "inventory-hub/stock (katalog bahan)",
	},
	{
		"id": "stock_raw",
		"label": "Stock Bahan",
		"category": "INVENTORY",
		"role": "Inventory",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Kontrol stok",
		"module": "inventory-hub/stock (qty & nilai)",
	},
	{
		"id": "stock_consumption",
		"label": "Stock Consumption",
		"category": "INVENTORY",
		"role": "Inventory",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Auto deduction",
		"module": "auto BOM saat jual (bukan form hub)",
	},
	{
		"id": "waste_management",
		"label": "Waste Management",
		"category": "INVENTORY",
		"role": "Inventory",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Waste control",
		"module": "inventory-hub/waste · jenis Waste",
	},
	{
		"id": "spoilage_management",
		"label": "Spoilage Management",
		"category": "INVENTORY",
		"role": "Inventory",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Barang rusak",
		"module": "inventory-hub/waste · jenis Spoilage",
	},
	{
		"id": "expired_monitoring",
		"label": "Expired Monitoring",
		"category": "INVENTORY",
		"role": "Inventory",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Kedaluwarsa",
		"module": "inventory-hub batch expiry",
	},
	{
		"id": "batch_tracking",
		"label": "Batch Tracking",
		"category": "INVENTORY",
		"role": "Inventory",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Tracking bahan",
		"module": "inventory-hub + Batch",
	},
	{
		"id": "stock_opname",
		"label": "Stock Opname",
		"category": "INVENTORY",
		"role": "Inventory",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Audit stok",
		"module": "inventory-hub/opname (hitung fisik)",
	},
	{
		"id": "stock_adjustment",
		"label": "Stock Adjustment",
		"category": "INVENTORY",
		"role": "Inventory",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Koreksi stok",
		"module": "inventory-hub/stock (koreksi +/−)",
	},
	{
		"id": "stock_forecast",
		"label": "Stock Forecast",
		"category": "INVENTORY",
		"role": "Manager",
		"min_tier": "Enterprise",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Prediksi kebutuhan",
		"module": "inventory-hub forecast",
	},
	# ── PURCHASING (4) ─────────────────────────────────────────────────────
	{
		"id": "supplier",
		"label": "Supplier",
		"category": "PURCHASING",
		"role": "Purchasing",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Restock",
		"module": "purchasing-hub + Supplier",
	},
	{
		"id": "purchase_request",
		"label": "Purchase Request",
		"category": "PURCHASING",
		"role": "Purchasing",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Pengadaan",
		"module": "purchasing-hub + Material Request",
	},
	{
		"id": "purchase_order",
		"label": "Purchase Order",
		"category": "PURCHASING",
		"role": "Purchasing",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Pengadaan",
		"module": "purchasing-hub + Purchase Order",
	},
	{
		"id": "goods_receiving",
		"label": "Receiving Barang",
		"category": "PURCHASING",
		"role": "Purchasing",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Penerimaan",
		"module": "purchasing-hub + Purchase Receipt",
	},
	# ── LOYALTY (5) ────────────────────────────────────────────────────────
	{
		"id": "voucher",
		"label": "Voucher",
		"category": "LOYALTY",
		"role": "Kasir",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": "enable_loyalty",
		"trigger_upgrade": "Marketing",
		"module": "IMOGI POS Voucher",
	},
	{
		"id": "point_reward",
		"label": "Point Reward",
		"category": "LOYALTY",
		"role": "Kasir",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": "enable_loyalty",
		"trigger_upgrade": "Retensi",
		"module": "loyalty.py",
	},
	{
		"id": "cashback",
		"label": "Cashback",
		"category": "LOYALTY",
		"role": "Kasir",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": "enable_cashback",
		"trigger_upgrade": "Retensi",
	},
	{
		"id": "birthday_promo",
		"label": "Birthday Promo",
		"category": "LOYALTY",
		"role": "Kasir",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": "enable_birthday_promo",
		"trigger_upgrade": "Marketing",
		"module": "Kasir + Loyalty Member DOB",
	},
	{
		"id": "membership_tier",
		"label": "Membership Tier",
		"category": "LOYALTY",
		"role": "Kasir",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": "enable_loyalty",
		"trigger_upgrade": "Loyalitas",
		"module": "IMOGI POS Loyalty Tier",
	},
	# ── SHIFT (5) ──────────────────────────────────────────────────────────
	{
		"id": "open_shift",
		"label": "Buka Shift",
		"category": "SHIFT",
		"role": "Kasir",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": "enable_pos_shift",
		"trigger_upgrade": "Kontrol kas",
		"module": "imogi-pos-open-shift",
	},
	{
		"id": "close_shift",
		"label": "Tutup Shift",
		"category": "SHIFT",
		"role": "Kasir",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": "enable_pos_shift",
		"trigger_upgrade": "Kontrol kas",
		"module": "imogi-pos-close-shift",
	},
	{
		"id": "cash_in_out",
		"label": "Cash In/Out",
		"category": "SHIFT",
		"role": "Kasir",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": "enable_pos_shift",
		"trigger_upgrade": "Kontrol kas",
		"module": "IMOGI POS Cash Movement",
	},
	{
		"id": "shift_closing_report",
		"label": "Shift Closing Report",
		"category": "SHIFT",
		"role": "Supervisor",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": "enable_pos_shift",
		"trigger_upgrade": "Tutup hari",
		"module": "IMOGI Shift Closing Report",
	},
	# ── KEUANGAN (5) ───────────────────────────────────────────────────────
	{
		"id": "cash_bank",
		"label": "Kas & Bank",
		"category": "KEUANGAN",
		"role": "Finance",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Cashflow",
		"module": "finance-hub + Payment Entry",
	},
	{
		"id": "supplier_payable",
		"label": "Hutang Supplier",
		"category": "KEUANGAN",
		"role": "Finance",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Pembelian",
		"module": "finance-hub + Purchase Invoice",
	},
	{
		"id": "customer_receivable",
		"label": "Piutang Customer",
		"category": "KEUANGAN",
		"role": "Finance",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Corporate customer",
		"module": "finance-hub + Sales Invoice",
	},
	{
		"id": "profit_loss",
		"label": "Laba Rugi",
		"category": "KEUANGAN",
		"role": "Finance",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Profit",
		"module": "finance-hub + P&L Report",
	},
	{
		"id": "cash_flow",
		"label": "Arus Kas",
		"category": "KEUANGAN",
		"role": "Finance",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Cashflow",
		"module": "finance-hub + Cash Flow Report",
	},
	# ── REPORT (12) ─────────────────────────────────────────────────────────
	{
		"id": "sales_report",
		"label": "Laporan Penjualan",
		"category": "REPORT",
		"role": "Owner",
		"min_tier": "Free",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": None,
		"module": "imogi-pos-sales-report",
	},
	{
		"id": "sales_by_hour",
		"label": "Sales by Hour",
		"category": "REPORT",
		"role": "Owner",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"module": "reports_api + dashboard",
		"settings_key": None,
		"trigger_upgrade": "Jam ramai",
	},
	{
		"id": "sales_by_category",
		"label": "Sales by Category",
		"category": "REPORT",
		"role": "Owner",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"module": "reports_api + dashboard",
		"settings_key": None,
		"trigger_upgrade": "Analisa menu",
	},
	{
		"id": "top_menu",
		"label": "Menu Terlaris",
		"category": "REPORT",
		"role": "Owner",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Analisa menu",
		"module": "dashboard top_products",
	},
	{
		"id": "food_cost_report",
		"label": "Food Cost Report",
		"category": "REPORT",
		"role": "Owner",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Margin",
	},
	{
		"id": "waste_report",
		"label": "Waste Report",
		"category": "REPORT",
		"role": "Owner",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Waste control",
		"module": "dashboard + Inventory Hub waste",
	},
	{
		"id": "sales_by_payment",
		"label": "Sales by Payment Method",
		"category": "REPORT",
		"role": "Owner",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Analisa pembayaran",
		"module": "dashboard by_payment",
	},
	{
		"id": "discount_report",
		"label": "Discount Report",
		"category": "REPORT",
		"role": "Owner",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"module": "reports_api + dashboard",
		"settings_key": None,
		"trigger_upgrade": "Analisa diskon",
	},
	{
		"id": "refund_report",
		"label": "Refund Report",
		"category": "REPORT",
		"role": "Owner",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"module": "reports_api + dashboard",
		"settings_key": None,
		"trigger_upgrade": "Analisa refund",
	},
	{
		"id": "tax_report",
		"label": "Tax Report",
		"category": "REPORT",
		"role": "Finance",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Pajak",
		"module": "dashboard tax_report + Sales Register",
	},
	{
		"id": "table_turnover_report",
		"label": "Table Turnover Report",
		"category": "REPORT",
		"role": "Manager",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Efisiensi meja",
	},
	{
		"id": "customer_visit_report",
		"label": "Customer Visit Report",
		"category": "REPORT",
		"role": "Manager",
		"min_tier": "Professional",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Loyalitas",
		"module": "dashboard customer_visit_report",
	},
	# ── MULTI OUTLET (5) ────────────────────────────────────────────────────
	{
		"id": "multi_outlet",
		"label": "Multi Outlet",
		"category": "MULTI OUTLET",
		"role": "Area Manager",
		"min_tier": "Enterprise",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": "multi_branch",
		"trigger_upgrade": "Banyak cabang",
		"module": "IMOGI Branch + multi-outlet-hub",
	},
	{
		"id": "central_kitchen",
		"label": "Central Kitchen",
		"category": "MULTI OUTLET",
		"role": "Area Manager",
		"min_tier": "Enterprise",
		"status": FEATURE_STATUS_BUILT,
		"module": "central_kitchen + settings",
		"settings_key": None,
		"trigger_upgrade": "Produksi pusat",
	},
	{
		"id": "central_inventory",
		"label": "Central Inventory",
		"category": "MULTI OUTLET",
		"role": "Area Manager",
		"min_tier": "Enterprise",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Gudang pusat",
		"module": "multi-outlet-hub/inventory",
	},
	{
		"id": "central_purchasing",
		"label": "Central Purchasing",
		"category": "MULTI OUTLET",
		"role": "Area Manager",
		"min_tier": "Enterprise",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Pembelian terpusat",
		"module": "multi-outlet-hub/purchasing",
	},
	{
		"id": "central_menu_management",
		"label": "Central Menu Management",
		"category": "MULTI OUTLET",
		"role": "Area Manager",
		"min_tier": "Enterprise",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": "multi_branch",
		"trigger_upgrade": "Sinkronisasi menu",
		"module": "hq_push_menu_from_branch",
	},
	# ── APPROVAL (8) ───────────────────────────────────────────────────────
	{
		"id": "approval_discount",
		"label": "Approval Discount",
		"category": "APPROVAL",
		"role": "Supervisor",
		"min_tier": "Enterprise",
		"status": FEATURE_STATUS_BUILT,
		"module": "IMOGI POS Approval Request",
		"settings_key": None,
		"trigger_upgrade": "Kontrol fraud",
	},
	{
		"id": "approval_void",
		"label": "Approval Void",
		"category": "APPROVAL",
		"role": "Supervisor",
		"min_tier": "Enterprise",
		"status": FEATURE_STATUS_BUILT,
		"module": "IMOGI POS Approval Request",
		"settings_key": None,
		"trigger_upgrade": "Kontrol fraud",
	},
	{
		"id": "approval_refund",
		"label": "Approval Refund",
		"category": "APPROVAL",
		"role": "Supervisor",
		"min_tier": "Enterprise",
		"status": FEATURE_STATUS_BUILT,
		"module": "IMOGI POS Approval Request",
		"settings_key": None,
		"trigger_upgrade": "Kontrol fraud",
	},
	{
		"id": "approval_complimentary",
		"label": "Approval Complimentary",
		"category": "APPROVAL",
		"role": "Supervisor",
		"min_tier": "Enterprise",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Gratis menu",
	},
	{
		"id": "approval_purchase_order",
		"label": "Approval Purchase Order",
		"category": "APPROVAL",
		"role": "Supervisor",
		"min_tier": "Enterprise",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Kontrol pembelian",
	},
	{
		"id": "approval_stock_adjustment",
		"label": "Approval Stock Adjustment",
		"category": "APPROVAL",
		"role": "Supervisor",
		"min_tier": "Enterprise",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Kontrol stok",
	},
	# ── AUDIT (5) ──────────────────────────────────────────────────────────
	{
		"id": "audit_log",
		"label": "Audit Log",
		"category": "AUDIT",
		"role": "Auditor",
		"min_tier": "Enterprise",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Audit",
		"module": "audit-hub/versions",
	},
	{
		"id": "login_history",
		"label": "Login History",
		"category": "AUDIT",
		"role": "Auditor",
		"min_tier": "Enterprise",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Audit",
		"module": "audit-hub/login",
	},
	{
		"id": "activity_timeline",
		"label": "Activity Timeline",
		"category": "AUDIT",
		"role": "Auditor",
		"min_tier": "Enterprise",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Audit",
		"module": "audit-hub/timeline",
	},
	{
		"id": "discount_analysis",
		"label": "Discount Analysis",
		"category": "AUDIT",
		"role": "Auditor",
		"min_tier": "Enterprise",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Audit",
		"module": "audit-hub/discount",
	},
	{
		"id": "void_analysis",
		"label": "Void Analysis",
		"category": "AUDIT",
		"role": "Auditor",
		"min_tier": "Enterprise",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Audit",
		"module": "audit-hub/void",
	},
	# ── INTEGRASI (3) ──────────────────────────────────────────────────────
	{
		"id": "qris",
		"label": "QRIS",
		"category": "INTEGRASI",
		"role": "Owner",
		"min_tier": "Starter",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": "enable_payment_gateway",
		"trigger_upgrade": "Cashless",
		"module": "payment_gateway Midtrans/Xendit",
	},
	{
		"id": "accounting_integration",
		"label": "Accounting Integration",
		"category": "INTEGRASI",
		"role": "Owner",
		"min_tier": "Enterprise",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": None,
		"trigger_upgrade": "Akuntansi",
		"module": "finance-hub/accounting + POS Invoice",
	},
	{
		"id": "api_access",
		"label": "API Access",
		"category": "INTEGRASI",
		"role": "Super Admin",
		"min_tier": "Enterprise",
		"status": FEATURE_STATUS_BUILT,
		"settings_key": "enable_order_api",
		"trigger_upgrade": "Integrasi custom",
		"module": "Order API",
	},
)
# fmt: on

# Honest matrix progress — keep FEATURES defaults as product intent, override here
# after audit so "Sudah ada" is not an overclaim. Do not mark production DocType
# bridges as planned (that would block is_feature_operational); use partial.
FEATURE_STATUS_OVERRIDES: dict[str, str] = {
	# KITCHEN — hidden from matrix UI; kept partial until dedicated printer connector
	"kitchen_printer": FEATURE_STATUS_PARTIAL,
}

for _feature in FEATURES:
	_override = FEATURE_STATUS_OVERRIDES.get(_feature["id"])
	if _override:
		_feature["status"] = _override

FEATURE_BY_ID = {row["id"]: row for row in FEATURES}


def _validate_registry():
	# 98, bukan 99 — "end_of_day" dihapus karena duplikat "close_shift" (alias
	# ke doctype POS Closing Entry yang sama, tanpa implementasi terpisah).
	if len(FEATURES) != 98:
		raise ValueError(f"Feature registry must contain 98 features, got {len(FEATURES)}")
	if len(FEATURE_BY_ID) != 98:
		raise ValueError("Duplicate feature ids in registry")


_validate_registry()


def normalize_tier(tier: str | None) -> str:
	tier = (tier or "").strip()
	if tier in TIER_RANK:
		return tier
	return "Enterprise"


def tier_rank(tier: str | None) -> int:
	return TIER_RANK[normalize_tier(tier)]


def is_tier_at_least(current_tier: str | None, min_tier: str) -> bool:
	from imogi_pos.imogi_pos.utils.deployment_mode import is_subscription_tier_disabled

	if is_subscription_tier_disabled():
		return True
	return tier_rank(current_tier) >= tier_rank(min_tier)


def get_subscription_tier(settings=None) -> str:
	settings = settings or get_settings()
	from imogi_pos.imogi_pos.utils.subscription_billing import resolve_effective_tier

	return resolve_effective_tier(settings)


def get_feature(feature_id: str) -> dict | None:
	return FEATURE_BY_ID.get(feature_id)


def is_feature_in_plan(feature_id: str, tier: str | None = None) -> bool:
	from imogi_pos.imogi_pos.utils.deployment_mode import is_subscription_tier_disabled

	if is_subscription_tier_disabled():
		return get_feature(feature_id) is not None
	feature = get_feature(feature_id)
	if not feature:
		return False
	return is_tier_at_least(tier or get_subscription_tier(), feature["min_tier"])


def _settings_toggle_enabled(settings, settings_key: str | None) -> bool:
	if not settings_key:
		return True
	from frappe.utils import cint

	return bool(cint(getattr(settings, settings_key, 0)))


def is_feature_operational(
	feature_id: str, settings=None, tier: str | None = None, user: str | None = None
) -> bool:
	"""Tier + role + settings allow feature AND status is not planned."""
	if is_feature_temporarily_disabled(feature_id):
		return False
	from imogi_pos.imogi_pos.utils.business_profile import is_feature_suppressed_for_business

	if is_feature_suppressed_for_business(feature_id, settings):
		return False
	feature = get_feature(feature_id)
	if not feature:
		return False
	if feature["status"] == FEATURE_STATUS_PLANNED:
		return False
	settings = settings or get_settings()
	from imogi_pos.imogi_pos.utils.deployment_mode import is_subscription_tier_disabled

	if not is_subscription_tier_disabled():
		if not is_tier_at_least(tier or get_subscription_tier(settings), feature["min_tier"]):
			return False
	from imogi_pos.imogi_pos.utils.role_gating import is_role_allowed_for_feature

	if not is_role_allowed_for_feature(feature_id, user=user, settings=settings):
		return False
	return _feature_settings_enabled(settings, feature_id, feature)


def _feature_settings_enabled(settings, feature_id: str, feature) -> bool:
	"""Honor IMOGI POS Settings toggles mapped to a feature (not legacy settings_key only)."""
	from frappe.utils import cint

	from imogi_pos.imogi_pos.utils.feature_gating import SETTINGS_KEYS_BY_FEATURE

	keys = SETTINGS_KEYS_BY_FEATURE.get(feature_id)
	if keys:
		return any(cint(getattr(settings, settings_key, 0)) for settings_key in keys)

	settings_key = feature.get("settings_key")
	if not settings_key:
		return True
	return bool(cint(getattr(settings, settings_key, 0)))


def require_feature(feature_id: str, settings=None, tier: str | None = None):
	"""Raise if feature is not allowed for current subscription tier."""
	if is_feature_in_plan(feature_id, tier):
		return
	feature = get_feature(feature_id) or {}
	trigger = feature.get("trigger_upgrade") or _("Upgrade paket langganan")
	frappe.throw(
		_("Fitur <b>{0}</b> tidak tersedia di paket Anda. {1}.").format(
			feature.get("label") or feature_id,
			trigger,
		),
		title=_("Paket Tidak Mencukupi"),
		exc=frappe.PermissionError,
	)


def list_features(
	tier: str | None = None,
	*,
	in_plan_only: bool = False,
	status: str | None = None,
	category: str | None = None,
) -> list[dict]:
	tier = tier or get_subscription_tier()
	rows = []
	for feature in FEATURES:
		if category and feature["category"] != category:
			continue
		if status and feature["status"] != status:
			continue
		in_plan = is_tier_at_least(tier, feature["min_tier"])
		if in_plan_only and not in_plan:
			continue
		rows.append({**feature, "in_plan": in_plan})
	return rows


def summarize_tiers(*, visible_only: bool = False) -> dict:
	"""Counts per tier matching product matrix (cumulative).

	visible_only=True excludes HIDDEN / temporarily disabled features (matrix UI cards).
	"""
	rows = [f for f in FEATURES if (not visible_only or is_feature_ui_visible(f["id"]))]
	counts = {}
	for tier_name in SUBSCRIPTION_TIERS:
		counts[tier_name] = sum(1 for feature in rows if is_tier_at_least(tier_name, feature["min_tier"]))
	return {
		"total_features": len(rows),
		"per_tier": counts,
		"by_status": {
			FEATURE_STATUS_BUILT: sum(1 for f in rows if f["status"] == FEATURE_STATUS_BUILT),
			FEATURE_STATUS_PARTIAL: sum(1 for f in rows if f["status"] == FEATURE_STATUS_PARTIAL),
			FEATURE_STATUS_PLANNED: sum(1 for f in rows if f["status"] == FEATURE_STATUS_PLANNED),
		},
	}


def serialize_tier_catalog(current_tier: str | None = None) -> dict:
	"""Tier cards for upgrade modal / setup wizard (cumulative + new-at-tier highlights)."""
	current = normalize_tier(current_tier or get_subscription_tier())
	summary = summarize_tiers()
	tiers = []
	for tier_name in SUBSCRIPTION_TIERS:
		cumulative = [
			f for f in FEATURES if is_tier_at_least(tier_name, f["min_tier"])
		]
		new_at_tier = [f for f in FEATURES if f["min_tier"] == tier_name]
		tiers.append(
			{
				"tier": tier_name,
				"feature_count": summary["per_tier"].get(tier_name, len(cumulative)),
				"built_count": sum(1 for f in cumulative if f["status"] == FEATURE_STATUS_BUILT),
				"is_current": tier_name == current,
				"new_features": [
					{
						"id": f["id"],
						"label": f["label"],
						"category": f["category"],
						"status": f["status"],
					}
					for f in new_at_tier
				],
				"highlights": [
					{
						"id": f["id"],
						"label": f["label"],
						"category": f["category"],
						"status": f["status"],
					}
					for f in new_at_tier
					if f["status"] == FEATURE_STATUS_BUILT
				][:5],
			}
		)
	return {
		"current_tier": current,
		"tiers": tiers,
		"summary": summary,
		"total_features": len(FEATURES),
	}


def serialize_feature_matrix(tier: str | None = None) -> dict:
	site_tier = get_subscription_tier()
	view_tier = normalize_tier(tier) if tier else site_tier
	settings = get_settings()
	features = []
	from imogi_pos.imogi_pos.utils.feature_workspace_bridge import get_feature_workspace_route

	for feature in FEATURES:
		if not is_feature_ui_visible(feature["id"]):
			continue
		bridge = get_feature_workspace_route(feature["id"])
		features.append(
			{
				**{k: v for k, v in feature.items() if k != "notes"},
				"in_plan": is_tier_at_least(view_tier, feature["min_tier"]),
				"operational": is_feature_operational(
					feature["id"], settings, view_tier, user=getattr(frappe.session, "user", None)
				),
				"workspace_route": bridge.get("route") if bridge else None,
			}
		)
	return {
		"subscription_tier": site_tier,
		"view_tier": view_tier,
		"preview_tier": view_tier if view_tier != site_tier else None,
		"summary": summarize_tiers(visible_only=True),
		"features": features,
	}
