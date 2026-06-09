# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import cint

from imogi_pos.api.auth import ensure_setup_ready, validate_order_api_access
from imogi_pos.imogi_pos.utils.flow import get_settings, resolve_company


def _get_customer_contact(customer_name):
	contact = frappe.db.sql(
		"""
		SELECT ct.mobile_no, ct.email_id
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


def _serialize_customer(customer):
	contact = _get_customer_contact(customer.name)
	return {
		"name": customer.name,
		"customer_name": customer.customer_name,
		"customer_type": customer.customer_type,
		"mobile_no": contact.mobile_no if contact and contact.mobile_no else None,
		"email_id": contact.email_id if contact and contact.email_id else None,
	}


def create_customer_record(customer_name, customer_type="Individual", mobile_no=None, email_id=None, company=None):
	"""Create Customer (+ optional Contact) using IMOGI POS defaults."""
	customer_name = (customer_name or "").strip()
	if not customer_name:
		frappe.throw(_("customer_name is required"))

	if customer_type not in ("Individual", "Company"):
		frappe.throw(_("customer_type must be Individual or Company"))

	settings = get_settings()
	company = resolve_company(company, settings)
	customer = frappe.new_doc("Customer")
	customer.customer_name = customer_name
	customer.customer_type = customer_type
	customer.default_currency = frappe.get_cached_value("Company", company, "default_currency")
	customer.insert(ignore_permissions=True)

	if mobile_no or email_id:
		contact = frappe.new_doc("Contact")
		contact.first_name = customer_name
		if mobile_no:
			contact.mobile_no = mobile_no.strip()
		if email_id:
			contact.email_id = email_id.strip()
		contact.append("links", {"link_doctype": "Customer", "link_name": customer.name})
		contact.is_primary_contact = 1
		contact.insert(ignore_permissions=True)

	frappe.db.commit()
	return _serialize_customer(customer)


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
