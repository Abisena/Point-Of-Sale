# Copyright (c) 2026, Imogi and contributors

import re

import frappe
from frappe import _


def normalize_whatsapp_phone(phone):
	if not phone:
		return ""
	digits = re.sub(r"\D", "", str(phone).strip())
	if not digits:
		return ""
	if digits.startswith("0"):
		digits = "62" + digits[1:]
	elif not digits.startswith("62"):
		digits = "62" + digits
	return digits


def is_fonnte_configured(settings=None):
	from imogi_pos.imogi_pos.utils.receipt_branding import get_whatsapp_receipt_config

	cfg = get_whatsapp_receipt_config(settings)
	return (
		(cfg.get("whatsapp_api_provider") or "").strip() == "Fonnte"
		and bool((cfg.get("fonnte_api_token") or "").strip())
	)


def send_fonnte_document(api_token, target, message, pdf_bytes, filename):
	"""Send WhatsApp message + PDF via Fonnte API (https://fonnte.com)."""
	import requests

	api_token = (api_token or "").strip()
	if not api_token:
		frappe.throw(_("Token Fonnte belum diisi di IMOGI POS Settings."))

	phone = normalize_whatsapp_phone(target)
	if not phone:
		frappe.throw(_("Nomor HP customer tidak valid."))

	try:
		response = requests.post(
			"https://api.fonnte.com/send",
			headers={"Authorization": api_token},
			data={
				"target": phone,
				"message": message or "",
				"countryCode": "62",
			},
			files={"file": (filename or "struk.pdf", pdf_bytes, "application/pdf")},
			timeout=60,
		)
	except requests.RequestException as exc:
		frappe.throw(_("Tidak bisa menghubungi Fonnte: {0}").format(str(exc)))

	try:
		body = response.json()
	except ValueError:
		body = {"detail": response.text}

	if response.status_code >= 400:
		detail = body.get("reason") or body.get("detail") or body.get("message") or response.text
		frappe.throw(_("Fonnte error ({0}): {1}").format(response.status_code, detail))

	# Fonnte returns status true/false in JSON
	if body.get("status") is False:
		detail = body.get("reason") or body.get("detail") or body.get("message") or str(body)
		frappe.throw(_("Fonnte gagal kirim: {0}").format(detail))

	return {"phone": phone, "provider": "Fonnte", "response": body}


def send_fonnte_message(api_token, target, message):
	"""Send plain WhatsApp text via Fonnte (no attachment)."""
	import requests

	api_token = (api_token or "").strip()
	if not api_token:
		frappe.throw(_("Token Fonnte belum diisi di IMOGI POS Settings."))

	phone = normalize_whatsapp_phone(target)
	if not phone:
		frappe.throw(_("Nomor HP customer tidak valid."))

	try:
		response = requests.post(
			"https://api.fonnte.com/send",
			headers={"Authorization": api_token},
			data={
				"target": phone,
				"message": message or "",
				"countryCode": "62",
			},
			timeout=60,
		)
	except requests.RequestException as exc:
		frappe.throw(_("Tidak bisa menghubungi Fonnte: {0}").format(str(exc)))

	try:
		body = response.json()
	except ValueError:
		body = {"detail": response.text}

	if response.status_code >= 400:
		detail = body.get("reason") or body.get("detail") or body.get("message") or response.text
		frappe.throw(_("Fonnte error ({0}): {1}").format(response.status_code, detail))

	if body.get("status") is False:
		detail = body.get("reason") or body.get("detail") or body.get("message") or str(body)
		frappe.throw(_("Fonnte gagal kirim: {0}").format(detail))

	return {"phone": phone, "provider": "Fonnte", "response": body}
