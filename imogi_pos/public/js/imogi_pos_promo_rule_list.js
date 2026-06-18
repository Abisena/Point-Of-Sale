const PROMO_TYPE_LABELS = {
	"Buy X Get Y Free": __("Beli X Gratis Y"),
	"Buy X Get Other Free": __("Beli X Dapat Lain"),
	"Qty Discount Percent": __("Diskon %"),
	"Qty Discount Amount": __("Diskon Rp"),
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
	onload(listview) {
		inject_promo_list_css();
		listview.page.set_title(__("Promo Rule"));
		mount_list_filters(listview);
		patch_list_headers(listview);
	},
	get_indicator(doc) {
		const status = promo_list_status(doc);
		return [status.label, status.color, status.filter];
	},
	formatters: {
		promo_name(value, _df, doc) {
			const summary = promo_list_summary(doc);
			if (!summary) return "—";
			return `<span class="imogi-promo-list-meta" title="${frappe.utils.escape_html(summary)}">${frappe.utils.escape_html(
				summary
			)}</span>`;
		},
		rule_type(value) {
			return PROMO_TYPE_LABELS[value] || value || "—";
		},
		company(value) {
			return value || "—";
		},
	},
};

function inject_promo_list_css() {
	["imogi-promo-list-css-v1", "imogi-promo-list-css-v2", "imogi-promo-list-css-v3", "imogi-promo-list-css-v4"].forEach(
		(id) => document.getElementById(id)?.remove()
	);
	frappe.dom.set_style(
		`
		body[data-route*="IMOGI POS Promo Rule"] .layout-main-section-wrapper,
		body[data-route*="IMOGI POS Promo Rule"] .layout-main-section {
			background: #fff !important;
		}
		body[data-route*="IMOGI POS Promo Rule"] .list-row-col[data-fieldname="promo_name"],
		body[data-route*="IMOGI POS Promo Rule"] .list-headers .list-row-col[data-fieldname="promo_name"] {
			min-width: 200px;
		}
		.imogi-promo-list-meta {
			color: #64748b;
			display: block;
			font-size: 12px;
			line-height: 1.4;
			max-width: 420px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
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
		"imogi-promo-list-css-v5"
	);
}

function mount_list_filters(listview) {
	const $page = listview.$page || listview.page?.main;
	if (!$page || $page.find(".imogi-promo-list-filters").length) return;

	const filters = [
		{ key: "all", label: __("Semua"), filter: null },
		{ key: "live", label: __("Berjalan"), filter: "live" },
		{ key: "scheduled", label: __("Dijadwalkan"), filter: "scheduled" },
		{ key: "expired", label: __("Kadaluarsa"), filter: "expired" },
		{ key: "belum", label: __("Belum berlaku"), filter: "belum" },
	];

	const $bar = $('<div class="imogi-promo-list-filters"></div>');
	filters.forEach((f) => {
		const $btn = $(`<button type="button" class="imogi-promo-list-filter-btn" data-key="${f.key}">${f.label}</button>`);
		if (f.key === "all") $btn.addClass("is-active");
		$btn.on("click", () => {
			$bar.find(".imogi-promo-list-filter-btn").removeClass("is-active");
			$btn.addClass("is-active");
			apply_list_filter(listview, f);
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

function apply_list_filter(listview, filter_def) {
	const clear_and_refresh = () => {
		if (listview.filter_area?.clear) {
			listview.filter_area.clear().then(() => listview.refresh());
		} else {
			listview.refresh();
		}
	};

	if (!filter_def.filter) {
		clear_and_refresh();
		return;
	}

	const today = frappe.datetime.get_today();
	const dt = listview.doctype;
	let filters = filter_def.filter;

	if (filter_def.key === "live") {
		filters = [
			[dt, "valid_from", "<=", today],
			[dt, "valid_upto", ">=", today],
		];
	} else if (filter_def.key === "scheduled") {
		filters = [
			[dt, "valid_from", ">", today],
			[dt, "valid_upto", "is", "set"],
		];
	} else if (filter_def.key === "expired") {
		filters = [[dt, "valid_upto", "<", today]];
	} else if (filter_def.key === "belum") {
		filters = [[dt, "valid_from", "is", "not set"]];
	}

	const apply = () => {
		if (Array.isArray(filters[0])) {
			filters.forEach((f) => listview.filter_area.add(f));
		} else {
			listview.filter_area.add(filters);
		}
		listview.refresh();
	};

	if (listview.filter_area?.clear) {
		listview.filter_area.clear().then(apply);
	} else {
		apply();
	}
}

function patch_list_headers(listview) {
	const relabel = () => {
		listview.$result
			?.find('.list-headers [data-fieldname="promo_name"] .list-col-title')
			.text(__("Ringkasan"));
	};
	relabel();
	listview.$result?.on("refresh.imogi-promo-list", () => setTimeout(relabel, 0));
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
