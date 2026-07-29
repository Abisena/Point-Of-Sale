# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.utils import cint

from imogi_pos.imogi_pos.utils.feature_gating import get_settings_field_locks
from imogi_pos.imogi_pos.utils.feature_registry import (
	SUBSCRIPTION_TIERS,
	get_subscription_tier,
	normalize_tier,
	serialize_feature_matrix,
	serialize_tier_catalog,
	summarize_tiers,
)
from imogi_pos.imogi_pos.utils.subscription_billing import (
	is_billing_sync_enabled,
	log_tier_upgrade_payment,
	serialize_billing_status,
	serialize_tier_upgrade_quote,
)


def _require_matrix_access():
	"""Matrix is read-only for Owner (upgrade path); admin roles retain full access."""
	if frappe.session.user == "Administrator":
		return
	roles = set(frappe.get_roles())
	if roles & {"System Manager", "Sales Manager", "IMOGI Owner"}:
		return
	frappe.throw(_("Not permitted"), frappe.PermissionError)


@frappe.whitelist()
def get_feature_matrix(tier=None):
	"""Return full feature matrix for admin UI / debugging."""
	_require_matrix_access()
	preview_tier = (tier or "").strip() or None
	return serialize_feature_matrix(preview_tier or get_subscription_tier())


@frappe.whitelist()
def get_tier_summary():
	"""Return tier counts (Free=7, Starter=15, Pro=79, Enterprise=99)."""
	_require_matrix_access()
	return {
		"tiers": list(SUBSCRIPTION_TIERS),
		"summary": summarize_tiers(),
		"current_tier": get_subscription_tier(),
	}


@frappe.whitelist()
def get_role_summary():
	"""Return current user matrix roles for admin / debugging."""
	_require_matrix_access()
	from imogi_pos.imogi_pos.utils.role_gating import (
		FRAPPE_ROLE_TO_MATRIX,
		ROLE_PRIVILEGES,
		serialize_user_role_context,
	)

	return {
		"context": serialize_user_role_context(),
		"frappe_role_map": FRAPPE_ROLE_TO_MATRIX,
		"role_privileges": {k: sorted(v) for k, v in ROLE_PRIVILEGES.items()},
	}


@frappe.whitelist()
def get_settings_tier_locks(tier=None):
	"""Return per-field tier locks for IMOGI POS Settings toggles."""
	frappe.has_permission("IMOGI POS Settings", "read", throw=True)
	preview_tier = normalize_tier(tier) if (tier or "").strip() else None
	return get_settings_field_locks(preview_tier)


@frappe.whitelist()
def get_role_authorization_matrix():
	"""Return per-role authorization catalog + current toggle state."""
	_require_matrix_access()
	from imogi_pos.imogi_pos.utils.role_authorization import serialize_role_authorization_matrix

	return serialize_role_authorization_matrix()


@frappe.whitelist()
def get_page_authorization_matrix():
	"""Return per-role page (menu) access catalog + current toggle state."""
	_require_matrix_access()
	from imogi_pos.imogi_pos.utils.page_authorization import serialize_page_authorization_matrix

	return serialize_page_authorization_matrix()


@frappe.whitelist()
def get_workspace_tier_context():
	"""Fresh subscription tier + workspace link access (avoids stale frappe.boot)."""
	if frappe.session.user == "Guest":
		frappe.throw(_("Login required"), frappe.AuthenticationError)
	from imogi_pos.imogi_pos.utils.workspace_tier_gating import serialize_workspace_link_access

	from imogi_pos.imogi_pos.utils.deployment_mode import is_subscription_tier_disabled

	tier = None if is_subscription_tier_disabled() else get_subscription_tier()
	return {
		"tier": tier,
		"tier_disabled": is_subscription_tier_disabled(),
		"tier_access": serialize_workspace_link_access(tier, user=frappe.session.user),
	}


@frappe.whitelist()
def get_workspace_hub():
	"""Branded hub payload for Imogi POS workspace (filtered by tier + role)."""
	if frappe.session.user == "Guest":
		frappe.throw(_("Login required"), frappe.AuthenticationError)

	from imogi_pos.imogi_pos.utils.deployment_mode import is_subscription_tier_disabled
	from imogi_pos.imogi_pos.utils.workspace_catalog import WORKSPACE_SECTIONS, WORKSPACE_SHORTCUTS
	from imogi_pos.imogi_pos.utils.workspace_tier_gating import is_workspace_item_allowed_for_user

	tier = None if is_subscription_tier_disabled() else get_subscription_tier()
	user = frappe.session.user

	def allowed(item):
		return is_workspace_item_allowed_for_user(
			item.get("type") or item.get("link_type"),
			item.get("link_to"),
			tier,
			user,
			label=item.get("label"),
			feature_id=item.get("feature_id"),
		)

	shortcuts = []
	for row in WORKSPACE_SHORTCUTS:
		if not allowed(row):
			continue
		shortcuts.append(
			{
				"label": row["label"],
				"link_type": row.get("type") or "Page",
				"link_to": row["link_to"],
				"color": row.get("color") or "Orange",
				"feature_id": row.get("feature_id"),
				"dashboard_focus": row.get("dashboard_focus"),
			}
		)

	sections = []
	for section in WORKSPACE_SECTIONS:
		links = []
		for link in section.get("links") or []:
			if not allowed(link):
				continue
			links.append(
				{
					"label": link["label"],
					"link_type": link["link_type"],
					"link_to": link["link_to"],
					"is_query_report": cint(link.get("is_query_report")),
					"feature_id": link.get("feature_id"),
					"dashboard_focus": link.get("dashboard_focus"),
				}
			)
		if links:
			sections.append({"label": section["label"], "links": links})

	full_name = frappe.db.get_value("User", user, "full_name") or user
	return {
		"tier": tier,
		"tier_disabled": is_subscription_tier_disabled(),
		"user_name": full_name,
		"shortcuts": shortcuts,
		"sections": sections,
	}


@frappe.whitelist()
def get_tier_catalog(tier=None):
	"""Tier comparison cards for upgrade modal / setup wizard."""
	frappe.has_permission("IMOGI POS Settings", "read", throw=True)
	preview = normalize_tier(tier) if (tier or "").strip() else None
	current = preview or get_subscription_tier()
	catalog = serialize_tier_catalog(current)
	billing = serialize_billing_status()
	catalog["billing_locked"] = bool(
		billing.get("enabled") and billing.get("auto_apply_tier")
	)
	catalog["billing_status"] = billing
	catalog["can_change_tier"] = frappe.has_permission("IMOGI POS Settings", "write") and not catalog[
		"billing_locked"
	]
	catalog["matrix_route"] = "imogi-pos-feature-matrix"
	catalog["pricing"] = {
		tier_name: serialize_tier_upgrade_quote(tier_name, frappe.get_single("IMOGI POS Settings"))[
			"monthly_price"
		]
		for tier_name in SUBSCRIPTION_TIERS
	}
	return catalog


@frappe.whitelist()
def get_tier_upgrade_quote(tier):
	"""Quote for upgrading/downgrading subscription tier."""
	frappe.has_permission("IMOGI POS Settings", "read", throw=True)
	return serialize_tier_upgrade_quote(tier)


@frappe.whitelist()
def set_subscription_tier(tier, payment_method=None, payment_reference=None):
	"""Manually change subscription tier (when billing auto-apply is off)."""
	from imogi_pos.imogi_pos.utils.deployment_mode import is_erp_enterprise_deployment

	if is_erp_enterprise_deployment():
		frappe.throw(
			_("Instalasi ERPNext IMOGI POS menggunakan paket Enterprise tetap."),
			title=_("Paket Tidak Dapat Diubah"),
		)

	frappe.has_permission("IMOGI POS Settings", "write", throw=True)
	from frappe.utils import cint

	from imogi_pos.imogi_pos.utils.feature_gating import enforce_settings_tier_limits

	tier = normalize_tier(tier)
	settings = frappe.get_single("IMOGI POS Settings")
	if is_billing_sync_enabled(settings) and cint(getattr(settings, "billing_auto_apply_tier", 1)):
		frappe.throw(
			_("Paket langganan dikelola otomatis oleh billing SaaS."),
			title=_("Tidak Dapat Diubah"),
		)

	quote = serialize_tier_upgrade_quote(tier, settings)
	if quote.get("requires_payment") and not (payment_method or "").strip():
		frappe.throw(
			_("Pilih metode pembayaran dan selesaikan pembayaran sebelum mengaktifkan paket."),
			title=_("Pembayaran Diperlukan"),
		)

	before = get_subscription_tier(settings)
	if quote.get("requires_payment"):
		log_tier_upgrade_payment(
			tier,
			payment_method=payment_method,
			payment_reference=payment_reference,
			before_tier=before,
			settings=settings,
		)

	settings.subscription_tier = tier
	settings.flags.ignore_permissions = True
	settings.save(ignore_permissions=True)
	enforce_settings_tier_limits(settings)
	frappe.db.commit()

	frappe.publish_realtime("imogi_pos_settings_updated", {"subscription_tier": tier})

	workspace_ctx = get_workspace_tier_context()

	return {
		"before": before,
		"after": tier,
		"tier": tier,
		"payment_method": payment_method,
		"payment_reference": payment_reference,
		**workspace_ctx,
	}
