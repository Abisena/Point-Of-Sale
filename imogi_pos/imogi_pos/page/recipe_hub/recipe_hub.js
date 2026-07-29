frappe.provide("imogi_pos");

function inject_recipe_hub_css() {
	for (let v = 1; v <= 8; v += 1) {
		document.getElementById(`imogi-recipe-hub-css-v${v}`)?.remove();
	}
	if (document.getElementById("imogi-recipe-hub-css-v9")) return;
	frappe.dom.set_style(
		`
		body.imogi-rh-fullscreen,
		body.imogi-rh-fullscreen .main-section,
		body.imogi-rh-fullscreen .page-container,
		body.imogi-rh-fullscreen .content.page-container,
		body.imogi-rh-fullscreen .container,
		body.imogi-rh-fullscreen .container.page-body,
		body.imogi-rh-fullscreen .row.layout-main,
		body.imogi-rh-fullscreen .layout-main,
		body.imogi-rh-fullscreen .layout-main-section-wrapper,
		body.imogi-rh-fullscreen .layout-main-section,
		body.imogi-rh-fullscreen .layout-main-section-wrapper > [class*="col-"],
		body.imogi-rh-fullscreen .page-body{
			box-sizing:border-box!important;
			margin-left:0!important;
			margin-right:0!important;
			max-width:100%!important;
			width:100%!important;
			background:#fff!important
		}
		body.imogi-rh-fullscreen .imogi-recipe-hub.layout-main-section,
		body.imogi-rh-fullscreen .imogi-recipe-hub,
		body.imogi-rh-fullscreen .imogi-web-shell-root.imogi-recipe-hub{
			max-width:100%!important;
			width:100%!important
		}
		body.imogi-rh-fullscreen .imogi-web-shell{
			margin:0!important;
			max-width:100%!important;
			padding-left:20px!important;
			padding-right:20px!important;
			width:100%!important
		}
		body.imogi-rh-fullscreen .imogi-web-content{
			max-width:100%!important;
			width:100%!important;
			overflow:visible!important
		}
		body.imogi-rh-fullscreen .layout-main-section,
		body.imogi-rh-fullscreen .imogi-recipe-hub{
			overflow:visible!important
		}
		@media (max-width:767px){
			body.imogi-rh-fullscreen .imogi-web-shell{
				padding-left:12px!important;
				padding-right:12px!important
			}
		}

		.imogi-recipe-hub.layout-main-section,
		.imogi-recipe-hub,
		.imogi-recipe-hub .page-body,
		.imogi-recipe-hub .layout-main-section-wrapper,
		.imogi-recipe-hub .imogi-web-shell,
		.imogi-recipe-hub .imogi-web-shell-root,
		.imogi-recipe-hub .imogi-web-content{background:#fff!important}
		.imogi-recipe-hub .page-head{display:none!important}
		.imogi-recipe-hub .imogi-web-hero{
			align-items:center!important;margin-bottom:14px!important;border-bottom:1px solid #e2e8f0!important;
			border-radius:0!important;box-shadow:none!important;gap:16px!important
		}
		.imogi-recipe-hub .imogi-web-hero > div:first-child{
			align-items:center;display:flex;flex:1;flex-wrap:wrap;gap:12px 20px;min-width:0
		}
		.imogi-recipe-hub .imogi-web-hero h3{margin:0!important;white-space:nowrap}
		.imogi-recipe-hub .imogi-rh-hero-search{
			background:#fff;border:1px solid #cbd5e1;border-radius:8px;flex:1;font-size:13px;
			height:36px;max-width:420px;min-width:200px;padding:0 12px
		}
		.imogi-recipe-hub .imogi-rh-hero-search:focus{border-color:#f39c12;outline:none;box-shadow:0 0 0 3px rgba(243,156,18,.15)}
		.imogi-recipe-hub .imogi-web-actions{align-items:center;display:flex;flex-wrap:wrap;gap:8px}
		.imogi-recipe-hub button.imogi-rh-tab{
			align-items:center!important;appearance:none!important;background:#fff!important;border:1px solid #cbd5e1!important;
			border-radius:6px!important;color:#475569!important;cursor:pointer!important;display:inline-flex!important;
			font-size:12px!important;font-weight:700!important;gap:5px!important;height:36px!important;line-height:1!important;
			margin:0!important;padding:0 12px!important;white-space:nowrap!important
		}
		.imogi-recipe-hub button.imogi-rh-tab.is-active{
			background:#fff7ed!important;border-color:#f39c12!important;color:#9a3412!important
		}
		.imogi-recipe-hub button.imogi-rh-tab.is-hidden{display:none!important}

		.imogi-recipe-hub .imogi-rh-filter-card{display:none!important}

		.imogi-recipe-hub .imogi-rh-stat-grid{
			display:grid;gap:10px;grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:14px
		}
		.imogi-recipe-hub .imogi-rh-stat{
			background:linear-gradient(180deg,#fff 0%,#fafafa 100%);border:1px solid #e2e8f0;border-radius:12px;
			padding:14px 16px;position:relative;overflow:hidden
		}
		.imogi-recipe-hub .imogi-rh-stat::before{
			content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:#f39c12
		}
		.imogi-recipe-hub .imogi-rh-stat--green::before{background:#10b981}
		.imogi-recipe-hub .imogi-rh-stat--blue::before{background:#3b82f6}
		.imogi-recipe-hub .imogi-rh-stat--slate::before{background:#64748b}
		.imogi-recipe-hub .imogi-rh-stat-top{align-items:center;display:flex;gap:8px;justify-content:space-between}
		.imogi-recipe-hub .imogi-rh-stat-label{color:#64748b;font-size:10px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}
		.imogi-recipe-hub .imogi-rh-stat-icon{
			align-items:center;background:#fff7ed;border-radius:8px;color:#c2410c;display:inline-flex;
			font-size:12px;height:28px;justify-content:center;width:28px
		}
		.imogi-recipe-hub .imogi-rh-stat--green .imogi-rh-stat-icon{background:#ecfdf5;color:#047857}
		.imogi-recipe-hub .imogi-rh-stat--blue .imogi-rh-stat-icon{background:#eff6ff;color:#1d4ed8}
		.imogi-recipe-hub .imogi-rh-stat--slate .imogi-rh-stat-icon{background:#f1f5f9;color:#475569}
		.imogi-recipe-hub .imogi-rh-stat-val{
			color:#0f172a;font-size:22px;font-variant-numeric:tabular-nums;font-weight:800;margin-top:8px;line-height:1.1
		}
		.imogi-recipe-hub .imogi-rh-stat-val--sm{font-size:16px}

		.imogi-recipe-hub .imogi-web-panel{
			background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;
			box-shadow:0 1px 3px rgba(15,23,42,.03)
		}
		.imogi-recipe-hub .imogi-web-panel--form,
		.imogi-recipe-hub .imogi-web-panel--form .imogi-rh-form,
		.imogi-recipe-hub .imogi-rh-body{
			overflow:visible!important
		}
		.imogi-recipe-hub .imogi-web-panel--form{
			overflow:visible!important;position:relative;z-index:5
		}
		.imogi-recipe-hub .imogi-rh-form .frappe-control,
		.imogi-recipe-hub .imogi-rh-form .awesomplete,
		.imogi-recipe-hub .imogi-rh-form .form-group{
			overflow:visible!important;position:relative;z-index:6
		}
		.imogi-recipe-hub .imogi-rh-form .awesomplete > ul{
			background:#fff!important;border:1px solid #cbd5e1!important;border-radius:8px!important;
			box-shadow:0 10px 28px rgba(15,23,42,.14)!important;max-height:240px!important;
			overflow-y:auto!important;z-index:10050!important
		}
		.imogi-recipe-hub .imogi-rh-form .awesomplete > ul > li{
			border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:12px;font-weight:600;padding:8px 12px
		}
		.imogi-recipe-hub .imogi-rh-form .awesomplete > ul > li:hover,
		.imogi-recipe-hub .imogi-rh-form .awesomplete > ul > li[aria-selected=true]{
			background:#fff7ed!important;color:#9a3412!important
		}
		.imogi-recipe-hub .imogi-web-panel + .imogi-web-panel{margin-top:12px}
		.imogi-recipe-hub .imogi-web-panel-head{
			align-items:center;background:#fafafa;border-bottom:1px solid #f1f5f9;display:flex;gap:10px;
			justify-content:space-between;padding:12px 16px
		}
		.imogi-recipe-hub .imogi-web-panel-title{color:#0f172a;font-size:13px;font-weight:800}
		.imogi-recipe-hub .imogi-rh-meta{color:#64748b;font-size:11px;font-weight:600}
		.imogi-recipe-hub .imogi-rh-table-wrap{overflow-x:auto}
		.imogi-recipe-hub .imogi-rh-table{width:100%;border-collapse:collapse}
		.imogi-recipe-hub .imogi-rh-table th{
			background:#fafafa;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:10px;font-weight:800;
			letter-spacing:.04em;padding:11px 14px;text-align:left;text-transform:uppercase;white-space:nowrap
		}
		.imogi-recipe-hub .imogi-rh-table td{
			border-bottom:1px solid #f1f5f9;color:#334155;font-size:12px;padding:12px 14px;vertical-align:middle
		}
		.imogi-recipe-hub .imogi-rh-table tbody tr:hover td{background:#fffbeb}
		.imogi-recipe-hub .imogi-rh-name{color:#0f172a;font-weight:800}
		.imogi-recipe-hub .imogi-rh-sub{color:#64748b;font-size:11px;font-weight:600;margin-top:2px}
		.imogi-recipe-hub .imogi-rh-num{font-variant-numeric:tabular-nums;font-weight:700;white-space:nowrap}
		.imogi-recipe-hub .imogi-rh-badge{
			align-items:center;border-radius:999px;display:inline-flex;font-size:10px;font-weight:800;
			padding:3px 8px;text-transform:uppercase
		}
		.imogi-recipe-hub .imogi-rh-badge--ok{background:#ecfdf5;border:1px solid #a7f3d0;color:#047857}
		.imogi-recipe-hub .imogi-rh-badge--draft{background:#fff7ed;border:1px solid #fed7aa;color:#c2410c}
		.imogi-recipe-hub .imogi-rh-badge--muted{background:#f8fafc;border:1px solid #e2e8f0;color:#64748b}
		.imogi-recipe-hub .imogi-rh-badge--default{background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;margin-left:6px}
		.imogi-recipe-hub .imogi-rh-empty{
			align-items:center;color:#94a3b8;display:flex;flex-direction:column;font-size:13px;gap:8px;
			justify-content:center;min-height:200px;padding:32px;text-align:center
		}
		.imogi-recipe-hub .imogi-rh-actions{align-items:center;display:flex;flex-wrap:wrap;gap:6px}
		.imogi-recipe-hub button.imogi-rh-mini,
		.imogi-recipe-hub a.imogi-rh-mini{
			align-items:center!important;appearance:none!important;background:#fff!important;border:1px solid #cbd5e1!important;
			border-radius:6px!important;color:#334155!important;cursor:pointer!important;display:inline-flex!important;
			font-size:11px!important;font-weight:700!important;height:28px!important;line-height:28px!important;
			margin:0!important;padding:0 9px!important;text-decoration:none!important
		}
		.imogi-recipe-hub button.imogi-rh-mini:hover,
		.imogi-recipe-hub a.imogi-rh-mini:hover{border-color:#f39c12!important;color:#9a3412!important}
		.imogi-recipe-hub .imogi-rh-check{accent-color:#ea580c;cursor:pointer;height:16px;margin:0;width:16px}
		.imogi-recipe-hub .imogi-rh-check:disabled{cursor:not-allowed;opacity:.35}
		.imogi-recipe-hub .imogi-rh-bulk{
			align-items:center;background:#fff7ed;border-bottom:1px solid #fed7aa;display:flex;flex-wrap:wrap;
			gap:10px;justify-content:space-between;padding:10px 14px
		}
		.imogi-recipe-hub .imogi-rh-bulk-meta{color:#9a3412;font-size:12px;font-weight:700}
		.imogi-recipe-hub button.imogi-rh-bulk-btn{
			align-items:center;appearance:none;background:#ea580c;border:none;border-radius:8px;color:#fff!important;
			cursor:pointer;display:inline-flex;font-size:12px;font-weight:700;gap:6px;height:34px;padding:0 14px
		}
		.imogi-recipe-hub button.imogi-rh-bulk-btn:disabled{cursor:not-allowed;opacity:.45}
		.imogi-recipe-hub button.imogi-rh-bulk-btn--ghost{
			background:#fff;border:1px solid #fdba74;color:#9a3412!important
		}
		.imogi-recipe-hub .imogi-rh-portion-input{
			background:#fff;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;font-variant-numeric:tabular-nums;
			font-weight:700;height:32px;padding:0 8px;width:110px
		}
		.imogi-recipe-hub .imogi-rh-portion-input:disabled{background:#f8fafc;color:#94a3b8}
		.imogi-recipe-hub .imogi-rh-form{
			align-items:end;display:grid;gap:12px;grid-template-columns:1.2fr 1.2fr auto;padding:14px 16px
		}
		.imogi-recipe-hub .imogi-rh-form .frappe-control{margin-bottom:0!important}
		.imogi-recipe-hub .imogi-rh-form label,
		.imogi-recipe-hub .imogi-rh-form .control-label{
			color:#64748b!important;font-size:10px!important;font-weight:700!important;letter-spacing:.04em;
			margin-bottom:4px!important;text-transform:uppercase!important
		}
		.imogi-recipe-hub .imogi-rh-form input.input-with-feedback,
		.imogi-recipe-hub .imogi-rh-form .form-control{
			border:1px solid #cbd5e1!important;border-radius:6px!important;height:36px!important
		}
		.imogi-recipe-hub button.imogi-rh-add-sub{
			align-items:center!important;background:linear-gradient(135deg,#f5b041,#f39c12)!important;border:none!important;
			border-radius:6px!important;color:#fff!important;cursor:pointer!important;display:inline-flex!important;
			font-size:12px!important;font-weight:700!important;gap:5px!important;height:36px!important;padding:0 14px!important
		}
		.imogi-recipe-hub .imogi-rh-twoway{
			align-items:center;color:#475569;display:inline-flex;font-size:12px;font-weight:600;gap:6px;margin-right:8px
		}
		.imogi-recipe-hub .imogi-web-pagination{
			align-items:center;border-top:1px solid #f1f5f9;display:flex;flex-wrap:wrap;gap:10px;
			justify-content:space-between;padding:12px 16px
		}
		.imogi-recipe-hub .imogi-web-pagination-info{color:#64748b;font-size:12px;font-weight:600}
		.imogi-recipe-hub .imogi-web-pagination-controls{align-items:center;display:flex;gap:8px}
		.imogi-recipe-hub .imogi-web-pagination-page{color:#475569;font-size:12px;font-variant-numeric:tabular-nums;font-weight:700}

		.imogi-rh-detail-dialog .imogi-rh-badge{
			align-items:center;border-radius:999px;display:inline-flex;font-size:10px;font-weight:800;
			padding:3px 8px;text-transform:uppercase
		}
		.imogi-rh-detail-dialog .imogi-rh-badge--ok{background:#ecfdf5;border:1px solid #a7f3d0;color:#047857}
		.imogi-rh-detail-dialog .imogi-rh-badge--draft{background:#fff7ed;border:1px solid #fed7aa;color:#c2410c}
		.imogi-rh-detail-dialog .imogi-rh-badge--default{background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8}
		.imogi-rh-detail-dialog .imogi-rh-num{font-variant-numeric:tabular-nums;font-weight:700;white-space:nowrap}
		.imogi-rh-detail-dialog .modal-content{border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 18px 50px rgba(15,23,42,.18)}
		.imogi-rh-detail-dialog .modal-header{background:#fafafa;border-bottom:1px solid #e2e8f0;padding:14px 18px}
		.imogi-rh-detail-dialog .modal-title{color:#0f172a;font-size:15px;font-weight:800}
		.imogi-rh-detail-dialog .modal-body{padding:16px 18px 18px!important}
		.imogi-rh-detail-dialog .imogi-rh-detail{
			display:flex;flex-direction:column;gap:14px
		}
		.imogi-rh-detail-dialog .imogi-rh-detail-head{
			align-items:flex-start;display:flex;flex-wrap:wrap;gap:10px 14px;justify-content:space-between
		}
		.imogi-rh-detail-dialog .imogi-rh-detail-title{color:#0f172a;font-size:16px;font-weight:800;line-height:1.25;margin:0}
		.imogi-rh-detail-dialog .imogi-rh-detail-code{color:#64748b;font-size:12px;font-weight:600;margin-top:3px}
		.imogi-rh-detail-dialog .imogi-rh-detail-kpis{
			display:grid;gap:8px;grid-template-columns:repeat(3,minmax(0,1fr))
		}
		.imogi-rh-detail-dialog .imogi-rh-detail-kpi{
			background:linear-gradient(180deg,#fff,#fafafa);border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px
		}
		.imogi-rh-detail-dialog .imogi-rh-detail-kpi-label{
			color:#64748b;font-size:10px;font-weight:800;letter-spacing:.04em;text-transform:uppercase
		}
		.imogi-rh-detail-dialog .imogi-rh-detail-kpi-val{
			color:#0f172a;font-size:15px;font-variant-numeric:tabular-nums;font-weight:800;margin-top:4px
		}
		.imogi-rh-detail-dialog .imogi-rh-detail-kpi--accent{border-color:#fed7aa;background:linear-gradient(180deg,#fff7ed,#fff)}
		.imogi-rh-detail-dialog .imogi-rh-detail-kpi--accent .imogi-rh-detail-kpi-val{color:#c2410c}
		.imogi-rh-detail-dialog .imogi-rh-detail-panel{
			background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden
		}
		.imogi-rh-detail-dialog .imogi-rh-detail-panel-head{
			align-items:center;background:#fafafa;border-bottom:1px solid #f1f5f9;display:flex;
			justify-content:space-between;padding:10px 12px
		}
		.imogi-rh-detail-dialog .imogi-rh-detail-panel-title{color:#0f172a;font-size:12px;font-weight:800}
		.imogi-rh-detail-dialog .imogi-rh-detail-panel-meta{color:#64748b;font-size:11px;font-weight:600}
		.imogi-rh-detail-dialog .imogi-rh-detail-table{width:100%;border-collapse:collapse}
		.imogi-rh-detail-dialog .imogi-rh-detail-table th{
			background:#fafafa;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:10px;font-weight:800;
			letter-spacing:.04em;padding:10px 12px;text-align:left;text-transform:uppercase;white-space:nowrap
		}
		.imogi-rh-detail-dialog .imogi-rh-detail-table th.imogi-rh-num,
		.imogi-rh-detail-dialog .imogi-rh-detail-table td.imogi-rh-num{text-align:right}
		.imogi-rh-detail-dialog .imogi-rh-detail-table td{
			border-bottom:1px solid #f1f5f9;color:#334155;font-size:12px;padding:11px 12px;vertical-align:middle
		}
		.imogi-rh-detail-dialog .imogi-rh-detail-table tbody tr:last-child td{border-bottom:none}
		.imogi-rh-detail-dialog .imogi-rh-detail-table tbody tr:hover td{background:#fffbeb}
		.imogi-rh-detail-dialog .imogi-rh-detail-ing{color:#0f172a;font-weight:700}
		.imogi-rh-detail-dialog .imogi-rh-detail-ing-code{color:#94a3b8;font-size:11px;font-weight:600;margin-top:2px}
		.imogi-rh-detail-dialog .imogi-rh-detail-foot{
			align-items:center;background:#fafafa;border-top:1px solid #e2e8f0;display:flex;flex-wrap:wrap;
			gap:10px;justify-content:space-between;padding:12px
		}
		.imogi-rh-detail-dialog .imogi-rh-detail-total-label{color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase}
		.imogi-rh-detail-dialog .imogi-rh-detail-total-val{color:#0f172a;font-size:16px;font-variant-numeric:tabular-nums;font-weight:800}
		.imogi-rh-detail-dialog .imogi-rh-detail-actions{align-items:center;display:flex;gap:8px}
		.imogi-rh-detail-dialog a.imogi-rh-detail-btn,
		.imogi-rh-detail-dialog button.imogi-rh-detail-btn{
			align-items:center;appearance:none;background:#fff;border:1px solid #cbd5e1;border-radius:8px;color:#334155;
			cursor:pointer;display:inline-flex;font-size:12px;font-weight:700;gap:6px;height:34px;padding:0 12px;text-decoration:none
		}
		.imogi-rh-detail-dialog a.imogi-rh-detail-btn:hover,
		.imogi-rh-detail-dialog button.imogi-rh-detail-btn:hover{border-color:#f39c12;color:#9a3412}
		.imogi-rh-detail-dialog a.imogi-rh-detail-btn--primary,
		.imogi-rh-detail-dialog button.imogi-rh-detail-btn--primary{
			background:linear-gradient(135deg,#f5b041,#f39c12);border:none;color:#fff
		}
		.imogi-rh-detail-dialog a.imogi-rh-detail-btn--primary:hover,
		.imogi-rh-detail-dialog button.imogi-rh-detail-btn--primary:hover{color:#fff;filter:brightness(.97)}
		.imogi-rh-detail-dialog .imogi-rh-detail-empty{
			align-items:center;color:#94a3b8;display:flex;flex-direction:column;font-size:13px;gap:8px;
			justify-content:center;min-height:120px;padding:24px;text-align:center
		}
		@media (max-width:640px){
			.imogi-rh-detail-dialog .imogi-rh-detail-kpis{grid-template-columns:1fr}
		}

		@media (max-width:1100px){
			.imogi-recipe-hub .imogi-rh-filter-head{flex-wrap:wrap}
			.imogi-recipe-hub .imogi-rh-filter-left{flex-wrap:wrap}
			.imogi-recipe-hub .imogi-rh-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
		}
		@media (max-width:767px){
			.imogi-recipe-hub .imogi-rh-filter-head{align-items:flex-start;flex-direction:column}
			.imogi-recipe-hub .imogi-rh-filter-left{flex-direction:column;align-items:stretch;width:100%}
			.imogi-recipe-hub .imogi-rh-tabs{flex-wrap:wrap}
			.imogi-recipe-hub .imogi-rh-filter-controls{margin-left:0;width:100%}
			.imogi-recipe-hub .imogi-rh-search{flex:1;min-width:0;width:100%}
			.imogi-recipe-hub .imogi-rh-form{grid-template-columns:1fr}
			.imogi-recipe-hub .imogi-rh-stat-grid{grid-template-columns:1fr 1fr}
		}
		`,
		"imogi-recipe-hub-css-v9"
	);
}

function activate_recipe_hub_fullscreen() {
	document.body.classList.add("imogi-rh-fullscreen");
	if (!window.__imogi_rh_fullscreen_bound) {
		window.__imogi_rh_fullscreen_bound = true;
		$(document).on("page-change.imogi-rh-fs", () => {
			const route = (frappe.get_route_str && frappe.get_route_str()) || "";
			if (route.indexOf("recipe-hub") === -1) {
				document.body.classList.remove("imogi-rh-fullscreen");
			} else {
				document.body.classList.add("imogi-rh-fullscreen");
			}
		});
	}
}

frappe.pages["recipe-hub"].on_page_load = function (wrapper) {
	inject_recipe_hub_css();
	activate_recipe_hub_fullscreen();
	if (!imogi_pos.page_shell?.make_page) {
		frappe.msgprint(__("IMOGI page shell belum dimuat. Muat ulang halaman (Ctrl+Shift+R)."));
		return;
	}
	imogi_pos.RecipeHub = new imogi_pos.RecipeHubView(wrapper);
};

frappe.pages["recipe-hub"].on_page_show = function () {
	inject_recipe_hub_css();
	activate_recipe_hub_fullscreen();
	if (imogi_pos.RecipeHub) {
		const route = frappe.get_route() || [];
		const tab = (route[1] || frappe.route_options?.tab || "").toString();
		if (tab && tab !== imogi_pos.RecipeHub.tab) {
			imogi_pos.RecipeHub.set_tab(tab, true);
		} else {
			imogi_pos.RecipeHub.refresh({ quiet: true, keep_page: true });
		}
		imogi_pos.RecipeHub.start_auto_refresh();
	}
};

imogi_pos.RecipeHubView = class RecipeHubView {
	constructor(wrapper) {
		this.wrapper = $(wrapper);
		this.tab = "recipes";
		this.page_size = 10;
		this.page = 1;
		this.search = "";
		this.recipes = [];
		this.food_cost = null;
		this.can_view_cost = !!(
			frappe.boot && frappe.boot.imogi_pos_can_view_recipe_cost
		);
		this.recipe_summary = null;
		this.substitutes = [];
		this.versions = [];
		this.selected = new Set();
		this._poll_timer = null;
		this.make();
		const route = frappe.get_route() || [];
		const tab = (route[1] || frappe.route_options?.tab || "recipes").toString();
		this.set_tab(tab, true);
		this.start_auto_refresh();
	}

	make() {
		const page = imogi_pos.page_shell.make_page(
			this.wrapper.get(0),
			__("Recipe Hub"),
			"imogi-recipe-hub"
		);
		this.wrapper.find(".page-head").hide();

		// Keep hidden tabs in code for easy unhide later.
		const TABS = [
			{ id: "recipes", label: __("Resep"), icon: "fa-cutlery", hidden: false },
			{ id: "portion", label: __("Porsi"), icon: "fa-balance-scale", hidden: true },
			{ id: "food_cost", label: __("Food Cost"), icon: "fa-pie-chart", hidden: true },
			{ id: "substitutes", label: __("Substitusi"), icon: "fa-exchange", hidden: true },
			{ id: "versions", label: __("Versi"), icon: "fa-history", hidden: true },
		];
		this.tabs = TABS;

		const tab_actions = TABS.map(
			(t) =>
				`<button type="button" class="imogi-rh-tab${t.hidden ? " is-hidden" : ""}${
					t.id === "recipes" ? " is-active" : ""
				}" data-tab="${t.id}"><i class="fa ${t.icon}"></i><span>${t.label}</span></button>`
		).join("");

		const $content = imogi_pos.page_shell.render_hero(page.main, {
			title: __("Recipe Hub"),
			actions_html: `
				${tab_actions}
				<a class="imogi-web-btn imogi-web-btn-ghost" href="/app/imogi-pos-settings"><i class="fa fa-upload"></i> ${__(
					"Import Resep"
				)}</a>
			`,
		});
		this.$content = $content;
		const $shell = $content.closest(".imogi-web-shell");
		if (typeof imogi_pos.page_shell.init_owner_page === "function") {
			imogi_pos.page_shell.init_owner_page($shell, __("Recipe Hub"));
		}

		const $hero_left = $shell.find(".imogi-web-hero > div").first();
		$hero_left.append(
			`<input type="search" class="imogi-rh-hero-search" placeholder="${__(
				"Cari resep / bahan..."
			)}">`
		);

		$content.append(`
			<div class="imogi-rh-stats"></div>
			<div class="imogi-rh-body"><div class="imogi-rh-empty">${__("Memuat...")}</div></div>
		`);

		$shell.find(".imogi-rh-tab").on("click", (e) => {
			this.set_tab($(e.currentTarget).data("tab"));
		});
		$shell.find(".imogi-rh-hero-search").on("input change keydown", (e) => {
			if (e.type === "keydown" && e.which !== 13) return;
			const next = ($(e.currentTarget).val() || "").trim();
			if (e.type === "input" && next === this.search) return;
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
			if (route.indexOf("recipe-hub") === -1) return;
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
		const requested = allowed.includes(tab) ? tab : "recipes";
		const meta = this.tabs.find((t) => t.id === requested);
		// Hidden tabs stay reachable later; for now force visible recipes unless explicitly unhidden.
		this.tab = meta && meta.hidden ? "recipes" : requested;
		this.page = 1;
		const $shell = this.$content.closest(".imogi-web-shell");
		$shell.find(".imogi-rh-tab").removeClass("is-active");
		$shell.find(`.imogi-rh-tab[data-tab="${this.tab}"]`).addClass("is-active");
		if (!silent) {
			frappe.set_route("recipe-hub", this.tab);
		}
		this.refresh();
	}

	money(v) {
		return format_currency(flt(v) || 0);
	}

	refresh(opts = {}) {
		const quiet = !!opts.quiet;
		const keep_page = !!opts.keep_page;
		const $body = this.$content.find(".imogi-rh-body");
		if (!quiet) {
			$body.html(`<div class="imogi-rh-empty">${__("Memuat...")}</div>`);
		}

		if (this.tab === "recipes" || this.tab === "portion") {
			const load_food = this.can_view_cost;
			let pending = load_food ? 2 : 1;
			let recipes_data = null;
			let food_data = null;
			const done = () => {
				pending -= 1;
				if (pending > 0) return;
				if (recipes_data) {
					this.recipes = recipes_data.rows || [];
					this.recipe_summary = recipes_data.summary || null;
					if (typeof recipes_data.can_view_cost === "boolean") {
						this.can_view_cost = recipes_data.can_view_cost;
					}
				}
				if (food_data) {
					this.food_cost = food_data;
				}
				this.render_recipe_stats();
				if (!keep_page && !quiet) this.page = 1;
				if (this.tab === "portion") this.render_portion();
				else this.render_recipes();
			};

			frappe.call({
				method: "imogi_pos.api.planned_features_api.list_recipes_api",
				args: { search: this.search || undefined, limit: 300 },
				callback: (r) => {
					if (r.exc) {
						if (!quiet) {
							$body.html(`<div class="imogi-rh-empty">${__("Gagal memuat resep.")}</div>`);
						}
						recipes_data = { rows: this.recipes || [] };
						done();
						return;
					}
					recipes_data = r.message || {};
					done();
				},
			});
			if (load_food) {
				frappe.call({
					method: "imogi_pos.api.planned_features_api.get_recipe_food_cost_api",
					callback: (r) => {
						food_data = r.exc ? this.food_cost || {} : r.message || {};
						done();
					},
				});
			}
			return;
		}

		if (this.tab === "food_cost") {
			frappe.call({
				method: "imogi_pos.api.planned_features_api.get_recipe_food_cost_api",
				callback: (r) => {
					if (r.exc) {
						$body.html(`<div class="imogi-rh-empty">${__("Gagal memuat food cost.")}</div>`);
						return;
					}
					this.food_cost = r.message || {};
					this.render_food_cost();
				},
			});
			return;
		}

		if (this.tab === "substitutes") {
			frappe.call({
				method: "imogi_pos.api.planned_features_api.list_ingredient_substitutes_api",
				args: { search: this.search || undefined },
				callback: (r) => {
					if (r.exc) {
						$body.html(`<div class="imogi-rh-empty">${__("Gagal memuat substitusi.")}</div>`);
						return;
					}
					const data = r.message || {};
					this.substitutes = data.rows || [];
					this.render_substitutes();
				},
			});
			return;
		}

		if (this.tab === "versions") {
			frappe.call({
				method: "imogi_pos.api.planned_features_api.get_recipe_versions_api",
				args: { limit: 100 },
				callback: (r) => {
					if (r.exc) {
						$body.html(
							`<div class="imogi-rh-empty"><i class="fa fa-lock" style="font-size:22px;opacity:.35"></i>${__(
								"Histori versi butuh paket Enterprise, atau gagal memuat data."
							)}</div>`
						);
						return;
					}
					const data = r.message || {};
					this.versions = data.rows || [];
					this.render_versions();
				},
			});
		}
	}

	stat_card(label, value, icon, tone, small) {
		return `
			<div class="imogi-rh-stat${tone ? ` imogi-rh-stat--${tone}` : ""}">
				<div class="imogi-rh-stat-top">
					<span class="imogi-rh-stat-label">${label}</span>
					<span class="imogi-rh-stat-icon"><i class="fa ${icon}"></i></span>
				</div>
				<div class="imogi-rh-stat-val${small ? " imogi-rh-stat-val--sm" : ""}">${value}</div>
			</div>
		`;
	}

	render_recipe_stats() {
		const $stats = this.$content.find(".imogi-rh-stats");
		if (!this.can_view_cost) {
			const s = this.recipe_summary || {};
			$stats.html(`
				<div class="imogi-rh-stat-grid">
					${this.stat_card(__("Total Resep"), cint(s.recipes), "fa-cutlery")}
					${this.stat_card(__("Default"), cint(s.default_recipes), "fa-star", "blue")}
					${this.stat_card(__("Submitted"), cint(s.submitted), "fa-check", "green")}
					${this.stat_card(__("Draft"), cint(s.draft), "fa-pencil", "slate")}
				</div>
			`);
			return;
		}
		const fc = this.food_cost || {};
		$stats.html(`
			<div class="imogi-rh-stat-grid">
				${this.stat_card(__("Sales"), this.money(fc.sales), "fa-line-chart", "blue", true)}
				${this.stat_card(__("Food Cost"), this.money(fc.food_cost), "fa-shopping-basket", "", true)}
				${this.stat_card(__("Margin"), this.money(fc.margin), "fa-trophy", "green", true)}
				${this.stat_card(
					__("Food Cost %"),
					`${Number(fc.food_cost_percent || 0).toFixed(1)}%`,
					"fa-percent",
					"slate"
				)}
			</div>
		`);
	}

	render_stats(summary) {
		this.render_recipe_stats();
	}

	paginate(rows) {
		const total = rows.length;
		const pager = imogi_pos.page_shell.render_pagination(this.page, total, this.page_size);
		this.page = pager.page;
		const start = (this.page - 1) * this.page_size;
		return {
			page_rows: rows.slice(start, start + this.page_size),
			pager,
			total,
		};
	}

	bind_pager($root, total) {
		$root.find(".imogi-web-page-prev").on("click", () => {
			if (this.page <= 1) return;
			this.page -= 1;
			this.rerender_current();
		});
		$root.find(".imogi-web-page-next").on("click", () => {
			const max_page = Math.max(1, Math.ceil(total / this.page_size));
			if (this.page >= max_page) return;
			this.page += 1;
			this.rerender_current();
		});
	}

	rerender_current() {
		if (this.tab === "recipes") this.render_recipes();
		else if (this.tab === "portion") this.render_portion();
		else if (this.tab === "substitutes") this.render_substitutes();
		else if (this.tab === "versions") this.render_versions();
		else if (this.tab === "food_cost") this.render_food_cost();
	}

	status_badge(row) {
		if (cint(row.docstatus) === 1) {
			return `<span class="imogi-rh-badge imogi-rh-badge--ok">${__("Submitted")}</span>`;
		}
		return `<span class="imogi-rh-badge imogi-rh-badge--draft">${__("Draft")}</span>`;
	}

	render_recipes() {
		const $body = this.$content.find(".imogi-rh-body");
		const { page_rows, pager, total } = this.paginate(this.recipes);
		if (!this.recipes.length) {
			this.selected.clear();
			$body.html(`
				<div class="imogi-web-panel">
					<div class="imogi-rh-empty">
						<i class="fa fa-book" style="font-size:28px;opacity:.3"></i>
						${__("Belum ada resep. Buat BOM atau import resep dari Settings.")}
					</div>
				</div>
			`);
			return;
		}

		const draft_rows = this.recipes.filter((r) => cint(r.docstatus) === 0);
		const selected_drafts = [...this.selected].filter((name) =>
			this.recipes.some((r) => r.name === name && cint(r.docstatus) === 0)
		);
		this.selected = new Set(selected_drafts);
		const page_drafts = page_rows.filter((r) => cint(r.docstatus) === 0);
		const all_page_checked =
			page_drafts.length > 0 && page_drafts.every((r) => this.selected.has(r.name));

		$body.html(`
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Daftar Resep")}</div>
					<span class="imogi-rh-meta">${total} ${__("resep")} · ${draft_rows.length} ${__("draft")}</span>
				</div>
				${
					draft_rows.length
						? `<div class="imogi-rh-bulk">
					<span class="imogi-rh-bulk-meta">${
						selected_drafts.length
							? __("{0} resep dipilih", [selected_drafts.length])
							: __("Centang resep Draft untuk submit massal")
					}</span>
					<div style="display:flex;gap:8px;flex-wrap:wrap">
						<button type="button" class="imogi-rh-bulk-btn imogi-rh-bulk-btn--ghost imogi-rh-select-drafts">${__(
							"Pilih semua draft"
						)}</button>
						<button type="button" class="imogi-rh-bulk-btn imogi-rh-submit-selected" ${
							selected_drafts.length ? "" : "disabled"
						}>
							<i class="fa fa-check"></i> ${__("Submit terpilih")} (${selected_drafts.length})
						</button>
					</div>
				</div>`
						: ""
				}
				<div class="imogi-rh-table-wrap">
					<table class="imogi-rh-table">
						<thead>
							<tr>
								<th style="width:36px">
									<input type="checkbox" class="imogi-rh-check imogi-rh-check-all" ${
										all_page_checked ? "checked" : ""
									} ${page_drafts.length ? "" : "disabled"} title="${__("Pilih draft di halaman ini")}">
								</th>
								<th>${__("Menu")}</th>
								<th>${__("Porsi")}</th>
								<th>${__("Bahan")}</th>
								${
									this.can_view_cost
										? `<th title="${__(
												"Total cost bahan untuk yield BOM"
										  )}">${__("Cost Bahan")}</th>
								<th title="${__("Cost Bahan ÷ qty porsi")}">${__("Cost / Porsi")}</th>`
										: ""
								}
								<th>${__("Status")}</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							${page_rows
								.map((row) => {
									const is_draft = cint(row.docstatus) === 0;
									const checked = this.selected.has(row.name);
									return `<tr>
										<td>
											<input type="checkbox" class="imogi-rh-check imogi-rh-row-check" data-bom="${frappe.utils.escape_html(
												row.name
											)}" ${is_draft ? "" : "disabled"} ${checked ? "checked" : ""}>
										</td>
										<td>
											<div class="imogi-rh-name">${frappe.utils.escape_html(row.item_name || row.item)}${
										row.is_default
											? `<span class="imogi-rh-badge imogi-rh-badge--default">${__(
													"Default"
											  )}</span>`
											: ""
									}</div>
											<div class="imogi-rh-sub">${frappe.utils.escape_html(row.name)}</div>
										</td>
										<td class="imogi-rh-num">${flt(row.portion_qty)} ${frappe.utils.escape_html(row.uom || "")}</td>
										<td class="imogi-rh-num">${cint(row.ingredient_count)}</td>
										${
											this.can_view_cost
												? `<td class="imogi-rh-num">${this.money(row.raw_material_cost)}</td>
										<td class="imogi-rh-num">${this.money(row.cost_per_portion)}</td>`
												: ""
										}
										<td>${this.status_badge(row)}</td>
										<td>
											<div class="imogi-rh-actions">
												<button type="button" class="imogi-rh-mini imogi-rh-open" data-bom="${frappe.utils.escape_html(
													row.name
												)}">${__("Detail")}</button>
												<button type="button" class="imogi-rh-mini imogi-rh-edit" data-bom="${frappe.utils.escape_html(
													row.name
												)}" data-docstatus="${cint(row.docstatus)}">${__("Edit")}</button>
											</div>
										</td>
									</tr>`;
								})
								.join("")}
						</tbody>
					</table>
				</div>
				${pager.html}
			</div>
		`);
		this.bind_pager($body, total);
		$body.find(".imogi-rh-open").on("click", (e) => {
			this.open_detail($(e.currentTarget).data("bom"));
		});
		$body.find(".imogi-rh-edit").on("click", (e) => {
			this.open_edit($(e.currentTarget).data("bom"), cint($(e.currentTarget).data("docstatus")));
		});
		$body.find(".imogi-rh-row-check").on("change", (e) => {
			const name = $(e.currentTarget).data("bom");
			if (e.currentTarget.checked) this.selected.add(name);
			else this.selected.delete(name);
			this.update_bulk_bar($body);
		});
		$body.find(".imogi-rh-check-all").on("change", (e) => {
			const on = !!e.currentTarget.checked;
			page_drafts.forEach((r) => {
				if (on) this.selected.add(r.name);
				else this.selected.delete(r.name);
			});
			$body.find(".imogi-rh-row-check:not(:disabled)").prop("checked", on);
			this.update_bulk_bar($body);
		});
		$body.find(".imogi-rh-select-drafts").on("click", () => {
			draft_rows.forEach((r) => this.selected.add(r.name));
			$body.find(".imogi-rh-row-check:not(:disabled)").prop("checked", true);
			$body.find(".imogi-rh-check-all").prop("checked", page_drafts.length > 0);
			this.update_bulk_bar($body);
		});
		$body.find(".imogi-rh-submit-selected").on("click", () => this.submit_selected());
	}

	update_bulk_bar($body) {
		const selected_drafts = [...this.selected].filter((name) =>
			this.recipes.some((r) => r.name === name && cint(r.docstatus) === 0)
		);
		this.selected = new Set(selected_drafts);
		const $meta = $body.find(".imogi-rh-bulk-meta");
		if ($meta.length) {
			$meta.text(
				selected_drafts.length
					? __("{0} resep dipilih", [selected_drafts.length])
					: __("Centang resep Draft untuk submit massal")
			);
		}
		const $btn = $body.find(".imogi-rh-submit-selected");
		$btn.prop("disabled", !selected_drafts.length);
		$btn.html(
			`<i class="fa fa-check"></i> ${__("Submit terpilih")} (${selected_drafts.length})`
		);
	}

	open_edit(bom, docstatus) {
		if (!bom) return;
		if (cint(docstatus) === 1) {
			frappe.confirm(
				__(
					"Resep sudah Submitted. Form terbuka mode lihat. Batalkan submit di form BOM jika ingin mengubah bahan."
				),
				() => this.navigate_bom(bom)
			);
			return;
		}
		this.navigate_bom(bom);
	}

	navigate_bom(bom) {
		document.body.classList.remove("imogi-rh-fullscreen");
		frappe.set_route("Form", "BOM", bom);
	}

	submit_selected() {
		const names = [...this.selected].filter((name) =>
			this.recipes.some((r) => r.name === name && cint(r.docstatus) === 0)
		);
		if (!names.length) {
			frappe.msgprint(__("Pilih minimal satu resep Draft."));
			return;
		}
		frappe.confirm(__("Submit {0} resep draft sekarang?", [names.length]), () => {
			frappe.call({
				method: "imogi_pos.api.planned_features_api.submit_recipes_api",
				args: { bom_names: names },
				freeze: true,
				freeze_message: __("Meng-submit resep..."),
				callback: (r) => {
					if (r.exc) return;
					const msg = r.message || {};
					const err = msg.errors || [];
					frappe.show_alert({
						message: __("Submitted: {0} · dilewati: {1} · gagal: {2}", [
							cint(msg.count),
							cint((msg.skipped || []).length),
							err.length,
						]),
						indicator: err.length ? "orange" : "green",
					});
					if (err.length) {
						frappe.msgprint({
							title: __("Sebagian gagal"),
							message: err
								.map((e) => `${frappe.utils.escape_html(e.bom)}: ${frappe.utils.escape_html(e.error)}`)
								.join("<br>"),
							indicator: "orange",
						});
					}
					this.selected.clear();
					this.refresh();
				},
			});
		});
	}

	format_qty(value) {
		const n = flt(value);
		if (!n && n !== 0) return "—";
		if (Math.abs(n - Math.round(n)) < 0.0005) return String(Math.round(n));
		return String(cint(n * 1000) / 1000);
	}

	item_codes_similar(name, code) {
		const norm = (v) =>
			String(v || "")
				.toLowerCase()
				.replace(/[^a-z0-9]/g, "");
		const a = norm(name);
		const b = norm(code);
		return !b || !a || a === b;
	}

	item_label_html(name, code) {
		const title = name || code || "—";
		const show_code = code && !this.item_codes_similar(name, code);
		return `
			<div class="imogi-rh-name">${frappe.utils.escape_html(title)}</div>
			${show_code ? `<div class="imogi-rh-sub">${frappe.utils.escape_html(code)}</div>` : ""}
		`;
	}

	open_detail(bom) {
		frappe.call({
			method: "imogi_pos.api.planned_features_api.get_recipe_detail_api",
			args: { bom },
			callback: (r) => {
				if (r.exc) return;
				const d = r.message || {};
				if (typeof d.can_view_cost === "boolean") {
					this.can_view_cost = d.can_view_cost;
				}
				const show_cost = this.can_view_cost;
				const ingredients = d.ingredients || [];
				const rows = ingredients
					.map((ing) => {
						const show_code =
							ing.item_code && !this.item_codes_similar(ing.item_name, ing.item_code);
						return `<tr>
							<td>
								<div class="imogi-rh-detail-ing">${frappe.utils.escape_html(
									ing.item_name || ing.item_code
								)}</div>
								${
									show_code
										? `<div class="imogi-rh-detail-ing-code">${frappe.utils.escape_html(
												ing.item_code
										  )}</div>`
										: ""
								}
							</td>
							<td class="imogi-rh-num">${this.format_qty(ing.qty_per_portion)} ${frappe.utils.escape_html(
								ing.uom || ""
							)}</td>
							${show_cost ? `<td class="imogi-rh-num">${this.money(ing.amount_per_portion)}</td>` : ""}
						</tr>`;
					})
					.join("");

				const dialog = new frappe.ui.Dialog({
					title: __("Detail Resep"),
					size: "large",
					fields: [{ fieldtype: "HTML", fieldname: "body" }],
					primary_action_label: __("Tutup"),
					primary_action: () => dialog.hide(),
				});
				dialog.$wrapper.addClass("imogi-rh-detail-dialog");
				dialog.fields_dict.body.$wrapper.html(`
					<div class="imogi-rh-detail">
						<div class="imogi-rh-detail-head">
							<div>
								<div class="imogi-rh-detail-title">${frappe.utils.escape_html(d.item_name || d.item || "—")}</div>
								<div class="imogi-rh-detail-code">${frappe.utils.escape_html(d.name || "")}${
					d.is_default
						? ` · <span class="imogi-rh-badge imogi-rh-badge--default">${__("Default")}</span>`
						: ""
				}</div>
							</div>
							${this.status_badge(d)}
						</div>
						<div class="imogi-rh-detail-kpis">
							<div class="imogi-rh-detail-kpi">
								<div class="imogi-rh-detail-kpi-label">${__("Porsi / Yield")}</div>
								<div class="imogi-rh-detail-kpi-val">${this.format_qty(d.portion_qty)} ${frappe.utils.escape_html(
					d.uom || ""
				)}</div>
							</div>
							<div class="imogi-rh-detail-kpi">
								<div class="imogi-rh-detail-kpi-label">${__("Jumlah Bahan")}</div>
								<div class="imogi-rh-detail-kpi-val">${ingredients.length}</div>
							</div>
							${
								show_cost
									? `<div class="imogi-rh-detail-kpi imogi-rh-detail-kpi--accent">
								<div class="imogi-rh-detail-kpi-label">${__("Cost / Porsi")}</div>
								<div class="imogi-rh-detail-kpi-val">${this.money(d.cost_per_portion)}</div>
							</div>`
									: ""
							}
						</div>
						<div class="imogi-rh-detail-panel">
							<div class="imogi-rh-detail-panel-head">
								<div class="imogi-rh-detail-panel-title">${__("Komposisi Bahan")}</div>
								<span class="imogi-rh-detail-panel-meta">${
									show_cost
										? __("Qty & cost dihitung per 1 porsi")
										: __("Qty dihitung per 1 porsi")
								}</span>
							</div>
							${
								ingredients.length
									? `<div class="imogi-rh-table-wrap">
								<table class="imogi-rh-detail-table">
									<thead>
										<tr>
											<th>${__("Bahan")}</th>
											<th class="imogi-rh-num">${__("Qty / Porsi")}</th>
											${show_cost ? `<th class="imogi-rh-num">${__("Cost / Porsi")}</th>` : ""}
										</tr>
									</thead>
									<tbody>${rows}</tbody>
								</table>
							</div>
							<div class="imogi-rh-detail-foot">
								${
									show_cost
										? `<div>
									<div class="imogi-rh-detail-total-label">${__("Total Cost Bahan / Porsi")}</div>
									<div class="imogi-rh-detail-total-val">${this.money(d.cost_per_portion)}</div>
								</div>`
										: "<div></div>"
								}
								<div class="imogi-rh-detail-actions">
									<button type="button" class="imogi-rh-detail-btn imogi-rh-detail-open-bom" data-bom="${frappe.utils.escape_html(
										d.name || ""
									)}">
										<i class="fa fa-external-link"></i> ${__("Buka BOM")}
									</button>
									<button type="button" class="imogi-rh-detail-btn imogi-rh-detail-btn--primary imogi-rh-detail-edit" data-bom="${frappe.utils.escape_html(
										d.name || ""
									)}" data-docstatus="${cint(d.docstatus)}">
										<i class="fa fa-pencil"></i> ${__("Edit Resep")}
									</button>
								</div>
							</div>`
									: `<div class="imogi-rh-detail-empty">
								<i class="fa fa-inbox" style="font-size:22px;opacity:.35"></i>
								${__("Resep ini belum punya bahan.")}
							</div>`
							}
						</div>
					</div>
				`);
				dialog.show();
				dialog.$wrapper.find(".imogi-rh-detail-open-bom").on("click", () => {
					dialog.hide();
					this.navigate_bom(d.name);
				});
				dialog.$wrapper.find(".imogi-rh-detail-edit").on("click", () => {
					dialog.hide();
					this.open_edit(d.name, cint(d.docstatus));
				});
			},
		});
	}

	render_portion() {
		const $body = this.$content.find(".imogi-rh-body");
		const { page_rows, pager, total } = this.paginate(this.recipes);
		$body.html(`
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Portion Control")}</div>
					<span class="imogi-rh-meta">${__(
						"Qty bahan dihitung per 1 porsi. Ubah yield hanya untuk resep Draft."
					)}</span>
				</div>
				<div class="imogi-rh-table-wrap">
					<table class="imogi-rh-table">
						<thead>
							<tr>
								<th>${__("Menu")}</th>
								<th>${__("Yield (porsi)")}</th>
								<th>${__("Bahan")}</th>
								<th>${__("Status")}</th>
								<th>${__("Aksi")}</th>
							</tr>
						</thead>
						<tbody>
							${page_rows
								.map((row) => {
									const can_edit = cint(row.docstatus) === 0;
									return `<tr>
										<td>
											<div class="imogi-rh-name">${frappe.utils.escape_html(row.item_name || row.item)}</div>
											<div class="imogi-rh-sub">${frappe.utils.escape_html(row.name)}</div>
										</td>
										<td>
											<input type="number" min="0.001" step="0.001" class="imogi-rh-portion-input" data-bom="${frappe.utils.escape_html(
												row.name
											)}" value="${flt(row.portion_qty)}" ${can_edit ? "" : "disabled"}>
											<span class="imogi-rh-sub">${frappe.utils.escape_html(row.uom || "")}</span>
										</td>
										<td class="imogi-rh-num">${cint(row.ingredient_count)}</td>
										<td>${this.status_badge(row)}</td>
										<td>
											${
												can_edit
													? `<button type="button" class="imogi-rh-mini imogi-rh-save-portion" data-bom="${frappe.utils.escape_html(
															row.name
													  )}">${__("Simpan")}</button>`
													: `<span class="imogi-rh-badge imogi-rh-badge--muted">${__(
															"Submitted"
													  )}</span>`
											}
										</td>
									</tr>`;
								})
								.join("")}
						</tbody>
					</table>
				</div>
				${pager.html}
			</div>
		`);
		this.bind_pager($body, total);
		$body.find(".imogi-rh-save-portion").on("click", (e) => {
			const bom = $(e.currentTarget).data("bom");
			const val = $body.find(`.imogi-rh-portion-input[data-bom="${bom}"]`).val();
			frappe.call({
				method: "imogi_pos.api.planned_features_api.update_recipe_portion_api",
				args: { bom, portion_qty: val },
				freeze: true,
				callback: (r) => {
					if (r.exc) return;
					frappe.show_alert({ message: __("Porsi disimpan"), indicator: "green" });
					this.refresh();
				},
			});
		});
	}

	render_food_cost() {
		const $body = this.$content.find(".imogi-rh-body");
		const fc = this.food_cost || {};
		const recipes = fc.recipes || [];
		const { page_rows, pager, total } = this.paginate(recipes);

		this.$content.find(".imogi-rh-stats").html(`
			<div class="imogi-rh-stat-grid">
				${this.stat_card(__("Sales"), this.money(fc.sales), "fa-line-chart", "blue", true)}
				${this.stat_card(__("Food Cost"), this.money(fc.food_cost), "fa-shopping-basket", "", true)}
				${this.stat_card(__("Margin"), this.money(fc.margin), "fa-trophy", "green", true)}
				${this.stat_card(
					__("Food Cost %"),
					`${Number(fc.food_cost_percent || 0).toFixed(1)}%`,
					"fa-percent",
					"slate"
				)}
			</div>
		`);

		$body.html(`
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Food Cost per Resep (Default)")}</div>
					<span class="imogi-rh-meta">${fc.date_from || ""} — ${fc.date_to || ""}</span>
				</div>
				<div class="imogi-rh-table-wrap">
					<table class="imogi-rh-table">
						<thead>
							<tr>
								<th>${__("Menu")}</th>
								<th>${__("Cost Bahan")}</th>
								<th>${__("Cost / Porsi")}</th>
								<th>${__("Status")}</th>
							</tr>
						</thead>
						<tbody>
							${
								page_rows
									.map(
										(row) => `<tr>
									<td>
										<div class="imogi-rh-name">${frappe.utils.escape_html(row.item_name || row.item)}</div>
										<div class="imogi-rh-sub">${frappe.utils.escape_html(row.name)}</div>
									</td>
									<td class="imogi-rh-num">${this.money(row.raw_material_cost)}</td>
									<td class="imogi-rh-num">${this.money(row.cost_per_portion)}</td>
									<td>${this.status_badge(row)}</td>
								</tr>`
									)
									.join("") ||
								`<tr><td colspan="4"><div class="imogi-rh-empty">${__(
									"Belum ada resep default."
								)}</div></td></tr>`
							}
						</tbody>
					</table>
				</div>
				${pager.html}
			</div>
		`);
		this.bind_pager($body, total);
	}

	render_substitutes() {
		const $body = this.$content.find(".imogi-rh-body");
		const { page_rows, pager, total } = this.paginate(this.substitutes);
		this.$content.find(".imogi-rh-stats").html(`
			<div class="imogi-rh-stat-grid">
				${this.stat_card(__("Pasangan Substitusi"), total, "fa-exchange", "blue")}
				${this.stat_card(__("Two-way"), this.substitutes.filter((r) => r.two_way).length, "fa-random", "green")}
				${this.stat_card(
					__("Dipakai di Resep"),
					this.substitutes.filter((r) => (r.used_in_recipes || []).length).length,
					"fa-link",
					"slate"
				)}
				${this.stat_card(__("Siap Pakai"), total ? __("Aktif") : __("Kosong"), "fa-check", "", true)}
			</div>
		`);

		$body.html(`
			<div class="imogi-web-panel imogi-web-panel--form">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Tambah Substitusi Bahan")}</div>
					<span class="imogi-rh-meta">${__("Pilih bahan utama & penggantinya")}</span>
				</div>
				<div class="imogi-rh-form">
					<div class="imogi-rh-item-link"></div>
					<div class="imogi-rh-alt-link"></div>
					<div style="display:flex;align-items:center;gap:8px;padding-bottom:2px">
						<label class="imogi-rh-twoway"><input type="checkbox" class="imogi-rh-two-way" checked> ${__(
							"Two-way"
						)}</label>
						<button type="button" class="imogi-rh-add-sub"><i class="fa fa-plus"></i> ${__("Simpan")}</button>
					</div>
				</div>
			</div>
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Daftar Substitusi")}</div>
					<span class="imogi-rh-meta">${total} ${__("pasangan")}</span>
				</div>
				${
					total
						? `<div class="imogi-rh-table-wrap">
					<table class="imogi-rh-table">
						<thead>
							<tr>
								<th>${__("Bahan Utama")}</th>
								<th>${__("Pengganti")}</th>
								<th>${__("Two-way")}</th>
								<th>${__("Dipakai di")}</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							${page_rows
								.map(
									(row) => `<tr>
									<td>${this.item_label_html(row.item_name, row.item_code)}</td>
									<td>${this.item_label_html(row.alternative_item_name, row.alternative_item_code)}</td>
									<td>${row.two_way ? __("Ya") : __("Tidak")}</td>
									<td class="imogi-rh-sub">${frappe.utils.escape_html((row.used_in_recipes || []).join(", ") || "—")}</td>
									<td><button type="button" class="imogi-rh-mini imogi-rh-del-sub" data-name="${frappe.utils.escape_html(
										row.name
									)}">${__("Hapus")}</button></td>
								</tr>`
								)
								.join("")}
						</tbody>
					</table>
				</div>
				${pager.html}`
						: `<div class="imogi-rh-empty">
						<i class="fa fa-exchange" style="font-size:26px;opacity:.3"></i>
						${__("Belum ada substitusi. Pilih bahan di form atas lalu Simpan.")}
					</div>`
				}
			</div>
		`);
		this.bind_pager($body, total);

		const item_ctrl = frappe.ui.form.make_control({
			parent: $body.find(".imogi-rh-item-link"),
			df: {
				fieldtype: "Link",
				options: "Item",
				label: __("Bahan Utama"),
				fieldname: "item_code",
				reqd: 1,
				get_query: () => ({
					filters: { disabled: 0, is_stock_item: 1 },
				}),
			},
			render_input: true,
		});
		const alt_ctrl = frappe.ui.form.make_control({
			parent: $body.find(".imogi-rh-alt-link"),
			df: {
				fieldtype: "Link",
				options: "Item",
				label: __("Bahan Pengganti"),
				fieldname: "alternative_item_code",
				reqd: 1,
				get_query: () => ({
					filters: { disabled: 0, is_stock_item: 1 },
				}),
			},
			render_input: true,
		});

		$body.find(".imogi-rh-add-sub").on("click", () => {
			const item_code = (item_ctrl.get_value() || "").trim();
			const alternative_item_code = (alt_ctrl.get_value() || "").trim();
			const two_way = $body.find(".imogi-rh-two-way").is(":checked") ? 1 : 0;
			if (!item_code || !alternative_item_code) {
				frappe.show_alert({ message: __("Isi bahan utama & pengganti"), indicator: "orange" });
				return;
			}
			frappe.call({
				method: "imogi_pos.api.planned_features_api.upsert_ingredient_substitute_api",
				args: { item_code, alternative_item_code, two_way },
				freeze: true,
				callback: (r) => {
					if (r.exc) return;
					frappe.show_alert({ message: __("Substitusi disimpan"), indicator: "green" });
					this.refresh();
				},
			});
		});
		$body.find(".imogi-rh-del-sub").on("click", (e) => {
			const name = $(e.currentTarget).data("name");
			frappe.confirm(__("Hapus substitusi ini?"), () => {
				frappe.call({
					method: "imogi_pos.api.planned_features_api.delete_ingredient_substitute_api",
					args: { name },
					callback: (r) => {
						if (r.exc) return;
						this.refresh();
					},
				});
			});
		});
	}

	render_versions() {
		const $body = this.$content.find(".imogi-rh-body");
		const { page_rows, pager, total } = this.paginate(this.versions);
		this.$content.find(".imogi-rh-stats").html(`
			<div class="imogi-rh-stat-grid">
				${this.stat_card(__("Total Perubahan"), total, "fa-history", "slate")}
				${this.stat_card(
					__("Resep Terubah"),
					new Set(this.versions.map((v) => v.bom)).size,
					"fa-book",
					"blue"
				)}
				${this.stat_card(
					__("User Aktif"),
					new Set(this.versions.map((v) => v.owner).filter(Boolean)).size,
					"fa-user",
					"green"
				)}
				${this.stat_card(__("Scope"), __("BOM Only"), "fa-filter", "", true)}
			</div>
		`);

		$body.html(`
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Histori Versi Resep")}</div>
					<span class="imogi-rh-meta">${total} ${__("perubahan")}</span>
				</div>
				<div class="imogi-rh-table-wrap">
					<table class="imogi-rh-table">
						<thead>
							<tr>
								<th>${__("Waktu")}</th>
								<th>${__("Resep")}</th>
								<th>${__("Oleh")}</th>
								<th>${__("Perubahan")}</th>
							</tr>
						</thead>
						<tbody>
							${
								page_rows
									.map(
										(row) => `<tr>
									<td class="imogi-rh-num">${frappe.datetime.str_to_user(row.creation)}</td>
									<td>
										<div class="imogi-rh-name">${frappe.utils.escape_html(row.recipe_label)}</div>
										<div class="imogi-rh-sub">${frappe.utils.escape_html(row.bom)}</div>
									</td>
									<td>${frappe.utils.escape_html(row.owner || "—")}</td>
									<td class="imogi-rh-sub">${frappe.utils.escape_html(row.summary || "—")}</td>
								</tr>`
									)
									.join("") ||
								`<tr><td colspan="4"><div class="imogi-rh-empty">${__(
									"Belum ada histori perubahan resep."
								)}</div></td></tr>`
							}
						</tbody>
					</table>
				</div>
				${pager.html}
			</div>
		`);
		this.bind_pager($body, total);
	}
};
