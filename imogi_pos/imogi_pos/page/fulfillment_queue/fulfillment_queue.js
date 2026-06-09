frappe.pages["fulfillment-queue"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Fulfillment Queue"),
		single_column: true,
	});
	page.main.addClass("imogi-fulfillment-page");
	new imogi_pos.FulfillmentQueue(page);
	frappe.breadcrumbs.add("Imogi POS");
};

imogi_pos.FulfillmentQueue = class FulfillmentQueue {
	constructor(page) {
		this.page = page;
		this.wrapper = $(page.body);
		this.refresh_interval = 30;
		this.make();
		this.refresh();
		frappe.realtime.on("imogi_fulfillment_updated", () => this.refresh());
	}

	make() {
		this.wrapper.html(`<div class="imogi-fulfillment-list"></div>`);
		this.list = this.wrapper.find(".imogi-fulfillment-list");
	}

	refresh() {
		frappe.call({
			method: "imogi_pos.api.fulfillment.get_fulfillment_queue",
			callback: (r) => this.render(r.message || []),
		});
		if (this._timer) clearInterval(this._timer);
		frappe.db.get_single_value("IMOGI POS Settings", "dashboard_refresh_seconds").then((v) => {
			this.refresh_interval = v || 30;
			this._timer = setInterval(() => this.refresh(), this.refresh_interval * 1000);
		});
	}

	render(tasks) {
		this.list.empty();
		if (!tasks.length) {
			this.list.html(`<div class="text-muted text-center p-5">${__(
				"No active fulfillment tasks"
			)}</div>`);
			return;
		}

		tasks.forEach((task) => {
			const row = $(`
				<div class="card mb-3 imogi-fulfillment-card">
					<div class="card-body">
						<div class="d-flex justify-content-between">
							<div>
								<h5>${task.name}</h5>
								<div class="text-muted">${task.pos_order} · ${task.order_type}</div>
								<div>${task.customer_name || "-"}</div>
							</div>
							<div><span class="badge badge-info">${task.status}</span></div>
						</div>
						<div class="mt-3 imogi-checks"></div>
						<button class="btn btn-primary btn-sm mt-2 btn-complete">${__(
							"Complete Fulfillment"
						)}</button>
					</div>
				</div>
			`);

			const checks = row.find(".imogi-checks");
			[
				["picking_done", __("Picking Done")],
				["packaging_done", __("Packaging Done")],
				["quality_assurance_passed", __("QA Passed")],
				["final_check_done", __("Final Check")],
			].forEach(([field, label]) => {
				const id = `${task.name}-${field}`;
				const checked = task[field] ? "checked" : "";
				checks.append(`
					<div class="form-check form-check-inline">
						<input class="form-check-input" type="checkbox" id="${id}" ${checked}>
						<label class="form-check-label" for="${id}">${label}</label>
					</div>
				`);
				checks.find(`#${id}`).on("change", (e) => {
					frappe.call({
						method: "imogi_pos.api.fulfillment.update_fulfillment_checks",
						args: { fulfillment_task: task.name, field, value: e.target.checked ? 1 : 0 },
						callback: () => this.refresh(),
					});
				});
			});

			row.find(".btn-complete").on("click", () => {
				frappe.call({
					method: "imogi_pos.api.fulfillment.complete_fulfillment_from_queue",
					args: { fulfillment_task: task.name },
					freeze: true,
					callback: () => {
						frappe.show_alert({ message: __("Fulfillment completed"), indicator: "green" });
						this.refresh();
					},
				});
			});

			this.list.append(row);
		});
	}
};
