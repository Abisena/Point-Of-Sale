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
	let payment_done = false;

	const stop_poll = () => {
		if (poll_timer) {
			clearInterval(poll_timer);
			poll_timer = null;
		}
	};

	const finish_paid = (row) => {
		if (payment_done) return;
		payment_done = true;
		stop_poll();
		$wrap.find(".imogi-qris-status").text(__("Pembayaran berhasil"));
		dialog.hide();
		const order_name = row.order;
		if (order_name) {
			frappe.call({
				method: "imogi_pos.api.payment_gateway_api.get_gateway_order",
				args: { order_name },
				callback(or) {
					on_success && on_success(or.message || { name: order_name, status: "Completed" });
				},
			});
		} else {
			on_success && on_success({ name: order_name, status: "Completed" });
		}
	};

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
			stop_poll();
			dialog.hide();
		},
	});

	dialog.show();
	const $wrap = dialog.$wrapper;
	const args = {
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
				if (payment_done) return;
				frappe.call({
					method: "imogi_pos.api.payment_gateway_api.poll_gateway_payment",
					args: { payment_name: msg.name },
					callback(res) {
						if (payment_done) return;
						if (res.exc) return;
						const row = res.message || {};
						if (row.status === "Paid") {
							finish_paid(row);
						} else if (row.status === "Failed") {
							stop_poll();
							$wrap.find(".imogi-qris-status").text(__("Pembayaran gagal / kedaluwarsa"));
						}
					},
				});
			}, 3000);
		},
	});
};

imogi_pos.qris._render_qr = function ($el, msg, opts = {}) {
	const size = Math.max(120, Math.min(280, flt(opts.size) || 240));
	$el.empty();
	const qrImage = (msg.qr_image || "").trim();

	if (qrImage.startsWith("data:image/")) {
		$el.html(`<img src="${qrImage}" alt="QRIS" style="max-width:${size}px;height:auto">`);
		return;
	}
	const imageUrl = (msg.qr_url || "").trim();
	if (imageUrl && (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith("/"))) {
		$el.html(`<img src="${frappe.utils.escape_html(imageUrl)}" alt="QRIS" style="max-width:${size}px;height:auto">`);
		return;
	}
	const qrString = (msg.qr_string || "").trim();
	if (!qrString) return;
	if (/^https?:\/\//i.test(qrString)) {
		$el.html(`<img src="${frappe.utils.escape_html(qrString)}" alt="QRIS" style="max-width:${size}px">`);
		return;
	}
	const renderWithLib = () => {
		const $holder = $('<div class="imogi-qris-canvas d-inline-block"></div>');
		$el.append($holder);
		new QRCode($holder[0], {
			text: qrString,
			width: size,
			height: size,
			correctLevel: QRCode.CorrectLevel.L,
		});
	};
	if (typeof QRCode !== "undefined") {
		renderWithLib();
		return;
	}
	frappe.require("/assets/imogi_pos/js/qrcode.min.js").then(renderWithLib);
};
