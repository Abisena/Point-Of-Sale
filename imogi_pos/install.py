# Copyright (c) 2026, Imogi and contributors

import frappe


def after_install():
	_ensure_erpnext_contact_fields()
	_ensure_receipt_print_format()
	_create_default_settings()
	_create_sample_kitchen_station()
	_create_imogi_roles()
	_import_workspaces()


def ensure_receipt_print_format():
	_ensure_receipt_print_format()


def _receipt_print_html(header, footer):
	return """<style>
.imogi-receipt { color: #111; font-family: "Segoe UI", Arial, sans-serif; font-size: 11px; margin: 0 auto; max-width: 72mm; padding: 8px 4px 16px; }
.imogi-receipt-head { border-bottom: 2px solid #111; margin-bottom: 10px; padding-bottom: 10px; text-align: center; }
.imogi-receipt-store { font-size: 17px; font-weight: 800; letter-spacing: 0.03em; line-height: 1.2; margin: 0; text-transform: uppercase; }
.imogi-receipt-sub { color: #666; font-size: 10px; margin-top: 4px; }
.imogi-receipt-meta { border-bottom: 1px dashed #bbb; margin-bottom: 10px; padding-bottom: 8px; }
.imogi-receipt-meta-row { display: flex; font-size: 10px; justify-content: space-between; margin-bottom: 3px; }
.imogi-receipt-meta-row span:last-child { color: #333; font-weight: 600; text-align: right; }
.imogi-receipt-items { margin-bottom: 8px; width: 100%; }
.imogi-receipt-items thead th { border-bottom: 1px solid #ddd; color: #666; font-size: 9px; font-weight: 700; letter-spacing: 0.04em; padding: 4px 0; text-align: left; text-transform: uppercase; }
.imogi-receipt-items thead th:last-child { text-align: right; }
.imogi-receipt-items tbody td { border-bottom: 1px dotted #e5e5e5; padding: 7px 0 5px; vertical-align: top; }
.imogi-receipt-item-name { font-size: 11px; font-weight: 700; line-height: 1.25; }
.imogi-receipt-item-qty { color: #666; font-size: 10px; margin-top: 2px; }
.imogi-receipt-item-amt { font-size: 11px; font-variant-numeric: tabular-nums; font-weight: 700; text-align: right; white-space: nowrap; }
.imogi-receipt-totals { border-top: 1px solid #111; margin-top: 6px; padding-top: 8px; }
.imogi-receipt-total-row { display: flex; font-size: 11px; justify-content: space-between; margin-bottom: 4px; }
.imogi-receipt-total-row.is-grand { font-size: 14px; font-weight: 800; margin-top: 6px; }
.imogi-receipt-total-row.is-discount strong { color: #b91c1c; }
.imogi-receipt-pay { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 8px; padding: 8px; }
.imogi-receipt-pay-row { display: flex; font-size: 10px; justify-content: space-between; margin-bottom: 3px; }
.imogi-receipt-pay-row:last-child { margin-bottom: 0; }
.imogi-receipt-change { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; color: #047857; font-size: 12px; font-weight: 800; margin-top: 8px; padding: 8px; text-align: center; }
.imogi-receipt-foot { border-top: 1px dashed #bbb; color: #666; font-size: 10px; margin-top: 14px; padding-top: 10px; text-align: center; }
@media print { body { margin: 0; } .imogi-receipt { max-width: 72mm; } }
</style>
<div class="imogi-receipt">
  <div class="imogi-receipt-head">
    <div class="imogi-receipt-store">__HEADER__</div>
    <div class="imogi-receipt-sub">{{ doc.company or "" }}</div>
  </div>
  <div class="imogi-receipt-meta">
    <div class="imogi-receipt-meta-row"><span>No. Order</span><span>{{ doc.name }}</span></div>
    <div class="imogi-receipt-meta-row"><span>Tanggal</span><span>{{ frappe.utils.format_datetime(doc.creation) }}</span></div>
    {% if doc.customer_name or doc.customer %}
    <div class="imogi-receipt-meta-row"><span>Customer</span><span>{{ doc.customer_name or doc.customer }}</span></div>
    {% endif %}
    {% if doc.order_type %}
    <div class="imogi-receipt-meta-row"><span>Tipe</span><span>{{ doc.order_type }}</span></div>
    {% endif %}
  </div>
  <table class="imogi-receipt-items">
    <thead><tr><th>Item</th><th>Subtotal</th></tr></thead>
    <tbody>
      {% for row in doc.items %}
      <tr>
        <td>
          <div class="imogi-receipt-item-name">{{ row.item_name or row.item_code }}</div>
          <div class="imogi-receipt-item-qty">{{ row.qty }} x {{ frappe.utils.fmt_money(row.rate, currency=doc.currency) }}</div>
        </td>
        <td class="imogi-receipt-item-amt">{{ frappe.utils.fmt_money(row.amount, currency=doc.currency) }}</td>
      </tr>
      {% endfor %}
    </tbody>
  </table>
  <div class="imogi-receipt-totals">
    {% if doc.discount_amount %}
    <div class="imogi-receipt-total-row"><span>Subtotal</span><strong>{{ frappe.utils.fmt_money(doc.subtotal, currency=doc.currency) }}</strong></div>
    <div class="imogi-receipt-total-row is-discount"><span>Diskon</span><strong>-{{ frappe.utils.fmt_money(doc.discount_amount, currency=doc.currency) }}</strong></div>
    {% endif %}
    <div class="imogi-receipt-total-row is-grand"><span>TOTAL</span><strong>{{ frappe.utils.fmt_money(doc.grand_total, currency=doc.currency) }}</strong></div>
  </div>
  {% if doc.payments %}
  <div class="imogi-receipt-pay">
    {% for pay in doc.payments %}
    <div class="imogi-receipt-pay-row"><span>{{ pay.mode_of_payment }}</span><strong>{{ frappe.utils.fmt_money(pay.amount, currency=doc.currency) }}</strong></div>
    {% endfor %}
    {% if doc.paid_amount and doc.paid_amount > doc.grand_total %}
    <div class="imogi-receipt-change">Kembalian: {{ frappe.utils.fmt_money(doc.paid_amount - doc.grand_total, currency=doc.currency) }}</div>
    {% endif %}
  </div>
  {% endif %}
  <div class="imogi-receipt-foot">__FOOTER__</div>
</div>""".replace("__HEADER__", header).replace("__FOOTER__", footer)


def _ensure_receipt_print_format():
	name = "IMOGI POS Receipt"
	try:
		settings = frappe.get_single("IMOGI POS Settings")
	except Exception:
		settings = None
	header = (settings.receipt_header if settings else None) or "IMOGI POS"
	footer = (settings.receipt_footer if settings else None) or "Terima kasih"
	html = _receipt_print_html(header, footer)

	if frappe.db.exists("Print Format", name):
		frappe.db.set_value("Print Format", name, "html", html, update_modified=False)
		return

	doc = frappe.new_doc("Print Format")
	doc.name = name
	doc.doc_type = "Riwayat Order"
	doc.standard = "Yes"
	doc.custom_format = 1
	doc.print_format_type = "Jinja"
	doc.html = html
	doc.insert(ignore_permissions=True)


def _ensure_erpnext_contact_fields():
	if frappe.db.exists("Custom Field", "Contact-is_billing_contact"):
		return

	from erpnext.setup.install import create_address_and_contact_custom_fields

	create_address_and_contact_custom_fields()


def _settings_doc_exists():
	return bool(
		frappe.db.sql(
			"SELECT 1 FROM `tabSingles` WHERE doctype = %s LIMIT 1",
			"IMOGI POS Settings",
		)
	)


def _create_default_settings():
	if _settings_doc_exists():
		return

	settings = frappe.new_doc("IMOGI POS Settings")
	settings.subscription_tier = "Enterprise"
	settings.enable_saas_billing_sync = 0
	settings.setup_complete = 0
	settings.enable_kitchen_display = 0
	settings.enable_fulfillment = 0
	settings.low_stock_check_interval = 180
	settings.low_stock_alert_roles = "IMOGI Kitchen Staff, IMOGI Fulfillment Staff, Sales Manager"
	settings.enable_auto_purchase_request = 1
	settings.enable_realtime_notifications = 1
	settings.dashboard_refresh_seconds = 30
	if frappe.db.exists("Print Format", "IMOGI POS Receipt"):
		settings.receipt_print_format = "IMOGI POS Receipt"

	company = frappe.db.get_single_value("Global Defaults", "default_company")
	if company:
		settings.default_company = company
		settings.default_warehouse = frappe.db.get_value(
			"Warehouse", {"company": company, "is_group": 0}, "name"
		)
		settings.default_pos_profile = frappe.db.get_value("POS Profile", {"company": company}, "name")

	settings.flags.ignore_mandatory = True
	settings.insert(ignore_permissions=True)


def _create_sample_kitchen_station():
	if frappe.db.exists("IMOGI Kitchen Station", "Main Kitchen"):
		return

	company = frappe.db.get_single_value("Global Defaults", "default_company")
	frappe.get_doc(
		{
			"doctype": "IMOGI Kitchen Station",
			"station_name": "Main Kitchen",
			"company": company,
			"is_active": 1,
			"description": "Default kitchen station for Cut & Cups flow",
		}
	).insert(ignore_permissions=True)


def _create_imogi_roles():
	from imogi_pos.imogi_pos.utils.role_permissions import get_imogi_role_permissions

	roles = list(get_imogi_role_permissions().keys())

	for role in roles:
		if not frappe.db.exists("Role", role):
			frappe.get_doc({"doctype": "Role", "role_name": role, "desk_access": 1}).insert(
				ignore_permissions=True
			)

	frappe.db.set_value("Role", "IMOGI Owner", "home_page", "imogi-pos-dashboard")
	frappe.db.set_value("Role", "IMOGI Manager", "home_page", "imogi-pos-menu")
	frappe.db.set_value("Role", "IMOGI Area Manager", "home_page", "imogi-pos-dashboard")
	frappe.db.set_value("Role", "IMOGI Cashier", "home_page", "imogi-pos-cashier")
	frappe.db.set_value("Role", "IMOGI Waiter", "home_page", "imogi-pos-cashier")
	frappe.db.set_value("Role", "IMOGI Supervisor", "home_page", "imogi-pos-dashboard")
	frappe.db.set_value("Role", "IMOGI Chef", "home_page", "kitchen-display")
	frappe.db.set_value("Role", "IMOGI Inventory", "home_page", "imogi-pos-dashboard")
	frappe.db.set_value("Role", "IMOGI Purchasing", "home_page", "imogi-pos-dashboard")
	frappe.db.set_value("Role", "IMOGI Finance", "home_page", "imogi-pos-dashboard")
	frappe.db.set_value("Role", "IMOGI Auditor", "home_page", "imogi-pos-dashboard")

	_perms = get_imogi_role_permissions()

	for role, doctype_perms in _perms.items():
		for doctype, perms in doctype_perms:
			_ensure_role_perm(role, doctype, perms)


def ensure_imogi_role_permissions():
	"""Re-apply IMOGI role permissions on existing sites (safe to run repeatedly)."""
	_create_imogi_roles()


def _ensure_role_perm(role, doctype, perms):
	from frappe.permissions import add_permission, update_permission_property

	if not frappe.db.exists("Custom DocPerm", {"parent": doctype, "role": role, "permlevel": 0}):
		add_permission(doctype, role, 0)

	for ptype, val in perms.items():
		if val:
			update_permission_property(doctype, role, 0, ptype, 1)


def _import_workspaces():
	from imogi_pos.imogi_pos.utils.workspace import import_workspaces, sync_workspaces

	import_workspaces()
	sync_workspaces()


def _add_role_perm_if_missing(role, doctype, perms):
	if frappe.db.exists("Custom DocPerm", {"parent": doctype, "role": role, "permlevel": 0}):
		return
	_ensure_role_perm(role, doctype, perms)
