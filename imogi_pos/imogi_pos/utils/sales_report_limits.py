# Copyright (c) 2026, Imogi and contributors
"""Date-range rules for Laporan Penjualan (Free vs paid tiers)."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import add_days, date_diff, get_first_day, getdate, today

from imogi_pos.imogi_pos.utils.feature_registry import get_subscription_tier, is_tier_at_least

FREE_CUSTOM_MAX_DAYS = 30
VALID_PERIODS = frozenset({"today", "yesterday", "last_7_days", "this_month", "custom"})


def resolve_sales_report_period(period=None, from_date=None, to_date=None):
	"""Return (from_day, to_day, normalized_period) for sales report queries."""
	today_day = getdate(today())
	normalized = (period or "today").strip().lower()
	if normalized not in VALID_PERIODS:
		normalized = "today"

	if normalized == "today":
		return today_day, today_day, normalized
	if normalized == "yesterday":
		day = add_days(today_day, -1)
		return day, day, normalized
	if normalized == "last_7_days":
		return add_days(today_day, -6), today_day, normalized
	if normalized == "this_month":
		return get_first_day(today_day), today_day, normalized

	from_day = getdate(from_date) if from_date else today_day
	to_day = getdate(to_date) if to_date else today_day
	if to_day < from_day:
		to_day = from_day
	return from_day, to_day, normalized


def inclusive_day_span(from_day, to_day) -> int:
	return date_diff(getdate(to_day), getdate(from_day)) + 1


def validate_sales_report_range(period, from_day, to_day, tier=None):
	"""Enforce Free-tier custom range cap; presets are always allowed."""
	from imogi_pos.imogi_pos.utils.deployment_mode import is_subscription_tier_disabled

	if is_subscription_tier_disabled():
		return

	tier = tier or get_subscription_tier()
	if is_tier_at_least(tier, "Starter"):
		return

	period = (period or "today").strip().lower()
	if period != "custom":
		return

	span = inclusive_day_span(from_day, to_day)
	if span <= FREE_CUSTOM_MAX_DAYS:
		return

	frappe.throw(
		_(
			"Paket Free: laporan custom maksimal {0} hari. Untuk periode 3 bulan, 6 bulan, atau 1 tahun, upgrade ke paket Starter."
		).format(FREE_CUSTOM_MAX_DAYS),
		frappe.ValidationError,
		title=_("Periode Laporan Terbatas"),
	)


def sales_report_limits_payload(tier=None):
	from imogi_pos.imogi_pos.utils.deployment_mode import is_subscription_tier_disabled

	if is_subscription_tier_disabled():
		return {
			"tier": None,
			"tier_disabled": True,
			"is_free": False,
			"show_channel_breakdown": True,
			"max_custom_days": None,
			"periods": [
				{"id": "today", "label": _("Hari Ini"), "default": True},
				{"id": "yesterday", "label": _("Kemarin")},
				{"id": "last_7_days", "label": _("7 Hari Terakhir")},
				{"id": "this_month", "label": _("Bulan Ini")},
				{"id": "custom", "label": _("Custom"), "max_days": None},
			],
			"upgrade_feature": None,
			"upgrade_min_tier": None,
		}

	tier = tier or get_subscription_tier()
	is_free = not is_tier_at_least(tier, "Starter")
	show_channel_breakdown = is_tier_at_least(tier, "Starter")
	return {
		"tier": tier,
		"is_free": is_free,
		"show_channel_breakdown": show_channel_breakdown,
		"max_custom_days": FREE_CUSTOM_MAX_DAYS if is_free else None,
		"periods": [
			{"id": "today", "label": _("Hari Ini"), "default": True},
			{"id": "yesterday", "label": _("Kemarin")},
			{"id": "last_7_days", "label": _("7 Hari Terakhir")},
			{"id": "this_month", "label": _("Bulan Ini")},
			{"id": "custom", "label": _("Custom"), "max_days": FREE_CUSTOM_MAX_DAYS if is_free else None},
		],
		"upgrade_feature": "sales_report_extended",
		"upgrade_min_tier": "Starter",
	}
