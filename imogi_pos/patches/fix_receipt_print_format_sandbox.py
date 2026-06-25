# Copyright (c) 2026, Imogi and contributors
"""Replace frappe.get_single in receipt print format (blocked in PDF sandbox)."""

from imogi_pos.install import ensure_receipt_print_format


def execute():
	ensure_receipt_print_format()
