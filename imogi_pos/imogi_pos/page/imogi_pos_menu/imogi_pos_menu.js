frappe.pages["imogi-pos-menu"].on_page_load = function (wrapper) {
	if (!imogi_pos.page_shell?.make_page) {
		frappe.msgprint(__("IMOGI page shell belum dimuat. Muat ulang halaman (Ctrl+Shift+R)."));
		return;
	}

	const PAGE_SIZE = 10;
	const page = imogi_pos.page_shell.make_page(wrapper, __("Menu Produk"), "imogi-pos-menu");
	const $content = imogi_pos.page_shell.render_hero(page.main, {
		title: __("Menu Produk"),
		subtitle: __("Kelola item penjualan & import produk — role Manager"),
		actions_html: `
			<a class="imogi-web-btn imogi-web-btn-ghost" href="/app/imogi-pos-menu-category"><i class="fa fa-tags"></i> ${__(
				"Kategori"
			)}</a>
			<button type="button" class="imogi-web-btn imogi-menu-import"><i class="fa fa-upload"></i> ${__(
				"Import Produk"
			)}</button>
		`,
	});
	const $shell = $content.closest(".imogi-web-shell");
	imogi_pos.page_shell.init_manager_page($shell, __("Menu Produk"));

	const $stats = $('<div class="imogi-web-stat-grid imogi-web-stat-grid--4 imogi-menu-stats"></div>');
	const $catPanel = $(`
		<div class="imogi-web-panel imogi-menu-cat-panel" style="display:none;margin-bottom:12px">
			<div class="imogi-web-panel-head"><div class="imogi-web-panel-title">${__(
				"Distribusi per Kategori"
			)}</div></div>
			<div class="imogi-web-panel-body imogi-menu-cat-bars"></div>
		</div>
	`);
	const $panel = $(`
		<div class="imogi-web-panel">
			<div class="imogi-web-panel-head">
				<div class="imogi-web-panel-title">${__("Daftar Produk")}</div>
				<div class="imogi-web-panel-filters">
					<input type="search" class="imogi-web-search imogi-menu-search" placeholder="${__(
						"Cari produk..."
					)}">
					<select class="form-control input-sm imogi-menu-category">
						<option value="">${__("Semua kategori")}</option>
						<option value="Food">Food</option>
						<option value="Beverage">Beverage</option>
						<option value="Dessert">Dessert</option>
					</select>
				</div>
			</div>
			<div class="imogi-web-panel-body imogi-menu-body"><div class="imogi-web-empty">${__("Memuat...")}</div></div>
		</div>
	`);
	$content.append($stats).append($catPanel).append($panel);

	let _all_items = [];
	let _current_page = 1;

	const category_breakdown = (items) => {
		const counts = {};
		items.forEach((row) => {
			const key = row.imogi_pos_category || row.item_group || __("Lainnya");
			counts[key] = (counts[key] || 0) + 1;
		});
		return Object.entries(counts)
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count);
	};

	const render_category_bars = (items) => {
		const rows = category_breakdown(items);
		if (rows.length <= 1) {
			$catPanel.hide();
			return;
		}
		const max = Math.max(...rows.map((r) => r.count), 1);
		$catPanel.show().find(".imogi-menu-cat-bars").html(
			`<div class="imogi-web-bars">${rows
				.map((row) => {
					const pct = Math.max(8, Math.round((row.count / max) * 100));
					return `<div class="imogi-web-bar-item">
						<div class="imogi-web-bar-head">
							<span>${frappe.utils.escape_html(row.name)}</span>
							<span><strong>${row.count}</strong> ${__("produk")}</span>
						</div>
						<div class="imogi-web-bar-track">
							<div class="imogi-web-bar-fill" style="width:${pct}%"></div>
						</div>
					</div>`;
				})
				.join("")}</div>`
		);
	};

	const render_stats = (items, pos_categories) => {
		const zero_price = items.filter((row) => !flt(row.rate)).length;
		const variants = items.filter((row) => row.variant_of).length;
		$stats.html(
			imogi_pos.page_shell.render_stat(__("Total Produk"), items.length, "fa-cutlery", "brand", {
				hero: true,
				icon_tone: "brand",
			}) +
				imogi_pos.page_shell.render_stat(__("Tanpa Harga"), zero_price, "fa-exclamation-triangle", "warn", {
					warn: zero_price > 0,
					icon_tone: "warn",
				}) +
				imogi_pos.page_shell.render_stat(__("Varian"), variants, "fa-sitemap", "count", {
					icon_tone: "count",
				}) +
				imogi_pos.page_shell.render_stat(
					__("Kategori POS"),
					pos_categories.length,
					"fa-tags",
					"purple",
					{ icon_tone: "purple" }
				)
		);
	};

	const render_table_page = () => {
		const $body = $panel.find(".imogi-menu-body");
		if (!_all_items.length) {
			$body.html(`<div class="imogi-web-empty">${__("Belum ada produk")}</div>`);
			return;
		}
		const pag = imogi_pos.page_shell.render_pagination(_current_page, _all_items.length, PAGE_SIZE);
		_current_page = pag.page;
		const start = (_current_page - 1) * PAGE_SIZE;
		const page_rows = _all_items.slice(start, start + PAGE_SIZE);

		const html = [`<table class="imogi-web-table"><thead><tr>
			<th>${__("Kode")}</th><th>${__("Nama")}</th><th>${__("Kategori")}</th><th>${__("Harga")}</th><th></th>
		</tr></thead><tbody>`];
		page_rows.forEach((row) => {
			const cat = row.imogi_pos_category || row.item_group || "-";
			const variant_note = row.variant_of
				? ` <span class="imogi-web-type-tag">${__("Varian")}</span>`
				: cint(row.has_variants)
					? ` <span class="imogi-web-type-tag imogi-web-type-tag--pos">${__("Template")}</span>`
					: "";
			html.push(`<tr>
				<td>${frappe.utils.escape_html(row.name)}</td>
				<td>${frappe.utils.escape_html(row.item_name || row.name)}${variant_note}</td>
				<td>${frappe.utils.escape_html(cat)}</td>
				<td>${format_currency(row.rate || 0, row.currency)}</td>
				<td><a class="imogi-web-btn imogi-web-btn-ghost imogi-web-btn--xs" href="/app/item/${encodeURIComponent(
					row.name
				)}">${__("Edit")}</a></td>
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
			const total_pages = Math.ceil(_all_items.length / PAGE_SIZE);
			if (_current_page < total_pages) {
				_current_page += 1;
				render_table_page();
			}
		});
	};

	const load = () => {
		$stats.html(
			`<div class="imogi-web-empty" style="grid-column:1/-1"><i class="fa fa-spinner fa-spin"></i> ${__(
				"Memuat..."
			)}</div>`
		);
		$panel.find(".imogi-menu-body").html(`<div class="imogi-web-empty"><i class="fa fa-spinner fa-spin"></i> ${__(
			"Memuat..."
		)}</div>`);
		frappe.call({
			method: "imogi_pos.api.free_tier_api.list_menu_items",
			args: {
				search: $panel.find(".imogi-menu-search").val() || undefined,
				category: $panel.find(".imogi-menu-category").val() || undefined,
				limit: 300,
			},
			callback(r) {
				const msg = r.message || {};
				_all_items = msg.items || [];
				const pos_categories = msg.categories || [];
				_current_page = 1;
				render_stats(_all_items, pos_categories);
				render_category_bars(_all_items);
				render_table_page();
			},
		});
	};

	page.main.find(".imogi-menu-import").on("click", () => {
		new frappe.ui.FileUploader({
			allow_multiple: false,
			restrictions: { allowed_file_types: [".xlsx", ".xls", ".csv"] },
			onsuccess(file) {
				frappe.call({
					method: "imogi_pos.api.menu_import_api.import_menu_from_file",
					args: { file_url: file.file_url, update_existing: 1, import_stock: 1 },
					freeze: true,
					callback() {
						frappe.msgprint({ message: __("Import selesai"), indicator: "green" });
						load();
					},
				});
			},
		});
	});

	$panel.find(".imogi-menu-search").on("input", frappe.utils.debounce(load, 300));
	$panel.find(".imogi-menu-category").on("change", load);
	load();
};
