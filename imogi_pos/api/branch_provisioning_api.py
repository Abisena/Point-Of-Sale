# Copyright (c) 2026, Imogi and contributors
"""API for provisioning companies/branches and cashier access."""

import json

import frappe
from frappe import _
from frappe.utils import cint, flt

from imogi_pos.imogi_pos.utils.branch import grant_branch_access, list_branch_cashiers
from imogi_pos.imogi_pos.utils.branch_provisioning import (
	get_provisioning_context,
	provision_branch_for_existing_company,
	provision_branch_stack,
)


def _require_provision_access():
	frappe.only_for(
		(
			"System Manager",
			"Sales Manager",
			"Administrator",
			"IMOGI Owner",
			"IMOGI Area Manager",
		)
	)


@frappe.whitelist()
def get_branch_provisioning_context():
	_require_provision_access()
	return get_provisioning_context()


@frappe.whitelist()
def provision_company_and_branch(
	branch_name,
	mode="new_company",
	company=None,
	new_company_name=None,
	city=None,
	warehouse_label=None,
	target_monthly_sales=0,
	is_default=0,
	assign_users=None,
	currency="IDR",
	country="Indonesia",
	pos_profile=None,
	warehouse=None,
):
	"""
	One-shot helper: new company + branch stack, or branch on existing company/POS Profile.

	mode:
	  - new_company: create Company + Warehouse + POS Profile + IMOGI Branch
	  - existing_company: auto POS Profile if missing
	  - existing_pos: link existing POS Profile + warehouse
	"""
	_require_provision_access()
	assign_users = _parse_users(assign_users)
	target_monthly_sales = flt(target_monthly_sales)

	if mode == "existing_pos":
		if not company or not pos_profile:
			frappe.throw(_("Company dan POS Profile wajib untuk mode existing_pos"))
		return provision_branch_for_existing_company(
			branch_name=branch_name,
			company=company,
			pos_profile=pos_profile,
			warehouse=warehouse,
			city=city,
			target_monthly_sales=target_monthly_sales,
			is_default=cint(is_default),
			assign_users=assign_users,
		)

	if mode == "existing_company":
		if not company:
			frappe.throw(_("Pilih company yang sudah ada"))
		return provision_branch_stack(
			branch_name=branch_name,
			company=company,
			city=city,
			warehouse_label=warehouse_label,
			target_monthly_sales=target_monthly_sales,
			is_default=cint(is_default),
			assign_users=assign_users,
		)

	return provision_branch_stack(
		branch_name=branch_name,
		new_company_name=new_company_name,
		city=city,
		warehouse_label=warehouse_label,
		target_monthly_sales=target_monthly_sales,
		is_default=cint(is_default),
		assign_users=assign_users,
		currency=currency,
		country=country,
	)


@frappe.whitelist()
def assign_cashiers_to_branch(branch_code, users=None):
	"""Grant Company + POS Profile permissions for selected cashiers."""
	_require_provision_access()
	user_list = _parse_users(users)
	if not user_list:
		frappe.throw(_("Pilih minimal satu user kasir"))

	results = []
	for user in user_list:
		results.append(grant_branch_access(user, branch_code=branch_code))
	frappe.db.commit()
	return {"branch_code": branch_code, "assigned": results}


@frappe.whitelist()
def get_branch_cashier_assignments(branch_code):
	_require_provision_access()
	return {"branch_code": branch_code, "cashiers": list_branch_cashiers(branch_code)}


def _parse_users(users):
	if not users:
		return []
	if isinstance(users, str):
		try:
			parsed = json.loads(users)
			if isinstance(parsed, list):
				return [row for row in parsed if row]
		except Exception:
			pass
		return [row.strip() for row in users.replace(";", ",").split(",") if row.strip()]
	return list(users)
