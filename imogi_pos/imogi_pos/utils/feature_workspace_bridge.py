# Copyright (c) 2026, Imogi and contributors
"""Deep links from feature matrix → ERPNext / IMOGI workspace routes."""

from __future__ import annotations

from imogi_pos.imogi_pos.utils.dashboard_focus import dashboard_route_with_focus

FEATURE_WORKSPACE_ROUTES: dict[str, dict] = {
	"pos_order": {"label": "POS Order / Kasir", "route": "imogi-pos-cashier"},
	"order_history": {"label": "Riwayat Order", "route": "imogi-pos-order-history"},
	"customer": {"label": "Customer", "route": "imogi-pos-cashier"},
	"take_away": {"label": "Take Away", "route": "imogi-pos-cashier"},
	"delivery_order": {"label": "Delivery Order", "route": "imogi-pos-cashier"},
	"hold_order": {"label": "Hold Order", "route": "imogi-pos-cashier"},
	"multi_payment": {"label": "Multi Payment", "route": "imogi-pos-cashier"},
	"split_bill": {"label": "Split Bill", "route": "imogi-pos-cashier"},
	"open_shift": {"label": "Buka Shift", "route": "imogi-pos-open-shift"},
	"close_shift": {"label": "Tutup Shift", "route": "imogi-pos-close-shift"},
	"cash_in_out": {"label": "Cash In/Out", "route": "imogi-pos-close-shift"},
	"dashboard_sales": {
		"label": "Dashboard & Analitik",
		"route": dashboard_route_with_focus("dashboard_sales"),
	},
	"sales_report": {"label": "Laporan Penjualan", "route": "imogi-pos-sales-report"},
	"sales_by_hour": {
		"label": "Sales by Hour",
		"route": dashboard_route_with_focus("sales_by_hour"),
	},
	"sales_by_category": {
		"label": "Sales by Category",
		"route": dashboard_route_with_focus("sales_by_category"),
	},
	"top_menu": {"label": "Menu Terlaris", "route": dashboard_route_with_focus("top_menu")},
	"food_cost_report": {
		"label": "Food Cost Report",
		"route": dashboard_route_with_focus("food_cost_report"),
	},
	"waste_report": {"label": "Waste Report", "route": dashboard_route_with_focus("waste_report")},
	"sales_by_payment": {
		"label": "Sales by Payment Method",
		"route": dashboard_route_with_focus("sales_by_payment"),
	},
	"discount_report": {
		"label": "Discount Report",
		"route": dashboard_route_with_focus("discount_report"),
	},
	"refund_report": {
		"label": "Refund Report",
		"route": dashboard_route_with_focus("refund_report"),
	},
	"qris": {"label": "QRIS / Gateway Payment", "route": "List/IMOGI POS Gateway Payment"},
	"gofood_integration": {"label": "GoFood Integration", "route": "imogi-pos-settings"},
	"grabfood_integration": {"label": "GrabFood Integration", "route": "imogi-pos-settings"},
	"accounting_integration": {"label": "Integrasi Akuntansi", "route": "List/Sales Invoice"},
	"dashboard_operational": {
		"label": "Dashboard Operasional",
		"route": dashboard_route_with_focus("dashboard_operational"),
	},
	"modifier": {"label": "Modifier Produk", "route": "List/Item"},
	"add_on": {"label": "Add-On Produk", "route": "imogi-pos-menu"},
	"kitchen_performance": {
		"label": "Kitchen Performance",
		"route": dashboard_route_with_focus("kitchen_performance"),
	},
	"table_turnover_report": {
		"label": "Table Turnover",
		"route": dashboard_route_with_focus("table_turnover_report"),
	},
	"customer_visit_report": {
		"label": "Customer Visit",
		"route": dashboard_route_with_focus("customer_visit_report"),
	},
	"cashback": {"label": "Cashback", "route": "imogi-pos-settings"},
	"birthday_promo": {"label": "Birthday Promo", "route": "imogi-pos-settings"},
	"central_kitchen": {"label": "Central Kitchen", "route": "imogi-pos-settings"},
	"central_menu_management": {"label": "Central Menu", "route": "imogi-pos-settings"},
	"central_purchasing": {"label": "Central Purchasing", "route": "List/Material Request"},
	"multi_outlet": {"label": "Multi Outlet", "route": "List/IMOGI Branch"},
	"recipe_management": {"label": "BOM / Resep", "route": "List/BOM"},
	"food_costing": {"label": "BOM / Food Cost", "route": "List/BOM"},
	"portion_control": {"label": "BOM / Porsi", "route": "List/BOM"},
	"raw_material": {"label": "Item Bahan Baku", "route": "List/Item"},
	"stock_raw": {"label": "Stock Ledger", "route": "query-report/Stock Ledger"},
	"waste_management": {"label": "Stock Entry", "route": "List/Stock Entry"},
	"stock_adjustment": {"label": "Stock Entry", "route": "List/Stock Entry"},
	"batch_tracking": {"label": "Batch", "route": "List/Batch"},
	"stock_opname": {"label": "Stock Reconciliation", "route": "List/Stock Reconciliation"},
	"supplier": {"label": "Supplier", "route": "List/Supplier"},
	"purchase_request": {"label": "Material Request", "route": "List/Material Request"},
	"purchase_order": {"label": "Purchase Order", "route": "List/Purchase Order"},
	"goods_receiving": {"label": "Purchase Receipt", "route": "List/Purchase Receipt"},
	"cash_bank": {"label": "Payment Entry", "route": "List/Payment Entry"},
	"supplier_payable": {"label": "Purchase Invoice", "route": "List/Purchase Invoice"},
	"customer_receivable": {"label": "Sales Invoice", "route": "List/Sales Invoice"},
	"profit_loss": {"label": "Profit and Loss", "route": "query-report/Profit and Loss Statement"},
	"cash_flow": {"label": "Cash Flow", "route": "query-report/Cash Flow"},
	"tax_report": {"label": "Sales Register", "route": "query-report/Sales Register"},
	"audit_log": {"label": "Version Log", "route": "List/Version"},
	"login_history": {"label": "Activity Log", "route": "List/Activity Log"},
	"membership": {"label": "Loyalty Member", "route": "List/IMOGI POS Loyalty Member"},
	"combo_package": {"label": "Combo Package", "route": "List/IMOGI POS Combo Package"},
	"table_reservation": {"label": "Reservasi Meja", "route": "List/IMOGI POS Table Reservation"},
	"waiting_list": {"label": "Waiting List", "route": "List/IMOGI POS Waiting List"},
	"ingredient_substitution": {"label": "BOM Substitusi", "route": "List/BOM"},
	"recipe_versioning": {"label": "Versi BOM", "route": "List/Version"},
	"central_inventory": {"label": "Stok Cabang", "route": "List/IMOGI Branch"},
	"spoilage_management": {"label": "Spoilage / Waste", "route": "List/Stock Entry"},
	"expired_monitoring": {"label": "Batch Expiry", "route": "List/Batch"},
	"stock_forecast": {"label": "Stock Ledger", "route": "query-report/Stock Ledger"},
	"approval_complimentary": {"label": "Approval Request", "route": "List/IMOGI POS Approval Request"},
	"approval_purchase_order": {"label": "Approval Request", "route": "List/IMOGI POS Approval Request"},
	"approval_stock_adjustment": {"label": "Approval Request", "route": "List/IMOGI POS Approval Request"},
}


def get_feature_workspace_route(feature_id: str) -> dict | None:
	return FEATURE_WORKSPACE_ROUTES.get(feature_id)
