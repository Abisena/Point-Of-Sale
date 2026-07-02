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


def _tier_disabled() -> bool:
	"""True on self-host/Enterprise deployments where gating is turned off."""
	try:
		from imogi_pos.imogi_pos.utils.deployment_mode import is_subscription_tier_disabled

		return bool(is_subscription_tier_disabled())
	except Exception:
		return False


def test_tier_disabled_mode():
	"""When gating is off, resolve_effective_tier always returns Enterprise."""
	for kwargs in (
		{"subscription_tier": "Starter", "enable_saas_billing_sync": 0},
		{
			"subscription_tier": "Free",
			"enable_saas_billing_sync": 1,
			"billing_status": "Cancelled",
			"billing_plan_code": "starter",
		},
	):
		assert resolve_effective_tier(_Settings(**kwargs)) == "Enterprise"


def main():
	# Pure plan→tier mapping is always valid (no deployment dependency).
	test_plan_mapping()

	if _tier_disabled():
		test_tier_disabled_mode()
		print("OK: subscription billing tests passed (tier-disabled mode)")
	else:
		test_manual_mode()
		test_active_billing()
		test_expired_period()
		test_cancelled_status()
		print("OK: subscription billing tests passed (saas mode)")
	print(f"Active statuses: {sorted(BILLING_STATUS_ACTIVE)}")


def run():
	"""Entry-point for `bench execute ...test_subscription_billing.run`."""
	main()
	return {"ok": True}


if __name__ == "__main__":
	main()
