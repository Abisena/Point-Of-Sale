const IMOGI_TABLE_STATUS_CLASS = {
	Available: "is-available",
	Occupied: "is-occupied",
	Reserved: "is-reserved",
};

const IMOGI_TS_STATUS_LABEL = {
	Available: __("Kosong"),
	Occupied: __("Terisi"),
	Reserved: __("Dipesan"),
};

const IMOGI_TS_FLOOR_CHIP_MAX = 3;
const IMOGI_TS_AREA_CHIP_MAX = 4;

const IMOGI_TS_V2_STYLE_ID = "imogi-ts-v2-css-d";

function imogi_ts_ensure_v2_css() {
	const legacy_id = "imogi-ts-v2-css";
	document.getElementById(legacy_id)?.remove();
	document.getElementById("imogi-ts-v2-css-c")?.remove();
	if (document.getElementById(IMOGI_TS_V2_STYLE_ID)) {
		return;
	}
	frappe.dom.set_style(
		`
		.imogi-ts-shell--v2 {
			--ts-bg: #eef1f5;
			--ts-surface: #fff;
			--ts-border: #e4e8ee;
			--ts-text: #1a2332;
			--ts-muted: #6b7a90;
			--ts-accent: #714b67;
			--ts-available: #16a34a;
			--ts-occupied: #ea580c;
			--ts-reserved: #2563eb;
			background: var(--ts-bg);
			gap: 0;
		}
		body.imogi-table-service-fullscreen .imogi-ts-shell--v2 {
			background: var(--ts-bg);
		}
		.imogi-ts-shell--v2 .imogi-ts-kpi-strip {
			background: var(--ts-surface);
			border-bottom: 1px solid var(--ts-border);
			display: grid;
			gap: 8px;
			grid-template-columns: repeat(4, minmax(0, 1fr));
			padding: 8px 14px;
		}
		@media (max-width: 900px) {
			.imogi-ts-shell--v2 .imogi-ts-kpi-strip {
				grid-template-columns: repeat(2, minmax(0, 1fr));
			}
		}
		.imogi-ts-shell--v2 .imogi-ts-kpi {
			align-items: center;
			background: #f8fafc;
			border: 1px solid var(--ts-border);
			border-radius: 10px;
			display: flex;
			gap: 10px;
			min-width: 0;
			padding: 8px 12px;
		}
		.imogi-ts-shell--v2 .imogi-ts-kpi__icon {
			align-items: center;
			border-radius: 8px;
			color: #fff;
			display: flex;
			flex-shrink: 0;
			font-size: 14px;
			height: 34px;
			justify-content: center;
			width: 34px;
		}
		.imogi-ts-kpi--total .imogi-ts-kpi__icon { background: linear-gradient(135deg, #475569, #64748b); }
		.imogi-ts-kpi--available .imogi-ts-kpi__icon { background: linear-gradient(135deg, #15803d, #22c55e); }
		.imogi-ts-kpi--occupied .imogi-ts-kpi__icon { background: linear-gradient(135deg, #c2410c, #f97316); }
		.imogi-ts-kpi--waiting .imogi-ts-kpi__icon { background: linear-gradient(135deg, #1d4ed8, #3b82f6); }
		.imogi-ts-shell--v2 .imogi-ts-kpi__val {
			color: var(--ts-text);
			font-size: 20px;
			font-weight: 800;
			line-height: 1;
		}
		.imogi-ts-shell--v2 .imogi-ts-kpi__label {
			color: var(--ts-muted);
			font-size: 11px;
			font-weight: 600;
			letter-spacing: 0.04em;
			margin-top: 4px;
			text-transform: uppercase;
		}
		.imogi-ts-shell--v2 .imogi-ts-layout--v2 {
			display: grid;
			gap: 0;
			grid-template-columns: minmax(0, 1fr) 320px;
			min-height: 0;
		}
		@media (max-width: 1100px) {
			.imogi-ts-shell--v2 .imogi-ts-layout--v2 {
				grid-template-columns: 1fr;
			}
		}
		.imogi-ts-shell--v2 .imogi-ts-floor {
			display: flex;
			flex-direction: column;
			min-height: 0;
			padding: 10px 14px 14px;
		}
		.imogi-ts-shell--v2 .imogi-ts-floor-head {
			align-items: center;
			display: flex;
			flex-wrap: wrap;
			gap: 10px;
			justify-content: space-between;
			margin-bottom: 8px;
		}
		.imogi-ts-shell--v2 .imogi-ts-floor-title {
			color: var(--ts-text);
			font-size: 18px;
			font-weight: 800;
			margin: 0;
		}
		.imogi-ts-shell--v2 .imogi-ts-floor-sub {
			color: var(--ts-muted);
			font-size: 12px;
			margin: 4px 0 0;
		}
		.imogi-ts-shell--v2 .imogi-ts-floor-toolbar {
			align-items: center;
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
		}
		.imogi-ts-shell--v2 .imogi-ts-legend {
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
		}
		.imogi-ts-shell--v2 .imogi-ts-legend-item {
			align-items: center;
			color: var(--ts-muted);
			display: inline-flex;
			font-size: 11px;
			font-weight: 600;
			gap: 6px;
		}
		.imogi-ts-shell--v2 .imogi-ts-legend-dot {
			border-radius: 50%;
			height: 8px;
			width: 8px;
		}
		.imogi-ts-legend-dot--available { background: var(--ts-available); }
		.imogi-ts-legend-dot--occupied { background: var(--ts-occupied); }
		.imogi-ts-legend-dot--reserved { background: var(--ts-reserved); }
		.imogi-ts-shell--v2 .imogi-ts-floor-nav {
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
			margin: 0 0 8px;
		}
		.imogi-ts-shell--v2 .imogi-ts-floor-chip {
			background: #fff;
			border: 1px solid #cbd5e1;
			border-radius: 999px;
			color: #334155;
			cursor: pointer;
			font-size: 12px;
			font-weight: 700;
			padding: 6px 14px;
			transition: all .15s;
		}
		.imogi-ts-shell--v2 .imogi-ts-floor-chip:hover {
			border-color: #6366f1;
			color: #4338ca;
		}
		.imogi-ts-shell--v2 .imogi-ts-floor-chip.is-active {
			background: #4338ca;
			border-color: #4338ca;
			color: #fff;
		}
		.imogi-ts-shell--v2 .imogi-ts-zone-filter {
			display: flex;
			flex-wrap: wrap;
			gap: 6px;
			margin-bottom: 12px;
		}
		.imogi-ts-shell--v2 .imogi-ts-zone-chip {
			background: var(--ts-surface);
			border: 1px solid var(--ts-border);
			border-radius: 999px;
			color: var(--ts-muted);
			cursor: pointer;
			font-size: 12px;
			font-weight: 600;
			padding: 5px 12px;
			transition: all 0.15s ease;
		}
		.imogi-ts-shell--v2 .imogi-ts-zone-chip:hover {
			border-color: #cbd5e1;
			color: var(--ts-text);
		}
		.imogi-ts-shell--v2 .imogi-ts-zone-chip.is-active {
			background: var(--ts-accent);
			border-color: var(--ts-accent);
			color: #fff;
		}
		.imogi-ts-shell--v2 .imogi-ts-manage-btn {
			background: var(--ts-surface) !important;
			border: 1px solid var(--ts-border) !important;
			border-radius: 8px !important;
			color: var(--ts-text) !important;
			font-size: 12px !important;
			font-weight: 700 !important;
		}
		.imogi-ts-shell--v2 .imogi-ts-table-grid {
			align-content: start;
			display: grid;
			flex: 1;
			gap: 12px;
			grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
			min-height: 200px;
			overflow: auto;
			padding: 0;
		}
		@media (min-width: 1400px) {
			.imogi-ts-shell--v2 .imogi-ts-table-grid {
				grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
			}
		}
		.imogi-ts-shell--v2 .imogi-ts-table-card {
			background: var(--ts-surface);
			border: 1px solid var(--ts-border);
			border-radius: 12px;
			box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
			display: flex;
			flex-direction: column;
			gap: 0;
			min-height: 0;
			overflow: hidden;
			padding: 0;
			position: relative;
			transition: box-shadow 0.15s ease, transform 0.15s ease;
		}
		.imogi-ts-shell--v2 .imogi-ts-table-card:hover {
			box-shadow: 0 6px 20px rgba(15, 23, 42, 0.1);
			transform: translateY(-1px);
		}
		.imogi-ts-shell--v2 .imogi-ts-table-card::before {
			background: #94a3b8;
			bottom: 0;
			content: "";
			left: 0;
			position: absolute;
			top: 0;
			width: 5px;
		}
		.imogi-ts-shell--v2 .imogi-ts-table-card.is-available::before { background: var(--ts-available); }
		.imogi-ts-shell--v2 .imogi-ts-table-card.is-occupied::before { background: var(--ts-occupied); }
		.imogi-ts-shell--v2 .imogi-ts-table-card.is-reserved::before { background: var(--ts-reserved); }
		.imogi-ts-shell--v2 .imogi-ts-table-card__main {
			align-items: flex-start;
			display: flex;
			gap: 12px;
			justify-content: space-between;
			padding: 14px 16px 10px 18px;
		}
		.imogi-ts-shell--v2 .imogi-ts-table-card__info {
			flex: 1;
			min-width: 0;
		}
		.imogi-ts-shell--v2 .imogi-ts-table-card__status {
			flex-shrink: 0;
			text-align: right;
		}
		.imogi-ts-shell--v2 .imogi-ts-table-badge {
			border-radius: 999px;
			font-size: 10px;
			font-weight: 800;
			letter-spacing: 0.06em;
			padding: 3px 8px;
			text-transform: uppercase;
		}
		.imogi-ts-table-card.is-available .imogi-ts-table-badge {
			background: #dcfce7;
			color: #166534;
		}
		.imogi-ts-table-card.is-occupied .imogi-ts-table-badge {
			background: #ffedd5;
			color: #9a3412;
		}
		.imogi-ts-table-card.is-reserved .imogi-ts-table-badge {
			background: #dbeafe;
			color: #1e40af;
		}
		.imogi-ts-shell--v2 .imogi-ts-table-meta-row {
			align-items: center;
			color: var(--ts-muted);
			display: flex;
			flex-wrap: wrap;
			font-size: 12px;
			font-weight: 600;
			gap: 8px;
			margin-top: 4px;
		}
		.imogi-ts-shell--v2 .imogi-ts-table-cap {
			align-items: center;
			display: inline-flex;
			gap: 4px;
		}
		.imogi-ts-shell--v2 .imogi-ts-table-num {
			color: var(--ts-text);
			font-size: 24px;
			font-weight: 800;
			line-height: 1;
		}
		.imogi-ts-shell--v2 .imogi-ts-table-zone {
			color: var(--ts-muted);
		}
		.imogi-ts-shell--v2 .imogi-ts-table-order {
			background: #f8fafc;
			border-top: 1px solid var(--ts-border);
			padding: 8px 16px 8px 18px;
		}
		.imogi-ts-shell--v2 .imogi-ts-order-ref {
			color: var(--ts-text);
			font-size: 12px;
			font-weight: 800;
		}
		.imogi-ts-shell--v2 .imogi-ts-order-meta {
			color: var(--ts-muted);
			font-size: 12px;
			margin-top: 2px;
		}
		.imogi-ts-shell--v2 .imogi-ts-table-actions {
			border-top: 1px solid var(--ts-border);
			display: flex;
			flex-wrap: wrap;
			gap: 6px;
			margin-top: auto;
			padding: 10px 12px 12px 18px;
		}
		.imogi-ts-shell--v2 .imogi-ts-table-actions--single .imogi-ts-act {
			flex: 1;
			min-width: 140px;
		}
		.imogi-ts-shell--v2 .imogi-ts-act {
			align-items: center;
			background: #f8fafc;
			border: 1px solid var(--ts-border);
			border-radius: 8px;
			color: var(--ts-text);
			cursor: pointer;
			display: inline-flex;
			flex: 1;
			font-size: 11px;
			font-weight: 700;
			gap: 5px;
			justify-content: center;
			min-width: 0;
			padding: 8px 12px;
			transition: background 0.12s ease;
		}
		.imogi-ts-shell--v2 .imogi-ts-act:hover {
			background: #eef2f7;
		}
		.imogi-ts-shell--v2 .imogi-ts-act--primary {
			background: var(--ts-accent);
			border-color: var(--ts-accent);
			color: #fff;
		}
		.imogi-ts-shell--v2 .imogi-ts-act--primary:hover {
			background: #5c3d55;
		}
		.imogi-ts-shell--v2 .imogi-ts-sidebar {
			background: var(--ts-surface);
			border-left: 1px solid var(--ts-border);
			display: flex;
			flex-direction: column;
			min-height: 0;
		}
		@media (max-width: 1100px) {
			.imogi-ts-shell--v2 .imogi-ts-sidebar {
				border-left: 0;
				border-top: 1px solid var(--ts-border);
			}
		}
		.imogi-ts-shell--v2 .imogi-ts-side-panel {
			display: flex;
			flex: 1;
			flex-direction: column;
			min-height: 220px;
			overflow: hidden;
		}
		.imogi-ts-shell--v2 .imogi-ts-side-panel + .imogi-ts-side-panel {
			border-top: 1px solid var(--ts-border);
		}
		.imogi-ts-shell--v2 .imogi-ts-side-head {
			align-items: center;
			background: #fafbfc;
			border-bottom: 1px solid var(--ts-border);
			display: flex;
			gap: 8px;
			justify-content: space-between;
			padding: 12px 14px;
		}
		.imogi-ts-shell--v2 .imogi-ts-side-head h4 {
			align-items: center;
			color: var(--ts-text);
			display: flex;
			font-size: 13px;
			font-weight: 800;
			gap: 8px;
			margin: 0;
		}
		.imogi-ts-shell--v2 .imogi-ts-side-count {
			background: #e2e8f0;
			border-radius: 999px;
			color: #334155;
			font-size: 11px;
			font-weight: 800;
			min-width: 22px;
			padding: 2px 7px;
			text-align: center;
		}
		.imogi-ts-side-panel--reservations .imogi-ts-side-count {
			background: #ffedd5;
			color: #9a3412;
		}
		.imogi-ts-side-panel--waiting .imogi-ts-side-count {
			background: #dbeafe;
			color: #1e40af;
		}
		.imogi-ts-shell--v2 .imogi-ts-side-add {
			background: transparent !important;
			border: 1px solid var(--ts-border) !important;
			border-radius: 8px !important;
			color: var(--ts-accent) !important;
			font-size: 11px !important;
			font-weight: 700 !important;
			padding: 4px 10px !important;
		}
		.imogi-ts-shell--v2 .imogi-ts-reservation-list,
		.imogi-ts-shell--v2 .imogi-ts-waiting-list {
			flex: 1;
			gap: 8px;
			overflow: auto;
			padding: 10px;
		}
		.imogi-ts-shell--v2 .imogi-ts-list-item {
			background: #fff;
			border: 1px solid var(--ts-border);
			border-left: 3px solid #cbd5e1;
			border-radius: 10px;
			padding: 10px 12px;
		}
		.imogi-ts-list-item--reservation { border-left-color: var(--ts-occupied); }
		.imogi-ts-list-item--waiting { border-left-color: var(--ts-reserved); }
		.imogi-ts-shell--v2 .imogi-ts-list-head strong {
			color: var(--ts-text);
			font-size: 13px;
		}
		.imogi-ts-shell--v2 .imogi-ts-list-meta {
			color: var(--ts-muted);
			font-size: 11px;
			line-height: 1.45;
			margin-top: 4px;
		}
		.imogi-ts-shell--v2 .imogi-ts-list-actions {
			gap: 6px;
			margin-top: 8px;
		}
		.imogi-ts-shell--v2 .imogi-ts-list-actions .btn {
			border-radius: 8px !important;
			font-size: 11px !important;
			font-weight: 700 !important;
		}
		.imogi-ts-shell--v2 .imogi-ts-empty:not(.imogi-ts-guided-empty),
		.imogi-ts-shell--v2 .imogi-ts-list-empty {
			align-items: center;
			background: #f8fafc;
			border: 1px dashed #cbd5e1;
			border-radius: 12px;
			color: var(--ts-muted);
			display: flex;
			flex: 1;
			flex-direction: column;
			font-size: 13px;
			gap: 8px;
			justify-content: center;
			margin: 10px;
			min-height: 140px;
			padding: 20px;
			text-align: center;
		}
		.imogi-ts-shell--v2 .imogi-ts-empty:not(.imogi-ts-guided-empty) i {
			color: var(--ts-accent);
			font-size: 26px;
		}
		.imogi-ts-shell--v2 .imogi-ts-topbar.imogi-ts-topbar--desk {
			background: linear-gradient(145deg, #0f1f35 0%, #1a3352 100%) !important;
			border-bottom: 1px solid rgba(255, 255, 255, 0.08);
			box-shadow: none;
		}
		body.imogi-table-service-fullscreen .imogi-ts-shell--v2 .imogi-ts-layout--v2 {
			flex: 1;
			min-height: 0;
			overflow: hidden;
		}
		body.imogi-table-service-fullscreen .imogi-ts-shell--v2 .imogi-ts-floor {
			min-height: 0;
			overflow: hidden;
		}
		body.imogi-table-service-fullscreen .imogi-ts-shell--v2 .imogi-ts-table-grid {
			min-height: 0;
		}
		`,
		IMOGI_TS_V2_STYLE_ID
	);
}

const IMOGI_TS_WAITER_ESCALATION = [
	"Administrator",
	"System Manager",
	"Sales Manager",
	"IMOGI Owner",
	"IMOGI Manager",
	"IMOGI Area Manager",
	"IMOGI Supervisor",
	"IMOGI Cashier",
];

function imogi_ts_is_dedicated_waiter() {
	if (imogi_pos.is_dedicated_waiter_user?.()) {
		return true;
	}
	const roles = frappe.boot?.user?.roles || [];
	return roles.includes("IMOGI Waiter") && !IMOGI_TS_WAITER_ESCALATION.some((role) => roles.includes(role));
}

const IMOGI_TS_DESK_TOPBAR_STYLE_ID = "imogi-ts-desk-topbar-css-v2";
const IMOGI_TS_FULLWIDTH_STYLE_ID = "imogi-ts-fullwidth-css-v1";

function imogi_ts_ensure_fullwidth_css() {
	if (document.getElementById(IMOGI_TS_FULLWIDTH_STYLE_ID)) {
		return;
	}
	frappe.dom.set_style(
		`
		body.imogi-table-service-fullscreen .container,
		body.imogi-table-service-fullscreen .container.page-body,
		body.imogi-table-service-fullscreen .page-wrapper,
		body.imogi-table-service-fullscreen .page-content,
		body.imogi-table-service-fullscreen .row.layout-main,
		body.imogi-table-service-fullscreen .layout-main-section-wrapper,
		body.imogi-table-service-fullscreen .layout-main-section-wrapper > [class*="col-"],
		body.imogi-table-service-fullscreen .layout-main,
		body.imogi-table-service-fullscreen .page-container,
		body.imogi-table-service-fullscreen .main-section,
		body.imogi-table-service-fullscreen .content.page-container,
		body.imogi-table-service-fullscreen .imogi-table-service-page.layout-main-section,
		body.imogi-table-service-fullscreen .imogi-table-service-page,
		body.imogi-table-service-fullscreen .imogi-ts-shell,
		body.imogi-table-service-fullscreen .imogi-ts-topbar.imogi-ts-topbar--desk {
			box-sizing: border-box !important;
			margin-left: 0 !important;
			margin-right: 0 !important;
			max-width: 100% !important;
			padding-left: 0 !important;
			padding-right: 0 !important;
			width: 100% !important;
		}
		body.imogi-table-service-fullscreen .layout-main-section-wrapper {
			flex: 0 0 100% !important;
		}
		body.imogi-table-service-fullscreen .row.layout-main {
			margin-left: 0 !important;
			margin-right: 0 !important;
		}
		body.imogi-table-service-fullscreen .imogi-table-service-page.layout-main-section {
			border: 0 !important;
			border-radius: 0 !important;
			box-shadow: none !important;
		}
		body.imogi-table-service-fullscreen .imogi-ts-topbar.imogi-ts-topbar--desk {
			border-radius: 0 !important;
			flex-shrink: 0 !important;
		}
		`,
		IMOGI_TS_FULLWIDTH_STYLE_ID
	);
}

function imogi_ts_ensure_desk_topbar_css() {
	document.getElementById("imogi-ts-desk-topbar-css-v1")?.remove();
	if (document.getElementById(IMOGI_TS_DESK_TOPBAR_STYLE_ID)) {
		return;
	}
	frappe.dom.set_style(
		`
		.imogi-ts-topbar.imogi-ts-topbar--desk,
		body.imogi-table-service-fullscreen .imogi-ts-topbar.imogi-ts-topbar--desk,
		body.imogi-table-service-active .imogi-ts-topbar.imogi-ts-topbar--desk {
			background: linear-gradient(145deg, #0f1f35 0%, #1a3352 100%) !important;
			background-color: #0f1f35 !important;
			border: 0 !important;
			border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
			border-radius: 0 !important;
			box-shadow: none !important;
			color: #fff !important;
			padding: 10px 14px !important;
		}
		.imogi-ts-topbar.imogi-ts-topbar--desk .imogi-ts-topbar-left {
			padding-left: 2px;
		}
		.imogi-ts-topbar.imogi-ts-topbar--desk .imogi-ts-desk-brand-title,
		.imogi-ts-topbar.imogi-ts-topbar--desk .imogi-ts-topbar-left,
		.imogi-ts-topbar.imogi-ts-topbar--desk .imogi-ts-topbar-right {
			color: #fff !important;
		}
		.imogi-ts-topbar.imogi-ts-topbar--desk .imogi-ts-stat-pill {
			background: rgba(255, 255, 255, 0.08) !important;
			border-color: rgba(255, 255, 255, 0.14) !important;
			color: rgba(255, 255, 255, 0.92) !important;
		}
		.imogi-ts-topbar.imogi-ts-topbar--desk .imogi-ts-stat-pill .imogi-ts-stat-num {
			color: #fff !important;
		}
		.imogi-ts-topbar.imogi-ts-topbar--desk .imogi-ts-stat-pill--reserved {
			background: rgba(251, 146, 60, 0.16) !important;
			border-color: rgba(251, 146, 60, 0.35) !important;
			color: #fdba74 !important;
		}
		.imogi-ts-topbar.imogi-ts-topbar--desk .imogi-ts-stat-pill--waiting {
			background: rgba(59, 130, 246, 0.16) !important;
			border-color: rgba(59, 130, 246, 0.35) !important;
			color: #93c5fd !important;
		}
		.imogi-ts-topbar.imogi-ts-topbar--desk .imogi-ts-refresh,
		.imogi-ts-topbar.imogi-ts-topbar--desk .imogi-ts-logout-btn {
			background: rgba(255, 255, 255, 0.08) !important;
			border: 1px solid rgba(255, 255, 255, 0.28) !important;
			color: #fff !important;
		}
		`,
		IMOGI_TS_DESK_TOPBAR_STYLE_ID
	);
}

function imogi_ts_paint_desk_topbar(root) {
	imogi_ts_ensure_desk_topbar_css();
	const scope = root && root.querySelector ? root : document;
	scope.querySelectorAll(".imogi-ts-topbar--desk").forEach((bar) => {
		bar.style.setProperty("background", "linear-gradient(145deg, #0f1f35 0%, #1a3352 100%)", "important");
		bar.style.setProperty("background-color", "#0f1f35", "important");
		bar.style.setProperty("padding-left", "14px", "important");
		bar.style.setProperty("padding-right", "14px", "important");
		bar.style.setProperty("padding-top", "10px", "important");
		bar.style.setProperty("padding-bottom", "10px", "important");
		bar.style.setProperty("color", "#fff", "important");
		bar.style.setProperty("border", "0", "important");
	});
	scope.querySelectorAll(".imogi-ts-topbar--desk .imogi-ts-desk-brand-title").forEach((el) => {
		el.style.setProperty("color", "#fff", "important");
	});
}

imogi_pos.paint_table_service_topbar = imogi_ts_paint_desk_topbar;

const IMOGI_TS_MODAL_STYLE_ID = "imogi-ts-modal-css-v2";

function imogi_ts_ensure_modal_css() {
	if (document.getElementById(IMOGI_TS_MODAL_STYLE_ID)) {
		return;
	}
	frappe.dom.set_style(
		`
		.modal.imogi-ts-dialog { z-index: 2000 !important; }
		.modal.imogi-ts-dialog + .modal-backdrop { z-index: 1990 !important; }
		/* Confirm/nested modals must stack above imogi-ts-dialog */
		body > .modal.show:last-of-type { z-index: 2100 !important; }
		body > .modal-backdrop.show:last-of-type { z-index: 2090 !important; }
		.imogi-ts-dialog .modal-dialog {
			margin: 1.5rem auto !important;
			max-width: min(520px, 94vw) !important;
			width: min(520px, 94vw) !important;
		}
		.imogi-ts-dialog.imogi-ts-dialog--wide .modal-dialog {
			max-width: min(640px, 96vw) !important;
			width: min(640px, 96vw) !important;
		}
		.imogi-ts-dialog .modal-content {
			border: 1px solid #e4e4e7;
			border-radius: 18px;
			box-shadow: 0 24px 64px rgba(15, 31, 53, 0.18);
			overflow: hidden;
		}
		.imogi-ts-dialog .modal-header {
			align-items: flex-start;
			background: linear-gradient(180deg, #0f1f35 0%, #152a45 100%);
			border: 0;
			display: flex;
			gap: 12px;
			padding: 18px 20px 16px;
		}
		.imogi-ts-dialog .modal-header .close {
			color: rgba(255, 255, 255, 0.82);
			font-size: 22px;
			font-weight: 400;
			margin: -4px -6px 0 0;
			opacity: 1;
			text-shadow: none;
		}
		.imogi-ts-dialog .modal-header .close:hover { color: #fff; }
		.imogi-ts-dialog__icon {
			align-items: center;
			background: rgba(255, 255, 255, 0.12);
			border: 1px solid rgba(255, 255, 255, 0.16);
			border-radius: 12px;
			color: #fff;
			display: flex;
			flex-shrink: 0;
			font-size: 18px;
			height: 42px;
			justify-content: center;
			width: 42px;
		}
		.imogi-ts-dialog__title-wrap { flex: 1; min-width: 0; }
		.imogi-ts-dialog__title {
			color: #fff;
			font-size: 18px;
			font-weight: 800;
			line-height: 1.2;
		}
		.imogi-ts-dialog__sub {
			color: rgba(255, 255, 255, 0.72);
			font-size: 12px;
			line-height: 1.35;
			margin-top: 4px;
		}
		.imogi-ts-dialog .modal-body {
			background: #f8fafc;
			max-height: min(70vh, 640px);
			overflow-x: hidden;
			overflow-y: auto;
			padding: 18px 20px 8px;
		}
		.imogi-ts-dialog .form-section .section-head,
		.imogi-ts-dialog .form-section .section-body h6 {
			border: 0;
			color: #0f1f35;
			font-size: 12px;
			font-weight: 800;
			letter-spacing: 0.04em;
			margin: 0 0 12px;
			padding: 0;
			text-transform: uppercase;
		}
		.imogi-ts-dialog .frappe-control { margin-bottom: 14px !important; }
		.imogi-ts-dialog .frappe-control .control-label {
			color: #334155;
			font-size: 12px;
			font-weight: 700;
			margin-bottom: 6px;
		}
		.imogi-ts-dialog .form-control,
		.imogi-ts-dialog .awesomplete input,
		.imogi-ts-dialog textarea {
			background: #fff !important;
			border: 1px solid #d4d4d8 !important;
			border-radius: 10px !important;
			box-shadow: none !important;
			color: #0f172a !important;
			font-size: 14px !important;
			min-height: 42px;
			padding: 10px 12px !important;
		}
		.imogi-ts-dialog textarea { min-height: 88px; resize: vertical; }
		.imogi-ts-dialog .form-control:focus,
		.imogi-ts-dialog textarea:focus {
			border-color: #0f1f35 !important;
			box-shadow: 0 0 0 3px rgba(15, 31, 53, 0.1) !important;
		}
		.imogi-ts-dialog .modal-footer {
			background: #fff;
			border-top: 1px solid #e4e4e7;
			display: flex;
			gap: 10px;
			justify-content: flex-end;
			padding: 14px 20px 16px;
		}
		.imogi-ts-dialog .modal-footer .btn-modal-secondary,
		.imogi-ts-dialog .modal-footer .btn-secondary {
			background: #fff !important;
			border: 1px solid #d4d4d8 !important;
			border-radius: 10px !important;
			color: #334155 !important;
			font-weight: 700 !important;
			min-width: 96px;
			padding: 10px 16px !important;
		}
		.imogi-ts-dialog .modal-footer .btn-primary {
			background: #0f1f35 !important;
			border: none !important;
			border-radius: 10px !important;
			box-shadow: none !important;
			color: #fff !important;
			font-weight: 800 !important;
			min-width: 120px;
			padding: 10px 18px !important;
		}
		.imogi-ts-dialog .modal-footer .btn-primary:hover { background: #1a3352 !important; }
		.imogi-ts-dialog__table-grid {
			display: grid;
			gap: 8px;
			grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
			margin-bottom: 6px;
			max-height: 180px;
			overflow: auto;
			padding: 2px;
		}
		.imogi-ts-dialog__table-chip {
			background: #fff;
			border: 1px solid #e2e8f0;
			border-radius: 12px;
			padding: 10px 12px;
		}
		.imogi-ts-dialog__table-chip strong {
			color: #0f172a;
			display: block;
			font-size: 15px;
		}
		.imogi-ts-dialog__table-chip span {
			color: #64748b;
			display: block;
			font-size: 11px;
			margin-top: 2px;
		}
		.imogi-ts-dialog__table-chip.is-occupied { background: #fff7ed; border-color: #fdba74; }
		.imogi-ts-dialog__table-chip.is-reserved { background: #eff6ff; border-color: #93c5fd; }
		.imogi-ts-dialog__empty-note {
			background: #fff;
			border: 1px dashed #cbd5e1;
			border-radius: 12px;
			color: #64748b;
			font-size: 13px;
			margin-bottom: 8px;
			padding: 16px;
			text-align: center;
		}
		.imogi-ts-panel-head .btn-primary,
		.imogi-ts-table-actions .btn-primary,
		.imogi-ts-list-actions .btn-primary {
			background: #0f1f35 !important;
			border-color: #0f1f35 !important;
			color: #fff !important;
		}
		.imogi-ts-act--qr {
			background: #f8fafc !important;
			border-color: #cbd5e1 !important;
			color: #334155 !important;
		}
		.imogi-ts-list-item {
			background: #fff;
			border: 1px solid #e2e8f0;
			border-radius: 14px;
			box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
			padding: 14px;
		}
		.imogi-ts-list-item--reservation { border-left: 4px solid #fb923c; }
		.imogi-ts-list-item--waiting { border-left: 4px solid #3b82f6; }
		.imogi-ts-list-head strong { color: #0f172a; font-size: 14px; }
		.imogi-ts-list-badge {
			background: #f1f5f9;
			border: 1px solid #e2e8f0;
			color: #334155;
		}
		.imogi-ts-list-badge--reserved { background: #fff7ed; border-color: #fed7aa; color: #9a3412; }
		.imogi-ts-list-badge--waiting { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
		.imogi-ts-list-empty {
			background: #f8fafc;
			border: 1px dashed #cbd5e1;
			border-radius: 14px;
			color: #64748b;
			font-size: 13px;
			margin: 12px;
			min-height: 160px;
		}
		`,
		IMOGI_TS_MODAL_STYLE_ID
	);
}

function imogi_ts_decorate_dialog(dialog, { title, subtitle, icon, wide = false }) {
	imogi_ts_ensure_modal_css();
	dialog.$wrapper.addClass("imogi-ts-dialog");
	if (wide) {
		dialog.$wrapper.addClass("imogi-ts-dialog--wide");
	}
	const $header = dialog.$wrapper.find(".modal-header");
	$header.html(`
		<div class="imogi-ts-dialog__icon"><i class="fa ${frappe.utils.escape_html(icon || "fa-pencil")}"></i></div>
		<div class="imogi-ts-dialog__title-wrap">
			<div class="imogi-ts-dialog__title">${frappe.utils.escape_html(title || "")}</div>
			${subtitle ? `<div class="imogi-ts-dialog__sub">${frappe.utils.escape_html(subtitle)}</div>` : ""}
		</div>
		<button type="button" class="close" data-dismiss="modal" aria-label="${__("Close")}">
			<span aria-hidden="true">&times;</span>
		</button>
	`);
	$header.find(".close").on("click", () => dialog.hide());
}

function imogi_ts_open_form_dialog({ title, subtitle, icon, fields, primary_label, wide, on_submit }) {
	const dialog = new frappe.ui.Dialog({
		title: title || "",
		fields: fields || [],
		primary_action_label: primary_label || __("Simpan"),
		primary_action(values) {
			const keep_open = on_submit?.(values, dialog) === false;
			if (!keep_open) {
				dialog.hide();
			}
		},
	});
	imogi_ts_decorate_dialog(dialog, { title, subtitle, icon, wide });
	dialog.show();
	return dialog;
}

/** Confirm that works on top of imogi-ts-dialog (hides parent to avoid z-index trap). */
function imogi_ts_confirm(message, on_yes, { parent_dialog, on_no } = {}) {
	if (parent_dialog) {
		parent_dialog.hide();
	}
	const restore_parent = () => {
		if (parent_dialog?.$wrapper?.length) {
			parent_dialog.show();
		}
	};
	frappe.confirm(
		message,
		() => on_yes?.(),
		() => {
			on_no?.();
			restore_parent();
		}
	);
}

function imogi_ts_table_area_label(table) {
	return (table?.area_name || table?.location || "").trim() || __("Tanpa ruangan");
}

function imogi_ts_area_display_name(area) {
	const short = (area?.area_name || "").trim();
	if (short) return short;
	const doc = (area?.name || "").trim();
	if (doc.includes("/")) return doc.split("/").pop().trim();
	return doc || __("Tanpa ruangan");
}

function imogi_ts_areas_for_floor(areas, floor_name) {
	if (!floor_name) return areas || [];
	return (areas || []).filter((area) => area.restaurant_floor === floor_name);
}

function imogi_ts_build_area_select_options(areas, selected) {
	return (areas || [])
		.map((area) => {
			const sel = selected === area.name ? "selected" : "";
			return `<option value="${frappe.utils.escape_html(area.name)}" ${sel}>${frappe.utils.escape_html(
				area.area_name
			)}</option>`;
		})
		.join("");
}

function imogi_ts_build_manage_tables_html(tables, areas) {
	if (!tables.length) {
		return `<div class="imogi-ts-dialog__empty-note">${__("Belum ada meja. Tambahkan meja pertama di bawah.")}</div>`;
	}
	const shape_options = (current) =>
		["Square", "Round", "Bar"]
			.map(
				(s) =>
					`<option value="${s}" ${(current || "Square") === s ? "selected" : ""}>${__(s)}</option>`
			)
			.join("");
	const rows = tables
		.map((table) => {
			const in_use = table.status === "Occupied" || !!table.open_order;
			const status_label = IMOGI_TS_STATUS_LABEL[table.status] || table.status || "Available";
			return `
				<div class="imogi-ts-manage-row ${in_use ? "is-occupied" : ""}" data-name="${frappe.utils.escape_html(table.name)}">
					<div class="imogi-ts-manage-num">${frappe.utils.escape_html(table.table_number || table.name)}
						<div class="imogi-ts-manage-status">${frappe.utils.escape_html(status_label)}</div>
					</div>
					<input type="number" min="1" class="imogi-ts-manage-cap" value="${table.capacity || 4}" />
					<select class="imogi-ts-manage-area">${imogi_ts_build_area_select_options(
						areas,
						table.restaurant_area
					)}</select>
					<select class="imogi-ts-manage-shape">${shape_options(table.shape)}</select>
					<button type="button" class="imogi-ts-manage-btn-save">${__("Simpan")}</button>
					<button type="button" class="imogi-ts-manage-btn-del" ${in_use ? "disabled title='" + __("Meja sedang dipakai") + "'" : ""}>${__("Hapus")}</button>
				</div>`;
		})
		.join("");
	return `
		<div class="imogi-ts-manage-head" style="display:grid;grid-template-columns:1fr 0.7fr 1fr 0.8fr auto auto;gap:8px;padding:0 10px 6px;">
			<span>${__("Meja")}</span><span>${__("Kapasitas")}</span><span>${__("Ruangan")}</span><span>${__("Bentuk")}</span><span></span><span></span>
		</div>
		<div class="imogi-ts-manage-list">${rows}</div>`;
}

function imogi_ts_table_select_options(tables) {
	return ["", ...(tables || []).map((t) => t.name)];
}

function imogi_ts_default_reservation_datetime() {
	return moment().add(1, "hour").format("YYYY-MM-DD HH:mm:ss");
}

function imogi_ts_apply_fullscreen(enable) {
	const dedicated = imogi_ts_is_dedicated_waiter();
	document.body.classList.toggle("imogi-table-service-active", enable);
	document.body.classList.toggle("imogi-pos-cashier-fullscreen", enable);
	document.body.classList.toggle("imogi-table-service-fullscreen", enable);
	document.documentElement.classList.toggle("imogi-pos-waiter-dedicated", enable && dedicated);
	if (enable) {
		document.querySelectorAll(".page-head, .sticky-top").forEach((el) => {
			el.style.setProperty("display", "none", "important");
		});
		imogi_ts_apply_layout_fix();
	} else {
		document.querySelectorAll(".page-head, .sticky-top").forEach((el) => {
			el.style.removeProperty("display");
		});
		imogi_ts_clear_layout_fix();
	}
	imogi_pos.sync_desk_theme?.();
	imogi_pos.paint_table_service_canvas?.();
	imogi_ts_paint_desk_topbar();
}

function imogi_ts_apply_layout_fix() {
	imogi_ts_ensure_fullwidth_css();
	const page = document.querySelector(".imogi-table-service-page");
	const wrapper = page?.closest(".layout-main-section-wrapper");
	const chain = [
		document.querySelector(".content.page-container"),
		document.querySelector(".page-container"),
		document.querySelector(".main-section"),
		document.querySelector(".container.page-body"),
		document.querySelector(".page-wrapper"),
		document.querySelector(".page-content"),
		document.querySelector(".row.layout-main"),
		wrapper?.closest("[class*='col-']"),
		document.querySelector(".layout-main"),
		wrapper,
		page,
		page?.querySelector(".page-body"),
		document.querySelector(".imogi-ts-shell"),
		document.querySelector(".imogi-ts-topbar--desk"),
	].filter(Boolean);

	chain.forEach((el, idx) => {
		el.style.setProperty("margin-top", "0", "important");
		el.style.setProperty("margin-left", "0", "important");
		el.style.setProperty("margin-right", "0", "important");
		el.style.setProperty("max-width", "100%", "important");
		el.style.setProperty("width", "100%", "important");
		el.style.setProperty("box-sizing", "border-box", "important");
		el.style.setProperty("padding-left", "0", "important");
		el.style.setProperty("padding-right", "0", "important");
		if (idx <= 9) {
			el.style.setProperty("display", "flex", "important");
			el.style.setProperty("flex-direction", "column", "important");
			el.style.setProperty("height", "100dvh", "important");
			el.style.setProperty("max-height", "100dvh", "important");
			el.style.setProperty("min-height", "0", "important");
			el.style.setProperty("overflow", "hidden", "important");
			el.style.setProperty("padding-top", "0", "important");
			el.style.setProperty("padding-bottom", "0", "important");
		} else if (el.classList?.contains("imogi-ts-topbar--desk")) {
			el.style.setProperty("flex-shrink", "0", "important");
			el.style.setProperty("padding-left", "14px", "important");
			el.style.setProperty("padding-right", "14px", "important");
			el.style.setProperty("padding-top", "10px", "important");
			el.style.setProperty("padding-bottom", "10px", "important");
			el.style.removeProperty("height");
			el.style.removeProperty("max-height");
		} else {
			el.style.setProperty("display", "flex", "important");
			el.style.setProperty("flex-direction", "column", "important");
			el.style.setProperty("flex", "1", "important");
			el.style.setProperty("min-height", "0", "important");
			el.style.setProperty("overflow", "hidden", "important");
			el.style.setProperty("padding", "0", "important");
			el.style.removeProperty("height");
			el.style.removeProperty("max-height");
		}
	});
}

function imogi_ts_clear_layout_fix() {
	document
		.querySelectorAll(
			".content.page-container, .page-container, .main-section, .container.page-body, .page-wrapper, .page-content, .row.layout-main, .layout-main, .layout-main-section-wrapper, .imogi-table-service-page, .imogi-table-service-page .page-body, .imogi-ts-shell, .imogi-ts-topbar--desk"
		)
		.forEach((el) => {
			[
				"margin-top",
				"margin-left",
				"margin-right",
				"padding-left",
				"padding-right",
				"padding-top",
				"padding-bottom",
				"flex-shrink",
				"max-width",
				"width",
				"box-sizing",
				"display",
				"flex-direction",
				"height",
				"max-height",
				"min-height",
				"overflow",
				"padding",
				"flex",
			].forEach((prop) => el.style.removeProperty(prop));
		});
}

frappe.pages["table-service"].on_page_load = function (wrapper) {
	imogi_ts_ensure_desk_topbar_css();
	imogi_ts_ensure_fullwidth_css();

	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Table Service"),
		single_column: true,
	});
	page.main.addClass("imogi-table-service-page");
	$(wrapper).find(".page-head").hide();
	$(wrapper).find(".layout-main-section-wrapper").css("max-width", "100%");

	wrapper.table_service_page = new imogi_pos.TableService(page, wrapper);
	imogi_ts_apply_fullscreen(true);
	imogi_pos.activate_table_service_shell?.(wrapper);
};

frappe.pages["table-service"].on_page_show = function (wrapper) {
	imogi_ts_apply_fullscreen(true);
	imogi_pos.activate_table_service_shell?.(wrapper);
	wrapper.table_service_page?.sync_shell?.();
};

frappe.pages["table-service"].on_page_hide = function () {
	imogi_ts_apply_fullscreen(false);
};

const IMOGI_TS_ENHANCE_STYLE_ID = "imogi-ts-enhance-css-v6";

function imogi_ts_ensure_enhance_css() {
	document.getElementById("imogi-ts-enhance-css-v4")?.remove();
	document.getElementById("imogi-ts-enhance-css-v5")?.remove();
	if (document.getElementById(IMOGI_TS_ENHANCE_STYLE_ID)) return;
	frappe.dom.set_style(
		`
		.imogi-ts-shell--v2 .imogi-ts-kpi-strip { grid-template-columns: repeat(5, minmax(0, 1fr)); }
		@media (max-width: 1100px) { .imogi-ts-shell--v2 .imogi-ts-kpi-strip { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
		@media (max-width: 640px) { .imogi-ts-shell--v2 .imogi-ts-kpi-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
		.imogi-ts-kpi--reserved .imogi-ts-kpi__icon { background: linear-gradient(135deg, #1d4ed8, #2563eb); }
		.imogi-ts-refresh-meta { color: var(--ts-muted, #6b7a90); font-size: 11px; font-weight: 600; margin-left: 8px; white-space: nowrap; }
		.imogi-ts-shell--v2 .imogi-ts-table-grid.is-grouped { display: block; overflow: auto; }
		.imogi-ts-zone-group { margin-bottom: 18px; }
		.imogi-ts-zone-group:last-child { margin-bottom: 0; }
		.imogi-ts-zone-group-head { align-items: center; color: var(--ts-text, #1a2332); display: flex; font-size: 13px; font-weight: 800; gap: 8px; letter-spacing: .02em; margin: 0 0 10px; text-transform: uppercase; }
		.imogi-ts-zone-group-head .imogi-ts-zone-group-count { background: #eef2f7; border-radius: 999px; color: #475569; font-size: 11px; font-weight: 700; padding: 2px 9px; }
		.imogi-ts-zone-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
		@media (min-width: 1400px) { .imogi-ts-zone-grid { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); } }
		.imogi-ts-table-substatus { align-items: center; color: var(--ts-muted, #6b7a90); display: flex; flex-wrap: wrap; font-size: 11px; font-weight: 700; gap: 6px; margin-top: 4px; }
		.imogi-ts-elapsed { align-items: center; display: inline-flex; gap: 4px; }
		.imogi-ts-elapsed.is-warn { color: #b45309; }
		.imogi-ts-elapsed.is-late { color: #b91c1c; }
		.imogi-ts-chip-mini { align-items: center; border-radius: 999px; display: inline-flex; font-size: 10px; font-weight: 800; gap: 4px; letter-spacing: .02em; padding: 2px 8px; text-transform: uppercase; }
		.imogi-ts-chip-mini--ordered { background: #e0e7ff; color: #3730a3; }
		.imogi-ts-chip-mini--awaiting { background: #fef3c7; color: #92400e; }
		.imogi-ts-chip-mini--paid { background: #dcfce7; color: #166534; }
		.imogi-ts-chip-mini--kpending { background: #ffedd5; color: #9a3412; }
		.imogi-ts-chip-mini--kdone { background: #d1fae5; color: #065f46; }
		.imogi-ts-manage-row { align-items: center; border: 1px solid #e4e8ee; border-radius: 10px; display: grid; gap: 8px; grid-template-columns: 1fr 0.7fr 1fr 0.8fr auto auto; margin-bottom: 8px; padding: 8px 10px; }
		.imogi-ts-manage-row select { border: 1px solid #d4d4d8; border-radius: 7px; font-size: 12px; padding: 5px 8px; width: 100%; }
		.imogi-ts-manage-row.is-occupied { background: #fff7ed; border-color: #fed7aa; }
		.imogi-ts-manage-row input { border: 1px solid #d4d4d8; border-radius: 7px; font-size: 12px; padding: 5px 8px; width: 100%; }
		.imogi-ts-manage-row .imogi-ts-manage-num { font-weight: 800; }
		.imogi-ts-manage-row .imogi-ts-manage-status { color: #64748b; font-size: 11px; font-weight: 700; }
		.imogi-ts-manage-btn-save { background: #16a34a; border: none; border-radius: 7px; color: #fff; cursor: pointer; font-size: 11px; font-weight: 700; padding: 6px 10px; }
		.imogi-ts-manage-btn-del { background: #fee2e2; border: none; border-radius: 7px; color: #b91c1c; cursor: pointer; font-size: 11px; font-weight: 700; padding: 6px 10px; }
		.imogi-ts-manage-btn-del[disabled] { cursor: not-allowed; opacity: .45; }
		.imogi-ts-manage-head { color: #64748b; font-size: 10px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
		.imogi-ts-order-modal-grid { display: grid; gap: 10px; grid-template-columns: repeat(2, 1fr); }
		.imogi-ts-order-modal-cell { background: #f8fafc; border: 1px solid #e4e8ee; border-radius: 10px; padding: 10px 12px; }
		.imogi-ts-order-modal-cell label { color: #64748b; display: block; font-size: 10px; font-weight: 800; letter-spacing: .04em; margin-bottom: 3px; text-transform: uppercase; }
		.imogi-ts-order-modal-cell .val { color: #1a2332; font-size: 14px; font-weight: 700; }
		.imogi-ts-view-toggle { display: inline-flex; background: #fff; border: 1px solid var(--ts-border, #e4e8ee); border-radius: 8px; overflow: hidden; }
		.imogi-ts-view-toggle button { background: transparent; border: none; color: var(--ts-muted, #6b7a90); cursor: pointer; font-size: 12px; font-weight: 700; padding: 6px 12px; }
		.imogi-ts-view-toggle button.is-active { background: var(--ts-accent, #714b67); color: #fff; }
		.imogi-ts-table-grid.is-floor { display: block; overflow: visible; }
		.imogi-ts-floor-canvas { background-color: #f1f5f9; background-position: center; background-repeat: no-repeat; background-size: cover; border: 1px solid var(--ts-border, #e4e8ee); border-radius: 14px; min-height: 540px; overflow: hidden; position: relative; width: 100%; }
		.imogi-ts-floor-canvas::before { background-image: linear-gradient(rgba(148,163,184,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.16) 1px, transparent 1px); background-size: 40px 40px; content: ""; inset: 0; pointer-events: none; position: absolute; }
		.imogi-ts-floor-canvas.has-bg::before { background-image: none; }
		.imogi-ts-floor-canvas.is-editing { box-shadow: inset 0 0 0 2px #c7d2fe; cursor: crosshair; touch-action: none; }
		.imogi-ts-floor-canvas.is-editing .imogi-ts-chair { pointer-events: none; }
		.imogi-ts-floor-node.is-dragging { cursor: grabbing !important; transition: none !important; z-index: 30 !important; }
		.imogi-ts-floor-empty { color: #94a3b8; left: 50%; position: absolute; text-align: center; top: 50%; transform: translate(-50%, -50%); z-index: 2; }
		.imogi-ts-floor-empty i { display: block; font-size: 30px; margin-bottom: 8px; }
		.imogi-ts-floor-node { align-items: center; background: #fff; border: 2px solid #cbd5e1; border-radius: 16px; box-shadow: 0 2px 10px rgba(15,23,42,.12); display: flex; flex-direction: column; gap: 3px; height: 118px; justify-content: center; padding: 8px; position: absolute; transform: translate(-50%, -50%); transition: box-shadow .15s, transform .1s; user-select: none; width: 118px; z-index: 3; }
		.imogi-ts-floor-node.shape-round { border-radius: 50%; }
		.imogi-ts-floor-node.shape-bar { border-radius: 12px; height: 76px; width: 168px; }
		.imogi-ts-floor-node:hover { box-shadow: 0 6px 20px rgba(15,23,42,.2); z-index: 6; }
		.imogi-ts-floor-node.is-available { border-color: #16a34a; }
		.imogi-ts-floor-node.is-occupied { border-color: #ea580c; background: #fff7ed; }
		.imogi-ts-floor-node.is-reserved { border-color: #2563eb; background: #eff6ff; }
		.imogi-ts-floor-node .imogi-ts-fn-num { color: #1a2332; font-size: 19px; font-weight: 800; line-height: 1; }
		.imogi-ts-floor-node .imogi-ts-fn-cap { color: #64748b; font-size: 10px; font-weight: 700; }
		.imogi-ts-floor-node .imogi-ts-fn-zone { background: #eef2f7; border-radius: 999px; color: #64748b; font-size: 9px; font-weight: 800; letter-spacing: .03em; margin-top: 1px; max-width: 92px; overflow: hidden; padding: 1px 7px; text-overflow: ellipsis; text-transform: uppercase; white-space: nowrap; }
		.imogi-ts-floor-node .imogi-ts-fn-info { color: #9a3412; font-size: 10px; font-weight: 800; line-height: 1.15; text-align: center; }
		.imogi-ts-floor-node .imogi-ts-fn-dot { border-radius: 999px; height: 8px; position: absolute; right: 9px; top: 9px; width: 8px; z-index: 2; }
		.imogi-ts-floor-node.is-available .imogi-ts-fn-dot { background: #16a34a; }
		.imogi-ts-floor-node.is-occupied .imogi-ts-fn-dot { background: #ea580c; }
		.imogi-ts-floor-node.is-reserved .imogi-ts-fn-dot { background: #2563eb; }
		.imogi-ts-chair { background: #cbd5e1; border-radius: 3px; height: 9px; position: absolute; width: 16px; }
		.imogi-ts-chair.is-v { height: 16px; width: 9px; }
		.imogi-ts-floor-node.is-occupied .imogi-ts-chair { background: #fdba74; }
		.imogi-ts-floor-node.is-reserved .imogi-ts-chair { background: #93c5fd; }
		.imogi-ts-floor-node.is-available .imogi-ts-chair { background: #86efac; }
		.imogi-ts-floor-canvas.is-editing .imogi-ts-floor-node { cursor: grab; }
		.imogi-ts-floor-canvas.is-editing .imogi-ts-floor-node.is-dragging { cursor: grabbing; opacity: .85; z-index: 20; box-shadow: 0 10px 28px rgba(15,23,42,.28); }
		.imogi-ts-arrange-btn.is-active,
		.imogi-ts-arrange-menu-item.is-active { background: var(--ts-accent, #714b67) !important; border-color: var(--ts-accent, #714b67) !important; color: #fff !important; }
		.imogi-ts-floor-hint { align-items: center; background: #eef2ff; border: 1px dashed #c7d2fe; border-radius: 8px; color: #4338ca; display: flex; font-size: 12px; font-weight: 600; gap: 6px; margin-bottom: 10px; padding: 8px 12px; }
		.imogi-ts-filter-bar { align-items: flex-end; display: flex; flex-wrap: wrap; gap: 12px 18px; justify-content: space-between; margin-bottom: 10px; }
		.imogi-ts-filter-groups { display: flex; flex: 1; flex-wrap: wrap; gap: 10px 16px; min-width: 0; }
		.imogi-ts-filter-group { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
		.imogi-ts-filter-label { color: #64748b; font-size: 10px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
		.imogi-ts-filter-group .imogi-ts-floor-nav,
		.imogi-ts-filter-group .imogi-ts-zone-filter { margin: 0; }
		.imogi-ts-context-meta { align-items: center; color: #64748b; display: flex; flex-wrap: wrap; font-size: 11px; font-weight: 600; gap: 8px; margin-left: auto; }
		.imogi-ts-context-meta i { color: #94a3b8; }
		.imogi-ts-toolbar-actions { align-items: center; display: flex; flex-wrap: wrap; gap: 8px; }
		.imogi-ts-manage-dropdown { position: relative; }
		.imogi-ts-manage-menu { background: #fff; border: 1px solid #e4e8ee; border-radius: 10px; box-shadow: 0 10px 28px rgba(15,23,42,.14); display: none; min-width: 210px; padding: 6px; position: absolute; right: 0; top: calc(100% + 6px); z-index: 50; }
		.imogi-ts-manage-dropdown.is-open .imogi-ts-manage-menu { display: block; }
		.imogi-ts-manage-menu button { background: transparent; border: none; border-radius: 8px; color: #1e293b; cursor: pointer; display: block; font-size: 12px; font-weight: 600; padding: 8px 10px; text-align: left; width: 100%; }
		.imogi-ts-manage-menu button:hover { background: #f1f5f9; }
		.imogi-ts-manage-menu button i { color: #64748b; margin-right: 8px; width: 14px; }
		.imogi-ts-manage-menu button.is-active { background: #eef2ff; color: #4338ca; }
		.imogi-ts-manage-menu button.is-active i { color: #4338ca; }
		.imogi-ts-manage-menu .imogi-ts-menu-divider { border-top: 1px solid #e4e8ee; margin: 4px 0; }
		.imogi-ts-floor-canvas { min-height: clamp(460px, 62vh, 880px); box-shadow: inset 0 1px 0 rgba(255,255,255,.6), 0 1px 3px rgba(15,23,42,.06); }
		.imogi-ts-floor-bg-hint { background: rgba(255,255,255,.88); border: 1px dashed #cbd5e1; border-radius: 10px; bottom: 14px; color: #64748b; font-size: 11px; font-weight: 600; left: 14px; max-width: 320px; padding: 8px 12px; position: absolute; z-index: 4; }
		.imogi-ts-floor-bg-hint a { color: #4338ca; cursor: pointer; font-weight: 700; }
		.imogi-ts-floor-sub.is-context { color: #475569; font-weight: 600; }
		.imogi-ts-floor-nav.is-select-mode,
		.imogi-ts-zone-filter.is-select-mode { min-width: min(100%, 280px); }
		.imogi-ts-filter-select {
			appearance: none;
			background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M2 4l4 4 4-4'/%3E%3C/svg%3E") no-repeat right 10px center;
			border: 1px solid #cbd5e1;
			border-radius: 8px;
			color: #1e293b;
			cursor: pointer;
			font-size: 12px;
			font-weight: 600;
			max-width: 100%;
			min-width: 200px;
			padding: 7px 30px 7px 11px;
			width: 100%;
		}
		.imogi-ts-filter-select:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,.15); outline: none; }
		.imogi-ts-guided-empty {
			background: rgba(255,255,255,.94);
			border: 1px dashed #cbd5e1;
			border-radius: 14px;
			box-shadow: 0 8px 24px rgba(15,23,42,.08);
			box-sizing: border-box;
			display: block;
			flex: none;
			margin: 0 auto;
			max-width: 420px;
			padding: 22px 20px;
			text-align: center;
			width: min(420px, calc(100% - 32px));
			z-index: 5;
		}
		.imogi-ts-floor-empty.imogi-ts-guided-empty { left: 50%; position: absolute; top: 50%; transform: translate(-50%, -50%); }
		.imogi-ts-shell--v2 .imogi-ts-table-grid.is-empty-state {
			align-content: center;
			display: flex;
			flex-direction: column;
			justify-content: center;
			min-height: min(540px, 52vh);
			padding: 16px;
		}
		.imogi-ts-shell--v2 .imogi-ts-table-grid.is-empty-state > .imogi-ts-guided-empty {
			margin: 0 auto;
		}
		.imogi-ts-guided-empty__icon { align-items: center; background: #eef2ff; border-radius: 999px; color: #4338ca; display: inline-flex; font-size: 22px; height: 52px; justify-content: center; margin-bottom: 12px; width: 52px; }
		.imogi-ts-guided-empty__title { color: #1e293b; font-size: 16px; font-weight: 800; line-height: 1.3; margin: 0 0 8px; }
		.imogi-ts-guided-empty__text { color: #64748b; font-size: 12px; font-weight: 500; line-height: 1.5; margin: 0 0 14px; }
		.imogi-ts-guided-empty__steps { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-bottom: 14px; }
		.imogi-ts-guided-empty__step { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 999px; color: #94a3b8; font-size: 10px; font-weight: 700; padding: 4px 10px; }
		.imogi-ts-guided-empty__step.is-done { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
		.imogi-ts-guided-empty__step.is-active { background: #eef2ff; border-color: #c7d2fe; color: #4338ca; }
		.imogi-ts-guided-empty__actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
		.imogi-ts-guided-empty__actions .btn { border-radius: 8px !important; font-size: 12px !important; font-weight: 700 !important; }
		`,
		IMOGI_TS_ENHANCE_STYLE_ID
	);
}

const IMOGI_TS_ORDER_STATUS_CHIP = {
	"Awaiting Payment": { cls: "awaiting", label: __("Belum Bayar") },
	Draft: { cls: "ordered", label: __("Draft") },
	Paid: { cls: "paid", label: __("Sudah Bayar") },
	"In Progress": { cls: "ordered", label: __("Diproses") },
};

function imogi_ts_format_elapsed(since_iso) {
	if (!since_iso) return null;
	const start = moment(since_iso);
	if (!start.isValid()) return null;
	const mins = Math.max(0, Math.floor(moment().diff(start, "minutes")));
	let level = "";
	if (mins >= 90) level = "is-late";
	else if (mins >= 45) level = "is-warn";
	let text;
	if (mins < 60) {
		text = `${mins}m`;
	} else {
		const h = Math.floor(mins / 60);
		const m = mins % 60;
		text = m ? `${h}j ${m}m` : `${h}j`;
	}
	return { text, level };
}

imogi_pos.TableService = class TableService {
	constructor(page, wrapper) {
		this.page = page;
		this.wrapper = $(page.body);
		this.$page_wrapper = wrapper ? $(wrapper) : this.wrapper.closest(".page-container");
		this.dedicated_waiter = imogi_ts_is_dedicated_waiter();
		this.board = { tables: [], floors: [], areas: [], reservations: [], waiting: [], features: {} };
		this.refresh_interval = 30;
		this.active_zone = __("Semua");
		this.active_floor = null;
		imogi_ts_ensure_v2_css();
		imogi_ts_ensure_enhance_css();
		this.last_refreshed = null;
		this.arrange_mode = false;
		this.view_mode = "floor";
		try {
			const saved = localStorage.getItem("_imogi_ts_view_mode");
			if (saved === "list" || saved === "floor") this.view_mode = saved;
		} catch (e) {
			/* ignore */
		}
		this.make();
		this.refresh();
		this._bind_focus_refresh();
		this._start_meta_ticker();
	}

	_is_active() {
		return document.body.classList.contains("imogi-table-service-active");
	}

	_bind_focus_refresh() {
		this._on_visible = () => {
			if (document.visibilityState === "visible" && this._is_active()) this.refresh();
		};
		document.addEventListener("visibilitychange", this._on_visible);
		this._on_focus = () => {
			if (this._is_active()) this.refresh();
		};
		window.addEventListener("focus", this._on_focus);
	}

	_start_meta_ticker() {
		if (this._meta_timer) clearInterval(this._meta_timer);
		this._meta_timer = setInterval(() => this._render_refresh_meta(), 5000);
	}

	_render_refresh_meta() {
		const $meta = this.wrapper.find(".imogi-ts-refresh-meta");
		if (!$meta.length || !this.last_refreshed) return;
		const secs = Math.max(0, Math.floor((Date.now() - this.last_refreshed) / 1000));
		let text;
		if (secs < 10) text = __("baru saja");
		else if (secs < 60) text = __("{0} dtk lalu", [secs]);
		else text = __("{0} mnt lalu", [Math.floor(secs / 60)]);
		$meta.text(`· ${text}`);
	}

	sync_shell() {
		imogi_ts_apply_fullscreen(true);
		imogi_pos.activate_table_service_shell?.(this.$page_wrapper?.[0]);
	}

	make() {
		const logo_url =
			frappe.boot?.imogi_pos_logo_white_url || "/assets/imogi_pos/images/imogi-pos-logo-white.png";
		const logout_btn = this.dedicated_waiter
			? `<button type="button" class="btn btn-xs btn-default imogi-ts-logout-btn">
					<i class="fa fa-sign-out"></i> ${__("Logout")}
				</button>`
			: "";
		const topbar = `
				<div class="imogi-ts-topbar imogi-ts-topbar--desk">
					<div class="imogi-ts-topbar-left">
						<div class="imogi-ts-desk-brand">
							<img class="imogi-ts-desk-logo" src="${frappe.utils.escape_html(logo_url)}" alt="IMOGI" />
							<div class="imogi-ts-desk-brand-title">${__("Table Service")}</div>
						</div>
					</div>
					<div class="imogi-ts-topbar-right">
						<button type="button" class="btn btn-xs btn-default imogi-ts-refresh">
							<i class="fa fa-refresh"></i>
							<span class="imogi-ts-refresh-label">${__("Refresh")} 30s</span>
						</button>
						<span class="imogi-ts-refresh-meta"></span>
						${logout_btn}
					</div>
				</div>`;

		this.wrapper.html(`
			<div class="imogi-ts-shell imogi-ts-shell--v2 imogi-ts-shell--desk">
				${topbar}
				<div class="imogi-ts-kpi-strip">
					<div class="imogi-ts-kpi imogi-ts-kpi--total">
						<div class="imogi-ts-kpi__icon"><i class="fa fa-th"></i></div>
						<div>
							<div class="imogi-ts-kpi__val imogi-ts-kpi-total">0</div>
							<div class="imogi-ts-kpi__label">${__("Total Meja")}</div>
						</div>
					</div>
					<div class="imogi-ts-kpi imogi-ts-kpi--available">
						<div class="imogi-ts-kpi__icon"><i class="fa fa-check-circle"></i></div>
						<div>
							<div class="imogi-ts-kpi__val imogi-ts-kpi-available">0</div>
							<div class="imogi-ts-kpi__label">${__("Kosong")}</div>
						</div>
					</div>
					<div class="imogi-ts-kpi imogi-ts-kpi--occupied">
						<div class="imogi-ts-kpi__icon"><i class="fa fa-cutlery"></i></div>
						<div>
							<div class="imogi-ts-kpi__val imogi-ts-kpi-occupied">0</div>
							<div class="imogi-ts-kpi__label">${__("Terisi")}</div>
						</div>
					</div>
					<div class="imogi-ts-kpi imogi-ts-kpi--reserved">
						<div class="imogi-ts-kpi__icon"><i class="fa fa-calendar-check-o"></i></div>
						<div>
							<div class="imogi-ts-kpi__val imogi-ts-kpi-reserved">0</div>
							<div class="imogi-ts-kpi__label">${__("Dipesan")}</div>
						</div>
					</div>
					<div class="imogi-ts-kpi imogi-ts-kpi--waiting">
						<div class="imogi-ts-kpi__icon"><i class="fa fa-clock-o"></i></div>
						<div>
							<div class="imogi-ts-kpi__val imogi-ts-kpi-waiting">0</div>
							<div class="imogi-ts-kpi__label">${__("Antrian")}</div>
						</div>
					</div>
				</div>
				<div class="imogi-ts-layout imogi-ts-layout--v2">
					<main class="imogi-ts-floor">
						<div class="imogi-ts-floor-head">
							<div>
								<h2 class="imogi-ts-floor-title">${__("Denah Meja")}</h2>
								<p class="imogi-ts-floor-sub imogi-ts-floor-context">${__("Pilih lantai dan ruangan")}</p>
							</div>
							<div class="imogi-ts-floor-toolbar">
								<div class="imogi-ts-legend">
									<span class="imogi-ts-legend-item"><span class="imogi-ts-legend-dot imogi-ts-legend-dot--available"></span>${__("Kosong")}</span>
									<span class="imogi-ts-legend-item"><span class="imogi-ts-legend-dot imogi-ts-legend-dot--occupied"></span>${__("Terisi")}</span>
									<span class="imogi-ts-legend-item"><span class="imogi-ts-legend-dot imogi-ts-legend-dot--reserved"></span>${__("Dipesan")}</span>
								</div>
								<div class="imogi-ts-toolbar-actions">
									<div class="imogi-ts-view-toggle">
										<button type="button" data-view="floor">${__("Denah")}</button>
										<button type="button" data-view="list">${__("Daftar")}</button>
									</div>
									<div class="imogi-ts-manage-dropdown">
										<button type="button" class="btn btn-xs btn-default imogi-ts-manage-btn imogi-ts-manage-menu-btn">
											<i class="fa fa-sliders"></i> ${__("Kelola")} <i class="fa fa-caret-down"></i>
										</button>
										<div class="imogi-ts-manage-menu">
											<button type="button" data-action="tables"><i class="fa fa-th-large"></i>${__("Kelola Meja")}</button>
											<button type="button" data-action="spaces"><i class="fa fa-building"></i>${__("Lantai & Ruangan")}</button>
											<div class="imogi-ts-menu-divider imogi-ts-menu-floor-only"></div>
											<button type="button" data-action="floor-settings" class="imogi-ts-menu-floor-only"><i class="fa fa-picture-o"></i>${__("Pengaturan Denah")}</button>
											<button type="button" data-action="arrange" class="imogi-ts-menu-floor-only imogi-ts-arrange-menu-item"><i class="fa fa-arrows"></i>${__("Atur Denah")}</button>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div class="imogi-ts-filter-bar">
							<div class="imogi-ts-filter-groups">
								<div class="imogi-ts-filter-group">
									<span class="imogi-ts-filter-label">${__("Lantai")}</span>
									<div class="imogi-ts-floor-nav"></div>
								</div>
								<div class="imogi-ts-filter-group">
									<span class="imogi-ts-filter-label">${__("Ruangan")}</span>
									<div class="imogi-ts-zone-filter"></div>
								</div>
							</div>
							<div class="imogi-ts-context-meta"></div>
						</div>
						<div class="imogi-ts-table-grid"></div>
					</main>
					<aside class="imogi-ts-sidebar">
						<section class="imogi-ts-side-panel imogi-ts-side-panel--reservations imogi-ts-panel--reservations">
							<div class="imogi-ts-side-head">
								<h4><i class="fa fa-calendar"></i> ${__("Reservasi")} <span class="imogi-ts-side-count imogi-ts-side-count-reservations">0</span></h4>
								<button type="button" class="btn btn-xs btn-default imogi-ts-side-add imogi-ts-add-reservation">${__("Tambah")}</button>
							</div>
							<div class="imogi-ts-reservation-list"></div>
						</section>
						<section class="imogi-ts-side-panel imogi-ts-side-panel--waiting imogi-ts-panel--waiting">
							<div class="imogi-ts-side-head">
								<h4><i class="fa fa-users"></i> ${__("Waiting List")} <span class="imogi-ts-side-count imogi-ts-side-count-waiting">0</span></h4>
								<button type="button" class="btn btn-xs btn-default imogi-ts-side-add imogi-ts-add-waiting">${__("Tambah")}</button>
							</div>
							<div class="imogi-ts-waiting-list"></div>
						</section>
					</aside>
				</div>
			</div>
		`);

		this.$table_grid = this.wrapper.find(".imogi-ts-table-grid");
		this.$floor_nav = this.wrapper.find(".imogi-ts-floor-nav");
		this.$zone_filter = this.wrapper.find(".imogi-ts-zone-filter");
		this.$reservation_list = this.wrapper.find(".imogi-ts-reservation-list");
		this.$waiting_list = this.wrapper.find(".imogi-ts-waiting-list");

		this.wrapper.find(".imogi-ts-refresh").on("click", () => this.refresh());
		this.wrapper.find(".imogi-ts-logout-btn").on("click", () => {
			frappe.confirm(__("Logout dari Table Service?"), () => {
				frappe.call({ method: "logout", callback: () => (window.location.href = "/login") });
			});
		});
		this._bind_manage_menu();
		this.wrapper.find(".imogi-ts-add-reservation").on("click", () => this.prompt_reservation());
		this.wrapper.find(".imogi-ts-add-waiting").on("click", () => this.prompt_waiting_guest());
		this.wrapper.find(".imogi-ts-view-toggle button").on("click", (e) => {
			this.set_view_mode($(e.currentTarget).attr("data-view"));
		});
		this._sync_view_toggle();
		imogi_ts_paint_desk_topbar(this.wrapper[0]);
	}

	_bind_manage_menu() {
		const $dropdown = this.wrapper.find(".imogi-ts-manage-dropdown");
		const close = () => $dropdown.removeClass("is-open");
		this.wrapper.find(".imogi-ts-manage-menu-btn").on("click", (e) => {
			e.stopPropagation();
			$dropdown.toggleClass("is-open");
		});
		$(document).off("click.imogi-ts-manage-menu").on("click.imogi-ts-manage-menu", close);
		$dropdown.on("click", (e) => e.stopPropagation());
		$dropdown.find("[data-action]").on("click", (e) => {
			const action = $(e.currentTarget).attr("data-action");
			close();
			if (action === "tables") this.prompt_manage_tables();
			else if (action === "spaces") this.prompt_manage_spaces();
			else if (action === "floor-settings") this.prompt_floor_settings();
			else if (action === "arrange") this.toggle_arrange_mode();
		});
	}

	_should_show_area_badge() {
		const all_label = __("Semua");
		return !this.active_zone || this.active_zone === all_label;
	}

	_is_floor_zone_split_mode() {
		const areas = this._areas_for_active_floor();
		return (this.arrange_mode || this.view_mode === "floor") && areas.length > 1;
	}

	_ensure_floor_zone_scope() {
		if (!this._is_floor_zone_split_mode()) {
			return;
		}
		const all_label = __("Semua");
		const areas = this._areas_for_active_floor();
		const names = new Set(areas.map((area) => area.name));
		if (this.active_zone && this.active_zone !== all_label && names.has(this.active_zone)) {
			return;
		}
		if (areas.length) {
			this.active_zone = areas[0].name;
		}
	}

	_active_area_display_label() {
		const all_label = __("Semua");
		if (!this.active_zone || this.active_zone === all_label) return "";
		const area = (this.board.areas || []).find((a) => a.name === this.active_zone);
		if (area) return imogi_ts_area_display_name(area);
		return this.active_zone;
	}

	_render_context_meta() {
		const scoped = this._tables_for_active_context(this.board.tables || []);
		const floor = (this.board.floors || []).find((f) => f.name === this.active_floor);
		const floor_label = floor?.floor_name || "";
		const area_label = this._active_area_display_label();
		const parts = [];
		if (floor_label) parts.push(floor_label);
		if (area_label) parts.push(area_label);
		const ctx = parts.length ? parts.join(" · ") : __("Semua area");
		const available = scoped.filter((t) => t.status === "Available").length;
		const occupied = scoped.filter((t) => t.status === "Occupied").length;
		const summary = `${scoped.length} ${__("meja")} · ${available} ${__("kosong")} · ${occupied} ${__("terisi")}`;
		this.wrapper
			.find(".imogi-ts-floor-context")
			.addClass("is-context")
			.text(`${ctx} — ${summary}`);
		const $meta = this.wrapper.find(".imogi-ts-context-meta");
		if ($meta.length) {
			$meta.html(
				`<span><i class="fa fa-map-marker"></i> ${frappe.utils.escape_html(ctx)}</span><span>${frappe.utils.escape_html(
					summary
				)}</span>`
			);
		}
	}

	set_view_mode(mode) {
		this.view_mode = mode === "list" ? "list" : "floor";
		try {
			localStorage.setItem("_imogi_ts_view_mode", this.view_mode);
		} catch (e) {
			/* ignore */
		}
		if (this.view_mode === "list" && this.arrange_mode) {
			this.toggle_arrange_mode(false);
		}
		if (this.view_mode === "floor") {
			this._ensure_floor_zone_scope();
		}
		this._sync_view_toggle();
		this.render_surface(this.board.tables || [], this.board.features || {});
	}

	_sync_view_toggle() {
		this.wrapper
			.find(".imogi-ts-view-toggle button")
			.removeClass("is-active")
			.filter(`[data-view="${this.view_mode}"]`)
			.addClass("is-active");
		this.wrapper.find(".imogi-ts-menu-floor-only").toggle(this.view_mode === "floor");
	}

	_sync_arrange_menu_state() {
		const on = this.arrange_mode;
		const label = on
			? `<i class="fa fa-check"></i>${__("Selesai Atur Denah")}`
			: `<i class="fa fa-arrows"></i>${__("Atur Denah")}`;
		this.wrapper.find(".imogi-ts-arrange-menu-item").html(label).toggleClass("is-active", on);
	}

	refresh(on_done) {
		if (this.arrange_mode) return;
		const floor_arg = this.active_floor || undefined;
		frappe.call({
			method: "imogi_pos.api.table_api.get_table_service_board",
			args: { floor: floor_arg },
			callback: (r) => {
				this.board = r.message || this.board;
				this._sync_active_floor();
				this.last_refreshed = Date.now();
				this.render();
				this._render_refresh_meta();
				this._apply_refresh_timer(this.board.refresh_seconds);
				on_done?.();
			},
		});
	}

	_sync_active_floor() {
		const floors = this.board.floors || [];
		if (!floors.length) {
			this.active_floor = null;
			return;
		}
		const board_floor = this.board.active_floor;
		const names = floors.map((f) => f.name);
		if (this.active_floor && names.includes(this.active_floor)) {
			return;
		}
		if (board_floor && names.includes(board_floor)) {
			this.active_floor = board_floor;
			return;
		}
		try {
			const saved = localStorage.getItem("_imogi_ts_active_floor");
			if (saved && names.includes(saved)) {
				this.active_floor = saved;
				return;
			}
		} catch (e) {
			/* ignore */
		}
		this.active_floor = floors[0].name;
	}

	_persist_active_floor() {
		try {
			if (this.active_floor) localStorage.setItem("_imogi_ts_active_floor", this.active_floor);
		} catch (e) {
			/* ignore */
		}
	}

	_tables_for_active_context(tables) {
		const all_label = __("Semua");
		let rows = tables || [];
		if (this.active_floor) {
			rows = rows.filter((table) => table.restaurant_floor === this.active_floor);
		}
		if (this.active_zone && this.active_zone !== all_label) {
			rows = rows.filter((table) => {
				const area_key = table.restaurant_area || imogi_ts_table_area_label(table);
				const zone_key = imogi_ts_table_area_label(table);
				return area_key === this.active_zone || zone_key === this.active_zone;
			});
		}
		return rows;
	}

	_areas_for_active_floor() {
		return imogi_ts_areas_for_floor(this.board.areas || [], this.active_floor);
	}

	_tables_on_floor(floor_name, tables) {
		const rows = tables || this.board.tables || [];
		if (!floor_name) return rows;
		return rows.filter((table) => table.restaurant_floor === floor_name);
	}

	_floor_summary_label(floor) {
		const stats = this._tables_on_floor(floor.name);
		const total = stats.length;
		const occupied = stats.filter((t) => t.status === "Occupied").length;
		const available = stats.filter((t) => t.status === "Available").length;
		const name = floor.floor_name || floor.name;
		if (!total) return `${name} — ${__("belum ada meja")}`;
		return `${name} — ${total} ${__("meja")} · ${available} ${__("kosong")} · ${occupied} ${__("terisi")}`;
	}

	_set_active_floor(floor_name) {
		if (!floor_name || floor_name === this.active_floor) return;
		this.active_floor = floor_name;
		this.active_zone = __("Semua");
		this._ensure_floor_zone_scope();
		this._persist_active_floor();
		const active = (this.board.floors || []).find((f) => f.name === floor_name);
		this.board.floor_background = active?.floor_background || null;
		this.board.active_floor = floor_name;
		this.render_surface(this.board.tables || [], this.board.features || {});
	}

	_invalidate_active_zone(floor_areas) {
		const all_label = __("Semua");
		if (!this.active_zone || this.active_zone === all_label) return;
		const names = new Set((floor_areas || []).map((area) => area.name));
		if (names.has(this.active_zone)) return;
		this.active_zone = all_label;
	}

	_build_zone_options(tables) {
		const floor_areas = this._areas_for_active_floor();
		this._invalidate_active_zone(floor_areas);
		const floor_tables = this._tables_on_floor(this.active_floor, tables);
		const all_label = __("Semua");

		if (floor_areas.length) {
			return {
				all_label,
				hide_all: this._is_floor_zone_split_mode(),
				items: floor_areas.map((area) => ({
					value: area.name,
					label: imogi_ts_area_display_name(area),
				})),
			};
		}

		const by_area = new Map();
		floor_tables.forEach((table) => {
			const key = table.restaurant_area;
			if (!key || by_area.has(key)) return;
			by_area.set(key, imogi_ts_table_area_label(table));
		});
		const items = [...by_area.entries()].map(([value, label]) => ({ value, label }));
		return {
			all_label,
			hide_all: this._is_floor_zone_split_mode() && items.length > 1,
			items,
		};
	}

	_detect_floor_empty_kind(filtered_tables) {
		const all_label = __("Semua");
		const floors = this.board.floors || [];
		const floor_tables = this._tables_on_floor(this.active_floor, this.board.tables || []);
		const floor_areas = this._areas_for_active_floor();
		const zone_filtered = this.active_zone && this.active_zone !== all_label;

		if (!floors.length) return "no_floors";
		if (!floor_areas.length) return "no_areas";
		if (!floor_tables.length) return "no_tables";
		if (!filtered_tables.length && zone_filtered) return "zone_empty";
		if (!filtered_tables.length) return "no_tables";
		return null;
	}

	_active_floor_label() {
		const floor = (this.board.floors || []).find((f) => f.name === this.active_floor);
		return floor?.floor_name || __("Lantai ini");
	}

	_build_guided_empty_html(kind) {
		const floor_label = this._active_floor_label();
		const area_label = this._active_area_display_label() || __("ruangan ini");
		const step = (n, label, state) =>
			`<span class="imogi-ts-guided-empty__step ${state}">${n}. ${label}</span>`;

		const presets = {
			no_floors: {
				icon: "fa-building",
				title: __("Belum ada lantai"),
				text: __("Tambahkan lantai restoran (mis. Lantai 1, Rooftop) untuk mulai mengatur denah meja."),
				steps: [step(1, __("Lantai"), "is-active"), step(2, __("Ruangan"), ""), step(3, __("Meja"), "")],
				actions: `
					<button type="button" class="btn btn-primary btn-sm" data-action="add-floor">${__("Tambah Lantai")}</button>
					<button type="button" class="btn btn-default btn-sm" data-action="manage-spaces">${__("Lantai & Ruangan")}</button>`,
			},
			no_areas: {
				icon: "fa-map-marker",
				title: __("{0} belum punya ruangan", [floor_label]),
				text: __("Buat ruangan dulu (Indoor, Outdoor, VIP) sebelum menambahkan meja di lantai ini."),
				steps: [
					step(1, __("Lantai"), "is-done"),
					step(2, __("Ruangan"), "is-active"),
					step(3, __("Meja"), ""),
				],
				actions: `
					<button type="button" class="btn btn-primary btn-sm" data-action="add-area">${__("Tambah Ruangan")}</button>
					<button type="button" class="btn btn-default btn-sm" data-action="manage-spaces">${__("Lantai & Ruangan")}</button>`,
			},
			no_tables: {
				icon: "fa-th-large",
				title: __("Belum ada meja di {0}", [floor_label]),
				text: __("Ruangan sudah siap. Tambahkan meja pertama lalu atur posisinya di denah."),
				steps: [
					step(1, __("Lantai"), "is-done"),
					step(2, __("Ruangan"), "is-done"),
					step(3, __("Meja"), "is-active"),
				],
				actions: `
					<button type="button" class="btn btn-primary btn-sm" data-action="add-table">${__("Tambah Meja")}</button>
					<button type="button" class="btn btn-default btn-sm" data-action="upload-floor">${__("Unggah Denah")}</button>`,
			},
			zone_empty: {
				icon: "fa-filter",
				title: __("Tidak ada meja di {0}", [area_label]),
				text: __("Belum ada meja di ruangan ini. Tambahkan meja baru atau lihat semua ruangan di lantai ini."),
				steps: "",
				actions: `
					<button type="button" class="btn btn-primary btn-sm" data-action="add-table">${__("Tambah Meja")}</button>
					<button type="button" class="btn btn-default btn-sm" data-action="clear-zone">${__("Semua Ruangan")}</button>`,
			},
		};

		const cfg = presets[kind] || presets.no_tables;
		return `
			<div class="imogi-ts-guided-empty" data-empty-kind="${frappe.utils.escape_html(kind)}">
				<div class="imogi-ts-guided-empty__icon"><i class="fa ${cfg.icon}"></i></div>
				<h4 class="imogi-ts-guided-empty__title">${cfg.title}</h4>
				<p class="imogi-ts-guided-empty__text">${cfg.text}</p>
				${cfg.steps ? `<div class="imogi-ts-guided-empty__steps">${cfg.steps}</div>` : ""}
				<div class="imogi-ts-guided-empty__actions">${cfg.actions}</div>
			</div>`;
	}

	_bind_guided_empty($container) {
		$container.find("[data-action='add-floor']").on("click", () => this.prompt_add_floor());
		$container.find("[data-action='add-area']").on("click", () => this.prompt_add_area_for_floor());
		$container.find("[data-action='add-table']").on("click", () => this.prompt_manage_tables());
		$container.find("[data-action='manage-spaces']").on("click", () => this.prompt_manage_spaces());
		$container.find("[data-action='upload-floor']").on("click", () => this.prompt_floor_settings());
		$container.find("[data-action='clear-zone']").on("click", () => this._reset_zone_filter());
	}

	_reset_zone_filter() {
		this.active_zone = __("Semua");
		this.render_surface(this.board.tables || [], this.board.features || {});
	}

	prompt_add_floor() {
		frappe.new_doc("IMOGI Restaurant Floor");
	}

	prompt_add_area_for_floor() {
		if (!this.active_floor) {
			this.prompt_manage_spaces();
			return;
		}
		frappe.new_doc("IMOGI Restaurant Area", { restaurant_floor: this.active_floor });
	}

	_append_guided_empty($target, kind, extra_class) {
		const $empty = $(this._build_guided_empty_html(kind));
		if (extra_class) $empty.addClass(extra_class);
		$target.append($empty);
		this._bind_guided_empty($empty);
		return $empty;
	}

	_apply_refresh_timer(seconds) {
		if (this._timer) clearInterval(this._timer);
		this.refresh_interval = cint(seconds) || 30;
		this.wrapper.find(".imogi-ts-refresh-label").text(`${__("Refresh")} ${this.refresh_interval}s`);
		this._timer = setInterval(() => this.refresh(), this.refresh_interval * 1000);
	}

	render() {
		const { tables = [], reservations = [], waiting = [], features = {} } = this.board;
		const scoped = this._tables_for_active_context(tables);
		const available_count = scoped.filter((t) => t.status === "Available").length;
		const occupied_count = scoped.filter((t) => t.status === "Occupied").length;
		const reserved_count = scoped.filter((t) => t.status === "Reserved").length;

		this.wrapper.find(".imogi-ts-stat-tables, .imogi-ts-kpi-total").text(scoped.length);
		this.wrapper.find(".imogi-ts-kpi-available").text(available_count);
		this.wrapper.find(".imogi-ts-kpi-occupied").text(occupied_count);
		this.wrapper.find(".imogi-ts-kpi-reserved").text(reserved_count);
		this.wrapper.find(".imogi-ts-stat-reservations, .imogi-ts-side-count-reservations").text(reservations.length);
		this.wrapper.find(".imogi-ts-stat-waiting, .imogi-ts-kpi-waiting, .imogi-ts-side-count-waiting").text(waiting.length);

		this.wrapper.find(".imogi-ts-add-reservation").toggle(!!features.table_reservation);
		this.wrapper.find(".imogi-ts-panel--reservations").toggle(!!features.table_reservation);
		this.wrapper.find(".imogi-ts-add-waiting").toggle(!!features.waiting_list);
		this.wrapper.find(".imogi-ts-panel--waiting").toggle(!!features.waiting_list);

		this.render_surface(tables, features);
		this.render_reservations(reservations, features);
		this.render_waiting(waiting, features);
	}

	render_surface(tables, features) {
		if (this.arrange_mode || this.view_mode === "floor") {
			this._ensure_floor_zone_scope();
		}
		if (!this.arrange_mode) {
			this.render_floor_nav(this.board.floors || []);
			this.render_zone_filter(tables);
		}
		this._render_context_meta();
		this._sync_arrange_menu_state();
		const filtered = this._tables_for_active_context(tables);
		if (this.arrange_mode || this.view_mode === "floor") {
			this.render_floor(filtered, features);
		} else {
			this.render_tables(filtered, features);
		}
	}

	render_floor_nav(floors) {
		if (!this.$floor_nav?.length) return;
		if (!floors.length) {
			this.$floor_nav
				.removeClass("is-select-mode is-chip-mode")
				.html(
					`<span class="text-muted small">${__(
						"Belum ada lantai. Klik Lantai & Ruangan untuk menambahkan."
					)}</span>`
				);
			return;
		}

		const use_select = floors.length > IMOGI_TS_FLOOR_CHIP_MAX;
		this.$floor_nav.removeClass("is-select-mode is-chip-mode").addClass(use_select ? "is-select-mode" : "is-chip-mode");

		if (use_select) {
			const options = floors.map((floor) => {
				const sel = this.active_floor === floor.name ? "selected" : "";
				const label = this._floor_summary_label(floor);
				return `<option value="${frappe.utils.escape_html(floor.name)}" ${sel}>${frappe.utils.escape_html(
					label
				)}</option>`;
			});
			this.$floor_nav.html(
				`<select class="imogi-ts-filter-select imogi-ts-floor-select">${options.join("")}</select>`
			);
			this.$floor_nav.off("change.floor click.floor").on("change.floor", ".imogi-ts-floor-select", (e) => {
				this._set_active_floor($(e.currentTarget).val());
			});
			return;
		}

		const chips = floors.map((floor) => {
			const active = this.active_floor === floor.name ? "is-active" : "";
			const label = floor.floor_name || floor.name;
			return `<button type="button" class="imogi-ts-floor-chip ${active}" data-floor="${frappe.utils.escape_html(
				floor.name
			)}">${frappe.utils.escape_html(label)}</button>`;
		});
		this.$floor_nav.html(chips.join(""));
		this.$floor_nav.off("change.floor click.floor").on("click.floor", ".imogi-ts-floor-chip", (e) => {
			const floor = $(e.currentTarget).attr("data-floor");
			if (!floor) return;
			this._set_active_floor(floor);
		});
	}

	render_zone_filter(tables) {
		if (!this.$zone_filter?.length) {
			return;
		}

		const { all_label, items, hide_all } = this._build_zone_options(tables);
		const $zone_group = this.$zone_filter.closest(".imogi-ts-filter-group");
		if (!items.length) {
			this.$zone_filter.empty().removeClass("is-select-mode is-chip-mode");
			$zone_group.hide();
			return;
		}
		$zone_group.show();

		const use_select = items.length > IMOGI_TS_AREA_CHIP_MAX;
		this.$zone_filter.removeClass("is-select-mode is-chip-mode").addClass(use_select ? "is-select-mode" : "is-chip-mode");

		if (use_select) {
			const options = [
				...(hide_all
					? []
					: [
							`<option value="__all__" ${this.active_zone === all_label ? "selected" : ""}>${frappe.utils.escape_html(
								all_label
							)}</option>`,
						]),
				...items.map((item) => {
					const sel = this.active_zone === item.value ? "selected" : "";
					return `<option value="${frappe.utils.escape_html(item.value)}" ${sel}>${frappe.utils.escape_html(
						item.label
					)}</option>`;
				}),
			];
			this.$zone_filter.html(
				`<select class="imogi-ts-filter-select imogi-ts-zone-select">${options.join("")}</select>`
			);
			this.$zone_filter.off("change.zone click.zone").on("change.zone", ".imogi-ts-zone-select", (e) => {
				const zone = $(e.currentTarget).val();
				this.active_zone = zone === "__all__" ? all_label : String(zone || "");
				this.render_surface(this.board.tables || [], this.board.features || {});
			});
			return;
		}

		const chips = [
			...(hide_all
				? []
				: [
						`<button type="button" class="imogi-ts-zone-chip ${this.active_zone === all_label ? "is-active" : ""}" data-zone="__all__">${frappe.utils.escape_html(
							all_label
						)}</button>`,
					]),
			...items.map((item) => {
				const active = this.active_zone === item.value ? "is-active" : "";
				return `<button type="button" class="imogi-ts-zone-chip ${active}" data-zone="${frappe.utils.escape_html(
					item.value
				)}">${frappe.utils.escape_html(item.label)}</button>`;
			}),
		];
		this.$zone_filter.html(chips.join(""));
		this.$zone_filter.off("change.zone click.zone").on("click.zone", ".imogi-ts-zone-chip", (e) => {
			const zone = $(e.currentTarget).attr("data-zone");
			this.active_zone = zone === "__all__" ? all_label : String(zone || "");
			this.render_surface(this.board.tables || [], this.board.features || {});
		});
	}

	render_tables(filtered_tables, features) {
		this.$table_grid.empty().removeClass("is-floor is-empty-state").addClass("is-grouped");
		if (!filtered_tables.length) {
			this.$table_grid.removeClass("is-grouped").addClass("is-empty-state");
			const kind = this._detect_floor_empty_kind(filtered_tables);
			if (kind) {
				this._append_guided_empty(this.$table_grid, kind, "imogi-ts-empty");
			} else {
				this.$table_grid.html(`
					<div class="imogi-ts-empty">
						<i class="fa fa-th-large"></i>
						<h4>${__("Zona kosong")}</h4>
						<p>${__("Tidak ada meja di zona ini.")}</p>
					</div>`);
			}
			return;
		}

		const groups = new Map();
		filtered_tables.forEach((table) => {
			const zone = imogi_ts_table_area_label(table);
			if (!groups.has(zone)) groups.set(zone, []);
			groups.get(zone).push(table);
		});
		const zones = [...groups.keys()].sort((a, b) =>
			a.localeCompare(b, undefined, { sensitivity: "base" })
		);

		zones.forEach((zone) => {
			const zone_tables = groups.get(zone);
			const open_count = zone_tables.filter((t) => t.status === "Occupied").length;
			const $group = $(`
				<section class="imogi-ts-zone-group">
					<div class="imogi-ts-zone-group-head">
						<i class="fa fa-map-marker"></i> ${frappe.utils.escape_html(zone)}
						<span class="imogi-ts-zone-group-count">${zone_tables.length} ${__("meja")} · ${open_count} ${__("terisi")}</span>
					</div>
					<div class="imogi-ts-zone-grid"></div>
				</section>
			`);
			const $grid = $group.find(".imogi-ts-zone-grid");
			zone_tables.forEach((table) => $grid.append(this.build_table_card(table, features)));
			this.$table_grid.append($group);
		});
	}

	render_floor(tables, features) {
		this.$table_grid.removeClass("is-grouped is-empty-state").addClass("is-floor").empty();

		const active_floor_doc = (this.board.floors || []).find((f) => f.name === this.active_floor);
		const bg = active_floor_doc?.floor_background || this.board.floor_background;
		const $canvas = $(
			`<div class="imogi-ts-floor-canvas ${this.arrange_mode ? "is-editing" : ""} ${bg ? "has-bg" : ""}"></div>`
		);
		if (bg) {
			$canvas.css("background-image", `url("${encodeURI(bg)}")`);
		} else if (!this.arrange_mode) {
			const $hint = $(`
				<div class="imogi-ts-floor-bg-hint">
					${__("Tip")}: <a class="imogi-ts-open-floor-settings">${__("Unggah gambar denah")}</a> ${__(
						"agar layout mirip ruangan asli."
					)}
				</div>`);
			$hint.find(".imogi-ts-open-floor-settings").on("click", (e) => {
				e.preventDefault();
				e.stopPropagation();
				this.prompt_floor_settings();
			});
			$canvas.append($hint);
		}
		if (this.arrange_mode) {
			this.$table_grid.append(
				`<div class="imogi-ts-floor-hint"><i class="fa fa-arrows"></i> ${__(
					"Klik & tahan kartu meja, lalu seret ke posisi baru. Klik Selesai untuk menyimpan."
				)}</div>`
			);
		}
		this.$table_grid.append($canvas);
		this.$floor_canvas = $canvas;

		if (!tables.length) {
			const kind = this._detect_floor_empty_kind(tables);
			if (kind) {
				this._append_guided_empty($canvas, kind, "imogi-ts-floor-empty");
			} else {
				$canvas.append(`
					<div class="imogi-ts-floor-empty">
						<i class="fa fa-th-large"></i>
						<div>${__("Tidak ada meja di zona ini.")}</div>
					</div>`);
			}
			return;
		}

		const has_pos = (t) =>
			Number.isFinite(t.pos_x) && Number.isFinite(t.pos_y) && (t.pos_x || t.pos_y);
		const unpositioned = tables.filter((t) => !has_pos(t));
		// Spread unpositioned tables evenly across the FULL canvas (both axes), with margins.
		const n = unpositioned.length;
		const cols = Math.max(1, Math.ceil(Math.sqrt(n)));
		const rows = Math.max(1, Math.ceil(n / cols));
		const margin = 13;
		const span = 100 - margin * 2;
		unpositioned.forEach((t, i) => {
			const col = i % cols;
			const row = Math.floor(i / cols);
			t._auto_x = cols === 1 ? 50 : margin + (col / (cols - 1)) * span;
			t._auto_y = rows === 1 ? 50 : margin + (row / (rows - 1)) * span;
		});

		tables.forEach((table) => {
			const x = has_pos(table) ? table.pos_x : table._auto_x;
			const y = has_pos(table) ? table.pos_y : table._auto_y;
			const $node = this.build_floor_node(table, features);
			$node.attr("data-name", table.name).css({ left: `${x}%`, top: `${y}%` });
			$canvas.append($node);
		});

		if (this.arrange_mode) {
			this._bind_floor_drag($canvas);
		}
	}

	build_floor_node(table, features) {
		const status_class = IMOGI_TABLE_STATUS_CLASS[table.status] || "";
		const status_label = IMOGI_TS_STATUS_LABEL[table.status] || table.status || "Available";
		const shape = (table.shape || "Square").toLowerCase();
		const zone = imogi_ts_table_area_label(table);
		let info = "";
		if (table.open_order) {
			const elapsed = imogi_ts_format_elapsed(table.open_order_since);
			const parts = [];
			if (elapsed) parts.push(elapsed.text);
			parts.push(format_currency(table.open_order_total || 0));
			info = `<span class="imogi-ts-fn-info">${parts.join("<br>")}</span>`;
		}
		const zone_badge =
			this._should_show_area_badge() && zone && shape !== "bar"
				? `<span class="imogi-ts-fn-zone">${frappe.utils.escape_html(zone)}</span>`
				: "";
		const $node = $(`
			<div class="imogi-ts-floor-node ${status_class} shape-${shape}" title="${frappe.utils.escape_html((table.table_number || table.name) + " · " + zone + " · " + status_label)}">
				<span class="imogi-ts-fn-dot"></span>
				<span class="imogi-ts-fn-num">${frappe.utils.escape_html(table.table_number || table.name)}</span>
				<span class="imogi-ts-fn-cap"><i class="fa fa-user"></i> ${table.capacity || 0}</span>
				${zone_badge}
				${info}
			</div>
		`);
		this._add_chairs($node, table.capacity || 0, shape);
		$node.on("click", () => {
			if (this.arrange_mode) return;
			if (table.open_order) {
				this.prompt_table_order(table, features);
			} else if (table.status === "Available" || table.status === "Reserved") {
				this.open_cashier_for_table(table);
			}
		});
		return $node;
	}

	_add_chairs($node, capacity, shape) {
		const count = Math.max(0, Math.min(12, cint(capacity)));
		if (!count) return;
		// Distribute chairs around the node perimeter. Bar = one long side only.
		const place = (sideClass, posCss) => {
			$node.append(`<span class="imogi-ts-chair ${sideClass}" style="${posCss}"></span>`);
		};
		if (shape === "bar") {
			for (let i = 0; i < count; i++) {
				const left = ((i + 0.5) / count) * 100;
				place("", `left:${left}%;bottom:-7px;transform:translateX(-50%);`);
			}
			return;
		}
		// Square/Round: spread across 4 sides (top, right, bottom, left).
		const perSide = [0, 0, 0, 0];
		for (let i = 0; i < count; i++) perSide[i % 4]++;
		const lay = (num, build) => {
			for (let i = 0; i < num; i++) build(((i + 0.5) / num) * 100);
		};
		lay(perSide[0], (p) => place("", `left:${p}%;top:-7px;transform:translateX(-50%);`));
		lay(perSide[1], (p) => place("is-v", `top:${p}%;right:-7px;transform:translateY(-50%);`));
		lay(perSide[2], (p) => place("", `left:${p}%;bottom:-7px;transform:translateX(-50%);`));
		lay(perSide[3], (p) => place("is-v", `top:${p}%;left:-7px;transform:translateY(-50%);`));
	}

	_bind_floor_drag($canvas) {
		const self = this;
		const canvas_el = $canvas[0];
		let drag = null;
		let skip_mouse = false;

		const finish_drag = () => {
			if (!drag) return;
			const { node, moved } = drag;
			node.classList.remove("is-dragging");
			if (moved) {
				self._mark_dirty_position(
					node.getAttribute("data-name"),
					parseFloat(node.dataset.posX),
					parseFloat(node.dataset.posY)
				);
			}
			try {
				if (drag.pointerId != null) node.releasePointerCapture(drag.pointerId);
			} catch (e) {
				/* ignore */
			}
			drag = null;
		};

		const on_move = (ev) => {
			if (!drag) return;
			ev.preventDefault();
			const rect = drag.rect;
			let x = ((ev.clientX - rect.left) / rect.width) * 100;
			let y = ((ev.clientY - rect.top) / rect.height) * 100;
			x = Math.max(5, Math.min(95, x));
			y = Math.max(5, Math.min(95, y));
			drag.node.style.left = `${x.toFixed(2)}%`;
			drag.node.style.top = `${y.toFixed(2)}%`;
			drag.node.dataset.posX = String(x.toFixed(2));
			drag.node.dataset.posY = String(y.toFixed(2));
			drag.moved = true;
		};

		const on_end = (ev) => {
			if (!drag) return;
			ev.preventDefault();
			finish_drag();
		};

		const start_drag = (node, clientX, clientY, pointerId) => {
			if (!self.arrange_mode) return;
			drag = {
				node,
				rect: canvas_el.getBoundingClientRect(),
				moved: false,
				pointerId,
			};
			node.classList.add("is-dragging");
			try {
				if (pointerId != null) node.setPointerCapture(pointerId);
			} catch (e) {
				/* ignore */
			}
		};

		$canvas.off("pointerdown.tsdrag mousedown.tsdrag");
		$canvas.on("pointerdown.tsdrag", ".imogi-ts-floor-node", function (ev) {
			if (!self.arrange_mode || ev.button !== 0) return;
			ev.preventDefault();
			ev.stopPropagation();
			skip_mouse = true;
			setTimeout(() => {
				skip_mouse = false;
			}, 400);
			start_drag(this, ev.clientX, ev.clientY, ev.pointerId);
		});
		// Fallback for environments where Pointer Events are flaky.
		$canvas.on("mousedown.tsdrag", ".imogi-ts-floor-node", function (ev) {
			if (skip_mouse || !self.arrange_mode || ev.button !== 0) return;
			ev.preventDefault();
			ev.stopPropagation();
			start_drag(this, ev.clientX, ev.clientY, null);
		});

		$(document).off("pointermove.tsdrag mousemove.tsdrag pointerup.tsdrag mouseup.tsdrag pointercancel.tsdrag");
		$(document).on("pointermove.tsdrag mousemove.tsdrag", on_move);
		$(document).on("pointerup.tsdrag mouseup.tsdrag pointercancel.tsdrag", on_end);
	}

	_teardown_floor_drag() {
		$(document).off("pointermove.tsdrag mousemove.tsdrag pointerup.tsdrag mouseup.tsdrag pointercancel.tsdrag");
		this.$floor_canvas?.off("pointerdown.tsdrag mousedown.tsdrag");
	}

	_mark_dirty_position(name, x, y) {
		if (!name || !Number.isFinite(x) || !Number.isFinite(y)) return;
		if (!this._dirty_positions) this._dirty_positions = new Map();
		this._dirty_positions.set(name, { x, y });
		const t = (this.board.tables || []).find((tt) => tt.name === name);
		if (t) {
			t.pos_x = x;
			t.pos_y = y;
		}
	}

	toggle_arrange_mode(force) {
		const next = typeof force === "boolean" ? force : !this.arrange_mode;
		if (next && this.view_mode !== "floor") {
			this.set_view_mode("floor");
		}
		this.arrange_mode = next;
		if (next) {
			if (this._timer) clearInterval(this._timer);
			frappe.show_alert({
				message: __("Mode atur denah aktif — klik & tahan meja, lalu seret"),
				indicator: "blue",
			});
		} else {
			this._teardown_floor_drag();
			this._save_floor_positions();
			this._apply_refresh_timer(this.refresh_interval);
		}
		this.render_surface(this.board.tables || [], this.board.features || {});
	}

	_collect_floor_positions_from_dom() {
		const positions = [];
		(this.$floor_canvas || this.wrapper.find(".imogi-ts-floor-canvas")).find(".imogi-ts-floor-node").each(function () {
			const name = this.getAttribute("data-name");
			const x = parseFloat(this.style.left);
			const y = parseFloat(this.style.top);
			if (name && Number.isFinite(x) && Number.isFinite(y)) {
				positions.push({ name, pos_x: x, pos_y: y });
			}
		});
		return positions;
	}

	_save_floor_positions() {
		const from_dom = this._collect_floor_positions_from_dom();
		const dirty = this._dirty_positions;
		const merged = new Map();

		from_dom.forEach((p) => merged.set(p.name, p));
		if (dirty?.size) {
			dirty.forEach((p, name) => merged.set(name, { name, pos_x: p.x, pos_y: p.y }));
		}

		const positions = [...merged.values()];
		this._dirty_positions = new Map();
		if (!positions.length) return;

		frappe.call({
			method: "imogi_pos.api.table_api.save_table_positions",
			args: { positions: JSON.stringify(positions) },
			callback: () => {
				positions.forEach((p) => {
					const t = (this.board.tables || []).find((row) => row.name === p.name);
					if (t) {
						t.pos_x = p.pos_x;
						t.pos_y = p.pos_y;
					}
				});
				frappe.show_alert({ message: __("Denah meja disimpan"), indicator: "green" });
			},
		});
	}

	prompt_floor_settings() {
		const active_floor_doc = (this.board.floors || []).find((f) => f.name === this.active_floor);
		const floor_label = active_floor_doc?.floor_name || __("Lantai aktif");
		const has_bg = !!(active_floor_doc?.floor_background || this.board.floor_background);
		const dialog = imogi_ts_open_form_dialog({
			title: __("Pengaturan Denah"),
			subtitle: __("Background untuk {0} & penataan otomatis", [floor_label]),
			icon: "fa-picture-o",
			fields: [
				{
					fieldname: "bg_html",
					fieldtype: "HTML",
					options: `
						<div class="imogi-ts-order-modal-cell" style="margin-bottom:10px;">
							<label>${__("Background Denah")}</label>
							<div class="val" style="font-size:12px;font-weight:600;color:#475569;">
								${has_bg ? __("Gambar denah aktif sebagai latar lantai.") : __("Belum ada gambar. Unggah blueprint/denah lantai (opsional).")}
							</div>
						</div>
						<div style="display:flex;gap:8px;flex-wrap:wrap;">
							<button type="button" class="btn btn-sm btn-primary imogi-ts-bg-upload"><i class="fa fa-upload"></i> ${__("Unggah Gambar")}</button>
							${has_bg ? `<button type="button" class="btn btn-sm btn-default imogi-ts-bg-clear"><i class="fa fa-trash"></i> ${__("Hapus Background")}</button>` : ""}
						</div>`,
				},
				{ fieldtype: "Section Break", label: __("Penataan Meja") },
				{
					fieldname: "arrange_html",
					fieldtype: "HTML",
					options: `
						<div class="val" style="font-size:12px;font-weight:600;color:#475569;margin-bottom:8px;">
							${__("Tata ulang semua meja jadi grid rapi (posisi manual akan ditimpa).")}
						</div>
						<button type="button" class="btn btn-sm btn-default imogi-ts-bg-autoarrange"><i class="fa fa-th"></i> ${__("Tata Otomatis")}</button>`,
				},
			],
			primary_label: __("Tutup"),
			on_submit: () => {},
		});
		dialog.get_primary_btn().off("click").on("click", () => dialog.hide());

		dialog.$wrapper.find(".imogi-ts-bg-upload").on("click", () => {
			new frappe.ui.FileUploader({
				allow_multiple: false,
				restrictions: { allowed_file_types: ["image/*"] },
				on_success: (file_doc) => {
					frappe.call({
						method: "imogi_pos.api.table_api.set_floor_background",
						args: { image_url: file_doc.file_url, floor: this.active_floor },
						freeze: true,
						callback: () => {
							this.board.floor_background = file_doc.file_url;
							if (active_floor_doc) active_floor_doc.floor_background = file_doc.file_url;
							frappe.show_alert({ message: __("Background denah diperbarui"), indicator: "green" });
							dialog.hide();
							this.render_surface(this.board.tables || [], this.board.features || {});
						},
					});
				},
			});
		});

		dialog.$wrapper.find(".imogi-ts-bg-clear").on("click", () => {
			frappe.call({
				method: "imogi_pos.api.table_api.set_floor_background",
				args: { image_url: "", floor: this.active_floor },
				freeze: true,
				callback: () => {
					this.board.floor_background = null;
					if (active_floor_doc) active_floor_doc.floor_background = null;
					frappe.show_alert({ message: __("Background dihapus"), indicator: "orange" });
					dialog.hide();
					this.render_surface(this.board.tables || [], this.board.features || {});
				},
			});
		});

		dialog.$wrapper.find(".imogi-ts-bg-autoarrange").on("click", () => {
			imogi_ts_confirm(
				__("Tata ulang semua meja jadi grid rapi? Posisi manual saat ini akan ditimpa."),
				() => {
					this._auto_arrange_all();
				},
				{ parent_dialog: dialog }
			);
		});
	}

	_auto_arrange_all() {
		const tables = this._tables_for_active_context(this.board.tables || []);
		if (!tables.length) return;
		const n = tables.length;
		const cols = Math.max(1, Math.ceil(Math.sqrt(n)));
		const rows = Math.max(1, Math.ceil(n / cols));
		const margin = 13;
		const span = 100 - margin * 2;
		const positions = tables.map((t, i) => {
			const col = i % cols;
			const row = Math.floor(i / cols);
			const x = cols === 1 ? 50 : margin + (col / (cols - 1)) * span;
			const y = rows === 1 ? 50 : margin + (row / (rows - 1)) * span;
			t.pos_x = x;
			t.pos_y = y;
			return { name: t.name, pos_x: x, pos_y: y };
		});
		frappe.call({
			method: "imogi_pos.api.table_api.save_table_positions",
			args: { positions: JSON.stringify(positions) },
			freeze: true,
			callback: () => {
				frappe.show_alert({ message: __("Meja ditata ulang"), indicator: "green" });
				this.render_surface(this.board.tables || [], this.board.features || {});
			},
		});
	}

	build_table_card(table, features) {
		const status_class = IMOGI_TABLE_STATUS_CLASS[table.status] || "";
		const status_label = IMOGI_TS_STATUS_LABEL[table.status] || table.status || "Available";
		const zone_label = imogi_ts_table_area_label(table);
		const zone_html =
			this._should_show_area_badge() && zone_label
				? `<span class="imogi-ts-table-zone">${frappe.utils.escape_html(zone_label)}</span>`
				: "";
		const $card = $(`
			<article class="imogi-ts-table-card ${status_class}">
				<div class="imogi-ts-table-card__main">
					<div class="imogi-ts-table-card__info">
						<div class="imogi-ts-table-num">${frappe.utils.escape_html(table.table_number || table.name)}</div>
						<div class="imogi-ts-table-meta-row">
							${zone_html}
							<span class="imogi-ts-table-cap"><i class="fa fa-user"></i> ${table.capacity || 0} ${__("org")}</span>
						</div>
					</div>
					<div class="imogi-ts-table-card__status">
						<span class="imogi-ts-table-badge">${frappe.utils.escape_html(status_label)}</span>
					</div>
				</div>
				<div class="imogi-ts-table-order"></div>
				<div class="imogi-ts-table-actions"></div>
			</article>
		`);

		if (table.open_order) {
			const chips = [];
			const status_chip = IMOGI_TS_ORDER_STATUS_CHIP[table.open_order_status];
			if (status_chip) {
				chips.push(
					`<span class="imogi-ts-chip-mini imogi-ts-chip-mini--${status_chip.cls}">${status_chip.label}</span>`
				);
			}
			if (table.open_order_kitchen === "pending") {
				chips.push(`<span class="imogi-ts-chip-mini imogi-ts-chip-mini--kpending"><i class="fa fa-fire"></i> ${__("Dapur")}</span>`);
			} else if (table.open_order_kitchen === "done") {
				chips.push(`<span class="imogi-ts-chip-mini imogi-ts-chip-mini--kdone"><i class="fa fa-check"></i> ${__("Siap")}</span>`);
			}
			const elapsed = imogi_ts_format_elapsed(table.open_order_since);
			const elapsed_html = elapsed
				? `<span class="imogi-ts-elapsed ${elapsed.level}"><i class="fa fa-clock-o"></i> ${elapsed.text}</span>`
				: "";
			$card.find(".imogi-ts-table-order").html(`
				<div class="imogi-ts-order-ref">${frappe.utils.escape_html(table.open_order)}</div>
				<div class="imogi-ts-order-meta">${frappe.utils.escape_html(table.open_order_customer || __("Walk-in"))} · ${format_currency(table.open_order_total || 0)}</div>
				<div class="imogi-ts-table-substatus">${elapsed_html}${chips.join("")}</div>
			`);
		} else {
			$card.find(".imogi-ts-table-order").remove();
		}

		const $actions = $card.find(".imogi-ts-table-actions");
		if (table.open_order) {
			$actions.removeClass("imogi-ts-table-actions--single");
			$actions.append(`<button type="button" class="imogi-ts-act" data-action="open-order"><i class="fa fa-file-text-o"></i> ${__("Order")}</button>`);
			if (features.move_table) {
				$actions.append(`<button type="button" class="imogi-ts-act" data-action="move"><i class="fa fa-arrows"></i> ${__("Pindah")}</button>`);
			}
			if (features.merge_table) {
				$actions.append(`<button type="button" class="imogi-ts-act" data-action="merge"><i class="fa fa-compress"></i> ${__("Gabung")}</button>`);
			}
		} else if (table.status === "Available" || table.status === "Reserved") {
			if (!features.qr_self_service) {
				$actions.addClass("imogi-ts-table-actions--single");
			}
			$actions.append(`<button type="button" class="imogi-ts-act imogi-ts-act--primary" data-action="new-order"><i class="fa fa-plus"></i> ${__("Order Baru")}</button>`);
		} else {
			$actions.remove();
		}
		if (features.qr_self_service && $actions.length) {
			$actions.removeClass("imogi-ts-table-actions--single");
			$actions.append(`<button type="button" class="imogi-ts-act imogi-ts-act--qr" data-action="qr"><i class="fa fa-qrcode"></i> ${__("QR")}</button>`);
		}

		$card.on("click", "[data-action='open-order']", (e) => {
			e.stopPropagation();
			this.prompt_table_order(table);
		});
		$card.on("click", "[data-action='move']", (e) => {
			e.stopPropagation();
			this.prompt_move_table(table);
		});
		$card.on("click", "[data-action='merge']", (e) => {
			e.stopPropagation();
			this.prompt_merge_table(table);
		});
		$card.on("click", "[data-action='new-order']", (e) => {
			e.stopPropagation();
			this.open_cashier_for_table(table);
		});
		$card.on("click", "[data-action='qr']", (e) => {
			e.stopPropagation();
			this.show_table_qr(table);
		});

		return $card;
	}

	prompt_table_order(table, features) {
		features = features || this.board.features || {};
		const status_chip = IMOGI_TS_ORDER_STATUS_CHIP[table.open_order_status];
		const status_label = status_chip ? status_chip.label : table.open_order_status || "—";
		const elapsed = imogi_ts_format_elapsed(table.open_order_since);
		const kitchen_label =
			table.open_order_kitchen === "pending"
				? __("Sedang dimasak")
				: table.open_order_kitchen === "done"
					? __("Siap diantar")
					: __("Tanpa dapur");
		const can_supervise = this.can_open_cashier();

		const move_btn = features.move_table
			? `<button type="button" class="btn btn-sm btn-default imogi-ts-modal-move"><i class="fa fa-arrows"></i> ${__("Pindah Meja")}</button>`
			: "";
		const merge_btn = features.merge_table
			? `<button type="button" class="btn btn-sm btn-default imogi-ts-modal-merge"><i class="fa fa-compress"></i> ${__("Gabung Meja")}</button>`
			: "";
		const actions_row =
			move_btn || merge_btn
				? `<div class="imogi-ts-order-actions" style="display:flex;gap:8px;margin-top:12px;">${move_btn}${merge_btn}</div>`
				: "";

		const dialog = imogi_ts_open_form_dialog({
			title: __("Order Meja {0}", [table.table_number || table.name]),
			subtitle: table.open_order,
			icon: "fa-file-text-o",
			fields: [
				{
					fieldname: "order_html",
					fieldtype: "HTML",
					options: `
						<div class="imogi-ts-order-modal-grid">
							<div class="imogi-ts-order-modal-cell">
								<label>${__("Customer")}</label>
								<div class="val">${frappe.utils.escape_html(table.open_order_customer || __("Walk-in"))}</div>
							</div>
							<div class="imogi-ts-order-modal-cell">
								<label>${__("Total")}</label>
								<div class="val">${format_currency(table.open_order_total || 0)}</div>
							</div>
							<div class="imogi-ts-order-modal-cell">
								<label>${__("Status")}</label>
								<div class="val">${frappe.utils.escape_html(status_label)}</div>
							</div>
							<div class="imogi-ts-order-modal-cell">
								<label>${__("Lama")}</label>
								<div class="val">${elapsed ? elapsed.text : "—"}</div>
							</div>
							<div class="imogi-ts-order-modal-cell">
								<label>${__("Tipe")}</label>
								<div class="val">${frappe.utils.escape_html(table.open_order_type || "Dine-in")}</div>
							</div>
							<div class="imogi-ts-order-modal-cell">
								<label>${__("Dapur")}</label>
								<div class="val">${kitchen_label}</div>
							</div>
						</div>
						${actions_row}`,
				},
			],
			primary_label: __("Buka di Kasir"),
			on_submit: () => {
				this.open_cashier_for_table(table, {
					customer_name: table.open_order_customer,
					order_name: table.open_order,
				});
			},
		});

		dialog.$wrapper.find(".imogi-ts-modal-move").on("click", () => {
			dialog.hide();
			this.prompt_move_table(table);
		});
		dialog.$wrapper.find(".imogi-ts-modal-merge").on("click", () => {
			dialog.hide();
			this.prompt_merge_table(table);
		});

		if (can_supervise) {
			dialog.set_secondary_action_label(__("Detail Lengkap"));
			dialog.set_secondary_action(() => {
				dialog.hide();
				frappe.set_route("Form", "Riwayat Order", table.open_order);
			});
		}
	}

	render_reservations(reservations) {
		this.$reservation_list.empty();
		if (!reservations.length) {
			this.$reservation_list.html(`
				<div class="imogi-ts-list-empty">
					<i class="fa fa-calendar-o"></i>
					<div>${__("Tidak ada reservasi aktif")}</div>
				</div>`);
			return;
		}

		reservations.forEach((row) => {
			const when = frappe.datetime.str_to_user(row.reservation_datetime);
			const $item = $(`
				<div class="imogi-ts-list-item imogi-ts-list-item--reservation">
					<div class="imogi-ts-list-head">
						<strong>${frappe.utils.escape_html(row.customer_name)}</strong>
						<span class="imogi-ts-list-badge imogi-ts-list-badge--reserved">${row.party_size} ${__("org")}</span>
					</div>
					<div class="imogi-ts-list-meta">${frappe.utils.escape_html(when)}${row.restaurant_table ? ` · ${frappe.utils.escape_html(row.restaurant_table)}` : ""}${row.phone ? ` · ${frappe.utils.escape_html(row.phone)}` : ""}</div>
					${row.notes ? `<div class="imogi-ts-list-meta">${frappe.utils.escape_html(row.notes)}</div>` : ""}
					<div class="imogi-ts-list-actions"></div>
				</div>
			`);
			const $actions = $item.find(".imogi-ts-list-actions");
			$actions.append(`<button type="button" class="btn btn-xs btn-primary" data-action="seat">${__("Datang")}</button>`);
			$actions.append(`<button type="button" class="btn btn-xs btn-default" data-action="cancel">${__("Batal")}</button>`);
			$item.on("click", "[data-action='seat']", () => this.seat_reservation(row));
			$item.on("click", "[data-action='cancel']", () => this.cancel_reservation(row));
			this.$reservation_list.append($item);
		});
	}

	render_waiting(waiting, features) {
		this.$waiting_list.empty();
		if (!waiting.length) {
			this.$waiting_list.html(`
				<div class="imogi-ts-list-empty">
					<i class="fa fa-users"></i>
					<div>${__("Antrian kosong")}</div>
				</div>`);
			return;
		}

		waiting.forEach((row, idx) => {
			const when = row.queued_at ? frappe.datetime.str_to_user(row.queued_at) : "";
			const $item = $(`
				<div class="imogi-ts-list-item imogi-ts-list-item--waiting">
					<div class="imogi-ts-list-head">
						<strong>${frappe.utils.escape_html(row.customer_name)}</strong>
						<span class="imogi-ts-list-badge imogi-ts-list-badge--waiting">#${idx + 1} · ${row.party_size} ${__("org")}</span>
					</div>
					<div class="imogi-ts-list-meta">${when ? `${frappe.utils.escape_html(when)} · ` : ""}${__("Menunggu meja")}${row.phone ? ` · ${frappe.utils.escape_html(row.phone)}` : ""}</div>
					${row.notes ? `<div class="imogi-ts-list-meta">${frappe.utils.escape_html(row.notes)}</div>` : ""}
					<div class="imogi-ts-list-actions"></div>
				</div>
			`);
			const $actions = $item.find(".imogi-ts-list-actions");
			$actions.append(`<button type="button" class="btn btn-xs btn-primary" data-action="seat">${__("Tempatkan")}</button>`);
			$actions.append(`<button type="button" class="btn btn-xs btn-default" data-action="cancel">${__("Batal")}</button>`);
			$item.on("click", "[data-action='seat']", () => this.prompt_seat_waiting(row, features));
			$item.on("click", "[data-action='cancel']", () => this.cancel_waiting(row));
			this.$waiting_list.append($item);
		});
	}

	open_cashier_for_table(table, extra = {}) {
		try {
			localStorage.setItem(
				"_imogi_pos_cashier_prefill",
				JSON.stringify({
					order_type: "Dine-in",
					restaurant_table: table.name,
					table_number: table.table_number || table.name,
					customer_label: extra.customer_name || "",
					party_size: extra.party_size || null,
				})
			);
		} catch (e) {
			/* ignore */
		}
		frappe.set_route("imogi-pos-cashier");
	}

	prompt_move_table(table) {
		const available = (this.board.tables || []).filter(
			(t) => t.name !== table.name && (t.status === "Available" || t.status === "Reserved")
		);
		if (!available.length) {
			frappe.msgprint(__("Tidak ada meja tujuan yang tersedia"));
			return;
		}
		imogi_ts_open_form_dialog({
			title: __("Pindah Meja"),
			subtitle: __("Pindahkan order dari {0} ke meja lain", [table.table_number || table.name]),
			icon: "fa-arrows-h",
			fields: [
				{
					fieldname: "new_table",
					fieldtype: "Select",
					label: __("Meja tujuan"),
					options: available.map((t) => {
						const zone = imogi_ts_table_area_label(t);
						const status = IMOGI_TS_STATUS_LABEL[t.status] || t.status;
						return {
							label: `${t.table_number || t.name} · ${zone} · ${t.capacity || 0} ${__("org")} · ${status}`,
							value: t.name,
						};
					}),
					reqd: 1,
				},
			],
			primary_label: __("Pindahkan"),
			on_submit: (values) => {
				frappe.call({
					method: "imogi_pos.api.table_api.move_restaurant_table",
					args: { order_name: table.open_order, new_table: values.new_table },
					freeze: true,
					callback: () => {
						frappe.show_alert({ message: __("Meja dipindahkan"), indicator: "green" });
						this.refresh();
					},
				});
			},
		});
	}

	prompt_merge_table(table) {
		const sources = (this.board.tables || []).filter(
			(t) => t.name !== table.name && t.open_order
		);
		if (!sources.length) {
			frappe.msgprint(__("Tidak ada meja lain dengan order aktif untuk digabung"));
			return;
		}
		imogi_ts_open_form_dialog({
			title: __("Gabung Meja"),
			subtitle: __(
				"Gabungkan order dari meja lain ke {0} ({1})",
				[table.table_number || table.name, table.open_order]
			),
			icon: "fa-object-group",
			fields: [
				{
					fieldname: "source_table",
					fieldtype: "Select",
					label: __("Meja sumber order"),
					options: sources.map((t) => {
						const zone = imogi_ts_table_area_label(t);
						return {
							label: `${t.table_number || t.name} · ${zone} · ${format_currency(t.open_order_total || 0)}`,
							value: t.name,
						};
					}),
					reqd: 1,
					description: __("Order dari meja sumber akan dipindahkan ke meja tujuan."),
				},
			],
			primary_label: __("Gabungkan"),
			on_submit: (values) => {
				const source = sources.find((t) => t.name === values.source_table);
				if (!source?.open_order) {
					frappe.msgprint(__("Meja sumber tidak valid"));
					return false;
				}
				frappe.call({
					method: "imogi_pos.api.planned_features_api.merge_tables",
					args: {
						primary_order: table.open_order,
						secondary_order: source.open_order,
					},
					freeze: true,
					callback: () => {
						frappe.show_alert({ message: __("Order berhasil digabung"), indicator: "green" });
						this.refresh();
					},
				});
			},
		});
	}

	prompt_manage_spaces() {
		const dialog = imogi_ts_open_form_dialog({
			title: __("Lantai & Ruangan"),
			subtitle: __("Kelola master data lantai dan ruangan (Indoor, Outdoor, VIP, dll.)"),
			icon: "fa-building",
			fields: [
				{
					fieldtype: "HTML",
					options: `
						<div style="display:flex;gap:8px;flex-wrap:wrap;">
							<button type="button" class="btn btn-primary btn-sm imogi-ts-open-floors">
								<i class="fa fa-layer-group"></i> ${__("Kelola Lantai")}
							</button>
							<button type="button" class="btn btn-default btn-sm imogi-ts-open-areas">
								<i class="fa fa-map-marker"></i> ${__("Kelola Ruangan")}
							</button>
						</div>
						<p class="text-muted small" style="margin-top:10px;">${__(
							"Tambahkan lantai (mis. Lantai 1, Rooftop) lalu buat ruangan per lantai. Setelah itu muat ulang Table Service."
						)}</p>`,
				},
			],
			primary_label: __("Tutup"),
			on_submit: () => {},
		});
		dialog.get_primary_btn().off("click").on("click", () => dialog.hide());
		dialog.$wrapper.find(".imogi-ts-open-floors").on("click", () => {
			frappe.set_route("List", "IMOGI Restaurant Floor");
		});
		dialog.$wrapper.find(".imogi-ts-open-areas").on("click", () => {
			frappe.set_route("List", "IMOGI Restaurant Area");
		});
	}

	prompt_manage_tables() {
		const areas = this._areas_for_active_floor();
		if (!areas.length) {
			frappe.msgprint({
				title: __("Ruangan belum ada"),
				indicator: "orange",
				message: __("Buat lantai dan ruangan dulu melalui tombol <b>Lantai & Ruangan</b>."),
			});
			return;
		}
		const tables = this._tables_for_active_context(this.board.tables || []);
		const area_options = areas.map((area) => ({ label: area.area_name, value: area.name }));
		const dialog = imogi_ts_open_form_dialog({
			title: __("Kelola Meja"),
			subtitle: __("Edit kapasitas/ruangan, hapus meja, atau tambah meja baru"),
			icon: "fa-th-large",
			wide: true,
			fields: [
				{
					fieldname: "tables_html",
					fieldtype: "HTML",
					options: imogi_ts_build_manage_tables_html(tables, areas),
				},
				{ fieldtype: "Section Break", label: __("Tambah Meja Baru") },
				{
					fieldname: "table_number",
					fieldtype: "Data",
					label: __("Nomor Meja"),
					reqd: 1,
					description: __("Contoh: TS-04, A1, VIP-01"),
				},
				{
					fieldname: "capacity",
					fieldtype: "Int",
					label: __("Kapasitas"),
					default: 4,
					reqd: 1,
				},
				{
					fieldname: "restaurant_area",
					fieldtype: "Select",
					label: __("Ruangan / Area"),
					options: area_options,
					default: areas[0]?.name,
					reqd: 1,
				},
				{
					fieldname: "shape",
					fieldtype: "Select",
					label: __("Bentuk Meja"),
					options: ["Square", "Round", "Bar"],
					default: "Square",
				},
			],
			primary_label: __("Tambah Meja"),
			on_submit: (values) => {
				if (!values.table_number?.trim()) {
					frappe.msgprint(__("Nomor meja wajib diisi"));
					return false;
				}
				if (!values.restaurant_area) {
					frappe.msgprint(__("Ruangan wajib dipilih"));
					return false;
				}
				frappe.call({
					method: "imogi_pos.api.table_api.create_restaurant_table",
					args: {
						table_number: values.table_number.trim(),
						capacity: values.capacity,
						restaurant_area: values.restaurant_area,
						restaurant_floor: this.active_floor,
						shape: values.shape,
						company: this.board.company,
					},
					freeze: true,
					callback: () => {
						frappe.show_alert({ message: __("Meja {0} berhasil ditambahkan", [values.table_number.trim()]), indicator: "green" });
						dialog.set_value("table_number", "");
						this.refresh(() => this._bind_manage_rows(dialog));
					},
				});
				return false;
			},
		});
		dialog.set_secondary_action_label(__("Tutup"));
		dialog.set_secondary_action(() => dialog.hide());
		this._bind_manage_rows(dialog);
	}

	_bind_manage_rows(dialog) {
		const areas = this._areas_for_active_floor();
		const $wrap = dialog.fields_dict.tables_html?.$wrapper;
		if (!$wrap) return;
		const tables = this._tables_for_active_context(this.board.tables || []);
		$wrap.html(imogi_ts_build_manage_tables_html(tables, areas));

		$wrap.off("click.tsmanage").on("click.tsmanage", ".imogi-ts-manage-btn-save", (e) => {
			const $row = $(e.currentTarget).closest(".imogi-ts-manage-row");
			const name = $row.attr("data-name");
			const capacity = cint($row.find(".imogi-ts-manage-cap").val());
			const restaurant_area = $row.find(".imogi-ts-manage-area").val();
			const shape = $row.find(".imogi-ts-manage-shape").val();
			if (capacity < 1) {
				frappe.msgprint(__("Kapasitas minimal 1 orang"));
				return;
			}
			if (!restaurant_area) {
				frappe.msgprint(__("Ruangan wajib dipilih"));
				return;
			}
			frappe.call({
				method: "imogi_pos.api.table_api.update_restaurant_table",
				args: { name, capacity, restaurant_area, shape },
				freeze: true,
				callback: () => {
					frappe.show_alert({ message: __("Meja {0} diperbarui", [name]), indicator: "green" });
					this.refresh(() => this._bind_manage_rows(dialog));
				},
			});
		});

		$wrap.on("click.tsmanage", ".imogi-ts-manage-btn-del", (e) => {
			const $row = $(e.currentTarget).closest(".imogi-ts-manage-row");
			const name = $row.attr("data-name");
			imogi_ts_confirm(__("Hapus meja {0}? Tindakan ini tidak bisa dibatalkan.", [name]), () => {
				frappe.call({
					method: "imogi_pos.api.table_api.delete_restaurant_table",
					args: { name },
					freeze: true,
					callback: () => {
						frappe.show_alert({ message: __("Meja {0} dihapus", [name]), indicator: "orange" });
						this.refresh(() => this._bind_manage_rows(dialog));
					},
				});
			}, { parent_dialog: dialog });
		});
	}

	prompt_reservation() {
		const tables = this.board.tables || [];
		imogi_ts_open_form_dialog({
			title: __("Reservasi Baru"),
			subtitle: __("Catat tamu yang akan datang pada waktu tertentu"),
			icon: "fa-calendar-check-o",
			fields: [
				{ fieldname: "customer_name", fieldtype: "Data", label: __("Nama Tamu"), reqd: 1 },
				{ fieldname: "phone", fieldtype: "Data", label: __("Telepon") },
				{ fieldname: "party_size", fieldtype: "Int", label: __("Jumlah Tamu"), default: 2, reqd: 1 },
				{
					fieldname: "reservation_datetime",
					fieldtype: "Datetime",
					label: __("Waktu Reservasi"),
					default: imogi_ts_default_reservation_datetime(),
					reqd: 1,
				},
				{
					fieldname: "restaurant_table",
					fieldtype: "Select",
					label: __("Meja (opsional)"),
					options: imogi_ts_table_select_options(tables),
				},
				{ fieldname: "notes", fieldtype: "Small Text", label: __("Catatan") },
			],
			primary_label: __("Simpan Reservasi"),
			on_submit: (values) => {
				frappe.call({
					method: "imogi_pos.api.planned_features_api.create_table_reservation",
					args: { ...values, company: this.board.company },
					freeze: true,
					callback: () => {
						frappe.show_alert({ message: __("Reservasi dibuat"), indicator: "green" });
						this.refresh();
					},
				});
			},
		});
	}

	seat_reservation(row) {
		frappe.call({
			method: "imogi_pos.api.planned_features_api.seat_table_reservation_api",
			args: { name: row.name },
			freeze: true,
			callback: (r) => {
				const result = r.message || {};
				frappe.show_alert({ message: __("Tamu reservasi hadir"), indicator: "green" });
				this.refresh();
				if (!result.restaurant_table) {
					return;
				}
				if (!this.can_open_cashier()) {
					frappe.msgprint({
						title: __("Reservasi ditempatkan"),
						message: __(
							"Meja {0} siap. Buka order dari kasir atau minta kasir memproses order untuk {1}.",
							[result.table_number || result.restaurant_table, result.customer_name || row.customer_name]
						),
						indicator: "green",
					});
					return;
				}
				this.open_cashier_for_table(
					{
						name: result.restaurant_table,
						table_number: result.table_number || row.restaurant_table,
					},
					{
						customer_name: result.customer_name || row.customer_name,
						party_size: result.party_size || row.party_size,
					}
				);
			},
		});
	}

	can_open_cashier() {
		if (imogi_ts_is_dedicated_waiter()) {
			return true;
		}
		const roles = frappe.boot?.user?.roles || [];
		return roles.some((role) =>
			["IMOGI Cashier", "IMOGI Waiter", "IMOGI Supervisor", "IMOGI Manager", "IMOGI Owner", "Administrator", "System Manager", "Sales Manager"].includes(
				role
			)
		);
	}

	cancel_reservation(row) {
		frappe.confirm(__("Batalkan reservasi {0}?", [row.customer_name]), () => {
			frappe.call({
				method: "imogi_pos.api.planned_features_api.cancel_table_reservation_api",
				args: { name: row.name },
				freeze: true,
				callback: () => {
					frappe.show_alert({ message: __("Reservasi dibatalkan"), indicator: "orange" });
					this.refresh();
				},
			});
		});
	}

	prompt_waiting_guest() {
		imogi_ts_open_form_dialog({
			title: __("Tambah Antrian"),
			subtitle: __("Daftarkan tamu walk-in yang sedang menunggu meja"),
			icon: "fa-clock-o",
			fields: [
				{ fieldname: "customer_name", fieldtype: "Data", label: __("Nama Tamu"), reqd: 1 },
				{ fieldname: "phone", fieldtype: "Data", label: __("Telepon") },
				{ fieldname: "party_size", fieldtype: "Int", label: __("Jumlah Tamu"), default: 2, reqd: 1 },
				{ fieldname: "notes", fieldtype: "Small Text", label: __("Catatan") },
			],
			primary_label: __("Simpan Antrian"),
			on_submit: (values) => {
				frappe.call({
					method: "imogi_pos.api.planned_features_api.add_waiting_guest",
					args: { ...values, company: this.board.company },
					freeze: true,
					callback: () => {
						frappe.show_alert({ message: __("Tamu ditambahkan ke antrian"), indicator: "green" });
						this.refresh();
					},
				});
			},
		});
	}

	prompt_seat_waiting(row) {
		const available = (this.board.tables || []).filter((t) => t.status === "Available" || t.status === "Reserved");
		const fields = [
			{
				fieldname: "restaurant_table",
				fieldtype: available.length ? "Select" : "Link",
				label: __("Meja"),
				options: available.length ? ["", ...available.map((t) => t.name)] : "IMOGI Restaurant Table",
			},
		];
		frappe.prompt(
			fields,
			(values) => {
				frappe.call({
					method: "imogi_pos.api.planned_features_api.seat_waiting_guest",
					args: { name: row.name, restaurant_table: values.restaurant_table || null },
					freeze: true,
					callback: () => {
						frappe.show_alert({ message: __("Tamu ditempatkan"), indicator: "green" });
						this.refresh();
					},
				});
			},
			__("Tempatkan Tamu"),
			__("Simpan")
		);
	}

	cancel_waiting(row) {
		frappe.confirm(__("Batalkan antrian {0}?", [row.customer_name]), () => {
			frappe.call({
				method: "imogi_pos.api.planned_features_api.cancel_waiting_guest",
				args: { name: row.name },
				freeze: true,
				callback: () => {
					frappe.show_alert({ message: __("Antrian dibatalkan"), indicator: "orange" });
					this.refresh();
				},
			});
		});
	}

	show_table_qr(table) {
		frappe.call({
			method: "imogi_pos.api.qr_order_api.get_table_qr_link",
			args: { table: table.name },
			freeze: true,
			callback: (r) => {
				if (r.exc) return;
				const msg = r.message || {};
				const url = msg.url || "";
				const label = table.table_number || table.name;
				const dialog = new frappe.ui.Dialog({
					title: __("QR Meja {0}", [label]),
					fields: [
						{
							fieldtype: "HTML",
							fieldname: "qr_html",
							options: `<div class="imogi-ts-qr-dialog text-center">
								<p class="text-muted small">${__(
									"Tamu scan QR ini untuk pesan mandiri. Meja terdeteksi otomatis."
								)}</p>
								<div class="imogi-ts-qr-canvas my-3"></div>
								<div class="imogi-ts-qr-url small text-muted text-break"></div>
							</div>`,
						},
					],
					primary_action_label: __("Salin Link"),
					primary_action: () => {
						frappe.utils.copy_to_clipboard(url);
						frappe.show_alert({ message: __("Link disalin"), indicator: "green" });
					},
					secondary_action_label: __("Cetak"),
					secondary_action: () => {
						const $canvas = dialog.$wrapper.find(".imogi-ts-qr-canvas");
						const win = window.open("", "_blank");
						if (!win) return;
						win.document.write(
							`<html><head><title>QR Meja ${frappe.utils.escape_html(label)}</title></head><body style="text-align:center;font-family:sans-serif;padding:24px;"><h2>Meja ${frappe.utils.escape_html(label)}</h2>${$canvas.html()}<p style="font-size:12px;word-break:break-all;">${frappe.utils.escape_html(url)}</p></body></html>`
						);
						win.document.close();
						win.focus();
						win.print();
					},
				});
				dialog.show();
				dialog.$wrapper.find(".imogi-ts-qr-url").text(url);
				const render_qr = () => {
					const $holder = dialog.$wrapper.find(".imogi-ts-qr-canvas").empty();
					const $node = $('<div class="d-inline-block"></div>');
					$holder.append($node);
					new QRCode($node[0], {
						text: url,
						width: 220,
						height: 220,
						correctLevel: QRCode.CorrectLevel.L,
					});
				};
				if (typeof QRCode !== "undefined") {
					render_qr();
				} else {
					frappe.require("/assets/imogi_pos/js/qrcode.min.js").then(render_qr);
				}
			},
		});
	}
};
