// Copyright (c) 2026, Imogi and contributors

frappe.provide("imogi_pos.tier_picker");

const IMOGI_TIER_PICKER_META = {
	Free: {
		color: "#64748b",
		gradient: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
		accent: "#94a3b8",
		icon: "fa-leaf",
		tagline: __("Cocok untuk coba-coba & warung kecil"),
	},
	Starter: {
		color: "#2563eb",
		gradient: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
		accent: "#3b82f6",
		icon: "fa-store",
		tagline: __("UMKM dengan operasional harian"),
	},
	Professional: {
		color: "#7c3aed",
		gradient: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
		accent: "#8b5cf6",
		icon: "fa-cutlery",
		tagline: __("Restoran / cafe dengan dapur & shift"),
		popular: true,
	},
	Enterprise: {
		color: "#d97706",
		gradient: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
		accent: "#f59e0b",
		icon: "fa-building",
		tagline: __("Multi-cabang, franchise & integrasi penuh"),
	},
};

imogi_pos.tier_picker.ensure_styles = function () {
	document.getElementById("imogi-tier-picker-css")?.remove();
	frappe.dom.set_style(
		`
		.imogi-tier-picker-dialog .modal-dialog { max-width: 1180px; width: calc(100vw - 48px); }
		.imogi-tier-picker-dialog .modal-content {
			border: 0; border-radius: 20px; box-shadow: 0 24px 64px rgba(15,31,53,.18); overflow: hidden;
		}
		.imogi-tier-picker-dialog .modal-header {
			align-items: flex-start; background: linear-gradient(135deg, #0f1f35 0%, #1a3358 55%, #243b66 100%);
			border: 0; color: #fff; padding: 22px 28px 20px;
		}
		.imogi-tier-picker-dialog .modal-header .modal-title,
		.imogi-tier-picker-dialog .modal-header h4,
		.imogi-tier-picker-checkout .modal-header .modal-title,
		.imogi-tier-picker-checkout .modal-header h4 {
			color: #fff !important; font-size: 20px; font-weight: 800; letter-spacing: -.02em; line-height: 1.2;
		}
		.imogi-tier-picker-dialog .modal-header .btn-modal-close,
		.imogi-tier-picker-dialog .modal-header .close {
			background: rgba(255,255,255,.12); border-radius: 10px; color: #fff; height: 34px;
			margin-top: 0; opacity: 1; width: 34px;
		}
		.imogi-tier-picker-dialog .modal-header .btn-modal-close:hover,
		.imogi-tier-picker-dialog .modal-header .close:hover { background: rgba(255,255,255,.22); color: #fff; }
		.imogi-tier-picker-dialog .modal-body {
			background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
			padding: 0 24px 24px;
		}
		.imogi-tier-picker-hero {
			background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
			box-shadow: 0 4px 18px rgba(15,23,42,.04); margin: 20px 0 18px; padding: 16px 18px;
		}
		.imogi-tier-picker-hero p {
			color: #64748b; font-size: 13px; line-height: 1.55; margin: 0;
		}
		.imogi-tier-picker-hero strong { color: #334155; }
		.imogi-tier-picker-billing-note {
			align-items: flex-start; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px;
			color: #92400e; display: flex; font-size: 12px; gap: 10px; line-height: 1.5;
			margin-bottom: 16px; padding: 12px 14px;
		}
		.imogi-tier-picker-billing-note i { margin-top: 2px; }
		.imogi-tier-picker-grid {
			align-items: stretch; display: grid; gap: 16px;
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
		@media (max-width: 1100px) {
			.imogi-tier-picker-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
		}
		@media (max-width: 640px) {
			.imogi-tier-picker-grid { grid-template-columns: 1fr; }
			.imogi-tier-picker-dialog .modal-body { padding: 0 14px 18px; }
		}
		.imogi-tier-picker-card {
			background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
			box-shadow: 0 4px 20px rgba(15,23,42,.05); display: flex; flex-direction: column;
			overflow: hidden; position: relative; transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
		}
		.imogi-tier-picker-card:hover {
			border-color: #cbd5e1; box-shadow: 0 12px 32px rgba(15,23,42,.1); transform: translateY(-3px);
		}
		.imogi-tier-picker-card.is-current {
			border-color: #f6ad55; box-shadow: 0 0 0 2px rgba(246,173,85,.35), 0 12px 32px rgba(243,156,18,.12);
		}
		.imogi-tier-picker-card.is-selected {
			border-color: #0f1f35; box-shadow: 0 0 0 2px rgba(15,31,53,.25), 0 12px 32px rgba(15,23,42,.1);
		}
		.imogi-tier-picker-card.is-popular { border-color: #c4b5fd; }
		.imogi-tier-picker-card.is-popular::before {
			background: linear-gradient(90deg, #8b5cf6, #a78bfa); color: #fff; content: attr(data-popular-label);
			font-size: 10px; font-weight: 800; left: 0; letter-spacing: .04em; padding: 5px 0;
			position: absolute; right: 0; text-align: center; text-transform: uppercase; top: 0; z-index: 2;
		}
		.imogi-tier-picker-card.is-popular .imogi-tier-picker-card-top { padding-top: 34px; }
		.imogi-tier-picker-card-top {
			padding: 18px 16px 14px; position: relative;
		}
		.imogi-tier-picker-card-icon {
			align-items: center; border-radius: 12px; color: #fff; display: inline-flex;
			font-size: 15px; height: 40px; justify-content: center; margin-bottom: 10px; width: 40px;
		}
		.imogi-tier-picker-card-head {
			align-items: center; display: flex; gap: 8px; justify-content: space-between; margin-bottom: 6px;
		}
		.imogi-tier-picker-card-name { color: #0f172a; font-size: 20px; font-weight: 800; letter-spacing: -.02em; margin: 0; }
		.imogi-tier-picker-badge {
			background: linear-gradient(135deg, #fff7ed, #ffedd5); border: 1px solid #fdba74;
			border-radius: 999px; color: #9a3412; font-size: 10px; font-weight: 800; padding: 4px 10px;
		}
		.imogi-tier-picker-tagline { color: #64748b; font-size: 12px; line-height: 1.45; margin: 0 0 12px; min-height: 36px; }
		.imogi-tier-picker-stats { display: flex; gap: 8px; margin-bottom: 14px; }
		.imogi-tier-picker-stat {
			background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; flex: 1; padding: 8px 10px; text-align: center;
		}
		.imogi-tier-picker-stat-val { color: #0f172a; display: block; font-size: 18px; font-weight: 800; line-height: 1.1; }
		.imogi-tier-picker-stat-lbl { color: #94a3b8; display: block; font-size: 10px; font-weight: 700; margin-top: 2px; text-transform: uppercase; }
		.imogi-tier-picker-card-body {
			border-top: 1px solid #f1f5f9; display: flex; flex: 1; flex-direction: column; padding: 14px 16px 16px;
		}
		.imogi-tier-picker-features-title {
			color: #94a3b8; font-size: 10px; font-weight: 800; letter-spacing: .06em;
			margin-bottom: 8px; text-transform: uppercase;
		}
		.imogi-tier-picker-features {
			flex: 1; list-style: none; margin: 0 0 14px; padding: 0;
		}
		.imogi-tier-picker-features li {
			align-items: flex-start; color: #475569; display: flex; font-size: 12px;
			gap: 8px; line-height: 1.4; margin-bottom: 7px;
		}
		.imogi-tier-picker-features li i {
			color: #22c55e; flex-shrink: 0; font-size: 11px; margin-top: 2px;
		}
		.imogi-tier-picker-more {
			color: #94a3b8; font-size: 11px; font-style: normal; font-weight: 600; margin-top: 4px;
		}
		.imogi-tier-picker-more i { color: #94a3b8 !important; }
		.imogi-tier-picker-card .btn-tier-select {
			border-radius: 11px; font-size: 13px; font-weight: 700; margin-top: auto; padding: 10px 14px; width: 100%;
		}
		.imogi-tier-picker-card .btn-tier-select.btn-tier-cta {
			background: linear-gradient(135deg, #f5b041 0%, #f39c12 100%) !important;
			border: none !important; box-shadow: 0 4px 14px rgba(243,156,18,.3); color: #fff !important;
		}
		.imogi-tier-picker-card .btn-tier-select.btn-tier-cta:hover {
			box-shadow: 0 6px 18px rgba(243,156,18,.4); color: #fff !important; transform: translateY(-1px);
		}
		.imogi-tier-picker-card .btn-tier-select.is-current-btn {
			background: #f8fafc !important; border: 1px dashed #cbd5e1 !important; box-shadow: none !important;
			color: #64748b !important; cursor: default;
		}
		.imogi-tier-picker-card .btn-tier-select.is-locked-btn {
			background: #f1f5f9 !important; border-color: #e2e8f0 !important; color: #94a3b8 !important;
		}
		.imogi-tier-picker-dialog .modal-footer {
			align-items: center; background: #fff; border-top: 1px solid #e5e7eb;
			display: flex; gap: 10px; justify-content: flex-end; padding: 14px 24px;
		}
		.imogi-tier-picker-dialog .btn-tier-matrix {
			background: transparent !important; border: 1px solid #e2e8f0 !important;
			border-radius: 10px !important; color: #475569 !important; font-weight: 600 !important;
		}
		.imogi-tier-picker-dialog .btn-tier-matrix:hover {
			background: #f8fafc !important; border-color: #cbd5e1 !important; color: #0f172a !important;
		}
		.imogi-tier-picker-dialog .btn-tier-close {
			background: #0f1f35 !important; border: none !important; border-radius: 10px !important;
			color: #fff !important; font-weight: 700 !important; min-width: 100px; padding: 9px 20px !important;
		}
		.imogi-tier-picker-dialog .btn-tier-close:hover { background: #1a3358 !important; color: #fff !important; }
		.imogi-tier-picker-inline .imogi-tier-picker-hero { margin-top: 12px; }
		.imogi-tier-picker-inline .imogi-tier-picker-card { cursor: pointer; }
		.imogi-tier-picker-grid--loading { min-height: 120px; place-items: center; }
		.imogi-tier-picker-checkout .modal-dialog { max-width: 560px; }
		.imogi-tier-picker-checkout .modal-body { background: #f8fafc; padding: 20px 22px 22px; }
		.imogi-tier-checkout-steps {
			display: flex; gap: 6px; margin-bottom: 18px;
		}
		.imogi-tier-checkout-step {
			background: #e2e8f0; border-radius: 999px; color: #64748b; flex: 1;
			font-size: 10px; font-weight: 700; padding: 7px 8px; text-align: center; text-transform: uppercase;
		}
		.imogi-tier-checkout-step.is-active { background: #0f1f35; color: #fff; }
		.imogi-tier-checkout-step.is-done { background: #dcfce7; color: #166534; }
		.imogi-tier-checkout-card {
			background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
			box-shadow: 0 4px 18px rgba(15,23,42,.05); margin-bottom: 14px; padding: 16px 18px;
		}
		.imogi-tier-checkout-card h5 { color: #0f172a; font-size: 16px; font-weight: 800; margin: 0 0 10px; }
		.imogi-tier-checkout-arrow-row {
			align-items: center; display: flex; gap: 12px; justify-content: center; margin: 14px 0;
		}
		.imogi-tier-checkout-pill {
			background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;
			color: #0f172a; font-size: 15px; font-weight: 800; padding: 10px 16px;
		}
		.imogi-tier-checkout-pill.is-target { background: #fff7ed; border-color: #fdba74; color: #9a3412; }
		.imogi-tier-checkout-price {
			background: linear-gradient(135deg, #fff7ed, #ffedd5); border: 1px solid #fed7aa;
			border-radius: 12px; color: #9a3412; font-size: 22px; font-weight: 800;
			margin-top: 12px; padding: 12px 14px; text-align: center;
		}
		.imogi-tier-checkout-price small { color: #b45309; display: block; font-size: 11px; font-weight: 600; margin-top: 4px; }
		.imogi-tier-pay-methods { display: grid; gap: 10px; }
		.imogi-tier-pay-method {
			align-items: center; background: #fff; border: 2px solid #e2e8f0; border-radius: 12px;
			cursor: pointer; display: flex; gap: 12px; padding: 14px 16px; transition: all .15s ease;
		}
		.imogi-tier-pay-method:hover { border-color: #cbd5e1; }
		.imogi-tier-pay-method.is-selected { border-color: #f39c12; box-shadow: 0 0 0 1px #f39c12; }
		.imogi-tier-pay-method-icon {
			align-items: center; background: #f8fafc; border-radius: 10px; color: #0f1f35;
			display: flex; font-size: 18px; height: 42px; justify-content: center; width: 42px;
		}
		.imogi-tier-pay-method.is-selected .imogi-tier-pay-method-icon {
			background: #fff7ed; color: #c05621;
		}
		.imogi-tier-pay-method-title { color: #0f172a; font-size: 14px; font-weight: 700; }
		.imogi-tier-pay-method-desc { color: #64748b; font-size: 12px; margin-top: 2px; }
		.imogi-tier-pay-instruction {
			background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px;
			color: #334155; font-size: 13px; line-height: 1.55; padding: 14px 16px;
		}
		.imogi-tier-pay-instruction strong { color: #0f172a; }
		.imogi-tier-pay-instruction .imogi-tier-pay-amount {
			color: #c05621; font-size: 20px; font-weight: 800; margin: 8px 0;
		}
		.imogi-tier-pay-qris-box {
			align-items: center; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
			display: flex; flex-direction: column; gap: 8px; margin-top: 12px; padding: 20px;
		}
		.imogi-tier-pay-qris-box i { color: #0f1f35; font-size: 64px; }
		.imogi-tier-checkout-note { color: #64748b; font-size: 12px; line-height: 1.45; margin: 0; }
		.imogi-tier-picker-checkout .btn-tier-checkout-primary {
			background: linear-gradient(135deg, #f5b041, #f39c12) !important;
			border: none !important; border-radius: 10px !important; color: #fff !important; font-weight: 700 !important;
		}
		.imogi-tier-picker-checkout .btn-tier-checkout-confirm {
			background: #0f1f35 !important; border: none !important; border-radius: 10px !important;
			color: #fff !important; font-weight: 700 !important;
		}
		`,
		"imogi-tier-picker-css"
	);
};

const IMOGI_TIER_PAYMENT_METHODS = [
	{ id: "QRIS", label: __("QRIS"), icon: "fa-qrcode", desc: __("Scan & bayar instan") },
	{ id: "Tunai", label: __("Tunai"), icon: "fa-money", desc: __("Bayar ke sales / kantor") },
	{ id: "Bank Transfer", label: __("Bank Transfer"), icon: "fa-university", desc: __("Transfer manual ke rekening") },
];

imogi_pos.tier_picker.can_view_matrix = function () {
	return (
		frappe.user.has_role("Administrator") ||
		frappe.user.has_role("System Manager") ||
		frappe.user.has_role("Sales Manager")
	);
};

imogi_pos.tier_picker.fetch_catalog = function (callback) {
	frappe.call({
		method: "imogi_pos.api.feature_api.get_tier_catalog",
		callback(r) {
			if (r.exc) return;
			callback(r.message || {});
		},
	});
};

imogi_pos.tier_picker._tier_meta = function (tier_name) {
	return IMOGI_TIER_PICKER_META[tier_name] || IMOGI_TIER_PICKER_META.Free;
};

imogi_pos.tier_picker.render_cards_html = function (catalog, options = {}) {
	const selected = options.selected_tier || catalog.current_tier;
	const allow_select = options.allow_select !== false;
	const local_only = !!options.local_only;
	const can_change = local_only || catalog.can_change_tier !== false;
	const billing_locked = !!catalog.billing_locked;

	return (catalog.tiers || [])
		.map((tier) => {
			const meta = imogi_pos.tier_picker._tier_meta(tier.tier);
			const is_current = tier.is_current || tier.tier === catalog.current_tier;
			const is_selected = tier.tier === selected;
			const is_popular = !!meta.popular;
			const highlights = tier.highlights || [];
			const more = Math.max(0, (tier.new_features || []).length - highlights.length);

			const features_html = highlights
				.map(
					(f) =>
						`<li><i class="fa fa-check"></i><span>${frappe.utils.escape_html(f.label)}</span></li>`
				)
				.join("");
			const more_html = more
				? `<li class="imogi-tier-picker-more"><i class="fa fa-ellipsis-h"></i><span>+ ${more} ${__(
						"fitur lainnya"
				  )}</span></li>`
				: "";

			let btn_label = __("Pilih paket ini");
			let btn_class = "btn-tier-cta";
			if (is_current) {
				btn_label = __("Paket saat ini");
				btn_class = "is-current-btn";
			} else if (!allow_select || (!local_only && !can_change)) {
				btn_label = billing_locked ? __("Dikelola billing") : __("Lihat saja");
				btn_class = "is-locked-btn";
			} else if (local_only) {
				btn_label = is_selected ? __("Dipilih") : __("Pilih");
				btn_class = is_selected ? "btn-tier-cta" : "btn-default";
			}

			return `
				<div class="imogi-tier-picker-card ${is_popular ? "is-popular" : ""} ${is_current ? "is-current" : ""} ${is_selected ? "is-selected" : ""}"
					data-tier="${frappe.utils.escape_html(tier.tier)}"
					${is_popular ? `data-popular-label="${frappe.utils.escape_html(__("Paling populer"))}"` : ""}>
					<div class="imogi-tier-picker-card-top" style="background:${meta.gradient}">
						<span class="imogi-tier-picker-card-icon" style="background:${meta.accent}">
							<i class="fa ${meta.icon}"></i>
						</span>
						<div class="imogi-tier-picker-card-head">
							<h4 class="imogi-tier-picker-card-name">${frappe.utils.escape_html(tier.tier)}</h4>
							${is_current ? `<span class="imogi-tier-picker-badge">${__("Aktif")}</span>` : ""}
						</div>
						<p class="imogi-tier-picker-tagline">${meta.tagline || ""}</p>
						<div class="imogi-tier-picker-stats">
							<div class="imogi-tier-picker-stat">
								<span class="imogi-tier-picker-stat-val">${tier.feature_count || 0}</span>
								<span class="imogi-tier-picker-stat-lbl">${__("Fitur")}</span>
							</div>
							<div class="imogi-tier-picker-stat">
								<span class="imogi-tier-picker-stat-val">${tier.built_count || 0}</span>
								<span class="imogi-tier-picker-stat-lbl">${__("Tersedia")}</span>
							</div>
						</div>
					</div>
					<div class="imogi-tier-picker-card-body">
						<div class="imogi-tier-picker-features-title">${__("Fitur di paket ini")}</div>
						<ul class="imogi-tier-picker-features">${features_html}${more_html}</ul>
						<button type="button" class="btn btn-sm btn-tier-select ${btn_class}" data-tier="${frappe.utils.escape_html(
							tier.tier
						)}"
							${!allow_select || (!local_only && (!can_change || is_current)) ? "disabled" : ""}>${btn_label}</button>
					</div>
				</div>`;
		})
		.join("");
};

imogi_pos.tier_picker.apply_tier = function (tier, options = {}) {
	const on_done = options.on_done || function () {};
	frappe.call({
		method: "imogi_pos.api.feature_api.set_subscription_tier",
		args: {
			tier,
			payment_method: options.payment_method || null,
			payment_reference: options.payment_reference || null,
		},
		freeze: true,
		freeze_message: __("Menerapkan paket langganan..."),
		callback(r) {
			if (r.exc) return;
			const msg = r.message || {};
			frappe.show_alert({
				message: __("Paket diubah ke {0}", [msg.after || tier]),
				indicator: "green",
			});
			frappe.boot.imogi_pos_subscription_tier = msg.after || tier;
			if (imogi_pos.apply_workspace_tier_context && msg.tier_access) {
				imogi_pos.apply_workspace_tier_context(msg);
			}
			on_done(msg);
		},
	});
};

imogi_pos.tier_picker._format_idr = function (amount) {
	const n = flt(amount);
	if (!n) return __("Gratis");
	try {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(n);
	} catch (e) {
		return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
	}
};

imogi_pos.tier_picker._render_checkout_steps = function (active_step) {
	const steps = [
		{ id: 1, label: __("Ringkasan") },
		{ id: 2, label: __("Pembayaran") },
		{ id: 3, label: __("Aktivasi") },
	];
	return `<div class="imogi-tier-checkout-steps">${steps
		.map((s) => {
			const cls =
				s.id < active_step ? "is-done" : s.id === active_step ? "is-active" : "";
			return `<div class="imogi-tier-checkout-step ${cls}">${frappe.utils.escape_html(s.label)}</div>`;
		})
		.join("")}</div>`;
};

imogi_pos.tier_picker._payment_instruction_html = function (quote, method) {
	const cfg = quote.payment_config || {};
	const amount = imogi_pos.tier_picker._format_idr(quote.monthly_price);
	const ref = `IMOGI-${frappe.session.user}-${quote.target_tier}`.replace(/\s/g, "");

	if (method === "QRIS") {
		return `
			<div class="imogi-tier-pay-instruction">
				<strong>${__("Scan QRIS")}</strong>
				<div class="imogi-tier-pay-amount">${amount}</div>
				<p class="imogi-tier-checkout-note mb-0">${__(
					"Merchant: {0}. Setelah pembayaran berhasil, lanjut ke langkah aktivasi.",
					[frappe.utils.escape_html(cfg.qris_merchant || "IMOGI POS")]
				)}</p>
				<div class="imogi-tier-pay-qris-box">
					<i class="fa fa-qrcode"></i>
					<span class="text-muted small">${__("QR Code — integrasi gateway menyusul")}</span>
				</div>
			</div>`;
	}
	if (method === "Tunai") {
		return `
			<div class="imogi-tier-pay-instruction">
				<strong>${__("Pembayaran tunai")}</strong>
				<div class="imogi-tier-pay-amount">${amount}</div>
				<p>${frappe.utils.escape_html(cfg.cash_note || __("Bayar tunai ke sales representative IMOGI."))}</p>
				<p class="imogi-tier-checkout-note mb-0">${__(
					"Catat bukti pembayaran, lalu klik <b>Sudah bayar — aktifkan paket</b>."
				)}</p>
			</div>`;
	}
	return `
		<div class="imogi-tier-pay-instruction">
			<strong>${__("Transfer bank")}</strong>
			<div class="imogi-tier-pay-amount">${amount}</div>
			<p><strong>${frappe.utils.escape_html(cfg.bank_name || "BCA")}</strong><br>
			${frappe.utils.escape_html(cfg.bank_account || "-")}<br>
			a.n. ${frappe.utils.escape_html(cfg.bank_holder || "IMOGI")}</p>
			<p>${__("Berita transfer")}: <code>${frappe.utils.escape_html(ref)}</code></p>
			<p class="imogi-tier-checkout-note mb-0">${__(
				"Setelah transfer, klik <b>Sudah bayar — aktifkan paket</b>."
			)}</p>
		</div>`;
};

imogi_pos.tier_picker.open_checkout = function (tier, options = {}) {
	imogi_pos.tier_picker.ensure_styles();
	const on_done = options.on_done || function () {};

	frappe.call({
		method: "imogi_pos.api.feature_api.get_tier_upgrade_quote",
		args: { tier },
		callback(r) {
			if (r.exc) return;
			const quote = r.message || {};
			if (!quote.requires_payment) {
				frappe.confirm(
					__(
						"Ubah paket langganan dari <b>{0}</b> ke <b>{1}</b>? Pengaturan yang tidak tersedia di paket ini akan dinonaktifkan.",
						[quote.current_tier, quote.target_tier]
					),
					() => {
						imogi_pos.tier_picker.apply_tier(quote.target_tier, { on_done });
					}
				);
				return;
			}

			let step = 1;
			let selected_method = null;

			const dialog = new frappe.ui.Dialog({
				title: __("Upgrade ke {0}", [quote.target_tier]),
				size: "large",
			});
			dialog.$wrapper.addClass("imogi-tier-picker-dialog imogi-tier-picker-checkout");

			const render = () => {
				if (step === 1) {
					dialog.$body.html(`
						${imogi_pos.tier_picker._render_checkout_steps(1)}
						<div class="imogi-tier-checkout-card">
							<h5>${__("Ringkasan perubahan paket")}</h5>
							<div class="imogi-tier-checkout-arrow-row">
								<span class="imogi-tier-checkout-pill">${frappe.utils.escape_html(quote.current_tier)}</span>
								<i class="fa fa-long-arrow-right text-muted"></i>
								<span class="imogi-tier-checkout-pill is-target">${frappe.utils.escape_html(quote.target_tier)}</span>
							</div>
							<div class="imogi-tier-checkout-price">
								${frappe.utils.escape_html(quote.monthly_price_label || imogi_pos.tier_picker._format_idr(quote.monthly_price))}
								<small>${__("per bulan")}</small>
							</div>
							<p class="imogi-tier-checkout-note mt-3 mb-0">${__(
								"Anda akan memilih metode pembayaran di langkah berikutnya, lalu mengaktifkan paket setelah pembayaran."
							)}</p>
						</div>
					`);
					dialog.set_primary_action(__("Lanjut ke Pembayaran"), () => {
						step = 2;
						render();
					});
					dialog.get_primary_btn().addClass("btn-tier-checkout-primary");
					dialog.get_secondary_btn().addClass("hide");
					return;
				}

				if (step === 2) {
					const methods_html = IMOGI_TIER_PAYMENT_METHODS.map(
						(m) => `
						<div class="imogi-tier-pay-method ${selected_method === m.id ? "is-selected" : ""}" data-method="${frappe.utils.escape_html(m.id)}">
							<span class="imogi-tier-pay-method-icon"><i class="fa ${m.icon}"></i></span>
							<div>
								<div class="imogi-tier-pay-method-title">${frappe.utils.escape_html(m.label)}</div>
								<div class="imogi-tier-pay-method-desc">${frappe.utils.escape_html(m.desc)}</div>
							</div>
						</div>`
					).join("");

					dialog.$body.html(`
						${imogi_pos.tier_picker._render_checkout_steps(2)}
						<div class="imogi-tier-checkout-card">
							<h5>${__("Pilih metode pembayaran")}</h5>
							<div class="imogi-tier-pay-methods">${methods_html}</div>
						</div>
					`);

					dialog.$body.find(".imogi-tier-pay-method").on("click", function () {
						selected_method = $(this).data("method");
						dialog.$body.find(".imogi-tier-pay-method").removeClass("is-selected");
						$(this).addClass("is-selected");
					});

					dialog.set_primary_action(__("Lanjut"), () => {
						if (!selected_method) {
							frappe.msgprint(__("Pilih metode pembayaran terlebih dahulu."));
							return;
						}
						step = 3;
						render();
					});
					dialog.set_secondary_action_label(__("Kembali"));
					dialog.set_secondary_action(() => {
						step = 1;
						render();
					});
					dialog.get_primary_btn().addClass("btn-tier-checkout-primary");
					return;
				}

				dialog.$body.html(`
					${imogi_pos.tier_picker._render_checkout_steps(3)}
					<div class="imogi-tier-checkout-card">
						<h5>${__("Selesaikan pembayaran")} — ${frappe.utils.escape_html(selected_method)}</h5>
						${imogi_pos.tier_picker._payment_instruction_html(quote, selected_method)}
					</div>
				`);

				dialog.set_primary_action(__("Sudah bayar — aktifkan paket"), () => {
					frappe.confirm(
						__(
							"Aktifkan paket <b>{0}</b> sekarang? Pastikan pembayaran <b>{1}</b> sebesar <b>{2}</b> sudah diterima.",
							[
								quote.target_tier,
								selected_method,
								quote.monthly_price_label || imogi_pos.tier_picker._format_idr(quote.monthly_price),
							]
						),
						() => {
							const ref = `IMOGI-${quote.target_tier}-${Date.now()}`;
							imogi_pos.tier_picker.apply_tier(quote.target_tier, {
								payment_method: selected_method,
								payment_reference: ref,
								on_done(msg) {
									dialog.hide();
									on_done(msg);
								},
							});
						}
					);
				});
				dialog.set_secondary_action_label(__("Kembali"));
				dialog.set_secondary_action(() => {
					step = 2;
					render();
				});
				dialog.get_primary_btn().addClass("btn-tier-checkout-confirm");
			};

			render();
			dialog.show();
			dialog.$wrapper.find(".modal-header .modal-title, .modal-header h4").css("color", "#fff");
		},
	});
};

imogi_pos.tier_picker.open = function (options = {}) {
	if (imogi_pos.tier_picker._active_dialog) {
		return;
	}
	imogi_pos.tier_picker.ensure_styles();
	const title = options.title || __("Upgrade Langganan");
	const on_select = options.on_select || function () {};

	imogi_pos.tier_picker.fetch_catalog((catalog) => {
		const billing_note = catalog.billing_locked
			? `<div class="imogi-tier-picker-billing-note">
				<i class="fa fa-lock"></i>
				<span>${__(
					"Paket dikelola otomatis oleh billing SaaS. Hubungi admin atau gunakan portal billing untuk upgrade."
				)}</span>
			</div>`
			: "";

		const dialog = new frappe.ui.Dialog({
			title,
			size: "extra-large",
		});

		dialog.$wrapper.addClass("imogi-tier-picker-dialog");
		imogi_pos.tier_picker._active_dialog = dialog;
		dialog.$wrapper.on("hidden.bs.modal.imogi-tier-picker", () => {
			if (imogi_pos.tier_picker._active_dialog === dialog) {
				imogi_pos.tier_picker._active_dialog = null;
			}
		});
		dialog.$body.html(`
			<div class="imogi-tier-picker-hero">
				<p>${__(
					"Bandingkan paket <strong>Free</strong>, <strong>Starter</strong>, <strong>Professional</strong>, dan <strong>Enterprise</strong>. Fitur bersifat kumulatif — tier lebih tinggi mencakup semua fitur tier di bawahnya."
				)}</p>
			</div>
			${billing_note}
			<div class="imogi-tier-picker-grid">${imogi_pos.tier_picker.render_cards_html(catalog, options)}</div>
		`);

		dialog.$body.find(".btn-tier-select").on("click", function () {
			const tier = $(this).data("tier");
			if (!tier || catalog.billing_locked || !catalog.can_change_tier) return;
			imogi_pos.tier_picker.open_checkout(tier, {
				on_done(msg) {
					dialog.hide();
					on_select(msg);
				},
			});
		});

		if (imogi_pos.tier_picker.can_view_matrix()) {
			dialog.set_secondary_action_label(__("Matriks lengkap"));
			dialog.set_secondary_action(() => {
				frappe.set_route(catalog.matrix_route || "imogi-pos-feature-matrix");
				dialog.hide();
			});
		}

		dialog.set_primary_action(__("Tutup"), () => dialog.hide());

		dialog.show();
		dialog.$wrapper.find(".modal-header .modal-title, .modal-header h4").css("color", "#fff");
		dialog.get_primary_btn().addClass("btn-tier-close");
		const $secondary = dialog.get_secondary_btn();
		if ($secondary && $secondary.length && !$secondary.hasClass("hide")) {
			$secondary.addClass("btn-tier-matrix");
		}
	});
};

imogi_pos.tier_picker.render_inline = function ($container, options = {}) {
	imogi_pos.tier_picker.ensure_styles();
	const on_select = options.on_select || function () {};
	const selected = options.selected_tier || "Free";

	$container.addClass("imogi-tier-picker-inline").html(`
		<div class="imogi-tier-picker-hero">
			<p>${__(
				"Pilih paket sesuai skala usaha. Anda bisa <strong>upgrade kapan saja</strong> dari Pengaturan."
			)}</p>
		</div>
		<div class="imogi-tier-picker-grid imogi-tier-picker-grid--loading">
			<div class="text-muted p-4 text-center w-100"><i class="fa fa-spinner fa-spin"></i> ${__("Memuat paket...")}</div>
		</div>
	`);

	imogi_pos.tier_picker.fetch_catalog((catalog) => {
		catalog.current_tier = selected;
		const $grid = $container.find(".imogi-tier-picker-grid");
		$grid.removeClass("imogi-tier-picker-grid--loading").html(
			imogi_pos.tier_picker.render_cards_html(catalog, {
				selected_tier: selected,
				allow_select: true,
				local_only: true,
			})
		);

		$grid.find(".imogi-tier-picker-card").on("click", function (e) {
			if ($(e.target).closest(".btn-tier-select").length) return;
			const tier = $(this).data("tier");
			$grid.find(".imogi-tier-picker-card").removeClass("is-selected");
			$(this).addClass("is-selected");
			$grid.find(".btn-tier-select").each(function () {
				const $btn = $(this);
				const is_sel = $btn.data("tier") === tier;
				$btn.toggleClass("btn-tier-cta", is_sel).toggleClass("btn-default", !is_sel);
				$btn.text(is_sel ? __("Dipilih") : __("Pilih"));
			});
			on_select({ tier, preview_only: true });
		});

		$grid.find(".btn-tier-select").on("click", function (e) {
			e.stopPropagation();
			const tier = $(this).data("tier");
			if (!tier) return;
			$grid.find(".imogi-tier-picker-card").removeClass("is-selected");
			$grid.find(`.imogi-tier-picker-card[data-tier="${tier}"]`).addClass("is-selected");
			$grid.find(".btn-tier-select").each(function () {
				const $btn = $(this);
				const is_sel = $btn.data("tier") === tier;
				$btn.toggleClass("btn-tier-cta", is_sel).toggleClass("btn-default", !is_sel);
				$btn.text(is_sel ? __("Dipilih") : __("Pilih"));
			});
			on_select({ tier });
		});

		if (selected) {
			$grid.find(`.imogi-tier-picker-card[data-tier="${selected}"]`).addClass("is-selected");
		}
	});
};
