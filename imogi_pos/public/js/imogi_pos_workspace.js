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

imogi_pos.is_workspace_link_allowed = imogi_pos_is_workspace_link_allowed;

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
	frappe.boot.imogi_pos_subscription_tier = ctx.tier;
	frappe.boot.imogi_pos_workspace_tier_access = ctx.tier_access;
	imogi_pos_update_workspace_tier_banner(ctx.tier);
	return imogi_pos_reload_workspace_if_active();
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

$(document).on("app_ready", () => {
	frappe.realtime.on("imogi_pos_settings_updated", (data) => {
		if (data?.subscription_tier) {
			frappe.boot.imogi_pos_subscription_tier = data.subscription_tier;
			imogi_pos_update_workspace_tier_banner(data.subscription_tier);
		}
		imogi_pos_refresh_workspace_tier_context();
	});

	if (frappe.router?.on) {
		frappe.router.on("change", () => {
			setTimeout(() => {
				if (imogi_pos_on_imogi_workspace()) {
					imogi_pos_refresh_workspace_tier_context();
				}
			}, 200);
		});
	}
});
