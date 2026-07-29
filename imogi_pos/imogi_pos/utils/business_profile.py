# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _

from imogi_pos.imogi_pos.utils.flow import get_settings


BUSINESS_RESTAURANT = "Restaurant / Cafe"
BUSINESS_UMKM = "UMKM"

# Legacy workspace keys — kept for backward compatibility only.
UMKM_HIDDEN_WORKSPACE_KEYS = frozenset(
	{
		("Report", "IMOGI POS Order Summary"),
	}
)


def is_umkm():
	"""Deprecated — use uses_kitchen_or_fulfillment_flow() for post-payment flow."""
	return get_settings().business_type == BUSINESS_UMKM


def is_restaurant():
	return get_settings().business_type == BUSINESS_RESTAURANT


def uses_kitchen_or_fulfillment_flow(settings=None) -> bool:
	"""Kitchen / packing steps follow IMOGI POS Settings toggles, not business mode."""
	from imogi_pos.imogi_pos.utils.feature_gating import is_fulfillment_operational, is_setting_enabled

	settings = settings or get_settings()
	return is_setting_enabled("enable_kitchen_display", settings) or is_fulfillment_operational(settings)


def is_feature_suppressed_for_business(feature_id: str | None, settings=None) -> bool:
	"""Business mode no longer hides cashier features — tier + settings toggles apply."""
	return False


def is_workspace_hidden_for_umkm(
	link_type: str | None, link_to: str | None, settings=None
) -> bool:
	settings = settings or get_settings()
	if settings.business_type != BUSINESS_UMKM:
		return False
	key = ((link_type or "").strip(), (link_to or "").strip())
	return key in UMKM_HIDDEN_WORKSPACE_KEYS


def apply_business_profile(business_type):
	"""Legacy hook from setup wizard — no longer forces KDS/fulfillment on or off."""
	settings = frappe.get_single("IMOGI POS Settings")
	settings.business_type = business_type
	settings.save(ignore_permissions=True)

	from imogi_pos.imogi_pos.utils.workspace import sync_workspaces

	sync_workspaces()
	return settings


def get_flow_summary(business_type=None):
	settings = get_settings()
	from imogi_pos.imogi_pos.utils.feature_gating import is_fulfillment_operational

	kds_on = bool(settings.enable_kitchen_display)
	fulfillment_on = is_fulfillment_operational(settings)
	if not kds_on and not fulfillment_on:
		return {
			"label": _("Alur Langsung"),
			"steps": [
				_("Order & Payment"),
				_("Completed"),
			],
			"description": _(
				"Order selesai saat pembayaran. Aktifkan Kitchen Display atau Fulfillment di Settings jika perlu alur dapur/packing."
			),
		}
	steps = [_("Order & Payment")]
	if kds_on:
		steps.append(_("Kitchen Display"))
	if fulfillment_on:
		steps.append(_("Fulfillment"))
	steps.append(_("Completed"))
	return {
		"label": _("Alur Dapur & Packing"),
		"steps": steps,
		"description": _(
			"Alur mengikuti toggle Kitchen Display dan Fulfillment di IMOGI POS Settings."
		),
	}
