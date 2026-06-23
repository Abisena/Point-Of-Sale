frappe.provide("imogi_pos");

const IMOGI_PAYM_DEMO_ITEMS = [
	{ id: "i1", item_code: "CROFFLE-ORG", item_name: "Croffle Original", rate: 35000, qty: 1 },
	{ id: "i2", item_code: "ICE-CHOC", item_name: "Chocolate Ice Cream", rate: 25000, qty: 1 },
	{ id: "i3", item_code: "BAN-SPLIT", item_name: "Banana Split", rate: 45000, qty: 1 },
	{ id: "i4", item_code: "ICE-VAN", item_name: "Vanilla Ice Cream", rate: 20000, qty: 1 },
	{ id: "i5", item_code: "LAT-CAR", item_name: "Caramel Latte", rate: 55000, qty: 1 },
	{ id: "i6", item_code: "MTCH-FRP", item_name: "Matcha Frappe", rate: 70000, qty: 1 },
];

const IMOGI_PAYM_DEFAULT_METHODS = [
	{ key: "Cash", icon: "fa-money", label: __("Cash") },
	{ key: "QRIS", icon: "fa-qrcode", label: __("QRIS") },
	{ key: "Debit Card", icon: "fa-credit-card", label: __("Debit Card") },
	{ key: "Credit Card", icon: "fa-credit-card-alt", label: __("Credit Card") },
	{ key: "E-Wallet", icon: "fa-mobile", label: __("E-Wallet") },
	{ key: "Bank Transfer", icon: "fa-university", label: __("Bank Transfer") },
];

imogi_pos.PaymentModal = class PaymentModal {
	constructor(page) {
		this.page = page;
		this.$modal = null;
		this._uid = 0;
		this.reset_state();
	}

	reset_state() {
		this.active_tab = "multi";
		this.split_method = null;
		this.split_confirmed = false;
		this.split_customers = [];
		this.payments = [];
		this.active_method = null;
		this.amount_input = "";
		this.single_method = null;
		this.single_paid = "";
		this.nested_customer_id = null;
		this.nested_payments = [];
		this.nested_active_method = null;
		this.nested_amount_input = "";
		this.items = [];
		this.total_bill = 0;
		this.unassigned_items = [];
		this._keydown_handler = null;
	}

	next_id(prefix = "p") {
		this._uid += 1;
		return `${prefix}_${this._uid}`;
	}

	format_money(amount) {
		return format_currency(flt(amount), null, 0);
	}

	escape(text) {
		return frappe.utils.escape_html(String(text ?? ""));
	}

	get_payment_methods() {
		const from_ctx = (this.page?.context?.payment_modes || []).map((row) => ({
			key: row.mode_of_payment,
			icon: this.page.get_payment_mode_icon?.(row.mode_of_payment) || "fa-wallet",
			label: row.mode_of_payment,
		}));
		if (from_ctx.length) return from_ctx;
		return IMOGI_PAYM_DEFAULT_METHODS;
	}

	get_method_icon(method) {
		const row = this.get_payment_methods().find((m) => m.key === method);
		return row?.icon || "fa-wallet";
	}

	resolve_total_bill() {
		const page = this.page;
		if (!page) return flt(this.items.reduce((s, i) => s + flt(i.rate) * flt(i.qty), 0));
		if (page.get_cart_total) {
			return flt(page.get_cart_total());
		}
		const subtotal = page.get_cart_subtotal?.() ?? 0;
		if (page.get_checkout_breakdown) {
			return flt(page.get_checkout_breakdown(null, subtotal).grand_total);
		}
		return flt(subtotal);
	}

	resolve_items() {
		const page = this.page;
		if (page?.cart?.length) {
			return page.cart.map((row, idx) => ({
				id: `cart_${idx}`,
				item_code: row.item_code,
				item_name: row.item_name || row.item_code,
				rate: flt(row.rate),
				qty: flt(row.qty) || 1,
			}));
		}
		return IMOGI_PAYM_DEMO_ITEMS.map((row) => ({ ...row }));
	}

	open(options = {}) {
		this.reset_state();
		this.options = options;
		this.items = this.resolve_items();
		this.total_bill = this.resolve_total_bill();
		this.unassigned_items = this.items.map((i) => ({ ...i }));
		this.active_tab = options.tab || "multi";
		if (options.demo) {
			this.items = IMOGI_PAYM_DEMO_ITEMS.map((row) => ({ ...row }));
			this.unassigned_items = this.items.map((i) => ({ ...i }));
			this.total_bill = this.items.reduce((s, i) => s + flt(i.rate) * flt(i.qty), 0);
			if (this.active_tab === "multi") {
				this.payments = [
					{ id: "demo_1", method: "Cash", amount: 100000, status: "Added" },
					{ id: "demo_2", method: "QRIS", amount: 100000, status: "Added" },
					{ id: "demo_3", method: "Debit Card", amount: 50000, status: "Added" },
				];
			}
		}

		frappe.require("/assets/imogi_pos/css/imogi_pos_payment_modal.css", () => {
			this.render();
			this.bind_events();
			document.body.classList.add("imogi-paym-open");
		});
	}

	close() {
		this.$modal?.remove();
		this.$modal = null;
		document.body.classList.remove("imogi-paym-open");
		if (this._keydown_handler) {
			document.removeEventListener("keydown", this._keydown_handler);
			this._keydown_handler = null;
		}
		this.options?.on_cancel?.();
	}

	get_amount_paid() {
		if (this.split_confirmed) {
			return this.split_customers.reduce((s, c) => s + (c.paid ? flt(c.amount) : 0), 0);
		}
		if (this.active_tab === "single") {
			return flt(this.single_paid) || 0;
		}
		return this.payments.reduce((s, p) => s + flt(p.amount), 0);
	}

	get_remaining() {
		const target = this.get_payment_target();
		return Math.max(0, target - this.get_amount_paid());
	}

	get_change() {
		const target = this.get_payment_target();
		const paid = this.get_amount_paid();
		return Math.max(0, paid - target);
	}

	get_payment_target() {
		if (this.nested_customer_id) {
			const customer = this.split_customers.find((c) => c.id === this.nested_customer_id);
			return flt(customer?.amount);
		}
		return flt(this.total_bill);
	}

	can_complete() {
		if (this.active_tab === "split" && !this.split_confirmed) return false;
		if (this.active_tab === "split" && this.split_confirmed) {
			return this.split_customers.every((c) => c.paid);
		}
		if (this.nested_customer_id) return false;
		const remaining = this.get_remaining();
		if (this.active_tab === "multi") return remaining <= 0.009 && this.payments.length > 0;
		if (this.active_tab === "single") {
			return this.single_method && remaining <= 0.009 && flt(this.single_paid) > 0;
		}
		return false;
	}

	get_primary_label() {
		if (this.active_tab === "split" && !this.split_confirmed) return __("Confirm Split");
		if (this.active_tab === "split" && this.split_confirmed) return __("Complete All Payments");
		return __("Complete Payment");
	}

	/* ── Render shell ── */

	render() {
		this.$modal?.remove();
		const html = `<div class="imogi-paym-overlay" role="dialog" aria-modal="true" aria-label="${__(
			"Payment"
		)}">
			<div class="imogi-paym-modal">
				${this.render_header()}
				<div class="imogi-paym-body">
					${this.render_summary()}
					<div class="imogi-paym-content">
						<div class="imogi-paym-content-scroll">${this.render_tab_content()}</div>
					</div>
				</div>
				${this.render_footer()}
			</div>
		</div>`;
		this.$modal = $(html).appendTo("body");
	}

	render_header() {
		const item_count = this.items.reduce((s, i) => s + flt(i.qty), 0);
		return `<header class="imogi-paym-header">
			<div class="imogi-paym-header-top">
				<div class="imogi-paym-title-block">
					<h2>${__("Payment")}</h2>
					<p>${__("{0} items · Order #{1}", [item_count, this.escape(this.options?.order_ref || "POS-2847")])}</p>
				</div>
				<button type="button" class="imogi-paym-close" data-action="close" aria-label="${__("Close")}">
					<i class="fa fa-times"></i>
				</button>
			</div>
			<nav class="imogi-paym-tabs" role="tablist">
				<button type="button" class="imogi-paym-tab${this.active_tab === "single" ? " is-active" : ""}"
					data-tab="single" role="tab">${__("Single Payment")}<kbd>1</kbd></button>
				<button type="button" class="imogi-paym-tab${this.active_tab === "multi" ? " is-active" : ""}"
					data-tab="multi" role="tab">${__("Multi Payment")}<kbd>2</kbd></button>
				<button type="button" class="imogi-paym-tab${this.active_tab === "split" ? " is-active" : ""}"
					data-tab="split" role="tab">${__("Split Bill")}<kbd>3</kbd></button>
			</nav>
		</header>`;
	}

	render_summary() {
		const paid = this.get_amount_paid();
		const remaining = this.get_remaining();
		const change = this.get_change();
		const show_change = change > 0.009;

		return `<aside class="imogi-paym-summary">
			<div class="imogi-paym-summary-inner imogi-paym-summary-sticky">
				<div class="imogi-paym-kpi is-total">
					<span class="imogi-paym-kpi-label">${__("Total Bill")}</span>
					<span class="imogi-paym-kpi-value is-lg">${this.format_money(this.total_bill)}</span>
				</div>
				<div class="imogi-paym-kpi is-paid">
					<span class="imogi-paym-kpi-label">${__("Amount Paid")}</span>
					<span class="imogi-paym-kpi-value" data-kpi="paid">${this.format_money(paid)}</span>
				</div>
				<div class="imogi-paym-kpi is-remaining">
					<span class="imogi-paym-kpi-label">${__("Remaining Balance")}</span>
					<span class="imogi-paym-kpi-value" data-kpi="remaining">${this.format_money(remaining)}</span>
				</div>
				<div class="imogi-paym-kpi is-change${show_change ? " is-visible" : ""}" data-kpi-wrap="change" style="${show_change ? "" : "display:none"}">
					<span class="imogi-paym-kpi-label">${__("Change")}</span>
					<span class="imogi-paym-kpi-value" data-kpi="change">${this.format_money(change)}</span>
				</div>
			</div>
		</aside>`;
	}

	render_footer() {
		const can = this.can_complete();
		return `<footer class="imogi-paym-footer">
			<button type="button" class="imogi-paym-btn is-secondary" data-action="cancel">${__("Cancel")}</button>
			<button type="button" class="imogi-paym-btn is-primary${this.active_tab === "split" && !this.split_confirmed ? " is-confirm" : ""}"
				data-action="complete" ${can ? "" : "disabled"}>${this.get_primary_label()}</button>
		</footer>`;
	}

	render_tab_content() {
		if (this.active_tab === "single") return this.render_single_tab();
		if (this.active_tab === "multi") return this.render_multi_tab();
		return this.render_split_tab();
	}

	/* ── Multi Payment ── */

	render_multi_tab() {
		const rows = this.payments.length
			? this.payments
					.map(
						(p) => `<tr data-payment-id="${this.escape(p.id)}">
					<td><div class="imogi-paym-method-cell">
						<span class="imogi-paym-method-icon"><i class="fa ${this.escape(this.get_method_icon(p.method))}"></i></span>
						${this.escape(p.method)}
					</div></td>
					<td class="col-amount">${this.format_money(p.amount)}</td>
					<td class="col-status"><span class="imogi-paym-status is-added">${__("Added")}</span></td>
					<td class="col-action"><button type="button" class="imogi-paym-remove" data-action="remove-payment" data-id="${this.escape(p.id)}" aria-label="${__("Remove")}"><i class="fa fa-trash-o"></i></button></td>
				</tr>`
					)
					.join("")
			: `<tr class="imogi-paym-empty-row"><td colspan="4">${__(
					"Select a payment method below to add allocation"
			  )}</td></tr>`;

		const methods = this.get_payment_methods()
			.map(
				(m) => `<button type="button" class="imogi-paym-method-card${this.active_method === m.key ? " is-active" : ""}"
				data-action="select-method" data-method="${this.escape(m.key)}">
				<span class="imogi-paym-method-card-icon"><i class="fa ${this.escape(m.icon)}"></i></span>
				<span class="imogi-paym-method-card-label">${this.escape(m.label)}</span>
			</button>`
			)
			.join("");

		return `<div class="imogi-paym-card">
			<div class="imogi-paym-card-head">
				<h3 class="imogi-paym-card-title">${__("Payment Allocation")}</h3>
			</div>
			<div class="imogi-paym-card-body" style="padding:0">
				<table class="imogi-paym-table">
					<thead><tr>
						<th>${__("Payment Method")}</th>
						<th class="col-amount">${__("Amount")}</th>
						<th class="col-status">${__("Status")}</th>
						<th class="col-action"></th>
					</tr></thead>
					<tbody>${rows}</tbody>
				</table>
			</div>
		</div>
		<div class="imogi-paym-card">
			<div class="imogi-paym-card-head"><h3 class="imogi-paym-card-title">${__("Quick Payment Methods")}</h3></div>
			<div class="imogi-paym-card-body">
				<div class="imogi-paym-methods-grid">${methods}</div>
				${this.active_method ? this.render_amount_panel("multi") : ""}
			</div>
		</div>`;
	}

	render_amount_panel(mode = "multi") {
		const is_nested = mode === "nested";
		const method = is_nested ? this.nested_active_method : this.active_method;
		const input = is_nested ? this.nested_amount_input : this.amount_input;
		const remaining = this.get_remaining();
		const quick = [
			{ label: __("Exact"), value: remaining },
			{ label: "+50K", value: remaining + 50000 },
			{ label: "+100K", value: remaining + 100000 },
			{ label: "+200K", value: remaining + 200000 },
		];

		return `<div class="imogi-paym-amount-panel" data-amount-panel="${mode}">
			<div class="imogi-paym-amount-panel-head">
				<strong>${__("Enter Amount")} — ${this.escape(method)}</strong>
			</div>
			<div class="imogi-paym-amount-display is-focused">${this.format_money(flt(input))}</div>
			<div class="imogi-paym-quick-amounts">
				${quick
					.map(
						(q) =>
							`<button type="button" class="imogi-paym-quick-amt" data-action="quick-amount" data-mode="${mode}" data-value="${q.value}">${this.escape(q.label)}</button>`
					)
					.join("")}
			</div>
			<div class="imogi-paym-numpad">
				${["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"]
					.map(
						(k) =>
							`<button type="button" class="imogi-paym-numpad-key${k === "C" || k === "⌫" ? " is-action" : ""}"
						data-action="numpad" data-mode="${mode}" data-key="${k}">${k}</button>`
					)
					.join("")}
			</div>
			<button type="button" class="imogi-paym-add-payment-btn" data-action="add-payment" data-mode="${mode}"
				${flt(input) > 0 ? "" : "disabled"}>${is_nested ? __("Add to Customer Payment") : __("Add Payment")}</button>
		</div>`;
	}

	/* ── Single Payment ── */

	render_single_tab() {
		const methods = this.get_payment_methods()
			.map(
				(m) => `<button type="button" class="imogi-paym-method-card${this.single_method === m.key ? " is-active" : ""}"
				data-action="select-single-method" data-method="${this.escape(m.key)}">
				<span class="imogi-paym-method-card-icon"><i class="fa ${this.escape(m.icon)}"></i></span>
				<span class="imogi-paym-method-card-label">${this.escape(m.label)}</span>
			</button>`
			)
			.join("");

		return `<div class="imogi-paym-card">
			<div class="imogi-paym-card-head"><h3 class="imogi-paym-card-title">${__("Payment Method")}</h3></div>
			<div class="imogi-paym-card-body">
				<div class="imogi-paym-single-modes">${methods}</div>
				<div class="imogi-paym-single-paid">
					<label class="imogi-paym-kpi-label">${__("Amount Received")}</label>
					<input type="number" min="0" step="1000" class="imogi-paym-input" data-action="single-paid"
						value="${this.single_paid || this.total_bill}" inputmode="decimal" />
					<p class="imogi-paym-hint">${__("Press Enter to complete when balance is zero")}</p>
				</div>
			</div>
		</div>`;
	}

	/* ── Split Bill ── */

	render_split_tab() {
		if (this.split_confirmed) return this.render_split_payment_cards();
		if (!this.split_method) return this.render_split_method_selector();
		if (this.split_method === "equal") return this.render_split_equal();
		if (this.split_method === "items") return this.render_split_by_item();
		return this.render_split_custom();
	}

	render_split_method_selector() {
		const methods = [
			{ key: "equal", icon: "fa-users", title: __("Split Equally"), desc: __("Divide total evenly among customers") },
			{ key: "items", icon: "fa-list", title: __("Split by Item"), desc: __("Assign items to each customer") },
			{ key: "custom", icon: "fa-sliders", title: __("Custom Split"), desc: __("Manually allocate amounts") },
		];
		return `<div class="imogi-paym-card">
			<div class="imogi-paym-card-head"><h3 class="imogi-paym-card-title">${__("Split Method")}</h3></div>
			<div class="imogi-paym-card-body">
				<div class="imogi-paym-split-methods">
					${methods
						.map(
							(m) => `<button type="button" class="imogi-paym-split-method${this.split_method === m.key ? " is-active" : ""}"
						data-action="split-method" data-method="${m.key}">
						<span class="imogi-paym-split-method-icon"><i class="fa ${m.icon}"></i></span>
						<h4>${this.escape(m.title)}</h4>
						<p>${this.escape(m.desc)}</p>
					</button>`
						)
						.join("")}
				</div>
			</div>
		</div>`;
	}

	render_split_equal() {
		const count = this.split_customers.length || 4;
		if (!this.split_customers.length) this.init_equal_customers(count);

		return `<div class="imogi-paym-card">
			<div class="imogi-paym-card-head">
				<h3 class="imogi-paym-card-title">${__("Split Equally")}</h3>
				<button type="button" class="imogi-paym-nested-back" data-action="split-back">${__("Change Method")}</button>
			</div>
			<div class="imogi-paym-card-body">
				<div class="imogi-paym-field-row">
					<label>${__("Number of Customers")}</label>
					<input type="number" min="2" max="20" class="imogi-paym-input" data-action="equal-count" value="${count}" />
				</div>
				<div class="imogi-paym-customer-list">
					${this.split_customers
						.map(
							(c, idx) => `<div class="imogi-paym-customer-row" data-customer-id="${this.escape(c.id)}">
						<input type="text" data-action="customer-name" data-id="${this.escape(c.id)}" value="${this.escape(c.name)}" />
						<span class="imogi-paym-customer-amount">${this.format_money(c.amount)}</span>
					</div>`
						)
						.join("")}
				</div>
			</div>
		</div>`;
	}

	init_equal_customers(count) {
		const n = Math.max(2, cint(count) || 2);
		const per = Math.floor((this.total_bill / n) * 100) / 100;
		let remainder = flt(this.total_bill) - per * n;
		this.split_customers = Array.from({ length: n }, (_, i) => {
			const extra = remainder > 0 ? 1 : 0;
			if (extra) remainder -= 1;
			const cents = Math.round((per + extra) * 100) / 100;
			return {
				id: this.next_id("cust"),
				name: `${__("Customer")} ${i + 1}`,
				amount: cents,
				items: [],
				paid: false,
				payments: [],
			};
		});
		const diff = flt(this.total_bill) - this.split_customers.reduce((s, c) => s + flt(c.amount), 0);
		if (Math.abs(diff) > 0.001) {
			this.split_customers[this.split_customers.length - 1].amount += diff;
		}
	}

	render_split_by_item() {
		if (!this.split_customers.length) {
			this.split_customers = [
				{ id: this.next_id("cust"), name: __("Customer A"), amount: 0, items: [], paid: false, payments: [] },
				{ id: this.next_id("cust"), name: __("Customer B"), amount: 0, items: [], paid: false, payments: [] },
				{ id: this.next_id("cust"), name: __("Customer C"), amount: 0, items: [], paid: false, payments: [] },
			];
		}
		this.recalc_item_split();

		const items_html = this.unassigned_items
			.map(
				(item) => `<div class="imogi-paym-draggable-item" draggable="true"
				data-item-id="${this.escape(item.id)}" data-action="drag-item">
				<span class="imogi-paym-item-name">${this.escape(item.item_name)}</span>
				<span class="imogi-paym-item-price">${this.format_money(flt(item.rate) * flt(item.qty))}</span>
			</div>`
			)
			.join("");

		const groups_html = this.split_customers
			.map((c) => {
				const item_count = (c.items || []).length;
				return `<div class="imogi-paym-customer-group" data-drop-target="${this.escape(c.id)}">
					<div class="imogi-paym-customer-group-head">
						<input type="text" data-action="customer-name" data-id="${this.escape(c.id)}" value="${this.escape(c.name)}" />
						<span class="imogi-paym-customer-group-meta">${item_count} ${__("items")}</span>
					</div>
					<div class="imogi-paym-group-items">
						${(c.items || [])
							.map(
								(item) => `<div class="imogi-paym-group-item">
							<span>${this.escape(item.item_name)}</span>
							<span>${this.format_money(flt(item.rate) * flt(item.qty))}</span>
							<button type="button" data-action="unassign-item" data-item-id="${this.escape(item.id)}" data-customer-id="${this.escape(c.id)}">×</button>
						</div>`
							)
							.join("")}
					</div>
					<div class="imogi-paym-customer-group-total">${this.format_money(c.amount)}</div>
				</div>`;
			})
			.join("");

		return `<div class="imogi-paym-card">
			<div class="imogi-paym-card-head">
				<h3 class="imogi-paym-card-title">${__("Split by Item")}</h3>
				<button type="button" class="imogi-paym-nested-back" data-action="split-back">${__("Change Method")}</button>
			</div>
			<div class="imogi-paym-card-body">
				<div class="imogi-paym-split-panels">
					<div class="imogi-paym-item-panel">
						<div class="imogi-paym-panel-head">${__("Ordered Items")}</div>
						<div class="imogi-paym-panel-body">${items_html || `<p class="imogi-paym-hint">${__("All items assigned")}</p>`}</div>
					</div>
					<div class="imogi-paym-group-panel">
						<div class="imogi-paym-panel-head">${__("Customer Groups")}</div>
						<div class="imogi-paym-panel-body">${groups_html}</div>
					</div>
				</div>
			</div>
		</div>`;
	}

	recalc_item_split() {
		this.split_customers.forEach((c) => {
			c.amount = (c.items || []).reduce((s, i) => s + flt(i.rate) * flt(i.qty), 0);
		});
	}

	render_split_custom() {
		if (!this.split_customers.length) {
			this.split_customers = [
				{ id: this.next_id("cust"), name: __("Customer A"), amount: 100000, paid: false, payments: [], items: [] },
				{ id: this.next_id("cust"), name: __("Customer B"), amount: 80000, paid: false, payments: [], items: [] },
				{ id: this.next_id("cust"), name: __("Customer C"), amount: 70000, paid: false, payments: [], items: [] },
			];
		}
		const allocated = this.split_customers.reduce((s, c) => s + flt(c.amount), 0);
		const remaining = flt(this.total_bill) - allocated;
		const is_valid = Math.abs(remaining) < 0.01;

		return `<div class="imogi-paym-card">
			<div class="imogi-paym-card-head">
				<h3 class="imogi-paym-card-title">${__("Custom Split")}</h3>
				<button type="button" class="imogi-paym-nested-back" data-action="split-back">${__("Change Method")}</button>
			</div>
			<div class="imogi-paym-card-body">
				<div class="imogi-paym-customer-list">
					${this.split_customers
						.map(
							(c) => `<div class="imogi-paym-customer-row" data-customer-id="${this.escape(c.id)}">
						<input type="text" data-action="customer-name" data-id="${this.escape(c.id)}" value="${this.escape(c.name)}" />
						<input type="number" min="0" step="1000" class="imogi-paym-input" style="max-width:140px;text-align:right"
							data-action="custom-amount" data-id="${this.escape(c.id)}" value="${flt(c.amount)}" />
					</div>`
						)
						.join("")}
				</div>
				<button type="button" class="imogi-paym-btn is-secondary" style="width:100%;margin-top:8px;min-height:40px"
					data-action="add-customer">+ ${__("Add Customer")}</button>
				<div class="imogi-paym-split-summary">
					<div class="imogi-paym-split-summary-item${is_valid ? " is-valid" : " is-invalid"}">
						<span>${__("Allocated")}</span>
						<strong>${this.format_money(allocated)}</strong>
					</div>
					<div class="imogi-paym-split-summary-item${is_valid ? " is-valid" : " is-invalid"}">
						<span>${__("Remaining")}</span>
						<strong>${this.format_money(remaining)}</strong>
					</div>
				</div>
				${!is_valid ? `<div class="imogi-paym-error">${__("Allocated amount must equal total bill before confirmation")}</div>` : ""}
			</div>
		</div>`;
	}

	render_split_payment_cards() {
		return `<div class="imogi-paym-card">
			<div class="imogi-paym-card-head"><h3 class="imogi-paym-card-title">${__("Collect Payments")}</h3></div>
			<div class="imogi-paym-card-body">
				<div class="imogi-paym-pay-cards">
					${this.split_customers
						.map((c) => {
							const paid = c.paid;
							return `<div class="imogi-paym-pay-card${paid ? " is-paid" : ""}" data-customer-id="${this.escape(c.id)}">
							<div class="imogi-paym-pay-card-head">
								<div>
									<div class="imogi-paym-pay-card-name">${this.escape(c.name)}</div>
									<div class="imogi-paym-pay-card-amount">${this.format_money(c.amount)}</div>
								</div>
								${paid ? `<span class="imogi-paym-pay-card-badge">${__("Paid")}</span>` : ""}
							</div>
							${!paid ? `<div class="imogi-paym-pay-card-actions">
								<button type="button" class="imogi-paym-pay-card-btn" data-action="pay-customer" data-id="${this.escape(c.id)}" data-mode="single">${__("Pay Now")} — ${__("Single")}</button>
								<button type="button" class="imogi-paym-pay-card-btn is-secondary" data-action="pay-customer" data-id="${this.escape(c.id)}" data-mode="multi">${__("Pay Now")} — ${__("Multi")}</button>
							</div>` : ""}
						</div>`;
						})
						.join("")}
				</div>
				${this.nested_customer_id ? this.render_nested_payment() : ""}
			</div>
		</div>`;
	}

	render_nested_payment() {
		const customer = this.split_customers.find((c) => c.id === this.nested_customer_id);
		if (!customer) return "";

		const methods = this.get_payment_methods()
			.map(
				(m) => `<button type="button" class="imogi-paym-method-card${this.nested_active_method === m.key ? " is-active" : ""}"
				data-action="select-nested-method" data-method="${this.escape(m.key)}">
				<span class="imogi-paym-method-card-icon"><i class="fa ${this.escape(m.icon)}"></i></span>
				<span class="imogi-paym-method-card-label">${this.escape(m.label)}</span>
			</button>`
			)
			.join("");

		const nested_paid = this.nested_payments.reduce((s, p) => s + flt(p.amount), 0);
		const nested_remaining = Math.max(0, flt(customer.amount) - nested_paid);

		return `<div class="imogi-paym-nested">
			<div class="imogi-paym-nested-head">
				<h4>${__("Payment for {0}", [customer.name])} — ${this.format_money(customer.amount)}</h4>
				<button type="button" class="imogi-paym-nested-back" data-action="close-nested">${__("Close")}</button>
			</div>
			<p class="imogi-paym-hint">${__("Remaining")}: ${this.format_money(nested_remaining)}</p>
			${this.nested_payments.length ? `<table class="imogi-paym-table"><tbody>${this.nested_payments
				.map(
					(p) => `<tr><td>${this.escape(p.method)}</td><td class="col-amount">${this.format_money(p.amount)}</td></tr>`
				)
				.join("")}</tbody></table>` : ""}
			<div class="imogi-paym-methods-grid" style="margin-top:12px">${methods}</div>
			${this.nested_active_method ? this.render_amount_panel("nested") : ""}
			<button type="button" class="imogi-paym-add-payment-btn" data-action="confirm-nested"
				${nested_remaining <= 0.009 && this.nested_payments.length ? "" : "disabled"}>${__("Confirm Customer Payment")}</button>
		</div>`;
	}

	/* ── State updates ── */

	refresh() {
		if (!this.$modal) return;
		this.$modal.find(".imogi-paym-header").replaceWith(this.render_header());
		this.$modal.find(".imogi-paym-summary").replaceWith(this.render_summary());
		this.$modal.find(".imogi-paym-content-scroll").html(this.render_tab_content());
		this.$modal.find(".imogi-paym-footer").replaceWith(this.render_footer());
		this.bind_content_events();
	}

	update_summary_only() {
		if (!this.$modal) return;
		const paid = this.get_amount_paid();
		const remaining = this.get_remaining();
		const change = this.get_change();
		this.$modal.find('[data-kpi="paid"]').text(this.format_money(paid));
		this.$modal.find('[data-kpi="remaining"]').text(this.format_money(remaining));
		const $changeWrap = this.$modal.find('[data-kpi-wrap="change"]');
		if (change > 0.009) {
			$changeWrap.show();
			this.$modal.find('[data-kpi="change"]').text(this.format_money(change));
		} else {
			$changeWrap.hide();
		}
		const can = this.can_complete();
		this.$modal.find('[data-action="complete"]').prop("disabled", !can).text(this.get_primary_label());
	}

	/* ── Events ── */

	bind_events() {
		this.bind_content_events();
		this._keydown_handler = (e) => this.handle_keydown(e);
		document.addEventListener("keydown", this._keydown_handler);
	}

	bind_content_events() {
		if (!this.$modal) return;
		const $m = this.$modal;

		$m.off("click.paym");
		$m.on("click.paym", "[data-action='close'], [data-action='cancel']", () => this.close());
		$m.on("click.paym", "[data-tab]", (e) => {
			this.active_tab = $(e.currentTarget).data("tab");
			this.nested_customer_id = null;
			if (this.active_tab === "single" && !this.single_method) {
				this.single_method = this.get_payment_methods()[0]?.key || "Cash";
				this.single_paid = String(Math.round(this.total_bill));
			}
			this.refresh();
		});
		$m.on("click.paym", "[data-action='select-method']", (e) => {
			this.active_method = $(e.currentTarget).data("method");
			this.amount_input = String(Math.round(this.get_remaining()) || "");
			this.refresh();
		});
		$m.on("click.paym", "[data-action='select-single-method']", (e) => {
			this.single_method = $(e.currentTarget).data("method");
			if (!this.single_paid) this.single_paid = String(Math.round(this.total_bill));
			this.refresh();
		});
		$m.on("click.paym", "[data-action='remove-payment']", (e) => {
			const id = $(e.currentTarget).data("id");
			this.payments = this.payments.filter((p) => p.id !== id);
			this.update_summary_only();
			this.refresh();
		});
		$m.on("click.paym", "[data-action='numpad']", (e) => {
			const key = $(e.currentTarget).data("key");
			const mode = $(e.currentTarget).data("mode");
			this.handle_numpad(key, mode);
		});
		$m.on("click.paym", "[data-action='quick-amount']", (e) => {
			const value = flt($(e.currentTarget).data("value"));
			const mode = $(e.currentTarget).data("mode");
			if (mode === "nested") this.nested_amount_input = String(Math.max(0, Math.round(value)));
			else this.amount_input = String(Math.max(0, Math.round(value)));
			this.refresh();
		});
		$m.on("click.paym", "[data-action='add-payment']", (e) => {
			const mode = $(e.currentTarget).data("mode");
			this.add_payment_from_input(mode);
		});
		$m.on("click.paym", "[data-action='split-method']", (e) => {
			this.split_method = $(e.currentTarget).data("method");
			this.split_customers = [];
			this.refresh();
		});
		$m.on("click.paym", "[data-action='split-back']", () => {
			this.split_method = null;
			this.split_customers = [];
			this.unassigned_items = this.items.map((i) => ({ ...i }));
			this.refresh();
		});
		$m.on("click.paym", "[data-action='add-customer']", () => {
			this.split_customers.push({
				id: this.next_id("cust"),
				name: `${__("Customer")} ${this.split_customers.length + 1}`,
				amount: 0,
				items: [],
				paid: false,
				payments: [],
			});
			this.refresh();
		});
		$m.on("click.paym", "[data-action='pay-customer']", (e) => {
			const id = $(e.currentTarget).data("id");
			this.nested_customer_id = id;
			this.nested_payments = [];
			this.nested_active_method = null;
			this.nested_amount_input = "";
			this.refresh();
		});
		$m.on("click.paym", "[data-action='close-nested']", () => {
			this.nested_customer_id = null;
			this.nested_payments = [];
			this.refresh();
		});
		$m.on("click.paym", "[data-action='select-nested-method']", (e) => {
			this.nested_active_method = $(e.currentTarget).data("method");
			const customer = this.split_customers.find((c) => c.id === this.nested_customer_id);
			const nested_paid = this.nested_payments.reduce((s, p) => s + flt(p.amount), 0);
			this.nested_amount_input = String(Math.max(0, Math.round(flt(customer?.amount) - nested_paid)));
			this.refresh();
		});
		$m.on("click.paym", "[data-action='confirm-nested']", () => this.confirm_nested_payment());
		$m.on("click.paym", "[data-action='complete']", () => this.handle_complete());
		$m.on("click.paym", "[data-action='unassign-item']", (e) => {
			const item_id = $(e.currentTarget).data("item-id");
			const customer_id = $(e.currentTarget).data("customer-id");
			this.unassign_item(item_id, customer_id);
		});

		$m.off("input.paym change.paym");
		$m.on("input.paym change.paym", "[data-action='single-paid']", (e) => {
			this.single_paid = $(e.currentTarget).val();
			this.update_summary_only();
		});
		$m.on("input.paym change.paym", "[data-action='equal-count']", (e) => {
			this.init_equal_customers($(e.currentTarget).val());
			this.refresh();
		});
		$m.on("input.paym", "[data-action='customer-name']", (e) => {
			const id = $(e.currentTarget).data("id");
			const customer = this.split_customers.find((c) => c.id === id);
			if (customer) customer.name = $(e.currentTarget).val();
		});
		$m.on("input.paym change.paym", "[data-action='custom-amount']", (e) => {
			const id = $(e.currentTarget).data("id");
			const customer = this.split_customers.find((c) => c.id === id);
			if (customer) customer.amount = Math.max(0, flt($(e.currentTarget).val()));
			this.refresh();
		});

		this.bind_drag_drop();
	}

	bind_drag_drop() {
		if (!this.$modal || this.split_method !== "items") return;
		const $m = this.$modal;

		$m.off("dragstart.paym dragend.paym dragover.paym dragleave.paym drop.paym");
		$m.on("dragstart.paym", "[data-action='drag-item']", (e) => {
			e.originalEvent.dataTransfer.setData("text/plain", $(e.currentTarget).data("item-id"));
			e.originalEvent.dataTransfer.effectAllowed = "move";
		});
		$m.on("dragover.paym", "[data-drop-target]", (e) => {
			e.preventDefault();
			$(e.currentTarget).addClass("is-drag-over");
		});
		$m.on("dragleave.paym", "[data-drop-target]", (e) => {
			$(e.currentTarget).removeClass("is-drag-over");
		});
		$m.on("drop.paym", "[data-drop-target]", (e) => {
			e.preventDefault();
			const $target = $(e.currentTarget);
			$target.removeClass("is-drag-over");
			const item_id = e.originalEvent.dataTransfer.getData("text/plain");
			const customer_id = $target.data("drop-target");
			this.assign_item(item_id, customer_id);
		});
	}

	handle_keydown(e) {
		if (!this.$modal) return;
		if (e.key === "Escape") {
			e.preventDefault();
			this.close();
			return;
		}
		if (e.key === "Enter" && this.can_complete() && !$(e.target).is("input, textarea")) {
			e.preventDefault();
			this.handle_complete();
			return;
		}
		if (e.altKey || e.ctrlKey || e.metaKey) return;
		if ($(e.target).is("input, textarea, select")) return;
		if (e.key === "1") {
			this.active_tab = "single";
			this.refresh();
		} else if (e.key === "2") {
			this.active_tab = "multi";
			this.refresh();
		} else if (e.key === "3") {
			this.active_tab = "split";
			this.refresh();
		}
	}

	handle_numpad(key, mode) {
		let current = mode === "nested" ? this.nested_amount_input : this.amount_input;
		if (key === "C") current = "";
		else if (key === "⌫") current = current.slice(0, -1);
		else current = `${current}${key}`.replace(/^0+(?=\d)/, "");
		if (mode === "nested") this.nested_amount_input = current;
		else this.amount_input = current;
		this.refresh();
	}

	add_payment_from_input(mode) {
		const amount = Math.max(0, flt(mode === "nested" ? this.nested_amount_input : this.amount_input));
		if (!amount) return;
		const method = mode === "nested" ? this.nested_active_method : this.active_method;
		if (!method) return;

		const payment = { id: this.next_id(), method, amount, status: "Added" };
		if (mode === "nested") {
			this.nested_payments.push(payment);
			this.nested_amount_input = "";
			this.nested_active_method = null;
		} else {
			this.payments.push(payment);
			this.amount_input = "";
			this.active_method = null;
		}
		this.update_summary_only();
		this.refresh();
	}

	assign_item(item_id, customer_id) {
		const idx = this.unassigned_items.findIndex((i) => i.id === item_id);
		if (idx < 0) return;
		const [item] = this.unassigned_items.splice(idx, 1);
		const customer = this.split_customers.find((c) => c.id === customer_id);
		if (!customer) return;
		customer.items = customer.items || [];
		customer.items.push(item);
		this.recalc_item_split();
		this.refresh();
	}

	unassign_item(item_id, customer_id) {
		const customer = this.split_customers.find((c) => c.id === customer_id);
		if (!customer) return;
		const idx = (customer.items || []).findIndex((i) => i.id === item_id);
		if (idx < 0) return;
		const [item] = customer.items.splice(idx, 1);
		this.unassigned_items.push(item);
		this.recalc_item_split();
		this.refresh();
	}

	confirm_nested_payment() {
		const customer = this.split_customers.find((c) => c.id === this.nested_customer_id);
		if (!customer) return;
		const total = this.nested_payments.reduce((s, p) => s + flt(p.amount), 0);
		if (Math.abs(total - flt(customer.amount)) > 0.01) {
			frappe.show_alert({ message: __("Payment must match customer total"), indicator: "red" });
			return;
		}
		customer.payments = [...this.nested_payments];
		customer.paid = true;
		this.nested_customer_id = null;
		this.nested_payments = [];
		this.update_summary_only();
		this.refresh();
	}

	confirm_split() {
		if (this.split_method === "items") {
			if (this.unassigned_items.length) {
				frappe.show_alert({ message: __("Assign all items before confirming"), indicator: "orange" });
				return false;
			}
		}
		if (this.split_method === "custom") {
			const allocated = this.split_customers.reduce((s, c) => s + flt(c.amount), 0);
			if (Math.abs(allocated - this.total_bill) > 0.01) return false;
		}
		this.split_confirmed = true;
		return true;
	}

	handle_complete() {
		if (this.active_tab === "split" && !this.split_confirmed) {
			if (this.confirm_split()) this.refresh();
			return;
		}
		this.submit_checkout();
	}

	collect_payments_for_checkout() {
		if (this.active_tab === "split" && this.split_confirmed) {
			return this.split_customers.flatMap((c) =>
				(c.payments || []).map((p) => ({ mode_of_payment: p.method, amount: flt(p.amount) }))
			);
		}
		if (this.active_tab === "multi") {
			return this.payments.map((p) => ({ mode_of_payment: p.method, amount: flt(p.amount) }));
		}
		return [{ mode_of_payment: this.single_method, amount: flt(this.total_bill) }];
	}

	submit_checkout() {
		const page = this.page;
		if (!page) {
			frappe.show_alert({ message: __("Payment recorded (demo mode)"), indicator: "green" });
			this.close();
			return;
		}
		if (page.busy) return;

		const payments = this.collect_payments_for_checkout();
		if (!payments.length) return;

		const total = flt(this.total_bill);
		const paid_amount = this.get_amount_paid();
		const dialog_shim = {
			hide: () => this.close(),
			get_primary_btn: () => ({ prop: () => {} }),
		};

		if (payments.length > 1 && !page.require_feature?.("multi_payment")) return;
		if (this.active_tab === "split" && !page.require_feature?.("split_bill")) return;

		if (imogi_pos.cashier_extras?.checkout_with_payments && payments.length >= 1) {
			imogi_pos.cashier_extras.checkout_with_payments(
				page,
				dialog_shim,
				payments,
				total,
				paid_amount
			);
			return;
		}

		page.checkout?.(dialog_shim, payments[0]?.mode_of_payment, total, paid_amount);
	}
};

/* Demo opener for development / preview */
imogi_pos.open_payment_modal_demo = function (tab = "multi") {
	const modal = new imogi_pos.PaymentModal(null);
	modal.open({ demo: true, tab, order_ref: "DEMO-250K" });
};

/* Cashier integration */
imogi_pos.payment_modal = imogi_pos.payment_modal || {};

// Legacy cashier dialog — keep Indonesian payment UX (payment_modal patch disabled).
imogi_pos.payment_modal.patch_cashier = function () {};

$(document).on("app_ready", () => {
	imogi_pos.payment_modal.patch_cashier();
});
