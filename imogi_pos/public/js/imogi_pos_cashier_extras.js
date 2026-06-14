// Copyright (c) 2026, Imogi and contributors
/* Multi payment, split bill, table picker, supervisor approval PIN */

frappe.provide("imogi_pos.cashier_extras");

imogi_pos.cashier_extras.inject_css = function () {
	if (document.getElementById("imogi-cashier-extras-css")) return;
	frappe.dom.set_style(
		`
		.imogi-cashier-table-row{align-items:center;display:flex;gap:8px;margin-bottom:8px}
		.imogi-cashier-table-row select{flex:1;font-size:12px!important;min-width:0}
		.imogi-cashier-table-chip{background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;color:#047857;font-size:11px;font-weight:700;padding:4px 8px}
		.imogi-cashier-split-btn,.imogi-cashier-multi-pay-hint{font-size:11px!important}
		.imogi-pay-multi-wrap{border-top:1px dashed #e2e8f0;margin-top:10px;padding-top:10px}
		.imogi-pay-multi-row{align-items:center;display:flex;gap:8px;margin-bottom:8px}
		.imogi-pay-multi-row select,.imogi-pay-multi-row input{flex:1;min-width:0}
		`,
		"imogi-cashier-extras-css"
	);
};

imogi_pos.cashier_extras.patch = function () {
	if (!imogi_pos.CashierPage || imogi_pos.cashier_extras._patched) return;
	imogi_pos.cashier_extras._patched = true;
	imogi_pos.cashier_extras.inject_css();

	const proto = imogi_pos.CashierPage.prototype;
	const origApplyGates = proto.apply_feature_gates;
	proto.apply_feature_gates = function () {
		origApplyGates.call(this);
		imogi_pos.cashier_extras.render_table_row(this);
		imogi_pos.cashier_extras.render_split_button(this);
	};

	const origSyncOrderType = proto.sync_order_type_ui;
	proto.sync_order_type_ui = function () {
		origSyncOrderType.call(this);
		imogi_pos.cashier_extras.toggle_table_row(this);
	};

	const origCheckout = proto.checkout;
	proto.checkout = function (dialog, mode_of_payment, total, paid_amount) {
		const me = this;
		const multi = imogi_pos.cashier_extras.get_multi_payments(me, dialog, total);
		if (multi && multi.length > 1) {
			if (!me.require_feature("multi_payment")) return;
			me._checkout_payments = multi;
			return imogi_pos.cashier_extras.checkout_with_payments(me, dialog, multi, total, paid_amount);
		}
		me._checkout_payments = null;
		me._approval_code = me._pending_approval_code || null;
		return origCheckout.call(me, dialog, mode_of_payment, total, paid_amount);
	};

	const origOpenPayment = proto.open_payment_dialog;
	proto.open_payment_dialog = function () {
		const result = origOpenPayment.call(this);
		imogi_pos.cashier_extras.setup_multi_payment_ui(this);
		return result;
	};

	const origRenderCart = proto.render_cart;
	proto.render_cart = function () {
		origRenderCart.call(this);
		imogi_pos.cashier_extras.render_split_button(this);
	};
};

imogi_pos.cashier_extras.render_table_row = function (page) {
	const show = page.order_type === "Dine-in" && page.feature_allowed("table_management");
	let $row = page.wrapper.find(".imogi-cashier-table-row");
	if (!$row.length) {
		page.wrapper.find(".imogi-cashier-order-type-row").after(`
			<div class="imogi-cashier-table-row" style="display:none;">
				<span class="small text-muted">${__("Meja")}</span>
				<select class="form-control input-sm imogi-cashier-table-select">
					<option value="">${__("Pilih meja")}</option>
				</select>
				<span class="imogi-cashier-table-chip" style="display:none;"></span>
			</div>`);
		$row = page.wrapper.find(".imogi-cashier-table-row");
		page.$table_select = $row.find(".imogi-cashier-table-select");
		page.$table_chip = $row.find(".imogi-cashier-table-chip");
		page.$table_select.on("change", function () {
			page.selected_table = $(this).val() || "";
			const label = $(this).find("option:selected").data("label") || "";
			page.$table_chip.toggle(!!page.selected_table).text(label);
		});
	}
	$row.toggle(show);
	if (show) imogi_pos.cashier_extras.load_tables(page);
};

imogi_pos.cashier_extras.toggle_table_row = function (page) {
	imogi_pos.cashier_extras.render_table_row(page);
};

imogi_pos.cashier_extras.load_tables = function (page) {
	if (page._tables_loaded) return;
	frappe.call({
		method: "imogi_pos.api.table_api.list_restaurant_tables",
		args: { company: page.context?.company },
		callback(r) {
			const tables = (r.message || {}).tables || [];
			const opts = [`<option value="">${__("Pilih meja")}</option>`]
				.concat(
					tables.map((t) => {
						const label = `${t.table_number}${t.location ? ` · ${t.location}` : ""} (${t.status})`;
						return `<option value="${frappe.utils.escape_html(t.name)}" data-label="${frappe.utils.escape_html(
							t.table_number
						)}">${frappe.utils.escape_html(label)}</option>`;
					})
				)
				.join("");
			page.$table_select?.html(opts);
			page._tables_loaded = true;
		},
	});
};

imogi_pos.cashier_extras.render_split_button = function (page) {
	let $btn = page.wrapper.find(".imogi-cashier-split-btn");
	if (!$btn.length) {
		page.wrapper.find(".imogi-cashier-total-row").before(`
			<button type="button" class="btn btn-xs btn-default imogi-cashier-split-btn mb-2" style="width:100%">
				<i class="fa fa-scissors"></i> ${__("Split Bill")}
			</button>`);
		$btn = page.wrapper.find(".imogi-cashier-split-btn");
		$btn.on("click", () => imogi_pos.cashier_extras.open_split_bill(page));
	}
	const on = page.feature_allowed("split_bill");
	$btn.toggleClass("is-tier-locked", !on).prop("disabled", !on).toggle(page.cart.length > 1);
};

imogi_pos.cashier_extras.open_split_bill = function (page) {
	if (!page.require_feature("split_bill")) return;
	if (page.cart.length < 2) {
		frappe.show_alert({ message: __("Minimal 2 item untuk split bill"), indicator: "orange" });
		return;
	}
	const rows = page.cart
		.map(
			(row, idx) => `<label class="checkbox-inline" style="display:block;margin-bottom:6px;">
			<input type="checkbox" class="imogi-split-item" data-idx="${idx}" checked>
			${frappe.utils.escape_html(row.item_name)} × ${row.qty}
		</label>`
		)
		.join("");
	const d = new frappe.ui.Dialog({
		title: __("Split Bill"),
		fields: [
			{
				fieldtype: "HTML",
				options: `<p class="text-muted small">${__(
					"Pilih item yang akan dibayar sekarang. Sisanya tetap di keranjang."
				)}</p>${rows}`,
			},
		],
		primary_action_label: __("Bayar Terpilih"),
		primary_action() {
			const picked = [];
			const remain = [];
			d.$wrapper.find(".imogi-split-item").each(function () {
				const idx = cint($(this).data("idx"));
				if ($(this).is(":checked")) picked.push(page.cart[idx]);
				else remain.push(page.cart[idx]);
			});
			if (!picked.length) {
				frappe.msgprint(__("Pilih minimal 1 item"));
				return;
			}
			page.cart = picked;
			page.render_cart();
			d.hide();
			page.open_payment_dialog();
			frappe.show_alert({
				message: __("Setelah bayar, sisa {0} item bisa dilanjutkan", [remain.length]),
				indicator: "blue",
			});
			page._split_remainder = remain;
			const origClear = page.clear_cart_after_checkout;
			page.clear_cart_after_checkout = function () {
				origClear.call(page);
				if (page._split_remainder && page._split_remainder.length) {
					page.cart = page._split_remainder;
					page._split_remainder = null;
					page.render_cart();
				}
				page.clear_cart_after_checkout = origClear;
			};
		},
	});
	d.show();
};

imogi_pos.cashier_extras.setup_multi_payment_ui = function (page) {
	const $foot = page.wrapper.find(".imogi-pay-dialog .modal-body");
	if (!$foot.length || !page.feature_allowed("multi_payment")) return;
	let $wrap = $foot.find(".imogi-pay-multi-wrap");
	if (!$wrap.length) {
		$foot.append(`
			<div class="imogi-pay-multi-wrap">
				<label class="checkbox-inline small">
					<input type="checkbox" class="imogi-pay-multi-toggle"> ${__("Multi Payment")}
				</label>
				<div class="imogi-pay-multi-panel" style="display:none;">
					<div class="imogi-pay-multi-rows"></div>
					<button type="button" class="btn btn-xs btn-default imogi-pay-multi-add">+ ${__("Metode")}</button>
				</div>
			</div>`);
		$wrap = $foot.find(".imogi-pay-multi-wrap");
	}
	const modes = (page.context?.payment_modes || []).map((m) => m.mode_of_payment);
	const buildRow = (mode, amount) => `
		<div class="imogi-pay-multi-row">
			<select class="form-control input-sm imogi-pay-multi-mode">${modes
				.map(
					(m) =>
						`<option value="${frappe.utils.escape_html(m)}"${
							m === mode ? " selected" : ""
						}>${frappe.utils.escape_html(m)}</option>`
				)
				.join("")}</select>
			<input type="number" min="0" step="any" class="form-control input-sm imogi-pay-multi-amount" value="${amount || ""}" />
		</div>`;

	$wrap.find(".imogi-pay-multi-toggle").off("change").on("change", function () {
		const on = $(this).is(":checked");
		$wrap.find(".imogi-pay-multi-panel").toggle(on);
		if (on && !$wrap.find(".imogi-pay-multi-row").length) {
			$wrap.find(".imogi-pay-multi-rows").html(buildRow(modes[0], ""));
			$wrap.find(".imogi-pay-multi-rows").append(buildRow(modes[1] || modes[0], ""));
		}
	});
	$wrap.find(".imogi-pay-multi-add").off("click").on("click", () => {
		$wrap.find(".imogi-pay-multi-rows").append(buildRow(modes[0], ""));
	});
};

imogi_pos.cashier_extras.get_multi_payments = function (page, dialog, total) {
	const $wrap = dialog.$wrapper.find(".imogi-pay-multi-wrap");
	if (!$wrap.length || !$wrap.find(".imogi-pay-multi-toggle").is(":checked")) return null;
	const rows = [];
	$wrap.find(".imogi-pay-multi-row").each(function () {
		const mode = $(this).find(".imogi-pay-multi-mode").val();
		const amount = flt($(this).find(".imogi-pay-multi-amount").val());
		if (mode && amount > 0) rows.push({ mode_of_payment: mode, amount });
	});
	if (rows.length < 2) return null;
	const sum = rows.reduce((s, r) => s + flt(r.amount), 0);
	if (Math.abs(sum - total) > 0.01) {
		frappe.msgprint(__("Total multi payment harus sama dengan {0}", [format_currency(total)]));
		return [];
	}
	return rows;
};

imogi_pos.cashier_extras.checkout_with_payments = function (page, dialog, payments, total, paid_amount) {
	page.busy = true;
	page.update_mobile_dock();
	dialog.get_primary_btn().prop("disabled", true);
	const args = imogi_pos.cashier_extras.build_checkout_args(page, {
		payments: JSON.stringify(payments),
		total,
	});
	imogi_pos.cashier_extras.run_checkout_call(page, dialog, args, payments[0]?.mode_of_payment, total, paid_amount);
};

imogi_pos.cashier_extras.build_checkout_args = function (page, extra = {}) {
	const args = {
		items: JSON.stringify(
			page.cart.map((row) => ({
				item_code: row.item_code,
				qty: row.qty,
				rate: row.rate,
				uom: row.uom || undefined,
			}))
		),
		payments: JSON.stringify([{ mode_of_payment: "Cash", amount: page.get_cart_total() }]),
		...page.branch_api_args(),
		...extra,
	};
	if (page.selected_customer) args.customer = page.selected_customer;
	if (page.discount_type) {
		args.discount_type = page.discount_type;
		args.discount_value = page.discount_value;
	}
	if (page.voucher_code) args.voucher_code = page.voucher_code;
	if (page.loyalty_points_redeem) args.loyalty_points_redeem = page.loyalty_points_redeem;
	args.order_type = page.order_type || "Takeaway";
	if (page.marketplace_order_name) args.marketplace_order_name = page.marketplace_order_name;
	if (page.selected_table) args.restaurant_table = page.selected_table;
	if (page._pending_approval_code) args.approval_code = page._pending_approval_code;
	return args;
};

imogi_pos.cashier_extras.run_checkout_call = function (page, dialog, args, mode_of_payment, total, paid_amount) {
	frappe.call({
		method: "imogi_pos.api.cashier.checkout",
		args,
		freeze: true,
		freeze_message: __("Memproses pembayaran..."),
		callback(r) {
			page.busy = false;
			page.update_mobile_dock();
			if (r.exc) {
				dialog.get_primary_btn().prop("disabled", false);
				const msg = (r._server_messages || "").toString();
				if (msg.includes("Perlu Approval") || msg.includes("approval")) {
					imogi_pos.cashier_extras.prompt_supervisor_pin(page, (code) => {
						page._pending_approval_code = code;
						args.approval_code = code;
						imogi_pos.cashier_extras.run_checkout_call(
							page,
							dialog,
							args,
							mode_of_payment,
							total,
							paid_amount
						);
					});
					return;
				}
				if (imogi_pos.feature_upgrade) imogi_pos.feature_upgrade.from_server_error(page, r.exc);
				return;
			}
			page._pending_approval_code = null;
			dialog.hide();
			const change =
				page.is_cash_mode(mode_of_payment) && flt(paid_amount) > total ? flt(paid_amount) - total : 0;
			page.show_success(r.message || {}, { change, paid_amount: flt(paid_amount) });
			page.refresh_sales_target();
			page.clear_cart_after_checkout();
			page.refresh_marketplace_badge();
		},
	});
};

imogi_pos.cashier_extras.prompt_supervisor_pin = function (page, done) {
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
					approval_type: "Discount",
					reason: __("Diskon kasir"),
					amount: page.get_cart_total(),
				},
				callback(req) {
					const name = (req.message || {}).name;
					frappe.call({
						method: "imogi_pos.api.approval_api.approve_with_pin",
						args: { request_name: name, pin: values.pin },
						callback() {
							done(name);
						},
					});
				},
			});
		},
		__("Approval Supervisor"),
		__("Setujui")
	);
};

$(document).on("app_ready", () => {
	imogi_pos.cashier_extras.patch();
});
