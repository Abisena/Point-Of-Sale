# Copyright (c) 2026, Imogi and contributors

from json import loads

import frappe
from frappe import DoesNotExistError
from frappe.desk.desktop import Workspace

from imogi_pos.imogi_pos.utils.workspace import WORKSPACE_NAME
from imogi_pos.imogi_pos.utils.workspace_tier_gating import apply_workspace_tier_filters


@frappe.whitelist()
@frappe.read_only()
def get_desktop_page(page):
	"""Filter IMOGI POS workspace cards/shortcuts by subscription tier."""
	try:
		workspace = Workspace(loads(page))
		workspace.build_workspace()
		payload = {
			"charts": workspace.charts,
			"shortcuts": workspace.shortcuts,
			"cards": workspace.cards,
			"onboardings": workspace.onboardings,
			"quick_lists": workspace.quick_lists,
			"number_cards": workspace.number_cards,
			"custom_blocks": workspace.custom_blocks,
		}
		if workspace.page_name == WORKSPACE_NAME:
			payload = apply_workspace_tier_filters(
				payload, content_json=workspace.doc.content, user=frappe.session.user
			)
		return payload
	except DoesNotExistError:
		frappe.log_error("Workspace Missing")
		return {}
