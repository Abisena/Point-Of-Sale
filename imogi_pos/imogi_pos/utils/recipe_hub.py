# Copyright (c) 2026, Imogi and contributors
"""Chef-facing recipe hub: BOM recipes, food cost, portion, substitutes, versions."""

from __future__ import annotations

import json

import frappe
from frappe import _
from frappe.utils import cint, flt

from imogi_pos.imogi_pos.utils.flow import get_settings
from imogi_pos.imogi_pos.utils.planned_features import get_food_cost_report
from imogi_pos.imogi_pos.utils.role_gating import get_user_matrix_roles, user_bypasses_role_gating

# Operational kitchen personas — recipe ops yes, financial cost no.
_COST_HIDDEN_MATRIX_ROLES = frozenset({"Chef", "Kitchen Staff", "Barista"})
_COST_VIEW_MATRIX_ROLES = frozenset(
	{
		"Owner",
		"Manager",
		"Finance",
		"Area Manager",
		"Supervisor",
		"Inventory",
		"Purchasing",
		"Auditor",
		"Super Admin",
	}
)
_COST_ROW_KEYS = (
	"raw_material_cost",
	"total_cost",
	"operating_cost",
	"cost_per_portion",
	"rate",
	"amount",
	"amount_per_portion",
)
_COST_REPORT_KEYS = ("sales", "food_cost", "margin", "food_cost_percent", "cogs", "revenue")


def _company() -> str | None:
	return get_settings().default_company


def can_view_recipe_cost(user: str | None = None) -> bool:
	"""Chef / Kitchen Staff cannot see cost figures; managers/owners can."""
	user = user or frappe.session.user
	if not user or user == "Guest":
		return False
	if user_bypasses_role_gating(user):
		return True
	matrix = get_user_matrix_roles(user)
	if matrix & _COST_VIEW_MATRIX_ROLES:
		return True
	if matrix & _COST_HIDDEN_MATRIX_ROLES:
		return False
	# Fallback: Frappe roles when matrix mapping is empty.
	roles = set(frappe.get_roles(user))
	if roles & {
		"Administrator",
		"System Manager",
		"Sales Manager",
		"Accounts Manager",
		"Accounts User",
		"IMOGI Owner",
		"IMOGI Manager",
		"IMOGI Finance",
		"IMOGI Area Manager",
		"IMOGI Supervisor",
		"IMOGI Inventory",
		"IMOGI Purchasing",
		"IMOGI Auditor",
	}:
		return True
	if roles & {"IMOGI Chef", "IMOGI Kitchen Staff"}:
		return False
	return True


def _strip_cost_value(value):
	if isinstance(value, dict):
		return _strip_cost_dict(value)
	if isinstance(value, list):
		return [_strip_cost_value(v) for v in value]
	return value


def _strip_cost_dict(data: dict) -> dict:
	out = {}
	for key, value in data.items():
		if key in _COST_ROW_KEYS or key in _COST_REPORT_KEYS or key == "avg_cost_per_portion":
			continue
		out[key] = _strip_cost_value(value)
	return out


def _with_cost_policy(payload: dict) -> dict:
	allowed = can_view_recipe_cost()
	data = payload if allowed else _strip_cost_dict(payload)
	data["can_view_cost"] = allowed
	return data


def list_recipes(search: str | None = None, only_default: int = 0, limit: int = 200) -> dict:
	"""List BOM recipes with portion yield and food cost."""
	filters: dict = {"docstatus": ["<", 2]}
	company = _company()
	if company:
		filters["company"] = company
	if cint(only_default):
		filters["is_default"] = 1

	or_filters = None
	if search:
		term = f"%{search.strip()}%"
		or_filters = [
			["item", "like", term],
			["item_name", "like", term],
			["name", "like", term],
		]

	boms = frappe.get_all(
		"BOM",
		filters=filters,
		or_filters=or_filters,
		fields=[
			"name",
			"item",
			"item_name",
			"quantity",
			"uom",
			"is_active",
			"is_default",
			"docstatus",
			"raw_material_cost",
			"total_cost",
			"operating_cost",
			"modified",
		],
		order_by="modified desc",
		limit_page_length=cint(limit) or 200,
	)

	names = [row.name for row in boms]
	ingredient_counts: dict[str, int] = {}
	if names:
		for row in frappe.db.sql(
			"""
			select parent, count(*) as cnt
			from `tabBOM Item`
			where parent in %(names)s
			group by parent
			""",
			{"names": names},
			as_dict=True,
		):
			ingredient_counts[row.parent] = cint(row.cnt)

	rows = []
	for bom in boms:
		qty = flt(bom.quantity) or 1
		raw = flt(bom.raw_material_cost)
		total = flt(bom.total_cost) or raw
		rows.append(
			{
				"name": bom.name,
				"item": bom.item,
				"item_name": bom.item_name or bom.item,
				"portion_qty": qty,
				"uom": bom.uom,
				"is_active": cint(bom.is_active),
				"is_default": cint(bom.is_default),
				"docstatus": cint(bom.docstatus),
				"status_label": _bom_status_label(bom),
				"ingredient_count": ingredient_counts.get(bom.name, 0),
				"raw_material_cost": raw,
				"total_cost": total,
				"cost_per_portion": total / qty if qty else total,
				"modified": str(bom.modified) if bom.modified else None,
			}
		)

	return _with_cost_policy(
		{
			"rows": rows,
			"summary": {
				"recipes": len(rows),
				"default_recipes": sum(1 for r in rows if r["is_default"]),
				"submitted": sum(1 for r in rows if r["docstatus"] == 1),
				"draft": sum(1 for r in rows if r["docstatus"] == 0),
				"avg_cost_per_portion": (
					sum(r["cost_per_portion"] for r in rows) / len(rows) if rows else 0
				),
			},
		}
	)


def get_recipe_detail(bom_name: str) -> dict:
	"""Single recipe with ingredients normalized per portion."""
	if not bom_name:
		frappe.throw(_("BOM wajib diisi"))
	bom = frappe.get_doc("BOM", bom_name)
	portion = flt(bom.quantity) or 1
	ingredients = []
	for row in bom.items:
		qty = flt(row.qty)
		ingredients.append(
			{
				"item_code": row.item_code,
				"item_name": row.item_name or row.item_code,
				"qty": qty,
				"qty_per_portion": qty / portion if portion else qty,
				"uom": row.uom,
				"rate": flt(row.rate),
				"amount": flt(row.amount),
				"amount_per_portion": flt(row.amount) / portion if portion else flt(row.amount),
				"allow_alternative_item": cint(getattr(row, "allow_alternative_item", 0)),
			}
		)

	return _with_cost_policy(
		{
			"name": bom.name,
			"item": bom.item,
			"item_name": bom.item_name or bom.item,
			"portion_qty": portion,
			"uom": bom.uom,
			"is_default": cint(bom.is_default),
			"is_active": cint(bom.is_active),
			"docstatus": cint(bom.docstatus),
			"allow_alternative_item": cint(getattr(bom, "allow_alternative_item", 0)),
			"raw_material_cost": flt(bom.raw_material_cost),
			"total_cost": flt(bom.total_cost) or flt(bom.raw_material_cost),
			"cost_per_portion": (flt(bom.total_cost) or flt(bom.raw_material_cost)) / portion,
			"ingredients": ingredients,
		}
	)


def update_recipe_portion(bom_name: str, portion_qty: float) -> dict:
	"""Update BOM yield (portion) on draft recipes only."""
	if not bom_name:
		frappe.throw(_("BOM wajib diisi"))
	portion_qty = flt(portion_qty)
	if portion_qty <= 0:
		frappe.throw(_("Porsi harus lebih dari 0"))

	bom = frappe.get_doc("BOM", bom_name)
	if cint(bom.docstatus) != 0:
		frappe.throw(
			_("Resep sudah disubmit. Batalkan dulu atau buat versi baru untuk ubah porsi.")
		)
	if not frappe.has_permission("BOM", "write"):
		frappe.throw(_("Tidak punya akses ubah resep"), frappe.PermissionError)

	bom.quantity = portion_qty
	bom.save()
	return get_recipe_detail(bom.name)


def submit_recipes(bom_names) -> dict:
	"""Submit one or many draft BOM recipes."""
	if isinstance(bom_names, str):
		try:
			bom_names = json.loads(bom_names)
		except Exception:
			bom_names = [b.strip() for b in bom_names.split(",") if b.strip()]
	bom_names = [str(n).strip() for n in (bom_names or []) if str(n).strip()]
	if not bom_names:
		frappe.throw(_("Pilih minimal satu resep draft"))
	if not frappe.has_permission("BOM", "submit"):
		frappe.throw(_("Tidak punya akses submit resep"), frappe.PermissionError)

	submitted = []
	errors = []
	skipped = []
	for name in bom_names:
		if not frappe.db.exists("BOM", name):
			errors.append({"bom": name, "error": _("BOM tidak ditemukan")})
			continue
		doc = frappe.get_doc("BOM", name)
		if cint(doc.docstatus) == 1:
			skipped.append(name)
			continue
		if cint(doc.docstatus) != 0:
			errors.append({"bom": name, "error": _("Status tidak bisa di-submit")})
			continue
		try:
			doc.submit()
			submitted.append(name)
		except Exception as e:
			errors.append({"bom": name, "error": str(e)[:240]})

	return {
		"submitted": submitted,
		"skipped": skipped,
		"errors": errors,
		"count": len(submitted),
	}


def get_recipe_food_cost(date_from=None, date_to=None) -> dict:
	"""Period food-cost report + per-recipe cost snapshot."""
	if not can_view_recipe_cost():
		frappe.throw(_("Tidak punya akses melihat food cost"), frappe.PermissionError)
	report = get_food_cost_report(date_from=date_from, date_to=date_to)
	recipes = list_recipes(only_default=1, limit=100)
	return _with_cost_policy(
		{
			**report,
			"recipes": recipes["rows"],
			"recipe_summary": recipes["summary"],
		}
	)


def list_ingredient_substitutes(search: str | None = None, limit: int = 200) -> dict:
	"""List Item Alternative rows used as ingredient substitutes."""
	filters = {}
	or_filters = None
	if search:
		term = f"%{search.strip()}%"
		or_filters = [
			["item_code", "like", term],
			["alternative_item_code", "like", term],
		]

	rows = frappe.get_all(
		"Item Alternative",
		filters=filters,
		or_filters=or_filters,
		fields=["name", "item_code", "alternative_item_code", "two_way"],
		order_by="modified desc",
		limit_page_length=cint(limit) or 200,
	)

	item_codes = set()
	for row in rows:
		item_codes.add(row.item_code)
		item_codes.add(row.alternative_item_code)
	names = {}
	if item_codes:
		for item in frappe.get_all(
			"Item",
			filters={"name": ["in", list(item_codes)]},
			fields=["name", "item_name", "stock_uom"],
		):
			names[item.name] = item

	# Which BOM ingredients use these items
	used_in: dict[str, list[str]] = {}
	if item_codes:
		for link in frappe.db.sql(
			"""
			select bi.item_code, b.item_name, b.name as bom
			from `tabBOM Item` bi
			inner join `tabBOM` b on b.name = bi.parent
			where bi.item_code in %(codes)s
				and b.docstatus < 2
				and b.is_active = 1
			""",
			{"codes": list(item_codes)},
			as_dict=True,
		):
			used_in.setdefault(link.item_code, [])
			label = f"{link.item_name or link.bom}"
			if label not in used_in[link.item_code]:
				used_in[link.item_code].append(label)

	out = []
	for row in rows:
		src = names.get(row.item_code) or {}
		alt = names.get(row.alternative_item_code) or {}
		out.append(
			{
				"name": row.name,
				"item_code": row.item_code,
				"item_name": src.get("item_name") or row.item_code,
				"alternative_item_code": row.alternative_item_code,
				"alternative_item_name": alt.get("item_name") or row.alternative_item_code,
				"two_way": cint(row.two_way),
				"used_in_recipes": used_in.get(row.item_code, [])[:5],
			}
		)

	return {"rows": out, "count": len(out)}


def upsert_ingredient_substitute(
	item_code: str,
	alternative_item_code: str,
	two_way: int = 1,
) -> dict:
	"""Create or update Item Alternative for ingredient substitution."""
	if not item_code or not alternative_item_code:
		frappe.throw(_("Bahan utama dan pengganti wajib diisi"))
	if item_code == alternative_item_code:
		frappe.throw(_("Bahan pengganti harus berbeda"))
	if not frappe.has_permission("Item Alternative", "write"):
		# Fall back: allow BOM writers to manage substitutes
		if not frappe.has_permission("BOM", "write"):
			frappe.throw(_("Tidak punya akses kelola substitusi"), frappe.PermissionError)

	# ERPNext's Item Alternative hard-requires "Allow Alternative Item" checked
	# on the source item (and on both items for two-way) — off by default for
	# every item, and nothing in the Recipe Hub UI exposes that toggle. Calling
	# this function is an unambiguous request to allow a substitute, so enable
	# it here instead of leaving the caller to hit a raw ERPNext error.
	if not frappe.db.get_value("Item", item_code, "allow_alternative_item"):
		frappe.db.set_value("Item", item_code, "allow_alternative_item", 1)
	if cint(two_way) and not frappe.db.get_value("Item", alternative_item_code, "allow_alternative_item"):
		frappe.db.set_value("Item", alternative_item_code, "allow_alternative_item", 1)

	existing = frappe.db.get_value(
		"Item Alternative",
		{"item_code": item_code, "alternative_item_code": alternative_item_code},
		"name",
	)
	if existing:
		doc = frappe.get_doc("Item Alternative", existing)
		doc.two_way = cint(two_way)
		doc.save(ignore_permissions=True)
	else:
		doc = frappe.get_doc(
			{
				"doctype": "Item Alternative",
				"item_code": item_code,
				"alternative_item_code": alternative_item_code,
				"two_way": cint(two_way),
			}
		)
		doc.insert(ignore_permissions=True)

	return {"name": doc.name, "ok": True}


def delete_ingredient_substitute(name: str) -> dict:
	if not name:
		frappe.throw(_("Dokumen substitusi wajib diisi"))
	if not frappe.has_permission("Item Alternative", "delete"):
		if not frappe.has_permission("BOM", "write"):
			frappe.throw(_("Tidak punya akses hapus substitusi"), frappe.PermissionError)
	frappe.delete_doc("Item Alternative", name, ignore_permissions=True)
	return {"ok": True}


def get_ingredient_alternatives(item_code: str) -> dict:
	"""Alternatives for one ingredient via Item Alternative (two-way aware)."""
	if not item_code:
		frappe.throw(_("Item wajib diisi"))

	alts = set()
	for row in frappe.get_all(
		"Item Alternative",
		filters={"item_code": item_code},
		fields=["alternative_item_code", "two_way", "name"],
	):
		alts.add(row.alternative_item_code)
	for row in frappe.get_all(
		"Item Alternative",
		filters={"alternative_item_code": item_code, "two_way": 1},
		fields=["item_code", "name"],
	):
		alts.add(row.item_code)

	rows = []
	if alts:
		for item in frappe.get_all(
			"Item",
			filters={"name": ["in", list(alts)], "disabled": 0},
			fields=["name", "item_name", "stock_uom", "item_group"],
		):
			rows.append(
				{
					"item_code": item.name,
					"item_name": item.item_name,
					"stock_uom": item.stock_uom,
					"item_group": item.item_group,
				}
			)
	return {"item_code": item_code, "alternatives": rows}


def get_recipe_versions(bom_name: str | None = None, limit: int = 50) -> dict:
	"""BOM-scoped Version history for recipe versioning."""
	filters: dict = {"ref_doctype": "BOM"}
	if bom_name:
		filters["docname"] = bom_name
	else:
		# Prefer company BOMs only
		company = _company()
		bom_names = frappe.get_all(
			"BOM",
			filters={"company": company} if company else {},
			pluck="name",
			limit_page_length=500,
		)
		if not bom_names:
			return {"rows": [], "count": 0}
		filters["docname"] = ["in", bom_names]

	versions = frappe.get_all(
		"Version",
		filters=filters,
		fields=["name", "docname", "creation", "owner", "data"],
		order_by="creation desc",
		limit_page_length=cint(limit) or 50,
	)

	bom_labels = {}
	docnames = list({v.docname for v in versions})
	if docnames:
		for bom in frappe.get_all(
			"BOM",
			filters={"name": ["in", docnames]},
			fields=["name", "item_name", "item"],
		):
			bom_labels[bom.name] = bom.item_name or bom.item or bom.name

	rows = []
	for ver in versions:
		changed = _summarize_version_data(ver.data)
		rows.append(
			{
				"name": ver.name,
				"bom": ver.docname,
				"recipe_label": bom_labels.get(ver.docname) or ver.docname,
				"creation": str(ver.creation) if ver.creation else None,
				"owner": ver.owner,
				"changed_fields": changed,
				"summary": ", ".join(changed[:6]) if changed else _("Perubahan tersimpan"),
			}
		)

	return {"rows": rows, "count": len(rows)}


def get_recipe_hub(tab: str | None = None, search: str | None = None, bom: str | None = None) -> dict:
	"""Bundle payload for the Chef recipe hub page."""
	tab = (tab or "recipes").strip().lower()
	payload = {
		"tab": tab,
		"recipes": list_recipes(search=search),
		"food_cost": None,
		"substitutes": None,
		"versions": None,
		"detail": None,
	}
	if tab in ("food_cost", "costing", "all"):
		payload["food_cost"] = get_recipe_food_cost()
	if tab in ("substitutes", "substitution", "all"):
		payload["substitutes"] = list_ingredient_substitutes(search=search)
	if tab in ("versions", "versioning", "all"):
		payload["versions"] = get_recipe_versions(bom_name=bom)
	if bom:
		payload["detail"] = get_recipe_detail(bom)
	return payload


def _bom_status_label(bom) -> str:
	if cint(bom.docstatus) == 1:
		return _("Submitted")
	if cint(bom.docstatus) == 0:
		return _("Draft")
	return _("Cancelled")


def _summarize_version_data(data) -> list[str]:
	if not data:
		return []
	try:
		payload = json.loads(data) if isinstance(data, str) else data
	except Exception:
		return []
	changed = []
	for row in payload.get("changed") or []:
		if isinstance(row, (list, tuple)) and row:
			changed.append(str(row[0]))
		elif isinstance(row, str):
			changed.append(row)
	for row in payload.get("added") or []:
		if isinstance(row, (list, tuple)) and row:
			changed.append(_("+ {0}").format(row[0]))
	for row in payload.get("removed") or []:
		if isinstance(row, (list, tuple)) and row:
			changed.append(_("- {0}").format(row[0]))
	return changed
