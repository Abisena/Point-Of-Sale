# Copyright (c) 2026, Imogi and contributors

import frappe

from imogi_pos.imogi_pos.utils.bom_stock import cancel_bom_consumption_for_pos_invoice, consume_bom_for_pos_invoice


def consume_bom_for_pos_invoice_on_submit(doc, method=None):
	consume_bom_for_pos_invoice(doc)


def cancel_bom_for_pos_invoice_on_cancel(doc, method=None):
	cancel_bom_consumption_for_pos_invoice(doc)
