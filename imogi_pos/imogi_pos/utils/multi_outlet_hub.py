# Copyright (c) 2026, Imogi and contributors
"""Multi-Outlet Hub: cabang, stok antar cabang, pembelian pusat."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import add_days, cint, flt, getdate, today

from imogi_pos.imogi_pos.utils.branch import get_accessible_branches
from imogi_pos.imogi_pos.utils.flow import get_settings
from imogi_pos.imogi_pos.utils.planned_features import (
	create_central_purchase_request,
	get_central_inventory_summary,
)


def _company() -> str | None:
	return get_settings().default_company


def _require_multi_outlet_read():
	if frappe.session.user == "Guest":
		frappe.throw(_("Not permitted"), frappe.PermissionError)
	if not (
		frappe.has_permission("IMOGI Branch", "read")
		or frappe.has_permission("Material Request", "read")
		or frappe.has_permission("Stock Entry", "read")
	):
		frappe.throw(_("Tidak punya akses multi-outlet"), frappe.PermissionError)


def get_multi_outlet_summary() -> dict:
	_require_multi_outlet_read()
	company = _company()
	settings = get_settings()
	branches = get_accessible_branches(company=company, include_inactive=0)
	inv = get_central_inventory_summary(company=company)
	inv_rows = inv.get("rows") or []
	day_start = add_days(getdate(today()), -30)
	mr_filters: dict = {
		"material_request_type": "Purchase",
		"creation": [">=", day_start],
	}
	if company:
		mr_filters["company"] = company
	mr_30d = frappe.db.count("Material Request", mr_filters) if frappe.has_permission("Material Request", "read") else 0
	transfers = 0
	if frappe.has_permission("Stock Entry", "read"):
		se_filters: dict = {
			"stock_entry_type": "Material Transfer",
			"creation": [">=", day_start],
			"docstatus": 1,
		}
		if company:
			se_filters["company"] = company
		transfers = frappe.db.count("Stock Entry", se_filters)
	return {
		"company": company,
		"multi_branch": cint(getattr(settings, "multi_branch", 0)),
		"branch_count": len(branches),
		"stock_value_total": sum(flt(r.get("stock_value")) for r in inv_rows),
		"warehouses_with_stock": len(inv_rows),
		"central_pr_30d": mr_30d,
		"transfers_30d": transfers,
	}


def list_outlet_branches(search: str | None = None, limit: int = 50) -> dict:
	_require_multi_outlet_read()
	company = _company()
	rows = get_accessible_branches(company=company, include_inactive=1)
	if search:
		term = search.strip().lower()
		rows = [
			r
			for r in rows
			if term
			in f"{r.get('branch_name') or ''} {r.get('branch_code') or ''} {r.get('warehouse') or ''}".lower()
		]
	limit = cint(limit) or 50
	# Enrich with warehouse if missing from serialize
	enriched = []
	for r in rows[:limit]:
		code = r.get("branch_code") or r.get("name")
		wh = r.get("warehouse")
		if not wh and code:
			wh = frappe.db.get_value("IMOGI Branch", code, "warehouse")
		enriched.append(
			{
				"name": r.get("name") or code,
				"branch_code": code,
				"branch_name": r.get("branch_name") or code,
				"company": r.get("company"),
				"warehouse": wh,
				"pos_profile": r.get("pos_profile"),
				"selling_price_list": r.get("selling_price_list"),
				"is_active": cint(
					frappe.db.get_value("IMOGI Branch", code, "is_active")
					if code
					else 1
				),
				"is_default": cint(r.get("is_default", 0)),
				"use_custom_menu": cint(r.get("use_custom_menu", 0)),
			}
		)
	return {"rows": enriched, "count": len(enriched), "company": company}


def get_outlet_inventory(search: str | None = None) -> dict:
	_require_multi_outlet_read()
	company = _company()
	payload = get_central_inventory_summary(company=company)
	rows = payload.get("rows") or []
	if search:
		term = search.strip().lower()
		rows = [
			r
			for r in rows
			if term in f"{r.get('branch') or ''} {r.get('branch_code') or ''} {r.get('warehouse') or ''}".lower()
		]
	payload["rows"] = rows
	payload["count"] = len(rows)
	payload["stock_value_total"] = sum(flt(r.get("stock_value")) for r in rows)
	payload["sku_total"] = sum(cint(r.get("sku_count")) for r in rows)
	return payload


def list_central_purchase_requests(search: str | None = None, limit: int = 50) -> dict:
	_require_multi_outlet_read()
	if not frappe.has_permission("Material Request", "read"):
		frappe.throw(_("Tidak punya akses Material Request"), frappe.PermissionError)
	company = _company()
	filters: dict = {"material_request_type": "Purchase"}
	if company:
		filters["company"] = company
	or_filters = None
	if search:
		term = f"%{search.strip()}%"
		or_filters = [["name", "like", term], ["title", "like", term]]
	rows = frappe.get_all(
		"Material Request",
		filters=filters,
		or_filters=or_filters,
		fields=["name", "transaction_date", "status", "docstatus", "company", "title", "creation"],
		order_by="creation desc",
		limit_page_length=cint(limit) or 50,
	)
	for row in rows:
		row["item_count"] = frappe.db.count("Material Request Item", {"parent": row.name})
	return {"rows": rows, "count": len(rows), "company": company}


def create_outlet_purchase_request(item_code, qty, warehouse=None, branch_code=None, company=None) -> dict:
	_require_multi_outlet_read()
	if not frappe.has_permission("Material Request", "create"):
		frappe.throw(_("Tidak punya akses membuat Material Request"), frappe.PermissionError)
	settings = get_settings()
	company = company or settings.default_company
	wh = warehouse
	if branch_code and not wh:
		wh = frappe.db.get_value("IMOGI Branch", {"branch_code": branch_code}, "warehouse") or frappe.db.get_value(
			"IMOGI Branch", branch_code, "warehouse"
		)
	wh = wh or settings.default_warehouse
	name = create_central_purchase_request(
		[{"item_code": item_code, "qty": qty, "warehouse": wh}],
		company=company,
	)
	return {"name": name, "warehouse": wh, "company": company}


def list_recent_transfers(limit: int = 30) -> dict:
	_require_multi_outlet_read()
	if not frappe.has_permission("Stock Entry", "read"):
		return {"rows": [], "count": 0}
	company = _company()
	filters: dict = {"stock_entry_type": "Material Transfer", "docstatus": ["<", 2]}
	if company:
		filters["company"] = company
	rows = frappe.get_all(
		"Stock Entry",
		filters=filters,
		fields=["name", "from_warehouse", "to_warehouse", "posting_date", "docstatus", "creation"],
		order_by="creation desc",
		limit_page_length=cint(limit) or 30,
	)
	return {"rows": rows, "count": len(rows), "company": company}
