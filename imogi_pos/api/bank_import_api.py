# Copyright (c) 2026, Imogi and contributors
"""Dedicated API module for importing raw BCA bank statement files into Bank Transaction."""

import frappe
from frappe import _

from imogi_pos.imogi_pos.utils.bank_import_helpers import (
	parse_bca_statement,
	require_bank_import_access,
	row_transaction_id,
)


def _resolve_currency(bank_account):
	company = frappe.db.get_value("Bank Account", bank_account, "company")
	return (company and frappe.db.get_value("Company", company, "default_currency")) or "IDR"


def _create_import_log(bank_account, file_url, rows):
	dates = [row["date"] for row in rows if row.get("date")]
	log = frappe.new_doc("IMOGI Bank Statement Import")
	log.bank_account = bank_account
	log.import_file = file_url
	log.transaction_date_from = min(dates) if dates else None
	log.transaction_date_to = max(dates) if dates else None
	log.insert()
	return log


def _finalize_import_log(log, stats):
	log.created_count = stats["created"]
	log.skipped_count = stats["skipped_duplicate"]
	log.error_count = len(stats["errors"])
	if stats["errors"]:
		log.status = "Partial" if stats["created"] else "Failed"
		log.errors_json = frappe.as_json(stats["errors"])
	else:
		log.status = "Success"
	log.save()


@frappe.whitelist()
def import_bca_statement(file_url=None, bank_account=None):
	require_bank_import_access()
	if not file_url:
		frappe.throw(_("Upload file mutasi bank (.csv/.xlsx)"))
	if not bank_account:
		frappe.throw(_("Pilih Bank Account tujuan"))
	if not frappe.db.exists("Bank Account", bank_account):
		frappe.throw(_("Bank Account {0} tidak ditemukan").format(bank_account))

	currency = _resolve_currency(bank_account)
	rows, errors = parse_bca_statement(file_url)
	log = _create_import_log(bank_account, file_url, rows)

	stats = {"created": 0, "skipped_duplicate": 0, "errors": list(errors[:20])}
	for row in rows:
		txn_id = row_transaction_id(bank_account, row)
		if frappe.db.exists("Bank Transaction", {"transaction_id": txn_id}):
			stats["skipped_duplicate"] += 1
			continue
		try:
			doc = frappe.new_doc("Bank Transaction")
			doc.date = row["date"]
			doc.bank_account = bank_account
			doc.deposit = row["deposit"]
			doc.withdrawal = row["withdrawal"]
			doc.currency = currency
			doc.description = f"{row['description']} {row['branch']}".strip()
			doc.transaction_id = txn_id
			doc.imogi_bank_statement_import = log.name
			doc.insert()
			doc.submit()
			stats["created"] += 1
		except Exception:
			frappe.log_error(title="BCA Bank Import", message=frappe.get_traceback())
			stats["errors"].append({"row": row["row"], "error": _("Gagal membuat Bank Transaction")})

	stats["errors"] = stats["errors"][:20]
	_finalize_import_log(log, stats)
	stats["import_log"] = log.name
	frappe.db.commit()
	return stats
