# Copyright (c) 2026, Imogi and contributors
"""Smoke test Multi-Outlet Hub (read-only + light create check optional)."""

from __future__ import annotations

import frappe


def run():
	frappe.set_user("Administrator")
	from imogi_pos.imogi_pos.utils.feature_registry import FEATURES
	from imogi_pos.imogi_pos.utils.multi_outlet_hub import (
		get_multi_outlet_summary,
		get_outlet_inventory,
		list_central_purchase_requests,
		list_outlet_branches,
		list_recent_transfers,
	)

	results = []

	def ok(name, cond, detail=""):
		results.append((name, bool(cond), detail))
		print(("PASS" if cond else "FAIL"), "-", name, (f":: {detail}" if detail else ""))

	mo = [(f["id"], f["status"]) for f in FEATURES if f["category"] == "MULTI OUTLET"]
	partial = [i for i, s in mo if s == "partial"]
	ok(
		"multi-outlet matrix no partial",
		not partial,
		",".join(f"{i}:{s}" for i, s in mo),
	)
	ok(
		"central_inventory built",
		next(s for i, s in mo if i == "central_inventory") == "built",
	)
	ok(
		"central_purchasing built",
		next(s for i, s in mo if i == "central_purchasing") == "built",
	)
	ok("page multi-outlet-hub exists", bool(frappe.db.exists("Page", "multi-outlet-hub")))

	try:
		summary = get_multi_outlet_summary()
		ok(
			"summary keys",
			all(
				k in summary
				for k in ("branch_count", "stock_value_total", "central_pr_30d", "transfers_30d")
			),
			str({k: summary.get(k) for k in ("branch_count", "stock_value_total", "central_pr_30d", "multi_branch")}),
		)
	except Exception as e:
		ok("summary keys", False, str(e))

	try:
		branches = list_outlet_branches(limit=20)
		ok("list_outlet_branches", isinstance(branches.get("rows"), list), f"count={branches.get('count')}")
	except Exception as e:
		ok("list_outlet_branches", False, str(e))

	try:
		inv = get_outlet_inventory()
		ok(
			"get_outlet_inventory",
			isinstance(inv.get("rows"), list),
			f"rows={inv.get('count')} value={inv.get('stock_value_total')}",
		)
	except Exception as e:
		ok("get_outlet_inventory", False, str(e))

	try:
		prs = list_central_purchase_requests(limit=20)
		ok("list_central_purchase", isinstance(prs.get("rows"), list), f"count={prs.get('count')}")
	except Exception as e:
		ok("list_central_purchase", False, str(e))

	try:
		tr = list_recent_transfers(limit=10)
		ok("list_recent_transfers", isinstance(tr.get("rows"), list), f"count={tr.get('count')}")
	except Exception as e:
		ok("list_recent_transfers", False, str(e))

	failed = [n for n, c, _ in results if not c]
	print("\nRESULT", f"{len(results) - len(failed)}/{len(results)}")
	if failed:
		raise SystemExit(1)


if __name__ == "__main__":
	run()
