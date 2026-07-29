# Copyright (c) 2026, Imogi and contributors
"""MVP implementations for features previously marked planned."""

from __future__ import annotations

import calendar

import frappe
from frappe import _
from frappe.utils import add_days, add_months, cint, flt, formatdate, get_datetime, getdate, now_datetime, today

from imogi_pos.imogi_pos.utils.flow import get_settings, release_restaurant_table, reserve_restaurant_table


def merge_restaurant_orders(primary_order: str, secondary_order: str) -> dict:
	"""Gabung item dari order sekunder ke order utama."""
	primary = frappe.get_doc("Riwayat Order", primary_order)
	secondary = frappe.get_doc("Riwayat Order", secondary_order)
	primary.check_permission("write")
	secondary.check_permission("write")

	for status in (primary.status, secondary.status):
		if status in ("Completed", "Cancelled", "Refunded"):
			frappe.throw(_("Order {0} sudah selesai — tidak bisa digabung").format(status))

	if primary.company != secondary.company:
		frappe.throw(_("Order harus satu perusahaan yang sama"))

	if primary.name == secondary.name:
		frappe.throw(_("Order tidak boleh digabung dengan dirinya sendiri"))

	moved = 0
	for row in secondary.items:
		primary.append(
			"items",
			{
				"item_code": row.item_code,
				"item_name": row.item_name,
				"qty": row.qty,
				"rate": row.rate,
				"amount": row.amount,
				"warehouse": row.warehouse,
				"uom": row.uom,
			},
		)
		moved += 1

	primary.flags.ignore_validate_update_after_submit = True
	primary.calculate_totals()
	primary.save(ignore_permissions=True)

	if secondary.restaurant_table:
		release_restaurant_table(secondary)

	if secondary.docstatus == 1:
		secondary.add_comment("Comment", _("Digabung ke order {0}").format(primary.name))
		secondary.flags.ignore_permissions = True
		secondary.cancel()
	else:
		secondary.db_set("status", "Cancelled")

	frappe.db.commit()
	return {"primary": primary.name, "merged_items": moved, "secondary": secondary.name}


def get_food_cost_report(date_from=None, date_to=None, company=None) -> dict:
	day_start = getdate(date_from) if date_from else add_days(getdate(today()), -30)
	day_end = add_days(getdate(date_to) if date_to else getdate(today()), 1)
	company = company or get_settings().default_company

	sales = frappe.db.sql(
		"""
		select coalesce(sum(oi.amount), 0) as sales
		from `tabIMOGI POS Order Item` oi
		inner join `tabRiwayat Order` o on o.name = oi.parent
		where o.status = 'Completed' and o.company = %(company)s
			and o.creation >= %(start)s and o.creation < %(end)s
		""",
		{"company": company, "start": day_start, "end": day_end},
		as_dict=True,
	)[0]

	cost = frappe.db.sql(
		"""
		select coalesce(sum(bi.amount * oi.qty / nullif(b.quantity, 0)), 0) as ingredient_cost
		from `tabIMOGI POS Order Item` oi
		inner join `tabRiwayat Order` o on o.name = oi.parent
		inner join `tabBOM` b on b.item = oi.item_code and b.is_default = 1 and b.docstatus = 1
		inner join `tabBOM Item` bi on bi.parent = b.name
		where o.status = 'Completed' and o.company = %(company)s
			and o.creation >= %(start)s and o.creation < %(end)s
		""",
		{"company": company, "start": day_start, "end": day_end},
		as_dict=True,
	)[0]

	sales_val = flt(sales.sales)
	cost_val = flt(cost.ingredient_cost)
	margin = sales_val - cost_val
	return {
		"sales": sales_val,
		"food_cost": cost_val,
		"margin": margin,
		"food_cost_percent": (cost_val / sales_val * 100) if sales_val else 0,
		"date_from": str(day_start),
		"date_to": str(add_days(day_end, -1)),
	}


def get_waste_report(date_from=None, date_to=None, company=None) -> dict:
	"""Laporan waste/spoilage dari Stock Entry Material Issue (Inventory Hub)."""
	day_start = getdate(date_from) if date_from else add_days(getdate(today()), -30)
	day_end = add_days(getdate(date_to) if date_to else getdate(today()), 1)
	company = company or get_settings().default_company

	rows = frappe.db.sql(
		"""
		select se.name, se.posting_date, sei.item_code, sei.item_name, sei.qty, sei.amount,
			sei.uom, se.remarks, se.total_outgoing_value
		from `tabStock Entry` se
		inner join `tabStock Entry Detail` sei on sei.parent = se.name
		where se.docstatus = 1
			and se.stock_entry_type = 'Material Issue'
			and se.company = %(company)s
			and se.posting_date >= %(start)s and se.posting_date < %(end)s
			and (
				lower(coalesce(se.remarks, '')) like '%%waste%%'
				or lower(coalesce(se.remarks, '')) like '%%spoil%%'
				or lower(coalesce(se.remarks, '')) like '%%rusak%%'
				or lower(coalesce(se.remarks, '')) like '%%busuk%%'
				or lower(coalesce(se.remarks, '')) like '%%kadaluarsa%%'
				or lower(coalesce(se.remarks, '')) like '%%expired%%'
			)
		order by se.posting_date desc, se.modified desc
		limit 200
		""",
		{"company": company, "start": day_start, "end": day_end},
		as_dict=True,
	)
	total_qty = sum(flt(r.qty) for r in rows)
	total_value = sum(flt(r.amount) for r in rows)
	waste_count = sum(1 for r in rows if "spoil" not in (r.remarks or "").lower())
	spoil_count = sum(1 for r in rows if "spoil" in (r.remarks or "").lower() or "busuk" in (r.remarks or "").lower())
	return {
		"rows": rows,
		"total_qty": total_qty,
		"total_value": total_value,
		"count": len(rows),
		"waste_lines": waste_count,
		"spoilage_lines": spoil_count,
		"date_from": str(day_start),
		"date_to": str(add_days(day_end, -1)),
		"hub_route": "inventory-hub/waste",
	}


def get_tax_report(date_from=None, date_to=None, company=None, pos_profile=None) -> dict:
	"""Ringkasan PPN dari Riwayat Order (kasir) — DPP + PPN per hari."""
	day_start = getdate(date_from) if date_from else add_days(getdate(today()), -30)
	day_end = add_days(getdate(date_to) if date_to else getdate(today()), 1)
	company = company or get_settings().default_company

	filters = {
		"company": company,
		"start": day_start,
		"end": day_end,
	}
	profile_clause = ""
	if pos_profile:
		profile_clause = " and pos_profile = %(pos_profile)s"
		filters["pos_profile"] = pos_profile

	daily = frappe.db.sql(
		f"""
		select date(creation) as posting_date,
			count(*) as order_count,
			coalesce(sum(taxable_amount), 0) as taxable_amount,
			coalesce(sum(tax_amount), 0) as tax_amount,
			coalesce(sum(grand_total), 0) as grand_total
		from `tabRiwayat Order`
		where status = 'Completed' and company = %(company)s
			and creation >= %(start)s and creation < %(end)s
			{profile_clause}
		group by date(creation)
		order by posting_date desc
		""",
		filters,
		as_dict=True,
	)
	orders = frappe.db.sql(
		f"""
		select name, creation, customer_name, taxable_amount, tax_amount, grand_total,
			payment_method, order_channel
		from `tabRiwayat Order`
		where status = 'Completed' and company = %(company)s
			and creation >= %(start)s and creation < %(end)s
			and coalesce(tax_amount, 0) > 0
			{profile_clause}
		order by creation desc
		limit 100
		""",
		filters,
		as_dict=True,
	)
	total_taxable = sum(flt(r.taxable_amount) for r in daily)
	total_tax = sum(flt(r.tax_amount) for r in daily)
	total_sales = sum(flt(r.grand_total) for r in daily)
	return {
		"rows": orders,
		"daily": daily,
		"order_count": sum(cint(r.order_count) for r in daily),
		"taxable_amount": total_taxable,
		"tax_amount": total_tax,
		"grand_total": total_sales,
		"count": len(orders),
		"date_from": str(day_start),
		"date_to": str(add_days(day_end, -1)),
		"erpnext_report": "Sales Register",
	}


def get_customer_visit_report(date_from=None, date_to=None, company=None) -> dict:
	day_start = getdate(date_from) if date_from else add_days(getdate(today()), -30)
	day_end = add_days(getdate(date_to) if date_to else getdate(today()), 1)
	company = company or get_settings().default_company

	rows = frappe.db.sql(
		"""
		select customer, customer_name,
			count(*) as visits,
			coalesce(sum(grand_total), 0) as spend,
			max(creation) as last_visit
		from `tabRiwayat Order`
		where status = 'Completed' and company = %(company)s
			and customer is not null and customer != ''
			and creation >= %(start)s and creation < %(end)s
		group by customer, customer_name
		order by visits desc, spend desc
		limit 50
		""",
		{"company": company, "start": day_start, "end": day_end},
		as_dict=True,
	)
	total_visits = sum(cint(r.visits) for r in rows)
	total_spend = sum(flt(r.spend) for r in rows)
	return {
		"rows": rows,
		"count": len(rows),
		"unique_customers": len(rows),
		"total_visits": total_visits,
		"total_spend": total_spend,
		"avg_spend_per_visit": (total_spend / total_visits) if total_visits else 0,
		"date_from": str(day_start),
		"date_to": str(add_days(day_end, -1)),
	}


def get_table_turnover_report(date_from=None, date_to=None, company=None) -> dict:
	day_start = getdate(date_from) if date_from else getdate(today())
	day_end = add_days(getdate(date_to) if date_to else day_start, 1)
	company = company or get_settings().default_company

	rows = frappe.db.sql(
		"""
		select rt.name, rt.table_number, rt.capacity,
			count(o.name) as turns,
			coalesce(sum(o.grand_total), 0) as sales
		from `tabIMOGI Restaurant Table` rt
		left join `tabRiwayat Order` o on o.restaurant_table = rt.name
			and o.status = 'Completed'
			and o.creation >= %(start)s and o.creation < %(end)s
		where rt.company = %(company)s
		group by rt.name, rt.table_number, rt.capacity
		order by turns desc, sales desc
		""",
		{"company": company, "start": day_start, "end": day_end},
		as_dict=True,
	)
	return {"rows": rows, "date_from": str(day_start), "date_to": str(add_days(day_end, -1))}


def get_kitchen_performance_report(date_from=None, date_to=None, date=None, **_kwargs) -> dict:
	"""KPI dapur per stasiun + snapshot antrian aktif untuk dashboard manager."""
	if date and not date_from and not date_to:
		day_start = getdate(date)
		day_end = add_days(day_start, 1)
	else:
		day_start = getdate(date_from) if date_from else add_days(getdate(today()), -30)
		day_end = add_days(getdate(date_to) if date_to else getdate(today()), 1)

	rows = frappe.db.sql(
		"""
		select
			coalesce(ks.station_name, nullif(ko.kitchen_station, ''), 'Tanpa Stasiun') as station_label,
			ko.kitchen_station,
			coalesce(ks.station_type, 'Kitchen') as station_type,
			count(*) as orders,
			sum(case when ko.status = 'Pending' then 1 else 0 end) as pending,
			sum(case when ko.status = 'Preparing' then 1 else 0 end) as preparing,
			sum(case when ko.status = 'Ready' then 1 else 0 end) as ready,
			sum(case when ko.status = 'Done' then 1 else 0 end) as completed,
			avg(
				case
					when ko.status in ('Done', 'Ready')
					then timestampdiff(
						MINUTE,
						coalesce(ko.started_at, ko.creation),
						ko.modified
					)
					else null
				end
			) as avg_minutes
		from `tabIMOGI Kitchen Order` ko
		left join `tabIMOGI Kitchen Station` ks on ks.name = ko.kitchen_station
		where ko.docstatus < 2
			and ifnull(ko.status, '') != 'Cancelled'
			and ko.creation >= %(start)s and ko.creation < %(end)s
		group by ko.kitchen_station, ks.station_name, ks.station_type
		order by orders desc
		""",
		{"start": day_start, "end": day_end},
		as_dict=True,
	)

	live = frappe.db.sql(
		"""
		select
			sum(case when status = 'Pending' then 1 else 0 end) as pending,
			sum(case when status = 'Preparing' then 1 else 0 end) as preparing,
			sum(case when status = 'Ready' then 1 else 0 end) as ready,
			sum(case when status in ('Pending', 'Preparing', 'Ready') then 1 else 0 end) as active
		from `tabIMOGI Kitchen Order`
		where docstatus < 2 and ifnull(status, '') not in ('Done', 'Cancelled')
		""",
		as_dict=True,
	)[0]

	return {
		"rows": rows,
		"live": {
			"active": cint(live.active),
			"pending": cint(live.pending),
			"preparing": cint(live.preparing),
			"ready": cint(live.ready),
		},
		"date_from": str(day_start),
		"date_to": str(add_days(day_end, -1)),
	}


def get_kitchen_performance_detail(
	date_from=None,
	date_to=None,
	date=None,
	station_type=None,
	status=None,
	limit=200,
	**_kwargs,
) -> dict:
	"""Detail order dapur untuk halaman reporting Kitchen Performance."""
	if date and not date_from and not date_to:
		day_start = getdate(date)
		day_end = add_days(day_start, 1)
	else:
		day_start = getdate(date_from) if date_from else getdate(today())
		day_end = add_days(getdate(date_to) if date_to else getdate(today()), 1)

	limit = min(cint(limit) or 200, 500)
	filters = [
		"ko.docstatus < 2",
		"ifnull(ko.status, '') != 'Cancelled'",
		"ko.creation >= %(start)s",
		"ko.creation < %(end)s",
	]
	values = {"start": day_start, "end": day_end, "limit": limit}

	if station_type in ("Kitchen", "Bar", "Kitchen & Bar", "Pastry", "Grill"):
		filters.append("ks.station_type = %(station_type)s")
		values["station_type"] = station_type
	if status in ("Pending", "Preparing", "Ready", "Done"):
		filters.append("ko.status = %(status)s")
		values["status"] = status

	where_sql = " and ".join(filters)
	orders = frappe.db.sql(
		f"""
		select
			ko.name as kitchen_order,
			ko.pos_order,
			ko.status,
			ko.kitchen_station,
			coalesce(ks.station_name, nullif(ko.kitchen_station, ''), 'Tanpa Stasiun') as station_label,
			coalesce(ks.station_type, 'Kitchen') as station_type,
			ko.creation,
			ko.started_at,
			ko.modified,
			ko.timer_minutes,
			po.order_type,
			po.customer_name,
			po.restaurant_table,
			rt.table_number
		from `tabIMOGI Kitchen Order` ko
		left join `tabIMOGI Kitchen Station` ks on ks.name = ko.kitchen_station
		left join `tabRiwayat Order` po on po.name = ko.pos_order
		left join `tabIMOGI Restaurant Table` rt on rt.name = po.restaurant_table
		where {where_sql}
		order by ko.creation desc
		limit %(limit)s
		""",
		values,
		as_dict=True,
	)

	if not orders:
		return {
			"rows": [],
			"summary": {
				"orders": 0,
				"completed": 0,
				"avg_minutes": 0,
				"active": 0,
			},
			"date_from": str(day_start),
			"date_to": str(add_days(day_end, -1)),
		}

	ko_names = [r.kitchen_order for r in orders]
	item_rows = frappe.db.sql(
		"""
		select parent, item_code, item_name, qty, status
		from `tabIMOGI Kitchen Order Item`
		where parent in %(parents)s
		order by idx asc
		""",
		{"parents": ko_names},
		as_dict=True,
	)
	items_by_parent = {}
	for item in item_rows:
		items_by_parent.setdefault(item.parent, []).append(item)

	detail_rows = []
	completed_minutes = []
	completed_count = 0
	active_count = 0
	for row in orders:
		start_dt = row.started_at or row.creation
		finished = row.status in ("Done", "Ready")
		end_dt = row.modified if finished else None
		duration_minutes = None
		if start_dt and end_dt:
			duration_minutes = max(
				0, int((get_datetime(end_dt) - get_datetime(start_dt)).total_seconds() // 60)
			)
			completed_minutes.append(duration_minutes)
		elif start_dt and row.status in ("Pending", "Preparing"):
			# Elapsed so far for open tickets
			duration_minutes = max(
				0, int((now_datetime() - get_datetime(start_dt)).total_seconds() // 60)
			)
		if finished:
			completed_count += 1
		if row.status in ("Pending", "Preparing"):
			active_count += 1

		items = items_by_parent.get(row.kitchen_order) or []
		if not items:
			items = [
				frappe._dict(
					{
						"item_code": None,
						"item_name": "—",
						"qty": 1,
						"status": row.status,
					}
				)
			]

		order_no = row.pos_order or row.kitchen_order
		for item in items:
			qty_f = flt(item.qty) or 1
			qty_label = int(qty_f) if abs(qty_f - int(qty_f)) < 1e-9 else qty_f
			name = item.item_name or item.item_code or "—"
			item_status = item.status or row.status
			detail_rows.append(
				{
					"kitchen_order": row.kitchen_order,
					"pos_order": row.pos_order,
					"order_no": order_no,
					"status": row.status,
					"item_status": item_status,
					"station_label": row.station_label,
					"station_type": row.station_type,
					"order_type": row.order_type,
					"customer_name": row.customer_name,
					"table_number": row.table_number,
					"item_code": item.item_code,
					"item_name": name,
					"qty": qty_f,
					"menu_text": f"{qty_label}x {name}",
					"menu_items": [f"{qty_label}x {name}"],
					"item_count": 1,
					"started_at": str(start_dt) if start_dt else None,
					"finished_at": str(end_dt) if end_dt else None,
					"duration_minutes": duration_minutes,
					"timer_minutes": cint(row.timer_minutes),
					"creation": str(row.creation) if row.creation else None,
				}
			)

	avg_minutes = (
		round(sum(completed_minutes) / len(completed_minutes), 1) if completed_minutes else 0
	)
	return {
		"rows": detail_rows,
		"summary": {
			"orders": len(orders),
			"line_items": len(detail_rows),
			"completed": completed_count,
			"avg_minutes": avg_minutes,
			"active": active_count,
		},
		"date_from": str(day_start),
		"date_to": str(add_days(day_end, -1)),
	}


def get_discount_analysis(date_from=None, date_to=None, company=None) -> dict:
	day_start = getdate(date_from) if date_from else add_days(getdate(today()), -30)
	day_end = add_days(getdate(date_to) if date_to else getdate(today()), 1)
	company = company or get_settings().default_company

	rows = frappe.db.sql(
		"""
		select coalesce(discount_type, 'Amount') as discount_type,
			count(*) as orders,
			coalesce(sum(discount_amount), 0) as total_discount
		from `tabRiwayat Order`
		where status not in ('Cancelled', 'Draft')
			and coalesce(discount_amount, 0) > 0
			and company = %(company)s
			and creation >= %(start)s and creation < %(end)s
		group by coalesce(discount_type, 'Amount')
		order by total_discount desc
		""",
		{"company": company, "start": day_start, "end": day_end},
		as_dict=True,
	)
	return {"rows": rows, "date_from": str(day_start), "date_to": str(add_days(day_end, -1))}


def get_void_analysis(date_from=None, date_to=None, company=None) -> dict:
	day_start = getdate(date_from) if date_from else add_days(getdate(today()), -30)
	day_end = add_days(getdate(date_to) if date_to else getdate(today()), 1)
	company = company or get_settings().default_company

	rows = frappe.db.sql(
		"""
		select name, customer_name, grand_total, remarks, modified, owner
		from `tabRiwayat Order`
		where status = 'Cancelled' and company = %(company)s
			and modified >= %(start)s and modified < %(end)s
		order by modified desc
		limit 100
		""",
		{"company": company, "start": day_start, "end": day_end},
		as_dict=True,
	)
	return {
		"rows": rows,
		"count": len(rows),
		"total_voided": sum(flt(r.grand_total) for r in rows),
		"date_from": str(day_start),
		"date_to": str(add_days(day_end, -1)),
	}


def get_activity_timeline(limit=50, reference_doctype=None) -> dict:
	filters = {"reference_doctype": reference_doctype} if reference_doctype else {}
	rows = frappe.get_all(
		"Activity Log",
		filters=filters,
		fields=["name", "subject", "reference_doctype", "reference_name", "user", "communication_date"],
		order_by="communication_date desc",
		limit=limit,
	)
	return {"rows": rows, "count": len(rows)}


def get_expired_monitoring(days_ahead=14, company=None) -> dict:
	company = company or get_settings().default_company
	cutoff = add_days(getdate(today()), days_ahead)
	rows = frappe.db.sql(
		"""
		select b.name, b.item, b.batch_id, b.expiry_date, b.batch_qty
		from `tabBatch` b
		where b.expiry_date is not null and b.expiry_date <= %(cutoff)s
		order by b.expiry_date asc
		limit 100
		""",
		{"cutoff": cutoff},
		as_dict=True,
	)
	return {"rows": rows, "count": len(rows), "cutoff": str(cutoff)}


def get_stock_forecast(company=None, warehouse=None, days=14) -> dict:
	settings = get_settings()
	company = company or settings.default_company
	warehouse = warehouse or settings.default_warehouse
	days = cint(days) or 14
	if not warehouse:
		return {"rows": [], "count": 0}

	rows = frappe.db.sql(
		"""
		select item_code,
			sum(abs(actual_qty)) / greatest(%(days)s, 1) as avg_daily_use
		from `tabStock Ledger Entry`
		where company = %(company)s and warehouse = %(warehouse)s
			and posting_date >= %(start)s
		group by item_code
		""",
		{"company": company, "warehouse": warehouse, "days": days, "start": add_days(getdate(today()), -days)},
		as_dict=True,
	)
	if not rows:
		return {"rows": [], "count": 0, "warehouse": warehouse}

	# On hand = saldo Bin real-time, BUKAN jumlah pergerakan dalam window — SUM(actual_qty)
	# dalam window cuma net perubahan periode itu, salah kalau item sudah punya stok sebelumnya.
	codes = [r.item_code for r in rows]
	bin_qty = {
		b.item_code: flt(b.actual_qty)
		for b in frappe.db.sql(
			"""
			select item_code, actual_qty
			from `tabBin`
			where warehouse = %(warehouse)s and item_code in %(codes)s
			""",
			{"warehouse": warehouse, "codes": codes},
			as_dict=True,
		)
	}

	target_multiplier = _forecast_target_multiplier(company, days)

	next_month_date = add_months(getdate(today()), 1)
	days_in_next_month = calendar.monthrange(next_month_date.year, next_month_date.month)[1]

	for row in rows:
		row["on_hand"] = bin_qty.get(row.item_code, 0)
		base_avg = flt(row.avg_daily_use)
		row["avg_daily_use"] = base_avg
		projected_daily_use = base_avg * target_multiplier
		row["projected_daily_use"] = round(projected_daily_use, 4)
		row["days_remaining"] = flt(row["on_hand"]) / (projected_daily_use or 0.01)
		next_month_need = projected_daily_use * days_in_next_month
		row["next_month_need"] = round(next_month_need, 2)
		row["restock_recommendation"] = round(max(0, next_month_need - flt(row["on_hand"])), 2)

	rows = [r for r in rows if flt(r["on_hand"]) > 0]
	rows.sort(key=lambda r: flt(r["on_hand"]))
	rows = rows[:50]

	# Hanya bahan baku — skip menu jual (is_sales_item=1)
	if rows:
		codes = [r["item_code"] for r in rows]
		sales_map = {
			d.name: cint(d.is_sales_item)
			for d in frappe.get_all(
				"Item",
				filters={"name": ["in", codes]},
				fields=["name", "is_sales_item"],
			)
		}
		rows = [r for r in rows if not sales_map.get(r["item_code"])]
	return {
		"rows": rows,
		"count": len(rows),
		"warehouse": warehouse,
		"target_multiplier": round(target_multiplier, 3),
		"next_month_label": formatdate(next_month_date, "MMMM yyyy"),
	}


def _forecast_target_multiplier(company, days) -> float:
	"""Skala proyeksi pemakaian bahan baku pakai Target Omzet Bulanan (IMOGI POS Settings),
	dibanding omzet aktual dalam window yang sama — supaya forecast ikut rencana bulan
	depan, bukan cuma ekstrapolasi rata-rata historis apa adanya."""
	from imogi_pos.imogi_pos.utils.sales_target import get_target_amount

	target_amount = get_target_amount()
	if not target_amount or not company:
		return 1.0

	start = add_days(getdate(today()), -days)
	actual_omzet = flt(
		frappe.db.sql(
			"""
			select coalesce(sum(grand_total), 0)
			from `tabPOS Invoice`
			where docstatus = 1 and company = %(company)s and posting_date >= %(start)s
			""",
			{"company": company, "start": start},
		)[0][0]
	)
	if actual_omzet <= 0:
		return 1.0

	days_in_month = calendar.monthrange(getdate(today()).year, getdate(today()).month)[1]
	actual_daily_omzet = actual_omzet / days
	target_daily_omzet = target_amount / days_in_month
	if actual_daily_omzet <= 0:
		return 1.0
	return target_daily_omzet / actual_daily_omzet


def create_spoilage_entry(
	item_code, qty, warehouse=None, reason=None, approval_ok: bool = False
) -> str:
	"""Post Material Issue for waste/spoilage. Prefer calling via approved Approval Request."""
	settings = get_settings()
	warehouse = warehouse or settings.default_warehouse
	if not warehouse:
		frappe.throw(_("Gudang default belum diset"))

	se = frappe.get_doc(
		{
			"doctype": "Stock Entry",
			"stock_entry_type": "Material Issue",
			"company": settings.default_company,
			"items": [{"item_code": item_code, "qty": flt(qty), "s_warehouse": warehouse}],
			"remarks": reason or _("Spoilage / waste IMOGI POS"),
		}
	)
	# Bypass approval_hooks.stock_entry_before_submit when posting after HO approve
	# (or when global stock-adjustment approval is on).
	se.flags.imogi_approval_ok = bool(approval_ok)
	se.insert(ignore_permissions=True)
	se.submit()
	# Setelah submit, pastikan nilai terbaca (kadang header masih 0 sampai reload)
	se.reload()
	if not flt(se.total_outgoing_value):
		line_sum = sum(abs(flt(d.amount)) for d in se.items)
		if line_sum:
			se.db_set("total_outgoing_value", line_sum, update_modified=False)
	return se.name


def get_central_inventory_summary(company=None) -> dict:
	company = company or get_settings().default_company
	branches = frappe.get_all(
		"IMOGI Branch",
		filters={"company": company, "is_active": 1},
		fields=["branch_name", "warehouse", "branch_code"],
	)
	rows = []
	for branch in branches:
		if not branch.warehouse:
			continue
		valuation = frappe.db.sql(
			"""
			select coalesce(sum(actual_qty * valuation_rate), 0) as value,
				count(distinct item_code) as sku_count
			from `tabStock Ledger Entry`
			where warehouse = %(wh)s and is_cancelled = 0
			""",
			{"wh": branch.warehouse},
			as_dict=True,
		)[0]
		rows.append(
			{
				"branch": branch.branch_name,
				"branch_code": branch.branch_code,
				"warehouse": branch.warehouse,
				"stock_value": flt(valuation.value),
				"sku_count": cint(valuation.sku_count),
			}
		)
	return {"rows": rows, "company": company}


def create_central_purchase_request(items, company=None) -> str:
	"""Material Request dari HQ untuk cabang."""
	settings = get_settings()
	company = company or settings.default_company
	if isinstance(items, str):
		items = frappe.parse_json(items)

	mr = frappe.get_doc(
		{
			"doctype": "Material Request",
			"material_request_type": "Purchase",
			"company": company,
			"transaction_date": today(),
			"schedule_date": today(),
			"items": [
				{
					"item_code": row.get("item_code"),
					"qty": flt(row.get("qty")),
					"warehouse": row.get("warehouse") or settings.default_warehouse,
				}
				for row in (items or [])
			],
		}
	)
	mr.insert(ignore_permissions=True)
	return mr.name


def list_combo_packages(company=None) -> list[dict]:
	company = company or get_settings().default_company
	combos = frappe.get_all(
		"IMOGI POS Combo Package",
		filters={"is_active": 1, "company": company},
		fields=["name", "combo_name", "selling_price", "description"],
		order_by="combo_name asc",
	)
	for combo in combos:
		combo["items"] = frappe.get_all(
			"IMOGI POS Combo Package Item",
			filters={"parent": combo.name},
			fields=["item_code", "item_name", "qty", "rate"],
		)
	return combos


def expand_combo_for_cart(combo_name, company=None) -> dict:
	"""Expand combo into cart lines priced to match package selling_price."""
	doc = frappe.get_doc("IMOGI POS Combo Package", combo_name)
	if not doc.is_active:
		frappe.throw(_("Combo tidak aktif"))

	package_price = flt(doc.selling_price)
	lines = []
	for row in doc.items:
		base_rate = flt(row.rate)
		if not base_rate:
			base_rate = flt(frappe.db.get_value("Item", row.item_code, "standard_rate"))
		qty = flt(row.qty) or 1
		lines.append(
			{
				"item_code": row.item_code,
				"item_name": row.item_name or frappe.db.get_value("Item", row.item_code, "item_name"),
				"qty": qty,
				"base_rate": base_rate,
				"uom": frappe.db.get_value("Item", row.item_code, "stock_uom") or "Nos",
			}
		)

	if not lines:
		frappe.throw(_("Combo tidak memiliki item"))

	line_total = sum(flt(line["base_rate"]) * flt(line["qty"]) for line in lines)
	for line in lines:
		if line_total > 0 and package_price > 0:
			share = (flt(line["base_rate"]) * flt(line["qty"])) / line_total
			line["rate"] = flt(package_price * share / flt(line["qty"]), 2)
		elif package_price > 0:
			line["rate"] = flt(package_price / len(lines) / flt(line["qty"]), 2)
		else:
			line["rate"] = flt(line["base_rate"])
		line.pop("base_rate", None)

	return {
		"combo_name": doc.name,
		"combo_label": doc.combo_name or doc.name,
		"package_price": package_price,
		"items": lines,
	}


def expand_combo_items(combo_name) -> list[dict]:
	return expand_combo_for_cart(combo_name)["items"]


def get_bom_substitutes(bom_name=None, item_code=None) -> dict:
	"""Ingredient substitutes via Item Alternative (+ BOM version history)."""
	from imogi_pos.imogi_pos.utils.recipe_hub import (
		get_ingredient_alternatives,
		get_recipe_detail,
		get_recipe_versions,
	)

	if bom_name:
		detail = get_recipe_detail(bom_name)
		item_code = detail.get("item")
		ingredient_alts = []
		for ing in detail.get("ingredients") or []:
			alts = get_ingredient_alternatives(ing["item_code"])
			ingredient_alts.append(
				{
					"item_code": ing["item_code"],
					"item_name": ing["item_name"],
					"alternatives": alts.get("alternatives") or [],
				}
			)
		versions = get_recipe_versions(bom_name=bom_name, limit=10)
		return {
			"item_code": item_code,
			"bom": bom_name,
			"ingredient_substitutes": ingredient_alts,
			"substitutes": [],  # legacy key kept empty; use ingredient_substitutes
			"versions": versions.get("rows") or [],
		}

	if not item_code:
		frappe.throw(_("BOM atau item wajib diisi"))

	alts = get_ingredient_alternatives(item_code)
	return {
		"item_code": item_code,
		"bom": None,
		"substitutes": alts.get("alternatives") or [],
		"ingredient_substitutes": [
			{
				"item_code": item_code,
				"item_name": frappe.db.get_value("Item", item_code, "item_name") or item_code,
				"alternatives": alts.get("alternatives") or [],
			}
		],
		"versions": [],
	}


def get_customer_birthday(customer, company=None):
	"""Resolve DOB from loyalty member, then Customer custom/standard fields."""
	if not customer:
		return None
	from imogi_pos.imogi_pos.utils.flow import resolve_company

	company = resolve_company(company)
	member_name = frappe.db.get_value(
		"IMOGI POS Loyalty Member",
		{"customer": customer, "company": company},
		"name",
	)
	if member_name:
		dob = frappe.db.get_value("IMOGI POS Loyalty Member", member_name, "date_of_birth")
		if dob:
			return getdate(dob)

	for field in ("imogi_birthday", "date_of_birth"):
		if frappe.get_meta("Customer").has_field(field):
			dob = frappe.db.get_value("Customer", customer, field)
			if dob:
				return getdate(dob)
	return None


def _birthday_day_distance(birthday, on_date=None) -> int | None:
	"""Min day distance between today and birthday anniversary (handles year wrap)."""
	if not birthday:
		return None
	on_date = getdate(on_date or today())
	bday = getdate(birthday)

	def _anniversary(year: int):
		try:
			return getdate(f"{year}-{bday.month:02d}-{bday.day:02d}")
		except Exception:
			# Feb 29 on non-leap years → Feb 28
			return getdate(f"{year}-02-28")

	candidates = [_anniversary(on_date.year), _anniversary(on_date.year - 1), _anniversary(on_date.year + 1)]
	return min(abs((on_date - d).days) for d in candidates)


def is_within_birthday_window(birthday, window_days: int = 0, on_date=None) -> bool:
	dist = _birthday_day_distance(birthday, on_date=on_date)
	if dist is None:
		return False
	return dist <= max(0, cint(window_days))


def has_used_birthday_promo_this_year(customer, company=None) -> bool:
	if not customer:
		return False
	year = getdate(today()).year
	filters = {
		"customer": customer,
		"docstatus": 1,
		"creation": ["between", [f"{year}-01-01", f"{year}-12-31 23:59:59"]],
	}
	if company:
		filters["company"] = company
	return bool(
		frappe.db.exists(
			"Riwayat Order",
			{**filters, "applied_promo": ["like", "%BIRTHDAY_PROMO%"]},
		)
	)


def get_birthday_promo_status(customer, company=None, settings=None) -> dict:
	from imogi_pos.imogi_pos.utils.feature_gating import is_setting_enabled

	settings = settings or get_settings()
	enabled = is_setting_enabled("enable_birthday_promo", settings)
	pct = flt(getattr(settings, "birthday_discount_percent", 10)) or 10
	window = cint(getattr(settings, "birthday_window_days", 0))
	birthday = get_customer_birthday(customer, company=company) if customer else None
	eligible = False
	used = False
	if enabled and customer and birthday:
		used = has_used_birthday_promo_this_year(customer, company=company)
		eligible = (not used) and is_within_birthday_window(birthday, window_days=window)
	return {
		"enabled": bool(enabled),
		"discount_percent": pct,
		"window_days": window,
		"date_of_birth": str(birthday) if birthday else None,
		"eligible": eligible,
		"already_used_this_year": used,
	}


def apply_birthday_promo(customer, subtotal: float, settings=None, company=None) -> float:
	"""Diskon % subtotal jika customer sedang dalam jendela ulang tahun & belum dipakai tahun ini."""
	settings = settings or get_settings()
	status = get_birthday_promo_status(customer, company=company, settings=settings)
	if not status["eligible"]:
		return 0
	pct = flt(status["discount_percent"])
	return flt(subtotal) * pct / 100


def apply_cashback_amount(grand_total: float, settings=None) -> float:
	settings = settings or get_settings()
	if not cint(getattr(settings, "enable_cashback", 0)):
		return 0
	pct = flt(getattr(settings, "cashback_percent", 1))
	return flt(grand_total) * pct / 100


def on_kitchen_order_created(doc, method=None):
	print_kitchen_ticket(doc.name)


def print_kitchen_ticket(kitchen_order_name: str):
	settings = get_settings()
	if not cint(getattr(settings, "enable_kitchen_printer", 0)):
		return
	try:
		frappe.get_print("IMOGI Kitchen Order", kitchen_order_name, print_format=None, as_pdf=False)
	except Exception:
		frappe.log_error(title=_("Kitchen printer failed"), message=frappe.get_traceback())
