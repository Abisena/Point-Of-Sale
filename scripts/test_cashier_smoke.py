#!/usr/bin/env python3
"""Smoke test IMOGI cashier API (requires logged-in bench context or use via bench execute)."""

from __future__ import annotations

import json
import sys


def run():
	import frappe

	frappe.set_user("Administrator")
	frappe.connect()

	from imogi_pos.api.cashier import get_cashier_context, scan_barcode

	ctx = get_cashier_context()
	assert ctx.get("pos_profile"), "pos_profile missing"
	assert ctx.get("payment_modes"), "payment_modes missing"
	print("OK get_cashier_context:", ctx["pos_profile"], "modes:", len(ctx["payment_modes"]))

	# Try first sellable item barcode/code if any item exists
	item = frappe.db.get_value(
		"Item",
		{"disabled": 0, "is_sales_item": 1, "has_variants": 0},
		"name",
		order_by="modified desc",
	)
	if item:
		result = scan_barcode(item)
		assert result.get("item_code"), "scan_barcode failed"
		print("OK scan_barcode:", result["item_code"], result.get("item_name"))
	else:
		print("SKIP scan_barcode: no items")

	print("\nCashier smoke tests passed.")
	return 0


if __name__ == "__main__":
	# Run: bench --site project.pos execute imogi_pos.scripts.test_cashier_smoke.run
	# Or from bench directory with site:
	try:
		sys.exit(run())
	except Exception as e:
		print("FAIL:", e, file=sys.stderr)
		sys.exit(1)
