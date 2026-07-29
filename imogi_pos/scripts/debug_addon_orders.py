import frappe


def run():
	for name in ("ORD-2026-00213", "ORD-2026-00214", "ORD-2026-00067", "ORD-2026-00212"):
		if not frappe.db.exists("Riwayat Order", name):
			print(name, "MISSING")
			continue
		o = frappe.get_doc("Riwayat Order", name)
		items = [(r.item_code, r.qty, r.rate) for r in o.items]
		ko = frappe.get_all(
			"IMOGI Kitchen Order",
			filters={"pos_order": name, "docstatus": ["<", 2]},
			fields=["name", "status"],
		)
		print(
			name,
			"table=", o.restaurant_table,
			"status=", o.status,
			"grand_total=", o.grand_total,
			"requires_kitchen=", o.requires_kitchen,
			"kitchen_order=", o.kitchen_order,
			"items=", items,
			"kitchen_tickets=", ko,
		)

	tables = frappe.get_all(
		"Restaurant Table",
		filters={"status": "Occupied"},
		fields=["name", "table_number", "current_order"],
	)
	print("occupied_tables:", tables)
