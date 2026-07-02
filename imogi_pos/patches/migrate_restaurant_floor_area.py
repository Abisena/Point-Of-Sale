"""Migrate legacy table zones to IMOGI Restaurant Floor & Area."""

import frappe

from imogi_pos.imogi_pos.utils.floor_area import ensure_area, ensure_default_floor, guess_area_type
from imogi_pos.imogi_pos.utils.flow import get_settings


def execute():
	settings = get_settings()
	company = settings.default_company

	tables = frappe.get_all(
		"IMOGI Restaurant Table",
		filters={"company": company} if company else {},
		fields=["name", "location", "restaurant_area", "restaurant_floor", "company"],
	)
	if not tables:
		default_floor = ensure_default_floor(company)
		ensure_area(default_floor, "Indoor", area_type="Indoor", company=company)
		ensure_area(default_floor, "Outdoor", area_type="Outdoor", company=company)
		_migrate_settings_background(default_floor)
		frappe.db.commit()
		return

	companies = {t.company or company for t in tables}
	for comp in companies:
		default_floor = ensure_default_floor(comp)
		locations = set()
		for table in tables:
			if (table.company or company) != comp:
				continue
			if table.restaurant_area:
				continue
			label = (table.location or "").strip() or "Indoor"
			locations.add(label)

		if not locations:
			locations = {"Indoor"}

		area_map = {}
		for label in sorted(locations):
			area_map[label] = ensure_area(
				default_floor,
				label,
				area_type=guess_area_type(label),
				company=comp,
			)

		for table in tables:
			if (table.company or company) != comp:
				continue
			if table.restaurant_area:
				continue
			label = (table.location or "").strip() or "Indoor"
			area_name = area_map[label]
			frappe.db.set_value(
				"IMOGI Restaurant Table",
				table.name,
				{
					"restaurant_area": area_name,
					"restaurant_floor": default_floor,
					"location": label,
				},
				update_modified=False,
			)

		_migrate_settings_background(default_floor)

	frappe.db.commit()


def _migrate_settings_background(default_floor):
	bg = frappe.db.get_value("IMOGI POS Settings", "IMOGI POS Settings", "table_floor_background")
	if not bg:
		return
	current = frappe.db.get_value("IMOGI Restaurant Floor", default_floor, "floor_background")
	if not current:
		frappe.db.set_value("IMOGI Restaurant Floor", default_floor, "floor_background", bg)
