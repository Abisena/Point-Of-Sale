frappe.pages["kitchen-display"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Kitchen Display"),
		single_column: true,
	});

	page.main.addClass("imogi-kds-page");
	new imogi_pos.KitchenDisplay(page);
	frappe.breadcrumbs.add("Imogi POS");
};

imogi_pos.KitchenDisplay = class KitchenDisplay {
	constructor(page) {
		this.page = page;
		this.wrapper = $(page.body);
		this.refresh_interval = 30;
		this.make();
		this.load_settings();
		this.refresh();
		this.bind_realtime();
	}

	make() {
		this.wrapper.html(`
			<div class="imogi-kds-toolbar mb-3">
				<span class="text-muted">${__("Auto-refresh")}</span>
				<span class="imogi-kds-timer badge badge-secondary ml-2">30s</span>
			</div>
			<div class="imogi-kds-grid row"></div>
		`);
		this.grid = this.wrapper.find(".imogi-kds-grid");
	}

	load_settings() {
		frappe.db.get_single_value("IMOGI POS Settings", "dashboard_refresh_seconds").then((v) => {
			if (v) this.refresh_interval = v;
			this.wrapper.find(".imogi-kds-timer").text(`${this.refresh_interval}s`);
		});
	}

	bind_realtime() {
		frappe.realtime.on("imogi_kitchen_updated", () => this.refresh());
		frappe.realtime.on("imogi_pos_notification", (data) => {
			if (data.type === "kitchen_new") {
				frappe.show_alert({ message: data.message, indicator: "orange" });
				this.refresh();
			}
		});
	}

	refresh() {
		frappe.call({
			method: "imogi_pos.api.kitchen.get_kitchen_queue",
			callback: (r) => this.render(r.message || []),
		});
		if (this._timer) clearInterval(this._timer);
		this._timer = setInterval(() => this.refresh(), this.refresh_interval * 1000);
	}

	render(orders) {
		this.grid.empty();
		if (!orders.length) {
			this.grid.html(`<div class="col-12"><div class="text-muted text-center p-5">${__(
				"No active kitchen orders"
			)}</div></div>`);
			return;
		}

		orders.forEach((order) => {
			const items = (order.items || [])
				.map((i) => `<li>${i.qty} x ${i.item_name}</li>`)
				.join("");
			const card = $(`
				<div class="col-md-4 mb-3">
					<div class="imogi-kds-card card border-${order.status === "Preparing" ? "warning" : "primary"}">
						<div class="card-body">
							<h5>${order.name}</h5>
							<div class="small text-muted">${order.pos_order} · ${order.order_type}</div>
							<div class="mt-2"><strong>${order.customer_name || "-"}</strong></div>
							<ul class="mt-2 mb-3">${items}</ul>
							<div class="badge badge-${order.status === "Preparing" ? "warning" : "info"}">${order.status}</div>
							<div class="mt-3 btn-group">
								<button class="btn btn-sm btn-default btn-preparing">${__("Preparing")}</button>
								<button class="btn btn-sm btn-primary btn-ready">${__("Mark Ready")}</button>
							</div>
						</div>
					</div>
				</div>
			`);
			card.find(".btn-preparing").on("click", () => this.update_status(order.name, "Preparing"));
			card.find(".btn-ready").on("click", () => this.complete(order.name));
			this.grid.append(card);
		});
	}

	update_status(name, status) {
		frappe.call({
			method: "imogi_pos.api.kitchen.update_kitchen_status",
			args: { kitchen_order: name, status },
			callback: () => this.refresh(),
		});
	}

	complete(name) {
		frappe.call({
			method: "imogi_pos.api.kitchen.complete_kitchen_from_display",
			args: { kitchen_order: name },
			freeze: true,
			callback: () => {
				frappe.show_alert({ message: __("Kitchen order completed"), indicator: "green" });
				this.refresh();
			},
		});
	}
};
