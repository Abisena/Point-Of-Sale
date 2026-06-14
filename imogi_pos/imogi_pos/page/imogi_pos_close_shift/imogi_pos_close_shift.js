frappe.provide("imogi_pos");

frappe.pages["imogi-pos-close-shift"].on_page_load = function (wrapper) {
	try {
		frappe.dom?.unfreeze?.();
		imogi_pos.ensure_shift_helpers?.();
		inject_close_shift_css();
		imogi_pos.sync_desk_theme?.();

		const page = frappe.ui.make_app_page({
			parent: wrapper,
			title: __("Closing Shift Kasir"),
			single_column: true,
		});

		page.main.addClass("imogi-close-shift-page");
		$(wrapper).find(".layout-main-section-wrapper").css({ maxWidth: "100%", overflowX: "hidden", width: "100%" });
		$(wrapper).find(".page-head").hide();
		wrapper.close_shift_page = new imogi_pos.CloseShiftPage(page);
		imogi_pos.active_close_shift = wrapper.close_shift_page;
		frappe.breadcrumbs.add("Imogi POS");
	} catch (e) {
		console.error("[imogi-pos-close-shift]", e);
		frappe.dom?.unfreeze?.();
		frappe.msgprint({
			message: __("Gagal memuat halaman Tutup Shift. Muat ulang halaman."),
			indicator: "red",
		});
	}
};

frappe.pages["imogi-pos-close-shift"].on_page_show = function (wrapper) {
	imogi_pos.sync_desk_theme?.();
	wrapper.close_shift_page?.refresh?.();
};

function imogi_close_format_rp(val) {
	return format_currency(flt(val), frappe.defaults.get_default("currency") || "IDR");
}

function imogi_close_format_date_long() {
	return imogi_pos.format_local_date_long();
}

function inject_close_shift_css() {
	[
		"imogi-close-shift-css-v4",
		"imogi-close-shift-css-v5",
		"imogi-close-shift-css-v6",
	].forEach((id) => document.getElementById(id)?.remove());
	if (typeof imogi_pos.inject_cash_denom_css === "function") {
		imogi_pos.inject_cash_denom_css();
	}
	frappe.dom.set_style(`
		.imogi-close-shift-page .layout-main-section-wrapper,
		.imogi-close-shift-page .layout-main-section,
		.imogi-close-shift-page .page-body {
			box-sizing: border-box;
			max-width: 100% !important;
			overflow-x: hidden !important;
			width: 100% !important;
		}
		.imogi-close-shift-page .page-body { background: transparent; padding: 0 !important; }
		.imogi-close-shift-page .layout-main-section { margin: 0 auto !important; max-width: 1120px; width: 100%; }
		.imogi-close-shell {
			box-sizing: border-box;
			margin: 0 auto;
			max-width: 1120px;
			overflow-x: hidden;
			padding: 20px 24px 32px;
			width: 100%;
		}
		.imogi-close-header {
			align-items: flex-start;
			background: linear-gradient(145deg, #0f1f35 0%, #1a3352 100%);
			border: 1px solid rgba(255,255,255,0.12);
			border-radius: 16px;
			display: flex;
			flex-wrap: wrap;
			gap: 16px;
			justify-content: space-between;
			margin-bottom: 20px;
			padding: 18px 22px;
		}
		.imogi-close-header-left { flex: 1 1 220px; min-width: 0; }
		.imogi-close-header-title { color: #fff; font-size: 22px; font-weight: 800; line-height: 1.2; margin: 0 0 4px; word-break: break-word; }
		.imogi-close-header-sub { color: rgba(255,255,255,0.72); font-size: 13px; line-height: 1.35; margin: 0; word-break: break-word; }
		.imogi-close-header-right { align-items: center; color: rgba(255,255,255,0.88); display: flex; flex: 1 1 180px; flex-wrap: wrap; font-size: 13px; font-weight: 600; gap: 10px 16px; justify-content: flex-end; min-width: 0; }
		.imogi-close-logout-btn { background: rgba(255,255,255,0.12) !important; border: 1px solid rgba(255,255,255,0.24) !important; border-radius: 8px !important; color: #fff !important; font-weight: 700 !important; }
		.imogi-close-logout-btn .fa { margin-right: 4px; opacity: .85; }
		.imogi-close-layout { align-items: start; box-sizing: border-box; display: grid; gap: 20px; grid-template-columns: minmax(0,1fr) 320px; max-width: 100%; width: 100%; }
		.imogi-close-main { box-sizing: border-box; display: grid; gap: 16px; max-width: 100%; min-width: 0; width: 100%; }
		.imogi-close-card { background: #fff; border: 1px solid #e4e4e7; border-radius: 16px; box-sizing: border-box; max-width: 100%; overflow: hidden; padding: 18px 20px 20px; width: 100%; }
		.imogi-close-card-title { color: #0f1f35; font-size: 15px; font-weight: 800; margin-bottom: 14px; }
		.imogi-close-stat-grid { display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0,1fr)); }
		.imogi-close-stat { background: #fafafa; border: 1px solid #f4f4f5; border-radius: 12px; min-width: 0; padding: 12px 14px; }
		.imogi-close-stat-label { color: #71717a; font-size: 12px; font-weight: 700; margin-bottom: 4px; }
		.imogi-close-stat-value { color: #0f1f35; font-size: 18px; font-variant-numeric: tabular-nums; font-weight: 800; line-height: 1.25; overflow-wrap: anywhere; word-break: break-word; }
		.imogi-close-pay-list { display: grid; gap: 8px; margin-top: 14px; max-width: 100%; }
		.imogi-close-pay-row { align-items: baseline; display: flex; font-size: 13px; gap: 10px; justify-content: space-between; max-width: 100%; min-width: 0; }
		.imogi-close-pay-row span { color: #71717a; flex-shrink: 0; }
		.imogi-close-pay-row strong { color: #0f1f35; flex: 0 1 auto; font-variant-numeric: tabular-nums; min-width: 0; overflow-wrap: anywhere; text-align: right; word-break: break-word; }
		.imogi-close-cash-rows { display: grid; gap: 10px; max-width: 100%; }
		.imogi-close-cash-row { align-items: center; box-sizing: border-box; display: grid; gap: 8px 12px; grid-template-columns: minmax(0,1fr) minmax(0,max-content); max-width: 100%; min-width: 0; }
		.imogi-close-cash-row span { color: #52525b; font-size: 13px; font-weight: 700; min-width: 0; }
		.imogi-close-cash-row strong { color: #0f1f35; font-size: 16px; font-variant-numeric: tabular-nums; min-width: 0; overflow-wrap: anywhere; text-align: right; word-break: break-word; }
		.imogi-close-cash-row.is-total { border-top: 1px solid #e4e4e7; margin-top: 4px; padding-top: 12px; }
		.imogi-close-input { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 10px; box-sizing: border-box; font-size: 14px; font-weight: 700; max-width: 100%; min-width: 0; padding: 10px 12px; text-align: right; width: 100%; }
		.imogi-close-input:focus { background: #fff; border-color: #a1a1aa; outline: none; }
		.imogi-close-textarea { min-height: 88px; resize: vertical; text-align: left; width: 100%; }
		.imogi-close-sidebar { max-width: 100%; min-width: 0; position: sticky; top: 16px; width: 100%; }
		.imogi-close-verify-card { background: #fff; border: 1px solid #e4e4e7; border-radius: 16px; box-sizing: border-box; max-width: 100%; padding: 20px; width: 100%; }
		.imogi-close-verify-title { color: #0f1f35; font-size: 15px; font-weight: 800; margin-bottom: 16px; }
		.imogi-close-verify-row { align-items: baseline; display: flex; font-size: 13px; gap: 10px; justify-content: space-between; min-width: 0; padding: 8px 0; }
		.imogi-close-verify-row span { color: #71717a; flex-shrink: 0; }
		.imogi-close-verify-row strong { color: #0f1f35; flex: 0 1 auto; font-variant-numeric: tabular-nums; font-weight: 800; min-width: 0; overflow-wrap: anywhere; text-align: right; word-break: break-word; }
		.imogi-close-diff-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; margin-top: 14px; padding: 14px; text-align: center; }
		.imogi-close-diff-box.is-surplus { background: #ecfdf5; border-color: #a7f3d0; }
		.imogi-close-diff-box.is-ok { background: #f4f4f5; border-color: #e4e4e7; }
		.imogi-close-diff-label { color: #991b1b; font-size: 12px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
		.imogi-close-diff-box.is-surplus .imogi-close-diff-label { color: #047857; }
		.imogi-close-diff-box.is-ok .imogi-close-diff-label { color: #52525b; }
		.imogi-close-diff-value { color: #991b1b; font-size: 24px; font-variant-numeric: tabular-nums; font-weight: 800; margin-top: 4px; overflow-wrap: anywhere; word-break: break-word; }
		.imogi-close-diff-box.is-surplus .imogi-close-diff-value { color: #047857; }
		.imogi-close-diff-box.is-ok .imogi-close-diff-value { color: #0f1f35; }
		.imogi-close-actions { display: grid; gap: 10px; margin-top: 16px; }
		.imogi-close-btn-primary { background: #ec4899 !important; border: none !important; border-radius: 12px !important; color: #fff !important; font-size: 14px !important; font-weight: 800 !important; padding: 14px 16px !important; width: 100%; }
		.imogi-close-btn-primary.is-balanced { background: #0f1f35 !important; }
		.imogi-close-btn-secondary { background: #fff !important; border: 1px solid #d4d4d8 !important; border-radius: 12px !important; color: #0f1f35 !important; font-weight: 700 !important; padding: 12px 16px !important; width: 100%; }
		.imogi-close-loading { align-items: center; color: #a1a1aa; display: flex; flex-direction: column; gap: 12px; justify-content: center; min-height: 320px; }
		@media (max-width: 960px) {
			.imogi-close-layout { grid-template-columns: minmax(0, 1fr); }
			.imogi-close-sidebar { position: static; }
		}
		@media (max-width: 640px) {
			.imogi-close-shift-page .page-container,
			.imogi-close-shift-page .container.page-body,
			.imogi-close-shift-page .main-section { padding-left: 0 !important; padding-right: 0 !important; }
			.imogi-close-shell { box-sizing: border-box; max-width: 100%; padding: 6px 8px 20px; width: 100%; }
			.imogi-close-header { border-radius: 14px; gap: 10px; margin-bottom: 14px; padding: 14px 16px; }
			.imogi-close-header-left,
			.imogi-close-header-right { flex: 1 1 100%; justify-content: flex-start; width: 100%; }
			.imogi-close-header-title { font-size: 18px; }
			.imogi-close-header-sub { font-size: 12px; }
			.imogi-close-header-right { font-size: 11px; gap: 8px 12px; }
			.imogi-close-card { border-radius: 14px; padding: 14px 14px 16px; }
			.imogi-close-card-title { font-size: 14px; margin-bottom: 12px; }
			.imogi-close-stat-grid { grid-template-columns: minmax(0, 1fr); }
			.imogi-close-stat-value { font-size: 16px; }
			.imogi-close-pay-row,
			.imogi-close-verify-row { align-items: flex-start; flex-direction: column; gap: 2px; }
			.imogi-close-pay-row strong,
			.imogi-close-verify-row strong { align-self: flex-end; font-size: 13px; max-width: 100%; text-align: right; width: 100%; }
			.imogi-close-cash-row { align-items: stretch; grid-template-columns: minmax(0, 1fr); }
			.imogi-close-cash-row strong { font-size: 15px; text-align: left; }
			.imogi-close-cash-row .imogi-close-input { text-align: left; }
			.imogi-close-cash-row.is-total strong { font-size: 17px; }
			.imogi-close-verify-card { padding: 16px; }
			.imogi-close-diff-value { font-size: 20px; }
			.imogi-cash-denom-grid { gap: 8px; }
		}
	`, "imogi-close-shift-css-v7");
}

imogi_pos.CloseShiftPage = class CloseShiftPage {
	constructor(page) {
		this.page = page;
		this.$wrapper = page.main;
		this.context = null;
		this.denominations = imogi_pos.init_denominations_map();
		this.expenses = 0;
		this.remarks = "";
		this.submitting = false;
		this._clock_timer = null;
		this.render_shell();
		this.load_context();
	}

	render_shell() {
		this.$wrapper.html(`
			<div class="imogi-close-shell">
				<div class="imogi-close-loading">
					<i class="fa fa-spinner fa-spin fa-2x"></i>
					<div>${__("Memuat closing shift...")}</div>
				</div>
			</div>
		`);
	}

	load_context() {
		frappe.call({
			method: "imogi_pos.api.cashier.get_shift_closing_page_context",
			args: {
				pos_opening_entry: frappe.route_options?.pos_opening_entry || null,
			},
			callback: (r) => {
				if (r.exc) {
					this.$wrapper.find(".imogi-close-loading").html(`
						<div class="text-danger">${__("Gagal memuat closing shift.")}</div>
					`);
					return;
				}
				if (r.message?.no_open_shift) {
					frappe.msgprint(__("Tidak ada shift terbuka."));
					frappe.set_route("imogi-pos-open-shift");
					return;
				}
				this.context = r.message;
				this.expenses = flt(r.message.expenses);
				this.remarks = r.message.remarks || "";
				if (flt(r.message.actual_cash) > 0) {
					this.denominations = imogi_pos.init_denominations_map();
				}
				this.render();
			},
		});
	}

	refresh() {
		if (this._clock_timer) {
			clearInterval(this._clock_timer);
			this._clock_timer = null;
		}
		this.submitting = false;
		this.load_context();
	}

	get_time_string() {
		return imogi_pos.format_local_time();
	}

	get_store_label() {
		const ctx = this.context || {};
		return ctx.company && ctx.pos_profile ? `${ctx.company} — ${ctx.pos_profile}` : ctx.company || "-";
	}

	get_total_sheets() {
		return imogi_pos.IDR_DENOMINATIONS.reduce((sum, d) => sum + flt(this.denominations[d.value]), 0);
	}

	get_actual_cash() {
		return imogi_pos.IDR_DENOMINATIONS.reduce(
			(sum, d) => sum + flt(this.denominations[d.value]) * d.value,
			0
		);
	}

	get_expected_cash() {
		return flt(this.context?.opening_cash) + flt(this.context?.cash_sales) - flt(this.expenses);
	}

	get_difference() {
		return this.get_actual_cash() - this.get_expected_cash();
	}

	get_diff_meta() {
		const diff = this.get_difference();
		if (Math.abs(diff) < 0.01) {
			return { label: __("Seimbang"), className: "is-ok", amount: 0 };
		}
		if (diff < 0) {
			return { label: __("Kurang"), className: "", amount: Math.abs(diff) };
		}
		return { label: __("Lebih"), className: "is-surplus", amount: diff };
	}

	render_payment_breakdown() {
		return (this.context.payment_breakdown || [])
			.map(
				(row) => `
			<div class="imogi-close-pay-row">
				<span>${frappe.utils.escape_html(row.label || row.mode_of_payment)}</span>
				<strong>${imogi_close_format_rp(row.sales_amount)}</strong>
			</div>`
			)
			.join("");
	}

	render_denom_grid() {
		return imogi_pos.render_cash_denom_grid(this.denominations, imogi_close_format_rp);
	}

	render_verify_sidebar() {
		const diff = this.get_diff_meta();
		const balanced = diff.className === "is-ok";
		const submit_label = balanced ? __("Tutup Shift") : __("Tutup dengan Selisih");

		return `
			<div class="imogi-close-verify-row">
				<span>${__("Total Lembar")}</span>
				<strong class="imogi-close-total-sheets">${this.get_total_sheets()} ${__("lembar")}</strong>
			</div>
			<div class="imogi-close-verify-row">
				<span>${__("Kas Diharapkan")}</span>
				<strong class="imogi-close-expected">${imogi_close_format_rp(this.get_expected_cash())}</strong>
			</div>
			<div class="imogi-close-verify-row">
				<span>${__("Kas Aktual")}</span>
				<strong class="imogi-close-actual">${imogi_close_format_rp(this.get_actual_cash())}</strong>
			</div>
			<div class="imogi-close-diff-box ${diff.className}">
				<div class="imogi-close-diff-label">${diff.label}</div>
				<div class="imogi-close-diff-value">${imogi_close_format_rp(diff.amount)}</div>
			</div>
			<div class="imogi-close-actions">
				<button type="button" class="btn imogi-close-btn-primary ${balanced ? "is-balanced" : ""} imogi-close-submit">
					<i class="fa fa-${balanced ? "check-circle" : "times-circle"}"></i> ${submit_label}
				</button>
				<button type="button" class="btn imogi-close-btn-secondary imogi-close-reset">${__("Reset Hitungan")}</button>
			</div>
		`;
	}

	render() {
		const ctx = this.context;
		const date_long = imogi_close_format_date_long();
		const time_str = this.get_time_string();

		this.$wrapper.html(`
			<div class="imogi-close-shell">
				<div class="imogi-close-header">
					<div class="imogi-close-header-left">
						<h1 class="imogi-close-header-title">${__("Closing Shift Kasir")}</h1>
						<p class="imogi-close-header-sub">${frappe.utils.escape_html(this.get_store_label())} · ${__(
							"Kasir"
						)}: ${frappe.utils.escape_html(ctx.user_fullname || ctx.user || "")}</p>
					</div>
					<div class="imogi-close-header-right">
						<button type="button" class="btn btn-xs btn-default imogi-close-logout-btn" title="${__(
							"Logout sementara — shift tetap terbuka"
						)}"><i class="fa fa-sign-out"></i> ${__("Logout")}</button>
						<span><i class="fa fa-calendar-o"></i> <span class="imogi-close-date">${frappe.utils.escape_html(date_long)}</span></span>
						<span><i class="fa fa-clock-o"></i> <span class="imogi-close-clock">${time_str}</span></span>
					</div>
				</div>

				<div class="imogi-close-layout">
					<div class="imogi-close-main">
						<div class="imogi-close-card">
							<div class="imogi-close-card-title">${__("Ringkasan Transaksi")}</div>
							<div class="imogi-close-stat-grid">
								<div class="imogi-close-stat">
									<div class="imogi-close-stat-label">${__("Total Transaksi")}</div>
									<div class="imogi-close-stat-value">${ctx.total_transactions || 0}</div>
								</div>
								<div class="imogi-close-stat">
									<div class="imogi-close-stat-label">${__("Total Penjualan")}</div>
									<div class="imogi-close-stat-value">${imogi_close_format_rp(ctx.total_sales)}</div>
								</div>
							</div>
							<div class="imogi-close-pay-list">${this.render_payment_breakdown()}</div>
						</div>

						<div class="imogi-close-card">
							<div class="imogi-close-card-title">${__("Saldo Kas")}</div>
							<div class="imogi-close-cash-rows">
								<div class="imogi-close-cash-row">
									<span>${__("Saldo Awal")}</span>
									<strong>${imogi_close_format_rp(ctx.opening_cash)}</strong>
								</div>
								<div class="imogi-close-cash-row">
									<span>${__("Penjualan Tunai")}</span>
									<strong>+ ${imogi_close_format_rp(ctx.cash_sales)}</strong>
								</div>
								<div class="imogi-close-cash-row">
									<span>${__("Pengeluaran")}</span>
									<input type="number" min="0" step="1" class="imogi-close-input imogi-close-expenses"
										value="${flt(this.expenses) || ""}" placeholder="0">
								</div>
								<div class="imogi-close-cash-row is-total">
									<span>${__("Kas yang Diharapkan")}</span>
									<strong class="imogi-close-expected-main">${imogi_close_format_rp(this.get_expected_cash())}</strong>
								</div>
							</div>
						</div>

						<div class="imogi-close-card">
							<div class="imogi-close-card-title">${__("Hitung Uang Tunai Aktual")}</div>
							<p class="imogi-cash-denom-hint">${__(
								"Ketuk nominal untuk tambah lembar. Tombol − untuk kurangi."
							)}</p>
							<div class="imogi-cash-denom-grid">${this.render_denom_grid()}</div>
						</div>

						<div class="imogi-close-card">
							<div class="imogi-close-card-title">${__("Catatan Penutupan")}</div>
							<textarea class="imogi-close-input imogi-close-textarea imogi-close-remarks" placeholder="${__(
								"Catatan untuk selisih, pengeluaran, atau informasi penting lainnya..."
							)}">${frappe.utils.escape_html(this.remarks || "")}</textarea>
						</div>
					</div>

					<div class="imogi-close-sidebar">
						<div class="imogi-close-verify-card">
							<div class="imogi-close-verify-title">${__("Verifikasi Kas")}</div>
							<div class="imogi-close-verify-body">${this.render_verify_sidebar()}</div>
						</div>
					</div>
				</div>
			</div>
		`);

		this.bind_events();
		this.start_clock();
	}

	start_clock() {
		if (this._clock_timer) clearInterval(this._clock_timer);
		const tick = () => {
			this.$wrapper.find(".imogi-close-clock").text(this.get_time_string());
			this.$wrapper.find(".imogi-close-date").text(imogi_pos.format_local_date_long());
		};
		tick();
		this._clock_timer = setInterval(tick, 1000);
	}

	update_verify_ui() {
		this.$wrapper.find(".imogi-close-verify-body").html(this.render_verify_sidebar());
		this.$wrapper.find(".imogi-close-expected-main").text(imogi_close_format_rp(this.get_expected_cash()));
		this.bind_verify_events();
	}

	update_denom_item(denom) {
		imogi_pos.update_cash_denom_item(
			this.$wrapper,
			denom,
			this.denominations,
			imogi_close_format_rp,
			() => this.update_verify_ui()
		);
	}

	reset_count() {
		this.denominations = imogi_pos.init_denominations_map();
		this.render();
		frappe.show_alert({ message: __("Hitungan direset"), indicator: "blue" }, 2);
	}

	bind_verify_events() {
		this.$wrapper.find(".imogi-close-submit").on("click", () => this.submit());
		this.$wrapper.find(".imogi-close-reset").on("click", () => this.reset_count());
		this.$wrapper.find(".imogi-close-logout-btn").on("click", () => imogi_pos.logout_cashier?.({ shift_active: true }));
	}

	bind_events() {
		const $shell = this.$wrapper;

		imogi_pos.bind_cash_denom_buttons($shell, this, imogi_close_format_rp, () =>
			this.update_verify_ui()
		);

		$shell.find(".imogi-close-expenses").on("input", (e) => {
			this.expenses = Math.max(0, flt(e.target.value));
			this.update_verify_ui();
		});

		$shell.find(".imogi-close-remarks").on("input", (e) => {
			this.remarks = e.target.value;
		});

		this.bind_verify_events();
	}

	submit() {
		if (this.submitting) return;

		this.submitting = true;
		const $btn = this.$wrapper.find(".imogi-close-submit");
		$btn.prop("disabled", true).html(`<i class="fa fa-spinner fa-spin"></i> ${__("Menutup shift...")}`);

		frappe.call({
			method: "imogi_pos.api.cashier.submit_shift_closing",
			args: {
				pos_opening_entry: this.context.pos_opening_entry,
				actual_cash: this.get_actual_cash(),
				expenses: this.expenses,
				remarks: this.remarks,
				draft_name: this.context.draft_name || null,
			},
			callback: (r) => {
				this.submitting = false;
				if (r.exc) {
					this.update_verify_ui();
					return;
				}

				const result = r.message || {};
				frappe.boot.imogi_pos_has_open_shift = result.landing === "cashier";
				frappe.boot.imogi_pos_landing_target = result.landing || "opening-entry";
				imogi_pos_after_shift_closed(__("Shift berhasil ditutup. Buka shift baru."), {
					company: this.context?.company,
					pos_profile: this.context?.pos_profile,
				});
			},
		});
	}
};
