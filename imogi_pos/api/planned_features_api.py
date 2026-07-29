# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import cint, flt, get_datetime, now_datetime, today

from imogi_pos.api.reports_api import _require_report_access
from imogi_pos.imogi_pos.utils.feature_gating import require_feature_doctype_access, require_feature_operational
from imogi_pos.imogi_pos.utils.flow import get_settings
from imogi_pos.imogi_pos.utils.table_service import (
	cancel_table_reservation,
	mark_table_reserved,
	seat_table_reservation,
	seat_waiting_guest_on_table,
	validate_table_assignable,
)
from imogi_pos.imogi_pos.utils.planned_features import (
	apply_birthday_promo,
	apply_cashback_amount,
	create_central_purchase_request,
	get_activity_timeline,
	get_bom_substitutes,
	get_central_inventory_summary,
	get_customer_visit_report,
	get_discount_analysis,
	get_expired_monitoring,
	get_food_cost_report,
	get_kitchen_performance_detail,
	get_kitchen_performance_report,
	get_stock_forecast,
	get_table_turnover_report,
	get_tax_report,
	get_void_analysis,
	get_waste_report,
	list_combo_packages,
	merge_restaurant_orders,
)


def _require_ops_access():
	if frappe.session.user == "Guest":
		frappe.throw(_("Not permitted"), frappe.PermissionError)
	if not (
		frappe.has_permission("IMOGI Restaurant Table", "read")
		or frappe.has_permission("Riwayat Order", "read")
	):
		frappe.throw(_("Not permitted"), frappe.PermissionError)


@frappe.whitelist()
def merge_tables(primary_order, secondary_order):
	_require_ops_access()
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
			"notes",
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
	if restaurant_table:
		validate_table_assignable(restaurant_table, allow_reserved=True)
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
	doc.insert()
	if restaurant_table:
		mark_table_reserved(restaurant_table)
	frappe.db.commit()
	return {"name": doc.name}


@frappe.whitelist()
def cancel_table_reservation_api(name, status="Cancelled"):
	_require_ops_access()
	require_feature_operational("table_reservation")
	if not frappe.db.exists("IMOGI POS Table Reservation", name):
		frappe.throw(_("Reservasi tidak ditemukan"))
	frappe.get_doc("IMOGI POS Table Reservation", name).check_permission("write")
	cancel_table_reservation(name, status=status)
	frappe.db.commit()
	return {"name": name, "status": status}


@frappe.whitelist()
def seat_table_reservation_api(name):
	_require_ops_access()
	require_feature_operational("table_reservation")
	doc = frappe.get_doc("IMOGI POS Table Reservation", name)
	doc.check_permission("write")
	result = seat_table_reservation(name)
	frappe.db.commit()
	return result


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
	doc.insert()
	frappe.db.commit()
	return {"name": doc.name, "queue_position": frappe.db.count("IMOGI POS Waiting List", {"status": "Waiting"})}


@frappe.whitelist()
def seat_waiting_guest(name, restaurant_table=None):
	_require_ops_access()
	require_feature_operational("waiting_list")
	doc = frappe.get_doc("IMOGI POS Waiting List", name)
	doc.check_permission("write")
	seat_waiting_guest_on_table(name, restaurant_table=restaurant_table)
	frappe.db.commit()
	return {"name": name, "status": "Seated", "restaurant_table": restaurant_table}


@frappe.whitelist()
def cancel_waiting_guest(name):
	_require_ops_access()
	require_feature_operational("waiting_list")
	doc = frappe.get_doc("IMOGI POS Waiting List", name)
	doc.check_permission("write")
	if doc.status != "Waiting":
		frappe.throw(_("Tamu sudah tidak dalam antrian"))
	doc.db_set("status", "Cancelled")
	frappe.db.commit()
	return {"name": name, "status": "Cancelled"}


@frappe.whitelist()
def get_combos(company=None):
	from imogi_pos.api.cashier import _require_cashier_access

	_require_cashier_access()
	require_feature_operational("combo_package")
	return {"combos": list_combo_packages(company)}


@frappe.whitelist()
def get_combo_items(combo_name):
	from imogi_pos.api.cashier import _require_cashier_access
	from imogi_pos.imogi_pos.utils.planned_features import expand_combo_for_cart

	_require_cashier_access()
	require_feature_operational("combo_package")
	return expand_combo_for_cart(combo_name)


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
def get_tax_report_api(**kwargs):
	_require_report_access()
	require_feature_operational("tax_report")
	return get_tax_report(**kwargs)


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
def get_kitchen_performance_detail_api(**kwargs):
	_require_report_access()
	require_feature_operational("kitchen_performance")
	return get_kitchen_performance_detail(**kwargs)


@frappe.whitelist()
def export_kitchen_performance_excel(
	date_from=None,
	date_to=None,
	station_type=None,
	status=None,
	limit=500,
):
	"""Download Kitchen Performance detail as Excel (.xlsx)."""
	_require_report_access()
	require_feature_operational("kitchen_performance")

	from frappe.utils import format_datetime, today
	from frappe.utils.xlsxutils import make_xlsx

	payload = get_kitchen_performance_detail(
		date_from=date_from,
		date_to=date_to,
		station_type=station_type or None,
		status=status or None,
		limit=limit,
	)
	rows = payload.get("rows") or []

	status_labels = {
		"Done": _("Selesai"),
		"Ready": _("Siap"),
		"Preparing": _("Dimasak"),
		"Pending": _("Antrian"),
	}

	headers = [
		_("No Order"),
		_("Menu"),
		_("Qty"),
		_("Stasiun"),
		_("Tipe Stasiun"),
		_("Mulai"),
		_("Selesai"),
		_("Total Waktu (menit)"),
		_("Status"),
		_("Meja"),
		_("Kitchen Order"),
	]
	data_rows = []
	for row in rows:
		started = row.get("started_at")
		finished = row.get("finished_at")
		data_rows.append(
			[
				row.get("order_no") or "",
				row.get("item_name") or row.get("menu_text") or "",
				row.get("qty") if row.get("qty") is not None else "",
				row.get("station_label") or "",
				row.get("station_type") or "",
				format_datetime(started, "yyyy-MM-dd HH:mm") if started else "",
				format_datetime(finished, "yyyy-MM-dd HH:mm") if finished else "",
				row.get("duration_minutes") if row.get("duration_minutes") is not None else "",
				status_labels.get(row.get("status"), row.get("status") or ""),
				row.get("table_number") or "",
				row.get("kitchen_order") or "",
			]
		)

	date_tag = f"{payload.get('date_from') or today()}_{payload.get('date_to') or today()}"
	filename = f"kitchen-performance-{date_tag}"
	xlsx_file = make_xlsx([headers, *data_rows], "Kitchen Performance")
	frappe.response["filename"] = f"{filename}.xlsx"
	frappe.response["filecontent"] = xlsx_file.getvalue()
	frappe.response["type"] = "binary"



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
def create_spoilage_api(item_code, qty, warehouse=None, reason=None, file_urls=None):
	from imogi_pos.imogi_pos.utils.inventory_hub import create_waste_or_spoilage

	_require_ops_access()
	require_feature_operational("spoilage_management")
	return create_waste_or_spoilage(
		item_code,
		qty,
		warehouse=warehouse,
		reason=reason,
		kind="spoilage",
		file_urls=file_urls,
	)


@frappe.whitelist()
def get_central_inventory_api(company=None):
	_require_ops_access()
	require_feature_doctype_access("central_inventory")
	return get_central_inventory_summary(company)


@frappe.whitelist()
def create_central_purchase_request_api(items, company=None):
	_require_ops_access()
	require_feature_doctype_access("central_purchasing")
	return {"material_request": create_central_purchase_request(items, company)}


def _require_multi_outlet_access():
	if frappe.session.user == "Guest":
		frappe.throw(_("Not permitted"), frappe.PermissionError)
	if not (
		frappe.has_permission("IMOGI Branch", "read")
		or frappe.has_permission("Material Request", "read")
	):
		frappe.throw(_("Tidak punya akses multi-outlet"), frappe.PermissionError)


@frappe.whitelist()
def get_multi_outlet_summary_api():
	from imogi_pos.imogi_pos.utils.multi_outlet_hub import get_multi_outlet_summary

	_require_multi_outlet_access()
	require_feature_operational("multi_outlet")
	return get_multi_outlet_summary()


@frappe.whitelist()
def list_outlet_branches_api(search=None, limit=50):
	from imogi_pos.imogi_pos.utils.multi_outlet_hub import list_outlet_branches

	_require_multi_outlet_access()
	require_feature_operational("multi_outlet")
	return list_outlet_branches(search=search, limit=limit)


@frappe.whitelist()
def get_outlet_inventory_api(search=None, company=None):
	from imogi_pos.imogi_pos.utils.multi_outlet_hub import get_outlet_inventory

	_require_multi_outlet_access()
	require_feature_operational("central_inventory")
	return get_outlet_inventory(search=search)


@frappe.whitelist()
def list_central_purchase_api(search=None, limit=50):
	from imogi_pos.imogi_pos.utils.multi_outlet_hub import list_central_purchase_requests

	_require_multi_outlet_access()
	require_feature_operational("central_purchasing")
	return list_central_purchase_requests(search=search, limit=limit)


@frappe.whitelist()
def create_outlet_purchase_api(item_code, qty, warehouse=None, branch_code=None, company=None):
	from imogi_pos.imogi_pos.utils.multi_outlet_hub import create_outlet_purchase_request

	_require_multi_outlet_access()
	require_feature_operational("central_purchasing")
	return create_outlet_purchase_request(
		item_code=item_code,
		qty=qty,
		warehouse=warehouse,
		branch_code=branch_code,
		company=company,
	)


@frappe.whitelist()
def list_outlet_transfers_api(limit=30):
	from imogi_pos.imogi_pos.utils.multi_outlet_hub import list_recent_transfers

	_require_multi_outlet_access()
	require_feature_operational("central_inventory")
	return list_recent_transfers(limit=limit)


@frappe.whitelist()
def get_recipe_substitutes(bom=None, item_code=None):
	_require_recipe_access()
	require_feature_operational("ingredient_substitution")
	return get_bom_substitutes(bom_name=bom, item_code=item_code)


def _require_recipe_access():
	if frappe.session.user == "Guest":
		frappe.throw(_("Not permitted"), frappe.PermissionError)
	if not frappe.has_permission("BOM", "read"):
		frappe.throw(_("Tidak punya akses resep / BOM"), frappe.PermissionError)


@frappe.whitelist()
def get_recipe_hub_api(tab=None, search=None, bom=None):
	from imogi_pos.imogi_pos.utils.recipe_hub import get_recipe_hub

	_require_recipe_access()
	require_feature_operational("recipe_management")
	return get_recipe_hub(tab=tab, search=search, bom=bom)


@frappe.whitelist()
def list_recipes_api(search=None, only_default=0, limit=200):
	from imogi_pos.imogi_pos.utils.recipe_hub import list_recipes

	_require_recipe_access()
	require_feature_operational("recipe_management")
	return list_recipes(search=search, only_default=only_default, limit=limit)


@frappe.whitelist()
def get_recipe_detail_api(bom):
	from imogi_pos.imogi_pos.utils.recipe_hub import get_recipe_detail

	_require_recipe_access()
	require_feature_operational("recipe_management")
	return get_recipe_detail(bom)


@frappe.whitelist()
def update_recipe_portion_api(bom, portion_qty):
	from imogi_pos.imogi_pos.utils.recipe_hub import update_recipe_portion

	_require_recipe_access()
	require_feature_operational("portion_control")
	return update_recipe_portion(bom, portion_qty)


@frappe.whitelist()
def submit_recipes_api(bom_names):
	from imogi_pos.imogi_pos.utils.recipe_hub import submit_recipes

	_require_recipe_access()
	require_feature_operational("recipe_management")
	return submit_recipes(bom_names)


@frappe.whitelist()
def get_recipe_food_cost_api(date_from=None, date_to=None):
	from imogi_pos.imogi_pos.utils.recipe_hub import get_recipe_food_cost

	_require_recipe_access()
	require_feature_operational("food_costing")
	return get_recipe_food_cost(date_from=date_from, date_to=date_to)


@frappe.whitelist()
def list_ingredient_substitutes_api(search=None, limit=200):
	from imogi_pos.imogi_pos.utils.recipe_hub import list_ingredient_substitutes

	_require_recipe_access()
	require_feature_operational("ingredient_substitution")
	return list_ingredient_substitutes(search=search, limit=limit)


@frappe.whitelist()
def upsert_ingredient_substitute_api(item_code, alternative_item_code, two_way=1):
	from imogi_pos.imogi_pos.utils.recipe_hub import upsert_ingredient_substitute

	_require_recipe_access()
	require_feature_operational("ingredient_substitution")
	return upsert_ingredient_substitute(item_code, alternative_item_code, two_way=two_way)


@frappe.whitelist()
def delete_ingredient_substitute_api(name):
	from imogi_pos.imogi_pos.utils.recipe_hub import delete_ingredient_substitute

	_require_recipe_access()
	require_feature_operational("ingredient_substitution")
	return delete_ingredient_substitute(name)


@frappe.whitelist()
def get_recipe_versions_api(bom=None, limit=50):
	from imogi_pos.imogi_pos.utils.recipe_hub import get_recipe_versions

	_require_recipe_access()
	require_feature_operational("recipe_versioning")
	return get_recipe_versions(bom_name=bom, limit=limit)


def _require_inventory_access():
	if frappe.session.user == "Guest":
		frappe.throw(_("Not permitted"), frappe.PermissionError)
	if not frappe.has_permission("Item", "read"):
		frappe.throw(_("Tidak punya akses inventori"), frappe.PermissionError)


@frappe.whitelist()
def list_inventory_stock_api(search=None, warehouse=None, only_low=0, limit=300):
	from imogi_pos.imogi_pos.utils.inventory_hub import list_stock_items

	_require_inventory_access()
	require_feature_operational("stock_raw")
	return list_stock_items(search=search, warehouse=warehouse, only_low=only_low, limit=limit)


@frappe.whitelist()
def get_inventory_stock_summary_api(from_date=None, to_date=None, warehouse=None, search=None, limit=500):
	from imogi_pos.imogi_pos.utils.inventory_hub import get_stock_summary

	_require_inventory_access()
	require_feature_operational("stock_raw")
	return get_stock_summary(from_date=from_date, to_date=to_date, warehouse=warehouse, search=search, limit=limit)


@frappe.whitelist()
def list_inventory_issues_api(limit=50, waste_only=1):
	from imogi_pos.imogi_pos.utils.inventory_hub import list_recent_issues

	_require_inventory_access()
	require_feature_operational("waste_management")
	return list_recent_issues(limit=limit, waste_only=waste_only)


@frappe.whitelist()
def create_inventory_waste_api(item_code, qty, warehouse=None, reason=None, kind="waste", file_urls=None):
	from imogi_pos.imogi_pos.utils.inventory_hub import create_waste_or_spoilage

	_require_inventory_access()
	feature = "spoilage_management" if (kind or "").lower() == "spoilage" else "waste_management"
	require_feature_operational(feature)
	return create_waste_or_spoilage(
		item_code, qty, warehouse=warehouse, reason=reason, kind=kind, file_urls=file_urls
	)


@frappe.whitelist()
def approve_inventory_waste_api(request_name, pin=None):
	from imogi_pos.imogi_pos.utils.approval import approve_request

	_require_inventory_access()
	doc = frappe.db.get_value(
		"IMOGI POS Approval Request",
		request_name,
		["approval_type", "status"],
		as_dict=True,
	)
	if not doc or doc.approval_type not in ("Waste", "Spoilage"):
		frappe.throw(_("Bukan pengajuan Waste/Spoilage"))
	result = approve_request(request_name, pin)
	return result


@frappe.whitelist()
def reject_inventory_waste_api(request_name, pin=None, reason=None):
	from imogi_pos.imogi_pos.utils.approval import reject_request

	_require_inventory_access()
	doc = frappe.db.get_value(
		"IMOGI POS Approval Request",
		request_name,
		["approval_type", "status"],
		as_dict=True,
	)
	if not doc or doc.approval_type not in ("Waste", "Spoilage"):
		frappe.throw(_("Bukan pengajuan Waste/Spoilage"))
	return reject_request(request_name, pin=pin, reason=reason)


@frappe.whitelist()
def create_inventory_adjustment_api(item_code, qty_fisik, warehouse=None, reason=None):
	from imogi_pos.imogi_pos.utils.inventory_hub import create_stock_adjustment

	_require_inventory_access()
	require_feature_operational("stock_adjustment")
	return create_stock_adjustment(item_code, qty_fisik, warehouse=warehouse, reason=reason)


@frappe.whitelist()
def list_inventory_stock_ledger_api(item_code, warehouse=None, limit=100):
	from imogi_pos.imogi_pos.utils.inventory_hub import list_item_stock_ledger

	_require_inventory_access()
	require_feature_operational("stock_adjustment")
	return list_item_stock_ledger(item_code=item_code, warehouse=warehouse, limit=limit)


@frappe.whitelist()
def export_inventory_stock_ledger_excel(item_code, warehouse=None):
	"""Download riwayat mutasi stok (History) satu item sebagai Excel (.xlsx),
	dilengkapi ringkasan Summary Stock (Saldo Awal/In/Out/Adjustment/Saldo
	Akhir) untuk item yang sama pada bulan berjalan."""
	from imogi_pos.imogi_pos.utils.inventory_hub import list_item_stock_ledger, get_item_stock_summary

	_require_inventory_access()
	require_feature_operational("stock_adjustment")
	data = list_item_stock_ledger(item_code=item_code, warehouse=warehouse, limit=1000)
	rows = data.get("rows") or []
	headers = [
		_("Dokumen"),
		_("Tipe"),
		_("Tanggal"),
		_("From"),
		_("To"),
		_("Qty"),
		_("Saldo"),
		_("User"),
		_("Keterangan"),
	]
	data_rows = [
		[
			r.get("name") or "",
			r.get("voucher_type") or "",
			str(r.get("posting_date") or ""),
			r.get("from_warehouse") or "",
			r.get("to_warehouse") or "",
			flt(r.get("qty")),
			flt(r.get("balance_after")),
			r.get("owner_name") or r.get("owner") or "",
			r.get("remarks") or "",
		]
		for r in rows
	]
	# Ringkasan Summary Stock buat item yang sama, ditaruh di bawah tabel —
	# posisinya sejalur dengan kolom Saldo, sama seperti baris total sebelumnya,
	# cuma sekarang lengkap Saldo Awal/In/Out/Adjustment-nya juga.
	if rows:
		summary = get_item_stock_summary(item_code, warehouse=warehouse)
		data_rows.append(["", "", "", "", "", "", "", "", ""])
		data_rows.append(
			["", "", "", "", _("RINGKASAN ({0} s/d {1})").format(summary["from_date"], summary["to_date"]), "", "", "", ""]
		)
		data_rows.append(["", "", "", "", _("Saldo Awal"), "", summary["opening"], "", ""])
		data_rows.append(["", "", "", "", _("Total In"), "", summary["total_in"], "", ""])
		data_rows.append(["", "", "", "", _("Total Out"), "", summary["total_out"], "", ""])
		data_rows.append(["", "", "", "", _("Adjustment"), "", summary["adjustment"], "", ""])
		data_rows.append(["", "", "", "", _("Saldo Akhir"), "", summary["closing"], "", ""])
	item_label = (data.get("item_code") or item_code or "item").replace(" ", "-")
	_xlsx_response(headers, data_rows, "Riwayat Stok", f"stock-ledger-{item_label}-{today()}")


@frappe.whitelist()
def list_inventory_adjustment_requests_api(limit=100):
	from imogi_pos.imogi_pos.utils.inventory_hub import list_adjustment_requests

	_require_inventory_access()
	require_feature_operational("stock_adjustment")
	return list_adjustment_requests(limit=limit)


@frappe.whitelist()
def approve_inventory_adjustment_api(request_name, pin=None):
	from imogi_pos.imogi_pos.utils.approval import approve_request

	_require_inventory_access()
	doc = frappe.db.get_value(
		"IMOGI POS Approval Request",
		request_name,
		["approval_type", "status"],
		as_dict=True,
	)
	if not doc or doc.approval_type != "Adjustment":
		frappe.throw(_("Bukan pengajuan Adjustment"))
	return approve_request(request_name, pin)


@frappe.whitelist()
def reject_inventory_adjustment_api(request_name, pin=None, reason=None):
	from imogi_pos.imogi_pos.utils.approval import reject_request

	_require_inventory_access()
	doc = frappe.db.get_value(
		"IMOGI POS Approval Request",
		request_name,
		["approval_type", "status"],
		as_dict=True,
	)
	if not doc or doc.approval_type != "Adjustment":
		frappe.throw(_("Bukan pengajuan Adjustment"))
	return reject_request(request_name, pin=pin, reason=reason)


@frappe.whitelist()
def create_inventory_opname_api(items, warehouse=None, posting_date=None, file_urls=None):
	from imogi_pos.imogi_pos.utils.inventory_hub import create_opname

	_require_inventory_access()
	require_feature_operational("stock_opname")
	return create_opname(
		items=items, warehouse=warehouse, posting_date=posting_date, file_urls=file_urls
	)


@frappe.whitelist()
def list_inventory_opname_requests_api(limit=50):
	from imogi_pos.imogi_pos.utils.inventory_hub import list_opname_requests

	_require_inventory_access()
	require_feature_operational("stock_opname")
	return list_opname_requests(limit=limit)


@frappe.whitelist()
def approve_inventory_opname_api(request_name, pin=None):
	from imogi_pos.imogi_pos.utils.approval import approve_request

	_require_inventory_access()
	doc = frappe.db.get_value(
		"IMOGI POS Approval Request",
		request_name,
		["approval_type", "status"],
		as_dict=True,
	)
	if not doc or doc.approval_type != "Opname":
		frappe.throw(_("Bukan pengajuan Opname"))
	return approve_request(request_name, pin)


@frappe.whitelist()
def reject_inventory_opname_api(request_name, pin=None, reason=None):
	from imogi_pos.imogi_pos.utils.approval import reject_request

	_require_inventory_access()
	doc = frappe.db.get_value(
		"IMOGI POS Approval Request",
		request_name,
		["approval_type", "status"],
		as_dict=True,
	)
	if not doc or doc.approval_type != "Opname":
		frappe.throw(_("Bukan pengajuan Opname"))
	return reject_request(request_name, pin=pin, reason=reason)


@frappe.whitelist()
def list_inventory_batches_api(search=None, limit=100):
	from imogi_pos.imogi_pos.utils.inventory_hub import list_batches

	_require_inventory_access()
	require_feature_operational("batch_tracking")
	return list_batches(search=search, limit=limit)


@frappe.whitelist()
def get_inventory_forecast_api(days=14, warehouse=None):
	from imogi_pos.imogi_pos.utils.planned_features import get_stock_forecast

	_require_inventory_access()
	require_feature_operational("stock_forecast")
	return get_stock_forecast(days=days, warehouse=warehouse)


def _xlsx_response(headers, data_rows, sheet_name, filename):
	from frappe.utils.xlsxutils import make_xlsx

	xlsx_file = make_xlsx([headers, *data_rows], sheet_name)
	frappe.response["filename"] = f"{filename}.xlsx"
	frappe.response["filecontent"] = xlsx_file.getvalue()
	frappe.response["type"] = "binary"


@frappe.whitelist()
def export_inventory_stock_excel(search=None, warehouse=None, only_low=0):
	"""Download Bahan & Stok (tab Stok) as Excel (.xlsx)."""
	from imogi_pos.imogi_pos.utils.inventory_hub import list_stock_items

	_require_inventory_access()
	require_feature_operational("stock_raw")
	data = list_stock_items(search=search, warehouse=warehouse, only_low=only_low, limit=1000)
	headers = [
		_("Kode Item"),
		_("Nama Bahan"),
		_("UOM"),
		_("Qty On Hand"),
		_("Nilai Stok"),
		_("Status"),
		_("User Terakhir Adjust"),
	]
	data_rows = [
		[
			r.get("item_code") or "",
			r.get("item_name") or "",
			r.get("uom") or "",
			flt(r.get("qty")),
			flt(r.get("stock_value")),
			_("Low") if cint(r.get("is_low")) else _("OK"),
			r.get("last_adj_user") or "",
		]
		for r in (data.get("rows") or [])
	]
	_xlsx_response(headers, data_rows, "Bahan & Stok", f"inventory-stock-{today()}")


@frappe.whitelist()
def export_inventory_stock_summary_excel(from_date=None, to_date=None, warehouse=None, search=None):
	"""Download Summary Stock (Opening/In/Out/Adjustment/Closing per periode) as Excel (.xlsx)."""
	from imogi_pos.imogi_pos.utils.inventory_hub import get_stock_summary

	_require_inventory_access()
	require_feature_operational("stock_raw")
	data = get_stock_summary(from_date=from_date, to_date=to_date, warehouse=warehouse, search=search, limit=2000)
	rows = data.get("rows") or []
	headers = [
		_("Produk"),
		_("Gudang"),
		_("Saldo Awal"),
		_("Total In"),
		_("Total Out"),
		_("Adjustment"),
		_("Saldo Akhir"),
	]
	data_rows = [
		[
			r.get("item_name") or "",
			r.get("warehouse") or "",
			flt(r.get("opening")),
			flt(r.get("total_in")),
			flt(r.get("total_out")),
			flt(r.get("adjustment")),
			flt(r.get("closing")),
		]
		for r in rows
	]
	if rows:
		total_opening = sum(flt(r.get("opening")) for r in rows)
		total_in = sum(flt(r.get("total_in")) for r in rows)
		total_out = sum(flt(r.get("total_out")) for r in rows)
		total_adjustment = sum(flt(r.get("adjustment")) for r in rows)
		total_closing = sum(flt(r.get("closing")) for r in rows)
		data_rows.append(["", "", "", "", "", "", ""])
		data_rows.append(
			[_("TOTAL"), "", total_opening, total_in, total_out, total_adjustment, total_closing]
		)
	period_label = f"{data.get('from_date')}_to_{data.get('to_date')}"
	_xlsx_response(headers, data_rows, "Summary Stock", f"stock-summary-{period_label}")


@frappe.whitelist()
def export_inventory_waste_excel(limit=200, waste_only=1):
	"""Download Riwayat Waste & Spoilage (tab Waste) as Excel (.xlsx)."""
	from imogi_pos.imogi_pos.utils.inventory_hub import list_recent_issues

	_require_inventory_access()
	require_feature_operational("waste_management")
	data = list_recent_issues(limit=limit, waste_only=waste_only)
	headers = [
		_("Dokumen"),
		_("Status"),
		_("Jenis"),
		_("Waktu"),
		_("Kode Item"),
		_("Nama Item"),
		_("Qty"),
		_("UOM"),
		_("Nilai"),
		_("Keterangan"),
	]
	data_rows = []
	for row in data.get("rows") or []:
		items = row.get("items") or [{}]
		for item in items:
			data_rows.append(
				[
					row.get("stock_entry") or row.get("name") or "",
					row.get("status") or "",
					row.get("kind") or "",
					str(row.get("posting_date") or row.get("creation") or ""),
					item.get("item_code") or "",
					item.get("item_name") or "",
					flt(item.get("qty")),
					item.get("uom") or "",
					flt(row.get("total_value")),
					row.get("remarks") or "",
				]
			)
	_xlsx_response(headers, data_rows, "Waste & Spoilage", f"inventory-waste-{today()}")


@frappe.whitelist()
def export_inventory_batch_excel(search=None, limit=500):
	"""Download Batch & Expired Monitoring (tab Batch) as Excel (.xlsx)."""
	from imogi_pos.imogi_pos.utils.inventory_hub import list_batches

	_require_inventory_access()
	require_feature_operational("batch_tracking")
	data = list_batches(search=search, limit=limit)
	headers = [
		_("Batch ID"),
		_("Item"),
		_("Qty"),
		_("Expiry Date"),
		_("Sisa Hari"),
		_("Status"),
	]
	data_rows = [
		[
			r.get("batch_id") or r.get("name") or "",
			r.get("item") or "",
			flt(r.get("batch_qty")),
			r.get("expiry_date") or "",
			r.get("days_left") if r.get("days_left") is not None else "",
			_("Expired") if r.get("is_expired") else (_("Segera") if r.get("is_expiring_soon") else _("OK")),
		]
		for r in (data.get("rows") or [])
	]
	_xlsx_response(headers, data_rows, "Batch & Expired", f"inventory-batch-{today()}")


@frappe.whitelist()
def export_inventory_opname_excel(limit=200):
	"""Download Riwayat Opname (tab Opname) as Excel (.xlsx)."""
	from imogi_pos.imogi_pos.utils.inventory_hub import list_opname_requests

	_require_inventory_access()
	require_feature_operational("stock_opname")
	data = list_opname_requests(limit=limit)
	headers = [
		_("Dokumen"),
		_("Status"),
		_("Waktu"),
		_("Kode Item"),
		_("Nama Item"),
		_("Qty Fisik"),
		_("Qty Sistem"),
		_("Selisih"),
		_("Diajukan Oleh"),
	]
	data_rows = []
	for row in data.get("rows") or []:
		items = row.get("items") or [{}]
		doc_name = row.get("stock_reconciliation") or row.get("name") or ""
		for item in items:
			data_rows.append(
				[
					doc_name,
					row.get("status") or "",
					str(row.get("posting_date") or row.get("creation") or ""),
					item.get("item_code") or "",
					item.get("item_name") or "",
					flt(item.get("qty")),
					flt(item.get("system_qty")),
					flt(item.get("diff")),
					row.get("owner_name") or "",
				]
			)
	_xlsx_response(headers, data_rows, "Riwayat Opname", f"inventory-opname-{today()}")


@frappe.whitelist()
def export_inventory_forecast_excel(days=14, warehouse=None):
	"""Download Stock Forecast (tab Forecast) as Excel (.xlsx)."""
	from imogi_pos.imogi_pos.utils.planned_features import get_stock_forecast

	_require_inventory_access()
	require_feature_operational("stock_forecast")
	data = get_stock_forecast(days=days, warehouse=warehouse)
	headers = [
		_("Kode Item"),
		_("On Hand"),
		_("Avg / Hari"),
		_("Sisa Hari"),
		_("Kebutuhan Bulan Depan ({0})").format(data.get("next_month_label") or ""),
		_("Rekomendasi Restock"),
	]
	data_rows = [
		[
			r.get("item_code") or "",
			flt(r.get("on_hand")),
			round(flt(r.get("avg_daily_use")), 3),
			round(flt(r.get("days_remaining")), 1),
			round(flt(r.get("next_month_need")), 2),
			round(flt(r.get("restock_recommendation")), 2),
		]
		for r in (data.get("rows") or [])
	]
	_xlsx_response(headers, data_rows, "Stock Forecast", f"inventory-forecast-{today()}")


def _require_purchasing_access():
	if frappe.session.user == "Guest":
		frappe.throw(_("Not permitted"), frappe.PermissionError)
	if not (
		frappe.has_permission("Supplier", "read")
		or frappe.has_permission("Purchase Order", "read")
		or frappe.has_permission("Material Request", "read")
	):
		frappe.throw(_("Tidak punya akses purchasing"), frappe.PermissionError)


@frappe.whitelist()
def get_purchasing_summary_api():
	from imogi_pos.imogi_pos.utils.purchasing_hub import get_purchasing_summary

	_require_purchasing_access()
	require_feature_operational("supplier")
	return get_purchasing_summary()


@frappe.whitelist()
def list_purchasing_suppliers_api(search=None, limit=100):
	from imogi_pos.imogi_pos.utils.purchasing_hub import list_suppliers

	_require_purchasing_access()
	require_feature_operational("supplier")
	return list_suppliers(search=search, limit=limit)


@frappe.whitelist()
def create_purchasing_supplier_api(
	supplier_name, supplier_group=None, supplier_type=None, tax_id=None, payment_terms=None
):
	from imogi_pos.imogi_pos.utils.purchasing_hub import create_supplier

	_require_purchasing_access()
	require_feature_operational("supplier")
	return create_supplier(
		supplier_name,
		supplier_group=supplier_group,
		supplier_type=supplier_type,
		tax_id=tax_id,
		payment_terms=payment_terms,
	)


@frappe.whitelist()
def list_purchasing_requests_api(search=None, limit=50):
	from imogi_pos.imogi_pos.utils.purchasing_hub import list_purchase_requests

	_require_purchasing_access()
	require_feature_operational("purchase_request")
	return list_purchase_requests(search=search, limit=limit)


@frappe.whitelist()
def create_purchasing_request_api(items, warehouse=None, schedule_date=None, supplier=None):
	from imogi_pos.imogi_pos.utils.purchasing_hub import create_purchase_request

	_require_purchasing_access()
	require_feature_operational("purchase_request")
	return create_purchase_request(items, warehouse=warehouse, schedule_date=schedule_date, supplier=supplier)


@frappe.whitelist()
def get_purchasing_request_detail_api(name):
	from imogi_pos.imogi_pos.utils.purchasing_hub import get_purchase_request_detail

	_require_purchasing_access()
	require_feature_operational("purchase_request")
	return get_purchase_request_detail(name)


@frappe.whitelist()
def submit_purchasing_request_api(name):
	from imogi_pos.imogi_pos.utils.purchasing_hub import submit_purchase_request

	_require_purchasing_access()
	require_feature_operational("purchase_request")
	return submit_purchase_request(name)


@frappe.whitelist()
def list_purchasing_orders_api(search=None, limit=50):
	from imogi_pos.imogi_pos.utils.purchasing_hub import list_purchase_orders

	_require_purchasing_access()
	require_feature_operational("purchase_order")
	return list_purchase_orders(search=search, limit=limit)


@frappe.whitelist()
def create_purchasing_order_api(supplier, items, warehouse=None, schedule_date=None):
	from imogi_pos.imogi_pos.utils.purchasing_hub import create_purchase_order

	_require_purchasing_access()
	require_feature_operational("purchase_order")
	return create_purchase_order(supplier, items, warehouse=warehouse, schedule_date=schedule_date)


@frappe.whitelist()
def create_purchasing_order_from_request_api(purchase_request, supplier):
	from imogi_pos.imogi_pos.utils.purchasing_hub import create_purchase_order_from_request

	_require_purchasing_access()
	require_feature_operational("purchase_order")
	return create_purchase_order_from_request(purchase_request, supplier)


@frappe.whitelist()
def submit_purchasing_order_api(name):
	from imogi_pos.imogi_pos.utils.purchasing_hub import submit_purchase_order

	_require_purchasing_access()
	require_feature_operational("purchase_order")
	return submit_purchase_order(name)


@frappe.whitelist()
def get_po_pending_approval_api(name):
	"""Pending IMOGI POS Approval Request info for a Purchase Order, so the
	Approve/Reject buttons on the PO form itself know which request + role to
	act on — gated the same way as the rest of purchasing, not raw DocPerm on
	IMOGI POS Approval Request (which only IMOGI Supervisor has by default;
	Manager/Owner approve via role escalation without needing that DocPerm)."""
	_require_purchasing_access()
	require_feature_operational("purchase_order")
	request_name, required_role, requested_by = frappe.db.get_value(
		"IMOGI POS Approval Request",
		{"approval_type": "Purchase Order", "reference_name": name, "status": "Pending"},
		["name", "required_role", "requested_by"],
		order_by="creation desc",
	) or (None, None, None)
	return {"request_name": request_name, "required_role": required_role, "requested_by": requested_by}


@frappe.whitelist()
def cancel_purchasing_order_request_api(name):
	from imogi_pos.imogi_pos.utils.approval import cancel_own_request

	_require_purchasing_access()
	require_feature_operational("purchase_order")
	request_name = frappe.db.get_value(
		"IMOGI POS Approval Request",
		{"approval_type": "Purchase Order", "reference_name": name, "status": "Pending"},
		"name",
		order_by="creation desc",
	)
	if not request_name:
		frappe.throw(_("Tidak ada pengajuan approval yang pending untuk PO ini"))
	return cancel_own_request(request_name)


@frappe.whitelist()
def approve_purchasing_order_api(request_name, pin=None):
	from imogi_pos.imogi_pos.utils.approval import approve_request

	_require_purchasing_access()
	require_feature_operational("purchase_order")
	doc = frappe.db.get_value(
		"IMOGI POS Approval Request", request_name, ["approval_type", "status"], as_dict=True
	)
	if not doc or doc.approval_type != "Purchase Order":
		frappe.throw(_("Bukan pengajuan Purchase Order"))
	return approve_request(request_name, pin)


@frappe.whitelist()
def reject_purchasing_order_api(request_name, pin=None, reason=None):
	from imogi_pos.imogi_pos.utils.approval import reject_request

	_require_purchasing_access()
	require_feature_operational("purchase_order")
	doc = frappe.db.get_value(
		"IMOGI POS Approval Request", request_name, ["approval_type", "status"], as_dict=True
	)
	if not doc or doc.approval_type != "Purchase Order":
		frappe.throw(_("Bukan pengajuan Purchase Order"))
	return reject_request(request_name, pin=pin, reason=reason)


@frappe.whitelist()
def list_purchasing_receipts_api(search=None, limit=50):
	from imogi_pos.imogi_pos.utils.purchasing_hub import list_purchase_receipts

	_require_purchasing_access()
	require_feature_operational("goods_receiving")
	return list_purchase_receipts(search=search, limit=limit)


@frappe.whitelist()
def get_purchasing_order_lines_api(purchase_order):
	from imogi_pos.imogi_pos.utils.purchasing_hub import get_purchase_order_receiving_lines

	_require_purchasing_access()
	require_feature_operational("goods_receiving")
	return get_purchase_order_receiving_lines(purchase_order)


@frappe.whitelist()
def create_purchasing_receipt_api(purchase_order, items=None):
	from imogi_pos.imogi_pos.utils.purchasing_hub import create_purchase_receipt_from_po

	_require_purchasing_access()
	require_feature_operational("goods_receiving")
	return create_purchase_receipt_from_po(purchase_order, items=items)


@frappe.whitelist()
def list_purchasing_receipts_for_billing_api(search=None, limit=50):
	from imogi_pos.imogi_pos.utils.purchasing_hub import list_receipts_for_billing

	_require_purchasing_access()
	require_feature_operational("goods_receiving")
	return list_receipts_for_billing(search=search, limit=limit)


@frappe.whitelist()
def create_purchasing_invoice_api(purchase_receipt):
	from imogi_pos.imogi_pos.utils.purchasing_hub import create_purchase_invoice_from_receipt

	_require_purchasing_access()
	require_feature_operational("goods_receiving")
	return create_purchase_invoice_from_receipt(purchase_receipt)


@frappe.whitelist()
def submit_purchasing_invoice_api(name):
	from imogi_pos.imogi_pos.utils.purchasing_hub import submit_purchase_invoice

	_require_purchasing_access()
	require_feature_operational("goods_receiving")
	return submit_purchase_invoice(name)


@frappe.whitelist()
def list_purchasing_invoices_api(search=None, limit=50):
	from imogi_pos.imogi_pos.utils.purchasing_hub import list_purchase_invoices

	_require_purchasing_access()
	require_feature_operational("goods_receiving")
	return list_purchase_invoices(search=search, limit=limit)


@frappe.whitelist()
def pay_purchasing_invoice_api(purchase_invoice):
	from imogi_pos.imogi_pos.utils.purchasing_hub import create_payment_for_invoice

	_require_purchasing_access()
	require_feature_operational("goods_receiving")
	return create_payment_for_invoice(purchase_invoice)


def _require_finance_access():
	if frappe.session.user == "Guest":
		frappe.throw(_("Not permitted"), frappe.PermissionError)
	if not (
		frappe.has_permission("Payment Entry", "read")
		or frappe.has_permission("Purchase Invoice", "read")
		or frappe.has_permission("Sales Invoice", "read")
		or frappe.has_permission("Account", "read")
	):
		frappe.throw(_("Tidak punya akses keuangan"), frappe.PermissionError)


@frappe.whitelist()
def get_finance_summary_api():
	from imogi_pos.imogi_pos.utils.finance_hub import get_finance_summary

	_require_finance_access()
	require_feature_operational("cash_bank")
	return get_finance_summary()


@frappe.whitelist()
def list_finance_cash_api(search=None, limit=50):
	from imogi_pos.imogi_pos.utils.finance_hub import list_cash_bank

	_require_finance_access()
	require_feature_operational("cash_bank")
	return list_cash_bank(search=search, limit=limit)


@frappe.whitelist()
def list_finance_payables_api(search=None, limit=50):
	from imogi_pos.imogi_pos.utils.finance_hub import list_payables

	_require_finance_access()
	require_feature_operational("supplier_payable")
	return list_payables(search=search, limit=limit)


@frappe.whitelist()
def list_finance_receivables_api(search=None, limit=50):
	from imogi_pos.imogi_pos.utils.finance_hub import list_receivables

	_require_finance_access()
	require_feature_operational("customer_receivable")
	return list_receivables(search=search, limit=limit)


@frappe.whitelist()
def get_finance_report_links_api():
	from imogi_pos.imogi_pos.utils.finance_hub import get_report_links

	_require_finance_access()
	require_feature_operational("profit_loss")
	return get_report_links()


@frappe.whitelist()
def list_finance_bank_mutasi_api(limit=20):
	from imogi_pos.imogi_pos.utils.finance_hub import get_bank_transaction_tree, list_bank_statement_imports

	_require_finance_access()
	require_feature_operational("cash_bank")
	return {
		"logs": list_bank_statement_imports(limit=cint(limit)),
		"tree": get_bank_transaction_tree(company=get_settings().default_company),
	}


@frappe.whitelist()
def get_accounting_bridge_api(limit=40):
	from imogi_pos.imogi_pos.utils.audit_hub import get_accounting_bridge

	_require_finance_access()
	require_feature_operational("accounting_integration")
	return get_accounting_bridge(limit=limit)


def _require_audit_access():
	if frappe.session.user == "Guest":
		frappe.throw(_("Not permitted"), frappe.PermissionError)
	if not (
		frappe.has_permission("Version", "read")
		or frappe.has_permission("Activity Log", "read")
		or frappe.has_permission("Riwayat Order", "read")
	):
		frappe.throw(_("Tidak punya akses audit"), frappe.PermissionError)


@frappe.whitelist()
def get_audit_summary_api():
	from imogi_pos.imogi_pos.utils.audit_hub import get_audit_summary

	_require_audit_access()
	require_feature_operational("audit_log")
	return get_audit_summary()


@frappe.whitelist()
def list_audit_versions_api(search=None, limit=50):
	from imogi_pos.imogi_pos.utils.audit_hub import list_audit_versions

	_require_audit_access()
	require_feature_operational("audit_log")
	return list_audit_versions(search=search, limit=limit)


@frappe.whitelist()
def list_audit_login_api(search=None, limit=50):
	from imogi_pos.imogi_pos.utils.audit_hub import list_login_history

	_require_audit_access()
	require_feature_operational("login_history")
	return list_login_history(search=search, limit=limit)


@frappe.whitelist()
def list_audit_timeline_api(search=None, limit=50):
	from imogi_pos.imogi_pos.utils.audit_hub import list_activity_timeline

	_require_audit_access()
	require_feature_operational("activity_timeline")
	return list_activity_timeline(search=search, limit=limit)


@frappe.whitelist()
def get_audit_discount_api(date_from=None, date_to=None, search=None):
	from imogi_pos.imogi_pos.utils.audit_hub import get_discount_analysis_hub

	_require_audit_access()
	require_feature_operational("discount_analysis")
	return get_discount_analysis_hub(date_from=date_from, date_to=date_to)


@frappe.whitelist()
def get_audit_void_api(date_from=None, date_to=None, search=None):
	from imogi_pos.imogi_pos.utils.audit_hub import get_void_analysis_hub

	_require_audit_access()
	require_feature_operational("void_analysis")
	return get_void_analysis_hub(date_from=date_from, date_to=date_to)


@frappe.whitelist()
def preview_birthday_promo(customer, subtotal, company=None):
	from imogi_pos.api.cashier import _require_cashier_access

	_require_cashier_access()
	require_feature_operational("birthday_promo")
	from imogi_pos.imogi_pos.utils.planned_features import apply_birthday_promo, get_birthday_promo_status
	from imogi_pos.imogi_pos.utils.flow import resolve_company

	company = resolve_company(company)
	status = get_birthday_promo_status(customer, company=company)
	return {
		**status,
		"discount_amount": apply_birthday_promo(customer, flt(subtotal), company=company),
	}


@frappe.whitelist()
def preview_cashback(grand_total):
	from imogi_pos.api.cashier import _require_cashier_access

	_require_cashier_access()
	require_feature_operational("cashback")
	return {"cashback_amount": apply_cashback_amount(grand_total)}
