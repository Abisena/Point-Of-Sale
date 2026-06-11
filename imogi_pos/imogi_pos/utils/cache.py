# Copyright (c) 2026, Imogi and contributors

import frappe

IMOGI_FORM_DOCTYPES = (
	"IMOGI POS Settings",
	"Riwayat Order",
)


def clear_imogi_form_meta_cache():
	"""Drop cached desk form assets so doctype_js hooks are reloaded."""
	for doctype in IMOGI_FORM_DOCTYPES:
		frappe.clear_document_cache(doctype)
		frappe.cache.hdel("doctype_form_meta", doctype)

	frappe.clear_cache(doctype="IMOGI POS Settings")


def after_migrate():
	from imogi_pos.imogi_pos.utils.workspace import sync_workspaces
	from imogi_pos.imogi_pos.utils.branch import ensure_default_branch
	from imogi_pos.install import ensure_imogi_role_permissions, ensure_receipt_print_format

	sync_workspaces()
	ensure_imogi_role_permissions()
	clear_imogi_form_meta_cache()
	ensure_receipt_print_format()
	ensure_default_branch()
