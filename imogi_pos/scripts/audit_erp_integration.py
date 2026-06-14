# Copyright (c) 2026, Imogi and contributors
"""Audit ERPNext integration: Selling, Stock, Purchase, Accounting."""

from __future__ import annotations

import frappe
from frappe.utils import cint, flt


def _ok(label, detail=""):
	return {"status": "OK", "label": label, "detail": detail}


def _warn(label, detail=""):
	return {"status": "WARN", "detail": detail, "label": label}


def _fail(label, detail=""):
	return {"status": "FAIL", "detail": detail, "label": label}


def _count_bom_stock_entries():
	if frappe.db.has_column("Stock Entry", "remarks"):
		return frappe.db.count(
			"Stock Entry",
			{"docstatus": 1, "remarks": ["like", "IMOGI BOM POS:%"]},
		)
	return frappe.db.sql(
		"""
		select count(*)
		from `tabStock Entry`
		where docstatus = 1 and purpose = 'Material Issue'
		"""
	)[0][0]


def _count_auto_low_stock_mr():
	if frappe.db.has_column("Material Request", "remarks"):
		return frappe.db.count(
			"Material Request",
			{"docstatus": 1, "remarks": ["like", "%IMOGI Auto Low Stock%"]},
		)
	return frappe.db.count(
		"Material Request",
		{"docstatus": 1, "material_request_type": "Purchase"},
	)


def run():
	settings = frappe.get_single("IMOGI POS Settings")
	company = settings.default_company or frappe.db.get_single_value("Global Defaults", "default_company")
	results: list[dict] = []

	# ── Master setup ──
	results.append(
		_ok("Company", company) if company else _fail("Company", "default_company belum di-set")
	)
	results.append(
		_ok("POS Profile", settings.default_pos_profile)
		if settings.default_pos_profile
		else _fail("POS Profile", "default_pos_profile belum di-set")
	)
	results.append(
		_ok("Default Warehouse", settings.default_warehouse)
		if settings.default_warehouse
		else _fail("Default Warehouse", "default_warehouse belum di-set")
	)

	# ── SELLING flow ──
	pos_invoices = frappe.db.count("POS Invoice", {"docstatus": 1, "is_pos": 1})
	orders = frappe.db.count("Riwayat Order", {"docstatus": 1})
	linked = frappe.db.count("Riwayat Order", {"docstatus": 1, "pos_invoice": ["is", "set"]})
	results.append(_ok("POS Invoice submitted", str(pos_invoices)))
	results.append(
		_ok("Riwayat Order → POS Invoice", f"{linked}/{orders} order punya POS Invoice")
		if linked
		else _warn("Riwayat Order → POS Invoice", "Belum ada order ter-link ke POS Invoice")
	)

	consolidated = frappe.db.count("Sales Invoice", {"is_consolidated": 1, "docstatus": 1})
	results.append(
		_ok("Consolidated Sales Invoice", str(consolidated))
		if consolidated
		else _warn("Consolidated Sales Invoice", "Belum ada konsolidasi POS → Sales Invoice (normal jika belum tutup shift)")
	)

	# POS Profile stock update (field name varies by ERPNext version)
	if settings.default_pos_profile:
		profile_meta = frappe.get_meta("POS Profile")
		if profile_meta.has_field("update_stock"):
			update_stock = frappe.db.get_value("POS Profile", settings.default_pos_profile, "update_stock")
			results.append(
				_ok("POS Profile update_stock", str(update_stock))
				if cint(update_stock)
				else _warn(
					"POS Profile update_stock",
					"update_stock=0 — stok FG tidak berkurang otomatis dari POS Invoice (BOM issue tetap jalan)",
				)
			)
		else:
			results.append(
				_warn(
					"POS Profile update_stock",
					"Field tidak ada di versi ERPNext ini — stok FG via POS Invoice default ERPNext",
				)
			)

	# ── STOCK / INVENTORY ──
	bom_count = frappe.db.count("BOM", {"is_active": 1, "docstatus": 1})
	menu_items = frappe.db.count("Item", {"disabled": 0, "is_sales_item": 1})
	stock_items = frappe.db.count("Item", {"disabled": 0, "is_stock_item": 1})
	results.append(_ok("Menu items (sales)", str(menu_items)))
	results.append(
		_ok("Active BOMs", str(bom_count)) if bom_count else _warn("Active BOMs", "Belum ada BOM — stock consumption tidak jalan")
	)
	results.append(_ok("Stock items", str(stock_items)))

	bom_stock_entries = _count_bom_stock_entries()
	results.append(
		_ok("BOM Stock Entries (Material Issue)", str(bom_stock_entries))
		if bom_stock_entries
		else _warn("BOM Stock Entries", "Belum ada Material Issue dari penjualan — perlu transaksi + BOM")
	)

	stock_entries = frappe.db.count("Stock Entry", {"docstatus": 1})
	stock_recon = frappe.db.count("Stock Reconciliation", {"docstatus": 1})
	results.append(_ok("Stock Entry (total submitted)", str(stock_entries)))
	results.append(
		_ok("Stock Reconciliation", str(stock_recon))
		if stock_recon
		else _warn("Stock Reconciliation", "Belum ada stock opname")
	)

	# Low stock alert
	results.append(
		_ok("Low stock scheduler", f"interval={settings.low_stock_check_interval}s")
		if cint(settings.low_stock_check_interval)
		else _warn("Low stock scheduler", "low_stock_check_interval=0")
	)
	results.append(
		_ok("Auto Purchase Request (low stock)", "enabled")
		if cint(settings.enable_auto_purchase_request)
		else _warn("Auto Purchase Request (low stock)", "enable_auto_purchase_request=0")
	)
	auto_mr = _count_auto_low_stock_mr()
	results.append(
		_ok("Auto low-stock Material Requests", str(auto_mr))
		if auto_mr
		else _warn("Auto low-stock Material Requests", "Belum ada MR otomatis dari low stock")
	)

	# ── PURCHASING ──
	suppliers = frappe.db.count("Supplier", {"disabled": 0})
	mr = frappe.db.count("Material Request", {"docstatus": 1})
	po = frappe.db.count("Purchase Order", {"docstatus": 1})
	pr = frappe.db.count("Purchase Receipt", {"docstatus": 1})
	results.append(_ok("Suppliers", str(suppliers)) if suppliers else _warn("Suppliers", "Belum ada supplier"))
	results.append(
		_ok("Material Request", str(mr)) if mr else _warn("Material Request", "Belum ada PR submitted")
	)
	results.append(_ok("Purchase Order", str(po)) if po else _warn("Purchase Order", "Belum ada PO submitted"))
	results.append(
		_ok("Purchase Receipt", str(pr)) if pr else _warn("Purchase Receipt", "Belum ada penerimaan barang")
	)

	# ── ACCOUNTING ──
	pi = frappe.db.count("Purchase Invoice", {"docstatus": 1})
	pe = frappe.db.count("Payment Entry", {"docstatus": 1})
	je = frappe.db.count("Journal Entry", {"docstatus": 1})
	si = frappe.db.count("Sales Invoice", {"docstatus": 1})
	gl = frappe.db.count("GL Entry")
	results.append(_ok("Sales Invoice", str(si)) if si else _warn("Sales Invoice", "Belum ada Sales Invoice"))
	results.append(
		_ok("Purchase Invoice", str(pi)) if pi else _warn("Purchase Invoice", "Belum ada hutang supplier tercatat")
	)
	results.append(
		_ok("Payment Entry", str(pe)) if pe else _warn("Payment Entry", "Belum ada pembayaran kas/bank")
	)
	results.append(_ok("Journal Entry", str(je)) if je else _warn("Journal Entry", "Belum ada jurnal manual"))
	results.append(_ok("GL Entries", str(gl)) if gl else _fail("GL Entries", "Belum ada jurnal GL sama sekali"))

	royalty = frappe.db.count("IMOGI POS Royalty Accrual", {"status": "Posted"})
	results.append(
		_ok("Royalty Journal posted", str(royalty))
		if royalty
		else _warn("Royalty Journal", "Belum ada royalty accrual posted (hanya franchise)")
	)

	# Chart of accounts basics
	if company:
		cash_acct = frappe.db.get_value("Company", company, "default_cash_account")
		receivable = frappe.db.get_value("Company", company, "default_receivable_account")
		payable = frappe.db.get_value("Company", company, "default_payable_account")
		results.append(_ok("COA Cash", cash_acct) if cash_acct else _fail("COA Cash", "default_cash_account kosong"))
		results.append(
			_ok("COA Receivable", receivable) if receivable else _warn("COA Receivable", "default_receivable_account kosong")
		)
		results.append(_ok("COA Payable", payable) if payable else _warn("COA Payable", "default_payable_account kosong"))

	# ── Roles ──
	for role in ("IMOGI Owner", "IMOGI Inventory", "IMOGI Purchasing", "IMOGI Finance"):
		exists = frappe.db.exists("Role", role)
		users = frappe.db.count("Has Role", {"role": role, "parenttype": "User"})
		results.append(
			_ok(f"Role {role}", f"{users} user(s)")
			if exists
			else _fail(f"Role {role}", "Role belum dibuat")
		)

	# ── Code hooks registered ──
	hooks = [
		("POS Invoice on_submit → BOM consume", "imogi_pos.imogi_pos.utils.pos_bom_stock.consume_bom_for_pos_invoice_on_submit"),
		("POS Invoice on_submit → sync order", "imogi_pos.imogi_pos.utils.pos_invoice_sync.sync_imogi_order_from_pos_invoice"),
		("Sales Invoice before_submit → consolidation", "imogi_pos.imogi_pos.utils.pos_consolidation.before_consolidated_sales_invoice_submit"),
		("Purchase Order before_submit → approval", "imogi_pos.imogi_pos.utils.approval_hooks.purchase_order_before_submit"),
		("Stock Entry before_submit → approval", "imogi_pos.imogi_pos.utils.approval_hooks.stock_entry_before_submit"),
	]
	for label, path in hooks:
		try:
			frappe.get_attr(path)
			results.append(_ok(f"Hook: {label}"))
		except Exception as exc:
			results.append(_fail(f"Hook: {label}", str(exc)))

	# Print summary
	ok = sum(1 for r in results if r["status"] == "OK")
	warn = sum(1 for r in results if r["status"] == "WARN")
	fail = sum(1 for r in results if r["status"] == "FAIL")
	print(f"\n=== IMOGI POS ERPNext Integration Audit ===")
	print(f"Company: {company} | Business: {settings.business_type}")
	print(f"OK={ok}  WARN={warn}  FAIL={fail}\n")

	sections = {
		"Setup": ["Company", "POS Profile", "Default Warehouse"],
		"Selling": ["POS Invoice", "Riwayat Order", "Consolidated", "update_stock"],
		"Stock/Inventory": ["Menu items", "Active BOMs", "Stock items", "BOM Stock", "Stock Entry", "Stock Reconciliation", "Low stock"],
		"Purchasing": ["Suppliers", "Material Request", "Purchase Order", "Purchase Receipt"],
		"Accounting": ["Sales Invoice", "Purchase Invoice", "Payment Entry", "Journal Entry", "GL Entries", "Royalty", "COA"],
		"Roles & Hooks": ["Role", "Hook"],
	}

	for sec, keywords in sections.items():
		rows = [r for r in results if any(k in r["label"] for k in keywords)]
		if not rows:
			continue
		print(f"## {sec}")
		for r in rows:
			icon = {"OK": "+", "WARN": "!", "FAIL": "X"}[r["status"]]
			detail = f" — {r['detail']}" if r.get("detail") else ""
			print(f"  [{icon}] {r['label']}{detail}")
		print()

	verdict = "SIAP" if fail == 0 and warn <= 8 else ("PERLU SETUP" if fail > 0 else "SEBAGIAN SIAP")
	print(f"VERDICT: {verdict}")
	return {"ok": fail == 0, "verdict": verdict, "summary": {"ok": ok, "warn": warn, "fail": fail}, "results": results}
