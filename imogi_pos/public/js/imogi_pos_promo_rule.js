// imogi-promo-ui-v12.2 — Reward tab terpisah dari Detail
frappe.provide("imogi_pos.promo_rule");

imogi_pos.promo_rule.TYPE_REGISTRY = [
	{
		value: "Buy X Get Y Free",
		label: __("Beli X Gratis Y"),
		desc: __("Gratis item yang sama"),
		example: __("Beli 2 → dapat 1 gratis (sesuai Qty Beli)"),
		icon: "fa-gift",
	},
	{
		value: "Buy X Get Other Free",
		label: __("Beli X Dapat Lain"),
		desc: __("Gratis item berbeda"),
		example: __("Beli 2 → dapat item reward gratis (sesuai Qty Beli)"),
		icon: "fa-exchange",
	},
	{
		value: "Qty Discount Percent",
		label: __("Diskon"),
		desc: __("% atau nominal Rp"),
		example: __("Min 3 Latte → diskon 10% atau Rp 5.000"),
		icon: "fa-tag",
		is_discount: true,
	},
];

function is_discount_rule_type(value) {
	return value === "Qty Discount Percent" || value === "Qty Discount Amount";
}

function is_type_card_selected(opt, current) {
	if (opt.is_discount) return is_discount_rule_type(current);
	return opt.value === current;
}

const PROMO_STEPS = [
	{ key: "type", section: "type_section", label: __("Tipe") },
	{ key: "identity", section: "identity_section", label: __("Identitas") },
	{ key: "rules", section: "condition_section", label: __("Syarat & Reward") },
	{ key: "validity", section: "validity_section", label: __("Periode") },
];

frappe.ui.form.on("IMOGI POS Promo Rule", {
	onload(frm) {
		schedule_promo_rule_ui(frm);
	},
	refresh(frm) {
		schedule_promo_rule_ui(frm);
	},
	after_save(frm) {
		schedule_promo_rule_ui(frm);
	},
	rule_type(frm) {
		_reward_cards_key = "";
		frm.refresh_field("reward_items");
		frm.refresh_field("reward_value");
		toggle_promo_rule_sections(frm);
		refresh_promo_rule_ui(frm);
	},
	promo_name: light_refresh_handler,
	company: light_refresh_handler,
	min_qty: light_refresh_handler,
	trigger_item_code: light_refresh_handler,
	trigger_item_group: light_refresh_handler,
	reward_items_add: refresh_handler,
	reward_items_remove: refresh_handler,
	reward_value: light_refresh_handler,
	valid_from: light_refresh_handler,
	valid_upto: light_refresh_handler,
	outlets_add: light_refresh_handler,
	outlets_remove: light_refresh_handler,
});

frappe.ui.form.on("IMOGI POS Promo Rule Reward", {
	item_code: light_refresh_handler,
	qty: light_refresh_handler,
});

frappe.ui.form.on("IMOGI POS Promo Rule Outlet", {
	branch: light_refresh_handler,
});

function refresh_handler(frm) {
	refresh_promo_rule_ui(frm);
}

function light_refresh_handler(frm) {
	refresh_promo_rule_light(frm);
}

function refresh_promo_rule_light(frm) {
	if (!frm?.$wrapper) return;
	render_form_header(frm);
	update_type_example(frm);
	render_cart_preview(frm);
	render_readiness(frm);
	render_save_action(frm);
}

function get_promo_types() {
	return imogi_pos.promo_rule.TYPE_REGISTRY || [];
}

function get_promo_type(value) {
	if (is_discount_rule_type(value)) {
		return get_promo_types().find((row) => row.is_discount) || get_promo_types()[0];
	}
	return get_promo_types().find((row) => row.value === value) || get_promo_types()[0];
}

function schedule_promo_rule_ui(frm) {
	ensure_promo_rule_styles();
	const run = () => {
		init_promo_rule_page(frm);
		refresh_promo_rule_ui(frm);
	};
	run();
	if (!frm.$wrapper.find(".imogi-promo-v11").length) {
		setTimeout(run, 0);
		setTimeout(run, 150);
	}
}

const _reward_item_controls = new Map();
const _outlet_item_controls = new Map();
let _reward_cards_key = "";
let _outlet_cards_key = "";
let _cart_preview_seq = 0;
const _item_rate_cache = new Map();

function ensure_promo_rule_styles() {
	["v4", "v5", "v6", "v7", "v8", "v9", "v10", "v11", "v12", "v13", "v14", "v15", "v16", "v17"].forEach((v) =>
		document.getElementById(`imogi-promo-rule-css-${v}`)?.remove()
	);
	frappe.dom.set_style(
		`
		.imogi-promo-rule-page .page-head { display: none !important; }
		.imogi-promo-rule-page .layout-side-section,
		.imogi-promo-rule-page .form-sidebar,
		body[data-route*="IMOGI POS Promo Rule"] .layout-side-section {
			display: none !important;
		}
		.imogi-promo-rule-page .row > .col-lg-10,
		.imogi-promo-rule-page .row > .col-md-9,
		body[data-route*="IMOGI POS Promo Rule"] .row > .col-lg-10,
		body[data-route*="IMOGI POS Promo Rule"] .row > .col-md-9 {
			flex: 0 0 100% !important;
			max-width: 100% !important;
			width: 100% !important;
		}
		.imogi-promo-rule-page .layout-main-section-wrapper,
		.imogi-promo-rule-page .layout-main-section,
		.imogi-promo-rule-page .form-page,
		.imogi-promo-rule-page .page-body,
		body[data-route*="IMOGI POS Promo Rule"] .layout-main-section-wrapper,
		body[data-route*="IMOGI POS Promo Rule"] .layout-main-section {
			background: #fff !important;
		}
		.imogi-promo-rule-page .form-layout { margin: 0; max-width: none; padding: 0; }

		/* ── Shell ── */
		.imogi-promo-v11.imogi-promo-workspace {
			background: #fff;
			border: none;
			border-radius: 0;
			box-shadow: none;
			margin: 0;
			overflow: visible;
		}
		.imogi-promo-obj-header,
		.imogi-promo-obj-header-host,
		.imogi-promo-stepper,
		.imogi-promo-stepper-host {
			display: none !important;
		}
		.imogi-promo-breadcrumb {
			align-items: center;
			display: flex;
			flex-wrap: wrap;
			font-size: 11px;
			gap: 2px;
			margin-bottom: 6px;
		}
		.imogi-promo-bc-link {
			background: none;
			border: none;
			color: #6b7280;
			cursor: pointer;
			font-size: 11px;
			padding: 0;
			text-decoration: none;
		}
		.imogi-promo-bc-link:hover { color: #0f1f35; text-decoration: underline; }
		.imogi-promo-bc-sep { color: #d1d5db; margin: 0 4px; }
		.imogi-promo-bc-current { color: #374151; font-weight: 600; }
		.imogi-promo-obj-header-main { flex: 1; min-width: 0; }
		.imogi-promo-obj-eyebrow {
			color: #6b7280;
			font-size: 11px;
			font-weight: 600;
			letter-spacing: .04em;
			margin-bottom: 4px;
			text-transform: uppercase;
		}
		.imogi-promo-obj-title {
			color: #0f1f35;
			font-size: 20px;
			font-weight: 700;
			letter-spacing: -.02em;
			line-height: 1.25;
			margin: 0;
		}
		.imogi-promo-obj-sub {
			color: #6b7280;
			font-size: 12px;
			line-height: 1.4;
			margin-top: 5px;
		}
		.imogi-promo-obj-chips {
			display: flex;
			flex-shrink: 0;
			flex-wrap: wrap;
			gap: 6px;
			justify-content: flex-end;
		}
		.imogi-promo-chip {
			border-radius: 4px;
			font-size: 11px;
			font-weight: 700;
			line-height: 1;
			padding: 5px 9px;
			white-space: nowrap;
		}
		.imogi-promo-chip.is-type { background: #eef2ff; color: #3730a3; }
		.imogi-promo-chip.is-live { background: #dcfce7; color: #166534; }
		.imogi-promo-chip.is-scheduled { background: #fef3c7; color: #92400e; }
		.imogi-promo-chip.is-expired { background: #f3f4f6; color: #6b7280; }
		.imogi-promo-chip.is-off { background: #fee2e2; color: #991b1b; }

		/* ── Stepper ── */
		.imogi-promo-stepper {
			background: #f8f9fb;
			border-bottom: 1px solid #e2e6ec;
			display: flex;
			gap: 0;
			overflow-x: auto;
			padding: 0 12px;
		}
		.imogi-promo-step {
			align-items: center;
			background: none;
			border: none;
			color: #9ca3af;
			cursor: pointer;
			display: flex;
			flex: 1;
			font-size: 11px;
			font-weight: 600;
			gap: 7px;
			min-width: 0;
			padding: 10px 8px;
			position: relative;
			text-align: left;
			transition: color .12s;
			white-space: nowrap;
		}
		.imogi-promo-step:hover { color: #0f1f35; }
		.imogi-promo-step:not(:last-child)::after {
			background: #d1d5db;
			content: "";
			flex: 1;
			height: 1px;
			margin-left: 4px;
			min-width: 12px;
		}
		.imogi-promo-step.is-active { color: #0f1f35; }
		.imogi-promo-step.is-active .imogi-promo-step-dot {
			background: #0f1f35;
			border-color: #0f1f35;
			color: #fff;
		}
		.imogi-promo-step.is-done { color: #374151; }
		.imogi-promo-step.is-done .imogi-promo-step-dot {
			background: #16a34a;
			border-color: #16a34a;
			color: #fff;
		}
		.imogi-promo-step.is-done:not(:last-child)::after { background: #86efac; }
		.imogi-promo-step-dot {
			align-items: center;
			background: #fff;
			border: 2px solid #d1d5db;
			border-radius: 50%;
			display: inline-flex;
			flex-shrink: 0;
			font-size: 10px;
			font-weight: 700;
			height: 22px;
			justify-content: center;
			width: 22px;
		}

		/* ── Body grid ── */
		.imogi-promo-body {
			display: grid;
			grid-template-columns: minmax(0, 1fr) 300px;
		}
		.imogi-promo-main { min-width: 0; padding: 16px 18px 14px; }

		/* ── Type cards + contoh kanan ── */
		.imogi-promo-type-row {
			align-items: stretch;
			display: grid;
			gap: 12px;
			grid-template-columns: minmax(0, 1fr) 220px;
			height: 68px;
			min-height: 68px;
			max-height: 68px;
		}
		.imogi-promo-type-cards {
			align-items: stretch;
			display: grid;
			gap: 10px;
			grid-auto-rows: 68px;
			grid-template-columns: repeat(3, minmax(0, 1fr));
			height: 68px;
		}
		.imogi-promo-type-card {
			align-items: center;
			background: #fff;
			border: 1.5px solid #e2e6ec;
			border-radius: 6px;
			box-shadow: 0 0 0 3px transparent;
			box-sizing: border-box;
			cursor: pointer;
			display: flex;
			flex-direction: row;
			gap: 10px;
			height: 68px;
			justify-content: flex-start;
			max-height: 68px;
			min-height: 68px;
			overflow: hidden;
			padding: 10px 12px;
			text-align: left;
			transition: border-color .12s, box-shadow .12s, background .12s;
			width: 100%;
		}
		.imogi-promo-type-card:hover {
			border-color: #9ca3af;
			box-shadow: 0 0 0 3px rgba(15,31,53,.04);
		}
		.imogi-promo-type-card.is-selected {
			background: #f8fafc;
			border-color: #0f1f35;
			box-shadow: 0 0 0 3px rgba(15,31,53,.08);
		}
		.imogi-promo-type-card-icon {
			align-items: center;
			background: #f3f4f6;
			border-radius: 5px;
			color: #374151;
			display: inline-flex;
			flex-shrink: 0;
			font-size: 12px;
			height: 28px;
			justify-content: center;
			margin-bottom: 0;
			width: 28px;
		}
		.imogi-promo-type-card.is-selected .imogi-promo-type-card-icon {
			background: #0f1f35;
			color: #fff;
		}
		.imogi-promo-type-card-copy {
			flex: 1;
			min-width: 0;
			width: 100%;
		}
		.imogi-promo-type-card-title {
			color: #111827;
			display: block;
			font-size: 12px;
			font-weight: 700;
			line-height: 1.3;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.imogi-promo-type-card-desc {
			color: #6b7280;
			display: block;
			font-size: 10px;
			line-height: 1.3;
			margin-top: 2px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.imogi-promo-type-example-wrap {
			align-items: flex-start;
			background: #fff;
			border: 1.5px solid #e2e6ec;
			border-radius: 6px;
			box-sizing: border-box;
			color: #374151;
			display: flex;
			flex-direction: column;
			font-size: 11px;
			height: 68px;
			justify-content: center;
			line-height: 1.4;
			max-height: 68px;
			min-height: 68px;
			overflow: hidden;
			padding: 10px 12px;
		}
		.imogi-promo-type-example-wrap .imogi-promo-type-example-label {
			color: #6b7280;
			flex-shrink: 0;
			font-size: 10px;
			font-weight: 700;
			letter-spacing: .04em;
			line-height: 1.2;
			margin-bottom: 4px;
			text-transform: uppercase;
		}
		.imogi-promo-type-example-host {
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 2;
			line-clamp: 2;
			overflow: hidden;
			word-break: break-word;
		}
		.imogi-promo-type-example-wrap i {
			display: none;
		}
		.imogi-promo-discount-mode {
			background: #f3f4f6;
			border-radius: 6px;
			display: inline-flex;
			gap: 2px;
			padding: 3px;
		}
		.imogi-promo-discount-mode-btn {
			align-items: center;
			background: transparent;
			border: none;
			border-radius: 4px;
			color: #6b7280;
			cursor: pointer;
			display: inline-flex;
			flex-direction: column;
			font-size: 12px;
			font-weight: 700;
			gap: 1px;
			justify-content: center;
			line-height: 1.2;
			min-width: 76px;
			padding: 8px 10px;
			transition: background .12s, color .12s, box-shadow .12s;
		}
		.imogi-promo-discount-mode-btn span {
			font-size: 14px;
			font-weight: 800;
		}
		.imogi-promo-discount-mode-btn small {
			font-size: 9px;
			font-weight: 600;
			letter-spacing: .02em;
			opacity: .85;
		}
		.imogi-promo-discount-mode-btn:hover {
			background: rgba(255,255,255,.55);
			color: #0f1f35;
		}
		.imogi-promo-discount-mode-btn.is-active {
			background: #fff;
			box-shadow: 0 1px 3px rgba(15,31,53,.12);
			color: #0f1f35;
		}
		.imogi-promo-tab-pane-reward,
		.imogi-promo-tab-pane-outlet {
			padding: 0;
		}
		.imogi-promo-discount-block {
			max-width: 480px;
		}
		.imogi-promo-discount-panel-intro {
			display: none;
		}
		.imogi-promo-discount-panel-title {
			color: #0f1f35;
			font-size: 13px;
			font-weight: 700;
			line-height: 1.3;
		}
		.imogi-promo-discount-panel-desc {
			color: #6b7280;
			font-size: 11px;
			line-height: 1.45;
			margin-top: 4px;
		}
		.imogi-promo-discount-panel-body {
			align-items: end;
			display: grid;
			gap: 14px 20px;
			grid-template-columns: 168px minmax(0, 220px);
		}
		.imogi-promo-discount-field-label {
			color: #4b5563;
			display: block;
			font-size: 11px;
			font-weight: 600;
			margin-bottom: 6px;
		}
		.imogi-promo-discount-value-control {
			margin-bottom: 0 !important;
		}
		.imogi-promo-discount-value-control .control-label {
			display: none !important;
		}
		.imogi-promo-discount-value-control .control-input-wrapper {
			position: relative;
		}
		.imogi-promo-discount-value-field.is-percent .imogi-promo-discount-value-control .form-control {
			padding-right: 28px !important;
		}
		.imogi-promo-discount-value-field.is-percent .imogi-promo-discount-value-control .control-input-wrapper::after {
			color: #6b7280;
			content: "%";
			font-size: 12px;
			font-weight: 700;
			pointer-events: none;
			position: absolute;
			right: 10px;
			top: 50%;
			transform: translateY(-50%);
		}
		.imogi-promo-discount-value-field.is-amount .imogi-promo-discount-value-control .form-control {
			padding-left: 34px !important;
		}
		.imogi-promo-discount-value-field.is-amount .imogi-promo-discount-value-control .control-input-wrapper::before {
			color: #6b7280;
			content: "Rp";
			font-size: 11px;
			font-weight: 700;
			left: 10px;
			pointer-events: none;
			position: absolute;
			top: 50%;
			transform: translateY(-50%);
		}
		.imogi-promo-reward-frappe-host:empty {
			display: none !important;
		}

		/* ── Tab bar (tabs kiri, chip kanan) ── */
		.imogi-promo-tabbar {
			align-items: center;
			background: #fff;
			border-bottom: 1px solid #e2e6ec;
			display: flex;
			gap: 12px;
			justify-content: space-between;
			min-height: 42px;
			padding: 0 18px;
		}
		.imogi-promo-tabbar .imogi-promo-tabs {
			background: transparent;
			border: none;
			display: flex;
			flex: 1;
			gap: 0;
			min-width: 0;
			padding: 0;
		}
		.imogi-promo-tabbar-chips {
			align-items: center;
			display: flex;
			flex-shrink: 0;
			flex-wrap: wrap;
			gap: 6px;
			justify-content: flex-end;
		}
		.imogi-promo-tab {
			background: none;
			border: none;
			border-bottom: 2px solid transparent;
			color: #6b7280;
			cursor: pointer;
			font-size: 13px;
			font-weight: 600;
			margin-bottom: -1px;
			padding: 10px 14px;
		}
		.imogi-promo-tab:hover { color: #0f1f35; }
		.imogi-promo-tab.is-active {
			border-bottom-color: #0f1f35;
			color: #0f1f35;
		}
		.imogi-promo-tab-pane { min-width: 0; }
		.imogi-promo-flat-section-head {
			color: #0f1f35;
			font-size: 13px;
			font-weight: 700;
			letter-spacing: 0;
			line-height: 1.3;
			margin: 0 0 10px;
			padding: 0;
			text-transform: none;
		}
		.imogi-promo-flat-section-head::before {
			color: #9ca3af;
			content: "| ";
			font-weight: 400;
		}
		.imogi-promo-outlet-hint,
		.imogi-promo-reward-tab-hint {
			color: #6b7280;
			font-size: 11px;
			line-height: 1.45;
			margin: 0 0 12px;
		}

		/* ── Section panels (flat, no card) ── */
		.imogi-promo-rule-page .form-section {
			background: transparent !important;
			border: none !important;
			border-radius: 0 !important;
			box-shadow: none !important;
			margin: 0 0 18px !important;
			padding: 0 0 14px !important;
		}
		.imogi-promo-rule-page .form-section .section-head {
			border-bottom: none !important;
			color: #0f1f35 !important;
			font-size: 13px !important;
			font-weight: 700 !important;
			letter-spacing: 0 !important;
			margin: 0 0 10px !important;
			padding: 0 !important;
			text-transform: none !important;
		}
		.imogi-promo-rule-page .form-section .section-head::before {
			color: #9ca3af;
			content: "| ";
			font-weight: 400;
		}
		.imogi-promo-rule-page .form-section .section-head .imogi-promo-step-badge { display: none !important; }
		.imogi-promo-rule-page .form-section .section-body { padding-top: 0 !important; }
		.imogi-promo-rule-page .frappe-control { margin-bottom: 7px !important; }
		.imogi-promo-rule-page .frappe-control .control-label {
			color: #4b5563 !important;
			font-size: 11px !important;
			font-weight: 600 !important;
			margin-bottom: 3px !important;
		}
		.imogi-promo-rule-page .form-control {
			border-color: #d1d5db !important;
			border-radius: 4px !important;
			font-size: 13px;
			min-height: 32px;
		}
		.imogi-promo-rule-page .form-control:focus {
			border-color: #0f1f35 !important;
			box-shadow: 0 0 0 2px rgba(15,31,53,.1) !important;
		}
		.imogi-promo-rule-page .form-column:empty,
		.imogi-promo-rule-page .form-column.is-imogi-empty {
			display: none !important;
			margin: 0 !important;
			padding: 0 !important;
			width: 0 !important;
		}
		.imogi-promo-rule-page .form-section.is-imogi-collapsed { display: none !important; }
		.imogi-promo-rule-page [data-fieldname="rule_type"] { display: none !important; }
		.imogi-promo-rule-page [data-fieldname="is_active"],
		.imogi-promo-rule-page [data-fieldname="remarks"] { display: none !important; }

		/* ── Rules & Rewards block (flat) ── */
		.imogi-promo-rr-block {
			background: transparent;
			border: none;
			border-radius: 0;
			margin-bottom: 18px;
			overflow: visible;
			padding: 0 0 14px;
		}
		.imogi-promo-rr-head {
			background: transparent;
			border: none;
			color: #0f1f35;
			font-size: 13px;
			font-weight: 700;
			letter-spacing: 0;
			margin: 0 0 10px;
			padding: 0;
			text-transform: none;
		}
		.imogi-promo-rr-head::before {
			color: #9ca3af;
			content: "| ";
			font-weight: 400;
		}
		.imogi-promo-rr-grid {
			display: block;
		}
		.imogi-promo-rr-rules-host { min-width: 0; overflow: visible; }
		.imogi-promo-reward-tab-mount { min-height: 40px; overflow: visible; }
		.imogi-promo-rr-col {
			min-width: 0;
			overflow: visible;
			padding: 0 14px 0 0;
		}
		.imogi-promo-rr-col + .imogi-promo-rr-col {
			border-left: 1px solid #f0f2f5;
			padding: 0 0 0 14px;
		}
		.imogi-promo-rr-col-label {
			color: #6b7280;
			font-size: 10px;
			font-weight: 700;
			letter-spacing: .06em;
			margin-bottom: 8px;
			text-transform: uppercase;
		}
		.imogi-promo-rr-block .form-section {
			border: none !important;
			border-radius: 0 !important;
			margin: 0 !important;
			padding: 0 !important;
		}
		.imogi-promo-rr-frappe-host {
			height: 0;
			overflow: hidden;
			position: absolute;
			visibility: hidden;
			width: 0;
		}
		.imogi-promo-rr-rewards-mount,
		.imogi-promo-reward-tab-mount { min-height: 40px; overflow: visible; }
		.imogi-promo-rr-block .form-section .section-head { display: none !important; }

		/* Link / awesomplete dropdown — jangan terpotong */
		.imogi-promo-rule-page .form-section,
		.imogi-promo-rule-page .section-body,
		.imogi-promo-rule-page .frappe-control {
			overflow: visible !important;
		}
		.imogi-promo-rule-page .awesomplete > ul {
			max-height: 220px;
			overflow-y: auto;
			z-index: 1200 !important;
		}
		.imogi-promo-rule-page .link-field.ui-front {
			z-index: auto;
		}

		.imogi-promo-inline-hint {
			color: #6b7280;
			font-size: 11px;
			line-height: 1.4;
			margin: 0 0 6px;
		}
		.imogi-promo-inline-note,
		.imogi-promo-auto-reward-panel .imogi-promo-auto-reward,
		.imogi-promo-reward-tab-mount .imogi-promo-auto-reward {
			background: #f9fafb;
			border: none;
			border-radius: 0;
			color: #4b5563;
			font-size: 11px;
			line-height: 1.45;
			margin: 0;
			padding: 0;
		}
		.imogi-promo-auto-reward i { margin-right: 5px; }

		/* ── Reward cards ── */
		.imogi-promo-reward-cards { display: flex; flex-direction: column; gap: 6px; margin: 2px 0 6px; }
		.imogi-promo-reward-card {
			align-items: end;
			background: #f9fafb;
			border: 1px solid #e5e7eb;
			border-radius: 4px;
			display: grid;
			gap: 8px;
			grid-template-columns: minmax(0, 1fr) 72px 32px;
			padding: 8px 10px;
		}
		.imogi-promo-reward-card-col label {
			color: #6b7280;
			display: block;
			font-size: 10px;
			font-weight: 600;
			line-height: 1.2;
			margin-bottom: 4px;
		}
		.imogi-promo-reward-card-item-host .frappe-control {
			margin-bottom: 0 !important;
		}
		.imogi-promo-reward-card-item-host .control-label {
			display: none !important;
		}
		.imogi-promo-reward-card-item-host .form-group {
			margin-bottom: 0 !important;
		}
		.imogi-promo-reward-card-item-host input.form-control {
			min-height: 32px;
		}
		.imogi-promo-reward-card-qty input {
			border: 1px solid #d1d5db;
			border-radius: 4px;
			box-sizing: border-box;
			font-size: 13px;
			height: 32px;
			padding: 0 8px;
			width: 100%;
		}
		.imogi-promo-reward-card-remove {
			align-items: center;
			align-self: end;
			background: #fff;
			border: 1px solid #d1d5db;
			border-radius: 4px;
			color: #6b7280;
			cursor: pointer;
			display: inline-flex;
			height: 32px;
			justify-content: center;
			margin-bottom: 0;
			width: 32px;
		}
		.imogi-promo-reward-card-remove:hover { border-color: #dc2626; color: #dc2626; }
		.imogi-promo-reward-add {
			align-items: center;
			background: #fff;
			border: 1px dashed #cbd5e1;
			border-radius: 4px;
			color: #0f1f35;
			cursor: pointer;
			display: inline-flex;
			font-size: 11px;
			font-weight: 600;
			gap: 5px;
			padding: 6px 10px;
		}
		.imogi-promo-reward-add:hover { background: #f9fafb; border-color: #0f1f35; }
		.imogi-promo-reward-empty { color: #6b7280; font-size: 11px; line-height: 1.4; padding: 2px 0; }

		/* ── Outlet cards ── */
		.imogi-promo-outlet-cards { display: flex; flex-direction: column; gap: 6px; margin: 2px 0 6px; }
		.imogi-promo-outlet-card {
			align-items: end;
			background: #f9fafb;
			border: 1px solid #e5e7eb;
			border-radius: 4px;
			display: grid;
			gap: 8px;
			grid-template-columns: minmax(0, 1fr) 32px;
			padding: 8px 10px;
		}
		.imogi-promo-outlet-card-col label {
			color: #6b7280;
			display: block;
			font-size: 10px;
			font-weight: 600;
			line-height: 1.2;
			margin-bottom: 4px;
		}
		.imogi-promo-outlet-card-branch-host .frappe-control,
		.imogi-promo-outlet-card-branch-host .form-group { margin-bottom: 0 !important; }
		.imogi-promo-outlet-card-branch-host .control-label { display: none !important; }
		.imogi-promo-outlet-card-branch-host input.form-control { min-height: 32px; }
		.imogi-promo-outlet-card-remove {
			align-items: center;
			align-self: end;
			background: #fff;
			border: 1px solid #d1d5db;
			border-radius: 4px;
			color: #6b7280;
			cursor: pointer;
			display: inline-flex;
			height: 32px;
			justify-content: center;
			width: 32px;
		}
		.imogi-promo-outlet-card-remove:hover { border-color: #dc2626; color: #dc2626; }
		.imogi-promo-outlet-add {
			align-items: center;
			background: #fff;
			border: 1px dashed #d1d5db;
			border-radius: 4px;
			color: #374151;
			cursor: pointer;
			display: inline-flex;
			font-size: 12px;
			font-weight: 600;
			gap: 5px;
			padding: 6px 10px;
		}
		.imogi-promo-outlet-add:hover { background: #f9fafb; border-color: #0f1f35; }
		.imogi-promo-outlet-empty { color: #6b7280; font-size: 11px; line-height: 1.4; padding: 2px 0; }

		/* ── Aside / cart mock ── */
		.imogi-promo-aside {
			background: #f8f9fb;
			border-left: 1px solid #e2e6ec;
			min-width: 0;
		}
		.imogi-promo-aside-inner {
			padding: 14px 12px;
			position: sticky;
			top: 8px;
		}
		.imogi-promo-aside-label {
			color: #6b7280;
			font-size: 10px;
			font-weight: 700;
			letter-spacing: .08em;
			margin-bottom: 8px;
			text-transform: uppercase;
		}
		.imogi-promo-cart-mock {
			background: #fff;
			border: 1px solid #e2e6ec;
			border-radius: 6px;
			font-size: 12px;
			margin-bottom: 10px;
			overflow: hidden;
		}
		.imogi-promo-cart-mock-head {
			background: #0f1f35;
			color: #fff;
			font-size: 11px;
			font-weight: 700;
			padding: 8px 10px;
		}
		.imogi-promo-cart-mock-body { padding: 8px 10px 10px; }
		.imogi-promo-cart-line {
			align-items: center;
			border-bottom: 1px dashed #e5e7eb;
			display: grid;
			gap: 4px 6px;
			grid-template-columns: minmax(0, 1fr) auto auto;
			padding: 5px 0;
		}
		.imogi-promo-cart-line-meta {
			align-items: center;
			display: flex;
			flex-shrink: 0;
			gap: 5px;
		}
		.imogi-promo-cart-line-price {
			color: #374151;
			font-size: 11px;
			font-weight: 600;
			white-space: nowrap;
		}
		.imogi-promo-cart-line-price.is-free {
			color: #9ca3af;
			font-weight: 500;
			text-decoration: line-through;
		}
		.imogi-promo-cart-line-price.is-save { color: #16a34a; font-weight: 700; }
		.imogi-promo-cart-line:last-child { border-bottom: none; }
		.imogi-promo-cart-line-name { color: #1f2937; flex: 1; min-width: 0; }
		.imogi-promo-cart-line-qty { color: #6b7280; flex-shrink: 0; font-size: 11px; }
		.imogi-promo-cart-line-tag {
			background: #dcfce7;
			border-radius: 3px;
			color: #166534;
			flex-shrink: 0;
			font-size: 9px;
			font-weight: 700;
			padding: 2px 5px;
		}
		.imogi-promo-cart-line-tag.is-discount { background: #fef3c7; color: #92400e; }
		.imogi-promo-cart-total {
			border-top: 1px solid #e5e7eb;
			color: #374151;
			font-size: 11px;
			font-weight: 600;
			margin-top: 6px;
			padding-top: 6px;
		}
		.imogi-promo-cart-summary { border-top: 1px solid #e5e7eb; margin-top: 6px; padding-top: 6px; }
		.imogi-promo-cart-summary-row {
			color: #4b5563;
			display: flex;
			font-size: 11px;
			justify-content: space-between;
			padding: 2px 0;
		}
		.imogi-promo-cart-summary-row.is-save { color: #16a34a; font-weight: 600; }
		.imogi-promo-cart-summary-row.is-total {
			border-top: 1px dashed #e5e7eb;
			color: #0f1f35;
			font-size: 12px;
			font-weight: 700;
			margin-top: 4px;
			padding-top: 6px;
		}
		.imogi-promo-cart-placeholder {
			color: #9ca3af;
			font-size: 11px;
			font-style: italic;
			line-height: 1.45;
			padding: 4px 0;
		}
		.imogi-promo-readiness {
			background: #fff;
			border: 1px solid #e2e6ec;
			border-radius: 6px;
			color: #6b7280;
			font-size: 11px;
			padding: 9px 10px;
		}
		.imogi-promo-readiness.is-ready { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
		.imogi-promo-readiness.is-warn { background: #fffbeb; border-color: #fde68a; color: #92400e; }
		.imogi-promo-save-host { margin-top: 8px; }
		.imogi-promo-save-btn {
			font-size: 13px;
			font-weight: 600;
			padding: 9px 12px;
			width: 100%;
		}
		.imogi-promo-save-btn:disabled { cursor: not-allowed; opacity: 0.55; }

		.imogi-promo-step-flash {
			animation: imogi-promo-flash .9s ease;
		}
		@keyframes imogi-promo-flash {
			0%, 100% { box-shadow: none; }
			35% { box-shadow: 0 0 0 3px rgba(15,31,53,.14); }
		}
		.imogi-promo-rr-block.imogi-promo-step-flash,
		.imogi-promo-rule-page .form-section.imogi-promo-step-flash {
			border-radius: 6px;
		}

		@media (max-width: 960px) {
			.imogi-promo-body { grid-template-columns: 1fr; }
			.imogi-promo-aside { border-left: none; border-top: 1px solid #e2e6ec; }
			.imogi-promo-aside-inner { position: static; }
			.imogi-promo-type-row {
				grid-template-columns: 1fr;
				height: auto;
				max-height: none;
				min-height: 0;
			}
			.imogi-promo-type-cards {
				grid-auto-rows: 68px;
				height: auto;
			}
			.imogi-promo-type-example-wrap {
				height: auto;
				max-height: none;
				min-height: 68px;
			}
			.imogi-promo-discount-panel-body {
				grid-template-columns: 1fr;
			}
			.imogi-promo-discount-block {
				max-width: none;
			}
			.imogi-promo-rr-grid { grid-template-columns: 1fr; }
			.imogi-promo-rr-col + .imogi-promo-rr-col {
				border-left: none;
				border-top: 1px solid #e2e6ec;
			}
		}
		`,
		"imogi-promo-rule-css-v17"
	);
}

function init_promo_rule_page(frm) {
	frm.$wrapper.addClass("imogi-promo-rule-page");
	hide_form_sidebar(frm);
	cleanup_legacy_layout(frm);
	layout_promo_workspace(frm);
	frm.fields_dict.rule_type?.$wrapper?.hide();
	mount_type_cards(frm);
	mount_rules_rewards_panel(frm);
	mount_section_helpers(frm);
	mount_promo_tabs(frm);
	layout_promo_fields(frm);
	toggle_promo_rule_sections(frm);
	style_promo_name_field(frm);
}

function layout_promo_workspace(frm) {
	upgrade_legacy_shell(frm);
	if (frm.$wrapper.find(".imogi-promo-v11").length) return;

	const $layout = frm.$wrapper.find(".form-layout").first();
	if (!$layout.length) return;

	const $anchor = $layout.parent();
	if (!$anchor.length) return;

	$layout.detach();
	const $workspace = $(`
		<div class="imogi-promo-workspace imogi-promo-v11" data-ui="v11">
			<div class="imogi-promo-tabbar imogi-promo-tabbar-host"></div>
			<div class="imogi-promo-body">
				<div class="imogi-promo-main"></div>
				<aside class="imogi-promo-aside">
					<div class="imogi-promo-aside-inner">
						<div class="imogi-promo-aside-label">${__("Simulasi Kasir")}</div>
						<div class="imogi-promo-cart-mock-host"></div>
						<div class="imogi-promo-readiness-host"></div>
						<div class="imogi-promo-save-host"></div>
					</div>
				</aside>
			</div>
		</div>
	`);
	$workspace.find(".imogi-promo-main").append($layout);
	$anchor.append($workspace);
}

function upgrade_legacy_shell(frm) {
	frm.$wrapper.find(".imogi-promo-v8, .imogi-promo-v10").each(function () {
		const $ws = $(this);
		$ws.removeClass("imogi-promo-v8 imogi-promo-v10").addClass("imogi-promo-v11").attr("data-ui", "v11");
		$ws.find(".imogi-promo-stepper-host, .imogi-promo-obj-header-host").remove();
		const $body = $ws.children(".imogi-promo-main, .imogi-promo-aside").parent();
		if (!$body.hasClass("imogi-promo-body")) {
			$ws.find(".imogi-promo-main, .imogi-promo-aside").wrapAll('<div class="imogi-promo-body"></div>');
		}
		const $aside = $ws.find(".imogi-promo-aside-inner");
		$aside.find(".imogi-promo-flow-card, .imogi-promo-type-picker, .imogi-promo-aside-status-host, .imogi-promo-aside-divider").remove();
		if (!$aside.find(".imogi-promo-cart-mock-host").length) {
			$aside.html(`
				<div class="imogi-promo-aside-label">${__("Simulasi Kasir")}</div>
				<div class="imogi-promo-cart-mock-host"></div>
				<div class="imogi-promo-readiness-host"></div>
				<div class="imogi-promo-save-host"></div>
			`);
		} else if (!$aside.find(".imogi-promo-save-host").length) {
			$aside.find(".imogi-promo-readiness-host").after('<div class="imogi-promo-save-host"></div>');
		}
	});
}

function cleanup_legacy_layout(frm) {
	frm.$wrapper.find(".imogi-promo-v7, .imogi-promo-v6, .imogi-promo-shell, .imogi-promo-shell-lite").remove();
}

function hide_form_sidebar(frm) {
	const $page = frm.page?.wrapper || frm.$wrapper.closest(".page-content");
	$page?.find(".layout-side-section, .form-sidebar").hide();
	frm.$wrapper.closest(".row").find(".layout-side-section").hide();
}

function ensure_tab_panes(frm) {
	const $main = frm.$wrapper.find(".imogi-promo-main");
	if ($main.find(".imogi-promo-tab-pane-detail").length) {
		ensure_reward_tab_pane(frm);
		return;
	}

	const $layout = $main.children(".form-layout").first();
	if (!$layout.length) return;

	const $detailPane = $('<div class="imogi-promo-tab-pane imogi-promo-tab-pane-detail"></div>');
	const $rewardPane = build_reward_tab_pane();
	const $outletPane = build_outlet_tab_pane();
	$layout.detach();
	$detailPane.append($layout);
	$main.empty().append($detailPane).append($rewardPane).append($outletPane);
	attach_reward_section_to_tab(frm);
}

function build_reward_tab_pane() {
	return $(`
		<div class="imogi-promo-tab-pane imogi-promo-tab-pane-reward" style="display:none">
			<div class="imogi-promo-flat-section-head">${__("Reward")}</div>
			<div class="imogi-promo-reward-tab-mount"></div>
			<div class="imogi-promo-reward-frappe-host imogi-promo-rr-frappe-host"></div>
		</div>
	`);
}

function build_outlet_tab_pane() {
	return $(`
		<div class="imogi-promo-tab-pane imogi-promo-tab-pane-outlet" style="display:none">
			<div class="imogi-promo-flat-section-head">${__("Outlet")}</div>
			<div class="imogi-promo-outlet-hint">${__(
				"Kosongkan untuk berlaku di semua outlet. Tambah outlet jika promo hanya untuk cabang tertentu."
			)}</div>
			<div class="imogi-promo-outlet-mount"></div>
		</div>
	`);
}

function ensure_reward_tab_pane(frm) {
	const $main = frm.$wrapper.find(".imogi-promo-main");
	if ($main.find(".imogi-promo-tab-pane-reward").length) {
		attach_reward_section_to_tab(frm);
		return;
	}
	const $rewardPane = build_reward_tab_pane();
	const $outlet = $main.find(".imogi-promo-tab-pane-outlet").first();
	if ($outlet.length) {
		$outlet.before($rewardPane);
	} else {
		$main.append($rewardPane);
	}
	attach_reward_section_to_tab(frm);
}

function attach_reward_section_to_tab(frm) {
	const $reward = section_wrapper(frm, "reward_section");
	const $host = frm.$wrapper.find(".imogi-promo-reward-frappe-host").first();
	if ($reward.length && $host.length && !$host.find('[data-fieldname="reward_section"]').length) {
		$host.append($reward);
	}
}

function mount_promo_tabs(frm) {
	const $ws = frm.$wrapper.find(".imogi-promo-v11");
	if (!$ws.length) return;

	ensure_tab_panes(frm);
	section_wrapper(frm, "outlet_section")?.hide();
	frm.fields_dict.outlets?.$wrapper?.hide();
	$ws.find(".imogi-promo-stepper-host, .imogi-promo-obj-header-host").remove();

	let $tabbar = $ws.find(".imogi-promo-tabbar-host");
	if (!$tabbar.length) {
		const $orphanTabs = $ws.children(".imogi-promo-tabs").first();
		$tabbar = $('<div class="imogi-promo-tabbar imogi-promo-tabbar-host"></div>');
		const $body = $ws.find(".imogi-promo-body").first();
		if ($body.length) {
			$body.before($tabbar);
		} else {
			$ws.prepend($tabbar);
		}
		if ($orphanTabs.length) {
			$orphanTabs.appendTo($tabbar);
		}
	}

	if (!$tabbar.find(".imogi-promo-tabs").length) {
		$tabbar.prepend(`
			<div class="imogi-promo-tabs">
				<button type="button" class="imogi-promo-tab is-active" data-tab="detail">${__("Detail")}</button>
				<button type="button" class="imogi-promo-tab" data-tab="reward">${__("Reward")}</button>
				<button type="button" class="imogi-promo-tab" data-tab="outlet">${__("Outlet")}</button>
			</div>
		`);
	} else if (!$tabbar.find('.imogi-promo-tab[data-tab="reward"]').length) {
		$tabbar.find('.imogi-promo-tab[data-tab="detail"]').after(
			`<button type="button" class="imogi-promo-tab" data-tab="reward">${__("Reward")}</button>`
		);
	}
	if (!$tabbar.find(".imogi-promo-obj-chips-host").length) {
		$tabbar.append('<div class="imogi-promo-tabbar-chips imogi-promo-obj-chips-host"></div>');
	}

	const $tabs = $tabbar.find(".imogi-promo-tabs");
	$tabs.find(".imogi-promo-tab").off("click.imogi-promo-tab").on("click.imogi-promo-tab", function () {
		set_promo_tab(frm, $(this).data("tab"));
	});
	$tabs.data("bound", true);

	set_promo_tab(frm, frm._imogi_promo_tab || "detail", false);
	render_form_header(frm);
}

function set_promo_tab(frm, tab, rerender = true) {
	frm._imogi_promo_tab = tab || "detail";
	const $ws = frm.$wrapper.find(".imogi-promo-v11");
	$ws.find(".imogi-promo-tab").removeClass("is-active");
	$ws.find(`.imogi-promo-tab[data-tab="${frm._imogi_promo_tab}"]`).addClass("is-active");
	$ws.find(".imogi-promo-tab-pane-detail").toggle(frm._imogi_promo_tab === "detail");
	$ws.find(".imogi-promo-tab-pane-reward").toggle(frm._imogi_promo_tab === "reward");
	$ws.find(".imogi-promo-tab-pane-outlet").toggle(frm._imogi_promo_tab === "outlet");
	$ws.find(".imogi-promo-aside").toggle(frm._imogi_promo_tab === "detail" || frm._imogi_promo_tab === "reward");
	collapse_empty_columns(frm);
	if (frm._imogi_promo_tab === "detail") {
		layout_promo_fields(frm);
	}
	if (rerender && frm._imogi_promo_tab === "reward") {
		_reward_cards_key = "";
		render_rewards_column(frm);
	}
	if (rerender && frm._imogi_promo_tab === "outlet") {
		_outlet_cards_key = "";
		render_outlet_cards(frm, $ws.find(".imogi-promo-outlet-mount"));
	}
}

function mount_type_cards(frm) {
	const $section = section_wrapper(frm, "type_section");
	if (!$section.length) return;

	const $body = $section.find(".section-body").first();
	if ($body.find(".imogi-promo-type-row").length) return;

	const $old_cards = $body.children(".imogi-promo-type-cards").first();
	const $old_example = $body.children(".imogi-promo-type-example-wrap").first();

	const $row = $(`
		<div class="imogi-promo-type-row">
			<div class="imogi-promo-type-cards"></div>
			<div class="imogi-promo-type-example-wrap">
				<div class="imogi-promo-type-example-label">${__("Contoh")}</div>
				<span class="imogi-promo-type-example-host"></span>
			</div>
		</div>
	`);

	if ($old_cards.length) {
		$old_cards.detach().appendTo($row.find(".imogi-promo-type-cards"));
		if ($old_example.length) {
			$old_example.find(".imogi-promo-type-example-host").appendTo($row.find(".imogi-promo-type-example-wrap"));
			$old_example.remove();
		}
	}

	$body.prepend($row);
}

function mount_rules_rewards_panel(frm) {
	ensure_reward_tab_pane(frm);

	const $cond = section_wrapper(frm, "condition_section");
	if (!$cond.length) return;

	const $type = section_wrapper(frm, "type_section");
	let $block = frm.$wrapper.find(".imogi-promo-rr-block").first();

	if ($block.length && $block.find(".imogi-promo-rr-col-rewards").length) {
		attach_reward_section_to_tab(frm);
		$block.remove();
		$block = $();
	}

	if (!$block.length) {
		$block = $(`
			<div class="imogi-promo-rr-block">
				<div class="imogi-promo-rr-head">${__("Syarat Trigger")}</div>
				<div class="imogi-promo-rr-rules-host"></div>
			</div>
		`);
		$block.find(".imogi-promo-rr-rules-host").append($cond);
	} else if (!$block.find(".imogi-promo-rr-rules-host .form-section").length) {
		$block.find(".imogi-promo-rr-rules-host").append($cond);
	}

	if ($block.find(".imogi-promo-rr-head").text().indexOf("Reward") >= 0) {
		$block.find(".imogi-promo-rr-head").text(__("Syarat Trigger"));
	}

	if ($type.length) {
		$type.after($block);
	} else {
		section_wrapper(frm, "identity_section").after($block);
	}
}

function layout_promo_fields(frm) {
	frm.toggle_display("is_active", false);
	frm.toggle_display("remarks", false);
	frm.fields_dict.is_active?.$wrapper?.hide();
	frm.fields_dict.remarks?.$wrapper?.hide();
	ensure_promo_name_visible(frm);
	frm.fields_dict.company?.$wrapper?.show();
	frm.fields_dict.valid_from?.$wrapper?.show();
	frm.fields_dict.valid_upto?.$wrapper?.show();
	reorder_promo_sections(frm);
}

function ensure_promo_name_visible(frm) {
	const field = frm.fields_dict.promo_name;
	if (!field) return;
	// Frappe menyembunyikan field autoname setelah dokumen tersimpan — paksa tetap tampil.
	frm.toggle_display("promo_name", true);
	if (field.df) {
		field.df.hidden = 0;
	}
	if (!frm.is_new()) {
		frm.set_df_property("promo_name", "read_only", 1);
	} else {
		frm.set_df_property("promo_name", "read_only", 0);
	}
	field.$wrapper?.show();
	field.$wrapper?.closest(".form-column")?.removeClass("is-imogi-empty").show();
}

function reorder_promo_sections(frm) {
	const $pane = frm.$wrapper.find(".imogi-promo-tab-pane-detail");
	const $layout = $pane.find(".form-layout").first();
	if (!$layout.length) return;

	const $identity = section_wrapper(frm, "identity_section");
	const $type = section_wrapper(frm, "type_section");
	const $block = frm.$wrapper.find(".imogi-promo-rr-block").first();
	const $validity = section_wrapper(frm, "validity_section");
	const ordered = [$identity, $type, $block, $validity].filter(($el) => $el?.length);
	if (!ordered.length) return;

	const current = $layout.children(".form-section, .imogi-promo-rr-block").toArray();
	const expected = ordered.map(($el) => $el[0]);
	if (
		current.length === expected.length &&
		current.every((el, idx) => el === expected[idx])
	) {
		return;
	}

	ordered.forEach(($el) => $layout.append($el));
}

function ensure_rr_rewards_mount(frm) {
	const $mount = frm.$wrapper.find(".imogi-promo-reward-tab-mount");
	if (!$mount.length) ensure_reward_tab_pane(frm);
}

function mount_section_helpers(frm) {
	const $block = frm.$wrapper.find(".imogi-promo-rr-block").first();
	if ($block.length && !$block.find(".imogi-promo-inline-hint").length) {
		$block.find(".imogi-promo-rr-head").after(
			`<div class="imogi-promo-inline-hint">${__(
				"Item tertentu atau grup kategori — pilih salah satu."
			)}</div>`
		);
	}
}

function section_wrapper(frm, fieldname) {
	return frm.$wrapper.find(`.form-section[data-fieldname="${fieldname}"]`);
}

function collapse_empty_columns(frm) {
	const active_tab = frm._imogi_promo_tab || "detail";
	const $active_pane = frm.$wrapper.find(`.imogi-promo-tab-pane-${active_tab}`).first();
	const $scope = $active_pane.length ? $active_pane : frm.$wrapper.find(".imogi-promo-tab-pane-detail");

	frm.$wrapper.find(".imogi-promo-tab-pane").not($scope).find(".form-column").removeClass("is-imogi-empty");

	$scope.find(".form-column").each(function () {
		const $col = $(this);
		if ($col.find('[data-fieldname="promo_name"], [data-fieldname="company"]').length) {
			$col.removeClass("is-imogi-empty");
			return;
		}
		const has_visible = $col.find(".frappe-control:visible, .imogi-promo-type-cards:visible").length > 0;
		$col.toggleClass("is-imogi-empty", !has_visible);
	});
}

function rewards_mount(frm) {
	let $mount = frm.$wrapper.find(".imogi-promo-reward-tab-mount").first();
	if (!$mount.length) {
		ensure_reward_tab_pane(frm);
		$mount = frm.$wrapper.find(".imogi-promo-reward-tab-mount").first();
	}
	if (!$mount.length) {
		$mount = $('<div class="imogi-promo-reward-tab-mount"></div>');
		frm.$wrapper.find(".imogi-promo-tab-pane-reward").prepend($mount);
	}
	return $mount;
}

function toggle_promo_rule_sections(frm) {
	const rule_type = frm.doc.rule_type || get_promo_types()[0]?.value;

	frm.fields_dict.reward_items?.$wrapper?.hide();
	frm.fields_dict.reward_value?.$wrapper?.hide();

	frm.toggle_display("reward_value", is_discount_rule_type(rule_type));
	frm.toggle_reqd("reward_items", rule_type === "Buy X Get Other Free");
	frm.toggle_reqd("reward_value", is_discount_rule_type(rule_type));

	collapse_empty_columns(frm);
}

function render_rewards_column(frm) {
	const rule_type = frm.doc.rule_type || get_promo_types()[0]?.value;
	const $mount = rewards_mount(frm);
	$mount.empty();

	if (rule_type === "Buy X Get Y Free") {
		frm.$wrapper.find(".imogi-promo-reward-frappe-host").hide();
		$mount.html(
			`<div class="imogi-promo-reward-tab-hint">${__(
				"Beli X item trigger → dapat 1 item trigger gratis. X mengikuti Qty Beli di tab Detail."
			)}</div>
			<div class="imogi-promo-auto-reward"><i class="fa fa-check-circle"></i>${__(
				"Tidak perlu mengisi item reward — item gratis sama dengan item trigger."
			)}</div>`
		);
		render_reward_cards(frm, null);
		return;
	}

	if (is_discount_rule_type(rule_type)) {
		const is_percent = rule_type === "Qty Discount Percent";
		const $panel = $(`
			<div class="imogi-promo-discount-block">
				<div class="imogi-promo-reward-tab-hint">${__(
					"Diskon otomatis diterapkan di kasir saat syarat trigger terpenuhi."
				)}</div>
				<div class="imogi-promo-discount-panel-body">
					<div class="imogi-promo-discount-field">
						<label class="imogi-promo-discount-field-label">${__("Jenis diskon")}</label>
						<div class="imogi-promo-discount-mode" role="group" aria-label="${__("Jenis diskon")}">
							<button type="button" class="imogi-promo-discount-mode-btn ${
								is_percent ? "is-active" : ""
							}" data-rule-type="Qty Discount Percent">
								<span>%</span>
								<small>${__("Persen")}</small>
							</button>
							<button type="button" class="imogi-promo-discount-mode-btn ${
								!is_percent ? "is-active" : ""
							}" data-rule-type="Qty Discount Amount">
								<span>Rp</span>
								<small>${__("Nominal")}</small>
							</button>
						</div>
					</div>
					<div class="imogi-promo-discount-field imogi-promo-discount-value-field ${
						is_percent ? "is-percent" : "is-amount"
					}">
						<label class="imogi-promo-discount-field-label">${
							is_percent ? __("Diskon (%)") : __("Diskon (Rp)")
						}</label>
						<div class="imogi-promo-discount-value-host"></div>
					</div>
				</div>
			</div>
		`);
		$mount.append($panel);
		$panel.find(".imogi-promo-discount-mode-btn").on("click", function () {
			const value = $(this).data("rule-type");
			if (!value || value === frm.doc.rule_type) return;
			frm.set_value("rule_type", value);
		});

		const $field = frm.fields_dict.reward_value?.$wrapper;
		if ($field?.length) {
			$field
				.detach()
				.appendTo($panel.find(".imogi-promo-discount-value-host"))
				.show()
				.addClass("imogi-promo-discount-value-control");
			const $input = $field.find("input");
			if ($input.length) {
				$input.attr(
					"placeholder",
					is_percent ? __("mis. 10") : __("mis. 5000")
				);
			}
		} else {
			$mount.append(`<div class="imogi-promo-reward-empty">${__("Field diskon tidak tersedia.")}</div>`);
		}
		frm.$wrapper.find(".imogi-promo-reward-frappe-host").hide();
		render_reward_cards(frm, null);
		return;
	}

	frm.$wrapper.find(".imogi-promo-reward-frappe-host").toggle(rule_type === "Buy X Get Other Free");

	if (rule_type === "Buy X Get Other Free") {
		render_reward_cards(frm, $mount);
	}
}

function refresh_promo_rule_ui(frm) {
	if (!frm?.$wrapper) return;
	frm.$wrapper.addClass("imogi-promo-rule-page");
	hide_form_sidebar(frm);
	layout_promo_workspace(frm);
	upgrade_legacy_shell(frm);
	mount_type_cards(frm);
	mount_rules_rewards_panel(frm);
	ensure_rr_rewards_mount(frm);
	mount_promo_tabs(frm);
	layout_promo_fields(frm);
	render_form_header(frm);
	render_type_cards(frm);
	render_cart_preview(frm);
	toggle_promo_rule_sections(frm);
	render_rewards_column(frm);
	render_readiness(frm);
	render_save_action(frm);
	if ((frm._imogi_promo_tab || "detail") === "outlet") {
		render_outlet_cards(frm, frm.$wrapper.find(".imogi-promo-outlet-mount"));
	}
	if ((frm._imogi_promo_tab || "detail") === "reward") {
		render_rewards_column(frm);
	}
	style_promo_name_field(frm);
	if ((frm._imogi_promo_tab || "detail") === "detail") {
		collapse_empty_columns(frm);
	}
}

function render_form_header(frm) {
	const $host = frm.$wrapper.find(".imogi-promo-obj-chips-host");
	if (!$host.length) return;

	const doc = frm.doc;
	const type = get_promo_type(doc.rule_type);
	const status = get_unified_status(doc);

	$host.html(`
		<span class="imogi-promo-chip is-type">${frappe.utils.escape_html(type.label)}</span>
		<span class="imogi-promo-chip is-${status.key}">${status.label}</span>
	`);
}

function render_stepper() {
	/* stepper dihapus — tabbar menggantikan navigasi langkah */
}

function scroll_to_promo_step(frm, step_key) {
	const step = PROMO_STEPS.find((row) => row.key === step_key);
	if (!step) return;

	let $target;
	if (step.key === "rules") {
		$target = frm.$wrapper.find(".imogi-promo-rr-block").first();
	} else {
		$target = section_wrapper(frm, step.section);
	}
	if (!$target.length) return;

	const top = $target.offset().top - 72;
	$("html, body").animate({ scrollTop: Math.max(0, top) }, 280);

	$target.addClass("imogi-promo-step-flash");
	setTimeout(() => $target.removeClass("imogi-promo-step-flash"), 900);
}

function get_step_progress(doc) {
	const rule_type = doc.rule_type || get_promo_types()[0]?.value;
	const has_type = !!rule_type;
	const has_identity = !!(doc.promo_name || "").trim() && !!doc.company;
	const has_rules = !!(doc.trigger_item_code || doc.trigger_item_group) && cint(doc.min_qty) > 0;
	let has_reward = true;
	if (rule_type === "Buy X Get Other Free") {
		has_reward = (doc.reward_items || []).some((r) => r.item_code);
	} else if (is_discount_rule_type(rule_type)) {
		has_reward = flt(doc.reward_value) > 0;
	}
	const has_validity = true;

	const progress = {};
	if (!has_type) {
		progress.type = "active";
		return progress;
	}
	progress.type = "done";

	if (!has_identity) {
		progress.identity = "active";
		return progress;
	}
	progress.identity = "done";

	if (!has_rules || !has_reward) {
		progress.rules = "active";
		return progress;
	}
	progress.rules = "done";

	progress.validity = has_validity ? "active" : "active";
	return progress;
}

function build_type_example(frm) {
	const doc = frm.doc || {};
	const min_qty = cint(doc.min_qty || 2);
	const rule_type = doc.rule_type || get_promo_types()[0]?.value;
	const item = doc.trigger_item_code || __("item trigger");

	if (rule_type === "Buy X Get Y Free") {
		return __("Beli {0} {1} → dapat 1 {1} gratis", [min_qty, item]);
	}
	if (rule_type === "Buy X Get Other Free") {
		const reward = (doc.reward_items || []).find((r) => r.item_code);
		const reward_name = reward?.item_code || __("item reward");
		return __("Beli {0} {1} → dapat 1 {2} gratis", [min_qty, item, reward_name]);
	}
	if (is_discount_rule_type(rule_type)) {
		return __("Beli min. {0} {1} → diskon aktif", [min_qty, item]);
	}
	return get_promo_type(rule_type).example || "";
}

function update_type_example(frm, $example) {
	const $host = $example || frm.$wrapper.find(".imogi-promo-type-example-host");
	if (!$host.length) return;
	$host.text(build_type_example(frm));
}

function render_type_cards(frm) {
	const $host = frm.$wrapper.find(".imogi-promo-type-cards");
	const $example = frm.$wrapper.find(".imogi-promo-type-example-host");
	if (!$host.length) return;

	const current = frm.doc.rule_type || get_promo_types()[0]?.value;

	$host.html(
		get_promo_types()
			.map((opt) => {
				const selected = is_type_card_selected(opt, current) ? "is-selected" : "";
				const rule_value = opt.is_discount ? "Qty Discount Percent" : opt.value;
				return `<button type="button" class="imogi-promo-type-card ${selected}" data-rule-type="${frappe.utils.escape_html(
					rule_value
				)}" ${opt.is_discount ? 'data-is-discount="1"' : ""}>
					<span class="imogi-promo-type-card-icon"><i class="fa ${opt.icon}"></i></span>
					<span class="imogi-promo-type-card-copy">
						<span class="imogi-promo-type-card-title">${opt.label}</span>
						<span class="imogi-promo-type-card-desc">${opt.desc}</span>
					</span>
				</button>`;
			})
			.join("")
	);

	update_type_example(frm, $example);

	$host.find(".imogi-promo-type-card").off("click").on("click", function () {
		const value = $(this).data("rule-type");
		const is_discount = $(this).data("is-discount");
		if (is_discount && is_discount_rule_type(frm.doc.rule_type)) return;
		if (!value || value === frm.doc.rule_type) return;
		_reward_cards_key = "";
		frm.set_value("rule_type", value);
	});
}

function render_cart_preview(frm) {
	const $host = frm.$wrapper.find(".imogi-promo-cart-mock-host");
	if (!$host.length) return;

	const seq = ++_cart_preview_seq;
	const doc = frm.doc;
	const min_qty = cint(doc.min_qty || 1);
	const trigger = doc.trigger_item_code || doc.trigger_item_group;
	const rule_type = doc.rule_type || get_promo_types()[0]?.value;

	if (!trigger) {
		$host.html(cart_mock_shell(__("Isi syarat trigger untuk melihat simulasi promo di kasir."), ""));
		return;
	}

	const use_prices = !!doc.trigger_item_code;
	if (!use_prices) {
		const body = build_cart_lines_text(doc, rule_type, min_qty, trigger);
		$host.html(
			cart_mock_shell(
				body +
					`<div class="imogi-promo-cart-placeholder" style="margin-top:6px">${__(
						"Harga simulasi tersedia jika trigger berupa item tertentu."
					)}</div>`,
				""
			)
		);
		return;
	}

	$host.html(cart_mock_shell(`<div class="imogi-promo-cart-placeholder">${__("Menghitung…")}</div>`, ""));

	const item_codes = collect_cart_item_codes(doc, rule_type, trigger);
	fetch_item_rates(item_codes, (rates) => {
		if (seq !== _cart_preview_seq) return;
		const body = build_cart_lines_html(doc, rule_type, min_qty, trigger, rates);
		const summary = build_cart_summary_html(doc, rule_type, min_qty, trigger, rates);
		$host.html(cart_mock_shell(body, summary));
	});
}

function cart_mock_shell(body_html, summary_html) {
	return `
		<div class="imogi-promo-cart-mock">
			<div class="imogi-promo-cart-mock-head">${__("Keranjang")}</div>
			<div class="imogi-promo-cart-mock-body">${body_html}${summary_html}</div>
		</div>
	`;
}

function collect_cart_item_codes(doc, rule_type, trigger) {
	const codes = new Set();
	if (doc.trigger_item_code) codes.add(doc.trigger_item_code);
	if (rule_type === "Buy X Get Y Free" && doc.trigger_item_code) {
		codes.add(doc.trigger_item_code);
	}
	if (rule_type === "Buy X Get Other Free") {
		(doc.reward_items || []).forEach((row) => {
			if (row.item_code) codes.add(row.item_code);
		});
	}
	return [...codes];
}

function fetch_item_rates(item_codes, callback) {
	const missing = item_codes.filter((code) => !_item_rate_cache.has(code));
	if (!missing.length) {
		const rates = {};
		item_codes.forEach((code) => {
			rates[code] = _item_rate_cache.get(code) || 0;
		});
		callback(rates);
		return;
	}

	frappe.call({
		method: "frappe.client.get_list",
		args: {
			doctype: "Item",
			fields: ["name", "standard_rate"],
			filters: [["name", "in", missing]],
			limit_page_length: 100,
		},
		callback(r) {
			(r.message || []).forEach((row) => {
				_item_rate_cache.set(row.name, flt(row.standard_rate));
			});
			missing.forEach((code) => {
				if (!_item_rate_cache.has(code)) _item_rate_cache.set(code, 0);
			});
			const rates = {};
			item_codes.forEach((code) => {
				rates[code] = _item_rate_cache.get(code) || 0;
			});
			callback(rates);
		},
	});
}

function build_cart_lines_text(doc, rule_type, min_qty, trigger) {
	const t = frappe.utils.escape_html(trigger);
	const lines = [];

	if (rule_type === "Buy X Get Y Free") {
		lines.push(cart_line(t, min_qty, "", null, null, false));
		lines.push(cart_line(t, 1, __("GRATIS"), "free", null, true));
	} else if (rule_type === "Buy X Get Other Free") {
		lines.push(cart_line(t, min_qty, "", null, null, false));
		const rewards = (doc.reward_items || []).filter((r) => r.item_code);
		if (rewards.length) {
			rewards.forEach((r) => {
				lines.push(
					cart_line(frappe.utils.escape_html(r.item_code), flt(r.qty || 1), __("GRATIS"), "free", null, true)
				);
			});
		} else {
			lines.push(`<div class="imogi-promo-cart-placeholder">${__("+ item reward…")}</div>`);
		}
	} else if (is_discount_rule_type(rule_type)) {
		lines.push(cart_line(t, min_qty, "", null, null, false));
		const val = flt(doc.reward_value || 0);
		if (val > 0) {
			const label =
				rule_type === "Qty Discount Amount" ? format_money(val) : `${val}%`;
			lines.push(
				`<div class="imogi-promo-cart-summary-row is-save" style="border:none;padding-top:4px"><span>${__(
					"Diskon"
				)}</span><span>${label}</span></div>`
			);
		}
	}

	return lines.join("");
}

function build_cart_lines_html(doc, rule_type, min_qty, trigger, rates) {
	const t = frappe.utils.escape_html(trigger);
	const lines = [];

	if (rule_type === "Buy X Get Y Free") {
		const rate = rates[doc.trigger_item_code] || 0;
		lines.push(cart_line(t, min_qty, "", null, rate * min_qty, false));
		lines.push(cart_line(t, 1, __("GRATIS"), "free", rate, true));
	} else if (rule_type === "Buy X Get Other Free") {
		const rate = rates[doc.trigger_item_code] || 0;
		lines.push(cart_line(t, min_qty, "", null, rate * min_qty, false));
		const rewards = (doc.reward_items || []).filter((r) => r.item_code);
		if (rewards.length) {
			rewards.forEach((r) => {
				const rr = rates[r.item_code] || 0;
				const qty = flt(r.qty || 1);
				lines.push(
					cart_line(frappe.utils.escape_html(r.item_code), qty, __("GRATIS"), "free", rr * qty, true)
				);
			});
		} else {
			lines.push(`<div class="imogi-promo-cart-placeholder">${__("+ item reward…")}</div>`);
		}
	} else if (is_discount_rule_type(rule_type)) {
		const rate = rates[doc.trigger_item_code] || 0;
		lines.push(cart_line(t, min_qty, "", null, rate * min_qty, false));
	}

	return lines.join("");
}

function build_cart_summary_html(doc, rule_type, min_qty, trigger, rates) {
	if (!doc.trigger_item_code) return "";

	const trigger_rate = rates[doc.trigger_item_code] || 0;
	let subtotal = 0;
	let savings = 0;

	if (rule_type === "Buy X Get Y Free") {
		subtotal = trigger_rate * min_qty + trigger_rate;
		savings = trigger_rate;
	} else if (rule_type === "Buy X Get Other Free") {
		subtotal = trigger_rate * min_qty;
		(doc.reward_items || []).forEach((r) => {
			if (!r.item_code) return;
			const rr = rates[r.item_code] || 0;
			const qty = flt(r.qty || 1);
			subtotal += rr * qty;
			savings += rr * qty;
		});
	} else if (is_discount_rule_type(rule_type)) {
		subtotal = trigger_rate * min_qty;
		const val = flt(doc.reward_value || 0);
		if (rule_type === "Qty Discount Amount") {
			savings = Math.min(val, subtotal);
		} else {
			savings = (subtotal * val) / 100;
		}
	}

	const total = Math.max(0, subtotal - savings);
	const rows = [
		`<div class="imogi-promo-cart-summary-row"><span>${__("Subtotal")}</span><span>${format_money(
			subtotal
		)}</span></div>`,
	];

	if (savings > 0) {
		let save_label = __("Hemat promo");
		if (rule_type === "Qty Discount Percent") {
			save_label = `${__("Diskon")} (${flt(doc.reward_value || 0)}%)`;
		} else if (rule_type === "Qty Discount Amount") {
			save_label = `${__("Diskon")} (${format_money(flt(doc.reward_value || 0))})`;
		}
		rows.push(
			`<div class="imogi-promo-cart-summary-row is-save"><span>${save_label}</span><span>− ${format_money(
				savings
			)}</span></div>`
		);
	}

	rows.push(
		`<div class="imogi-promo-cart-summary-row is-total"><span>${__("Total bayar")}</span><span>${format_money(
			total
		)}</span></div>`
	);

	return `<div class="imogi-promo-cart-summary">${rows.join("")}</div>`;
}

function format_money(amount) {
	return frappe.format(flt(amount), { fieldtype: "Currency" });
}

function cart_line(name, qty, tag, tag_type, amount, is_free) {
	const tag_cls = tag_type === "discount" ? "is-discount" : "";
	const tag_html = tag ? `<span class="imogi-promo-cart-line-tag ${tag_cls}">${tag}</span>` : "";
	const price_cls = is_free ? "is-free" : "";
	const price_html =
		amount !== undefined && amount !== null
			? `<span class="imogi-promo-cart-line-price ${price_cls}">${format_money(amount)}</span>`
			: "";
	return `<div class="imogi-promo-cart-line">
		<span class="imogi-promo-cart-line-name">${name}</span>
		<span class="imogi-promo-cart-line-meta">
			<span class="imogi-promo-cart-line-qty">×${qty}</span>
			${tag_html}
		</span>
		${price_html}
	</div>`;
}

function format_period_summary(doc) {
	if (!doc.valid_from && !doc.valid_upto) return __("Berlaku tanpa batas");
	const from = doc.valid_from ? frappe.datetime.str_to_user(doc.valid_from) : "…";
	const upto = doc.valid_upto ? frappe.datetime.str_to_user(doc.valid_upto) : "…";
	return `${from} – ${upto}`;
}

function get_unified_status(doc) {
	const today = frappe.datetime.get_today();
	if (!doc.valid_from || !doc.valid_upto) {
		return { key: "scheduled", label: __("Belum berlaku") };
	}
	if (doc.valid_from && today < doc.valid_from) return { key: "scheduled", label: __("Dijadwalkan") };
	if (doc.valid_upto && today > doc.valid_upto) return { key: "expired", label: __("Kadaluarsa") };
	return { key: "live", label: __("Berjalan") };
}

function style_promo_name_field(frm) {
	const field = frm.fields_dict.promo_name;
	if (!field?.$input) return;
	field.$input.attr("placeholder", __("mis. Beli 2 Gratis 1 Latte"));
	if (field.df) field.df.label = __("Nama Promo");
	field.set_label?.(__("Nama Promo"));
}

function render_readiness(frm) {
	const $host = frm.$wrapper.find(".imogi-promo-readiness-host");
	if (!$host.length) return;

	const issues = validate_promo_doc(frm.doc);
	if (!issues.length) {
		$host.html(
			`<div class="imogi-promo-readiness is-ready"><i class="fa fa-check-circle"></i> ${__(
				"Promo siap disimpan"
			)}</div>`
		);
		return;
	}
	$host.html(`<div class="imogi-promo-readiness is-warn"><i class="fa fa-exclamation-circle"></i> ${issues[0]}</div>`);
}

function render_save_action(frm) {
	const $host = frm.$wrapper.find(".imogi-promo-save-host");
	if (!$host.length) return;

	const issues = validate_promo_doc(frm.doc);
	const ready = !issues.length;
	const canSave = ready && (frm.is_dirty() || frm.is_new());
	const label = frm.is_new() ? __("Simpan Promo") : __("Simpan Perubahan");

	if (!$host.data("bound")) {
		$host.html(`<button type="button" class="btn btn-primary imogi-promo-save-btn">${label}</button>`);
		$host.find(".imogi-promo-save-btn").on("click", function () {
			const currentIssues = validate_promo_doc(frm.doc);
			if (currentIssues.length) {
				frappe.msgprint(currentIssues[0]);
				return;
			}
			const $btn = $(this);
			const savingLabel = __("Menyimpan...");
			$btn.prop("disabled", true).text(savingLabel);
			frm
				.save()
				.then(() => {
					frappe.show_alert({ message: __("Promo tersimpan"), indicator: "green" });
					refresh_promo_rule_ui(frm);
				})
				.finally(() => {
					const $saveBtn = $host.find(".imogi-promo-save-btn");
					if ($saveBtn.length) {
						$saveBtn.text(frm.is_new() ? __("Simpan Promo") : __("Simpan Perubahan"));
						render_save_action(frm);
					}
				});
		});
		$host.data("bound", true);
	}

	const $btn = $host.find(".imogi-promo-save-btn");
	$btn.text(label);
	$btn.prop("disabled", !canSave);
	$btn.attr("title", ready ? "" : issues[0]);
}

function validate_promo_doc(doc) {
	const issues = [];
	if (!(doc.promo_name || "").trim()) issues.push(__("Isi nama promo"));
	if (!doc.company) issues.push(__("Pilih company"));
	if (!doc.trigger_item_code && !doc.trigger_item_group) {
		issues.push(__("Isi item trigger atau grup kategori"));
	}
	const rule_type = doc.rule_type || get_promo_types()[0]?.value;
	if (rule_type === "Buy X Get Other Free") {
		const rewards = (doc.reward_items || []).filter((row) => row.item_code);
		if (!rewards.length) issues.push(__("Tambahkan minimal satu item reward"));
	}
	if (rule_type === "Qty Discount Percent" && flt(doc.reward_value) <= 0) {
		issues.push(__("Isi persen diskon"));
	}
	if (rule_type === "Qty Discount Amount" && flt(doc.reward_value) <= 0) {
		issues.push(__("Isi nominal diskon (Rp)"));
	}
	if (doc.valid_from && doc.valid_upto && doc.valid_from > doc.valid_upto) {
		issues.push(__("Tanggal berlaku tidak valid"));
	}
	if (!doc.valid_from || !doc.valid_upto) {
		issues.push(__("Isi masa berlaku promo"));
	}
	return issues;
}

function render_reward_cards(frm, $parent) {
	const rule_type = frm.doc.rule_type || get_promo_types()[0]?.value;
	const $section = section_wrapper(frm, "reward_section");

	if (rule_type !== "Buy X Get Other Free" || !$parent?.length) {
		_reward_cards_key = "";
		$section.find(".imogi-promo-reward-cards-host").remove();
		frm.$wrapper.find(".imogi-promo-reward-tab-mount .imogi-promo-reward-cards-host").remove();
		_reward_item_controls.forEach((ctrl) => ctrl?.destroy?.());
		_reward_item_controls.clear();
		return;
	}

	const items = frm.doc.reward_items || [];
	const key = `${rule_type}:${items.length}`;
	const $existingHost = $parent.find(".imogi-promo-reward-cards-host");
	if (
		key === _reward_cards_key &&
		$existingHost.length &&
		$parent.find(".imogi-promo-reward-card").length === items.length
	) {
		return;
	}
	_reward_cards_key = key;

	_reward_item_controls.forEach((ctrl) => ctrl?.destroy?.());
	_reward_item_controls.clear();

	const $host = $('<div class="imogi-promo-reward-cards-host"></div>');
	$parent.append($host);

	const $cards = $('<div class="imogi-promo-reward-cards"></div>');

	if (!items.length) {
		$host.append(`<div class="imogi-promo-reward-empty">${__(
			"Belum ada item reward. Klik tambah di bawah."
		)}</div>`);
	} else {
		items.forEach((row, idx) => {
			const $card = $(`
				<div class="imogi-promo-reward-card" data-idx="${idx}">
					<div class="imogi-promo-reward-card-col imogi-promo-reward-card-item">
						<label>${__("Item gratis")}</label>
						<div class="imogi-promo-reward-card-item-host"></div>
					</div>
					<div class="imogi-promo-reward-card-col imogi-promo-reward-card-qty">
						<label>${__("Qty")}</label>
						<input type="number" min="1" step="1" class="imogi-promo-reward-qty-input" value="${flt(row.qty || 1)}">
					</div>
					<button type="button" class="imogi-promo-reward-card-remove" title="${__("Hapus")}"><i class="fa fa-trash-o"></i></button>
				</div>
			`);
			$cards.append($card);
			const control = frappe.ui.form.make_control({
				df: {
					fieldtype: "Link",
					options: "Item",
					fieldname: `promo_reward_item_${idx}`,
					label: __("Item gratis"),
				},
				parent: $card.find(".imogi-promo-reward-card-item-host")[0],
				render_input: true,
				only_input: true,
			});
			control.make();
			control.set_value(row.item_code || "");
			control.$input?.on("change awesomplete-selectcomplete", () => {
				frm.doc.reward_items[idx].item_code = control.get_value();
				frm.dirty();
				render_cart_preview(frm);
				render_readiness(frm);
				render_save_action(frm);
				render_form_header(frm);
			});
			_reward_item_controls.set(`${frm.doc.name || "new"}-${idx}`, control);

			$card.find(".imogi-promo-reward-qty-input").on("change", function () {
				frm.doc.reward_items[idx].qty = Math.max(1, flt($(this).val() || 1));
				frm.dirty();
				render_cart_preview(frm);
				render_readiness(frm);
			});
			$card.find(".imogi-promo-reward-card-remove").on("click", () => {
				_reward_cards_key = "";
				frm.doc.reward_items.splice(idx, 1);
				frm.refresh_field("reward_items");
				refresh_promo_rule_ui(frm);
			});
		});
		$host.append($cards);
	}

	const $add = $(`<button type="button" class="imogi-promo-reward-add"><i class="fa fa-plus"></i> ${__(
		"Tambah item reward"
	)}</button>`);
	$add.on("click", () => {
		_reward_cards_key = "";
		frm.add_child("reward_items", { qty: 1 });
		frm.refresh_field("reward_items");
		refresh_promo_rule_ui(frm);
	});
	$host.append($add);
}

function render_outlet_cards(frm, $parent) {
	if (!$parent?.length) return;

	const items = frm.doc.outlets || [];
	const key = `outlets:${items.length}:${frm.doc.company || ""}`;
	const $existingHost = $parent.find(".imogi-promo-outlet-cards-host");
	if (key === _outlet_cards_key && $existingHost.length && $parent.find(".imogi-promo-outlet-card").length === items.length) {
		return;
	}
	_outlet_cards_key = key;

	_outlet_item_controls.forEach((ctrl) => ctrl?.destroy?.());
	_outlet_item_controls.clear();
	$parent.empty();

	const $host = $('<div class="imogi-promo-outlet-cards-host"></div>');
	$parent.append($host);

	const $cards = $('<div class="imogi-promo-outlet-cards"></div>');

	if (!items.length) {
		$host.append(`<div class="imogi-promo-outlet-empty">${__(
			"Belum ada outlet. Klik tambah di bawah atau kosongkan untuk semua outlet."
		)}</div>`);
	} else {
		items.forEach((row, idx) => {
			const $card = $(`
				<div class="imogi-promo-outlet-card" data-idx="${idx}">
					<div class="imogi-promo-outlet-card-col">
						<label>${__("Outlet / Cabang")}</label>
						<div class="imogi-promo-outlet-card-branch-host"></div>
					</div>
					<button type="button" class="imogi-promo-outlet-card-remove" title="${__("Hapus")}"><i class="fa fa-trash-o"></i></button>
				</div>
			`);
			$cards.append($card);

			const control = frappe.ui.form.make_control({
				df: {
					fieldtype: "Link",
					options: "IMOGI Branch",
					fieldname: `promo_outlet_branch_${idx}`,
					label: __("Outlet / Cabang"),
					get_query: () => {
						const filters = { is_active: 1 };
						if (frm.doc.company) filters.company = frm.doc.company;
						return { filters };
					},
				},
				parent: $card.find(".imogi-promo-outlet-card-branch-host")[0],
				render_input: true,
				only_input: true,
			});
			control.make();
			control.set_value(row.branch || "");
			control.$input?.on("change awesomplete-selectcomplete", () => {
				const value = control.get_value();
				frm.doc.outlets[idx].branch = value;
				if (value) {
					frappe.db.get_value("IMOGI Branch", value, ["branch_name", "branch_code"]).then((r) => {
						if (!r?.message) return;
						frm.doc.outlets[idx].branch_name = r.message.branch_name;
						frm.doc.outlets[idx].branch_code = r.message.branch_code;
					});
				}
				frm.dirty();
				render_readiness(frm);
				render_save_action(frm);
			});
			_outlet_item_controls.set(`${frm.doc.name || "new"}-outlet-${idx}`, control);

			$card.find(".imogi-promo-outlet-card-remove").on("click", () => {
				_outlet_cards_key = "";
				frm.doc.outlets.splice(idx, 1);
				frm.refresh_field("outlets");
				render_outlet_cards(frm, $parent);
				frm.dirty();
				render_readiness(frm);
				render_save_action(frm);
			});
		});
		$host.append($cards);
	}

	const $add = $(`<button type="button" class="imogi-promo-outlet-add"><i class="fa fa-plus"></i> ${__(
		"Tambah outlet"
	)}</button>`);
	$add.on("click", () => {
		_outlet_cards_key = "";
		frm.add_child("outlets", {});
		frm.refresh_field("outlets");
		render_outlet_cards(frm, $parent);
		frm.dirty();
		render_readiness(frm);
		render_save_action(frm);
	});
	$host.append($add);
}
