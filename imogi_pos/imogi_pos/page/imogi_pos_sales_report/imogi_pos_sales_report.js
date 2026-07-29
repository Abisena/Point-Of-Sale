frappe.provide("imogi_pos");

function inject_sales_report_css() {
	for (let v = 1; v <= 6; v += 1) {
		document.getElementById(`imogi-sales-report-css-v${v}`)?.remove();
	}
	if (document.getElementById("imogi-sales-report-css-v7")) return;
	frappe.dom.set_style(
		`
		.imogi-pos-sales-report.layout-main-section,
		.imogi-pos-sales-report,
		.imogi-pos-sales-report .page-body,
		.imogi-pos-sales-report .layout-main-section-wrapper,
		.imogi-pos-sales-report .imogi-web-shell,
		.imogi-pos-sales-report .imogi-web-shell-root,
		.imogi-pos-sales-report .imogi-web-content{background:#fff!important}
		.imogi-pos-sales-report .imogi-web-hero{margin-bottom:0!important;border-bottom:1px solid #e2e8f0!important;border-radius:0!important;box-shadow:none!important}
		.imogi-pos-sales-report .imogi-web-content>.imogi-rpt-filter-card:first-child,
		.imogi-pos-sales-report .imogi-web-content>.imogi-rpt-upgrade-nudge:first-child+.imogi-rpt-filter-card{border-top:none!important;margin-top:0!important;border-radius:0 0 8px 8px!important}
		.imogi-pos-sales-report .imogi-web-panel-head,
		.imogi-pos-sales-report .imogi-rpt-filter-head{background:#fff!important}
		.imogi-pos-sales-report .imogi-rpt-filter-card{background:#fff;border:1px solid #cbd5e1;border-radius:8px;box-shadow:0 1px 4px rgba(15,23,42,.04);margin-bottom:12px;overflow:hidden}
		.imogi-pos-sales-report .imogi-rpt-filter-head{align-items:center;border-bottom:1px solid #e2e8f0;display:flex;flex-wrap:wrap;gap:8px 12px;justify-content:space-between;padding:10px 14px}
		.imogi-pos-sales-report .imogi-rpt-filter-title{color:#0f172a;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
		.imogi-pos-sales-report .imogi-rpt-range-badge{align-items:center;background:#fff;border:1px solid #e2e8f0;border-radius:999px;color:#475569;display:inline-flex;font-size:11px;font-variant-numeric:tabular-nums;font-weight:700;gap:6px;padding:4px 10px}
		.imogi-pos-sales-report .imogi-rpt-range-badge i{color:#94a3b8;font-size:10px}
		.imogi-pos-sales-report .imogi-rpt-filter-body{display:flex;flex-direction:column;gap:12px;padding:12px 14px 14px}
		.imogi-pos-sales-report .imogi-rpt-periods{display:flex;flex-wrap:wrap;gap:6px}
		.imogi-pos-sales-report button.imogi-rpt-period{align-items:center!important;appearance:none!important;-webkit-appearance:none!important;background:#fff!important;border:1px solid #cbd5e1!important;border-radius:6px!important;box-shadow:none!important;color:#475569!important;cursor:pointer!important;display:inline-flex!important;font-family:inherit!important;font-size:11px!important;font-weight:700!important;height:32px!important;line-height:1!important;margin:0!important;outline:none!important;padding:0 12px!important;transition:background .12s,border-color .12s,color .12s,box-shadow .12s!important;white-space:nowrap!important}
		.imogi-pos-sales-report button.imogi-rpt-period:hover{background:#f8fafc!important;border-color:#94a3b8!important;color:#0f172a!important}
		.imogi-pos-sales-report button.imogi-rpt-period.is-active{background:#fff7ed!important;border-color:#f39c12!important;box-shadow:0 0 0 1px rgba(243,156,18,.18)!important;color:#9a3412!important}
		.imogi-pos-sales-report button.imogi-rpt-period i{font-size:10px;margin-right:5px;opacity:.85}
		.imogi-pos-sales-report .imogi-rpt-filter-row{align-items:flex-end;display:flex;flex-wrap:wrap;gap:10px 12px;justify-content:space-between}
		.imogi-pos-sales-report .imogi-rpt-custom-range{align-items:flex-end;display:flex;flex:1;flex-wrap:wrap;gap:8px 12px;min-width:0}
		.imogi-pos-sales-report .imogi-rpt-date-field{display:flex;flex-direction:column;gap:3px}
		.imogi-pos-sales-report .imogi-rpt-date-field label{color:#64748b;font-size:10px;font-weight:700;letter-spacing:.06em;margin:0;text-transform:uppercase}
		.imogi-pos-sales-report .imogi-rpt-date-field input[type=date]{background:#fff;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;height:32px;min-width:140px;padding:0 8px}
		.imogi-pos-sales-report .imogi-rpt-free-hint{color:#94a3b8;font-size:10px;font-weight:600;line-height:1.3;margin-top:2px}
		.imogi-pos-sales-report .imogi-rpt-filter-action{flex-shrink:0}
		.imogi-pos-sales-report button.imogi-rpt-load{align-items:center!important;background:linear-gradient(135deg,#f5b041,#f39c12)!important;border:none!important;border-radius:6px!important;box-shadow:0 2px 8px rgba(243,156,18,.28)!important;color:#fff!important;display:inline-flex!important;font-size:12px!important;font-weight:700!important;gap:6px;height:32px!important;padding:0 14px!important}
		.imogi-pos-sales-report button.imogi-rpt-load:hover{box-shadow:0 3px 10px rgba(243,156,18,.38)!important}
		.imogi-pos-sales-report .imogi-rpt-upgrade-nudge{align-items:center;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;color:#9a3412;display:flex;flex-wrap:wrap;font-size:11px;font-weight:600;gap:8px 12px;justify-content:space-between;margin-bottom:12px;padding:10px 12px}
		.imogi-pos-sales-report .imogi-rpt-upgrade-nudge a{align-items:center;background:linear-gradient(135deg,#f5b041,#f39c12);border-radius:6px;color:#fff!important;display:inline-flex;font-size:11px;font-weight:700;gap:5px;height:28px;padding:0 10px;text-decoration:none!important;white-space:nowrap}
		.imogi-pos-sales-report .imogi-rpt-channels-grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
		.imogi-pos-sales-report .imogi-rpt-channel-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px}
		.imogi-pos-sales-report .imogi-rpt-channel-head{align-items:flex-start;display:flex;gap:8px;justify-content:space-between;margin-bottom:8px}
		.imogi-pos-sales-report .imogi-rpt-channel-name{color:#0f172a;font-size:12px;font-weight:800}
		.imogi-pos-sales-report .imogi-rpt-channel-amt{color:#d97706;font-size:14px;font-variant-numeric:tabular-nums;font-weight:800;white-space:nowrap}
		.imogi-pos-sales-report .imogi-rpt-channel-track{background:#e2e8f0;border-radius:999px;height:6px;overflow:hidden}
		.imogi-pos-sales-report .imogi-rpt-channel-fill{background:linear-gradient(90deg,#fbbf24,#f39c12);border-radius:999px;height:100%;min-width:4px}
		.imogi-pos-sales-report .imogi-rpt-channel-pct{color:#94a3b8;font-size:10px;font-weight:700;margin-top:6px;text-align:right}
		.imogi-pos-sales-report .imogi-rpt-table-wrap{overflow-x:auto}
		.imogi-pos-sales-report .imogi-rpt-table{width:100%}
		.imogi-pos-sales-report .imogi-rpt-table th{background:#fff;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:10px;font-weight:800;letter-spacing:.04em;padding:9px 12px;text-align:left;text-transform:uppercase;white-space:nowrap}
		.imogi-pos-sales-report .imogi-rpt-table td{border-bottom:1px solid #f1f5f9;color:#334155;font-size:12px;padding:10px 12px;vertical-align:middle}
		.imogi-pos-sales-report .imogi-rpt-table tbody tr:hover td{background:#fafafa}
		.imogi-pos-sales-report .imogi-rpt-table tbody tr:last-child td{border-bottom:none}
		.imogi-pos-sales-report .imogi-rpt-order-id{color:#0f172a;font-variant-numeric:tabular-nums;font-weight:800}
		.imogi-pos-sales-report .imogi-rpt-total{color:#0f172a;font-variant-numeric:tabular-nums;font-weight:800;text-align:right;white-space:nowrap}
		.imogi-pos-sales-report .imogi-rpt-status{align-items:center;border-radius:999px;display:inline-flex;font-size:10px;font-weight:800;letter-spacing:.02em;padding:3px 8px;text-transform:uppercase;white-space:nowrap}
		.imogi-pos-sales-report .imogi-rpt-status--completed{background:#ecfdf5;border:1px solid #a7f3d0;color:#047857}
		.imogi-pos-sales-report .imogi-rpt-status--pending{background:#fff7ed;border:1px solid #fed7aa;color:#c2410c}
		.imogi-pos-sales-report .imogi-rpt-status--cancelled{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c}
		.imogi-pos-sales-report .imogi-rpt-status--default{background:#f1f5f9;border:1px solid #e2e8f0;color:#64748b}
		.imogi-pos-sales-report .imogi-rpt-channel-tag{background:#eff6ff;border:1px solid #bfdbfe;border-radius:4px;color:#1d4ed8;display:inline-block;font-size:10px;font-weight:700;padding:3px 8px}
		.imogi-pos-sales-report .imogi-rpt-panel-meta{color:#64748b;font-size:11px;font-weight:600;margin-left:auto}
		.imogi-pos-sales-report .page-head{display:none!important}
		.imogi-pos-sales-report .imogi-web-hero:not(.imogi-web-hero--compact) p{margin:0}
		@media (max-width:767px){
			.imogi-pos-sales-report .imogi-rpt-filter-row{align-items:stretch;flex-direction:column}
			.imogi-pos-sales-report .imogi-rpt-filter-action,.imogi-pos-sales-report button.imogi-rpt-load{width:100%!important;justify-content:center!important}
			.imogi-pos-sales-report .imogi-rpt-channels-grid{grid-template-columns:1fr}
		}
		`,
		"imogi-sales-report-css-v7"
	);
}

frappe.pages["imogi-pos-sales-report"].on_page_load = function (wrapper) {
	if (!imogi_pos.page_shell?.make_page) {
		frappe.msgprint(__("IMOGI page shell belum dimuat. Muat ulang halaman (Ctrl+Shift+R)."));
		return;
	}

	frappe.call({
		method: "imogi_pos.api.free_tier_api.get_sales_report_limits",
		callback(r) {
			if (r.exc) {
				frappe.msgprint(__("Gagal memuat batas laporan. Muat ulang halaman."));
				return;
			}
			imogi_pos_sales_report_init(wrapper, r.message || {});
		},
	});
};

function imogi_pos_sales_report_init(wrapper, limits) {
	const isFree = !!limits.is_free;
	const showChannels = !!limits.show_channel_breakdown;
	const FREE_MAX_CUSTOM_DAYS = limits.max_custom_days || 30;

	const page = imogi_pos.page_shell.make_page(wrapper, __("Laporan Penjualan"), "imogi-pos-sales-report");
	$(wrapper).find(".page-head").hide();

	const $content = imogi_pos.page_shell.render_hero(page.main, {
		subtitle: isFree
			? __("Ringkasan penjualan harian — preset cepat, custom max 30 hari")
			: __("Ringkasan penjualan harian — role Owner"),
		actions_html: `
			<a class="imogi-web-btn imogi-web-btn-ghost" href="/app/imogi-pos-dashboard"><i class="fa fa-line-chart"></i> ${__(
				"Dashboard"
			)}</a>
			<button type="button" class="imogi-web-btn imogi-web-btn-ghost imogi-rpt-export" style="display:none"><i class="fa fa-download"></i> ${__(
				"Export Excel"
			)}</button>
		`,
	});
	const $shell = $content.closest(".imogi-web-shell");
	if (!$content.length) {
		frappe.msgprint(__("Gagal memuat layout laporan. Muat ulang halaman (Ctrl+Shift+R)."));
		return;
	}

	const today = frappe.datetime.get_today();
	const PAGE_SIZE = 10;
	const PERIODS = [
		{ id: "today", label: __("Hari Ini"), icon: "fa-sun-o" },
		{ id: "yesterday", label: __("Kemarin"), icon: "fa-history" },
		{ id: "last_7_days", label: __("7 Hari"), icon: "fa-calendar" },
		{ id: "this_month", label: __("Bulan Ini"), icon: "fa-calendar-check-o" },
		{ id: "custom", label: __("Custom"), icon: "fa-sliders" },
	];

	const $filters = $(`
		<div class="imogi-rpt-upgrade-nudge" style="display:none">
			<span><i class="fa fa-lock"></i> ${__(
				"Paket Free: custom maks. 30 hari. Tarik laporan 3–12 bulan? Upgrade ke Starter."
			)}</span>
			<a href="/app/imogi-pos-settings"><i class="fa fa-arrow-up"></i> ${__("Upgrade Paket")}</a>
		</div>
		<div class="imogi-rpt-filter-card">
			<div class="imogi-rpt-filter-head">
				<span class="imogi-rpt-filter-title">${__("Periode Laporan")}</span>
				<span class="imogi-rpt-range-badge"><i class="fa fa-calendar-o"></i> <span class="imogi-rpt-range-text">${__(
					"Hari Ini"
				)}</span></span>
			</div>
			<div class="imogi-rpt-filter-body">
				<div class="imogi-rpt-periods">
					${PERIODS.map(
						(row, idx) =>
							`<button type="button" class="imogi-rpt-period${idx === 0 ? " is-active" : ""}" data-period="${row.id}"><i class="fa ${row.icon}"></i> ${row.label}</button>`
					).join("")}
				</div>
				<div class="imogi-rpt-filter-row">
					<div class="imogi-rpt-custom-range" style="display:none">
						<div class="imogi-rpt-date-field">
							<label>${__("Dari")}</label>
							<input type="date" class="form-control imogi-rpt-from" value="${today}">
						</div>
						<div class="imogi-rpt-date-field">
							<label>${__("Sampai")}</label>
							<input type="date" class="form-control imogi-rpt-to" value="${today}" max="${today}">
						</div>
						${
							isFree
								? `<div class="imogi-rpt-date-field"><label>&nbsp;</label><span class="imogi-rpt-free-hint">${__(
										"Maks. {0} hari (Free)",
										[FREE_MAX_CUSTOM_DAYS]
								  )}</span></div>`
								: ""
						}
					</div>
					<div class="imogi-rpt-filter-action">
						<button type="button" class="imogi-rpt-load"><i class="fa fa-refresh"></i> ${__("Tampilkan")}</button>
					</div>
				</div>
			</div>
		</div>
	`);
	const $stats = $('<div class="imogi-web-stat-grid imogi-rpt-stats"></div>');
	const $channels = showChannels
		? $(`
		<div class="imogi-web-panel imogi-rpt-channels-wrap" style="margin-bottom:12px;display:none">
			<div class="imogi-web-panel-head">
				<div class="imogi-web-panel-title">${__("Penjualan per Channel")}</div>
				<span class="imogi-rpt-panel-meta imogi-rpt-channels-meta"></span>
			</div>
			<div class="imogi-web-panel-body imogi-rpt-channels"></div>
		</div>
	`)
		: null;
	const $panel = $(`
		<div class="imogi-web-panel">
			<div class="imogi-web-panel-head">
				<div class="imogi-web-panel-title">${__("Detail Order")}</div>
				<span class="imogi-rpt-panel-meta imogi-rpt-orders-meta"></span>
			</div>
			<div class="imogi-web-panel-body imogi-rpt-body"><div class="imogi-web-empty">${__("Memuat...")}</div></div>
		</div>
	`);
	$content.append($filters).append($stats);
	if ($channels) {
		$content.append($channels);
	}
	$content.append($panel);

	if (typeof imogi_pos.page_shell.init_owner_page === "function") {
		imogi_pos.page_shell.init_owner_page($shell, __("Laporan Penjualan"));
	} else if (typeof imogi_pos.page_shell.render_topbar === "function") {
		imogi_pos.page_shell.render_topbar($shell, __("Laporan Penjualan"));
		if (isFree && typeof imogi_pos.page_shell.render_upgrade_strip === "function") {
			imogi_pos.page_shell.render_upgrade_strip($shell.find(".imogi-web-upgrade-slot"), {
				persona: "owner",
			});
		}
	}

	let _last_rows = [];
	let _last_currency = null;
	let _current_page = 1;
	let _last_from = today;
	let _last_to = today;

	const period_label = (id) => PERIODS.find((row) => row.id === id)?.label || id;

	const format_range_label = (from, to, period) => {
		if (from === to) {
			return frappe.datetime.str_to_user(from);
		}
		return `${frappe.datetime.str_to_user(from)} – ${frappe.datetime.str_to_user(to)}`;
	};

	const update_range_badge = (from, to, period) => {
		const label = period === "custom" ? format_range_label(from, to, period) : period_label(period);
		$filters.find(".imogi-rpt-range-text").text(label);
	};

	const get_active_period = () =>
		$filters.find(".imogi-rpt-period.is-active").data("period") || "today";

	const month_start = (day) => {
		const parts = String(day).split("-");
		return `${parts[0]}-${parts[1]}-01`;
	};

	const resolve_period_dates = (period) => {
		const end = today;
		if (period === "today") {
			return { from: today, to: today };
		}
		if (period === "yesterday") {
			const y = frappe.datetime.add_days(today, -1);
			return { from: y, to: y };
		}
		if (period === "last_7_days") {
			return { from: frappe.datetime.add_days(today, -6), to: end };
		}
		if (period === "this_month") {
			return { from: month_start(today), to: end };
		}
		const from = $filters.find(".imogi-rpt-from").val() || today;
		const to = $filters.find(".imogi-rpt-to").val() || today;
		return from <= to ? { from, to } : { from: to, to: from };
	};

	const inclusive_span = (from, to) => frappe.datetime.get_day_diff(to, from) + 1;

	const sync_custom_visibility = () => {
		const period = get_active_period();
		$filters.find(".imogi-rpt-custom-range").toggle(period === "custom");
	};

	const status_class = (status) => {
		const key = String(status || "").toLowerCase();
		if (key === "completed") return "imogi-rpt-status--completed";
		if (key.includes("cancel")) return "imogi-rpt-status--cancelled";
		if (key.includes("draft") || key.includes("await") || key.includes("open")) {
			return "imogi-rpt-status--pending";
		}
		return "imogi-rpt-status--default";
	};

	const show_upgrade_nudge = (days) => {
		$filters.find(".imogi-rpt-upgrade-nudge").show();
		frappe.msgprint({
			title: __("Periode Laporan Terbatas"),
			indicator: "orange",
			message: __(
				"Anda memilih {0} hari. Paket Free membatasi custom maksimal {1} hari. Untuk laporan 3 bulan, 6 bulan, atau 1 tahun, upgrade ke paket Starter.",
				[days, FREE_MAX_CUSTOM_DAYS]
			),
		});
	};

	const hide_upgrade_nudge = () => {
		$filters.find(".imogi-rpt-upgrade-nudge").hide();
	};

	const render_orders_page = () => {
		const $body = $panel.find(".imogi-rpt-body");
		if (!_last_rows.length) {
			$body.html(`<div class="imogi-web-empty">${__("Tidak ada data")}</div>`);
			return;
		}
		const total = _last_rows.length;
		const total_pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
		_current_page = Math.min(Math.max(1, _current_page), total_pages);
		const start = (_current_page - 1) * PAGE_SIZE;
		const page_rows = _last_rows.slice(start, start + PAGE_SIZE);
		const end = start + page_rows.length;

		const html = [`<div class="imogi-rpt-table-wrap"><table class="imogi-rpt-table"><thead><tr>
			<th>${__("Order")}</th><th>${__("Tanggal")}</th><th>${__("Channel")}</th><th>${__("Status")}</th><th style="text-align:right">${__("Total")}</th>
		</tr></thead><tbody>`];
		page_rows.forEach((row) => {
			const status = row.status || "";
			html.push(`<tr>
				<td><span class="imogi-rpt-order-id">${frappe.utils.escape_html(row.name)}</span></td>
				<td>${frappe.datetime.str_to_user(row.creation)}</td>
				<td><span class="imogi-rpt-channel-tag">${frappe.utils.escape_html(row.order_channel || "-")}</span></td>
				<td><span class="imogi-rpt-status ${status_class(status)}">${frappe.utils.escape_html(status)}</span></td>
				<td class="imogi-rpt-total">${format_currency(row.grand_total || 0, _last_currency)}</td>
			</tr>`);
		});
		html.push("</tbody></table></div>");

		if (total > PAGE_SIZE) {
			html.push(`
				<div class="imogi-web-pagination">
					<span class="imogi-web-pagination-info">${__("Menampilkan")} ${start + 1}–${end} ${__(
						"dari"
					)} ${total}</span>
					<div class="imogi-web-pagination-controls">
						<button type="button" class="imogi-web-btn imogi-web-btn-ghost imogi-rpt-prev"${_current_page <= 1 ? " disabled" : ""}>
							<i class="fa fa-chevron-left"></i> ${__("Sebelumnya")}
						</button>
						<span class="imogi-web-pagination-page">${_current_page} / ${total_pages}</span>
						<button type="button" class="imogi-web-btn imogi-web-btn-ghost imogi-rpt-next"${_current_page >= total_pages ? " disabled" : ""}>
							${__("Berikutnya")} <i class="fa fa-chevron-right"></i>
						</button>
					</div>
				</div>
			`);
		}

		$body.html(html.join(""));
		$panel.find(".imogi-rpt-orders-meta").text(`${total} ${__("order")}`);
		$body.find(".imogi-rpt-prev").on("click", () => {
			if (_current_page > 1) {
				_current_page -= 1;
				render_orders_page();
			}
		});
		$body.find(".imogi-rpt-next").on("click", () => {
			const total_pages = Math.ceil(_last_rows.length / PAGE_SIZE);
			if (_current_page < total_pages) {
				_current_page += 1;
				render_orders_page();
			}
		});
	};

	const load = () => {
		const period = get_active_period();
		const range = resolve_period_dates(period);
		_last_from = range.from;
		_last_to = range.to;
		update_range_badge(range.from, range.to, period);

		if (isFree && period === "custom") {
			const span = inclusive_span(range.from, range.to);
			if (span > FREE_MAX_CUSTOM_DAYS) {
				show_upgrade_nudge(span);
				return;
			}
		}
		hide_upgrade_nudge();

		$stats.html(`<div class="imogi-web-empty" style="grid-column:1/-1"><i class="fa fa-spinner fa-spin"></i> ${__(
			"Memuat..."
		)}</div>`);
		$panel.find(".imogi-rpt-body").html(`<div class="imogi-web-empty"><i class="fa fa-spinner fa-spin"></i> ${__(
			"Memuat..."
		)}</div>`);
		$panel.find(".imogi-rpt-orders-meta").text("");
		frappe.call({
			method: "imogi_pos.api.free_tier_api.get_sales_report",
			args: {
				period,
				from_date: range.from,
				to_date: range.to,
			},
			callback(r) {
				if (r.exc) {
					const msg = (r._server_messages && JSON.parse(r._server_messages)[0]) || "";
					const is_range_limit =
						msg.includes("30") ||
						msg.includes("Periode") ||
						msg.includes("Starter") ||
						msg.includes("Free");
					if (isFree && is_range_limit) {
						show_upgrade_nudge(inclusive_span(range.from, range.to));
					}
					$stats.html(
						`<div class="imogi-web-empty text-danger" style="grid-column:1/-1">${__(
							"Gagal memuat laporan. Periksa periode atau coba lagi."
						)}</div>`
					);
					$panel.find(".imogi-rpt-body").html(`<div class="imogi-web-empty">${__("Tidak ada data")}</div>`);
					return;
				}
				const msg = r.message || {};
				const summary = msg.summary || {};
				$stats.html(`
					<div class="imogi-web-stat imogi-web-stat--hero">
						<span class="imogi-web-stat-icon"><i class="fa fa-money"></i></span>
						<div class="imogi-web-stat-body">
							<div class="imogi-web-stat-label">${__("Total Penjualan")}</div>
							<div class="imogi-web-stat-value">${format_currency(
								summary.total_sales || 0,
								summary.currency
							)}</div>
						</div>
					</div>
					<div class="imogi-web-stat">
						<span class="imogi-web-stat-icon imogi-web-stat-icon--count"><i class="fa fa-shopping-cart"></i></span>
						<div class="imogi-web-stat-body">
							<div class="imogi-web-stat-label">${__("Jumlah Order")}</div>
							<div class="imogi-web-stat-value">${summary.order_count || 0}</div>
						</div>
					</div>
					<div class="imogi-web-stat">
						<span class="imogi-web-stat-icon imogi-web-stat-icon--done"><i class="fa fa-check-circle"></i></span>
						<div class="imogi-web-stat-body">
							<div class="imogi-web-stat-label">${__("Selesai")}</div>
							<div class="imogi-web-stat-value">${summary.completed_count || 0}</div>
						</div>
					</div>
				`);
				const rows = msg.orders || [];
				_last_rows = rows;
				_last_currency = summary.currency;
				_current_page = 1;
				$shell.find(".imogi-rpt-export").toggle(rows.length > 0);
				if ($channels && msg.limits?.show_channel_breakdown !== false) {
					const byChannel = msg.by_channel || [];
					const channel_total = byChannel.reduce((sum, row) => sum + flt(row.amount), 0);
					if (byChannel.length) {
						$channels.show();
						$channels.find(".imogi-rpt-channels-meta").text(
							`${byChannel.length} ${__("channel")} · ${format_currency(channel_total, summary.currency)}`
						);
						const maxAmt = Math.max(...byChannel.map((row) => flt(row.amount)), 1);
						$channels.find(".imogi-rpt-channels").html(
							`<div class="imogi-rpt-channels-grid">${byChannel
								.map((row) => {
									const amt = flt(row.amount);
									const pct = Math.max(8, Math.round((amt / maxAmt) * 100));
									const share = channel_total ? Math.round((amt / channel_total) * 100) : 0;
									return `<div class="imogi-rpt-channel-card">
										<div class="imogi-rpt-channel-head">
											<span class="imogi-rpt-channel-name">${frappe.utils.escape_html(row.channel)}</span>
											<span class="imogi-rpt-channel-amt">${format_currency(amt, summary.currency)}</span>
										</div>
										<div class="imogi-rpt-channel-track">
											<div class="imogi-rpt-channel-fill" style="width:${pct}%"></div>
										</div>
										<div class="imogi-rpt-channel-pct">${share}% ${__("dari total")}</div>
									</div>`;
								})
								.join("")}</div>`
						);
					} else {
						$channels.hide();
					}
				}
				if (!rows.length) {
					$panel.find(".imogi-rpt-body").html(`<div class="imogi-web-empty">${__("Tidak ada data")}</div>`);
					$panel.find(".imogi-rpt-orders-meta").text("0 order");
					return;
				}
				render_orders_page();
			},
		});
	};

	$filters.find(".imogi-rpt-period").on("click", function () {
		$filters.find(".imogi-rpt-period").removeClass("is-active");
		$(this).addClass("is-active");
		sync_custom_visibility();
		const period = get_active_period();
		const range = resolve_period_dates(period);
		update_range_badge(range.from, range.to, period);
		if (period !== "custom") {
			hide_upgrade_nudge();
			load();
		}
	});

	$filters.find(".imogi-rpt-from, .imogi-rpt-to").on("change", () => {
		if (get_active_period() !== "custom") {
			return;
		}
		const range = resolve_period_dates("custom");
		update_range_badge(range.from, range.to, "custom");
		if (isFree) {
			if (inclusive_span(range.from, range.to) > FREE_MAX_CUSTOM_DAYS) {
				show_upgrade_nudge(inclusive_span(range.from, range.to));
			} else {
				hide_upgrade_nudge();
			}
		}
	});

	sync_custom_visibility();
	inject_sales_report_css();
	$filters.find(".imogi-rpt-load").on("click", load);
	$shell.find(".imogi-rpt-export").on("click", () => {
		if (!_last_rows.length) return;
		const lines = [
			["Order", "Tanggal", "Channel", "Status", "Total"].join(","),
			..._last_rows.map((row) =>
				[
					row.name,
					row.creation,
					row.order_channel || "",
					row.status || "",
					row.grand_total || 0,
				]
					.map((v) => `"${String(v).replace(/"/g, '""')}"`)
					.join(",")
			),
		];
		const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = `imogi-sales-${_last_from}-${_last_to}.csv`;
		a.click();
	});
	load();
}
