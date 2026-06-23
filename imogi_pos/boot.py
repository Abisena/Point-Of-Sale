# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import cint, flt

from imogi_pos.imogi_pos.utils.flow import get_settings, resolve_company
from imogi_pos.imogi_pos.utils.workspace import get_workspace_route
from imogi_pos.website import IMOGI_POS_DESK_LOGO, IMOGI_POS_LOGO, IMOGI_POS_LOGO_WHITE

CASHIER_ROLE = "IMOGI Cashier"
WAITER_ROLE = "IMOGI Waiter"
OWNER_ROLE = "IMOGI Owner"
AREA_MANAGER_ROLE = "IMOGI Area Manager"
MANAGER_ROLE = "IMOGI Manager"
AREA_MANAGER_HOME_PAGE = "imogi-pos-dashboard"
CASHIER_HOME_PAGE = "imogi-pos-cashier"
WAITER_HOME_PAGE = "table-service"
OWNER_HOME_PAGE = "imogi-pos-dashboard"
MANAGER_HOME_PAGE = "imogi-pos-menu"
CASHIER_HOME_ROUTE = f"/app/{CASHIER_HOME_PAGE}"
WAITER_HOME_ROUTE = f"/app/{WAITER_HOME_PAGE}"
OPEN_SHIFT_PAGE = "imogi-pos-open-shift"
OPEN_SHIFT_HOME_ROUTE = f"/app/{OPEN_SHIFT_PAGE}"
CLOSE_SHIFT_PAGE = "imogi-pos-close-shift"
CLOSE_SHIFT_HOME_ROUTE = f"/app/{CLOSE_SHIFT_PAGE}"
SHIFT_OPENING_DOCTYPE = "IMOGI POS Shift Opening"
SHIFT_OPENING_HOME_ROUTE = OPEN_SHIFT_HOME_ROUTE
OPENING_ENTRY_HOME_ROUTE = OPEN_SHIFT_HOME_ROUTE
MANAGER_ROLES = frozenset({"System Manager", "Administrator"})
WAITER_ESCALATION_ROLES = frozenset(
	{
		"Administrator",
		"System Manager",
		"Sales Manager",
		"IMOGI Owner",
		"IMOGI Manager",
		"IMOGI Area Manager",
		"IMOGI Supervisor",
		"IMOGI Cashier",
	}
)

OPENING_ROUTE_CACHE = "imogi_pos_opening_route_options"


def opening_route_cache_key(user=None, company=None):
	user = user or frappe.session.user
	if not company:
		company = get_settings().default_company or frappe.defaults.get_user_default("Company") or ""
	return f"{company}:{user}"


def get_opening_route_options(user=None, company=None):
	return frappe.cache.hget(OPENING_ROUTE_CACHE, opening_route_cache_key(user, company))


def set_opening_route_options(options, user=None, company=None, expires_in_sec=300):
	frappe.cache.hset(
		OPENING_ROUTE_CACHE,
		opening_route_cache_key(user, company),
		options,
		expires_in_sec=expires_in_sec,
	)


def clear_opening_route_options(user=None, company=None):
	frappe.cache.hdel(OPENING_ROUTE_CACHE, opening_route_cache_key(user, company))


def should_use_cashier_home(user=None):
	"""Desk users with IMOGI Cashier (without manager roles) land on Kasir."""
	return requires_cashier_shift(user)


def should_use_waiter_home(user=None):
	"""Dedicated waiter — Table Service only, no ERPNext workspace."""
	user = user or frappe.session.user
	if not user or user == "Guest":
		return False

	roles = set(frappe.get_roles(user))
	if WAITER_ROLE not in roles:
		return False
	if roles & WAITER_ESCALATION_ROLES:
		return False
	if should_use_cashier_home(user):
		return False
	return True


def requires_cashier_shift(user=None):
	"""Only dedicated cashiers must follow open/close shift workflow."""
	user = user or frappe.session.user
	if not user or user == "Guest":
		return False

	roles = set(frappe.get_roles(user))
	if CASHIER_ROLE not in roles:
		return False

	return not roles & MANAGER_ROLES


def _get_pos_opening(user=None):
	user = user or frappe.session.user
	entries = frappe.db.get_all(
		"POS Opening Entry",
		filters={"user": user, "pos_closing_entry": ["in", ["", None]], "docstatus": 1},
		fields=["name"],
		limit=1,
	)
	return entries[0] if entries else None


def get_cashier_landing(user=None):
	"""Return where IMOGI Cashier should land: 'cashier' or 'opening-entry'."""
	if not should_use_cashier_home(user):
		return None

	from imogi_pos.imogi_pos.utils.feature_gating import is_setting_enabled

	settings = get_settings()
	if not is_setting_enabled("enable_pos_shift", settings):
		return "cashier"

	if _get_pos_opening(user):
		return "cashier"

	return "opening-entry"


def get_shift_opening_home_route(user=None):
	return OPEN_SHIFT_HOME_ROUTE


def get_cashier_home_route(user=None):
	landing = get_cashier_landing(user)
	if landing == "cashier":
		return CASHIER_HOME_ROUTE
	if landing == "opening-entry":
		return get_shift_opening_home_route(user)
	return None


def get_waiter_home_route(user=None):
	if not should_use_waiter_home(user):
		return None
	return WAITER_HOME_ROUTE


def get_dedicated_home_route(user=None):
	"""Login/default path for dedicated cashier or waiter."""
	return get_cashier_home_route(user) or get_waiter_home_route(user)


def boot_session(bootinfo):
	bootinfo.app_logo_url = IMOGI_POS_DESK_LOGO
	bootinfo.imogi_pos_desk_logo_url = IMOGI_POS_DESK_LOGO
	bootinfo.imogi_pos_logo_url = IMOGI_POS_LOGO
	bootinfo.imogi_pos_logo_white_url = IMOGI_POS_LOGO_WHITE
	settings = get_settings()
	bootinfo.imogi_pos_setup_complete = bool(settings.setup_complete)
	from imogi_pos.imogi_pos.utils.feature_registry import get_subscription_tier

	from imogi_pos.imogi_pos.utils.deployment_mode import (
		is_erp_enterprise_deployment,
		is_subscription_tier_disabled,
	)

	bootinfo.imogi_pos_erp_enterprise_only = is_erp_enterprise_deployment()
	bootinfo.imogi_pos_subscription_tiers_disabled = is_subscription_tier_disabled()
	bootinfo.imogi_pos_subscription_tier = (
		None if is_subscription_tier_disabled() else get_subscription_tier(settings)
	)
	from imogi_pos.imogi_pos.utils.workspace_tier_gating import serialize_workspace_link_access

	bootinfo.imogi_pos_workspace_tier_access = serialize_workspace_link_access(
		bootinfo.imogi_pos_subscription_tier, user=frappe.session.user
	)
	from imogi_pos.imogi_pos.utils.role_gating import serialize_user_role_context

	bootinfo.imogi_pos_role_gating_enabled = bool(getattr(settings, "enable_role_gating", 0))
	bootinfo.imogi_pos_approval_workflow_enabled = bool(getattr(settings, "enable_approval_workflow", 0))
	bootinfo.imogi_pos_role_context = serialize_user_role_context(frappe.session.user, settings)
	from imogi_pos.imogi_pos.utils.feature_registry import (
		DISABLED_OPERATIONAL_FEATURE_IDS,
		HIDDEN_UI_FEATURE_IDS,
	)

	bootinfo.imogi_pos_hidden_features = sorted(HIDDEN_UI_FEATURE_IDS | DISABLED_OPERATIONAL_FEATURE_IDS)
	bootinfo.imogi_pos_disabled_features = sorted(DISABLED_OPERATIONAL_FEATURE_IDS)
	from imogi_pos.imogi_pos.utils.area_manager import get_assigned_branch_context

	bootinfo.imogi_pos_area_manager_context = get_assigned_branch_context(frappe.session.user)
	from imogi_pos.imogi_pos.utils.dashboard_focus import get_dashboard_focus_by_label

	bootinfo.imogi_pos_dashboard_focus_by_label = get_dashboard_focus_by_label()
	bootinfo.imogi_pos_business_type = settings.business_type or ""
	bootinfo.imogi_pos_enable_kds = bool(settings.enable_kitchen_display)
	bootinfo.imogi_pos_enable_fulfillment = bool(settings.enable_fulfillment)
	bootinfo.imogi_pos_workspace_route = get_workspace_route(settings.business_type)
	bootinfo.imogi_pos_requires_shift_workflow = requires_cashier_shift()
	bootinfo.imogi_pos_dedicated_cashier = should_use_cashier_home()
	bootinfo.imogi_pos_dedicated_waiter = should_use_waiter_home()

	if not settings.setup_complete and not should_use_cashier_home() and not should_use_waiter_home():
		bootinfo.home_page = "imogi-pos-setup"
		return

	roles = set(frappe.get_roles(frappe.session.user))
	if OWNER_ROLE in roles and not roles & MANAGER_ROLES:
		bootinfo.home_page = OWNER_HOME_PAGE
		return
	if (
		AREA_MANAGER_ROLE in roles
		and OWNER_ROLE not in roles
		and not roles & MANAGER_ROLES
		and CASHIER_ROLE not in roles
	):
		bootinfo.home_page = AREA_MANAGER_HOME_PAGE
		return
	if MANAGER_ROLE in roles and not roles & MANAGER_ROLES and CASHIER_ROLE not in roles:
		bootinfo.home_page = MANAGER_HOME_PAGE
		return

	if should_use_waiter_home():
		bootinfo.imogi_pos_waiter_home = True
		bootinfo.home_page = WAITER_HOME_PAGE
		return

	if not should_use_cashier_home():
		return

	# Dedicated cashier must always land on Kasir/Buka Shift — never workspace or settings slug.
	bootinfo.imogi_pos_cashier_home = True
	from imogi_pos.imogi_pos.utils.feature_gating import is_setting_enabled

	bootinfo.imogi_pos_enable_shift = is_setting_enabled("enable_pos_shift", settings)
	bootinfo.imogi_pos_default_company = resolve_company(None, settings) if settings.setup_complete else (settings.default_company or "")
	bootinfo.imogi_pos_thermal_mode = settings.thermal_print_mode or "Browser"
	bootinfo.imogi_pos_receipt_header = settings.receipt_header or ""
	bootinfo.imogi_pos_receipt_footer = settings.receipt_footer or __("Terima kasih")
	from imogi_pos.imogi_pos.utils.sales_tax import get_sales_tax_config

	tax_cfg = get_sales_tax_config(settings)
	bootinfo.imogi_pos_sales_tax_rate = flt(tax_cfg.get("rate")) or 11
	bootinfo.imogi_pos_payment_gateway_enabled = is_setting_enabled("enable_payment_gateway", settings)
	bootinfo.imogi_pos_loyalty_enabled = is_setting_enabled("enable_loyalty", settings)
	bootinfo.imogi_pos_default_pos_profile = settings.default_pos_profile or ""
	bootinfo.imogi_pos_has_open_shift = bool(_get_pos_opening()) if bootinfo.imogi_pos_enable_shift else False
	bootinfo.imogi_pos_landing_target = get_cashier_landing()

	if bootinfo.imogi_pos_landing_target == "cashier":
		bootinfo.home_page = CASHIER_HOME_PAGE
	elif bootinfo.imogi_pos_landing_target == "opening-entry":
		bootinfo.home_page = OPEN_SHIFT_PAGE

	cached_opts = get_opening_route_options(
		frappe.session.user,
		settings.default_company or frappe.defaults.get_user_default("Company"),
	)
	if cached_opts:
		bootinfo.imogi_pos_opening_route_options = cached_opts
