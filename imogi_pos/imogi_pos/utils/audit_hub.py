# Copyright (c) 2026, Imogi and contributors
"""Audit Hub: version log, login history, timeline, discount & void analysis."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import add_days, cint, flt, getdate, today

from imogi_pos.imogi_pos.utils.flow import get_settings
from imogi_pos.imogi_pos.utils.planned_features import (
	get_activity_timeline,
	get_discount_analysis,
	get_void_analysis,
)

# POS-relevant doctypes for Version / Activity filters
_AUDIT_DOCTYPES = (
	"Riwayat Order",
	"POS Invoice",
	"Stock Entry",
	"Stock Reconciliation",
	"IMOGI POS Settings",
	"IMOGI POS Voucher",
	"IMOGI POS Loyalty Member",
	"IMOGI Kitchen Order",
)


def _company() -> str | None:
	return get_settings().default_company


def _require_audit_read():
	if frappe.session.user == "Guest":
		frappe.throw(_("Not permitted"), frappe.PermissionError)
	if not (
		frappe.has_permission("Version", "read")
		or frappe.has_permission("Activity Log", "read")
		or frappe.has_permission("Riwayat Order", "read")
	):
		frappe.throw(_("Tidak punya akses audit"), frappe.PermissionError)


def get_audit_summary() -> dict:
	_require_audit_read()
	company = _company()
	day_start = add_days(getdate(today()), -30)
	versions_30d = frappe.db.count("Version", {"creation": [">=", day_start]})
	logins_30d = frappe.db.count(
		"Activity Log", {"operation": "Login", "creation": [">=", day_start]}
	)
	voids = get_void_analysis(date_from=day_start, company=company)
	disc = get_discount_analysis(date_from=day_start, company=company)
	total_discount = sum(flt(r.total_discount) for r in (disc.get("rows") or []))
	return {
		"versions_30d": versions_30d,
		"logins_30d": logins_30d,
		"voids_30d": cint(voids.get("count")),
		"void_amount_30d": flt(voids.get("total_voided")),
		"discount_amount_30d": total_discount,
		"company": company,
	}


def list_audit_versions(search: str | None = None, limit: int = 50) -> dict:
	"""Perubahan dokumen (Frappe Version) terkait operasional POS."""
	_require_audit_read()
	filters: dict = {"ref_doctype": ["in", list(_AUDIT_DOCTYPES)]}
	or_filters = None
	if search:
		term = f"%{search.strip()}%"
		or_filters = [["docname", "like", term], ["ref_doctype", "like", term], ["owner", "like", term]]
	rows = frappe.get_all(
		"Version",
		filters=filters,
		or_filters=or_filters,
		fields=["name", "ref_doctype", "docname", "owner", "creation"],
		order_by="creation desc",
		limit_page_length=cint(limit) or 50,
	)
	return {"rows": rows, "count": len(rows)}


def list_login_history(search: str | None = None, limit: int = 50) -> dict:
	_require_audit_read()
	filters: dict = {"operation": ["in", ["Login", "Logout"]]}
	or_filters = None
	if search:
		term = f"%{search.strip()}%"
		or_filters = [["user", "like", term], ["ip_address", "like", term]]
	rows = frappe.get_all(
		"Activity Log",
		filters=filters,
		or_filters=or_filters,
		fields=["name", "user", "operation", "status", "ip_address", "creation"],
		order_by="creation desc",
		limit_page_length=cint(limit) or 50,
	)
	return {"rows": rows, "count": len(rows)}


def list_activity_timeline(search: str | None = None, limit: int = 50) -> dict:
	_require_audit_read()
	payload = get_activity_timeline(limit=cint(limit) or 50)
	rows = payload.get("rows") or []
	if search:
		term = search.strip().lower()
		rows = [
			r
			for r in rows
			if term
			in f"{r.get('subject') or ''} {r.get('user') or ''} {r.get('reference_doctype') or ''} {r.get('reference_name') or ''}".lower()
		]
	return {"rows": rows, "count": len(rows)}


def get_discount_analysis_hub(date_from=None, date_to=None) -> dict:
	_require_audit_read()
	company = _company()
	base = get_discount_analysis(date_from=date_from, date_to=date_to, company=company)
	day_start = getdate(date_from) if date_from else add_days(getdate(today()), -30)
	day_end = add_days(getdate(date_to) if date_to else getdate(today()), 1)
	breakdown = frappe.db.sql(
		"""
		select
			coalesce(sum(discount_amount), 0) as manual_and_total,
			coalesce(sum(voucher_discount_amount), 0) as voucher,
			coalesce(sum(loyalty_discount_amount), 0) as loyalty,
			coalesce(sum(promo_discount_amount), 0) as promo,
			count(*) as orders_with_discount
		from `tabRiwayat Order`
		where status not in ('Cancelled', 'Draft')
			and company = %(company)s
			and creation >= %(start)s and creation < %(end)s
			and (
				coalesce(discount_amount, 0) > 0
				or coalesce(voucher_discount_amount, 0) > 0
				or coalesce(loyalty_discount_amount, 0) > 0
				or coalesce(promo_discount_amount, 0) > 0
			)
		""",
		{"company": company, "start": day_start, "end": day_end},
		as_dict=True,
	)
	b = breakdown[0] if breakdown else {}
	base["breakdown"] = {
		"voucher": flt(b.get("voucher")),
		"loyalty": flt(b.get("loyalty")),
		"promo": flt(b.get("promo")),
		"orders_with_discount": cint(b.get("orders_with_discount")),
		"total_discount": sum(flt(r.total_discount) for r in (base.get("rows") or [])),
	}
	return base


def get_void_analysis_hub(date_from=None, date_to=None) -> dict:
	_require_audit_read()
	return get_void_analysis(date_from=date_from, date_to=date_to, company=_company())


def _require_accounting_read():
	if frappe.session.user == "Guest":
		frappe.throw(_("Not permitted"), frappe.PermissionError)
	if not (
		frappe.has_permission("POS Invoice", "read")
		or frappe.has_permission("Sales Invoice", "read")
		or frappe.has_permission("Riwayat Order", "read")
	):
		frappe.throw(_("Tidak punya akses akuntansi"), frappe.PermissionError)


def get_accounting_bridge(limit: int = 40) -> dict:
	"""Integrasi akuntansi: POS Invoice dari Riwayat Order → buku ERPNext."""
	_require_accounting_read()
	company = _company()
	day_start = add_days(getdate(today()), -30)
	completed = frappe.db.count(
		"Riwayat Order",
		{"status": "Completed", "company": company, "creation": [">=", day_start]}
		if company
		else {"status": "Completed", "creation": [">=", day_start]},
	)
	pos_filters: dict = {"docstatus": 1, "creation": [">=", day_start]}
	if company:
		pos_filters["company"] = company
	pos_invoices = frappe.db.count("POS Invoice", pos_filters)
	linked = frappe.db.sql(
		"""
		select count(*) from `tabPOS Invoice`
		where docstatus = 1 and creation >= %(start)s
			and imogi_pos_order is not null and imogi_pos_order != ''
			{company_clause}
		""".format(company_clause="and company = %(company)s" if company else ""),
		{"start": day_start, "company": company},
	)[0][0]
	rows = frappe.db.sql(
		"""
		select name, imogi_pos_order, customer, customer_name, grand_total, posting_date, status, docstatus
		from `tabPOS Invoice`
		where docstatus = 1 and creation >= %(start)s
			and imogi_pos_order is not null and imogi_pos_order != ''
			{company_clause}
		order by creation desc
		limit %(limit)s
		""".format(company_clause="and company = %(company)s" if company else ""),
		{"start": day_start, "company": company, "limit": cint(limit) or 40},
		as_dict=True,
	)
	pos_invoices = frappe.db.count("POS Invoice", pos_filters)
	return {
		"company": company,
		"orders_completed_30d": completed,
		"pos_invoices_30d": pos_invoices,
		"pos_linked_30d": cint(linked),
		"coverage_pct": (flt(linked) / completed * 100) if completed else 0,
		"rows": rows,
		"count": len(rows),
		"links": {
			"pos_invoice": "List/POS Invoice",
			"sales_invoice": "List/Sales Invoice",
			"finance_hub": "finance-hub",
			"journal_entry": "List/Journal Entry",
		},
	}
