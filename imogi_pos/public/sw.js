/* IMOGI POS — lightweight offline shell for cashier static assets */

const CACHE_NAME = "imogi-pos-shell-v5";
const SHELL_ASSETS = [
	"/assets/imogi_pos/css/imogi_pos.css",
	"/assets/imogi_pos/js/imogi_pos_boot.js",
	"/assets/imogi_pos/js/imogi_pos_loyalty.js",
	"/assets/imogi_pos/js/imogi_pos_feature_upgrade.js",
	"/assets/imogi_pos/js/imogi_pos_pwa.js",
	"/assets/imogi_pos/js/qrcode.min.js",
	"/assets/imogi_pos/js/imogi_pos_qris_payment.js",
	"/assets/imogi_pos/js/imogi_pos_thermal_print.js",
	"/assets/imogi_pos/js/imogi_pos_variant_modal.js",
	"/assets/imogi_pos/images/imogi-pos-logo.png",
	"/assets/imogi_pos/images/imogi-pos-favicon.png",
];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS).catch(() => undefined))
	);
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
		)
	);
	self.clients.claim();
});

self.addEventListener("fetch", (event) => {
	const { request } = event;
	if (request.method !== "GET") return;

	const url = new URL(request.url);
	if (!url.pathname.startsWith("/assets/imogi_pos/")) return;

	// JS/CSS: network-first so QRIS fixes reach cashier without hard refresh.
	if (/\.(js|css)(\?|$)/.test(url.pathname)) {
		event.respondWith(
			fetch(request)
				.then((response) => {
					if (response && response.status === 200) {
						const copy = response.clone();
						caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
					}
					return response;
				})
				.catch(() => caches.match(request))
		);
		return;
	}

	event.respondWith(
		caches.match(request).then((cached) => {
			if (cached) return cached;
			return fetch(request)
				.then((response) => {
					if (!response || response.status !== 200) return response;
					const copy = response.clone();
					caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
					return response;
				})
				.catch(() => cached);
		})
	);
});
