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
	imogi_pos.init_denominations_map = function () {
		const map = {};
		imogi_pos.IDR_DENOMINATIONS.forEach((d) => {
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

imogi_pos.init_denominations_map = function () {
	const map = {};
	imogi_pos.IDR_DENOMINATIONS.forEach((d) => {
		map[d.value] = 0;
	});
	return map;
};

imogi_pos.inject_cash_denom_css = function () {
	["imogi-cash-denom-css-v1", "imogi-cash-denom-css-v2"].forEach((id) =>
		document.getElementById(id)?.remove()
	);
	if (document.getElementById("imogi-cash-denom-css-v3")) return;
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
		@media (max-width: 640px) {
			.imogi-cash-denom-grid { gap: 8px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
			.imogi-cash-denom-add { border-radius: 10px; min-height: 62px; padding: 10px 8px; }
			.imogi-cash-denom-label { font-size: 13px; }
			.imogi-cash-denom-qty { font-size: 10px; }
			.imogi-cash-denom-minus { height: 28px; width: 28px; }
			.imogi-cash-denom-eq { font-size: 10px; }
			.imogi-cash-denom-hint { font-size: 11px; margin-bottom: 10px; }
		}
		`,
		"imogi-cash-denom-css-v3"
	);
};

imogi_pos.render_cash_denom_grid = function (denominations, formatRp) {
	return imogi_pos.IDR_DENOMINATIONS.map((d) => {
		const qty = flt(denominations[d.value]);
		const subtotal = qty * d.value;
		const activeClass = qty > 0 ? " is-active" : "";
		return `
			<div class="imogi-cash-denom-item" data-denom="${d.value}">
				<button type="button" class="imogi-cash-denom-add${activeClass}" data-denom="${d.value}">
					<span class="imogi-cash-denom-label">${d.label}</span>
					<span class="imogi-cash-denom-qty">${qty} ${__("lembar")}</span>
				</button>
				<div class="imogi-cash-denom-meta">
					<button type="button" class="imogi-cash-denom-minus" data-denom="${d.value}" ${
						qty ? "" : "disabled"
					} aria-label="${__("Kurangi")}">−</button>
					<span class="imogi-cash-denom-eq">${formatRp(subtotal)}</span>
				</div>
			</div>
		`;
	}).join("");
};

imogi_pos.update_cash_denom_item = function ($wrapper, denom, denominations, formatRp, onUpdate) {
	const qty = flt(denominations[denom]);
	const subtotal = qty * denom;
	const $item = $wrapper.find(`.imogi-cash-denom-item[data-denom="${denom}"]`);
	$item.find(".imogi-cash-denom-qty").text(`${qty} ${__("lembar")}`);
	$item.find(".imogi-cash-denom-eq").text(formatRp(subtotal));
	$item.find(".imogi-cash-denom-minus").prop("disabled", qty <= 0);
	$item.find(".imogi-cash-denom-add").toggleClass("is-active", qty > 0);
	onUpdate?.();
};

imogi_pos.bind_cash_denom_buttons = function ($wrapper, page, formatRp, onUpdate) {
	$wrapper.find(".imogi-cash-denom-add").on("click", (e) => {
		const denom = flt(e.currentTarget.dataset.denom);
		page.denominations[denom] = flt(page.denominations[denom]) + 1;
		imogi_pos.update_cash_denom_item($wrapper, denom, page.denominations, formatRp, onUpdate);
	});

	$wrapper.find(".imogi-cash-denom-minus").on("click", (e) => {
		const denom = flt(e.currentTarget.dataset.denom);
		page.denominations[denom] = Math.max(0, flt(page.denominations[denom]) - 1);
		imogi_pos.update_cash_denom_item($wrapper, denom, page.denominations, formatRp, onUpdate);
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
