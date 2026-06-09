// Copyright (c) 2026, Imogi and contributors

frappe.provide("imogi_pos.qris");

imogi_pos.qris.is_qris_mode = function (page, mode_of_payment) {
	if (!mode_of_payment) return false;
	const name = String(mode_of_payment).toLowerCase();
	return name.includes("qris") || (page?.context?.payment_gateway_enabled && name.includes("wallet"));
};

imogi_pos.qris.open_dialog = function (page, opts) {
	const { items, total, mode_of_payment, discount_type, discount_value, voucher_code, loyalty_points_redeem, on_success } = opts;
	let poll_timer = null;

	const dialog = new frappe.ui.Dialog({
		title: __("Bayar QRIS"),
		fields: [
			{
				fieldtype: "HTML",
				options: `<div class="imogi-qris-wrap text-center">
					<div class="imogi-qris-amount h4">${format_currency(total)}</div>
					<div class="imogi-qris-status text-muted">${__("Membuat QR...")}</div>
					<div class="imogi-qris-image my-3"></div>
					<div class="imogi-qris-hint small text-muted">${__(
						"Minta pelanggan scan QR. Pembayaran akan otomatis terdeteksi."
					)}</div>
				</div>`,
			},
		],
		primary_action_label: __("Tutup"),
		primary_action() {
			if (poll_timer) clearInterval(poll_timer);
			dialog.hide();
		},
	});

	dialog.show();
	const $wrap = dialog.$wrapper;
	const 	args = {
		items: JSON.stringify(items),
		mode_of_payment,
		discount_type: discount_type || undefined,
		discount_value: discount_value || undefined,
		voucher_code: voucher_code || page.voucher_code || undefined,
		loyalty_points_redeem: loyalty_points_redeem || page.loyalty_points_redeem || 0,
		...page.branch_api_args(),
	};
	if (page.selected_customer) args.customer = page.selected_customer;

	frappe.call({
		method: "imogi_pos.api.payment_gateway_api.create_qris_payment",
		args,
		freeze: true,
		callback(r) {
			if (r.exc) return;
			const msg = r.message || {};
			$wrap.find(".imogi-qris-status").text(__("Menunggu pembayaran..."));
			imogi_pos.qris._render_qr($wrap.find(".imogi-qris-image"), msg);

			poll_timer = setInterval(() => {
				frappe.call({
					method: "imogi_pos.api.payment_gateway_api.poll_gateway_payment",
					args: { payment_name: msg.name },
					callback(res) {
						const row = res.message || {};
						if (row.status === "Paid") {
							clearInterval(poll_timer);
							$wrap.find(".imogi-qris-status").text(__("Pembayaran berhasil"));
							dialog.hide();
							if (row.order) {
								frappe.call({
									method: "imogi_pos.api.payment_gateway_api.get_gateway_order",
									args: { order_name: row.order },
									callback(or) {
										on_success && on_success(or.message || { name: row.order, status: "Completed" });
									},
								});
							} else {
								on_success && on_success({ name: row.order, status: "Completed" });
							}
						} else if (row.status === "Failed") {
							clearInterval(poll_timer);
							$wrap.find(".imogi-qris-status").text(__("Pembayaran gagal / kedaluwarsa"));
						}
					},
				});
			}, 3000);
		},
	});
};

imogi_pos.qris._render_qr = function ($el, msg) {
	$el.empty();
	if (msg.qr_url) {
		$el.html(`<img src="${frappe.utils.escape_html(msg.qr_url)}" alt="QRIS" style="max-width:240px">`);
		return;
	}
	if (msg.qr_string) {
		if (msg.qr_string.startsWith("http")) {
			$el.html(`<img src="${frappe.utils.escape_html(msg.qr_string)}" alt="QRIS" style="max-width:240px">`);
		} else {
			$el.html(
				`<div class="small text-muted">${__("QR string")}</div><code style="word-break:break-all;font-size:10px">${frappe.utils.escape_html(
					msg.qr_string.slice(0, 200)
				)}</code>`
			);
		}
	}
};
