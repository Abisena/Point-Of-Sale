frappe.provide("imogi_pos");

function inject_kitchen_perf_css() {
	for (let v = 1; v <= 6; v += 1) {
		document.getElementById(`imogi-kitchen-perf-css-v${v}`)?.remove();
	}
	if (document.getElementById("imogi-kitchen-perf-css-v7")) return;
	frappe.dom.set_style(
		`
		body.imogi-kpr-fullscreen,
		body.imogi-kpr-fullscreen .main-section,
		body.imogi-kpr-fullscreen .page-container,
		body.imogi-kpr-fullscreen .content.page-container,
		body.imogi-kpr-fullscreen .container,
		body.imogi-kpr-fullscreen .container.page-body,
		body.imogi-kpr-fullscreen .row.layout-main,
		body.imogi-kpr-fullscreen .layout-main,
		body.imogi-kpr-fullscreen .layout-main-section-wrapper,
		body.imogi-kpr-fullscreen .layout-main-section,
		body.imogi-kpr-fullscreen .layout-main-section-wrapper > [class*="col-"],
		body.imogi-kpr-fullscreen .page-body{
			box-sizing:border-box!important;
			margin-left:0!important;
			margin-right:0!important;
			max-width:100%!important;
			width:100%!important;
			background:#fff!important
		}
		body.imogi-kpr-fullscreen .imogi-kitchen-perf.layout-main-section,
		body.imogi-kpr-fullscreen .imogi-kitchen-perf,
		body.imogi-kpr-fullscreen .imogi-web-shell-root.imogi-kitchen-perf{
			max-width:100%!important;
			width:100%!important
		}
		body.imogi-kpr-fullscreen .imogi-web-shell{
			margin:0!important;
			max-width:100%!important;
			padding-left:20px!important;
			padding-right:20px!important;
			width:100%!important
		}
		body.imogi-kpr-fullscreen .imogi-web-content{
			max-width:100%!important;
			width:100%!important
		}
		@media (max-width:767px){
			body.imogi-kpr-fullscreen .imogi-web-shell{
				padding-left:12px!important;
				padding-right:12px!important
			}
		}

		.imogi-kitchen-perf.layout-main-section,
		.imogi-kitchen-perf,
		.imogi-kitchen-perf .page-body,
		.imogi-kitchen-perf .layout-main-section-wrapper,
		.imogi-kitchen-perf .imogi-web-shell,
		.imogi-kitchen-perf .imogi-web-shell-root,
		.imogi-kitchen-perf .imogi-web-content{background:#fff!important}
		.imogi-kitchen-perf .page-head{display:none!important}
		.imogi-kitchen-perf .imogi-web-hero{margin-bottom:0!important;border-bottom:1px solid #e2e8f0!important;border-radius:0!important;box-shadow:none!important}
		.imogi-kitchen-perf .imogi-kpr-filter-card{background:#fff;border:1px solid #cbd5e1;border-radius:0 0 8px 8px;box-shadow:0 1px 4px rgba(15,23,42,.04);margin-bottom:12px;overflow:hidden}
		.imogi-kitchen-perf .imogi-kpr-filter-head{
			align-items:center;display:flex;flex-wrap:nowrap;gap:8px 10px;justify-content:space-between;
			padding:10px 14px;overflow-x:auto
		}
		.imogi-kitchen-perf .imogi-kpr-filter-head-left{
			align-items:center;display:flex;flex:1;flex-wrap:nowrap;gap:8px 10px;min-width:0
		}
		.imogi-kitchen-perf .imogi-kpr-filter-title{color:#0f172a;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;flex-shrink:0}
		.imogi-kitchen-perf .imogi-kpr-periods{align-items:center;display:flex;flex-wrap:nowrap;gap:6px;flex-shrink:0}
		.imogi-kitchen-perf .imogi-kpr-head-controls{align-items:center;display:flex;flex-wrap:nowrap;gap:8px 10px;flex-shrink:0;margin-left:auto}
		.imogi-kitchen-perf .imogi-kpr-range-badge{align-items:center;background:#fff;border:1px solid #e2e8f0;border-radius:999px;color:#475569;display:inline-flex;font-size:11px;font-variant-numeric:tabular-nums;font-weight:700;gap:4px;padding:4px 10px;white-space:nowrap;flex-shrink:0}
		.imogi-kitchen-perf .imogi-kpr-range-badge i{margin:0;font-size:10px}
		.imogi-kitchen-perf .imogi-kpr-custom-range{
			align-items:flex-end;border-top:1px solid #e2e8f0;display:none;flex-wrap:wrap;gap:8px 12px;padding:10px 14px 12px
		}
		.imogi-kitchen-perf .imogi-kpr-custom-range.is-open{display:flex}
		.imogi-kitchen-perf button.imogi-kpr-period{
			align-items:center!important;appearance:none!important;background:#fff!important;border:1px solid #cbd5e1!important;
			border-radius:6px!important;color:#475569!important;cursor:pointer!important;display:inline-flex!important;
			font-size:11px!important;font-weight:700!important;gap:4px!important;height:32px!important;line-height:1!important;
			margin:0!important;padding:0 10px!important;white-space:nowrap!important
		}
		.imogi-kitchen-perf button.imogi-kpr-period i{font-size:11px;line-height:1;margin:0!important;width:auto}
		.imogi-kitchen-perf button.imogi-kpr-period span{line-height:1}
		.imogi-kitchen-perf button.imogi-kpr-period.is-active{background:#fff7ed!important;border-color:#f39c12!important;color:#9a3412!important}
		.imogi-kitchen-perf .imogi-kpr-date-field{display:flex;flex-direction:column;gap:2px}
		.imogi-kitchen-perf .imogi-kpr-date-field--inline{justify-content:flex-end}
		.imogi-kitchen-perf .imogi-kpr-date-field label{color:#64748b;font-size:9px;font-weight:700;letter-spacing:.05em;margin:0;text-transform:uppercase;line-height:1}
		.imogi-kitchen-perf .imogi-kpr-date-field input[type=date],
		.imogi-kitchen-perf .imogi-kpr-date-field select{background:#fff;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;height:32px;min-width:110px;padding:0 8px}
		.imogi-kitchen-perf button.imogi-kpr-load{
			align-items:center!important;background:linear-gradient(135deg,#f5b041,#f39c12)!important;border:none!important;
			border-radius:6px!important;color:#fff!important;display:inline-flex!important;font-size:12px!important;
			font-weight:700!important;gap:4px!important;height:32px!important;padding:0 12px!important
		}
		.imogi-kitchen-perf button.imogi-kpr-load i{margin:0!important}
		.imogi-kitchen-perf .imogi-web-panel{background:#fff;border:1px solid #e8edf5;border-radius:12px;overflow:hidden}
		.imogi-kitchen-perf .imogi-web-panel-head{align-items:center;border-bottom:1px solid #f1f5f9;display:flex;gap:10px;justify-content:space-between;padding:12px 14px}
		.imogi-kitchen-perf .imogi-web-panel-title{color:#0f172a;font-size:13px;font-weight:800}
		.imogi-kitchen-perf .imogi-kpr-meta{color:#64748b;font-size:11px;font-weight:600}
		.imogi-kitchen-perf .imogi-kpr-table-wrap{overflow-x:auto}
		.imogi-kitchen-perf .imogi-kpr-table{width:100%;border-collapse:collapse}
		.imogi-kitchen-perf .imogi-kpr-table th{background:#fafafa;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:10px;font-weight:800;letter-spacing:.04em;padding:10px 12px;text-align:left;text-transform:uppercase;white-space:nowrap}
		.imogi-kitchen-perf .imogi-kpr-table td{border-bottom:1px solid #f1f5f9;color:#334155;font-size:12px;padding:11px 12px;vertical-align:middle}
		.imogi-kitchen-perf .imogi-kpr-table tbody tr:hover td{background:#fafafa}
		.imogi-kitchen-perf .imogi-kpr-order{color:#0f172a;font-variant-numeric:tabular-nums;font-weight:800}
		.imogi-kitchen-perf .imogi-kpr-menu{color:#334155;line-height:1.35;max-width:none}
		.imogi-kitchen-perf .imogi-kpr-station-cell{color:#334155;font-size:12px;white-space:nowrap}
		.imogi-kitchen-perf .imogi-web-pagination{align-items:center;border-top:1px solid #f1f5f9;display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;padding:12px 14px}
		.imogi-kitchen-perf .imogi-web-pagination-info{color:#64748b;font-size:12px;font-weight:600}
		.imogi-kitchen-perf .imogi-web-pagination-controls{align-items:center;display:flex;gap:8px}
		.imogi-kitchen-perf .imogi-web-pagination-page{color:#475569;font-size:12px;font-variant-numeric:tabular-nums;font-weight:700}
		.imogi-kitchen-perf .imogi-kpr-time{font-variant-numeric:tabular-nums;white-space:nowrap}
		.imogi-kitchen-perf .imogi-kpr-duration{color:#0f172a;font-variant-numeric:tabular-nums;font-weight:800;white-space:nowrap}
		.imogi-kitchen-perf .imogi-kpr-duration.is-open{color:#c2410c}
		.imogi-kitchen-perf .imogi-kpr-status{align-items:center;border-radius:999px;display:inline-flex;font-size:10px;font-weight:800;padding:3px 8px;text-transform:uppercase}
		.imogi-kitchen-perf .imogi-kpr-status--done{background:#ecfdf5;border:1px solid #a7f3d0;color:#047857}
		.imogi-kitchen-perf .imogi-kpr-status--ready{background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8}
		.imogi-kitchen-perf .imogi-kpr-status--preparing{background:#fff7ed;border:1px solid #fed7aa;color:#c2410c}
		.imogi-kitchen-perf .imogi-kpr-status--pending{background:#f8fafc;border:1px solid #e2e8f0;color:#64748b}
		.imogi-kitchen-perf .imogi-kpr-empty{align-items:center;color:#94a3b8;display:flex;flex-direction:column;font-size:13px;gap:8px;justify-content:center;min-height:160px;padding:24px;text-align:center}
		.imogi-kitchen-perf .imogi-kpr-station{color:#64748b;font-size:11px;font-weight:600}
		@media (max-width:1100px){
			.imogi-kitchen-perf .imogi-kpr-filter-head{flex-wrap:wrap}
			.imogi-kitchen-perf .imogi-kpr-filter-head-left{flex-wrap:wrap}
		}
		@media (max-width:767px){
			.imogi-kitchen-perf .imogi-kpr-filter-head{align-items:flex-start;flex-direction:column}
			.imogi-kitchen-perf .imogi-kpr-filter-head-left{flex-direction:column;align-items:stretch;width:100%}
			.imogi-kitchen-perf .imogi-kpr-periods{flex-wrap:wrap}
			.imogi-kitchen-perf .imogi-kpr-head-controls{margin-left:0;width:100%;flex-wrap:wrap}
			.imogi-kitchen-perf .imogi-kpr-date-field select,
			.imogi-kitchen-perf button.imogi-kpr-load{width:100%!important}
			.imogi-kitchen-perf button.imogi-kpr-load{justify-content:center!important}
		}
		`,
		"imogi-kitchen-perf-css-v7"
	);
}

function activate_kitchen_perf_fullscreen() {
	document.body.classList.add("imogi-kpr-fullscreen");
	if (!window.__imogi_kpr_fullscreen_bound) {
		window.__imogi_kpr_fullscreen_bound = true;
		$(document).on("page-change.imogi-kpr-fs", () => {
			const route = (frappe.get_route_str && frappe.get_route_str()) || "";
			if (route.indexOf("kitchen-performance") === -1) {
				document.body.classList.remove("imogi-kpr-fullscreen");
			} else {
				document.body.classList.add("imogi-kpr-fullscreen");
			}
		});
	}
}

frappe.pages["kitchen-performance"].on_page_load = function (wrapper) {
	inject_kitchen_perf_css();
	activate_kitchen_perf_fullscreen();
	if (!imogi_pos.page_shell?.make_page) {
		frappe.msgprint(__("IMOGI page shell belum dimuat. Muat ulang halaman (Ctrl+Shift+R)."));
		return;
	}
	imogi_pos.KitchenPerformanceReport = new imogi_pos.KitchenPerformanceReportView(wrapper);
};

frappe.pages["kitchen-performance"].on_page_show = function () {
	activate_kitchen_perf_fullscreen();
};

imogi_pos.KitchenPerformanceReportView = class KitchenPerformanceReportView {
	constructor(wrapper) {
		this.wrapper = $(wrapper);
		this.today = frappe.datetime.get_today();
		this.period = "today";
		this.from_date = this.today;
		this.to_date = this.today;
		this.station_type = "";
		this.status = "";
		this.page = 1;
		this.page_size = 10;
		this.all_rows = [];
		this.last_summary = {};
		this.last_meta = {};
		this.make();
		this.refresh();
	}

	make() {
		const page = imogi_pos.page_shell.make_page(
			this.wrapper.get(0),
			__("Kitchen Performance"),
			"imogi-kitchen-perf"
		);
		this.wrapper.find(".page-head").hide();
		const $content = imogi_pos.page_shell.render_hero(page.main, {
			subtitle: __(
				"Laporan detail order dapur — nomor order, menu, jam mulai, jam selesai, dan total waktu."
			),
			actions_html: `
				<a class="imogi-web-btn imogi-web-btn-ghost" href="/app/imogi-pos-dashboard"><i class="fa fa-line-chart"></i> ${__(
					"Dashboard"
				)}</a>
				<button type="button" class="imogi-web-btn imogi-web-btn-ghost imogi-kpr-export"><i class="fa fa-file-excel-o"></i> ${__(
					"Export Excel"
				)}</button>
			`,
		});
		this.$content = $content;
		const $shell = $content.closest(".imogi-web-shell");
		if (typeof imogi_pos.page_shell.init_owner_page === "function") {
			imogi_pos.page_shell.init_owner_page($shell, __("Kitchen Performance"));
		}

		$shell.find(".imogi-kpr-export").on("click", () => this.export_excel());

		const PERIODS = [
			{ id: "today", label: __("Hari Ini"), icon: "fa-sun-o" },
			{ id: "yesterday", label: __("Kemarin"), icon: "fa-history" },
			{ id: "last_7_days", label: __("7 Hari"), icon: "fa-calendar" },
			{ id: "this_month", label: __("Bulan Ini"), icon: "fa-calendar-check-o" },
			{ id: "custom", label: __("Custom"), icon: "fa-sliders" },
		];

		$content.append(`
			<div class="imogi-kpr-filter-card">
				<div class="imogi-kpr-filter-head">
					<div class="imogi-kpr-filter-head-left">
						<span class="imogi-kpr-filter-title">${__("Filter Laporan")}</span>
						<div class="imogi-kpr-periods">
							${PERIODS.map(
								(row, idx) =>
									`<button type="button" class="imogi-kpr-period${
										idx === 0 ? " is-active" : ""
									}" data-period="${row.id}"><i class="fa ${row.icon}"></i><span>${row.label}</span></button>`
							).join("")}
						</div>
						<div class="imogi-kpr-head-controls">
							<div class="imogi-kpr-date-field imogi-kpr-date-field--inline">
								<label>${__("Stasiun")}</label>
								<select class="imogi-kpr-station">
									<option value="">${__("Semua")}</option>
									<option value="Kitchen">${__("Dapur")}</option>
									<option value="Bar">${__("Bar")}</option>
									<option value="Kitchen & Bar">${__("Kitchen & Bar")}</option>
								</select>
							</div>
							<div class="imogi-kpr-date-field imogi-kpr-date-field--inline">
								<label>${__("Status")}</label>
								<select class="imogi-kpr-status">
									<option value="">${__("Semua")}</option>
									<option value="Pending">${__("Antrian")}</option>
									<option value="Preparing">${__("Dimasak")}</option>
									<option value="Ready">${__("Siap")}</option>
									<option value="Done">${__("Selesai")}</option>
								</select>
							</div>
						</div>
					</div>
					<span class="imogi-kpr-range-badge"><i class="fa fa-calendar-o"></i><span class="imogi-kpr-range-text">${__(
						"Hari Ini"
					)}</span></span>
				</div>
				<div class="imogi-kpr-custom-range">
					<div class="imogi-kpr-date-field">
						<label>${__("Dari")}</label>
						<input type="date" class="imogi-kpr-from" value="${this.today}">
					</div>
					<div class="imogi-kpr-date-field">
						<label>${__("Sampai")}</label>
						<input type="date" class="imogi-kpr-to" value="${this.today}" max="${this.today}">
					</div>
				</div>
			</div>
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Detail Order Dapur")}</div>
					<span class="imogi-kpr-meta imogi-kpr-orders-meta"></span>
				</div>
				<div class="imogi-web-panel-body imogi-kpr-body">
					<div class="imogi-kpr-empty">${__("Memuat...")}</div>
				</div>
			</div>
		`);

		$content.find(".imogi-kpr-period").on("click", (e) => {
			const id = $(e.currentTarget).data("period");
			this.period = id;
			$content.find(".imogi-kpr-period").removeClass("is-active");
			$(e.currentTarget).addClass("is-active");
			$content.find(".imogi-kpr-custom-range").toggleClass("is-open", id === "custom");
			this.apply_period();
			if (id !== "custom") {
				this.page = 1;
				this.refresh();
			}
		});
		$content.find(".imogi-kpr-station, .imogi-kpr-status").on("change", () => {
			this.station_type = $content.find(".imogi-kpr-station").val() || "";
			this.status = $content.find(".imogi-kpr-status").val() || "";
			this.page = 1;
			this.refresh();
		});
		$content.find(".imogi-kpr-from, .imogi-kpr-to").on("change", () => {
			if (this.period !== "custom") return;
			this.from_date = $content.find(".imogi-kpr-from").val() || this.today;
			this.to_date = $content.find(".imogi-kpr-to").val() || this.today;
			this.apply_period();
			this.page = 1;
			this.refresh();
		});
		this.apply_period();
	}

	apply_period() {
		const today = this.today;
		if (this.period === "today") {
			this.from_date = today;
			this.to_date = today;
		} else if (this.period === "yesterday") {
			this.from_date = frappe.datetime.add_days(today, -1);
			this.to_date = this.from_date;
		} else if (this.period === "last_7_days") {
			this.from_date = frappe.datetime.add_days(today, -6);
			this.to_date = today;
		} else if (this.period === "this_month") {
			this.from_date = frappe.datetime.month_start();
			this.to_date = today;
		}
		const label =
			this.from_date === this.to_date
				? frappe.datetime.str_to_user(this.from_date)
				: `${frappe.datetime.str_to_user(this.from_date)} — ${frappe.datetime.str_to_user(
						this.to_date
				  )}`;
		this.$content.find(".imogi-kpr-range-text").text(label);
	}

	refresh() {
		const $body = this.$content.find(".imogi-kpr-body");
		$body.html(`<div class="imogi-kpr-empty">${__("Memuat...")}</div>`);
		frappe.call({
			method: "imogi_pos.api.planned_features_api.get_kitchen_performance_detail_api",
			args: {
				date_from: this.from_date,
				date_to: this.to_date,
				station_type: this.station_type || undefined,
				status: this.status || undefined,
				limit: 500,
			},
			callback: (r) => {
				if (r.exc) {
					$body.html(
						`<div class="imogi-kpr-empty">${__("Gagal memuat laporan. Coba refresh.")}</div>`
					);
					return;
				}
				const data = r.message || {};
				this.all_rows = data.rows || [];
				this.last_summary = data.summary || {};
				this.last_meta = {
					date_from: data.date_from || "",
					date_to: data.date_to || "",
				};
				this.page = 1;
				this.render_page();
			},
		});
	}

	export_excel() {
		if (this.period === "custom") {
			this.from_date = this.$content.find(".imogi-kpr-from").val() || this.today;
			this.to_date = this.$content.find(".imogi-kpr-to").val() || this.today;
		}
		this.station_type = this.$content.find(".imogi-kpr-station").val() || "";
		this.status = this.$content.find(".imogi-kpr-status").val() || "";

		frappe.show_alert({ message: __("Menyiapkan file Excel..."), indicator: "blue" }, 3);
		open_url_post("/api/method/imogi_pos.api.planned_features_api.export_kitchen_performance_excel", {
			date_from: this.from_date,
			date_to: this.to_date,
			station_type: this.station_type || "",
			status: this.status || "",
			limit: 500,
		});
	}

	format_time(value) {
		if (!value) return "—";
		const parts = String(value).split(" ");
		if (parts.length >= 2 && parts[1].length >= 5) {
			return parts[1].slice(0, 5);
		}
		return frappe.datetime.str_to_user(value);
	}

	format_duration(minutes, is_open) {
		if (minutes === null || minutes === undefined || minutes === "") return "—";
		const m = cint(minutes);
		const h = Math.floor(m / 60);
		const rem = m % 60;
		const label = h > 0 ? `${h}j ${rem}m` : `${rem} mnt`;
		return is_open ? `${label} · ${__("berjalan")}` : label;
	}

	status_class(status) {
		const map = {
			Done: "done",
			Ready: "ready",
			Preparing: "preparing",
			Pending: "pending",
		};
		return map[status] || "pending";
	}

	status_label(status) {
		const map = {
			Done: __("Selesai"),
			Ready: __("Siap"),
			Preparing: __("Dimasak"),
			Pending: __("Antrian"),
		};
		return map[status] || status;
	}

	station_label(row) {
		const name = (row.station_label || "").trim();
		const type = (row.station_type || "").trim();
		if (name && type && name.toLowerCase() !== type.toLowerCase()) {
			return `${name} · ${type}`;
		}
		return name || type || "—";
	}

	render_page() {
		const rows = this.all_rows || [];
		const summary = this.last_summary || {};
		const total = rows.length;
		const pager = imogi_pos.page_shell.render_pagination(this.page, total, this.page_size);
		this.page = pager.page;
		const start = (this.page - 1) * this.page_size;
		const page_rows = rows.slice(start, start + this.page_size);

		this.$content
			.find(".imogi-kpr-orders-meta")
			.text(
				__("{0} baris · {1} order · {2} — {3}", [
					total,
					summary.orders || 0,
					this.last_meta.date_from || "",
					this.last_meta.date_to || "",
				])
			);

		const $body = this.$content.find(".imogi-kpr-body");
		if (!rows.length) {
			$body.html(
				`<div class="imogi-kpr-empty"><i class="fa fa-fire" style="font-size:22px;opacity:.35"></i>${__(
					"Belum ada order dapur pada periode ini."
				)}</div>`
			);
			return;
		}

		$body.html(`
			<div class="imogi-kpr-table-wrap">
				<table class="imogi-kpr-table">
					<thead>
						<tr>
							<th>${__("No Order")}</th>
							<th>${__("Menu")}</th>
							<th>${__("Stasiun")}</th>
							<th>${__("Mulai")}</th>
							<th>${__("Selesai")}</th>
							<th>${__("Total Waktu")}</th>
							<th>${__("Status")}</th>
						</tr>
					</thead>
					<tbody>
						${page_rows
							.map((row) => {
								const is_open = !row.finished_at;
								const menu = frappe.utils.escape_html(row.menu_text || row.item_name || "—");
								const order_label = frappe.utils.escape_html(
									(row.order_no || "").replace(/^ORD-?/i, "#") || row.kitchen_order
								);
								const table =
									row.table_number
										? `<div class="imogi-kpr-station">${__("Meja")} ${frappe.utils.escape_html(
												row.table_number
										  )}</div>`
										: "";
								return `<tr>
									<td>
										<div class="imogi-kpr-order">${order_label}</div>
										${table}
									</td>
									<td class="imogi-kpr-menu">${menu}</td>
									<td class="imogi-kpr-station-cell">${frappe.utils.escape_html(this.station_label(row))}</td>
									<td class="imogi-kpr-time">${this.format_time(row.started_at)}</td>
									<td class="imogi-kpr-time">${this.format_time(row.finished_at)}</td>
									<td class="imogi-kpr-duration${is_open ? " is-open" : ""}">${this.format_duration(
									row.duration_minutes,
									is_open
								)}</td>
									<td><span class="imogi-kpr-status imogi-kpr-status--${this.status_class(
										row.status
									)}">${this.status_label(row.status)}</span></td>
								</tr>`;
							})
							.join("")}
					</tbody>
				</table>
			</div>
			${pager.html}
		`);

		$body.find(".imogi-web-page-prev").on("click", () => {
			if (this.page <= 1) return;
			this.page -= 1;
			this.render_page();
		});
		$body.find(".imogi-web-page-next").on("click", () => {
			const max_page = Math.max(1, Math.ceil(total / this.page_size));
			if (this.page >= max_page) return;
			this.page += 1;
			this.render_page();
		});
	}

	render(data) {
		this.all_rows = data.rows || [];
		this.last_summary = data.summary || {};
		this.last_meta = {
			date_from: data.date_from || "",
			date_to: data.date_to || "",
		};
		this.render_page();
	}
};
