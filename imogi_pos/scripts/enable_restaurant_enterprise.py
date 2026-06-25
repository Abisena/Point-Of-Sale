# Copyright (c) 2026, Imogi and contributors
"""Enable full Restaurant / Cafe profile for enterprise deployments."""

from __future__ import annotations

import frappe

from imogi_pos.imogi_pos.utils.business_profile import BUSINESS_RESTAURANT, apply_business_profile


def run():
	from imogi_pos.imogi_pos.utils.settings_flow import append_fulfillment_order_types_from_text

	settings = apply_business_profile(BUSINESS_RESTAURANT)
	settings.fulfillment_order_type_rows = []
	append_fulfillment_order_types_from_text(settings, "Takeaway\nDelivery")
	settings.enable_promo_rules = 1
	settings.enable_loyalty = 1
	settings.save(ignore_permissions=True)
	frappe.db.commit()
	return {
		"business_type": settings.business_type,
		"subscription_tier": settings.subscription_tier,
		"fulfillment_order_type_rows": [row.order_type for row in settings.fulfillment_order_type_rows or []],
	}
