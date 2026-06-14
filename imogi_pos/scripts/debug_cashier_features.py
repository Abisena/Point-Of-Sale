# Copyright (c) 2026, Imogi and contributors
"""One-off debug: why cashier features/payments are missing."""

from __future__ import annotations

import frappe

from imogi_pos.imogi_pos.utils.feature_gating import get_cashier_feature_flags, is_setting_enabled
from imogi_pos.imogi_pos.utils.flow import get_settings


def run(user="gunawan@gmail.com"):
	frappe.set_user(user)
	settings = get_settings()
	from imogi_pos.api.cashier import get_cashier_context

	ctx = get_cashier_context()
	flags = get_cashier_feature_flags(settings, user=user)
	print(f"user={user} pos_profile={ctx['pos_profile']}")
	print(f"enable_role_gating={settings.enable_role_gating}")
	print(
		"toggles:",
		"loyalty",
		settings.enable_loyalty,
		"stamp",
		settings.enable_stamp_card,
		"promo",
		settings.enable_promo_rules,
		"gateway",
		settings.enable_payment_gateway,
	)
	print("is_setting_enabled:", {
		"loyalty": is_setting_enabled("enable_loyalty", settings),
		"stamp": is_setting_enabled("enable_stamp_card", settings),
		"promo": is_setting_enabled("enable_promo_rules", settings),
		"gateway": is_setting_enabled("enable_payment_gateway", settings),
	})
	print("ctx:", {
		"loyalty_enabled": ctx["loyalty_enabled"],
		"enable_stamp_card": ctx["enable_stamp_card"],
		"enable_promo_rules": ctx["enable_promo_rules"],
		"payment_gateway_enabled": ctx["payment_gateway_enabled"],
		"payment_modes": ctx["payment_modes"],
	})
	for fid in ("qris", "point_reward", "voucher"):
		meta = ctx["feature_meta"][fid]
		print(f"  {fid}: allowed={flags[fid]} blocked_reason={meta.get('blocked_reason')} required_role={meta.get('required_role')}")
	return {"ctx": ctx, "flags": flags}
