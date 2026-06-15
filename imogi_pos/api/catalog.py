# Copyright (c) 2026, Imogi and contributors

import json

import frappe
from frappe import _
from frappe.utils import cint, flt

from imogi_pos.api.auth import ensure_setup_ready, validate_order_api_access
from imogi_pos.imogi_pos.utils.bom_stock import (
	COMBO_CATALOG_PREFIX,
	COMBO_PACKAGE_CATEGORY,
	POS_CATEGORIES,
	apply_bom_stock_limits,
	get_auto_variant_code,
	item_has_variant_children,
	needs_variant_picker,
	resolve_catalog_stock,
)
from imogi_pos.imogi_pos.utils.flow import get_settings


def _get_pos_context(pos_profile=None, branch=None):
	settings = get_settings()
	if branch or pos_profile:
		from imogi_pos.imogi_pos.utils.branch import resolve_active_branch

		branch_ctx = resolve_active_branch(branch_code=branch, pos_profile=pos_profile)
		pos_profile = branch_ctx["pos_profile"]
		profile = frappe.get_cached_doc("POS Profile", pos_profile)
		warehouse = branch_ctx.get("warehouse") or profile.warehouse or settings.default_warehouse
		price_list = branch_ctx.get("selling_price_list") or profile.selling_price_list
		company = branch_ctx.get("company") or profile.company or settings.default_company
	else:
		pos_profile = pos_profile or settings.default_pos_profile
		if not pos_profile:
			frappe.throw(_("Set POS Profile in IMOGI POS Settings"))
		profile = frappe.get_cached_doc("POS Profile", pos_profile)
		warehouse = profile.warehouse or settings.default_warehouse
		price_list = profile.selling_price_list
		company = profile.company or settings.default_company
		branch_ctx = None

	if not warehouse:
		frappe.throw(_("Set warehouse on POS Profile or IMOGI POS Settings"))

	return {
		"pos_profile": pos_profile,
		"warehouse": warehouse,
		"price_list": price_list,
		"company": company,
		"currency": frappe.get_cached_value("Company", company, "default_currency"),
		"branch_code": (branch_ctx or {}).get("branch_code"),
	}


def _allowed_item_groups(ctx):
	from imogi_pos.imogi_pos.utils.branch_menu import get_item_groups_for_branch

	return get_item_groups_for_branch(branch_code=ctx.get("branch_code"), pos_profile=ctx.get("pos_profile"))


def _filter_items_by_groups(items, ctx):
	allowed_groups = _allowed_item_groups(ctx)
	if not allowed_groups:
		return items
	allowed_set = set(allowed_groups)
	return [row for row in items if row.get("item_group") in allowed_set or not row.get("item_group")]


def _get_item_price_rate(item_code, ctx):
	from imogi_pos.imogi_pos.utils.branch_pricing import resolve_selling_price_rate

	return resolve_selling_price_rate(item_code, ctx.get("price_list"), company=ctx.get("company"))


def _serialize_item(row, extra=None, warehouse=None):
	item_code = row.get("item_code") or row.get("name")
	item_group = row.get("item_group")
	if not item_group and item_code:
		item_group = frappe.get_cached_value("Item", item_code, "item_group")

	pos_category = row.get("imogi_pos_category")
	if not pos_category and item_code:
		pos_category = frappe.get_cached_value("Item", item_code, "imogi_pos_category")

	actual_qty = flt(row.get("actual_qty"))
	is_stock_item = cint(row.get("is_stock_item"))
	in_stock = actual_qty > 0 or not is_stock_item
	bom_limited = False

	if warehouse and item_code:
		actual_qty, in_stock, bom_limited = resolve_catalog_stock(
			item_code, warehouse, actual_qty, is_stock_item
		)

	has_variants = int(needs_variant_picker(item_code))
	auto_variant = get_auto_variant_code(item_code) if not has_variants else None
	if bom_limited:
		display_stock = 1
	else:
		display_stock = cint(is_stock_item) and not (has_variants or auto_variant)

	show_stock_label = int(
		bom_limited or cint(is_stock_item) or item_has_variant_children(item_code)
	)

	data = {
		"item_code": item_code,
		"item_name": row.get("item_name"),
		"item_group": item_group,
		"imogi_pos_category": pos_category,
		"description": row.get("description"),
		"image": row.get("item_image") or row.get("image"),
		"rate": flt(row.get("price_list_rate") or row.get("standard_rate") or row.get("rate")),
		"currency": row.get("currency"),
		"uom": row.get("uom") or row.get("stock_uom"),
		"stock_uom": row.get("stock_uom"),
		"is_stock_item": display_stock,
		"stock_qty": actual_qty,
		"in_stock": in_stock,
		"bom_limited": bom_limited,
		"has_variants": has_variants,
		"auto_variant_item_code": auto_variant,
		"show_stock_label": show_stock_label,
		"variant_of": row.get("variant_of"),
	}
	if extra:
		data.update(extra)
	return data


def _normalize_pos_items(raw, warehouse=None, ctx=None, batch=None):
	if isinstance(raw, list):
		items = raw
	elif isinstance(raw, dict):
		items = raw.get("items") or []
	else:
		items = []

	if not items:
		return []

	if batch is None and ctx:
		from imogi_pos.imogi_pos.utils.catalog_batch import CatalogBatchContext

		codes = [row.get("item_code") or row.get("name") for row in items if row.get("item_code") or row.get("name")]
		batch = CatalogBatchContext(ctx["warehouse"], ctx["price_list"], ctx.get("currency"))
		batch.prepare(codes)

	if batch:
		return [batch.serialize_row(row) for row in items]

	serialized = [_serialize_item(row, warehouse=warehouse) for row in items]
	if not ctx:
		return serialized

	for row in serialized:
		if flt(row.get("rate")) > 0:
			continue
		code = row.get("item_code")
		if code:
			row["rate"] = _get_item_price_rate(code, ctx)
	return serialized


def _filter_items_by_pos_category(items, pos_category):
	if not pos_category:
		return items
	return [row for row in items if (row.get("imogi_pos_category") or "") == pos_category]


def _item_has_pos_add_ons(item_code):
	text = frappe.get_cached_value("Item", item_code, "imogi_pos_add_ons")
	return bool((text or "").strip())


def _list_combo_catalog_items(ctx, search=None):
	from imogi_pos.imogi_pos.utils.feature_gating import is_feature_operational
	from imogi_pos.imogi_pos.utils.planned_features import list_combo_packages

	if not is_feature_operational("combo_package"):
		return []

	search_l = (search or "").strip().lower()
	combos = list_combo_packages(ctx.get("company"))
	result = []
	for combo in combos:
		label = combo.get("combo_name") or combo["name"]
		if search_l and search_l not in label.lower() and search_l not in combo["name"].lower():
			continue
		result.append(
			{
				"item_code": f"{COMBO_CATALOG_PREFIX}{combo['name']}",
				"item_name": label,
				"rate": flt(combo.get("selling_price")),
				"currency": ctx.get("currency"),
				"imogi_pos_category": COMBO_PACKAGE_CATEGORY,
				"description": combo.get("description") or "",
				"image": None,
				"is_combo": 1,
				"combo_name": combo["name"],
				"in_stock": True,
				"is_stock_item": 0,
				"show_stock_label": 0,
				"has_variants": 0,
				"has_addons": 0,
				"uom": _("Paket"),
			}
		)
	return result


def _merge_combo_into_catalog(items, ctx, pos_category=None, search=None):
	if pos_category and pos_category != COMBO_PACKAGE_CATEGORY:
		return items

	combos = _list_combo_catalog_items(ctx, search=search)
	if pos_category == COMBO_PACKAGE_CATEGORY:
		return combos
	if not combos:
		return items

	existing_codes = {row.get("item_code") for row in items}
	for combo in combos:
		if combo["item_code"] not in existing_codes:
			items.append(combo)
	return items


def _enrich_catalog_items(items):
	for row in items:
		if row.get("is_combo"):
			row.setdefault("has_addons", 0)
			continue
		code = row.get("item_code")
		if code and not row.get("has_variants"):
			row["has_addons"] = int(_item_has_pos_add_ons(code))
		else:
			row["has_addons"] = 0
	return items


def _get_item_meta_map(item_codes):
	if not item_codes:
		return {}
	rows = frappe.get_all(
		"Item",
		filters={"name": ["in", item_codes]},
		fields=["name", "variant_of", "has_variants", "item_group"],
	)
	return {row.name: row for row in rows}


def _apply_variant_catalog_rules(items):
	if not items:
		return items

	meta_map = _get_item_meta_map([row["item_code"] for row in items if row.get("item_code")])
	filtered = []
	seen = set()

	for row in items:
		code = row.get("item_code")
		if not code or code in seen:
			continue

		meta = meta_map.get(code)
		if meta and meta.variant_of:
			continue

		if meta:
			row["has_variants"] = cint(meta.has_variants)
			row["variant_of"] = meta.variant_of

		seen.add(code)
		filtered.append(row)

	return filtered


def _get_template_item_rows(ctx, item_group=None, search_term="", limit=48):
	from erpnext.accounts.doctype.pos_profile.pos_profile import get_item_groups
	from erpnext.selling.page.point_of_sale.point_of_sale import get_parent_item_group

	allowed_groups = get_item_groups(ctx["pos_profile"])
	if not item_group:
		item_group = get_parent_item_group()

	if not frappe.db.exists("Item Group", item_group):
		item_group = get_parent_item_group()

	filters = {
		"disabled": 0,
		"has_variants": 1,
		"is_sales_item": 1,
		"is_fixed_asset": 0,
	}

	if search_term:
		filters["item_name"] = ["like", f"%{search_term}%"]

	group_names = frappe.get_all(
		"Item Group",
		filters={"lft": [">=", frappe.db.get_value("Item Group", item_group, "lft")], "rgt": ["<=", frappe.db.get_value("Item Group", item_group, "rgt")]},
		pluck="name",
	)
	if allowed_groups:
		group_names = [name for name in group_names if name in allowed_groups]
	if not group_names:
		return []

	filters["item_group"] = ["in", group_names]
	return frappe.get_all(
		"Item",
		filters=filters,
		fields=["name", "item_name", "item_group", "description", "image", "stock_uom", "is_stock_item"],
		order_by="name asc",
		limit=cint(limit),
	)


def _serialize_template_rows(rows, ctx, batch):
	if not rows:
		return []
	if batch is None:
		from imogi_pos.imogi_pos.utils.catalog_batch import CatalogBatchContext

		batch = CatalogBatchContext(ctx["warehouse"], ctx["price_list"], ctx.get("currency"))
		batch.prepare([row.name for row in rows])

	items = []
	for row in rows:
		item_row = {
			"item_code": row.name,
			"item_name": row.item_name,
			"item_group": row.item_group,
			"description": row.description,
			"item_image": row.image,
			"stock_uom": row.stock_uom,
			"is_stock_item": row.is_stock_item,
			"actual_qty": 0,
			"currency": ctx["currency"],
		}
		items.append(batch.serialize_row(item_row))
	return items


def _get_template_items(ctx, item_group=None, search_term="", limit=48, batch=None):
	rows = _get_template_item_rows(ctx, item_group, search_term, limit)
	return _serialize_template_rows(rows, ctx, batch)


def _build_catalog_items(ctx, raw, template_rows, batch=None):
	"""Serialize POS + template rows with one shared batch context."""
	from imogi_pos.imogi_pos.utils.catalog_batch import CatalogBatchContext

	if isinstance(raw, dict):
		raw_rows = raw.get("items") or []
	elif isinstance(raw, list):
		raw_rows = raw
	else:
		raw_rows = []

	template_rows = template_rows or []
	if batch is None:
		codes = [row.get("item_code") or row.get("name") for row in raw_rows if row.get("item_code") or row.get("name")]
		codes += [row.name for row in template_rows]
		batch = CatalogBatchContext(ctx["warehouse"], ctx["price_list"], ctx.get("currency"))
		batch.prepare(codes)

	items = _apply_variant_catalog_rules([batch.serialize_row(row) for row in raw_rows])
	templates = _serialize_template_rows(template_rows, ctx, batch)
	return _merge_catalog_items(templates, items)


def invalidate_pos_catalog_cache():
	"""Clear server-side catalog list cache (e.g. after Item image/price changes)."""
	frappe.cache().delete_keys("v2|*")


def _catalog_list_cache_key(ctx, branch, item_group, pos_category, start, limit):
	return "v2|" + "|".join(
		[
			ctx.get("pos_profile") or "",
			ctx.get("warehouse") or "",
			ctx.get("price_list") or "",
			branch or "",
			item_group or "",
			pos_category or "",
			str(cint(start)),
			str(cint(limit)),
		]
	)


def _merge_catalog_items(*lists):
	merged = []
	seen = set()
	for items in lists:
		for row in items or []:
			code = row.get("item_code")
			if not code or code in seen:
				continue
			seen.add(code)
			merged.append(row)
	return _sort_catalog_items(merged)


def _sort_catalog_items(items):
	"""Order catalog by stock qty (highest first), then item code."""
	return sorted(
		items or [],
		key=lambda row: (-flt(row.get("stock_qty")), row.get("item_code") or ""),
	)


def _get_attribute_values(attribute):
	values = frappe.get_all(
		"Item Attribute Value",
		filters={"parent": attribute},
		fields=["attribute_value"],
		order_by="idx asc",
	)
	return [row.attribute_value for row in values if row.attribute_value]


def _estimate_attribute_price_delta(template_item_code, attribute, value, ctx, base_rate):
	variants = frappe.get_all(
		"Item",
		filters={"variant_of": template_item_code, "disabled": 0, "is_sales_item": 1},
		pluck="name",
	)
	for variant_code in variants:
		attrs = frappe.get_all(
			"Item Variant Attribute",
			filters={"parent": variant_code, "attribute": attribute, "attribute_value": value},
			limit=1,
		)
		if attrs:
			return flt(_get_item_price_rate(variant_code, ctx)) - flt(base_rate)
	return 0


def _get_template_variants_meta(template_item_code):
	"""List sellable variants with attribute map and image for variant picker."""
	rows = frappe.get_all(
		"Item",
		filters={"variant_of": template_item_code, "disabled": 0, "is_sales_item": 1},
		fields=["name", "image", "item_name"],
		order_by="name asc",
	)
	variants = []
	for row in rows:
		attr_rows = frappe.get_all(
			"Item Variant Attribute",
			filters={"parent": row.name},
			fields=["attribute", "attribute_value"],
		)
		attributes = {
			attr.attribute: attr.attribute_value for attr in attr_rows if attr.attribute and attr.attribute_value
		}
		variants.append(
			{
				"item_code": row.name,
				"item_name": row.item_name,
				"image": row.image,
				"attributes": attributes,
			}
		)
	return variants


def _get_pos_add_ons(template_item, ctx):
	from erpnext.accounts.doctype.pos_invoice.pos_invoice import get_stock_availability
	from imogi_pos.imogi_pos.utils.import_helpers import ensure_pos_addon_item, resolve_item_code

	template_code = template_item.name if hasattr(template_item, "name") else template_item
	add_on_text = frappe.db.get_value("Item", template_code, "imogi_pos_add_ons")
	names = [part.strip() for part in (add_on_text or "").split(",") if part.strip()]

	if names:
		rows = []
		for name in names:
			item_code = resolve_item_code(name) or ensure_pos_addon_item(name, exclude_item_code=template_code)
			if not item_code or item_code == template_code:
				continue
			row = frappe.db.get_value(
				"Item",
				item_code,
				["name", "item_name", "image", "stock_uom", "is_stock_item"],
				as_dict=True,
			)
			if row:
				rows.append(row)
	else:
		from erpnext.accounts.doctype.pos_profile.pos_profile import get_item_groups

		if not frappe.db.exists("Item Group", "Add-ons"):
			return []

		allowed_groups = set(get_item_groups(ctx["pos_profile"]) or [])
		if allowed_groups and "Add-ons" not in allowed_groups:
			return []

		rows = frappe.get_all(
			"Item",
			filters={
				"disabled": 0,
				"is_sales_item": 1,
				"has_variants": 0,
				"variant_of": ["is", "not set"],
				"item_group": "Add-ons",
			},
			fields=["name", "item_name", "image", "stock_uom", "is_stock_item"],
			order_by="item_name asc",
			limit=12,
		)

	add_ons = []
	for row in rows:
		if row.name == template_code:
			continue
		actual_qty, _, _ = get_stock_availability(row.name, ctx["warehouse"])
		stock_qty, in_stock, _ = apply_bom_stock_limits(
			row.name, ctx["warehouse"], actual_qty, cint(row.is_stock_item)
		)
		rate = _get_item_price_rate(row.name, ctx)
		add_ons.append(
			{
				"item_code": row.name,
				"item_name": row.item_name,
				"image": row.image,
				"rate": rate,
				"currency": ctx["currency"],
				"uom": row.stock_uom,
				"is_stock_item": cint(row.is_stock_item),
				"stock_qty": stock_qty,
				"in_stock": in_stock,
			}
		)
	return add_ons


@frappe.whitelist(allow_guest=True)
def get_items(
	search=None,
	item_group=None,
	pos_category=None,
	start=0,
	limit=20,
	pos_profile=None,
	branch=None,
	skip_cache=0,
):
	"""List sellable items for the default (or given) POS Profile."""
	validate_order_api_access()
	ensure_setup_ready()

	ctx = _get_pos_context(pos_profile, branch=branch)
	limit = min(cint(limit) or 20, 100)
	start = cint(start)

	from erpnext.accounts.doctype.pos_profile.pos_profile import get_item_groups
	from erpnext.selling.page.point_of_sale.point_of_sale import (
		filter_result_items,
		get_items as pos_get_items,
		get_parent_item_group,
		search_by_term,
	)

	price_list = ctx["price_list"]
	if not price_list:
		frappe.throw(_("Set Selling Price List on POS Profile {0}").format(ctx["pos_profile"]))

	search = (search or "").strip()
	if not item_group:
		item_group = get_parent_item_group()

	if pos_category == COMBO_PACKAGE_CATEGORY:
		combos = _list_combo_catalog_items(ctx, search=search)
		return {
			"items": combos[start : start + limit],
			"total": len(combos),
			"start": start,
			"limit": limit,
			"pos_profile": ctx["pos_profile"],
			"warehouse": ctx["warehouse"],
			"price_list": price_list,
			"pos_category": pos_category,
		}

	cache_key = None
	if not search:
		cache_key = _catalog_list_cache_key(ctx, branch, item_group, pos_category, start, limit)
		if not cint(skip_cache):
			cached = frappe.cache().get_value(cache_key)
			if cached:
				return cached

	if search:
		result = search_by_term(search, ctx["warehouse"], price_list)
		if result:
			filter_result_items(result, ctx["pos_profile"])
			template_rows = _get_template_item_rows(ctx, item_group, search_term=search, limit=limit)
			items = _build_catalog_items(ctx, result, template_rows)
			items = _filter_items_by_groups(items, ctx)
			items = _filter_items_by_pos_category(items, pos_category)
			items = _merge_combo_into_catalog(items, ctx, pos_category=pos_category, search=search)
			items = _enrich_catalog_items(items)
			return {
				"items": items[start : start + limit],
				"total": len(items),
				"start": start,
				"limit": limit,
				"pos_profile": ctx["pos_profile"],
				"warehouse": ctx["warehouse"],
				"price_list": price_list,
			}

		parent_group = get_parent_item_group()
		raw = pos_get_items(start, limit, price_list, parent_group, ctx["pos_profile"], search_term=search)
		template_rows = _get_template_item_rows(ctx, parent_group, search_term=search, limit=limit)
		items = _build_catalog_items(ctx, raw, template_rows)
		items = _filter_items_by_groups(items, ctx)
		items = _filter_items_by_pos_category(items, pos_category)
		items = _merge_combo_into_catalog(items, ctx, pos_category=pos_category, search=search)
		items = _enrich_catalog_items(items)
		return {
			"items": items,
			"total": len(items),
			"total": len(items),
			"start": start,
			"limit": limit,
			"pos_profile": ctx["pos_profile"],
			"warehouse": ctx["warehouse"],
			"price_list": price_list,
		}

	raw = pos_get_items(start, limit, price_list, item_group, ctx["pos_profile"], search_term="")
	template_rows = _get_template_item_rows(ctx, item_group, limit=limit)
	items = _build_catalog_items(ctx, raw, template_rows)
	items = _filter_items_by_groups(items, ctx)
	items = _filter_items_by_pos_category(items, pos_category)
	items = _merge_combo_into_catalog(items, ctx, pos_category=pos_category)
	items = _enrich_catalog_items(items)

	response = {
		"items": items,
		"start": start,
		"limit": limit,
		"pos_profile": ctx["pos_profile"],
		"warehouse": ctx["warehouse"],
		"price_list": price_list,
		"item_group": item_group,
		"pos_category": pos_category,
	}
	if cache_key and not cint(skip_cache):
		frappe.cache().set_value(cache_key, response, expires_in_sec=45)
	return response


@frappe.whitelist(allow_guest=True)
def get_item(item_code, pos_profile=None, branch=None):
	"""Get one item with price and stock for POS Profile."""
	validate_order_api_access()
	ensure_setup_ready()

	if not item_code:
		frappe.throw(_("item_code is required"))

	ctx = _get_pos_context(pos_profile, branch=branch)
	item = frappe.get_cached_value(
		"Item",
		item_code,
		[
			"name",
			"item_name",
			"item_group",
			"description",
			"image",
			"stock_uom",
			"sales_uom",
			"is_stock_item",
			"disabled",
			"is_sales_item",
			"has_variants",
		],
		as_dict=True,
	)
	if not item or item.disabled or not item.is_sales_item or item.has_variants:
		frappe.throw(_("Item {0} not found or not available for sale").format(item_code))

	from erpnext.accounts.doctype.pos_profile.pos_profile import get_item_groups
	from erpnext.accounts.doctype.pos_invoice.pos_invoice import get_stock_availability
	from erpnext.stock.get_item_details import get_conversion_factor
	from erpnext.selling.page.point_of_sale.point_of_sale import filter_result_items, search_by_term

	allowed_groups = _allowed_item_groups(ctx)
	if allowed_groups and item.item_group not in allowed_groups:
		frappe.throw(_("Item {0} is not allowed for this branch").format(item_code))

	price_list = ctx["price_list"]
	if not price_list:
		frappe.throw(_("Set Selling Price List on POS Profile {0}").format(ctx["pos_profile"]))

	search_result = search_by_term(item_code, ctx["warehouse"], price_list)
	matched = None
	if search_result:
		filter_result_items(search_result, ctx["pos_profile"])
		matched = next(
			(row for row in search_result.get("items", []) if row.get("item_code") == item_code),
			None,
		)

	if matched:
		serialized = _serialize_item(matched, warehouse=ctx["warehouse"])
		if flt(serialized.get("rate")) <= 0:
			serialized["rate"] = _get_item_price_rate(item_code, ctx)
		return serialized

	actual_qty, _, _ = get_stock_availability(item_code, ctx["warehouse"])
	rate = _get_item_price_rate(item_code, ctx)
	uom = item.sales_uom or item.stock_uom
	if item.sales_uom and item.sales_uom != item.stock_uom:
		factor = get_conversion_factor(item_code, item.sales_uom).get("conversion_factor") or 1
		actual_qty = actual_qty // factor

	return _serialize_item(
		{
			"item_code": item.name,
			"item_name": item.item_name,
			"item_group": item.item_group,
			"description": item.description,
			"item_image": item.image,
			"price_list_rate": rate,
			"currency": ctx["currency"],
			"uom": uom,
			"stock_uom": item.stock_uom,
			"is_stock_item": item.is_stock_item,
			"actual_qty": actual_qty,
			"has_variants": cint(item.has_variants),
			"variant_of": item.variant_of,
		},
		warehouse=ctx["warehouse"],
	)


@frappe.whitelist(allow_guest=True)
def get_item_addon_config(item_code, pos_profile=None, branch=None):
	"""Return add-on picker config for items without variant selection."""
	from erpnext.accounts.doctype.pos_invoice.pos_invoice import get_stock_availability

	validate_order_api_access()
	ensure_setup_ready()

	if not item_code:
		frappe.throw(_("item_code is required"))

	ctx = _get_pos_context(pos_profile, branch=branch)
	template = frappe.get_doc("Item", item_code)
	if template.disabled or not template.is_sales_item:
		frappe.throw(_("Item {0} is not available for sale").format(item_code))
	if needs_variant_picker(item_code):
		frappe.throw(_("Gunakan pilihan varian untuk item ini"))
	if not _item_has_pos_add_ons(item_code):
		frappe.throw(_("Tidak ada add-on untuk item ini"))

	allowed_groups = _allowed_item_groups(ctx)
	if allowed_groups and template.item_group not in allowed_groups:
		frappe.throw(_("Item {0} is not allowed for this branch").format(item_code))

	base_rate = _get_item_price_rate(template.name, ctx)
	add_ons = _get_pos_add_ons(template, ctx)
	add_on_text = frappe.db.get_value("Item", template.name, "imogi_pos_add_ons") or ""
	configured_add_ons = [part.strip() for part in add_on_text.split(",") if part.strip()]
	actual_qty, _, _ = get_stock_availability(template.name, ctx["warehouse"])
	actual_qty, in_stock, _ = resolve_catalog_stock(
		template.name, ctx["warehouse"], actual_qty, cint(template.is_stock_item)
	)

	return {
		"template_item_code": template.name,
		"item_name": template.item_name,
		"description": (template.description or "").strip(),
		"image": template.image,
		"base_rate": base_rate,
		"currency": ctx["currency"],
		"attributes": [],
		"variants": [],
		"add_ons": add_ons,
		"configured_add_ons": configured_add_ons,
		"addon_only": 1,
		"is_stock_item": cint(template.is_stock_item),
		"in_stock": in_stock,
	}


@frappe.whitelist(allow_guest=True)
def get_item_variant_config(template_item_code, pos_profile=None, branch=None):
	"""Return ERPNext item attributes and optional add-ons for variant picker."""
	validate_order_api_access()
	ensure_setup_ready()

	if not template_item_code:
		frappe.throw(_("template_item_code is required"))

	ctx = _get_pos_context(pos_profile, branch=branch)
	template = frappe.get_doc("Item", template_item_code)
	if template.disabled or not template.is_sales_item:
		frappe.throw(_("Item {0} is not available for sale").format(template_item_code))
	if not needs_variant_picker(template_item_code):
		frappe.throw(
			_("Item {0} tidak memerlukan pilihan varian").format(template_item_code),
			title=_("Tanpa Varian"),
		)
	if not template.has_variants:
		frappe.throw(_("Item {0} is not a variant template").format(template_item_code))

	allowed_groups = _allowed_item_groups(ctx)
	if allowed_groups and template.item_group not in allowed_groups:
		frappe.throw(_("Item {0} is not allowed for this branch").format(template_item_code))

	base_rate = _get_item_price_rate(template.name, ctx)
	variants_meta = _get_template_variants_meta(template.name)
	allowed_values = {}
	for variant_row in variants_meta:
		for attribute, value in (variant_row.get("attributes") or {}).items():
			if value:
				allowed_values.setdefault(attribute, set()).add(value)

	attributes = []
	defaults = {}

	for attr_row in template.attributes:
		if attr_row.disabled:
			continue

		values = _get_attribute_values(attr_row.attribute)
		permitted = allowed_values.get(attr_row.attribute)
		if permitted:
			values = [value for value in values if value in permitted]
		if not values:
			continue

		default_value = values[0]
		defaults[attr_row.attribute] = default_value
		value_rows = []
		for value in values:
			value_rows.append(
				{
					"value": value,
					"price_delta": _estimate_attribute_price_delta(
						template.name, attr_row.attribute, value, ctx, base_rate
					),
				}
			)

		attributes.append(
			{
				"attribute": attr_row.attribute,
				"label": attr_row.attribute,
				"default": default_value,
				"values": value_rows,
			}
		)

	return {
		"template_item_code": template.name,
		"item_name": template.item_name,
		"description": (template.description or "").strip(),
		"image": template.image,
		"base_rate": base_rate,
		"currency": ctx["currency"],
		"attributes": attributes,
		"variants": variants_meta,
		"add_ons": _get_pos_add_ons(template, ctx),
	}


@frappe.whitelist(allow_guest=True)
def resolve_item_variant(template_item_code, attributes=None, pos_profile=None, branch=None):
	"""Resolve attribute selection to a concrete variant item using ERPNext get_variant."""
	validate_order_api_access()
	ensure_setup_ready()

	if not template_item_code:
		frappe.throw(_("template_item_code is required"))

	if isinstance(attributes, str):
		attributes = json.loads(attributes or "{}")
	if not isinstance(attributes, dict):
		frappe.throw(_("attributes must be a dictionary"))

	from erpnext.controllers.item_variant import get_variant

	variant = get_variant(template_item_code, attributes)
	variant_code = variant if isinstance(variant, str) else getattr(variant, "name", None)
	if not variant_code:
		frappe.throw(
			_("Variant belum dibuat. Buat variant di ERPNext (Item → template → Create Variants)."),
			title=_("Variant Not Found"),
		)

	item = get_item(variant_code, pos_profile, branch=branch)
	item["template_item_code"] = template_item_code
	item["variant_attributes"] = attributes
	return item
