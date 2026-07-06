(function () {
	const params = new URLSearchParams(window.location.search);
	const TABLE = params.get("table") || "";
	const TOKEN = params.get("token") || "";
	const $app = document.getElementById("imogi-qr-app");
	let pollTimer = null;
	let touchStartX = 0;

	const CATEGORY_GRADIENTS = {
		Food: "linear-gradient(160deg, #5c3d1e 0%, #c9a227 100%)",
		Beverage: "linear-gradient(160deg, #16213e 0%, #44607d 100%)",
		Dessert: "linear-gradient(160deg, #6b3a5d 0%, #e8a0bf 100%)",
		Service: "linear-gradient(160deg, #1a3a2a 0%, #4a8f6a 100%)",
		"Combo Package": "linear-gradient(160deg, #16213e 0%, #c9a227 100%)",
		Lainnya: "linear-gradient(160deg, #2a2a2a 0%, #666 100%)",
	};

	if (!TABLE || !TOKEN) {
		$app.innerHTML = `<div class="imogi-qr-error">QR tidak valid. Scan ulang QR di meja Anda.</div>`;
		return;
	}

	const state = {
		view: "categories",
		table: null,
		categories: [],
		items: [],
		cart: [],
		payment: {},
		selectedCategory: null,
		categoryIndex: 0,
		productIndex: 0,
		variant: null,
		toast: null,
	};

	function esc(s) {
		return String(s ?? "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/"/g, "&quot;");
	}

	function money(val) {
		try {
			return new Intl.NumberFormat("id-ID", {
				style: "currency",
				currency: "IDR",
				maximumFractionDigits: 0,
			}).format(Number(val || 0));
		} catch (e) {
			return "Rp " + Number(val || 0).toLocaleString("id-ID");
		}
	}

	async function api(method, args) {
		const body = new URLSearchParams({ ...args, table: TABLE, token: TOKEN });
		const res = await fetch(`/api/method/${method}`, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body,
		});
		const data = await res.json();
		if (data.exc) {
			const msg = data._server_messages
				? JSON.parse(data._server_messages)
						.map((m) => JSON.parse(m).message)
						.join(" ")
				: data.message;
			throw new Error(msg || "Request gagal");
		}
		return data.message;
	}

	function stopPoll() {
		if (pollTimer) {
			clearInterval(pollTimer);
			pollTimer = null;
		}
	}

	function cartTotal() {
		return state.cart.reduce((sum, row) => sum + Number(row.qty) * Number(row.rate), 0);
	}

	function cartCount() {
		return state.cart.reduce((sum, row) => sum + Number(row.qty), 0);
	}

	function cartKey(row) {
		return `${row.item_code}::${row.variant_summary || ""}`;
	}

	function showToast(name) {
		state.toast = { name };
		render();
		clearTimeout(showToast._timer);
		showToast._timer = setTimeout(() => {
			state.toast = null;
			render();
		}, 2000);
	}

	function categoryProducts() {
		const cat = state.selectedCategory;
		return (state.items || []).filter((item) => {
			return !cat || (item.imogi_pos_category || "Lainnya") === cat;
		});
	}

	function itemInitials(name) {
		const parts = String(name || "?")
			.trim()
			.split(/\s+/)
			.filter(Boolean);
		if (!parts.length) return "?";
		return parts
			.slice(0, 2)
			.map((p) => p[0])
			.join("")
			.toUpperCase();
	}

	function tableMetaLine() {
		const t = state.table || {};
		return `Meja <strong>${esc(t.table_number || TABLE)}</strong>${t.area ? ` · ${esc(t.area)}` : ""}${t.floor ? ` · ${esc(t.floor)}` : ""}`;
	}

	function addCartRow(row) {
		const key = cartKey(row);
		const existing = state.cart.find((r) => cartKey(r) === key);
		if (existing) {
			existing.qty += 1;
		} else {
			state.cart.push({ ...row, qty: 1 });
		}
		showToast(row.item_name);
		render();
	}

	function addToCart(item) {
		if (item.has_variants) {
			openVariantPicker(item);
			return;
		}
		const code = item.auto_variant_item_code || item.item_code;
		addCartRow({
			item_code: code,
			item_name: item.item_name || item.item_code,
			rate: item.rate || item.price_list_rate || 0,
			variant_summary: "",
		});
	}

	function openVariantPicker(item) {
		const method = item.addon_only
			? "imogi_pos.api.qr_order_api.get_qr_item_addon_config"
			: "imogi_pos.api.qr_order_api.get_qr_item_variant_config";
		const args = item.addon_only
			? { item_code: item.item_code }
			: { template_item_code: item.item_code };

		state.variant = { loading: true, item, config: null, selections: {}, addons: {} };
		render();

		api(method, args)
			.then((config) => {
				const selections = {};
				(config.attributes || []).forEach((attr) => {
					selections[attr.attribute] = attr.default || (attr.values[0] && attr.values[0].value);
				});
				state.variant = { loading: false, item, config, selections, addons: {} };
				render();
			})
			.catch((err) => {
				state.variant = null;
				alert(err.message || "Gagal memuat varian");
				render();
			});
	}

	function getSelectedVariant() {
		const cfg = state.variant?.config;
		if (!cfg) return null;
		const keys = Object.keys(state.variant.selections || {});
		return (
			(cfg.variants || []).find((row) =>
				keys.every((key) => (row.attributes || {})[key] === state.variant.selections[key])
			) || null
		);
	}

	function getVariantRate() {
		const cfg = state.variant?.config;
		if (!cfg) return 0;
		let total = Number(cfg.base_rate || 0);
		(cfg.attributes || []).forEach((attr) => {
			const selected = state.variant.selections[attr.attribute];
			const row = (attr.values || []).find((v) => v.value === selected);
			if (row) total += Number(row.price_delta || 0);
		});
		Object.keys(state.variant.addons || {}).forEach((code) => {
			if (!state.variant.addons[code]) return;
			const row = (cfg.add_ons || []).find((a) => a.item_code === code);
			if (row) total += Number(row.rate || 0);
		});
		return total;
	}

	function variantSummaryParts() {
		const cfg = state.variant?.config;
		if (!cfg) return [];
		const parts = [];
		(cfg.attributes || []).forEach((attr) => {
			const val = state.variant.selections[attr.attribute];
			if (val) parts.push(val);
		});
		const addonNames = Object.keys(state.variant.addons || {})
			.filter((code) => state.variant.addons[code])
			.map((code) => (cfg.add_ons || []).find((a) => a.item_code === code)?.item_name)
			.filter(Boolean);
		if (addonNames.length) parts.push(addonNames.join(", "));
		return parts;
	}

	function confirmVariantAdd() {
		const v = state.variant;
		if (!v?.config) return;
		const variant = getSelectedVariant();
		if (!variant && (v.config.attributes || []).length) {
			alert("Pilih varian terlebih dahulu.");
			return;
		}
		const code = variant?.item_code || v.config.template_item_code || v.item.item_code;
		const summary = variantSummaryParts().join(" · ");
		const displayName = v.config.item_name || v.item.item_name;
		addCartRow({
			item_code: code,
			item_name: summary ? `${displayName} (${summary})` : displayName,
			rate: getVariantRate(),
			variant_summary: summary,
		});
		state.variant = null;
	}

	function iconBtn(label, icon, attrs = "", disabled = false) {
		return `<button type="button" class="imogi-qr-icon-btn" aria-label="${esc(label)}" ${disabled ? "disabled" : ""} ${attrs}>${icon}</button>`;
	}

	const ICON_BACK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>`;
	const ICON_CART = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`;
	const ICON_PREV = ICON_BACK;
	const ICON_NEXT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>`;
	const ICON_CLOSE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>`;

	const MAX_INLINE_DOTS = 7;

	function loadingScreen(text) {
		return `<div class="imogi-qr-loading-screen">
			<div class="imogi-qr-loading-spinner" aria-hidden="true"></div>
			<p>${esc(text)}</p>
		</div>`;
	}

	function renderDotPagination(count, active, { dotAttr, extraClass = "" } = {}) {
		if (count <= MAX_INLINE_DOTS) {
			return Array.from({ length: count }, (_, i) => {
				const attr = dotAttr ? ` ${dotAttr}="${i}"` : "";
				return `<button type="button" class="imogi-qr-dot ${extraClass}${i === active ? " is-active" : ""}"${attr} aria-label="Item ${i + 1}"></button>`;
			}).join("");
		}
		return `<span class="imogi-qr-page-counter">${active + 1} / ${count}</span>`;
	}

	function renderWelcomeHeader(centerHtml, showBack) {
		const count = cartCount();
		return `
			<div class="imogi-qr-topbar">
				${showBack ? iconBtn("Kembali", ICON_BACK, 'id="imogi-qr-back"') : `<span class="imogi-qr-icon-spacer"></span>`}
				<div class="imogi-qr-topbar-center">${centerHtml}</div>
				<button type="button" class="imogi-qr-icon-btn imogi-qr-icon-btn--cart" id="imogi-qr-open-checkout" aria-label="Keranjang ${count} item, ${money(cartTotal())}" title="Keranjang">
					${ICON_CART}
					${count ? `<span class="imogi-qr-icon-badge">${count}</span>` : ""}
				</button>
			</div>
			<div class="imogi-qr-table-pill">${tableMetaLine()}</div>`;
	}

	function carouselStyle(offset, total, spread) {
		const capped = Math.max(-2, Math.min(2, offset));
		const cappedAbs = Math.abs(capped);
		const absOffset = Math.abs(offset);
		const rotateY = capped * 40;
		const translateX = capped * spread;
		const translateZ = -cappedAbs * 90;
		const scale = 1 - cappedAbs * 0.12;
		const opacity = offset === 0 ? 1 : absOffset === 1 ? 0.65 : 0.3;
		return {
			transform: `perspective(1200px) translateX(calc(-50% + ${translateX}px)) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
			opacity,
			zIndex: String(total - absOffset),
		};
	}

	function applyCarouselCards(selector, idxAttr, activeIndex, total, spread) {
		document.querySelectorAll(selector).forEach((el) => {
			const i = Number(el.getAttribute(idxAttr));
			const s = carouselStyle(i - activeIndex, total, spread);
			el.style.transform = s.transform;
			el.style.opacity = s.opacity;
			el.style.zIndex = s.zIndex;
		});
	}

	function syncDots(selector, activeIndex) {
		document.querySelectorAll(selector).forEach((btn) => {
			const idx = Number(btn.getAttribute("data-cat-dot") ?? btn.getAttribute("data-prod-dot"));
			btn.classList.toggle("is-active", idx === activeIndex);
		});
	}

	function syncNavBtn(selector, disabled) {
		const btn = document.querySelector(`[${selector}]`);
		if (btn) btn.disabled = disabled;
	}

	function syncCategoryCarousel() {
		const cats = state.categories;
		if (!cats.length) return false;
		const active = state.categoryIndex;
		applyCarouselCards(".imogi-qr-cat-card", "data-cat-idx", active, cats.length, 210);
		document.querySelectorAll("#imogi-qr-cat-stage .imogi-qr-ambient-layer").forEach((el, i) => {
			el.classList.toggle("is-active", i === active);
		});
		const enter = document.getElementById("imogi-qr-enter-category");
		if (enter) enter.textContent = `Lihat Menu ${cats[active]?.name || ""}`;
		syncDots("[data-cat-dot]", active);
		syncNavBtn("data-cat-prev", active === 0);
		syncNavBtn("data-cat-next", active >= cats.length - 1);
		return true;
	}

	function syncProductCarousel() {
		const products = categoryProducts();
		if (!products.length) return false;
		const active = Math.min(state.productIndex, products.length - 1);
		state.productIndex = active;
		const item = products[active];

		applyCarouselCards(".imogi-qr-prod-card", "data-prod-idx", active, products.length, 185);
		document.querySelectorAll("#imogi-qr-prod-stage .imogi-qr-ambient-layer").forEach((el, i) => {
			el.classList.toggle("is-active", i === active);
		});

		const info = document.querySelector(".imogi-qr-prod-info");
		if (info && item) {
			info.classList.add("is-changing");
			requestAnimationFrame(() => {
				const h2 = info.querySelector("h2");
				const desc = info.querySelector(".imogi-qr-prod-desc");
				const price = info.querySelector(".imogi-qr-prod-price");
				if (h2) h2.textContent = item.item_name || item.item_code;
				if (desc) desc.textContent = (item.description || "").trim() || "Pilih varian jika tersedia";
				if (price) price.textContent = `${money(item.rate || 0)}${item.has_variants ? "+" : ""}`;
				info.classList.remove("is-changing");
			});
		}

		const addBtn = document.getElementById("imogi-qr-add-active");
		if (addBtn) {
			addBtn.textContent = `+ ${item.has_variants ? "Pilih & Tambah" : "Tambah ke Keranjang"}`;
		}

		const counter = document.querySelector(".imogi-qr-page-counter");
		if (counter) counter.textContent = `${active + 1} / ${products.length}`;

		syncDots("[data-prod-dot]", active);
		syncNavBtn("data-prod-prev", active === 0);
		syncNavBtn("data-prod-next", active >= products.length - 1);
		return true;
	}

	function renderCategoryCards() {
		const cats = state.categories;
		if (!cats.length) {
			return `<div class="imogi-qr-empty">Belum ada kategori menu.</div>`;
		}
		const active = state.categoryIndex;
		const cards = cats
			.map((cat, i) => {
				const offset = i - active;
				const absOffset = Math.abs(offset);
				const capped = Math.max(-2, Math.min(2, offset));
				const cappedAbs = Math.abs(capped);
				const rotateY = capped * 40;
				const translateX = capped * 210;
				const translateZ = -cappedAbs * 90;
				const scale = 1 - cappedAbs * 0.12;
				const opacity = offset === 0 ? 1 : absOffset === 1 ? 0.65 : 0.3;
				const bg = cat.image
					? `background-image:url('${esc(cat.image)}')`
					: `background:${CATEGORY_GRADIENTS[cat.id] || CATEGORY_GRADIENTS.Lainnya}`;
				return `
				<div class="imogi-qr-cat-card" data-cat-idx="${i}" style="transform:perspective(1200px) translateX(calc(-50% + ${translateX}px)) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale});opacity:${opacity};z-index:${cats.length - absOffset};${bg}">
					<div class="imogi-qr-cat-card-shade"></div>
					<div class="imogi-qr-cat-card-label">${esc(cat.name)}</div>
				</div>`;
			})
			.join("");

		const dots = renderDotPagination(cats.length, active, { dotAttr: "data-cat-dot" });

		return `
			<div class="imogi-qr-stage imogi-qr-stage--categories" id="imogi-qr-cat-stage">
				<div class="imogi-qr-ambient">
					${cats
						.map(
							(cat, i) =>
								`<div class="imogi-qr-ambient-layer${i === active ? " is-active" : ""}" style="${cat.image ? `background-image:url('${esc(cat.image)}')` : `background:${CATEGORY_GRADIENTS[cat.id] || CATEGORY_GRADIENTS.Lainnya}`}"></div>`
						)
						.join("")}
					<div class="imogi-qr-ambient-overlay"></div>
				</div>
				${renderWelcomeHeader(
					`<p class="imogi-qr-kicker">Welcome</p><p class="imogi-qr-title">Mau pesan apa hari ini?</p>`,
					false
				)}
				<div class="imogi-qr-carousel-wrap">
					<div class="imogi-qr-carousel-track">${cards}</div>
				</div>
				<div class="imogi-qr-carousel-nav imogi-qr-carousel-nav--compact">
					${iconBtn("Sebelumnya", ICON_PREV, 'data-cat-prev', active === 0)}
					<div class="imogi-qr-dots">${dots}</div>
					${iconBtn("Berikutnya", ICON_NEXT, 'data-cat-next', active >= cats.length - 1)}
				</div>
				<button type="button" class="imogi-qr-enter-btn" id="imogi-qr-enter-category">Lihat Menu ${esc(cats[active]?.name || "")}</button>
			</div>`;
	}

	function renderProductCards() {
		const products = categoryProducts();
		if (!products.length) {
			return `<div class="imogi-qr-empty">Tidak ada produk di kategori ini.</div>`;
		}
		const active = Math.min(state.productIndex, products.length - 1);
		state.productIndex = active;
		const item = products[active];

		const cards = products
			.map((product, i) => {
				const offset = i - active;
				const absOffset = Math.abs(offset);
				const capped = Math.max(-2, Math.min(2, offset));
				const cappedAbs = Math.abs(capped);
				const rotateY = capped * 40;
				const translateX = capped * 185;
				const translateZ = -cappedAbs * 90;
				const scale = 1 - cappedAbs * 0.12;
				const opacity = offset === 0 ? 1 : absOffset === 1 ? 0.65 : 0.3;
				const name = product.item_name || product.item_code;
				const image = product.image || product.item_image || "";
				const inner = image
					? `<img src="${esc(image)}" alt="${esc(name)}" loading="lazy" />`
					: `<div class="imogi-qr-prod-placeholder">${itemInitials(name)}</div>`;
				return `
				<div class="imogi-qr-prod-card" data-prod-idx="${i}" style="transform:perspective(1200px) translateX(calc(-50% + ${translateX}px)) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale});opacity:${opacity};z-index:${products.length - absOffset}">
					${inner}
				</div>`;
			})
			.join("");

		const dots = renderDotPagination(products.length, active, {
			dotAttr: "data-prod-dot",
			extraClass: "imogi-qr-dot--light",
		});

		const catName = state.selectedCategory || "Menu";

		return `
			<div class="imogi-qr-stage imogi-qr-stage--menu" id="imogi-qr-prod-stage">
				<div class="imogi-qr-ambient">
					${products
						.map((product, i) => {
							const image = product.image || product.item_image || "";
							return `<div class="imogi-qr-ambient-layer${i === active ? " is-active" : ""}" style="${image ? `background-image:url('${esc(image)}')` : `background:${CATEGORY_GRADIENTS[state.selectedCategory] || CATEGORY_GRADIENTS.Lainnya}`}"></div>`;
						})
						.join("")}
					<div class="imogi-qr-ambient-overlay"></div>
				</div>
				${renderWelcomeHeader(
					`<p class="imogi-qr-kicker">${esc(catName)}</p><p class="imogi-qr-title">Pilih menu favoritmu</p>`,
					true
				)}
				<div class="imogi-qr-carousel-wrap imogi-qr-carousel-wrap--products">
					<div class="imogi-qr-carousel-track imogi-qr-carousel-track--products">
						${cards}
					</div>
				</div>
				<div class="imogi-qr-prod-info">
					<h2>${esc(item.item_name || item.item_code)}</h2>
					<p class="imogi-qr-prod-desc">${esc((item.description || "").trim() || "Pilih varian jika tersedia")}</p>
					<p class="imogi-qr-prod-price">${money(item.rate || 0)}${item.has_variants ? "+" : ""}</p>
					<div class="imogi-qr-dots imogi-qr-dots--inline">${dots}</div>
				</div>
				<div class="imogi-qr-carousel-nav imogi-qr-carousel-nav--bottom">
					${iconBtn("Sebelumnya", ICON_PREV, 'data-prod-prev', active === 0)}
					<button type="button" class="imogi-qr-add-cart-btn" id="imogi-qr-add-active">
						+ ${item.has_variants ? "Pilih & Tambah" : "Tambah ke Keranjang"}
					</button>
					${iconBtn("Berikutnya", ICON_NEXT, 'data-prod-next', active >= products.length - 1)}
				</div>
			</div>`;
	}

	function renderVariantSheet() {
		const v = state.variant;
		if (!v) return "";
		if (v.loading) {
			return `<div class="imogi-qr-variant-sheet is-open"><div class="imogi-qr-variant-panel">${loadingScreen("Memuat varian...")}</div></div>`;
		}
		const cfg = v.config;
		const attrs = (cfg.attributes || [])
			.map((attr) => {
				const selected = v.selections[attr.attribute];
				const opts = (attr.values || [])
					.map((row) => {
						const delta = Number(row.price_delta || 0);
						const deltaTxt = delta ? ` +${money(delta)}` : "";
						return `<button type="button" class="imogi-qr-chip${row.value === selected ? " is-active" : ""}" data-attr="${esc(attr.attribute)}" data-value="${esc(row.value)}">${esc(row.value)}${deltaTxt}</button>`;
					})
					.join("");
				return `<div class="imogi-qr-variant-group"><p class="imogi-qr-variant-label">${esc(attr.label || attr.attribute)}</p><div class="imogi-qr-chip-row">${opts}</div></div>`;
			})
			.join("");

		const addons = (cfg.add_ons || [])
			.map((addon) => {
				const on = !!v.addons[addon.item_code];
				return `<button type="button" class="imogi-qr-chip${on ? " is-active" : ""}" data-addon="${esc(addon.item_code)}">${esc(addon.item_name)} +${money(addon.rate)}</button>`;
			})
			.join("");

		return `
			<div class="imogi-qr-variant-sheet is-open" id="imogi-qr-variant-sheet">
				<div class="imogi-qr-variant-backdrop" id="imogi-qr-variant-close"></div>
				<div class="imogi-qr-variant-panel">
					<div class="imogi-qr-variant-handle"></div>
					<div class="imogi-qr-variant-head">
						<div>
							<p class="imogi-qr-kicker">Customize</p>
							<h3>${esc(cfg.item_name || v.item.item_name)}</h3>
						</div>
						<button type="button" class="imogi-qr-icon-btn imogi-qr-icon-btn--dark" id="imogi-qr-variant-x">${ICON_CLOSE}</button>
					</div>
					${attrs}
					${addons ? `<div class="imogi-qr-variant-group"><p class="imogi-qr-variant-label">Add-on</p><div class="imogi-qr-chip-row">${addons}</div></div>` : ""}
					<div class="imogi-qr-variant-total">
						<span>Total</span>
						<strong>${money(getVariantRate())}</strong>
					</div>
					<button type="button" class="imogi-qr-add-cart-btn imogi-qr-add-cart-btn--full" id="imogi-qr-confirm-variant">Tambah ke Keranjang — ${money(getVariantRate())}</button>
				</div>
			</div>`;
	}

	function renderCheckoutSheet() {
		return `
			<div class="imogi-qr-sheet" id="imogi-qr-sheet">
				<div class="imogi-qr-sheet-panel">
					<h2>Checkout</h2>
					${state.cart
						.map(
							(row, idx) => `
						<div class="imogi-qr-line" data-idx="${idx}">
							<div>
								<strong>${esc(row.item_name)}</strong><br>
								<span class="meta">${money(row.rate)}${row.variant_summary ? ` · ${esc(row.variant_summary)}` : ""}</span>
							</div>
							<div class="qty">
								<button type="button" data-qty="-1">-</button>
								<span>${row.qty}</span>
								<button type="button" data-qty="1">+</button>
							</div>
						</div>`
						)
						.join("")}
					<div class="imogi-qr-line imogi-qr-line-total">
						<span>Total</span><span>${money(cartTotal())}</span>
					</div>
					<div class="imogi-qr-field">
						<label>Nama (opsional)</label>
						<input id="imogi-qr-name" type="text" placeholder="Nama tamu" />
					</div>
					<div class="imogi-qr-field">
						<label>No. WhatsApp *</label>
						<input id="imogi-qr-phone" type="tel" placeholder="08xxxxxxxxxx" required />
					</div>
					<p class="imogi-qr-field-hint">Notifikasi status pesanan akan dikirim ke WhatsApp ini.</p>
					<button type="button" class="imogi-qr-pay-btn" id="imogi-qr-pay">Bayar ${money(cartTotal())}</button>
					<div id="imogi-qr-qris" class="imogi-qr-qris"></div>
				</div>
			</div>`;
	}

	function renderToast() {
		if (!state.toast) return "";
		return `
			<div class="imogi-qr-toast is-visible">
				<span class="imogi-qr-toast-check">✓</span>
				<div>
					<strong>${esc(state.toast.name)}</strong>
					<p>ditambahkan ke keranjang</p>
				</div>
				<span class="imogi-qr-toast-count">${cartCount()} item</span>
			</div>`;
	}

	function renderCartBar() {
		/* Checkout via header cart icon — no bottom bar (blocks product picker). */
		return "";
	}

	function showSuccess(orderName, phone) {
		stopPoll();
		state.cart = [];
		state.view = "categories";
		$app.innerHTML = `
			<div class="imogi-qr-stage imogi-qr-stage--categories">
				${renderWelcomeHeader(`<p class="imogi-qr-kicker">${esc(state.table?.store_name || "IMOGI")}</p><p class="imogi-qr-title">Terima kasih!</p>`, false)}
				<div class="imogi-qr-success">
					<h2>Pesanan berhasil!</h2>
					<p>Order <strong>${esc(orderName)}</strong> sudah dikirim ke dapur.</p>
					<p>Notifikasi WhatsApp akan dikirim ke <strong>${esc(phone)}</strong>.</p>
				</div>
			</div>`;
	}

	function startQrisPoll(paymentName, phone, gateway) {
		const $qris = document.getElementById("imogi-qr-qris");
		const $pay = document.getElementById("imogi-qr-pay");
		if ($pay) {
			$pay.disabled = true;
			$pay.textContent = "Menunggu pembayaran...";
		}
		if ($qris) {
			let html = `<p class="imogi-qr-qris-status"><strong>Scan QRIS untuk bayar</strong></p>`;
			html += `<p class="imogi-qr-qris-hint">Setelah bayar, halaman ini otomatis lanjut. Jangan tutup.</p>`;
			if (gateway.qr_image) {
				html += `<img src="${gateway.qr_image}" alt="QRIS" class="imogi-qr-qris-img" />`;
			} else if (gateway.qr_url) {
				html += `<p><a href="${gateway.qr_url}" target="_blank">Buka pembayaran</a></p>`;
			}
			html += `<div class="imogi-qr-qris-wait"><span class="imogi-qr-spinner"></span> Menunggu konfirmasi pembayaran...</div>`;
			$qris.innerHTML = html;
		}
		stopPoll();
		pollTimer = setInterval(async () => {
			try {
				const row = await api("imogi_pos.api.qr_order_api.poll_qr_gateway_payment", { payment_name: paymentName });
				if (row.status === "Paid") {
					showSuccess(row.order || row.order_detail?.name || "", phone);
				} else if (row.status === "Failed") {
					stopPoll();
					alert("Pembayaran gagal atau kedaluwarsa. Silakan coba lagi.");
					if ($pay) {
						$pay.disabled = false;
						$pay.textContent = `Bayar ${money(cartTotal())}`;
					}
				}
			} catch (e) {
				/* keep polling */
			}
		}, 3000);
	}

	function goCategory(index) {
		const next = Math.max(0, Math.min(state.categories.length - 1, index));
		if (next === state.categoryIndex) return;
		state.categoryIndex = next;
		if (state.view === "categories" && document.getElementById("imogi-qr-cat-stage") && syncCategoryCarousel()) {
			return;
		}
		render();
	}

	function goProduct(index) {
		const products = categoryProducts();
		const next = Math.max(0, Math.min(products.length - 1, index));
		if (next === state.productIndex) return;
		state.productIndex = next;
		if (state.view === "menu" && document.getElementById("imogi-qr-prod-stage") && syncProductCarousel()) {
			return;
		}
		render();
	}

	function enterCategory() {
		const cat = state.categories[state.categoryIndex];
		if (!cat) return;
		state.selectedCategory = cat.id;
		state.productIndex = 0;
		state.view = "menu";
		render();
	}

	function bindCarouselTouch(stageId, onSwipe) {
		const stage = document.getElementById(stageId);
		if (!stage) return;
		stage.addEventListener(
			"touchstart",
			(e) => {
				touchStartX = e.touches[0].clientX;
			},
			{ passive: true }
		);
		stage.addEventListener(
			"touchend",
			(e) => {
				const delta = touchStartX - e.changedTouches[0].clientX;
				if (Math.abs(delta) < 50) return;
				onSwipe(delta > 0 ? 1 : -1);
			},
			{ passive: true }
		);
	}

	function bindEvents() {
		document.getElementById("imogi-qr-back")?.addEventListener("click", () => {
			state.view = "categories";
			state.variant = null;
			render();
		});

		document.getElementById("imogi-qr-enter-category")?.addEventListener("click", enterCategory);

		document.querySelectorAll("[data-cat-idx]").forEach((el) => {
			el.addEventListener("click", () => {
				const idx = Number(el.getAttribute("data-cat-idx"));
				if (idx === state.categoryIndex) enterCategory();
				else goCategory(idx);
			});
		});

		document.querySelector("[data-cat-prev]")?.addEventListener("click", () => goCategory(state.categoryIndex - 1));
		document.querySelector("[data-cat-next]")?.addEventListener("click", () => goCategory(state.categoryIndex + 1));
		document.querySelectorAll("[data-cat-dot]").forEach((btn) => {
			btn.addEventListener("click", () => goCategory(Number(btn.getAttribute("data-cat-dot"))));
		});

		bindCarouselTouch("imogi-qr-cat-stage", (dir) => goCategory(state.categoryIndex + dir));

		document.querySelectorAll("[data-prod-idx]").forEach((el) => {
			el.addEventListener("click", () => goProduct(Number(el.getAttribute("data-prod-idx"))));
		});
		document.querySelector("[data-prod-prev]")?.addEventListener("click", () => goProduct(state.productIndex - 1));
		document.querySelector("[data-prod-next]")?.addEventListener("click", () => goProduct(state.productIndex + 1));
		document.querySelectorAll("[data-prod-dot]").forEach((btn) => {
			btn.addEventListener("click", () => goProduct(Number(btn.getAttribute("data-prod-dot"))));
		});
		bindCarouselTouch("imogi-qr-prod-stage", (dir) => goProduct(state.productIndex + dir));

		document.getElementById("imogi-qr-add-active")?.addEventListener("click", () => {
			const products = categoryProducts();
			const item = products[state.productIndex];
			if (item) addToCart(item);
		});

		const openCheckout = () => document.getElementById("imogi-qr-sheet")?.classList.add("is-open");
		document.getElementById("imogi-qr-open-checkout")?.addEventListener("click", openCheckout);

		const $sheet = document.getElementById("imogi-qr-sheet");
		if ($sheet) {
			$sheet.addEventListener("click", (e) => {
				if (e.target === $sheet) $sheet.classList.remove("is-open");
			});
			$sheet.querySelectorAll("[data-qty]").forEach((btn) => {
				btn.addEventListener("click", () => {
					const idx = Number(btn.closest(".imogi-qr-line")?.getAttribute("data-idx"));
					const delta = Number(btn.getAttribute("data-qty"));
					const row = state.cart[idx];
					if (!row) return;
					row.qty += delta;
					if (row.qty <= 0) state.cart.splice(idx, 1);
					render();
					$sheet.classList.add("is-open");
				});
			});
		}

		document.getElementById("imogi-qr-pay")?.addEventListener("click", submitOrder);

		document.getElementById("imogi-qr-variant-close")?.addEventListener("click", () => {
			state.variant = null;
			render();
		});
		document.getElementById("imogi-qr-variant-x")?.addEventListener("click", () => {
			state.variant = null;
			render();
		});
		document.getElementById("imogi-qr-confirm-variant")?.addEventListener("click", confirmVariantAdd);
		document.querySelectorAll("[data-attr]").forEach((btn) => {
			btn.addEventListener("click", () => {
				state.variant.selections[btn.getAttribute("data-attr")] = btn.getAttribute("data-value");
				render();
			});
		});
		document.querySelectorAll("[data-addon]").forEach((btn) => {
			btn.addEventListener("click", () => {
				const code = btn.getAttribute("data-addon");
				state.variant.addons[code] = !state.variant.addons[code];
				render();
			});
		});
	}

	function render() {
		const main =
			state.view === "categories" ? renderCategoryCards() : renderProductCards();
		$app.innerHTML = `${main}${renderVariantSheet()}${renderCheckoutSheet()}${renderCartBar()}${renderToast()}`;
		bindEvents();
	}

	async function submitOrder() {
		const phone = (document.getElementById("imogi-qr-phone")?.value || "").trim();
		const name = (document.getElementById("imogi-qr-name")?.value || "").trim();
		if (!phone) {
			alert("Nomor WhatsApp wajib diisi.");
			return;
		}
		if (!state.cart.length) {
			alert("Keranjang kosong.");
			return;
		}
		const $pay = document.getElementById("imogi-qr-pay");
		if ($pay) {
			$pay.disabled = true;
			$pay.textContent = "Memproses...";
		}
		try {
			const result = await api("imogi_pos.api.qr_order_api.submit_qr_table_order", {
				items: JSON.stringify(state.cart.map((r) => ({ item_code: r.item_code, qty: r.qty, rate: r.rate }))),
				customer_phone: phone,
				customer_name: name,
				payment_mode: state.payment.default_mode || "Cash",
			});
			if (result.payment_type === "qris" && result.gateway) {
				document.getElementById("imogi-qr-sheet")?.classList.add("is-open");
				startQrisPoll(result.gateway.name, phone, result.gateway);
				return;
			}
			showSuccess(result.order?.name || "", phone);
		} catch (err) {
			alert(err.message || "Gagal memproses pesanan");
			if ($pay) {
				$pay.disabled = false;
				$pay.textContent = `Bayar ${money(cartTotal())}`;
			}
		}
	}

	async function boot() {
		$app.innerHTML = loadingScreen("Memuat menu...");
		try {
			const board = await api("imogi_pos.api.qr_order_api.get_qr_menu_board", {});
			state.table = board.table;
			state.items = board.catalog?.items || [];
			state.categories = board.categories || [];
			state.payment = board.payment || {};
			if (!state.table?.can_order) {
				$app.innerHTML = `<div class="imogi-qr-error">Meja ini sedang tidak tersedia untuk pesan mandiri. Silakan panggil waiter.</div>`;
				return;
			}
			if (!state.categories.length && state.items.length) {
				const counts = {};
				const images = {};
				state.items.forEach((row) => {
					const cat = row.imogi_pos_category || "Lainnya";
					counts[cat] = (counts[cat] || 0) + 1;
					if (!images[cat] && row.image) images[cat] = row.image;
				});
				state.categories = Object.keys(counts).map((name) => ({
					id: name,
					name,
					tagline: name,
					count: counts[name],
					image: images[name],
				}));
			}
			render();
		} catch (err) {
			$app.innerHTML = `<div class="imogi-qr-error">${esc(err.message || "Gagal memuat menu")}</div>`;
		}
	}

	boot();
})();
