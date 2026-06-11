# Copyright (c) 2026, Imogi and contributors
"""ERPNext desk deployment mode.

SaaS subscription tiers (Free, Starter, Professional, Enterprise) apply only to
the standalone web product. ERPNext installs ship with tier gating disabled —
all features are controlled by role + IMOGI POS Settings toggles only.
"""

from __future__ import annotations

ERP_SUBSCRIPTION_TIERS_DISABLED = True


def is_subscription_tier_disabled() -> bool:
	return ERP_SUBSCRIPTION_TIERS_DISABLED


def is_erp_enterprise_deployment() -> bool:
	"""Backward-compatible alias for ERP desk (no SaaS tiers)."""
	return is_subscription_tier_disabled()


def get_erp_deployment_tier() -> str | None:
	"""Legacy helper — None when subscription tiers are not used."""
	return None if is_subscription_tier_disabled() else "Enterprise"
