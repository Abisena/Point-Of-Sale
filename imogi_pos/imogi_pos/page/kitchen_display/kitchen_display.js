frappe.pages["kitchen-display"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Kitchen Display"),
		single_column: true,
	});

	page.main.addClass("imogi-kds-page");
	new imogi_pos.KitchenDisplay(page);
	frappe.breadcrumbs.add("Imogi POS");
};

const IMOGI_KDS_ORDER_TYPE_META = {
	"Dine-in": { icon: "fa-cutlery", tone: "dine" },
	Takeaway: { icon: "fa-shopping-bag", tone: "take" },
	Delivery: { icon: "fa-motorcycle", tone: "delivery" },
};

const IMOGI_KDS_PENDING_URGENT_MINUTES = 5;
const IMOGI_KDS_BUILD = "20260710-grouped-v10";
const IMOGI_KDS_MAX_VISIBLE_ITEMS = 5;

imogi_pos.KitchenDisplay = class KitchenDisplay {
	constructor(page) {
		this.page = page;
		this.wrapper = $(page.body);
		this.refresh_interval = 30;
		this.orders = [];
		this.station_filter = null;
		this._known_order_ids = new Set();
		this._expanded_items = {};
		this._audio_ctx = null;
		this.activate_fullscreen();
		this.make();
		this.load_settings();
		this.update_clocks();
		this.refresh();
		this.bind_realtime();
		this._clock_timer = setInterval(() => this.update_clocks(), 1000);
		this.page.on_page_hide?.(() => {
			clearInterval(this._timer);
			clearInterval(this._clock_timer);
			this.deactivate_fullscreen();
		});
	}

	logo_url() {
		return (
			frappe.boot?.imogi_pos_logo_white_url ||
			"/assets/imogi_pos/images/imogi-pos-logo-white.png"
		);
	}

	activate_fullscreen() {
		this.inject_css();
		document.body.classList.add("imogi-kds-fullscreen", "imogi-pos-themed");
		document.querySelectorAll(".page-head, .sticky-top").forEach((el) => {
			el.style.setProperty("display", "none", "important");
		});
	}

	inject_css() {
		// Inject critical navy/fullscreen styles inline so the theme always tracks
		// this page JS (avoids stale /assets/imogi_pos/css/imogi_pos.css cache).
		const ID = "imogi-kds-inline-css-v10";
		if (document.getElementById(ID)) return;
		[
			"imogi-kds-inline-css",
			"imogi-kds-inline-css-v1",
			"imogi-kds-inline-css-v2",
			"imogi-kds-inline-css-v3",
			"imogi-kds-inline-css-v4",
			"imogi-kds-inline-css-v5",
			"imogi-kds-inline-css-v6",
			"imogi-kds-inline-css-v7",
			"imogi-kds-inline-css-v8",
			"imogi-kds-inline-css-v9",
		].forEach((id) => document.getElementById(id)?.remove());
		if (!document.getElementById("imogi-kds-font-plus-jakarta")) {
			const link = document.createElement("link");
			link.id = "imogi-kds-font-plus-jakarta";
			link.rel = "stylesheet";
			link.href =
				"https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap";
			document.head.appendChild(link);
		}
		const style = document.createElement("style");
		style.id = ID;
		style.textContent = `
			:root {
				--kds-bg: #04060c;
				--kds-bg-2: #0a0f1a;
				--kds-surface: rgba(12, 18, 32, 0.72);
				--kds-surface-2: rgba(20, 28, 48, 0.55);
				--kds-border: rgba(148, 163, 184, 0.1);
				--kds-border-bright: rgba(255, 255, 255, 0.08);
				--kds-text: #f8fafc;
				--kds-muted: #8b9cb3;
				--kds-pending: #5eead4;
				--kds-pending-2: #38bdf8;
				--kds-pending-dim: rgba(94, 234, 212, 0.12);
				--kds-cooking: #fcd34d;
				--kds-cooking-2: #fb923c;
				--kds-cooking-dim: rgba(252, 211, 77, 0.12);
				--kds-success: #4ade80;
				--kds-danger: #fb7185;
				--kds-radius: 20px;
				--kds-radius-sm: 14px;
				--kds-font: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
			}

			body.imogi-kds-fullscreen .page-head,
			body.imogi-kds-fullscreen .navbar,
			body.imogi-kds-fullscreen .desk-sidebar,
			body.imogi-kds-fullscreen .body-sidebar,
			body.imogi-kds-fullscreen .layout-side-section { display: none !important; }

			body.imogi-kds-fullscreen,
			body.imogi-kds-fullscreen .main-section,
			body.imogi-kds-fullscreen .page-container,
			body.imogi-kds-fullscreen .container,
			body.imogi-kds-fullscreen .layout-main,
			body.imogi-kds-fullscreen .layout-main-section-wrapper,
			body.imogi-kds-fullscreen .layout-main-section,
			body.imogi-kds-fullscreen .page-body {
				background: var(--kds-bg) !important;
				background-image:
					radial-gradient(ellipse 90% 70% at 0% -20%, rgba(94, 234, 212, 0.09), transparent 50%),
					radial-gradient(ellipse 80% 60% at 100% -10%, rgba(251, 146, 60, 0.08), transparent 45%),
					radial-gradient(ellipse 60% 40% at 50% 100%, rgba(56, 189, 248, 0.05), transparent 50%),
					linear-gradient(165deg, var(--kds-bg) 0%, var(--kds-bg-2) 100%) !important;
				margin: 0 !important;
				max-width: 100% !important;
				padding: 0 !important;
				width: 100% !important;
			}

			body.imogi-kds-fullscreen .imogi-kds-page.layout-main-section,
			body.imogi-kds-fullscreen .imogi-kds-page {
				box-sizing: border-box;
				display: flex !important;
				flex-direction: column;
				height: 100dvh !important;
				max-height: 100dvh !important;
				min-height: 0;
				overflow: hidden !important;
				padding: 0 !important;
			}

			body.imogi-kds-fullscreen .imogi-kds-page .layout-main-section-wrapper,
			body.imogi-kds-fullscreen .imogi-kds-page .page-body {
				display: flex !important;
				flex: 1;
				flex-direction: column;
				min-height: 0;
				overflow: hidden;
			}

			body.imogi-kds-fullscreen .imogi-kds-shell {
				color: var(--kds-text) !important;
				display: flex !important;
				flex: 1;
				flex-direction: column;
				font-family: var(--kds-font) !important;
				max-width: 100% !important;
				min-height: 0 !important;
				padding: 0 !important;
				position: relative;
			}
			.imogi-kds-bg-grid {
				background-image: radial-gradient(rgba(148, 163, 184, 0.055) 1px, transparent 1px);
				background-size: 28px 28px;
				inset: 0;
				mask-image: linear-gradient(180deg, #000 0%, #000 70%, transparent 100%);
				pointer-events: none;
				position: absolute;
				z-index: 0;
			}
			.imogi-kds-shell > *:not(.imogi-kds-bg-grid) { position: relative; z-index: 1; }

			/* ── App bar ── */
			.imogi-kds-appbar {
				align-items: center;
				backdrop-filter: blur(20px) saturate(1.4);
				background: rgba(4, 6, 12, 0.75) !important;
				border-bottom: 1px solid var(--kds-border);
				box-shadow: 0 1px 0 var(--kds-border-bright), 0 8px 32px rgba(0, 0, 0, 0.35);
				display: flex;
				flex-shrink: 0;
				flex-wrap: wrap;
				gap: 16px 24px;
				justify-content: space-between;
				min-height: 72px;
				padding: 14px 24px;
			}
			.imogi-kds-appbar-brand { align-items: center; display: flex; gap: 14px; min-width: 0; }
			.imogi-kds-logo {
				filter: drop-shadow(0 2px 10px rgba(0,0,0,0.35));
				flex-shrink: 0;
				height: 34px !important;
				max-height: 34px !important;
				object-fit: contain;
				width: auto !important;
			}
			.imogi-kds-appbar-titles { min-width: 0; }
			.imogi-kds-appbar .imogi-kds-brand-title {
				background: linear-gradient(135deg, #fff 30%, #cbd5e1 100%);
				-webkit-background-clip: text;
				background-clip: text;
				color: transparent !important;
				font-size: 20px !important;
				font-weight: 800 !important;
				letter-spacing: -0.03em;
				line-height: 1.15;
			}
			.imogi-kds-appbar .imogi-kds-brand-sub {
				color: var(--kds-muted) !important;
				font-size: 12px !important;
				font-weight: 500 !important;
				margin-top: 2px;
			}
			.imogi-kds-live {
				align-items: center;
				background: rgba(74, 222, 128, 0.1) !important;
				border: 1px solid rgba(74, 222, 128, 0.25);
				border-radius: 999px;
				color: var(--kds-success) !important;
				display: inline-flex;
				font-size: 10px !important;
				font-weight: 700 !important;
				gap: 7px;
				letter-spacing: 0.08em;
				padding: 6px 12px;
				text-transform: uppercase;
			}
			.imogi-kds-live-dot {
				animation: imogi-kds-pulse 2s ease infinite;
				background: var(--kds-success) !important;
				border-radius: 50%;
				box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.5);
				height: 7px;
				width: 7px;
			}
			@keyframes imogi-kds-pulse {
				0%, 100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.45); opacity: 1; }
				50% { box-shadow: 0 0 0 6px rgba(74, 222, 128, 0); opacity: 0.7; }
			}
			.imogi-kds-appbar-right { align-items: center; display: flex; flex-wrap: wrap; gap: 10px; }
			.imogi-kds-station-tabs {
				align-items: center;
				background: var(--kds-surface-2);
				border: 1px solid var(--kds-border);
				border-radius: 999px;
				box-shadow: inset 0 1px 0 var(--kds-border-bright);
				display: flex;
				gap: 3px;
				padding: 4px;
			}
			.imogi-kds-station-tab {
				background: transparent;
				border: none;
				border-radius: 999px;
				color: var(--kds-muted) !important;
				cursor: pointer;
				font-family: var(--kds-font) !important;
				font-size: 12px !important;
				font-weight: 600 !important;
				padding: 8px 16px;
				transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
			}
			.imogi-kds-station-tab:hover { background: rgba(255,255,255,0.05); color: #fff !important; }
			.imogi-kds-station-tab.is-active {
				background: linear-gradient(135deg, #fff, #e2e8f0) !important;
				box-shadow: 0 2px 12px rgba(0,0,0,0.25), 0 1px 0 rgba(255,255,255,0.8) inset;
				color: #0f172a !important;
			}
			.imogi-kds-stats { display: flex; gap: 8px; }
			.imogi-kds-stat-card {
				align-items: center;
				background: var(--kds-surface-2);
				border: 1px solid var(--kds-border);
				border-radius: var(--kds-radius-sm);
				box-shadow: inset 0 1px 0 var(--kds-border-bright);
				display: flex;
				flex-direction: column;
				gap: 1px;
				min-width: 64px;
				padding: 8px 14px;
			}
			.imogi-kds-stat-card-label {
				color: var(--kds-muted) !important;
				font-size: 9px !important;
				font-weight: 600 !important;
				letter-spacing: 0.06em;
				text-transform: uppercase;
			}
			.imogi-kds-stat-card-num {
				color: #fff !important;
				font-size: 20px !important;
				font-variant-numeric: tabular-nums;
				font-weight: 800 !important;
				line-height: 1.1;
			}
			.imogi-kds-stat-card--pending .imogi-kds-stat-card-num { color: var(--kds-pending) !important; }
			.imogi-kds-stat-card--cooking .imogi-kds-stat-card-num { color: var(--kds-cooking) !important; }
			.imogi-kds-stat-pill { display: none !important; }
			.imogi-kds-clock-wrap {
				align-items: center;
				background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
				border: 1px solid var(--kds-border);
				border-radius: var(--kds-radius-sm);
				box-shadow: inset 0 1px 0 var(--kds-border-bright);
				display: inline-flex;
				gap: 10px;
				padding: 10px 16px;
			}
			.imogi-kds-clock-wrap i { color: var(--kds-muted); font-size: 14px; }
			.imogi-kds-clock {
				color: #fff !important;
				font-size: 18px !important;
				font-variant-numeric: tabular-nums;
				font-weight: 800 !important;
				letter-spacing: 0.06em;
			}
			.imogi-kds-refresh {
				align-items: center;
				background: var(--kds-surface-2) !important;
				border: 1px solid var(--kds-border) !important;
				border-radius: var(--kds-radius-sm) !important;
				color: var(--kds-muted) !important;
				cursor: pointer;
				display: inline-flex;
				font-size: 11px !important;
				font-weight: 600 !important;
				gap: 6px;
				padding: 8px 12px;
				transition: all 0.15s ease;
			}
			.imogi-kds-refresh:hover { background: rgba(255,255,255,0.08) !important; color: #fff !important; }
			.imogi-kds-logout {
				align-items: center;
				background: rgba(248, 113, 113, 0.1) !important;
				border: 1px solid rgba(248, 113, 113, 0.28) !important;
				border-radius: var(--kds-radius-sm) !important;
				color: #fca5a5 !important;
				cursor: pointer;
				display: inline-flex;
				font-size: 11px !important;
				font-weight: 600 !important;
				gap: 6px;
				padding: 8px 12px;
				transition: all 0.15s ease;
			}
			.imogi-kds-logout:hover { background: rgba(248, 113, 113, 0.2) !important; color: #fff !important; }

			/* ── Board & columns ── */
			body.imogi-kds-fullscreen .imogi-kds-board {
				display: grid !important;
				flex: 1;
				gap: 20px;
				grid-template-columns: repeat(2, minmax(0, 1fr));
				min-height: 0;
				overflow: hidden;
				padding: 20px 24px 24px !important;
			}
			@media (max-width: 900px) {
				body.imogi-kds-fullscreen .imogi-kds-board { grid-template-columns: 1fr !important; }
			}
			.imogi-kds-column {
				backdrop-filter: blur(24px) saturate(1.3);
				background: var(--kds-surface) !important;
				border: 1px solid var(--kds-border) !important;
				border-radius: var(--kds-radius) !important;
				box-shadow: 0 0 0 1px var(--kds-border-bright) inset, 0 20px 50px rgba(0, 0, 0, 0.35), 0 4px 16px rgba(0, 0, 0, 0.2) !important;
				display: flex !important;
				flex-direction: column;
				min-height: 0;
				overflow: hidden;
				position: relative;
			}
			.imogi-kds-column::before {
				content: "";
				height: 2px;
				left: 20px;
				position: absolute;
				right: 20px;
				top: 0;
			}
			.imogi-kds-column--pending::before {
				background: linear-gradient(90deg, transparent, var(--kds-pending), var(--kds-pending-2), transparent);
				box-shadow: 0 0 20px rgba(94, 234, 212, 0.4);
			}
			.imogi-kds-column--preparing::before {
				background: linear-gradient(90deg, transparent, var(--kds-cooking), var(--kds-cooking-2), transparent);
				box-shadow: 0 0 20px rgba(252, 211, 77, 0.35);
			}
			.imogi-kds-column--pending { border-top: none !important; }
			.imogi-kds-column--preparing { border-top: none !important; }
			.imogi-kds-column-head {
				align-items: center;
				background: transparent !important;
				border-bottom: 1px solid var(--kds-border) !important;
				display: flex;
				gap: 14px;
				justify-content: space-between;
				padding: 20px 20px 16px !important;
			}
			.imogi-kds-column-icon {
				align-items: center;
				border-radius: 14px;
				display: flex;
				flex-shrink: 0;
				font-size: 17px;
				height: 48px;
				justify-content: center;
				width: 48px;
			}
			.imogi-kds-column--pending .imogi-kds-column-icon {
				background: var(--kds-pending-dim) !important;
				box-shadow: 0 0 24px rgba(94, 234, 212, 0.15);
				color: var(--kds-pending) !important;
			}
			.imogi-kds-column--preparing .imogi-kds-column-icon {
				background: var(--kds-cooking-dim) !important;
				box-shadow: 0 0 24px rgba(252, 211, 77, 0.12);
				color: var(--kds-cooking) !important;
			}
			.imogi-kds-column-head-text { flex: 1; min-width: 0; }
			.imogi-kds-column-title {
				color: #fff !important;
				font-size: 16px !important;
				font-weight: 700 !important;
				letter-spacing: -0.02em;
				line-height: 1.2;
			}
			.imogi-kds-column-sub {
				color: var(--kds-muted) !important;
				font-size: 12px !important;
				font-weight: 500 !important;
				margin-top: 3px;
			}
			.imogi-kds-column-count {
				align-items: center;
				background: rgba(255,255,255,0.04) !important;
				border: 1px solid var(--kds-border) !important;
				border-radius: 12px !important;
				color: #fff !important;
				display: inline-flex;
				font-size: 22px !important;
				font-variant-numeric: tabular-nums;
				font-weight: 800 !important;
				justify-content: center;
				min-width: 48px;
				padding: 8px 14px !important;
			}
			.imogi-kds-column--pending .imogi-kds-column-count {
				border-color: rgba(94, 234, 212, 0.2) !important;
				color: var(--kds-pending) !important;
				text-shadow: 0 0 20px rgba(94, 234, 212, 0.3);
			}
			.imogi-kds-column--preparing .imogi-kds-column-count {
				border-color: rgba(252, 211, 77, 0.2) !important;
				color: var(--kds-cooking) !important;
				text-shadow: 0 0 20px rgba(252, 211, 77, 0.25);
			}
			.imogi-kds-column-body {
				background: transparent !important;
				display: flex !important;
				flex: 1;
				flex-direction: column;
				gap: 10px;
				min-height: 0;
				overflow-y: auto;
				padding: 12px 14px 14px !important;
				scrollbar-color: rgba(148,163,184,0.3) transparent;
				scrollbar-width: thin;
			}
			.imogi-kds-column-body::-webkit-scrollbar { width: 5px; }
			.imogi-kds-column-body::-webkit-scrollbar-thumb {
				background: rgba(148,163,184,0.25);
				border-radius: 999px;
			}

			/* ── Empty states ── */
			.imogi-kds-empty,
			.imogi-kds-page-empty {
				align-items: center;
				color: var(--kds-muted) !important;
				display: flex;
				flex: 1;
				flex-direction: column;
				gap: 14px;
				justify-content: center;
				padding: 48px 24px;
				text-align: center;
			}
			.imogi-kds-empty-visual { position: relative; }
			.imogi-kds-empty-glow {
				animation: imogi-kds-float 4s ease-in-out infinite;
				border-radius: 50%;
				filter: blur(28px);
				height: 80px;
				left: 50%;
				position: absolute;
				top: 50%;
				transform: translate(-50%, -50%);
				width: 80px;
			}
			.imogi-kds-column--pending .imogi-kds-empty-glow,
			.imogi-kds-page-empty .imogi-kds-empty-glow { background: rgba(94, 234, 212, 0.25); }
			.imogi-kds-column--preparing .imogi-kds-empty-glow { background: rgba(252, 211, 77, 0.2); }
			@keyframes imogi-kds-float {
				0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
				50% { transform: translate(-50%, -55%) scale(1.1); opacity: 1; }
			}
			.imogi-kds-empty-icon,
			.imogi-kds-page-empty-icon {
				align-items: center;
				backdrop-filter: blur(8px);
				background: rgba(255,255,255,0.04) !important;
				border: 1px solid var(--kds-border) !important;
				border-radius: 20px;
				color: var(--kds-muted) !important;
				display: flex;
				font-size: 26px;
				height: 72px;
				justify-content: center;
				position: relative;
				width: 72px;
				z-index: 1;
			}
			.imogi-kds-column--pending .imogi-kds-empty-icon { color: var(--kds-pending) !important; }
			.imogi-kds-column--preparing .imogi-kds-empty-icon { color: var(--kds-cooking) !important; }
			.imogi-kds-page-empty h4,
			.imogi-kds-empty-title {
				color: #e2e8f0 !important;
				font-size: 16px !important;
				font-weight: 700 !important;
				letter-spacing: -0.01em;
				margin: 0;
			}
			.imogi-kds-page-empty p,
			.imogi-kds-empty-desc {
				color: var(--kds-muted) !important;
				font-size: 13px !important;
				line-height: 1.55;
				margin: 0;
				max-width: 280px;
			}

			/* ── Ticket cards ── */
			@keyframes imogi-kds-ticket-in {
				from { opacity: 0; transform: translateY(10px) scale(0.98); }
				to { opacity: 1; transform: translateY(0) scale(1); }
			}
			.imogi-kds-ticket {
				animation: imogi-kds-ticket-in 0.35s cubic-bezier(0.4, 0, 0.2, 1) both;
				background: linear-gradient(165deg, #ffffff 0%, #f8fafc 100%) !important;
				border: 1px solid rgba(255, 255, 255, 0.9) !important;
				border-radius: 16px !important;
				box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.04), 0 4px 6px rgba(0,0,0,0.04), 0 16px 40px rgba(0,0,0,0.12) !important;
				color: #0f172a !important;
				overflow: hidden;
				position: relative;
				transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.22s ease;
			}
			.imogi-kds-ticket:hover {
				box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.06), 0 8px 16px rgba(0,0,0,0.08), 0 24px 48px rgba(0,0,0,0.14) !important;
				transform: translateY(-3px);
			}
			.imogi-kds-ticket.is-urgent {
				border-color: #fca5a5 !important;
				box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.25), 0 8px 24px rgba(239, 68, 68, 0.12) !important;
			}
			.imogi-kds-ticket-accent {
				height: 3px;
				left: 0;
				position: absolute;
				right: 0;
				top: 0;
			}
			.imogi-kds-ticket--dine .imogi-kds-ticket-accent { background: linear-gradient(90deg, #6366f1, #818cf8); }
			.imogi-kds-ticket--take .imogi-kds-ticket-accent { background: linear-gradient(90deg, #0ea5e9, #38bdf8); }
			.imogi-kds-ticket--delivery .imogi-kds-ticket-accent { background: linear-gradient(90deg, #f59e0b, #fb923c); }
			.imogi-kds-ticket--default .imogi-kds-ticket-accent { background: linear-gradient(90deg, #64748b, #94a3b8); }
			.imogi-kds-ticket-body { display: flex; flex-direction: column; gap: 14px; padding: 16px 16px 14px; }
			.imogi-kds-ticket-hero { align-items: flex-start; display: flex; gap: 14px; }
			.imogi-kds-ticket-qty {
				align-items: center;
				background: linear-gradient(135deg, #fff7ed, #ffedd5) !important;
				border: 1px solid #fed7aa !important;
				border-radius: 12px;
				box-shadow: 0 2px 8px rgba(234, 88, 12, 0.1);
				color: #c2410c !important;
				display: inline-flex;
				flex-shrink: 0;
				font-size: 22px !important;
				font-variant-numeric: tabular-nums;
				font-weight: 800 !important;
				justify-content: center;
				line-height: 1;
				min-width: 52px;
				padding: 12px 10px;
			}
			.imogi-kds-ticket--ready .imogi-kds-ticket-qty {
				background: #f1f5f9 !important;
				border-color: #e2e8f0 !important;
				color: #94a3b8 !important;
			}
			.imogi-kds-ticket-item { flex: 1; min-width: 0; }
			.imogi-kds-ticket-name {
				color: #0f172a !important;
				font-size: 18px !important;
				font-weight: 800 !important;
				letter-spacing: -0.02em;
				line-height: 1.25;
			}
			.imogi-kds-ticket--ready .imogi-kds-ticket-name {
				color: #94a3b8 !important;
				text-decoration: line-through;
			}
			.imogi-kds-ticket-note {
				color: #64748b !important;
				font-size: 12px !important;
				font-weight: 500 !important;
				margin-top: 3px;
			}
			.imogi-kds-ticket-meta {
				align-items: center;
				display: flex;
				flex-wrap: wrap;
				gap: 6px;
			}
			.imogi-kds-ticket-order {
				color: #64748b !important;
				font-size: 12px !important;
				font-variant-numeric: tabular-nums;
				font-weight: 700 !important;
				margin-right: 2px;
			}
			.imogi-kds-chip {
				align-items: center;
				border-radius: 8px;
				display: inline-flex;
				font-size: 10px !important;
				font-weight: 700 !important;
				gap: 4px;
				letter-spacing: 0.04em;
				padding: 5px 9px;
				text-transform: uppercase;
			}
			.imogi-kds-chip--dine { background: #eef2ff !important; color: #4338ca !important; }
			.imogi-kds-chip--take { background: #e0f2fe !important; color: #0369a1 !important; }
			.imogi-kds-chip--delivery { background: #fff7ed !important; color: #c2410c !important; }
			.imogi-kds-chip--default { background: #f1f5f9 !important; color: #475569 !important; }
			.imogi-kds-chip--kitchen { background: #fff7ed !important; color: #c2410c !important; }
			.imogi-kds-chip--bar { background: #e0f2fe !important; color: #0369a1 !important; }
			.imogi-kds-chip--table { background: #eef2ff !important; color: #4338ca !important; }
			.imogi-kds-ticket-customer {
				align-items: center;
				color: #475569 !important;
				display: flex;
				font-size: 12px !important;
				font-weight: 600 !important;
				gap: 6px;
			}
			.imogi-kds-ticket-customer i { color: #94a3b8; font-size: 11px; }
			.imogi-kds-ticket-timer {
				align-items: center;
				display: flex;
				gap: 10px;
			}
			.imogi-kds-timer {
				align-items: center;
				background: #f8fafc !important;
				border-radius: 8px;
				color: #475569 !important;
				display: inline-flex;
				flex-shrink: 0;
				font-size: 11px !important;
				font-weight: 600 !important;
				gap: 5px;
				padding: 5px 9px;
			}
			.imogi-kds-timer-value {
				color: #0f172a !important;
				font-size: 12px !important;
				font-variant-numeric: tabular-nums;
				font-weight: 800 !important;
			}
			.imogi-kds-timer.is-urgent { background: #fef2f2 !important; color: #b91c1c !important; }
			.imogi-kds-timer.is-urgent .imogi-kds-timer-value { color: #dc2626 !important; }
			.imogi-kds-sla {
				background: #e2e8f0 !important;
				border-radius: 999px;
				flex: 1;
				height: 5px;
				overflow: hidden;
			}
			.imogi-kds-sla-fill {
				background: linear-gradient(90deg, #4ade80, #22c55e) !important;
				border-radius: 999px;
				box-shadow: 0 0 8px rgba(74, 222, 128, 0.4);
				height: 100%;
				transition: width 0.4s ease;
			}
			.imogi-kds-sla-fill.is-warning { background: linear-gradient(90deg, #fcd34d, #f59e0b) !important; box-shadow: 0 0 8px rgba(251, 191, 36, 0.35); }
			.imogi-kds-sla-fill.is-urgent { background: linear-gradient(90deg, #fb7185, #e11d48) !important; box-shadow: 0 0 8px rgba(251, 113, 133, 0.4); }
			.imogi-kds-ticket-action {
				align-items: center;
				border: none;
				border-radius: 12px;
				cursor: pointer;
				display: flex;
				font-family: var(--kds-font) !important;
				font-size: 13px !important;
				font-weight: 700 !important;
				gap: 8px;
				justify-content: center;
				letter-spacing: -0.01em;
				min-height: 48px;
				padding: 12px 18px;
				transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
				width: 100%;
			}
			.imogi-kds-ticket-action:active { transform: scale(0.97); }
			.imogi-kds-ticket-action--start {
				background: linear-gradient(135deg, #fb923c 0%, #ea580c 100%) !important;
				box-shadow: 0 4px 16px rgba(234, 88, 12, 0.35), inset 0 1px 0 rgba(255,255,255,0.2);
				color: #fff !important;
			}
			.imogi-kds-ticket-action--ready {
				background: linear-gradient(135deg, #4ade80 0%, #16a34a 100%) !important;
				box-shadow: 0 4px 16px rgba(22, 163, 74, 0.35), inset 0 1px 0 rgba(255,255,255,0.2);
				color: #fff !important;
			}
			.imogi-kds-ticket-action--done {
				background: #f0fdf4 !important;
				border: 1px solid #bbf7d0 !important;
				color: #16a34a !important;
				cursor: default;
			}
			.imogi-kds-ticket-action--complete {
				background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%) !important;
				box-shadow: 0 4px 16px rgba(2, 132, 199, 0.35), inset 0 1px 0 rgba(255,255,255,0.2);
				color: #fff !important;
			}

			/* ── Grouped order card: item list ── */
			.imogi-kds-ticket--grouped .imogi-kds-ticket-head {
				align-items: flex-start;
				display: flex;
				gap: 10px;
				justify-content: space-between;
			}
			.imogi-kds-ticket-order-id {
				color: #0f172a !important;
				font-size: 22px !important;
				font-variant-numeric: tabular-nums;
				font-weight: 800 !important;
				letter-spacing: -0.02em;
				line-height: 1.1;
			}
			.imogi-kds-ticket-head-badges {
				align-items: flex-end;
				display: flex;
				flex-direction: column;
				flex-shrink: 0;
				gap: 5px;
			}
			.imogi-kds-ticket-items {
				background: #f1f5f9 !important;
				border: 1px solid #e2e8f0 !important;
				border-radius: 12px;
				list-style: none;
				margin: 0 !important;
				padding: 6px !important;
			}
			.imogi-kds-ticket-row {
				align-items: center;
				display: flex;
				gap: 10px;
				padding: 8px 10px;
			}
			.imogi-kds-ticket-row + .imogi-kds-ticket-row { border-top: 1px solid #e2e8f0; }
			.imogi-kds-ticket-row-main {
				align-items: flex-start;
				display: flex;
				flex: 1;
				gap: 10px;
				min-width: 0;
			}
			.imogi-kds-ticket-row .imogi-kds-ticket-qty {
				font-size: 15px !important;
				min-width: 42px;
				padding: 6px 8px;
			}
			.imogi-kds-ticket-row .imogi-kds-ticket-name {
				font-size: 15px !important;
				font-weight: 700 !important;
			}
			.imogi-kds-ticket-row--ready .imogi-kds-ticket-name {
				color: #94a3b8 !important;
				text-decoration: line-through;
			}
			.imogi-kds-ticket-row--ready .imogi-kds-ticket-qty {
				background: #fff !important;
				border-color: #e2e8f0 !important;
				box-shadow: none;
				color: #94a3b8 !important;
			}
			.imogi-kds-ticket-row-btn {
				align-items: center;
				border: none;
				border-radius: 8px;
				cursor: pointer;
				display: inline-flex;
				flex-shrink: 0;
				font-family: var(--kds-font) !important;
				font-size: 11px !important;
				font-weight: 700 !important;
				gap: 5px;
				min-height: 36px;
				padding: 8px 12px;
				white-space: nowrap;
			}
			.imogi-kds-ticket-row-btn--start {
				background: linear-gradient(135deg, #fb923c, #ea580c) !important;
				color: #fff !important;
			}
			.imogi-kds-ticket-row-btn--ready {
				background: linear-gradient(135deg, #4ade80, #16a34a) !important;
				color: #fff !important;
			}
			.imogi-kds-ticket-row-done {
				align-items: center;
				background: #dcfce7 !important;
				border-radius: 8px;
				color: #16a34a !important;
				display: inline-flex;
				flex-shrink: 0;
				font-size: 14px;
				height: 36px;
				justify-content: center;
				width: 36px;
			}
			.imogi-kds-ticket-items-more {
				border-top: 1px dashed #cbd5e1;
				padding: 6px 10px 4px;
			}
			.imogi-kds-ticket-items-more-btn {
				background: transparent;
				border: none;
				color: #ea580c !important;
				cursor: pointer;
				font-family: var(--kds-font) !important;
				font-size: 12px !important;
				font-weight: 700 !important;
				padding: 4px 0;
				width: 100%;
			}
			.imogi-kds-ticket-items-more-btn:hover { text-decoration: underline; }
		`;
		document.head.appendChild(style);
	}

	deactivate_fullscreen() {
		document.body.classList.remove("imogi-kds-fullscreen", "imogi-pos-themed");
		document.querySelectorAll(".page-head, .sticky-top").forEach((el) => {
			el.style.removeProperty("display");
		});
	}

	make() {
		this.wrapper.html(`
			<div class="imogi-kds-shell">
				<div class="imogi-kds-bg-grid" aria-hidden="true"></div>
				<header class="imogi-kds-appbar">
					<div class="imogi-kds-appbar-brand">
						<img class="imogi-kds-logo" src="${this.logo_url()}" alt="IMOGI POS" />
						<div class="imogi-kds-appbar-titles">
							<div class="imogi-kds-brand-title">${__("Kitchen Display")}</div>
							<div class="imogi-kds-brand-sub">${__("Antrian pesanan dapur realtime")}</div>
						</div>
						<div class="imogi-kds-live"><span class="imogi-kds-live-dot"></span>${__("Live")}</div>
					</div>
					<div class="imogi-kds-appbar-right">
						<div class="imogi-kds-station-tabs" role="tablist" aria-label="${__("Filter stasiun")}">
							<button type="button" class="imogi-kds-station-tab is-active" data-station-filter="">${__("Semua")}</button>
							<button type="button" class="imogi-kds-station-tab imogi-kds-tab-kitchen" data-station-filter="Kitchen">${__("Dapur")}</button>
							<button type="button" class="imogi-kds-station-tab imogi-kds-tab-bar" data-station-filter="Bar">${__("Bar")}</button>
						</div>
						<div class="imogi-kds-stats">
							<div class="imogi-kds-stat-card imogi-kds-stat-total">
								<span class="imogi-kds-stat-card-label">${__("Aktif")}</span>
								<span class="imogi-kds-stat-card-num imogi-kds-stat-num">0</span>
							</div>
							<div class="imogi-kds-stat-card imogi-kds-stat-card--pending imogi-kds-stat-pending">
								<span class="imogi-kds-stat-card-label">${__("Antrian")}</span>
								<span class="imogi-kds-stat-card-num imogi-kds-stat-num">0</span>
							</div>
							<div class="imogi-kds-stat-card imogi-kds-stat-card--cooking imogi-kds-stat-preparing">
								<span class="imogi-kds-stat-card-label">${__("Dimasak")}</span>
								<span class="imogi-kds-stat-card-num imogi-kds-stat-num">0</span>
							</div>
						</div>
						<span class="imogi-kds-clock-wrap">
							<i class="fa fa-clock-o"></i>
							<span class="imogi-kds-clock imogi-kds-now">--:--</span>
						</span>
						<button type="button" class="imogi-kds-refresh">
							<i class="fa fa-refresh"></i>
							<span class="imogi-kds-refresh-label">${__("Refresh")} 30s</span>
						</button>
						<button type="button" class="imogi-kds-logout" title="${__("Logout")}">
							<i class="fa fa-sign-out"></i>
							<span>${__("Logout")}</span>
						</button>
					</div>
				</header>
				<div class="imogi-kds-board">
					<div class="imogi-kds-column imogi-kds-column--pending" data-status="Pending">
						<div class="imogi-kds-column-head">
							<div class="imogi-kds-column-icon"><i class="fa fa-inbox"></i></div>
							<div class="imogi-kds-column-head-text">
								<div class="imogi-kds-column-title">${__("Antrian")}</div>
								<div class="imogi-kds-column-sub">${__("Menunggu dimasak")}</div>
							</div>
							<span class="imogi-kds-column-count imogi-kds-count-pending">0</span>
						</div>
						<div class="imogi-kds-column-body imogi-kds-body-pending"></div>
					</div>
					<div class="imogi-kds-column imogi-kds-column--preparing" data-status="Preparing">
						<div class="imogi-kds-column-head">
							<div class="imogi-kds-column-icon"><i class="fa fa-fire"></i></div>
							<div class="imogi-kds-column-head-text">
								<div class="imogi-kds-column-title">${__("Sedang Dimasak")}</div>
								<div class="imogi-kds-column-sub">${__("Dalam proses / siap")}</div>
							</div>
							<span class="imogi-kds-column-count imogi-kds-count-preparing">0</span>
						</div>
						<div class="imogi-kds-column-body imogi-kds-body-preparing"></div>
					</div>
				</div>
			</div>
		`);

		this.wrapper.find(".imogi-kds-refresh").on("click", () => this.refresh());
		this.wrapper.find(".imogi-kds-logout").on("click", () => this.logout());
		this.wrapper.find(".imogi-kds-station-tab").on("click", (e) => {
			const filter = $(e.currentTarget).data("station-filter");
			this.station_filter = filter || null;
			this.wrapper.find(".imogi-kds-station-tab").removeClass("is-active");
			$(e.currentTarget).addClass("is-active");
			this.refresh();
		});
		this.sync_station_tabs();
	}

	sync_station_tabs() {
		const mode = frappe.boot?.imogi_pos_kds_station_mode || "Separate Kitchen and Bar";
		const $tabs = this.wrapper.find(".imogi-kds-station-tabs");
		const show_split = mode === "Separate Kitchen and Bar";
		this.wrapper.find(".imogi-kds-tab-kitchen, .imogi-kds-tab-bar").toggle(show_split);
		$tabs.toggleClass("imogi-kds-station-tabs--single", !show_split);
		if (!show_split && this.station_filter) {
			this.station_filter = null;
			this.wrapper.find(".imogi-kds-station-tab").removeClass("is-active");
			this.wrapper.find('.imogi-kds-station-tab[data-station-filter=""]').addClass("is-active");
		}
	}

	logout() {
		frappe.confirm(__("Logout dari Kitchen Display?"), () => {
			frappe.call({
				method: "logout",
				callback() {
					window.location.href = "/login";
				},
			});
		});
	}

	load_settings() {
		frappe.call({
			method: "imogi_pos.api.dashboard.get_ui_refresh_seconds",
			callback: (r) => {
				if (r.message) this.refresh_interval = cint(r.message) || 30;
				this.wrapper.find(".imogi-kds-refresh-label").text(`${__("Refresh")} ${this.refresh_interval}s`);
			},
		});
	}

	bind_realtime() {
		frappe.realtime.on("imogi_kitchen_updated", () => this.refresh());
		frappe.realtime.on("imogi_pos_notification", (data) => {
			if (data.type === "kitchen_new") {
				this.play_new_order_sound();
				frappe.show_alert({ message: data.message, indicator: "orange" });
				this.refresh();
			}
		});
	}

	play_new_order_sound() {
		try {
			const AudioCtx = window.AudioContext || window.webkitAudioContext;
			if (!AudioCtx) return;
			if (!this._audio_ctx) {
				this._audio_ctx = new AudioCtx();
			}
			const ctx = this._audio_ctx;
			if (ctx.state === "suspended") {
				ctx.resume();
			}
			const play_beep = (delay = 0, frequency = 880) => {
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.type = "sine";
				osc.frequency.value = frequency;
				gain.gain.value = 0.0001;
				osc.connect(gain);
				gain.connect(ctx.destination);
				const start = ctx.currentTime + delay;
				gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02);
				gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
				osc.start(start);
				osc.stop(start + 0.3);
			};
			play_beep(0, 880);
			play_beep(0.34, 1046);
		} catch (_err) {
			// Ignore autoplay / audio failures on unsupported browsers.
		}
	}

	normalize_item_name(name) {
		const text = (name || "").trim();
		if (!text) return "";
		const letters = text.replace(/[^A-Za-z]/g, "");
		if (letters && letters === letters.toUpperCase()) {
			return text
				.toLowerCase()
				.replace(/\b[a-z]/g, (char) => char.toUpperCase());
		}
		return text;
	}

	get_order_phase(order) {
		const items = order.items || [];
		if (!items.length) {
			return (order.status || "Pending") === "Pending" ? "pending" : "preparing";
		}
		const statuses = items.map((item) => (item.status || "Pending").trim());
		if (statuses.every((status) => status === "Pending")) return "pending";
		if (statuses.every((status) => status === "Ready")) return "ready";
		return "preparing";
	}

	filter_items_by_status(order, statuses) {
		const allowed = new Set(statuses);
		return (order.items || []).filter((item) => allowed.has((item.status || "Pending").trim()));
	}

	has_pending_items(order) {
		return this.filter_items_by_status(order, ["Pending"]).length > 0;
	}

	has_cooking_items(order) {
		return this.filter_items_by_status(order, ["Preparing", "Ready"]).length > 0;
	}

	is_order_all_ready(order) {
		const items = order.items || [];
		return items.length > 0 && items.every((item) => (item.status || "Pending").trim() === "Ready");
	}

	refresh() {
		const args = {};
		if (this.station_filter) {
			args.station_type = this.station_filter;
		}
		frappe.call({
			method: "imogi_pos.api.kitchen.get_kitchen_queue",
			args,
			callback: (r) => {
				if (r.exc) {
					this.orders = [];
					this.render(this.orders);
					return;
				}
				const orders = r.message || [];
				const incoming_ids = new Set(orders.map((order) => order.name));
				const has_baseline = this._known_order_ids.size > 0;
				const has_new_orders = orders.some((order) => !this._known_order_ids.has(order.name));
				if (has_baseline && has_new_orders) {
					this.play_new_order_sound();
				}
				this._known_order_ids = incoming_ids;
				this.orders = orders;
				this.render(this.orders);
			},
		});
		if (this._timer) clearInterval(this._timer);
		this._timer = setInterval(() => this.refresh(), this.refresh_interval * 1000);
	}

	update_clocks() {
		const now = new Date();
		const hh = String(now.getHours()).padStart(2, "0");
		const mm = String(now.getMinutes()).padStart(2, "0");
		this.wrapper.find(".imogi-kds-now").text(`${hh}:${mm}`);
		this.wrapper.find(".imogi-kds-card[data-kitchen-order], .imogi-kds-ticket[data-kitchen-order]").each((_, el) => {
			const $card = $(el);
			const order = this.orders.find((row) => row.name === $card.data("kitchen-order"));
			if (!order) return;
			this.paint_timer($card, order, $card.data("kds-column"));
		});
	}

	render(orders) {
		this.orders = orders || [];
		const pending_orders = this.orders.filter((order) => this.has_pending_items(order));
		const cooking_orders = this.orders.filter((order) => this.has_cooking_items(order));
		const pending_item_count = pending_orders.reduce(
			(total, order) => total + this.filter_items_by_status(order, ["Pending"]).length,
			0
		);
		const cooking_item_count = cooking_orders.reduce(
			(total, order) =>
				total + this.filter_items_by_status(order, ["Preparing", "Ready"]).length,
			0
		);

		this.wrapper.find(".imogi-kds-stat-total .imogi-kds-stat-num").text(this.orders.length);
		this.wrapper.find(".imogi-kds-stat-pending .imogi-kds-stat-num").text(pending_orders.length);
		this.wrapper.find(".imogi-kds-stat-preparing .imogi-kds-stat-num").text(cooking_orders.length);
		this.wrapper.find(".imogi-kds-count-pending").text(pending_item_count);
		this.wrapper.find(".imogi-kds-count-preparing").text(cooking_item_count);

		const $pending = this.wrapper.find(".imogi-kds-body-pending").empty();
		const $preparing = this.wrapper.find(".imogi-kds-body-preparing").empty();

		if (!this.orders.length) {
			const empty = `
				<div class="imogi-kds-page-empty">
					<div class="imogi-kds-empty-visual">
						<div class="imogi-kds-empty-glow"></div>
						<div class="imogi-kds-page-empty-icon"><i class="fa fa-cutlery"></i></div>
					</div>
					<h4>${__("Dapur kosong")}</h4>
					<p>${__("Belum ada pesanan aktif. Order baru dari kasir akan muncul otomatis di sini.")}</p>
				</div>`;
			$pending.html(empty);
			$preparing.html(`
				<div class="imogi-kds-empty">
					<div class="imogi-kds-empty-visual">
						<div class="imogi-kds-empty-glow"></div>
						<div class="imogi-kds-empty-icon"><i class="fa fa-fire"></i></div>
					</div>
					<span class="imogi-kds-empty-title">${__("Tidak ada order dimasak")}</span>
				</div>`);
			return;
		}

		if (!pending_orders.length) {
			$pending.html(`
				<div class="imogi-kds-empty">
					<div class="imogi-kds-empty-visual">
						<div class="imogi-kds-empty-glow"></div>
						<div class="imogi-kds-empty-icon"><i class="fa fa-check"></i></div>
					</div>
					<span class="imogi-kds-empty-title">${__("Semua item sudah dimulai")}</span>
				</div>`);
		} else {
			pending_orders.forEach((order) => $pending.append(this.build_order_card(order, "pending")));
		}

		if (!cooking_orders.length) {
			$preparing.html(`
				<div class="imogi-kds-empty">
					<div class="imogi-kds-empty-visual">
						<div class="imogi-kds-empty-glow"></div>
						<div class="imogi-kds-empty-icon"><i class="fa fa-fire"></i></div>
					</div>
					<span class="imogi-kds-empty-title">${__("Belum ada yang dimasak")}</span>
				</div>`);
		} else {
			cooking_orders.forEach((order) =>
				$preparing.append(this.build_order_card(order, "preparing"))
			);
		}
	}

	build_order_card(order, column = "pending") {
		const type_meta = IMOGI_KDS_ORDER_TYPE_META[order.order_type] || {
			icon: "fa-tag",
			tone: "default",
		};
		const column_items =
			column === "pending"
				? this.filter_items_by_status(order, ["Pending"])
				: this.filter_items_by_status(order, ["Preparing", "Ready"]);
		const expand_key = `${order.name}:${column}`;
		const expanded = !!this._expanded_items[expand_key];
		const visible_items = expanded ? column_items : column_items.slice(0, IMOGI_KDS_MAX_VISIBLE_ITEMS);
		const hidden_count = Math.max(0, column_items.length - visible_items.length);
		const items_html = visible_items.map((item) => this.build_item_row(item)).join("");
		const more_html =
			!expanded && hidden_count > 0
				? `<li class="imogi-kds-ticket-items-more">
					<button type="button" class="imogi-kds-ticket-items-more-btn" data-expand-key="${frappe.utils.escape_html(expand_key)}">
						+${hidden_count} ${__("item lainnya")}
					</button>
				</li>`
				: "";

		const short_ref = (order.pos_order || order.name || "").replace(/^ORD-/, "#");
		const station_type = order.station_type || "Kitchen";
		const station_tone = station_type === "Bar" ? "bar" : "kitchen";
		const station_label =
			station_type === "Bar" ? __("Bar") : station_type === "Kitchen" ? __("Dapur") : station_type;
		const table_number = (order.table_number || "").trim();
		const table_chip =
			(order.order_type || "").trim() === "Dine-in" && table_number
				? `<span class="imogi-kds-chip imogi-kds-chip--table"><i class="fa fa-map-marker"></i>${__("Meja")} ${frappe.utils.escape_html(table_number)}</span>`
				: "";
		const show_complete = column === "preparing" && this.is_order_all_ready(order);
		const complete_html = show_complete
			? `<button type="button" class="imogi-kds-ticket-action imogi-kds-ticket-action--complete">
				<i class="fa fa-check-circle"></i> ${__("Selesaikan Order")}
			</button>`
			: "";

		const $card = $(`
			<article class="imogi-kds-ticket imogi-kds-ticket--grouped imogi-kds-ticket--${type_meta.tone}" data-kitchen-order="${frappe.utils.escape_html(order.name)}" data-kds-column="${column}" data-kds-build="${IMOGI_KDS_BUILD}">
				<div class="imogi-kds-ticket-accent"></div>
				<div class="imogi-kds-ticket-body">
					<div class="imogi-kds-ticket-head">
						<div class="imogi-kds-ticket-order-id">${frappe.utils.escape_html(short_ref)}</div>
						<div class="imogi-kds-ticket-head-badges">
							<span class="imogi-kds-chip imogi-kds-chip--${type_meta.tone}">
								<i class="fa ${type_meta.icon}"></i>${frappe.utils.escape_html(order.order_type || "-")}
							</span>
							<span class="imogi-kds-chip imogi-kds-chip--${station_tone}">${frappe.utils.escape_html(station_label)}</span>
							${table_chip}
						</div>
					</div>
					<div class="imogi-kds-ticket-customer">
						<i class="fa fa-user"></i>
						<span>${frappe.utils.escape_html(order.customer_name || __("Walk-in"))}</span>
					</div>
					<ul class="imogi-kds-ticket-items">${items_html}${more_html}</ul>
					<div class="imogi-kds-ticket-timer">
						<span class="imogi-kds-timer"><i class="fa fa-clock-o"></i> <strong class="imogi-kds-timer-value">—</strong></span>
						<div class="imogi-kds-sla"><div class="imogi-kds-sla-fill"></div></div>
					</div>
					${complete_html}
				</div>
			</article>
		`);

		this.paint_timer($card, order, column);

		$card.find(".imogi-kds-ticket-items-more-btn").on("click", (e) => {
			e.preventDefault();
			this._expanded_items[$(e.currentTarget).attr("data-expand-key")] = true;
			this.render(this.orders);
		});
		$card.find(".imogi-kds-ticket-row-btn--start").on("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.update_item_status($(e.currentTarget).attr("data-kitchen-item"), "Preparing");
		});
		$card.find(".imogi-kds-ticket-row-btn--ready").on("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.update_item_status($(e.currentTarget).attr("data-kitchen-item"), "Ready");
		});
		$card.find(".imogi-kds-ticket-action--complete").on("click", () => this.complete(order.name));

		return $card;
	}

	build_item_row(item) {
		const status = (item.status || "Pending").trim();
		const note = (item.notes || "").trim();
		const note_html = note
			? `<div class="imogi-kds-ticket-note">${frappe.utils.escape_html(note)}</div>`
			: "";
		const item_name = this.normalize_item_name(item.item_name || item.item_code);
		let action_html = "";
		if (status === "Pending") {
			action_html = `<button type="button" class="imogi-kds-ticket-row-btn imogi-kds-ticket-row-btn--start" data-kitchen-item="${frappe.utils.escape_html(item.name)}">
				<i class="fa fa-play"></i> ${__("Mulai")}
			</button>`;
		} else if (status === "Preparing") {
			action_html = `<button type="button" class="imogi-kds-ticket-row-btn imogi-kds-ticket-row-btn--ready" data-kitchen-item="${frappe.utils.escape_html(item.name)}">
				<i class="fa fa-check"></i> ${__("Siap")}
			</button>`;
		} else {
			action_html = `<span class="imogi-kds-ticket-row-done"><i class="fa fa-check"></i></span>`;
		}
		return `<li class="imogi-kds-ticket-row imogi-kds-ticket-row--${status.toLowerCase()}">
			<div class="imogi-kds-ticket-row-main">
				<span class="imogi-kds-ticket-qty">${flt(item.qty, 0)}×</span>
				<div class="imogi-kds-ticket-item">
					<div class="imogi-kds-ticket-name">${frappe.utils.escape_html(item_name)}</div>
					${note_html}
				</div>
			</div>
			${action_html}
		</li>`;
	}

	paint_timer($card, order, column = "pending") {
		const timer = this.get_timer_state(order, column);
		const $timer = $card.find(".imogi-kds-timer");
		$timer.toggleClass("is-urgent", timer.urgent);
		$card.toggleClass("is-urgent", timer.urgent);
		$card.find(".imogi-kds-timer-value").text(timer.label);
		$card.find(".imogi-kds-sla-fill")
			.css("width", `${timer.progress}%`)
			.toggleClass("is-warning", timer.warning)
			.toggleClass("is-urgent", timer.urgent);
	}

	get_timer_state(order, column = "pending") {
		const limit = cint(order.timer_minutes) || 15;
		if (column === "pending" || !order.started_at) {
			if (order.creation) {
				const created = frappe.datetime.str_to_obj(order.creation);
				const elapsed_sec = Math.max(0, Math.floor((Date.now() - created.getTime()) / 1000));
				const elapsed_min = Math.floor(elapsed_sec / 60);
				const sec = elapsed_sec % 60;
				const urgent = elapsed_min >= IMOGI_KDS_PENDING_URGENT_MINUTES;
				const warning = !urgent && elapsed_min >= Math.max(1, Math.floor(IMOGI_KDS_PENDING_URGENT_MINUTES * 0.6));
				const progress = Math.min(100, Math.round((elapsed_min / IMOGI_KDS_PENDING_URGENT_MINUTES) * 100));
				return {
					label: `${elapsed_min}:${String(sec).padStart(2, "0")}`,
					progress,
					warning,
					urgent,
				};
			}
			return { label: __("Baru"), progress: 0, warning: false, urgent: false };
		}
		const started = frappe.datetime.str_to_obj(order.started_at);
		const elapsed_sec = Math.max(0, Math.floor((Date.now() - started.getTime()) / 1000));
		const elapsed_min = Math.floor(elapsed_sec / 60);
		const sec = elapsed_sec % 60;
		const progress = Math.min(100, Math.round((elapsed_min / limit) * 100));
		const urgent = elapsed_min >= limit;
		const warning = !urgent && elapsed_min >= Math.max(1, Math.floor(limit * 0.7));
		return {
			label: `${elapsed_min}:${String(sec).padStart(2, "0")}`,
			progress,
			warning,
			urgent,
		};
	}

	update_item_status(kitchen_order_item, status) {
		frappe.call({
			method: "imogi_pos.api.kitchen.update_kitchen_item_status",
			args: { kitchen_order_item, status },
			callback: () => this.refresh(),
		});
	}

	update_status(name, status) {
		frappe.call({
			method: "imogi_pos.api.kitchen.update_kitchen_status",
			args: { kitchen_order: name, status },
			callback: () => this.refresh(),
		});
	}

	complete(name) {
		frappe.call({
			method: "imogi_pos.api.kitchen.complete_kitchen_from_display",
			args: { kitchen_order: name },
			freeze: true,
			callback: () => {
				frappe.show_alert({ message: __("Pesanan siap — lanjut fulfillment/service"), indicator: "green" });
				this.refresh();
			},
		});
	}
};
