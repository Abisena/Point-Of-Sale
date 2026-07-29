frappe.provide("imogi_pos");

function imogi_pos_workspace_tier_key(link_type, link_to) {
	return `${link_type || ""}/${link_to || ""}`;
}

function imogi_pos_is_workspace_link_allowed(link_type, link_to) {
	const access = frappe.boot?.imogi_pos_workspace_tier_access;
	if (!access?.links) {
		return true;
	}
	const row = access.links[imogi_pos_workspace_tier_key(link_type, link_to)];
	if (!row) {
		return true;
	}
	return !!row.allowed;
}

function imogi_pos_is_imogi_workspace_page(page) {
	const name = (page && (page.name || page.title)) || "";
	return imogi_pos_workspace_page_names().includes(name);
}

function imogi_pos_is_imogi_workspace_active() {
	const page = frappe.workspace?._page;
	if (page && imogi_pos_is_imogi_workspace_page(page)) {
		return true;
	}
	return imogi_pos_on_imogi_workspace();
}

function imogi_pos_filter_workspace_page_data(page_data) {
	if (!page_data) {
		return page_data;
	}
	const access = frappe.boot?.imogi_pos_workspace_tier_access;
	if (!access?.links) {
		return page_data;
	}

	const is_allowed = (link_type, link_to) =>
		imogi_pos_is_workspace_link_allowed(link_type, link_to);

	const filtered = { ...page_data };
	if (filtered.shortcuts?.items) {
		filtered.shortcuts = {
			...filtered.shortcuts,
			items: filtered.shortcuts.items.filter((item) => is_allowed(item.type, item.link_to)),
		};
	}
	if (filtered.cards?.items) {
		filtered.cards = {
			...filtered.cards,
			items: filtered.cards.items
				.map((card) => ({
					...card,
					links: (card.links || []).filter((link) =>
						is_allowed(link.link_type, link.link_to)
					),
				}))
				.filter((card) => (card.links || []).length),
		};
	}
	return filtered;
}

function imogi_pos_apply_filtered_workspace_content(workspace) {
	const filtered_content = workspace?.page_data?.imogi_pos_filtered_content;
	if (!filtered_content) {
		return false;
	}
	try {
		workspace.content = JSON.parse(filtered_content);
		return true;
	} catch (e) {
		return false;
	}
}

function imogi_pos_patch_workspace_loader() {
	const WorkspaceClass = frappe.views?.Workspace;
	if (!WorkspaceClass || WorkspaceClass.prototype.__imogi_pos_tier_patch) {
		return;
	}

	const original_get_data = WorkspaceClass.prototype.get_data;
	const original_prepare_editorjs = WorkspaceClass.prototype.prepare_editorjs;

	WorkspaceClass.prototype.get_data = function (page) {
		return original_get_data.call(this, page).then((data) => {
			if (!imogi_pos_is_imogi_workspace_page(page) || !data?.message) {
				return data;
			}
			data.message = imogi_pos_filter_workspace_page_data(data.message);
			this.page_data = data.message;
			this.pages[page.name] = data.message;
			return data;
		});
	};

	WorkspaceClass.prototype.prepare_editorjs = function () {
		if (imogi_pos_is_imogi_workspace_active()) {
			imogi_pos_apply_filtered_workspace_content(this);
		}
		return original_prepare_editorjs.call(this);
	};

	WorkspaceClass.prototype.__imogi_pos_tier_patch = true;
}

imogi_pos.is_workspace_link_allowed = imogi_pos_is_workspace_link_allowed;
imogi_pos.filter_workspace_page_data = imogi_pos_filter_workspace_page_data;

function imogi_pos_on_imogi_workspace() {
	const path = (window.location.pathname || "").replace(/\/$/, "");
	if (path === "/app/imogi-pos" || path.endsWith("/app/imogi-pos")) {
		return true;
	}
	const route = frappe.get_route?.() || [];
	return route.includes("imogi-pos") || route.includes("Imogi POS");
}

function imogi_pos_workspace_page_names() {
	return ["Imogi POS", "imogi-pos"];
}

function imogi_pos_update_workspace_tier_banner(tier) {
	if (imogi_pos.is_subscription_tier_disabled && imogi_pos.is_subscription_tier_disabled()) {
		$(".imogi-ws-tier-banner").remove();
		return;
	}
	if (!imogi_pos_on_imogi_workspace()) {
		return;
	}
	const $page = $(".layout-main-section");
	if (!$page.length) {
		return;
	}

	const label = `${__("Paket")}: ${frappe.utils.escape_html(tier || "Free")}`;
	let $banner = $page.find(".imogi-ws-tier-banner");
	if (!$banner.length) {
		$page.prepend(`
			<div class="imogi-ws-tier-banner alert alert-light border mb-3" role="status">
				<strong>${label}</strong>
				<span class="text-muted"> — ${__(
					"Menu workspace disesuaikan otomatis. Upgrade tier untuk membuka modul tambahan."
				)}</span>
				<a class="ml-2" href="/app/imogi-pos-feature-matrix">${__("Lihat matriks fitur")}</a>
			</div>
		`);
		return;
	}
	$banner.find("strong").html(label);
}

function imogi_pos_clear_workspace_cache() {
	const ws = frappe.workspace;
	if (!ws?.pages) {
		return;
	}
	imogi_pos_workspace_page_names().forEach((name) => {
		delete ws.pages[name];
	});
}

function imogi_pos_reload_workspace_if_active() {
	const ws = frappe.workspace;
	if (!ws || !imogi_pos_on_imogi_workspace()) {
		return Promise.resolve();
	}

	imogi_pos_clear_workspace_cache();

	const page =
		typeof ws.get_page_to_show === "function"
			? ws.get_page_to_show()
			: { name: "Imogi POS", public: true };

	return ws.show_page(page);
}

function imogi_pos_apply_workspace_tier_context(ctx) {
	if (!ctx) {
		return Promise.resolve();
	}

	if (ctx.tier_disabled || (imogi_pos.is_subscription_tier_disabled && imogi_pos.is_subscription_tier_disabled())) {
		frappe.boot.imogi_pos_subscription_tier = null;
		frappe.boot.imogi_pos_workspace_tier_access = ctx.tier_access || { tier_disabled: true, links: {} };
		imogi_pos_update_workspace_tier_banner(null);
		return Promise.resolve();
	}

	const prevTier = frappe.boot?.imogi_pos_subscription_tier;
	frappe.boot.imogi_pos_subscription_tier = ctx.tier;
	frappe.boot.imogi_pos_workspace_tier_access = ctx.tier_access;
	imogi_pos_update_workspace_tier_banner(ctx.tier);

	if (prevTier !== ctx.tier && imogi_pos_on_imogi_workspace()) {
		return imogi_pos_reload_workspace_if_active();
	}
	return Promise.resolve();
}

function imogi_pos_refresh_workspace_tier_context() {
	return new Promise((resolve) => {
		frappe.call({
			method: "imogi_pos.api.feature_api.get_workspace_tier_context",
			callback(r) {
				imogi_pos_apply_workspace_tier_context(r.message).finally(resolve);
			},
			error() {
				resolve();
			},
		});
	});
}

imogi_pos.refresh_workspace_tier_context = imogi_pos_refresh_workspace_tier_context;
imogi_pos.apply_workspace_tier_context = imogi_pos_apply_workspace_tier_context;

const IMOGI_WS_SHORTCUT_META = {
	"IMOGI Kasir": { icon: "fa-shopping-cart", tone: "orange" },
	"Riwayat Transaksi": { icon: "fa-history", tone: "green" },
	"Kitchen Display": { icon: "fa-desktop", tone: "red" },
	"Dashboard & Analitik": { icon: "fa-line-chart", tone: "blue" },
	"Menu Produk": { icon: "fa-cutlery", tone: "violet" },
	"Recipe Hub": { icon: "fa-book", tone: "orange" },
	"Inventory Hub": { icon: "fa-cubes", tone: "blue" },
	"Kitchen Performance": { icon: "fa-fire", tone: "red" },
	"Laporan Penjualan": { icon: "fa-bar-chart", tone: "blue" },
	"IMOGI POS Settings": { icon: "fa-cog", tone: "slate" },
};

const IMOGI_WS_CARD_TONES = {
	"Dashboard & Laporan": "blue",
	"Kasir & Penjualan": "orange",
	"Supervisi & Kontrol": "slate",
	"Kitchen & Fulfillment": "red",
	"Meja & Layanan": "teal",
	"Menu & Produk": "orange",
	"Loyalty & Promo": "violet",
	"Shift & Tutup Hari": "slate",
	"Inventori & Stok": "green",
	"Pembelian": "blue",
	"Keuangan & Audit": "slate",
	"Multi Outlet": "teal",
	"Integrasi & Payment": "violet",
	"Pengaturan Sistem": "slate",
};

function imogi_pos_hub_href(link) {
	const type = link.link_type || link.type || "Page";
	const to = link.link_to || "";
	if (type === "Page") {
		let href = `/app/${to}`;
		if (link.dashboard_focus) {
			href += `?focus=${encodeURIComponent(link.dashboard_focus)}`;
		}
		return href;
	}
	if (type === "DocType") {
		const slug =
			typeof frappe.router?.slug === "function"
				? frappe.router.slug(to)
				: String(to).toLowerCase().replace(/ /g, "-");
		return `/app/${slug}`;
	}
	if (type === "Report") {
		if (cint(link.is_query_report)) {
			return `/app/query-report/${encodeURIComponent(to)}`;
		}
		return `/app/report/${encodeURIComponent(to)}`;
	}
	return `/app/${to}`;
}

function imogi_pos_hub_mount_point() {
	return $(".layout-main-section").first();
}

function imogi_pos_hub_teardown() {
	$(".imogi-ws-hub").remove();
	document.body.classList.remove("imogi-ws-branded");
}

function imogi_pos_render_workspace_hub(data) {
	const $page = imogi_pos_hub_mount_point();
	if (!$page.length) {
		return;
	}

	document.body.classList.add("imogi-ws-branded");
	$page.find(".imogi-ws-hub").remove();

	const shortcuts = data.shortcuts || [];
	const sections = data.sections || [];

	const featured_keys = [
		"IMOGI Kasir",
		"Kitchen Display",
		"Dashboard & Analitik",
		"Recipe Hub",
		"Inventory Hub",
	];
	const featured_desc = {
		"IMOGI Kasir": __("Terima order & pembayaran"),
		"Kitchen Display": __("Antrian dapur real-time"),
		"Dashboard & Analitik": __("Pantau penjualan harian"),
		"Recipe Hub": __("Resep, porsi & food cost"),
		"Inventory Hub": __("Stok, waste, opname & forecast"),
	};

	const featured = [];
	const secondary = [];
	shortcuts.forEach((row) => {
		if (featured_keys.includes(row.label)) featured.push(row);
		else secondary.push(row);
	});
	// Keep featured order stable
	featured.sort((a, b) => featured_keys.indexOf(a.label) - featured_keys.indexOf(b.label));

	const featured_html = featured
		.map((row) => {
			const meta = IMOGI_WS_SHORTCUT_META[row.label] || {
				icon: "fa-external-link",
				tone: "orange",
			};
			return `
				<a class="imogi-ws-hub-feature" data-tone="${meta.tone}" href="${frappe.utils.escape_html(
				imogi_pos_hub_href(row)
			)}">
					<span class="imogi-ws-hub-feature-icon"><i class="fa ${meta.icon}"></i></span>
					<div>
						<div class="imogi-ws-hub-feature-title">${frappe.utils.escape_html(row.label)}</div>
						<div class="imogi-ws-hub-feature-desc">${frappe.utils.escape_html(
							featured_desc[row.label] || __("Buka modul")
						)}</div>
					</div>
				</a>
			`;
		})
		.join("");

	const quick_html = secondary
		.map((row) => {
			const meta = IMOGI_WS_SHORTCUT_META[row.label] || {
				icon: "fa-external-link",
				tone: "orange",
			};
			return `
				<a class="imogi-ws-hub-quick-card" data-tone="${meta.tone}" href="${frappe.utils.escape_html(
				imogi_pos_hub_href(row)
			)}">
					<span class="imogi-ws-hub-quick-icon"><i class="fa ${meta.icon}"></i></span>
					<span class="imogi-ws-hub-quick-title">${frappe.utils.escape_html(row.label)}</span>
				</a>
			`;
		})
		.join("");

	const modules_html = sections
		.map((section) => {
			const tone = IMOGI_WS_CARD_TONES[section.label] || "orange";
			const links = (section.links || [])
				.map(
					(link) => `
					<a class="imogi-ws-hub-link" href="${frappe.utils.escape_html(imogi_pos_hub_href(link))}">
						<span>${frappe.utils.escape_html(link.label)}</span>
						<i class="fa fa-chevron-right"></i>
					</a>
				`
				)
				.join("");
			return `
				<section class="imogi-ws-hub-module" data-tone="${tone}" data-section="${frappe.utils.escape_html(
				section.label
			)}">
					<div class="imogi-ws-hub-module-head">
						<span class="imogi-ws-hub-module-dot"></span>
						<div class="imogi-ws-hub-module-title">${frappe.utils.escape_html(section.label)}</div>
						<span class="imogi-ws-hub-module-count">${(section.links || []).length}</span>
					</div>
					<div class="imogi-ws-hub-module-links">${links}</div>
				</section>
			`;
		})
		.join("");

	const $hub = $(`
		<div class="imogi-ws-hub">
			<div class="imogi-ws-hub-hero">
				<div class="imogi-ws-hub-hero-inner">
					<div>
						<div class="imogi-ws-hub-kicker">${__("Workspace Operasional")}</div>
						<h1 class="imogi-ws-hub-brand">IMOGI</h1>
						<div class="imogi-ws-hub-title">${__("Restoran & Cafe")}</div>
						<p class="imogi-ws-hub-sub">${__(
							"Kasir, dapur, meja, resep, stok, dan laporan — satu tempat untuk operasional harian."
						)}</p>
					</div>
					<div class="imogi-ws-hub-meta">
						<span class="imogi-ws-hub-chip"><i class="fa fa-user"></i> ${frappe.utils.escape_html(
							data.user_name || frappe.session.user
						)}</span>
					</div>
				</div>
			</div>
			${
				featured_html
					? `<div class="imogi-ws-hub-featured">${featured_html}</div>`
					: ""
			}
			<div class="imogi-ws-hub-toolbar">
				<div class="imogi-ws-hub-search-wrap">
					<i class="fa fa-search"></i>
					<input type="search" class="imogi-ws-hub-search" placeholder="${__(
						"Cari modul atau menu..."
					)}">
				</div>
			</div>
			${
				quick_html
					? `<div class="imogi-ws-hub-section-label">${__("Lainnya")}</div>
			<div class="imogi-ws-hub-quick">${quick_html}</div>`
					: ""
			}
			<div class="imogi-ws-hub-section-label">${__("Semua Modul")}</div>
			<div class="imogi-ws-hub-modules">${
				modules_html ||
				`<div class="imogi-ws-hub-empty">${__("Tidak ada modul yang tersedia.")}</div>`
			}</div>
		</div>
	`);

	$page.prepend($hub);

	const apply_filter = () => {
		const q = ($hub.find(".imogi-ws-hub-search").val() || "").toLowerCase().trim();
		$hub.find(".imogi-ws-hub-feature, .imogi-ws-hub-quick-card").each(function () {
			const text = ($(this).text() || "").toLowerCase();
			$(this).toggle(!q || text.indexOf(q) !== -1);
		});
		$hub.find(".imogi-ws-hub-module").each(function () {
			const $mod = $(this);
			let visible = 0;
			$mod.find(".imogi-ws-hub-link").each(function () {
				const text = ($(this).text() || "").toLowerCase();
				const show =
					!q ||
					text.indexOf(q) !== -1 ||
					($mod.data("section") || "").toLowerCase().indexOf(q) !== -1;
				$(this).toggle(show);
				if (show) visible += 1;
			});
			$mod.toggle(visible > 0);
		});
	};
	$hub.find(".imogi-ws-hub-search").on("input", apply_filter);
}

function imogi_pos_apply_workspace_brand() {
	if (!imogi_pos_on_imogi_workspace()) {
		imogi_pos_hub_teardown();
		return;
	}

	const $page = imogi_pos_hub_mount_point();
	if (!$page.length) {
		return;
	}
	document.body.classList.add("imogi-ws-branded");
	if (!$page.find(".imogi-ws-hub").length) {
		$page.prepend(`<div class="imogi-ws-hub"><div class="imogi-ws-hub-loading">${__(
			"Memuat workspace..."
		)}</div></div>`);
	}

	frappe.call({
		method: "imogi_pos.api.feature_api.get_workspace_hub",
		callback(r) {
			if (!imogi_pos_on_imogi_workspace()) {
				return;
			}
			if (r.exc || !r.message) {
				$page.find(".imogi-ws-hub").html(
					`<div class="imogi-ws-hub-empty">${__("Gagal memuat workspace hub.")}</div>`
				);
				return;
			}
			imogi_pos_render_workspace_hub(r.message);
		},
		error() {
			if (!imogi_pos_on_imogi_workspace()) {
				return;
			}
			$page.find(".imogi-ws-hub").html(
				`<div class="imogi-ws-hub-empty">${__("Gagal memuat workspace hub.")}</div>`
			);
		},
	});
}

function imogi_pos_redirect_dedicated_ops_from_workspace() {
	if (typeof imogi_pos_is_dedicated_waiter_user === "function" && imogi_pos_is_dedicated_waiter_user()) {
		const path = (window.location.pathname || "").replace(/\/$/, "");
		if (
			imogi_pos_on_imogi_workspace() ||
			path === "/app" ||
			path === "/app/home" ||
			path.startsWith("/app/home/") ||
			path === "/app/imogi-pos-settings" ||
			path.startsWith("/app/imogi-pos-settings/")
		) {
			window.location.replace("/app/table-service");
			return true;
		}
	}
	if (!frappe.boot?.imogi_pos_dedicated_cashier) {
		return false;
	}
	const path = imogi_pos_current_path();
	if (
		!imogi_pos_on_imogi_workspace() &&
		path !== "/app/imogi-pos-settings" &&
		!path.startsWith("/app/imogi-pos-settings/")
	) {
		return false;
	}
	const landing = typeof imogi_pos_get_landing_target === "function" ? imogi_pos_get_landing_target() : "cashier";
	if (landing === "opening-entry" && typeof imogi_pos_go_to_opening_entry === "function") {
		imogi_pos_go_to_opening_entry();
	} else {
		window.location.replace("/app/imogi-pos-cashier");
	}
	return true;
}

$(document).on("app_ready", () => {
	imogi_pos_patch_workspace_loader();
	if (imogi_pos_redirect_dedicated_ops_from_workspace()) {
		return;
	}
	imogi_pos_update_workspace_tier_banner(frappe.boot?.imogi_pos_subscription_tier);
	imogi_pos_apply_workspace_brand();

	$(document).on("page-change.imogi-ws-brand", () => {
		imogi_pos_apply_workspace_brand();
	});

	frappe.realtime.on("imogi_pos_settings_updated", (data) => {
		if (data?.subscription_tier) {
			frappe.boot.imogi_pos_subscription_tier = data.subscription_tier;
			imogi_pos_update_workspace_tier_banner(data.subscription_tier);
		}
		imogi_pos_refresh_workspace_tier_context();
	});
});
