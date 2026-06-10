# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import cint

from imogi_pos.api.cashier import _require_cashier_access
from imogi_pos.imogi_pos.utils.feature_gating import require_feature_operational
from imogi_pos.imogi_pos.utils.flow import get_settings, release_restaurant_table, reserve_restaurant_table


def _table_filters(company=None, status=None):
	filters = {}
	settings = get_settings()
	company = company or settings.default_company
	if company:
		filters["company"] = company
	if status:
		filters["status"] = status
	return filters


@frappe.whitelist()
def list_restaurant_tables(company=None, status=None, include_occupied=1):
	"""List restaurant tables for cashier table picker."""
	_require_cashier_access()
	require_feature_operational("table_management")

	filters = _table_filters(company=company)
	if not cint(include_occupied):
		filters["status"] = "Available"

	rows = frappe.get_all(
		"IMOGI Restaurant Table",
		filters=filters,
		fields=[
			"name",
			"table_number",
			"capacity",
			"status",
			"location",
			"current_order",
			"company",
		],
		order_by="table_number asc",
	)
	return {"tables": rows}


@frappe.whitelist()
def move_restaurant_table(order_name, new_table, company=None):
	"""Move an open order to another table."""
	_require_cashier_access()
	require_feature_operational("move_table")

	if not order_name or not new_table:
		frappe.throw(_("Order dan meja tujuan wajib diisi"))

	order = frappe.get_doc("IMOGI POS Order", order_name)
	order.check_permission("write")
	if order.status in ("Completed", "Cancelled", "Refunded"):
		frappe.throw(_("Order sudah selesai — tidak bisa pindah meja"))

	new_table_doc = frappe.get_doc("IMOGI Restaurant Table", new_table)
	if new_table_doc.status == "Occupied" and new_table_doc.current_order not in (None, "", order_name):
		frappe.throw(_("Meja {0} sedang dipakai").format(new_table_doc.table_number))

	if order.restaurant_table:
		release_restaurant_table(order)

	order.db_set("restaurant_table", new_table)
	reserve_restaurant_table(order)
	frappe.db.commit()

	return {
		"order": order_name,
		"restaurant_table": new_table,
		"table_number": new_table_doc.table_number,
	}
