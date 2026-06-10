# Copyright (c) 2026, Imogi and contributors
"""Validate feature registry counts match product matrix."""

from imogi_pos.imogi_pos.utils.feature_registry import (
	FEATURES,
	SUBSCRIPTION_TIERS,
	summarize_tiers,
)


def run():
	expected = {"Free": 6, "Starter": 14, "Professional": 77, "Enterprise": 99}
	summary = summarize_tiers()
	per_tier = summary["per_tier"]

	assert len(FEATURES) == 99, f"expected 99 features, got {len(FEATURES)}"

	for tier in SUBSCRIPTION_TIERS:
		actual = per_tier[tier]
		exp = expected[tier]
		assert actual == exp, f"{tier}: expected {exp} features, got {actual}"

	print("Feature registry OK:", summary)
	return summary


if __name__ == "__main__":
	run()
