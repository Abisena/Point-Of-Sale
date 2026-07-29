# Copyright (c) 2026, Imogi and contributors
"""Validate feature registry counts match product matrix.

Works in both modes:
- Normal SaaS gating: summarize_tiers() reflects cumulative tier counts.
- tier-disabled deployment (self-host Enterprise): every tier opens all
  features, so we validate the *raw matrix intent* via min_tier instead.
"""

from imogi_pos.imogi_pos.utils.feature_registry import (
	FEATURES,
	SUBSCRIPTION_TIERS,
	TIER_RANK,
	summarize_tiers,
)

EXPECTED_CUMULATIVE = {"Free": 7, "Starter": 15, "Professional": 78, "Enterprise": 98}


def _raw_cumulative_counts():
	"""Cumulative count per tier computed directly from each feature's min_tier.

	Independent of deployment flags, so it always reflects matrix design.
	"""
	counts = {}
	for tier in SUBSCRIPTION_TIERS:
		counts[tier] = sum(
			1 for f in FEATURES if TIER_RANK[f["min_tier"]] <= TIER_RANK[tier]
		)
	return counts


def run():
	assert len(FEATURES) == 98, f"expected 98 features, got {len(FEATURES)}"
	assert len({f["id"] for f in FEATURES}) == 98, "duplicate feature ids in registry"

	# Always-valid check: raw matrix intent via min_tier.
	raw = _raw_cumulative_counts()
	for tier, exp in EXPECTED_CUMULATIVE.items():
		assert raw[tier] == exp, f"raw matrix {tier}: expected {exp}, got {raw[tier]}"

	from imogi_pos.imogi_pos.utils.deployment_mode import is_subscription_tier_disabled

	tier_disabled = is_subscription_tier_disabled()
	summary = summarize_tiers()
	per_tier = summary["per_tier"]

	if tier_disabled:
		# All tiers unlock everything when subscription gating is off.
		for tier in SUBSCRIPTION_TIERS:
			assert per_tier[tier] == 98, (
				f"tier-disabled: {tier} should open all 98, got {per_tier[tier]}"
			)
		print("Feature registry OK (tier-disabled mode):", raw)
	else:
		for tier, exp in EXPECTED_CUMULATIVE.items():
			assert per_tier[tier] == exp, f"{tier}: expected {exp}, got {per_tier[tier]}"
		print("Feature registry OK (SaaS gating):", summary)

	return {"ok": True, "raw_cumulative": raw, "tier_disabled": tier_disabled}


if __name__ == "__main__":
	run()
