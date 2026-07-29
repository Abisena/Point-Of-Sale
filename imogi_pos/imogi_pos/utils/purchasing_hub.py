# Copyright (c) 2026, Imogi and contributors
"""Purchasing Hub: suppliers, material request, PO, goods receipt."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint, flt, nowdate, getdate, add_days, today

from imogi_pos.imogi_pos.utils.flow import get_settings


def _settings():
	return get_settings()


def _company() -> str | None:
	return _settings().default_company


def _warehouse(warehouse: str | None = None) -> str | None:
	return warehouse or _settings().default_warehouse


def _require_purchasing_read():
	if frappe.session.user == "Guest":
		frappe.throw(_("Not permitted"), frappe.PermissionError)
	if not (
		frappe.has_permission("Supplier", "read")
		or frappe.has_permission("Purchase Order", "read")
		or frappe.has_permission("Material Request", "read")
	):
		frappe.throw(_("Tidak punya akses purchasing"), frappe.PermissionError)


def _parse_items(items) -> list[dict]:
	if isinstance(items, str):
		items = frappe.parse_json(items)
	return items or []


def _validate_item_code(item_code: str) -> None:
	"""Give a clear, actionable message when the Item link wasn't actually
	selected from the dropdown (e.g. the item's display name got typed/left in
	the box instead of its code) — otherwise this surfaces as a confusing raw
	'Item ... not found' error from core document validation."""
	if not frappe.db.exists("Item", item_code):
		frappe.throw(
			_(
				"Item '{0}' tidak ditemukan. Pilih item dari daftar saran (dropdown) yang muncul saat mengetik, jangan ketik/tempel nama item secara manual."
			).format(item_code)
		)


def get_purchasing_summary() -> dict:
	_require_purchasing_read()
	company = _company()
	filters_company = {"company": company} if company else {}
	suppliers = frappe.db.count("Supplier", {"disabled": 0})
	mr_open = frappe.db.count(
		"Material Request",
		{**filters_company, "docstatus": 1, "status": ["not in", ["Stopped", "Cancelled", "Ordered"]]},
	)
	# Fallback count draft+submitted open-ish
	mr_draft = frappe.db.count("Material Request", {**filters_company, "docstatus": 0})
	po_open = frappe.db.count(
		"Purchase Order",
		{**filters_company, "docstatus": 1, "status": ["not in", ["Closed", "Completed", "Cancelled"]]},
	)
	po_draft = frappe.db.count("Purchase Order", {**filters_company, "docstatus": 0})
	pr_recent = frappe.db.count(
		"Purchase Receipt",
		{
			**filters_company,
			"docstatus": 1,
			"posting_date": [">=", add_days(getdate(today()), -30)],
		},
	)
	pending_po_approvals = frappe.db.count(
		"IMOGI POS Approval Request", {"approval_type": "Purchase Order", "status": "Pending"}
	)
	return {
		"suppliers": suppliers,
		"requests_open": mr_open + mr_draft,
		"orders_open": po_open + po_draft,
		"receipts_30d": pr_recent,
		"pending_po_approvals": pending_po_approvals,
		"company": company,
		"warehouse": _warehouse(),
	}


def list_suppliers(search: str | None = None, limit: int = 100) -> dict:
	_require_purchasing_read()
	filters = {"disabled": 0}
	or_filters = None
	if search:
		term = f"%{search.strip()}%"
		or_filters = [
			["name", "like", term],
			["supplier_name", "like", term],
			["tax_id", "like", term],
		]
	rows = frappe.get_all(
		"Supplier",
		filters=filters,
		or_filters=or_filters,
		fields=[
			"name",
			"supplier_name",
			"supplier_group",
			"supplier_type",
			"tax_id",
			"payment_terms",
			"country",
			"modified",
		],
		order_by="modified desc",
		limit_page_length=cint(limit) or 100,
	)
	return {"rows": rows, "count": len(rows)}


def create_supplier(
	supplier_name: str,
	supplier_group: str | None = None,
	supplier_type: str | None = None,
	tax_id: str | None = None,
	payment_terms: str | None = None,
) -> dict:
	if not frappe.has_permission("Supplier", "create"):
		frappe.throw(_("Tidak punya akses membuat Supplier"), frappe.PermissionError)
	supplier_name = (supplier_name or "").strip()
	if not supplier_name:
		frappe.throw(_("Nama supplier wajib diisi"))
	if frappe.db.exists("Supplier", {"supplier_name": supplier_name}):
		frappe.throw(_("Supplier dengan nama {0} sudah ada").format(supplier_name))
	doc = frappe.get_doc(
		{
			"doctype": "Supplier",
			"supplier_name": supplier_name,
			"supplier_group": supplier_group or "All Supplier Groups",
			"supplier_type": supplier_type or "Company",
			"tax_id": (tax_id or "").strip() or None,
			"payment_terms": payment_terms or None,
		}
	)
	doc.insert()
	return {"name": doc.name, "supplier_name": doc.supplier_name}


def list_purchase_requests(search: str | None = None, limit: int = 50) -> dict:
	_require_purchasing_read()
	company = _company()
	filters: dict = {}
	if company:
		filters["company"] = company
	or_filters = None
	if search:
		term = f"%{search.strip()}%"
		or_filters = [["name", "like", term], ["title", "like", term]]
	rows = frappe.get_all(
		"Material Request",
		filters=filters,
		or_filters=or_filters,
		fields=[
			"name",
			"title",
			"status",
			"docstatus",
			"transaction_date",
			"schedule_date",
			"material_request_type",
			"per_ordered",
			"owner",
			"creation",
			"set_warehouse",
			"imogi_preferred_supplier",
			"modified",
		],
		order_by="modified desc",
		limit_page_length=cint(limit) or 50,
	)
	names = [r.name for r in rows]
	item_counts: dict[str, int] = {}
	if names:
		for row in frappe.db.sql(
			"""
			select parent, count(*) as cnt
			from `tabMaterial Request Item`
			where parent in %(names)s
			group by parent
			""",
			{"names": names},
			as_dict=True,
		):
			item_counts[row.parent] = cint(row.cnt)

	owner_ids = {r.owner for r in rows if r.owner}
	full_names: dict[str, str] = {}
	if owner_ids:
		for u in frappe.get_all(
			"User", filters={"name": ["in", list(owner_ids)]}, fields=["name", "full_name"]
		):
			full_names[u.name] = u.full_name or u.name

	supplier_ids = {r.imogi_preferred_supplier for r in rows if r.imogi_preferred_supplier}
	supplier_names: dict[str, str] = {}
	if supplier_ids:
		for s in frappe.get_all(
			"Supplier", filters={"name": ["in", list(supplier_ids)]}, fields=["name", "supplier_name"]
		):
			supplier_names[s.name] = s.supplier_name or s.name

	out = []
	for r in rows:
		out.append(
			{
				**r,
				"item_count": item_counts.get(r.name, 0),
				"transaction_date": str(r.transaction_date) if r.transaction_date else None,
				"schedule_date": str(r.schedule_date) if r.schedule_date else None,
				"creation": str(r.creation) if r.creation else None,
				"per_ordered": flt(r.per_ordered),
				"requested_by": r.owner,
				"requested_by_name": full_names.get(r.owner, r.owner),
				"warehouse": r.set_warehouse,
				"supplier": r.imogi_preferred_supplier,
				"supplier_name": supplier_names.get(r.imogi_preferred_supplier),
			}
		)
	return {"rows": out, "count": len(out)}


def create_purchase_request(
	items: list[dict] | str,
	warehouse: str | None = None,
	schedule_date: str | None = None,
	supplier: str | None = None,
) -> dict:
	"""Simpan Purchase Request sebagai Draft (butuh review sebelum di-submit)."""
	if not frappe.has_permission("Material Request", "create"):
		frappe.throw(_("Tidak punya akses membuat Purchase Request"), frappe.PermissionError)
	items = _parse_items(items)
	if not items:
		frappe.throw(_("Minimal 1 item wajib diisi"))
	settings = _settings()
	warehouse = _warehouse(warehouse)
	if not warehouse:
		frappe.throw(_("Gudang default belum diset"))
	supplier = (supplier or "").strip() or None

	rows = []
	for item in items:
		item_code = (item.get("item_code") or "").strip()
		qty = flt(item.get("qty"))
		if not item_code or qty <= 0:
			frappe.throw(_("Item dan qty wajib diisi untuk setiap baris"))
		_validate_item_code(item_code)
		uom = item.get("uom") or frappe.db.get_value("Item", item_code, "stock_uom") or "Nos"
		rows.append(
			{
				"item_code": item_code,
				"qty": qty,
				"uom": uom,
				"warehouse": item.get("warehouse") or warehouse,
				"schedule_date": item.get("schedule_date") or schedule_date or nowdate(),
			}
		)

	doc = frappe.get_doc(
		{
			"doctype": "Material Request",
			"material_request_type": "Purchase",
			"company": settings.default_company,
			"transaction_date": nowdate(),
			"schedule_date": schedule_date or nowdate(),
			"set_warehouse": warehouse,
			"imogi_preferred_supplier": supplier,
			"items": rows,
		}
	)
	doc.insert()
	return {"name": doc.name, "status": doc.status, "item_count": len(rows)}


def get_purchase_request_detail(name: str) -> dict:
	"""Header + item lines of one Purchase Request, for a read-only detail view
	before deciding whether to convert it into a Purchase Order."""
	_require_purchasing_read()
	name = (name or "").strip()
	if not name:
		frappe.throw(_("Purchase Request wajib diisi"))
	doc = frappe.get_doc("Material Request", name)

	items = frappe.get_all(
		"Material Request Item",
		filters={"parent": name},
		fields=["item_code", "item_name", "qty", "uom", "warehouse", "schedule_date"],
		order_by="idx asc",
	)

	supplier_name = None
	if doc.imogi_preferred_supplier:
		supplier_name = frappe.db.get_value("Supplier", doc.imogi_preferred_supplier, "supplier_name")
	requested_by_name = frappe.db.get_value("User", doc.owner, "full_name") or doc.owner

	return {
		"name": doc.name,
		"status": doc.status,
		"docstatus": cint(doc.docstatus),
		"transaction_date": str(doc.transaction_date) if doc.transaction_date else None,
		"schedule_date": str(doc.schedule_date) if doc.schedule_date else None,
		"creation": str(doc.creation) if doc.creation else None,
		"requested_by": doc.owner,
		"requested_by_name": requested_by_name,
		"warehouse": doc.set_warehouse,
		"supplier": doc.imogi_preferred_supplier,
		"supplier_name": supplier_name,
		"per_ordered": flt(doc.per_ordered),
		"items": [
			{
				"item_code": i.item_code,
				"item_name": i.item_name,
				"qty": flt(i.qty),
				"uom": i.uom,
				"warehouse": i.warehouse,
				"schedule_date": str(i.schedule_date) if i.schedule_date else None,
			}
			for i in items
		],
	}


def submit_purchase_request(name: str) -> dict:
	if not frappe.has_permission("Material Request", "submit"):
		frappe.throw(_("Tidak punya akses submit Purchase Request"), frappe.PermissionError)
	name = (name or "").strip()
	doc = frappe.get_doc("Material Request", name)
	if cint(doc.docstatus) != 0:
		frappe.throw(_("Purchase Request sudah diproses"))
	doc.submit()
	return {"name": doc.name, "status": doc.status}


def list_purchase_orders(search: str | None = None, limit: int = 50) -> dict:
	_require_purchasing_read()
	company = _company()
	filters: dict = {}
	if company:
		filters["company"] = company
	or_filters = None
	if search:
		term = f"%{search.strip()}%"
		or_filters = [["name", "like", term], ["supplier", "like", term], ["supplier_name", "like", term]]
	rows = frappe.get_all(
		"Purchase Order",
		filters=filters,
		or_filters=or_filters,
		fields=[
			"name",
			"supplier",
			"supplier_name",
			"status",
			"docstatus",
			"transaction_date",
			"schedule_date",
			"grand_total",
			"per_received",
			"modified",
		],
		order_by="modified desc",
		limit_page_length=cint(limit) or 50,
	)
	draft_names = [r.name for r in rows if cint(r.docstatus) == 0]
	pending_map: dict[str, dict] = {}
	if draft_names:
		for req in frappe.get_all(
			"IMOGI POS Approval Request",
			filters={
				"approval_type": "Purchase Order",
				"status": "Pending",
				"reference_name": ["in", draft_names],
			},
			fields=["name", "reference_name", "required_role"],
		):
			pending_map[req.reference_name] = {"name": req.name, "required_role": req.required_role}
	out = []
	for r in rows:
		pending = pending_map.get(r.name) or {}
		out.append(
			{
				**r,
				"transaction_date": str(r.transaction_date) if r.transaction_date else None,
				"schedule_date": str(r.schedule_date) if r.schedule_date else None,
				"grand_total": flt(r.grand_total),
				"per_received": flt(r.per_received),
				"approval_request": pending.get("name"),
				"required_role": pending.get("required_role"),
			}
		)
	return {"rows": out, "count": len(out)}


def create_purchase_order(
	supplier: str,
	items: list[dict] | str,
	warehouse: str | None = None,
	schedule_date: str | None = None,
) -> dict:
	"""Simpan Purchase Order sebagai Draft (butuh review + Submit terpisah)."""
	if not frappe.has_permission("Purchase Order", "create"):
		frappe.throw(_("Tidak punya akses membuat Purchase Order"), frappe.PermissionError)
	supplier = (supplier or "").strip()
	if not supplier:
		frappe.throw(_("Supplier wajib diisi"))
	if not frappe.db.exists("Supplier", supplier):
		frappe.throw(
			_(
				"Supplier '{0}' tidak ditemukan. Pilih supplier dari daftar saran (dropdown), jangan ketik manual."
			).format(supplier)
		)
	items = _parse_items(items)
	if not items:
		frappe.throw(_("Minimal 1 item wajib diisi"))
	settings = _settings()
	warehouse = _warehouse(warehouse)
	if not warehouse:
		frappe.throw(_("Gudang default belum diset"))

	rows = []
	for item in items:
		item_code = (item.get("item_code") or "").strip()
		qty = flt(item.get("qty"))
		if not item_code or qty <= 0:
			frappe.throw(_("Item dan qty wajib diisi untuk setiap baris"))
		_validate_item_code(item_code)
		uom = item.get("uom") or frappe.db.get_value("Item", item_code, "stock_uom") or "Nos"
		rate = item.get("rate")
		if rate in (None, ""):
			rate = frappe.db.get_value(
				"Item Price",
				{"item_code": item_code, "buying": 1},
				"price_list_rate",
				order_by="modified desc",
			) or 0
		rows.append(
			{
				"item_code": item_code,
				"qty": qty,
				"rate": flt(rate),
				"uom": uom,
				"warehouse": item.get("warehouse") or warehouse,
				"schedule_date": item.get("schedule_date") or schedule_date or nowdate(),
			}
		)

	doc = frappe.get_doc(
		{
			"doctype": "Purchase Order",
			"supplier": supplier,
			"company": settings.default_company,
			"transaction_date": nowdate(),
			"schedule_date": schedule_date or nowdate(),
			"items": rows,
		}
	)
	doc.insert()
	return {"name": doc.name, "status": doc.status, "grand_total": flt(doc.grand_total)}


def create_purchase_order_from_request(purchase_request: str, supplier: str) -> dict:
	"""Map item Purchase Request yang sudah Submitted jadi Draft Purchase Order untuk 1 supplier."""
	if not frappe.has_permission("Purchase Order", "create"):
		frappe.throw(_("Tidak punya akses membuat Purchase Order"), frappe.PermissionError)
	purchase_request = (purchase_request or "").strip()
	supplier = (supplier or "").strip()
	if not purchase_request or not supplier:
		frappe.throw(_("Purchase Request dan supplier wajib diisi"))
	if not frappe.db.exists("Supplier", supplier):
		frappe.throw(
			_(
				"Supplier '{0}' tidak ditemukan. Pilih supplier dari daftar saran (dropdown), jangan ketik manual."
			).format(supplier)
		)

	mr = frappe.get_doc("Material Request", purchase_request)
	if cint(mr.docstatus) != 1:
		frappe.throw(_("Purchase Request harus sudah Submitted"))

	from erpnext.stock.doctype.material_request.material_request import make_purchase_order

	po = make_purchase_order(purchase_request)
	# Item default-supplier mapping is not guaranteed to be configured, so assign
	# the chosen supplier directly rather than relying on make_purchase_order_based_on_supplier.
	po.supplier = supplier
	for row in po.items:
		if not row.rate:
			row.rate = (
				frappe.db.get_value(
					"Item Price",
					{"item_code": row.item_code, "buying": 1},
					"price_list_rate",
					order_by="modified desc",
				)
				or 0
			)
	po.insert()
	return {
		"name": po.name,
		"status": po.status,
		"grand_total": flt(po.grand_total),
		"material_request": purchase_request,
	}


def submit_purchase_order(name: str) -> dict:
	"""Submit Draft PO. If approval workflow is on, this creates a Pending
	IMOGI POS Approval Request instead of raising a raw error to the caller."""
	if not frappe.has_permission("Purchase Order", "submit"):
		frappe.throw(_("Tidak punya akses submit Purchase Order"), frappe.PermissionError)
	name = (name or "").strip()
	doc = frappe.get_doc("Purchase Order", name)
	if cint(doc.docstatus) != 0:
		frappe.throw(_("Purchase Order sudah diproses"))
	try:
		doc.submit()
	except frappe.PermissionError:
		# frappe.throw() inside the before_submit hook queues its message into
		# frappe.local.message_log *before* raising — catching the exception
		# here stops it from failing the request, but the queued message would
		# still ride along in the response and pop up as a dialog on the
		# client regardless of the clean return value below. Drop it.
		frappe.clear_messages()
		doc.db_set("imogi_approval_status", "Menunggu Approval")
		request_name, required_role = frappe.db.get_value(
			"IMOGI POS Approval Request",
			{"approval_type": "Purchase Order", "reference_name": doc.name, "status": "Pending"},
			["name", "required_role"],
			order_by="creation desc",
		) or (None, None)
		return {
			"name": doc.name,
			"status": "Pending Approval",
			"approval_request": request_name,
			"required_role": required_role,
			"message": _("PO menunggu approval supervisor. Kode: {0}").format(request_name or "-"),
		}
	return {"name": doc.name, "status": doc.status, "approval_request": None}


def list_purchase_receipts(search: str | None = None, limit: int = 50) -> dict:
	_require_purchasing_read()
	company = _company()
	filters: dict = {}
	if company:
		filters["company"] = company
	or_filters = None
	if search:
		term = f"%{search.strip()}%"
		or_filters = [["name", "like", term], ["supplier", "like", term], ["supplier_name", "like", term]]
	rows = frappe.get_all(
		"Purchase Receipt",
		filters=filters,
		or_filters=or_filters,
		fields=[
			"name",
			"supplier",
			"supplier_name",
			"status",
			"docstatus",
			"posting_date",
			"grand_total",
			"modified",
		],
		order_by="modified desc",
		limit_page_length=cint(limit) or 50,
	)
	out = []
	for r in rows:
		out.append(
			{
				**r,
				"posting_date": str(r.posting_date) if r.posting_date else None,
				"grand_total": flt(r.grand_total),
			}
		)
	return {"rows": out, "count": len(out)}


def get_purchase_order_receiving_lines(purchase_order: str) -> dict:
	"""Outstanding lines of a submitted PO, for building a per-item receiving grid."""
	_require_purchasing_read()
	purchase_order = (purchase_order or "").strip()
	if not purchase_order:
		frappe.throw(_("Purchase Order wajib diisi"))
	po = frappe.get_doc("Purchase Order", purchase_order)
	if cint(po.docstatus) != 1:
		frappe.throw(_("Purchase Order harus sudah Submitted"))

	rows = []
	for row in po.items:
		outstanding = flt(row.qty) - flt(row.received_qty)
		if outstanding <= 0:
			continue
		rows.append(
			{
				"po_item": row.name,
				"item_code": row.item_code,
				"item_name": row.item_name,
				"uom": row.uom,
				"qty": flt(row.qty),
				"received_qty": flt(row.received_qty),
				"outstanding_qty": outstanding,
			}
		)
	return {
		"purchase_order": purchase_order,
		"supplier": po.supplier,
		"supplier_name": po.supplier_name,
		"rows": rows,
	}


def create_purchase_receipt_from_po(purchase_order: str, items: list[dict] | str | None = None) -> dict:
	"""Receive selected lines of a submitted PO. `items` (optional) is a list of
	{po_item|item_code, qty} allowing partial, per-line receiving; when omitted,
	every outstanding line is received in full (previous default behaviour)."""
	if not frappe.has_permission("Purchase Receipt", "create"):
		frappe.throw(_("Tidak punya akses membuat Purchase Receipt"), frappe.PermissionError)
	purchase_order = (purchase_order or "").strip()
	if not purchase_order:
		frappe.throw(_("Purchase Order wajib diisi"))
	po = frappe.get_doc("Purchase Order", purchase_order)
	if cint(po.docstatus) != 1:
		frappe.throw(_("Purchase Order harus sudah Submitted"))

	items = _parse_items(items)

	from erpnext.buying.doctype.purchase_order.purchase_order import make_purchase_receipt

	pr = make_purchase_receipt(purchase_order)

	if items:
		qty_by_po_item: dict[str, float] = {}
		qty_by_item_code: dict[str, float] = {}
		for row in items:
			qty = flt(row.get("qty"))
			if qty <= 0:
				continue
			po_item = (row.get("po_item") or "").strip()
			item_code = (row.get("item_code") or "").strip()
			if po_item:
				qty_by_po_item[po_item] = qty
			elif item_code:
				qty_by_item_code[item_code] = qty_by_item_code.get(item_code, 0) + qty

		kept = []
		for row in pr.items:
			want = qty_by_po_item.get(row.purchase_order_item)
			if want is None:
				want = qty_by_item_code.get(row.item_code)
			if not want:
				continue
			row.qty = want
			kept.append(row)
		if not kept:
			frappe.throw(_("Pilih minimal satu item untuk diterima"))
		pr.items = kept

	pr.insert()
	pr.submit()
	return {"name": pr.name, "status": pr.status, "purchase_order": purchase_order}


def list_receipts_for_billing(search: str | None = None, limit: int = 50) -> dict:
	"""Submitted receipts that still have an unbilled amount (per_billed < 100)."""
	_require_purchasing_read()
	company = _company()
	filters: dict = {"docstatus": 1, "per_billed": ["<", 100]}
	if company:
		filters["company"] = company
	or_filters = None
	if search:
		term = f"%{search.strip()}%"
		or_filters = [["name", "like", term], ["supplier", "like", term], ["supplier_name", "like", term]]
	rows = frappe.get_all(
		"Purchase Receipt",
		filters=filters,
		or_filters=or_filters,
		fields=["name", "supplier", "supplier_name", "posting_date", "grand_total", "per_billed", "modified"],
		order_by="modified desc",
		limit_page_length=cint(limit) or 50,
	)
	out = []
	for r in rows:
		out.append(
			{
				**r,
				"posting_date": str(r.posting_date) if r.posting_date else None,
				"grand_total": flt(r.grand_total),
				"per_billed": flt(r.per_billed),
			}
		)
	return {"rows": out, "count": len(out)}


def create_purchase_invoice_from_receipt(purchase_receipt: str) -> dict:
	"""Bill strictly off a submitted Purchase Receipt, so every Purchase
	Invoice line stays matched to the PO/Receipt it was actually received
	against (3-way matching by construction). Saved as Draft for review."""
	if not frappe.has_permission("Purchase Invoice", "create"):
		frappe.throw(_("Tidak punya akses membuat Purchase Invoice"), frappe.PermissionError)
	purchase_receipt = (purchase_receipt or "").strip()
	if not purchase_receipt:
		frappe.throw(_("Purchase Receipt wajib diisi"))
	pr = frappe.get_doc("Purchase Receipt", purchase_receipt)
	if cint(pr.docstatus) != 1:
		frappe.throw(_("Purchase Receipt harus sudah Submitted"))
	if flt(pr.per_billed) >= 100:
		frappe.throw(_("Purchase Receipt ini sudah ditagih penuh"))

	from erpnext.stock.doctype.purchase_receipt.purchase_receipt import make_purchase_invoice

	pi = make_purchase_invoice(purchase_receipt)
	pi.insert()
	return {
		"name": pi.name,
		"status": pi.status,
		"grand_total": flt(pi.grand_total),
		"purchase_receipt": purchase_receipt,
	}


def submit_purchase_invoice(name: str) -> dict:
	if not frappe.has_permission("Purchase Invoice", "submit"):
		frappe.throw(_("Tidak punya akses submit Purchase Invoice"), frappe.PermissionError)
	name = (name or "").strip()
	doc = frappe.get_doc("Purchase Invoice", name)
	if cint(doc.docstatus) != 0:
		frappe.throw(_("Purchase Invoice sudah diproses"))
	doc.submit()
	return {"name": doc.name, "status": doc.status, "outstanding_amount": flt(doc.outstanding_amount)}


def list_purchase_invoices(search: str | None = None, limit: int = 50) -> dict:
	_require_purchasing_read()
	company = _company()
	filters: dict = {}
	if company:
		filters["company"] = company
	or_filters = None
	if search:
		term = f"%{search.strip()}%"
		or_filters = [["name", "like", term], ["supplier", "like", term], ["supplier_name", "like", term]]
	rows = frappe.get_all(
		"Purchase Invoice",
		filters=filters,
		or_filters=or_filters,
		fields=[
			"name",
			"supplier",
			"supplier_name",
			"status",
			"docstatus",
			"posting_date",
			"due_date",
			"grand_total",
			"outstanding_amount",
			"modified",
		],
		order_by="modified desc",
		limit_page_length=cint(limit) or 50,
	)
	names = [r.name for r in rows]
	po_map: dict[str, str] = {}
	pr_map: dict[str, str] = {}
	if names:
		for row in frappe.db.sql(
			"""
			select parent, min(purchase_order) as po, min(purchase_receipt) as pr
			from `tabPurchase Invoice Item`
			where parent in %(names)s
			group by parent
			""",
			{"names": names},
			as_dict=True,
		):
			if row.po:
				po_map[row.parent] = row.po
			if row.pr:
				pr_map[row.parent] = row.pr
	out = []
	for r in rows:
		out.append(
			{
				**r,
				"posting_date": str(r.posting_date) if r.posting_date else None,
				"due_date": str(r.due_date) if r.due_date else None,
				"grand_total": flt(r.grand_total),
				"outstanding_amount": flt(r.outstanding_amount),
				"purchase_order": po_map.get(r.name),
				"purchase_receipt": pr_map.get(r.name),
			}
		)
	return {"rows": out, "count": len(out)}


def create_payment_for_invoice(purchase_invoice: str) -> dict:
	"""Record a full payment against the bill — closes the PO -> Receipt -> Bill -> Payment chain."""
	if not frappe.has_permission("Payment Entry", "create"):
		frappe.throw(_("Tidak punya akses membuat Payment Entry"), frappe.PermissionError)
	purchase_invoice = (purchase_invoice or "").strip()
	if not purchase_invoice:
		frappe.throw(_("Purchase Invoice wajib diisi"))
	pi = frappe.get_doc("Purchase Invoice", purchase_invoice)
	if cint(pi.docstatus) != 1:
		frappe.throw(_("Purchase Invoice harus sudah Submitted"))
	if flt(pi.outstanding_amount) <= 0:
		frappe.throw(_("Purchase Invoice ini sudah lunas"))

	from erpnext.accounts.doctype.payment_entry.payment_entry import get_payment_entry

	try:
		pe = get_payment_entry("Purchase Invoice", purchase_invoice)
	except Exception as e:
		frappe.throw(
			_("Gagal membuat Payment Entry: {0}. Pastikan akun kas/bank default sudah diset di Company.").format(
				str(e)
			)
		)
	pe.insert()
	pe.submit()
	return {
		"name": pe.name,
		"status": pe.status,
		"purchase_invoice": purchase_invoice,
		"paid_amount": flt(pe.paid_amount),
	}


def get_purchasing_hub(tab: str | None = None, search: str | None = None) -> dict:
	tab = (tab or "requests").strip().lower()
	payload = {
		"tab": tab,
		"summary": get_purchasing_summary(),
		"requests": None,
		"orders": None,
		"receipts": None,
		"invoices": None,
	}
	if tab in ("requests", "request", "pr", "all"):
		payload["requests"] = list_purchase_requests(search=search)
	if tab in ("orders", "order", "po", "all"):
		payload["orders"] = list_purchase_orders(search=search)
	if tab in ("receiving", "receipts", "receipt", "all"):
		payload["receipts"] = list_purchase_receipts(search=search)
	if tab in ("invoices", "invoice", "tagihan", "all"):
		payload["invoices"] = list_purchase_invoices(search=search)
	return payload
