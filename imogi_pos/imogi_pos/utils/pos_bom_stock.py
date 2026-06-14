# Copyright (c) 2026, Imogi and contributors

import frappe

from imogi_pos.imogi_pos.utils.bom_stock import cancel_bom_consumption_for_pos_invoice, consume_bom_for_pos_invoice
from frappe.utils import cint


def consume_bom_for_pos_invoice_on_submit(doc, method=None):
	consume_bom_for_pos_invoice(doc)
	_invalidate_pos_catalog_cache()


def cancel_bom_for_pos_invoice_on_cancel(doc, method=None):
	cancel_bom_consumption_for_pos_invoice(doc)
	_invalidate_pos_catalog_cache()


def invalidate_pos_catalog_cache_on_invoice_submit(doc, method=None):
	"""POS Invoice submit updates Bin qty — catalog list cache must refresh."""
	if doc.is_return or cint(getattr(doc, "docstatus", 0)) != 1:
		return
	_invalidate_pos_catalog_cache()


def _invalidate_pos_catalog_cache():
	from imogi_pos.api.catalog import invalidate_pos_catalog_cache

	invalidate_pos_catalog_cache()
