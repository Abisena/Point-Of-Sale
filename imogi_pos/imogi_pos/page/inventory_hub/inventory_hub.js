frappe.provide("imogi_pos");

function inject_inventory_hub_css() {
	for (let v = 1; v <= 9; v += 1) {
		document.getElementById(`imogi-inventory-hub-css-v${v}`)?.remove();
	}
	if (document.getElementById("imogi-inventory-hub-css-v10")) return;
	frappe.dom.set_style(
		`
		body.imogi-ih-fullscreen,
		body.imogi-ih-fullscreen .main-section,
		body.imogi-ih-fullscreen .page-container,
		body.imogi-ih-fullscreen .content.page-container,
		body.imogi-ih-fullscreen .container,
		body.imogi-ih-fullscreen .container.page-body,
		body.imogi-ih-fullscreen .row.layout-main,
		body.imogi-ih-fullscreen .layout-main,
		body.imogi-ih-fullscreen .layout-main-section-wrapper,
		body.imogi-ih-fullscreen .layout-main-section,
		body.imogi-ih-fullscreen .layout-main-section-wrapper > [class*="col-"],
		body.imogi-ih-fullscreen .page-body{
			box-sizing:border-box!important;
			margin-left:0!important;
			margin-right:0!important;
			max-width:100%!important;
			width:100%!important;
			background:#fff!important
		}
		body.imogi-ih-fullscreen .imogi-inventory-hub.layout-main-section,
		body.imogi-ih-fullscreen .imogi-inventory-hub,
		body.imogi-ih-fullscreen .imogi-web-shell-root.imogi-inventory-hub{
			max-width:100%!important;
			width:100%!important
		}
		body.imogi-ih-fullscreen .imogi-web-shell{
			margin:0!important;
			max-width:100%!important;
			padding-left:20px!important;
			padding-right:20px!important;
			width:100%!important
		}
		body.imogi-ih-fullscreen .imogi-web-content{
			max-width:100%!important;
			width:100%!important;
			overflow:visible!important
		}
		body.imogi-ih-fullscreen .layout-main-section,
		body.imogi-ih-fullscreen .imogi-inventory-hub{
			overflow:visible!important
		}
		@media (max-width:767px){
			body.imogi-ih-fullscreen .imogi-web-shell{
				padding-left:12px!important;
				padding-right:12px!important
			}
		}

		.imogi-inventory-hub.layout-main-section,
		.imogi-inventory-hub,
		.imogi-inventory-hub .page-body,
		.imogi-inventory-hub .layout-main-section-wrapper,
		.imogi-inventory-hub .imogi-web-shell,
		.imogi-inventory-hub .imogi-web-shell-root,
		.imogi-inventory-hub .imogi-web-content{background:#fff!important}
		.imogi-inventory-hub .page-head{display:none!important}
		.imogi-inventory-hub .imogi-web-hero{
			align-items:center!important;margin-bottom:14px!important;border-bottom:1px solid #e2e8f0!important;
			border-radius:0!important;box-shadow:none!important;gap:16px!important
		}
		.imogi-inventory-hub .imogi-web-hero > div:first-child{
			align-items:center;display:flex;flex:1;flex-wrap:wrap;gap:12px 20px;min-width:0
		}
		.imogi-inventory-hub .imogi-web-hero h3{margin:0!important;white-space:nowrap}
		.imogi-inventory-hub .imogi-ih-search{
			background:#fff;border:1px solid #cbd5e1;border-radius:8px;flex:1;font-size:13px;
			height:36px;max-width:420px;min-width:200px;padding:0 12px
		}
		.imogi-inventory-hub .imogi-ih-search:focus{border-color:#0ea5e9;outline:none;box-shadow:0 0 0 3px rgba(14,165,233,.15)}
		.imogi-inventory-hub .imogi-web-actions{align-items:center;display:flex;flex-wrap:wrap;gap:8px}
		.imogi-inventory-hub button.imogi-ih-tab{
			align-items:center!important;appearance:none!important;background:#fff!important;border:1px solid #cbd5e1!important;
			border-radius:6px!important;color:#475569!important;cursor:pointer!important;display:inline-flex!important;
			font-size:12px!important;font-weight:700!important;gap:5px!important;height:36px!important;line-height:1!important;
			margin:0!important;padding:0 12px!important;white-space:nowrap!important
		}
		.imogi-inventory-hub button.imogi-ih-tab.is-active{
			background:#ecfeff!important;border-color:#0ea5e9!important;color:#0369a1!important
		}
		.imogi-inventory-hub .imogi-ih-stat-grid{
			display:grid;gap:10px;grid-template-columns:repeat(2,minmax(0,1fr));margin-bottom:14px
		}
		.imogi-inventory-hub .imogi-ih-stat{
			background:linear-gradient(180deg,#fff 0%,#fafafa 100%);border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px
		}
		.imogi-inventory-hub .imogi-ih-stat-label{color:#64748b;font-size:10px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}
		.imogi-inventory-hub .imogi-ih-stat-val{color:#0f172a;font-size:22px;font-weight:800;margin-top:6px}
		.imogi-inventory-hub .imogi-web-panel{
			background:#fff;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:12px
		}
		.imogi-inventory-hub .imogi-web-panel--form{overflow:visible!important;position:relative;z-index:5}
		.imogi-inventory-hub .imogi-web-panel-head{
			align-items:center;border-bottom:1px solid #f1f5f9;display:flex;gap:10px;justify-content:space-between;padding:12px 14px
		}
		.imogi-inventory-hub .imogi-web-panel-title{color:#0f172a;font-size:13px;font-weight:800}
		.imogi-inventory-hub .imogi-ih-meta{color:#64748b;font-size:11px;font-weight:600}
		.imogi-inventory-hub .imogi-ih-table{width:100%;border-collapse:collapse}
		.imogi-inventory-hub .imogi-ih-table th{
			background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:10px;font-weight:800;
			letter-spacing:.04em;padding:10px 12px;text-align:left;text-transform:uppercase
		}
		.imogi-inventory-hub .imogi-ih-table td{border-bottom:1px solid #f1f5f9;color:#334155;font-size:13px;padding:10px 12px}
		.imogi-inventory-hub .imogi-ih-table tbody tr:hover td{background:#f0f9ff}
		.imogi-inventory-hub .imogi-ih-name{color:#0f172a;font-weight:800}
		.imogi-inventory-hub .imogi-ih-sub{color:#64748b;font-size:11px;font-weight:600;margin-top:2px}
		.imogi-inventory-hub .imogi-ih-num{font-variant-numeric:tabular-nums;font-weight:700;white-space:nowrap}
		.imogi-inventory-hub .imogi-ih-badge{
			border-radius:999px;display:inline-block;font-size:10px;font-weight:700;padding:3px 8px
		}
		.imogi-inventory-hub .imogi-ih-badge--ok{background:#ecfdf5;border:1px solid #a7f3d0;color:#047857}
		.imogi-inventory-hub .imogi-ih-badge--warn{background:#fff7ed;border:1px solid #fed7aa;color:#c2410c}
		.imogi-inventory-hub .imogi-ih-badge--danger{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c}
		.imogi-inventory-hub .imogi-ih-badge--pending{background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8}
		.imogi-inventory-hub .imogi-ih-badge--rejected{background:#f8fafc;border:1px solid #cbd5e1;color:#64748b}
		.imogi-inventory-hub .imogi-ih-proof{
			align-items:center;display:flex;flex-wrap:wrap;gap:6px
		}
		.imogi-inventory-hub .imogi-ih-proof-chip{
			background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;color:#0369a1;
			font-size:11px;font-weight:700;max-width:160px;overflow:hidden;padding:4px 8px;
			text-decoration:none;text-overflow:ellipsis;white-space:nowrap
		}
		.imogi-inventory-hub .imogi-ih-proof-chip:hover{background:#e0f2fe;border-color:#7dd3fc}
		.imogi-inventory-hub .imogi-ih-waste-note{
			align-items:flex-start;background:linear-gradient(135deg,#f0f9ff 0%,#ecfeff 100%);
			border:1px solid #bae6fd;border-radius:12px;color:#0c4a6e;display:flex;font-size:12px;
			font-weight:600;gap:12px;line-height:1.45;margin-bottom:14px;padding:12px 14px
		}
		.imogi-inventory-hub .imogi-ih-waste-note-steps{
			display:flex;flex-wrap:wrap;gap:6px;margin-top:8px
		}
		.imogi-inventory-hub .imogi-ih-waste-step{
			background:#fff;border:1px solid #bae6fd;border-radius:999px;color:#0369a1;
			font-size:10px;font-weight:800;letter-spacing:.02em;padding:3px 10px
		}
		.imogi-inventory-hub .imogi-ih-waste-layout{
			display:grid;gap:16px;grid-template-columns:minmax(0,1.4fr) minmax(240px,.9fr);
			overflow:visible!important;padding:16px;position:relative;z-index:6
		}
		@media (max-width:900px){
			.imogi-inventory-hub .imogi-ih-waste-layout{grid-template-columns:1fr}
		}
		.imogi-inventory-hub .imogi-ih-waste-fields{
			display:grid;gap:12px;grid-template-columns:.8fr 1.3fr;overflow:visible!important
		}
		.imogi-inventory-hub .imogi-ih-waste-fields .imogi-ih-w-span2{grid-column:1/-1}
		@media (max-width:640px){
			.imogi-inventory-hub .imogi-ih-waste-fields{grid-template-columns:1fr}
		}
		.imogi-inventory-hub .imogi-ih-waste-fields label,
		.imogi-inventory-hub .imogi-ih-waste-proof label{
			color:#64748b;display:block;font-size:11px;font-weight:700;margin-bottom:5px
		}
		.imogi-inventory-hub .imogi-ih-waste-fields input,
		.imogi-inventory-hub .imogi-ih-waste-fields select,
		.imogi-inventory-hub .imogi-ih-waste-fields .frappe-control input,
		.imogi-inventory-hub .imogi-ih-waste-fields .frappe-control .input-with-feedback,
		.imogi-inventory-hub .imogi-ih-waste-fields .awesomplete > input{
			background:#fff!important;border:1px solid #cbd5e1!important;border-radius:8px!important;
			box-shadow:none!important;color:#0f172a!important;font-size:13px!important;height:38px!important;
			padding:0 12px!important;width:100%!important
		}
		.imogi-inventory-hub .imogi-ih-waste-fields .frappe-control input:focus,
		.imogi-inventory-hub .imogi-ih-waste-fields .awesomplete > input:focus,
		.imogi-inventory-hub .imogi-ih-waste-fields input:focus,
		.imogi-inventory-hub .imogi-ih-waste-fields select:focus{
			border-color:#0ea5e9!important;box-shadow:0 0 0 3px rgba(14,165,233,.15)!important;outline:none!important
		}
		.imogi-inventory-hub .imogi-ih-waste-fields .imogi-ih-w-qty-wrap{
			align-items:stretch;background:#fff!important;border:1px solid #cbd5e1!important;
			border-radius:8px!important;display:flex;overflow:hidden;transition:border-color .15s,box-shadow .15s
		}
		.imogi-inventory-hub .imogi-ih-waste-fields .imogi-ih-w-qty-wrap:focus-within{
			border-color:#0ea5e9!important;box-shadow:0 0 0 3px rgba(14,165,233,.15)!important
		}
		.imogi-inventory-hub .imogi-ih-waste-fields .imogi-ih-w-qty-wrap .imogi-ih-w-qty{
			border:none!important;border-radius:0!important;box-shadow:none!important;flex:1;min-width:0!important
		}
		.imogi-inventory-hub .imogi-ih-waste-fields .imogi-ih-w-qty-wrap .imogi-ih-w-qty:focus{
			box-shadow:none!important;outline:none!important
		}
		.imogi-inventory-hub .imogi-ih-w-uom-badge{
			align-items:center;background:#f1f5f9;border-left:1px solid #e2e8f0;color:#64748b;
			display:flex;flex-shrink:0;font-size:11px;font-weight:800;justify-content:center;
			letter-spacing:.02em;min-width:44px;padding:0 10px;text-transform:uppercase;white-space:nowrap
		}
		.imogi-inventory-hub .imogi-ih-waste-fields .frappe-control,
		.imogi-inventory-hub .imogi-ih-waste-fields .awesomplete,
		.imogi-inventory-hub .imogi-ih-waste-fields .form-group{
			margin-bottom:0!important;overflow:visible!important;position:relative;z-index:7;width:100%
		}
		.imogi-inventory-hub .imogi-ih-waste-fields .control-label,
		.imogi-inventory-hub .imogi-ih-waste-fields .help-box,
		.imogi-inventory-hub .imogi-ih-waste-fields .link-btn{display:none!important}
		.imogi-inventory-hub .imogi-ih-waste-fields .awesomplete > ul{
			background:#fff!important;border:1px solid #cbd5e1!important;border-radius:8px!important;
			box-shadow:0 10px 28px rgba(15,23,42,.14)!important;max-height:240px!important;
			overflow-y:auto!important;z-index:10050!important
		}
		.imogi-inventory-hub .imogi-ih-waste-proof{display:flex;flex-direction:column;min-height:100%}
		.imogi-inventory-hub .imogi-ih-attach-box{
			align-items:center;background:linear-gradient(180deg,#f8fafc 0%,#fff 100%);
			border:1.5px dashed #94a3b8;border-radius:12px;cursor:pointer;display:flex;
			flex:1;flex-direction:column;gap:8px;justify-content:center;min-height:168px;
			padding:18px 16px;text-align:center;transition:border-color .15s,background .15s
		}
		.imogi-inventory-hub .imogi-ih-attach-box:hover,
		.imogi-inventory-hub .imogi-ih-attach-box.is-ready{
			background:linear-gradient(180deg,#f0f9ff 0%,#fff 100%);border-color:#0ea5e9
		}
		.imogi-inventory-hub .imogi-ih-attach-box.is-ready{border-style:solid}
		.imogi-inventory-hub .imogi-ih-attach-ico{
			align-items:center;background:#e0f2fe;border-radius:12px;color:#0284c7;display:flex;
			font-size:11px;font-weight:800;height:44px;justify-content:center;letter-spacing:.04em;
			text-transform:uppercase;width:44px
		}
		.imogi-inventory-hub .imogi-ih-attach-title{color:#0f172a;font-size:13px;font-weight:800}
		.imogi-inventory-hub .imogi-ih-attach-hint{color:#64748b;font-size:11px;font-weight:600;line-height:1.4}
		.imogi-inventory-hub .imogi-ih-attach-list{
			display:flex;flex-direction:column;gap:6px;list-style:none;margin:10px 0 0;padding:0;width:100%
		}
		.imogi-inventory-hub .imogi-ih-attach-list li{
			align-items:center;background:#fff;border:1px solid #e2e8f0;border-radius:8px;
			color:#334155;display:flex;font-size:12px;font-weight:600;gap:8px;justify-content:space-between;
			padding:8px 10px;text-align:left
		}
		.imogi-inventory-hub .imogi-ih-attach-list .imogi-ih-attach-empty{
			background:transparent;border:none;color:#94a3b8;justify-content:center;padding:4px 0
		}
		.imogi-inventory-hub .imogi-ih-waste-actions{
			align-items:center;border-top:1px solid #f1f5f9;display:flex;gap:12px;
			justify-content:space-between;margin-top:4px;padding:14px 16px
		}
		.imogi-inventory-hub .imogi-ih-waste-actions-hint{color:#64748b;font-size:11px;font-weight:600}
		.imogi-inventory-hub .imogi-ih-hist-meta-chip{
			background:#eff6ff;border:1px solid #bfdbfe;border-radius:999px;color:#1d4ed8;
			font-size:10px;font-weight:800;padding:3px 9px
		}
		.imogi-inventory-hub .imogi-ih-table tr.imogi-ih-row--pending td{background:#f8fbff}
		.imogi-inventory-hub .imogi-ih-table tr.imogi-ih-row--pending:hover td{background:#eff6ff}
		.imogi-inventory-hub .imogi-ih-table .imogi-ih-doc-link{
			color:#0369a1;font-weight:700;text-decoration:none
		}
		.imogi-inventory-hub .imogi-ih-table .imogi-ih-doc-link:hover{text-decoration:underline}
		.imogi-inventory-hub button.imogi-ih-mini--approve{
			background:#059669;border-color:#059669;color:#fff
		}
		.imogi-inventory-hub button.imogi-ih-mini--reject{
			background:#fff;border-color:#fecaca;color:#b91c1c
		}
		.imogi-inventory-hub button.imogi-ih-mini.is-ready{
			background:#ecfdf5;border-color:#a7f3d0;color:#047857
		}
		.imogi-inventory-hub button.imogi-ih-mini:disabled{
			cursor:not-allowed;opacity:.5
		}
		.imogi-inventory-hub .imogi-ih-empty{color:#64748b;padding:36px 16px;text-align:center}
		.imogi-inventory-hub .imogi-ih-form{
			display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));overflow:visible!important;padding:14px;position:relative;z-index:6
		}
		.imogi-inventory-hub .imogi-ih-form label{color:#64748b;display:block;font-size:11px;font-weight:700;margin-bottom:4px}
		.imogi-inventory-hub .imogi-ih-form input,.imogi-inventory-hub .imogi-ih-form select,
		.imogi-inventory-hub .imogi-ih-form .frappe-control input,
		.imogi-inventory-hub .imogi-ih-form .frappe-control .input-with-feedback,
		.imogi-inventory-hub .imogi-ih-form .awesomplete > input{
			background:#fff!important;border:1px solid #cbd5e1!important;border-radius:8px!important;
			box-shadow:none!important;color:#0f172a!important;font-size:13px!important;height:36px!important;
			padding:0 10px!important;width:100%!important
		}
		.imogi-inventory-hub .imogi-ih-form .frappe-control input:focus,
		.imogi-inventory-hub .imogi-ih-form .awesomplete > input:focus,
		.imogi-inventory-hub .imogi-ih-form input:focus,
		.imogi-inventory-hub .imogi-ih-form select:focus{
			border-color:#0ea5e9!important;box-shadow:0 0 0 3px rgba(14,165,233,.15)!important;outline:none!important
		}
		.imogi-inventory-hub .imogi-ih-form .frappe-control,
		.imogi-inventory-hub .imogi-ih-form .awesomplete,
		.imogi-inventory-hub .imogi-ih-form .form-group{
			margin-bottom:0!important;overflow:visible!important;position:relative;z-index:7;width:100%
		}
		.imogi-inventory-hub .imogi-ih-form .control-label,
		.imogi-inventory-hub .imogi-ih-form .help-box,
		.imogi-inventory-hub .imogi-ih-form .link-btn{display:none!important}
		.imogi-inventory-hub .imogi-ih-form .awesomplete > ul{
			background:#fff!important;border:1px solid #cbd5e1!important;border-radius:8px!important;
			box-shadow:0 10px 28px rgba(15,23,42,.14)!important;max-height:240px!important;
			overflow-y:auto!important;z-index:10050!important
		}
		.imogi-inventory-hub .imogi-ih-form .awesomplete > ul > li{
			border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:12px;font-weight:600;padding:8px 12px
		}
		.imogi-inventory-hub .imogi-ih-form .awesomplete > ul > li:hover,
		.imogi-inventory-hub .imogi-ih-form .awesomplete > ul > li[aria-selected=true]{
			background:#f0f9ff!important;color:#0369a1!important
		}
		.imogi-inventory-hub button.imogi-ih-btn{
			align-items:center;appearance:none;background:#0ea5e9;border:none;border-radius:8px;color:#fff!important;
			cursor:pointer;display:inline-flex;font-size:12px;font-weight:700;gap:6px;height:36px;padding:0 14px
		}
		.imogi-inventory-hub button.imogi-ih-btn:hover{filter:brightness(.96)}
		.imogi-inventory-hub button.imogi-ih-mini{
			appearance:none;background:#fff;border:1px solid #cbd5e1;border-radius:6px;color:#475569;cursor:pointer;
			font-size:11px;font-weight:700;height:30px;padding:0 10px
		}
		.imogi-inventory-hub button.imogi-ih-mini--apply{
			background:#059669;border-color:#059669;color:#fff
		}
		.imogi-inventory-hub button.imogi-ih-mini--apply:hover{filter:brightness(.96)}
		.imogi-inventory-hub .imogi-ih-subtabs{display:flex;gap:6px;margin-bottom:12px}
		.imogi-inventory-hub button.imogi-ih-subtab{
			appearance:none;background:#fff;border:1px solid #cbd5e1;border-radius:8px;color:#475569;cursor:pointer;
			font-size:12px;font-weight:700;height:34px;padding:0 16px
		}
		.imogi-inventory-hub button.imogi-ih-subtab.is-active{background:#eff6ff;border-color:#0ea5e9;color:#0369a1}
		.imogi-inventory-hub .imogi-ih-row-qty{
			background:#fff;border:1px solid #cbd5e1;border-radius:6px;color:#0f172a;font-size:12px;
			font-variant-numeric:tabular-nums;height:30px;padding:0 8px;width:110px
		}
		.imogi-inventory-hub .imogi-ih-actions{align-items:center;display:flex;flex-wrap:wrap;gap:6px}
		.imogi-inventory-hub .imogi-ih-user{color:#475569;font-size:11px;font-weight:600;max-width:140px}
		.imogi-inventory-hub .imogi-ih-when{color:#334155;font-size:12px;font-weight:600;white-space:nowrap}
		.imogi-inventory-hub .imogi-ih-pending-up{color:#059669!important;font-style:italic}
		.imogi-inventory-hub .imogi-ih-pending-down{color:#dc2626!important;font-style:italic}
		.imogi-inventory-hub .imogi-ih-note{
			background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;color:#0369a1;font-size:12px;margin-bottom:12px;padding:10px 12px
		}
		.imogi-ih-hist{
			padding:4px 2px 8px
		}
		.imogi-ih-hist-summary{
			align-items:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;
			color:#475569;display:flex;flex-wrap:wrap;font-size:12px;font-weight:600;gap:8px 14px;
			margin-bottom:12px;padding:10px 12px
		}
		.imogi-ih-hist-summary strong{color:#0f172a;font-weight:800}
		.imogi-ih-hist-wrap{
			border:1px solid #e2e8f0;border-radius:10px;max-height:420px;overflow:auto
		}
		.imogi-ih-hist-table{
			border-collapse:separate;border-spacing:0;margin:0;table-layout:auto;width:100%
		}
		.imogi-ih-hist-table th{
			background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:10px;font-weight:800;
			letter-spacing:.04em;padding:10px 12px;position:sticky;text-align:left;text-transform:uppercase;top:0;white-space:nowrap;z-index:1
		}
		.imogi-ih-hist-table td{
			background:#fff;border-bottom:1px solid #f1f5f9;color:#334155;font-size:13px;overflow:hidden;
			padding:11px 12px;text-overflow:ellipsis;vertical-align:middle;white-space:nowrap
		}
		.imogi-ih-hist-table td:first-child{overflow:visible;text-overflow:clip;white-space:nowrap}
		.imogi-ih-hist-table tbody tr:last-child td{border-bottom:none}
		.imogi-ih-hist-table tbody tr:hover td{background:#f8fafc}
		.imogi-ih-hist-table tbody tr:nth-child(even) td{background:#fff}
		.imogi-ih-hist-table td.imogi-ih-hist-proof{overflow:visible;white-space:normal}
		.imogi-ih-hist-table .imogi-ih-hist-doc{color:#0369a1;font-weight:700;text-decoration:none}
		.imogi-ih-hist-table .imogi-ih-hist-doc:hover{text-decoration:underline}
		.imogi-ih-hist-table .imogi-ih-hist-qty{font-variant-numeric:tabular-nums;font-weight:800;white-space:nowrap}
		.imogi-ih-hist-table .imogi-ih-hist-qty--up{color:#047857}
		.imogi-ih-hist-table .imogi-ih-hist-qty--down{color:#b91c1c}
		.imogi-ih-hist-table .imogi-ih-hist-reason{color:#64748b;font-size:12px}
		.imogi-ih-hist-table .imogi-ih-hist-loc{color:#334155;font-size:12px;font-weight:600}
		.imogi-ih-hist-table .imogi-ih-hist-loc--empty{color:#94a3b8;font-weight:500}
		.imogi-ih-hist-table .imogi-ih-when{color:#334155;font-size:12px;font-weight:600;white-space:nowrap}
		.imogi-ih-hist-empty{color:#64748b;padding:28px 16px;text-align:center}
		.imogi-ih-hist-table td:nth-child(1){min-width:150px}
		.imogi-ih-hist-table td:nth-child(2){min-width:90px}
		.imogi-ih-hist-table td:nth-child(3){min-width:110px}
		.imogi-ih-hist-table td:nth-child(4){min-width:110px}
		.imogi-ih-hist-table td:nth-child(5){min-width:70px}
		.imogi-ih-hist-table td:nth-child(6){min-width:70px}
		.imogi-ih-hist-table td:nth-child(7){min-width:100px}
		.imogi-ih-hist-table td:nth-child(8){min-width:140px}
		@media (max-width:900px){
			.imogi-inventory-hub .imogi-ih-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
		}
		`,
		"imogi-inventory-hub-css-v10"
	);
}

function activate_inventory_hub_fullscreen() {
	document.body.classList.add("imogi-ih-fullscreen");
	if (!window.__imogi_ih_fullscreen_bound) {
		window.__imogi_ih_fullscreen_bound = true;
		$(document).on("page-change.imogi-ih-fs", () => {
			const route = (frappe.get_route_str && frappe.get_route_str()) || "";
			if (route.indexOf("inventory-hub") === -1) {
				document.body.classList.remove("imogi-ih-fullscreen");
			} else {
				document.body.classList.add("imogi-ih-fullscreen");
			}
		});
	}
}

frappe.pages["inventory-hub"].on_page_load = function (wrapper) {
	inject_inventory_hub_css();
	activate_inventory_hub_fullscreen();
	imogi_pos.InventoryHub = new imogi_pos.InventoryHubView(wrapper);
};

frappe.pages["inventory-hub"].on_page_show = function () {
	inject_inventory_hub_css();
	activate_inventory_hub_fullscreen();
	if (imogi_pos.InventoryHub) {
		const route = frappe.get_route() || [];
		const tab = (route[1] || frappe.route_options?.tab || "").toString();
		if (tab && tab !== imogi_pos.InventoryHub.tab) {
			imogi_pos.InventoryHub.set_tab(tab, true);
		} else {
			imogi_pos.InventoryHub.refresh({ quiet: true, keep_page: true });
		}
		imogi_pos.InventoryHub.start_auto_refresh();
	}
};

imogi_pos.InventoryHubView = class InventoryHubView {
	constructor(wrapper) {
		this.wrapper = $(wrapper);
		this.tab = "stock";
		this.page_size = 10;
		this.page = 1;
		this.search = "";
		this.stock = null;
		this.issues = null;
		this.batches = null;
		this.expired = null;
		this.forecast = null;
		this.summary_report = null;
		this._summary_from = null;
		this._summary_to = null;
		this._summary_warehouse = null;
		this._poll_timer = null;
		this._pending_adjust = {};
		this.make();
		const route = frappe.get_route() || [];
		const tab = (route[1] || frappe.route_options?.tab || "stock").toString();
		this.set_tab(tab, true);
		this.start_auto_refresh();
	}

	make() {
		const page = imogi_pos.page_shell.make_page(
			this.wrapper.get(0),
			__("Inventory Hub"),
			"imogi-inventory-hub"
		);
		this.wrapper.find(".page-head").hide();

		const TABS = [
			{ id: "stock", label: __("Koreksi Stok"), icon: "fa-cubes" },
			{ id: "waste", label: __("Waste"), icon: "fa-trash" },
			{ id: "forecast", label: __("Forecast"), icon: "fa-line-chart" },
		];
		this.tabs = TABS;
		const tab_actions = TABS.map(
			(t) =>
				`<button type="button" class="imogi-ih-tab${t.id === "stock" ? " is-active" : ""}" data-tab="${
					t.id
				}"><i class="fa ${t.icon}"></i><span>${t.label}</span></button>`
		).join("");

		const $content = imogi_pos.page_shell.render_hero(page.main, {
			title: __("Inventory Hub"),
			actions_html: tab_actions,
		});
		this.$content = $content;
		const $shell = $content.closest(".imogi-web-shell");
		if (typeof imogi_pos.page_shell.init_owner_page === "function") {
			imogi_pos.page_shell.init_owner_page($shell, __("Inventory Hub"));
		}

		$shell.find(".imogi-web-hero > div").first().append(
			`<input type="search" class="imogi-ih-search" placeholder="${__("Cari bahan / item...")}">`
		);

		$content.append(`
			<div class="imogi-ih-stats"></div>
			<div class="imogi-ih-body"><div class="imogi-ih-empty">${__("Memuat...")}</div></div>
		`);

		$shell.find(".imogi-ih-tab").on("click", (e) => {
			this.set_tab($(e.currentTarget).data("tab"));
		});
		$shell.find(".imogi-ih-search").on("input change keydown", (e) => {
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
			if (route.indexOf("inventory-hub") === -1) return;
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
		this.tab = allowed.includes(tab) ? tab : "stock";
		this.page = 1;
		const $shell = this.$content.closest(".imogi-web-shell");
		$shell.find(".imogi-ih-tab").removeClass("is-active");
		$shell.find(`.imogi-ih-tab[data-tab="${this.tab}"]`).addClass("is-active");
		const active_tab = this.tabs.find((t) => t.id === this.tab);
		$shell.find(".imogi-web-hero h3").text(__("Inventory {0}", [active_tab ? active_tab.label : ""]));
		if (!silent) frappe.set_route("inventory-hub", this.tab);
		this.refresh();
	}

	money(v) {
		return format_currency(flt(v) || 0);
	}

	qty(v) {
		const n = flt(v);
		if (Math.abs(n - Math.round(n)) < 0.0005) return String(Math.round(n));
		return String(cint(n * 1000) / 1000);
	}

	adj_when(at, date_only) {
		const raw = at || date_only;
		if (!raw) return "—";
		const s = String(raw);
		if (window.moment) {
			const m = moment(s);
			if (m.isValid()) {
				return at ? m.format("DD-MM-YYYY HH:mm") : m.format("DD-MM-YYYY");
			}
		}
		try {
			return frappe.datetime.str_to_user(s);
		} catch (e) {
			return s.length >= 16 ? s.slice(0, 16) : s;
		}
	}

	make_link($parent, { options, fieldname, filters, onchange }) {
		return frappe.ui.form.make_control({
			parent: $parent.get(0) ? $parent : $($parent),
			df: {
				fieldtype: "Link",
				options,
				fieldname,
				label: " ",
				get_query: filters ? () => ({ filters }) : undefined,
				onchange,
			},
			render_input: true,
		});
	}

	stat_card(label, value) {
		return `<div class="imogi-ih-stat"><div class="imogi-ih-stat-label">${label}</div><div class="imogi-ih-stat-val">${value}</div></div>`;
	}

	paginate(rows) {
		const total = rows.length;
		const pager = imogi_pos.page_shell.render_pagination(this.page, total, this.page_size);
		const start = (pager.page - 1) * this.page_size;
		this.page = pager.page;
		return { page_rows: rows.slice(start, start + this.page_size), pager, total };
	}

	bind_pager($body, total) {
		$body.find(".imogi-web-page-prev, .imogi-web-page-next").on("click", (e) => {
			e.preventDefault();
			const $btn = $(e.currentTarget);
			if ($btn.prop("disabled") || $btn.is("[disabled]")) return;
			let next = cint($btn.data("page"));
			if (!next) {
				next = $btn.hasClass("imogi-web-page-prev") ? this.page - 1 : this.page + 1;
			}
			const max_page = Math.max(1, Math.ceil((total || 0) / this.page_size));
			next = Math.min(Math.max(1, next), max_page);
			if (next === this.page) return;
			this.page = next;
			this.render();
		});
	}

	refresh(opts = {}) {
		const quiet = !!opts.quiet;
		const $body = this.$content.find(".imogi-ih-body");
		if (!quiet) $body.html(`<div class="imogi-ih-empty">${__("Memuat...")}</div>`);

		if (this.tab === "stock") {
			frappe.call({
				method: "imogi_pos.api.planned_features_api.list_inventory_stock_api",
				args: { search: this.search || undefined, limit: 400 },
				callback: (r) => {
					if (r.exc) {
						if (!quiet) $body.html(`<div class="imogi-ih-empty">${__("Gagal memuat stok.")}</div>`);
						return;
					}
					this.stock = r.message || {};
					frappe.call({
						method: "imogi_pos.api.planned_features_api.list_inventory_adjustment_requests_api",
						callback: (r2) => {
							this.adjustment_requests = r2.exc ? { rows: [] } : r2.message || {};
							this.render();
						},
					});
				},
			});
			return;
		}

				if (this.tab === "opname") {
			frappe.call({
				method: "imogi_pos.api.planned_features_api.list_inventory_stock_api",
				args: { search: this.search || undefined, limit: 400 },
				callback: (r) => {
					if (r.exc) {
						if (!quiet) $body.html(`<div class="imogi-ih-empty">${__("Gagal memuat stok.")}</div>`);
						return;
					}
					this.stock = r.message || {};
					frappe.call({
						method: "imogi_pos.api.planned_features_api.list_inventory_opname_requests_api",
						callback: (r2) => {
							this.opname_requests = r2.exc ? { rows: [] } : r2.message || {};
							this.render();
						},
					});
				},
			});
			return;
		}

		if (this.tab === "waste") {
			frappe.call({
				method: "imogi_pos.api.planned_features_api.list_inventory_issues_api",
				callback: (r) => {
					this.issues = r.exc ? { rows: [] } : r.message || {};
					this.render();
				},
			});
			return;
		}

		if (this.tab === "batch") {
			frappe.call({
				method: "imogi_pos.api.planned_features_api.list_inventory_batches_api",
				args: { search: this.search || undefined },
				callback: (r) => {
					this.batches = r.exc ? { rows: [] } : r.message || {};
					const rows = this.batches.rows || [];
					this.expired = {
						count: rows.filter((x) => x.is_expired || x.is_expiring_soon).length,
					};
					this.render();
				},
			});
			return;
		}

		if (this.tab === "forecast") {
			frappe.call({
				method: "imogi_pos.api.planned_features_api.get_inventory_forecast_api",
				args: { days: 14 },
				callback: (r) => {
					this.forecast = r.exc ? { rows: [] } : r.message || {};
					this.render();
				},
			});
		}
	}

	render() {
		this.render_stats();
		if (this.tab === "stock") this.render_stock();
		else if (this.tab === "waste") this.render_waste();
		else if (this.tab === "batch") this.render_batch();
		else if (this.tab === "opname") this.render_opname();
		else if (this.tab === "forecast") this.render_forecast();
	}

	render_stats() {
		const s = (this.stock && this.stock.summary) || {};
		this.$content.find(".imogi-ih-stats").html(`
			<div class="imogi-ih-stat-grid">
				${this.stat_card(__("SKU Stok"), cint(s.sku_count))}
				${this.stat_card(__("Nilai Stok"), this.money(s.stock_value))}
			</div>
		`);
	}

	render_stock() {
		const $body = this.$content.find(".imogi-ih-body");
		const _view = this._stock_view || "bahan";
		if (_view === "summary") {
			$body.html(this.stock_subtabs_html(_view) + '<div class="imogi-ih-summary-slot"></div>');
			this.bind_stock_subtabs($body);
			const $slot = $body.find(".imogi-ih-summary-slot");
			if (this.summary_report) this.render_summary_content($slot);
			else this.load_and_render_summary($slot);
			return;
		}
		const data = this.stock || {};
		const rows = data.rows || [];
		const { page_rows, pager, total } = this.paginate(rows);
		if (!data.warehouse) {
			$body.html(
				`<div class="imogi-ih-empty">${
					data.message || __("Set gudang default di IMOGI POS Settings dulu.")
				}</div>`
			);
			return;
		}
		const adj_requests = (this.adjustment_requests && this.adjustment_requests.rows) || [];
		const adj_status_badge = (status) => {
			if (status === "Pending")
				return `<span class="imogi-ih-badge imogi-ih-badge--pending">${__("Pending")}</span>`;
			if (status === "Rejected")
				return `<span class="imogi-ih-badge imogi-ih-badge--rejected">${__("Rejected")}</span>`;
			return `<span class="imogi-ih-badge imogi-ih-badge--ok">${__("Approved")}</span>`;
		};
		$body.html(`
			${this.stock_subtabs_html(_view)}
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Bahan & Stok")}</div>
					<div style="align-items:center;display:flex;gap:8px">
						<span class="imogi-ih-meta">${total} ${__("item")} · ${__("Adjust per baris")}</span>
						<button type="button" class="imogi-ih-mini imogi-ih-adj-hist-btn">
							<i class="fa fa-history"></i> ${__("Riwayat")} (${adj_requests.length})
						</button>
						<button type="button" class="imogi-ih-mini imogi-ih-stock-export">
							<i class="fa fa-download"></i> ${__("Export Excel")}
						</button>
					</div>
				</div>
				<div class="imogi-rh-table-wrap" style="overflow-x:auto">
					<table class="imogi-ih-table">
						<thead>
							<tr>
								<th>${__("Bahan")}</th>
								<th>${__("On Hand")}</th>
								<th>${__("Qty Fisik")}</th>
								<th>${__("Difference")}</th>
								<th>${__("User terakhir")}</th>
								<th>${__("Waktu")}</th>
								<th>${__("Aksi")}</th>
							</tr>
						</thead>
						<tbody>
							${
								page_rows.length
									? page_rows
											.map((row) => {
												const last_user = row.last_adj_user
													? frappe.utils.escape_html(row.last_adj_user)
													: "—";
												const last_when = this.adj_when(null, row.last_adj_date);
												const adj_n = cint(row.adj_count) || 0;
												const code = frappe.utils.escape_html(row.item_code);
												const name = frappe.utils.escape_html(row.item_name);
												const uom = frappe.utils.escape_html(row.uom || "");
												const on_hand_html = `${this.qty(row.qty)} ${uom}`;
												return `<tr data-item-code="${code}" data-item-name="${name}" data-on-hand="${flt(
													row.qty
												)}" data-uom="${uom}">
													<td>
														<div class="imogi-ih-name">${name}${
													row.is_low
														? ` <span class="imogi-ih-badge imogi-ih-badge--warn">${__("Low Stock")}</span>`
														: ""
												}</div>
														<div class="imogi-ih-sub">${code}${
													row.has_batch_no ? ` · ${__("Batch")}` : ""
												}${adj_n ? ` · ${adj_n}× adj` : ""}</div>
													</td>
													<td class="imogi-ih-num">${on_hand_html}</td>
													<td>
														<input type="number" min="0" step="0.001" class="imogi-ih-row-qty" value="${flt(
															row.qty
														)}" title="${__("Isi qty hasil hitung fisik")}">
													</td>
													<td class="imogi-ih-num imogi-ih-row-after" data-base="0 ${uom}">0 ${uom}</td>
													<td class="imogi-ih-user imogi-ih-row-user" data-base="${last_user}">${last_user}</td>
													<td class="imogi-ih-num imogi-ih-when imogi-ih-row-when" data-base="${frappe.utils.escape_html(
														last_when
													)}">${frappe.utils.escape_html(last_when)}</td>
													<td>
														<div class="imogi-ih-actions">
															<button type="button" class="imogi-ih-mini imogi-ih-mini--apply imogi-ih-row-apply">
																<i class="fa fa-check"></i> ${__("Apply")}
															</button>
															<button type="button" class="imogi-ih-mini imogi-ih-row-clear">
																<i class="fa fa-times"></i> ${__("Clear")}
															</button>
															<button type="button" class="imogi-ih-mini imogi-ih-row-history">
																<i class="fa fa-history"></i> ${__("History")}
															</button>
														</div>
													</td>
												</tr>`;
											})
											.join("")
									: `<tr><td colspan="7" class="imogi-ih-empty">${__("Tidak ada item.")}</td></tr>`
							}
						</tbody>
					</table>
				</div>
				${pager.html}
			</div>
		`);
		this.bind_stock_subtabs($body);
		this.bind_pager($body, total);
		$body.find(".imogi-ih-stock-export").on("click", () => {
			open_url_post("/api/method/imogi_pos.api.planned_features_api.export_inventory_stock_excel", {
				warehouse: data.warehouse || undefined,
			});
		});
		const current_user_label = frappe.session.user_fullname || frappe.session.user;
		const update_row_preview = ($tr, val_str) => {
			const $after = $tr.find(".imogi-ih-row-after");
			const $user = $tr.find(".imogi-ih-row-user");
			const $when = $tr.find(".imogi-ih-row-when");
			const $cells = $after.add($user).add($when);
			const on_hand = flt($tr.data("on-hand"));
			const uom = $tr.data("uom") || "";
			const diff = val_str === "" || val_str === null ? 0 : flt(val_str) - on_hand;
			if (!diff) {
				$after.html(`0 ${uom}`);
				$user.text($user.data("base"));
				$when.text($when.data("base"));
				$cells.removeClass("imogi-ih-pending-up imogi-ih-pending-down");
				return;
			}
			const pending_cls = diff > 0 ? "imogi-ih-pending-up" : "imogi-ih-pending-down";
			$after.html(`${this.qty(diff)} ${uom}`);
			$user.text(current_user_label);
			$when.text(__("Belum disimpan"));
			$cells
				.removeClass("imogi-ih-pending-up imogi-ih-pending-down")
				.addClass(pending_cls);
		};
		// Baris yang belum di-Apply (masih diketik) gak boleh ilang pas baris lain
		// di-Apply dan tabel ini di-render ulang — restore dari state yang disimpan.
		$body.find("tbody tr[data-item-code]").each((_, el) => {
			const $tr = $(el);
			const item_code = ($tr.attr("data-item-code") || "").trim();
			const pending_val = this._pending_adjust[item_code];
			if (pending_val === undefined) return;
			$tr.find(".imogi-ih-row-qty").val(pending_val);
			update_row_preview($tr, pending_val);
		});
		$body.on("input", ".imogi-ih-row-qty", (e) => {
			const $input = $(e.currentTarget);
			const $tr = $input.closest("tr");
			const item_code = ($tr.attr("data-item-code") || "").trim();
			const val_str = $input.val();
			const on_hand = flt($tr.data("on-hand"));
			if (val_str === "" || flt(val_str) === on_hand) {
				delete this._pending_adjust[item_code];
			} else {
				this._pending_adjust[item_code] = val_str;
			}
			update_row_preview($tr, val_str);
		});
		$body.find(".imogi-ih-row-apply").on("click", (e) => {
			const $tr = $(e.currentTarget).closest("tr");
			const item_code = ($tr.attr("data-item-code") || "").trim();
			const val_str = $tr.find(".imogi-ih-row-qty").val();
			if (!item_code || val_str === "") {
				frappe.msgprint(__("Isi qty fisik dulu."));
				return;
			}
			const qty_fisik = flt(val_str);
			const on_hand = flt($tr.data("on-hand"));
			if (qty_fisik === on_hand) {
				frappe.msgprint(__("Qty fisik sama dengan qty sistem, tidak ada yang perlu disesuaikan."));
				return;
			}
			frappe.prompt(
				[
					{
						fieldname: "reason",
						label: __("Alasan"),
						fieldtype: "Data",
						reqd: 1,
					},
				],
				(values) => {
					frappe.call({
						method: "imogi_pos.api.planned_features_api.create_inventory_adjustment_api",
						args: {
							item_code,
							qty_fisik,
							reason: (values.reason || "").trim(),
						},
						freeze: true,
						callback: (r) => {
							if (r.exc) return;
							frappe.show_alert({
								message: __("Adjustment tersimpan: {0}", [r.message.stock_entry]),
								indicator: "green",
							});
							delete this._pending_adjust[item_code];
							this.adjustment_requests = null;
							this.refresh();
						},
					});
				},
				__("Apply Adjustment"),
				__("Apply")
			);
		});
		$body.find(".imogi-ih-row-clear").on("click", (e) => {
			const $tr = $(e.currentTarget).closest("tr");
			const item_code = ($tr.attr("data-item-code") || "").trim();
			const on_hand = flt($tr.data("on-hand"));
			$tr.find(".imogi-ih-row-qty").val(on_hand);
			delete this._pending_adjust[item_code];
			update_row_preview($tr, String(on_hand));
		});
		$body.find(".imogi-ih-row-history").on("click", (e) => {
			const $tr = $(e.currentTarget).closest("tr");
			this.show_item_stock_history(
				($tr.attr("data-item-code") || "").trim(),
				($tr.attr("data-item-name") || "").trim()
			);
		});
		$body.find(".imogi-ih-adj-hist-btn").on("click", () => {
			const page_size = 10;
			let page = 1;
			const hist_total = adj_requests.length;
			const d = new frappe.ui.Dialog({
				title: __("Riwayat Adjustment (Semua Item)"),
				size: "extra-large",
				fields: [{ fieldtype: "HTML", fieldname: "hist" }],
			});
			const render_hist_page = () => {
				const total_pages = Math.max(1, Math.ceil(hist_total / page_size));
				page = Math.min(Math.max(1, page), total_pages);
				const start = (page - 1) * page_size;
				const hist_rows = adj_requests.slice(start, start + page_size);
				const pager = imogi_pos.page_shell.render_pagination(page, hist_total, page_size);
				const rows_html = hist_rows.length
					? hist_rows
							.map((row) => {
								const doc_link = row.stock_entry
									? `<a class="imogi-ih-hist-doc" href="/app/stock-entry/${encodeURIComponent(
											row.stock_entry
									  )}" target="_blank" rel="noopener">${frappe.utils.escape_html(row.stock_entry)}</a>`
									: `<a class="imogi-ih-hist-doc" href="/app/imogi-pos-approval-request/${encodeURIComponent(
											row.name
									  )}" target="_blank" rel="noopener">${frappe.utils.escape_html(row.name)}</a>`;
								const q = flt(row.qty);
								const qty_cls =
									q > 0
										? "imogi-ih-hist-qty imogi-ih-hist-qty--up"
										: q < 0
											? "imogi-ih-hist-qty imogi-ih-hist-qty--down"
											: "imogi-ih-hist-qty";
								return `<tr>
									<td>${doc_link}</td>
									<td>${adj_status_badge(row.status || "Approved")}</td>
									<td class="imogi-ih-when">${frappe.utils.escape_html(
										this.adj_when(row.creation, row.posting_date)
									)}</td>
									<td title="${frappe.utils.escape_html(row.item_name || "")}">${frappe.utils.escape_html(
										row.item_name || ""
									)}</td>
									<td class="${qty_cls}">${this.qty(row.qty)} ${frappe.utils.escape_html(row.uom || "")}</td>
									<td title="${frappe.utils.escape_html(row.owner_name || "—")}">${frappe.utils.escape_html(
										row.owner_name || "—"
									)}</td>
									<td class="imogi-ih-hist-reason" title="${frappe.utils.escape_html(
										row.remarks || "—"
									)}">${frappe.utils.escape_html(row.remarks || "—")}</td>
								</tr>`;
							})
							.join("")
					: `<tr><td colspan="7" class="imogi-ih-hist-empty">${__("Belum ada adjustment.")}</td></tr>`;
				d.fields_dict.hist.$wrapper.html(`
					<div class="imogi-inventory-hub">
						<div class="imogi-ih-hist">
							<div class="imogi-ih-hist-summary">
								<span><strong>${hist_total}</strong> ${__("adjustment")}</span>
							</div>
							<div class="imogi-ih-hist-wrap">
								<table class="imogi-ih-hist-table">
									<colgroup>
										<col style="width:16%">
										<col style="width:11%">
										<col style="width:14%">
										<col style="width:18%">
										<col style="width:11%">
										<col style="width:13%">
										<col style="width:17%">
									</colgroup>
									<thead>
										<tr>
											<th>${__("Dokumen")}</th>
											<th>${__("Status")}</th>
											<th>${__("Waktu")}</th>
											<th>${__("Item")}</th>
											<th>${__("Qty")}</th>
											<th>${__("User")}</th>
											<th>${__("Alasan")}</th>
										</tr>
									</thead>
									<tbody>${rows_html}</tbody>
								</table>
							</div>
						</div>
					</div>
					<div style="margin-top:12px">${pager.html}</div>
				`);
				d.fields_dict.hist.$wrapper
					.find(".imogi-web-page-prev, .imogi-web-page-next")
					.on("click", (e) => {
						e.preventDefault();
						const $btn = $(e.currentTarget);
						if ($btn.prop("disabled") || $btn.is("[disabled]")) return;
						let next = cint($btn.data("page"));
						if (!next) next = $btn.hasClass("imogi-web-page-prev") ? page - 1 : page + 1;
						next = Math.min(Math.max(1, next), total_pages);
						if (next === page) return;
						page = next;
						render_hist_page();
					});
			};
			render_hist_page();
			d.show();
		});
	}

	show_item_stock_history(item_code, item_name) {
		if (!item_code) return;
		const VOUCHER_ROUTES = {
			"Purchase Receipt": "purchase-receipt",
			"POS Invoice": "pos-invoice",
			"Sales Invoice": "sales-invoice",
			"Delivery Note": "delivery-note",
			"Stock Entry": "stock-entry",
			"Stock Reconciliation": "stock-reconciliation",
		};
		frappe.call({
			method: "imogi_pos.api.planned_features_api.list_inventory_stock_ledger_api",
			args: { item_code, limit: 100 },
			freeze: true,
			callback: (r) => {
				if (r.exc) return;
				const data = r.message || {};
				const hist = data.rows || [];
				const users = (data.users || []).join(", ") || "—";
				const count = cint(data.count) || hist.length;
				// Rows are sorted newest-first, so the top row's balance is the current saldo.
				const latest_saldo = hist.length ? flt(hist[0].balance_after) : null;
				const loc_cell = (wh) => {
					const label = (wh || "").trim();
					if (!label) {
						return `<td class="imogi-ih-hist-loc imogi-ih-hist-loc--empty">—</td>`;
					}
					return `<td class="imogi-ih-hist-loc" title="${frappe.utils.escape_html(
						label
					)}">${frappe.utils.escape_html(label)}</td>`;
				};
				const d = new frappe.ui.Dialog({
					title: __("Riwayat Stok — {0}", [item_name || item_code]),
					size: "extra-large",
					fields: [{ fieldtype: "HTML", fieldname: "hist" }],
				});
				const rows_html = hist.length
					? hist
							.map((row) => {
								const q = flt(row.qty);
								const qty_cls =
									q > 0
										? "imogi-ih-hist-qty imogi-ih-hist-qty--up"
										: q < 0
											? "imogi-ih-hist-qty imogi-ih-hist-qty--down"
											: "imogi-ih-hist-qty";
								const route = VOUCHER_ROUTES[row.voucher_type] || "stock-entry";
								return `<tr>
									<td>
										<a class="imogi-ih-hist-doc" href="/app/${route}/${encodeURIComponent(
											row.name
										)}" target="_blank" rel="noopener">
											${frappe.utils.escape_html(row.name)}
										</a>
									</td>
									<td class="imogi-ih-when">${frappe.utils.escape_html(
										this.adj_when(null, row.posting_date)
									)}</td>
									${loc_cell(row.from_warehouse)}
									${loc_cell(row.to_warehouse)}
									<td class="${qty_cls}">${this.qty(row.qty)} ${frappe.utils.escape_html(row.uom || "")}</td>
									<td class="imogi-ih-hist-loc">${flt(row.balance_after)}</td>
									<td title="${frappe.utils.escape_html(row.owner_name || row.owner || "—")}">${frappe.utils.escape_html(
										row.owner_name || row.owner || "—"
									)}</td>
									<td class="imogi-ih-hist-reason" title="${frappe.utils.escape_html(row.remarks || "—")}">${frappe.utils.escape_html(
										row.remarks || "—"
									)}</td>
								</tr>`;
							})
							.join("")
					: `<tr><td colspan="8" class="imogi-ih-hist-empty">${__(
							"Belum ada mutasi stok untuk item ini."
					  )}</td></tr>`;
				d.fields_dict.hist.$wrapper.html(`
					<div class="imogi-ih-hist">
						<div class="imogi-ih-hist-summary">
							<span><strong>${count}</strong> ${__("mutasi")}</span>
							${
								latest_saldo !== null
									? `<span>${__("Saldo Saat Ini")}: <strong>${latest_saldo}</strong></span>`
									: ""
							}
							<span>${__("Oleh")}: <strong>${frappe.utils.escape_html(users)}</strong></span>
							<button type="button" class="imogi-ih-hist-export" style="align-items:center;appearance:none;background:#fff;border:1px solid #cbd5e1;border-radius:6px;color:#475569;cursor:pointer;display:inline-flex;font-size:11px;font-weight:700;gap:5px;height:30px;margin-left:auto;padding:0 10px">
								<i class="fa fa-download"></i> ${__("Export Excel")}
							</button>
						</div>
						<div class="imogi-ih-hist-wrap">
							<table class="imogi-ih-hist-table">
								<colgroup>
									<col class="c-doc">
									<col class="c-date">
									<col class="c-from">
									<col class="c-to">
									<col class="c-qty">
									<col class="c-saldo">
									<col class="c-user">
									<col class="c-reason">
								</colgroup>
								<thead>
									<tr>
										<th>${__("Dokumen")}</th>
										<th>${__("Waktu")}</th>
										<th>${__("From")}</th>
										<th>${__("To")}</th>
										<th>${__("Qty")}</th>
										<th>${__("Saldo")}</th>
										<th>${__("User")}</th>
										<th>${__("Keterangan")}</th>
									</tr>
								</thead>
								<tbody>${rows_html}</tbody>
							</table>
						</div>
					</div>
				`);
				d.fields_dict.hist.$wrapper.find(".imogi-ih-hist-export").on("click", () => {
					// open_url_post stringifies every param (including `undefined`, which
					// becomes the literal text "undefined"), so pass "" rather than
					// undefined/null when there's no warehouse filter.
					open_url_post(
						"/api/method/imogi_pos.api.planned_features_api.export_inventory_stock_ledger_excel",
						{ item_code, warehouse: data.warehouse || "" }
					);
				});
				d.show();
			},
		});
	}

	/** Sub-tab bar shared by the two tables that live under "Koreksi Stok": Bahan & Stok, Summary Stock. */
	stock_subtabs_html(view) {
		return `
			<div class="imogi-ih-subtabs">
				<button type="button" class="imogi-ih-subtab${
					view === "bahan" ? " is-active" : ""
				}" data-view="bahan">${__("Bahan & Stok")}</button>
				<button type="button" class="imogi-ih-subtab${
					view === "summary" ? " is-active" : ""
				}" data-view="summary">${__("Summary Stock")}</button>
			</div>
		`;
	}

	bind_stock_subtabs($body) {
		$body.find(".imogi-ih-subtab").on("click", (e) => {
			const view = $(e.currentTarget).data("view");
			if (view === this._stock_view) return;
			this._stock_view = view;
			this.page = 1;
			this.render();
		});
	}

	load_and_render_summary($container) {
		if (!this._summary_to) this._summary_to = frappe.datetime.get_today();
		if (!this._summary_from) {
			const d = new Date();
			this._summary_from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
		}
		$container.html(`<div class="imogi-ih-empty">${__("Memuat...")}</div>`);
		frappe.call({
			method: "imogi_pos.api.planned_features_api.get_inventory_stock_summary_api",
			args: {
				from_date: this._summary_from,
				to_date: this._summary_to,
				warehouse: this._summary_warehouse || undefined,
				search: this.search || undefined,
			},
			callback: (r) => {
				if (r.exc) {
					$container.html(`<div class="imogi-ih-empty">${__("Gagal memuat summary.")}</div>`);
					return;
				}
				this.summary_report = r.message || {};
				this.render_summary_content($container);
			},
		});
	}

	render_summary_content($container) {
		const data = this.summary_report || {};
		const rows = data.rows || [];
		const { page_rows, pager, total } = this.paginate(rows);
		const from_val = this._summary_from || "";
		const to_val = this._summary_to || "";
		$container.html(`
			<div class="imogi-web-panel imogi-web-panel--form">
				<div class="imogi-web-panel-head"><div class="imogi-web-panel-title">${__("Filter Periode")}</div></div>
				<div class="imogi-ih-form">
					<div><label>${__("Dari Tanggal")}</label><input type="date" class="imogi-ih-summary-from" value="${from_val}"></div>
					<div><label>${__("Sampai Tanggal")}</label><input type="date" class="imogi-ih-summary-to" value="${to_val}"></div>
					<div><label>${__("Gudang (opsional)")}</label><div class="imogi-ih-summary-wh-link"></div></div>
					<div style="align-items:flex-end;display:flex;gap:8px">
						<button type="button" class="imogi-ih-mini imogi-ih-mini--apply imogi-ih-summary-apply">${__("Terapkan")}</button>
						<button type="button" class="imogi-ih-mini imogi-ih-summary-export"><i class="fa fa-download"></i> ${__("Export Excel")}</button>
					</div>
				</div>
			</div>
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Summary Stock")}</div>
					<span class="imogi-ih-meta">${total} ${__("baris")} \u00b7 ${frappe.utils.escape_html(from_val)} s/d ${frappe.utils.escape_html(to_val)}</span>
				</div>
				<div style="overflow-x:auto">
					<table class="imogi-ih-table">
						<thead>
							<tr>
								<th>${__("Produk")}</th>
								<th>${__("Gudang")}</th>
								<th>${__("Saldo Awal")}</th>
								<th>${__("Total In")}</th>
								<th>${__("Total Out")}</th>
								<th>${__("Adjustment")}</th>
								<th>${__("Saldo Akhir")}</th>
							</tr>
						</thead>
						<tbody>
							${
								page_rows.length
									? page_rows
											.map((r) => {
												const adj = flt(r.adjustment);
												const adj_cls =
													adj > 0 ? "imogi-ih-pending-up" : adj < 0 ? "imogi-ih-pending-down" : "";
												return `<tr>
													<td>
														<div class="imogi-ih-name">${frappe.utils.escape_html(r.item_name || r.item_code)}</div>
														<div class="imogi-ih-sub">${frappe.utils.escape_html(r.item_code)}</div>
													</td>
													<td>${frappe.utils.escape_html(r.warehouse || "\u2014")}</td>
													<td class="imogi-ih-num">${this.qty(r.opening)}</td>
													<td class="imogi-ih-num">${this.qty(r.total_in)}</td>
													<td class="imogi-ih-num">${this.qty(r.total_out)}</td>
													<td class="imogi-ih-num ${adj_cls}">${this.qty(r.adjustment)}</td>
													<td class="imogi-ih-num"><strong>${this.qty(r.closing)}</strong></td>
												</tr>`;
											})
											.join("")
									: `<tr><td colspan="7" class="imogi-ih-empty">${__("Belum ada data untuk periode ini.")}</td></tr>`
							}
						</tbody>
					</table>
				</div>
				${pager.html}
			</div>
		`);
		this.bind_pager($container, total);
		const wh_ctrl = this.make_link($container.find(".imogi-ih-summary-wh-link"), {
			options: "Warehouse",
			fieldname: "warehouse",
		});
		if (this._summary_warehouse) wh_ctrl.set_value(this._summary_warehouse);
		$container.find(".imogi-ih-summary-apply").on("click", () => {
			this._summary_from = $container.find(".imogi-ih-summary-from").val() || this._summary_from;
			this._summary_to = $container.find(".imogi-ih-summary-to").val() || this._summary_to;
			this._summary_warehouse = wh_ctrl.get_value() || "";
			this.page = 1;
			this.load_and_render_summary($container);
		});
		$container.find(".imogi-ih-summary-export").on("click", () => {
			// open_url_post stringifies every param (undefined becomes the literal
			// text "undefined"), so always pass "" instead of undefined/null here.
			open_url_post("/api/method/imogi_pos.api.planned_features_api.export_inventory_stock_summary_excel", {
				from_date: this._summary_from || "",
				to_date: this._summary_to || "",
				warehouse: this._summary_warehouse || "",
				search: this.search || "",
			});
		});
	}

	render_waste() {
		const $body = this.$content.find(".imogi-ih-body");
		const rows = (this.issues && this.issues.rows) || [];
		const pending_count = cint(this.issues && this.issues.pending_count) || 0;
		const kind_badge = (kind) =>
			kind === "spoilage"
				? `<span class="imogi-ih-badge imogi-ih-badge--warn">${__("Spoilage")}</span>`
				: `<span class="imogi-ih-badge imogi-ih-badge--danger">${__("Waste")}</span>`;
		const status_badge = (status) => {
			if (status === "Pending")
				return `<span class="imogi-ih-badge imogi-ih-badge--pending">${__("Pending")}</span>`;
			if (status === "Rejected")
				return `<span class="imogi-ih-badge imogi-ih-badge--rejected">${__("Rejected")}</span>`;
			return `<span class="imogi-ih-badge imogi-ih-badge--ok">${__("Approved")}</span>`;
		};
		const proof_html = (atts) => {
			const list = atts || [];
			if (!list.length) return `<span class="imogi-ih-sub">${__("—")}</span>`;
			return `<div class="imogi-ih-proof">${list
				.map(
					(a) =>
						`<a class="imogi-ih-proof-chip" href="${frappe.utils.escape_html(
							a.file_url
						)}" target="_blank" rel="noopener">${frappe.utils.escape_html(
							a.file_name || a.file_url
						)}</a>`
				)
				.join("")}</div>`;
		};
		$body.html(`
			<div class="imogi-web-panel imogi-web-panel--form">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Catat Waste / Spoilage")}</div>
					<span class="imogi-ih-meta">${__("Butuh approval · stok belum potong")}</span>
				</div>
				<div class="imogi-ih-waste-layout">
					<div class="imogi-ih-waste-fields">
						<div class="imogi-ih-w-span2">
							<label>${__("Item")}</label>
							<div class="imogi-ih-w-item-link"></div>
						</div>
						<div>
							<label>${__("Qty")}</label>
							<div class="imogi-ih-w-qty-wrap">
								<input type="number" min="0.001" step="0.001" class="imogi-ih-w-qty" value="1">
								<span class="imogi-ih-w-uom-badge">—</span>
							</div>
						</div>
						<div>
							<label>${__("Alasan")}</label>
							<input type="text" class="imogi-ih-w-reason" placeholder="${__("Contoh: kadaluarsa / tumpah")}">
						</div>
					</div>
					<div class="imogi-ih-waste-proof">
						<label>${__("Bukti")} <span style="color:#dc2626">*</span></label>
						<div class="imogi-ih-attach-box imogi-ih-w-upload" role="button" tabindex="0">
							<div class="imogi-ih-attach-ico">${__("Foto")}</div>
							<div class="imogi-ih-attach-title">${__("Upload foto / dokumen")}</div>
							<div class="imogi-ih-attach-hint">${__("JPG, PNG, WEBP, atau PDF · bisa lebih dari satu")}</div>
							<ul class="imogi-ih-attach-list imogi-ih-w-files"></ul>
						</div>
					</div>
				</div>
				<div class="imogi-ih-waste-actions">
					<span class="imogi-ih-waste-actions-hint">${__("Setelah diajukan, status jadi Pending sampai HO approve.")}</span>
					<button type="button" class="imogi-ih-btn imogi-ih-w-save">${__("Ajukan ke HO")}</button>
				</div>
			</div>
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Riwayat Waste & Spoilage")}</div>
					<div style="align-items:center;display:flex;gap:8px">
						${
							pending_count
								? `<span class="imogi-ih-hist-meta-chip">${pending_count} ${__("pending")}</span>`
								: ""
						}
						<span class="imogi-ih-meta">${rows.length} ${__("dokumen")}</span>
						<button type="button" class="imogi-ih-mini imogi-ih-waste-export">
							<i class="fa fa-download"></i> ${__("Export Excel")}
						</button>
					</div>
				</div>
				<div style="overflow-x:auto">
					<table class="imogi-ih-table">
						<thead>
							<tr>
								<th>${__("Dokumen")}</th>
								<th>${__("Status")}</th>
								<th>${__("Jenis")}</th>
								<th>${__("Waktu")}</th>
								<th>${__("Item")}</th>
								<th>${__("Bukti")}</th>
								<th>${__("Nilai")}</th>
								<th>${__("Keterangan")}</th>
								<th>${__("Aksi")}</th>
							</tr>
						</thead>
						<tbody>
							${
								rows.length
									? rows
											.map((row) => {
												const items = (row.items || [])
													.map((i) => `${frappe.utils.escape_html(i.item_name)} (${this.qty(i.qty)})`)
													.join(", ");
												const doc_link = row.stock_entry
													? `<a class="imogi-ih-doc-link" href="/app/stock-entry/${encodeURIComponent(
															row.stock_entry
													  )}">${frappe.utils.escape_html(row.stock_entry)}</a>`
													: `<a class="imogi-ih-doc-link" href="/app/imogi-pos-approval-request/${encodeURIComponent(
															row.name
													  )}">${frappe.utils.escape_html(row.name)}</a>`;
												const actions =
													row.can_approve
														? `<div class="imogi-ih-actions">
															<button type="button" class="imogi-ih-mini imogi-ih-mini--approve imogi-ih-w-approve" data-request="${frappe.utils.escape_html(
																row.approval_request || row.name
															)}">${__("Approve")}</button>
															<button type="button" class="imogi-ih-mini imogi-ih-mini--reject imogi-ih-w-reject" data-request="${frappe.utils.escape_html(
																row.approval_request || row.name
															)}">${__("Reject")}</button>
														</div>`
														: `<span class="imogi-ih-sub">—</span>`;
												const row_cls =
													row.status === "Pending"
														? "imogi-ih-row--pending"
														: row.status === "Rejected"
															? "imogi-ih-row--rejected"
															: "";
												return `<tr class="${row_cls}">
													<td>${doc_link}</td>
													<td>${status_badge(row.status || "Approved")}</td>
													<td>${kind_badge(row.kind)}</td>
													<td class="imogi-ih-when">${frappe.utils.escape_html(
														this.adj_when(row.creation, row.posting_date)
													)}</td>
													<td>${items || "—"}</td>
													<td>${proof_html(row.attachments)}</td>
													<td class="imogi-ih-num">${
														row.status === "Pending" || row.status === "Rejected"
															? "—"
															: this.money(row.total_value)
													}</td>
													<td class="imogi-ih-sub">${frappe.utils.escape_html(row.remarks || "")}</td>
													<td>${actions}</td>
												</tr>`;
											})
											.join("")
									: `<tr><td colspan="9" class="imogi-ih-empty">${__("Belum ada waste/spoilage.")}</td></tr>`
							}
						</tbody>
					</table>
				</div>
			</div>
		`);
		$body.find(".imogi-ih-waste-export").on("click", () => {
			open_url_post("/api/method/imogi_pos.api.planned_features_api.export_inventory_waste_excel", {
				limit: 200,
			});
		});
		const waste_item_ctrl = this.make_link($body.find(".imogi-ih-w-item-link"), {
			options: "Item",
			fieldname: "item_code",
			filters: { disabled: 0, is_stock_item: 1, is_sales_item: 0, has_variants: 0 },
			onchange: () => {
				const $uom = $body.find(".imogi-ih-w-uom-badge");
				const item_code = (waste_item_ctrl.get_value() || "").trim();
				if (!item_code) {
					$uom.text("—");
					return;
				}
				frappe.db.get_value("Item", item_code, "stock_uom", (r) => {
					$uom.text((r && r.stock_uom) || "—");
				});
			},
		});
		const uploaded = [];
		const render_files = () => {
			const $list = $body.find(".imogi-ih-w-files");
			const $box = $body.find(".imogi-ih-attach-box");
			$box.toggleClass("is-ready", uploaded.length > 0);
			if (!uploaded.length) {
				$list.html(`<li class="imogi-ih-attach-empty">${__("Belum ada file dipilih.")}</li>`);
				return;
			}
			$list.html(
				uploaded
					.map(
						(f, idx) =>
							`<li>
								<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${frappe.utils.escape_html(
									f.file_name || f.file_url
								)}</span>
								<button type="button" class="imogi-ih-mini imogi-ih-w-file-rm" data-idx="${idx}" style="height:24px;padding:0 8px">${__(
									"Hapus"
								)}</button>
							</li>`
					)
					.join("")
			);
		};
		render_files();
		const open_uploader = () => {
			new frappe.ui.FileUploader({
				allow_multiple: true,
				restrictions: {
					allowed_file_types: ["image/*", ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".heic"],
				},
				on_success(file) {
					if (!file || !file.file_url) return;
					if (uploaded.some((x) => x.file_url === file.file_url)) return;
					uploaded.push({
						file_url: file.file_url,
						file_name: file.file_name || file.file_url,
					});
					render_files();
					frappe.show_alert({
						message: __("Bukti ditambahkan: {0}", [file.file_name || file.file_url]),
						indicator: "green",
					});
				},
			});
		};
		$body.find(".imogi-ih-w-upload").on("click", (e) => {
			if ($(e.target).closest(".imogi-ih-w-file-rm").length) return;
			open_uploader();
		});
		$body.find(".imogi-ih-w-upload").on("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				open_uploader();
			}
		});
		$body.off("click.ihWasteFileRm").on("click.ihWasteFileRm", ".imogi-ih-w-file-rm", (e) => {
			e.preventDefault();
			e.stopPropagation();
			const idx = cint($(e.currentTarget).data("idx"));
			uploaded.splice(idx, 1);
			render_files();
		});
		$body.find(".imogi-ih-w-save").on("click", () => {
			const item_code = (waste_item_ctrl.get_value() || "").trim();
			const qty = flt($body.find(".imogi-ih-w-qty").val());
			const kind = "waste";
			const reason = ($body.find(".imogi-ih-w-reason").val() || "").trim();
			if (!item_code || qty <= 0) {
				frappe.msgprint(__("Isi item dan qty."));
				return;
			}
			if (!uploaded.length) {
				frappe.msgprint(__("Upload bukti (foto/dokumen) wajib."));
				return;
			}
			frappe.call({
				method: "imogi_pos.api.planned_features_api.create_inventory_waste_api",
				args: {
					item_code,
					qty,
					kind,
					reason: reason || undefined,
					file_urls: uploaded.map((f) => f.file_url),
				},
				freeze: true,
				callback: (r) => {
					if (r.exc) return;
					frappe.show_alert({
						message: r.message && r.message.message
							? r.message.message
							: __("Pengajuan menunggu approval: {0}", [
									(r.message && r.message.approval_request) || "",
							  ]),
						indicator: "blue",
					});
					this.refresh();
				},
			});
		});
		$body.find(".imogi-ih-w-approve").on("click", (e) => {
			const request_name = ($(e.currentTarget).data("request") || "").trim();
			if (!request_name) return;
			const d = new frappe.ui.Dialog({
				title: __("Approve Waste / Spoilage"),
				fields: [
					{
						fieldtype: "HTML",
						options: `<p>${__(
							"Stok akan berkurang setelah approve. Role HO boleh tanpa PIN; selain itu isi PIN supervisor."
						)}</p>`,
					},
					{
						fieldname: "pin",
						fieldtype: "Password",
						label: __("PIN Supervisor (opsional untuk HO)"),
					},
				],
				primary_action_label: __("Approve"),
				primary_action: (values) => {
					frappe.call({
						method: "imogi_pos.api.planned_features_api.approve_inventory_waste_api",
						args: { request_name, pin: values.pin || undefined },
						freeze: true,
						callback: (r) => {
							if (r.exc) return;
							d.hide();
							frappe.show_alert({
								message: __("Disetujui. Stok entry: {0}", [
									(r.message && r.message.stock_entry) || "—",
								]),
								indicator: "green",
							});
							this.issues = null;
							this.refresh();
						},
					});
				},
			});
			d.show();
		});
		$body.find(".imogi-ih-w-reject").on("click", (e) => {
			const request_name = ($(e.currentTarget).data("request") || "").trim();
			if (!request_name) return;
			const d = new frappe.ui.Dialog({
				title: __("Reject Waste / Spoilage"),
				fields: [
					{
						fieldname: "reason",
						fieldtype: "Small Text",
						label: __("Alasan reject"),
						reqd: 1,
					},
					{
						fieldname: "pin",
						fieldtype: "Password",
						label: __("PIN Supervisor (opsional untuk HO)"),
					},
				],
				primary_action_label: __("Reject"),
				primary_action: (values) => {
					frappe.call({
						method: "imogi_pos.api.planned_features_api.reject_inventory_waste_api",
						args: {
							request_name,
							pin: values.pin || undefined,
							reason: values.reason,
						},
						freeze: true,
						callback: (r) => {
							if (r.exc) return;
							d.hide();
							frappe.show_alert({
								message: __("Pengajuan ditolak."),
								indicator: "orange",
							});
							this.issues = null;
							this.refresh();
						},
					});
				},
			});
			d.show();
		});
	}

	render_batch() {
		const $body = this.$content.find(".imogi-ih-body");
		const batches = (this.batches && this.batches.rows) || [];
		const { page_rows, pager, total } = this.paginate(batches);
		$body.html(`
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Batch & Expired Monitoring")}</div>
					<div style="align-items:center;display:flex;gap:8px">
						<span class="imogi-ih-meta">${total} ${__("batch")}</span>
						<button type="button" class="imogi-ih-mini imogi-ih-batch-export">
							<i class="fa fa-download"></i> ${__("Export Excel")}
						</button>
					</div>
				</div>
				<div style="overflow-x:auto">
					<table class="imogi-ih-table">
						<thead>
							<tr>
								<th>${__("Batch")}</th>
								<th>${__("Item")}</th>
								<th>${__("Qty")}</th>
								<th>${__("Expiry")}</th>
								<th>${__("Status")}</th>
							</tr>
						</thead>
						<tbody>
							${
								page_rows.length
									? page_rows
											.map((row) => {
												let badge = `<span class="imogi-ih-badge imogi-ih-badge--ok">${__("OK")}</span>`;
												if (row.is_expired)
													badge = `<span class="imogi-ih-badge imogi-ih-badge--danger">${__(
														"Expired"
													)}</span>`;
												else if (row.is_expiring_soon)
													badge = `<span class="imogi-ih-badge imogi-ih-badge--warn">${__(
														"≤14 hari"
													)}</span>`;
												return `<tr>
													<td>
														<div class="imogi-ih-name">${frappe.utils.escape_html(row.batch_id)}</div>
														<div class="imogi-ih-sub">${frappe.utils.escape_html(row.name)}</div>
													</td>
													<td>${frappe.utils.escape_html(row.item || "—")}</td>
													<td class="imogi-ih-num">${this.qty(row.batch_qty)}</td>
													<td>${frappe.utils.escape_html(row.expiry_date || "—")}${
													row.days_left != null
														? ` <span class="imogi-ih-sub">(${row.days_left}d)</span>`
														: ""
												}</td>
													<td>${badge}</td>
												</tr>`;
											})
											.join("")
									: `<tr><td colspan="5" class="imogi-ih-empty">${__(
											"Belum ada batch. Aktifkan Has Batch No di Item."
									  )}</td></tr>`
							}
						</tbody>
					</table>
				</div>
				${pager.html}
			</div>
		`);
		this.bind_pager($body, total);
		$body.find(".imogi-ih-batch-export").on("click", () => {
			open_url_post("/api/method/imogi_pos.api.planned_features_api.export_inventory_batch_excel", {
				limit: 500,
			});
		});
	}

	render_opname() {
		const $body = this.$content.find(".imogi-ih-body");
		const rows = ((this.stock && this.stock.rows) || []).slice(0, 40);
		const { page_rows, pager, total } = this.paginate(rows);
		const requests = (this.opname_requests && this.opname_requests.rows) || [];
		const pending = requests.filter((r) => r.status === "Pending");
		const status_badge = (status) => {
			if (status === "Pending")
				return `<span class="imogi-ih-badge imogi-ih-badge--pending">${__("Pending")}</span>`;
			if (status === "Rejected")
				return `<span class="imogi-ih-badge imogi-ih-badge--rejected">${__("Rejected")}</span>`;
			return `<span class="imogi-ih-badge imogi-ih-badge--ok">${__("Approved")}</span>`;
		};
		const proof_html = (atts) => {
			const list = atts || [];
			if (!list.length) return `<span class="imogi-ih-sub">${__("—")}</span>`;
			return `<div class="imogi-ih-proof">${list
				.map(
					(a) =>
						`<a class="imogi-ih-proof-chip" href="${frappe.utils.escape_html(
							a.file_url
						)}" target="_blank" rel="noopener">${frappe.utils.escape_html(
							a.file_name || a.file_url
						)}</a>`
				)
				.join("")}</div>`;
		};
		$body.html(`
			${
				pending.length
					? `<div class="imogi-web-panel imogi-web-panel--form">
						<div class="imogi-web-panel-head">
							<div class="imogi-web-panel-title">${__("Perlu Approval")}</div>
							<span class="imogi-ih-hist-meta-chip">${pending.length} ${__("pending")}</span>
						</div>
						<div>
							${pending
								.map(
									(row) => `<div style="border-bottom:1px solid #eef1f5;padding:10px 16px">
										<div style="align-items:center;display:flex;gap:12px;justify-content:space-between">
											<div class="imogi-ih-name">${frappe.utils.escape_html(row.name)}</div>
											<div class="imogi-ih-actions">
												<button type="button" class="imogi-ih-mini imogi-ih-mini--approve imogi-ih-opname-approve" data-request="${frappe.utils.escape_html(
													row.approval_request || row.name
												)}">${__("Approve")}</button>
												<button type="button" class="imogi-ih-mini imogi-ih-mini--reject imogi-ih-opname-reject" data-request="${frappe.utils.escape_html(
													row.approval_request || row.name
												)}">${__("Reject")}</button>
											</div>
										</div>
										<div style="align-items:center;display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;margin-top:4px">
											<div class="imogi-ih-sub">${cint(row.item_count) || 0} ${__("item")} · ${cint(
												row.diff_count
											) || 0} ${__("selisih")} · ${frappe.utils.escape_html(
												row.owner_name || ""
											)} · ${frappe.utils.escape_html(this.adj_when(row.creation, row.posting_date))}</div>
											<div style="align-items:center;display:flex;gap:6px">
												<span class="imogi-ih-sub">${__("Bukti")}:</span>${proof_html(row.attachments)}
											</div>
										</div>
									</div>`
								)
								.join("")}
						</div>
					</div>`
					: ""
			}
			<div class="imogi-ih-note">
				<i class="fa fa-info-circle"></i>
				${__("Opname = hitung fisik, ajukan ke HO, stok baru disesuaikan (Stock Reconciliation) setelah HO approve.")}
			</div>
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Stock Opname")}</div>
					<div style="align-items:center;display:flex;gap:8px">
						<button type="button" class="imogi-ih-mini imogi-ih-opname-hist-btn">
							<i class="fa fa-history"></i> ${__("Riwayat")} (${requests.length})
						</button>
						<button type="button" class="imogi-ih-mini imogi-ih-opname-export">
							<i class="fa fa-download"></i> ${__("Export Excel")}
						</button>
					</div>
				</div>
				<div style="overflow-x:auto">
					<table class="imogi-ih-table">
						<thead>
							<tr>
								<th>${__("Bahan")}</th>
								<th>${__("Qty Sistem")}</th>
								<th>${__("Qty Fisik")}</th>
								<th>${__("Bukti")}</th>
								<th>${__("Aksi")}</th>
							</tr>
						</thead>
						<tbody>
							${
								page_rows.length
									? page_rows
											.map(
												(row) => `<tr data-item="${frappe.utils.escape_html(row.item_code)}">
													<td>
														<div class="imogi-ih-name">${frappe.utils.escape_html(row.item_name)}</div>
														<div class="imogi-ih-sub">${frappe.utils.escape_html(row.item_code)}</div>
													</td>
													<td class="imogi-ih-num">${this.qty(row.qty)}</td>
													<td><input type="number" step="0.001" class="imogi-ih-phys" value="${flt(
														row.qty
													)}" style="border:1px solid #cbd5e1;border-radius:6px;height:32px;padding:0 8px;width:110px"></td>
													<td>
														<button type="button" class="imogi-ih-mini imogi-ih-opname-row-upload" data-item="${frappe.utils.escape_html(
															row.item_code
														)}">
															<i class="fa fa-paperclip"></i> <span class="imogi-ih-opname-row-file-label">${__(
																"Upload"
															)}</span>
														</button>
													</td>
													<td>
														<button type="button" class="imogi-ih-mini imogi-ih-mini--apply imogi-ih-opname-row-save" data-item="${frappe.utils.escape_html(
															row.item_code
														)}" disabled>${__("Ajukan")}</button>
													</td>
												</tr>`
											)
											.join("")
									: `<tr><td colspan="5" class="imogi-ih-empty">${__("Tidak ada item.")}</td></tr>`
							}
						</tbody>
					</table>
				</div>
				${pager.html}
			</div>
		`);
		this.bind_pager($body, total);
		const sys_qty_by_item = {};
		page_rows.forEach((r) => {
			sys_qty_by_item[r.item_code] = flt(r.qty);
		});
		const uploaded_by_item = {};
		const sync_row_btn = ($tr) => {
			const item_code = $tr.data("item");
			const qty = flt($tr.find(".imogi-ih-phys").val());
			const sys_qty = sys_qty_by_item[item_code];
			const has_change = sys_qty !== undefined && Math.abs(qty - sys_qty) >= 0.0005;
			const has_proof = (uploaded_by_item[item_code] || []).length > 0;
			$tr.find(".imogi-ih-opname-row-save").prop("disabled", !(has_change && has_proof));
		};
		$body.find("tbody tr[data-item]").each((_, el) => sync_row_btn($(el)));
		$body.on("input", ".imogi-ih-phys", (e) => {
			sync_row_btn($(e.currentTarget).closest("tr"));
		});
		$body.find(".imogi-ih-opname-row-upload").on("click", (e) => {
			const $btn = $(e.currentTarget);
			const item_code = $btn.data("item");
			new frappe.ui.FileUploader({
				allow_multiple: true,
				restrictions: {
					allowed_file_types: ["image/*", ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".heic"],
				},
				on_success(file) {
					if (!file || !file.file_url) return;
					const list = uploaded_by_item[item_code] || (uploaded_by_item[item_code] = []);
					if (list.some((x) => x.file_url === file.file_url)) return;
					list.push({ file_url: file.file_url, file_name: file.file_name || file.file_url });
					$btn
						.addClass("is-ready")
						.find(".imogi-ih-opname-row-file-label")
						.text(`${list.length} ${__("file")}`);
					sync_row_btn($btn.closest("tr"));
					frappe.show_alert({ message: __("Bukti ditambahkan."), indicator: "green" });
				},
			});
		});
		$body.find(".imogi-ih-opname-row-save").on("click", (e) => {
			const $tr = $(e.currentTarget).closest("tr");
			const item_code = $tr.data("item");
			const qty = flt($tr.find(".imogi-ih-phys").val());
			const files = uploaded_by_item[item_code] || [];
			if (!files.length) {
				frappe.msgprint(__("Upload bukti dulu untuk item ini."));
				return;
			}
			frappe.call({
				method: "imogi_pos.api.planned_features_api.create_inventory_opname_api",
				args: { items: [{ item_code, qty }], file_urls: files.map((f) => f.file_url) },
				freeze: true,
				callback: (r) => {
					if (r.exc) return;
					frappe.show_alert({
						message:
							r.message && r.message.message
								? r.message.message
								: __("Pengajuan opname menunggu approval: {0}", [
										(r.message && r.message.approval_request) || "",
								  ]),
						indicator: "blue",
					});
					this.opname_requests = null;
					this.refresh();
				},
			});
		});
		$body.find(".imogi-ih-opname-export").on("click", () => {
			open_url_post("/api/method/imogi_pos.api.planned_features_api.export_inventory_opname_excel", {
				limit: 200,
			});
		});
		$body.find(".imogi-ih-opname-hist-btn").on("click", () => {
			const page_size = 10;
			let page = 1;
			const hist_total = requests.length;
			const d = new frappe.ui.Dialog({
				title: __("Riwayat Opname"),
				size: "extra-large",
				fields: [{ fieldtype: "HTML", fieldname: "hist" }],
			});
			const render_hist_page = () => {
				const total_pages = Math.max(1, Math.ceil(hist_total / page_size));
				page = Math.min(Math.max(1, page), total_pages);
				const start = (page - 1) * page_size;
				const hist_rows = requests.slice(start, start + page_size);
				const pager = imogi_pos.page_shell.render_pagination(page, hist_total, page_size);
				const rows_html = hist_rows.length
					? hist_rows
							.map((row) => {
								const doc_link = row.stock_reconciliation
									? `<a class="imogi-ih-hist-doc" href="/app/stock-reconciliation/${encodeURIComponent(
											row.stock_reconciliation
									  )}" target="_blank" rel="noopener">${frappe.utils.escape_html(
											row.stock_reconciliation
									  )}</a>`
									: `<a class="imogi-ih-hist-doc" href="/app/imogi-pos-approval-request/${encodeURIComponent(
											row.name
									  )}" target="_blank" rel="noopener">${frappe.utils.escape_html(row.name)}</a>`;
								return `<tr>
									<td>${doc_link}</td>
									<td>${status_badge(row.status || "Approved")}</td>
									<td class="imogi-ih-when">${frappe.utils.escape_html(
										this.adj_when(row.creation, row.posting_date)
									)}</td>
									<td class="imogi-ih-hist-qty">${cint(row.item_count) || 0}</td>
									<td class="imogi-ih-hist-qty">${cint(row.diff_count) || 0}</td>
									<td class="imogi-ih-hist-reason" title="${frappe.utils.escape_html(row.owner_name || "—")}">${frappe.utils.escape_html(
										row.owner_name || "—"
									)}</td>
									<td class="imogi-ih-hist-proof">${proof_html(row.attachments)}</td>
								</tr>`;
							})
							.join("")
					: `<tr><td colspan="7" class="imogi-ih-hist-empty">${__("Belum ada opname.")}</td></tr>`;
				d.fields_dict.hist.$wrapper.html(`
					<div class="imogi-inventory-hub">
						<div class="imogi-ih-hist">
							<div class="imogi-ih-hist-summary">
								<span><strong>${hist_total}</strong> ${__("dokumen opname")}</span>
								${
									pending.length
										? `<span><strong>${pending.length}</strong> ${__("menunggu approval")}</span>`
										: ""
								}
							</div>
							<div class="imogi-ih-hist-wrap">
								<table class="imogi-ih-hist-table">
									<colgroup>
										<col style="width:16%">
										<col style="width:11%">
										<col style="width:14%">
										<col style="width:8%">
										<col style="width:8%">
										<col style="width:14%">
										<col style="width:29%">
									</colgroup>
									<thead>
										<tr>
											<th>${__("Dokumen")}</th>
											<th>${__("Status")}</th>
											<th>${__("Waktu")}</th>
											<th>${__("Item")}</th>
											<th>${__("Selisih")}</th>
											<th>${__("Diajukan oleh")}</th>
											<th>${__("Bukti")}</th>
										</tr>
									</thead>
									<tbody>${rows_html}</tbody>
								</table>
							</div>
						</div>
					</div>
					<div style="margin-top:12px">${pager.html}</div>
				`);
				d.fields_dict.hist.$wrapper
					.find(".imogi-web-page-prev, .imogi-web-page-next")
					.on("click", (e) => {
						e.preventDefault();
						const $btn = $(e.currentTarget);
						if ($btn.prop("disabled") || $btn.is("[disabled]")) return;
						let next = cint($btn.data("page"));
						if (!next) next = $btn.hasClass("imogi-web-page-prev") ? page - 1 : page + 1;
						next = Math.min(Math.max(1, next), total_pages);
						if (next === page) return;
						page = next;
						render_hist_page();
					});
			};
			render_hist_page();
			d.show();
		});
		$body.find(".imogi-ih-opname-approve").on("click", (e) => {
			const request_name = ($(e.currentTarget).data("request") || "").trim();
			if (!request_name) return;
			const d = new frappe.ui.Dialog({
				title: __("Approve Opname"),
				fields: [
					{
						fieldtype: "HTML",
						options: `<p>${__(
							"Stok akan disesuaikan (Stock Reconciliation) setelah approve. Role HO boleh tanpa PIN; selain itu isi PIN supervisor."
						)}</p>`,
					},
					{
						fieldname: "pin",
						fieldtype: "Password",
						label: __("PIN Supervisor (opsional untuk HO)"),
					},
				],
				primary_action_label: __("Approve"),
				primary_action: (values) => {
					frappe.call({
						method: "imogi_pos.api.planned_features_api.approve_inventory_opname_api",
						args: { request_name, pin: values.pin || undefined },
						freeze: true,
						callback: (r) => {
							if (r.exc) return;
							d.hide();
							frappe.show_alert({
								message: __("Disetujui. Stock Reconciliation: {0}", [
									(r.message && r.message.stock_reconciliation) || "—",
								]),
								indicator: "green",
							});
							this.opname_requests = null;
							this.refresh();
						},
					});
				},
			});
			d.show();
		});
		$body.find(".imogi-ih-opname-reject").on("click", (e) => {
			const request_name = ($(e.currentTarget).data("request") || "").trim();
			if (!request_name) return;
			const d = new frappe.ui.Dialog({
				title: __("Reject Opname"),
				fields: [
					{
						fieldname: "reason",
						fieldtype: "Small Text",
						label: __("Alasan reject"),
						reqd: 1,
					},
					{
						fieldname: "pin",
						fieldtype: "Password",
						label: __("PIN Supervisor (opsional untuk HO)"),
					},
				],
				primary_action_label: __("Reject"),
				primary_action: (values) => {
					frappe.call({
						method: "imogi_pos.api.planned_features_api.reject_inventory_opname_api",
						args: {
							request_name,
							pin: values.pin || undefined,
							reason: values.reason,
						},
						freeze: true,
						callback: (r) => {
							if (r.exc) return;
							d.hide();
							frappe.show_alert({
								message: __("Pengajuan ditolak."),
								indicator: "orange",
							});
							this.opname_requests = null;
							this.refresh();
						},
					});
				},
			});
			d.show();
		});
	}

	render_forecast() {
		const $body = this.$content.find(".imogi-ih-body");
		const rows = (this.forecast && this.forecast.rows) || [];
		const { page_rows, pager, total } = this.paginate(rows);
		const multiplier = flt(this.forecast && this.forecast.target_multiplier) || 1;
		const next_month_label = (this.forecast && this.forecast.next_month_label) || "";
		const multiplier_note =
			Math.abs(multiplier - 1) >= 0.02
				? ` · ${__("Disesuaikan Target Omzet Bulanan")}: <b>${
						multiplier > 1 ? "×" + this.qty(multiplier) : "×" + this.qty(multiplier)
				  }</b> ${multiplier > 1 ? __("(pemakaian diproyeksikan naik)") : __("(pemakaian diproyeksikan turun)")}`
				: "";
		$body.html(`
			<div class="imogi-ih-note">
				${__("Estimasi hari sisa stok dari pergerakan 14 hari terakhir.")}
				${this.forecast && this.forecast.warehouse ? ` · ${__("Gudang")}: <b>${frappe.utils.escape_html(this.forecast.warehouse)}</b>` : ""}
				${multiplier_note}
				${
					next_month_label
						? ` · ${__("Kebutuhan Bulan Depan & Rekomendasi Restock diproyeksikan untuk")} <b>${frappe.utils.escape_html(
								next_month_label
						  )}</b>`
						: ""
				}
			</div>
			<div class="imogi-web-panel">
				<div class="imogi-web-panel-head">
					<div class="imogi-web-panel-title">${__("Stock Forecast")}</div>
					<div style="align-items:center;display:flex;gap:8px">
						<span class="imogi-ih-meta">${total} ${__("item")}</span>
						<button type="button" class="imogi-ih-mini imogi-ih-forecast-export">
							<i class="fa fa-download"></i> ${__("Export Excel")}
						</button>
					</div>
				</div>
				<div style="overflow-x:auto">
					<table class="imogi-ih-table">
						<thead>
							<tr>
								<th>${__("Item")}</th>
								<th>${__("On Hand")}</th>
								<th>${__("Avg / Hari")}</th>
								<th>${__("Sisa Hari")}</th>
								<th>${__("Kebutuhan Bulan Depan")}</th>
								<th>${__("Rekomendasi Restock")}</th>
							</tr>
						</thead>
						<tbody>
							${
								page_rows.length
									? page_rows
											.map((row) => {
												const days = flt(row.days_remaining);
												const badge =
													days <= 3
														? `<span class="imogi-ih-badge imogi-ih-badge--danger">${this.qty(
																days
														  )}d</span>`
														: days <= 7
														? `<span class="imogi-ih-badge imogi-ih-badge--warn">${this.qty(
																days
														  )}d</span>`
														: `<span class="imogi-ih-badge imogi-ih-badge--ok">${this.qty(
																days
														  )}d</span>`;
												const restock = flt(row.restock_recommendation);
												const restock_html = restock > 0
													? `<span class="imogi-ih-badge imogi-ih-badge--warn">${this.qty(restock)}</span>`
													: `<span class="imogi-ih-badge imogi-ih-badge--ok">${__("Cukup")}</span>`;
												return `<tr>
													<td class="imogi-ih-name">${frappe.utils.escape_html(row.item_code)}</td>
													<td class="imogi-ih-num">${this.qty(row.on_hand)}</td>
													<td class="imogi-ih-num">${this.qty(row.avg_daily_use)}</td>
													<td>${badge}</td>
													<td class="imogi-ih-num">${this.qty(row.next_month_need)}</td>
													<td>${restock_html}</td>
												</tr>`;
											})
											.join("")
									: `<tr><td colspan="6" class="imogi-ih-empty">${__("Belum ada data forecast.")}</td></tr>`
							}
						</tbody>
					</table>
				</div>
				${pager.html}
			</div>
		`);
		this.bind_pager($body, total);
		$body.find(".imogi-ih-forecast-export").on("click", () => {
			open_url_post("/api/method/imogi_pos.api.planned_features_api.export_inventory_forecast_excel", {});
		});
	}
};
