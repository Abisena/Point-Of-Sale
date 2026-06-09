# Copyright (c) 2026, Imogi and contributors
"""Business type templates for IMOGI POS Setup Wizard."""

from frappe import _

TYPE_WARUNG = "Warung / Sembako"
TYPE_KAFE = "Kafe / F&B"
TYPE_FASHION = "Fashion / Retail"
TYPE_MINIMARKET = "Minimarket"
TYPE_JASA = "Jasa / Servis"
TYPE_CUSTOM = "Lainnya / Custom"

# Legacy mapping for existing flows
FLOW_UMKM = "UMKM"
FLOW_RESTAURANT = "Restaurant / Cafe"

ALL_BUSINESS_TYPES = (
	TYPE_WARUNG,
	TYPE_KAFE,
	TYPE_FASHION,
	TYPE_MINIMARKET,
	TYPE_JASA,
	TYPE_CUSTOM,
)


def get_business_template(business_type):
	return BUSINESS_TEMPLATES.get(business_type) or BUSINESS_TEMPLATES[TYPE_CUSTOM]


def get_flow_profile(business_type):
	template = get_business_template(business_type)
	return template.get("flow_profile", FLOW_UMKM)


def list_business_templates():
	out = []
	for key in ALL_BUSINESS_TYPES:
		t = BUSINESS_TEMPLATES[key]
		out.append(
			{
				"value": key,
				"title": t["title"],
				"subtitle": t["subtitle"],
				"icon": t.get("icon", "fa-store"),
				"badges": t.get("badges", []),
				"preview": {
					"tax_template": t.get("tax_label"),
					"coa": t.get("coa_label"),
					"item_groups": ", ".join(t.get("item_groups", [])),
					"customer_groups": ", ".join(t.get("customer_groups", [])),
				},
				"flow_profile": t.get("flow_profile"),
			}
		)
	return out


BUSINESS_TEMPLATES = {
	TYPE_WARUNG: {
		"title": _("Warung / Sembako"),
		"subtitle": _("Kelontong, sembako"),
		"icon": "fa-shopping-basket",
		"badges": [_("No PPN"), _("Eceran")],
		"flow_profile": FLOW_UMKM,
		"coa_chart": "Indonesia - Chart of Accounts",
		"coa_label": _("COA template Indonesia"),
		"tax_label": _("Tax Template: tidak kena PPN"),
		"apply_ppn": False,
		"ppn_rate": 0,
		"item_groups": ["Sembako", "Minuman", "Snack"],
		"customer_groups": ["Walk-in", "Grosir"],
		"supplier_groups": ["Distributor", "Agent"],
		"price_lists": ["Standard Selling"],
		"enable_kitchen": 0,
		"enable_fulfillment": 0,
		"enable_pos_shift": 0,
		"kitchen_item_groups": "",
	},
	TYPE_KAFE: {
		"title": _("Kafe / F&B"),
		"subtitle": _("Kafe, restoran, kantin"),
		"icon": "fa-coffee",
		"badges": [_("Modifier"), _("PPN 10%")],
		"flow_profile": FLOW_RESTAURANT,
		"coa_chart": "Indonesia - Chart of Accounts",
		"coa_label": _("COA template Indonesia"),
		"tax_label": _("Tax Template: PPN 10%"),
		"apply_ppn": True,
		"ppn_rate": 10,
		"item_groups": ["Food", "Beverage", "Dessert", "Consumable"],
		"customer_groups": ["Walk-in", "Member"],
		"supplier_groups": ["Distributor", "Brand"],
		"price_lists": ["Standard Selling"],
		"enable_kitchen": 1,
		"enable_fulfillment": 1,
		"enable_pos_shift": 1,
		"kitchen_item_groups": "Consumable,Food",
	},
	TYPE_FASHION: {
		"title": _("Fashion / Retail"),
		"subtitle": _("Pakaian, sepatu"),
		"icon": "fa-tags",
		"badges": [_("Variant"), _("PPN 11%")],
		"flow_profile": FLOW_UMKM,
		"coa_chart": "Indonesia - Chart of Accounts",
		"coa_label": _("COA template Indonesia"),
		"tax_label": _("Tax Template: PPN 11%"),
		"apply_ppn": True,
		"ppn_rate": 11,
		"item_groups": ["Pakaian", "Sepatu", "Aksesoris"],
		"customer_groups": ["Walk-in", "Member", "Grosir"],
		"supplier_groups": ["Brand", "Distributor"],
		"price_lists": ["Standard Selling"],
		"enable_kitchen": 0,
		"enable_fulfillment": 0,
		"enable_pos_shift": 0,
		"kitchen_item_groups": "",
	},
	TYPE_MINIMARKET: {
		"title": _("Minimarket"),
		"subtitle": _("Convenience store"),
		"icon": "fa-building",
		"badges": [_("Batch"), _("Barcode")],
		"flow_profile": FLOW_UMKM,
		"coa_chart": "Indonesia - Chart of Accounts",
		"coa_label": _("COA template Indonesia"),
		"tax_label": _("Tax Template: PPN 11%"),
		"apply_ppn": True,
		"ppn_rate": 11,
		"item_groups": ["Sembako", "Minuman", "Snack", "Frozen"],
		"customer_groups": ["Walk-in"],
		"supplier_groups": ["Distributor", "Agent"],
		"price_lists": ["Standard Selling"],
		"enable_kitchen": 0,
		"enable_fulfillment": 0,
		"enable_pos_shift": 1,
		"kitchen_item_groups": "",
	},
	TYPE_JASA: {
		"title": _("Jasa / Servis"),
		"subtitle": _("Bengkel, laundry"),
		"icon": "fa-wrench",
		"badges": [_("No stok"), _("Invoice")],
		"flow_profile": FLOW_UMKM,
		"coa_chart": "Indonesia - Chart of Accounts",
		"coa_label": _("COA template Indonesia"),
		"tax_label": _("Tax Template: tidak kena PPN"),
		"apply_ppn": False,
		"ppn_rate": 0,
		"item_groups": ["Jasa", "Service"],
		"customer_groups": ["Walk-in", "Member"],
		"supplier_groups": ["Vendor"],
		"price_lists": ["Standard Selling"],
		"enable_kitchen": 0,
		"enable_fulfillment": 0,
		"enable_pos_shift": 0,
		"kitchen_item_groups": "",
		"non_stock_items": True,
	},
	TYPE_CUSTOM: {
		"title": _("Lainnya / Custom"),
		"subtitle": _("Setup manual"),
		"icon": "fa-sliders",
		"badges": [_("Custom")],
		"flow_profile": FLOW_UMKM,
		"coa_chart": "Indonesia - Chart of Accounts",
		"coa_label": _("COA template Indonesia"),
		"tax_label": _("Tax Template: manual"),
		"apply_ppn": False,
		"ppn_rate": 0,
		"item_groups": ["Products"],
		"customer_groups": ["Walk-in"],
		"supplier_groups": ["Distributor"],
		"price_lists": ["Standard Selling"],
		"enable_kitchen": 0,
		"enable_fulfillment": 0,
		"enable_pos_shift": 0,
		"kitchen_item_groups": "",
	},
}


AUTO_CREATED_CHECKLIST = [
	_("Company + Warehouse"),
	_("POS Profile + Shift Type"),
	_("COA template Indonesia"),
	_("Customer Group + Supplier Group"),
	_("Price List (Eceran)"),
	_("Letter Head + Terms & Conditions"),
	_("Sales Target (jika diisi)"),
	_("User + Role Kasir"),
	_("Tax Template + Tax Rule (otomatis)"),
	_("Fiscal Year + Currency IDR"),
	_("Supplier (jika diisi)"),
	_("Mode of Payment aktif"),
	_("Cost Center"),
	_("Item / Stok awal (jika diisi)"),
]
