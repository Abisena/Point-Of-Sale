frappe.pages["imogi-pos-menu-category"].on_page_load = function (wrapper) {
	if (!imogi_pos.page_shell?.make_page) {
		frappe.msgprint(__("IMOGI page shell belum dimuat. Muat ulang halaman (Ctrl+Shift+R)."));
		return;
	}

	const PAGE_SIZE = 10;
	const page = imogi_pos.page_shell.make_page(wrapper, __("Kategori Menu"), "imogi-pos-menu-category");
	const $content = imogi_pos.page_shell.render_hero(page.main, {
		title: __("Kategori Menu"),
		subtitle: __("Kategori POS (Food, Beverage, …) dan Item Group ERPNext"),
		actions_html: `
			<a class="imogi-web-btn imogi-web-btn-ghost" href="/app/imogi-pos-menu"><i class="fa fa-cutlery"></i> ${__(
				"Menu Produk"
			)}</a>
			<a class="imogi-web-btn" href="/app/item-group"><i class="fa fa-plus"></i> ${__("Kelola Item Group")}</a>
		`,
	});
	const $shell = $content.closest(".imogi-web-shell");
	imogi_pos.page_shell.init_manager_page($shell, __("Kategori Menu"));

	const $stats = $('<div class="imogi-web-stat-grid imogi-web-stat-grid--4 imogi-cat-stats"></div>');
	const $posPanel = $(`
		<div class="imogi-web-panel imogi-cat-pos-panel" style="display:none;margin-bottom:12px">
			<div class="imogi-web-panel-head"><div class="imogi-web-panel-title">${__(
				"Kategori POS — Distribusi Produk"
			)}</div></div>
			<div class="imogi-web-panel-body imogi-cat-pos-bars"></div>
		</div>
	`);
	const $panel = $(`
		<div class="imogi-web-panel">
			<div class="imogi-web-panel-head"><div class="imogi-web-panel-title">${__("Ringkasan Kategori")}</div></div>
			<div class="imogi-web-panel-body imogi-cat-body"><div class="imogi-web-empty">${__("Memuat...")}</div></div>
		</div>
	`);
	$content.append($stats).append($posPanel).append($panel);

	let _all_rows = [];
	let _current_page = 1;
	let _max_count = 1;

	const render_stats = (rows) => {
		const pos_rows = rows.filter((r) => r.source === "pos_category");
		const group_rows = rows.filter((r) => r.source === "item_group");
		const total_products = pos_rows.reduce((sum, r) => sum + cint(r.item_count), 0);
		$stats.html(
			imogi_pos.page_shell.render_stat(__("Total Entri"), rows.length, "fa-list", "brand", {
				hero: true,
			}) +
				imogi_pos.page_shell.render_stat(__("Kategori POS"), pos_rows.length, "fa-tags", "purple", {
					icon_tone: "purple",
				}) +
				imogi_pos.page_shell.render_stat(__("Item Group"), group_rows.length, "fa-folder-open", "count", {
					icon_tone: "count",
				}) +
				imogi_pos.page_shell.render_stat(__("Produk POS"), total_products, "fa-cutlery", "done", {
					icon_tone: "done",
				})
		);
	};

	const render_pos_bars = (rows) => {
		const pos_rows = rows.filter((r) => r.source === "pos_category");
		if (!pos_rows.length) {
			$posPanel.hide();
			return;
		}
		_max_count = Math.max(...pos_rows.map((r) => cint(r.item_count)), 1);
		$posPanel.show().find(".imogi-cat-pos-bars").html(
			`<div class="imogi-web-bars">${pos_rows
				.map((row) => {
					const count = cint(row.item_count);
					const pct = Math.max(8, Math.round((count / _max_count) * 100));
					return `<div class="imogi-web-bar-item">
						<div class="imogi-web-bar-head">
							<span>${frappe.utils.escape_html(row.name)}</span>
							<span><strong>${count}</strong> ${__("produk")}</span>
						</div>
						<div class="imogi-web-bar-track">
							<div class="imogi-web-bar-fill imogi-web-count-fill--brand" style="width:${pct}%"></div>
						</div>
					</div>`;
				})
				.join("")}</div>`
		);
	};

	const render_table_page = () => {
		const $body = $panel.find(".imogi-cat-body");
		if (!_all_rows.length) {
			$body.html(`<div class="imogi-web-empty">${__("Belum ada kategori")}</div>`);
			return;
		}
		const pag = imogi_pos.page_shell.render_pagination(_current_page, _all_rows.length, PAGE_SIZE);
		_current_page = pag.page;
		const start = (_current_page - 1) * PAGE_SIZE;
		const page_rows = _all_rows.slice(start, start + PAGE_SIZE);

		const html = [`<table class="imogi-web-table"><thead><tr>
			<th>${__("Kategori")}</th><th>${__("Tipe")}</th><th>${__("Jumlah Produk")}</th>
		</tr></thead><tbody>`];
		page_rows.forEach((row) => {
			const is_pos = row.source === "pos_category";
			const type_tag = is_pos
				? `<span class="imogi-web-type-tag imogi-web-type-tag--pos">${__("Kategori POS")}</span>`
				: `<span class="imogi-web-type-tag imogi-web-type-tag--group">${__("Item Group ERPNext")}</span>`;
			const count = cint(row.item_count);
			const pct = Math.max(6, Math.round((count / _max_count) * 100));
			html.push(`<tr>
				<td><strong>${frappe.utils.escape_html(row.name)}</strong></td>
				<td>${type_tag}</td>
				<td>
					<div class="imogi-web-count-cell">
						<span>${count}</span>
						<div class="imogi-web-count-bar">
							<div class="imogi-web-count-fill${is_pos ? " imogi-web-count-fill--brand" : ""}" style="width:${pct}%"></div>
						</div>
					</div>
				</td>
			</tr>`);
		});
		html.push("</tbody></table>");
		if (pag.html) html.push(pag.html);
		$body.html(html.join(""));

		$body.find(".imogi-web-page-prev").on("click", () => {
			if (_current_page > 1) {
				_current_page -= 1;
				render_table_page();
			}
		});
		$body.find(".imogi-web-page-next").on("click", () => {
			const total_pages = Math.ceil(_all_rows.length / PAGE_SIZE);
			if (_current_page < total_pages) {
				_current_page += 1;
				render_table_page();
			}
		});
	};

	frappe.call({
		method: "imogi_pos.api.free_tier_api.list_menu_categories",
		callback(r) {
			_all_rows = (r.message || {}).categories || [];
			_current_page = 1;
			if (!_all_rows.length) {
				$stats.empty();
				$panel.find(".imogi-cat-body").html(`<div class="imogi-web-empty">${__("Belum ada kategori")}</div>`);
				return;
			}
			render_stats(_all_rows);
			render_pos_bars(_all_rows);
			render_table_page();
		},
	});
};
