frappe.ui.form.on("IMOGI POS Order", {
	onload(frm) {
		if (!is_umkm_mode()) return;
		apply_umkm_defaults(frm);
		toggle_umkm_form_fields(frm);
	},

	refresh(frm) {
		const is_umkm = is_umkm_mode();
		if (is_umkm) {
			apply_umkm_defaults(frm);
			toggle_umkm_form_fields(frm);
		}

		if (frm.is_new()) return;

		const status = frm.doc.status;

		if (
			!is_umkm &&
			frm.doc.docstatus === 1 &&
			status === "Paid" &&
			frm.doc.pos_invoice
		) {
			const needs_resume =
				(frm.doc.requires_kitchen && !frm.doc.kitchen_order) ||
				(frm.doc.requires_fulfillment && !frm.doc.fulfillment_task) ||
				!frm.doc.delivery_task;

			if (needs_resume) {
				frm.add_custom_button(__("Resume Flow"), () => {
					frappe.call({
						method: "action_resume_flow",
						doc: frm.doc,
						freeze: true,
						callback() {
							frm.reload_doc();
						},
					});
				}).addClass("btn-warning");
			}
		}

		if (frm.doc.docstatus === 1 && status === "Awaiting Payment") {
			const pay_label = is_umkm
				? __("Process Payment & Complete")
				: __("Process Payment (Step 02)");
			frm.add_custom_button(pay_label, () => {
				frappe.call({
					method: "action_process_payment",
					doc: frm.doc,
					freeze: true,
					callback() {
						frm.reload_doc();
					},
				});
			}).addClass("btn-primary");
		}

		if (!is_umkm && status === "In Kitchen") {
			frm.add_custom_button(__("Complete Kitchen (Step 03)"), () => {
				frappe.call({
					method: "action_complete_kitchen",
					doc: frm.doc,
					freeze: true,
					callback() {
						frm.reload_doc();
					},
				});
			});
		}

		if (!is_umkm && status === "In Fulfillment") {
			frm.add_custom_button(__("Complete Fulfillment (Step 04)"), () => {
				frappe.call({
					method: "action_complete_fulfillment",
					doc: frm.doc,
					freeze: true,
					callback() {
						frm.reload_doc();
					},
				});
			});
		}

		if (!is_umkm && status === "In Service") {
			frm.add_custom_button(__("Complete Service (Step 05)"), () => {
				frappe.call({
					method: "action_complete_service",
					doc: frm.doc,
					freeze: true,
					callback() {
						frm.reload_doc();
					},
				});
			}).addClass("btn-primary");
		}

		if (!is_umkm && status === "In Kitchen" && frm.doc.kitchen_order) {
			frm.add_custom_button(__("Kitchen Display"), () => {
				frappe.set_route("Form", "IMOGI Kitchen Order", frm.doc.kitchen_order);
			});
		}

		add_void_refund_buttons(frm, status, is_umkm);
		if (!is_umkm) {
			add_move_table_button(frm, status);
			add_merge_table_button(frm, status);
		}
	},

	discount_type(frm) {
		frm.trigger("recalculate_discount");
	},

	discount_value(frm) {
		frm.trigger("recalculate_discount");
	},

	recalculate_discount(frm) {
		let subtotal = 0;
		(frm.doc.items || []).forEach((row) => {
			subtotal += flt(row.qty) * flt(row.rate);
		});
		let discount_amount = 0;
		if (frm.doc.discount_type === "Percent" && flt(frm.doc.discount_value)) {
			discount_amount = (subtotal * flt(frm.doc.discount_value)) / 100;
		} else if (frm.doc.discount_type === "Amount" && flt(frm.doc.discount_value)) {
			discount_amount = Math.min(flt(frm.doc.discount_value), subtotal);
		}
		frm.set_value("subtotal", subtotal);
		frm.set_value("discount_amount", discount_amount);
		frm.set_value("grand_total", subtotal - discount_amount);
	},

	items_add(frm) {
		set_item_defaults(frm);
	},
});

frappe.ui.form.on("IMOGI POS Order Item", {
	item_code(frm, cdt, cdn) {
		const row = locals[cdt][cdn];
		if (!row.item_code) return;

		frappe.db.get_value("Item", row.item_code, ["standard_rate", "stock_uom"], (r) => {
			frappe.model.set_value(cdt, cdn, "rate", r.standard_rate || 0);
			frappe.model.set_value(cdt, cdn, "uom", r.stock_uom);
		});
	},

	qty(frm, cdt, cdn) {
		update_row_amount(cdt, cdn);
		frm.trigger("recalculate_discount");
	},

	rate(frm, cdt, cdn) {
		update_row_amount(cdt, cdn);
		frm.trigger("recalculate_discount");
	},
});

function is_umkm_mode() {
	return frappe.boot.imogi_pos_business_type === "UMKM";
}

function apply_umkm_defaults(frm) {
	if (!frm.doc.order_channel) {
		frm.set_value("order_channel", "Walk-in");
	}
	if (!frm.doc.order_type) {
		frm.set_value("order_type", "Takeaway");
	}
	if (!frm.doc.order_source) {
		frm.set_value("order_source", "IMOGI POS");
	}

	if (frm.is_new() && !frm.doc.company) {
		frappe.db.get_single_value("IMOGI POS Settings", "default_company").then((company) => {
			if (company && !frm.doc.company) frm.set_value("company", company);
		});
	}
	if (frm.is_new() && !frm.doc.pos_profile) {
		frappe.db.get_single_value("IMOGI POS Settings", "default_pos_profile").then((profile) => {
			if (profile && !frm.doc.pos_profile) frm.set_value("pos_profile", profile);
		});
	}
}

function toggle_umkm_form_fields(frm) {
	const hide = [
		"order_channel",
		"order_type",
		"restaurant_table",
		"requires_kitchen",
		"requires_fulfillment",
		"links_section",
		"kitchen_order",
		"fulfillment_task",
		"delivery_task",
		"service_section",
		"service_started_at",
		"service_completed_at",
		"delivery_address",
		"customer_phone",
		"customer_email",
	];

	hide.forEach((fieldname) => frm.toggle_display(fieldname, false));

	frm.set_df_property("order_entry_section", "label", __("Penjualan"));
	frm.set_df_property("payment_section", "label", __("Pembayaran"));
	frm.set_df_property("items_section", "label", __("Produk"));
}

function update_row_amount(cdt, cdn) {
	const row = locals[cdt][cdn];
	frappe.model.set_value(cdt, cdn, "amount", (row.qty || 0) * (row.rate || 0));
}

function set_item_defaults(frm) {
	const wh = frappe.defaults.get_user_default("warehouse");
	if (wh && frm.doc.items) {
		frm.doc.items.forEach((row) => {
			if (!row.warehouse) row.warehouse = wh;
		});
	}
}

function add_void_refund_buttons(frm, status, is_umkm) {
	if (frm.doc.docstatus !== 1) return;
	if (["Cancelled", "Refunded"].includes(status)) return;

	const can_void =
		status === "Awaiting Payment" ||
		(status === "Draft" && !frm.doc.pos_invoice);

	const role_ctx = frappe.boot?.imogi_pos_role_context || {};
	const effective = new Set(role_ctx.effective_roles || []);
	const role_gating_on = !!frappe.boot?.imogi_pos_role_gating_enabled;
	const can_supervise = !role_gating_on || role_ctx.bypass || effective.has("Supervisor");

	if (can_void && can_supervise) {
		frm.add_custom_button(is_umkm ? __("Batalkan Order") : __("Void Order"), () => {
			prompt_and_call(frm, "action_void_order", __("Alasan pembatalan (opsional)"), "Void");
		}).addClass("btn-danger");
	}

	const can_refund =
		frm.doc.pos_invoice &&
		flt(frm.doc.refunded_amount) < flt(frm.doc.grand_total) &&
		["Paid", "Completed", "Partially Refunded"].includes(status);

	if (can_refund && can_supervise) {
		frm.add_custom_button(is_umkm ? __("Refund Penuh") : __("Refund Order"), () => {
			prompt_and_call(frm, "action_refund_order", __("Alasan refund (opsional)"), "Refund");
		}).addClass("btn-danger");

		frm.add_custom_button(is_umkm ? __("Refund Sebagian") : __("Partial Refund"), () => {
			open_partial_refund_dialog(frm);
		}).addClass("btn-warning");
	}
}

function open_partial_refund_dialog(frm) {
	const fields = (frm.doc.items || []).map((row) => ({
		fieldname: `qty_${row.item_code}`,
		fieldtype: "Float",
		label: `${row.item_name || row.item_code} (${__("max")} ${row.qty})`,
		default: 0,
	}));

	if (!fields.length) {
		frappe.msgprint(__("No items to refund"));
		return;
	}

	frappe.prompt(
		[
			{
				fieldname: "refund_intro",
				fieldtype: "HTML",
				options: `<p class="text-muted">${__(
					"Masukkan qty yang akan direfund per item."
				)}</p>`,
			},
			...fields,
			{
				fieldname: "reason",
				fieldtype: "Small Text",
				label: __("Alasan refund (opsional)"),
			},
		],
		(values) => {
			const refund_items = (frm.doc.items || [])
				.map((row) => ({
					item_code: row.item_code,
					qty: Math.min(flt(values[`qty_${row.item_code}`]), flt(row.qty)),
				}))
				.filter((row) => row.qty > 0);

			if (!refund_items.length) {
				frappe.msgprint(__("Masukkan qty refund minimal 1 item"));
				return;
			}

			frappe.call({
				method: "action_partial_refund",
				doc: frm.doc,
				args: {
					refund_items: JSON.stringify(refund_items),
					reason: values.reason,
				},
				freeze: true,
				callback() {
					frm.reload_doc();
				},
			});
		},
		is_umkm_mode() ? __("Refund Sebagian") : __("Partial Refund"),
		__("Proses Refund")
	);
}

function approval_workflow_on() {
	return !!cint(frappe.boot?.imogi_pos_approval_workflow_enabled);
}

function prompt_supervisor_approval(approval_type, reference_name, amount, reason, on_approved) {
	frappe.prompt(
		[
			{
				fieldname: "pin",
				fieldtype: "Password",
				label: __("PIN Supervisor"),
				reqd: 1,
			},
		],
		(values) => {
			frappe.call({
				method: "imogi_pos.api.approval_api.request_approval",
				args: {
					approval_type,
					reference_name,
					reason: reason || "",
					amount: amount || 0,
				},
				callback(req) {
					const name = (req.message || {}).name;
					frappe.call({
						method: "imogi_pos.api.approval_api.approve_with_pin",
						args: { request_name: name, pin: values.pin },
						callback() {
							on_approved(name);
						},
					});
				},
			});
		},
		__("Approval Supervisor"),
		__("Setujui")
	);
}

function prompt_and_call(frm, method, prompt_label, approval_type) {
	const run_action = (values, approval_code) => {
		frappe.call({
			method,
			doc: frm.doc,
			args: { reason: values.reason, approval_code: approval_code || undefined },
			freeze: true,
			callback(r) {
				if (r.exc) {
					const msg = (r._server_messages || "").toString();
					if (
						approval_type &&
						approval_workflow_on() &&
						(msg.includes("Perlu Approval") || msg.includes("approval"))
					) {
						prompt_supervisor_approval(
							approval_type,
							frm.doc.name,
							flt(frm.doc.grand_total),
							values.reason,
							(code) => run_action(values, code)
						);
					}
					return;
				}
				frm.reload_doc();
			},
		});
	};

	frappe.prompt(
		[
			{
				fieldname: "reason",
				fieldtype: "Small Text",
				label: prompt_label,
			},
		],
		(values) => {
			if (approval_type && approval_workflow_on()) {
				prompt_supervisor_approval(
					approval_type,
					frm.doc.name,
					flt(frm.doc.grand_total),
					values.reason,
					(code) => run_action(values, code)
				);
				return;
			}
			run_action(values);
		},
		is_umkm_mode() ? __("Konfirmasi") : __("Confirm"),
		__("Lanjutkan")
	);
}

function add_merge_table_button(frm, status) {
	if (!frm.doc.restaurant_table || frm.doc.docstatus !== 1) return;
	if (["Completed", "Cancelled", "Refunded"].includes(status)) return;

	frm.add_custom_button(__("Gabung Meja"), () => {
		frappe.prompt(
			[
				{
					fieldname: "secondary_order",
					fieldtype: "Link",
					label: __("Order sekunder"),
					options: "IMOGI POS Order",
					reqd: 1,
				},
			],
			(values) => {
				frappe.call({
					method: "imogi_pos.api.planned_features_api.merge_tables",
					args: {
						primary_order: frm.doc.name,
						secondary_order: values.secondary_order,
					},
					freeze: true,
					callback() {
						frm.reload_doc();
					},
				});
			},
			__("Gabung Order Meja"),
			__("Gabungkan")
		);
	});
}

function add_move_table_button(frm, status) {
	if (!frm.doc.restaurant_table || frm.doc.docstatus !== 1) return;
	if (["Completed", "Cancelled", "Refunded"].includes(status)) return;

	frm.add_custom_button(__("Pindah Meja"), () => {
		frappe.prompt(
			[
				{
					fieldname: "new_table",
					fieldtype: "Link",
					label: __("Meja tujuan"),
					options: "IMOGI Restaurant Table",
					reqd: 1,
				},
			],
			(values) => {
				frappe.call({
					method: "imogi_pos.api.table_api.move_restaurant_table",
					args: {
						order_name: frm.doc.name,
						new_table: values.new_table,
						company: frm.doc.company,
					},
					freeze: true,
					callback() {
						frm.reload_doc();
					},
				});
			},
			__("Pindah Meja"),
			__("Pindahkan")
		);
	});
}
