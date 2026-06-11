// Copyright (c) 2026, Imogi and contributors

frappe.provide("imogi_pos.feature_upgrade");

const IMOGI_UPGRADE_TIER_COLORS = {
	Free: "#94a3b8",
	Starter: "#38bdf8",
	Professional: "#f39c12",
	Enterprise: "#0f1f35",
};

imogi_pos.feature_upgrade.ensure_styles = function () {
	if (document.getElementById("imogi-feature-upgrade-css")) return;
	frappe.dom.set_style(
		`
		.imogi-upgrade-dialog .modal-content { border-radius: 16px; overflow: hidden; }
		.imogi-upgrade-dialog .modal-header {
			background: linear-gradient(135deg, #0f1f35, #1a3358);
			border: 0; color: #fff; padding: 18px 20px;
		}
		.imogi-upgrade-dialog .modal-title { font-size: 18px; font-weight: 700; }
		.imogi-upgrade-dialog .modal-body { padding: 20px; }
		.imogi-upgrade-card {
			background: #fff7ed; border: 1px solid #fdba74; border-radius: 12px;
			padding: 14px 16px; margin-bottom: 14px;
		}
		.imogi-upgrade-feature { color: #0f1f35; font-size: 17px; font-weight: 700; margin: 0 0 6px; }
		.imogi-upgrade-reason { color: #7c2d12; font-size: 13px; line-height: 1.5; margin: 0; }
		.imogi-upgrade-tier-row {
			align-items: center; display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px;
		}
		.imogi-upgrade-tier-pill {
			border-radius: 999px; font-size: 12px; font-weight: 700; padding: 5px 12px;
		}
		.imogi-upgrade-tier-pill.is-current { background: #f4f4f5; border: 1px solid #d4d4d8; color: #52525b; }
		.imogi-upgrade-tier-pill.is-required { background: #ffedd5; border: 1px solid #fdba74; color: #9a3412; }
		.imogi-upgrade-tier-arrow { color: #a1a1aa; font-size: 14px; }
		.imogi-upgrade-hint {
			background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
			color: #475569; font-size: 12px; line-height: 1.45; padding: 10px 12px;
		}
		.imogi-upgrade-dialog .modal-footer {
			background: #fafafa; border-top: 1px solid #e5e7eb; padding: 12px 20px;
		}
		.imogi-upgrade-dialog .btn-imogi-upgrade-matrix {
			background: #f39c12 !important; border-color: #d68910 !important; color: #fff !important;
			font-weight: 600 !important;
		}
		.imogi-cashier-order-type-btn.is-tier-locked,
		.imogi-cashier-hold-btn.is-tier-locked,
		.imogi-cashier-customer-row.is-tier-locked input,
		.imogi-cashier-customer-row.is-tier-locked button,
		.imogi-chip-marketplace.is-tier-locked {
			cursor: not-allowed; opacity: 0.72; position: relative;
		}
		.imogi-cashier-order-type-btn.is-tier-locked::after,
		.imogi-cashier-hold-btn.is-tier-locked::after {
			content: "\\1F512"; font-size: 10px; margin-left: 4px;
		}
		`,
		"imogi-feature-upgrade-css"
	);
};

imogi_pos.feature_upgrade.can_view_matrix = function () {
	return (
		frappe.user.has_role("Administrator") ||
		frappe.user.has_role("System Manager") ||
		frappe.user.has_role("Sales Manager") ||
		frappe.user.has_role("IMOGI Owner")
	);
};

imogi_pos.feature_upgrade.get_meta = function (page, feature_key) {
	return (page?.context?.feature_meta || {})[feature_key] || {};
};

imogi_pos.feature_upgrade.build_message = function (meta, page, feature_key) {
	const reason = meta.blocked_reason || "tier";
	const label = meta.label || feature_key || __("Fitur");
	const current_tier = page?.context?.subscription_tier || "Enterprise";

	if (reason === "planned") {
		return {
			title: __("Segera Hadir"),
			body: __("Fitur <b>{0}</b> sedang dalam pengembangan.", [label]),
			hint: __("Fitur ini akan tersedia di update mendatang."),
			show_matrix: false,
		};
	}

	if (reason === "settings") {
		return {
			title: __("Fitur Belum Diaktifkan"),
			body: __("Fitur <b>{0}</b> tersedia di paket Anda, tetapi belum diaktifkan.", [label]),
			hint: __("Minta admin mengaktifkan fitur ini di IMOGI POS Settings."),
			show_matrix: imogi_pos.feature_upgrade.can_view_matrix(),
		};
	}

	if (reason === "role") {
		const required = meta.required_role || __("Staff");
		const mine = (page?.context?.role_context?.matrix_roles || frappe.boot?.imogi_pos_role_context?.matrix_roles || []).join(
			", "
		);
		return {
			title: __("Akses Role Dibatasi"),
			body: __("Fitur <b>{0}</b> memerlukan role <b>{1}</b>.", [label, required]),
			hint: mine
				? __("Role Anda: {0}. Hubungi supervisor untuk akses.", [mine])
				: __("Role Anda belum dipetakan. Hubungi admin."),
			show_matrix: imogi_pos.feature_upgrade.can_view_matrix(),
		};
	}

	const trigger = (meta.trigger_upgrade || "").trim();
	return {
		title: __("Upgrade Paket Diperlukan"),
		body: __("Fitur <b>{0}</b> memerlukan paket <b>{1}</b> atau lebih tinggi.", [
			label,
			meta.min_tier || "Enterprise",
		]),
		hint: trigger
			? __("Paket Anda: {0}. {1}", [current_tier, trigger])
			: __("Paket Anda saat ini: {0}.", [current_tier]),
		show_matrix: imogi_pos.feature_upgrade.can_view_matrix(),
	};
};

imogi_pos.feature_upgrade.prompt = function (page, feature_key, options = {}) {
	imogi_pos.feature_upgrade.ensure_styles();

	const meta = imogi_pos.feature_upgrade.get_meta(page, feature_key);
	const copy = imogi_pos.feature_upgrade.build_message(meta, page, feature_key);
	const current_tier = page?.context?.subscription_tier || "Enterprise";
	const required_tier = meta.min_tier || "Enterprise";
	const current_color = IMOGI_UPGRADE_TIER_COLORS[current_tier] || "#94a3b8";
	const required_color = IMOGI_UPGRADE_TIER_COLORS[required_tier] || "#f39c12";

	const dialog = new frappe.ui.Dialog({
		title: options.title || copy.title,
		size: "small",
		fields: [
			{
				fieldtype: "HTML",
				options: `<div class="imogi-upgrade-card">
					<p class="imogi-upgrade-feature">${frappe.utils.escape_html(meta.label || feature_key)}</p>
					<p class="imogi-upgrade-reason">${copy.body}</p>
				</div>
				${
					meta.blocked_reason === "tier"
						? `<div class="imogi-upgrade-tier-row">
							<span class="imogi-upgrade-tier-pill is-current" style="border-color:${current_color};color:${current_color}">
								${__("Paket Anda")}: ${frappe.utils.escape_html(current_tier)}
							</span>
							<span class="imogi-upgrade-tier-arrow">→</span>
							<span class="imogi-upgrade-tier-pill is-required" style="border-color:${required_color};color:${required_color}">
								${__("Butuh")}: ${frappe.utils.escape_html(required_tier)}
							</span>
						</div>`
						: ""
				}
				<div class="imogi-upgrade-hint">${copy.hint}</div>`,
			},
		],
		primary_action_label: __("Mengerti"),
		primary_action() {
			dialog.hide();
		},
	});

	dialog.$wrapper.addClass("imogi-upgrade-dialog");

	if (copy.show_matrix) {
		dialog.set_secondary_action_label(__("Lihat Matriks Fitur"));
		dialog.set_secondary_action(() => {
			dialog.hide();
			frappe.set_route("imogi-pos-feature-matrix");
		});
	}

	dialog.show();
	return false;
};

imogi_pos.feature_upgrade.from_server_error = function (page, exc) {
	const message = (exc && (exc.message || exc._server_messages)) || "";
	let text = "";
	if (typeof message === "string") {
		text = message;
	} else if (Array.isArray(message) && message.length) {
		try {
			text = JSON.parse(message[0]).message || "";
		} catch (e) {
			text = String(message[0] || "");
		}
	}
	if (!text) return false;

	const stripped = frappe.utils.strip_html(text).toLowerCase();
	if (!stripped.includes("paket") && !stripped.includes("fitur") && !stripped.includes("langganan")) {
		return false;
	}

	const feature_meta = page?.context?.feature_meta || {};
	const locked = Object.entries(feature_meta).find(([, meta]) => meta && !meta.allowed);
	if (locked) {
		imogi_pos.feature_upgrade.prompt(page, locked[0]);
		return true;
	}

	frappe.msgprint({
		title: __("Paket Tidak Mencukupi"),
		message: text,
		indicator: "orange",
	});
	return true;
};
