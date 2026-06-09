# Copyright (c) 2026, Imogi and contributors
"""Adjust ERPNext POS consolidation for IMOGI POS (BOM / restaurant flows)."""

import frappe

from imogi_pos.imogi_pos.utils.bom_stock import get_default_bom
from imogi_pos.imogi_pos.utils.business_profile import BUSINESS_RESTAURANT
from imogi_pos.imogi_pos.utils.flow import get_settings


def should_skip_consolidated_stock(doc):
	"""Skip FG stock on consolidated Sales Invoice when BOM already consumed ingredients."""
	settings = get_settings()
	if settings.business_type == BUSINESS_RESTAURANT:
		return True

	items = [row for row in (doc.items or []) if row.item_code]
	if not items:
		return False

	for row in items:
		if get_default_bom(row.item_code):
			continue
		if frappe.db.get_value("Item", row.item_code, "is_stock_item"):
			return False

	return True


def before_consolidated_sales_invoice_submit(doc, method=None):
	"""POS Invoice does not update stock; consolidation must not re-deduct FG for BOM menu items."""
	if not doc.get("is_consolidated"):
		return

	if should_skip_consolidated_stock(doc):
		doc.update_stock = 0
