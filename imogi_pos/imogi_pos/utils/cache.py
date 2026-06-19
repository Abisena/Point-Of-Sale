# Copyright (c) 2026, Imogi and contributors

import frappe

IMOGI_FORM_DOCTYPES = (
	"IMOGI POS Settings",
	"IMOGI POS Promo Rule",
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
	migrate_legacy_promo_rule_rewards()
	clear_imogi_form_meta_cache()
	ensure_receipt_print_format()
	ensure_default_branch()


def migrate_legacy_promo_rule_rewards():
	"""Copy single reward_item_code into reward_items child rows."""
	rules = frappe.get_all(
		"IMOGI POS Promo Rule",
		filters={"rule_type": "Buy X Get Other Free", "reward_item_code": ["!=", ""]},
		fields=["name", "reward_item_code"],
	)
	for row in rules:
		if frappe.db.count("IMOGI POS Promo Rule Reward", {"parent": row.name}):
			continue
		doc = frappe.get_doc("IMOGI POS Promo Rule", row.name)
		doc.append("reward_items", {"item_code": row.reward_item_code, "qty": 1})
		doc.save(ignore_permissions=True)
