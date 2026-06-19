const PROMO_TYPE_LABELS = {
	"Buy X Get Y Free": __("Beli X Gratis Y"),
	"Buy X Get Other Free": __("Beli X Dapat Lain"),
	"Qty Discount Percent": __("Diskon"),
	"Qty Discount Amount": __("Diskon"),
};

frappe.listview_settings["IMOGI POS Promo Rule"] = {
	add_fields: [
		"rule_type",
		"is_active",
		"valid_from",
		"valid_upto",
		"min_qty",
		"trigger_item_code",
		"trigger_item_group",
		"company",
		"promo_name",
	],
	hide_name_column: false,
	onload(listview) {
		inject_promo_list_css();
		listview.page.set_title(__("Promo Rule"));
		listview._imogi_promo_status = "all";
		listview._imogi_promo_client_filter = null;
		patch_prepare_data(listview);
		mount_list_filters(listview);
		hide_rule_type_column(listview);
	},
	get_indicator(doc) {
		const status = promo_list_status(doc);
		return [status.label, status.color, status.filter];
	},
	formatters: {
		promo_name(_value, _df, doc) {
			const label = PROMO_TYPE_LABELS[doc.rule_type] || doc.rule_type || "—";
			const summary = promo_list_summary(doc);
			const title = summary ? `${label} · ${summary}` : label;
			return `<span class="imogi-promo-list-type" title="${frappe.utils.escape_html(title)}">${frappe.utils.escape_html(
				label
			)}</span>`;
		},
		company(value) {
			return value || "—";
		},
	},
};

function inject_promo_list_css() {
	["imogi-promo-list-css-v1", "imogi-promo-list-css-v2", "imogi-promo-list-css-v3", "imogi-promo-list-css-v4", "imogi-promo-list-css-v5"].forEach(
		(id) => document.getElementById(id)?.remove()
	);
	frappe.dom.set_style(
		`
		body[data-route*="IMOGI POS Promo Rule"] .layout-main-section-wrapper,
		body[data-route*="IMOGI POS Promo Rule"] .layout-main-section {
			background: #fff !important;
		}
		body[data-route*="IMOGI POS Promo Rule"] .list-row-col[data-fieldname="rule_type"],
		body[data-route*="IMOGI POS Promo Rule"] .list-headers .list-row-col[data-fieldname="rule_type"] {
			display: none !important;
		}
		body[data-route*="IMOGI POS Promo Rule"] .list-row-col[data-fieldname="promo_name"],
		body[data-route*="IMOGI POS Promo Rule"] .list-headers .list-row-col[data-fieldname="promo_name"] {
			min-width: 160px;
		}
		.imogi-promo-list-type {
			color: #0f1f35;
			display: block;
			font-size: 12px;
			font-weight: 600;
			line-height: 1.4;
		}
		.imogi-promo-list-filters {
			display: flex;
			flex-wrap: wrap;
			gap: 6px;
			margin: 0 0 12px;
			padding: 0 2px;
		}
		.imogi-promo-list-filter-btn {
			background: #fff;
			border: 1px solid #d1d5db;
			border-radius: 4px;
			color: #374151;
			cursor: pointer;
			font-size: 11px;
			font-weight: 600;
			padding: 5px 10px;
		}
		.imogi-promo-list-filter-btn:hover { border-color: #0f1f35; color: #0f1f35; }
		.imogi-promo-list-filter-btn.is-active {
			background: #0f1f35;
			border-color: #0f1f35;
			color: #fff;
		}
		`,
		"imogi-promo-list-css-v6"
	);
}

function patch_prepare_data(listview) {
	const original = listview.prepare_data.bind(listview);
	listview.prepare_data = function (response) {
		original(response);
		if (typeof listview._imogi_promo_client_filter === "function") {
			listview.data = (listview.data || []).filter(listview._imogi_promo_client_filter);
		}
	};
}

function hide_rule_type_column(listview) {
	const relabel = () => {
		listview.$result
			?.find('.list-headers [data-fieldname="promo_name"] .list-col-title')
			.text(__("Nama Promo"));
	};
	relabel();
	listview.$result?.on("refresh.imogi-promo-list", () => setTimeout(relabel, 0));
}

function mount_list_filters(listview) {
	const $page = listview.$page || listview.page?.main;
	if (!$page || $page.find(".imogi-promo-list-filters").length) return;

	const filters = [
		{ key: "all", label: __("Semua") },
		{ key: "live", label: __("Berjalan") },
		{ key: "scheduled", label: __("Dijadwalkan") },
		{ key: "expired", label: __("Kadaluarsa") },
		{ key: "belum", label: __("Belum berlaku") },
	];

	const $bar = $('<div class="imogi-promo-list-filters"></div>');
	filters.forEach((f) => {
		const $btn = $(`<button type="button" class="imogi-promo-list-filter-btn" data-key="${f.key}">${f.label}</button>`);
		if (f.key === "all") $btn.addClass("is-active");
		$btn.on("click", () => {
			$bar.find(".imogi-promo-list-filter-btn").removeClass("is-active");
			$btn.addClass("is-active");
			apply_list_filter(listview, f.key);
		});
		$bar.append($btn);
	});

	const $target = $page.find(".frappe-list").first();
	if ($target.length) {
		$target.before($bar);
	} else {
		listview.page.main.prepend($bar);
	}
}

function apply_list_filter(listview, status_key) {
	listview._imogi_promo_status = status_key;
	listview._imogi_promo_client_filter = null;

	const dt = listview.doctype;
	const today = frappe.datetime.get_today();
	const filters = get_status_filters(dt, status_key, today);

	const run = () => {
		if (!filters.length) {
			return Promise.resolve(listview.refresh());
		}
		return listview.filter_area.set(filters);
	};

	if (status_key === "belum") {
		listview._imogi_promo_client_filter = (doc) => !doc.valid_from || !doc.valid_upto;
		if (listview.filter_area?.clear) {
			return listview.filter_area.clear(false).then(() => listview.refresh());
		}
		return listview.refresh();
	}

	if (listview.filter_area?.clear) {
		return listview.filter_area.clear(false).then(run);
	}
	return run();
}

function get_status_filters(doctype, status_key, today) {
	if (status_key === "live") {
		return [
			[doctype, "valid_from", "<=", today],
			[doctype, "valid_upto", ">=", today],
		];
	}
	if (status_key === "scheduled") {
		return [
			[doctype, "valid_from", ">", today],
			[doctype, "valid_from", "is", "set"],
			[doctype, "valid_upto", "is", "set"],
		];
	}
	if (status_key === "expired") {
		return [
			[doctype, "valid_upto", "<", today],
			[doctype, "valid_upto", "is", "set"],
		];
	}
	return [];
}

function promo_list_status(doc) {
	const today = frappe.datetime.get_today();
	if (!doc.valid_from || !doc.valid_upto) {
		return { label: __("Belum berlaku"), color: "grey", filter: "valid_from,is,not set" };
	}
	if (today < doc.valid_from) {
		return { label: __("Dijadwalkan"), color: "orange", filter: `valid_from,>,${today}` };
	}
	if (today > doc.valid_upto) {
		return { label: __("Kadaluarsa"), color: "red", filter: `valid_upto,<,${today}` };
	}
	return { label: __("Berjalan"), color: "green", filter: `valid_from,<=,${today}` };
}

function promo_list_summary(doc) {
	const min_qty = cint(doc.min_qty || 1);
	const trigger = doc.trigger_item_code || doc.trigger_item_group || "";
	const period = promo_list_period(doc);
	const parts = [];
	if (trigger) parts.push(`${__("min")} ${min_qty}× ${trigger}`);
	if (period) parts.push(period);
	return parts.filter(Boolean).join(" · ");
}

function promo_list_period(doc) {
	if (!doc.valid_from && !doc.valid_upto) return __("Belum berlaku");
	const from = doc.valid_from ? frappe.datetime.str_to_user(doc.valid_from) : "…";
	const upto = doc.valid_upto ? frappe.datetime.str_to_user(doc.valid_upto) : "…";
	return `${from} – ${upto}`;
}
