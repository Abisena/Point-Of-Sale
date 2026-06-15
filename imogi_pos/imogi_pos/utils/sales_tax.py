# Copyright (c) 2026, Imogi and contributors
"""Sales tax (PPN) helpers for IMOGI POS checkout."""

from frappe.utils import cint, flt

from imogi_pos.imogi_pos.utils.flow import get_settings

DEFAULT_SALES_TAX_RATE = 11.0


def get_sales_tax_config(settings=None) -> dict:
	settings = settings or get_settings()
	rate = flt(getattr(settings, "sales_tax_rate", None)) or DEFAULT_SALES_TAX_RATE
	raw_enabled = getattr(settings, "enable_sales_tax", None)
	enabled = 1 if raw_enabled is None else cint(raw_enabled)
	raw_inclusive = getattr(settings, "prices_include_tax", None)
	prices_include_tax = 1 if raw_inclusive is None else cint(raw_inclusive)
	return {
		"enabled": enabled,
		"rate": rate,
		"prices_include_tax": prices_include_tax,
	}


def compute_sales_tax(net_amount, settings=None) -> dict:
	"""Compute DPP + PPN from net amount after discounts."""
	net_amount = max(0, flt(net_amount))
	config = get_sales_tax_config(settings)
	if not config["enabled"] or net_amount <= 0:
		return {
			"taxable_amount": net_amount,
			"tax_amount": 0,
			"tax_rate": config["rate"],
			"grand_total": net_amount,
			"prices_include_tax": config["prices_include_tax"],
		}

	rate = flt(config["rate"])
	if config["prices_include_tax"]:
		tax_amount = net_amount * rate / (100 + rate)
		taxable_amount = net_amount - tax_amount
		grand_total = net_amount
	else:
		taxable_amount = net_amount
		tax_amount = taxable_amount * rate / 100
		grand_total = taxable_amount + tax_amount

	return {
		"taxable_amount": flt(taxable_amount),
		"tax_amount": flt(tax_amount),
		"tax_rate": rate,
		"grand_total": flt(grand_total),
		"prices_include_tax": config["prices_include_tax"],
	}
