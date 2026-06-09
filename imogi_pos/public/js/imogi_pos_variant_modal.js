frappe.provide("imogi_pos");

const IMOGI_VARIANT_VALUE_ICONS = {
	hot: { icon: "fa-fire", tone: "hot" },
	panas: { icon: "fa-fire", tone: "hot" },
	warm: { icon: "fa-fire", tone: "hot" },
	ice: { icon: "fa-tint", tone: "ice" },
	dingin: { icon: "fa-tint", tone: "ice" },
	cold: { icon: "fa-tint", tone: "ice" },
	reguler: { icon: "fa-coffee", tone: "size-md" },
	regular: { icon: "fa-coffee", tone: "size-md" },
	r: { icon: "fa-coffee", tone: "size-md" },
	medium: { icon: "fa-adjust", tone: "size-md" },
	small: { icon: "fa-compress", tone: "size-sm" },
	kecil: { icon: "fa-compress", tone: "size-sm" },
	large: { icon: "fa-expand", tone: "size-lg" },
	besar: { icon: "fa-expand", tone: "size-lg" },
	jumbo: { icon: "fa-flask", tone: "size-lg" },
	j: { icon: "fa-flask", tone: "size-lg" },
	float: { icon: "fa-glass", tone: "size-float" },
	f: { icon: "fa-glass", tone: "size-float" },
	merah: { icon: "fa-circle", tone: "color-red" },
	red: { icon: "fa-circle", tone: "color-red" },
	biru: { icon: "fa-circle", tone: "color-blue" },
	blue: { icon: "fa-circle", tone: "color-blue" },
	hijau: { icon: "fa-circle", tone: "color-green" },
	green: { icon: "fa-circle", tone: "color-green" },
	kuning: { icon: "fa-circle", tone: "color-yellow" },
	yellow: { icon: "fa-circle", tone: "color-yellow" },
	hitam: { icon: "fa-circle", tone: "color-dark" },
	black: { icon: "fa-circle", tone: "color-dark" },
	putih: { icon: "fa-circle", tone: "color-light" },
	white: { icon: "fa-circle", tone: "color-light" },
};

function resolve_variant_icon(attribute, value) {
	const key = (value || "").trim().toLowerCase();
	if (IMOGI_VARIANT_VALUE_ICONS[key]) {
		return IMOGI_VARIANT_VALUE_ICONS[key];
	}

	const attr = (attribute || "").trim().toLowerCase();
	if (attr.includes("temperatur") || attr.includes("temperature")) {
		return { icon: "fa-thermometer-half", tone: "default" };
	}
	if (attr.includes("ukuran") || attr.includes("size")) {
		return { icon: "fa-tag", tone: "size-md" };
	}
	if (attr.includes("warna") || attr.includes("color") || attr.includes("colour")) {
		return { icon: "fa-paint-brush", tone: "color-default" };
	}
	return { icon: "fa-check-circle-o", tone: "default" };
}

function should_use_iconic_variant_layout(attribute, values) {
	const count = (values || []).length;
	if (!count || count > 4) return false;
	const attr = (attribute || "").trim().toLowerCase();
	return (
		attr.includes("temperatur") ||
		attr.includes("temperature") ||
		attr.includes("ukuran") ||
		attr.includes("size") ||
		attr.includes("warna") ||
		attr.includes("color")
	);
}

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
	}

	format_delta(delta) {
		const amount = flt(delta);
		if (!amount) return "";
		const abs = Math.abs(amount);
		const compact =
			abs >= 1000 ? `${Math.round(abs / 1000)}k` : format_currency(abs, this.config.currency, 0);
		return amount > 0 ? `+${compact}` : `-${compact}`;
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

	render_thumb_html() {
		const cfg = this.config;
		const abbr = frappe.utils.escape_html(frappe.get_abbr(cfg.item_name || cfg.template_item_code || "?"));
		const image = this.get_selected_image();
		if (image) {
			return `<img src="${frappe.utils.escape_html(image)}" alt="${abbr}" />`;
		}
		return `<span>${abbr}</span>`;
	}

	update_header_image() {
		if (!this.$modal) return;
		this.$modal.find(".imogi-variant-thumb").html(this.render_thumb_html());
	}

	render_option_icon(attribute, value) {
		const spec = resolve_variant_icon(attribute, value);
		return `<span class="imogi-variant-opt-icon imogi-variant-icon--${frappe.utils.escape_html(
			spec.tone
		)}" aria-hidden="true"><i class="fa ${spec.icon}"></i></span>`;
	}

	render_attribute_section(attr, index) {
		const selected = this.selections[attr.attribute];
		const values = attr.values || [];
		const is_pair = (this.config.attributes || []).length >= 3 && index > 0 && index <= 2;
		const pair_class = is_pair ? " imogi-variant-attr--pair" : "";
		const iconic_layout = should_use_iconic_variant_layout(attr.attribute || attr.label, values);
		const row_class = iconic_layout
			? "imogi-variant-opt-row imogi-variant-opt-row--iconic"
			: values.length >= 4
				? "imogi-variant-opt-row imogi-variant-opt-row--grid"
				: "imogi-variant-opt-row";

		const buttons = values
			.map((row) => {
				const active = row.value === selected ? " is-active" : "";
				const delta = this.format_delta(row.price_delta);
				const delta_html = delta
					? `<span class="imogi-variant-opt-delta">${frappe.utils.escape_html(delta)}</span>`
					: "";
				const iconic_class = iconic_layout ? " imogi-variant-opt--iconic" : "";
				const icon_html = this.render_option_icon(attr.attribute, row.value);
				return `<button type="button" class="imogi-variant-opt${active}${iconic_class}"
					data-attribute="${frappe.utils.escape_html(attr.attribute)}"
					data-value="${frappe.utils.escape_html(row.value)}">
					${icon_html}
					<span class="imogi-variant-opt-label">${frappe.utils.escape_html(row.value)}</span>
					${delta_html}
				</button>`;
			})
			.join("");

		return `<div class="imogi-variant-attr${pair_class}" data-attr-index="${index}">
			<div class="imogi-variant-attr-label">${frappe.utils.escape_html(attr.label || attr.attribute)}</div>
			<div class="${row_class}">${buttons}</div>
		</div>`;
	}

	render_add_ons() {
		const rows = this.config.add_ons || [];
		if (!rows.length) return "";

		const buttons = rows
			.map((row) => {
				const active = this.add_ons[row.item_code] ? " is-active" : "";
				const delta = this.format_delta(row.rate) || "+0";
				const name = frappe.ellipsis(row.item_name || row.item_code, 24);
				return `<button type="button" class="imogi-variant-addon${active}"
					data-addon="${frappe.utils.escape_html(row.item_code)}">
					<span class="imogi-variant-addon-name">${frappe.utils.escape_html(name)}</span>
					<span class="imogi-variant-addon-price">${frappe.utils.escape_html(delta)}</span>
				</button>`;
			})
			.join("");

		return `<div class="imogi-variant-attr imogi-variant-attr--addons">
			<div class="imogi-variant-attr-label">${__("Add-ons (Optional)")}</div>
			<div class="imogi-variant-addons-list">${buttons}</div>
		</div>`;
	}

	render() {
		inject_variant_modal_css();
		this.close();
		const cfg = this.config;
		const image = this.render_thumb_html();

		const attrs = cfg.attributes || [];
		let attributes_html = "";
		if (attrs.length) {
			attributes_html += this.render_attribute_section(attrs[0], 0);
		}
		if (attrs.length === 2) {
			attributes_html += this.render_attribute_section(attrs[1], 1);
		} else if (attrs.length >= 3) {
			attributes_html += `<div class="imogi-variant-attr-pair">${this.render_attribute_section(
				attrs[1],
				1
			)}${this.render_attribute_section(attrs[2], 2)}</div>`;
			attrs.slice(3).forEach((attr, idx) => {
				attributes_html += this.render_attribute_section(attr, idx + 3);
			});
		}

		this.$modal = $(`
			<div class="imogi-variant-overlay">
				<div class="imogi-variant-modal" role="dialog" aria-modal="true">
					<div class="imogi-variant-header">
						<div class="imogi-variant-header-main">
							<div class="imogi-variant-thumb">${image}</div>
							<div class="imogi-variant-header-text">
								<div class="imogi-variant-title">${frappe.utils.escape_html(cfg.item_name)}</div>
								<div class="imogi-variant-price imogi-variant-price-live">${this.format_price(this.get_selected_rate())}</div>
							</div>
						</div>
						<button type="button" class="imogi-variant-close" aria-label="${__("Close")}">&times;</button>
					</div>
					<div class="imogi-variant-body">
						${attributes_html}
						${this.render_add_ons()}
					</div>
					<div class="imogi-variant-footer">
						<button type="button" class="imogi-variant-btn imogi-variant-btn-cancel">${__("Cancel")}</button>
						<button type="button" class="imogi-variant-btn imogi-variant-btn-add">
							<i class="fa fa-plus"></i> ${__("Add to Order")}
						</button>
					</div>
				</div>
			</div>
		`);

		$("body").append(this.$modal);
		this.bind_events();
	}

	bind_events() {
		const $m = this.$modal;

		$m.find(".imogi-variant-close, .imogi-variant-btn-cancel").on("click", () => this.close());

		$m.on("click", (e) => {
			if ($(e.target).hasClass("imogi-variant-overlay")) this.close();
		});

		$m.find(".imogi-variant-opt").on("click", (e) => {
			const $btn = $(e.currentTarget);
			const attribute = $btn.data("attribute");
			const value = $btn.data("value");
			this.selections[attribute] = value;
			$m.find(`.imogi-variant-opt[data-attribute="${attribute}"]`).removeClass("is-active");
			$btn.addClass("is-active");
			$m.find(".imogi-variant-price-live").text(this.format_price(this.get_selected_rate()));
			this.update_header_image();
		});

		$m.find(".imogi-variant-addon").on("click", (e) => {
			const $btn = $(e.currentTarget);
			const code = $btn.data("addon");
			this.add_ons[code] = !this.add_ons[code];
			$btn.toggleClass("is-active", !!this.add_ons[code]);
			$m.find(".imogi-variant-price-live").text(this.format_price(this.get_selected_rate()));
		});

		$m.find(".imogi-variant-btn-add").on("click", () => this.submit());
	}

	submit() {
		const $btn = this.$modal.find(".imogi-variant-btn-add");
		$btn.prop("disabled", true).html(`<i class="fa fa-spinner fa-spin"></i> ${__("Adding...")}`);

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
					$btn.prop("disabled", false).html(`<i class="fa fa-plus"></i> ${__("Add to Order")}`);
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
	].forEach((id) => document.getElementById(id)?.remove());

	frappe.dom.set_style(`
		.imogi-variant-overlay { align-items: center; background: rgba(7, 17, 31, 0.55); display: flex; inset: 0; justify-content: center; padding: 20px; position: fixed; z-index: 1050; }
		.imogi-variant-modal { background: #fff; border: 1px solid #e4e4e7; border-radius: 18px; box-shadow: 0 24px 64px rgba(7, 17, 31, 0.22); display: flex; flex-direction: column; max-height: min(90vh, 680px); max-width: 440px; overflow: hidden; width: 100%; }
		.imogi-variant-header { align-items: flex-start; background: linear-gradient(145deg, #07111f 0%, #0f1f35 40%, #1a3352 100%); border-bottom: 1px solid rgba(255,255,255,0.1); color: #fff; display: flex; gap: 12px; justify-content: space-between; padding: 18px 20px 16px; }
		.imogi-variant-header-main { align-items: center; display: flex; gap: 14px; min-width: 0; }
		.imogi-variant-header-text { min-width: 0; text-align: left; }
		.imogi-variant-thumb { align-items: center; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18); border-radius: 12px; color: #fff; display: flex; flex-shrink: 0; height: 64px; justify-content: center; overflow: hidden; transition: opacity .2s ease; width: 64px; }
		.imogi-variant-thumb img { display: block; height: 100%; max-height: 100%; max-width: 100%; object-fit: contain; object-position: center; width: 100%; }
		.imogi-variant-thumb span { font-size: 16px; font-weight: 800; }
		.imogi-variant-title { color: #fff; font-size: 18px; font-weight: 800; line-height: 1.25; }
		.imogi-variant-price { color: rgba(255,255,255,0.78); font-size: 14px; font-weight: 700; margin-top: 4px; }
		.imogi-variant-close { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #fff; cursor: pointer; flex-shrink: 0; font-size: 20px; height: 32px; line-height: 1; padding: 0; width: 32px; }
		.imogi-variant-close:hover { background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.32); color: #fff; }
		.imogi-variant-body { background: #fff; flex: 1; min-height: 0; overflow-y: auto; padding: 20px 20px 12px; }
		.imogi-variant-attr { margin-bottom: 20px; }
		.imogi-variant-attr:last-child { margin-bottom: 0; }
		.imogi-variant-attr-label { color: #52525b; font-size: 11px; font-weight: 800; letter-spacing: .04em; margin-bottom: 10px; text-align: left; text-transform: uppercase; }
		.imogi-variant-attr-pair { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0,1fr)); margin-bottom: 20px; }
		.imogi-variant-attr-pair .imogi-variant-attr { margin-bottom: 0; }
		.imogi-variant-opt-row { display: flex; flex-wrap: wrap; gap: 8px; }
		.imogi-variant-opt-row--iconic { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); }
		.imogi-variant-opt-row--grid { display: grid; gap: 8px; grid-template-columns: repeat(auto-fit, minmax(76px, 1fr)); }
		.imogi-variant-opt-row--grid .imogi-variant-opt { min-width: 0; width: 100%; }
		.imogi-variant-opt { align-items: center; background: #fff; border: 1.5px solid #e4e4e7; border-radius: 12px; color: #0f1f35; cursor: pointer; display: flex; flex-direction: row; gap: 10px; justify-content: flex-start; min-height: 52px; padding: 10px 12px; text-align: left; transition: border-color .2s, background .2s, box-shadow .2s; }
		.imogi-variant-opt--iconic { align-items: center; flex-direction: column; gap: 6px; justify-content: center; min-height: 92px; padding: 14px 10px 12px; text-align: center; }
		.imogi-variant-opt-icon { align-items: center; border-radius: 12px; display: inline-flex; flex-shrink: 0; font-size: 18px; height: 40px; justify-content: center; transition: background .2s ease, color .2s ease, transform .2s ease; width: 40px; }
		.imogi-variant-opt--iconic .imogi-variant-opt-icon { height: 44px; width: 44px; }
		.imogi-variant-opt.is-active .imogi-variant-opt-icon { transform: scale(1.04); }
		.imogi-variant-icon--hot { background: #fff7ed; color: #ea580c; }
		.imogi-variant-icon--ice { background: #eff6ff; color: #0284c7; }
		.imogi-variant-icon--size-sm { background: #f8fafc; color: #64748b; }
		.imogi-variant-icon--size-md { background: #f1f5f9; color: #475569; }
		.imogi-variant-icon--size-lg { background: #eef2ff; color: #4338ca; }
		.imogi-variant-icon--size-float { background: #ecfeff; color: #0891b2; }
		.imogi-variant-icon--color-red { background: #fef2f2; color: #dc2626; }
		.imogi-variant-icon--color-blue { background: #eff6ff; color: #2563eb; }
		.imogi-variant-icon--color-green { background: #ecfdf5; color: #059669; }
		.imogi-variant-icon--color-yellow { background: #fefce8; color: #ca8a04; }
		.imogi-variant-icon--color-dark { background: #f4f4f5; color: #18181b; }
		.imogi-variant-icon--color-light { background: #fafafa; color: #71717a; border: 1px solid #e4e4e7; }
		.imogi-variant-icon--color-default { background: #fdf4ff; color: #a21caf; }
		.imogi-variant-icon--default { background: #f8fafc; color: #64748b; }
		.imogi-variant-opt.is-active .imogi-variant-icon--hot { background: #ffedd5; color: #c2410c; }
		.imogi-variant-opt.is-active .imogi-variant-icon--ice { background: #dbeafe; color: #1d4ed8; }
		.imogi-variant-opt.is-active .imogi-variant-icon--size-lg { background: #e0e7ff; color: #3730a3; }
		.imogi-variant-opt:hover { background: #fff; border-color: #2a4f73; box-shadow: 0 0 0 3px rgba(42, 79, 115, 0.12); }
		.imogi-variant-opt.is-active { background: #f8fafc; border-color: #0f1f35; box-shadow: 0 0 0 3px rgba(26, 51, 82, 0.14); color: #0f1f35; }
		.imogi-variant-attr-pair .imogi-variant-attr:first-child .imogi-variant-opt.is-active,
		.imogi-variant-attr-pair .imogi-variant-attr:last-child .imogi-variant-opt.is-active { background: #f8fafc; border-color: #0f1f35; color: #0f1f35; }
		.imogi-variant-opt-label { font-size: 13px; font-weight: 700; line-height: 1.2; }
		.imogi-variant-opt--iconic .imogi-variant-opt-label { width: 100%; }
		.imogi-variant-opt-delta { color: #71717a; font-size: 11px; font-weight: 700; }
		.imogi-variant-opt--iconic .imogi-variant-opt-delta { margin-top: -2px; }
		.imogi-variant-opt.is-active .imogi-variant-opt-delta { color: #52525b; }
		.imogi-variant-addons-list { display: grid; gap: 8px; max-height: 200px; overflow-y: auto; padding-right: 2px; }
		.imogi-variant-addon { align-items: center; background: #fff; border: 1.5px solid #e4e4e7; border-radius: 12px; color: #0f1f35; cursor: pointer; display: flex; gap: 12px; justify-content: space-between; min-height: 48px; padding: 12px 14px; text-align: left; transition: border-color .2s, background .2s, box-shadow .2s; width: 100%; }
		.imogi-variant-addon:hover { background: #fff; border-color: #2a4f73; box-shadow: 0 0 0 3px rgba(42, 79, 115, 0.12); }
		.imogi-variant-addon.is-active { background: #f8fafc; border-color: #0f1f35; box-shadow: 0 0 0 3px rgba(26, 51, 82, 0.14); color: #0f1f35; }
		.imogi-variant-addon-name { flex: 1; font-size: 13px; font-weight: 700; line-height: 1.3; min-width: 0; text-align: left; }
		.imogi-variant-addon-price { color: #71717a; flex-shrink: 0; font-size: 12px; font-weight: 800; white-space: nowrap; }
		.imogi-variant-addon.is-active .imogi-variant-addon-price { color: #52525b; }
		.imogi-variant-footer { background: #fafafa; border-top: 1px solid #e4e4e7; display: grid; gap: 10px; grid-template-columns: 1fr 1fr; padding: 16px 20px 20px; }
		.imogi-variant-btn { border-radius: 12px; cursor: pointer; font-size: 14px; font-weight: 800; min-height: 48px; padding: 12px 16px; }
		.imogi-variant-btn-cancel { background: #fff; border: 1.5px solid #d4d4d8; color: #0f1f35; }
		.imogi-variant-btn-cancel:hover { background: #fafafa; border-color: #2a4f73; }
		.imogi-variant-btn-add { background: #0f1f35 !important; border: none !important; color: #fff !important; }
		.imogi-variant-btn-add:hover { background: #1a3352 !important; color: #fff !important; }
		.imogi-variant-btn-add:disabled { opacity: .4; }
	`, "imogi-variant-modal-css-v6");
}

inject_variant_modal_css();
