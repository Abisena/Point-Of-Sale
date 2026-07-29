# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe.utils import cint, flt

from imogi_pos.api.cashier import _require_cashier_access
from imogi_pos.api.order import _parse_json
from imogi_pos.api.auth import ensure_setup_ready
from imogi_pos.imogi_pos.utils.flow import resolve_company
from imogi_pos.imogi_pos.utils.loyalty import (
	compute_checkout_totals,
	get_customer_loyalty,
	get_loyalty_config,
	is_loyalty_enabled,
	validate_voucher,
)


@frappe.whitelist()
def get_loyalty_status(customer=None, company=None):
	"""Cashier: loyalty balance for selected customer."""
	_require_cashier_access()
	ensure_setup_ready(company)
	return get_customer_loyalty(customer, company=resolve_company(company))


@frappe.whitelist()
def preview_promotions(
	items,
	customer=None,
	customer_phone=None,
	discount_type=None,
	discount_value=None,
	voucher_code=None,
	loyalty_points_redeem=0,
	company=None,
	branch=None,
):
	"""Preview totals with voucher + loyalty before checkout."""
	_require_cashier_access()
	ensure_setup_ready(company)
	parsed_items = _parse_json(items, "items") or []
	return compute_checkout_totals(
		parsed_items,
		discount_type=discount_type,
		discount_value=discount_value,
		voucher_code=voucher_code,
		loyalty_points_redeem=cint(loyalty_points_redeem),
		customer=customer,
		customer_phone=customer_phone,
		company=company,
		branch=branch,
	)


@frappe.whitelist()
def check_voucher(voucher_code, subtotal=0, company=None, customer=None, customer_phone=None):
	"""Validate voucher code for cashier."""
	_require_cashier_access()
	ensure_setup_ready(company)
	return validate_voucher(
		voucher_code,
		company=company,
		subtotal=subtotal,
		customer=customer,
		customer_phone=customer_phone,
	)


@frappe.whitelist()
def get_loyalty_settings():
	_require_cashier_access()
	config = get_loyalty_config()
	from imogi_pos.imogi_pos.utils.feature_gating import is_setting_enabled
	from imogi_pos.imogi_pos.utils.flow import get_settings

	settings = get_settings()
	return {
		"enabled": is_loyalty_enabled(),
		**config,
		"birthday_promo_enabled": is_setting_enabled("enable_birthday_promo", settings),
		"birthday_discount_percent": flt(getattr(settings, "birthday_discount_percent", 10)) or 10,
		"birthday_window_days": cint(getattr(settings, "birthday_window_days", 0)),
	}


@frappe.whitelist()
def set_customer_birthday(customer, date_of_birth, company=None):
	_require_cashier_access()
	ensure_setup_ready(company)
	from imogi_pos.imogi_pos.utils.loyalty import set_member_birthday

	return set_member_birthday(customer, date_of_birth, company=resolve_company(company))
