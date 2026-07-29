# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import flt

from imogi_pos.imogi_pos.utils.approval import approve_request, create_approval_request, is_approval_enabled
from imogi_pos.imogi_pos.utils.flow import get_settings


@frappe.whitelist()
def request_approval(approval_type, reference_name=None, reason=None, amount=0, payload=None):
	if frappe.session.user == "Guest":
		frappe.throw(_("Not permitted"), frappe.PermissionError)
	if not is_approval_enabled():
		frappe.throw(_("Approval workflow is disabled"))

	if isinstance(payload, str):
		payload = frappe.parse_json(payload)

	name = create_approval_request(
		approval_type=approval_type,
		reference_name=reference_name,
		reason=reason,
		amount=flt(amount),
		payload=payload,
	)
	frappe.db.commit()
	return {"name": name, "status": "Pending"}


@frappe.whitelist()
def approve_with_pin(request_name, pin=None):
	if frappe.session.user == "Guest":
		frappe.throw(_("Not permitted"), frappe.PermissionError)
	result = approve_request(request_name, pin)
	frappe.db.commit()
	return result


@frappe.whitelist()
def reject_with_pin(request_name, pin=None, reason=None):
	from imogi_pos.imogi_pos.utils.approval import reject_request

	if frappe.session.user == "Guest":
		frappe.throw(_("Not permitted"), frappe.PermissionError)
	result = reject_request(request_name, pin=pin, reason=reason)
	frappe.db.commit()
	return result
