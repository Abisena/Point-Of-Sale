# Copyright (c) 2026, Imogi and contributors
"""Dashboard deep-link focus keys (workspace label / ?focus= query)."""

from __future__ import annotations

# feature_registry id → focus key
FEATURE_ID_TO_FOCUS: dict[str, str] = {
	"dashboard_sales": "sales",
	"dashboard_operational": "operational",
	"top_menu": "top_menu",
	"sales_by_hour": "sales_by_hour",
	"sales_by_category": "sales_by_category",
	"sales_by_payment": "sales_by_payment",
	"discount_report": "discount_report",
	"refund_report": "refund_report",
	"food_cost_report": "food_cost_report",
	"waste_report": "waste_report",
	"tax_report": "tax_report",
	"kitchen_performance": "operational",
	"table_turnover_report": "table_turnover_report",
	"customer_visit_report": "customer_visit_report",
}


def focus_for_feature_id(feature_id: str | None) -> str | None:
	if not feature_id:
		return None
	return FEATURE_ID_TO_FOCUS.get(feature_id)


def dashboard_route_with_focus(feature_id: str | None, page: str = "imogi-pos-dashboard") -> str:
	focus = focus_for_feature_id(feature_id)
	if not focus:
		return page
	return f"{page}?focus={focus}"


def get_dashboard_focus_by_label() -> dict[str, str]:
	from imogi_pos.imogi_pos.utils.workspace_catalog import WORKSPACE_SECTIONS, WORKSPACE_SHORTCUTS

	mapping: dict[str, str] = {}
	for section in WORKSPACE_SECTIONS:
		for link in section.get("links", []):
			focus = link.get("dashboard_focus")
			if focus:
				mapping[link["label"]] = focus
	for shortcut in WORKSPACE_SHORTCUTS:
		focus = shortcut.get("dashboard_focus")
		if focus:
			mapping[shortcut["label"]] = focus
	return mapping
