# Copyright (c) 2026, Imogi and contributors
"""Dedicated API module for menu (Product + BOM) import."""

import frappe
from frappe import _
from frappe.utils import cint

from imogi_pos.imogi_pos.utils.flow import settings_for_company
from imogi_pos.imogi_pos.utils.menu_import_helpers import (
	load_menu_rows_from_file,
	require_import_access,
	run_menu_import,
)
from imogi_pos.imogi_pos.utils.stock_import_helpers import try_import_stock_from_file


def _merge_stats(menu_stats, stock_stats):
	merged = dict(menu_stats)
	for key, value in (stock_stats or {}).items():
		if key == "errors":
			merged.setdefault("errors", [])
			merged["errors"] = (merged.get("errors") or []) + (value or [])
		else:
			merged[key] = value
	merged["errors"] = (merged.get("errors") or [])[:20]
	return merged


@frappe.whitelist()
def get_menu_import_template():
	require_import_access()
	return {
		"import_type": "menu",
		"headers": [
			"Produk / Product / Name",
			"Temperatur / Temperature",
			"Ukuran",
			"Warna",
			"Komponen / Raw Material / Materials",
			"Qty",
			"UOM",
			"Harga",
			"Kategori",
			"Harga Jual",
		],
		"stock_headers": ["Komponen", "Qty", "UOM", "Harga"],
		"formats": ["xlsx", "xls", "csv"],
		"notes": [
			_("Sheet Menu: baris produk jadi, lalu baris bahan BOM di bawahnya"),
			_("Kolom Temperatur, Ukuran, Warna (opsional) untuk variant"),
			_("(Hot)/(Ice) → Temperatur; (Reguler)/(Jumbo)/(Float) → Ukuran — atau isi kolom langsung"),
			_("Excel BOM lama 4 kolom (tanpa header) tetap bisa diimport langsung"),
			_("Produk dengan variant dibuat sebagai template + item variant + BOM per variant"),
			_("Sheet Stok Awal (opsional): stok bahan baku + harga satuan (valuation + Item Price Buying)"),
			_("Kategori Service otomatis dilewati"),
			_("Harga BOM = biaya total baris; rate satuan = Harga / Qty"),
		],
	}


@frappe.whitelist()
def import_menu_from_file(file_url=None, update_existing=1, import_stock=1, company=None):
	"""Import finished products + BOM; optionally stock from sheet Stok Awal."""
	require_import_access()
	if not file_url:
		frappe.throw(_("Upload file Excel atau CSV"))

	from imogi_pos.imogi_pos.utils.import_helpers import ensure_import_settings

	settings = settings_for_company(company, ensure_import_settings())
	rows = load_menu_rows_from_file(file_url=file_url)
	stats = run_menu_import(rows, settings, update_existing=cint(update_existing))

	if cint(import_stock):
		stock_stats = try_import_stock_from_file(
			file_url,
			settings,
			update_rate=cint(update_existing),
		)
		stats = _merge_stats(stats, stock_stats)

	frappe.db.commit()
	stats["errors"] = stats.get("errors", [])[:20]
	stats["company"] = settings.default_company
	stats["warehouse"] = settings.default_warehouse
	return stats
