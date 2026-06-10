frappe.provide("imogi_pos");

const IMOGI_IDR_DENOMINATIONS = [
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

frappe.pages["imogi-pos-open-shift"].on_page_load = function (wrapper) {
	inject_open_shift_css();
	imogi_pos.sync_desk_theme?.();

	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Opening Shift Kasir"),
		single_column: true,
	});

	page.main.addClass("imogi-open-shift-page");
	$(wrapper).find(".layout-main-section-wrapper").css("max-width", "100%");
	$(wrapper).find(".page-head").hide();
	wrapper.open_shift_page = new imogi_pos.OpenShiftPage(page);
	imogi_pos.active_open_shift = wrapper.open_shift_page;
	frappe.breadcrumbs.add("Imogi POS");
};

frappe.pages["imogi-pos-open-shift"].on_page_show = function (wrapper) {
	imogi_pos.sync_desk_theme?.();
	wrapper.open_shift_page?.refresh?.();
};

function imogi_open_shift_format_rp(val) {
	return format_currency(flt(val), frappe.defaults.get_default("currency") || "IDR");
}

function imogi_open_shift_format_date_long() {
	return imogi_pos.format_local_date_long();
}

function inject_open_shift_css() {
	if (document.getElementById("imogi-open-shift-inline-css-v7")) return;
	document.getElementById("imogi-open-shift-inline-css-v6")?.remove();
	frappe.dom.set_style(`
		.imogi-open-shift-page .layout-main-section-wrapper,
		.imogi-open-shift-page .page-body { max-width: 100% !important; }
		.imogi-open-shift-page .page-body { background: transparent; padding: 0 !important; }
		.imogi-open-shift-page .layout-main-section { margin: 0 !important; }
		.imogi-shift-shell { margin: 0 auto; max-width: 1080px; padding: 20px 24px 32px; width: 100%; }
		.imogi-shift-header { align-items: center; background: linear-gradient(145deg, #0f1f35 0%, #1a3352 100%); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; margin-bottom: 20px; padding: 18px 22px; }
		.imogi-shift-header-left { align-items: center; display: flex; gap: 14px; min-width: 0; }
		.imogi-shift-store-icon { align-items: center; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18); border-radius: 12px; color: #fff; display: flex; flex-shrink: 0; font-size: 20px; height: 48px; justify-content: center; width: 48px; }
		.imogi-shift-header-title { color: #fff; font-size: 22px; font-weight: 800; letter-spacing: -.02em; margin: 0 0 2px; }
		.imogi-shift-header-sub { color: rgba(255,255,255,0.72); font-size: 13px; margin: 0; }
		.imogi-shift-header-right { align-items: center; color: rgba(255,255,255,0.88); display: flex; flex-wrap: wrap; font-size: 13px; font-weight: 600; gap: 16px; }
		.imogi-shift-header-right span { align-items: center; display: inline-flex; gap: 6px; }
		.imogi-shift-btn-logout { background: rgba(255,255,255,0.12) !important; border: 1px solid rgba(255,255,255,0.24) !important; border-radius: 10px !important; color: #fff !important; font-size: 13px !important; font-weight: 700 !important; padding: 8px 14px !important; }
		.imogi-shift-btn-logout:hover { background: rgba(255,255,255,0.2) !important; color: #fff !important; }
		.imogi-shift-layout { align-items: start; display: grid; gap: 20px; grid-template-columns: minmax(0,1fr) 300px; }
		@media (max-width: 900px) { .imogi-shift-layout { grid-template-columns: 1fr; } }
		.imogi-shift-main { display: grid; gap: 16px; }
		.imogi-shift-card { background: #fff; border: 1px solid #e4e4e7; border-radius: 16px; padding: 18px 20px 20px; }
		.imogi-shift-card-title { align-items: center; color: #0f1f35; display: flex; font-size: 15px; font-weight: 800; gap: 8px; margin-bottom: 16px; }
		.imogi-shift-card-title .fa { color: #71717a; font-size: 14px; }
		.imogi-shift-field label { color: #52525b; display: block; font-size: 12px; font-weight: 700; margin-bottom: 6px; }
		.imogi-shift-input { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 10px; color: #0f1f35; font-size: 14px; padding: 11px 14px; width: 100%; }
		.imogi-shift-input:focus { background: #fff; border-color: #a1a1aa; box-shadow: none; outline: none; }
		.imogi-shift-input[readonly] { color: #52525b; cursor: default; }
		.imogi-shift-textarea { min-height: 88px; resize: vertical; }
		.imogi-shift-denom-grid { display: grid; gap: 12px 16px; grid-template-columns: repeat(2, minmax(0,1fr)); }
		@media (max-width: 640px) { .imogi-shift-denom-grid { grid-template-columns: 1fr; } }
		.imogi-shift-denom-item label { color: #52525b; display: block; font-size: 12px; font-weight: 700; margin-bottom: 6px; }
		.imogi-shift-denom-control { align-items: center; display: flex; gap: 10px; }
		.imogi-shift-denom-qty { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 10px; flex: 1; font-size: 14px; font-weight: 700; min-width: 0; padding: 10px 12px; text-align: left; }
		.imogi-shift-denom-qty:focus { background: #fff; border-color: #a1a1aa; outline: none; }
		.imogi-shift-denom-eq { color: #71717a; flex-shrink: 0; font-size: 12px; font-variant-numeric: tabular-nums; font-weight: 700; min-width: 92px; text-align: right; white-space: nowrap; }
		.imogi-shift-sidebar { position: sticky; top: 16px; }
		.imogi-shift-summary-card { background: #fff; border: 1px solid #e4e4e7; border-radius: 16px; padding: 20px; }
		.imogi-shift-summary-title { color: #0f1f35; font-size: 15px; font-weight: 800; margin-bottom: 18px; }
		.imogi-shift-summary-row { align-items: center; border-bottom: 1px solid #f4f4f5; display: flex; font-size: 13px; justify-content: space-between; padding: 10px 0; }
		.imogi-shift-summary-row:last-of-type { border-bottom: none; }
		.imogi-shift-summary-row span { color: #71717a; }
		.imogi-shift-summary-row strong { color: #0f1f35; font-variant-numeric: tabular-nums; font-weight: 800; }
		.imogi-shift-balance-block { border-top: 1px solid #f4f4f5; margin-top: 8px; padding-top: 16px; }
		.imogi-shift-balance-label { color: #71717a; font-size: 12px; font-weight: 700; margin-bottom: 4px; }
		.imogi-shift-balance-value { color: #0f1f35; font-size: 28px; font-weight: 800; letter-spacing: -.02em; line-height: 1.1; }
		.imogi-shift-actions { display: grid; gap: 10px; margin-top: 18px; }
		.imogi-shift-btn-primary { align-items: center; background: #0f1f35 !important; border: none !important; border-radius: 12px !important; color: #fff !important; display: inline-flex !important; font-size: 14px !important; font-weight: 800 !important; gap: 8px; justify-content: center; padding: 14px 16px !important; width: 100%; }
		.imogi-shift-btn-primary:disabled { opacity: .4; }
		.imogi-shift-btn-secondary { background: #fff !important; border: 1px solid #d4d4d8 !important; border-radius: 12px !important; color: #0f1f35 !important; font-size: 14px !important; font-weight: 700 !important; padding: 12px 16px !important; width: 100%; }
		.imogi-shift-btn-link { background: none; border: none; color: #71717a; cursor: pointer; font-size: 12px; font-weight: 600; margin-top: 8px; padding: 0; text-decoration: underline; width: 100%; }
		.imogi-shift-loading { align-items: center; color: #a1a1aa; display: flex; flex-direction: column; gap: 12px; justify-content: center; min-height: 320px; }
	`, "imogi-open-shift-inline-css-v7");
}

imogi_pos.OpenShiftPage = class OpenShiftPage {
	constructor(page) {
		this.page = page;
		this.$wrapper = page.main;
		this.context = null;
		this.amounts = {};
		this.denominations = {};
		this.remarks = "";
		this.submitting = false;
		this.saving_draft = false;
		this._clock_timer = null;
		IMOGI_IDR_DENOMINATIONS.forEach((d) => {
			this.denominations[d.value] = 0;
		});
		this.render_shell();
		this.enable_lock();
		this.load_context();
	}

	render_shell() {
		this.$wrapper.html(`
			<div class="imogi-shift-shell">
				<div class="imogi-shift-loading">
					<i class="fa fa-spinner fa-spin fa-2x"></i>
					<div>${__("Memuat opening shift...")}</div>
				</div>
			</div>
		`);
	}

	enable_lock() {
		if (!imogi_pos_requires_shift_workflow()) {
			return;
		}

		imogi_pos.opening_entry_locked = true;
		imogi_pos.opening_entry_docname = null;
		if (!this._lock_banner) {
			this._lock_banner = true;
			frappe.show_alert(
				{
					message: __("Hitung saldo awal lalu klik <b>Buka Shift</b> untuk mulai."),
					indicator: "orange",
				},
				6
			);
		}
	}

	clear_lock() {
		imogi_pos.opening_entry_locked = false;
		imogi_pos.opening_entry_docname = null;
		if (this._clock_timer) {
			clearInterval(this._clock_timer);
			this._clock_timer = null;
		}
		try {
			sessionStorage.removeItem("imogi_pos_opening_route_options");
		} catch (e) {
			// ignore
		}
	}

	load_context() {
		const opts = frappe.route_options || {};
		const args = {};
		if (opts.pos_profile) args.pos_profile = opts.pos_profile;
		if (opts.branch) args.branch = opts.branch;
		frappe.call({
			method: "imogi_pos.api.cashier.get_shift_opening_page_context",
			args,
			callback: (r) => {
				if (r.exc) {
					this.$wrapper.find(".imogi-shift-loading").html(`
						<div class="text-danger">${__("Gagal memuat opening shift.")}</div>
					`);
					return;
				}
				if (r.message?.already_open) {
					this.clear_lock();
					frappe.set_route("imogi-pos-cashier");
					return;
				}
				this.reset_form_state();
				this.context = r.message;
				this.cash_mode = r.message.cash_mode;
				this.remarks = r.message.remarks || "";
				(r.message.payments || []).forEach((row) => {
					this.amounts[row.mode_of_payment] = flt(row.opening_amount);
				});
				if (this.cash_mode && this.amounts[this.cash_mode] === undefined) {
					this.amounts[this.cash_mode] = 0;
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
		this.reset_form_state();
		this.load_context();
	}

	shift_api_args(extra = {}) {
		const opts = frappe.route_options || {};
		const args = { ...(extra || {}) };
		if (this.context?.pos_profile) args.pos_profile = this.context.pos_profile;
		else if (opts.pos_profile) args.pos_profile = opts.pos_profile;
		if (opts.branch) args.branch = opts.branch;
		return args;
	}

	reset_form_state() {
		this.submitting = false;
		this.saving_draft = false;
		this.amounts = {};
		this.remarks = "";
		IMOGI_IDR_DENOMINATIONS.forEach((d) => {
			this.denominations[d.value] = 0;
		});
	}

	get_cash_mode() {
		return this.cash_mode || this.context?.cash_mode || "Cash";
	}

	get_total_sheets() {
		return IMOGI_IDR_DENOMINATIONS.reduce((sum, d) => sum + flt(this.denominations[d.value]), 0);
	}

	get_denomination_total() {
		return IMOGI_IDR_DENOMINATIONS.reduce(
			(sum, d) => sum + flt(this.denominations[d.value]) * d.value,
			0
		);
	}

	sync_cash_from_denominations() {
		const cash_mode = this.get_cash_mode();
		if (!cash_mode) return;
		this.amounts = {
			[cash_mode]: this.get_denomination_total(),
		};
	}

	get_opening_total() {
		this.sync_cash_from_denominations();
		return flt(this.amounts[this.get_cash_mode()]);
	}

	has_valid_amount() {
		return this.get_opening_total() > 0;
	}

	build_payments() {
		this.sync_cash_from_denominations();
		const cash_mode = this.get_cash_mode();
		return [
			{
				mode_of_payment: cash_mode,
				opening_amount: flt(this.amounts[cash_mode]),
			},
		];
	}

	get_store_label() {
		const ctx = this.context || {};
		if (ctx.company && ctx.pos_profile) {
			return `${ctx.company} — ${ctx.pos_profile}`;
		}
		return ctx.company || ctx.pos_profile || "-";
	}

	get_time_string() {
		return imogi_pos.format_local_time();
	}

	render_denom_grid() {
		return IMOGI_IDR_DENOMINATIONS.map((d) => {
			const qty = flt(this.denominations[d.value]);
			const subtotal = qty * d.value;
			return `
				<div class="imogi-shift-denom-item" data-denom="${d.value}">
					<label>${d.label}</label>
					<div class="imogi-shift-denom-control">
						<input type="number" min="0" step="1" class="imogi-shift-denom-qty"
							data-denom="${d.value}" value="${qty || ""}" placeholder="0">
						<span class="imogi-shift-denom-eq">= ${imogi_open_shift_format_rp(subtotal)}</span>
					</div>
				</div>
			`;
		}).join("");
	}

	render_summary_html() {
		const cash_total = this.get_denomination_total();
		const total_sheets = this.get_total_sheets();

		return `
			<div class="imogi-shift-summary-row">
				<span>${__("Total Lembar")}</span>
				<strong class="imogi-shift-total-sheets">${total_sheets} ${__("lembar")}</strong>
			</div>
			<div class="imogi-shift-balance-block">
				<div class="imogi-shift-balance-label">${__("Saldo Awal (Cash)")}</div>
				<div class="imogi-shift-balance-value imogi-shift-balance-display">${imogi_open_shift_format_rp(
					cash_total
				)}</div>
			</div>
		`;
	}

	render() {
		const ctx = this.context;
		const date_long = imogi_open_shift_format_date_long();
		const time_str = this.get_time_string();
		const show_logout =
			typeof imogi_pos_requires_shift_workflow === "function" && imogi_pos_requires_shift_workflow();

		this.$wrapper.html(`
			<div class="imogi-shift-shell">
				<div class="imogi-shift-header">
					<div class="imogi-shift-header-left">
						<div class="imogi-shift-store-icon"><i class="fa fa-shopping-bag"></i></div>
						<div>
							<h1 class="imogi-shift-header-title">${__("Opening Shift Kasir")}</h1>
							<p class="imogi-shift-header-sub">${frappe.utils.escape_html(this.get_store_label())}</p>
						</div>
					</div>
					<div class="imogi-shift-header-right">
						<span><i class="fa fa-calendar-o"></i> <span class="imogi-shift-date">${frappe.utils.escape_html(date_long)}</span></span>
						<span><i class="fa fa-clock-o"></i> <span class="imogi-shift-clock">${time_str}</span></span>
						${
							show_logout
								? `<button type="button" class="btn imogi-shift-btn-logout imogi-shift-logout-btn"><i class="fa fa-sign-out"></i> ${__(
										"Logout"
								  )}</button>`
								: ""
						}
					</div>
				</div>

				<div class="imogi-shift-layout">
					<div class="imogi-shift-main">
						<div class="imogi-shift-card">
							<div class="imogi-shift-card-title"><i class="fa fa-user"></i> ${__(
								"Informasi Kasir"
							)}</div>
							<div class="imogi-shift-field">
								<label>${__("Nama Kasir")}</label>
								<input type="text" class="imogi-shift-input" readonly
									value="${frappe.utils.escape_html(ctx.user_fullname || ctx.user || "")}">
							</div>
						</div>

						<div class="imogi-shift-card">
							<div class="imogi-shift-card-title"><i class="fa fa-money"></i> ${__(
								"Hitung Uang Tunai"
							)}</div>
							<div class="imogi-shift-denom-grid">${this.render_denom_grid()}</div>
						</div>

						<div class="imogi-shift-card">
							<div class="imogi-shift-card-title">${__("Catatan")}</div>
							<textarea class="imogi-shift-input imogi-shift-textarea imogi-shift-remarks" placeholder="${__(
								"Tambahkan catatan jika diperlukan..."
							)}">${frappe.utils.escape_html(this.remarks || "")}</textarea>
						</div>
					</div>

					<div class="imogi-shift-sidebar">
						<div class="imogi-shift-summary-card">
							<div class="imogi-shift-summary-title">${__("Ringkasan")}</div>
							<div class="imogi-shift-summary-body">${this.render_summary_html()}</div>
							<div class="imogi-shift-actions">
								<button type="button" class="btn imogi-shift-btn-primary imogi-shift-submit" ${
									this.has_valid_amount() ? "" : "disabled"
								}>
									<i class="fa fa-check-circle"></i> ${__("Buka Shift")}
								</button>
								<button type="button" class="btn imogi-shift-btn-secondary imogi-shift-reset">${__(
									"Reset"
								)}</button>
								<button type="button" class="imogi-shift-btn-link imogi-shift-draft">${__(
									"Simpan draft"
								)}</button>
							</div>
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
			this.$wrapper.find(".imogi-shift-clock").text(this.get_time_string());
			this.$wrapper.find(".imogi-shift-date").text(imogi_pos.format_local_date_long());
		};
		tick();
		this._clock_timer = setInterval(tick, 1000);
	}

	update_summary() {
		this.sync_cash_from_denominations();
		this.$wrapper.find(".imogi-shift-summary-body").html(this.render_summary_html());
		this.$wrapper.find(".imogi-shift-submit").prop("disabled", !this.has_valid_amount());
	}

	update_denom_item(denom) {
		const qty = flt(this.denominations[denom]);
		const subtotal = qty * denom;
		const $item = this.$wrapper.find(`.imogi-shift-denom-item[data-denom="${denom}"]`);
		$item.find(".imogi-shift-denom-eq").text(`= ${imogi_open_shift_format_rp(subtotal)}`);
		this.update_summary();
	}

	reset_form() {
		this.reset_form_state();
		const cash_mode = this.get_cash_mode();
		if (cash_mode) {
			this.amounts = { [cash_mode]: 0 };
		}
		this.render();
		frappe.show_alert({ message: __("Form direset"), indicator: "blue" }, 2);
	}

	bind_events() {
		const $shell = this.$wrapper;

		$shell.find(".imogi-shift-denom-qty").on("input", (e) => {
			const denom = flt(e.target.dataset.denom);
			this.denominations[denom] = Math.max(0, flt(e.target.value));
			this.update_denom_item(denom);
		});

		$shell.find(".imogi-shift-remarks").on("input", (e) => {
			this.remarks = e.target.value;
		});

		$shell.find(".imogi-shift-reset").on("click", () => this.reset_form());
		$shell.find(".imogi-shift-draft").on("click", () => this.save_draft());
		$shell.find(".imogi-shift-submit").on("click", () => this.submit());
		$shell.find(".imogi-shift-logout-btn").on("click", () => imogi_pos.logout_cashier?.());
	}

	save_draft() {
		if (this.saving_draft || this.submitting) return;

		this.saving_draft = true;
		frappe.call({
			method: "imogi_pos.api.cashier.save_shift_opening_draft",
			args: {
				...this.shift_api_args(),
				payments: this.build_payments(),
				draft_name: this.context?.draft_name || null,
				remarks: this.remarks,
			},
			callback: (r) => {
				this.saving_draft = false;
				if (r.exc) return;
				this.context.draft_name = r.message.name;
				frappe.show_alert({ message: __("Draft tersimpan"), indicator: "green" }, 3);
			},
		});
	}

	submit() {
		if (this.submitting || !this.has_valid_amount()) return;

		this.submitting = true;
		const $btn = this.$wrapper.find(".imogi-shift-submit");
		$btn.prop("disabled", true).html(`<i class="fa fa-spinner fa-spin"></i> ${__("Membuka shift...")}`);

		frappe.call({
			method: "imogi_pos.api.cashier.submit_shift_opening",
			args: {
				...this.shift_api_args(),
				payments: this.build_payments(),
				draft_name: this.context?.draft_name || null,
				remarks: this.remarks,
			},
			callback: (r) => {
				this.submitting = false;
				if (r.exc) {
					$btn.prop("disabled", !this.has_valid_amount()).html(
						`<i class="fa fa-check-circle"></i> ${__("Buka Shift")}`
					);
					return;
				}

				$btn.prop("disabled", false).html(
					`<i class="fa fa-check-circle"></i> ${__("Buka Shift")}`
				);
				this.clear_lock();
				frappe.boot.imogi_pos_landing_target = "cashier";
				frappe.boot.imogi_pos_has_open_shift = true;
				const msg = r.message || {};
				if (msg.branch_code) {
					try {
						localStorage.setItem("imogi_cashier_branch_v1", msg.branch_code);
					} catch (e) {
						/* ignore */
					}
				}
				if (imogi_pos.active_cashier) {
					imogi_pos.active_cashier._catalog_mem = {};
				}
				frappe.show_alert(
					{ message: __("Shift berhasil dibuka. Selamat bekerja!"), indicator: "green" },
					4
				);
				setTimeout(() => frappe.set_route("imogi-pos-cashier"), 600);
			},
		});
	}
};
