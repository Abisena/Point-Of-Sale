# Copyright (c) 2026, Imogi and contributors
"""Smoke test tier gating helpers (no Frappe DB required for core logic)."""

from imogi_pos.imogi_pos.utils.feature_gating import (
	SETTINGS_FEATURE_MAP,
	get_feature_block_reason,
	get_settings_field_locks,
	serialize_cashier_feature_meta,
)
from imogi_pos.imogi_pos.utils.role_gating import ROLE_PRIVILEGES
from imogi_pos.imogi_pos.utils.workspace_tier_gating import is_workspace_item_in_plan
from imogi_pos.imogi_pos.utils.feature_registry import (
	TIER_RANK,
	is_feature_in_plan,
	is_tier_at_least,
	summarize_tiers,
)


def _run_tier_independent_checks():
	"""Assertions valid in both SaaS-gating and tier-disabled deployments."""
	# Tier ordering is pure rank math (does not consult deployment flag).
	assert TIER_RANK["Free"] < TIER_RANK["Starter"] < TIER_RANK["Professional"] < TIER_RANK["Enterprise"]

	# Role inheritance privileges.
	assert "Supervisor" in ROLE_PRIVILEGES["Manager"]
	assert "Kasir" in ROLE_PRIVILEGES["Supervisor"]
	assert "Waiter" in ROLE_PRIVILEGES["Waiter"]

	# Settings field lock map must cover every mapped feature field.
	locks = get_settings_field_locks()
	for fieldname in SETTINGS_FEATURE_MAP:
		assert fieldname in locks["locks"], f"missing lock for {fieldname}"


def _run_saas_gating_checks():
	"""Strict tier assertions — only meaningful when gating is active."""
	summary = summarize_tiers()
	assert summary["per_tier"]["Free"] == 7
	assert summary["per_tier"]["Starter"] == 15
	assert is_tier_at_least("Enterprise", "Free")
	assert not is_tier_at_least("Free", "Starter")
	assert is_feature_in_plan("hold_order", "Starter")
	assert not is_feature_in_plan("hold_order", "Free")
	assert is_feature_in_plan("kitchen_display", "Professional")
	assert not is_feature_in_plan("multi_outlet", "Professional")
	assert is_feature_in_plan("multi_outlet", "Enterprise")
	locks_free = get_settings_field_locks("Free")
	assert locks_free["tier"] == "Free"
	assert not locks_free["locks"]["enable_loyalty"]["allowed"]
	assert locks_free["locks"]["enable_loyalty"]["min_tier"] == "Professional"
	assert locks_free["locks"]["enable_payment_gateway"]["allowed"]
	locks_starter = get_settings_field_locks("Starter")
	assert locks_starter["locks"]["enable_payment_gateway"]["allowed"]
	assert not locks_starter["locks"]["enable_pos_shift"]["allowed"]

	class _FakeSettings:
		subscription_tier = "Free"
		enable_loyalty = 0
		enable_stamp_card = 0
		enable_promo_rules = 0
		enable_payment_gateway = 0
		enable_marketplace_orders = 0
		enable_pos_shift = 0
		enable_kitchen_display = 0
		enable_fulfillment = 0
		enable_order_api = 0
		multi_branch = 0

	free_doc = _FakeSettings()
	assert get_feature_block_reason("hold_order", free_doc, "Free") == "tier"
	assert get_feature_block_reason("hold_order", free_doc, "Starter") is None
	assert get_feature_block_reason("point_reward", free_doc, "Professional") == "settings"
	meta = serialize_cashier_feature_meta(free_doc)
	assert meta["hold_order"]["blocked_reason"] == "tier"
	assert not meta["hold_order"]["allowed"]

	assert is_workspace_item_in_plan("Page", "imogi-pos-cashier", "Free")
	assert not is_workspace_item_in_plan("Page", "kitchen-display", "Free")
	assert is_workspace_item_in_plan("Page", "kitchen-display", "Professional")
	assert is_workspace_item_in_plan("Page", "fulfillment-queue", "Professional")
	assert not is_workspace_item_in_plan("Page", "imogi-pos-add-branch", "Professional")
	assert is_workspace_item_in_plan("Page", "imogi-pos-add-branch", "Enterprise")


def _run_tier_disabled_checks():
	"""When gating is off, everything must be unlocked (the correct behavior)."""
	summary = summarize_tiers()
	for tier in ("Free", "Starter", "Professional", "Enterprise"):
		assert summary["per_tier"][tier] == 100, f"{tier} should open all 100"
	assert is_tier_at_least("Free", "Enterprise"), "tier-disabled: any tier passes"
	assert is_feature_in_plan("multi_outlet", "Free"), "tier-disabled: feature always in plan"
	assert is_workspace_item_in_plan("Page", "kitchen-display", "Free")

	locks = get_settings_field_locks()
	assert locks.get("tier_disabled") is True
	assert all(lock["allowed"] for lock in locks["locks"].values()), "all fields unlocked"


def run():
	from imogi_pos.imogi_pos.utils.deployment_mode import is_subscription_tier_disabled

	_run_tier_independent_checks()

	tier_disabled = is_subscription_tier_disabled()
	if tier_disabled:
		_run_tier_disabled_checks()
		mode = "tier-disabled"
	else:
		_run_saas_gating_checks()
		mode = "saas-gating"

	print(f"Feature gating smoke OK ({mode}); tiers:", list(TIER_RANK))
	return {"ok": True, "mode": mode}


if __name__ == "__main__":
	run()
