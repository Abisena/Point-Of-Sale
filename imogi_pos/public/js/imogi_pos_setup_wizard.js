frappe.provide("imogi_pos");

const IMOGI_WIZARD_STEPS = 9;

imogi_pos.SetupWizard9 = class SetupWizard9 {
	constructor(wrapper) {
		this.$wrapper = $(wrapper).find(".layout-main-section");
		this.step = 1;
		this.session = {};
		this.templates = [];
		this.payment_methods = [];
		this.product_tab = "manual";
		this.init();
	}

	init() {
		frappe.require("/assets/imogi_pos/css/imogi_pos_setup_wizard.css", () => {
			frappe.call({
				method: "imogi_pos.api.setup_wizard_api.get_wizard_state",
				callback: (r) => {
					const data = r.message || {};
					if (data.setup_complete) {
						frappe.set_route("imogi-pos");
						return;
					}
					this.session = data.session || {};
					this.templates = data.business_templates || [];
					this.payment_methods = data.payment_methods || [];
					this.steps_meta = data.steps || [];
					this.step = cint(this.session.current_step) || 1;
					this.render_shell();
				},
			});
		});
	}

	render_shell() {
		this.$wrapper.html(`
			<div class="imogi-wizard-shell">
				<aside class="imogi-wizard-sidebar">
					<div class="imogi-wizard-brand">
						<h5>POS IMOGI Dev</h5>
						<small>${__("Setup toko pertama kali")}</small>
					</div>
					<ul class="imogi-wizard-steps"></ul>
					<div class="imogi-wizard-progress">
						<div class="imogi-wizard-progress-bar">
							<div class="imogi-wizard-progress-fill" style="width:${(this.step / IMOGI_WIZARD_STEPS) * 100}%"></div>
						</div>
						<small class="text-muted d-block mt-2">${this.step} ${__("dari")} ${IMOGI_WIZARD_STEPS} ${__("langkah")}</small>
					</div>
				</aside>
				<div class="imogi-wizard-main">
					<div class="imogi-wizard-content"></div>
					<div class="imogi-wizard-footer">
						<span class="imogi-wizard-footer-hint"></span>
						<div class="imogi-wizard-footer-actions">
							<button class="btn btn-default btn-wiz-back" ${this.step === 1 ? "disabled" : ""}>${__("Kembali")}</button>
							<button class="btn btn-primary btn-wiz-next">${this.step === 9 ? __("Selesai — buka kasir") : __("Lanjut →")}</button>
						</div>
					</div>
				</div>
			</div>
		`);

		this.render_sidebar();
		this.render_step();
		this.$wrapper.find(".btn-wiz-back").on("click", () => this.go(-1));
		this.$wrapper.find(".btn-wiz-next").on("click", () => this.go(1));
	}

	render_sidebar() {
		const $ul = this.$wrapper.find(".imogi-wizard-steps");
		$ul.empty();
		(this.steps_meta || []).forEach((s) => {
			const cls = s.no === this.step ? "active" : s.no < this.step ? "done" : "";
			const icon = s.no < this.step ? "✓" : s.no;
			$ul.append(`
				<li class="imogi-wizard-step-item ${cls}">
					<div class="imogi-wizard-step-num">${icon}</div>
					<div>
						<div class="imogi-wizard-step-title">${frappe.utils.escape_html(s.title)}</div>
						<div class="imogi-wizard-step-hint">${frappe.utils.escape_html(s.hint)}</div>
					</div>
				</li>
			`);
		});
		const current = (this.steps_meta || []).find((s) => s.no === this.step);
		this.$wrapper.find(".imogi-wizard-footer-hint").text(current ? current.hint : "");
	}

	render_step() {
		const $c = this.$wrapper.find(".imogi-wizard-content");
		const renderers = {
			1: () => this.render_step1($c),
			2: () => this.render_step2($c),
			3: () => this.render_step3($c),
			4: () => this.render_step4($c),
			5: () => this.render_step5($c),
			6: () => this.render_step6($c),
			7: () => this.render_step7($c),
			8: () => this.render_step8($c),
			9: () => this.render_step9($c),
		};
		(renderers[this.step] || renderers[1])();
		this.$wrapper.find(".imogi-wizard-progress-fill").css("width", `${(this.step / IMOGI_WIZARD_STEPS) * 100}%`);
		this.$wrapper.find(".btn-wiz-back").prop("disabled", this.step === 1);
		this.$wrapper.find(".btn-wiz-next").text(this.step === 9 ? __("Selesai — buka kasir") : __("Lanjut →"));
	}

	_header($c, title, desc) {
		$c.html(`
			<div class="imogi-wizard-kicker">${__("Langkah")} ${this.step} ${__("dari")} ${IMOGI_WIZARD_STEPS}</div>
			<h3>${title}</h3>
			<p class="imogi-wizard-desc">${desc}</p>
			<div class="imogi-wizard-body"></div>
		`);
		return $c.find(".imogi-wizard-body");
	}

	render_step1($c) {
		const $b = this._header(
			$c,
			__("Identitas toko"),
			__("Nama ini tampil di struk dan laporan. WA owner untuk notif void dan anomali.")
		);
		$b.html(`
			<div class="row">
				<div class="col-md-8">
					<div class="form-group"><label>${__("Nama toko")} *</label>
					<input type="text" class="form-control" data-f="store_name" value="${frappe.utils.escape_html(this.session.store_name || "")}" placeholder="${__("Nama toko Anda")}"></div>
					<small class="text-muted">${__("Di sistem → company_name di ERPNext. Currency IDR + fiscal year Jan–Des dibuat otomatis.")}</small>
					<div class="form-group mt-3"><label>${__("Kota / kabupaten")}</label>
					<input type="text" class="form-control" data-f="store_city" value="${frappe.utils.escape_html(this.session.store_city || "")}"></div>
					<div class="form-group"><label>${__("Nomor WA owner")} *</label>
					<input type="text" class="form-control" data-f="owner_whatsapp" value="${frappe.utils.escape_html(this.session.owner_whatsapp || "")}"></div>
					<div class="row mt-3">
						<div class="col"><label>${__("Jam buka")}</label><input type="time" class="form-control" data-f="opening_time" value="${this.session.opening_time || "07:00:00"}"></div>
						<div class="col"><label>${__("Jam tutup")}</label><input type="time" class="form-control" data-f="closing_time" value="${this.session.closing_time || "22:00:00"}"></div>
					</div>
					<small class="text-muted d-block mt-1">${__("→ Shift Type + laporan per jam.")}</small>
					<div class="form-check mt-3">
						<input class="form-check-input" type="checkbox" data-f="multi_branch" id="wiz-multi-branch" ${this.session.multi_branch ? "checked" : ""}>
						<label class="form-check-label" for="wiz-multi-branch">${__("Toko punya cabang (multi cabang)")}</label>
					</div>
					<div class="form-group mt-2 branch-field" style="${this.session.multi_branch ? "" : "display:none"}">
						<label>${__("Nama cabang utama / gudang")}</label>
						<input type="text" class="form-control" data-f="branch_name" value="${frappe.utils.escape_html(this.session.branch_name || "Stores")}" placeholder="Stores">
						<small class="text-muted">${__("Cabang tambahan bisa ditambah nanti dari menu Warehouse.")}</small>
					</div>
				</div>
			</div>
		`);
		$b.find("#wiz-multi-branch").on("change", (e) => {
			$b.find(".branch-field").toggle(e.target.checked);
		});
	}

	render_step2($c) {
		const $b = this._header(
			$c,
			__("Jenis usaha"),
			__("Setiap template set COA, Item Group, Tax Template, dan Tax Rule otomatis.")
		);
		const selected = this.session.business_type;
		let cards = `<div class="imogi-type-grid">`;
		this.templates.forEach((t) => {
			cards += `
				<div class="imogi-type-card ${selected === t.value ? "selected" : ""}" data-type="${frappe.utils.escape_html(t.value)}">
					<i class="fa ${t.icon || "fa-store"} fa-lg text-muted"></i>
					<h5>${frappe.utils.escape_html(t.title)}</h5>
					<p class="text-muted small mb-0">${frappe.utils.escape_html(t.subtitle)}</p>
					<div class="imogi-type-badges">${(t.badges || []).map((b) => `<span class="imogi-type-badge">${frappe.utils.escape_html(b)}</span>`).join("")}</div>
				</div>`;
		});
		cards += `</div><div class="imogi-type-preview imogi-type-preview-box"></div>`;
		$b.html(cards);

		const showPreview = (val) => {
			const t = this.templates.find((x) => x.value === val);
			if (!t) return;
			this.session.business_type = val;
			$b.find(".imogi-type-preview-box").html(`
				<strong>${__("Yang dibuat otomatis")}:</strong><br>
				${__("Tax Template")}: ${frappe.utils.escape_html(t.preview.tax_template || "-")}<br>
				${__("COA")}: ${frappe.utils.escape_html(t.preview.coa || "-")}<br>
				${__("Item Group")}: ${frappe.utils.escape_html(t.preview.item_groups || "-")}<br>
				${__("Customer Group")}: ${frappe.utils.escape_html(t.preview.customer_groups || "-")}
			`);
		};

		$b.find(".imogi-type-card").on("click", (e) => {
			const $card = $(e.currentTarget);
			$b.find(".imogi-type-card").removeClass("selected");
			$card.addClass("selected");
			showPreview($card.data("type"));
		});
		if (selected) showPreview(selected);
	}

	render_step3($c) {
		const $b = this._header(
			$c,
			__("Kasir pertama"),
			__("Kasir butuh akun untuk login ke POS. Minimal 1 sekarang.")
		);
		const rows = (this.session.cashiers || [])
			.map(
				(r, i) => `<tr data-idx="${i}"><td>${frappe.utils.escape_html(r.full_name)}</td><td>${frappe.utils.escape_html(r.login_id)}</td><td><button class="btn btn-xs btn-default btn-rm-cashier">×</button></td></tr>`
			)
			.join("");
		$b.html(`
			<div class="row"><div class="col-md-8">
				<div class="form-group"><label>${__("Nama kasir")}</label><input class="form-control" id="wiz-cashier-name"></div>
				<div class="form-group"><label>${__("Nomor HP / email")}</label><input class="form-control" id="wiz-cashier-login"></div>
				<div class="form-group"><label>${__("Password sementara")}</label><input type="password" class="form-control" id="wiz-cashier-pass" placeholder="${__("min. 8 karakter")}"></div>
				<button class="btn btn-primary btn-sm" id="wiz-add-cashier">${__("Tambah kasir")}</button>
				<table class="imogi-wizard-table mt-3"><thead><tr><th>${__("Nama")}</th><th>${__("Login")}</th><th></th></tr></thead><tbody>${rows}</tbody></table>
			</div></div>
			<div class="alert alert-info small mt-3">${__("User dibuat dengan role IMOGI Cashier dan tersimpan di DocType User.")}</div>
		`);
		$b.find("#wiz-add-cashier").on("click", () => {
			const full_name = $b.find("#wiz-cashier-name").val().trim();
			const login_id = $b.find("#wiz-cashier-login").val().trim();
			const temp_password = $b.find("#wiz-cashier-pass").val();
			if (!full_name || !login_id) {
				frappe.msgprint(__("Nama dan login wajib"));
				return;
			}
			if (temp_password && temp_password.length < 8) {
				frappe.msgprint(__("Password minimal 8 karakter"));
				return;
			}
			this.session.cashiers = this.session.cashiers || [];
			this.session.cashiers.push({
				full_name,
				login_id,
				temp_password,
				role: "IMOGI Cashier",
			});
			this.render_step();
		});
		$b.find(".btn-rm-cashier").on("click", (e) => {
			const idx = $(e.currentTarget).closest("tr").data("idx");
			this.session.cashiers.splice(idx, 1);
			this.render_step();
		});
	}

	render_step4($c) {
		const $b = this._header(
			$c,
			__("Produk awal"),
			__("Bisa 0 produk — tambah nanti. Harga Modal penting untuk laporan margin.")
		);
		const products = this.session.products || [];
		$b.html(`
			<ul class="nav nav-tabs imogi-product-tabs mb-3">
				<li class="nav-item"><a class="nav-link ${this.product_tab === "manual" ? "active" : ""}" data-tab="manual">${__("Ketik manual")}</a></li>
				<li class="nav-item"><a class="nav-link ${this.product_tab === "barcode" ? "active" : ""}" data-tab="barcode">${__("Scan barcode")}</a></li>
				<li class="nav-item"><a class="nav-link ${this.product_tab === "excel" ? "active" : ""}" data-tab="excel">${__("Import Excel")}</a></li>
			</ul>
			<div class="imogi-product-panel"></div>
			<table class="imogi-wizard-table mt-3"><thead><tr><th>${__("Produk")}</th><th>${__("Kategori")}</th><th>${__("Jual")}</th><th>${__("Modal")}</th><th>${__("Stok")}</th><th></th></tr></thead>
			<tbody>${products.map((p, i) => `<tr data-idx="${i}"><td>${frappe.utils.escape_html(p.item_name)}</td><td>${frappe.utils.escape_html(p.category || "")}</td><td>${p.selling_rate || 0}</td><td>${p.valuation_rate || 0}</td><td>${p.opening_qty || 0}</td><td><button class="btn btn-xs btn-default btn-rm-product">×</button></td></tr>`).join("")}</tbody></table>
		`);
		const $panel = $b.find(".imogi-product-panel");
		if (this.product_tab === "manual") {
			$panel.html(`
				<div class="row align-items-end">
					<div class="col"><input class="form-control form-control-sm" id="p-name" placeholder="${__("Nama produk")}"></div>
					<div class="col"><input class="form-control form-control-sm" id="p-cat" placeholder="${__("Kategori")}"></div>
					<div class="col"><input class="form-control form-control-sm" id="p-sell" type="number" placeholder="${__("Harga jual")}"></div>
					<div class="col"><input class="form-control form-control-sm" id="p-cost" type="number" placeholder="${__("Harga modal")}"></div>
					<div class="col"><input class="form-control form-control-sm" id="p-qty" type="number" placeholder="${__("Stok awal")}"></div>
					<div class="col-auto"><button class="btn btn-primary btn-sm" id="wiz-add-product">+</button></div>
				</div>
			`);
			$panel.find("#wiz-add-product").on("click", () => this._add_product_from_form($panel));
		} else if (this.product_tab === "barcode") {
			$panel.html(`
				<input class="form-control" id="wiz-barcode" placeholder="${__("Scan atau ketik barcode lalu Enter")}">
				<small class="text-muted">${__("Jika item sudah ada di ERPNext, data akan diambil otomatis.")}</small>
			`);
			$panel.find("#wiz-barcode").on("keypress", (e) => {
				if (e.which !== 13) return;
				const code = $(e.target).val().trim();
				frappe.call({
					method: "imogi_pos.api.setup_wizard_api.lookup_barcode",
					args: { barcode: code },
					callback: (r) => {
						if (!r.message) {
							frappe.show_alert({ message: __("Item tidak ditemukan"), indicator: "orange" });
							return;
						}
						const item = r.message;
						this.session.products = this.session.products || [];
						this.session.products.push({
							item_name: item.item_name,
							category: item.item_group,
							selling_rate: item.standard_rate,
							valuation_rate: item.valuation_rate,
							barcode: code,
							opening_qty: 0,
						});
						this.render_step();
					},
				});
			});
		} else {
			$panel.html(`
				<p class="small text-muted">${__("Import menu lengkap, produk saja, BOM, atau stok — sama seperti di IMOGI POS Settings.")}</p>
				<button class="btn btn-default btn-sm mr-2" id="wiz-import-menu">${__("Import Menu Lengkap")}</button>
				<button class="btn btn-default btn-sm mr-2" id="wiz-import-product">${__("Import Produk")}</button>
				<button class="btn btn-default btn-sm mr-2" id="wiz-import-bom">${__("Import BOM")}</button>
				<button class="btn btn-default btn-sm" id="wiz-import-stock">${__("Import Stok Bahan")}</button>
			`);
			$panel.find("#wiz-import-menu").on("click", () => this._open_import_dialog("menu"));
			$panel.find("#wiz-import-product").on("click", () => this._open_import_dialog("product"));
			$panel.find("#wiz-import-bom").on("click", () => this._open_import_dialog("bom"));
			$panel.find("#wiz-import-stock").on("click", () => this._open_import_dialog("stock"));
		}
		$b.find(".nav-link").on("click", (e) => {
			e.preventDefault();
			this.product_tab = $(e.currentTarget).data("tab");
			this.render_step();
		});
		$b.find(".btn-rm-product").on("click", (e) => {
			this.session.products.splice($(e.currentTarget).closest("tr").data("idx"), 1);
			this.render_step();
		});
	}

	_add_product_from_form($panel) {
		const item_name = $panel.find("#p-name").val().trim();
		if (!item_name) return;
		this.session.products = this.session.products || [];
		this.session.products.push({
			item_name,
			category: $panel.find("#p-cat").val().trim(),
			selling_rate: flt($panel.find("#p-sell").val()),
			valuation_rate: flt($panel.find("#p-cost").val()),
			opening_qty: flt($panel.find("#p-qty").val()),
		});
		this.render_step();
	}

	_open_import_dialog(kind) {
		const methods = {
			menu: "imogi_pos.api.menu_import_api.import_menu_from_file",
			product: "imogi_pos.api.import_api.import_products_from_csv",
			bom: "imogi_pos.api.import_api.import_bom_from_csv",
			stock: "imogi_pos.api.stock_import_api.import_stock_from_file",
		};
		const dialog = new frappe.ui.Dialog({
			title: __("Import Excel / CSV"),
			fields: [{ fieldname: "file", fieldtype: "Attach", label: __("File"), reqd: 1 }],
			primary_action_label: __("Import"),
			primary_action(values) {
				frappe.call({
					method: methods[kind],
					args: { file_url: values.file },
					freeze: true,
					callback() {
						dialog.hide();
						frappe.show_alert({ message: __("Import selesai"), indicator: "green" });
					},
				});
			},
		});
		dialog.show();
	}

	render_step5($c) {
		const $b = this._header(
			$c,
			__("Vendor & Supplier"),
			__("Supplier untuk Purchase Order dan restock. Opsional — bisa skip.")
		);
		const rows = (this.session.suppliers || [])
			.map(
				(r, i) =>
					`<tr data-idx="${i}"><td>${frappe.utils.escape_html(r.supplier_name)}</td><td>${frappe.utils.escape_html(r.phone || "")}</td><td>${frappe.utils.escape_html(r.category || "")}</td><td><button class="btn btn-xs btn-default btn-rm-supplier">×</button></td></tr>`
			)
			.join("");
		$b.html(`
			<div class="row"><div class="col-md-8">
				<div class="form-group"><label>${__("Nama supplier")}</label><input class="form-control" id="wiz-sup-name"></div>
				<div class="form-group"><label>${__("Nomor HP / WA")}</label><input class="form-control" id="wiz-sup-phone"></div>
				<div class="form-group"><label>${__("Kategori supplier")}</label><input class="form-control" id="wiz-sup-cat" value="Distributor"></div>
				<div class="form-group"><label>${__("Produk yang disuplai")}</label><input class="form-control" id="wiz-sup-note" placeholder="${__("Minuman, Sembako...")}"></div>
				<button class="btn btn-primary btn-sm" id="wiz-add-supplier">${__("Tambah supplier")}</button>
				<table class="imogi-wizard-table mt-3"><thead><tr><th>${__("Supplier")}</th><th>${__("HP")}</th><th>${__("Kategori")}</th><th></th></tr></thead><tbody>${rows}</tbody></table>
			</div></div>
		`);
		$b.find("#wiz-add-supplier").on("click", () => {
			const supplier_name = $b.find("#wiz-sup-name").val().trim();
			if (!supplier_name) return;
			this.session.suppliers = this.session.suppliers || [];
			this.session.suppliers.push({
				supplier_name,
				phone: $b.find("#wiz-sup-phone").val().trim(),
				category: $b.find("#wiz-sup-cat").val().trim(),
				products_note: $b.find("#wiz-sup-note").val().trim(),
			});
			this.render_step();
		});
		$b.find(".btn-rm-supplier").on("click", (e) => {
			this.session.suppliers.splice($(e.currentTarget).closest("tr").data("idx"), 1);
			this.render_step();
		});
	}

	render_step6($c) {
		const $b = this._header(
			$c,
			__("Pembayaran"),
			__("Pilih metode yang diterima. QRIS aktif bisa isi credential gateway sekarang atau nanti.")
		);
		const payments = this.session.payments || [];
		let html = "";
		payments.forEach((p, i) => {
			html += `
				<div class="imogi-pay-card ${cint(p.enabled) ? "active" : ""}" data-idx="${i}">
					<div><strong>${frappe.utils.escape_html(p.mode_of_payment)}</strong>
					<label class="ml-3 mb-0"><input type="checkbox" class="pay-enabled" ${cint(p.enabled) ? "checked" : ""}> ${__("Aktif")}</label>
					<label class="ml-2 mb-0"><input type="radio" name="pay-default" class="pay-default" ${cint(p.is_default) ? "checked" : ""}> ${__("Default")}</label></div>
				</div>`;
		});
		html += `
			<div class="row mt-4"><div class="col-md-6">
				<div class="form-group"><label>${__("Payment gateway")} (${__("opsional")})</label>
				<input class="form-control" data-f="payment_gateway" value="${frappe.utils.escape_html(this.session.payment_gateway || "")}" placeholder="Midtrans"></div>
				<div class="form-group"><label>${__("Server key")}</label>
				<input type="password" class="form-control" data-f="payment_gateway_key" placeholder="sk-..."></div>
			</div></div>`;
		$b.html(html);
		$b.find(".pay-enabled").on("change", (e) => {
			const idx = $(e.target).closest(".imogi-pay-card").data("idx");
			this.session.payments[idx].enabled = e.target.checked ? 1 : 0;
		});
		$b.find(".pay-default").on("change", (e) => {
			const idx = $(e.target).closest(".imogi-pay-card").data("idx");
			this.session.payments.forEach((p, i) => {
				p.is_default = i === idx ? 1 : 0;
			});
		});
	}

	render_step7($c) {
		const $b = this._header(
			$c,
			__("Printer & Hardware"),
			__("Assign printer sekarang supaya struk langsung keluar saat transaksi pertama.")
		);
		const opt = this.session.printer_option || "Skip";
		$b.html(`
			<div class="imogi-choice-cards">
				<div class="imogi-choice-card ${opt === "Setup Sekarang" ? "selected" : ""}" data-opt="Setup Sekarang">
					<i class="fa fa-print fa-2x"></i><h5 class="mt-2">${__("Ya, punya printer")}</h5><p class="text-muted small">${__("Setup koneksi sekarang")}</p>
				</div>
				<div class="imogi-choice-card ${opt === "Skip" || opt === "Setup Nanti" ? "selected" : ""}" data-opt="Skip">
					<i class="fa fa-forward fa-2x"></i><h5 class="mt-2">${__("Skip dulu")}</h5><p class="text-muted small">${__("Setup nanti dari Settings")}</p>
				</div>
			</div>
			<div class="alert alert-warning small mt-4">${__("Tanpa printer, struk tidak keluar otomatis. Setup kapan saja dari IMOGI POS Settings → Struk.")}</div>
		`);
		$b.find(".imogi-choice-card").on("click", (e) => {
			$b.find(".imogi-choice-card").removeClass("selected");
			$(e.currentTarget).addClass("selected");
			this.session.printer_option = $(e.currentTarget).data("opt");
		});
	}

	render_step8($c) {
		const $b = this._header(
			$c,
			__("Operasional"),
			__("Target omzet untuk progress bar kasir dan laporan target vs aktual.")
		);
		$b.html(`
			<div class="row"><div class="col-md-8">
				<div class="form-group"><label>${__("Target omzet per bulan")} (${__("opsional")})</label>
				<input type="number" class="form-control" data-f="target_monthly_sales" value="${flt(this.session.target_monthly_sales) || ""}" placeholder="15000000"></div>
				<div class="row">
					<div class="col"><label>${__("Shift default — buka")}</label><input type="time" class="form-control" data-f="opening_time" value="${this.session.opening_time || "07:00:00"}"></div>
					<div class="col"><label>${__("Shift default — tutup")}</label><input type="time" class="form-control" data-f="closing_time" value="${this.session.closing_time || "22:00:00"}"></div>
				</div>
				<small class="text-muted d-block mt-2">${__("→ Shift Type ERPNext + POS Opening/Closing Entry")}</small>
			</div></div>
			<h6 class="mt-4">${__("Master data tambahan — dibuat otomatis")}</h6>
			<div class="imogi-auto-list">
				<div>${__("COA template Indonesia")}</div><div>${__("Customer Group + Supplier Group")}</div>
				<div>${__("Price List Standard Selling")}</div><div>${__("Letter Head + Terms")}</div>
				<div>${__("Fiscal Year + Currency IDR")}</div><div>${__("Tax Rule otomatis")}</div>
			</div>
		`);
	}

	render_step9($c) {
		frappe.call({
			method: "imogi_pos.api.setup_wizard_api.get_wizard_summary",
			args: { session_name: this.session.name },
			callback: (r) => {
				const s = r.message || {};
				const $b = this._header(
					$c,
					__("Konfirmasi"),
					__("Periksa kembali sebelum sistem dikonfigurasi. Semua bisa diubah nanti.")
				);
				$b.html(`
					<table class="imogi-wizard-table imogi-confirm-table"><tbody>
						<tr><td>${__("Nama toko")}</td><td>${frappe.utils.escape_html(s.store_name || "-")}</td></tr>
						<tr><td>${__("Kota")}</td><td>${frappe.utils.escape_html(s.store_city || "-")}</td></tr>
						<tr><td>${__("WA owner")}</td><td>${frappe.utils.escape_html(s.owner_whatsapp || "-")}</td></tr>
						<tr><td>${__("Jenis usaha")}</td><td>${frappe.utils.escape_html(s.business_type || "-")}</td></tr>
						<tr><td>${__("Shift")}</td><td>${frappe.utils.escape_html(s.shift || "-")}</td></tr>
						<tr><td>${__("Kasir")}</td><td>${frappe.utils.escape_html(s.cashiers || "-")}</td></tr>
						<tr><td>${__("Supplier")}</td><td>${frappe.utils.escape_html(s.suppliers || "-")}</td></tr>
						<tr><td>${__("Produk awal")}</td><td>${s.products_count || 0} ${__("item")}</td></tr>
						<tr><td>${__("Metode bayar")}</td><td>${frappe.utils.escape_html(s.payments || "-")}</td></tr>
						<tr><td>${__("Gateway")}</td><td>${frappe.utils.escape_html(s.payment_gateway || "-")}</td></tr>
						<tr><td>${__("Printer")}</td><td>${frappe.utils.escape_html(s.printer || "-")}</td></tr>
						<tr><td>${__("Target omzet")}</td><td>${frappe.utils.escape_html(String(s.target_sales || "-"))}</td></tr>
					</tbody></table>
					<h6 class="mt-4">${__("Yang dibuat otomatis di ERPNext")}</h6>
					<div class="imogi-auto-list">${(s.auto_created || []).map((x) => `<div>${frappe.utils.escape_html(x)}</div>`).join("")}</div>
				`);
			},
		});
	}

	collect_step_data() {
		const data = { current_step: this.step, name: this.session.name };
		this.$wrapper.find("[data-f]").each(function () {
			const $el = $(this);
			const f = $el.data("f");
			if ($el.attr("type") === "checkbox") data[f] = $el.is(":checked") ? 1 : 0;
			else data[f] = $el.val();
		});
		data.cashiers = this.session.cashiers || [];
		data.products = this.session.products || [];
		data.suppliers = this.session.suppliers || [];
		data.payments = this.session.payments || [];
		if (this.session.business_type) data.business_type = this.session.business_type;
		if (this.session.printer_option) data.printer_option = this.session.printer_option;
		return data;
	}

	save_step(callback) {
		frappe.call({
			method: "imogi_pos.api.setup_wizard_api.save_wizard_step",
			args: { data: this.collect_step_data() },
			callback: (r) => {
				this.session = (r.message && r.message.session) || this.session;
				if (callback) callback();
			},
		});
	}

	go(delta) {
		if (delta > 0 && this.step === 1) {
			const name = this.$wrapper.find('[data-f="store_name"]').val();
			if (!name || !name.trim()) {
				frappe.msgprint(__("Nama toko wajib diisi"));
				return;
			}
		}
		if (delta > 0 && this.step === 2 && !this.session.business_type) {
			frappe.msgprint(__("Pilih jenis usaha"));
			return;
		}

		this.save_step(() => {
			if (delta > 0 && this.step === 9) {
				this.finish();
				return;
			}
			this.step = Math.max(1, Math.min(IMOGI_WIZARD_STEPS, this.step + delta));
			this.session.current_step = this.step;
			this.render_shell();
		});
	}

	finish() {
		frappe.call({
			method: "imogi_pos.api.setup_wizard_api.finish_wizard",
			args: { session_name: this.session.name },
			freeze: true,
			freeze_message: __("Mengkonfigurasi sistem..."),
			callback: (r) => {
				const res = r.message || {};
				frappe.show_alert({ message: __("Setup selesai!"), indicator: "green" });
				frappe.boot.imogi_pos_setup_complete = 1;
				frappe.set_route((res.redirect || "/app/imogi-pos-cashier").replace("/app/", ""));
			},
		});
	}
};
