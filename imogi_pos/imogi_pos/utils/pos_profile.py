# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import cstr


def get_default_warehouse(company, preferred=None):
	if preferred and frappe.db.exists("Warehouse", preferred):
		if frappe.db.get_value("Warehouse", preferred, "company") == company:
			return preferred

	warehouse = frappe.db.get_value(
		"Warehouse",
		{"company": company, "is_group": 0, "disabled": 0},
		"name",
		order_by="creation asc",
	)
	if warehouse:
		return warehouse

	frappe.throw(
		_("No warehouse found for company {0}. Create a warehouse first.").format(company)
	)


def validate_pos_profile(company, pos_profile, warehouse=None):
	"""Return validation result with human-readable messages for setup and API."""
	errors = []
	warnings = []
	details = {}

	if not company:
		errors.append(_("Company is required"))
		return _result(False, errors, warnings, details)

	if not pos_profile:
		errors.append(_("POS Profile is required"))
		return _result(False, errors, warnings, details)

	if not frappe.db.exists("POS Profile", pos_profile):
		errors.append(_("POS Profile {0} does not exist").format(pos_profile))
		return _result(False, errors, warnings, details)

	profile = frappe.get_doc("POS Profile", pos_profile)
	details["pos_profile"] = profile.name
	details["payment_modes"] = [row.mode_of_payment for row in profile.payments]

	if profile.disabled:
		errors.append(_("POS Profile {0} is disabled").format(pos_profile))

	if profile.company != company:
		errors.append(
			_("POS Profile company ({0}) must match selected company ({1})").format(
				profile.company, company
			)
		)

	if not profile.payments:
		errors.append(_("POS Profile must have at least one payment method (Cash, QRIS, etc.)"))
	else:
		default_modes = [row.mode_of_payment for row in profile.payments if row.default]
		if not default_modes:
			warnings.append(_("No default payment method set on POS Profile"))

	resolved_warehouse = warehouse or profile.warehouse
	if not resolved_warehouse:
		try:
			resolved_warehouse = get_default_warehouse(company)
		except frappe.ValidationError as exc:
			errors.append(str(exc))
	elif frappe.db.get_value("Warehouse", resolved_warehouse, "company") != company:
		errors.append(_("Warehouse must belong to the selected company"))

	details["warehouse"] = resolved_warehouse
	details["currency"] = profile.currency
	details["selling_price_list"] = profile.selling_price_list

	return _result(not errors, errors, warnings, details)


def _result(valid, errors, warnings, details):
	return {
		"valid": valid,
		"errors": errors,
		"warnings": warnings,
		"details": details,
	}


def list_pos_profiles_for_company(company):
	profiles = frappe.get_all(
		"POS Profile",
		filters={"company": company, "disabled": 0},
		fields=["name", "warehouse", "currency"],
		order_by="modified desc",
	)
	results = []
	for row in profiles:
		check = validate_pos_profile(company, row.name, row.warehouse)
		results.append(
			{
				"name": row.name,
				"warehouse": row.warehouse,
				"valid": check["valid"],
				"errors": check["errors"],
				"warnings": check["warnings"],
			}
		)
	return results


def create_umkm_pos_profile(company, warehouse=None):
	"""Create a minimal POS Profile for UMKM when none exists."""
	existing = list_pos_profiles_for_company(company)
	valid_profiles = [p for p in existing if p["valid"]]
	if valid_profiles:
		return valid_profiles[0]["name"]

	company_doc = frappe.get_doc("Company", company)
	warehouse = warehouse or get_default_warehouse(company)

	income_account = company_doc.default_income_account
	if not income_account:
		income_account = frappe.db.get_value(
			"Account",
			{"company": company, "root_type": "Income", "is_group": 0},
			"name",
		)

	write_off_account = company_doc.write_off_account
	if not write_off_account:
		write_off_account = frappe.db.get_value(
			"Account",
			{"company": company, "account_type": "Write Off", "is_group": 0},
			"name",
		)

	cost_center = company_doc.cost_center or frappe.db.get_value(
		"Cost Center", {"company": company, "is_group": 0}, "name"
	)

	price_list = frappe.db.get_value(
		"Price List",
		{"selling": 1, "currency": company_doc.default_currency, "enabled": 1},
		"name",
	)

	if not all([income_account, write_off_account, cost_center, price_list]):
		frappe.throw(
			_(
				"Cannot auto-create POS Profile. Complete Company accounting setup "
				"(Income Account, Write Off, Cost Center, Price List) first."
			)
		)

	profile_name = f"{cstr(company).split()[0]}-UMKM-POS"
	base_name = profile_name
	counter = 1
	while frappe.db.exists("POS Profile", profile_name):
		profile_name = f"{base_name}-{counter}"
		counter += 1

	profile = frappe.new_doc("POS Profile")
	profile.name = profile_name
	profile.company = company
	profile.warehouse = warehouse
	profile.currency = company_doc.default_currency
	profile.selling_price_list = price_list
	profile.income_account = income_account
	profile.expense_account = company_doc.default_expense_account
	profile.write_off_account = write_off_account
	profile.write_off_cost_center = cost_center or write_off_account
	profile.cost_center = cost_center
	profile.write_off_limit = 1

	cash_mop = frappe.db.get_value("Mode of Payment", {"enabled": 1, "name": "Cash"}, "name")
	if not cash_mop:
		cash_mop = frappe.db.get_value("Mode of Payment", {"enabled": 1}, "name")
	if not cash_mop:
		frappe.throw(_("Create at least one Mode of Payment (e.g. Cash) before setup."))

	profile.append("payments", {"mode_of_payment": cash_mop, "default": 1})

	for mop_name in ("QRIS", "E-Wallet", "GoPay", "OVO"):
		if frappe.db.exists("Mode of Payment", mop_name):
			profile.append("payments", {"mode_of_payment": mop_name, "default": 0})

	profile.insert(ignore_permissions=True)
	return profile.name
