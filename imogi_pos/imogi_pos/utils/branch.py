# Copyright (c) 2026, Imogi and contributors

import re

import frappe
from frappe import _
from frappe.utils import cint, flt

from imogi_pos.imogi_pos.utils.flow import get_settings
from imogi_pos.imogi_pos.utils.pos_profile import validate_pos_profile

BRANCH_USER_DEFAULT_KEY = "imogi_pos_branch"


def slug_branch_code(value):
	text = (value or "").strip()
	code = re.sub(r"[^\w\s-]", "", text, flags=re.UNICODE)
	code = re.sub(r"[\s_]+", "-", code.strip()).upper()
	return (code[:140] if code else "MAIN")


def serialize_branch(row):
	if not row:
		return None
	if hasattr(row, "get"):
		data = row
	else:
		data = frappe._dict(row)
	return {
		"name": data.name,
		"branch_code": data.branch_code,
		"branch_name": data.branch_name,
		"company": data.company,
		"warehouse": data.warehouse,
		"pos_profile": data.pos_profile,
		"city": data.get("city"),
		"target_monthly_sales": flt(data.get("target_monthly_sales")),
		"is_default": cint(data.get("is_default")),
		"selling_price_list": data.get("selling_price_list"),
		"use_custom_menu": cint(data.get("use_custom_menu")),
		"erpnext_branch": data.get("erpnext_branch"),
	}


def _branch_fields():
	return [
		"name",
		"branch_code",
		"branch_name",
		"company",
		"warehouse",
		"pos_profile",
		"city",
		"target_monthly_sales",
		"is_default",
		"sort_order",
		"selling_price_list",
		"use_custom_menu",
		"erpnext_branch",
	]


def _user_can_access_all_branches(user=None):
	user = user or frappe.session.user
	if user == "Administrator":
		return True
	roles = set(frappe.get_roles(user))
	return bool(roles.intersection({"System Manager", "Sales Manager", "Administrator"}))


def _allowed_pos_profiles(user=None):
	user = user or frappe.session.user
	return frappe.get_all(
		"User Permission",
		filters={"user": user, "allow": "POS Profile", "apply_to_all_doctypes": 1},
		pluck="for_value",
	) or frappe.get_all(
		"User Permission",
		filters={"user": user, "allow": "POS Profile"},
		pluck="for_value",
	)


def _allowed_companies(user=None):
	user = user or frappe.session.user
	return frappe.get_all(
		"User Permission",
		filters={"user": user, "allow": "Company", "apply_to_all_doctypes": 1},
		pluck="for_value",
	) or frappe.get_all(
		"User Permission",
		filters={"user": user, "allow": "Company"},
		pluck="for_value",
	)


def ensure_user_permission(user, allow, for_value, apply_to_all_doctypes=1):
	"""Create User Permission if missing."""
	if not user or not for_value:
		return None

	existing = frappe.db.get_value(
		"User Permission",
		{"user": user, "allow": allow, "for_value": for_value},
		"name",
	)
	if existing:
		return existing

	doc = frappe.new_doc("User Permission")
	doc.user = user
	doc.allow = allow
	doc.for_value = for_value
	doc.apply_to_all_doctypes = cint(apply_to_all_doctypes)
	doc.insert(ignore_permissions=True)
	frappe.cache.hdel("bootinfo", user)
	return doc.name


def grant_branch_access(user, branch_code=None, branch=None, pos_profile=None, company=None):
	"""Grant Company + POS Profile User Permissions for a branch."""
	branch = branch or get_branch(branch_code=branch_code)
	if not branch:
		frappe.throw(_("Cabang tidak ditemukan"))

	company = company or branch["company"]
	pos_profile = pos_profile or branch["pos_profile"]
	if not company or not pos_profile:
		frappe.throw(_("Cabang harus punya Company dan POS Profile"))

	perms = {
		"company": ensure_user_permission(user, "Company", company),
		"pos_profile": ensure_user_permission(user, "POS Profile", pos_profile),
	}
	if "IMOGI Cashier" not in frappe.get_roles(user):
		frappe.get_doc("User", user).add_roles("IMOGI Cashier")

	frappe.cache.hdel("bootinfo", user)
	return {
		"user": user,
		"branch_code": branch["branch_code"],
		"branch_name": branch["branch_name"],
		"company": company,
		"pos_profile": pos_profile,
		"permissions": perms,
	}


def list_branch_cashiers(branch_code):
	"""Users with POS Profile permission matching this branch."""
	branch = get_branch(branch_code=branch_code)
	if not branch:
		return []

	pos_profile = branch["pos_profile"]
	users = frappe.get_all(
		"User Permission",
		filters={"allow": "POS Profile", "for_value": pos_profile},
		fields=["user"],
	)
	result = []
	for row in users:
		if "IMOGI Cashier" in frappe.get_roles(row.user):
			result.append(
				{
					"user": row.user,
					"full_name": frappe.db.get_value("User", row.user, "full_name"),
					"has_company_perm": bool(
						frappe.db.exists(
							"User Permission",
							{"user": row.user, "allow": "Company", "for_value": branch["company"]},
						)
					),
				}
			)
	return result


def get_accessible_branches(user=None, company=None, include_inactive=0, all_companies=0):
	user = user or frappe.session.user
	settings = get_settings()

	filters = {}
	if not cint(include_inactive):
		filters["is_active"] = 1

	allowed_profiles = _allowed_pos_profiles(user)
	manager = _user_can_access_all_branches(user)

	if manager:
		if company:
			filters["company"] = company
	elif allowed_profiles:
		filters["pos_profile"] = ["in", allowed_profiles]
		if company:
			filters["company"] = company
	else:
		# Cashier without explicit POS Profile grants: default company only.
		default_co = frappe.defaults.get_user_default("Company") or settings.default_company
		if default_co:
			filters["company"] = default_co

	rows = frappe.get_all(
		"IMOGI Branch",
		filters=filters,
		fields=_branch_fields(),
		order_by="sort_order asc, branch_name asc",
	)
	return [serialize_branch(row) for row in rows]


def get_user_default_branch_code(user=None):
	user = user or frappe.session.user
	return frappe.defaults.get_user_default(BRANCH_USER_DEFAULT_KEY, user=user)


def set_user_default_branch_code(branch_code, user=None):
	user = user or frappe.session.user
	if branch_code:
		frappe.defaults.set_user_default(BRANCH_USER_DEFAULT_KEY, branch_code, user)
	else:
		frappe.defaults.clear_user_default(BRANCH_USER_DEFAULT_KEY, user)


def get_branch(branch_code=None, name=None):
	if name and frappe.db.exists("IMOGI Branch", name):
		return serialize_branch(frappe.get_doc("IMOGI Branch", name).as_dict())

	code = (branch_code or "").strip()
	if code and frappe.db.exists("IMOGI Branch", code):
		return serialize_branch(frappe.get_doc("IMOGI Branch", code).as_dict())

	if code:
		found = frappe.db.get_value("IMOGI Branch", {"branch_code": code}, "name")
		if found:
			return serialize_branch(frappe.get_doc("IMOGI Branch", found).as_dict())

	return None


def ensure_default_branch(settings=None):
	"""Create a default branch from IMOGI POS Settings when none exists."""
	settings = settings or get_settings()
	if not settings.default_company or not settings.default_pos_profile:
		return None

	existing = frappe.db.get_value(
		"IMOGI Branch",
		{"company": settings.default_company, "is_default": 1},
		"name",
	)
	if existing:
		return existing

	any_branch = frappe.db.get_value("IMOGI Branch", {"company": settings.default_company}, "name")
	if any_branch:
		return any_branch

	warehouse = settings.default_warehouse or frappe.db.get_value(
		"POS Profile", settings.default_pos_profile, "warehouse"
	)
	profile = frappe.get_cached_doc("POS Profile", settings.default_pos_profile)
	branch_name = profile.name or "Cabang Utama"
	code = slug_branch_code(branch_name)

	if frappe.db.exists("IMOGI Branch", code):
		code = slug_branch_code(f"{branch_name}-MAIN")

	doc = frappe.get_doc(
		{
			"doctype": "IMOGI Branch",
			"branch_code": code,
			"branch_name": branch_name,
			"company": settings.default_company,
			"warehouse": warehouse,
			"pos_profile": settings.default_pos_profile,
			"city": settings.store_city,
			"target_monthly_sales": flt(settings.target_monthly_sales),
			"is_active": 1,
			"is_default": 1,
		}
	)
	doc.insert(ignore_permissions=True)
	return doc.name


def resolve_active_branch(branch_code=None, pos_profile=None, user=None, strict=False):
	"""Pick branch + POS context for the current cashier session.

	When *strict* is False (default bootstrap), a stale branch from localStorage or user
	default that the cashier can no longer access falls back to the first allowed branch.
	When *strict* is True (explicit branch switch), missing access raises PermissionError.
	"""
	user = user or frappe.session.user
	settings = get_settings()
	ensure_default_branch(settings)

	branch = None
	if branch_code:
		branch = get_branch(branch_code=branch_code)
	if not branch:
		default_code = get_user_default_branch_code(user)
		if default_code:
			branch = get_branch(branch_code=default_code)

	accessible = get_accessible_branches(user=user)
	accessible_map = {row["branch_code"]: row for row in accessible}
	stale_branch_code = None
	if branch and branch["branch_code"] not in accessible_map:
		if strict:
			frappe.throw(
				_("Anda tidak punya akses ke cabang {0}").format(branch["branch_name"]),
				frappe.PermissionError,
			)
		stale_branch_code = branch["branch_code"]
		branch = None

	if not branch and accessible:
		defaults = [row for row in accessible if cint(row.get("is_default"))]
		branch = defaults[0] if defaults else accessible[0]
		if stale_branch_code:
			set_user_default_branch_code(branch["branch_code"], user)

	if not branch:
		# Legacy single-store fallback before branch records exist
		check = validate_pos_profile(
			settings.default_company,
			pos_profile or settings.default_pos_profile,
			settings.default_warehouse,
		)
		if not check["valid"]:
			frappe.throw("<br>".join(check["errors"]))
		return {
			"branch_code": "",
			"branch_name": settings.default_company,
			"company": settings.default_company,
			"pos_profile": pos_profile or settings.default_pos_profile,
			"warehouse": check["details"].get("warehouse"),
			"currency": check["details"].get("currency"),
			"target_monthly_sales": flt(settings.target_monthly_sales),
			"is_legacy": 1,
		}

	if pos_profile and pos_profile != branch["pos_profile"]:
		allowed = {row["pos_profile"] for row in accessible}
		if pos_profile in allowed:
			match = next((row for row in accessible if row["pos_profile"] == pos_profile), None)
			if match:
				branch = match

	check = validate_pos_profile(branch["company"], branch["pos_profile"], branch["warehouse"])
	if not check["valid"]:
		frappe.throw("<br>".join(check["errors"]))

	from imogi_pos.imogi_pos.utils.branch_pricing import get_branch_selling_price_list

	selling_price_list = get_branch_selling_price_list(branch=branch)
	target = flt(branch.get("target_monthly_sales"))
	if not target:
		target = flt(settings.target_monthly_sales)

	return {
		"branch_code": branch["branch_code"],
		"branch_name": branch["branch_name"],
		"name": branch.get("name"),
		"company": branch["company"],
		"pos_profile": branch["pos_profile"],
		"warehouse": check["details"].get("warehouse") or branch["warehouse"],
		"currency": check["details"].get("currency"),
		"selling_price_list": selling_price_list,
		"use_custom_menu": cint(branch.get("use_custom_menu")),
		"erpnext_branch": branch.get("erpnext_branch"),
		"target_monthly_sales": target,
		"city": branch.get("city"),
		"is_legacy": 0,
	}


def assert_branch_access(branch_code=None, pos_profile=None, user=None):
	ctx = resolve_active_branch(branch_code=branch_code, pos_profile=pos_profile, user=user)
	return ctx


def get_active_branch_warehouses(user=None, company=None):
	"""Warehouses for all accessible active branches."""
	branches = get_accessible_branches(user=user, company=company)
	return [row["warehouse"] for row in branches if row.get("warehouse")]


def get_branch_sales_breakdown(day_start, day_end, company=None, user=None):
	"""Daily sales totals per accessible branch (for consolidated dashboard).

	Assumption: totals are summed in each branch's company currency without FX conversion.
	Safe when all companies share one currency (e.g. IDR). Rows include ``currency``; if
	mixed currencies are detected, ``_mixed_currency`` is set on the return metadata via
	dashboard API (see ``get_branch_sales_breakdown_with_meta``).
	"""
	return get_branch_sales_breakdown_with_meta(day_start, day_end, company=company, user=user)["rows"]


def get_branch_sales_breakdown_with_meta(day_start, day_end, company=None, user=None):
	user = user or frappe.session.user
	branches = get_accessible_branches(user=user, company=company)
	if not branches:
		return {"rows": [], "mixed_currency": False, "currency": None}

	rows = []
	currencies = set()
	for branch in branches:
		pos_profile = branch["pos_profile"]
		currency = frappe.db.get_value("Company", branch["company"], "default_currency") or "IDR"
		currencies.add(currency)
		stats = frappe.db.sql(
			"""
			select
				count(*) as orders_today,
				coalesce(sum(case when status = 'Completed' then 1 else 0 end), 0) as completed_today,
				coalesce(sum(case when status = 'Completed' then grand_total else 0 end), 0) as sales_today
			from `tabRiwayat Order`
			where docstatus < 2
				and pos_profile = %s
				and creation >= %s and creation < %s
			""",
			(pos_profile, day_start, day_end),
			as_dict=True,
		)[0]

		sales = flt(stats.sales_today)
		completed = cint(stats.completed_today)
		target = flt(branch.get("target_monthly_sales"))
		progress_pct = 0
		if target:
			from imogi_pos.imogi_pos.utils.sales_target import get_monthly_actual_sales, get_month_bounds

			month_start, month_end = get_month_bounds(day_start)
			monthly_actual = get_monthly_actual_sales(
				branch["company"], month_start, month_end, pos_profile=pos_profile
			)
			progress_pct = min(100, round((monthly_actual / target) * 100, 1))

		rows.append(
			{
				"branch_code": branch["branch_code"],
				"branch_name": branch["branch_name"],
				"company": branch["company"],
				"city": branch.get("city"),
				"warehouse": branch.get("warehouse"),
				"pos_profile": pos_profile,
				"currency": currency,
				"orders_today": cint(stats.orders_today),
				"completed_today": completed,
				"sales_today": sales,
				"avg_ticket": flt(sales / completed) if completed else 0,
				"target_monthly_sales": target,
				"target_progress_pct": progress_pct,
			}
		)

	rows.sort(key=lambda row: (-row["sales_today"], row["branch_name"] or ""))
	mixed = len(currencies) > 1
	return {
		"rows": rows,
		"mixed_currency": mixed,
		"currency": next(iter(currencies)) if len(currencies) == 1 else None,
	}
