# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, escape_html

from imogi_pos.api.settings_api import assign_credentials_on_enable
from imogi_pos.imogi_pos.utils.feature_gating import enforce_settings_tier_limits, require_feature_operational
from imogi_pos.imogi_pos.utils.subscription_billing import enforce_billing_tier_on_settings


class IMOGIPOSSettings(Document):
	def validate(self):
		enforce_billing_tier_on_settings(self)
		enforce_settings_tier_limits(self)

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

	def _validate_kitchen_fulfillment_rows(self):
		seen_groups = set()
		for row in self.kitchen_item_group_rows or []:
			if row.item_group in seen_groups:
				frappe.throw(_("Item Group {0} sudah ditambahkan.").format(row.item_group))
			seen_groups.add(row.item_group)

		seen_types = set()
		for row in self.fulfillment_order_type_rows or []:
			if row.order_type in seen_types:
				frappe.throw(_("Tipe order {0} sudah ditambahkan.").format(row.order_type))
			seen_types.add(row.order_type)

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
