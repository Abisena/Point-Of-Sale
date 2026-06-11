# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _

from imogi_pos.imogi_pos.utils.flow import get_settings, resolve_company

_API_RATE_LIMIT = 120


def _check_api_rate_limit(api_key):
	cache_key = f"imogi_api_rate:{api_key}"
	count = frappe.cache.get_value(cache_key) or 0
	if int(count) >= _API_RATE_LIMIT:
		frappe.throw(_("Rate limit exceeded. Try again in a minute."), frappe.ValidationError)
	frappe.cache.set_value(cache_key, int(count) + 1, expires_in_sec=60)


def _extract_api_credentials():
	"""Read IMOGI API credentials without using Authorization header (conflicts with Frappe User API keys)."""
	api_key = frappe.get_request_header("X-Imogi-Api-Key")
	api_secret = frappe.get_request_header("X-Imogi-Api-Secret")

	if not api_key:
		api_key = frappe.form_dict.get("api_key")
	if not api_secret:
		api_secret = frappe.form_dict.get("api_secret")

	return api_key, api_secret


def validate_order_api_access():
	"""Allow logged-in POS users or external callers with IMOGI API token."""
	if frappe.session.user and frappe.session.user != "Guest":
		if frappe.has_permission("Riwayat Order", "write"):
			return
		frappe.throw(_("Not permitted to access Order API"), frappe.PermissionError)

	from imogi_pos.imogi_pos.utils.feature_gating import is_setting_enabled

	settings = get_settings()
	if not is_setting_enabled("enable_order_api", settings):
		frappe.throw(_("Order API is disabled in IMOGI POS Settings"), frappe.AuthenticationError)

	api_key, api_secret = _extract_api_credentials()
	if not api_key or not api_secret:
		frappe.throw(
			_(
				"Send credentials via headers "
				"<code>X-Imogi-Api-Key</code> and <code>X-Imogi-Api-Secret</code>, "
				"or POST fields <code>api_key</code> and <code>api_secret</code>."
			),
			frappe.AuthenticationError,
		)

	if api_key != settings.order_api_key:
		frappe.throw(_("Invalid API key"), frappe.AuthenticationError)

	_check_api_rate_limit(api_key)

	stored_secret = settings.get_password("order_api_secret", raise_exception=False)
	if not stored_secret or api_secret != stored_secret:
		frappe.throw(_("Invalid API secret"), frappe.AuthenticationError)

	api_user = settings.order_api_user or "Administrator"
	frappe.set_user(api_user)


def ensure_setup_ready(company=None):
	settings = get_settings()
	if not settings.setup_complete:
		frappe.throw(_("Complete IMOGI POS Setup before using the Order API"))

	company = resolve_company(company, settings)
	if not settings.default_pos_profile:
		frappe.throw(_("Set POS Profile in IMOGI POS Settings"))

	from imogi_pos.imogi_pos.utils.pos_profile import validate_pos_profile

	check = validate_pos_profile(
		company,
		settings.default_pos_profile,
		settings.default_warehouse,
	)
	if not check["valid"]:
		frappe.throw("<br>".join(check["errors"]))
	return company
