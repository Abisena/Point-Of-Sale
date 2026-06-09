# Copyright (c) 2026, Imogi and contributors

import frappe

from imogi_pos.api.cashier import _require_cashier_access
from imogi_pos.api.order import _parse_json
from imogi_pos.imogi_pos.utils.promo_rules import apply_promo_rules, is_promo_enabled


@frappe.whitelist()
def preview_cart_promos(items, company=None):
	"""Preview automatic promo rules for current cart."""
	_require_cashier_access()
	if not is_promo_enabled():
		return {"enabled": False, "promo_discount": 0, "applied_promos": [], "items": []}
	parsed = _parse_json(items, "items") or []
	result = apply_promo_rules(parsed, company=company)
	return {"enabled": True, **result}
