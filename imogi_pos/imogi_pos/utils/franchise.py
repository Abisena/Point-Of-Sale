# Copyright (c) 2026, Imogi and contributors
"""Franchise branch royalty tracking."""

import frappe
from frappe import _
from frappe.utils import add_days, cint, flt, getdate, get_first_day, get_last_day, today

from imogi_pos.imogi_pos.utils.flow import resolve_company


def get_branch_franchise_meta(branch_code=None, pos_profile=None):
	if not branch_code and not pos_profile:
		return None
	filters = {}
	if branch_code:
		filters["branch_code"] = branch_code
	if pos_profile:
		filters["pos_profile"] = pos_profile
	row = frappe.db.get_value(
		"IMOGI Branch",
		filters,
		["branch_code", "branch_name", "company", "branch_model", "royalty_percent", "franchisee"],
		as_dict=True,
	)
	if not row or row.branch_model != "Franchise":
		return None
	return row


def compute_order_royalty(order, branch_meta=None):
	branch_meta = branch_meta or get_branch_franchise_meta(pos_profile=order.pos_profile)
	if not branch_meta:
		return 0
	pct = flt(branch_meta.royalty_percent)
	if pct <= 0:
		return 0
	return flt(order.grand_total) * pct / 100


def apply_order_royalty(order):
	amount = compute_order_royalty(order)
	if amount > 0:
		order.royalty_amount = amount
	return amount


def get_franchise_sales_summary(company=None, from_date=None, to_date=None):
	company = resolve_company(company)
	from_date = getdate(from_date) if from_date else get_first_day(today())
	to_date = getdate(to_date) if to_date else get_last_day(from_date)
	to_date_exclusive = add_days(to_date, 1)

	branches = frappe.get_all(
		"IMOGI Branch",
		filters={"company": company, "branch_model": "Franchise", "is_active": 1},
		fields=["branch_code", "branch_name", "royalty_percent", "franchisee", "pos_profile"],
	)
	if not branches:
		return {"branches": [], "total_sales": 0, "total_royalty": 0}

	rows = []
	total_sales = 0
	total_royalty = 0
	for branch in branches:
		stats = frappe.db.sql(
			"""
			SELECT
				COALESCE(SUM(grand_total), 0) AS gross_sales,
				COALESCE(SUM(royalty_amount), 0) AS royalty_total,
				COUNT(*) AS order_count
			FROM `tabRiwayat Order`
			WHERE company = %(company)s
				AND pos_profile = %(pos_profile)s
				AND docstatus = 1
				AND status NOT IN ('Cancelled', 'Draft')
				AND creation >= %(from_date)s
				AND creation < %(to_date)s
			""",
			{
				"company": company,
				"pos_profile": branch.pos_profile,
				"from_date": from_date,
				"to_date": to_date_exclusive,
			},
			as_dict=True,
		)[0]
		gross = flt(stats.gross_sales)
		royalty = flt(stats.royalty_total)
		total_sales += gross
		total_royalty += royalty
		rows.append(
			{
				"branch_code": branch.branch_code,
				"branch_name": branch.branch_name,
				"franchisee": branch.franchisee,
				"royalty_percent": flt(branch.royalty_percent),
				"gross_sales": gross,
				"royalty_amount": royalty,
				"order_count": cint(stats.order_count),
			}
		)

	return {
		"company": company,
		"from_date": str(from_date),
		"to_date": str(to_date),
		"branches": rows,
		"total_sales": flt(total_sales),
		"total_royalty": flt(total_royalty),
	}


def generate_royalty_accruals(company=None, from_date=None, to_date=None):
	summary = get_franchise_sales_summary(company=company, from_date=from_date, to_date=to_date)
	created = []
	for row in summary["branches"]:
		if row["royalty_amount"] <= 0:
			continue
		existing = frappe.db.exists(
			"IMOGI POS Royalty Accrual",
			{
				"branch_code": row["branch_code"],
				"period_start": summary["from_date"],
				"period_end": summary["to_date"],
			},
		)
		if existing:
			continue
		doc = frappe.get_doc(
			{
				"doctype": "IMOGI POS Royalty Accrual",
				"company": summary["company"],
				"branch_code": row["branch_code"],
				"branch_name": row["branch_name"],
				"franchisee": row["franchisee"],
				"period_start": summary["from_date"],
				"period_end": summary["to_date"],
				"gross_sales": row["gross_sales"],
				"royalty_percent": row["royalty_percent"],
				"royalty_amount": row["royalty_amount"],
				"order_count": row["order_count"],
				"status": "Draft",
			}
		)
		doc.insert(ignore_permissions=True)
		created.append(doc.name)
	frappe.db.commit()
	return {"created": created, "summary": summary}


def post_royalty_journals(company=None):
	from imogi_pos.imogi_pos.utils.royalty_journal import post_draft_accruals

	return post_draft_accruals(company=company)
