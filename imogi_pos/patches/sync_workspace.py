import frappe

from imogi_pos.imogi_pos.utils.flow import get_settings
from imogi_pos.imogi_pos.utils.workspace import import_workspaces, sync_workspaces


def execute():
	import_workspaces()
	settings = get_settings()
	if settings.setup_complete and settings.business_type:
		sync_workspaces(settings.business_type)
	else:
		sync_workspaces()
