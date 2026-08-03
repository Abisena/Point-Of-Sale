# Copyright (c) 2026, Imogi and contributors
"""Inventory Hub: stock overview, waste/spoilage, batch expiry, opname, forecast."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, flt, nowdate, getdate, get_datetime, add_days, today

from imogi_pos.imogi_pos.utils.approval import create_approval_request
from imogi_pos.imogi_pos.utils.flow import get_settings
from imogi_pos.imogi_pos.utils.low_stock import get_item_reorder_level
from imogi_pos.imogi_pos.utils.planned_features import (
	get_expired_monitoring,
	get_stock_forecast,
)


RAW_MATERIAL_ITEM_GROUPS = frozenset({"Raw Material", "Bahan Baku"})


def apply_raw_material_defaults(doc, method=None):
	"""New items under a raw-material item group default is_sales_item=1 in
	ERPNext (checked by default for every item), which silently excludes them
	from Inventory Hub's stock listing — list_stock_items()/get_stock_summary()
	both require is_sales_item=0 to tell ingredients apart from sellable menu
	items. Only the bulk Excel/BOM import flow set this correctly; an item
	created the normal way (New Item in Desk) never showed up in Bahan Baku /
	Stock Bahan at all. Force the right default on insert only, so an explicit
	later edit to re-enable direct sale isn't overridden.
	"""
	if doc.item_group in RAW_MATERIAL_ITEM_GROUPS and cint(doc.is_sales_item):
		doc.is_sales_item = 0


def _settings():
	return get_settings()


def _company() -> str | None:
	return _settings().default_company


def _warehouse(warehouse: str | None = None) -> str | None:
	return warehouse or _settings().default_warehouse


def _require_stock_read():
	if frappe.session.user == "Guest":
		frappe.throw(_("Not permitted"), frappe.PermissionError)
	if not frappe.has_permission("Item", "read"):
		frappe.throw(_("Tidak punya akses inventori"), frappe.PermissionError)


def list_stock_items(
	search: str | None = None,
	warehouse: str | None = None,
	only_low: int = 0,
	limit: int = 300,
) -> dict:
	"""Stock items with on-hand qty — bahan baku only (bukan menu/produk jadi)."""
	_require_stock_read()
	warehouse = _warehouse(warehouse)
	if not warehouse:
		return {
			"rows": [],
			"summary": _empty_summary(),
			"warehouse": None,
			"company": _company(),
			"message": _("Gudang default belum diset di IMOGI POS Settings"),
		}

	# Finished menu (Food/Beverage/Dessert…) biasanya is_sales_item=1.
	# Import BOM memasang bahan di group "Bahan Baku" dengan is_sales_item=0.
	filters: dict = {
		"is_stock_item": 1,
		"disabled": 0,
		"is_sales_item": 0,
		"has_variants": 0,
	}
	or_filters = None
	if search:
		term = f"%{search.strip()}%"
		or_filters = [
			["item_code", "like", term],
			["item_name", "like", term],
			["name", "like", term],
		]

	items = frappe.get_all(
		"Item",
		filters=filters,
		or_filters=or_filters,
		fields=["name", "item_code", "item_name", "stock_uom", "item_group", "has_batch_no", "has_expiry_date"],
		order_by="item_name asc",
		limit_page_length=cint(limit) or 300,
	)

	# Fallback: item lama yang keburu dibuat dengan is_sales_item=1 (sebelum
	# apply_raw_material_defaults ada) tapi sudah benar di-group-kan sebagai
	# bahan baku — tampilkan tetap, apa pun status is_sales_item-nya.
	if not items and not search:
		items = frappe.get_all(
			"Item",
			filters={
				"is_stock_item": 1,
				"disabled": 0,
				"item_group": ["in", list(RAW_MATERIAL_ITEM_GROUPS)],
				"has_variants": 0,
			},
			fields=["name", "item_code", "item_name", "stock_uom", "item_group", "has_batch_no", "has_expiry_date"],
			order_by="item_name asc",
			limit_page_length=cint(limit) or 300,
		)

	codes = [row.name for row in items]
	bins: dict[str, dict] = {}
	if codes:
		for row in frappe.db.sql(
			"""
			select item_code, actual_qty, stock_value
			from `tabBin`
			where warehouse = %(warehouse)s and item_code in %(codes)s
			""",
			{"warehouse": warehouse, "codes": codes},
			as_dict=True,
		):
			bins[row.item_code] = row

	rows = []
	low_count = 0
	zero_count = 0
	batch_count = 0
	total_value = 0.0
	for item in items:
		bin_row = bins.get(item.name) or {}
		qty = flt(bin_row.get("actual_qty"))
		value = flt(bin_row.get("stock_value"))
		reorder = get_item_reorder_level(item.name, warehouse)
		is_low = qty <= reorder if reorder > 0 else qty <= 0
		if qty <= 0:
			zero_count += 1
		if is_low:
			low_count += 1
		if cint(item.has_batch_no):
			batch_count += 1
		total_value += value
		if cint(only_low) and not is_low:
			continue
		rows.append(
			{
				"item_code": item.name,
				"item_name": item.item_name or item.name,
				"uom": item.stock_uom,
				"item_group": item.item_group,
				"qty": qty,
				"stock_value": value,
				"reorder_level": reorder,
				"is_low": cint(is_low),
				"has_batch_no": cint(item.has_batch_no),
				"has_expiry_date": cint(item.has_expiry_date),
			}
		)

	stats = _adjustment_stats_by_item([r["item_code"] for r in rows], warehouse)
	for row in rows:
		meta = stats.get(row["item_code"]) or {}
		row["adj_count"] = cint(meta.get("adj_count"))
		row["last_adj_user"] = meta.get("last_user_name") or ""
		row["last_adj_date"] = meta.get("last_date")
		row["last_adj_at"] = meta.get("last_at")

	return {
		"rows": rows,
		"warehouse": warehouse,
		"company": _company(),
		"summary": {
			"sku_count": len(items),
			"low_stock": low_count,
			"zero_stock": zero_count,
			"batch_tracked": batch_count,
			"stock_value": total_value,
		},
	}


def get_stock_summary(
	from_date: str | None = None,
	to_date: str | None = None,
	warehouse: str | None = None,
	search: str | None = None,
	limit: int = 500,
) -> dict:
	"""Kartu stok ringkas per item+gudang untuk satu periode: Saldo Awal + Total
	In (Purchase Receipt) - Total Out (POS/Sales/BOM-consumption) + Adjustment
	(sisanya: transfer, opname, koreksi manual) = Saldo Akhir. Sumbernya Stock
	Ledger Entry; item di-scope ke "Bahan Baku" yang sama seperti list_stock_items()."""
	_require_stock_read()
	limit = cint(limit) or 500
	to_date = getdate(to_date) if to_date else getdate(today())
	from_date = getdate(from_date) if from_date else to_date.replace(day=1)
	if from_date > to_date:
		frappe.throw(_("Tanggal mulai tidak boleh setelah tanggal akhir"))

	filters: dict = {
		"is_stock_item": 1,
		"disabled": 0,
		"is_sales_item": 0,
		"has_variants": 0,
	}
	or_filters = None
	if search:
		term = f"%{search.strip()}%"
		or_filters = [
			["item_code", "like", term],
			["item_name", "like", term],
			["name", "like", term],
		]
	items = frappe.get_all(
		"Item",
		filters=filters,
		or_filters=or_filters,
		fields=["name", "item_name", "stock_uom"],
		order_by="item_name asc",
		limit_page_length=limit,
	)
	if not items and not search:
		items = frappe.get_all(
			"Item",
			filters={
				"is_stock_item": 1,
				"disabled": 0,
				"item_group": ["in", list(RAW_MATERIAL_ITEM_GROUPS)],
				"has_variants": 0,
			},
			fields=["name", "item_name", "stock_uom"],
			order_by="item_name asc",
			limit_page_length=limit,
		)
	item_codes = [i.name for i in items]
	if not item_codes:
		return {
			"rows": [],
			"from_date": str(from_date),
			"to_date": str(to_date),
			"warehouse": warehouse,
			"count": 0,
		}
	item_meta = {i.name: i for i in items}

	wh_clause = "and sle.warehouse = %(warehouse)s" if warehouse else ""
	wh_clause_bare = "and warehouse = %(warehouse)s" if warehouse else ""
	params = {
		"item_codes": item_codes,
		"from_date": from_date,
		"to_date": to_date,
		"warehouse": warehouse,
	}

	closing_rows = frappe.db.sql(
		f"""
		select item_code, warehouse, qty_after_transaction
		from (
			select
				item_code, warehouse, qty_after_transaction,
				row_number() over (
					partition by item_code, warehouse
					order by posting_date desc, posting_time desc, creation desc
				) as rn
			from `tabStock Ledger Entry`
			where is_cancelled = 0
				and item_code in %(item_codes)s
				and posting_date <= %(to_date)s
				{wh_clause_bare}
		) t
		where rn = 1
		""",
		params,
		as_dict=True,
	)
	closing_map = {(r.item_code, r.warehouse): flt(r.qty_after_transaction) for r in closing_rows}

	opening_rows = frappe.db.sql(
		f"""
		select item_code, warehouse, qty_after_transaction
		from (
			select
				item_code, warehouse, qty_after_transaction,
				row_number() over (
					partition by item_code, warehouse
					order by posting_date desc, posting_time desc, creation desc
				) as rn
			from `tabStock Ledger Entry`
			where is_cancelled = 0
				and item_code in %(item_codes)s
				and posting_date < %(from_date)s
				{wh_clause_bare}
		) t
		where rn = 1
		""",
		params,
		as_dict=True,
	)
	opening_map = {(r.item_code, r.warehouse): flt(r.qty_after_transaction) for r in opening_rows}

	# Only Purchase (in) and Sales (out) are summed directly — both have simple,
	# reliable delta semantics. Adjustment is deliberately *not* summed the same
	# way: some voucher types (e.g. Stock Reconciliation) don't always report
	# `actual_qty` as a straightforward running-balance delta, which can throw
	# an independently-summed "adjustment" bucket off by a little. Instead it's
	# derived as the residual (Closing - Opening - In + Out) below, so the
	# reconciliation always holds exactly by construction, whatever produced it.
	period_rows = frappe.db.sql(
		f"""
		select
			sle.item_code,
			sle.warehouse,
			sum(case when sle.voucher_type = 'Purchase Receipt' then sle.actual_qty else 0 end) as total_in,
			sum(case
				when sle.voucher_type in ('POS Invoice', 'Sales Invoice', 'Delivery Note') then -sle.actual_qty
				when sle.voucher_type = 'Stock Entry' and se.remarks like %(bom_tag)s then -sle.actual_qty
				else 0
			end) as total_out
		from `tabStock Ledger Entry` sle
		left join `tabStock Entry` se
			on sle.voucher_type = 'Stock Entry' and se.name = sle.voucher_no
		where sle.is_cancelled = 0
			and sle.item_code in %(item_codes)s
			and sle.posting_date between %(from_date)s and %(to_date)s
			{wh_clause}
		group by sle.item_code, sle.warehouse
		""",
		{**params, "bom_tag": f"{BOM_POS_REMARK_PREFIX}%"},
		as_dict=True,
	)
	period_map = {(r.item_code, r.warehouse): r for r in period_rows}

	out = []
	for (item_code, wh), closing in closing_map.items():
		opening = opening_map.get((item_code, wh), 0)
		period = period_map.get((item_code, wh))
		total_in = flt(period.total_in) if period else 0
		total_out = flt(period.total_out) if period else 0
		meta = item_meta.get(item_code)
		out.append(
			{
				"item_code": item_code,
				"item_name": (meta.item_name if meta else None) or item_code,
				"uom": meta.stock_uom if meta else None,
				"warehouse": wh,
				"opening": opening,
				"total_in": total_in,
				"total_out": total_out,
				"adjustment": closing - opening - total_in + total_out,
				"closing": closing,
			}
		)

	out.sort(key=lambda r: (r["item_name"] or "", r["warehouse"] or ""))
	return {
		"rows": out,
		"from_date": str(from_date),
		"to_date": str(to_date),
		"warehouse": warehouse,
		"count": len(out),
	}


def get_item_stock_summary(
	item_code: str,
	warehouse: str | None = None,
	from_date: str | None = None,
	to_date: str | None = None,
) -> dict:
	"""Ringkasan Saldo Awal/Total In/Total Out/Adjustment/Saldo Akhir untuk SATU
	item pada satu periode — versi single-item dari get_stock_summary(), dipakai
	untuk melengkapi export Riwayat Stok. Kalau `warehouse` kosong, digabung
	dari semua gudang tempat item ini pernah bergerak."""
	_require_stock_read()
	item_code = (item_code or "").strip()
	if not item_code:
		frappe.throw(_("Item wajib diisi"))
	to_date = getdate(to_date) if to_date else getdate(today())
	from_date = getdate(from_date) if from_date else to_date.replace(day=1)

	wh_clause = "and warehouse = %(warehouse)s" if warehouse else ""
	wh_clause_sle = "and sle.warehouse = %(warehouse)s" if warehouse else ""
	params = {
		"item_code": item_code,
		"from_date": from_date,
		"to_date": to_date,
		"warehouse": warehouse,
	}

	closing = flt(
		frappe.db.sql(
			f"""
			select coalesce(sum(qty_after_transaction), 0)
			from (
				select warehouse, qty_after_transaction,
					row_number() over (
						partition by warehouse order by posting_date desc, posting_time desc, creation desc
					) as rn
				from `tabStock Ledger Entry`
				where is_cancelled = 0 and item_code = %(item_code)s and posting_date <= %(to_date)s {wh_clause}
			) t where rn = 1
			""",
			params,
		)[0][0]
	)
	opening = flt(
		frappe.db.sql(
			f"""
			select coalesce(sum(qty_after_transaction), 0)
			from (
				select warehouse, qty_after_transaction,
					row_number() over (
						partition by warehouse order by posting_date desc, posting_time desc, creation desc
					) as rn
				from `tabStock Ledger Entry`
				where is_cancelled = 0 and item_code = %(item_code)s and posting_date < %(from_date)s {wh_clause}
			) t where rn = 1
			""",
			params,
		)[0][0]
	)
	period = frappe.db.sql(
		f"""
		select
			coalesce(sum(case when sle.voucher_type = 'Purchase Receipt' then sle.actual_qty else 0 end), 0) as total_in,
			coalesce(sum(case
				when sle.voucher_type in ('POS Invoice', 'Sales Invoice', 'Delivery Note') then -sle.actual_qty
				when sle.voucher_type = 'Stock Entry' and se.remarks like %(bom_tag)s then -sle.actual_qty
				else 0
			end), 0) as total_out
		from `tabStock Ledger Entry` sle
		left join `tabStock Entry` se
			on sle.voucher_type = 'Stock Entry' and se.name = sle.voucher_no
		where sle.is_cancelled = 0 and sle.item_code = %(item_code)s
			and sle.posting_date between %(from_date)s and %(to_date)s
			{wh_clause_sle}
		""",
		{**params, "bom_tag": f"{BOM_POS_REMARK_PREFIX}%"},
		as_dict=True,
	)
	total_in = flt(period[0].total_in) if period else 0
	total_out = flt(period[0].total_out) if period else 0

	return {
		"item_code": item_code,
		"warehouse": warehouse,
		"from_date": str(from_date),
		"to_date": str(to_date),
		"opening": opening,
		"total_in": total_in,
		"total_out": total_out,
		"adjustment": closing - opening - total_in + total_out,
		"closing": closing,
	}


def _empty_summary() -> dict:
	return {
		"sku_count": 0,
		"low_stock": 0,
		"zero_stock": 0,
		"batch_tracked": 0,
		"stock_value": 0,
	}


def _is_waste_or_spoilage_remark(remarks: str | None) -> bool:
	text = (remarks or "").lower()
	hints = ("waste", "spoil", "rusak", "busuk", "kadaluarsa", "expired", "buang")
	return any(h in text for h in hints)


def _classify_issue_kind(remarks: str | None) -> str:
	text = (remarks or "").lower()
	if "spoil" in text or "busuk" in text:
		return "spoilage"
	return "waste"


def _normalize_file_urls(file_urls) -> list[str]:
	if not file_urls:
		return []
	if isinstance(file_urls, str):
		try:
			parsed = frappe.parse_json(file_urls)
			if isinstance(parsed, list):
				file_urls = parsed
			else:
				file_urls = [file_urls]
		except Exception:
			file_urls = [file_urls]
	urls = []
	for u in file_urls:
		url = (u or "").strip() if isinstance(u, str) else ""
		if url and url not in urls:
			urls.append(url)
	return urls


def _attach_files_to_doc(doctype: str, name: str, file_urls: list[str]) -> list[dict]:
	"""Link uploaded File rows to a document. Returns attachment meta for UI."""
	attached = []
	for file_url in file_urls:
		existing = frappe.get_all(
			"File",
			filters={"file_url": file_url},
			fields=["name", "file_name", "file_url", "is_private"],
			order_by="creation desc",
			limit=1,
		)
		if existing:
			file_doc = frappe.get_doc("File", existing[0].name)
			file_doc.attached_to_doctype = doctype
			file_doc.attached_to_name = name
			file_doc.is_private = 1
			file_doc.save(ignore_permissions=True)
		else:
			file_doc = frappe.get_doc(
				{
					"doctype": "File",
					"file_url": file_url,
					"attached_to_doctype": doctype,
					"attached_to_name": name,
					"is_private": 1,
				}
			)
			file_doc.insert(ignore_permissions=True)
		attached.append(
			{
				"file_url": file_doc.file_url,
				"file_name": file_doc.file_name or file_doc.file_url,
			}
		)
	return attached


def _attachments_for(doctype: str, names: list[str]) -> dict[str, list[dict]]:
	if not names:
		return {}
	rows = frappe.get_all(
		"File",
		filters={"attached_to_doctype": doctype, "attached_to_name": ["in", names]},
		fields=["attached_to_name", "file_url", "file_name"],
		order_by="creation asc",
	)
	out: dict[str, list[dict]] = {}
	for r in rows:
		out.setdefault(r.attached_to_name, []).append(
			{"file_url": r.file_url, "file_name": r.file_name or r.file_url}
		)
	return out


def _dedupe_attachments(*lists) -> list[dict]:
	"""Gabungkan lampiran tanpa dobel (file_url sama)."""
	seen: set[str] = set()
	out: list[dict] = []
	for lst in lists:
		for a in lst or []:
			key = (a.get("file_url") or "").strip()
			if not key or key in seen:
				continue
			seen.add(key)
			out.append(a)
	return out


def _stock_entry_outgoing_value(name: str, header_value: float = 0, lines: list | None = None) -> float:
	"""Nilai outgoing SE — fallback ke SLE / amount baris kalau header masih 0 setelah submit."""
	val = flt(header_value)
	if val:
		return val
	if lines:
		val = sum(flt(getattr(l, "amount", None) or (l.get("amount") if isinstance(l, dict) else 0)) for l in lines)
		if val:
			return val
	val = flt(
		frappe.db.sql(
			"""
			select coalesce(sum(abs(stock_value_difference)), 0)
			from `tabStock Ledger Entry`
			where voucher_type = 'Stock Entry' and voucher_no = %s and is_cancelled = 0
			""",
			name,
		)[0][0]
	)
	if val:
		return val
	return flt(
		frappe.db.sql(
			"""
			select coalesce(sum(abs(amount)), 0)
			from `tabStock Entry Detail`
			where parent = %s
			""",
			name,
		)[0][0]
	)


def list_recent_issues(limit: int = 50, waste_only: int = 1) -> dict:
	"""Pending approval + Material Issue waste/spoilage (bukan konsumsi BOM)."""
	_require_stock_read()
	limit = cint(limit) or 50
	company = _company()

	# Pending / rejected requests first (stok belum / tidak berubah)
	pending_docs = frappe.get_all(
		"IMOGI POS Approval Request",
		filters={"approval_type": ["in", ["Waste", "Spoilage"]], "status": ["in", ["Pending", "Rejected"]]},
		fields=[
			"name",
			"approval_type",
			"status",
			"reason",
			"payload_json",
			"requested_by",
			"approved_by",
			"approved_at",
			"creation",
			"modified",
			"reference_name",
		],
		order_by="creation desc",
		limit_page_length=limit,
	)
	req_attach = _attachments_for(
		"IMOGI POS Approval Request", [d.name for d in pending_docs]
	)
	owner_ids = {d.requested_by for d in pending_docs if d.requested_by}
	full_names = {}
	if owner_ids:
		for u in frappe.get_all(
			"User", filters={"name": ["in", list(owner_ids)]}, fields=["name", "full_name"]
		):
			full_names[u.name] = u.full_name or u.name

	rows = []
	for doc in pending_docs:
		payload = {}
		try:
			payload = frappe.parse_json(doc.payload_json) or {}
		except Exception:
			payload = {}
		kind = "spoilage" if doc.approval_type == "Spoilage" else "waste"
		item_code = payload.get("item_code") or ""
		item_name = (
			payload.get("item_name")
			or (frappe.db.get_value("Item", item_code, "item_name") if item_code else None)
			or item_code
			or "—"
		)
		rows.append(
			{
				"row_type": "approval",
				"name": doc.name,
				"approval_request": doc.name,
				"stock_entry": doc.reference_name or None,
				"status": doc.status,
				"posting_date": str(getdate(doc.creation)) if doc.creation else None,
				"creation": doc.creation,
				"remarks": doc.reason or payload.get("remarks") or "",
				"kind": kind,
				"total_value": 0,
				"owner": doc.requested_by,
				"owner_name": full_names.get(doc.requested_by) or doc.requested_by,
				"approved_by": doc.approved_by,
				"item_count": 1 if item_code else 0,
				"items": [
					{
						"item_code": item_code,
						"item_name": item_name,
						"qty": flt(payload.get("qty")),
						"uom": payload.get("uom") or "",
						"amount": 0,
					}
				]
				if item_code
				else [],
				"attachments": req_attach.get(doc.name) or [],
				"can_approve": doc.status == "Pending",
			}
		)

	# Posted stock entries
	filters: dict = {"docstatus": 1, "purpose": "Material Issue"}
	if company:
		filters["company"] = company
	fetch_limit = max(limit, 50) * (4 if cint(waste_only) else 1)
	entries = frappe.get_all(
		"Stock Entry",
		filters=filters,
		fields=["name", "posting_date", "remarks", "total_outgoing_value", "modified", "owner", "creation"],
		order_by="modified desc",
		limit_page_length=min(fetch_limit, 200),
	)
	if cint(waste_only):
		entries = [e for e in entries if _is_waste_or_spoilage_remark(e.remarks)]
	entries = entries[:limit]
	names = [e.name for e in entries]
	items_by_parent: dict[str, list] = {}
	if names:
		for row in frappe.get_all(
			"Stock Entry Detail",
			filters={"parent": ["in", names]},
			fields=["parent", "item_code", "item_name", "qty", "uom", "amount", "s_warehouse"],
		):
			items_by_parent.setdefault(row.parent, []).append(row)
	se_attach = _attachments_for("Stock Entry", names)

	# Map approved requests → stock entry for bukti on posted rows
	approved_by_se = {}
	if names:
		for ar in frappe.get_all(
			"IMOGI POS Approval Request",
			filters={
				"approval_type": ["in", ["Waste", "Spoilage"]],
				"status": "Approved",
				"reference_name": ["in", names],
			},
			fields=["name", "reference_name"],
		):
			approved_by_se[ar.reference_name] = ar.name
		ar_names = list(approved_by_se.values())
		ar_attach = _attachments_for("IMOGI POS Approval Request", ar_names)
	else:
		ar_attach = {}

	for entry in entries:
		lines = items_by_parent.get(entry.name) or []
		kind = _classify_issue_kind(entry.remarks)
		ar_name = approved_by_se.get(entry.name)
		# Jangan gabung AR+SE mentah — file disalin ke SE saat approve, hasilnya double di UI
		attachments = _dedupe_attachments(
			se_attach.get(entry.name),
			ar_attach.get(ar_name) if ar_name else None,
		)
		rows.append(
			{
				"row_type": "stock_entry",
				"name": entry.name,
				"approval_request": ar_name,
				"stock_entry": entry.name,
				"status": "Approved",
				"posting_date": str(entry.posting_date) if entry.posting_date else None,
				"creation": entry.creation or entry.modified,
				"remarks": entry.remarks or "",
				"kind": kind,
				"total_value": _stock_entry_outgoing_value(
					entry.name, entry.total_outgoing_value, lines
				),
				"owner": entry.owner,
				"item_count": len(lines),
				"items": [
					{
						"item_code": line.item_code,
						"item_name": line.item_name or line.item_code,
						"qty": flt(line.qty),
						"uom": line.uom,
						"amount": flt(line.amount),
					}
					for line in lines[:8]
				],
				"attachments": attachments,
				"can_approve": False,
			}
		)

	# Pending dulu, lalu terbaru di atas
	def _sort_key(r):
		status_rank = 0 if r.get("status") == "Pending" else 1 if r.get("status") == "Rejected" else 2
		try:
			ts = get_datetime(r.get("creation")).timestamp() if r.get("creation") else 0
		except Exception:
			ts = 0
		return (status_rank, -ts)

	rows.sort(key=_sort_key)
	rows = rows[:limit]
	pending_count = sum(1 for r in rows if r.get("status") == "Pending")
	return {
		"rows": rows,
		"count": len(rows),
		"pending_count": pending_count,
		"waste_only": cint(waste_only),
	}


def create_waste_or_spoilage(
	item_code: str,
	qty: float,
	warehouse: str | None = None,
	reason: str | None = None,
	kind: str = "waste",
	file_urls=None,
) -> dict:
	"""Ajukan Waste/Spoilage: butuh bukti → Pending approval. Stok turun setelah HO approve."""
	if not frappe.has_permission("Stock Entry", "create"):
		frappe.throw(_("Tidak punya akses membuat Stock Entry"), frappe.PermissionError)
	kind = (kind or "waste").lower()
	if kind not in ("waste", "spoilage"):
		kind = "waste"
	label = "Spoilage" if kind == "spoilage" else "Waste"
	approval_type = "Spoilage" if kind == "spoilage" else "Waste"

	item_code = (item_code or "").strip()
	qty = flt(qty)
	if not item_code or qty <= 0:
		frappe.throw(_("Item dan qty wajib diisi"))

	urls = _normalize_file_urls(file_urls)
	if not urls:
		frappe.throw(_("Upload bukti (foto/dokumen) wajib untuk Waste/Spoilage"))

	warehouse = _warehouse(warehouse)
	if not warehouse:
		frappe.throw(_("Gudang default belum diset"))

	reason = (reason or "").strip()
	remarks = f"{label}: {reason}" if reason else _("{0} dari Inventory Hub").format(label)
	item_name = frappe.db.get_value("Item", item_code, "item_name") or item_code
	uom = frappe.db.get_value("Item", item_code, "stock_uom") or ""

	request_name = create_approval_request(
		approval_type=approval_type,
		reference_name=None,
		reason=remarks,
		amount=0,
		payload={
			"item_code": item_code,
			"item_name": item_name,
			"qty": qty,
			"uom": uom,
			"warehouse": warehouse,
			"kind": kind,
			"remarks": remarks,
			"source": "inventory_hub",
		},
	)
	attachments = _attach_files_to_doc("IMOGI POS Approval Request", request_name, urls)
	return {
		"approval_request": request_name,
		"status": "Pending",
		"stock_entry": None,
		"kind": kind,
		"remarks": remarks,
		"attachments": attachments,
		"message": _(
			"Pengajuan {0} menunggu approval HO. Stok belum berkurang."
		).format(label),
	}


ADJ_REMARK_TAG = "[IMOGI-ADJ]"
# Must match imogi_pos.imogi_pos.utils.bom_stock._bom_stock_entry_remarks()'s prefix.
BOM_POS_REMARK_PREFIX = "IMOGI BOM POS:"


def create_stock_adjustment(
	item_code: str,
	qty_fisik: float,
	warehouse: str | None = None,
	reason: str | None = None,
) -> dict:
	"""Koreksi stok: input qty fisik (hasil hitung), sistem bandingin sama qty saat ini
	(live dari Bin) dan langsung sesuaikan selisihnya — instan, gak butuh approval."""
	if not frappe.has_permission("Stock Entry", "create"):
		frappe.throw(_("Tidak punya akses membuat Stock Entry"), frappe.PermissionError)
	warehouse = _warehouse(warehouse)
	if not warehouse:
		frappe.throw(_("Gudang default belum diset"))
	if not item_code:
		frappe.throw(_("Item wajib diisi"))
	qty_fisik = flt(qty_fisik)
	if qty_fisik < 0:
		frappe.throw(_("Qty fisik tidak boleh negatif"))
	reason = (reason or "").strip()
	if not reason:
		frappe.throw(_("Alasan wajib diisi untuk adjustment"))

	system_qty = flt(
		frappe.db.get_value("Bin", {"item_code": item_code, "warehouse": warehouse}, "actual_qty") or 0
	)
	diff = qty_fisik - system_qty
	if diff == 0:
		frappe.throw(_("Qty fisik sama dengan qty sistem — tidak ada selisih untuk disesuaikan"))

	result = submit_stock_adjustment(item_code, diff, warehouse=warehouse, reason=reason)
	result["status"] = "Approved"
	result["approval_request"] = None
	result["qty_fisik"] = qty_fisik
	result["system_qty"] = system_qty
	result["diff"] = diff
	return result


def submit_stock_adjustment(
	item_code: str,
	qty: float,
	warehouse: str | None = None,
	reason: str | None = None,
) -> dict:
	"""Create & submit Stock Entry adjustment — dipanggil langsung (qty positif) atau
	setelah HO approve (qty negatif)."""
	settings = _settings()
	warehouse = _warehouse(warehouse)
	if not warehouse:
		frappe.throw(_("Gudang default belum diset"))
	qty = flt(qty)
	if not item_code or qty == 0:
		frappe.throw(_("Item dan qty wajib diisi"))

	abs_qty = abs(qty)
	if qty < 0:
		purpose = "Material Issue"
		item_row = {"item_code": item_code, "qty": abs_qty, "s_warehouse": warehouse}
	else:
		purpose = "Material Receipt"
		item_row = {"item_code": item_code, "qty": abs_qty, "t_warehouse": warehouse}

	user = frappe.session.user
	note = (reason or "").strip() or _("Adjustment Inventory Hub")
	remarks = f"{ADJ_REMARK_TAG} {note} | by {user}"

	se = frappe.get_doc(
		{
			"doctype": "Stock Entry",
			"stock_entry_type": purpose,
			"purpose": purpose,
			"company": settings.default_company,
			"items": [item_row],
			"remarks": remarks,
		}
	)
	se.insert(ignore_permissions=True)
	# This path is HO's own direct correction (see docstring) — the same person
	# executing it would just be approving themselves, so it always bypasses the
	# merchant's Enable Approval Workflow gate regardless of who's logged in.
	se.flags.imogi_approval_ok = True
	se.submit()
	return {
		"stock_entry": se.name,
		"purpose": purpose,
		"qty": qty,
		"item_code": item_code,
		"warehouse": warehouse,
		"user": user,
		"remarks": remarks,
	}


def list_item_stock_ledger(
	item_code: str,
	warehouse: str | None = None,
	limit: int = 100,
) -> dict:
	"""Riwayat mutasi stok lengkap untuk satu item — penjualan POS, purchase
	receiving, transfer antar gudang, opname, dan adjustment manual — dibaca
	langsung dari Stock Ledger Entry (sumber kebenaran stok bawaan ERPNext),
	bukan cuma adjustment manual seperti sebelumnya. `warehouse` cuma jadi
	filter kalau diisi eksplisit; tidak default ke gudang toko, supaya
	transfer antar-cabang tetap kelihatan."""
	_require_stock_read()
	item_code = (item_code or "").strip()
	if not item_code:
		frappe.throw(_("Item wajib diisi"))
	limit = cint(limit) or 100

	filters: dict = {"item_code": item_code, "is_cancelled": 0}
	if warehouse:
		filters["warehouse"] = warehouse

	rows = frappe.get_all(
		"Stock Ledger Entry",
		filters=filters,
		fields=[
			"name",
			"posting_date",
			"posting_time",
			"creation",
			"voucher_type",
			"voucher_no",
			"warehouse",
			"actual_qty",
			"qty_after_transaction",
		],
		order_by="posting_date desc, posting_time desc, creation desc",
		limit_page_length=limit,
	)

	by_type: dict[str, set[str]] = {}
	for r in rows:
		by_type.setdefault(r.voucher_type, set()).add(r.voucher_no)

	doc_info: dict[str, dict] = {}
	if by_type.get("Purchase Receipt"):
		for d in frappe.get_all(
			"Purchase Receipt",
			filters={"name": ["in", list(by_type["Purchase Receipt"])]},
			fields=["name", "owner", "supplier", "supplier_name"],
		):
			doc_info[d.name] = d
	for dt in ("POS Invoice", "Sales Invoice", "Delivery Note"):
		if by_type.get(dt):
			for d in frappe.get_all(
				dt,
				filters={"name": ["in", list(by_type[dt])]},
				fields=["name", "owner", "customer", "customer_name"],
			):
				doc_info[d.name] = d
	if by_type.get("Stock Entry"):
		for d in frappe.get_all(
			"Stock Entry",
			filters={"name": ["in", list(by_type["Stock Entry"])]},
			fields=["name", "owner", "purpose", "remarks"],
		):
			doc_info[d.name] = d
	if by_type.get("Stock Reconciliation"):
		for d in frappe.get_all(
			"Stock Reconciliation",
			filters={"name": ["in", list(by_type["Stock Reconciliation"])]},
			fields=["name", "owner"],
		):
			doc_info[d.name] = d

	se_detail: dict[str, dict] = {}
	if by_type.get("Stock Entry"):
		for d in frappe.get_all(
			"Stock Entry Detail",
			filters={"parent": ["in", list(by_type["Stock Entry"])], "item_code": item_code},
			fields=["parent", "s_warehouse", "t_warehouse", "uom"],
		):
			se_detail.setdefault(d.parent, d)

	# Selling a recipe/menu item doesn't touch the raw ingredient's Stock Ledger
	# directly — imogi_pos.utils.bom_stock.consume_bom_for_pos_invoice() issues a
	# separate Stock Entry tagged "IMOGI BOM POS:<pos invoice>:<item>" for that.
	# Recognise it here so it reads as a sale, not a generic adjustment.
	pos_invoice_by_se: dict[str, str] = {}
	if by_type.get("Stock Entry"):
		for se_name in by_type["Stock Entry"]:
			se_remarks = (doc_info.get(se_name) or {}).get("remarks") or ""
			if se_remarks.startswith(BOM_POS_REMARK_PREFIX):
				pos_invoice_by_se[se_name] = se_remarks[len(BOM_POS_REMARK_PREFIX) :].split(":")[0]

	pos_customer_by_invoice: dict[str, str] = {}
	pos_invoice_names = set(pos_invoice_by_se.values())
	if pos_invoice_names:
		for d in frappe.get_all(
			"POS Invoice",
			filters={"name": ["in", list(pos_invoice_names)]},
			fields=["name", "customer", "customer_name"],
		):
			pos_customer_by_invoice[d.name] = d.customer_name or d.customer

	owner_ids = {d.owner for d in doc_info.values() if d.owner}
	full_names: dict[str, str] = {}
	if owner_ids:
		for u in frappe.get_all(
			"User", filters={"name": ["in", list(owner_ids)]}, fields=["name", "full_name"]
		):
			full_names[u.name] = u.full_name or u.name

	out = []
	touched_users: set[str] = set()
	for r in rows:
		qty = flt(r.actual_qty)
		wh = r.warehouse
		vtype = r.voucher_type
		vno = r.voucher_no
		info = doc_info.get(vno)
		owner_name = full_names.get(info.get("owner")) if info and info.get("owner") else None
		from_label = None
		to_label = None
		uom = None
		note = vtype

		if vtype == "Purchase Receipt":
			from_label = (info.get("supplier_name") or info.get("supplier")) if info else vno
			to_label = wh
			note = _("Purchase Receipt")
		elif vtype in ("POS Invoice", "Sales Invoice", "Delivery Note"):
			from_label = wh
			to_label = (info.get("customer_name") or info.get("customer")) if info else vno
			note = _("Penjualan (POS)") if vtype == "POS Invoice" else _("Penjualan")
		elif vtype == "Stock Entry":
			sed = se_detail.get(vno)
			uom = sed.get("uom") if sed else None
			remarks = (info.get("remarks") or "") if info else ""
			purpose = info.get("purpose") if info else None
			if sed and sed.get("s_warehouse") and sed.get("t_warehouse"):
				from_label = sed.get("s_warehouse")
				to_label = sed.get("t_warehouse")
				note = _("Transfer Gudang")
			elif vno in pos_invoice_by_se:
				pos_invoice_name = pos_invoice_by_se[vno]
				from_label = wh
				to_label = pos_customer_by_invoice.get(pos_invoice_name) or pos_invoice_name
				note = _("Penjualan (POS)")
			elif ADJ_REMARK_TAG in remarks:
				tag_note = remarks.replace(ADJ_REMARK_TAG, "").strip()
				if "| by " in tag_note:
					tag_note = tag_note.split("| by ", 1)[0].strip()
				note = tag_note or _("Adjustment")
				if qty >= 0:
					to_label = wh
					from_label = _("Adjustment")
				else:
					from_label = wh
					to_label = _("Adjustment")
			else:
				note = purpose or _("Stock Entry")
				if qty >= 0:
					to_label = wh
					from_label = _("Adjustment")
				else:
					from_label = wh
					to_label = _("Adjustment")
		elif vtype == "Stock Reconciliation":
			note = _("Stock Opname")
			if qty >= 0:
				to_label = wh
				from_label = _("Opname")
			else:
				from_label = wh
				to_label = _("Opname")
		else:
			if qty >= 0:
				to_label = wh
				from_label = note
			else:
				from_label = wh
				to_label = note

		if owner_name:
			touched_users.add(owner_name)

		out.append(
			{
				"name": vno,
				"voucher_type": vtype,
				"posting_date": r.posting_date,
				"creation": r.creation,
				"qty": qty,
				"balance_after": flt(r.qty_after_transaction),
				"uom": uom,
				"from_warehouse": from_label,
				"to_warehouse": to_label,
				"remarks": note,
				"owner": info.get("owner") if info else None,
				"owner_name": owner_name,
			}
		)

	item_name = frappe.db.get_value("Item", item_code, "item_name") or item_code
	return {
		"item_code": item_code,
		"item_name": item_name,
		"warehouse": warehouse,
		"rows": out,
		"count": len(out),
		"users": sorted(touched_users),
	}


def list_adjustment_requests(limit: int = 100) -> dict:
	"""Pending/rejected approval (adjustment negatif) + riwayat adjustment semua item."""
	_require_stock_read()
	limit = cint(limit) or 100

	pending_docs = frappe.get_all(
		"IMOGI POS Approval Request",
		filters={"approval_type": "Adjustment", "status": ["in", ["Pending", "Rejected"]]},
		fields=[
			"name",
			"status",
			"reason",
			"payload_json",
			"requested_by",
			"approved_by",
			"approved_at",
			"creation",
			"reference_name",
		],
		order_by="creation desc",
		limit_page_length=limit,
	)

	fetch_limit = max(limit, 100)
	entries = frappe.db.sql(
		"""
		select se.name, se.purpose, se.posting_date, se.creation, se.owner, se.remarks,
			sei.item_code, sei.qty, sei.uom
		from `tabStock Entry` se
		inner join `tabStock Entry Detail` sei on sei.parent = se.name
		where se.docstatus = 1 and se.remarks like %(tag)s
		order by se.creation desc
		limit %(limit)s
		""",
		{"tag": f"%{ADJ_REMARK_TAG}%", "limit": min(fetch_limit, 300)},
		as_dict=True,
	)

	def _parse_payload(payload_json):
		try:
			return frappe.parse_json(payload_json) or {}
		except Exception:
			return {}

	item_codes = {
		_parse_payload(doc.payload_json).get("item_code")
		for doc in pending_docs
		if _parse_payload(doc.payload_json).get("item_code")
	}
	item_codes |= {e.item_code for e in entries if e.item_code}
	item_names = {}
	if item_codes:
		for it in frappe.get_all(
			"Item", filters={"name": ["in", list(item_codes)]}, fields=["name", "item_name"]
		):
			item_names[it.name] = it.item_name or it.name

	owner_ids = {d.requested_by for d in pending_docs if d.requested_by}
	owner_ids |= {e.owner for e in entries if e.owner}
	full_names = {}
	if owner_ids:
		for u in frappe.get_all(
			"User", filters={"name": ["in", list(owner_ids)]}, fields=["name", "full_name"]
		):
			full_names[u.name] = u.full_name or u.name

	rows = []
	for doc in pending_docs:
		payload = _parse_payload(doc.payload_json)
		item_code = payload.get("item_code") or ""
		rows.append(
			{
				"row_type": "approval",
				"name": doc.name,
				"approval_request": doc.name,
				"stock_entry": doc.reference_name or None,
				"status": doc.status,
				"posting_date": str(getdate(doc.creation)) if doc.creation else None,
				"creation": doc.creation,
				"item_code": item_code,
				"item_name": item_names.get(item_code) or item_code,
				"qty": flt(payload.get("qty")),
				"uom": "",
				"remarks": doc.reason or payload.get("reason") or "",
				"owner_name": full_names.get(doc.requested_by) or doc.requested_by,
				"can_approve": doc.status == "Pending",
			}
		)

	for e in entries:
		signed_qty = flt(e.qty)
		if e.purpose == "Material Issue":
			signed_qty = -signed_qty
		note = (e.remarks or "").replace(ADJ_REMARK_TAG, "").strip()
		if "| by " in note:
			note = note.split("| by ", 1)[0].strip()
		rows.append(
			{
				"row_type": "stock_entry",
				"name": e.name,
				"approval_request": None,
				"stock_entry": e.name,
				"status": "Approved",
				"posting_date": str(e.posting_date) if e.posting_date else None,
				"creation": e.creation,
				"item_code": e.item_code,
				"item_name": item_names.get(e.item_code) or e.item_code,
				"qty": signed_qty,
				"uom": e.uom or "",
				"remarks": note,
				"owner_name": full_names.get(e.owner) or e.owner,
				"can_approve": False,
			}
		)

	def _sort_key(r):
		status_rank = 0 if r.get("status") == "Pending" else 1 if r.get("status") == "Rejected" else 2
		try:
			ts = get_datetime(r.get("creation")).timestamp() if r.get("creation") else 0
		except Exception:
			ts = 0
		return (status_rank, -ts)

	rows.sort(key=_sort_key)
	rows = rows[:limit]
	pending_count = sum(1 for r in rows if r.get("status") == "Pending")
	return {"rows": rows, "count": len(rows), "pending_count": pending_count}


def _adjustment_stats_by_item(item_codes: list[str], warehouse: str | None) -> dict[str, dict]:
	"""Map item_code → {count, last_user, last_at} from tagged Hub adjustments."""
	if not item_codes:
		return {}
	rows = frappe.db.sql(
		"""
		select
			sei.item_code,
			count(*) as adj_count,
			substring_index(group_concat(se.owner order by se.creation desc), ',', 1) as last_user,
			substring_index(group_concat(se.posting_date order by se.creation desc), ',', 1) as last_date,
			max(se.creation) as last_at
		from `tabStock Entry` se
		inner join `tabStock Entry Detail` sei on sei.parent = se.name
		where se.docstatus = 1
			and sei.item_code in %(codes)s
			and se.remarks like %(tag)s
			{wh_clause}
		group by sei.item_code
		""".format(
			wh_clause=(
				"and (sei.s_warehouse = %(wh)s or sei.t_warehouse = %(wh)s)"
				if warehouse
				else ""
			)
		),
		{"codes": item_codes, "tag": f"%{ADJ_REMARK_TAG}%", "wh": warehouse},
		as_dict=True,
	)
	owners = list({r.last_user for r in rows if r.last_user})
	names = {}
	if owners:
		for u in frappe.get_all(
			"User", filters={"name": ["in", owners]}, fields=["name", "full_name"]
		):
			names[u.name] = u.full_name or u.name
	return {
		r.item_code: {
			"adj_count": cint(r.adj_count),
			"last_user": r.last_user,
			"last_user_name": names.get(r.last_user) or r.last_user,
			"last_date": r.last_date,
			"last_at": r.last_at,
		}
		for r in rows
	}


def create_opname(
	items: list | str | None = None,
	warehouse: str | None = None,
	posting_date: str | None = None,
	file_urls=None,
) -> dict:
	"""Ajukan Opname (hitung fisik) → butuh approval HO. Stok belum berubah sampai di-approve."""
	if not frappe.has_permission("Stock Reconciliation", "create"):
		frappe.throw(_("Tidak punya akses Stock Reconciliation"), frappe.PermissionError)
	if isinstance(items, str):
		items = frappe.parse_json(items)
	items = items or []
	if not items:
		frappe.throw(_("Minimal satu item untuk opname"))

	urls = _normalize_file_urls(file_urls)
	if not urls:
		frappe.throw(_("Upload bukti (foto/dokumen) hasil hitung fisik wajib untuk Opname"))

	warehouse = _warehouse(warehouse)
	if not warehouse:
		frappe.throw(_("Gudang default belum diset"))

	codes = [row.get("item_code") for row in items if isinstance(row, dict) and row.get("item_code")]
	system_qty: dict[str, float] = {}
	if codes:
		for row in frappe.db.sql(
			"""
			select item_code, actual_qty
			from `tabBin`
			where warehouse = %(warehouse)s and item_code in %(codes)s
			""",
			{"warehouse": warehouse, "codes": codes},
			as_dict=True,
		):
			system_qty[row.item_code] = flt(row.actual_qty)

	item_info: dict[str, dict] = {}
	if codes:
		for row in frappe.get_all(
			"Item", filters={"name": ["in", codes]}, fields=["name", "item_name", "stock_uom"]
		):
			item_info[row.name] = row

	rows = []
	diff_count = 0
	for row in items:
		code = row.get("item_code") if isinstance(row, dict) else None
		qty = flt(row.get("qty")) if isinstance(row, dict) else 0
		if not code:
			continue
		sys_qty = system_qty.get(code, 0)
		info = item_info.get(code) or {}
		if flt(qty) != flt(sys_qty):
			diff_count += 1
		rows.append(
			{
				"item_code": code,
				"item_name": info.get("item_name") or code,
				"uom": info.get("stock_uom") or "",
				"qty": qty,
				"system_qty": sys_qty,
				"diff": flt(qty) - flt(sys_qty),
			}
		)
	if not rows:
		frappe.throw(_("Tidak ada item valid untuk opname"))
	if diff_count == 0:
		frappe.throw(
			_(
				"Tidak ada perubahan qty — semua item hasil hitung fisik sama dengan qty sistem. "
				"Opname tidak perlu diajukan."
			)
		)

	remarks = _("Opname {0} item ({1} selisih)").format(len(rows), diff_count)
	request_name = create_approval_request(
		approval_type="Opname",
		reference_name=None,
		reason=remarks,
		amount=0,
		payload={
			"items": rows,
			"warehouse": warehouse,
			"posting_date": posting_date or nowdate(),
			"remarks": remarks,
		},
	)
	attachments = _attach_files_to_doc("IMOGI POS Approval Request", request_name, urls)
	return {
		"approval_request": request_name,
		"status": "Pending",
		"stock_reconciliation": None,
		"item_count": len(rows),
		"diff_count": diff_count,
		"attachments": attachments,
		"message": _("Pengajuan opname menunggu approval HO. Stok belum berubah."),
	}


def submit_opname_reconciliation(
	items: list,
	warehouse: str | None = None,
	posting_date: str | None = None,
) -> str:
	"""Create & submit Stock Reconciliation dari payload opname yang sudah di-approve HO."""
	settings = _settings()
	warehouse = _warehouse(warehouse)
	if not warehouse:
		frappe.throw(_("Gudang default belum diset"))

	rows = []
	for row in items or []:
		code = row.get("item_code") if isinstance(row, dict) else None
		qty = flt(row.get("qty")) if isinstance(row, dict) else 0
		if not code:
			continue
		rows.append(
			{
				"item_code": code,
				"warehouse": warehouse,
				"qty": qty,
				"allow_zero_valuation_rate": 1,
			}
		)
	if not rows:
		frappe.throw(_("Tidak ada item valid untuk opname"))

	doc = frappe.get_doc(
		{
			"doctype": "Stock Reconciliation",
			"company": settings.default_company,
			"purpose": "Stock Reconciliation",
			"posting_date": posting_date or nowdate(),
			"items": rows,
		}
	)
	try:
		doc.insert(ignore_permissions=True)
	except Exception as e:
		if "EmptyStockReconciliationItemsError" in type(e).__name__:
			frappe.throw(
				_(
					"Stok sudah berubah sejak opname ini diajukan, sehingga tidak ada lagi selisih untuk "
					"disesuaikan. Reject pengajuan ini."
				)
			)
		raise
	doc.submit()
	return doc.name


def list_opname_requests(limit: int = 50) -> dict:
	"""Pending/rejected approval + Stock Reconciliation yang sudah di-approve dari Opname."""
	_require_stock_read()
	limit = cint(limit) or 50

	pending_docs = frappe.get_all(
		"IMOGI POS Approval Request",
		filters={"approval_type": "Opname", "status": ["in", ["Pending", "Rejected"]]},
		fields=[
			"name",
			"status",
			"reason",
			"payload_json",
			"requested_by",
			"approved_by",
			"approved_at",
			"creation",
			"reference_name",
		],
		order_by="creation desc",
		limit_page_length=limit,
	)

	fetch_limit = max(limit, 50)
	entries = frappe.get_all(
		"Stock Reconciliation",
		filters={"docstatus": 1, "purpose": "Stock Reconciliation"},
		fields=["name", "posting_date", "creation"],
		order_by="modified desc",
		limit_page_length=min(fetch_limit, 200),
	)
	names = [e.name for e in entries]
	ar_by_sr = {}
	if names:
		for ar in frappe.get_all(
			"IMOGI POS Approval Request",
			filters={"approval_type": "Opname", "status": "Approved", "reference_name": ["in", names]},
			fields=["name", "reference_name", "payload_json", "requested_by", "creation"],
		):
			ar_by_sr[ar.reference_name] = ar

	owner_ids = {d.requested_by for d in pending_docs if d.requested_by}
	owner_ids |= {ar.requested_by for ar in ar_by_sr.values() if ar.requested_by}
	full_names = {}
	if owner_ids:
		for u in frappe.get_all(
			"User", filters={"name": ["in", list(owner_ids)]}, fields=["name", "full_name"]
		):
			full_names[u.name] = u.full_name or u.name

	req_attach = _attachments_for(
		"IMOGI POS Approval Request", [d.name for d in pending_docs] + [ar.name for ar in ar_by_sr.values()]
	)
	sr_attach = _attachments_for("Stock Reconciliation", names)

	def _parse_items(payload_json):
		try:
			payload = frappe.parse_json(payload_json) or {}
		except Exception:
			payload = {}
		return payload.get("items") or []

	def _diff_count(items):
		return sum(1 for i in items if flt(i.get("qty")) != flt(i.get("system_qty")))

	rows = []
	for doc in pending_docs:
		items = _parse_items(doc.payload_json)
		rows.append(
			{
				"row_type": "approval",
				"name": doc.name,
				"approval_request": doc.name,
				"stock_reconciliation": doc.reference_name or None,
				"status": doc.status,
				"posting_date": str(getdate(doc.creation)) if doc.creation else None,
				"creation": doc.creation,
				"remarks": doc.reason or "",
				"diff_count": _diff_count(items),
				"owner_name": full_names.get(doc.requested_by) or doc.requested_by,
				"item_count": len(items),
				"items": items[:8],
				"attachments": req_attach.get(doc.name) or [],
				"can_approve": doc.status == "Pending",
			}
		)

	for entry in entries:
		ar = ar_by_sr.get(entry.name)
		if not ar:
			continue
		items = _parse_items(ar.payload_json)
		rows.append(
			{
				"row_type": "stock_reconciliation",
				"name": entry.name,
				"approval_request": ar.name,
				"stock_reconciliation": entry.name,
				"status": "Approved",
				"posting_date": str(entry.posting_date) if entry.posting_date else None,
				"creation": ar.creation or entry.creation,
				"remarks": _("Opname disetujui"),
				"diff_count": _diff_count(items),
				"owner_name": full_names.get(ar.requested_by) or ar.requested_by,
				"item_count": len(items),
				"items": items[:8],
				"attachments": _dedupe_attachments(sr_attach.get(entry.name), req_attach.get(ar.name)),
				"can_approve": False,
			}
		)

	def _sort_key(r):
		status_rank = 0 if r.get("status") == "Pending" else 1 if r.get("status") == "Rejected" else 2
		try:
			ts = get_datetime(r.get("creation")).timestamp() if r.get("creation") else 0
		except Exception:
			ts = 0
		return (status_rank, -ts)

	rows.sort(key=_sort_key)
	rows = rows[:limit]
	pending_count = sum(1 for r in rows if r.get("status") == "Pending")
	return {"rows": rows, "count": len(rows), "pending_count": pending_count}


def list_batches(search: str | None = None, limit: int = 100) -> dict:
	"""Batch list with expiry for batch-tracked items."""
	_require_stock_read()
	filters = {}
	or_filters = None
	if search:
		term = f"%{search.strip()}%"
		or_filters = [
			["item", "like", term],
			["batch_id", "like", term],
			["name", "like", term],
		]
	rows = frappe.get_all(
		"Batch",
		filters=filters,
		or_filters=or_filters,
		fields=["name", "item", "batch_id", "expiry_date", "batch_qty", "disabled"],
		order_by="expiry_date asc",
		limit_page_length=cint(limit) or 100,
	)
	today_date = getdate(today())
	out = []
	for row in rows:
		expiry = getdate(row.expiry_date) if row.expiry_date else None
		days_left = (expiry - today_date).days if expiry else None
		out.append(
			{
				"name": row.name,
				"item": row.item,
				"batch_id": row.batch_id or row.name,
				"expiry_date": str(row.expiry_date) if row.expiry_date else None,
				"batch_qty": flt(row.batch_qty),
				"disabled": cint(row.disabled),
				"days_left": days_left,
				"is_expired": cint(expiry is not None and expiry < today_date),
				"is_expiring_soon": cint(expiry is not None and 0 <= (days_left or -1) <= 14),
			}
		)
	return {"rows": out, "count": len(out)}


def get_inventory_hub(tab: str | None = None, search: str | None = None) -> dict:
	tab = (tab or "stock").strip().lower()
	payload = {
		"tab": tab,
		"stock": None,
		"issues": None,
		"batches": None,
		"expired": None,
		"forecast": None,
	}
	if tab in ("stock", "materials", "all"):
		payload["stock"] = list_stock_items(search=search)
	if tab in ("waste", "spoilage", "adjustment", "all"):
		payload["issues"] = list_recent_issues()
	if tab in ("batch", "batches", "expired", "all"):
		payload["batches"] = list_batches(search=search)
		payload["expired"] = get_expired_monitoring(days_ahead=14)
	if tab in ("forecast", "all"):
		payload["forecast"] = get_stock_forecast(days=14)
	return payload
