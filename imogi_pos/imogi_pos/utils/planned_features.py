# Copyright (c) 2026, Imogi and contributors
"""MVP implementations for features previously marked planned."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import add_days, cint, flt, get_datetime, getdate, now_datetime, today

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
	day_start = getdate(date_from) if date_from else add_days(getdate(today()), -30)
	day_end = add_days(getdate(date_to) if date_to else getdate(today()), 1)
	company = company or get_settings().default_company

	rows = frappe.db.sql(
		"""
		select se.name, se.posting_date, sei.item_code, sei.qty, sei.amount, se.remarks
		from `tabStock Entry` se
		inner join `tabStock Entry Detail` sei on sei.parent = se.name
		where se.docstatus = 1 and se.stock_entry_type = 'Material Issue'
			and se.company = %(company)s
			and se.posting_date >= %(start)s and se.posting_date < %(end)s
		order by se.posting_date desc
		limit 100
		""",
		{"company": company, "start": day_start, "end": day_end},
		as_dict=True,
	)
	return {
		"rows": rows,
		"total_qty": sum(flt(r.qty) for r in rows),
		"count": len(rows),
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
	return {"rows": rows, "count": len(rows), "date_from": str(day_start), "date_to": str(add_days(day_end, -1))}


def get_kitchen_performance_report(date_from=None, date_to=None) -> dict:
	day_start = getdate(date_from) if date_from else add_days(getdate(today()), -7)
	day_end = add_days(getdate(date_to) if date_to else getdate(today()), 1)

	rows = frappe.db.sql(
		"""
		select ko.kitchen_station,
			count(*) as orders,
			avg(timestampdiff(MINUTE, ko.creation, coalesce(ko.modified, ko.creation))) as avg_minutes,
			sum(case when ko.status = 'Done' then 1 else 0 end) as completed
		from `tabIMOGI Kitchen Order` ko
		where ko.docstatus < 2
			and ko.creation >= %(start)s and ko.creation < %(end)s
		group by ko.kitchen_station
		order by orders desc
		""",
		{"start": day_start, "end": day_end},
		as_dict=True,
	)
	return {"rows": rows, "date_from": str(day_start), "date_to": str(add_days(day_end, -1))}


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
	if not warehouse:
		return {"rows": [], "count": 0}

	rows = frappe.db.sql(
		"""
		select item_code,
			sum(actual_qty) as on_hand,
			sum(abs(actual_qty)) / greatest(%(days)s, 1) as avg_daily_use
		from `tabStock Ledger Entry`
		where company = %(company)s and warehouse = %(warehouse)s
			and posting_date >= %(start)s
		group by item_code
		having on_hand > 0
		order by on_hand asc
		limit 50
		""",
		{"company": company, "warehouse": warehouse, "days": days, "start": add_days(getdate(today()), -days)},
		as_dict=True,
	)
	for row in rows:
		avg = flt(row.avg_daily_use) or 0.01
		row["days_remaining"] = flt(row.on_hand) / avg
	return {"rows": rows, "count": len(rows), "warehouse": warehouse}


def create_spoilage_entry(item_code, qty, warehouse=None, reason=None) -> str:
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
	se.insert(ignore_permissions=True)
	se.submit()
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
	if bom_name:
		bom = frappe.get_doc("BOM", bom_name)
		item_code = bom.item
	elif item_code:
		bom_name = frappe.db.get_value("BOM", {"item": item_code, "is_default": 1, "docstatus": 1}, "name")
	else:
		frappe.throw(_("BOM atau item wajib diisi"))

	item_group = frappe.db.get_value("Item", item_code, "item_group")
	alts = frappe.get_all(
		"Item",
		filters={"item_group": item_group, "name": ["!=", item_code], "disabled": 0, "is_sales_item": 0},
		fields=["name", "item_name", "stock_uom"],
		limit=10,
	)
	versions = frappe.get_all(
		"Version",
		filters={"ref_doctype": "BOM", "docname": bom_name} if bom_name else {},
		fields=["name", "creation", "owner"],
		order_by="creation desc",
		limit=10,
	)
	return {"item_code": item_code, "bom": bom_name, "substitutes": alts, "versions": versions}


def apply_birthday_promo(customer, subtotal: float, settings=None) -> float:
	settings = settings or get_settings()
	if not cint(getattr(settings, "enable_birthday_promo", 0)):
		return 0
	if not customer:
		return 0

	birthday = frappe.db.get_value("Customer", customer, "imogi_birthday") or frappe.db.get_value(
		"Customer", customer, "date_of_birth"
	)
	if not birthday:
		return 0
	bday = getdate(birthday)
	now = getdate(today())
	if (bday.month, bday.day) != (now.month, now.day):
		return 0

	pct = flt(getattr(settings, "birthday_discount_percent", 10))
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
