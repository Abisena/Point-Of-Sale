# Copyright (c) 2026, Imogi and contributors
"""Loyalty member tiers with earn multipliers."""

import frappe
from frappe.utils import cint, flt

from imogi_pos.imogi_pos.utils.flow import resolve_company


def get_tier_for_points(total_earned, company=None):
	company = resolve_company(company)
	tiers = frappe.get_all(
		"IMOGI POS Loyalty Tier",
		filters={"company": company, "is_active": 1},
		fields=["name", "tier_name", "min_lifetime_points", "point_multiplier"],
		order_by="min_lifetime_points desc",
	)
	points = cint(total_earned)
	for tier in tiers:
		if points >= cint(tier.min_lifetime_points):
			return tier
	return None


def sync_member_tier(member):
	tier = get_tier_for_points(member.total_earned, member.company)
	member.loyalty_tier = tier.name if tier else ""
	member.tier_multiplier = flt(tier.point_multiplier) if tier else 1
	return tier


def get_member_multiplier(member):
	if member and flt(member.tier_multiplier) > 0:
		return flt(member.tier_multiplier)
	return 1.0


def serialize_tier(tier):
	if not tier:
		return None
	return {
		"name": tier.name,
		"tier_name": tier.tier_name,
		"min_lifetime_points": cint(tier.min_lifetime_points),
		"point_multiplier": flt(tier.point_multiplier),
	}
