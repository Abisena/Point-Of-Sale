frappe.provide("imogi_pos");

// Dedicated waiter: redirect before desk paints workspace (boot.js loads with frappe.boot).
(function imogi_pos_immediate_waiter_redirect() {
	if (typeof frappe === "undefined" || !frappe.boot) {
		return;
	}

	const roles = frappe.boot.user?.roles || [];
	const escalation = [
		"Administrator",
		"System Manager",
		"Sales Manager",
		"IMOGI Owner",
		"IMOGI Manager",
		"IMOGI Area Manager",
		"IMOGI Supervisor",
		"IMOGI Cashier",
	];
	const dedicated_waiter =
		!!frappe.boot.imogi_pos_dedicated_waiter ||
		!!frappe.boot.imogi_pos_waiter_home ||
		(roles.includes("IMOGI Waiter") && !escalation.some((role) => roles.includes(role)));

	if (!dedicated_waiter) {
		return;
	}

	const path = (window.location.pathname || "").replace(/\/$/, "");
	const home = "/app/table-service";
	if (path === home || path.startsWith(`${home}/`) || path === "/app/table_service") {
		return;
	}

	const must_redirect =
		path === "/app" ||
		path === "/app/home" ||
		path.startsWith("/app/home/") ||
		path === "/app/imogi-pos" ||
		path.endsWith("/app/imogi-pos") ||
		path === "/app/imogi-pos-dashboard" ||
		path === "/app/workspaces" ||
		path.startsWith("/app/workspace/");

	if (must_redirect) {
		window.location.replace(home);
	}
})();

// Desk /app has no frappe.ready (website only). Stale cached bundles may still call it.
if (typeof frappe !== "undefined" && typeof frappe.ready !== "function") {
	frappe.ready = function (fn) {
		if (typeof fn !== "function") {
			return;
		}
		if (frappe.boot?.ready) {
			fn();
			return;
		}
		$(document).one("app_ready", fn);
	};
}

// ERPNext desk: no SaaS subscription tiers (Free/Starter/Pro = web SKUs only).
imogi_pos.ERP_ENTERPRISE_ONLY = true;
imogi_pos.SUBSCRIPTION_TIERS_DISABLED = true;

imogi_pos.is_subscription_tier_disabled = function () {
	return !!(
		imogi_pos.SUBSCRIPTION_TIERS_DISABLED ||
		frappe.boot?.imogi_pos_subscription_tiers_disabled ||
		frappe.boot?.imogi_pos_erp_enterprise_only
	);
};

imogi_pos.is_erp_enterprise_deployment = function () {
	return imogi_pos.is_subscription_tier_disabled();
};

imogi_pos.VARIANT_MODAL_ASSET_VERSION = "v12";

// Frappe caches Page JS in localStorage (`_page:<name>`). Bump when cashier UI changes.
(function imogi_pos_bust_page_cache() {
	const CACHE_VERSION = "20260622-refund-disabled-v32";
	const VERSION_KEY = "_imogi_pos_page_cache_version";
	const PAGES = [
		"imogi-pos-cashier",
		"imogi-pos-open-shift",
		"imogi-pos-close-shift",
		"imogi-pos-dashboard",
		"imogi-pos-order-history",
		"imogi-pos-menu",
		"imogi-pos-menu-category",
		"imogi-pos-sales-report",
		"imogi-pos-feature-matrix",
		"table-service",
	];
	try {
		if (localStorage.getItem(VERSION_KEY) !== CACHE_VERSION) {
			PAGES.forEach((name) => localStorage.removeItem("_page:" + name));
			localStorage.setItem(VERSION_KEY, CACHE_VERSION);
		}
	} catch (e) {
		/* private browsing */
	}
})();

(function imogi_pos_cleanup_legacy_variant_css() {
	[
		"imogi-variant-modal-css",
		"imogi-variant-modal-css-v2",
		"imogi-variant-modal-css-v3",
		"imogi-variant-modal-css-v4",
		"imogi-variant-modal-css-v5",
		"imogi-variant-modal-css-v6",
		"imogi-variant-modal-css-v7",
		"imogi-variant-modal-css-v8",
		"imogi-variant-modal-css-v9",
		"imogi-variant-modal-css-v10",
		"imogi-variant-modal-css-v11",
		"imogi-variant-modal-css-v12",
	].forEach((id) => document.getElementById(id)?.remove());
})();

imogi_pos.opening_entry_locked = false;
imogi_pos.opening_entry_docname = null;

const IMOGI_CASHIER_ROLE = "IMOGI Cashier";
const IMOGI_WAITER_ROLE = "IMOGI Waiter";
const IMOGI_WAITER_ESCALATION_ROLES = [
	"Administrator",
	"System Manager",
	"Sales Manager",
	"IMOGI Owner",
	"IMOGI Manager",
	"IMOGI Area Manager",
	"IMOGI Supervisor",
	"IMOGI Cashier",
];
const IMOGI_MANAGER_ROLES = ["System Manager", "Administrator"];
const IMOGI_CASHIER_PATH = "/app/imogi-pos-cashier";
const IMOGI_TABLE_SERVICE_PATH = "/app/table-service";
const IMOGI_TABLE_SERVICE_PAGE = "table-service";
const IMOGI_ORDER_HISTORY_PATH = "/app/imogi-pos-order-history";
const IMOGI_OPEN_SHIFT_PATH = "/app/imogi-pos-open-shift";
const IMOGI_CLOSE_SHIFT_PATH = "/app/imogi-pos-close-shift";
const IMOGI_POS_ORDER_DOCTYPE = "Riwayat Order";
const IMOGI_RESTAURANT_TABLE_DOCTYPE = "IMOGI Restaurant Table";
const IMOGI_OPEN_SHIFT_PAGE = "imogi-pos-open-shift";
const IMOGI_CLOSE_SHIFT_PAGE = "imogi-pos-close-shift";
const IMOGI_SHIFT_OPENING_DOCTYPE = "IMOGI POS Shift Opening";
const IMOGI_OPENING_ROUTE_OPTIONS_KEY = "imogi_pos_opening_route_options";

function imogi_pos_ensure_logout() {
	if (typeof frappe === "undefined") {
		return;
	}

	frappe.provide("frappe.app");
	if (typeof frappe.app.logout === "function") {
		return;
	}

	frappe.app.logout = function () {
		const redirect = () => {
			window.location.href = "/login";
		};

		if (typeof frappe.confirm === "function") {
			frappe.confirm(__("Are you sure you want to log out?"), () => {
				frappe.call({ method: "logout", callback: redirect });
			});
			return;
		}

		frappe.call({ method: "logout", callback: redirect });
	};
}

function imogi_pos_boot_roles() {
	return frappe.user_roles || frappe.boot?.user?.roles || [];
}

function imogi_pos_is_cashier_user() {
	if (frappe.boot?.imogi_pos_cashier_home) {
		return true;
	}

	const roles = imogi_pos_boot_roles();
	if (!roles.includes(IMOGI_CASHIER_ROLE)) {
		return false;
	}

	return !IMOGI_MANAGER_ROLES.some((role) => roles.includes(role));
}

function imogi_pos_is_waiter_user() {
	if (frappe.boot?.imogi_pos_waiter_home || frappe.boot?.imogi_pos_dedicated_waiter) {
		return true;
	}

	const roles = imogi_pos_boot_roles();
	if (!roles.includes(IMOGI_WAITER_ROLE)) {
		return false;
	}

	return !IMOGI_WAITER_ESCALATION_ROLES.some((role) => roles.includes(role));
}

function imogi_pos_is_dedicated_waiter_user() {
	return imogi_pos_is_waiter_user();
}

imogi_pos.is_waiter_user = imogi_pos_is_waiter_user;
imogi_pos.is_dedicated_waiter_user = imogi_pos_is_dedicated_waiter_user;
imogi_pos.is_on_table_service_surface = imogi_pos_is_on_table_service_surface;

function imogi_pos_requires_shift_workflow() {
	if (frappe.boot?.imogi_pos_requires_shift_workflow !== undefined) {
		return cint(frappe.boot.imogi_pos_requires_shift_workflow);
	}

	return imogi_pos_is_cashier_user();
}

function imogi_pos_after_shift_closed(message, options = {}) {
	frappe.boot.imogi_pos_has_open_shift = false;
	frappe.boot.imogi_pos_landing_target = "opening-entry";
	frappe.route_options = imogi_pos_get_opening_route_options(options);

	if (imogi_pos_requires_shift_workflow()) {
		try {
			sessionStorage.setItem("imogi_pos_expect_opening", "1");
		} catch (e) {
			// ignore
		}
		frappe.show_alert(
			{ message: message || __("Shift ditutup. Buka shift baru."), indicator: "green" },
			4
		);
		window.location.replace(IMOGI_OPEN_SHIFT_PATH);
		return;
	}

	frappe.boot.imogi_pos_landing_target = null;
	frappe.show_alert(
		{ message: message || __("Shift berhasil ditutup."), indicator: "green" },
		4
	);
	const home = frappe.boot?.imogi_pos_workspace_route || "imogi-pos-dashboard";
	setTimeout(() => frappe.set_route(home), 600);
}

function imogi_pos_get_landing_target() {
	if (!imogi_pos_is_cashier_user()) {
		return null;
	}

	if (frappe.boot?.imogi_pos_landing_target) {
		return frappe.boot.imogi_pos_landing_target;
	}

	if (!cint(frappe.boot?.imogi_pos_enable_shift)) {
		return "cashier";
	}

	return frappe.boot?.imogi_pos_has_open_shift ? "cashier" : "opening-entry";
}

function imogi_pos_current_path() {
	return window.location.pathname.replace(/\/$/, "");
}

function imogi_pos_on_cashier_page() {
	const path = imogi_pos_current_path();
	return path === IMOGI_CASHIER_PATH || path.endsWith("/app/imogi-pos-setup");
}

function imogi_pos_on_cashier_only_page() {
	return imogi_pos_current_path() === IMOGI_CASHIER_PATH;
}

function imogi_pos_on_close_shift_page() {
	const path = imogi_pos_current_path();
	if (path === IMOGI_CLOSE_SHIFT_PATH || path.startsWith(`${IMOGI_CLOSE_SHIFT_PATH}/`)) {
		return true;
	}
	const route = frappe.get_route?.() || [];
	return route[0] === IMOGI_CLOSE_SHIFT_PAGE;
}

function imogi_pos_on_open_shift_page() {
	const path = imogi_pos_current_path();
	if (path === IMOGI_OPEN_SHIFT_PATH || path.startsWith(`${IMOGI_OPEN_SHIFT_PATH}/`)) {
		return true;
	}
	const route = frappe.get_route?.() || [];
	return route[0] === IMOGI_OPEN_SHIFT_PAGE;
}

function imogi_pos_on_cashier_flow_page() {
	return (
		imogi_pos_on_open_shift_page() ||
		imogi_pos_on_cashier_only_page() ||
		imogi_pos_on_close_shift_page()
	);
}

function imogi_pos_on_order_history_page() {
	const path = imogi_pos_current_path();
	if (path === IMOGI_ORDER_HISTORY_PATH || path.startsWith(`${IMOGI_ORDER_HISTORY_PATH}/`)) {
		return true;
	}
	const route = frappe.get_route?.() || [];
	return route[0] === "imogi-pos-order-history";
}

function imogi_pos_on_table_service_page() {
	const path = imogi_pos_current_path();
	if (
		path === IMOGI_TABLE_SERVICE_PATH ||
		path.startsWith(`${IMOGI_TABLE_SERVICE_PATH}/`) ||
		path === "/app/table_service" ||
		path.startsWith("/app/table_service/")
	) {
		return true;
	}
	const route = frappe.get_route?.() || [];
	return route[0] === IMOGI_TABLE_SERVICE_PAGE || route[0] === "table_service";
}

function imogi_pos_is_on_table_service_surface() {
	return (
		imogi_pos_on_table_service_page() ||
		document.body.classList.contains("imogi-table-service-active") ||
		!!document.querySelector(".imogi-table-service-page")
	);
}

function imogi_pos_on_pos_order_form() {
	const route = frappe.get_route?.() || [];
	return route[0] === "Form" && route[1] === IMOGI_POS_ORDER_DOCTYPE;
}

function imogi_pos_on_restaurant_table_desk() {
	const route = frappe.get_route?.() || [];
	return (
		(route[0] === "List" || route[0] === "Form") &&
		route[1] === IMOGI_RESTAURANT_TABLE_DOCTYPE
	);
}

/** Waiter may open these without fullscreen guard sending them back to Table Service. */
function imogi_pos_on_waiter_allowed_page() {
	return (
		imogi_pos_on_table_service_page() ||
		imogi_pos_on_pos_order_form() ||
		imogi_pos_on_restaurant_table_desk() ||
		imogi_pos_on_cashier_only_page()
	);
}

function imogi_pos_on_waiter_desk_landing() {
	const path = imogi_pos_current_path();
	if (imogi_pos_on_waiter_allowed_page()) {
		return false;
	}
	if (path === "/app" || path === "/app/home" || path.startsWith("/app/home/")) {
		return true;
	}
	if (
		path === "/app/imogi-pos" ||
		path.endsWith("/app/imogi-pos") ||
		path === "/app/imogi-pos-dashboard"
	) {
		return true;
	}
	const route = frappe.get_route?.() || [];
	return route[0] === "Workspaces";
}

function imogi_pos_guard_waiter_fullscreen() {
	if (!imogi_pos_is_dedicated_waiter_user()) {
		return false;
	}
	if (imogi_pos_on_waiter_allowed_page()) {
		return false;
	}

	frappe.show_alert(
		{
			message: __(
				"Mode waiter aktif. Gunakan Table Service untuk kelola meja dan pesanan."
			),
			indicator: "orange",
		},
		4
	);
	window.location.replace(IMOGI_TABLE_SERVICE_PATH);
	return true;
}

function imogi_pos_redirect_waiter_home() {
	if (!imogi_pos_is_dedicated_waiter_user()) {
		return;
	}
	if (imogi_pos_on_table_service_page() || !imogi_pos_on_waiter_desk_landing()) {
		return;
	}
	window.location.replace(IMOGI_TABLE_SERVICE_PATH);
}

/** Cashier may open these without fullscreen guard sending them back to Kasir. */
function imogi_pos_on_cashier_allowed_page() {
	return (
		imogi_pos_on_cashier_flow_page() ||
		imogi_pos_on_order_history_page() ||
		imogi_pos_on_pos_order_form()
	);
}

function imogi_pos_logout_cashier(options = {}) {
	const shift_active = !!options.shift_active;
	const message = shift_active
		? __(
				"Logout sementara? Shift kasir tetap terbuka — transaksi tidak hilang. Login kembali dengan akun yang sama untuk melanjutkan."
		  )
		: __("Logout dan ganti user kasir?");
	frappe.confirm(message, () => {
		imogi_pos.opening_entry_locked = false;
		frappe.call({
			method: "logout",
			callback() {
				window.location.href = "/login";
			},
		});
	});
}

function imogi_pos_guard_cashier_fullscreen() {
	if (!imogi_pos_requires_shift_workflow()) {
		return false;
	}
	if (imogi_pos_on_cashier_allowed_page()) {
		return false;
	}

	frappe.show_alert(
		{
			message: __(
				"Mode kasir aktif. Gunakan tombol Logout di halaman Kasir untuk istirahat atau ganti user."
			),
			indicator: "orange",
		},
		4
	);

	const target = imogi_pos_get_landing_target();
	if (target === "opening-entry") {
		frappe.set_route(IMOGI_OPEN_SHIFT_PAGE);
	} else {
		window.location.replace(IMOGI_CASHIER_PATH);
	}
	return true;
}

imogi_pos.logout_cashier = imogi_pos_logout_cashier;
imogi_pos.is_cashier_flow_page = imogi_pos_on_cashier_flow_page;

function imogi_pos_on_shift_opening_form() {
	if (imogi_pos_on_open_shift_page()) {
		return true;
	}
	const path = imogi_pos_current_path();
	if (path.startsWith("/app/imogi-pos-shift-opening/")) {
		return true;
	}
	const route = frappe.get_route?.() || [];
	return route[0] === "Form" && route[1] === IMOGI_SHIFT_OPENING_DOCTYPE;
}

function imogi_pos_on_opening_entry_form() {
	return imogi_pos_on_shift_opening_form();
}

function imogi_pos_on_closing_entry_form() {
	const route = frappe.get_route?.() || [];
	return route[0] === "Form" && route[1] === "POS Closing Entry";
}

function imogi_pos_on_desk_landing() {
	const path = imogi_pos_current_path();
	if (
		imogi_pos_on_opening_entry_form() ||
		imogi_pos_on_cashier_page() ||
		imogi_pos_on_closing_entry_form() ||
		imogi_pos_on_open_shift_page() ||
		imogi_pos_on_close_shift_page()
	) {
		return false;
	}
	if (path === "/app" || path === "/app/home" || path.startsWith("/app/home/")) {
		return true;
	}
	if (
		path === "/app/imogi-pos" ||
		path.endsWith("/app/imogi-pos") ||
		path === "/app/imogi-pos-dashboard"
	) {
		return true;
	}
	const route = frappe.get_route?.() || [];
	return route[0] === "Workspaces";
}

function imogi_pos_get_opening_route_options(overrides = {}) {
	return Object.assign(
		{
			company: frappe.boot?.imogi_pos_default_company,
			pos_profile: frappe.boot?.imogi_pos_default_pos_profile,
			imogi_return_to_cashier: 1,
		},
		overrides
	);
}

function imogi_pos_go_to_opening_entry(overrides = {}) {
	const options = imogi_pos_get_opening_route_options(overrides);
	frappe.route_options = options;
	try {
		sessionStorage.setItem(IMOGI_OPENING_ROUTE_OPTIONS_KEY, JSON.stringify(options));
	} catch (e) {
		// ignore storage errors
	}

	if (typeof frappe.set_route === "function") {
		frappe.set_route(IMOGI_OPEN_SHIFT_PAGE);
		return;
	}

	window.location.href = IMOGI_OPEN_SHIFT_PATH;
}

function imogi_pos_guard_opening_entry_lock() {
	if (!imogi_pos_requires_shift_workflow()) {
		imogi_pos.opening_entry_locked = false;
		return false;
	}
	if (!imogi_pos.opening_entry_locked) {
		return false;
	}
	if (imogi_pos_on_opening_entry_form()) {
		return false;
	}

	frappe.show_alert(
		{
			message: __("Isi Opening Amount dan Submit shift kasir terlebih dahulu."),
			indicator: "orange",
		},
		5
	);

	imogi_pos_go_to_opening_entry();
	return true;
}

function imogi_pos_apply_landing(target, overrides = {}) {
	if (imogi_pos_guard_opening_entry_lock()) {
		return;
	}

	if (target === "opening-entry") {
		if (!imogi_pos_on_shift_opening_form()) {
			imogi_pos_go_to_opening_entry(overrides);
		}
		return;
	}

	if (target === "cashier") {
		if (
			imogi_pos_on_cashier_only_page() ||
			imogi_pos_on_open_shift_page() ||
			!imogi_pos_on_desk_landing()
		) {
			return;
		}
		window.location.replace(IMOGI_CASHIER_PATH);
	}
}

function imogi_pos_redirect_cashier_home() {
	if (typeof frappe === "undefined" || !frappe.boot) {
		return;
	}

	const target = imogi_pos_get_landing_target();
	if (!target) {
		return;
	}

	imogi_pos_apply_landing(target);
}

function imogi_pos_fetch_and_redirect() {
	if (!imogi_pos_is_cashier_user()) {
		return;
	}

	frappe.call({
		method: "imogi_pos.api.cashier.get_cashier_landing_status",
		callback(r) {
			if (r.exc || !r.message?.active) {
				imogi_pos_redirect_cashier_home();
				return;
			}

			const data = r.message;
			if (data.company) {
				frappe.boot.imogi_pos_default_company = data.company;
			}
			if (data.pos_profile) {
				frappe.boot.imogi_pos_default_pos_profile = data.pos_profile;
			}
			frappe.boot.imogi_pos_landing_target = data.landing;
			frappe.boot.imogi_pos_has_open_shift = data.landing === "cashier";
			imogi_pos_apply_landing(data.landing, {
				company: data.company,
				pos_profile: data.pos_profile,
			});
		},
	});
}

function imogi_pos_schedule_redirects() {
	imogi_pos_redirect_cashier_home();
	imogi_pos_redirect_waiter_home();
	imogi_pos_fetch_and_redirect();
	[250, 750, 1500].forEach((delay) => {
		setTimeout(imogi_pos_redirect_cashier_home, delay);
		setTimeout(imogi_pos_redirect_waiter_home, delay);
		setTimeout(imogi_pos_fetch_and_redirect, delay);
	});
}

imogi_pos_ensure_logout();

const IMOGI_POS_THEMED_ROUTES = new Set([
	"imogi-pos-cashier",
	"imogi-pos-open-shift",
	"imogi-pos-close-shift",
	"imogi-pos-order-history",
	"table-service",
]);

function imogi_pos_is_themed_route(route = frappe.get_route?.() || []) {
	if (IMOGI_POS_THEMED_ROUTES.has(route[0])) {
		return true;
	}
	// Route can lag behind URL during SPA navigation — use path as fallback.
	return imogi_pos_on_cashier_flow_page() || imogi_pos_on_order_history_page() || imogi_pos_on_table_service_page();
}

function imogi_pos_apply_desk_logo() {
	const logo_url =
		frappe.boot?.imogi_pos_desk_logo_url ||
		frappe.boot?.app_logo_url ||
		"/assets/imogi_pos/images/imogi-pos-logo.png";
	document.querySelectorAll(".navbar-brand .app-logo").forEach((img) => {
		if (img.getAttribute("src") !== logo_url) {
			img.setAttribute("src", logo_url);
		}
	});
}

function imogi_pos_sync_cashier_fullscreen() {
	const cashier_active =
		imogi_pos_on_order_history_page() ||
		(imogi_pos_requires_shift_workflow() && imogi_pos_on_cashier_flow_page());
	const table_service_fs =
		document.body.classList.contains("imogi-table-service-fullscreen") ||
		imogi_pos_is_on_table_service_surface();
	document.body.classList.toggle(
		"imogi-pos-cashier-fullscreen",
		cashier_active || table_service_fs
	);
	document.body.classList.toggle("imogi-table-service-fullscreen", table_service_fs);
	if (table_service_fs && imogi_pos_is_dedicated_waiter_user()) {
		document.documentElement.classList.add("imogi-pos-waiter-dedicated");
	} else if (!imogi_pos_is_dedicated_waiter_user() || !imogi_pos_is_on_table_service_surface()) {
		document.documentElement.classList.remove("imogi-pos-waiter-dedicated");
	}
	if (table_service_fs) {
		document.querySelectorAll(".page-head, .sticky-top").forEach((el) => {
			el.style.setProperty("display", "none", "important");
		});
	}
}

function imogi_pos_paint_table_service_canvas() {
	if (!imogi_pos_is_on_table_service_surface()) {
		return;
	}
	document.body.classList.add("imogi-table-service-active");
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
			".layout-main, .layout-main-section-wrapper, .layout-main-section, .page-body, .page-container, .main-section, .container, .container.page-body, .page-wrapper, .page-content, .row.layout-main, .content.page-container, .imogi-table-service-page, .imogi-ts-shell"
		)
		.forEach(paint);
	imogi_pos.paint_table_service_topbar?.();
}

function imogi_pos_activate_table_service_shell(wrapper) {
	document.body.classList.add("imogi-table-service-active");
	if (wrapper) {
		const $wrapper = $(wrapper);
		$wrapper.find(".page-head").hide();
		$wrapper.find(".layout-main-section-wrapper").css("max-width", "100%");
	}
	imogi_pos_sync_desk_theme();
	imogi_pos_paint_table_service_canvas();
}

imogi_pos.activate_table_service_shell = imogi_pos_activate_table_service_shell;
imogi_pos.paint_table_service_canvas = imogi_pos_paint_table_service_canvas;

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

function imogi_pos_sync_desk_theme() {
	const themed = imogi_pos_is_themed_route();
	document.body.classList.toggle("imogi-pos-themed", themed);
	imogi_pos_sync_cashier_fullscreen();
	imogi_pos_apply_desk_logo();
	imogi_pos_paint_cashier_canvas();
	imogi_pos_paint_table_service_canvas();
}

function imogi_pos_should_redirect_to_setup(route = frappe.get_route?.() || []) {
	if (frappe.boot?.imogi_pos_setup_complete) {
		return false;
	}
	if (imogi_pos_is_cashier_user()) {
		return false;
	}
	if (imogi_pos_is_dedicated_waiter_user()) {
		return false;
	}
	if (route[0] === "imogi-pos-setup" || route[0] === "setup-wizard") {
		return false;
	}
	return true;
}

function imogi_pos_redirect_to_setup_if_needed() {
	if (!imogi_pos_should_redirect_to_setup()) {
		return false;
	}
	frappe.set_route("imogi-pos-setup");
	return true;
}

const IMOGI_SETTINGS_DOCTYPE = "IMOGI POS Settings";
const IMOGI_SETTINGS_SLUG = "imogi-pos-settings";

function imogi_pos_has_settings_doctype_route() {
	return !!(frappe.router?.routes && frappe.router.routes[IMOGI_SETTINGS_SLUG]);
}

function imogi_pos_patch_settings_slug_route() {
	if (!frappe.router || frappe.router._imogi_pos_settings_slug_patched) {
		return;
	}

	const original = frappe.router.convert_to_standard_route.bind(frappe.router);
	frappe.router.convert_to_standard_route = async function (route) {
		const slug = route && route[0];
		if (slug === IMOGI_SETTINGS_SLUG && !this.routes?.[IMOGI_SETTINGS_SLUG]) {
			if (imogi_pos_is_cashier_user()) {
				const landing = imogi_pos_get_landing_target();
				return [landing === "opening-entry" ? IMOGI_OPEN_SHIFT_PAGE : "imogi-pos-cashier"];
			}
			if (imogi_pos_is_dedicated_waiter_user()) {
				return [IMOGI_TABLE_SERVICE_PAGE];
			}
			const docname =
				route.length > 1 && route[1] !== "view"
					? decodeURIComponent(route[1])
					: IMOGI_SETTINGS_DOCTYPE;
			return ["Form", IMOGI_SETTINGS_DOCTYPE, docname];
		}
		return original(route);
	};
	frappe.router._imogi_pos_settings_slug_patched = true;
}

function imogi_pos_guard_cashier_settings_slug() {
	if (imogi_pos_current_path() !== `/app/${IMOGI_SETTINGS_SLUG}`) {
		return false;
	}
	if (imogi_pos_is_dedicated_waiter_user()) {
		window.location.replace(IMOGI_TABLE_SERVICE_PATH);
		return true;
	}
	if (!imogi_pos_is_cashier_user() || imogi_pos_has_settings_doctype_route()) {
		return false;
	}
	const landing = imogi_pos_get_landing_target();
	if (landing === "opening-entry") {
		imogi_pos_go_to_opening_entry();
	} else {
		window.location.replace(IMOGI_CASHIER_PATH);
	}
	return true;
}

imogi_pos.settings_form_route = () => ["Form", IMOGI_SETTINGS_DOCTYPE, IMOGI_SETTINGS_DOCTYPE];

imogi_pos.sync_desk_theme = imogi_pos_sync_desk_theme;
imogi_pos.paint_cashier_canvas = imogi_pos_paint_cashier_canvas;

$(document).on("app_ready", () => {
	imogi_pos_ensure_logout();
	imogi_pos_patch_settings_slug_route();
	imogi_pos_sync_desk_theme();

	if (imogi_pos_guard_cashier_settings_slug()) {
		return;
	}

	if (imogi_pos_redirect_to_setup_if_needed()) {
		return;
	}

	imogi_pos_schedule_redirects();

	if (frappe.router?.on) {
		frappe.router.on("change", () => {
			imogi_pos_sync_desk_theme();
			setTimeout(() => {
				imogi_pos_sync_desk_theme();
				if (imogi_pos_guard_cashier_settings_slug()) {
					return;
				}
				if (imogi_pos_redirect_to_setup_if_needed()) {
					return;
				}
				if (imogi_pos_guard_opening_entry_lock()) {
					return;
				}
				if (imogi_pos_guard_cashier_fullscreen()) {
					return;
				}
				if (imogi_pos_guard_waiter_fullscreen()) {
					return;
				}
				if (
					frappe.boot?.imogi_pos_dedicated_cashier &&
					(imogi_pos_current_path() === "/app/imogi-pos" ||
						imogi_pos_current_path().endsWith("/app/imogi-pos"))
				) {
					const landing = imogi_pos_get_landing_target();
					if (landing === "opening-entry") {
						imogi_pos_go_to_opening_entry();
					} else {
						window.location.replace(IMOGI_CASHIER_PATH);
					}
					return;
				}
				if (imogi_pos_is_dedicated_waiter_user() && imogi_pos_on_imogi_workspace()) {
					window.location.replace(IMOGI_TABLE_SERVICE_PATH);
					return;
				}
				if (
					imogi_pos_is_dedicated_waiter_user() &&
					(imogi_pos_current_path() === "/app/imogi-pos" ||
						imogi_pos_current_path().endsWith("/app/imogi-pos"))
				) {
					window.location.replace(IMOGI_TABLE_SERVICE_PATH);
					return;
				}
				imogi_pos_redirect_cashier_home();
				imogi_pos_redirect_waiter_home();
			}, 50);
			setTimeout(imogi_pos_sync_desk_theme, 200);
		});
	}

	$(document).on("page-change", () => {
		imogi_pos_sync_desk_theme();
		setTimeout(imogi_pos_sync_desk_theme, 50);
		setTimeout(() => {
			if (imogi_pos_guard_cashier_settings_slug()) {
				return;
			}
			if (imogi_pos_guard_opening_entry_lock()) {
				return;
			}
			if (imogi_pos_guard_cashier_fullscreen()) {
				return;
			}
			if (imogi_pos_guard_waiter_fullscreen()) {
				return;
			}
			imogi_pos_redirect_cashier_home();
			imogi_pos_redirect_waiter_home();
		}, 50);
	});

	$(document).on("click", ".desk-sidebar a, .navbar-brand.navbar-home", function (event) {
		if (!imogi_pos.opening_entry_locked || !imogi_pos_requires_shift_workflow()) {
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		imogi_pos_guard_opening_entry_lock();
	});
});
