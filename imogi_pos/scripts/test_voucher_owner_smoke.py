# Copyright (c) 2026, Imogi and contributors
"""Smoke test: voucher ownership via Customer + No. HP."""

import frappe
from frappe import ValidationError
from frappe.utils import flt

from imogi_pos.api.customer_api import _upsert_customer_contact
from imogi_pos.imogi_pos.utils.flow import get_settings
from imogi_pos.imogi_pos.utils.loyalty import compute_checkout_totals, validate_voucher


def run():
	frappe.set_user("Administrator")
	settings = get_settings()
	company = settings.default_company
	item = _pick_item()
	items = [{"item_code": item, "qty": 1, "rate": 50000}]

	owner = _ensure_customer("IMOGI Voucher Owner", "08111111111")
	other = _ensure_customer("IMOGI Voucher Other", "08222222222")

	_test_open_voucher(company, items)
	_test_owned_voucher_ok(company, items, owner, "08111111111")
	_test_owned_voucher_wrong_phone(company, items, owner, "08999999999")
	_test_owned_voucher_wrong_customer(company, items, owner, other, "08111111111")
	_test_voucher_sync_owner(company, owner, "08111111111")

	frappe.db.commit()
	print("Voucher owner smoke tests passed.")


def _test_open_voucher(company, items):
	code = "IMOGI-OPEN-SMOKE"
	_ensure_voucher(
		code,
		company,
		customer=None,
		customer_mobile=None,
	)
	totals = compute_checkout_totals(items, voucher_code=code, company=company)
	if flt(totals["voucher_discount"]) <= 0:
		raise AssertionError("open voucher should apply discount")
	print("[ok] open voucher applies without owner")


def _test_owned_voucher_ok(company, items, customer, phone):
	code = "IMOGI-OWNED-SMOKE"
	_ensure_voucher(
		code,
		company,
		customer=customer,
		customer_mobile=phone,
	)
	meta = validate_voucher(
		code,
		company=company,
		subtotal=50000,
		customer=customer,
		customer_phone=phone,
	)
	if flt(meta["discount_amount"]) <= 0:
		raise AssertionError("owned voucher should return discount for owner")
	print("[ok] owned voucher accepted for matching customer + phone")


def _test_owned_voucher_wrong_phone(company, items, customer, wrong_phone):
	code = "IMOGI-OWNED-SMOKE"
	_assert_raises(
		lambda: validate_voucher(
			code,
			company=company,
			subtotal=50000,
			customer=customer,
			customer_phone=wrong_phone,
		),
		"wrong phone",
	)
	print("[ok] owned voucher rejected for wrong phone")


def _test_owned_voucher_wrong_customer(company, items, owner, other_customer, owner_phone):
	code = "IMOGI-OWNED-SMOKE"
	_assert_raises(
		lambda: validate_voucher(
			code,
			company=company,
			subtotal=50000,
			customer=other_customer,
			customer_phone=owner_phone,
		),
		"wrong customer",
	)
	print("[ok] owned voucher rejected for wrong customer")


def _test_voucher_sync_owner(company, customer, phone):
	code = "IMOGI-SYNC-SMOKE"
	if frappe.db.exists("IMOGI POS Voucher", code):
		frappe.delete_doc("IMOGI POS Voucher", code, force=1)

	doc = frappe.get_doc(
		{
			"doctype": "IMOGI POS Voucher",
			"voucher_code": code,
			"company": company,
			"customer": customer,
			"discount_type": "Percent",
			"discount_value": 5,
			"is_active": 1,
			"max_redemptions": 10,
		}
	)
	doc.insert(ignore_permissions=True)
	if not doc.customer_mobile:
		raise AssertionError("customer_mobile should sync from customer contact")
	if doc.customer_mobile != "08111111111":
		raise AssertionError(f"expected synced phone 08111111111, got {doc.customer_mobile}")
	print("[ok] voucher syncs customer -> phone on save")


def _assert_raises(fn, label):
	try:
		fn()
	except (ValidationError, frappe.ValidationError, frappe.exceptions.ValidationError):
		return
	except Exception as exc:
		if exc.__class__.__name__ in ("ValidationError", "MandatoryError"):
			return
		raise AssertionError(f"{label}: expected validation error, got {exc!r}") from exc
	raise AssertionError(f"{label}: expected validation error, but call succeeded")


def _ensure_customer(customer_name, mobile_no):
	name = frappe.db.get_value("Customer", {"customer_name": customer_name}, "name")
	if not name:
		doc = frappe.get_doc(
			{
				"doctype": "Customer",
				"customer_name": customer_name,
				"customer_type": "Individual",
			}
		).insert(ignore_permissions=True)
		name = doc.name
	customer = frappe.get_doc("Customer", name)
	_upsert_customer_contact(customer, customer_name, mobile_no=mobile_no)
	frappe.db.commit()
	return name


def _ensure_voucher(code, company, customer=None, customer_mobile=None):
	if frappe.db.exists("IMOGI POS Voucher", code):
		doc = frappe.get_doc("IMOGI POS Voucher", code)
		doc.customer = customer
		doc.customer_mobile = customer_mobile
		doc.is_active = 1
		doc.max_redemptions = 100
		doc.save(ignore_permissions=True)
		return code

	frappe.get_doc(
		{
			"doctype": "IMOGI POS Voucher",
			"voucher_code": code,
			"company": company,
			"customer": customer,
			"customer_mobile": customer_mobile,
			"discount_type": "Percent",
			"discount_value": 10,
			"is_active": 1,
			"max_redemptions": 100,
		}
	).insert(ignore_permissions=True)
	frappe.db.commit()
	return code


def _pick_item():
	row = frappe.db.sql(
		"""
		SELECT item_code FROM `tabItem`
		WHERE disabled = 0 AND is_sales_item = 1
		ORDER BY modified DESC LIMIT 1
		""",
		as_dict=True,
	)
	if not row:
		raise RuntimeError("No sales item found for voucher smoke test")
	return row[0].item_code
