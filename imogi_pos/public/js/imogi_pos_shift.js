frappe.provide("imogi_pos");

imogi_pos.ensure_shift_helpers = function () {
	if (typeof imogi_pos.init_denominations_map === "function") {
		return;
	}
	imogi_pos.IDR_DENOMINATIONS = [
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
	imogi_pos.IDR_QUICK_DENOMINATIONS = [
		{ value: 10000, label: "10 rb" },
		{ value: 50000, label: "50 rb" },
		{ value: 100000, label: "100 rb" },
		{ value: 500000, label: "500 rb" },
		{ value: 1000000, label: "1 Juta" },
	];
	imogi_pos.get_shift_denom_list = function (detailMode) {
		return cint(detailMode) ? imogi_pos.IDR_DENOMINATIONS : imogi_pos.IDR_QUICK_DENOMINATIONS;
	};
	imogi_pos.init_denominations_map = function (detailMode) {
		const map = {};
		imogi_pos.get_shift_denom_list(detailMode).forEach((d) => {
			map[d.value] = 0;
		});
		return map;
	};
	imogi_pos.format_local_date_long =
		imogi_pos.format_local_date_long ||
		function () {
			return new Date().toLocaleDateString("id-ID");
		};
	imogi_pos.format_local_time =
		imogi_pos.format_local_time ||
		function () {
			return new Date().toLocaleTimeString("id-ID", { hour12: false });
		};
};

imogi_pos.format_local_date_long = function () {
	const days = [__("Minggu"), __("Senin"), __("Selasa"), __("Rabu"), __("Kamis"), __("Jumat"), __("Sabtu")];
	const months = [
		__("Januari"),
		__("Februari"),
		__("Maret"),
		__("April"),
		__("Mei"),
		__("Juni"),
		__("Juli"),
		__("Agustus"),
		__("September"),
		__("Oktober"),
		__("November"),
		__("Desember"),
	];
	const d = new Date();
	return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

imogi_pos.format_local_time = function () {
	const d = new Date();
	const h = String(d.getHours()).padStart(2, "0");
	const m = String(d.getMinutes()).padStart(2, "0");
	const s = String(d.getSeconds()).padStart(2, "0");
	return `${h}:${m}:${s}`;
};

imogi_pos.IDR_DENOMINATIONS = [
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

imogi_pos.IDR_QUICK_DENOMINATIONS = [
	{ value: 10000, label: "10 rb" },
	{ value: 50000, label: "50 rb" },
	{ value: 100000, label: "100 rb" },
	{ value: 500000, label: "500 rb" },
	{ value: 1000000, label: "1 Juta" },
];

imogi_pos.get_shift_denom_list = function (detailMode) {
	return cint(detailMode) ? imogi_pos.IDR_DENOMINATIONS : imogi_pos.IDR_QUICK_DENOMINATIONS;
};

imogi_pos.get_shift_denom_qty_label = function (detailMode) {
	return cint(detailMode) ? __("lembar") : __("kali");
};

imogi_pos.format_shift_denom_qty = function (qty, detailMode) {
	return `${flt(qty)} ${imogi_pos.get_shift_denom_qty_label(detailMode)}`;
};

imogi_pos.inject_shift_workflow_header_css = function () {
	if (document.getElementById("imogi-shift-workflow-header-css-v1")) return;
	frappe.dom.set_style(
		`
		.imogi-shift-header {
			align-items: center;
			background: linear-gradient(145deg, #0f1f35 0%, #1a3352 100%);
			border: 1px solid rgba(255,255,255,0.12);
			border-radius: 16px;
			display: flex;
			flex-wrap: wrap;
			gap: 16px;
			justify-content: space-between;
			margin-bottom: 20px;
			padding: 18px 22px;
		}
		.imogi-shift-header-left { align-items: center; display: flex; gap: 14px; min-width: 0; }
		.imogi-shift-store-icon {
			align-items: center; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18);
			border-radius: 12px; color: #fff; display: flex; flex-shrink: 0; font-size: 20px; height: 48px;
			justify-content: center; width: 48px;
		}
		.imogi-shift-header-title { color: #fff; font-size: 22px; font-weight: 800; letter-spacing: -.02em; line-height: 1.2; margin: 0 0 2px; word-break: break-word; }
		.imogi-shift-header-sub { color: rgba(255,255,255,0.72); font-size: 13px; line-height: 1.35; margin: 0; word-break: break-word; }
		.imogi-shift-header-right { align-items: center; color: rgba(255,255,255,0.88); display: flex; flex-wrap: wrap; font-size: 13px; font-weight: 600; gap: 10px 16px; justify-content: flex-end; min-width: 0; }
		.imogi-shift-header-right span { align-items: center; display: inline-flex; gap: 6px; }
		.imogi-shift-btn-logout {
			background: rgba(255,255,255,0.12) !important; border: 1px solid rgba(255,255,255,0.24) !important;
			border-radius: 10px !important; color: #fff !important; font-size: 13px !important; font-weight: 700 !important;
			padding: 8px 14px !important;
		}
		.imogi-shift-btn-logout:hover { background: rgba(255,255,255,0.2) !important; color: #fff !important; }
		.imogi-shift-btn-logout .fa { margin-right: 4px; opacity: .85; }
		@media (max-width: 640px) {
			.imogi-shift-header { align-items: stretch; border-radius: 14px; flex-direction: column; gap: 10px; margin-bottom: 14px; padding: 14px; }
			.imogi-shift-header-left { gap: 10px; width: 100%; }
			.imogi-shift-store-icon { height: 42px; width: 42px; }
			.imogi-shift-header-title { font-size: 18px; }
			.imogi-shift-header-sub { font-size: 12px; }
			.imogi-shift-header-right { align-items: flex-start; flex-direction: column; gap: 8px; justify-content: flex-start; width: 100%; }
			.imogi-shift-header-right span { font-size: 12px; }
			.imogi-shift-btn-logout { width: 100%; }
		}
		`,
		"imogi-shift-workflow-header-css-v1"
	);
};

imogi_pos.render_shift_workflow_header = function ({
	title,
	subtitle,
	icon = "fa-shopping-bag",
	dateLong,
	timeStr,
	showLogout = true,
	logoutTitle = "",
}) {
	const logoutTitleAttr = logoutTitle
		? ` title="${frappe.utils.escape_html(logoutTitle)}"`
		: "";
	return `
		<div class="imogi-shift-header">
			<div class="imogi-shift-header-left">
				<div class="imogi-shift-store-icon"><i class="fa ${icon}"></i></div>
				<div>
					<h1 class="imogi-shift-header-title">${title}</h1>
					<p class="imogi-shift-header-sub">${frappe.utils.escape_html(subtitle || "")}</p>
				</div>
			</div>
			<div class="imogi-shift-header-right">
				<span><i class="fa fa-calendar-o"></i> <span class="imogi-shift-date">${frappe.utils.escape_html(dateLong || "")}</span></span>
				<span><i class="fa fa-clock-o"></i> <span class="imogi-shift-clock">${timeStr || ""}</span></span>
				${
					showLogout
						? `<button type="button" class="btn imogi-shift-btn-logout imogi-shift-logout-btn"${logoutTitleAttr}><i class="fa fa-sign-out"></i> ${__(
								"Logout"
						  )}</button>`
						: ""
				}
			</div>
		</div>
	`;
};

imogi_pos.init_denominations_map = function (detailMode) {
	const map = {};
	imogi_pos.get_shift_denom_list(detailMode).forEach((d) => {
		map[d.value] = 0;
	});
	return map;
};

imogi_pos.inject_cash_denom_css = function () {
	["imogi-cash-denom-css-v1", "imogi-cash-denom-css-v2", "imogi-cash-denom-css-v3", "imogi-cash-denom-css-v4"].forEach(
		(id) => document.getElementById(id)?.remove()
	);
	imogi_pos.inject_shift_workflow_header_css?.();
	if (document.getElementById("imogi-cash-denom-css-v6")) return;
	frappe.dom.set_style(
		`
		.imogi-cash-denom-grid {
			box-sizing: border-box;
			display: grid;
			gap: 10px;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			max-width: 100%;
			width: 100%;
		}
		@media (min-width: 768px) { .imogi-cash-denom-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
		.imogi-cash-denom-grid.imogi-cash-quick-grid {
			align-content: start;
			gap: 14px;
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		@media (min-width: 640px) {
			.imogi-cash-denom-grid.imogi-cash-quick-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
		}
		.imogi-cash-quick-grid .imogi-cash-denom-add {
			min-height: 92px;
			padding: 16px 12px;
		}
		@media (min-width: 768px) {
			.imogi-cash-quick-grid .imogi-cash-denom-add { min-height: 112px; }
			.imogi-cash-quick-grid .imogi-cash-denom-label { font-size: 18px; }
			.imogi-cash-quick-grid .imogi-cash-denom-qty { font-size: 12px; }
		}
		.imogi-cash-denom-hint { color: #71717a; font-size: 12px; line-height: 1.4; margin: -8px 0 12px; }
		.imogi-cash-denom-item { box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; min-width: 0; width: 100%; }
		.imogi-cash-denom-add {
			align-items: center; background: #f4f4f5; border: 2px solid #e4e4e7; border-radius: 12px;
			box-sizing: border-box; color: #0f1f35; cursor: pointer; display: flex; flex-direction: column; gap: 4px;
			justify-content: center; min-height: 72px; padding: 12px 10px; touch-action: manipulation;
			transition: background .15s, border-color .15s, transform .1s; width: 100%;
		}
		.imogi-cash-denom-add:hover { background: #eef2ff; border-color: #c7d2fe; }
		.imogi-cash-denom-add:active { transform: scale(0.98); }
		.imogi-cash-denom-add.is-active { background: #0f1f35; border-color: #0f1f35; color: #fff; }
		.imogi-cash-denom-add.is-active .imogi-cash-denom-qty { color: rgba(255,255,255,0.82); }
		.imogi-cash-denom-label { font-size: 15px; font-weight: 800; letter-spacing: -.01em; line-height: 1.2; word-break: break-word; }
		.imogi-cash-denom-qty { color: #71717a; font-size: 11px; font-weight: 700; }
		.imogi-cash-denom-meta { align-items: center; display: flex; gap: 8px; justify-content: space-between; min-width: 0; width: 100%; }
		.imogi-cash-denom-minus {
			align-items: center; background: #fff; border: 1px solid #d4d4d8; border-radius: 8px; color: #52525b;
			cursor: pointer; display: inline-flex; flex-shrink: 0; font-size: 16px; font-weight: 800; height: 32px;
			justify-content: center; touch-action: manipulation; width: 32px;
		}
		.imogi-cash-denom-minus:disabled { cursor: not-allowed; opacity: .35; }
		.imogi-cash-denom-eq { color: #71717a; flex: 1; font-size: 11px; font-variant-numeric: tabular-nums; font-weight: 700; min-width: 0; overflow-wrap: anywhere; text-align: right; }
		.imogi-cash-denom-detail-grid {
			box-sizing: border-box;
			display: grid;
			gap: 14px 16px;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			max-width: 100%;
			width: 100%;
		}
		@media (min-width: 768px) { .imogi-cash-denom-detail-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
		.imogi-cash-denom-detail-item { box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
		.imogi-cash-denom-detail-label { color: #52525b; font-size: 12px; font-weight: 700; }
		.imogi-cash-denom-detail-row { align-items: center; display: flex; gap: 8px; min-width: 0; width: 100%; }
		.imogi-shift-denom-qty {
			background: #fafafa; border: 1px solid #e4e4e7; border-radius: 10px; box-sizing: border-box;
			color: #0f1f35; flex: 1; font-size: 14px; font-variant-numeric: tabular-nums; font-weight: 700;
			min-width: 0; padding: 10px 12px; width: 100%;
		}
		.imogi-shift-denom-qty:focus { background: #fff; border-color: #a1a1aa; box-shadow: none; outline: none; }
		.imogi-cash-denom-detail-eq { color: #71717a; flex-shrink: 0; font-size: 11px; font-variant-numeric: tabular-nums; font-weight: 700; white-space: nowrap; }
		@media (max-width: 640px) {
			.imogi-cash-denom-grid { gap: 8px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
			.imogi-cash-denom-add { border-radius: 10px; min-height: 62px; padding: 10px 8px; }
			.imogi-cash-denom-label { font-size: 13px; }
			.imogi-cash-denom-qty { font-size: 10px; }
			.imogi-cash-denom-minus { height: 28px; width: 28px; }
			.imogi-cash-denom-eq { font-size: 10px; }
			.imogi-cash-denom-hint { font-size: 11px; margin-bottom: 10px; }
			.imogi-cash-denom-detail-grid { gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
			.imogi-shift-denom-qty { font-size: 13px; padding: 9px 10px; }
			.imogi-cash-denom-detail-eq { font-size: 10px; }
		}
		`,
		"imogi-cash-denom-css-v6"
	);
};

imogi_pos._shift_denom_detail_mode = function (pageOrMode) {
	if (typeof pageOrMode === "object" && pageOrMode !== null) {
		return pageOrMode.is_cash_detail_mode?.() ?? cint(pageOrMode.cash_detail_mode);
	}
	return cint(pageOrMode);
};

imogi_pos.render_cash_denom_grid = function (denominations, formatRp, detailMode) {
	const list = imogi_pos.get_shift_denom_list(detailMode);
	const qtyLabel = imogi_pos.get_shift_denom_qty_label(detailMode);
	return list
		.map((d) => {
			const qty = flt(denominations[d.value]);
			const subtotal = qty * d.value;
			const activeClass = qty > 0 ? " is-active" : "";
			return `
			<div class="imogi-cash-denom-item" data-denom="${d.value}">
				<button type="button" class="imogi-cash-denom-add${activeClass}" data-denom="${d.value}">
					<span class="imogi-cash-denom-label">${d.label}</span>
					<span class="imogi-cash-denom-qty">${qty} ${qtyLabel}</span>
				</button>
				<div class="imogi-cash-denom-meta">
					<button type="button" class="imogi-cash-denom-minus" data-denom="${d.value}" ${
						qty ? "" : "disabled"
					} aria-label="${__("Kurangi")}">−</button>
					<span class="imogi-cash-denom-eq">${formatRp(subtotal)}</span>
				</div>
			</div>
		`;
		})
		.join("");
};

imogi_pos.render_cash_denom_detail_grid = function (denominations, formatRp) {
	return imogi_pos.IDR_DENOMINATIONS.map((d) => {
		const qty = flt(denominations[d.value]);
		const subtotal = qty * d.value;
		return `
			<div class="imogi-cash-denom-detail-item" data-denom="${d.value}">
				<div class="imogi-cash-denom-detail-label">${d.label}</div>
				<div class="imogi-cash-denom-detail-row">
					<input type="number" min="0" step="1" inputmode="numeric"
						class="imogi-shift-denom-qty imogi-cash-denom-detail-input" data-denom="${d.value}"
						value="${qty ? qty : ""}" placeholder="0">
					<span class="imogi-cash-denom-detail-eq">= ${formatRp(subtotal)}</span>
				</div>
			</div>
		`;
	}).join("");
};

imogi_pos.update_cash_denom_detail_item = function ($wrapper, denom, denominations, formatRp, onUpdate) {
	const qty = flt(denominations[denom]);
	const subtotal = qty * denom;
	const $item = $wrapper.find(`.imogi-cash-denom-detail-item[data-denom="${denom}"]`);
	$item.find(".imogi-cash-denom-detail-input").val(qty || "");
	$item.find(".imogi-cash-denom-detail-eq").text(`= ${formatRp(subtotal)}`);
	onUpdate?.();
};

imogi_pos.bind_cash_denom_detail_inputs = function ($wrapper, page, formatRp, onUpdate) {
	$wrapper.find(".imogi-cash-denom-detail-input").on("input", (e) => {
		const denom = flt(e.currentTarget.dataset.denom);
		const raw = String(e.currentTarget.value || "").trim();
		const qty = raw === "" ? 0 : Math.max(0, Math.floor(flt(raw)));
		page.denominations[denom] = qty;
		if (String(qty) !== raw && raw !== "") {
			e.currentTarget.value = qty || "";
		}
		imogi_pos.update_cash_denom_detail_item($wrapper, denom, page.denominations, formatRp, onUpdate);
	});
};

imogi_pos.update_cash_denom_item = function ($wrapper, denom, denominations, formatRp, onUpdate, detailMode) {
	const qty = flt(denominations[denom]);
	const subtotal = qty * denom;
	const qtyLabel = imogi_pos.get_shift_denom_qty_label(detailMode);
	const $item = $wrapper.find(`.imogi-cash-denom-item[data-denom="${denom}"]`);
	$item.find(".imogi-cash-denom-qty").text(`${qty} ${qtyLabel}`);
	$item.find(".imogi-cash-denom-eq").text(formatRp(subtotal));
	$item.find(".imogi-cash-denom-minus").prop("disabled", qty <= 0);
	$item.find(".imogi-cash-denom-add").toggleClass("is-active", qty > 0);
	onUpdate?.();
};

imogi_pos.bind_cash_denom_buttons = function ($wrapper, page, formatRp, onUpdate) {
	const detailMode = imogi_pos._shift_denom_detail_mode(page);
	$wrapper.find(".imogi-cash-denom-add").on("click", (e) => {
		const denom = flt(e.currentTarget.dataset.denom);
		page.denominations[denom] = flt(page.denominations[denom]) + 1;
		imogi_pos.update_cash_denom_item($wrapper, denom, page.denominations, formatRp, onUpdate, detailMode);
	});

	$wrapper.find(".imogi-cash-denom-minus").on("click", (e) => {
		const denom = flt(e.currentTarget.dataset.denom);
		page.denominations[denom] = Math.max(0, flt(page.denominations[denom]) - 1);
		imogi_pos.update_cash_denom_item($wrapper, denom, page.denominations, formatRp, onUpdate, detailMode);
	});
};

imogi_pos.close_shift = function (opening) {
	if (!opening || !opening.name) {
		frappe.msgprint({
			message: __("Tidak ada shift terbuka."),
			indicator: "orange",
		});
		return;
	}

	frappe.route_options = {
		imogi_return_to_cashier: 1,
		pos_opening_entry: opening.name,
	};
	frappe.set_route("imogi-pos-close-shift");
};
