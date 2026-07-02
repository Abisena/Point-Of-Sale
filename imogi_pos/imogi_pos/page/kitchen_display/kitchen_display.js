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

const IMOGI_KDS_ORDER_TYPE_META = {
	"Dine-in": { icon: "fa-cutlery", tone: "dine" },
	Takeaway: { icon: "fa-shopping-bag", tone: "take" },
	Delivery: { icon: "fa-motorcycle", tone: "delivery" },
};

imogi_pos.KitchenDisplay = class KitchenDisplay {
	constructor(page) {
		this.page = page;
		this.wrapper = $(page.body);
		this.refresh_interval = 30;
		this.orders = [];
		this.activate_fullscreen();
		this.make();
		this.load_settings();
		this.refresh();
		this.bind_realtime();
		this._clock_timer = setInterval(() => this.update_clocks(), 1000);
		this.page.on_page_hide?.(() => {
			clearInterval(this._timer);
			clearInterval(this._clock_timer);
			this.deactivate_fullscreen();
		});
	}

	logo_url() {
		return (
			frappe.boot?.imogi_pos_logo_white_url ||
			"/assets/imogi_pos/images/imogi-pos-logo-white.png"
		);
	}

	activate_fullscreen() {
		this.inject_css();
		document.body.classList.add("imogi-kds-fullscreen", "imogi-pos-themed");
		document.querySelectorAll(".page-head, .sticky-top").forEach((el) => {
			el.style.setProperty("display", "none", "important");
		});
	}

	inject_css() {
		// Inject critical navy/fullscreen styles inline so the theme always tracks
		// this page JS (avoids stale /assets/imogi_pos/css/imogi_pos.css cache).
		const ID = "imogi-kds-inline-css-v3";
		if (document.getElementById(ID)) return;
		[
			"imogi-kds-inline-css",
			"imogi-kds-inline-css-v1",
			"imogi-kds-inline-css-v2",
		].forEach((id) => document.getElementById(id)?.remove());
		const style = document.createElement("style");
		style.id = ID;
		style.textContent = `
			body.imogi-kds-fullscreen .page-head,
			body.imogi-kds-fullscreen .navbar,
			body.imogi-kds-fullscreen .desk-sidebar,
			body.imogi-kds-fullscreen .body-sidebar,
			body.imogi-kds-fullscreen .layout-side-section { display: none !important; }

			body.imogi-kds-fullscreen,
			body.imogi-kds-fullscreen .main-section,
			body.imogi-kds-fullscreen .page-container,
			body.imogi-kds-fullscreen .container,
			body.imogi-kds-fullscreen .layout-main,
			body.imogi-kds-fullscreen .layout-main-section-wrapper,
			body.imogi-kds-fullscreen .layout-main-section,
			body.imogi-kds-fullscreen .page-body {
				background: #0f1f35 !important;
				background-image: none !important;
				margin: 0 !important;
				max-width: 100% !important;
				padding: 0 !important;
				width: 100% !important;
			}

			body.imogi-kds-fullscreen .imogi-kds-page.layout-main-section,
			body.imogi-kds-fullscreen .imogi-kds-page {
				box-sizing: border-box;
				display: flex !important;
				flex-direction: column;
				height: 100dvh !important;
				max-height: 100dvh !important;
				min-height: 0;
				overflow: hidden !important;
				padding: 0 !important;
			}

			body.imogi-kds-fullscreen .imogi-kds-page .layout-main-section-wrapper,
			body.imogi-kds-fullscreen .imogi-kds-page .page-body {
				display: flex !important;
				flex: 1;
				flex-direction: column;
				min-height: 0;
				overflow: hidden;
			}

			body.imogi-kds-fullscreen .imogi-kds-shell {
				color: #e2e8f0 !important;
				display: flex !important;
				flex: 1;
				flex-direction: column;
				max-width: 100% !important;
				min-height: 0 !important;
				padding: 0 !important;
			}

			body.imogi-kds-fullscreen .imogi-kds-board {
				flex: 1;
				min-height: 0;
				overflow-y: auto;
				padding: 16px 18px 18px !important;
			}

			.imogi-kds-appbar {
				align-items: center;
				background: #0b1726;
				border-bottom: 1px solid rgba(255, 255, 255, 0.07);
				box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
				display: flex;
				flex-shrink: 0;
				flex-wrap: wrap;
				gap: 12px 18px;
				justify-content: space-between;
				min-height: 58px;
				padding: 10px 18px;
			}
			.imogi-kds-appbar-brand { align-items: center; display: flex; gap: 12px; min-width: 0; }
			.imogi-kds-logo {
				filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
				flex-shrink: 0;
				height: 32px !important;
				max-height: 32px !important;
				object-fit: contain;
				width: auto !important;
			}
			.imogi-kds-appbar-titles { min-width: 0; }
			.imogi-kds-appbar .imogi-kds-brand-title { color: #fff !important; font-size: 17px; font-weight: 800; line-height: 1.1; }
			.imogi-kds-appbar .imogi-kds-brand-sub { color: rgba(226,232,240,0.6) !important; font-size: 11px; font-weight: 600; margin-top: 2px; }
			.imogi-kds-appbar .imogi-kds-live { color: #4ade80 !important; }
			.imogi-kds-appbar-right { align-items: center; display: flex; flex-wrap: wrap; gap: 10px; }
			.imogi-kds-appbar .imogi-kds-stat-pill {
				background: rgba(255,255,255,0.06) !important;
				border-color: rgba(255,255,255,0.14) !important;
				color: rgba(226,232,240,0.85) !important;
			}
			.imogi-kds-appbar .imogi-kds-stat-pill .imogi-kds-stat-num { color: #fff !important; }
			.imogi-kds-appbar .imogi-kds-clock { color: rgba(226,232,240,0.75) !important; }
			.imogi-kds-appbar .imogi-kds-refresh {
				background: rgba(255,255,255,0.08) !important;
				border-color: rgba(255,255,255,0.16) !important;
				color: #e2e8f0 !important;
			}
			.imogi-kds-appbar .imogi-kds-refresh:hover { background: rgba(255,255,255,0.16) !important; color: #fff !important; }
			.imogi-kds-logout {
				align-items: center;
				background: rgba(239,68,68,0.16);
				border: 1px solid rgba(239,68,68,0.4);
				border-radius: 8px;
				color: #fca5a5;
				cursor: pointer;
				display: inline-flex;
				font-size: 11px;
				font-weight: 700;
				gap: 6px;
				padding: 7px 12px;
			}
			.imogi-kds-logout:hover { background: rgba(239,68,68,0.28); color: #fff; }
		`;
		document.head.appendChild(style);
	}

	deactivate_fullscreen() {
		document.body.classList.remove("imogi-kds-fullscreen", "imogi-pos-themed");
		document.querySelectorAll(".page-head, .sticky-top").forEach((el) => {
			el.style.removeProperty("display");
		});
	}

	make() {
		this.wrapper.html(`
			<div class="imogi-kds-shell">
				<header class="imogi-kds-appbar">
					<div class="imogi-kds-appbar-brand">
						<img class="imogi-kds-logo" src="${this.logo_url()}" alt="IMOGI POS" />
						<div class="imogi-kds-appbar-titles">
							<div class="imogi-kds-brand-title">${__("Kitchen Display")}</div>
							<div class="imogi-kds-brand-sub">${__("Antrian pesanan dapur realtime")}</div>
						</div>
						<div class="imogi-kds-live"><span class="imogi-kds-live-dot"></span>${__("Live")}</div>
					</div>
					<div class="imogi-kds-appbar-right">
						<span class="imogi-kds-stat-pill imogi-kds-stat-total">${__("Aktif")} <span class="imogi-kds-stat-num">0</span></span>
						<span class="imogi-kds-stat-pill imogi-kds-stat-pill--pending imogi-kds-stat-pending">${__("Menunggu")} <span class="imogi-kds-stat-num">0</span></span>
						<span class="imogi-kds-stat-pill imogi-kds-stat-pill--preparing imogi-kds-stat-preparing">${__("Dimasak")} <span class="imogi-kds-stat-num">0</span></span>
						<span class="imogi-kds-clock imogi-kds-now">--:--</span>
						<button type="button" class="imogi-kds-refresh">
							<i class="fa fa-refresh"></i>
							<span class="imogi-kds-refresh-label">${__("Refresh")} 30s</span>
						</button>
						<button type="button" class="imogi-kds-logout" title="${__("Logout")}">
							<i class="fa fa-sign-out"></i>
							<span>${__("Logout")}</span>
						</button>
					</div>
				</header>
				<div class="imogi-kds-board">
					<div class="imogi-kds-column imogi-kds-column--pending" data-status="Pending">
						<div class="imogi-kds-column-head">
							<div class="imogi-kds-column-title"><i class="fa fa-hourglass-half"></i> ${__("Menunggu")}</div>
							<span class="imogi-kds-column-count imogi-kds-count-pending">0</span>
						</div>
						<div class="imogi-kds-column-body imogi-kds-body-pending"></div>
					</div>
					<div class="imogi-kds-column imogi-kds-column--preparing" data-status="Preparing">
						<div class="imogi-kds-column-head">
							<div class="imogi-kds-column-title"><i class="fa fa-fire"></i> ${__("Sedang Dimasak")}</div>
							<span class="imogi-kds-column-count imogi-kds-count-preparing">0</span>
						</div>
						<div class="imogi-kds-column-body imogi-kds-body-preparing"></div>
					</div>
				</div>
			</div>
		`);

		this.wrapper.find(".imogi-kds-refresh").on("click", () => this.refresh());
		this.wrapper.find(".imogi-kds-logout").on("click", () => this.logout());
	}

	logout() {
		frappe.confirm(__("Logout dari Kitchen Display?"), () => {
			frappe.call({
				method: "logout",
				callback() {
					window.location.href = "/login";
				},
			});
		});
	}

	load_settings() {
		frappe.call({
			method: "imogi_pos.api.dashboard.get_ui_refresh_seconds",
			callback: (r) => {
				if (r.message) this.refresh_interval = cint(r.message) || 30;
				this.wrapper.find(".imogi-kds-refresh-label").text(`${__("Refresh")} ${this.refresh_interval}s`);
			},
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
			callback: (r) => {
				if (r.exc) {
					this.orders = [];
					this.render(this.orders);
					return;
				}
				this.orders = r.message || [];
				this.render(this.orders);
			},
		});
		if (this._timer) clearInterval(this._timer);
		this._timer = setInterval(() => this.refresh(), this.refresh_interval * 1000);
	}

	update_clocks() {
		const now = frappe.datetime.now_datetime(true);
		this.wrapper.find(".imogi-kds-now").text(now.slice(11, 16));
		this.wrapper.find(".imogi-kds-card[data-kitchen-order]").each((_, el) => {
			const $card = $(el);
			const order = this.orders.find((row) => row.name === $card.data("kitchen-order"));
			if (!order) return;
			this.paint_timer($card, order);
		});
	}

	render(orders) {
		this.orders = orders || [];
		const pending = this.orders.filter((o) => o.status === "Pending");
		const preparing = this.orders.filter((o) => o.status === "Preparing");

		this.wrapper.find(".imogi-kds-stat-total .imogi-kds-stat-num").text(this.orders.length);
		this.wrapper.find(".imogi-kds-stat-pending .imogi-kds-stat-num").text(pending.length);
		this.wrapper.find(".imogi-kds-stat-preparing .imogi-kds-stat-num").text(preparing.length);
		this.wrapper.find(".imogi-kds-count-pending").text(pending.length);
		this.wrapper.find(".imogi-kds-count-preparing").text(preparing.length);

		const $pending = this.wrapper.find(".imogi-kds-body-pending").empty();
		const $preparing = this.wrapper.find(".imogi-kds-body-preparing").empty();

		if (!this.orders.length) {
			const empty = `
				<div class="imogi-kds-page-empty">
					<div class="imogi-kds-page-empty-icon"><i class="fa fa-check"></i></div>
					<h4>${__("Dapur kosong")}</h4>
					<p>${__("Belum ada pesanan aktif. Order baru dari kasir akan muncul otomatis di sini.")}</p>
				</div>`;
			$pending.html(empty);
			$preparing.html(`<div class="imogi-kds-empty"><i class="fa fa-coffee"></i><span>${__("Tidak ada order dimasak")}</span></div>`);
			return;
		}

		if (!pending.length) {
			$pending.html(`<div class="imogi-kds-empty"><i class="fa fa-check-circle"></i><span>${__("Semua order sudah diproses")}</span></div>`);
		} else {
			pending.forEach((order) => $pending.append(this.build_card(order)));
		}

		if (!preparing.length) {
			$preparing.html(`<div class="imogi-kds-empty"><i class="fa fa-fire"></i><span>${__("Belum ada yang dimasak")}</span></div>`);
		} else {
			preparing.forEach((order) => $preparing.append(this.build_card(order)));
		}
	}

	build_card(order) {
		const type_meta = IMOGI_KDS_ORDER_TYPE_META[order.order_type] || {
			icon: "fa-tag",
			tone: "default",
		};
		const items = (order.items || [])
			.map(
				(item) => `<li>
					<span class="imogi-kds-item-qty">${flt(item.qty, 0)}×</span>
					<span class="imogi-kds-item-name">${frappe.utils.escape_html(item.item_name || item.item_code)}</span>
				</li>`
			)
			.join("");
		const short_ref = (order.pos_order || order.name || "").replace(/^ORD-/, "#");

		const $card = $(`
			<article class="imogi-kds-card" data-kitchen-order="${frappe.utils.escape_html(order.name)}">
				<div class="imogi-kds-card-bar imogi-kds-card-bar--${type_meta.tone}"></div>
				<div class="imogi-kds-card-body">
					<div class="imogi-kds-card-top">
						<div>
							<div class="imogi-kds-card-id">${frappe.utils.escape_html(short_ref)}</div>
							<div class="imogi-kds-card-ref">${frappe.utils.escape_html(order.name)}</div>
						</div>
						<span class="imogi-kds-type imogi-kds-type--${type_meta.tone}">
							<i class="fa ${type_meta.icon}"></i>${frappe.utils.escape_html(order.order_type || "-")}
						</span>
					</div>
					<div class="imogi-kds-customer">
						<i class="fa fa-user"></i>
						<span>${frappe.utils.escape_html(order.customer_name || __("Walk-in"))}</span>
					</div>
					<ul class="imogi-kds-items">${items || `<li><span class="imogi-kds-item-name text-muted">${__("Tidak ada item")}</span></li>`}</ul>
					<div class="imogi-kds-meta">
						<span class="imogi-kds-timer"><i class="fa fa-clock-o"></i> <strong class="imogi-kds-timer-value">—</strong></span>
						<div class="imogi-kds-sla"><div class="imogi-kds-sla-fill"></div></div>
					</div>
					<div class="imogi-kds-actions"></div>
				</div>
			</article>
		`);

		this.paint_timer($card, order);

		const $actions = $card.find(".imogi-kds-actions");
		if (order.status === "Pending") {
			$actions.html(`
				<button type="button" class="imogi-kds-btn imogi-kds-btn--start">
					<i class="fa fa-play"></i> ${__("Mulai Masak")}
				</button>`);
			$actions.find(".imogi-kds-btn--start").on("click", () => this.update_status(order.name, "Preparing"));
		} else {
			$actions.html(`
				<button type="button" class="imogi-kds-btn imogi-kds-btn--ready">
					<i class="fa fa-check"></i> ${__("Siap / Ready")}
				</button>`);
			$actions.find(".imogi-kds-btn--ready").on("click", () => this.complete(order.name));
		}

		return $card;
	}

	paint_timer($card, order) {
		const timer = this.get_timer_state(order);
		const $timer = $card.find(".imogi-kds-timer");
		$timer.toggleClass("is-urgent", timer.urgent);
		$card.toggleClass("is-urgent", timer.urgent);
		$card.find(".imogi-kds-timer-value").text(timer.label);
		$card.find(".imogi-kds-sla-fill")
			.css("width", `${timer.progress}%`)
			.toggleClass("is-warning", timer.warning)
			.toggleClass("is-urgent", timer.urgent);
	}

	get_timer_state(order) {
		const limit = cint(order.timer_minutes) || 15;
		if (!order.started_at) {
			return { label: __("Baru"), progress: 0, warning: false, urgent: false };
		}
		const started = frappe.datetime.str_to_obj(order.started_at);
		const elapsed_sec = Math.max(0, Math.floor((Date.now() - started.getTime()) / 1000));
		const elapsed_min = Math.floor(elapsed_sec / 60);
		const sec = elapsed_sec % 60;
		const progress = Math.min(100, Math.round((elapsed_min / limit) * 100));
		const urgent = elapsed_min >= limit;
		const warning = !urgent && elapsed_min >= Math.max(1, Math.floor(limit * 0.7));
		return {
			label: `${elapsed_min}:${String(sec).padStart(2, "0")}`,
			progress,
			warning,
			urgent,
		};
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
				frappe.show_alert({ message: __("Pesanan siap — lanjut fulfillment/service"), indicator: "green" });
				this.refresh();
			},
		});
	}
};
