# Copyright (c) 2026, Imogi and contributors
"""Resolve subscription tier + settings toggles for runtime feature gating."""

import frappe
from frappe import _
from frappe.utils import cint

from imogi_pos.imogi_pos.utils.feature_registry import (
	FEATURE_STATUS_PLANNED,
	SUBSCRIPTION_TIERS,
	get_feature,
	get_subscription_tier,
	is_feature_in_plan,
	is_feature_operational,
	is_tier_at_least,
	normalize_tier,
	require_feature,
	tier_rank,
)
from imogi_pos.imogi_pos.utils.flow import get_settings

# Settings checkbox → feature_registry id
SETTINGS_FEATURE_MAP = {
	"enable_loyalty": "point_reward",
	"enable_stamp_card": "point_reward",
	# "voucher" is intentionally NOT mapped here to enable_promo_rules — that
	# toggle is for the unrelated automatic Buy X Get Y rules (Wave 3), and
	# mapping it to voucher meant turning Promo Rules off silently broke
	# manual voucher codes too. Leaving voucher unmapped falls back to its own
	# feature_registry settings_key ("enable_loyalty"), which matches what the
	# Voucher feature's UI label actually says it depends on.
	"enable_payment_gateway": "qris",
	"enable_marketplace_orders": "grabfood_integration",
	"enable_kitchen_printer": "kitchen_printer",
	"enable_cashback": "cashback",
	"enable_birthday_promo": "birthday_promo",
	"enable_pos_shift": "open_shift",
	"enable_table_service": "table_management",
	"enable_qr_self_service": "qr_self_service",
	"enable_kitchen_display": "kitchen_display",
	"enable_order_api": "api_access",
	"multi_branch": "multi_outlet",
	"enable_central_kitchen": "central_kitchen",
}

SETTINGS_BUTTON_FIELDS = {
	"generate_order_api_key": "api_access",
	"sync_branch_prices": "multi_outlet",
	"hq_ensure_branch_price_lists": "multi_outlet",
	"hq_push_menu_from_branch": "central_menu_management",
}

SETTINGS_KEYS_BY_FEATURE: dict[str, tuple[str, ...]] = {}
for _settings_key, _feature_id in SETTINGS_FEATURE_MAP.items():
	SETTINGS_KEYS_BY_FEATURE.setdefault(_feature_id, [])
	if _settings_key not in SETTINGS_KEYS_BY_FEATURE[_feature_id]:
		SETTINGS_KEYS_BY_FEATURE[_feature_id].append(_settings_key)

ORDER_TYPE_FEATURES = {
	"Dine-in": "dine_in",
	"Takeaway": "take_away",
	"Delivery": "delivery_order",
}

CASHIER_FEATURE_IDS = (
	"pos_order",
	"order_history",
	"hold_order",
	"customer",
	"dine_in",
	"take_away",
	"delivery_order",
	"qris",
	"point_reward",
	"voucher",
	"open_shift",
	"close_shift",
	"cash_in_out",
	"grabfood_integration",
	"multi_outlet",
	"multi_payment",
	"split_bill",
	"table_management",
	"move_table",
	"void_order",
)


def is_setting_enabled(settings_key: str, settings=None) -> bool:
	"""Settings toggle is on AND allowed by subscription tier."""
	settings = settings or get_settings()
	if not cint(getattr(settings, settings_key, 0)):
		return False
	feature_id = SETTINGS_FEATURE_MAP.get(settings_key)
	if not feature_id:
		return True
	return is_feature_operational(feature_id, settings)


def is_fulfillment_operational(settings=None) -> bool:
	"""Fulfillment toggle + rollout flag (hidden until QC-in-kitchen is validated)."""
	from imogi_pos.imogi_pos.utils.feature_registry import is_fulfillment_rollout_enabled

	if not is_fulfillment_rollout_enabled():
		return False
	settings = settings or get_settings()
	return bool(cint(getattr(settings, "enable_fulfillment", 0)))


def require_feature_operational(feature_id: str, settings=None, user=None):
	from imogi_pos.imogi_pos.utils.feature_registry import (
		get_feature,
		is_feature_temporarily_disabled,
	)

	if is_feature_temporarily_disabled(feature_id):
		feature = get_feature(feature_id) or {}
		frappe.throw(
			_("Fitur <b>{0}</b> sementara dinonaktifkan di sistem POS saat ini.").format(
				feature.get("label") or feature_id
			),
			title=_("Fitur Nonaktif"),
		)
	user = user or getattr(frappe.session, "user", None)
	if is_feature_operational(feature_id, settings, user=user):
		return
	if not is_feature_in_plan(feature_id):
		require_feature(feature_id)
	from imogi_pos.imogi_pos.utils.role_gating import (
		get_role_block_reason,
		is_role_gating_enabled,
		require_feature_role,
	)

	if is_role_gating_enabled(settings) and get_role_block_reason(feature_id, user=user, settings=settings):
		require_feature_role(feature_id, user=user, settings=settings)
	feature = get_feature(feature_id) or {}
	frappe.throw(
		_("Fitur <b>{0}</b> belum diaktifkan. Buka IMOGI POS Settings.").format(
			feature.get("label") or feature_id
		),
		title=_("Fitur Nonaktif"),
	)


def get_cashier_feature_flags(settings=None, user=None) -> dict:
	settings = settings or get_settings()
	user = user or getattr(frappe.session, "user", None)
	return {
		feature_id: is_feature_operational(feature_id, settings, user=user)
		for feature_id in CASHIER_FEATURE_IDS
	}


def _settings_enabled_for_feature(settings, feature_id: str) -> bool:
	settings_keys = SETTINGS_KEYS_BY_FEATURE.get(feature_id)
	if not settings_keys:
		feature = get_feature(feature_id) or {}
		settings_key = feature.get("settings_key")
		settings_keys = [settings_key] if settings_key else []
	if not settings_keys:
		return True
	return any(cint(getattr(settings, settings_key, 0)) for settings_key in settings_keys)


def get_feature_block_reason(
	feature_id: str, settings=None, tier: str | None = None, user: str | None = None
) -> str | None:
	"""Return None when feature is usable; else ``business``, ``tier``, ``role``, ``settings``, or ``planned``."""
	from imogi_pos.imogi_pos.utils.business_profile import is_feature_suppressed_for_business
	from imogi_pos.imogi_pos.utils.deployment_mode import is_subscription_tier_disabled

	settings = settings or get_settings()
	from imogi_pos.imogi_pos.utils.feature_registry import is_feature_temporarily_disabled

	if is_feature_temporarily_disabled(feature_id):
		return "disabled"
	if is_feature_suppressed_for_business(feature_id, settings):
		return "business"

	feature = get_feature(feature_id)
	if not feature:
		return "tier"
	if feature["status"] == FEATURE_STATUS_PLANNED:
		return "planned"
	if not is_subscription_tier_disabled():
		tier = tier or get_subscription_tier(settings)
		if not is_tier_at_least(tier, feature["min_tier"]):
			return "tier"
	from imogi_pos.imogi_pos.utils.role_gating import get_role_block_reason as _role_reason

	if _role_reason(feature_id, user=user, settings=settings):
		return "role"
	if not _settings_enabled_for_feature(settings, feature_id):
		return "settings"
	return None


def serialize_cashier_feature_meta(settings=None, user=None) -> dict:
	"""Rich feature metadata for cashier upgrade prompts."""
	settings = settings or get_settings()
	user = user or getattr(frappe.session, "user", None)
	tier = get_subscription_tier(settings)
	meta = {}
	for feature_id in CASHIER_FEATURE_IDS:
		feature = get_feature(feature_id) or {}
		meta[feature_id] = {
			"allowed": is_feature_operational(feature_id, settings, tier, user=user),
			"in_plan": is_feature_in_plan(feature_id, tier),
			"label": feature.get("label") or feature_id,
			"min_tier": feature.get("min_tier") or "Enterprise",
			"required_role": feature.get("role") or "",
			"trigger_upgrade": feature.get("trigger_upgrade") or "",
			"status": feature.get("status"),
			"blocked_reason": get_feature_block_reason(feature_id, settings, tier, user=user),
		}
	return meta


def validate_order_type(order_type: str | None, settings=None):
	"""Gate order types only when the tier includes that order-type feature.

	Free tier has ``pos_order`` but not dine-in / takeaway / delivery features.
	Checkout still records a default order type without blocking payment.
	"""
	feature_id = ORDER_TYPE_FEATURES.get((order_type or "").strip())
	if not feature_id:
		return
	settings = settings or get_settings()
	if not is_feature_in_plan(feature_id, get_subscription_tier(settings)):
		return
	require_feature_operational(feature_id, settings)


def validate_checkout_features(
	*,
	order_type=None,
	voucher_code=None,
	loyalty_points_redeem=0,
	marketplace_order_name=None,
	customer=None,
	default_customer=None,
	settings=None,
):
	settings = settings or get_settings()
	validate_order_type(order_type, settings)

	if marketplace_order_name:
		require_feature_operational("grabfood_integration", settings)

	if voucher_code:
		require_feature_operational("voucher", settings)

	if cint(loyalty_points_redeem) > 0:
		require_feature_operational("point_reward", settings)

	if customer and default_customer and customer != default_customer:
		require_feature_operational("customer", settings)


def _lock_message_for_feature(feature_id: str) -> str:
	feature = get_feature(feature_id) or {}
	trigger = (feature.get("trigger_upgrade") or "").strip()
	min_tier = feature.get("min_tier") or "Enterprise"
	message = _("Tersedia mulai paket {0}").format(min_tier)
	if trigger:
		message = f"{message}. {trigger}"
	return message


def _serialize_field_lock(fieldname: str, feature_id: str, tier: str) -> dict:
	feature = get_feature(feature_id) or {}
	allowed = is_feature_in_plan(feature_id, tier)
	return {
		"fieldname": fieldname,
		"allowed": allowed,
		"feature_id": feature_id,
		"label": feature.get("label") or feature_id,
		"min_tier": feature.get("min_tier") or "Enterprise",
		"message": None if allowed else _lock_message_for_feature(feature_id),
	}


def get_settings_field_locks(tier: str | None = None) -> dict:
	"""Per-field tier lock metadata for IMOGI POS Settings form."""
	from imogi_pos.imogi_pos.utils.deployment_mode import is_subscription_tier_disabled

	if is_subscription_tier_disabled():
		locks = {
			fieldname: {
				"fieldname": fieldname,
				"allowed": True,
				"feature_id": feature_id,
				"label": (get_feature(feature_id) or {}).get("label") or feature_id,
				"min_tier": None,
				"message": None,
			}
			for fieldname, feature_id in {**SETTINGS_FEATURE_MAP, **SETTINGS_BUTTON_FIELDS}.items()
		}
		return {
			"tier": None,
			"tiers": [],
			"tier_disabled": True,
			"locks": locks,
			"matrix_route": "imogi-pos-feature-matrix",
		}

	tier = normalize_tier(tier or get_subscription_tier())
	locks = {}
	for fieldname, feature_id in SETTINGS_FEATURE_MAP.items():
		locks[fieldname] = _serialize_field_lock(fieldname, feature_id, tier)
	for fieldname, feature_id in SETTINGS_BUTTON_FIELDS.items():
		locks[fieldname] = _serialize_field_lock(fieldname, feature_id, tier)
	return {
		"tier": tier,
		"tiers": list(SUBSCRIPTION_TIERS),
		"locks": locks,
		"matrix_route": "imogi-pos-feature-matrix",
	}


def require_feature_doctype_access(feature_id: str, ptype: str | None = None, settings=None, user=None):
	"""Tier/role gate plus Frappe DocType permission for integration APIs."""
	from imogi_pos.imogi_pos.utils.role_permissions import FEATURE_DOCTYPE_ACCESS

	require_feature_operational(feature_id, settings, user=user)
	mapping = FEATURE_DOCTYPE_ACCESS.get(feature_id)
	if not mapping:
		return
	doctype, default_ptype = mapping
	frappe.has_permission(doctype, ptype or default_ptype, throw=True)


# Purchasing doctype → feature_id, for the doc-level gate below. Keeps
# feature/role gating in effect even when a document is created or submitted
# straight from the native ERPNext desk form instead of the Purchasing Hub
# API (whose whitelisted endpoints already call require_feature_operational
# themselves — this closes the same gap for the /app path).
PURCHASING_DOCTYPE_FEATURE_MAP: dict[str, str] = {
	"Supplier": "supplier",
	"Material Request": "purchase_request",
	"Purchase Order": "purchase_order",
	"Purchase Receipt": "goods_receiving",
	"Purchase Invoice": "supplier_payable",
}


def require_purchasing_feature(doc, method=None):
	feature_id = PURCHASING_DOCTYPE_FEATURE_MAP.get(doc.doctype)
	if not feature_id:
		return
	require_feature_operational(feature_id)


# Same reasoning as PURCHASING_DOCTYPE_FEATURE_MAP above — shift/cash-drawer
# doctypes are only gated by the cashier API's own require_feature_operational
# calls, so a direct Desk/REST insert skips the tier/settings/role check.
SHIFT_DOCTYPE_FEATURE_MAP: dict[str, str] = {
	"IMOGI POS Shift Opening": "open_shift",
	"IMOGI POS Shift Closing": "close_shift",
	"IMOGI POS Cash Movement": "cash_in_out",
}


def require_shift_feature(doc, method=None):
	feature_id = SHIFT_DOCTYPE_FEATURE_MAP.get(doc.doctype)
	if not feature_id:
		return
	require_feature_operational(feature_id)


def enforce_settings_tier_limits(doc):
	"""Block enabling gated toggles; auto-disable them when subscription tier is downgraded."""
	from imogi_pos.imogi_pos.utils.deployment_mode import is_subscription_tier_disabled

	if is_subscription_tier_disabled():
		return

	tier = get_subscription_tier(doc)
	before = doc.get_doc_before_save()
	prev_tier = get_subscription_tier(before) if before else None
	tier_downgraded = bool(prev_tier and tier_rank(tier) < tier_rank(prev_tier))

	for fieldname, feature_id in SETTINGS_FEATURE_MAP.items():
		if not cint(getattr(doc, fieldname, 0)):
			continue
		if is_feature_in_plan(feature_id, tier):
			continue
		if tier_downgraded:
			setattr(doc, fieldname, 0)
			continue
		feature = get_feature(feature_id) or {}
		frappe.throw(
			_(
				"<b>{0}</b> memerlukan paket <b>{1}</b> atau lebih tinggi. {2}"
			).format(
				feature.get("label") or fieldname,
				feature.get("min_tier") or "Enterprise",
				feature.get("trigger_upgrade") or _("Lihat matriks fitur untuk detail."),
			),
			title=_("Paket Tidak Mencukupi"),
		)
