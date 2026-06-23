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

const IMOGI_TS_V2_STYLE_ID = "imogi-ts-v2-css-b";

function imogi_ts_ensure_v2_css() {
	const legacy_id = "imogi-ts-v2-css";
	document.getElementById(legacy_id)?.remove();
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
			gap: 10px;
			grid-template-columns: repeat(4, minmax(0, 1fr));
			padding: 12px 16px;
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
			border-radius: 12px;
			display: flex;
			gap: 12px;
			min-width: 0;
			padding: 12px 14px;
		}
		.imogi-ts-shell--v2 .imogi-ts-kpi__icon {
			align-items: center;
			border-radius: 10px;
			color: #fff;
			display: flex;
			flex-shrink: 0;
			font-size: 16px;
			height: 40px;
			justify-content: center;
			width: 40px;
		}
		.imogi-ts-kpi--total .imogi-ts-kpi__icon { background: linear-gradient(135deg, #475569, #64748b); }
		.imogi-ts-kpi--available .imogi-ts-kpi__icon { background: linear-gradient(135deg, #15803d, #22c55e); }
		.imogi-ts-kpi--occupied .imogi-ts-kpi__icon { background: linear-gradient(135deg, #c2410c, #f97316); }
		.imogi-ts-kpi--waiting .imogi-ts-kpi__icon { background: linear-gradient(135deg, #1d4ed8, #3b82f6); }
		.imogi-ts-shell--v2 .imogi-ts-kpi__val {
			color: var(--ts-text);
			font-size: 22px;
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
			padding: 14px 16px 16px;
		}
		.imogi-ts-shell--v2 .imogi-ts-floor-head {
			align-items: flex-start;
			display: flex;
			flex-wrap: wrap;
			gap: 12px;
			justify-content: space-between;
			margin-bottom: 12px;
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
		.imogi-ts-shell--v2 .imogi-ts-empty,
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
		.imogi-ts-shell--v2 .imogi-ts-empty i {
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

const IMOGI_TS_MODAL_STYLE_ID = "imogi-ts-modal-css-v1";

function imogi_ts_ensure_modal_css() {
	if (document.getElementById(IMOGI_TS_MODAL_STYLE_ID)) {
		return;
	}
	frappe.dom.set_style(
		`
		.modal.imogi-ts-dialog { z-index: 2000 !important; }
		.modal.imogi-ts-dialog + .modal-backdrop { z-index: 1990 !important; }
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

function imogi_ts_build_manage_tables_html(tables) {
	if (!tables.length) {
		return `<div class="imogi-ts-dialog__empty-note">${__("Belum ada meja. Tambahkan meja pertama di bawah.")}</div>`;
	}
	const chips = tables
		.map((table) => {
			const status_class =
				table.status === "Occupied"
					? "is-occupied"
					: table.status === "Reserved"
						? "is-reserved"
						: "";
			return `
				<div class="imogi-ts-dialog__table-chip ${status_class}">
					<strong>${frappe.utils.escape_html(table.table_number || table.name)}</strong>
					<span>${frappe.utils.escape_html(table.location || __("Tanpa zona"))} · ${table.capacity || 0} ${__("org")}</span>
					<span>${frappe.utils.escape_html(table.status || "Available")}</span>
				</div>`;
		})
		.join("");
	return `<div class="imogi-ts-dialog__table-grid">${chips}</div>`;
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
	const dedicated = imogi_ts_is_dedicated_waiter();
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

	if (!dedicated) {
		frappe.breadcrumbs.add("Imogi POS");
	}
};

frappe.pages["table-service"].on_page_show = function (wrapper) {
	imogi_ts_apply_fullscreen(true);
	imogi_pos.activate_table_service_shell?.(wrapper);
	wrapper.table_service_page?.sync_shell?.();
};

frappe.pages["table-service"].on_page_hide = function () {
	imogi_ts_apply_fullscreen(false);
};

imogi_pos.TableService = class TableService {
	constructor(page, wrapper) {
		this.page = page;
		this.wrapper = $(page.body);
		this.$page_wrapper = wrapper ? $(wrapper) : this.wrapper.closest(".page-container");
		this.dedicated_waiter = imogi_ts_is_dedicated_waiter();
		this.board = { tables: [], reservations: [], waiting: [], features: {} };
		this.refresh_interval = 30;
		this.active_zone = __("Semua");
		imogi_ts_ensure_v2_css();
		this.make();
		this.refresh();
	}

	sync_shell() {
		imogi_ts_apply_fullscreen(true);
		imogi_pos.activate_table_service_shell?.(this.$page_wrapper?.[0]);
	}

	make() {
		const logo_url =
			frappe.boot?.imogi_pos_logo_white_url || "/assets/imogi_pos/images/imogi-pos-logo-white.png";
		const topbar = this.dedicated_waiter
			? `
				<div class="imogi-ts-topbar imogi-ts-topbar--desk">
					<div class="imogi-ts-topbar-left">
						<div class="imogi-ts-desk-brand">
							<img class="imogi-ts-desk-logo" src="${frappe.utils.escape_html(logo_url)}" alt="IMOGI" />
							<div class="imogi-ts-desk-brand-title">${__("Table Service")}</div>
						</div>
					</div>
					<div class="imogi-ts-topbar-right">
						<span class="imogi-ts-stat-pill">${__("Meja")} <span class="imogi-ts-stat-num imogi-ts-stat-tables">0</span></span>
						<span class="imogi-ts-stat-pill imogi-ts-stat-pill--reserved">${__("Reservasi")} <span class="imogi-ts-stat-num imogi-ts-stat-reservations">0</span></span>
						<span class="imogi-ts-stat-pill imogi-ts-stat-pill--waiting">${__("Antrian")} <span class="imogi-ts-stat-num imogi-ts-stat-waiting">0</span></span>
						<button type="button" class="btn btn-xs btn-default imogi-ts-refresh">
							<i class="fa fa-refresh"></i>
							<span class="imogi-ts-refresh-label">${__("Refresh")} 30s</span>
						</button>
						<button type="button" class="btn btn-xs btn-default imogi-ts-logout-btn">
							<i class="fa fa-sign-out"></i> ${__("Logout")}
						</button>
					</div>
				</div>`
			: `
				<div class="imogi-ts-topbar">
					<div class="imogi-kds-topbar-left">
						<div class="imogi-kds-brand">
							<div class="imogi-ts-brand-icon"><i class="fa fa-th"></i></div>
							<div>
								<div class="imogi-ts-brand-title">${__("Table Service")}</div>
								<div class="imogi-ts-brand-sub">${__("Meja, reservasi, dan antrian tamu")}</div>
							</div>
						</div>
					</div>
					<div class="imogi-kds-topbar-right">
						<span class="imogi-ts-stat-pill">${__("Meja")} <span class="imogi-ts-stat-num imogi-ts-stat-tables">0</span></span>
						<span class="imogi-ts-stat-pill imogi-ts-stat-pill--reserved">${__("Reservasi")} <span class="imogi-ts-stat-num imogi-ts-stat-reservations">0</span></span>
						<span class="imogi-ts-stat-pill imogi-ts-stat-pill--waiting">${__("Antrian")} <span class="imogi-ts-stat-num imogi-ts-stat-waiting">0</span></span>
						<button type="button" class="imogi-kds-refresh imogi-ts-refresh">
							<i class="fa fa-refresh"></i>
							<span class="imogi-ts-refresh-label">${__("Refresh")} 30s</span>
						</button>
					</div>
				</div>`;

		this.wrapper.html(`
			<div class="imogi-ts-shell imogi-ts-shell--v2 ${this.dedicated_waiter ? "imogi-ts-shell--desk" : ""}">
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
								<p class="imogi-ts-floor-sub">${__("Kelola meja, order, pindah, dan gabung meja")}</p>
							</div>
							<div class="imogi-ts-floor-toolbar">
								<div class="imogi-ts-legend">
									<span class="imogi-ts-legend-item"><span class="imogi-ts-legend-dot imogi-ts-legend-dot--available"></span>${__("Kosong")}</span>
									<span class="imogi-ts-legend-item"><span class="imogi-ts-legend-dot imogi-ts-legend-dot--occupied"></span>${__("Terisi")}</span>
									<span class="imogi-ts-legend-item"><span class="imogi-ts-legend-dot imogi-ts-legend-dot--reserved"></span>${__("Dipesan")}</span>
								</div>
								<button type="button" class="btn btn-xs btn-default imogi-ts-manage-btn imogi-ts-new-table">
									<i class="fa fa-cog"></i> ${__("Kelola Meja")}
								</button>
							</div>
						</div>
						<div class="imogi-ts-zone-filter"></div>
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
		this.$zone_filter = this.wrapper.find(".imogi-ts-zone-filter");
		this.$reservation_list = this.wrapper.find(".imogi-ts-reservation-list");
		this.$waiting_list = this.wrapper.find(".imogi-ts-waiting-list");

		this.wrapper.find(".imogi-ts-refresh").on("click", () => this.refresh());
		this.wrapper.find(".imogi-ts-logout-btn").on("click", () => {
			frappe.confirm(__("Logout dari Table Service?"), () => {
				frappe.call({ method: "logout", callback: () => (window.location.href = "/login") });
			});
		});
		this.wrapper.find(".imogi-ts-new-table").on("click", () => this.prompt_manage_tables());
		this.wrapper.find(".imogi-ts-add-reservation").on("click", () => this.prompt_reservation());
		this.wrapper.find(".imogi-ts-add-waiting").on("click", () => this.prompt_waiting_guest());
		imogi_ts_paint_desk_topbar(this.wrapper[0]);
	}

	refresh() {
		frappe.call({
			method: "imogi_pos.api.table_api.get_table_service_board",
			callback: (r) => {
				this.board = r.message || this.board;
				this.render();
				this._apply_refresh_timer(this.board.refresh_seconds);
			},
		});
	}

	_apply_refresh_timer(seconds) {
		if (this._timer) clearInterval(this._timer);
		this.refresh_interval = cint(seconds) || 30;
		this.wrapper.find(".imogi-ts-refresh-label").text(`${__("Refresh")} ${this.refresh_interval}s`);
		this._timer = setInterval(() => this.refresh(), this.refresh_interval * 1000);
	}

	render() {
		const { tables = [], reservations = [], waiting = [], features = {} } = this.board;
		const available_count = tables.filter((t) => t.status === "Available").length;
		const occupied_count = tables.filter((t) => t.status === "Occupied").length;

		this.wrapper.find(".imogi-ts-stat-tables, .imogi-ts-kpi-total").text(tables.length);
		this.wrapper.find(".imogi-ts-kpi-available").text(available_count);
		this.wrapper.find(".imogi-ts-kpi-occupied").text(occupied_count);
		this.wrapper.find(".imogi-ts-stat-reservations, .imogi-ts-side-count-reservations").text(reservations.length);
		this.wrapper.find(".imogi-ts-stat-waiting, .imogi-ts-kpi-waiting, .imogi-ts-side-count-waiting").text(waiting.length);

		this.wrapper.find(".imogi-ts-add-reservation").toggle(!!features.table_reservation);
		this.wrapper.find(".imogi-ts-panel--reservations").toggle(!!features.table_reservation);
		this.wrapper.find(".imogi-ts-add-waiting").toggle(!!features.waiting_list);
		this.wrapper.find(".imogi-ts-panel--waiting").toggle(!!features.waiting_list);

		this.render_tables(tables, features);
		this.render_reservations(reservations, features);
		this.render_waiting(waiting, features);
	}

	render_zone_filter(tables) {
		if (!this.$zone_filter?.length) {
			return;
		}
		const zones = [
			...new Set(
				tables.map((table) => (table.location || "").trim() || __("Tanpa zona"))
			),
		].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

		if (!zones.length) {
			this.$zone_filter.empty();
			return;
		}

		const all_label = __("Semua");
		const chips = [
			`<button type="button" class="imogi-ts-zone-chip ${this.active_zone === all_label ? "is-active" : ""}" data-zone="__all__">${frappe.utils.escape_html(all_label)}</button>`,
			...zones.map((zone) => {
				const active = this.active_zone === zone ? "is-active" : "";
				return `<button type="button" class="imogi-ts-zone-chip ${active}" data-zone="${frappe.utils.escape_html(zone)}">${frappe.utils.escape_html(zone)}</button>`;
			}),
		];
		this.$zone_filter.html(chips.join(""));
		this.$zone_filter.off("click.zone").on("click.zone", ".imogi-ts-zone-chip", (e) => {
			const zone = $(e.currentTarget).attr("data-zone");
			this.active_zone = zone === "__all__" ? all_label : String(zone || "");
			this.render_tables(this.board.tables || [], this.board.features || {});
		});
	}

	render_tables(tables, features) {
		this.render_zone_filter(tables);
		const all_label = __("Semua");
		const filtered_tables =
			this.active_zone && this.active_zone !== all_label
				? tables.filter((table) => {
						const zone = (table.location || "").trim() || __("Tanpa zona");
						return zone === this.active_zone;
					})
				: tables;

		this.$table_grid.empty();
		if (!filtered_tables.length) {
			const empty_msg = tables.length
				? __("Tidak ada meja di zona ini.")
				: __("Buat meja restoran terlebih dahulu.");
			this.$table_grid.html(`
				<div class="imogi-ts-empty">
					<i class="fa fa-th-large"></i>
					<h4>${tables.length ? __("Zona kosong") : __("Belum ada meja")}</h4>
					<p>${empty_msg}</p>
				</div>`);
			return;
		}

		filtered_tables.forEach((table) => {
			const status_class = IMOGI_TABLE_STATUS_CLASS[table.status] || "";
			const status_label = IMOGI_TS_STATUS_LABEL[table.status] || table.status || "Available";
			const zone_label = (table.location || "").trim() || __("Tanpa zona");
			const $card = $(`
				<article class="imogi-ts-table-card ${status_class}">
					<div class="imogi-ts-table-card__main">
						<div class="imogi-ts-table-card__info">
							<div class="imogi-ts-table-num">${frappe.utils.escape_html(table.table_number || table.name)}</div>
							<div class="imogi-ts-table-meta-row">
								<span class="imogi-ts-table-zone">${frappe.utils.escape_html(zone_label)}</span>
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
				$card.find(".imogi-ts-table-order").html(`
					<div class="imogi-ts-order-ref">${frappe.utils.escape_html(table.open_order)}</div>
					<div class="imogi-ts-order-meta">${frappe.utils.escape_html(table.open_order_customer || __("Walk-in"))} · ${format_currency(table.open_order_total || 0)}</div>
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
				$actions.addClass("imogi-ts-table-actions--single");
				$actions.append(`<button type="button" class="imogi-ts-act imogi-ts-act--primary" data-action="new-order"><i class="fa fa-plus"></i> ${__("Order Baru")}</button>`);
			} else {
				$actions.remove();
			}

			$card.on("click", "[data-action='open-order']", (e) => {
				e.stopPropagation();
				frappe.set_route("Form", "Riwayat Order", table.open_order);
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

			this.$table_grid.append($card);
		});
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
					options: available.map((t) => t.name),
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
					options: sources.map((t) => t.name),
					reqd: 1,
					description: sources
						.map(
							(t) =>
								`${t.table_number || t.name}: ${t.open_order} · ${format_currency(t.open_order_total || 0)}`
						)
						.join(" · "),
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

	prompt_manage_tables() {
		const tables = this.board.tables || [];
		const dialog = imogi_ts_open_form_dialog({
			title: __("Kelola Meja"),
			subtitle: __("Lihat meja yang ada dan tambahkan meja baru untuk layanan"),
			icon: "fa-th-large",
			wide: true,
			fields: [
				{
					fieldname: "tables_html",
					fieldtype: "HTML",
					options: imogi_ts_build_manage_tables_html(tables),
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
					fieldname: "location",
					fieldtype: "Data",
					label: __("Zona / Lokasi"),
					default: "Indoor",
				},
			],
			primary_label: __("Simpan Meja"),
			on_submit: (values) => {
				if (!values.table_number?.trim()) {
					frappe.msgprint(__("Nomor meja wajib diisi"));
					return false;
				}
				frappe.call({
					method: "imogi_pos.api.table_api.create_restaurant_table",
					args: {
						table_number: values.table_number.trim(),
						capacity: values.capacity,
						location: values.location,
						company: this.board.company,
					},
					freeze: true,
					callback: () => {
						frappe.show_alert({ message: __("Meja {0} berhasil ditambahkan", [values.table_number.trim()]), indicator: "green" });
						this.refresh();
					},
				});
			},
		});
		dialog.set_secondary_action_label(__("Tutup"));
		dialog.set_secondary_action(() => dialog.hide());
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
};
