function inject_order_history_css() {
	for (let v = 1; v <= 7; v += 1) {
		document.getElementById(`imogi-order-history-css-v${v}`)?.remove();
	}
	if (document.getElementById("imogi-order-history-css-v8")) return;
	frappe.dom.set_style(
		`
		body.imogi-pos-themed .layout-main-section-wrapper:has(.imogi-pos-order-history),
		.imogi-pos-order-history.layout-main-section,
		.imogi-pos-order-history,
		.imogi-pos-order-history .page-body,
		.imogi-pos-order-history .imogi-web-shell-root,
		.imogi-pos-order-history .imogi-web-shell,
		.imogi-pos-order-history .imogi-web-content{background:#fff!important}
		.imogi-pos-order-history.layout-main-section,
		.imogi-pos-order-history .imogi-web-shell{box-sizing:border-box;display:flex;flex-direction:column;margin:0!important;max-width:none!important;min-height:calc(100dvh - 60px)}
		body.imogi-pos-cashier-fullscreen .layout-main-section-wrapper:has(.imogi-pos-order-history),
		body.imogi-pos-cashier-fullscreen .imogi-pos-order-history.layout-main-section,
		body.imogi-pos-cashier-fullscreen .imogi-pos-order-history,
		body.imogi-pos-cashier-fullscreen .imogi-pos-order-history .page-body,
		body.imogi-pos-cashier-fullscreen .imogi-pos-order-history .imogi-web-shell{background:#fff!important}
		body.imogi-pos-cashier-fullscreen .imogi-pos-order-history.layout-main-section,
		body.imogi-pos-cashier-fullscreen .imogi-pos-order-history{box-sizing:border-box;display:flex;flex-direction:column;height:100dvh!important;max-height:100dvh!important;min-height:100dvh!important;overflow:hidden;padding:8px 12px 10px!important}
		body.imogi-pos-cashier-fullscreen .imogi-pos-order-history .imogi-web-shell{background:#fff!important;display:flex;flex:1;flex-direction:column;gap:6px;height:auto!important;max-height:none!important;min-height:0!important}
		.imogi-pos-order-history .page-body{display:flex;flex:1;flex-direction:column;min-height:0;padding:0!important}
		.imogi-pos-order-history .imogi-web-content{display:flex;flex:1;flex-direction:column;gap:8px;min-height:0}
		.imogi-pos-order-history .imogi-web-topbar{align-items:center;background:linear-gradient(145deg,#0f1f35 0%,#1a3352 100%)!important;border:1px solid rgba(255,255,255,.12)!important;border-radius:10px!important;flex-shrink:0;margin:0!important;padding:8px 12px!important}
		.imogi-pos-order-history .imogi-web-topbar-title{color:rgba(255,255,255,.92)!important;font-size:11px!important;letter-spacing:.1em}
		.imogi-pos-order-history .imogi-web-topbar-co{color:rgba(255,255,255,.72)!important;font-size:12px!important;font-weight:600}
		.imogi-pos-order-history .imogi-web-topbar-context{display:none!important}
		.imogi-pos-order-history .imogi-web-hero{align-items:center;background:#fff!important;border:1px solid #e4e4e7!important;border-radius:10px!important;box-shadow:0 1px 3px rgba(15,31,53,.06),0 4px 12px rgba(15,31,53,.04)!important;display:flex;flex-shrink:0;flex-wrap:wrap;gap:10px 12px;justify-content:space-between;margin:0!important;padding:10px 14px!important}
		.imogi-pos-order-history .imogi-web-hero h3{color:#0f1f35!important;font-size:16px!important;font-weight:800;margin:0 0 2px}
		.imogi-pos-order-history .imogi-web-hero p{color:#71717a!important;font-size:12px!important;margin:0}
		.imogi-pos-order-history .imogi-web-btn-ghost{background:#fff!important;border:1px solid #d4d4d8!important;border-radius:8px!important;box-shadow:none!important;color:#0f1f35!important;font-weight:700!important;height:32px!important}
		.imogi-pos-order-history .imogi-web-panel{background:#fff!important;border:1px solid #e4e4e7!important;border-radius:10px!important;box-shadow:0 1px 3px rgba(15,31,53,.06),0 4px 12px rgba(15,31,53,.04)!important;display:flex;flex:1;flex-direction:column;min-height:0;overflow:hidden}
		.imogi-pos-order-history .imogi-oh-body{flex:1;min-height:120px;overflow:auto;padding:12px 14px 8px}
		.imogi-pos-order-history .imogi-oh-pagination-host{border-top:1px solid #edf2f7;flex-shrink:0;padding:14px 16px 18px}
		.imogi-pos-order-history .imogi-oh-pagination-host .imogi-web-pagination{border-top:none;margin-top:0;padding:0}
		.imogi-pos-order-history .page-head{display:none!important}
		@media (max-width:992px){
			body.imogi-pos-cashier-fullscreen .imogi-pos-order-history.layout-main-section,
			body.imogi-pos-cashier-fullscreen .imogi-pos-order-history{padding:6px 6px 0!important}
			.imogi-pos-order-history .imogi-web-topbar{border-radius:10px!important;padding:7px 10px!important}
			.imogi-pos-order-history .imogi-web-hero{border-radius:10px!important;padding:10px 12px!important}
		}
		.imogi-oh-col-action { text-align: right; white-space: nowrap; width: 88px; }
		.imogi-oh-action-btn { align-items: center; background: #fff; border: 1px solid #d4d4d8; border-radius: 8px; color: #0f1f35; cursor: pointer; display: inline-flex; height: 32px; justify-content: center; margin-left: 6px; width: 32px; }
		.imogi-oh-action-btn:first-child { margin-left: 0; }
		.imogi-oh-action-btn:hover { background: #f8fafc; border-color: #0f1f35; }
		.imogi-oh-detail-tax-block { border-top: 1px dashed #d4d4d8; margin-top: 8px; padding-top: 8px; }
		.imogi-oh-detail-tax-title { color: #71717a; font-size: 11px; font-weight: 800; letter-spacing: .04em; margin-bottom: 6px; text-transform: uppercase; }
		`,
		"imogi-order-history-css-v8"
	);
}

frappe.pages["imogi-pos-order-history"].on_page_load = function (wrapper) {
	imogi_pos.sync_desk_theme?.();
	const page = imogi_pos.page_shell.make_page(wrapper, __("Riwayat Order"), "imogi-pos-order-history");
	inject_order_history_css();
	$(wrapper).find(".page-head").hide();
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
			<div class="imogi-oh-pagination-host"></div>
		</div>
	`);
	$content.append($panel);

	let current_page = 1;
	const page_size = 10;
	let total_rows = 0;

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

	const build_order_discount_rows = (order) => {
		const rows = [];
		const promo = flt(order.promo_discount_amount);
		const voucher = flt(order.voucher_discount_amount);
		const loyalty = flt(order.loyalty_discount_amount);
		const total_disc = flt(order.discount_amount);
		const manual = Math.max(0, total_disc - promo - voucher - loyalty);
		const push = (label, amount) => {
			if (flt(amount) <= 0) return;
			rows.push(
				`<div class="imogi-oh-detail-total-row is-discount"><span>${label}</span><strong>- ${format_currency(
					amount
				)}</strong></div>`
			);
		};
		push(__("Promo otomatis"), promo);
		push(__("Diskon"), manual);
		push(
			`${__("Voucher")}${order.voucher_code ? ` (${frappe.utils.escape_html(order.voucher_code)})` : ""}`,
			voucher
		);
		push(__("Poin loyalty"), loyalty);
		if (!rows.length && total_disc > 0) {
			push(__("Diskon"), total_disc);
		}
		return rows;
	};

	const open_order_receipt = (order_name) => {
		if (!order_name) return;
		frappe.call({
			method: "imogi_pos.api.free_tier_api.get_order_receipt_url",
			args: { order_name },
			callback(r) {
				const url = r.message && r.message.url;
				if (!url) {
					frappe.msgprint(__("URL struk tidak tersedia."));
					return;
				}
				const win = window.open(url, "_blank");
				if (!win) {
					frappe.msgprint({
						title: __("Pop-up diblokir"),
						indicator: "orange",
						message: __("Izinkan pop-up untuk situs ini, lalu coba cetak ulang."),
					});
				}
			},
		});
	};

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

		const discount_rows = build_order_discount_rows(order);
		const tax_rate = flt(frappe.boot?.imogi_pos_sales_tax_rate) || 11;
		const tax_rows =
			flt(order.tax_amount) > 0
				? `<div class="imogi-oh-detail-tax-block">
					<div class="imogi-oh-detail-tax-title">${__("Pajak")}</div>
					<div class="imogi-oh-detail-total-row"><span>${__("DPP")}</span><strong>${format_currency(
						order.taxable_amount || 0
					)}</strong></div>
					<div class="imogi-oh-detail-total-row is-tax"><span>${__("PPN")} ${tax_rate}%</span><strong>${format_currency(
						order.tax_amount || 0
					)}</strong></div>
				</div>`
				: "";

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
				${render_meta_item(__("Metode Bayar"), frappe.utils.escape_html(order.payment_method || payments.map((p) => p.mode_of_payment).filter(Boolean).join(", ") || "—"))}
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
				${tax_rows}
			</div>
			<div class="imogi-oh-detail-grand">
				<span>${__("Total Bayar")}</span>
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
					primary_action_label: __("Cetak Ulang Struk"),
					primary_action() {
						open_order_receipt(order.name);
					},
					secondary_action_label: __("Tutup"),
					secondary_action() {
						dialog.hide();
					},
				});
				dialog.$wrapper.addClass("imogi-oh-detail-dialog");
				if (item_count + payment_count <= 12) {
					dialog.$wrapper.addClass("imogi-oh-detail-dialog--compact");
				}
				dialog.show();
				dialog.$wrapper.find(".modal-footer .btn-primary").addClass("imogi-oh-detail-print-btn");
				dialog.$wrapper.find(".modal-footer .btn-secondary").addClass("imogi-oh-detail-close-btn");
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

	const load = (page_no = current_page) => {
		current_page = page_no;
		const search = ($panel.find(".imogi-oh-search").val() || "").trim();
		frappe.call({
			method: "imogi_pos.api.free_tier_api.list_order_history",
			args: { page: current_page, page_size, search },
			callback(r) {
				const payload = r.message || {};
				const rows = payload.orders || [];
				total_rows = payload.total || rows.length;
				current_page = payload.page || current_page;
				view_mode = payload.view_mode || view_mode;
				page.main.find(".imogi-web-hero p").first().text(subtitle_for_mode(view_mode));
				const show_branch = view_mode === "all" || view_mode === "area";
				if (!rows.length) {
					$panel.find(".imogi-oh-body").html(`<div class="imogi-web-empty">${__("Belum ada order")}</div>`);
					const pag = imogi_pos.page_shell.render_pagination(current_page, total_rows, page_size);
					$panel.find(".imogi-oh-pagination-host").html(pag.html);
					return;
				}
				const html = [`<table class="imogi-web-table"><thead><tr>
					<th>${__("Order")}</th><th>${__("Tanggal")}</th><th>${__("Kasir")}</th><th>${__("Customer")}</th>${
					show_branch ? `<th>${__("Outlet")}</th>` : ""
				}<th>${__("Total")}</th><th>${__("Metode Bayar")}</th><th>${__("Status")}</th><th class="imogi-oh-col-action">${__(
					"Aksi"
				)}</th>
				</tr></thead><tbody>`];
				rows.forEach((row) => {
					const payment_label = frappe.utils.escape_html(row.payment_method || "—");
					html.push(`<tr>
						<td><a href="/app/riwayat-order/${encodeURIComponent(row.name)}">${frappe.utils.escape_html(row.name)}</a></td>
						<td>${frappe.datetime.str_to_user(row.creation)}</td>
						<td>${frappe.utils.escape_html(row.cashier_name || row.cashier || "-")}</td>
						<td>${frappe.utils.escape_html(row.customer_name || "-")}</td>
						${show_branch ? `<td>${frappe.utils.escape_html(row.pos_profile || "-")}</td>` : ""}
						<td>${format_currency(row.grand_total || 0)}</td>
						<td>${payment_label}</td>
						<td><span class="imogi-oh-status ${status_class(row.status)}">${frappe.utils.escape_html(row.status || "")}</span></td>
						<td class="imogi-oh-col-action">
							<button type="button" class="imogi-oh-action-btn imogi-oh-view-btn" data-order="${frappe.utils.escape_html(
								row.name
							)}" title="${__("Lihat detail")}" aria-label="${__("Lihat detail transaksi")}">
								<i class="fa fa-eye" aria-hidden="true"></i>
							</button>
							<button type="button" class="imogi-oh-action-btn imogi-oh-reprint-btn" data-order="${frappe.utils.escape_html(
								row.name
							)}" title="${__("Cetak ulang struk")}" aria-label="${__("Cetak ulang struk")}">
								<i class="fa fa-print" aria-hidden="true"></i>
							</button>
						</td>
					</tr>`);
				});
				html.push("</tbody></table>");
				$panel.find(".imogi-oh-body").html(html.join(""));

				const pag = imogi_pos.page_shell.render_pagination(current_page, total_rows, page_size);
				$panel.find(".imogi-oh-pagination-host").html(pag.html);
			},
		});
	};

	$panel.on("click", ".imogi-oh-view-btn", function (e) {
		e.preventDefault();
		e.stopPropagation();
		show_order_detail($(this).data("order"));
	});

	$panel.on("click", ".imogi-oh-reprint-btn", function (e) {
		e.preventDefault();
		e.stopPropagation();
		open_order_receipt($(this).data("order"));
	});

	$panel.find(".imogi-oh-refresh").on("click", () => load(1));
	$panel.find(".imogi-oh-search").on(
		"input",
		frappe.utils.debounce(() => load(1), 300)
	);
	$panel.on("click", ".imogi-web-page-prev:not([disabled])", () => load(current_page - 1));
	$panel.on("click", ".imogi-web-page-next:not([disabled])", () => load(current_page + 1));
	page.main.find(".imogi-oh-logout-btn").on("click", () => imogi_pos.logout_cashier?.({ shift_active: true }));
	load(1);
};

frappe.pages["imogi-pos-order-history"].on_page_show = function () {
	imogi_pos.sync_desk_theme?.();
};

frappe.pages["imogi-pos-order-history"].on_page_hide = function () {
	imogi_pos.sync_desk_theme?.();
};
