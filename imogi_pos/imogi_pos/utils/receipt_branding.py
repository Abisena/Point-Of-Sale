# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe.utils import cint

DEFAULT_WHATSAPP_RECEIPT_MESSAGE = (
	"Terima kasih atas kunjungan Anda!\n\n"
	"Struk pesanan *{order_name}*\n"
	"Total: {total}\n\n"
	"Unduh struk PDF:\n{pdf_url}"
)


def get_receipt_logo_url(settings=None):
	"""Public URL for receipt logo file attached in IMOGI POS Settings."""
	if settings is None:
		settings = frappe.get_single("IMOGI POS Settings")
	logo = (getattr(settings, "receipt_logo", None) or "").strip()
	if not logo:
		return ""
	return frappe.utils.get_url(logo)


def get_whatsapp_receipt_config(settings=None):
	"""Receipt WhatsApp / auto-print settings (safe before migrate)."""
	if settings is None:
		settings = frappe.get_single("IMOGI POS Settings")
	return {
		"auto_print_receipt_on_success": cint(getattr(settings, "auto_print_receipt_on_success", 0)),
		"enable_whatsapp_receipt": cint(getattr(settings, "enable_whatsapp_receipt", 0)),
		"whatsapp_receipt_message": (
			getattr(settings, "whatsapp_receipt_message", None) or DEFAULT_WHATSAPP_RECEIPT_MESSAGE
		),
		"whatsapp_api_provider": (getattr(settings, "whatsapp_api_provider", None) or "").strip(),
		"fonnte_api_token": (
			settings.get_password("fonnte_api_token", raise_exception=False) or ""
		).strip(),
	}


def html_to_receipt_pdf(html):
	"""HTML → PDF bytes; prefers wkhtmltopdf, falls back to WeasyPrint."""
	from frappe.utils.pdf import get_pdf, is_wkhtmltopdf_valid

	if is_wkhtmltopdf_valid():
		try:
			return get_pdf(html)
		except OSError:
			pass

	try:
		from weasyprint import HTML

		return HTML(string=html, base_url=frappe.utils.get_url()).write_pdf()
	except Exception as exc:
		frappe.log_error(title="Receipt PDF generation failed", message=frappe.get_traceback())
		frappe.throw(
			_("Gagal membuat PDF struk: {0}").format(str(exc)),
			title=_("PDF Error"),
		)


def generate_receipt_pdf_bytes(order_name, print_format=None):
	"""Render Riwayat Order receipt to PDF (cashier-safe, no Settings permission needed)."""
	from imogi_pos.imogi_pos.utils.flow import get_settings

	settings = get_settings()
	print_format = print_format or settings.receipt_print_format or "IMOGI POS Receipt"

	previous_ignore = frappe.flags.get("ignore_permissions")
	frappe.flags.ignore_permissions = True
	try:
		html = frappe.get_print("Riwayat Order", order_name, print_format, no_letterhead=1)
	finally:
		frappe.flags.ignore_permissions = previous_ignore

	return html_to_receipt_pdf(html)
