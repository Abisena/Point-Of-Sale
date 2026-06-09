# Copyright (c) 2026, Imogi and contributors

IMOGI_POS_APP_NAME = "IMOGI POS"
IMOGI_POS_LOGO = "/assets/imogi_pos/images/imogi-pos-logo.png"
IMOGI_POS_LOGO_WHITE = "/assets/imogi_pos/images/imogi-pos-logo-white.png"
IMOGI_POS_LOGIN_LOGO = IMOGI_POS_LOGO_WHITE
IMOGI_POS_FAVICON = "/assets/imogi_pos/images/imogi-pos-favicon.png"
IMOGI_POS_DESK_LOGO = IMOGI_POS_LOGO


def update_website_context(context):
	if context.get("path") != "login":
		return None

	return {
		"app_name": IMOGI_POS_APP_NAME,
		"logo": IMOGI_POS_LOGIN_LOGO,
		"favicon": IMOGI_POS_FAVICON,
		"title": f"Login - {IMOGI_POS_APP_NAME}",
	}


def patch_app_favicon():
	import frappe.www.app as app_module

	if getattr(app_module, "_imogi_pos_favicon_patched", False):
		return

	original_get_context = app_module.get_context

	def get_context(context):
		result = original_get_context(context)
		result["favicon"] = IMOGI_POS_FAVICON
		return result

	app_module.get_context = get_context
	app_module._imogi_pos_favicon_patched = True
