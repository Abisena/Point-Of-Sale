# Copyright (c) 2026, Imogi and contributors
"""Stamp card loyalty — collect stamps, earn reward voucher."""

import frappe
from frappe import _
from frappe.utils import cint, flt, now_datetime

from imogi_pos.imogi_pos.utils.flow import get_settings, resolve_company


def get_stamp_config(settings=None):
	from imogi_pos.imogi_pos.utils.feature_gating import is_setting_enabled

	settings = settings or get_settings()
	return {
		"enabled": is_setting_enabled("enable_stamp_card", settings),
		"target": max(1, cint(settings.stamp_target) or 10),
		"reward_discount_type": settings.stamp_reward_discount_type or "Percent",
		"reward_discount_value": flt(settings.stamp_reward_discount_value) or 20,
		"reward_min_order": flt(settings.stamp_reward_min_order) or 0,
	}


def is_stamp_enabled(settings=None):
	return bool(get_stamp_config(settings)["enabled"])


def serialize_stamp(member, config=None):
	config = config or get_stamp_config()
	stamps = cint(member.stamp_count)
	target = config["target"]
	return {
		"enabled": config["enabled"],
		"stamps": stamps,
		"target": target,
		"remaining": max(0, target - stamps),
		"progress_pct": min(100, int(stamps * 100 / target)) if target else 0,
	}


def apply_stamp_after_payment(order, member):
	"""Increment stamp; issue reward voucher when target reached."""
	config = get_stamp_config()
	if not config["enabled"] or not order.customer:
		return None

	stamps = cint(member.stamp_count) + 1
	reward = None
	if stamps >= config["target"]:
		reward = _create_stamp_reward_voucher(order, member, config)
		stamps = 0

	member.stamp_count = stamps
	return reward


def _create_stamp_reward_voucher(order, member, config):
	company = resolve_company(order.company)
	code = f"STAMP-{frappe.generate_hash(length=8).upper()}"
	while frappe.db.exists("IMOGI POS Voucher", code):
		code = f"STAMP-{frappe.generate_hash(length=8).upper()}"

	voucher = frappe.get_doc(
		{
			"doctype": "IMOGI POS Voucher",
			"voucher_code": code,
			"company": company,
			"discount_type": config["reward_discount_type"],
			"discount_value": config["reward_discount_value"],
			"min_order_amount": config["reward_min_order"],
			"max_redemptions": 1,
			"is_active": 1,
			"remarks": _("Stamp reward for {0}").format(member.customer),
		}
	)
	voucher.insert(ignore_permissions=True)
	return {
		"voucher_code": code,
		"discount_type": config["reward_discount_type"],
		"discount_value": config["reward_discount_value"],
	}
