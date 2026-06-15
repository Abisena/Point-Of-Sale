frappe.provide("imogi_pos");

frappe.pages["imogi-pos-cashier"].on_page_load = function (wrapper) {
	inject_cashier_css();
	imogi_pos.sync_desk_theme?.();

	if (
		imogi_pos_requires_shift_workflow?.() &&
		frappe.boot?.imogi_pos_landing_target === "opening-entry" &&
		!cint(frappe.boot?.imogi_pos_has_open_shift)
	) {
		imogi_pos_go_to_opening_entry?.();
		return;
	}

	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("IMOGI Kasir"),
		single_column: true,
	});

	page.main.addClass("imogi-cashier-page");
	$(wrapper).find(".layout-main-section-wrapper").css("max-width", "100%");
	$(wrapper).find(".page-head").hide();
	wrapper.cashier_page = new imogi_pos.CashierPage(page);
	imogi_pos.active_cashier = wrapper.cashier_page;
	if (!imogi_pos._cashier_settings_listener) {
		imogi_pos._cashier_settings_listener = true;
		frappe.realtime.on("imogi_pos_settings_updated", () => {
			imogi_pos.active_cashier?.sync_shift_settings?.();
			imogi_pos.active_cashier?.refresh_sales_target?.();
		});
		frappe.realtime.on("imogi_pos_order_completed", () => {
			imogi_pos.active_cashier?.refresh_sales_target?.();
		});
	}
	frappe.breadcrumbs.add("Imogi POS");

	// Optional: load full stylesheet in background (do not block UI)
	if (!window.__imogi_cashier_styles_ready) {
		frappe.require("/assets/imogi_pos/css/imogi_pos.css", () => {
			window.__imogi_cashier_styles_ready = true;
		});
	}
};

frappe.pages["imogi-pos-cashier"].on_page_show = function (wrapper) {
	document.body.classList.add("imogi-cashier-active");
	imogi_pos.sync_desk_theme?.();
	if (
		imogi_pos_requires_shift_workflow?.() &&
		frappe.boot?.imogi_pos_landing_target === "opening-entry" &&
		!cint(frappe.boot?.imogi_pos_has_open_shift)
	) {
		imogi_pos_go_to_opening_entry?.();
		return;
	}
	wrapper.cashier_page?.sync_shift_settings?.();
};

frappe.pages["imogi-pos-cashier"].on_page_hide = function () {
	document.body.classList.remove("imogi-cashier-active");
};

function imogi_format_pay_total(total) {
	const formatted = format_currency(total) || "";
	return formatted.replace(/Rp\s?/, '<span class="imogi-pay-currency">Rp</span> ');
}

function imogi_apply_shift_bar_theme($bar) {
	if (!$bar || !$bar.length) {
		return;
	}

	const mobile = window.matchMedia("(max-width: 992px)").matches;
	if (mobile) {
		$bar.css({
			alignItems: "center",
			background: "transparent",
			border: "none",
			borderRadius: "0",
			display: "flex",
			flexWrap: "nowrap",
			gap: "8px",
			justifyContent: "space-between",
			marginBottom: "0",
			padding: "10px 12px",
		});

		$bar.find(".imogi-cashier-shift-text").css({
			color: "#3f3f46",
			fontSize: "12px",
			fontWeight: "700",
		});

		$bar.find(".imogi-cashier-shift-text .fa").css({
			color: "#16a34a",
		});

		$bar.find(".imogi-cashier-shift-text a").css({
			color: "#0f1f35",
			fontWeight: "700",
			textDecoration: "none",
		});

		$bar.find(".imogi-cashier-close-shift-btn, .imogi-cashier-logout-btn, .imogi-cashier-history-btn").css({
			background: "#f4f4f5",
			border: "1px solid #d4d4d8",
			borderRadius: "8px",
			color: "#0f1f35",
			fontWeight: "700",
		});

		$bar.find(".imogi-cashier-open-shift-btn, .imogi-cashier-btn-primary").css({
			background: "#0f1f35",
			border: "1px solid #0f1f35",
			borderRadius: "8px",
			color: "#fff",
			fontWeight: "700",
		});

		$bar.find(".imogi-cashier-shift-actions").css({
			alignItems: "center",
			display: "flex",
			flexShrink: "0",
			flexWrap: "nowrap",
			gap: "6px",
		});
		return;
	}

	$bar.css({
		alignItems: "center",
		background: "linear-gradient(145deg, #0f1f35 0%, #1a3352 100%)",
		border: "1px solid rgba(255, 255, 255, 0.12)",
		borderRadius: "12px",
		display: "flex",
		flexWrap: "wrap",
		gap: "10px",
		justifyContent: "space-between",
		marginBottom: "12px",
		padding: "10px 14px",
	});

	$bar.find(".imogi-cashier-shift-text").css({
		color: "rgba(255, 255, 255, 0.92)",
		fontSize: "13px",
		fontWeight: "700",
	});

	$bar.find(".imogi-cashier-shift-text .fa").css({
		color: "rgba(255, 255, 255, 0.72)",
	});

	$bar.find(".imogi-cashier-shift-text a").css({
		color: "#fff",
		fontWeight: "800",
		textDecoration: "underline",
	});

	$bar.find(".imogi-cashier-close-shift-btn, .imogi-cashier-logout-btn, .imogi-cashier-history-btn").css({
		background: "rgba(255, 255, 255, 0.12)",
		border: "1px solid rgba(255, 255, 255, 0.24)",
		borderRadius: "8px",
		color: "#fff",
		fontWeight: "700",
	});

	$bar.find(".imogi-cashier-shift-actions").css({
		alignItems: "center",
		display: "flex",
		flexShrink: "0",
		flexWrap: "wrap",
		gap: "8px",
	});
}

function inject_cashier_css() {
	document.getElementById("imogi-cashier-inline-css")?.remove();
	document.getElementById("imogi-cashier-inline-css-v2")?.remove();
	document.getElementById("imogi-cashier-inline-css-v3")?.remove();
	document.getElementById("imogi-cashier-inline-css-v4")?.remove();
	document.getElementById("imogi-cashier-inline-css-v5")?.remove();
	document.getElementById("imogi-cashier-inline-css-v6")?.remove();
	document.getElementById("imogi-cashier-inline-css-v7")?.remove();
	document.getElementById("imogi-cashier-inline-css-v8")?.remove();
	document.getElementById("imogi-cashier-inline-css-v9")?.remove();
	document.getElementById("imogi-cashier-inline-css-v10")?.remove();
	document.getElementById("imogi-cashier-inline-css-v11")?.remove();
	document.getElementById("imogi-cashier-inline-css-v12")?.remove();
	document.getElementById("imogi-cashier-inline-css-v15")?.remove();
	document.getElementById("imogi-cashier-inline-css-v16")?.remove();
	document.getElementById("imogi-cashier-inline-css-v17")?.remove();
	document.getElementById("imogi-cashier-inline-css-v18")?.remove();
	document.getElementById("imogi-cashier-inline-css-v19")?.remove();
	document.getElementById("imogi-cashier-inline-css-v20")?.remove();
	document.getElementById("imogi-cashier-inline-css-v21")?.remove();
	document.getElementById("imogi-cashier-inline-css-v22")?.remove();
	document.getElementById("imogi-cashier-inline-css-v26")?.remove();
	document.getElementById("imogi-cashier-inline-css-v27")?.remove();
	document.getElementById("imogi-cashier-inline-css-v28")?.remove();
	document.getElementById("imogi-cashier-inline-css-v29")?.remove();
	document.getElementById("imogi-cashier-inline-css-v30")?.remove();
	document.getElementById("imogi-cashier-inline-css-v31")?.remove();
	document.getElementById("imogi-cashier-inline-css-v32")?.remove();
	document.getElementById("imogi-cashier-inline-css-v33")?.remove();
	document.getElementById("imogi-cashier-inline-css-v34")?.remove();
	document.getElementById("imogi-cashier-inline-css-v35")?.remove();
	document.getElementById("imogi-cashier-inline-css-v36")?.remove();
	document.getElementById("imogi-cashier-inline-css-v37")?.remove();
	document.getElementById("imogi-cashier-inline-css-v38")?.remove();
	document.getElementById("imogi-cashier-inline-css-v39")?.remove();
	document.getElementById("imogi-cashier-inline-css-v40")?.remove();
	document.getElementById("imogi-cashier-inline-css-v41")?.remove();
	document.getElementById("imogi-cashier-inline-css-v42")?.remove();
	document.getElementById("imogi-cashier-inline-css-v43")?.remove();
	document.getElementById("imogi-cashier-inline-css-v44")?.remove();
	document.getElementById("imogi-cashier-inline-css-v46")?.remove();
	frappe.dom.set_style(`
		.imogi-cashier-page .layout-main-section-wrapper,
		.imogi-cashier-page .layout-main-section,
		.imogi-cashier-page .page-body { background: transparent !important; max-width: 100% !important; overflow: hidden !important; }
		.imogi-cashier-page.layout-main-section,
		.imogi-cashier-page { box-sizing: border-box; display: flex; flex-direction: column; height: calc(100vh - 60px); height: calc(100dvh - 60px); max-height: calc(100vh - 60px); max-height: calc(100dvh - 60px); min-height: 0; overflow: hidden !important; padding: 8px 12px 10px !important; }
		.imogi-cashier-page .page-body,
		.imogi-cashier-root { display: flex; flex: 1; flex-direction: column; min-height: 0; overflow: hidden; }
		.imogi-cashier-top { display: flex; flex-direction: column; flex-shrink: 0; gap: 6px; margin-bottom: 8px; }
		.imogi-cashier-shift-bar { align-items: center; background: linear-gradient(145deg, #0f1f35 0%, #1a3352 100%) !important; border: 1px solid rgba(255,255,255,0.12) !important; border-radius: 10px; display: flex; flex-shrink: 0; flex-wrap: wrap; gap: 8px; justify-content: space-between; margin-bottom: 0 !important; padding: 8px 12px; }
		.imogi-cashier-shift-bar.is-closed { background: linear-gradient(145deg, #0f1f35 0%, #1a3352 100%) !important; border-color: rgba(255,255,255,0.12) !important; }
		.imogi-cashier-shift-bar .imogi-cashier-shift-text { color: rgba(255,255,255,0.92) !important; font-size: 13px; font-weight: 700; }
		.imogi-cashier-shift-bar .imogi-cashier-shift-text .fa { color: rgba(255,255,255,0.72) !important; }
		.imogi-cashier-shift-bar .imogi-cashier-shift-text a { color: #fff !important; font-weight: 800; text-decoration: underline; }
		.imogi-cashier-shift-actions { align-items: center; display: flex; flex-shrink: 0; flex-wrap: wrap; gap: 8px; }
		.imogi-cashier-shift-bar .imogi-cashier-close-shift-btn,
		.imogi-cashier-shift-bar .imogi-cashier-logout-btn,
		.imogi-cashier-shift-bar .imogi-cashier-history-btn { background: rgba(255,255,255,0.12) !important; border: 1px solid rgba(255,255,255,0.24) !important; border-radius: 8px !important; color: #fff !important; font-weight: 700 !important; }
		.imogi-cashier-shift-bar .imogi-cashier-logout-btn .fa,
		.imogi-cashier-shift-bar .imogi-cashier-history-btn .fa { margin-right: 4px; opacity: .85; }
		.imogi-cashier-status-strip { align-items: center; display: none; flex-wrap: wrap; gap: 6px; }
		.imogi-cashier-status-strip.is-visible { display: flex; }
		.imogi-status-chip { align-items: center; background: #fff; border: 1px solid #e4e4e7; border-radius: 999px; color: #334155; cursor: pointer; display: none; font-size: 11px; font-weight: 700; gap: 5px; line-height: 1; padding: 5px 10px; }
		.imogi-status-chip.is-visible { display: inline-flex; }
		.imogi-status-chip .fa { font-size: 11px; opacity: .85; }
		.imogi-chip-target.is-behind { background: #fff1f2; border-color: #fecdd3; color: #be123c; }
		.imogi-chip-target.is-achieved { background: #ecfdf5; border-color: #6ee7b7; color: #047857; }
		.imogi-chip-marketplace.has-orders { background: #ecfdf5; border-color: #6ee7b7; color: #047857; }
		.imogi-chip-offline.has-pending { background: #fff7ed; border-color: #fdba74; color: #9a3412; }
		.imogi-cashier-shell { display: grid; flex: 1; gap: 12px; grid-template-columns: minmax(0, 1fr) 340px; min-height: 0; overflow: hidden; }
		.imogi-cashier-mobile-backdrop, .imogi-cashier-mobile-dock { display: none; }
		.imogi-cashier-mobile-checkout { display: none; }
		.imogi-cashier-cart-scroll { display: contents; }
		.imogi-cashier-cart-mobile-head, .imogi-cashier-cart-close { display: none; }
		@media (max-width: 992px) {
			.imogi-cashier-page.layout-main-section,
			.imogi-cashier-page { padding: 6px 6px 0 !important; }
			.imogi-cashier-top { gap: 4px; margin-bottom: 6px; }
			.imogi-cashier-shift-bar { border-radius: 10px; padding: 7px 10px; }
			.imogi-cashier-shift-text { font-size: 11px !important; line-height: 1.35; }
			.imogi-cashier-shift-bar .btn { font-size: 10px !important; padding: 4px 8px !important; }
			.imogi-cashier-status-strip.is-visible { gap: 4px; }
			.imogi-status-chip { font-size: 10px; padding: 4px 8px; }
			.imogi-cashier-panel.imogi-cashier-products .imogi-cashier-panel-head { padding: 10px 12px; }
			.imogi-cashier-panel.imogi-cashier-products .imogi-cashier-panel-head h5 { font-size: 14px; }
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-panel.imogi-cashier-products .imogi-cashier-meta { display: none; }
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-branch-row {
				background: transparent;
				border: none;
				display: flex !important;
				gap: 6px;
				margin: 0 0 6px;
				padding: 0 2px;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-branch-row .fa { color: #71717a; font-size: 11px; }
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-branch-label { color: #52525b; font-size: 11px; font-weight: 600; }
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-branch-select { font-size: 11px !important; font-weight: 600; min-width: 0; }
			.imogi-cashier-shell {
				display: flex;
				flex: 1;
				flex-direction: column;
				gap: 0;
				grid-template-columns: 1fr;
				min-height: 0;
				overflow: hidden;
				padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
			}
			.imogi-cashier-panel.imogi-cashier-products { border-radius: 14px; flex: 1; min-height: 0; }
			.imogi-cashier-panel.imogi-cashier-cart {
				border-left: none;
				border-radius: 16px 16px 0 0;
				border-right: none;
				bottom: 0;
				box-shadow: 0 -12px 40px rgba(24,24,27,.16);
				display: flex;
				flex-direction: column;
				height: calc(100dvh - env(safe-area-inset-top, 0px));
				left: 0;
				max-height: calc(100dvh - env(safe-area-inset-top, 0px));
				overflow: hidden;
				position: fixed;
				right: 0;
				top: env(safe-area-inset-top, 0px);
				transform: translateY(100%);
				transition: transform .25s ease;
				z-index: 1060;
			}
			.imogi-cashier-page.is-mobile-cart-open .imogi-cashier-panel.imogi-cashier-cart { transform: translateY(0); }
			.imogi-cashier-page.is-mobile-cart-open .imogi-cashier-mobile-dock { display: none !important; }
			.imogi-cashier-page.is-mobile-cart-open .imogi-cashier-mobile-backdrop { z-index: 1055; }
			body.imogi-cashier-mobile-cart-open { overflow: hidden; }
			.imogi-cashier-page.is-mobile-layout .imogi-cart-row { padding: 12px 14px; }
			.imogi-cashier-mobile-checkout { display: block; }
			.imogi-cashier-cart-mobile-head {
				align-items: center;
				background: linear-gradient(145deg, #0f1f35 0%, #1a3352 100%);
				border-bottom: 1px solid rgba(255,255,255,0.1);
				display: flex;
				flex-shrink: 0;
				justify-content: center;
				min-height: 44px;
				padding: 10px 52px 8px;
				position: relative;
			}
			.imogi-cashier-cart-grab {
				background: rgba(255,255,255,0.35);
				border-radius: 999px;
				display: block;
				height: 4px;
				width: 40px;
			}
			.imogi-cashier-panel.imogi-cashier-cart .imogi-cashier-panel-head {
				border-radius: 0;
				flex-shrink: 0;
				padding: 10px 14px 12px;
			}
			.imogi-cashier-panel.imogi-cashier-cart .imogi-cashier-panel-head h5 { font-size: 15px; }
			.imogi-cashier-cart-scroll {
				display: flex;
				flex: 1 1 auto;
				flex-direction: column;
				min-height: 0;
				overflow-x: hidden;
				overflow-y: auto;
				overscroll-behavior: contain;
				-webkit-overflow-scrolling: touch;
			}
			.imogi-cashier-cart-items {
				flex: 0 0 auto;
				max-height: none;
				min-height: 0;
				overflow: visible;
				padding: 0;
				text-align: left;
			}
			.imogi-cashier-cart-foot {
				background: #fafafa;
				border-top: 1px solid #e4e4e7;
				box-shadow: none;
				flex-shrink: 0;
				max-height: none;
				overflow: visible;
				padding: 12px 14px 14px;
			}
			.imogi-cashier-panel.imogi-cashier-cart .imogi-cashier-order-type-row { display: none; }
			.imogi-cashier-cart-foot > .imogi-cashier-total-row,
			.imogi-cashier-cart-foot > .imogi-cashier-pay { display: none !important; }
			.imogi-cashier-mobile-checkout {
				background: #fff;
				border-top: 1px solid #e4e4e7;
				box-shadow: 0 -8px 28px rgba(15,31,53,.08);
				flex-shrink: 0;
				padding: 14px 16px calc(16px + env(safe-area-inset-bottom, 0px));
			}
			.imogi-cashier-mobile-checkout .imogi-cashier-total-row {
				align-items: center;
				display: flex;
				justify-content: space-between;
				margin: 0 0 12px;
				padding: 0;
			}
			.imogi-cashier-mobile-checkout .imogi-cashier-total-row span {
				color: #71717a;
				font-size: 14px;
				font-weight: 700;
			}
			.imogi-cashier-mobile-checkout .imogi-cart-total {
				color: #0f1f35 !important;
				font-size: 24px !important;
				font-weight: 800 !important;
				line-height: 1.1;
			}
			.imogi-cashier-mobile-checkout .imogi-cashier-pay {
				align-items: center;
				background: linear-gradient(135deg, #0f1f35 0%, #1a3352 100%) !important;
				border: none !important;
				border-radius: 14px !important;
				box-shadow: 0 8px 20px rgba(15,31,53,.22) !important;
				color: #fff !important;
				display: flex !important;
				font-size: 16px !important;
				font-weight: 800 !important;
				gap: 10px;
				height: 56px !important;
				justify-content: center;
				letter-spacing: .01em;
				margin: 0;
				padding: 0 20px !important;
				width: 100%;
			}
			.imogi-cashier-mobile-checkout .imogi-cashier-pay .fa {
				font-size: 18px;
				opacity: .92;
			}
			.imogi-cashier-mobile-checkout .imogi-cashier-pay:active:not(:disabled) {
				box-shadow: 0 4px 12px rgba(15,31,53,.18) !important;
				transform: translateY(1px);
			}
			.imogi-cashier-mobile-checkout .imogi-cashier-pay:disabled {
				background: #d4d4d8 !important;
				box-shadow: none !important;
				opacity: 1 !important;
			}
			.imogi-cashier-cart-close {
				align-items: center;
				background: rgba(255,255,255,0.14);
				border: 1px solid rgba(255,255,255,0.24);
				border-radius: 8px;
				color: #fff;
				cursor: pointer;
				display: inline-flex;
				flex-shrink: 0;
				font-size: 22px;
				height: 36px;
				justify-content: center;
				line-height: 1;
				padding: 0;
				position: absolute;
				right: 12px;
				top: 50%;
				transform: translateY(-50%);
				width: 36px;
			}
			.imogi-cashier-mobile-backdrop {
				background: rgba(24,24,27,.45);
				display: block;
				inset: 0;
				opacity: 0;
				pointer-events: none;
				position: fixed;
				transition: opacity .2s ease;
				z-index: 1035;
			}
			.imogi-cashier-page.is-mobile-cart-open .imogi-cashier-mobile-backdrop { opacity: 1; pointer-events: auto; }
			.imogi-cashier-mobile-dock {
				align-items: center;
				background: #fff;
				border-top: 1px solid #e4e4e7;
				bottom: 0;
				box-shadow: 0 -4px 24px rgba(24,24,27,.08);
				display: flex;
				gap: 10px;
				left: 0;
				padding: 10px 14px calc(18px + env(safe-area-inset-bottom, 0px));
				position: fixed;
				right: 0;
				z-index: 1050;
			}
			.imogi-cashier-dock-cart {
				align-items: center;
				background: #fafafa;
				border: 1px solid #e4e4e7;
				border-radius: 12px;
				color: #0f1f35;
				cursor: pointer;
				display: inline-flex;
				flex-shrink: 0;
				font-size: 18px;
				height: 52px;
				justify-content: center;
				position: relative;
				width: 52px;
			}
			.imogi-cashier-dock-badge {
				align-items: center;
				background: #0f1f35;
				border-radius: 999px;
				color: #fff;
				display: inline-flex;
				font-size: 10px;
				font-weight: 800;
				height: 18px;
				justify-content: center;
				min-width: 18px;
				padding: 0 5px;
				position: absolute;
				right: -4px;
				top: -4px;
			}
			.imogi-cashier-dock-badge.is-empty { display: none; }
			.imogi-cashier-dock-meta { cursor: pointer; flex: 1; min-width: 0; }
			.imogi-cashier-dock-label { color: #71717a; display: block; font-size: 11px; font-weight: 700; line-height: 1.2; }
			.imogi-cashier-dock-total { color: #0f1f35; display: block; font-size: 18px; font-variant-numeric: tabular-nums; font-weight: 800; line-height: 1.15; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
			.imogi-cashier-dock-pay {
				border-radius: 12px !important;
				flex-shrink: 0;
				font-size: 14px !important;
				font-weight: 800 !important;
				height: 52px !important;
				min-width: 108px;
				padding: 0 16px !important;
				white-space: nowrap;
			}
		}
		.imogi-cashier-panel { background: #fff; border: 1px solid #e4e4e7; border-radius: 16px; box-shadow: none; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
		.imogi-cashier-panel-head { align-items: center; background: linear-gradient(145deg, #0f1f35 0%, #1a3352 100%); border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; flex-shrink: 0; gap: 10px; justify-content: space-between; padding: 14px 16px; }
		.imogi-cashier-panel-head h5 { align-items: center; color: #fff; display: flex; font-size: 16px; font-weight: 800; gap: 8px; margin: 0; white-space: nowrap; }
		.imogi-cashier-head-icon { color: rgba(255,255,255,0.72); font-size: 15px; }
		.imogi-cashier-cart-head-actions { display: flex; flex-shrink: 0; gap: 6px; }
		.imogi-cashier-hold-btn, .imogi-cashier-resume-btn, .imogi-cart-clear { font-size: 11px !important; font-weight: 700; padding: 5px 10px !important; white-space: nowrap; }
		.imogi-cashier-hold-bar { align-items: center; background: #fafafa; border-bottom: 1px solid #e4e4e7; display: none; flex-shrink: 0; gap: 10px; justify-content: space-between; padding: 9px 14px; }
		.imogi-cashier-hold-bar.is-visible { display: flex; }
		.imogi-cashier-hold-bar-text { align-items: center; color: #52525b; display: flex; font-size: 12px; font-weight: 700; gap: 8px; min-width: 0; }
		.imogi-cashier-hold-bar-text .fa { color: #71717a; font-size: 14px; }
		.imogi-cashier-hold-count { align-items: center; background: #0f1f35; border-radius: 999px; color: #fff; display: inline-flex; font-size: 11px; font-weight: 800; height: 20px; justify-content: center; min-width: 20px; padding: 0 6px; }
		.imogi-cashier-btn-primary { background: #0f1f35 !important; border: none !important; border-radius: 10px !important; color: #fff !important; font-weight: 700 !important; }
		.imogi-cashier-btn-primary:focus { background: #1a3352 !important; color: #fff !important; }
		.imogi-cashier-btn-primary:disabled { opacity: .4; }
		.imogi-cashier-hold-list-btn { font-size: 11px !important; font-weight: 700; }
		.imogi-cashier-toolbar { background: #fafafa; border-bottom: 1px solid #e4e4e7; flex-shrink: 0; padding: 14px 16px; }
		.imogi-cashier-search { background: #fafafa !important; border: 1px solid #e4e4e7 !important; border-radius: 10px !important; font-size: 15px !important; padding: 10px 14px !important; }
		.imogi-cashier-search:focus { background: #fff !important; border-color: #a1a1aa !important; box-shadow: none !important; }
		.imogi-cashier-groups { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
		.imogi-cashier-group-btn { align-items: center; background: #fff; border: 1px solid #d4d4d8; border-radius: 999px; color: #71717a; cursor: pointer; display: inline-flex; font-size: 12px; font-weight: 700; gap: 6px; padding: 7px 14px; }
		.imogi-cashier-group-btn .fa { font-size: 11px; opacity: .85; }
		.imogi-cashier-group-btn.is-active { background: #0f1f35; border-color: #0f1f35; color: #fff; }
		.imogi-cashier-group-btn.is-active .fa { opacity: 1; }
		.imogi-cashier-group-picker { display: none; position: relative; width: 100%; z-index: 1; }
		.imogi-cashier-group-picker.is-open { z-index: 40; }
		.imogi-cashier-group-picker-trigger {
			align-items: center;
			background: #fff;
			border: 1px solid #e4e4e7;
			border-radius: 12px;
			box-shadow: 0 1px 2px rgba(15,31,53,.04);
			color: #0f1f35;
			cursor: pointer;
			display: flex;
			gap: 10px;
			min-height: 44px;
			padding: 0 12px;
			text-align: left;
			transition: border-color .15s ease, box-shadow .15s ease;
			width: 100%;
		}
		.imogi-cashier-group-picker-trigger.is-open,
		.imogi-cashier-group-picker-trigger:focus-visible {
			border-color: #0f1f35;
			box-shadow: 0 0 0 3px rgba(15,31,53,.1);
			outline: none;
		}
		.imogi-cashier-group-picker-leading {
			align-items: center;
			background: #f8fafc;
			border-radius: 8px;
			color: #0f1f35;
			display: inline-flex;
			flex-shrink: 0;
			font-size: 13px;
			height: 28px;
			justify-content: center;
			width: 28px;
		}
		.imogi-cashier-group-picker-label {
			flex: 1;
			font-size: 14px;
			font-weight: 700;
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.imogi-cashier-group-picker-caret { color: #71717a; flex-shrink: 0; font-size: 11px; transition: transform .2s ease; }
		.imogi-cashier-group-picker-trigger.is-open .imogi-cashier-group-picker-caret { transform: rotate(180deg); }
		.imogi-cashier-group-picker-menu {
			background: #fff;
			border: 1px solid #e4e4e7;
			border-radius: 12px;
			box-shadow: 0 12px 32px rgba(15,31,53,.14);
			display: none;
			left: 0;
			margin-top: 6px;
			max-height: min(50vh, 280px);
			overflow-y: auto;
			padding: 6px;
			position: absolute;
			right: 0;
			top: 100%;
			-webkit-overflow-scrolling: touch;
		}
		.imogi-cashier-group-picker-menu.is-open { display: block; }
		.imogi-cashier-group-picker-option {
			align-items: center;
			background: transparent;
			border: none;
			border-radius: 10px;
			color: #334155;
			cursor: pointer;
			display: flex;
			font-size: 14px;
			font-weight: 600;
			gap: 10px;
			min-height: 42px;
			padding: 8px 10px;
			text-align: left;
			width: 100%;
		}
		.imogi-cashier-group-picker-option.is-active { background: #0f1f35; color: #fff; }
		.imogi-cashier-group-picker-option-icon {
			align-items: center;
			border-radius: 8px;
			display: inline-flex;
			flex-shrink: 0;
			font-size: 12px;
			height: 28px;
			justify-content: center;
			width: 28px;
		}
		.imogi-cashier-group-picker-option.is-active .imogi-cashier-group-picker-option-icon { background: rgba(255,255,255,.14); color: #fff; }
		.imogi-cashier-group-picker-option:not(.is-active) .imogi-cashier-group-picker-option-icon { background: #f1f5f9; color: #475569; }
		.imogi-cashier-panel.imogi-cashier-products { flex: 1; min-height: 0; overflow: hidden; }
		.imogi-cashier-panel.imogi-cashier-cart { display: flex; flex-direction: column; height: 100%; max-height: 100%; min-height: 0; overflow: hidden; }
		.imogi-cashier-grid.items-container { align-content: start; display: grid; flex: 1 1 auto; gap: 12px; grid-auto-rows: max-content; grid-template-columns: repeat(auto-fill, minmax(168px, 1fr)); min-height: 0; overflow-x: hidden; overflow-y: auto; padding: 14px; padding-bottom: 20px; -webkit-overflow-scrolling: touch; }
		.imogi-cashier-grid.items-container::after { content: ""; display: block; height: 1px; }
		.imogi-cashier-cart-items { flex: 1 1 auto; min-height: 0; overflow-x: hidden; overflow-y: auto; padding: 0; text-align: left; -webkit-overflow-scrolling: touch; }
		.imogi-cashier-page .items-container .item-wrapper { background: #fff; border: 1px solid #e8ecf1; border-radius: 12px; box-shadow: 0 1px 3px rgba(15,31,53,.06), 0 4px 12px rgba(15,31,53,.04); cursor: pointer; display: flex; flex-direction: column; height: auto; overflow: hidden; position: relative; transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease; user-select: none; }
		.imogi-cashier-page .items-container .item-wrapper.is-out { opacity: .55; pointer-events: none; }
		.imogi-cashier-page .items-container .item-wrapper:active:not(.is-out) { transform: translateY(0); }
		.imogi-cashier-page .items-container .item-qty-pill { display: flex; justify-content: flex-end; margin: 8px; position: absolute; right: 0; top: 0; z-index: 2; }
		.imogi-cashier-page .items-container .item-display, .imogi-cashier-page .items-container .item-media { align-items: center; aspect-ratio: 1; background: linear-gradient(160deg, #f8fafc 0%, #eef2f7 100%); display: flex; flex-shrink: 0; height: auto; justify-content: center; margin: 0; min-height: 0; overflow: hidden; width: 100%; }
		.imogi-cashier-page .items-container .item-display { color: #94a3b8; font-size: 1.75rem; font-weight: 800; letter-spacing: .02em; }
		.imogi-cashier-page .items-container .item-img { border-radius: 0; display: block; height: 100%; object-fit: contain; object-position: center; width: 100%; }
		.imogi-cashier-page .items-container .item-detail { border-top: 1px solid #f1f5f9; box-sizing: border-box; display: flex; flex-direction: column; flex: 1; gap: 4px; justify-content: flex-start; min-height: 4rem; padding: 10px 12px 12px; }
		.imogi-cashier-page .items-container .item-name { -webkit-box-orient: vertical; -webkit-line-clamp: 2; color: #1e293b; display: -webkit-box; font-size: 13px; font-weight: 600; line-height: 1.35; overflow: hidden; white-space: normal; }
		.imogi-cashier-page .items-container .item-rate { color: #0f1f35; font-size: 12px; font-variant-numeric: tabular-nums; font-weight: 800; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
		.imogi-cashier-page .items-container .item-rate .item-uom { color: #94a3b8; font-size: 11px; font-weight: 600; }
		.imogi-cashier-page .items-container .item-stock { align-items: center; color: #64748b; display: flex; font-size: 11px; font-weight: 600; gap: 6px; line-height: 1.2; margin-top: 4px; }
		.imogi-cashier-page .items-container .item-stock--ok { color: #047857; }
		.imogi-cashier-page .items-container .item-stock--out { color: #b91c1c; }
		.imogi-cashier-page .items-container .item-stock--variant { color: #64748b; font-style: italic; }
		.imogi-cashier-page .items-container .item-stock .indicator-pill { font-size: 10px; font-weight: 800; padding: 2px 8px; }
		.item-quick-add { display: none; }
		.imogi-cashier-page .items-container .item-quick-add {
			align-items: center;
			background: #ecfdf5;
			border: 1px solid #6ee7b7;
			border-radius: 999px;
			color: #047857;
			flex-shrink: 0;
			font-size: 14px;
			height: 34px;
			justify-content: center;
			margin: 0 10px 0 4px;
			width: 34px;
		}
		.imogi-cashier-loading, .imogi-cashier-empty { align-items: center; color: #94a3b8; display: flex; flex-direction: column; gap: 10px; grid-column: 1/-1; justify-content: center; min-height: 220px; }
		.imogi-cashier-cart-empty { color: #94a3b8; padding: 40px 16px; text-align: center; }
		.imogi-cart-row { border-bottom: 1px solid #f1f5f9; box-sizing: border-box; display: flex; flex-direction: column; gap: 8px; padding: 14px; width: 100%; }
		.imogi-cart-row-line { align-items: flex-start; display: flex; gap: 10px; justify-content: space-between; min-width: 0; width: 100%; }
		.imogi-cart-row-name { color: #0f172a; flex: 1; font-size: 14px; font-weight: 700; line-height: 1.35; min-width: 0; text-align: left; word-break: break-word; }
		.imogi-cart-row-amount { color: #0f1f35; flex-shrink: 0; font-size: 15px; font-variant-numeric: tabular-nums; font-weight: 800; line-height: 1.35; text-align: right; white-space: nowrap; }
		.imogi-cart-row-actions { align-items: center; display: flex; gap: 10px; justify-content: space-between; min-width: 0; width: 100%; }
		.imogi-cart-row-meta { color: #94a3b8; flex: 1; font-size: 12px; line-height: 1.2; min-width: 0; text-align: right; }
		.imogi-cart-qty-group { align-items: center; background: #f8fafc; border: 1px solid #e4e4e7; border-radius: 10px; box-sizing: border-box; display: inline-flex; flex-shrink: 0; gap: 0; justify-content: space-between; padding: 2px; width: 112px; }
		.imogi-qty-btn { align-items: center; background: transparent; border: none; border-radius: 8px; color: #0f1f35; cursor: pointer; display: inline-flex; flex-shrink: 0; font-size: 18px; font-weight: 700; height: 36px; justify-content: center; line-height: 1; padding: 0; width: 36px; }
		.imogi-cart-qty { align-items: center; color: #0f172a; display: inline-flex; flex: 1; font-size: 15px; font-variant-numeric: tabular-nums; font-weight: 800; justify-content: center; line-height: 1; min-width: 0; text-align: center; }
		.imogi-cashier-cart-foot { background: #fafafa; border-top: 1px solid #e4e4e7; flex-shrink: 0; padding: 12px 14px calc(12px + env(safe-area-inset-bottom, 0px)); }
		.imogi-cashier-order-type-row { margin-bottom: 8px; }
		.imogi-cashier-order-type-label { color: #52525b; font-size: 10px; font-weight: 800; letter-spacing: .04em; margin-bottom: 6px; text-transform: uppercase; }
		.imogi-cashier-order-types { display: grid; gap: 5px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
		.imogi-cashier-order-type-btn { align-items: center; background: #fff; border: 1px solid #d4d4d8; border-radius: 8px; color: #71717a; cursor: pointer; display: flex; flex-direction: row; font-size: 10px; font-weight: 700; gap: 4px; justify-content: center; line-height: 1.1; min-height: 34px; padding: 6px 4px; text-align: center; }
		.imogi-cashier-order-type-btn .fa { font-size: 12px; }
		.imogi-cashier-order-type-btn.is-active { background: #0f1f35; border-color: #0f1f35; color: #fff; }
		.imogi-cashier-customer-row, .imogi-cashier-discount-row { align-items: center; display: flex; gap: 8px; margin-bottom: 8px; }
		.imogi-cashier-customer-row input { flex: 1; min-width: 0; width: 100%; }
		.imogi-cashier-customer-row input, .imogi-cashier-discount-row select, .imogi-cashier-discount-row input { font-size: 12px !important; }
		.imogi-cashier-subtotal-row { align-items: baseline; color: #64748b; display: flex; font-size: 13px; justify-content: space-between; margin-bottom: 6px; }
		.imogi-cashier-total-row { align-items: baseline; display: flex; justify-content: space-between; margin-bottom: 10px; }
		.imogi-cashier-total-row span { color: #71717a; font-size: 13px; font-weight: 600; }
		.imogi-cart-total { color: #0f1f35 !important; font-size: 22px !important; font-weight: 800 !important; }
		.imogi-cashier-pay { background: #0f1f35 !important; border: none !important; border-radius: 10px !important; box-shadow: none !important; color: #fff !important; font-size: 15px !important; font-weight: 800 !important; padding: 12px !important; width: 100%; }
		.imogi-cashier-pay:focus { background: #1a3352 !important; color: #fff !important; }
		.imogi-cashier-pay:disabled { box-shadow: none !important; opacity: .4; }
		.imogi-pay-change-box { align-items: center; background: var(--imogi-pay-surface-2, #f4f4f5); border: 2px solid var(--imogi-pay-border, #e4e4e7); border-radius: 12px; color: var(--imogi-navy-800, #0f1f35); display: flex; font-size: 26px; font-variant-numeric: tabular-nums; font-weight: 800; justify-content: center; min-height: 72px; padding: 12px; text-align: center; transition: background .15s, border-color .15s, color .15s; }
		.imogi-pay-change-box.is-ok { background: #f0fdf4; border-color: #86efac; color: #166534; }
		.imogi-pay-change-box.is-short { background: #fef2f2; border-color: #fca5a5; color: #b91c1c; }
		.imogi-pay-cash-quick { margin-top: 12px; }
		.imogi-pay-dialog:not(.imogi-pay-cash-mode) .imogi-pay-cash-quick { display: none !important; }
		.imogi-pay-dialog.imogi-pay-cash-mode .imogi-pay-cash-quick { display: block !important; }
		.imogi-pay-quick-row { display: grid; gap: 8px; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 8px; }
		.imogi-pay-quick-btn { background: #fff; border: 1px solid var(--imogi-pay-border, #e4e4e7); border-radius: 10px; color: var(--imogi-navy-800, #0f1f35); cursor: pointer; font-size: 13px; font-weight: 700; min-height: 48px; padding: 10px 8px; touch-action: manipulation; transition: background .12s, border-color .12s, color .12s; }
		.imogi-pay-quick-btn.is-exact { background: var(--imogi-navy-800, #0f1f35); border-color: var(--imogi-navy-800, #0f1f35); color: #fff; }
		.imogi-pay-quick-btn.is-disabled, .imogi-pay-quick-btn:disabled { cursor: not-allowed; opacity: 0.42; }
		.imogi-pay-quick-label { color: #71717a; font-size: 11px; font-weight: 700; letter-spacing: .05em; margin-top: 14px; text-transform: uppercase; }
		.imogi-pay-discount-wrap, .imogi-pay-promo-wrap { margin-bottom: 0; }
		.imogi-pay-discount-toggle, .imogi-pay-promo-toggle { align-items: center; background: #fff; border: 1px solid var(--imogi-pay-border, #e4e4e7); border-radius: 12px; color: var(--imogi-navy-800, #0f1f35); cursor: pointer; display: flex; font-size: 13px; font-weight: 700; gap: 10px; margin-bottom: 8px; min-height: 52px; overflow: hidden; padding: 12px 14px; text-align: left; touch-action: manipulation; width: 100%; }
		.imogi-pay-discount-toggle.is-open, .imogi-pay-promo-toggle.is-open { background: #f8fafc; border-color: var(--imogi-navy-800, #0f1f35); }
		.imogi-pay-promo-toggle { background: #fff; }
		.imogi-pay-section-icon { align-items: center; background: #f4f4f5; border-radius: 10px; color: #52525b; display: inline-flex; flex-shrink: 0; font-size: 14px; height: 36px; justify-content: center; width: 36px; }
		.imogi-pay-section-text { display: flex; flex: 1; flex-direction: column; gap: 2px; min-width: 0; }
		.imogi-pay-section-text strong { font-size: 14px; font-weight: 700; line-height: 1.2; }
		.imogi-pay-section-text small { color: #71717a; font-size: 11px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
		.imogi-pay-section-chevron { color: #a1a1aa; flex-shrink: 0; font-size: 12px; margin-left: auto; transition: transform .15s; }
		.imogi-pay-discount-toggle.is-open .imogi-pay-section-chevron, .imogi-pay-promo-toggle.is-open .imogi-pay-section-chevron { transform: rotate(180deg); }
		.imogi-pay-discount-panel, .imogi-pay-promo-panel { display: none; margin-bottom: 8px; }
		.imogi-pay-discount-panel.is-open, .imogi-pay-promo-panel.is-open { display: block; }
		.imogi-pay-discount-panel { background: #fff; border: 1px solid var(--imogi-pay-border, #e4e4e7); border-radius: 12px; padding: 12px; }
		.imogi-pay-discount-row { align-items: center; display: flex; gap: 8px; }
		.imogi-pay-discount-row select, .imogi-pay-discount-row input { flex: 1; font-size: 14px !important; min-height: 44px !important; min-width: 0; }
		.imogi-pay-voucher-row, .imogi-pay-loyalty-input-row { align-items: center; display: flex; gap: 8px; margin-bottom: 8px; }
		.imogi-pay-voucher-row input, .imogi-pay-loyalty-input-row input { flex: 1; min-width: 0; }
		.imogi-pay-loyalty-row { margin-top: 8px; }
		.imogi-pos-offline-bar { background: #7f1d1d; color: #fff; display: none; font-size: 12px; font-weight: 700; left: 0; padding: 8px 12px; position: fixed; right: 0; text-align: center; top: 0; z-index: 99999; }
		.imogi-pos-offline-bar.is-visible { display: block; }
		.imogi-cashier-promo-hint { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; color: #047857; font-size: 11px; font-weight: 700; margin-bottom: 8px; padding: 8px 10px; }
		.imogi-cashier-promo-hint--pending { background: #fffbeb; border-color: #fde68a; color: #b45309; }
		@media (pointer: coarse) {
			.imogi-cashier-group-btn, .imogi-pay-quick-btn, .imogi-cashier-order-type-btn { min-height: 44px; }
			.imogi-cart-qty-group { min-height: 44px; padding: 3px; width: 120px; }
			.imogi-qty-btn { height: 38px; width: 38px; }
		}
		.imogi-pay-dialog {
			--imogi-pay-border: #e4e4e7;
			--imogi-pay-surface: #fff;
			--imogi-pay-surface-2: #f8fafc;
		}
		.imogi-pay-dialog .frappe-control[data-fieldname="mode_of_payment"] { display: none !important; }
		.imogi-pay-dialog .modal-dialog { margin-left: auto !important; margin-right: auto !important; max-width: min(1140px, 96vw) !important; width: min(1140px, 96vw) !important; }
		.imogi-pay-dialog.imogi-pay-mobile .modal-dialog { max-width: 100% !important; width: 100% !important; }
		.imogi-pay-dialog .frappe-control[class*="col-"] { flex: 0 0 100% !important; max-width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; width: 100% !important; }
		.imogi-pay-dialog .modal-content {
			border: none; border-radius: 16px; box-shadow: 0 24px 64px rgba(7,17,31,.18);
			display: flex; flex-direction: column; max-height: min(92vh, 880px); overflow: hidden;
		}
		.imogi-pay-dialog .modal-header { background: var(--imogi-pay-surface); border-bottom: 1px solid var(--imogi-pay-border); flex-shrink: 0; padding: 16px 20px 14px; }
		.imogi-pay-dialog .modal-title { display: flex; flex-direction: column; gap: 2px; line-height: 1.2; }
		.imogi-pay-title-main { color: var(--imogi-navy-800, #0f1f35); font-size: 18px; font-weight: 800; }
		.imogi-pay-title-sub { color: #71717a; font-size: 12px; font-weight: 500; }
		.imogi-pay-dialog .modal-body { background: var(--imogi-pay-surface-2); flex: 1 1 auto; min-height: 0; overflow-x: hidden; overflow-y: auto; padding: 0; -webkit-overflow-scrolling: touch; }
		.imogi-pay-dialog .modal-body > .form-layout,
		.imogi-pay-dialog .modal-body > form,
		.imogi-pay-dialog .modal-body > .form-section,
		.imogi-pay-dialog .modal-body > .form-page { display: none !important; }
		.imogi-pay-shell { display: grid; gap: 0; grid-template-columns: 1fr; min-height: 0; width: 100%; }
		.imogi-pay-col { box-sizing: border-box; min-width: 0; padding: 16px 20px 20px; width: 100%; }
		.imogi-pay-col--summary { background: var(--imogi-pay-surface); border-bottom: 1px solid var(--imogi-pay-border); }
		.imogi-pay-col--checkout { background: var(--imogi-pay-surface-2); display: flex; flex-direction: column; gap: 12px; min-width: 0; }
		.imogi-pay-checkout-stack { display: flex; flex: 1; flex-direction: column; gap: 12px; min-width: 0; width: 100%; }
		.imogi-pay-checkout-stack > .frappe-control,
		.imogi-pay-extras > .frappe-control { margin: 0 !important; max-width: 100% !important; padding: 0 !important; width: 100% !important; }
		.imogi-pay-checkout-stack .form-group,
		.imogi-pay-extras .form-group { margin-bottom: 0 !important; width: 100%; }
		.imogi-pay-dialog .frappe-control[data-fieldname="pay_summary_html"],
		.imogi-pay-dialog .frappe-control[data-fieldname="payment_modes_html"],
		.imogi-pay-dialog .frappe-control[data-fieldname="change_html"],
		.imogi-pay-dialog .frappe-control[data-fieldname="discount_html"],
		.imogi-pay-dialog .frappe-control[data-fieldname="promo_html"] { width: 100% !important; }
		.imogi-pay-dialog .modal-footer { background: var(--imogi-pay-surface); border-top: 1px solid var(--imogi-pay-border); box-shadow: 0 -8px 32px rgba(7,17,31,.06); display: flex; flex-direction: column; flex-shrink: 0; gap: 10px; padding: 14px 20px calc(14px + env(safe-area-inset-bottom, 0px)); }
		.imogi-pay-dialog .modal-footer .btn-modal-secondary, .imogi-pay-dialog .modal-footer .btn-secondary { display: none !important; }
		.imogi-pay-dialog .modal-footer .standard-actions, .imogi-pay-dialog .modal-footer .custom-actions { margin: 0 !important; width: 100%; }
		.imogi-pay-dialog .modal-footer .btn-primary {
			background: var(--imogi-navy-800, #0f1f35) !important; border: none !important; border-radius: 12px !important;
			box-shadow: 0 4px 16px rgba(15,31,53,.24) !important; font-size: 16px !important; font-weight: 800 !important;
			height: 52px !important; letter-spacing: .01em; width: 100%;
		}
		.imogi-pay-dialog .modal-footer .btn-primary:hover { background: var(--imogi-navy-700, #1a3352) !important; }
		.imogi-pay-dialog .modal-footer .btn-primary:disabled { background: #d4d4d8 !important; box-shadow: none !important; }
		.imogi-pay-footer-strip { align-items: center; display: flex; justify-content: space-between; width: 100%; }
		.imogi-pay-footer-label { color: #71717a; font-size: 12px; font-weight: 600; }
		.imogi-pay-footer-amount { color: var(--imogi-navy-800, #0f1f35); font-size: 20px; font-variant-numeric: tabular-nums; font-weight: 800; }
		.imogi-pay-top { display: flex; flex-direction: column; gap: 12px; }
		.imogi-pay-total-strip { background: linear-gradient(135deg, var(--imogi-navy-800, #0f1f35) 0%, var(--imogi-navy-700, #1a3352) 100%); border-radius: 14px; color: #fff; padding: 16px 18px; }
		.imogi-pay-total-strip-meta { align-items: center; display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
		.imogi-pay-item-badge, .imogi-pay-order-badge { align-items: center; background: rgba(255,255,255,.12); border-radius: 999px; color: rgba(255,255,255,.9); display: inline-flex; font-size: 11px; font-weight: 600; gap: 5px; padding: 4px 10px; }
		.imogi-pay-total-strip-label { color: rgba(255,255,255,.7); display: block; font-size: 11px; font-weight: 700; letter-spacing: .06em; margin-bottom: 4px; text-transform: uppercase; }
		.imogi-pay-hero-amount { color: #fff !important; font-size: 32px !important; font-variant-numeric: tabular-nums; font-weight: 800 !important; line-height: 1.05; }
		.imogi-pay-hero-amount .imogi-pay-currency { color: rgba(255,255,255,.88) !important; font-size: 20px; }
		.imogi-pay-receipt { background: var(--imogi-pay-surface-2); border: 1px solid var(--imogi-pay-border); border-radius: 12px; padding: 12px 14px; }
		.imogi-pay-receipt-title { color: #71717a; font-size: 11px; font-weight: 700; letter-spacing: .05em; margin-bottom: 8px; text-transform: uppercase; }
		.imogi-pay-breakdown-row { align-items: baseline; color: #64748b; display: flex; font-size: 13px; justify-content: space-between; margin-bottom: 6px; }
		.imogi-pay-breakdown-row strong { color: var(--imogi-navy-800, #0f1f35); font-size: 13px; font-variant-numeric: tabular-nums; font-weight: 700; }
		.imogi-pay-breakdown-row.is-discount strong { color: #be123c; }
		.imogi-pay-breakdown-row.is-tax strong { color: #047857; }
		.imogi-pay-breakdown-divider { border-top: 1px dashed var(--imogi-pay-border); margin: 8px 0; }
		.imogi-pay-checkout-block { background: var(--imogi-pay-surface); border: 1px solid var(--imogi-pay-border); border-radius: 14px; margin-bottom: 12px; padding: 14px 16px; }
		.imogi-pay-block-title { color: var(--imogi-navy-800, #0f1f35); font-size: 13px; font-weight: 800; letter-spacing: .02em; margin-bottom: 12px; }
		.imogi-pay-block-title .reqd { color: #e11d48; margin-left: 2px; }
		.imogi-pay-block-title .fa { color: #71717a; margin-right: 6px; }
		.imogi-pay-modes { background: transparent; border: none; margin: 0; padding: 0; }
		.imogi-pay-modes-label { display: none; }
		.imogi-pay-modes-grid { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(108px, 1fr)); width: 100%; }
		.imogi-pay-mode-card {
			align-items: center; background: #fff; border: 1.5px solid var(--imogi-pay-border); border-radius: 12px;
			color: var(--imogi-navy-800, #0f1f35); cursor: pointer; display: flex; flex-direction: column;
			gap: 8px; justify-content: center; min-height: 88px; min-width: 0; padding: 12px 10px;
			touch-action: manipulation; transition: border-color .12s, background .12s, box-shadow .12s; width: 100%;
		}
		.imogi-pay-mode-card.is-active { background: #f8fafc; border-color: var(--imogi-navy-800, #0f1f35); box-shadow: 0 0 0 1px var(--imogi-navy-800, #0f1f35); }
		.imogi-pay-mode-icon { align-items: center; background: #f4f4f5; border-radius: 999px; color: #52525b; display: inline-flex; flex-shrink: 0; font-size: 18px; height: 40px; justify-content: center; width: 40px; }
		.imogi-pay-mode-card.is-active .imogi-pay-mode-icon { background: var(--imogi-navy-800, #0f1f35); color: #fff; }
		.imogi-pay-mode-card.is-qris.is-active { border-color: #0f766e; box-shadow: 0 0 0 1px #0f766e; }
		.imogi-pay-mode-card.is-qris.is-active .imogi-pay-mode-icon { background: #0f766e; color: #fff; }
		.imogi-pay-mode-name { font-size: 12px; font-weight: 700; line-height: 1.3; max-width: 100%; overflow: hidden; text-align: center; text-overflow: ellipsis; white-space: nowrap; width: 100%; }
		.imogi-pay-cash-section { background: transparent; border: none; margin: 0; padding: 0; }
		.imogi-pay-section-head { align-items: center; color: var(--imogi-navy-800, #0f1f35); display: flex; font-size: 13px; font-weight: 800; gap: 8px; margin-bottom: 12px; }
		.imogi-pay-section-head .fa { color: #71717a; }
		.imogi-pay-cash-grid { display: grid; gap: 12px; grid-template-columns: 1fr 1fr; }
		.imogi-pay-cash-label { color: #71717a; font-size: 11px; font-weight: 700; letter-spacing: .05em; margin-bottom: 6px; text-transform: uppercase; }
		.imogi-pay-dialog .frappe-control[data-fieldname="paid_amount"] { margin: 0 !important; }
		.imogi-pay-dialog .frappe-control[data-fieldname="paid_amount"] .control-label { display: none; }
		.imogi-pay-dialog .frappe-control[data-fieldname="paid_amount"] input {
			background: #fff !important; border: 2px solid var(--imogi-pay-border) !important; border-radius: 12px !important;
			box-shadow: none !important; color: var(--imogi-navy-800, #0f1f35) !important; font-size: 24px !important;
			font-weight: 800 !important; height: 72px !important; padding: 8px 12px !important; text-align: center;
		}
		.imogi-pay-dialog .frappe-control[data-fieldname="paid_amount"].is-focused input { border-color: var(--imogi-navy-800, #0f1f35) !important; }
		.imogi-pay-qris-hint, .imogi-pay-noncash-hint { align-items: flex-start; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; color: #1e40af; display: flex; font-size: 13px; font-weight: 500; gap: 10px; line-height: 1.45; margin: 0 0 12px; padding: 12px 14px; }
		.imogi-pay-noncash-hint { background: #f8fafc; border-color: var(--imogi-pay-border); color: #52525b; }
		.imogi-pay-qris-hint .fa, .imogi-pay-noncash-hint .fa { flex-shrink: 0; font-size: 16px; margin-top: 1px; }
		.imogi-pay-extras { display: flex; flex-direction: column; flex-shrink: 0; gap: 0; margin-top: auto; width: 100%; }
		.imogi-pay-numpad-wrap { display: none; margin-top: 12px; }
		.imogi-pay-numpad-wrap.is-visible { display: block; }
		.imogi-pay-numpad { display: grid; gap: 8px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
		.imogi-pay-numpad-key { background: #fff; border: 1px solid var(--imogi-pay-border); border-radius: 10px; color: var(--imogi-navy-800, #0f1f35); cursor: pointer; font-size: 20px; font-variant-numeric: tabular-nums; font-weight: 800; height: 52px; padding: 0; touch-action: manipulation; }
		.imogi-pay-numpad-key:active { background: var(--imogi-navy-800, #0f1f35); border-color: var(--imogi-navy-800, #0f1f35); color: #fff; }
		.imogi-pay-summary { background: linear-gradient(135deg, var(--imogi-navy-800, #0f1f35) 0%, var(--imogi-navy-700, #1a3352) 100%); border-radius: 14px; color: #fff; margin-bottom: 14px; overflow: hidden; padding: 16px 18px 14px; }
		.imogi-pay-summary .imogi-pay-breakdown-row { color: rgba(255,255,255,.78); font-size: 12px; margin-bottom: 5px; }
		.imogi-pay-summary .imogi-pay-breakdown-row strong { color: #fff; font-size: 15px; }
		.imogi-pay-summary .imogi-pay-breakdown-row.is-discount strong { color: #fecdd3; }
		.imogi-pay-summary .imogi-pay-breakdown-row.is-tax strong { color: #bbf7d0; }
		.imogi-pay-total-footer { align-items: flex-end; border-top: 1px solid rgba(255,255,255,.14); display: flex; justify-content: space-between; padding-top: 12px; }
		.imogi-pay-summary .imogi-pay-total-label { color: rgba(255,255,255,.72); font-size: 11px; font-weight: 700; letter-spacing: .04em; margin: 0; text-transform: uppercase; }
		.imogi-pay-summary .imogi-pay-total-value { color: #fff !important; font-size: 28px !important; font-weight: 800 !important; line-height: 1.1; text-align: right; }
		.imogi-pay-shell--split { grid-template-columns: minmax(260px, 34%) minmax(0, 1fr); min-height: 0; }
		.imogi-pay-shell--split .imogi-pay-col--summary { border-bottom: none; border-right: 1px solid var(--imogi-pay-border); }
		.imogi-pay-shell--split .imogi-pay-modes-grid { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
		@media (min-width: 993px) {
			.imogi-pay-dialog .modal-content { max-height: min(90vh, 920px); }
		}
		@media (max-width: 992px) and (orientation: landscape) {
			.modal.imogi-pay-dialog.imogi-pay-landscape .modal-dialog {
				margin: 0 auto !important;
				max-width: min(1120px, 96vw) !important;
				width: min(1120px, 96vw) !important;
			}
			.modal.imogi-pay-dialog.imogi-pay-landscape .modal-content {
				border-radius: 16px !important;
				max-height: min(94vh, 720px) !important;
			}
		}
		@media (max-width: 992px) and (orientation: portrait) {
			.imogi-pay-modes-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
		}
		@media (max-width: 992px) and (orientation: landscape) {
			.modal.imogi-pay-dialog.imogi-pay-landscape {
				align-items: center !important;
				justify-content: center !important;
				padding: 10px 16px !important;
			}
			.modal.imogi-pay-dialog.imogi-pay-landscape .modal-content {
				display: flex !important;
				flex-direction: column !important;
			}
			.modal.imogi-pay-dialog.imogi-pay-landscape .modal-body {
				flex: 1 1 auto !important;
				min-height: 0 !important;
				overflow-y: auto !important;
			}
			.imogi-pay-dialog.imogi-pay-landscape .imogi-pay-col--summary,
			.imogi-pay-dialog.imogi-pay-landscape .imogi-pay-col--checkout { padding: 12px 14px 14px !important; }
			.imogi-pay-dialog.imogi-pay-landscape .imogi-pay-mode-card { min-height: 76px; padding: 10px 8px; }
			.imogi-pay-dialog.imogi-pay-landscape .imogi-pay-hero-amount { font-size: 26px !important; }
			.imogi-pay-dialog.imogi-pay-landscape .imogi-pay-numpad-key { height: 44px; }
		}
		.imogi-pay-dialog.imogi-pay-mobile .imogi-pay-numpad-wrap.is-visible { display: block; }
		.imogi-pay-dialog.imogi-pay-mobile .frappe-control[data-fieldname="paid_amount"] input {
			caret-color: transparent;
			cursor: default;
			pointer-events: none;
			user-select: none;
			-webkit-user-select: none;
		}
		.imogi-pay-dialog.imogi-pay-mobile .frappe-control[data-fieldname="paid_amount"] {
			margin-bottom: 8px;
		}
		.imogi-pay-dialog.imogi-pay-mobile .frappe-control[data-fieldname="paid_amount"] .control-label {
			color: #71717a;
			font-size: 11px;
			font-weight: 800;
			letter-spacing: .04em;
			margin-bottom: 8px;
			text-align: center;
			text-transform: uppercase;
			width: 100%;
		}
		.imogi-pay-dialog.imogi-pay-mobile .frappe-control[data-fieldname="paid_amount"] input {
			background: #f8fafc !important;
			border: 2px solid #e4e4e7 !important;
			border-radius: 14px !important;
			box-shadow: none !important;
			color: #0f1f35 !important;
			font-size: 32px !important;
			font-weight: 800 !important;
			height: 64px !important;
			padding: 8px 12px !important;
			text-align: center;
		}
		@media (max-width: 992px) {
			.modal.imogi-pay-dialog.imogi-pay-mobile {
				align-items: flex-end !important;
				justify-content: flex-end !important;
				padding: 0 !important;
			}
			.modal.imogi-pay-dialog.imogi-pay-mobile .modal-dialog {
				align-items: stretch;
				display: flex !important;
				margin: 0 !important;
				max-height: min(94dvh, 720px);
				max-width: 100% !important;
				min-height: 0 !important;
				width: 100% !important;
			}
			.modal.imogi-pay-dialog.imogi-pay-mobile .modal-content {
				border: none;
				border-radius: 20px 20px 0 0;
				display: flex;
				flex-direction: column;
				max-height: min(94dvh, 720px);
				overflow: hidden;
			}
			.modal.imogi-pay-dialog.imogi-pay-mobile .modal-header {
				flex-shrink: 0;
				padding: 14px 16px 12px;
			}
			.modal.imogi-pay-dialog.imogi-pay-mobile .modal-title { font-size: 16px; }
			.modal.imogi-pay-dialog.imogi-pay-mobile .modal-body {
				flex: 1 1 auto;
				min-height: 0;
				overflow-x: hidden;
				overflow-y: auto;
				overscroll-behavior: contain;
				padding: 12px 16px 8px;
				-webkit-overflow-scrolling: touch;
			}
			.modal.imogi-pay-dialog.imogi-pay-mobile .modal-footer {
				background: #fff;
				border-top: 1px solid #e4e4e7;
				box-shadow: 0 -8px 24px rgba(15,31,53,.08);
				flex-shrink: 0;
				padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
				position: relative;
				z-index: 3;
			}
			.modal.imogi-pay-dialog.imogi-pay-mobile .modal-footer .btn-primary {
				border-radius: 14px !important;
				font-size: 16px !important;
				font-weight: 800 !important;
				height: 54px !important;
				width: 100%;
			}
			.imogi-pay-dialog.imogi-pay-mobile .imogi-pay-col { padding: 14px 16px 16px; }
			.imogi-pay-dialog.imogi-pay-mobile .imogi-pay-col--summary { padding-bottom: 12px; }
			.imogi-pay-dialog.imogi-pay-mobile .imogi-pay-hero-amount { font-size: 28px !important; }
			.imogi-pay-dialog.imogi-pay-mobile .imogi-pay-modes-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); overflow: visible; }
			.imogi-pay-dialog.imogi-pay-mobile .imogi-pay-cash-section { margin-top: 0; }
			.imogi-pay-dialog.imogi-pay-mobile .imogi-pay-quick-row {
				display: grid;
				gap: 6px;
				grid-template-columns: repeat(3, minmax(0, 1fr));
				margin-top: 10px;
				overflow: visible;
			}
			.imogi-pay-dialog.imogi-pay-mobile .imogi-pay-quick-btn {
				flex: 0 0 auto;
				min-width: 72px;
				padding: 10px 12px;
			}
			.imogi-pay-dialog.imogi-pay-mobile .imogi-pay-numpad-wrap.is-visible {
				display: block;
				margin-top: 8px;
			}
			.imogi-pay-dialog.imogi-pay-mobile .imogi-pay-numpad-wrap:not(.is-visible) {
				display: none;
			}
			.imogi-pay-dialog.imogi-pay-mobile .imogi-pay-numpad { gap: 6px; }
			.imogi-pay-dialog.imogi-pay-mobile .imogi-pay-numpad-key {
				border-radius: 12px;
				font-size: 22px;
				height: 50px;
			}
			.imogi-pay-dialog.imogi-pay-mobile .imogi-pay-hero { border-radius: 16px; padding: 16px; }
			.imogi-pay-dialog.imogi-pay-mobile .imogi-pay-hero-amount { font-size: 30px !important; }
			.imogi-pay-dialog.imogi-pay-mobile:not(.imogi-pay-cash-mode) .imogi-pay-cash-section,
			.imogi-pay-dialog.imogi-pay-mobile:not(.imogi-pay-cash-mode) .frappe-control[data-fieldname="paid_amount"],
			.imogi-pay-dialog.imogi-pay-mobile:not(.imogi-pay-cash-mode) .imogi-pay-numpad-wrap {
				display: none !important;
			}
			.modal.imogi-pay-dialog.imogi-pay-mobile .modal-footer {
				display: flex !important;
				flex-direction: column !important;
				gap: 0 !important;
				padding: 12px 16px calc(14px + env(safe-area-inset-bottom, 0px)) !important;
			}
			.modal.imogi-pay-dialog.imogi-pay-mobile .modal-footer .standard-actions,
			.modal.imogi-pay-dialog.imogi-pay-mobile .modal-footer .custom-actions {
				display: flex !important;
				float: none !important;
				margin: 0 !important;
				width: 100% !important;
			}
			.modal.imogi-pay-dialog.imogi-pay-mobile .modal-footer .btn {
				border-radius: 14px !important;
				float: none !important;
				font-size: 16px !important;
				font-weight: 800 !important;
				height: 54px !important;
				margin: 0 !important;
				width: 100% !important;
			}
			.modal.imogi-pay-dialog.imogi-pay-mobile .modal-footer .btn-modal-secondary,
			.modal.imogi-pay-dialog.imogi-pay-mobile .modal-footer .btn-secondary {
				display: none !important;
			}
			.modal.imogi-pay-dialog.imogi-pay-mobile .modal-header {
				border-bottom: 1px solid #f1f5f9;
				padding: 12px 16px 10px;
			}
			.modal.imogi-pay-dialog.imogi-pay-mobile .modal-header .modal-title {
				font-size: 17px;
				font-weight: 800;
			}
			.modal.imogi-pay-dialog.imogi-pay-mobile .modal-body {
				background: #f8fafc;
				padding: 14px 16px 10px;
			}
		}
		.imogi-cashier-customer-label { line-height: 1.25; margin-bottom: 6px !important; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
		.imogi-cashier-meta { color: rgba(255,255,255,0.65); font-size: 12px; }
		.imogi-cashier-branch-row { align-items: center; display: none; gap: 8px; margin-bottom: 10px; }
		.imogi-cashier-branch-row.is-visible { display: flex; }
		.imogi-cashier-page:not(.is-mobile-layout) .imogi-cashier-top .imogi-cashier-branch-row {
			display: none !important;
		}
		.imogi-cashier-top .imogi-cashier-branch-row.is-visible {
			margin-bottom: 0;
			padding: 0 14px 10px;
		}
		.imogi-cashier-top .imogi-cashier-branch-row .fa,
		.imogi-cashier-top .imogi-cashier-branch-row .imogi-cashier-branch-label {
			color: #52525b;
			font-size: 12px;
			font-weight: 600;
		}
		.imogi-cashier-top .imogi-cashier-branch-row .imogi-cashier-branch-select {
			background: #fff;
			border-color: #e4e4e7;
			color: #0f1f35;
			font-size: 12px !important;
		}
		.imogi-cashier-branch-row .fa { color: #0f1f35; flex-shrink: 0; font-size: 14px; }
		.imogi-cashier-branch-label { color: #0f1f35; flex: 1; font-size: 13px; font-weight: 700; min-width: 0; }
		.imogi-cashier-branch-select { flex: 1; font-size: 13px !important; font-weight: 700; min-width: 0; }
		.imogi-pay-success-dialog .modal-dialog { max-width: 440px; }
		.imogi-pay-success-body { padding: 8px 4px 0 !important; text-align: center; }
		.imogi-pay-success-icon { color: #10b981; font-size: 44px; line-height: 1; margin-bottom: 6px; }
		.imogi-pay-success-order { color: #0f1f35; font-size: 17px; font-weight: 800; margin-bottom: 12px; }
		.imogi-pay-summary--success { margin-bottom: 10px; text-align: left; }
		.imogi-pay-success-payment-meta,
		.imogi-pay-success-cash-meta { border-top: 1px solid rgba(255,255,255,.12); margin-top: 10px; padding-top: 10px; }
		.imogi-pay-success-payment-meta { align-items: center; color: rgba(255,255,255,.78); display: flex; font-size: 12px; justify-content: space-between; }
		.imogi-pay-success-payment-meta strong { color: #fff; font-size: 12px; }
		.imogi-pay-success-cash-row { align-items: baseline; color: rgba(255,255,255,.78); display: flex; font-size: 12px; justify-content: space-between; margin-bottom: 4px; }
		.imogi-pay-success-cash-row strong { color: #fff; font-variant-numeric: tabular-nums; }
		.imogi-pay-success-cash-row.is-change strong { color: #bbf7d0; }
		.imogi-pay-success-status { color: #71717a; font-size: 12px; margin-top: 10px; }
		.imogi-pay-success-dialog .modal-footer { display: none !important; }
		.imogi-success-actions { border-top: 1px solid #f1f5f9; display: grid; gap: 10px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 18px; padding-top: 16px; text-align: left; }
		.imogi-success-action-btn { align-items: center; background: #fff; border: 1px solid #e4e4e7; border-radius: 12px; color: #0f1f35; cursor: pointer; display: flex; flex-direction: column; gap: 6px; justify-content: center; min-height: 78px; padding: 12px 10px; transition: border-color .15s, background .15s, transform .1s; }
		.imogi-success-action-btn.is-primary { background: #0f1f35; border-color: #0f1f35; color: #fff; flex-direction: row; gap: 10px; grid-column: 1 / -1; min-height: 48px; }
		.imogi-success-action-icon { align-items: center; background: #f8fafc; border-radius: 10px; color: #0f1f35; display: flex; font-size: 18px; height: 36px; justify-content: center; width: 36px; }
		.imogi-success-action-btn.is-primary .imogi-success-action-icon { background: rgba(255,255,255,.12); color: #fff; font-size: 16px; height: auto; width: auto; }
		.imogi-success-action-label { font-size: 12px; font-weight: 800; line-height: 1.2; text-align: center; }
		.imogi-success-action-btn.is-primary .imogi-success-action-label { font-size: 14px; }
		body.imogi-cashier-active #alert-container {
			align-items: stretch !important;
			bottom: auto !important;
			display: flex !important;
			flex-direction: column !important;
			gap: 8px !important;
			left: auto !important;
			max-width: min(360px, calc(100vw - 32px)) !important;
			pointer-events: none !important;
			right: 16px !important;
			top: calc(12px + env(safe-area-inset-top, 0px)) !important;
			width: min(360px, calc(100vw - 32px)) !important;
			z-index: 1060 !important;
		}
		body.imogi-cashier-active #alert-container .desk-alert {
			margin: 0 !important;
			pointer-events: auto !important;
			width: 100% !important;
		}
		body.imogi-cashier-active #alert-container .alert-message,
		body.imogi-cashier-active #alert-container .alert-message-container .alert-message {
			margin: 0 !important;
			max-width: 100% !important;
		}
		.imogi-cashier-mobile-filters { display: none; }
		.imogi-cashier-mobile-filter-block + .imogi-cashier-mobile-filter-block { margin-top: 8px; }
		.imogi-cashier-mobile-filter-label { color: #71717a; font-size: 10px; font-weight: 800; letter-spacing: .04em; margin-bottom: 5px; text-transform: uppercase; }
		.imogi-cashier-mobile-order-scroll {
			display: none;
			margin-top: 6px;
			overflow: hidden;
			width: 100%;
		}
		.imogi-cashier-page:not(.is-mobile-layout) .imogi-cashier-mobile-order-scroll,
		.imogi-cashier-page:not(.is-mobile-layout) .imogi-cashier-mobile-filters {
			display: none !important;
		}
		.imogi-cashier-mobile-order-types {
			display: flex;
			flex-wrap: nowrap;
			gap: 6px;
			overflow-x: auto;
			-webkit-overflow-scrolling: touch;
			padding: 2px 2px 4px;
			scrollbar-width: none;
		}
		.imogi-cashier-mobile-order-types::-webkit-scrollbar { display: none; }
		.imogi-cashier-mobile-order-types .imogi-cashier-order-type-btn {
			flex: 0 0 auto;
			font-size: 11px;
			gap: 5px;
			min-height: 38px;
			padding: 6px 12px;
			white-space: nowrap;
		}
		.imogi-cashier-mobile-chip-scroll {
			display: none;
			flex-wrap: nowrap;
			gap: 6px;
			margin-top: 6px;
			overflow-x: auto;
			-webkit-overflow-scrolling: touch;
			padding: 2px 2px 4px;
			scrollbar-width: none;
		}
		.imogi-cashier-mobile-chip-scroll::-webkit-scrollbar { display: none; }
		@media (max-width: 992px) {
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-groups { display: none !important; }
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-mobile-chip-scroll { display: none !important; }
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-mobile-filters {
				display: block !important;
				margin-top: 8px;
				width: 100%;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-mobile-filter-block {
				margin: 0;
				width: 100%;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-mobile-filter-label {
				color: #71717a;
				display: block;
				font-size: 10px;
				font-weight: 800;
				letter-spacing: .04em;
				margin-bottom: 5px;
				text-transform: uppercase;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-group-picker {
				display: block !important;
				width: 100%;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-group-picker-trigger {
				background: #fff;
				border: 1px solid #e4e4e7;
				border-radius: 12px;
				min-height: 42px;
				padding: 0 12px;
				width: 100%;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-mobile-order-scroll { display: block; margin-top: 8px; }
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-mobile-order-scroll > .imogi-cashier-mobile-filter-label {
				color: #71717a;
				display: block;
				font-size: 10px;
				font-weight: 800;
				letter-spacing: .04em;
				margin-bottom: 5px;
				text-transform: uppercase;
			}
			.imogi-cashier-page.is-mobile-layout {
				background: #f4f4f5 !important;
				padding: 0 !important;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-top {
				background: #fff;
				border: 1px solid #e4e4e7;
				border-radius: 14px;
				box-shadow: 0 1px 2px rgba(15,31,53,.04);
				gap: 0;
				margin: 8px 10px 8px;
				overflow: hidden;
				padding: 0;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-status-strip {
				border-top: 1px solid #f1f5f9;
				display: none;
				flex-wrap: nowrap;
				gap: 6px;
				overflow-x: auto;
				padding: 8px 12px 10px;
				scrollbar-width: none;
				-webkit-overflow-scrolling: touch;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-status-strip.is-visible {
				display: flex !important;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-status-strip::-webkit-scrollbar {
				display: none;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-status-strip .imogi-status-chip {
				flex: 0 0 auto;
				font-size: 11px;
				padding: 6px 10px;
				white-space: nowrap;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-top .imogi-cashier-branch-row {
				align-items: center;
				background: transparent;
				border: none;
				border-top: 1px solid #f1f5f9;
				display: flex !important;
				gap: 6px;
				margin: 0;
				padding: 8px 12px;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-top .imogi-cashier-branch-row .fa {
				color: #71717a !important;
				font-size: 11px;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-top .imogi-cashier-branch-row .imogi-cashier-branch-label,
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-top .imogi-cashier-branch-row .imogi-cashier-branch-select {
				color: #52525b !important;
				font-size: 11px !important;
				font-weight: 600;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-top .imogi-cashier-shift-text,
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-top .imogi-cashier-shift-text a {
				color: #3f3f46 !important;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-top .imogi-cashier-shift-text .fa {
				color: #16a34a !important;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-toolbar .imogi-cashier-branch-row {
				display: none !important;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-shift-bar {
				background: transparent !important;
				border: none !important;
				border-radius: 0;
				box-shadow: none;
				margin: 0;
				padding: 10px 12px !important;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-shift-text {
				color: #3f3f46 !important;
				flex: 1;
				font-size: 12px !important;
				font-weight: 700;
				min-width: 0;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-shift-text .fa {
				color: #16a34a !important;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-shift-text a {
				color: #0f1f35 !important;
				font-weight: 700;
				text-decoration: none;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-shift-actions {
				flex-shrink: 0;
				gap: 4px;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-shift-bar .btn {
				border-radius: 8px !important;
				font-size: 11px !important;
				padding: 6px 10px !important;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-top .imogi-cashier-shift-bar .imogi-cashier-logout-btn,
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-top .imogi-cashier-shift-bar .imogi-cashier-history-btn,
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-top .imogi-cashier-shift-bar .imogi-cashier-close-shift-btn {
				background: #f4f4f5 !important;
				border: 1px solid #d4d4d8 !important;
				color: #0f1f35 !important;
				font-weight: 700 !important;
				min-height: 34px;
				white-space: nowrap;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-top .imogi-cashier-shift-bar .imogi-cashier-logout-btn .fa,
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-top .imogi-cashier-shift-bar .imogi-cashier-history-btn .fa,
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-top .imogi-cashier-shift-bar .imogi-cashier-close-shift-btn .fa {
				color: #0f1f35 !important;
				margin-right: 4px;
				opacity: 1;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-chip-target {
				max-width: min(100%, calc(100vw - 130px));
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
			.modal.imogi-pay-success-dialog.imogi-pay-success-mobile {
				align-items: flex-end !important;
				justify-content: flex-end !important;
				padding: 0 !important;
			}
			.modal.imogi-pay-success-dialog.imogi-pay-success-mobile .modal-dialog {
				align-items: stretch;
				display: flex !important;
				margin: 0 !important;
				max-height: min(78dvh, 520px);
				max-width: 100% !important;
				width: 100% !important;
			}
			.modal.imogi-pay-success-dialog.imogi-pay-success-mobile .modal-content {
				border: none;
				border-radius: 20px 20px 0 0;
				max-height: min(78dvh, 520px);
				overflow: hidden;
			}
			.modal.imogi-pay-success-dialog.imogi-pay-success-mobile .modal-header {
				border-bottom: 1px solid #f1f5f9;
				padding: 12px 16px 10px;
			}
			.modal.imogi-pay-success-dialog.imogi-pay-success-mobile .modal-title {
				font-size: 16px;
				font-weight: 800;
			}
			.modal.imogi-pay-success-dialog.imogi-pay-success-mobile .modal-body {
				overflow-x: hidden;
				overflow-y: auto;
				padding: 0 16px calc(16px + env(safe-area-inset-bottom, 0px));
			}
			.imogi-pay-success-dialog.imogi-pay-success-mobile .imogi-pay-success-body {
				padding: 12px 0 4px !important;
			}
			.imogi-pay-success-dialog.imogi-pay-success-mobile .imogi-pay-success-icon {
				font-size: 36px;
				margin-bottom: 2px;
			}
			.imogi-pay-success-dialog.imogi-pay-success-mobile .imogi-pay-success-order {
				font-size: 15px;
				margin-bottom: 8px;
			}
			.imogi-pay-success-dialog.imogi-pay-success-mobile .imogi-pay-summary--success {
				margin: 0 0 8px;
				padding: 14px 16px;
			}
			.imogi-pay-success-dialog.imogi-pay-success-mobile .imogi-pay-summary--success .imogi-pay-total-value {
				font-size: 24px !important;
			}
			.imogi-pay-success-dialog.imogi-pay-success-mobile .imogi-pay-success-status {
				font-size: 11px;
				margin-top: 6px;
			}
			.imogi-pay-success-dialog.imogi-pay-success-mobile .imogi-success-actions {
				gap: 8px;
				grid-template-columns: repeat(3, minmax(0, 1fr));
				margin-top: 12px;
				padding-top: 12px;
			}
			.imogi-pay-success-dialog.imogi-pay-success-mobile .imogi-success-action-btn {
				min-height: 52px;
				padding: 8px 6px;
			}
			.imogi-pay-success-dialog.imogi-pay-success-mobile .imogi-success-action-btn.is-primary {
				flex-direction: row;
				gap: 8px;
				grid-column: 1 / -1;
				justify-content: center;
				min-height: 48px;
				padding: 0 14px;
			}
			.imogi-pay-success-dialog.imogi-pay-success-mobile .imogi-success-action-icon {
				font-size: 15px;
				height: 28px;
				width: 28px;
			}
			.imogi-pay-success-dialog.imogi-pay-success-mobile .imogi-success-action-label {
				font-size: 10px;
			}
			.imogi-pay-success-dialog.imogi-pay-success-mobile .imogi-success-action-btn.is-primary .imogi-success-action-label {
				font-size: 14px;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-panel.imogi-cashier-products {
				background: transparent;
				border: none;
				border-radius: 0;
				box-shadow: none;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-panel.imogi-cashier-products > .imogi-cashier-panel-head {
				display: none;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-toolbar {
				background: transparent;
				border-bottom: none;
				padding: 0 10px 8px;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-search {
				background: #fff !important;
				border: 1px solid #e4e4e7 !important;
				border-radius: 12px !important;
				box-shadow: 0 1px 2px rgba(15,31,53,.04);
				font-size: 14px !important;
				margin-bottom: 0;
				padding: 11px 12px !important;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-mobile-order-types .imogi-cashier-order-type-btn {
				background: #fff;
				border: 1px solid #e4e4e7;
				border-radius: 999px;
				font-size: 11px;
				min-height: 36px;
				padding: 0 12px;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-mobile-order-types .imogi-cashier-order-type-btn.is-active {
				background: #0f1f35;
				border-color: #0f1f35;
				color: #fff;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-grid.items-container {
				display: flex !important;
				flex-direction: column;
				gap: 6px;
				grid-template-columns: unset !important;
				padding: 2px 10px calc(96px + env(safe-area-inset-bottom, 0px));
			}
			.imogi-cashier-page.is-mobile-layout .items-container .item-wrapper {
				align-items: center !important;
				background: #fff;
				border: 1px solid #ececef;
				border-radius: 12px;
				box-shadow: 0 1px 2px rgba(15,31,53,.04);
				flex-direction: row !important;
				min-height: 72px;
			}
			.imogi-cashier-page.is-mobile-layout .items-container .item-display,
			.imogi-cashier-page.is-mobile-layout .items-container .item-media {
				aspect-ratio: 1 !important;
				border-radius: 10px;
				flex-shrink: 0;
				height: 60px !important;
				margin: 6px 0 6px 6px !important;
				min-height: 0;
				width: 60px !important;
			}
			.imogi-cashier-page.is-mobile-layout .items-container .item-display { font-size: .95rem !important; }
			.imogi-cashier-page.is-mobile-layout .items-container .item-img { border-radius: 10px; object-fit: cover; }
			.imogi-cashier-page.is-mobile-layout .items-container .item-detail {
				border-top: none !important;
				flex: 1;
				gap: 2px;
				justify-content: center;
				min-height: 0 !important;
				padding: 6px 8px 6px 6px !important;
			}
			.imogi-cashier-page.is-mobile-layout .items-container .item-name { font-size: 13px; line-height: 1.25; }
			.imogi-cashier-page.is-mobile-layout .items-container .item-rate { font-size: 13px; }
			.imogi-cashier-page.is-mobile-layout .items-container .item-stock { font-size: 10px; margin-top: 0; }
			.imogi-cashier-page.is-mobile-layout .items-container .item-quick-add {
				display: inline-flex !important;
				height: 32px;
				margin: 0 8px 0 2px;
				width: 32px;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-loading,
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-empty { min-height: 100px; width: 100%; }
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-shell {
				padding-bottom: calc(88px + env(safe-area-inset-bottom, 0px));
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-mobile-dock {
				background: rgba(255,255,255,.98);
				backdrop-filter: blur(10px);
				border-top: 1px solid #e4e4e7;
				border-radius: 16px 16px 0 0;
				box-shadow: 0 -6px 28px rgba(15,31,53,.08);
				gap: 8px;
				padding: 12px 14px calc(20px + env(safe-area-inset-bottom, 0px));
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-dock-cart {
				border-radius: 12px;
				font-size: 17px;
				height: 48px;
				width: 48px;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-dock-total {
				font-size: 17px;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-dock-label {
				font-size: 10px;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-dock-pay {
				border-radius: 12px !important;
				font-size: 14px !important;
				height: 48px !important;
				min-width: 100px;
				padding: 0 14px !important;
			}
		}
		/* POS touch-first: no hover highlights */
		.imogi-cashier-page :is(button, .btn, .imogi-status-chip, .imogi-cashier-group-btn, .imogi-cashier-order-type-btn, .imogi-cashier-group-picker-trigger, .imogi-cashier-group-picker-option, .item-wrapper, .imogi-qty-btn, .imogi-cashier-pay, .imogi-cashier-dock-cart, .imogi-cashier-dock-pay, .imogi-pay-quick-btn, .imogi-pay-discount-toggle, .imogi-pay-promo-toggle, .imogi-success-action-btn, .imogi-pay-numpad-key):hover {
			box-shadow: none !important;
			transform: none !important;
		}
		.imogi-pay-dialog :is(button, .btn, .imogi-pay-quick-btn, .imogi-success-action-btn):hover,
		.modal.imogi-pay-success-dialog :is(button, .btn, .imogi-success-action-btn):hover {
			box-shadow: none !important;
			transform: none !important;
		}
		.imogi-cashier-page .imogi-cashier-search:hover:not(:focus),
		.imogi-cashier-page .imogi-cashier-customer-row input:hover:not(:focus),
		.imogi-cashier-page .imogi-cashier-discount-row input:hover:not(:focus),
		.imogi-pay-dialog .form-control:hover:not(:focus) {
			background: inherit !important;
			border-color: inherit !important;
			box-shadow: none !important;
		}
		.imogi-cashier-page .btn-default:hover,
		.imogi-cashier-page .btn-primary:hover,
		.imogi-cashier-page .imogi-cashier-btn-primary:hover,
		.imogi-cashier-page .imogi-cashier-pay:hover,
		.imogi-pay-dialog .btn-primary:hover {
			filter: none !important;
			opacity: 1 !important;
		}
		.imogi-cashier-page .imogi-cashier-top .imogi-cashier-shift-bar .imogi-cashier-logout-btn:hover,
		.imogi-cashier-page .imogi-cashier-top .imogi-cashier-shift-bar .imogi-cashier-history-btn:hover,
		.imogi-cashier-page .imogi-cashier-top .imogi-cashier-shift-bar .imogi-cashier-close-shift-btn:hover {
			background: #f4f4f5 !important;
			border-color: #d4d4d8 !important;
			color: #0f1f35 !important;
		}
		.imogi-cashier-page .imogi-cashier-group-btn.is-active:hover,
		.imogi-cashier-page .imogi-cashier-order-type-btn.is-active:hover {
			background: #0f1f35 !important;
			border-color: #0f1f35 !important;
			color: #fff !important;
		}
	`, "imogi-cashier-inline-css-v47");
}

function format_stock_pill(qty) {
	let n = Math.round(flt(qty));
	if (n > 999) {
		n = n / 1000;
		return `${n.toFixed(1).replace(/\.0$/, "")}K`;
	}
	return String(n);
}

const IMOGI_HOLD_KEY = "imogi_cashier_hold_v1";
const IMOGI_BRANCH_KEY = "imogi_cashier_branch_v1";
const IMOGI_CATALOG_MEM_TTL_MS = 45000;

const IMOGI_ORDER_TYPES = [
	{ value: "Dine-in", label: __("Dine-In"), icon: "fa-cutlery" },
	{ value: "Takeaway", label: __("Takeaway"), icon: "fa-shopping-bag" },
	{ value: "Delivery", label: __("Delivery"), icon: "fa-truck" },
];

const IMOGI_ORDER_TYPE_FEATURES = {
	"Dine-in": "dine_in",
	Takeaway: "take_away",
	Delivery: "delivery_order",
};

const IMOGI_GROUP_ICON_RULES = [
	{ match: (k) => !k || k === "semua" || k === "all", icon: "fa-th-large" },
	{ match: (k) => k.includes("food") || k.includes("makan"), icon: "fa-cutlery" },
	{ match: (k) => k.includes("beverage") || k.includes("minuman") || k.includes("drink"), icon: "fa-coffee" },
	{ match: (k) => k.includes("dessert") || k.includes("kue") || k.includes("sweet"), icon: "fa-birthday-cake" },
	{ match: (k) => k.includes("service") || k.includes("layanan") || k.includes("jasa"), icon: "fa-wrench" },
	{ match: (k) => k.includes("snack") || k.includes("camilan"), icon: "fa-lemon-o" },
	{ match: (k) => k.includes("package") || k.includes("paket"), icon: "fa-gift" },
];

function imogi_resolve_group_icon(label) {
	const key = (label || "").trim().toLowerCase();
	const rule = IMOGI_GROUP_ICON_RULES.find((row) => row.match(key));
	return rule ? rule.icon : "fa-tag";
}

function imogi_render_order_type_buttons(active_type) {
	return IMOGI_ORDER_TYPES.map(
		(row) => `<button type="button" class="imogi-cashier-order-type-btn${
			row.value === active_type ? " is-active" : ""
		}" data-type="${row.value}">
			<i class="fa ${row.icon}"></i>
			<span>${row.label}</span>
		</button>`
	).join("");
}

function round_up_cash(amount, step) {
	return Math.ceil(flt(amount) / step) * step;
}

function imogi_dismiss_cashier_toast() {
	const $el = imogi_dismiss_cashier_toast._$el;
	if ($el && $el.length) {
		$el.remove();
	}
	imogi_dismiss_cashier_toast._$el = null;
}

function imogi_show_cashier_toast(message, indicator = "green", seconds = 2) {
	imogi_dismiss_cashier_toast();
	imogi_dismiss_cashier_toast._$el = frappe.show_alert(
		typeof message === "string" ? { message, indicator } : message,
		seconds
	);
}

function imogi_compute_local_tax(net, sales_tax = {}) {
	const rate = flt(sales_tax.rate) || 11;
	const enabled = sales_tax.enabled !== 0 && sales_tax.enabled !== false;
	const net_amount = Math.max(0, flt(net));
	if (!enabled || net_amount <= 0) {
		return { taxable_amount: net_amount, tax_amount: 0, grand_total: net_amount, tax_rate: rate };
	}
	if (sales_tax.prices_include_tax) {
		const tax_amount = net_amount * rate / (100 + rate);
		return {
			taxable_amount: net_amount - tax_amount,
			tax_amount,
			grand_total: net_amount,
			tax_rate: rate,
		};
	}
	const tax_amount = net_amount * rate / 100;
	return {
		taxable_amount: net_amount,
		tax_amount,
		grand_total: net_amount + tax_amount,
		tax_rate: rate,
	};
}

imogi_pos.CashierPage = class CashierPage {
	constructor(page) {
		this.page = page;
		this.wrapper = $(page.body);
		this.context = null;
		this.cart = [];
		this.marketplace_order_name = null;
		this.item_group = "";
		this.search = "";
		this.search_timer = null;
		this.busy = false;
		this.selected_customer = null;
		this.customer_loyalty = null;
		this.voucher_code = "";
		this.loyalty_points_redeem = 0;
		this.payment_preview = null;
		this.discount_type = "";
		this.discount_value = 0;
		this.order_type = "Takeaway";
		this.held_orders = [];
		this.promo_discount = 0;
		this.applied_promos = [];
		this.pos_opening = null;
		this.enable_pos_shift = false;
		this.requires_shift_workflow = false;
		this.mobile_cart_open = false;
		this._catalog_mem = {};
		this._cart_add_toast = null;
		this.variant_picker = new imogi_pos.VariantPicker(this);
		this.make();
		this.enable_mobile_layout_watch();
		this.render_cart();
		this._bind_catalog_refresh_on_focus();
		this.load_context();
	}

	_bind_catalog_refresh_on_focus() {
		this._on_visibility_refresh = () => {
			if (document.visibilityState !== "visible" || !this.context) return;
			this._catalog_mem = {};
			this.load_items();
		};
		document.addEventListener("visibilitychange", this._on_visibility_refresh);
		this.page?.on_page_hide?.(() => {
			document.removeEventListener("visibilitychange", this._on_visibility_refresh);
		});
	}

	make() {
		this.wrapper.html(`
			<div class="imogi-cashier-root">
			<div class="imogi-cashier-top">
				<div class="imogi-cashier-shift-bar is-closed">
					<div class="imogi-cashier-shift-text">${__("Shift kasir belum dibuka")}</div>
					<button type="button" class="btn btn-xs imogi-cashier-btn-primary imogi-cashier-open-shift-btn">${__(
						"Buka Shift"
					)}</button>
				</div>
				<div class="imogi-cashier-branch-row">
					<i class="fa fa-map-marker" aria-hidden="true"></i>
					<span class="imogi-cashier-branch-label"></span>
					<select class="form-control input-sm imogi-cashier-branch-select" aria-label="${__(
						"Cabang"
					)}"></select>
				</div>
				<div class="imogi-cashier-status-strip">
					<button type="button" class="imogi-status-chip imogi-chip-target" title="${__(
						"Target omzet"
					)}"></button>
					<button type="button" class="imogi-status-chip imogi-chip-marketplace" title="${__(
						"Order marketplace"
					)}"></button>
					<button type="button" class="imogi-status-chip imogi-chip-offline" title="${__(
						"Antrian offline"
					)}">
						<i class="fa fa-cloud-download"></i>
						<span>${__("Offline")}</span>
						<strong class="imogi-cashier-offline-badge">0</strong>
					</button>
				</div>
			</div>
			<div class="imogi-cashier-shell">
				<div class="imogi-cashier-panel imogi-cashier-products">
					<div class="imogi-cashier-panel-head">
						<h5><i class="fa fa-th-large imogi-cashier-head-icon"></i> ${__("Produk")}</h5>
						<span class="imogi-cashier-meta imogi-cashier-context-label"></span>
					</div>
					<div class="imogi-cashier-toolbar">
						<input type="search" class="form-control imogi-cashier-search" placeholder="${__(
							"Cari produk atau scan barcode..."
						)}" autocomplete="off" />
						<div class="imogi-cashier-mobile-filters">
							<div class="imogi-cashier-mobile-filter-block">
								<div class="imogi-cashier-mobile-filter-label">${__("Kategori")}</div>
								<div class="imogi-cashier-group-picker">
									<button type="button" class="imogi-cashier-group-picker-trigger" aria-expanded="false" aria-haspopup="listbox">
										<span class="imogi-cashier-group-picker-leading"><i class="fa fa-th-large"></i></span>
										<span class="imogi-cashier-group-picker-label">${__("Semua")}</span>
										<i class="fa fa-chevron-down imogi-cashier-group-picker-caret" aria-hidden="true"></i>
									</button>
									<div class="imogi-cashier-group-picker-menu" role="listbox"></div>
								</div>
							</div>
						</div>
						<div class="imogi-cashier-mobile-order-scroll">
							<div class="imogi-cashier-mobile-filter-label">${__("Tipe Order")}</div>
							<div class="imogi-cashier-mobile-order-types">${imogi_render_order_type_buttons(
								this.order_type
							)}</div>
						</div>
						<div class="imogi-cashier-groups"></div>
					</div>
					<div class="imogi-cashier-grid items-container">
						<div class="imogi-cashier-loading"><i class="fa fa-spinner fa-spin"></i> ${__(
							"Memuat produk..."
						)}</div>
					</div>
				</div>

				<div class="imogi-cashier-panel imogi-cashier-cart">
					<div class="imogi-cashier-cart-mobile-head">
						<span class="imogi-cashier-cart-grab" aria-hidden="true"></span>
						<button type="button" class="imogi-cashier-cart-close" aria-label="${__("Tutup")}">&times;</button>
					</div>
					<div class="imogi-cashier-panel-head">
						<h5><i class="fa fa-shopping-cart imogi-cashier-head-icon"></i> ${__("Keranjang")}</h5>
						<div class="imogi-cashier-cart-head-actions">
							<button type="button" class="btn btn-xs btn-default imogi-cashier-hold-btn" disabled>${__(
								"Tahan"
							)}</button>
							<button type="button" class="btn btn-xs btn-default imogi-cart-clear">${__("Kosongkan")}</button>
						</div>
					</div>
					<div class="imogi-cashier-hold-bar">
						<div class="imogi-cashier-hold-bar-text">
							<i class="fa fa-pause-circle"></i>
							<span class="imogi-cashier-hold-count">0</span>
							<span class="imogi-cashier-hold-label">${__("order ditahan")}</span>
						</div>
						<button type="button" class="btn btn-xs imogi-cashier-btn-primary imogi-cashier-hold-list-btn">${__(
							"Lihat"
						)}</button>
					</div>
					<div class="imogi-cashier-cart-scroll">
						<div class="imogi-cashier-cart-items"></div>
						<div class="imogi-cashier-cart-foot">
							<div class="imogi-cashier-order-type-row">
								<div class="imogi-cashier-order-type-label">${__("Tipe Order")}</div>
								<div class="imogi-cashier-order-types">${imogi_render_order_type_buttons(this.order_type)}</div>
							</div>
							<div class="imogi-cashier-customer-row">
								<input type="search" class="form-control input-sm imogi-cashier-customer-search" placeholder="${__(
									"Cari atau ketik nama customer..."
								)}" autocomplete="off" />
							</div>
							<div class="imogi-cashier-customer-label text-muted small mb-2"></div>
							<div class="imogi-cashier-total-row">
								<span>${__("Total")}</span>
								<strong class="imogi-cart-total">${format_currency(0)}</strong>
							</div>
							<button type="button" class="btn imogi-cashier-pay" disabled>
								<i class="fa fa-money"></i> ${__("Bayar Sekarang")}
							</button>
						</div>
					</div>
					<div class="imogi-cashier-mobile-checkout">
						<div class="imogi-cashier-total-row">
							<span>${__("Total")}</span>
							<strong class="imogi-cart-total">${format_currency(0)}</strong>
						</div>
						<button type="button" class="btn imogi-cashier-pay" disabled>
							<i class="fa fa-money"></i> ${__("Bayar Sekarang")}
						</button>
					</div>
				</div>
			</div>
			<div class="imogi-cashier-mobile-backdrop"></div>
			<div class="imogi-cashier-mobile-dock">
				<button type="button" class="imogi-cashier-dock-cart" aria-label="${__("Keranjang")}">
					<i class="fa fa-shopping-cart"></i>
					<span class="imogi-cashier-dock-badge is-empty">0</span>
				</button>
				<div class="imogi-cashier-dock-meta">
					<span class="imogi-cashier-dock-label">${__("Total")}</span>
					<strong class="imogi-cashier-dock-total">${format_currency(0)}</strong>
				</div>
				<button type="button" class="btn imogi-cashier-btn-primary imogi-cashier-dock-pay" disabled>
					<i class="fa fa-money"></i> ${__("Bayar")}
				</button>
			</div>
			</div>
		`);

		this.$grid = this.wrapper.find(".imogi-cashier-grid");
		this.$groups = this.wrapper.find(".imogi-cashier-groups");
		this.$group_picker = this.wrapper.find(".imogi-cashier-group-picker");
		this.$group_picker_trigger = this.wrapper.find(".imogi-cashier-group-picker-trigger");
		this.$group_picker_menu = this.wrapper.find(".imogi-cashier-group-picker-menu");
		this.$group_picker_label = this.wrapper.find(".imogi-cashier-group-picker-label");
		this.$group_picker_leading = this.wrapper.find(".imogi-cashier-group-picker-leading");
		this.$group_picker_trigger.on("click", (e) => {
			e.stopPropagation();
			this.toggle_group_picker();
		});
		this.$group_picker.on("click", (e) => e.stopPropagation());
		this.wrapper.on("click.imogi-group-picker", () => this.close_group_picker());
		this.$branch_row = this.wrapper.find(".imogi-cashier-branch-row");
		this.$branch_label = this.wrapper.find(".imogi-cashier-branch-label");
		this.$branch_select = this.wrapper.find(".imogi-cashier-branch-select");
		this.$cart_items = this.wrapper.find(".imogi-cashier-cart-items");
		this.$total = this.wrapper.find(".imogi-cart-total");
		this.$customer_label = this.wrapper.find(".imogi-cashier-customer-label");
		this.$pay = this.wrapper.find(".imogi-cashier-pay");
		this.$context_label = this.wrapper.find(".imogi-cashier-context-label");
		this.$hold_btn = this.wrapper.find(".imogi-cashier-hold-btn");
		this.$hold_list_btn = this.wrapper.find(".imogi-cashier-hold-list-btn");
		this.$hold_bar = this.wrapper.find(".imogi-cashier-hold-bar");
		this.$hold_count = this.wrapper.find(".imogi-cashier-hold-count");
		this.$shift_bar = this.wrapper.find(".imogi-cashier-shift-bar");
		this.$status_strip = this.wrapper.find(".imogi-cashier-status-strip");
		this.$target_chip = this.wrapper.find(".imogi-chip-target");
		this.$marketplace_chip = this.wrapper.find(".imogi-chip-marketplace");
		this.$offline_chip = this.wrapper.find(".imogi-chip-offline");
		this.$offline_badge = this.wrapper.find(".imogi-cashier-offline-badge");
		this.$target_chip.on("click", () => this.open_target_detail());
		this.wrapper.on("click", ".imogi-cashier-history-btn", () => {
			if (!this.require_feature("order_history")) return;
			frappe.set_route("imogi-pos-order-history");
		});
		this.$marketplace_chip.on("click", () => {
			if (!this.require_feature("grabfood_integration")) return;
			this.open_marketplace_orders();
		});
		this.$offline_chip.on("click", () => {
			if (imogi_pos.offline?.sync_queue) imogi_pos.offline.sync_queue(this);
		});
		imogi_apply_shift_bar_theme(this.$shift_bar);
		this.$search = this.wrapper.find(".imogi-cashier-search");
		this.$dock_badge = this.wrapper.find(".imogi-cashier-dock-badge");
		this.$dock_total = this.wrapper.find(".imogi-cashier-dock-total");
		this.$dock_pay = this.wrapper.find(".imogi-cashier-dock-pay");
		this.$mobile_backdrop = this.wrapper.find(".imogi-cashier-mobile-backdrop");

		this.wrapper.find(".imogi-cashier-dock-cart, .imogi-cashier-dock-meta").on("click", () => {
			if (!this.is_mobile_layout()) return;
			this.toggle_mobile_cart(true);
		});
		this.wrapper.find(".imogi-cashier-dock-pay").on("click", () => {
			this.close_mobile_cart();
			this.open_payment_dialog();
		});
		this.wrapper.find(".imogi-cashier-cart-close, .imogi-cashier-mobile-backdrop").on("click", () => {
			this.close_mobile_cart();
		});

		this.wrapper.find(".imogi-cashier-order-type-btn").on("click", (e) => {
			const type = $(e.currentTarget).data("type");
			const feature_key = IMOGI_ORDER_TYPE_FEATURES[type];
			if (feature_key && !this.require_feature(feature_key)) return;
			this.set_order_type(type);
		});

		this.update_hold_ui();

		let customer_timer = null;
		this.wrapper.find(".imogi-cashier-customer-search").on("focus click", (e) => {
			if (this.feature_allowed("customer")) return;
			e.preventDefault();
			e.target.blur();
			this.require_feature("customer");
		});
		this.wrapper.find(".imogi-cashier-customer-search").on("input", (e) => {
			if (!this.feature_allowed("customer")) return;
			clearTimeout(customer_timer);
			const term = e.target.value.trim();
			if (!term) {
				this.selected_customer = null;
				this.customer_loyalty = null;
				this.render_customer_label();
				return;
			}
			customer_timer = setTimeout(() => this.search_customer(term), 300);
		});
		this.wrapper.find(".imogi-cashier-customer-search").on("keydown", (e) => {
			if (e.key !== "Enter") return;
			if (!this.require_feature("customer")) {
				e.preventDefault();
				return;
			}
			e.preventDefault();
			clearTimeout(customer_timer);
			const term = e.target.value.trim();
			if (term) this.search_customer(term);
		});
		this.wrapper.find(".imogi-cashier-search").on("input", (e) => {
			clearTimeout(this.search_timer);
			this.search = e.target.value.trim();
			this.search_timer = setTimeout(() => this.load_items(), 300);
		});
		this.$search.on("keydown", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				this.handle_search_enter();
			}
		});

		this.$hold_btn.on("click", () => this.hold_order());
		this.$hold_list_btn.on("click", () => {
			if (!this.require_feature("hold_order")) return;
			this.show_hold_dialog();
		});
		this.wrapper.find(".imogi-cashier-open-shift-btn").on("click", () => this.open_shift());

		$(document).on("keydown.imogi-cashier", (e) => {
			if (e.key === "F2" && frappe.get_route()[0] === "imogi-pos-cashier") {
				e.preventDefault();
				this.$search.focus().select();
			}
		});

		this.wrapper.find(".imogi-cart-clear").on("click", () => this.clear_cart());
		$(window).on("resize.imogi-cashier", () => this.sync_mobile_layout());
		this.$pay.on("click", () => this.open_payment_dialog());

		this.$branch_select.on("change", (e) => {
			const code = $(e.currentTarget).val();
			if (!code || code === this.get_active_branch_code()) return;
			this.switch_branch(code);
		});

		this.sync_status_strip();
	}

	get_active_branch_code() {
		return (this.context?.active_branch?.branch_code || "").trim();
	}

	get_stored_branch_code() {
		try {
			return (localStorage.getItem(IMOGI_BRANCH_KEY) || "").trim();
		} catch (e) {
			return "";
		}
	}

	set_stored_branch_code(code) {
		try {
			if (code) localStorage.setItem(IMOGI_BRANCH_KEY, code);
			else localStorage.removeItem(IMOGI_BRANCH_KEY);
		} catch (e) {
			/* ignore */
		}
	}

	branch_api_args(extra = {}) {
		const args = { ...(extra || {}) };
		if (this.context?.pos_profile) args.pos_profile = this.context.pos_profile;
		if (this.get_active_branch_code()) args.branch = this.get_active_branch_code();
		return args;
	}

	format_branch_label(branch = {}) {
		if (!branch.branch_code && !branch.branch_name) return "";
		if (branch.city) {
			return `${branch.branch_name || branch.branch_code} (${branch.city})`;
		}
		return branch.branch_name || branch.branch_code || "";
	}

	get_display_brand_name(branch = {}) {
		const store = (this.context?.receipt_store_name || "").trim();
		if (store) return store;
		const name = (branch.branch_name || "").replace(/\s*\([^)]*\)\s*$/g, "").trim();
		const trailing = name.match(/\s[-–]\s*([^\s-]+)\s*$/i);
		if (trailing && /^imogi$/i.test(trailing[1])) {
			return "IMOGI";
		}
		return (this.context?.company || "IMOGI").trim();
	}

	format_branch_short_label(branch = {}) {
		if (!branch.branch_code && !branch.branch_name) return "";
		const brand = this.get_display_brand_name(branch);
		let name = (branch.branch_name || branch.branch_code || "").trim();
		name = name.replace(/\s*\([^)]*\)\s*$/g, "").trim();
		if (branch.city) {
			const city_suffix = new RegExp(
				`\\s*\\(\\s*${String(branch.city).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\)\\s*$`,
				"i"
			);
			name = name.replace(city_suffix, "").trim();
		}
		const parts = name.match(/^(.+?)\s*[-–]\s*(.+)$/i);
		if (parts) {
			const left = parts[1].trim();
			const right = parts[2].trim();
			if (/^imogi$/i.test(right) || right.toLowerCase() === brand.toLowerCase()) {
				return `${brand} - ${left}`;
			}
			if (/^imogi$/i.test(left) || left.toLowerCase() === brand.toLowerCase()) {
				return `${brand} - ${right}`;
			}
		}
		if (branch.city) {
			return `${brand} - Cabang ${branch.city}`;
		}
		return name;
	}

	render_context_label() {
		const active_branch = this.context?.active_branch || {};
		this.$context_label.text(this.format_branch_short_label(active_branch));
	}

	render_branch_picker() {
		if (!this.$branch_row?.length) return;
		const branches = this.context?.branches || [];
		const active_branch = this.context?.active_branch || {};
		const branch_label = this.format_branch_short_label(active_branch);
		const can_switch = cint(this.context?.multi_branch_enabled) && branches.length > 1;

		if (!branch_label) {
			this.$branch_row.removeClass("is-visible");
			this.render_context_label();
			return;
		}

		this.$branch_row.addClass("is-visible");
		const locked = cint(this.context?.branch_locked_by_shift);
		this.$branch_row.toggleClass("is-locked", locked);

		if (can_switch) {
			this.$branch_label.hide();
			this.$branch_select.show().prop("disabled", locked);
			const active = this.get_active_branch_code();
			this.$branch_select.html(
				branches
					.map((row) => {
						const label = this.format_branch_short_label(row);
						return `<option value="${frappe.utils.escape_html(row.branch_code)}"${
							row.branch_code === active ? " selected" : ""
						}>${frappe.utils.escape_html(label)}</option>`;
					})
					.join("")
			);
		} else {
			this.$branch_select.hide().prop("disabled", true);
			this.$branch_label.text(branch_label).show();
		}

		this.render_context_label();
	}

	switch_branch(branch_code) {
		const apply = () => {
			this.set_stored_branch_code(branch_code);
			this.cart = [];
			this.search = "";
			this.wrapper.find(".imogi-cashier-search").val("");
			this.render_cart();
			this.load_context_with_branch(branch_code);
		};

		if (!this.cart.length) {
			apply();
			return;
		}

		frappe.confirm(
			__(
				"Ganti cabang akan mengosongkan keranjang. Shift kasir tetap mengikuti profil cabang yang aktif. Lanjutkan?"
			),
			apply,
			() => this.$branch_select.val(this.get_active_branch_code())
		);
	}

	load_context_with_branch(branch_code) {
		frappe.call({
			method: "imogi_pos.api.cashier.set_active_branch",
			args: { branch_code: branch_code },
			callback: (r) => {
				if (r.exc) return;
				this.apply_cashier_context(r.message || {});
			},
		});
	}

	apply_cashier_context(ctx) {
		this.context = ctx || {};
		this.selected_customer = this.context.default_customer || null;
		this.enable_pos_shift = cint(this.context.enable_pos_shift);
		this.requires_shift_workflow = cint(this.context.requires_shift_workflow);
		this.pos_opening = this.enable_pos_shift ? this.context.pos_opening || null : null;
		this.held_orders = this.context.held_orders || [];
		if (this.get_active_branch_code()) {
			this.set_stored_branch_code(this.get_active_branch_code());
		} else {
			this.set_stored_branch_code("");
		}
		this.render_branch_picker();
		if (this.enable_pos_shift && (this.requires_shift_workflow || this.pos_opening)) {
			this.$shift_bar.show();
			this.render_shift_bar();
			if (this.requires_shift_workflow && !this.pos_opening) {
				this.open_shift();
				return;
			}
		} else {
			this.$shift_bar.hide();
		}
		this.apply_feature_gates();
		this.render_customer_label();
		this.render_groups();
		this.update_hold_ui();
		this.render_sales_target(this.context.sales_target);
		if (imogi_pos.offline) imogi_pos.offline.bind_page(this);
		this.bind_marketplace_orders();
		this.load_items();
	}

	feature_allowed(feature_key) {
		const features = this.context?.features;
		if (!features) return true;
		return !!features[feature_key];
	}

	feature_meta(feature_key) {
		return (this.context?.feature_meta || {})[feature_key] || {};
	}

	require_feature(feature_key, options = {}) {
		if (this.feature_allowed(feature_key)) return true;
		const blocked_reason = this.feature_meta(feature_key).blocked_reason;
		if (blocked_reason === "business" || blocked_reason === "planned") {
			return false;
		}
		if (imogi_pos.feature_upgrade) {
			imogi_pos.feature_upgrade.prompt(this, feature_key, options);
		} else {
			const meta = this.feature_meta(feature_key);
			frappe.show_alert({
				message: meta.label
					? __("{0} tidak tersedia di paket Anda", [meta.label])
					: __("Fitur tidak tersedia di paket Anda"),
				indicator: "orange",
			});
		}
		return false;
	}

	apply_feature_gates() {
		const typeFeatures = IMOGI_ORDER_TYPE_FEATURES;
		const availableTypes = IMOGI_ORDER_TYPES.filter((row) =>
			this.feature_allowed(typeFeatures[row.value])
		);
		const $orderTypeRow = this.wrapper.find(".imogi-cashier-order-type-row");
		const $mobileOrderRow = this.wrapper.find(".imogi-cashier-mobile-order-scroll");
		if (availableTypes.length <= 1) {
			// Free tier: hide picker when only default checkout is available.
			$orderTypeRow.hide();
			$mobileOrderRow.hide();
			if (availableTypes.length === 1) {
				this.set_order_type(availableTypes[0].value, true);
			}
		} else {
			this.wrapper.find(".imogi-cashier-order-type-btn").each((_, el) => {
				const $btn = $(el);
				const type = $btn.data("type");
				const allowed = this.feature_allowed(typeFeatures[type]);
				$btn.toggle(allowed).removeClass("is-tier-locked").attr("aria-disabled", "false");
			});
			if (!this.feature_allowed(typeFeatures[this.order_type])) {
				this.set_order_type(availableTypes[0].value, true);
			}
			this.sync_order_type_placement();
		}

		const customerOn = this.feature_allowed("customer");
		const $customerRow = this.wrapper.find(".imogi-cashier-customer-row");
		$customerRow.toggleClass("is-tier-locked", !customerOn);
		$customerRow.find("input").prop("disabled", !customerOn);
		$customerRow.show();
		if (!customerOn) {
			this.selected_customer = this.context?.default_customer || null;
			this.wrapper.find(".imogi-cashier-customer-search").val("");
			this.$customer_label.hide();
		} else {
			this.$customer_label.show();
		}

		const holdOn = this.feature_allowed("hold_order");
		this.$hold_btn.toggleClass("is-tier-locked", !holdOn).prop("disabled", !holdOn).show();
		if (!holdOn) this.$hold_bar.removeClass("is-visible");

		const marketplaceOn =
			this.feature_allowed("grabfood_integration") &&
			!(frappe.boot?.imogi_pos_hidden_features || []).includes("grabfood_integration");
		if (!marketplaceOn) {
			this.$marketplace_chip?.removeClass("is-visible has-orders is-tier-locked");
		} else if (!this.feature_allowed("grabfood_integration") && this.$marketplace_chip?.hasClass("is-visible")) {
			this.$marketplace_chip.addClass("is-tier-locked");
		} else {
			this.$marketplace_chip?.removeClass("is-tier-locked");
		}

		this.wrapper.find(".imogi-cashier-history-btn").toggleClass("is-tier-locked", !this.feature_allowed("order_history"));
		this.sync_status_strip();
	}

	load_context() {
		// Cabang ditentukan server (shift terbuka > default user > cabang assign).
		// localStorage hanya cache tampilan, bukan sumber kebenaran.
		frappe.call({
			method: "imogi_pos.api.cashier.get_cashier_context",
			args: {},
			callback: (r) => {
				if (r.exc) return;
				this.apply_cashier_context(r.message || {});
				this.migrate_local_hold();
			},
		});
	}

	render_sales_target(target) {
		if (!this.$target_chip?.length) return;
		target = target || {};
		this._sales_target = target;
		if (!target.enabled) {
			this.$target_chip.removeClass("is-visible is-achieved is-behind");
			this.sync_status_strip();
			return;
		}

		const pct = Math.min(100, Math.max(0, flt(target.progress_pct)));
		const statusClass =
			target.status === "achieved"
				? "is-achieved"
				: target.status === "behind"
					? "is-behind"
					: "";

		this.$target_chip
			.addClass("is-visible")
			.removeClass("is-achieved is-behind")
			.addClass(statusClass)
			.html(
				`<i class="fa fa-bullseye"></i> ${__("Target")} ${pct}% · ${format_currency(
					target.actual_amount || 0
				)}`
			);
		this.sync_status_strip();
	}

	open_target_detail() {
		const target = this._sales_target || {};
		if (!target.enabled) return;
		const pct = Math.min(100, Math.max(0, flt(target.progress_pct)));
		frappe.msgprint({
			title: `${__("Target Omzet")} ${target.month_label || ""}`,
			indicator: target.status === "achieved" ? "green" : target.status === "behind" ? "red" : "orange",
			message: `
				<div style="line-height:1.6">
					<div><strong>${format_currency(target.actual_amount || 0)}</strong> / ${format_currency(
						target.target_amount || 0
					)} (${pct}%)</div>
					<div>${__("Sisa")}: ${format_currency(target.remaining_amount || 0)}</div>
					<div>${__("Perlu/hari")}: ${format_currency(target.daily_pace_needed || 0)}</div>
					<div>${frappe.utils.escape_html(target.status_label || "")}</div>
				</div>
			`,
		});
	}

	sync_status_strip() {
		if (!this.$status_strip?.length) return;
		const has_chip = this.$status_strip.find(".imogi-status-chip.is-visible").length > 0;
		this.$status_strip.toggleClass("is-visible", has_chip);
	}

	history_action_html() {
		return `<button type="button" class="btn btn-xs btn-default imogi-cashier-history-btn" title="${__(
			"Riwayat order"
		)}"><i class="fa fa-history"></i> ${__("Riwayat")}</button>`;
	}

	mount_history_fallback() {
		this.wrapper.find(".imogi-cashier-history-btn").remove();
		this.$status_strip.prepend(this.history_action_html());
		this.wrapper
			.find(".imogi-cashier-history-btn")
			.toggleClass("is-tier-locked", !this.feature_allowed("order_history"));
	}

	refresh_sales_target() {
		frappe.call({
			method: "imogi_pos.imogi_pos.utils.sales_target.get_sales_target_progress_api",
			args: this.branch_api_args(),
			callback: (r) => {
				if (r.exc) return;
				this.render_sales_target(r.message || {});
			},
		});
	}

	render_shift_bar() {
		if (!this.enable_pos_shift || (!this.requires_shift_workflow && !this.pos_opening)) {
			this.$shift_bar.hide();
			this.mount_history_fallback();
			this.sync_status_strip();
			return;
		}
		this.$status_strip.find(".imogi-cashier-history-btn").remove();
		this.$shift_bar.show();
		const mobile = this.is_mobile_layout();
		if (this.pos_opening && this.pos_opening.name) {
			this.$shift_bar.removeClass("is-closed");
			const since = frappe.datetime.str_to_user(this.pos_opening.period_start_date);
			const shift_short = (this.pos_opening.name || "").replace(/^POS-OPE-\d+-/, "POS-");
			this.$shift_bar.html(`
				<div class="imogi-cashier-shift-text">
					<i class="fa fa-circle" style="font-size:8px;color:#16a34a"></i>
					${
						mobile
							? `${__("Shift")} ${frappe.utils.escape_html(shift_short)}`
							: `${__("Shift")} <a href="/app/pos-opening-entry/${encodeURIComponent(
									this.pos_opening.name
							  )}">${frappe.utils.escape_html(this.pos_opening.name)}</a> · ${__(
									"sejak"
							  )} ${frappe.utils.escape_html(since)}`
					}
				</div>
				<div class="imogi-cashier-shift-actions">
					<button type="button" class="btn btn-xs btn-default imogi-cashier-logout-btn" title="${__(
						"Logout sementara — shift tetap terbuka"
					)}"><i class="fa fa-sign-out"></i> ${__("Logout")}</button>
					${this.history_action_html()}
					<button type="button" class="btn btn-xs btn-default imogi-cashier-close-shift-btn" title="${__(
						"Tutup Shift"
					)}">${mobile ? `<i class="fa fa-stop"></i> ${__("Tutup")}` : __("Tutup Shift")}</button>
				</div>
			`);
			this.$shift_bar.find(".imogi-cashier-logout-btn").on("click", () => this.logout_cashier());
			this.$shift_bar.find(".imogi-cashier-close-shift-btn").on("click", () => this.close_shift());
		} else if (this.requires_shift_workflow) {
			this.$shift_bar.addClass("is-closed");
			this.$shift_bar.html(`
				<div class="imogi-cashier-shift-text"><i class="fa fa-lock"></i> ${__(
					"Shift kasir belum dibuka — checkout dinonaktifkan"
				)}</div>
				<div class="imogi-cashier-shift-actions">
					<button type="button" class="btn btn-xs imogi-cashier-btn-primary imogi-cashier-open-shift-btn">${__(
						"Buka Shift"
					)}</button>
					${this.history_action_html()}
					<button type="button" class="btn btn-xs btn-default imogi-cashier-logout-btn" title="${__(
						"Logout dan ganti user kasir"
					)}"><i class="fa fa-sign-out"></i> ${__("Logout")}</button>
				</div>
			`);
			this.$shift_bar.find(".imogi-cashier-open-shift-btn").on("click", () => this.open_shift());
			this.$shift_bar.find(".imogi-cashier-logout-btn").on("click", () => this.logout_cashier());
		}
		imogi_apply_shift_bar_theme(this.$shift_bar);
		this.wrapper
			.find(".imogi-cashier-history-btn")
			.toggleClass("is-tier-locked", !this.feature_allowed("order_history"));
	}

	prompt_open_shift() {
		frappe.confirm(
			__(
				"Shift kasir belum dibuka. Anda akan diarahkan ke halaman <b>Buka Shift</b> untuk mengisi saldo awal kas. Lanjutkan?"
			),
			() => this.open_shift()
		);
	}

	open_shift() {
		if (!this.context) return;
		frappe.route_options = {
			company: this.context.company,
			pos_profile: this.context.pos_profile,
			imogi_return_to_cashier: 1,
			branch: this.get_active_branch_code(),
		};
		frappe.set_route("imogi-pos-open-shift");
	}

	logout_cashier() {
		const shift_active = !!(this.pos_opening && this.pos_opening.name);
		imogi_pos.logout_cashier?.({ shift_active });
	}

	close_shift() {
		if (!this.pos_opening?.name) {
			frappe.msgprint(__("Tidak ada shift terbuka."));
			return;
		}
		imogi_pos.close_shift(this.pos_opening);
	}

	refresh_shift_status() {
		this.sync_shift_settings();
	}

	sync_shift_settings() {
		frappe.call({
			method: "imogi_pos.api.cashier.get_pos_opening_status",
			callback: (r) => {
				if (r.exc) return;
				const status = r.message || {};
				this.enable_pos_shift = cint(status.enabled);
				if (!this.enable_pos_shift) {
					this.pos_opening = null;
					this.$shift_bar.hide();
					return;
				}
				if (status.open) {
					this.pos_opening = {
						name: status.name,
						pos_profile: status.pos_profile,
						company: status.company,
						period_start_date: status.period_start_date,
					};
				} else {
					this.pos_opening = null;
				}
				this.render_shift_bar();
			},
		});
	}

	load_holds(callback) {
		frappe.call({
			method: "imogi_pos.api.hold.list_holds",
			args: this.branch_api_args(),
			callback: (r) => {
				this.held_orders = (r.message || {}).holds || [];
				this.update_hold_ui();
				callback && callback();
			},
		});
	}

	render_groups() {
		const groups = this.context.pos_categories?.length
			? this.context.pos_categories
			: this.context.item_groups || [];
		this.use_pos_category = !!(this.context.pos_categories && this.context.pos_categories.length);

		const group_buttons_html = groups
			.map((g, i) => {
				const icon = imogi_resolve_group_icon(g.label || g.name);
				return `<button type="button" class="imogi-cashier-group-btn ${
					i === 0 ? "is-active" : ""
				}" data-group="${frappe.utils.escape_html(g.name || "")}" data-label="${frappe.utils.escape_html(
					g.label || ""
				)}">
					<i class="fa ${icon}" aria-hidden="true"></i>
					<span>${frappe.utils.escape_html(g.label)}</span>
				</button>`;
			})
			.join("");

		this.$groups.html(group_buttons_html);

		this.$group_picker_menu.html(
			groups
				.map((g, i) => {
					const icon = imogi_resolve_group_icon(g.label || g.name);
					return `<button type="button" class="imogi-cashier-group-picker-option${
						i === 0 ? " is-active" : ""
					}" role="option" data-group="${frappe.utils.escape_html(g.name || "")}" data-label="${frappe.utils.escape_html(
						g.label || ""
					)}">
						<span class="imogi-cashier-group-picker-option-icon"><i class="fa ${icon}"></i></span>
						<span class="imogi-cashier-group-picker-option-label">${frappe.utils.escape_html(g.label)}</span>
					</button>`;
				})
				.join("")
		);
		this.sync_group_picker_ui(groups[0]?.name || "", groups[0]?.label || __("Semua"));

		const on_group_click = (e) => {
			const $btn = $(e.currentTarget);
			this.apply_group_filter($btn.data("group") || "", $btn.data("label") || "");
		};
		this.$groups.find(".imogi-cashier-group-btn").off("click.imogi").on("click.imogi", on_group_click);
		this.$group_picker_menu.off("click.imogi").on("click.imogi", ".imogi-cashier-group-picker-option", (e) => {
			const $opt = $(e.currentTarget);
			this.apply_group_filter($opt.data("group") || "", $opt.data("label") || "");
			this.close_group_picker();
		});
	}

	open_group_picker() {
		this.$group_picker?.addClass("is-open");
		this.$group_picker_trigger?.addClass("is-open").attr("aria-expanded", "true");
		this.$group_picker_menu?.addClass("is-open");
	}

	close_group_picker() {
		this.$group_picker?.removeClass("is-open");
		this.$group_picker_trigger?.removeClass("is-open").attr("aria-expanded", "false");
		this.$group_picker_menu?.removeClass("is-open");
	}

	toggle_group_picker() {
		if (this.$group_picker_trigger?.hasClass("is-open")) this.close_group_picker();
		else this.open_group_picker();
	}

	sync_group_picker_ui(value, label) {
		const safe_label = label || __("Semua");
		const icon = imogi_resolve_group_icon(safe_label);
		this.$group_picker_label?.text(safe_label);
		this.$group_picker_leading?.html(`<i class="fa ${icon}"></i>`);
		this.$group_picker_menu
			?.find(".imogi-cashier-group-picker-option")
			.removeClass("is-active")
			.filter(function () {
				return String($(this).data("group") || "") === String(value || "");
			})
			.addClass("is-active");
	}

	apply_group_filter(value, label) {
		this.$groups.find(".imogi-cashier-group-btn").removeClass("is-active").filter(function () {
			return String($(this).data("group") || "") === String(value || "");
		}).addClass("is-active");
		this.sync_group_picker_ui(value, label);
		if (this.use_pos_category) {
			this.pos_category = value;
			this.item_group = "";
		} else {
			this.item_group = value;
			this.pos_category = "";
		}
		this.load_items({ force: !!value });
	}

	_all_catalog_cache_key() {
		return this._catalog_cache_key({ limit: 48, start: 0, ...this.branch_api_args() });
	}

	_get_cached_all_catalog_items() {
		return this._catalog_mem[this._all_catalog_cache_key()]?.items || [];
	}

	_client_filter_catalog_items(items, { pos_category = "", item_group = "" } = {}) {
		if (!items?.length) return [];
		if (pos_category) {
			const direct = items.filter((row) => (row.imogi_pos_category || "") === pos_category);
			if (direct.length) return direct;
			const key = String(pos_category).toLowerCase();
			const match_row = (row) => {
				const hay = `${row.imogi_pos_category || ""} ${row.item_group || ""} ${row.item_name || ""}`.toLowerCase();
				if (key === "food") return /food|makan|snack|rice|nasi|main/.test(hay);
				if (key === "beverage") return /beverage|minuman|drink|coffee|tea|latte|espresso|juice|soda/.test(hay);
				if (key === "dessert") return /dessert|kue|sweet|cake|pastry|donut/.test(hay);
				if (key === "service") return /service|layanan|jasa/.test(hay);
				if (key === "combo package") return row.is_combo || /combo|paket|package/.test(hay);
				return hay.includes(key);
			};
			return items.filter(match_row);
		}
		if (item_group) {
			return items.filter((row) => (row.item_group || "") === item_group);
		}
		return items;
	}

	_catalog_args() {
		const args = { limit: 48, start: 0, ...this.branch_api_args() };
		if (this.search) args.search = this.search;
		else if (this.pos_category) args.pos_category = this.pos_category;
		else if (this.item_group) args.item_group = this.item_group;
		return args;
	}

	_catalog_cache_key(args) {
		const { skip_cache, ...rest } = args || {};
		return JSON.stringify(rest);
	}

	_invalidate_catalog_cache() {
		this._catalog_mem = {};
	}

	_show_catalog_loading() {
		this.$grid.html(
			`<div class="imogi-cashier-loading"><i class="fa fa-spinner fa-spin fa-2x" style="color:#a1a1aa"></i><span class="ml-2">${__(
				"Memuat produk..."
			)}</span></div>`
		);
	}

	_render_catalog_items(items, { offline = false, from_cache = false } = {}) {
		if (!items.length) {
			this.$grid.html(
				`<div class="imogi-cashier-empty">${
					offline
						? __("Katalog offline kosong — buka kasir saat online dulu")
						: __("Produk tidak ditemukan")
				}</div>`
			);
			return;
		}
		this.render_items(items);
		if (offline) {
			frappe.show_alert({ message: __("Menampilkan katalog offline"), indicator: "orange" }, 3);
		} else if (from_cache) {
			this.$grid.addClass("is-catalog-stale");
			setTimeout(() => this.$grid.removeClass("is-catalog-stale"), 400);
		}
	}

	_fetch_catalog_items(args, { background = false } = {}) {
		if (!background) {
			this._catalog_request_id = (this._catalog_request_id || 0) + 1;
		}
		const request_id = this._catalog_request_id;

		frappe.call({
			method: "imogi_pos.api.catalog.get_items",
			args,
			callback: (r) => {
				if (background && request_id !== this._catalog_request_id) return;
				if (r.exc) {
					if (background) return;
					if (
						imogi_pos.offline?.is_enabled(this) &&
						typeof imogi_pos.offline.load_catalog === "function"
					) {
						imogi_pos.offline.load_catalog(this, args).then((items) => {
							if (items.length) this._render_catalog_items(items, { offline: true });
							else this.$grid.html(`<div class="imogi-cashier-empty">${__("Gagal memuat produk")}</div>`);
						});
						return;
					}
					this.$grid.html(`<div class="imogi-cashier-empty">${__("Gagal memuat produk")}</div>`);
					return;
				}
				const items = (r.message || {}).items || [];
				const cache_key = this._catalog_cache_key(args);
				let render_items = items;
				if (!render_items.length && (args.pos_category || args.item_group)) {
					const fallback = this._client_filter_catalog_items(this._get_cached_all_catalog_items(), {
						pos_category: args.pos_category,
						item_group: args.item_group,
					});
					if (fallback.length) {
						render_items = fallback;
					}
				}
				this._catalog_mem[cache_key] = { items: render_items, cached_at: Date.now() };
				if (!args.search && !args.pos_category && !args.item_group) {
					this._catalog_mem[this._all_catalog_cache_key()] = {
						items: render_items,
						cached_at: Date.now(),
					};
				}
				if (
					imogi_pos.offline?.is_enabled(this) &&
					typeof imogi_pos.offline.save_catalog === "function"
				) {
					imogi_pos.offline.save_catalog(this, args, render_items);
				}
				this._render_catalog_items(render_items);
				this._prefetch_category_catalogs(args);
			},
		});
	}

	_prefetch_category_catalogs(base_args) {
		if (base_args.search || base_args.pos_category) return;
		const categories = this.context?.pos_categories || [];
		if (!categories.length) return;

		categories.forEach((category) => {
			const category_name = category?.name ?? category;
			if (!category_name) return;
			const args = {
				limit: 48,
				start: 0,
				...this.branch_api_args(),
				pos_category: category_name,
			};
			delete args.item_group;
			const cache_key = this._catalog_cache_key(args);
			if (this._catalog_mem[cache_key]?.items?.length) return;

			frappe.call({
				method: "imogi_pos.api.catalog.get_items",
				args,
				callback: (r) => {
					if (r.exc) return;
					const items = (r.message || {}).items || [];
					if (!items.length) return;
					this._catalog_mem[cache_key] = { items, cached_at: Date.now() };
					if (imogi_pos.offline?.save_catalog) {
						imogi_pos.offline.save_catalog(this, args, items);
					}
				},
			});
		});
	}

	load_items({ background = false, force = false } = {}) {
		if (!this.context) return;

		const args = this._catalog_args();
		if (force) {
			args.skip_cache = 1;
		}
		const cache_key = this._catalog_cache_key(args);
		const mem = this._catalog_mem[cache_key];

		if (!force && !background && mem?.items?.length) {
			const age = Date.now() - (mem.cached_at || 0);
			if (age < IMOGI_CATALOG_MEM_TTL_MS) {
				this._render_catalog_items(mem.items, { from_cache: true });
				this._fetch_catalog_items(args, { background: true });
				return;
			}
		}

		if (!background) {
			this._show_catalog_loading();
		}

		if (imogi_pos.offline?.is_enabled(this) && !navigator.onLine) {
			if (typeof imogi_pos.offline.load_catalog === "function") {
				imogi_pos.offline.load_catalog(this, args).then((items) =>
					this._render_catalog_items(items, { offline: true })
				);
				return;
			}
		}

		this._fetch_catalog_items(args, { background });
	}

	prefetch_catalog() {
		if (!this.context || this.search) return;
		const args = { limit: 48, start: 0, ...this.branch_api_args() };
		const cache_key = this._catalog_cache_key(args);
		if (this._catalog_mem[cache_key]?.items?.length) return;
		frappe.call({
			method: "imogi_pos.api.catalog.get_items",
			args,
			callback: (r) => {
				if (r.exc) return;
				const items = (r.message || {}).items || [];
				if (!items.length) return;
				this._catalog_mem[cache_key] = { items, cached_at: Date.now() };
				if (imogi_pos.offline?.save_catalog) {
					imogi_pos.offline.save_catalog(this, args, items);
				}
			},
		});
	}

	bind_marketplace_orders() {
		if (
			!this.context?.enable_marketplace_orders ||
			(frappe.boot?.imogi_pos_hidden_features || []).includes("grabfood_integration")
		) {
			this.$marketplace_chip?.removeClass("is-visible has-orders");
			this.sync_status_strip();
			return;
		}
		this.refresh_marketplace_badge();
		if (this._marketplace_timer) clearInterval(this._marketplace_timer);
		this._marketplace_timer = setInterval(() => this.refresh_marketplace_badge(), 60000);
	}

	refresh_marketplace_badge() {
		if (!this.context?.enable_marketplace_orders) {
			this.$marketplace_chip?.removeClass("is-visible has-orders");
			this.sync_status_strip();
			return;
		}
		frappe.call({
			method: "imogi_pos.api.marketplace_api.list_marketplace_orders",
			args: { company: this.context.company },
			callback: (r) => {
				if (r.exc) return;
				const count = ((r.message || {}).orders || []).length;
				if (count <= 0) {
					this.$marketplace_chip.removeClass("is-visible has-orders");
				} else {
					this.$marketplace_chip
						.addClass("is-visible has-orders")
						.html(
							`<i class="fa fa-motorcycle"></i> ${count} ${__("order marketplace")}`
						);
				}
				this.sync_status_strip();
			},
		});
	}

	open_marketplace_orders() {
		frappe.call({
			method: "imogi_pos.api.marketplace_api.list_marketplace_orders",
			args: { company: this.context.company },
			freeze: true,
			callback: (r) => {
				if (r.exc) return;
				const orders = (r.message || {}).orders || [];
				if (!orders.length) {
					frappe.msgprint(__("Tidak ada order marketplace menunggu."));
					return;
				}
				const d = new frappe.ui.Dialog({
					title: __("Order Marketplace"),
					fields: [
						{
							fieldtype: "HTML",
							options: `<ul class="list-unstyled mb-0">${orders
								.map(
									(o) =>
										`<li class="mb-2"><button type="button" class="btn btn-default btn-sm btn-block imogi-import-marketplace" data-name="${frappe.utils.escape_html(
											o.name
										)}">
											<strong>${frappe.utils.escape_html(o.marketplace_platform || "")}</strong>
											· ${frappe.utils.escape_html(o.external_order_id || o.name)}
											· ${format_currency(o.grand_total || 0)}
										</button></li>`
								)
								.join("")}</ul>`,
						},
					],
				});
				d.$wrapper.on("click", ".imogi-import-marketplace", (e) => {
					const name = $(e.currentTarget).data("name");
					const page = imogi_pos.active_cashier || this;
					d.hide();
					setTimeout(() => page.import_marketplace_order(name), 0);
				});
				d.show();
			},
		});
	}

	import_marketplace_order(order_name) {
		const page = imogi_pos.active_cashier || this;
		frappe.call({
			method: "imogi_pos.api.marketplace_api.import_marketplace_order",
			args: { order_name },
			freeze: true,
			callback: (r) => {
				if (r.exc) return;
				const data = r.message || {};
				const items = data.items || [];
				if (!items.length) {
					frappe.msgprint(__("Order marketplace tidak memiliki item."));
					return;
				}

				page.marketplace_order_name = data.name || order_name;
				page.cart = items.map((row) => ({
					item_code: row.item_code,
					item_name: row.item_name,
					qty: flt(row.qty) || 1,
					rate: flt(row.rate),
					uom: row.uom,
				}));
				page.order_type = "Delivery";
				page.sync_order_type_ui();

				if (data.customer) {
					page.select_customer(data.customer, data.customer);
				}

				const paint_cart = () => {
					page.refresh_cart_dom_refs();
					page.render_cart();
				};
				paint_cart();
				frappe.after_ajax(paint_cart);

				if (page.is_mobile_layout()) {
					page.toggle_mobile_cart(true);
				}

				page.refresh_marketplace_badge();
				frappe.show_alert(
					{
						message: __("Order {0} dimuat ke keranjang", [data.external_order_id || order_name]),
						indicator: "green",
					},
					4
				);
			},
		});
	}

	render_items(items) {
		if (!items.length) {
			this.$grid.html(`<div class="imogi-cashier-empty">${__("Produk tidak ditemukan")}</div>`);
			return;
		}

		this.$grid.html(items.map((item) => this.get_item_html(item)).join(""));

		this.$grid.off("click", ".item-wrapper:not(.is-out)");
		this.$grid.on("click", ".item-wrapper:not(.is-out)", (e) => {
			const $el = $(e.currentTarget);
			const item = {
				item_code: $el.data("code"),
				item_name: $el.data("name"),
				rate: flt($el.data("rate")),
				uom: $el.data("uom"),
				has_variants: cint($el.data("has-variants")),
				auto_variant_item_code: $el.data("auto-variant") || "",
				is_combo: cint($el.data("is-combo")),
				combo_name: $el.data("combo-name") || "",
				has_addons: cint($el.data("has-addons")),
			};
			if (item.is_combo) {
				this.add_combo_to_cart(item.combo_name || String(item.item_code).replace(/^COMBO::/, ""));
				return;
			}
			if (item.auto_variant_item_code) {
				this.add_resolved_item(item.auto_variant_item_code, item);
				return;
			}
			if (item.has_variants) {
				this.open_variant_modal(item);
				return;
			}
			if (item.has_addons) {
				this.open_addon_modal(item);
				return;
			}
			this.add_to_cart(item);
		});

		this.$grid.off("keydown", ".item-wrapper:not(.is-out)");
		this.$grid.on("keydown", ".item-wrapper:not(.is-out)", (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				$(e.currentTarget).trigger("click");
			}
		});

		this.$grid.off("error", ".item-img");
		this.$grid.on("error", ".item-img", function () {
			const abbr = $(this).attr("alt") || "?";
			$(this)
				.closest(".item-media")
				.replaceWith(
					`<div class="item-display abbr">${frappe.utils.escape_html(abbr)}</div>`
				);
		});
	}

	get_item_html(item) {
		const is_combo = cint(item.is_combo);
		const track_stock =
			!is_combo && (cint(item.show_stock_label) || item.is_stock_item || item.bom_limited);
		const out = track_stock && !item.in_stock;
		const uom = item.uom || item.stock_uom || "Nos";
		const precision = flt(item.rate, 2) % 1 !== 0 ? 2 : 0;
		const qty = flt(item.stock_qty);
		const indicator = qty > 10 ? "green" : qty <= 0 ? "red" : "orange";
		let stock_line = "";

		if (is_combo) {
			stock_line = `<div class="item-stock item-stock--combo"><span class="indicator-pill blue">${__(
				"Paket"
			)}</span></div>`;
		} else if (track_stock) {
			if (qty <= 0) {
				stock_line = `<div class="item-stock item-stock--out"><span class="indicator-pill red">${__(
					"Habis"
				)}</span></div>`;
			} else {
				stock_line = `<div class="item-stock item-stock--ok"><span class="indicator-pill ${indicator}">${format_stock_pill(
					qty
				)}</span> ${__("stok tersisa")}</div>`;
			}
		}

		const abbr = frappe.utils.escape_html(
			frappe.get_abbr(item.item_name || item.item_code || "?")
		);
		let media;
		if (item.image) {
			media = `<div class="item-media"><img class="item-img" loading="lazy" decoding="async" src="${frappe.utils.escape_html(
				item.image
			)}" alt="${abbr}" /></div>`;
		} else {
			media = `<div class="item-display abbr">${abbr}</div>`;
		}

		return `<div class="item-wrapper${out ? " is-out" : ""}${item.has_variants ? " has-variants" : ""}${is_combo ? " is-combo" : ""}" role="button" tabindex="0"
			data-code="${frappe.utils.escape_html(item.item_code)}"
			data-name="${frappe.utils.escape_html(item.item_name || item.item_code)}"
			data-rate="${item.rate || 0}"
			data-uom="${frappe.utils.escape_html(uom)}"
			data-has-variants="${item.has_variants ? 1 : 0}"
			data-auto-variant="${frappe.utils.escape_html(item.auto_variant_item_code || "")}"
			data-is-combo="${is_combo ? 1 : 0}"
			data-combo-name="${frappe.utils.escape_html(item.combo_name || "")}"
			data-has-addons="${item.has_addons ? 1 : 0}">
			${media}
			<div class="item-detail">
				<div class="item-name">${frappe.utils.escape_html(item.item_name || item.item_code)}</div>
				<div class="item-rate">${format_currency(item.rate || 0, item.currency, precision) || 0} <span class="item-uom">/ ${frappe.utils.escape_html(uom)}</span></div>
				${stock_line}
			</div>
			<span class="item-quick-add" aria-hidden="true"><i class="fa fa-plus"></i></span>
		</div>`;
	}

	add_to_cart(item, options = {}) {
		const qty = Math.max(flt(options.qty || item.qty || 1), 1);
		const line_key = item.combo_name ? `${item.item_code}::${item.combo_name}` : item.item_code;
		const existing = this.cart.find((row) => {
			const key = row.combo_name ? `${row.item_code}::${row.combo_name}` : row.item_code;
			return key === line_key;
		});
		if (existing) existing.qty += qty;
		else this.cart.push({ ...item, qty });
		this.render_cart();
		if (!options.silent) {
			this.queue_cart_add_toast(item);
		}
	}

	queue_cart_add_toast(item) {
		if (!item) return;
		if (!this._cart_add_toast) {
			this._cart_add_toast = { code: null, name: "", timer: null };
		}
		const state = this._cart_add_toast;
		const code = item.item_code;
		if (state.code && state.code !== code) {
			this.flush_cart_add_toast();
		}
		state.code = code;
		state.name = item.item_name || item.item_code || "";
		clearTimeout(state.timer);
		state.timer = setTimeout(() => this.flush_cart_add_toast(), 350);
	}

	flush_cart_add_toast() {
		const state = this._cart_add_toast;
		if (!state || !state.code) return;
		clearTimeout(state.timer);
		state.timer = null;
		const row = this.cart.find((r) => r.item_code === state.code);
		const qty = row ? flt(row.qty) : 0;
		const message = qty > 1 ? `${state.name} × ${qty}` : state.name;
		imogi_show_cashier_toast(message, "green", 1.6);
		state.code = null;
		state.name = "";
	}

	add_resolved_item(item_code, template_item) {
		frappe.call({
			method: "imogi_pos.api.catalog.get_item",
			args: { item_code, ...this.branch_api_args() },
			callback: (r) => {
				if (r.exc) return;
				const resolved = r.message || {};
				if (resolved.is_stock_item && !resolved.in_stock) {
					imogi_show_cashier_toast(__("Stok habis"), "red", 2);
					return;
				}
				this.add_to_cart({
					item_code: resolved.item_code,
					item_name: resolved.item_name || template_item.item_name,
					rate: flt(resolved.rate) || flt(template_item.rate),
					uom: resolved.uom || resolved.stock_uom || template_item.uom,
					template_item_code: template_item.item_code,
				});
			},
		});
	}

	open_variant_modal(template_item) {
		this.variant_picker.open(template_item, (resolved) => {
			if (resolved.is_stock_item && !resolved.in_stock) {
				imogi_show_cashier_toast(__("Stok habis"), "red", 2);
				return;
			}
			this.add_to_cart({
				item_code: resolved.item_code,
				item_name: resolved.item_name,
				rate: flt(resolved.rate),
				uom: resolved.uom || resolved.stock_uom,
				template_item_code: resolved.template_item_code,
				variant_attributes: resolved.variant_attributes,
			});
			(resolved.add_ons || []).forEach((addon) => {
				if (addon.is_stock_item && !addon.in_stock) return;
				this.add_to_cart(addon, { silent: true });
			});
		});
	}

	open_addon_modal(template_item) {
		this.variant_picker.open(
			template_item,
			(resolved) => {
				if (resolved.is_stock_item && !resolved.in_stock) {
					imogi_show_cashier_toast(__("Stok habis"), "red", 2);
					return;
				}
				this.add_to_cart({
					item_code: resolved.item_code,
					item_name: resolved.item_name,
					rate: flt(resolved.rate),
					uom: resolved.uom || "Nos",
					template_item_code: resolved.template_item_code,
				});
				(resolved.add_ons || []).forEach((addon) => {
					if (addon.is_stock_item && !addon.in_stock) return;
					this.add_to_cart(addon, { silent: true });
				});
			},
			{ addon_only: true }
		);
	}

	add_combo_to_cart(combo_name) {
		if (!combo_name) return;
		frappe.call({
			method: "imogi_pos.api.planned_features_api.get_combo_items",
			args: { combo_name },
			callback: (r) => {
				if (r.exc) return;
				const payload = r.message || {};
				const rows = payload.items || [];
				if (!rows.length) {
					imogi_show_cashier_toast(__("Combo kosong"), "red", 2);
					return;
				}
				rows.forEach((row) => {
					this.add_to_cart(
						{
							item_code: row.item_code,
							item_name: row.item_name,
							rate: flt(row.rate),
							uom: row.uom || "Nos",
							combo_name: payload.combo_name,
							combo_label: payload.combo_label,
						},
						{ silent: true, qty: flt(row.qty) || 1 }
					);
				});
				imogi_show_cashier_toast(
					__("{0} ditambahkan ke keranjang", [payload.combo_label || combo_name]),
					"green",
					2
				);
			},
		});
	}

	handle_search_enter() {
		const term = this.$search.val().trim();
		if (!term) return;

		const looks_like_code = /^[A-Za-z0-9\-_.]+$/.test(term) && term.length >= 3;
		if (looks_like_code) {
			this.scan_and_add(term, () => {
				this.search = term;
				this.load_items();
			});
			return;
		}
		this.search = term;
		this.load_items();
	}

	scan_and_add(barcode, on_fail) {
		frappe.call({
			method: "imogi_pos.api.cashier.scan_barcode",
			args: this.branch_api_args({ barcode }),
			callback: (r) => {
				if (r.exc) {
					on_fail && on_fail();
					return;
				}
				const item = r.message || {};
				if (item.auto_variant_item_code) {
					this.$search.val("");
					this.search = "";
					this.add_resolved_item(item.auto_variant_item_code, item);
					return;
				}
				if (item.has_variants) {
					this.$search.val("");
					this.search = "";
					this.open_variant_modal(item);
					return;
				}
				if (item.is_stock_item && !item.in_stock) {
					imogi_show_cashier_toast(__("Stok habis"), "red", 2);
					return;
				}
				this.add_to_cart({
					item_code: item.item_code,
					item_name: item.item_name,
					rate: flt(item.rate),
					uom: item.uom || item.stock_uom,
				});
				this.$search.val("");
				this.search = "";
				this.load_items();
			},
		});
	}

	get_hold_data() {
		try {
			const raw = localStorage.getItem(IMOGI_HOLD_KEY);
			return raw ? JSON.parse(raw) : null;
		} catch (e) {
			return null;
		}
	}

	update_hold_ui() {
		const count = (this.held_orders || []).length;
		if (count > 0) {
			this.$hold_bar.addClass("is-visible");
			this.$hold_count.text(count);
			this.$hold_bar.find(".imogi-cashier-hold-label").text(
				count === 1 ? __("order ditahan") : __("order ditahan")
			);
		} else {
			this.$hold_bar.removeClass("is-visible");
		}
	}

	migrate_local_hold() {
		const legacy = this.get_hold_data();
		if (!legacy || !legacy.cart || !legacy.cart.length) return;
		frappe.confirm(__("Ada order ditahan lama di browser. Pindahkan ke server?"), () => {
			frappe.call({
				method: "imogi_pos.api.hold.save_hold",
				args: {
					...this.branch_api_args(),
					cart: JSON.stringify(legacy.cart),
					selected_customer: legacy.selected_customer,
					customer_label: legacy.customer_label || "",
					discount_type: legacy.discount_type || "",
					discount_value: legacy.discount_value || 0,
					label: __("Order lama"),
				},
				callback: (r) => {
					if (r.exc) return;
					localStorage.removeItem(IMOGI_HOLD_KEY);
					this.held_orders = (r.message || {}).holds || [];
					this.update_hold_ui();
					frappe.show_alert({ message: __("Order dipindahkan"), indicator: "green" });
				},
			});
		});
	}

	hold_order() {
		if (!this.require_feature("hold_order")) return;
		if (!this.cart.length) return;
		frappe.prompt(
			[{ fieldname: "label", fieldtype: "Data", label: __("Label (opsional)"), placeholder: __("Pelanggan A") }],
			(values) => {
				frappe.call({
					method: "imogi_pos.api.hold.save_hold",
					args: {
						...this.branch_api_args(),
						cart: JSON.stringify(this.cart),
						selected_customer: this.selected_customer,
						customer_label: this.wrapper.find(".imogi-cashier-customer-search").val() || "",
						discount_type: "",
						discount_value: 0,
						order_type: this.order_type,
						label: values.label,
					},
					callback: (r) => {
						if (r.exc) return;
						this.cart = [];
						this.held_orders = (r.message || {}).holds || [];
						this.render_cart();
						this.update_hold_ui();
						frappe.show_alert({ message: __("Order ditahan"), indicator: "blue" });
					},
				});
			},
			__("Tahan Order"),
			__("Simpan")
		);
	}

	show_hold_dialog() {
		this.load_holds(() => {
			if (!this.held_orders.length) {
				frappe.show_alert({ message: __("Tidak ada order ditahan"), indicator: "orange" });
				return;
			}
			const rows = this.held_orders
				.map(
					(h) => `<tr data-id="${frappe.utils.escape_html(h.id)}">
						<td><strong>${frappe.utils.escape_html(h.label)}</strong><br>
							<span class="text-muted small">${h.item_count} item · ${format_currency(
								h.total_amount || 0
							)}</span></td>
						<td class="text-right">
							<button type="button" class="btn btn-xs imogi-cashier-btn-primary imogi-take-hold">${__("Ambil")}</button>
							<button type="button" class="btn btn-xs btn-default imogi-drop-hold">${__("Hapus")}</button>
						</td>
					</tr>`
				)
				.join("");
			const d = new frappe.ui.Dialog({
				title: __("Order Ditahan"),
				size: "large",
				fields: [
					{
						fieldtype: "HTML",
						options: `<table class="table table-bordered table-sm mb-0"><tbody>${rows}</tbody></table>`,
					},
				],
			});
			d.$wrapper.on("click", ".imogi-take-hold", (e) => {
				const hold_id = $(e.currentTarget).closest("tr").attr("data-id");
				this.take_hold(hold_id, () => d.hide());
			});
			d.$wrapper.on("click", ".imogi-drop-hold", (e) => {
				const hold_id = $(e.currentTarget).closest("tr").attr("data-id");
				frappe.call({
					method: "imogi_pos.api.hold.delete_hold",
					args: this.branch_api_args({ hold_id }),
					callback: (r) => {
						if (r.exc) return;
						this.held_orders = (r.message || {}).holds || [];
						this.update_hold_ui();
						d.hide();
						if (this.held_orders.length) this.show_hold_dialog();
					},
				});
			});
			d.show();
		});
	}

	take_hold(hold_id, done) {
		const load = () => {
			frappe.call({
				method: "imogi_pos.api.hold.take_hold",
				args: this.branch_api_args({ hold_id }),
				callback: (r) => {
					if (r.exc) return;
					this.held_orders = (this.held_orders || []).filter((h) => h.id !== hold_id);
					this.update_hold_ui();
					this._apply_hold(r.message || {});
					this.load_holds();
					done && done();
				},
			});
		};
		if (this.cart.length) {
			frappe.confirm(__("Keranjang saat ini akan diganti. Lanjutkan?"), load);
			return;
		}
		load();
	}

	_apply_hold(hold) {
		this.cart = hold.cart || [];
		this.selected_customer = hold.selected_customer || null;
		this.discount_type = hold.discount_type || "";
		this.discount_value = flt(hold.discount_value);
		if (hold.order_type) {
			this.order_type = hold.order_type;
		}
		this.wrapper.find(".imogi-cashier-customer-search").val(hold.customer_label || "");
		this.sync_order_type_ui();
		this.render_cart();
		this.render_customer_label();
		frappe.show_alert({ message: __("Order ditahan diambil"), indicator: "green" });
	}

	is_cash_mode(mode_of_payment) {
		const row = (this.context.payment_modes || []).find((m) => m.mode_of_payment === mode_of_payment);
		return (row && row.type === "Cash") || /^cash$/i.test(mode_of_payment || "");
	}

	get_payment_mode_icon(mode_of_payment) {
		if (this.is_cash_mode(mode_of_payment)) return "fa-money";
		if (this.context?.payment_gateway_enabled && imogi_pos.qris?.is_qris_mode(this, mode_of_payment)) {
			return "fa-qrcode";
		}
		if (/qris/i.test(mode_of_payment || "")) return "fa-qrcode";
		if (/transfer|bank|va\b/i.test(mode_of_payment || "")) return "fa-university";
		if (/card|kartu|debit|credit/i.test(mode_of_payment || "")) return "fa-credit-card";
		return "fa-wallet";
	}

	build_payment_modes_html(default_mode) {
		const rows = this.context.payment_modes || [];
		if (!rows.length) {
			return `<div class="imogi-pay-modes"><div class="text-muted small">${__(
				"Tidak ada metode pembayaran"
			)}</div></div>`;
		}
		const cards = rows
			.map((row) => {
				const mode = row.mode_of_payment;
				const active = mode === default_mode ? " is-active" : "";
				const is_qris =
					this.context.payment_gateway_enabled && imogi_pos.qris?.is_qris_mode(this, mode);
				const icon = this.get_payment_mode_icon(mode);
				return `<button type="button" class="imogi-pay-mode-card${active}${is_qris ? " is-qris" : ""}"
					data-mode="${frappe.utils.escape_html(mode)}">
					<span class="imogi-pay-mode-icon"><i class="fa ${icon}"></i></span>
					<span class="imogi-pay-mode-name">${frappe.utils.escape_html(mode)}</span>
				</button>`;
			})
			.join("");
		return `<div class="imogi-pay-checkout-block imogi-pay-modes-wrap">
			<div class="imogi-pay-block-title"><i class="fa fa-credit-card"></i> ${__("Metode Pembayaran")}<span class="reqd">*</span></div>
			<div class="imogi-pay-modes">
				<div class="imogi-pay-modes-grid">${cards}</div>
			</div>
			<div class="imogi-pay-cash-quick">
				<div class="imogi-pay-quick-label">${__("Nominal cepat")}</div>
				<div class="imogi-pay-quick-row"></div>
			</div>
		</div>`;
	}

	render_cash_quick_buttons(dialog, total) {
		this.ensure_cash_quick_ui(dialog);
		const amounts = [
			{ amount: flt(total), label: __("Uang Pas"), exact: true },
			{ amount: 50000, label: "50K" },
			{ amount: 100000, label: "100K" },
		];
		dialog.$wrapper.find(".imogi-pay-quick-row").html(
			amounts
				.map(({ amount, label, exact }) => {
					const disabled = !exact && amount < flt(total);
					const exact_cls = exact ? " is-exact" : "";
					const disabled_cls = disabled ? " is-disabled" : "";
					return `<button type="button" class="imogi-pay-quick-btn${exact_cls}${disabled_cls}" data-amount="${amount}"${
						disabled ? " disabled" : ""
					}>${label}</button>`;
				})
				.join("")
		);
	}

	ensure_cash_quick_ui(dialog) {
		const $wrap = dialog.$wrapper;
		let $quick = $wrap.find(".imogi-pay-cash-quick");
		if ($quick.length) return $quick;
		const $modes_field = $wrap.find('.frappe-control[data-fieldname="payment_modes_html"]');
		$quick = $(`<div class="imogi-pay-cash-quick">
			<div class="imogi-pay-quick-label">${__("Nominal cepat")}</div>
			<div class="imogi-pay-quick-row"></div>
		</div>`);
		if ($modes_field.length) {
			$modes_field.after($quick);
		} else {
			$wrap.find(".imogi-pay-checkout-stack").prepend($quick);
		}
		return $quick;
	}

	setup_payment_mode_cards(dialog, subtotal) {
		const me = this;
		const $wrap = dialog.$wrapper;
		$wrap.off("click.imogiPayMode", ".imogi-pay-mode-card");
		$wrap.on("click.imogiPayMode", ".imogi-pay-mode-card", function () {
			const mode = $(this).data("mode");
			if (!mode) return;
			$wrap.find(".imogi-pay-mode-card").removeClass("is-active");
			$(this).addClass("is-active");
			dialog.set_value("mode_of_payment", mode);
			me.toggle_cash_fields(dialog, subtotal);
		});
	}

	is_sales_tax_enabled() {
		const cfg = this.context?.sales_tax || {};
		return cfg.enabled !== 0 && cfg.enabled !== false;
	}

	is_mobile_layout() {
		return window.matchMedia("(max-width: 992px)").matches;
	}

	enable_mobile_layout_watch() {
		this._mobile_layout_mql = window.matchMedia("(max-width: 992px)");
		this._on_mobile_layout_change = () => this.sync_mobile_layout();
		this._mobile_layout_mql.addEventListener("change", this._on_mobile_layout_change);
		this.page?.on_page_hide?.(() => {
			this._mobile_layout_mql?.removeEventListener("change", this._on_mobile_layout_change);
		});
		this.sync_mobile_layout();
	}

	sync_mobile_layout() {
		const mobile = this.is_mobile_layout();
		this.wrapper.toggleClass("is-mobile-layout", mobile);
		this.page?.main?.toggleClass("is-mobile-layout", mobile);
		if (!mobile) this.close_mobile_cart();
		if (this.enable_pos_shift && this.$shift_bar?.is(":visible")) {
			this.render_shift_bar();
		}
		this.sync_order_type_placement();
	}

	sync_order_type_placement() {
		const typeFeatures = IMOGI_ORDER_TYPE_FEATURES;
		const availableTypes = IMOGI_ORDER_TYPES.filter((row) =>
			this.feature_allowed(typeFeatures[row.value])
		);
		const $orderTypeRow = this.wrapper.find(".imogi-cashier-order-type-row");
		const $mobileOrderRow = this.wrapper.find(".imogi-cashier-mobile-order-scroll");
		if (availableTypes.length <= 1) {
			$orderTypeRow.hide();
			$mobileOrderRow.hide();
			return;
		}
		const mobile = this.is_mobile_layout();
		$orderTypeRow.toggle(!mobile);
		$mobileOrderRow.toggle(mobile);
	}

	toggle_mobile_cart(open) {
		if (!this.is_mobile_layout()) return;
		this.mobile_cart_open = open === undefined ? !this.mobile_cart_open : !!open;
		this.wrapper.toggleClass("is-mobile-cart-open", this.mobile_cart_open);
		this.page?.main?.toggleClass("is-mobile-cart-open", this.mobile_cart_open);
		document.body.classList.toggle("imogi-cashier-mobile-cart-open", this.mobile_cart_open);
	}

	close_mobile_cart() {
		this.toggle_mobile_cart(false);
	}

	update_mobile_dock() {
		if (!this.$dock_total) return;
		const count = this.cart.reduce((sum, row) => sum + flt(row.qty), 0);
		const total = this.get_cart_total();
		this.$dock_badge.text(count || 0).toggleClass("is-empty", !count);
		this.$dock_total.text(format_currency(total));
		const disabled = !this.cart.length || this.busy;
		this.$dock_pay.prop("disabled", disabled);
		this.$pay.prop("disabled", disabled || !this.cart.length);
	}

	set_order_type(order_type, silent) {
		if (!order_type || this.order_type === order_type) return;
		const feature_key = IMOGI_ORDER_TYPE_FEATURES[order_type];
		if (feature_key && !this.feature_allowed(feature_key)) {
			if (!silent) this.require_feature(feature_key);
			return;
		}
		this.order_type = order_type;
		this.sync_order_type_ui();
	}

	sync_order_type_ui() {
		const active = this.order_type;
		this.wrapper
			.find(".imogi-cashier-order-type-btn")
			.removeClass("is-active")
			.filter(function () {
				return String($(this).data("type") || "") === String(active || "");
			})
			.addClass("is-active");
	}

	update_qty(item_code, delta) {
		const row = this.cart.find((r) => r.item_code === item_code);
		if (!row) return;
		row.qty += delta;
		if (row.qty <= 0) this.cart = this.cart.filter((r) => r.item_code !== item_code);
		this.render_cart();
	}

	clear_cart() {
		if (!this.cart.length && !this.discount_type && !flt(this.discount_value)) return;
		this.cart = [];
		this.marketplace_order_name = null;
		this.discount_type = "";
		this.discount_value = 0;
		this.render_cart();
	}

	search_customer(term) {
		if (!term) return;
		if (!this.require_feature("customer")) return;
		frappe.call({
			method: "imogi_pos.api.cashier.search_customers",
			args: { search: term, limit: 8 },
			callback: (r) => {
				const customers = (r.message || {}).customers || [];
				if (!customers.length) {
					this.prompt_create_customer(term);
					return;
				}
				if (customers.length === 1) {
					this.select_customer(customers[0].name, customers[0].customer_name);
					return;
				}
				const d = new frappe.ui.Dialog({
					title: __("Pilih Customer"),
					fields: [
						{
							fieldtype: "HTML",
							options: `<ul class="list-unstyled mb-0">${customers
								.map(
									(c) =>
										`<li class="mb-2"><button type="button" class="btn btn-default btn-sm btn-block imogi-pick-customer" data-name="${frappe.utils.escape_html(
											c.name
										)}" data-label="${frappe.utils.escape_html(c.customer_name)}">${frappe.utils.escape_html(
											c.customer_name
										)}${
											c.loyalty_points
												? ` <span class="text-muted">· ${c.loyalty_points} ${__("poin")}</span>`
												: ""
										}${
											c.mobile_no
												? ` <span class="text-muted">· ${frappe.utils.escape_html(
														c.mobile_no
												  )}</span>`
												: ""
										}</button></li>`
								)
								.join("")}
								<li class="mt-3"><button type="button" class="btn btn-sm btn-block imogi-cashier-btn-primary imogi-pick-customer-new">${__(
									"+ Customer Baru"
								)}</button></li></ul>`,
						},
					],
				});
				d.$wrapper.on("click", ".imogi-pick-customer", (e) => {
					const $btn = $(e.currentTarget);
					this.select_customer($btn.data("name"), $btn.data("label"));
					d.hide();
				});
				d.$wrapper.on("click", ".imogi-pick-customer-new", () => {
					d.hide();
					this.prompt_create_customer(term);
				});
				d.show();
			},
		});
	}

	select_customer(name, label) {
		this.selected_customer = name;
		this.wrapper.find(".imogi-cashier-customer-search").val(label || name);
		imogi_pos.loyalty.load_customer(this, name);
		this.render_customer_label();
	}

	refresh_payment_preview(dialog, subtotal) {
		if (imogi_pos.loyalty?.refresh_preview) {
			imogi_pos.loyalty.refresh_preview(this, dialog, subtotal);
			return;
		}
		this.payment_preview = null;
		this.refresh_payment_dialog(dialog, subtotal);
	}

	needs_checkout_preview() {
		if (this.is_sales_tax_enabled()) return true;
		if (this.context?.enable_promo_rules) return true;
		return !!(
			this.context?.loyalty_enabled &&
			imogi_pos.loyalty &&
			(this.feature_allowed("point_reward") || this.feature_allowed("voucher"))
		);
	}

	prompt_create_customer(prefill_name = "") {
		if (!this.require_feature("customer")) return;
		const d = new frappe.ui.Dialog({
			title: __("Customer Baru"),
			fields: [
				{
					fieldname: "customer_name",
					fieldtype: "Data",
					label: __("Nama Customer"),
					reqd: 1,
					default: prefill_name || "",
				},
				{
					fieldname: "mobile_no",
					fieldtype: "Data",
					label: __("No. HP (opsional)"),
				},
				{
					fieldname: "customer_type",
					fieldtype: "Select",
					label: __("Tipe"),
					options: "Individual\nCompany",
					default: "Individual",
				},
			],
			primary_action_label: __("Simpan & Pilih"),
			primary_action: (values) => {
				d.get_primary_btn().prop("disabled", true);
				frappe.call({
					method: "imogi_pos.api.cashier.create_customer",
					args: values,
					callback: (r) => {
						d.get_primary_btn().prop("disabled", false);
						if (r.exc) return;
						const customer = r.message || {};
						this.select_customer(customer.name, customer.customer_name);
						d.hide();
						frappe.show_alert({ message: __("Customer dibuat"), indicator: "green" }, 3);
					},
				});
			},
		});
		d.show();
		setTimeout(() => d.fields_dict.customer_name?.$input?.focus()?.select(), 200);
	}

	render_customer_label() {
		if (!this.selected_customer) {
			this.$customer_label.text(__("Customer default POS Profile"));
			return;
		}
		const label = this.wrapper.find(".imogi-cashier-customer-search").val() || this.selected_customer;
		const points = cint(this.customer_loyalty?.points);
		const stamp = this.customer_loyalty?.stamp;
		const parts = [`${__("Customer")}: ${label}`];
		if (this.context?.loyalty_enabled && points > 0) {
			parts.push(`${points} ${__("poin")}`);
		}
		if (this.context?.enable_stamp_card && stamp?.enabled) {
			parts.push(`${stamp.stamps || 0}/${stamp.target || 0} ${__("stamp")}`);
		}
		this.$customer_label.text(parts.join(" · "));
	}

	refresh_cart_dom_refs() {
		this.$cart_items = this.wrapper.find(".imogi-cashier-cart-items");
		this.$total = this.wrapper.find(".imogi-cart-total");
		this.$pay = this.wrapper.find(".imogi-cashier-pay");
		this.$hold_btn = this.wrapper.find(".imogi-cashier-hold-btn");
		this.$dock_badge = this.wrapper.find(".imogi-cashier-dock-badge");
		this.$dock_total = this.wrapper.find(".imogi-cashier-dock-total");
		this.$dock_pay = this.wrapper.find(".imogi-cashier-dock-pay");
	}

	get_cart_subtotal() {
		return this.cart.reduce((sum, row) => sum + flt(row.rate) * flt(row.qty), 0);
	}

	refresh_cart_promos(subtotal) {
		this.$cart_items.siblings(".imogi-cashier-promo-hint").remove();
		if (!this.context?.enable_promo_rules || !this.cart.length) {
			this.promo_discount = 0;
			this.applied_promos = [];
			this.update_cart_total_display();
			return;
		}
		clearTimeout(this._promo_preview_timer);
		this._promo_preview_timer = setTimeout(() => {
			frappe.call({
				method: "imogi_pos.api.promo_api.preview_cart_promos",
				args: {
					items: JSON.stringify(
						this.cart.map((row) => ({
							item_code: row.item_code,
							qty: row.qty,
							rate: row.rate,
						}))
					),
					...this.branch_api_args(),
				},
				callback: (r) => {
					const msg = r.message || {};
					this.applied_promos = msg.applied_promos || [];
					this.promo_discount = flt(msg.promo_discount);
					const pending = msg.pending_promos || [];
					const hints = [
						...this.applied_promos.map((row) => row.label),
						...pending.map((row) => row.label),
					];
					if (hints.length) {
						const savings =
							this.promo_discount > 0
								? ` · ${__("hemat")} ${format_currency(this.promo_discount)}`
								: "";
						this.$cart_items.before(
							`<div class="imogi-cashier-promo-hint imogi-cashier-promo-hint--${
								this.promo_discount > 0 ? "active" : "pending"
							}"><i class="fa fa-gift"></i> ${frappe.utils.escape_html(
								hints.join(" · ")
							)}${savings}</div>`
						);
					}
					this.update_cart_total_display();
				},
			});
		}, 250);
	}

	get_discount_amount(subtotal, discount_type = this.discount_type, discount_value = this.discount_value) {
		if (discount_type === "Percent" && flt(discount_value)) {
			return (subtotal * flt(discount_value)) / 100;
		}
		if (discount_type === "Amount" && flt(discount_value)) {
			return Math.min(flt(discount_value), subtotal);
		}
		return 0;
	}

	get_cart_total() {
		const subtotal = this.get_cart_subtotal();
		const manual = this.get_discount_amount(subtotal);
		const net = Math.max(0, subtotal - manual - flt(this.promo_discount));
		return imogi_compute_local_tax(net, this.context?.sales_tax || {}).grand_total;
	}

	get_pay_item_count() {
		return this.cart.reduce((sum, row) => sum + flt(row.qty), 0);
	}

	get_order_type_label() {
		const row = IMOGI_ORDER_TYPES.find((item) => item.value === this.order_type);
		return row?.label || this.order_type || "";
	}

	build_pay_summary_html(subtotal) {
		const tax_cfg = this.context?.sales_tax || {};
		const tax_rate = flt(tax_cfg.rate) || 11;
		const tax_enabled = this.is_sales_tax_enabled();
		const manual = this.get_discount_amount(subtotal);
		const net = Math.max(0, subtotal - manual - flt(this.promo_discount));
		const tax = imogi_compute_local_tax(net, tax_cfg);
		const tax_style = tax_enabled ? "" : ' style="display:none;"';
		const item_count = this.get_pay_item_count();
		const order_label = this.get_order_type_label();
		const order_badge = order_label
			? `<span class="imogi-pay-order-badge">${frappe.utils.escape_html(order_label)}</span>`
			: "";
		return `<div class="imogi-pay-top">
			<div class="imogi-pay-total-strip">
				<div class="imogi-pay-total-strip-meta">
					<span class="imogi-pay-item-badge"><i class="fa fa-shopping-basket"></i> ${item_count} ${__(
						"barang"
					)}</span>
					${order_badge}
				</div>
				<span class="imogi-pay-total-strip-label">${__("Total Bayar")}</span>
				<div class="imogi-pay-hero-amount imogi-pay-total-value">${imogi_format_pay_total(tax.grand_total)}</div>
			</div>
			<div class="imogi-pay-receipt">
				<div class="imogi-pay-receipt-title">${__("Rincian Tagihan")}</div>
				<div class="imogi-pay-breakdown imogi-pay-breakdown--summary">
					<div class="imogi-pay-breakdown-row">
						<span>${__("Subtotal")}</span>
						<strong class="imogi-pay-subtotal-value">${format_currency(subtotal)}</strong>
					</div>
					<div class="imogi-pay-breakdown-row is-discount imogi-pay-promo-breakdown-row" style="display:none;">
						<span>${__("Promo otomatis")}</span>
						<strong class="imogi-pay-promo-discount-display">-${format_currency(0)}</strong>
					</div>
					<div class="imogi-pay-breakdown-row is-discount imogi-pay-discount-breakdown-row" style="display:none;">
						<span>${__("Diskon")}</span>
						<strong class="imogi-pay-discount-value-display">-${format_currency(0)}</strong>
					</div>
					<div class="imogi-pay-breakdown-row is-discount imogi-pay-voucher-breakdown-row" style="display:none;">
						<span>${__("Voucher")}</span>
						<strong class="imogi-pay-voucher-discount-display">-${format_currency(0)}</strong>
					</div>
					<div class="imogi-pay-breakdown-row is-discount imogi-pay-loyalty-breakdown-row" style="display:none;">
						<span>${__("Poin")}</span>
						<strong class="imogi-pay-loyalty-discount-display">-${format_currency(0)}</strong>
					</div>
					<div class="imogi-pay-breakdown-divider imogi-pay-tax-divider"${tax_style}></div>
					<div class="imogi-pay-breakdown-row is-tax imogi-pay-taxable-breakdown-row"${tax_style}>
						<span>${__("DPP")}</span>
						<strong class="imogi-pay-taxable-value">${format_currency(tax.taxable_amount)}</strong>
					</div>
					<div class="imogi-pay-breakdown-row is-tax imogi-pay-tax-breakdown-row"${tax_style}>
						<span class="imogi-pay-tax-label">${__("PPN")} ${tax_rate}%</span>
						<strong class="imogi-pay-tax-value">${format_currency(tax.tax_amount)}</strong>
					</div>
				</div>
			</div>
		</div>`;
	}

	get_checkout_breakdown(dialog, subtotal) {
		const preview = this.payment_preview || {};
		const { type, value } = this.get_payment_discount_state(dialog);
		const promo_discount = flt(preview.promo_discount ?? this.promo_discount);
		const manual_discount = this.get_discount_amount(subtotal, type, value);
		const voucher_discount = flt(preview.voucher_discount);
		const loyalty_discount = flt(preview.loyalty_discount);
		const net_before_tax =
			preview.net_before_tax != null
				? flt(preview.net_before_tax)
				: Math.max(0, subtotal - promo_discount - manual_discount - voucher_discount - loyalty_discount);
		const tax = preview.tax_amount != null
			? {
					taxable_amount: flt(preview.taxable_amount),
					tax_amount: flt(preview.tax_amount),
					grand_total: flt(preview.grand_total),
					tax_rate: flt(preview.tax_rate) || flt(this.context?.sales_tax?.rate) || 11,
			  }
			: imogi_compute_local_tax(net_before_tax, this.context?.sales_tax || {});
		return {
			subtotal,
			promo_discount,
			manual_discount,
			voucher_discount,
			loyalty_discount,
			net_before_tax,
			...tax,
		};
	}

	build_order_breakdown(order) {
		const subtotal = flt(order.subtotal);
		const promo_discount = flt(order.promo_discount_amount);
		const voucher_discount = flt(order.voucher_discount_amount);
		const loyalty_discount = flt(order.loyalty_discount_amount);
		const total_discount = flt(order.discount_amount);
		const manual_discount = Math.max(
			0,
			total_discount - promo_discount - voucher_discount - loyalty_discount
		);
		let taxable_amount = flt(order.taxable_amount);
		let tax_amount = flt(order.tax_amount);
		const grand_total = flt(order.grand_total);
		const tax_rate = flt(this.context?.sales_tax?.rate) || 11;
		if (!taxable_amount && !tax_amount && grand_total) {
			const net = Math.max(0, subtotal - total_discount);
			const tax = imogi_compute_local_tax(net, this.context?.sales_tax || {});
			taxable_amount = flt(tax.taxable_amount);
			tax_amount = flt(tax.tax_amount);
		}
		return {
			subtotal,
			promo_discount,
			manual_discount,
			voucher_discount,
			loyalty_discount,
			taxable_amount,
			tax_amount,
			grand_total,
			tax_rate,
		};
	}

	build_success_summary_html(breakdown, payment_info = {}) {
		const tax_enabled = this.is_sales_tax_enabled();
		const tax_rate = flt(breakdown.tax_rate) || flt(this.context?.sales_tax?.rate) || 11;
		const row = (label, value, cls, show) =>
			show
				? `<div class="imogi-pay-breakdown-row ${cls || ""}"><span>${label}</span><strong>${value}</strong></div>`
				: "";
		const payment_mode = payment_info.mode_of_payment
			? `<div class="imogi-pay-success-payment-meta">
				<span>${__("Metode")}</span>
				<strong>${frappe.utils.escape_html(payment_info.mode_of_payment)}</strong>
			</div>`
			: "";
		const paid = flt(payment_info.paid_amount);
		const change = flt(payment_info.change);
		const is_cash =
			payment_info.mode_of_payment && this.is_cash_mode(payment_info.mode_of_payment);
		const cash_meta =
			is_cash && paid > 0
				? `<div class="imogi-pay-success-cash-meta">
					<div class="imogi-pay-success-cash-row">
						<span>${__("Diterima")}</span>
						<strong>${format_currency(paid)}</strong>
					</div>
					${
						change > 0
							? `<div class="imogi-pay-success-cash-row is-change">
								<span>${__("Kembalian")}</span>
								<strong>${format_currency(change)}</strong>
							</div>`
							: ""
					}
				</div>`
				: "";

		return `<div class="imogi-pay-summary imogi-pay-summary--success">
			<div class="imogi-pay-breakdown imogi-pay-breakdown--summary">
				${row(__("Subtotal"), format_currency(breakdown.subtotal), "", breakdown.subtotal > 0)}
				${row(
					__("Promo otomatis"),
					`-${format_currency(breakdown.promo_discount)}`,
					"is-discount",
					breakdown.promo_discount > 0
				)}
				${row(
					__("Diskon"),
					`-${format_currency(breakdown.manual_discount)}`,
					"is-discount",
					breakdown.manual_discount > 0
				)}
				${row(
					__("Voucher"),
					`-${format_currency(breakdown.voucher_discount)}`,
					"is-discount",
					breakdown.voucher_discount > 0
				)}
				${row(
					__("Poin"),
					`-${format_currency(breakdown.loyalty_discount)}`,
					"is-discount",
					breakdown.loyalty_discount > 0
				)}
				${row(
					__("DPP"),
					format_currency(breakdown.taxable_amount),
					"is-tax",
					tax_enabled
				)}
				${row(
					`${__("PPN")} ${tax_rate}%`,
					format_currency(breakdown.tax_amount),
					"is-tax",
					tax_enabled
				)}
			</div>
			<div class="imogi-pay-total-footer">
				<div class="imogi-pay-total-label">${__("Total Bayar")}</div>
				<div class="imogi-pay-total-value">${imogi_format_pay_total(breakdown.grand_total)}</div>
			</div>
			${payment_mode}
			${cash_meta}
		</div>`;
	}

	update_cart_total_display() {
		if (!this.$total) return;
		this.$total.text(format_currency(this.get_cart_total()));
		this.update_mobile_dock();
	}

	render_cart() {
		this.refresh_cart_dom_refs();
		if (!this.cart.length) {
			this.$cart_items.html(
				`<div class="imogi-cashier-cart-empty"><i class="fa fa-hand-pointer-o fa-2x mb-2"></i><br>${__(
					"Tap produk untuk menambah ke keranjang"
				)}</div>`
			);
			this.$total.text(format_currency(0));
			this.$pay.prop("disabled", true);
			this.$hold_btn.prop("disabled", true);
			this.update_mobile_dock();
			this.close_mobile_cart();
			return;
		}

		const subtotal = this.get_cart_subtotal();

		this.$cart_items.html(
			this.cart
				.map((row) => {
					const amount = flt(row.rate) * flt(row.qty);
					const unit_label = row.uom ? ` / ${frappe.utils.escape_html(row.uom)}` : "";
					return `
						<div class="imogi-cart-row" data-code="${frappe.utils.escape_html(row.item_code)}">
							<div class="imogi-cart-row-line">
								<div class="imogi-cart-row-name">${frappe.utils.escape_html(row.item_name)}</div>
								<div class="imogi-cart-row-amount">${format_currency(amount)}</div>
							</div>
							<div class="imogi-cart-row-actions">
								<div class="imogi-cart-qty-group">
									<button type="button" class="imogi-qty-btn" data-delta="-1" aria-label="${__("Kurangi")}">−</button>
									<span class="imogi-cart-qty">${row.qty}</span>
									<button type="button" class="imogi-qty-btn" data-delta="1" aria-label="${__("Tambah")}">+</button>
								</div>
								<div class="imogi-cart-row-meta">${format_currency(row.rate)}${unit_label}</div>
							</div>
						</div>`;
				})
				.join("")
		);

		this.$cart_items.find(".imogi-qty-btn").on("click", (e) => {
			const $row = $(e.currentTarget).closest(".imogi-cart-row");
			this.update_qty($row.data("code"), cint($(e.currentTarget).data("delta")));
		});

		this.$total.text(format_currency(this.get_cart_total()));
		this.refresh_cart_promos(subtotal);
		this.$pay.prop("disabled", false);
		this.$hold_btn.prop("disabled", !this.feature_allowed("hold_order"));
		this.update_mobile_dock();
	}

	get_payment_discount_state(dialog) {
		const $wrap = dialog.$wrapper;
		return {
			type: $wrap.find(".imogi-pay-discount-type").val() || "",
			value: flt($wrap.find(".imogi-pay-discount-value").val()),
		};
	}

	get_payment_total(dialog, subtotal) {
		if (this.payment_preview && flt(this.payment_preview.grand_total) >= 0) {
			return flt(this.payment_preview.grand_total);
		}
		return this.get_checkout_breakdown(dialog, subtotal).grand_total;
	}

	build_pay_numpad_html() {
		const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"];
		return `<div class="imogi-pay-numpad">${keys
			.map(
				(key) =>
					`<button type="button" class="imogi-pay-numpad-key" data-key="${key}">${key}</button>`
			)
			.join("")}</div>`;
	}

	setup_payment_discount_ui(dialog, subtotal) {
		const me = this;
		const $wrap = dialog.$wrapper;
		const $toggle = $wrap.find(".imogi-pay-discount-toggle");
		const $panel = $wrap.find(".imogi-pay-discount-panel");
		const $type = $wrap.find(".imogi-pay-discount-type");
		const $value = $wrap.find(".imogi-pay-discount-value");
		const has_discount = !!(this.discount_type && flt(this.discount_value));

		$type.val(this.discount_type || "");
		$value.val(this.discount_value || "");
		$panel.toggleClass("is-open", has_discount);
		$toggle.toggleClass("is-open", has_discount);

		const sync = () => {
			if (me.needs_checkout_preview()) {
				me.refresh_payment_preview(dialog, subtotal);
			} else {
				me.refresh_payment_dialog(dialog, subtotal);
			}
		};

		$toggle.off("click.imogiPay").on("click.imogiPay", () => {
			const open = !$panel.hasClass("is-open");
			$panel.toggleClass("is-open", open);
			$toggle.toggleClass("is-open", open);
			if (open) {
				$value.trigger("focus");
			}
		});

		$type.off("change.imogiPay").on("change.imogiPay", sync);
		$value.off("input.imogiPay change.imogiPay").on("input.imogiPay change.imogiPay", sync);
	}

	setup_mobile_pay_numpad(dialog, subtotal) {
		const me = this;
		const $wrap = dialog.$wrapper;
		const is_mobile = this.is_mobile_layout();
		$wrap.toggleClass("imogi-pay-mobile", is_mobile);

		const $field = dialog.fields_dict.paid_amount?.$wrapper;
		if (!$field || !$field.length) return;

		let $numpad_wrap = $wrap.find(".imogi-pay-numpad-wrap");
		if (!$numpad_wrap.length) {
			$wrap.find(".imogi-pay-cash-section").append(`<div class="imogi-pay-numpad-wrap">${this.build_pay_numpad_html()}</div>`);
			$numpad_wrap = $wrap.find(".imogi-pay-numpad-wrap");
		}

		const $input = dialog.fields_dict.paid_amount.$input;
		if (!is_mobile) {
			$input.removeAttr("readonly inputmode tabindex");
			$input.prop("readonly", false);
			$numpad_wrap.removeClass("is-visible");
			return;
		}

		const input_el = $input.get(0);
		if (input_el) {
			input_el.readOnly = true;
			input_el.inputMode = "none";
		}
		$input.attr({ readonly: true, inputmode: "none", autocomplete: "off", tabindex: "-1" });

		let buffer = "";

		const sync_buffer = (next_buffer) => {
			buffer = next_buffer;
			const amount = buffer ? flt(buffer) : 0;
			dialog.set_value("paid_amount", amount);
			me.refresh_payment_dialog(dialog, subtotal);
		};

		const show_numpad = () => {
			if (!me.is_cash_mode(dialog.get_value("mode_of_payment"))) return;
			$numpad_wrap.addClass("is-visible");
			buffer = String(Math.round(flt(dialog.get_value("paid_amount")) || 0));
			if (buffer === "0") buffer = "";
			if (input_el) {
				input_el.readOnly = true;
				input_el.blur();
			}
		};

		const block_focus = (e) => {
			e.preventDefault();
			e.stopPropagation();
			if (input_el) input_el.blur();
			show_numpad();
			return false;
		};

		$input
			.off("focus.imogiNumpad touchstart.imogiNumpad mousedown.imogiNumpad click.imogiNumpad keydown.imogiNumpad")
			.on("focus.imogiNumpad touchstart.imogiNumpad mousedown.imogiNumpad click.imogiNumpad", block_focus)
			.on("keydown.imogiNumpad", (e) => e.preventDefault());

		$numpad_wrap.off("click.imogiNumpad").on("click.imogiNumpad", ".imogi-pay-numpad-key", function () {
			const key = $(this).data("key");
			if (key === "C") {
				sync_buffer("");
				return;
			}
			if (key === "⌫") {
				sync_buffer(buffer.slice(0, -1));
				return;
			}
			sync_buffer(`${buffer}${key}`);
		});

		dialog._imogi_set_paid_amount = (amount) => {
			sync_buffer(String(Math.round(flt(amount) || 0)));
		};

		if (me.is_cash_mode(dialog.get_value("mode_of_payment"))) {
			show_numpad();
		}
	}

	finalize_mobile_pay_dialog(dialog) {
		if (!this.is_mobile_layout()) return;
		const blur_focused = () => {
			dialog.$wrapper.find("input:focus, textarea:focus, select:focus").each(function () {
				this.blur();
			});
			document.activeElement?.blur?.();
		};
		blur_focused();
		setTimeout(blur_focused, 0);
		setTimeout(blur_focused, 120);

		const $paid = dialog.fields_dict.paid_amount?.$input;
		if ($paid?.length) {
			const el = $paid.get(0);
			if (el) {
				el.readOnly = true;
				el.inputMode = "none";
			}
			$paid.attr({ readonly: true, inputmode: "none", autocomplete: "off", tabindex: "-1" });
		}

		const $wrap = dialog.$wrapper;
		const has_discount = !!(this.discount_type && flt(this.discount_value));
		if (!has_discount) {
			$wrap.find(".imogi-pay-discount-panel, .imogi-pay-discount-toggle").removeClass("is-open");
		}
		$wrap.find(".imogi-pay-promo-panel, .imogi-pay-promo-toggle").removeClass("is-open");

		if (!$wrap.find(".imogi-pay-qris-hint").length) {
			$wrap.find(".imogi-pay-checkout-stack").append(
				`<div class="imogi-pay-qris-hint" style="display:none">
					<i class="fa fa-qrcode"></i>
					<span>${__("QRIS akan ditampilkan setelah konfirmasi. Pastikan nominal sudah sesuai.")}</span>
				</div>`
			);
			$wrap.find(".imogi-pay-checkout-stack").append(
				`<div class="imogi-pay-noncash-hint" style="display:none">
					<i class="fa fa-info-circle"></i>
					<span>${__("Konfirmasi metode pembayaran, lalu tekan tombol bayar.")}</span>
				</div>`
			);
		}
	}

	refresh_payment_dialog(dialog, subtotal) {
		const breakdown = this.get_checkout_breakdown(dialog, subtotal);
		const total = breakdown.grand_total;
		const tax_enabled = this.is_sales_tax_enabled();
		const $wrap = dialog.$wrapper;

		$wrap.find(".imogi-pay-hero-amount, .imogi-pay-total-value").html(imogi_format_pay_total(total));
		$wrap.find(".imogi-pay-footer-amount").text(format_currency(total));
		$wrap.find(".imogi-pay-item-badge").html(
			`<i class="fa fa-shopping-basket"></i> ${this.get_pay_item_count()} ${__("barang")}`
		);
		$wrap.find(".imogi-pay-subtotal-value").text(format_currency(breakdown.subtotal));
		$wrap.find(".imogi-pay-promo-discount-display").text(`-${format_currency(breakdown.promo_discount)}`);
		$wrap.find(".imogi-pay-promo-breakdown-row").toggle(breakdown.promo_discount > 0);
		$wrap.find(".imogi-pay-discount-value-display").text(`-${format_currency(breakdown.manual_discount)}`);
		$wrap.find(".imogi-pay-discount-breakdown-row").toggle(breakdown.manual_discount > 0);
		$wrap.find(".imogi-pay-voucher-discount-display").text(`-${format_currency(breakdown.voucher_discount)}`);
		$wrap.find(".imogi-pay-voucher-breakdown-row").toggle(breakdown.voucher_discount > 0);
		$wrap.find(".imogi-pay-loyalty-discount-display").text(`-${format_currency(breakdown.loyalty_discount)}`);
		$wrap.find(".imogi-pay-loyalty-breakdown-row").toggle(breakdown.loyalty_discount > 0);
		$wrap.find(".imogi-pay-tax-label").text(`${__("PPN")} ${breakdown.tax_rate}%`);
		$wrap.find(".imogi-pay-taxable-value").text(format_currency(breakdown.taxable_amount));
		$wrap.find(".imogi-pay-tax-value").text(format_currency(breakdown.tax_amount));
		$wrap
			.find(".imogi-pay-taxable-breakdown-row, .imogi-pay-tax-breakdown-row, .imogi-pay-tax-divider")
			.toggle(tax_enabled);

		this.render_cash_quick_buttons(dialog, total);

		this.update_payment_primary_action(dialog, subtotal);

		if (this.is_cash_mode(dialog.get_value("mode_of_payment"))) {
			const prevTotal = flt(dialog._imogi_last_checkout_total);
			const paid = flt(dialog.get_value("paid_amount"));
			if (!paid || prevTotal !== total) {
				if (typeof dialog._imogi_set_paid_amount === "function") {
					dialog._imogi_set_paid_amount(total);
				} else {
					dialog.set_value("paid_amount", total);
				}
			}
			dialog._imogi_last_checkout_total = total;
			this.update_change_display(dialog, total);
		}
	}

	update_payment_primary_action(dialog, subtotal) {
		const total = this.get_payment_total(dialog, subtotal);
		dialog.set_primary_action_label(`${__("Selesaikan Pembayaran")} · ${format_currency(total)}`);
	}

	setup_payment_shell(dialog) {
		const $wrap = dialog.$wrapper;
		const $body = $wrap.find(".modal-body");
		if ($body.find(".imogi-pay-shell").length) return;

		const $shell = $(`<div class="imogi-pay-shell">
			<div class="imogi-pay-col imogi-pay-col--summary"></div>
			<div class="imogi-pay-col imogi-pay-col--checkout">
				<div class="imogi-pay-checkout-stack"></div>
				<div class="imogi-pay-extras"></div>
			</div>
		</div>`);

		const $summary = dialog.fields_dict.pay_summary_html?.$wrapper;
		const $stack = $shell.find(".imogi-pay-checkout-stack");
		const $extras = $shell.find(".imogi-pay-extras");
		const checkout_fields = ["payment_modes_html", "change_html"];
		const extra_fields = ["promo_html", "discount_html"];

		$body.prepend($shell);
		if ($summary?.length) {
			$shell.find(".imogi-pay-col--summary").append($summary);
		}
		checkout_fields.forEach((name) => {
			const $field = dialog.fields_dict[name]?.$wrapper;
			if ($field?.length) $stack.append($field);
		});
		extra_fields.forEach((name) => {
			const $field = dialog.fields_dict[name]?.$wrapper;
			if ($field?.length) $extras.append($field);
		});

		const $paid = dialog.fields_dict.paid_amount?.$wrapper;
		if ($paid?.length) {
			$stack.append($paid);
		}

		const $mode = dialog.fields_dict.mode_of_payment?.$wrapper;
		if ($mode?.length) {
			$shell.find(".imogi-pay-col--checkout").append($mode.hide());
		}

		$body.children().not(".imogi-pay-shell").hide();

		$shell.find(".frappe-control").each(function () {
			const $field = $(this);
			$field.removeClass(function (i, className) {
				return (className.match(/(^|\s)col-\S+/g) || []).join(" ");
			});
			$field.css({ width: "100%", maxWidth: "100%" });
		});
	}

	apply_payment_modal_dimensions(dialog) {
		if (!dialog?.$wrapper) return;
		const $dlg = dialog.$wrapper.find(".modal-dialog");
		if (!$dlg.length) return;
		$dlg.addClass("modal-xl");
		const mobile = this.is_mobile_layout();
		const landscape = this.is_landscape_layout();
		const vw = window.innerWidth || document.documentElement.clientWidth || 0;
		if (mobile && !landscape) {
			$dlg.css({ maxWidth: "", width: "" });
			return;
		}
		const maxW = Math.min(landscape ? 1120 : 1140, Math.round(vw * 0.96));
		$dlg.css({ maxWidth: `${maxW}px`, width: `${maxW}px` });
	}

	update_payment_shell_layout(dialog) {
		const $shell = dialog?.$wrapper?.find(".imogi-pay-shell");
		if (!$shell?.length) return;
		const dialogW =
			dialog.$wrapper.find(".modal-dialog").outerWidth() ||
			window.innerWidth ||
			0;
		const landscape = this.is_landscape_layout();
		const useSplit =
			(landscape && dialogW >= 720) || (!landscape && dialogW >= 1120);
		$shell.toggleClass("imogi-pay-shell--split", useSplit);
	}

	finalize_payment_dialog_layout(dialog) {
		this.apply_payment_modal_dimensions(dialog);
		this.update_payment_shell_layout(dialog);
		requestAnimationFrame(() => {
			this.apply_payment_modal_dimensions(dialog);
			this.update_payment_shell_layout(dialog);
		});
	}

	setup_payment_footer(dialog, subtotal) {
		const $footer = dialog.$wrapper.find(".modal-footer");
		if ($footer.find(".imogi-pay-footer-strip").length) return;
		const total = this.get_payment_total(dialog, subtotal);
		$footer.prepend(`<div class="imogi-pay-footer-strip">
			<span class="imogi-pay-footer-label">${__("Total transaksi")}</span>
			<span class="imogi-pay-footer-amount">${format_currency(total)}</span>
		</div>`);
	}

	setup_payment_header(dialog) {
		dialog.$wrapper.find(".modal-title").html(
			`<span class="imogi-pay-title-main">${__("Pembayaran")}</span>
			<span class="imogi-pay-title-sub">${__("Pilih metode pembayaran dan selesaikan transaksi")}</span>`
		);
	}

	setup_payment_layout(dialog) {
		const $wrap = dialog.$wrapper;
		const $paid = dialog.fields_dict.paid_amount?.$wrapper;
		const $slot = $wrap.find(".imogi-pay-cash-received-slot");
		if ($paid?.length && $slot.length && !$slot.find("[data-fieldname='paid_amount']").length) {
			$slot.append(
				`<div class="imogi-pay-cash-label">${__("Uang Diterima")}</div>`
			);
			$slot.append($paid);
		}
	}

	is_landscape_layout() {
		return window.matchMedia("(orientation: landscape)").matches;
	}

	sync_payment_dialog_layout(dialog) {
		if (!dialog?.$wrapper) return;
		const mobile = this.is_mobile_layout();
		const landscape = this.is_landscape_layout();
		dialog.$wrapper.toggleClass("imogi-pay-mobile", mobile && !landscape);
		dialog.$wrapper.toggleClass("imogi-pay-landscape", landscape);
		this.finalize_payment_dialog_layout(dialog);
	}

	open_payment_dialog() {
		if (!this.cart.length || this.busy) return;
		this.close_mobile_cart();
		if (this.enable_pos_shift && this.requires_shift_workflow && !this.pos_opening) {
			frappe.msgprint(__("Buka shift kasir dulu sebelum checkout."));
			this.prompt_open_shift();
			return;
		}
		this.payment_preview = null;
		const subtotal = this.get_cart_subtotal();
		const modes = (this.context.payment_modes || []).map((m) => m.mode_of_payment);
		const default_mode = this.context.default_payment_mode || modes[0];
		const me = this;

		const dialog = new frappe.ui.Dialog({
			title: __("Pembayaran"),
			size: "extra-large",
			fields: [
				{
					fieldtype: "HTML",
					fieldname: "pay_summary_html",
					options: me.build_pay_summary_html(subtotal),
				},
				{
					fieldtype: "HTML",
					fieldname: "payment_modes_html",
					options: me.build_payment_modes_html(default_mode),
				},
				{
					fieldname: "mode_of_payment",
					fieldtype: "Data",
					hidden: 1,
					default: default_mode,
				},
				{
					fieldtype: "HTML",
					fieldname: "discount_html",
					options: `<div class="imogi-pay-discount-wrap">
						<button type="button" class="imogi-pay-discount-toggle">
							<span class="imogi-pay-section-icon"><i class="fa fa-tag"></i></span>
							<span class="imogi-pay-section-text">
								<strong>${__("Diskon Manual")}</strong>
								<small>${__("Opsional — untuk kasir")}</small>
							</span>
							<i class="fa fa-chevron-down imogi-pay-section-chevron"></i>
						</button>
						<div class="imogi-pay-discount-panel">
							<div class="imogi-pay-discount-row">
								<select class="form-control input-sm imogi-pay-discount-type">
									<option value="">${__("Tanpa diskon")}</option>
									<option value="Percent">${__("Diskon %")}</option>
									<option value="Amount">${__("Diskon Rp")}</option>
								</select>
								<input type="number" min="0" step="any" inputmode="decimal" class="form-control input-sm imogi-pay-discount-value" placeholder="0" />
							</div>
						</div>
					</div>`,
				},
				...(me.context.loyalty_enabled &&
				imogi_pos.loyalty &&
				(me.feature_allowed("point_reward") || me.feature_allowed("voucher"))
					? [
							{
								fieldtype: "HTML",
								fieldname: "promo_html",
								options: imogi_pos.loyalty.build_promo_html(),
							},
					  ]
					: []),
				{
					fieldname: "paid_amount",
					fieldtype: "Currency",
					label: __("Uang Diterima"),
					default: subtotal,
					hidden: !me.is_cash_mode(default_mode),
				},
				{
					fieldtype: "HTML",
					fieldname: "change_html",
					options: `<div class="imogi-pay-checkout-block imogi-pay-cash-section" style="display:none;">
						<div class="imogi-pay-section-head"><i class="fa fa-money"></i> ${__("Uang Tunai")}</div>
						<div class="imogi-pay-cash-grid">
							<div class="imogi-pay-cash-col imogi-pay-cash-received-slot"></div>
							<div class="imogi-pay-cash-col">
								<div class="imogi-pay-cash-label">${__("Kembalian")}</div>
								<div class="imogi-pay-change-box is-neutral"><span class="imogi-pay-change-value">${format_currency(0)}</span></div>
							</div>
						</div>
					</div>
					<div class="imogi-pay-noncash-hint" style="display:none;">
						<i class="fa fa-check-circle"></i>
						<span>${__("Konfirmasi metode pembayaran lalu tekan tombol bayar di bawah.")}</span>
					</div>`,
				},
			],
			primary_action_label: __("Bayar Sekarang"),
			primary_action: (values) => {
				if (me.busy) return;
				const total = me.get_payment_total(dialog, subtotal);
				const discount_state = me.get_payment_discount_state(dialog);
				me.discount_type = discount_state.type;
				me.discount_value = discount_state.value;
				if (me.context.loyalty_enabled && imogi_pos.loyalty) {
					const promo = imogi_pos.loyalty.get_promo_state(dialog);
					if (promo.voucher_code && !me.require_feature("voucher")) return;
					if (promo.loyalty_points_redeem && !me.require_feature("point_reward")) return;
					me.voucher_code = promo.voucher_code;
					me.loyalty_points_redeem = promo.loyalty_points_redeem;
				}
				if (
					me.context.payment_gateway_enabled &&
					typeof imogi_pos !== "undefined" &&
					imogi_pos.qris &&
					imogi_pos.qris.is_qris_mode(me, values.mode_of_payment)
				) {
					if (!me.require_feature("qris")) return;
					dialog.hide();
					imogi_pos.qris.open_dialog(me, {
						items: me.cart.map((row) => ({
							item_code: row.item_code,
							qty: row.qty,
							rate: row.rate,
							uom: row.uom || undefined,
						})),
						total,
						mode_of_payment: values.mode_of_payment,
						discount_type: me.discount_type,
						discount_value: me.discount_value,
						voucher_code: me.voucher_code,
						loyalty_points_redeem: me.loyalty_points_redeem,
						on_success: (order) => {
							me.show_success(order || {}, {
								change: 0,
								paid_amount: total,
								mode_of_payment: values.mode_of_payment,
								breakdown: me.get_checkout_breakdown(dialog, subtotal),
							});
							me.refresh_sales_target();
						},
					});
					return;
				}
				if (me.is_cash_mode(values.mode_of_payment)) {
					const paid = flt(values.paid_amount);
					if (paid < total) {
						frappe.msgprint(__("Uang diterima kurang dari total"));
						return;
					}
				}
				me.checkout(dialog, values.mode_of_payment, total, flt(values.paid_amount));
			},
		});

		dialog.$wrapper.addClass("imogi-pay-dialog");
		this.sync_payment_dialog_layout(dialog);
		if (!dialog._imogi_pay_layout_bound) {
			dialog._imogi_pay_layout_bound = true;
			const on_layout = () => this.sync_payment_dialog_layout(dialog);
			dialog._imogi_pay_layout_on_resize = on_layout;
			window.addEventListener("resize", on_layout);
			window.addEventListener("orientationchange", on_layout);
			dialog.$wrapper.on("hide.bs.modal", () => {
				window.removeEventListener("resize", on_layout);
				window.removeEventListener("orientationchange", on_layout);
				dialog._imogi_pay_layout_bound = false;
			});
		}

		dialog.$wrapper.on("click", ".imogi-pay-quick-btn", function () {
			if ($(this).prop("disabled") || $(this).hasClass("is-disabled")) return;
			const amount = flt($(this).data("amount"));
			if (typeof dialog._imogi_set_paid_amount === "function") {
				dialog._imogi_set_paid_amount(amount);
			} else {
				dialog.set_value("paid_amount", amount);
			}
			me.update_change_display(dialog, me.get_payment_total(dialog, subtotal));
		});

		dialog.fields_dict.paid_amount?.$input?.on("input change", () => {
			me.update_change_display(dialog, me.get_payment_total(dialog, subtotal));
		});

		dialog.show();
		this.setup_payment_shell(dialog);
		this.setup_payment_header(dialog);
		this.setup_payment_layout(dialog);
		this.setup_payment_footer(dialog, subtotal);
		this.setup_payment_mode_cards(dialog, subtotal);
		this.setup_payment_discount_ui(dialog, subtotal);
		if (
			this.context.loyalty_enabled &&
			imogi_pos.loyalty &&
			(this.feature_allowed("point_reward") || this.feature_allowed("voucher"))
		) {
			imogi_pos.loyalty.setup_payment_ui(this, dialog, subtotal);
		}
		this.setup_mobile_pay_numpad(dialog, subtotal);
		this.toggle_cash_fields(dialog, subtotal);
		if (this.needs_checkout_preview()) {
			this.refresh_payment_preview(dialog, subtotal);
		} else {
			this.refresh_payment_dialog(dialog, subtotal);
		}
		this.finalize_mobile_pay_dialog(dialog);
		this.finalize_payment_dialog_layout(dialog);
		this.toggle_cash_fields(dialog, subtotal);
	}

	toggle_cash_fields(dialog, subtotal) {
		const mode = dialog.get_value("mode_of_payment");
		const is_cash = this.is_cash_mode(mode);
		const is_qris =
			this.context.payment_gateway_enabled &&
			imogi_pos.qris &&
			imogi_pos.qris.is_qris_mode(this, mode);
		const total = this.get_payment_total(dialog, subtotal);
		dialog.toggle_field("paid_amount", is_cash);
		const $wrap = dialog.$wrapper;
		$wrap.toggleClass("imogi-pay-cash-mode", is_cash);
		$wrap.toggleClass("imogi-pay-qris-mode", !!is_qris);
		$wrap.find(".imogi-pay-cash-section").toggle(is_cash);
		$wrap.find(".imogi-pay-numpad-wrap").toggleClass("is-visible", is_cash && this.is_mobile_layout());
		if (is_cash) {
			this.ensure_cash_quick_ui(dialog);
			this.render_cash_quick_buttons(dialog, total);
		}
		$wrap.find(".imogi-pay-qris-hint").toggle(!!is_qris);
		$wrap.find(".imogi-pay-noncash-hint").toggle(!is_cash && !is_qris);
		if (is_cash) {
			if (!flt(dialog.get_value("paid_amount"))) {
				if (typeof dialog._imogi_set_paid_amount === "function") {
					dialog._imogi_set_paid_amount(total);
				} else {
					dialog.set_value("paid_amount", total);
				}
			}
			this.update_change_display(dialog, total);
		}
	}

	update_change_display(dialog, total) {
		const paid = flt(dialog.get_value("paid_amount"));
		const change = paid - total;
		const $box = dialog.$wrapper.find(".imogi-pay-change-box");
		const display_change = Math.max(change, 0);
		$box.html(`<span class="imogi-pay-change-value">${format_currency(display_change)}</span>`);
		$box.removeClass("is-short is-ok is-neutral");
		if (paid < total) {
			$box.addClass("is-short");
		} else if (change > 0) {
			$box.addClass("is-ok");
		} else {
			$box.addClass("is-neutral");
		}
	}

	checkout(dialog, mode_of_payment, total, paid_amount) {
		this.busy = true;
		this.update_mobile_dock();
		dialog.get_primary_btn().prop("disabled", true);

		const args = {
			items: JSON.stringify(
				this.cart.map((row) => ({
					item_code: row.item_code,
					qty: row.qty,
					rate: row.rate,
					uom: row.uom || undefined,
				}))
			),
			payments: JSON.stringify([{ mode_of_payment, amount: total }]),
			...this.branch_api_args(),
		};
		if (this.selected_customer) args.customer = this.selected_customer;
		if (this.discount_type) {
			args.discount_type = this.discount_type;
			args.discount_value = this.discount_value;
		}
		if (this.voucher_code) args.voucher_code = this.voucher_code;
		if (this.loyalty_points_redeem) args.loyalty_points_redeem = this.loyalty_points_redeem;
		args.order_type = this.order_type || "Takeaway";
		args.total = total;
		if (this.marketplace_order_name) {
			args.marketplace_order_name = this.marketplace_order_name;
		}
		if (this.selected_table) args.restaurant_table = this.selected_table;
		if (this._pending_approval_code) args.approval_code = this._pending_approval_code;

		const checkout_breakdown = this.get_checkout_breakdown(dialog, this.get_cart_subtotal());
		const finish = (order, change) => {
			this.busy = false;
			this.update_mobile_dock();
			dialog.hide();
			this.show_success(order || {}, {
				change,
				paid_amount: flt(paid_amount),
				mode_of_payment,
				breakdown: checkout_breakdown,
			});
			this.refresh_sales_target();
			this.clear_cart_after_checkout();
			this.refresh_marketplace_badge();
		};

		if (
			imogi_pos.offline &&
			imogi_pos.offline.can_checkout_offline(this, mode_of_payment)
		) {
			imogi_pos.offline
				.handle_checkout(this, args, (order) => finish(order, 0))
				.finally(() => {
					this.busy = false;
					this.update_mobile_dock();
					dialog.get_primary_btn().prop("disabled", false);
				});
			return;
		}

		frappe.call({
			method: "imogi_pos.api.cashier.checkout",
			args,
			freeze: true,
			freeze_message: __("Memproses pembayaran..."),
			callback: (r) => {
				this.busy = false;
				this.update_mobile_dock();
				if (r.exc) {
					dialog.get_primary_btn().prop("disabled", false);
					const msg = (r._server_messages || "").toString();
					if (
						msg.includes("Perlu Approval") &&
						imogi_pos.cashier_extras &&
						imogi_pos.cashier_extras.prompt_supervisor_pin
					) {
						imogi_pos.cashier_extras.prompt_supervisor_pin(this, (code) => {
							this._pending_approval_code = code;
							this.checkout(dialog, mode_of_payment, total, paid_amount);
						});
						return;
					}
					if (imogi_pos.feature_upgrade) {
						imogi_pos.feature_upgrade.from_server_error(this, r.exc);
					}
					return;
				}
				this._pending_approval_code = null;
				const change =
					this.is_cash_mode(mode_of_payment) && flt(paid_amount) > total
						? flt(paid_amount) - total
						: 0;
				finish(r.message || {}, change);
			},
		});
	}

	clear_cart_after_checkout() {
		this.cart = [];
		this.marketplace_order_name = null;
		this.voucher_code = "";
		this.loyalty_points_redeem = 0;
		this.payment_preview = null;
		this.promo_discount = 0;
		this.applied_promos = [];
		this.discount_type = "";
		this.discount_value = 0;
		this.render_cart();
		this._invalidate_catalog_cache();
		this.load_items({ force: true });
		this.load_holds();
	}

	print_receipt(order, payment_info = {}) {
		if (!order || !order.name || !imogi_pos.thermal) {
			frappe.msgprint(__("Modul cetak thermal belum dimuat. Muat ulang halaman kasir."));
			return false;
		}
		const options =
			typeof imogi_pos.thermal.get_print_options === "function"
				? imogi_pos.thermal.get_print_options(this.context, payment_info)
				: {
						mode: this.context?.thermal_print_mode || "Browser",
						width: this.context?.thermal_printer_width === "80mm" ? 42 : 32,
						store_name: this.context?.receipt_store_name || this.context?.company,
						header: this.context?.receipt_header || "",
						footer: this.context?.receipt_footer || __("Terima kasih"),
						change: flt(payment_info.change),
						tax_rate: flt(this.context?.sales_tax?.rate) || 11,
				  };
		return imogi_pos.thermal.print_order(order, options);
	}

	open_receipt_print(order) {
		if (!order || !order.name) return;
		frappe.call({
			method: "imogi_pos.api.cashier.get_receipt_url",
			args: { order_name: order.name },
			callback: (r) => {
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
						message: __("Izinkan pop-up untuk situs ini, lalu klik Cetak Struk lagi."),
					});
				}
			},
		});
	}

	handle_success_action(dialog, order, payment_info, action) {
		if (action === "print") {
			this.open_receipt_print(order);
			return;
		}
		if (action === "thermal") {
			this.print_receipt(order, payment_info);
			return;
		}
		if (action === "invoice" && order.pos_invoice) {
			dialog.hide();
			frappe.set_route("Form", "POS Invoice", order.pos_invoice);
			return;
		}
		if (action === "new") {
			dialog.hide();
		}
	}

	bind_success_dialog_actions(dialog, order, payment_info) {
		const me = this;
		const $scope = dialog.$wrapper.find(".imogi-success-actions");
		$scope.off("click.imogi-success-action");
		$scope.on("click.imogi-success-action", ".imogi-success-action-btn", function (e) {
			e.preventDefault();
			e.stopPropagation();
			const action = $(this).attr("data-action");
			if (!action) return;
			me.handle_success_action(dialog, order, payment_info, action);
		});
	}

	show_success(order, payment_info = {}) {
		const breakdown = payment_info.breakdown || this.build_order_breakdown(order);
		const summary_html = this.build_success_summary_html(breakdown, payment_info);
		const stamp_html = order.stamp_reward
			? `<div class="imogi-pay-stamp-reward text-success mt-2">
					<i class="fa fa-gift"></i>
					${__("Stamp card penuh! Voucher")}: <strong>${frappe.utils.escape_html(
						order.stamp_reward.voucher_code || ""
					)}</strong>
				</div>`
			: "";

		const show_receipt = this.context && cint(this.context.enable_receipt_print) && order.name;
		const actions = [];
		if (show_receipt) {
			actions.push({ id: "print", label: __("Cetak Struk"), icon: "fa-print" });
			if (typeof imogi_pos !== "undefined" && imogi_pos.thermal) {
				actions.push({ id: "thermal", label: __("Cetak Thermal"), icon: "fa-fire" });
			}
		}
		if (order.pos_invoice) {
			actions.push({ id: "invoice", label: __("Lihat Invoice"), icon: "fa-file-text-o" });
		}
		actions.push({ id: "new", label: __("Order Baru"), icon: "fa-plus-circle", primary: true });

		const actions_html = actions
			.map(
				(action) => `<button type="button"
					class="imogi-success-action-btn${action.primary ? " is-primary" : ""}"
					data-action="${action.id}">
					<span class="imogi-success-action-icon"><i class="fa ${action.icon}"></i></span>
					<span class="imogi-success-action-label">${action.label}</span>
				</button>`
			)
			.join("");

		const dialog = new frappe.ui.Dialog({
			title: __("Transaksi Berhasil"),
			fields: [
				{
					fieldtype: "HTML",
					options: `<div class="imogi-pay-success-body">
						<div class="imogi-pay-success-icon"><i class="fa fa-check-circle"></i></div>
						<div class="imogi-pay-success-order">${frappe.utils.escape_html(order.name || "")}</div>
						${summary_html}
						${stamp_html}
						<div class="imogi-pay-success-status">${__("Status")}: ${frappe.utils.escape_html(order.status || "")}</div>
						<div class="imogi-success-actions">${actions_html}</div>
					</div>`,
				},
			],
		});

		const me = this;
		dialog.onhide = () => {
			me.clear_cart();
			if (me.selected_customer && imogi_pos.loyalty) {
				imogi_pos.loyalty.load_customer(me, me.selected_customer);
			}
			me._invalidate_catalog_cache();
			me.load_items({ force: true });
		};

		dialog.$wrapper.addClass("imogi-pay-dialog imogi-pay-success-dialog");
		if (this.is_mobile_layout()) {
			dialog.$wrapper.addClass("imogi-pay-success-mobile");
		}
		dialog.show();
		dialog.$wrapper.find(".modal-footer").hide();
		me.bind_success_dialog_actions(dialog, order, payment_info);

		if (show_receipt && imogi_pos.thermal) {
			const mode =
				typeof imogi_pos.thermal.resolve_mode === "function"
					? imogi_pos.thermal.resolve_mode(me.context.thermal_print_mode)
					: "browser";
			if (mode === "browser") {
				setTimeout(() => {
					try {
						me.print_receipt(order, payment_info);
					} catch (err) {
						console.error(err);
					}
				}, 600);
			}
		}
	}
};
