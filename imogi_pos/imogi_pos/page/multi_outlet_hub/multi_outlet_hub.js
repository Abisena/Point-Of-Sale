frappe.provide("imogi_pos");

function inject_multi_outlet_hub_css() {
	if (document.getElementById("imogi-moh-css-v1")) return;
	frappe.dom.set_style(
		`
		body.imogi-moh-fullscreen,
		body.imogi-moh-fullscreen .main-section,
		body.imogi-moh-fullscreen .page-container,
		body.imogi-moh-fullscreen .content.page-container,
		body.imogi-moh-fullscreen .container,
		body.imogi-moh-fullscreen .container.page-body,
		body.imogi-moh-fullscreen .row.layout-main,
		body.imogi-moh-fullscreen .layout-main,
		body.imogi-moh-fullscreen .layout-main-section-wrapper,
		body.imogi-moh-fullscreen .layout-main-section,
		body.imogi-moh-fullscreen .layout-main-section-wrapper > [class*="col-"],
		body.imogi-moh-fullscreen .page-body{
			box-sizing:border-box!important;margin-left:0!important;margin-right:0!important;
			max-width:100%!important;width:100%!important;background:#fff!important
		}
		body.imogi-moh-fullscreen .imogi-multi-outlet-hub,
		body.imogi-moh-fullscreen .imogi-web-shell-root.imogi-multi-outlet-hub{max-width:100%!important;width:100%!important}
		body.imogi-moh-fullscreen .imogi-web-shell{
			margin:0!important;max-width:100%!important;padding-left:20px!important;padding-right:20px!important;width:100%!important
		}
		.imogi-multi-outlet-hub .page-head{display:none!important}
		.imogi-multi-outlet-hub .imogi-web-hero{
			align-items:center!important;margin-bottom:14px!important;border-bottom:1px solid #e2e8f0!important;
			border-radius:0!important;box-shadow:none!important;gap:16px!important
		}
		.imogi-multi-outlet-hub .imogi-web-hero > div:first-child{
			align-items:center;display:flex;flex:1;flex-wrap:wrap;gap:12px 20px;min-width:0
		}
		.imogi-multi-outlet-hub .imogi-web-hero h3{margin:0!important;white-space:nowrap}
		.imogi-multi-outlet-hub .imogi-moh-search{
			background:#fff;border:1px solid #cbd5e1;border-radius:8px;flex:1;font-size:13px;
			height:36px;max-width:420px;min-width:200px;padding:0 12px
		}
		.imogi-multi-outlet-hub .imogi-moh-search:focus{border-color:#2563eb;outline:none;box-shadow:0 0 0 3px rgba(37,99,235,.15)}
		.imogi-multi-outlet-hub .imogi-web-actions{align-items:center;display:flex;flex-wrap:wrap;gap:8px}
		.imogi-multi-outlet-hub button.imogi-moh-tab{
			align-items:center!important;appearance:none!important;background:#fff!important;border:1px solid #cbd5e1!important;
			border-radius:6px!important;color:#475569!important;cursor:pointer!important;display:inline-flex!important;
			font-size:12px!important;font-weight:700!important;gap:5px!important;height:36px!important;margin:0!important;padding:0 12px!important
		}
		.imogi-multi-outlet-hub button.imogi-moh-tab.is-active{
			background:#eff6ff!important;border-color:#2563eb!important;color:#1d4ed8!important
		}
		.imogi-multi-outlet-hub .imogi-moh-stat-grid{display:grid;gap:10px;grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:14px}
		.imogi-multi-outlet-hub .imogi-moh-stat{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px}
		.imogi-multi-outlet-hub .imogi-moh-stat-label{color:#64748b;font-size:10px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}
		.imogi-multi-outlet-hub .imogi-moh-stat-val{color:#0f172a;font-size:20px;font-weight:800;margin-top:6px}
		.imogi-multi-outlet-hub .imogi-web-panel{background:#fff;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:12px}
		.imogi-multi-outlet-hub .imogi-web-panel--form{overflow:visible!important;position:relative;z-index:5}
		.imogi-multi-outlet-hub .imogi-web-panel-head{
			align-items:center;border-bottom:1px solid #f1f5f9;display:flex;gap:10px;justify-content:space-between;padding:12px 14px
		}
		.imogi-multi-outlet-hub .imogi-web-panel-title{color:#0f172a;font-size:13px;font-weight:800}
		.imogi-multi-outlet-hub .imogi-moh-meta{color:#64748b;font-size:11px;font-weight:600}
		.imogi-multi-outlet-hub .imogi-moh-table{width:100%;border-collapse:collapse}
		.imogi-multi-outlet-hub .imogi-moh-table th{
			background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:10px;font-weight:800;
			letter-spacing:.04em;padding:10px 12px;text-align:left;text-transform:uppercase
		}
		.imogi-multi-outlet-hub .imogi-moh-table td{border-bottom:1px solid #f1f5f9;color:#334155;font-size:13px;padding:10px 12px}
		.imogi-multi-outlet-hub .imogi-moh-table tbody tr:hover td{background:#eff6ff}
		.imogi-multi-outlet-hub .imogi-moh-name{color:#0f172a;font-weight:800}
		.imogi-multi-outlet-hub .imogi-moh-sub{color:#64748b;font-size:11px;font-weight:600;margin-top:2px}
		.imogi-multi-outlet-hub .imogi-moh-num{font-variant-numeric:tabular-nums;font-weight:700;white-space:nowrap}
		.imogi-multi-outlet-hub .imogi-moh-badge{border-radius:999px;display:inline-block;font-size:10px;font-weight:700;padding:3px 8px}
		.imogi-multi-outlet-hub .imogi-moh-badge--ok{background:#ecfdf5;border:1px solid #a7f3d0;color:#047857}
		.imogi-multi-outlet-hub .imogi-moh-badge--off{background:#f1f5f9;border:1px solid #cbd5e1;color:#64748b}
		.imogi-multi-outlet-hub .imogi-moh-badge--draft{background:#fff7ed;border:1px solid #fed7aa;color:#c2410c}
		.imogi-multi-outlet-hub .imogi-moh-empty{color:#64748b;padding:36px 16px;text-align:center}
		.imogi-multi-outlet-hub .imogi-moh-note{
			background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;color:#1e40af;font-size:12px;margin-bottom:12px;padding:10px 12px
		}
		.imogi-multi-outlet-hub .imogi-moh-form{
			display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));overflow:visible!important;padding:14px;position:relative;z-index:6
		}
		.imogi-multi-outlet-hub .imogi-moh-form label{color:#64748b;display:block;font-size:11px;font-weight:700;margin-bottom:4px}
		.imogi-multi-outlet-hub .imogi-moh-form input,.imogi-multi-outlet-hub .imogi-moh-form select{
			border:1px solid #cbd5e1;border-radius:8px;font-size:13px;height:36px;padding:0 10px;width:100%
		}
		.imogi-multi-outlet-hub button.imogi-moh-btn{
			align-items:center;appearance:none;background:#2563eb;border:none;border-radius:8px;color:#fff!important;
			cursor:pointer;display:inline-flex;font-size:12px;font-weight:700;gap:6px;height:36px;padding:0 14px
		}
		.imogi-multi-outlet-hub button.imogi-moh-btn--ghost{
			background:#fff;border:1px solid #cbd5e1;color:#334155!important
		}
		.imogi-multi-outlet-hub a.imogi-moh-open{color:#1d4ed8;cursor:pointer;font-weight:700;text-decoration:none}
		.imogi-multi-outlet-hub a.imogi-moh-open:hover{text-decoration:underline}
		@media (max-width:900px){.imogi-multi-outlet-hub .imogi-moh-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
		`,
		"imogi-moh-css-v1"
	);
}

function activate_multi_outlet_hub_fullscreen() {
	document.body.classList.add("imogi-moh-fullscreen");
	if (!window.__imogi_moh_fullscreen_bound) {
		window.__imogi_moh_fullscreen_bound = true;
		$(document).on("page-change.imogi-moh-fs", () => {
			const route = (frappe.get_route_str && frappe.get_route_str()) || "";
			if (route.indexOf("multi-outlet-hub") === -1) {
				document.body.classList.remove("imogi-moh-fullscreen");
			} else {
				document.body.classList.add("imogi-moh-fullscreen");
			}
		});
	}
}

frappe.pages["multi-outlet-hub"].on_page_load = function (wrapper) {
	inject_multi_outlet_hub_css();
	activate_multi_outlet_hub_fullscreen();
	imogi_pos.MultiOutletHub = new imogi_pos.MultiOutletHubView(wrapper);
};

frappe.pages["multi-outlet-hub"].on_page_show = function () {
	inject_multi_outlet_hub_css();
	activate_multi_outlet_hub_fullscreen();
	if (imogi_pos.MultiOutletHub) {
		const route = frappe.get_route() || [];
		const tab = (route[1] || frappe.route_options?.tab || "").toString();
		if (tab && tab !== imogi_pos.MultiOutletHub.tab) {
			imogi_pos.MultiOutletHub.set_tab(tab, true);
		} else {
			imogi_pos.MultiOutletHub.refresh({ quiet: true });
		}
	}
};

imogi_pos.MultiOutletHubView = class MultiOutletHubView {
	constructor(wrapper) {
		this.wrapper = $(wrapper);
		this.tab = "branches";
		this.page_size = 10;
		this.page = 1;
		this.search = "";
		this.summary = null;
		this.data = {};
		this.make();
		const route = frappe.get_route() || [];
		const tab = (route[1] || frappe.route_options?.tab || "branches").toString();
		this.set_tab(tab, true);
	}

	make() {
		const page = imogi_pos.page_shell.make_page(
			this.wrapper.get(0),
			__("Multi-Outlet Hub"),
			"imogi-multi-outlet-hub"
		);
		this.wrapper.find(".page-head").hide();
		const TABS = [
			{ id: "branches", label: __("Cabang"), icon: "fa-building" },
			{ id: "inventory", label: __("Stok Cabang"), icon: "fa-cubes" },
			{ id: "purchasing", label: __("Pembelian Pusat"), icon: "fa-shopping-cart" },
			{ id: "transfer", label: __("Transfer"), icon: "fa-exchange" },
		];
		this.tabs = TABS;
		const tab_actions = TABS.map(
			(t) =>
				`<button type="button" class="imogi-moh-tab${t.id === "branches" ? " is-active" : ""}" data-tab="${
					t.id
				}"><i class="fa ${t.icon}"></i><span>${t.label}</span></button>`
		).join("");
		const $content = imogi_pos.page_shell.render_hero(page.main, {
			title: __("Multi-Outlet Hub"),
			actions_html: tab_actions,
		});
		this.$content = $content;
		const $shell = $content.closest(".imogi-web-shell");
		if (typeof imogi_pos.page_shell.init_owner_page === "function") {
			imogi_pos.page_shell.init_owner_page($shell, __("Multi-Outlet Hub"));
		}
		$shell
			.find(".imogi-web-hero > div")
			.first()
			.append(`<input type="search" class="imogi-moh-search" placeholder="${__("Cari cabang / dokumen...")}">`);
		$content.append(`
			<div class="imogi-moh-stats"></div>
			<div class="imogi-moh-body"><div class="imogi-moh-empty">${__("Memuat...")}</div></div>
		`);
		$shell.find(".imogi-moh-tab").on("click", (e) => this.set_tab($(e.currentTarget).data("tab")));
		$shell.find(".imogi-moh-search").on("input change keydown", (e) => {
			if (e.type === "keydown" && e.which !== 13) return;
			clearTimeout(this._search_timer);
			this._search_timer = setTimeout(() => {
				this.search = ($(e.currentTarget).val() || "").trim();
				this.page = 1;
				this.refresh({ quiet: true });
			}, e.type === "input" ? 350 : 0);
		});
	}

	set_tab(tab, silent) {
		const aliases = {
			multi_outlet: "branches",
			central_inventory: "inventory",
			stok: "inventory",
			central_purchasing: "purchasing",
			pembelian: "purchasing",
			stock_transfer: "transfer",
		};
		tab = aliases[tab] || tab;
		const allowed = this.tabs.map((t) => t.id);
		this.tab = allowed.includes(tab) ? tab : "branches";
		this.page = 1;
		const $shell = this.$content.closest(".imogi-web-shell");
		$shell.find(".imogi-moh-tab").removeClass("is-active");
		$shell.find(`.imogi-moh-tab[data-tab="${this.tab}"]`).addClass("is-active");
		$shell.find(".imogi-moh-search").toggle(["branches", "inventory", "purchasing"].includes(this.tab));
		if (!silent) frappe.set_route("multi-outlet-hub", this.tab);
		this.refresh();
	}

	money(v) {
		return format_currency(flt(v) || 0);
	}

	make_link($parent, { options, fieldname, filters }) {
		return frappe.ui.form.make_control({
			parent: $parent.get(0) ? $parent : $($parent),
			df: {
				fieldtype: "Link",
				options,
				fieldname,
				label: " ",
				get_query: filters ? () => ({ filters }) : undefined,
			},
			render_input: true,
		});
	}

	stat_card(label, value) {
		return `<div class="imogi-moh-stat"><div class="imogi-moh-stat-label">${label}</div><div class="imogi-moh-stat-val">${value}</div></div>`;
	}

	status_badge(row) {
		if (cint(row.docstatus) === 0)
			return `<span class="imogi-moh-badge imogi-moh-badge--draft">${__("Draft")}</span>`;
		if (cint(row.is_active) === 0)
			return `<span class="imogi-moh-badge imogi-moh-badge--off">${__("Nonaktif")}</span>`;
		return `<span class="imogi-moh-badge imogi-moh-badge--ok">${frappe.utils.escape_html(
			row.status || __("Aktif")
		)}</span>`;
	}

	paginate(rows) {
		const total = rows.length;
		const pager = imogi_pos.page_shell.render_pagination(this.page, total, this.page_size);
		const start = (pager.page - 1) * this.page_size;
		this.page = pager.page;
		return { page_rows: rows.slice(start, start + this.page_size), pager, total };
	}

	bind_pager($body) {
		$body.find(".imogi-web-pager button, .imogi-web-page-prev, .imogi-web-page-next").on("click", (e) => {
			e.preventDefault();
			const $btn = $(e.currentTarget);
			if ($btn.prop("disabled") || $btn.is("[disabled]")) return;
			let next = cint($btn.data("page"));
			if (!next) {
				next = $btn.hasClass("imogi-web-page-prev") ? this.page - 1 : this.page + 1;
			}
			if (!next || next === this.page) return;
			this.page = next;
			this.render();
		});
	}

	refresh(opts = {}) {
		const quiet = !!opts.quiet;
		const $body = this.$content.find(".imogi-moh-body");
		if (!quiet) $body.html(`<div class="imogi-moh-empty">${__("Memuat...")}</div>`);

		frappe.call({
			method: "imogi_pos.api.planned_features_api.get_multi_outlet_summary_api",
			callback: (r) => {
				this.summary = r.exc ? {} : r.message || {};
				this.render_stats();
			},
		});

		const methods = {
			branches: "imogi_pos.api.planned_features_api.list_outlet_branches_api",
			inventory: "imogi_pos.api.planned_features_api.get_outlet_inventory_api",
			purchasing: "imogi_pos.api.planned_features_api.list_central_purchase_api",
			transfer: "imogi_pos.api.planned_features_api.list_outlet_transfers_api",
		};
		frappe.call({
			method: methods[this.tab],
			args: { search: this.search || undefined },
			callback: (r) => {
				if (r.exc) {
					if (!quiet) $body.html(`<div class="imogi-moh-empty">${__("Gagal memuat data.")}</div>`);
					return;
				}
				this.data[this.tab] = r.message || {};
				if (this.tab === "transfer") {
					frappe.call({
						method: "imogi_pos.api.stock_import_api.get_branch_transfer_context",
						callback: (tr) => {
							this.data.transfer_ctx = tr.exc ? {} : tr.message || {};
							this.render();
						},
					});
					return;
				}
				if (this.tab === "purchasing" || this.tab === "inventory") {
					frappe.call({
						method: "imogi_pos.api.planned_features_api.list_outlet_branches_api",
						callback: (br) => {
							this.data.branches = br.exc ? {} : br.message || {};
							this.render();
						},
					});
					return;
				}
				this.render();
			},
		});
	}

	render_stats() {
		const s = this.summary || {};
		this.$content.find(".imogi-moh-stats").html(`
			<div class="imogi-moh-stat-grid">
				${this.stat_card(__("Cabang"), cint(s.branch_count))}
				${this.stat_card(__("Nilai Stok"), this.money(s.stock_value_total))}
				${this.stat_card(__("PR Pusat 30d"), cint(s.central_pr_30d))}
				${this.stat_card(__("Transfer 30d"), cint(s.transfers_30d))}
			</div>
		`);
	}

	render() {
		const $body = this.$content.find(".imogi-moh-body");
		if (this.tab === "branches") this.render_branches($body);
		else if (this.tab === "inventory") this.render_inventory($body);
		else if (this.tab === "purchasing") this.render_purchasing($body);
		else this.render_transfer($body);
	}

	render_branches($body) {
		const rows = (this.data.branches || {}).rows || [];
		const { page_rows, pager, total } = this.paginate(rows);
		const multi = cint((this.summary || {}).multi_branch);
		$body.html(`
			<div class="imogi-moh-note"><i class="fa fa-info-circle"></i> ${
				multi
					? __("Mode multi-cabang aktif. Kelola cabang, penugasan Area Manager, dan sinkronisasi dari hub ini.")
					: __("Aktifkan Multi Cabang di IMOGI POS Settings agar fitur outlet penuh.")
			}</div>
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Daftar Cabang")}</div>
					<div style="display:flex;gap:8px;align-items:center">
						<span class="imogi-moh-meta">${total}</span>
						<button type="button" class="imogi-moh-btn" data-go="add"><i class="fa fa-plus"></i> ${__("Tambah Cabang")}</button>
						<button type="button" class="imogi-moh-btn imogi-moh-btn--ghost" data-go="list">${__("IMOGI Branch")}</button>
					</div>
				</div>
				<table class="imogi-moh-table">
					<thead><tr>
						<th>${__("Cabang")}</th><th>${__("Warehouse")}</th><th>${__("POS Profile")}</th>
						<th>${__("Price List")}</th><th>${__("Status")}</th>
					</tr></thead>
					<tbody>
						${
							page_rows.length
								? page_rows
										.map(
											(r) => `<tr>
							<td><a class="imogi-moh-open" data-dt="IMOGI Branch" data-name="${frappe.utils.escape_html(
								r.name || r.branch_code
							)}">${frappe.utils.escape_html(r.branch_name || r.branch_code)}</a>
								<div class="imogi-moh-sub">${frappe.utils.escape_html(r.branch_code || "")}</div></td>
							<td>${frappe.utils.escape_html(r.warehouse || "—")}</td>
							<td>${frappe.utils.escape_html(r.pos_profile || "—")}</td>
							<td>${frappe.utils.escape_html(r.selling_price_list || "—")}</td>
							<td>${
								cint(r.is_active)
									? `<span class="imogi-moh-badge imogi-moh-badge--ok">${__("Aktif")}</span>`
									: `<span class="imogi-moh-badge imogi-moh-badge--off">${__("Nonaktif")}</span>`
							}</td>
						</tr>`
										)
										.join("")
								: `<tr><td colspan="5" class="imogi-moh-empty">${__("Belum ada cabang.")}</td></tr>`
						}
					</tbody>
				</table>
				${pager.html || ""}
			</div>
		`);
		$body.find("[data-dt]").on("click", (e) => {
			e.preventDefault();
			frappe.set_route("Form", $(e.currentTarget).data("dt"), $(e.currentTarget).data("name"));
		});
		$body.find("[data-go=add]").on("click", () => frappe.set_route("imogi-pos-add-branch"));
		$body.find("[data-go=list]").on("click", () => frappe.set_route("List", "IMOGI Branch"));
		this.bind_pager($body);
	}

	render_inventory($body) {
		const data = this.data.inventory || {};
		const rows = data.rows || [];
		const { page_rows, pager, total } = this.paginate(rows);
		$body.html(`
			<div class="imogi-moh-note"><i class="fa fa-cubes"></i> ${__(
				"Central Inventory: nilai stok & SKU per gudang cabang (Stock Ledger)."
			)}</div>
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Stok per Cabang")}</div>
					<span class="imogi-moh-meta">${total} · ${__("Total")} ${this.money(data.stock_value_total)} · ${cint(
			data.sku_total
		)} SKU</span>
				</div>
				<table class="imogi-moh-table">
					<thead><tr>
						<th>${__("Cabang")}</th><th>${__("Warehouse")}</th><th>${__("SKU")}</th><th>${__("Nilai Stok")}</th>
					</tr></thead>
					<tbody>
						${
							page_rows.length
								? page_rows
										.map(
											(r) => `<tr>
							<td class="imogi-moh-name">${frappe.utils.escape_html(r.branch || r.branch_code || "")}
								<div class="imogi-moh-sub">${frappe.utils.escape_html(r.branch_code || "")}</div></td>
							<td>${frappe.utils.escape_html(r.warehouse || "—")}</td>
							<td class="imogi-moh-num">${cint(r.sku_count)}</td>
							<td class="imogi-moh-num">${this.money(r.stock_value)}</td>
						</tr>`
										)
										.join("")
								: `<tr><td colspan="4" class="imogi-moh-empty">${__(
										"Belum ada warehouse cabang dengan stok."
								  )}</td></tr>`
						}
					</tbody>
				</table>
				${pager.html || ""}
			</div>
		`);
		this.bind_pager($body);
	}

	render_purchasing($body) {
		const data = this.data.purchasing || {};
		const rows = data.rows || [];
		const branches = (this.data.branches || {}).rows || [];
		const { page_rows, pager, total } = this.paginate(rows);
		const branch_opts = branches
			.filter((b) => b.warehouse)
			.map(
				(b) =>
					`<option value="${frappe.utils.escape_html(b.branch_code)}">${frappe.utils.escape_html(
						b.branch_name || b.branch_code
					)}</option>`
			)
			.join("");
		$body.html(`
			<div class="imogi-moh-note"><i class="fa fa-shopping-cart"></i> ${__(
				"Central Purchasing: buat Material Request Purchase dari HQ untuk gudang cabang."
			)}</div>
			<div class="imogi-web-panel imogi-web-panel--form">
				<div class="imogi-web-panel-head"><div class="imogi-web-panel-title">${__("Buat Purchase Request Pusat")}</div></div>
				<div class="imogi-moh-form">
					<div><label>${__("Item")}</label><div class="imogi-moh-pr-item"></div></div>
					<div><label>${__("Qty")}</label><input type="number" min="0.001" step="0.001" class="imogi-moh-pr-qty" value="1"></div>
					<div><label>${__("Cabang tujuan")}</label>
						<select class="imogi-moh-pr-branch"><option value="">${__("Default warehouse")}</option>${branch_opts}</select>
					</div>
					<div style="align-items:flex-end;display:flex">
						<button type="button" class="imogi-moh-btn imogi-moh-pr-save">${__("Buat Request")}</button>
					</div>
				</div>
			</div>
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Material Request (Purchase)")}</div>
					<span class="imogi-moh-meta">${total}</span>
				</div>
				<table class="imogi-moh-table">
					<thead><tr><th>${__("Dokumen")}</th><th>${__("Tanggal")}</th><th>${__("Item")}</th><th>${__(
			"Status"
		)}</th></tr></thead>
					<tbody>
						${
							page_rows.length
								? page_rows
										.map(
											(r) => `<tr>
							<td><a class="imogi-moh-open" href="/app/material-request/${encodeURIComponent(r.name)}">${frappe.utils.escape_html(
												r.name
											)}</a></td>
							<td>${frappe.utils.escape_html(r.transaction_date || "—")}</td>
							<td class="imogi-moh-num">${cint(r.item_count)}</td>
							<td>${this.status_badge(r)}</td>
						</tr>`
										)
										.join("")
								: `<tr><td colspan="4" class="imogi-moh-empty">${__("Belum ada purchase request.")}</td></tr>`
						}
					</tbody>
				</table>
				${pager.html || ""}
			</div>
		`);
		this.bind_pager($body);
		const item_ctrl = this.make_link($body.find(".imogi-moh-pr-item"), {
			options: "Item",
			fieldname: "item_code",
			filters: { disabled: 0, is_stock_item: 1 },
		});
		$body.find(".imogi-moh-pr-save").on("click", () => {
			const item_code = (item_ctrl.get_value() || "").trim();
			const qty = flt($body.find(".imogi-moh-pr-qty").val());
			const branch_code = ($body.find(".imogi-moh-pr-branch").val() || "").trim();
			if (!item_code || qty <= 0) return frappe.msgprint(__("Isi item dan qty."));
			frappe.call({
				method: "imogi_pos.api.planned_features_api.create_outlet_purchase_api",
				args: { item_code, qty, branch_code: branch_code || undefined },
				freeze: true,
				callback: (r) => {
					if (r.exc) return;
					frappe.show_alert({
						message: __("Request: {0}", [r.message.name]),
						indicator: "green",
					});
					this.refresh();
				},
			});
		});
	}

	render_transfer($body) {
		const rows = (this.data.transfer || {}).rows || [];
		const ctx = this.data.transfer_ctx || {};
		const branches = ctx.branches || (this.data.branches || {}).rows || [];
		const { page_rows, pager, total } = this.paginate(rows);
		const opts = branches
			.map(
				(b) =>
					`<option value="${frappe.utils.escape_html(b.branch_code)}">${frappe.utils.escape_html(
						b.branch_name || b.branch_code
					)}</option>`
			)
			.join("");
		$body.html(`
			<div class="imogi-moh-note"><i class="fa fa-exchange"></i> ${__(
				"Transfer stok antar gudang cabang (Material Transfer)."
			)}</div>
			<div class="imogi-web-panel imogi-web-panel--form">
				<div class="imogi-web-panel-head"><div class="imogi-web-panel-title">${__("Buat Transfer Antar Cabang")}</div></div>
				<div class="imogi-moh-form">
					<div><label>${__("Dari cabang")}</label><select class="imogi-moh-tr-from">${opts}</select></div>
					<div><label>${__("Ke cabang")}</label><select class="imogi-moh-tr-to">${opts}</select></div>
					<div><label>${__("Item")}</label><div class="imogi-moh-tr-item"></div></div>
					<div><label>${__("Qty")}</label><input type="number" min="0.001" step="0.001" class="imogi-moh-tr-qty" value="1"></div>
					<div style="align-items:flex-end;display:flex">
						<button type="button" class="imogi-moh-btn imogi-moh-tr-save">${__("Transfer")}</button>
					</div>
				</div>
			</div>
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Transfer Terbaru")}</div>
					<span class="imogi-moh-meta">${total}</span>
				</div>
				<table class="imogi-moh-table">
					<thead><tr><th>${__("Dokumen")}</th><th>${__("Dari")}</th><th>${__("Ke")}</th><th>${__(
			"Tanggal"
		)}</th><th>${__("Status")}</th></tr></thead>
					<tbody>
						${
							page_rows.length
								? page_rows
										.map(
											(r) => `<tr>
							<td><a class="imogi-moh-open" href="/app/stock-entry/${encodeURIComponent(r.name)}">${frappe.utils.escape_html(
												r.name
											)}</a></td>
							<td>${frappe.utils.escape_html(r.from_warehouse || "—")}</td>
							<td>${frappe.utils.escape_html(r.to_warehouse || "—")}</td>
							<td>${frappe.utils.escape_html(r.posting_date || "—")}</td>
							<td>${this.status_badge(r)}</td>
						</tr>`
										)
										.join("")
								: `<tr><td colspan="5" class="imogi-moh-empty">${__("Belum ada transfer.")}</td></tr>`
						}
					</tbody>
				</table>
				${pager.html || ""}
			</div>
		`);
		this.bind_pager($body);
		if (branches.length > 1) {
			$body.find(".imogi-moh-tr-to").prop("selectedIndex", 1);
		}
		const item_ctrl = this.make_link($body.find(".imogi-moh-tr-item"), {
			options: "Item",
			fieldname: "item_code",
			filters: { disabled: 0, is_stock_item: 1 },
		});
		$body.find(".imogi-moh-tr-save").on("click", () => {
			const from_branch_code = ($body.find(".imogi-moh-tr-from").val() || "").trim();
			const to_branch_code = ($body.find(".imogi-moh-tr-to").val() || "").trim();
			const item_code = (item_ctrl.get_value() || "").trim();
			const qty = flt($body.find(".imogi-moh-tr-qty").val());
			if (!from_branch_code || !to_branch_code || !item_code || qty <= 0) {
				return frappe.msgprint(__("Lengkapi cabang, item, dan qty."));
			}
			frappe.call({
				method: "imogi_pos.api.stock_import_api.create_branch_stock_transfer",
				args: {
					from_branch_code,
					to_branch_code,
					items: JSON.stringify([{ item_code, qty }]),
				},
				freeze: true,
				callback: (r) => {
					if (r.exc) return;
					const name = r.message?.stock_entry || r.message?.name || r.message;
					frappe.show_alert({ message: __("Transfer: {0}", [name]), indicator: "green" });
					this.refresh();
				},
			});
		});
	}
};
