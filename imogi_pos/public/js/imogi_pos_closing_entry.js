frappe.ui.form.on("POS Closing Entry", {
	onload(frm) {
		if (frm.is_new() && frappe.route_options?.imogi_return_to_cashier) {
			frm.imogi_return_to_cashier = true;
		}
	},

	on_submit(frm) {
		if (frm.imogi_return_to_cashier || frappe.route_options?.imogi_return_to_cashier) {
			imogi_pos_after_shift_closed(__("Shift ditutup. Buka shift baru..."));
		}
	},
});
