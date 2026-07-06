import frappe

no_cache = 1


def get_context(context):
	context.no_cache = 1
	context.show_sidebar = False
	context.body_class = "imogi-qr-table-order-body"
	context.title = "Pesan Meja — IMOGI POS"
