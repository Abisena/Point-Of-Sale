// Copyright (c) 2026, Imogi and contributors

frappe.provide("imogi_pos.page_shell");

imogi_pos.page_shell.inject_css = function (page_key) {
	const id = `imogi-page-shell-${page_key}-v10`;
	document.getElementById(`imogi-page-shell-${page_key}`)?.remove();
	document.getElementById(`imogi-page-shell-${page_key}-v2`)?.remove();
	document.getElementById(`imogi-page-shell-${page_key}-v3`)?.remove();
	document.getElementById(`imogi-page-shell-${page_key}-v4`)?.remove();
	document.getElementById(`imogi-page-shell-${page_key}-v5`)?.remove();
	document.getElementById(`imogi-page-shell-${page_key}-v6`)?.remove();
	document.getElementById(`imogi-page-shell-${page_key}-v7`)?.remove();
	document.getElementById(`imogi-page-shell-${page_key}-v8`)?.remove();
	document.getElementById(`imogi-page-shell-${page_key}-v9`)?.remove();
	if (document.getElementById(id)) return;
	frappe.dom.set_style(
		`
		.${page_key}.layout-main-section,
		.${page_key},
		.${page_key} .page-body,
		.${page_key} .layout-main-section-wrapper{background:#e8ecf1!important}
		.${page_key} .page-body{padding:12px 16px 24px!important}
		.imogi-web-shell{margin:0 auto;max-width:1320px}
		.imogi-web-topbar{align-items:center;background:linear-gradient(180deg,#121a2b 0%,#0f1729 100%);border:1px solid #1e293b;border-radius:10px 10px 0 0;color:#e2e8f0;display:flex;flex-wrap:wrap;gap:10px 16px;justify-content:space-between;padding:10px 16px}
		.imogi-web-topbar-left{align-items:center;display:flex;flex-wrap:wrap;gap:10px;min-width:0}
		.imogi-web-topbar-right{align-items:center;display:flex;flex-wrap:wrap;gap:10px}
		.imogi-web-live-dot{background:#22c55e;border-radius:50%;box-shadow:0 0 0 3px rgba(34,197,94,.25);flex-shrink:0;height:8px;width:8px}
		.imogi-web-topbar-title{color:#f8fafc;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
		.imogi-web-topbar-co{color:#94a3b8;font-size:12px;font-weight:600;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
		.imogi-web-tier-badge{background:rgba(243,156,18,.15);border:1px solid rgba(243,156,18,.35);border-radius:6px;color:#fbbf24;font-size:10px;font-weight:800;letter-spacing:.06em;padding:4px 8px;text-transform:uppercase}
		.imogi-web-tier-badge[data-tier="Starter"]{background:rgba(59,130,246,.12);border-color:rgba(59,130,246,.35);color:#93c5fd}
		.imogi-web-tier-badge[data-tier="Professional"],
		.imogi-web-tier-badge[data-tier="Enterprise"]{background:rgba(16,185,129,.12);border-color:rgba(16,185,129,.35);color:#6ee7b7}
		.imogi-web-topbar-context{color:#64748b;font-size:11px;font-weight:600}
		.imogi-web-upgrade-slot:empty{display:none}
		.imogi-web-upgrade-strip{align-items:center;background:#fff;border:1px solid #cbd5e1;border-top:none;display:flex;flex-wrap:wrap;gap:10px 14px;justify-content:space-between;padding:8px 14px}
		.imogi-web-upgrade-strip-main{align-items:center;display:flex;flex:1;flex-wrap:wrap;gap:8px 10px;min-width:0}
		.imogi-web-upgrade-badge{background:#fff7ed;border:1px solid #fed7aa;border-radius:4px;color:#c2410c;font-size:10px;font-weight:800;letter-spacing:.08em;padding:3px 7px}
		.imogi-web-upgrade-text{color:#475569;font-size:12px;font-weight:600;line-height:1.3;max-width:360px}
		.imogi-web-upgrade-pills{display:flex;flex-wrap:wrap;gap:6px}
		.imogi-web-upgrade-pill{align-items:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;color:#64748b;display:inline-flex;font-size:10px;font-weight:600;gap:4px;padding:3px 8px;white-space:nowrap}
		.imogi-web-upgrade-pill i{color:#94a3b8;font-size:9px}
		.imogi-web-upgrade-pill small{color:#94a3b8;font-weight:700}
		.imogi-web-upgrade-actions{align-items:center;display:flex;flex-shrink:0;gap:6px}
		.imogi-web-upgrade-actions a{align-items:center;border-radius:6px;display:inline-flex;font-size:11px;font-weight:700;gap:5px;height:28px;padding:0 10px;text-decoration:none!important;white-space:nowrap}
		.imogi-web-link-ghost{background:#fff;border:1px solid #e2e8f0;color:#475569}
		.imogi-web-link-ghost:hover{background:#f8fafc;border-color:#cbd5e1;color:#1e293b}
		.imogi-web-link-brand{background:linear-gradient(135deg,#f5b041,#f39c12);border:none;color:#fff!important}
		.imogi-web-hero{align-items:center;background:#fff;border:1px solid #cbd5e1;border-radius:0 0 10px 10px;border-top:none;box-shadow:0 2px 8px rgba(15,23,42,.04);display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;margin-bottom:12px;padding:12px 16px}
		.imogi-web-hero h3{color:#0f172a;font-size:18px;font-weight:800;margin:0 0 2px}
		.imogi-web-hero p{color:#64748b;font-size:12px;margin:0}
		.imogi-web-actions{align-items:center;display:flex;flex-wrap:wrap;gap:8px}
		.imogi-web-btn{align-items:center;background:linear-gradient(135deg,#f5b041 0%,#f39c12 100%);border:none;border-radius:6px;box-shadow:0 2px 8px rgba(243,156,18,.28);color:#fff!important;display:inline-flex;font-size:12px;font-weight:700;gap:6px;height:32px;padding:0 12px;text-decoration:none!important;transition:background .12s ease,border-color .12s ease,color .12s ease,box-shadow .12s ease}
		.imogi-web-btn:hover:not(.imogi-web-btn-ghost){box-shadow:0 3px 10px rgba(243,156,18,.38)!important;color:#fff!important}
		.imogi-web-btn-ghost{background:#fff!important;border:1px solid #cbd5e1;box-shadow:none!important;color:#475569!important}
		.imogi-web-btn-ghost:hover,.imogi-web-btn-ghost:focus{background:#f8fafc!important;border-color:#94a3b8!important;box-shadow:none!important;color:#0f172a!important}
		.imogi-web-btn-ghost:active{background:#f1f5f9!important;color:#0f172a!important}
		.imogi-web-btn-ghost i{color:inherit!important}
		.imogi-web-panel{background:#fff;border:1px solid #cbd5e1;border-radius:8px;box-shadow:0 1px 4px rgba(15,23,42,.04);overflow:hidden}
		.imogi-web-panel-title{color:#0f172a;font-size:12px;font-weight:800;letter-spacing:.02em;text-transform:uppercase}
		.imogi-web-panel-body{padding:12px 14px 14px}
		.imogi-web-toolbar{align-items:flex-end;background:#fff;border:1px solid #cbd5e1;border-radius:8px;display:flex;flex-wrap:wrap;gap:8px 12px;margin-bottom:12px;padding:10px 12px}
		.imogi-web-toolbar-field{display:flex;flex-direction:column;gap:3px}
		.imogi-web-toolbar-field label{color:#64748b;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
		.imogi-web-toolbar-field input[type=date]{background:#fff;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;height:32px;max-width:150px}
		.imogi-web-toolbar-action{align-self:flex-end;flex-shrink:0}
		.imogi-rpt-periods{display:flex;flex-wrap:wrap;gap:6px}
		.imogi-rpt-period{align-items:center;background:#fff;border:1px solid #cbd5e1;border-radius:6px;color:#475569;cursor:pointer;display:inline-flex;font-size:11px;font-weight:700;height:32px;padding:0 10px;white-space:nowrap;transition:background .12s,border-color .12s,color .12s}
		.imogi-rpt-period:hover{background:#f8fafc;border-color:#94a3b8;color:#0f172a}
		.imogi-rpt-period.is-active{background:#fff7ed;border-color:#f39c12;box-shadow:0 0 0 1px rgba(243,156,18,.15);color:#9a3412}
		.imogi-rpt-custom-range{align-items:flex-end;display:flex;flex-wrap:wrap;gap:8px 12px}
		.imogi-rpt-free-hint{color:#94a3b8;font-size:10px;font-weight:600;line-height:1.3;margin-top:2px}
		.imogi-rpt-upgrade-nudge{align-items:center;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;color:#9a3412;display:flex;flex-wrap:wrap;font-size:11px;font-weight:600;gap:8px 12px;justify-content:space-between;margin-bottom:12px;padding:10px 12px}
		.imogi-rpt-upgrade-nudge a{align-items:center;background:linear-gradient(135deg,#f5b041,#f39c12);border-radius:6px;color:#fff!important;display:inline-flex;font-size:11px;font-weight:700;gap:5px;height:28px;padding:0 10px;text-decoration:none!important;white-space:nowrap}
		.imogi-web-toolbar-field--grow{flex:1;min-width:220px}
		.imogi-web-toolbar label{color:#64748b;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
		.imogi-web-toolbar input[type=date]{background:#fff;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;height:32px;max-width:150px}
		.imogi-web-search{background:#fff;border:1px solid #cbd5e1;border-radius:6px;flex:1;min-width:180px;padding:8px 10px}
		.imogi-web-table{border-collapse:collapse;font-size:12px;width:100%}
		.imogi-web-table th{background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:10px;font-weight:800;letter-spacing:.04em;padding:8px 10px;text-align:left;text-transform:uppercase}
		.imogi-web-table td{border-bottom:1px solid #f1f5f9;color:#334155;font-variant-numeric:tabular-nums;padding:8px 10px;vertical-align:middle}
		.imogi-web-table tr:hover td{background:#fafafa}
		.imogi-web-table th.imogi-oh-col-action,.imogi-web-table td.imogi-oh-col-action{padding-left:8px;padding-right:8px;text-align:center;width:52px}
		.imogi-oh-view-btn{align-items:center;background:linear-gradient(180deg,#eff6ff 0%,#dbeafe 100%);border:1px solid #93c5fd;border-radius:10px;box-shadow:0 1px 2px rgba(37,99,235,.12);color:#2563eb;cursor:pointer;display:inline-flex;font-size:15px;height:34px;justify-content:center;transition:background .15s,border-color .15s,box-shadow .15s,transform .1s;width:34px}
		.imogi-oh-view-btn .fa{line-height:1;pointer-events:none}
		.imogi-oh-view-btn:hover{background:linear-gradient(180deg,#dbeafe 0%,#bfdbfe 100%);border-color:#2563eb;box-shadow:0 4px 12px rgba(37,99,235,.2);color:#1d4ed8;transform:translateY(-1px)}
		.imogi-oh-view-btn:active{transform:translateY(0)}
		.imogi-oh-detail-dialog .modal-content{border:none;border-radius:14px;box-shadow:0 24px 48px rgba(15,23,42,.18);overflow:hidden}
		.imogi-oh-detail-dialog .modal-header{background:linear-gradient(145deg,#0f1f35 0%,#1a3352 100%);border-bottom:none;color:#fff;padding:16px 20px}
		.imogi-oh-detail-dialog .modal-title{color:#fff!important;font-size:16px;font-weight:800;letter-spacing:.01em}
		.imogi-oh-detail-dialog .modal-header .close{color:#fff!important;font-size:22px;font-weight:400;line-height:1;opacity:.85;text-shadow:none}
		.imogi-oh-detail-dialog .modal-header .close:hover{opacity:1}
		.imogi-oh-detail-dialog .modal-body{background:#f8fafc;max-height:min(72vh,640px);overflow-x:hidden;overflow-y:auto;padding:16px 20px 20px}
		.imogi-oh-detail-dialog.imogi-oh-detail-dialog--compact .modal-content,.imogi-oh-detail-dialog.imogi-oh-detail-dialog--compact .modal-dialog,.imogi-oh-detail-dialog.imogi-oh-detail-dialog--compact .modal-body{overflow:visible!important}
		.imogi-oh-detail-dialog.imogi-oh-detail-dialog--compact .modal-body{max-height:none!important}
		.imogi-oh-detail-dialog .modal-footer{background:#fff;border-top:1px solid #e2e8f0;padding:12px 20px 16px}
		.imogi-oh-detail-dialog .modal-footer .btn-primary,.imogi-oh-detail-dialog .modal-footer .imogi-oh-detail-close-btn{background:#0f1f35!important;border-color:#0f1f35!important;border-radius:10px;color:#fff!important;font-weight:700;min-width:108px;padding:8px 18px}
		.imogi-oh-detail-dialog .modal-footer .btn-primary:hover,.imogi-oh-detail-dialog .modal-footer .imogi-oh-detail-close-btn:hover{background:#1a3352!important;border-color:#1a3352!important;color:#fff!important}
		.imogi-oh-detail{display:flex;flex-direction:column;gap:14px}
		.imogi-oh-detail-hero{align-items:flex-start;background:#fff;border:1px solid #e2e8f0;border-radius:12px;display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;padding:14px 16px}
		.imogi-oh-detail-order{color:#0f172a;font-size:20px;font-variant-numeric:tabular-nums;font-weight:800;line-height:1.2}
		.imogi-oh-detail-subtitle{color:#64748b;font-size:12px;font-weight:600;margin-top:4px}
		.imogi-oh-status{border-radius:999px;display:inline-flex;font-size:11px;font-weight:800;letter-spacing:.02em;padding:5px 12px;white-space:nowrap}
		.imogi-oh-status.is-completed{background:#d1fae5;color:#047857}
		.imogi-oh-status.is-paid,.imogi-oh-status.is-awaiting-payment{background:#dbeafe;color:#1d4ed8}
		.imogi-oh-status.is-cancelled,.imogi-oh-status.is-void,.imogi-oh-status.is-refunded{background:#fee2e2;color:#b91c1c}
		.imogi-oh-status.is-default{background:#f1f5f9;color:#475569}
		.imogi-oh-detail-meta{background:#fff;border:1px solid #e2e8f0;border-radius:12px;display:grid;gap:12px 20px;grid-template-columns:repeat(2,minmax(0,1fr));padding:14px 16px}
		.imogi-oh-detail-meta-item{display:flex;flex-direction:column;gap:5px;min-width:0}
		.imogi-oh-detail-meta-label{color:#64748b;display:block;font-size:10px;font-weight:800;letter-spacing:.06em;line-height:1.2;text-transform:uppercase}
		.imogi-oh-detail-meta-value{color:#0f172a;display:block;font-size:13px;font-weight:600;line-height:1.4;word-break:break-word}
		.imogi-oh-detail-block{background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden}
		.imogi-oh-detail-block-title{background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:11px;font-weight:800;letter-spacing:.05em;padding:10px 14px;text-transform:uppercase}
		.imogi-oh-detail-table-wrap{overflow-x:auto}
		.imogi-oh-detail-items{border-collapse:collapse;font-size:12px;margin:0;width:100%}
		.imogi-oh-detail-items th{background:#fff;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:10px;font-weight:800;letter-spacing:.04em;padding:10px 14px;text-align:left;text-transform:uppercase}
		.imogi-oh-detail-items td{border-bottom:1px solid #f1f5f9;color:#334155;padding:10px 14px;vertical-align:middle}
		.imogi-oh-detail-items tr:last-child td{border-bottom:none}
		.imogi-oh-detail-items td:first-child,.imogi-oh-detail-items th:first-child{text-align:left}
		.imogi-oh-detail-items td:nth-child(2),.imogi-oh-detail-items th:nth-child(2){text-align:center;white-space:nowrap}
		.imogi-oh-detail-items td:nth-child(n+3),.imogi-oh-detail-items th:nth-child(n+3){text-align:right;white-space:nowrap}
		.imogi-oh-detail-items .imogi-oh-item-name{color:#0f172a;font-weight:700;line-height:1.35}
		.imogi-oh-detail-items--pay td:last-child,.imogi-oh-detail-items--pay th:last-child{text-align:right}
		.imogi-oh-detail-summary{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px}
		.imogi-oh-detail-total-row{align-items:baseline;color:#64748b;display:flex;font-size:13px;justify-content:space-between;margin-bottom:6px}
		.imogi-oh-detail-total-row strong{color:#0f172a;font-size:13px;font-variant-numeric:tabular-nums;font-weight:800}
		.imogi-oh-detail-total-row.is-discount strong{color:#be123c}
		.imogi-oh-detail-grand{align-items:center;background:linear-gradient(145deg,#0f1f35 0%,#1a3352 100%);border-radius:12px;color:#fff;display:flex;justify-content:space-between;margin-top:4px;padding:14px 16px}
		.imogi-oh-detail-grand span{color:rgba(255,255,255,.78);font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
		.imogi-oh-detail-grand strong{color:#fff;font-size:22px;font-variant-numeric:tabular-nums;font-weight:800}
		.imogi-oh-detail-link{color:#2563eb;font-weight:700;text-decoration:none}
		.imogi-oh-detail-link:hover{text-decoration:underline}
		.imogi-oh-detail-dialog .modal-dialog{max-width:720px}
		.imogi-web-empty{align-items:center;color:#94a3b8;display:flex;flex-direction:column;font-size:12px;gap:8px;justify-content:center;min-height:100px;padding:24px;text-align:center}
		.imogi-web-stat-grid{background:#fff;border:1px solid #cbd5e1;border-radius:8px;display:grid;gap:0;grid-template-columns:repeat(3,minmax(0,1fr));margin-bottom:12px;overflow:hidden}
		.imogi-web-stat{align-items:center;border-right:1px solid #edf2f7;display:flex;gap:10px;min-height:68px;padding:10px 14px}
		.imogi-web-stat:last-child{border-right:none}
		.imogi-web-stat-icon{align-items:center;background:#fef3c7;border-radius:6px;color:#d97706;display:inline-flex;flex-shrink:0;font-size:12px;height:30px;justify-content:center;width:30px}
		.imogi-web-stat-icon--count{background:#dbeafe;color:#2563eb}
		.imogi-web-stat-icon--done{background:#d1fae5;color:#059669}
		.imogi-web-stat-body{min-width:0}
		.imogi-web-stat-label{color:#64748b;font-size:10px;font-weight:600;line-height:1.2}
		.imogi-web-stat-value{color:#0f172a;font-size:16px;font-variant-numeric:tabular-nums;font-weight:800;line-height:1.15;margin-top:2px}
		.imogi-web-stat--hero .imogi-web-stat-value{color:#d97706;font-size:18px}
		.imogi-web-stat--warn .imogi-web-stat-value{color:#dc2626}
		.imogi-web-stat-grid--4{grid-template-columns:repeat(4,minmax(0,1fr))}
		.imogi-web-stat-icon--warn{background:#fee2e2;color:#dc2626}
		.imogi-web-stat-icon--purple{background:#ede9fe;color:#7c3aed}
		.imogi-web-stat-icon--slate{background:#f1f5f9;color:#64748b}
		.imogi-web-panel-head{align-items:center;background:#f8fafc;border-bottom:1px solid #e2e8f0;display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between;padding:10px 14px}
		.imogi-web-panel-filters{align-items:flex-end;display:flex;flex:1;flex-wrap:wrap;gap:8px;justify-content:flex-end;min-width:0}
		.imogi-web-panel-filters select{background:#fff;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;height:32px;max-width:160px;padding:0 8px}
		.imogi-web-type-tag{background:#f1f5f9;border-radius:4px;color:#64748b;display:inline-block;font-size:10px;font-weight:700;padding:3px 8px;white-space:nowrap}
		.imogi-web-type-tag--pos{background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8}
		.imogi-web-type-tag--group{background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d}
		.imogi-web-count-cell{align-items:center;display:flex;gap:10px;justify-content:flex-end}
		.imogi-web-count-bar{background:#e2e8f0;border-radius:999px;flex-shrink:0;height:5px;overflow:hidden;width:72px}
		.imogi-web-count-fill{background:linear-gradient(90deg,#60a5fa,#3b82f6);border-radius:999px;height:100%;min-width:4px}
		.imogi-web-count-fill--brand{background:linear-gradient(90deg,#fbbf24,#f39c12)}
		.imogi-web-btn--xs{height:28px!important;padding:0 10px!important;font-size:11px!important}
		.imogi-web-bars{display:flex;flex-direction:column;gap:10px}
		.imogi-web-bar-head{align-items:center;display:flex;font-size:12px;font-weight:600;justify-content:space-between;margin-bottom:4px}
		.imogi-web-bar-track{background:#e2e8f0;border-radius:999px;height:6px;overflow:hidden}
		.imogi-web-bar-fill{background:linear-gradient(90deg,#fbbf24,#f39c12);border-radius:999px;height:100%;min-width:4px}
		.imogi-web-chip{background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;color:#1d4ed8;display:inline-block;font-size:11px;font-weight:700;padding:4px 10px}
		.imogi-web-pagination{align-items:center;border-top:1px solid #edf2f7;display:flex;flex-wrap:wrap;gap:12px 16px;justify-content:space-between;margin-top:16px;padding:16px 0 8px}
		.imogi-web-pagination-info{color:#64748b;font-size:11px;font-weight:600}
		.imogi-web-pagination-controls{align-items:center;display:flex;gap:6px}
		.imogi-web-pagination-page{color:#334155;font-size:11px;font-variant-numeric:tabular-nums;font-weight:700;min-width:48px;text-align:center}
		.imogi-web-btn[disabled],.imogi-web-btn:disabled{cursor:not-allowed;opacity:.45;pointer-events:none}
		@media (max-width:1199px){
			.imogi-web-stat-grid--4{grid-template-columns:repeat(2,minmax(0,1fr))}
			.imogi-web-stat-grid--4 .imogi-web-stat{border-bottom:1px solid #edf2f7}
			.imogi-web-stat-grid--4 .imogi-web-stat:nth-child(2n){border-right:none}
		}
		@media (max-width:767px){
			.imogi-web-topbar,.imogi-web-hero{border-radius:8px}
			.imogi-web-upgrade-strip,.imogi-web-hero{border-top:1px solid #cbd5e1}
			.imogi-web-stat-grid{grid-template-columns:1fr}
			.imogi-web-stat{border-bottom:1px solid #edf2f7;border-right:none}
			.imogi-web-stat:last-child{border-bottom:none}
			.imogi-web-actions,.imogi-web-upgrade-actions{width:100%}
			.imogi-web-actions a,.imogi-web-actions button,.imogi-web-upgrade-actions a{width:100%!important;justify-content:center}
		}
		`,
		id
	);
};

imogi_pos.page_shell.render_stat = function (label, value, icon, tone = "brand", options = {}) {
	const hero = options.hero ? " imogi-web-stat--hero" : "";
	const warn = options.warn ? " imogi-web-stat--warn" : "";
	const iconTone = options.icon_tone || tone;
	return `
		<div class="imogi-web-stat${hero}${warn}">
			<span class="imogi-web-stat-icon imogi-web-stat-icon--${iconTone}"><i class="fa ${icon}"></i></span>
			<div class="imogi-web-stat-body">
				<div class="imogi-web-stat-label">${label}</div>
				<div class="imogi-web-stat-value">${value}</div>
			</div>
		</div>
	`;
};

imogi_pos.page_shell.render_pagination = function (page, total, page_size) {
	const total_pages = Math.max(1, Math.ceil(total / page_size));
	page = Math.min(Math.max(1, page), total_pages);
	if (total <= page_size) {
		return { page, total_pages, html: "" };
	}
	const start = (page - 1) * page_size;
	const end = Math.min(start + page_size, total);
	return {
		page,
		total_pages,
		html: `
			<div class="imogi-web-pagination">
				<span class="imogi-web-pagination-info">${__("Menampilkan")} ${start + 1}–${end} ${__(
					"dari"
				)} ${total}</span>
				<div class="imogi-web-pagination-controls">
					<button type="button" class="imogi-web-btn imogi-web-btn-ghost imogi-web-btn--xs imogi-web-page-prev"${page <= 1 ? " disabled" : ""}>
						<i class="fa fa-chevron-left"></i> ${__("Sebelumnya")}
					</button>
					<span class="imogi-web-pagination-page">${page} / ${total_pages}</span>
					<button type="button" class="imogi-web-btn imogi-web-btn-ghost imogi-web-btn--xs imogi-web-page-next"${page >= total_pages ? " disabled" : ""}>
						${__("Berikutnya")} <i class="fa fa-chevron-right"></i>
					</button>
				</div>
			</div>
		`,
	};
};

function imogi_pos_is_enterprise_deployment() {
	return imogi_pos.is_erp_enterprise_deployment ? imogi_pos.is_erp_enterprise_deployment() : true;
}

imogi_pos.page_shell.init_manager_page = function ($shell, context_label) {
	imogi_pos.page_shell.render_topbar($shell, context_label);
	if (imogi_pos_is_enterprise_deployment()) {
		return;
	}
	if ((frappe.boot?.imogi_pos_subscription_tier || "Free") === "Free") {
		imogi_pos.page_shell.render_upgrade_strip($shell.find(".imogi-web-upgrade-slot"), {
			persona: "manager",
		});
	}
};

imogi_pos.page_shell.init_cashier_page = function ($shell, context_label) {
	imogi_pos.page_shell.render_topbar($shell, context_label);
	$shell.find(".imogi-web-tier-badge").hide();
	$shell.find(".imogi-web-upgrade-slot").empty();
};

imogi_pos.page_shell.init_owner_page = function ($shell, context_label) {
	imogi_pos.page_shell.render_topbar($shell, context_label);
	if (imogi_pos_is_enterprise_deployment()) {
		return;
	}
	if ((frappe.boot?.imogi_pos_subscription_tier || "Free") === "Free") {
		imogi_pos.page_shell.render_upgrade_strip($shell.find(".imogi-web-upgrade-slot"), {
			persona: "owner",
		});
	}
};

imogi_pos.page_shell.render_topbar = function ($shell, context_label) {
	const company =
		frappe.defaults.get_user_default("Company") ||
		frappe.boot?.imogi_pos_default_company ||
		"";
	$shell.find(".imogi-web-topbar-co").text(company);
	if (imogi_pos_is_enterprise_deployment()) {
		$shell.find(".imogi-web-tier-badge").hide();
	} else {
		const tier = frappe.boot?.imogi_pos_subscription_tier || "Free";
		$shell.find(".imogi-web-tier-badge").show().text(tier).attr("data-tier", tier);
	}
	if (context_label) {
		$shell.find(".imogi-web-topbar-context").text(context_label);
	}
};

imogi_pos.page_shell.render_upgrade_strip = function ($slot, options = {}) {
	if (imogi_pos_is_enterprise_deployment()) {
		$slot.empty();
		return;
	}
	const tier = (options.tier || frappe.boot?.imogi_pos_subscription_tier || "Free").trim();
	if (tier !== "Free" && !options.force) {
		$slot.empty();
		return;
	}
	const persona = options.persona || "owner";
	const locks =
		persona === "manager"
			? [
					{ label: __("Modifier"), tier: "Pro" },
					{ label: __("Loyalty"), tier: "Pro" },
					{ label: __("Multi Cabang"), tier: "Starter" },
			  ]
			: [
					{ label: __("QRIS"), tier: "Starter" },
					{ label: __("Laporan/Jam"), tier: "Pro" },
					{ label: __("Multi Cabang"), tier: "Starter" },
			  ];
	const copy =
		persona === "manager"
			? __("Menu & kategori aktif — fitur premium terkunci.")
			: __("Laporan dasar aktif — upgrade untuk QRIS, cabang, dan laporan lanjutan.");
	$slot.html(`
		<div class="imogi-web-upgrade-strip" role="complementary">
			<div class="imogi-web-upgrade-strip-main">
				<span class="imogi-web-upgrade-badge">${__("Paket Free")}</span>
				<span class="imogi-web-upgrade-text">${copy}</span>
				<div class="imogi-web-upgrade-pills">
					${locks
						.map(
							(row) =>
								`<span class="imogi-web-upgrade-pill"><i class="fa fa-lock"></i> ${row.label} <small>${row.tier}+</small></span>`
						)
						.join("")}
				</div>
			</div>
			<div class="imogi-web-upgrade-actions">
				<a class="imogi-web-link-ghost" href="/app/imogi-pos-feature-matrix"><i class="fa fa-th-list"></i> ${__(
					"Bandingkan"
				)}</a>
				${
					persona === "owner"
						? `<a class="imogi-web-link-brand" href="/app/imogi-pos-settings"><i class="fa fa-arrow-up"></i> ${__(
								"Upgrade"
						  )}</a>`
						: ""
				}
			</div>
		</div>
	`);
};

/** @deprecated Use render_upgrade_strip — kept for pages not yet migrated */
imogi_pos.page_shell.render_upgrade_banner = function ($parent, options = {}) {
	const $slot = $parent.find(".imogi-web-upgrade-slot");
	if ($slot.length) {
		imogi_pos.page_shell.render_upgrade_strip($slot, options);
		return;
	}
	imogi_pos.page_shell.render_upgrade_strip($parent.prepend('<div class="imogi-web-upgrade-slot"></div>').find(".imogi-web-upgrade-slot"), options);
};

imogi_pos.page_shell.make_page = function (wrapper, title, page_key) {
	imogi_pos.page_shell.inject_css(page_key);
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title,
		single_column: true,
	});
	page.main.addClass(`imogi-web-shell-root ${page_key}`);
	return page;
};

imogi_pos.page_shell.render_hero = function ($parent, { title, subtitle, actions_html = "" }) {
	$parent.html(`
		<div class="imogi-web-shell">
			<div class="imogi-web-topbar">
				<div class="imogi-web-topbar-left">
					<span class="imogi-web-live-dot" title="${__("Live")}"></span>
					<span class="imogi-web-topbar-title">IMOGI POS</span>
					<span class="imogi-web-topbar-co"></span>
				</div>
				<div class="imogi-web-topbar-right">
					<span class="imogi-web-tier-badge"></span>
					<span class="imogi-web-topbar-context"></span>
				</div>
			</div>
			<div class="imogi-web-upgrade-slot"></div>
			<div class="imogi-web-hero${title || subtitle ? "" : " imogi-web-hero--compact"}">
				<div>
					${title ? `<h3>${frappe.utils.escape_html(title)}</h3>` : ""}
					${subtitle ? `<p>${frappe.utils.escape_html(subtitle)}</p>` : ""}
				</div>
				<div class="imogi-web-actions">${actions_html || ""}</div>
			</div>
			<div class="imogi-web-content"></div>
		</div>
	`);
	return $parent.find(".imogi-web-content");
};
