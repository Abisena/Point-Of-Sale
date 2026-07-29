# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields


def execute():
	create_custom_fields(
		{
			"IMOGI POS Gateway Payment": [
				{
					"fieldname": "whatsapp_receipt_sent",
					"fieldtype": "Check",
					"label": "WhatsApp Receipt Sent",
					"default": "0",
					"hidden": 1,
					"read_only": 1,
					"insert_after": "paid_at",
				}
			],
			"Riwayat Order": [
				{
					"fieldname": "whatsapp_receipt_sent",
					"fieldtype": "Check",
					"label": "WhatsApp Receipt Sent",
					"default": "0",
					"hidden": 1,
					"read_only": 1,
					"insert_after": "customer_email",
				}
			],
		},
		ignore_validate=True,
		update=True,
	)
	frappe.clear_cache(doctype="IMOGI POS Gateway Payment")
	frappe.clear_cache(doctype="Riwayat Order")
