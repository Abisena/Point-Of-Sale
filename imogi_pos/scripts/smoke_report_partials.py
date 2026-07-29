# Copyright (c) 2026, Imogi and contributors
"""Smoke test Waste / Tax / Customer Visit reports."""

from __future__ import annotations

import frappe


def run():
	frappe.set_user("Administrator")
	from imogi_pos.imogi_pos.utils.feature_registry import FEATURES
	from imogi_pos.imogi_pos.utils.planned_features import (
		get_customer_visit_report,
		get_tax_report,
		get_waste_report,
	)

	results = []

	def ok(name, cond, detail=""):
		results.append((name, bool(cond), detail))
		print(("PASS" if cond else "FAIL"), "-", name, (f":: {detail}" if detail else ""))

	report = [(f["id"], f["status"]) for f in FEATURES if f["category"] == "REPORT"]
	partial = [i for i, s in report if s == "partial"]
	ok("report none partial", not partial, ",".join(partial) if partial else "all built/other")
	for fid in ("waste_report", "tax_report", "customer_visit_report"):
		st = next(s for i, s in report if i == fid)
		ok(f"{fid} built", st == "built", st)

	try:
		waste = get_waste_report()
		ok(
			"waste_report keys",
			all(k in waste for k in ("rows", "total_qty", "total_value", "hub_route")),
			str({k: waste.get(k) for k in ("count", "total_qty", "total_value")}),
		)
	except Exception as e:
		ok("waste_report keys", False, str(e))

	try:
		tax = get_tax_report()
		ok(
			"tax_report keys",
			all(k in tax for k in ("daily", "tax_amount", "taxable_amount", "grand_total")),
			str({k: tax.get(k) for k in ("order_count", "tax_amount", "taxable_amount")}),
		)
	except Exception as e:
		ok("tax_report keys", False, str(e))

	try:
		visit = get_customer_visit_report()
		ok(
			"visit_report keys",
			all(k in visit for k in ("rows", "unique_customers", "total_visits", "avg_spend_per_visit")),
			str({k: visit.get(k) for k in ("unique_customers", "total_visits", "total_spend")}),
		)
	except Exception as e:
		ok("visit_report keys", False, str(e))

	# registry still validates
	ok("registry count 98", len(FEATURES) == 98, str(len(FEATURES)))

	passed = sum(1 for _, c, _ in results if c)
	print(f"\n{passed}/{len(results)} passed")
	return {"passed": passed, "total": len(results), "results": results}
