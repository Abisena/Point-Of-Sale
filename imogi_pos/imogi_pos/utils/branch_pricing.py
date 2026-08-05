# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import cint, flt

from imogi_pos.imogi_pos.utils.branch import get_accessible_branches, get_branch
from imogi_pos.imogi_pos.utils.flow import get_settings
from imogi_pos.imogi_pos.utils.import_helpers import ensure_uom, get_selling_price_list


def get_master_selling_price_list(settings=None, company=None):
	settings = settings or get_settings()
	if settings.get("master_selling_price_list"):
		return settings.master_selling_price_list

	company = company or settings.default_company
	return get_selling_price_list(company)


def get_branch_selling_price_list(branch_code=None, branch=None, pos_profile=None):
	branch = branch or (get_branch(branch_code=branch_code) if branch_code else None)
	if branch and branch.get("selling_price_list"):
		return branch["selling_price_list"]

	pos_profile = pos_profile or (branch or {}).get("pos_profile")
	if pos_profile:
		return frappe.db.get_value("POS Profile", pos_profile, "selling_price_list")

	return get_master_selling_price_list()


def _fetch_item_price_rate(item_code, price_list):
	if not item_code or not price_list:
		return 0
	rate = frappe.db.get_value(
		"Item Price",
		{"item_code": item_code, "price_list": price_list, "selling": 1},
		"price_list_rate",
	)
	return flt(rate) if rate is not None and flt(rate) > 0 else 0


def resolve_selling_price_rate(item_code, price_list=None, company=None):
	"""Resolve selling rate from branch list, then master / Standard Selling fallback."""
	settings = get_settings()
	company = company or settings.default_company
	price_lists = []
	if price_list:
		price_lists.append(price_list)
	master = get_master_selling_price_list(settings, company=company)
	if master and master not in price_lists:
		price_lists.append(master)
	pos_default = get_selling_price_list(company)
	if pos_default and pos_default not in price_lists:
		price_lists.append(pos_default)

	for pl in price_lists:
		rate = _fetch_item_price_rate(item_code, pl)
		if rate > 0:
			return rate
		template = frappe.db.get_value("Item", item_code, "variant_of")
		if template:
			rate = _fetch_item_price_rate(template, pl)
			if rate > 0:
				return rate

	rate = flt(frappe.db.get_value("Item", item_code, "standard_rate"))
	if rate > 0:
		return rate

	if cint(frappe.db.get_value("Item", item_code, "has_variants")):
		variant_rates = frappe.get_all(
			"Item",
			filters={"variant_of": item_code, "disabled": 0, "is_sales_item": 1},
			pluck="standard_rate",
		)
		positive = [flt(value) for value in variant_rates if flt(value) > 0]
		if positive:
			return min(positive)

	return 0


def collect_branch_price_lists(company=None, include_master=1):
	settings = get_settings()
	company = company or settings.default_company
	lists = []

	if include_master:
		master = get_master_selling_price_list(settings, company=company)
		if master:
			lists.append(master)

	for row in get_accessible_branches(company=company, include_inactive=0):
		price_list = get_branch_selling_price_list(branch=row)
		if price_list and price_list not in lists:
			lists.append(price_list)

	return lists


def _upsert_item_price_on_list(item_code, rate, price_list, uom=None):
	rate = flt(rate)
	if rate <= 0 or not price_list:
		return None

	if frappe.get_cached_value("Item", item_code, "has_variants"):
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
		frappe.db.set_value("Item Price", name, "price_list_rate", rate)
		return "updated"

	doc = frappe.new_doc("Item Price")
	doc.item_code = item_code
	doc.price_list = price_list
	doc.uom = uom
	doc.price_list_rate = rate
	doc.insert(ignore_permissions=True)
	return "created"


def sync_prices_from_master(branch_codes=None, item_codes=None, price_lists=None):
	"""Copy selling Item Prices from master price list to branch lists."""
	settings = get_settings()
	company = settings.default_company
	master = get_master_selling_price_list(settings, company=company)
	if not master:
		frappe.throw(_("Set Master Selling Price List di IMOGI POS Settings"))

	target_lists = price_lists or []
	if branch_codes:
		for code in branch_codes:
			target_lists.append(get_branch_selling_price_list(branch_code=code))
	elif not target_lists:
		target_lists = collect_branch_price_lists(company=company, include_master=0)

	target_lists = [pl for pl in dict.fromkeys(target_lists or []) if pl and pl != master]
	if not target_lists:
		return {"updated": 0, "created": 0, "skipped": 0, "master": master, "targets": []}

	filters = {"price_list": master, "selling": 1}
	if item_codes:
		filters["item_code"] = ["in", item_codes]

	source_prices = frappe.get_all(
		"Item Price",
		filters=filters,
		fields=["item_code", "price_list_rate", "uom"],
	)
	if not source_prices:
		frappe.throw(_("Tidak ada Item Price di master price list {0}").format(master))

	stats = {"updated": 0, "created": 0, "skipped": 0, "master": master, "targets": target_lists}
	for row in source_prices:
		for target in target_lists:
			result = _upsert_item_price_on_list(row.item_code, row.price_list_rate, target, uom=row.uom)
			if result == "updated":
				stats["updated"] += 1
			elif result == "created":
				stats["created"] += 1
			else:
				stats["skipped"] += 1

	return stats


def sync_item_price_to_branches(item_code, rate, uom=None, company=None):
	"""Upsert selling Item Price on master/POS list (used by menu import).

	By default writes **one** Item Price only. Optional fan-out to branch lists when
	Settings → Juga Sync Harga ke Cabang saat Import Menu is enabled.
	"""
	settings = get_settings()
	master = get_master_selling_price_list(settings, company=company)
	result = _upsert_item_price_on_list(item_code, rate, master, uom=uom)
	if cint(settings.get("sync_prices_to_branches_on_import")):
		for price_list in collect_branch_price_lists(
			company=company or settings.default_company, include_master=0
		):
			if price_list and price_list != master:
				_upsert_item_price_on_list(item_code, rate, price_list, uom=uom)
	return result


def ensure_branch_price_list(branch_code, copy_from_master=1):
	"""Create a branch-specific selling price list and optionally copy master prices."""
	branch = get_branch(branch_code=branch_code)
	if not branch:
		frappe.throw(_("Cabang tidak ditemukan"))

	settings = get_settings()
	master = get_master_selling_price_list(settings, company=branch.get("company"))
	existing = branch.get("selling_price_list")
	if existing and existing != master:
		return {"price_list": existing, "created": False}

	doc = frappe.get_doc("IMOGI Branch", branch["name"] or branch["branch_code"])
	company = doc.company
	currency = frappe.db.get_value("Company", company, "default_currency")
	label = doc.branch_name or doc.branch_code
	price_list_name = f"{doc.branch_code}-SELLING"

	if frappe.db.exists("Price List", price_list_name):
		price_list_name = f"{label}-SELLING"[:140]
		base = price_list_name
		counter = 1
		while frappe.db.exists("Price List", price_list_name):
			price_list_name = f"{base}-{counter}"[:140]
			counter += 1

	pl = frappe.new_doc("Price List")
	pl.price_list_name = price_list_name
	pl.currency = currency
	pl.selling = 1
	pl.enabled = 1
	pl.insert(ignore_permissions=True)

	doc.selling_price_list = pl.name
	doc.save(ignore_permissions=True)

	copied = {"updated": 0, "created": 0, "skipped": 0}
	if cint(copy_from_master):
		copied = sync_prices_from_master(branch_codes=[doc.branch_code], price_lists=[pl.name])

	frappe.db.commit()
	return {"price_list": pl.name, "created": True, "sync": copied}
