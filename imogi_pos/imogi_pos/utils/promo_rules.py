# Copyright (c) 2026, Imogi and contributors
"""Automatic promo rules (Buy X Get Y) for IMOGI POS checkout."""

import json

import frappe
from frappe import _
from frappe.utils import cint, flt, getdate, today

from imogi_pos.imogi_pos.utils.flow import resolve_company


def is_promo_enabled(settings=None):
	from imogi_pos.imogi_pos.utils.flow import get_settings

	settings = settings or get_settings()
	return cint(settings.enable_promo_rules)


def get_active_promo_rules(company=None):
	company = resolve_company(company)
	today_date = getdate(today())
	rules = frappe.get_all(
		"IMOGI POS Promo Rule",
		filters={"company": company, "is_active": 1},
		fields=[
			"name",
			"promo_name",
			"rule_type",
			"trigger_item_code",
			"trigger_item_group",
			"min_qty",
			"reward_item_code",
			"reward_value",
			"valid_from",
			"valid_upto",
		],
		order_by="modified desc",
	)
	active = []
	for row in rules:
		if row.valid_from and getdate(row.valid_from) > today_date:
			continue
		if row.valid_upto and getdate(row.valid_upto) < today_date:
			continue
		active.append(row)
	return active


def _cart_qty_for_rule(items, rule):
	qty = 0
	trigger_code = rule.trigger_item_code
	trigger_group = rule.trigger_item_group
	for row in items or []:
		code = row.get("item_code")
		if trigger_code and code == trigger_code:
			qty += flt(row.get("qty"))
			continue
		if trigger_group and not trigger_code:
			group = frappe.db.get_value("Item", code, "item_group")
			if group == trigger_group:
				qty += flt(row.get("qty"))
	return qty


def _item_rate(items, item_code):
	for row in items or []:
		if row.get("item_code") == item_code:
			return flt(row.get("rate"))
	return flt(frappe.db.get_value("Item Price", {"item_code": item_code}, "price_list_rate") or 0)


def apply_promo_rules(items, company=None):
	"""Apply active promo rules to cart. Returns adjusted items + promo discount."""
	items = [dict(row) for row in (items or [])]
	if not is_promo_enabled():
		return {"items": items, "promo_discount": 0, "applied_promos": []}

	company = resolve_company(company)
	rules = get_active_promo_rules(company)
	applied = []
	total_discount = 0

	for rule in rules:
		min_qty = max(1, cint(rule.min_qty))
		cart_qty = _cart_qty_for_rule(items, rule)
		if cart_qty < min_qty:
			continue

		applications = int(cart_qty // min_qty)
		if applications <= 0:
			continue

		discount = 0
		label = rule.promo_name or rule.name

		if rule.rule_type == "Buy X Get Y Free":
			trigger = rule.trigger_item_code
			if not trigger:
				continue
			rate = _item_rate(items, trigger)
			discount = applications * rate
			label = _("{0}: beli {1} gratis 1").format(label, min_qty)

		elif rule.rule_type == "Buy X Get Other Free":
			reward = rule.reward_item_code
			if not reward:
				continue
			rate = _item_rate(items, reward) or flt(rule.reward_value)
			discount = applications * rate
			existing = next((row for row in items if row.get("item_code") == reward and flt(row.get("rate")) == 0), None)
			if existing:
				existing["qty"] = flt(existing.get("qty")) + applications
			else:
				items.append(
					{
						"item_code": reward,
						"qty": applications,
						"rate": 0,
						"is_promo_reward": 1,
						"promo_rule": rule.name,
					}
				)
			label = _("{0}: beli {1} dapat {2}").format(label, min_qty, reward)

		elif rule.rule_type == "Qty Discount Percent":
			trigger = rule.trigger_item_code
			if not trigger:
				continue
			pct = flt(rule.reward_value)
			for row in items:
				if row.get("item_code") == trigger:
					line_amount = flt(row.get("qty")) * flt(row.get("rate"))
					discount += line_amount * pct / 100
			label = _("{0}: diskon {1}%").format(label, pct)

		if discount <= 0:
			continue

		total_discount += discount
		applied.append({"promo": rule.name, "label": label, "discount": flt(discount)})

	return {
		"items": items,
		"promo_discount": flt(total_discount),
		"applied_promos": applied,
	}


def serialize_applied_promos(applied_promos):
	if not applied_promos:
		return ""
	return json.dumps(applied_promos, ensure_ascii=False)
