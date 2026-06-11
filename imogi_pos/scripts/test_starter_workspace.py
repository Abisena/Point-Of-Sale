# Copyright (c) 2026, Imogi and contributors
"""Debug workspace tier filtering for Starter."""

from __future__ import annotations

import frappe
from json import dumps

from imogi_pos.overrides.desktop import get_desktop_page
from imogi_pos.imogi_pos.utils.feature_registry import is_feature_in_plan, summarize_tiers
from imogi_pos.imogi_pos.utils.workspace_tier_gating import is_workspace_item_in_plan


def run():
	settings = frappe.get_single("IMOGI POS Settings")
	original = settings.subscription_tier or "Enterprise"
	settings.subscription_tier = "Starter"
	settings.save(ignore_permissions=True)
	frappe.db.commit()

	try:
		page = get_desktop_page(dumps({"name": "Imogi POS", "title": "Imogi POS"}))
		shortcuts = [s.get("link_to") for s in (page.get("shortcuts") or {}).get("items", [])]
		print("tier on page:", page.get("imogi_pos_tier"))
		print("shortcuts:", shortcuts)
		total = 0
		for card in (page.get("cards") or {}).get("items", []):
			links = [l.get("link_to") for l in card.get("links", [])]
			total += len(links)
			print(f"  {card.get('label')}: {len(links)} links")
		print("total card links:", total)
		content = page.get("imogi_pos_filtered_content") or "[]"
		import json

		blocks = json.loads(content)
		shortcut_blocks = [b for b in blocks if b.get("type") == "shortcut"]
		card_blocks = [b for b in blocks if b.get("type") == "card"]
		print("content shortcut blocks:", len(shortcut_blocks))
		print("content card blocks:", len(card_blocks))
		print("starter cumulative:", summarize_tiers()["per_tier"]["Starter"])

		# should be hidden on Starter
		for lt, lto in (
			("Page", "kitchen-display"),
			("Page", "imogi-pos-open-shift"),
			("DocType", "IMOGI POS Loyalty Member"),
		):
			print(f"  in_plan {lto}:", is_workspace_item_in_plan(lt, lto, "Starter"))
	finally:
		settings.subscription_tier = original
		settings.save(ignore_permissions=True)
		frappe.db.commit()
