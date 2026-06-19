# Copyright (c) 2026, Imogi and contributors

from __future__ import annotations

import frappe
from frappe.utils import cint

from imogi_pos.imogi_pos.utils.flow import get_settings


def is_transfer_payment_mode(mode_of_payment: str | None) -> bool:
	if not mode_of_payment:
		return False
	name = (mode_of_payment or "").strip().lower()
	if any(token in name for token in ("qris", "wallet", "ewallet", "gopay", "ovo", "dana")):
		return False
	if any(token in name for token in ("cash", "tunai")):
		return False
	if any(token in name for token in ("transfer", "bank", "va", "virtual")):
		return True
	mode_type = frappe.db.get_value("Mode of Payment", mode_of_payment, "type") or ""
	return str(mode_type).strip() == "Bank"


def get_transfer_payment_config(settings=None) -> dict:
	settings = settings or get_settings()
	enabled = cint(settings.get("enable_transfer_payment_info"))
	bank_name = (settings.get("transfer_bank_name") or "").strip()
	bank_account = (settings.get("transfer_bank_account") or "").strip()
	account_holder = (settings.get("transfer_account_holder") or "").strip()
	instructions = (settings.get("transfer_instructions") or "").strip()
	configured = bool(bank_name and bank_account and account_holder)
	return {
		"enabled": bool(enabled and configured),
		"bank_name": bank_name,
		"bank_account": bank_account,
		"account_holder": account_holder,
		"instructions": instructions,
	}
