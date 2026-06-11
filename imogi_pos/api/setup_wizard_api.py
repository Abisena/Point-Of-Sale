# Copyright (c) 2026, Imogi and contributors
"""IMOGI POS 9-step Setup Wizard API."""

import frappe
from frappe import _
from frappe.utils import cint

from imogi_pos.imogi_pos.utils.setup_wizard.business_templates import list_business_templates
from imogi_pos.imogi_pos.utils.setup_wizard.provisioning import (
	complete_wizard,
	ensure_import_context,
	list_payment_methods,
)
from imogi_pos.imogi_pos.utils.deployment_mode import is_erp_enterprise_deployment
from imogi_pos.imogi_pos.utils.setup_wizard.session import (
	get_draft_session,
	get_summary,
	session_to_dict,
	update_session,
)


def _require_access():
	frappe.only_for(("System Manager", "Sales Manager"))


@frappe.whitelist()
def get_wizard_state():
	_require_access()
	settings = frappe.get_single("IMOGI POS Settings")
	if settings.setup_complete:
		return {"setup_complete": True}

	doc = get_draft_session()
	default_tier = "Enterprise" if is_erp_enterprise_deployment() else "Free"
	if not doc.subscription_tier or (
		is_erp_enterprise_deployment() and doc.subscription_tier != default_tier
	):
		doc.subscription_tier = default_tier
		if (
			not is_erp_enterprise_deployment()
			and (cint(doc.current_step) > 1 or (doc.store_name or "").strip())
		):
			doc.current_step = min(10, cint(doc.current_step) + 1)
		doc.save(ignore_permissions=True)
		frappe.db.commit()

	if not doc.payments:
		for row in list_payment_methods():
			doc.append(
				"payments",
				{
					"mode_of_payment": row.name,
					"enabled": 1 if row.name in ("Cash", "QRIS") else 0,
					"is_default": 1 if row.name == "Cash" else 0,
				},
			)
		doc.save(ignore_permissions=True)
		frappe.db.commit()

	return {
		"setup_complete": False,
		"enterprise_deployment": is_erp_enterprise_deployment(),
		"session": session_to_dict(doc),
		"business_templates": list_business_templates(),
		"payment_methods": list_payment_methods(),
		"steps": _wizard_steps(),
	}


@frappe.whitelist()
def save_wizard_step(data):
	_require_access()
	doc = get_draft_session()
	doc = update_session(doc, data)
	if cint(doc.current_step) >= 3 and (doc.store_name or "").strip() and doc.business_type:
		ensure_import_context()
		doc.reload()
	return {"session": session_to_dict(doc)}


@frappe.whitelist()
def get_wizard_summary(session_name=None):
	_require_access()
	name = session_name or get_draft_session().name
	doc = frappe.get_doc("IMOGI POS Setup Session", name)
	return get_summary(doc)


@frappe.whitelist()
def finish_wizard(session_name=None):
	_require_access()
	name = session_name or get_draft_session().name
	return complete_wizard(name)


@frappe.whitelist()
def lookup_barcode(barcode):
	_require_access()
	barcode = (barcode or "").strip()
	if not barcode:
		return None
	item = frappe.db.get_value(
		"Item",
		{"barcode": barcode},
		["name", "item_name", "standard_rate", "valuation_rate", "item_group"],
		as_dict=True,
	)
	if not item:
		item = frappe.db.get_value("Item", barcode, ["name", "item_name", "standard_rate", "valuation_rate", "item_group"], as_dict=True)
	return item


def _wizard_steps():
	if is_erp_enterprise_deployment():
		return [
			{"no": 1, "key": "identity", "title": _("Identitas toko"), "hint": _("Nama, kota, WA")},
			{"no": 2, "key": "business", "title": _("Jenis usaha"), "hint": _("Template & COA")},
			{"no": 3, "key": "cashier", "title": _("Kasir pertama"), "hint": _("Akun & role")},
			{"no": 4, "key": "products", "title": _("Produk awal"), "hint": _("Item + HPP")},
			{"no": 5, "key": "supplier", "title": _("Vendor & Supplier"), "hint": _("Supplier default")},
			{"no": 6, "key": "payment", "title": _("Pembayaran"), "hint": _("Metode & gateway")},
			{"no": 7, "key": "printer", "title": _("Printer & Hardware"), "hint": _("Struk & koneksi")},
			{"no": 8, "key": "ops", "title": _("Operasional"), "hint": _("Shift & target")},
			{"no": 9, "key": "confirm", "title": _("Konfirmasi"), "hint": _("Review & launch")},
		]

	return [
		{"no": 1, "key": "subscription", "title": _("Paket langganan"), "hint": _("Free → Enterprise")},
		{"no": 2, "key": "identity", "title": _("Identitas toko"), "hint": _("Nama, kota, WA")},
		{"no": 3, "key": "business", "title": _("Jenis usaha"), "hint": _("Template & COA")},
		{"no": 4, "key": "cashier", "title": _("Kasir pertama"), "hint": _("Akun & role")},
		{"no": 5, "key": "products", "title": _("Produk awal"), "hint": _("Item + HPP")},
		{"no": 6, "key": "supplier", "title": _("Vendor & Supplier"), "hint": _("Supplier default")},
		{"no": 7, "key": "payment", "title": _("Pembayaran"), "hint": _("Metode & gateway")},
		{"no": 8, "key": "printer", "title": _("Printer & Hardware"), "hint": _("Struk & koneksi")},
		{"no": 9, "key": "ops", "title": _("Operasional"), "hint": _("Shift & target")},
		{"no": 10, "key": "confirm", "title": _("Konfirmasi"), "hint": _("Review & launch")},
	]
