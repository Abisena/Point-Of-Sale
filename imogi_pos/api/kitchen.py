# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import cint, now_datetime


def _require_kitchen_access():
	from imogi_pos.imogi_pos.utils.feature_gating import require_feature_operational

	require_feature_operational("kitchen_display")


@frappe.whitelist()
def get_kitchen_queue(station_type=None):
	from imogi_pos.imogi_pos.utils.feature_gating import is_feature_operational

	if not is_feature_operational("kitchen_display"):
		return []
	_require_kitchen_access()

	station_filter = ""
	values = {}
	if station_type and is_feature_operational("bar_station"):
		station_filter = " and ks.station_type = %(station_type)s"
		values["station_type"] = station_type

	orders = frappe.db.sql(
		f"""
		select
			ko.name, ko.pos_order, ko.status, ko.kitchen_station,
			ko.started_at, ko.expected_ready_at, ko.timer_minutes,
			po.order_type, po.order_channel, po.customer_name, po.grand_total,
			ks.station_type
		from `tabIMOGI Kitchen Order` ko
		left join `tabRiwayat Order` po on po.name = ko.pos_order
		left join `tabIMOGI Kitchen Station` ks on ks.name = ko.kitchen_station
		where ko.status in ('Pending', 'Preparing')
			and ko.docstatus < 2
			{station_filter}
		order by ko.creation asc
		""",
		values,
		as_dict=True,
	)

	for row in orders:
		row["items"] = frappe.get_all(
			"IMOGI Kitchen Order Item",
			filters={"parent": row.name},
			fields=["item_code", "item_name", "qty", "status", "notes"],
		)

	return orders


@frappe.whitelist()
def update_kitchen_status(kitchen_order, status):
	_require_kitchen_access()
	ko = frappe.get_doc("IMOGI Kitchen Order", kitchen_order)
	ko.check_permission("write")

	if status not in ("Pending", "Preparing", "Ready", "Done"):
		frappe.throw(_("Invalid kitchen status"))

	updates = {"status": status}
	if status == "Preparing":
		started_at = ko.started_at or now_datetime()
		updates["started_at"] = started_at
		timer = ko.timer_minutes or 15
		from frappe.utils import add_to_date

		updates["expected_ready_at"] = add_to_date(started_at, minutes=timer)

	ko.db_set(updates)

	frappe.publish_realtime("imogi_kitchen_updated", {"kitchen_order": kitchen_order, "status": status})
	return ko.name


@frappe.whitelist()
def complete_kitchen_from_display(kitchen_order):
	frappe.only_for(("IMOGI Kitchen Staff", "Sales Manager", "System Manager"))
	ko = frappe.get_doc("IMOGI Kitchen Order", kitchen_order)
	ko.check_permission("write")

	if not ko.pos_order:
		frappe.throw(_("Kitchen order is not linked to a POS order"))

	ko.db_set("status", "Done")
	pos_order = frappe.get_doc("Riwayat Order", ko.pos_order)
	return pos_order.action_complete_kitchen()


# ── Kitchen Order management page ──────────────────────────────────────────

KITCHEN_ORDER_STATUSES = ("Pending", "Preparing", "Ready", "Done", "Cancelled")


@frappe.whitelist()
def list_kitchen_orders(status=None, search=None, station=None, limit=60):
	"""All kitchen orders (any status) for the Kitchen Order management page."""
	frappe.has_permission("IMOGI Kitchen Order", "read", throw=True)

	conditions = ["ko.docstatus < 2"]
	values = {"limit": cint(limit) or 60}

	if status and status in KITCHEN_ORDER_STATUSES:
		conditions.append("ko.status = %(status)s")
		values["status"] = status
	if station:
		conditions.append("ko.kitchen_station = %(station)s")
		values["station"] = station
	if search:
		conditions.append("(ko.name like %(search)s or ko.pos_order like %(search)s or po.customer_name like %(search)s)")
		values["search"] = f"%{search}%"

	where = " and ".join(conditions)
	orders = frappe.db.sql(
		f"""
		select
			ko.name, ko.pos_order, ko.status, ko.kitchen_station,
			ko.started_at, ko.expected_ready_at, ko.timer_minutes, ko.creation,
			po.order_type, po.order_channel, po.customer_name, po.grand_total,
			ks.station_type
		from `tabIMOGI Kitchen Order` ko
		left join `tabRiwayat Order` po on po.name = ko.pos_order
		left join `tabIMOGI Kitchen Station` ks on ks.name = ko.kitchen_station
		where {where}
		order by ko.creation desc
		limit %(limit)s
		""",
		values,
		as_dict=True,
	)

	names = [o.name for o in orders]
	items_by_parent = {}
	if names:
		for it in frappe.get_all(
			"IMOGI Kitchen Order Item",
			filters={"parent": ["in", names]},
			fields=["parent", "item_code", "item_name", "qty", "status", "notes"],
		):
			items_by_parent.setdefault(it.parent, []).append(it)
	for o in orders:
		o["items"] = items_by_parent.get(o.name, [])

	return orders


@frappe.whitelist()
def get_kitchen_order_status_counts():
	"""Counts per status for the management page header chips."""
	frappe.has_permission("IMOGI Kitchen Order", "read", throw=True)
	rows = frappe.db.sql(
		"""
		select status, count(*) as count
		from `tabIMOGI Kitchen Order`
		where docstatus < 2
		group by status
		""",
		as_dict=True,
	)
	counts = {status: 0 for status in KITCHEN_ORDER_STATUSES}
	for row in rows:
		if row.status in counts:
			counts[row.status] = row.count
	counts["All"] = sum(counts.values())
	return counts


# ── Kitchen Station management page ─────────────────────────────────────────


@frappe.whitelist()
def list_kitchen_stations():
	"""Stations with live active-order counts for the management page."""
	frappe.has_permission("IMOGI Kitchen Station", "read", throw=True)
	stations = frappe.get_all(
		"IMOGI Kitchen Station",
		fields=["name", "station_name", "station_type", "company", "is_active", "description"],
		order_by="station_type asc, station_name asc",
	)

	active_counts = dict(
		frappe.db.sql(
			"""
			select kitchen_station, count(*)
			from `tabIMOGI Kitchen Order`
			where docstatus < 2 and status in ('Pending', 'Preparing')
			group by kitchen_station
			"""
		)
		or []
	)
	for st in stations:
		st["active_orders"] = cint(active_counts.get(st.name, 0))
	return stations


@frappe.whitelist()
def save_kitchen_station(station_name, station_type=None, company=None, is_active=1, description=None, original_name=None):
	"""Create or update a kitchen station from the management page."""
	frappe.has_permission("IMOGI Kitchen Station", "write", throw=True)

	if original_name and frappe.db.exists("IMOGI Kitchen Station", original_name):
		doc = frappe.get_doc("IMOGI Kitchen Station", original_name)
		if station_name and station_name != original_name:
			frappe.rename_doc("IMOGI Kitchen Station", original_name, station_name, force=False)
			doc = frappe.get_doc("IMOGI Kitchen Station", station_name)
	else:
		doc = frappe.new_doc("IMOGI Kitchen Station")
		doc.station_name = station_name

	doc.station_type = station_type or "Kitchen"
	doc.company = company or doc.company
	doc.is_active = cint(is_active)
	doc.description = description
	doc.save()
	return doc.name


@frappe.whitelist()
def toggle_kitchen_station(station, is_active):
	frappe.has_permission("IMOGI Kitchen Station", "write", throw=True)
	frappe.db.set_value("IMOGI Kitchen Station", station, "is_active", cint(is_active))
	return True


@frappe.whitelist()
def delete_kitchen_station(station):
	frappe.has_permission("IMOGI Kitchen Station", "delete", throw=True)
	if frappe.db.exists("IMOGI Kitchen Order", {"kitchen_station": station, "docstatus": ["<", 2]}):
		frappe.throw(_("Tidak bisa menghapus stasiun yang masih dipakai order dapur."))
	frappe.delete_doc("IMOGI Kitchen Station", station)
	return True
