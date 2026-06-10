#!/usr/bin/env python3
"""Smoke tests for SaaS billing tier resolution (no Frappe DB required)."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
	sys.path.insert(0, str(ROOT))

from imogi_pos.imogi_pos.utils.subscription_billing import (  # noqa: E402
	BILLING_STATUS_ACTIVE,
	map_plan_to_tier,
	resolve_effective_tier,
)


class _Settings:
	def __init__(self, **kwargs):
		for key, value in kwargs.items():
			setattr(self, key, value)


def test_plan_mapping():
	assert map_plan_to_tier("starter-monthly") == "Starter"
	assert map_plan_to_tier("pro") == "Professional"
	assert map_plan_to_tier("enterprise-annual") == "Enterprise"
	assert map_plan_to_tier(None, "Professional") == "Professional"
	assert map_plan_to_tier("unknown-plan") is None


def test_manual_mode():
	settings = _Settings(subscription_tier="Starter", enable_saas_billing_sync=0)
	assert resolve_effective_tier(settings) == "Starter"


def test_active_billing():
	settings = _Settings(
		subscription_tier="Enterprise",
		enable_saas_billing_sync=1,
		billing_status="Active",
		billing_plan_code="starter",
		billing_period_end="2099-01-01",
	)
	assert resolve_effective_tier(settings) == "Starter"


def test_expired_period():
	settings = _Settings(
		subscription_tier="Professional",
		enable_saas_billing_sync=1,
		billing_status="Active",
		billing_plan_code="professional",
		billing_period_end="2020-01-01",
	)
	assert resolve_effective_tier(settings) == "Free"


def test_cancelled_status():
	settings = _Settings(
		subscription_tier="Enterprise",
		enable_saas_billing_sync=1,
		billing_status="Cancelled",
		billing_plan_code="enterprise",
	)
	assert resolve_effective_tier(settings) == "Free"


def main():
	test_plan_mapping()
	test_manual_mode()
	test_active_billing()
	test_expired_period()
	test_cancelled_status()
	print("OK: subscription billing tests passed")
	print(f"Active statuses: {sorted(BILLING_STATUS_ACTIVE)}")


if __name__ == "__main__":
	main()
