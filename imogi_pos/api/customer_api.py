# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import cint

from imogi_pos.api.auth import ensure_setup_ready, validate_order_api_access
from imogi_pos.imogi_pos.utils.flow import get_settings, resolve_company


def _contact_phone(contact):
	if not contact:
		return ""
	return (contact.get("mobile_no") or contact.get("phone") or "").strip()


def _get_customer_contact(customer_name):
	contact = frappe.db.sql(
		"""
		SELECT ct.name, ct.mobile_no, ct.phone, ct.email_id
		FROM `tabContact` ct
		INNER JOIN `tabDynamic Link` dl
			ON dl.parent = ct.name AND dl.parenttype = 'Contact'
		WHERE dl.link_doctype = 'Customer' AND dl.link_name = %(customer)s
		ORDER BY ct.is_primary_contact DESC, ct.modified DESC
		LIMIT 1
		""",
		{"customer": customer_name},
		as_dict=True,
	)
	return contact[0] if contact else None


def _serialize_customer(customer, mobile_no=None):
	contact = _get_customer_contact(customer.name)
	phone = _contact_phone(contact) or (mobile_no or "").strip()
	return {
		"name": customer.name,
		"customer_name": customer.customer_name,
		"customer_type": customer.customer_type,
		"mobile_no": phone or None,
		"email_id": (contact.get("email_id") if contact else None) or None,
	}


def _set_contact_mobile(contact, mobile_no):
	"""Simpan No. HP lewat child table phone_nos (Frappe Contact requirement)."""
	mobile_no = (mobile_no or "").strip()
	if not mobile_no:
		return

	found = False
	for row in contact.get("phone_nos") or []:
		if (row.phone or "").strip() == mobile_no:
			row.is_primary_mobile_no = 1
			row.is_primary_phone = 1
			found = True
		else:
			row.is_primary_mobile_no = 0
			row.is_primary_phone = 0

	if not found:
		contact.append(
			"phone_nos",
			{
				"phone": mobile_no,
				"is_primary_phone": 1,
				"is_primary_mobile_no": 1,
			},
		)


def _upsert_customer_contact(customer, customer_name, mobile_no=None, email_id=None):
	mobile_no = (mobile_no or "").strip()
	email_id = (email_id or "").strip()
	if not mobile_no and not email_id:
		return

	contact_row = _get_customer_contact(customer.name)
	if contact_row and contact_row.get("name"):
		contact = frappe.get_doc("Contact", contact_row.name)
		if mobile_no:
			_set_contact_mobile(contact, mobile_no)
		if email_id:
			contact.email_id = email_id
			contact.add_email(email_id, is_primary=1)
		contact.save(ignore_permissions=True)
		return

	contact = frappe.new_doc("Contact")
	contact.first_name = customer_name or customer.customer_name
	if mobile_no:
		_set_contact_mobile(contact, mobile_no)
	if email_id:
		contact.email_id = email_id
		contact.add_email(email_id, is_primary=1)
	contact.append("links", {"link_doctype": "Customer", "link_name": customer.name})
	contact.is_primary_contact = 1
	contact.insert(ignore_permissions=True)


def create_customer_record(
	customer_name, customer_type="Individual", mobile_no=None, email_id=None, company=None, date_of_birth=None
):
	"""Create Customer (+ optional Contact) using IMOGI POS defaults."""
	customer_name = (customer_name or "").strip()
	if not customer_name:
		frappe.throw(_("customer_name is required"))

	if customer_type not in ("Individual", "Company"):
		frappe.throw(_("customer_type must be Individual or Company"))

	settings = get_settings()
	from imogi_pos.imogi_pos.utils.receipt_branding import get_whatsapp_receipt_config

	if get_whatsapp_receipt_config(settings)["enable_whatsapp_receipt"] and not (mobile_no or "").strip():
		frappe.throw(_("Nomor HP wajib diisi untuk kirim struk WhatsApp"))

	company = resolve_company(company, settings)
	existing_name = frappe.db.get_value(
		"Customer", {"customer_name": customer_name, "disabled": 0}, "name", order_by="modified desc"
	)
	if existing_name:
		customer = frappe.get_doc("Customer", existing_name)
		_upsert_customer_contact(customer, customer_name, mobile_no=mobile_no, email_id=email_id)
		_sync_customer_birthday(customer.name, date_of_birth, company=company)
		frappe.db.commit()
		return _serialize_customer(customer, mobile_no=mobile_no)

	customer = frappe.new_doc("Customer")
	customer.customer_name = customer_name
	customer.customer_type = customer_type
	customer.default_currency = frappe.get_cached_value("Company", company, "default_currency")
	if date_of_birth and frappe.get_meta("Customer").has_field("imogi_birthday"):
		customer.imogi_birthday = date_of_birth
	customer.insert(ignore_permissions=True)

	_upsert_customer_contact(customer, customer_name, mobile_no=mobile_no, email_id=email_id)
	_sync_customer_birthday(customer.name, date_of_birth, company=company)

	frappe.db.commit()
	return _serialize_customer(customer, mobile_no=mobile_no)


def _sync_customer_birthday(customer, date_of_birth, company=None):
	if not customer or not date_of_birth:
		return
	from imogi_pos.imogi_pos.utils.loyalty import set_member_birthday

	try:
		set_member_birthday(customer, date_of_birth, company=company)
	except Exception:
		frappe.log_error(title="Sync customer birthday", message=frappe.get_traceback())



def _find_customers(search, limit):
	search = (search or "").strip()
	limit = min(cint(limit) or 20, 100)

	if not search:
		names = frappe.get_all(
			"Customer",
			filters={"disabled": 0},
			fields=["name"],
			order_by="modified desc",
			limit=limit,
		)
	else:
		like = f"%{search}%"
		names = frappe.db.sql(
			"""
			SELECT DISTINCT c.name
			FROM `tabCustomer` c
			LEFT JOIN `tabDynamic Link` dl
				ON dl.link_doctype = 'Customer' AND dl.link_name = c.name AND dl.parenttype = 'Contact'
			LEFT JOIN `tabContact` ct ON ct.name = dl.parent
			WHERE c.disabled = 0
				AND (
					c.name LIKE %(like)s
					OR c.customer_name LIKE %(like)s
					OR ct.mobile_no LIKE %(like)s
					OR ct.email_id LIKE %(like)s
				)
			ORDER BY c.modified DESC
			LIMIT %(limit)s
			""",
			{"like": like, "limit": limit},
			as_dict=True,
		)

	return [_serialize_customer(_get_customer_doc(row.name)) for row in names]


def _get_customer_doc(name):
	return frappe.get_doc("Customer", name, ignore_permissions=True)


@frappe.whitelist(allow_guest=True)
def search_customers(search=None, limit=20, company=None):
	"""Search customers by name, phone, or email."""
	validate_order_api_access()
	ensure_setup_ready(company)

	customers = _find_customers(search, limit)
	return {
		"customers": customers,
		"count": len(customers),
		"search": search or "",
	}


@frappe.whitelist(allow_guest=True)
def get_customer(customer, company=None):
	"""Get one customer by ID."""
	validate_order_api_access()
	ensure_setup_ready(company)

	if not customer or not frappe.db.exists("Customer", customer):
		frappe.throw(_("Customer {0} not found").format(customer))

	doc = _get_customer_doc(customer)
	if doc.disabled:
		frappe.throw(_("Customer {0} is disabled").format(customer))

	return _serialize_customer(doc)


@frappe.whitelist(allow_guest=True)
def create_customer(
	customer_name,
	customer_type="Individual",
	mobile_no=None,
	email_id=None,
	company=None,
):
	"""Create a simple customer for online orders."""
	validate_order_api_access()
	ensure_setup_ready(company)
	return create_customer_record(customer_name, customer_type, mobile_no, email_id, company=company)
