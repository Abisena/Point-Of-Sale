frappe.ui.form.on("IMOGI POS Shift Opening", {
	onload(frm) {
		if (!frm.is_new()) {
			return;
		}

		imogi_pos_restore_shift_opening_route_options(frm);
		if (frappe.route_options?.imogi_return_to_cashier) {
			frm.imogi_return_to_cashier = true;
		}
		imogi_pos_setup_shift_opening(frm);
	},

	refresh(frm) {
		if (frm.doc.docstatus === 0) {
			imogi_pos_sync_shift_opening_lock(frm);
		}
	},

	on_submit(frm) {
		imogi_pos_clear_shift_opening_lock();
		frappe.boot.imogi_pos_landing_target = "cashier";
		frappe.boot.imogi_pos_has_open_shift = true;
		try {
			sessionStorage.removeItem("imogi_pos_opening_route_options");
		} catch (e) {
			// ignore
		}

		if (frm.imogi_return_to_cashier || frappe.route_options?.imogi_return_to_cashier) {
			frappe.show_alert({
				message: __("Shift dibuka. Kembali ke IMOGI Kasir..."),
				indicator: "green",
			});
			frappe.route_options = {};
			setTimeout(() => frappe.set_route("imogi-pos-cashier"), 800);
		}
	},
});

function imogi_pos_restore_shift_opening_route_options(frm) {
	try {
		const raw = sessionStorage.getItem("imogi_pos_opening_route_options");
		if (raw) {
			frappe.route_options = Object.assign({}, frappe.route_options || {}, JSON.parse(raw));
		}
	} catch (e) {
		// ignore
	}

	if (frappe.boot?.imogi_pos_opening_route_options) {
		frappe.route_options = Object.assign(
			{},
			frappe.route_options || {},
			frappe.boot.imogi_pos_opening_route_options
		);
	}

	if (frm && frappe.route_options?.imogi_return_to_cashier) {
		frm.imogi_return_to_cashier = true;
	}
}

function imogi_pos_setup_shift_opening(frm) {
	if (frm.imogi_shift_opening_setup_done) {
		return;
	}
	frm.imogi_shift_opening_setup_done = true;

	frappe.call({
		method: "imogi_pos.api.cashier.get_shift_opening_defaults",
		callback(r) {
			if (r.exc || !r.message) {
				return;
			}

			const data = r.message;
			const tasks = [];

			if (data.company && frm.doc.company !== data.company) {
				tasks.push(() => frm.set_value("company", data.company));
			}
			if (data.pos_profile && frm.doc.pos_profile !== data.pos_profile) {
				tasks.push(() => frm.set_value("pos_profile", data.pos_profile));
			}
			if (!frm.doc.user) {
				tasks.push(() => frm.set_value("user", frappe.session.user));
			}

			frappe.run_serially(tasks).then(() => {
				if (data.payments?.length) {
					imogi_pos_set_shift_opening_payments(frm, data.payments);
				}
			});
		},
	});
}

function imogi_pos_set_shift_opening_payments(frm, rows) {
	frm.clear_table("payments");
	rows.forEach(({ mode_of_payment, opening_amount = 0 }) => {
		frm.add_child("payments", {
			mode_of_payment,
			opening_amount,
		});
	});
	frm.refresh_field("payments");
}

function imogi_pos_sync_shift_opening_lock(frm) {
	if (!frm.imogi_return_to_cashier) {
		frm.imogi_return_to_cashier =
			frappe.route_options?.imogi_return_to_cashier ||
			frappe.boot?.imogi_pos_landing_target === "opening-entry";
	}

	if (!frm.imogi_return_to_cashier) {
		return;
	}

	imogi_pos.opening_entry_locked = true;
	imogi_pos.opening_entry_docname = frm.docname;

	if (frm.page?.btn_secondary) {
		frm.page.btn_secondary.hide();
	}

	if (!frm.imogi_shift_opening_lock_banner) {
		frm.imogi_shift_opening_lock_banner = true;
		frappe.show_alert(
			{
				message: __(
					"Isi Opening Amount lalu klik <b>Submit</b> untuk buka shift. Navigasi ke halaman lain dinonaktifkan."
				),
				indicator: "orange",
			},
			8
		);
	}
}

function imogi_pos_clear_shift_opening_lock() {
	imogi_pos.opening_entry_locked = false;
	imogi_pos.opening_entry_docname = null;
}
