# Copyright (c) 2026, Imogi and contributors

import frappe

from imogi_pos.boot import get_cashier_home_route, should_use_cashier_home


def patch_login_home_page():
	from frappe.auth import LoginManager

	if getattr(LoginManager, "_imogi_pos_login_patched", False):
		return

	original = LoginManager.set_user_info

	def set_user_info(self, resume=False):
		original(self, resume=resume)
		if resume:
			return

		route = get_cashier_home_route(self.user)
		if not route:
			return

		frappe.local.response["home_page"] = route
		frappe.local.response.pop("redirect_to", None)

	LoginManager.set_user_info = set_user_info
	LoginManager._imogi_pos_login_patched = True


def patch_default_path():
	import frappe.apps as apps_module

	if getattr(apps_module, "_imogi_pos_default_path_patched", False):
		return

	original = apps_module.get_default_path

	def get_default_path(apps=None):
		route = get_cashier_home_route()
		if route:
			return route
		return original(apps)

	apps_module.get_default_path = get_default_path
	apps_module._imogi_pos_default_path_patched = True


def on_login(login_manager):
	if not should_use_cashier_home(login_manager.user):
		return

	frappe.cache.hdel("bootinfo", login_manager.user)

	from imogi_pos.boot import get_cashier_landing, set_opening_route_options

	if get_cashier_landing(login_manager.user) == "opening-entry":
		from imogi_pos.imogi_pos.utils.flow import get_settings

		settings = get_settings()
		company = settings.default_company or frappe.defaults.get_user_default("Company")
		set_opening_route_options(
			{"imogi_return_to_cashier": 1, "company": company},
			user=login_manager.user,
			company=company,
		)
