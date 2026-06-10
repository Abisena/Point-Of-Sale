# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import get_datetime, now_datetime

from imogi_pos.api.reports_api import _require_report_access
from imogi_pos.imogi_pos.utils.feature_gating import require_feature_operational
from imogi_pos.imogi_pos.utils.flow import get_settings
from imogi_pos.imogi_pos.utils.planned_features import (
	apply_birthday_promo,
	apply_cashback_amount,
	create_central_purchase_request,
	create_spoilage_entry,
	expand_combo_items,
	get_activity_timeline,
	get_bom_substitutes,
	get_central_inventory_summary,
	get_customer_visit_report,
	get_discount_analysis,
	get_expired_monitoring,
	get_food_cost_report,
	get_kitchen_performance_report,
	get_stock_forecast,
	get_table_turnover_report,
	get_void_analysis,
	get_waste_report,
	list_combo_packages,
	merge_restaurant_orders,
)


def _require_ops_access():
	if frappe.session.user == "Guest":
		frappe.throw(_("Not permitted"), frappe.PermissionError)


@frappe.whitelist()
def merge_tables(primary_order, secondary_order):
	from imogi_pos.api.cashier import _require_cashier_access

	_require_cashier_access()
	require_feature_operational("merge_table")
	return merge_restaurant_orders(primary_order, secondary_order)


@frappe.whitelist()
def list_table_reservations(company=None, status=None):
	_require_ops_access()
	require_feature_operational("table_reservation")
	filters = {}
	settings = get_settings()
	if company or settings.default_company:
		filters["company"] = company or settings.default_company
	if status:
		filters["status"] = status
	rows = frappe.get_all(
		"IMOGI POS Table Reservation",
		filters=filters,
		fields=[
			"name",
			"customer_name",
			"phone",
			"party_size",
			"reservation_datetime",
			"restaurant_table",
			"status",
		],
		order_by="reservation_datetime asc",
		limit=100,
	)
	return {"rows": rows}


@frappe.whitelist()
def create_table_reservation(
	customer_name,
	party_size,
	reservation_datetime,
	phone=None,
	restaurant_table=None,
	company=None,
	notes=None,
):
	_require_ops_access()
	require_feature_operational("table_reservation")
	settings = get_settings()
	doc = frappe.get_doc(
		{
			"doctype": "IMOGI POS Table Reservation",
			"customer_name": customer_name,
			"phone": phone,
			"party_size": party_size,
			"reservation_datetime": get_datetime(reservation_datetime),
			"restaurant_table": restaurant_table,
			"company": company or settings.default_company,
			"status": "Booked",
			"notes": notes,
		}
	)
	doc.insert(ignore_permissions=True)
	if restaurant_table:
		frappe.db.set_value("IMOGI Restaurant Table", restaurant_table, "status", "Reserved")
	frappe.db.commit()
	return {"name": doc.name}


@frappe.whitelist()
def list_waiting_queue(company=None):
	_require_ops_access()
	require_feature_operational("waiting_list")
	settings = get_settings()
	rows = frappe.get_all(
		"IMOGI POS Waiting List",
		filters={"company": company or settings.default_company, "status": "Waiting"},
		fields=["name", "customer_name", "party_size", "phone", "queued_at", "notes"],
		order_by="queued_at asc",
		limit=50,
	)
	return {"rows": rows}


@frappe.whitelist()
def add_waiting_guest(customer_name, party_size, phone=None, company=None, notes=None):
	_require_ops_access()
	require_feature_operational("waiting_list")
	settings = get_settings()
	doc = frappe.get_doc(
		{
			"doctype": "IMOGI POS Waiting List",
			"customer_name": customer_name,
			"party_size": party_size,
			"phone": phone,
			"company": company or settings.default_company,
			"status": "Waiting",
			"queued_at": now_datetime(),
			"notes": notes,
		}
	)
	doc.insert(ignore_permissions=True)
	frappe.db.commit()
	return {"name": doc.name, "queue_position": frappe.db.count("IMOGI POS Waiting List", {"status": "Waiting"})}


@frappe.whitelist()
def seat_waiting_guest(name, restaurant_table=None):
	_require_ops_access()
	require_feature_operational("waiting_list")
	doc = frappe.get_doc("IMOGI POS Waiting List", name)
	doc.db_set({"status": "Seated", "restaurant_table": restaurant_table, "seated_at": now_datetime()})
	frappe.db.commit()
	return {"name": name, "status": "Seated"}


@frappe.whitelist()
def get_combos(company=None):
	from imogi_pos.api.cashier import _require_cashier_access

	_require_cashier_access()
	require_feature_operational("combo_package")
	return {"combos": list_combo_packages(company)}


@frappe.whitelist()
def get_combo_items(combo_name):
	from imogi_pos.api.cashier import _require_cashier_access

	_require_cashier_access()
	require_feature_operational("combo_package")
	return {"items": expand_combo_items(combo_name)}


@frappe.whitelist()
def get_food_cost_report_api(**kwargs):
	_require_report_access()
	require_feature_operational("food_cost_report")
	return get_food_cost_report(**kwargs)


@frappe.whitelist()
def get_waste_report_api(**kwargs):
	_require_report_access()
	require_feature_operational("waste_report")
	return get_waste_report(**kwargs)


@frappe.whitelist()
def get_table_turnover_report_api(**kwargs):
	_require_report_access()
	require_feature_operational("table_turnover_report")
	return get_table_turnover_report(**kwargs)


@frappe.whitelist()
def get_customer_visit_report_api(**kwargs):
	_require_report_access()
	require_feature_operational("customer_visit_report")
	return get_customer_visit_report(**kwargs)


@frappe.whitelist()
def get_kitchen_performance_api(**kwargs):
	_require_report_access()
	require_feature_operational("kitchen_performance")
	return get_kitchen_performance_report(**kwargs)


@frappe.whitelist()
def get_discount_analysis_api(**kwargs):
	_require_report_access()
	require_feature_operational("discount_analysis")
	return get_discount_analysis(**kwargs)


@frappe.whitelist()
def get_void_analysis_api(**kwargs):
	_require_report_access()
	require_feature_operational("void_analysis")
	return get_void_analysis(**kwargs)


@frappe.whitelist()
def get_activity_timeline_api(limit=50, reference_doctype=None):
	_require_report_access()
	require_feature_operational("activity_timeline")
	return get_activity_timeline(limit=limit, reference_doctype=reference_doctype)


@frappe.whitelist()
def get_expired_items_api(days_ahead=14):
	_require_report_access()
	require_feature_operational("expired_monitoring")
	return get_expired_monitoring(days_ahead=days_ahead)


@frappe.whitelist()
def get_stock_forecast_api(**kwargs):
	_require_report_access()
	require_feature_operational("stock_forecast")
	return get_stock_forecast(**kwargs)


@frappe.whitelist()
def create_spoilage_api(item_code, qty, warehouse=None, reason=None):
	_require_ops_access()
	require_feature_operational("spoilage_management")
	return {"stock_entry": create_spoilage_entry(item_code, qty, warehouse, reason)}


@frappe.whitelist()
def get_central_inventory_api(company=None):
	_require_ops_access()
	require_feature_operational("central_inventory")
	return get_central_inventory_summary(company)


@frappe.whitelist()
def create_central_purchase_request_api(items, company=None):
	_require_ops_access()
	require_feature_operational("central_purchasing")
	return {"material_request": create_central_purchase_request(items, company)}


@frappe.whitelist()
def get_recipe_substitutes(bom=None, item_code=None):
	_require_ops_access()
	require_feature_operational("ingredient_substitution")
	return get_bom_substitutes(bom_name=bom, item_code=item_code)


@frappe.whitelist()
def preview_birthday_promo(customer, subtotal):
	from imogi_pos.api.cashier import _require_cashier_access

	_require_cashier_access()
	require_feature_operational("birthday_promo")
	return {"discount_amount": apply_birthday_promo(customer, subtotal)}


@frappe.whitelist()
def preview_cashback(grand_total):
	from imogi_pos.api.cashier import _require_cashier_access

	_require_cashier_access()
	require_feature_operational("cashback")
	return {"cashback_amount": apply_cashback_amount(grand_total)}
