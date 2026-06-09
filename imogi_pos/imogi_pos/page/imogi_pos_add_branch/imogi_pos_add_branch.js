frappe.pages["imogi-pos-add-branch"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Tambah Company & Cabang"),
		single_column: true,
	});

	page.main.addClass("imogi-add-branch-page");
	new imogi_pos.AddBranchWizard(page);
};

imogi_pos.AddBranchWizard = class AddBranchWizard {
	constructor(page) {
		this.page = page;
		this.wrapper = $(page.main);
		this.mode = "new_company";
		this.load();
	}

	load() {
		this.wrapper.html(`<div class="text-muted">${__("Memuat...")}</div>`);
		frappe.call({
			method: "imogi_pos.api.branch_provisioning_api.get_branch_provisioning_context",
			callback: (r) => {
				this.context = r.message || {};
				this.render();
			},
		});
	}

	render() {
		const checklist = (this.context.checklist || [])
			.map((line) => `<li>${frappe.utils.escape_html(line)}</li>`)
			.join("");
		const companies = (this.context.companies || [])
			.map((row) => `<option value="${frappe.utils.escape_html(row.name)}">${frappe.utils.escape_html(row.company_name || row.name)} (${frappe.utils.escape_html(row.default_currency || "")})</option>`)
			.join("");

		this.wrapper.html(`
			<div class="imogi-add-branch">
				<div class="alert alert-info">
					<b>${__("Alur terpadu")}</b>
					<p class="mb-2">${__(
						"Wizard ini merangkai pembuatan Company, Warehouse, POS Profile, dan IMOGI Branch — tanpa loncat antar DocType ERPNext."
					)}</p>
					<ul class="mb-0 small">${checklist}</ul>
				</div>
				<div class="frappe-control">
					<label class="control-label">${__("Mode")}</label>
					<select class="form-control imogi-mode-select">
						<option value="new_company">${__("Company baru + cabang")}</option>
						<option value="existing_company">${__("Company sudah ada — buat cabang + POS")}</option>
					</select>
				</div>
				<div class="imogi-panel imogi-panel-new mt-3">
					<div class="frappe-control">
						<label class="control-label reqd">${__("Nama Company Baru")}</label>
						<input type="text" class="form-control imogi-new-company" placeholder="${__("Contoh: Toko Imogi Bandung")}">
					</div>
				</div>
				<div class="imogi-panel imogi-panel-existing mt-3" style="display:none">
					<div class="frappe-control">
						<label class="control-label reqd">${__("Company")}</label>
						<select class="form-control imogi-company-select"><option value=""></option>${companies}</select>
					</div>
				</div>
				<div class="row mt-3">
					<div class="col-md-6">
						<div class="frappe-control">
							<label class="control-label reqd">${__("Nama Cabang")}</label>
							<input type="text" class="form-control imogi-branch-name" placeholder="${__("Contoh: Cabang Senayan")}">
						</div>
					</div>
					<div class="col-md-6">
						<div class="frappe-control">
							<label class="control-label">${__("Kota")}</label>
							<input type="text" class="form-control imogi-city">
						</div>
					</div>
				</div>
				<div class="row mt-3">
					<div class="col-md-6">
						<div class="frappe-control">
							<label class="control-label">${__("Label Warehouse")}</label>
							<input type="text" class="form-control imogi-warehouse-label" placeholder="${__("Kosongkan = sama dengan nama cabang")}">
						</div>
					</div>
					<div class="col-md-6">
						<div class="frappe-control">
							<label class="control-label">${__("Target Omzet Bulanan")}</label>
							<input type="number" class="form-control imogi-target" min="0" step="1000">
						</div>
					</div>
				</div>
				<div class="frappe-control mt-3">
					<label class="control-label">${__("Assign Kasir (opsional)")}</label>
					<input type="text" class="form-control imogi-assign-users" placeholder="${__("Email user, pisahkan koma")}">
					<p class="help-box small">${__(
						"Otomatis menambah User Permission Company + POS Profile dan role IMOGI Cashier."
					)}</p>
				</div>
				<div class="mt-4">
					<button class="btn btn-primary btn-lg imogi-submit">${__("Buat Company & Cabang")}</button>
					<a href="/app/imogi-branch" class="btn btn-default btn-lg ml-2">${__("Lihat Daftar Cabang")}</a>
				</div>
				<div class="imogi-result mt-4"></div>
			</div>
		`);

		this.wrapper.find(".imogi-mode-select").on("change", (e) => {
			this.mode = e.target.value;
			this.wrapper.find(".imogi-panel-new").toggle(this.mode === "new_company");
			this.wrapper.find(".imogi-panel-existing").toggle(this.mode !== "new_company");
			this.wrapper
				.find(".imogi-submit")
				.text(
					this.mode === "new_company"
						? __("Buat Company & Cabang")
						: __("Buat Cabang")
				);
		});

		this.wrapper.find(".imogi-submit").on("click", () => this.submit());
	}

	submit() {
		const branch_name = this.wrapper.find(".imogi-branch-name").val()?.trim();
		if (!branch_name) {
			frappe.msgprint(__("Nama cabang wajib diisi"));
			return;
		}

		const args = {
			mode: this.mode,
			branch_name,
			city: this.wrapper.find(".imogi-city").val()?.trim(),
			warehouse_label: this.wrapper.find(".imogi-warehouse-label").val()?.trim(),
			target_monthly_sales: flt(this.wrapper.find(".imogi-target").val()),
			assign_users: this.wrapper.find(".imogi-assign-users").val()?.trim(),
		};

		if (this.mode === "new_company") {
			args.new_company_name = this.wrapper.find(".imogi-new-company").val()?.trim();
			if (!args.new_company_name) {
				frappe.msgprint(__("Nama company baru wajib diisi"));
				return;
			}
		} else {
			args.company = this.wrapper.find(".imogi-company-select").val();
			if (!args.company) {
				frappe.msgprint(__("Pilih company"));
				return;
			}
		}

		frappe.call({
			method: "imogi_pos.api.branch_provisioning_api.provision_company_and_branch",
			args,
			freeze: true,
			freeze_message: __("Memprovisioning company & cabang..."),
			callback: (r) => {
				if (r.exc) return;
				this.render_result(r.message || {});
			},
		});
	}

	render_result(msg) {
		const links = msg.links || {};
		const created = msg.created || {};
		const assigned = (msg.assigned_users || []).join(", ");
		this.wrapper.find(".imogi-result").html(`
			<div class="alert alert-success">
				<h5>${__("Berhasil")}</h5>
				<p><b>${__("Company")}:</b> ${frappe.utils.escape_html(msg.company || "")}</p>
				<p><b>${__("Cabang")}:</b> ${frappe.utils.escape_html(msg.branch_name || msg.branch_code || "")}</p>
				<p><b>${__("POS Profile")}:</b> ${frappe.utils.escape_html(msg.pos_profile || "")}</p>
				<p><b>${__("Warehouse")}:</b> ${frappe.utils.escape_html(msg.warehouse || "")}</p>
				${
					assigned
						? `<p><b>${__("Kasir")}:</b> ${frappe.utils.escape_html(assigned)}</p>`
						: ""
				}
				${
					created.company_created
						? `<p class="small text-muted">${__("Company baru dibuat dengan Chart of Accounts standar Indonesia.")}</p>`
						: ""
				}
				<p class="mt-2">
					<a class="btn btn-xs btn-default" href="${links.branch || "#"}">${__("Buka Cabang")}</a>
					<a class="btn btn-xs btn-default" href="${links.pos_profile || "#"}">${__("POS Profile")}</a>
					<a class="btn btn-xs btn-default" href="${links.company || "#"}">${__("Company")}</a>
				</p>
			</div>
		`);
	}
};
