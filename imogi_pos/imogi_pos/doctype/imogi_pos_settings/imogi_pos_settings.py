# Copyright (c) 2026, Imogi and contributors

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import escape_html

from imogi_pos.api.settings_api import assign_credentials_on_enable
from imogi_pos.imogi_pos.utils.business_profile import BUSINESS_UMKM
from imogi_pos.imogi_pos.utils.feature_gating import enforce_settings_tier_limits, require_feature_operational
from imogi_pos.imogi_pos.utils.subscription_billing import enforce_billing_tier_on_settings


class IMOGIPOSSettings(Document):
	def validate(self):
		enforce_billing_tier_on_settings(self)
		enforce_settings_tier_limits(self)

		if self.business_type == BUSINESS_UMKM:
			self.enable_kitchen_display = 0
			self.enable_fulfillment = 0
			self.kitchen_item_groups = ""
			self.fulfillment_for_order_types = ""

		if self.enable_order_api:
			assign_credentials_on_enable(self)

			if not self.order_api_user:
				self.order_api_user = "Administrator"

	def on_update(self):
		from imogi_pos.imogi_pos.utils.deployment_mode import is_subscription_tier_disabled
		from imogi_pos.imogi_pos.utils.feature_registry import get_subscription_tier

		payload = {"enable_pos_shift": self.enable_pos_shift}
		if not is_subscription_tier_disabled():
			payload["subscription_tier"] = get_subscription_tier(self)
		frappe.publish_realtime("imogi_pos_settings_updated", payload)

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
