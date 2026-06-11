# Copyright (c) 2026, Imogi and contributors

import frappe

from imogi_pos.imogi_pos.utils.flow import get_settings
from imogi_pos.imogi_pos.utils.workspace import sync_workspaces


def execute():
	# Rebuild label→feature map after catalog changes.
	from imogi_pos.imogi_pos.utils import workspace_tier_gating as gating

	gating._WORKSPACE_LINK_LABEL_FEATURES = None

	settings = get_settings()
	if settings.setup_complete and settings.business_type:
		sync_workspaces(settings.business_type)
	else:
		sync_workspaces()
	frappe.clear_cache()
