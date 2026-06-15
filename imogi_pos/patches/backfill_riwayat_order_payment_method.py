# Copyright (c) 2026, Imogi and contributors

import frappe


def execute():
	parents = frappe.db.sql("select distinct parent from `tabIMOGI POS Order Payment`", pluck=True)
	for name in parents:
		modes = frappe.get_all(
			"IMOGI POS Order Payment",
			filters={"parent": name},
			fields=["mode_of_payment"],
			order_by="idx asc",
		)
		seen = []
		for pay in modes:
			mode = (pay.mode_of_payment or "").strip()
			if mode and mode not in seen:
				seen.append(mode)
		frappe.db.set_value(
			"Riwayat Order",
			name,
			"payment_method",
			", ".join(seen) if seen else "",
			update_modified=False,
		)
	frappe.db.commit()
