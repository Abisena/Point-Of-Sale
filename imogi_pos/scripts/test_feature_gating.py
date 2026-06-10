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


def run():
	summary = summarize_tiers()
	assert summary["per_tier"]["Free"] == 6
	assert summary["per_tier"]["Starter"] == 14
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
	for fieldname in SETTINGS_FEATURE_MAP:
		assert fieldname in locks_free["locks"]

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

	assert "Supervisor" in ROLE_PRIVILEGES["Manager"]
	assert "Kasir" in ROLE_PRIVILEGES["Supervisor"]
	assert "Waiter" in ROLE_PRIVILEGES["Waiter"]

	assert is_workspace_item_in_plan("Page", "imogi-pos-cashier", "Free")
	assert not is_workspace_item_in_plan("Page", "kitchen-display", "Free")
	assert is_workspace_item_in_plan("Page", "kitchen-display", "Professional")
	assert is_workspace_item_in_plan("Page", "fulfillment-queue", "Professional")
	assert not is_workspace_item_in_plan("Page", "imogi-pos-add-branch", "Professional")
	assert is_workspace_item_in_plan("Page", "imogi-pos-add-branch", "Enterprise")

	print("Feature gating smoke OK:", summary["per_tier"], "tiers:", list(TIER_RANK))
	return summary


if __name__ == "__main__":
	run()
