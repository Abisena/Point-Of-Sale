frappe.provide("imogi_pos");

imogi_pos.VariantPicker = class VariantPicker {
	constructor(page) {
		this.page = page;
		this.$modal = null;
		this.config = null;
		this.selections = {};
		this.add_ons = {};
		this.on_add = null;
	}

	open(template_item, on_add) {
		this.on_add = on_add;
		const args = { template_item_code: template_item.item_code };
		if (this.page?.branch_api_args) {
			Object.assign(args, this.page.branch_api_args());
		}
		frappe.call({
			method: "imogi_pos.api.catalog.get_item_variant_config",
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

	update_footer_price() {
		if (!this.$modal) return;
		const total = this.format_price(this.get_selected_rate());
		this.$modal
			.find(".imogi-variant-add-cart")
			.text(`${__("Tambah ke Keranjang")} — ${total}`);
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
		if (!rows.length) return "";

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
				<div class="imogi-variant-sheet" role="dialog" aria-modal="true" aria-label="${frappe.utils.escape_html(
					cfg.item_name
				)}">
					<div class="imogi-variant-hero">
						<div class="imogi-variant-hero-media">${this.render_hero_html()}</div>
						<button type="button" class="imogi-variant-close-fab" aria-label="${__("Tutup")}">
							<i class="fa fa-times"></i>
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
							${__("Tambah ke Keranjang")} — ${this.format_price(this.get_selected_rate())}
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
			this.update_footer_price();
			this.update_hero_image();
		});

		$m.find(".imogi-variant-option--addon").on("click", (e) => {
			const $btn = $(e.currentTarget);
			const code = $btn.data("addon");
			this.add_ons[code] = !this.add_ons[code];
			$btn.toggleClass("is-active", !!this.add_ons[code]);
			this.update_footer_price();
		});

		$m.find(".imogi-variant-add-cart").on("click", () => this.submit());
	}

	submit() {
		const $btn = this.$modal.find(".imogi-variant-add-cart");
		$btn.prop("disabled", true).text(`${__("Menambahkan...")}`);

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
					this.update_footer_price();
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
	].forEach((id) => document.getElementById(id)?.remove());

	frappe.dom.set_style(
		`
		body.imogi-variant-open { overflow: hidden; }
		.imogi-variant-overlay {
			align-items: flex-end;
			background: rgba(15, 23, 42, 0.45);
			display: flex;
			inset: 0;
			justify-content: center;
			padding: 0;
			position: fixed;
			z-index: 1050;
		}
		.imogi-variant-sheet {
			background: #fff;
			border-radius: 16px 16px 0 0;
			box-shadow: 0 -8px 40px rgba(15, 23, 42, 0.18);
			display: flex;
			flex-direction: column;
			max-height: 92vh;
			max-height: 92dvh;
			max-width: 480px;
			overflow: hidden;
			width: 100%;
		}
		.imogi-variant-hero {
			flex-shrink: 0;
			position: relative;
			width: 100%;
		}
		.imogi-variant-hero-media {
			aspect-ratio: 16 / 10;
			background: #f4f4f5;
			max-height: 220px;
			overflow: hidden;
			width: 100%;
		}
		.imogi-variant-hero-img {
			display: block;
			height: 100%;
			object-fit: cover;
			width: 100%;
		}
		.imogi-variant-hero-placeholder {
			align-items: center;
			color: #71717a;
			display: flex;
			font-size: 28px;
			font-weight: 800;
			height: 100%;
			justify-content: center;
			min-height: 160px;
			width: 100%;
		}
		.imogi-variant-close-fab {
			align-items: center;
			background: #fff;
			border: none;
			border-radius: 50%;
			box-shadow: 0 2px 12px rgba(15, 23, 42, 0.16);
			color: #18181b;
			cursor: pointer;
			display: inline-flex;
			font-size: 16px;
			height: 36px;
			justify-content: center;
			left: 14px;
			position: absolute;
			top: 14px;
			width: 36px;
		}
		.imogi-variant-close-fab:hover { background: #fafafa; }
		.imogi-variant-scroll {
			flex: 1;
			min-height: 0;
			overflow-y: auto;
			-webkit-overflow-scrolling: touch;
		}
		.imogi-variant-info {
			border-bottom: 8px solid #f4f4f5;
			padding: 16px 16px 14px;
		}
		.imogi-variant-info-row {
			align-items: flex-start;
			display: flex;
			gap: 12px;
			justify-content: space-between;
		}
		.imogi-variant-title {
			color: #18181b;
			flex: 1;
			font-size: 18px;
			font-weight: 800;
			line-height: 1.25;
			margin: 0;
			min-width: 0;
		}
		.imogi-variant-price-block {
			flex-shrink: 0;
			text-align: right;
		}
		.imogi-variant-price {
			color: #18181b;
			font-size: 16px;
			font-variant-numeric: tabular-nums;
			font-weight: 800;
			line-height: 1.2;
		}
		.imogi-variant-price-hint {
			color: #71717a;
			font-size: 11px;
			font-weight: 600;
			margin-top: 2px;
		}
		.imogi-variant-desc {
			color: #71717a;
			font-size: 13px;
			line-height: 1.45;
			margin: 10px 0 0;
		}
		.imogi-variant-sections { padding-bottom: 8px; }
		.imogi-variant-section {
			border-bottom: 1px solid #f4f4f5;
			padding: 14px 16px;
		}
		.imogi-variant-section:last-child { border-bottom: none; }
		.imogi-variant-section-head {
			align-items: center;
			display: flex;
			gap: 10px;
			justify-content: space-between;
			margin-bottom: 4px;
		}
		.imogi-variant-section-title {
			color: #18181b;
			font-size: 13px;
			font-weight: 800;
			letter-spacing: 0.02em;
			margin: 0;
			text-transform: uppercase;
		}
		.imogi-variant-section-badge {
			background: #dcfce7;
			border-radius: 999px;
			color: #166534;
			flex-shrink: 0;
			font-size: 11px;
			font-weight: 700;
			padding: 4px 10px;
			white-space: nowrap;
		}
		.imogi-variant-section-badge--optional {
			background: #f4f4f5;
			color: #52525b;
		}
		.imogi-variant-options { display: flex; flex-direction: column; }
		.imogi-variant-option {
			align-items: center;
			background: transparent;
			border: none;
			border-bottom: 1px solid #f4f4f5;
			color: #18181b;
			cursor: pointer;
			display: flex;
			gap: 12px;
			min-height: 52px;
			padding: 12px 0;
			text-align: left;
			width: 100%;
		}
		.imogi-variant-option:last-child { border-bottom: none; }
		.imogi-variant-option-radio {
			border: 2px solid #d4d4d8;
			border-radius: 50%;
			flex-shrink: 0;
			height: 20px;
			position: relative;
			width: 20px;
		}
		.imogi-variant-option.is-active .imogi-variant-option-radio {
			border-color: #00b14f;
		}
		.imogi-variant-option.is-active .imogi-variant-option-radio::after {
			background: #00b14f;
			border-radius: 50%;
			content: "";
			height: 10px;
			left: 50%;
			position: absolute;
			top: 50%;
			transform: translate(-50%, -50%);
			width: 10px;
		}
		.imogi-variant-option-check {
			align-items: center;
			border: 2px solid #d4d4d8;
			border-radius: 6px;
			color: transparent;
			display: inline-flex;
			flex-shrink: 0;
			font-size: 10px;
			height: 20px;
			justify-content: center;
			width: 20px;
		}
		.imogi-variant-option--addon.is-active .imogi-variant-option-check {
			background: #00b14f;
			border-color: #00b14f;
			color: #fff;
		}
		.imogi-variant-option-label {
			flex: 1;
			font-size: 14px;
			font-weight: 600;
			line-height: 1.35;
			min-width: 0;
		}
		.imogi-variant-option-price {
			color: #18181b;
			flex-shrink: 0;
			font-size: 13px;
			font-variant-numeric: tabular-nums;
			font-weight: 700;
			min-width: 56px;
			text-align: right;
		}
		.imogi-variant-sticky-footer {
			background: #fff;
			border-top: 1px solid #e4e4e7;
			box-shadow: 0 -4px 20px rgba(15, 23, 42, 0.06);
			flex-shrink: 0;
			padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
		}
		.imogi-variant-add-cart {
			background: #00b14f;
			border: none;
			border-radius: 999px;
			color: #fff;
			cursor: pointer;
			font-size: 15px;
			font-weight: 800;
			min-height: 48px;
			padding: 12px 18px;
			width: 100%;
		}
		.imogi-variant-add-cart:hover { background: #009a45; }
		.imogi-variant-add-cart:disabled {
			background: #d4d4d8;
			cursor: not-allowed;
		}
		@media (min-width: 641px) {
			.imogi-variant-overlay {
				align-items: center;
				padding: 24px 16px;
			}
			.imogi-variant-sheet {
				border-radius: 16px;
				max-height: min(88vh, 640px);
			}
			.imogi-variant-hero-media { border-radius: 16px 16px 0 0; }
		}
		`,
		"imogi-variant-modal-css-v8"
	);
}

inject_variant_modal_css();
