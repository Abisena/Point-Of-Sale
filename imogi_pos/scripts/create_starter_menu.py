"""Create a small starter menu (real, permanent items) for the Kafe/F&B site.

Run: bench --site imogi.pos execute imogi_pos.scripts.create_starter_menu.run
"""

import frappe

FOOD_ITEMS = [
	("MENU-NASGOR-SPESIAL", "Nasi Goreng Spesial", 25000),
	("MENU-MIE-GORENG-AYAM", "Mie Goreng Ayam", 22000),
	("MENU-AYAM-GEPREK", "Ayam Geprek", 20000),
	("MENU-KENTANG-GORENG", "Kentang Goreng", 15000),
]

BEVERAGE_ITEMS = [
	("MENU-ES-TEH-MANIS", "Es Teh Manis", 8000),
	("MENU-KOPI-SUSU-GULA-AREN", "Kopi Susu Gula Aren", 18000),
	("MENU-ES-JERUK", "Es Jeruk", 10000),
	("MENU-AMERICANO", "Americano", 15000),
]


def _create_item(item_code, item_name, item_group, pos_category, rate):
	if frappe.db.exists("Item", item_code):
		print("skip (already exists):", item_code)
		return

	doc = frappe.get_doc(
		{
			"doctype": "Item",
			"item_code": item_code,
			"item_name": item_name,
			"item_group": item_group,
			"imogi_pos_category": pos_category,
			"stock_uom": "Nos",
			"is_stock_item": 0,
		}
	)
	doc.insert(ignore_permissions=True)

	frappe.get_doc(
		{
			"doctype": "Item Price",
			"item_code": item_code,
			"price_list": "Standard Selling",
			"price_list_rate": rate,
			"selling": 1,
		}
	).insert(ignore_permissions=True)

	print("created:", item_code, "-", item_name, "@", rate)


def run():
	for code, name, rate in FOOD_ITEMS:
		_create_item(code, name, "Food", "Food", rate)
	for code, name, rate in BEVERAGE_ITEMS:
		_create_item(code, name, "Beverage", "Beverage", rate)

	frappe.db.commit()
	print("\nDone.", len(FOOD_ITEMS), "food items,", len(BEVERAGE_ITEMS), "beverage items.")
