app_name = "imogi_pos"
app_title = "Imogi POS"
app_publisher = "Imogi"
app_description = "Custom POS module for Imogi"
app_email = "imogi@imogi.com"
app_license = "mit"
app_color = "#0f1f35"
app_logo_url = "/assets/imogi_pos/images/imogi-pos-logo.png"
required_apps = ["erpnext"]

add_to_apps_screen = [
	{
		"name": "imogi_pos",
		"logo": "/assets/imogi_pos/images/imogi-pos-logo.png",
		"title": "Imogi POS",
		"route": "/app/imogi-pos",
		"has_permission": "imogi_pos.api.permission.has_app_permission",
	}
]

website_context = {
	"app_name": "IMOGI POS",
	"favicon": "/assets/imogi_pos/images/imogi-pos-favicon.png",
	"splash_image": "/assets/imogi_pos/images/imogi-pos-logo.png",
}

update_website_context = "imogi_pos.website.update_website_context"

# Includes in <head>
# ------------------

app_include_css = [
	"/assets/imogi_pos/css/imogi_pos.css",
	"/assets/imogi_pos/css/imogi_pos_desk_theme.css",
	"/assets/imogi_pos/css/imogi_pos_setup_wizard.css",
]
app_include_js = [
	"/assets/imogi_pos/js/imogi_pos_boot.js",
	"/assets/imogi_pos/js/imogi_pos_dashboard_focus.js",
	"/assets/imogi_pos/js/imogi_pos_page_shell.js",
	"/assets/imogi_pos/js/imogi_pos_order_surface.js",
	"/assets/imogi_pos/js/imogi_pos_settings_api.js",
	"/assets/imogi_pos/js/imogi_customer_quick_entry.js",
	"/assets/imogi_pos/js/imogi_pos_shift.js",
	"/assets/imogi_pos/js/imogi_pos_variant_modal.js",
	"/assets/imogi_pos/js/imogi_pos_thermal_print.js",
	"/assets/imogi_pos/js/qrcode.min.js",
	"/assets/imogi_pos/js/imogi_pos_qris_payment.js",
	"/assets/imogi_pos/js/imogi_pos_loyalty.js",
	"/assets/imogi_pos/js/imogi_pos_feature_upgrade.js",
	"/assets/imogi_pos/js/imogi_pos_tier_picker.js",
	"/assets/imogi_pos/js/imogi_pos_cashier_extras.js",
	"/assets/imogi_pos/js/imogi_pos_payment_modal.js",
	"/assets/imogi_pos/js/imogi_pos_pwa.js",
	"/assets/imogi_pos/js/imogi_pos_offline.js",
	"/assets/imogi_pos/js/imogi_pos_workspace.js",
]

# include js, css files in header of web template
web_include_css = "/assets/imogi_pos/css/imogi_pos_login.css"
# web_include_js = "/assets/imogi_pos/js/imogi_pos.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "imogi_pos/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page — ensure shift helpers load with Buka/Tutup Shift (avoids stale app_include cache)
page_js = {
	"imogi-pos-open-shift": "public/js/imogi_pos_shift.js",
	"imogi-pos-close-shift": "public/js/imogi_pos_shift.js",
	"imogi-pos-order-history": "public/js/imogi_pos_order_surface.js",
	"imogi-pos-order-management": "public/js/imogi_pos_order_surface.js",
}

doctype_js = {
	"Riwayat Order": "public/js/imogi_pos_order.js",
	"IMOGI POS Settings": "public/js/imogi_pos_settings.js",
	"IMOGI POS Promo Rule": "public/js/imogi_pos_promo_rule.js",
	"IMOGI POS Shift Opening": "public/js/imogi_pos_shift_opening.js",
	"IMOGI Branch": "public/js/imogi_branch.js",
	"POS Opening Entry": "public/js/imogi_pos_opening_entry.js",
	"POS Closing Entry": "public/js/imogi_pos_closing_entry.js",
	"User": "public/js/imogi_user_roles.js",
}
doctype_list_js = {
	"Riwayat Order": "public/js/imogi_pos_order_list.js",
	"IMOGI POS Promo Rule": "public/js/imogi_pos_promo_rule_list.js",
}

fixtures = [
	{
		"dt": "Custom Field",
		"filters": [["name", "in", [
			"Item-imogi_is_kitchen_item",
			"Item-imogi_pos_category",
			"Item-imogi_pos_add_ons",
			"Item-imogi_max_stock",
			"POS Invoice-imogi_pos_order",
			"POS Invoice-imogi_order_channel",
			"POS Invoice-imogi_order_type",
		]]],
	},
]
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "imogi_pos/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "imogi_pos.utils.jinja_methods",
# 	"filters": "imogi_pos.utils.jinja_filters"
# }

# Installation
# ------------

after_install = "imogi_pos.install.after_install"
after_migrate = "imogi_pos.imogi_pos.utils.cache.after_migrate"
boot_session = "imogi_pos.boot.boot_session"
on_login = "imogi_pos.auth.on_login"

# Uninstallation
# ------------

# before_uninstall = "imogi_pos.uninstall.before_uninstall"
# after_uninstall = "imogi_pos.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "imogi_pos.utils.before_app_install"
# after_app_install = "imogi_pos.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "imogi_pos.utils.before_app_uninstall"
# after_app_uninstall = "imogi_pos.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "imogi_pos.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

permission_query_conditions = {
	"IMOGI Area Manager Assignment": "imogi_pos.imogi_pos.utils.area_manager.assignment_permission_query",
}
# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

override_doctype_class = {
	"POS Invoice": "imogi_pos.overrides.pos_invoice.ImogiPOSInvoice",
	"POS Invoice Merge Log": "imogi_pos.overrides.pos_invoice_merge_log.ImogiPOSInvoiceMergeLog",
	"Riwayat Order": "imogi_pos.imogi_pos.doctype.riwayat_order.riwayat_order.RiwayatOrder",
}

# Document Events
# ---------------
# Hook on document methods and events

doc_events = {
	"POS Closing Entry": {
		"on_submit": "imogi_pos.imogi_pos.utils.shift_closing.on_pos_closing_entry_after_submit",
	},
	"POS Invoice": {
		"on_submit": [
			"imogi_pos.imogi_pos.utils.pos_bom_stock.invalidate_pos_catalog_cache_on_invoice_submit",
			"imogi_pos.imogi_pos.utils.pos_bom_stock.consume_bom_for_pos_invoice_on_submit",
			"imogi_pos.imogi_pos.utils.pos_invoice_sync.sync_imogi_order_from_pos_invoice",
		],
		"on_cancel": [
			"imogi_pos.imogi_pos.utils.pos_bom_stock.cancel_bom_for_pos_invoice_on_cancel",
			"imogi_pos.imogi_pos.utils.pos_invoice_sync.cancel_imogi_order_from_pos_invoice",
		],
	},
	"Sales Invoice": {
		"before_submit": "imogi_pos.imogi_pos.utils.pos_consolidation.before_consolidated_sales_invoice_submit",
	},
	"Item": {
		"on_update": "imogi_pos.imogi_pos.utils.catalog_cache.invalidate_catalog_cache_on_item_update",
	},
	"Purchase Order": {
		"before_submit": "imogi_pos.imogi_pos.utils.approval_hooks.purchase_order_before_submit",
	},
	"Stock Entry": {
		"before_submit": "imogi_pos.imogi_pos.utils.approval_hooks.stock_entry_before_submit",
	},
	"IMOGI Kitchen Order": {
		"after_insert": "imogi_pos.imogi_pos.utils.planned_features.on_kitchen_order_created",
	},
}

# Scheduled Tasks
# ---------------

scheduler_events = {
	"cron": {
		"* * * * *": ["imogi_pos.tasks.check_low_stock_scheduled"],
	},
	"daily": [
		"imogi_pos.tasks.check_billing_expiry_scheduled",
	],
}

# Testing
# -------

# before_tests = "imogi_pos.install.before_tests"

# Overriding Methods
# ------------------------------
#
override_whitelisted_methods = {
	"frappe.desk.desktop.get_desktop_page": "imogi_pos.overrides.desktop.get_desktop_page",
}
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "imogi_pos.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["imogi_pos.utils.before_request"]
# after_request = ["imogi_pos.utils.after_request"]

# Job Events
# ----------
# before_job = ["imogi_pos.utils.before_job"]
# after_job = ["imogi_pos.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"imogi_pos.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

# Translation
# ------------
# List of apps whose translatable strings should be excluded from this app's translations.
# ignore_translatable_strings_from = []

