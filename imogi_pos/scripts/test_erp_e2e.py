# Copyright (c) 2026, Imogi and contributors
"""End-to-end ERP integration test: Purchase → Stock → Accounting + POS Sale → BOM stock."""

from __future__ import annotations

import frappe
from frappe.utils import add_days, flt, nowdate, today

TAG = "IMOGI-E2E"


def run(dry_run=0):
	"""Run full E2E on site. Set dry_run=1 to only print plan without creating docs."""
	frappe.set_user("Administrator")
	settings = frappe.get_single("IMOGI POS Settings")
	company = settings.default_company or frappe.db.get_single_value("Global Defaults", "default_company")
	warehouse = settings.default_warehouse
	pos_profile = settings.default_pos_profile

	if not company or not warehouse:
		raise RuntimeError("Set default_company and default_warehouse in IMOGI POS Settings")

	ctx = {
		"company": company,
		"warehouse": warehouse,
		"pos_profile": pos_profile,
		"supplier": _pick_supplier(),
		"purchase_item": _pick_purchase_item(),
		"sale_item": _pick_sale_item_with_bom(),
		"customer": _default_customer(),
		"mode_of_payment": _default_mode_of_payment(pos_profile),
	}

	print(f"\n=== {TAG} ERPNext E2E ===")
	print(f"Company: {company} | Warehouse: {warehouse}")
	print(f"Supplier: {ctx['supplier']} | Purchase item: {ctx['purchase_item']}")
	print(f"Sale item (BOM): {ctx['sale_item']} | Customer: {ctx['customer']}")

	if cint(dry_run):
		print("DRY RUN — no documents created.")
		return {"ok": True, "dry_run": True}

	results: dict[str, str] = {}
	errors: list[str] = []

	# Baseline counts
	baseline = _snapshot(company, warehouse, ctx["purchase_item"], ctx["sale_item"])

	try:
		# ── A) PURCHASE CHAIN ──
		print("\n--- A) Purchase: MR → PO → PR → PI → Payment ---")
		mr = _create_material_request(ctx, qty=10)
		results["material_request"] = mr.name
		print(f"  [OK] Material Request {mr.name} (submitted)")

		po = _create_purchase_order_from_mr(mr, ctx)
		results["purchase_order"] = po.name
		print(f"  [OK] Purchase Order {po.name} (submitted)")

		pr = _create_purchase_receipt_from_po(po)
		results["purchase_receipt"] = pr.name
		stock_after_receipt = _stock_qty(ctx["purchase_item"], warehouse)
		print(f"  [OK] Purchase Receipt {pr.name} — stock {ctx['purchase_item']}: {stock_after_receipt}")

		pi = _create_purchase_invoice_from_pr(pr)
		results["purchase_invoice"] = pi.name
		print(f"  [OK] Purchase Invoice {pi.name} (submitted) — outstanding: {flt(pi.outstanding_amount)}")

		pe = _create_payment_for_pi(pi, ctx)
		results["payment_entry"] = pe.name
		print(f"  [OK] Payment Entry {pe.name} (submitted)")

		pi.reload()
		if flt(pi.outstanding_amount) > 0.01:
			errors.append(f"Purchase Invoice {pi.name} still has outstanding {pi.outstanding_amount}")

		frappe.db.commit()

		# ── B) POS SALE + BOM STOCK ──
		print("\n--- B) Selling: Order → POS Invoice → BOM Material Issue ---")
		bom_before = _count_bom_stock_entries()
		order_name, pos_inv_name = _create_and_pay_order(ctx, qty=1)
		results["riwayat_order"] = order_name
		results["pos_invoice"] = pos_inv_name
		bom_after = _count_bom_stock_entries()
		print(f"  [OK] Riwayat Order {order_name} → POS Invoice {pos_inv_name}")
		print(f"  [OK] BOM Stock Entries: {bom_before} → {bom_after}")

		if bom_after <= bom_before and ctx["sale_item"]:
			errors.append("Expected new BOM Material Issue Stock Entry after POS sale")

		frappe.db.commit()

		# ── C) ACCOUNTING / GL ──
		print("\n--- C) Accounting verification ---")
		after = _snapshot(company, warehouse, ctx["purchase_item"], ctx["sale_item"])
		gl_delta = after["gl_entries"] - baseline["gl_entries"]
		print(f"  GL Entries: {baseline['gl_entries']} → {after['gl_entries']} (+{gl_delta})")
		if gl_delta < 1:
			errors.append("Expected GL entries to increase after purchase/payment/sale")

		pi_gl = frappe.db.count("GL Entry", {"voucher_type": "Purchase Invoice", "voucher_no": pi.name})
		pe_gl = frappe.db.count("GL Entry", {"voucher_type": "Payment Entry", "voucher_no": pe.name})
		pos_gl = frappe.db.count("GL Entry", {"voucher_type": "POS Invoice", "voucher_no": pos_inv_name})
		print(f"  GL for PI: {pi_gl} | PE: {pe_gl} | POS Invoice: {pos_gl}")

		# ── D) STOCK OPNAME ──
		print("\n--- D) Inventory: Stock Reconciliation ---")
		sr = _create_stock_reconciliation(ctx)
		results["stock_reconciliation"] = sr.name
		print(f"  [OK] Stock Reconciliation {sr.name} (submitted)")

		frappe.db.commit()

		# ── E) HIDDEN MARKETPLACE FEATURES ──
		print("\n--- E) Hidden UI: GoFood / GrabFood ---")
		_verify_hidden_marketplace_features(errors)

		# ── F) DEMO ROLE WORKSPACE ──
		print("\n--- F) Demo role workspace access ---")
		_verify_demo_role_workspace(errors)

		# ── G) LOW STOCK → AUTO PURCHASE REQUEST ──
		print("\n--- G) Low stock → Auto Purchase Request ---")
		auto_mr = _verify_low_stock_auto_mr(ctx, errors)
		if auto_mr:
			results["auto_material_request"] = auto_mr

	except Exception as exc:
		frappe.db.rollback()
		errors.append(str(exc))
		print(f"\n  [FAIL] {exc}")
		frappe.log_error(title=f"{TAG} failed", message=frappe.get_traceback())

	print("\n=== SUMMARY ===")
	for step, docname in results.items():
		print(f"  {step}: {docname}")

	if errors:
		print(f"\nRESULT: FAIL ({len(errors)} issues)")
		for e in errors:
			print(f"  - {e}")
		return {"ok": False, "results": results, "errors": errors}

	print("\nRESULT: PASS — Purchase, Stock, Accounting, and POS sale E2E OK")
	return {"ok": True, "results": results, "errors": []}


def cint(v):
	from frappe.utils import cint as _cint

	return _cint(v)


def _snapshot(company, warehouse, purchase_item, sale_item):
	return {
		"gl_entries": frappe.db.count("GL Entry", {"company": company}),
		"purchase_stock": _stock_qty(purchase_item, warehouse) if purchase_item else 0,
		"bom_entries": _count_bom_stock_entries(),
	}


def _stock_qty(item_code, warehouse):
	if not item_code or not warehouse:
		return 0
	from erpnext.stock.utils import get_stock_balance

	return flt(get_stock_balance(item_code, warehouse))


def _count_bom_stock_entries():
	return frappe.db.count(
		"Stock Entry",
		[["remarks", "like", "IMOGI BOM POS:%"], ["docstatus", "=", 1]],
	)


def _pick_supplier():
	name = frappe.db.get_value("Supplier", {"disabled": 0}, "name")
	if not name:
		doc = frappe.get_doc(
			{
				"doctype": "Supplier",
				"supplier_name": f"{TAG} Supplier",
				"supplier_group": "All Supplier Groups",
				"supplier_type": "Company",
			}
		)
		doc.insert(ignore_permissions=True)
		return doc.name
	return name


def _pick_purchase_item():
	rows = frappe.get_all(
		"Item",
		filters={"disabled": 0, "is_stock_item": 1, "is_purchase_item": 1},
		pluck="name",
		limit=1,
	)
	if rows:
		return rows[0]
	# fallback: any stock item
	rows = frappe.get_all("Item", filters={"disabled": 0, "is_stock_item": 1}, pluck="name", limit=1)
	if not rows:
		raise RuntimeError("No stock item found for purchase test")
	return rows[0]


def _pick_sale_item_with_bom():
	from imogi_pos.imogi_pos.utils.bom_stock import get_default_bom

	rows = frappe.get_all(
		"Item",
		filters={"disabled": 0, "is_sales_item": 1},
		pluck="name",
		limit=50,
	)
	for item in rows:
		if get_default_bom(item):
			return item
	return rows[0] if rows else None


def _default_customer():
	name = frappe.db.get_value("Customer", {"disabled": 0}, "name")
	if name:
		return name
	doc = frappe.get_doc({"doctype": "Customer", "customer_name": f"{TAG} Customer", "customer_type": "Individual"})
	doc.insert(ignore_permissions=True)
	return doc.name


def _default_mode_of_payment(pos_profile):
	if pos_profile:
		mode = frappe.db.get_value(
			"POS Payment Method", {"parent": pos_profile}, "mode_of_payment"
		)
		if mode:
			return mode
	return frappe.db.get_value("Mode of Payment", {"enabled": 1}, "name") or "Cash"


def _create_material_request(ctx, qty=10):
	mr = frappe.get_doc(
		{
			"doctype": "Material Request",
			"material_request_type": "Purchase",
			"company": ctx["company"],
			"transaction_date": today(),
			"schedule_date": add_days(today(), 3),
			"items": [
				{
					"item_code": ctx["purchase_item"],
					"qty": flt(qty),
					"warehouse": ctx["warehouse"],
					"schedule_date": add_days(today(), 3),
				}
			],
		}
	)
	mr.insert(ignore_permissions=True)
	mr.submit()
	return mr


def _create_purchase_order_from_mr(mr, ctx):
	from erpnext.stock.doctype.material_request.material_request import make_purchase_order

	po = make_purchase_order(mr.name)
	po = frappe.get_doc(po)
	po.supplier = ctx["supplier"]
	po.transaction_date = today()
	for row in po.items:
		row.rate = row.rate or flt(frappe.db.get_value("Item", row.item_code, "standard_rate")) or 1000
		row.schedule_date = add_days(today(), 3)
	po.insert(ignore_permissions=True)
	po.flags.imogi_approval_ok = True
	po.submit()
	return po


def _create_purchase_receipt_from_po(po):
	from erpnext.buying.doctype.purchase_order.purchase_order import make_purchase_receipt

	pr = make_purchase_receipt(po.name)
	pr = frappe.get_doc(pr)
	pr.posting_date = today()
	pr.set_posting_time = 0
	for row in pr.items:
		row.qty = row.qty or row.received_qty
	pr.insert(ignore_permissions=True)
	pr.submit()
	return pr


def _create_purchase_invoice_from_pr(pr):
	from erpnext.stock.doctype.purchase_receipt.purchase_receipt import make_purchase_invoice

	pi = make_purchase_invoice(pr.name)
	pi = frappe.get_doc(pi)
	pi.posting_date = today()
	pi.set_posting_time = 0
	pi.insert(ignore_permissions=True)
	pi.submit()
	return pi


def _create_payment_for_pi(pi, ctx):
	from erpnext.accounts.doctype.payment_entry.payment_entry import get_payment_entry

	pe = get_payment_entry("Purchase Invoice", pi.name)
	pe = frappe.get_doc(pe)
	pe.posting_date = today()
	pe.reference_no = f"{TAG}-{pi.name}"
	pe.reference_date = today()
	pe.remarks = f"{TAG} payment for {pi.name}"
	pe.insert(ignore_permissions=True)
	pe.submit()
	return pe


def _create_and_pay_order(ctx, qty=1):
	from imogi_pos.imogi_pos.utils.flow import get_settings

	settings = get_settings()
	item = ctx["sale_item"]
	if not item:
		raise RuntimeError("No sellable item for POS test")

	rate = flt(frappe.db.get_value("Item", item, "standard_rate")) or 15000
	order = frappe.get_doc(
		{
			"doctype": "Riwayat Order",
			"naming_series": "ORD-.YYYY.-",
			"company": ctx["company"],
			"pos_profile": ctx["pos_profile"],
			"customer": ctx["customer"],
			"order_source": "IMOGI POS",
			"order_channel": "Walk-in",
			"order_type": "Takeaway",
			"status": "Draft",
			"items": [
				{
					"item_code": item,
					"qty": flt(qty),
					"rate": rate,
					"warehouse": ctx["warehouse"],
				}
			],
			"payments": [{"mode_of_payment": ctx["mode_of_payment"], "amount": rate * qty}],
		}
	)
	order.insert(ignore_permissions=True)
	order.submit()
	order.reload()
	pos_inv = order.action_process_payment(silent=True)
	return order.name, pos_inv


def _create_stock_reconciliation(ctx):
	current_qty = _stock_qty(ctx["purchase_item"], ctx["warehouse"])
	reconciled_qty = current_qty + 1 if current_qty >= 0 else 1
	sr = frappe.get_doc(
		{
			"doctype": "Stock Reconciliation",
			"purpose": "Stock Reconciliation",
			"company": ctx["company"],
			"posting_date": today(),
			"set_posting_time": 0,
			"items": [
				{
					"item_code": ctx["purchase_item"],
					"warehouse": ctx["warehouse"],
					"qty": reconciled_qty,
					"valuation_rate": flt(
						frappe.db.get_value("Item", ctx["purchase_item"], "valuation_rate")
					)
					or flt(frappe.db.get_value("Item", ctx["purchase_item"], "standard_rate"))
					or 1000,
				}
			],
		}
	)
	sr.insert(ignore_permissions=True)
	sr.flags.imogi_approval_ok = True
	sr.submit()
	return sr


def _verify_hidden_marketplace_features(errors: list[str]):
	from imogi_pos.imogi_pos.utils.feature_registry import (
		HIDDEN_UI_FEATURE_IDS,
		is_feature_ui_visible,
		serialize_feature_matrix,
	)
	from imogi_pos.imogi_pos.utils.workspace_tier_gating import is_workspace_item_allowed_for_user

	for fid in ("gofood_integration", "grabfood_integration"):
		if is_feature_ui_visible(fid):
			errors.append(f"Expected {fid} to be hidden from UI")
		if fid not in HIDDEN_UI_FEATURE_IDS:
			errors.append(f"{fid} missing from HIDDEN_UI_FEATURE_IDS")

	matrix = serialize_feature_matrix()
	matrix_ids = {row["id"] for row in matrix.get("features", [])}
	for fid in HIDDEN_UI_FEATURE_IDS:
		if fid in matrix_ids:
			errors.append(f"Hidden feature {fid} still in feature matrix")

	for fid in HIDDEN_UI_FEATURE_IDS:
		allowed = is_workspace_item_allowed_for_user(
			"DocType",
			"IMOGI POS Settings",
			user="owner@gmail.com",
			feature_id=fid,
		)
		if allowed:
			errors.append(f"Hidden feature {fid} still allowed in workspace for Owner")
		print(f"  [OK] {fid} hidden from matrix & workspace")

	if not any("Hidden feature" in e or "Expected gofood" in e or "Expected grabfood" in e for e in errors):
		print("  [OK] GoFood / GrabFood hidden from UI")


ROLE_WORKSPACE_CHECKS = (
	("inventory@gmail.com", "Stock Reconciliation", "DocType", "Stock Reconciliation", "stock_opname", True),
	("inventory@gmail.com", "Purchase Order", "DocType", "Purchase Order", "purchase_order", False),
	("purchasing@gmail.com", "Purchase Order", "DocType", "Purchase Order", "purchase_order", True),
	("purchasing@gmail.com", "Stock Reconciliation", "DocType", "Stock Reconciliation", "stock_opname", False),
	("finance@gmail.com", "Payment Entry", "DocType", "Payment Entry", "cash_bank", True),
)


def _verify_demo_role_workspace(errors: list[str]):
	from imogi_pos.patches.setup_demo_integration_users import execute as setup_demo_users
	from imogi_pos.imogi_pos.utils.workspace_tier_gating import is_workspace_item_allowed_for_user

	setup_demo_users()
	settings = frappe.get_single("IMOGI POS Settings")

	for email, label, link_type, link_to, feature_id, expect_allowed in ROLE_WORKSPACE_CHECKS:
		if not frappe.db.exists("User", email):
			errors.append(f"Demo user {email} not found")
			continue
		allowed = is_workspace_item_allowed_for_user(
			link_type,
			link_to,
			user=email,
			settings=settings,
			label=label,
			feature_id=feature_id,
		)
		status = "allowed" if allowed else "blocked"
		expect = "allowed" if expect_allowed else "blocked"
		ok = allowed == expect_allowed
		print(f"  [{'OK' if ok else 'FAIL'}] {email} → {label}: {status} (expect {expect})")
		if not ok:
			errors.append(f"{email} workspace {label}: got {status}, expect {expect}")


def _verify_low_stock_auto_mr(ctx, errors: list[str]) -> str | None:
	from imogi_pos.imogi_pos.utils.low_stock import (
		create_auto_purchase_requests,
		get_low_stock_items,
		set_item_reorder_level,
	)

	settings = frappe.get_single("IMOGI POS Settings")
	settings.enable_auto_purchase_request = 1
	settings.save(ignore_permissions=True)

	item_code = ctx["purchase_item"]
	warehouse = ctx["warehouse"]
	item_doc = frappe.get_doc("Item", item_code)
	set_item_reorder_level(item_doc, warehouse, reorder_level=99999, reorder_qty=5)
	item_doc.save(ignore_permissions=True)
	frappe.db.commit()

	low_items = [r for r in get_low_stock_items(limit=50, warehouse=warehouse) if r["item_code"] == item_code]
	if not low_items:
		errors.append(f"Expected {item_code} in low stock after reorder level bump")
		return None

	created = create_auto_purchase_requests(low_items, settings=settings)
	if not created:
		errors.append("Expected auto Material Request for low stock item")
		return None

	frappe.db.commit()
	mr_name = created[0]
	print(f"  [OK] Auto Material Request {mr_name} for {item_code}")

	dup = create_auto_purchase_requests(low_items, settings=settings)
	if dup:
		errors.append(f"Duplicate auto MR created: {dup}")
	else:
		print("  [OK] No duplicate MR while open request exists")

	return mr_name
