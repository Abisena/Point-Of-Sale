# Copyright (c) 2026, Imogi and contributors
"""Smoke test Audit Hub + Accounting bridge (read-only)."""

from __future__ import annotations

import frappe


def run():
	frappe.set_user("Administrator")
	from imogi_pos.imogi_pos.utils.audit_hub import (
		get_accounting_bridge,
		get_audit_summary,
		get_discount_analysis_hub,
		get_void_analysis_hub,
		list_activity_timeline,
		list_audit_versions,
		list_login_history,
	)
	from imogi_pos.imogi_pos.utils.feature_registry import FEATURES

	results = []

	def ok(name, cond, detail=""):
		results.append((name, bool(cond), detail))
		print(("PASS" if cond else "FAIL"), "-", name, (f":: {detail}" if detail else ""))

	audit = [(f["id"], f["status"]) for f in FEATURES if f["category"] == "AUDIT"]
	ok("audit matrix all built", all(s == "built" for _, s in audit), ",".join(i for i, _ in audit))

	acc = next(f for f in FEATURES if f["id"] == "accounting_integration")
	ok("accounting_integration built", acc["status"] == "built", acc["status"])

	ok("page audit-hub exists", bool(frappe.db.exists("Page", "audit-hub")))

	try:
		summary = get_audit_summary()
		ok(
			"audit summary keys",
			all(k in summary for k in ("versions_30d", "logins_30d", "voids_30d", "discount_amount_30d")),
			str({k: summary.get(k) for k in ("versions_30d", "logins_30d", "voids_30d", "discount_amount_30d")}),
		)
	except Exception as e:
		ok("audit summary keys", False, str(e))

	try:
		versions = list_audit_versions(limit=20)
		ok("list_audit_versions", isinstance(versions.get("rows"), list), f"count={versions.get('count')}")
	except Exception as e:
		ok("list_audit_versions", False, str(e))

	try:
		logins = list_login_history(limit=20)
		ok("list_login_history", isinstance(logins.get("rows"), list), f"count={logins.get('count')}")
	except Exception as e:
		ok("list_login_history", False, str(e))

	try:
		timeline = list_activity_timeline(limit=20)
		ok("list_activity_timeline", isinstance(timeline.get("rows"), list), f"count={timeline.get('count')}")
	except Exception as e:
		ok("list_activity_timeline", False, str(e))

	try:
		disc = get_discount_analysis_hub()
		ok("discount_analysis", isinstance(disc.get("rows"), list) or "breakdown" in disc, str(disc.keys()))
	except Exception as e:
		ok("discount_analysis", False, str(e))

	try:
		voids = get_void_analysis_hub()
		ok("void_analysis", isinstance(voids.get("rows"), list), f"count={voids.get('count')}")
	except Exception as e:
		ok("void_analysis", False, str(e))

	try:
		bridge = get_accounting_bridge(limit=20)
		ok(
			"accounting_bridge",
			all(
				k in bridge
				for k in ("orders_completed_30d", "pos_invoices_30d", "pos_linked_30d", "rows", "coverage_pct")
			),
			f"linked={bridge.get('pos_linked_30d')} coverage={bridge.get('coverage_pct')}",
		)
	except Exception as e:
		ok("accounting_bridge", False, str(e))

	failed = [n for n, c, _ in results if not c]
	print("\nRESULT", f"{len(results) - len(failed)}/{len(results)}")
	if failed:
		raise SystemExit(1)


if __name__ == "__main__":
	run()
