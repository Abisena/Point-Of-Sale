# Copyright (c) 2026, Imogi and contributors
"""Backfill Kasir on existing Riwayat Order rows from document owner."""

import frappe


def execute():
	if not frappe.db.has_column("Riwayat Order", "cashier"):
		return

	frappe.db.sql(
		"""
		update `tabRiwayat Order`
		set cashier = owner
		where ifnull(cashier, '') = '' and ifnull(owner, '') != ''
		"""
	)

	if frappe.db.has_column("Riwayat Order", "cashier_name"):
		frappe.db.sql(
			"""
			update `tabRiwayat Order` ro
			inner join `tabUser` u on u.name = ro.cashier
			set ro.cashier_name = u.full_name
			where ifnull(ro.cashier_name, '') = '' and ifnull(ro.cashier, '') != ''
			"""
		)

	frappe.clear_cache(doctype="Riwayat Order")
