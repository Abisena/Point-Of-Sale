frappe.pages["imogi-pos-order-history"].on_page_load = function (wrapper) {
	const page = imogi_pos.page_shell.make_page(wrapper, __("Riwayat Order"), "imogi-pos-order-history");
	let view_mode = "branch";
	const subtitle_for_mode = (mode) => {
		if (mode === "own") return __("Transaksi yang Anda layani di outlet ini");
		if (mode === "all") return __("Semua transaksi dari semua kasir dan cabang");
		if (mode === "area") return __("Transaksi cabang dalam area Anda");
		return __("Daftar transaksi kasir di outlet ini");
	};
	const $content = imogi_pos.page_shell.render_hero(page.main, {
		title: __("Riwayat Order"),
		subtitle: subtitle_for_mode(view_mode),
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

	const status_class = (status) => {
		const key = String(status || "")
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");
		if (key === "completed") return "is-completed";
		if (key === "awaiting-payment" || key === "paid") return "is-paid";
		if (key === "cancelled" || key === "void" || key === "refunded") return "is-cancelled";
		return key ? `is-${key}` : "is-default";
	};

	const render_meta_item = (label, value) =>
		`<div class="imogi-oh-detail-meta-item">
			<div class="imogi-oh-detail-meta-label">${label}</div>
			<div class="imogi-oh-detail-meta-value">${value}</div>
		</div>`;

	const render_order_detail_html = (order) => {
		const items = order.items || [];
		const payments = order.payments || [];
		const item_rows = items.length
			? items
					.map(
						(row) => `<tr>
							<td><span class="imogi-oh-item-name">${frappe.utils.escape_html(
								row.item_name || row.item_code || ""
							)}</span></td>
							<td>${flt(row.qty)} ${frappe.utils.escape_html(row.uom || "")}</td>
							<td>${format_currency(row.rate || 0)}</td>
							<td>${format_currency(row.amount || flt(row.rate) * flt(row.qty))}</td>
						</tr>`
					)
					.join("")
			: `<tr><td colspan="4">${__("Tidak ada item")}</td></tr>`;

		const payment_rows = payments.length
			? payments
					.map(
						(row) => `<tr>
							<td>${frappe.utils.escape_html(row.mode_of_payment || "-")}</td>
							<td>${format_currency(row.amount || 0)}</td>
						</tr>`
					)
					.join("")
			: `<tr><td colspan="2">${__("Belum ada pembayaran")}</td></tr>`;

		const discount_rows = [];
		if (flt(order.discount_amount) > 0) {
			discount_rows.push(
				`<div class="imogi-oh-detail-total-row is-discount"><span>${__("Diskon")}</span><strong>- ${format_currency(
					order.discount_amount
				)}</strong></div>`
			);
		}
		if (flt(order.voucher_discount_amount) > 0) {
			discount_rows.push(
				`<div class="imogi-oh-detail-total-row is-discount"><span>${__("Voucher")}${
					order.voucher_code ? ` (${frappe.utils.escape_html(order.voucher_code)})` : ""
				}</span><strong>- ${format_currency(order.voucher_discount_amount)}</strong></div>`
			);
		}
		if (flt(order.loyalty_discount_amount) > 0) {
			discount_rows.push(
				`<div class="imogi-oh-detail-total-row is-discount"><span>${__("Poin loyalty")}</span><strong>- ${format_currency(
					order.loyalty_discount_amount
				)}</strong></div>`
			);
		}

		const pos_invoice_html = order.pos_invoice
			? `<a class="imogi-oh-detail-link" href="/app/pos-invoice/${encodeURIComponent(order.pos_invoice)}">${frappe.utils.escape_html(
					order.pos_invoice
			  )}</a>`
			: "—";

		const status = order.status || "";
		const status_label = frappe.utils.escape_html(status || "—");

		return `<div class="imogi-oh-detail">
			<div class="imogi-oh-detail-hero">
				<div>
					<div class="imogi-oh-detail-order">${frappe.utils.escape_html(order.name || "")}</div>
					<div class="imogi-oh-detail-subtitle">${frappe.datetime.str_to_user(order.creation)}</div>
				</div>
				<span class="imogi-oh-status ${status_class(status)}">${status_label}</span>
			</div>
			<div class="imogi-oh-detail-meta">
				${render_meta_item(__("Customer"), frappe.utils.escape_html(order.customer_name || order.customer || "—"))}
				${render_meta_item(__("Kasir"), frappe.utils.escape_html(order.cashier_name || order.cashier || "—"))}
				${render_meta_item(__("Tipe Order"), frappe.utils.escape_html(order.order_type || "—"))}
				${render_meta_item(__("Channel"), frappe.utils.escape_html(order.order_channel || "—"))}
				${render_meta_item(__("POS Invoice"), pos_invoice_html)}
				${render_meta_item(__("Dibayar"), format_currency(order.paid_amount || 0))}
				${render_meta_item(__("Shift / Profile"), frappe.utils.escape_html(order.pos_profile || "—"))}
			</div>
			<div class="imogi-oh-detail-block">
				<div class="imogi-oh-detail-block-title">${__("Item")}</div>
				<div class="imogi-oh-detail-table-wrap">
					<table class="imogi-oh-detail-items">
						<thead><tr>
							<th>${__("Produk")}</th><th>${__("Qty")}</th><th>${__("Harga")}</th><th>${__("Subtotal")}</th>
						</tr></thead>
						<tbody>${item_rows}</tbody>
					</table>
				</div>
			</div>
			<div class="imogi-oh-detail-block">
				<div class="imogi-oh-detail-block-title">${__("Pembayaran")}</div>
				<div class="imogi-oh-detail-table-wrap">
					<table class="imogi-oh-detail-items imogi-oh-detail-items--pay">
						<thead><tr><th>${__("Metode")}</th><th>${__("Jumlah")}</th></tr></thead>
						<tbody>${payment_rows}</tbody>
					</table>
				</div>
			</div>
			<div class="imogi-oh-detail-summary">
				<div class="imogi-oh-detail-total-row"><span>${__("Subtotal")}</span><strong>${format_currency(
					order.subtotal || 0
				)}</strong></div>
				${discount_rows.join("")}
			</div>
			<div class="imogi-oh-detail-grand">
				<span>${__("Grand Total")}</span>
				<strong>${format_currency(order.grand_total || 0)}</strong>
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
				const item_count = (order.items || []).length;
				const payment_count = (order.payments || []).length;
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
				if (item_count + payment_count <= 12) {
					dialog.$wrapper.addClass("imogi-oh-detail-dialog--compact");
				}
				dialog.show();
				dialog.$wrapper.find(".modal-footer .btn-primary").addClass("imogi-oh-detail-close-btn");
				requestAnimationFrame(() => {
					const body = dialog.$wrapper.find(".modal-body")[0];
					if (!body) return;
					if (body.scrollHeight <= body.clientHeight + 4) {
						dialog.$wrapper.addClass("imogi-oh-detail-dialog--compact");
					}
				});
			},
		});
	};

	const load = () => {
		frappe.call({
			method: "imogi_pos.api.free_tier_api.list_order_history",
			args: { limit: 100 },
			callback(r) {
				const payload = r.message || {};
				const rows = payload.orders || [];
				view_mode = payload.view_mode || view_mode;
				page.main.find(".imogi-web-hero p").first().text(subtitle_for_mode(view_mode));
				const show_branch = view_mode === "all" || view_mode === "area";
				const term = ($panel.find(".imogi-oh-search").val() || "").trim().toLowerCase();
				const filtered = term
					? rows.filter(
							(row) =>
								String(row.name || "").toLowerCase().includes(term) ||
								String(row.customer_name || "").toLowerCase().includes(term) ||
								String(row.cashier_name || "").toLowerCase().includes(term) ||
								String(row.cashier || "").toLowerCase().includes(term)
					  )
					: rows;
				if (!filtered.length) {
					$panel.find(".imogi-oh-body").html(`<div class="imogi-web-empty">${__("Belum ada order")}</div>`);
					return;
				}
				const html = [`<table class="imogi-web-table"><thead><tr>
					<th>${__("Order")}</th><th>${__("Tanggal")}</th><th>${__("Status")}</th><th>${__("Kasir")}</th><th>${__("Customer")}</th>${
					show_branch ? `<th>${__("Outlet")}</th>` : ""
				}<th>${__("Total")}</th><th class="imogi-oh-col-action">${__(
					"Detail"
				)}</th>
				</tr></thead><tbody>`];
				filtered.forEach((row) => {
					html.push(`<tr>
						<td><a href="/app/riwayat-order/${encodeURIComponent(row.name)}">${frappe.utils.escape_html(row.name)}</a></td>
						<td>${frappe.datetime.str_to_user(row.creation)}</td>
						<td><span class="imogi-web-chip">${frappe.utils.escape_html(row.status || "")}</span></td>
						<td>${frappe.utils.escape_html(row.cashier_name || row.cashier || "-")}</td>
						<td>${frappe.utils.escape_html(row.customer_name || "-")}</td>
						${show_branch ? `<td>${frappe.utils.escape_html(row.pos_profile || "-")}</td>` : ""}
						<td>${format_currency(row.grand_total || 0)}</td>
						<td class="imogi-oh-col-action">
							<button type="button" class="imogi-oh-view-btn" data-order="${frappe.utils.escape_html(
								row.name
							)}" title="${__("Lihat detail")}" aria-label="${__("Lihat detail transaksi")}">
								<i class="fa fa-eye" aria-hidden="true"></i>
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
