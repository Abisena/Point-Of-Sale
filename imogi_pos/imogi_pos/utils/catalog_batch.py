# Copyright (c) 2026, Imogi and contributors
"""Batch-loaded catalog context — avoids per-item DB round-trips on cashier product grid."""

import frappe
from frappe.utils import cint, flt



class CatalogBatchContext:
	def __init__(self, warehouse, price_list, currency=None):
		self.warehouse = warehouse
		self.price_list = price_list
		self.currency = currency
		self._prepared = False
		self.bin_qty = {}
		self.prices = {}
		self.item_meta = {}
		self.variants_by_template = {}
		self.variant_images = {}
		self.templates_with_attrs = set()
		self.default_bom = {}
		self.bom_requirements = {}

	def prepare(self, item_codes):
		codes = {c for c in (item_codes or []) if c}
		if not codes:
			self._prepared = True
			return

		self._load_item_meta(codes)
		self._load_variants(codes)
		self._load_boms(codes)
		self._load_prices(codes)
		self._load_bins(codes)
		self._prepared = True

	def _load_item_meta(self, codes):
		rows = frappe.get_all(
			"Item",
			filters={"name": ["in", list(codes)]},
			fields=[
				"name",
				"item_group",
				"imogi_pos_category",
				"has_variants",
				"variant_of",
				"is_stock_item",
				"standard_rate",
				"image",
			],
		)
		self.item_meta = {row.name: row for row in rows}

	def _load_variants(self, codes):
		templates = {c for c in codes if cint((self.item_meta.get(c) or {}).get("has_variants"))}

		if not templates:
			return

		rows = frappe.get_all(
			"Item",
			filters={"variant_of": ["in", list(templates)], "disabled": 0, "is_sales_item": 1},
			fields=["name", "variant_of", "image"],
			order_by="name asc",
		)
		for row in rows:
			self.variants_by_template.setdefault(row.variant_of, []).append(row.name)
			if row.image:
				self.variant_images[row.name] = row.image

		if templates:
			attr_parents = frappe.db.sql(
				"""
				SELECT DISTINCT parent
				FROM `tabItem Variant Attribute`
				WHERE parent IN %(parents)s AND disabled = 0
				""",
				{"parents": tuple(templates)},
				as_dict=False,
			)
			self.templates_with_attrs = {row[0] for row in attr_parents}

	def _min_variant_price(self, template_code):
		variant_codes = self.variants_by_template.get(template_code) or []
		if not variant_codes:
			return 0

		positive = [flt(self.prices.get(code)) for code in variant_codes if flt(self.prices.get(code)) > 0]
		if positive:
			return min(positive)

		rates = frappe.get_all(
			"Item",
			filters={"name": ["in", variant_codes]},
			pluck="standard_rate",
		)
		positive = [flt(rate) for rate in rates if flt(rate) > 0]
		return min(positive) if positive else 0

	def _load_prices(self, codes):
		if not self.price_list or not codes:
			return

		expanded = set(codes)
		for code in list(codes):
			meta = self.item_meta.get(code)
			if meta and meta.variant_of:
				expanded.add(meta.variant_of)
			expanded.update(self.variants_by_template.get(code) or [])

		if expanded:
			price_lists = [self.price_list] if self.price_list else []
			from imogi_pos.imogi_pos.utils.branch_pricing import get_master_selling_price_list

			master = get_master_selling_price_list()
			if master and master not in price_lists:
				price_lists.append(master)

			self.prices = {}
			for pl in price_lists:
				rows = frappe.db.sql(
					"""
					SELECT item_code, price_list_rate
					FROM `tabItem Price`
					WHERE price_list = %s AND selling = 1 AND item_code IN %s
					""",
					(pl, tuple(expanded)),
					as_dict=True,
				)
				for row in rows:
					if flt(row.price_list_rate) <= 0:
						continue
					if flt(self.prices.get(row.item_code)) <= 0:
						self.prices[row.item_code] = flt(row.price_list_rate)

		for code in codes:
			if flt(self.prices.get(code)) > 0:
				continue
			meta = self.item_meta.get(code)
			if meta and flt(meta.standard_rate) > 0:
				self.prices[code] = flt(meta.standard_rate)
				continue
			if meta and meta.variant_of and flt(self.prices.get(meta.variant_of)) > 0:
				self.prices[code] = self.prices[meta.variant_of]
				continue
			if meta and cint(meta.has_variants):
				template_price = self._min_variant_price(code)
				if template_price > 0:
					self.prices[code] = template_price

	def _load_bins(self, codes):
		if not self.warehouse or not codes:
			return

		component_codes = set()
		for code in codes:
			for req in self.bom_requirements.get(code) or []:
				component_codes.add(req["item_code"])
			variants = self.variants_by_template.get(code) or []
			for variant in variants:
				for req in self.bom_requirements.get(variant) or []:
					component_codes.add(req["item_code"])

		lookup = set(codes) | component_codes
		if not lookup:
			return

		rows = frappe.db.sql(
			"""
			SELECT item_code, actual_qty
			FROM `tabBin`
			WHERE warehouse = %s AND item_code IN %s
			""",
			(self.warehouse, tuple(lookup) or ("",)),
			as_dict=True,
		)
		self.bin_qty = {row.item_code: flt(row.actual_qty) for row in rows}

	def _load_boms(self, codes):
		all_codes = set(codes)
		for template, variants in self.variants_by_template.items():
			all_codes.add(template)
			all_codes.update(variants)

		if not all_codes:
			return

		bom_rows = frappe.db.sql(
			"""
			SELECT item, name
			FROM `tabBOM`
			WHERE item IN %(items)s AND is_active = 1 AND docstatus < 2
			ORDER BY item ASC, docstatus DESC, is_default DESC, modified DESC
			""",
			{"items": tuple(all_codes)},
			as_dict=True,
		)
		for row in bom_rows:
			if row.item not in self.default_bom:
				self.default_bom[row.item] = row.name

		bom_names = list(self.default_bom.values())
		if not bom_names:
			return

		bom_docs = {name: frappe.get_cached_doc("BOM", name) for name in bom_names}
		for item_code, bom_name in self.default_bom.items():
			bom = bom_docs.get(bom_name)
			if not bom:
				continue
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
			self.bom_requirements[item_code] = requirements

	def get_price(self, item_code):
		if flt(self.prices.get(item_code)) > 0:
			return self.prices[item_code]
		meta = self.item_meta.get(item_code)
		if meta and flt(meta.standard_rate) > 0:
			return flt(meta.standard_rate)
		if meta and meta.variant_of:
			return flt(self.prices.get(meta.variant_of)) or 0
		if meta and cint(meta.has_variants):
			return self._min_variant_price(item_code)
		return 0

	def get_bin_qty(self, item_code):
		return flt(self.bin_qty.get(item_code, 0))

	def get_variants(self, template_code):
		return self.variants_by_template.get(template_code) or []

	def needs_variant_picker(self, item_code):
		variants = self.get_variants(item_code)
		if not variants:
			return False
		if len(variants) == 1:
			return False
		meta = self.item_meta.get(item_code)
		if not meta or not cint(meta.has_variants):
			return True
		if item_code not in self.templates_with_attrs:
			return True
		return True

	def get_auto_variant_code(self, item_code):
		variants = self.get_variants(item_code)
		return variants[0] if len(variants) == 1 else None

	def resolve_image(self, item_code, row_image=None):
		if row_image:
			return row_image

		meta = self.item_meta.get(item_code)
		if meta and meta.get("image"):
			return meta.image

		if meta and meta.variant_of:
			parent = self.item_meta.get(meta.variant_of)
			if parent and parent.get("image"):
				return parent.image

		for code in self.get_variants(item_code):
			image = self.variant_images.get(code)
			if image:
				return image
			child = self.item_meta.get(code)
			if child and child.get("image"):
				return child.image

		return ""

	def item_has_variant_children(self, item_code):
		return bool(self.get_variants(item_code))

	def _stock_availability(self, item_code):
		qty = self.get_bin_qty(item_code)
		return qty, qty > 0, False

	def _apply_bom_limits(self, item_code, finished_qty, is_stock_item):
		requirements = self.bom_requirements.get(item_code, [])
		if not requirements:
			if not cint(is_stock_item):
				return finished_qty, True, False
			return finished_qty, finished_qty > 0, False

		finished_qty = flt(finished_qty)
		max_units = None
		for req in requirements:
			component_qty = self.get_bin_qty(req["item_code"])
			per_unit = flt(req["qty"])
			if per_unit <= 0:
				continue
			if component_qty < per_unit:
				return 0, False, True
			units = int(component_qty // per_unit)
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

	def _template_bom_sellable_qty(self, template_code):
		variant_codes = self.get_variants(template_code)
		if not variant_codes:
			return 0, False

		max_qty = 0
		bom_limited = False
		for code in variant_codes:
			meta = self.item_meta.get(code)
			is_stock_item = cint(meta.is_stock_item) if meta else 0
			finished_qty = self.get_bin_qty(code)
			qty, _, limited = self._apply_bom_limits(code, finished_qty, is_stock_item)
			max_qty = max(max_qty, flt(qty))
			bom_limited = bom_limited or limited
		return max_qty, bom_limited

	def resolve_stock(self, item_code, finished_qty=0, is_stock_item=1):
		if self.item_has_variant_children(item_code):
			sellable_qty, bom_limited = self._template_bom_sellable_qty(item_code)
			if bom_limited:
				return flt(sellable_qty), sellable_qty > 0, True
			return flt(sellable_qty), True, False

		if finished_qty == 0 and cint(is_stock_item):
			finished_qty = self.get_bin_qty(item_code)
		return self._apply_bom_limits(item_code, finished_qty, is_stock_item)

	def serialize_row(self, row):
		item_code = row.get("item_code") or row.get("name")
		meta = self.item_meta.get(item_code)
		item_group = row.get("item_group") or (meta.item_group if meta else None)
		pos_category = row.get("imogi_pos_category") or (meta.imogi_pos_category if meta else None)

		actual_qty = flt(row.get("actual_qty"))
		is_stock_item = cint(row.get("is_stock_item"))
		if meta and not row.get("is_stock_item"):
			is_stock_item = cint(meta.is_stock_item)

		actual_qty, in_stock, bom_limited = self.resolve_stock(item_code, actual_qty, is_stock_item)

		has_variants = int(self.needs_variant_picker(item_code))
		auto_variant = self.get_auto_variant_code(item_code) if not has_variants else None

		if bom_limited:
			display_stock = 1
		else:
			display_stock = cint(is_stock_item) and not (has_variants or auto_variant)

		show_stock_label = int(
			bom_limited or cint(is_stock_item) or self.item_has_variant_children(item_code)
		)

		rate = flt(row.get("price_list_rate") or row.get("standard_rate") or row.get("rate"))
		if rate <= 0:
			rate = self.get_price(item_code)

		return {
			"item_code": item_code,
			"item_name": row.get("item_name"),
			"item_group": item_group,
			"imogi_pos_category": pos_category,
			"description": row.get("description"),
			"image": self.resolve_image(item_code, row.get("item_image") or row.get("image")),
			"rate": rate,
			"currency": row.get("currency") or self.currency,
			"uom": row.get("uom") or row.get("stock_uom"),
			"stock_uom": row.get("stock_uom"),
			"is_stock_item": display_stock,
			"stock_qty": actual_qty,
			"in_stock": in_stock,
			"bom_limited": bom_limited,
			"has_variants": has_variants,
			"auto_variant_item_code": auto_variant,
			"show_stock_label": show_stock_label,
			"variant_of": row.get("variant_of") or (meta.variant_of if meta else None),
		}
