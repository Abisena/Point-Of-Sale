# Copyright (c) 2026, Imogi and contributors

import json

import frappe
from frappe import _
from frappe.utils import cint, flt, getdate, now_datetime, today

from imogi_pos.imogi_pos.utils.setup_wizard.business_templates import AUTO_CREATED_CHECKLIST


def get_draft_session():
	"""Return latest draft setup session for current user."""
	name = frappe.db.get_value(
		"IMOGI POS Setup Session",
		{"status": "Draft", "owner": frappe.session.user},
		"name",
		order_by="modified desc",
	)
	if name:
		return frappe.get_doc("IMOGI POS Setup Session", name)

	doc = frappe.new_doc("IMOGI POS Setup Session")
	doc.status = "Draft"
	doc.current_step = 1
	doc.opening_time = "07:00:00"
	doc.closing_time = "22:00:00"
	doc.printer_option = "Skip"
	doc.flags.ignore_mandatory = True
	doc.insert(ignore_permissions=True)
	frappe.db.commit()
	return doc


def session_to_dict(doc):
	return {
		"name": doc.name,
		"status": doc.status,
		"current_step": doc.current_step,
		"store_name": doc.store_name,
		"store_city": doc.store_city,
		"owner_whatsapp": doc.owner_whatsapp,
		"multi_branch": cint(doc.multi_branch),
		"branch_name": doc.branch_name,
		"business_type": doc.business_type,
		"opening_time": doc.opening_time,
		"closing_time": doc.closing_time,
		"target_monthly_sales": flt(doc.target_monthly_sales),
		"printer_option": doc.printer_option,
		"printer_note": doc.printer_note,
		"payment_gateway": doc.payment_gateway,
		"cashiers": [
			{k: v for k, v in row.as_dict().items() if k != "temp_password"} for row in doc.cashiers
		],
		"products": [row.as_dict() for row in doc.products],
		"suppliers": [row.as_dict() for row in doc.suppliers],
		"payments": [row.as_dict() for row in doc.payments],
		"company": doc.company,
		"pos_profile": doc.pos_profile,
		"warehouse": doc.warehouse,
	}


def update_session(doc, data):
	data = frappe.parse_json(data) if isinstance(data, str) else (data or {})
	for field in (
		"current_step",
		"store_name",
		"store_city",
		"owner_whatsapp",
		"multi_branch",
		"branch_name",
		"business_type",
		"opening_time",
		"closing_time",
		"target_monthly_sales",
		"printer_option",
		"printer_note",
		"payment_gateway",
	):
		if field in data:
			doc.set(field, data[field])

	if "payment_gateway_key" in data and data.get("payment_gateway_key"):
		doc.payment_gateway_key = data["payment_gateway_key"]

	for table, key in (
		("cashiers", "cashiers"),
		("products", "products"),
		("suppliers", "suppliers"),
		("payments", "payments"),
	):
		if key in data:
			doc.set(table, [])
			for row in data[key] or []:
				doc.append(table, row)

	doc.save(ignore_permissions=True)
	frappe.db.commit()
	return doc


def get_summary(doc):
	payments = [p.mode_of_payment for p in doc.payments if cint(p.enabled)]
	return {
		"store_name": doc.store_name,
		"store_city": doc.store_city,
		"owner_whatsapp": doc.owner_whatsapp,
		"business_type": doc.business_type,
		"shift": f"{doc.opening_time or '-'} — {doc.closing_time or '-'}",
		"cashiers": ", ".join(c.full_name for c in doc.cashiers) or _("—"),
		"suppliers": ", ".join(s.supplier_name for s in doc.suppliers) or _("—"),
		"products_count": len(doc.products),
		"payments": ", ".join(payments) or _("—"),
		"payment_gateway": doc.payment_gateway or _("—"),
		"printer": doc.printer_option or _("Skip"),
		"target_sales": doc.target_monthly_sales or _("Tidak diset"),
		"auto_created": AUTO_CREATED_CHECKLIST,
	}
