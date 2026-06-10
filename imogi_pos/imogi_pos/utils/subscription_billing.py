# Copyright (c) 2026, Imogi and contributors
"""SaaS billing webhook → auto-sync subscription tier."""

from __future__ import annotations

import hashlib
import hmac
import json

import frappe
from frappe import _
from frappe.utils import cint, get_datetime, getdate, now_datetime, today

from imogi_pos.imogi_pos.utils.feature_registry import SUBSCRIPTION_TIERS, normalize_tier
from imogi_pos.imogi_pos.utils.flow import get_settings

BILLING_STATUS_ACTIVE = frozenset({"Trial", "Active"})
BILLING_STATUS_GRACE = frozenset({"Past Due"})
BILLING_STATUS_INACTIVE = frozenset({"Cancelled", "Expired", "Suspended"})

PLAN_TIER_ALIASES: dict[str, str] = {
	"free": "Free",
	"starter": "Starter",
	"basic": "Starter",
	"professional": "Professional",
	"pro": "Professional",
	"business": "Professional",
	"enterprise": "Enterprise",
	"ent": "Enterprise",
	"unlimited": "Enterprise",
}


def is_billing_sync_enabled(settings=None) -> bool:
	settings = settings or get_settings()
	return bool(cint(getattr(settings, "enable_saas_billing_sync", 0)))


def map_plan_to_tier(plan_code: str | None = None, explicit_tier: str | None = None) -> str | None:
	if explicit_tier and normalize_tier(explicit_tier) in SUBSCRIPTION_TIERS:
		return normalize_tier(explicit_tier)
	key = (plan_code or "").strip().lower()
	if not key:
		return None
	if key in PLAN_TIER_ALIASES:
		return PLAN_TIER_ALIASES[key]
	for alias, tier in PLAN_TIER_ALIASES.items():
		if alias in key:
			return tier
	return None


def verify_billing_signature(payload, signature, settings=None) -> bool:
	settings = settings or get_settings()
	secret_field = getattr(settings, "billing_webhook_secret", None)
	secret = settings.get_password("billing_webhook_secret") if secret_field else ""
	if not secret:
		return True
	if not signature:
		return False
	body = payload if isinstance(payload, str) else json.dumps(payload, sort_keys=True)
	expected = hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()
	return hmac.compare_digest(expected, signature)


def _period_is_valid(settings) -> bool:
	period_end = getattr(settings, "billing_period_end", None)
	if not period_end:
		return True
	return getdate(period_end) >= getdate(today())


def resolve_effective_tier(settings=None) -> str:
	"""Tier from billing state when SaaS sync is enabled."""
	settings = settings or get_settings()
	manual_tier = normalize_tier(getattr(settings, "subscription_tier", None) or "Enterprise")

	if not is_billing_sync_enabled(settings):
		return manual_tier

	status = (getattr(settings, "billing_status", None) or "Manual").strip()
	plan_tier = map_plan_to_tier(getattr(settings, "billing_plan_code", None))

	if status in BILLING_STATUS_ACTIVE:
		if not _period_is_valid(settings):
			return "Free"
		return plan_tier or manual_tier

	if status in BILLING_STATUS_GRACE:
		if not _period_is_valid(settings):
			return "Free"
		return plan_tier or manual_tier

	if status in BILLING_STATUS_INACTIVE:
		return "Free"

	return plan_tier or manual_tier


def _parse_payload(payload) -> dict:
	if isinstance(payload, dict):
		return payload
	if isinstance(payload, str):
		try:
			return json.loads(payload)
		except json.JSONDecodeError as exc:
			frappe.throw(_("Invalid JSON payload: {0}").format(exc))
	return frappe.parse_json(payload) or {}


def _normalize_status(raw: str | None) -> str:
	value = (raw or "Active").strip().lower().replace("_", " ").replace("-", " ")
	mapping = {
		"active": "Active",
		"trialing": "Trial",
		"trial": "Trial",
		"past due": "Past Due",
		"pastdue": "Past Due",
		"cancelled": "Cancelled",
		"canceled": "Cancelled",
		"expired": "Expired",
		"suspended": "Suspended",
		"manual": "Manual",
	}
	return mapping.get(value, raw.strip().title() if raw else "Active")


def log_subscription_event(event_type: str, payload: dict, *, applied_tier: str | None = None, notes: str | None = None):
	try:
		frappe.get_doc(
			{
				"doctype": "IMOGI POS Subscription Event",
				"event_type": event_type,
				"subscription_id": payload.get("subscription_id") or payload.get("id"),
				"plan_code": payload.get("plan") or payload.get("plan_code"),
				"billing_status": _normalize_status(payload.get("status")),
				"applied_tier": applied_tier,
				"payload_json": json.dumps(payload, indent=2, default=str),
				"notes": notes,
			}
		).insert(ignore_permissions=True)
	except Exception:
		frappe.log_error(title=_("IMOGI subscription event log failed"))


def apply_billing_payload(payload, *, settings=None, source: str = "webhook") -> dict:
	"""Apply billing provider payload and optionally sync tier."""
	settings = settings or frappe.get_single("IMOGI POS Settings")
	data = _parse_payload(payload)

	event = (data.get("event") or data.get("type") or "subscription.updated").strip()
	subscription_id = data.get("subscription_id") or data.get("id") or data.get("external_id")
	plan_code = data.get("plan") or data.get("plan_code") or data.get("product")
	status = _normalize_status(data.get("status"))
	period_end = data.get("current_period_end") or data.get("period_end") or data.get("valid_until")
	explicit_tier = data.get("tier") or data.get("subscription_tier")

	mapped_tier = map_plan_to_tier(plan_code, explicit_tier)

	updates = {
		"billing_last_synced": now_datetime(),
		"billing_status": status,
	}
	if subscription_id:
		updates["billing_external_id"] = subscription_id
	if plan_code:
		updates["billing_plan_code"] = plan_code
	if period_end:
		updates["billing_period_end"] = getdate(period_end)
	if not cint(settings.enable_saas_billing_sync):
		updates["enable_saas_billing_sync"] = 1

	settings.update(updates)

	applied_tier = None
	if cint(getattr(settings, "billing_auto_apply_tier", 1)):
		applied_tier = resolve_effective_tier(settings)
		settings.subscription_tier = applied_tier

	settings.flags.ignore_permissions = True
	settings.save(ignore_permissions=True)
	frappe.db.commit()

	from imogi_pos.imogi_pos.utils.feature_gating import enforce_settings_tier_limits

	enforce_settings_tier_limits(settings)

	log_subscription_event(event, data, applied_tier=applied_tier, notes=source)

	frappe.publish_realtime("imogi_pos_settings_updated", {"subscription_tier": settings.subscription_tier})

	return {
		"event": event,
		"subscription_id": subscription_id,
		"status": status,
		"plan_code": plan_code,
		"applied_tier": applied_tier or settings.subscription_tier,
		"period_end": str(settings.billing_period_end or ""),
	}


def sync_tier_from_billing(settings=None) -> dict:
	settings = settings or frappe.get_single("IMOGI POS Settings")
	if not is_billing_sync_enabled(settings):
		frappe.throw(_("SaaS billing sync is disabled"))

	tier = resolve_effective_tier(settings)
	before = settings.subscription_tier
	settings.subscription_tier = tier
	settings.billing_last_synced = now_datetime()
	settings.flags.ignore_permissions = True
	settings.save(ignore_permissions=True)
	frappe.db.commit()

	from imogi_pos.imogi_pos.utils.feature_gating import enforce_settings_tier_limits

	enforce_settings_tier_limits(settings)

	return {"before": before, "after": tier, "status": settings.billing_status}


def enforce_billing_tier_on_settings(doc):
	"""Keep tier aligned with billing when auto-apply is on."""
	if not is_billing_sync_enabled(doc):
		return
	if not cint(getattr(doc, "billing_auto_apply_tier", 1)):
		return
	doc.subscription_tier = resolve_effective_tier(doc)


def check_billing_expiry():
	"""Scheduled: downgrade tier when subscription period ended."""
	settings = frappe.get_single("IMOGI POS Settings")
	if not is_billing_sync_enabled(settings):
		return

	status = (settings.billing_status or "").strip()
	if status not in BILLING_STATUS_ACTIVE | BILLING_STATUS_GRACE:
		return

	if _period_is_valid(settings):
		return

	payload = {
		"event": "subscription.expired",
		"subscription_id": settings.billing_external_id,
		"plan": settings.billing_plan_code,
		"status": "expired",
		"current_period_end": str(settings.billing_period_end or ""),
	}
	apply_billing_payload(payload, settings=settings, source="scheduler")


def serialize_billing_status(settings=None) -> dict:
	settings = settings or get_settings()
	site = frappe.local.site if getattr(frappe.local, "site", None) else ""
	webhook_url = ""
	if site:
		webhook_url = frappe.utils.get_url(f"/api/method/imogi_pos.api.billing_api.billing_webhook")

	return {
		"enabled": is_billing_sync_enabled(settings),
		"auto_apply_tier": bool(cint(getattr(settings, "billing_auto_apply_tier", 1))),
		"provider": getattr(settings, "billing_provider", None) or "Generic Webhook",
		"external_id": getattr(settings, "billing_external_id", None),
		"plan_code": getattr(settings, "billing_plan_code", None),
		"status": getattr(settings, "billing_status", None) or "Manual",
		"period_end": str(getattr(settings, "billing_period_end", None) or ""),
		"last_synced": str(getattr(settings, "billing_last_synced", None) or ""),
		"effective_tier": resolve_effective_tier(settings),
		"manual_tier": normalize_tier(getattr(settings, "subscription_tier", None) or "Enterprise"),
		"webhook_url": webhook_url,
	}
