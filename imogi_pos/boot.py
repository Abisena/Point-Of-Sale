# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe.utils import cint

from imogi_pos.imogi_pos.utils.flow import get_settings, resolve_company
from imogi_pos.imogi_pos.utils.shift_opening import get_pending_shift_opening
from imogi_pos.imogi_pos.utils.workspace import get_workspace_route
from imogi_pos.website import IMOGI_POS_DESK_LOGO, IMOGI_POS_LOGO

CASHIER_ROLE = "IMOGI Cashier"
CASHIER_HOME_PAGE = "imogi-pos-cashier"
CASHIER_HOME_ROUTE = f"/app/{CASHIER_HOME_PAGE}"
OPEN_SHIFT_PAGE = "imogi-pos-open-shift"
OPEN_SHIFT_HOME_ROUTE = f"/app/{OPEN_SHIFT_PAGE}"
CLOSE_SHIFT_PAGE = "imogi-pos-close-shift"
CLOSE_SHIFT_HOME_ROUTE = f"/app/{CLOSE_SHIFT_PAGE}"
SHIFT_OPENING_DOCTYPE = "IMOGI POS Shift Opening"
SHIFT_OPENING_HOME_ROUTE = OPEN_SHIFT_HOME_ROUTE
OPENING_ENTRY_HOME_ROUTE = OPEN_SHIFT_HOME_ROUTE
MANAGER_ROLES = frozenset({"System Manager", "Administrator"})

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

	settings = get_settings()
	if not cint(settings.enable_pos_shift):
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


def boot_session(bootinfo):
	bootinfo.app_logo_url = IMOGI_POS_DESK_LOGO
	bootinfo.imogi_pos_desk_logo_url = IMOGI_POS_DESK_LOGO
	bootinfo.imogi_pos_logo_url = IMOGI_POS_LOGO
	settings = get_settings()
	bootinfo.imogi_pos_setup_complete = bool(settings.setup_complete)
	bootinfo.imogi_pos_business_type = settings.business_type or ""
	bootinfo.imogi_pos_workspace_route = get_workspace_route(settings.business_type)
	bootinfo.imogi_pos_requires_shift_workflow = requires_cashier_shift()

	if not settings.setup_complete and not should_use_cashier_home():
		bootinfo.home_page = "imogi-pos-setup"

	if not should_use_cashier_home():
		return

	bootinfo.imogi_pos_cashier_home = True
	bootinfo.imogi_pos_enable_shift = cint(settings.enable_pos_shift)
	bootinfo.imogi_pos_default_company = resolve_company(None, settings) if settings.setup_complete else (settings.default_company or "")
	bootinfo.imogi_pos_thermal_mode = settings.thermal_print_mode or "Browser"
	bootinfo.imogi_pos_payment_gateway_enabled = cint(settings.enable_payment_gateway)
	bootinfo.imogi_pos_loyalty_enabled = cint(settings.enable_loyalty)
	bootinfo.imogi_pos_default_pos_profile = settings.default_pos_profile or ""
	bootinfo.imogi_pos_has_open_shift = bool(_get_pos_opening()) if bootinfo.imogi_pos_enable_shift else False
	bootinfo.imogi_pos_landing_target = get_cashier_landing()
	bootinfo.imogi_pos_shift_opening_draft = (
		get_pending_shift_opening() if bootinfo.imogi_pos_landing_target == "opening-entry" else None
	)

	if bootinfo.imogi_pos_landing_target == "cashier":
		bootinfo.home_page = CASHIER_HOME_PAGE

	cached_opts = get_opening_route_options(
		frappe.session.user,
		settings.default_company or frappe.defaults.get_user_default("Company"),
	)
	if cached_opts:
		bootinfo.imogi_pos_opening_route_options = cached_opts
