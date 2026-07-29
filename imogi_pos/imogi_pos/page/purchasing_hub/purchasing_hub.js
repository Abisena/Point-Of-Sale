frappe.provide("imogi_pos");

function inject_purchasing_hub_css() {
	for (let v = 1; v <= 4; v += 1) {
		document.getElementById(`imogi-purchasing-hub-css-v${v}`)?.remove();
	}
	if (document.getElementById("imogi-purchasing-hub-css-v5")) return;
	frappe.dom.set_style(
		`
		body.imogi-ph-fullscreen,
		body.imogi-ph-fullscreen .main-section,
		body.imogi-ph-fullscreen .page-container,
		body.imogi-ph-fullscreen .content.page-container,
		body.imogi-ph-fullscreen .container,
		body.imogi-ph-fullscreen .container.page-body,
		body.imogi-ph-fullscreen .row.layout-main,
		body.imogi-ph-fullscreen .layout-main,
		body.imogi-ph-fullscreen .layout-main-section-wrapper,
		body.imogi-ph-fullscreen .layout-main-section,
		body.imogi-ph-fullscreen .layout-main-section-wrapper > [class*="col-"],
		body.imogi-ph-fullscreen .page-body{
			box-sizing:border-box!important;margin-left:0!important;margin-right:0!important;
			max-width:100%!important;width:100%!important;background:#fff!important
		}
		body.imogi-ph-fullscreen .imogi-purchasing-hub,
		body.imogi-ph-fullscreen .imogi-web-shell-root.imogi-purchasing-hub{max-width:100%!important;width:100%!important}
		body.imogi-ph-fullscreen .imogi-web-shell{
			margin:0!important;max-width:100%!important;padding-left:20px!important;padding-right:20px!important;width:100%!important
		}
		body.imogi-ph-fullscreen .imogi-web-content{max-width:100%!important;width:100%!important;overflow:visible!important}
		.imogi-purchasing-hub .page-head{display:none!important}
		.imogi-purchasing-hub .imogi-web-hero{
			align-items:center!important;margin-bottom:14px!important;border-bottom:1px solid #e2e8f0!important;
			border-radius:0!important;box-shadow:none!important;gap:16px!important
		}
		.imogi-purchasing-hub .imogi-web-hero > div:first-child{
			align-items:center;display:flex;flex:1;flex-wrap:wrap;gap:12px 20px;min-width:0
		}
		.imogi-purchasing-hub .imogi-web-hero h3{margin:0!important;white-space:nowrap}
		.imogi-purchasing-hub .imogi-ph-search{
			background:#fff;border:1px solid #cbd5e1;border-radius:8px;flex:1;font-size:13px;
			height:36px;max-width:420px;min-width:200px;padding:0 12px
		}
		.imogi-purchasing-hub .imogi-ph-search:focus{border-color:#8b5cf6;outline:none;box-shadow:0 0 0 3px rgba(139,92,246,.15)}
		.imogi-purchasing-hub .imogi-web-actions{align-items:center;display:flex;flex-wrap:wrap;gap:8px}
		.imogi-purchasing-hub button.imogi-ph-tab{
			align-items:center!important;appearance:none!important;background:#fff!important;border:1px solid #cbd5e1!important;
			border-radius:6px!important;color:#475569!important;cursor:pointer!important;display:inline-flex!important;
			font-size:12px!important;font-weight:700!important;gap:5px!important;height:36px!important;margin:0!important;padding:0 12px!important
		}
		.imogi-purchasing-hub button.imogi-ph-tab.is-active{
			background:#f5f3ff!important;border-color:#8b5cf6!important;color:#6d28d9!important
		}
		.imogi-purchasing-hub .imogi-ph-stat-grid{display:grid;gap:10px;grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:14px}
		.imogi-purchasing-hub .imogi-ph-stat{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px}
		.imogi-purchasing-hub .imogi-ph-stat-label{color:#64748b;font-size:10px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}
		.imogi-purchasing-hub .imogi-ph-stat-val{color:#0f172a;font-size:22px;font-weight:800;margin-top:6px}
		.imogi-purchasing-hub .imogi-web-panel{background:#fff;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:12px}
		.imogi-purchasing-hub .imogi-web-panel--form{overflow:visible!important;position:relative;z-index:5}
		.imogi-purchasing-hub .imogi-web-panel--warn{border-color:#fed7aa}
		.imogi-purchasing-hub .imogi-web-panel-head{
			align-items:center;border-bottom:1px solid #f1f5f9;display:flex;gap:10px;justify-content:space-between;padding:12px 14px
		}
		.imogi-purchasing-hub .imogi-web-panel-title{color:#0f172a;font-size:13px;font-weight:800}
		.imogi-purchasing-hub .imogi-ph-meta{color:#64748b;font-size:11px;font-weight:600}
		.imogi-purchasing-hub .imogi-ph-table{width:100%;border-collapse:collapse}
		.imogi-purchasing-hub .imogi-ph-table th{
			background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:10px;font-weight:800;
			letter-spacing:.04em;padding:10px 12px;text-align:left;text-transform:uppercase
		}
		.imogi-purchasing-hub .imogi-ph-table td{border-bottom:1px solid #f1f5f9;color:#334155;font-size:13px;padding:10px 12px}
		.imogi-purchasing-hub .imogi-ph-table tbody tr:hover td{background:#faf5ff}
		.imogi-purchasing-hub .imogi-ph-name{color:#0f172a;font-weight:800}
		.imogi-purchasing-hub .imogi-ph-sub{color:#64748b;font-size:11px;font-weight:600;margin-top:2px}
		.imogi-purchasing-hub .imogi-ph-num{font-variant-numeric:tabular-nums;font-weight:700;white-space:nowrap}
		.imogi-purchasing-hub .imogi-ph-badge{border-radius:999px;display:inline-block;font-size:10px;font-weight:700;padding:3px 8px}
		.imogi-purchasing-hub .imogi-ph-badge--ok{background:#ecfdf5;border:1px solid #a7f3d0;color:#047857}
		.imogi-purchasing-hub .imogi-ph-badge--draft{background:#fff7ed;border:1px solid #fed7aa;color:#c2410c}
		.imogi-purchasing-hub .imogi-ph-badge--warn{background:#fffbeb;border:1px solid #fcd34d;color:#92400e}
		.imogi-purchasing-hub .imogi-ph-empty{color:#64748b;padding:36px 16px;text-align:center}
		.imogi-purchasing-hub .imogi-ph-actions{align-items:center;display:flex;flex-wrap:wrap;gap:6px}
		.imogi-purchasing-hub button.imogi-ph-mini{
			align-items:center;appearance:none;background:#fff;border:1px solid #cbd5e1;border-radius:6px;
			color:#334155;cursor:pointer;display:inline-flex;font-size:11px;font-weight:700;gap:4px;
			height:26px;padding:0 9px;white-space:nowrap
		}
		.imogi-purchasing-hub button.imogi-ph-mini--approve{background:#ecfdf5;border-color:#a7f3d0;color:#047857}
		.imogi-purchasing-hub button.imogi-ph-mini--reject{background:#fef2f2;border-color:#fecaca;color:#b91c1c}
		.imogi-purchasing-hub button.imogi-ph-mini--primary{background:#f5f3ff;border-color:#c4b5fd;color:#6d28d9}
		.imogi-purchasing-hub .imogi-ph-form{
			display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));overflow:visible!important;padding:14px;position:relative;z-index:20
		}
		.imogi-purchasing-hub .imogi-ph-form label{color:#64748b;display:block;font-size:11px;font-weight:700;margin-bottom:4px}
		.imogi-purchasing-hub .imogi-ph-form input,.imogi-purchasing-hub .imogi-ph-form select,
		.imogi-purchasing-hub .imogi-ph-form .frappe-control input,
		.imogi-purchasing-hub .imogi-ph-form .frappe-control .input-with-feedback,
		.imogi-purchasing-hub .imogi-ph-form .awesomplete > input,
		.imogi-purchasing-hub .imogi-ph-itemrows input,
		.imogi-purchasing-hub .imogi-ph-itemrows .frappe-control input,
		.imogi-purchasing-hub .imogi-ph-itemrows .frappe-control .input-with-feedback,
		.imogi-purchasing-hub .imogi-ph-itemrows .awesomplete > input{
			background:#fff!important;border:1px solid #cbd5e1!important;border-radius:8px!important;
			box-shadow:none!important;color:#0f172a!important;font-size:13px!important;height:36px!important;
			padding:0 10px!important;width:100%!important
		}
		.imogi-purchasing-hub .imogi-ph-form .frappe-control input:focus,
		.imogi-purchasing-hub .imogi-ph-form .awesomplete > input:focus,
		.imogi-purchasing-hub .imogi-ph-form input:focus,
		.imogi-purchasing-hub .imogi-ph-itemrows .frappe-control input:focus,
		.imogi-purchasing-hub .imogi-ph-itemrows .awesomplete > input:focus{
			border-color:#8b5cf6!important;box-shadow:0 0 0 3px rgba(139,92,246,.15)!important;outline:none!important
		}
		.imogi-purchasing-hub .imogi-ph-form .frappe-control,
		.imogi-purchasing-hub .imogi-ph-form .awesomplete,
		.imogi-purchasing-hub .imogi-ph-form .form-group,
		.imogi-purchasing-hub .imogi-ph-itemrows .frappe-control,
		.imogi-purchasing-hub .imogi-ph-itemrows .awesomplete,
		.imogi-purchasing-hub .imogi-ph-itemrows .form-group{
			margin-bottom:0!important;overflow:visible!important;position:relative;z-index:7;width:100%
		}
		.imogi-purchasing-hub .imogi-ph-form .control-label,
		.imogi-purchasing-hub .imogi-ph-form .help-box,
		.imogi-purchasing-hub .imogi-ph-form .link-btn,
		.imogi-purchasing-hub .imogi-ph-itemrows .control-label,
		.imogi-purchasing-hub .imogi-ph-itemrows .help-box,
		.imogi-purchasing-hub .imogi-ph-itemrows .link-btn{display:none!important}
		.imogi-purchasing-hub .imogi-ph-form .awesomplete > ul,
		.imogi-purchasing-hub .imogi-ph-itemrows .awesomplete > ul{
			background:#fff!important;border:1px solid #cbd5e1!important;border-radius:8px!important;
			box-shadow:0 10px 28px rgba(15,23,42,.14)!important;max-height:240px!important;
			overflow-y:auto!important;z-index:10050!important
		}
		.imogi-purchasing-hub .imogi-ph-form .awesomplete > ul > li,
		.imogi-purchasing-hub .imogi-ph-itemrows .awesomplete > ul > li{
			border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:12px;font-weight:600;padding:8px 12px
		}
		.imogi-purchasing-hub .imogi-ph-form .awesomplete > ul > li:hover,
		.imogi-purchasing-hub .imogi-ph-form .awesomplete > ul > li[aria-selected=true],
		.imogi-purchasing-hub .imogi-ph-itemrows .awesomplete > ul > li:hover,
		.imogi-purchasing-hub .imogi-ph-itemrows .awesomplete > ul > li[aria-selected=true]{
			background:#f5f3ff!important;color:#6d28d9!important
		}
		.imogi-purchasing-hub button.imogi-ph-btn{
			align-items:center;appearance:none;background:#8b5cf6;border:none;border-radius:8px;color:#fff!important;
			cursor:pointer;display:inline-flex;font-size:12px;font-weight:700;gap:6px;height:36px;padding:0 14px
		}
		.imogi-purchasing-hub button.imogi-ph-btn--ghost{background:#fff;border:1px solid #cbd5e1;color:#475569!important}
		.imogi-purchasing-hub .imogi-ph-itemrows{
			display:flex;flex-direction:column;gap:8px;max-height:340px;overflow-y:auto;overflow-x:visible;
			padding:14px 14px 0;position:relative;z-index:6
		}
		.imogi-purchasing-hub .imogi-ph-itemrow{
			align-items:center;display:grid;gap:8px;
			grid-template-columns:minmax(160px,2fr) 100px 100px 32px
		}
		.imogi-purchasing-hub .imogi-ph-itemrow.imogi-ph-itemrow--no-rate{grid-template-columns:minmax(160px,2fr) 100px 32px}
		.imogi-purchasing-hub .imogi-ph-itemrow input[type=number]{
			background:#fff;border:1px solid #cbd5e1;border-radius:8px;color:#0f172a;font-size:13px;height:36px;padding:0 10px;width:100%
		}
		.imogi-purchasing-hub .imogi-ph-itemrow input[type=number]:focus{
			border-color:#8b5cf6;box-shadow:0 0 0 3px rgba(139,92,246,.15);outline:none
		}
		.imogi-purchasing-hub .imogi-ph-itemrow-remove{
			align-items:center;appearance:none;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;
			color:#b91c1c;cursor:pointer;display:inline-flex;height:36px;justify-content:center;width:32px
		}
		.imogi-purchasing-hub .imogi-ph-itemrows-actions{display:flex;gap:8px;padding:2px 14px 14px}
		.imogi-purchasing-hub .imogi-ph-rc-grid{border-top:1px solid #f1f5f9;margin-top:10px;padding:12px 14px}
		.imogi-purchasing-hub .imogi-ph-rc-line{
			align-items:center;border-bottom:1px solid #f1f5f9;display:grid;gap:8px;
			grid-template-columns:2fr 90px 90px 110px;padding:8px 0
		}
		.imogi-purchasing-hub .imogi-ph-rc-line input[type=number]{
			background:#fff;border:1px solid #cbd5e1;border-radius:8px;color:#0f172a;font-size:13px;height:32px;padding:0 8px;width:100%
		}
		@media (max-width:900px){
			.imogi-purchasing-hub .imogi-ph-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
			.imogi-purchasing-hub .imogi-ph-itemrow{grid-template-columns:1fr}
			.imogi-purchasing-hub .imogi-ph-rc-line{grid-template-columns:1fr}
		}
		`,
		"imogi-purchasing-hub-css-v5"
	);
}

function activate_purchasing_hub_fullscreen() {
	document.body.classList.add("imogi-ph-fullscreen");
	if (!window.__imogi_ph_fullscreen_bound) {
		window.__imogi_ph_fullscreen_bound = true;
		$(document).on("page-change.imogi-ph-fs", () => {
			const route = (frappe.get_route_str && frappe.get_route_str()) || "";
			if (route.indexOf("purchasing-hub") === -1) {
				document.body.classList.remove("imogi-ph-fullscreen");
			} else {
				document.body.classList.add("imogi-ph-fullscreen");
			}
		});
	}
}

frappe.pages["purchasing-hub"].on_page_load = function (wrapper) {
	inject_purchasing_hub_css();
	activate_purchasing_hub_fullscreen();
	imogi_pos.PurchasingHub = new imogi_pos.PurchasingHubView(wrapper);
};

frappe.pages["purchasing-hub"].on_page_show = function () {
	inject_purchasing_hub_css();
	activate_purchasing_hub_fullscreen();
	if (imogi_pos.PurchasingHub) {
		const route = frappe.get_route() || [];
		const tab = (route[1] || frappe.route_options?.tab || "").toString();
		if (tab && tab !== imogi_pos.PurchasingHub.tab) {
			imogi_pos.PurchasingHub.set_tab(tab, true);
		} else {
			imogi_pos.PurchasingHub.refresh({ quiet: true, keep_page: true });
		}
		imogi_pos.PurchasingHub.start_auto_refresh();
	}
};

imogi_pos.PurchasingHubView = class PurchasingHubView {
	constructor(wrapper) {
		this.wrapper = $(wrapper);
		this.tab = "requests";
		this.page_size = 10;
		this.page = 1;
		this.search = "";
		this.summary = null;
		this.requests = null;
		this.orders = null;
		this.receipts = null;
		this.invoices = null;
		this._pr_rows = null;
		this._po_rows = null;
		this._rc_po = null;
		this._rc_lines = null;
		this._poll_timer = null;
		this.make();
		const route = frappe.get_route() || [];
		const tab = (route[1] || frappe.route_options?.tab || "requests").toString();
		this.set_tab(tab, true);
		this.start_auto_refresh();
	}

	make() {
		const page = imogi_pos.page_shell.make_page(
			this.wrapper.get(0),
			__("Purchasing Hub"),
			"imogi-purchasing-hub"
		);
		this.wrapper.find(".page-head").hide();
		const TABS = [
			{ id: "requests", label: __("Purchase Request"), icon: "fa-file-text" },
			{ id: "orders", label: __("Purchase Order"), icon: "fa-shopping-cart" },
			{ id: "receiving", label: __("Receiving"), icon: "fa-truck" },
			{ id: "invoices", label: __("Tagihan"), icon: "fa-file-invoice" },
		];
		this.tabs = TABS;
		const tab_actions = TABS.map(
			(t) =>
				`<button type="button" class="imogi-ph-tab${t.id === "requests" ? " is-active" : ""}" data-tab="${
					t.id
				}"><i class="fa ${t.icon}"></i><span>${t.label}</span></button>`
		).join("");
		const $content = imogi_pos.page_shell.render_hero(page.main, {
			title: __("Purchasing Hub"),
			actions_html: tab_actions,
		});
		this.$content = $content;
		const $shell = $content.closest(".imogi-web-shell");
		if (typeof imogi_pos.page_shell.init_owner_page === "function") {
			imogi_pos.page_shell.init_owner_page($shell, __("Purchasing Hub"));
		}
		$shell
			.find(".imogi-web-hero > div")
			.first()
			.append(`<input type="search" class="imogi-ph-search" placeholder="${__("Cari dokumen...")}">`);
		$content.append(`
			<div class="imogi-ph-stats"></div>
			<div class="imogi-ph-body"><div class="imogi-ph-empty">${__("Memuat...")}</div></div>
		`);
		$shell.find(".imogi-ph-tab").on("click", (e) => this.set_tab($(e.currentTarget).data("tab")));
		$shell.find(".imogi-ph-search").on("input change keydown", (e) => {
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
			if (route.indexOf("purchasing-hub") === -1) return;
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
		const allowed = this.tabs.map((t) => t.id);
		this.tab = allowed.includes(tab) ? tab : "requests";
		this.page = 1;
		const $shell = this.$content.closest(".imogi-web-shell");
		$shell.find(".imogi-ph-tab").removeClass("is-active");
		$shell.find(`.imogi-ph-tab[data-tab="${this.tab}"]`).addClass("is-active");
		if (!silent) frappe.set_route("purchasing-hub", this.tab);
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
		return `<div class="imogi-ph-stat"><div class="imogi-ph-stat-label">${label}</div><div class="imogi-ph-stat-val">${value}</div></div>`;
	}

	status_badge(row) {
		if (row.approval_request)
			return `<span class="imogi-ph-badge imogi-ph-badge--warn">${__("Menunggu Approval")}</span>`;
		if (cint(row.docstatus) === 0)
			return `<span class="imogi-ph-badge imogi-ph-badge--draft">${__("Draft")}</span>`;
		return `<span class="imogi-ph-badge imogi-ph-badge--ok">${frappe.utils.escape_html(
			row.status || __("Submitted")
		)}</span>`;
	}

	/**
	 * Repeatable item-rows editor shared by the Purchase Request and Purchase
	 * Order forms. `state_key` points at an instance array so in-progress rows
	 * survive the silent 45s auto-refresh re-render.
	 */
	make_item_rows_editor($container, state_key, { with_rate } = {}) {
		if (!this[state_key] || !this[state_key].length) {
			this[state_key] = [{ item_code: "", qty: 1, rate: 0, _ctrl: null }];
		}
		const rows = this[state_key];
		// Frappe's Link control doesn't reliably fire a plain DOM "change" event
		// when a value is picked from the awesomplete dropdown, so mirroring via
		// an event listener can silently miss the selection. Always pull the
		// live value straight from the control instance instead.
		const sync_from_controls = () => {
			rows.forEach((row) => {
				if (row._ctrl) row.item_code = (row._ctrl.get_value() || "").trim() || row.item_code;
			});
		};
		const render = () => {
			sync_from_controls();
			$container.empty();
			rows.forEach((row, idx) => {
				const $row = $(`
					<div class="imogi-ph-itemrow${with_rate ? "" : " imogi-ph-itemrow--no-rate"}" data-idx="${idx}">
						<div class="imogi-ph-itemrow-item"></div>
						<input type="number" min="0.001" step="0.001" class="imogi-ph-itemrow-qty" value="${
							row.qty || 1
						}" placeholder="${__("Qty")}">
						${
							with_rate
								? `<input type="number" min="0" step="0.01" class="imogi-ph-itemrow-rate" value="${
										row.rate || 0
								  }" placeholder="${__("Rate")}">`
								: ""
						}
						<button type="button" class="imogi-ph-itemrow-remove" title="${__("Hapus baris")}"><i class="fa fa-trash"></i></button>
					</div>
				`);
				$container.append($row);
				const ctrl = this.make_link($row.find(".imogi-ph-itemrow-item"), {
					options: "Item",
					fieldname: "item_code",
					filters: { disabled: 0, is_stock_item: 1 },
				});
				if (row.item_code) ctrl.set_value(row.item_code);
				row._ctrl = ctrl;
				$row.find(".imogi-ph-itemrow-qty").on("input change", (e) => {
					row.qty = flt($(e.currentTarget).val());
				});
				if (with_rate) {
					$row.find(".imogi-ph-itemrow-rate").on("input change", (e) => {
						row.rate = flt($(e.currentTarget).val());
					});
				}
				$row.find(".imogi-ph-itemrow-remove").on("click", () => {
					if (rows.length <= 1) return;
					rows.splice(idx, 1);
					render();
				});
			});
		};
		render();
		return {
			add_row: () => {
				rows.push({ item_code: "", qty: 1, rate: 0, _ctrl: null });
				render();
			},
			get_rows: () => {
				sync_from_controls();
				return rows.map(({ _ctrl, ...rest }) => rest);
			},
			reset: () => {
				rows.length = 0;
				rows.push({ item_code: "", qty: 1, rate: 0, _ctrl: null });
				render();
			},
		};
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
		const $body = this.$content.find(".imogi-ph-body");
		if (!quiet) $body.html(`<div class="imogi-ph-empty">${__("Memuat...")}</div>`);

		frappe.call({
			method: "imogi_pos.api.planned_features_api.get_purchasing_summary_api",
			callback: (r) => {
				this.summary = r.exc ? {} : r.message || {};
				this.render_stats();
			},
		});

		const methods = {
			requests: "imogi_pos.api.planned_features_api.list_purchasing_requests_api",
			orders: "imogi_pos.api.planned_features_api.list_purchasing_orders_api",
			receiving: "imogi_pos.api.planned_features_api.list_purchasing_receipts_api",
			invoices: "imogi_pos.api.planned_features_api.list_purchasing_invoices_api",
		};
		const keys = { requests: "requests", orders: "orders", receiving: "receipts", invoices: "invoices" };
		frappe.call({
			method: methods[this.tab],
			args: { search: this.search || undefined },
			callback: (r) => {
				if (r.exc) {
					if (!quiet) $body.html(`<div class="imogi-ph-empty">${__("Gagal memuat data.")}</div>`);
					return;
				}
				this[keys[this.tab]] = r.message || {};
				this.render();
			},
		});
	}

	render_stats() {
		const s = this.summary || {};
		this.$content.find(".imogi-ph-stats").html(`
			<div class="imogi-ph-stat-grid">
				${this.stat_card(__("Supplier"), cint(s.suppliers))}
				${this.stat_card(__("Request Open"), cint(s.requests_open))}
				${this.stat_card(__("PO Open"), cint(s.orders_open))}
				${this.stat_card(__("Receipt 30d"), cint(s.receipts_30d))}
			</div>
		`);
	}

	render() {
		this.render_stats();
		if (this.tab === "requests") this.render_requests();
		else if (this.tab === "orders") this.render_orders();
		else if (this.tab === "receiving") this.render_receiving();
		else this.render_invoices();
	}

	when_full(v) {
		if (!v) return "—";
		const m = moment(v);
		return m.isValid() ? m.format("DD-MM-YYYY HH:mm") : v;
	}

	/**
	 * Dialogs render outside the .imogi-purchasing-hub wrapper, so the page's
	 * scoped stylesheet doesn't reach them — build this one with self-contained
	 * inline styles instead of relying on the shared CSS classes.
	 */
	show_request_detail(d) {
		const esc = frappe.utils.escape_html;
		const status_html =
			cint(d.docstatus) === 0
				? `<span style="background:#fff7ed;border:1px solid #fed7aa;border-radius:999px;color:#c2410c;font-size:11px;font-weight:700;padding:4px 12px">${__(
						"Draft"
				  )}</span>`
				: `<span style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:999px;color:#047857;font-size:11px;font-weight:700;padding:4px 12px">${esc(
						d.status || __("Submitted")
				  )}</span>`;
		const info = (label, value) => `
			<div style="min-width:160px">
				<div style="color:#94a3b8;font-size:10px;font-weight:800;letter-spacing:.05em;margin-bottom:4px;text-transform:uppercase">${label}</div>
				<div style="color:#0f172a;font-size:13px;font-weight:600">${value}</div>
			</div>`;
		const items = d.items || [];
		const items_html = items.length
			? items
					.map(
						(it) => `<tr>
							<td style="border-bottom:1px solid #f1f5f9;padding:10px 14px">
								<div style="color:#0f172a;font-size:13px;font-weight:700">${esc(it.item_name || it.item_code)}</div>
								<div style="color:#94a3b8;font-size:11px;margin-top:1px">${esc(it.item_code)}</div>
							</td>
							<td style="border-bottom:1px solid #f1f5f9;color:#334155;font-size:13px;font-weight:700;padding:10px 14px;text-align:right;white-space:nowrap">${flt(
								it.qty
							)} ${esc(it.uom || "")}</td>
						</tr>`
					)
					.join("")
			: `<tr><td colspan="2" style="color:#94a3b8;padding:28px;text-align:center">${__("Tidak ada item.")}</td></tr>`;
		const html = `
			<div style="font-size:13px">
				<div style="align-items:center;display:flex;gap:10px;justify-content:space-between;margin-bottom:16px">
					<div style="color:#0f172a;font-size:17px;font-weight:800">${esc(d.name)}</div>
					${status_html}
				</div>
				<div style="background:#f8fafc;border:1px solid #eef1f5;border-radius:10px;display:flex;flex-wrap:wrap;gap:16px;margin-bottom:18px;padding:14px 16px">
					${info(__("Diminta Oleh"), esc(d.requested_by_name || "—"))}
					${info(__("Waktu"), esc(this.when_full(d.creation)))}
					${info(__("Supplier"), esc(d.supplier_name || d.supplier || "—"))}
					${info(__("Deliver To"), esc(d.warehouse || "—"))}
					${info(__("Dibutuhkan"), esc(d.schedule_date || "—"))}
				</div>
				<div style="border:1px solid #eef1f5;border-radius:10px;overflow:hidden">
					<table style="border-collapse:collapse;width:100%">
						<thead>
							<tr>
								<th style="background:#f8fafc;border-bottom:1px solid #eef1f5;color:#94a3b8;font-size:10px;font-weight:800;letter-spacing:.05em;padding:10px 14px;text-align:left;text-transform:uppercase">${__(
									"Item"
								)}</th>
								<th style="background:#f8fafc;border-bottom:1px solid #eef1f5;color:#94a3b8;font-size:10px;font-weight:800;letter-spacing:.05em;padding:10px 14px;text-align:right;text-transform:uppercase">${__(
									"Qty"
								)}</th>
							</tr>
						</thead>
						<tbody>${items_html}</tbody>
					</table>
				</div>
			</div>
		`;
		const dialog = new frappe.ui.Dialog({
			title: __("Detail Purchase Request"),
			size: "large",
			fields: [{ fieldtype: "HTML", options: html }],
		});
		dialog.show();
	}

	render_requests() {
		const $body = this.$content.find(".imogi-ph-body");
		const rows = (this.requests && this.requests.rows) || [];
		const { page_rows, pager, total } = this.paginate(rows);
		$body.html(`
			<div class="imogi-web-panel imogi-web-panel--form">
				<div class="imogi-web-panel-head"><div class="imogi-web-panel-title">${__("Buat Purchase Request")}</div></div>
				<div class="imogi-ph-form" style="padding-bottom:0">
					<div><label>${__("Supplier (opsional)")}</label><div class="imogi-ph-r-supplier-link"></div></div>
					<div><label>${__("Deliver To (Gudang)")}</label><div class="imogi-ph-r-warehouse-link"></div></div>
				</div>
				<div class="imogi-ph-itemrows"></div>
				<div class="imogi-ph-itemrows-actions">
					<button type="button" class="imogi-ph-btn imogi-ph-btn--ghost imogi-ph-r-add-row"><i class="fa fa-plus"></i> ${__(
						"Tambah Item"
					)}</button>
					<button type="button" class="imogi-ph-btn imogi-ph-r-save">${__("Simpan sebagai Draft")}</button>
				</div>
			</div>
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Purchase Request")}</div>
					<span class="imogi-ph-meta">${total} ${__("dokumen")}</span>
				</div>
				<div style="overflow-x:auto">
					<table class="imogi-ph-table">
						<thead><tr><th>${__("Dokumen")}</th><th>${__("Diminta Oleh")}</th><th>${__("Waktu")}</th><th>${__(
			"Supplier"
		)}</th><th>${__("Item")}</th><th>${__("Status")}</th><th>${__("Aksi")}</th></tr></thead>
						<tbody>
							${
								page_rows.length
									? page_rows
											.map(
												(r) => `<tr>
										<td><a href="/app/material-request/${encodeURIComponent(r.name)}">${frappe.utils.escape_html(
													r.name
												)}</a></td>
										<td>${frappe.utils.escape_html(r.requested_by_name || "—")}</td>
										<td>${frappe.utils.escape_html(this.when_full(r.creation))}</td>
										<td>${frappe.utils.escape_html(r.supplier_name || r.supplier || "—")}</td>
										<td class="imogi-ph-num">${cint(r.item_count)}</td>
										<td>${this.status_badge(r)}</td>
										<td>
											<div class="imogi-ph-actions">
												<button type="button" class="imogi-ph-mini imogi-ph-r-detail" data-name="${frappe.utils.escape_html(
													r.name
												)}">${__("Detail")}</button>
												${
													cint(r.docstatus) === 0
														? `<button type="button" class="imogi-ph-mini imogi-ph-mini--primary imogi-ph-r-submit" data-name="${frappe.utils.escape_html(
																r.name
														  )}">${__("Submit")}</button>`
														: ""
												}
												${
													cint(r.docstatus) === 1 && flt(r.per_ordered) < 100
														? `<button type="button" class="imogi-ph-mini imogi-ph-mini--primary imogi-ph-r-makepo" data-name="${frappe.utils.escape_html(
																r.name
														  )}" data-supplier="${frappe.utils.escape_html(
																r.supplier || ""
														  )}">${__("Buat PO")}</button>`
														: ""
												}
											</div>
										</td>
									</tr>`
											)
											.join("")
									: `<tr><td colspan="7" class="imogi-ph-empty">${__("Belum ada request.")}</td></tr>`
							}
						</tbody>
					</table>
				</div>
				${pager.html}
			</div>
		`);
		this.bind_pager($body);
		const supplier_ctrl = this.make_link($body.find(".imogi-ph-r-supplier-link"), {
			options: "Supplier",
			fieldname: "supplier",
			filters: { disabled: 0 },
		});
		const warehouse_ctrl = this.make_link($body.find(".imogi-ph-r-warehouse-link"), {
			options: "Warehouse",
			fieldname: "warehouse",
		});
		if (this.summary && this.summary.warehouse) warehouse_ctrl.set_value(this.summary.warehouse);
		const editor = this.make_item_rows_editor($body.find(".imogi-ph-itemrows"), "_pr_rows", {
			with_rate: false,
		});
		$body.find(".imogi-ph-r-add-row").on("click", () => editor.add_row());
		$body.find(".imogi-ph-r-save").on("click", () => {
			const items = editor
				.get_rows()
				.filter((r) => r.item_code && flt(r.qty) > 0)
				.map((r) => ({ item_code: r.item_code, qty: flt(r.qty) }));
			if (!items.length) return frappe.msgprint(__("Isi minimal 1 item dengan qty."));
			frappe.call({
				method: "imogi_pos.api.planned_features_api.create_purchasing_request_api",
				args: {
					items,
					supplier: supplier_ctrl.get_value() || undefined,
					warehouse: warehouse_ctrl.get_value() || undefined,
				},
				freeze: true,
				callback: (r) => {
					if (r.exc) return;
					frappe.show_alert({ message: __("Request (Draft): {0}", [r.message.name]), indicator: "green" });
					editor.reset();
					supplier_ctrl.set_value("");
					this.refresh();
				},
			});
		});
		$body.find(".imogi-ph-r-detail").on("click", (e) => {
			const name = $(e.currentTarget).data("name");
			frappe.call({
				method: "imogi_pos.api.planned_features_api.get_purchasing_request_detail_api",
				args: { name },
				freeze: true,
				callback: (r) => {
					if (r.exc) return;
					this.show_request_detail(r.message);
				},
			});
		});
		$body.find(".imogi-ph-r-submit").on("click", (e) => {
			const name = $(e.currentTarget).data("name");
			frappe.confirm(__("Submit Purchase Request {0}?", [name]), () => {
				frappe.call({
					method: "imogi_pos.api.planned_features_api.submit_purchasing_request_api",
					args: { name },
					freeze: true,
					callback: (r) => {
						if (r.exc) return;
						frappe.show_alert({ message: __("Request disubmit: {0}", [name]), indicator: "green" });
						this.refresh();
					},
				});
			});
		});
		const make_po_from_request = (purchase_request, supplier) => {
			frappe.call({
				method: "imogi_pos.api.planned_features_api.create_purchasing_order_from_request_api",
				args: { purchase_request, supplier },
				freeze: true,
				callback: (r) => {
					if (r.exc) return;
					frappe.show_alert({
						message: __("PO (Draft) dibuat: {0}", [r.message.name]),
						indicator: "green",
					});
					this.set_tab("orders");
				},
			});
		};
		$body.find(".imogi-ph-r-makepo").on("click", (e) => {
			const purchase_request = $(e.currentTarget).data("name");
			const preferred_supplier = $(e.currentTarget).data("supplier") || "";
			// Supplier was already chosen when the request was created — build
			// the PO right away instead of asking again.
			if (preferred_supplier) {
				make_po_from_request(purchase_request, preferred_supplier);
				return;
			}
			const d = new frappe.ui.Dialog({
				title: __("Buat PO dari {0}", [purchase_request]),
				fields: [
					{
						fieldname: "supplier",
						fieldtype: "Link",
						options: "Supplier",
						label: __("Supplier"),
						reqd: 1,
					},
				],
				primary_action_label: __("Buat PO"),
				primary_action: (values) => {
					d.hide();
					make_po_from_request(purchase_request, values.supplier);
				},
			});
			d.show();
		});
	}

	render_orders() {
		const $body = this.$content.find(".imogi-ph-body");
		const rows = (this.orders && this.orders.rows) || [];
		const pending = rows.filter((r) => r.approval_request);
		const { page_rows, pager, total } = this.paginate(rows);
		$body.html(`
			${
				pending.length
					? `<div class="imogi-web-panel imogi-web-panel--warn">
						<div class="imogi-web-panel-head">
							<div class="imogi-web-panel-title">${__("Perlu Approval")}</div>
							<span class="imogi-ph-meta">${pending.length} ${__("pending")}</span>
						</div>
						<div>
							${pending
								.map(
									(row) => `<div style="align-items:center;border-bottom:1px solid #f1f5f9;display:flex;gap:12px;justify-content:space-between;padding:10px 16px">
										<div>
											<div class="imogi-ph-name">${frappe.utils.escape_html(row.name)}</div>
											<div class="imogi-ph-sub">${frappe.utils.escape_html(
												row.supplier_name || row.supplier || ""
											)} · ${this.money(row.grand_total)}${
												row.required_role
													? ` · ${__("Butuh role")}: ${frappe.utils.escape_html(row.required_role)}`
													: ""
											}</div>
										</div>
										<div class="imogi-ph-actions">
											<button type="button" class="imogi-ph-mini imogi-ph-mini--approve imogi-ph-po-approve" data-request="${frappe.utils.escape_html(
												row.approval_request
											)}" data-required-role="${frappe.utils.escape_html(row.required_role || "")}">${__("Approve")}</button>
											<button type="button" class="imogi-ph-mini imogi-ph-mini--reject imogi-ph-po-reject" data-request="${frappe.utils.escape_html(
												row.approval_request
											)}" data-required-role="${frappe.utils.escape_html(row.required_role || "")}">${__("Reject")}</button>
										</div>
									</div>`
								)
								.join("")}
						</div>
					</div>`
					: ""
			}
			<div class="imogi-web-panel imogi-web-panel--form">
				<div class="imogi-web-panel-head"><div class="imogi-web-panel-title">${__("Buat Purchase Order")}</div></div>
				<div class="imogi-ph-form" style="padding-bottom:0">
					<div><label>${__("Supplier")}</label><div class="imogi-ph-o-supplier-link"></div></div>
				</div>
				<div class="imogi-ph-itemrows"></div>
				<div class="imogi-ph-itemrows-actions">
					<button type="button" class="imogi-ph-btn imogi-ph-btn--ghost imogi-ph-o-add-row"><i class="fa fa-plus"></i> ${__(
						"Tambah Item"
					)}</button>
					<button type="button" class="imogi-ph-btn imogi-ph-o-save">${__("Simpan sebagai Draft")}</button>
				</div>
			</div>
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Purchase Order")}</div>
					<span class="imogi-ph-meta">${total} ${__("dokumen")}</span>
				</div>
				<div style="overflow-x:auto">
					<table class="imogi-ph-table">
						<thead><tr><th>${__("PO")}</th><th>${__("Supplier")}</th><th>${__("Total")}</th><th>${__(
			"Diterima"
		)}</th><th>${__("Status")}</th><th>${__("Aksi")}</th></tr></thead>
						<tbody>
							${
								page_rows.length
									? page_rows
											.map(
												(r) => `<tr>
										<td><a href="/app/purchase-order/${encodeURIComponent(r.name)}">${frappe.utils.escape_html(
													r.name
												)}</a></td>
										<td>${frappe.utils.escape_html(r.supplier_name || r.supplier || "—")}</td>
										<td class="imogi-ph-num">${this.money(r.grand_total)}</td>
										<td class="imogi-ph-num">${flt(r.per_received).toFixed(0)}%</td>
										<td>${this.status_badge(r)}</td>
										<td>
											${
												cint(r.docstatus) === 0 && !r.approval_request
													? `<button type="button" class="imogi-ph-mini imogi-ph-mini--primary imogi-ph-o-submit" data-name="${frappe.utils.escape_html(
															r.name
													  )}">${__("Submit")}</button>`
													: ""
											}
										</td>
									</tr>`
											)
											.join("")
									: `<tr><td colspan="6" class="imogi-ph-empty">${__("Belum ada PO.")}</td></tr>`
							}
						</tbody>
					</table>
				</div>
				${pager.html}
			</div>
		`);
		this.bind_pager($body);
		const supplier_ctrl = this.make_link($body.find(".imogi-ph-o-supplier-link"), {
			options: "Supplier",
			fieldname: "supplier",
			filters: { disabled: 0 },
		});
		const editor = this.make_item_rows_editor($body.find(".imogi-ph-itemrows"), "_po_rows", {
			with_rate: true,
		});
		$body.find(".imogi-ph-o-add-row").on("click", () => editor.add_row());
		$body.find(".imogi-ph-o-save").on("click", () => {
			const supplier = (supplier_ctrl.get_value() || "").trim();
			const items = editor
				.get_rows()
				.filter((r) => r.item_code && flt(r.qty) > 0)
				.map((r) => ({ item_code: r.item_code, qty: flt(r.qty), rate: flt(r.rate) || undefined }));
			if (!supplier || !items.length) return frappe.msgprint(__("Isi supplier dan minimal 1 item."));
			frappe.call({
				method: "imogi_pos.api.planned_features_api.create_purchasing_order_api",
				args: { supplier, items },
				freeze: true,
				callback: (r) => {
					if (r.exc) return;
					frappe.show_alert({ message: __("PO (Draft): {0}", [r.message.name]), indicator: "green" });
					editor.reset();
					this.refresh();
				},
			});
		});
		$body.find(".imogi-ph-o-submit").on("click", (e) => {
			const name = $(e.currentTarget).data("name");
			frappe.call({
				method: "imogi_pos.api.planned_features_api.submit_purchasing_order_api",
				args: { name },
				freeze: true,
				callback: (r) => {
					if (r.exc) return;
					if (r.message && r.message.approval_request) {
						frappe.show_alert({ message: r.message.message, indicator: "orange" });
					} else {
						frappe.show_alert({ message: __("PO disubmit: {0}", [name]), indicator: "green" });
					}
					this.refresh();
				},
			});
		});
		$body.find(".imogi-ph-po-approve").on("click", (e) => {
			const request_name = ($(e.currentTarget).data("request") || "").trim();
			const required_role = ($(e.currentTarget).data("required-role") || "").trim();
			if (!request_name) return;

			const doApprove = (pin) => {
				frappe.call({
					method: "imogi_pos.api.planned_features_api.approve_purchasing_order_api",
					args: { request_name, pin },
					freeze: true,
					callback: (r) => {
						if (r.exc) return;
						const po_name = r.message && r.message.purchase_order;
						frappe.show_alert({
							message: po_name
								? __("PO disetujui: {0}", [po_name])
								: __("Approval disetujui — menunggu persetujuan akhir Owner"),
							indicator: "green",
						});
						this.refresh();
					},
				});
			};

			if (required_role) {
				// Role-based tier: dicek pakai user login sendiri di server, tanpa PIN.
				frappe.confirm(
					__("Approve PO ini sebagai role {0}?", [required_role]),
					() => doApprove(null)
				);
				return;
			}

			const d = new frappe.ui.Dialog({
				title: __("Approve Purchase Order"),
				fields: [
					{
						fieldname: "pin",
						fieldtype: "Password",
						label: __("PIN Supervisor"),
						reqd: 1,
					},
				],
				primary_action_label: __("Approve"),
				primary_action: (values) => {
					doApprove(values.pin);
					d.hide();
				},
			});
			d.show();
		});
		$body.find(".imogi-ph-po-reject").on("click", (e) => {
			const request_name = ($(e.currentTarget).data("request") || "").trim();
			const required_role = ($(e.currentTarget).data("required-role") || "").trim();
			if (!request_name) return;

			const fields = [
				{
					fieldname: "reason",
					fieldtype: "Small Text",
					label: __("Alasan reject"),
					reqd: 1,
				},
			];
			if (!required_role) {
				fields.push({
					fieldname: "pin",
					fieldtype: "Password",
					label: __("PIN Supervisor"),
					reqd: 1,
				});
			}
			const d = new frappe.ui.Dialog({
				title: __("Reject Purchase Order"),
				fields,
				primary_action_label: __("Reject"),
				primary_action: (values) => {
					frappe.call({
						method: "imogi_pos.api.planned_features_api.reject_purchasing_order_api",
						args: { request_name, pin: values.pin || null, reason: values.reason },
						freeze: true,
						callback: (r) => {
							if (r.exc) return;
							d.hide();
							frappe.show_alert({ message: __("PO ditolak."), indicator: "orange" });
							this.refresh();
						},
					});
				},
			});
			d.show();
		});
	}

	render_receiving() {
		const $body = this.$content.find(".imogi-ph-body");
		const rows = (this.receipts && this.receipts.rows) || [];
		const { page_rows, pager, total } = this.paginate(rows);
		$body.html(`
			<div class="imogi-web-panel imogi-web-panel--form">
				<div class="imogi-web-panel-head"><div class="imogi-web-panel-title">${__("Receive dari PO")}</div></div>
				<div class="imogi-ph-form">
					<div><label>${__("Purchase Order")}</label><div class="imogi-ph-rc-po-link"></div></div>
					<div style="align-items:flex-end;display:flex"><button type="button" class="imogi-ph-btn imogi-ph-btn--ghost imogi-ph-rc-load">${__(
						"Muat Item"
					)}</button></div>
				</div>
				<div class="imogi-ph-rc-grid" style="display:none"></div>
			</div>
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Purchase Receipt")}</div>
					<span class="imogi-ph-meta">${total} ${__("dokumen")}</span>
				</div>
				<div style="overflow-x:auto">
					<table class="imogi-ph-table">
						<thead><tr><th>${__("Receipt")}</th><th>${__("Supplier")}</th><th>${__("Tanggal")}</th><th>${__(
			"Total"
		)}</th><th>${__("Status")}</th></tr></thead>
						<tbody>
							${
								page_rows.length
									? page_rows
											.map(
												(r) => `<tr>
										<td><a href="/app/purchase-receipt/${encodeURIComponent(r.name)}">${frappe.utils.escape_html(
													r.name
												)}</a></td>
										<td>${frappe.utils.escape_html(r.supplier_name || r.supplier || "—")}</td>
										<td>${frappe.utils.escape_html(r.posting_date || "—")}</td>
										<td class="imogi-ph-num">${this.money(r.grand_total)}</td>
										<td>${this.status_badge(r)}</td>
									</tr>`
											)
											.join("")
									: `<tr><td colspan="5" class="imogi-ph-empty">${__("Belum ada receiving.")}</td></tr>`
							}
						</tbody>
					</table>
				</div>
				${pager.html}
			</div>
		`);
		this.bind_pager($body);
		const po_ctrl = this.make_link($body.find(".imogi-ph-rc-po-link"), {
			options: "Purchase Order",
			fieldname: "purchase_order",
			filters: { docstatus: 1, status: ["not in", ["Closed", "Completed", "Cancelled"]], per_received: ["<", 100] },
		});
		const $grid = $body.find(".imogi-ph-rc-grid");

		const render_grid = () => {
			const lines = this._rc_lines || [];
			if (!lines.length) {
				$grid.hide().html("");
				return;
			}
			$grid.show().html(`
				<div class="imogi-ph-rc-line" style="border-bottom:2px solid #e2e8f0;font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase">
					<div>${__("Item")}</div><div>${__("Dipesan")}</div><div>${__("Diterima")}</div><div>${__("Terima Sekarang")}</div>
				</div>
				${lines
					.map(
						(l, idx) => `<div class="imogi-ph-rc-line" data-idx="${idx}">
							<div><div class="imogi-ph-name">${frappe.utils.escape_html(l.item_name || l.item_code)}</div><div class="imogi-ph-sub">${frappe.utils.escape_html(
							l.item_code
						)}</div></div>
							<div class="imogi-ph-num">${flt(l.qty)} ${frappe.utils.escape_html(l.uom || "")}</div>
							<div class="imogi-ph-num">${flt(l.received_qty)}</div>
							<div><input type="number" min="0" step="0.001" class="imogi-ph-rc-qty" value="${flt(
								l.outstanding_qty
							)}" max="${flt(l.outstanding_qty)}"></div>
						</div>`
					)
					.join("")}
				<div style="padding-top:12px"><button type="button" class="imogi-ph-btn imogi-ph-rc-save">${__(
					"Terima Barang"
				)}</button></div>
			`);
			$grid.find(".imogi-ph-rc-qty").on("input change", (e) => {
				const idx = cint($(e.currentTarget).closest(".imogi-ph-rc-line").data("idx"));
				this._rc_lines[idx].receive_now = flt($(e.currentTarget).val());
			});
			lines.forEach((l) => {
				l.receive_now = flt(l.outstanding_qty);
			});
			$grid.find(".imogi-ph-rc-save").on("click", () => {
				const items = (this._rc_lines || [])
					.filter((l) => flt(l.receive_now) > 0)
					.map((l) => ({ po_item: l.po_item, item_code: l.item_code, qty: flt(l.receive_now) }));
				if (!items.length) return frappe.msgprint(__("Isi qty minimal 1 item."));
				const purchase_order = this._rc_po;
				frappe.call({
					method: "imogi_pos.api.planned_features_api.create_purchasing_receipt_api",
					args: { purchase_order, items },
					freeze: true,
					callback: (r) => {
						if (r.exc) return;
						frappe.show_alert({
							message: __("Receipt: {0}", [r.message.name]),
							indicator: "green",
						});
						this.refresh();
						// Odoo-style backorder: reload the same PO's outstanding lines in place
						// instead of resetting the form, so any remainder can be received right away.
						load_lines(purchase_order, { silent: true });
					},
				});
			});
		};

		const load_lines = (purchase_order, opts = {}) => {
			frappe.call({
				method: "imogi_pos.api.planned_features_api.get_purchasing_order_lines_api",
				args: { purchase_order },
				freeze: !opts.silent,
				callback: (r) => {
					if (r.exc) return;
					const lines = (r.message && r.message.rows) || [];
					if (!lines.length) {
						if (!opts.silent) frappe.msgprint(__("Semua item PO ini sudah diterima penuh."));
						else frappe.show_alert({ message: __("PO ini sudah diterima penuh."), indicator: "blue" });
						this._rc_po = null;
						this._rc_lines = null;
						po_ctrl.set_value("");
						render_grid();
						return;
					}
					this._rc_po = purchase_order;
					this._rc_lines = lines;
					render_grid();
				},
			});
		};

		$body.find(".imogi-ph-rc-load").on("click", () => {
			const purchase_order = (po_ctrl.get_value() || "").trim();
			if (!purchase_order) return frappe.msgprint(__("Isi nomor PO."));
			load_lines(purchase_order);
		});
	}

	render_invoices() {
		const $body = this.$content.find(".imogi-ph-body");
		const rows = (this.invoices && this.invoices.rows) || [];
		const { page_rows, pager, total } = this.paginate(rows);
		$body.html(`
			<div class="imogi-web-panel imogi-web-panel--form">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Buat Tagihan dari Receipt")}</div>
				</div>
				<div class="imogi-ph-invoice-billable"><div class="imogi-ph-empty">${__("Memuat...")}</div></div>
			</div>
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Tagihan")}</div>
					<span class="imogi-ph-meta">${total} ${__("dokumen")}</span>
				</div>
				<div style="overflow-x:auto">
					<table class="imogi-ph-table">
						<thead><tr><th>${__("Tagihan")}</th><th>${__("PO / Receipt")}</th><th>${__("Supplier")}</th><th>${__(
			"Total"
		)}</th><th>${__("Outstanding")}</th><th>${__("Status")}</th><th>${__("Aksi")}</th></tr></thead>
						<tbody>
							${
								page_rows.length
									? page_rows
											.map(
												(r) => `<tr>
										<td><a href="/app/purchase-invoice/${encodeURIComponent(r.name)}">${frappe.utils.escape_html(
													r.name
												)}</a></td>
										<td class="imogi-ph-sub">${frappe.utils.escape_html(r.purchase_order || "—")}<br>${frappe.utils.escape_html(
													r.purchase_receipt || "—"
												)}</td>
										<td>${frappe.utils.escape_html(r.supplier_name || r.supplier || "—")}</td>
										<td class="imogi-ph-num">${this.money(r.grand_total)}</td>
										<td class="imogi-ph-num">${this.money(r.outstanding_amount)}</td>
										<td>${this.status_badge(r)}</td>
										<td>
											<div class="imogi-ph-actions">
												${
													cint(r.docstatus) === 0
														? `<button type="button" class="imogi-ph-mini imogi-ph-mini--primary imogi-ph-inv-submit" data-name="${frappe.utils.escape_html(
																r.name
														  )}">${__("Submit")}</button>`
														: ""
												}
												${
													cint(r.docstatus) === 1 && flt(r.outstanding_amount) > 0
														? `<button type="button" class="imogi-ph-mini imogi-ph-mini--approve imogi-ph-inv-pay" data-name="${frappe.utils.escape_html(
																r.name
														  )}">${__("Bayar")}</button>`
														: ""
												}
											</div>
										</td>
									</tr>`
											)
											.join("")
									: `<tr><td colspan="7" class="imogi-ph-empty">${__("Belum ada tagihan.")}</td></tr>`
							}
						</tbody>
					</table>
				</div>
				${pager.html}
			</div>
		`);
		this.bind_pager($body);

		frappe.call({
			method: "imogi_pos.api.planned_features_api.list_purchasing_receipts_for_billing_api",
			callback: (r) => {
				if (r.exc) return;
				const receipts = (r.message && r.message.rows) || [];
				const $panel = $body.find(".imogi-ph-invoice-billable");
				if (!receipts.length) {
					$panel.html(`<div class="imogi-ph-empty">${__("Semua receipt sudah ditagih.")}</div>`);
					return;
				}
				$panel.html(
					receipts
						.map(
							(rc) => `<div style="align-items:center;border-bottom:1px solid #f1f5f9;display:flex;gap:12px;justify-content:space-between;padding:10px 16px">
								<div>
									<div class="imogi-ph-name">${frappe.utils.escape_html(rc.name)}</div>
									<div class="imogi-ph-sub">${frappe.utils.escape_html(
										rc.supplier_name || rc.supplier || ""
									)} · ${this.money(rc.grand_total)} · ${flt(rc.per_billed).toFixed(0)}% ${__("tertagih")}</div>
								</div>
								<button type="button" class="imogi-ph-mini imogi-ph-mini--primary imogi-ph-inv-create" data-receipt="${frappe.utils.escape_html(
									rc.name
								)}">${__("Buat Tagihan")}</button>
							</div>`
						)
						.join("")
				);
				$panel.find(".imogi-ph-inv-create").on("click", (e) => {
					const purchase_receipt = $(e.currentTarget).data("receipt");
					frappe.call({
						method: "imogi_pos.api.planned_features_api.create_purchasing_invoice_api",
						args: { purchase_receipt },
						freeze: true,
						callback: (r2) => {
							if (r2.exc) return;
							frappe.show_alert({
								message: __("Tagihan (Draft): {0}", [r2.message.name]),
								indicator: "green",
							});
							this.refresh();
						},
					});
				});
			},
		});

		$body.find(".imogi-ph-inv-submit").on("click", (e) => {
			const name = $(e.currentTarget).data("name");
			frappe.confirm(__("Submit Tagihan {0}?", [name]), () => {
				frappe.call({
					method: "imogi_pos.api.planned_features_api.submit_purchasing_invoice_api",
					args: { name },
					freeze: true,
					callback: (r) => {
						if (r.exc) return;
						frappe.show_alert({ message: __("Tagihan disubmit: {0}", [name]), indicator: "green" });
						this.refresh();
					},
				});
			});
		});

		$body.find(".imogi-ph-inv-pay").on("click", (e) => {
			const purchase_invoice = $(e.currentTarget).data("name");
			frappe.confirm(__("Catat pembayaran penuh untuk {0}?", [purchase_invoice]), () => {
				frappe.call({
					method: "imogi_pos.api.planned_features_api.pay_purchasing_invoice_api",
					args: { purchase_invoice },
					freeze: true,
					callback: (r) => {
						if (r.exc) return;
						frappe.show_alert({
							message: __("Pembayaran dicatat: {0}", [r.message.name]),
							indicator: "green",
						});
						this.refresh();
					},
				});
			});
		});
	}
};
