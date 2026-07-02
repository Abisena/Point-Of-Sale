frappe.pages["kitchen-station"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Kitchen Station"),
		single_column: true,
	});
	page.main.addClass("imogi-ks-page");
	new imogi_pos.KitchenStationManager(page);
	frappe.breadcrumbs.add("Imogi POS");
};

const IMOGI_KS_TYPE_META = {
	Kitchen: { icon: "fa-fire", tone: "kitchen" },
	Bar: { icon: "fa-glass", tone: "bar" },
	Pastry: { icon: "fa-birthday-cake", tone: "pastry" },
	Grill: { icon: "fa-cutlery", tone: "grill" },
};

imogi_pos.KitchenStationManager = class KitchenStationManager {
	constructor(page) {
		this.page = page;
		this.wrapper = $(page.body);
		this.stations = [];
		this.can_write = false;
		this.make();
		this.load_perms();
		this.refresh();
	}

	make() {
		this.wrapper.html(`
			<div class="imogi-ks-shell">
				<div class="imogi-ks-topbar">
					<div class="imogi-ks-head">
						<div class="imogi-ks-head-icon"><i class="fa fa-cutlery"></i></div>
						<div>
							<div class="imogi-ks-title">${__("Kitchen Station")}</div>
							<div class="imogi-ks-sub">${__("Kelola stasiun dapur, bar, pastry & grill")}</div>
						</div>
					</div>
					<div class="imogi-ks-tools">
						<button type="button" class="imogi-ks-refresh"><i class="fa fa-refresh"></i> ${__("Refresh")}</button>
						<button type="button" class="imogi-ks-add" hidden><i class="fa fa-plus"></i> ${__("Tambah Stasiun")}</button>
					</div>
				</div>
				<div class="imogi-ks-grid"></div>
			</div>
		`);

		this.grid = this.wrapper.find(".imogi-ks-grid");
		this.wrapper.find(".imogi-ks-refresh").on("click", () => this.refresh());
		this.wrapper.find(".imogi-ks-add").on("click", () => this.open_dialog());
	}

	load_perms() {
		this.can_write = !!frappe.boot?.user?.can_write?.includes?.("IMOGI Kitchen Station");
		this.wrapper.find(".imogi-ks-add").prop("hidden", !this.can_write);
	}

	refresh() {
		this.grid.html(`<div class="imogi-ks-loading"><i class="fa fa-spinner fa-spin"></i> ${__("Memuat...")}</div>`);
		frappe.call({
			method: "imogi_pos.api.kitchen.list_kitchen_stations",
			callback: (r) => {
				this.stations = r.message || [];
				this.render();
			},
		});
	}

	render() {
		this.grid.empty();
		if (!this.stations.length) {
			this.grid.html(`
				<div class="imogi-ks-empty">
					<i class="fa fa-cutlery"></i>
					<h4>${__("Belum ada stasiun")}</h4>
					<p>${__("Tambahkan stasiun dapur untuk merutekan order ke dapur/bar.")}</p>
				</div>`);
			return;
		}
		this.stations.forEach((st) => this.grid.append(this.build_card(st)));
	}

	build_card(st) {
		const meta = IMOGI_KS_TYPE_META[st.station_type] || { icon: "fa-cutlery", tone: "kitchen" };
		const active = cint(st.is_active);
		const $card = $(`
			<article class="imogi-ks-card ${active ? "" : "is-inactive"}">
				<div class="imogi-ks-card-top">
					<div class="imogi-ks-card-icon imogi-ks-card-icon--${meta.tone}"><i class="fa ${meta.icon}"></i></div>
					<span class="imogi-ks-type imogi-ks-type--${meta.tone}">${frappe.utils.escape_html(st.station_type || "Kitchen")}</span>
				</div>
				<div class="imogi-ks-card-name">${frappe.utils.escape_html(st.station_name)}</div>
				<div class="imogi-ks-card-desc">${frappe.utils.escape_html(st.description || "")}</div>
				<div class="imogi-ks-card-meta">
					<span class="imogi-ks-active-count"><i class="fa fa-hourglass-half"></i> ${st.active_orders || 0} ${__("order aktif")}</span>
					<span class="imogi-ks-state ${active ? "is-on" : "is-off"}">${active ? __("Aktif") : __("Nonaktif")}</span>
				</div>
				<div class="imogi-ks-card-actions"></div>
			</article>
		`);

		if (this.can_write) {
			const $actions = $card.find(".imogi-ks-card-actions");
			const $toggle = $(
				`<button type="button" class="imogi-ks-btn imogi-ks-btn--ghost"><i class="fa fa-power-off"></i> ${active ? __("Nonaktifkan") : __("Aktifkan")}</button>`
			);
			$toggle.on("click", () => this.toggle(st, !active));
			const $edit = $(`<button type="button" class="imogi-ks-btn imogi-ks-btn--ghost"><i class="fa fa-pencil"></i> ${__("Edit")}</button>`);
			$edit.on("click", () => this.open_dialog(st));
			const $del = $(`<button type="button" class="imogi-ks-btn imogi-ks-btn--danger"><i class="fa fa-trash"></i></button>`);
			$del.on("click", () => this.remove(st));
			$actions.append($toggle, $edit, $del);
		}

		return $card;
	}

	open_dialog(station) {
		const is_edit = !!station;
		const d = new frappe.ui.Dialog({
			title: is_edit ? __("Edit Stasiun") : __("Tambah Stasiun"),
			fields: [
				{ fieldname: "station_name", fieldtype: "Data", label: __("Nama Stasiun"), reqd: 1, default: station?.station_name },
				{
					fieldname: "station_type",
					fieldtype: "Select",
					label: __("Tipe"),
					options: "Kitchen\nBar\nPastry\nGrill",
					default: station?.station_type || "Kitchen",
				},
				{ fieldname: "company", fieldtype: "Link", label: __("Company"), options: "Company", default: station?.company },
				{ fieldname: "is_active", fieldtype: "Check", label: __("Aktif"), default: station ? cint(station.is_active) : 1 },
				{ fieldname: "description", fieldtype: "Small Text", label: __("Deskripsi"), default: station?.description },
			],
			primary_action_label: __("Simpan"),
			primary_action: (values) => {
				frappe.call({
					method: "imogi_pos.api.kitchen.save_kitchen_station",
					args: {
						station_name: values.station_name,
						station_type: values.station_type,
						company: values.company,
						is_active: values.is_active,
						description: values.description,
						original_name: is_edit ? station.name : null,
					},
					freeze: true,
					callback: () => {
						d.hide();
						frappe.show_alert({ message: __("Stasiun disimpan"), indicator: "green" });
						this.refresh();
					},
				});
			},
		});
		d.show();
	}

	toggle(st, to_active) {
		frappe.call({
			method: "imogi_pos.api.kitchen.toggle_kitchen_station",
			args: { station: st.name, is_active: to_active ? 1 : 0 },
			callback: () => this.refresh(),
		});
	}

	remove(st) {
		frappe.confirm(__("Hapus stasiun {0}?", [st.station_name]), () => {
			frappe.call({
				method: "imogi_pos.api.kitchen.delete_kitchen_station",
				args: { station: st.name },
				callback: () => {
					frappe.show_alert({ message: __("Stasiun dihapus"), indicator: "green" });
					this.refresh();
				},
			});
		});
	}
};
