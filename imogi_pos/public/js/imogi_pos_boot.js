frappe.provide("imogi_pos");

imogi_pos.opening_entry_locked = false;
imogi_pos.opening_entry_docname = null;

const IMOGI_CASHIER_ROLE = "IMOGI Cashier";
const IMOGI_MANAGER_ROLES = ["System Manager", "Administrator"];
const IMOGI_CASHIER_PATH = "/app/imogi-pos-cashier";
const IMOGI_OPEN_SHIFT_PATH = "/app/imogi-pos-open-shift";
const IMOGI_CLOSE_SHIFT_PATH = "/app/imogi-pos-close-shift";
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

function imogi_pos_is_cashier_user() {
	if (frappe.boot?.imogi_pos_cashier_home) {
		return true;
	}

	const roles = frappe.user_roles || [];
	if (!roles.includes(IMOGI_CASHIER_ROLE)) {
		return false;
	}

	return !IMOGI_MANAGER_ROLES.some((role) => roles.includes(role));
}

function imogi_pos_requires_shift_workflow() {
	if (frappe.boot?.imogi_pos_requires_shift_workflow !== undefined) {
		return cint(frappe.boot.imogi_pos_requires_shift_workflow);
	}

	return imogi_pos_is_cashier_user();
}

function imogi_pos_after_shift_closed(message) {
	frappe.boot.imogi_pos_has_open_shift = false;
	frappe.route_options = {};

	if (imogi_pos_requires_shift_workflow()) {
		frappe.boot.imogi_pos_landing_target = "opening-entry";
		frappe.show_alert(
			{ message: message || __("Shift ditutup. Buka shift baru."), indicator: "green" },
			4
		);
		setTimeout(() => frappe.set_route(IMOGI_OPEN_SHIFT_PAGE), 600);
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

function imogi_pos_logout_cashier() {
	frappe.confirm(__("Logout dan ganti user kasir?"), () => {
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
	if (imogi_pos_on_cashier_flow_page()) {
		return false;
	}

	frappe.show_alert(
		{
			message: __("Mode kasir aktif. Logout dari Opening Shift untuk ganti user."),
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
	if (path === "/app/imogi-pos" || path === "/app/imogi-pos-dashboard") {
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

	if (target === "cashier" && imogi_pos_on_desk_landing()) {
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
			if (data.shift_opening_draft) {
				frappe.boot.imogi_pos_shift_opening_draft = data.shift_opening_draft;
			}
			imogi_pos_apply_landing(data.landing, {
				company: data.company,
				pos_profile: data.pos_profile,
				shift_opening_draft: data.shift_opening_draft,
			});
		},
	});
}

function imogi_pos_schedule_redirects() {
	imogi_pos_redirect_cashier_home();
	imogi_pos_fetch_and_redirect();
	[250, 750, 1500].forEach((delay) => {
		setTimeout(imogi_pos_redirect_cashier_home, delay);
		setTimeout(imogi_pos_fetch_and_redirect, delay);
	});
}

imogi_pos_ensure_logout();

const IMOGI_POS_THEMED_ROUTES = new Set([
	"imogi-pos-cashier",
	"imogi-pos-open-shift",
	"imogi-pos-close-shift",
]);

function imogi_pos_is_themed_route(route = frappe.get_route?.() || []) {
	return IMOGI_POS_THEMED_ROUTES.has(route[0]);
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
	const active = imogi_pos_requires_shift_workflow() && imogi_pos_on_cashier_flow_page();
	document.body.classList.toggle("imogi-pos-cashier-fullscreen", active);
}

function imogi_pos_sync_desk_theme() {
	const themed = imogi_pos_is_themed_route();
	document.body.classList.toggle("imogi-pos-themed", themed);
	imogi_pos_sync_cashier_fullscreen();
	imogi_pos_apply_desk_logo();
}

function imogi_pos_should_redirect_to_setup(route = frappe.get_route?.() || []) {
	if (frappe.boot?.imogi_pos_setup_complete) {
		return false;
	}
	if (imogi_pos_is_cashier_user()) {
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

imogi_pos.sync_desk_theme = imogi_pos_sync_desk_theme;

$(document).on("app_ready", () => {
	imogi_pos_ensure_logout();
	imogi_pos_sync_desk_theme();

	if (imogi_pos_redirect_to_setup_if_needed()) {
		return;
	}

	imogi_pos_schedule_redirects();

	if (frappe.router?.on) {
		frappe.router.on("change", () => {
			setTimeout(() => {
				imogi_pos_sync_desk_theme();
				if (imogi_pos_redirect_to_setup_if_needed()) {
					return;
				}
				if (imogi_pos_guard_opening_entry_lock()) {
					return;
				}
				if (imogi_pos_guard_cashier_fullscreen()) {
					return;
				}
				imogi_pos_redirect_cashier_home();
			}, 50);
		});
	}

	$(document).on("page-change", () => {
		imogi_pos_sync_desk_theme();
		setTimeout(() => {
			if (imogi_pos_guard_opening_entry_lock()) {
				return;
			}
			if (imogi_pos_guard_cashier_fullscreen()) {
				return;
			}
			imogi_pos_redirect_cashier_home();
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
