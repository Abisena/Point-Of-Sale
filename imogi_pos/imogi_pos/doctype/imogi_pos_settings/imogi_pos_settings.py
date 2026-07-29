# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, escape_html, flt

from imogi_pos.api.settings_api import assign_credentials_on_enable
from imogi_pos.imogi_pos.utils.feature_gating import enforce_settings_tier_limits, require_feature_operational
from imogi_pos.imogi_pos.utils.subscription_billing import enforce_billing_tier_on_settings


class IMOGIPOSSettings(Document):
	def validate(self):
		enforce_billing_tier_on_settings(self)
		enforce_settings_tier_limits(self)
		self._enforce_fulfillment_rollout()

		if self.enable_order_api:
			assign_credentials_on_enable(self)

			if not self.order_api_user:
				self.order_api_user = "Administrator"

		if self.enable_role_authorization:
			from imogi_pos.imogi_pos.utils.role_authorization import ensure_default_role_authorizations

			ensure_default_role_authorizations(self)

		if self.enable_page_authorization:
			from imogi_pos.imogi_pos.utils.page_authorization import ensure_default_page_authorizations

			ensure_default_page_authorizations(self)

		self._validate_kitchen_fulfillment_rows()
		self._validate_po_approval_tiers()

	def _enforce_fulfillment_rollout(self):
		from imogi_pos.imogi_pos.utils.feature_registry import is_fulfillment_rollout_enabled

		if not is_fulfillment_rollout_enabled():
			self.enable_fulfillment = 0
		if cint(self.enable_kitchen_printer):
			self.enable_kitchen_printer = 0

	def _validate_kitchen_fulfillment_rows(self):
		seen_groups = set()
		for row in self.kitchen_item_group_rows or []:
			if row.item_group in seen_groups:
				frappe.throw(_("Item Group {0} sudah ditambahkan.").format(row.item_group))
			seen_groups.add(row.item_group)

		seen_bar = set()
		for row in getattr(self, "bar_item_group_rows", None) or []:
			if row.item_group in seen_bar:
				frappe.throw(_("Item Group Bar {0} sudah ditambahkan.").format(row.item_group))
			seen_bar.add(row.item_group)

		seen_types = set()
		for row in self.fulfillment_order_type_rows or []:
			if row.order_type in seen_types:
				frappe.throw(_("Tipe order {0} sudah ditambahkan.").format(row.order_type))
			seen_types.add(row.order_type)

		if cint(self.enable_kitchen_display) and not (getattr(self, "kds_station_mode", None) or "").strip():
			self.kds_station_mode = "Separate Kitchen and Bar"

	def _validate_po_approval_tiers(self):
		"""Rentang nominal di 'Hirarki Approval PO' harus nyambung dari 0 tanpa
		celah/tumpang-tindih, supaya setiap nominal PO pasti ketemu satu role
		approver yang jelas. Tabel kosong = pakai mode PIN lama (tidak divalidasi)."""
		rows = sorted(self.po_approval_tiers or [], key=lambda r: flt(r.from_amount))
		if not rows:
			return

		if flt(rows[0].from_amount) != 0:
			frappe.throw(
				_("Baris pertama Hirarki Approval PO harus mulai dari nominal 0."),
				title=_("Hirarki Approval PO Tidak Valid"),
			)

		if flt(rows[-1].to_amount) != 0:
			frappe.throw(
				_(
					"Baris terakhir ({0}) harus tanpa batas atas (kosongkan 'Sampai Nominal') supaya semua nominal PO, sekecil atau sebesar apa pun, selalu ketemu role approver-nya. Kalau tidak, sistem akan diam-diam balik ke mode PIN lama untuk nominal yang tidak tercakup."
				).format(rows[-1].idx),
				title=_("Hirarki Approval PO Tidak Valid"),
			)

		for idx, row in enumerate(rows):
			is_last = idx == len(rows) - 1
			to_amount = flt(row.to_amount)
			if to_amount != 0 and to_amount <= flt(row.from_amount):
				frappe.throw(
					_("Baris {0}: 'Sampai Nominal' harus lebih besar dari 'Dari Nominal' (atau 0 untuk tanpa batas).").format(
						row.idx
					),
					title=_("Hirarki Approval PO Tidak Valid"),
				)
			if not is_last:
				if to_amount == 0:
					frappe.throw(
						_("Baris {0}: hanya baris terakhir yang boleh tanpa batas atas.").format(row.idx),
						title=_("Hirarki Approval PO Tidak Valid"),
					)
				next_row = rows[idx + 1]
				if flt(next_row.from_amount) != to_amount:
					frappe.throw(
						_(
							"Ada celah/tumpang-tindih antara baris {0} (sampai {1}) dan baris {2} (dari {3}). Rentang harus nyambung tanpa celah."
						).format(row.idx, to_amount, next_row.idx, flt(next_row.from_amount)),
						title=_("Hirarki Approval PO Tidak Valid"),
					)

	def on_update(self):
		from imogi_pos.imogi_pos.utils.deployment_mode import is_subscription_tier_disabled
		from imogi_pos.imogi_pos.utils.feature_registry import get_subscription_tier

		if self.enable_role_authorization:
			from imogi_pos.imogi_pos.utils.role_authorization import sync_role_authorization_permissions

			sync_role_authorization_permissions(self)

		payload = {
			"enable_pos_shift": self.enable_pos_shift,
			"enable_whatsapp_receipt": cint(getattr(self, "enable_whatsapp_receipt", 0)),
			"auto_print_receipt_on_success": cint(getattr(self, "auto_print_receipt_on_success", 0)),
		}
		if not is_subscription_tier_disabled():
			payload["subscription_tier"] = get_subscription_tier(self)
		frappe.publish_realtime("imogi_pos_settings_updated", payload)

		from imogi_pos.install import ensure_receipt_print_format

		ensure_receipt_print_format()

	@frappe.whitelist()
	def generate_order_api_key(self):
		"""Called from Settings Button — works even without custom client JS."""
		require_feature_operational("api_access", self)
		from imogi_pos.api.settings_api import regenerate_order_api_credentials

		result = regenerate_order_api_credentials()
		frappe.msgprint(
			_(
				"<p><b>{0}:</b> <code>{1}</code></p>"
				"<p><b>{2}:</b> <code>{3}</code></p>"
				"<p class='text-muted'>{4}</p>"
			).format(
				_("API Key"),
				escape_html(result["api_key"]),
				_("API Secret"),
				escape_html(result["api_secret"]),
				_("Copy the secret now — it will not be shown again."),
			),
			title=_("API Credentials Generated"),
			indicator="green",
		)
		return result
