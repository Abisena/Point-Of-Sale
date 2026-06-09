frappe.provide("imogi_pos");

const IMOGI_CLOSE_DENOMINATIONS = [
	{ value: 100, label: "Rp 100" },
	{ value: 200, label: "Rp 200" },
	{ value: 500, label: "Rp 500" },
	{ value: 1000, label: "Rp 1.000" },
	{ value: 2000, label: "Rp 2.000" },
	{ value: 5000, label: "Rp 5.000" },
	{ value: 10000, label: "Rp 10.000" },
	{ value: 20000, label: "Rp 20.000" },
	{ value: 50000, label: "Rp 50.000" },
	{ value: 100000, label: "Rp 100.000" },
];

frappe.pages["imogi-pos-close-shift"].on_page_load = function (wrapper) {
	inject_close_shift_css();
	imogi_pos.sync_desk_theme?.();

	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Closing Shift Kasir"),
		single_column: true,
	});

	page.main.addClass("imogi-close-shift-page");
	$(wrapper).find(".layout-main-section-wrapper").css("max-width", "100%");
	$(wrapper).find(".page-head").hide();
	wrapper.close_shift_page = new imogi_pos.CloseShiftPage(page);
	imogi_pos.active_close_shift = wrapper.close_shift_page;
	frappe.breadcrumbs.add("Imogi POS");
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
	if (document.getElementById("imogi-close-shift-css-v5")) return;
	document.getElementById("imogi-close-shift-css-v4")?.remove();
	frappe.dom.set_style(`
		.imogi-close-shift-page .layout-main-section-wrapper,
		.imogi-close-shift-page .page-body { max-width: 100% !important; }
		.imogi-close-shift-page .page-body { background: transparent; padding: 0 !important; }
		.imogi-close-shift-page .layout-main-section { margin: 0 auto !important; max-width: 1120px; width: 100%; }
		.imogi-close-shell { margin: 0 auto; max-width: 1120px; padding: 20px 24px 32px; width: 100%; }
		.imogi-close-header { align-items: center; background: linear-gradient(145deg, #0f1f35 0%, #1a3352 100%); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; margin-bottom: 20px; padding: 18px 22px; }
		.imogi-close-header-left { min-width: 0; }
		.imogi-close-header-title { color: #fff; font-size: 22px; font-weight: 800; margin: 0 0 4px; }
		.imogi-close-header-sub { color: rgba(255,255,255,0.72); font-size: 13px; margin: 0; }
		.imogi-close-header-right { align-items: center; color: rgba(255,255,255,0.88); display: flex; flex-wrap: wrap; font-size: 13px; font-weight: 600; gap: 16px; }
		.imogi-close-layout { align-items: start; display: grid; gap: 20px; grid-template-columns: minmax(0,1fr) 320px; }
		@media (max-width: 960px) { .imogi-close-layout { grid-template-columns: 1fr; } }
		.imogi-close-main { display: grid; gap: 16px; }
		.imogi-close-card { background: #fff; border: 1px solid #e4e4e7; border-radius: 16px; padding: 18px 20px 20px; }
		.imogi-close-card-title { color: #0f1f35; font-size: 15px; font-weight: 800; margin-bottom: 14px; }
		.imogi-close-stat-grid { display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0,1fr)); }
		@media (max-width: 640px) { .imogi-close-stat-grid { grid-template-columns: 1fr; } }
		.imogi-close-stat { background: #fafafa; border: 1px solid #f4f4f5; border-radius: 12px; padding: 12px 14px; }
		.imogi-close-stat-label { color: #71717a; font-size: 12px; font-weight: 700; margin-bottom: 4px; }
		.imogi-close-stat-value { color: #0f1f35; font-size: 18px; font-weight: 800; }
		.imogi-close-pay-list { display: grid; gap: 8px; margin-top: 14px; }
		.imogi-close-pay-row { align-items: center; display: flex; font-size: 13px; justify-content: space-between; }
		.imogi-close-pay-row span { color: #71717a; }
		.imogi-close-pay-row strong { color: #0f1f35; font-variant-numeric: tabular-nums; }
		.imogi-close-cash-rows { display: grid; gap: 10px; }
		.imogi-close-cash-row { align-items: center; display: grid; gap: 12px; grid-template-columns: minmax(0,1fr) 140px; }
		.imogi-close-cash-row span { color: #52525b; font-size: 13px; font-weight: 700; }
		.imogi-close-cash-row strong { color: #0f1f35; font-size: 16px; font-variant-numeric: tabular-nums; text-align: right; }
		.imogi-close-cash-row.is-total { border-top: 1px solid #e4e4e7; margin-top: 4px; padding-top: 12px; }
		.imogi-close-input { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 10px; font-size: 14px; font-weight: 700; padding: 10px 12px; text-align: right; width: 100%; }
		.imogi-close-input:focus { background: #fff; border-color: #a1a1aa; outline: none; }
		.imogi-close-textarea { min-height: 88px; resize: vertical; text-align: left; width: 100%; }
		.imogi-close-denom-grid { display: grid; gap: 12px 16px; grid-template-columns: repeat(2, minmax(0,1fr)); }
		@media (max-width: 640px) { .imogi-close-denom-grid { grid-template-columns: 1fr; } }
		.imogi-close-denom-item label { color: #52525b; display: block; font-size: 12px; font-weight: 700; margin-bottom: 6px; }
		.imogi-close-denom-control { align-items: center; display: flex; gap: 10px; }
		.imogi-close-denom-qty { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 10px; flex: 1; font-size: 14px; font-weight: 700; min-width: 0; padding: 10px 12px; text-align: left; }
		.imogi-close-denom-eq { color: #71717a; flex-shrink: 0; font-size: 12px; font-weight: 700; min-width: 92px; text-align: right; white-space: nowrap; }
		.imogi-close-sidebar { position: sticky; top: 16px; }
		.imogi-close-verify-card { background: #fff; border: 1px solid #e4e4e7; border-radius: 16px; padding: 20px; }
		.imogi-close-verify-title { color: #0f1f35; font-size: 15px; font-weight: 800; margin-bottom: 16px; }
		.imogi-close-verify-row { align-items: center; display: flex; font-size: 13px; justify-content: space-between; padding: 8px 0; }
		.imogi-close-verify-row span { color: #71717a; }
		.imogi-close-verify-row strong { color: #0f1f35; font-variant-numeric: tabular-nums; font-weight: 800; }
		.imogi-close-diff-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; margin-top: 14px; padding: 14px; text-align: center; }
		.imogi-close-diff-box.is-surplus { background: #ecfdf5; border-color: #a7f3d0; }
		.imogi-close-diff-box.is-ok { background: #f4f4f5; border-color: #e4e4e7; }
		.imogi-close-diff-label { color: #991b1b; font-size: 12px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
		.imogi-close-diff-box.is-surplus .imogi-close-diff-label { color: #047857; }
		.imogi-close-diff-box.is-ok .imogi-close-diff-label { color: #52525b; }
		.imogi-close-diff-value { color: #991b1b; font-size: 24px; font-weight: 800; margin-top: 4px; }
		.imogi-close-diff-box.is-surplus .imogi-close-diff-value { color: #047857; }
		.imogi-close-diff-box.is-ok .imogi-close-diff-value { color: #0f1f35; }
		.imogi-close-actions { display: grid; gap: 10px; margin-top: 16px; }
		.imogi-close-btn-primary { background: #ec4899 !important; border: none !important; border-radius: 12px !important; color: #fff !important; font-size: 14px !important; font-weight: 800 !important; padding: 14px 16px !important; width: 100%; }
		.imogi-close-btn-primary.is-balanced { background: #0f1f35 !important; }
		.imogi-close-btn-secondary { background: #fff !important; border: 1px solid #d4d4d8 !important; border-radius: 12px !important; color: #0f1f35 !important; font-weight: 700 !important; padding: 12px 16px !important; width: 100%; }
		.imogi-close-loading { align-items: center; color: #a1a1aa; display: flex; flex-direction: column; gap: 12px; justify-content: center; min-height: 320px; }
	`, "imogi-close-shift-css-v5");
}

imogi_pos.CloseShiftPage = class CloseShiftPage {
	constructor(page) {
		this.page = page;
		this.$wrapper = page.main;
		this.context = null;
		this.denominations = {};
		this.expenses = 0;
		this.remarks = "";
		this.submitting = false;
		this._clock_timer = null;
		IMOGI_CLOSE_DENOMINATIONS.forEach((d) => {
			this.denominations[d.value] = 0;
		});
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
					this.denominations = {};
					IMOGI_CLOSE_DENOMINATIONS.forEach((d) => {
						this.denominations[d.value] = 0;
					});
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
		return IMOGI_CLOSE_DENOMINATIONS.reduce((sum, d) => sum + flt(this.denominations[d.value]), 0);
	}

	get_actual_cash() {
		return IMOGI_CLOSE_DENOMINATIONS.reduce(
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
		return IMOGI_CLOSE_DENOMINATIONS.map((d) => {
			const qty = flt(this.denominations[d.value]);
			const subtotal = qty * d.value;
			return `
				<div class="imogi-close-denom-item" data-denom="${d.value}">
					<label>${d.label}</label>
					<div class="imogi-close-denom-control">
						<input type="number" min="0" step="1" class="imogi-close-denom-qty"
							data-denom="${d.value}" value="${qty || ""}" placeholder="0">
						<span class="imogi-close-denom-eq">= ${imogi_close_format_rp(subtotal)}</span>
					</div>
				</div>
			`;
		}).join("");
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
							<div class="imogi-close-denom-grid">${this.render_denom_grid()}</div>
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
		const qty = flt(this.denominations[denom]);
		const subtotal = qty * denom;
		const $item = this.$wrapper.find(`.imogi-close-denom-item[data-denom="${denom}"]`);
		$item.find(".imogi-close-denom-eq").text(`= ${imogi_close_format_rp(subtotal)}`);
		this.update_verify_ui();
	}

	reset_count() {
		IMOGI_CLOSE_DENOMINATIONS.forEach((d) => {
			this.denominations[d.value] = 0;
		});
		this.render();
		frappe.show_alert({ message: __("Hitungan direset"), indicator: "blue" }, 2);
	}

	bind_verify_events() {
		this.$wrapper.find(".imogi-close-submit").on("click", () => this.submit());
		this.$wrapper.find(".imogi-close-reset").on("click", () => this.reset_count());
	}

	bind_events() {
		const $shell = this.$wrapper;

		$shell.find(".imogi-close-denom-qty").on("input", (e) => {
			const denom = flt(e.target.dataset.denom);
			this.denominations[denom] = Math.max(0, flt(e.target.value));
			this.update_denom_item(denom);
		});

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

				imogi_pos_after_shift_closed(__("Shift berhasil ditutup. Buka shift baru."));
			},
		});
	}
};
