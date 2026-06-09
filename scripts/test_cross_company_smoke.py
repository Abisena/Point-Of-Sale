#!/usr/bin/env python3
"""End-to-end smoke test: branch in company != IMOGI Settings default_company.

Run:
  bench --site project.pos execute imogi_pos.scripts.test_cross_company_smoke.run

Set CLEANUP=0 to keep test records.
"""

from __future__ import annotations

import os
import sys
import uuid

TEST_PREFIX = "IMOGI-XCO-"
CLEANUP = os.environ.get("CLEANUP", "1") != "0"


def _log(step, detail=""):
	msg = f"[{step}] {detail}".strip()
	print(msg)
	return msg


def _fail(message):
	print(f"FAIL: {message}", file=sys.stderr)
	raise AssertionError(message)


def _get_sellable_item():
	import frappe

	return frappe.db.get_value(
		"Item",
		{"disabled": 0, "is_sales_item": 1, "has_variants": 0},
		"name",
		order_by="modified desc",
	)


def _cleanup(tag):
	import frappe

	for doctype, field, value in (
		("IMOGI POS Order", "order_source", f"{TEST_PREFIX}{tag}"),
		("IMOGI Branch", "branch_code", None),
	):
		if doctype == "IMOGI Branch":
			for name in frappe.get_all("IMOGI Branch", filters={"branch_code": ["like", f"{TEST_PREFIX}%"]}, pluck="name"):
				try:
					frappe.delete_doc("IMOGI Branch", name, force=1, ignore_permissions=True)
				except Exception:
					pass
			continue
		for name in frappe.get_all(doctype, filters={field: value}, pluck="name"):
			doc = frappe.get_doc(doctype, name)
			if doc.docstatus == 1:
				doc.cancel()
			frappe.delete_doc(doctype, name, force=1, ignore_permissions=True)


def run():
	import frappe

	frappe.set_user("Administrator")
	frappe.connect()

	settings = frappe.get_single("IMOGI POS Settings")
	if not settings.setup_complete:
		_fail("IMOGI POS setup belum selesai — jalankan setup wizard dulu")

	default_company = settings.default_company
	if not default_company:
		_fail("default_company kosong di IMOGI POS Settings")

	tag = uuid.uuid4().hex[:8]
	test_company_name = f"{TEST_PREFIX}Toko {tag}"
	test_branch_name = f"Cabang Uji {tag}"
	test_user = f"{TEST_PREFIX}{tag}@imogi.local"

	_log("setup", f"default_company={default_company}")

	if CLEANUP:
		_cleanup(tag)

	from imogi_pos.imogi_pos.utils.branch_provisioning import provision_branch_stack

	try:
		result = provision_branch_stack(
			branch_name=test_branch_name,
			new_company_name=test_company_name,
			city="Uji",
			target_monthly_sales=1_000_000,
		)
	except Exception as exc:
		_fail(f"provision_branch_stack gagal: {exc}")

	test_company = result["company"]
	branch_code = result["branch_code"]
	pos_profile = result["pos_profile"]

	_log("provision", f"company={test_company} branch={branch_code} pos={pos_profile}")

	if test_company == default_company:
		_fail("Test company sama dengan default — tidak menguji lintas-company")

	# Create dedicated cashier user
	if not frappe.db.exists("User", test_user):
		user = frappe.new_doc("User")
		user.email = test_user
		user.first_name = f"Kasir Uji {tag}"
		user.send_welcome_email = 0
		user.user_type = "System User"
		user.insert(ignore_permissions=True)
	else:
		user = frappe.get_doc("User", test_user)

	user.add_roles("IMOGI Cashier")

	from imogi_pos.imogi_pos.utils.branch import grant_branch_access, resolve_active_branch

	grant_branch_access(test_user, branch_code=branch_code)
	frappe.db.commit()
	_log("permissions", f"granted to {test_user}")

	frappe.set_user(test_user)
	ctx = resolve_active_branch(branch_code=branch_code)
	assert ctx["company"] == test_company, f"resolve_active_branch company={ctx['company']}"
	assert ctx["pos_profile"] == pos_profile
	_log("resolve_active_branch", f"company={ctx['company']} profile={ctx['pos_profile']}")

	from imogi_pos.api.cashier import get_cashier_context, set_active_branch

	cashier_ctx = get_cashier_context(branch=branch_code)
	assert cashier_ctx["company"] == test_company
	assert cashier_ctx["pos_profile"] == pos_profile
	assert any(row["branch_code"] == branch_code for row in cashier_ctx.get("branches") or [])
	_log("get_cashier_context", f"company={cashier_ctx['company']}")

	switched = set_active_branch(branch_code)
	assert switched["company"] == test_company
	_log("set_active_branch", "OK")

	item = _get_sellable_item()
	if not item:
		_log("order", "SKIP — tidak ada item penjualan")
	else:
		from imogi_pos.api.cashier import _create_cashier_order

		profile = frappe.get_doc("POS Profile", pos_profile)
		payment_mode = profile.payments[0].mode_of_payment if profile.payments else "Cash"
		rate = frappe.db.get_value("Item Price", {"item_code": item, "selling": 1}, "price_list_rate") or 10000

		order = _create_cashier_order(
			items=[{"item_code": item, "qty": 1, "rate": rate}],
			customer=None,
			order_channel="Walk-in",
			order_type="Takeaway",
			payments_list=[{"mode_of_payment": payment_mode, "amount": rate}],
			pos_profile=pos_profile,
			company=test_company,
		)
		order.action_process_payment()
		order.reload()
		frappe.db.set_value("IMOGI POS Order", order.name, "order_source", f"{TEST_PREFIX}{tag}")
		assert order.company == test_company, f"order company={order.company}"
		_log("create_order", f"{order.name} company={order.company} total={order.grand_total}")

	frappe.set_user("Administrator")

	from imogi_pos.api.dashboard import get_dashboard_metrics
	from frappe.utils import today

	dash = get_dashboard_metrics(date=today(), company=test_company)
	assert dash.get("company") == test_company
	top = dash.get("top_products") or []
	_log("dashboard", f"company={dash.get('company')} top_products={len(top)}")

	from imogi_pos.imogi_pos.utils.branch import get_branch_sales_breakdown_with_meta

	from frappe.utils import getdate, add_days

	day = getdate(today())
	breakdown = get_branch_sales_breakdown_with_meta(day, add_days(day, 1), company=test_company)
	rows = breakdown.get("rows") or []
	assert any(row["branch_code"] == branch_code for row in rows), "branch tidak muncul di breakdown"
	assert breakdown.get("mixed_currency") is False or breakdown.get("currency")
	_log("branch_breakdown", f"rows={len(rows)} mixed_currency={breakdown.get('mixed_currency')}")

	# Ensure default company dashboard still scoped separately
	dash_default = get_dashboard_metrics(date=today(), company=default_company)
	assert dash_default.get("company") == default_company
	_log("dashboard_default", f"company={dash_default.get('company')}")

	frappe.db.commit()

	if CLEANUP:
		frappe.set_user("Administrator")
		_cleanup(tag)
		for perm in frappe.get_all("User Permission", filters={"user": test_user}, pluck="name"):
			frappe.delete_doc("User Permission", perm, force=1, ignore_permissions=True)
		if frappe.db.exists("User", test_user):
			frappe.delete_doc("User", test_user, force=1, ignore_permissions=True)
		# Company cleanup is heavy (COA); leave test company unless explicit
		_log("cleanup", "orders/branch/user permissions removed (company left for inspection)")
	else:
		_log("cleanup", "skipped — set CLEANUP=0")

	print("\nCross-company smoke tests passed.")
	return 0


if __name__ == "__main__":
	try:
		sys.exit(run())
	except Exception as exc:
		print(f"FAIL: {exc}", file=sys.stderr)
		sys.exit(1)
