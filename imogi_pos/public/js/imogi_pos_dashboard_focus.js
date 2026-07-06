// Copyright (c) 2026, Imogi and contributors

frappe.provide("imogi_pos.dashboard_focus");

const IMOGI_DASH_FOCUS_ALIASES = {
	dashboard_sales: "sales",
	dashboard_operational: "operational",
	overview: "sales",
};

const IMOGI_DASH_FOCUS_META = {
	sales: {
		subtitle: __("Ringkasan penjualan dan analitik — omzet, produk terlaris, dan tren harian."),
		page_title: __("Dashboard & Analitik"),
		selector: ".imogi-dash-stats-card",
	},
	operational: {
		subtitle: __("Monitoring operasional — kitchen, layanan meja, dan alur order aktif."),
		page_title: __("Dashboard Operasional"),
		selector: ".imogi-dash-stats-card",
	},
	top_menu: {
		subtitle: __("Menu terlaris — produk dengan penjualan tertinggi."),
		page_title: __("Menu Terlaris"),
		selector: '[data-imogi-dash-focus="top_menu"]',
	},
	sales_by_hour: {
		subtitle: __("Penjualan per jam — identifikasi jam sibuk outlet."),
		page_title: __("Penjualan per Jam"),
		selector: '[data-imogi-dash-focus="sales_by_hour"]',
	},
	sales_by_category: {
		subtitle: __("Penjualan per kategori menu."),
		page_title: __("Penjualan per Kategori"),
		selector: '[data-imogi-dash-focus="sales_by_category"]',
	},
	sales_by_payment: {
		subtitle: __("Metode pembayaran — tunai, QRIS, kartu, dan lainnya."),
		page_title: __("Penjualan per Metode Bayar"),
		selector: '[data-imogi-dash-focus="sales_by_payment"]',
	},
	discount_report: {
		subtitle: __("Laporan diskon yang diterapkan pada transaksi."),
		page_title: __("Laporan Diskon"),
		selector: '[data-imogi-dash-focus="discount_report"]',
	},
	refund_report: {
		subtitle: __("Laporan refund dan pengembalian dana."),
		page_title: __("Laporan Refund"),
		selector: '[data-imogi-dash-focus="refund_report"]',
	},
	food_cost_report: {
		subtitle: __("Food cost dan margin penjualan menu."),
		page_title: __("Food Cost"),
		selector: '[data-imogi-dash-focus="food_cost_report"]',
	},
	table_turnover_report: {
		subtitle: __("Table turnover — rotasi dan penjualan per meja."),
		page_title: __("Table Turnover"),
		selector: '[data-imogi-dash-focus="table_turnover_report"]',
	},
	low_stock: {
		subtitle: __("Stok menipis — item yang perlu restock."),
		page_title: __("Stok Menipis"),
		selector: '[data-imogi-dash-focus="low_stock"]',
	},
	channel: {
		subtitle: __("Penjualan per channel order."),
		page_title: __("Penjualan per Channel"),
		selector: '[data-imogi-dash-focus="channel"]',
	},
	kitchen_performance: {
		subtitle: __("KPI dapur per stasiun — volume order, waktu rata-rata, dan order selesai."),
		page_title: __("Kitchen Performance"),
		selector: '[data-imogi-dash-focus="kitchen_performance"]',
	},
};

const IMOGI_DASH_FOCUS_STORAGE_KEY = "imogi_dashboard_pending_focus_v1";

imogi_pos.dashboard_focus.normalize = function (raw) {
	const key = (raw || "").trim().toLowerCase();
	if (!key) return null;
	return IMOGI_DASH_FOCUS_ALIASES[key] || key;
};

imogi_pos.dashboard_focus.get_meta = function (focus) {
	const key = imogi_pos.dashboard_focus.normalize(focus);
	return key ? IMOGI_DASH_FOCUS_META[key] || null : null;
};

imogi_pos.dashboard_focus.resolve = function () {
	let focus = null;
	try {
		const params = new URLSearchParams(window.location.search || "");
		focus = params.get("focus");
	} catch (e) {
		/* ignore */
	}
	if (!focus && window.location.hash) {
		const hash = window.location.hash.replace(/^#/, "");
		if (hash.startsWith("focus=")) {
			focus = hash.slice("focus=".length);
		}
	}
	if (!focus && frappe.route_options?.focus) {
		focus = frappe.route_options.focus;
	}
	if (!focus) {
		try {
			focus = sessionStorage.getItem(IMOGI_DASH_FOCUS_STORAGE_KEY);
			if (focus) sessionStorage.removeItem(IMOGI_DASH_FOCUS_STORAGE_KEY);
		} catch (e) {
			/* ignore */
		}
	}
	return imogi_pos.dashboard_focus.normalize(focus);
};

imogi_pos.dashboard_focus.stage = function (focus) {
	const normalized = imogi_pos.dashboard_focus.normalize(focus);
	if (!normalized) return;
	try {
		sessionStorage.setItem(IMOGI_DASH_FOCUS_STORAGE_KEY, normalized);
	} catch (e) {
		/* ignore */
	}
};

imogi_pos.dashboard_focus.stage_for_label = function (label) {
	const map = frappe.boot?.imogi_pos_dashboard_focus_by_label || {};
	const focus = map[(label || "").trim()];
	if (focus) {
		imogi_pos.dashboard_focus.stage(focus);
	}
};

imogi_pos.dashboard_focus.apply = function (dashboard, focus) {
	const key = imogi_pos.dashboard_focus.normalize(focus);
	if (!key || !dashboard?.wrapper) return;

	const meta = IMOGI_DASH_FOCUS_META[key];
	if (meta?.subtitle) {
		dashboard.wrapper.find(".imogi-dash-hero-sub").text(meta.subtitle);
	}
	if (meta?.page_title && dashboard.page?.set_title) {
		dashboard.page.set_title(meta.page_title);
	}

	const selector = meta?.selector || `[data-imogi-dash-focus="${key}"]`;
	const $target = dashboard.wrapper.find(selector).first();
	if (!$target.length) return;

	const $panel = $target.closest(".imogi-dash-panel");
	const $scroll = $panel.length ? $panel : $target;
	$scroll.addClass("imogi-dash-panel--focused");
	window.setTimeout(() => {
		$scroll[0]?.scrollIntoView({ behavior: "smooth", block: "start" });
		window.setTimeout(() => $scroll.removeClass("imogi-dash-panel--focused"), 2400);
	}, 120);
};

imogi_pos.dashboard_focus.bind_workspace_navigation = function () {
	if (window.__imogi_dashboard_focus_nav_bound) return;
	window.__imogi_dashboard_focus_nav_bound = true;

	$(document).on("click", "a[href*='imogi-pos-dashboard']", function () {
		const $link = $(this);
		const label =
			$link.find(".link-text").text().trim() ||
			$link.find(".sidebar-item-label").text().trim() ||
			$link.text().trim();
		imogi_pos.dashboard_focus.stage_for_label(label);

		try {
			const url = new URL($link.attr("href"), window.location.origin);
			const focus = url.searchParams.get("focus");
			if (focus) imogi_pos.dashboard_focus.stage(focus);
		} catch (e) {
			/* ignore */
		}
	});
};

$(document).on("app_ready", () => {
	imogi_pos.dashboard_focus.bind_workspace_navigation();
});
