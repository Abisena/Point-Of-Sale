# Copyright (c) 2026, Imogi and contributors
"""Smoke test: loyalty points earn/redeem + voucher discount."""

import frappe
from frappe.utils import cint, flt

from imogi_pos.imogi_pos.utils.flow import get_settings
from imogi_pos.imogi_pos.utils.loyalty import (
	apply_loyalty_after_payment,
	compute_checkout_totals,
	get_customer_loyalty,
	get_or_create_member,
)


def run():
	frappe.set_user("Administrator")
	settings = get_settings()
	company = settings.default_company

	_enable_loyalty(settings)

	customer = _ensure_customer()
	voucher_code = _ensure_voucher(company)
	member = get_or_create_member(customer, company)
	member.db_set({"points": 50, "total_earned": 50, "total_redeemed": 0})
	frappe.db.commit()

	item = _pick_item()
	items = [{"item_code": item, "qty": 2, "rate": 15000}]

	totals = compute_checkout_totals(
		items,
		voucher_code=voucher_code,
		loyalty_points_redeem=10,
		customer=customer,
		company=company,
	)
	if flt(totals["voucher_discount"]) <= 0:
		raise AssertionError("voucher discount not calculated")
	if flt(totals["loyalty_discount"]) <= 0:
		raise AssertionError("loyalty discount not calculated")
	if flt(totals["grand_total"]) <= 0:
		raise AssertionError("grand total invalid")

	order = _build_test_order(items, customer, company, totals, voucher_code)
	order.insert(ignore_permissions=True)
	order.submit()
	apply_loyalty_after_payment(order)
	frappe.db.commit()

	member.reload()
	if cint(member.points) <= 40:
		raise AssertionError(f"expected points after redeem+earn, got {member.points}")

	voucher = frappe.get_doc("IMOGI POS Voucher", voucher_code)
	if cint(voucher.redemption_count) < 1:
		raise AssertionError("voucher redemption_count not incremented")

	loyalty = get_customer_loyalty(customer, company)
	print("[loyalty] customer points:", loyalty.get("points"))
	print("[totals] grand_total:", totals["grand_total"], "earned:", totals["loyalty_points_earned"])
	print("Loyalty smoke tests passed.")


def _enable_loyalty(settings):
	settings.enable_loyalty = 1
	settings.loyalty_points_per_amount = 10000
	settings.loyalty_point_value = 100
	settings.loyalty_min_redeem_points = 5
	settings.save(ignore_permissions=True)
	frappe.db.commit()


def _build_test_order(items, customer, company, totals, voucher_code):
	from imogi_pos.imogi_pos.utils.loyalty import apply_promotions_to_order

	order = frappe.new_doc("Riwayat Order")
	order.company = company
	order.pos_profile = get_settings().default_pos_profile
	order.order_channel = "Walk-in"
	order.order_type = "Takeaway"
	order.order_source = "IMOGI POS"
	order.customer = customer
	apply_promotions_to_order(order, totals)
	order.voucher_code = voucher_code
	for row in items:
		order.append(
			"items",
			{
				"item_code": row["item_code"],
				"qty": row["qty"],
				"rate": row["rate"],
			},
		)
	order.append("payments", {"mode_of_payment": "Cash", "amount": totals["grand_total"]})
	order.calculate_totals()
	return order


def _ensure_customer():
	name = frappe.db.get_value("Customer", {"customer_name": "IMOGI Loyalty Smoke"}, "name")
	if name:
		return name
	doc = frappe.get_doc(
		{
			"doctype": "Customer",
			"customer_name": "IMOGI Loyalty Smoke",
			"customer_type": "Individual",
		}
	).insert(ignore_permissions=True)
	return doc.name


def _ensure_voucher(company):
	code = "IMOGISMoke10"
	if not frappe.db.exists("IMOGI POS Voucher", code):
		frappe.get_doc(
			{
				"doctype": "IMOGI POS Voucher",
				"voucher_code": code,
				"company": company,
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
		raise RuntimeError("No sales item found for loyalty smoke test")
	return row[0].item_code
