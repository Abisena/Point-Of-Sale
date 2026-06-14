frappe.pages["imogi-pos-order-history"].on_page_load = function (wrapper) {
	const page = imogi_pos.page_shell.make_page(wrapper, __("Riwayat Order"), "imogi-pos-order-history");
	const $content = imogi_pos.page_shell.render_hero(page.main, {
		title: __("Riwayat Order"),
		subtitle: __("Daftar transaksi kasir"),
		actions_html: `<a class="imogi-web-btn imogi-web-btn-ghost" href="/app/imogi-pos-cashier"><i class="fa fa-shopping-cart"></i> ${__(
			"Kembali ke Kasir"
		)}</a>
		<button type="button" class="imogi-web-btn imogi-web-btn-ghost imogi-oh-logout-btn"><i class="fa fa-sign-out"></i> ${__(
			"Logout"
		)}</button>`,
	});
	const $shell = page.main.find(".imogi-web-shell");
	if ($shell.length && imogi_pos.page_shell.init_cashier_page) {
		imogi_pos.page_shell.init_cashier_page($shell, __("Riwayat Order"));
	}

	const $panel = $(`
		<div class="imogi-web-panel">
			<div class="imogi-web-panel-head">
				<div class="imogi-web-panel-title">${__("Transaksi")}</div>
				<div class="imogi-web-toolbar" style="margin:0">
					<input type="search" class="imogi-web-search imogi-oh-search" placeholder="${__("Cari no. order / customer...")}">
					<button type="button" class="imogi-web-btn imogi-web-btn-ghost imogi-oh-refresh">${__("Muat ulang")}</button>
				</div>
			</div>
			<div class="imogi-web-panel-body imogi-oh-body">
				<div class="imogi-web-empty">${__("Memuat...")}</div>
			</div>
		</div>
	`);
	$content.append($panel);

	const render_meta_item = (label, value) =>
		`<div class="imogi-oh-detail-meta-item"><label>${label}</label><span>${value}</span></div>`;

	const render_order_detail_html = (order) => {
		const items = order.items || [];
		const payments = order.payments || [];
		const item_rows = items.length
			? items
					.map(
						(row) => `<tr>
							<td>${frappe.utils.escape_html(row.item_name || row.item_code || "")}</td>
							<td>${flt(row.qty)} ${frappe.utils.escape_html(row.uom || "")}</td>
							<td>${format_currency(row.rate || 0)}</td>
							<td>${format_currency(row.amount || flt(row.rate) * flt(row.qty))}</td>
						</tr>`
					)
					.join("")
			: `<tr><td colspan="4" class="text-muted">${__("Tidak ada item")}</td></tr>`;

		const payment_rows = payments.length
			? payments
					.map(
						(row) => `<tr>
							<td>${frappe.utils.escape_html(row.mode_of_payment || "-")}</td>
							<td>${format_currency(row.amount || 0)}</td>
						</tr>`
					)
					.join("")
			: `<tr><td colspan="2" class="text-muted">${__("Belum ada pembayaran")}</td></tr>`;

		const discount_rows = [];
		if (flt(order.discount_amount) > 0) {
			discount_rows.push(
				`<div class="imogi-oh-detail-total-row"><span>${__("Diskon")}</span><strong>- ${format_currency(
					order.discount_amount
				)}</strong></div>`
			);
		}
		if (flt(order.voucher_discount_amount) > 0) {
			discount_rows.push(
				`<div class="imogi-oh-detail-total-row"><span>${__("Voucher")}${
					order.voucher_code ? ` (${frappe.utils.escape_html(order.voucher_code)})` : ""
				}</span><strong>- ${format_currency(order.voucher_discount_amount)}</strong></div>`
			);
		}
		if (flt(order.loyalty_discount_amount) > 0) {
			discount_rows.push(
				`<div class="imogi-oh-detail-total-row"><span>${__("Poin loyalty")}</span><strong>- ${format_currency(
					order.loyalty_discount_amount
				)}</strong></div>`
			);
		}

		const pos_invoice_html = order.pos_invoice
			? `<a class="imogi-oh-detail-link" href="/app/pos-invoice/${encodeURIComponent(order.pos_invoice)}">${frappe.utils.escape_html(
					order.pos_invoice
			  )}</a>`
			: "-";

		return `<div class="imogi-oh-detail">
			<div class="imogi-oh-detail-head">
				<div class="imogi-oh-detail-order">${frappe.utils.escape_html(order.name || "")}</div>
				<span class="imogi-web-chip">${frappe.utils.escape_html(order.status || "")}</span>
			</div>
			<div class="imogi-oh-detail-meta">
				${render_meta_item(__("Tanggal"), frappe.datetime.str_to_user(order.creation))}
				${render_meta_item(__("Customer"), frappe.utils.escape_html(order.customer_name || order.customer || "-"))}
				${render_meta_item(__("Tipe Order"), frappe.utils.escape_html(order.order_type || "-"))}
				${render_meta_item(__("Channel"), frappe.utils.escape_html(order.order_channel || "-"))}
				${render_meta_item(__("POS Invoice"), pos_invoice_html)}
				${render_meta_item(__("Dibayar"), format_currency(order.paid_amount || 0))}
			</div>
			<div class="imogi-oh-detail-section">${__("Item")}</div>
			<table class="imogi-web-table imogi-oh-detail-items">
				<thead><tr>
					<th>${__("Produk")}</th><th>${__("Qty")}</th><th>${__("Harga")}</th><th>${__("Subtotal")}</th>
				</tr></thead>
				<tbody>${item_rows}</tbody>
			</table>
			<div class="imogi-oh-detail-section">${__("Pembayaran")}</div>
			<table class="imogi-web-table imogi-oh-detail-items">
				<thead><tr><th>${__("Metode")}</th><th>${__("Jumlah")}</th></tr></thead>
				<tbody>${payment_rows}</tbody>
			</table>
			<div class="imogi-oh-detail-totals">
				<div class="imogi-oh-detail-total-row"><span>${__("Subtotal")}</span><strong>${format_currency(
					order.subtotal || 0
				)}</strong></div>
				${discount_rows.join("")}
				<div class="imogi-oh-detail-total-row is-grand"><span>${__("Grand Total")}</span><strong>${format_currency(
					order.grand_total || 0
				)}</strong></div>
			</div>
		</div>`;
	};

	const show_order_detail = (order_name) => {
		if (!order_name) return;
		frappe.call({
			method: "imogi_pos.api.free_tier_api.get_order_history_detail",
			args: { order_name },
			freeze: true,
			freeze_message: __("Memuat detail..."),
			callback(r) {
				if (r.exc) return;
				const order = r.message || {};
				const dialog = new frappe.ui.Dialog({
					title: __("Detail Transaksi"),
					size: "large",
					fields: [{ fieldtype: "HTML", options: render_order_detail_html(order) }],
					primary_action_label: __("Tutup"),
					primary_action() {
						dialog.hide();
					},
				});
				dialog.$wrapper.addClass("imogi-oh-detail-dialog");
				dialog.show();
				dialog.$wrapper.find(".modal-footer .btn-primary").removeClass("btn-primary").addClass("btn-default");
			},
		});
	};

	const load = () => {
		frappe.call({
			method: "imogi_pos.api.free_tier_api.list_order_history",
			args: { limit: 100 },
			callback(r) {
				const rows = (r.message || {}).orders || [];
				const term = ($panel.find(".imogi-oh-search").val() || "").trim().toLowerCase();
				const filtered = term
					? rows.filter(
							(row) =>
								String(row.name || "").toLowerCase().includes(term) ||
								String(row.customer_name || "").toLowerCase().includes(term)
					  )
					: rows;
				if (!filtered.length) {
					$panel.find(".imogi-oh-body").html(`<div class="imogi-web-empty">${__("Belum ada order")}</div>`);
					return;
				}
				const html = [`<table class="imogi-web-table"><thead><tr>
					<th>${__("Order")}</th><th>${__("Tanggal")}</th><th>${__("Status")}</th><th>${__("Customer")}</th><th>${__("Total")}</th><th class="imogi-oh-col-action"></th>
				</tr></thead><tbody>`];
				filtered.forEach((row) => {
					html.push(`<tr>
						<td><a href="/app/riwayat-order/${encodeURIComponent(row.name)}">${frappe.utils.escape_html(row.name)}</a></td>
						<td>${frappe.datetime.str_to_user(row.creation)}</td>
						<td><span class="imogi-web-chip">${frappe.utils.escape_html(row.status || "")}</span></td>
						<td>${frappe.utils.escape_html(row.customer_name || "-")}</td>
						<td>${format_currency(row.grand_total || 0)}</td>
						<td class="imogi-oh-col-action">
							<button type="button" class="imogi-oh-view-btn" data-order="${frappe.utils.escape_html(
								row.name
							)}" title="${__("Lihat detail")}" aria-label="${__("Lihat detail")}">
								<i class="fa fa-eye"></i>
							</button>
						</td>
					</tr>`);
				});
				html.push("</tbody></table>");
				$panel.find(".imogi-oh-body").html(html.join(""));
			},
		});
	};

	$panel.on("click", ".imogi-oh-view-btn", function (e) {
		e.preventDefault();
		e.stopPropagation();
		show_order_detail($(this).data("order"));
	});

	$panel.find(".imogi-oh-refresh").on("click", load);
	$panel.find(".imogi-oh-search").on("input", frappe.utils.debounce(load, 300));
	page.main.find(".imogi-oh-logout-btn").on("click", () => imogi_pos.logout_cashier?.({ shift_active: true }));
	load();
};
