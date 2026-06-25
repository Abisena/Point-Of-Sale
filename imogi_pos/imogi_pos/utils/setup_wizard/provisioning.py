# Copyright (c) 2026, Imogi and contributors

import re

import frappe
from frappe import _
from frappe.utils import cint, flt, get_abbr, getdate, now_datetime, today
from frappe.utils.password import update_password

from imogi_pos.imogi_pos.utils.pos_profile import create_umkm_pos_profile, get_default_warehouse
from imogi_pos.imogi_pos.utils.setup_wizard.business_templates import (
	AUTO_CREATED_CHECKLIST,
	get_business_template,
	get_flow_profile,
)
from imogi_pos.imogi_pos.utils.workspace import get_workspace_route, sync_workspaces


def _company_abbr(name):
	abbr = get_abbr(name, max_len=5)
	return re.sub(r"[^A-Z0-9]", "", abbr.upper())[:5] or "IMOGI"


def ensure_company(session):
	"""Create or update company from store identity.

	Setup wizard currently provisions one company per site. Use page
	<b>Tambah Company & Cabang</b> (<code>imogi-pos-add-branch</code>) to add
	further companies/branches in one guided flow.
	"""
	template = get_business_template(session.business_type)
	company_name = (session.store_name or "").strip()
	if not company_name:
		frappe.throw(_("Nama toko wajib diisi"))

	existing = frappe.db.get_value("Global Defaults", None, "default_company")
	if existing and frappe.db.exists("Company", existing):
		company = frappe.get_doc("Company", existing)
		if company.company_name != company_name:
			company.company_name = company_name
			company.save(ignore_permissions=True)
		return company.name

	abbr = _company_abbr(company_name)
	counter = 1
	while frappe.db.exists("Company", abbr):
		abbr = f"{_company_abbr(company_name)[:3]}{counter}"
		counter += 1

	company = frappe.get_doc(
		{
			"doctype": "Company",
			"company_name": company_name,
			"abbr": abbr,
			"default_currency": "IDR",
			"country": "Indonesia",
			"create_chart_of_accounts_based_on": "Standard Template",
			"chart_of_accounts": template.get("coa_chart") or "Indonesia - Chart of Accounts",
			"enable_perpetual_inventory": 1,
		}
	)
	company.flags.ignore_mandatory = True
	company.insert(ignore_permissions=True)

	frappe.db.set_single_value("Global Defaults", "default_company", company.name)
	frappe.db.set_default("company", company.name)
	return company.name


def ensure_warehouse(company, session):
	branch = (session.branch_name or "Stores").strip()
	company_abbr = frappe.get_cached_value("Company", company, "abbr")
	wh_name = f"{branch} - {company_abbr}"
	if frappe.db.exists("Warehouse", wh_name):
		return wh_name

	wh = frappe.get_doc(
		{
			"doctype": "Warehouse",
			"warehouse_name": branch,
			"company": company,
			"is_group": 0,
		}
	)
	wh.insert(ignore_permissions=True)
	return wh.name


def _ensure_named_group(doctype, name, parent=None):
	if frappe.db.exists(doctype, name):
		return name
	doc = frappe.new_doc(doctype)
	if doctype == "Item Group":
		doc.item_group_name = name
		doc.parent_item_group = parent or "All Item Groups"
	elif doctype == "Customer Group":
		doc.customer_group_name = name
		doc.parent_customer_group = parent or "All Customer Groups"
	elif doctype == "Supplier Group":
		doc.supplier_group_name = name
		doc.parent_supplier_group = parent or "All Supplier Groups"
	doc.insert(ignore_permissions=True)
	return name


def apply_business_master_data(company, business_type):
	template = get_business_template(business_type)
	created = []

	for group in template.get("item_groups", []):
		_ensure_named_group("Item Group", group)
		created.append(f"Item Group: {group}")

	for group in template.get("customer_groups", []):
		_ensure_named_group("Customer Group", group)
		created.append(f"Customer Group: {group}")

	for group in template.get("supplier_groups", []):
		_ensure_named_group("Supplier Group", group)
		created.append(f"Supplier Group: {group}")

	if template.get("apply_ppn"):
		_create_sales_tax_template(company, template.get("ppn_rate", 11))
		created.append(f"Tax Template PPN {template.get('ppn_rate')}%")

	_ensure_letter_head(company, business_type)
	created.append("Letter Head")

	return created


def _ensure_letter_head(company, business_type):
	name = f"{company} Receipt"
	if frappe.db.exists("Letter Head", name):
		return name
	company_name = frappe.get_cached_value("Company", company, "company_name")
	doc = frappe.new_doc("Letter Head")
	doc.letter_head_name = name
	doc.source = "HTML"
	doc.content = f"<div style='text-align:center'><h3>{company_name}</h3><p>{business_type}</p></div>"
	doc.is_default = 1
	doc.insert(ignore_permissions=True)
	return name


def _create_sales_tax_template(company, rate):
	title = f"PPN {int(rate)}% - {company}"
	if frappe.db.exists("Sales Taxes and Charges Template", title):
		return title

	account = frappe.db.get_value(
		"Account",
		{"company": company, "account_type": "Tax", "is_group": 0},
		"name",
	)
	if not account:
		account = frappe.db.get_value(
			"Account",
			{"company": company, "account_name": ["like", "%PPN%"], "is_group": 0},
			"name",
		)
	if not account:
		return None

	doc = frappe.new_doc("Sales Taxes and Charges Template")
	doc.title = title
	doc.company = company
	doc.append(
		"taxes",
		{
			"charge_type": "On Net Total",
			"account_head": account,
			"description": f"PPN {rate}%",
			"rate": rate,
		},
	)
	doc.insert(ignore_permissions=True)
	return doc.name


def create_cashier_users(session):
	created = []
	for row in session.cashiers:
		login_id = (row.login_id or "").strip()
		if not login_id:
			continue

		email = login_id if "@" in login_id else f"{re.sub(r'[^0-9]', '', login_id)}@imogi.local"
		if frappe.db.exists("User", email):
			user = frappe.get_doc("User", email)
		else:
			user = frappe.new_doc("User")
			user.email = email
			user.first_name = row.full_name or login_id
			user.send_welcome_email = 0
			user.user_type = "System User"
			user.insert(ignore_permissions=True)

		if not frappe.db.exists("Has Role", {"parent": email, "role": "IMOGI Cashier"}):
			user.add_roles("IMOGI Cashier")

		temp_password = ""
		if row.name:
			temp_password = (
				frappe.utils.password.get_decrypted_password(
					"IMOGI POS Setup Cashier Line", row.name, "temp_password", raise_exception=False
				)
				or ""
			).strip()
		if temp_password:
			update_password(user=email, pwd=temp_password)
			frappe.db.set_value("IMOGI POS Setup Cashier Line", row.name, "temp_password", "")

		row.user = email
		created.append(email)
	return created


def create_suppliers(session):
	created = []
	for row in session.suppliers:
		name = (row.supplier_name or "").strip()
		if not name:
			continue
		if frappe.db.exists("Supplier", name):
			supplier_name = name
		else:
			doc = frappe.new_doc("Supplier")
			doc.supplier_name = name
			doc.supplier_group = row.category or "Distributor"
			doc.mobile_no = row.phone
			doc.insert(ignore_permissions=True)
			supplier_name = doc.name
		row.supplier = supplier_name
		created.append(supplier_name)
	return created


def create_products(session, company, warehouse):
	created = []
	non_stock = get_business_template(session.business_type).get("non_stock_items")
	for row in session.products:
		item_name = (row.item_name or "").strip()
		if not item_name:
			continue
		item_code = slug_item_code(item_name)
		base = item_code
		n = 1
		while frappe.db.exists("Item", item_code):
			if frappe.db.get_value("Item", item_code, "item_name") == item_name:
				break
			item_code = f"{base}-{n}"
			n += 1

		if frappe.db.exists("Item", item_code):
			item = frappe.get_doc("Item", item_code)
		else:
			item = frappe.new_doc("Item")
			item.item_code = item_code
			item.item_name = item_name
			item.item_group = ensure_item_group(row.category or "Products")
			item.stock_uom = ensure_uom("Nos")
			item.is_stock_item = 0 if non_stock else 1
			item.is_sales_item = 1
			item.standard_rate = flt(row.selling_rate)
			item.valuation_rate = flt(row.valuation_rate)
			if row.barcode:
				item.barcode = row.barcode
			item.insert(ignore_permissions=True)

		if flt(row.selling_rate):
			_upsert_selling_price(item_code, flt(row.selling_rate), company)

		qty = flt(row.opening_qty)
		if qty > 0 and item.is_stock_item and warehouse:
			_opening_stock(item_code, warehouse, qty, flt(row.valuation_rate), company)

		row.item_code = item_code
		created.append(item_code)
	return created


def _upsert_selling_price(item_code, rate, company):
	currency = frappe.get_cached_value("Company", company, "default_currency")
	pl = frappe.db.get_value("Price List", {"selling": 1, "currency": currency, "enabled": 1}, "name")
	if not pl:
		return
	name = frappe.db.get_value(
		"Item Price", {"item_code": item_code, "price_list": pl, "selling": 1}, "name"
	)
	if name:
		frappe.db.set_value("Item Price", name, "price_list_rate", rate)
	else:
		doc = frappe.new_doc("Item Price")
		doc.item_code = item_code
		doc.price_list = pl
		doc.price_list_rate = rate
		doc.insert(ignore_permissions=True)


def _opening_stock(item_code, warehouse, qty, rate, company):
	from erpnext.stock.doctype.stock_entry.stock_entry_utils import make_stock_entry

	make_stock_entry(
		item_code=item_code,
		qty=qty,
		rate=rate or frappe.db.get_value("Item", item_code, "valuation_rate") or 0,
		target=warehouse,
		company=company,
	)


def configure_pos_profile(company, warehouse, session):
	profile_name = create_umkm_pos_profile(company, warehouse)
	profile = frappe.get_doc("POS Profile", profile_name)
	profile.payments = []

	default_set = False
	for row in session.payments:
		if not cint(row.enabled):
			continue
		is_default = cint(row.is_default) and not default_set
		if is_default:
			default_set = True
		profile.append(
			"payments",
			{"mode_of_payment": row.mode_of_payment, "default": 1 if is_default else 0},
		)

	if not profile.payments:
		cash = frappe.db.get_value("Mode of Payment", {"name": "Cash"}, "name")
		if cash:
			profile.append("payments", {"mode_of_payment": cash, "default": 1})

	profile.warehouse = warehouse
	profile.save(ignore_permissions=True)
	return profile.name


def ensure_shift_type(session, company):
	if not (session.opening_time and session.closing_time):
		return None
	name = f"Shift {company}"
	if frappe.db.exists("Shift Type", name):
		return name
	doc = frappe.new_doc("Shift Type")
	doc.name = name
	doc.start_time = session.opening_time
	doc.end_time = session.closing_time
	doc.insert(ignore_permissions=True)
	return doc.name


def ensure_sales_target(session, company):
	"""Persist monthly target on IMOGI POS Settings (Sales Target DocType optional)."""
	if not flt(session.target_monthly_sales):
		return None

	if frappe.db.exists("DocType", "Sales Target"):
		from frappe.utils import get_first_day

		start = getdate(get_first_day(today()))
		name = frappe.db.get_value(
			"Sales Target",
			{"company": company, "target_date": start},
			"name",
		)
		if name:
			doc = frappe.get_doc("Sales Target", name)
			doc.target_amount = flt(session.target_monthly_sales)
			doc.save(ignore_permissions=True)
			return doc.name

		doc = frappe.new_doc("Sales Target")
		doc.company = company
		doc.target_date = start
		doc.target_amount = flt(session.target_monthly_sales)
		doc.insert(ignore_permissions=True)
		return doc.name

	return f"target:{flt(session.target_monthly_sales)}"


def apply_imogi_settings(session, company, warehouse, pos_profile):
	flow = get_flow_profile(session.business_type)
	template = get_business_template(session.business_type)

	from imogi_pos.imogi_pos.utils.feature_registry import normalize_tier

	settings = frappe.get_single("IMOGI POS Settings")
	if getattr(session, "subscription_tier", None):
		settings.subscription_tier = normalize_tier(session.subscription_tier)
	settings.default_company = company
	settings.default_warehouse = warehouse
	settings.default_pos_profile = pos_profile
	settings.business_type = flow
	settings.business_template = session.business_type
	settings.enable_pos_shift = cint(template.get("enable_pos_shift"))
	from imogi_pos.imogi_pos.utils.settings_flow import append_kitchen_item_groups_from_text

	settings.enable_kitchen_display = cint(template.get("enable_kitchen"))
	settings.enable_fulfillment = cint(template.get("enable_fulfillment"))
	append_kitchen_item_groups_from_text(settings, template.get("kitchen_item_groups") or "")
	settings.owner_whatsapp = session.owner_whatsapp
	settings.store_city = session.store_city
	settings.multi_branch = cint(session.multi_branch)
	settings.target_monthly_sales = flt(session.target_monthly_sales)
	settings.default_opening_time = session.opening_time
	settings.default_closing_time = session.closing_time
	settings.payment_gateway = session.payment_gateway
	if session.payment_gateway_key:
		settings.payment_gateway_key = session.payment_gateway_key
	settings.printer_setup_status = session.printer_option
	settings.setup_complete = 1
	settings.flags.ignore_mandatory = True
	settings.save(ignore_permissions=True)
	sync_workspaces(settings.business_type)

	from imogi_pos.imogi_pos.utils.branch import ensure_default_branch

	ensure_default_branch(settings)
	return settings


def ensure_import_context():
	"""Provision company/warehouse for imports during setup wizard (before step 9)."""
	settings = frappe.get_single("IMOGI POS Settings")
	if settings.default_company and settings.default_warehouse:
		return settings

	if settings.setup_complete:
		return settings

	from imogi_pos.imogi_pos.utils.setup_wizard.session import get_draft_session

	session = get_draft_session()
	if (session.store_name or "").strip() and session.business_type:
		company = ensure_company(session)
		warehouse = ensure_warehouse(company, session)
		apply_business_master_data(company, session.business_type)

		settings = frappe.get_single("IMOGI POS Settings")
		settings.default_company = company
		settings.default_warehouse = warehouse
		settings.flags.ignore_mandatory = True
		settings.save(ignore_permissions=True)

		session.company = company
		session.warehouse = warehouse
		session.save(ignore_permissions=True)
		frappe.db.commit()
		return settings

	company = frappe.db.get_single_value("Global Defaults", "default_company")
	if company and frappe.db.exists("Company", company):
		warehouse = frappe.db.get_value(
			"Warehouse",
			{"company": company, "is_group": 0},
			"name",
			order_by="creation asc",
		)
		settings = frappe.get_single("IMOGI POS Settings")
		settings.default_company = company
		if warehouse:
			settings.default_warehouse = warehouse
		settings.flags.ignore_mandatory = True
		settings.save(ignore_permissions=True)
		frappe.db.commit()

	return frappe.get_single("IMOGI POS Settings")


def complete_wizard(session_name):
	session = frappe.get_doc("IMOGI POS Setup Session", session_name)
	if session.status == "Completed":
		frappe.throw(_("Setup session sudah selesai"))

	summary_lines = []

	company = ensure_company(session)
	session.company = company
	summary_lines.extend(apply_business_master_data(company, session.business_type))

	warehouse = ensure_warehouse(company, session)
	session.warehouse = warehouse

	cashiers = create_cashier_users(session)
	if cashiers:
		summary_lines.append(f"Users: {', '.join(cashiers)}")

	suppliers = create_suppliers(session)
	if suppliers:
		summary_lines.append(f"Suppliers: {', '.join(suppliers)}")

	products = create_products(session, company, warehouse)
	if products:
		summary_lines.append(f"Items: {len(products)}")

	pos_profile = configure_pos_profile(company, warehouse, session)
	session.pos_profile = pos_profile

	shift = ensure_shift_type(session, company)
	if shift:
		summary_lines.append(f"Shift Type: {shift}")

	target = ensure_sales_target(session, company)
	if target:
		summary_lines.append(f"Sales Target: {target}")

	settings = apply_imogi_settings(session, company, warehouse, pos_profile)

	session.status = "Completed"
	session.completed_on = now_datetime()
	session.completed_by = frappe.session.user
	session.auto_created_summary = "\n".join(summary_lines + [f"✓ {x}" for x in AUTO_CREATED_CHECKLIST])
	session.save(ignore_permissions=True)
	frappe.db.commit()

	route = get_workspace_route(settings.business_type)
	return {
		"setup_complete": True,
		"company": company,
		"warehouse": warehouse,
		"pos_profile": pos_profile,
		"redirect": f"/app/{route}",
		"summary": session.auto_created_summary,
	}


def list_payment_methods():
	return frappe.get_all(
		"Mode of Payment",
		filters={"enabled": 1},
		fields=["name", "type"],
		order_by="name asc",
	)
