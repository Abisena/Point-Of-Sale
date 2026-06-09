// Copyright (c) 2026, Imogi and contributors

frappe.provide("imogi_pos.offline");

const IMOGI_OFFLINE_DB = "imogi_pos_offline_v1";
const IMOGI_OFFLINE_STORE = "checkout_queue";
const IMOGI_CATALOG_STORE = "catalog_cache";

imogi_pos.offline.is_enabled = function (page) {
	return !!(page?.context?.enable_offline_cashier);
};

imogi_pos.offline._open_db = function () {
	return new Promise((resolve, reject) => {
		if (!window.indexedDB) {
			reject(new Error("IndexedDB unavailable"));
			return;
		}
		const req = indexedDB.open(IMOGI_OFFLINE_DB, 2);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(IMOGI_OFFLINE_STORE)) {
				db.createObjectStore(IMOGI_OFFLINE_STORE, { keyPath: "client_id" });
			}
			if (!db.objectStoreNames.contains(IMOGI_CATALOG_STORE)) {
				db.createObjectStore(IMOGI_CATALOG_STORE, { keyPath: "cache_key" });
			}
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
};

imogi_pos.offline._with_store = function (store_name, mode, fn) {
	return imogi_pos.offline._open_db().then(
		(db) =>
			new Promise((resolve, reject) => {
				const tx = db.transaction(store_name, mode);
				const store = tx.objectStore(store_name);
				Promise.resolve(fn(store))
					.then(resolve)
					.catch(reject);
				tx.oncomplete = () => db.close();
				tx.onerror = () => reject(tx.error);
			})
	);
};

imogi_pos.offline._catalog_key = function (page, args = {}) {
	const branch = args.branch || page?.get_active_branch_code?.() || page?.context?.active_branch?.branch_code || "";
	const pos = args.pos_profile || page?.context?.pos_profile || "";
	const search = args.search || "";
	const group = args.pos_category || args.item_group || "";
	return [branch, pos, search, group].join("|");
};

imogi_pos.offline.save_catalog = function (page, args, items) {
	if (!imogi_pos.offline.is_enabled(page) || !items?.length) {
		return Promise.resolve();
	}
	const cache_key = imogi_pos.offline._catalog_key(page, args);
	const row = {
		cache_key,
		items,
		cached_at: new Date().toISOString(),
	};
	return imogi_pos.offline._with_store(IMOGI_CATALOG_STORE, "readwrite", (store) => {
		store.put(row);
	});
};

imogi_pos.offline.load_catalog = function (page, args) {
	const cache_key = imogi_pos.offline._catalog_key(page, args);
	return imogi_pos.offline._with_store(IMOGI_CATALOG_STORE, "readonly", (store) => {
		return new Promise((resolve, reject) => {
			const req = store.get(cache_key);
			req.onsuccess = () => resolve(req.result?.items || []);
			req.onerror = () => reject(req.error);
		});
	});
};

imogi_pos.offline.queue_checkout = function (payload) {
	const client_id =
		payload.client_id ||
		`offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	const row = {
		client_id,
		created_at: new Date().toISOString(),
		status: "pending",
		payload,
	};
	return imogi_pos.offline._with_store(IMOGI_OFFLINE_STORE, "readwrite", (store) => {
		store.put(row);
		return client_id;
	});
};

imogi_pos.offline.list_pending = function () {
	return imogi_pos.offline._with_store(IMOGI_OFFLINE_STORE, "readonly", (store) => {
		return new Promise((resolve, reject) => {
			const req = store.getAll();
			req.onsuccess = () => {
				const rows = (req.result || []).filter((row) => row.status === "pending");
				resolve(rows);
			};
			req.onerror = () => reject(req.error);
		});
	});
};

imogi_pos.offline._mark_done = function (client_id) {
	return imogi_pos.offline._with_store(IMOGI_OFFLINE_STORE, "readwrite", (store) => {
		return new Promise((resolve, reject) => {
			const req = store.get(client_id);
			req.onsuccess = () => {
				const row = req.result;
				if (!row) {
					resolve();
					return;
				}
				row.status = "synced";
				store.put(row);
				resolve();
			};
			req.onerror = () => reject(req.error);
		});
	});
};

imogi_pos.offline.sync_queue = function (page) {
	if (!imogi_pos.offline.is_enabled(page) || !navigator.onLine) {
		return Promise.resolve({ synced: 0 });
	}
	return imogi_pos.offline.list_pending().then((rows) => {
		if (!rows.length) return { synced: 0 };
		let synced = 0;
		const chain = rows.reduce((p, row) => {
			return p.then(() => {
				const payload = row.payload || {};
				return new Promise((resolve) => {
					frappe.call({
						method: "imogi_pos.api.cashier.checkout",
						args: {
							...payload,
							offline_client_id: row.client_id,
						},
						callback(r) {
							if (!r.exc) {
								synced += 1;
								imogi_pos.offline._mark_done(row.client_id);
							}
							resolve();
						},
					});
				});
			});
		}, Promise.resolve());
		return chain.then(() => {
			if (synced > 0) {
				frappe.show_alert(
					{ message: __("{0} transaksi offline tersinkron", [synced]), indicator: "green" },
					4
				);
			}
			imogi_pos.offline.update_badge(page, synced);
			return { synced };
		});
	});
};

imogi_pos.offline.update_badge = function (page) {
	if (!page || !page.$offline_badge) return;
	imogi_pos.offline.list_pending().then((rows) => {
		const count = rows.length;
		page.$offline_badge.text(count);
		if (page.$offline_chip) {
			page.$offline_chip.toggleClass("is-visible has-pending", count > 0);
			page.sync_status_strip?.();
		} else {
			page.$offline_bar?.toggleClass("has-pending", count > 0);
		}
	});
};

imogi_pos.offline.can_checkout_offline = function (page, mode_of_payment) {
	if (!imogi_pos.offline.is_enabled(page) || navigator.onLine) return false;
	const mode = String(mode_of_payment || "").toLowerCase();
	return mode.includes("cash") || mode.includes("tunai");
};

imogi_pos.offline.handle_checkout = function (page, args, on_success) {
	return imogi_pos.offline.queue_checkout(args).then((client_id) => {
		imogi_pos.offline.update_badge(page);
		frappe.show_alert(
			{
				message: __("Transaksi disimpan offline. Akan disinkron saat online."),
				indicator: "orange",
			},
			5
		);
		on_success &&
			on_success({
				name: client_id,
				status: "Offline Pending",
				grand_total: args.total || 0,
				offline: true,
			});
	});
};

imogi_pos.offline.bind_page = function (page) {
	if (!imogi_pos.offline.is_enabled(page)) return;
	imogi_pos.offline.update_badge(page);
	window.addEventListener("online", () => {
		imogi_pos.offline.sync_queue(page);
	});
	setTimeout(() => imogi_pos.offline.sync_queue(page), 1200);
};
