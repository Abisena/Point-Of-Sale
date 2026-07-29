frappe.provide("imogi_pos");

function inject_finance_hub_css() {
	if (document.getElementById("imogi-finance-hub-css-v1")) return;
	frappe.dom.set_style(
		`
		body.imogi-fh-fullscreen,
		body.imogi-fh-fullscreen .main-section,
		body.imogi-fh-fullscreen .page-container,
		body.imogi-fh-fullscreen .content.page-container,
		body.imogi-fh-fullscreen .container,
		body.imogi-fh-fullscreen .container.page-body,
		body.imogi-fh-fullscreen .row.layout-main,
		body.imogi-fh-fullscreen .layout-main,
		body.imogi-fh-fullscreen .layout-main-section-wrapper,
		body.imogi-fh-fullscreen .layout-main-section,
		body.imogi-fh-fullscreen .layout-main-section-wrapper > [class*="col-"],
		body.imogi-fh-fullscreen .page-body{
			box-sizing:border-box!important;margin-left:0!important;margin-right:0!important;
			max-width:100%!important;width:100%!important;background:#fff!important
		}
		body.imogi-fh-fullscreen .imogi-finance-hub,
		body.imogi-fh-fullscreen .imogi-web-shell-root.imogi-finance-hub{max-width:100%!important;width:100%!important}
		body.imogi-fh-fullscreen .imogi-web-shell{
			margin:0!important;max-width:100%!important;padding-left:20px!important;padding-right:20px!important;width:100%!important
		}
		body.imogi-fh-fullscreen .imogi-web-content{max-width:100%!important;width:100%!important;overflow:visible!important}
		.imogi-finance-hub .page-head{display:none!important}
		.imogi-finance-hub .imogi-web-hero{
			align-items:center!important;margin-bottom:14px!important;border-bottom:1px solid #e2e8f0!important;
			border-radius:0!important;box-shadow:none!important;gap:16px!important
		}
		.imogi-finance-hub .imogi-web-hero > div:first-child{
			align-items:center;display:flex;flex:1;flex-wrap:wrap;gap:12px 20px;min-width:0
		}
		.imogi-finance-hub .imogi-web-hero h3{margin:0!important;white-space:nowrap}
		.imogi-finance-hub .imogi-fh-search{
			background:#fff;border:1px solid #cbd5e1;border-radius:8px;flex:1;font-size:13px;
			height:36px;max-width:420px;min-width:200px;padding:0 12px
		}
		.imogi-finance-hub .imogi-fh-search:focus{border-color:#0d9488;outline:none;box-shadow:0 0 0 3px rgba(13,148,136,.15)}
		.imogi-finance-hub .imogi-web-actions{align-items:center;display:flex;flex-wrap:wrap;gap:8px}
		.imogi-finance-hub button.imogi-fh-tab{
			align-items:center!important;appearance:none!important;background:#fff!important;border:1px solid #cbd5e1!important;
			border-radius:6px!important;color:#475569!important;cursor:pointer!important;display:inline-flex!important;
			font-size:12px!important;font-weight:700!important;gap:5px!important;height:36px!important;margin:0!important;padding:0 12px!important
		}
		.imogi-finance-hub button.imogi-fh-tab.is-active{
			background:#f0fdfa!important;border-color:#0d9488!important;color:#0f766e!important
		}
		.imogi-finance-hub .imogi-fh-stat-grid{display:grid;gap:10px;grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:14px}
		.imogi-finance-hub .imogi-fh-stat{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px}
		.imogi-finance-hub .imogi-fh-stat-label{color:#64748b;font-size:10px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}
		.imogi-finance-hub .imogi-fh-stat-val{color:#0f172a;font-size:20px;font-weight:800;margin-top:6px}
		.imogi-finance-hub .imogi-web-panel{background:#fff;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:12px}
		.imogi-finance-hub .imogi-web-panel-head{
			align-items:center;border-bottom:1px solid #f1f5f9;display:flex;gap:10px;justify-content:space-between;padding:12px 14px
		}
		.imogi-finance-hub .imogi-web-panel-title{color:#0f172a;font-size:13px;font-weight:800}
		.imogi-finance-hub .imogi-fh-meta{color:#64748b;font-size:11px;font-weight:600}
		.imogi-finance-hub .imogi-fh-table{width:100%;border-collapse:collapse}
		.imogi-finance-hub .imogi-fh-table th{
			background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:10px;font-weight:800;
			letter-spacing:.04em;padding:10px 12px;text-align:left;text-transform:uppercase
		}
		.imogi-finance-hub .imogi-fh-table td{border-bottom:1px solid #f1f5f9;color:#334155;font-size:13px;padding:10px 12px}
		.imogi-finance-hub .imogi-fh-table tbody tr:hover td{background:#f0fdfa}
		.imogi-finance-hub .imogi-fh-name{color:#0f172a;font-weight:800}
		.imogi-finance-hub .imogi-fh-sub{color:#64748b;font-size:11px;font-weight:600;margin-top:2px}
		.imogi-finance-hub .imogi-fh-num{font-variant-numeric:tabular-nums;font-weight:700;white-space:nowrap}
		.imogi-finance-hub .imogi-fh-badge{border-radius:999px;display:inline-block;font-size:10px;font-weight:700;padding:3px 8px}
		.imogi-finance-hub .imogi-fh-badge--ok{background:#ecfdf5;border:1px solid #a7f3d0;color:#047857}
		.imogi-finance-hub .imogi-fh-badge--draft{background:#fff7ed;border:1px solid #fed7aa;color:#c2410c}
		.imogi-finance-hub .imogi-fh-badge--fail{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c}
		.imogi-finance-hub .imogi-fh-empty{color:#64748b;padding:36px 16px;text-align:center}
		.imogi-finance-hub .imogi-fh-report{
			align-items:flex-start;display:flex;flex-direction:column;gap:12px;padding:28px 20px
		}
		.imogi-finance-hub .imogi-fh-report p{color:#475569;font-size:13px;line-height:1.5;margin:0;max-width:520px}
		.imogi-finance-hub button.imogi-fh-btn{
			align-items:center;appearance:none;background:#0d9488;border:none;border-radius:8px;color:#fff!important;
			cursor:pointer;display:inline-flex;font-size:12px;font-weight:700;gap:6px;height:36px;padding:0 14px
		}
		.imogi-finance-hub button.imogi-fh-btn--ghost{
			background:#fff;border:1px solid #cbd5e1;color:#334155!important
		}
		.imogi-finance-hub a.imogi-fh-open{color:#0f766e;cursor:pointer;font-weight:700;text-decoration:none}
		.imogi-finance-hub a.imogi-fh-open:hover{text-decoration:underline}
		.imogi-finance-hub .imogi-fh-tree{padding:6px 14px 14px}
		.imogi-finance-hub .imogi-fh-tree-node{border-bottom:1px solid #f1f5f9}
		.imogi-finance-hub .imogi-fh-tree-node:last-child{border-bottom:none}
		.imogi-finance-hub .imogi-fh-tree-row{
			align-items:center;cursor:pointer;display:flex;gap:8px;padding:9px 4px;user-select:none
		}
		.imogi-finance-hub .imogi-fh-tree-row:hover{background:#f8fafc}
		.imogi-finance-hub .imogi-fh-tree-row.is-leaf{cursor:pointer}
		.imogi-finance-hub .imogi-fh-tree-toggle{
			color:#94a3b8;display:inline-flex;flex-shrink:0;font-size:10px;justify-content:center;width:14px
		}
		.imogi-finance-hub .imogi-fh-tree-label{color:#0f172a;flex:1;font-size:13px;font-weight:700}
		.imogi-finance-hub .imogi-fh-tree-meta{color:#64748b;font-size:11px;font-weight:600;white-space:nowrap}
		.imogi-finance-hub .imogi-fh-tree-amt{font-size:11px;font-variant-numeric:tabular-nums;white-space:nowrap}
		.imogi-finance-hub .imogi-fh-tree-amt.is-in{color:#047857}
		.imogi-finance-hub .imogi-fh-tree-amt.is-out{color:#b91c1c}
		.imogi-finance-hub .imogi-fh-tree-children{display:none}
		.imogi-finance-hub .imogi-fh-tree-children.is-open{display:block}
		@media (max-width:900px){.imogi-finance-hub .imogi-fh-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
		`,
		"imogi-finance-hub-css-v1"
	);
}

function activate_finance_hub_fullscreen() {
	document.body.classList.add("imogi-fh-fullscreen");
	if (!window.__imogi_fh_fullscreen_bound) {
		window.__imogi_fh_fullscreen_bound = true;
		$(document).on("page-change.imogi-fh-fs", () => {
			const route = (frappe.get_route_str && frappe.get_route_str()) || "";
			if (route.indexOf("finance-hub") === -1) {
				document.body.classList.remove("imogi-fh-fullscreen");
			} else {
				document.body.classList.add("imogi-fh-fullscreen");
			}
		});
	}
}

frappe.pages["finance-hub"].on_page_load = function (wrapper) {
	inject_finance_hub_css();
	activate_finance_hub_fullscreen();
	imogi_pos.FinanceHub = new imogi_pos.FinanceHubView(wrapper);
};

frappe.pages["finance-hub"].on_page_show = function () {
	inject_finance_hub_css();
	activate_finance_hub_fullscreen();
	if (imogi_pos.FinanceHub) {
		const route = frappe.get_route() || [];
		const tab = (route[1] || frappe.route_options?.tab || "").toString();
		if (tab && tab !== imogi_pos.FinanceHub.tab) {
			imogi_pos.FinanceHub.set_tab(tab, true);
		} else {
			imogi_pos.FinanceHub.refresh({ quiet: true, keep_page: true });
		}
		imogi_pos.FinanceHub.start_auto_refresh();
	}
};

imogi_pos.FinanceHubView = class FinanceHubView {
	constructor(wrapper) {
		this.wrapper = $(wrapper);
		this.tab = "cash";
		this.page_size = 10;
		this.page = 1;
		this.search = "";
		this.summary = null;
		this.cash = null;
		this.payables = null;
		this.receivables = null;
		this.reports = null;
		this.accounting = null;
		this.bank_mutasi = null;
		this._bank_tree_open = new Set();
		this._poll_timer = null;
		this.make();
		const route = frappe.get_route() || [];
		const tab = (route[1] || frappe.route_options?.tab || "cash").toString();
		this.set_tab(tab, true);
		this.start_auto_refresh();
	}

	make() {
		const page = imogi_pos.page_shell.make_page(
			this.wrapper.get(0),
			__("Finance Hub"),
			"imogi-finance-hub"
		);
		this.wrapper.find(".page-head").hide();
		const TABS = [
			{ id: "cash", label: __("Kas & Bank"), icon: "fa-university" },
			{ id: "bank_mutasi", label: __("Mutasi Bank"), icon: "fa-sitemap" },
			{ id: "payables", label: __("Hutang"), icon: "fa-file-text-o" },
			{ id: "receivables", label: __("Piutang"), icon: "fa-handshake-o" },
			{ id: "profit_loss", label: __("Laba Rugi"), icon: "fa-line-chart" },
			{ id: "cash_flow", label: __("Arus Kas"), icon: "fa-exchange" },
			{ id: "accounting", label: __("Accounting"), icon: "fa-book" },
		];
		this.tabs = TABS;
		const tab_actions = TABS.map(
			(t) =>
				`<button type="button" class="imogi-fh-tab${t.id === "cash" ? " is-active" : ""}" data-tab="${
					t.id
				}"><i class="fa ${t.icon}"></i><span>${t.label}</span></button>`
		).join("");
		const $content = imogi_pos.page_shell.render_hero(page.main, {
			title: __("Finance Hub"),
			actions_html: tab_actions,
		});
		this.$content = $content;
		const $shell = $content.closest(".imogi-web-shell");
		if (typeof imogi_pos.page_shell.init_owner_page === "function") {
			imogi_pos.page_shell.init_owner_page($shell, __("Finance Hub"));
		}
		$shell
			.find(".imogi-web-hero > div")
			.first()
			.append(`<input type="search" class="imogi-fh-search" placeholder="${__("Cari akun / dokumen...")}">`);
		$content.append(`
			<div class="imogi-fh-stats"></div>
			<div class="imogi-fh-body"><div class="imogi-fh-empty">${__("Memuat...")}</div></div>
		`);
		$shell.find(".imogi-fh-tab").on("click", (e) => this.set_tab($(e.currentTarget).data("tab")));
		$shell.find(".imogi-fh-search").on("input change keydown", (e) => {
			if (e.type === "keydown" && e.which !== 13) return;
			clearTimeout(this._search_timer);
			this._search_timer = setTimeout(() => {
				this.search = ($(e.currentTarget).val() || "").trim();
				this.page = 1;
				this.refresh({ quiet: true });
			}, e.type === "input" ? 350 : 0);
		});
	}

	start_auto_refresh() {
		this.stop_auto_refresh();
		this._poll_timer = setInterval(() => {
			const route = (frappe.get_route_str && frappe.get_route_str()) || "";
			if (route.indexOf("finance-hub") === -1) return;
			this.refresh({ quiet: true, keep_page: true });
		}, 45000);
	}

	stop_auto_refresh() {
		if (this._poll_timer) {
			clearInterval(this._poll_timer);
			this._poll_timer = null;
		}
	}

	set_tab(tab, silent) {
		const aliases = {
			cash_bank: "cash",
			kas: "cash",
			mutasi_bank: "bank_mutasi",
			mutasi: "bank_mutasi",
			bank: "bank_mutasi",
			payable: "payables",
			hutang: "payables",
			receivable: "receivables",
			piutang: "receivables",
			pl: "profit_loss",
			pnl: "profit_loss",
			arus_kas: "cash_flow",
			accounting_integration: "accounting",
			akuntansi: "accounting",
		};
		tab = aliases[tab] || tab;
		const allowed = this.tabs.map((t) => t.id);
		this.tab = allowed.includes(tab) ? tab : "cash";
		this.page = 1;
		const $shell = this.$content.closest(".imogi-web-shell");
		$shell.find(".imogi-fh-tab").removeClass("is-active");
		$shell.find(`.imogi-fh-tab[data-tab="${this.tab}"]`).addClass("is-active");
		const show_search = ["cash", "payables", "receivables", "accounting"].includes(this.tab);
		$shell.find(".imogi-fh-search").toggle(show_search);
		if (!silent) frappe.set_route("finance-hub", this.tab);
		this.refresh();
	}

	money(v) {
		return format_currency(flt(v) || 0);
	}

	stat_card(label, value) {
		return `<div class="imogi-fh-stat"><div class="imogi-fh-stat-label">${label}</div><div class="imogi-fh-stat-val">${value}</div></div>`;
	}

	status_badge(row) {
		if (cint(row.docstatus) === 0)
			return `<span class="imogi-fh-badge imogi-fh-badge--draft">${__("Draft")}</span>`;
		return `<span class="imogi-fh-badge imogi-fh-badge--ok">${frappe.utils.escape_html(
			row.status || __("Submitted")
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

	open_doc(doctype, name) {
		frappe.set_route("Form", doctype, name);
	}

	open_report(key) {
		const data = this.reports || {};
		const block = data[key] || {};
		const route = block.route || [];
		if (block.filters) frappe.route_options = block.filters;
		if (route.length) frappe.set_route(route);
	}

	refresh(opts = {}) {
		const quiet = !!opts.quiet;
		const $body = this.$content.find(".imogi-fh-body");
		if (!quiet) $body.html(`<div class="imogi-fh-empty">${__("Memuat...")}</div>`);

		frappe.call({
			method: "imogi_pos.api.planned_features_api.get_finance_summary_api",
			callback: (r) => {
				this.summary = r.exc ? {} : r.message || {};
				this.render_stats();
			},
		});

		if (this.tab === "profit_loss" || this.tab === "cash_flow") {
			frappe.call({
				method: "imogi_pos.api.planned_features_api.get_finance_report_links_api",
				callback: (r) => {
					if (r.exc) {
						if (!quiet) $body.html(`<div class="imogi-fh-empty">${__("Gagal memuat data.")}</div>`);
						return;
					}
					this.reports = r.message || {};
					this.render();
				},
			});
			return;
		}

		if (this.tab === "bank_mutasi") {
			frappe.call({
				method: "imogi_pos.api.planned_features_api.list_finance_bank_mutasi_api",
				callback: (r) => {
					if (r.exc) {
						if (!quiet) $body.html(`<div class="imogi-fh-empty">${__("Gagal memuat data.")}</div>`);
						return;
					}
					this.bank_mutasi = r.message || {};
					this.render();
				},
			});
			return;
		}

		if (this.tab === "accounting") {
			frappe.call({
				method: "imogi_pos.api.planned_features_api.get_accounting_bridge_api",
				args: { search: this.search || undefined },
				callback: (r) => {
					if (r.exc) {
						if (!quiet) $body.html(`<div class="imogi-fh-empty">${__("Gagal memuat data.")}</div>`);
						return;
					}
					this.accounting = r.message || {};
					this.render();
				},
			});
			return;
		}

		const methods = {
			cash: "imogi_pos.api.planned_features_api.list_finance_cash_api",
			payables: "imogi_pos.api.planned_features_api.list_finance_payables_api",
			receivables: "imogi_pos.api.planned_features_api.list_finance_receivables_api",
		};
		const keys = { cash: "cash", payables: "payables", receivables: "receivables" };
		frappe.call({
			method: methods[this.tab],
			args: { search: this.search || undefined },
			callback: (r) => {
				if (r.exc) {
					if (!quiet) $body.html(`<div class="imogi-fh-empty">${__("Gagal memuat data.")}</div>`);
					return;
				}
				this[keys[this.tab]] = r.message || {};
				this.render();
			},
		});
	}

	render_stats() {
		const s = this.summary || {};
		this.$content.find(".imogi-fh-stats").html(`
			<div class="imogi-fh-stat-grid">
				${this.stat_card(__("Kas & Bank"), this.money(s.cash_balance))}
				${this.stat_card(__("Hutang"), this.money(s.payable))}
				${this.stat_card(__("Piutang"), this.money(s.receivable))}
				${this.stat_card(__("Payment 30d"), cint(s.payments_30d))}
			</div>
		`);
	}

	render() {
		const $body = this.$content.find(".imogi-fh-body");
		if (this.tab === "cash") this.render_cash($body);
		else if (this.tab === "bank_mutasi") this.render_bank_mutasi($body);
		else if (this.tab === "payables") this.render_payables($body);
		else if (this.tab === "receivables") this.render_receivables($body);
		else if (this.tab === "profit_loss") this.render_report($body, "profit_loss");
		else if (this.tab === "cash_flow") this.render_report($body, "cash_flow");
		else this.render_accounting($body);
	}

	render_accounting($body) {
		const data = this.accounting || {};
		const rows = data.rows || [];
		const q = (this.search || "").toLowerCase();
		const filtered = q
			? rows.filter((r) =>
					[r.name, r.imogi_pos_order, r.customer, r.customer_name]
						.filter(Boolean)
						.some((v) => String(v).toLowerCase().includes(q))
			  )
			: rows;
		const { page_rows, pager, total } = this.paginate(filtered);
		const coverage = flt(data.coverage_pct || 0).toFixed(1);
		const html_rows = page_rows.length
			? page_rows
					.map(
						(r) => `
				<tr>
					<td><a class="imogi-fh-open" data-dt="POS Invoice" data-name="${frappe.utils.escape_html(r.name)}">${frappe.utils.escape_html(
							r.name
						)}</a>
						<div class="imogi-fh-sub">${frappe.utils.escape_html(r.posting_date || "")}</div></td>
					<td><a class="imogi-fh-open" data-dt="Riwayat Order" data-name="${frappe.utils.escape_html(
						r.imogi_pos_order || ""
					)}">${frappe.utils.escape_html(r.imogi_pos_order || "—")}</a></td>
					<td><div class="imogi-fh-name">${frappe.utils.escape_html(r.customer_name || r.customer || "—")}</div></td>
					<td class="imogi-fh-num">${this.money(r.grand_total)}</td>
					<td>${this.status_badge(r)}</td>
				</tr>`
					)
					.join("")
			: `<tr><td colspan="5" class="imogi-fh-empty">${__("Belum ada POS Invoice ter-link 30 hari terakhir.")}</td></tr>`;

		$body.html(`
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Integrasi Akuntansi (POS → GL)")}</div>
					<span class="imogi-fh-meta">${frappe.utils.escape_html(data.company || "")}</span>
				</div>
				<div class="imogi-fh-stat-grid" style="margin:14px">
					${this.stat_card(__("Order Completed 30d"), cint(data.orders_completed_30d))}
					${this.stat_card(__("POS Invoice 30d"), cint(data.pos_invoices_30d))}
					${this.stat_card(__("Linked ke Order"), cint(data.pos_linked_30d))}
					${this.stat_card(__("Coverage"), `${coverage}%`)}
				</div>
				<div class="imogi-fh-report" style="padding-top:0">
					<p>${__(
						"Order Completed menghasilkan POS Invoice yang masuk buku ERPNext. Buka daftar invoice atau jurnal untuk rekonsiliasi."
					)}</p>
					<div style="display:flex;gap:8px;flex-wrap:wrap">
						<button type="button" class="imogi-fh-btn" data-go="pos"><i class="fa fa-file-text-o"></i> ${__(
							"POS Invoice"
						)}</button>
						<button type="button" class="imogi-fh-btn imogi-fh-btn--ghost" data-go="si"><i class="fa fa-list"></i> ${__(
							"Sales Invoice"
						)}</button>
						<button type="button" class="imogi-fh-btn imogi-fh-btn--ghost" data-go="je"><i class="fa fa-book"></i> ${__(
							"Journal Entry"
						)}</button>
					</div>
				</div>
			</div>
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("POS Invoice ter-link Riwayat Order")}</div>
					<span class="imogi-fh-meta">${total} ${__("dokumen")}</span>
				</div>
				<table class="imogi-fh-table">
					<thead><tr>
						<th>${__("POS Invoice")}</th><th>${__("Riwayat Order")}</th><th>${__("Customer")}</th>
						<th>${__("Total")}</th><th>${__("Status")}</th>
					</tr></thead>
					<tbody>${html_rows}</tbody>
				</table>
				${pager.html || ""}
			</div>
		`);
		$body.find("[data-dt]").on("click", (e) => {
			e.preventDefault();
			const $el = $(e.currentTarget);
			const name = $el.data("name");
			if (!name) return;
			this.open_doc($el.data("dt"), name);
		});
		$body.find("[data-go]").on("click", (e) => {
			const go = $(e.currentTarget).data("go");
			if (go === "pos") frappe.set_route("List", "POS Invoice");
			else if (go === "si") frappe.set_route("List", "Sales Invoice");
			else if (go === "je") frappe.set_route("List", "Journal Entry");
		});
		this.bind_pager($body);
	}

	render_cash($body) {
		const data = this.cash || {};
		const accounts = data.accounts || [];
		const rows = data.rows || [];
		const { page_rows, pager, total } = this.paginate(rows);
		const acc_rows = accounts.length
			? accounts
					.map(
						(a) => `
				<tr>
					<td><div class="imogi-fh-name">${frappe.utils.escape_html(a.account_name || a.name)}</div>
						<div class="imogi-fh-sub">${frappe.utils.escape_html(a.account_type || "")}</div></td>
					<td class="imogi-fh-num">${this.money(a.balance)}</td>
				</tr>`
					)
					.join("")
			: `<tr><td colspan="2" class="imogi-fh-empty">${__("Belum ada akun Kas/Bank.")}</td></tr>`;

		const pe_rows = page_rows.length
			? page_rows
					.map((r) => {
						const amt = r.payment_type === "Receive" ? r.received_amount : r.paid_amount;
						return `
				<tr>
					<td><a class="imogi-fh-open" data-dt="Payment Entry" data-name="${frappe.utils.escape_html(r.name)}">${frappe.utils.escape_html(
							r.name
						)}</a>
						<div class="imogi-fh-sub">${frappe.utils.escape_html(r.posting_date || "")}</div></td>
					<td>${frappe.utils.escape_html(r.payment_type || "")}</td>
					<td><div class="imogi-fh-name">${frappe.utils.escape_html(r.party_name || r.party || "—")}</div>
						<div class="imogi-fh-sub">${frappe.utils.escape_html(r.mode_of_payment || "")}</div></td>
					<td class="imogi-fh-num">${this.money(amt)}</td>
					<td>${this.status_badge(r)}</td>
				</tr>`;
					})
					.join("")
			: `<tr><td colspan="5" class="imogi-fh-empty">${__("Belum ada Payment Entry.")}</td></tr>`;

		$body.html(`
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Saldo Akun Kas & Bank")}</div>
					<span class="imogi-fh-meta">${accounts.length} ${__("akun")}</span>
				</div>
				<table class="imogi-fh-table"><thead><tr><th>${__("Akun")}</th><th>${__("Saldo")}</th></tr></thead>
				<tbody>${acc_rows}</tbody></table>
			</div>
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Payment Entry")}</div>
					<div style="display:flex;gap:8px;align-items:center">
						<span class="imogi-fh-meta">${total} ${__("dokumen")}</span>
						<button type="button" class="imogi-fh-btn" data-new-pe="1"><i class="fa fa-plus"></i> ${__("Payment Entry")}</button>
					</div>
				</div>
				<table class="imogi-fh-table">
					<thead><tr>
						<th>${__("Dokumen")}</th><th>${__("Tipe")}</th><th>${__("Party")}</th><th>${__("Jumlah")}</th><th>${__("Status")}</th>
					</tr></thead>
					<tbody>${pe_rows}</tbody>
				</table>
				${pager.html || ""}
			</div>
		`);
		$body.find("[data-dt]").on("click", (e) => {
			e.preventDefault();
			const $el = $(e.currentTarget);
			this.open_doc($el.data("dt"), $el.data("name"));
		});
		$body.find("[data-new-pe]").on("click", () => frappe.new_doc("Payment Entry"));
		this.bind_pager($body);
	}

	open_bank_import_dialog() {
		const dialog = new frappe.ui.Dialog({
			title: __("Import Mutasi Bank (BCA)"),
			fields: [
				{
					fieldname: "bank_account",
					fieldtype: "Link",
					options: "Bank Account",
					label: __("Bank Account"),
					reqd: 1,
				},
				{
					fieldname: "statement_file",
					fieldtype: "Attach",
					label: __("File Mutasi (.csv / .xlsx)"),
					description: __("Upload file mentah dari BCA apa adanya, tidak perlu diedit dulu."),
					reqd: 1,
				},
			],
			primary_action_label: __("Import"),
			primary_action: (values) => {
				frappe.call({
					method: "imogi_pos.api.bank_import_api.import_bca_statement",
					args: { file_url: values.statement_file, bank_account: values.bank_account },
					freeze: true,
					freeze_message: __("Mengimpor mutasi bank..."),
					callback: (r) => {
						dialog.hide();
						const stats = r.message || {};
						const errors = stats.errors || [];
						const lines = [
							`${__("Transaksi baru")}: ${stats.created || 0}`,
							`${__("Duplikat dilewati")}: ${stats.skipped_duplicate || 0}`,
						];
						if (errors.length) {
							lines.push(`${__("Baris gagal")}: ${errors.length}`);
							lines.push(
								errors
									.slice(0, 5)
									.map((e) => `${__("Baris")} ${e.row}: ${frappe.utils.escape_html(e.error)}`)
									.join("<br>")
							);
						}
						lines.push(
							`<div class="imogi-fh-sub" style="margin-top:8px">${__(
								"Catatan: Bank Transaction tidak langsung mengubah saldo di atas — saldo dihitung dari Payment Entry/Journal Entry. Gunakan Bank Reconciliation Tool untuk mencocokkan hasil import ini."
							)}</div>`
						);
						frappe.msgprint({
							title: __("Import Selesai"),
							indicator: errors.length ? "orange" : "green",
							message: lines.join("<br>"),
						});
						this.refresh();
					},
				});
			},
		});
		dialog.show();
	}

	render_bank_mutasi($body) {
		const data = this.bank_mutasi || {};
		const logs = data.logs || [];
		const tree = data.tree || {};
		const badge_class = {
			Success: "imogi-fh-badge--ok",
			Partial: "imogi-fh-badge--draft",
			Failed: "imogi-fh-badge--fail",
		};

		const log_rows = logs.length
			? logs
					.map(
						(r) => `
				<tr>
					<td><a class="imogi-fh-open" data-dt="IMOGI Bank Statement Import" data-name="${frappe.utils.escape_html(
							r.name
						)}">${frappe.utils.escape_html(r.name)}</a>
						<div class="imogi-fh-sub">${frappe.utils.escape_html(r.uploaded_on || "")}</div></td>
					<td>${frappe.utils.escape_html(r.bank_account || "")}</td>
					<td class="imogi-fh-num">${cint(r.created_count)}</td>
					<td class="imogi-fh-num">${cint(r.skipped_count)}</td>
					<td class="imogi-fh-num">${cint(r.error_count)}</td>
					<td><span class="imogi-fh-badge ${badge_class[r.status] || "imogi-fh-badge--ok"}">${frappe.utils.escape_html(
							r.status || ""
						)}</span></td>
				</tr>`
					)
					.join("")
			: `<tr><td colspan="6" class="imogi-fh-empty">${__("Belum ada import.")}</td></tr>`;

		const bank_accounts = Object.keys(tree);
		const tree_html = bank_accounts.length
			? bank_accounts.map((bank_account) => this.render_bank_node(bank_account, tree[bank_account])).join("")
			: `<div class="imogi-fh-empty">${__("Belum ada mutasi bank.")}</div>`;

		$body.html(`
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Riwayat Import Mutasi Bank")}</div>
					<button type="button" class="imogi-fh-btn" data-import-bank="1"><i class="fa fa-upload"></i> ${__(
						"Import Mutasi Bank"
					)}</button>
				</div>
				<table class="imogi-fh-table">
					<thead><tr>
						<th>${__("Import")}</th><th>${__("Bank Account")}</th><th>${__("Baru")}</th><th>${__("Duplikat")}</th><th>${__(
			"Gagal"
		)}</th><th>${__("Status")}</th>
					</tr></thead>
					<tbody>${log_rows}</tbody>
				</table>
			</div>
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Mutasi per Akun")}</div>
					<span class="imogi-fh-meta">${bank_accounts.length} ${__("akun")}</span>
				</div>
				<div class="imogi-fh-tree">${tree_html}</div>
			</div>
		`);

		$body.find("[data-import-bank]").on("click", () => this.open_bank_import_dialog());
		$body.find("[data-dt]").on("click", (e) => {
			e.preventDefault();
			const $el = $(e.currentTarget);
			this.open_doc($el.data("dt"), $el.data("name"));
		});
		$body.find("[data-tree-toggle]").on("click", (e) => {
			const key = $(e.currentTarget).closest(".imogi-fh-tree-node").data("key");
			if (this._bank_tree_open.has(key)) this._bank_tree_open.delete(key);
			else this._bank_tree_open.add(key);
			this.render();
		});
		$body.find("[data-tree-day]").on("click", (e) => {
			const $el = $(e.currentTarget);
			frappe.route_options = { bank_account: $el.data("bank-account"), date: $el.data("date") };
			frappe.set_route("List", "Bank Transaction");
		});
	}

	render_bank_node(bank_account, node) {
		const key = `b:${bank_account}`;
		const years = node.years || {};
		const year_keys = Object.keys(years).sort((a, b) => b - a);
		const children = year_keys.map((y) => this.render_year_node(key, bank_account, y, years[y])).join("");
		return this.tree_row(key, bank_account, node, 0, false, children);
	}

	render_year_node(parent_key, bank_account, year, node) {
		const key = `${parent_key}:y:${year}`;
		const months = node.months || {};
		const month_keys = Object.keys(months).sort((a, b) => b - a);
		const children = month_keys
			.map((m) => this.render_month_node(key, bank_account, year, m, months[m]))
			.join("");
		return this.tree_row(key, year, node, 1, false, children);
	}

	render_month_node(parent_key, bank_account, year, month, node) {
		const key = `${parent_key}:m:${month}`;
		const MONTHS = [
			"",
			__("Januari"),
			__("Februari"),
			__("Maret"),
			__("April"),
			__("Mei"),
			__("Juni"),
			__("Juli"),
			__("Agustus"),
			__("September"),
			__("Oktober"),
			__("November"),
			__("Desember"),
		];
		const label = MONTHS[cint(month)] || month;
		const days = node.days || {};
		const day_keys = Object.keys(days).sort((a, b) => b - a);
		const children = day_keys.map((d) => this.render_day_node(bank_account, year, month, d, days[d])).join("");
		return this.tree_row(key, label, node, 2, false, children);
	}

	render_day_node(bank_account, year, month, day, node) {
		const pad = (n) => String(n).padStart(2, "0");
		const date_str = `${year}-${pad(month)}-${pad(day)}`;
		const key = `d:${bank_account}:${date_str}`;
		const label = `${pad(day)}/${pad(month)}/${year}`;
		return this.tree_row(key, label, { ...node, bank_account, date: date_str }, 3, true, "");
	}

	tree_row(key, label, node, level, is_leaf, children_html) {
		const is_open = this._bank_tree_open.has(key);
		const indent = level * 18;
		const toggle_icon = is_leaf
			? `<span class="imogi-fh-tree-toggle"></span>`
			: `<span class="imogi-fh-tree-toggle"><i class="fa fa-caret-${is_open ? "down" : "right"}"></i></span>`;
		const row_attr = is_leaf
			? `data-tree-day="1" data-bank-account="${frappe.utils.escape_html(
					node.bank_account || ""
			  )}" data-date="${frappe.utils.escape_html(node.date || "")}"`
			: `data-tree-toggle="1"`;
		return `
			<div class="imogi-fh-tree-node" data-key="${frappe.utils.escape_html(key)}">
				<div class="imogi-fh-tree-row${is_leaf ? " is-leaf" : ""}" style="padding-left:${indent}px" ${row_attr}>
					${toggle_icon}
					<span class="imogi-fh-tree-label">${frappe.utils.escape_html(String(label))}</span>
					<span class="imogi-fh-tree-meta">${cint(node.count)} ${__("transaksi")}</span>
					<span class="imogi-fh-tree-amt is-in">+${this.money(node.deposit)}</span>
					<span class="imogi-fh-tree-amt is-out">-${this.money(node.withdrawal)}</span>
				</div>
				${is_leaf ? "" : `<div class="imogi-fh-tree-children${is_open ? " is-open" : ""}">${children_html}</div>`}
			</div>`;
	}

	render_payables($body) {
		const data = this.payables || {};
		const rows = data.rows || [];
		const { page_rows, pager, total } = this.paginate(rows);
		const html_rows = page_rows.length
			? page_rows
					.map(
						(r) => `
				<tr>
					<td><a class="imogi-fh-open" data-dt="Purchase Invoice" data-name="${frappe.utils.escape_html(r.name)}">${frappe.utils.escape_html(
							r.name
						)}</a>
						<div class="imogi-fh-sub">${frappe.utils.escape_html(r.posting_date || "")}</div></td>
					<td><div class="imogi-fh-name">${frappe.utils.escape_html(r.supplier_name || r.supplier || "")}</div></td>
					<td class="imogi-fh-num">${this.money(r.grand_total)}</td>
					<td class="imogi-fh-num">${this.money(r.outstanding_amount)}</td>
					<td>${frappe.utils.escape_html(r.due_date || "—")}</td>
					<td>${this.status_badge(r)}</td>
				</tr>`
					)
					.join("")
			: `<tr><td colspan="6" class="imogi-fh-empty">${__("Tidak ada hutang outstanding.")}</td></tr>`;

		$body.html(`
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Hutang Supplier")}</div>
					<span class="imogi-fh-meta">${total} · ${__("Total")} ${this.money(data.total_outstanding)}</span>
				</div>
				<table class="imogi-fh-table">
					<thead><tr>
						<th>${__("Invoice")}</th><th>${__("Supplier")}</th><th>${__("Total")}</th>
						<th>${__("Outstanding")}</th><th>${__("Jatuh Tempo")}</th><th>${__("Status")}</th>
					</tr></thead>
					<tbody>${html_rows}</tbody>
				</table>
				${pager.html || ""}
			</div>
		`);
		$body.find("[data-dt]").on("click", (e) => {
			e.preventDefault();
			const $el = $(e.currentTarget);
			this.open_doc($el.data("dt"), $el.data("name"));
		});
		this.bind_pager($body);
	}

	render_receivables($body) {
		const data = this.receivables || {};
		const rows = data.rows || [];
		const { page_rows, pager, total } = this.paginate(rows);
		const html_rows = page_rows.length
			? page_rows
					.map(
						(r) => `
				<tr>
					<td><a class="imogi-fh-open" data-dt="Sales Invoice" data-name="${frappe.utils.escape_html(r.name)}">${frappe.utils.escape_html(
							r.name
						)}</a>
						<div class="imogi-fh-sub">${frappe.utils.escape_html(r.posting_date || "")}</div></td>
					<td><div class="imogi-fh-name">${frappe.utils.escape_html(r.customer_name || r.customer || "")}</div></td>
					<td class="imogi-fh-num">${this.money(r.grand_total)}</td>
					<td class="imogi-fh-num">${this.money(r.outstanding_amount)}</td>
					<td>${frappe.utils.escape_html(r.due_date || "—")}</td>
					<td>${this.status_badge(r)}</td>
				</tr>`
					)
					.join("")
			: `<tr><td colspan="6" class="imogi-fh-empty">${__("Tidak ada piutang outstanding.")}</td></tr>`;

		$body.html(`
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Piutang Customer")}</div>
					<span class="imogi-fh-meta">${total} · ${__("Total")} ${this.money(data.total_outstanding)}</span>
				</div>
				<table class="imogi-fh-table">
					<thead><tr>
						<th>${__("Invoice")}</th><th>${__("Customer")}</th><th>${__("Total")}</th>
						<th>${__("Outstanding")}</th><th>${__("Jatuh Tempo")}</th><th>${__("Status")}</th>
					</tr></thead>
					<tbody>${html_rows}</tbody>
				</table>
				${pager.html || ""}
			</div>
		`);
		$body.find("[data-dt]").on("click", (e) => {
			e.preventDefault();
			const $el = $(e.currentTarget);
			this.open_doc($el.data("dt"), $el.data("name"));
		});
		this.bind_pager($body);
	}

	render_report($body, key) {
		const data = this.reports || {};
		const block = data[key] || {};
		const title =
			key === "profit_loss" ? __("Laba Rugi (Profit & Loss)") : __("Arus Kas (Cash Flow)");
		const desc =
			key === "profit_loss"
				? __("Buka laporan Profit and Loss Statement ERPNext untuk periode berjalan.")
				: __("Buka laporan Cash Flow ERPNext untuk melihat arus kas masuk/keluar.");
		$body.html(`
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${title}</div>
					<span class="imogi-fh-meta">${frappe.utils.escape_html(data.company || "")} · ${frappe.utils.escape_html(
			data.period_start || ""
		)} → ${frappe.utils.escape_html(data.period_end || "")}</span>
				</div>
				<div class="imogi-fh-report">
					<p>${desc}</p>
					<div style="display:flex;gap:8px;flex-wrap:wrap">
						<button type="button" class="imogi-fh-btn" data-report="${key}"><i class="fa fa-external-link"></i> ${__(
							"Buka Laporan"
						)}</button>
					</div>
				</div>
			</div>
		`);
		$body.find("[data-report]").on("click", (e) => this.open_report($(e.currentTarget).data("report")));
	}
};
