# Copyright (c) 2026, Imogi and contributors
# For license information, please see license.txt

import json

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, flt, now_datetime

from imogi_pos.imogi_pos.utils.business_profile import uses_kitchen_or_fulfillment_flow
from imogi_pos.imogi_pos.utils.flow import (
	create_delivery_task,
	create_fulfillment_task,
	create_kitchen_order,
	create_pos_invoice_from_order,
	get_settings,
	is_kitchen_item,
	release_restaurant_table,
	reserve_restaurant_table,
	set_order_flags,
)


class RiwayatOrder(Document):
	def before_insert(self):
		if not self.cashier and frappe.session.user and frappe.session.user != "Guest":
			self.cashier = frappe.session.user

	def validate(self):
		self.set_currency()
		self.calculate_totals()
		set_order_flags(self)
		self.sync_payment_method()
		self.validate_payments()
		from imogi_pos.imogi_pos.utils.approval_hooks import complimentary_discount_check

		complimentary_discount_check(self)

	def before_submit(self):
		if frappe.flags.get("syncing_from_pos_invoice"):
			return
		if self.status not in ("Draft", "Awaiting Payment"):
			frappe.throw(_("Order can only be submitted from Draft or Awaiting Payment status"))

	def on_submit(self):
		if self.status == "Draft":
			self.db_set("status", "Awaiting Payment")
		if self.order_source != "IMOGI API":
			self._emit_webhook("order.created")

	def on_cancel(self):
		self.db_set("status", "Cancelled")
		release_restaurant_table(self)

	def set_currency(self):
		if not self.currency and self.company:
			self.currency = frappe.get_cached_value("Company", self.company, "default_currency")

	def calculate_totals(self):
		total_qty = 0
		subtotal = 0
		for row in self.items:
			row.amount = flt(row.qty) * flt(row.rate)
			total_qty += flt(row.qty)
			subtotal += flt(row.amount)
			if row.item_code:
				row.is_kitchen_item = 1 if is_kitchen_item(row.item_code) else 0

		self.total_qty = total_qty
		self.subtotal = subtotal

		discount_amount = 0
		if self.discount_type == "Percent" and flt(self.discount_value):
			discount_amount = subtotal * flt(self.discount_value) / 100
		elif self.discount_type == "Amount" and flt(self.discount_value):
			discount_amount = min(flt(self.discount_value), subtotal)
		elif self.discount_type == "Complimentary":
			discount_amount = subtotal

		voucher_discount = flt(self.voucher_discount_amount)
		loyalty_discount = flt(self.loyalty_discount_amount)
		promo_discount = flt(self.promo_discount_amount)
		total_discount = min(subtotal, discount_amount + voucher_discount + loyalty_discount + promo_discount)

		self.discount_amount = total_discount
		net_before_tax = max(0, flt(subtotal) - flt(total_discount))
		from imogi_pos.imogi_pos.utils.sales_tax import compute_sales_tax

		tax_result = compute_sales_tax(net_before_tax)
		self.taxable_amount = flt(tax_result["taxable_amount"])
		self.tax_amount = flt(tax_result["tax_amount"])
		self.grand_total = flt(tax_result["grand_total"])
		self.paid_amount = sum(flt(p.amount) for p in self.payments)

	def validate_payments(self):
		if self.status in ("Awaiting Payment",) and self.payments:
			if flt(self.paid_amount) < flt(self.grand_total):
				frappe.msgprint(
					_("Paid amount is less than grand total"),
					indicator="orange",
					alert=True,
				)

	def sync_payment_method(self):
		modes = []
		for row in self.payments or []:
			mode = (row.mode_of_payment or "").strip()
			if mode and mode not in modes:
				modes.append(mode)
		self.payment_method = ", ".join(modes)

	@frappe.whitelist()
	def action_confirm_order(self):
		"""Step 01 → move to payment."""
		self.check_permission("write")
		if self.docstatus != 1:
			frappe.throw(_("Submit the order before confirming for payment"))
		if self.status != "Draft":
			frappe.throw(_("Order is not in Draft status"))
		self.db_set("status", "Awaiting Payment")
		if self.restaurant_table:
			reserve_restaurant_table(self)
		return self.name

	@frappe.whitelist()
	def action_process_payment(self, silent=False):
		"""Step 02 — Payment processing, POS Invoice, stock (Step 06 via invoice)."""
		silent = cint(silent)
		self.check_permission("write")
		if self.status not in ("Awaiting Payment", "Draft", "Paid"):
			frappe.throw(_("Payment can only be processed for orders awaiting payment"))

		if self.status == "Paid" and self.pos_invoice:
			return self.action_resume_flow()

		if not self.payments:
			frappe.throw(_("Add at least one payment row"))

		if flt(self.paid_amount) < flt(self.grand_total):
			frappe.throw(_("Paid amount must be at least equal to grand total"))

		pos_invoice = None
		try:
			from imogi_pos.imogi_pos.utils.franchise import apply_order_royalty

			apply_order_royalty(self)
			pos_invoice = create_pos_invoice_from_order(self)
			self.db_set({"pos_invoice": pos_invoice.name, "status": "Paid"})
			frappe.db.commit()
			self.reload()
			from imogi_pos.imogi_pos.utils.loyalty import apply_loyalty_after_payment

			apply_loyalty_after_payment(self)
			frappe.db.commit()
			self._run_post_payment_steps()
			if not silent:
				if not uses_kitchen_or_fulfillment_flow():
					frappe.msgprint(
						_("Payment processed. Order completed. POS Invoice {0}.").format(
							frappe.bold(pos_invoice.name)
						),
						indicator="green",
						alert=True,
					)
				else:
					frappe.msgprint(
						_("Payment processed. POS Invoice {0} created.").format(
							frappe.bold(pos_invoice.name)
						),
						indicator="green",
						alert=True,
					)
			return pos_invoice.name
		except Exception:
			frappe.db.rollback()
			raise

	@frappe.whitelist()
	def action_resume_flow(self):
		"""Resume kitchen/fulfillment/service after partial payment success."""
		self.check_permission("write")
		if not self.pos_invoice:
			frappe.throw(_("No POS Invoice linked to resume flow"))

		self._run_post_payment_steps()
		frappe.msgprint(
			_("Flow resumed for order linked to {0}").format(frappe.bold(self.pos_invoice)),
			indicator="blue",
			alert=True,
		)
		return self.pos_invoice

	def _run_post_payment_steps(self):
		try:
			self._start_conditional_steps()
			self._notify_status()
		except Exception:
			frappe.log_error(
				title=_("IMOGI POS post-payment flow failed for {0}").format(self.name),
				message=frappe.get_traceback(),
			)
			frappe.msgprint(
				_(
					"Payment recorded but next step failed. Use <b>Resume Flow</b> or contact admin."
				),
				indicator="orange",
				alert=True,
			)

	def _notify_status(self):
		from imogi_pos.imogi_pos.utils.notifications import notify_order_status

		notify_order_status(self.name, self.status)

	def _start_conditional_steps(self):
		from imogi_pos.imogi_pos.utils.feature_gating import is_setting_enabled

		settings = get_settings()

		if self.requires_kitchen and is_setting_enabled("enable_kitchen_display", settings) and not self.kitchen_order:
			ko = create_kitchen_order(self)
			self.db_set({"kitchen_order": ko.name, "status": "In Kitchen"})
			self._notify_status()
			return

		if self.requires_fulfillment and is_setting_enabled("enable_fulfillment", settings) and not self.fulfillment_task:
			ft = create_fulfillment_task(self)
			self.db_set({"fulfillment_task": ft.name, "status": "In Fulfillment"})
			self._notify_status()
			return

		if not self.requires_kitchen and not self.requires_fulfillment:
			self._complete_direct_order()
			return

		if self.status == "Paid" or not self.delivery_task:
			self._start_service_phase()
			self._notify_status()

	def _complete_direct_order(self):
		"""Payment completes the order when no kitchen/fulfillment steps apply."""
		self.db_set(
			{
				"status": "Completed",
				"service_completed_at": now_datetime(),
			}
		)
		release_restaurant_table(self)
		frappe.publish_realtime("imogi_pos_order_completed", {"order": self.name})
		if self.order_source != "IMOGI API":
			self._emit_webhook("order.completed")

	def _start_service_phase(self):
		dt = create_delivery_task(self)
		if dt:
			self.db_set(
				{
					"delivery_task": dt.name,
					"status": "In Service",
					"service_started_at": now_datetime(),
				}
			)
		else:
			self.db_set({"status": "In Service", "service_started_at": now_datetime()})

	@frappe.whitelist()
	def action_complete_kitchen(self):
		"""Step 03 complete → Kitchen Ready or next step."""
		self.check_permission("write")
		if self.status != "In Kitchen":
			frappe.throw(_("Order is not in kitchen"))

		if self.kitchen_order:
			ko = frappe.get_doc("IMOGI Kitchen Order", self.kitchen_order)
			if ko.docstatus == 0:
				ko.submit()
			ko.db_set("status", "Done")

		from imogi_pos.imogi_pos.utils.feature_gating import is_setting_enabled

		settings = get_settings()
		if self.requires_fulfillment and is_setting_enabled("enable_fulfillment", settings):
			ft = create_fulfillment_task(self)
			self.db_set({"fulfillment_task": ft.name, "status": "In Fulfillment"})
		else:
			self.db_set("status", "Kitchen Ready")
			self._start_service_phase()
		return self.name

	@frappe.whitelist()
	def action_complete_fulfillment(self):
		"""Step 04 complete."""
		self.check_permission("write")
		if self.status != "In Fulfillment":
			frappe.throw(_("Order is not in fulfillment"))

		if self.fulfillment_task:
			ft = frappe.get_doc("IMOGI Fulfillment Task", self.fulfillment_task)
			ft.validate_completion()
			if ft.docstatus == 0:
				ft.submit()
			ft.db_set("status", "Done")

		self.db_set("status", "Fulfilled")
		self._start_service_phase()
		return self.name

	@frappe.whitelist()
	def action_complete_service(self):
		"""Step 05 complete → Completed (END)."""
		self.check_permission("write")
		if self.status != "In Service":
			frappe.throw(_("Order is not in service"))

		if self.delivery_task:
			dt = frappe.get_doc("IMOGI Delivery Task", self.delivery_task)
			dt.mark_completed()
			if dt.docstatus == 0:
				dt.submit()

		self.db_set(
			{
				"status": "Completed",
				"service_completed_at": now_datetime(),
			}
		)
		release_restaurant_table(self)
		frappe.publish_realtime("imogi_pos_order_completed", {"order": self.name})
		return self.name

	@frappe.whitelist()
	def action_void_order(self, reason=None, approval_code=None):
		"""Cancel unpaid order or block void on paid orders (use refund instead)."""
		from imogi_pos.imogi_pos.utils.approval import require_supervisor_approval
		from imogi_pos.imogi_pos.utils.feature_gating import require_feature_operational

		require_feature_operational("void_order")
		require_supervisor_approval(
			"Void",
			reference_name=self.name,
			reason=reason,
			amount=flt(self.grand_total),
			approval_code=approval_code,
		)
		self.check_permission("write")

		if self.status in ("Cancelled", "Refunded"):
			frappe.throw(_("Order is already {0}").format(self.status))

		if self.pos_invoice and self.status not in ("Awaiting Payment", "Draft"):
			frappe.throw(
				_("Paid orders cannot be voided. Use <b>Refund Order</b> instead."),
				title=_("Use Refund"),
			)

		if reason:
			self.db_set("remarks", reason)

		if self.docstatus == 1:
			self.cancel()
		else:
			self.db_set("status", "Cancelled")

		frappe.msgprint(_("Order {0} voided.").format(frappe.bold(self.name)), indicator="orange")
		if self.order_source != "IMOGI API":
			self._emit_webhook("order.cancelled")
		return self.name

	@frappe.whitelist()
	def action_refund_order(self, reason=None, approval_code=None):
		"""Full refund via POS Invoice Return."""
		from imogi_pos.imogi_pos.utils.approval import require_supervisor_approval
		from imogi_pos.imogi_pos.utils.feature_gating import require_feature_operational

		require_feature_operational("refund")
		require_supervisor_approval(
			"Refund",
			reference_name=self.name,
			reason=reason,
			amount=flt(self.grand_total),
			approval_code=approval_code,
		)
		self.check_permission("write")

		if self.status in ("Cancelled", "Refunded"):
			frappe.throw(_("Order is already {0}").format(self.status))

		if not self.pos_invoice:
			frappe.throw(_("No POS Invoice linked — use Void Order instead"))

		if flt(self.refunded_amount) >= flt(self.grand_total):
			frappe.throw(_("Order already fully refunded"))

		from erpnext.controllers.sales_and_purchase_return import make_return_doc

		return_invoice = make_return_doc("POS Invoice", self.pos_invoice)
		return_invoice.is_pos = 1
		return_invoice.insert(ignore_permissions=True)
		return_invoice.submit()

		updates = {
			"return_pos_invoice": return_invoice.name,
			"refunded_amount": flt(self.grand_total),
			"status": "Refunded",
		}
		if reason:
			updates["remarks"] = reason

		self.db_set(updates)
		release_restaurant_table(self)
		frappe.msgprint(
			_("Refund processed. Return Invoice {0}.").format(frappe.bold(return_invoice.name)),
			indicator="green",
			alert=True,
		)
		if self.order_source != "IMOGI API":
			self._emit_webhook("order.refunded")
		return return_invoice.name

	def _get_refunded_qty_by_item(self):
		if not self.pos_invoice:
			return {}

		returns = frappe.get_all(
			"POS Invoice",
			filters={"return_against": self.pos_invoice, "docstatus": 1},
			pluck="name",
		)
		totals = {}
		for ret in returns:
			for row in frappe.get_all(
				"POS Invoice Item",
				filters={"parent": ret},
				fields=["item_code", "qty"],
			):
				totals[row.item_code] = totals.get(row.item_code, 0) + abs(flt(row.qty))
		return totals

	@frappe.whitelist()
	def action_partial_refund(self, refund_items=None, reason=None):
		"""Refund selected line items (partial refund)."""
		from imogi_pos.imogi_pos.utils.feature_gating import require_feature_operational

		require_feature_operational("refund")
		self.check_permission("write")

		if self.status in ("Cancelled", "Refunded"):
			frappe.throw(_("Order is already {0}").format(self.status))

		if not self.pos_invoice:
			frappe.throw(_("No POS Invoice linked — use Void Order instead"))

		if flt(self.refunded_amount) >= flt(self.grand_total):
			frappe.throw(_("Order already fully refunded"))

		if isinstance(refund_items, str):
			refund_items = json.loads(refund_items)
		if not refund_items:
			frappe.throw(_("Select at least one item to refund"))

		from erpnext.controllers.sales_and_purchase_return import make_return_doc

		return_invoice = make_return_doc("POS Invoice", self.pos_invoice)
		return_invoice.is_pos = 1

		refund_map = {
			row["item_code"]: flt(row.get("qty"))
			for row in refund_items
			if row.get("item_code") and flt(row.get("qty"))
		}
		if not refund_map:
			frappe.throw(_("Each refund item must include item_code and qty"))

		already_refunded = self._get_refunded_qty_by_item()
		new_rows = []
		for row in return_invoice.items:
			code = row.item_code
			if code not in refund_map:
				continue

			sold_qty = flt(
				frappe.db.get_value(
					"POS Invoice Item",
					{"parent": self.pos_invoice, "item_code": code},
					"qty",
				)
			)
			remaining = sold_qty - flt(already_refunded.get(code, 0))
			qty = min(refund_map[code], remaining)
			if qty <= 0:
				continue
			row.qty = -qty
			new_rows.append(row)

		if not new_rows:
			frappe.throw(_("Nothing left to refund for selected items"))

		return_invoice.items = new_rows
		return_invoice.insert(ignore_permissions=True)
		return_invoice.submit()

		refund_value = abs(flt(return_invoice.grand_total))
		new_refunded = flt(self.refunded_amount) + refund_value
		status = "Refunded" if new_refunded >= flt(self.grand_total) else "Partially Refunded"

		updates = {
			"return_pos_invoice": return_invoice.name,
			"refunded_amount": new_refunded,
			"status": status,
		}
		if reason:
			updates["remarks"] = reason

		self.db_set(updates)
		if status == "Refunded":
			release_restaurant_table(self)

		frappe.msgprint(
			_("Partial refund processed. Return Invoice {0}.").format(
				frappe.bold(return_invoice.name)
			),
			indicator="green",
			alert=True,
		)
		event = "order.refunded" if status == "Refunded" else "order.partially_refunded"
		if self.order_source != "IMOGI API":
			self._emit_webhook(event)
		return return_invoice.name

	def _emit_webhook(self, event):
		if frappe.flags.get("syncing_from_pos_invoice"):
			return
		from imogi_pos.imogi_pos.utils.webhook import emit_order_webhook

		emit_order_webhook(self.name, event)
