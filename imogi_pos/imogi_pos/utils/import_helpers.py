# Copyright (c) 2026, Imogi and contributors

import re

import frappe
from frappe import _
from frappe.utils import cint, flt

from imogi_pos.imogi_pos.utils.bom_stock import POS_CATEGORIES
from imogi_pos.imogi_pos.utils.low_stock import set_item_reorder_level


def slug_item_code(value):
	text = (value or "").strip()
	code = re.sub(r"[^\w\s-]", "", text, flags=re.UNICODE)
	code = re.sub(r"[\s_]+", "-", code.strip()).upper()
	return (code[:140] if code else "ITEM")


def normalize_category(value):
	category = (value or "").strip()
	if not category:
		return ""
	for option in POS_CATEGORIES:
		if category.lower() == option.lower():
			return option
	return category


def ensure_uom(uom):
	uom = (uom or "").strip()
	if not uom:
		return "Nos"
	if frappe.db.exists("UOM", uom):
		return uom
	doc = frappe.new_doc("UOM")
	doc.uom_name = uom
	doc.insert(ignore_permissions=True)
	return uom


def ensure_item_group(group_name, parent_group="All Item Groups"):
	group_name = (group_name or "").strip() or "Products"
	if frappe.db.exists("Item Group", group_name):
		return group_name

	if not frappe.db.exists("Item Group", parent_group):
		parent_group = frappe.db.get_value("Item Group", {"is_group": 1}, "name") or "All Item Groups"

	doc = frappe.new_doc("Item Group")
	doc.item_group_name = group_name
	doc.parent_item_group = parent_group
	doc.is_group = 0
	doc.insert(ignore_permissions=True)
	return group_name


def resolve_item_code(name_or_code):
	value = (name_or_code or "").strip()
	if not value:
		return None
	if frappe.db.exists("Item", value):
		return value

	found = frappe.db.get_value("Item", {"item_name": value}, "name")
	if found:
		return found

	found = frappe.db.sql(
		"""
		select name from `tabItem`
		where lower(item_name) = lower(%s) or lower(name) = lower(%s)
		limit 1
		""",
		(value, value),
	)
	return found[0][0] if found else None


def upsert_item_from_import(row, settings, update_existing=0):
	item_code = row.get("item_code") or row.get("code")
	item_name = row.get("item_name") or row.get("name") or row.get("produk") or row.get("product")
	if not item_code and item_name:
		item_code = slug_item_code(item_name)
	if not item_code:
		return None, "missing_item_code"

	category = normalize_category(row.get("kategori") or row.get("category") or row.get("imogi_pos_category"))
	item_group = row.get("item_group") or category or "Products"
	item_group = ensure_item_group(item_group)

	add_ons = row.get("add_on") or row.get("add_ons") or row.get("addon") or ""

	if frappe.db.exists("Item", item_code):
		if not cint(update_existing):
			return "skipped", item_code
		item = frappe.get_doc("Item", item_code)
		action = "updated"
	else:
		item = frappe.new_doc("Item")
		item.item_code = item_code
		item.is_stock_item = 1
		item.is_sales_item = 1
		action = "created"

	item.item_name = item_name or item.item_name or item_code
	item.item_group = item_group
	if row.get("stock_uom"):
		item.stock_uom = ensure_uom(row["stock_uom"])
	elif not item.get("stock_uom"):
		item.stock_uom = "Nos"
	if row.get("standard_rate"):
		item.standard_rate = flt(row["standard_rate"])

	if category:
		item.imogi_pos_category = category
	if add_ons:
		item.imogi_pos_add_ons = add_ons

	if not item.variant_of:
		item.has_variants = 0

	if row.get("reorder_level") and settings.default_warehouse:
		set_item_reorder_level(
			item,
			settings.default_warehouse,
			row["reorder_level"],
			row.get("reorder_qty"),
		)

	if action == "created":
		item.insert(ignore_permissions=True)
	else:
		item.save(ignore_permissions=True)

	if flt(item.standard_rate) > 0:
		from imogi_pos.imogi_pos.utils.branch_pricing import sync_item_price_to_branches

		sync_item_price_to_branches(
			item_code,
			item.standard_rate,
			uom=item.stock_uom,
			company=settings.default_company,
		)

	return action, item_code


def get_selling_price_list(company=None):
	pos_profile = frappe.db.get_single_value("IMOGI POS Settings", "default_pos_profile")
	if pos_profile:
		price_list = frappe.db.get_value("POS Profile", pos_profile, "selling_price_list")
		if price_list:
			return price_list

	price_list = frappe.db.get_single_value("Selling Settings", "selling_price_list")
	if price_list:
		return price_list

	defaults = frappe.defaults.get_defaults(company) if company else frappe.defaults.get_defaults()
	return defaults.get("selling_price_list") if defaults else None


def upsert_selling_item_price(item_code, rate, uom=None, company=None):
	"""Create or update Item Price on the default selling price list."""
	rate = flt(rate)
	if rate <= 0:
		return None

	if frappe.get_cached_value("Item", item_code, "has_variants"):
		return None

	price_list = get_selling_price_list(company)
	if not price_list:
		return None

	if not uom:
		uom = frappe.db.get_value("Item", item_code, "stock_uom") or "Nos"
	uom = ensure_uom(uom)

	filters = {
		"item_code": item_code,
		"price_list": price_list,
		"selling": 1,
		"uom": uom,
	}
	name = frappe.db.get_value("Item Price", filters, "name")
	if name:
		doc = frappe.get_doc("Item Price", name)
		doc.price_list_rate = rate
		doc.save(ignore_permissions=True)
		return "updated"

	doc = frappe.new_doc("Item Price")
	doc.item_code = item_code
	doc.price_list = price_list
	doc.uom = uom
	doc.price_list_rate = rate
	doc.insert(ignore_permissions=True)
	return "created"


def get_buying_price_list(company=None):
	price_list = frappe.db.get_single_value("Buying Settings", "buying_price_list")
	if not price_list:
		defaults = frappe.defaults.get_defaults(company) if company else frappe.defaults.get_defaults()
		price_list = defaults.get("buying_price_list") if defaults else None
	return price_list


def upsert_buying_item_price(item_code, rate, uom=None, company=None):
	"""Create or update Item Price on the default buying price list."""
	rate = flt(rate)
	if rate <= 0:
		return None

	if frappe.get_cached_value("Item", item_code, "has_variants"):
		return None

	price_list = get_buying_price_list(company)
	if not price_list:
		return None

	if not uom:
		uom = frappe.db.get_value("Item", item_code, "stock_uom") or "Nos"
	uom = ensure_uom(uom)

	filters = {
		"item_code": item_code,
		"price_list": price_list,
		"buying": 1,
		"uom": uom,
	}
	name = frappe.db.get_value("Item Price", filters, "name")
	if name:
		doc = frappe.get_doc("Item Price", name)
		doc.price_list_rate = rate
		doc.save(ignore_permissions=True)
		return "updated"

	doc = frappe.new_doc("Item Price")
	doc.item_code = item_code
	doc.price_list = price_list
	doc.uom = uom
	doc.price_list_rate = rate
	doc.insert(ignore_permissions=True)
	return "created"


def upsert_bom_for_product(product_code, lines, company):
	if not lines:
		return None, "empty_bom"

	bom_name = frappe.db.get_value("BOM", {"item": product_code, "is_active": 1}, "name")
	if bom_name:
		bom = frappe.get_doc("BOM", bom_name)
		if bom.docstatus == 1:
			frappe.db.set_value("BOM", bom_name, {"is_active": 0, "is_default": 0}, update_modified=False)
			bom = frappe.new_doc("BOM")
			bom.item = product_code
			bom.company = company
		else:
			bom.items = []
	else:
		bom = frappe.new_doc("BOM")
		bom.item = product_code
		bom.company = company

	bom.quantity = 1
	bom.is_active = 1
	bom.is_default = 1
	bom.with_operations = 0

	for line in lines:
		component = resolve_item_code(line.get("bom_product") or line.get("component") or line.get("item_code"))
		if not component:
			raise frappe.ValidationError(
				_("Komponen BOM tidak ditemukan: {0}").format(line.get("bom_product") or "")
			)

		qty = flt(line.get("qty") or line.get("quantity") or 0)
		double_flag = (line.get("double") or line.get("is_double") or "").strip().lower()
		if double_flag == "double":
			qty *= 2
		if qty <= 0:
			raise frappe.ValidationError(_("Qty BOM harus lebih dari 0 untuk {0}").format(component))

		uom = ensure_uom(line.get("uom") or frappe.db.get_value("Item", component, "stock_uom"))
		item_row = {
			"item_code": component,
			"qty": qty,
			"uom": uom,
			"stock_uom": uom,
		}
		if line.get("rate"):
			item_row["rate"] = flt(line["rate"])
		bom.append("items", item_row)

	if not bom.items:
		return None, "empty_bom"

	bom.save(ignore_permissions=True)
	frappe.db.set_value("Item", product_code, "default_bom", bom.name)
	return bom.name, "saved"


def ensure_import_settings():
	"""Return IMOGI POS Settings with company/warehouse ready for import."""
	from imogi_pos.imogi_pos.utils.setup_wizard.provisioning import ensure_import_context

	settings = ensure_import_context()
	if not settings.default_company:
		frappe.throw(_("Set Perusahaan di IMOGI POS Settings"))
	return settings
