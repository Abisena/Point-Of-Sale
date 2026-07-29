# Copyright (c) 2026, Imogi and contributors

from contextlib import contextmanager

import frappe
from frappe.utils import cint

DEFAULT_WHATSAPP_RECEIPT_MESSAGE = (
	"Terima kasih atas kunjungan Anda!\n\n"
	"Struk pesanan *{order_name}*\n"
	"Total: {total}\n\n"
	"Unduh struk PDF:\n{pdf_url}"
)


def build_public_site_url(path):
	"""Absolute URL for guest links — never append :8003 on HTTPS tunnel hosts."""
	path = (path or "").strip()
	if not path:
		return ""
	if path.startswith(("http://", "https://")):
		return path
	if not path.startswith("/"):
		path = f"/{path}"

	host_name = (frappe.conf.host_name or frappe.conf.hostname or "").strip().rstrip("/")
	if host_name:
		if not host_name.startswith(("http://", "https://")):
			host_name = f"https://{host_name}"
		if host_name.startswith("https://"):
			return f"{host_name}{path}"
	return frappe.utils.get_url(path)


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


@contextmanager
def _privileged_print_user():
	"""Render receipts as order API user (webhook/guest flows lack print permission)."""
	from imogi_pos.imogi_pos.utils.flow import get_settings

	settings = get_settings()
	api_user = (getattr(settings, "order_api_user", None) or "Administrator").strip()
	previous_user = frappe.session.user
	had_ignore = hasattr(frappe.flags, "ignore_permissions")
	previous_ignore = getattr(frappe.flags, "ignore_permissions", False)
	if api_user:
		frappe.set_user(api_user)
	frappe.flags.ignore_permissions = True
	try:
		yield
	finally:
		if had_ignore:
			frappe.flags.ignore_permissions = previous_ignore
		elif hasattr(frappe.flags, "ignore_permissions"):
			delattr(frappe.flags, "ignore_permissions")
		if api_user and api_user != previous_user:
			frappe.set_user(previous_user)


def html_to_receipt_pdf(html):
	"""HTML → PDF bytes; prefer WeasyPrint (wkhtmltopdf can hang on WSL)."""
	try:
		from weasyprint import HTML

		return HTML(string=html, base_url=build_public_site_url("/")).write_pdf()
	except Exception:
		pass

	from frappe.utils.pdf import get_pdf, is_wkhtmltopdf_valid

	if is_wkhtmltopdf_valid():
		try:
			return get_pdf(html)
		except OSError:
			pass

	frappe.log_error(title="Receipt PDF generation failed", message=frappe.get_traceback())
	frappe.throw(_("Gagal membuat PDF struk."), title=_("PDF Error"))


def generate_receipt_pdf_bytes(order_name, print_format=None):
	"""Render Riwayat Order receipt to PDF (cashier-safe, no Settings permission needed)."""
	from imogi_pos.imogi_pos.utils.flow import get_settings

	settings = get_settings()
	print_format = print_format or settings.receipt_print_format or "IMOGI POS Receipt"

	with _privileged_print_user():
		html = frappe.get_print("Riwayat Order", order_name, print_format, no_letterhead=1)

	return html_to_receipt_pdf(html)


def _remove_receipt_pdf_from_disk(order_name: str):
	"""Remove stale receipt PDFs so Frappe does not append a content-hash suffix."""
	from pathlib import Path

	files_dir = Path(frappe.get_site_path("public", "files"))
	if not files_dir.is_dir():
		return
	for path in files_dir.glob(f"{order_name}*.pdf"):
		try:
			path.unlink()
		except OSError:
			pass


def publish_receipt_pdf_file(order_name, pdf_bytes, filename=None):
	"""Save receipt PDF as public File and return absolute URL for Fonnte attachment."""
	filename = (filename or f"{order_name}.pdf").strip()
	if not filename.lower().endswith(".pdf"):
		filename = f"{filename}.pdf"

	existing = frappe.get_all(
		"File",
		filters={
			"attached_to_doctype": "Riwayat Order",
			"attached_to_name": order_name,
		},
		pluck="name",
	)
	for file_name in existing:
		frappe.delete_doc("File", file_name, ignore_permissions=True, force=True)
	_remove_receipt_pdf_from_disk(order_name)

	file_doc = frappe.get_doc(
		{
			"doctype": "File",
			"file_name": filename,
			"attached_to_doctype": "Riwayat Order",
			"attached_to_name": order_name,
			"is_private": 0,
			"content": pdf_bytes,
		}
	)
	file_doc.save(ignore_permissions=True)
	return build_public_site_url(file_doc.file_url)


def publish_receipt_pdf_job(order_name):
	"""Background: render receipt PDF to /files/ for guest download links."""
	try:
		ensure_receipt_pdf_published(order_name)
	except Exception:
		frappe.log_error(
			title=_("IMOGI publish receipt PDF failed for {0}").format(order_name),
			message=frappe.get_traceback(),
		)


def ensure_receipt_pdf_published(order_name, print_format=None):
	"""Generate receipt PDF once and return a public /files/ URL (guest-safe)."""
	from imogi_pos.imogi_pos.utils.flow import get_settings

	settings = get_settings()
	print_format = print_format or settings.receipt_print_format or "IMOGI POS Receipt"
	filename = f"{order_name}.pdf"

	for row in frappe.get_all(
		"File",
		filters={
			"attached_to_doctype": "Riwayat Order",
			"attached_to_name": order_name,
		},
		fields=["file_url", "file_name"],
		order_by="creation desc",
	):
		if (row.file_name or "").lower().endswith(".pdf") and row.file_url:
			return build_public_site_url(row.file_url)

	pdf_bytes = generate_receipt_pdf_bytes(order_name, print_format)
	return publish_receipt_pdf_file(order_name, pdf_bytes, filename)
