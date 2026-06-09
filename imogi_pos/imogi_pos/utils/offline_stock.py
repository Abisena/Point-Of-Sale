# Copyright (c) 2026, Imogi and contributors
"""Stock validation for checkout and offline sync conflict detection."""

import frappe
from frappe import _
from frappe.utils import cint, flt

from imogi_pos.imogi_pos.utils.bom_stock import apply_bom_stock_limits


def validate_cart_stock(items, warehouse, pos_profile=None, branch=None):
	"""Return stock conflicts before checkout."""
	if not items or not warehouse:
		return {"ok": True, "conflicts": []}

	from erpnext.accounts.doctype.pos_invoice.pos_invoice import get_stock_availability

	conflicts = []
	for row in items:
		code = row.get("item_code")
		if not code:
			continue

		requested = flt(row.get("qty") or 1)
		is_stock_item = cint(frappe.db.get_value("Item", code, "is_stock_item"))
		available_qty, in_stock, bom_limited = apply_bom_stock_limits(
			code, warehouse, 0, is_stock_item
		)

		if bom_limited:
			available = flt(available_qty)
		elif is_stock_item:
			available, _, _ = get_stock_availability(code, warehouse)
			available = flt(available)
			in_stock = available > 0
		else:
			continue

		if not in_stock or requested > available:
			conflicts.append(
				{
					"item_code": code,
					"item_name": row.get("item_name") or code,
					"requested_qty": requested,
					"available_qty": available,
				}
			)

	if conflicts:
		return {"ok": False, "conflicts": conflicts}
	return {"ok": True, "conflicts": []}


def ensure_cart_stock_or_throw(items, warehouse, pos_profile=None):
	result = validate_cart_stock(items, warehouse, pos_profile=pos_profile)
	if result["ok"]:
		return result
	lines = []
	for row in result["conflicts"]:
		lines.append(
			_("{0}: minta {1}, tersedia {2}").format(
				row["item_name"],
				row["requested_qty"],
				row["available_qty"],
			)
		)
	frappe.throw(
		_("Stok tidak mencukupi:<br>{0}").format("<br>".join(lines)),
		title=_("Konflik Stok"),
	)
