# Copyright (c) 2026, Imogi and contributors
"""Variant-aware menu import: template items, variants, and per-variant BOM."""

import re

import frappe
from frappe import _
from frappe.utils import cint, flt

from imogi_pos.imogi_pos.utils.import_helpers import (
	ensure_item_group,
	ensure_uom,
	normalize_category,
	slug_item_code,
	upsert_bom_for_product,
)
from imogi_pos.imogi_pos.utils.menu_import_helpers import (
	_components_to_bom_lines,
	_is_service_block,
	upsert_component_from_menu,
)

PAREN_VARIANT_RE = re.compile(r"^(.*?)\s*\(([^)]+)\)\s*$", re.IGNORECASE)

# Normalized column key -> ERPNext Item Attribute name
VARIANT_COLUMN_MAP = {
	"temperatur": "Temperatur",
	"temperature": "Temperatur",
	"ukuran": "Ukuran",
	"size": "Ukuran",
	"warna": "Warna",
	"color": "Warna",
	"colour": "Warna",
}

PAREN_FALLBACK_ATTRIBUTE = "Temperatur"

TEMPERATUR_CANONICAL = {
	"hot": "Hot",
	"ice": "Ice",
	"panas": "Hot",
	"dingin": "Ice",
	"cold": "Ice",
	"warm": "Hot",
}

UKURAN_CANONICAL = {
	"reguler": "Reguler",
	"regular": "Reguler",
	"r": "Reguler",
	"jumbo": "Jumbo",
	"j": "Jumbo",
	"float": "Float",
	"f": "Float",
	"medium": "Medium",
	"large": "Large",
	"besar": "Large",
	"small": "Small",
	"kecil": "Small",
}


def _canonical_variant_value(attribute_name, value):
	text = (value or "").strip()
	if not text:
		return ""
	key = text.lower()
	if attribute_name == "Temperatur":
		return TEMPERATUR_CANONICAL.get(key, text)
	if attribute_name == "Ukuran":
		return UKURAN_CANONICAL.get(key, text)
	return text


def classify_paren_variant(value):
	"""Map parenthetical suffix e.g. (Hot) or (Jumbo) to an Item Attribute."""
	text = (value or "").strip()
	if not text:
		return None, ""
	key = text.lower()
	if key in TEMPERATUR_CANONICAL:
		return "Temperatur", TEMPERATUR_CANONICAL[key]
	if key in UKURAN_CANONICAL:
		return "Ukuran", UKURAN_CANONICAL[key]
	# Default unknown suffixes to Ukuran (Reguler/Jumbo-style menus)
	return "Ukuran", _canonical_variant_value("Ukuran", text)


def variant_attrs_from_row(row):
	"""Read variant attribute values from fixed import columns."""
	attrs = {}
	for key, attribute_name in VARIANT_COLUMN_MAP.items():
		value = (row.get(key) or "").strip()
		if value:
			attrs[attribute_name] = value
	return attrs


def resolve_product_variant(product_name, row):
	"""Return (base_name, variant_attributes dict)."""
	name = (product_name or "").strip()
	attrs = variant_attrs_from_row(row)

	match = PAREN_VARIANT_RE.match(name)
	if match:
		name = match.group(1).strip()
		paren_value = match.group(2).strip()
		attr_name, canonical = classify_paren_variant(paren_value)
		if attr_name and canonical and attr_name not in attrs:
			attrs[attr_name] = canonical

	base_name = name or (product_name or "").strip()
	return base_name, attrs


def enrich_block_variant_info(block, row):
	"""Attach base_name and variant_attributes to a parsed menu block."""
	product_name = block.get("product_name") or ""
	base_name, attrs = resolve_product_variant(product_name, row)
	block["base_name"] = base_name
	block["variant_attributes"] = attrs
	return block


def partition_blocks(blocks):
	"""Split parsed blocks into standalone products and variant groups."""
	standalone = []
	groups = {}

	for block in blocks:
		attrs = block.get("variant_attributes") or {}
		if attrs:
			base = block.get("base_name") or block.get("product_name") or ""
			groups.setdefault(base, []).append(block)
		else:
			standalone.append(block)

	return standalone, groups


def _attribute_value_abbr(value):
	text = re.sub(r"[^\w]", "", (value or "").strip(), flags=re.UNICODE)
	if not text:
		return "V"
	if len(text) <= 4:
		return text.upper()
	return text[:4].upper()


def clear_attribute_value_cache():
	frappe.flags.attribute_values = None
	frappe.flags.numeric_values = None


def ensure_item_attribute(attribute_name, values):
	"""Create Item Attribute and values if missing."""
	values = [v.strip() for v in values if (v or "").strip()]
	if not attribute_name or not values:
		return

	if not frappe.db.exists("Item Attribute", attribute_name):
		doc = frappe.new_doc("Item Attribute")
		doc.attribute_name = attribute_name
		doc.insert(ignore_permissions=True)

	existing = set(
		frappe.get_all(
			"Item Attribute Value",
			filters={"parent": attribute_name},
			pluck="attribute_value",
		)
	)

	new_values = [value for value in values if value not in existing]
	if not new_values:
		return

	doc = frappe.get_doc("Item Attribute", attribute_name)
	for value in new_values:
		doc.append(
			"item_attribute_values",
			{
				"attribute_value": value,
				"abbr": _attribute_value_abbr(value),
			},
		)
	doc.save(ignore_permissions=True)
	clear_attribute_value_cache()


def _apply_product_meta(item, block_meta, settings, is_template=False):
	category = normalize_category(block_meta.get("category") or "")
	item_group = category or "Products"
	item_group = ensure_item_group(item_group)
	item.item_group = item_group

	if category:
		item.imogi_pos_category = category
	if block_meta.get("add_on"):
		item.imogi_pos_add_ons = block_meta["add_on"]
	# Template items cannot have Item Price / standard_rate in ERPNext.
	if block_meta.get("selling_price") and not is_template:
		item.standard_rate = flt(block_meta["selling_price"])
	if is_template:
		item.standard_rate = 0
	if not item.get("stock_uom"):
		item.stock_uom = "Nos"


def set_bom_finished_item_stock_flag(item_code):
	"""BOM menu items should not maintain stock on the finished product."""
	frappe.db.set_value("Item", item_code, "is_stock_item", 0, update_modified=False)


def _variant_combo_key(variant_attrs):
	return tuple(sorted((variant_attrs or {}).items()))


def _get_variant_attributes(variant_code):
	return {
		row.attribute: row.attribute_value
		for row in frappe.get_all(
			"Item Variant Attribute",
			filters={"parent": variant_code},
			fields=["attribute", "attribute_value"],
		)
		if row.attribute and row.attribute_value
	}


def _delete_boms_for_item(item_code):
	for bom_name in frappe.get_all("BOM", filters={"item": item_code}, pluck="name"):
		try:
			bom = frappe.get_doc("BOM", bom_name)
			if bom.docstatus == 1:
				frappe.db.set_value("BOM", bom_name, {"is_active": 0, "is_default": 0}, update_modified=False)
				continue
			frappe.delete_doc("BOM", bom_name, force=True, ignore_permissions=True)
		except Exception:
			frappe.db.set_value("BOM", bom_name, "is_active", 0, update_modified=False)


def _remove_variant_item(variant_code, stats=None):
	_delete_boms_for_item(variant_code)
	try:
		frappe.delete_doc("Item", variant_code, ignore_permissions=True, force=True)
		if stats is not None:
			stats["variants_deleted"] = stats.get("variants_deleted", 0) + 1
		return True
	except Exception as exc:
		frappe.db.set_value("Item", variant_code, "disabled", 1, update_modified=False)
		if stats is not None:
			stats["variants_retired"] = stats.get("variants_retired", 0) + 1
			stats.setdefault("errors", []).append(
				{"item_code": variant_code, "error": str(exc)[:200]}
			)
		return False


def _deactivate_boms_for_item(item_code):
	for bom_name in frappe.get_all("BOM", filters={"item": item_code, "is_active": 1}, pluck="name"):
		frappe.db.set_value("BOM", bom_name, {"is_active": 0, "is_default": 0}, update_modified=False)


def sync_template_variants_before_save(template_code, attribute_values_map, active_combos, stats=None):
	"""Delete stale variants so template attributes can be updated safely."""
	if not template_code or not frappe.db.exists("Item", template_code):
		return

	template_attrs = set(attribute_values_map.keys())
	active = set(active_combos or [])

	for variant_code in frappe.get_all("Item", filters={"variant_of": template_code}, pluck="name"):
		attrs = _get_variant_attributes(variant_code)
		key = _variant_combo_key(attrs)
		should_remove = key not in active or set(attrs.keys()) != template_attrs
		if not should_remove:
			for attr_name, attr_value in attrs.items():
				if attr_value not in attribute_values_map.get(attr_name, []):
					should_remove = True
					break
		if should_remove:
			_remove_variant_item(variant_code, stats)


def demote_template_to_standalone(item_code, stats=None):
	"""Turn a mistaken variant template back into a normal sellable item."""
	if not frappe.db.exists("Item", item_code):
		return False
	if not frappe.db.get_value("Item", item_code, "has_variants"):
		return False

	for variant_code in frappe.get_all("Item", filters={"variant_of": item_code}, pluck="name"):
		_remove_variant_item(variant_code, stats)

	if frappe.db.count("Item", {"variant_of": item_code}):
		if stats is not None:
			stats.setdefault("errors", []).append(
				{
					"item_code": item_code,
					"error": _(
						"Template {0} masih punya variant lama — nonaktifkan/hapus manual lalu import lagi"
					).format(item_code),
				}
			)
		return False

	_deactivate_boms_for_item(item_code)

	item = frappe.get_doc("Item", item_code)
	item.has_variants = 0
	item.variant_based_on = ""
	item.attributes = []
	item.is_sales_item = 1
	item.disabled = 0
	item.flags.ignore_validate = True
	item.save(ignore_permissions=True)

	if stats is not None:
		stats["templates_demoted"] = stats.get("templates_demoted", 0) + 1
	return True


def retire_orphan_variants(template_code, active_combos, stats=None):
	"""Remove variant items that are no longer present in the import file."""
	active = set(active_combos or [])
	for variant_code in frappe.get_all("Item", filters={"variant_of": template_code}, pluck="name"):
		attrs = _get_variant_attributes(variant_code)
		key = _variant_combo_key(attrs)
		if key in active:
			if frappe.db.get_value("Item", variant_code, "disabled"):
				frappe.db.set_value("Item", variant_code, "disabled", 0, update_modified=False)
				if stats is not None:
					stats["variants_reenabled"] = stats.get("variants_reenabled", 0) + 1
			continue

		_remove_variant_item(variant_code, stats)


def upsert_template_item(base_name, attribute_values_map, block_meta, settings, update_existing=1):
	"""Create or update a variant template item."""
	for attribute_name, values in attribute_values_map.items():
		ensure_item_attribute(attribute_name, values)

	item_code = slug_item_code(base_name)
	if frappe.db.exists("Item", item_code):
		if not cint(update_existing):
			return "skipped", item_code
		item = frappe.get_doc("Item", item_code)
		if not item.has_variants:
			_deactivate_boms_for_item(item_code)
		action = "updated"
	else:
		item = frappe.new_doc("Item")
		item.item_code = item_code
		action = "created"

	item.item_name = base_name
	item.has_variants = 1
	item.variant_based_on = "Item Attribute"
	item.is_sales_item = 1
	item.is_stock_item = 0
	_apply_product_meta(item, block_meta, settings, is_template=True)

	item.attributes = []
	for attribute_name in sorted(attribute_values_map.keys()):
		item.append("attributes", {"attribute": attribute_name})

	if action == "created":
		item.insert(ignore_permissions=True)
	else:
		item.flags.ignore_validate = True
		item.save(ignore_permissions=True)

	return action, item_code


def upsert_variant_item(template_code, variant_attrs, block_meta, settings, update_existing=1):
	"""Create or update one variant item under a template."""
	from erpnext.controllers.item_variant import create_variant, get_variant

	clear_attribute_value_cache()
	existing_code = get_variant(template_code, variant_attrs)

	if existing_code:
		if not cint(update_existing):
			return "skipped", existing_code
		variant = frappe.get_doc("Item", existing_code)
		action = "updated"
	else:
		variant = create_variant(template_code, variant_attrs)
		action = "created"

	variant.is_sales_item = 1
	# Finished menu items use BOM — do not maintain stock on the variant itself.
	# Must match template (is_stock_item=0) so template saves / photo uploads
	# do not trigger ERPNext variant sync to change Maintain Stock.
	variant.is_stock_item = 0
	_apply_product_meta(variant, block_meta, settings)

	if action == "created":
		variant.insert(ignore_permissions=True)
	else:
		variant.save(ignore_permissions=True)

	if flt(variant.standard_rate) > 0:
		from imogi_pos.imogi_pos.utils.branch_pricing import sync_item_price_to_branches

		sync_item_price_to_branches(
			variant.name,
			variant.standard_rate,
			uom=variant.stock_uom,
			company=settings.default_company,
		)

	return action, variant.name


def _import_block_components(block, update_existing, stats):
	for component in block.get("components") or []:
		action, _code = upsert_component_from_menu(
			component["name"],
			component.get("uom"),
			component.get("harga"),
			component.get("qty"),
			update_existing=cint(update_existing),
		)
		if action == "created":
			stats["components_created"] += 1
		elif action == "updated":
			stats["components_updated"] += 1


def _import_block_bom(product_code, block, settings, update_existing, stats):
	existing_bom = frappe.db.exists("BOM", {"item": product_code, "is_active": 1})
	if existing_bom and not cint(update_existing):
		stats["skipped"] += 1
		return False

	bom_lines = _components_to_bom_lines(block.get("components") or [])
	bom_name, _status = upsert_bom_for_product(product_code, bom_lines, settings.default_company)
	if not bom_name:
		stats["skipped"] += 1
		return False

	if existing_bom:
		stats["boms_updated"] += 1
	else:
		stats["boms_created"] += 1
	return True


def import_standalone_block(block, settings, update_existing, stats):
	"""Import a product without variants (existing behaviour)."""
	from imogi_pos.imogi_pos.utils.import_helpers import upsert_item_from_import

	if _is_service_block(block):
		stats["skipped_service"] += 1
		return

	product_name = block.get("product_name")
	if not block.get("components"):
		stats["errors"].append(
			{
				"row": block.get("row"),
				"item_code": product_name,
				"error": _("Produk tidak memiliki komponen BOM"),
			}
		)
		stats["skipped"] += 1
		return

	try:
		_import_block_components(block, update_existing, stats)

		product_code = slug_item_code(product_name)
		if cint(update_existing):
			demote_template_to_standalone(product_code, stats)

		product_row = {
			"produk": product_name,
			"kategori": block.get("category"),
			"standard_rate": block.get("selling_price"),
			"add_on": block.get("add_on"),
		}
		product_action, product_code = upsert_item_from_import(
			product_row,
			settings,
			update_existing=cint(update_existing),
		)
		if product_action == "created":
			stats["products_created"] += 1
		elif product_action == "updated":
			stats["products_updated"] += 1
		elif product_action == "skipped":
			stats["skipped"] += 1
			return

		set_bom_finished_item_stock_flag(product_code)
		_import_block_bom(product_code, block, settings, update_existing, stats)
	except Exception as exc:
		stats["errors"].append(
			{
				"row": block.get("row"),
				"item_code": product_name,
				"error": str(exc),
			}
		)
		stats["skipped"] += 1


def import_variant_group(base_name, group_blocks, settings, update_existing, stats):
	"""Import one template and its variants with per-variant BOM."""
	if not group_blocks:
		return

	if any(_is_service_block(block) for block in group_blocks):
		stats["skipped_service"] += len(group_blocks)
		return

	seen_combos = set()
	attribute_values_map = {}
	meta_block = group_blocks[0]

	for block in group_blocks:
		if not block.get("components"):
			stats["errors"].append(
				{
					"row": block.get("row"),
					"item_code": block.get("product_name") or base_name,
					"error": _("Produk tidak memiliki komponen BOM"),
				}
			)
			stats["skipped"] += 1
			return

		combo_key = tuple(sorted((block.get("variant_attributes") or {}).items()))
		if combo_key in seen_combos:
			stats["errors"].append(
				{
					"row": block.get("row"),
					"item_code": block.get("product_name") or base_name,
					"error": _("Kombinasi variant duplikat untuk {0}").format(base_name),
				}
			)
			stats["skipped"] += 1
			return
		seen_combos.add(combo_key)

		for attribute_name, value in (block.get("variant_attributes") or {}).items():
			attribute_values_map.setdefault(attribute_name, set()).add(value)

		if block.get("category") and not meta_block.get("category"):
			meta_block = block
		if block.get("selling_price") and not meta_block.get("selling_price"):
			meta_block = block

	attribute_values_map = {key: sorted(values) for key, values in attribute_values_map.items()}

	try:
		for block in group_blocks:
			_import_block_components(block, update_existing, stats)

		template_code = slug_item_code(base_name)
		if cint(update_existing):
			sync_template_variants_before_save(
				template_code, attribute_values_map, seen_combos, stats
			)

		template_action, template_code = upsert_template_item(
			base_name,
			attribute_values_map,
			meta_block,
			settings,
			update_existing=cint(update_existing),
		)
		if template_action == "created":
			stats["templates_created"] += 1
		elif template_action == "updated":
			stats["templates_updated"] += 1
		elif template_action == "skipped":
			stats["skipped"] += 1
			return

		for block in group_blocks:
			variant_action, variant_code = upsert_variant_item(
				template_code,
				block.get("variant_attributes") or {},
				block,
				settings,
				update_existing=cint(update_existing),
			)
			if variant_action == "created":
				stats["variants_created"] += 1
			elif variant_action == "updated":
				stats["variants_updated"] += 1
			elif variant_action == "skipped":
				stats["skipped"] += 1
				continue

			_import_block_bom(variant_code, block, settings, update_existing, stats)

		retire_orphan_variants(template_code, seen_combos, stats)
	except Exception as exc:
		stats["errors"].append(
			{
				"row": meta_block.get("row"),
				"item_code": base_name,
				"error": str(exc),
			}
		)
		stats["skipped"] += 1
