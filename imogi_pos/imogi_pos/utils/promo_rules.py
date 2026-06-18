# Copyright (c) 2026, Imogi and contributors
"""Automatic promo rules (Buy X Get Y) for IMOGI POS checkout."""

import json

import frappe
from frappe import _
from frappe.utils import cint, flt, getdate, today

from imogi_pos.imogi_pos.utils.flow import resolve_company


def is_promo_enabled(settings=None):
	from imogi_pos.imogi_pos.utils.feature_gating import is_setting_enabled
	from imogi_pos.imogi_pos.utils.flow import get_settings

	settings = settings or get_settings()
	return is_setting_enabled("enable_promo_rules", settings)


def _attach_reward_items(rules):
	if not rules:
		return rules
	parents = [row.name for row in rules]
	reward_rows = frappe.get_all(
		"IMOGI POS Promo Rule Reward",
		filters={"parent": ["in", parents]},
		fields=["parent", "item_code", "qty", "uom"],
		order_by="parent asc, idx asc",
	)
	by_parent = {}
	for row in reward_rows:
		by_parent.setdefault(row.parent, []).append(
			{"item_code": row.item_code, "qty": flt(row.qty or 1), "uom": row.uom}
		)
	for rule in rules:
		rewards = by_parent.get(rule.name) or []
		if not rewards and rule.reward_item_code:
			rewards = [{"item_code": rule.reward_item_code, "qty": 1, "uom": None}]
		rule["reward_items"] = rewards
	return rules


def _attach_outlets(rules):
	if not rules:
		return rules
	parents = [row.name for row in rules]
	outlet_rows = frappe.get_all(
		"IMOGI POS Promo Rule Outlet",
		filters={"parent": ["in", parents]},
		fields=["parent", "branch", "branch_name", "branch_code"],
		order_by="parent asc, idx asc",
	)
	by_parent = {}
	for row in outlet_rows:
		by_parent.setdefault(row.parent, []).append(
			{
				"branch": row.branch,
				"branch_name": row.branch_name,
				"branch_code": row.branch_code,
			}
		)
	for rule in rules:
		rule["outlets"] = by_parent.get(rule.name) or []
	return rules


def _normalize_branch_ref(branch_ref):
	"""Resolve cashier branch input to IMOGI Branch name + branch_code."""
	ref = (branch_ref or "").strip()
	if not ref:
		return None
	if frappe.db.exists("IMOGI Branch", ref):
		row = frappe.db.get_value(
			"IMOGI Branch", ref, ["name", "branch_code"], as_dict=True
		)
		return row
	row = frappe.db.get_value(
		"IMOGI Branch", {"branch_code": ref}, ["name", "branch_code"], as_dict=True
	)
	if row:
		return row
	return {"name": ref, "branch_code": ref}


def _outlet_matches_branch(outlet_row, branch_ref):
	normalized = _normalize_branch_ref(branch_ref)
	if not normalized:
		return False
	outlet_name = (outlet_row.get("branch") or "").strip()
	outlet_code = (outlet_row.get("branch_code") or "").strip()
	ref = (branch_ref or "").strip()
	if outlet_name and outlet_name in {normalized.get("name"), ref}:
		return True
	if outlet_code and outlet_code in {normalized.get("branch_code"), ref}:
		return True
	return False


def get_active_promo_rules(company=None, branch=None):
	company = resolve_company(company)
	today_date = getdate(today())
	rules = frappe.get_all(
		"IMOGI POS Promo Rule",
		filters={"company": company},
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
		if not row.valid_from or not row.valid_upto:
			continue
		active.append(row)
	active = _attach_outlets(_attach_reward_items(active))
	if not branch:
		return active
	filtered = []
	for rule in active:
		outlets = rule.get("outlets") or []
		if not outlets:
			filtered.append(rule)
			continue
		if branch and any(_outlet_matches_branch(row, branch) for row in outlets):
			filtered.append(rule)
	return filtered


def _cart_qty_for_rule(items, rule):
	qty = 0
	trigger_code = rule.trigger_item_code
	trigger_group = rule.trigger_item_group
	for row in items or []:
		if row.get("is_promo_reward"):
			continue
		code = row.get("item_code")
		if trigger_code and code == trigger_code:
			qty += flt(row.get("qty"))
			continue
		if trigger_group and not trigger_code:
			group = frappe.db.get_value("Item", code, "item_group")
			if group == trigger_group:
				qty += flt(row.get("qty"))
	return qty


def _promo_free_applications(paid_qty, min_qty):
	"""How many free rewards apply for beli X dapat 1 gratis.

	Each bundle is min_qty paid + 1 free (min_qty + 1 items total).
	Examples: X=1 → 1 paid + 1 free; X=2 → 2 paid + 1 free.
	"""
	paid_qty = max(0, cint(paid_qty))
	min_qty = max(1, cint(min_qty))
	if paid_qty < min_qty:
		return 0
	return int((paid_qty + min_qty) // (min_qty + 1))


def _item_rate(items, item_code):
	for row in items or []:
		if row.get("item_code") == item_code:
			return flt(row.get("rate"))
	return flt(frappe.db.get_value("Item Price", {"item_code": item_code}, "price_list_rate") or 0)


def apply_promo_rules(items, company=None, branch=None):
	"""Apply active promo rules to cart. Returns adjusted items + promo discount."""
	items = [dict(row) for row in (items or [])]
	if not is_promo_enabled():
		return {"items": items, "promo_discount": 0, "applied_promos": [], "pending_promos": []}

	company = resolve_company(company)
	rules = get_active_promo_rules(company, branch=branch)
	applied = []
	total_discount = 0

	pending = []

	for rule in rules:
		min_qty = max(1, cint(rule.min_qty))
		cart_qty = _cart_qty_for_rule(items, rule)

		discount = 0
		label = rule.promo_name or rule.name

		if rule.rule_type == "Buy X Get Y Free":
			trigger = rule.trigger_item_code
			if not trigger:
				continue
			if cart_qty < min_qty:
				if cart_qty > 0:
					pending.append(
						{
							"promo": rule.name,
							"label": _("{0}: beli {1} dapat 1 gratis — tambah {2} lagi").format(
								label, min_qty, int(min_qty - cart_qty)
							),
						}
					)
				continue
			free_qty = _promo_free_applications(cart_qty, min_qty)
			if free_qty <= 0:
				continue
			rate = _item_rate(items, trigger)
			discount = free_qty * rate
			existing = next(
				(
					row
					for row in items
					if row.get("item_code") == trigger
					and flt(row.get("rate")) == 0
					and row.get("is_promo_reward")
				),
				None,
			)
			if existing:
				existing["qty"] = flt(existing.get("qty")) + free_qty
			else:
				items.append(
					{
						"item_code": trigger,
						"qty": free_qty,
						"rate": 0,
						"is_promo_reward": 1,
						"promo_rule": rule.name,
					}
				)
			label = _("{0}: beli {1} dapat 1 gratis").format(label, min_qty)

		elif rule.rule_type == "Buy X Get Other Free":
			if cart_qty < min_qty:
				if cart_qty > 0:
					pending.append(
						{
							"promo": rule.name,
							"label": _("{0}: tambah {1} lagi untuk dapat reward").format(
								label, int(min_qty - cart_qty)
							),
						}
					)
				continue
			applications = _promo_free_applications(cart_qty, min_qty)
			if applications <= 0:
				continue
			reward_items = rule.get("reward_items") or []
			if not reward_items and rule.reward_item_code:
				reward_items = [{"item_code": rule.reward_item_code, "qty": 1}]
			if not reward_items:
				continue
			reward_labels = []
			for reward_row in reward_items:
				reward = reward_row.get("item_code")
				if not reward:
					continue
				reward_qty = max(1, flt(reward_row.get("qty") or 1))
				add_qty = applications * reward_qty
				rate = _item_rate(items, reward) or flt(rule.reward_value)
				discount += add_qty * rate
				existing = next(
					(
						row
						for row in items
						if row.get("item_code") == reward and flt(row.get("rate")) == 0
					),
					None,
				)
				if existing:
					existing["qty"] = flt(existing.get("qty")) + add_qty
				else:
					items.append(
						{
							"item_code": reward,
							"qty": add_qty,
							"rate": 0,
							"is_promo_reward": 1,
							"promo_rule": rule.name,
						}
					)
				reward_labels.append(f"{reward} x{int(reward_qty) if reward_qty == int(reward_qty) else reward_qty}")
			if not reward_labels:
				continue
			label = _("{0}: beli {1} dapat {2}").format(label, min_qty, ", ".join(reward_labels))

		elif rule.rule_type == "Qty Discount Percent":
			if cart_qty < min_qty:
				continue
			trigger = rule.trigger_item_code
			if not trigger:
				continue
			pct = flt(rule.reward_value)
			for row in items:
				if row.get("item_code") == trigger:
					line_amount = flt(row.get("qty")) * flt(row.get("rate"))
					discount += line_amount * pct / 100
			label = _("{0}: diskon {1}%").format(label, pct)

		elif rule.rule_type == "Qty Discount Amount":
			if cart_qty < min_qty:
				continue
			trigger = rule.trigger_item_code
			if not trigger:
				continue
			amount = flt(rule.reward_value)
			if amount <= 0:
				continue
			line_total = 0
			for row in items:
				if row.get("item_code") == trigger:
					line_total += flt(row.get("qty")) * flt(row.get("rate"))
			if line_total <= 0:
				continue
			discount = min(amount, line_total)
			label = _("{0}: diskon {1}").format(label, frappe.format(amount, {"fieldtype": "Currency"}))

		if discount <= 0:
			continue

		total_discount += discount
		applied.append({"promo": rule.name, "label": label, "discount": flt(discount)})

	return {
		"items": items,
		"promo_discount": flt(total_discount),
		"applied_promos": applied,
		"pending_promos": pending,
	}


def serialize_applied_promos(applied_promos):
	if not applied_promos:
		return ""
	return json.dumps(applied_promos, ensure_ascii=False)
