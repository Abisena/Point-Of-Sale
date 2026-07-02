frappe.pages["kitchen-order"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Kitchen Order"),
		single_column: true,
	});
	page.main.addClass("imogi-ko-page");
	new imogi_pos.KitchenOrderManager(page);
	frappe.breadcrumbs.add("Imogi POS");
};

const IMOGI_KO_STATUS_META = {
	All: { label: __("Semua"), tone: "all" },
	Pending: { label: __("Menunggu"), tone: "pending" },
	Preparing: { label: __("Dimasak"), tone: "preparing" },
	Ready: { label: __("Siap"), tone: "ready" },
	Done: { label: __("Selesai"), tone: "done" },
	Cancelled: { label: __("Batal"), tone: "cancelled" },
};

const IMOGI_KO_STATUS_ORDER = ["All", "Pending", "Preparing", "Ready", "Done", "Cancelled"];

imogi_pos.KitchenOrderManager = class KitchenOrderManager {
	constructor(page) {
		this.page = page;
		this.wrapper = $(page.body);
		this.status = "All";
		this.search = "";
		this.orders = [];
		this.make();
		this.refresh();
		frappe.realtime.on("imogi_kitchen_updated", () => this.refresh());
	}

	make() {
		const chips = IMOGI_KO_STATUS_ORDER.map((key) => {
			const meta = IMOGI_KO_STATUS_META[key];
			return `<button type="button" class="imogi-ko-chip imogi-ko-chip--${meta.tone} ${key === "All" ? "is-active" : ""}" data-status="${key}">
				${frappe.utils.escape_html(meta.label)} <span class="imogi-ko-chip-count" data-count="${key}">0</span>
			</button>`;
		}).join("");

		this.wrapper.html(`
			<div class="imogi-ko-shell">
				<div class="imogi-ko-topbar">
					<div class="imogi-ko-head">
						<div class="imogi-ko-head-icon"><i class="fa fa-list-alt"></i></div>
						<div>
							<div class="imogi-ko-title">${__("Kitchen Order")}</div>
							<div class="imogi-ko-sub">${__("Pantau & kelola seluruh order dapur")}</div>
						</div>
					</div>
					<div class="imogi-ko-tools">
						<div class="imogi-ko-search">
							<i class="fa fa-search"></i>
							<input type="text" class="imogi-ko-search-input" placeholder="${__("Cari order / pelanggan...")}" />
						</div>
						<button type="button" class="imogi-ko-refresh"><i class="fa fa-refresh"></i> ${__("Refresh")}</button>
					</div>
				</div>
				<div class="imogi-ko-chips">${chips}</div>
				<div class="imogi-ko-list"></div>
			</div>
		`);

		this.list = this.wrapper.find(".imogi-ko-list");

		this.wrapper.find(".imogi-ko-refresh").on("click", () => this.refresh());
		this.wrapper.find(".imogi-ko-chip").on("click", (e) => {
			const $btn = $(e.currentTarget);
			this.status = $btn.data("status");
			this.wrapper.find(".imogi-ko-chip").removeClass("is-active");
			$btn.addClass("is-active");
			this.load_orders();
		});

		let timer = null;
		this.wrapper.find(".imogi-ko-search-input").on("input", (e) => {
			this.search = e.target.value || "";
			clearTimeout(timer);
			timer = setTimeout(() => this.load_orders(), 300);
		});
	}

	refresh() {
		this.load_counts();
		this.load_orders();
	}

	load_counts() {
		frappe.call({
			method: "imogi_pos.api.kitchen.get_kitchen_order_status_counts",
			callback: (r) => {
				const counts = r.message || {};
				Object.keys(IMOGI_KO_STATUS_META).forEach((key) => {
					this.wrapper.find(`.imogi-ko-chip-count[data-count="${key}"]`).text(counts[key] || 0);
				});
			},
		});
	}

	load_orders() {
		this.list.html(`<div class="imogi-ko-loading"><i class="fa fa-spinner fa-spin"></i> ${__("Memuat...")}</div>`);
		frappe.call({
			method: "imogi_pos.api.kitchen.list_kitchen_orders",
			args: { status: this.status === "All" ? null : this.status, search: this.search },
			callback: (r) => {
				this.orders = r.message || [];
				this.render();
			},
		});
	}

	render() {
		this.list.empty();
		if (!this.orders.length) {
			this.list.html(`
				<div class="imogi-ko-empty">
					<i class="fa fa-inbox"></i>
					<h4>${__("Tidak ada order")}</h4>
					<p>${__("Belum ada order dapur untuk filter ini.")}</p>
				</div>`);
			return;
		}
		this.orders.forEach((order) => this.list.append(this.build_row(order)));
	}

	build_row(order) {
		const meta = IMOGI_KO_STATUS_META[order.status] || { label: order.status, tone: "all" };
		const short_ref = (order.pos_order || order.name || "").replace(/^ORD-/, "#");
		const items = (order.items || [])
			.map(
				(it) =>
					`<span class="imogi-ko-item"><b>${flt(it.qty, 0)}×</b> ${frappe.utils.escape_html(it.item_name || it.item_code)}</span>`
			)
			.join("");
		const created = order.creation ? frappe.datetime.str_to_user(order.creation) : "";
		const station = order.kitchen_station
			? `<span class="imogi-ko-tag"><i class="fa fa-cutlery"></i> ${frappe.utils.escape_html(order.kitchen_station)}${
					order.station_type ? ` · ${frappe.utils.escape_html(order.station_type)}` : ""
			  }</span>`
			: "";

		const $row = $(`
			<article class="imogi-ko-row imogi-ko-row--${meta.tone}">
				<div class="imogi-ko-row-main">
					<div class="imogi-ko-row-head">
						<span class="imogi-ko-ref">${frappe.utils.escape_html(short_ref)}</span>
						<span class="imogi-ko-badge imogi-ko-badge--${meta.tone}">${frappe.utils.escape_html(meta.label)}</span>
						${station}
					</div>
					<div class="imogi-ko-row-meta">
						<span><i class="fa fa-user"></i> ${frappe.utils.escape_html(order.customer_name || __("Walk-in"))}</span>
						<span><i class="fa fa-tag"></i> ${frappe.utils.escape_html(order.order_type || "-")}</span>
						<span><i class="fa fa-clock-o"></i> ${frappe.utils.escape_html(created)}</span>
						<span>${frappe.utils.escape_html(order.name)}</span>
					</div>
					<div class="imogi-ko-items">${items || `<span class="text-muted">${__("Tidak ada item")}</span>`}</div>
				</div>
				<div class="imogi-ko-row-actions"></div>
			</article>
		`);

		const $actions = $row.find(".imogi-ko-row-actions");
		if (order.status === "Pending") {
			$actions.append(this.action_btn(__("Mulai Masak"), "fa-play", "primary", () => this.set_status(order.name, "Preparing")));
		} else if (order.status === "Preparing") {
			$actions.append(this.action_btn(__("Siap / Ready"), "fa-check", "success", () => this.complete(order.name)));
		}
		$actions.append(
			this.action_btn(__("Detail"), "fa-external-link", "ghost", () =>
				frappe.set_route("Form", "IMOGI Kitchen Order", order.name)
			)
		);

		return $row;
	}

	action_btn(label, icon, tone, handler) {
		const $btn = $(`<button type="button" class="imogi-ko-btn imogi-ko-btn--${tone}"><i class="fa ${icon}"></i> ${label}</button>`);
		$btn.on("click", handler);
		return $btn;
	}

	set_status(name, status) {
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
				frappe.show_alert({ message: __("Order ditandai siap"), indicator: "green" });
				this.refresh();
			},
		});
	}
};
