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

	frappe.realtime.on("imogi_pos_settings_updated", (data) => {
		if (data?.subscription_tier) {
			frappe.boot.imogi_pos_subscription_tier = data.subscription_tier;
			imogi_pos_update_workspace_tier_banner(data.subscription_tier);
		}
		imogi_pos_refresh_workspace_tier_context();
	});
});
