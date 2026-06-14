frappe.pages["imogi-pos-setup"].on_page_load = function (wrapper) {
	frappe.ui.make_app_page({
		parent: wrapper,
		title: __("IMOGI POS Setup"),
		single_column: true,
	});

	frappe.require("/assets/imogi_pos/js/imogi_pos_setup_wizard.js", () => {
		frappe.call({
			method: "imogi_pos.api.setup.get_setup_status",
			callback(r) {
				if (r.message && r.message.setup_complete) {
					new imogi_pos.SetupModeChange(wrapper, r.message);
					return;
				}
				new imogi_pos.SetupWizard9(wrapper);
			},
		});
	});
};
