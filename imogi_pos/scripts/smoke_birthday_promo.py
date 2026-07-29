# Copyright (c) 2026, Imogi and contributors
"""Smoke test Birthday Promo."""

from __future__ import annotations

import frappe
from frappe.utils import flt, today, add_days, getdate


def run(do_write: int = 1):
	frappe.set_user("Administrator")
	from imogi_pos.imogi_pos.utils.feature_registry import FEATURES, is_feature_operational
	from imogi_pos.imogi_pos.utils.flow import get_settings
	from imogi_pos.imogi_pos.utils.loyalty import compute_checkout_totals, set_member_birthday
	from imogi_pos.imogi_pos.utils.planned_features import (
		apply_birthday_promo,
		get_birthday_promo_status,
		is_within_birthday_window,
	)

	results = []

	def ok(name, cond, detail=""):
		results.append((name, bool(cond), detail))
		print(("PASS" if cond else "FAIL"), "-", name, (f":: {detail}" if detail else ""))

	feat = next(f for f in FEATURES if f["id"] == "birthday_promo")
	ok("matrix built", feat["status"] == "built", feat["status"])

	settings = get_settings()
	settings.db_set("enable_loyalty", 1, update_modified=False)
	settings.db_set("enable_birthday_promo", 1, update_modified=False)
	settings.db_set("birthday_discount_percent", 10, update_modified=False)
	settings.db_set("birthday_window_days", 0, update_modified=False)
	settings.reload()

	ok("feature operational", is_feature_operational("birthday_promo", settings))
	ok("customer birthday field", frappe.get_meta("Customer").has_field("imogi_birthday"))
	ok("member birthday field", frappe.get_meta("IMOGI POS Loyalty Member").has_field("date_of_birth"))

	ok("window exact day", is_within_birthday_window(today(), window_days=0))
	ok("window miss", not is_within_birthday_window(add_days(today(), -5), window_days=0))
	ok("window widen", is_within_birthday_window(add_days(today(), -2), window_days=3))

	if not int(do_write or 0):
		passed = sum(1 for _, c, _ in results if c)
		print(f"\n{passed}/{len(results)} passed (read-only)")
		return {"passed": passed, "total": len(results), "results": results}

	# Ensure a test customer
	customer = frappe.db.get_value("Customer", {"disabled": 0}, "name", order_by="modified desc")
	if not customer:
		ok("customer exists", False, "no customer")
	else:
		set_member_birthday(customer, today(), company=settings.default_company)
		status = get_birthday_promo_status(customer, company=settings.default_company, settings=settings)
		ok("eligible today", status.get("eligible"), str(status))

		disc = apply_birthday_promo(customer, 100000, settings=settings, company=settings.default_company)
		ok("discount 10%", abs(flt(disc) - 10000) < 0.01, str(disc))

		item = frappe.db.get_value(
			"Item", {"disabled": 0, "is_sales_item": 1}, "name", order_by="modified desc"
		)
		if not item:
			ok("checkout totals", False, "no item")
		else:
			totals = compute_checkout_totals(
				[{"item_code": item, "qty": 1, "rate": 100000}],
				customer=customer,
				company=settings.default_company,
				settings=settings,
			)
			ok(
				"checkout birthday in promo",
				flt(totals.get("birthday_discount")) > 0 and flt(totals.get("promo_discount")) > 0,
				str(
					{
						"birthday": totals.get("birthday_discount"),
						"promo": totals.get("promo_discount"),
						"applied": totals.get("applied_promos"),
					}
				),
			)
			ok(
				"applied promo marker",
				any(p.get("promo") == "BIRTHDAY_PROMO" for p in (totals.get("applied_promos") or [])),
			)

	passed = sum(1 for _, c, _ in results if c)
	print(f"\n{passed}/{len(results)} passed")
	return {"passed": passed, "total": len(results), "results": results}
