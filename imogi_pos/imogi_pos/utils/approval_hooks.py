# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import cint, flt

from imogi_pos.imogi_pos.utils.approval import is_approval_enabled
from imogi_pos.imogi_pos.utils.feature_gating import is_feature_operational
from imogi_pos.imogi_pos.utils.flow import get_settings


def _approval_flag_set(doc) -> bool:
	return bool(getattr(doc.flags, "imogi_approval_ok", False))


def purchase_order_before_submit(doc, method=None):
	if _approval_flag_set(doc):
		return
	if not is_feature_operational("approval_purchase_order"):
		return
	if not is_approval_enabled():
		return
	if cint(doc.get("__islocal")):
		return
	frappe.throw(
		_("Purchase Order memerlukan approval supervisor (Enterprise). Setujui via IMOGI POS Approval Request."),
		title=_("Perlu Approval"),
	)


def stock_entry_before_submit(doc, method=None):
	if _approval_flag_set(doc):
		return
	if doc.stock_entry_type not in ("Material Issue", "Material Receipt"):
		return
	if not is_feature_operational("approval_stock_adjustment"):
		return
	if not is_approval_enabled():
		return
	frappe.throw(
		_("Stock adjustment/issue memerlukan approval supervisor."),
		title=_("Perlu Approval"),
	)


def complimentary_discount_check(order_doc):
	"""Call from order validate when discount_type is Complimentary."""
	if not is_feature_operational("approval_complimentary"):
		return
	if not is_approval_enabled():
		return
	if (order_doc.discount_type or "").lower() != "complimentary":
		return
	if _approval_flag_set(order_doc):
		return
	if flt(order_doc.discount_amount) <= 0:
		return
	frappe.throw(
		_("Menu complimentary memerlukan approval supervisor."),
		title=_("Perlu Approval"),
	)
