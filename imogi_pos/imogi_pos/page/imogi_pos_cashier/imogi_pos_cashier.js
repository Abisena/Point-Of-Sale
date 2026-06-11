frappe.provide("imogi_pos");

frappe.pages["imogi-pos-cashier"].on_page_load = function (wrapper) {
	inject_cashier_css();
	imogi_pos.sync_desk_theme?.();

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

	$bar.find(".imogi-cashier-close-shift-btn").css({
		background: "rgba(255, 255, 255, 0.12)",
		border: "1px solid rgba(255, 255, 255, 0.24)",
		borderRadius: "8px",
		color: "#fff",
		fontWeight: "700",
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
		.imogi-cashier-shift-text { color: rgba(255,255,255,0.92) !important; font-size: 13px; font-weight: 700; }
		.imogi-cashier-shift-text .fa { color: rgba(255,255,255,0.72) !important; }
		.imogi-cashier-shift-text a { color: #fff !important; font-weight: 800; text-decoration: underline; }
		.imogi-cashier-shift-bar .imogi-cashier-close-shift-btn { background: rgba(255,255,255,0.12) !important; border: 1px solid rgba(255,255,255,0.24) !important; border-radius: 8px !important; color: #fff !important; font-weight: 700 !important; }
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
		.imogi-cashier-cart-mobile-head, .imogi-cashier-cart-close { display: none; }
		@media (max-width: 992px) {
			.imogi-cashier-page.layout-main-section,
			.imogi-cashier-page { padding: 8px 8px 0 !important; }
			.imogi-cashier-shell {
				display: flex;
				flex: 1;
				flex-direction: column;
				gap: 0;
				grid-template-columns: 1fr;
				min-height: 0;
				overflow: hidden;
				padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px));
			}
			.imogi-cashier-panel.imogi-cashier-products { border-radius: 16px; flex: 1; min-height: 0; }
			.imogi-cashier-grid.items-container { grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); padding-bottom: 12px; }
			.imogi-cashier-panel.imogi-cashier-cart {
				border-left: none;
				border-radius: 16px 16px 0 0;
				border-right: none;
				bottom: calc(76px + env(safe-area-inset-bottom, 0px));
				box-shadow: 0 -12px 40px rgba(24,24,27,.16);
				display: flex;
				flex-direction: column;
				height: auto;
				left: 0;
				max-height: none;
				overflow: hidden;
				position: fixed;
				right: 0;
				top: calc(48px + env(safe-area-inset-top, 0px));
				transform: translateY(calc(100% + 76px + env(safe-area-inset-bottom, 0px)));
				transition: transform .25s ease;
				z-index: 1040;
			}
			.imogi-cashier-page.is-mobile-cart-open .imogi-cashier-panel.imogi-cashier-cart { transform: translateY(0); }
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
			.imogi-cashier-cart-items {
				flex: 1 1 auto;
				max-height: none;
				min-height: 0;
				overflow-x: hidden;
				overflow-y: auto;
				overscroll-behavior: contain;
				-webkit-overflow-scrolling: touch;
			}
			.imogi-cashier-cart-foot {
				flex-shrink: 0;
				max-height: min(46vh, 360px);
				overflow-x: hidden;
				overflow-y: auto;
				overscroll-behavior: contain;
				-webkit-overflow-scrolling: touch;
			}
			.imogi-cashier-cart-foot .imogi-cashier-pay { display: none; }
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
			.imogi-cashier-cart-close:hover { background: rgba(255,255,255,0.22); color: #fff; }
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
				padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0px));
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
		.imogi-cashier-btn-primary:hover, .imogi-cashier-btn-primary:focus { background: #1a3352 !important; color: #fff !important; }
		.imogi-cashier-btn-primary:disabled { opacity: .4; }
		.imogi-cashier-hold-list-btn { font-size: 11px !important; font-weight: 700; }
		.imogi-cashier-toolbar { background: #fafafa; border-bottom: 1px solid #e4e4e7; flex-shrink: 0; padding: 14px 16px; }
		.imogi-cashier-search { background: #fafafa !important; border: 1px solid #e4e4e7 !important; border-radius: 10px !important; font-size: 15px !important; padding: 10px 14px !important; }
		.imogi-cashier-search:focus { background: #fff !important; border-color: #a1a1aa !important; box-shadow: none !important; }
		.imogi-cashier-groups { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
		.imogi-cashier-group-btn { background: #fff; border: 1px solid #d4d4d8; border-radius: 999px; color: #71717a; cursor: pointer; font-size: 12px; font-weight: 700; padding: 7px 14px; }
		.imogi-cashier-group-btn.is-active { background: #0f1f35; border-color: #0f1f35; color: #fff; }
		.imogi-cashier-panel.imogi-cashier-products { flex: 1; min-height: 0; overflow: hidden; }
		.imogi-cashier-panel.imogi-cashier-cart { display: flex; flex-direction: column; height: 100%; max-height: 100%; min-height: 0; overflow: hidden; }
		.imogi-cashier-grid.items-container { align-content: start; display: grid; flex: 1 1 auto; gap: 12px; grid-auto-rows: max-content; grid-template-columns: repeat(auto-fill, minmax(168px, 1fr)); min-height: 0; overflow-x: hidden; overflow-y: auto; padding: 14px; padding-bottom: 20px; -webkit-overflow-scrolling: touch; }
		.imogi-cashier-grid.items-container::after { content: ""; display: block; height: 1px; }
		.imogi-cashier-cart-items { flex: 1 1 auto; min-height: 0; overflow-x: hidden; overflow-y: auto; padding: 8px 12px; -webkit-overflow-scrolling: touch; }
		.imogi-cashier-page .items-container .item-wrapper { background: #fff; border: 1px solid #e8ecf1; border-radius: 12px; box-shadow: 0 1px 3px rgba(15,31,53,.06), 0 4px 12px rgba(15,31,53,.04); cursor: pointer; display: flex; flex-direction: column; height: auto; overflow: hidden; position: relative; transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease; user-select: none; }
		.imogi-cashier-page .items-container .item-wrapper.is-out { opacity: .55; pointer-events: none; }
		.imogi-cashier-page .items-container .item-wrapper:hover:not(.is-out) { border-color: #c7d2e0; box-shadow: 0 6px 20px rgba(15,31,53,.12); transform: translateY(-2px); }
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
		.imogi-cashier-loading, .imogi-cashier-empty { align-items: center; color: #94a3b8; display: flex; flex-direction: column; gap: 10px; grid-column: 1/-1; justify-content: center; min-height: 220px; }
		.imogi-cashier-cart-empty { color: #94a3b8; padding: 40px 16px; text-align: center; }
		.imogi-cart-row { align-items: center; border-bottom: 1px solid #f1f5f9; display: grid; gap: 8px; grid-template-columns: minmax(0, 1fr) 108px 100px; padding: 12px 6px; }
		.imogi-cart-row-info { min-width: 0; overflow: hidden; }
		.imogi-cart-row-name { color: #0f172a; font-size: 13px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
		.imogi-cart-row-meta { color: #94a3b8; font-size: 11px; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
		.imogi-cart-row-actions { align-items: center; display: flex; flex-shrink: 0; gap: 6px; justify-content: center; width: 108px; }
		.imogi-qty-btn { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; color: #0f1f35; cursor: pointer; flex-shrink: 0; font-size: 16px; font-weight: 700; height: 34px; width: 34px; }
		.imogi-qty-btn:hover { background: #fff; border-color: #0f1f35; color: #0f1f35; }
		.imogi-cart-qty { display: inline-block; font-size: 14px; font-weight: 800; text-align: center; width: 32px; }
		.imogi-cart-row-amount { color: #0f1f35; font-size: 13px; font-variant-numeric: tabular-nums; font-weight: 800; text-align: right; white-space: nowrap; width: 100px; }
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
		.imogi-cashier-pay:hover, .imogi-cashier-pay:focus { background: #1a3352 !important; color: #fff !important; }
		.imogi-cashier-pay:disabled { box-shadow: none !important; opacity: .4; }
		.imogi-pay-change-box { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 10px; color: #0f1f35; font-size: 22px; font-weight: 800; margin-top: 10px; padding: 12px; text-align: center; }
		.imogi-pay-change-box.is-short { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
		.imogi-pay-quick-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
		.imogi-pay-quick-btn { background: #fff; border: 1px solid #d4d4d8; border-radius: 8px; color: #0f1f35; cursor: pointer; flex: 1; font-size: 12px; font-weight: 700; min-width: 70px; padding: 8px 6px; }
		.imogi-pay-quick-btn:hover { background: #fafafa; border-color: #0f1f35; color: #0f1f35; }
		.imogi-pay-discount-wrap { margin-bottom: 12px; }
		.imogi-pay-discount-toggle { align-items: center; background: #fafafa; border: 1px dashed #d4d4d8; border-radius: 10px; color: #0f1f35; cursor: pointer; display: flex; font-size: 13px; font-weight: 700; gap: 8px; padding: 10px 12px; width: 100%; }
		.imogi-pay-discount-toggle:hover { background: #fff; border-color: #0f1f35; }
		.imogi-pay-discount-toggle.is-open { background: #f8fafc; border-color: #0f1f35; border-style: solid; }
		.imogi-pay-discount-panel { display: none; margin-top: 10px; }
		.imogi-pay-discount-panel.is-open { display: block; }
		.imogi-pay-discount-row { align-items: center; display: flex; gap: 8px; margin-bottom: 10px; }
		.imogi-pay-discount-row select, .imogi-pay-discount-row input { flex: 1; font-size: 13px !important; min-width: 0; }
		.imogi-pay-promo-wrap { margin-bottom: 12px; }
		.imogi-pay-promo-toggle { align-items: center; background: #fff7ed; border: 1px dashed #fdba74; border-radius: 10px; color: #9a3412; cursor: pointer; display: flex; font-size: 13px; font-weight: 700; gap: 8px; padding: 10px 12px; width: 100%; }
		.imogi-pay-promo-toggle.is-open, .imogi-pay-promo-toggle:hover { background: #ffedd5; border-color: #ea580c; border-style: solid; }
		.imogi-pay-promo-panel { display: none; margin-top: 10px; }
		.imogi-pay-promo-panel.is-open { display: block; }
		.imogi-pay-voucher-row, .imogi-pay-loyalty-input-row { align-items: center; display: flex; gap: 8px; margin-bottom: 8px; }
		.imogi-pay-voucher-row input, .imogi-pay-loyalty-input-row input { flex: 1; min-width: 0; }
		.imogi-pay-loyalty-row { margin-top: 8px; }
		.imogi-pos-offline-bar { background: #7f1d1d; color: #fff; display: none; font-size: 12px; font-weight: 700; left: 0; padding: 8px 12px; position: fixed; right: 0; text-align: center; top: 0; z-index: 99999; }
		.imogi-pos-offline-bar.is-visible { display: block; }
		.imogi-cashier-promo-hint { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; color: #047857; font-size: 11px; font-weight: 700; margin-bottom: 8px; padding: 8px 10px; }
		@media (pointer: coarse) {
			.imogi-cashier-group-btn, .imogi-qty-btn, .imogi-pay-quick-btn, .imogi-cashier-order-type-btn { min-height: 44px; }
		}
		.imogi-pay-breakdown-row { align-items: baseline; color: #64748b; display: flex; font-size: 12px; justify-content: space-between; margin-bottom: 4px; }
		.imogi-pay-breakdown-row strong { color: #0f1f35; font-variant-numeric: tabular-nums; }
		.imogi-pay-breakdown-row.is-discount strong { color: #be123c; }
		.imogi-pay-numpad-wrap { display: none; margin-top: 10px; }
		.imogi-pay-numpad-wrap.is-visible { display: block; }
		.imogi-pay-numpad { display: grid; gap: 8px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
		.imogi-pay-numpad-key { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 10px; color: #0f1f35; cursor: pointer; font-size: 20px; font-variant-numeric: tabular-nums; font-weight: 800; height: 48px; padding: 0; touch-action: manipulation; }
		.imogi-pay-numpad-key:active { background: #0f1f35; border-color: #0f1f35; color: #fff; }
		.imogi-pay-dialog.imogi-pay-mobile .imogi-pay-numpad-wrap.is-visible { display: block; }
		.imogi-pay-dialog.imogi-pay-mobile .frappe-control[data-fieldname="paid_amount"] input { caret-color: transparent; cursor: pointer; }
		.imogi-cashier-customer-label { line-height: 1.25; margin-bottom: 6px !important; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
		.imogi-cashier-meta { color: rgba(255,255,255,0.65); font-size: 12px; }
		.imogi-cashier-branch-row { align-items: center; display: none; gap: 8px; margin-bottom: 10px; }
		.imogi-cashier-branch-row.is-visible { display: flex; }
		.imogi-cashier-branch-row .fa { color: #0f1f35; flex-shrink: 0; font-size: 14px; }
		.imogi-cashier-branch-select { flex: 1; font-size: 13px !important; font-weight: 700; min-width: 0; }
		.imogi-pay-success-dialog .modal-footer { display: none !important; }
		.imogi-success-actions { border-top: 1px solid #f1f5f9; display: grid; gap: 10px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 18px; padding-top: 16px; text-align: left; }
		.imogi-success-action-btn { align-items: center; background: #fff; border: 1px solid #e4e4e7; border-radius: 12px; color: #0f1f35; cursor: pointer; display: flex; flex-direction: column; gap: 6px; justify-content: center; min-height: 78px; padding: 12px 10px; transition: border-color .15s, background .15s, transform .1s; }
		.imogi-success-action-btn:hover { background: #fafafa; border-color: #0f1f35; transform: translateY(-1px); }
		.imogi-success-action-btn.is-primary { background: #0f1f35; border-color: #0f1f35; color: #fff; flex-direction: row; gap: 10px; grid-column: 1 / -1; min-height: 48px; }
		.imogi-success-action-btn.is-primary:hover { background: #1a3352; color: #fff; }
		.imogi-success-action-icon { align-items: center; background: #f8fafc; border-radius: 10px; color: #0f1f35; display: flex; font-size: 18px; height: 36px; justify-content: center; width: 36px; }
		.imogi-success-action-btn.is-primary .imogi-success-action-icon { background: rgba(255,255,255,.12); color: #fff; font-size: 16px; height: auto; width: auto; }
		.imogi-success-action-label { font-size: 12px; font-weight: 800; line-height: 1.2; text-align: center; }
		.imogi-success-action-btn.is-primary .imogi-success-action-label { font-size: 14px; }
		body.imogi-cashier-active #alert-container,
		body.imogi-cashier-active .alert-message-container {
			bottom: auto !important;
			left: 12px !important;
			right: 12px !important;
			top: calc(12px + env(safe-area-inset-top, 0px)) !important;
			width: auto !important;
		}
		body.imogi-cashier-active #alert-container .alert-message,
		body.imogi-cashier-active .alert-message-container .alert-message {
			margin: 0 0 8px !important;
			max-width: 100% !important;
		}
	`, "imogi-cashier-inline-css-v24");
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

function round_up_cash(amount, step) {
	return Math.ceil(flt(amount) / step) * step;
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
		this.pos_opening = null;
		this.enable_pos_shift = false;
		this.requires_shift_workflow = false;
		this.mobile_cart_open = false;
		this._catalog_mem = {};
		this.variant_picker = new imogi_pos.VariantPicker(this);
		this.make();
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
				<div class="imogi-cashier-status-strip">
					<button type="button" class="imogi-status-chip imogi-chip-target" title="${__(
						"Target omzet"
					)}"></button>
					<button type="button" class="imogi-status-chip imogi-chip-history is-visible" title="${__(
						"Riwayat order"
					)}">
						<i class="fa fa-history"></i>
						<span>${__("Riwayat")}</span>
					</button>
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
						<div class="imogi-cashier-branch-row">
							<i class="fa fa-map-marker" aria-hidden="true"></i>
							<select class="form-control input-sm imogi-cashier-branch-select" aria-label="${__(
								"Cabang"
							)}"></select>
						</div>
						<input type="search" class="form-control imogi-cashier-search" placeholder="${__(
							"Cari produk atau scan barcode..."
						)}" autocomplete="off" />
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
					<div class="imogi-cashier-cart-items"></div>
					<div class="imogi-cashier-cart-foot">
						<div class="imogi-cashier-order-type-row">
							<div class="imogi-cashier-order-type-label">${__("Tipe Order")}</div>
							<div class="imogi-cashier-order-types">${IMOGI_ORDER_TYPES.map(
								(row) => `<button type="button" class="imogi-cashier-order-type-btn${
									row.value === this.order_type ? " is-active" : ""
								}" data-type="${row.value}">
									<i class="fa ${row.icon}"></i>
									<span>${row.label}</span>
								</button>`
							).join("")}</div>
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
		this.$branch_row = this.wrapper.find(".imogi-cashier-branch-row");
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
		this.$history_chip = this.wrapper.find(".imogi-chip-history");
		this.$marketplace_chip = this.wrapper.find(".imogi-chip-marketplace");
		this.$offline_chip = this.wrapper.find(".imogi-chip-offline");
		this.$offline_badge = this.wrapper.find(".imogi-cashier-offline-badge");
		this.$target_chip.on("click", () => this.open_target_detail());
		this.$history_chip.on("click", () => {
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
		$(window).on("resize.imogi-cashier", () => {
			if (!this.is_mobile_layout()) this.close_mobile_cart();
		});
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

	render_branch_picker() {
		if (!this.$branch_row?.length) return;
		const branches = this.context?.branches || [];
		const show = cint(this.context?.multi_branch_enabled) && branches.length > 1;
		if (!show) {
			this.$branch_row.removeClass("is-visible");
			return;
		}

		const locked = cint(this.context?.branch_locked_by_shift);
		this.$branch_select.prop("disabled", locked);
		this.$branch_row.toggleClass("is-locked", locked);

		const active = this.get_active_branch_code();
		this.$branch_select.html(
			branches
				.map((row) => {
					const label = row.city
						? `${row.branch_name} (${row.city})`
						: row.branch_name || row.branch_code;
					return `<option value="${frappe.utils.escape_html(row.branch_code)}"${
						row.branch_code === active ? " selected" : ""
					}>${frappe.utils.escape_html(label)}</option>`;
				})
				.join("")
		);
		this.$branch_row.addClass("is-visible");
		const active_branch = this.context?.active_branch || {};
		const menu = this.context?.menu_summary || {};
		const menu_label =
			menu.menu_mode === "custom"
				? __("Menu khusus")
				: menu.menu_mode === "restricted"
					? __("Menu terbatas")
					: null;
		this.$context_label.text(
			[
				active_branch.branch_name || active_branch.branch_code,
				this.context.selling_price_list || active_branch.selling_price_list,
				menu_label,
			]
				.filter(Boolean)
				.join(" · ")
		);
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
		if (!this.$branch_row.hasClass("is-visible")) {
			this.$context_label.text(
				[this.context.pos_profile, this.context.company].filter(Boolean).join(" · ")
			);
		}
		if (this.enable_pos_shift && (this.requires_shift_workflow || this.pos_opening)) {
			this.$shift_bar.show();
			this.render_shift_bar();
			if (this.requires_shift_workflow && !this.pos_opening) {
				this.prompt_open_shift();
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
		if (!availableTypes.length) {
			// Free tier: basic pos_order checkout without order-type tier features.
			$orderTypeRow.hide();
		} else {
			$orderTypeRow.show();
			this.wrapper.find(".imogi-cashier-order-type-btn").each((_, el) => {
				const $btn = $(el);
				const type = $btn.data("type");
				const allowed = this.feature_allowed(typeFeatures[type]);
				$btn.toggleClass("is-tier-locked", !allowed).prop("disabled", !allowed);
			});
			if (!this.feature_allowed(typeFeatures[this.order_type])) {
				this.set_order_type(availableTypes[0].value, true);
			}
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

		const marketplaceOn = this.feature_allowed("grabfood_integration");
		if (!marketplaceOn && this.$marketplace_chip?.hasClass("is-visible")) {
			this.$marketplace_chip.addClass("is-tier-locked");
		} else {
			this.$marketplace_chip?.removeClass("is-tier-locked");
		}

		this.$history_chip?.toggleClass("is-tier-locked", !this.feature_allowed("order_history"));
		this.$history_chip?.addClass("is-visible");
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
			return;
		}
		this.$shift_bar.show();
		if (this.pos_opening && this.pos_opening.name) {
			this.$shift_bar.removeClass("is-closed");
			const since = frappe.datetime.str_to_user(this.pos_opening.period_start_date);
			this.$shift_bar.html(`
				<div class="imogi-cashier-shift-text">
					<i class="fa fa-unlock"></i>
					${__("Shift")} <a href="/app/pos-opening-entry/${encodeURIComponent(
						this.pos_opening.name
					)}">${frappe.utils.escape_html(this.pos_opening.name)}</a>
					· ${__("sejak")} ${frappe.utils.escape_html(since)}
				</div>
				<button type="button" class="btn btn-xs btn-default imogi-cashier-close-shift-btn">${__(
					"Tutup Shift"
				)}</button>
			`);
			this.$shift_bar.find(".imogi-cashier-close-shift-btn").on("click", () => this.close_shift());
		} else if (this.requires_shift_workflow) {
			this.$shift_bar.addClass("is-closed");
			this.$shift_bar.html(`
				<div class="imogi-cashier-shift-text"><i class="fa fa-lock"></i> ${__(
					"Shift kasir belum dibuka — checkout dinonaktifkan"
				)}</div>
				<button type="button" class="btn btn-xs imogi-cashier-btn-primary imogi-cashier-open-shift-btn">${__(
					"Buka Shift"
				)}</button>
			`);
			this.$shift_bar.find(".imogi-cashier-open-shift-btn").on("click", () => this.open_shift());
		}
		imogi_apply_shift_bar_theme(this.$shift_bar);
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
		this.$groups.html(
			groups
				.map(
					(g, i) =>
						`<button type="button" class="imogi-cashier-group-btn ${
							i === 0 ? "is-active" : ""
						}" data-group="${frappe.utils.escape_html(g.name || "")}">${frappe.utils.escape_html(
							g.label
						)}</button>`
				)
				.join("")
		);
		this.use_pos_category = !!(this.context.pos_categories && this.context.pos_categories.length);
		this.$groups.find(".imogi-cashier-group-btn").on("click", (e) => {
			this.$groups.find(".imogi-cashier-group-btn").removeClass("is-active");
			$(e.currentTarget).addClass("is-active");
			const value = $(e.currentTarget).data("group") || "";
			if (this.use_pos_category) {
				this.pos_category = value;
				this.item_group = "";
			} else {
				this.item_group = value;
				this.pos_category = "";
			}
			this.load_items();
		});
	}

	_catalog_args() {
		const args = { limit: 48, start: 0, ...this.branch_api_args() };
		if (this.search) args.search = this.search;
		else if (this.pos_category) args.pos_category = this.pos_category;
		else if (this.item_group) args.item_group = this.item_group;
		return args;
	}

	_catalog_cache_key(args) {
		return JSON.stringify(args);
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
				this._catalog_mem[cache_key] = { items, cached_at: Date.now() };
				if (
					imogi_pos.offline?.is_enabled(this) &&
					typeof imogi_pos.offline.save_catalog === "function"
				) {
					imogi_pos.offline.save_catalog(this, args, items);
				}
				this._render_catalog_items(items);
				this._prefetch_category_catalogs(args);
			},
		});
	}

	_prefetch_category_catalogs(base_args) {
		if (base_args.search || base_args.pos_category) return;
		const categories = this.context?.pos_categories || [];
		if (!categories.length) return;

		categories.forEach((pos_category) => {
			const args = {
				limit: 48,
				start: 0,
				...this.branch_api_args(),
				pos_category,
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

	load_items({ background = false } = {}) {
		if (!this.context) return;

		const args = this._catalog_args();
		const cache_key = this._catalog_cache_key(args);
		const mem = this._catalog_mem[cache_key];

		if (!background && mem?.items?.length) {
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
		if (!this.context?.enable_marketplace_orders) {
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
			};
			if (item.auto_variant_item_code) {
				this.add_resolved_item(item.auto_variant_item_code, item);
				return;
			}
			if (item.has_variants) {
				this.open_variant_modal(item);
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
		const track_stock =
			cint(item.show_stock_label) || item.is_stock_item || item.bom_limited;
		const out = track_stock && !item.in_stock;
		const uom = item.uom || item.stock_uom || "Nos";
		const precision = flt(item.rate, 2) % 1 !== 0 ? 2 : 0;
		const qty = flt(item.stock_qty);
		const indicator = qty > 10 ? "green" : qty <= 0 ? "red" : "orange";
		let stock_line = "";

		if (track_stock) {
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

		return `<div class="item-wrapper${out ? " is-out" : ""}${item.has_variants ? " has-variants" : ""}" role="button" tabindex="0"
			data-code="${frappe.utils.escape_html(item.item_code)}"
			data-name="${frappe.utils.escape_html(item.item_name || item.item_code)}"
			data-rate="${item.rate || 0}"
			data-uom="${frappe.utils.escape_html(uom)}"
			data-has-variants="${item.has_variants ? 1 : 0}"
			data-auto-variant="${frappe.utils.escape_html(item.auto_variant_item_code || "")}">
			${media}
			<div class="item-detail">
				<div class="item-name">${frappe.utils.escape_html(item.item_name || item.item_code)}</div>
				<div class="item-rate">${format_currency(item.rate || 0, item.currency, precision) || 0} <span class="item-uom">/ ${frappe.utils.escape_html(uom)}</span></div>
				${stock_line}
			</div>
		</div>`;
	}

	add_to_cart(item) {
		const existing = this.cart.find((row) => row.item_code === item.item_code);
		if (existing) existing.qty += 1;
		else this.cart.push({ ...item, qty: 1 });
		this.render_cart();
		frappe.show_alert({ message: item.item_name, indicator: "green" });
	}

	add_resolved_item(item_code, template_item) {
		frappe.call({
			method: "imogi_pos.api.catalog.get_item",
			args: { item_code, ...this.branch_api_args() },
			callback: (r) => {
				if (r.exc) return;
				const resolved = r.message || {};
				if (resolved.is_stock_item && !resolved.in_stock) {
					frappe.show_alert({ message: __("Stok habis"), indicator: "red" });
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
				frappe.show_alert({ message: __("Stok habis"), indicator: "red" });
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
				this.add_to_cart(addon);
			});
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
					frappe.show_alert({ message: __("Stok habis"), indicator: "red" });
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
				const hold_id = $(e.currentTarget).closest("tr").data("id");
				this.take_hold(hold_id, () => d.hide());
			});
			d.$wrapper.on("click", ".imogi-drop-hold", (e) => {
				const hold_id = $(e.currentTarget).closest("tr").data("id");
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

	is_mobile_layout() {
		return window.matchMedia("(max-width: 992px)").matches;
	}

	toggle_mobile_cart(open) {
		if (!this.is_mobile_layout()) return;
		this.mobile_cart_open = open === undefined ? !this.mobile_cart_open : !!open;
		this.wrapper.toggleClass("is-mobile-cart-open", this.mobile_cart_open);
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
		this.wrapper
			.find(".imogi-cashier-order-type-btn")
			.removeClass("is-active")
			.filter(`[data-type="${this.order_type}"]`)
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
		imogi_pos.loyalty.refresh_preview(this, dialog, subtotal);
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
		if (!this.context?.enable_promo_rules || !this.cart.length) return;
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
					if (!this.applied_promos.length) return;
					const labels = this.applied_promos.map((row) => row.label).join(" · ");
					this.$cart_items.before(
						`<div class="imogi-cashier-promo-hint"><i class="fa fa-gift"></i> ${frappe.utils.escape_html(
							labels
						)}</div>`
					);
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
		return this.get_cart_subtotal();
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
					return `
						<div class="imogi-cart-row" data-code="${frappe.utils.escape_html(row.item_code)}">
							<div class="imogi-cart-row-info">
								<div class="imogi-cart-row-name">${frappe.utils.escape_html(row.item_name)}</div>
								<div class="imogi-cart-row-meta">${format_currency(row.rate)} × ${row.qty}</div>
							</div>
							<div class="imogi-cart-row-actions">
								<button type="button" class="imogi-qty-btn" data-delta="-1">−</button>
								<span class="imogi-cart-qty">${row.qty}</span>
								<button type="button" class="imogi-qty-btn" data-delta="1">+</button>
							</div>
							<div class="imogi-cart-row-amount">${format_currency(amount)}</div>
						</div>`;
				})
				.join("")
		);

		this.$cart_items.find(".imogi-qty-btn").on("click", (e) => {
			const $row = $(e.currentTarget).closest(".imogi-cart-row");
			this.update_qty($row.data("code"), cint($(e.currentTarget).data("delta")));
		});

		this.$total.text(format_currency(subtotal));
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
		const { type, value } = this.get_payment_discount_state(dialog);
		return subtotal - this.get_discount_amount(subtotal, type, value);
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
			if (me.context?.loyalty_enabled) {
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
			$field.after(`<div class="imogi-pay-numpad-wrap">${this.build_pay_numpad_html()}</div>`);
			$numpad_wrap = $wrap.find(".imogi-pay-numpad-wrap");
		}

		const $input = dialog.fields_dict.paid_amount.$input;
		if (!is_mobile) {
			$input.removeAttr("readonly inputmode");
			$numpad_wrap.removeClass("is-visible");
			return;
		}

		$input.attr({ readonly: true, inputmode: "none" });
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
		};

		$input.off("focus.imogiNumpad click.imogiNumpad").on("focus.imogiNumpad click.imogiNumpad", (e) => {
			e.preventDefault();
			show_numpad();
		});

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

	refresh_payment_dialog(dialog, subtotal) {
		const total = this.get_payment_total(dialog, subtotal);
		const { type, value } = this.get_payment_discount_state(dialog);
		const discount_amount = this.get_discount_amount(subtotal, type, value);
		const preview = this.payment_preview || {};
		const voucher_discount = flt(preview.voucher_discount);
		const loyalty_discount = flt(preview.loyalty_discount);
		const $wrap = dialog.$wrapper;

		$wrap.find(".imogi-pay-total-value").html(imogi_format_pay_total(total));
		$wrap.find(".imogi-pay-subtotal-value").text(format_currency(subtotal));
		$wrap.find(".imogi-pay-discount-value-display").text(`-${format_currency(discount_amount)}`);
		$wrap.find(".imogi-pay-discount-breakdown-row").toggle(discount_amount > 0);
		$wrap.find(".imogi-pay-voucher-discount-display").text(`-${format_currency(voucher_discount)}`);
		$wrap.find(".imogi-pay-voucher-breakdown-row").toggle(voucher_discount > 0);
		$wrap.find(".imogi-pay-loyalty-discount-display").text(`-${format_currency(loyalty_discount)}`);
		$wrap.find(".imogi-pay-loyalty-breakdown-row").toggle(loyalty_discount > 0);

		const quick_amounts = [
			total,
			round_up_cash(total, 1000),
			round_up_cash(total, 5000),
			round_up_cash(total, 10000),
			round_up_cash(total, 50000),
			round_up_cash(total, 100000),
		];
		$wrap.find(".imogi-pay-quick-row").html(
			quick_amounts
				.map((amount, idx) => {
					const label = idx === 0 ? __("Pas") : format_currency(amount);
					return `<button type="button" class="imogi-pay-quick-btn" data-amount="${amount}">${label}</button>`;
				})
				.join("")
		);

		if (this.is_cash_mode(dialog.get_value("mode_of_payment"))) {
			this.update_change_display(dialog, total);
		}
	}

	open_payment_dialog() {
		if (!this.cart.length || this.busy) return;
		this.close_mobile_cart();
		if (this.enable_pos_shift && this.requires_shift_workflow && !this.pos_opening) {
			frappe.msgprint(__("Buka shift kasir dulu sebelum checkout."));
			this.prompt_open_shift();
			return;
		}
		const subtotal = this.get_cart_subtotal();
		const modes = (this.context.payment_modes || []).map((m) => m.mode_of_payment);
		const default_mode = this.context.default_payment_mode || modes[0];
		const me = this;

		const dialog = new frappe.ui.Dialog({
			title: __("Pembayaran"),
			fields: [
				{
					fieldtype: "HTML",
					fieldname: "pay_summary_html",
					options: `<div class="imogi-pay-summary">
						<div class="imogi-pay-total-label">${__("Total Bayar")}</div>
						<div class="imogi-pay-total-value">${imogi_format_pay_total(subtotal)}</div>
					</div>`,
				},
				{
					fieldname: "mode_of_payment",
					fieldtype: "Select",
					label: __("Metode Pembayaran"),
					options: modes.join("\n"),
					default: default_mode,
					reqd: 1,
					change() {
						me.toggle_cash_fields(dialog, subtotal);
					},
				},
				{
					fieldtype: "HTML",
					fieldname: "discount_html",
					options: `<div class="imogi-pay-discount-wrap">
						<button type="button" class="imogi-pay-discount-toggle">
							<i class="fa fa-tag"></i> ${__("Tambah diskon")}
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
							<div class="imogi-pay-discount-breakdown">
								<div class="imogi-pay-breakdown-row">
									<span>${__("Subtotal")}</span>
									<strong class="imogi-pay-subtotal-value">${format_currency(subtotal)}</strong>
								</div>
								<div class="imogi-pay-breakdown-row is-discount imogi-pay-discount-breakdown-row" style="display:none;">
									<span>${__("Diskon")}</span>
									<strong class="imogi-pay-discount-value-display">-${format_currency(0)}</strong>
								</div>
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
					options: `<div class="imogi-pay-change-wrap" style="display:none;">
						<div class="text-muted small">${__("Kembalian")}</div>
						<div class="imogi-pay-change-box">${format_currency(0)}</div>
						<div class="imogi-pay-quick-row"></div>
					</div>`,
				},
			],
			primary_action_label: __("Selesaikan Pembayaran"),
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
							me.show_success(order || {}, { change: 0, paid_amount: total });
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

		dialog.$wrapper.on("click", ".imogi-pay-quick-btn", function () {
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
		if (this.context.loyalty_enabled && imogi_pos.loyalty) {
			this.refresh_payment_preview(dialog, subtotal);
		} else {
			this.refresh_payment_dialog(dialog, subtotal);
		}
	}

	toggle_cash_fields(dialog, subtotal) {
		const mode = dialog.get_value("mode_of_payment");
		const is_cash = this.is_cash_mode(mode);
		const total = this.get_payment_total(dialog, subtotal);
		dialog.toggle_field("paid_amount", is_cash);
		dialog.$wrapper.find(".imogi-pay-change-wrap").toggle(is_cash);
		dialog.$wrapper.find(".imogi-pay-numpad-wrap").toggleClass("is-visible", is_cash && this.is_mobile_layout());
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
		$box.text(format_currency(Math.max(change, 0)));
		$box.toggleClass("is-short", paid < total);
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

		const finish = (order, change) => {
			this.busy = false;
			this.update_mobile_dock();
			dialog.hide();
			this.show_success(order || {}, { change, paid_amount: flt(paid_amount) });
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
		this.discount_type = "";
		this.discount_value = 0;
		this.render_cart();
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
		const change_html =
			payment_info.change > 0
				? `<div class="imogi-pay-change-highlight">
					${__("Kembalian")}: ${format_currency(payment_info.change)}
				</div>`
				: "";
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
					options: `<div class="imogi-pay-success-body text-center py-3">
						<div class="imogi-pay-success-icon"><i class="fa fa-check-circle"></i></div>
						<div class="imogi-pay-success-order">${frappe.utils.escape_html(order.name || "")}</div>
						<div class="imogi-pay-summary imogi-pay-summary--compact">
							<div class="imogi-pay-total-label">${__("Total")}</div>
							<div class="imogi-pay-total-value">${imogi_format_pay_total(order.grand_total || 0)}</div>
						</div>
						${change_html}
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
			me.load_items();
		};

		dialog.$wrapper.addClass("imogi-pay-dialog imogi-pay-success-dialog");
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
