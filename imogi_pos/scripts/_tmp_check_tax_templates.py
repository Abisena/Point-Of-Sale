import frappe


def run():
	frappe.set_user("Administrator")
	print("=== Item Tax Template (dipakai dialog Pilih Tax kita) ===")
	rows = frappe.get_all("Item Tax Template", fields=["name", "title", "company"])
	for r in rows:
		print(" ", r.name, "| company:", r.company)

	print()
	print("=== Purchase Taxes and Charges Template (beda doctype, header-level, sudah kita sembunyikan) ===")
	rows2 = frappe.get_all("Purchase Taxes and Charges Template", fields=["name", "title", "company"])
	for r in rows2:
		print(" ", r.name, "| company:", r.company)
