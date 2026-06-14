# Copyright (c) 2026, Imogi and contributors
"""Adjust ERPNext POS consolidation for IMOGI POS (BOM / restaurant flows)."""

import frappe
from frappe import _

from imogi_pos.imogi_pos.utils.bom_stock import get_default_bom
from imogi_pos.imogi_pos.utils.business_profile import BUSINESS_RESTAURANT
from imogi_pos.imogi_pos.utils.flow import get_settings

E_WALLET_PAYMENT_MODES = ("QRIS", "E-Wallet", "GoPay", "OVO", "Card", "Debit Card", "Credit Card")


def should_skip_consolidated_stock(doc):
	"""Skip FG stock on consolidated Sales Invoice when BOM already consumed ingredients."""
	settings = get_settings()
	if settings.business_type == BUSINESS_RESTAURANT:
		return True

	items = [row for row in (doc.items or []) if row.item_code]
	if not items:
		return False

	for row in items:
		if get_default_bom(row.item_code):
			continue
		if frappe.db.get_value("Item", row.item_code, "is_stock_item"):
			return False

	return True


def _default_settlement_account(company):
	account = frappe.db.get_value(
		"Account",
		{
			"company": company,
			"account_type": "Bank",
			"disabled": 0,
			"is_group": 0,
		},
		"name",
		order_by="name asc",
	)
	if account:
		return account

	return frappe.db.get_value(
		"Account",
		{
			"company": company,
			"account_type": "Cash",
			"disabled": 0,
			"is_group": 0,
		},
		"name",
		order_by="name asc",
	)


def repair_mode_of_payment_accounts(company=None):
	"""Payment modes must settle to Bank/Cash — not Receivable (Debtors)."""
	if not company:
		return []

	settlement_account = _default_settlement_account(company)
	if not settlement_account:
		return []

	fixed = []
	for mop in E_WALLET_PAYMENT_MODES:
		if not frappe.db.exists("Mode of Payment", mop):
			continue

		row = frappe.db.get_value(
			"Mode of Payment Account",
			{"parent": mop, "company": company},
			["name", "default_account"],
			as_dict=True,
		)
		if not row or not row.default_account:
			continue

		account_type = frappe.get_cached_value("Account", row.default_account, "account_type")
		if account_type != "Receivable":
			continue

		frappe.db.set_value(
			"Mode of Payment Account",
			row.name,
			"default_account",
			settlement_account,
			update_modified=False,
		)
		fixed.append(mop)

	return fixed


def validate_consolidated_payment_accounts(doc):
	for pay in doc.get("payments") or []:
		if not pay.account:
			continue

		account_type = frappe.get_cached_value("Account", pay.account, "account_type")
		if account_type != "Receivable":
			continue

		frappe.throw(
			_(
				"Metode pembayaran {0} memakai akun Piutang ({1}). "
				"Ubah akun default Mode of Payment ke akun Bank/Kas, lalu tutup shift lagi."
			).format(frappe.bold(pay.mode_of_payment), frappe.bold(pay.account)),
			title=_("Gagal Tutup Shift"),
		)


def before_consolidated_sales_invoice_submit(doc, method=None):
	"""POS Invoice does not update stock; consolidation must not re-deduct FG for BOM menu items."""
	if not doc.get("is_consolidated"):
		return

	if should_skip_consolidated_stock(doc):
		doc.update_stock = 0

	validate_consolidated_payment_accounts(doc)
