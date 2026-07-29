# Copyright (c) 2026, Imogi and contributors
"""Guest receipt download for WhatsApp PDF links (no login required)."""

import hashlib
import hmac
import secrets

import frappe
from frappe import _
from frappe.utils import quote

from imogi_pos.imogi_pos.utils.receipt_branding import build_public_site_url


def _signing_secret() -> bytes:
	raw = (
		frappe.local.conf.get("encryption_key")
		or frappe.get_site_config().get("secret")
		or "imogi-qr-table-order"
	)
	return str(raw).encode()


def sign_receipt_token(order_name: str) -> str:
	order_name = (order_name or "").strip()
	if not order_name:
		return ""
	payload = f"receipt:{order_name}".encode()
	return hmac.new(_signing_secret(), payload, hashlib.sha256).hexdigest()[:24]


def verify_receipt_token(order_name: str, key: str) -> bool:
	if not order_name or not key:
		return False
	expected = sign_receipt_token(order_name)
	return secrets.compare_digest(expected, str(key).strip())


def build_guest_receipt_url(order_name: str) -> str:
	"""Signed public URL — opens fast; PDF generated on first click or in background."""
	order_name = (order_name or "").strip()
	token = sign_receipt_token(order_name)
	path = (
		f"/api/method/imogi_pos.api.receipt_api.download_guest_receipt"
		f"?order={quote(order_name)}&key={token}"
	)
	return build_public_site_url(path)


def _find_receipt_file(order_name: str):
	"""Return File name for the order receipt PDF, if published."""
	for row in frappe.get_all(
		"File",
		filters={
			"attached_to_doctype": "Riwayat Order",
			"attached_to_name": order_name,
		},
		fields=["name", "file_name"],
		order_by="creation desc",
	):
		if (row.file_name or "").lower().endswith(".pdf"):
			return row.name
	return None


def _get_receipt_pdf_bytes(order_name: str) -> bytes:
	file_id = _find_receipt_file(order_name)
	if file_id:
		try:
			return frappe.get_doc("File", file_id).get_content()
		except Exception:
			frappe.log_error(
				title=_("IMOGI read receipt PDF failed for {0}").format(order_name),
				message=frappe.get_traceback(),
			)

	from imogi_pos.imogi_pos.utils.receipt_branding import (
		generate_receipt_pdf_bytes,
		publish_receipt_pdf_file,
	)

	pdf_bytes = generate_receipt_pdf_bytes(order_name)
	try:
		publish_receipt_pdf_file(order_name, pdf_bytes)
	except Exception:
		frappe.log_error(
			title=_("IMOGI publish receipt PDF failed for {0}").format(order_name),
			message=frappe.get_traceback(),
		)
	return pdf_bytes


@frappe.whitelist(allow_guest=True)
def download_guest_receipt(order=None, key=None):
	"""Serve receipt PDF to guest (no login). Generates on first open if needed."""
	order_name = (order or "").strip()
	if not order_name or not verify_receipt_token(order_name, key):
		frappe.throw(_("Link struk tidak valid atau sudah kedaluwarsa."), frappe.PermissionError)
	if not frappe.db.exists("Riwayat Order", order_name):
		frappe.throw(_("Order {0} tidak ditemukan").format(order_name))

	pdf_bytes = _get_receipt_pdf_bytes(order_name)
	frappe.local.response.filename = f"{order_name}.pdf"
	frappe.local.response.filecontent = pdf_bytes
	frappe.local.response.type = "pdf"
