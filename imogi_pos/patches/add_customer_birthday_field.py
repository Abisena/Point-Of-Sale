# Copyright (c) 2026, Imogi and contributors
"""Add Customer.imogi_birthday for Birthday Promo."""

from frappe.custom.doctype.custom_field.custom_field import create_custom_fields


def execute():
	create_custom_fields(
		{
			"Customer": [
				{
					"fieldname": "imogi_birthday",
					"fieldtype": "Date",
					"insert_after": "customer_type",
					"label": "Tanggal Lahir (IMOGI POS)",
					"description": "Dipakai untuk Promo Ulang Tahun di kasir IMOGI POS",
				}
			]
		},
		update=True,
	)
