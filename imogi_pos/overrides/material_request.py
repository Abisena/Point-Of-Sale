# Copyright (c) 2026, Imogi and contributors
"""Native ERPNext desk 'Create > Purchase Order' from Material Request has no
concept of IMOGI's "Supplier Tujuan" (imogi_preferred_supplier) custom field,
so it always leaves the mapped Purchase Order's Supplier blank — the native
supplier-first flow only auto-fills from each Item's Item Defaults table,
which most merchants never configure. Carry the preferred supplier over here
instead, same intent as purchasing_hub.create_purchase_order_from_request,
just for the native /app path.
"""

import frappe
from erpnext.stock.doctype.material_request.material_request import (
	make_purchase_order as _make_purchase_order,
)


@frappe.whitelist()
def make_purchase_order(source_name, target_doc=None, args=None):
	target = _make_purchase_order(source_name, target_doc, args)
	if not target.supplier:
		preferred_supplier = frappe.db.get_value(
			"Material Request", source_name, "imogi_preferred_supplier"
		)
		if preferred_supplier:
			target.supplier = preferred_supplier
	return target
