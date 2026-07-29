# Copyright (c) 2026, Imogi and contributors
"""Read-only + optional write smoke for Inventory Hub."""

from __future__ import annotations

import frappe
from frappe.utils import flt, cint


def run(do_write: int = 0):
	"""Smoke test. Set do_write=1 to also exercise adjustment/waste/opname (net-zero)."""
	frappe.set_user("Administrator")
	from imogi_pos.imogi_pos.utils.flow import get_settings
	from imogi_pos.imogi_pos.utils.inventory_hub import (
		list_stock_items,
		list_recent_issues,
		list_batches,
		get_inventory_hub,
		create_stock_adjustment,
		create_waste_or_spoilage,
		create_opname,
	)
	from imogi_pos.imogi_pos.utils.planned_features import get_stock_forecast
	from imogi_pos.imogi_pos.utils.feature_registry import FEATURES

	results = []

	def ok(name, cond, detail=""):
		results.append((name, bool(cond), detail))
		print(("PASS" if cond else "FAIL"), "-", name, (f":: {detail}" if detail else ""))

	inv = [(f["id"], f["status"]) for f in FEATURES if f["category"] == "INVENTORY"]
	ok("matrix all built", all(s == "built" for _, s in inv), ",".join(i for i, _ in inv))

	settings = get_settings()
	wh = settings.default_warehouse
	co = settings.default_company
	ok("default warehouse", bool(wh), wh or "EMPTY")
	ok("default company", bool(co), co or "EMPTY")

	stock = list_stock_items(limit=50)
	rows = stock.get("rows") or []
	ok(
		"list_stock_items",
		bool(stock.get("warehouse")) and isinstance(rows, list),
		f"rows={len(rows)} wh={stock.get('warehouse')} sku={stock.get('summary', {}).get('sku_count')}",
	)
	summary = stock.get("summary") or {}
	ok(
		"summary keys",
		all(k in summary for k in ("sku_count", "low_stock", "zero_stock", "stock_value")),
		str(summary),
	)

	try:
		fc = get_stock_forecast(days="14")
		ok("forecast string days", True, f"count={fc.get('count')} wh={fc.get('warehouse')}")
	except Exception as e:
		ok("forecast string days", False, str(e))

	try:
		b = list_batches(limit=20)
		ok("list_batches", isinstance(b.get("rows"), list), f"count={b.get('count')}")
	except Exception as e:
		ok("list_batches", False, str(e))

	try:
		iss = list_recent_issues(limit=10)
		ok("list_recent_issues", isinstance(iss.get("rows"), list), f"count={iss.get('count')}")
	except Exception as e:
		ok("list_recent_issues", False, str(e))

	try:
		hub = get_inventory_hub(tab="stock")
		ok("get_inventory_hub", hub.get("stock") is not None)
	except Exception as e:
		ok("get_inventory_hub", False, str(e))

	ok("page inventory-hub exists", bool(frappe.db.exists("Page", "inventory-hub")))

	candidate = next((r for r in rows if flt(r.get("qty")) > 0), rows[0] if rows else None)
	ok("has candidate item", bool(candidate), (candidate or {}).get("item_code", "none"))

	if cint(do_write) and candidate and wh:
		code = candidate["item_code"]
		ok("candidate is_stock_item", cint(frappe.db.get_value("Item", code, "is_stock_item")), code)
		try:
			before = flt(frappe.db.get_value("Bin", {"item_code": code, "warehouse": wh}, "actual_qty") or 0)
			adj1 = create_stock_adjustment(
				code, before + 1, warehouse=wh, reason="SMOKE TEST +1 Inventory Hub"
			)
			ok(
				"adjustment +1",
				bool(adj1.get("stock_entry")) and adj1.get("diff") == 1,
				str(adj1),
			)
			mid = flt(frappe.db.get_value("Bin", {"item_code": code, "warehouse": wh}, "actual_qty") or 0)
			ok("qty increased", mid >= before + 1 - 0.0001, f"before={before} mid={mid}")
			adj2 = create_stock_adjustment(code, before, warehouse=wh, reason="SMOKE TEST -1 Inventory Hub")
			ok(
				"adjustment -1",
				bool(adj2.get("stock_entry")) and adj2.get("diff") == -1,
				str(adj2),
			)
			after = flt(frappe.db.get_value("Bin", {"item_code": code, "warehouse": wh}, "actual_qty") or 0)
			ok("qty restored", abs(after - before) < 0.01, f"before={before} after={after}")

			if after >= 1:
				from frappe.utils.file_manager import save_file
				from imogi_pos.imogi_pos.utils.approval import approve_request

				proof = save_file(
					"smoke-waste-proof.txt",
					b"smoke waste proof",
					None,
					None,
					is_private=1,
				)
				before_w = flt(
					frappe.db.get_value("Bin", {"item_code": code, "warehouse": wh}, "actual_qty") or 0
				)
				w = create_waste_or_spoilage(
					code,
					1,
					warehouse=wh,
					reason="SMOKE TEST waste",
					kind="waste",
					file_urls=[proof.file_url],
				)
				ok("create waste request", w.get("status") == "Pending" and bool(w.get("approval_request")), str(w))
				mid_w = flt(
					frappe.db.get_value("Bin", {"item_code": code, "warehouse": wh}, "actual_qty") or 0
				)
				ok("qty unchanged while pending", abs(mid_w - before_w) < 0.01, f"before={before_w} mid={mid_w}")
				appr = approve_request(w["approval_request"])
				ok("approve waste", appr.get("status") == "Approved" and bool(appr.get("stock_entry")), str(appr))
				after_w = flt(
					frappe.db.get_value("Bin", {"item_code": code, "warehouse": wh}, "actual_qty") or 0
				)
				ok("qty reduced after approve", after_w <= before_w - 1 + 0.0001, f"before={before_w} after={after_w}")
				create_stock_adjustment(code, before_w, warehouse=wh, reason="SMOKE TEST restore after waste")
				ok("restore after waste", True)
			else:
				ok("create waste", True, "skipped qty<1")

			from frappe.utils.file_manager import save_file
			from imogi_pos.imogi_pos.utils.approval import approve_request

			opname_proof = save_file(
				"smoke-opname-proof.txt",
				b"smoke opname proof",
				None,
				None,
				is_private=1,
			)
			qty = flt(frappe.db.get_value("Bin", {"item_code": code, "warehouse": wh}, "actual_qty") or 0)
			# ERPNext rejects reconciliation when qty/value unchanged.
			op = create_opname(
				[{"item_code": code, "qty": qty + 1}], warehouse=wh, file_urls=[opname_proof.file_url]
			)
			ok("create opname request", op.get("status") == "Pending" and bool(op.get("approval_request")), str(op))
			mid_op = flt(frappe.db.get_value("Bin", {"item_code": code, "warehouse": wh}, "actual_qty") or 0)
			ok("qty unchanged while opname pending", abs(mid_op - qty) < 0.01, f"before={qty} mid={mid_op}")
			appr_op = approve_request(op["approval_request"])
			ok(
				"approve opname",
				appr_op.get("status") == "Approved" and bool(appr_op.get("stock_reconciliation")),
				str(appr_op),
			)
			after_op = flt(frappe.db.get_value("Bin", {"item_code": code, "warehouse": wh}, "actual_qty") or 0)
			ok("opname applied after approve", abs(after_op - (qty + 1)) < 0.01, f"expected={qty + 1} got={after_op}")
			create_stock_adjustment(code, qty, warehouse=wh, reason="SMOKE TEST restore after opname")
			final = flt(frappe.db.get_value("Bin", {"item_code": code, "warehouse": wh}, "actual_qty") or 0)
			ok("qty restored after opname", abs(final - qty) < 0.01, f"before={qty} final={final}")
			frappe.db.commit()
		except Exception as e:
			frappe.db.rollback()
			ok("write path", False, str(e))
	elif cint(do_write):
		ok("write path", False, "no candidate/warehouse")

	failed = [n for n, c, _ in results if not c]
	print("---")
	print(f"SMOKE TOTAL={len(results)} PASS={len(results) - len(failed)} FAIL={len(failed)}")
	print("FAILED:", ", ".join(failed) if failed else "none")
	return {
		"total": len(results),
		"pass": len(results) - len(failed),
		"fail": len(failed),
		"failed": failed,
		"results": results,
	}
