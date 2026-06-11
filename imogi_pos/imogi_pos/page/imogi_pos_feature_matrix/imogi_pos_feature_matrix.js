frappe.provide("imogi_pos");

const IMOGI_TIER_RANK = { Free: 0, Starter: 1, Professional: 2, Enterprise: 3 };
const IMOGI_TIER_COLUMNS = ["Free", "Starter", "Professional", "Enterprise"];
const IMOGI_STATUS_LABELS = {
	built: __("Sudah ada"),
	partial: __("Sebagian"),
	planned: __("Belum ada"),
};

function imogi_tier_includes(column_tier, min_tier) {
	return IMOGI_TIER_RANK[column_tier] >= IMOGI_TIER_RANK[min_tier];
}

const IMOGI_TIER_HEADER_CLASS = {
	Free: "imogi-fm-tier-h-free",
	Starter: "imogi-fm-tier-h-starter",
	Professional: "imogi-fm-tier-h-pro",
	Enterprise: "imogi-fm-tier-h-ent",
};

function inject_feature_matrix_css() {
	document.getElementById("imogi-feature-matrix-css")?.remove();
	frappe.dom.set_style(
		`
		.imogi-fm-page.layout-main-section,
		.imogi-fm-page,
		.imogi-fm-page .page-body,
		.imogi-fm-page .layout-main-section-wrapper{background:#f8fafc!important}
		.imogi-fm-page .page-body{padding:16px 20px 28px!important}
		.imogi-fm-shell{color:#0f172a;margin:0 auto;max-width:1440px;padding:0}
		.imogi-fm-hero{align-items:flex-start;background:#fff;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 4px 18px rgba(15,23,42,.05);display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;margin-bottom:16px;padding:20px 22px}
		.imogi-fm-hero h3{color:#0f1f35;font-size:22px;font-weight:800;margin:0 0 6px}
		.imogi-fm-hero p{color:#64748b;font-size:13px;line-height:1.5;margin:0;max-width:640px}
		.imogi-fm-hero-actions{align-items:center;display:flex;flex-wrap:wrap;gap:10px}
		.imogi-fm-tier-pill{background:#fff7ed;border:1px solid #fed7aa;border-radius:999px;color:#92400e;font-size:12px;font-weight:700;padding:8px 14px}
		.imogi-fm-tier-pill strong{color:#c05621}
		.imogi-fm-btn{align-items:center;background:linear-gradient(135deg,#f5b041 0%,#f39c12 100%);border:none;border-radius:10px;box-shadow:0 4px 14px rgba(243,156,18,.28);color:#fff!important;display:inline-flex;font-size:13px;font-weight:700;padding:10px 16px;text-decoration:none!important}
		.imogi-fm-btn:hover{box-shadow:0 6px 18px rgba(243,156,18,.38);color:#fff!important;transform:translateY(-1px)}
		.imogi-fm-stats{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));margin-bottom:16px}
		.imogi-fm-stat{background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 4px 18px rgba(15,23,42,.04);padding:14px 16px}
		.imogi-fm-stat.is-tier-free{border-top:3px solid #a1a1aa}
		.imogi-fm-stat.is-tier-starter{border-top:3px solid #3b82f6}
		.imogi-fm-stat.is-tier-pro{border-top:3px solid #8b5cf6}
		.imogi-fm-stat.is-tier-ent{border-top:3px solid #f59e0b}
		.imogi-fm-stat.is-status-built{border-top:3px solid #22c55e}
		.imogi-fm-stat.is-status-partial{border-top:3px solid #f59e0b}
		.imogi-fm-stat.is-status-planned{border-top:3px solid #ef4444}
		.imogi-fm-stat-label{color:#64748b;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
		.imogi-fm-stat-value{color:#0f172a;font-size:24px;font-weight:800;margin-top:4px}
		.imogi-fm-toolbar{align-items:center;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 4px 18px rgba(15,23,42,.04);display:flex;flex-wrap:wrap;gap:10px;margin-bottom:10px;padding:12px 14px}
		.imogi-fm-search{background:#fff;border:1px solid #e2e8f0;border-radius:10px;color:#0f172a;flex:1;min-width:200px;padding:9px 12px}
		.imogi-fm-search:focus{border-color:#f6ad55;box-shadow:0 0 0 3px rgba(243,156,18,.15);outline:none}
		.imogi-fm-filter,.imogi-fm-preview{background:#fff;border:1px solid #e2e8f0;border-radius:10px;color:#334155;font-size:12px;padding:8px 10px}
		.imogi-fm-tier-chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
		.imogi-fm-chip{background:#fff;border:1px solid #e2e8f0;border-radius:999px;color:#475569;cursor:pointer;font-size:11px;font-weight:700;padding:7px 14px;transition:all .15s ease}
		.imogi-fm-chip:hover{background:#fff7ed;border-color:#f6ad55;color:#c05621}
		.imogi-fm-chip.is-active{background:#0f1f35;border-color:#0f1f35;color:#fff}
		.imogi-fm-table-wrap{background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 4px 18px rgba(15,23,42,.05);overflow:auto}
		.imogi-fm-table{border-collapse:collapse;font-size:12px;min-width:1080px;width:100%}
		.imogi-fm-table th{background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:10px;font-weight:800;letter-spacing:.05em;padding:12px 10px;position:sticky;text-align:center;text-transform:uppercase;top:0;z-index:2}
		.imogi-fm-table th.imogi-fm-sticky-left,.imogi-fm-table td.imogi-fm-sticky-left{left:0;position:sticky;z-index:1}
		.imogi-fm-table th.imogi-fm-sticky-left{background:#f8fafc;z-index:3}
		.imogi-fm-table td.imogi-fm-sticky-left{background:#fff}
		.imogi-fm-table th.imogi-fm-col-feature,.imogi-fm-table td.imogi-fm-col-feature{left:120px;position:sticky;z-index:1}
		.imogi-fm-table th.imogi-fm-col-feature{background:#f8fafc;z-index:3}
		.imogi-fm-table td.imogi-fm-col-feature{background:#fff}
		.imogi-fm-table td{background:#fff;border-bottom:1px solid #f1f5f9;color:#334155;padding:10px;vertical-align:middle}
		.imogi-fm-table tr:hover td{background:#fafafa}
		.imogi-fm-table tr:hover td.imogi-fm-sticky-left,
		.imogi-fm-table tr:hover td.imogi-fm-col-feature{background:#fafafa}
		.imogi-fm-cat-row td{background:#f1f5f9!important;border-bottom:1px solid #e2e8f0!important;color:#0f1f35!important;font-size:11px;font-weight:800;letter-spacing:.06em;padding:10px 12px;text-transform:uppercase}
		.imogi-fm-table th.imogi-fm-col-tier,
		.imogi-fm-table td.imogi-fm-col-tier,
		.imogi-fm-table th.imogi-fm-col-center,
		.imogi-fm-table td.imogi-fm-col-center{text-align:center!important;vertical-align:middle}
		.imogi-fm-check{color:#16a34a;display:inline-block;font-size:15px;font-weight:800;line-height:1;text-align:center;width:100%}
		.imogi-fm-dash{color:#cbd5e1;display:inline-block;line-height:1;text-align:center;width:100%}
		.imogi-fm-role{background:#eff6ff;border:1px solid #bfdbfe;border-radius:999px;color:#1d4ed8;display:inline-block;font-size:10px;font-weight:700;padding:4px 8px;white-space:nowrap}
		.imogi-fm-status{border-radius:999px;display:inline-block;font-size:10px;font-weight:700;padding:4px 10px}
		.imogi-fm-status.is-built{background:#ecfdf5;border:1px solid #a7f3d0;color:#047857}
		.imogi-fm-status.is-partial{background:#fffbeb;border:1px solid #fde68a;color:#b45309}
		.imogi-fm-status.is-planned{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c}
		.imogi-fm-op-yes{color:#047857;font-weight:700}
		.imogi-fm-op-no{color:#94a3b8}
		.imogi-fm-trigger{color:#64748b;font-size:11px}
		.imogi-fm-loading{color:#64748b;padding:40px;text-align:center}
		.imogi-fm-tier-h-free{background:#f4f4f5!important;color:#52525b!important}
		.imogi-fm-tier-h-starter{background:#eff6ff!important;color:#1d4ed8!important}
		.imogi-fm-tier-h-pro{background:#f5f3ff!important;color:#6d28d9!important}
		.imogi-fm-tier-h-ent{background:#fffbeb!important;color:#b45309!important}
		.imogi-fm-col-tier.imogi-fm-tier-free{background:#fafafa}
		.imogi-fm-col-tier.imogi-fm-tier-starter{background:#f8fbff}
		.imogi-fm-col-tier.imogi-fm-tier-pro{background:#faf8ff}
		.imogi-fm-col-tier.imogi-fm-tier-ent{background:#fffdf5}
		.imogi-fm-col-tier.is-preview{background:#fff7ed!important;border-left:2px solid #f6ad55;border-right:2px solid #f6ad55;box-shadow:none}
		.imogi-fm-table td.imogi-fm-col-tier.is-preview{border-bottom-color:#fed7aa}
		.imogi-fm-table thead th.imogi-fm-col-tier.is-preview{background:#ffedd5!important;border-top:2px solid #f6ad55}
		.imogi-fm-table tbody tr:last-child td.imogi-fm-col-tier.is-preview{border-bottom:2px solid #f6ad55}
		.imogi-fm-table tr:hover td.imogi-fm-col-tier.is-preview{background:#ffedd5!important}
		.imogi-fm-table tr.imogi-fm-cat-row td.imogi-fm-col-tier.is-preview{background:#fff7ed!important}
		`,
		"imogi-feature-matrix-css"
	);
}

function imogi_fm_tier_gating_disabled() {
	return imogi_pos.is_subscription_tier_disabled ? imogi_pos.is_subscription_tier_disabled() : true;
}

imogi_pos.FeatureMatrixPage = class FeatureMatrixPage {
	constructor(page) {
		this.page = page;
		this.wrapper = $(page.main);
		this.preview_tier = null;
		this.filter_tier = "all";
		this.filter_status = "all";
		this.search = "";
		this.data = null;
		this.no_tier_mode = imogi_fm_tier_gating_disabled();
		this.make();
		this.load();
	}

	make() {
		const hero_copy = this.no_tier_mode
			? __("Referensi modul, role matrix, dan status implementasi. Akses fitur di ERPNext dikontrol oleh role + toggle di IMOGI POS Settings.")
			: __(
					"Visibility akses fitur berdasarkan paket langganan. Kolom centang = fitur tersedia di tier tersebut (kumulatif)."
			  );
		this.wrapper.html(`
			<div class="imogi-fm-shell">
				<div class="imogi-fm-hero">
					<div>
						<h3>${__("Matrix Role & Module POS F&B")}</h3>
						<p>${hero_copy}</p>
					</div>
					<div class="imogi-fm-hero-actions">
						<div class="imogi-fm-tier-pill imogi-fm-current-tier"></div>
						<a class="imogi-fm-btn" href="/app/imogi-pos-settings">${__("IMOGI POS Settings")}</a>
					</div>
				</div>
				<div class="imogi-fm-stats"></div>
				<div class="imogi-fm-toolbar">
					<input type="search" class="imogi-fm-search" placeholder="${__("Cari fitur atau modul...")}" />
					${
						this.no_tier_mode
							? ""
							: `<select class="imogi-fm-preview">
						<option value="">${__("Preview tier: Aktif (site)")}</option>
						${IMOGI_TIER_COLUMNS.map(
							(t) => `<option value="${t}">${__("Preview tier")}: ${t}</option>`
						).join("")}
					</select>
					<select class="imogi-fm-filter">
						<option value="all">${__("Semua tier")}</option>
						${IMOGI_TIER_COLUMNS.map((t) => `<option value="${t}">${t}</option>`).join("")}
					</select>`
					}
				</div>
				<div class="imogi-fm-tier-chips"></div>
				<div class="imogi-fm-table-wrap">
					<div class="imogi-fm-loading"><i class="fa fa-spinner fa-spin"></i> ${__("Memuat matrix...")}</div>
				</div>
			</div>
		`);
		this.$stats = this.wrapper.find(".imogi-fm-stats");
		this.$current_tier = this.wrapper.find(".imogi-fm-current-tier");
		this.$table_wrap = this.wrapper.find(".imogi-fm-table-wrap");
		this.$chips = this.wrapper.find(".imogi-fm-tier-chips");

		this.wrapper.find(".imogi-fm-search").on("input", (e) => {
			this.search = (e.target.value || "").trim().toLowerCase();
			this.render_table();
		});
		this.wrapper.find(".imogi-fm-preview").on("change", (e) => {
			this.preview_tier = e.target.value || null;
			this.load();
		});
		this.wrapper.find(".imogi-fm-filter").on("change", (e) => {
			this.filter_tier = e.target.value || "all";
			this.render_table();
		});

		this.render_status_chips();
	}

	render_status_chips() {
		const statuses = [
			{ id: "all", label: __("Semua status") },
			{ id: "built", label: __("Sudah ada") },
			{ id: "partial", label: __("Sebagian") },
			{ id: "planned", label: __("Belum ada") },
		];
		this.$chips.html(
			statuses
				.map(
					(s) =>
						`<button type="button" class="imogi-fm-chip${
							this.filter_status === s.id ? " is-active" : ""
						}" data-status="${s.id}">${s.label}</button>`
				)
				.join("")
		);
		this.$chips.find(".imogi-fm-chip").on("click", (e) => {
			this.filter_status = $(e.currentTarget).data("status");
			this.render_status_chips();
			this.render_table();
		});
	}

	load() {
		this.$table_wrap.html(
			`<div class="imogi-fm-loading"><i class="fa fa-spinner fa-spin"></i> ${__("Memuat matrix...")}</div>`
		);
		frappe.call({
			method: "imogi_pos.api.feature_api.get_feature_matrix",
			args: { tier: this.preview_tier || "" },
			callback: (r) => {
				if (r.exc) return;
				this.data = r.message || {};
				this.render_summary();
				this.render_table();
			},
		});
	}

	render_summary() {
		const d = this.data || {};
		const summary = d.summary || {};
		const per = summary.per_tier || {};
		const by_status = summary.by_status || {};
		if (this.no_tier_mode) {
			this.$current_tier.html(__("ERPNext penuh — tanpa paket langganan"));
			this.$stats.html(`
				<div class="imogi-fm-stat"><div class="imogi-fm-stat-label">${__("Total Fitur")}</div><div class="imogi-fm-stat-value">${
					summary.total_features || 0
				}</div></div>
				<div class="imogi-fm-stat is-status-built"><div class="imogi-fm-stat-label">${__("Sudah ada")}</div><div class="imogi-fm-stat-value">${
					by_status.built || 0
				}</div></div>
				<div class="imogi-fm-stat is-status-partial"><div class="imogi-fm-stat-label">${__("Sebagian")}</div><div class="imogi-fm-stat-value">${
					by_status.partial || 0
				}</div></div>
				<div class="imogi-fm-stat is-status-planned"><div class="imogi-fm-stat-label">${__("Belum ada")}</div><div class="imogi-fm-stat-value">${
					by_status.planned || 0
				}</div></div>
			`);
			return;
		}
		const preview = d.preview_tier
			? ` · ${__("Preview")}: <strong>${frappe.utils.escape_html(d.preview_tier)}</strong>`
			: "";
		this.$current_tier.html(
			`${__("Paket aktif")}: <strong>${frappe.utils.escape_html(
				d.subscription_tier || "—"
			)}</strong>${preview}`
		);
		const tier_stat_class = {
			Free: "is-tier-free",
			Starter: "is-tier-starter",
			Professional: "is-tier-pro",
			Enterprise: "is-tier-ent",
		};
		this.$stats.html(`
			<div class="imogi-fm-stat"><div class="imogi-fm-stat-label">${__("Total Fitur")}</div><div class="imogi-fm-stat-value">${
				summary.total_features || 0
			}</div></div>
			${IMOGI_TIER_COLUMNS.map(
				(t) =>
					`<div class="imogi-fm-stat ${tier_stat_class[t] || ""}"><div class="imogi-fm-stat-label">${__("Ada di")} ${t}</div><div class="imogi-fm-stat-value">${
						per[t] || 0
					}</div></div>`
			).join("")}
			<div class="imogi-fm-stat is-status-built"><div class="imogi-fm-stat-label">${__("Sudah ada")}</div><div class="imogi-fm-stat-value">${
				by_status.built || 0
			}</div></div>
			<div class="imogi-fm-stat is-status-partial"><div class="imogi-fm-stat-label">${__("Sebagian")}</div><div class="imogi-fm-stat-value">${
				by_status.partial || 0
			}</div></div>
			<div class="imogi-fm-stat is-status-planned"><div class="imogi-fm-stat-label">${__("Belum ada")}</div><div class="imogi-fm-stat-value">${
				by_status.planned || 0
			}</div></div>
		`);
	}

	filter_features(features) {
		return (features || []).filter((row) => {
			if (this.filter_status !== "all" && row.status !== this.filter_status) return false;
			if (this.filter_tier !== "all" && !imogi_tier_includes(this.filter_tier, row.min_tier)) return false;
			if (this.search) {
				const hay = `${row.category} ${row.label} ${row.role} ${row.id} ${row.trigger_upgrade || ""}`.toLowerCase();
				if (!hay.includes(this.search)) return false;
			}
			return true;
		});
	}

	render_table() {
		const features = this.filter_features(this.data?.features || []);
		if (!features.length) {
			this.$table_wrap.html(`<div class="imogi-fm-loading">${__("Tidak ada fitur cocok dengan filter.")}</div>`);
			return;
		}

		const preview = this.data?.view_tier || this.preview_tier || this.data?.subscription_tier;
		let last_cat = "";
		const rows = [];

		const col_span = this.no_tier_mode ? 5 : 11;

		features.forEach((row) => {
			if (row.category !== last_cat) {
				last_cat = row.category;
				rows.push(`<tr class="imogi-fm-cat-row"><td colspan="${col_span}">${frappe.utils.escape_html(row.category)}</td></tr>`);
			}
			const tier_cell_class = {
				Free: "imogi-fm-tier-free",
				Starter: "imogi-fm-tier-starter",
				Professional: "imogi-fm-tier-pro",
				Enterprise: "imogi-fm-tier-ent",
			};
			const tier_cells = this.no_tier_mode
				? ""
				: IMOGI_TIER_COLUMNS.map((tier) => {
						const on = imogi_tier_includes(tier, row.min_tier);
						const cls = [
							"imogi-fm-col-tier",
							tier_cell_class[tier],
							tier === preview ? "is-preview" : "",
						]
							.filter(Boolean)
							.join(" ");
						return `<td class="${cls}">${on ? '<span class="imogi-fm-check">✓</span>' : '<span class="imogi-fm-dash">—</span>'}</td>`;
				  }).join("");

			rows.push(`<tr>
				<td class="imogi-fm-sticky-left">${frappe.utils.escape_html(row.category)}</td>
				<td class="imogi-fm-col-feature"><strong>${frappe.utils.escape_html(row.label)}</strong></td>
				<td><span class="imogi-fm-role">${frappe.utils.escape_html(row.role)}</span></td>
				${tier_cells}
				<td class="imogi-fm-col-center"><span class="imogi-fm-status is-${row.status}">${IMOGI_STATUS_LABELS[row.status] || row.status}</span></td>
				<td class="imogi-fm-col-center ${row.operational ? "imogi-fm-op-yes" : "imogi-fm-op-no"}">${row.operational ? __("Ya") : __("Tidak")}</td>
				${
					this.no_tier_mode
						? ""
						: `<td class="imogi-fm-trigger">${frappe.utils.escape_html(row.trigger_upgrade || "—")}</td>`
				}
			</tr>`);
		});

		const tier_headers = this.no_tier_mode
			? ""
			: IMOGI_TIER_COLUMNS.map((t) => {
					const cls = [
						"imogi-fm-col-tier",
						IMOGI_TIER_HEADER_CLASS[t],
						t === preview ? "is-preview" : "",
					]
						.filter(Boolean)
						.join(" ");
					return `<th class="${cls}">${t}</th>`;
			  }).join("");

		this.$table_wrap.html(`
			<table class="imogi-fm-table">
				<thead>
					<tr>
						<th class="imogi-fm-sticky-left">${__("Kategori")}</th>
						<th class="imogi-fm-col-feature">${__("Modul / Fitur")}</th>
						<th>${__("Role")}</th>
						${tier_headers}
						<th class="imogi-fm-col-center">${__("Status")}</th>
						<th class="imogi-fm-col-center">${__("Operasional")}</th>
						${this.no_tier_mode ? "" : `<th>${__("Trigger Upgrade")}</th>`}
					</tr>
				</thead>
				<tbody>${rows.join("")}</tbody>
			</table>
		`);
	}
};

frappe.pages["imogi-pos-feature-matrix"].on_page_load = function (wrapper) {
	inject_feature_matrix_css();
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Matrix Role & Fitur"),
		single_column: true,
	});
	page.main.addClass("imogi-fm-page");
	new imogi_pos.FeatureMatrixPage(page);
};
