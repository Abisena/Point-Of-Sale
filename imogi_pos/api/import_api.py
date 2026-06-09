# Copyright (c) 2026, Imogi and contributors

import csv
import io
from collections import defaultdict

import frappe
from frappe import _
from frappe.utils import cint
from frappe.utils.xlsxutils import read_xls_file_from_attached_file, read_xlsx_file_from_attached_file

from imogi_pos.imogi_pos.utils.import_helpers import ensure_import_settings
from imogi_pos.imogi_pos.utils.import_helpers import (
	resolve_item_code,
	slug_item_code,
	upsert_bom_for_product,
	upsert_item_from_import,
)
from imogi_pos.imogi_pos.utils.menu_import_helpers import load_menu_rows_from_file


def _require_import_access():
	if frappe.session.user == "Guest":
		frappe.throw(_("Login required"), frappe.AuthenticationError)
	if not frappe.has_permission("Item", "create"):
		frappe.throw(_("Not permitted to import products"), frappe.PermissionError)


def _normalize_row(row):
	out = {}
	for k, v in row.items():
		key = str(k or "").strip().lower()
		if v is None:
			out[key] = ""
		elif isinstance(v, str):
			out[key] = v.strip()
		elif isinstance(v, float) and v == int(v):
			out[key] = str(int(v))
		else:
			out[key] = str(v).strip()
	return out


def _get_file_doc(file_url):
	file_name = frappe.db.get_value("File", {"file_url": file_url}, "name")
	if not file_name:
		frappe.throw(_("Uploaded file not found"))
	return frappe.get_doc("File", file_name)


def _file_extension(file_doc):
	name = (file_doc.file_name or file_doc.file_url or "").lower()
	if name.endswith(".xlsx"):
		return "xlsx"
	if name.endswith(".xls"):
		return "xls"
	return "csv"


def _cell_to_text(value):
	if value is None:
		return ""
	if isinstance(value, float) and value == int(value):
		return str(int(value))
	return str(value).strip()


def _sheet_rows_to_dicts(rows):
	if not rows:
		frappe.throw(_("File tidak memiliki data"))

	headers = [str(h or "").strip() for h in rows[0]]
	if not any(headers):
		frappe.throw(_("File tidak memiliki baris header"))

	out = []
	for row_idx, row in enumerate(rows[1:], start=2):
		if not any(v not in (None, "") for v in row):
			continue
		record = {"_row": row_idx}
		for i, header in enumerate(headers):
			if not header:
				continue
			value = row[i] if i < len(row) else None
			record[header] = _cell_to_text(value)
		out.append(record)
	return out


def _load_csv_rows(csv_text):
	if not csv_text:
		frappe.throw(_("Upload file CSV/Excel atau tempel teks CSV"))

	reader = csv.DictReader(io.StringIO(csv_text))
	if not reader.fieldnames:
		frappe.throw(_("File tidak memiliki baris header"))

	rows = []
	for idx, raw in enumerate(reader, start=2):
		row = dict(raw)
		row["_row"] = idx
		rows.append(row)
	return rows


def _load_rows_from_file(csv_text=None, file_url=None):
	if file_url and not csv_text:
		file_doc = _get_file_doc(file_url)
		ext = _file_extension(file_doc)
		content = file_doc.get_content()

		if ext == "xlsx":
			return _sheet_rows_to_dicts(read_xlsx_file_from_attached_file(fcontent=content))
		if ext == "xls":
			return _sheet_rows_to_dicts(read_xls_file_from_attached_file(content))

		if isinstance(content, bytes):
			csv_text = content.decode("utf-8-sig")
		else:
			csv_text = content or ""

	return _load_csv_rows(csv_text)


def _load_menu_rows_from_file(csv_text=None, file_url=None):
	return load_menu_rows_from_file(file_url=file_url, csv_text=csv_text)


def _map_product_row(raw):
	row = _normalize_row(raw)
	item_code = row.get("item_code") or row.get("code")
	item_name = row.get("item_name") or row.get("name") or row.get("produk") or row.get("product")
	if not item_code and item_name:
		item_code = slug_item_code(item_name)
	row["item_code"] = item_code
	row["item_name"] = item_name or item_code
	return row


@frappe.whitelist()
def import_products_from_csv(csv_text=None, file_url=None, update_existing=0):
	"""Import or update products from CSV.

	Supported columns:
	- produk / product / item_name
	- kategori / category (Food, Beverage, Dessert, Service)
	- add_on / add_ons (comma-separated)
	- item_code (optional, auto from produk)
	- standard_rate, stock_uom, reorder_level, reorder_qty, item_group
	"""
	_require_import_access()
	settings = ensure_import_settings()
	rows = _load_rows_from_file(csv_text, file_url)

	created = updated = skipped = 0
	errors = []

	for raw in rows:
		row = _map_product_row(raw)
		if not row.get("item_code"):
			skipped += 1
			continue

		try:
			action, item_code = upsert_item_from_import(row, settings, update_existing=cint(update_existing))
			if action == "created":
				created += 1
			elif action == "updated":
				updated += 1
			else:
				skipped += 1
		except Exception as exc:
			errors.append({"row": raw.get("_row"), "item_code": row.get("item_code"), "error": str(exc)})

	frappe.db.commit()
	return {
		"created": created,
		"updated": updated,
		"skipped": skipped,
		"errors": errors[:20],
		"warehouse": settings.default_warehouse,
	}


@frappe.whitelist()
def import_bom_from_csv(csv_text=None, file_url=None, update_existing=1):
	"""Import BOM lines grouped by finished product.

	Supported columns:
	- product / produk / item_code (finished product)
	- bom_product / komponen / component
	- qty / quantity
	- uom / satuan
	- double (optional: value 'double' = qty x2)
	"""
	_require_import_access()
	settings = ensure_import_settings()
	rows = _load_rows_from_file(csv_text, file_url)
	grouped = defaultdict(list)

	for raw in rows:
		row = _normalize_row(raw)
		product = row.get("product") or row.get("produk") or row.get("item_code") or row.get("item_name")
		component = row.get("bom_product") or row.get("komponen") or row.get("component")
		if not product or not component:
			continue
		row["_row"] = raw.get("_row")
		grouped[product].append(row)

	if not grouped:
		frappe.throw(_("File tidak memiliki baris BOM yang valid"))

	created = updated = skipped = 0
	errors = []

	for product_ref, lines in grouped.items():
		product_code = resolve_item_code(product_ref) or slug_item_code(product_ref)
		if not frappe.db.exists("Item", product_code):
			errors.append(
				{
					"row": lines[0].get("_row"),
					"item_code": product_ref,
					"error": _("Produk {0} belum ada. Import produk terlebih dahulu.").format(product_ref),
				}
			)
			skipped += len(lines)
			continue

		try:
			existing = frappe.db.exists("BOM", {"item": product_code, "is_active": 1})
			if existing and not cint(update_existing):
				skipped += len(lines)
				continue

			bom_name, status = upsert_bom_for_product(product_code, lines, settings.default_company)
			if not bom_name:
				skipped += len(lines)
				continue
			if existing:
				updated += 1
			else:
				created += 1
		except Exception as exc:
			errors.append({"row": lines[0].get("_row"), "item_code": product_ref, "error": str(exc)})

	frappe.db.commit()
	return {
		"created": created,
		"updated": updated,
		"skipped": skipped,
		"errors": errors[:20],
		"company": settings.default_company,
	}


@frappe.whitelist()
def import_menu_from_file(file_url=None, update_existing=1):
	"""Backward-compatible alias — delegates to menu_import_api."""
	from imogi_pos.api.menu_import_api import import_menu_from_file as _import_menu

	return _import_menu(file_url=file_url, update_existing=update_existing)


@frappe.whitelist()
def get_import_template(import_type="product"):
	"""Return column info for product or BOM import dialogs."""
	_require_import_access()
	kind = (import_type or "product").strip().lower()
	if kind in ("menu", "full", "product_bom", "product+bom"):
		from imogi_pos.api.menu_import_api import get_menu_import_template

		return get_menu_import_template()
	if kind in ("bom", "bill_of_materials"):
		return {
			"import_type": "bom",
			"headers": ["product", "bom_product", "qty", "uom", "double"],
			"sample": "Sirup Ice,ABC SIRUP SQUASH DELIGHT GRAPE,14,ML,tidak",
			"formats": ["csv", "xlsx", "xls"],
		}
	return {
		"import_type": "product",
		"headers": ["no", "produk", "kategori", "add_on", "standard_rate", "stock_uom"],
		"sample": '1,Chicken Sandwich,Food,"Extra Chicken, Cheese, Fried Egg",25000,Nos',
		"categories": ["Food", "Beverage", "Dessert", "Service"],
		"formats": ["csv", "xlsx", "xls"],
	}


@frappe.whitelist()
def get_bom_import_template():
	"""Backward-compatible alias — uses the same handler as get_import_template."""
	return get_import_template("bom")
