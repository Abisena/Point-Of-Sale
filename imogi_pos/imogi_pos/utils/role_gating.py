# Copyright (c) 2026, Imogi and contributors
"""Map IMOGI matrix roles (Waiter, Supervisor, Chef, …) to Frappe user roles."""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import cint

from imogi_pos.imogi_pos.utils.feature_registry import get_feature, get_subscription_tier, is_tier_at_least
from imogi_pos.imogi_pos.utils.flow import get_settings

MATRIX_ROLES = (
	"Kasir",
	"Waiter",
	"Kitchen Staff",
	"Barista",
	"Chef",
	"Inventory",
	"Purchasing",
	"Supervisor",
	"Manager",
	"Finance",
	"Owner",
	"Area Manager",
	"Auditor",
	"Super Admin",
)

# Frappe Role → primary matrix persona
FRAPPE_ROLE_TO_MATRIX: dict[str, str] = {
	"Administrator": "Super Admin",
	"System Manager": "Super Admin",
	"Sales Manager": "Manager",
	"Sales User": "Manager",
	"Accounts Manager": "Finance",
	"Accounts User": "Finance",
	"Purchase Manager": "Purchasing",
	"Purchase User": "Purchasing",
	"Stock Manager": "Inventory",
	"Stock User": "Inventory",
	"IMOGI Owner": "Owner",
	"IMOGI Area Manager": "Area Manager",
	"IMOGI Manager": "Manager",
	"IMOGI Finance": "Finance",
	"IMOGI Inventory": "Inventory",
	"IMOGI Purchasing": "Purchasing",
	"IMOGI Cashier": "Kasir",
	"IMOGI Waiter": "Waiter",
	"IMOGI Supervisor": "Supervisor",
	"IMOGI Kitchen Staff": "Kitchen Staff",
	"IMOGI Chef": "Chef",
	"IMOGI Fulfillment Staff": "Waiter",
	"IMOGI Rider": "Kasir",
	"IMOGI Auditor": "Auditor",
}

# Matrix persona → feature roles it may use (inheritance / escalation)
ROLE_PRIVILEGES: dict[str, frozenset[str]] = {
	"Super Admin": frozenset(MATRIX_ROLES),
	"Owner": frozenset(
		{
			"Owner",
			"Manager",
			"Finance",
			"Area Manager",
			"Supervisor",
			"Kasir",
			"Waiter",
			"Kitchen Staff",
			"Barista",
			"Chef",
			"Inventory",
			"Purchasing",
			"Auditor",
		}
	),
	"Area Manager": frozenset(
		{
			"Area Manager",
			"Manager",
			"Supervisor",
			"Kasir",
			"Waiter",
			"Kitchen Staff",
			"Chef",
			"Inventory",
			"Purchasing",
			"Finance",
		}
	),
	"Manager": frozenset(
		{
			"Manager",
			"Supervisor",
			"Kasir",
			"Waiter",
			"Kitchen Staff",
			"Barista",
			"Chef",
			"Inventory",
			"Purchasing",
		}
	),
	"Finance": frozenset({"Finance", "Owner"}),
	"Supervisor": frozenset({"Supervisor", "Kasir", "Waiter"}),
	"Auditor": frozenset({"Auditor"}),
	"Chef": frozenset({"Chef", "Kitchen Staff"}),
	"Barista": frozenset({"Barista", "Kitchen Staff"}),
	"Kitchen Staff": frozenset({"Kitchen Staff"}),
	"Inventory": frozenset({"Inventory"}),
	"Purchasing": frozenset({"Purchasing"}),
	"Waiter": frozenset({"Waiter", "Kasir"}),
	"Kasir": frozenset({"Kasir"}),
}

BYPASS_ROLE_GATING_ROLES = frozenset({"Administrator", "System Manager"})

# Workspace: Supervisor-gated links also visible to back-office personas.
WORKSPACE_SUPERVISOR_ESCALATION_MATRIX_ROLES = frozenset(
	{"Supervisor", "Manager", "Owner", "Area Manager", "Super Admin", "Finance", "Auditor"}
)

# Free-tier pages: exact matrix role only (no Owner→Manager→Kasir inheritance).
FREE_TIER_STRICT_FEATURE_IDS = frozenset(
	{
		"dashboard_sales",
		"sales_report",
		"menu",
		"menu_category",
		"pos_order",
		"order_history",
	}
)


def is_role_gating_enabled(settings=None) -> bool:
	settings = settings or get_settings()
	return bool(cint(getattr(settings, "enable_role_gating", 0)))


def _resolve_user(user: str | None = None) -> str | None:
	if user:
		return user
	try:
		return frappe.session.user if frappe.session else None
	except Exception:
		return None


def user_bypasses_role_gating(user: str | None = None) -> bool:
	user = _resolve_user(user)
	if not user or user == "Guest":
		return False
	return bool(set(frappe.get_roles(user)) & BYPASS_ROLE_GATING_ROLES)


def get_user_matrix_roles(user: str | None = None) -> set[str]:
	"""Resolve matrix personas for the current user."""
	user = _resolve_user(user)
	if not user or user == "Guest":
		return set()

	matrix_roles: set[str] = set()
	for frappe_role in frappe.get_roles(user):
		mapped = FRAPPE_ROLE_TO_MATRIX.get(frappe_role)
		if mapped:
			matrix_roles.add(mapped)
	return matrix_roles


def get_effective_feature_roles(user: str | None = None) -> set[str]:
	"""All matrix feature-role labels the user may access."""
	user = _resolve_user(user)
	if user_bypasses_role_gating(user):
		return set(MATRIX_ROLES)

	allowed: set[str] = set()
	for matrix_role in get_user_matrix_roles(user):
		allowed.update(ROLE_PRIVILEGES.get(matrix_role, {matrix_role}))
	return allowed


def is_role_allowed_for_feature(feature_id: str, user: str | None = None, settings=None) -> bool:
	if user_bypasses_role_gating(user):
		return True

	feature = get_feature(feature_id)
	if not feature:
		return False

	required = (feature.get("role") or "").strip()
	if not required:
		return True

	# Free tier (web SKU only): strict role separation without inheritance.
	if feature_id in FREE_TIER_STRICT_FEATURE_IDS:
		from imogi_pos.imogi_pos.utils.deployment_mode import is_subscription_tier_disabled

		if not is_subscription_tier_disabled():
			tier = get_subscription_tier(settings)
			if not is_tier_at_least(tier, "Starter"):
				return required in get_user_matrix_roles(user)

	if not is_role_gating_enabled(settings):
		return True

	if _cashier_checkout_feature_enabled(feature_id, user, settings):
		return True

	return required in get_effective_feature_roles(user)


def _cashier_checkout_feature_enabled(feature_id: str, user: str | None, settings=None) -> bool:
	"""Kasir may use checkout features when Owner enabled them in IMOGI POS Settings."""
	from imogi_pos.boot import CASHIER_ROLE
	from imogi_pos.imogi_pos.utils.feature_gating import _settings_enabled_for_feature
	from imogi_pos.imogi_pos.utils.flow import get_settings

	CHECKOUT_FEATURES = frozenset({"point_reward", "voucher", "qris"})
	if feature_id not in CHECKOUT_FEATURES:
		return False

	user = _resolve_user(user)
	if not user or user == "Guest" or CASHIER_ROLE not in frappe.get_roles(user):
		return False

	settings = settings or get_settings()
	return _settings_enabled_for_feature(settings, feature_id)


def is_workspace_role_allowed_for_feature(
	feature_id: str, user: str | None = None, settings=None
) -> bool:
	"""Workspace links: exact matrix role only (no inheritance; always enforced)."""
	if user_bypasses_role_gating(user):
		return True

	feature = get_feature(feature_id)
	if not feature:
		return False

	required = (feature.get("role") or "").strip()
	if not required:
		return True

	user_roles = get_user_matrix_roles(user)
	if required in user_roles:
		return True
	if required == "Supervisor" and user_roles & WORKSPACE_SUPERVISOR_ESCALATION_MATRIX_ROLES:
		return True
	return False


def get_role_block_reason(feature_id: str, user: str | None = None, settings=None) -> str | None:
	if is_role_allowed_for_feature(feature_id, user=user, settings=settings):
		return None
	feature = get_feature(feature_id) or {}
	return feature.get("role") or "role"


def require_feature_role(feature_id: str, user: str | None = None, settings=None):
	if is_role_allowed_for_feature(feature_id, user=user, settings=settings):
		return
	feature = get_feature(feature_id) or {}
	frappe.throw(
		_(
			"Fitur <b>{0}</b> memerlukan role <b>{1}</b>. Role Anda: <b>{2}</b>."
		).format(
			feature.get("label") or feature_id,
			feature.get("role") or _("Staff"),
			", ".join(sorted(get_user_matrix_roles(user))) or _("Tidak terdefinisi"),
		),
		title=_("Role Tidak Mencukupi"),
		exc=frappe.PermissionError,
	)


def serialize_user_role_context(user: str | None = None, settings=None) -> dict:
	settings = settings or get_settings()
	user = _resolve_user(user)
	matrix_roles = sorted(get_user_matrix_roles(user))
	return {
		"enabled": is_role_gating_enabled(settings),
		"matrix_roles": matrix_roles,
		"effective_roles": sorted(get_effective_feature_roles(user)),
		"bypass": user_bypasses_role_gating(user),
		"frappe_roles": sorted(set(frappe.get_roles(user))) if user and user != "Guest" else [],
	}
