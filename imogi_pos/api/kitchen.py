# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import cint, flt, now_datetime

KITCHEN_ITEM_STATUSES = ("Pending", "Preparing", "Ready")


def _require_kitchen_access():
	from imogi_pos.imogi_pos.utils.feature_gating import require_feature_operational

	require_feature_operational("kitchen_display")


@frappe.whitelist()
def get_kitchen_queue(station_type=None):
	from imogi_pos.imogi_pos.utils.central_kitchen import is_bar_station_routing_enabled
	from imogi_pos.imogi_pos.utils.feature_gating import is_feature_operational

	if not is_feature_operational("kitchen_display"):
		return []
	_require_kitchen_access()

	station_filter = ""
	values = {}
	# Tab Dapur/Bar only apply in Separate Kitchen and Bar mode.
	if station_type and is_feature_operational("bar_station") and is_bar_station_routing_enabled():
		if station_type == "Kitchen":
			station_filter = (
				" and (ks.station_type in ('Kitchen', 'Kitchen & Bar')"
				" or ko.kitchen_station is null or ko.kitchen_station = '')"
			)
		elif station_type == "Bar":
			station_filter = " and ks.station_type in ('Bar', 'Kitchen & Bar')"
		else:
			station_filter = " and ks.station_type = %(station_type)s"
			values["station_type"] = station_type

	orders = frappe.db.sql(
		f"""
		select
			ko.name, ko.pos_order, ko.status, ko.kitchen_station,
			ko.started_at, ko.expected_ready_at, ko.timer_minutes, ko.creation,
			po.order_type, po.order_channel, po.customer_name, po.grand_total,
			po.restaurant_table, rt.table_number,
			ks.station_type
		from `tabIMOGI Kitchen Order` ko
		left join `tabRiwayat Order` po on po.name = ko.pos_order
		left join `tabIMOGI Kitchen Station` ks on ks.name = ko.kitchen_station
		left join `tabIMOGI Restaurant Table` rt on rt.name = po.restaurant_table
		where ko.status in ('Pending', 'Preparing', 'Ready')
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
			fields=["name", "item_code", "item_name", "qty", "status", "notes"],
			order_by="idx asc",
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
	_sync_kitchen_order_items(ko.name, status)

	pos_order = ko.pos_order
	frappe.publish_realtime("imogi_kitchen_updated", {"kitchen_order": kitchen_order, "status": status})
	if pos_order:
		frappe.publish_realtime("imogi_table_service_updated", {"pos_order": pos_order})
	return ko.name


@frappe.whitelist()
def update_kitchen_item_status(kitchen_order_item, status):
	"""KDS: start or complete one kitchen line without touching sibling items."""
	_require_kitchen_access()
	status = (status or "").strip()
	if status not in KITCHEN_ITEM_STATUSES:
		frappe.throw(_("Invalid item status"))

	item = frappe.db.get_value(
		"IMOGI Kitchen Order Item",
		kitchen_order_item,
		["name", "parent", "status"],
		as_dict=True,
	)
	if not item:
		frappe.throw(_("Kitchen item not found"))

	ko = frappe.get_doc("IMOGI Kitchen Order", item.parent)
	ko.check_permission("write")

	current = (item.status or "Pending").strip()
	if current == status:
		return {"kitchen_order": ko.name, "status": ko.status, "item_status": status}

	if status == "Preparing" and current != "Pending":
		frappe.throw(_("Hanya item antrian yang bisa dimulai"))
	if status == "Ready" and current != "Preparing":
		frappe.throw(_("Hanya item yang sedang dimasak yang bisa ditandai siap"))

	frappe.db.set_value(
		"IMOGI Kitchen Order Item",
		kitchen_order_item,
		"status",
		status,
		update_modified=False,
	)
	_recompute_kitchen_order_status(ko)

	frappe.publish_realtime(
		"imogi_kitchen_updated",
		{"kitchen_order": ko.name, "status": ko.status, "kitchen_order_item": kitchen_order_item},
	)
	if ko.pos_order:
		frappe.publish_realtime("imogi_table_service_updated", {"pos_order": ko.pos_order})
	return {"kitchen_order": ko.name, "status": ko.status, "item_status": status}


def _recompute_kitchen_order_status(ko):
	items = frappe.get_all(
		"IMOGI Kitchen Order Item",
		filters={"parent": ko.name},
		fields=["status"],
	)
	statuses = [(row.status or "Pending").strip() for row in items]
	if not statuses:
		return

	if all(status == "Ready" for status in statuses):
		new_status = "Ready"
	elif any(status in ("Preparing", "Ready") for status in statuses):
		new_status = "Preparing"
	else:
		new_status = "Pending"

	updates = {}
	if new_status == "Preparing" and not ko.started_at:
		started_at = now_datetime()
		timer = ko.timer_minutes or 15
		from frappe.utils import add_to_date

		updates["started_at"] = started_at
		updates["expected_ready_at"] = add_to_date(started_at, minutes=timer)

	if ko.status != new_status:
		updates["status"] = new_status

	if updates:
		ko.db_set(updates)


@frappe.whitelist()
def complete_kitchen_from_display(kitchen_order):
	frappe.only_for(("IMOGI Kitchen Staff", "Sales Manager", "System Manager"))
	ko = frappe.get_doc("IMOGI Kitchen Order", kitchen_order)
	ko.check_permission("write")

	if not ko.pos_order:
		frappe.throw(_("Kitchen order is not linked to a POS order"))

	if ko.status in ("Done", "Cancelled"):
		frappe.throw(_("Kitchen order already completed"))

	pos_order = frappe.get_doc("Riwayat Order", ko.pos_order)

	if pos_order.status == "In Kitchen":
		return pos_order.action_complete_kitchen()

	# Active KDS ticket but POS status drifted (smoke seed / partial flow recovery).
	if ko.status in ("Pending", "Preparing", "Ready"):
		ko.db_set("status", "Done")
		_sync_kitchen_order_items(ko.name, "Done")
		frappe.publish_realtime(
			"imogi_kitchen_updated",
			{"kitchen_order": kitchen_order, "status": "Done"},
		)
		if ko.pos_order:
			frappe.publish_realtime("imogi_table_service_updated", {"pos_order": ko.pos_order})
		return ko.name

	frappe.throw(_("Order is not in kitchen"))


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


# ── Kitchen tracking for Table Service / waiter views ───────────────────────

KITCHEN_ITEM_STATUS_LABELS = {
	"Pending": _("In Proses"),
	"Preparing": _("Proses"),
	"Ready": _("Done"),
}


def _effective_kitchen_item_status(item_status, order_status):
	"""Waiter/table view: respect per-item status so addon lines stay queued until started."""
	item_status = (item_status or "Pending").strip()
	order_status = (order_status or "Pending").strip()
	if item_status == "Ready" or order_status in ("Done", "Ready"):
		return "Ready"
	if item_status == "Pending":
		return "Pending"
	if item_status == "Preparing" or order_status == "Preparing":
		return "Preparing"
	if order_status == "Cancelled":
		return item_status if item_status in KITCHEN_ITEM_STATUSES else "Pending"
	return item_status if item_status in KITCHEN_ITEM_STATUSES else "Pending"


def _kitchen_tracking_qty(value):
	qty = flt(value or 1)
	return qty if qty > 0 else 1


def _primary_status_from_counts(counts):
	"""Worst-case status for waiter view: queue beats cooking beats done."""
	if flt(counts.get("pending")) > 0:
		return "Pending"
	if flt(counts.get("preparing")) > 0:
		return "Preparing"
	return "Ready"


def _status_breakdown_label(counts):
	parts = []
	for key, label in (
		("ready", _("Done")),
		("preparing", _("Proses")),
		("pending", _("In Proses")),
	):
		qty = flt(counts.get(key))
		if qty <= 0:
			continue
		qty_text = str(int(qty)) if qty == int(qty) else f"{qty:g}"
		parts.append(f"{qty_text} {label}")
	return _(" · ").join(parts)


def _summarize_kitchen_tracking_items(items):
	summary = {"pending": 0, "preparing": 0, "ready": 0, "total": 0}
	for row in items or []:
		if row.get("status_counts"):
			counts = row.get("status_counts") or {}
			for key in ("pending", "preparing", "ready"):
				summary[key] += flt(counts.get(key))
			summary["total"] += _kitchen_tracking_qty(row.get("qty"))
			continue
		qty = _kitchen_tracking_qty(row.get("qty"))
		status = (row.get("status") or "Pending").strip()
		key = status.lower() if status in KITCHEN_ITEM_STATUSES else "pending"
		summary[key] += qty
		summary["total"] += qty
	return summary


def _aggregate_kitchen_tracking_items(items):
	"""Merge identical kitchen lines for waiter/table views (qty + per-status breakdown)."""
	groups: dict[tuple[str, str], dict] = {}
	for row in items or []:
		notes = (row.get("notes") or "").strip()
		item_code = (row.get("item_code") or "").strip()
		key = (item_code, notes)
		status = (row.get("status") or "Pending").strip()
		if status not in KITCHEN_ITEM_STATUSES:
			status = "Pending"
		qty = _kitchen_tracking_qty(row.get("qty"))

		group = groups.setdefault(
			key,
			{
				"item_code": item_code,
				"item_name": row.get("item_name") or item_code,
				"notes": notes or None,
				"qty": 0,
				"status_counts": {"pending": 0, "preparing": 0, "ready": 0},
			},
		)
		if row.get("item_name"):
			group["item_name"] = row.get("item_name")
		row_counts = row.get("status_counts")
		if row_counts:
			for bucket in ("pending", "preparing", "ready"):
				group["status_counts"][bucket] += flt(row_counts.get(bucket))
			group["qty"] += _kitchen_tracking_qty(row.get("qty"))
			continue
		group["qty"] += qty
		group["status_counts"][status.lower()] += qty

	aggregated = []
	for group in groups.values():
		counts = group["status_counts"]
		active = [key for key in ("ready", "preparing", "pending") if flt(counts.get(key)) > 0]
		is_mixed = len(active) > 1
		primary = _primary_status_from_counts(counts)
		total_qty = _kitchen_tracking_qty(group["qty"])
		ready_qty = flt(counts.get("ready"))
		entry = {
			"item_code": group["item_code"],
			"item_name": group["item_name"],
			"qty": total_qty,
			"notes": group.get("notes"),
			"status_counts": counts,
			"status": primary,
			"is_mixed": is_mixed,
		}
		if is_mixed:
			entry["status_label"] = _status_breakdown_label(counts)
			entry["progress_label"] = (
				_("{0}/{1} Done").format(
					int(ready_qty) if ready_qty == int(ready_qty) else f"{ready_qty:g}",
					int(total_qty) if total_qty == int(total_qty) else f"{total_qty:g}",
				)
				if ready_qty > 0
				else None
			)
		else:
			entry["status_label"] = KITCHEN_ITEM_STATUS_LABELS.get(primary, primary)
			entry["progress_label"] = None
		aggregated.append(entry)

	aggregated.sort(key=lambda row: ((row.get("item_name") or row.get("item_code") or "").lower()))
	return aggregated, _summarize_kitchen_tracking_items(aggregated)


def _finalize_kitchen_tracking_view(tracking):
	items = tracking.get("items") or []
	if not items:
		tracking["summary"] = {"pending": 0, "preparing": 0, "ready": 0, "total": 0}
		return tracking
	aggregated, summary = _aggregate_kitchen_tracking_items(items)
	tracking["items"] = aggregated
	tracking["summary"] = summary
	return tracking


def _sync_kitchen_order_items(kitchen_order_name, order_status):
	order_status = (order_status or "").strip()
	if order_status not in ("Preparing", "Ready", "Done"):
		return

	target = "Ready" if order_status in ("Ready", "Done") else "Preparing"
	for row in frappe.get_all(
		"IMOGI Kitchen Order Item",
		filters={"parent": kitchen_order_name},
		fields=["name", "status"],
	):
		current = (row.status or "Pending").strip()
		if order_status == "Preparing":
			if current == "Pending":
				frappe.db.set_value("IMOGI Kitchen Order Item", row.name, "status", "Preparing", update_modified=False)
		elif current != "Ready":
			frappe.db.set_value("IMOGI Kitchen Order Item", row.name, "status", target, update_modified=False)


def _collect_pos_order_kitchen_rows(pos_order):
	"""Raw kitchen ticket lines for one POS order (no qty aggregation)."""
	pos_order = (pos_order or "").strip()
	if not pos_order or not frappe.db.exists("Riwayat Order", pos_order):
		return None, [], [], _("Order tidak ditemukan")

	order = frappe.db.get_value(
		"Riwayat Order",
		pos_order,
		["name", "requires_kitchen", "kitchen_order", "status"],
		as_dict=True,
	)
	if not order or not cint(order.requires_kitchen):
		return order, [], [], _("Tidak ada item dapur pada order ini")

	ko_names = []
	if order.kitchen_order:
		ko_names.append(order.kitchen_order)
	for row in frappe.get_all(
		"IMOGI Kitchen Order",
		filters={"pos_order": pos_order, "docstatus": ["<", 2]},
		pluck="name",
	):
		if row not in ko_names:
			ko_names.append(row)

	kitchen_orders = []
	items = []
	for ko_name in ko_names:
		ko = frappe.db.get_value(
			"IMOGI Kitchen Order",
			ko_name,
			["name", "status", "kitchen_station"],
			as_dict=True,
		)
		if not ko:
			continue
		station_label = None
		if ko.kitchen_station:
			station_label = frappe.db.get_value("IMOGI Kitchen Station", ko.kitchen_station, "station_name") or ko.kitchen_station

		ko_items = []
		for row in frappe.get_all(
			"IMOGI Kitchen Order Item",
			filters={"parent": ko_name},
			fields=["item_code", "item_name", "qty", "status", "notes"],
			order_by="idx asc",
		):
			effective = _effective_kitchen_item_status(row.status, ko.status)
			entry = {
				"item_code": row.item_code,
				"item_name": row.item_name,
				"qty": row.qty,
				"notes": row.notes,
				"status": effective,
				"status_label": KITCHEN_ITEM_STATUS_LABELS.get(effective, effective),
				"kitchen_order": ko_name,
				"order_status": ko.status,
				"station": station_label,
			}
			ko_items.append(entry)
			items.append(entry)

		kitchen_orders.append(
			{
				"name": ko.name,
				"status": ko.status,
				"kitchen_station": ko.kitchen_station,
				"station_label": station_label,
				"items": ko_items,
			}
		)

	return order, kitchen_orders, items, None if items else _("Belum ada ticket dapur untuk order ini")


def build_pos_order_kitchen_tracking(pos_order):
	pos_order = (pos_order or "").strip()
	order, kitchen_orders, items, message = _collect_pos_order_kitchen_rows(pos_order)
	if not order:
		return {
			"has_kitchen": False,
			"pos_order": pos_order,
			"kitchen_orders": [],
			"items": [],
			"summary": {"pending": 0, "preparing": 0, "ready": 0, "total": 0},
			"message": message,
		}
	if not cint(order.requires_kitchen):
		return {
			"has_kitchen": False,
			"pos_order": pos_order,
			"kitchen_orders": [],
			"items": [],
			"summary": {"pending": 0, "preparing": 0, "ready": 0, "total": 0},
			"message": message,
		}

	result = {
		"has_kitchen": bool(items),
		"pos_order": pos_order,
		"pos_order_status": order.status,
		"kitchen_orders": kitchen_orders,
		"items": items,
		"summary": _summarize_kitchen_tracking_items(items),
		"message": message,
	}
	return _finalize_kitchen_tracking_view(result)


def build_table_kitchen_tracking(restaurant_table):
	restaurant_table = (restaurant_table or "").strip()
	if not restaurant_table:
		return {
			"has_kitchen": False,
			"restaurant_table": restaurant_table,
			"pos_orders": [],
			"kitchen_orders": [],
			"items": [],
			"summary": {"pending": 0, "preparing": 0, "ready": 0, "total": 0},
			"message": _("Meja tidak ditemukan"),
		}

	from imogi_pos.imogi_pos.utils.table_service import get_open_orders_by_table

	orders = get_open_orders_by_table().get(restaurant_table) or []
	if not orders:
		return {
			"has_kitchen": False,
			"restaurant_table": restaurant_table,
			"pos_orders": [],
			"kitchen_orders": [],
			"items": [],
			"summary": {"pending": 0, "preparing": 0, "ready": 0, "total": 0},
			"message": _("Tidak ada order aktif di meja ini"),
		}

	merged = {
		"has_kitchen": False,
		"restaurant_table": restaurant_table,
		"pos_orders": [],
		"kitchen_orders": [],
		"items": [],
		"summary": {"pending": 0, "preparing": 0, "ready": 0, "total": 0},
		"message": None,
	}
	for order in orders:
		_, kitchen_orders, items, message = _collect_pos_order_kitchen_rows(order.name)
		merged["pos_orders"].append(order.name)
		if not items:
			if message and not merged["message"]:
				merged["message"] = message
			continue
		merged["has_kitchen"] = True
		merged["kitchen_orders"].extend(kitchen_orders or [])
		merged["items"].extend(items or [])

	if not merged["has_kitchen"]:
		merged["message"] = _("Tidak ada item dapur pada order meja ini")
		return merged
	return _finalize_kitchen_tracking_view(merged)
