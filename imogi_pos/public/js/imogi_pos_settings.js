frappe.provide("imogi_pos.settings");

frappe.ui.form.on("IMOGI POS Settings", {
	onload(frm) {
		ensure_imogi_styles(() => init_settings_page(frm));
	},

	refresh(frm) {
		ensure_imogi_styles(() => {
			init_settings_page(frm);
			add_page_toolbar_buttons(frm);
			if (normalize_settings_tab_id(__imogi_settings_active_tab) === "general") {
				layout_store_identity(frm);
				layout_shift_settings(frm);
				layout_kitchen_settings(frm);
				layout_general_dock_grid(frm);
				render_receipt_preview(frm);
			}
			if (normalize_settings_tab_id(__imogi_settings_active_tab) === "receipt") {
				render_receipt_whatsapp_dock_summary(frm);
			}
		});
	},

	before_save(frm) {
		sync_dock_fields_to_doc(frm);
		sync_kitchen_dock_table_rows_to_doc(frm);
	},

	generate_order_api_key(frm) {
		imogi_pos.settings_api.regenerate(frm);
	},

	enable_order_api(frm) {
		render_api_dock_summary(frm);
		apply_settings_field_states(frm);
	},

	enable_order_api_webhook(frm) {
		toggle_webhook_url_visibility(frm);
	},

	enable_loyalty(frm) {
		render_loyalty_dock_summary(frm);
		schedule_settings_field_state(frm, apply_program_promo_field_state);
	},

	enable_stamp_card(frm) {
		render_loyalty_dock_summary(frm);
		schedule_settings_field_state(frm, apply_program_promo_field_state);
	},

	enable_promo_rules(frm) {
		render_loyalty_dock_summary(frm);
		schedule_settings_field_state(frm, apply_program_promo_field_state);
	},

	enable_birthday_promo(frm) {
		schedule_settings_field_state(frm, apply_program_promo_field_state);
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

	enable_role_authorization(frm) {
		render_role_authorization_matrix(frm);
	},

	enable_page_authorization(frm) {
		render_page_authorization_matrix(frm);
	},

	enable_role_gating(frm) {
		render_role_authorization_matrix(frm);
	},

	royalty_expense_account(frm) {
		render_franchise_dock_summary(frm);
	},

	royalty_payable_account(frm) {
		render_franchise_dock_summary(frm);
	},

	after_save(frm) {
		show_pending_api_credentials(frm);
		frm._imogi_reconcile_after_save = true;
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

	receipt_logo(frm) {
		render_receipt_preview(frm);
	},

	receipt_footer(frm) {
		render_receipt_preview(frm);
	},

	enable_whatsapp_receipt(frm) {
		render_receipt_whatsapp_dock_summary(frm);
	},

	whatsapp_api_provider(frm) {
		render_receipt_whatsapp_dock_summary(frm);
	},

	auto_print_receipt_on_success(frm) {
		render_receipt_whatsapp_dock_summary(frm);
	},

	enable_receipt_print(frm) {
		render_receipt_whatsapp_dock_summary(frm);
	},

	enable_sales_tax(frm) {
		apply_settings_field_states(frm);
	},

	default_company(frm) {
		render_receipt_preview(frm);
	},

	enable_pos_shift(frm) {
		render_shift_dock_summary(frm);
		if (cint(frm.doc.enable_pos_shift)) {
			ensure_dock_field_rendered(frm, "enable_shift_cash_detail");
		}
		frappe.after_ajax(() => layout_shift_settings(frm));
	},

	enable_shift_cash_detail(frm) {
		frappe.after_ajax(() => layout_shift_settings(frm));
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
		apply_settings_field_states(frm);
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

	enable_table_service(frm) {
		render_mode_summary(frm);
		render_kitchen_dock_summary(frm);
		frappe.after_ajax(() => layout_kitchen_settings(frm));
	},

	enable_qr_self_service(frm) {
		render_mode_summary(frm);
		render_kitchen_dock_summary(frm);
		frappe.after_ajax(() => {
			layout_kitchen_settings(frm);
			render_receipt_whatsapp_dock_summary(frm);
		});
	},

	enable_kitchen_display(frm) {
		render_mode_summary(frm);
		render_kitchen_dock_summary(frm);
		frappe.after_ajax(() => layout_kitchen_settings(frm));
	},

	kds_station_mode(frm) {
		render_kitchen_dock_summary(frm);
		frappe.after_ajax(() => layout_kitchen_settings(frm));
	},

	enable_fulfillment(frm) {
		render_mode_summary(frm);
		render_kitchen_dock_summary(frm);
		frappe.after_ajax(() => layout_kitchen_settings(frm));
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
		desc: "",
		sections: ["store_identity_section", "branch_pricing_section", "general_section", "flow_section"],
	},
	{
		id: "transactions",
		label: __("Program & Promo"),
		icon: "fa-exchange",
		desc: __("Loyalty, stamp, promo otomatis, dan ulang tahun"),
		sections: ["loyalty_section", "stamp_section", "promo_section", "birthday_section"],
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
		desc: __("Import menu, produk & BOM"),
		sections: ["import_section"],
	},
	{
		id: "receipt",
		label: __("Printer & Struk"),
		icon: "fa-print",
		desc: __("Cetak struk thermal di kasir"),
		sections: ["receipt_section", "whatsapp_qr_templates_section"],
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
		desc: __("Role & akses, pajak, dan pengaturan lanjutan"),
		sections: ["operations_section", "franchise_section"],
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
	"enable_shift_cash_detail",
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
	"kds_station_mode",
	"enable_fulfillment",
	"kitchen_item_group_rows",
	"bar_item_group_rows",
	"fulfillment_order_type_rows",
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
	"receipt_logo",
	"receipt_header",
	"receipt_footer",
	"auto_print_receipt_on_success",
	"enable_whatsapp_receipt",
	"whatsapp_api_provider",
	"fonnte_api_token",
	"whatsapp_receipt_message",
	{ section: "whatsapp_qr_templates_section" },
	"whatsapp_qr_order_received_message",
	"whatsapp_qr_order_complete_message",
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
	{ section: "birthday_section" },
	"enable_birthday_promo",
	"birthday_discount_percent",
	"birthday_window_days",
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
	"enable_role_authorization",
	"role_authorization_matrix",
	"role_authorizations",
	"enable_page_authorization",
	"page_authorization_matrix",
	"page_authorizations",
	"enable_role_gating",
	"enable_approval_workflow",
	"approval_discount_threshold_percent",
	"approval_supervisor_pin",
	"enable_central_kitchen",
	"central_kitchen_station",
	"enable_kitchen_printer",
	"enable_cashback",
	"cashback_percent",
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

// Rollout tertunda: field & backend tetap ada; sembunyikan dari UI Settings sampai dibutuhkan.
const SETTINGS_DEFERRED_OPERATIONAL_FIELDS = [
	"enable_role_gating",
	"enable_central_kitchen",
	"central_kitchen_station",
	"enable_kitchen_printer",
	"enable_cashback",
	"cashback_percent",
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
	"mode_summary",
	"subscription_tier",
	"upgrade_subscription_tier",
	"printer_setup_status",
	"generate_order_api_key",
	"order_api_key",
	"order_api_secret",
	"order_api_info",
	// Section "Pengaturan Dashboard" dihapus dari UI Settings — backend tetap pakai
	// default (realtime aktif, refresh dashboard 30 detik).
	"enable_realtime_notifications",
	"dashboard_refresh_seconds",
	// Section "Stok Otomatis" disembunyikan dari UI — fungsi tetap jalan dengan default
	// (cek stok 180 detik, threshold reorder_level, auto Purchase Request aktif).
	"low_stock_check_interval",
	"low_stock_alert_roles",
	"reorder_level_field",
	"enable_auto_purchase_request",
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
	if (document.getElementById("imogi-settings-inline-css-v82")) {
		run();
		return;
	}
	window.__imogi_settings_styles_ready = false;
	inject_imogi_settings_css();
	frappe.require("/assets/imogi_pos/css/imogi_pos.css").then(() => {
		window.__imogi_settings_styles_ready = true;
		run();
	});
}

function inject_imogi_settings_css() {
	if (document.getElementById("imogi-settings-inline-css-v82")) return;
	document.getElementById("imogi-settings-inline-css-v80")?.remove();
	document.getElementById("imogi-settings-inline-css-v79")?.remove();
	document.getElementById("imogi-settings-inline-css-v78")?.remove();
	document.getElementById("imogi-settings-inline-css-v77")?.remove();
	document.getElementById("imogi-settings-inline-css-v76")?.remove();
	document.getElementById("imogi-settings-inline-css-v75")?.remove();
	document.getElementById("imogi-settings-inline-css-v53")?.remove();
	document.getElementById("imogi-settings-inline-css-v52")?.remove();
	document.getElementById("imogi-settings-inline-css-v51")?.remove();
	document.getElementById("imogi-settings-inline-css-v50")?.remove();
	document.getElementById("imogi-settings-inline-css-v49")?.remove();
	document.getElementById("imogi-settings-inline-css-v48")?.remove();
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
		.imogi-settings-page .form-footer,
		.imogi-settings-page .form-tabs-list .form-tab[data-fieldname="connections"],
		.imogi-settings-page .comment-box,
		.imogi-settings-page .timeline,
		.imogi-settings-page .new-timeline,
		.imogi-settings-page .form-comments { display: none !important; }
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
		.imogi-settings-help-card { display: none !important; }
		.imogi-settings-page .imogi-store-identity-section > .section-head {
			display: none !important;
		}
		.imogi-shift-settings-dock .help-box,
		.imogi-shift-settings-dock .small.text-muted,
		.imogi-shift-settings-dock .imogi-shift-status,
		.imogi-kitchen-settings-dock .imogi-kitchen-status {
			display: none !important;
		}
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
			width: 100%;
		}
		.imogi-store-identity-card {
			background: transparent;
			border: none;
			border-radius: 0;
			box-sizing: border-box;
			margin-bottom: 24px;
			padding: 0 0 24px;
			width: 100%;
		}
		.imogi-settings-tab-panel--general .imogi-store-identity-card {
			border-bottom: 1px solid #e5e7eb;
		}
		.imogi-store-identity-card-head {
			display: none !important;
		}
		.imogi-store-identity-main {
			display: flex;
			flex-direction: column;
			gap: 14px;
			min-width: 0;
			width: 100%;
		}
		.imogi-store-info-banner {
			align-items: flex-start;
			background: #f7f7f7;
			border: 1px solid #e5e7eb;
			border-radius: 8px;
			color: #374151;
			display: flex;
			font-size: 12px;
			gap: 10px;
			line-height: 1.5;
			padding: 12px 14px;
		}
		.imogi-store-info-banner i {
			color: #111827;
			flex-shrink: 0;
			font-size: 14px;
			margin-top: 1px;
		}
		.imogi-store-trust-row {
			display: grid;
			gap: 12px;
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
		.imogi-store-trust-card {
			background: #fff;
			border: 1px solid #e5e7eb;
			border-radius: 10px;
			padding: 14px 12px;
		}
		.imogi-store-trust-icon {
			align-items: center;
			background: #f3f4f6;
			border: 1px solid #e5e7eb;
			border-radius: 8px;
			color: #111827;
			display: inline-flex;
			font-size: 15px;
			height: 34px;
			justify-content: center;
			margin-bottom: 10px;
			width: 34px;
		}
		.imogi-store-trust-title {
			color: #111827;
			font-size: 12px;
			font-weight: 700;
			line-height: 1.35;
			margin-bottom: 4px;
		}
		.imogi-store-trust-desc {
			color: #6b7280;
			font-size: 11px;
			line-height: 1.45;
		}
		.imogi-shift-settings-dock,
		.imogi-kitchen-settings-dock {
			background: transparent;
			border: none;
			border-radius: 0;
			box-sizing: border-box;
			display: flex;
			flex-direction: column;
			gap: 12px;
			height: 100%;
			margin: 0;
			min-width: 0;
			padding: 0;
			width: 100%;
		}
		.imogi-dock-card-head {
			color: #0f1f35;
			font-size: 13px;
			font-weight: 700;
			line-height: 1.25;
			margin: 0 0 10px;
		}
		.imogi-dock-card-hint {
			color: #6b7280;
			font-size: 11px;
			line-height: 1.45;
			margin-top: -6px;
		}
		.imogi-store-identity-section .section-body > .row {
			display: none !important;
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
		.imogi-settings-page .imogi-store-form-grid.imogi-store-form-grid--horizontal {
			display: flex;
			flex-direction: column;
			gap: 12px;
		}
		.imogi-store-form-grid--horizontal .imogi-store-field {
			margin-bottom: 0 !important;
			max-width: 100% !important;
			width: 100% !important;
		}
		.imogi-store-form-grid--horizontal .imogi-store-field .form-group {
			align-items: center;
			display: grid;
			gap: 8px 16px;
			grid-template-columns: minmax(150px, 32%) minmax(0, 1fr);
			margin-bottom: 0;
		}
		.imogi-store-form-grid--horizontal .imogi-store-field .clearfix {
			margin: 0;
			padding: 0;
		}
		.imogi-settings-page .imogi-store-form-grid--horizontal .imogi-store-field .control-label {
			color: #374151;
			float: none !important;
			font-size: 13px !important;
			font-weight: 600;
			line-height: 1.35;
			margin: 0 !important;
			padding: 0 !important;
			text-align: left;
			width: auto !important;
		}
		.imogi-store-form-grid--horizontal .imogi-store-field .control-input-wrapper,
		.imogi-store-form-grid--horizontal .imogi-store-field .control-value,
		.imogi-store-form-grid--horizontal .imogi-store-field .control-input,
		.imogi-store-form-grid--horizontal .imogi-store-field input.form-control,
		.imogi-store-form-grid--horizontal .imogi-store-field select.form-control,
		.imogi-store-form-grid--horizontal .imogi-store-field .link-field {
			max-width: 100% !important;
			min-width: 0;
			width: 100% !important;
		}
		.imogi-store-form-grid--horizontal .imogi-store-field .form-control {
			font-size: 12px;
			min-height: 34px;
			padding: 5px 10px;
		}
		.imogi-store-target-combo .form-group {
			align-items: start;
			display: grid;
			gap: 8px 16px;
			grid-template-columns: minmax(150px, 32%) minmax(0, 1fr);
			margin-bottom: 0;
		}
		.imogi-store-target-combo .imogi-store-target-value-stack {
			display: flex;
			flex-direction: column;
			gap: 6px;
			min-width: 0;
		}
		.imogi-store-target-combo .imogi-store-target-input-row {
			align-items: center;
			display: flex;
			flex-wrap: wrap;
			gap: 12px 16px;
			min-width: 0;
		}
		.imogi-store-target-combo .imogi-store-target-input-row > .control-input-wrapper {
			flex: 1 1 180px;
			margin: 0;
			max-width: none !important;
			min-width: 0;
			width: auto !important;
		}
		.imogi-store-target-combo .imogi-store-target-input-row > .frappe-control[data-fieldname="multi_branch"] {
			display: block !important;
			flex: 0 0 auto;
			grid-column: auto !important;
			margin: 0 !important;
			max-width: none !important;
			width: auto !important;
		}
		.imogi-store-target-combo .frappe-control[data-fieldname="multi_branch"] .form-group {
			display: block;
			margin: 0;
		}
		.imogi-store-target-combo .frappe-control[data-fieldname="multi_branch"] .checkbox {
			margin: 0;
		}
		.imogi-store-target-combo .help-box,
		.imogi-store-form-grid--horizontal .frappe-control[data-fieldname="target_monthly_sales"] .help-box,
		.imogi-store-form-grid--horizontal .frappe-control[data-fieldname="target_monthly_sales"] .small.text-muted {
			display: none !important;
		}
		.imogi-store-form-grid--horizontal .imogi-store-field[data-fieldtype="Check"] .form-group {
			align-items: center;
		}
		.imogi-store-form-grid--horizontal .imogi-store-field[data-fieldtype="Check"] .checkbox {
			margin: 0;
			padding-top: 0;
		}
		.imogi-store-form-grid--horizontal .imogi-store-field[data-fieldtype="Check"] .checkbox label {
			margin: 0;
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
			display: grid;
			gap: 20px 24px;
			grid-template-columns: minmax(0, 1fr) 248px;
			width: 100%;
		}
		.imogi-settings-tab-panel--general .imogi-receipt-preview-wrap {
			background: transparent !important;
			border: none !important;
			border-radius: 0 !important;
			box-sizing: border-box;
			justify-self: end;
			max-width: 100%;
			padding: 0 !important;
			position: sticky;
			top: 8px;
			width: 248px;
		}
		.imogi-receipt-preview-head {
			color: #6b7280 !important;
			font-size: 10px !important;
			font-weight: 800 !important;
			letter-spacing: 0.08em !important;
			margin-bottom: 10px !important;
			text-transform: uppercase !important;
		}
		.imogi-settings-dock-grid {
			display: grid;
			gap: 16px;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			margin-top: 16px;
			width: 100%;
		}
		.imogi-shift-form-grid--horizontal,
		.imogi-kitchen-form-grid--horizontal {
			display: flex;
			flex-direction: column;
			gap: 12px;
			width: 100%;
		}
		.imogi-shift-form-grid--horizontal .imogi-shift-field .form-group,
		.imogi-kitchen-form-grid--horizontal .imogi-kitchen-field .form-group {
			align-items: center;
			display: grid;
			gap: 8px 16px;
			grid-template-columns: minmax(140px, 34%) minmax(0, 1fr);
			margin-bottom: 0;
		}
		.imogi-shift-form-grid--horizontal .imogi-shift-field[data-fieldtype="Check"] .form-group,
		.imogi-kitchen-form-grid--horizontal .imogi-kitchen-field[data-fieldtype="Check"] .form-group {
			align-items: start;
		}
		.imogi-settings-page .imogi-shift-form-grid--horizontal .frappe-control .control-label,
		.imogi-settings-page .imogi-kitchen-form-grid--horizontal .frappe-control .control-label {
			color: #374151;
			float: none !important;
			font-size: 13px !important;
			font-weight: 600;
			margin: 0 !important;
			padding: 0 !important;
			text-align: left;
			width: auto !important;
		}
		.imogi-shift-form-grid--horizontal .frappe-control .help-box,
		.imogi-kitchen-form-grid--horizontal .frappe-control .help-box,
		.imogi-shift-form-grid--horizontal .frappe-control .small.text-muted,
		.imogi-kitchen-form-grid--horizontal .frappe-control .small.text-muted {
			grid-column: 2;
			margin: 4px 0 0 !important;
		}
		.imogi-kitchen-list-cards-wrap {
			display: flex;
			flex-direction: column;
			gap: 14px;
			grid-column: 1 / -1;
			margin-top: 4px;
			width: 100%;
		}
		.imogi-kitchen-list-section-label {
			color: #374151;
			font-size: 12px;
			font-weight: 700;
			margin-bottom: 8px;
		}
		.imogi-kitchen-list-cards {
			display: flex;
			flex-direction: column;
			gap: 6px;
			margin-bottom: 6px;
		}
		.imogi-kitchen-list-card {
			align-items: end;
			background: #f9fafb;
			border: 1px solid #e5e7eb;
			border-radius: 4px;
			display: grid;
			gap: 8px;
			grid-template-columns: minmax(0, 1fr) 32px;
			padding: 8px 10px;
		}
		.imogi-kitchen-list-card-col label {
			color: #6b7280;
			display: block;
			font-size: 10px;
			font-weight: 600;
			line-height: 1.2;
			margin-bottom: 4px;
		}
		.imogi-kitchen-list-card-input-host .frappe-control,
		.imogi-kitchen-list-card-input-host .form-group {
			margin-bottom: 0 !important;
		}
		.imogi-kitchen-list-card-input-host .control-label {
			display: none !important;
		}
		.imogi-kitchen-list-card-input-host input.form-control,
		.imogi-kitchen-list-card-input-host select.form-control {
			min-height: 32px;
		}
		.imogi-kitchen-list-card-remove {
			align-items: center;
			align-self: end;
			background: #fff;
			border: 1px solid #d1d5db;
			border-radius: 4px;
			color: #6b7280;
			cursor: pointer;
			display: inline-flex;
			height: 32px;
			justify-content: center;
			width: 32px;
		}
		.imogi-kitchen-list-card-remove:hover {
			border-color: #dc2626;
			color: #dc2626;
		}
		.imogi-kitchen-list-section {
			position: relative;
			z-index: 2;
		}
		.imogi-kitchen-list-add {
			align-items: center;
			background: #fff;
			border: 1px dashed #cbd5e1;
			border-radius: 4px;
			color: #0f1f35;
			cursor: pointer;
			display: inline-flex;
			font-size: 11px;
			font-weight: 600;
			gap: 5px;
			padding: 6px 10px;
			position: relative;
			z-index: 3;
		}
		.imogi-kitchen-list-add:hover {
			background: #f9fafb;
			border-color: #0f1f35;
		}
		.imogi-kitchen-list-empty {
			color: #6b7280;
			font-size: 11px;
			line-height: 1.4;
			padding: 2px 0;
		}
		.imogi-kitchen-native-table-hidden .grid-field,
		.imogi-kitchen-native-table-hidden .form-grid,
		.imogi-kitchen-native-table-hidden .grid-buttons,
		.imogi-kitchen-native-table-hidden .grid-add-row {
			display: none !important;
		}
		.imogi-dock-check-row {
			align-items: center;
			display: flex !important;
			flex-wrap: wrap;
			gap: 10px 28px;
			grid-column: 1 / -1;
			width: 100%;
		}
		.imogi-dock-check-row > .frappe-control {
			flex: 0 0 auto;
			grid-column: auto !important;
			margin-bottom: 0 !important;
			max-width: none !important;
			min-width: 0;
			width: auto !important;
		}
		.imogi-dock-check-row .frappe-control[data-fieldtype="Check"] .form-group {
			align-items: center;
			display: inline-flex;
			flex-wrap: nowrap;
			gap: 8px;
			margin-bottom: 0;
			width: auto;
		}
		.imogi-dock-check-row .frappe-control[data-fieldtype="Check"] .clearfix {
			flex: 0 0 auto;
		}
		.imogi-dock-check-row .frappe-control[data-fieldtype="Check"] .control-input-wrapper,
		.imogi-dock-check-row .frappe-control[data-fieldtype="Check"] .checkbox {
			flex: 0 0 auto;
			margin: 0;
		}
		.imogi-settings-field-grid .imogi-dock-check-row > .frappe-control[data-fieldtype="Check"] {
			grid-column: auto !important;
			max-width: none !important;
			width: auto !important;
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
			background: transparent !important;
			border: none !important;
			border-radius: 0 !important;
			box-sizing: border-box;
			padding: 0 !important;
			width: 100%;
		}
		.imogi-receipt-preview-paper {
			background: #fff !important;
			border: 1px solid #e5e7eb !important;
			border-radius: 6px !important;
			box-shadow: none !important;
			box-sizing: border-box;
			width: 100%;
		}
		.imogi-receipt-preview-body {
			margin: 0 auto;
			max-width: 100%;
			width: 100%;
		}
		.imogi-rcpt-logo-wrap {
			margin-bottom: 8px;
			text-align: center;
		}
		.imogi-rcpt-logo {
			display: block;
			height: auto;
			margin: 0 auto;
			max-height: 52px;
			max-width: 100%;
			object-fit: contain;
			width: auto;
		}
		.imogi-rcpt-item span:first-child,
		.imogi-rcpt-total span:first-child {
			min-width: 0;
			overflow: hidden;
			padding-right: 8px;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.imogi-rcpt-item span:last-child,
		.imogi-rcpt-total span:last-child {
			flex-shrink: 0;
			font-variant-numeric: tabular-nums;
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
		.imogi-settings-page .imogi-pill.is-orange,
		.imogi-settings-page .imogi-pill.is-blue {
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
		.imogi-role-auth-matrix {
			background: #fff;
			border: 1px solid #e5e7eb;
			border-radius: 6px;
			margin: 8px 0 14px;
			padding: 10px 12px;
		}
		.imogi-role-auth-hint {
			color: #6b7280;
			font-size: 12px;
			margin-bottom: 10px;
		}
		.imogi-role-auth-scroll {
			overflow-x: auto;
		}
		.imogi-role-auth-table {
			border-collapse: collapse;
			min-width: 100%;
			width: max-content;
		}
		.imogi-role-auth-table th,
		.imogi-role-auth-table td {
			border-bottom: 1px solid #f3f4f6;
			padding: 8px 10px;
			vertical-align: middle;
		}
		.imogi-role-auth-table thead th {
			background: #f9fafb;
			color: #374151;
			font-size: 11px;
			font-weight: 700;
			text-transform: uppercase;
		}
		.imogi-role-auth-label {
			min-width: 220px;
		}
		.imogi-role-auth-title {
			color: #111827;
			font-size: 13px;
			font-weight: 700;
		}
		.imogi-role-auth-desc {
			color: #6b7280;
			font-size: 11px;
			margin-top: 2px;
		}
		.imogi-role-auth-cell {
			text-align: center;
			width: 88px;
		}
		.imogi-role-auth-cell.is-na {
			color: #d1d5db;
		}
		.imogi-role-auth-check {
			align-items: center;
			cursor: pointer;
			display: inline-flex;
			justify-content: center;
			margin: 0;
		}
		.imogi-role-auth-check input {
			height: 16px;
			width: 16px;
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
			background: #fff;
			border: 1px solid #e5e7eb;
			border-radius: 10px;
			margin: 0;
			padding: 18px 20px 20px;
		}
		.imogi-shift-form-grid,
		.imogi-kitchen-form-grid {
			display: grid;
			gap: 12px;
			grid-template-columns: 1fr;
			margin-top: 0;
			width: 100%;
		}
		.imogi-shift-quick-links,
		.imogi-kitchen-quick-links {
			display: none !important;
		}
		.imogi-shift-status,
		.imogi-kitchen-status {
			align-items: center;
			background: #f7f7f7;
			border: 1px solid #e5e7eb;
			border-radius: 8px;
			color: #374151;
			display: flex;
			font-size: 12px;
			font-weight: 500;
			gap: 8px;
			line-height: 1.5;
			margin-bottom: 14px;
			margin-top: 0;
			padding: 10px 12px;
		}
		.imogi-shift-status i,
		.imogi-kitchen-status i { color: #111827; }
		.imogi-shift-status.is-off,
		.imogi-kitchen-status.is-off { color: #6b7280; }
		@media (max-width: 860px) {
			.imogi-settings-page .imogi-settings-field-grid .form-column.col-sm-12 > form,
			.imogi-settings-page .imogi-store-form-grid,
			.imogi-settings-page .imogi-shift-form-grid,
			.imogi-settings-page .imogi-kitchen-form-grid {
				grid-template-columns: 1fr;
			}
			.imogi-dock-check-row {
				flex-direction: column;
				align-items: flex-start;
				gap: 10px;
			}
			.imogi-settings-dock-grid {
				grid-template-columns: 1fr;
			}
			.imogi-store-trust-row {
				grid-template-columns: 1fr;
			}
			.imogi-settings-tab-panel--general .imogi-store-identity-layout,
			.imogi-settings-tab-panel--inventory .imogi-import-dock {
				grid-template-columns: 1fr;
			}
			.imogi-settings-tab-panel--general .imogi-receipt-preview-wrap {
				justify-self: center;
				position: static;
				width: min(100%, 248px);
			}
			.imogi-settings-tab-panel--general .imogi-settings-flow-strip { grid-template-columns: 1fr; }
			.imogi-settings-flow-actions { justify-content: flex-start; }
		}
		@media (max-width: 900px) {
			.imogi-settings-workspace { --imogi-settings-gutter: 14px; }
			.imogi-settings-tab-intro { padding: 10px 0 8px; }
		}
		.imogi-settings-page .frappe-control[data-fieldname="mode_summary"],
		.imogi-settings-page .form-section[data-fieldname="setup_section"],
		.imogi-settings-page .imogi-settings-flow-strip,
		.imogi-settings-page .imogi-mode-summary-host,
		.imogi-settings-page .imogi-settings-target-host {
			display: none !important;
		}
		.imogi-settings-page[data-active-tab="general"] .imogi-settings-tab-intro,
		.imogi-settings-page[data-active-tab="transactions"] .imogi-settings-tab-intro {
			display: none !important;
		}
		/* Identitas Toko + Session Kasir: label & isian field 13px */
		.imogi-settings-page .imogi-store-identity-card .control-label,
		.imogi-settings-page .imogi-shift-settings-dock .control-label,
		.imogi-settings-page .imogi-kitchen-settings-dock .control-label,
		.imogi-settings-page .imogi-store-identity-card .checkbox label,
		.imogi-settings-page .imogi-shift-settings-dock .checkbox label,
		.imogi-settings-page .imogi-kitchen-settings-dock .checkbox label {
			color: #374151 !important;
			font-size: 13px !important;
			font-weight: 600 !important;
		}
		.imogi-settings-page .imogi-store-identity-card .form-control,
		.imogi-settings-page .imogi-store-identity-card .control-value,
		.imogi-settings-page .imogi-shift-settings-dock .form-control,
		.imogi-settings-page .imogi-shift-settings-dock .control-value,
		.imogi-settings-page .imogi-kitchen-settings-dock .form-control,
		.imogi-settings-page .imogi-kitchen-settings-dock .control-value {
			font-size: 13px !important;
		}
		/* Tab Transaksi & Pembayaran: field compact, label kiri & input kanan (mirip tab Dasar) */
		:is(.imogi-settings-tab-panel--transactions, .imogi-settings-tab-panel--payment, .imogi-settings-tab-panel--inventory, .imogi-settings-tab-panel--more, .imogi-settings-tab-panel--receipt, .imogi-settings-tab-panel--integrations) .frappe-control:not([data-fieldtype="Check"]):not([data-fieldtype="Section Break"]):not([data-fieldtype="Column Break"]):not([data-fieldtype="HTML"]) .form-group {
			align-items: center;
			display: grid;
			gap: 6px 16px;
			grid-template-columns: 170px minmax(0, 1fr);
			margin-bottom: 0;
		}
		:is(.imogi-settings-tab-panel--transactions, .imogi-settings-tab-panel--payment, .imogi-settings-tab-panel--inventory, .imogi-settings-tab-panel--more, .imogi-settings-tab-panel--receipt, .imogi-settings-tab-panel--integrations) .frappe-control:not([data-fieldtype="Check"]) .form-group > .clearfix {
			margin: 0 !important;
			padding: 0 !important;
		}
		:is(.imogi-settings-tab-panel--transactions, .imogi-settings-tab-panel--payment, .imogi-settings-tab-panel--inventory, .imogi-settings-tab-panel--more, .imogi-settings-tab-panel--receipt, .imogi-settings-tab-panel--integrations) .frappe-control:not([data-fieldtype="Check"]) .control-label {
			color: #374151;
			float: none !important;
			font-size: 13px !important;
			font-weight: 600;
			line-height: 1.3;
			margin: 0 !important;
			padding: 0 !important;
			text-align: left;
			width: auto !important;
		}
		:is(.imogi-settings-tab-panel--transactions, .imogi-settings-tab-panel--payment, .imogi-settings-tab-panel--inventory, .imogi-settings-tab-panel--more, .imogi-settings-tab-panel--receipt, .imogi-settings-tab-panel--integrations) .frappe-control:not([data-fieldtype="Check"]) .control-input-wrapper {
			min-width: 0;
			width: 100%;
		}
		:is(.imogi-settings-tab-panel--transactions, .imogi-settings-tab-panel--payment, .imogi-settings-tab-panel--inventory, .imogi-settings-tab-panel--more, .imogi-settings-tab-panel--receipt, .imogi-settings-tab-panel--integrations) .frappe-control:not([data-fieldtype="Check"]) .form-control,
		:is(.imogi-settings-tab-panel--transactions, .imogi-settings-tab-panel--payment, .imogi-settings-tab-panel--inventory, .imogi-settings-tab-panel--more, .imogi-settings-tab-panel--receipt, .imogi-settings-tab-panel--integrations) .frappe-control:not([data-fieldtype="Check"]) .control-value {
			font-size: 13px !important;
			min-height: 32px;
			padding: 4px 10px;
		}
		:is(.imogi-settings-tab-panel--transactions, .imogi-settings-tab-panel--payment, .imogi-settings-tab-panel--inventory, .imogi-settings-tab-panel--more, .imogi-settings-tab-panel--receipt, .imogi-settings-tab-panel--integrations) .frappe-control .help-box,
		:is(.imogi-settings-tab-panel--transactions, .imogi-settings-tab-panel--payment, .imogi-settings-tab-panel--inventory, .imogi-settings-tab-panel--more, .imogi-settings-tab-panel--receipt, .imogi-settings-tab-panel--integrations) .frappe-control .small.text-muted {
			font-size: 11px;
			margin: 3px 0 0 !important;
		}
		/* Tab Printer & Struk: dock WhatsApp jadi 1 kolom, label kiri seperti tab lain */
		.imogi-settings-tab-panel--receipt .imogi-receipt-form-grid--horizontal {
			display: block !important;
			grid-template-columns: none !important;
		}
		.imogi-settings-tab-panel--receipt .imogi-receipt-dock-head {
			font-size: 13px !important;
		}
		/* Tab Integrasi: sembunyikan intro dock (header redundan dgn judul section) */
		.imogi-settings-tab-panel--integrations .imogi-api-dock-intro {
			display: none !important;
		}
		.imogi-settings-tab-panel--integrations :is(.imogi-api-dock, .imogi-integrations-dock, .imogi-billing-dock) {
			background: transparent !important;
			border: none !important;
			border-radius: 0 !important;
			box-shadow: none !important;
			padding: 0 !important;
		}
		/* Tab Lainnya: ratakan intro dock & card-in-card */
		.imogi-settings-tab-panel--more .imogi-api-dock-intro {
			display: none !important;
		}
		.imogi-settings-tab-panel--more .imogi-status-card {
			background: transparent !important;
			border: none !important;
			border-radius: 0 !important;
			box-shadow: none !important;
			padding: 0 !important;
		}
		.imogi-settings-tab-panel--more .imogi-status-card-body {
			padding: 0 !important;
		}
		.imogi-settings-tab-panel--more .imogi-franchise-panel {
			background: transparent !important;
			border: none !important;
			border-radius: 0 !important;
			padding: 0 !important;
		}
		/* Role Notifikasi Stok: list kartu gaya Kitchen, 1 kolom (di kanan Interval) */
		.imogi-settings-tab-panel--inventory .imogi-role-list-control {
			grid-column: auto !important;
		}
		.imogi-role-list-control .form-group {
			display: block !important;
		}
		.imogi-role-list-control .imogi-kitchen-list-cards-wrap {
			grid-column: auto !important;
		}
		.imogi-role-list-control .control-label {
			display: block !important;
			margin-bottom: 6px !important;
			padding-top: 0 !important;
			width: auto !important;
		}
		.imogi-role-list-control .control-input-wrapper {
			width: 100% !important;
		}
		.imogi-role-list-host {
			margin-top: 0 !important;
		}
		/* Sembunyikan textarea native (tetap ada untuk simpan nilai), hanya list kartu yang tampil */
		.imogi-role-list-control .control-input-wrapper > .control-input {
			display: none !important;
		}
		/* Field textarea (Small Text/Text): compact 2 baris, label rata atas */
		:is(.imogi-settings-tab-panel--transactions, .imogi-settings-tab-panel--payment, .imogi-settings-tab-panel--inventory, .imogi-settings-tab-panel--more, .imogi-settings-tab-panel--receipt, .imogi-settings-tab-panel--integrations) .frappe-control:is([data-fieldtype="Small Text"], [data-fieldtype="Text"], [data-fieldtype="Code"], [data-fieldtype="Long Text"]) .form-group {
			align-items: start;
		}
		:is(.imogi-settings-tab-panel--transactions, .imogi-settings-tab-panel--payment, .imogi-settings-tab-panel--inventory, .imogi-settings-tab-panel--more, .imogi-settings-tab-panel--receipt, .imogi-settings-tab-panel--integrations) .frappe-control:is([data-fieldtype="Small Text"], [data-fieldtype="Text"], [data-fieldtype="Code"], [data-fieldtype="Long Text"]) .control-label {
			padding-top: 7px !important;
		}
		:is(.imogi-settings-tab-panel--transactions, .imogi-settings-tab-panel--payment, .imogi-settings-tab-panel--inventory, .imogi-settings-tab-panel--more, .imogi-settings-tab-panel--receipt, .imogi-settings-tab-panel--integrations) .frappe-control textarea.form-control {
			height: 56px !important;
			line-height: 1.4;
			min-height: 56px !important;
			padding: 6px 10px !important;
			resize: vertical;
		}
		/* Tab Transaksi & Pembayaran: hilangkan card luar (section-body) agar tidak card-dalam-card */
		:is(.imogi-settings-tab-panel--transactions, .imogi-settings-tab-panel--payment, .imogi-settings-tab-panel--inventory, .imogi-settings-tab-panel--more, .imogi-settings-tab-panel--receipt, .imogi-settings-tab-panel--integrations) .imogi-settings-flat-section .section-body {
			background: transparent !important;
			border: none !important;
			border-radius: 0 !important;
			margin-bottom: 0 !important;
			padding: 0 !important;
		}
		/* Ringkasan status: badge 1 baris tanpa card */
		:is(.imogi-settings-tab-panel--transactions, .imogi-settings-tab-panel--payment, .imogi-settings-tab-panel--inventory, .imogi-settings-tab-panel--more, .imogi-settings-tab-panel--receipt, .imogi-settings-tab-panel--integrations) :is(.imogi-loyalty-dock, .imogi-payment-dock, .imogi-transfer-dock) {
			margin-bottom: 8px;
		}
		:is(.imogi-settings-tab-panel--transactions, .imogi-settings-tab-panel--payment, .imogi-settings-tab-panel--inventory, .imogi-settings-tab-panel--more, .imogi-settings-tab-panel--receipt, .imogi-settings-tab-panel--integrations) :is(.imogi-loyalty-panel, .imogi-payment-panel, .imogi-transfer-panel) {
			background: transparent !important;
			border: none !important;
			border-radius: 0 !important;
			padding: 0 !important;
		}
		/* Sembunyikan header intro card (ikon + judul + sub) di dock pembayaran/transfer */
		.imogi-settings-tab-panel--payment :is(.imogi-payment-dock, .imogi-transfer-dock) .imogi-api-dock-intro {
			display: none !important;
		}
		/* Status-card di dalam panel pembayaran/transfer dibuat flat */
		.imogi-settings-tab-panel--payment :is(.imogi-payment-panel, .imogi-transfer-panel) .imogi-status-card {
			background: transparent !important;
			border: none !important;
			border-radius: 0 !important;
			box-shadow: none !important;
			padding: 0 !important;
		}
		.imogi-settings-tab-panel--payment :is(.imogi-payment-panel, .imogi-transfer-panel) .imogi-status-card-body {
			padding: 0 !important;
		}
		:is(.imogi-loyalty-panel, .imogi-payment-panel, .imogi-transfer-panel) .imogi-mini-stats--row,
		.imogi-mini-stats--row {
			align-items: center !important;
			display: flex !important;
			flex-wrap: nowrap !important;
			gap: 6px 8px !important;
			max-width: 100%;
			overflow-x: auto;
			white-space: nowrap !important;
		}
		:is(.imogi-loyalty-panel, .imogi-payment-panel, .imogi-transfer-panel) .imogi-mini-stats--row .imogi-pill,
		.imogi-mini-stats--row .imogi-pill {
			flex: 0 0 auto !important;
			white-space: nowrap !important;
		}
		/* Spacing lebih rapat antar field */
		:is(.imogi-settings-tab-panel--transactions, .imogi-settings-tab-panel--payment, .imogi-settings-tab-panel--inventory, .imogi-settings-tab-panel--more, .imogi-settings-tab-panel--receipt, .imogi-settings-tab-panel--integrations) .section-body > .row { row-gap: 4px; }
		:is(.imogi-settings-tab-panel--transactions, .imogi-settings-tab-panel--payment, .imogi-settings-tab-panel--inventory, .imogi-settings-tab-panel--more, .imogi-settings-tab-panel--receipt, .imogi-settings-tab-panel--integrations) .frappe-control { margin-bottom: 4px !important; }
		:is(.imogi-settings-tab-panel--transactions, .imogi-settings-tab-panel--payment, .imogi-settings-tab-panel--inventory, .imogi-settings-tab-panel--more, .imogi-settings-tab-panel--receipt, .imogi-settings-tab-panel--integrations) .frappe-control[data-fieldtype="Check"] { margin: 2px 0 !important; }
		:is(.imogi-settings-tab-panel--transactions, .imogi-settings-tab-panel--payment, .imogi-settings-tab-panel--inventory, .imogi-settings-tab-panel--more, .imogi-settings-tab-panel--receipt, .imogi-settings-tab-panel--integrations) .imogi-settings-flat-section { margin-bottom: 12px; }
		.imogi-settings-page .frappe-control.imogi-field-disabled {
			opacity: 0.55;
			pointer-events: none;
		}
		.imogi-settings-page .frappe-control.imogi-field-disabled .control-label {
			color: #9ca3af !important;
		}
		body.imogi-pos-settings-active .form-footer,
		body.imogi-pos-settings-active .after-save,
		body.imogi-pos-settings-active .comment-box,
		body.imogi-pos-settings-active .form-timeline,
		body.imogi-pos-settings-active .new-timeline,
		body.imogi-pos-settings-active .timeline { display: none !important; }
	`, "imogi-settings-inline-css-v82");
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

function hide_deferred_operational_settings(frm) {
	SETTINGS_DEFERRED_OPERATIONAL_FIELDS.forEach((fieldname) => {
		if (frm.fields_dict[fieldname]) {
			frm.toggle_display(fieldname, false);
		}
	});
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

function role_auth_row_key(role, grant_id) {
	return `${role}::${grant_id}`;
}

function upsert_role_auth_row(frm, role, grant_id, enabled) {
	const rows = frm.doc.role_authorizations || [];
	let row = rows.find((r) => r.frappe_role === role && r.grant_id === grant_id);
	if (!row) {
		row = frm.add_child("role_authorizations");
		row.frappe_role = role;
		row.grant_id = grant_id;
	}
	row.enabled = enabled ? 1 : 0;
}

function render_role_authorization_matrix(frm) {
	const field = frm.fields_dict?.role_authorization_matrix;
	if (!field) return;

	frm.toggle_display("role_authorizations", false);
	const enabled = cint(frm.doc.enable_role_authorization);
	frm.toggle_display("role_authorization_matrix", enabled);
	if (!enabled) {
		field.$wrapper.empty();
		return;
	}

	const $host = field.$wrapper;
	$host.html(`<div class="imogi-role-auth-matrix is-loading"><i class="fa fa-spinner fa-spin"></i> ${__("Memuat otorisasi...")}</div>`);

	frappe.call({
		method: "imogi_pos.api.feature_api.get_role_authorization_matrix",
		callback(r) {
			const data = r.message || {};
			const grants = data.grants || [];
			if (!grants.length) {
				$host.html(`<div class="text-muted">${__("Belum ada otorisasi yang bisa dikonfigurasi.")}</div>`);
				return;
			}

			const role_set = new Set();
			grants.forEach((grant) => {
				(grant.roles || []).forEach((entry) => role_set.add(entry.role));
			});
			const roles = Array.from(role_set);

			const state = {};
			(frm.doc.role_authorizations || []).forEach((row) => {
				state[role_auth_row_key(row.frappe_role, row.grant_id)] = cint(row.enabled);
			});
			grants.forEach((grant) => {
				(grant.roles || []).forEach((entry) => {
					const key = role_auth_row_key(entry.role, grant.id);
					if (state[key] === undefined) {
						state[key] = entry.enabled ? 1 : 0;
					}
				});
			});

			const role_headers = roles
				.map((role) => `<th class="imogi-role-auth-role" title="${frappe.utils.escape_html(role)}">${frappe.utils.escape_html(role.replace(/^IMOGI /, ""))}</th>`)
				.join("");

			const body_rows = grants
				.map((grant) => {
					const cells = roles
						.map((role) => {
							const eligible = (grant.roles || []).some((entry) => entry.role === role);
							if (!eligible) {
								return `<td class="imogi-role-auth-cell is-na">—</td>`;
							}
							const key = role_auth_row_key(role, grant.id);
							const checked = state[key] ? "checked" : "";
							return `<td class="imogi-role-auth-cell"><label class="imogi-role-auth-check"><input type="checkbox" data-role="${frappe.utils.escape_html(role)}" data-grant="${frappe.utils.escape_html(grant.id)}" ${checked}><span></span></label></td>`;
						})
						.join("");
					return `<tr>
						<td class="imogi-role-auth-label">
							<div class="imogi-role-auth-title">${frappe.utils.escape_html(grant.label)}</div>
							<div class="imogi-role-auth-desc">${frappe.utils.escape_html(grant.description || "")}</div>
						</td>
						${cells}
					</tr>`;
				})
				.join("");

			$host.html(`
				<div class="imogi-role-auth-matrix">
					<div class="imogi-role-auth-hint">${__("Centang untuk mengizinkan role membuka menu / DocType terkait. Simpan pengaturan agar permission diterapkan.")}</div>
					<div class="imogi-role-auth-scroll">
						<table class="imogi-role-auth-table">
							<thead><tr><th>${__("Menu / Fitur")}</th>${role_headers}</tr></thead>
							<tbody>${body_rows}</tbody>
						</table>
					</div>
				</div>
			`);

			$host.find("input[type=checkbox]").on("change", function on_role_auth_toggle() {
				const role = this.getAttribute("data-role");
				const grant_id = this.getAttribute("data-grant");
				upsert_role_auth_row(frm, role, grant_id, this.checked);
				frm.dirty();
			});
		},
	});
}

function page_auth_row_key(role, page_id) {
	return `${role}::${page_id}`;
}

function upsert_page_auth_row(frm, role, page_id, enabled) {
	const rows = frm.doc.page_authorizations || [];
	let row = rows.find((r) => r.frappe_role === role && r.page_id === page_id);
	if (!row) {
		row = frm.add_child("page_authorizations");
		row.frappe_role = role;
		row.page_id = page_id;
	}
	row.enabled = enabled ? 1 : 0;
}

function render_page_authorization_matrix(frm) {
	const field = frm.fields_dict?.page_authorization_matrix;
	if (!field) return;

	frm.toggle_display("page_authorizations", false);
	const enabled = cint(frm.doc.enable_page_authorization);
	frm.toggle_display("page_authorization_matrix", enabled);
	if (!enabled) {
		field.$wrapper.empty();
		return;
	}

	const $host = field.$wrapper;
	$host.html(`<div class="imogi-role-auth-matrix is-loading"><i class="fa fa-spinner fa-spin"></i> ${__("Memuat otorisasi halaman...")}</div>`);

	frappe.call({
		method: "imogi_pos.api.feature_api.get_page_authorization_matrix",
		callback(r) {
			const data = r.message || {};
			const pages = data.pages || [];
			if (!pages.length) {
				$host.html(`<div class="text-muted">${__("Belum ada halaman yang bisa dikonfigurasi.")}</div>`);
				return;
			}

			const role_set = new Set();
			pages.forEach((page) => {
				(page.roles || []).forEach((entry) => role_set.add(entry.role));
			});
			const roles = Array.from(role_set);

			const state = {};
			pages.forEach((page) => {
				(page.roles || []).forEach((entry) => {
					state[page_auth_row_key(entry.role, page.id)] = entry.enabled ? 1 : 0;
				});
			});
			(frm.doc.page_authorizations || []).forEach((row) => {
				state[page_auth_row_key(row.frappe_role, row.page_id)] = cint(row.enabled);
			});

			const role_headers = roles
				.map((role) => `<th class="imogi-role-auth-role" title="${frappe.utils.escape_html(role)}">${frappe.utils.escape_html(role.replace(/^IMOGI /, ""))}</th>`)
				.join("");

			const body_rows = pages
				.map((page) => {
					const cells = roles
						.map((role) => {
							const eligible = (page.roles || []).some((entry) => entry.role === role);
							if (!eligible) {
								return `<td class="imogi-role-auth-cell is-na">—</td>`;
							}
							const key = page_auth_row_key(role, page.id);
							const checked = state[key] ? "checked" : "";
							return `<td class="imogi-role-auth-cell"><label class="imogi-role-auth-check"><input type="checkbox" data-role="${frappe.utils.escape_html(role)}" data-page="${frappe.utils.escape_html(page.id)}" ${checked}><span></span></label></td>`;
						})
						.join("");
					return `<tr>
						<td class="imogi-role-auth-label">
							<div class="imogi-role-auth-title">${frappe.utils.escape_html(page.label)}</div>
							<div class="imogi-role-auth-desc">${frappe.utils.escape_html(page.description || "")}</div>
						</td>
						${cells}
					</tr>`;
				})
				.join("");

			$host.html(`
				<div class="imogi-role-auth-matrix">
					<div class="imogi-role-auth-hint">${__("Centang untuk mengizinkan role membuka halaman terkait. User single-purpose (mis. Kitchen) hanya bisa membuka halaman yang dicentang. Simpan pengaturan agar berlaku.")}</div>
					<div class="imogi-role-auth-scroll">
						<table class="imogi-role-auth-table">
							<thead><tr><th>${__("Halaman / Menu")}</th>${role_headers}</tr></thead>
							<tbody>${body_rows}</tbody>
						</table>
					</div>
				</div>
			`);

			$host.find("input[type=checkbox]").on("change", function on_page_auth_toggle() {
				const role = this.getAttribute("data-role");
				const page_id = this.getAttribute("data-page");
				upsert_page_auth_row(frm, role, page_id, this.checked);
				frm.dirty();
			});
		},
	});
}

function init_settings_page(frm) {
	frm.$wrapper.addClass("imogi-settings-page");
	hide_settings_form_sidebar(frm);
	hide_settings_form_footer(frm);
	["generate_order_api_key", "order_api_key", "order_api_secret", "order_api_info", "business_type", "business_template"].forEach(
		(f) => frm.toggle_display(f, false)
	);
	hide_marketplace_integration_ui(frm);
	hide_deferred_operational_settings(frm);
	hide_settings_general_extras(frm);
	render_mode_summary(frm);
	toggle_settings_by_business_type(frm);
	build_settings_tabs(frm);
	guard_billing_date_fields(frm);
	build_api_dock(frm);
	build_loyalty_dock(frm);
	build_payment_dock(frm);
	build_receipt_whatsapp_dock(frm);
	build_transfer_dock(frm);
	build_integrations_dock(frm);
	build_franchise_dock(frm);
	build_import_dock(frm);
	apply_inventory_placeholders(frm);
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
	render_role_authorization_matrix(frm);
	render_page_authorization_matrix(frm);
	bind_dock_checkbox_handlers_once(frm);
	bind_kitchen_dock_list_actions_once(frm);
	hook_settings_form_save(frm);
	frappe.after_ajax(() => render_receipt_whatsapp_dock_summary(frm));
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
				if (normalize_settings_tab_id(__imogi_settings_active_tab) === "general") {
					layout_shift_settings(frm);
					layout_kitchen_settings(frm);
					layout_general_dock_grid(frm);
				}
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

function hide_settings_form_footer(frm) {
	// Footer (Comments + Activity timeline) is appended as a sibling of frm.$wrapper,
	// so CSS scoped to .imogi-settings-page can't reach it. Mark <body> + hide directly.
	if (!window.__imogi_settings_footer_hook) {
		window.__imogi_settings_footer_hook = true;
		const sync = () => {
			const route = (frappe.get_route && frappe.get_route()) || [];
			const on_settings = route[0] === "Form" && route[1] === "IMOGI POS Settings";
			document.body.classList.toggle("imogi-pos-settings-active", on_settings);
			if (on_settings) $(".form-footer").hide();
		};
		frappe.router.on("change", sync);
	}
	document.body.classList.add("imogi-pos-settings-active");
	const hide = () => {
		frm.footer?.wrapper?.hide();
		$(frm.page?.main).parent().find(".form-footer").hide();
		$(".form-footer").hide();
	};
	hide();
	setTimeout(hide, 300);
	setTimeout(hide, 800);
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

// Detaching/reattaching .form-layout in build_settings_tabs (for the custom tab
// shell) confuses the Date/Datetime picker widget on billing_period_end and
// billing_last_synced: it can emit a stray "Invalid date" through a native
// change event, which frappe's DateControl.validate() then msgprints. Both
// fields stay empty/hidden while billing sync is off, so it's safe to swallow
// exactly that sentinel value instead of letting it reach the user.
function guard_billing_date_fields(frm) {
	["billing_period_end", "billing_last_synced"].forEach((fieldname) => {
		const field = frm.fields_dict[fieldname];
		if (!field || field._imogi_invalid_date_guard) return;
		field._imogi_invalid_date_guard = true;
		const orig_validate = field.validate.bind(field);
		field.validate = function (value) {
			if (value === "Invalid date" || value === "Invalid Date") return "";
			return orig_validate(value);
		};
	});
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

function hide_settings_general_extras(frm) {
	frm.toggle_display("mode_summary", false);
	const field = frm.fields_dict?.mode_summary;
	field?.$wrapper?.closest(".frappe-control").hide();
	frm.$wrapper
		.find('.form-section[data-fieldname="setup_section"]')
		.hide();
	frm.$wrapper.find(".imogi-mode-summary-host, .imogi-settings-flow-strip, .imogi-settings-target-host").hide();
}

function render_settings_tab_intro(frm, tab) {
	if (
		!tab ||
		tab.id === "general" ||
		tab.id === "transactions" ||
		tab.id === "payment" ||
		tab.id === "inventory" ||
		tab.id === "more" ||
		tab.id === "receipt" ||
		tab.id === "integrations"
	) {
		frm.$wrapper.find(".imogi-settings-tab-intro").empty().hide();
		return;
	}
	const $intro = frm.$wrapper.find(".imogi-settings-tab-intro");
	$intro.show();
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
	$grid.empty();
	if ($shift.length) $grid.append($shift);
	if ($kitchen.length) $grid.append($kitchen);
	cleanup_store_identity_section_form(frm);
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
		.hide();

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
		render_role_authorization_matrix(frm);
		render_page_authorization_matrix(frm);
		render_franchise_dock_summary(frm);
	}
	if (tabId === "general") {
		render_billing_dock_summary(frm);
	}
	if (tabId === "inventory") {
		build_import_dock(frm);
	}
	frm.$wrapper.find(".imogi-settings-target-host").hide();
	frm.$wrapper.find(".imogi-settings-placeholder").remove();
	toggle_general_tab_sections(frm, tabId);
	if (tabId === "general") {
		layout_store_identity(frm);
		layout_shift_settings(frm);
		layout_kitchen_settings(frm);
		layout_general_dock_grid(frm);
		render_receipt_preview(frm);
		hide_settings_general_extras(frm);
		render_settings_tab_intro(frm, SETTINGS_TABS.find((t) => t.id === "general"));
	}
	if (tabId === "receipt") {
		render_receipt_whatsapp_dock_summary(frm);
	}
	// Pastikan semua field yang dependen ke checkbox tetap tampil (disabled),
	// tidak hilang, di tab mana pun.
	schedule_settings_field_state(frm, apply_settings_field_states);
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
		whatsapp_qr_templates_section: { icon: "fa-whatsapp", title: __("Template WhatsApp — QR Meja") },
		import_section: { icon: "fa-upload", title: __("Import Data Menu") },
		analytics_section: { icon: "fa-line-chart", title: __("Pengaturan Dashboard") },
		flow_section: { icon: "fa-cutlery", title: __("Kitchen & Fulfillment") },
		loyalty_section: { icon: "fa-star", title: __("Loyalty & Poin Member") },
		stamp_section: { icon: "fa-ticket", title: __("Stamp Card") },
		promo_section: { icon: "fa-tags", title: __("Promo Otomatis") },
		birthday_section: { icon: "fa-gift", title: __("Promo Ulang Tahun") },
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

		if (fieldname === "store_identity_section") {
			ctx.$wrapper.find("> .imogi-settings-flat-head, > .imogi-settings-flat-hint").remove();
			const head_html = settings_flat_head_html(meta.title, "");
			ctx.$wrapper.prepend(head_html);
			return;
		}

		const $body = ctx.section.body || ctx.$wrapper.find(".section-body");
		$body
			.find(".imogi-settings-card-head, .imogi-settings-flat-head, .imogi-settings-flat-hint")
			.filter(function () {
				return !$(this).closest(".imogi-shift-settings-dock, .imogi-kitchen-settings-dock").length;
			})
			.remove();
		ctx.$wrapper.find("> .imogi-settings-flat-head, > .imogi-settings-flat-hint").remove();

		const subtitle = get_section_subtitle(fieldname);
		const head_html = settings_flat_head_html(meta.title, subtitle);
		ctx.$wrapper.prepend(head_html);
	});
}

function get_section_subtitle(fieldname) {
	const map = {
		store_identity_section: "",
		branch_pricing_section: __("Price list master, sinkron harga ke cabang, dan push menu dari HQ."),
		general_section: __("Perusahaan, profil kasir, gudang, dan shift kasir."),
		inventory_section: "",
		receipt_section: "",
		whatsapp_qr_templates_section: "",
		import_section: "",
		analytics_section: "",
		flow_section: __("Kitchen display, fulfillment, dan item group dapur."),
		loyalty_section: "",
		stamp_section: "",
		promo_section: "",
		payment_gateway_section: "",
		transfer_payment_section: "",
		integrations_section: "",
		operations_section: "",
		franchise_section: "",
		billing_section: "",
		api_section: "",
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
					<div class="imogi-import-card-actions">
						<button type="button" class="btn btn-primary btn-sm imogi-import-card-btn">${__(
							"Upload Excel / CSV"
						)}</button>
						<a href="#" class="imogi-import-template-link" data-template="menu"><i class="fa fa-download"></i> ${__(
							"Unduh template"
						)}</a>
					</div>
				</div>
				<div class="imogi-import-card" data-action="stock">
					<div class="imogi-import-card-icon"><i class="fa fa-cubes"></i></div>
					<div class="imogi-import-card-title">${__("Import Stok Bahan Baku")}</div>
					<div class="imogi-import-card-desc">${__(
						"Stok awal bahan ke gudang default. Kolom: Komponen, Qty, UOM, Harga (valuation + harga beli)."
					)}</div>
					<div class="imogi-import-card-actions">
						<button type="button" class="btn btn-default btn-sm imogi-import-card-btn">${__(
							"Import Stok"
						)}</button>
						<a href="#" class="imogi-import-template-link" data-template="stock"><i class="fa fa-download"></i> ${__(
							"Unduh template"
						)}</a>
					</div>
				</div>
				<div class="imogi-import-card" data-action="product">
					<div class="imogi-import-card-icon"><i class="fa fa-shopping-basket"></i></div>
					<div class="imogi-import-card-title">${__("Import Produk Saja")}</div>
					<div class="imogi-import-card-desc">${__(
						"Kolom: no, produk, kategori, add_on, standard_rate, stock_uom."
					)}</div>
					<div class="imogi-import-card-actions">
						<button type="button" class="btn btn-default btn-sm imogi-import-card-btn">${__(
							"Import Produk"
						)}</button>
						<a href="#" class="imogi-import-template-link" data-template="product"><i class="fa fa-download"></i> ${__(
							"Unduh template"
						)}</a>
					</div>
				</div>
				<div class="imogi-import-card" data-action="bom">
					<div class="imogi-import-card-icon"><i class="fa fa-sitemap"></i></div>
					<div class="imogi-import-card-title">${__("Import BOM Saja")}</div>
					<div class="imogi-import-card-desc">${__(
						"Kolom: product, bom_product, qty, uom, double. Produk harus sudah ada."
					)}</div>
					<div class="imogi-import-card-actions">
						<button type="button" class="btn btn-default btn-sm imogi-import-card-btn">${__("Import BOM")}</button>
						<a href="#" class="imogi-import-template-link" data-template="bom"><i class="fa fa-download"></i> ${__(
							"Unduh template"
						)}</a>
					</div>
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

		$dock.on("click", ".imogi-import-template-link", function (e) {
			e.preventDefault();
			download_import_template($(this).data("template"));
		});
	}

	["import_menu", "import_stock", "import_products", "import_bom"].forEach((fieldname) => {
		const field = frm.get_field(fieldname);
		if (field && field.$wrapper) {
			field.$wrapper.hide();
		}
	});
}

// Template contoh untuk tiap jenis import. Baris pertama = header kolom,
// sisanya = contoh isian agar user paham kolom apa saja yang harus diisi.
const IMPORT_TEMPLATE_DATA = {
	menu: {
		filename: "template_import_menu.csv",
		rows: [
			["Produk", "Komponen", "Qty", "UOM", "Harga", "Kategori", "Harga Jual"],
			["NEW MILO SAURUS (Reguler)", "", "", "", "", "Beverage", "28000"],
			["", "POWDER MILO OMURA", "33", "GRAM", "49.09", "", ""],
			["", "SUSU DIAMOND FULLCREAM", "88", "ML", "15.29", "", ""],
			["", "ICE CUBE", "300", "GRAM", "1.31", "", ""],
			["AGL-MILK TEA (R)", "", "", "", "", "Beverage", "22000"],
			["", "SUSU UHT", "150", "ML", "2250", "", ""],
			["", "BUBUK MILK TEA", "30", "GRAM", "4500", "", ""],
			["", "GULA CAIR", "20", "ML", "800", "", ""],
			["Birthday Decoration", "", "", "", "", "Service", "150000"],
			["", "Balloon Package", "1", "Set", "50000", "", ""],
		],
	},
	stock: {
		filename: "template_import_stok.csv",
		rows: [
			["Komponen", "Qty", "UOM", "Harga"],
			["SUSU UHT", "1000", "ML", "25"],
			["POWDER MILO OMURA", "500", "GRAM", "49.09"],
			["GULA CAIR", "2000", "ML", "40"],
		],
	},
	product: {
		filename: "template_import_produk.csv",
		rows: [
			["no", "produk", "kategori", "add_on", "standard_rate", "stock_uom"],
			["1", "Chicken Sandwich", "Food", "Extra Chicken, Cheese, Fried Egg", "25000", "Nos"],
			["2", "Es Teh Manis", "Beverage", "", "8000", "Nos"],
			["3", "Pudding Coklat", "Dessert", "", "12000", "Nos"],
		],
	},
	bom: {
		filename: "template_import_bom.csv",
		rows: [
			["product", "bom_product", "qty", "uom", "double"],
			["Sirup Ice", "ABC SIRUP SQUASH DELIGHT GRAPE", "14", "ML", "tidak"],
			["Sirup Ice", "GULA CAIR", "20", "ML", "tidak"],
			["Es Teh Manis", "TEH CELUP", "1", "Pcs", "tidak"],
		],
	},
};

function _to_csv_cell(value) {
	const text = value == null ? "" : String(value);
	if (/[",\n\r]/.test(text)) {
		return `"${text.replace(/"/g, '""')}"`;
	}
	return text;
}

function download_import_template(type) {
	const tpl = IMPORT_TEMPLATE_DATA[type];
	if (!tpl) return;
	const csv = tpl.rows.map((row) => row.map(_to_csv_cell).join(",")).join("\r\n");
	// BOM agar Excel membaca UTF-8 dengan benar.
	const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = tpl.filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	setTimeout(() => URL.revokeObjectURL(url), 1000);
	frappe.show_alert({ message: __("Template diunduh: {0}", [tpl.filename]), indicator: "green" });
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
	schedule_settings_field_state(frm, apply_settings_field_states);
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
	// Tetap tampil; nonaktif bila webhook (atau Order API) belum diaktifkan.
	field.$wrapper.closest(".frappe-control").show();
	const enabled = cint(frm.doc.enable_order_api) && cint(frm.doc.enable_order_api_webhook);
	set_settings_field_disabled(frm, "order_api_webhook_url", !enabled);
}

function build_loyalty_dock(frm) {
	const ctx = get_settings_section(frm, "loyalty_section");
	if (!ctx || !ctx.$wrapper) return;
	ctx.$wrapper.addClass("imogi-section-loyalty");

	frm.set_df_property("enable_loyalty", "description", "");
	frm.set_df_property("enable_stamp_card", "description", "");

	const placeholders = {
		loyalty_points_per_amount: __("Contoh: 10000 = 1 poin / Rp 10.000"),
		loyalty_point_value: __("Contoh: 100 = Rp 100 / poin"),
	};
	Object.entries(placeholders).forEach(([fieldname, hint]) => {
		frm.set_df_property(fieldname, "description", "");
		const field = frm.fields_dict[fieldname];
		if (field && field.$input) field.$input.attr("placeholder", hint);
	});

	// Badge ringkasan (Loyalty/Stamp Card/Promo Rules) dihilangkan sesuai permintaan.
	schedule_settings_field_state(frm, apply_program_promo_field_state);
}

function render_loyalty_dock_summary(frm) {
	// Badge dihilangkan — cukup pastikan state enable/disable field tetap sinkron.
	frm.$wrapper.find(".imogi-loyalty-dock").remove();
	schedule_settings_field_state(frm, apply_program_promo_field_state);
}

// Field di tab "Program & Promo" tetap tampil walau checkbox induk tidak dicentang,
// hanya saja input-nya dinonaktifkan (read-only) sampai checkbox diaktifkan.
function force_show_settings_field(frm, fieldname) {
	const field = frm.fields_dict[fieldname];
	if (!field) return;
	if (field.df) {
		field.df.depends_on = "";
		field.df.hidden = 0;
		field.df.hidden_due_to_dependency = 0;
	}
	frm.set_df_property(fieldname, "depends_on", "");
	frm.toggle_display(fieldname, true);
	const $wrap = field.$wrapper?.closest(".frappe-control, .form-section");
	if ($wrap?.length) {
		$wrap.removeClass("hide-control").show();
	}
	frm.$wrapper
		.find(`.form-section[data-fieldname="${fieldname}"]`)
		.removeClass("hide-control")
		.show();
}

function set_settings_field_disabled(frm, fieldname, disabled) {
	const field = frm.fields_dict[fieldname];
	if (!field) return;
	frm.set_df_property(fieldname, "read_only", disabled ? 1 : 0);
	if (!disabled && field.df) {
		// Dock fields stay visible; clear stale Frappe dependency lock.
		field.df.hidden_due_to_dependency = 0;
	}
	frm.$wrapper.find(`.frappe-control[data-fieldname="${fieldname}"]`).each(function () {
		const $ctrl = $(this);
		$ctrl.toggleClass("imogi-field-disabled", !!disabled);
		if (!disabled) {
			$ctrl.removeClass("hide-control").show();
		}
	});
	if (typeof field.refresh === "function") {
		field.refresh();
	}
	if (field.df?.fieldtype === "Check") {
		field.$wrapper?.find('input[type="checkbox"]').prop("disabled", !!disabled);
	} else if (field.$input) {
		field.$input.prop("disabled", !!disabled);
		if (!disabled && field.disp_status === "Write") {
			field.$wrapper?.find(".control-input").show();
			field.$wrapper?.find(".disp-area").hide();
		}
	}
}

// Peta field yang dependen ke checkbox induk (semua tab). Saat kondisi false,
// field TIDAK disembunyikan — hanya dinonaktifkan (disabled), sesuai permintaan.
// Catatan: field shift/kitchen yang dipindah ke dock ditangani di mount_settings_dock_fields.
const SETTINGS_DEPENDENT_FIELD_CONDITIONS = {
	// Tab Program & Promo
	loyalty_points_per_amount: (d) => cint(d.enable_loyalty),
	loyalty_point_value: (d) => cint(d.enable_loyalty),
	loyalty_min_redeem_points: (d) => cint(d.enable_loyalty),
	enable_stamp_card: (d) => cint(d.enable_loyalty),
	stamp_target: (d) => cint(d.enable_loyalty) && cint(d.enable_stamp_card),
	stamp_reward_discount_type: (d) => cint(d.enable_loyalty) && cint(d.enable_stamp_card),
	stamp_reward_discount_value: (d) => cint(d.enable_loyalty) && cint(d.enable_stamp_card),
	stamp_reward_min_order: (d) => cint(d.enable_loyalty) && cint(d.enable_stamp_card),
	enable_birthday_promo: (d) => cint(d.enable_loyalty),
	birthday_discount_percent: (d) => cint(d.enable_loyalty) && cint(d.enable_birthday_promo),
	birthday_window_days: (d) => cint(d.enable_loyalty) && cint(d.enable_birthday_promo),
	// Tab Printer & Struk (PPN + Cetak Struk)
	sales_tax_rate: (d) => cint(d.enable_sales_tax),
	prices_include_tax: (d) => cint(d.enable_sales_tax),
	thermal_print_mode: (d) => cint(d.enable_receipt_print),
	thermal_printer_width: (d) => cint(d.enable_receipt_print),
	receipt_print_format: (d) => cint(d.enable_receipt_print),
	receipt_logo: (d) => cint(d.enable_receipt_print),
	receipt_header: (d) => cint(d.enable_receipt_print),
	receipt_footer: (d) => cint(d.enable_receipt_print),
	auto_print_receipt_on_success: (d) => cint(d.enable_receipt_print),
	enable_whatsapp_receipt: (d) => cint(d.enable_receipt_print),
	whatsapp_api_provider: (d) => cint(d.enable_receipt_print) && cint(d.enable_whatsapp_receipt),
	fonnte_api_token: (d) =>
		cint(d.enable_receipt_print) &&
		cint(d.enable_whatsapp_receipt) &&
		(d.whatsapp_api_provider || "").trim() === "Fonnte",
	whatsapp_receipt_message: (d) =>
		cint(d.enable_receipt_print) && cint(d.enable_whatsapp_receipt),
	whatsapp_qr_order_received_message: (d) =>
		cint(d.enable_receipt_print) &&
		cint(d.enable_whatsapp_receipt) &&
		cint(d.enable_table_service) &&
		cint(d.enable_qr_self_service),
	whatsapp_qr_order_complete_message: (d) =>
		cint(d.enable_receipt_print) &&
		cint(d.enable_whatsapp_receipt) &&
		cint(d.enable_table_service) &&
		cint(d.enable_qr_self_service),
	// Tab Pembayaran
	payment_gateway_provider: (d) => cint(d.enable_payment_gateway),
	payment_gateway_sandbox: (d) => cint(d.enable_payment_gateway),
	payment_gateway: (d) => cint(d.enable_payment_gateway),
	payment_gateway_key: (d) => cint(d.enable_payment_gateway),
	payment_gateway_client_key: (d) => cint(d.enable_payment_gateway),
	transfer_bank_name: (d) => cint(d.enable_transfer_payment_info),
	transfer_bank_account: (d) => cint(d.enable_transfer_payment_info),
	transfer_account_holder: (d) => cint(d.enable_transfer_payment_info),
	transfer_qr_image: (d) => cint(d.enable_transfer_payment_info),
	transfer_instructions: (d) => cint(d.enable_transfer_payment_info),
	// Tab Integrasi (Order API)
	order_api_user: (d) => cint(d.enable_order_api),
	enable_order_api_webhook: (d) => cint(d.enable_order_api),
	order_api_webhook_url: (d) => cint(d.enable_order_api) && cint(d.enable_order_api_webhook),
	// Tab Integrasi (SaaS Billing Sync) — hanya berlaku di deployment SaaS;
	// di deployment enterprise section ini disembunyikan & guard akan melewatinya.
	billing_provider: (d) => cint(d.enable_saas_billing_sync),
	billing_external_id: (d) => cint(d.enable_saas_billing_sync),
	billing_plan_code: (d) => cint(d.enable_saas_billing_sync),
	billing_status: (d) => cint(d.enable_saas_billing_sync),
	billing_period_end: (d) => cint(d.enable_saas_billing_sync),
	billing_last_synced: (d) => cint(d.enable_saas_billing_sync),
	billing_auto_apply_tier: (d) => cint(d.enable_saas_billing_sync),
	billing_webhook_secret: (d) => cint(d.enable_saas_billing_sync),
	sync_subscription_tier: (d) => cint(d.enable_saas_billing_sync),
};

// Field hanya boleh "dipaksa tampil" jika section-nya memang berada di tab aktif.
// Tanpa ini, field seperti loyalty/stamp bisa bocor ke tab lain.
function settings_field_section_active(frm, fieldname) {
	const field = frm.fields_dict[fieldname];
	if (!field || !field.$wrapper) return false;
	const $section = field.$wrapper.closest(".form-section");
	if (!$section.length) return true;
	return $section.is(":visible");
}

function apply_settings_field_states(frm) {
	const doc = frm.doc || {};
	Object.entries(SETTINGS_DEPENDENT_FIELD_CONDITIONS).forEach(([fieldname, cond]) => {
		if (!frm.fields_dict[fieldname]) return;
		if (!settings_field_section_active(frm, fieldname)) return;
		force_show_settings_field(frm, fieldname);
		let enabled;
		try {
			enabled = !!cond(doc);
		} catch (e) {
			enabled = true;
		}
		set_settings_field_disabled(frm, fieldname, !enabled);
	});
	hide_deferred_operational_settings(frm);
}

// Wrapper agar pemanggil lama tetap berfungsi — keduanya kini memakai logika generik.
function apply_program_promo_field_state(frm) {
	apply_settings_field_states(frm);
}

function apply_payment_field_state(frm) {
	apply_settings_field_states(frm);
}

function schedule_settings_field_state(frm, apply_fn) {
	apply_fn(frm);
	clearTimeout(frm._imogi_field_state_timer);
	frm._imogi_field_state_timer = setTimeout(() => apply_fn(frm), 200);
}

function apply_inventory_placeholders(frm) {
	move_desc_to_placeholder(frm, {
		low_stock_check_interval: __("Default: 180 detik (3 menit)"),
	});
	render_low_stock_roles_list(frm);
}

function render_low_stock_roles_list(frm) {
	const field = frm.fields_dict.low_stock_alert_roles;
	if (!field || !field.$wrapper) return;

	frm.set_df_property("low_stock_alert_roles", "description", "");

	const $control = field.$wrapper.closest(".frappe-control");
	$control.addClass("imogi-role-list-control");

	const $wrapper = field.$wrapper.find(".control-input-wrapper").first();
	if (!$wrapper.length) return;

	$wrapper.children(".control-input").hide();

	if (frm._imogi_role_list_controls) {
		frm._imogi_role_list_controls.forEach((c) => c?.destroy?.());
	}
	frm._imogi_role_list_controls = [];

	let $host = $wrapper.children(".imogi-role-list-host");
	if (!$host.length) {
		$host = $('<div class="imogi-kitchen-list-cards-wrap imogi-role-list-host"></div>').appendTo(
			$wrapper
		);
	}
	$host.empty();

	if (!frm._imogi_role_rows) {
		frm._imogi_role_rows = (frm.doc.low_stock_alert_roles || "")
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
	}
	const roles = frm._imogi_role_rows;

	const write = () => {
		frm.doc.low_stock_alert_roles = roles.filter(Boolean).join(", ");
		frm.dirty();
	};

	const $section = $(`
		<div class="imogi-kitchen-list-section" data-fieldname="low_stock_alert_roles">
			<div class="imogi-kitchen-list-cards"></div>
		</div>`);
	const $cards = $section.find(".imogi-kitchen-list-cards");

	if (!roles.length) {
		$cards.append(
			`<div class="imogi-kitchen-list-empty">${__("Belum ada role. Klik tambah di bawah.")}</div>`
		);
	} else {
		roles.forEach((role, idx) => {
			const $card = $(`
				<div class="imogi-kitchen-list-card" data-idx="${idx}">
					<div class="imogi-kitchen-list-card-col">
						<label>${__("Role")}</label>
						<div class="imogi-kitchen-list-card-input-host"></div>
					</div>
					<button type="button" class="imogi-kitchen-list-card-remove" title="${__("Hapus")}"><i class="fa fa-trash-o"></i></button>
				</div>`);
			$cards.append($card);

			const control = frappe.ui.form.make_control({
				df: {
					fieldtype: "Link",
					options: "Role",
					fieldname: `low_stock_role_${idx}`,
					label: __("Role"),
				},
				parent: $card.find(".imogi-kitchen-list-card-input-host")[0],
				render_input: true,
				only_input: true,
			});
			control.make();
			control.set_value(role || "");
			control.$input?.on("change awesomplete-selectcomplete", () => {
				roles[idx] = control.get_value();
				write();
			});
			frm._imogi_role_list_controls.push(control);

			$card.find(".imogi-kitchen-list-card-remove").on("click", () => {
				roles.splice(idx, 1);
				write();
				render_low_stock_roles_list(frm);
			});
		});
	}

	const $add = $(
		`<button type="button" class="imogi-kitchen-list-add"><i class="fa fa-plus"></i> ${__("Tambah role")}</button>`
	);
	$add.on("click", () => {
		roles.push("");
		render_low_stock_roles_list(frm);
	});
	$section.append($add);
	$host.append($section);
}

function move_desc_to_placeholder(frm, placeholders) {
	Object.entries(placeholders).forEach(([fieldname, hint]) => {
		frm.set_df_property(fieldname, "description", "");
		const field = frm.fields_dict[fieldname];
		if (field && field.$input) {
			field.$input.attr("placeholder", hint);
			if (field.$input.is("textarea")) field.$input.attr("rows", 2);
		}
	});
}

function build_payment_dock(frm) {
	const ctx = get_settings_section(frm, "payment_gateway_section");
	if (!ctx || !ctx.$wrapper) return;
	ctx.$wrapper.addClass("imogi-section-payment");

	move_desc_to_placeholder(frm, {
		payment_gateway_key: __("Midtrans Server Key / Xendit Secret API Key"),
		payment_gateway_client_key: __("Opsional: Midtrans Client Key untuk Snap"),
	});

	// Badge & intro dock dihilangkan agar konsisten dengan tab Program & Promo.
	frm.$wrapper.find(".imogi-payment-dock").remove();
	render_payment_dock_summary(frm);
}

function render_payment_dock_summary(frm) {
	// Badge dihilangkan — cukup sinkronkan state enable/disable field.
	frm.$wrapper.find(".imogi-payment-dock").remove();
	schedule_settings_field_state(frm, apply_payment_field_state);
}

const RECEIPT_WHATSAPP_FIELDS = [
	"auto_print_receipt_on_success",
	"enable_whatsapp_receipt",
	"whatsapp_api_provider",
	"fonnte_api_token",
	"whatsapp_receipt_message",
	"whatsapp_qr_order_received_message",
	"whatsapp_qr_order_complete_message",
];

function build_receipt_whatsapp_dock(frm) {
	const ctx = get_settings_section(frm, "receipt_section");
	if (!ctx || !ctx.$wrapper) return;
	ctx.$wrapper.addClass("imogi-section-receipt");

	// Dock lama memindahkan field (termasuk Password) dan merusak input — hapus.
	frm.$wrapper.find(".imogi-receipt-settings-dock").remove();

	move_desc_to_placeholder(frm, {
		fonnte_api_token: __("API token dari dashboard Fonnte (menu Device → Token)"),
	});

	render_receipt_whatsapp_dock_summary(frm);
}

function render_receipt_whatsapp_dock_summary(frm) {
	RECEIPT_WHATSAPP_FIELDS.forEach((fieldname) => force_show_settings_field(frm, fieldname));
	schedule_settings_field_state(frm, apply_settings_field_states);
}

function build_transfer_dock(frm) {
	const ctx = get_settings_section(frm, "transfer_payment_section");
	if (!ctx || !ctx.$wrapper) return;
	ctx.$wrapper.addClass("imogi-section-transfer");

	move_desc_to_placeholder(frm, {
		transfer_instructions: __("Catatan opsional untuk kasir / pelanggan (mis. konfirmasi via WhatsApp)"),
	});

	// Badge & intro dock dihilangkan agar konsisten dengan tab Program & Promo.
	frm.$wrapper.find(".imogi-transfer-dock").remove();
	render_transfer_dock_summary(frm);
}

function render_transfer_dock_summary(frm) {
	// Badge dihilangkan — cukup sinkronkan state enable/disable field.
	frm.$wrapper.find(".imogi-transfer-dock").remove();
	schedule_settings_field_state(frm, apply_payment_field_state);
}

// Field di tab "Pembayaran" tetap tampil walau checkbox induk tidak dicentang,
// hanya saja input-nya dinonaktifkan (read-only) sampai checkbox diaktifkan.
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
	frm.toggle_display("mode_summary", false);
	const field = frm.get_field("mode_summary");
	if (field?.$wrapper) {
		field.$wrapper.closest(".frappe-control").hide();
		field.$wrapper.empty();
	}
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

const STORE_IDENTITY_GRID_ORDER = ["default_company", "store_city", "owner_whatsapp"];

function unwrap_store_identity_target_combo($grid, frm) {
	const $combo = $grid.find(".imogi-store-target-combo");
	if (!$combo.length) return;

	const $group = $combo.children(".form-group").first();
	const $clearfix = $group.children(".clearfix").first().detach();
	const $stack = $group.children(".imogi-store-target-value-stack").first();
	const $input_wrap = $stack.find("> .imogi-store-target-input-row > .control-input-wrapper").first().detach();
	const $multi_ctrl = $stack
		.find("> .imogi-store-target-input-row > .frappe-control[data-fieldname='multi_branch']")
		.first()
		.detach();
	const $help = $stack.find("> .help-box, > .small.text-muted").detach().remove();

	const target_field = frm.get_field("target_monthly_sales");
	const multi_field = frm.get_field("multi_branch");
	if (!target_field?.$wrapper || !multi_field?.$wrapper) {
		$combo.remove();
		return;
	}

	const $target = target_field.$wrapper.closest(".frappe-control");
	const $multi = multi_field.$wrapper.closest(".frappe-control");
	$target.empty().append($('<div class="form-group"></div>').append($clearfix).append($input_wrap));
	if ($multi_ctrl.length) {
		$multi.replaceWith($multi_ctrl);
	} else {
		$multi.show();
	}
	$combo.before($target);
	if ($multi_ctrl.length) {
		$combo.before($multi_ctrl);
	}
	$combo.remove();
}

function layout_store_identity_target_combo($grid, frm) {
	let $combo = $grid.find(".imogi-store-target-combo");
	if (!$combo.length) {
		$combo = $('<div class="imogi-store-target-combo imogi-store-field"></div>');
	}

	const target_field = frm.get_field("target_monthly_sales");
	const multi_field = frm.get_field("multi_branch");
	if (!target_field?.$wrapper || !multi_field?.$wrapper) {
		return $combo;
	}

	frm.toggle_display("target_monthly_sales", true);
	frm.toggle_display("multi_branch", true);

	const $target = target_field.$wrapper.closest(".frappe-control").addClass("imogi-store-field").show();
	const $multi = multi_field.$wrapper.closest(".frappe-control");
	$multi.addClass("imogi-store-field").show();
	$multi.find("> .form-group > .clearfix").remove();
	$multi.find("> .form-group").data("imogi-horizontal-check", 0);

	const $target_group = $target.children(".form-group").first();
	const $clearfix = $target_group.children(".clearfix").first().detach();
	const $input_wrap = $target_group.children(".control-input-wrapper").first().detach();
	$target_group.children(".help-box, .small.text-muted").remove();

	$combo.empty();
	const $group = $('<div class="form-group"></div>');
	const $stack = $('<div class="imogi-store-target-value-stack"></div>');
	const $row = $('<div class="imogi-store-target-input-row"></div>');

	$group.append($clearfix);
	$row.append($input_wrap).append($multi);
	$stack.append($row);
	$group.append($stack);
	$combo.append($group);

	$target.detach().empty();
	return $combo;
}

function normalize_horizontal_settings_field($ctrl) {
	if (!$ctrl || !$ctrl.length) return;
	const $group = $ctrl.find("> .form-group").first();
	if (!$group.length) return;

	if ($ctrl.attr("data-fieldtype") === "Check") {
		if ($group.data("imogi-horizontal-check")) return;
		const $checkbox = $group.find(".checkbox").first();
		const $label_area = $checkbox.find(".label-area").first();
		const label_text = (
			$label_area.text() ||
			$checkbox.find("label").text() ||
			$ctrl.find(".control-label").first().text() ||
			""
		).trim();
		if (label_text) {
			$label_area.remove();
			$checkbox.find("label").each(function () {
				$(this)
					.contents()
					.filter(function () {
						return this.nodeType === 3 || (this.nodeType === 1 && !$(this).is("input"));
					})
					.remove();
			});
			if (!$group.find("> .clearfix .control-label").length) {
				$group.prepend(
					`<div class="clearfix"><label class="control-label">${frappe.utils.escape_html(
						label_text
					)}</label></div>`
				);
			}
		}
		$group.data("imogi-horizontal-check", 1);
		return;
	}

	if ($group.data("imogi-horizontal-field")) return;
	$group.data("imogi-horizontal-field", 1);
}

function normalize_store_identity_field_layout($ctrl) {
	normalize_horizontal_settings_field($ctrl);
}

function cleanup_store_identity_section_form(frm) {
	const ctx = get_settings_section(frm, "store_identity_section");
	if (!ctx || !ctx.$wrapper) return;
	const $body = ctx.section.body || ctx.$wrapper.find(".section-body");
	$body.children(".row").hide();
}

const SHIFT_SETTINGS_FIELDS = [
	"enable_pos_shift",
	"enable_shift_cash_detail",
	"default_pos_profile",
	"default_warehouse",
	"default_opening_time",
	"default_closing_time",
];

const KITCHEN_SETTINGS_FIELDS = [
	"enable_table_service",
	"enable_qr_self_service",
	"qr_self_service_payment_mode",
	"qr_cash_cashier_flow",
	"enable_kitchen_display",
	"kds_station_mode",
	"enable_fulfillment",
];

const FULFILLMENT_SETTINGS_FIELDS = ["enable_fulfillment", "fulfillment_order_type_rows"];

const KITCHEN_DOCK_LIST_CONFIGS = [
	{
		fieldname: "kitchen_item_group_rows",
		value_field: "item_group",
		label: __("Item Group Dapur"),
		fieldtype: "Link",
		options: "Item Group",
		add_label: __("Tambah item group dapur"),
		empty_label: __("Belum ada item group. Klik tambah di bawah."),
		is_enabled: (frm) => cint(frm.doc.enable_kitchen_display),
	},
	{
		fieldname: "bar_item_group_rows",
		value_field: "item_group",
		label: __("Item Group Bar (Minuman)"),
		fieldtype: "Link",
		options: "Item Group",
		add_label: __("Tambah item group bar"),
		empty_label: __("Opsional — kosong = deteksi otomatis (Minuman/Beverage/Coffee)."),
		is_enabled: (frm) =>
			cint(frm.doc.enable_kitchen_display) &&
			(frm.doc.kds_station_mode || "") === "Separate Kitchen and Bar",
	},
	{
		fieldname: "fulfillment_order_type_rows",
		value_field: "order_type",
		label: __("Tipe Order"),
		fieldtype: "Select",
		options: "Dine-in\nTakeaway\nDelivery",
		add_label: __("Tambah tipe order"),
		empty_label: __("Belum ada tipe order. Klik tambah di bawah."),
		is_enabled: (frm) => cint(frm.doc.enable_fulfillment),
	},
];

const DOCK_TABLE_FIELDS = [
	"kitchen_item_group_rows",
	"bar_item_group_rows",
	"fulfillment_order_type_rows",
];

function is_fulfillment_rollout_enabled() {
	return cint(frappe.boot?.imogi_pos_fulfillment_rollout_enabled);
}

function get_kitchen_settings_fields() {
	if (is_fulfillment_rollout_enabled()) {
		return KITCHEN_SETTINGS_FIELDS;
	}
	return KITCHEN_SETTINGS_FIELDS.filter((fieldname) => !FULFILLMENT_SETTINGS_FIELDS.includes(fieldname));
}

function get_kitchen_dock_table_fields() {
	if (is_fulfillment_rollout_enabled()) {
		return DOCK_TABLE_FIELDS;
	}
	return DOCK_TABLE_FIELDS.filter((fieldname) => fieldname !== "fulfillment_order_type_rows");
}

function get_kitchen_dock_all_fields() {
	return [...get_kitchen_settings_fields(), ...get_kitchen_dock_table_fields()];
}

const KITCHEN_DOCK_ALL_FIELDS = [...KITCHEN_SETTINGS_FIELDS, ...DOCK_TABLE_FIELDS];

const _kitchen_dock_list_controls = new Map();
let _imogi_kitchen_dock_quiet = false;

function with_kitchen_dock_quiet(callback) {
	_imogi_kitchen_dock_quiet = true;
	try {
		return callback();
	} finally {
		_imogi_kitchen_dock_quiet = false;
	}
}

function kitchen_dock_track_change(frm, rows, idx, config, control) {
	if (_imogi_kitchen_dock_quiet) return;
	const next = control.get_value() || "";
	if (rows[idx][config.value_field] === next) return;
	rows[idx][config.value_field] = next;
	frm.dirty();
}

const GENERAL_TAB_DOCK_FIELDS = [...SHIFT_SETTINGS_FIELDS, ...KITCHEN_DOCK_ALL_FIELDS];

const DOCK_CHECKBOX_FIELDS = [
	"enable_pos_shift",
	"enable_shift_cash_detail",
	"enable_table_service",
	"enable_qr_self_service",
	"enable_kitchen_display",
	"enable_fulfillment",
];

const STORE_IDENTITY_LAYOUT_VERSION = "4";

function teardown_store_identity_layout($body) {
	const $controls = $body.find(
		".imogi-store-form-grid .frappe-control, .imogi-store-target-combo, .imogi-store-email-field"
	);
	$controls.detach();
	$body.find(".imogi-store-identity-card, .imogi-store-identity-layout").remove();
	$controls.appendTo($body);
}

function build_store_identity_shell($body) {
	$body.prepend(`
		<div class="imogi-store-identity-card" data-layout-version="${STORE_IDENTITY_LAYOUT_VERSION}">
			<div class="imogi-store-identity-layout">
				<div class="imogi-store-identity-main">
					<div class="imogi-store-form-grid"></div>
				</div>
				<div class="imogi-receipt-preview-wrap">
					<div class="imogi-receipt-preview-head">${__("Preview Struk")}</div>
					<div class="imogi-receipt-preview-paper">
						<div class="imogi-receipt-preview-body"></div>
					</div>
				</div>
			</div>
		</div>`);
}

function layout_store_identity(frm) {
	const ctx = get_settings_section(frm, "store_identity_section");
	if (!ctx || !ctx.$wrapper) return;

	ctx.$wrapper.addClass("imogi-store-identity-section imogi-settings-card-section");
	const $body = ctx.section.body || ctx.$wrapper.find(".section-body");
	if (!$body.length) return;

	frm.set_df_property("default_company", "label", __("Nama Toko"));
	frm.set_df_property("target_monthly_sales", "description", "");

	const $card = $body.find(".imogi-store-identity-card");
	const needs_rebuild =
		!$card.length ||
		$card.attr("data-layout-version") !== STORE_IDENTITY_LAYOUT_VERSION ||
		$body.find(".imogi-store-info-banner, .imogi-store-trust-row").length > 0;

	if (needs_rebuild) {
		teardown_store_identity_layout($body);
		$body.find(".imogi-settings-card-head").remove();
		build_store_identity_shell($body);
	}

	const $grid = $body.find(".imogi-store-form-grid");
	$grid.addClass("imogi-store-form-grid--horizontal");
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

	unwrap_store_identity_target_combo($grid, frm);
	$grid.find(".imogi-store-target-row, .imogi-store-target-stack").each(function () {
		$(this)
			.children(".frappe-control")
			.each(function () {
				$grid.append($(this));
			});
		$(this).remove();
	});

	const $ordered = [$grid.find(".imogi-store-email-field")];
	STORE_IDENTITY_GRID_ORDER.forEach((fieldname) => {
		const field = frm.get_field(fieldname);
		if (!field || !field.$wrapper) return;
		frm.toggle_display(fieldname, true);
		const $ctrl = field.$wrapper.closest(".frappe-control");
		$ctrl.addClass("imogi-store-field").show();
		normalize_store_identity_field_layout($ctrl);
		$ordered.push($ctrl);
	});

	$ordered.push(layout_store_identity_target_combo($grid, frm));

	$ordered.forEach(($el) => {
		if ($el && $el.length) {
			$grid.append($el);
		}
	});
	hide_settings_general_extras(frm);
	cleanup_store_identity_section_form(frm);
}

function ensure_dock_section_head($dock, title, hint) {
	if (!$dock || !$dock.length) return;
	$dock.children(".imogi-settings-flat-head, .imogi-settings-flat-hint, .imogi-dock-card-head").remove();
	$dock.prepend(settings_flat_head_html(title, hint));
}

function configure_shift_dock_fields(frm) {
	frm.set_df_property("enable_pos_shift", "label", __("Session Kasir"));
	["enable_pos_shift", "enable_shift_cash_detail", "default_pos_profile", "default_warehouse"].forEach(
		(fieldname) => frm.set_df_property(fieldname, "description", "")
	);
}

function dock_field_depends_visible(frm, fieldname) {
	const depends_map = {
		kds_station_mode: () => cint(frm.doc.enable_kitchen_display),
		kitchen_item_group_rows: () => cint(frm.doc.enable_kitchen_display),
		bar_item_group_rows: () =>
			cint(frm.doc.enable_kitchen_display) &&
			(frm.doc.kds_station_mode || "") === "Separate Kitchen and Bar",
		fulfillment_order_type_rows: () => cint(frm.doc.enable_fulfillment),
		enable_shift_cash_detail: () => cint(frm.doc.enable_pos_shift),
	};
	if (depends_map[fieldname]) {
		return depends_map[fieldname]();
	}
	const df = frappe.meta.get_docfield(frm.doctype, fieldname, frm.doc.name);
	if (!df || cint(df.hidden)) return false;
	if (!df.depends_on) return true;
	if (frm.layout && typeof frm.layout.evaluate_depends_on_value === "function") {
		return !!frm.layout.evaluate_depends_on_value(df.depends_on);
	}
	if (typeof df.depends_on === "string" && df.depends_on.startsWith("eval:")) {
		try {
			return !!frappe.utils.eval(df.depends_on.substr(5), { doc: frm.doc, parent: frm.doc });
		} catch (e) {
			return false;
		}
	}
	return true;
}

function dock_field_should_show(frm, fieldname) {
	return dock_field_depends_visible(frm, fieldname);
}

function hide_settings_section_shell(frm, section_name) {
	const ctx = get_settings_section(frm, section_name);
	if (!ctx || !ctx.$wrapper) return;
	ctx.$wrapper.hide();
}

const DOCK_FIELD_HOME_SECTION = {
	enable_pos_shift: "general_section",
	enable_shift_cash_detail: "general_section",
	default_pos_profile: "general_section",
	default_warehouse: "general_section",
	enable_table_service: "flow_section",
	enable_qr_self_service: "flow_section",
	qr_self_service_payment_mode: "flow_section",
	qr_cash_cashier_flow: "flow_section",
	enable_kitchen_display: "flow_section",
	kds_station_mode: "flow_section",
	enable_fulfillment: "flow_section",
	kitchen_item_group_rows: "flow_section",
	bar_item_group_rows: "flow_section",
	fulfillment_order_type_rows: "flow_section",
};

function ensure_dock_field_rendered(frm, fieldname) {
	const section_name = DOCK_FIELD_HOME_SECTION[fieldname];
	let $section = null;
	let was_hidden = false;
	if (section_name) {
		const ctx = get_settings_section(frm, section_name);
		$section = ctx?.$wrapper;
		if ($section?.length && !$section.is(":visible")) {
			was_hidden = true;
			$section.show().removeClass("hide-control");
			const $body = ctx.section.body || $section.find(".section-body");
			$body?.show();
		}
	}
	const field = frm.fields_dict[fieldname];
	if (!field) {
		if (was_hidden && $section) $section.hide();
		return false;
	}
	if (field.df) {
		field.df.hidden = 0;
		field.df.hidden_due_to_dependency = 0;
	}
	frm.toggle_display(fieldname, true);
	if ((!field.$wrapper || !field.$wrapper.length) && typeof field.make === "function") {
		field.make();
	}
	const ok = !!(field.$wrapper && field.$wrapper.length);
	if (was_hidden && $section) {
		$section.hide();
	}
	return ok;
}

function get_dock_field_control(frm, fieldname) {
	if (!frm.fields_dict[fieldname]) return null;
	const $mounted = frm.$wrapper.find(
		`.imogi-shift-settings-dock .frappe-control[data-fieldname="${fieldname}"], ` +
			`.imogi-kitchen-settings-dock .frappe-control[data-fieldname="${fieldname}"], ` +
			`.imogi-receipt-settings-dock .frappe-control[data-fieldname="${fieldname}"]`
	);
	if ($mounted.length) {
		return $mounted.first();
	}
	if (!ensure_dock_field_rendered(frm, fieldname)) return null;
	const field = frm.fields_dict[fieldname];
	if (!field.$wrapper || !field.$wrapper.length) return null;
	return field.$wrapper.closest(".frappe-control");
}

function get_dock_checkbox_inputs(frm, fieldname) {
	return frm.$wrapper.find(
		`.imogi-shift-settings-dock .frappe-control[data-fieldname="${fieldname}"] input[type="checkbox"], ` +
			`.imogi-kitchen-settings-dock .frappe-control[data-fieldname="${fieldname}"] input[type="checkbox"], ` +
			`.imogi-receipt-settings-dock .frappe-control[data-fieldname="${fieldname}"] input[type="checkbox"]`
	);
}

function bind_dock_checkbox_handlers_once(frm) {
	if (frm._imogi_dock_checkbox_bound) return;
	frm._imogi_dock_checkbox_bound = true;

	frm.$wrapper.on(
		"change.imogi_dock_check",
		'.imogi-shift-settings-dock input[type="checkbox"], .imogi-kitchen-settings-dock input[type="checkbox"]',
		function () {
			const $input = $(this);
			const fieldname = $input.closest(".frappe-control").attr("data-fieldname");
			if (!fieldname || !DOCK_CHECKBOX_FIELDS.includes(fieldname)) return;

			const value = $input.prop("checked") ? 1 : 0;
			const apply_dock_layout = () => {
				if (fieldname === "enable_pos_shift" || fieldname === "enable_shift_cash_detail") {
					layout_shift_settings(frm);
					return;
				}
				layout_kitchen_settings(frm);
			};

			if (cint(frm.doc[fieldname]) !== value) {
				frm.set_value(fieldname, value).then(apply_dock_layout);
			} else {
				apply_dock_layout();
			}
		}
	);
}

function hook_settings_form_save(frm) {
	if (frm._imogi_save_hooked) return;
	frm._imogi_save_hooked = true;
	const original_save = frm.save.bind(frm);
	frm.save = function (...args) {
		apply_dock_fields_before_save(frm);
		return original_save(...args);
	};
}

function apply_dock_fields_before_save(frm) {
	sync_dock_fields_to_doc(frm);
	sync_kitchen_dock_table_rows_to_doc(frm);
	if (frm.is_dirty()) return;
	const saved = frappe.model.get_doc(frm.doctype, frm.doc.name);
	if (!saved) return;
	for (const fieldname of DOCK_CHECKBOX_FIELDS) {
		const current = DOCK_CHECKBOX_FIELDS.includes(fieldname)
			? cint(frm.doc[fieldname])
			: String(frm.doc[fieldname] ?? "");
		const original = DOCK_CHECKBOX_FIELDS.includes(fieldname)
			? cint(saved[fieldname])
			: String(saved[fieldname] ?? "");
		if (current !== original) {
			frm.dirty();
			break;
		}
	}
	if (frm.is_dirty()) return;
	for (const config of KITCHEN_DOCK_LIST_CONFIGS) {
		if (!kitchen_dock_config_enabled(frm, config)) continue;
		sync_kitchen_dock_controls_to_doc(frm);
		const current = kitchen_dock_rows_fingerprint(
			get_kitchen_dock_rows(frm, config).filter((row) =>
				String(row[config.value_field] || "").trim()
			),
			config.value_field
		);
		const original = kitchen_dock_rows_fingerprint(
			saved[config.fieldname] || [],
			config.value_field
		);
		if (current !== original) {
			frm.dirty();
			break;
		}
	}
}

function read_dock_checkbox_value(frm, fieldname) {
	const $inputs = get_dock_checkbox_inputs(frm, fieldname);
	if ($inputs.length) {
		const $target = $inputs.filter(":visible").first().length ? $inputs.filter(":visible").first() : $inputs.first();
		return $target.prop("checked") ? 1 : 0;
	}
	return cint(frm.doc[fieldname]);
}

function write_dock_checkbox_value(frm, fieldname, value) {
	const checked = !!cint(value);
	get_dock_checkbox_inputs(frm, fieldname).prop("checked", checked);
	const field = frm.get_field(fieldname);
	if (field?.$wrapper?.length) {
		field.$wrapper.find('input[type="checkbox"]').prop("checked", checked);
	}
}

function sync_dock_checkbox_from_doc(frm, fieldnames) {
	fieldnames.forEach((fieldname) => {
		write_dock_checkbox_value(frm, fieldname, frm.doc[fieldname]);
	});
}

function sync_dock_fields_to_doc(frm) {
	let changed = false;
	DOCK_CHECKBOX_FIELDS.forEach((fieldname) => {
		const value = read_dock_checkbox_value(frm, fieldname);
		if (cint(frm.doc[fieldname]) !== value) {
			frm.doc[fieldname] = value;
			changed = true;
		}
	});
	if (changed) frm.dirty();
}

function destroy_kitchen_dock_list_controls() {
	_kitchen_dock_list_controls.forEach((ctrl) => {
		ctrl?.$input?.off(".imogi_kitchen_dock");
		ctrl?.destroy?.();
	});
	_kitchen_dock_list_controls.clear();
}

function kitchen_dock_rows_match_doc(frm) {
	sync_kitchen_dock_controls_to_doc(frm);
	return KITCHEN_DOCK_LIST_CONFIGS.every((config) => {
		if (!kitchen_dock_config_enabled(frm, config)) return true;
		const rows = get_kitchen_dock_rows(frm, config).filter((row) =>
			String(row[config.value_field] || "").trim()
		);
		return (
			kitchen_dock_rows_fingerprint(rows, config.value_field) ===
			kitchen_dock_rows_fingerprint(frm.doc[config.fieldname], config.value_field)
		);
	});
}

function clear_phantom_kitchen_dock_dirty(frm) {
	if (!frm?._imogi_reconcile_after_save || !frm.is_dirty()) return;
	frm._imogi_reconcile_after_save = false;
	if (!kitchen_dock_rows_match_doc(frm)) return;
	delete frm.doc.__unsaved;
	frm.refresh_header?.();
}

const KITCHEN_DOCK_CHILD_DOCTYPES = {
	kitchen_item_group_rows: "IMOGI POS Settings Kitchen Item Group",
	bar_item_group_rows: "IMOGI POS Settings Bar Item Group",
	fulfillment_order_type_rows: "IMOGI POS Settings Fulfillment Order Type",
};

function kitchen_dock_config_enabled(frm, config) {
	if (config.fieldname === "kitchen_item_group_rows") {
		return (
			cint(frm.doc.enable_kitchen_display) ||
			cint(read_dock_checkbox_value(frm, "enable_kitchen_display"))
		);
	}
	if (config.fieldname === "bar_item_group_rows") {
		return (
			(cint(frm.doc.enable_kitchen_display) ||
				cint(read_dock_checkbox_value(frm, "enable_kitchen_display"))) &&
			(frm.doc.kds_station_mode || "") === "Separate Kitchen and Bar"
		);
	}
	if (config.fieldname === "fulfillment_order_type_rows") {
		return (
			cint(frm.doc.enable_fulfillment) || cint(read_dock_checkbox_value(frm, "enable_fulfillment"))
		);
	}
	return config.is_enabled(frm);
}

function ensure_kitchen_dock_table_field(frm, fieldname) {
	ensure_dock_field_rendered(frm, fieldname);
	if (!frm.doc[fieldname]) {
		frm.doc[fieldname] = [];
	}
}

function get_kitchen_dock_rows(frm, config) {
	ensure_kitchen_dock_table_field(frm, config.fieldname);
	return frm.doc[config.fieldname];
}

function kitchen_dock_rows_fingerprint(rows, value_field) {
	return (rows || []).map((row) => String(row[value_field] || "").trim()).join("\u0001");
}

function sync_kitchen_dock_controls_to_doc(frm) {
	KITCHEN_DOCK_LIST_CONFIGS.forEach((config) => {
		if (!kitchen_dock_config_enabled(frm, config)) return;
		const rows = get_kitchen_dock_rows(frm, config);
		rows.forEach((row, idx) => {
			const control = _kitchen_dock_list_controls.get(`${config.fieldname}-${idx}`);
			if (control) {
				row[config.value_field] = control.get_value() || "";
			}
		});
	});
}

function sync_kitchen_dock_table_rows_to_doc(frm) {
	sync_kitchen_dock_controls_to_doc(frm);
	let changed = false;

	KITCHEN_DOCK_LIST_CONFIGS.forEach((config) => {
		if (!kitchen_dock_config_enabled(frm, config)) return;
		const rows = get_kitchen_dock_rows(frm, config);
		for (let i = rows.length - 1; i >= 0; i--) {
			if (!String(rows[i][config.value_field] || "").trim()) {
				const row = rows[i];
				if (row.name) {
					frappe.model.clear_doc(row.doctype, row.name);
				}
				rows.splice(i, 1);
				changed = true;
			}
		}
	});

	if (changed) frm.dirty();
	return changed;
}

function add_kitchen_dock_row(frm, config) {
	ensure_kitchen_dock_table_field(frm, config.fieldname);
	const child = frappe.model.add_child(
		frm.doc,
		KITCHEN_DOCK_CHILD_DOCTYPES[config.fieldname],
		config.fieldname
	);
	child[config.value_field] = "";
	if (!_imogi_kitchen_dock_quiet) frm.dirty();
}

function remove_kitchen_dock_row(frm, config, idx) {
	const rows = get_kitchen_dock_rows(frm, config);
	const row = rows[idx];
	if (!row) return;
	if (row.name) {
		frappe.model.clear_doc(row.doctype, row.name);
	}
	rows.splice(idx, 1);
	if (!_imogi_kitchen_dock_quiet) frm.dirty();
}

function suppress_kitchen_native_table_fields(frm) {
	lock_kitchen_dock_native_table_fields(frm);
}

function lock_kitchen_dock_native_table_fields(frm) {
	DOCK_TABLE_FIELDS.forEach((fieldname) => {
		ensure_dock_field_rendered(frm, fieldname);
		const field = frm.fields_dict[fieldname];
		if (!field?.$wrapper?.length) return;
		field.$wrapper.addClass("imogi-kitchen-native-table-hidden").hide();
		field.$wrapper.find(".grid-field, .form-grid, .grid-buttons, .grid-add-row").hide();
		if (field.grid?.wrapper?.length) {
			field.grid.wrapper.hide();
		}
		frm.toggle_display(fieldname, false);
	});
}

function bind_kitchen_dock_list_actions_once(frm) {
	if (frm._imogi_kitchen_dock_actions_bound) return;
	frm._imogi_kitchen_dock_actions_bound = true;

	frm.$wrapper.on("click.imogi_kitchen_dock", ".imogi-kitchen-list-add", function on_kitchen_dock_add(e) {
		e.preventDefault();
		e.stopImmediatePropagation();
		const fieldname = $(this).closest(".imogi-kitchen-list-section").attr("data-fieldname");
		const config = KITCHEN_DOCK_LIST_CONFIGS.find((c) => c.fieldname === fieldname);
		if (!config || !kitchen_dock_config_enabled(frm, config)) return;
		const $dock = $(this).closest(".imogi-kitchen-settings-dock");
		add_kitchen_dock_row(frm, config);
		render_kitchen_dock_list_cards(frm, $dock);
	});

	frm.$wrapper.on(
		"click.imogi_kitchen_dock",
		".imogi-kitchen-list-card-remove",
		function on_kitchen_dock_remove(e) {
			e.preventDefault();
			e.stopImmediatePropagation();
			const fieldname = $(this).closest(".imogi-kitchen-list-section").attr("data-fieldname");
			const config = KITCHEN_DOCK_LIST_CONFIGS.find((c) => c.fieldname === fieldname);
			if (!config) return;
			const idx = parseInt($(this).closest(".imogi-kitchen-list-card").attr("data-idx"), 10);
			if (Number.isNaN(idx)) return;
			const $dock = $(this).closest(".imogi-kitchen-settings-dock");
			remove_kitchen_dock_row(frm, config, idx);
			render_kitchen_dock_list_cards(frm, $dock);
		}
	);
}

function hide_kitchen_native_table_fields(frm) {
	suppress_kitchen_native_table_fields(frm);
}

function render_kitchen_dock_list_cards(frm, $dock) {
	with_kitchen_dock_quiet(() => {
		lock_kitchen_dock_native_table_fields(frm);
		destroy_kitchen_dock_list_controls();

		let $lists = $dock.find(".imogi-kitchen-list-cards-wrap");
		if (!$lists.length) {
			$lists = $('<div class="imogi-kitchen-list-cards-wrap"></div>');
			$dock.find(".imogi-kitchen-form-grid").after($lists);
		}
		$lists.empty();

		KITCHEN_DOCK_LIST_CONFIGS.forEach((config) => {
			if (!kitchen_dock_config_enabled(frm, config)) return;

			const rows = get_kitchen_dock_rows(frm, config);
			const $section = $(`
			<div class="imogi-kitchen-list-section" data-fieldname="${config.fieldname}">
				<div class="imogi-kitchen-list-section-label">${frappe.utils.escape_html(config.label)}</div>
				<div class="imogi-kitchen-list-cards"></div>
			</div>
		`);
			const $cards = $section.find(".imogi-kitchen-list-cards");

			if (!rows.length) {
				$cards.append(`<div class="imogi-kitchen-list-empty">${config.empty_label}</div>`);
			} else {
				rows.forEach((row, idx) => {
					const $card = $(`
					<div class="imogi-kitchen-list-card" data-idx="${idx}">
						<div class="imogi-kitchen-list-card-col">
							<label>${frappe.utils.escape_html(config.label)}</label>
							<div class="imogi-kitchen-list-card-input-host"></div>
						</div>
						<button type="button" class="imogi-kitchen-list-card-remove" title="${__("Hapus")}"><i class="fa fa-trash-o"></i></button>
					</div>
				`);
					$cards.append($card);

					const controlKey = `${config.fieldname}-${idx}`;
					const control = frappe.ui.form.make_control({
						df: {
							fieldtype: config.fieldtype,
							options: config.options,
							fieldname: `${config.fieldname}_${idx}`,
							label: config.label,
						},
						parent: $card.find(".imogi-kitchen-list-card-input-host")[0],
						render_input: true,
						only_input: true,
					});
					control.make();
					control.set_value(row[config.value_field] || "");
					const write_row = () => kitchen_dock_track_change(frm, rows, idx, config, control);
					control.df.onchange = write_row;
					control.$input?.on("change.imogi_kitchen_dock awesomplete-selectcomplete.imogi_kitchen_dock", write_row);
					_kitchen_dock_list_controls.set(controlKey, control);
				});
			}

			const $add = $(`<button type="button" class="imogi-kitchen-list-add"><i class="fa fa-plus"></i> ${config.add_label}</button>`);
			$section.append($add);
			$lists.append($section);
		});
	});
	clear_phantom_kitchen_dock_dirty(frm);
}

function bind_dock_table_field_sync(frm) {
	if (frm._imogi_dock_table_bound) return;
	frm._imogi_dock_table_bound = true;
	frm.$wrapper.on(
		"grid-row-added.imogi_dock_table grid-row-removed.imogi_dock_table",
		".imogi-kitchen-settings-dock .form-grid",
		() => frm.dirty()
	);
}

function configure_kitchen_dock_tables(frm) {
	hide_kitchen_native_table_fields(frm);
}

function hide_duplicate_dock_fields(frm, fieldnames) {
	fieldnames.forEach((fieldname) => {
		frm.$wrapper
			.find(`.frappe-control[data-fieldname="${fieldname}"]`)
			.not(
				".imogi-shift-settings-dock .frappe-control, .imogi-kitchen-settings-dock .frappe-control, .imogi-receipt-settings-dock .frappe-control"
			)
			.hide();
	});
}

function mount_settings_dock_fields(frm, $grid, fieldnames, field_class) {
	$grid.find("> .imogi-dock-check-row .frappe-control").detach();
	$grid.find("> .imogi-dock-check-row").remove();

	fieldnames.forEach((fieldname) => {
		// Checkbox induk dimatikan -> field tetap tampil di dock, hanya dinonaktifkan.
		const enabled = dock_field_should_show(frm, fieldname);
		const $ctrl = get_dock_field_control(frm, fieldname);
		if (!$ctrl || !$ctrl.length) return;
		$ctrl.detach().removeClass("hide-control").addClass(field_class).show();
		const fieldtype = $ctrl.attr("data-fieldtype");
		if (fieldtype !== "Small Text" && fieldtype !== "Text" && fieldtype !== "Table") {
			normalize_horizontal_settings_field($ctrl);
		}
		$ctrl.find(".help-box, .small.text-muted").remove();
		$grid.append($ctrl);
		frm.toggle_display(fieldname, true);
		set_settings_field_disabled(frm, fieldname, !enabled);
	});
}

function group_dock_checkbox_row($grid, frm, fieldnames) {
	if (!$grid || !$grid.length || !frm || !fieldnames || fieldnames.length < 2) return;
	const $controls = fieldnames
		.map((fieldname) => {
			const field = frm.get_field(fieldname);
			if (!field || !field.$wrapper) return null;
			const $ctrl = field.$wrapper.closest(".frappe-control");
			if (!$ctrl.length || !$.contains($grid[0], $ctrl[0])) return null;
			return $ctrl;
		})
		.filter(Boolean);
	if ($controls.length < 2) return;

	$grid.find("> .imogi-dock-check-row .frappe-control").detach();
	$grid.find("> .imogi-dock-check-row").remove();
	const $row = $('<div class="imogi-dock-check-row"></div>');
	$controls[0].before($row);
	$controls.forEach(($ctrl) => $row.append($ctrl));
}

function layout_shift_settings(frm) {
	const ctx = get_settings_section(frm, "store_identity_section");
	if (!ctx || !ctx.$wrapper) return;

	const $body = ctx.section.body || ctx.$wrapper.find(".section-body");
	let $dock = $body.find(".imogi-shift-settings-dock");
	if (!$dock.length) {
		$dock = $(`
			<div class="imogi-shift-settings-dock">
				<div class="imogi-shift-form-grid"></div>
			</div>`);
		$body.append($dock);
	}
	ensure_dock_section_head($dock, __("Session Kasir & Opening/Closing Entry"), "");
	configure_shift_dock_fields(frm);

	const $grid = $dock.find(".imogi-shift-form-grid");
	$grid.addClass("imogi-shift-form-grid--horizontal");
	mount_settings_dock_fields(frm, $grid, SHIFT_SETTINGS_FIELDS, "imogi-shift-field");
	group_dock_checkbox_row($grid, frm, ["enable_pos_shift", "enable_shift_cash_detail"]);
	sync_dock_checkbox_from_doc(frm, ["enable_pos_shift", "enable_shift_cash_detail"]);
	hide_duplicate_dock_fields(frm, SHIFT_SETTINGS_FIELDS);
	$dock.find(".imogi-shift-status, .imogi-shift-quick-links").remove();
}

function layout_kitchen_settings(frm) {
	const ctx = get_settings_section(frm, "store_identity_section");
	if (!ctx || !ctx.$wrapper) return;

	lock_kitchen_dock_native_table_fields(frm);

	const $body = ctx.section.body || ctx.$wrapper.find(".section-body");
	let $dock = $body.find(".imogi-kitchen-settings-dock");
	if (!$dock.length) {
		$dock = $(`
			<div class="imogi-kitchen-settings-dock">
				<div class="imogi-kitchen-form-grid"></div>
			</div>`);
		$body.append($dock);
	}
	ensure_dock_section_head(
		$dock,
		is_fulfillment_rollout_enabled() ? __("Layanan, Dapur & Fulfillment") : __("Layanan & Dapur"),
		""
	);

	const $grid = $dock.find(".imogi-kitchen-form-grid");
	$grid.addClass("imogi-kitchen-form-grid--horizontal");
	mount_settings_dock_fields(frm, $grid, get_kitchen_settings_fields(), "imogi-kitchen-field");
	const kitchen_checkboxes = [
		"enable_table_service",
		"enable_qr_self_service",
		"enable_kitchen_display",
		...(is_fulfillment_rollout_enabled() ? ["enable_fulfillment"] : []),
	];
	group_dock_checkbox_row($grid, frm, kitchen_checkboxes);
	configure_kitchen_dock_tables(frm);
	get_kitchen_dock_table_fields().forEach((fieldname) => ensure_kitchen_dock_table_field(frm, fieldname));
	render_kitchen_dock_list_cards(frm, $dock);
	sync_dock_checkbox_from_doc(frm, kitchen_checkboxes);
	const table_on = cint(frm.doc.enable_table_service);
	const qr_on = table_on && cint(frm.doc.enable_qr_self_service);
	set_settings_field_disabled(frm, "enable_qr_self_service", !table_on);
	set_settings_field_disabled(frm, "qr_self_service_payment_mode", !qr_on);
	set_settings_field_disabled(frm, "qr_cash_cashier_flow", !qr_on);
	const kds_on = cint(frm.doc.enable_kitchen_display);
	set_settings_field_disabled(frm, "kds_station_mode", !kds_on);
	if (frm.fields_dict.kds_station_mode) {
		frm.set_df_property(
			"kds_station_mode",
			"description",
			__(
				"Kitchen Only = semua ke Dapur. Separate = makanan→Dapur, minuman→Bar. Combined = makanan+minuman di satu stasiun."
			)
		);
	}
	hide_duplicate_dock_fields(frm, get_kitchen_dock_all_fields());
	$dock.find(".imogi-kitchen-status, .imogi-kitchen-quick-links").remove();

	const flow_ctx = get_settings_section(frm, "flow_section");
	if (flow_ctx && flow_ctx.$wrapper) {
		flow_ctx.$wrapper.hide();
	}
}

function render_kitchen_dock_summary(frm) {
	const $status = frm.$wrapper.find(".imogi-kitchen-status");
	if (!$status.length) return;

	const table_on = cint(frm.doc.enable_table_service);
	const qr_on = table_on && cint(frm.doc.enable_qr_self_service);
	const kds_on = cint(frm.doc.enable_kitchen_display);
	const fulfillment_on = is_fulfillment_rollout_enabled() && cint(frm.doc.enable_fulfillment);

	const active = [];
	if (table_on) active.push(__("Table Service"));
	if (qr_on) active.push(__("QR Self-Service"));
	if (kds_on) {
		const mode = frm.doc.kds_station_mode || "Separate Kitchen and Bar";
		const mode_label =
			mode === "Kitchen Only"
				? __("KDS · Dapur saja")
				: mode === "Combined Kitchen & Bar"
					? __("KDS · Kitchen & Bar gabungan")
					: __("KDS · Dapur + Bar terpisah");
		active.push(mode_label);
	}
	if (fulfillment_on) active.push(__("Fulfillment"));

	$status
		.toggleClass("is-off", !active.length)
		.html(
			active.length
				? `<i class="fa fa-check-circle"></i> ${__("Aktif")}: ${active.join(" · ")}`
				: `<i class="fa fa-info-circle"></i> ${__(
						"Nonaktif — aktifkan modul layanan yang dipakai outlet ini."
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

function get_receipt_logo_preview_url(frm) {
	const path = (frm.doc.receipt_logo || "").trim();
	if (!path) return "";
	if (/^https?:\/\//i.test(path)) return path;
	return frappe.urllib.get_full_url(path);
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
	const logo_url = get_receipt_logo_preview_url(frm);
	const logo_html = logo_url
		? `<div class="imogi-rcpt-logo-wrap"><img class="imogi-rcpt-logo" src="${frappe.utils.escape_html(
				logo_url
		  )}" alt="Logo"></div>`
		: "";

	const paint = (email) => {
		if ($email.length) {
			$email.text(email || "—");
		}
		$paper.html(`
			${logo_html}
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
	["branch_pricing_section", "general_section", "flow_section"].forEach((section) => {
		hide_settings_section_shell(frm, section);
	});
	[
		"master_selling_price_list",
		"sync_prices_to_branches_on_import",
		"sync_branch_prices",
		"hq_push_menu_from_branch",
		"hq_ensure_branch_price_lists",
	].forEach((fieldname) => frm.toggle_display(fieldname, false));
	[...STORE_IDENTITY_GRID_ORDER, "target_monthly_sales", "multi_branch"].forEach((fieldname) =>
		frm.toggle_display(fieldname, true)
	);
	hide_settings_general_extras(frm);
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
