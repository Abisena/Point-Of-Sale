frappe.provide("imogi_pos.settings");

frappe.ui.form.on("IMOGI POS Settings", {
	onload(frm) {
		ensure_imogi_styles(() => init_settings_page(frm));
	},

	refresh(frm) {
		ensure_imogi_styles(() => {
			init_settings_page(frm);
			add_page_toolbar_buttons(frm);
		});
	},

	generate_order_api_key(frm) {
		imogi_pos.settings_api.regenerate(frm);
	},

	enable_order_api(frm) {
		render_api_dock_summary(frm);
	},

	enable_order_api_webhook(frm) {
		toggle_webhook_url_visibility(frm);
	},

	enable_loyalty(frm) {
		render_loyalty_dock_summary(frm);
	},

	enable_stamp_card(frm) {
		render_loyalty_dock_summary(frm);
	},

	enable_promo_rules(frm) {
		render_loyalty_dock_summary(frm);
	},

	enable_payment_gateway(frm) {
		render_payment_dock_summary(frm);
	},

	payment_gateway_provider(frm) {
		render_payment_dock_summary(frm);
	},

	payment_gateway_sandbox(frm) {
		render_payment_dock_summary(frm);
	},

	enable_transfer_payment_info(frm) {
		render_transfer_dock_summary(frm);
	},

	transfer_bank_name(frm) {
		render_transfer_dock_summary(frm);
	},

	transfer_bank_account(frm) {
		render_transfer_dock_summary(frm);
	},

	transfer_account_holder(frm) {
		render_transfer_dock_summary(frm);
	},

	transfer_instructions(frm) {
		render_transfer_dock_summary(frm);
	},

	enable_offline_cashier(frm) {
		render_integrations_dock_summary(frm);
	},

	enable_marketplace_orders(frm) {
		render_integrations_dock_summary(frm);
	},

	royalty_expense_account(frm) {
		render_franchise_dock_summary(frm);
	},

	royalty_payable_account(frm) {
		render_franchise_dock_summary(frm);
	},

	after_save(frm) {
		show_pending_api_credentials(frm);
		render_target_dock_summary(frm);
		render_loyalty_dock_summary(frm);
		render_payment_dock_summary(frm);
		render_transfer_dock_summary(frm);
		render_integrations_dock_summary(frm);
		render_franchise_dock_summary(frm);
		if (is_erp_enterprise_deployment()) {
			frappe.publish_realtime("imogi_pos_settings_updated", {
				enable_pos_shift: cint(frm.doc.enable_pos_shift),
			});
			return;
		}
		frappe.call({
			method: "imogi_pos.api.feature_api.get_workspace_tier_context",
			callback(r) {
				const ctx = r.message || {};
				const tier = ctx.tier;
				if (tier && frm.doc.subscription_tier !== tier) {
					frm.doc.subscription_tier = tier;
					frm.refresh_field("subscription_tier");
					fetch_settings_tier_locks(frm);
				}
				frappe.publish_realtime("imogi_pos_settings_updated", {
					enable_pos_shift: cint(frm.doc.enable_pos_shift),
					subscription_tier: tier || frm.doc.subscription_tier,
				});
				if (imogi_pos.apply_workspace_tier_context) {
					imogi_pos.apply_workspace_tier_context(ctx);
				}
			},
		});
	},

	target_monthly_sales(frm) {
		if (__imogi_settings_active_tab === "general") {
			render_receipt_preview(frm);
		}
		if (__imogi_settings_active_tab === "more") {
			render_target_dock_summary(frm);
		}
	},

	store_city(frm) {
		render_receipt_preview(frm);
	},

	owner_whatsapp(frm) {
		render_receipt_preview(frm);
	},

	receipt_header(frm) {
		render_receipt_preview(frm);
	},

	receipt_footer(frm) {
		render_receipt_preview(frm);
	},

	default_company(frm) {
		render_receipt_preview(frm);
	},

	enable_pos_shift(frm) {
		render_shift_dock_summary(frm);
	},

	default_pos_profile(frm) {
		render_shift_dock_summary(frm);
	},

	default_opening_time(frm) {
		render_shift_dock_summary(frm);
	},

	default_closing_time(frm) {
		render_shift_dock_summary(frm);
	},

	business_type(frm) {
		render_mode_summary(frm);
		toggle_settings_by_business_type(frm);
	},

	subscription_tier(frm) {
		fetch_settings_tier_locks(frm);
	},

	enable_saas_billing_sync(frm) {
		apply_billing_ui_state(frm);
	},

	billing_auto_apply_tier(frm) {
		apply_billing_ui_state(frm);
	},

	upgrade_subscription_tier(frm) {
		open_subscription_tier_picker(frm);
	},

	sync_subscription_tier(frm) {
		frappe.call({
			method: "imogi_pos.api.billing_api.sync_subscription_tier",
			freeze: true,
			freeze_message: __("Menyinkronkan tier dari billing..."),
			callback(r) {
				if (r.exc) return;
				const msg = r.message || {};
				frappe.msgprint({
					title: __("Tier Disinkronkan"),
					indicator: "green",
					message: `${__("Sebelum")}: ${frappe.utils.escape_html(msg.before || "-")}<br>${__(
						"Sesudah"
					)}: ${frappe.utils.escape_html(msg.after || "-")}`,
				});
				frm.reload_doc();
			},
		});
	},

	enable_kitchen_display(frm) {
		toggle_settings_by_business_type(frm);
		render_mode_summary(frm);
		render_kitchen_dock_summary(frm);
	},

	enable_fulfillment(frm) {
		toggle_settings_by_business_type(frm);
		render_mode_summary(frm);
		render_kitchen_dock_summary(frm);
	},

	import_products(frm) {
		open_product_import_dialog(frm);
	},

	import_bom(frm) {
		open_bom_import_dialog(frm);
	},

	import_menu(frm) {
		open_menu_import_dialog(frm);
	},

	import_stock(frm) {
		open_stock_import_dialog(frm);
	},

	sync_branch_prices(frm) {
		frappe.call({
			method: "imogi_pos.api.branch_hq_api.hq_push_prices",
			freeze: true,
			freeze_message: __("Menyinkronkan harga ke semua cabang..."),
			callback(r) {
				if (r.exc) return;
				const msg = r.message || {};
				frappe.msgprint({
					title: __("Sync Harga Selesai"),
					indicator: "green",
					message: `${__("Master")}: ${frappe.utils.escape_html(msg.master || "-")}<br>${__(
						"Target lists"
					)}: ${(msg.targets || []).length}<br>${__("Updated")}: ${msg.updated || 0}<br>${__(
						"Created"
					)}: ${msg.created || 0}`,
				});
			},
		});
	},

	hq_ensure_branch_price_lists(frm) {
		frappe.call({
			method: "imogi_pos.api.branch_hq_api.hq_ensure_branch_price_lists",
			args: { company: frm.doc.default_company },
			freeze: true,
			callback(r) {
				if (r.exc) return;
				const msg = r.message || {};
				frappe.msgprint({
					title: __("Price List Cabang"),
					indicator: "green",
					message: __("Dibuat untuk {0} cabang", [msg.count || 0]),
				});
			},
		});
	},

	generate_franchise_royalty(frm) {
		frappe.call({
			method: "imogi_pos.api.franchise_api.generate_monthly_royalty",
			args: { company: frm.doc.default_company },
			freeze: true,
			callback(r) {
				if (r.exc) return;
				const msg = r.message || {};
				const created = (msg.created || []).length;
				frappe.msgprint({
					title: __("Royalty Franchise"),
					indicator: "green",
					message: __("Accrual dibuat: {0}. Total royalty: {1}", [
						created,
						format_currency((msg.summary || {}).total_royalty || 0),
					]),
				});
			},
		});
	},

	post_franchise_royalty_journals(frm) {
		frappe.call({
			method: "imogi_pos.api.franchise_api.post_monthly_royalty_journals",
			args: { company: frm.doc.default_company },
			freeze: true,
			callback(r) {
				if (r.exc) return;
				const msg = r.message || {};
				frappe.msgprint({
					title: __("Royalty Journal"),
					indicator: "green",
					message: __("Journal Entry dipost: {0} dari {1} accrual", [
						(msg.posted || []).length,
						msg.total || 0,
					]),
				});
			},
		});
	},

	hq_push_menu_from_branch(frm) {
		frappe.call({
			method: "imogi_pos.api.branch_hq_api.get_hq_dashboard",
			args: { company: frm.doc.default_company },
			callback(r) {
				const branches = (r.message || {}).branches || [];
				if (branches.length < 2) {
					frappe.msgprint(__("Butuh minimal 2 cabang aktif."));
					return;
				}
				const options = branches.map((b) => ({
					label: b.branch_name || b.branch_code,
					value: b.branch_code,
				}));
				const dialog = new frappe.ui.Dialog({
					title: __("Push Menu dari Cabang Template"),
					fields: [
						{
							fieldname: "source_branch_code",
							fieldtype: "Select",
							label: __("Cabang Template"),
							options: options,
							reqd: 1,
						},
					],
					primary_action_label: __("Push"),
					primary_action(values) {
						frappe.call({
							method: "imogi_pos.api.branch_hq_api.hq_push_menu_template",
							args: {
								source_branch_code: values.source_branch_code,
								company: frm.doc.default_company,
							},
							freeze: true,
							callback(res) {
								dialog.hide();
								if (res.exc) return;
								const msg = res.message || {};
								frappe.msgprint({
									title: __("Menu Ter-push"),
									indicator: "green",
									message: __("Cabang diperbarui: {0}", [
										(msg.updated_branches || []).join(", "),
									]),
								});
							},
						});
					},
				});
				dialog.show();
			},
		});
	},
});

const SETTINGS_TABS = [
	{
		id: "general",
		label: __("Dasar"),
		icon: "fa-sliders",
		desc: __("Mode operasional dan identitas toko"),
		sections: ["store_identity_section", "branch_pricing_section", "general_section", "flow_section"],
	},
	{
		id: "transactions",
		label: __("Transaksi"),
		icon: "fa-exchange",
		desc: __("Loyalty, stamp card, dan promo otomatis"),
		sections: ["loyalty_section", "stamp_section", "promo_section"],
	},
	{
		id: "payment",
		label: __("Pembayaran"),
		icon: "fa-credit-card",
		desc: __("Payment gateway QRIS dan rekening transfer bank"),
		sections: ["payment_gateway_section", "transfer_payment_section"],
	},
	{
		id: "inventory",
		label: __("Produk & Stok"),
		icon: "fa-cubes",
		desc: __("Stok otomatis, import menu, produk & BOM"),
		sections: ["inventory_section", "import_section"],
	},
	{
		id: "tax",
		label: __("Pajak & Service"),
		icon: "fa-percent",
		desc: __("Franchise royalty dan akun pajak"),
		sections: ["franchise_section"],
	},
	{
		id: "receipt",
		label: __("Printer & Struk"),
		icon: "fa-print",
		desc: __("Cetak struk thermal di kasir"),
		sections: ["receipt_section"],
	},
	{
		id: "integrations",
		label: __("Integrasi"),
		icon: "fa-plug",
		desc: __("Order API, offline cashier, dan marketplace"),
		sections: ["api_section", "integrations_section", "billing_section"],
	},
	{
		id: "more",
		label: __("Lainnya"),
		icon: "fa-ellipsis-h",
		desc: __("Role & akses, notifikasi, pajak, dan pengaturan lanjutan"),
		sections: ["operations_section", "analytics_section", "franchise_section"],
	},
];

const IMOGI_TIER_PERKS = {
	Free: [__("Fitur dasar kasir"), __("Dashboard penjualan"), __("Laporan harian")],
	Starter: [__("Customer & meja"), __("Multi payment & QRIS"), __("Hold order")],
	Professional: [__("Kitchen & fulfillment"), __("Loyalty & promo"), __("Shift kasir")],
	Enterprise: [
		__("Semua fitur tersedia"),
		__("Update & support prioritas"),
		__("Integrasi tanpa batas"),
	],
};

/** Form layout order — section breaks + fields (matches imogi_pos_settings.json field_order). */
const SETTINGS_FORM_LAYOUT = [
	{ section: "setup_section" },
	"business_type",
	"business_template",
	"mode_summary",
	"setup_complete",
	{ section: "store_identity_section" },
	"store_city",
	"owner_whatsapp",
	"multi_branch",
	{ section: "branch_pricing_section" },
	"master_selling_price_list",
	"sync_prices_to_branches_on_import",
	"sync_branch_prices",
	"hq_push_menu_from_branch",
	"hq_ensure_branch_price_lists",
	"target_monthly_sales",
	"default_opening_time",
	"default_closing_time",
	{ section: "general_section" },
	"subscription_tier",
	"upgrade_subscription_tier",
	"default_company",
	"default_pos_profile",
	"default_warehouse",
	"enable_pos_shift",
	{ section: "billing_section" },
	"enable_saas_billing_sync",
	"billing_provider",
	"billing_external_id",
	"billing_plan_code",
	"billing_status",
	"billing_period_end",
	"billing_last_synced",
	"billing_auto_apply_tier",
	"billing_webhook_secret",
	"sync_subscription_tier",
	{ section: "flow_section" },
	"enable_kitchen_display",
	"enable_fulfillment",
	"kitchen_item_groups",
	"fulfillment_for_order_types",
	{ section: "inventory_section" },
	"low_stock_check_interval",
	"low_stock_alert_roles",
	"reorder_level_field",
	"enable_auto_purchase_request",
	{ section: "receipt_section" },
	"enable_receipt_print",
	"thermal_print_mode",
	"thermal_printer_width",
	"receipt_print_format",
	"receipt_header",
	"receipt_footer",
	{ section: "import_section" },
	"import_menu",
	"import_stock",
	"import_products",
	"import_bom",
	{ section: "analytics_section" },
	"enable_realtime_notifications",
	"dashboard_refresh_seconds",
	{ section: "loyalty_section" },
	"enable_loyalty",
	"loyalty_points_per_amount",
	"loyalty_point_value",
	"loyalty_min_redeem_points",
	{ section: "stamp_section" },
	"enable_stamp_card",
	"stamp_target",
	"stamp_reward_discount_type",
	"stamp_reward_discount_value",
	"stamp_reward_min_order",
	{ section: "promo_section" },
	"enable_promo_rules",
	{ section: "payment_gateway_section" },
	"enable_payment_gateway",
	"payment_gateway_provider",
	"payment_gateway_sandbox",
	"payment_gateway",
	"payment_gateway_key",
	"payment_gateway_client_key",
	{ section: "transfer_payment_section" },
	"enable_transfer_payment_info",
	"transfer_bank_name",
	"transfer_bank_account",
	"transfer_account_holder",
	"transfer_instructions",
	{ section: "api_section" },
	"enable_order_api",
	"order_api_user",
	"enable_order_api_webhook",
	"order_api_webhook_url",
	{ section: "integrations_section" },
	"enable_offline_cashier",
	"enable_marketplace_orders",
	"marketplace_webhook_secret",
	{ section: "operations_section" },
	"enable_role_gating",
	"enable_approval_workflow",
	"approval_discount_threshold_percent",
	"approval_supervisor_pin",
	"enable_central_kitchen",
	"central_kitchen_station",
	"enable_kitchen_printer",
	"enable_cashback",
	"cashback_percent",
	"enable_birthday_promo",
	"birthday_discount_percent",
	{ section: "franchise_section" },
	"generate_franchise_royalty",
	"post_franchise_royalty_journals",
	"royalty_expense_account",
	"royalty_payable_account",
	"printer_setup_status",
	"generate_order_api_key",
	"order_api_key",
	"order_api_secret",
	"order_api_info",
];

const SETTINGS_BILLING_FIELD_NAMES = [
	"enable_saas_billing_sync",
	"billing_provider",
	"billing_external_id",
	"billing_plan_code",
	"billing_status",
	"billing_period_end",
	"billing_last_synced",
	"billing_auto_apply_tier",
	"billing_webhook_secret",
	"sync_subscription_tier",
];

function is_erp_enterprise_deployment() {
	return imogi_pos.is_erp_enterprise_deployment ? imogi_pos.is_erp_enterprise_deployment() : true;
}

function hide_enterprise_subscription_ui(frm) {
	set_settings_section_visible(frm, "billing_section", false);
	SETTINGS_BILLING_FIELD_NAMES.forEach((fieldname) => frm.toggle_display(fieldname, false));
}

const SETTINGS_ALWAYS_HIDDEN_FIELDS = new Set([
	"business_type",
	"business_template",
	"setup_complete",
	"subscription_tier",
	"upgrade_subscription_tier",
	"printer_setup_status",
	"generate_order_api_key",
	"order_api_key",
	"order_api_secret",
	"order_api_info",
]);

let __imogi_settings_active_tab = "general";

const LEGACY_SETTINGS_TAB_MAP = {
	roles: "more",
	notifications: "more",
	tax: "more",
	security: "more",
	activity: "more",
};

function normalize_settings_tab_id(tabId) {
	return LEGACY_SETTINGS_TAB_MAP[tabId] || tabId || "general";
}

function settings_flat_head_html(title, hint) {
	const hint_html = hint
		? `<div class="imogi-settings-flat-hint">${frappe.utils.escape_html(hint)}</div>`
		: "";
	return `<div class="imogi-settings-flat-head">${frappe.utils.escape_html(title)}</div>${hint_html}`;
}

function get_settings_section_fields(section_name) {
	const fields = [];
	let capture = false;
	for (const item of SETTINGS_FORM_LAYOUT) {
		if (item.section) {
			if (item.section === section_name) {
				capture = true;
				continue;
			}
			if (capture) break;
			continue;
		}
		if (capture) fields.push(item);
	}
	return fields;
}

function get_all_settings_tab_sections() {
	const names = [];
	for (const item of SETTINGS_FORM_LAYOUT) {
		if (item.section && item.section !== "setup_section") names.push(item.section);
	}
	return names;
}

const ENDPOINT_GROUPS = {
	order: {
		label: __("Order"),
		desc: __("Buat, bayar, cek status, void & refund"),
		keys: ["create", "pay", "status", "void", "refund", "partial_refund"],
	},
	catalog: {
		label: __("Katalog"),
		desc: __("List produk & detail item"),
		keys: ["items", "item"],
	},
	customer: {
		label: __("Customer"),
		desc: __("Cari, lihat & buat customer"),
		keys: ["customers", "customer", "create_customer"],
	},
};

function ensure_imogi_styles(callback) {
	const run = () => callback && callback();
	if (window.__imogi_settings_styles_ready) {
		run();
		return;
	}
	inject_imogi_settings_css();
	frappe.require("/assets/imogi_pos/css/imogi_pos.css").then(() => {
		window.__imogi_settings_styles_ready = true;
		run();
	});
}

function inject_imogi_settings_css() {
	if (document.getElementById("imogi-settings-inline-css-v14")) return;
	document.getElementById("imogi-settings-inline-css")?.remove();
	document.getElementById("imogi-settings-inline-css-v2")?.remove();
	document.getElementById("imogi-settings-inline-css-v3")?.remove();
	document.getElementById("imogi-settings-inline-css-v4")?.remove();
	document.getElementById("imogi-settings-inline-css-v5")?.remove();
	document.getElementById("imogi-settings-inline-css-v6")?.remove();
	document.getElementById("imogi-settings-inline-css-v7")?.remove();
	document.getElementById("imogi-settings-inline-css-v8")?.remove();
	document.getElementById("imogi-settings-inline-css-v9")?.remove();
	document.getElementById("imogi-settings-inline-css-v10")?.remove();
	document.getElementById("imogi-settings-inline-css-v11")?.remove();
	document.getElementById("imogi-settings-inline-css-v12")?.remove();
	document.getElementById("imogi-settings-inline-css-v13")?.remove();
	frappe.dom.set_style(`
		.imogi-settings-page .layout-side-section,
		.imogi-settings-page .form-sidebar { display: none !important; }
		.imogi-settings-page .layout-main-section-wrapper,
		.imogi-settings-page .layout-main-section,
		.imogi-settings-page .form-page { background: #fff !important; }
		.imogi-settings-page .page-head {
			background: #fff !important;
			border-bottom: 1px solid #e2e6ec;
			margin: 0 0 12px;
			padding: 10px 18px 12px;
		}
		.imogi-settings-page .page-head .page-title {
			color: #111827;
			font-size: 18px;
			font-weight: 700;
		}
		.imogi-settings-page .page-head .page-icon-group { display: none; }
		.imogi-settings-workspace {
			--imogi-settings-gutter: 18px;
			background: #fff;
			border: 1px solid #e2e6ec;
			margin-bottom: 16px;
		}
		.imogi-settings-tabbar {
			align-items: stretch;
			background: #fff;
			border-bottom: 1px solid #e2e6ec;
			display: flex;
			flex-wrap: nowrap;
			gap: 0;
			min-height: 40px;
			overflow: hidden;
			padding: 0;
		}
		.imogi-settings-tab-nav-wrap {
			align-items: stretch;
			display: flex;
			flex: 1;
			margin: 0;
			min-width: 0;
			overflow: hidden;
			position: static;
			top: auto;
		}
		.imogi-settings-tab-nav-scroll {
			flex: 1;
			min-width: 0;
			overflow-x: auto;
			overflow-y: hidden;
			scrollbar-width: thin;
			-webkit-overflow-scrolling: touch;
		}
		.imogi-settings-tab-nav-scroll::-webkit-scrollbar { height: 4px; }
		.imogi-settings-tab-nav-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 999px; }
		.imogi-settings-tab-nav {
			background: transparent;
			border: none;
			border-radius: 0;
			display: inline-flex;
			flex: 0 0 auto;
			flex-wrap: nowrap;
			gap: 0;
			min-width: max-content;
			padding: 0 var(--imogi-settings-gutter, 18px);
			width: max-content;
		}
		.imogi-settings-tab-btn {
			align-items: center;
			background: none;
			border: none;
			border-bottom: 2px solid transparent;
			border-radius: 0;
			box-shadow: none;
			color: #6b7280;
			cursor: pointer;
			display: inline-flex;
			flex: 0 0 auto;
			font-size: 13px;
			font-weight: 600;
			justify-content: center;
			margin-bottom: -1px;
			min-height: 42px;
			padding: 10px 14px;
			transition: color .15s, border-color .15s;
			white-space: nowrap;
		}
		.imogi-settings-tab-btn:hover { background: none; color: #0f1f35; }
		.imogi-settings-tab-btn.is-active {
			background: none;
			border-bottom-color: #0f1f35;
			box-shadow: none;
			color: #0f1f35;
		}
		.imogi-settings-tab-desc { display: none !important; }
		.imogi-settings-sidebar-label,
		.imogi-settings-tab-icon,
		.imogi-settings-card-head,
		.imogi-settings-card-icon,
		.imogi-settings-help-card,
		.imogi-settings-trust-row { display: none !important; }
		.imogi-settings-body { display: block; margin-bottom: 0; overflow: visible; }
		.imogi-settings-main {
			display: flex;
			flex-direction: column;
			gap: 0;
			margin: 0;
			max-width: none;
			overflow: visible;
			padding: 0 var(--imogi-settings-gutter, 18px);
			width: 100%;
		}
		.imogi-settings-content { min-width: 0; overflow: visible; }
		.imogi-settings-tab-intro {
			border-bottom: 1px solid #f3f4f6;
			margin: 0;
			padding: 14px 0 12px;
		}
		.imogi-settings-tab-intro-title {
			color: #111827;
			font-size: 13px;
			font-weight: 700;
			line-height: 1.25;
			margin-bottom: 2px;
		}
		.imogi-settings-tab-intro-desc {
			color: #6b7280;
			font-size: 11px;
			line-height: 1.4;
			max-width: 640px;
		}
		.imogi-settings-content-inner {
			margin: 0;
			max-width: none;
			padding: 16px 0 24px;
			width: 100%;
		}
		.imogi-settings-main .form-section[data-fieldname="setup_section"] .section-body {
			margin: 0;
			max-width: none;
			padding: 16px 0 0;
		}
		.imogi-settings-page .imogi-settings-main .form-section {
			padding-left: 0;
			padding-right: 0;
		}
		.imogi-settings-page .imogi-settings-main .section-body > .row {
			margin-left: 0;
			margin-right: 0;
		}
		.imogi-settings-page .imogi-settings-main .form-column,
		.imogi-settings-page .imogi-settings-main .section-body .col-sm-12,
		.imogi-settings-page .imogi-settings-main .section-body .col-sm-6 {
			padding-left: 0 !important;
			padding-right: 0 !important;
		}
		.imogi-settings-page .imogi-settings-flat-section > .imogi-settings-flat-head,
		.imogi-settings-page .imogi-settings-flat-section > .imogi-settings-flat-hint,
		.imogi-settings-page .imogi-settings-main .section-body .imogi-settings-flat-head,
		.imogi-settings-page .imogi-settings-main .section-body .imogi-settings-flat-hint {
			margin-left: 0;
			padding-left: 0;
		}
		.imogi-settings-page:not([data-active-tab="general"]) .form-section[data-fieldname="setup_section"] {
			display: none !important;
		}
		.imogi-settings-tab-panel--general .form-section[data-fieldname="setup_section"] {
			border-bottom: 1px solid #f3f4f6;
		}
		.imogi-settings-tab-panel .form-section:not(.hide-control):last-child {
			padding-bottom: 0;
		}
		.imogi-settings-flat-head {
			color: #0f1f35;
			font-size: 13px;
			font-weight: 700;
			line-height: 1.25;
			margin: 0 0 6px;
		}
		.imogi-settings-flat-hint {
			color: #6b7280;
			font-size: 11px;
			line-height: 1.35;
			margin: -2px 0 10px;
		}
		.imogi-settings-page .imogi-settings-flat-section {
			margin-bottom: 20px;
		}
		.imogi-settings-page .imogi-settings-flat-section .section-body {
			background: #fafafa !important;
			border: 1px solid #eceef2 !important;
			border-radius: 8px !important;
			box-shadow: none !important;
			margin-bottom: 16px !important;
			padding: 16px 18px !important;
		}
		.imogi-settings-page .imogi-store-identity-section .section-body {
			background: transparent !important;
			border: none !important;
			border-radius: 0 !important;
			margin-bottom: 0 !important;
			padding: 0 !important;
		}
		/* ── Field grid: label atas, 2 kolom ── */
		.imogi-settings-page .imogi-settings-field-grid .form-column.col-sm-12 > form {
			align-items: start;
			display: grid;
			gap: 14px 20px;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			width: 100%;
		}
		.imogi-settings-page .imogi-settings-field-grid .form-column > form > .frappe-control,
		.imogi-settings-page .imogi-settings-field-grid .form-column > form > .input-max-width {
			margin-bottom: 0 !important;
			max-width: 100% !important;
			padding: 0 !important;
			width: 100% !important;
		}
		.imogi-settings-page .imogi-settings-field-grid .frappe-control .control-label {
			color: #374151;
			float: none !important;
			font-size: 11px;
			font-weight: 600;
			line-height: 1.35;
			margin-bottom: 4px !important;
			padding: 0 !important;
			width: auto !important;
		}
		.imogi-settings-page .imogi-settings-field-grid .frappe-control .form-control {
			font-size: 12px;
			min-height: 34px;
			padding: 5px 10px;
		}
		.imogi-settings-page .imogi-store-form-grid,
		.imogi-settings-page .imogi-shift-form-grid,
		.imogi-settings-page .imogi-kitchen-form-grid {
			display: grid;
			gap: 12px 16px;
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.imogi-settings-page .imogi-store-form-grid > .frappe-control,
		.imogi-settings-page .imogi-shift-form-grid > .frappe-control,
		.imogi-settings-page .imogi-kitchen-form-grid > .frappe-control {
			margin-bottom: 0 !important;
			max-width: 100% !important;
			width: 100% !important;
		}
		.imogi-settings-field-grid .form-column .control-input,
		.imogi-settings-field-grid .form-column .control-input-wrapper,
		.imogi-settings-field-grid .form-column input.form-control,
		.imogi-settings-field-grid .form-column select.form-control,
		.imogi-settings-field-grid .form-column .link-field {
			max-width: 100% !important;
			width: 100% !important;
		}
		.imogi-settings-field-grid .frappe-control[data-fieldtype="Check"],
		.imogi-settings-field-grid .frappe-control[data-fieldtype="Small Text"],
		.imogi-settings-field-grid .frappe-control[data-fieldtype="Text"],
		.imogi-settings-field-grid .frappe-control[data-fieldtype="Text Editor"],
		.imogi-settings-field-grid .frappe-control[data-fieldtype="Table"],
		.imogi-settings-field-grid .frappe-control[data-fieldtype="Button"],
		.imogi-settings-field-grid .imogi-api-dock,
		.imogi-settings-field-grid .imogi-loyalty-dock,
		.imogi-settings-field-grid .imogi-payment-dock,
		.imogi-settings-field-grid .imogi-transfer-dock,
		.imogi-settings-field-grid .imogi-integrations-dock,
		.imogi-settings-field-grid .imogi-franchise-dock,
		.imogi-settings-field-grid .imogi-billing-dock,
		.imogi-settings-field-grid .imogi-import-dock,
		.imogi-settings-field-grid .imogi-target-dock,
		.imogi-settings-field-grid .imogi-shift-settings-dock,
		.imogi-settings-field-grid .imogi-kitchen-settings-dock {
			grid-column: 1 / -1;
		}
		.imogi-settings-tab-panel--general .imogi-settings-flow-strip {
			align-items: center;
			background: #fafafa;
			border: 1px solid #eceef2;
			border-radius: 8px;
			display: grid;
			gap: 12px 16px;
			grid-template-columns: minmax(0, 1fr) auto;
			margin-bottom: 16px;
			padding: 14px 16px;
		}
		.imogi-settings-tab-panel--general .imogi-store-identity-layout {
			align-items: start;
			gap: 16px;
			grid-template-columns: minmax(0, 1fr) minmax(240px, 300px);
		}
		.imogi-settings-dock-grid {
			display: flex;
			flex-direction: column;
			gap: 12px;
			margin-top: 12px;
		}
		.imogi-settings-help-link {
			align-items: center;
			border-left: 1px solid #f3f4f6;
			color: #6b7280;
			display: inline-flex;
			flex-shrink: 0;
			font-size: 11px;
			font-weight: 600;
			gap: 5px;
			height: 40px;
			padding: 0 14px;
			text-decoration: none !important;
			white-space: nowrap;
		}
		.imogi-settings-help-link:hover { color: #0f1f35; }
		.imogi-settings-flow-main { min-width: 0; }
		.imogi-settings-flow-desc { font-size: 11px; line-height: 1.4; margin-bottom: 0 !important; }
		.imogi-settings-flow-actions {
			align-items: center;
			display: flex;
			flex-shrink: 0;
			flex-wrap: wrap;
			gap: 6px;
			justify-content: flex-end;
		}
		.imogi-settings-flow-actions .btn { font-size: 11px; padding: 4px 10px; }
		.imogi-settings-tab-panel--general .imogi-receipt-preview-wrap { position: sticky; top: 8px; }
		.imogi-settings-tab-panel--more .imogi-settings-target-host { margin-bottom: 12px; }
		.imogi-settings-tab-panel--inventory .imogi-import-dock {
			gap: 10px;
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.imogi-settings-page .imogi-settings-card-section:last-child .section-body,
		.imogi-settings-page .form-section:last-child .section-body { border-bottom: none !important; }
		.imogi-settings-page .frappe-control { margin-bottom: 0 !important; }
		.imogi-settings-page .frappe-control .control-label {
			color: #6b7280;
			font-size: 11px;
			font-weight: 600;
		}
		.imogi-settings-page .form-control {
			border-color: #d1d5db;
			border-radius: 6px;
			min-height: 34px;
		}
		.imogi-settings-page .form-control:focus {
			border-color: #111827;
			box-shadow: 0 0 0 1px #111827;
		}
		.imogi-settings-flow-strip {
			margin-bottom: 0;
			padding-bottom: 0;
		}
		.imogi-settings-chip {
			background: #fff;
			border: 1px solid #d1d5db;
			border-radius: 999px;
			color: #374151;
			font-size: 10px;
			font-weight: 700;
			padding: 2px 8px;
		}
		.imogi-settings-flow-top {
			align-items: center;
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
			margin-bottom: 6px;
		}
		.imogi-settings-flow-top strong { color: #111827; font-size: 14px; }
		.imogi-settings-flow-desc {
			color: #6b7280;
			font-size: 12px;
			line-height: 1.5;
			margin: 0 0 12px;
		}
		.imogi-settings-flow-actions .btn-primary {
			background: #111827 !important;
			border-color: #111827 !important;
		}
		.imogi-receipt-preview-wrap {
			background: #fafafa !important;
			border: 1px solid #eceef2 !important;
			border-radius: 8px !important;
			padding: 14px !important;
		}
		.imogi-receipt-preview-paper {
			background: #fff !important;
			border: 1px solid #e5e7eb !important;
			border-radius: 6px !important;
			box-shadow: none !important;
		}
		.imogi-settings-page .imogi-mode-summary-host .control-label,
		.imogi-settings-page .form-section[data-fieldname="setup_section"] .section-head,
		.imogi-settings-page .imogi-section-api .section-head,
		.imogi-settings-page .imogi-section-loyalty .section-head,
		.imogi-settings-page .imogi-section-payment .section-head,
		.imogi-settings-page .imogi-section-integrations .section-head,
		.imogi-settings-page .imogi-section-franchise .section-head,
		.imogi-settings-page .imogi-section-operations .section-head,
		.imogi-settings-page .imogi-settings-tabbed .form-section .section-head { display: none !important; }
		.imogi-settings-page .imogi-settings-content .form-layout { max-width: none; }
		.imogi-docs-section:not(.is-active),
		.imogi-ep-panel:not(.is-active) { display: none !important; }
		.imogi-settings-page .btn.imogi-toolbar-docs-btn,
		.imogi-settings-page .custom-btn.imogi-toolbar-docs-btn {
			background: #fff !important;
			border: 1px solid #d1d5db !important;
			color: #111827 !important;
			font-weight: 600 !important;
		}
		.imogi-settings-page .btn.imogi-toolbar-docs-btn:hover,
		.imogi-settings-page .custom-btn.imogi-toolbar-docs-btn:hover {
			background: #111827 !important;
			border-color: #111827 !important;
			color: #fff !important;
		}
		.imogi-settings-page .frappe-control[data-imogi-tier-locked="1"] .control-label::after {
			content: " 🔒"; font-size: 11px; opacity: 0.75;
		}
		.imogi-settings-page .imogi-pill.is-green,
		.imogi-settings-page .imogi-pill.is-orange {
			background: #fff !important;
			border: 1px solid #d1d5db !important;
			border-radius: 999px !important;
			color: #374151 !important;
			font-size: 10px !important;
			font-weight: 700 !important;
			padding: 2px 8px !important;
		}
		.imogi-loyalty-dock {
			margin-bottom: 12px;
		}
		.imogi-loyalty-panel {
			background: #fff;
			border: 1px solid #e5e7eb;
			border-radius: 6px;
			padding: 10px 12px;
		}
		.imogi-mini-stats--grid {
			align-items: center;
			display: flex;
			flex-wrap: wrap;
			gap: 8px 20px;
		}
		.imogi-mini-stat {
			align-items: center;
			background: transparent;
			display: inline-flex;
			flex-wrap: wrap;
			gap: 6px;
			padding: 0;
		}
		.imogi-mini-stat-label {
			color: #9ca3af;
			display: inline;
			font-size: 10px;
			font-weight: 700;
			letter-spacing: 0.04em;
			margin: 0;
			text-transform: uppercase;
		}
		.imogi-mini-stat-val {
			color: #374151;
			display: inline;
			font-size: 11px;
			font-weight: 600;
			margin: 0;
		}
		.imogi-api-dock-icon {
			background: #fff !important;
			border: 1px solid #e5e7eb;
			box-shadow: none !important;
			color: #374151 !important;
		}
		.imogi-shift-settings-dock,
		.imogi-kitchen-settings-dock {
			background: transparent;
			border: none;
			border-top: 1px solid #f3f4f6;
			border-radius: 0;
			margin-top: 18px;
			padding: 18px 0 0;
		}
		.imogi-shift-form-grid,
		.imogi-kitchen-form-grid { display: grid; gap: 10px 14px; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); margin-top: 10px; }
		.imogi-kitchen-form-grid .frappe-control[data-fieldname="kitchen_item_groups"],
		.imogi-kitchen-form-grid .frappe-control[data-fieldname="fulfillment_for_order_types"] { grid-column: 1 / -1; }
		.imogi-shift-quick-links,
		.imogi-kitchen-quick-links {
			align-items: center;
			border-top: 1px solid #f3f4f6;
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
			margin-top: 12px;
			padding-top: 12px;
		}
		.imogi-shift-quick-links a,
		.imogi-kitchen-quick-links a {
			align-items: center;
			background: #fff;
			border: 1px solid #e5e7eb;
			border-radius: 0;
			color: #374151;
			display: inline-flex;
			font-size: 11px;
			font-weight: 600;
			gap: 5px;
			padding: 6px 10px;
			text-decoration: none !important;
		}
		.imogi-shift-quick-links a:hover,
		.imogi-kitchen-quick-links a:hover { background: #f9fafb; border-color: #111827; color: #111827; }
		.imogi-shift-status,
		.imogi-kitchen-status {
			align-items: center;
			background: #fafafa;
			border: 1px solid #e5e7eb;
			border-radius: 0;
			color: #374151;
			display: flex;
			font-size: 12px;
			font-weight: 600;
			gap: 8px;
			margin-top: 10px;
			padding: 8px 12px;
		}
		.imogi-shift-status.is-off,
		.imogi-kitchen-status.is-off { color: #6b7280; }
		@media (max-width: 860px) {
			.imogi-settings-page .imogi-settings-field-grid .form-column.col-sm-12 > form,
			.imogi-settings-page .imogi-store-form-grid,
			.imogi-settings-page .imogi-shift-form-grid,
			.imogi-settings-page .imogi-kitchen-form-grid {
				grid-template-columns: 1fr;
			}
			.imogi-settings-tab-panel--general .imogi-store-identity-layout,
			.imogi-settings-tab-panel--inventory .imogi-import-dock {
				grid-template-columns: 1fr;
			}
			.imogi-settings-tab-panel--general .imogi-receipt-preview-wrap { position: static; }
			.imogi-settings-tab-panel--general .imogi-settings-flow-strip { grid-template-columns: 1fr; }
			.imogi-settings-flow-actions { justify-content: flex-start; }
		}
		@media (max-width: 900px) {
			.imogi-settings-workspace { --imogi-settings-gutter: 14px; }
			.imogi-settings-tab-intro { padding: 10px 0 8px; }
		}
	`, "imogi-settings-inline-css-v14");
}

function hide_marketplace_integration_ui(frm) {
	const hidden = frappe.boot?.imogi_pos_hidden_features || [];
	const hideMarketplace =
		hidden.includes("grabfood_integration") || hidden.includes("gofood_integration");
	["enable_marketplace_orders", "marketplace_webhook_secret"].forEach((fieldname) => {
		frm.toggle_display(fieldname, !hideMarketplace);
	});
	if (hideMarketplace) {
		frm.$wrapper
			.find(".imogi-integrations-dock .imogi-api-dock-sub")
			.text(__("Kasir tetap jalan tanpa internet."));
	}
}

function can_manage_api(frm) {
	if (
		frappe.user.has_role("Administrator") ||
		frappe.user.has_role("System Manager") ||
		frappe.user.has_role("Sales Manager")
	) {
		return true;
	}
	return !!(frm.perm && frm.perm[0] && frm.perm[0].write);
}

function init_settings_page(frm) {
	frm.$wrapper.addClass("imogi-settings-page");
	hide_settings_form_sidebar(frm);
	["generate_order_api_key", "order_api_key", "order_api_secret", "order_api_info", "business_type", "business_template"].forEach(
		(f) => frm.toggle_display(f, false)
	);
	hide_marketplace_integration_ui(frm);
	render_mode_summary(frm);
	toggle_settings_by_business_type(frm);
	build_settings_tabs(frm);
	build_api_dock(frm);
	build_loyalty_dock(frm);
	build_payment_dock(frm);
	build_transfer_dock(frm);
	build_integrations_dock(frm);
	build_franchise_dock(frm);
	build_import_dock(frm);
	build_target_dock(frm);
	build_subscription_tier_dock(frm);
	if (is_erp_enterprise_deployment()) {
		hide_enterprise_subscription_ui(frm);
	} else {
		build_billing_dock(frm);
		apply_billing_ui_state(frm);
		fetch_settings_tier_locks(frm);
	}
	style_form_sections(frm);
	style_setting_cards(frm);
	build_sidebar_help(frm);
	ensure_settings_content_inner(frm);
	activate_settings_tab(frm, normalize_settings_tab_id(__imogi_settings_active_tab));
}

function apply_billing_ui_state(frm) {
	if (is_erp_enterprise_deployment()) {
		return;
	}
	const sync_on = cint(frm.doc.enable_saas_billing_sync);
	const auto_apply = cint(frm.doc.billing_auto_apply_tier);
	frm.set_df_property("subscription_tier", "read_only", sync_on && auto_apply);
	if (sync_on && auto_apply) {
		frm.set_df_property(
			"subscription_tier",
			"description",
			__("Dikelola otomatis oleh billing SaaS. Ubah via webhook atau tombol Sinkronkan.")
		);
	} else {
		frm.set_df_property(
			"subscription_tier",
			"description",
			__("Paket langganan SaaS. Menentukan fitur yang tersedia (lihat Feature Registry).")
		);
	}
	render_billing_dock_summary(frm);
}

function build_subscription_tier_dock(frm) {
	frm.toggle_display("subscription_tier", false);
	frm.toggle_display("upgrade_subscription_tier", false);
	frm.$wrapper.find(".imogi-subscription-dock").remove();
}

function open_subscription_tier_picker(frm) {
	if (imogi_pos.tier_picker && imogi_pos.tier_picker._active_dialog) {
		return;
	}
	if (!imogi_pos.tier_picker) {
		frappe.msgprint(__("Modul tier picker belum dimuat. Muat ulang halaman."));
		return;
	}
	imogi_pos.tier_picker.open({
		on_select() {
			frm.reload_doc().then(() => {
				fetch_settings_tier_locks(frm);
				frappe.call({
					method: "imogi_pos.api.feature_api.get_workspace_tier_context",
					callback(r) {
						if (imogi_pos.apply_workspace_tier_context) {
							imogi_pos.apply_workspace_tier_context(r.message || {});
						}
					},
				});
			});
		},
	});
}

function build_billing_dock(frm) {
	const ctx = get_settings_section(frm, "billing_section");
	if (!ctx || !ctx.$wrapper) return;
	ctx.$wrapper.addClass("imogi-section-billing");

	const $body = ctx.section.body || ctx.$wrapper.find(".section-body");
	if ($body.find(".imogi-billing-dock").length) return;

	$body.prepend(`
		<div class="imogi-billing-dock mb-3">
			<div class="imogi-api-dock-intro">
				<div class="imogi-api-dock-icon"><i class="fa fa-credit-card fa-lg"></i></div>
				<div>
					<div class="imogi-api-dock-title">${__("Integrasi Billing SaaS")}</div>
					<div class="imogi-api-dock-sub">${__(
						"Webhook generik untuk sinkron paket langganan dari Stripe, Midtrans, atau portal billing Anda."
					)}</div>
				</div>
			</div>
			<div class="imogi-billing-panel"></div>
		</div>`);
	render_billing_dock_summary(frm);
}

function render_billing_dock_summary(frm) {
	const $panel = frm.$wrapper.find(".imogi-billing-panel");
	if (!$panel.length) return;

	if (!cint(frm.doc.enable_saas_billing_sync)) {
		$panel.html(`
			<div class="imogi-status-card is-warning">
				<div class="imogi-status-card-icon"><i class="fa fa-lock fa-lg"></i></div>
				<div class="imogi-status-card-body">
					<div class="imogi-status-card-top"><strong>${__("Billing sync belum aktif")}</strong></div>
					<p class="imogi-muted mb-0">${__(
						"Aktifkan toggle di bawah untuk menerima webhook dan mengatur tier otomatis."
					)}</p>
				</div>
			</div>`);
		return;
	}

	$panel.html(`<div class="imogi-status-card is-loading"><i class="fa fa-spinner fa-spin"></i> ${__("Memuat...")}</div>`);

	frappe.call({
		method: "imogi_pos.api.billing_api.get_billing_status",
		callback(r) {
			if (r.exc) {
				$panel.empty();
				return;
			}
			const info = r.message || {};
			const status = frappe.utils.escape_html(info.status || "-");
			const tier = frappe.utils.escape_html(info.effective_tier || "-");
			const webhook = frappe.utils.escape_html(info.webhook_url || "-");
			$panel.html(`
				<div class="imogi-status-card is-success">
					<div class="imogi-status-card-icon"><i class="fa fa-check-circle fa-lg"></i></div>
					<div class="imogi-status-card-body">
						<div class="imogi-status-card-top">
							<strong>${__("Billing sync aktif")}</strong>
							<span class="imogi-pill is-green">${status}</span>
						</div>
						<div class="imogi-mini-stats imogi-mini-stats--grid">
							<div class="imogi-mini-stat">
								<span class="imogi-mini-stat-label">${__("Tier efektif")}</span>
								<span class="imogi-mini-stat-val">${tier}</span>
							</div>
							<div class="imogi-mini-stat">
								<span class="imogi-mini-stat-label">${__("Plan")}</span>
								<span class="imogi-mini-stat-val">${frappe.utils.escape_html(info.plan_code || "-")}</span>
							</div>
							<div class="imogi-mini-stat">
								<span class="imogi-mini-stat-label">${__("Berlaku sampai")}</span>
								<span class="imogi-mini-stat-val">${frappe.utils.escape_html(info.period_end || "-")}</span>
							</div>
							<div class="imogi-mini-stat imogi-mini-stat--wide">
								<span class="imogi-mini-stat-label">${__("Webhook URL")}</span>
								<span class="imogi-mini-stat-val"><code>${webhook}</code></span>
							</div>
						</div>
						<p class="imogi-muted mb-0 mt-2">${__(
							"Header: X-IMOGI-Billing-Signature (HMAC-SHA256 body) jika secret diisi."
						)}</p>
					</div>
				</div>`);
		},
	});
}

function fetch_settings_tier_locks(frm) {
	if (is_erp_enterprise_deployment()) {
		return;
	}
	const tier = frm.doc.subscription_tier || "";
	frappe.call({
		method: "imogi_pos.api.feature_api.get_settings_tier_locks",
		args: { tier },
		callback(r) {
			if (r.message) {
				frm._imogi_tier_locks = r.message;
				apply_settings_tier_locks(frm, r.message);
			}
		},
	});
}

function apply_settings_tier_locks(frm, data) {
	if (is_erp_enterprise_deployment()) {
		return;
	}
	if (!data || !data.locks) return;

	render_tier_lock_banner(frm, data);

	const locks = data.locks;
	Object.keys(locks).forEach((fieldname) => {
		const lock = locks[fieldname];
		if (!frm.fields_dict[fieldname]) return;

		const df = frm.fields_dict[fieldname].df;
		if (df.fieldtype === "Button") {
			set_settings_button_enabled(frm, fieldname, lock.allowed, lock.message);
			return;
		}

		if (lock.allowed) {
			frm.set_df_property(fieldname, "read_only", 0);
			frm.set_df_property(fieldname, "description", "");
			const $allowed = frm.fields_dict[fieldname].$wrapper?.closest(".frappe-control");
			if ($allowed?.length) {
				$allowed.removeAttr("data-imogi-tier-locked").removeAttr("title");
			}
			return;
		}

		if (cint(frm.doc[fieldname])) {
			frm.set_value(fieldname, 0);
		}
		frm.set_df_property(fieldname, "read_only", 1);
		frm.set_df_property(fieldname, "description", lock.message || "");
		const $locked = frm.fields_dict[fieldname].$wrapper?.closest(".frappe-control");
		if ($locked?.length) {
			$locked.attr("data-imogi-tier-locked", "1").attr("title", lock.message || "");
		}
	});

	if (__imogi_settings_active_tab === "transactions") render_loyalty_dock_summary(frm);
	if (__imogi_settings_active_tab === "payment") {
		render_payment_dock_summary(frm);
		render_transfer_dock_summary(frm);
	}
	if (__imogi_settings_active_tab === "integrations") render_integrations_dock_summary(frm);
	if (__imogi_settings_active_tab === "more") render_franchise_dock_summary(frm);
}

function set_settings_button_enabled(frm, fieldname, enabled, message) {
	const field = frm.fields_dict[fieldname];
	if (!field || field.df.fieldtype !== "Button") return;
	const $btn = field.$wrapper.find("button");
	$btn.prop("disabled", !enabled).toggleClass("disabled", !enabled);
	const $ctrl = field.$wrapper.closest(".frappe-control");
	if (enabled) {
		$ctrl.removeAttr("data-imogi-tier-locked").removeAttr("title");
	} else {
		$ctrl.attr("data-imogi-tier-locked", "1").attr("title", message || "");
	}
}

function render_tier_lock_banner(frm, data) {
	const $panel = frm.$wrapper.find(".imogi-mode-summary-host .imogi-tier-panel");
	if (!$panel.length) return;

	const tier = data.tier || frm.doc.subscription_tier || "Enterprise";
	const locked_count = Object.values(data.locks || {}).filter((lock) => !lock.allowed).length;
	const matrix_route = data.matrix_route || "imogi-pos-feature-matrix";
	const sync_on = cint(frm.doc.enable_saas_billing_sync);
	const auto_apply = cint(frm.doc.billing_auto_apply_tier);
	const billing_locked = sync_on && auto_apply;
	const perks = IMOGI_TIER_PERKS[tier] || IMOGI_TIER_PERKS.Enterprise;

	$panel
		.removeClass("is-tier-free is-tier-starter is-tier-professional is-tier-enterprise")
		.addClass(`is-tier-${tier.toLowerCase()}`);
	$panel.find(".imogi-tier-panel-name").text(tier);
	$panel.find(".imogi-tier-panel-perks").html(
		perks.map((p) => `<li><i class="fa fa-check"></i>${frappe.utils.escape_html(p)}</li>`).join("")
	);
	$panel.find(".imogi-hero-tier-upgrade-btn").text(
		billing_locked ? __("Lihat Paket") : __("Kelola Langganan")
	);
	$panel.find(".imogi-hero-tier-matrix-btn").attr("data-route", matrix_route);

	if (locked_count && !billing_locked) {
		$panel.find(".imogi-tier-panel-note").text(__("{0} pengaturan terkunci di paket ini", [locked_count]));
	} else {
		$panel.find(".imogi-tier-panel-note").text("");
	}
}

function get_settings_section(frm, fieldname) {
	const section = frm.get_field(fieldname);
	if (!section) return null;
	const $wrapper = section.$wrapper || section.wrapper || null;
	return { section, $wrapper };
}

function set_settings_field_visible(frm, fieldname, show) {
	if (!frm.fields_dict[fieldname]) return;
	if (SETTINGS_ALWAYS_HIDDEN_FIELDS.has(fieldname)) {
		frm.toggle_display(fieldname, false);
		return;
	}
	frm.toggle_display(fieldname, !!show);
}

function set_settings_section_visible(frm, fieldname, show) {
	const ctx = get_settings_section(frm, fieldname);
	if (ctx && ctx.$wrapper) {
		ctx.$wrapper.toggle(!!show);
		ctx.$wrapper.removeClass("hide-control");
		if (show) {
			if (typeof ctx.section.collapse === "function") {
				ctx.section.collapse(false);
			}
			const $body = ctx.section.body || ctx.$wrapper.find(".section-body");
			$body.removeClass("hide").show();
			ctx.$wrapper.find(".section-head").removeClass("collapsed");
		}
	}

	get_settings_section_fields(fieldname).forEach((fname) => {
		set_settings_field_visible(frm, fname, show);
	});
}

function get_visible_settings_tabs(frm) {
	const is_umkm = frm.doc.business_type === "UMKM";
	return SETTINGS_TABS.filter((tab) => true).map((tab) => {
		let sections = tab.sections || [];
		if (is_umkm) {
			sections = sections.filter((section) => section !== "franchise_section");
		}
		if (!is_erp_enterprise_deployment() && tab.id === "integrations") {
			sections = sections.filter((section) => section !== "billing_section");
		}
		return { ...tab, sections };
	});
}

function hide_settings_form_sidebar(frm) {
	frm.$wrapper.find(".layout-side-section, .form-sidebar").hide();
	const $col = frm.$wrapper.find(".row > .col-lg-10, .row > .col-md-9").first();
	if ($col.length) {
		$col.removeClass("col-lg-10 col-md-9").addClass("col-lg-12 col-md-12");
	}
}

function layout_settings_shell(frm) {
	const $layout = frm.$wrapper.find(".form-layout").first();
	if (!$layout.length) return;

	const $navWrap = frm.$wrapper.find(".imogi-settings-tab-nav-wrap").first();
	const $heroSection = frm.$wrapper.find('.form-section[data-fieldname="setup_section"]');
	const $existingWorkspace = frm.$wrapper.find(".imogi-settings-workspace");
	const $legacyBody = frm.$wrapper.find(".imogi-settings-body").first();

	if (!$existingWorkspace.length && $legacyBody.length && $legacyBody.find(".imogi-settings-main").length) {
		const $legacyNav = $legacyBody.find(".imogi-settings-tab-nav-wrap").first().detach();
		const $legacyMain = $legacyBody.find(".imogi-settings-main").first().detach();
		$legacyBody.remove();
		frm.$wrapper.find(".imogi-settings-help-card").remove();

		const $tabbar = $('<div class="imogi-settings-tabbar"></div>');
		if ($legacyNav.length) {
			$tabbar.append($legacyNav);
		} else if ($navWrap.length) {
			$tabbar.append($navWrap.detach());
		}

		const $workspace = $('<div class="imogi-settings-workspace"></div>');
		$workspace.append($tabbar).append($('<div class="imogi-settings-body"></div>').append($legacyMain));

		let $anchor = frm.$wrapper.find(".form-page").first();
		if (!$anchor.length) {
			$anchor = frm.$wrapper.find(".layout-main-section").first();
		}
		if (!$anchor.length) {
			$anchor = $layout.parent();
		}
		$anchor.append($workspace);
		return;
	}

	const build_content_shell = () => {
		let $content = frm.$wrapper.find(".imogi-settings-content");
		if (!$content.length) {
			$content = $('<div class="imogi-settings-content"></div>');
			$layout.detach();
			$content.append($layout);
		}
		return $content;
	};

	if ($existingWorkspace.length) {
		const $content = build_content_shell();
		const $main = $existingWorkspace.find(".imogi-settings-main");
		if ($main.length) {
			if ($heroSection.length && !$main.find('.form-section[data-fieldname="setup_section"]').length) {
				$main.prepend($heroSection);
			}
			if (!$main.find(".imogi-settings-content").length) {
				$main.append($content);
			}
		}
		if ($navWrap.length && !$existingWorkspace.find(".imogi-settings-tabbar .imogi-settings-tab-nav-wrap").length) {
			let $tabbar = $existingWorkspace.find(".imogi-settings-tabbar");
			if (!$tabbar.length) {
				$tabbar = $('<div class="imogi-settings-tabbar"></div>');
				$existingWorkspace.prepend($tabbar);
			}
			$tabbar.prepend($navWrap);
		}
		return;
	}

	const $content = build_content_shell();
	$heroSection.detach();
	$navWrap.detach();

	const $main = $('<div class="imogi-settings-main"></div>');
	$main.append($heroSection).append($content);

	const $body = $('<div class="imogi-settings-body"></div>').append($main);

	const $tabbar = $('<div class="imogi-settings-tabbar"></div>');
	if ($navWrap.length) {
		$tabbar.append($navWrap);
	}

	const $workspace = $('<div class="imogi-settings-workspace"></div>');
	$workspace.append($tabbar).append($body);

	let $anchor = frm.$wrapper.find(".form-page").first();
	if (!$anchor.length) {
		$anchor = frm.$wrapper.find(".layout-main-section").first();
	}
	if (!$anchor.length) {
		$anchor = $layout.parent();
	}
	$anchor.append($workspace);
}

function build_settings_tabs(frm) {
	const $layout = frm.$wrapper.find(".form-layout");
	if (!$layout.length) return;

	$layout.addClass("imogi-settings-tabbed");

	const visible_tabs = get_visible_settings_tabs(frm);
	const tabs_html = visible_tabs
		.map(
			(tab) => `
		<button type="button" class="imogi-settings-tab-btn" data-tab="${tab.id}" title="${frappe.utils.escape_html(tab.desc)}">
			<span class="imogi-settings-tab-label">${tab.label}</span>
		</button>`
		)
		.join("");

	let $nav = frm.$wrapper.find(".imogi-settings-tab-nav");
	if (!$nav.length) {
		const $navWrap = $(`
			<div class="imogi-settings-tab-nav-wrap">
				<div class="imogi-settings-tab-nav-scroll">
					<div class="imogi-settings-tab-nav">${tabs_html}</div>
				</div>
			</div>`);

		const $hero = frm.$wrapper.find(".imogi-mode-summary-host");
		if ($hero.length) {
			$hero.after($navWrap);
		} else {
			$layout.prepend($navWrap);
		}
	} else {
		$nav.html(tabs_html);
		if (!$nav.parent().hasClass("imogi-settings-tab-nav-scroll")) {
			$nav.wrap('<div class="imogi-settings-tab-nav-scroll"></div>');
		}
	}

	layout_settings_shell(frm);

	if (!visible_tabs.some((tab) => tab.id === normalize_settings_tab_id(__imogi_settings_active_tab))) {
		__imogi_settings_active_tab = "general";
	}

	frm.$wrapper
		.off("click.imogi-settings-tab")
		.on("click.imogi-settings-tab", ".imogi-settings-tab-btn", function () {
			activate_settings_tab(frm, $(this).data("tab"));
		});

	update_settings_tab_desc(frm, normalize_settings_tab_id(__imogi_settings_active_tab));
}

function update_settings_tab_desc(frm, tabId) {
	tabId = normalize_settings_tab_id(tabId);
	const tab = SETTINGS_TABS.find((t) => t.id === tabId);
	if (!tab) return;
	render_settings_tab_intro(frm, tab);
}

function ensure_settings_content_inner(frm) {
	const $content = frm.$wrapper.find(".imogi-settings-content").first();
	if (!$content.length) return $content;

	let $inner = $content.children(".imogi-settings-content-inner");
	if (!$inner.length) {
		const $layout = $content.children(".form-layout").first();
		$inner = $('<div class="imogi-settings-content-inner"></div>');
		if ($layout.length) {
			$layout.detach();
			$inner.append($layout);
		}
		$content.prepend(
			`<div class="imogi-settings-tab-intro" aria-live="polite"></div>`
		);
		$content.append($inner);
	}
	if (!$content.find(".imogi-settings-tab-intro").length) {
		$content.prepend(`<div class="imogi-settings-tab-intro" aria-live="polite"></div>`);
	}
	return $inner;
}

function render_settings_tab_intro(frm, tab) {
	if (!tab) return;
	const $intro = frm.$wrapper.find(".imogi-settings-tab-intro");
	if (!$intro.length) return;
	$intro.html(`
		<div class="imogi-settings-tab-intro-title">${frappe.utils.escape_html(tab.label)}</div>
		<div class="imogi-settings-tab-intro-desc">${frappe.utils.escape_html(tab.desc || "")}</div>
	`);
}

function apply_settings_tab_layout(frm, tabId) {
	ensure_settings_content_inner(frm);
	const $inner = frm.$wrapper.find(".imogi-settings-content-inner");
	$inner.removeClass((_, cls) => (cls.match(/imogi-settings-tab-panel--\S+/g) || []).join(" "));
	$inner.addClass(`imogi-settings-tab-panel imogi-settings-tab-panel--${tabId}`);
	frm.$wrapper
		.find(".imogi-settings-card-section")
		.toggleClass("imogi-settings-field-grid", tabId !== "general");
	frm.$wrapper.find(".imogi-store-identity-section").toggleClass("imogi-settings-field-grid", tabId === "general");
}

function layout_general_dock_grid(frm) {
	const ctx = get_settings_section(frm, "store_identity_section");
	if (!ctx || !ctx.$wrapper) return;
	const $body = ctx.section.body || ctx.$wrapper.find(".section-body");
	const $shift = $body.find(".imogi-shift-settings-dock");
	const $kitchen = $body.find(".imogi-kitchen-settings-dock");
	if (!$shift.length && !$kitchen.length) return;

	let $grid = $body.children(".imogi-settings-dock-grid");
	if (!$grid.length) {
		$grid = $('<div class="imogi-settings-dock-grid"></div>');
		$body.append($grid);
	}
	if ($shift.length) $grid.append($shift);
	if ($kitchen.length) $grid.append($kitchen);
}

function activate_settings_tab(frm, tabId) {
	tabId = normalize_settings_tab_id(tabId);
	if (!SETTINGS_TABS.some((t) => t.id === tabId)) {
		tabId = "general";
	}
	__imogi_settings_active_tab = tabId;
	frm.$wrapper.attr("data-active-tab", tabId);
	frm.$wrapper.find(".imogi-settings-tab-btn").removeClass("is-active");
	frm.$wrapper.find(`.imogi-settings-tab-btn[data-tab="${tabId}"]`).addClass("is-active");
	update_settings_tab_desc(frm, tabId);
	apply_settings_tab_layout(frm, tabId);

	const visible_sections = new Set(
		(get_visible_settings_tabs(frm).find((t) => t.id === tabId)?.sections || []).flat()
	);

	get_all_settings_tab_sections().forEach((sectionName) => {
		const show = visible_sections.has(sectionName);
		set_settings_section_visible(frm, sectionName, show);
	});

	frm.$wrapper
		.find('.form-section[data-fieldname="setup_section"]')
		.toggle(tabId === "general");

	if (tabId === "integrations") {
		render_api_dock_summary(frm);
		render_integrations_dock_summary(frm);
	}
	if (tabId === "transactions") {
		render_loyalty_dock_summary(frm);
	}
	if (tabId === "payment") {
		render_payment_dock_summary(frm);
		render_transfer_dock_summary(frm);
	}
	if (tabId === "more") {
		const ops_ctx = get_settings_section(frm, "operations_section");
		if (ops_ctx && ops_ctx.$wrapper) {
			ops_ctx.$wrapper.addClass("imogi-section-operations");
		}
		render_franchise_dock_summary(frm);
		position_target_dock(frm);
		render_target_dock_summary(frm);
	}
	if (tabId === "general") {
		render_billing_dock_summary(frm);
	}
	if (tabId === "inventory") {
		build_import_dock(frm);
	}
	frm.$wrapper.find(".imogi-settings-target-host").toggle(tabId === "more");
	frm.$wrapper.find(".imogi-settings-trust-row").remove();
	frm.$wrapper.find(".imogi-settings-placeholder").remove();
	toggle_general_tab_sections(frm, tabId);
	if (tabId === "general") {
		layout_store_identity(frm);
		layout_shift_settings(frm);
		layout_kitchen_settings(frm);
		layout_general_dock_grid(frm);
		render_receipt_preview(frm);
	}
}

function position_target_dock(frm) {
	const $host = frm.$wrapper.find(".imogi-settings-target-host");
	const $inner = frm.$wrapper.find(".imogi-settings-content-inner");
	if ($host.length && $inner.length) {
		$inner.prepend($host);
	}
}

function style_setting_cards(frm) {
	const card_sections = {
		store_identity_section: { icon: "fa-store", title: __("Identitas Toko") },
		branch_pricing_section: { icon: "fa-tags", title: __("Harga & Menu Multi Cabang") },
		general_section: { icon: "fa-sliders", title: __("Pengaturan Dasar POS") },
		inventory_section: { icon: "fa-cubes", title: __("Stok Otomatis") },
		receipt_section: { icon: "fa-print", title: __("Struk / Receipt") },
		import_section: { icon: "fa-upload", title: __("Import Data Menu") },
		analytics_section: { icon: "fa-line-chart", title: __("Pengaturan Dashboard") },
		flow_section: { icon: "fa-cutlery", title: __("Kitchen & Fulfillment") },
		loyalty_section: { icon: "fa-star", title: __("Loyalty & Poin Member") },
		stamp_section: { icon: "fa-ticket", title: __("Stamp Card") },
		promo_section: { icon: "fa-tags", title: __("Promo Otomatis") },
		payment_gateway_section: { icon: "fa-credit-card", title: __("Payment Gateway") },
		transfer_payment_section: { icon: "fa-university", title: __("Transfer Bank") },
		integrations_section: { icon: "fa-random", title: __("Offline & Marketplace") },
		operations_section: { icon: "fa-shield", title: __("Operasional Lanjutan") },
		franchise_section: { icon: "fa-building", title: __("Franchise & Royalty") },
		billing_section: { icon: "fa-credit-card", title: __("SaaS Billing Sync") },
		api_section: { icon: "fa-globe", title: __("Order API (Website)") },
	};

	Object.entries(card_sections).forEach(([fieldname, meta]) => {
		const ctx = get_settings_section(frm, fieldname);
		if (!ctx || !ctx.$wrapper) return;
		ctx.$wrapper.addClass("imogi-settings-card-section imogi-settings-flat-section");

		const $body = ctx.section.body || ctx.$wrapper.find(".section-body");
		$body.find(".imogi-settings-card-head, .imogi-settings-flat-head, .imogi-settings-flat-hint").remove();
		ctx.$wrapper.find("> .imogi-settings-flat-head, > .imogi-settings-flat-hint").remove();
		if (ctx.$wrapper.find("> .imogi-settings-flat-head").length) return;

		const subtitle = get_section_subtitle(fieldname);
		const head_html = settings_flat_head_html(meta.title, subtitle);
		ctx.$wrapper.prepend(head_html);
	});
}

function get_section_subtitle(fieldname) {
	const map = {
		store_identity_section: __("Kota, kontak owner, multi cabang, dan target omzet bulanan."),
		branch_pricing_section: __("Price list master, sinkron harga ke cabang, dan push menu dari HQ."),
		general_section: __("Perusahaan, profil kasir, gudang, dan shift kasir."),
		inventory_section: __("Interval cek stok, role notifikasi, dan batas stok."),
		receipt_section: __("Format cetak struk di layar kasir."),
		import_section: __("Upload Excel/CSV: menu lengkap (Product+BOM) atau import terpisah."),
		analytics_section: __("Notifikasi realtime dan interval refresh dashboard."),
		flow_section: __("Kitchen display, fulfillment, dan item group dapur."),
		loyalty_section: __("Poin per belanja, nilai poin, dan minimal redeem di kasir."),
		stamp_section: __("Kumpulkan stamp per transaksi — reward voucher otomatis."),
		promo_section: __("Rule Buy X Get Y diterapkan otomatis saat checkout."),
		payment_gateway_section: __("QRIS via Midtrans atau Xendit di kasir."),
		transfer_payment_section: __("Rekening bank yang ditampilkan saat pelanggan bayar transfer."),
		integrations_section: __("Kasir offline (IndexedDB) dan order Grab/GoFood/ShopeeFood."),
		operations_section: __("Role gating, approval workflow & central kitchen."),
		franchise_section: __("Generate accrual royalty & posting ke Journal Entry."),
		billing_section: __("Webhook billing eksternal untuk sinkron paket langganan otomatis."),
		api_section: __("REST API untuk order online, katalog produk, dan customer."),
	};
	return map[fieldname] || "";
}

function build_target_dock(frm) {
	let $host = frm.$wrapper.find(".imogi-settings-target-host");
	if (!$host.length) {
		$host = $(`<div class="imogi-settings-target-host" style="display:none;"></div>`);
		const $inner = ensure_settings_content_inner(frm);
		if ($inner.length) {
			$inner.prepend($host);
		} else {
			frm.$wrapper.find(".imogi-settings-content").prepend($host);
		}
	}

	if (!$host.find(".imogi-target-dock").length) {
		$host.html(`
			<div class="imogi-target-dock">
				<div class="imogi-target-dock-head">
					<div class="imogi-target-dock-head-icon"><i class="fa fa-bullseye"></i></div>
					<div>
						<div class="imogi-target-dock-title">${__("Target Omzet Bulanan")}</div>
						<div class="imogi-target-dock-sub">${__(
							"Progress omzet bulan ini · edit target di tab Dasar → Identitas Toko"
						)}</div>
					</div>
				</div>
				<div class="imogi-target-dock-panel"></div>
			</div>`);
	}

	render_target_dock_summary(frm);
}

function render_target_dock_summary(frm) {
	const $panel = frm.$wrapper.find(".imogi-settings-target-host .imogi-target-dock-panel");
	if (!$panel || !$panel.length) return;

	if (!flt(frm.doc.target_monthly_sales)) {
		$panel.html(`
			<div class="imogi-target-empty">
				<p>${__("Target omzet belum diset.")}</p>
				<button type="button" class="imogi-btn-primary imogi-target-go-general">${__("Atur di Tab Dasar")}</button>
			</div>`);
		$panel.find(".imogi-target-go-general").on("click", () => activate_settings_tab(frm, "general"));
		return;
	}

	$panel.html(`<div class="imogi-target-loading"><i class="fa fa-spinner fa-spin"></i> ${__("Memuat progress...")}</div>`);

	frappe.call({
		method: "imogi_pos.imogi_pos.utils.sales_target.get_sales_target_progress_api",
		callback(r) {
			if (r.exc) {
				$panel.empty();
				return;
			}
			const target = r.message || {};
			const pct = Math.min(100, Math.max(2, flt(target.progress_pct)));
			const statusTone =
				target.status === "achieved" ? "achieved" : target.status === "behind" ? "behind" : "on-track";

			$panel.html(`
				<div class="imogi-target-progress imogi-target-progress--${statusTone}">
					<div class="imogi-target-progress-top">
						<div class="imogi-target-progress-month">${frappe.utils.escape_html(target.month_label || "")}</div>
						<span class="imogi-target-progress-badge">${frappe.utils.escape_html(target.status_label || "")}</span>
					</div>
					<div class="imogi-target-progress-stats">
						<div class="imogi-target-stat">
							<span class="imogi-target-stat-label">${__("Omzet")}</span>
							<strong class="imogi-target-stat-value">${format_currency(target.actual_amount || 0)}</strong>
						</div>
						<div class="imogi-target-stat">
							<span class="imogi-target-stat-label">${__("Target")}</span>
							<strong class="imogi-target-stat-value">${format_currency(target.target_amount || 0)}</strong>
						</div>
						<div class="imogi-target-stat">
							<span class="imogi-target-stat-label">${__("Sisa")}</span>
							<strong class="imogi-target-stat-value">${format_currency(target.remaining_amount || 0)}</strong>
						</div>
						<div class="imogi-target-stat imogi-target-stat--pct">
							<span class="imogi-target-stat-label">${__("Progress")}</span>
							<strong class="imogi-target-stat-value">${pct}%</strong>
						</div>
					</div>
					<div class="imogi-target-progress-track">
						<div class="imogi-target-progress-fill" style="width:${pct}%"></div>
					</div>
					<div class="imogi-target-progress-foot">
						<span>${__("Perlu/hari")}: <strong>${format_currency(target.daily_pace_needed || 0)}</strong></span>
						<span>${__("Rata-rata/hari")}: <strong>${format_currency(target.daily_average || 0)}</strong></span>
						<span>${__("Hari tersisa")}: <strong>${target.days_remaining || 0}</strong></span>
					</div>
				</div>`);
		},
	});
}

function build_import_dock(frm) {
	const ctx = get_settings_section(frm, "import_section");
	if (!ctx || !ctx.$wrapper) return;
	ctx.$wrapper.addClass("imogi-section-import");

	const $body = ctx.section.body || ctx.$wrapper.find(".section-body");
	let $dock = $body.find(".imogi-import-dock");
	if (!$dock.length) {
		$dock = $(`
			<div class="imogi-import-dock">
				<div class="imogi-import-card is-primary" data-action="menu">
					<div class="imogi-import-card-badge">${__("Utama")}</div>
					<div class="imogi-import-card-icon"><i class="fa fa-file-excel-o"></i></div>
					<div class="imogi-import-card-title">${__("Import Menu Lengkap")}</div>
					<div class="imogi-import-card-desc">${__(
						"Excel 2 sheet: Menu (Product+BOM) + Stok Awal. Service dilewati."
					)}</div>
					<button type="button" class="btn btn-primary btn-sm imogi-import-card-btn">${__(
						"Upload Excel / CSV"
					)}</button>
				</div>
				<div class="imogi-import-card" data-action="stock">
					<div class="imogi-import-card-icon"><i class="fa fa-cubes"></i></div>
					<div class="imogi-import-card-title">${__("Import Stok Bahan Baku")}</div>
					<div class="imogi-import-card-desc">${__(
						"Stok awal bahan ke gudang default. Kolom: Komponen, Qty, UOM, Harga (valuation + harga beli)."
					)}</div>
					<button type="button" class="btn btn-default btn-sm imogi-import-card-btn">${__(
						"Import Stok"
					)}</button>
				</div>
				<div class="imogi-import-card" data-action="product">
					<div class="imogi-import-card-icon"><i class="fa fa-shopping-basket"></i></div>
					<div class="imogi-import-card-title">${__("Import Produk Saja")}</div>
					<div class="imogi-import-card-desc">${__(
						"Kolom: no, produk, kategori, add_on, standard_rate, stock_uom."
					)}</div>
					<button type="button" class="btn btn-default btn-sm imogi-import-card-btn">${__(
						"Import Produk"
					)}</button>
				</div>
				<div class="imogi-import-card" data-action="bom">
					<div class="imogi-import-card-icon"><i class="fa fa-sitemap"></i></div>
					<div class="imogi-import-card-title">${__("Import BOM Saja")}</div>
					<div class="imogi-import-card-desc">${__(
						"Kolom: product, bom_product, qty, uom, double. Produk harus sudah ada."
					)}</div>
					<button type="button" class="btn btn-default btn-sm imogi-import-card-btn">${__("Import BOM")}</button>
				</div>
			</div>`);
		$body.prepend($dock);

		$dock.on("click", ".imogi-import-card-btn", function () {
			const action = $(this).closest(".imogi-import-card").data("action");
			if (action === "menu") open_menu_import_dialog(frm);
			else if (action === "stock") open_stock_import_dialog(frm);
			else if (action === "product") open_product_import_dialog(frm);
			else if (action === "bom") open_bom_import_dialog(frm);
		});
	}

	["import_menu", "import_stock", "import_products", "import_bom"].forEach((fieldname) => {
		const field = frm.get_field(fieldname);
		if (field && field.$wrapper) {
			field.$wrapper.hide();
		}
	});
}

function style_form_sections(frm) {
	const identity_ctx = get_settings_section(frm, "store_identity_section");
	if (identity_ctx && identity_ctx.$wrapper) {
		identity_ctx.$wrapper.addClass("imogi-section-store imogi-settings-card-section");
	}

	const general_ctx = get_settings_section(frm, "general_section");
	if (general_ctx && general_ctx.$wrapper) {
		general_ctx.$wrapper.addClass("imogi-section-general imogi-settings-card-section");
	}
}

function build_api_dock(frm) {
	const ctx = get_settings_section(frm, "api_section");
	if (!ctx || !ctx.$wrapper) return;
	ctx.$wrapper.addClass("imogi-section-api");

	let $dock = ctx.$wrapper.find(".imogi-api-dock");
	if (!$dock.length) {
		$dock = $(`
			<div class="imogi-api-dock mb-3">
				<div class="imogi-api-dock-intro">
					<div class="imogi-api-dock-icon"><i class="fa fa-globe fa-lg"></i></div>
					<div>
						<div class="imogi-api-dock-title">${__("Integrasi Website & App")}</div>
						<div class="imogi-api-dock-sub">${__(
							"REST API untuk order online, katalog produk, dan customer."
						)}</div>
					</div>
				</div>
				<div class="imogi-api-controls"></div>
				<div class="imogi-api-panel"></div>
			</div>`);
		const $body = ctx.section.body || ctx.$wrapper.find(".section-body");
		$body.append($dock);
	}

	relocate_api_fields(frm, $dock);
	render_api_dock_summary(frm);
}

function relocate_api_fields(frm, $dock) {
	const $target = $dock.find(".imogi-api-controls");
	[
		"enable_order_api",
		"order_api_user",
		"enable_order_api_webhook",
		"order_api_webhook_url",
	].forEach((fieldname) => {
		const field = frm.get_field(fieldname);
		if (!field || !field.$wrapper) return;
		const $control = field.$wrapper.closest(".frappe-control");
		if ($control.closest(".imogi-api-controls").length) return;
		$control.addClass("imogi-api-control-item mb-0");
		$target.append($control);
	});
	toggle_webhook_url_visibility(frm);
}

function toggle_webhook_url_visibility(frm) {
	const field = frm.get_field("order_api_webhook_url");
	if (!field || !field.$wrapper) return;
	field.$wrapper.closest(".frappe-control").toggle(!!frm.doc.enable_order_api_webhook);
}

function build_loyalty_dock(frm) {
	const ctx = get_settings_section(frm, "loyalty_section");
	if (!ctx || !ctx.$wrapper) return;
	ctx.$wrapper.addClass("imogi-section-loyalty");

	const $body = ctx.section.body || ctx.$wrapper.find(".section-body");
	if ($body.find(".imogi-loyalty-dock").length) return;

	$body.prepend(`<div class="imogi-loyalty-dock"><div class="imogi-loyalty-panel"></div></div>`);
	render_loyalty_dock_summary(frm);
}

function render_loyalty_dock_summary(frm) {
	const $panel = frm.$wrapper.find(".imogi-loyalty-panel");
	if (!$panel.length) return;

	const loyalty_on = cint(frm.doc.enable_loyalty);
	const stamp_on = cint(frm.doc.enable_stamp_card);
	const promo_on = cint(frm.doc.enable_promo_rules);

	$panel.html(`
		<div class="imogi-mini-stats imogi-mini-stats--grid">
			<div class="imogi-mini-stat">
				<span class="imogi-mini-stat-label">${__("Loyalty")}</span>
				<span class="imogi-pill ${loyalty_on ? "is-green" : "is-orange"}">${loyalty_on ? __("Aktif") : __("Nonaktif")}</span>
			</div>
			<div class="imogi-mini-stat">
				<span class="imogi-mini-stat-label">${__("Stamp Card")}</span>
				<span class="imogi-pill ${stamp_on ? "is-green" : "is-orange"}">${stamp_on ? __("Aktif") : __("Nonaktif")}</span>
			</div>
			<div class="imogi-mini-stat">
				<span class="imogi-mini-stat-label">${__("Promo Rules")}</span>
				<span class="imogi-pill ${promo_on ? "is-green" : "is-orange"}">${promo_on ? __("Aktif") : __("Nonaktif")}</span>
			</div>
			${
				loyalty_on
					? `<div class="imogi-mini-stat">
				<span class="imogi-mini-stat-label">${__("Konversi poin")}</span>
				<span class="imogi-mini-stat-val">${format_currency(frm.doc.loyalty_points_per_amount || 0)} → 1 poin</span>
			</div>`
					: ""
			}
			${
				stamp_on
					? `<div class="imogi-mini-stat">
				<span class="imogi-mini-stat-label">${__("Target stamp")}</span>
				<span class="imogi-mini-stat-val">${cint(frm.doc.stamp_target) || 0} ${__("transaksi")}</span>
			</div>`
					: ""
			}
		</div>`);
}

function build_payment_dock(frm) {
	const ctx = get_settings_section(frm, "payment_gateway_section");
	if (!ctx || !ctx.$wrapper) return;
	ctx.$wrapper.addClass("imogi-section-payment");

	const $body = ctx.section.body || ctx.$wrapper.find(".section-body");
	if ($body.find(".imogi-payment-dock").length) return;

	$body.prepend(`
		<div class="imogi-payment-dock mb-3">
			<div class="imogi-api-dock-intro">
				<div class="imogi-api-dock-icon"><i class="fa fa-qrcode fa-lg"></i></div>
				<div>
					<div class="imogi-api-dock-title">${__("Pembayaran QRIS")}</div>
					<div class="imogi-api-dock-sub">${__(
						"Midtrans atau Xendit — tampilkan QR di kasir saat checkout."
					)}</div>
				</div>
			</div>
			<div class="imogi-payment-panel"></div>
		</div>`);
	render_payment_dock_summary(frm);
}

function render_payment_dock_summary(frm) {
	const $panel = frm.$wrapper.find(".imogi-payment-panel");
	if (!$panel.length) return;

	const on = cint(frm.doc.enable_payment_gateway);
	if (!on) {
		$panel.html(`
			<div class="imogi-status-card is-warning">
				<div class="imogi-status-card-body">
					<p class="imogi-muted mb-0">${__(
						"Payment gateway belum aktif. Aktifkan toggle di bawah untuk QRIS di kasir."
					)}</p>
				</div>
			</div>`);
		return;
	}

	$panel.html(`
		<div class="imogi-status-card is-success">
			<div class="imogi-status-card-body">
				<div class="imogi-mini-stats">
					<div class="imogi-mini-stat">
						<span class="imogi-mini-stat-label">${__("Provider")}</span>
						<span class="imogi-mini-stat-val">${frappe.utils.escape_html(frm.doc.payment_gateway_provider || "-")}</span>
					</div>
					<div class="imogi-mini-stat">
						<span class="imogi-mini-stat-label">${__("Mode")}</span>
						<span class="imogi-pill ${frm.doc.payment_gateway_sandbox ? "is-orange" : "is-green"}">${
							frm.doc.payment_gateway_sandbox ? __("Sandbox") : __("Live")
						}</span>
					</div>
					<div class="imogi-mini-stat">
						<span class="imogi-mini-stat-label">${__("Server Key")}</span>
						<span class="imogi-mini-stat-val">${frm.doc.payment_gateway_key ? __("Tersimpan") : __("Belum diisi")}</span>
					</div>
				</div>
			</div>
		</div>`);
}

function build_transfer_dock(frm) {
	const ctx = get_settings_section(frm, "transfer_payment_section");
	if (!ctx || !ctx.$wrapper) return;
	ctx.$wrapper.addClass("imogi-section-transfer");

	const $body = ctx.section.body || ctx.$wrapper.find(".section-body");
	if ($body.find(".imogi-transfer-dock").length) return;

	$body.prepend(`
		<div class="imogi-transfer-dock mb-3">
			<div class="imogi-api-dock-intro">
				<div class="imogi-api-dock-icon"><i class="fa fa-university fa-lg"></i></div>
				<div>
					<div class="imogi-api-dock-title">${__("Rekening Transfer")}</div>
					<div class="imogi-api-dock-sub">${__(
						"Ditampilkan di kasir saat metode Transfer dipilih."
					)}</div>
				</div>
			</div>
			<div class="imogi-transfer-panel"></div>
		</div>`);
	render_transfer_dock_summary(frm);
}

function render_transfer_dock_summary(frm) {
	const $panel = frm.$wrapper.find(".imogi-transfer-panel");
	if (!$panel.length) return;

	const on = cint(frm.doc.enable_transfer_payment_info);
	const bank = (frm.doc.transfer_bank_name || "").trim();
	const account = (frm.doc.transfer_bank_account || "").trim();
	const holder = (frm.doc.transfer_account_holder || "").trim();
	const instructions = (frm.doc.transfer_instructions || "").trim();

	if (!on) {
		$panel.html(`
			<div class="imogi-status-card is-warning">
				<div class="imogi-status-card-body">
					<p class="imogi-muted mb-0">${__(
						"Info rekening transfer belum aktif. Aktifkan toggle di bawah lalu isi data bank."
					)}</p>
				</div>
			</div>`);
		return;
	}

	if (!bank || !account || !holder) {
		$panel.html(`
			<div class="imogi-status-card is-warning">
				<div class="imogi-status-card-body">
					<p class="imogi-muted mb-0">${__(
						"Lengkapi nama bank, nomor rekening, dan atas nama agar tampil di kasir."
					)}</p>
				</div>
			</div>`);
		return;
	}

	$panel.html(`
		<div class="imogi-status-card is-success">
			<div class="imogi-status-card-body">
				<div class="imogi-mini-stats">
					<div class="imogi-mini-stat">
						<span class="imogi-mini-stat-label">${__("Bank")}</span>
						<span class="imogi-mini-stat-val">${frappe.utils.escape_html(bank)}</span>
					</div>
					<div class="imogi-mini-stat">
						<span class="imogi-mini-stat-label">${__("Rekening")}</span>
						<span class="imogi-mini-stat-val">${frappe.utils.escape_html(account)}</span>
					</div>
					<div class="imogi-mini-stat">
						<span class="imogi-mini-stat-label">${__("Atas Nama")}</span>
						<span class="imogi-mini-stat-val">${frappe.utils.escape_html(holder)}</span>
					</div>
				</div>
				${
					instructions
						? `<p class="imogi-muted mb-0 mt-2"><i class="fa fa-info-circle"></i> ${frappe.utils.escape_html(
								instructions
						  )}</p>`
						: ""
				}
			</div>
		</div>`);
}

function build_integrations_dock(frm) {
	const ctx = get_settings_section(frm, "integrations_section");
	if (!ctx || !ctx.$wrapper) return;
	ctx.$wrapper.addClass("imogi-section-integrations");

	const $body = ctx.section.body || ctx.$wrapper.find(".section-body");
	if ($body.find(".imogi-integrations-dock").length) return;

	$body.prepend(`
		<div class="imogi-integrations-dock mb-3">
			<div class="imogi-api-dock-intro">
				<div class="imogi-api-dock-icon"><i class="fa fa-cloud fa-lg"></i></div>
				<div>
					<div class="imogi-api-dock-title">${__("Offline & Marketplace")}</div>
					<div class="imogi-api-dock-sub">${__(
						"Kasir tetap jalan tanpa internet; terima order dari aplikasi delivery."
					)}</div>
				</div>
			</div>
			<div class="imogi-integrations-panel"></div>
		</div>`);
	render_integrations_dock_summary(frm);
}

function render_integrations_dock_summary(frm) {
	const $panel = frm.$wrapper.find(".imogi-integrations-panel");
	if (!$panel.length) return;

	const offline_on = cint(frm.doc.enable_offline_cashier);
	const hidden = frappe.boot?.imogi_pos_hidden_features || [];
	const hideMarketplace =
		hidden.includes("grabfood_integration") || hidden.includes("gofood_integration");
	const market_on = hideMarketplace ? 0 : cint(frm.doc.enable_marketplace_orders);

	$panel.html(`
		<div class="imogi-mini-stats imogi-mini-stats--grid">
			<div class="imogi-mini-stat">
				<span class="imogi-mini-stat-label">${__("Offline Cashier")}</span>
				<span class="imogi-pill ${offline_on ? "is-green" : "is-orange"}">${offline_on ? __("Aktif") : __("Nonaktif")}</span>
			</div>
			${
				hideMarketplace
					? ""
					: `<div class="imogi-mini-stat">
				<span class="imogi-mini-stat-label">${__("Marketplace")}</span>
				<span class="imogi-pill ${market_on ? "is-green" : "is-orange"}">${market_on ? __("Aktif") : __("Nonaktif")}</span>
			</div>`
			}
			${
				market_on
					? `<div class="imogi-mini-stat">
				<span class="imogi-mini-stat-label">${__("Webhook secret")}</span>
				<span class="imogi-mini-stat-val">${frm.doc.marketplace_webhook_secret ? __("Tersimpan") : __("Belum diisi")}</span>
			</div>`
					: ""
			}
		</div>
		<p class="imogi-muted small mb-0">${__(
			"Endpoint marketplace: imogi_pos.api.marketplace_api.ingest_order"
		)}</p>`);
}

function build_franchise_dock(frm) {
	const ctx = get_settings_section(frm, "franchise_section");
	if (!ctx || !ctx.$wrapper) return;
	ctx.$wrapper.addClass("imogi-section-franchise");

	const $body = ctx.section.body || ctx.$wrapper.find(".section-body");
	if ($body.find(".imogi-franchise-dock").length) return;

	$body.prepend(`
		<div class="imogi-franchise-dock mb-3">
			<div class="imogi-api-dock-intro">
				<div class="imogi-api-dock-icon"><i class="fa fa-building fa-lg"></i></div>
				<div>
					<div class="imogi-api-dock-title">${__("Royalty Franchise")}</div>
					<div class="imogi-api-dock-sub">${__(
						"Generate accrual bulanan lalu posting ke Journal Entry ERPNext."
					)}</div>
				</div>
			</div>
			<div class="imogi-franchise-panel"></div>
		</div>`);

	["generate_franchise_royalty", "post_franchise_royalty_journals"].forEach((fieldname) => {
		const field = frm.get_field(fieldname);
		if (field && field.$wrapper) {
			field.$wrapper.closest(".frappe-control").addClass("imogi-franchise-action-btn");
		}
	});
	render_franchise_dock_summary(frm);
}

function render_franchise_dock_summary(frm) {
	const $panel = frm.$wrapper.find(".imogi-franchise-panel");
	if (!$panel.length) return;

	const has_accounts = !!(frm.doc.royalty_expense_account && frm.doc.royalty_payable_account);
	$panel.html(`
		<div class="imogi-status-card ${has_accounts ? "is-success" : "is-warning"}">
			<div class="imogi-status-card-body">
				<div class="imogi-mini-stats">
					<div class="imogi-mini-stat">
						<span class="imogi-mini-stat-label">${__("Expense Account")}</span>
						<span class="imogi-mini-stat-val">${frappe.utils.escape_html(frm.doc.royalty_expense_account || "-")}</span>
					</div>
					<div class="imogi-mini-stat">
						<span class="imogi-mini-stat-label">${__("Payable Account")}</span>
						<span class="imogi-mini-stat-val">${frappe.utils.escape_html(frm.doc.royalty_payable_account || "-")}</span>
					</div>
				</div>
				${
					!has_accounts
						? `<p class="imogi-muted small mb-0">${__(
								"Isi akun expense & payable sebelum posting journal royalty."
						  )}</p>`
						: ""
				}
			</div>
		</div>`);
}

function add_page_toolbar_buttons(frm) {
	if (!can_manage_api(frm)) return;

	if (frm.doc.setup_complete) {
		frm.add_custom_button(__("Run Setup Wizard"), () => frappe.set_route("imogi-pos-setup"));
	}

	const btn = frm.add_custom_button(
		`<i class="fa fa-book"></i> ${__("Dokumentasi API")}`,
		() => open_api_docs_dialog(frm)
	);
	if (btn && btn.addClass) {
		btn.addClass("imogi-toolbar-docs-btn");
	}
}

function open_api_docs_dialog(frm) {
	ensure_imogi_styles(() => {
		const dialog = new frappe.ui.Dialog({
			title: __("Dokumentasi API IMOGI POS"),
			size: "extra-large",
			static: true,
			primary_action_label: __("Tutup"),
			primary_action() {
				this.hide();
			},
		});

		dialog.$wrapper.addClass("imogi-api-docs-modal");
		dialog.$body.addClass("imogi-api-docs-body");
		dialog.$body.html(
			`<div class="imogi-docs-loading"><div class="imogi-docs-spinner"></div><span>${__(
				"Memuat dokumentasi..."
			)}</span></div>`
		);
		dialog.show();

		// static dialogs hide the header X — restore it for quick dismiss
		dialog.get_close_btn().show().off("click").on("click", () => dialog.hide());

		frappe.call({
			method: "imogi_pos.api.order.get_api_info",
			callback(r) {
				if (r.exc) {
					dialog.$body.html(
						`<div class="imogi-docs-loading"><p class="text-danger">${__(
							"Gagal memuat dokumentasi API."
						)}</p></div>`
					);
					return;
				}
				const info = r.message || {};
				dialog.$body.html(build_api_docs_html(info, frm));
				bind_api_events(frm, dialog.$body, info);
				bind_docs_tabs(dialog.$body);
			},
		});
	});
}

function bind_docs_tabs($root) {
	$root.find(".imogi-docs-nav-item").on("click", function () {
		const section = $(this).data("docs-section");
		$root.find(".imogi-docs-nav-item").removeClass("is-active");
		$(this).addClass("is-active");
		$root.find(".imogi-docs-section").removeClass("is-active");
		$root.find(`#imogi-docs-${section}`).addClass("is-active");
	});

	$root.find(".imogi-tab-btn").on("click", function () {
		const panel = $(this).data("ep-panel");
		const $bar = $(this).closest(".imogi-tab-bar");
		$bar.find(".imogi-tab-btn").removeClass("is-active");
		$(this).addClass("is-active");
		$bar.next(".imogi-ep-panels").find(".imogi-ep-panel").removeClass("is-active");
		$bar.next(".imogi-ep-panels").find(`#imogi-ep-${panel}`).addClass("is-active");
	});
}

function render_api_dock_summary(frm) {
	const $panel = get_settings_section(frm, "api_section")?.$wrapper?.find(".imogi-api-panel");
	if (!$panel || !$panel.length) return;

	if (!frm.doc.enable_order_api) {
		$panel.html(`
			<div class="imogi-status-card is-warning">
				<div class="imogi-status-card-icon"><i class="fa fa-lock fa-lg"></i></div>
				<div class="imogi-status-card-body">
					<div class="imogi-status-card-top"><strong>${__("Order API belum aktif")}</strong></div>
					<p class="imogi-muted mb-0">${__(
						"Aktifkan toggle di atas, lalu buka dokumentasi untuk setup credential."
					)}</p>
				</div>
				<div class="imogi-status-card-actions">
					<button type="button" class="imogi-btn-primary imogi-open-api-docs">
						<i class="fa fa-book"></i> ${__("Buka Dokumentasi")}
					</button>
				</div>
			</div>`);
		$panel.find(".imogi-open-api-docs").on("click", () => open_api_docs_dialog(frm));
		return;
	}

	$panel.html(`<div class="imogi-status-card is-loading"><i class="fa fa-spinner fa-spin"></i> ${__("Memuat...")}</div>`);

	frappe.call({
		method: "imogi_pos.api.order.get_api_info",
		callback(r) {
			const info = r.message || {};
			const ok = info.has_credentials;
			$panel.html(`
				<div class="imogi-status-card ${ok ? "is-success" : "is-warning"}">
					<div class="imogi-status-card-icon">
						<i class="fa ${ok ? "fa-check-circle" : "fa-exclamation-circle"} fa-lg"></i>
					</div>
					<div class="imogi-status-card-body">
						<div class="imogi-status-card-top">
							<strong>${ok ? __("API siap dipakai") : __("Credential belum dibuat")}</strong>
							<span class="imogi-pill ${ok ? "is-green" : "is-orange"}">${ok ? __("Aktif") : __("Perlu setup")}</span>
						</div>
						<div class="imogi-mini-stats">
							<div class="imogi-mini-stat">
								<span class="imogi-mini-stat-label">${__("Base URL")}</span>
								<span class="imogi-mini-stat-val">${frappe.utils.escape_html(info.base_url || "-")}</span>
							</div>
							<div class="imogi-mini-stat">
								<span class="imogi-mini-stat-label">${__("API Key")}</span>
								<span class="imogi-mini-stat-val">${frappe.utils.escape_html(info.api_key || "-")}</span>
							</div>
						</div>
					</div>
					<div class="imogi-status-card-actions">
						<button type="button" class="imogi-btn-primary imogi-btn-generate-api">
							<i class="fa fa-key"></i> ${frm.doc.order_api_key ? __("Regenerate") : __("Generate Key")}
						</button>
						<button type="button" class="imogi-btn-outline imogi-open-api-docs">
							<i class="fa fa-book"></i> ${__("Dokumentasi")}
						</button>
					</div>
				</div>`);
			bind_api_events(frm, $panel, info);
			$panel.find(".imogi-open-api-docs").on("click", () => open_api_docs_dialog(frm));
		},
	});
}

function regenerate_api_credentials(frm) {
	imogi_pos.settings_api.regenerate(frm);
}

function show_pending_api_credentials(frm) {
	frappe.call({
		method: "imogi_pos.api.settings_api.get_pending_api_credentials",
		callback(r) {
			if (r.message && r.message.api_secret) {
				imogi_pos.settings_api.show_credentials_dialog(r.message, () => frm.reload_doc());
			}
		},
	});
}

function copy_to_clipboard(text, success_message) {
	imogi_pos.settings_api.copy(text, success_message);
}

function render_mode_summary(frm) {
	const kds_on = cint(frm.doc.enable_kitchen_display);
	const fulfillment_on = cint(frm.doc.enable_fulfillment);
	const summary =
		!kds_on && !fulfillment_on
			? {
					title: __("Alur Langsung"),
					text: __(
						"Order selesai saat pembayaran. Aktifkan Kitchen Display atau Fulfillment di bawah jika perlu alur dapur/packing."
					),
			  }
			: {
					title: __("Alur Dapur & Packing"),
					text: [
						kds_on ? __("Kitchen Display aktif — item dapur masuk antrian masak.") : null,
						fulfillment_on
							? __("Fulfillment aktif — packing takeaway/delivery setelah siap.")
							: null,
					]
						.filter(Boolean)
						.join(" "),
			  };

	const field = frm.get_field("mode_summary");
	if (!field || !field.$wrapper) return;

	field.$wrapper.closest(".frappe-control").addClass("imogi-mode-summary-host");
	field.$wrapper.closest(".frappe-control").find(".control-label").hide();

	field.$wrapper.html(`
		<div class="imogi-settings-flow-strip">
			<div class="imogi-settings-flow-main">
				${settings_flat_head_html(__("Alur Operasional"))}
				<div class="imogi-settings-flow-top">
					<strong>${summary.title}</strong>
					<span class="imogi-settings-chip">${__("Aktif")}</span>
				</div>
				<p class="imogi-settings-flow-desc">${summary.text}</p>
			</div>
			<div class="imogi-settings-flow-actions">
				<button type="button" class="btn btn-primary btn-sm imogi-settings-action" data-route="imogi-pos-cashier">
					<i class="fa fa-shopping-cart"></i> ${__("Buka Kasir")}
				</button>
				<button type="button" class="btn btn-default btn-sm imogi-settings-action" data-route="imogi-pos-dashboard">
					${__("Lihat Dashboard")}
				</button>
			</div>
		</div>`);

	bind_mode_summary_handlers(frm, field.$wrapper);
}

function bind_mode_summary_handlers(frm, $host) {
	$host.off("click.imogi-hero");
	$host.on("click.imogi-hero", ".imogi-settings-action", function (e) {
		e.preventDefault();
		frappe.set_route($(this).data("route"));
	});
	if (!is_erp_enterprise_deployment()) {
		$host.on("click.imogi-hero", ".imogi-hero-tier-upgrade-btn", (e) => {
			e.preventDefault();
			e.stopPropagation();
			open_subscription_tier_picker(frm);
		});
		$host.on("click.imogi-hero", ".imogi-hero-tier-matrix-btn", (e) => {
			e.preventDefault();
			frappe.set_route($(e.currentTarget).data("route") || "imogi-pos-feature-matrix");
		});
	}
}

const STORE_IDENTITY_FIELDS = [
	"default_company",
	"multi_branch",
	"store_city",
	"target_monthly_sales",
	"owner_whatsapp",
];

const SHIFT_SETTINGS_FIELDS = [
	"enable_pos_shift",
	"enable_shift_cash_detail",
	"default_pos_profile",
	"default_warehouse",
	"default_opening_time",
	"default_closing_time",
];

const KITCHEN_SETTINGS_FIELDS = [
	"enable_kitchen_display",
	"enable_fulfillment",
	"kitchen_item_groups",
	"fulfillment_for_order_types",
];

function layout_store_identity(frm) {
	const ctx = get_settings_section(frm, "store_identity_section");
	if (!ctx || !ctx.$wrapper) return;

	ctx.$wrapper.addClass("imogi-store-identity-section imogi-settings-card-section");
	const $body = ctx.section.body || ctx.$wrapper.find(".section-body");

	frm.set_df_property("default_company", "label", __("Nama Toko"));

	if (!$body.find(".imogi-store-identity-layout").length) {
		$body.find(".imogi-settings-card-head").remove();
		$body.prepend(`
			<div class="imogi-store-identity-layout">
				<div class="imogi-store-form-grid"></div>
				<div class="imogi-receipt-preview-wrap">
					<div class="imogi-receipt-preview-head">${__("Preview Struk")}</div>
					<div class="imogi-receipt-preview-paper">
						<div class="imogi-receipt-preview-body"></div>
					</div>
				</div>
			</div>`);
	}

	const $grid = $body.find(".imogi-store-form-grid");
	STORE_IDENTITY_FIELDS.forEach((fieldname) => {
		const field = frm.get_field(fieldname);
		if (!field || !field.$wrapper) return;
		const $ctrl = field.$wrapper.closest(".frappe-control");
		$ctrl.addClass("imogi-store-field");
		$grid.append($ctrl);
	});

	if (!$grid.find(".imogi-store-email-field").length) {
		$grid.append(`
			<div class="frappe-control imogi-store-field imogi-store-email-field" data-fieldtype="Data">
				<div class="form-group">
					<div class="clearfix">
						<label class="control-label">${__("Email Toko")}</label>
					</div>
					<div class="control-input-wrapper">
						<div class="control-value like-disabled-input imogi-store-email-value text-muted">—</div>
					</div>
				</div>
			</div>`);
	}
}

function layout_shift_settings(frm) {
	const ctx = get_settings_section(frm, "store_identity_section");
	if (!ctx || !ctx.$wrapper) return;

	const $body = ctx.section.body || ctx.$wrapper.find(".section-body");
	let $dock = $body.find(".imogi-shift-settings-dock");
	if (!$dock.length) {
		$dock = $(`
			<div class="imogi-shift-settings-dock">
				${settings_flat_head_html(
					__("Shift Kasir & Opening/Closing Entry"),
					__("Wajib buka/tutup shift, profil kasir ERPNext, dan jam operasional default.")
				)}
				<div class="imogi-shift-status"></div>
				<div class="imogi-shift-form-grid"></div>
				<div class="imogi-shift-quick-links">
					<a href="/app/imogi-pos-open-shift"><i class="fa fa-sign-in"></i> ${__("Buka Shift")}</a>
					<a href="/app/imogi-pos-close-shift"><i class="fa fa-sign-out"></i> ${__("Tutup Shift")}</a>
					<a href="/app/pos-opening-entry"><i class="fa fa-list"></i> ${__("POS Opening Entry")}</a>
					<a href="/app/pos-closing-entry"><i class="fa fa-list-alt"></i> ${__("POS Closing Entry")}</a>
				</div>
			</div>`);
		$body.append($dock);
	}

	const $grid = $dock.find(".imogi-shift-form-grid");
	SHIFT_SETTINGS_FIELDS.forEach((fieldname) => {
		frm.toggle_display(fieldname, true);
		const field = frm.get_field(fieldname);
		if (!field || !field.$wrapper) return;
		const $ctrl = field.$wrapper.closest(".frappe-control");
		$ctrl.addClass("imogi-shift-field");
		$grid.append($ctrl);
	});

	render_shift_dock_summary(frm);
}

function layout_kitchen_settings(frm) {
	const ctx = get_settings_section(frm, "store_identity_section");
	if (!ctx || !ctx.$wrapper) return;

	const $body = ctx.section.body || ctx.$wrapper.find(".section-body");
	let $dock = $body.find(".imogi-kitchen-settings-dock");
	if (!$dock.length) {
		$dock = $(`
			<div class="imogi-kitchen-settings-dock">
				${settings_flat_head_html(
					__("Kitchen & Fulfillment"),
					__("Aktifkan Kitchen Display untuk antrian dapur. Aktifkan Fulfillment untuk packing takeaway/delivery.")
				)}
				<div class="imogi-kitchen-status"></div>
				<div class="imogi-kitchen-form-grid"></div>
				<div class="imogi-kitchen-quick-links">
					<a href="/app/kitchen-display"><i class="fa fa-desktop"></i> ${__("Kitchen Display")}</a>
				</div>
			</div>`);
		$body.append($dock);
	}

	const $grid = $dock.find(".imogi-kitchen-form-grid");
	KITCHEN_SETTINGS_FIELDS.forEach((fieldname) => {
		frm.toggle_display(fieldname, true);
		const field = frm.get_field(fieldname);
		if (!field || !field.$wrapper) return;
		const $ctrl = field.$wrapper.closest(".frappe-control");
		$ctrl.addClass("imogi-kitchen-field");
		$grid.append($ctrl);
	});

	const flow_ctx = get_settings_section(frm, "flow_section");
	if (flow_ctx && flow_ctx.$wrapper) {
		flow_ctx.$wrapper.hide();
	}

	render_kitchen_dock_summary(frm);
}

function render_kitchen_dock_summary(frm) {
	const $status = frm.$wrapper.find(".imogi-kitchen-status");
	if (!$status.length) return;

	const kds_on = cint(frm.doc.enable_kitchen_display);
	const fulfillment_on = cint(frm.doc.enable_fulfillment);

	$status
		.toggleClass("is-off", !kds_on && !fulfillment_on)
		.html(
			kds_on || fulfillment_on
				? `<i class="fa fa-check-circle"></i> ${__(
						kds_on && fulfillment_on
							? "KDS aktif · Fulfillment aktif"
							: kds_on
							? "KDS aktif — pesanan masuk layar dapur"
							: "Fulfillment aktif — packing takeaway/delivery"
				  )}`
				: `<i class="fa fa-info-circle"></i> ${__(
						"Nonaktif — aktifkan Kitchen Display jika pesanan perlu masuk dapur (KDS)."
				  )}`
		);
}

function render_shift_dock_summary(frm) {
	const $status = frm.$wrapper.find(".imogi-shift-status");
	if (!$status.length) return;

	const shift_on = cint(frm.doc.enable_pos_shift);
	const open_time = frm.doc.default_opening_time || "—";
	const close_time = frm.doc.default_closing_time || "—";
	const profile = frm.doc.default_pos_profile || __("Belum diatur");

	$status
		.toggleClass("is-off", !shift_on)
		.html(
			shift_on
				? `<i class="fa fa-check-circle"></i> ${__(
						"Shift aktif — kasir wajib Buka Shift (POS Opening Entry) sebelum transaksi. Profil: {0} · Jam {1}–{2}",
						[frappe.utils.escape_html(profile), open_time, close_time]
				  )}`
				: `<i class="fa fa-info-circle"></i> ${__(
						"Shift nonaktif — kasir bisa transaksi tanpa buka/tutup kas. Aktifkan toggle di bawah untuk UMKM/restoran yang pakai rekonsiliasi kas harian."
				  )}`
		);
}

function render_receipt_preview(frm) {
	const $paper = frm.$wrapper.find(".imogi-receipt-preview-body");
	const $email = frm.$wrapper.find(".imogi-store-email-value");
	if (!$paper.length) return;

	const company = frm.doc.default_company || __("Nama Toko");
	const city = frm.doc.store_city || "";
	const phone = frm.doc.owner_whatsapp || "";
	const header = (frm.doc.receipt_header || "").trim();
	const footer = (frm.doc.receipt_footer || __("Terima kasih!")).trim();
	const store_name = String(company).toUpperCase();

	const paint = (email) => {
		if ($email.length) {
			$email.text(email || "—");
		}
		$paper.html(`
			<div class="imogi-rcpt-store">${frappe.utils.escape_html(store_name)}</div>
			${city ? `<div class="imogi-rcpt-line">${frappe.utils.escape_html(city)}</div>` : ""}
			${phone ? `<div class="imogi-rcpt-line">${frappe.utils.escape_html(phone)}</div>` : ""}
			${email ? `<div class="imogi-rcpt-line">${frappe.utils.escape_html(email)}</div>` : ""}
			${header ? `<div class="imogi-rcpt-msg">${frappe.utils.escape_html(header)}</div>` : ""}
			<div class="imogi-rcpt-divider">--------------------------------</div>
			<div class="imogi-rcpt-item"><span>Pandan Latte</span><span>35.000</span></div>
			<div class="imogi-rcpt-item"><span>Latte Decaf</span><span>32.000</span></div>
			<div class="imogi-rcpt-divider">--------------------------------</div>
			<div class="imogi-rcpt-total"><span>TOTAL</span><span>67.000</span></div>
			<div class="imogi-rcpt-footer">${frappe.utils.escape_html(footer)}</div>`);
	};

	if (frm.doc.default_company) {
		frappe.db.get_value("Company", frm.doc.default_company, "email").then((r) => {
			paint((r && r.message && r.message.email) || "");
		});
	} else {
		paint("");
	}
}

function build_trust_cards() {
	/* Trust cards removed — cleaner settings layout aligned with Promo Rule UI */
}

function build_sidebar_help(frm) {
	const $tabbar = frm.$wrapper.find(".imogi-settings-tabbar");
	if (!$tabbar.length || $tabbar.find(".imogi-settings-help-link").length) return;

	$tabbar.append(`
		<a class="imogi-settings-help-link" href="mailto:support@imogi.id" title="${__("Hubungi Support")}">
			<i class="fa fa-life-ring"></i> ${__("Bantuan")}
		</a>`);
}

function show_settings_placeholder(frm, tabId) {
	const tab = SETTINGS_TABS.find((t) => t.id === tabId);
	const $content = frm.$wrapper.find(".imogi-settings-content");
	$content.append(`
		<div class="imogi-settings-placeholder">
			<div class="imogi-settings-placeholder-icon"><i class="fa ${tab.icon}"></i></div>
			<h3>${tab.label}</h3>
			<p>${__("Bagian ini akan tersedia di pembaruan berikutnya.")}</p>
		</div>`);
}

function toggle_general_tab_sections(frm, tabId) {
	if (tabId !== "general") return;
	["branch_pricing_section", "general_section"].forEach((section) => {
		set_settings_section_visible(frm, section, false);
	});
	[
		"master_selling_price_list",
		"sync_prices_to_branches_on_import",
		"sync_branch_prices",
		"hq_push_menu_from_branch",
		"hq_ensure_branch_price_lists",
		"default_opening_time",
		"default_closing_time",
		"default_pos_profile",
		"default_warehouse",
		"enable_pos_shift",
	].forEach((fieldname) => frm.toggle_display(fieldname, false));
	STORE_IDENTITY_FIELDS.forEach((fieldname) => frm.toggle_display(fieldname, true));
}

function toggle_settings_by_business_type(frm) {
	if (frm.$wrapper.hasClass("imogi-settings-page")) {
		build_settings_tabs(frm);
	}
	if (__imogi_settings_active_tab) {
		activate_settings_tab(frm, normalize_settings_tab_id(__imogi_settings_active_tab));
	}
}

function open_menu_import_dialog(frm) {
	frappe.call({
		method: "imogi_pos.api.menu_import_api.get_menu_import_template",
		callback: (r) => {
			const info = r.message || {};
			const notes = (info.notes || [])
				.map((note) => `<li>${frappe.utils.escape_html(note)}</li>`)
				.join("");
			const dialog = new frappe.ui.Dialog({
				title: __("Import Menu Lengkap (Product + BOM)"),
				fields: [
					{
						fieldname: "help",
						fieldtype: "HTML",
						options: `<p class="text-muted">${__(
							"Format blok Excel: baris produk jadi, lalu baris bahan di bawahnya."
						)}</p>
						<ul class="small text-muted">${notes}</ul>
						<p class="small text-muted"><strong>${__("Kolom")}:</strong> ${frappe.utils.escape_html(
							(info.headers || []).join(", ")
						)}</p>`,
					},
					{
						fieldname: "menu_file",
						fieldtype: "Attach",
						label: __("File Excel / CSV"),
						reqd: 1,
					},
					{
						fieldname: "import_stock_sheet",
						fieldtype: "Check",
						label: __("Import stok dari sheet Stok Awal (jika ada)"),
						default: 1,
					},
					{
						fieldname: "update_existing",
						fieldtype: "Check",
						label: __("Update produk & BOM yang sudah ada"),
						default: 1,
					},
				],
				primary_action_label: __("Import Menu"),
				primary_action(values) {
					if (!values.menu_file) return;
					frappe.call({
						method: "imogi_pos.api.menu_import_api.import_menu_from_file",
						args: {
							file_url: values.menu_file,
							update_existing: values.update_existing ? 1 : 0,
							import_stock: values.import_stock_sheet ? 1 : 0,
						},
						freeze: true,
						freeze_message: __("Mengimport menu..."),
						callback(res) {
							dialog.hide();
							const msg = res.message || {};
							frappe.msgprint({
								title: __("Import Menu Selesai"),
								indicator: msg.errors && msg.errors.length ? "orange" : "green",
								message: `${__("Produk dibuat")}: ${msg.products_created || 0}<br>${__(
									"Produk diupdate"
								)}: ${msg.products_updated || 0}<br>${__("Template variant dibuat")}: ${
									msg.templates_created || 0
								}<br>${__("Template variant diupdate")}: ${
									msg.templates_updated || 0
								}<br>${__("Variant dibuat")}: ${msg.variants_created || 0}<br>${__(
									"Variant diupdate"
								)}: ${msg.variants_updated || 0}${
									msg.templates_demoted
										? `<br>${__("Template dijadikan produk biasa")}: ${msg.templates_demoted}`
										: ""
								}${
									msg.variants_retired
										? `<br>${__("Variant lama dinonaktifkan")}: ${msg.variants_retired}`
										: ""
								}${
									msg.variants_deleted
										? `<br>${__("Variant lama dihapus")}: ${msg.variants_deleted}`
										: ""
								}<br>${__("Komponen dibuat")}: ${
									msg.components_created || 0
								}<br>${__("Komponen diupdate")}: ${msg.components_updated || 0}<br>${__(
									"BOM dibuat"
								)}: ${msg.boms_created || 0}<br>${__("BOM diupdate")}: ${
									msg.boms_updated || 0
								}<br>${__("Service dilewati")}: ${msg.skipped_service || 0}${
									msg.stock_imported
										? `<br>${__("Stok diimport")}: ${msg.stock_lines || 0} ${__("baris")}${
												msg.buying_prices
													? `, ${__("harga beli")}: ${msg.buying_prices}`
													: ""
										  }${
												msg.stock_entry
													? ` (${frappe.utils.escape_html(msg.stock_entry)})`
													: ""
										  }`
										: ""
								}${
									msg.errors && msg.errors.length
										? `<br><span class="text-danger">${msg.errors.length} ${__(
												"error"
										  )}</span>`
										: ""
								}`,
							});
						},
					});
				},
			});
			dialog.show();
		},
	});
}

function open_stock_import_dialog(frm) {
	frappe.call({
		method: "imogi_pos.api.stock_import_api.get_stock_import_template",
		callback: (r) => {
			const info = r.message || {};
			const branches = info.branches || [];
			const notes = (info.notes || [])
				.map((note) => `<li>${frappe.utils.escape_html(note)}</li>`)
				.join("");
			const fields = [
				{
					fieldname: "help",
					fieldtype: "HTML",
					options: `<ul class="small text-muted">${notes}</ul>
					<p class="small text-muted"><strong>${__("Kolom")}:</strong> ${frappe.utils.escape_html(
						(info.headers || []).join(", ")
					)}</p>`,
				},
			];
			if (branches.length > 1) {
				fields.push({
					fieldname: "branch_code",
					fieldtype: "Select",
					label: __("Cabang / Gudang"),
					options: branches.map((row) => {
						const label = row.city
							? `${row.branch_name} (${row.city})`
							: row.branch_name || row.branch_code;
						return { label, value: row.branch_code };
					}),
					reqd: 1,
				});
			}
			fields.push(
				{
					fieldname: "stock_file",
					fieldtype: "Attach",
					label: __("File Excel / CSV"),
					reqd: 1,
				},
				{
					fieldname: "update_rate",
					fieldtype: "Check",
					label: __(
						"Update harga satuan dari kolom Harga (valuation_rate + Item Price Buying)"
					),
					default: 1,
				}
			);
			const dialog = new frappe.ui.Dialog({
				title: __("Import Stok Bahan Baku"),
				fields,
				primary_action_label: __("Import Stok"),
				primary_action(values) {
					if (!values.stock_file) return;
					frappe.call({
						method: "imogi_pos.api.stock_import_api.import_stock_from_file",
						args: {
							file_url: values.stock_file,
							update_rate: values.update_rate ? 1 : 0,
							branch_code: values.branch_code || null,
						},
						freeze: true,
						freeze_message: __("Mengimport stok..."),
						callback(res) {
							dialog.hide();
							const msg = res.message || {};
							frappe.msgprint({
								title: __("Import Stok Selesai"),
								indicator: msg.errors && msg.errors.length ? "orange" : "green",
								message: `${__("Baris stok")}: ${msg.stock_lines || 0}<br>${__("Dilewati")}: ${
									msg.stock_skipped || 0
								}<br>${__("Gudang")}: ${frappe.utils.escape_html(msg.warehouse || "-")}<br>${__(
									"Harga beli"
								)}: ${msg.buying_prices || 0}<br>${__(
									"Stock Entry"
								)}: ${frappe.utils.escape_html(msg.stock_entry || "-")}${
									msg.errors && msg.errors.length
										? `<br><span class="text-danger">${msg.errors.length} ${__(
												"error"
										  )}</span>`
										: ""
								}`,
							});
						},
					});
				},
			});
			dialog.show();
		},
	});
}

function open_product_import_dialog(frm) {
	frappe.call({
		method: "imogi_pos.api.import_api.get_import_template",
		args: { import_type: "product" },
		callback: (r) => {
			const info = r.message || {};
			const dialog = new frappe.ui.Dialog({
				title: __("Import Produk (CSV / Excel)"),
				fields: [
					{
						fieldname: "help",
						fieldtype: "HTML",
						options: `<p class="text-muted">${__(
							"Kolom: no, produk, kategori (Food/Beverage/Dessert/Service), add_on, standard_rate, stock_uom. Format: CSV, XLSX, atau XLS."
						)}</p>
						<pre class="small">${frappe.utils.escape_html(info.sample || "")}</pre>`,
					},
					{
						fieldname: "csv_file",
						fieldtype: "Attach",
						label: __("File CSV / Excel"),
						reqd: 1,
					},
					{
						fieldname: "update_existing",
						fieldtype: "Check",
						label: __("Update item yang sudah ada"),
					},
				],
				primary_action_label: __("Import"),
				primary_action(values) {
					if (!values.csv_file) return;
					frappe.call({
						method: "imogi_pos.api.import_api.import_products_from_csv",
						args: {
							file_url: values.csv_file,
							update_existing: values.update_existing ? 1 : 0,
						},
						freeze: true,
						freeze_message: __("Mengimport produk..."),
						callback(res) {
							dialog.hide();
							const msg = res.message || {};
							frappe.msgprint({
								title: __("Import Selesai"),
								indicator: msg.errors && msg.errors.length ? "orange" : "green",
								message: `${__("Dibuat")}: ${msg.created || 0}<br>${__(
									"Diupdate"
								)}: ${msg.updated || 0}<br>${__("Dilewati")}: ${msg.skipped || 0}${
									msg.errors && msg.errors.length
										? `<br><span class="text-danger">${msg.errors.length} ${__(
												"error"
										  )}</span>`
										: ""
								}`,
							});
						},
					});
				},
			});
			dialog.show();
		},
	});
}

function open_bom_import_dialog(frm) {
	frappe.call({
		method: "imogi_pos.api.import_api.get_import_template",
		args: { import_type: "bom" },
		callback: (r) => {
			const info = r.message || {};
			const dialog = new frappe.ui.Dialog({
				title: __("Import BOM (CSV / Excel)"),
				fields: [
					{
						fieldname: "help",
						fieldtype: "HTML",
						options: `<p class="text-muted">${__(
							"Kolom: product (produk jadi), bom_product (bahan), qty, uom, double. Import produk dulu sebelum BOM. Format: CSV, XLSX, atau XLS."
						)}</p>
						<pre class="small">${frappe.utils.escape_html(info.sample || "")}</pre>`,
					},
					{
						fieldname: "csv_file",
						fieldtype: "Attach",
						label: __("File CSV / Excel"),
						reqd: 1,
					},
					{
						fieldname: "update_existing",
						fieldtype: "Check",
						label: __("Update BOM yang sudah ada"),
						default: 1,
					},
				],
				primary_action_label: __("Import BOM"),
				primary_action(values) {
					if (!values.csv_file) return;
					frappe.call({
						method: "imogi_pos.api.import_api.import_bom_from_csv",
						args: {
							file_url: values.csv_file,
							update_existing: values.update_existing ? 1 : 0,
						},
						freeze: true,
						freeze_message: __("Mengimport BOM..."),
						callback(res) {
							dialog.hide();
							const msg = res.message || {};
							frappe.msgprint({
								title: __("Import BOM Selesai"),
								indicator: msg.errors && msg.errors.length ? "orange" : "green",
								message: `${__("Dibuat")}: ${msg.created || 0}<br>${__(
									"Diupdate"
								)}: ${msg.updated || 0}<br>${__("Dilewati")}: ${msg.skipped || 0}${
									msg.errors && msg.errors.length
										? `<br><span class="text-danger">${msg.errors.length} ${__(
												"error"
										  )}</span>`
										: ""
								}`,
							});
						},
					});
				},
			});
			dialog.show();
		},
	});
}

function method_class(method) {
	const m = (method || "POST").toUpperCase();
	if (m.includes("GET") && m.includes("POST")) return "is-mixed";
	if (m.includes("GET")) return "is-get";
	return "is-post";
}

function render_param_tags(params) {
	return (params || "")
		.split(",")
		.map((p) => p.trim())
		.filter(Boolean)
		.map((p) => `<span class="imogi-param-chip">${frappe.utils.escape_html(p)}</span>`)
		.join("");
}

function render_endpoint_list(endpoints, group_key) {
	const group = ENDPOINT_GROUPS[group_key];
	if (!group) return `<p class="imogi-muted">${__("Tidak ada endpoint")}</p>`;

	return `<div class="imogi-ep-list">${group.keys
		.filter((key) => endpoints[key])
		.map((key) => {
			const row = endpoints[key];
			return `
				<div class="imogi-ep-row" data-url="${frappe.utils.escape_html(row.url || "")}">
					<div class="imogi-ep-row-left">
						<span class="imogi-ep-method ${method_class(row.method)}">${row.method || "POST"}</span>
						<div>
							<div class="imogi-ep-row-title">${row.label || key}</div>
							<div class="imogi-ep-row-slug">${key}</div>
						</div>
					</div>
					<div class="imogi-ep-row-params">${render_param_tags(row.params)}</div>
					<button type="button" class="imogi-btn-icon imogi-copy-endpoint-url" title="${__("Copy URL")}">
						<i class="fa fa-copy"></i>
					</button>
				</div>`;
		})
		.join("")}</div>`;
}

function cred_card(label, value, copy_class, is_text) {
	return `
		<div class="imogi-cred-card">
			<label>${label}</label>
			<div class="imogi-cred-row${is_text ? " is-text" : ""}">
				${is_text ? `<span>${frappe.utils.escape_html(value || "-")}</span>` : `<code>${frappe.utils.escape_html(value || "-")}</code>`}
				${
					copy_class
						? `<button type="button" class="imogi-btn-icon ${copy_class}"><i class="fa fa-copy"></i></button>`
						: ""
				}
			</div>
		</div>`;
}

function build_api_docs_html(info, frm) {
	const endpoints = info.endpoints || {};
	const ok = info.has_credentials;
	const ep_groups = Object.entries(ENDPOINT_GROUPS).filter(([, g]) =>
		g.keys.some((k) => endpoints[k])
	);

	const sidebar = `
		<nav class="imogi-docs-sidebar">
			<button type="button" class="imogi-docs-nav-item is-active" data-docs-section="connect">
				<span class="imogi-docs-nav-icon"><i class="fa fa-link"></i></span>${__("Koneksi")}
			</button>
			<button type="button" class="imogi-docs-nav-item" data-docs-section="endpoints">
				<span class="imogi-docs-nav-icon"><i class="fa fa-list"></i></span>${__("Endpoint")}
			</button>
			<button type="button" class="imogi-docs-nav-item" data-docs-section="examples">
				<span class="imogi-docs-nav-icon"><i class="fa fa-code"></i></span>${__("Contoh")}
			</button>
		</nav>`;

	const ep_tabs = ep_groups
		.map(
			([key, g], i) =>
				`<button type="button" class="imogi-tab-btn ${i === 0 ? "is-active" : ""}" data-ep-panel="${key}">${g.label}</button>`
		)
		.join("");

	const ep_panes = ep_groups
		.map(
			([key, g], i) => `
			<div class="imogi-ep-panel ${i === 0 ? "is-active" : ""}" id="imogi-ep-${key}">
				<p class="imogi-ep-group-desc">${g.desc}</p>
				${render_endpoint_list(endpoints, key)}
			</div>`
		)
		.join("");

	return `
		<div class="imogi-docs-shell">
			${sidebar}
			<div class="imogi-docs-main">
				<div class="imogi-docs-section is-active" id="imogi-docs-connect">
					<div class="imogi-docs-section-head">
						<h3>${__("Koneksi API")}</h3>
						<span class="imogi-pill ${ok ? "is-green" : "is-orange"}">${ok ? __("Credential aktif") : __("Belum ada key")}</span>
					</div>
					<p class="imogi-docs-lead">${__("Header wajib di setiap request ke IMOGI POS API.")}</p>
					<div class="imogi-cred-cards">
						${cred_card(__("Base URL"), info.base_url, "imogi-copy-base-url")}
						${cred_card(__("API Key"), info.api_key, info.api_key ? "imogi-copy-key" : "")}
						${cred_card(__("API User"), info.api_user, "", true)}
					</div>
					<div class="imogi-headers-block">
						<div class="imogi-headers-head">
							<label>${__("Request Headers")}</label>
							<button type="button" class="imogi-btn-ghost imogi-copy-headers"><i class="fa fa-copy"></i> ${__("Copy")}</button>
						</div>
						<pre class="imogi-code-block">${frappe.utils.escape_html(info.auth_header || "")}</pre>
					</div>
					<div class="imogi-docs-actions">
						<button type="button" class="imogi-btn-primary imogi-btn-generate-api">
							<i class="fa fa-key"></i> ${frm.doc.order_api_key ? __("Regenerate API Key") : __("Generate API Key")}
						</button>
						<span class="imogi-muted imogi-key-hint">${__("Secret hanya ditampilkan sekali setelah generate.")}</span>
					</div>
				</div>

				<div class="imogi-docs-section" id="imogi-docs-endpoints">
					<div class="imogi-docs-section-head">
						<h3>${__("Endpoint API")}</h3>
					</div>
					<p class="imogi-docs-lead">${__("10 endpoint — order, katalog, dan customer.")}</p>
					<div class="imogi-tab-bar">${ep_tabs}</div>
					<div class="imogi-ep-panels">${ep_panes}</div>
				</div>

				<div class="imogi-docs-section" id="imogi-docs-examples">
					<div class="imogi-docs-section-head">
						<h3>${__("Contoh Request")}</h3>
					</div>
					${code_block(__("Body create order"), JSON.stringify(info.example_create_body || {}, null, 2), "body")}
					${code_block(__("cURL"), info.example_curl || "", "curl")}
					${code_block(__("Python"), info.example_python || "", "python")}
					${
						(info.test_scripts || []).length
							? `<div class="imogi-script-box"><strong>${__("Script testing")}</strong><ul>${(
									info.test_scripts || []
							  )
									.map((p) => `<li><code>${p}</code></li>`)
									.join("")}</ul></div>`
							: ""
					}
				</div>
			</div>
		</div>`;
}

function code_block(title, content, id) {
	return `
		<div class="imogi-code-section">
			<div class="imogi-code-section-head">
				<span>${title}</span>
				<button type="button" class="imogi-btn-ghost imogi-copy-block" data-target="${id}">
					<i class="fa fa-copy"></i> ${__("Copy")}
				</button>
			</div>
			<pre class="imogi-code-block" id="imogi-copy-${id}">${frappe.utils.escape_html(content)}</pre>
		</div>`;
}

function bind_api_events(frm, $root, info) {
	$root.find(".imogi-btn-generate-api").on("click", () => {
		if (frm.doc.order_api_key) {
			frappe.confirm(__("API Key lama tidak valid lagi. Regenerate?"), () =>
				regenerate_api_credentials(frm)
			);
			return;
		}
		regenerate_api_credentials(frm);
	});

	$root.find(".imogi-copy-key").on("click", () => {
		if (info.api_key) copy_to_clipboard(info.api_key, __("API Key copied"));
	});
	$root.find(".imogi-copy-base-url").on("click", () => {
		if (info.base_url) copy_to_clipboard(info.base_url, __("Base URL copied"));
	});
	$root.find(".imogi-copy-headers").on("click", () => {
		if (info.auth_header) copy_to_clipboard(info.auth_header, __("Headers copied"));
	});
	$root.find(".imogi-copy-endpoint-url").on("click", function () {
		const url = $(this).closest(".imogi-ep-row").data("url");
		if (url) copy_to_clipboard(url, __("URL copied"));
	});
	$root.find(".imogi-copy-block").on("click", function () {
		const target = $(this).data("target");
		const text = $root.find(`#imogi-copy-${target}`).text();
		if (text) copy_to_clipboard(text, __("Copied"));
	});
}
