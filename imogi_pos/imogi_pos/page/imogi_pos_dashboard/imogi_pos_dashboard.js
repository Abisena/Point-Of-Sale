frappe.provide("imogi_pos");

function imogi_dashboard_subscription_disabled() {
	return !!(
		frappe.boot?.imogi_pos_subscription_tiers_disabled ||
		frappe.boot?.imogi_pos_erp_enterprise_only ||
		(imogi_pos.is_subscription_tier_disabled && imogi_pos.is_subscription_tier_disabled()) ||
		(imogi_pos.is_erp_enterprise_deployment && imogi_pos.is_erp_enterprise_deployment())
	);
}

function inject_dashboard_css() {
	document.getElementById("imogi-dashboard-inline-css-v1")?.remove();
	document.getElementById("imogi-dashboard-inline-css-v2")?.remove();
	document.getElementById("imogi-dashboard-inline-css-v3")?.remove();
	document.getElementById("imogi-dashboard-inline-css-v4")?.remove();
	document.getElementById("imogi-dashboard-inline-css-v5")?.remove();
	document.getElementById("imogi-dashboard-inline-css-v6")?.remove();
	document.getElementById("imogi-dashboard-inline-css-v7")?.remove();
	if (document.getElementById("imogi-dashboard-inline-css-v8")) return;
	frappe.dom.set_style(
		`
		.imogi-dashboard-page.layout-main-section,
		.imogi-dashboard-page,
		.imogi-dashboard-page .page-body,
		.imogi-dashboard-page .layout-main-section-wrapper{background:#e8ecf1!important}
		.imogi-dashboard-page .page-body{padding:12px 16px 24px!important}
		.imogi-dash-shell{margin:0 auto;max-width:1320px;padding:0}
		.imogi-dash-loading{opacity:.55;pointer-events:none;transition:opacity .2s ease}
		.imogi-dash-topbar{align-items:center;background:linear-gradient(180deg,#121a2b 0%,#0f1729 100%);border:1px solid #1e293b;border-radius:10px 10px 0 0;color:#e2e8f0;display:flex;flex-wrap:wrap;gap:10px 16px;justify-content:space-between;padding:10px 16px}
		.imogi-dash-topbar-left{align-items:center;display:flex;flex-wrap:wrap;gap:10px;min-width:0}
		.imogi-dash-topbar-right{align-items:center;display:flex;flex-wrap:wrap;gap:10px}
		.imogi-dash-live-dot{background:#22c55e;border-radius:50%;box-shadow:0 0 0 3px rgba(34,197,94,.25);flex-shrink:0;height:8px;width:8px}
		.imogi-dash-topbar-title{color:#f8fafc;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
		.imogi-dash-topbar-co{color:#94a3b8;font-size:12px;font-weight:600;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
		.imogi-dash-tier-badge{background:rgba(243,156,18,.15);border:1px solid rgba(243,156,18,.35);border-radius:6px;color:#fbbf24;font-size:10px;font-weight:800;letter-spacing:.06em;padding:4px 8px;text-transform:uppercase}
		.imogi-dash-tier-badge[data-tier="Starter"]{background:rgba(59,130,246,.12);border-color:rgba(59,130,246,.35);color:#93c5fd}
		.imogi-dash-tier-badge[data-tier="Professional"],
		.imogi-dash-tier-badge[data-tier="Enterprise"]{background:rgba(16,185,129,.12);border-color:rgba(16,185,129,.35);color:#6ee7b7}
		.imogi-dash-topbar-date{color:#64748b;font-size:11px;font-weight:600}
		.imogi-dash-upgrade-slot:empty{display:none}
		.imogi-dash-upgrade-strip{align-items:center;background:#fff;border:1px solid #cbd5e1;border-top:none;display:flex;flex-wrap:wrap;gap:10px 14px;justify-content:space-between;padding:8px 14px}
		.imogi-dash-upgrade-strip-main{align-items:center;display:flex;flex:1;flex-wrap:wrap;gap:8px 10px;min-width:0}
		.imogi-dash-upgrade-badge{background:#fff7ed;border:1px solid #fed7aa;border-radius:4px;color:#c2410c;font-size:10px;font-weight:800;letter-spacing:.08em;padding:3px 7px}
		.imogi-dash-upgrade-text{color:#475569;font-size:12px;font-weight:600;line-height:1.3;max-width:360px}
		.imogi-dash-upgrade-pills{display:flex;flex-wrap:wrap;gap:6px}
		.imogi-dash-upgrade-pill{align-items:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;color:#64748b;display:inline-flex;font-size:10px;font-weight:600;gap:4px;padding:3px 8px;white-space:nowrap}
		.imogi-dash-upgrade-pill i{color:#94a3b8;font-size:9px}
		.imogi-dash-upgrade-pill small{color:#94a3b8;font-weight:700}
		.imogi-dash-upgrade-actions{align-items:center;display:flex;flex-shrink:0;gap:6px}
		.imogi-dash-upgrade-actions a{align-items:center;border-radius:6px;display:inline-flex;font-size:11px;font-weight:700;gap:5px;height:28px;padding:0 10px;text-decoration:none!important;white-space:nowrap}
		.imogi-dash-upgrade-actions .imogi-dash-link-ghost{background:#fff;border:1px solid #e2e8f0;color:#475569}
		.imogi-dash-upgrade-actions .imogi-dash-link-ghost:hover{background:#f8fafc;border-color:#cbd5e1;color:#1e293b}
		.imogi-dash-upgrade-actions .imogi-dash-link-brand{background:linear-gradient(135deg,#f5b041,#f39c12);border:none;color:#fff!important}
		.imogi-dash-hero{align-items:center;background:#fff;border:1px solid #cbd5e1;border-radius:0 0 10px 10px;border-top:none;box-shadow:0 2px 8px rgba(15,23,42,.04);display:flex;flex-wrap:wrap;gap:12px 16px;justify-content:space-between;margin-bottom:12px;padding:12px 16px}
		.imogi-dash-hero-text{flex:1;min-width:180px}
		.imogi-dash-date-display{color:#0f172a;font-size:22px;font-variant-numeric:tabular-nums;font-weight:800;letter-spacing:-.02em;line-height:1.1}
		.imogi-dash-hero-sub{color:#64748b;font-size:12px;line-height:1.45;margin:4px 0 0;max-width:480px}
		.imogi-dash-hero-right{align-items:flex-end;display:flex;flex-wrap:wrap;gap:12px;justify-content:flex-end}
		.imogi-dash-hero-controls{align-items:flex-end;display:flex;flex-wrap:wrap;gap:8px 12px}
		.imogi-dash-date-wrap,.imogi-dash-branch-wrap{display:flex;flex-direction:column;gap:3px}
		.imogi-dash-date-wrap label,.imogi-dash-branch-wrap label{color:#64748b;display:block;font-size:10px;font-weight:700;letter-spacing:.06em;margin:0;text-transform:uppercase}
		.imogi-dash-date,.imogi-dash-branch-select{background:#fff;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;height:32px}
		.imogi-dash-date{max-width:150px}
		.imogi-dash-branch-select{font-weight:600;max-width:200px;min-width:140px}
		.imogi-dash-branch-panel{margin-bottom:12px}
		.imogi-dash-branch-grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}
		.imogi-dash-branch-card{background:#fff;border:1px solid #cbd5e1;border-radius:8px;padding:12px 14px}
		.imogi-dash-branch-card-head{align-items:flex-start;display:flex;gap:8px;justify-content:space-between;margin-bottom:8px}
		.imogi-dash-branch-card-name{color:#0f172a;font-size:13px;font-weight:800;line-height:1.2}
		.imogi-dash-branch-card-city{color:#64748b;font-size:10px;margin-top:2px}
		.imogi-dash-branch-card-sales{color:#d97706;font-size:16px;font-variant-numeric:tabular-nums;font-weight:800}
		.imogi-dash-branch-card-meta{color:#64748b;display:flex;font-size:10px;gap:8px;justify-content:space-between;margin-top:6px}
		.imogi-dash-branch-card-track{background:#e2e8f0;border-radius:999px;height:6px;margin-top:8px;overflow:hidden}
		.imogi-dash-branch-card-fill{background:linear-gradient(90deg,#fbbf24,#f39c12);border-radius:999px;height:100%;min-width:4px}
		.imogi-dash-quick-group{align-items:center;display:flex;flex-shrink:0;flex-wrap:wrap;gap:6px}
		.imogi-dash-chip{align-items:center;background:#fff;border:1px solid #cbd5e1;border-radius:6px;color:#475569;cursor:pointer;display:inline-flex;font-size:11px;font-weight:600;height:32px;justify-content:center;padding:0 10px;transition:all .12s ease}
		.imogi-dash-chip:hover{background:#fff7ed;border-color:#f6ad55;color:#c05621}
		.imogi-dash-chip--icon{padding:0;width:32px}
		.imogi-dash-hero-actions{align-items:center;display:flex;flex-shrink:0;flex-wrap:wrap;gap:8px}
		a.imogi-btn-brand,button.imogi-btn-brand{align-items:center!important;background:linear-gradient(135deg,#f5b041 0%,#f39c12 100%)!important;border:none!important;border-radius:6px!important;box-shadow:0 2px 8px rgba(243,156,18,.28)!important;box-sizing:border-box!important;color:#fff!important;display:inline-flex!important;font-size:12px!important;font-weight:700!important;gap:6px;height:32px!important;justify-content:center!important;line-height:1!important;margin:0!important;padding:0 12px!important;text-decoration:none!important;vertical-align:middle!important}
		a.imogi-btn-brand:hover,button.imogi-btn-brand:hover{box-shadow:0 3px 10px rgba(243,156,18,.38)!important;color:#fff!important}
		.imogi-btn-brand--xs{height:28px!important;padding:0 10px!important;font-size:11px!important}
		a.imogi-btn-ghost,button.imogi-btn-ghost{align-items:center!important;background:#fff!important;border:1px solid #cbd5e1!important;border-radius:6px!important;box-sizing:border-box!important;color:#475569!important;display:inline-flex!important;font-size:12px!important;font-weight:600!important;gap:6px;height:32px!important;justify-content:center!important;line-height:1!important;margin:0!important;padding:0 12px!important;text-decoration:none!important;vertical-align:middle!important}
		a.imogi-btn-ghost:hover{background:#f8fafc!important;border-color:#94a3b8!important;color:#1e293b!important}
		.imogi-btn-ghost--xs{height:28px!important;padding:0 10px!important;font-size:11px!important}
		.imogi-dash-alerts-stack{display:flex;flex-direction:column;gap:8px;margin-bottom:10px}
		.imogi-dash-alerts-stack:empty{display:none}
		.imogi-dash-alerts-stack .imogi-pos-shift-alert,
		.imogi-dash-alerts-stack .imogi-awaiting-alert{margin-bottom:0!important}
		.imogi-dash-alerts-stack .imogi-pos-shift-alert:empty,
		.imogi-dash-alerts-stack .imogi-awaiting-alert:empty{display:none}
		.imogi-sales-target-banner{margin-bottom:10px}
		.imogi-target-strip{background:#fff;border:1px solid #cbd5e1;border-left:3px solid #f39c12;border-radius:8px;overflow:hidden;padding:10px 14px}
		.imogi-target-strip.is-achieved{border-left-color:#10b981}
		.imogi-target-strip.is-behind{border-left-color:#ef4444}
		.imogi-target-strip-head{align-items:center;display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px}
		.imogi-target-strip-head i{color:#f39c12;font-size:13px}
		.imogi-target-strip.is-achieved .imogi-target-strip-head i{color:#10b981}
		.imogi-target-strip.is-behind .imogi-target-strip-head i{color:#ef4444}
		.imogi-target-strip-title{color:#0f172a;font-size:12px;font-weight:800;text-transform:uppercase}
		.imogi-target-strip-sub{color:#64748b;font-size:11px;margin-left:auto}
		.imogi-target-strip-badge{background:#fff7ed;border:1px solid #fed7aa;border-radius:999px;color:#b45309;font-size:10px;font-weight:700;padding:3px 8px}
		.imogi-target-strip.is-achieved .imogi-target-strip-badge{background:#ecfdf5;border-color:#a7f3d0;color:#047857}
		.imogi-target-strip.is-behind .imogi-target-strip-badge{background:#fff1f2;border-color:#fecdd3;color:#be123c}
		.imogi-target-strip-body{align-items:center;display:flex;flex-wrap:wrap;gap:10px}
		.imogi-target-strip-actual{color:#0f172a;font-size:18px;font-variant-numeric:tabular-nums;font-weight:800;min-width:120px}
		.imogi-target-strip-track{background:#e2e8f0;border-radius:999px;flex:1;height:8px;min-width:80px;overflow:hidden}
		.imogi-target-strip-fill{background:linear-gradient(90deg,#fbbf24,#f39c12);border-radius:999px;height:100%;min-width:4px}
		.imogi-target-strip.is-behind .imogi-target-strip-fill{background:linear-gradient(90deg,#fb7185,#ef4444)}
		.imogi-target-strip.is-achieved .imogi-target-strip-fill{background:linear-gradient(90deg,#34d399,#10b981)}
		.imogi-target-strip-pct{color:#64748b;font-size:12px;font-variant-numeric:tabular-nums;font-weight:800;min-width:36px;text-align:right}
		.imogi-target-strip-meta{border-top:1px solid #edf2f7;display:grid;gap:6px;grid-template-columns:repeat(4,minmax(0,1fr));margin-top:8px;padding-top:8px}
		.imogi-target-strip-meta span{color:#334155;display:block;font-size:11px;font-variant-numeric:tabular-nums;font-weight:700}
		.imogi-target-strip-meta small{color:#94a3b8;display:block;font-size:9px;font-weight:700;letter-spacing:.04em;margin-bottom:2px;text-transform:uppercase}
		.imogi-dash-awaiting-strip{align-items:center;background:#fff;border:1px solid #fde68a;border-left:3px solid #f59e0b;border-radius:8px;display:flex;flex-wrap:wrap;gap:8px 12px;padding:8px 12px}
		.imogi-dash-awaiting-label{align-items:center;color:#92400e;display:flex;font-size:12px;font-weight:700;gap:6px;white-space:nowrap}
		.imogi-dash-awaiting-label strong{color:#b45309;font-size:14px;font-variant-numeric:tabular-nums}
		.imogi-dash-awaiting-chips{align-items:center;display:flex;flex:1;flex-wrap:wrap;gap:6px;min-width:0}
		.imogi-dash-awaiting-chip{align-items:center;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;color:#78350f;display:inline-flex;font-size:11px;font-variant-numeric:tabular-nums;font-weight:600;gap:6px;padding:4px 8px;text-decoration:none!important;white-space:nowrap}
		.imogi-dash-awaiting-chip:hover{background:#fef3c7;border-color:#fbbf24;color:#92400e}
		.imogi-dash-awaiting-chip span{color:#b45309;font-weight:800}
		.imogi-dash-awaiting-more{color:#94a3b8;font-size:11px;font-weight:700}
		.imogi-dash-awaiting-link{align-items:center;color:#c2410c;display:inline-flex;font-size:11px;font-weight:700;gap:4px;text-decoration:none!important;white-space:nowrap}
		.imogi-dash-awaiting-link:hover{color:#9a3412}
		.imogi-dash-stats-card{background:#fff;border:1px solid #cbd5e1;border-radius:8px;box-shadow:0 1px 4px rgba(15,23,42,.04);margin-bottom:12px;overflow:hidden}
		.imogi-dash-stats-head{background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#475569;font-size:10px;font-weight:800;letter-spacing:.08em;padding:8px 14px;text-transform:uppercase}
		.imogi-dash-stats-grid{display:grid!important;gap:0;grid-template-columns:repeat(6,minmax(0,1fr))}
		.imogi-stat-card{align-items:center;background:#fff;border:none;border-right:1px solid #edf2f7;border-radius:0;box-shadow:none;display:flex;gap:10px;min-height:72px;padding:10px 12px}
		.imogi-stat-card:last-child{border-right:none}
		.imogi-stat-card-icon{align-items:center;border-radius:6px;display:inline-flex;flex-shrink:0;font-size:12px;height:30px;justify-content:center;width:30px}
		.imogi-stat-card-body{min-width:0}
		.imogi-stat-card--brand .imogi-stat-card-icon{background:#fef3c7;color:#d97706}
		.imogi-stat-card--success .imogi-stat-card-icon{background:#d1fae5;color:#059669}
		.imogi-stat-card--danger .imogi-stat-card-icon{background:#fee2e2;color:#dc2626}
		.imogi-stat-card--blue .imogi-stat-card-icon{background:#dbeafe;color:#2563eb}
		.imogi-stat-card--purple .imogi-stat-card-icon{background:#ede9fe;color:#7c3aed}
		.imogi-stat-card--orange .imogi-stat-card-icon{background:#ffedd5;color:#ea580c}
		.imogi-stat-card--warning .imogi-stat-card-icon{background:#fef9c3;color:#ca8a04}
		.imogi-stat-card--slate .imogi-stat-card-icon{background:#f1f5f9;color:#64748b}
		.imogi-stat-card-value{color:#0f172a;font-size:15px;font-variant-numeric:tabular-nums;font-weight:800;line-height:1.15;word-break:break-word}
		.imogi-stat-card--hero .imogi-stat-card-value,.imogi-stat-card--brand.imogi-stat-card--hero .imogi-stat-card-value{color:#d97706;font-size:17px}
		.imogi-stat-card--alert .imogi-stat-card-value{color:#dc2626}
		.imogi-stat-card-label{color:#64748b;font-size:10px;font-weight:600;line-height:1.2;margin-top:2px}
		.imogi-dash-panels{display:grid!important;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr));margin-top:0}
		.imogi-dash-panel{background:#fff;border:1px solid #cbd5e1;border-radius:8px;box-shadow:0 1px 4px rgba(15,23,42,.04);display:flex;flex:1;flex-direction:column;min-height:100%;overflow:hidden;width:100%}
		.imogi-dash-panel-head{align-items:center;background:#f8fafc;border-bottom:1px solid #e2e8f0;display:flex;flex-shrink:0;gap:8px;justify-content:space-between;padding:10px 14px}
		.imogi-dash-panel-head-left{align-items:center;display:flex;gap:8px;min-width:0}
		.imogi-dash-panel-icon{align-items:center;border-radius:6px;display:inline-flex;flex-shrink:0;font-size:11px;height:26px;justify-content:center;width:26px}
		.imogi-dash-panel--brand .imogi-dash-panel-icon{background:#fef3c7;color:#d97706}
		.imogi-dash-panel--warning .imogi-dash-panel-icon{background:#ffedd5;color:#ea580c}
		.imogi-dash-panel--success .imogi-dash-panel-icon{background:#d1fae5;color:#059669}
		.imogi-dash-panel--blue .imogi-dash-panel-icon{background:#dbeafe;color:#2563eb}
		.imogi-dash-panel--purple .imogi-dash-panel-icon{background:#ede9fe;color:#7c3aed}
		.imogi-dash-panel--orange .imogi-dash-panel-icon{background:#ffedd5;color:#ea580c}
		.imogi-dash-panel--danger .imogi-dash-panel-icon{background:#fee2e2;color:#dc2626}
		.imogi-dash-panel--slate .imogi-dash-panel-icon{background:#f1f5f9;color:#64748b}
		.imogi-dash-panel-title{color:#0f172a;font-size:12px;font-weight:800;letter-spacing:.02em;text-transform:uppercase}
		.imogi-dash-panel-badge{background:#fee2e2;border-radius:999px;color:#b91c1c;flex-shrink:0;font-size:10px;font-weight:700;padding:3px 8px}
		.imogi-dash-panel-body{flex:1;min-height:120px;padding:12px 14px 14px}
		.imogi-dash-bars,.imogi-dash-stock-list{display:flex;flex-direction:column;gap:10px}
		.imogi-dash-bar-head,.imogi-dash-stock-head{align-items:center;display:flex;gap:8px;justify-content:space-between;margin-bottom:4px}
		.imogi-dash-bar-name,.imogi-dash-stock-head span:first-child{color:#334155;flex:1;font-size:12px;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
		.imogi-dash-bar-meta,.imogi-dash-stock-qty{color:#64748b;flex-shrink:0;font-size:11px;white-space:nowrap}
		.imogi-dash-stock-qty b{color:#dc2626}
		.imogi-dash-rank{background:#e2e8f0;border-radius:4px;color:#64748b;display:inline-block;font-size:10px;font-weight:700;margin-right:6px;min-width:18px;padding:1px 5px;text-align:center}
		.imogi-dash-bar-track{background:#e2e8f0;border-radius:999px;height:6px;overflow:hidden;width:100%}
		.imogi-dash-bar-fill{border-radius:999px;height:100%;min-width:4px}
		.imogi-dash-bar-fill--brand{background:linear-gradient(90deg,#fbbf24,#f39c12)}
		.imogi-dash-bar-fill--success{background:linear-gradient(90deg,#34d399,#10b981)}
		.imogi-dash-bar-fill--blue{background:linear-gradient(90deg,#60a5fa,#3b82f6)}
		.imogi-dash-bar-fill--purple{background:linear-gradient(90deg,#a78bfa,#8b5cf6)}
		.imogi-dash-bar-fill--danger{background:linear-gradient(90deg,#f87171,#ef4444)}
		.imogi-dash-muted{color:#94a3b8}
		.imogi-dash-empty{align-items:center;color:#94a3b8;display:flex;flex:1;flex-direction:column;font-size:12px;gap:8px;justify-content:center;min-height:100px;text-align:center}
		.imogi-dash-stock-list{max-height:220px;overflow:auto;padding-right:2px}
		.imogi-shift-banner{align-items:center;border-radius:8px;display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;padding:8px 12px}
		.imogi-shift-banner--open{background:#ecfdf5;border:1px solid #a7f3d0;border-left:3px solid #10b981}
		.imogi-shift-banner--closed{background:#fffbeb;border:1px solid #fde68a;border-left:3px solid #f59e0b}
		.imogi-shift-banner-text{align-items:center;display:flex;gap:10px;font-size:12px}
		.imogi-shift-icon{align-items:center;border-radius:6px;display:inline-flex;flex-shrink:0;font-size:12px;height:28px;justify-content:center;width:28px}
		.imogi-shift-banner--open .imogi-shift-icon{background:#bbf7d0;color:#15803d}
		.imogi-shift-banner--closed .imogi-shift-icon{background:#fde68a;color:#b45309}
		.imogi-shift-meta{color:#64748b;font-size:11px;margin-top:2px}
		.imogi-shift-banner-actions{align-items:center;display:flex;flex-wrap:wrap;gap:6px}
		.imogi-dash-footer{color:#94a3b8;font-size:11px;margin-top:14px;text-align:right}
		.imogi-dash-panel--focused{animation:imogi-dash-focus-pulse 2.2s ease;outline:2px solid #f39c12;outline-offset:2px}
		@keyframes imogi-dash-focus-pulse{0%,100%{outline-color:rgba(243,156,18,.95)}50%{outline-color:rgba(243,156,18,.35)}}
		@media (max-width:1199px){
			.imogi-target-strip-meta{grid-template-columns:repeat(2,minmax(0,1fr))}
			.imogi-dash-stats-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}
			.imogi-stat-card{border-bottom:1px solid #edf2f7}
			.imogi-stat-card:nth-child(3n){border-right:none}
		}
		@media (max-width:767px){
			.imogi-dash-topbar,.imogi-dash-hero{border-radius:8px}
			.imogi-dash-upgrade-strip,.imogi-dash-hero{border-top:1px solid #cbd5e1}
			.imogi-dash-hero{padding:12px}
			.imogi-dash-hero-right,.imogi-shift-banner{flex-direction:column;align-items:stretch;width:100%}
			.imogi-dash-hero-actions,.imogi-dash-hero-controls,.imogi-dash-upgrade-actions{width:100%}
			.imogi-target-strip-body{align-items:flex-start;flex-direction:column}
			.imogi-target-strip-meta{grid-template-columns:1fr 1fr}
			.imogi-dash-stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
			.imogi-stat-card:nth-child(2n){border-right:none}
			.imogi-dash-panels{grid-template-columns:1fr!important}
			.imogi-btn-brand,.imogi-btn-ghost,.imogi-dash-upgrade-actions a{width:100%!important}
		}
	`,
		"imogi-dashboard-inline-css-v8"
	);
}

frappe.pages["imogi-pos-dashboard"].on_page_load = function (wrapper) {
	inject_dashboard_css();

	const is_umkm = frappe.boot.imogi_pos_business_type === "UMKM";
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: is_umkm ? __("Dashboard UMKM") : __("IMOGI POS Dashboard"),
		single_column: true,
	});

	page.main.addClass("imogi-dashboard-page");
	if (is_umkm) {
		new imogi_pos.UmkDashboard(page);
	} else {
		new imogi_pos.OperationsDashboard(page);
	}
	frappe.breadcrumbs.add("Imogi POS");

	if (!window.__imogi_dashboard_styles_ready) {
		frappe.require("/assets/imogi_pos/css/imogi_pos.css", () => {
			window.__imogi_dashboard_styles_ready = true;
		});
	}
};

const IMOGI_DASHBOARD_BRANCH_KEY = "imogi_dashboard_branch_v1";

imogi_pos.DashboardBase = class DashboardBase {
	constructor(page) {
		this.page = page;
		this.wrapper = $(page.body);
		this.selected_date = frappe.datetime.get_today();
		this.selected_branch = "";
		this.refresh_timer = null;
		this.pending_focus = imogi_pos.dashboard_focus?.resolve?.() || null;
		this._focus_applied = false;
		try {
			this.selected_branch = localStorage.getItem(IMOGI_DASHBOARD_BRANCH_KEY) || "";
		} catch (e) {
			this.selected_branch = "";
		}
	}

	bind_realtime() {
		frappe.realtime.on("imogi_pos_order_completed", () => this.refresh());
		frappe.realtime.on("imogi_pos_order_status", () => this.refresh());
		frappe.realtime.on("imogi_low_stock_alert", () => this.refresh());
		frappe.realtime.on("imogi_pos_settings_updated", () => this.refresh());
	}

	bind_toolbar() {
		this.wrapper.find(".imogi-dash-date").val(this.selected_date).on("change", (e) => {
			this.set_date(e.target.value);
		});
		this.wrapper.find(".imogi-dash-branch-select").on("change", (e) => {
			this.set_branch($(e.currentTarget).val() || "");
		});
		this.wrapper.find(".imogi-dash-quick-today").on("click", () => {
			this.set_date(frappe.datetime.get_today());
		});
		this.wrapper.find(".imogi-dash-quick-yesterday").on("click", () => {
			this.set_date(frappe.datetime.add_days(frappe.datetime.get_today(), -1));
		});
		this.wrapper.find(".imogi-dash-refresh").on("click", () => this.refresh());
	}

	set_branch(branch_code) {
		this.selected_branch = branch_code || "";
		try {
			if (this.selected_branch) {
				localStorage.setItem(IMOGI_DASHBOARD_BRANCH_KEY, this.selected_branch);
			} else {
				localStorage.removeItem(IMOGI_DASHBOARD_BRANCH_KEY);
			}
		} catch (e) {
			/* ignore */
		}
		this.wrapper.find(".imogi-dash-branch-select").val(this.selected_branch);
		this.refresh();
	}

	dashboard_api_args() {
		const args = { date: this.selected_date };
		if (this.selected_branch) args.branch = this.selected_branch;
		const company =
			frappe.defaults.get_user_default("Company") ||
			frappe.boot?.imogi_pos_default_company ||
			"";
		if (company) args.company = company;
		return args;
	}

	render_branch_filter(branches, active_branch) {
		const $wrap = this.wrapper.find(".imogi-dash-branch-wrap");
		if (!branches || branches.length <= 1) {
			$wrap.hide();
			return;
		}
		const active = active_branch?.branch_code || this.selected_branch || "";
		const options = [`<option value="">${__("Semua Cabang")}</option>`]
			.concat(
				branches.map((row) => {
					const label = row.city
						? `${row.branch_name} (${row.city})`
						: row.branch_name || row.branch_code;
					return `<option value="${frappe.utils.escape_html(row.branch_code)}"${
						row.branch_code === active ? " selected" : ""
					}>${frappe.utils.escape_html(label)}</option>`;
				})
			)
			.join("");
		$wrap.show().find(".imogi-dash-branch-select").html(options);
		if (active) this.selected_branch = active;
	}

	render_branch_breakdown(data) {
		const $panel = this.wrapper.find(".imogi-dash-branch-panel");
		const rows = data.branch_breakdown || [];
		if (!data.multi_branch_enabled || data.active_branch || !rows.length) {
			$panel.hide().empty();
			return;
		}
		const currencyNote = data.branch_breakdown_mixed_currency
			? `<div class="alert alert-warning small mb-3">${frappe.utils.escape_html(
					data.branch_breakdown_currency_note ||
						__("Total cabang dijumlahkan tanpa konversi mata uang.")
			  )}</div>`
			: "";
		$panel.show().html(`
			<div class="imogi-dash-stats-card">
				<div class="imogi-dash-stats-head">${__("Perbandingan Cabang")}</div>
				<div class="imogi-dash-panel-body" style="padding:16px 18px 18px">
					${currencyNote}
					<div class="imogi-dash-branch-grid">${rows
						.map((row) => {
							const pct = Math.min(100, Math.max(4, flt(row.target_progress_pct)));
							return `
							<div class="imogi-dash-branch-card">
								<div class="imogi-dash-branch-card-head">
									<div>
										<div class="imogi-dash-branch-card-name">${frappe.utils.escape_html(
											row.branch_name || row.branch_code
										)}</div>
										${
											row.city
												? `<div class="imogi-dash-branch-card-city">${frappe.utils.escape_html(
														row.city
												  )}</div>`
												: ""
										}
									</div>
									<div class="imogi-dash-branch-card-sales">${format_currency(
										row.sales_today || 0
									)}</div>
								</div>
								<div class="imogi-dash-branch-card-meta">
									<span>${row.completed_today || 0} ${__("transaksi")}</span>
									<span>${__("Target")} ${pct}%</span>
								</div>
								<div class="imogi-dash-branch-card-track">
									<div class="imogi-dash-branch-card-fill" style="width:${pct}%"></div>
								</div>
							</div>`;
						})
						.join("")}</div>
				</div>
			</div>
		`);
	}

	set_date(date) {
		this.selected_date = date;
		this.wrapper.find(".imogi-dash-date").val(date);
		this.wrapper.find(".imogi-dash-date-display").text(frappe.datetime.str_to_user(date));
		this.refresh();
	}

	refresh() {
		this.wrapper.addClass("imogi-dash-loading");
		frappe.call({
			method: "imogi_pos.api.dashboard.get_dashboard_metrics",
			args: this.dashboard_api_args(),
			callback: (r) => {
				this.wrapper.removeClass("imogi-dash-loading");
				const data = r.message || {};
				this.render_branch_filter(data.branches || [], data.active_branch);
				this.render(data);
				this.apply_pending_focus();
			},
			error: () => this.wrapper.removeClass("imogi-dash-loading"),
		});
		clearInterval(this.refresh_timer);
		this.refresh_timer = setInterval(() => this.refresh(), 30000);
	}

	render_shell(options = {}) {
		const subtitle = options.subtitle || "";
		const actions = options.actions || "";
		this.wrapper.html(`
			<div class="imogi-dash-shell">
				<div class="imogi-dash-topbar">
					<div class="imogi-dash-topbar-left">
						<span class="imogi-dash-live-dot" title="${__("Live")}"></span>
						<span class="imogi-dash-topbar-title">IMOGI POS</span>
						<span class="imogi-dash-topbar-co"></span>
					</div>
					<div class="imogi-dash-topbar-right">
						<span class="imogi-dash-tier-badge"></span>
						<span class="imogi-dash-topbar-date"></span>
					</div>
				</div>
				<div class="imogi-dash-upgrade-slot"></div>
				<div class="imogi-dash-hero">
					<div class="imogi-dash-hero-text">
						<div class="imogi-dash-date-display">${frappe.utils.escape_html(
							frappe.datetime.str_to_user(this.selected_date)
						)}</div>
						${subtitle ? `<p class="imogi-dash-hero-sub">${subtitle}</p>` : ""}
					</div>
					<div class="imogi-dash-hero-right">
						<div class="imogi-dash-hero-controls">
							<div class="imogi-dash-branch-wrap" style="display:none;">
								<label>${__("Cabang")}</label>
								<select class="form-control form-control-sm imogi-dash-branch-select imogi-dash-branch-select"></select>
							</div>
							<div class="imogi-dash-date-wrap">
								<label>${__("Tanggal")}</label>
								<input type="date" class="form-control form-control-sm imogi-dash-date" />
							</div>
							<div class="imogi-dash-quick-group">
								<button type="button" class="imogi-dash-chip imogi-dash-quick-today">${__(
									"Hari ini"
								)}</button>
								<button type="button" class="imogi-dash-chip imogi-dash-quick-yesterday">${__(
									"Kemarin"
								)}</button>
								<button type="button" class="imogi-dash-chip imogi-dash-chip--icon imogi-dash-refresh" title="${__(
									"Muat ulang"
								)}">
									<i class="fa fa-refresh"></i>
								</button>
							</div>
							${actions ? `<div class="imogi-dash-hero-actions">${actions}</div>` : ""}
						</div>
					</div>
				</div>
				<div class="imogi-dash-alerts-stack">
					<div class="imogi-pos-shift-alert" style="display:none;"></div>
					<div class="imogi-awaiting-alert" style="display:none;"></div>
				</div>
				<div class="imogi-sales-target-banner" style="display:none;"></div>
				<div class="imogi-dash-branch-panel" style="display:none;"></div>
				<div class="imogi-dash-stats-card">
					<div class="imogi-dash-stats-head">${__("Ringkasan Hari Ini")}</div>
					<div class="imogi-dash-stats-grid"></div>
				</div>
				<div class="imogi-dash-panels"></div>
				<div class="imogi-dash-footer"></div>
			</div>
		`);
		this.stats_grid = this.wrapper.find(".imogi-dash-stats-grid");
		this.panels = this.wrapper.find(".imogi-dash-panels");
		this.bind_toolbar();
		this.wrapper.find(".imogi-dash-date").val(this.selected_date);
	}

	add_panel(body_class, tone = "brand", focus_key = null) {
		const focus = focus_key || body_class.replace(/^imogi-/, "").replace(/-/g, "_");
		this.panels.append(`
			<div class="imogi-dash-panel imogi-dash-panel--${tone}" data-imogi-dash-focus="${frappe.utils.escape_html(
				focus
			)}">
				<div class="${body_class}"></div>
			</div>
		`);
	}

	apply_pending_focus() {
		if (this._focus_applied || !this.pending_focus || !imogi_pos.dashboard_focus?.apply) {
			return;
		}
		imogi_pos.dashboard_focus.apply(this, this.pending_focus);
		this._focus_applied = true;
		this.pending_focus = null;
	}

	render_stat_cards(metrics) {
		this.stats_grid.empty();
		metrics.forEach((metric) => {
			const tone = metric.tone || "brand";
			const hero = metric.hero ? " imogi-stat-card--hero" : "";
			const alert =
				metric.warn && cint(metric.value) > 0 ? " imogi-stat-card--alert" : "";
			this.stats_grid.append(`
				<div class="imogi-stat-card imogi-stat-card--${tone}${hero}${alert}">
					<span class="imogi-stat-card-icon"><i class="fa ${metric.icon || "fa-bar-chart"}"></i></span>
					<div class="imogi-stat-card-body">
						<div class="imogi-stat-card-value">${metric.value ?? 0}</div>
						<div class="imogi-stat-card-label">${metric.label}</div>
					</div>
				</div>
			`);
		});
	}

	render_topbar(data) {
		const company =
			data.company ||
			frappe.defaults.get_user_default("Company") ||
			frappe.boot?.imogi_pos_default_company ||
			"";
		this.wrapper.find(".imogi-dash-topbar-co").text(company);
		if (imogi_dashboard_subscription_disabled()) {
			this.wrapper.find(".imogi-dash-tier-badge").hide();
		} else {
			const tier = frappe.boot?.imogi_pos_subscription_tier || "Free";
			this.wrapper.find(".imogi-dash-tier-badge").show().text(tier).attr("data-tier", tier);
		}
		this.wrapper
			.find(".imogi-dash-topbar-date")
			.text(frappe.datetime.str_to_user(this.selected_date));
	}

	render_owner_upgrade_strip(persona = "owner") {
		const $slot = this.wrapper.find(".imogi-dash-upgrade-slot");
		if (imogi_dashboard_subscription_disabled()) {
			$slot.empty();
			return;
		}
		const tier = frappe.boot?.imogi_pos_subscription_tier || "Free";
		if (tier !== "Free") {
			$slot.empty();
			return;
		}
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
				: __("Dashboard dasar aktif — upgrade untuk QRIS, cabang, dan laporan lanjutan.");
		$slot.html(`
			<div class="imogi-dash-upgrade-strip" role="complementary">
				<div class="imogi-dash-upgrade-strip-main">
					<span class="imogi-dash-upgrade-badge">${__("Paket Free")}</span>
					<span class="imogi-dash-upgrade-text">${copy}</span>
					<div class="imogi-dash-upgrade-pills">
						${locks
							.map(
								(row) =>
									`<span class="imogi-dash-upgrade-pill"><i class="fa fa-lock"></i> ${row.label} <small>${row.tier}+</small></span>`
							)
							.join("")}
					</div>
				</div>
				<div class="imogi-dash-upgrade-actions">
					<a class="imogi-dash-link-ghost" href="/app/imogi-pos-feature-matrix"><i class="fa fa-th-list"></i> ${__(
						"Bandingkan"
					)}</a>
					${
						persona === "owner"
							? `<a class="imogi-dash-link-brand" href="/app/imogi-pos-settings"><i class="fa fa-arrow-up"></i> ${__(
									"Upgrade"
							  )}</a>`
							: ""
					}
				</div>
			</div>
		`);
	}

	render_panel_open(title, icon, badge, extra) {
		return `
			<div class="imogi-dash-panel-head">
				<div class="imogi-dash-panel-head-left">
					<span class="imogi-dash-panel-icon"><i class="fa ${icon}"></i></span>
					<span class="imogi-dash-panel-title">${title}${extra ? ` · ${extra}` : ""}</span>
				</div>
				${badge ? `<span class="imogi-dash-panel-badge">${badge}</span>` : ""}
			</div>
			<div class="imogi-dash-panel-body">
		`;
	}

	render_panel_close() {
		return `</div>`;
	}

	render_empty(message, icon = "fa-inbox") {
		return `<div class="imogi-dash-empty"><i class="fa ${icon}"></i><span>${message}</span></div>`;
	}

	render_bars(rows, options = {}) {
		const label_key = options.label_key || "label";
		const value_key = options.value_key || "value";
		const meta_fn = options.meta_fn || (() => "");
		const tone = options.tone || "brand";
		const max = Math.max(...rows.map((r) => flt(r[value_key])), 1);

		return rows
			.map((row, index) => {
				const value = flt(row[value_key]);
				const pct = Math.max(6, Math.round((value / max) * 100));
				const rank = options.show_rank
					? `<span class="imogi-dash-rank">${index + 1}</span>`
					: "";
				return `
					<div class="imogi-dash-bar-item">
						<div class="imogi-dash-bar-head">
							<div class="imogi-dash-bar-name">${rank}${frappe.utils.escape_html(
								row[label_key] || "-"
							)}</div>
							<div class="imogi-dash-bar-meta">${meta_fn(row)}</div>
						</div>
						<div class="imogi-dash-bar-track">
							<div class="imogi-dash-bar-fill imogi-dash-bar-fill--${tone}" style="width:${pct}%"></div>
						</div>
					</div>
				`;
			})
			.join("");
	}

	render_footer(data) {
		const ts = data.timestamp ? frappe.datetime.str_to_user(data.timestamp) : "";
		this.wrapper.find(".imogi-dash-footer").html(
			ts
				? `<i class="fa fa-clock-o"></i> ${__("Terakhir diperbarui")}: ${frappe.utils.escape_html(
						ts
				  )} · ${__("Auto refresh 30 detik")}`
				: ""
		);
	}

	render_awaiting_alert(data) {
		const orders = data.awaiting_orders || [];
		const $el = this.wrapper.find(".imogi-awaiting-alert");
		if (!orders.length) {
			$el.hide();
			return;
		}
		const visible = orders.slice(0, 3);
		const extra = orders.length - visible.length;
		$el.show().html(`
			<div class="imogi-dash-awaiting-strip">
				<div class="imogi-dash-awaiting-label">
					<i class="fa fa-clock-o"></i>
					<strong>${orders.length}</strong> ${__("menunggu bayar")}
				</div>
				<div class="imogi-dash-awaiting-chips">
					${visible
						.map(
							(o) =>
								`<a class="imogi-dash-awaiting-chip" href="/app/riwayat-order/${encodeURIComponent(
									o.name
								)}">${frappe.utils.escape_html(o.name)} <span>${format_currency(
									o.grand_total || 0
								)}</span></a>`
						)
						.join("")}
					${extra > 0 ? `<span class="imogi-dash-awaiting-more">+${extra}</span>` : ""}
				</div>
				<a class="imogi-dash-awaiting-link" href="/app/riwayat-order?status=Awaiting+Payment">${__(
					"Lihat semua"
				)} <i class="fa fa-angle-right"></i></a>
			</div>
		`);
	}

	render_sales_target(data) {
		const target = data.sales_target || {};
		const $el = this.wrapper.find(".imogi-sales-target-banner");
		if (!target.enabled) {
			$el.hide();
			return;
		}

		const pct = Math.min(100, Math.max(2, flt(target.progress_pct)));
		const statusClass =
			target.status === "achieved"
				? "is-achieved"
				: target.status === "behind"
					? "is-behind"
					: "";

		$el.show()
			.removeClass("is-achieved is-behind")
			.addClass(statusClass)
			.html(`
			<div class="imogi-target-strip ${statusClass}">
				<div class="imogi-target-strip-head">
					<i class="fa fa-bullseye"></i>
					<span class="imogi-target-strip-title">${__("Target Omzet Bulanan")}</span>
					<span class="imogi-target-strip-sub">${frappe.utils.escape_html(target.month_label || "")}</span>
					<span class="imogi-target-strip-badge">${frappe.utils.escape_html(target.status_label || "")}</span>
				</div>
				<div class="imogi-target-strip-body">
					<span class="imogi-target-strip-actual">${format_currency(target.actual_amount || 0)}</span>
					<div class="imogi-target-strip-track">
						<div class="imogi-target-strip-fill" style="width:${pct}%"></div>
					</div>
					<span class="imogi-target-strip-pct">${pct}%</span>
				</div>
				<div class="imogi-target-strip-meta">
					<div><small>${__("Sisa")}</small><span>${format_currency(target.remaining_amount || 0)}</span></div>
					<div><small>${__("Rata-rata/hari")}</small><span>${format_currency(target.daily_average || 0)}</span></div>
					<div><small>${__("Perlu/hari")}</small><span>${format_currency(target.daily_pace_needed || 0)}</span></div>
					<div><small>${__("Hari tersisa")}</small><span>${target.days_remaining || 0}</span></div>
				</div>
			</div>
		`);
	}

	render_top_products(data) {
		const rows = (data.top_products || []).map((r) => ({
			...r,
			item_name: r.item_name || r.item_code,
		}));
		const $el = this.wrapper.find(".imogi-top-products");
		if (!rows.length) {
			$el.html(
				this.render_panel_open(__("Top 5 Produk"), "fa-star") +
					this.render_empty(__("Belum ada penjualan hari ini."), "fa-shopping-basket") +
					this.render_panel_close()
			);
			return;
		}
		$el.html(
			this.render_panel_open(__("Top 5 Produk"), "fa-star") +
				`<div class="imogi-dash-bars">${this.render_bars(rows, {
					label_key: "item_name",
					value_key: "sales",
					show_rank: true,
					tone: "brand",
					meta_fn: (r) =>
						`<strong>${r.qty}</strong> ${__("pcs")} · ${format_currency(r.sales || 0)}`,
				})}</div>` +
				this.render_panel_close()
		);
	}

	render_low_stock(data) {
		const rows = data.low_stock_items || [];
		const $el = this.wrapper.find(".imogi-low-stock");
		if (!$el.length) return;
		const warehouse = rows[0]?.warehouse || data.active_branch?.warehouse;
		const warehouse_note = warehouse
			? `<span class="text-muted small">${frappe.utils.escape_html(warehouse)}</span>`
			: "";
		if (!rows.length) {
			$el.html(
				this.render_panel_open(__("Stok Menipis"), "fa-cubes", null, warehouse_note) +
					this.render_empty(__("Semua stok aman."), "fa-check-circle") +
					this.render_panel_close()
			);
			return;
		}
		$el.html(
			this.render_panel_open(__("Stok Menipis"), "fa-exclamation-triangle", rows.length, warehouse_note) +
				`<div class="imogi-dash-stock-list">${rows
					.map((r) => {
						const pct = Math.min(
							100,
							Math.round((flt(r.actual_qty) / Math.max(flt(r.reorder_level), 1)) * 100)
						);
						return `
						<div class="imogi-dash-stock-item">
							<div class="imogi-dash-stock-head">
								<span>${frappe.utils.escape_html(r.item_name || r.item_code)}</span>
								<span class="imogi-dash-stock-qty"><b>${r.actual_qty}</b> / ${r.reorder_level}</span>
							</div>
							<div class="imogi-dash-bar-track">
								<div class="imogi-dash-bar-fill imogi-dash-bar-fill--danger" style="width:${Math.max(
									4,
									pct
								)}%"></div>
							</div>
						</div>`;
					})
					.join("")}</div>` +
				this.render_panel_close()
		);
	}

	render_pos_shift(data) {
		const shift = data.pos_shift || {};
		const $el = this.wrapper.find(".imogi-pos-shift-alert");
		if (!shift.enabled || !cint(frappe.boot.imogi_pos_requires_shift_workflow)) {
			$el.hide().empty();
			return;
		}
		$el.show();
		if (shift.open) {
			const since = frappe.datetime.str_to_user(shift.period_start_date);
			$el.html(`
				<div class="imogi-shift-banner imogi-shift-banner--open">
					<div class="imogi-shift-banner-text">
						<span class="imogi-shift-icon"><i class="fa fa-unlock"></i></span>
						<div>
							<strong>${__("Shift Kasir Terbuka")}</strong>
							<div class="imogi-shift-meta">
								<a href="${shift.opening_url || "#"}">${frappe.utils.escape_html(
									shift.name || ""
								)}</a>
								· ${__("sejak")} ${frappe.utils.escape_html(since)}
							</div>
						</div>
					</div>
					<div class="imogi-shift-banner-actions">
						<a class="imogi-btn-ghost imogi-btn-ghost--xs" href="${shift.opening_url || "#"}">${__(
							"Lihat Opening"
						)}</a>
						<button type="button" class="imogi-btn-brand imogi-btn-brand--xs imogi-close-shift-btn">${__(
							"Tutup Shift"
						)}</button>
					</div>
				</div>
			`);
			$el.find(".imogi-close-shift-btn").on("click", () => {
				imogi_pos.close_shift({
					name: shift.name,
					company: shift.company,
					pos_profile: shift.pos_profile,
					period_start_date: shift.period_start_date,
				});
			});
		} else {
			$el.html(`
				<div class="imogi-shift-banner imogi-shift-banner--closed">
					<div class="imogi-shift-banner-text">
						<span class="imogi-shift-icon"><i class="fa fa-lock"></i></span>
						<span>${__("Shift kasir belum dibuka.")}</span>
					</div>
					<a class="imogi-btn-brand imogi-btn-brand--xs" href="/app/imogi-pos-cashier">${__(
						"Buka Shift di Kasir"
					)}</a>
				</div>
			`);
		}
	}

	render_count_list(el, title, icon, rows, key) {
		if (!rows.length) {
			el.html(
				this.render_panel_open(title, icon) +
					this.render_empty(__("Belum ada data.")) +
					this.render_panel_close()
			);
			return;
		}
		el.html(
			this.render_panel_open(title, icon) +
				`<div class="imogi-dash-bars">${this.render_bars(
					rows.map((r) => ({ label: r[key], value: r.count, count: r.count })),
					{
						label_key: "label",
						value_key: "value",
						tone: "blue",
						meta_fn: (r) => `<strong>${r.count}</strong> ${__("order")}`,
					}
				)}</div>` +
				this.render_panel_close()
		);
	}

	render_payment_list(rows) {
		const el = this.wrapper.find(".imogi-payment-chart");
		if (!el.length) return;
		if (!rows.length) {
			el.html(
				this.render_panel_open(__("Metode Pembayaran"), "fa-credit-card") +
					this.render_empty(__("Belum ada transaksi.")) +
					this.render_panel_close()
			);
			return;
		}
		el.html(
			this.render_panel_open(__("Metode Pembayaran"), "fa-credit-card") +
				`<div class="imogi-dash-bars">${this.render_bars(rows, {
					label_key: "mode_of_payment",
					value_key: "amount",
					tone: "purple",
					meta_fn: (r) =>
						`<strong>${format_currency(r.amount)}</strong> <span class="imogi-dash-muted">(${r.count}x)</span>`,
				})}</div>` +
				this.render_panel_close()
		);
	}
};

imogi_pos.OperationsDashboard = class OperationsDashboard extends imogi_pos.DashboardBase {
	constructor(page) {
		super(page);
		this.make();
		this.refresh();
		this.bind_realtime();
	}

	make() {
		const focus_meta = imogi_pos.dashboard_focus?.get_meta?.(this.pending_focus);
		this.render_shell({
			subtitle:
				focus_meta?.subtitle ||
				__("Ringkasan penjualan dan operasional — semua panel analitik ada di halaman ini."),
			actions: `<a class="imogi-btn-brand" href="/app/imogi-pos-cashier"><i class="fa fa-shopping-cart"></i> ${__(
				"Buka Kasir"
			)}</a>`,
		});
		if (focus_meta?.page_title && this.page?.set_title) {
			this.page.set_title(focus_meta.page_title);
		}
		this.add_panel("imogi-top-products", "brand", "top_menu");
		this.add_panel("imogi-low-stock", "warning", "low_stock");
		this.add_panel("imogi-channel-chart", "blue", "channel");
		this.add_panel("imogi-type-chart", "purple", "order_type");
		this.add_panel("imogi-sales-hour", "success", "sales_by_hour");
		this.add_panel("imogi-sales-category", "brand", "sales_by_category");
		this.add_panel("imogi-discount-report", "warning", "discount_report");
		this.add_panel("imogi-refund-report", "danger", "refund_report");
		this.add_panel("imogi-payment-chart", "purple", "sales_by_payment");
		this.add_panel("imogi-food-cost", "orange", "food_cost_report");
		this.add_panel("imogi-table-turnover", "slate", "table_turnover_report");
	}

	render(data) {
		this.render_topbar(data);
		this.render_pos_shift(data);
		this.render_awaiting_alert(data);
		this.render_sales_target(data);
		this.render_branch_breakdown(data);
		this.render_stat_cards([
			{
				label: __("Penjualan"),
				value: format_currency(data.sales_today || 0),
				icon: "fa-money",
				tone: "brand",
				hero: true,
			},
			{
				label: __("Order Selesai"),
				value: data.completed_today || 0,
				icon: "fa-check-circle",
				tone: "success",
			},
			{ label: __("Total Order"), value: data.orders_today || 0, icon: "fa-list-alt", tone: "slate" },
			{ label: __("Di Kitchen"), value: data.in_kitchen || 0, icon: "fa-fire", tone: "orange" },
			{ label: __("In Service"), value: data.in_service || 0, icon: "fa-cutlery", tone: "blue" },
			{
				label: __("Kitchen Aktif"),
				value: data.open_kitchen_orders || 0,
				icon: "fa-bell",
				tone: "warning",
			},
		]);

		this.render_top_products(data);
		this.render_low_stock(data);
		this.render_count_list(
			this.wrapper.find(".imogi-channel-chart"),
			__("By Channel"),
			"fa-random",
			data.by_channel || [],
			"order_channel"
		);
		this.render_count_list(
			this.wrapper.find(".imogi-type-chart"),
			__("By Order Type"),
			"fa-tags",
			data.by_type || [],
			"order_type"
		);
		this.render_extended_reports(data.extended_reports || {});
		this.render_payment_list(data.by_payment || []);
		this.render_footer(data);
	}

	render_extended_reports(reports) {
		const hour = (reports.sales_by_hour?.rows || []).map((r) => ({
			hour_label: `${String(r.hour_slot).padStart(2, "0")}:00`,
			order_count: r.order_count,
			sales: r.sales,
		}));
		this.render_bars_panel(
			this.wrapper.find(".imogi-sales-hour"),
			__("Penjualan per Jam"),
			"fa-clock-o",
			hour,
			{
				label_key: "hour_label",
				value_key: "sales",
				tone: "success",
				meta_fn: (r) => `${r.order_count} order · ${format_currency(r.sales)}`,
			}
		);
		const cat = reports.sales_by_category?.rows || [];
		this.render_bars_panel(
			this.wrapper.find(".imogi-sales-category"),
			__("Penjualan per Kategori"),
			"fa-pie-chart",
			cat,
			{ label_key: "category", value_key: "sales", tone: "brand" }
		);
		const disc = reports.discount_report || {};
		this.render_simple_list(
			this.wrapper.find(".imogi-discount-report"),
			__("Laporan Diskon"),
			"fa-tag",
			(disc.rows || []).slice(0, 8).map((r) => ({
				label: r.name,
				meta: `${format_currency(r.discount_amount || 0)} · ${frappe.datetime.str_to_user(r.creation)}`,
			})),
			disc.count ? `${disc.count} transaksi` : ""
		);
		const ref = reports.refund_report || {};
		this.render_simple_list(
			this.wrapper.find(".imogi-refund-report"),
			__("Laporan Refund"),
			"fa-undo",
			(ref.rows || []).slice(0, 8).map((r) => ({
				label: r.name,
				meta: `${format_currency(r.refunded_amount || 0)} · ${r.status}`,
			})),
			ref.count ? `${ref.count} refund` : ""
		);
		const food = reports.food_cost_report || {};
		if (!food.locked) {
			const $fc = this.wrapper.find(".imogi-food-cost");
			$fc.html(
				this.render_panel_open(__("Food Cost"), "fa-pie-chart", food.food_cost_percent ? `${Number(food.food_cost_percent).toFixed(1)}%` : "") +
					`<div class="imogi-mini-stats imogi-mini-stats--grid">
						<div class="imogi-mini-stat"><span class="imogi-mini-stat-label">${__("Penjualan")}</span><span class="imogi-mini-stat-val">${format_currency(food.sales || 0)}</span></div>
						<div class="imogi-mini-stat"><span class="imogi-mini-stat-label">${__("Food Cost")}</span><span class="imogi-mini-stat-val">${format_currency(food.food_cost || 0)}</span></div>
						<div class="imogi-mini-stat"><span class="imogi-mini-stat-label">${__("Margin")}</span><span class="imogi-mini-stat-val">${format_currency(food.margin || 0)}</span></div>
					</div>` +
					this.render_panel_close()
			);
		}
		const turnover = reports.table_turnover_report?.rows || [];
		if (!reports.table_turnover_report?.locked) {
			this.render_simple_list(
				this.wrapper.find(".imogi-table-turnover"),
				__("Table Turnover"),
				"fa-table",
				turnover.slice(0, 8).map((r) => ({
					label: r.table_number || r.name,
					meta: `${r.turns || 0} putaran · ${format_currency(r.sales || 0)}`,
				}))
			);
		}
	}

	render_bars_panel(el, title, icon, rows, opts) {
		if (!rows.length) {
			el.html(this.render_panel_open(title, icon) + this.render_empty(__("Belum ada data.")) + this.render_panel_close());
			return;
		}
		el.html(
			this.render_panel_open(title, icon) +
				`<div class="imogi-dash-bars">${this.render_bars(rows, opts)}</div>` +
				this.render_panel_close()
		);
	}

	render_simple_list(el, title, icon, rows, badge) {
		if (!rows.length) {
			el.html(
				this.render_panel_open(title, icon) +
					this.render_empty(__("Belum ada data.")) +
					this.render_panel_close()
			);
			return;
		}
		el.html(
			this.render_panel_open(title, icon, badge || null) +
				`<div class="imogi-dash-bars">${rows
					.map(
						(r) => `<div class="imogi-dash-bar-head">
						<span class="imogi-dash-bar-name">${frappe.utils.escape_html(r.label)}</span>
						<span class="imogi-dash-bar-meta">${frappe.utils.escape_html(r.meta || "")}</span>
					</div>`
					)
					.join("")}</div>` +
				this.render_panel_close()
		);
	}
};

imogi_pos.UmkDashboard = class UmkDashboard extends imogi_pos.DashboardBase {
	constructor(page) {
		super(page);
		this.make();
		this.refresh();
		this.bind_realtime();
	}

	make() {
		const focus_meta = imogi_pos.dashboard_focus?.get_meta?.(this.pending_focus);
		this.render_shell({
			subtitle:
				focus_meta?.subtitle ||
				__("Ringkasan penjualan UMKM — pantau omzet harian outlet Anda."),
			actions: `
				<a class="imogi-btn-ghost" href="/app/imogi-pos-sales-report"><i class="fa fa-bar-chart"></i> ${__(
					"Laporan Penjualan"
				)}</a>
				<a class="imogi-btn-ghost" href="/app/query-report/IMOGI UMKM Daily Sales"><i class="fa fa-file-text-o"></i> ${__(
					"Laporan Harian"
				)}</a>
				<a class="imogi-btn-ghost" href="/app/query-report/IMOGI Branch Sales Summary"><i class="fa fa-building-o"></i> ${__(
					"Laporan Cabang"
				)}</a>
			`,
		});
		if (focus_meta?.page_title && this.page?.set_title) {
			this.page.set_title(focus_meta.page_title);
		}
		if (!imogi_dashboard_subscription_disabled()) {
			this.render_owner_upgrade_strip("owner");
		}
		this.add_panel("imogi-top-products", "brand", "top_menu");
		this.add_panel("imogi-low-stock", "warning", "low_stock");
		this.add_panel("imogi-payment-chart", "success", "sales_by_payment");
		this.add_panel("imogi-source-chart", "blue", "channel");
	}

	render(data) {
		this.render_topbar(data);
		this.render_pos_shift(data);
		this.render_awaiting_alert(data);
		this.render_sales_target(data);
		this.render_branch_breakdown(data);
		this.render_stat_cards([
			{
				label: __("Penjualan"),
				value: format_currency(data.sales_today || 0),
				icon: "fa-money",
				tone: "brand",
				hero: true,
			},
			{
				label: __("Transaksi Selesai"),
				value: data.completed_today || 0,
				icon: "fa-check-circle",
				tone: "success",
			},
			{
				label: __("Rata-rata / Transaksi"),
				value: format_currency(data.avg_ticket || 0),
				icon: "fa-calculator",
				tone: "slate",
			},
			{
				label: __("Menunggu Bayar"),
				value: data.awaiting_payment || 0,
				icon: "fa-clock-o",
				tone: "danger",
				warn: true,
			},
			{
				label: __("Total Order"),
				value: data.orders_today || 0,
				icon: "fa-shopping-cart",
				tone: "blue",
			},
			{
				label: __("POS Invoice"),
				value: data.pos_invoices_today || 0,
				icon: "fa-file-text-o",
				tone: "purple",
			},
		]);

		this.render_top_products(data);
		this.render_low_stock(data);
		this.render_payment_list(data.by_payment || []);
		this.render_source_list(data.by_source || []);
		this.render_footer(data);
	}

	render_source_list(rows) {
		const el = this.wrapper.find(".imogi-source-chart");
		if (!rows.length) {
			el.html(
				this.render_panel_open(__("Sumber Order"), "fa-sitemap") +
					this.render_empty(__("Belum ada transaksi.")) +
					this.render_panel_close()
			);
			return;
		}
		el.html(
			this.render_panel_open(__("Sumber Order"), "fa-sitemap") +
				`<div class="imogi-dash-bars">${this.render_bars(rows, {
					label_key: "order_source",
					value_key: "sales",
					tone: "blue",
					meta_fn: (r) =>
						`<strong>${r.count}</strong> · ${format_currency(r.sales || 0)}`,
				})}</div>` +
				this.render_panel_close()
		);
	}
};
