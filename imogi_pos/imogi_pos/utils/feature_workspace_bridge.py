# Copyright (c) 2026, Imogi and contributors
"""Deep links from feature matrix → ERPNext / IMOGI workspace routes."""

from __future__ import annotations

FEATURE_WORKSPACE_ROUTES: dict[str, dict] = {
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
	"central_purchasing": {"label": "Material Request HQ", "route": "List/Material Request"},
	"spoilage_management": {"label": "Spoilage / Waste", "route": "List/Stock Entry"},
	"expired_monitoring": {"label": "Batch Expiry", "route": "List/Batch"},
	"stock_forecast": {"label": "Stock Ledger", "route": "query-report/Stock Ledger"},
	"approval_complimentary": {"label": "Approval Request", "route": "List/IMOGI POS Approval Request"},
	"approval_purchase_order": {"label": "Approval Request", "route": "List/IMOGI POS Approval Request"},
	"approval_stock_adjustment": {"label": "Approval Request", "route": "List/IMOGI POS Approval Request"},
}


def get_feature_workspace_route(feature_id: str) -> dict | None:
	return FEATURE_WORKSPACE_ROUTES.get(feature_id)
