function inject_order_surface_css() {
	for (let v = 1; v <= 15; v += 1) {
		document.getElementById(`imogi-order-surface-css-v${v}`)?.remove();
	}
	if (document.getElementById("imogi-order-surface-css-v16")) return;
	frappe.dom.set_style(
		`
		body.imogi-pos-themed:has(.imogi-pos-order-surface),
		body.imogi-pos-themed .layout-main-section-wrapper:has(.imogi-pos-order-surface),
		body.imogi-pos-themed .layout-main:has(.imogi-pos-order-surface),
		body.imogi-pos-themed .page-container:has(.imogi-pos-order-surface),
		body.imogi-pos-themed .main-section:has(.imogi-pos-order-surface),
		.imogi-pos-order-surface.layout-main-section,
		.imogi-pos-order-surface,
		.imogi-pos-order-surface .page-body,
		.imogi-pos-order-surface .imogi-web-shell-root,
		.imogi-pos-order-surface .imogi-web-shell,
		.imogi-pos-order-surface .imogi-web-content{background:#fff!important}
		body.imogi-pos-themed .layout-main-section-wrapper:has(.imogi-pos-order-surface),
		body.imogi-pos-themed .layout-main:has(.imogi-pos-order-surface),
		body.imogi-pos-themed .page-container:has(.imogi-pos-order-surface),
		body.imogi-pos-themed .main-section:has(.imogi-pos-order-surface),
		body.imogi-pos-themed .container:has(.imogi-pos-order-surface),
		.imogi-pos-order-surface.layout-main-section,
		.imogi-pos-order-surface,
		.imogi-pos-order-surface .page-body{box-sizing:border-box;margin-left:0!important;margin-right:0!important;max-width:100%!important;width:100%!important}
		.imogi-pos-order-surface.layout-main-section,
		.imogi-pos-order-surface .imogi-web-shell{box-sizing:border-box;display:flex;flex-direction:column;margin:0!important;max-width:none!important;min-height:calc(100dvh - 60px);width:100%!important}
		body.imogi-pos-cashier-fullscreen .layout-main-section-wrapper:has(.imogi-pos-order-surface),
		body.imogi-pos-cashier-fullscreen .imogi-pos-order-surface.layout-main-section,
		body.imogi-pos-cashier-fullscreen .imogi-pos-order-surface,
		body.imogi-pos-cashier-fullscreen .imogi-pos-order-surface .page-body,
		body.imogi-pos-cashier-fullscreen .imogi-pos-order-surface .imogi-web-shell{background:#fff!important}
		body.imogi-pos-cashier-fullscreen .imogi-pos-order-surface.layout-main-section,
		body.imogi-pos-cashier-fullscreen .imogi-pos-order-surface{box-sizing:border-box;display:flex;flex-direction:column;height:100dvh!important;max-height:100dvh!important;min-height:100dvh!important;overflow:hidden;padding:8px 12px 10px!important}
		body.imogi-pos-cashier-fullscreen .imogi-pos-order-surface .imogi-web-shell{background:#fff!important;display:flex;flex:1;flex-direction:column;gap:10px;height:auto!important;max-height:none!important;min-height:0!important}
		.imogi-pos-order-surface .page-body{display:flex;flex:1;flex-direction:column;min-height:0;padding:0!important}
		.imogi-pos-order-surface .imogi-web-content{display:flex;flex:1;flex-direction:column;gap:12px;min-height:0}
		.imogi-pos-order-surface .imogi-web-topbar{align-items:center;background:linear-gradient(145deg,#0f1f35 0%,#1a3352 100%)!important;border:1px solid rgba(255,255,255,.12)!important;border-radius:10px!important;flex-shrink:0;margin:0!important;padding:8px 12px!important}
		.imogi-pos-order-surface .imogi-web-topbar-title{color:rgba(255,255,255,.92)!important;font-size:11px!important;letter-spacing:.1em}
		.imogi-pos-order-surface .imogi-web-topbar-co{color:rgba(255,255,255,.72)!important;font-size:12px!important;font-weight:600}
		.imogi-pos-order-surface .imogi-web-topbar-context{display:none!important}
		.imogi-pos-order-surface .imogi-web-hero{align-items:center;background:#fff!important;border:1px solid #e4e4e7!important;border-radius:12px!important;box-shadow:0 1px 3px rgba(15,31,53,.06),0 4px 12px rgba(15,31,53,.04)!important;display:flex;flex-shrink:0;flex-wrap:wrap;gap:10px 12px;justify-content:space-between;margin:0!important;padding:14px 16px!important}
		.imogi-pos-order-surface .imogi-web-hero h3{color:#0f1f35!important;font-size:20px!important;font-weight:800;margin:0 0 4px}
		.imogi-pos-order-surface .imogi-web-hero p{color:#71717a!important;font-size:13px!important;margin:0}
		.imogi-pos-order-surface .imogi-web-btn-ghost{background:#fff!important;border:1px solid #d4d4d8!important;border-radius:8px!important;box-shadow:none!important;color:#0f1f35!important;font-weight:700!important;height:36px!important;padding:0 14px!important}
		.imogi-pos-order-surface .imogi-oh-stat-grid{display:grid;flex-shrink:0;gap:12px;grid-template-columns:repeat(4,minmax(0,1fr))}
		.imogi-pos-order-surface .imogi-oh-stat-card{align-items:center;background:#fff;border:1px solid #e4e4e7;border-radius:12px;box-shadow:0 1px 3px rgba(15,31,53,.04);display:flex;gap:12px;min-height:84px;padding:14px 16px}
		.imogi-pos-order-surface .imogi-oh-stat-icon{align-items:center;border-radius:999px;display:inline-flex;flex-shrink:0;font-size:16px;height:42px;justify-content:center;width:42px}
		.imogi-pos-order-surface .imogi-oh-stat-icon--blue{background:#eff6ff;color:#2563eb}
		.imogi-pos-order-surface .imogi-oh-stat-icon--green{background:#ecfdf5;color:#059669}
		.imogi-pos-order-surface .imogi-oh-stat-icon--red{background:#fef2f2;color:#dc2626}
		.imogi-pos-order-surface .imogi-oh-stat-body{min-width:0}
		.imogi-pos-order-surface .imogi-oh-stat-label{color:#64748b;font-size:12px;font-weight:600;line-height:1.25}
		.imogi-pos-order-surface .imogi-oh-stat-value{color:#0f1f35;font-size:20px;font-variant-numeric:tabular-nums;font-weight:800;line-height:1.15;margin-top:4px}
		.imogi-pos-order-surface .imogi-oh-stat-hint{color:#94a3b8;font-size:11px;font-weight:600;margin-top:2px}
		.imogi-pos-order-surface .imogi-web-panel{background:#fff!important;border:1px solid #e4e4e7!important;border-radius:12px!important;box-shadow:0 1px 3px rgba(15,31,53,.06),0 4px 12px rgba(15,31,53,.04)!important;display:flex;flex:1;flex-direction:column;min-height:0;overflow:hidden}
		.imogi-pos-order-surface .imogi-web-panel-head{align-items:center;background:#fff!important;border-bottom:1px solid #edf2f7;display:flex;flex-shrink:0;flex-wrap:wrap;gap:10px;justify-content:space-between;padding:14px 16px}
		.imogi-pos-order-surface .imogi-web-panel-title{color:#0f1f35!important;font-size:13px!important;font-weight:800;letter-spacing:.04em}
		.imogi-pos-order-surface .imogi-oh-toolbar{align-items:center;display:flex;flex:1;flex-wrap:wrap;gap:8px;justify-content:flex-end;min-width:0}
		.imogi-pos-order-surface .imogi-oh-search-wrap{align-items:center;display:flex;flex:1;max-width:280px;min-width:180px;position:relative}
		.imogi-pos-order-surface .imogi-oh-search-icon{color:#94a3b8;font-size:13px;left:14px;pointer-events:none;position:absolute;top:50%;transform:translateY(-50%);z-index:1}
		.imogi-pos-order-surface .imogi-oh-search{background:#fff;border:1px solid #d4d4d8;border-radius:8px;box-sizing:border-box;font-size:13px;height:36px;padding:0 12px 0 40px;width:100%}
		.imogi-pos-order-surface .imogi-oh-date-wrap{align-items:center;display:flex;position:relative}
		.imogi-pos-order-surface .imogi-oh-date-icon{color:#94a3b8;font-size:13px;left:12px;pointer-events:none;position:absolute;z-index:1}
		.imogi-pos-order-surface .imogi-oh-date-filter{appearance:none;-webkit-appearance:none;background:#fff;border:1px solid #d4d4d8;border-radius:8px;color:#0f1f35;cursor:pointer;font-size:13px;font-weight:600;height:36px;min-width:150px;padding:0 12px 0 34px}
		.imogi-pos-order-surface .imogi-oh-refresh{align-items:center;background:#fff;border:1px solid #d4d4d8;border-radius:8px;color:#0f1f35;cursor:pointer;display:inline-flex;font-size:13px;font-weight:700;gap:6px;height:36px;padding:0 14px;white-space:nowrap}
		.imogi-pos-order-surface .imogi-oh-refresh:hover{background:#f8fafc;border-color:#0f1f35}
		.imogi-pos-order-surface .imogi-oh-body{flex:1;min-height:120px;overflow:auto;padding:0 16px 8px}
		.imogi-pos-order-surface .imogi-web-table th{background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:11px;font-weight:800;letter-spacing:.04em;padding:12px 10px;text-transform:uppercase}
		.imogi-pos-order-surface .imogi-web-table td{border-bottom:1px solid #f1f5f9;color:#334155;font-size:13px;padding:12px 10px}
		.imogi-pos-order-surface .imogi-web-table td a{color:#2563eb;font-weight:700;text-decoration:none}
		.imogi-pos-order-surface .imogi-web-table td a:hover{text-decoration:underline}
		.imogi-pos-order-surface .imogi-oh-status{border-radius:999px;display:inline-flex;font-size:11px;font-weight:800;letter-spacing:.02em;padding:5px 12px;white-space:nowrap}
		.imogi-pos-order-surface .imogi-oh-status.is-completed{background:#dcfce7;color:#166534}
		.imogi-pos-order-surface .imogi-oh-status.is-in-service{background:#dbeafe;color:#1d4ed8}
		.imogi-pos-order-surface .imogi-oh-status.is-in-kitchen{background:#ffedd5;color:#c2410c}
		.imogi-pos-order-surface .imogi-oh-status.is-paid,.imogi-pos-order-surface .imogi-oh-status.is-awaiting-payment{background:#dbeafe;color:#1d4ed8}
		.imogi-pos-order-surface .imogi-oh-status.is-cancelled,.imogi-pos-order-surface .imogi-oh-status.is-void,.imogi-pos-order-surface .imogi-oh-status.is-refunded{background:#fee2e2;color:#b91c1c}
		.imogi-pos-order-surface .imogi-oh-status.is-default{background:#f1f5f9;color:#475569}
		.imogi-pos-order-surface .imogi-oh-pagination-host{border-top:1px solid #edf2f7;flex-shrink:0;padding:14px 16px 18px}
		.imogi-pos-order-surface .imogi-oh-pagination-host .imogi-web-pagination{border-top:none;margin-top:0;padding:0}
		.imogi-pos-order-surface .imogi-oh-pagination-host .imogi-web-page-next:not([disabled]){background:#0f1f35!important;border-color:#0f1f35!important;color:#fff!important}
		.imogi-pos-order-surface .imogi-oh-pagination-host .imogi-web-page-next:not([disabled]):hover{background:#1a3352!important;border-color:#1a3352!important;color:#fff!important}
		.imogi-pos-order-surface .page-head{display:none!important}
		@media (max-width:1199px){
			.imogi-pos-order-surface .imogi-oh-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
		}
		@media (max-width:992px){
			body.imogi-pos-cashier-fullscreen .layout-main-section-wrapper:has(.imogi-pos-order-surface),
			body.imogi-pos-cashier-fullscreen .imogi-pos-order-surface.layout-main-section,
			body.imogi-pos-cashier-fullscreen .imogi-pos-order-surface{
				height:auto!important;
				max-height:none!important;
				min-height:100dvh!important;
				overflow-x:hidden!important;
				overflow-y:auto!important;
				-webkit-overflow-scrolling:touch;
				padding:6px 6px calc(16px + env(safe-area-inset-bottom,0px))!important;
			}
			body.imogi-pos-cashier-fullscreen .imogi-pos-order-surface .page-body,
			body.imogi-pos-cashier-fullscreen .imogi-pos-order-surface .imogi-web-shell{
				height:auto!important;
				max-height:none!important;
				min-height:0!important;
				overflow:visible!important;
			}
			.imogi-pos-order-surface.layout-main-section,
			.imogi-pos-order-surface .imogi-web-shell{min-height:auto!important}
			.imogi-pos-order-surface .imogi-web-content,
			.imogi-pos-order-surface .imogi-web-panel{flex:none!important;min-height:0!important;overflow:visible!important}
			.imogi-pos-order-surface .imogi-oh-body{flex:none!important;min-height:auto!important;overflow:visible!important;padding:0 12px 12px}
			.imogi-pos-order-surface .imogi-web-topbar{border-radius:10px!important;padding:7px 10px!important}
			.imogi-pos-order-surface .imogi-web-hero{border-radius:10px!important;padding:10px 12px!important}
			.imogi-pos-order-surface .imogi-oh-stat-grid{grid-template-columns:1fr}
			.imogi-pos-order-surface .imogi-oh-stat-card{min-height:72px;padding:12px 14px}
			.imogi-pos-order-surface .imogi-oh-stat-value{font-size:18px}
			.imogi-pos-order-surface .imogi-web-panel-head{align-items:stretch;flex-direction:column;padding:12px}
			.imogi-pos-order-surface .imogi-oh-toolbar{width:100%}
			.imogi-pos-order-surface .imogi-oh-search-wrap{max-width:none;width:100%}
			.imogi-pos-order-surface .imogi-oh-search{font-size:14px;height:40px;padding:0 12px 0 42px}
			.imogi-pos-order-surface .imogi-oh-search-icon{font-size:14px;left:14px}
			.imogi-pos-order-surface .imogi-oh-date-filter,
			.imogi-pos-order-surface .imogi-oh-refresh{height:40px}
			.imogi-pos-order-surface .imogi-web-table{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch;width:100%}
			.imogi-pos-order-surface .imogi-web-table thead,
			.imogi-pos-order-surface .imogi-web-table tbody{display:table;width:100%;min-width:640px}
			.imogi-pos-order-surface .imogi-oh-pagination-host{padding:12px 12px calc(12px + env(safe-area-inset-bottom,0px))}
		}
		.imogi-oh-col-action { text-align: right; white-space: nowrap; width: 88px; }
		.imogi-oh-action-btn { align-items: center; background: #fff; border: 1px solid #d4d4d8; border-radius: 8px; color: #0f1f35; cursor: pointer; display: inline-flex; height: 32px; justify-content: center; margin-left: 6px; width: 32px; }
		.imogi-oh-action-btn:first-child { margin-left: 0; }
		.imogi-oh-action-btn:hover { background: #f8fafc; border-color: #0f1f35; }
		.imogi-oh-tabs { border-top: 1px solid #edf2f7; display: flex; flex-shrink: 0; gap: 8px; margin-top: 4px; padding: 14px 16px 12px; }
		.imogi-oh-tab { background: #fff; border: 1px solid #d4d4d8; border-radius: 8px; color: #64748b; cursor: pointer; font-size: 12px; font-weight: 800; letter-spacing: .02em; min-height: 36px; padding: 0 16px; transition: background .15s, border-color .15s, color .15s; }
		.imogi-oh-tab.is-active { background: #0f1f35; border-color: #0f1f35; color: #fff; }
		.imogi-oh-tab:hover:not(.is-active) { background: #f8fafc; border-color: #94a3b8; color: #0f1f35; }
		.imogi-oh-promo-badge { align-items: center; background: #ecfdf5; border-radius: 999px; color: #047857; display: inline-flex; font-size: 11px; font-weight: 800; gap: 4px; max-width: 180px; overflow: hidden; padding: 4px 10px; text-overflow: ellipsis; white-space: nowrap; }
		.imogi-oh-promo-badge.is-empty { background: #f8fafc; color: #94a3b8; font-weight: 600; }
		.imogi-oh-promo-amount { color: #047857; display: block; font-size: 11px; font-variant-numeric: tabular-nums; font-weight: 700; margin-top: 2px; }
		.imogi-oh-summary-kpi { display: grid; gap: 10px; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-bottom: 12px; }
		.imogi-oh-summary-kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; }
		.imogi-oh-summary-kpi-label { color: #64748b; font-size: 11px; font-weight: 700; letter-spacing: .03em; text-transform: uppercase; }
		.imogi-oh-summary-kpi-value { color: #0f1f35; font-size: 18px; font-variant-numeric: tabular-nums; font-weight: 800; margin-top: 4px; }
		.imogi-oh-rank { align-items: center; background: #eff6ff; border-radius: 999px; color: #1d4ed8; display: inline-flex; font-size: 11px; font-weight: 800; height: 26px; justify-content: center; width: 26px; }
		.imogi-oh-rank.is-top { background: #0f1f35; color: #fff; }
		.imogi-oh-detail-tax-block { border-top: 1px dashed #d4d4d8; margin-top: 8px; padding-top: 8px; }
		.imogi-oh-detail-tax-title { color: #71717a; font-size: 11px; font-weight: 800; letter-spacing: .04em; margin-bottom: 6px; text-transform: uppercase; }
		.imogi-oh-detail-dialog .modal-dialog { max-width: 980px !important; }
		.imogi-oh-detail { align-items: stretch; display: grid; gap: 14px; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
		.imogi-oh-detail-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
		.imogi-oh-detail-card--payment .imogi-oh-detail-summary { flex: 1; }
		.imogi-oh-detail-card--payment .imogi-oh-detail-grand { margin-top: auto !important; }
		.imogi-oh-detail-card > .imogi-oh-detail-hero,
		.imogi-oh-detail-card > .imogi-oh-detail-meta,
		.imogi-oh-detail-card > .imogi-oh-detail-block,
		.imogi-oh-detail-card > .imogi-oh-detail-summary {
			background: transparent !important;
			border: none !important;
			border-radius: 0 !important;
			box-shadow: none !important;
			margin: 0 !important;
		}
		.imogi-oh-detail-card > .imogi-oh-detail-grand {
			background: linear-gradient(145deg, #0f1f35 0%, #1a3352 100%) !important;
			border: none !important;
			border-radius: 0 !important;
			box-shadow: none !important;
			margin: 0 !important;
		}
		.imogi-oh-detail-card > .imogi-oh-detail-hero,
		.imogi-oh-detail-card > .imogi-oh-detail-meta,
		.imogi-oh-detail-card--payment > .imogi-oh-detail-block,
		.imogi-oh-detail-card--payment > .imogi-oh-detail-summary {
			border-bottom: 1px solid #e2e8f0 !important;
		}
		@media (max-width: 860px) {
			.imogi-oh-detail-dialog .modal-dialog { max-width: 720px !important; }
			.imogi-oh-detail { grid-template-columns: 1fr; }
		}
		.imogi-pos-order-surface .imogi-oh-status-filter{appearance:none;-webkit-appearance:none;background:#fff;border:1px solid #d4d4d8;border-radius:8px;color:#0f1f35;cursor:pointer;font-size:13px;font-weight:600;height:36px;min-width:140px;padding:0 12px}
		.imogi-pos-order-surface .imogi-oh-export{align-items:center;background:#0f1f35;border:1px solid #0f1f35;border-radius:8px;color:#fff;cursor:pointer;display:inline-flex;font-size:13px;font-weight:700;gap:6px;height:36px;padding:0 14px;white-space:nowrap}
		.imogi-pos-order-surface .imogi-oh-export:hover{background:#1a3352;border-color:#1a3352}
		.imogi-pos-order-surface .imogi-oh-action-btn.is-danger{border-color:#fecaca;color:#b91c1c}
		.imogi-pos-order-surface .imogi-oh-action-btn.is-danger:hover{background:#fef2f2;border-color:#b91c1c}
		.imogi-pos-order-surface .imogi-oh-action-btn.is-warning{border-color:#fde68a;color:#b45309}
		.imogi-pos-order-surface .imogi-oh-action-btn.is-warning:hover{background:#fffbeb;border-color:#b45309}
		.imogi-pos-order-surface .imogi-oh-col-action--mgmt{width:148px}
		`,
		"imogi-order-surface-css-v16"
	);
}

imogi_pos.init_order_surface = function (wrapper, config) {
	const defaults = {
		pageName: "imogi-pos-order-history",
		pageClass: "imogi-pos-order-surface imogi-pos-order-history",
		title: __("Riwayat Order"),
		surface: "history",
		isManagement: false,
		backHref: "/app/imogi-pos-cashier",
		backLabel: __("Kembali ke Kasir"),
		showLogout: true,
		shellInit: "cashier",
	};
	const cfg = { ...defaults, ...(config || {}) };
	imogi_pos.sync_desk_theme?.();
	const page = imogi_pos.page_shell.make_page(wrapper, cfg.title, cfg.pageClass);
	inject_order_surface_css();
	requestAnimationFrame(() => imogi_pos.sync_desk_theme?.());
	$(wrapper).find(".page-head").hide();
	let view_mode = "branch";
	const subtitle_for_mode = (mode) => {
		if (cfg.isManagement) return __("Kontrol, audit, dan koreksi transaksi outlet");
		if (mode === "own") return __("Transaksi yang Anda layani di outlet ini");
		if (mode === "all") return __("Semua transaksi dari semua kasir dan cabang");
		if (mode === "area") return __("Transaksi cabang dalam area Anda");
		return __("Daftar transaksi kasir di outlet ini");
	};
	const logout_btn = cfg.showLogout
		? `<button type="button" class="imogi-web-btn imogi-web-btn-ghost imogi-oh-logout-btn"><i class="fa fa-sign-out"></i> ${__(
				"Logout"
		  )}</button>`
		: "";
	const $content = imogi_pos.page_shell.render_hero(page.main, {
		title: cfg.title,
		subtitle: subtitle_for_mode(view_mode),
		actions_html: `<a class="imogi-web-btn imogi-web-btn-ghost" href="${cfg.backHref}"><i class="fa fa-arrow-left"></i> ${cfg.backLabel}</a>${logout_btn}`,
	});
	const $shell = page.main.find(".imogi-web-shell");
	if ($shell.length && cfg.shellInit === "cashier" && imogi_pos.page_shell.init_cashier_page) {
		imogi_pos.page_shell.init_cashier_page($shell, cfg.title);
	}

	const $statsHost = $(`<div class="imogi-oh-stat-grid"></div>`);
	$content.append($statsHost);

	const mgmt_toolbar = cfg.isManagement
		? `<select class="imogi-oh-status-filter" aria-label="${__("Filter status")}">
			<option value="">${__("Semua Status")}</option>
			<option value="Completed">${__("Completed")}</option>
			<option value="Paid">${__("Paid")}</option>
			<option value="Awaiting Payment">${__("Awaiting Payment")}</option>
			<option value="In Kitchen">${__("In Kitchen")}</option>
			<option value="In Service">${__("In Service")}</option>
			<option value="Cancelled">${__("Cancelled")}</option>
			<option value="Refunded">${__("Refunded")}</option>
		</select>
		<button type="button" class="imogi-oh-export"><i class="fa fa-download" aria-hidden="true"></i> ${__("Export CSV")}</button>`
		: "";

	const $panel = $(`
		<div class="imogi-web-panel">
			<div class="imogi-web-panel-head">
				<div class="imogi-web-panel-title imogi-oh-panel-title">${__("Transaksi")}</div>
				<div class="imogi-oh-toolbar">
					<div class="imogi-oh-search-wrap">
						<i class="fa fa-search imogi-oh-search-icon" aria-hidden="true"></i>
						<input type="search" class="imogi-oh-search" placeholder="${__("Cari no. order / customer...")}">
					</div>
					<div class="imogi-oh-date-wrap">
						<i class="fa fa-calendar imogi-oh-date-icon" aria-hidden="true"></i>
						<select class="imogi-oh-date-filter" aria-label="${__("Filter tanggal")}">
							<option value="">${__("Semua Tanggal")}</option>
							<option value="today" selected>${__("Hari ini")}</option>
							<option value="yesterday">${__("Kemarin")}</option>
							<option value="7days">${__("7 Hari Terakhir")}</option>
						</select>
					</div>
					<button type="button" class="imogi-oh-refresh"><i class="fa fa-refresh" aria-hidden="true"></i> ${__(
						"Muat ulang"
					)}</button>
					${mgmt_toolbar}
				</div>
			</div>
			<div class="imogi-oh-tabs" role="tablist">
				<button type="button" class="imogi-oh-tab is-active" data-tab="orders" role="tab">${__("Transaksi")}</button>
				<button type="button" class="imogi-oh-tab" data-tab="promo" role="tab">${__("Summary Promo")}</button>
				<button type="button" class="imogi-oh-tab" data-tab="products" role="tab">${__("Produk Laku")}</button>
			</div>
			<div class="imogi-web-panel-body imogi-oh-body">
				<div class="imogi-web-empty">${__("Memuat...")}</div>
			</div>
			<div class="imogi-oh-pagination-host"></div>
		</div>
	`);
	$content.append($panel);

	let current_page = 1;
	const page_size = 10;
	let total_rows = 0;
	let active_tab = "orders";

	const tab_titles = {
		orders: __("Transaksi"),
		promo: __("Summary Promo"),
		products: __("Produk Laku"),
	};

	const parse_applied_promo = (raw) => {
		if (!raw) return [];
		if (Array.isArray(raw)) return raw;
		try {
			const parsed = JSON.parse(raw);
			return Array.isArray(parsed) ? parsed : [];
		} catch (e) {
			return [];
		}
	};

	const promo_display_name = (promo) => {
		if (!promo) return "";
		const name = (promo.promo || "").trim();
		if (name) return name;
		const label = (promo.label || "").trim();
		if (!label) return "";
		const colon = label.indexOf(":");
		return colon > 0 ? label.slice(0, colon).trim() : label;
	};

	const render_promo_cell = (row) => {
		const amount = flt(row.promo_discount_amount);
		if (amount <= 0) {
			return `<span class="imogi-oh-promo-badge is-empty">—</span>`;
		}
		const promos = parse_applied_promo(row.applied_promo);
		const label = promos.length
			? promos
					.map((p) => promo_display_name(p))
					.filter(Boolean)
					.join(", ")
			: __("Promo");
		return `<span class="imogi-oh-promo-badge" title="${frappe.utils.escape_html(label)}">${frappe.utils.escape_html(
			label
		)}</span>`;
	};

	const status_class = (status) => {
		const key = String(status || "")
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");
		if (key === "completed") return "is-completed";
		if (key === "in-service") return "is-in-service";
		if (key === "in-kitchen") return "is-in-kitchen";
		if (key === "awaiting-payment" || key === "paid") return "is-paid";
		if (key === "cancelled" || key === "void" || key === "refunded") return "is-cancelled";
		return key ? `is-${key}` : "is-default";
	};

	const is_refund_feature_enabled = () => {
		const disabled = frappe.boot?.imogi_pos_disabled_features;
		if (Array.isArray(disabled)) return !disabled.includes("refund");
		return false;
	};

	const can_void_order = (row) => {
		const status = row.status || "";
		if (["Cancelled", "Refunded"].includes(status)) return false;
		if (row.pos_invoice && !["Awaiting Payment", "Draft"].includes(status)) return false;
		return true;
	};

	const can_refund_order = (row) => {
		if (!row.pos_invoice) return false;
		if (["Cancelled", "Refunded"].includes(row.status)) return false;
		if (flt(row.refunded_amount) >= flt(row.grand_total)) return false;
		return ["Paid", "Completed", "Partially Refunded"].includes(row.status);
	};

	const approval_workflow_on = () => !!cint(frappe.boot?.imogi_pos_approval_workflow_enabled);

	const prompt_supervisor_approval = (approval_type, reference_name, amount, reason, on_approved) => {
		frappe.prompt(
			[{ fieldname: "pin", fieldtype: "Password", label: __("PIN Supervisor"), reqd: 1 }],
			(values) => {
				frappe.call({
					method: "imogi_pos.api.approval_api.request_approval",
					args: {
						approval_type,
						reference_name,
						reason: reason || "",
						amount: amount || 0,
					},
					callback(req) {
						const name = (req.message || {}).name;
						frappe.call({
							method: "imogi_pos.api.approval_api.approve_with_pin",
							args: { request_name: name, pin: values.pin },
							callback() {
								on_approved(name);
							},
						});
					},
				});
			},
			__("Approval Supervisor"),
			__("Setujui")
		);
	};

	const run_order_action = (order_name, action, prompt_label, approval_type, grand_total) => {
		const api_method =
			action === "void" ? "imogi_pos.api.order.void_order" : "imogi_pos.api.order.refund_order";
		const do_call = (reason, approval_code) => {
			frappe.call({
				method: api_method,
				args: { order_name, reason: reason || undefined, approval_code: approval_code || undefined },
				freeze: true,
				callback(r) {
					if (r.exc) {
						const msg = (r._server_messages || "").toString();
						if (
							approval_type &&
							approval_workflow_on() &&
							(msg.includes("Perlu Approval") || msg.includes("approval"))
						) {
							prompt_supervisor_approval(approval_type, order_name, flt(grand_total), reason, (code) =>
								do_call(reason, code)
							);
						}
						return;
					}
					frappe.show_alert({
						message: action === "void" ? __("Order dibatalkan") : __("Refund diproses"),
						indicator: "green",
					});
					load(current_page);
				},
			});
		};
		frappe.prompt(
			[{ fieldname: "reason", fieldtype: "Small Text", label: prompt_label }],
			(values) => {
				if (approval_workflow_on()) {
					prompt_supervisor_approval(approval_type, order_name, flt(grand_total), values.reason, (code) =>
						do_call(values.reason, code)
					);
					return;
				}
				do_call(values.reason);
			},
			__("Konfirmasi"),
			__("Lanjutkan")
		);
	};

	const render_stat_card = (label, value, icon, tone, hint = "") =>
		`<div class="imogi-oh-stat-card">
			<span class="imogi-oh-stat-icon imogi-oh-stat-icon--${tone}"><i class="fa ${icon}" aria-hidden="true"></i></span>
			<div class="imogi-oh-stat-body">
				<div class="imogi-oh-stat-label">${label}</div>
				<div class="imogi-oh-stat-value">${value}</div>
				${hint ? `<div class="imogi-oh-stat-hint">${hint}</div>` : ""}
			</div>
		</div>`;

	const render_stats_html = (summary) => {
		const s = summary || {};
		return [
			render_stat_card(__("Total transaksi"), s.total_today || 0, "fa-file-text-o", "blue", __("Hari ini")),
			render_stat_card(__("Completed"), s.completed_today || 0, "fa-check-circle", "green", __("Hari ini")),
			render_stat_card(__("Dibatalkan"), s.cancelled_today || 0, "fa-ban", "red", __("Hari ini")),
			render_stat_card(__("Pendapatan hari ini"), format_currency(s.revenue_today || 0), "fa-money", "green"),
		].join("");
	};

	const date_range_for_filter = (filter) => {
		const today = frappe.datetime.get_today();
		if (filter === "today") return { from_date: today, to_date: today };
		if (filter === "yesterday") {
			const y = frappe.datetime.add_days(today, -1);
			return { from_date: y, to_date: y };
		}
		if (filter === "7days") {
			return { from_date: frappe.datetime.add_days(today, -6), to_date: today };
		}
		return {};
	};

	const api_args_base = () => {
		const search = ($panel.find(".imogi-oh-search").val() || "").trim();
		const date_filter = ($panel.find(".imogi-oh-date-filter").val() || "").trim();
		const date_args = date_range_for_filter(date_filter);
		const status_filter = cfg.isManagement ? ($panel.find(".imogi-oh-status-filter").val() || "").trim() : "";
		return { search, surface: cfg.surface, status: status_filter || undefined, ...date_args };
	};

	const render_meta_item = (label, value) =>
		`<div class="imogi-oh-detail-meta-item">
			<div class="imogi-oh-detail-meta-label">${label}</div>
			<div class="imogi-oh-detail-meta-value">${value}</div>
		</div>`;

	const promo_row_label = (promo) => {
		const name = promo_display_name(promo);
		return name ? `${__("Promo")} ${name}` : __("Promo");
	};

	const build_order_discount_rows = (order) => {
		const rows = [];
		const promo_total = flt(order.promo_discount_amount);
		const voucher = flt(order.voucher_discount_amount);
		const loyalty = flt(order.loyalty_discount_amount);
		const total_disc = flt(order.discount_amount);
		const manual = Math.max(0, total_disc - promo_total - voucher - loyalty);
		const push = (label, amount) => {
			if (flt(amount) <= 0) return;
			rows.push(
				`<div class="imogi-oh-detail-total-row is-discount"><span>${label}</span><strong>- ${format_currency(
					amount
				)}</strong></div>`
			);
		};
		const promos = parse_applied_promo(order.applied_promo);
		const promos_with_discount = promos.filter((p) => flt(p.discount) > 0);
		if (promos_with_discount.length) {
			promos_with_discount.forEach((p) => {
				push(frappe.utils.escape_html(promo_row_label(p)), p.discount);
			});
		} else if (promo_total > 0) {
			const names = promos.map((p) => promo_display_name(p)).filter(Boolean).join(", ");
			const label = names ? `${__("Promo")} ${names}` : __("Promo");
			push(frappe.utils.escape_html(label), promo_total);
		}
		push(__("Diskon"), manual);
		push(
			`${__("Voucher")}${order.voucher_code ? ` (${frappe.utils.escape_html(order.voucher_code)})` : ""}`,
			voucher
		);
		push(__("Poin loyalty"), loyalty);
		if (!rows.length && total_disc > 0) {
			push(__("Diskon"), total_disc);
		}
		return rows;
	};

	const open_order_receipt = (order_name) => {
		if (!order_name) return;
		frappe.call({
			method: "imogi_pos.api.free_tier_api.get_order_receipt_url",
			args: { order_name, surface: cfg.surface },
			callback(r) {
				const url = r.message && r.message.url;
				if (!url) {
					frappe.msgprint(__("URL struk tidak tersedia."));
					return;
				}
				const win = window.open(url, "_blank");
				if (!win) {
					frappe.msgprint({
						title: __("Pop-up diblokir"),
						indicator: "orange",
						message: __("Izinkan pop-up untuk situs ini, lalu coba cetak ulang."),
					});
				}
			},
		});
	};

	const render_order_detail_html = (order) => {
		const items = order.items || [];
		const payments = order.payments || [];
		const item_rows = items.length
			? items
					.map(
						(row) => `<tr>
							<td><span class="imogi-oh-item-name">${frappe.utils.escape_html(
								row.item_name || row.item_code || ""
							)}</span></td>
							<td>${flt(row.qty)} ${frappe.utils.escape_html(row.uom || "")}</td>
							<td>${format_currency(row.rate || 0)}</td>
							<td>${format_currency(row.amount || flt(row.rate) * flt(row.qty))}</td>
						</tr>`
					)
					.join("")
			: `<tr><td colspan="4">${__("Tidak ada item")}</td></tr>`;

		const payment_rows = payments.length
			? payments
					.map(
						(row) => `<tr>
							<td>${frappe.utils.escape_html(row.mode_of_payment || "-")}</td>
							<td>${format_currency(row.amount || 0)}</td>
						</tr>`
					)
					.join("")
			: `<tr><td colspan="2">${__("Belum ada pembayaran")}</td></tr>`;

		const discount_rows = build_order_discount_rows(order);
		const tax_rate = flt(frappe.boot?.imogi_pos_sales_tax_rate) || 11;
		const tax_rows =
			flt(order.tax_amount) > 0
				? `<div class="imogi-oh-detail-tax-block">
					<div class="imogi-oh-detail-tax-title">${__("Pajak")}</div>
					<div class="imogi-oh-detail-total-row"><span>${__("DPP")}</span><strong>${format_currency(
						order.taxable_amount || 0
					)}</strong></div>
					<div class="imogi-oh-detail-total-row is-tax"><span>${__("PPN")} ${tax_rate}%</span><strong>${format_currency(
						order.tax_amount || 0
					)}</strong></div>
				</div>`
				: "";

		const pos_invoice_html = order.pos_invoice
			? `<a class="imogi-oh-detail-link" href="/app/pos-invoice/${encodeURIComponent(order.pos_invoice)}">${frappe.utils.escape_html(
					order.pos_invoice
			  )}</a>`
			: "—";

		const status = order.status || "";
		const status_label = frappe.utils.escape_html(status || "—");

		return `<div class="imogi-oh-detail">
			<div class="imogi-oh-detail-card imogi-oh-detail-card--order">
				<div class="imogi-oh-detail-hero">
					<div>
						<div class="imogi-oh-detail-order">${frappe.utils.escape_html(order.name || "")}</div>
						<div class="imogi-oh-detail-subtitle">${frappe.datetime.str_to_user(order.creation)}</div>
					</div>
					<span class="imogi-oh-status ${status_class(status)}">${status_label}</span>
				</div>
				<div class="imogi-oh-detail-meta">
					${render_meta_item(__("Customer"), frappe.utils.escape_html(order.customer_name || order.customer || "—"))}
					${render_meta_item(__("Kasir"), frappe.utils.escape_html(order.cashier_name || order.cashier || "—"))}
					${render_meta_item(__("Tipe Order"), frappe.utils.escape_html(order.order_type || "—"))}
					${render_meta_item(__("Channel"), frappe.utils.escape_html(order.order_channel || "—"))}
					${render_meta_item(__("POS Invoice"), pos_invoice_html)}
					${render_meta_item(__("Metode Bayar"), frappe.utils.escape_html(order.payment_method || payments.map((p) => p.mode_of_payment).filter(Boolean).join(", ") || "—"))}
					${render_meta_item(__("Dibayar"), format_currency(order.paid_amount || 0))}
					${render_meta_item(__("Shift / Profile"), frappe.utils.escape_html(order.pos_profile || "—"))}
				</div>
				<div class="imogi-oh-detail-block">
					<div class="imogi-oh-detail-block-title">${__("Item")}</div>
					<div class="imogi-oh-detail-table-wrap">
						<table class="imogi-oh-detail-items">
							<thead><tr>
								<th>${__("Produk")}</th><th>${__("Qty")}</th><th>${__("Harga")}</th><th>${__("Subtotal")}</th>
							</tr></thead>
							<tbody>${item_rows}</tbody>
						</table>
					</div>
				</div>
			</div>
			<div class="imogi-oh-detail-card imogi-oh-detail-card--payment">
				<div class="imogi-oh-detail-block">
					<div class="imogi-oh-detail-block-title">${__("Pembayaran")}</div>
					<div class="imogi-oh-detail-table-wrap">
						<table class="imogi-oh-detail-items imogi-oh-detail-items--pay">
							<thead><tr><th>${__("Metode")}</th><th>${__("Jumlah")}</th></tr></thead>
							<tbody>${payment_rows}</tbody>
						</table>
					</div>
				</div>
				<div class="imogi-oh-detail-summary">
					<div class="imogi-oh-detail-total-row"><span>${__("Subtotal")}</span><strong>${format_currency(
						order.subtotal || 0
					)}</strong></div>
					${discount_rows.join("")}
					${tax_rows}
				</div>
				<div class="imogi-oh-detail-grand">
					<span>${__("Total Bayar")}</span>
					<strong>${format_currency(order.grand_total || 0)}</strong>
				</div>
			</div>
		</div>`;
	};

	const show_order_detail = (order_name) => {
		if (!order_name) return;
		frappe.call({
			method: "imogi_pos.api.free_tier_api.get_order_history_detail",
			args: { order_name, surface: cfg.surface },
			freeze: true,
			freeze_message: __("Memuat detail..."),
			callback(r) {
				if (r.exc) return;
				const order = r.message || {};
				const item_count = (order.items || []).length;
				const payment_count = (order.payments || []).length;
				const dialog = new frappe.ui.Dialog({
					title: __("Detail Transaksi"),
					size: "large",
					fields: [{ fieldtype: "HTML", options: render_order_detail_html(order) }],
					primary_action_label: __("Cetak Ulang Struk"),
					primary_action() {
						open_order_receipt(order.name);
					},
					secondary_action_label: __("Tutup"),
					secondary_action() {
						dialog.hide();
					},
				});
				if (cfg.isManagement) {
					if (can_void_order(order)) {
						dialog.add_custom_action(
							__("Void Order"),
							() => {
								dialog.hide();
								run_order_action(
									order.name,
									"void",
									__("Alasan pembatalan (opsional)"),
									"Void",
									order.grand_total
								);
							},
							"btn-danger"
						);
					}
					if (can_refund_order(order) && is_refund_feature_enabled()) {
						dialog.add_custom_action(
							__("Refund Order"),
							() => {
								dialog.hide();
								run_order_action(
									order.name,
									"refund",
									__("Alasan refund (opsional)"),
									"Refund",
									order.grand_total
								);
							},
							"btn-danger"
						);
					}
				}
				dialog.$wrapper.addClass("imogi-oh-detail-dialog");
				if (item_count + payment_count <= 12) {
					dialog.$wrapper.addClass("imogi-oh-detail-dialog--compact");
				}
				dialog.show();
				dialog.$wrapper.find(".modal-footer .btn-primary").addClass("imogi-oh-detail-print-btn");
				dialog.$wrapper.find(".modal-footer .btn-secondary").addClass("imogi-oh-detail-close-btn");
				requestAnimationFrame(() => {
					const body = dialog.$wrapper.find(".modal-body")[0];
					if (!body) return;
					if (body.scrollHeight <= body.clientHeight + 4) {
						dialog.$wrapper.addClass("imogi-oh-detail-dialog--compact");
					}
				});
			},
		});
	};

	const load_orders = (page_no = current_page) => {
		current_page = page_no;
		frappe.call({
			method: "imogi_pos.api.free_tier_api.list_order_history",
			args: { page: current_page, page_size, ...api_args_base() },
			callback(r) {
				const payload = r.message || {};
				const rows = payload.orders || [];
				total_rows = payload.total || rows.length;
				current_page = payload.page || current_page;
				view_mode = payload.view_mode || view_mode;
				page.main.find(".imogi-web-hero p").first().text(subtitle_for_mode(view_mode));
				$statsHost.html(render_stats_html(payload.summary));
				const show_branch = view_mode === "all" || view_mode === "area";
				if (!rows.length) {
					$panel.find(".imogi-oh-body").html(`<div class="imogi-web-empty">${__("Belum ada order")}</div>`);
					const pag = imogi_pos.page_shell.render_pagination(current_page, total_rows, page_size);
					$panel.find(".imogi-oh-pagination-host").html(pag.html).show();
					return;
				}
				const action_col_class = cfg.isManagement ? "imogi-oh-col-action imogi-oh-col-action--mgmt" : "imogi-oh-col-action";
				const html = [`<table class="imogi-web-table"><thead><tr>
					<th>${__("Order")}</th><th>${__("Tanggal")}</th><th>${__("Kasir")}</th><th>${__("Customer")}</th>${
					show_branch ? `<th>${__("Outlet")}</th>` : ""
				}<th>${__("Total")}</th><th>${__("Promo")}</th><th>${__("Metode Bayar")}</th><th>${__("Status")}</th><th class="${action_col_class}">${__(
					"Aksi"
				)}</th>
				</tr></thead><tbody>`];
				rows.forEach((row) => {
					const payment_label = frappe.utils.escape_html(row.payment_method || "—");
					const mgmt_actions = cfg.isManagement
						? `${can_void_order(row) ? `<button type="button" class="imogi-oh-action-btn imogi-oh-void-btn is-danger" data-order="${frappe.utils.escape_html(row.name)}" data-total="${flt(row.grand_total)}" title="${__("Void")}" aria-label="${__("Void order")}"><i class="fa fa-ban" aria-hidden="true"></i></button>` : ""}${
								can_refund_order(row) && is_refund_feature_enabled()
									? `<button type="button" class="imogi-oh-action-btn imogi-oh-refund-btn is-warning" data-order="${frappe.utils.escape_html(row.name)}" data-total="${flt(row.grand_total)}" title="${__("Refund")}" aria-label="${__("Refund order")}"><i class="fa fa-undo" aria-hidden="true"></i></button>`
									: ""
						  }`
						: "";
					html.push(`<tr>
						<td><a href="/app/riwayat-order/${encodeURIComponent(row.name)}">${frappe.utils.escape_html(row.name)}</a></td>
						<td>${frappe.datetime.str_to_user(row.creation)}</td>
						<td>${frappe.utils.escape_html(row.cashier_name || row.cashier || "-")}</td>
						<td>${frappe.utils.escape_html(row.customer_name || "-")}</td>
						${show_branch ? `<td>${frappe.utils.escape_html(row.pos_profile || "-")}</td>` : ""}
						<td>${format_currency(row.grand_total || 0)}</td>
						<td>${render_promo_cell(row)}</td>
						<td>${payment_label}</td>
						<td><span class="imogi-oh-status ${status_class(row.status)}">${frappe.utils.escape_html(row.status || "")}</span></td>
						<td class="imogi-oh-col-action">
							<button type="button" class="imogi-oh-action-btn imogi-oh-view-btn" data-order="${frappe.utils.escape_html(
								row.name
							)}" title="${__("Lihat detail")}" aria-label="${__("Lihat detail transaksi")}">
								<i class="fa fa-eye" aria-hidden="true"></i>
							</button>
							<button type="button" class="imogi-oh-action-btn imogi-oh-reprint-btn" data-order="${frappe.utils.escape_html(
								row.name
							)}" title="${__("Cetak ulang struk")}" aria-label="${__("Cetak ulang struk")}">
								<i class="fa fa-print" aria-hidden="true"></i>
							</button>
							${mgmt_actions}
						</td>
					</tr>`);
				});
				html.push("</tbody></table>");
				$panel.find(".imogi-oh-body").html(html.join(""));

				const pag = imogi_pos.page_shell.render_pagination(current_page, total_rows, page_size);
				$panel.find(".imogi-oh-pagination-host").html(pag.html).show();
			},
		});
	};

	const load_promo_summary = () => {
		frappe.call({
			method: "imogi_pos.api.free_tier_api.get_order_history_promo_summary",
			args: api_args_base(),
			callback(r) {
				const payload = r.message || {};
				const rows = payload.rows || [];
				view_mode = payload.view_mode || view_mode;
				page.main.find(".imogi-web-hero p").first().text(subtitle_for_mode(view_mode));
				const kpi = `<div class="imogi-oh-summary-kpi">
					<div class="imogi-oh-summary-kpi-card">
						<div class="imogi-oh-summary-kpi-label">${__("Transaksi pakai promo")}</div>
						<div class="imogi-oh-summary-kpi-value">${payload.order_count || 0}</div>
					</div>
					<div class="imogi-oh-summary-kpi-card">
						<div class="imogi-oh-summary-kpi-label">${__("Total diskon promo")}</div>
						<div class="imogi-oh-summary-kpi-value">${format_currency(payload.total_discount || 0)}</div>
					</div>
					<div class="imogi-oh-summary-kpi-card">
						<div class="imogi-oh-summary-kpi-label">${__("Jenis promo aktif")}</div>
						<div class="imogi-oh-summary-kpi-value">${rows.length}</div>
					</div>
				</div>`;
				if (!rows.length) {
					$panel.find(".imogi-oh-body").html(
						`${kpi}<div class="imogi-web-empty">${__("Belum ada transaksi dengan promo pada periode ini")}</div>`
					);
					$panel.find(".imogi-oh-pagination-host").hide();
					return;
				}
				const html = [
					kpi,
					`<table class="imogi-web-table"><thead><tr>
						<th>${__("Promo")}</th><th>${__("Transaksi")}</th><th>${__("Total Diskon")}</th>
					</tr></thead><tbody>`,
				];
				rows.forEach((row) => {
					html.push(`<tr>
						<td>${frappe.utils.escape_html((row.promo || row.label || "—").split(":")[0].trim())}</td>
						<td>${row.order_count || 0}</td>
						<td>${format_currency(row.total_discount || 0)}</td>
					</tr>`);
				});
				html.push("</tbody></table>");
				$panel.find(".imogi-oh-body").html(html.join(""));
				$panel.find(".imogi-oh-pagination-host").hide();
			},
		});
	};

	const load_product_sales = () => {
		frappe.call({
			method: "imogi_pos.api.free_tier_api.get_order_history_product_sales",
			args: { limit: 20, ...api_args_base() },
			callback(r) {
				const payload = r.message || {};
				const rows = payload.rows || [];
				view_mode = payload.view_mode || view_mode;
				page.main.find(".imogi-web-hero p").first().text(subtitle_for_mode(view_mode));
				const kpi = `<div class="imogi-oh-summary-kpi">
					<div class="imogi-oh-summary-kpi-card">
						<div class="imogi-oh-summary-kpi-label">${__("Produk terjual")}</div>
						<div class="imogi-oh-summary-kpi-value">${flt(payload.total_qty || 0)}</div>
					</div>
					<div class="imogi-oh-summary-kpi-card">
						<div class="imogi-oh-summary-kpi-label">${__("Omzet produk")}</div>
						<div class="imogi-oh-summary-kpi-value">${format_currency(payload.total_sales || 0)}</div>
					</div>
					<div class="imogi-oh-summary-kpi-card">
						<div class="imogi-oh-summary-kpi-label">${__("SKU unik")}</div>
						<div class="imogi-oh-summary-kpi-value">${rows.length}</div>
					</div>
				</div>`;
				if (!rows.length) {
					$panel.find(".imogi-oh-body").html(
						`${kpi}<div class="imogi-web-empty">${__("Belum ada produk terjual pada periode ini")}</div>`
					);
					$panel.find(".imogi-oh-pagination-host").hide();
					return;
				}
				const html = [
					kpi,
					`<table class="imogi-web-table"><thead><tr>
						<th>#</th><th>${__("Produk")}</th><th>${__("Qty Terjual")}</th><th>${__("Omzet")}</th><th>${__("Order")}</th>
					</tr></thead><tbody>`,
				];
				rows.forEach((row, idx) => {
					const rank_class = idx < 3 ? "is-top" : "";
					html.push(`<tr>
						<td><span class="imogi-oh-rank ${rank_class}">${idx + 1}</span></td>
						<td>
							<strong>${frappe.utils.escape_html(row.item_name || row.item_code || "—")}</strong>
							<div style="color:#94a3b8;font-size:11px;margin-top:2px">${frappe.utils.escape_html(row.item_code || "")}</div>
						</td>
						<td>${flt(row.qty)}</td>
						<td>${format_currency(row.sales || 0)}</td>
						<td>${row.order_count || 0}</td>
					</tr>`);
				});
				html.push("</tbody></table>");
				$panel.find(".imogi-oh-body").html(html.join(""));
				$panel.find(".imogi-oh-pagination-host").hide();
			},
		});
	};

	const EXPORT_FORMAT_KEY = "imogi_oh_export_format";
	const EXPORT_COLUMNS_KEY = "imogi_oh_export_columns";
	let export_column_catalog = null;

	const read_export_prefs = () => {
		let saved_columns = null;
		try {
			const raw = localStorage.getItem(EXPORT_COLUMNS_KEY);
			if (raw) saved_columns = JSON.parse(raw);
		} catch (e) {
			saved_columns = null;
		}
		const fmt = (() => {
			try {
				return localStorage.getItem(EXPORT_FORMAT_KEY) || "xlsx";
			} catch (e) {
				return "xlsx";
			}
		})();
		return { saved_columns: Array.isArray(saved_columns) ? saved_columns : null, fmt };
	};

	const open_export_dialog = (catalog) => {
		const { saved_columns, fmt } = read_export_prefs();
		const valid_keys = catalog.map((c) => c.key);
		const checked_keys = saved_columns
			? saved_columns.filter((k) => valid_keys.includes(k))
			: valid_keys;
		const checked_set = new Set(checked_keys.length ? checked_keys : valid_keys);

		const dialog = new frappe.ui.Dialog({
			title: __("Export Manajemen Order"),
			fields: [
				{
					fieldname: "file_format",
					fieldtype: "Select",
					label: __("Format File"),
					options: [
						{ label: __("Excel (.xlsx)"), value: "xlsx" },
						{ label: "CSV (.csv)", value: "csv" },
					],
					default: fmt === "csv" ? "csv" : "xlsx",
					reqd: 1,
				},
				{ fieldtype: "Section Break", label: __("Kolom yang Diekspor") },
				{
					fieldname: "columns",
					fieldtype: "MultiCheck",
					label: __("Kolom"),
					columns: 3,
					options: catalog.map((c) => ({
						label: c.label,
						value: c.key,
						checked: checked_set.has(c.key),
					})),
				},
			],
			primary_action_label: __("Download"),
			primary_action(values) {
				const cols = dialog.fields_dict.columns.get_value() || [];
				if (!cols.length) {
					frappe.msgprint(__("Pilih minimal satu kolom untuk diekspor."));
					return;
				}
				const file_format = values.file_format || "xlsx";
				try {
					localStorage.setItem(EXPORT_FORMAT_KEY, file_format);
					localStorage.setItem(EXPORT_COLUMNS_KEY, JSON.stringify(cols));
				} catch (e) {
					/* private browsing */
				}
				const args = api_args_base();
				open_url_post("/api/method/imogi_pos.api.free_tier_api.export_order_management", {
					columns: JSON.stringify(cols),
					file_format,
					search: args.search || "",
					status: args.status || "",
					from_date: args.from_date || "",
					to_date: args.to_date || "",
				});
				dialog.hide();
			},
		});

		dialog.$wrapper
			.find(".modal-header")
			.append(
				`<div style="padding:4px 16px 0;color:#94a3b8;font-size:12px">${__(
					"Mengikuti filter tanggal, status, dan pencarian yang sedang aktif."
				)}</div>`
			);
		dialog.show();
	};

	const export_orders = () => {
		if (export_column_catalog) {
			open_export_dialog(export_column_catalog);
			return;
		}
		frappe.call({
			method: "imogi_pos.api.free_tier_api.get_order_export_columns",
			freeze: true,
			freeze_message: __("Menyiapkan export..."),
			callback(r) {
				export_column_catalog = r.message || [];
				if (!export_column_catalog.length) {
					frappe.msgprint(__("Kolom export tidak tersedia."));
					return;
				}
				open_export_dialog(export_column_catalog);
			},
		});
	};

	const load = (page_no = 1) => {
		$panel.find(".imogi-oh-panel-title").text(tab_titles[active_tab] || __("Transaksi"));
		if (active_tab === "promo") {
			load_promo_summary();
			return;
		}
		if (active_tab === "products") {
			load_product_sales();
			return;
		}
		load_orders(page_no);
	};

	$panel.on("click", ".imogi-oh-view-btn", function (e) {
		e.preventDefault();
		e.stopPropagation();
		show_order_detail($(this).data("order"));
	});

	$panel.on("click", ".imogi-oh-reprint-btn", function (e) {
		e.preventDefault();
		e.stopPropagation();
		open_order_receipt($(this).data("order"));
	});

	$panel.on("click", ".imogi-oh-void-btn", function (e) {
		e.preventDefault();
		e.stopPropagation();
		run_order_action(
			$(this).data("order"),
			"void",
			__("Alasan pembatalan (opsional)"),
			"Void",
			$(this).data("total")
		);
	});

	$panel.on("click", ".imogi-oh-refund-btn", function (e) {
		e.preventDefault();
		e.stopPropagation();
		run_order_action(
			$(this).data("order"),
			"refund",
			__("Alasan refund (opsional)"),
			"Refund",
			$(this).data("total")
		);
	});

	$panel.find(".imogi-oh-refresh").on("click", () => load(1));
	$panel.on("click", ".imogi-oh-tab", function () {
		const tab = $(this).data("tab");
		if (!tab || tab === active_tab) return;
		active_tab = tab;
		$panel.find(".imogi-oh-tab").removeClass("is-active");
		$(this).addClass("is-active");
		load(1);
	});
	$panel.find(".imogi-oh-search").on(
		"input",
		frappe.utils.debounce(() => load(1), 300)
	);
	$panel.find(".imogi-oh-date-filter").on("change", () => load(1));
	if (cfg.isManagement) {
		$panel.find(".imogi-oh-status-filter").on("change", () => load(1));
		$panel.find(".imogi-oh-export").on("click", () => export_orders());
	}
	$panel.on("click", ".imogi-web-page-prev:not([disabled])", () => {
		if (active_tab !== "orders") return;
		load(current_page - 1);
	});
	$panel.on("click", ".imogi-web-page-next:not([disabled])", () => {
		if (active_tab !== "orders") return;
		load(current_page + 1);
	});
	if (cfg.showLogout) {
		page.main.find(".imogi-oh-logout-btn").on("click", () => imogi_pos.logout_cashier?.({ shift_active: true }));
	}
	load(1);
};
