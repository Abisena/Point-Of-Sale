frappe.ui.form.on("POS Opening Entry", {
	onload(frm) {
		if (frm.is_new()) {
			imogi_pos_restore_opening_route_options(frm);
			if (frappe.route_options?.imogi_return_to_cashier) {
				frm.imogi_return_to_cashier = true;
			}
			imogi_pos_setup_opening_entry(frm);
		}
	},

	refresh(frm) {
		imogi_pos_sync_opening_entry_lock(frm);
	},

	pos_profile(frm) {
		if (frm.is_new() && frm.doc.pos_profile && imogi_pos_balance_details_empty(frm)) {
			imogi_pos_setup_opening_entry(frm, true);
		}
	},

	before_submit(frm) {
		if (!frm.imogi_return_to_cashier) {
			return;
		}

		const rows = frm.doc.balance_details || [];
		const has_amount = rows.some((row) => flt(row.opening_amount) > 0);
		if (!has_amount) {
			frappe.throw(
				__("Isi Opening Amount minimal pada satu metode pembayaran (mis. Cash), lalu Submit.")
			);
		}
	},

	on_submit(frm) {
		if (frm.imogi_return_to_cashier || frappe.route_options?.imogi_return_to_cashier) {
			imogi_pos_clear_opening_entry_lock();
			frappe.boot.imogi_pos_landing_target = "cashier";
			frappe.boot.imogi_pos_has_open_shift = true;
			try {
				sessionStorage.removeItem("imogi_pos_opening_route_options");
			} catch (e) {
				// ignore
			}
			frappe.show_alert({
				message: __("Shift dibuka. Kembali ke IMOGI Kasir..."),
				indicator: "green",
			});
			frappe.route_options = {};
			setTimeout(() => frappe.set_route("imogi-pos-cashier"), 800);
		}
	},
});

function imogi_pos_sync_opening_entry_lock(frm) {
	if (typeof imogi_pos_requires_shift_workflow === "function" && !imogi_pos_requires_shift_workflow()) {
		return;
	}
	if (!frm.imogi_return_to_cashier || frm.doc.docstatus !== 0) {
		return;
	}

	imogi_pos.opening_entry_locked = true;
	imogi_pos.opening_entry_docname = frm.docname;

	if (frm.page?.btn_secondary) {
		frm.page.btn_secondary.hide();
	}

	if (!frm.imogi_opening_lock_banner) {
		frm.imogi_opening_lock_banner = true;
		frappe.show_alert(
			{
				message: __(
					"Lengkapi Opening Amount lalu klik <b>Submit</b> untuk buka shift. Navigasi ke halaman lain dinonaktifkan."
				),
				indicator: "orange",
			},
			8
		);
	}
}

function imogi_pos_clear_opening_entry_lock() {
	imogi_pos.opening_entry_locked = false;
	imogi_pos.opening_entry_docname = null;
}

function imogi_pos_restore_opening_route_options(frm) {
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

function imogi_pos_balance_details_empty(frm) {
	const rows = frm.doc.balance_details || [];
	if (!rows.length) {
		return true;
	}
	return rows.every((row) => !row.mode_of_payment);
}

function imogi_pos_setup_opening_entry(frm, force = false) {
	if (frm.imogi_opening_setup_done && !force) {
		return;
	}
	frm.imogi_opening_setup_done = true;

	frappe.call({
		method: "imogi_pos.api.cashier.get_opening_entry_defaults",
		callback(r) {
			if (r.exc || !r.message) {
				imogi_pos_apply_opening_defaults(frm);
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
				const apply_rows = () => {
					if (data.balance_details?.length) {
						imogi_pos_set_balance_details(frm, data.balance_details);
					}
				};
				apply_rows();
				// ERPNext pos_profile handler may overwrite rows after async POS Profile load.
				setTimeout(apply_rows, 350);
				setTimeout(apply_rows, 900);
			});
		},
	});
}

function imogi_pos_apply_opening_defaults(frm) {
	const opts = frappe.route_options || {};

	if (opts.company && !frm.doc.company) {
		frm.set_value("company", opts.company);
	} else if (!frm.doc.company && frappe.boot.imogi_pos_default_company) {
		frm.set_value("company", frappe.boot.imogi_pos_default_company);
	}

	const profile =
		opts.pos_profile || frappe.boot.imogi_pos_default_pos_profile || null;
	if (profile && !frm.doc.pos_profile) {
		frm.set_value("pos_profile", profile);
	}

	if (!frm.doc.user) {
		frm.set_value("user", frappe.session.user);
	}
}

function imogi_pos_set_balance_details(frm, rows) {
	frm.clear_table("balance_details");
	rows.forEach(({ mode_of_payment, opening_amount = 0 }) => {
		frm.add_child("balance_details", {
			mode_of_payment,
			opening_amount,
		});
	});
	frm.refresh_field("balance_details");
}
