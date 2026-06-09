// Copyright (c) 2026, Imogi and contributors

frappe.provide("imogi_pos.pwa");

imogi_pos.pwa.init = function () {
	if (typeof window === "undefined") return;

	imogi_pos.pwa._inject_manifest();
	imogi_pos.pwa._register_service_worker();
	imogi_pos.pwa._bind_online_status();
	imogi_pos.pwa._inject_viewport_meta();
};

imogi_pos.pwa._inject_manifest = function () {
	if (document.querySelector('link[rel="manifest"]')) return;
	const link = document.createElement("link");
	link.rel = "manifest";
	link.href = "/assets/imogi_pos/manifest.webmanifest";
	document.head.appendChild(link);

	const theme = document.createElement("meta");
	theme.name = "theme-color";
	theme.content = "#0f1f35";
	document.head.appendChild(theme);

	const apple = document.createElement("meta");
	apple.name = "apple-mobile-web-app-capable";
	apple.content = "yes";
	document.head.appendChild(apple);
};

imogi_pos.pwa._inject_viewport_meta = function () {
	const existing = document.querySelector('meta[name="viewport"]');
	if (!existing) return;
	const content = existing.getAttribute("content") || "";
	if (!content.includes("viewport-fit=cover")) {
		existing.setAttribute("content", `${content}, viewport-fit=cover`.replace(/^, /, ""));
	}
};

imogi_pos.pwa._register_service_worker = function () {
	if (!("serviceWorker" in navigator)) return;
	navigator.serviceWorker
		.register("/assets/imogi_pos/sw.js", { scope: "/assets/imogi_pos/" })
		.catch(() => undefined);
};

imogi_pos.pwa._bind_online_status = function () {
	const show_banner = (offline) => {
		let $bar = $("#imogi-pos-offline-bar");
		if (!$bar.length) {
			$bar = $(`<div id="imogi-pos-offline-bar" class="imogi-pos-offline-bar"></div>`);
			$("body").append($bar);
		}
		if (offline) {
			$bar
				.text(__("Mode offline — transaksi tunai akan antri dan disinkron otomatis."))
				.addClass("is-visible");
		} else {
			$bar.removeClass("is-visible");
		}
	};

	show_banner(!navigator.onLine);
	window.addEventListener("online", () => show_banner(false));
	window.addEventListener("offline", () => show_banner(true));
};

$(document).ready(() => {
	imogi_pos.pwa.init();
});
