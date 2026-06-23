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
		.imogi-pay-multi-qris-panel{background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px;margin-bottom:12px;padding:12px}
		.imogi-pay-success-payment-lines{display:flex;flex-direction:column;gap:4px;margin-top:4px}
		.imogi-pay-success-payment-line{align-items:center;display:flex;gap:8px;justify-content:space-between}
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

	const origApplyContext = proto.apply_cashier_context;
	proto.apply_cashier_context = function (context) {
		origApplyContext.call(this, context);
		imogi_pos.cashier_extras.apply_table_prefill(this);
	};

	const origClearCart = proto.clear_cart_after_checkout;
	proto.clear_cart_after_checkout = function () {
		origClearCart.call(this);
		this.selected_table = "";
		this._tables_loaded = false;
		if (this.$table_select?.length) {
			this.$table_select.val("");
			this.$table_chip?.hide().text("");
		}
		imogi_pos.cashier_extras.load_tables(this, { force: true });
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
	proto.open_payment_dialog = function (options) {
		const result = origOpenPayment.call(this, options);
		const page = this;
		setTimeout(() => {
			const $dlg = $(".imogi-pay-dialog:visible").last();
			if ($dlg.length) {
				imogi_pos.cashier_extras.setup_multi_payment_ui(page, { $wrapper: $dlg });
			}
		}, 0);
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

imogi_pos.cashier_extras.load_tables = function (page, opts = {}) {
	if (page._tables_loaded && !opts.force) return;
	frappe.call({
		method: "imogi_pos.api.table_api.list_restaurant_tables",
		args: { company: page.context?.company, include_occupied: 0 },
		callback(r) {
			const tables = (r.message || {}).tables || [];
			const opts_html = [`<option value="">${__("Pilih meja")}</option>`]
				.concat(
					tables.map((t) => {
						const label = `${t.table_number}${t.location ? ` · ${t.location}` : ""}`;
						return `<option value="${frappe.utils.escape_html(t.name)}" data-label="${frappe.utils.escape_html(
							t.table_number
						)}">${frappe.utils.escape_html(label)}</option>`;
					})
				)
				.join("");
			page.$table_select?.html(opts_html);
			if (page.selected_table) {
				page.$table_select?.val(page.selected_table);
				const label = page.$table_select?.find("option:selected").data("label") || "";
				page.$table_chip?.toggle(!!page.selected_table).text(label);
			}
			page._tables_loaded = true;
		},
	});
};

imogi_pos.cashier_extras.apply_table_prefill = function (page) {
	let prefill = null;
	try {
		const raw = localStorage.getItem("_imogi_pos_cashier_prefill");
		if (raw) {
			prefill = JSON.parse(raw);
			localStorage.removeItem("_imogi_pos_cashier_prefill");
		}
	} catch (e) {
		prefill = null;
	}
	if (!prefill || !prefill.restaurant_table) return;
	if (typeof page.set_order_type === "function") {
		page.set_order_type("Dine-in", true);
	}
	page.selected_table = prefill.restaurant_table;
	if (prefill.customer_label) {
		page.wrapper.find(".imogi-cashier-customer-search").val(prefill.customer_label);
	}
	page._tables_loaded = false;
	imogi_pos.cashier_extras.render_table_row(page);
	imogi_pos.cashier_extras.load_tables(page, { force: true });
};

imogi_pos.cashier_extras.render_split_button = function (page) {
	let $btn = page.wrapper.find(".imogi-cashier-split-btn");
	if (!$btn.length) {
		page.wrapper.find(".imogi-cashier-total-row").before(`
			<button type="button" class="btn btn-xs btn-default imogi-cashier-split-btn mb-2" style="width:100%">
				<i class="fa fa-scissors"></i> ${__("Split Bill")}
			</button>`);
		$btn = page.wrapper.find(".imogi-cashier-split-btn");
		$btn.on("click", () => page.open_payment_dialog({ tab: "split" }));
	}
	const on = page.feature_allowed("split_bill");
	$btn.toggleClass("is-tier-locked", !on).prop("disabled", !on).toggle(page.cart.length > 0);
};

imogi_pos.cashier_extras.open_split_bill = function (page) {
	if (!page.require_feature("split_bill")) return;
	if (!page.cart.length) {
		frappe.show_alert({ message: __("Keranjang kosong"), indicator: "orange" });
		return;
	}
	page.open_payment_dialog({ tab: "split" });
};

imogi_pos.cashier_extras.get_active_payment_dialog = function () {
	return $(".imogi-pay-dialog:visible").last();
};

imogi_pos.cashier_extras.setup_multi_payment_ui = function (page, dialog) {
	if (typeof page?.render_multi_payment_panel === "function") {
		page.render_multi_payment_panel(dialog, page.get_cart_subtotal?.() || 0);
	}
};

imogi_pos.cashier_extras._legacy_setup_multi_payment_ui = function (page, dialog) {
	const $dlg = dialog?.$wrapper || imogi_pos.cashier_extras.get_active_payment_dialog();
	const $stack = $dlg.find(".imogi-pay-multi-slot, .imogi-pay-checkout-stack").first();
	if (!$stack.length) return;
	if (!page.feature_allowed("multi_payment")) return;

	let $wrap = $stack.find(".imogi-pay-multi-wrap");
	if (!$wrap.length) {
		$stack.html(`
			<div class="imogi-pay-multi-wrap">
				<div class="imogi-pay-block-title"><i class="fa fa-credit-card"></i> ${__("Alokasi Pembayaran")}</div>
				<div class="imogi-pay-multi-hint">${__(
					"Bagi total tagihan ke beberapa metode bayar. Jumlah semua baris harus sama dengan total."
				)}</div>
				<div class="imogi-pay-multi-rows"></div>
				<div class="imogi-pay-multi-actions" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
					<button type="button" class="btn btn-xs btn-default imogi-pay-multi-add">+ ${__("Tambah Metode")}</button>
					<button type="button" class="btn btn-xs btn-default imogi-pay-multi-fill">${__("Isi Sisa")}</button>
				</div>
				<div class="imogi-pay-multi-sum"></div>
			</div>`);
		$wrap = $stack.find(".imogi-pay-multi-wrap");
	}

	const modes = (page.context?.payment_modes || []).map((m) => m.mode_of_payment);
	if (!modes.length) {
		$wrap.find(".imogi-pay-multi-rows").html(
			`<div class="text-muted small">${__(
				"Belum ada Mode of Payment di POS Profile. Tambahkan minimal 2 metode di pengaturan POS."
			)}</div>`
		);
		return;
	}

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
			<input type="number" min="0" step="any" class="form-control input-sm imogi-pay-multi-amount" value="${amount || ""}" placeholder="0" />
		</div>`;

	const $rows = $wrap.find(".imogi-pay-multi-rows");
	if (!$rows.find(".imogi-pay-multi-row").length) {
		$rows.html(buildRow(modes[0], ""));
		$rows.append(buildRow(modes[1] || modes[0], ""));
	}
};

imogi_pos.cashier_extras.get_multi_payments = function (page, dialog, total) {
	const $dlg = dialog?.$wrapper || imogi_pos.cashier_extras.get_active_payment_dialog();
	const $wrap = $dlg.find(".imogi-pay-multi-slot .imogi-pay-multi-wrap, .imogi-pay-checkout-stack .imogi-pay-multi-wrap").first();
	const multi_tab = dialog?._imogi_pay_tab === "multi";
	if (!$wrap.length || (!multi_tab && !$wrap.find(".imogi-pay-multi-toggle").is(":checked"))) return null;
	const rows = [];
	$wrap.find(".imogi-pay-multi-row").each(function () {
		const mode = $(this).find(".imogi-pay-multi-mode").val();
		const amount = flt($(this).find(".imogi-pay-multi-amount").val());
		if (mode && amount > 0) rows.push({ mode_of_payment: mode, amount });
	});
	if (rows.length < 2) {
		frappe.msgprint(__("Isi minimal 2 metode pembayaran dengan nominal lebih dari 0"));
		return [];
	}
	const sum = rows.reduce((s, r) => s + flt(r.amount), 0);
	if (Math.abs(sum - total) > 0.01) {
		frappe.msgprint(__("Total multi payment harus sama dengan {0}", [format_currency(total)]));
		return [];
	}
	return rows;
};

imogi_pos.cashier_extras.checkout_with_payments = function (page, dialog, payments, total, paid_amount) {
	const qrisRows = payments.filter((p) => page.is_qris_payment_mode?.(p.mode_of_payment));
	const qrisAmount = qrisRows.reduce((s, p) => s + flt(p.amount), 0);
	if (qrisAmount > 0) {
		if (!page.context?.payment_gateway_enabled || !page.feature_allowed?.("qris")) {
			frappe.msgprint(__("Alokasi QRIS memerlukan gateway pembayaran yang aktif"));
			return;
		}
		if (!dialog._imogi_multi_qris_paid) {
			return imogi_pos.cashier_extras.start_multi_qris_checkout(
				page,
				dialog,
				payments,
				total,
				paid_amount,
				qrisAmount,
				qrisRows[0]?.mode_of_payment
			);
		}
	}

	page.busy = true;
	page.update_mobile_dock();
	dialog.get_primary_btn().prop("disabled", true);
	const args = imogi_pos.cashier_extras.build_checkout_args(page, {
		payments: JSON.stringify(payments),
		total,
	});
	imogi_pos.cashier_extras.run_checkout_call(page, dialog, args, payments, total, paid_amount);
};

imogi_pos.cashier_extras.start_multi_qris_checkout = function (
	page,
	dialog,
	payments,
	total,
	paid_amount,
	qrisAmount,
	qrisMode
) {
	if (!page.require_feature("qris")) return;
	if (!page.context?.payment_gateway_enabled) {
		frappe.msgprint(__("Gateway pembayaran belum diaktifkan"));
		return;
	}
	if (typeof imogi_pos === "undefined" || !imogi_pos.qris?._render_qr) {
		frappe.msgprint(__("Modul QRIS belum dimuat. Muat ulang halaman."));
		return;
	}

	dialog._imogi_pending_multi_payments = payments;
	dialog._imogi_pending_multi_total = total;
	dialog._imogi_pending_multi_paid = paid_amount;

	const $wrap = dialog.$wrapper.find(".imogi-pay-multi-wrap");
	if (!$wrap.length) {
		frappe.msgprint(__("Panel multi payment tidak ditemukan"));
		return;
	}

	let $qrPanel = $wrap.find(".imogi-pay-multi-qris-panel");
	if (!$qrPanel.length) {
		$wrap.prepend(`<div class="imogi-pay-multi-qris-panel">
			<div class="imogi-pay-block-title"><i class="fa fa-qrcode"></i> ${__("Scan QRIS")} — <span class="imogi-pay-multi-qris-amount"></span></div>
			<div class="imogi-pay-qris-inline-status small text-muted" style="margin-bottom:8px"></div>
			<div class="imogi-pay-qris-inline-image" style="text-align:center"></div>
		</div>`);
		$qrPanel = $wrap.find(".imogi-pay-multi-qris-panel");
	}
	$qrPanel.show();
	$qrPanel.find(".imogi-pay-multi-qris-amount").text(format_currency(qrisAmount));

	const $status = $qrPanel.find(".imogi-pay-qris-inline-status");
	const $image = $qrPanel.find(".imogi-pay-qris-inline-image");
	const subtotal = page.get_cart_subtotal?.() || 0;

	if (
		dialog._imogi_multi_qris_payment_name &&
		dialog._imogi_multi_qris_amount === qrisAmount &&
		!dialog._imogi_multi_qris_paid
	) {
		frappe.show_alert({ message: __("Scan QRIS untuk melanjutkan pembayaran"), indicator: "blue" });
		return;
	}

	page.stop_inline_qris_poll?.(dialog);
	dialog._imogi_multi_qris_payment_name = null;
	dialog._imogi_multi_qris_amount = qrisAmount;
	dialog._imogi_multi_qris_paid = false;

	$status.text(__("Membuat QR..."));
	$image.empty();
	dialog.get_primary_btn()?.prop("disabled", true);

	const discount_state = page.get_payment_discount_state?.(dialog) || {};
	const args = {
		items: JSON.stringify(
			(page.get_checkout_cart ? page.get_checkout_cart() : page.cart).map((row) => ({
				item_code: row.item_code,
				qty: row.qty,
				rate: row.rate,
				uom: row.uom || undefined,
			}))
		),
		mode_of_payment: qrisMode || "QRIS",
		amount: qrisAmount,
		checkout_mode: "multi_pending",
		pending_payments: JSON.stringify(payments),
		discount_type: discount_state.type || undefined,
		discount_value: discount_state.value || undefined,
		...page.branch_api_args(),
	};
	if (page.selected_customer) args.customer = page.selected_customer;
	if (page.context?.loyalty_enabled && imogi_pos.loyalty) {
		const promo = imogi_pos.loyalty.get_promo_state(dialog);
		if (promo.voucher_code) args.voucher_code = promo.voucher_code;
		if (promo.loyalty_points_redeem) args.loyalty_points_redeem = promo.loyalty_points_redeem;
	} else {
		if (page.voucher_code) args.voucher_code = page.voucher_code;
		if (page.loyalty_points_redeem) args.loyalty_points_redeem = page.loyalty_points_redeem;
	}
	args.order_type = page.order_type || "Takeaway";
	args.order_channel = "Walk-in";
	if (dialog._imogi_pending_order_name || page.pending_checkout_order_name) {
		args.order_name = dialog._imogi_pending_order_name || page.pending_checkout_order_name;
	}

	frappe.call({
		method: "imogi_pos.api.payment_gateway_api.create_qris_payment",
		args,
		freeze: false,
		callback(r) {
			if (r.exc) {
				$status.text(__("Gagal membuat QR"));
				dialog.get_primary_btn()?.prop("disabled", false);
				return;
			}
			const msg = r.message || {};
			dialog._imogi_multi_qris_payment_name = msg.name;
			$status.text(__("Scan QRIS Rp {0} untuk melanjutkan", [format_currency(qrisAmount)]));
			imogi_pos.qris._render_qr($image, msg, { size: 180 });
			frappe.show_alert({ message: __("Scan QRIS untuk melanjutkan pembayaran"), indicator: "blue" });

			dialog._imogi_qris_poll_timer = setInterval(() => {
				if (dialog._imogi_multi_qris_paid) return;
				frappe.call({
					method: "imogi_pos.api.payment_gateway_api.poll_gateway_payment",
					args: { payment_name: msg.name },
					callback(res) {
						if (dialog._imogi_multi_qris_paid) return;
						if (res.exc) return;
						const row = res.message || {};
						if (row.status === "Paid") {
							imogi_pos.cashier_extras.finish_multi_qris_checkout(page, dialog, subtotal);
						} else if (row.status === "Failed") {
							page.stop_inline_qris_poll?.(dialog);
							dialog._imogi_multi_qris_payment_name = null;
							$status.text(__("Pembayaran gagal / kedaluwarsa"));
							dialog.get_primary_btn()?.prop("disabled", false);
						}
					},
				});
			}, 3000);
		},
	});
};

imogi_pos.cashier_extras.finish_multi_qris_checkout = function (page, dialog, subtotal) {
	if (dialog._imogi_multi_qris_paid) return;
	dialog._imogi_multi_qris_paid = true;
	page.stop_inline_qris_poll?.(dialog);

	const payments = dialog._imogi_pending_multi_payments || [];
	const total = dialog._imogi_pending_multi_total || page.get_payment_total?.(dialog, subtotal) || 0;
	const paid_amount = dialog._imogi_pending_multi_paid || total;

	const $status = dialog.$wrapper.find(".imogi-pay-multi-qris-panel .imogi-pay-qris-inline-status");
	$status.text(__("QRIS berhasil! Menyelesaikan pembayaran..."));

	imogi_pos.cashier_extras.checkout_with_payments(page, dialog, payments, total, paid_amount);
};

imogi_pos.cashier_extras.build_checkout_args = function (page, extra = {}) {
	const args = {
		items: JSON.stringify(
			(page.get_checkout_cart ? page.get_checkout_cart() : page.cart).map((row) => ({
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
	if (page.pending_checkout_order_name) args.order_name = page.pending_checkout_order_name;
	return args;
};

imogi_pos.cashier_extras.run_checkout_call = function (page, dialog, args, payments, total, paid_amount) {
	const payment_list = Array.isArray(payments)
		? payments
		: [{ mode_of_payment: payments, amount: total }];
	const primary_mode = payment_list[0]?.mode_of_payment;
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
							payment_list,
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
			dialog._imogi_checkout_completed = true;
			page.pending_checkout_order_name = null;
			dialog.hide();
			const cashRow = payment_list.find((p) => page.is_cash_mode?.(p.mode_of_payment));
			const change =
				cashRow && flt(paid_amount) > total ? flt(paid_amount) - total : 0;
			page.show_success(r.message || {}, {
				change,
				paid_amount: flt(paid_amount),
				mode_of_payment: payment_list.length === 1 ? primary_mode : null,
				payments: payment_list.length > 1 ? payment_list : null,
			});
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
