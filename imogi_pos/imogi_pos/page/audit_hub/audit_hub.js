frappe.provide("imogi_pos");

function inject_audit_hub_css() {
	if (document.getElementById("imogi-audit-hub-css-v1")) return;
	frappe.dom.set_style(
		`
		body.imogi-ah-fullscreen,
		body.imogi-ah-fullscreen .main-section,
		body.imogi-ah-fullscreen .page-container,
		body.imogi-ah-fullscreen .content.page-container,
		body.imogi-ah-fullscreen .container,
		body.imogi-ah-fullscreen .container.page-body,
		body.imogi-ah-fullscreen .row.layout-main,
		body.imogi-ah-fullscreen .layout-main,
		body.imogi-ah-fullscreen .layout-main-section-wrapper,
		body.imogi-ah-fullscreen .layout-main-section,
		body.imogi-ah-fullscreen .layout-main-section-wrapper > [class*="col-"],
		body.imogi-ah-fullscreen .page-body{
			box-sizing:border-box!important;margin-left:0!important;margin-right:0!important;
			max-width:100%!important;width:100%!important;background:#fff!important
		}
		body.imogi-ah-fullscreen .imogi-audit-hub,
		body.imogi-ah-fullscreen .imogi-web-shell-root.imogi-audit-hub{max-width:100%!important;width:100%!important}
		body.imogi-ah-fullscreen .imogi-web-shell{
			margin:0!important;max-width:100%!important;padding-left:20px!important;padding-right:20px!important;width:100%!important
		}
		.imogi-audit-hub .page-head{display:none!important}
		.imogi-audit-hub .imogi-web-hero{
			align-items:center!important;margin-bottom:14px!important;border-bottom:1px solid #e2e8f0!important;
			border-radius:0!important;box-shadow:none!important;gap:16px!important
		}
		.imogi-audit-hub .imogi-web-hero > div:first-child{
			align-items:center;display:flex;flex:1;flex-wrap:wrap;gap:12px 20px;min-width:0
		}
		.imogi-audit-hub .imogi-web-hero h3{margin:0!important;white-space:nowrap}
		.imogi-audit-hub .imogi-ah-search{
			background:#fff;border:1px solid #cbd5e1;border-radius:8px;flex:1;font-size:13px;
			height:36px;max-width:420px;min-width:200px;padding:0 12px
		}
		.imogi-audit-hub .imogi-ah-search:focus{border-color:#64748b;outline:none;box-shadow:0 0 0 3px rgba(100,116,139,.15)}
		.imogi-audit-hub .imogi-web-actions{align-items:center;display:flex;flex-wrap:wrap;gap:8px}
		.imogi-audit-hub button.imogi-ah-tab{
			align-items:center!important;appearance:none!important;background:#fff!important;border:1px solid #cbd5e1!important;
			border-radius:6px!important;color:#475569!important;cursor:pointer!important;display:inline-flex!important;
			font-size:12px!important;font-weight:700!important;gap:5px!important;height:36px!important;margin:0!important;padding:0 12px!important
		}
		.imogi-audit-hub button.imogi-ah-tab.is-active{
			background:#f8fafc!important;border-color:#475569!important;color:#0f172a!important
		}
		.imogi-audit-hub .imogi-ah-stat-grid{display:grid;gap:10px;grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:14px}
		.imogi-audit-hub .imogi-ah-stat{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px}
		.imogi-audit-hub .imogi-ah-stat-label{color:#64748b;font-size:10px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}
		.imogi-audit-hub .imogi-ah-stat-val{color:#0f172a;font-size:20px;font-weight:800;margin-top:6px}
		.imogi-audit-hub .imogi-web-panel{background:#fff;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:12px}
		.imogi-audit-hub .imogi-web-panel-head{
			align-items:center;border-bottom:1px solid #f1f5f9;display:flex;gap:10px;justify-content:space-between;padding:12px 14px
		}
		.imogi-audit-hub .imogi-web-panel-title{color:#0f172a;font-size:13px;font-weight:800}
		.imogi-audit-hub .imogi-ah-meta{color:#64748b;font-size:11px;font-weight:600}
		.imogi-audit-hub .imogi-ah-table{width:100%;border-collapse:collapse}
		.imogi-audit-hub .imogi-ah-table th{
			background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:10px;font-weight:800;
			letter-spacing:.04em;padding:10px 12px;text-align:left;text-transform:uppercase
		}
		.imogi-audit-hub .imogi-ah-table td{border-bottom:1px solid #f1f5f9;color:#334155;font-size:13px;padding:10px 12px}
		.imogi-audit-hub .imogi-ah-table tbody tr:hover td{background:#f8fafc}
		.imogi-audit-hub .imogi-ah-name{color:#0f172a;font-weight:800}
		.imogi-audit-hub .imogi-ah-sub{color:#64748b;font-size:11px;font-weight:600;margin-top:2px}
		.imogi-audit-hub .imogi-ah-num{font-variant-numeric:tabular-nums;font-weight:700;white-space:nowrap}
		.imogi-audit-hub .imogi-ah-empty{color:#64748b;padding:36px 16px;text-align:center}
		.imogi-audit-hub .imogi-ah-note{
			background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;color:#475569;font-size:12px;margin-bottom:12px;padding:10px 12px
		}
		.imogi-audit-hub a.imogi-ah-open{color:#334155;cursor:pointer;font-weight:700;text-decoration:none}
		.imogi-audit-hub a.imogi-ah-open:hover{text-decoration:underline}
		.imogi-audit-hub button.imogi-ah-btn{
			align-items:center;appearance:none;background:#475569;border:none;border-radius:8px;color:#fff!important;
			cursor:pointer;display:inline-flex;font-size:12px;font-weight:700;gap:6px;height:36px;padding:0 14px
		}
		@media (max-width:900px){.imogi-audit-hub .imogi-ah-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
		`,
		"imogi-audit-hub-css-v1"
	);
}

function activate_audit_hub_fullscreen() {
	document.body.classList.add("imogi-ah-fullscreen");
	if (!window.__imogi_ah_fullscreen_bound) {
		window.__imogi_ah_fullscreen_bound = true;
		$(document).on("page-change.imogi-ah-fs", () => {
			const route = (frappe.get_route_str && frappe.get_route_str()) || "";
			if (route.indexOf("audit-hub") === -1) {
				document.body.classList.remove("imogi-ah-fullscreen");
			} else {
				document.body.classList.add("imogi-ah-fullscreen");
			}
		});
	}
}

frappe.pages["audit-hub"].on_page_load = function (wrapper) {
	inject_audit_hub_css();
	activate_audit_hub_fullscreen();
	imogi_pos.AuditHub = new imogi_pos.AuditHubView(wrapper);
};

frappe.pages["audit-hub"].on_page_show = function () {
	inject_audit_hub_css();
	activate_audit_hub_fullscreen();
	if (imogi_pos.AuditHub) {
		const route = frappe.get_route() || [];
		const tab = (route[1] || frappe.route_options?.tab || "").toString();
		if (tab && tab !== imogi_pos.AuditHub.tab) {
			imogi_pos.AuditHub.set_tab(tab, true);
		} else {
			imogi_pos.AuditHub.refresh({ quiet: true });
		}
	}
};

imogi_pos.AuditHubView = class AuditHubView {
	constructor(wrapper) {
		this.wrapper = $(wrapper);
		this.tab = "versions";
		this.page_size = 10;
		this.page = 1;
		this.search = "";
		this.summary = null;
		this.data = {};
		this.make();
		const route = frappe.get_route() || [];
		const tab = (route[1] || frappe.route_options?.tab || "versions").toString();
		this.set_tab(tab, true);
	}

	make() {
		const page = imogi_pos.page_shell.make_page(
			this.wrapper.get(0),
			__("Audit Hub"),
			"imogi-audit-hub"
		);
		this.wrapper.find(".page-head").hide();
		const TABS = [
			{ id: "versions", label: __("Audit Log"), icon: "fa-history" },
			{ id: "login", label: __("Login"), icon: "fa-sign-in" },
			{ id: "timeline", label: __("Timeline"), icon: "fa-clock-o" },
			{ id: "discount", label: __("Diskon"), icon: "fa-tag" },
			{ id: "void", label: __("Void"), icon: "fa-ban" },
		];
		this.tabs = TABS;
		const tab_actions = TABS.map(
			(t) =>
				`<button type="button" class="imogi-ah-tab${t.id === "versions" ? " is-active" : ""}" data-tab="${
					t.id
				}"><i class="fa ${t.icon}"></i><span>${t.label}</span></button>`
		).join("");
		const $content = imogi_pos.page_shell.render_hero(page.main, {
			title: __("Audit Hub"),
			actions_html: tab_actions,
		});
		this.$content = $content;
		const $shell = $content.closest(".imogi-web-shell");
		if (typeof imogi_pos.page_shell.init_owner_page === "function") {
			imogi_pos.page_shell.init_owner_page($shell, __("Audit Hub"));
		}
		$shell
			.find(".imogi-web-hero > div")
			.first()
			.append(`<input type="search" class="imogi-ah-search" placeholder="${__("Cari...")}">`);
		$content.append(`
			<div class="imogi-ah-stats"></div>
			<div class="imogi-ah-body"><div class="imogi-ah-empty">${__("Memuat...")}</div></div>
		`);
		$shell.find(".imogi-ah-tab").on("click", (e) => this.set_tab($(e.currentTarget).data("tab")));
		$shell.find(".imogi-ah-search").on("input change keydown", (e) => {
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
			audit_log: "versions",
			login_history: "login",
			activity_timeline: "timeline",
			discount_analysis: "discount",
			void_analysis: "void",
		};
		tab = aliases[tab] || tab;
		const allowed = this.tabs.map((t) => t.id);
		this.tab = allowed.includes(tab) ? tab : "versions";
		this.page = 1;
		const $shell = this.$content.closest(".imogi-web-shell");
		$shell.find(".imogi-ah-tab").removeClass("is-active");
		$shell.find(`.imogi-ah-tab[data-tab="${this.tab}"]`).addClass("is-active");
		$shell.find(".imogi-ah-search").toggle(["versions", "login", "timeline"].includes(this.tab));
		if (!silent) frappe.set_route("audit-hub", this.tab);
		this.refresh();
	}

	money(v) {
		return format_currency(flt(v) || 0);
	}

	stat_card(label, value) {
		return `<div class="imogi-ah-stat"><div class="imogi-ah-stat-label">${label}</div><div class="imogi-ah-stat-val">${value}</div></div>`;
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
		const $body = this.$content.find(".imogi-ah-body");
		if (!quiet) $body.html(`<div class="imogi-ah-empty">${__("Memuat...")}</div>`);

		frappe.call({
			method: "imogi_pos.api.planned_features_api.get_audit_summary_api",
			callback: (r) => {
				this.summary = r.exc ? {} : r.message || {};
				this.render_stats();
			},
		});

		const methods = {
			versions: "imogi_pos.api.planned_features_api.list_audit_versions_api",
			login: "imogi_pos.api.planned_features_api.list_audit_login_api",
			timeline: "imogi_pos.api.planned_features_api.list_audit_timeline_api",
			discount: "imogi_pos.api.planned_features_api.get_audit_discount_api",
			void: "imogi_pos.api.planned_features_api.get_audit_void_api",
		};
		frappe.call({
			method: methods[this.tab],
			args: { search: this.search || undefined },
			callback: (r) => {
				if (r.exc) {
					if (!quiet) $body.html(`<div class="imogi-ah-empty">${__("Gagal memuat data.")}</div>`);
					return;
				}
				this.data[this.tab] = r.message || {};
				this.render();
			},
		});
	}

	render_stats() {
		const s = this.summary || {};
		this.$content.find(".imogi-ah-stats").html(`
			<div class="imogi-ah-stat-grid">
				${this.stat_card(__("Version 30d"), cint(s.versions_30d))}
				${this.stat_card(__("Login 30d"), cint(s.logins_30d))}
				${this.stat_card(__("Void 30d"), cint(s.voids_30d))}
				${this.stat_card(__("Diskon 30d"), this.money(s.discount_amount_30d))}
			</div>
		`);
	}

	render() {
		const $body = this.$content.find(".imogi-ah-body");
		if (this.tab === "versions") this.render_versions($body);
		else if (this.tab === "login") this.render_login($body);
		else if (this.tab === "timeline") this.render_timeline($body);
		else if (this.tab === "discount") this.render_discount($body);
		else this.render_void($body);
	}

	render_versions($body) {
		const rows = (this.data.versions || {}).rows || [];
		const { page_rows, pager, total } = this.paginate(rows);
		$body.html(`
			<div class="imogi-ah-note"><i class="fa fa-info-circle"></i> ${__(
				"Perubahan dokumen operasional POS (Version). Buka baris untuk detail diff."
			)}</div>
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Audit Log")}</div>
					<span class="imogi-ah-meta">${total} · <a class="imogi-ah-open" href="/app/version">${__("Version List")}</a></span>
				</div>
				<table class="imogi-ah-table">
					<thead><tr><th>${__("Dokumen")}</th><th>${__("Tipe")}</th><th>${__("User")}</th><th>${__("Waktu")}</th></tr></thead>
					<tbody>
						${
							page_rows.length
								? page_rows
										.map(
											(r) => `<tr>
							<td><a class="imogi-ah-open" data-dt="${frappe.utils.escape_html(r.ref_doctype)}" data-name="${frappe.utils.escape_html(
												r.docname
											)}">${frappe.utils.escape_html(r.docname)}</a></td>
							<td>${frappe.utils.escape_html(r.ref_doctype || "")}</td>
							<td>${frappe.utils.escape_html(r.owner || "")}</td>
							<td>${frappe.datetime.str_to_user(r.creation)}</td>
						</tr>`
										)
										.join("")
								: `<tr><td colspan="4" class="imogi-ah-empty">${__("Belum ada perubahan.")}</td></tr>`
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
		this.bind_pager($body);
	}

	render_login($body) {
		const rows = (this.data.login || {}).rows || [];
		const { page_rows, pager, total } = this.paginate(rows);
		$body.html(`
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Login History")}</div>
					<span class="imogi-ah-meta">${total}</span>
				</div>
				<table class="imogi-ah-table">
					<thead><tr><th>${__("User")}</th><th>${__("Operasi")}</th><th>${__("Status")}</th><th>${__("IP")}</th><th>${__(
			"Waktu"
		)}</th></tr></thead>
					<tbody>
						${
							page_rows.length
								? page_rows
										.map(
											(r) => `<tr>
							<td class="imogi-ah-name">${frappe.utils.escape_html(r.user || "")}</td>
							<td>${frappe.utils.escape_html(r.operation || "")}</td>
							<td>${frappe.utils.escape_html(r.status || "")}</td>
							<td>${frappe.utils.escape_html(r.ip_address || "—")}</td>
							<td>${frappe.datetime.str_to_user(r.creation)}</td>
						</tr>`
										)
										.join("")
								: `<tr><td colspan="5" class="imogi-ah-empty">${__("Belum ada login log.")}</td></tr>`
						}
					</tbody>
				</table>
				${pager.html || ""}
			</div>
		`);
		this.bind_pager($body);
	}

	render_timeline($body) {
		const rows = (this.data.timeline || {}).rows || [];
		const { page_rows, pager, total } = this.paginate(rows);
		$body.html(`
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Activity Timeline")}</div>
					<span class="imogi-ah-meta">${total}</span>
				</div>
				<table class="imogi-ah-table">
					<thead><tr><th>${__("Aktivitas")}</th><th>${__("Referensi")}</th><th>${__("User")}</th><th>${__(
			"Waktu"
		)}</th></tr></thead>
					<tbody>
						${
							page_rows.length
								? page_rows
										.map(
											(r) => `<tr>
							<td><div class="imogi-ah-name">${frappe.utils.escape_html(r.subject || r.name)}</div></td>
							<td>${frappe.utils.escape_html(r.reference_doctype || "—")}
								${r.reference_name ? `<div class="imogi-ah-sub">${frappe.utils.escape_html(r.reference_name)}</div>` : ""}</td>
							<td>${frappe.utils.escape_html(r.user || "")}</td>
							<td>${frappe.datetime.str_to_user(r.communication_date || r.creation)}</td>
						</tr>`
										)
										.join("")
								: `<tr><td colspan="4" class="imogi-ah-empty">${__("Belum ada aktivitas.")}</td></tr>`
						}
					</tbody>
				</table>
				${pager.html || ""}
			</div>
		`);
		this.bind_pager($body);
	}

	render_discount($body) {
		const data = this.data.discount || {};
		const rows = data.rows || [];
		const b = data.breakdown || {};
		$body.html(`
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Discount Analysis")}</div>
					<span class="imogi-ah-meta">${frappe.utils.escape_html(data.date_from || "")} → ${frappe.utils.escape_html(
			data.date_to || ""
		)}</span>
				</div>
				<div style="display:grid;gap:10px;grid-template-columns:repeat(4,minmax(0,1fr));padding:14px">
					${this.stat_card(__("Total (tipe)"), this.money(b.total_discount))}
					${this.stat_card(__("Voucher"), this.money(b.voucher))}
					${this.stat_card(__("Poin"), this.money(b.loyalty))}
					${this.stat_card(__("Promo"), this.money(b.promo))}
				</div>
				<table class="imogi-ah-table">
					<thead><tr><th>${__("Tipe Diskon")}</th><th>${__("Order")}</th><th>${__("Total")}</th></tr></thead>
					<tbody>
						${
							rows.length
								? rows
										.map(
											(r) => `<tr>
							<td class="imogi-ah-name">${frappe.utils.escape_html(r.discount_type || "")}</td>
							<td class="imogi-ah-num">${cint(r.orders)}</td>
							<td class="imogi-ah-num">${this.money(r.total_discount)}</td>
						</tr>`
										)
										.join("")
								: `<tr><td colspan="3" class="imogi-ah-empty">${__("Tidak ada diskon di periode ini.")}</td></tr>`
						}
					</tbody>
				</table>
			</div>
		`);
	}

	render_void($body) {
		const data = this.data.void || {};
		const rows = data.rows || [];
		const { page_rows, pager, total } = this.paginate(rows);
		$body.html(`
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Void Analysis")}</div>
					<span class="imogi-ah-meta">${total} · ${this.money(data.total_voided)}</span>
				</div>
				<table class="imogi-ah-table">
					<thead><tr><th>${__("Order")}</th><th>${__("Customer")}</th><th>${__("Nilai")}</th><th>${__(
			"User"
		)}</th><th>${__("Waktu")}</th></tr></thead>
					<tbody>
						${
							page_rows.length
								? page_rows
										.map(
											(r) => `<tr>
							<td><a class="imogi-ah-open" href="/app/riwayat-order/${encodeURIComponent(r.name)}">${frappe.utils.escape_html(
												r.name
											)}</a>
								${r.remarks ? `<div class="imogi-ah-sub">${frappe.utils.escape_html(r.remarks)}</div>` : ""}</td>
							<td>${frappe.utils.escape_html(r.customer_name || "—")}</td>
							<td class="imogi-ah-num">${this.money(r.grand_total)}</td>
							<td>${frappe.utils.escape_html(r.owner || "")}</td>
							<td>${frappe.datetime.str_to_user(r.modified)}</td>
						</tr>`
										)
										.join("")
								: `<tr><td colspan="5" class="imogi-ah-empty">${__("Tidak ada void/cancel di periode ini.")}</td></tr>`
						}
					</tbody>
				</table>
				${pager.html || ""}
			</div>
		`);
		this.bind_pager($body);
	}
};
