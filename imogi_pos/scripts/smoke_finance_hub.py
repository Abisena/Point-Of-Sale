# Copyright (c) 2026, Imogi and contributors
"""Smoke test Finance Hub (read-only)."""

from __future__ import annotations

import frappe


def run():
	frappe.set_user("Administrator")
	from imogi_pos.imogi_pos.utils.finance_hub import (
		get_finance_summary,
		list_cash_bank,
		list_payables,
		list_receivables,
		get_report_links,
	)
	from imogi_pos.imogi_pos.utils.feature_registry import FEATURES

	results = []

	def ok(name, cond, detail=""):
		results.append((name, bool(cond), detail))
		print(("PASS" if cond else "FAIL"), "-", name, (f":: {detail}" if detail else ""))

	keu = [(f["id"], f["status"]) for f in FEATURES if f["category"] == "KEUANGAN"]
	ok("matrix all built", all(s == "built" for _, s in keu), ",".join(i for i, _ in keu))
	ok("page finance-hub exists", bool(frappe.db.exists("Page", "finance-hub")))

	try:
		summary = get_finance_summary()
		ok(
			"summary keys",
			all(k in summary for k in ("cash_balance", "payable", "receivable", "payments_30d")),
			str({k: summary.get(k) for k in ("cash_balance", "payable", "receivable", "payments_30d", "company")}),
		)
	except Exception as e:
		ok("summary keys", False, str(e))

	try:
		cash = list_cash_bank(limit=20)
		ok(
			"list_cash_bank",
			isinstance(cash.get("rows"), list) and isinstance(cash.get("accounts"), list),
			f"accounts={len(cash.get('accounts') or [])} payments={cash.get('count')}",
		)
	except Exception as e:
		ok("list_cash_bank", False, str(e))

	try:
		pay = list_payables(limit=20)
		ok("list_payables", isinstance(pay.get("rows"), list), f"count={pay.get('count')}")
	except Exception as e:
		ok("list_payables", False, str(e))

	try:
		rec = list_receivables(limit=20)
		ok("list_receivables", isinstance(rec.get("rows"), list), f"count={rec.get('count')}")
	except Exception as e:
		ok("list_receivables", False, str(e))

	try:
		links = get_report_links()
		ok(
			"report_links",
			"profit_loss" in links and "cash_flow" in links and links["profit_loss"].get("report"),
			str(links.get("period_start")),
		)
	except Exception as e:
		ok("report_links", False, str(e))

	passed = sum(1 for _, c, _ in results if c)
	print(f"\n{passed}/{len(results)} passed")
	return {"passed": passed, "total": len(results), "results": results}
