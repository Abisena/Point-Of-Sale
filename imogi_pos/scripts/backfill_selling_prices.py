import frappe
from frappe.utils import flt

from imogi_pos.imogi_pos.utils.import_helpers import get_selling_price_list, upsert_selling_item_price


def execute():
	company = frappe.db.get_single_value("IMOGI POS Settings", "default_company")
	pl = get_selling_price_list(company)
	created = updated = 0
	for row in frappe.get_all(
		"Item",
		filters={"disabled": 0, "is_sales_item": 1, "has_variants": 0},
		fields=["name", "standard_rate", "stock_uom"],
	):
		if flt(row.standard_rate) <= 0:
			continue
		result = upsert_selling_item_price(
			row.name, row.standard_rate, uom=row.stock_uom, company=company
		)
		if result == "created":
			created += 1
		elif result == "updated":
			updated += 1
	frappe.db.commit()
	return {"price_list": pl, "created": created, "updated": updated}
