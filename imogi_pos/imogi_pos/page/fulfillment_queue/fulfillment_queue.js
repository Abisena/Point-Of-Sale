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

const IMOGI_FUL_STEPS = [
	["picking_done", __("Picking"), "fa-inbox"],
	["packaging_done", __("Packaging"), "fa-gift"],
	["quality_assurance_passed", __("QA"), "fa-check-circle"],
	["final_check_done", __("Final"), "fa-flag-checkered"],
];

imogi_pos.FulfillmentQueue = class FulfillmentQueue {
	constructor(page) {
		this.page = page;
		this.wrapper = $(page.body);
		this.refresh_interval = 30;
		this.tasks = [];
		this.make();
		this.refresh();
		frappe.realtime.on("imogi_fulfillment_updated", () => this.refresh());
	}

	make() {
		this.wrapper.html(`
			<div class="imogi-ful-shell">
				<div class="imogi-ful-topbar">
					<div class="imogi-kds-topbar-left">
						<div class="imogi-kds-brand">
							<div class="imogi-ful-brand-icon"><i class="fa fa-shopping-bag"></i></div>
							<div>
								<div class="imogi-ful-brand-title">${__("Fulfillment Queue")}</div>
								<div class="imogi-ful-brand-sub">${__("Packing takeaway & delivery")}</div>
							</div>
						</div>
					</div>
					<div class="imogi-kds-topbar-right">
						<span class="imogi-ful-stat-pill">${__("Antrian")} <span class="imogi-ful-stat-num">0</span></span>
						<button type="button" class="imogi-kds-refresh imogi-ful-refresh">
							<i class="fa fa-refresh"></i>
							<span class="imogi-ful-refresh-label">${__("Refresh")} 30s</span>
						</button>
					</div>
				</div>
				<div class="imogi-ful-grid"></div>
			</div>
		`);
		this.grid = this.wrapper.find(".imogi-ful-grid");
		this.wrapper.find(".imogi-ful-refresh").on("click", () => this.refresh());
	}

	refresh() {
		frappe.call({
			method: "imogi_pos.api.fulfillment.get_fulfillment_queue",
			callback: (r) => {
				this.tasks = r.message || [];
				this.render(this.tasks);
			},
		});
		if (this._timer) clearInterval(this._timer);
		frappe.db.get_single_value("IMOGI POS Settings", "dashboard_refresh_seconds").then((v) => {
			this.refresh_interval = v || 30;
			this.wrapper.find(".imogi-ful-refresh-label").text(`${__("Refresh")} ${this.refresh_interval}s`);
			this._timer = setInterval(() => this.refresh(), this.refresh_interval * 1000);
		});
	}

	render(tasks) {
		this.wrapper.find(".imogi-ful-stat-num").text(tasks.length);
		this.grid.empty();

		if (!tasks.length) {
			this.grid.html(`
				<div class="imogi-ful-empty" style="grid-column:1/-1">
					<i class="fa fa-check-circle"></i>
					<h4>${__("Antrian packing kosong")}</h4>
					<p>${__("Order takeaway/delivery yang selesai dapur akan muncul di sini.")}</p>
				</div>`);
			return;
		}

		tasks.forEach((task) => this.grid.append(this.build_card(task)));
	}

	build_card(task) {
		const short_ref = (task.pos_order || task.name || "").replace(/^ORD-/, "#");
		const is_delivery = task.order_type === "Delivery";
		const done_count = IMOGI_FUL_STEPS.filter(([field]) => task[field]).length;

		const $card = $(`
			<article class="imogi-ful-card">
				<div class="imogi-ful-card-bar ${is_delivery ? "imogi-ful-card-bar--delivery" : ""}"></div>
				<div class="imogi-ful-card-body">
					<div class="imogi-ful-card-head">
						<div>
							<div class="imogi-ful-card-id">${frappe.utils.escape_html(short_ref)}</div>
							<div class="imogi-ful-meta">${frappe.utils.escape_html(task.pos_order || "")} · ${frappe.utils.escape_html(task.order_type || "-")}</div>
						</div>
						<span class="imogi-ful-status">${frappe.utils.escape_html(task.status || "Open")}</span>
					</div>
					<div class="imogi-ful-meta"><i class="fa fa-user"></i> ${frappe.utils.escape_html(task.customer_name || __("Walk-in"))} · ${format_currency(task.grand_total || 0)}</div>
					<div class="imogi-ful-steps"></div>
					<button type="button" class="imogi-ful-btn-complete"${done_count < 4 ? " disabled" : ""}>
						<i class="fa fa-check"></i> ${__("Selesai Packing")}
					</button>
				</div>
			</article>
		`);

		const $steps = $card.find(".imogi-ful-steps");
		IMOGI_FUL_STEPS.forEach(([field, label, icon]) => {
			const done = !!task[field];
			const $step = $(`
				<div class="imogi-ful-step ${done ? "is-done" : ""}" data-field="${field}">
					<span class="imogi-ful-step-box">${done ? '<i class="fa fa-check" style="font-size:9px"></i>' : ""}</span>
					<i class="fa ${icon}"></i> ${label}
				</div>`);
			$step.on("click", () => {
				frappe.call({
					method: "imogi_pos.api.fulfillment.update_fulfillment_checks",
					args: { fulfillment_task: task.name, field, value: done ? 0 : 1 },
					callback: () => this.refresh(),
				});
			});
			$steps.append($step);
		});

		const me = this;
		$card.find(".imogi-ful-btn-complete").on("click", () => {
			if (done_count < 4) {
				frappe.show_alert({ message: __("Centang semua checklist dulu"), indicator: "orange" });
				return;
			}
			frappe.call({
				method: "imogi_pos.api.fulfillment.complete_fulfillment_from_queue",
				args: { fulfillment_task: task.name },
				freeze: true,
				callback: () => {
					frappe.show_alert({ message: __("Fulfillment selesai"), indicator: "green" });
					me.refresh();
				},
			});
		});

		return $card;
	}
};
