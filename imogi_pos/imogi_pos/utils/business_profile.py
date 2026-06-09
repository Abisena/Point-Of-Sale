# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _

from imogi_pos.imogi_pos.utils.flow import get_settings


BUSINESS_RESTAURANT = "Restaurant / Cafe"
BUSINESS_UMKM = "UMKM"


def is_umkm():
	return get_settings().business_type == BUSINESS_UMKM


def is_restaurant():
	return get_settings().business_type == BUSINESS_RESTAURANT


def apply_business_profile(business_type):
	settings = frappe.get_single("IMOGI POS Settings")
	settings.business_type = business_type

	if business_type == BUSINESS_UMKM:
		settings.enable_kitchen_display = 0
		settings.enable_fulfillment = 0
		settings.kitchen_item_groups = ""
		settings.fulfillment_for_order_types = ""
	elif business_type == BUSINESS_RESTAURANT:
		settings.enable_kitchen_display = 1
		settings.enable_fulfillment = 1
		settings.kitchen_item_groups = settings.kitchen_item_groups or "Consumable"
		settings.fulfillment_for_order_types = settings.fulfillment_for_order_types or "Takeaway\nDelivery"

	settings.save(ignore_permissions=True)

	from imogi_pos.imogi_pos.utils.workspace import sync_workspaces

	sync_workspaces(business_type)
	return settings


def get_flow_summary(business_type=None):
	business_type = business_type or get_settings().business_type
	if business_type == BUSINESS_UMKM:
		return {
			"label": BUSINESS_UMKM,
			"steps": [
				_("Order & Payment"),
				_("Completed (1 operator)"),
			],
			"description": _(
				"Simplified flow for small business — payment completes the order directly."
			),
		}
	return {
		"label": BUSINESS_RESTAURANT,
		"steps": [
			_("Order & Payment"),
			_("Kitchen Display (conditional)"),
			_("Fulfillment (conditional)"),
			_("Delivery & Service"),
			_("Completed"),
		],
		"description": _(
			"Full F&B flow for restaurant and cafe with kitchen, packing, and service steps."
		),
	}
