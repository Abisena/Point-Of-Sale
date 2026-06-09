# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe.utils import cint, flt

POS_CATEGORIES = ("Food", "Beverage", "Dessert", "Service")


def get_default_bom(item_code):
	if not item_code:
		return None

	rows = frappe.db.sql(
		"""
		SELECT name FROM `tabBOM`
		WHERE item = %s AND is_active = 1 AND docstatus < 2
		ORDER BY docstatus DESC, is_default DESC, modified DESC
		LIMIT 1
		""",
		(item_code,),
		as_dict=True,
	)
	return rows[0].name if rows else None


def get_bom_component_requirements(item_code):
	bom_name = get_default_bom(item_code)
	if not bom_name:
		return []

	bom = frappe.get_cached_doc("BOM", bom_name)
	base_qty = flt(bom.quantity) or 1
	requirements = []
	for row in bom.items:
		per_unit = flt(row.qty) / base_qty
		if per_unit <= 0:
			continue
		requirements.append(
			{
				"item_code": row.item_code,
				"item_name": row.item_name,
				"qty": per_unit,
				"uom": row.uom or row.stock_uom,
			}
		)
	return requirements


def get_variant_sellable_qty(item_code, warehouse):
	"""Sellable units for one item (finished stock or BOM component limits)."""
	from erpnext.accounts.doctype.pos_invoice.pos_invoice import get_stock_availability

	finished_qty, _, _ = get_stock_availability(item_code, warehouse)
	is_stock_item = cint(frappe.db.get_value("Item", item_code, "is_stock_item"))
	return apply_bom_stock_limits(item_code, warehouse, finished_qty, is_stock_item)


def get_enabled_variant_codes(template_code):
	return frappe.get_all(
		"Item",
		filters={"variant_of": template_code, "disabled": 0, "is_sales_item": 1},
		pluck="name",
		order_by="name asc",
	)


def template_has_configured_attributes(template_code):
	return bool(
		frappe.get_all(
			"Item Variant Attribute",
			filters={"parent": template_code, "parenttype": "Item", "disabled": 0},
			limit_page_length=1,
		)
	)


def needs_variant_picker(item_code):
	"""True only when the cashier must show the attribute picker."""
	variants = get_enabled_variant_codes(item_code)
	if not variants:
		return False
	if len(variants) == 1:
		return False
	if not cint(frappe.db.get_value("Item", item_code, "has_variants")):
		return True
	if not template_has_configured_attributes(item_code):
		return True
	return True


def get_auto_variant_code(item_code):
	"""When a template has exactly one sellable variant, return it."""
	variants = get_enabled_variant_codes(item_code)
	return variants[0] if len(variants) == 1 else None


def item_has_variant_children(item_code):
	return bool(get_enabled_variant_codes(item_code))


def item_has_sellable_variants(item_code):
	return item_has_variant_children(item_code)


def resolve_catalog_stock(item_code, warehouse, finished_qty=0, is_stock_item=1):
	"""Resolve sellable qty for catalog cards (template + BOM-aware)."""
	if item_has_sellable_variants(item_code):
		sellable_qty, bom_limited = get_template_bom_sellable_qty(item_code, warehouse)
		if bom_limited:
			return flt(sellable_qty), sellable_qty > 0, True
		# Variant template without BOM limits — treat as available, no stock badge.
		return flt(sellable_qty), True, False

	return apply_bom_stock_limits(item_code, warehouse, finished_qty, is_stock_item)


def get_template_bom_sellable_qty(template_code, warehouse):
	"""Max sellable qty across variants (BOM-aware)."""
	variant_codes = frappe.get_all(
		"Item",
		filters={"variant_of": template_code, "disabled": 0, "is_sales_item": 1},
		pluck="name",
	)
	if not variant_codes:
		return 0, False

	max_qty = 0
	bom_limited = False
	for code in variant_codes:
		qty, _, limited = get_variant_sellable_qty(code, warehouse)
		max_qty = max(max_qty, flt(qty))
		bom_limited = bom_limited or limited
	return max_qty, bom_limited


def apply_bom_stock_limits(item_code, warehouse, finished_qty=0, is_stock_item=1):
	"""Limit sellable qty by BOM components when the finished item has no own stock."""
	finished_qty = flt(finished_qty)
	requirements = get_bom_component_requirements(item_code)

	if not requirements:
		if not cint(is_stock_item):
			return finished_qty, True, False
		return finished_qty, finished_qty > 0, False

	from erpnext.accounts.doctype.pos_invoice.pos_invoice import get_stock_availability

	max_units = None
	for req in requirements:
		component_qty, _, _ = get_stock_availability(req["item_code"], warehouse)
		per_unit = flt(req["qty"])
		if per_unit <= 0:
			continue
		if flt(component_qty) < per_unit:
			return 0, False, True
		units = int(flt(component_qty) // per_unit)
		if max_units is None or units < max_units:
			max_units = units

	if max_units is None:
		if not cint(is_stock_item):
			return 0, False, True
		return finished_qty, finished_qty > 0, True

	if not cint(is_stock_item):
		sellable_qty = max_units
		return flt(sellable_qty), sellable_qty > 0, True

	if finished_qty > 0:
		sellable_qty = min(int(finished_qty), max_units)
	else:
		sellable_qty = max_units

	return flt(sellable_qty), sellable_qty > 0, True


def validate_bom_line_stock(item_code, warehouse, qty, row_idx=None):
	"""Raise if BOM components are insufficient for qty units of finished item."""
	from erpnext.accounts.doctype.pos_invoice.pos_invoice import get_stock_availability
	from erpnext.stock.stock_ledger import is_negative_stock_allowed

	requirements = get_bom_component_requirements(item_code)
	if not requirements:
		return

	sale_qty = flt(qty)
	if sale_qty <= 0:
		return

	error_msgs = []
	for req in requirements:
		if is_negative_stock_allowed(item_code=req["item_code"]):
			continue
		needed = flt(req["qty"]) * sale_qty
		available, _, _ = get_stock_availability(req["item_code"], warehouse)
		if flt(available) < needed:
			error_msgs.append(
				_("<li>{0}: butuh {1} {2}, tersedia {3}</li>").format(
					req["item_code"],
					frappe.bold(flt(needed, 2)),
					req.get("uom") or "",
					frappe.bold(flt(available, 2)),
				)
			)

	if error_msgs:
		row_label = _("Baris #{0}: ").format(row_idx) if row_idx else ""
		frappe.throw(
			_(
				"{0}Stok bahan BOM untuk <b>{1}</b> tidak cukup di gudang <b>{2}</b>:<ul>{3}</ul>"
			).format(
				row_label,
				item_code,
				warehouse,
				"".join(error_msgs),
			),
			title=_("Stok Bahan BOM Tidak Cukup"),
		)


def _bom_stock_entry_remarks(pos_invoice_name):
	return f"IMOGI BOM POS:{pos_invoice_name}"


def consume_bom_for_pos_invoice(doc):
	"""Issue BOM component stock when a POS Invoice is submitted."""
	if doc.is_return or getattr(doc, "docstatus", 0) != 1:
		return []

	remark_prefix = _bom_stock_entry_remarks(doc.name)
	created = []
	for row in doc.items:
		if not get_default_bom(row.item_code):
			continue

		sale_qty = flt(row.stock_qty or row.qty)
		if sale_qty <= 0:
			continue

		item_remark = f"{remark_prefix}:{row.item_code}"
		if frappe.db.exists("Stock Entry", {"remarks": item_remark, "docstatus": 1}):
			continue

		validate_bom_line_stock(row.item_code, row.warehouse, sale_qty, row_idx=row.idx)

		se_name = _create_bom_material_issue(doc, row, sale_qty, item_remark)
		if se_name:
			created.append(se_name)

	return created


def cancel_bom_consumption_for_pos_invoice(doc):
	remark_prefix = _bom_stock_entry_remarks(doc.name)
	entries = frappe.get_all(
		"Stock Entry",
		filters=[["remarks", "like", f"{remark_prefix}%"], ["docstatus", "=", 1]],
		pluck="name",
	)
	for name in entries:
		se = frappe.get_doc("Stock Entry", name)
		se.cancel()


def _create_bom_material_issue(pos_invoice, item_row, sale_qty, remark):
	bom_name = get_default_bom(item_row.item_code)
	if not bom_name:
		return None

	bom = frappe.get_cached_doc("BOM", bom_name)
	base_qty = flt(bom.quantity) or 1
	warehouse = item_row.warehouse

	se = frappe.new_doc("Stock Entry")
	se.stock_entry_type = "Material Issue"
	se.purpose = "Material Issue"
	se.company = pos_invoice.company
	se.posting_date = pos_invoice.posting_date
	se.posting_time = pos_invoice.posting_time
	se.set_posting_time = cint(pos_invoice.get("set_posting_time"))
	se.remarks = remark

	for bom_item in bom.items:
		qty = flt(bom_item.qty) / base_qty * sale_qty
		if qty <= 0:
			continue
		se.append(
			"items",
			{
				"item_code": bom_item.item_code,
				"s_warehouse": warehouse,
				"qty": qty,
				"uom": bom_item.uom or bom_item.stock_uom,
				"stock_uom": bom_item.stock_uom or bom_item.uom,
				"conversion_factor": 1,
				"transfer_qty": qty,
			},
		)

	if not se.items:
		return None

	se.set_stock_entry_type()
	se.insert(ignore_permissions=True)
	se.submit()
	return se.name
