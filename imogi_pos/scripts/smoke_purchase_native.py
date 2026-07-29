# Copyright (c) 2026, Imogi and contributors
"""Smoke test: purchase flow via the *native* ERPNext doctypes/desk path,
bypassing imogi_pos.imogi_pos.utils.purchasing_hub entirely. Verifies that
feature/role gating (feature_gating.require_purchasing_feature) and the
approval gate (approval_hooks.purchase_order_before_submit) still fire when
documents are created with frappe.get_doc(...).insert()/.submit() directly,
the same way the ERPNext desk form would call them.
"""

from __future__ import annotations

import frappe
from frappe.utils import cint, flt, now_datetime


def run(do_write: int = 0):
	frappe.set_user("Administrator")
	from imogi_pos.imogi_pos.utils.flow import get_settings

	results = []

	def ok(name, cond, detail=""):
		results.append((name, bool(cond), detail))
		print(("PASS" if cond else "FAIL"), "-", name, (f":: {detail}" if detail else ""))

	settings = get_settings()
	company = settings.default_company
	warehouse = settings.default_warehouse
	ok("default company", bool(company), company or "EMPTY")
	ok("default warehouse", bool(warehouse), warehouse or "EMPTY")

	# Hook wiring sanity: confirm hooks.py actually registers our functions
	# for these doctypes before attempting any doc creation.
	hooks = frappe.get_hooks("doc_events") or {}

	def hook_present(doctype, event, dotted_suffix):
		fns = hooks.get(doctype, {}).get(event) or []
		if isinstance(fns, str):
			fns = [fns]
		return any(f.endswith(dotted_suffix) for f in fns)

	ok(
		"Supplier before_insert wired",
		hook_present("Supplier", "before_insert", "feature_gating.require_purchasing_feature"),
	)
	ok(
		"Purchase Order before_insert wired",
		hook_present("Purchase Order", "before_insert", "feature_gating.require_purchasing_feature"),
	)
	ok(
		"Purchase Order before_submit still has approval hook",
		hook_present("Purchase Order", "before_submit", "approval_hooks.purchase_order_before_submit"),
	)
	ok(
		"Purchase Order before_submit has feature gate too",
		hook_present("Purchase Order", "before_submit", "feature_gating.require_purchasing_feature"),
	)
	ok(
		"Purchase Receipt/Invoice wired",
		hook_present("Purchase Receipt", "before_insert", "feature_gating.require_purchasing_feature")
		and hook_present("Purchase Invoice", "before_insert", "feature_gating.require_purchasing_feature"),
	)

	if not cint(do_write):
		failed = [n for n, c, _ in results if not c]
		print("---")
		print(f"SMOKE TOTAL={len(results)} PASS={len(results) - len(failed)} FAIL={len(failed)}")
		return {"total": len(results), "pass": len(results) - len(failed), "fail": len(failed), "failed": failed}

	tag = now_datetime().strftime("%H%M%S")

	# --- Positive path: feature operational, role gating off -> everything
	#     should succeed exactly like it does through the Hub. --------------
	from imogi_pos.imogi_pos.utils.feature_registry import is_feature_operational

	ok("feature 'supplier' operational", is_feature_operational("supplier"))
	ok("feature 'purchase_order' operational", is_feature_operational("purchase_order"))

	original_role_gating = cint(getattr(settings, "enable_role_gating", 0))
	original_approval_flag = cint(getattr(settings, "enable_approval_workflow", 0))
	original_threshold = getattr(settings, "approval_po_threshold_amount", 0)
	original_pin = getattr(settings, "approval_supervisor_pin", None)

	try:
		items = frappe.get_all(
			"Item",
			filters={"is_stock_item": 1, "disabled": 0},
			fields=["name"],
			order_by="modified desc",
			limit_page_length=1,
		)
		ok("has 1 stock item", len(items) >= 1, str(items))
		if items and warehouse:
			item_code = items[0].name

			# 1) Supplier via frappe.get_doc directly (== what the native
			#    /app/supplier/new form does under the hood).
			supplier_doc = frappe.get_doc(
				{
					"doctype": "Supplier",
					"supplier_name": f"SMOKE Native Supplier {tag}",
					"supplier_group": frappe.db.get_value("Supplier Group", {}, "name"),
					"supplier_type": "Company",
				}
			)
			supplier_doc.insert(ignore_permissions=True)
			ok("native Supplier insert", bool(supplier_doc.name), supplier_doc.name)
			supplier = supplier_doc.name

			# 2) Purchase Order via frappe.get_doc + .submit() directly.
			po_doc = frappe.get_doc(
				{
					"doctype": "Purchase Order",
					"supplier": supplier,
					"company": company,
					"schedule_date": frappe.utils.nowdate(),
					"items": [
						{
							"item_code": item_code,
							"qty": 3,
							"rate": 1000,
							"schedule_date": frappe.utils.nowdate(),
							"warehouse": warehouse,
						}
					],
				}
			)
			po_doc.insert(ignore_permissions=True)
			ok("native PO insert (before_insert gate passed)", bool(po_doc.name), po_doc.name)

			settings.db_set("enable_approval_workflow", 0)
			po_doc.submit()
			po_doc.reload()
			ok("native PO submit, approval off", cint(po_doc.docstatus) == 1, po_doc.status)

			# 3) Above-threshold PO must still be blocked by the approval hook
			#    even though it was built without going through purchasing_hub.py.
			settings.db_set("enable_approval_workflow", 1)
			settings.db_set("approval_supervisor_pin", "123456")
			settings.db_set("approval_po_threshold_amount", 10000)

			po_big = frappe.get_doc(
				{
					"doctype": "Purchase Order",
					"supplier": supplier,
					"company": company,
					"schedule_date": frappe.utils.nowdate(),
					"items": [
						{
							"item_code": item_code,
							"qty": 20,
							"rate": 1000,  # 20,000 > threshold
							"schedule_date": frappe.utils.nowdate(),
							"warehouse": warehouse,
						}
					],
				}
			)
			po_big.insert(ignore_permissions=True)
			blocked = False
			block_msg = ""
			try:
				po_big.submit()
			except (frappe.ValidationError, frappe.PermissionError) as e:
				blocked = True
				block_msg = str(e)
			ok(
				"native PO above-threshold blocked pending approval",
				blocked,
				block_msg or "submitted without approval! (BUG)",
			)

			settings.db_set("enable_approval_workflow", original_approval_flag)
			settings.db_set("approval_supervisor_pin", original_pin)
			settings.db_set("approval_po_threshold_amount", original_threshold)

			# 4) Negative path: turn a feature off (simulate role-gating tenant
			#    restriction) and confirm native insert is now blocked too.
			settings.db_set("enable_role_gating", 1)
			frappe.db.commit()
			from imogi_pos.imogi_pos.utils import role_gating

			# Force a block by checking as a role with no Purchasing privilege.
			# We simulate by monkey-patching is_role_gating_enabled path via a
			# throwaway user is out of scope for a read-only smoke check, so
			# instead assert the hook fires for a feature explicitly disabled
			# via feature_registry's temporarily-disabled switch, then restore.
			from imogi_pos.imogi_pos.utils import feature_registry as fr

			# DISABLED_OPERATIONAL_FEATURE_IDS is a frozenset (no public setter);
			# swap the module attribute for the duration of this check, same
			# effect as flipping is_feature_temporarily_disabled("purchase_order").
			_original_disabled_ids = fr.DISABLED_OPERATIONAL_FEATURE_IDS
			fr.DISABLED_OPERATIONAL_FEATURE_IDS = _original_disabled_ids | {"purchase_order"}
			blocked2 = False
			try:
				bad_po = frappe.get_doc(
					{
						"doctype": "Purchase Order",
						"supplier": supplier,
						"company": company,
						"schedule_date": frappe.utils.nowdate(),
						"items": [
							{
								"item_code": item_code,
								"qty": 1,
								"rate": 1000,
								"schedule_date": frappe.utils.nowdate(),
								"warehouse": warehouse,
							}
						],
					}
				)
				bad_po.insert(ignore_permissions=True)
			except frappe.ValidationError:
				blocked2 = True
			finally:
				fr.DISABLED_OPERATIONAL_FEATURE_IDS = _original_disabled_ids
				settings.db_set("enable_role_gating", original_role_gating)
			ok(
				"native PO insert blocked when feature disabled",
				blocked2,
				"inserted despite feature disabled! (BUG)" if not blocked2 else "",
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
			settings.db_set("enable_role_gating", original_role_gating)
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
