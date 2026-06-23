frappe.provide("imogi_pos");

function imogi_pos_clear_cashier_overlays() {
	try {
		frappe.dom.unfreeze();
	} catch (e) {
		/* ignore */
	}
	document.body.classList.remove("imogi-variant-open");
	document.querySelectorAll(".imogi-variant-overlay").forEach((el) => el.remove());
}

frappe.pages["imogi-pos-cashier"].on_page_load = function (wrapper) {
	imogi_pos_clear_cashier_overlays();
	document.body.classList.add("imogi-cashier-active");
	inject_cashier_css();
	imogi_pos_paint_cashier_canvas();
	imogi_pos.sync_desk_theme?.();
	imogi_pos_paint_cashier_canvas();

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
	document.body.classList.add("imogi-cashier-active");
	$(wrapper).find(".layout-main-section-wrapper").css("max-width", "100%");
	$(wrapper).find(".page-head").hide();
	wrapper.cashier_page = new imogi_pos.CashierPage(page);
	imogi_pos.active_cashier = wrapper.cashier_page;
	imogi_pos.cashier_extras?.patch?.();
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

	// Jangan pakai query string di path — frappe.assets.extn() akan error dan freeze overlay abu-abu.
	frappe.require("/assets/imogi_pos/css/imogi_pos_cashier_cards.css", () => {
		inject_cashier_css();
		imogi_pos_paint_cashier_canvas?.();
		imogi_pos.ensure_variant_modal_css?.();
	});
};

frappe.pages["imogi-pos-cashier"].on_page_show = function (wrapper) {
	imogi_pos_clear_cashier_overlays();
	document.body.classList.add("imogi-cashier-active");
	imogi_pos_paint_cashier_canvas();
	imogi_pos.sync_desk_theme?.();
	imogi_pos_paint_cashier_canvas();
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

function imogi_apply_shift_bar_theme($header, $actions) {
	if (!$header || !$header.length) {
		return;
	}

	const mobile = window.matchMedia("(max-width: 992px)").matches;
	const $action_bar = $actions?.length ? $actions : $header.find(".imogi-cashier-shift-actions");

	const style_header_actions = () => {
		$action_bar.find(".imogi-cashier-close-shift-btn, .imogi-cashier-logout-btn, .imogi-cashier-history-btn").css({
			background: "rgba(255, 255, 255, 0.08)",
			border: "1px solid rgba(255, 255, 255, 0.28)",
			borderRadius: "8px",
			color: "#fff",
			fontSize: mobile ? "11px" : "12px",
			fontWeight: "700",
			padding: mobile ? "4px 10px" : "5px 12px",
		});

		$action_bar.find(".imogi-cashier-open-shift-btn, .imogi-cashier-btn-primary").css({
			background: "#fff",
			border: "1px solid #fff",
			borderRadius: "8px",
			color: "#0f1f35",
			fontWeight: "700",
		});
	};

	$header.find(".imogi-cashier-shift-text").css({
		color: "rgba(255, 255, 255, 0.92)",
		fontSize: mobile ? "11px" : "12px",
		fontWeight: "600",
	});

	$header.find(".imogi-cashier-shift-text .fa-circle").css({
		color: "#22c55e",
	});

	$header.find(".imogi-cashier-shift-text .imogi-cashier-shift-live").css({
		display: "inline-block",
	});

	$header.find(".imogi-cashier-shift-text a").css({
		color: "#fff",
		fontWeight: "700",
		textDecoration: "none",
	});

	style_header_actions();
}

function imogi_pos_paint_cashier_canvas() {
	if (!document.body.classList.contains("imogi-cashier-active") && !document.querySelector(".imogi-cashier-page")) {
		return;
	}
	document.body.classList.add("imogi-cashier-active");
	const paint = (el) => {
		if (!el) return;
		el.style.setProperty("background", "#fff", "important");
		el.style.setProperty("background-color", "#fff", "important");
		el.style.setProperty("background-image", "none", "important");
		el.style.setProperty("background-attachment", "scroll", "important");
	};
	paint(document.body);
	paint(document.documentElement);
	document
		.querySelectorAll(
			".layout-main, .layout-main-section-wrapper, .layout-main-section, .page-body, .page-container, .main-section, .container, .content.page-container, .imogi-cashier-page, .imogi-cashier-root, .imogi-cashier-shell"
		)
		.forEach(paint);
}
imogi_pos.paint_cashier_canvas = imogi_pos_paint_cashier_canvas;

function imogi_cashier_logo_url() {
	return (
		frappe.boot?.imogi_pos_logo_white_url ||
		"/assets/imogi_pos/images/imogi-pos-logo-white.png"
	);
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
	document.getElementById("imogi-cashier-inline-css-v50")?.remove();
	document.getElementById("imogi-cashier-inline-css-v51")?.remove();
	document.getElementById("imogi-cashier-inline-css-v55")?.remove();
	document.getElementById("imogi-cashier-inline-css-v60")?.remove();
	document.getElementById("imogi-cashier-inline-css-v63")?.remove();
	document.getElementById("imogi-cashier-inline-css-v64")?.remove();
	document.getElementById("imogi-cashier-inline-css-v65")?.remove();
	document.getElementById("imogi-cashier-inline-css-v66")?.remove();
	document.getElementById("imogi-cashier-inline-css-v67")?.remove();
	document.getElementById("imogi-cashier-inline-css-v68")?.remove();
	document.getElementById("imogi-cashier-inline-css-v69")?.remove();
	frappe.dom.set_style(`
		body.imogi-cashier-active,
		body.imogi-pos-themed.imogi-cashier-active,
		body.imogi-pos-themed:has(.imogi-cashier-page) {
			background: #fff !important;
			background-attachment: scroll !important;
			background-image: none !important;
		}
		body.imogi-pos-cashier-fullscreen,
		body.imogi-pos-themed.imogi-pos-cashier-fullscreen {
			background: #fff !important;
			background-image: none !important;
		}
		body.imogi-pos-cashier-fullscreen .page-container,
		body.imogi-pos-cashier-fullscreen .container,
		body.imogi-pos-cashier-fullscreen .main-section,
		body.imogi-pos-cashier-fullscreen .layout-main,
		body.imogi-pos-cashier-fullscreen .layout-main-section-wrapper,
		body.imogi-pos-cashier-fullscreen .layout-main-section,
		body.imogi-pos-cashier-fullscreen .page-body,
		body.imogi-cashier-active .page-container,
		body.imogi-cashier-active .container,
		body.imogi-cashier-active .main-section,
		body.imogi-cashier-active .layout-main {
			background: #fff !important;
			background-image: none !important;
		}
		body.imogi-pos-cashier-fullscreen .page-container,
		body.imogi-pos-cashier-fullscreen .container,
		body.imogi-pos-cashier-fullscreen .main-section,
		body.imogi-pos-cashier-fullscreen .layout-main,
		body.imogi-pos-cashier-fullscreen .layout-main-section-wrapper,
		body.imogi-pos-cashier-fullscreen .layout-main-section,
		body.imogi-pos-cashier-fullscreen .page-body {
			margin-left: 0 !important;
			margin-right: 0 !important;
			max-width: 100% !important;
			padding-left: 0 !important;
			padding-right: 0 !important;
			width: 100% !important;
		}
		.imogi-cashier-page .layout-main-section-wrapper,
		.imogi-cashier-page .layout-main-section,
		.imogi-cashier-page .page-body { background: #fff !important; max-width: 100% !important; overflow: hidden !important; }
		body.imogi-pos-cashier-fullscreen .imogi-cashier-page.layout-main-section,
		body.imogi-pos-cashier-fullscreen .imogi-cashier-page {
			box-sizing: border-box;
			display: flex;
			flex-direction: column;
			height: 100dvh !important;
			max-height: 100dvh !important;
			min-height: 0;
			overflow: hidden !important;
			padding: 0 !important;
		}
		.imogi-cashier-page.layout-main-section,
		.imogi-cashier-page {
			box-sizing: border-box;
			display: flex;
			flex-direction: column;
			height: calc(100vh - 60px);
			height: calc(100dvh - 60px);
			max-height: calc(100vh - 60px);
			max-height: calc(100dvh - 60px);
			min-height: 0;
			overflow: hidden !important;
			padding: 0 !important;
		}
		.imogi-cashier-page .page-body,
		.imogi-cashier-root,
		body.imogi-pos-cashier-fullscreen .imogi-cashier-page .layout-main-section-wrapper,
		body.imogi-pos-cashier-fullscreen .imogi-cashier-page .page-body {
			background: #fff !important;
			display: flex;
			flex: 1;
			flex-direction: column;
			min-height: 0;
			overflow: hidden;
		}
		.imogi-cashier-header {
			align-items: center;
			background: #0b141a;
			border-bottom: 1px solid rgba(255, 255, 255, 0.06);
			display: grid;
			flex-shrink: 0;
			gap: 12px;
			grid-template-columns: auto minmax(0, 1fr) auto;
			min-height: 54px;
			padding: 10px 14px;
		}
		.imogi-cashier-brand {
			align-items: center;
			display: flex;
			flex-shrink: 0;
			gap: 10px;
			min-width: 0;
		}
		.imogi-cashier-brand-logo {
			filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.18));
			flex-shrink: 0;
			height: 30px;
			object-fit: contain;
			width: auto;
		}
		.imogi-cashier-brand-title {
			color: #fff;
			font-size: 17px;
			font-weight: 800;
			letter-spacing: 0.01em;
			line-height: 1;
			white-space: nowrap;
		}
		.imogi-cashier-header-mid {
			align-items: center;
			display: flex;
			justify-content: center;
			min-width: 0;
		}
		.imogi-cashier-shift-pill {
			align-items: center;
			background: rgba(255, 255, 255, 0.08);
			border: 1px solid rgba(255, 255, 255, 0.14);
			border-radius: 999px;
			color: rgba(255, 255, 255, 0.92);
			display: inline-flex;
			font-size: 12px;
			font-weight: 600;
			gap: 8px;
			line-height: 1.3;
			max-width: 100%;
			padding: 7px 14px;
			white-space: nowrap;
		}
		.imogi-cashier-shift-pill.is-closed { opacity: 0.92; }
		.imogi-cashier-shift-row { display: none; }
		.imogi-cashier-shift-live {
			background: #22c55e;
			border-radius: 50%;
			box-shadow: 0 0 0 3px rgba(34,197,94,.25);
			flex-shrink: 0;
			height: 8px;
			width: 8px;
		}
		.imogi-cashier-shift-text.is-closed .imogi-cashier-shift-live {
			background: #f59e0b;
			box-shadow: 0 0 0 3px rgba(245,158,11,.22);
		}
		.imogi-cashier-shift-actions {
			align-items: center;
			display: flex;
			flex-shrink: 0;
			flex-wrap: wrap;
			gap: 8px;
			justify-content: flex-end;
		}
		.imogi-cashier-top {
			display: none;
			flex-direction: column;
			flex-shrink: 0;
			gap: 6px;
			padding: 6px 10px 0;
		}
		.imogi-cashier-top .imogi-cashier-branch-row.is-visible { display: flex; }
		.imogi-cashier-shift-bar { display: none; }
		.imogi-cashier-shift-text { color: rgba(255,255,255,0.92) !important; font-size: 12px; font-weight: 600; }
		.imogi-cashier-shift-text .fa { opacity: .9; }
		.imogi-cashier-shift-text a { color: #fff !important; font-weight: 700; text-decoration: none; }
		.imogi-cashier-shift-actions .imogi-cashier-close-shift-btn,
		.imogi-cashier-shift-actions .imogi-cashier-logout-btn,
		.imogi-cashier-shift-actions .imogi-cashier-history-btn {
			background: rgba(255,255,255,0.08) !important;
			border: 1px solid rgba(255,255,255,0.28) !important;
			border-radius: 8px !important;
			color: #fff !important;
			font-weight: 700 !important;
		}
		.imogi-cashier-shift-actions .imogi-cashier-logout-btn .fa,
		.imogi-cashier-shift-actions .imogi-cashier-history-btn .fa { margin-right: 4px; opacity: .85; }
		.imogi-cashier-shell {
			background: #fff !important;
			box-sizing: border-box;
			display: grid;
			flex: 1;
			gap: 8px 10px;
			grid-template-columns: minmax(0, 1fr) 360px;
			grid-template-rows: auto minmax(0, 1fr);
			min-height: 0;
			overflow: hidden;
			padding: 10px;
			width: 100%;
		}
		.imogi-cashier-status-strip {
			align-items: center;
			align-self: start;
			display: none;
			flex-wrap: wrap;
			gap: 8px;
			grid-column: 1 / -1;
			grid-row: 1;
			min-height: 0;
		}
		.imogi-cashier-status-strip.is-visible { display: flex; }
		.imogi-status-chip { align-items: center; background: #fff; border: 1px solid #d1fae5; border-radius: 999px; color: #047857; cursor: pointer; display: none; font-size: 11px; font-weight: 700; gap: 6px; line-height: 1; padding: 6px 12px; }
		.imogi-status-chip.is-visible { display: inline-flex; }
		.imogi-status-chip .fa { font-size: 11px; opacity: .9; }
		.imogi-chip-target.is-behind { background: #fff1f2; border-color: #fecdd3; color: #be123c; }
		.imogi-chip-target.is-achieved { background: #ecfdf5; border-color: #6ee7b7; color: #047857; }
		.imogi-chip-marketplace.has-orders { background: #ecfdf5; border-color: #6ee7b7; color: #047857; }
		.imogi-chip-offline.has-pending { background: #fff7ed; border-color: #fdba74; color: #9a3412; }
		.imogi-cashier-panel.imogi-cashier-products {
			grid-column: 1;
			grid-row: 2;
			display: flex;
			flex-direction: column;
			min-height: 0;
			overflow: hidden;
		}
		.imogi-cashier-panel.imogi-cashier-cart {
			grid-column: 2;
			grid-row: 2;
			min-height: 0;
		}
		.imogi-cashier-shell:not(:has(.imogi-cashier-status-strip.is-visible)) .imogi-cashier-panel.imogi-cashier-products,
		.imogi-cashier-shell:not(:has(.imogi-cashier-status-strip.is-visible)) .imogi-cashier-panel.imogi-cashier-cart {
			grid-row: 2;
		}
		.imogi-cashier-main-col { display: contents; }
		.imogi-cashier-mobile-backdrop, .imogi-cashier-mobile-dock { display: none; }
		.imogi-cashier-mobile-checkout { display: none; }
		.imogi-cashier-cart-scroll { display: contents; }
		.imogi-cashier-cart-mobile-head, .imogi-cashier-cart-close { display: none; }
		@media (max-width: 992px) {
			.imogi-cashier-page.layout-main-section,
			.imogi-cashier-page { padding: 0 !important; }
			.imogi-cashier-header { gap: 8px; min-height: 48px; padding: 8px 10px; }
			.imogi-cashier-brand-logo { height: 26px; }
			.imogi-cashier-brand-title { font-size: 15px; }
			.imogi-cashier-top { gap: 4px; padding: 4px 6px 0; }
			.imogi-cashier-shell { padding: 0 6px 6px; }
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
			.imogi-cashier-cart-close:hover,
			.imogi-cashier-cart-close:active,
			.imogi-cashier-cart-close:focus {
				background: rgba(255,255,255,0.22) !important;
				border-color: rgba(255,255,255,0.34) !important;
				color: #fff !important;
				transform: translateY(-50%) !important;
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
		.imogi-cashier-panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 1px 3px rgba(15, 31, 53, 0.05); display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
		.imogi-cashier-main-col .imogi-cashier-panel.imogi-cashier-products,
		.imogi-cashier-panel.imogi-cashier-products { flex: 1; }
		.imogi-cashier-panel-head { align-items: center; background: linear-gradient(145deg, #0f1f35 0%, #1a3352 100%); border-bottom: 1px solid rgba(255,255,255,0.1); box-sizing: border-box; display: flex; flex-shrink: 0; gap: 10px; justify-content: space-between; min-height: 46px; padding: 10px 14px; }
		.imogi-cashier-panel > .imogi-cashier-panel-head { min-height: 46px; }
		.imogi-cashier-panel-head h5 { align-items: center; color: #fff; display: flex; font-size: 15px; font-weight: 800; gap: 8px; margin: 0; white-space: nowrap; }
		.imogi-cashier-head-icon { color: rgba(255,255,255,0.72); font-size: 14px; }
		.imogi-cashier-cart-head-actions { display: flex; flex-shrink: 0; gap: 6px; }
		.imogi-cashier-panel-head .imogi-cashier-hold-btn,
		.imogi-cashier-panel-head .imogi-cart-clear {
			background: rgba(255,255,255,0.1) !important;
			border: 1px solid rgba(255,255,255,0.28) !important;
			border-radius: 8px !important;
			color: #fff !important;
			font-size: 11px !important;
			font-weight: 700;
			padding: 5px 10px !important;
			white-space: nowrap;
		}
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
		.imogi-cashier-toolbar { background: #fff; border-bottom: 1px solid #e8edf2; flex-shrink: 0; padding: 12px; }
		.imogi-cashier-search-wrap { position: relative; }
		.imogi-cashier-search-icon { color: #94a3b8; font-size: 14px; left: 14px; pointer-events: none; position: absolute; top: 50%; transform: translateY(-50%); z-index: 1; }
		.imogi-cashier-search { background: #fff !important; border: 1px solid #e2e8f0 !important; border-radius: 10px !important; box-shadow: none !important; font-size: 14px !important; padding: 11px 14px 11px 40px !important; }
		.imogi-cashier-search:focus { background: #fff !important; border-color: #0f1f35 !important; box-shadow: 0 0 0 3px rgba(15,31,53,.08) !important; }
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
		.imogi-cashier-panel.imogi-cashier-products { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
		.imogi-cashier-panel.imogi-cashier-products .imogi-cashier-toolbar { flex-shrink: 0; }
		.imogi-cashier-panel.imogi-cashier-products .imogi-pos-catalog-scroll { flex: 1 1 auto; min-height: 0; overflow-x: hidden; overflow-y: auto; -webkit-overflow-scrolling: touch; }
		.imogi-cashier-panel.imogi-cashier-cart { display: flex; flex-direction: column; height: 100%; max-height: 100%; min-height: 0; overflow: hidden; }
		.imogi-cashier-cart-items { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 120px; overflow-x: hidden; overflow-y: auto; padding: 0; text-align: left; -webkit-overflow-scrolling: touch; }
		.imogi-pos-card-add { display: none; }
		.imogi-cashier-loading, .imogi-cashier-empty { align-items: center; color: #94a3b8; display: flex; flex-direction: column; gap: 10px; grid-column: 1/-1; justify-content: center; min-height: 220px; }
		.imogi-cashier-cart-empty { align-items: center; color: #94a3b8; display: flex; flex: 1; flex-direction: column; font-size: 13px; justify-content: center; min-height: 220px; padding: 32px 20px; text-align: center; }
		.imogi-cashier-cart-empty-icon { align-items: center; background: #f1f5f9; border-radius: 999px; color: #cbd5e1; display: inline-flex; font-size: 24px; height: 68px; justify-content: center; margin-bottom: 14px; width: 68px; }
		.imogi-cashier-cart-empty p { margin: 0; max-width: 220px; }
		.imogi-cart-row { border-bottom: 1px solid #f1f5f9; box-sizing: border-box; display: flex; flex-direction: column; gap: 8px; padding: 14px; width: 100%; }
		.imogi-cart-row-line { align-items: flex-start; display: flex; gap: 10px; justify-content: space-between; min-width: 0; width: 100%; }
		.imogi-cart-row-name { color: #0f172a; flex: 1; font-size: 14px; font-weight: 700; line-height: 1.35; min-width: 0; text-align: left; word-break: break-word; }
		.imogi-cart-row-amount { color: #0f1f35; flex-shrink: 0; font-size: 15px; font-variant-numeric: tabular-nums; font-weight: 800; line-height: 1.35; text-align: right; white-space: nowrap; }
		.imogi-cart-row-actions { align-items: center; display: flex; gap: 10px; justify-content: space-between; min-width: 0; width: 100%; }
		.imogi-cart-row-meta { color: #94a3b8; flex: 1; font-size: 12px; line-height: 1.2; min-width: 0; text-align: right; }
		.imogi-cart-qty-group { align-items: center; background: #f8fafc; border: 1px solid #e4e4e7; border-radius: 10px; box-sizing: border-box; display: inline-flex; flex-shrink: 0; gap: 0; justify-content: space-between; padding: 2px; width: 112px; }
		.imogi-qty-btn { align-items: center; background: transparent; border: none; border-radius: 8px; color: #0f1f35; cursor: pointer; display: inline-flex; flex-shrink: 0; font-size: 18px; font-weight: 700; height: 36px; justify-content: center; line-height: 1; padding: 0; width: 36px; }
		.imogi-cart-qty { align-items: center; color: #0f172a; display: inline-flex; flex: 1; font-size: 15px; font-variant-numeric: tabular-nums; font-weight: 800; justify-content: center; line-height: 1; min-width: 0; text-align: center; }
		.imogi-cashier-cart-foot { background: #fff; border-top: 1px solid #e8edf2; flex-shrink: 0; padding: 12px 14px calc(12px + env(safe-area-inset-bottom, 0px)); }
		.imogi-cashier-order-type-row { margin-bottom: 8px; }
		.imogi-cashier-order-type-label { color: #52525b; font-size: 10px; font-weight: 800; letter-spacing: .04em; margin-bottom: 6px; text-transform: uppercase; }
		.imogi-cashier-order-types { display: grid; gap: 5px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
		.imogi-cashier-order-type-btn { align-items: center; background: #fff; border: 1px solid #d4d4d8; border-radius: 8px; color: #71717a; cursor: pointer; display: flex; flex-direction: row; font-size: 10px; font-weight: 700; gap: 4px; justify-content: center; line-height: 1.1; min-height: 34px; padding: 6px 4px; text-align: center; }
		.imogi-cashier-order-type-btn .fa { font-size: 12px; }
		.imogi-cashier-order-type-btn.is-active { background: #0f1f35; border-color: #0f1f35; color: #fff; }
		.imogi-cashier-customer-row { align-items: center; display: flex; gap: 8px; margin-bottom: 8px; position: relative; }
		.imogi-cashier-customer-icon { color: #94a3b8; flex-shrink: 0; font-size: 14px; left: 12px; position: absolute; z-index: 1; }
		.imogi-cashier-customer-row input { flex: 1; min-width: 0; padding-left: 34px !important; width: 100%; }
		.imogi-cashier-customer-row input, .imogi-cashier-discount-row select, .imogi-cashier-discount-row input { font-size: 12px !important; }
		.imogi-cashier-subtotal-row { align-items: baseline; color: #64748b; display: flex; font-size: 13px; justify-content: space-between; margin-bottom: 6px; }
		.imogi-cashier-total-row { align-items: baseline; display: flex; justify-content: space-between; margin-bottom: 10px; }
		.imogi-cashier-total-row span { color: #71717a; font-size: 13px; font-weight: 600; }
		.imogi-cart-total { color: #0f1f35 !important; font-size: 22px !important; font-weight: 800 !important; }
		.imogi-cashier-pay { background: #0f1f35 !important; border: none !important; border-radius: 10px !important; box-shadow: none !important; color: #fff !important; font-size: 15px !important; font-weight: 800 !important; padding: 13px !important; width: 100%; }
		.imogi-cashier-pay:focus { background: #1a3352 !important; color: #fff !important; }
		.imogi-cashier-pay:disabled { background: #e5e7eb !important; color: #9ca3af !important; opacity: 1 !important; }
		.imogi-pay-change-box { align-items: center; background: var(--imogi-pay-surface-2, #f4f4f5); border: 2px solid var(--imogi-pay-border, #e4e4e7); border-radius: 12px; color: var(--imogi-navy-800, #0f1f35); display: flex; font-size: 26px; font-variant-numeric: tabular-nums; font-weight: 800; justify-content: center; min-height: 72px; padding: 12px; text-align: center; transition: background .15s, border-color .15s, color .15s; }
		.imogi-pay-change-box.is-ok { background: #f0fdf4; border-color: #86efac; color: #166534; }
		.imogi-pay-change-box.is-short { background: #fef2f2; border-color: #fca5a5; color: #b91c1c; }
		.imogi-pay-detail-slot { display: flex; flex: 1; flex-direction: column; margin-bottom: 0; min-height: 180px; }
		.imogi-pay-dialog .frappe-control[data-fieldname="cash_quick_html"] { flex: 1 1 auto; margin: 0 0 12px !important; min-height: 180px; width: 100% !important; }
		.imogi-pay-detail-slot .imogi-pay-cash-quick,
		.imogi-pay-detail-slot .imogi-pay-qris-panel,
		.imogi-pay-detail-slot .imogi-pay-transfer-panel { display: none; flex: 1; min-height: 0; }
		.imogi-pay-detail-slot .imogi-pay-cash-quick { flex-direction: column; }
		.imogi-pay-detail-slot .imogi-pay-qris-panel { align-items: center; flex-direction: column; justify-content: flex-start; text-align: center; }
		.imogi-pay-detail-slot .imogi-pay-transfer-panel { flex-direction: column; }
		.imogi-pay-transfer-card { background: #f8fafc; border: 1px solid var(--imogi-pay-border, #e4e4e7); border-radius: 12px; display: flex; flex: 1; flex-direction: column; gap: 10px; margin-top: 12px; padding: 16px 14px; }
		.imogi-pay-transfer-row { align-items: flex-start; display: flex; gap: 10px; justify-content: space-between; }
		.imogi-pay-transfer-row span { color: #71717a; font-size: 12px; font-weight: 600; }
		.imogi-pay-transfer-row strong { color: var(--imogi-navy-800, #0f1f35); font-size: 15px; font-variant-numeric: tabular-nums; font-weight: 800; text-align: right; }
		.imogi-pay-transfer-amount { background: #fff; border: 1px dashed #bfdbfe; border-radius: 10px; color: #1d4ed8; font-size: 22px; font-variant-numeric: tabular-nums; font-weight: 800; margin-top: 4px; padding: 12px; text-align: center; }
		.imogi-pay-transfer-copy { background: #fff; border: 1px solid var(--imogi-pay-border, #e4e4e7); border-radius: 8px; color: var(--imogi-navy-800, #0f1f35); cursor: pointer; flex-shrink: 0; font-size: 11px; font-weight: 700; padding: 6px 10px; }
		.imogi-pay-transfer-copy:hover { background: #f4f4f5; }
		.imogi-pay-transfer-hint { color: #71717a; font-size: 12px; line-height: 1.45; margin-top: 4px; }
		.imogi-pay-transfer-empty { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; color: #92400e; font-size: 13px; line-height: 1.45; margin-top: 12px; padding: 14px; text-align: center; }
		.imogi-pay-quick-row { display: grid; flex-shrink: 0; gap: 8px; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 8px; }
		.imogi-pay-quick-btn { background: #fff; border: 1px solid var(--imogi-pay-border, #e4e4e7); border-radius: 10px; color: var(--imogi-navy-800, #0f1f35); cursor: pointer; font-size: 13px; font-weight: 700; min-height: 48px; padding: 10px 8px; touch-action: manipulation; transition: background .12s, border-color .12s, color .12s; }
		.imogi-pay-quick-btn.is-selected { background: var(--imogi-navy-800, #0f1f35); border-color: var(--imogi-navy-800, #0f1f35); color: #fff; }
		.imogi-pay-quick-btn.is-disabled, .imogi-pay-quick-btn:disabled { cursor: not-allowed; opacity: 0.42; pointer-events: none; }
		.imogi-pay-quick-feedback { align-items: center; background: #f8fafc; border: 1px solid var(--imogi-pay-border, #e4e4e7); border-radius: 12px; display: flex; flex: 1; flex-wrap: wrap; gap: 10px 18px; justify-content: space-between; margin-top: 12px; min-height: 76px; padding: 16px 14px; }
		.imogi-pay-quick-feedback span { color: #71717a; font-size: 12px; font-weight: 600; }
		.imogi-pay-quick-feedback strong { color: var(--imogi-navy-800, #0f1f35); font-size: 17px; font-variant-numeric: tabular-nums; font-weight: 800; }
		.imogi-pay-qris-panel { margin-bottom: 0; }
		.imogi-pay-qris-inline-status { color: #52525b; font-size: 13px; font-weight: 600; margin: 4px 0 8px; }
		.imogi-pay-qris-inline-image { align-items: center; display: flex; justify-content: center; min-height: 148px; padding: 4px 0 8px; width: 100%; }
		.imogi-pay-qris-inline-image img, .imogi-pay-qris-inline-image canvas { display: block; height: auto !important; max-height: 180px !important; max-width: 180px !important; width: auto !important; }
		.imogi-pay-qris-inline-hint { color: #71717a; font-size: 12px; font-weight: 500; line-height: 1.45; margin-top: 4px; max-width: 280px; }
		.imogi-pay-quick-change-val.is-ok { color: #047857; }
		.imogi-pay-quick-change-val.is-short { color: #b91c1c; }
		.imogi-pay-quick-label { color: #71717a; font-size: 11px; font-weight: 700; letter-spacing: .05em; margin-top: 14px; text-transform: uppercase; }
		.imogi-pay-manual-discount { border-top: 1px solid var(--imogi-pay-border, #e4e4e7); margin-top: 12px; padding-top: 12px; }
		.imogi-pay-manual-discount-group + .imogi-pay-manual-discount-group { margin-top: 10px; }
		.imogi-pay-manual-discount-label { color: #64748b; font-size: 11px; font-weight: 700; letter-spacing: .04em; margin-bottom: 6px; text-transform: uppercase; }
		.imogi-pay-manual-discount-row { display: grid; gap: 6px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
		.imogi-pay-manual-discount-btn { background: #fff; border: 1px solid var(--imogi-navy-800, #0f1f35); border-radius: 8px; color: var(--imogi-navy-800, #0f1f35); cursor: pointer; font-size: 13px; font-weight: 800; min-height: 40px; padding: 8px 6px; touch-action: manipulation; transition: background .12s, border-color .12s, box-shadow .12s, color .12s; }
		.imogi-pay-manual-discount-btn:hover { background: #f8fafc; border-color: var(--imogi-navy-800, #0f1f35); color: var(--imogi-navy-800, #0f1f35); }
		.imogi-pay-manual-discount-btn.is-selected { background: var(--imogi-navy-800, #0f1f35); border-color: var(--imogi-navy-800, #0f1f35); box-shadow: 0 0 0 2px rgba(15, 31, 53, 0.2); color: #fff; }
		.imogi-pay-manual-discount-btn.is-disabled,
		.imogi-pay-manual-discount-btn:disabled {
			background: #f4f4f5 !important;
			border-color: #d4d4d8 !important;
			box-shadow: none !important;
			color: #a1a1aa !important;
			cursor: not-allowed !important;
			opacity: 1;
			pointer-events: none;
		}
		.imogi-pay-manual-discount.is-blocked .imogi-pay-manual-discount-label { color: #a1a1aa; }
		.imogi-pay-manual-discount-note {
			background: #fff7ed;
			border: 1px solid #fed7aa;
			border-radius: 8px;
			color: #9a3412;
			display: none;
			font-size: 11px;
			font-weight: 600;
			line-height: 1.4;
			margin-bottom: 10px;
			padding: 8px 10px;
		}
		.imogi-pay-manual-discount.is-blocked .imogi-pay-manual-discount-note { display: block; }
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
		.imogi-pay-tabs { background: #f4f4f5; border-radius: 10px; display: grid; gap: 4px; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 12px; padding: 4px; }
		.imogi-pay-tab { background: transparent; border: none; border-radius: 8px; color: #71717a; cursor: pointer; font-size: 12px; font-weight: 700; min-height: 40px; padding: 8px 10px; touch-action: manipulation; transition: background .12s, color .12s, box-shadow .12s; }
		.imogi-pay-tab:hover { color: var(--imogi-navy-800, #0f1f35); }
		.imogi-pay-tab.is-active { background: #fff; box-shadow: 0 2px 8px rgba(7,17,31,.08); color: var(--imogi-navy-800, #0f1f35); }
		.imogi-pay-tab-multi .imogi-pay-modes-wrap,
		.imogi-pay-tab-multi .imogi-pay-detail-slot { display: none !important; }
		.imogi-pay-tab-multi .imogi-pay-checkout-stack,
		.imogi-pay-tab-multi .imogi-pay-extras { display: none !important; }
		.imogi-pay-tab-multi .imogi-pay-multi-slot { display: block !important; }
		.imogi-pay-multi-slot { display: none; width: 100%; }
		.imogi-pay-multi-wrap { background: var(--imogi-pay-surface); border: 1px solid var(--imogi-pay-border); border-radius: 14px; padding: 14px 16px; }
		.imogi-pay-multi-hint { color: #64748b; font-size: 12px; line-height: 1.45; margin-bottom: 12px; }
		.imogi-pay-multi-row { align-items: center; display: flex; gap: 8px; margin-bottom: 8px; }
		.imogi-pay-multi-row select, .imogi-pay-multi-row input { flex: 1; min-width: 0; }
		.imogi-pay-multi-sum { align-items: center; background: #f8fafc; border: 1px solid var(--imogi-pay-border); border-radius: 10px; display: flex; font-size: 12px; font-weight: 700; justify-content: space-between; margin-top: 10px; padding: 10px 12px; }
		.imogi-pay-multi-sum.is-ok { background: #ecfdf5; border-color: #a7f3d0; color: #047857; }
		.imogi-pay-multi-sum.is-bad { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
		.imogi-pay-split-steps { color: #475569; font-size: 12px; line-height: 1.5; margin: 0 0 12px; padding-left: 18px; }
		.imogi-pay-tab-split .imogi-pay-checkout-stack > .frappe-control { display: none !important; }
		.imogi-pay-tab-split .imogi-pay-extras { display: none !important; }
		.imogi-pay-tab-split .imogi-pay-split-panel { display: block !important; }
		.imogi-pay-split-panel { display: none; }
		.imogi-pay-split-item { align-items: center; background: var(--imogi-pay-surface-2, #f8fafc); border: 1px solid var(--imogi-pay-border); border-radius: 10px; cursor: pointer; display: flex; font-size: 13px; font-weight: 600; gap: 10px; margin-bottom: 8px; padding: 12px 14px; }
		.imogi-pay-split-item input { flex-shrink: 0; margin: 0; }
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
		.imogi-pay-col--checkout { background: var(--imogi-pay-surface-2); display: flex; flex-direction: column; gap: 12px; min-height: 0; min-width: 0; }
		.imogi-pay-checkout-stack { display: flex; flex: 1; flex-direction: column; gap: 12px; min-width: 0; width: 100%; }
		.imogi-pay-checkout-stack > .frappe-control,
		.imogi-pay-extras > .frappe-control { margin: 0 !important; max-width: 100% !important; padding: 0 !important; width: 100% !important; }
		.imogi-pay-checkout-stack .form-group,
		.imogi-pay-extras .form-group { margin-bottom: 0 !important; width: 100%; }
		.imogi-pay-dialog .frappe-control[data-fieldname="pay_summary_html"],
		.imogi-pay-dialog .frappe-control[data-fieldname="payment_modes_html"],
		.imogi-pay-dialog .frappe-control[data-fieldname="cash_quick_html"],
		.imogi-pay-dialog .frappe-control[data-fieldname="change_html"],
		.imogi-pay-dialog .frappe-control[data-fieldname="discount_html"],
		.imogi-pay-dialog .frappe-control[data-fieldname="promo_html"] { width: 100% !important; }
		.imogi-pay-dialog .modal-footer { background: var(--imogi-pay-surface); border-top: 1px solid var(--imogi-pay-border); box-shadow: 0 -8px 32px rgba(7,17,31,.06); display: flex; flex-direction: column; flex-shrink: 0; gap: 10px; padding: 14px 20px calc(14px + env(safe-area-inset-bottom, 0px)); }
		.imogi-pay-dialog .modal-footer .btn-modal-secondary, .imogi-pay-dialog .modal-footer .btn-secondary { display: none !important; }
		.imogi-pay-dialog .modal-footer .standard-actions, .imogi-pay-dialog .modal-footer .custom-actions { margin: 0 !important; width: 100%; }
		.imogi-pay-footer-btns { align-items: stretch; display: grid; gap: 10px; grid-template-columns: minmax(120px, 1fr) minmax(0, 2fr); width: 100%; }
		.imogi-pay-void-btn {
			align-items: center; background: #fff !important; border: 2px solid #dc2626 !important; border-radius: 12px !important;
			color: #dc2626 !important; display: inline-flex !important; font-size: 14px !important; font-weight: 800 !important;
			gap: 8px; height: 52px !important; justify-content: center; width: 100%;
		}
		.imogi-pay-void-btn:hover { background: #fef2f2 !important; border-color: #b91c1c !important; color: #b91c1c !important; }
		.imogi-pay-title-order { color: #b45309; font-size: 12px; font-weight: 700; }
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
		.imogi-pay-total-strip-meta { align-items: center; display: flex; flex-wrap: wrap; gap: 8px; }
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
		.imogi-pay-dialog .frappe-control[data-fieldname="paid_amount"] { display: none !important; margin: 0 !important; }
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
		.imogi-pay-shell--split { align-items: stretch; grid-template-columns: minmax(260px, 34%) minmax(0, 1fr); min-height: min(68vh, 580px); }
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
			.modal.imogi-pay-dialog.imogi-pay-mobile .imogi-pay-footer-btns {
				grid-template-columns: 1fr;
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
		.imogi-cashier-meta { color: rgba(255,255,255,0.72); flex-shrink: 1; font-size: 11px; font-weight: 600; letter-spacing: .03em; max-width: 52%; overflow: hidden; text-overflow: ellipsis; text-transform: uppercase; white-space: nowrap; }
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
		.imogi-pay-success-dialog .modal-dialog { max-width: 460px; width: calc(100% - 24px); }
		.imogi-pay-success-dialog .modal-content { border: none; border-radius: 18px; box-shadow: 0 24px 48px rgba(15,31,53,.18); overflow: hidden; }
		.imogi-pay-success-dialog .modal-header { background: #fff; border-bottom: 1px solid #f1f5f9; padding: 14px 18px 12px; }
		.imogi-pay-success-dialog .modal-title { color: #0f1f35; font-size: 15px; font-weight: 800; }
		.imogi-pay-success-dialog .modal-body { background: #f8fafc; padding: 16px 18px 18px; }
		.imogi-pay-success-body { padding: 0 !important; text-align: center; }
		.imogi-pay-success-hero { margin-bottom: 14px; }
		.imogi-pay-success-icon-wrap { align-items: center; background: #ecfdf5; border: 2px solid #a7f3d0; border-radius: 999px; color: #059669; display: inline-flex; font-size: 28px; height: 64px; justify-content: center; margin-bottom: 10px; width: 64px; }
		.imogi-pay-success-order { color: #0f1f35; font-size: 18px; font-variant-numeric: tabular-nums; font-weight: 800; line-height: 1.2; margin-bottom: 4px; }
		.imogi-pay-success-subtitle { color: #71717a; font-size: 12px; font-weight: 600; }
		.imogi-pay-success-icon { display: none; }
		.imogi-pay-summary--success { border-radius: 14px; margin-bottom: 12px; overflow: hidden; text-align: left; }
		.imogi-pay-success-footer-meta { align-items: center; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 10px; }
		.imogi-pay-success-status-pill { background: #ecfdf5; border: 1px solid #bbf7d0; border-radius: 999px; color: #047857; display: inline-flex; font-size: 11px; font-weight: 700; padding: 5px 12px; }
		.imogi-pay-stamp-reward { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; color: #9a3412; font-size: 12px; font-weight: 600; margin-top: 0 !important; padding: 10px 12px; text-align: left; }
		.imogi-pay-stamp-reward .fa { color: #ea580c; margin-right: 6px; }
		.imogi-pay-success-payment-meta,
		.imogi-pay-success-cash-meta { border-top: 1px solid rgba(255,255,255,.12); margin-top: 10px; padding-top: 10px; }
		.imogi-pay-success-payment-meta { align-items: center; color: rgba(255,255,255,.78); display: flex; font-size: 12px; justify-content: space-between; }
		.imogi-pay-success-payment-meta strong { color: #fff; font-size: 12px; }
		.imogi-pay-success-cash-row { align-items: baseline; color: rgba(255,255,255,.78); display: flex; font-size: 12px; justify-content: space-between; margin-bottom: 4px; }
		.imogi-pay-success-cash-row strong { color: #fff; font-variant-numeric: tabular-nums; }
		.imogi-pay-success-cash-row.is-change strong { color: #bbf7d0; }
		.imogi-pay-success-dialog .modal-footer { display: none !important; }
		.imogi-success-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; padding-top: 14px; border-top: 1px solid #e4e4e7; }
		.imogi-success-actions-grid { display: grid; gap: 8px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
		.imogi-success-action-btn { align-items: center; background: #fff; border: 1px solid #e4e4e7; border-radius: 12px; color: #0f1f35; cursor: pointer; display: flex; flex-direction: column; gap: 6px; justify-content: center; min-height: 72px; padding: 10px 8px; transition: border-color .15s, background .15s, transform .1s; }
		.imogi-success-action-btn.is-primary { background: linear-gradient(135deg, #0f1f35 0%, #1a3352 100%); border-color: #0f1f35; color: #fff; flex-direction: row; gap: 10px; justify-content: center; min-height: 50px; padding: 0 16px; width: 100%; }
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
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-header {
				align-items: center;
				display: flex;
				flex-wrap: nowrap;
				gap: 8px;
				grid-template-columns: none;
				min-height: 48px;
				padding: 8px 10px;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-brand {
				flex: 1 1 auto;
				min-width: 0;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-brand-title {
				overflow: hidden;
				text-overflow: ellipsis;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-header-mid {
				display: none !important;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-shift-actions {
				flex: 0 0 auto;
				flex-wrap: nowrap;
				gap: 6px;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-header .imogi-cashier-shift-actions .btn {
				align-items: center;
				display: inline-flex;
				font-size: 0 !important;
				gap: 0;
				justify-content: center;
				min-height: 34px;
				min-width: 34px;
				padding: 0 !important;
				width: 34px;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-header .imogi-cashier-shift-actions .btn .fa {
				font-size: 14px !important;
				margin: 0 !important;
				opacity: 1;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-header .imogi-cashier-shift-actions .imogi-cashier-open-shift-btn,
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-header .imogi-cashier-shift-actions .imogi-cashier-btn-primary {
				font-size: 11px !important;
				min-width: auto;
				padding: 0 10px !important;
				width: auto;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-top .imogi-cashier-shift-row.is-visible {
				align-items: center;
				border-bottom: 1px solid #f1f5f9;
				display: flex;
				gap: 8px;
				justify-content: space-between;
				padding: 10px 12px;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-top .imogi-cashier-shift-row .imogi-cashier-shift-text,
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-top .imogi-cashier-shift-row .imogi-cashier-shift-pill {
				align-items: center;
				background: transparent !important;
				border: none !important;
				box-shadow: none !important;
				color: #3f3f46 !important;
				display: inline-flex;
				flex: 1;
				font-size: 12px !important;
				font-weight: 700;
				gap: 8px;
				margin: 0;
				min-width: 0;
				overflow: hidden;
				padding: 0 !important;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-top .imogi-cashier-shift-row .imogi-cashier-shift-live {
				background: #22c55e;
				border-radius: 50%;
				box-shadow: 0 0 0 3px rgba(34,197,94,.22);
				flex-shrink: 0;
				height: 8px;
				width: 8px;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-top .imogi-cashier-shift-row .imogi-cashier-shift-text.is-closed .imogi-cashier-shift-live {
				background: #f59e0b;
				box-shadow: 0 0 0 3px rgba(245,158,11,.22);
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-top .imogi-cashier-shift-row .imogi-cashier-shift-text a {
				color: #0f1f35 !important;
				font-weight: 700;
				text-decoration: none;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-panel.imogi-cashier-cart .imogi-cashier-panel-head {
				align-items: center;
				gap: 8px;
				padding: 10px 12px;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-cart-head-actions {
				flex-wrap: nowrap;
				gap: 6px;
			}
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-panel-head .imogi-cashier-hold-btn,
			.imogi-cashier-page.is-mobile-layout .imogi-cashier-panel-head .imogi-cart-clear {
				font-size: 11px !important;
				min-height: 32px;
				padding: 0 10px !important;
				white-space: nowrap;
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
				margin-top: 12px;
				padding-top: 12px;
			}
			.imogi-pay-success-dialog.imogi-pay-success-mobile .imogi-success-actions-grid {
				grid-template-columns: repeat(3, minmax(0, 1fr));
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
				padding: 11px 12px 11px 40px !important;
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
		.imogi-cashier-page :is(button, .btn, .imogi-status-chip, .imogi-cashier-group-btn, .imogi-cashier-order-type-btn, .imogi-cashier-group-picker-trigger, .imogi-cashier-group-picker-option, .imogi-pos-card, .imogi-qty-btn, .imogi-cashier-pay, .imogi-cashier-dock-cart, .imogi-cashier-dock-pay, .imogi-pay-quick-btn, .imogi-pay-discount-toggle, .imogi-pay-promo-toggle, .imogi-success-action-btn, .imogi-pay-numpad-key):not(.imogi-cashier-cart-close):hover {
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
	`, "imogi-cashier-inline-css-v73");
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
		this.pending_checkout_order_name = null;
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
			<header class="imogi-cashier-header">
				<div class="imogi-cashier-brand">
					<img class="imogi-cashier-brand-logo" src="${frappe.utils.escape_html(
						imogi_cashier_logo_url()
					)}" alt="${frappe.utils.escape_html(__("IMOGI Kasir"))}" />
					<span class="imogi-cashier-brand-title">${__("IMOGI Kasir")}</span>
				</div>
				<div class="imogi-cashier-header-mid">
					<div class="imogi-cashier-shift-text imogi-cashier-shift-pill">${__("Shift kasir belum dibuka")}</div>
				</div>
				<div class="imogi-cashier-shift-actions">
					<button type="button" class="btn btn-xs imogi-cashier-btn-primary imogi-cashier-open-shift-btn">${__(
						"Buka Shift"
					)}</button>
				</div>
			</header>
			<div class="imogi-cashier-top">
				<div class="imogi-cashier-shift-row"></div>
				<div class="imogi-cashier-branch-row">
					<i class="fa fa-map-marker" aria-hidden="true"></i>
					<span class="imogi-cashier-branch-label"></span>
					<select class="form-control input-sm imogi-cashier-branch-select" aria-label="${__(
						"Cabang"
					)}"></select>
				</div>
			</div>
			<div class="imogi-cashier-shell">
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
				<div class="imogi-cashier-panel imogi-cashier-products">
					<div class="imogi-cashier-panel-head">
						<h5><i class="fa fa-th-large imogi-cashier-head-icon"></i> ${__("Produk")}</h5>
						<span class="imogi-cashier-meta imogi-cashier-context-label"></span>
					</div>
					<div class="imogi-cashier-toolbar">
						<div class="imogi-cashier-search-wrap">
							<i class="fa fa-search imogi-cashier-search-icon" aria-hidden="true"></i>
							<input type="search" class="form-control imogi-cashier-search" placeholder="${__(
								"Cari produk atau scan barcode..."
							)}" autocomplete="off" />
						</div>
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
					<div class="imogi-pos-catalog-scroll">
					<div class="imogi-cashier-grid imogi-pos-catalog">
						<div class="imogi-cashier-loading"><i class="fa fa-spinner fa-spin"></i> ${__(
							"Memuat produk..."
						)}</div>
					</div>
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
								<i class="fa fa-user imogi-cashier-customer-icon" aria-hidden="true"></i>
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

		imogi_pos_paint_cashier_canvas();

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
		this.$shift_bar = this.wrapper.find(".imogi-cashier-header");
		this.$shift_mid = this.wrapper.find(".imogi-cashier-header-mid");
		this.$shift_actions = this.wrapper.find(".imogi-cashier-shift-actions");
		this.$shift_mobile_row = this.wrapper.find(".imogi-cashier-shift-row");
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
		imogi_apply_shift_bar_theme(this.$shift_bar, this.$shift_actions);
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
			this.render_shift_bar();
			if (this.requires_shift_workflow && !this.pos_opening) {
				this.open_shift();
				return;
			}
		} else {
			this.$shift_mid.hide();
			this.$shift_actions.hide();
			this.mount_history_fallback();
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

	history_action_html(mobile = this.is_mobile_layout()) {
		return `<button type="button" class="btn btn-xs btn-default imogi-cashier-history-btn" title="${__(
			"Riwayat order"
		)}"><i class="fa fa-history"></i>${mobile ? "" : ` ${__("Riwayat")}`}</button>`;
	}

	shift_status_html({ mobile, is_closed, shift_short, shift_name, since }) {
		if (is_closed) {
			return `<div class="imogi-cashier-shift-text imogi-cashier-shift-pill is-closed">
				<span class="imogi-cashier-shift-live" aria-hidden="true"></span>
				${__("Shift kasir belum dibuka — checkout dinonaktifkan")}
			</div>`;
		}
		return `<div class="imogi-cashier-shift-text imogi-cashier-shift-pill">
			<span class="imogi-cashier-shift-live" aria-hidden="true"></span>
			${
				mobile
					? `${__("Shift")} ${frappe.utils.escape_html(shift_short)}`
					: `${__("Shift")} <a href="/app/pos-opening-entry/${encodeURIComponent(
							shift_name
					  )}">${frappe.utils.escape_html(shift_name)}</a> · ${__("sejak")} ${frappe.utils.escape_html(
							since
					  )}`
			}
		</div>`;
	}

	sync_mobile_shift_row(html) {
		if (!this.$shift_mobile_row?.length) return;
		const mobile = this.is_mobile_layout();
		if (!mobile || !html) {
			this.$shift_mobile_row.removeClass("is-visible").empty();
			return;
		}
		this.$shift_mobile_row.html(html).addClass("is-visible");
	}

	header_actions_html({ mobile, mode }) {
		if (mode === "open") {
			return `
				<button type="button" class="btn btn-xs btn-default imogi-cashier-logout-btn" title="${__(
					"Logout sementara — shift tetap terbuka"
				)}"><i class="fa fa-sign-out"></i>${mobile ? "" : ` ${__("Logout")}`}</button>
				${this.history_action_html(mobile)}
				<button type="button" class="btn btn-xs btn-default imogi-cashier-close-shift-btn" title="${__(
					"Tutup Shift"
				)}"><i class="fa fa-stop"></i>${mobile ? "" : ` ${__("Tutup Shift")}`}</button>`;
		}
		return `
			<button type="button" class="btn btn-xs imogi-cashier-btn-primary imogi-cashier-open-shift-btn">${__(
				"Buka Shift"
			)}</button>
			${this.history_action_html(mobile)}
			<button type="button" class="btn btn-xs btn-default imogi-cashier-logout-btn" title="${__(
				"Logout dan ganti user kasir"
			)}"><i class="fa fa-sign-out"></i>${mobile ? "" : ` ${__("Logout")}`}</button>`;
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
			this.$shift_mid.hide();
			this.$shift_actions.hide();
			this.sync_mobile_shift_row("");
			this.mount_history_fallback();
			this.sync_status_strip();
			return;
		}
		this.$status_strip.find(".imogi-cashier-history-btn").remove();
		this.$shift_mid.show();
		this.$shift_actions.show();
		const mobile = this.is_mobile_layout();
		if (this.pos_opening && this.pos_opening.name) {
			this.$shift_bar.removeClass("is-closed");
			const since = frappe.datetime.str_to_user(this.pos_opening.period_start_date);
			const shift_short = (this.pos_opening.name || "").replace(/^POS-OPE-\d+-/, "POS-");
			const status_html = this.shift_status_html({
				mobile,
				is_closed: false,
				shift_short,
				shift_name: this.pos_opening.name,
				since,
			});
			this.$shift_mid.html(status_html);
			this.sync_mobile_shift_row(status_html);
			this.$shift_actions.html(this.header_actions_html({ mobile, mode: "open" }));
			this.$shift_actions.find(".imogi-cashier-logout-btn").on("click", () => this.logout_cashier());
			this.$shift_actions.find(".imogi-cashier-close-shift-btn").on("click", () => this.close_shift());
		} else if (this.requires_shift_workflow) {
			this.$shift_bar.addClass("is-closed");
			const status_html = this.shift_status_html({ mobile, is_closed: true });
			this.$shift_mid.html(status_html);
			this.sync_mobile_shift_row(status_html);
			this.$shift_actions.html(this.header_actions_html({ mobile, mode: "closed" }));
			this.$shift_actions.find(".imogi-cashier-open-shift-btn").on("click", () => this.open_shift());
			this.$shift_actions.find(".imogi-cashier-logout-btn").on("click", () => this.logout_cashier());
		}
		imogi_apply_shift_bar_theme(this.$shift_bar, this.$shift_actions);
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
					this.$shift_mid.hide();
					this.$shift_actions.hide();
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

		this.$grid.off("click", ".imogi-pos-card:not(.is-out)");
		this.$grid.on("click", ".imogi-pos-card:not(.is-out)", (e) => {
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

		this.$grid.off("keydown", ".imogi-pos-card:not(.is-out)");
		this.$grid.on("keydown", ".imogi-pos-card:not(.is-out)", (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				$(e.currentTarget).trigger("click");
			}
		});

		this.$grid.off("error", ".imogi-pos-card-img");
		this.$grid.on("error", ".imogi-pos-card-img", function () {
			const abbr = $(this).attr("alt") || "?";
			$(this)
				.closest(".imogi-pos-card-media")
				.replaceWith(
					`<div class="imogi-pos-card-fallback">${frappe.utils.escape_html(abbr)}</div>`
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
			stock_line = `<div class="imogi-pos-card-stock"><span class="indicator-pill blue">${__(
				"Paket"
			)}</span></div>`;
		} else if (track_stock) {
			if (qty <= 0) {
				stock_line = `<div class="imogi-pos-card-stock imogi-pos-card-stock--out"><span class="indicator-pill red">${__(
					"Habis"
				)}</span></div>`;
			} else {
				stock_line = `<div class="imogi-pos-card-stock imogi-pos-card-stock--ok"><span class="indicator-pill ${indicator}">${format_stock_pill(
					qty
				)}</span> ${__("stok tersisa")}</div>`;
			}
		}

		const abbr = frappe.utils.escape_html(
			frappe.get_abbr(item.item_name || item.item_code || "?")
		);
		let media;
		if (item.image) {
			media = `<div class="imogi-pos-card-media"><img class="imogi-pos-card-img" loading="lazy" decoding="async" src="${frappe.utils.escape_html(
				item.image
			)}" alt="${abbr}" /></div>`;
		} else {
			media = `<div class="imogi-pos-card-fallback">${abbr}</div>`;
		}

		return `<div class="imogi-pos-card${out ? " is-out" : ""}${item.has_variants ? " has-variants" : ""}${is_combo ? " is-combo" : ""}" role="button" tabindex="0"
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
			<div class="imogi-pos-card-body">
				<div class="imogi-pos-card-name">${frappe.utils.escape_html(item.item_name || item.item_code)}</div>
				<div class="imogi-pos-card-rate">${format_currency(item.rate || 0, item.currency, precision) || 0} <span class="imogi-pos-card-uom">/ ${frappe.utils.escape_html(uom)}</span></div>
				${stock_line}
			</div>
			<span class="imogi-pos-card-add" aria-hidden="true"><i class="fa fa-plus"></i></span>
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
		if (this.is_qris_payment_mode(mode_of_payment)) return false;
		if (this.is_transfer_payment_mode(mode_of_payment)) return false;
		const name = String(mode_of_payment || "").trim();
		if (!name) return false;
		const row = (this.context.payment_modes || []).find((m) => m.mode_of_payment === name);
		if (row?.type === "Cash") return true;
		return /cash|tunai/i.test(name);
	}

	is_qris_payment_mode(mode_of_payment) {
		if (!mode_of_payment) return false;
		const name = String(mode_of_payment).trim().toLowerCase();
		if (name.includes("qris") || name.includes("wallet") || name.includes("ewallet")) return true;
		const row = (this.context.payment_modes || []).find((m) => m.mode_of_payment === mode_of_payment);
		if (row?.type && /qris|wallet|ewallet/i.test(String(row.type))) return true;
		if (typeof imogi_pos !== "undefined" && imogi_pos.qris?.is_qris_mode) {
			return imogi_pos.qris.is_qris_mode(this, mode_of_payment);
		}
		return false;
	}

	is_transfer_payment_mode(mode_of_payment) {
		if (!mode_of_payment) return false;
		if (this.is_qris_payment_mode(mode_of_payment)) return false;
		const name = String(mode_of_payment).trim().toLowerCase();
		if (/transfer|bank|va\b|virtual/i.test(name)) return true;
		const row = (this.context.payment_modes || []).find((m) => m.mode_of_payment === mode_of_payment);
		if (row?.type === "Bank") return true;
		return false;
	}

	get_transfer_payment_config() {
		return this.context?.transfer_payment || {};
	}

	get_payment_dialog_mode(dialog) {
		if (dialog?._imogi_payment_mode) {
			return String(dialog._imogi_payment_mode).trim();
		}
		const active_card = dialog.$wrapper.find(".imogi-pay-mode-card.is-active").attr("data-mode");
		if (active_card) return String(active_card).trim();
		const from_field =
			dialog.get_value("mode_of_payment") ||
			dialog.fields_dict.mode_of_payment?.get_value?.() ||
			dialog.doc?.mode_of_payment;
		if (from_field) return String(from_field).trim();
		return String(
			this.context.default_payment_mode ||
				(this.context.payment_modes || [])[0]?.mode_of_payment ||
				""
		).trim();
	}

	get_payment_mode_icon(mode_of_payment) {
		if (this.is_cash_mode(mode_of_payment)) return "fa-money";
		if (this.is_qris_payment_mode(mode_of_payment)) return "fa-qrcode";
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
				const is_qris = this.is_qris_payment_mode(mode);
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
		</div>`;
	}

	get_dialog_paid_amount(dialog) {
		if (dialog._imogi_paid_amount != null && dialog._imogi_paid_amount !== "") {
			return flt(dialog._imogi_paid_amount);
		}
		return flt(dialog.get_value("paid_amount"));
	}

	set_dialog_paid_amount(dialog, amount) {
		const paid = Math.round(flt(amount) || 0);
		dialog._imogi_paid_amount = paid;
		const field = dialog.fields_dict.paid_amount;
		if (field) {
			dialog._imogi_paid_syncing = true;
			field.set_value(paid);
			if (dialog.doc) {
				dialog.doc.paid_amount = paid;
			}
			dialog._imogi_paid_syncing = false;
		} else {
			dialog.set_value("paid_amount", paid);
		}
		return paid;
	}

	get_cash_quick_preset_amount(denom, pay_total) {
		const presets = {
			pas: flt(pay_total),
			"50": 50000,
			"100": 100000,
		};
		return flt(presets[String(denom || "").toLowerCase()]);
	}

	build_cash_quick_buttons_markup(total, selected_amount = null, selected_denom = null) {
		const pay_total = flt(total);
		const paid_pick = flt(selected_amount) > 0 ? flt(selected_amount) : pay_total;
		const presets = [
			{ denom: "pas", label: __("Uang Pas") },
			{ denom: "50", label: "50K" },
			{ denom: "100", label: "100K" },
		];
		return presets
			.map(({ denom, label }) => {
				const amount = this.get_cash_quick_preset_amount(denom, pay_total);
				const disabled = amount < pay_total;
				const selected = selected_denom
					? denom === selected_denom
					: Math.round(amount) === Math.round(paid_pick);
				const selected_cls = selected ? " is-selected" : "";
				const disabled_cls = disabled ? " is-disabled" : "";
				const title = disabled ? ` title="${__("Kurang dari total")}"` : "";
				return `<button type="button" class="imogi-pay-quick-btn${selected_cls}${disabled_cls}" data-quick-denom="${denom}"${title}${
					disabled ? " disabled" : ""
				}>${label}</button>`;
			})
			.join("");
	}

	build_transfer_panel_html(total = 0) {
		const cfg = this.get_transfer_payment_config();
		const amount = format_currency(flt(total));
		if (!cfg.enabled) {
			return `<div class="imogi-pay-transfer-empty">${__(
				"Rekening transfer belum dikonfigurasi. Atur di IMOGI POS Settings → Pembayaran → Transfer Bank."
			)}</div>`;
		}
		const bank = frappe.utils.escape_html(cfg.bank_name || "");
		const account = frappe.utils.escape_html(cfg.bank_account || "");
		const holder = frappe.utils.escape_html(cfg.account_holder || "");
		const instructions = (cfg.instructions || "").trim();
		return `<div class="imogi-pay-transfer-card">
			<div class="imogi-pay-transfer-row">
				<span>${__("Bank")}</span>
				<strong>${bank}</strong>
			</div>
			<div class="imogi-pay-transfer-row">
				<span>${__("No. Rekening")}</span>
				<div>
					<strong class="imogi-pay-transfer-account">${account}</strong>
					<button type="button" class="imogi-pay-transfer-copy" data-copy-value="${account}">${__("Salin")}</button>
				</div>
			</div>
			<div class="imogi-pay-transfer-row">
				<span>${__("Atas Nama")}</span>
				<strong>${holder}</strong>
			</div>
			<div class="imogi-pay-transfer-row" style="flex-direction:column;gap:6px;">
				<span>${__("Nominal Transfer")}</span>
				<div class="imogi-pay-transfer-amount imogi-pay-transfer-amount-val">${amount}</div>
			</div>
			${
				instructions
					? `<div class="imogi-pay-transfer-hint"><i class="fa fa-info-circle"></i> ${frappe.utils.escape_html(
							instructions
					  )}</div>`
					: `<div class="imogi-pay-transfer-hint">${__(
							"Konfirmasi setelah pelanggan transfer, lalu tekan Bayar Sekarang."
					  )}</div>`
			}
		</div>`;
	}

	build_payment_detail_html(total = 0, paid_amount = null) {
		const paid = flt(paid_amount) > 0 ? flt(paid_amount) : flt(total);
		const change = Math.max(0, paid - flt(total));
		return `<div class="imogi-pay-detail-slot imogi-pay-checkout-block">
			<div class="imogi-pay-cash-quick">
				<div class="imogi-pay-quick-label">${__("Nominal cepat")}</div>
				<div class="imogi-pay-quick-row">${this.build_cash_quick_buttons_markup(total, paid)}</div>
				<div class="imogi-pay-quick-feedback">
					<span>${__("Diterima")}: <strong class="imogi-pay-quick-paid-val">${format_currency(paid)}</strong></span>
					<span>${__("Kembalian")}: <strong class="imogi-pay-quick-change-val">${format_currency(change)}</strong></span>
				</div>
			</div>
			<div class="imogi-pay-qris-panel">
				<div class="imogi-pay-quick-label">${__("Bayar dengan QRIS")}</div>
				<div class="imogi-pay-qris-inline-status">${__("Membuat QR...")}</div>
				<div class="imogi-pay-qris-inline-image"></div>
				<div class="imogi-pay-qris-inline-hint">${__(
					"Minta pelanggan scan QR. Pembayaran akan otomatis terdeteksi."
				)}</div>
			</div>
			<div class="imogi-pay-transfer-panel">
				<div class="imogi-pay-quick-label">${__("Transfer Bank")}</div>
				<div class="imogi-pay-transfer-body">${this.build_transfer_panel_html(total)}</div>
			</div>
		</div>`;
	}

	is_inline_qris_mode(mode) {
		return this.is_qris_payment_mode(mode);
	}

	sync_payment_detail_panels(dialog, is_cash, is_qris, is_transfer = false) {
		const $slot = dialog.$wrapper.find(".imogi-pay-detail-slot");
		if (!$slot.length) return;
		const $cash = $slot.find(".imogi-pay-cash-quick");
		const $qris = $slot.find(".imogi-pay-qris-panel");
		const $transfer = $slot.find(".imogi-pay-transfer-panel");
		$cash.toggleClass("is-visible", !!is_cash).css("display", is_cash ? "flex" : "none");
		$qris.toggleClass("is-visible", !!is_qris).css("display", is_qris ? "flex" : "none");
		$transfer.toggleClass("is-visible", !!is_transfer).css("display", is_transfer ? "flex" : "none");
	}

	refresh_transfer_panel(dialog, subtotal) {
		const total = this.get_payment_total(dialog, subtotal);
		const $body = dialog.$wrapper.find(".imogi-pay-transfer-body");
		if (!$body.length) return;
		$body.html(this.build_transfer_panel_html(total));
	}

	setup_transfer_copy_buttons(dialog) {
		const $wrap = dialog.$wrapper;
		$wrap.off("click.imogiTransferCopy", ".imogi-pay-transfer-copy");
		$wrap.on("click.imogiTransferCopy", ".imogi-pay-transfer-copy", function (e) {
			e.preventDefault();
			const value = String($(this).attr("data-copy-value") || "").trim();
			if (!value) return;
			const done = () => frappe.show_alert({ message: __("Nomor rekening disalin"), indicator: "green" });
			if (navigator.clipboard?.writeText) {
				navigator.clipboard.writeText(value).then(done).catch(() => {
					frappe.utils.copy_to_clipboard(value);
					done();
				});
				return;
			}
			frappe.utils.copy_to_clipboard(value);
			done();
		});
	}

	stop_inline_qris_poll(dialog) {
		if (dialog?._imogi_qris_poll_timer) {
			clearInterval(dialog._imogi_qris_poll_timer);
			dialog._imogi_qris_poll_timer = null;
		}
	}

	load_inline_qris(dialog, subtotal) {
		const me = this;
		const mode = me.get_payment_dialog_mode(dialog);
		if (!me.is_inline_qris_mode(mode)) return;

		const $panel = dialog.$wrapper.find(".imogi-pay-qris-panel");
		const $status = $panel.find(".imogi-pay-qris-inline-status");
		const $image = $panel.find(".imogi-pay-qris-inline-image");

		if (!me.require_feature("qris")) {
			$status.text(__("Fitur QRIS tidak tersedia di paket Anda"));
			$image.empty();
			return;
		}
		if (!me.context.payment_gateway_enabled) {
			$status.text(__("Gateway pembayaran belum diaktifkan"));
			$image.empty();
			return;
		}
		if (typeof imogi_pos === "undefined" || !imogi_pos.qris?._render_qr) {
			$status.text(__("Modul QRIS belum dimuat. Muat ulang halaman."));
			$image.empty();
			return;
		}
		const total = me.get_payment_total(dialog, subtotal);
		if (
			dialog._imogi_qris_payment_name &&
			dialog._imogi_qris_total === total &&
			!dialog._imogi_qris_paid
		) {
			return;
		}

		me.stop_inline_qris_poll(dialog);
		dialog._imogi_qris_payment_name = null;
		dialog._imogi_qris_total = total;
		dialog._imogi_qris_paid = false;

		$status.text(__("Membuat QR..."));
		$image.empty();

		const discount_state = me.get_payment_discount_state(dialog);
		const args = {
			items: JSON.stringify(
				me.get_checkout_cart().map((row) => ({
					item_code: row.item_code,
					qty: row.qty,
					rate: row.rate,
					uom: row.uom || undefined,
				}))
			),
			mode_of_payment: mode,
			discount_type: discount_state.type || undefined,
			discount_value: discount_state.value || undefined,
			...me.branch_api_args(),
		};
		if (me.selected_customer) args.customer = me.selected_customer;
		if (me.context.loyalty_enabled && imogi_pos.loyalty) {
			const promo = imogi_pos.loyalty.get_promo_state(dialog);
			if (promo.voucher_code) args.voucher_code = promo.voucher_code;
			if (promo.loyalty_points_redeem) args.loyalty_points_redeem = promo.loyalty_points_redeem;
		} else {
			if (me.voucher_code) args.voucher_code = me.voucher_code;
			if (me.loyalty_points_redeem) args.loyalty_points_redeem = me.loyalty_points_redeem;
		}
		args.order_type = me.order_type || "Takeaway";
		args.order_channel = "Walk-in";
		if (dialog._imogi_pending_order_name || me.pending_checkout_order_name) {
			args.order_name = dialog._imogi_pending_order_name || me.pending_checkout_order_name;
		}

		frappe.call({
			method: "imogi_pos.api.payment_gateway_api.create_qris_payment",
			args,
			freeze: false,
			callback(r) {
				if (r.exc) {
					$status.text(__("Gagal membuat QR"));
					return;
				}
				const msg = r.message || {};
				dialog._imogi_qris_payment_name = msg.name;
				$status.text(__("Menunggu pembayaran..."));
				imogi_pos.qris._render_qr($image, msg, { size: 180 });

				dialog._imogi_qris_poll_timer = setInterval(() => {
					if (dialog._imogi_qris_paid) return;
					frappe.call({
						method: "imogi_pos.api.payment_gateway_api.poll_gateway_payment",
						args: { payment_name: msg.name },
						callback(res) {
							if (dialog._imogi_qris_paid) return;
							if (res.exc) return;
							const row = res.message || {};
							if (row.status === "Paid") {
								me.finish_inline_qris_payment(dialog, subtotal, mode, row);
							} else if (row.status === "Failed") {
								me.stop_inline_qris_poll(dialog);
								dialog._imogi_qris_payment_name = null;
								$status.text(__("Pembayaran gagal / kedaluwarsa"));
							}
						},
					});
				}, 3000);
			},
		});
	}

	finish_inline_qris_payment(dialog, subtotal, mode, row) {
		if (dialog._imogi_qris_paid) return;
		dialog._imogi_qris_paid = true;
		dialog._imogi_checkout_completed = true;
		this.stop_inline_qris_poll(dialog);
		const me = this;
		const total = me.get_payment_total(dialog, subtotal);
		dialog.hide();
		const order_name = row.order;
		const on_order = (order) => {
			me.pending_checkout_order_name = null;
			me.show_success(order || {}, {
				change: 0,
				paid_amount: total,
				mode_of_payment: mode,
				breakdown: me.get_checkout_breakdown(dialog, subtotal),
			});
			me.refresh_sales_target();
			me.clear_cart_after_checkout();
			me.refresh_marketplace_badge();
		};
		if (order_name) {
			frappe.call({
				method: "imogi_pos.api.payment_gateway_api.get_gateway_order",
				args: { order_name },
				callback(or) {
					on_order(or.message || { name: order_name, status: "Completed" });
				},
			});
		} else {
			on_order({ name: order_name, status: "Completed" });
		}
	}

	refresh_inline_qris_if_needed(dialog, subtotal) {
		if (!this.is_inline_qris_mode(this.get_payment_dialog_mode(dialog))) return;
		this.load_inline_qris(dialog, subtotal);
	}

	render_cash_quick_buttons(dialog, total, selected_amount = null, selected_denom = null) {
		const $row = dialog.$wrapper.find(".imogi-pay-shell .imogi-pay-cash-quick .imogi-pay-quick-row");
		if (!$row.length) return;
		const paid =
			selected_amount != null
				? flt(selected_amount)
				: this.get_dialog_paid_amount(dialog) || flt(total);
		const denom = selected_denom != null ? selected_denom : dialog._imogi_quick_denom || null;
		$row.html(this.build_cash_quick_buttons_markup(total, paid, denom));
	}

	sync_cash_quick_selection(dialog, total, paid_amount = null, selected_denom = null) {
		const paid =
			paid_amount != null
				? flt(paid_amount)
				: this.get_dialog_paid_amount(dialog) || flt(total);
		const denom = selected_denom != null ? selected_denom : dialog._imogi_quick_denom || null;
		this.render_cash_quick_buttons(dialog, total, paid, denom);
	}

	update_cash_quick_feedback(dialog, subtotal, paid_amount = null) {
		const total = this.get_payment_total(dialog, subtotal);
		const paid = paid_amount != null ? flt(paid_amount) : this.get_dialog_paid_amount(dialog);
		const change = paid - total;
		const $wrap = dialog.$wrapper.find(".imogi-pay-shell .imogi-pay-quick-feedback");
		if (!$wrap.length) return;
		$wrap.find(".imogi-pay-quick-paid-val").text(format_currency(paid));
		const $change = $wrap.find(".imogi-pay-quick-change-val");
		$change.text(format_currency(Math.max(change, 0)));
		$change.removeClass("is-ok is-short");
		if (paid < total) {
			$change.addClass("is-short");
		} else if (change > 0) {
			$change.addClass("is-ok");
		}
	}

	apply_quick_paid_amount(dialog, subtotal, amount, denom = null) {
		const total = this.get_payment_total(dialog, subtotal);
		const paid = this.set_dialog_paid_amount(dialog, amount);
		if (denom) {
			dialog._imogi_quick_denom = denom;
		}
		if (typeof dialog._imogi_sync_numpad_buffer === "function") {
			dialog._imogi_sync_numpad_buffer(paid);
		}
		this.update_change_display(dialog, total, paid);
		this.update_cash_quick_feedback(dialog, subtotal, paid);
		this.sync_cash_quick_selection(dialog, total, paid, denom);
	}

	setup_payment_mode_cards(dialog, subtotal) {
		const me = this;
		const $wrap = dialog.$wrapper;
		$wrap.off("click.imogiPayMode", ".imogi-pay-mode-card");
		$wrap.on("click.imogiPayMode", ".imogi-pay-mode-card", function () {
			const mode = $(this).attr("data-mode");
			if (!mode) return;
			$wrap.find(".imogi-pay-mode-card").removeClass("is-active");
			$(this).addClass("is-active");
			dialog._imogi_payment_mode = mode;
			dialog.set_value("mode_of_payment", mode);
			me.toggle_cash_fields(dialog, subtotal, mode);
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
		this.sync_pending_order_with_cart();
	}

	sync_pending_order_with_cart(options = {}) {
		if (this.busy) return;
		const order_name = this.pending_checkout_order_name || this.marketplace_order_name;
		if (!order_name || this.cart.length) return;
		this.void_pending_checkout_order(order_name, {
			reason: options.reason || __("Keranjang dikosongkan"),
			approval_code: options.approval_code,
			on_done: options.on_done,
			on_fail: options.on_fail,
		});
	}

	clear_cart() {
		const order_name = this.pending_checkout_order_name || this.marketplace_order_name;
		if (!this.cart.length && !this.discount_type && !flt(this.discount_value) && !order_name) return;
		this.cart = [];
		this.discount_type = "";
		this.discount_value = 0;
		if (!order_name) {
			this.marketplace_order_name = null;
		}
		this.render_cart();
		this.sync_pending_order_with_cart({ reason: __("Keranjang dikosongkan") });
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

	get_checkout_cart() {
		if (this._split_checkout_active && this._split_checkout_cart?.length) {
			return this._split_checkout_cart;
		}
		return this.cart;
	}

	get_cart_subtotal_for_checkout() {
		return this.get_checkout_cart().reduce((sum, row) => sum + flt(row.rate) * flt(row.qty), 0);
	}

	_payment_preview_matches_subtotal(subtotal) {
		const preview = this.payment_preview;
		if (!preview || flt(preview.grand_total) < 0) return false;
		const preview_subtotal = flt(preview.subtotal);
		if (!preview_subtotal) return false;
		return Math.abs(preview_subtotal - flt(subtotal)) <= 0.01;
	}

	get_cart_promo_discount() {
		if (this._split_checkout_active) {
			return flt(this._remainder_promo_discount);
		}
		return flt(this.promo_discount);
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
					if (!this.cart.length) {
						this.$cart_items.siblings(".imogi-cashier-promo-hint").remove();
						this.promo_discount = 0;
						this.applied_promos = [];
						this.update_cart_total_display();
						return;
					}
					const msg = r.message || {};
					const discount = flt(msg.promo_discount);
					if (this._split_checkout_active) {
						this._remainder_promo_discount = discount;
					} else {
						this.promo_discount = discount;
					}
					this.applied_promos = msg.applied_promos || [];
					const pending = msg.pending_promos || [];
					const hints = [
						...this.applied_promos.map((row) => row.label),
						...pending.map((row) => row.label),
					];
					const cart_promo = this.get_cart_promo_discount();
					if (hints.length) {
						const savings =
							cart_promo > 0
								? ` · ${__("hemat")} ${format_currency(cart_promo)}`
								: "";
						this.$cart_items.before(
							`<div class="imogi-cashier-promo-hint imogi-cashier-promo-hint--${
								cart_promo > 0 ? "active" : "pending"
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

	has_applied_promo_rules(dialog) {
		if (!this.context?.enable_promo_rules) {
			return false;
		}
		const preview = this.payment_preview || {};
		if (flt(preview.promo_discount ?? this.promo_discount) > 0) {
			return true;
		}
		const applied = preview.applied_promos ?? this.applied_promos ?? [];
		if (applied.length) {
			return true;
		}
		const items = preview.items || [];
		return items.some((row) => cint(row.is_promo_reward) || row.promo_rule);
	}

	get_cart_total() {
		const subtotal = this.get_cart_subtotal();
		const manual = this.get_discount_amount(subtotal);
		const net = Math.max(0, subtotal - manual - this.get_cart_promo_discount());
		return imogi_compute_local_tax(net, this.context?.sales_tax || {}).grand_total;
	}

	get_pay_item_count() {
		return this.get_checkout_cart().reduce((sum, row) => sum + flt(row.qty), 0);
	}

	get_order_type_label() {
		const row = IMOGI_ORDER_TYPES.find((item) => item.value === this.order_type);
		return row?.label || this.order_type || "";
	}

	build_manual_discount_quick_html() {
		return `<div class="imogi-pay-manual-discount">
			<div class="imogi-pay-manual-discount-note">
				<i class="fa fa-gift"></i>
				${__("Diskon tidak tersedia karena ada Promo Rule aktif pada transaksi ini.")}
			</div>
			<input type="hidden" class="imogi-pay-discount-type" value="" />
			<input type="hidden" class="imogi-pay-discount-value" value="" />
			<div class="imogi-pay-manual-discount-group">
				<div class="imogi-pay-manual-discount-label">% ${__("Persent")}</div>
				<div class="imogi-pay-manual-discount-row">
					<button type="button" class="imogi-pay-manual-discount-btn" data-discount-type="Percent" data-discount-value="20">20</button>
					<button type="button" class="imogi-pay-manual-discount-btn" data-discount-type="Percent" data-discount-value="30">30</button>
					<button type="button" class="imogi-pay-manual-discount-btn" data-discount-type="Percent" data-discount-value="50">50</button>
				</div>
			</div>
			<div class="imogi-pay-manual-discount-group">
				<div class="imogi-pay-manual-discount-label">${__("Rupiah")}</div>
				<div class="imogi-pay-manual-discount-row">
					<button type="button" class="imogi-pay-manual-discount-btn" data-discount-type="Amount" data-discount-value="20000">20K</button>
					<button type="button" class="imogi-pay-manual-discount-btn" data-discount-type="Amount" data-discount-value="30000">30K</button>
					<button type="button" class="imogi-pay-manual-discount-btn" data-discount-type="Amount" data-discount-value="50000">50K</button>
				</div>
			</div>
		</div>`;
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
				${this.build_manual_discount_quick_html()}
			</div>
		</div>`;
	}

	get_checkout_breakdown(dialog, subtotal) {
		const preview = this.payment_preview || {};
		const pay_subtotal = flt(subtotal);
		const use_preview = this._payment_preview_matches_subtotal(pay_subtotal);
		const { type, value } = this.get_payment_discount_state(dialog);
		const promo_discount = use_preview
			? flt(preview.promo_discount ?? 0)
			: this._split_checkout_active
			? 0
			: flt(this.promo_discount);
		const manual_discount = this.get_discount_amount(pay_subtotal, type, value);
		const voucher_discount = use_preview ? flt(preview.voucher_discount) : 0;
		const loyalty_discount = use_preview ? flt(preview.loyalty_discount) : 0;
		const net_before_tax =
			use_preview && preview.net_before_tax != null
				? flt(preview.net_before_tax)
				: Math.max(
						0,
						pay_subtotal -
							promo_discount -
							manual_discount -
							voucher_discount -
							loyalty_discount
				  );
		const tax =
			use_preview && preview.tax_amount != null
				? {
						taxable_amount: flt(preview.taxable_amount),
						tax_amount: flt(preview.tax_amount),
						grand_total: flt(preview.grand_total),
						tax_rate: flt(preview.tax_rate) || flt(this.context?.sales_tax?.rate) || 11,
				  }
				: imogi_compute_local_tax(net_before_tax, this.context?.sales_tax || {});
		return {
			subtotal: pay_subtotal,
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
		const payment_mode = (() => {
			if (payment_info.payments?.length) {
				return `<div class="imogi-pay-success-payment-meta imogi-pay-success-payment-meta--multi">
				<span>${__("Metode")}</span>
				<div class="imogi-pay-success-payment-lines">
					${payment_info.payments
						.map(
							(p) => `<div class="imogi-pay-success-payment-line">
						<strong>${frappe.utils.escape_html(p.mode_of_payment)}</strong>
						<span>${format_currency(flt(p.amount))}</span>
					</div>`
						)
						.join("")}
				</div>
			</div>`;
			}
			if (payment_info.mode_of_payment) {
				return `<div class="imogi-pay-success-payment-meta">
				<span>${__("Metode")}</span>
				<strong>${frappe.utils.escape_html(payment_info.mode_of_payment)}</strong>
			</div>`;
			}
			return "";
		})();
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
			clearTimeout(this._promo_preview_timer);
			this.$cart_items.siblings(".imogi-cashier-promo-hint").remove();
			this.promo_discount = 0;
			this.applied_promos = [];
			this.$cart_items.html(
				`<div class="imogi-cashier-cart-empty">
					<div class="imogi-cashier-cart-empty-icon"><i class="fa fa-shopping-cart"></i></div>
					<p>${__("Tap produk untuk menambah ke keranjang")}</p>
				</div>`
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
		if (!dialog?.$wrapper?.length) {
			return {
				type: this.discount_type || "",
				value: flt(this.discount_value),
			};
		}
		const $wrap = dialog.$wrapper;
		return {
			type: $wrap.find(".imogi-pay-discount-type").val() || "",
			value: flt($wrap.find(".imogi-pay-discount-value").val()),
		};
	}

	get_payment_total(dialog, subtotal) {
		const pay_subtotal =
			subtotal != null ? flt(subtotal) : this.get_cart_subtotal_for_checkout();
		if (this._payment_preview_matches_subtotal(pay_subtotal)) {
			return flt(this.payment_preview.grand_total);
		}
		return this.get_checkout_breakdown(dialog, pay_subtotal).grand_total;
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
		const $type = $wrap.find(".imogi-pay-discount-type");
		const $value = $wrap.find(".imogi-pay-discount-value");

		$type.val(this.discount_type || "");
		$value.val(this.discount_value || "");

		const sync = () => {
			if (me.needs_checkout_preview()) {
				me.refresh_payment_preview(dialog, subtotal);
			} else {
				me.refresh_payment_dialog(dialog, subtotal);
			}
		};

		$wrap.off("click.imogiPayDiscount", ".imogi-pay-manual-discount-btn");
		$wrap.on("click.imogiPayDiscount", ".imogi-pay-manual-discount-btn", function (e) {
			e.preventDefault();
			const $btn = $(this);
			if ($btn.prop("disabled") || $btn.hasClass("is-disabled") || me.has_applied_promo_rules(dialog)) {
				return;
			}
			const btn_type = String($btn.data("discount-type") || "");
			const btn_value = flt($btn.data("discount-value"));
			const current = me.get_payment_discount_state(dialog);
			const is_active =
				current.type === btn_type && flt(current.value) === btn_value;
			me.apply_manual_discount_preset(
				dialog,
				subtotal,
				is_active ? "" : btn_type,
				is_active ? 0 : btn_value
			);
		});
		this.sync_manual_discount_buttons(dialog, subtotal);
	}

	sync_manual_discount_buttons(dialog, subtotal) {
		if (!dialog?.$wrapper?.length) return;
		const blocked = this.has_applied_promo_rules(dialog);
		const sub = subtotal != null ? subtotal : this.get_cart_subtotal();
		const { type, value } = this.get_payment_discount_state(dialog);

		dialog.$wrapper.find(".imogi-pay-manual-discount").toggleClass("is-blocked", blocked);

		if (blocked && (type || flt(value))) {
			dialog.$wrapper.find(".imogi-pay-discount-type").val("");
			dialog.$wrapper.find(".imogi-pay-discount-value").val("");
			this.discount_type = "";
			this.discount_value = 0;
		}

		dialog.$wrapper.find(".imogi-pay-manual-discount-btn").each(function () {
			const $btn = $(this);
			if (blocked) {
				$btn.prop("disabled", true).addClass("is-disabled").removeClass("is-selected");
				return;
			}
			$btn.prop("disabled", false).removeClass("is-disabled");
			const active =
				String($btn.data("discount-type") || "") === type &&
				flt($btn.data("discount-value")) === flt(value);
			$btn.toggleClass("is-selected", active);
		});
	}

	apply_manual_discount_preset(dialog, subtotal, type, value, options = {}) {
		if (!dialog?.$wrapper?.length) return;
		if (this.has_applied_promo_rules(dialog) && (type || flt(value))) {
			type = "";
			value = 0;
		}
		const $wrap = dialog.$wrapper;
		$wrap.find(".imogi-pay-discount-type").val(type || "");
		$wrap.find(".imogi-pay-discount-value").val(flt(value) || "");
		this.discount_type = type || "";
		this.discount_value = flt(value) || 0;
		if (!options.skip_sync) {
			this.sync_manual_discount_buttons(dialog, subtotal);
		}
		if (this.needs_checkout_preview()) {
			this.refresh_payment_preview(dialog, subtotal);
		} else {
			this.refresh_payment_dialog(dialog, subtotal);
		}
	}

	setup_mobile_pay_numpad(dialog, subtotal) {
		const me = this;
		const $wrap = dialog.$wrapper;
		const is_mobile = this.is_mobile_layout();
		$wrap.toggleClass("imogi-pay-mobile", is_mobile);

		const $field = dialog.fields_dict.paid_amount?.$wrapper;
		const $input = dialog.fields_dict.paid_amount?.$input;
		if (!$field?.length || !$input?.length) return;

		let $numpad_wrap = $wrap.find(".imogi-pay-numpad-wrap");
		if (!$numpad_wrap.length) {
			const $cashQuick = $wrap.find(".imogi-pay-detail-slot .imogi-pay-cash-quick");
			if (!$cashQuick.length) return;
			$cashQuick.append(`<div class="imogi-pay-numpad-wrap">${this.build_pay_numpad_html()}</div>`);
			$numpad_wrap = $wrap.find(".imogi-pay-numpad-wrap");
		}

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
			const paid = me.set_dialog_paid_amount(dialog, amount);
			dialog._imogi_quick_denom = null;
			const total = me.get_payment_total(dialog, subtotal);
			me.update_change_display(dialog, total, paid);
			me.update_cash_quick_feedback(dialog, subtotal, paid);
			me.sync_cash_quick_selection(dialog, total, paid, null);
		};

		const show_numpad = () => {
			if (!me.is_cash_mode(dialog.get_value("mode_of_payment"))) return;
			$numpad_wrap.addClass("is-visible");
			buffer = String(Math.round(me.get_dialog_paid_amount(dialog) || 0));
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
		dialog._imogi_sync_numpad_buffer = (amount) => {
			buffer = String(Math.round(flt(amount) || 0));
			if (buffer === "0") buffer = "";
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
			$wrap.find(".imogi-pay-manual-discount-btn").removeClass("is-selected");
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
		this.sync_manual_discount_buttons(dialog, subtotal);
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
		this.sync_manual_discount_buttons(dialog, subtotal);
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

		this.render_cash_quick_buttons(
			dialog,
			total,
			this.get_dialog_paid_amount(dialog) || total
		);

		this.update_payment_primary_action(dialog, subtotal);

		if (dialog._imogi_pay_tab === "multi") {
			this.render_multi_payment_panel(dialog, subtotal);
		}

		if (this.is_cash_mode(dialog.get_value("mode_of_payment"))) {
			let paid = this.get_dialog_paid_amount(dialog);
			const prevTotal = flt(dialog._imogi_last_checkout_total);
			if (!paid || paid < total || (prevTotal && prevTotal !== total && paid === prevTotal)) {
				paid = this.set_dialog_paid_amount(dialog, total);
				dialog._imogi_quick_denom = "pas";
			}
			dialog._imogi_last_checkout_total = total;
			this.update_change_display(dialog, total, paid);
			this.update_cash_quick_feedback(dialog, subtotal, paid);
			this.sync_cash_quick_selection(dialog, total, paid);
		}
		const mode = this.get_payment_dialog_mode(dialog);
		const is_qris = this.is_inline_qris_mode(mode);
		const is_transfer = this.is_transfer_payment_mode(mode);
		const is_cash = !is_qris && !is_transfer && this.is_cash_mode(mode);
		this.sync_payment_detail_panels(dialog, is_cash, is_qris, is_transfer);
		if (is_transfer) {
			this.refresh_transfer_panel(dialog, subtotal);
		}
		if (is_qris) {
			this.load_inline_qris(dialog, subtotal);
		}
	}

	update_payment_primary_action(dialog, subtotal) {
		const total = this.get_payment_total(dialog, subtotal);
		const label = `${__("Selesaikan Pembayaran")} · ${format_currency(total)}`;
		const $btn = dialog.get_primary_btn?.();
		if ($btn?.length) {
			$btn.html(label);
		}
	}

	setup_payment_shell(dialog) {
		const $wrap = dialog.$wrapper;
		const $body = $wrap.find(".modal-body");
		const $existing = $body.find(".imogi-pay-shell");
		if ($existing.length) {
			const $checkout = $existing.find(".imogi-pay-col--checkout");
			if ($checkout.length && !$checkout.find(".imogi-pay-multi-slot").length) {
				$checkout.prepend('<div class="imogi-pay-multi-slot"></div>');
			}
			return;
		}

		const $shell = $(`<div class="imogi-pay-shell">
			<div class="imogi-pay-col imogi-pay-col--summary"></div>
			<div class="imogi-pay-col imogi-pay-col--checkout">
				<div class="imogi-pay-multi-slot"></div>
				<div class="imogi-pay-checkout-stack"></div>
				<div class="imogi-pay-extras"></div>
			</div>
		</div>`);

		const $summary = dialog.fields_dict.pay_summary_html?.$wrapper;
		const $stack = $shell.find(".imogi-pay-checkout-stack");
		const $extras = $shell.find(".imogi-pay-extras");
		const checkout_fields = ["payment_modes_html", "cash_quick_html"];
		const extra_fields = ["promo_html"];

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
		const me = this;
		const $footer = dialog.$wrapper.find(".modal-footer");
		if ($footer.find(".imogi-pay-footer-strip").length) return;
		const total = this.get_payment_total(dialog, subtotal);
		$footer.prepend(`<div class="imogi-pay-footer-strip">
			<span class="imogi-pay-footer-label">${__("Total transaksi")}</span>
			<span class="imogi-pay-footer-amount">${format_currency(total)}</span>
		</div>`);
		const order_name = dialog._imogi_pending_order_name || this.pending_checkout_order_name;
		if (!order_name || $footer.find(".imogi-pay-footer-btns").length) return;
		const $actions = $footer.find(".standard-actions").first();
		if (!$actions.length) return;
		const $row = $('<div class="imogi-pay-footer-btns"></div>');
		const $voidBtn = $(
			`<button type="button" class="btn btn-default imogi-pay-void-btn">
				<i class="fa fa-ban" aria-hidden="true"></i>
				<span>${__("Void Order")}</span>
			</button>`
		);
		$voidBtn.on("click", (e) => {
			e.preventDefault();
			me.cancel_pending_payment_dialog(dialog);
		});
		$row.append($voidBtn, $actions.detach());
		$footer.append($row);
	}

	setup_payment_header(dialog) {
		const order_ref = dialog._imogi_pending_order_name
			? `<span class="imogi-pay-title-order">${frappe.utils.escape_html(dialog._imogi_pending_order_name)} · ${__(
					"Awaiting Payment"
			  )}</span>`
			: "";
		dialog.$wrapper.find(".modal-title").html(
			`<span class="imogi-pay-title-main">${__("Pembayaran")}</span>
			${order_ref}
			<span class="imogi-pay-title-sub">${__("Pilih metode pembayaran dan selesaikan transaksi")}</span>`
		);
	}

	build_payment_tabs_html(active = "single") {
		const tabs = [
			{ id: "single", label: __("Single Payment") },
			{ id: "multi", label: __("Multi Payment") },
			{ id: "split", label: __("Split Bill") },
		];
		return `<div class="imogi-pay-tabs" role="tablist">${tabs
			.map(
				(tab) =>
					`<button type="button" class="imogi-pay-tab${active === tab.id ? " is-active" : ""}"
					data-pay-tab="${tab.id}" role="tab">${tab.label}</button>`
			)
			.join("")}</div>`;
	}

	setup_payment_tabs(dialog, subtotal, initial_tab = "single") {
		const me = this;
		dialog._imogi_pay_tab = initial_tab || "single";
		const $header = dialog.$wrapper.find(".modal-header");
		$header.find(".imogi-pay-tabs").remove();
		$header.append(this.build_payment_tabs_html(dialog._imogi_pay_tab));

		$header.off("click.imogiPayTab").on("click.imogiPayTab", "[data-pay-tab]", function (e) {
			e.preventDefault();
			dialog._imogi_pay_tab = $(this).data("pay-tab");
			$header.find(".imogi-pay-tab").removeClass("is-active");
			$(this).addClass("is-active");
			me.sync_payment_tab(dialog, subtotal);
		});

		this.sync_payment_tab(dialog, subtotal);
	}

	sync_payment_tab(dialog, subtotal) {
		const tab = dialog._imogi_pay_tab || "single";
		const $w = dialog.$wrapper;
		const $header = $w.find(".modal-header");
		$w.removeClass("imogi-pay-tab-single imogi-pay-tab-multi imogi-pay-tab-split");
		$w.addClass(`imogi-pay-tab-${tab}`);

		const $multiToggle = $w.find(".imogi-pay-multi-toggle");
		if (tab === "multi") {
			if (!this.feature_allowed("multi_payment")) {
				this.require_feature("multi_payment");
				dialog._imogi_pay_tab = "single";
				$w.removeClass("imogi-pay-tab-multi").addClass("imogi-pay-tab-single");
				$header.find(".imogi-pay-tab").removeClass("is-active");
				$header.find('[data-pay-tab="single"]').addClass("is-active");
				return;
			}
			this.render_multi_payment_panel(dialog, subtotal);
			dialog.get_primary_btn?.()?.html(__("Selesaikan Pembayaran"));
		} else {
			$multiToggle.prop("checked", false);
		}

		if (tab === "split") {
			if (!this.feature_allowed("split_bill")) {
				this.require_feature("split_bill");
				dialog._imogi_pay_tab = "single";
				$w.removeClass("imogi-pay-tab-split").addClass("imogi-pay-tab-single");
				$header.find(".imogi-pay-tab").removeClass("is-active");
				$header.find('[data-pay-tab="single"]').addClass("is-active");
				return;
			}
			this.render_payment_split_panel(dialog);
			dialog.get_primary_btn?.()?.html(__("Bayar Item Terpilih"));
			return;
		} else {
			this.update_payment_primary_action(dialog, subtotal);
		}

		if (tab === "single") {
			this.toggle_cash_fields(dialog, subtotal);
		}
	}

	render_multi_payment_panel(dialog, subtotal) {
		const me = this;
		const $slot = dialog.$wrapper.find(".imogi-pay-multi-slot");
		if (!$slot.length) return;

		const modes = (this.context?.payment_modes || []).map((m) => m.mode_of_payment);
		let $wrap = $slot.find(".imogi-pay-multi-wrap");
		if (!$wrap.length) {
			$slot.html(`
				<div class="imogi-pay-multi-wrap">
					<div class="imogi-pay-block-title"><i class="fa fa-credit-card"></i> ${__("Alokasi Pembayaran")}</div>
					<div class="imogi-pay-multi-hint">${__(
						"Bagi total tagihan ke beberapa metode bayar. Jumlah semua baris harus sama dengan total."
					)}</div>
					<div class="imogi-pay-multi-rows"></div>
					<div class="imogi-pay-multi-actions" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
						<button type="button" class="btn btn-xs btn-default imogi-pay-multi-add">+ ${__("Tambah Metode")}</button>
						<button type="button" class="btn btn-xs btn-default imogi-pay-multi-fill">${__("Isi Sisa")}</button>
					</div>
					<div class="imogi-pay-multi-sum"></div>
				</div>`);
			$wrap = $slot.find(".imogi-pay-multi-wrap");
		}

		if (!modes.length) {
			$wrap.find(".imogi-pay-multi-rows").html(
				`<div class="text-muted small">${__(
					"Belum ada Mode of Payment di POS Profile. Tambahkan minimal 2 metode di pengaturan POS."
				)}</div>`
			);
			return;
		}

		const buildRow = (mode, amount) => `
			<div class="imogi-pay-multi-row">
				<select class="form-control input-sm imogi-pay-multi-mode">${modes
					.map(
						(m) =>
							`<option value="${frappe.utils.escape_html(m)}"${
								m === mode ? " selected" : ""
							}>${frappe.utils.escape_html(m)}</option>`
					)
					.join("")}</select>
				<input type="number" min="0" step="any" class="form-control input-sm imogi-pay-multi-amount" value="${amount || ""}" placeholder="0" />
			</div>`;

		const $rows = $wrap.find(".imogi-pay-multi-rows");
		if (!$rows.find(".imogi-pay-multi-row").length) {
			$rows.html(buildRow(modes[0], ""));
			$rows.append(buildRow(modes[1] || modes[0], ""));
		}

		const update_sum = () => {
			const total = me.get_payment_total(dialog, subtotal);
			let sum = 0;
			$wrap.find(".imogi-pay-multi-row").each(function () {
				sum += flt($(this).find(".imogi-pay-multi-amount").val());
			});
			const $sum = $wrap.find(".imogi-pay-multi-sum");
			const ok = Math.abs(sum - flt(total)) <= 0.01 && sum > 0;
			$sum
				.toggleClass("is-ok", ok)
				.toggleClass("is-bad", !ok && sum > 0)
				.html(
					`<span>${__("Total alokasi")}</span><span>${format_currency(sum)} / ${format_currency(total)}</span>`
				);
		};

		update_sum();

		$wrap.find(".imogi-pay-multi-add").off("click.imogiMulti").on("click.imogiMulti", () => {
			$wrap.find(".imogi-pay-multi-rows").append(buildRow(modes[0], ""));
			update_sum();
		});

		$wrap.find(".imogi-pay-multi-fill").off("click.imogiMulti").on("click.imogiMulti", () => {
			const total = me.get_payment_total(dialog, subtotal);
			const $amounts = $wrap.find(".imogi-pay-multi-amount");
			if (!$amounts.length) return;
			let sum = 0;
			$amounts.each(function (idx) {
				if (idx < $amounts.length - 1) sum += flt($(this).val());
			});
			$amounts.last().val(Math.max(0, flt(total) - sum));
			update_sum();
		});

		$wrap.off("input.imogiMulti").on("input.imogiMulti", ".imogi-pay-multi-amount", update_sum);
	}

	render_payment_split_panel(dialog) {
		const me = this;
		const $stack = dialog.$wrapper.find(".imogi-pay-checkout-stack");
		let $panel = $stack.find(".imogi-pay-split-panel");
		if (!$panel.length) {
			$panel = $(`<div class="imogi-pay-split-panel imogi-pay-checkout-block"></div>`);
			$stack.prepend($panel);
		}
		dialog._imogi_split_cart_snapshot = this.cart.map((row) => ({ ...row }));
		const rows = dialog._imogi_split_cart_snapshot
			.map(
				(row, idx) => `<label class="imogi-pay-split-item">
				<input type="checkbox" class="imogi-split-item" data-idx="${idx}" checked>
				<span>${frappe.utils.escape_html(row.item_name)} × ${row.qty}</span>
				<strong style="margin-left:auto">${format_currency(flt(row.rate) * flt(row.qty))}</strong>
			</label>`
			)
			.join("");
		const single_line_hint =
			dialog._imogi_split_cart_snapshot.length < 2
				? `<div class="alert alert-warning small" style="margin-bottom:12px">${__(
						"Tambahkan minimal 2 jenis item di keranjang untuk mencoba split bill. Dengan 1 item saja, centang semua = bayar penuh."
				  )}</div>`
				: "";
		$panel.html(`<div class="imogi-pay-block-title"><i class="fa fa-scissors"></i> ${__("Split Bill")}</div>
			<ol class="imogi-pay-split-steps">
				<li>${__("Centang item yang ingin dibayar sekarang")}</li>
				<li>${__("Klik <b>Bayar Item Terpilih</b>")}</li>
				<li>${__("Selesaikan pembayaran — item yang tidak dicentang tetap di keranjang")}</li>
			</ol>
			<p class="text-muted small">${__(
				"Split per baris item. Untuk bayar sebagian qty, kurangi qty di keranjang dulu lalu checkout lagi."
			)}</p>${single_line_hint}
			<div class="imogi-pay-split-selected-total small text-muted" style="margin-bottom:10px"></div>
			${rows}`);
		$panel.off("change.imogiSplit").on("change.imogiSplit", ".imogi-split-item", () => {
			me.update_split_bill_summary(dialog);
		});
		this.update_split_bill_summary(dialog);
	}

	get_split_selected_cart(dialog) {
		const source = dialog?._imogi_split_cart_snapshot || this.cart;
		const picked = [];
		dialog?.$wrapper?.find(".imogi-split-item:checked").each(function () {
			const idx = cint($(this).data("idx"));
			if (source[idx]) picked.push({ ...source[idx] });
		});
		return picked;
	}

	update_split_bill_summary(dialog) {
		const me = this;
		const selected = this.get_split_selected_cart(dialog);
		const $wrap = dialog.$wrapper;
		const $hint = $wrap.find(".imogi-pay-split-selected-total");
		if (!selected.length) {
			$hint.text(__("Pilih minimal 1 item untuk dibayar"));
			return;
		}

		const paint_totals = (totals) => {
			const subtotal = flt(totals.subtotal);
			const breakdown = {
				subtotal,
				promo_discount: flt(totals.promo_discount),
				manual_discount: flt(totals.manual_discount),
				voucher_discount: flt(totals.voucher_discount),
				loyalty_discount: flt(totals.loyalty_discount),
				taxable_amount: flt(totals.taxable_amount),
				tax_amount: flt(totals.tax_amount),
				grand_total: flt(totals.grand_total),
				tax_rate: flt(totals.tax_rate) || flt(me.context?.sales_tax?.rate) || 11,
			};
			$hint.html(
				`${__("Total item terpilih")}: <strong>${format_currency(breakdown.grand_total)}</strong>`
			);
			$wrap.find(".imogi-pay-hero-amount, .imogi-pay-total-value").html(
				imogi_format_pay_total(breakdown.grand_total)
			);
			$wrap.find(".imogi-pay-footer-amount").text(format_currency(breakdown.grand_total));
			$wrap.find(".imogi-pay-subtotal-value").text(format_currency(breakdown.subtotal));
			$wrap
				.find(".imogi-pay-promo-discount-display")
				.text(`-${format_currency(breakdown.promo_discount)}`);
			$wrap.find(".imogi-pay-promo-breakdown-row").toggle(breakdown.promo_discount > 0);
			$wrap.find(".imogi-pay-taxable-value").text(format_currency(breakdown.taxable_amount));
			$wrap.find(".imogi-pay-tax-value").text(format_currency(breakdown.tax_amount));
			dialog.get_primary_btn?.()?.html(
				`${__("Bayar Item Terpilih")} · ${format_currency(breakdown.grand_total)}`
			);
		};

		if (!this.needs_checkout_preview()) {
			const subtotal = selected.reduce((sum, row) => sum + flt(row.rate) * flt(row.qty), 0);
			const tax = imogi_compute_local_tax(subtotal, this.context?.sales_tax || {});
			paint_totals({ subtotal, promo_discount: 0, ...tax });
			return;
		}

		clearTimeout(dialog._imogi_split_preview_timer);
		dialog._imogi_split_preview_timer = setTimeout(() => {
			frappe.call({
				method: "imogi_pos.api.loyalty_api.preview_promotions",
				args: {
					items: JSON.stringify(
						selected.map((row) => ({
							item_code: row.item_code,
							qty: row.qty,
							rate: row.rate,
							uom: row.uom || undefined,
						}))
					),
					...me.branch_api_args(),
				},
				callback(r) {
					if (r.exc || dialog._imogi_pay_tab !== "split") return;
					const totals = r.message || {};
					dialog._imogi_split_tab_preview = totals;
					paint_totals(totals);
				},
			});
		}, 200);
	}

	apply_split_selection_from_dialog(dialog) {
		if (!this.require_feature("split_bill")) return false;
		const source = dialog._imogi_split_cart_snapshot || this.cart;
		const picked = [];
		const remain = [];
		dialog.$wrapper.find(".imogi-split-item").each(function () {
			const idx = cint($(this).data("idx"));
			if ($(this).is(":checked")) picked.push(idx);
			else remain.push(idx);
		});
		if (!picked.length) {
			frappe.msgprint(__("Pilih minimal 1 item"));
			return false;
		}
		const checkout_cart = picked.map((idx) => ({ ...source[idx] }));
		const remainder_cart = remain.map((idx) => ({ ...source[idx] }));

		this._split_checkout_cart = checkout_cart;
		this._split_checkout_active = true;
		this._split_remainder = remainder_cart;
		this._remainder_promo_discount = 0;
		this.cart = remainder_cart.length ? remainder_cart : checkout_cart;
		this.payment_preview = null;
		this.promo_discount = 0;
		this.applied_promos = [];
		dialog._imogi_split_tab_preview = null;

		this.render_cart();
		if (remainder_cart.length) {
			this.$cart_items.prepend(
				`<div class="alert alert-info small imogi-split-remainder-hint" style="margin-bottom:8px">${__(
					"Item di bawah menunggu pembayaran setelah transaksi ini selesai."
				)}</div>`
			);
			frappe.show_alert({
				message: __("Membayar {0} item sekarang. Sisa {1} item tetap di keranjang.", [
					checkout_cart.length,
					remainder_cart.length,
				]),
				indicator: "blue",
			});
		}

		const origClear = this.clear_cart_after_checkout;
		this.clear_cart_after_checkout = function () {
			this.marketplace_order_name = null;
			this.pending_checkout_order_name = null;
			this.voucher_code = "";
			this.loyalty_points_redeem = 0;
			this.payment_preview = null;
			this.promo_discount = 0;
			this.applied_promos = [];
			this.discount_type = "";
			this.discount_value = 0;
			this._split_checkout_cart = null;
			this._split_checkout_active = false;
			this._split_remainder = null;
			this._remainder_promo_discount = 0;
			this.wrapper.find(".imogi-split-remainder-hint").remove();
			if (!this.cart.length) {
				this.render_cart();
			}
			this._invalidate_catalog_cache();
			this.load_items({ force: true });
			this.load_holds();
			this.clear_cart_after_checkout = origClear;
		};
		return true;
	}

	resync_awaiting_order_after_split(dialog, done) {
		const me = this;
		const old_name = dialog._imogi_pending_order_name || me.pending_checkout_order_name;
		const submit_new = () => {
			frappe.call({
				method: "imogi_pos.api.cashier.submit_awaiting_order",
				args: me.build_submit_awaiting_args(),
				callback(r) {
					if (!r.exc) {
						const order = r.message || {};
						me.pending_checkout_order_name = order.name || null;
						dialog._imogi_pending_order_name = order.name || null;
					}
					done?.();
				},
			});
		};
		if (!old_name) {
			submit_new();
			return;
		}
		frappe.call({
			method: "imogi_pos.api.cashier.void_cashier_order",
			args: { order_name: old_name, reason: __("Split bill") },
			callback(r) {
				me.pending_checkout_order_name = null;
				dialog._imogi_pending_order_name = null;
				if (r.exc) {
					done?.();
					return;
				}
				submit_new();
			},
		});
	}

	finish_split_payment_setup(dialog) {
		const me = this;
		const subtotal = this.get_cart_subtotal_for_checkout();
		this.payment_preview = null;
		dialog._imogi_paid_amount = null;
		dialog._imogi_quick_denom = "pas";
		dialog._imogi_last_checkout_total = null;
		const run = () => {
			dialog._imogi_pay_tab = "single";
			me.setup_payment_tabs(dialog, subtotal, "single");
			if (me.needs_checkout_preview()) {
				me.refresh_payment_preview(dialog, subtotal);
			} else {
				me.refresh_payment_dialog(dialog, subtotal);
			}
			me.toggle_cash_fields(dialog, subtotal);
		};
		this.resync_awaiting_order_after_split(dialog, run);
	}

	setup_payment_layout(dialog) {}

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

	open_payment_dialog(options = {}) {
		if (!this.cart.length || this.busy) return;
		this.close_mobile_cart();
		if (this.enable_pos_shift && this.requires_shift_workflow && !this.pos_opening) {
			frappe.msgprint(__("Buka shift kasir dulu sebelum checkout."));
			this.prompt_open_shift();
			return;
		}
		if (this.pending_checkout_order_name) {
			this._open_payment_dialog_ui(options);
			return;
		}
		this.busy = true;
		this.update_mobile_dock();
		frappe.call({
			method: "imogi_pos.api.cashier.submit_awaiting_order",
			args: this.build_submit_awaiting_args(),
			freeze: true,
			freeze_message: __("Mencatat order..."),
			callback: (r) => {
				this.busy = false;
				this.update_mobile_dock();
				if (r.exc) {
					const msg = (r._server_messages || "").toString();
					if (
						msg.includes("Perlu Approval") &&
						imogi_pos.cashier_extras &&
						imogi_pos.cashier_extras.prompt_supervisor_pin
					) {
						imogi_pos.cashier_extras.prompt_supervisor_pin(this, (code) => {
							this._pending_approval_code = code;
							this.open_payment_dialog(options);
						});
					}
					return;
				}
				this._pending_approval_code = null;
				const order = r.message || {};
				this.pending_checkout_order_name = order.name || this.marketplace_order_name || null;
				this._open_payment_dialog_ui(options);
			},
		});
	}

	build_submit_awaiting_args(extra = {}) {
		const args = {
			items: JSON.stringify(
				this.get_checkout_cart().map((row) => ({
					item_code: row.item_code,
					qty: row.qty,
					rate: row.rate,
					uom: row.uom || undefined,
				}))
			),
			...this.branch_api_args(),
			...extra,
		};
		if (this.selected_customer) args.customer = this.selected_customer;
		if (this.discount_type) {
			args.discount_type = this.discount_type;
			args.discount_value = this.discount_value;
		}
		if (this.voucher_code) args.voucher_code = this.voucher_code;
		if (this.loyalty_points_redeem) args.loyalty_points_redeem = this.loyalty_points_redeem;
		args.order_type = this.order_type || "Takeaway";
		if (this.marketplace_order_name) args.marketplace_order_name = this.marketplace_order_name;
		if (this.selected_table) args.restaurant_table = this.selected_table;
		if (this._pending_approval_code) args.approval_code = this._pending_approval_code;
		return args;
	}

	build_checkout_args(extra = {}) {
		const args = this.build_submit_awaiting_args(extra);
		return args;
	}

	void_pending_checkout_order(order_name, options = {}) {
		const reason = options.reason || __("Dibatalkan di kasir");
		const run = (approval_code) => {
			frappe.call({
				method: "imogi_pos.api.cashier.void_cashier_order",
				args: {
					order_name,
					reason,
					approval_code: approval_code || undefined,
				},
				freeze: true,
				freeze_message: __("Membatalkan order..."),
				callback: (r) => {
					if (r.exc) {
						const msg = (r._server_messages || "").toString();
						if (
							msg.includes("Perlu Approval") ||
							msg.includes("approval") ||
							msg.includes("Approval")
						) {
							this.prompt_void_supervisor_approval(order_name, reason, options.on_done);
							return;
						}
						if (imogi_pos.feature_upgrade) {
							imogi_pos.feature_upgrade.from_server_error(this, r.exc);
						}
						options.on_fail?.();
						return;
					}
					if (this.pending_checkout_order_name === order_name) {
						this.pending_checkout_order_name = null;
					}
					if (this.marketplace_order_name === order_name) {
						this.marketplace_order_name = null;
					}
					this.refresh_marketplace_badge();
					frappe.show_alert({
						message: __("Order {0} dibatalkan", [order_name]),
						indicator: "orange",
					});
					options.on_done?.(r.message || {});
				},
			});
		};
		run(options.approval_code);
	}

	prompt_void_supervisor_approval(order_name, reason, on_done) {
		frappe.prompt(
			[{ fieldname: "pin", fieldtype: "Password", label: __("PIN Supervisor"), reqd: 1 }],
			(values) => {
				frappe.call({
					method: "imogi_pos.api.approval_api.request_approval",
					args: {
						approval_type: "Void",
						reference_name: order_name,
						reason,
					},
					callback: (req) => {
						const name = (req.message || {}).name;
						frappe.call({
							method: "imogi_pos.api.approval_api.approve_with_pin",
							args: { request_name: name, pin: values.pin },
							callback: () => {
								this.void_pending_checkout_order(order_name, {
									reason,
									approval_code: name,
									on_done,
								});
							},
						});
					},
				});
			},
			__("Approval Void"),
			__("Setujui")
		);
	}

	cancel_pending_payment_dialog(dialog) {
		const order_name = dialog._imogi_pending_order_name || this.pending_checkout_order_name;
		if (!order_name) {
			dialog._imogi_void_confirmed = true;
			dialog.hide();
			return;
		}
		frappe.confirm(
			__("Order {0} sudah tercatat menunggu pembayaran. Batalkan order ini?", [order_name]),
			() => {
				this.void_pending_checkout_order(order_name, {
					on_done: () => {
						dialog._imogi_void_confirmed = true;
						dialog._imogi_checkout_completed = true;
						dialog.hide();
						this.clear_cart_after_checkout();
					},
					on_fail: () => {},
				});
			},
			() => {}
		);
	}

	_open_payment_dialog_ui(options = {}) {
		const initial_tab = options.tab || "single";
		this.payment_preview = null;
		const subtotal = this.get_cart_subtotal();
		const modes = (this.context.payment_modes || []).map((m) => m.mode_of_payment);
		const default_mode = this.context.default_payment_mode || modes[0];
		const me = this;
		const pending_order_name = this.pending_checkout_order_name || this.marketplace_order_name || null;

		const initial_total = imogi_compute_local_tax(
			Math.max(0, subtotal),
			me.context?.sales_tax || {}
		).grand_total;

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
					fieldtype: "HTML",
					fieldname: "cash_quick_html",
					options: me.build_payment_detail_html(initial_total),
				},
				{
					fieldname: "mode_of_payment",
					fieldtype: "Data",
					hidden: 1,
					default: default_mode,
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
				},
			],
			primary_action_label: __("Bayar Sekarang"),
			primary_action: (values) => {
				if (me.busy) return;
				if (dialog._imogi_pay_tab === "split") {
					if (!me.apply_split_selection_from_dialog(dialog)) return;
					me.finish_split_payment_setup(dialog);
					return;
				}
				const checkout_subtotal = me.get_cart_subtotal_for_checkout();
				const total = me.get_payment_total(dialog, checkout_subtotal);
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
				if (me.is_qris_payment_mode(values.mode_of_payment)) {
					if (!me.require_feature("qris")) return;
					if (dialog._imogi_qris_paid) return;
					if (!dialog._imogi_qris_payment_name) {
						me.load_inline_qris(dialog, checkout_subtotal);
					}
					frappe.show_alert({
						message: __("Scan QRIS untuk menyelesaikan pembayaran"),
						indicator: "blue",
					});
					return;
				}
				if (me.is_cash_mode(values.mode_of_payment)) {
					const paid = me.get_dialog_paid_amount(dialog) || flt(values.paid_amount);
					if (paid < total) {
						frappe.msgprint(__("Uang diterima kurang dari total"));
						return;
					}
				}
				const paid_amount = me.get_dialog_paid_amount(dialog) || flt(values.paid_amount);
				me.checkout(dialog, values.mode_of_payment, total, paid_amount);
			},
		});

		dialog.$wrapper.addClass("imogi-pay-dialog");
		dialog._imogi_pending_order_name = pending_order_name;
		dialog._imogi_checkout_completed = false;
		dialog._imogi_void_confirmed = false;
		dialog._imogi_multi_qris_paid = false;
		dialog._imogi_multi_qris_payment_name = null;
		dialog._imogi_multi_qris_amount = null;
		dialog._imogi_paid_amount = Math.round(flt(initial_total));
		dialog._imogi_quick_denom = "pas";
		dialog._imogi_last_checkout_total = null;
		dialog._imogi_payment_mode = default_mode;
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
				dialog._imogi_paid_amount = null;
				dialog._imogi_quick_denom = null;
				me.stop_inline_qris_poll(dialog);
				dialog._imogi_qris_payment_name = null;
				dialog._imogi_qris_total = null;
				dialog._imogi_qris_paid = false;
				dialog._imogi_multi_qris_paid = false;
				dialog._imogi_multi_qris_payment_name = null;
				dialog._imogi_multi_qris_amount = null;
				dialog._imogi_pending_multi_payments = null;
				dialog._imogi_payment_mode = null;
			});
			dialog.$wrapper.on("hidden.bs.modal", () => {
				if (
					!dialog._imogi_checkout_completed &&
					!dialog._imogi_void_confirmed &&
					dialog._imogi_pending_order_name
				) {
					frappe.show_alert({
						message: __(
							"Order {0} menunggu pembayaran. Tekan Bayar Sekarang untuk melanjutkan.",
							[dialog._imogi_pending_order_name]
						),
						indicator: "blue",
					});
				}
			});
		}

		dialog.$wrapper.off("click.imogiQuickPay", ".imogi-pay-quick-btn");
		dialog.$wrapper.on("click.imogiQuickPay", ".imogi-pay-quick-btn", function (e) {
			e.preventDefault();
			e.stopPropagation();
			const $btn = $(this);
			if ($btn.prop("disabled") || $btn.hasClass("is-disabled")) return;
			const denom = String($btn.attr("data-quick-denom") || "").toLowerCase();
			const total = me.get_payment_total(dialog, subtotal);
			const amount = me.get_cash_quick_preset_amount(denom, total);
			if (!amount) return;
			me.apply_quick_paid_amount(dialog, subtotal, amount, denom);
		});

		dialog.fields_dict.paid_amount?.$input?.on("input change", () => {
			if (dialog._imogi_paid_syncing) return;
			const total = me.get_payment_total(dialog, subtotal);
			const paid = Math.round(flt(dialog.get_value("paid_amount")) || 0);
			dialog._imogi_paid_amount = paid;
			dialog._imogi_quick_denom = null;
			me.update_change_display(dialog, total, paid);
			me.update_cash_quick_feedback(dialog, subtotal, paid);
			me.sync_cash_quick_selection(dialog, total, paid, null);
		});

		dialog.show();
		this.setup_payment_shell(dialog);
		this.setup_payment_header(dialog);
		this.setup_payment_tabs(dialog, subtotal, initial_tab);
		this.setup_payment_layout(dialog);
		this.setup_payment_footer(dialog, subtotal);
		this.setup_payment_mode_cards(dialog, subtotal);
		this.setup_transfer_copy_buttons(dialog);
		this.setup_payment_discount_ui(dialog, subtotal);
		if (
			this.context.loyalty_enabled &&
			imogi_pos.loyalty &&
			(this.feature_allowed("point_reward") || this.feature_allowed("voucher"))
		) {
			imogi_pos.loyalty.setup_payment_ui(this, dialog, subtotal);
		}
		this.toggle_cash_fields(dialog, subtotal, default_mode);
		this.setup_mobile_pay_numpad(dialog, subtotal);
		if (this.needs_checkout_preview()) {
			this.refresh_payment_preview(dialog, subtotal);
		} else {
			this.refresh_payment_dialog(dialog, subtotal);
		}
		this.finalize_mobile_pay_dialog(dialog);
		this.finalize_payment_dialog_layout(dialog);
		if (initial_tab === "multi") {
			this.render_multi_payment_panel(dialog, subtotal);
		}
		const sync_payment_ui = () => me.toggle_cash_fields(dialog, subtotal, default_mode);
		requestAnimationFrame(sync_payment_ui);
		setTimeout(sync_payment_ui, 0);
	}

	toggle_cash_fields(dialog, subtotal, mode_override = null) {
		const mode = mode_override || this.get_payment_dialog_mode(dialog);
		dialog._imogi_payment_mode = mode;
		if (mode) {
			dialog.set_value("mode_of_payment", mode);
			if (dialog.doc) dialog.doc.mode_of_payment = mode;
		}
		const pay_subtotal =
			subtotal != null ? flt(subtotal) : this.get_cart_subtotal_for_checkout();
		const is_qris = this.is_inline_qris_mode(mode);
		const is_transfer = this.is_transfer_payment_mode(mode);
		const is_cash = !is_qris && !is_transfer && this.is_cash_mode(mode);
		const total = this.get_payment_total(dialog, pay_subtotal);
		dialog.fields_dict.paid_amount?.$wrapper?.hide();
		const $wrap = dialog.$wrapper;
		$wrap.toggleClass("imogi-pay-cash-mode", is_cash);
		$wrap.toggleClass("imogi-pay-qris-mode", is_qris);
		$wrap.toggleClass("imogi-pay-transfer-mode", is_transfer);
		this.sync_payment_detail_panels(dialog, is_cash, is_qris, is_transfer);
		$wrap.find(".imogi-pay-numpad-wrap").toggleClass("is-visible", is_cash && this.is_mobile_layout());
		$wrap.find(".imogi-pay-qris-hint").hide();
		$wrap.find(".imogi-pay-noncash-hint").toggle(!is_cash && !is_qris && !is_transfer);
		if (!is_qris) {
			this.stop_inline_qris_poll(dialog);
			dialog._imogi_qris_payment_name = null;
			dialog._imogi_qris_total = null;
			dialog._imogi_qris_paid = false;
		}
		if (is_cash) {
			let paid = this.get_dialog_paid_amount(dialog);
			if (!paid) {
				paid = this.set_dialog_paid_amount(dialog, total);
				dialog._imogi_quick_denom = "pas";
			}
			this.update_change_display(dialog, total, paid);
			this.update_cash_quick_feedback(dialog, pay_subtotal, paid);
			this.sync_cash_quick_selection(dialog, total, paid);
		}
		if (is_qris) {
			this.load_inline_qris(dialog, pay_subtotal);
		}
		if (is_transfer) {
			this.refresh_transfer_panel(dialog, pay_subtotal);
		}
	}

	update_change_display(dialog, total, paid_amount = null) {
		const $box = dialog.$wrapper.find(".imogi-pay-change-box");
		if (!$box.length) return;
		const paid = paid_amount != null ? flt(paid_amount) : this.get_dialog_paid_amount(dialog);
		const change = paid - total;
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

		const checkout_subtotal = this.get_cart_subtotal_for_checkout();
		const args = {
			...this.build_submit_awaiting_args(),
			payments: JSON.stringify([{ mode_of_payment, amount: total }]),
			total,
		};
		if (this.marketplace_order_name) {
			args.marketplace_order_name = this.marketplace_order_name;
		}
		if (this.pending_checkout_order_name) args.order_name = this.pending_checkout_order_name;

		const checkout_breakdown = this.get_checkout_breakdown(dialog, checkout_subtotal);
		const finish = (order, change) => {
			dialog._imogi_checkout_completed = true;
			this.pending_checkout_order_name = null;
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
		this.pending_checkout_order_name = null;
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

		const actions_html = (() => {
			const secondary = actions.filter((action) => !action.primary);
			const primary = actions.filter((action) => action.primary);
			const render_btn = (action) => `<button type="button"
				class="imogi-success-action-btn${action.primary ? " is-primary" : ""}"
				data-action="${action.id}">
				<span class="imogi-success-action-icon"><i class="fa ${action.icon}"></i></span>
				<span class="imogi-success-action-label">${action.label}</span>
			</button>`;
			return `<div class="imogi-success-actions-grid">${secondary.map(render_btn).join("")}</div>
				${primary.map(render_btn).join("")}`;
		})();

		const dialog = new frappe.ui.Dialog({
			title: __("Transaksi Berhasil"),
			fields: [
				{
					fieldtype: "HTML",
					options: `<div class="imogi-pay-success-body">
						<div class="imogi-pay-success-hero">
							<div class="imogi-pay-success-icon-wrap"><i class="fa fa-check"></i></div>
							<div class="imogi-pay-success-order">${frappe.utils.escape_html(order.name || "")}</div>
							<div class="imogi-pay-success-subtitle">${__("Pembayaran berhasil diproses")}</div>
						</div>
						${summary_html}
						${stamp_html}
						<div class="imogi-pay-success-footer-meta">
							<span class="imogi-pay-success-status-pill">${__("Status")}: ${frappe.utils.escape_html(order.status || __("Completed"))}</span>
						</div>
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

		dialog.$wrapper.addClass("imogi-pay-success-dialog");
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
