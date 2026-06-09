# Copyright (c) 2026, Imogi and contributors

import unittest

from imogi_pos.imogi_pos.utils.menu_variant_import import (
	partition_blocks,
	resolve_product_variant,
	variant_attrs_from_row,
)


class TestMenuVariantImport(unittest.TestCase):
	def test_paren_fallback_maps_to_temperatur(self):
		base, attrs = resolve_product_variant("AMERICANO DIRNO COFFEE (Hot)", {})
		self.assertEqual(base, "AMERICANO DIRNO COFFEE")
		self.assertEqual(attrs, {"Temperatur": "Hot"})

	def test_paren_maps_reguler_to_ukuran(self):
		base, attrs = resolve_product_variant("NEW MILO SAURUS (Reguler)", {})
		self.assertEqual(base, "NEW MILO SAURUS")
		self.assertEqual(attrs, {"Ukuran": "Reguler"})

	def test_paren_maps_float_to_ukuran(self):
		base, attrs = resolve_product_variant("NEW ICE SUGUS MANGO (Float)", {})
		self.assertEqual(attrs, {"Ukuran": "Float"})

	def test_explicit_columns_override_paren(self):
		row = {"temperatur": "Ice", "ukuran": "Large"}
		base, attrs = resolve_product_variant("LATTE (Hot)", row)
		self.assertEqual(base, "LATTE")
		self.assertEqual(attrs, {"Temperatur": "Ice", "Ukuran": "Large"})

	def test_multi_attribute_columns(self):
		row = {"temperatur": "Hot", "ukuran": "Regular", "warna": "Merah"}
		attrs = variant_attrs_from_row(row)
		self.assertEqual(attrs, {"Temperatur": "Hot", "Ukuran": "Regular", "Warna": "Merah"})

	def test_no_variant_is_standalone(self):
		base, attrs = resolve_product_variant("AMERICANO DECAFF", {})
		self.assertEqual(base, "AMERICANO DECAFF")
		self.assertEqual(attrs, {})

	def test_partition_blocks(self):
		blocks = [
			{"product_name": "DECAFF", "variant_attributes": {}},
			{
				"product_name": "LATTE (Hot)",
				"base_name": "LATTE",
				"variant_attributes": {"Temperatur": "Hot"},
			},
			{
				"product_name": "LATTE (Ice)",
				"base_name": "LATTE",
				"variant_attributes": {"Temperatur": "Ice"},
			},
		]
		standalone, groups = partition_blocks(blocks)
		self.assertEqual(len(standalone), 1)
		self.assertEqual(list(groups.keys()), ["LATTE"])
		self.assertEqual(len(groups["LATTE"]), 2)


class TestMenuImportParsing(unittest.TestCase):
	def test_fill_forward_merged_product_cells(self):
		from imogi_pos.imogi_pos.utils.menu_import_helpers import _fill_forward_menu_rows, _normalize_menu_row

		rows = [
			_normalize_menu_row(
				{
					"product": "AMERICANO DECAFF",
					"raw material": "Kopi",
					"qty": "18",
					"uom": "GRAM",
					"harga": "160",
				}
			),
			_normalize_menu_row({"raw material": "Air", "qty": "200", "uom": "ML", "harga": "3.42"}),
		]
		out = _fill_forward_menu_rows(rows)
		self.assertEqual(out[1].get("product"), "AMERICANO DECAFF")

	def test_fill_forward_clears_variants_on_new_product(self):
		from imogi_pos.imogi_pos.utils.menu_import_helpers import _fill_forward_menu_rows, _normalize_menu_row

		rows = [
			_normalize_menu_row(
				{
					"product": "AMERICANO DIRNO COFFEE (Hot)",
					"temperature": "Hot",
					"raw material": "Kopi",
					"qty": "18",
					"uom": "GRAM",
					"harga": "160",
				}
			),
			_normalize_menu_row({"raw material": "Air", "qty": "200", "uom": "ML", "harga": "3.42"}),
			_normalize_menu_row(
				{
					"product": "AMERICANO DIRNO COFFEE DECAFF",
					"raw material": "Decaff",
					"qty": "18",
					"uom": "GRAM",
					"harga": "160",
				}
			),
		]
		out = _fill_forward_menu_rows(rows)
		self.assertEqual(out[2].get("temperatur") or out[2].get("temperature"), None)

	def test_flat_format_groups_by_variant_columns(self):
		from imogi_pos.imogi_pos.utils.menu_import_helpers import parse_menu_blocks

		rows = [
			{
				"product": "LATTE",
				"temperature": "Hot",
				"raw material": "Susu",
				"qty": "70",
				"uom": "ML",
				"harga": "15",
			},
			{
				"product": "LATTE",
				"temperature": "Ice",
				"raw material": "Susu",
				"qty": "70",
				"uom": "ML",
				"harga": "15",
			},
		]
		blocks = parse_menu_blocks(rows)
		self.assertEqual(len(blocks), 2)


class TestLegacyBomConversion(unittest.TestCase):
	def test_convert_legacy_block(self):
		from imogi_pos.imogi_pos.utils.menu_import_helpers import convert_legacy_bom_rows

		raw = [
			["LATTE DIRNO COFFEE (Hot)", "PREMIUM HOUSEBLEND", "18.00 GRAM", "167.92"],
			["", "AMIDIS GALON", "200.00 ML", "3.42"],
		]
		rows = convert_legacy_bom_rows(raw)
		self.assertEqual(rows[0]["Produk"], "LATTE DIRNO COFFEE")
		self.assertEqual(rows[0]["Temperatur"], "Hot")
		self.assertEqual(rows[1]["Komponen"], "PREMIUM HOUSEBLEND")
		self.assertEqual(rows[2]["Komponen"], "AMIDIS GALON")
		self.assertEqual(rows[2]["Qty"], "200.00")
		self.assertEqual(rows[2]["UOM"], "ML")


if __name__ == "__main__":
	unittest.main()
