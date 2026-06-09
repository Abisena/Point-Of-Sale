# Copyright (c) 2026, Imogi and contributors
"""Smoke test: stamp card, royalty journal, offline stock, marketplace."""

import frappe
from frappe.utils import flt

from imogi_pos.imogi_pos.utils.flow import get_settings
from imogi_pos.imogi_pos.utils.marketplace import ingest_marketplace_order
from imogi_pos.imogi_pos.utils.offline_stock import validate_cart_stock
from imogi_pos.imogi_pos.utils.royalty_journal import post_royalty_accrual
from imogi_pos.imogi_pos.utils.stamp_card import apply_stamp_after_payment


def run():
	frappe.set_user("Administrator")
	settings = get_settings()
	company = settings.default_company
	item = _pick_item()
	warehouse = settings.default_warehouse
	customer = _ensure_customer()

	settings.enable_loyalty = 1
	settings.enable_stamp_card = 1
	settings.stamp_target = 2
	settings.enable_marketplace_orders = 1
	settings.save(ignore_permissions=True)
	frappe.db.commit()

	_test_stamp_card(company, customer)
	_test_stock_validation(item, warehouse, settings.default_pos_profile)
	_test_royalty_journal(company, settings)
	_test_marketplace(company, item, settings)

	print("Wave 4 smoke tests passed.")


def _test_stamp_card(company, customer):
	from imogi_pos.imogi_pos.utils.loyalty import get_or_create_member

	member = get_or_create_member(customer, company)
	member.db_set("stamp_count", 1)
	frappe.db.commit()

	order = frappe._dict({"company": company, "customer": customer, "name": "WAVE4-STAMP"})
	reward = apply_stamp_after_payment(order, member)
	if not reward or not reward.get("voucher_code"):
		raise AssertionError("stamp reward voucher not created")
	member.reload()
	if cint(member.stamp_count) != 0:
		raise AssertionError(f"expected stamp reset to 0, got {member.stamp_count}")
	print("[stamp] voucher:", reward["voucher_code"])


def _test_stock_validation(item, warehouse, pos_profile):
	items = [{"item_code": item, "qty": 999999, "rate": 10000}]
	result = validate_cart_stock(items, warehouse, pos_profile=pos_profile)
	if result["ok"]:
		raise AssertionError("expected stock conflict for oversized cart")
	print("[stock] conflicts:", len(result.get("conflicts") or []))


def _test_royalty_journal(company, settings):
	expense, payable = _ensure_royalty_accounts(company)
	settings.royalty_expense_account = expense
	settings.royalty_payable_account = payable
	settings.save(ignore_permissions=True)
	frappe.db.commit()

	name = frappe.db.get_value(
		"IMOGI POS Royalty Accrual",
		{"company": company, "status": "Draft"},
		"name",
	)
	if not name:
		doc = frappe.get_doc(
			{
				"doctype": "IMOGI POS Royalty Accrual",
				"company": company,
				"branch_code": "WAVE4",
				"branch_name": "Wave 4 Smoke",
				"period_start": frappe.utils.today(),
				"period_end": frappe.utils.today(),
				"gross_sales": 100000,
				"royalty_percent": 5,
				"royalty_amount": 5000,
				"order_count": 1,
				"status": "Draft",
			}
		)
		doc.insert(ignore_permissions=True)
		name = doc.name
		frappe.db.commit()

	je = post_royalty_accrual(name)
	if not je or not frappe.db.exists("Journal Entry", je):
		raise AssertionError("royalty journal entry not created")
	print("[royalty] journal:", je)


def _test_marketplace(company, item, settings):
	external_id = f"WAVE4-{frappe.generate_hash(length=6)}"
	result = ingest_marketplace_order(
		{
			"platform": "GrabFood",
			"external_order_id": external_id,
			"pos_profile": settings.default_pos_profile,
			"warehouse": settings.default_warehouse,
			"customer": _ensure_customer(),
			"items": [{"item_code": item, "qty": 1, "rate": 15000}],
		},
		company=company,
	)
	if result.get("status") != "Awaiting Payment":
		raise AssertionError(f"expected Awaiting Payment, got {result.get('status')}")
	print("[marketplace] order:", result.get("name"), external_id)


def _ensure_royalty_accounts(company):
	expense = frappe.db.get_value(
		"Account",
		{"company": company, "root_type": "Expense", "is_group": 0, "disabled": 0},
		"name",
	)
	payable = frappe.db.get_value(
		"Account",
		{
			"company": company,
			"root_type": "Liability",
			"account_type": ["not in", ["Payable"]],
			"is_group": 0,
			"disabled": 0,
		},
		"name",
	)
	if not payable:
		payable = frappe.db.get_value(
			"Account",
			{
				"company": company,
				"root_type": "Liability",
				"account_type": "Payable",
				"is_group": 0,
				"disabled": 0,
			},
			"name",
		)
	if not expense or not payable:
		raise RuntimeError("Need expense and payable accounts for royalty journal smoke test")
	return expense, payable


def _ensure_customer():
	name = frappe.db.get_value("Customer", {"customer_name": "IMOGI Wave4 Smoke"}, "name")
	if name:
		return name
	return frappe.get_doc(
		{
			"doctype": "Customer",
			"customer_name": "IMOGI Wave4 Smoke",
			"customer_type": "Individual",
		}
	).insert(ignore_permissions=True).name


def _pick_item():
	row = frappe.db.sql(
		"""
		SELECT item_code FROM `tabItem`
		WHERE disabled = 0 AND is_sales_item = 1 AND is_stock_item = 1
		ORDER BY modified DESC LIMIT 1
		""",
		as_dict=True,
	)
	if not row:
		row = frappe.db.sql(
			"""
			SELECT item_code FROM `tabItem`
			WHERE disabled = 0 AND is_sales_item = 1
			ORDER BY modified DESC LIMIT 1
			""",
			as_dict=True,
		)
	if not row:
		raise RuntimeError("No sales item found")
	return row[0].item_code


def cint(value):
	from frappe.utils import cint as _cint

	return _cint(value)
