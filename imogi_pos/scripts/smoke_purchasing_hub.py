# Copyright (c) 2026, Imogi and contributors
"""Smoke test Purchasing Hub."""

from __future__ import annotations

import frappe
from frappe.utils import flt, cint, now_datetime


def run(do_write: int = 0):
	frappe.set_user("Administrator")
	from imogi_pos.imogi_pos.utils.purchasing_hub import (
		get_purchasing_summary,
		list_suppliers,
		list_purchase_requests,
		list_purchase_orders,
		list_purchase_receipts,
		create_supplier,
		create_purchase_request,
		get_purchase_request_detail,
		submit_purchase_request,
		create_purchase_order,
		create_purchase_order_from_request,
		submit_purchase_order,
		get_purchase_order_receiving_lines,
		create_purchase_receipt_from_po,
		list_receipts_for_billing,
		create_purchase_invoice_from_receipt,
		submit_purchase_invoice,
		list_purchase_invoices,
		create_payment_for_invoice,
	)
	from imogi_pos.imogi_pos.utils.feature_registry import FEATURES
	from imogi_pos.imogi_pos.utils.flow import get_settings

	results = []

	def ok(name, cond, detail=""):
		results.append((name, bool(cond), detail))
		print(("PASS" if cond else "FAIL"), "-", name, (f":: {detail}" if detail else ""))

	purch = [(f["id"], f["status"]) for f in FEATURES if f["category"] == "PURCHASING"]
	ok("matrix all built", all(s == "built" for _, s in purch), ",".join(i for i, _ in purch))
	ok("page purchasing-hub exists", bool(frappe.db.exists("Page", "purchasing-hub")))

	settings = get_settings()
	ok("default warehouse", bool(settings.default_warehouse), settings.default_warehouse or "EMPTY")
	ok("default company", bool(settings.default_company), settings.default_company or "EMPTY")

	try:
		summary = get_purchasing_summary()
		ok(
			"summary",
			all(k in summary for k in ("suppliers", "requests_open", "orders_open", "receipts_30d")),
			str(summary),
		)
	except Exception as e:
		ok("summary", False, str(e))

	try:
		sup = list_suppliers(limit=20)
		ok("list_suppliers", isinstance(sup.get("rows"), list), f"count={sup.get('count')}")
	except Exception as e:
		ok("list_suppliers", False, str(e))

	try:
		req = list_purchase_requests(limit=20)
		ok("list_requests", isinstance(req.get("rows"), list), f"count={req.get('count')}")
	except Exception as e:
		ok("list_requests", False, str(e))

	try:
		orders = list_purchase_orders(limit=20)
		ok("list_orders", isinstance(orders.get("rows"), list), f"count={orders.get('count')}")
	except Exception as e:
		ok("list_orders", False, str(e))

	try:
		recs = list_purchase_receipts(limit=20)
		ok("list_receipts", isinstance(recs.get("rows"), list), f"count={recs.get('count')}")
	except Exception as e:
		ok("list_receipts", False, str(e))

	if cint(do_write):
		original_approval_flag = cint(getattr(settings, "enable_approval_workflow", 0))
		original_pin = getattr(settings, "approval_supervisor_pin", None)
		original_threshold = getattr(settings, "approval_po_threshold_amount", 0)
		try:
			tag = now_datetime().strftime("%H%M%S")
			items = frappe.get_all(
				"Item",
				filters={"is_stock_item": 1, "disabled": 0},
				fields=["name"],
				order_by="modified desc",
				limit_page_length=2,
			)
			ok("has 2 stock items", len(items) >= 2, str(items))
			if len(items) >= 2 and settings.default_warehouse:
				item_a, item_b = items[0].name, items[1].name

				sup_doc = create_supplier(f"SMOKE Supplier {tag}", tax_id=f"NPWP-{tag}")
				ok("create_supplier", bool(sup_doc.get("name")), str(sup_doc))
				supplier = sup_doc["name"]

				# Multi-item Purchase Request stays Draft until explicitly submitted.
				# Also carries an (optional) preferred supplier + Deliver To warehouse,
				# same as Odoo's Vendor/Deliver To fields on a Request for Quotation.
				mr = create_purchase_request(
					[{"item_code": item_a, "qty": 2}, {"item_code": item_b, "qty": 3}],
					supplier=supplier,
				)
				ok(
					"create_request draft",
					mr.get("status") == "Draft" and mr.get("item_count") == 2,
					str(mr),
				)

				req_list = list_purchase_requests(limit=20)
				req_row = next((r for r in req_list.get("rows", []) if r["name"] == mr["name"]), None)
				ok(
					"request lists requester/timestamp/supplier/warehouse",
					bool(req_row)
					and bool(req_row.get("requested_by_name"))
					and bool(req_row.get("creation"))
					and req_row.get("supplier") == supplier
					and bool(req_row.get("warehouse")),
					str(req_row),
				)

				detail = get_purchase_request_detail(mr["name"])
				ok(
					"request detail has items + header",
					len(detail.get("items", [])) == 2 and detail.get("requested_by_name") and detail.get("supplier") == supplier,
					str(detail),
				)

				mr_submit = submit_purchase_request(mr["name"])
				mr_doc = frappe.get_doc("Material Request", mr["name"])
				ok("submit_request", cint(mr_doc.docstatus) == 1, str(mr_submit))

				# Convert the submitted PR into a Draft PO for a chosen supplier.
				po_from_mr = create_purchase_order_from_request(mr["name"], supplier)
				ok("create_po_from_request", bool(po_from_mr.get("name")), str(po_from_mr))

				# Standalone multi-item PO, still Draft until submitted.
				po = create_purchase_order(supplier, [{"item_code": item_a, "qty": 5, "rate": 1000}])
				ok("create_po draft", po.get("status") == "Draft", str(po))

				# Submit with approval workflow fully OFF -> submits immediately.
				settings.db_set("enable_approval_workflow", 0)
				submit_off = submit_purchase_order(po["name"])
				po_doc_after_off = frappe.get_doc("Purchase Order", po["name"])
				ok("submit_po no-approval", cint(po_doc_after_off.docstatus) == 1, str(submit_off))

				# Odoo-style double validation: below the Rp threshold, a PO still
				# auto-submits even with approval workflow ON; at/above it, approval
				# is required.
				threshold = 10000
				settings.db_set("enable_approval_workflow", 1)
				settings.db_set("approval_supervisor_pin", "123456")
				settings.db_set("approval_po_threshold_amount", threshold)

				po_small = create_purchase_order(supplier, [{"item_code": item_a, "qty": 4, "rate": 1000}])  # 4,000
				submit_small = submit_purchase_order(po_small["name"])
				po_small_doc = frappe.get_doc("Purchase Order", po_small["name"])
				ok(
					"submit_po below-threshold auto-submits",
					cint(po_small_doc.docstatus) == 1 and not submit_small.get("approval_request"),
					str(submit_small),
				)

				po_big = create_purchase_order(supplier, [{"item_code": item_a, "qty": 20, "rate": 1000}])  # 20,000
				submit_big = submit_purchase_order(po_big["name"])
				ok(
					"submit_po above-threshold pending-approval",
					submit_big.get("status") == "Pending Approval" and bool(submit_big.get("approval_request")),
					str(submit_big),
				)
				if submit_big.get("approval_request"):
					from imogi_pos.imogi_pos.utils.approval import approve_request

					approved = approve_request(submit_big["approval_request"], pin="123456")
					ok("approve_po", approved.get("purchase_order") == po_big["name"], str(approved))
					po_big_doc = frappe.get_doc("Purchase Order", po_big["name"])
					ok("po submitted after approval", cint(po_big_doc.docstatus) == 1, po_big_doc.status)

				settings.db_set("enable_approval_workflow", original_approval_flag)
				settings.db_set("approval_supervisor_pin", original_pin)
				settings.db_set("approval_po_threshold_amount", original_threshold)

				# Partial per-line receiving against the first PO.
				lines = get_purchase_order_receiving_lines(po["name"])
				ok("receiving lines", bool(lines.get("rows")), str(lines))
				rec = None
				if lines.get("rows"):
					first_line = lines["rows"][0]
					partial_qty = flt(first_line["outstanding_qty"]) / 2 or 1
					rec = create_purchase_receipt_from_po(
						po["name"], items=[{"po_item": first_line["po_item"], "qty": partial_qty}]
					)
					ok("partial_receipt", bool(rec.get("name")), str(rec))
					po_after = frappe.get_doc("Purchase Order", po["name"])
					ok(
						"po partially received",
						0 < flt(po_after.per_received) < 100,
						str(po_after.per_received),
					)

					# Odoo-style backorder: the same PO's remaining outstanding qty
					# must still be fetchable right away, without re-picking the PO.
					lines_after = get_purchase_order_receiving_lines(po["name"])
					ok(
						"backorder lines still outstanding",
						bool(lines_after.get("rows")) and flt(lines_after["rows"][0]["outstanding_qty"]) > 0,
						str(lines_after),
					)

				# 3-way matching: bill strictly off the Receipt just created, then pay it.
				if rec and rec.get("name"):
					billable = list_receipts_for_billing(limit=20)
					ok(
						"receipt listed as billable",
						any(r["name"] == rec["name"] for r in billable.get("rows", [])),
						str(billable),
					)

					inv = create_purchase_invoice_from_receipt(rec["name"])
					inv_doc = frappe.get_doc("Purchase Invoice", inv["name"])
					ok("create_invoice draft", cint(inv_doc.docstatus) == 0, str(inv))

					inv_submit = submit_purchase_invoice(inv["name"])
					ok("submit_invoice", inv_submit.get("outstanding_amount", 0) > 0, str(inv_submit))

					invoices = list_purchase_invoices(limit=20)
					matched = next((r for r in invoices.get("rows", []) if r["name"] == inv["name"]), None)
					ok(
						"invoice matched to po/receipt",
						bool(matched)
						and matched.get("purchase_order") == po["name"]
						and matched.get("purchase_receipt") == rec["name"],
						str(matched),
					)

					pay = create_payment_for_invoice(inv["name"])
					ok("pay_invoice", bool(pay.get("name")), str(pay))
					inv_doc_after = frappe.get_doc("Purchase Invoice", inv["name"])
					ok(
						"invoice fully paid",
						flt(inv_doc_after.outstanding_amount) == 0,
						str(inv_doc_after.outstanding_amount),
					)

			frappe.db.commit()
		except Exception as e:
			frappe.db.rollback()
			ok("write path", False, str(e))
		finally:
			try:
				settings.db_set("enable_approval_workflow", original_approval_flag)
				settings.db_set("approval_supervisor_pin", original_pin)
				settings.db_set("approval_po_threshold_amount", original_threshold)
				frappe.db.commit()
			except Exception:
				pass

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
