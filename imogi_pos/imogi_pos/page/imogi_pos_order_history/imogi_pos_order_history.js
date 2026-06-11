frappe.pages["imogi-pos-order-history"].on_page_load = function (wrapper) {
	const page = imogi_pos.page_shell.make_page(wrapper, __("Riwayat Order"), "imogi-pos-order-history");
	const $content = imogi_pos.page_shell.render_hero(page.main, {
		title: __("Riwayat Order"),
		subtitle: __("Daftar transaksi kasir"),
		actions_html: `<a class="imogi-web-btn imogi-web-btn-ghost" href="/app/imogi-pos-cashier"><i class="fa fa-shopping-cart"></i> ${__(
			"Kembali ke Kasir"
		)}</a>`,
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
					<th>${__("Order")}</th><th>${__("Tanggal")}</th><th>${__("Status")}</th><th>${__("Customer")}</th><th>${__("Total")}</th>
				</tr></thead><tbody>`];
				filtered.forEach((row) => {
					html.push(`<tr>
						<td><a href="/app/riwayat-order/${encodeURIComponent(row.name)}">${frappe.utils.escape_html(row.name)}</a></td>
						<td>${frappe.datetime.str_to_user(row.creation)}</td>
						<td><span class="imogi-web-chip">${frappe.utils.escape_html(row.status || "")}</span></td>
						<td>${frappe.utils.escape_html(row.customer_name || "-")}</td>
						<td>${format_currency(row.grand_total || 0)}</td>
					</tr>`);
				});
				html.push("</tbody></table>");
				$panel.find(".imogi-oh-body").html(html.join(""));
			},
		});
	};

	$panel.find(".imogi-oh-refresh").on("click", load);
	$panel.find(".imogi-oh-search").on("input", frappe.utils.debounce(load, 300));
	load();
};
