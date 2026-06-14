# Copyright (c) 2026, Imogi and contributors
"""Apply simplified workspace catalog (one link per target)."""

import frappe

from imogi_pos.imogi_pos.utils.workspace import sync_workspaces


def execute():
	# Clear label→feature cache built from workspace_catalog
	from imogi_pos.imogi_pos.utils import workspace_tier_gating

	workspace_tier_gating._WORKSPACE_LINK_LABEL_FEATURES = None
	sync_workspaces()
	frappe.db.commit()
	frappe.clear_cache()
