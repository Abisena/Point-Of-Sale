# Copyright (c) 2026, Imogi and contributors
"""Ensure default Kitchen/Bar stations exist and backfill kitchen order routing."""

from imogi_pos.imogi_pos.utils.central_kitchen import (
	backfill_kitchen_order_stations,
	ensure_default_kitchen_stations,
)
from imogi_pos.imogi_pos.utils.flow import get_settings


def execute():
	settings = get_settings()
	company = settings.default_company
	if not company:
		return
	ensure_default_kitchen_stations(company)
	backfill_kitchen_order_stations(company)
