# Copyright (c) 2026, Imogi and contributors
"""Enable full Restaurant / Cafe profile for enterprise deployments."""

from __future__ import annotations

import frappe

from imogi_pos.imogi_pos.utils.business_profile import BUSINESS_RESTAURANT, apply_business_profile


def run():
	settings = apply_business_profile(BUSINESS_RESTAURANT)
	settings.fulfillment_for_order_types = "Takeaway\nDelivery"
	settings.enable_promo_rules = 1
	settings.enable_loyalty = 1
	settings.save(ignore_permissions=True)
	frappe.db.commit()
	return {
		"business_type": settings.business_type,
		"subscription_tier": settings.subscription_tier,
		"fulfillment_for_order_types": settings.fulfillment_for_order_types,
	}
