frappe.provide("imogi_pos.settings_api");

frappe.ui.form.on("IMOGI POS Settings", {
	generate_order_api_key(frm) {
		imogi_pos.settings_api.regenerate(frm);
	},
});

imogi_pos.settings_api = {
	regenerate(frm) {
		frappe.call({
			method: "imogi_pos.api.settings_api.regenerate_order_api_credentials",
			freeze: true,
			freeze_message: __("Generating API credentials..."),
			callback(r) {
				if (r.exc) {
					frappe.msgprint({
						title: __("Error"),
						indicator: "red",
						message: r.message || __("Failed to generate API credentials"),
					});
					return;
				}
				if (!r.message) {
					return;
				}
				imogi_pos.settings_api.show_credentials_dialog(r.message, () => {
					if (frm) {
						frm.reload_doc();
					}
				});
			},
		});
	},

	show_credentials_dialog({ api_key, api_secret, message }, on_close) {
		const dialog = new frappe.ui.Dialog({
			title: __("API Credentials"),
			fields: [
				{
					fieldtype: "HTML",
					options: `<div class="alert alert-warning small mb-3"><i class="fa fa-exclamation-triangle"></i> ${__(
						message ||
							"Salin API Secret sekarang. Setelah dialog ditutup, secret tidak ditampilkan lagi."
					)}</div>`,
				},
				{
					fieldname: "api_key",
					fieldtype: "Data",
					label: __("API Key"),
					read_only: 1,
					default: api_key,
				},
				{
					fieldname: "api_secret",
					fieldtype: "Data",
					label: __("API Secret"),
					read_only: 1,
					default: api_secret,
				},
				{
					fieldtype: "HTML",
					options: `<div class="border rounded p-3 bg-light small">
						<strong>${__("Request Headers")}</strong>
						<pre class="mb-0 mt-2" style="background:#1e293b;color:#e2e8f0;border-radius:6px;padding:10px;font-size:12px;">X-Imogi-Api-Key: ${frappe.utils.escape_html(api_key)}
X-Imogi-Api-Secret: ${frappe.utils.escape_html(api_secret)}</pre>
					</div>`,
				},
			],
			primary_action_label: `<i class="fa fa-copy"></i> ${__("Copy Secret")}`,
			primary_action() {
				imogi_pos.settings_api.copy(api_secret, __("API Secret copied"));
			},
		});

		dialog.set_secondary_action_label(`<i class="fa fa-copy"></i> ${__("Copy Key")}`);
		dialog.set_secondary_action(() => {
			imogi_pos.settings_api.copy(api_key, __("API Key copied"));
		});

		dialog.onhide = () => {
			if (on_close) on_close();
		};

		dialog.show();
		dialog.$wrapper.find('[data-fieldname="api_secret"] input').prop("type", "text");
	},

	copy(text, success_message) {
		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(text).then(() => {
				frappe.show_alert({ message: success_message, indicator: "green" });
			});
			return;
		}
		const $temp = $("<textarea>").val(text).appendTo("body").select();
		document.execCommand("copy");
		$temp.remove();
		frappe.show_alert({ message: success_message, indicator: "green" });
	},
};
