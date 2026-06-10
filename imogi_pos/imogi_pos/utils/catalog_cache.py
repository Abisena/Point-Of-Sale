# Copyright (c) 2026, Imogi and contributors

import frappe


def invalidate_catalog_cache_on_item_update(doc, method=None):
	"""Drop POS catalog cache when sellable item presentation changes."""
	if doc.doctype != "Item":
		return

	if doc.is_new():
		_invalidate()
		return

	before = doc.get_doc_before_save()
	if not before:
		return

	watched = (
		"image",
		"item_name",
		"disabled",
		"is_sales_item",
		"has_variants",
		"variant_of",
		"item_group",
		"imogi_pos_category",
	)
	if any(before.get(field) != doc.get(field) for field in watched):
		_invalidate()


def _invalidate():
	from imogi_pos.api.catalog import invalidate_pos_catalog_cache

	invalidate_pos_catalog_cache()
