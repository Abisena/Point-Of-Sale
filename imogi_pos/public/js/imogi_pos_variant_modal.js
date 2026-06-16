frappe.provide("imogi_pos");

const IMOGI_VARIANT_CART_ICON = `<svg class="imogi-variant-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`;
const IMOGI_VARIANT_CLOSE_ICON = `<svg class="imogi-variant-btn-icon imogi-variant-btn-icon--close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>`;

imogi_pos.VariantPicker = class VariantPicker {
	constructor(page) {
		this.page = page;
		this.$modal = null;
		this.config = null;
		this.selections = {};
		this.add_ons = {};
		this.on_add = null;
	}

	open(template_item, on_add, options = {}) {
		this.on_add = on_add;
		this.addon_only = !!(options.addon_only || template_item.addon_only);
		const args = { ...this.page?.branch_api_args?.() };
		if (this.addon_only) {
			args.item_code = template_item.item_code;
		} else {
			args.template_item_code = template_item.item_code;
		}
		frappe.call({
			method: this.addon_only
				? "imogi_pos.api.catalog.get_item_addon_config"
				: "imogi_pos.api.catalog.get_item_variant_config",
			args,
			callback: (r) => {
				if (r.exc || !r.message) return;
				this.config = r.message;
				this.selections = {};
				(this.config.attributes || []).forEach((attr) => {
					this.selections[attr.attribute] = attr.default || (attr.values[0] && attr.values[0].value);
				});
				this.add_ons = {};
				this.render();
			},
		});
	}

	close() {
		this.$modal?.remove();
		this.$modal = null;
		document.body.classList.remove("imogi-variant-open");
	}

	format_delta(delta) {
		const amount = flt(delta);
		if (!amount) return "";
		const formatted = format_currency(Math.abs(amount), this.config.currency, 0);
		return amount > 0 ? `+${formatted}` : `-${formatted}`;
	}

	format_price(amount) {
		return format_currency(flt(amount), this.config.currency, 0);
	}

	get_selected_rate() {
		let total = flt(this.config.base_rate);
		(this.config.attributes || []).forEach((attr) => {
			const selected = this.selections[attr.attribute];
			const row = (attr.values || []).find((v) => v.value === selected);
			if (row) total += flt(row.price_delta);
		});
		Object.keys(this.add_ons).forEach((code) => {
			if (!this.add_ons[code]) return;
			const row = (this.config.add_ons || []).find((a) => a.item_code === code);
			if (row) total += flt(row.rate);
		});
		return total;
	}

	get_selected_variant() {
		const variants = this.config.variants || [];
		if (!variants.length) return null;

		const keys = Object.keys(this.selections || {});
		return (
			variants.find((row) =>
				keys.every((key) => (row.attributes || {})[key] === this.selections[key])
			) || null
		);
	}

	get_selected_image() {
		const variant = this.get_selected_variant();
		if (variant?.image) return variant.image;
		return this.config.image || "";
	}

	render_hero_html() {
		const cfg = this.config;
		const image = this.get_selected_image();
		const abbr = frappe.utils.escape_html(frappe.get_abbr(cfg.item_name || cfg.template_item_code || "?"));
		if (image) {
			return `<img class="imogi-variant-hero-img" src="${frappe.utils.escape_html(image)}" alt="${abbr}" />`;
		}
		return `<div class="imogi-variant-hero-placeholder">${abbr}</div>`;
	}

	update_hero_image() {
		if (!this.$modal) return;
		this.$modal.find(".imogi-variant-hero-media").html(this.render_hero_html());
	}

	update_prices() {
		if (!this.$modal) return;
		const total = this.format_price(this.get_selected_rate());
		const has_delta = flt(this.get_selected_rate()) !== flt(this.config.base_rate);
		this.$modal.find(".imogi-variant-price").text(total);
		this.$modal.find(".imogi-variant-price-hint").text(has_delta ? __("Total") : __("Harga dasar"));
		this.$modal.find(".imogi-variant-add-cart").html(
			`${IMOGI_VARIANT_CART_ICON}<span>${__(
				"Tambah ke Keranjang"
			)} — ${total}</span>`
		);
	}

	render_cart_button_html(total) {
		return `${IMOGI_VARIANT_CART_ICON}<span>${__("Tambah ke Keranjang")} — ${total}</span>`;
	}

	render_attribute_section(attr) {
		const selected = this.selections[attr.attribute];
		const label = frappe.utils.escape_html((attr.label || attr.attribute || "").toUpperCase());
		const group = frappe.utils.escape_html(attr.attribute);

		const options = (attr.values || [])
			.map((row) => {
				const active = row.value === selected ? " is-active" : "";
				const delta = this.format_delta(row.price_delta);
				const delta_html = delta
					? `<span class="imogi-variant-option-price">${frappe.utils.escape_html(delta)}</span>`
					: `<span class="imogi-variant-option-price"></span>`;
				return `<button type="button" class="imogi-variant-option${active}"
					data-attribute="${group}"
					data-value="${frappe.utils.escape_html(row.value)}">
					<span class="imogi-variant-option-radio" aria-hidden="true"></span>
					<span class="imogi-variant-option-label">${frappe.utils.escape_html(row.value)}</span>
					${delta_html}
				</button>`;
			})
			.join("");

		return `<section class="imogi-variant-section">
			<div class="imogi-variant-section-head">
				<h3 class="imogi-variant-section-title">${label}</h3>
				<span class="imogi-variant-section-badge">${__("Pilih 1")}</span>
			</div>
			<div class="imogi-variant-options">${options}</div>
		</section>`;
	}

	render_add_ons() {
		const rows = this.config.add_ons || [];
		if (!rows.length) {
			return this.render_addon_empty_state();
		}

		const options = rows
			.map((row) => {
				const active = this.add_ons[row.item_code] ? " is-active" : "";
				const delta = this.format_delta(row.rate) || "+0";
				const name = frappe.utils.escape_html(row.item_name || row.item_code);
				return `<button type="button" class="imogi-variant-option imogi-variant-option--addon${active}"
					data-addon="${frappe.utils.escape_html(row.item_code)}">
					<span class="imogi-variant-option-check" aria-hidden="true"><i class="fa fa-check"></i></span>
					<span class="imogi-variant-option-label">${name}</span>
					<span class="imogi-variant-option-price">${frappe.utils.escape_html(delta)}</span>
				</button>`;
			})
			.join("");

		return `<section class="imogi-variant-section imogi-variant-section--addons">
			<div class="imogi-variant-section-head">
				<h3 class="imogi-variant-section-title">${__("ADD-ONS")}</h3>
				<span class="imogi-variant-section-badge imogi-variant-section-badge--optional">${__(
					"Opsional"
				)}</span>
			</div>
			<div class="imogi-variant-options">${options}</div>
		</section>`;
	}

	render_addon_empty_state() {
		const labels = this.config.configured_add_ons || [];
		if (!labels.length) return "";

		const items = labels
			.map((label) => `<li>${frappe.utils.escape_html(label)}</li>`)
			.join("");

		return `<section class="imogi-variant-section imogi-variant-section--addons imogi-variant-section--empty">
			<div class="imogi-variant-section-head">
				<h3 class="imogi-variant-section-title">${__("ADD-ONS")}</h3>
			</div>
			<p class="imogi-variant-addon-empty-title">${__("Add-on belum tersedia di sistem")}</p>
			<p class="imogi-variant-addon-empty-hint">${__(
				"Buat Item berikut (grup Add-ons) lalu refresh kasir:"
			)}</p>
			<ul class="imogi-variant-addon-empty-list">${items}</ul>
		</section>`;
	}

	render() {
		inject_variant_modal_css();
		this.close();
		const cfg = this.config;
		const desc = (cfg.description || "").trim();
		const desc_html = desc
			? `<p class="imogi-variant-desc">${frappe.utils.escape_html(desc)}</p>`
			: "";

		const attributes_html = (cfg.attributes || []).map((attr) => this.render_attribute_section(attr)).join("");

		this.$modal = $(`
			<div class="imogi-variant-overlay">
				<div class="imogi-variant-sheet imogi-variant-sheet--v12" role="dialog" aria-modal="true" aria-label="${frappe.utils.escape_html(
					cfg.item_name
				)}">
					<div class="imogi-variant-hero">
						<div class="imogi-variant-hero-media">${this.render_hero_html()}</div>
						<button type="button" class="imogi-variant-close-fab" aria-label="${__("Tutup")}">
							${IMOGI_VARIANT_CLOSE_ICON}
						</button>
					</div>
					<div class="imogi-variant-scroll">
						<div class="imogi-variant-info">
							<div class="imogi-variant-info-row">
								<h2 class="imogi-variant-title">${frappe.utils.escape_html(cfg.item_name)}</h2>
								<div class="imogi-variant-price-block">
									<div class="imogi-variant-price">${this.format_price(cfg.base_rate)}</div>
									<div class="imogi-variant-price-hint">${__("Harga dasar")}</div>
								</div>
							</div>
							${desc_html}
						</div>
						<div class="imogi-variant-sections">
							${attributes_html}
							${this.render_add_ons()}
						</div>
					</div>
					<div class="imogi-variant-sticky-footer">
						<button type="button" class="imogi-variant-add-cart">
							${this.render_cart_button_html(this.format_price(this.get_selected_rate()))}
						</button>
					</div>
				</div>
			</div>
		`);

		document.body.classList.add("imogi-variant-open");
		$("body").append(this.$modal);
		this.bind_events();
	}

	bind_events() {
		const $m = this.$modal;

		$m.find(".imogi-variant-close-fab").on("click", () => this.close());

		$m.on("click", (e) => {
			if ($(e.target).hasClass("imogi-variant-overlay")) this.close();
		});

		$m.find(".imogi-variant-option:not(.imogi-variant-option--addon)").on("click", (e) => {
			const $btn = $(e.currentTarget);
			const attribute = $btn.data("attribute");
			const value = $btn.data("value");
			this.selections[attribute] = value;
			$m.find(`.imogi-variant-option[data-attribute="${attribute}"]`).removeClass("is-active");
			$btn.addClass("is-active");
			this.update_prices();
			this.update_hero_image();
		});

		$m.find(".imogi-variant-option--addon").on("click", (e) => {
			const $btn = $(e.currentTarget);
			const code = $btn.data("addon");
			this.add_ons[code] = !this.add_ons[code];
			$btn.toggleClass("is-active", !!this.add_ons[code]);
			this.update_prices();
		});

		$m.find(".imogi-variant-add-cart").on("click", () => this.submit());
	}

	submit() {
		const $btn = this.$modal.find(".imogi-variant-add-cart");
		$btn.prop("disabled", true).html(
			`<span class="imogi-variant-btn-spinner" aria-hidden="true"></span><span>${__("Menambahkan...")}</span>`
		);

		if (this.config.addon_only) {
			const add_on_items = (this.config.add_ons || [])
				.filter((row) => this.add_ons[row.item_code])
				.map((row) => ({
					item_code: row.item_code,
					item_name: row.item_name,
					rate: flt(row.rate),
					uom: row.uom || row.stock_uom,
					is_stock_item: row.is_stock_item,
					in_stock: row.in_stock,
				}));

			this.close();
			this.on_add &&
				this.on_add({
					item_code: this.config.template_item_code,
					item_name: this.config.item_name,
					rate: flt(this.config.base_rate),
					uom: this.config.uom || "Nos",
					template_item_code: this.config.template_item_code,
					is_stock_item: this.config.is_stock_item,
					in_stock: this.config.in_stock,
					addon_only: true,
					add_ons: add_on_items,
				});
			return;
		}

		const args = {
			template_item_code: this.config.template_item_code,
			attributes: this.selections,
		};
		if (this.page?.branch_api_args) {
			Object.assign(args, this.page.branch_api_args());
		}
		frappe.call({
			method: "imogi_pos.api.catalog.resolve_item_variant",
			args,
			callback: (r) => {
				if (r.exc) {
					$btn.prop("disabled", false);
					this.update_prices();
					return;
				}

				const variant = r.message || {};
				const add_on_items = (this.config.add_ons || [])
					.filter((row) => this.add_ons[row.item_code])
					.map((row) => ({
						item_code: row.item_code,
						item_name: row.item_name,
						rate: flt(row.rate),
						uom: row.uom || row.stock_uom,
					}));

				this.close();
				this.on_add &&
					this.on_add({
						...variant,
						template_item_code: this.config.template_item_code,
						variant_attributes: { ...this.selections },
						add_ons: add_on_items,
					});
			},
		});
	}
};

function inject_variant_modal_css() {
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
	].forEach((id) => document.getElementById(id)?.remove());

	const style_id = "imogi-variant-modal-css-v12";
	if (document.getElementById(style_id)) return;

	frappe.dom.set_style(
		`
		body.imogi-variant-open { overflow: hidden; }
		.imogi-variant-overlay {
			align-items: flex-end;
			background: rgba(15, 23, 42, 0.55);
			backdrop-filter: blur(3px);
			display: flex;
			inset: 0;
			justify-content: center;
			padding: 0;
			position: fixed;
			z-index: 1065;
		}
		.imogi-variant-sheet {
			background: #fff;
			border: 1px solid #e2e8f0;
			border-radius: 20px 20px 0 0;
			box-shadow: 0 -16px 48px rgba(15, 23, 42, 0.22);
			display: flex;
			flex-direction: column;
			max-height: 92dvh;
			max-width: 440px;
			overflow: hidden;
			width: 100%;
		}
		.imogi-variant-hero { flex-shrink: 0; position: relative; width: 100%; }
		.imogi-variant-hero-media {
			aspect-ratio: 4 / 3;
			background: linear-gradient(160deg, #f8fafc 0%, #eef2f7 100%);
			max-height: 240px;
			overflow: hidden;
			width: 100%;
		}
		.imogi-variant-hero-img { display: block; height: 100%; object-fit: cover; object-position: center; width: 100%; }
		.imogi-variant-hero-placeholder {
			align-items: center; color: #94a3b8; display: flex; font-size: 28px; font-weight: 800;
			height: 100%; justify-content: center; min-height: 180px; width: 100%;
		}
		.imogi-variant-close-fab {
			align-items: center; background: #fff; border: none; border-radius: 50%;
			box-shadow: 0 2px 12px rgba(15, 23, 42, 0.18); color: #18181b; cursor: pointer;
			display: inline-flex; height: 38px; justify-content: center; left: 14px;
			position: absolute; top: 14px; width: 38px; z-index: 2;
		}
		.imogi-variant-close-fab:hover { background: #fafafa; }
		.imogi-variant-btn-icon { display: block; flex-shrink: 0; height: 20px; width: 20px; }
		.imogi-variant-btn-icon--close { height: 16px; width: 16px; }
		.imogi-variant-scroll { flex: 1; min-height: 0; overflow-x: hidden; overflow-y: auto; -webkit-overflow-scrolling: touch; }
		.imogi-variant-info { border-bottom: 1px solid #f1f5f9; padding: 18px 18px 16px; }
		.imogi-variant-info-row { align-items: flex-start; display: flex; gap: 14px; justify-content: space-between; }
		.imogi-variant-title {
			color: #0f172a; flex: 1; font-size: 17px; font-weight: 800; letter-spacing: 0.01em;
			line-height: 1.3; margin: 0; min-width: 0; text-transform: uppercase;
		}
		.imogi-variant-price-block { flex-shrink: 0; text-align: right; }
		.imogi-variant-price { color: #0f172a; font-size: 17px; font-variant-numeric: tabular-nums; font-weight: 800; line-height: 1.2; }
		.imogi-variant-price-hint { color: #94a3b8; font-size: 11px; font-weight: 600; margin-top: 3px; }
		.imogi-variant-desc {
			-webkit-box-orient: vertical; -webkit-line-clamp: 2; color: #64748b; display: -webkit-box;
			font-size: 13px; line-height: 1.45; margin: 10px 0 0; overflow: hidden;
		}
		.imogi-variant-sections { padding-bottom: 4px; }
		.imogi-variant-section { border-bottom: 1px solid #f1f5f9; padding: 16px 18px; }
		.imogi-variant-section:last-child { border-bottom: none; }
		.imogi-variant-section-head { align-items: center; display: flex; gap: 10px; justify-content: space-between; margin-bottom: 10px; }
		.imogi-variant-section-title { color: #64748b; font-size: 12px; font-weight: 800; letter-spacing: 0.04em; margin: 0; text-transform: uppercase; }
		.imogi-variant-section-badge { background: #dcfce7; border-radius: 999px; color: #166534; flex-shrink: 0; font-size: 10px; font-weight: 700; padding: 4px 10px; white-space: nowrap; }
		.imogi-variant-section-badge--optional { background: #f1f5f9; color: #64748b; }
		.imogi-variant-options { display: flex; flex-direction: column; gap: 8px; }
		.imogi-variant-option {
			align-items: center; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
			color: #0f172a; cursor: pointer; display: flex; gap: 12px; min-height: 48px;
			padding: 10px 12px; text-align: left; transition: background 0.12s ease, border-color 0.12s ease; width: 100%;
		}
		.imogi-variant-option:hover { background: #fafafa; border-color: #cbd5e1; }
		.imogi-variant-option.is-active { background: #f0fdf4; border-color: #86efac; }
		.imogi-variant-option-radio { border: 2px solid #cbd5e1; border-radius: 50%; flex-shrink: 0; height: 20px; position: relative; width: 20px; }
		.imogi-variant-option.is-active .imogi-variant-option-radio { border-color: #00b14f; }
		.imogi-variant-option.is-active .imogi-variant-option-radio::after {
			background: #00b14f; border-radius: 50%; content: ""; height: 10px; left: 50%;
			position: absolute; top: 50%; transform: translate(-50%, -50%); width: 10px;
		}
		.imogi-variant-option-check {
			align-items: center; border: 2px solid #cbd5e1; border-radius: 6px; color: transparent;
			display: inline-flex; flex-shrink: 0; font-size: 10px; height: 20px; justify-content: center; width: 20px;
		}
		.imogi-variant-option--addon.is-active .imogi-variant-option-check { background: #00b14f; border-color: #00b14f; color: #fff; }
		.imogi-variant-option-label { flex: 1; font-size: 14px; font-weight: 600; line-height: 1.35; min-width: 0; }
		.imogi-variant-option-price { color: #0f172a; flex-shrink: 0; font-size: 13px; font-variant-numeric: tabular-nums; font-weight: 700; min-width: 64px; text-align: right; }
		.imogi-variant-sticky-footer {
			background: #fff; border-top: 1px solid #e2e8f0; box-shadow: 0 -6px 24px rgba(15, 23, 42, 0.08);
			flex-shrink: 0; padding: 14px 18px calc(14px + env(safe-area-inset-bottom, 0px));
		}
		.imogi-variant-add-cart {
			align-items: center; background: #00b14f; border: none; border-radius: 999px; color: #fff;
			cursor: pointer; display: inline-flex; font-size: 15px; font-weight: 800; gap: 10px;
			justify-content: center; min-height: 50px; padding: 12px 20px; width: 100%;
		}
		.imogi-variant-add-cart:hover { background: #009a45; }
		.imogi-variant-add-cart:disabled { background: #cbd5e1; cursor: not-allowed; }
		.imogi-variant-btn-spinner {
			animation: imogi-variant-spin 0.8s linear infinite; border: 2px solid rgba(255,255,255,.35);
			border-radius: 50%; border-top-color: #fff; display: inline-block; flex-shrink: 0; height: 16px; width: 16px;
		}
		@keyframes imogi-variant-spin { to { transform: rotate(360deg); } }
		@media (min-width: 641px) {
			.imogi-variant-overlay { align-items: center; padding: 28px 20px; }
			.imogi-variant-sheet { border-radius: 20px; box-shadow: 0 24px 64px rgba(15, 23, 42, 0.22); max-height: min(90vh, 720px); max-width: 420px; }
			.imogi-variant-hero-media { border-radius: 20px 20px 0 0; max-height: 280px; }
		}
		`,
		style_id
	);
}

imogi_pos.ensure_variant_modal_css = inject_variant_modal_css;
inject_variant_modal_css();
