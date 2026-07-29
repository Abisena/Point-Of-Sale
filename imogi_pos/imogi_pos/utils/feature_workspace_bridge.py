# Copyright (c) 2026, Imogi and contributors
"""Deep links from feature matrix → ERPNext / IMOGI workspace routes."""

from __future__ import annotations

from imogi_pos.imogi_pos.utils.dashboard_focus import dashboard_route_with_focus

FEATURE_WORKSPACE_ROUTES: dict[str, dict] = {
	"pos_order": {"label": "POS Order / Kasir", "route": "imogi-pos-cashier"},
	"order_history": {"label": "Riwayat Transaksi", "route": "imogi-pos-order-history"},
	"order_management": {"label": "Manajemen Order", "route": "imogi-pos-order-management"},
	"customer": {"label": "Customer", "route": "imogi-pos-cashier"},
	"take_away": {"label": "Take Away", "route": "imogi-pos-cashier"},
	"delivery_order": {"label": "Delivery Order", "route": "imogi-pos-cashier"},
	"hold_order": {"label": "Hold Order", "route": "imogi-pos-cashier"},
	"multi_payment": {"label": "Multi Payment", "route": "imogi-pos-cashier"},
	"split_bill": {"label": "Split Bill", "route": "imogi-pos-cashier"},
	"open_shift": {"label": "Buka Shift", "route": "imogi-pos-open-shift"},
	"close_shift": {"label": "Tutup Shift", "route": "imogi-pos-close-shift"},
	"cash_in_out": {"label": "Cash In/Out", "route": "imogi-pos-close-shift"},
	"shift_closing_report": {"label": "Shift Closing Report", "route": "query-report/IMOGI Shift Closing Report"},
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
	"tax_report": {"label": "Tax Report", "route": dashboard_route_with_focus("tax_report")},
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
	"accounting_integration": {"label": "Finance Hub / Accounting", "route": "finance-hub/accounting"},
	"dashboard_operational": {
		"label": "Dashboard Operasional",
		"route": dashboard_route_with_focus("dashboard_operational"),
	},
	"modifier": {"label": "Modifier Produk", "route": "List/Item"},
	"add_on": {"label": "Add-On Produk", "route": "imogi-pos-menu"},
	"kitchen_performance": {
		"label": "Kitchen Performance",
		"route": "kitchen-performance",
	},
	"table_turnover_report": {
		"label": "Table Turnover",
		"route": dashboard_route_with_focus("table_turnover_report"),
	},
	"customer_visit_report": {
		"label": "Customer Visit",
		"route": dashboard_route_with_focus("customer_visit_report"),
	},
	"cashback": {"label": "Cashback", "route": "IMOGI POS Settings"},
	"birthday_promo": {"label": "Birthday Promo", "route": "IMOGI POS Settings"},
	"central_kitchen": {"label": "Central Kitchen", "route": "IMOGI POS Settings"},
	"central_menu_management": {"label": "Central Menu", "route": "IMOGI POS Settings"},
	"central_purchasing": {"label": "Multi-Outlet Hub / Pembelian", "route": "multi-outlet-hub/purchasing"},
	"multi_outlet": {"label": "Multi-Outlet Hub", "route": "multi-outlet-hub/branches"},
	"recipe_management": {"label": "Recipe Hub", "route": "recipe-hub"},
	"food_costing": {"label": "Recipe Hub / Food Cost", "route": "recipe-hub/food_cost"},
	"portion_control": {"label": "Recipe Hub / Porsi", "route": "recipe-hub/portion"},
	"raw_material": {"label": "Inventory Hub", "route": "inventory-hub"},
	"stock_raw": {"label": "Inventory Hub / Stok", "route": "inventory-hub/stock"},
	"stock_consumption": {"label": "Inventory Hub", "route": "inventory-hub/stock"},
	"waste_management": {"label": "Inventory Hub / Waste", "route": "inventory-hub/waste"},
	"stock_adjustment": {"label": "Inventory Hub / Stok", "route": "inventory-hub/stock"},
	"batch_tracking": {"label": "Inventory Hub / Batch", "route": "inventory-hub/batch"},
	"stock_opname": {"label": "Inventory Hub / Opname", "route": "inventory-hub/opname"},
	"spoilage_management": {"label": "Inventory Hub / Waste", "route": "inventory-hub/waste"},
	"expired_monitoring": {"label": "Inventory Hub / Expired", "route": "inventory-hub/batch"},
	"stock_forecast": {"label": "Inventory Hub / Forecast", "route": "inventory-hub/forecast"},
	"supplier": {"label": "Purchasing Hub", "route": "purchasing-hub"},
	"purchase_request": {"label": "Purchasing Hub / Request", "route": "purchasing-hub/requests"},
	"purchase_order": {"label": "Purchasing Hub / PO", "route": "purchasing-hub/orders"},
	"goods_receiving": {"label": "Purchasing Hub / Receiving", "route": "purchasing-hub/receiving"},
	"cash_bank": {"label": "Finance Hub / Kas", "route": "finance-hub/cash"},
	"supplier_payable": {"label": "Finance Hub / Hutang", "route": "finance-hub/payables"},
	"customer_receivable": {"label": "Finance Hub / Piutang", "route": "finance-hub/receivables"},
	"profit_loss": {"label": "Finance Hub / Laba Rugi", "route": "finance-hub/profit_loss"},
	"cash_flow": {"label": "Finance Hub / Arus Kas", "route": "finance-hub/cash_flow"},
	"audit_log": {"label": "Audit Hub / Log", "route": "audit-hub/versions"},
	"login_history": {"label": "Audit Hub / Login", "route": "audit-hub/login"},
	"activity_timeline": {"label": "Audit Hub / Timeline", "route": "audit-hub/timeline"},
	"discount_analysis": {"label": "Audit Hub / Diskon", "route": "audit-hub/discount"},
	"void_analysis": {"label": "Audit Hub / Void", "route": "audit-hub/void"},
	"membership": {"label": "Loyalty Member", "route": "List/IMOGI POS Loyalty Member"},
	"combo_package": {"label": "Combo Package", "route": "List/IMOGI POS Combo Package"},
	"table_management": {"label": "Table Management", "route": "table-service"},
	"move_table": {"label": "Pindah Meja", "route": "table-service"},
	"merge_table": {"label": "Gabung Meja", "route": "table-service"},
	"table_reservation": {"label": "Reservasi Meja", "route": "table-service"},
	"waiting_list": {"label": "Waiting List", "route": "table-service"},
	"ingredient_substitution": {"label": "Recipe Hub / Substitusi", "route": "recipe-hub/substitutes"},
	"recipe_versioning": {"label": "Recipe Hub / Versi", "route": "recipe-hub/versions"},
	"central_inventory": {"label": "Multi-Outlet Hub / Stok", "route": "multi-outlet-hub/inventory"},
	"approval_complimentary": {"label": "Approval Request", "route": "List/IMOGI POS Approval Request"},
	"approval_purchase_order": {"label": "Approval Request", "route": "List/IMOGI POS Approval Request"},
	"approval_stock_adjustment": {"label": "Approval Request", "route": "List/IMOGI POS Approval Request"},
}


def get_feature_workspace_route(feature_id: str) -> dict | None:
	return FEATURE_WORKSPACE_ROUTES.get(feature_id)
