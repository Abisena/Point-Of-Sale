# Copyright (c) 2026, Imogi and contributors
"""Wipe all site data and reinstall apps (no MariaDB root required)."""

import frappe
from frappe.database.mariadb.setup_db import import_db_from_sql
from frappe.installer import install_app
from frappe.utils.install import after_install as frappe_after_install
from frappe.utils.password import update_password

APPS = ("frappe", "erpnext", "hrms", "imogi_pos")


def wipe_and_reinstall(admin_password="admin"):
	frappe.set_user("Administrator")

	print("Dropping all tables...")
	tables = frappe.db.sql("SHOW TABLES", pluck=True)
	frappe.db.sql("SET FOREIGN_KEY_CHECKS = 0")
	for table in tables:
		frappe.db.sql_ddl(f"DROP TABLE IF EXISTS `{table}`")
	frappe.db.sql("SET FOREIGN_KEY_CHECKS = 1")

	print("Bootstrapping Frappe schema...")
	import_db_from_sql(verbose=True)

	site = frappe.local.site
	frappe.destroy()
	frappe.init(site=site)
	frappe.connect()
	frappe.set_user("Administrator")

	frappe.db.create_auth_table()
	frappe.db.create_global_search_table()
	frappe.db.create_user_settings_table()

	frappe.flags.in_install_db = True
	frappe.flags.in_install = "frappe"
	for app in APPS:
		print(f"Installing {app}...")
		install_app(app, verbose=True, set_as_patched=True, force=True)
		if app == "frappe":
			frappe_after_install()
	frappe.flags.in_install_db = False
	frappe.flags.in_install = False

	if admin_password:
		update_password("Administrator", admin_password)

	frappe.db.commit()
	frappe.clear_cache()
	print("Site wipe complete.")
