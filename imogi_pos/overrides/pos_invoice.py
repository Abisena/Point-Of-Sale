# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import cint, flt

from erpnext.accounts.doctype.pos_invoice.pos_invoice import (
	POSInvoice,
	ProductBundleStockValidationError,
	get_product_bundle_stock_availability,
	get_stock_availability,
)
from erpnext.stock.stock_ledger import is_negative_stock_allowed

from imogi_pos.imogi_pos.utils.bom_stock import get_default_bom, validate_bom_line_stock


class ImogiPOSInvoice(POSInvoice):
	def validate_stock_availablility(self):
		if self.is_return:
			return

		if self.docstatus.is_draft() and not frappe.db.get_value(
			"POS Profile", self.pos_profile, "validate_stock_on_save"
		):
			return

		for row in self.get("items"):
			if row.serial_and_batch_bundle:
				continue

			if frappe.db.exists("Product Bundle", row.item_code):
				self._validate_product_bundle_row(row)
				continue

			if get_default_bom(row.item_code):
				validate_bom_line_stock(
					row.item_code,
					row.warehouse,
					row.stock_qty or row.qty,
					row_idx=row.idx,
				)
				continue

			self._validate_finished_item_row(row)

	def _validate_product_bundle_row(self, row):
		availability, is_stock_item, is_negative_stock_allowed = get_product_bundle_stock_availability(
			row.item_code, row.warehouse, row.stock_qty
		)
		if is_negative_stock_allowed:
			return

		if not isinstance(availability, list):
			return

		error_msgs = []
		for item in availability:
			if flt(item["available"]) < flt(item["required"]):
				error_msgs.append(
					_("<li>Packed Item {0}: Required {1}, Available {2}</li>").format(
						frappe.bold(item["item_code"]),
						frappe.bold(flt(item["required"], 2)),
						frappe.bold(flt(item["available"], 2)),
					)
				)

		if error_msgs:
			frappe.throw(
				_(
					"<b>Row #{0}:</b> Bundle {1} in warehouse {2} has insufficient packed items:<br><div style='margin-top: 15px;'><ul style='line-height: 0.8;'>{3}</ul></div>"
				).format(
					row.idx,
					frappe.bold(row.item_code),
					frappe.bold(row.warehouse),
					"<br>".join(error_msgs),
				),
				title=_("Insufficient Stock for Product Bundle Items"),
				exc=ProductBundleStockValidationError,
			)

	def _validate_finished_item_row(self, row):
		availability, is_stock_item, is_negative_stock_allowed = get_stock_availability(
			row.item_code, row.warehouse
		)
		if is_negative_stock_allowed:
			return

		item_code, warehouse = frappe.bold(row.item_code), frappe.bold(row.warehouse)
		if is_stock_item and flt(availability) <= 0:
			frappe.throw(
				_("Row #{0}: Item {1} has no stock in warehouse {2}.").format(
					row.idx, item_code, warehouse
				),
				title=_("Item Out of Stock"),
			)
		if is_stock_item and flt(availability) < flt(row.stock_qty):
			frappe.throw(
				_("Row #{0}: Item {1} in warehouse {2}: Available {3}, Needed {4}.").format(
					row.idx,
					item_code,
					warehouse,
					frappe.bold(flt(availability, 2)),
					frappe.bold(flt(row.stock_qty, 2)),
				),
				title=_("Insufficient Stock"),
			)
