# Copyright (c) 2026, Imogi and contributors

import frappe


def execute():
	frappe.reload_doc("imogi_pos", "doctype", "imogi_restaurant_area")
