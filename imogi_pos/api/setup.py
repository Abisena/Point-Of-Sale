# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import cint

from imogi_pos.imogi_pos.utils.business_profile import (
	BUSINESS_RESTAURANT,
	BUSINESS_UMKM,
	apply_business_profile,
	get_flow_summary,
)
from imogi_pos.imogi_pos.utils.pos_profile import (
	create_umkm_pos_profile,
	get_default_warehouse,
	list_pos_profiles_for_company,
	validate_pos_profile,
)
from imogi_pos.imogi_pos.utils.workspace import get_workspace_route, sync_workspaces


def _migrate_legacy_settings(settings):
	"""Sites that already had POS configured before the 9-step wizard."""
	if settings.setup_complete:
		return settings
	if not settings.default_pos_profile:
		return settings

	if not settings.business_type:
		settings.business_type = BUSINESS_RESTAURANT
	settings.setup_complete = 1
	settings.save(ignore_permissions=True)
	frappe.db.commit()
	return frappe.get_single("IMOGI POS Settings")


@frappe.whitelist()
def get_setup_status():
	settings = frappe.get_single("IMOGI POS Settings")
	settings = _migrate_legacy_settings(settings)
	return {
		"setup_complete": bool(settings.setup_complete),
		"business_type": settings.business_type,
		"flow": get_flow_summary(settings.business_type) if settings.business_type else None,
	}


@frappe.whitelist()
def get_business_type_options():
	return [
		{
			"value": BUSINESS_RESTAURANT,
			"title": _("Restaurant / Cafe"),
			"subtitle": _("Kitchen, fulfillment, and service team flow"),
			"flow": get_flow_summary(BUSINESS_RESTAURANT),
		},
		{
			"value": BUSINESS_UMKM,
			"title": _("UMKM"),
			"subtitle": _("Simple POS — one person handles everything"),
			"flow": get_flow_summary(BUSINESS_UMKM),
		},
	]


@frappe.whitelist()
def get_setup_defaults(company, business_type=None):
	"""Return POS profiles and suggested warehouse for setup step 2."""
	if not company:
		return {"profiles": [], "default_warehouse": None}

	profiles = list_pos_profiles_for_company(company)
	default_warehouse = None
	try:
		default_warehouse = get_default_warehouse(company)
	except frappe.ValidationError:
		default_warehouse = None

	suggested_pos_profile = None
	valid_profiles = [p["name"] for p in profiles if p["valid"]]
	if valid_profiles:
		suggested_pos_profile = valid_profiles[0]

	return {
		"profiles": profiles,
		"default_warehouse": default_warehouse,
		"suggested_pos_profile": suggested_pos_profile,
	}


@frappe.whitelist()
def validate_setup_config(company, pos_profile, warehouse=None):
	check = validate_pos_profile(company, pos_profile, warehouse)
	return check


@frappe.whitelist()
def create_default_pos_profile(company, warehouse=None):
	frappe.only_for(("System Manager", "Sales Manager"))
	name = create_umkm_pos_profile(company, warehouse)
	check = validate_pos_profile(company, name, warehouse)
	return {"pos_profile": name, "validation": check}


@frappe.whitelist()
def change_operational_mode(business_type):
	"""Switch UMKM ↔ Restaurant / Cafe after initial setup (Settings or Setup page)."""
	frappe.only_for(("System Manager", "Sales Manager"))

	if business_type not in (BUSINESS_RESTAURANT, BUSINESS_UMKM):
		frappe.throw(_("Invalid business type"))

	settings = frappe.get_single("IMOGI POS Settings")
	if settings.business_type == business_type:
		return {
			"changed": False,
			"business_type": settings.business_type,
			"flow": get_flow_summary(settings.business_type),
			"redirect": f"/app/{get_workspace_route(settings.business_type)}",
		}

	apply_business_profile(business_type)
	settings = frappe.get_single("IMOGI POS Settings")
	frappe.db.commit()

	return {
		"changed": True,
		"business_type": settings.business_type,
		"flow": get_flow_summary(settings.business_type),
		"redirect": f"/app/{get_workspace_route(settings.business_type)}",
	}


@frappe.whitelist()
def complete_setup(
	business_type,
	default_company=None,
	default_pos_profile=None,
	default_warehouse=None,
	kitchen_item_groups=None,
	auto_create_pos_profile=0,
):
	frappe.only_for(("System Manager", "Sales Manager"))

	if business_type not in (BUSINESS_RESTAURANT, BUSINESS_UMKM):
		frappe.throw(_("Invalid business type"))

	settings = frappe.get_single("IMOGI POS Settings")
	settings.default_company = default_company or settings.default_company
	settings.default_warehouse = default_warehouse or settings.default_warehouse
	settings.default_pos_profile = default_pos_profile or settings.default_pos_profile

	if not settings.default_company:
		frappe.throw(_("Company is required"))

	if not settings.default_pos_profile and cint(auto_create_pos_profile):
		settings.default_pos_profile = create_umkm_pos_profile(
			settings.default_company, settings.default_warehouse
		)

	if not settings.default_pos_profile:
		frappe.throw(_("POS Profile is required"))

	check = validate_pos_profile(
		settings.default_company,
		settings.default_pos_profile,
		settings.default_warehouse,
	)
	if not check["valid"]:
		frappe.throw("<br>".join(check["errors"]), title=_("POS Profile invalid"))

	if check["details"].get("warehouse") and not settings.default_warehouse:
		settings.default_warehouse = check["details"]["warehouse"]

	apply_business_profile(business_type)

	settings = frappe.get_single("IMOGI POS Settings")
	if business_type == BUSINESS_RESTAURANT and kitchen_item_groups:
		from imogi_pos.imogi_pos.utils.settings_flow import append_kitchen_item_groups_from_text

		append_kitchen_item_groups_from_text(settings, kitchen_item_groups)

	settings.setup_complete = 1
	settings.save(ignore_permissions=True)
	sync_workspaces(settings.business_type)
	frappe.db.commit()

	route = get_workspace_route(settings.business_type)
	return {
		"setup_complete": True,
		"business_type": settings.business_type,
		"flow": get_flow_summary(settings.business_type),
		"redirect": f"/app/{route}",
		"pos_profile_validation": check,
	}
