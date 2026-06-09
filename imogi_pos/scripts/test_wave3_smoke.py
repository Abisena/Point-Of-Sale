# Copyright (c) 2026, Imogi and contributors
"""Smoke test: promo rules, loyalty tiers, franchise royalty."""

import frappe
from frappe.utils import flt

from imogi_pos.imogi_pos.utils.flow import get_settings
from imogi_pos.imogi_pos.utils.franchise import compute_order_royalty, get_franchise_sales_summary
from imogi_pos.imogi_pos.utils.loyalty import compute_checkout_totals, compute_earn_points, get_loyalty_config
from imogi_pos.imogi_pos.utils.loyalty_tiers import get_tier_for_points
from imogi_pos.imogi_pos.utils.promo_rules import apply_promo_rules


def run():
	frappe.set_user("Administrator")
	settings = get_settings()
	company = settings.default_company
	item = _pick_item()

	settings.enable_promo_rules = 1
	settings.enable_loyalty = 1
	settings.save(ignore_permissions=True)
	frappe.db.commit()

	_ensure_promo_rule(company, item)
	_ensure_loyalty_tiers(company)

	items = [{"item_code": item, "qty": 2, "rate": 10000}]
	promo = apply_promo_rules(items, company=company)
	if flt(promo["promo_discount"]) <= 0:
		raise AssertionError("promo discount not applied for Buy X Get Y")

	totals = compute_checkout_totals(items, company=company)
	if flt(totals["promo_discount"]) <= 0:
		raise AssertionError("checkout totals missing promo discount")

	customer = _ensure_customer()
	from imogi_pos.imogi_pos.utils.loyalty import get_or_create_member
	from imogi_pos.imogi_pos.utils.loyalty_tiers import sync_member_tier

	member = get_or_create_member(customer, company)
	member.db_set({"total_earned": 120, "points": 10})
	sync_member_tier(member)
	member.save(ignore_permissions=True)
	frappe.db.commit()

	tier = get_tier_for_points(120, company)
	if not tier:
		raise AssertionError("loyalty tier not resolved")
	earned = compute_earn_points(25000, get_loyalty_config(), customer=customer, company=company)
	if earned < 2:
		raise AssertionError(f"expected tier-boosted earn >=2, got {earned}")

	branch = _ensure_franchise_branch(company, settings.default_pos_profile)
	order = frappe._dict(
		{
			"company": company,
			"pos_profile": branch.pos_profile,
			"grand_total": 100000,
		}
	)
	royalty = compute_order_royalty(order)
	if flt(royalty) != 5000:
		raise AssertionError(f"expected royalty 5000, got {royalty}")

	summary = get_franchise_sales_summary(company=company)
	print("[promo] discount:", promo["promo_discount"])
	print("[loyalty] earned with tier:", earned, "tier:", tier.tier_name)
	print("[franchise] royalty:", royalty, "branches:", len(summary.get("branches") or []))
	print("Wave 3 smoke tests passed.")


def _ensure_promo_rule(company, item):
	name = "WAVE3-BOGO"
	if frappe.db.exists("IMOGI POS Promo Rule", name):
		return name
	frappe.get_doc(
		{
			"doctype": "IMOGI POS Promo Rule",
			"promo_name": name,
			"company": company,
			"rule_type": "Buy X Get Y Free",
			"min_qty": 2,
			"trigger_item_code": item,
			"is_active": 1,
		}
	).insert(ignore_permissions=True)
	frappe.db.commit()
	return name


def _ensure_loyalty_tiers(company):
	for row in (
		("Bronze", 0, 1),
		("Silver", 50, 1.5),
		("Gold", 100, 2),
	):
		if frappe.db.exists("IMOGI POS Loyalty Tier", row[0]):
			continue
		frappe.get_doc(
			{
				"doctype": "IMOGI POS Loyalty Tier",
				"tier_name": row[0],
				"company": company,
				"min_lifetime_points": row[1],
				"point_multiplier": row[2],
				"is_active": 1,
			}
		).insert(ignore_permissions=True)
	frappe.db.commit()


def _ensure_franchise_branch(company, pos_profile):
	branch = frappe.db.get_value("IMOGI Branch", {"pos_profile": pos_profile}, "name")
	if not branch:
		raise RuntimeError("No IMOGI Branch found for franchise smoke test")
	doc = frappe.get_doc("IMOGI Branch", branch)
	doc.branch_model = "Franchise"
	doc.royalty_percent = 5
	doc.save(ignore_permissions=True)
	frappe.db.commit()
	return doc


def _ensure_customer():
	name = frappe.db.get_value("Customer", {"customer_name": "IMOGI Wave3 Smoke"}, "name")
	if name:
		return name
	return frappe.get_doc(
		{
			"doctype": "Customer",
			"customer_name": "IMOGI Wave3 Smoke",
			"customer_type": "Individual",
		}
	).insert(ignore_permissions=True).name


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
		raise RuntimeError("No sales item found")
	return row[0].item_code
