frappe.provide("imogi_pos");

function imogi_dashboard_subscription_disabled() {
	return !!(
		frappe.boot?.imogi_pos_subscription_tiers_disabled ||
		frappe.boot?.imogi_pos_erp_enterprise_only ||
		(imogi_pos.is_subscription_tier_disabled && imogi_pos.is_subscription_tier_disabled()) ||
		(imogi_pos.is_erp_enterprise_deployment && imogi_pos.is_erp_enterprise_deployment())
	);
}

function inject_dashboard_font() {
	if (document.getElementById("imogi-dashboard-font")) return;
	const link = document.createElement("link");
	link.id = "imogi-dashboard-font";
	link.rel = "stylesheet";
	link.href =
		"https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
	document.head.appendChild(link);
}

function inject_dashboard_css() {
	[
		"imogi-dashboard-inline-css-v1",
		"imogi-dashboard-inline-css-v2",
		"imogi-dashboard-inline-css-v3",
		"imogi-dashboard-inline-css-v4",
		"imogi-dashboard-inline-css-v5",
		"imogi-dashboard-inline-css-v6",
		"imogi-dashboard-inline-css-v7",
		"imogi-dashboard-inline-css-v8",
		"imogi-dashboard-inline-css-v9",
		"imogi-dashboard-inline-css-v10",
		"imogi-dashboard-inline-css-v11",
		"imogi-dashboard-inline-css-v12",
		"imogi-dashboard-inline-css-v13",
		"imogi-dashboard-inline-css-v14",
		"imogi-dashboard-inline-css-v15",
	].forEach((id) => document.getElementById(id)?.remove());
	if (document.getElementById("imogi-dashboard-inline-css-v16")) return;
	inject_dashboard_font();
	frappe.dom.set_style(
		`
		body:has(.imogi-dashboard-page) .page-head,
		body:has(.imogi-dashboard-page) .page-head .page-title,
		body:has(.imogi-dashboard-page) .breadcrumb,
		.page-container:has(.imogi-dashboard-page) > .page-head{display:none!important}

		body.imogi-dashboard-fullscreen,
		body.imogi-dashboard-fullscreen .main-section,
		body.imogi-dashboard-fullscreen .page-container,
		body.imogi-dashboard-fullscreen .content.page-container,
		body.imogi-dashboard-fullscreen .page-body,
		body.imogi-dashboard-fullscreen .layout-main,
		body.imogi-dashboard-fullscreen .layout-main-section-wrapper,
		body.imogi-dashboard-fullscreen .layout-main-section,
		.imogi-dashboard-page.layout-main-section,
		.imogi-dashboard-page,
		.imogi-dashboard-page .page-body,
		.imogi-dashboard-page .layout-main-section-wrapper{
			background:#fff!important;
			font-family:"Plus Jakarta Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important
		}
		.imogi-dashboard-page .page-body{padding:12px 20px 28px!important}
		.imogi-dash-shell{margin:0;max-width:100%!important;padding:0;width:100%!important}
		.imogi-dash-loading{opacity:.55;pointer-events:none;transition:opacity .2s ease}

		.imogi-dashboard-page .imogi-dash-hero,
		.imogi-dash-hero{
			background:#0f172a!important;
			background-image:
				linear-gradient(135deg, rgba(245,158,11,.22), transparent 42%),
				linear-gradient(180deg, #111827 0%, #0b1220 100%)!important;
			border:1px solid rgba(255,255,255,.06)!important;
			border-radius:20px!important;
			box-shadow:0 18px 40px rgba(15,23,42,.28)!important;
			color:#e2e8f0!important;
			display:block!important;
			margin-bottom:14px!important;
			overflow:hidden!important;
			padding:18px 20px 16px!important;
			position:relative!important
		}
		.imogi-dash-hero::after{
			background:radial-gradient(circle at 85% 20%, rgba(251,191,36,.25), transparent 45%);
			content:"";
			height:220px;
			pointer-events:none;
			position:absolute;
			right:-40px;
			top:-60px;
			width:280px
		}
		.imogi-dash-hero-top{
			align-items:center;
			display:flex;
			flex-wrap:wrap;
			gap:10px 16px;
			justify-content:space-between;
			margin-bottom:14px;
			position:relative;
			z-index:1
		}
		.imogi-dash-header-brand{align-items:center;display:flex;gap:10px}
		.imogi-dashboard-page .imogi-dash-logo,
		.imogi-dash-logo{color:#fff!important;font-size:13px;font-weight:800;letter-spacing:.16em}
		.imogi-dash-live-pill{
			align-items:center;background:rgba(34,197,94,.14);border:1px solid rgba(74,222,128,.35);
			border-radius:999px;color:#86efac;display:inline-flex;font-size:10px;font-weight:700;
			gap:6px;letter-spacing:.06em;padding:4px 10px;text-transform:uppercase
		}
		.imogi-dash-live-dot{background:#22c55e;border-radius:50%;box-shadow:0 0 0 3px rgba(34,197,94,.2);height:7px;width:7px}
		.imogi-dash-header-meta{align-items:center;display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}
		.imogi-dashboard-page .imogi-dash-topbar-co,
		.imogi-dash-topbar-co{color:#e2e8f0!important;font-size:12px;font-weight:600;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
		.imogi-dash-tier-badge{background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.35);border-radius:999px;color:#fbbf24;font-size:10px;font-weight:800;letter-spacing:.06em;padding:4px 10px;text-transform:uppercase}
		.imogi-dash-tier-badge[data-tier="Starter"]{background:rgba(59,130,246,.14);border-color:rgba(96,165,250,.4);color:#93c5fd}
		.imogi-dash-tier-badge[data-tier="Professional"],
		.imogi-dash-tier-badge[data-tier="Enterprise"]{background:rgba(16,185,129,.14);border-color:rgba(52,211,153,.4);color:#6ee7b7}
		.imogi-dashboard-page .imogi-dash-topbar-date,
		.imogi-dash-topbar-date{color:#cbd5e1!important;font-size:12px;font-weight:600}

		.imogi-dash-hero-body{
			align-items:flex-end;display:flex;flex-wrap:wrap;gap:16px 20px;justify-content:space-between;position:relative;z-index:1
		}
		.imogi-dash-toolbar-main{flex:1;min-width:220px}
		.imogi-dashboard-page .imogi-dash-date-display,
		.imogi-dash-date-display{color:#fff!important;font-size:34px!important;font-variant-numeric:tabular-nums;font-weight:800;letter-spacing:-.04em;line-height:1}
		.imogi-dashboard-page .imogi-dash-hero-sub,
		.imogi-dash-hero-sub{color:#cbd5e1!important;font-size:13px!important;line-height:1.45;margin:8px 0 0;max-width:480px}
		.imogi-dash-toolbar-actions{align-items:flex-end;display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end;min-width:260px}
		.imogi-dash-hero-controls{align-items:flex-end;display:flex;flex-wrap:wrap;gap:8px 10px}
		.imogi-dash-date-wrap,.imogi-dash-branch-wrap{display:flex;flex-direction:column;gap:4px}
		.imogi-dashboard-page .imogi-dash-hero .imogi-dash-date-wrap label,
		.imogi-dashboard-page .imogi-dash-hero .imogi-dash-branch-wrap label,
		.imogi-dash-date-wrap label,.imogi-dash-branch-wrap label{color:#cbd5e1!important;font-size:10px;font-weight:700;letter-spacing:.08em;margin:0;text-transform:uppercase}
		.imogi-dash-date,.imogi-dash-branch-select{
			background:rgba(255,255,255,.08)!important;border:1px solid rgba(255,255,255,.14)!important;border-radius:10px!important;
			color:#f8fafc!important;font-size:12px;font-weight:600;height:36px
		}
		.imogi-dash-date:focus,.imogi-dash-branch-select:focus{border-color:rgba(251,191,36,.55)!important;box-shadow:0 0 0 3px rgba(251,191,36,.18);outline:none}
		.imogi-dash-date{max-width:150px;color-scheme:dark}
		.imogi-dash-branch-select{max-width:200px;min-width:140px}
		.imogi-dash-branch-select option{color:#0f172a}
		.imogi-dash-quick-group{align-items:center;display:flex;flex-wrap:wrap;gap:6px}
		.imogi-dashboard-page .imogi-dash-hero .imogi-dash-chip,
		.imogi-dash-chip{
			align-items:center;background:rgba(255,255,255,.1)!important;border:1px solid rgba(255,255,255,.18)!important;border-radius:10px!important;
			color:#f8fafc!important;cursor:pointer;display:inline-flex;font-size:11px;font-weight:700;height:36px;justify-content:center;padding:0 12px;transition:all .15s ease
		}
		.imogi-dash-chip:hover{background:rgba(251,191,36,.16);border-color:rgba(251,191,36,.4);color:#fde68a}
		.imogi-dash-chip.is-active{background:#f59e0b;border-color:#f59e0b;color:#111827}
		.imogi-dash-chip--icon{padding:0;width:36px}
		.imogi-dash-hero-actions{align-items:center;display:flex;flex-wrap:wrap;gap:8px}
		.imogi-dashboard-page .imogi-dash-hero a.imogi-btn-ghost,
		.imogi-dashboard-page .imogi-dash-hero button.imogi-btn-ghost,
		.imogi-dash-hero a.imogi-btn-ghost,.imogi-dash-hero button.imogi-btn-ghost{
			background:rgba(255,255,255,.1)!important;border:1px solid rgba(255,255,255,.2)!important;border-radius:10px!important;
			color:#f8fafc!important;height:36px!important
		}
		.imogi-dash-hero a.imogi-btn-ghost:hover{background:rgba(255,255,255,.14)!important;color:#fff!important}
		a.imogi-btn-brand,button.imogi-btn-brand{
			align-items:center!important;background:linear-gradient(135deg,#fbbf24,#f59e0b)!important;border:none!important;border-radius:10px!important;
			box-shadow:0 8px 20px rgba(245,158,11,.35)!important;color:#111827!important;display:inline-flex!important;font-size:12px!important;
			font-weight:800!important;gap:6px;height:36px!important;justify-content:center!important;padding:0 14px!important;text-decoration:none!important
		}
		a.imogi-btn-brand:hover,button.imogi-btn-brand:hover{filter:brightness(1.05);transform:translateY(-1px)}
		.imogi-btn-brand--xs{height:30px!important;padding:0 10px!important;font-size:11px!important}
		a.imogi-btn-ghost,button.imogi-btn-ghost{
			align-items:center!important;background:#fff!important;border:1px solid #e2e8f0!important;border-radius:10px!important;
			color:#475569!important;display:inline-flex!important;font-size:12px!important;font-weight:600!important;gap:6px;
			height:36px!important;justify-content:center!important;padding:0 14px!important;text-decoration:none!important
		}
		a.imogi-btn-ghost:hover{background:#f8fafc!important;border-color:#cbd5e1!important;color:#0f172a!important}
		.imogi-btn-ghost--xs{height:30px!important;padding:0 10px!important;font-size:11px!important}

		.imogi-dash-upgrade-slot:empty{display:none}
		.imogi-dash-upgrade-strip{align-items:center;background:#fff;border:1px solid #e8edf5;border-radius:14px;box-shadow:0 6px 18px rgba(15,23,42,.04);display:flex;flex-wrap:wrap;gap:10px 14px;justify-content:space-between;margin-bottom:14px;padding:12px 16px}
		.imogi-dash-upgrade-strip-main{align-items:center;display:flex;flex:1;flex-wrap:wrap;gap:8px 10px;min-width:0}
		.imogi-dash-upgrade-badge{background:#fff7ed;border:1px solid #fed7aa;border-radius:999px;color:#c2410c;font-size:10px;font-weight:800;letter-spacing:.06em;padding:3px 8px}
		.imogi-dash-upgrade-text{color:#475569;font-size:12px;font-weight:600;line-height:1.35;max-width:420px}
		.imogi-dash-upgrade-pills{display:flex;flex-wrap:wrap;gap:6px}
		.imogi-dash-upgrade-pill{align-items:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:999px;color:#64748b;display:inline-flex;font-size:10px;font-weight:600;gap:4px;padding:4px 10px;white-space:nowrap}
		.imogi-dash-upgrade-pill i{color:#94a3b8;font-size:9px}
		.imogi-dash-upgrade-pill small{color:#94a3b8;font-weight:700}
		.imogi-dash-upgrade-actions{align-items:center;display:flex;flex-shrink:0;gap:8px}
		.imogi-dash-upgrade-actions a{align-items:center;border-radius:10px;display:inline-flex;font-size:11px;font-weight:700;gap:5px;height:32px;padding:0 12px;text-decoration:none!important;white-space:nowrap}
		.imogi-dash-link-ghost{background:#fff;border:1px solid #e2e8f0;color:#475569}
		.imogi-dash-link-ghost:hover{background:#f8fafc;border-color:#cbd5e1;color:#0f172a}
		.imogi-dash-link-brand{background:linear-gradient(135deg,#fbbf24,#f59e0b);border:none;color:#111827!important;box-shadow:0 4px 12px rgba(245,158,11,.28)}

		.imogi-dash-alerts-stack{display:flex;flex-direction:column;gap:10px;margin-bottom:14px}
		.imogi-dash-alerts-stack:empty{display:none}
		.imogi-dash-alerts-stack .imogi-pos-shift-alert,
		.imogi-dash-alerts-stack .imogi-awaiting-alert{margin-bottom:0!important}
		.imogi-dash-alerts-stack .imogi-pos-shift-alert:empty,
		.imogi-dash-alerts-stack .imogi-awaiting-alert:empty{display:none}
		.imogi-sales-target-banner{margin-bottom:14px}
		.imogi-target-strip{
			background:#fff;border:1px solid #e8edf5;border-radius:18px;box-shadow:0 8px 24px rgba(15,23,42,.05);
			overflow:hidden;padding:18px 20px;position:relative
		}
		.imogi-target-strip::before{background:linear-gradient(180deg,#fbbf24,#f59e0b);content:"";height:100%;left:0;position:absolute;top:0;width:4px}
		.imogi-target-strip.is-achieved::before{background:linear-gradient(180deg,#34d399,#10b981)}
		.imogi-target-strip.is-behind::before{background:linear-gradient(180deg,#fb7185,#ef4444)}
		.imogi-target-strip-head{align-items:center;display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
		.imogi-target-strip-head i{color:#f59e0b;font-size:14px}
		.imogi-target-strip.is-achieved .imogi-target-strip-head i{color:#10b981}
		.imogi-target-strip.is-behind .imogi-target-strip-head i{color:#ef4444}
		.imogi-target-strip-title{color:#0f172a;font-size:13px;font-weight:800}
		.imogi-target-strip-sub{color:#64748b;font-size:12px;margin-left:auto}
		.imogi-target-strip-badge{background:#fff7ed;border:1px solid #fed7aa;border-radius:999px;color:#b45309;font-size:10px;font-weight:700;padding:4px 10px}
		.imogi-target-strip.is-achieved .imogi-target-strip-badge{background:#ecfdf5;border-color:#a7f3d0;color:#047857}
		.imogi-target-strip.is-behind .imogi-target-strip-badge{background:#fff1f2;border-color:#fecdd3;color:#be123c}
		.imogi-target-strip-body{align-items:center;display:flex;flex-wrap:wrap;gap:14px}
		.imogi-target-strip-actual{color:#0f172a;font-size:28px;font-variant-numeric:tabular-nums;font-weight:800;letter-spacing:-.03em;min-width:150px}
		.imogi-target-strip-track{background:#eef2f7;border-radius:999px;flex:1;height:12px;min-width:120px;overflow:hidden}
		.imogi-target-strip-fill{background:linear-gradient(90deg,#fbbf24,#f59e0b);border-radius:999px;height:100%;min-width:4px}
		.imogi-target-strip.is-behind .imogi-target-strip-fill{background:linear-gradient(90deg,#fb7185,#ef4444)}
		.imogi-target-strip.is-achieved .imogi-target-strip-fill{background:linear-gradient(90deg,#34d399,#10b981)}
		.imogi-target-strip-pct{color:#0f172a;font-size:16px;font-variant-numeric:tabular-nums;font-weight:800;min-width:48px;text-align:right}
		.imogi-target-strip-meta{border-top:1px solid #f1f5f9;display:grid;gap:10px;grid-template-columns:repeat(4,minmax(0,1fr));margin-top:16px;padding-top:14px}
		.imogi-target-strip-meta span{color:#0f172a;display:block;font-size:13px;font-variant-numeric:tabular-nums;font-weight:700}
		.imogi-target-strip-meta small{color:#94a3b8;display:block;font-size:10px;font-weight:700;letter-spacing:.06em;margin-bottom:4px;text-transform:uppercase}

		.imogi-dash-awaiting-strip{align-items:center;background:linear-gradient(135deg,#fffbeb,#fff);border:1px solid #fde68a;border-radius:14px;box-shadow:0 6px 16px rgba(245,158,11,.08);display:flex;flex-wrap:wrap;gap:10px 14px;padding:12px 14px}
		.imogi-dash-awaiting-label{align-items:center;color:#92400e;display:flex;font-size:12px;font-weight:700;gap:8px;white-space:nowrap}
		.imogi-dash-awaiting-label strong{color:#b45309;font-size:16px;font-variant-numeric:tabular-nums}
		.imogi-dash-awaiting-chips{align-items:center;display:flex;flex:1;flex-wrap:wrap;gap:6px;min-width:0}
		.imogi-dash-awaiting-chip{align-items:center;background:#fff;border:1px solid #fde68a;border-radius:10px;color:#78350f;display:inline-flex;font-size:11px;font-weight:600;gap:6px;padding:6px 10px;text-decoration:none!important;white-space:nowrap}
		.imogi-dash-awaiting-chip:hover{background:#fef3c7;border-color:#fbbf24}
		.imogi-dash-awaiting-chip span{color:#b45309;font-weight:800}
		.imogi-dash-awaiting-more{color:#94a3b8;font-size:11px;font-weight:700}
		.imogi-dash-awaiting-link{align-items:center;color:#c2410c;display:inline-flex;font-size:11px;font-weight:700;gap:4px;text-decoration:none!important}
		.imogi-dash-awaiting-link:hover{color:#9a3412}

		.imogi-dash-branch-panel{margin-bottom:14px}
		.imogi-dash-branch-grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(0,1fr));width:100%}
		.imogi-dash-branch-grid[data-count="1"]{grid-template-columns:1fr}
		.imogi-dash-branch-grid[data-count="2"]{grid-template-columns:repeat(2,minmax(0,1fr))}
		.imogi-dash-branch-grid[data-count="3"]{grid-template-columns:repeat(3,minmax(0,1fr))}
		.imogi-dash-branch-card{background:#fff;border:1px solid #e8edf5;border-radius:16px;box-shadow:0 8px 20px rgba(15,23,42,.04);padding:16px;width:100%}
		.imogi-dash-branch-card--wide{align-items:center;display:grid;gap:16px 24px;grid-template-columns:minmax(180px,1.2fr) minmax(140px,.8fr) minmax(220px,1.4fr) minmax(160px,.9fr)}
		.imogi-dash-branch-card-head{align-items:flex-start;display:flex;gap:8px;justify-content:space-between;margin-bottom:8px}
		.imogi-dash-branch-card--wide .imogi-dash-branch-card-head{margin-bottom:0}
		.imogi-dash-branch-card-name{color:#0f172a;font-size:14px;font-weight:800}
		.imogi-dash-branch-card-city{color:#64748b;font-size:11px;margin-top:2px}
		.imogi-dash-branch-card-sales{color:#ea580c;font-size:20px;font-variant-numeric:tabular-nums;font-weight:800}
		.imogi-dash-branch-card-meta{color:#64748b;display:flex;font-size:11px;gap:8px;justify-content:space-between;margin-top:8px}
		.imogi-dash-branch-card--wide .imogi-dash-branch-card-meta{flex-direction:column;gap:4px;justify-content:center;margin-top:0}
		.imogi-dash-branch-card-track{background:#eef2f7;border-radius:999px;height:7px;margin-top:10px;overflow:hidden}
		.imogi-dash-branch-card--wide .imogi-dash-branch-card-track{margin-top:8px}
		.imogi-dash-branch-card-fill{background:linear-gradient(90deg,#fbbf24,#f59e0b);border-radius:999px;height:100%;min-width:4px}
		.imogi-dash-branch-kpi{display:flex;flex-direction:column;gap:2px}
		.imogi-dash-branch-kpi-label{color:#94a3b8;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
		.imogi-dash-branch-kpi-value{color:#0f172a;font-size:16px;font-variant-numeric:tabular-nums;font-weight:800}

		.imogi-dash-section{margin-bottom:16px}
		.imogi-dash-section-head{align-items:baseline;display:flex;justify-content:space-between;margin:0 2px 12px}
		.imogi-dash-section-head h2{color:#0f172a;font-size:15px;font-weight:800;letter-spacing:-.02em;margin:0}
		.imogi-dash-section-head span{color:#94a3b8;font-size:11px;font-weight:600}
		.imogi-dash-stats-grid{
			align-items:stretch!important;display:grid!important;gap:12px;
			grid-template-columns:repeat(6,minmax(0,1fr))!important;width:100%
		}
		.imogi-stat-card{
			align-self:stretch!important;background:#fff;border:1px solid #e8edf5;border-radius:16px;
			box-shadow:0 8px 20px rgba(15,23,42,.04);display:flex;flex-direction:column;gap:10px;
			height:100%;margin:0!important;min-height:0;padding:14px 14px 12px;
			transition:transform .15s ease,box-shadow .15s ease
		}
		.imogi-stat-card:hover{box-shadow:0 14px 28px rgba(15,23,42,.08);transform:translateY(-2px)}
		.imogi-stat-card--hero{
			background:linear-gradient(160deg,#fff 0%,#fff7ed 100%);
			border-color:#fde68a;box-shadow:0 10px 28px rgba(245,158,11,.12);grid-column:auto!important
		}
		.imogi-stat-card-top{align-items:center;display:flex;flex-shrink:0;justify-content:space-between}
		.imogi-stat-card-icon{align-items:center;border-radius:12px;display:inline-flex;flex-shrink:0;font-size:14px;height:34px;justify-content:center;width:34px}
		.imogi-stat-card-body{display:flex;flex:1;flex-direction:column;gap:4px;justify-content:flex-start;min-height:72px;min-width:0}
		.imogi-stat-card--brand .imogi-stat-card-icon{background:#fff7ed;color:#ea580c}
		.imogi-stat-card--success .imogi-stat-card-icon{background:#ecfdf5;color:#059669}
		.imogi-stat-card--danger .imogi-stat-card-icon{background:#fef2f2;color:#dc2626}
		.imogi-stat-card--blue .imogi-stat-card-icon{background:#eff6ff;color:#2563eb}
		.imogi-stat-card--purple .imogi-stat-card-icon{background:#f5f3ff;color:#7c3aed}
		.imogi-stat-card--orange .imogi-stat-card-icon{background:#fff7ed;color:#ea580c}
		.imogi-stat-card--warning .imogi-stat-card-icon{background:#fefce8;color:#ca8a04}
		.imogi-stat-card--slate .imogi-stat-card-icon{background:#f8fafc;color:#64748b}
		.imogi-stat-card-value{color:#0f172a;font-size:20px;font-variant-numeric:tabular-nums;font-weight:800;letter-spacing:-.03em;line-height:1.1;min-height:1.1em;word-break:break-word}
		.imogi-stat-card--hero .imogi-stat-card-value{color:#c2410c;font-size:22px}
		.imogi-stat-card--alert .imogi-stat-card-value{color:#dc2626}
		.imogi-stat-card-label{color:#64748b;font-size:11px;font-weight:600;line-height:1.3;min-height:2.6em}
		.imogi-stat-card-foot{align-items:center;display:flex;flex-shrink:0;min-height:24px;margin-top:auto}

		.imogi-dash-panels{display:grid!important;gap:14px;grid-template-columns:repeat(2,minmax(0,1fr))}
		.imogi-dash-panel{background:#fff;border:1px solid #e8edf5;border-radius:18px;box-shadow:0 8px 22px rgba(15,23,42,.04);display:flex;flex-direction:column;min-height:100%;overflow:hidden;transition:box-shadow .15s ease,transform .15s ease}
		.imogi-dash-panel:hover{box-shadow:0 14px 30px rgba(15,23,42,.08);transform:translateY(-1px)}
		.imogi-dash-panel-head{align-items:center;background:linear-gradient(180deg,#fbfcfe,#fff);border-bottom:1px solid #f1f5f9;display:flex;flex-shrink:0;gap:10px;justify-content:space-between;padding:14px 16px}
		.imogi-dash-panel-head-left{align-items:center;display:flex;gap:10px;min-width:0}
		.imogi-dash-panel-icon{align-items:center;border-radius:12px;display:inline-flex;flex-shrink:0;font-size:12px;height:34px;justify-content:center;width:34px}
		.imogi-dash-panel--brand .imogi-dash-panel-icon{background:#fff7ed;color:#ea580c}
		.imogi-dash-panel--warning .imogi-dash-panel-icon{background:#fff7ed;color:#ea580c}
		.imogi-dash-panel--success .imogi-dash-panel-icon{background:#ecfdf5;color:#059669}
		.imogi-dash-panel--blue .imogi-dash-panel-icon{background:#eff6ff;color:#2563eb}
		.imogi-dash-panel--purple .imogi-dash-panel-icon{background:#f5f3ff;color:#7c3aed}
		.imogi-dash-panel--orange .imogi-dash-panel-icon{background:#fff7ed;color:#ea580c}
		.imogi-dash-panel--danger .imogi-dash-panel-icon{background:#fef2f2;color:#dc2626}
		.imogi-dash-panel--slate .imogi-dash-panel-icon{background:#f8fafc;color:#64748b}
		.imogi-dash-panel-title{color:#0f172a;font-size:13px;font-weight:800;letter-spacing:-.01em}
		.imogi-dash-panel-badge{background:#fef2f2;border-radius:999px;color:#b91c1c;flex-shrink:0;font-size:10px;font-weight:700;padding:4px 10px}
		.imogi-dash-panel-export{align-items:center;background:#fff;border:1px solid #e2e8f0;border-radius:8px;color:#64748b;cursor:pointer;display:inline-flex;flex-shrink:0;font-size:11px;height:26px;justify-content:center;margin-left:6px;width:26px}
		.imogi-dash-panel-export:hover{background:#f8fafc;border-color:#cbd5e1;color:#0f172a}
		.imogi-dash-panel-body{flex:1;min-height:140px;padding:14px 16px 16px}
		.imogi-dash-bars,.imogi-dash-stock-list{display:flex;flex-direction:column;gap:12px}
		.imogi-dash-bar-head,.imogi-dash-stock-head{align-items:center;display:flex;gap:8px;justify-content:space-between;margin-bottom:5px}
		.imogi-dash-bar-name,.imogi-dash-stock-head span:first-child{color:#334155;flex:1;font-size:12px;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
		.imogi-dash-bar-meta,.imogi-dash-stock-qty{color:#64748b;flex-shrink:0;font-size:11px;white-space:nowrap}
		.imogi-dash-stock-qty b{color:#dc2626}
		.imogi-dash-rank{background:#f1f5f9;border-radius:6px;color:#64748b;display:inline-block;font-size:10px;font-weight:700;margin-right:6px;min-width:20px;padding:2px 6px;text-align:center}
		.imogi-dash-bar-track{background:#eef2f7;border-radius:999px;height:8px;overflow:hidden;width:100%}
		.imogi-dash-bar-fill{border-radius:999px;height:100%;min-width:4px}
		.imogi-dash-bar-fill--brand{background:linear-gradient(90deg,#fbbf24,#f59e0b)}
		.imogi-dash-bar-fill--success{background:linear-gradient(90deg,#34d399,#10b981)}
		.imogi-dash-bar-fill--blue{background:linear-gradient(90deg,#60a5fa,#3b82f6)}
		.imogi-dash-bar-fill--purple{background:linear-gradient(90deg,#a78bfa,#8b5cf6)}
		.imogi-dash-bar-fill--danger{background:linear-gradient(90deg,#f87171,#ef4444)}
		.imogi-dash-muted{color:#94a3b8}
		.imogi-dash-empty{align-items:center;color:#94a3b8;display:flex;flex:1;flex-direction:column;font-size:12px;gap:10px;justify-content:center;min-height:110px;text-align:center}
		.imogi-dash-empty i{font-size:22px;opacity:.4}
		.imogi-dash-stock-list{max-height:240px;overflow:auto;padding-right:4px}

		.imogi-shift-banner{align-items:center;border-radius:14px;display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;padding:12px 14px}
		.imogi-shift-banner--open{background:#ecfdf5;border:1px solid #a7f3d0}
		.imogi-shift-banner--closed{background:#fffbeb;border:1px solid #fde68a}
		.imogi-shift-banner-text{align-items:center;display:flex;gap:10px;font-size:12px}
		.imogi-shift-icon{align-items:center;border-radius:10px;display:inline-flex;flex-shrink:0;font-size:12px;height:32px;justify-content:center;width:32px}
		.imogi-shift-banner--open .imogi-shift-icon{background:#bbf7d0;color:#15803d}
		.imogi-shift-banner--closed .imogi-shift-icon{background:#fde68a;color:#b45309}
		.imogi-shift-meta{color:#64748b;font-size:11px;margin-top:2px}
		.imogi-shift-banner-actions{align-items:center;display:flex;flex-wrap:wrap;gap:6px}
		.imogi-dash-footer{color:#94a3b8;font-size:11px;font-weight:500;margin-top:8px;text-align:center}
		.imogi-dash-panel--focused{animation:imogi-dash-focus-pulse 2.2s ease;outline:2px solid #f59e0b;outline-offset:2px}
		@keyframes imogi-dash-focus-pulse{0%,100%{outline-color:rgba(245,158,11,.9)}50%{outline-color:rgba(245,158,11,.3)}}

		@media (max-width:1199px){
			.imogi-target-strip-meta{grid-template-columns:repeat(2,minmax(0,1fr))}
			.imogi-dash-stats-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}
			.imogi-stat-card--hero{grid-column:auto!important}
			.imogi-dash-branch-card--wide{grid-template-columns:1fr 1fr}
		}
		@media (max-width:767px){
			.imogi-dashboard-page .page-body{padding:10px!important}
			.imogi-dash-hero{border-radius:16px;padding:16px}
			.imogi-dash-date-display{font-size:28px!important}
			.imogi-dash-hero-body,.imogi-dash-toolbar-actions,.imogi-dash-hero-controls,.imogi-shift-banner{flex-direction:column;align-items:stretch;width:100%}
			.imogi-dash-hero-actions,.imogi-dash-upgrade-actions{width:100%}
			.imogi-target-strip-body{align-items:flex-start;flex-direction:column}
			.imogi-target-strip-meta{grid-template-columns:1fr 1fr}
			.imogi-dash-stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
			.imogi-dash-panels{grid-template-columns:1fr!important}
			.imogi-btn-brand,.imogi-btn-ghost,.imogi-dash-upgrade-actions a{width:100%!important}
			.imogi-dash-branch-card--wide{grid-template-columns:1fr}
		}

		.imogi-dash-insight-grid{display:grid;gap:12px;grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:14px}
		.imogi-dash-insight-card{background:#fff;border:1px solid #e8edf5;border-radius:16px;box-shadow:0 8px 20px rgba(15,23,42,.04);padding:14px 16px}
		.imogi-dash-insight-label{color:#64748b;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
		.imogi-dash-insight-value{color:#0f172a;font-size:20px;font-variant-numeric:tabular-nums;font-weight:800;letter-spacing:-.02em;margin-top:6px}
		.imogi-dash-insight-meta{color:#94a3b8;font-size:11px;font-weight:600;margin-top:4px}
		.imogi-dash-split{display:grid;gap:14px;grid-template-columns:1.1fr .9fr;margin-bottom:14px}
		.imogi-dash-trend-card,.imogi-dash-funnel-card{background:#fff;border:1px solid #e8edf5;border-radius:18px;box-shadow:0 8px 22px rgba(15,23,42,.04);overflow:hidden}
		.imogi-dash-trend-body{padding:14px 16px 16px}
		.imogi-dash-trend-chart{align-items:flex-end;display:flex;gap:8px;height:140px;margin-top:8px}
		.imogi-dash-trend-col{align-items:center;display:flex;flex:1;flex-direction:column;gap:6px;height:100%;justify-content:flex-end;min-width:0}
		.imogi-dash-trend-bar-wrap{align-items:flex-end;display:flex;flex:1;justify-content:center;width:100%}
		.imogi-dash-trend-bar{background:linear-gradient(180deg,#fbbf24,#f59e0b);border-radius:8px 8px 4px 4px;min-height:6px;width:100%;max-width:36px}
		.imogi-dash-trend-col.is-today .imogi-dash-trend-bar{background:linear-gradient(180deg,#38bdf8,#2563eb);box-shadow:0 6px 14px rgba(37,99,235,.25)}
		.imogi-dash-trend-day{color:#64748b;font-size:10px;font-weight:700}
		.imogi-dash-trend-amt{color:#0f172a;font-size:10px;font-weight:700;text-align:center;white-space:nowrap}
		.imogi-dash-funnel-list{display:flex;flex-direction:column;gap:10px;padding:14px 16px 16px}
		.imogi-dash-funnel-row{display:grid;gap:10px;grid-template-columns:110px 1fr 42px;align-items:center}
		.imogi-dash-funnel-name{color:#334155;font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
		.imogi-dash-funnel-track{background:#eef2f7;border-radius:999px;height:8px;overflow:hidden}
		.imogi-dash-funnel-fill{background:linear-gradient(90deg,#60a5fa,#2563eb);border-radius:999px;height:100%;min-width:4px}
		.imogi-dash-funnel-count{color:#0f172a;font-size:12px;font-variant-numeric:tabular-nums;font-weight:800;text-align:right}
		.imogi-stat-delta{align-items:center;border-radius:999px;display:inline-flex;font-size:10px;font-weight:800;gap:3px;padding:3px 8px;width:fit-content}
		.imogi-stat-delta.is-up{background:#ecfdf5;color:#047857}
		.imogi-stat-delta.is-down{background:#fef2f2;color:#b91c1c}
		.imogi-stat-delta.is-flat{background:#f1f5f9;color:#64748b}
		.imogi-stat-delta.is-muted{background:#f8fafc;color:#94a3b8;font-weight:700}
		.imogi-dash-panels{grid-template-columns:repeat(3,minmax(0,1fr))!important}
		@media (max-width:1199px){
			.imogi-dash-insight-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
			.imogi-dash-split{grid-template-columns:1fr}
			.imogi-dash-panels{grid-template-columns:repeat(2,minmax(0,1fr))!important}
		}
		@media (max-width:767px){
			.imogi-dash-insight-grid{grid-template-columns:1fr 1fr}
			.imogi-dash-funnel-row{grid-template-columns:90px 1fr 36px}
			.imogi-dash-panels{grid-template-columns:1fr!important}
		}
	`,
		"imogi-dashboard-inline-css-v16"
	);
}

function imogi_dashboard_kds_enabled() {
	return cint(frappe.boot?.imogi_pos_enable_kds);
}

function imogi_dash_clean_label(text) {
	const raw = String(text || "").trim();
	if (!raw) return "";
	return raw
		.replace(/\bUMKM\b/gi, "")
		.replace(/[_-]?umkm[_-]?/gi, "-")
		.replace(/--+/g, "-")
		.replace(/\s{2,}/g, " ")
		.replace(/^[\s_-]+|[\s_-]+$/g, "")
		.trim() || raw;
}

frappe.pages["imogi-pos-dashboard"].on_page_load = function (wrapper) {
	inject_dashboard_css();
	document.body.classList.add("imogi-dashboard-fullscreen");

	const is_umkm = frappe.boot.imogi_pos_business_type === "UMKM";
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("IMOGI POS Dashboard"),
		single_column: true,
	});

	page.main.addClass("imogi-dashboard-page");
	$(wrapper).closest(".page-container").find("> .page-head").hide();
	$(wrapper).find(".page-head").hide();
	if (page.set_title) page.set_title(__("IMOGI POS Dashboard"));
	document.title = __("IMOGI POS Dashboard");
	if (!window.__imogi_dashboard_fullscreen_bound) {
		window.__imogi_dashboard_fullscreen_bound = true;
		$(document).on("page-change.imogi-dashboard-fs", () => {
			const route = (frappe.get_route_str && frappe.get_route_str()) || "";
			if (route.indexOf("imogi-pos-dashboard") === -1) {
				document.body.classList.remove("imogi-dashboard-fullscreen");
			} else {
				document.body.classList.add("imogi-dashboard-fullscreen");
			}
		});
	}
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

frappe.pages["imogi-pos-dashboard"].on_page_show = function () {
	document.body.classList.add("imogi-dashboard-fullscreen");
	inject_dashboard_css();
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
		if (imogi_dashboard_kds_enabled()) {
			frappe.realtime.on("imogi_kitchen_updated", () => this.refresh());
		}
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
		this._sync_quick_date_chips();
	}

	_sync_quick_date_chips() {
		const today = frappe.datetime.get_today();
		const yesterday = frappe.datetime.add_days(today, -1);
		this.wrapper.find(".imogi-dash-quick-today").toggleClass("is-active", this.selected_date === today);
		this.wrapper
			.find(".imogi-dash-quick-yesterday")
			.toggleClass("is-active", this.selected_date === yesterday);
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
					const name = imogi_dash_clean_label(row.branch_name || row.branch_code);
					const label = row.city ? `${name} (${row.city})` : name;
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
			<section class="imogi-dash-section">
				<div class="imogi-dash-section-head">
					<h2>${__("Perbandingan Cabang")}</h2>
				</div>
				<div class="imogi-dash-panel" style="padding:0">
					<div class="imogi-dash-panel-body" style="padding:16px 18px 18px">
					${currencyNote}
					<div class="imogi-dash-branch-grid" data-count="${Math.min(rows.length, 4)}">${rows
						.map((row) => {
							const pct = Math.min(100, Math.max(4, flt(row.target_progress_pct)));
							const wide = rows.length === 1;
							if (wide) {
								return `
							<div class="imogi-dash-branch-card imogi-dash-branch-card--wide">
								<div class="imogi-dash-branch-card-head">
									<div>
										<div class="imogi-dash-branch-card-name">${frappe.utils.escape_html(
											imogi_dash_clean_label(row.branch_name || row.branch_code)
										)}</div>
										${
											row.city
												? `<div class="imogi-dash-branch-card-city">${frappe.utils.escape_html(
														row.city
												  )}</div>`
												: ""
										}
									</div>
								</div>
								<div class="imogi-dash-branch-kpi">
									<div class="imogi-dash-branch-kpi-label">${__("Omzet Hari Ini")}</div>
									<div class="imogi-dash-branch-card-sales">${format_currency(row.sales_today || 0)}</div>
								</div>
								<div>
									<div class="imogi-dash-branch-kpi-label">${__("Target Bulanan")} · ${pct}%</div>
									<div class="imogi-dash-branch-card-track">
										<div class="imogi-dash-branch-card-fill" style="width:${pct}%"></div>
									</div>
								</div>
								<div class="imogi-dash-branch-card-meta">
									<span><b>${row.completed_today || 0}</b> ${__("transaksi selesai")}</span>
									<span>${__("Progress target")} ${pct}%</span>
								</div>
							</div>`;
							}
							return `
							<div class="imogi-dash-branch-card">
								<div class="imogi-dash-branch-card-head">
									<div>
										<div class="imogi-dash-branch-card-name">${frappe.utils.escape_html(
											imogi_dash_clean_label(row.branch_name || row.branch_code)
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
			</section>
		`);
	}

	set_date(date) {
		this.selected_date = date;
		this.wrapper.find(".imogi-dash-date").val(date);
		this.wrapper.find(".imogi-dash-date-display").text(frappe.datetime.str_to_user(date));
		this._sync_quick_date_chips();
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
				<section class="imogi-dash-hero">
					<div class="imogi-dash-hero-top">
						<div class="imogi-dash-header-brand">
							<span class="imogi-dash-logo">IMOGI POS</span>
							<span class="imogi-dash-live-pill"><span class="imogi-dash-live-dot"></span>${__("Live")}</span>
						</div>
						<div class="imogi-dash-header-meta">
							<span class="imogi-dash-topbar-co"></span>
							<span class="imogi-dash-tier-badge"></span>
							<span class="imogi-dash-topbar-date"></span>
						</div>
					</div>
					<div class="imogi-dash-hero-body">
						<div class="imogi-dash-toolbar-main">
							<div class="imogi-dash-date-display">${frappe.utils.escape_html(
								frappe.datetime.str_to_user(this.selected_date)
							)}</div>
							${subtitle ? `<p class="imogi-dash-hero-sub">${subtitle}</p>` : ""}
						</div>
						<div class="imogi-dash-toolbar-actions">
							<div class="imogi-dash-hero-controls">
								<div class="imogi-dash-branch-wrap" style="display:none;">
									<label>${__("Cabang")}</label>
									<select class="form-control form-control-sm imogi-dash-branch-select"></select>
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
				</section>
				<div class="imogi-dash-upgrade-slot"></div>
				<div class="imogi-dash-alerts-stack">
					<div class="imogi-pos-shift-alert" style="display:none;"></div>
					<div class="imogi-awaiting-alert" style="display:none;"></div>
				</div>
				<div class="imogi-sales-target-banner" style="display:none;"></div>
				<div class="imogi-dash-branch-panel" style="display:none;"></div>
				<section class="imogi-dash-section">
					<div class="imogi-dash-section-head">
						<h2>${__("Ringkasan Hari Ini")}</h2>
						<span>${__("vs kemarin · auto refresh 30 detik")}</span>
					</div>
					<div class="imogi-dash-stats-grid"></div>
				</section>
				<div class="imogi-dash-insight-grid"></div>
				<div class="imogi-dash-split">
					<div class="imogi-dash-trend-card">
						<div class="imogi-dash-panel-head">
							<div class="imogi-dash-panel-head-left">
								<span class="imogi-dash-panel-icon" style="background:#eff6ff;color:#2563eb"><i class="fa fa-line-chart"></i></span>
								<span class="imogi-dash-panel-title">${__("Tren 7 Hari")}</span>
							</div>
						</div>
						<div class="imogi-dash-trend-body imogi-dash-trend-host"></div>
					</div>
					<div class="imogi-dash-funnel-card">
						<div class="imogi-dash-panel-head">
							<div class="imogi-dash-panel-head-left">
								<span class="imogi-dash-panel-icon" style="background:#f5f3ff;color:#7c3aed"><i class="fa fa-filter"></i></span>
								<span class="imogi-dash-panel-title">${__("Status Order Hari Ini")}</span>
							</div>
						</div>
						<div class="imogi-dash-funnel-list imogi-dash-funnel-host"></div>
					</div>
				</div>
				<section class="imogi-dash-section imogi-dash-section--panels">
					<div class="imogi-dash-section-head">
						<h2>${__("Analitik & Operasional")}</h2>
					</div>
					<div class="imogi-dash-panels"></div>
				</section>
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
			const delta_html =
				this._render_delta_badge(metric.delta) ||
				`<span class="imogi-stat-delta is-muted">${metric.meta || __("hari ini")}</span>`;
			this.stats_grid.append(`
				<div class="imogi-stat-card imogi-stat-card--${tone}${hero}${alert}">
					<div class="imogi-stat-card-top">
						<span class="imogi-stat-card-icon"><i class="fa ${metric.icon || "fa-bar-chart"}"></i></span>
					</div>
					<div class="imogi-stat-card-body">
						<div class="imogi-stat-card-value">${metric.value ?? 0}</div>
						<div class="imogi-stat-card-label">${metric.label}</div>
						<div class="imogi-stat-card-foot">${delta_html}</div>
					</div>
				</div>
			`);
		});
	}

	_render_delta_badge(delta) {
		if (delta === undefined || delta === null || delta === "") return "";
		const n = flt(delta);
		const cls = n > 0 ? "is-up" : n < 0 ? "is-down" : "is-flat";
		const icon = n > 0 ? "fa-arrow-up" : n < 0 ? "fa-arrow-down" : "fa-minus";
		const sign = n > 0 ? "+" : "";
		return `<span class="imogi-stat-delta ${cls}"><i class="fa ${icon}"></i>${sign}${n}%</span>`;
	}

	render_insight_strip(data) {
		const $grid = this.wrapper.find(".imogi-dash-insight-grid");
		if (!$grid.length) return;
		const insights = data.insights || {};
		const wtd = insights.week_to_date || {};
		const mtd = insights.month_to_date || {};
		const peak = insights.peak_hour;
		const cards = [
			{
				label: __("Week to Date"),
				value: format_currency(wtd.sales || 0),
				meta: __("{0} transaksi selesai", [wtd.completed || 0]),
			},
			{
				label: __("Month to Date"),
				value: format_currency(mtd.sales || 0),
				meta: __("{0} transaksi selesai", [mtd.completed || 0]),
			},
			{
				label: __("Conversion Rate"),
				value: `${flt(insights.conversion_rate || 0)}%`,
				meta: __("Selesai / total order hari ini"),
			},
			{
				label: __("Peak Hour"),
				value: peak?.label || "—",
				meta: peak
					? `${peak.orders || 0} order · ${format_currency(peak.sales || 0)}`
					: __("Belum ada data jam sibuk"),
			},
		];
		$grid.html(
			cards
				.map(
					(c) => `<div class="imogi-dash-insight-card">
					<div class="imogi-dash-insight-label">${c.label}</div>
					<div class="imogi-dash-insight-value">${c.value}</div>
					<div class="imogi-dash-insight-meta">${c.meta}</div>
				</div>`
				)
				.join("")
		);
	}

	render_trend_chart(data) {
		const $host = this.wrapper.find(".imogi-dash-trend-host");
		if (!$host.length) return;
		const rows = (data.insights || {}).last_7_days || [];
		if (!rows.length) {
			$host.html(this.render_empty(__("Belum ada tren 7 hari.")));
			return;
		}
		const max = Math.max(...rows.map((r) => flt(r.sales)), 1);
		const today = data.date || frappe.datetime.get_today();
		$host.html(`<div class="imogi-dash-trend-chart">${rows
			.map((r) => {
				const pct = Math.max(8, Math.round((flt(r.sales) / max) * 100));
				const is_today = r.date === today ? " is-today" : "";
				return `<div class="imogi-dash-trend-col${is_today}" title="${frappe.utils.escape_html(
					r.date
				)}">
					<div class="imogi-dash-trend-amt">${format_currency(r.sales || 0)}</div>
					<div class="imogi-dash-trend-bar-wrap"><div class="imogi-dash-trend-bar" style="height:${pct}%"></div></div>
					<div class="imogi-dash-trend-day">${frappe.utils.escape_html(r.label || "")}</div>
				</div>`;
			})
			.join("")}</div>`);
	}

	render_status_funnel(data) {
		const $host = this.wrapper.find(".imogi-dash-funnel-host");
		if (!$host.length) return;
		const rows = (data.insights || {}).status_funnel || [];
		if (!rows.length) {
			$host.html(this.render_empty(__("Belum ada order hari ini.")));
			return;
		}
		const max = Math.max(...rows.map((r) => cint(r.count)), 1);
		const labels = {
			Draft: __("Draft"),
			"Awaiting Payment": __("Menunggu Bayar"),
			Paid: __("Paid"),
			"In Kitchen": __("Di Dapur"),
			"Kitchen Ready": __("Siap Saji"),
			"In Service": __("In Service"),
			"In Fulfillment": __("Fulfillment"),
			Completed: __("Selesai"),
			Cancelled: __("Dibatalkan"),
		};
		$host.html(
			rows
				.map((r) => {
					const pct = Math.max(6, Math.round((cint(r.count) / max) * 100));
					const name = labels[r.status] || r.status;
					return `<div class="imogi-dash-funnel-row">
						<div class="imogi-dash-funnel-name">${frappe.utils.escape_html(name)}</div>
						<div class="imogi-dash-funnel-track"><div class="imogi-dash-funnel-fill" style="width:${pct}%"></div></div>
						<div class="imogi-dash-funnel-count">${cint(r.count)}</div>
					</div>`;
				})
				.join("")
		);
	}

	render_saas_insights(data) {
		this.render_insight_strip(data);
		this.render_trend_chart(data);
		this.render_status_funnel(data);
	}

	render_topbar(data) {
		const company =
			data.company ||
			frappe.defaults.get_user_default("Company") ||
			frappe.boot?.imogi_pos_default_company ||
			"";
		this.wrapper.find(".imogi-dash-topbar-co").text(imogi_dash_clean_label(company));
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
				? `${__("Terakhir diperbarui")}: ${frappe.utils.escape_html(ts)}`
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
				})}</div>` +
				this.render_panel_close()
		);
		this.attach_export(
			$el,
			`menu-terlaris-${this.selected_date}.csv`,
			[
				{ label: __("Produk"), value: "item_name" },
				{ label: __("Qty"), value: "qty" },
				{ label: __("Penjualan"), value: "sales" },
			],
			rows
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
		this.attach_export(
			el,
			`sales-by-payment-${this.selected_date}.csv`,
			[
				{ label: __("Metode"), value: "mode_of_payment" },
				{ label: __("Jumlah"), value: "amount" },
				{ label: __("Count"), value: "count" },
			],
			rows
		);
	}

	render_kitchen_performance(report) {
		const el = this.wrapper.find(".imogi-kitchen-performance");
		if (!el.length || report.locked) return;
		const rows = report.rows || [];
		const live = report.live || {};
		const range =
			report.date_from && report.date_to ? `${report.date_from} — ${report.date_to}` : "";
		const live_html = `
			<div class="imogi-dash-branch-card-meta" style="margin:0 0 12px;gap:10px;flex-wrap:wrap">
				<span><b>${cint(live.active)}</b> ${__("aktif")}</span>
				<span><b>${cint(live.pending)}</b> ${__("antrian")}</span>
				<span><b>${cint(live.preparing)}</b> ${__("dimasak")}</span>
				<span><b>${cint(live.ready)}</b> ${__("siap")}</span>
			</div>`;
		if (!rows.length) {
			el.html(
				this.render_panel_open(__("Kitchen Performance"), "fa-fire", null, range) +
					live_html +
					this.render_empty(
						cint(live.active)
							? __("Ada order aktif di KDS. Selesaikan order untuk melihat rata-rata waktu per stasiun.")
							: __(
									"Belum ada data KPI dapur. Pastikan order masuk KDS dan stasiun dapur sudah diatur."
							  )
					) +
					`<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
						<a class="imogi-btn-ghost imogi-btn-ghost--xs" href="/app/kitchen-performance">${__("Buka Laporan")}</a>
						<a class="imogi-btn-ghost imogi-btn-ghost--xs" href="/app/kitchen-display">${__("Buka KDS")}</a>
						<a class="imogi-btn-ghost imogi-btn-ghost--xs" href="/app/kitchen-station">${__("Atur Stasiun")}</a>
					</div>` +
					this.render_panel_close()
			);
			return;
		}
		el.html(
			this.render_panel_open(__("Kitchen Performance"), "fa-fire", `${rows.length} stasiun`, range) +
				live_html +
				`<div class="imogi-dash-bars">${rows
					.map((r) => {
						const label = r.station_label || r.kitchen_station || __("Tanpa stasiun");
						const type = r.station_type === "Bar" ? __("Bar") : __("Dapur");
						const avg = Math.round(flt(r.avg_minutes));
						const avg_label = avg > 0 ? `${avg} min` : "—";
						return `<div>
						<div class="imogi-dash-bar-head">
							<span class="imogi-dash-bar-name">${frappe.utils.escape_html(label)} <span class="imogi-dash-muted">(${frappe.utils.escape_html(type)})</span></span>
							<span class="imogi-dash-bar-meta">${r.orders || 0} order · ${avg_label} · ${r.completed || 0} ${__("selesai")}</span>
						</div>
						<div class="imogi-dash-muted" style="font-size:11px;margin:-2px 0 8px">
							${cint(r.pending)} ${__("antrian")} · ${cint(r.preparing)} ${__("dimasak")} · ${cint(r.ready)} ${__("siap")}
						</div>
					</div>`;
					})
					.join("")}</div>
				<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
					<a class="imogi-btn-ghost imogi-btn-ghost--xs" href="/app/kitchen-performance">${__("Buka Laporan")}</a>
					<a class="imogi-btn-ghost imogi-btn-ghost--xs" href="/app/kitchen-display">${__("Buka KDS")}</a>
				</div>` +
				this.render_panel_close()
		);
	}

	render_bars_panel(el, title, icon, rows, opts) {
		if (!el?.length) return;
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
		if (!el?.length) return;
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

	export_csv(filename, headers, rows) {
		const escape_cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
		const line = (cells) => cells.map(escape_cell).join(",");
		const lines = [
			line(headers.map((h) => h.label)),
			...rows.map((row) =>
				line(headers.map((h) => (typeof h.value === "function" ? h.value(row) : row[h.value])))
			),
		];
		const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(a.href);
	}

	attach_export($el, filename, headers, rows) {
		if (!$el?.length || !rows?.length) return;
		const $head = $el.find(".imogi-dash-panel-head").first();
		if (!$head.length) return;
		$head.find(".imogi-dash-panel-export").remove();
		const $btn = $(
			`<button type="button" class="imogi-dash-panel-export" title="${__("Export Excel")}"><i class="fa fa-download"></i></button>`
		);
		$btn.on("click", (e) => {
			e.stopPropagation();
			this.export_csv(filename, headers, rows);
		});
		$head.append($btn);
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
		this.add_panel("imogi-waste-report", "warning", "waste_report");
		this.add_panel("imogi-tax-report", "blue", "tax_report");
		this.add_panel("imogi-table-turnover", "slate", "table_turnover_report");
		this.add_panel("imogi-customer-visit", "brand", "customer_visit_report");
		this.add_panel("imogi-kitchen-performance", "orange", "kitchen_performance");
	}

	render(data) {
		const deltas = (data.insights || {}).deltas || {};
		this.render_topbar(data);
		this.render_pos_shift(data);
		this.render_awaiting_alert(data);
		this.render_sales_target(data);
		this.render_branch_breakdown(data);
		this.render_stat_cards([
			{
				label: __("Penjualan Hari Ini"),
				value: format_currency(data.sales_today || 0),
				icon: "fa-money",
				tone: "brand",
				hero: true,
				delta: deltas.sales_pct,
			},
			{
				label: __("Order Selesai"),
				value: data.completed_today || 0,
				icon: "fa-check-circle",
				tone: "success",
				delta: deltas.completed_pct,
			},
			{
				label: __("Total Order"),
				value: data.orders_today || 0,
				icon: "fa-list-alt",
				tone: "slate",
				delta: deltas.orders_pct,
			},
			{ label: __("Di Kitchen"), value: data.in_kitchen || 0, icon: "fa-fire", tone: "orange" },
			{ label: __("In Service"), value: data.in_service || 0, icon: "fa-cutlery", tone: "blue" },
			{
				label: __("Kitchen Aktif"),
				value: data.open_kitchen_orders || 0,
				icon: "fa-bell",
				tone: "warning",
			},
		]);
		this.render_saas_insights(data);

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
		const $salesHour = this.wrapper.find(".imogi-sales-hour");
		this.render_bars_panel($salesHour, __("Penjualan per Jam"), "fa-clock-o", hour, {
			label_key: "hour_label",
			value_key: "sales",
			tone: "success",
			meta_fn: (r) => `${r.order_count} order · ${format_currency(r.sales)}`,
		});
		this.attach_export(
			$salesHour,
			`penjualan-per-jam-${this.selected_date}.csv`,
			[
				{ label: __("Jam"), value: "hour_label" },
				{ label: __("Order"), value: "order_count" },
				{ label: __("Penjualan"), value: "sales" },
			],
			hour
		);
		const cat = reports.sales_by_category?.rows || [];
		const $salesCat = this.wrapper.find(".imogi-sales-category");
		this.render_bars_panel($salesCat, __("Penjualan per Kategori"), "fa-pie-chart", cat, {
			label_key: "category",
			value_key: "sales",
			tone: "brand",
		});
		this.attach_export(
			$salesCat,
			`penjualan-per-kategori-${this.selected_date}.csv`,
			[
				{ label: __("Kategori"), value: "category" },
				{ label: __("Penjualan"), value: "sales" },
			],
			cat
		);
		const disc = reports.discount_report || {};
		const discRows = disc.rows || [];
		const $discPanel = this.wrapper.find(".imogi-discount-report");
		this.render_simple_list(
			$discPanel,
			__("Laporan Diskon"),
			"fa-tag",
			discRows.slice(0, 8).map((r) => ({
				label: r.name,
				meta: `${format_currency(r.discount_amount || 0)} · ${frappe.datetime.str_to_user(r.creation)}`,
			})),
			disc.count ? `${disc.count} transaksi` : ""
		);
		this.attach_export(
			$discPanel,
			`laporan-diskon-${this.selected_date}.csv`,
			[
				{ label: __("Order"), value: "name" },
				{ label: __("Diskon"), value: "discount_amount" },
				{ label: __("Tanggal"), value: (r) => frappe.datetime.str_to_user(r.creation) },
			],
			discRows
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
			this.attach_export(
				$fc,
				`food-cost-${this.selected_date}.csv`,
				[
					{ label: __("Penjualan"), value: "sales" },
					{ label: __("Food Cost"), value: "food_cost" },
					{ label: __("Margin"), value: "margin" },
					{ label: __("Food Cost %"), value: "food_cost_percent" },
				],
				[food]
			);
		}
		const waste = reports.waste_report || {};
		if (!waste.locked) {
			const $w = this.wrapper.find(".imogi-waste-report");
			$w.html(
				this.render_panel_open(
					__("Waste Report"),
					"fa-trash",
					waste.total_value ? format_currency(waste.total_value) : ""
				) +
					`<div class="imogi-mini-stats imogi-mini-stats--grid">
						<div class="imogi-mini-stat"><span class="imogi-mini-stat-label">${__("Baris")}</span><span class="imogi-mini-stat-val">${cint(waste.count)}</span></div>
						<div class="imogi-mini-stat"><span class="imogi-mini-stat-label">${__("Qty")}</span><span class="imogi-mini-stat-val">${flt(waste.total_qty).toFixed(2)}</span></div>
						<div class="imogi-mini-stat"><span class="imogi-mini-stat-label">${__("Nilai")}</span><span class="imogi-mini-stat-val">${format_currency(waste.total_value || 0)}</span></div>
					</div>
					<div class="imogi-simple-list" style="margin-top:10px">
						${(waste.rows || [])
							.slice(0, 6)
							.map(
								(r) => `<div class="imogi-simple-list-row">
							<span class="imogi-simple-list-label">${frappe.utils.escape_html(r.item_name || r.item_code || r.name)}</span>
							<span class="imogi-simple-list-meta">${flt(r.qty)} · ${format_currency(r.amount || 0)}</span>
						</div>`
							)
							.join("") || `<div class="imogi-simple-list-empty">${__("Belum ada waste/spoilage di periode ini.")}</div>`}
					</div>
					<div style="margin-top:10px">
						<a class="imogi-btn-ghost" href="/app/inventory-hub/waste"><i class="fa fa-external-link"></i> ${__("Inventory Hub / Waste")}</a>
					</div>` +
					this.render_panel_close()
			);
			this.attach_export(
				$w,
				`waste-report-${this.selected_date}.csv`,
				[
					{ label: __("Item"), value: (r) => r.item_name || r.item_code || r.name },
					{ label: __("Qty"), value: "qty" },
					{ label: __("Nilai"), value: "amount" },
				],
				waste.rows || []
			);
		}
		const tax = reports.tax_report || {};
		if (!tax.locked) {
			const $t = this.wrapper.find(".imogi-tax-report");
			$t.html(
				this.render_panel_open(__("Tax Report (PPN)"), "fa-percent", format_currency(tax.tax_amount || 0)) +
					`<div class="imogi-mini-stats imogi-mini-stats--grid">
						<div class="imogi-mini-stat"><span class="imogi-mini-stat-label">${__("DPP")}</span><span class="imogi-mini-stat-val">${format_currency(tax.taxable_amount || 0)}</span></div>
						<div class="imogi-mini-stat"><span class="imogi-mini-stat-label">${__("PPN")}</span><span class="imogi-mini-stat-val">${format_currency(tax.tax_amount || 0)}</span></div>
						<div class="imogi-mini-stat"><span class="imogi-mini-stat-label">${__("Omzet")}</span><span class="imogi-mini-stat-val">${format_currency(tax.grand_total || 0)}</span></div>
					</div>
					<div class="imogi-simple-list" style="margin-top:10px">
						${(tax.daily || [])
							.slice(0, 6)
							.map(
								(r) => `<div class="imogi-simple-list-row">
							<span class="imogi-simple-list-label">${frappe.utils.escape_html(String(r.posting_date || ""))}</span>
							<span class="imogi-simple-list-meta">${cint(r.order_count)} order · PPN ${format_currency(r.tax_amount || 0)}</span>
						</div>`
							)
							.join("") || `<div class="imogi-simple-list-empty">${__("Belum ada transaksi ber-PPN.")}</div>`}
					</div>
					<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
						<a class="imogi-btn-ghost" href="/app/query-report/Sales%20Register"><i class="fa fa-file-text-o"></i> ${__("Sales Register")}</a>
						<a class="imogi-btn-ghost" href="/app/finance-hub"><i class="fa fa-university"></i> ${__("Finance Hub")}</a>
					</div>` +
					this.render_panel_close()
			);
			this.attach_export(
				$t,
				`tax-report-${this.selected_date}.csv`,
				[
					{ label: __("Tanggal"), value: (r) => String(r.posting_date || "") },
					{ label: __("Order"), value: "order_count" },
					{ label: __("PPN"), value: "tax_amount" },
				],
				tax.daily || []
			);
		}
		const turnover = reports.table_turnover_report?.rows || [];
		if (!reports.table_turnover_report?.locked) {
			const $turnover = this.wrapper.find(".imogi-table-turnover");
			this.render_simple_list(
				$turnover,
				__("Table Turnover"),
				"fa-table",
				turnover.slice(0, 8).map((r) => ({
					label: r.table_number || r.name,
					meta: `${r.turns || 0} putaran · ${format_currency(r.sales || 0)}`,
				}))
			);
			this.attach_export(
				$turnover,
				`table-turnover-${this.selected_date}.csv`,
				[
					{ label: __("Meja"), value: (r) => r.table_number || r.name },
					{ label: __("Putaran"), value: "turns" },
					{ label: __("Penjualan"), value: "sales" },
				],
				turnover
			);
		}
		const visits = reports.customer_visit_report || {};
		if (!visits.locked) {
			const $v = this.wrapper.find(".imogi-customer-visit");
			$v.html(
				this.render_panel_open(
					__("Customer Visit"),
					"fa-users",
					visits.unique_customers ? `${cint(visits.unique_customers)} ${__("customer")}` : ""
				) +
					`<div class="imogi-mini-stats imogi-mini-stats--grid">
						<div class="imogi-mini-stat"><span class="imogi-mini-stat-label">${__("Kunjungan")}</span><span class="imogi-mini-stat-val">${cint(visits.total_visits)}</span></div>
						<div class="imogi-mini-stat"><span class="imogi-mini-stat-label">${__("Spend")}</span><span class="imogi-mini-stat-val">${format_currency(visits.total_spend || 0)}</span></div>
						<div class="imogi-mini-stat"><span class="imogi-mini-stat-label">${__("Rata2/Visit")}</span><span class="imogi-mini-stat-val">${format_currency(visits.avg_spend_per_visit || 0)}</span></div>
					</div>
					<div class="imogi-simple-list" style="margin-top:10px">
						${(visits.rows || [])
							.slice(0, 8)
							.map(
								(r) => `<div class="imogi-simple-list-row">
							<span class="imogi-simple-list-label">${frappe.utils.escape_html(r.customer_name || r.customer || "")}</span>
							<span class="imogi-simple-list-meta">${cint(r.visits)}x · ${format_currency(r.spend || 0)}</span>
						</div>`
							)
							.join("") || `<div class="imogi-simple-list-empty">${__("Belum ada customer terdaftar di periode ini.")}</div>`}
					</div>` +
					this.render_panel_close()
			);
			this.attach_export(
				$v,
				`customer-visit-${this.selected_date}.csv`,
				[
					{ label: __("Customer"), value: (r) => r.customer_name || r.customer || "" },
					{ label: __("Kunjungan"), value: "visits" },
					{ label: __("Spend"), value: "spend" },
				],
				visits.rows || []
			);
		}
		this.render_kitchen_performance(reports.kitchen_performance || {});
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
				__("Dashboard operasional — omzet, tren, funnel order, dan performa outlet."),
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
		this.add_panel("imogi-sales-hour", "success", "sales_by_hour");
		this.add_panel("imogi-payment-chart", "purple", "sales_by_payment");
		this.add_panel("imogi-source-chart", "blue", "channel");
		this.add_panel("imogi-low-stock", "warning", "low_stock");
		if (imogi_dashboard_kds_enabled()) {
			this.add_panel("imogi-kitchen-performance", "orange", "kitchen_performance");
		}
	}

	render(data) {
		const deltas = (data.insights || {}).deltas || {};
		this.render_topbar(data);
		this.render_pos_shift(data);
		this.render_awaiting_alert(data);
		this.render_sales_target(data);
		this.render_branch_breakdown(data);
		this.render_stat_cards([
			{
				label: __("Penjualan Hari Ini"),
				value: format_currency(data.sales_today || 0),
				icon: "fa-money",
				tone: "brand",
				hero: true,
				delta: deltas.sales_pct,
			},
			{
				label: __("Transaksi Selesai"),
				value: data.completed_today || 0,
				icon: "fa-check-circle",
				tone: "success",
				delta: deltas.completed_pct,
			},
			{
				label: __("Rata-rata / Transaksi"),
				value: format_currency(data.avg_ticket || 0),
				icon: "fa-calculator",
				tone: "slate",
				delta: deltas.avg_ticket_pct,
			},
			{
				label: __("Menunggu Bayar"),
				value: data.awaiting_payment || 0,
				icon: "fa-clock-o",
				tone: "danger",
				warn: true,
				delta: deltas.awaiting_pct,
			},
			{
				label: __("Total Order"),
				value: data.orders_today || 0,
				icon: "fa-shopping-cart",
				tone: "blue",
				delta: deltas.orders_pct,
			},
			{
				label: __("Dibatalkan"),
				value: (data.insights || {}).cancelled_today || 0,
				icon: "fa-ban",
				tone: "warning",
				delta: deltas.cancelled_pct,
			},
		]);
		this.render_saas_insights(data);

		this.render_top_products(data);
		this.render_sales_hour_panel(data);
		this.render_payment_list(data.by_payment || []);
		this.render_source_list(data.by_source || []);
		this.render_low_stock(data);
		if (imogi_dashboard_kds_enabled()) {
			this.render_kitchen_performance((data.extended_reports || {}).kitchen_performance || {});
		}
		this.render_footer(data);
	}

	render_sales_hour_panel(data) {
		const el = this.wrapper.find(".imogi-sales-hour");
		if (!el.length) return;
		const hour = ((data.extended_reports || {}).sales_by_hour?.rows || []).map((r) => ({
			hour_label: `${String(r.hour_slot).padStart(2, "0")}:00`,
			order_count: r.order_count,
			sales: r.sales,
		}));
		this.render_bars_panel(el, __("Penjualan per Jam"), "fa-clock-o", hour, {
			label_key: "hour_label",
			value_key: "sales",
			tone: "success",
			meta_fn: (r) => `${r.order_count} order · ${format_currency(r.sales)}`,
		});
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
