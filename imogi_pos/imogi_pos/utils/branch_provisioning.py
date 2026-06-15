# Copyright (c) 2026, Imogi and contributors
"""Provision additional Company + Warehouse + POS Profile + IMOGI Branch in one flow."""

import re

import frappe
from frappe import _
from frappe.utils import cint, flt

from imogi_pos.imogi_pos.utils.branch import grant_branch_access, serialize_branch, slug_branch_code
from imogi_pos.imogi_pos.utils.flow import get_settings
from imogi_pos.imogi_pos.utils.pos_profile import create_umkm_pos_profile, get_default_warehouse
from imogi_pos.imogi_pos.utils.setup_wizard.business_templates import get_business_template
from imogi_pos.imogi_pos.utils.setup_wizard.provisioning import (
	_company_abbr,
	apply_business_master_data,
	ensure_warehouse,
)


PROVISION_CHECKLIST = [
	_("Buat Company di ERPNext (Chart of Accounts, mata uang, pajak)"),
	_("Buat Warehouse untuk company tersebut"),
	_("Buat POS Profile (metode bayar, akun penjualan, price list)"),
	_("Daftarkan cabang sebagai IMOGI Branch"),
	_("Berikan User Permission Company + POS Profile ke kasir"),
]

PROVISION_ALLOWED_ROLES = (
	"System Manager",
	"Sales Manager",
	"Administrator",
	"IMOGI Owner",
	"IMOGI Area Manager",
)


def require_branch_provision_access():
	frappe.only_for(PROVISION_ALLOWED_ROLES)


def get_provisioning_context():
	"""Context for the add-company/branch helper page."""
	settings = get_settings()
	companies = frappe.get_all(
		"Company",
		fields=["name", "company_name", "default_currency", "country"],
		order_by="name asc",
	)
	branches = frappe.get_all(
		"IMOGI Branch",
		filters={"is_active": 1},
		fields=["branch_code", "branch_name", "company", "pos_profile"],
		order_by="branch_name asc",
	)
	return {
		"checklist": PROVISION_CHECKLIST,
		"default_company": settings.default_company,
		"business_type": settings.business_template or settings.business_type,
		"companies": companies,
		"branches": branches,
		"multi_branch_enabled": cint(settings.multi_branch),
	}


def _unique_company_abbr(company_name):
	abbr = _company_abbr(company_name)
	counter = 1
	while frappe.db.exists("Company", abbr):
		abbr = f"{_company_abbr(company_name)[:3]}{counter}"
		counter += 1
	return abbr


def create_additional_company(company_name, currency="IDR", country="Indonesia", coa_chart=None):
	"""Create a new Company without changing Global Defaults."""
	company_name = (company_name or "").strip()
	if not company_name:
		frappe.throw(_("Nama company wajib diisi"))

	if frappe.db.exists("Company", {"company_name": company_name}):
		name = frappe.db.get_value("Company", {"company_name": company_name}, "name")
		ensure_company_pos_accounts(name)
		return name

	settings = get_settings()
	business_type = settings.business_template or settings.business_type or "UMKM"
	template = get_business_template(business_type) if business_type else {}

	company = frappe.get_doc(
		{
			"doctype": "Company",
			"company_name": company_name,
			"abbr": _unique_company_abbr(company_name),
			"default_currency": currency or "IDR",
			"country": country or "Indonesia",
			"create_chart_of_accounts_based_on": "Standard Template",
			"chart_of_accounts": coa_chart or template.get("coa_chart") or "Indonesia - Chart of Accounts",
			"enable_perpetual_inventory": 1,
		}
	)
	company.flags.ignore_mandatory = True
	company.insert(ignore_permissions=True)
	apply_business_master_data(company.name, business_type)
	ensure_company_pos_accounts(company.name)
	return company.name


def ensure_company_pos_accounts(company):
	"""Fill Company defaults required before auto-creating POS Profile."""
	company_doc = frappe.get_doc("Company", company)
	company_doc.update_default_account = 1
	company_doc.set_default_accounts()

	if not company_doc.default_income_account:
		income = frappe.db.get_value(
			"Account",
			{"company": company, "root_type": "Income", "is_group": 0},
			"name",
			order_by="name asc",
		)
		if income:
			frappe.db.set_value("Company", company, "default_income_account", income)

	if not company_doc.cost_center:
		cc = frappe.db.get_value("Cost Center", {"company": company, "is_group": 0}, "name", order_by="name asc")
		if cc:
			frappe.db.set_value("Company", company, "cost_center", cc)

	if not company_doc.write_off_account:
		write_off = _find_or_create_write_off_account(company)
		if write_off:
			frappe.db.set_value("Company", company, "write_off_account", write_off)

	company_doc.reload()
	return company_doc


def _find_or_create_write_off_account(company):
	write_off = frappe.db.get_value(
		"Account",
		{"company": company, "account_type": "Write Off", "is_group": 0},
		"name",
	)
	if write_off:
		return write_off

	for pattern in ("%Write Off%", "%Rugi Selisih%", "%Round Off%"):
		write_off = frappe.db.get_value(
			"Account",
			{"company": company, "account_name": ["like", pattern], "is_group": 0},
			"name",
		)
		if write_off:
			return write_off

	parent = frappe.db.get_value(
		"Account",
		{"company": company, "account_name": ["like", "%Indirect Expenses%"], "is_group": 1},
		"name",
	) or frappe.db.get_value(
		"Account",
		{"company": company, "root_type": "Expense", "is_group": 1},
		"name",
		order_by="lft asc",
	)
	if not parent:
		return frappe.db.get_value(
			"Account",
			{"company": company, "root_type": "Expense", "is_group": 0},
			"name",
			order_by="name asc",
		)

	account = frappe.get_doc(
		{
			"doctype": "Account",
			"account_name": "Write Off",
			"company": company,
			"parent_account": parent,
			"account_type": "Indirect Expense",
			"is_group": 0,
		}
	)
	account.flags.ignore_mandatory = True
	account.insert(ignore_permissions=True)
	return account.name


def _unique_branch_code(branch_name, company):
	code = slug_branch_code(branch_name)
	if frappe.db.exists("IMOGI Branch", code):
		abbr = frappe.get_cached_value("Company", company, "abbr") or company[:5]
		code = slug_branch_code(f"{branch_name}-{abbr}")
	counter = 1
	base = code
	while frappe.db.exists("IMOGI Branch", code):
		code = slug_branch_code(f"{base}-{counter}")
		counter += 1
	return code


class _BranchSession:
	"""Minimal session object for reusing ensure_warehouse from setup wizard."""

	def __init__(self, branch_name):
		self.branch_name = branch_name


def provision_branch_stack(
	branch_name,
	company=None,
	new_company_name=None,
	city=None,
	warehouse_label=None,
	target_monthly_sales=0,
	is_default=0,
	assign_users=None,
	currency="IDR",
	country="Indonesia",
):
	"""
	Provision warehouse, POS Profile, and IMOGI Branch for an existing or new company.

	Returns a summary dict with created/linked records.
	"""
	require_branch_provision_access()

	branch_name = (branch_name or "").strip()
	if not branch_name:
		frappe.throw(_("Nama cabang wajib diisi"))

	created = {"company_created": False, "warehouse_created": False, "pos_profile_created": False}

	if (new_company_name or "").strip():
		company = create_additional_company(new_company_name, currency=currency, country=country)
		created["company_created"] = True
	elif company:
		company = company.strip()
		if not frappe.db.exists("Company", company):
			frappe.throw(_("Company {0} tidak ditemukan").format(company))
	else:
		frappe.throw(_("Pilih company yang ada atau isi nama company baru"))

	wh_label = (warehouse_label or branch_name).strip()
	session = _BranchSession(wh_label)
	warehouse_before = frappe.db.get_value("Warehouse", {"company": company, "warehouse_name": wh_label}, "name")
	warehouse = ensure_warehouse(company, session)
	created["warehouse_created"] = not bool(warehouse_before)

	ensure_company_pos_accounts(company)
	pos_before = frappe.db.get_value("POS Profile", {"company": company, "warehouse": warehouse}, "name")
	pos_profile = create_umkm_pos_profile(company, warehouse)
	created["pos_profile_created"] = not bool(pos_before)

	branch_code = _unique_branch_code(branch_name, company)
	branch_doc = frappe.get_doc(
		{
			"doctype": "IMOGI Branch",
			"branch_code": branch_code,
			"branch_name": branch_name,
			"company": company,
			"warehouse": warehouse,
			"pos_profile": pos_profile,
			"city": city or "",
			"target_monthly_sales": flt(target_monthly_sales),
			"is_active": 1,
			"is_default": cint(is_default),
		}
	)
	branch_doc.insert(ignore_permissions=True)

	settings = get_settings()
	if not cint(settings.multi_branch):
		settings.multi_branch = 1
		settings.flags.ignore_mandatory = True
		settings.save(ignore_permissions=True)

	assigned = []
	for user in _normalize_users(assign_users):
		grant_branch_access(user, branch=serialize_branch(branch_doc))
		assigned.append(user)

	frappe.db.commit()

	return {
		"company": company,
		"warehouse": warehouse,
		"pos_profile": pos_profile,
		"branch_code": branch_code,
		"branch_name": branch_name,
		"branch": branch_doc.name,
		"assigned_users": assigned,
		"created": created,
		"links": {
			"company": f"/app/company/{company}",
			"warehouse": f"/app/warehouse/{warehouse}",
			"pos_profile": f"/app/pos-profile/{pos_profile}",
			"branch": f"/app/imogi-branch/{branch_code}",
		},
	}


def provision_branch_for_existing_company(
	branch_name,
	company,
	pos_profile=None,
	warehouse=None,
	city=None,
	target_monthly_sales=0,
	is_default=0,
	assign_users=None,
):
	"""Register IMOGI Branch when Company + POS Profile already exist."""
	require_branch_provision_access()

	branch_name = (branch_name or "").strip()
	if not branch_name:
		frappe.throw(_("Nama cabang wajib diisi"))
	if not company or not frappe.db.exists("Company", company):
		frappe.throw(_("Company wajib dipilih"))

	if pos_profile:
		if frappe.db.get_value("POS Profile", pos_profile, "company") != company:
			frappe.throw(_("POS Profile harus milik company {0}").format(company))
	else:
		pos_profile = create_umkm_pos_profile(company, warehouse)

	if not warehouse:
		warehouse = frappe.db.get_value("POS Profile", pos_profile, "warehouse") or get_default_warehouse(company)

	branch_code = _unique_branch_code(branch_name, company)
	branch_doc = frappe.get_doc(
		{
			"doctype": "IMOGI Branch",
			"branch_code": branch_code,
			"branch_name": branch_name,
			"company": company,
			"warehouse": warehouse,
			"pos_profile": pos_profile,
			"city": city or "",
			"target_monthly_sales": flt(target_monthly_sales),
			"is_active": 1,
			"is_default": cint(is_default),
		}
	)
	branch_doc.insert(ignore_permissions=True)

	assigned = []
	for user in _normalize_users(assign_users):
		grant_branch_access(user, branch=serialize_branch(branch_doc))
		assigned.append(user)

	frappe.db.commit()
	return {
		"branch_code": branch_code,
		"branch": branch_doc.name,
		"company": company,
		"pos_profile": pos_profile,
		"warehouse": warehouse,
		"assigned_users": assigned,
	}


def _normalize_users(assign_users):
	if not assign_users:
		return []
	if isinstance(assign_users, str):
		assign_users = [row.strip() for row in re.split(r"[\n,;]+", assign_users) if row.strip()]
	users = []
	for user in assign_users:
		if not user or not frappe.db.exists("User", user):
			frappe.throw(_("User {0} tidak ditemukan").format(user))
		users.append(user)
	return users
