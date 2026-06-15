# Copyright (c) 2026, Imogi and contributors
"""Branch-aware stock import and inter-branch material transfer."""

import json

import frappe
from frappe import _
from frappe.utils import cint, flt

from imogi_pos.imogi_pos.utils.branch import get_accessible_branches, get_branch, resolve_active_branch
from imogi_pos.imogi_pos.utils.import_helpers import ensure_import_settings
from imogi_pos.imogi_pos.utils.menu_import_helpers import require_import_access
from imogi_pos.imogi_pos.utils.stock_import_helpers import (
	load_stock_rows_from_file,
	run_stock_import,
)

_BRANCH_STOCK_TRANSFER_ROLES = frozenset(
	{
		"Administrator",
		"System Manager",
		"Sales Manager",
		"IMOGI Owner",
		"IMOGI Area Manager",
		"IMOGI Inventory",
		"IMOGI Manager",
	}
)


def require_branch_stock_transfer_access():
	"""Transfer antar cabang — butuh Stock Entry, bukan import produk baru."""
	if frappe.session.user == "Guest":
		frappe.throw(_("Login required"), frappe.AuthenticationError)

	roles = set(frappe.get_roles())
	if roles & _BRANCH_STOCK_TRANSFER_ROLES:
		return
	if frappe.has_permission("Stock Entry", "create"):
		return

	frappe.throw(_("Not permitted to transfer stock"), frappe.PermissionError)


def build_stock_import_template():
	branches = get_accessible_branches()
	return {
		"import_type": "stock",
		"headers": ["Komponen", "Qty", "UOM", "Harga"],
		"formats": ["xlsx", "xls", "csv"],
		"branches": branches,
		"notes": [
			_("Import stok awal bahan baku ke gudang cabang yang dipilih"),
			_("Komponen = nama/code item bahan (sama seperti di BOM)"),
			_("Harga = rate satuan: valuation_rate + Item Price (Buying) di Buying Price List"),
			_("Excel: gunakan sheet 'Stok Awal' atau file CSV terpisah"),
		],
	}


def run_import_stock_from_file(file_url, update_rate=1, warehouse=None, branch_code=None, company=None):
	require_import_access()
	if not file_url:
		frappe.throw(_("Upload file Excel atau CSV"))

	from imogi_pos.imogi_pos.utils.import_helpers import ensure_import_settings
	from imogi_pos.imogi_pos.utils.flow import settings_for_company

	settings = settings_for_company(company, ensure_import_settings())
	if branch_code:
		branch = get_branch(branch_code=branch_code)
		if not branch:
			frappe.throw(_("Cabang tidak ditemukan"))
		warehouse = branch.get("warehouse")
	elif warehouse:
		warehouse = warehouse.strip()
	else:
		warehouse = settings.default_warehouse

	rows = load_stock_rows_from_file(file_url=file_url)
	stats = run_stock_import(rows, settings, update_rate=cint(update_rate), warehouse=warehouse)
	frappe.db.commit()
	stats["errors"] = stats.get("errors", [])[:20]
	stats["warehouse"] = warehouse
	stats["company"] = settings.default_company
	if branch_code:
		stats["branch_code"] = branch_code
	return stats


def build_branch_transfer_context(from_branch_code=None, to_branch_code=None):
	require_branch_stock_transfer_access()
	return {
		"branches": get_accessible_branches(),
		"from_branch": from_branch_code,
		"to_branch": to_branch_code,
	}


def run_branch_stock_transfer(from_branch_code, to_branch_code, items):
	require_branch_stock_transfer_access()
	if not from_branch_code or not to_branch_code:
		frappe.throw(_("Pilih cabang asal dan tujuan"))
	if from_branch_code == to_branch_code:
		frappe.throw(_("Cabang asal dan tujuan harus berbeda"))

	from_branch = resolve_active_branch(branch_code=from_branch_code)
	to_branch = resolve_active_branch(branch_code=to_branch_code)
	from_wh = from_branch.get("warehouse")
	to_wh = to_branch.get("warehouse")
	company = from_branch.get("company") or to_branch.get("company")

	if not from_wh or not to_wh:
		frappe.throw(_("Warehouse cabang belum di-set"))
	if from_wh == to_wh:
		frappe.throw(
			_("Gudang cabang asal dan tujuan sama ({0}). Set warehouse berbeda per cabang, atau pilih cabang lain.").format(
				from_wh
			)
		)
	if frappe.db.get_value("Warehouse", from_wh, "company") != frappe.db.get_value("Warehouse", to_wh, "company"):
		frappe.throw(_("Transfer antar cabang harus dalam Company yang sama"))

	parsed = json.loads(items) if isinstance(items, str) else items
	if not parsed:
		frappe.throw(_("Tambahkan minimal satu item"))

	se = frappe.new_doc("Stock Entry")
	se.stock_entry_type = "Material Transfer"
	se.purpose = "Material Transfer"
	se.company = company
	se.from_warehouse = from_wh
	se.to_warehouse = to_wh

	for row in parsed:
		item_code = (row.get("item_code") or "").strip()
		qty = flt(row.get("qty"))
		if not item_code or qty <= 0:
			continue
		if not frappe.db.exists("Item", item_code):
			frappe.throw(_("Item {0} tidak ditemukan").format(item_code))
		se.append(
			"items",
			{
				"item_code": item_code,
				"qty": qty,
				"s_warehouse": from_wh,
				"t_warehouse": to_wh,
				"uom": row.get("uom") or frappe.db.get_value("Item", item_code, "stock_uom"),
			},
		)

	if not se.items:
		frappe.throw(_("Tidak ada baris transfer yang valid"))

	se.insert(ignore_permissions=True)
	se.submit()
	frappe.db.commit()

	return {
		"stock_entry": se.name,
		"from_warehouse": from_wh,
		"to_warehouse": to_wh,
		"from_branch": from_branch.get("branch_name"),
		"to_branch": to_branch.get("branch_name"),
		"item_count": len(se.items),
	}
