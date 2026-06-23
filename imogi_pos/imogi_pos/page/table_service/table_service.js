const IMOGI_TABLE_STATUS_CLASS = {
	Available: "is-available",
	Occupied: "is-occupied",
	Reserved: "is-reserved",
};

const IMOGI_TS_WAITER_ESCALATION = [
	"Administrator",
	"System Manager",
	"Sales Manager",
	"IMOGI Owner",
	"IMOGI Manager",
	"IMOGI Area Manager",
	"IMOGI Supervisor",
	"IMOGI Cashier",
];

function imogi_ts_is_dedicated_waiter() {
	if (imogi_pos.is_dedicated_waiter_user?.()) {
		return true;
	}
	const roles = frappe.boot?.user?.roles || [];
	return roles.includes("IMOGI Waiter") && !IMOGI_TS_WAITER_ESCALATION.some((role) => roles.includes(role));
}

const IMOGI_TS_DESK_TOPBAR_STYLE_ID = "imogi-ts-desk-topbar-css-v1";
const IMOGI_TS_FULLWIDTH_STYLE_ID = "imogi-ts-fullwidth-css-v1";

function imogi_ts_ensure_fullwidth_css() {
	if (document.getElementById(IMOGI_TS_FULLWIDTH_STYLE_ID)) {
		return;
	}
	frappe.dom.set_style(
		`
		body.imogi-table-service-fullscreen .container,
		body.imogi-table-service-fullscreen .container.page-body,
		body.imogi-table-service-fullscreen .page-wrapper,
		body.imogi-table-service-fullscreen .page-content,
		body.imogi-table-service-fullscreen .row.layout-main,
		body.imogi-table-service-fullscreen .layout-main-section-wrapper,
		body.imogi-table-service-fullscreen .layout-main-section-wrapper > [class*="col-"],
		body.imogi-table-service-fullscreen .layout-main,
		body.imogi-table-service-fullscreen .page-container,
		body.imogi-table-service-fullscreen .main-section,
		body.imogi-table-service-fullscreen .content.page-container,
		body.imogi-table-service-fullscreen .imogi-table-service-page.layout-main-section,
		body.imogi-table-service-fullscreen .imogi-table-service-page,
		body.imogi-table-service-fullscreen .imogi-ts-shell,
		body.imogi-table-service-fullscreen .imogi-ts-topbar.imogi-ts-topbar--desk {
			box-sizing: border-box !important;
			margin-left: 0 !important;
			margin-right: 0 !important;
			max-width: 100% !important;
			padding-left: 0 !important;
			padding-right: 0 !important;
			width: 100% !important;
		}
		body.imogi-table-service-fullscreen .layout-main-section-wrapper {
			flex: 0 0 100% !important;
		}
		body.imogi-table-service-fullscreen .row.layout-main {
			margin-left: 0 !important;
			margin-right: 0 !important;
		}
		body.imogi-table-service-fullscreen .imogi-table-service-page.layout-main-section {
			border: 0 !important;
			border-radius: 0 !important;
			box-shadow: none !important;
		}
		body.imogi-table-service-fullscreen .imogi-ts-topbar.imogi-ts-topbar--desk {
			border-radius: 0 !important;
			flex-shrink: 0 !important;
		}
		`,
		IMOGI_TS_FULLWIDTH_STYLE_ID
	);
}

function imogi_ts_ensure_desk_topbar_css() {
	if (document.getElementById(IMOGI_TS_DESK_TOPBAR_STYLE_ID)) {
		return;
	}
	frappe.dom.set_style(
		`
		.imogi-ts-topbar.imogi-ts-topbar--desk,
		body.imogi-table-service-fullscreen .imogi-ts-topbar.imogi-ts-topbar--desk,
		body.imogi-table-service-active .imogi-ts-topbar.imogi-ts-topbar--desk {
			background: #0b141a !important;
			background-color: #0b141a !important;
			border: 0 !important;
			border-radius: 0 !important;
			box-shadow: none !important;
			color: #fff !important;
		}
		.imogi-ts-topbar.imogi-ts-topbar--desk .imogi-ts-desk-brand-title,
		.imogi-ts-topbar.imogi-ts-topbar--desk .imogi-ts-topbar-left,
		.imogi-ts-topbar.imogi-ts-topbar--desk .imogi-ts-topbar-right {
			color: #fff !important;
		}
		.imogi-ts-topbar.imogi-ts-topbar--desk .imogi-ts-stat-pill {
			background: rgba(255, 255, 255, 0.08) !important;
			border-color: rgba(255, 255, 255, 0.14) !important;
			color: rgba(255, 255, 255, 0.92) !important;
		}
		.imogi-ts-topbar.imogi-ts-topbar--desk .imogi-ts-stat-pill .imogi-ts-stat-num {
			color: #fff !important;
		}
		.imogi-ts-topbar.imogi-ts-topbar--desk .imogi-ts-stat-pill--reserved {
			background: rgba(251, 146, 60, 0.16) !important;
			border-color: rgba(251, 146, 60, 0.35) !important;
			color: #fdba74 !important;
		}
		.imogi-ts-topbar.imogi-ts-topbar--desk .imogi-ts-stat-pill--waiting {
			background: rgba(59, 130, 246, 0.16) !important;
			border-color: rgba(59, 130, 246, 0.35) !important;
			color: #93c5fd !important;
		}
		.imogi-ts-topbar.imogi-ts-topbar--desk .imogi-ts-refresh,
		.imogi-ts-topbar.imogi-ts-topbar--desk .imogi-ts-logout-btn {
			background: rgba(255, 255, 255, 0.08) !important;
			border: 1px solid rgba(255, 255, 255, 0.28) !important;
			color: #fff !important;
		}
		`,
		IMOGI_TS_DESK_TOPBAR_STYLE_ID
	);
}

function imogi_ts_paint_desk_topbar(root) {
	imogi_ts_ensure_desk_topbar_css();
	const scope = root && root.querySelector ? root : document;
	scope.querySelectorAll(".imogi-ts-topbar--desk").forEach((bar) => {
		bar.style.setProperty("background", "#0b141a", "important");
		bar.style.setProperty("background-color", "#0b141a", "important");
		bar.style.setProperty("color", "#fff", "important");
		bar.style.setProperty("border", "0", "important");
	});
	scope.querySelectorAll(".imogi-ts-topbar--desk .imogi-ts-desk-brand-title").forEach((el) => {
		el.style.setProperty("color", "#fff", "important");
	});
}

imogi_pos.paint_table_service_topbar = imogi_ts_paint_desk_topbar;

const IMOGI_TS_MODAL_STYLE_ID = "imogi-ts-modal-css-v1";

function imogi_ts_ensure_modal_css() {
	if (document.getElementById(IMOGI_TS_MODAL_STYLE_ID)) {
		return;
	}
	frappe.dom.set_style(
		`
		.modal.imogi-ts-dialog { z-index: 2000 !important; }
		.modal.imogi-ts-dialog + .modal-backdrop { z-index: 1990 !important; }
		.imogi-ts-dialog .modal-dialog {
			margin: 1.5rem auto !important;
			max-width: min(520px, 94vw) !important;
			width: min(520px, 94vw) !important;
		}
		.imogi-ts-dialog.imogi-ts-dialog--wide .modal-dialog {
			max-width: min(640px, 96vw) !important;
			width: min(640px, 96vw) !important;
		}
		.imogi-ts-dialog .modal-content {
			border: 1px solid #e4e4e7;
			border-radius: 18px;
			box-shadow: 0 24px 64px rgba(15, 31, 53, 0.18);
			overflow: hidden;
		}
		.imogi-ts-dialog .modal-header {
			align-items: flex-start;
			background: linear-gradient(180deg, #0f1f35 0%, #152a45 100%);
			border: 0;
			display: flex;
			gap: 12px;
			padding: 18px 20px 16px;
		}
		.imogi-ts-dialog .modal-header .close {
			color: rgba(255, 255, 255, 0.82);
			font-size: 22px;
			font-weight: 400;
			margin: -4px -6px 0 0;
			opacity: 1;
			text-shadow: none;
		}
		.imogi-ts-dialog .modal-header .close:hover { color: #fff; }
		.imogi-ts-dialog__icon {
			align-items: center;
			background: rgba(255, 255, 255, 0.12);
			border: 1px solid rgba(255, 255, 255, 0.16);
			border-radius: 12px;
			color: #fff;
			display: flex;
			flex-shrink: 0;
			font-size: 18px;
			height: 42px;
			justify-content: center;
			width: 42px;
		}
		.imogi-ts-dialog__title-wrap { flex: 1; min-width: 0; }
		.imogi-ts-dialog__title {
			color: #fff;
			font-size: 18px;
			font-weight: 800;
			line-height: 1.2;
		}
		.imogi-ts-dialog__sub {
			color: rgba(255, 255, 255, 0.72);
			font-size: 12px;
			line-height: 1.35;
			margin-top: 4px;
		}
		.imogi-ts-dialog .modal-body {
			background: #f8fafc;
			max-height: min(70vh, 640px);
			overflow-x: hidden;
			overflow-y: auto;
			padding: 18px 20px 8px;
		}
		.imogi-ts-dialog .form-section .section-head,
		.imogi-ts-dialog .form-section .section-body h6 {
			border: 0;
			color: #0f1f35;
			font-size: 12px;
			font-weight: 800;
			letter-spacing: 0.04em;
			margin: 0 0 12px;
			padding: 0;
			text-transform: uppercase;
		}
		.imogi-ts-dialog .frappe-control { margin-bottom: 14px !important; }
		.imogi-ts-dialog .frappe-control .control-label {
			color: #334155;
			font-size: 12px;
			font-weight: 700;
			margin-bottom: 6px;
		}
		.imogi-ts-dialog .form-control,
		.imogi-ts-dialog .awesomplete input,
		.imogi-ts-dialog textarea {
			background: #fff !important;
			border: 1px solid #d4d4d8 !important;
			border-radius: 10px !important;
			box-shadow: none !important;
			color: #0f172a !important;
			font-size: 14px !important;
			min-height: 42px;
			padding: 10px 12px !important;
		}
		.imogi-ts-dialog textarea { min-height: 88px; resize: vertical; }
		.imogi-ts-dialog .form-control:focus,
		.imogi-ts-dialog textarea:focus {
			border-color: #0f1f35 !important;
			box-shadow: 0 0 0 3px rgba(15, 31, 53, 0.1) !important;
		}
		.imogi-ts-dialog .modal-footer {
			background: #fff;
			border-top: 1px solid #e4e4e7;
			display: flex;
			gap: 10px;
			justify-content: flex-end;
			padding: 14px 20px 16px;
		}
		.imogi-ts-dialog .modal-footer .btn-modal-secondary,
		.imogi-ts-dialog .modal-footer .btn-secondary {
			background: #fff !important;
			border: 1px solid #d4d4d8 !important;
			border-radius: 10px !important;
			color: #334155 !important;
			font-weight: 700 !important;
			min-width: 96px;
			padding: 10px 16px !important;
		}
		.imogi-ts-dialog .modal-footer .btn-primary {
			background: #0f1f35 !important;
			border: none !important;
			border-radius: 10px !important;
			box-shadow: none !important;
			color: #fff !important;
			font-weight: 800 !important;
			min-width: 120px;
			padding: 10px 18px !important;
		}
		.imogi-ts-dialog .modal-footer .btn-primary:hover { background: #1a3352 !important; }
		.imogi-ts-dialog__table-grid {
			display: grid;
			gap: 8px;
			grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
			margin-bottom: 6px;
			max-height: 180px;
			overflow: auto;
			padding: 2px;
		}
		.imogi-ts-dialog__table-chip {
			background: #fff;
			border: 1px solid #e2e8f0;
			border-radius: 12px;
			padding: 10px 12px;
		}
		.imogi-ts-dialog__table-chip strong {
			color: #0f172a;
			display: block;
			font-size: 15px;
		}
		.imogi-ts-dialog__table-chip span {
			color: #64748b;
			display: block;
			font-size: 11px;
			margin-top: 2px;
		}
		.imogi-ts-dialog__table-chip.is-occupied { background: #fff7ed; border-color: #fdba74; }
		.imogi-ts-dialog__table-chip.is-reserved { background: #eff6ff; border-color: #93c5fd; }
		.imogi-ts-dialog__empty-note {
			background: #fff;
			border: 1px dashed #cbd5e1;
			border-radius: 12px;
			color: #64748b;
			font-size: 13px;
			margin-bottom: 8px;
			padding: 16px;
			text-align: center;
		}
		.imogi-ts-panel-head .btn-primary,
		.imogi-ts-table-actions .btn-primary,
		.imogi-ts-list-actions .btn-primary {
			background: #0f1f35 !important;
			border-color: #0f1f35 !important;
			color: #fff !important;
		}
		.imogi-ts-list-item {
			background: #fff;
			border: 1px solid #e2e8f0;
			border-radius: 14px;
			box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
			padding: 14px;
		}
		.imogi-ts-list-item--reservation { border-left: 4px solid #fb923c; }
		.imogi-ts-list-item--waiting { border-left: 4px solid #3b82f6; }
		.imogi-ts-list-head strong { color: #0f172a; font-size: 14px; }
		.imogi-ts-list-badge {
			background: #f1f5f9;
			border: 1px solid #e2e8f0;
			color: #334155;
		}
		.imogi-ts-list-badge--reserved { background: #fff7ed; border-color: #fed7aa; color: #9a3412; }
		.imogi-ts-list-badge--waiting { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
		.imogi-ts-list-empty {
			background: #f8fafc;
			border: 1px dashed #cbd5e1;
			border-radius: 14px;
			color: #64748b;
			font-size: 13px;
			margin: 12px;
			min-height: 160px;
		}
		`,
		IMOGI_TS_MODAL_STYLE_ID
	);
}

function imogi_ts_decorate_dialog(dialog, { title, subtitle, icon, wide = false }) {
	imogi_ts_ensure_modal_css();
	dialog.$wrapper.addClass("imogi-ts-dialog");
	if (wide) {
		dialog.$wrapper.addClass("imogi-ts-dialog--wide");
	}
	const $header = dialog.$wrapper.find(".modal-header");
	$header.html(`
		<div class="imogi-ts-dialog__icon"><i class="fa ${frappe.utils.escape_html(icon || "fa-pencil")}"></i></div>
		<div class="imogi-ts-dialog__title-wrap">
			<div class="imogi-ts-dialog__title">${frappe.utils.escape_html(title || "")}</div>
			${subtitle ? `<div class="imogi-ts-dialog__sub">${frappe.utils.escape_html(subtitle)}</div>` : ""}
		</div>
		<button type="button" class="close" data-dismiss="modal" aria-label="${__("Close")}">
			<span aria-hidden="true">&times;</span>
		</button>
	`);
	$header.find(".close").on("click", () => dialog.hide());
}

function imogi_ts_open_form_dialog({ title, subtitle, icon, fields, primary_label, wide, on_submit }) {
	const dialog = new frappe.ui.Dialog({
		title: title || "",
		fields: fields || [],
		primary_action_label: primary_label || __("Simpan"),
		primary_action(values) {
			const keep_open = on_submit?.(values, dialog) === false;
			if (!keep_open) {
				dialog.hide();
			}
		},
	});
	imogi_ts_decorate_dialog(dialog, { title, subtitle, icon, wide });
	dialog.show();
	return dialog;
}

function imogi_ts_build_manage_tables_html(tables) {
	if (!tables.length) {
		return `<div class="imogi-ts-dialog__empty-note">${__("Belum ada meja. Tambahkan meja pertama di bawah.")}</div>`;
	}
	const chips = tables
		.map((table) => {
			const status_class =
				table.status === "Occupied"
					? "is-occupied"
					: table.status === "Reserved"
						? "is-reserved"
						: "";
			return `
				<div class="imogi-ts-dialog__table-chip ${status_class}">
					<strong>${frappe.utils.escape_html(table.table_number || table.name)}</strong>
					<span>${frappe.utils.escape_html(table.location || __("Tanpa zona"))} · ${table.capacity || 0} ${__("org")}</span>
					<span>${frappe.utils.escape_html(table.status || "Available")}</span>
				</div>`;
		})
		.join("");
	return `<div class="imogi-ts-dialog__table-grid">${chips}</div>`;
}

function imogi_ts_table_select_options(tables) {
	return ["", ...(tables || []).map((t) => t.name)];
}

function imogi_ts_default_reservation_datetime() {
	return moment().add(1, "hour").format("YYYY-MM-DD HH:mm:ss");
}

function imogi_ts_apply_fullscreen(enable) {
	const dedicated = imogi_ts_is_dedicated_waiter();
	document.body.classList.toggle("imogi-table-service-active", enable);
	document.body.classList.toggle("imogi-pos-cashier-fullscreen", enable);
	document.body.classList.toggle("imogi-table-service-fullscreen", enable);
	document.documentElement.classList.toggle("imogi-pos-waiter-dedicated", enable && dedicated);
	if (enable) {
		document.querySelectorAll(".page-head, .sticky-top").forEach((el) => {
			el.style.setProperty("display", "none", "important");
		});
		imogi_ts_apply_layout_fix();
	} else {
		document.querySelectorAll(".page-head, .sticky-top").forEach((el) => {
			el.style.removeProperty("display");
		});
		imogi_ts_clear_layout_fix();
	}
	imogi_pos.sync_desk_theme?.();
	imogi_pos.paint_table_service_canvas?.();
	imogi_ts_paint_desk_topbar();
}

function imogi_ts_apply_layout_fix() {
	imogi_ts_ensure_fullwidth_css();
	const page = document.querySelector(".imogi-table-service-page");
	const wrapper = page?.closest(".layout-main-section-wrapper");
	const chain = [
		document.querySelector(".content.page-container"),
		document.querySelector(".page-container"),
		document.querySelector(".main-section"),
		document.querySelector(".container.page-body"),
		document.querySelector(".page-wrapper"),
		document.querySelector(".page-content"),
		document.querySelector(".row.layout-main"),
		wrapper?.closest("[class*='col-']"),
		document.querySelector(".layout-main"),
		wrapper,
		page,
		page?.querySelector(".page-body"),
		document.querySelector(".imogi-ts-shell"),
		document.querySelector(".imogi-ts-topbar--desk"),
	].filter(Boolean);

	chain.forEach((el, idx) => {
		el.style.setProperty("margin-top", "0", "important");
		el.style.setProperty("margin-left", "0", "important");
		el.style.setProperty("margin-right", "0", "important");
		el.style.setProperty("max-width", "100%", "important");
		el.style.setProperty("width", "100%", "important");
		el.style.setProperty("box-sizing", "border-box", "important");
		el.style.setProperty("padding-left", "0", "important");
		el.style.setProperty("padding-right", "0", "important");
		if (idx <= 9) {
			el.style.setProperty("display", "flex", "important");
			el.style.setProperty("flex-direction", "column", "important");
			el.style.setProperty("height", "100dvh", "important");
			el.style.setProperty("max-height", "100dvh", "important");
			el.style.setProperty("min-height", "0", "important");
			el.style.setProperty("overflow", "hidden", "important");
			el.style.setProperty("padding-top", "0", "important");
			el.style.setProperty("padding-bottom", "0", "important");
		} else if (el.classList?.contains("imogi-ts-topbar--desk")) {
			el.style.setProperty("flex-shrink", "0", "important");
			el.style.removeProperty("height");
			el.style.removeProperty("max-height");
		} else {
			el.style.setProperty("display", "flex", "important");
			el.style.setProperty("flex-direction", "column", "important");
			el.style.setProperty("flex", "1", "important");
			el.style.setProperty("min-height", "0", "important");
			el.style.setProperty("overflow", "hidden", "important");
			el.style.setProperty("padding", "0", "important");
			el.style.removeProperty("height");
			el.style.removeProperty("max-height");
		}
	});
}

function imogi_ts_clear_layout_fix() {
	document
		.querySelectorAll(
			".content.page-container, .page-container, .main-section, .container.page-body, .page-wrapper, .page-content, .row.layout-main, .layout-main, .layout-main-section-wrapper, .imogi-table-service-page, .imogi-table-service-page .page-body, .imogi-ts-shell, .imogi-ts-topbar--desk"
		)
		.forEach((el) => {
			[
				"margin-top",
				"margin-left",
				"margin-right",
				"padding-left",
				"padding-right",
				"padding-top",
				"padding-bottom",
				"flex-shrink",
				"max-width",
				"width",
				"box-sizing",
				"display",
				"flex-direction",
				"height",
				"max-height",
				"min-height",
				"overflow",
				"padding",
				"flex",
			].forEach((prop) => el.style.removeProperty(prop));
		});
}

frappe.pages["table-service"].on_page_load = function (wrapper) {
	const dedicated = imogi_ts_is_dedicated_waiter();
	imogi_ts_ensure_desk_topbar_css();
	imogi_ts_ensure_fullwidth_css();

	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __("Table Service"),
		single_column: true,
	});
	page.main.addClass("imogi-table-service-page");
	$(wrapper).find(".page-head").hide();
	$(wrapper).find(".layout-main-section-wrapper").css("max-width", "100%");

	wrapper.table_service_page = new imogi_pos.TableService(page, wrapper);
	imogi_ts_apply_fullscreen(true);
	imogi_pos.activate_table_service_shell?.(wrapper);

	if (!dedicated) {
		frappe.breadcrumbs.add("Imogi POS");
	}
};

frappe.pages["table-service"].on_page_show = function (wrapper) {
	imogi_ts_apply_fullscreen(true);
	imogi_pos.activate_table_service_shell?.(wrapper);
	wrapper.table_service_page?.sync_shell?.();
};

frappe.pages["table-service"].on_page_hide = function () {
	imogi_ts_apply_fullscreen(false);
};

imogi_pos.TableService = class TableService {
	constructor(page, wrapper) {
		this.page = page;
		this.wrapper = $(page.body);
		this.$page_wrapper = wrapper ? $(wrapper) : this.wrapper.closest(".page-container");
		this.dedicated_waiter = imogi_ts_is_dedicated_waiter();
		this.board = { tables: [], reservations: [], waiting: [], features: {} };
		this.refresh_interval = 30;
		this.make();
		this.refresh();
	}

	sync_shell() {
		imogi_ts_apply_fullscreen(true);
		imogi_pos.activate_table_service_shell?.(this.$page_wrapper?.[0]);
	}

	make() {
		const logo_url =
			frappe.boot?.imogi_pos_logo_white_url || "/assets/imogi_pos/images/imogi-pos-logo-white.png";
		const topbar = this.dedicated_waiter
			? `
				<div class="imogi-ts-topbar imogi-ts-topbar--desk" style="background:#0b141a!important;background-color:#0b141a!important;color:#fff!important;border:0!important;">
					<div class="imogi-ts-topbar-left">
						<div class="imogi-ts-desk-brand">
							<img class="imogi-ts-desk-logo" src="${frappe.utils.escape_html(logo_url)}" alt="IMOGI" />
							<div class="imogi-ts-desk-brand-title" style="color:#fff!important;">${__("Table Service")}</div>
						</div>
					</div>
					<div class="imogi-ts-topbar-right">
						<span class="imogi-ts-stat-pill">${__("Meja")} <span class="imogi-ts-stat-num imogi-ts-stat-tables">0</span></span>
						<span class="imogi-ts-stat-pill imogi-ts-stat-pill--reserved">${__("Reservasi")} <span class="imogi-ts-stat-num imogi-ts-stat-reservations">0</span></span>
						<span class="imogi-ts-stat-pill imogi-ts-stat-pill--waiting">${__("Antrian")} <span class="imogi-ts-stat-num imogi-ts-stat-waiting">0</span></span>
						<button type="button" class="btn btn-xs btn-default imogi-ts-refresh">
							<i class="fa fa-refresh"></i>
							<span class="imogi-ts-refresh-label">${__("Refresh")} 30s</span>
						</button>
						<button type="button" class="btn btn-xs btn-default imogi-ts-logout-btn">
							<i class="fa fa-sign-out"></i> ${__("Logout")}
						</button>
					</div>
				</div>`
			: `
				<div class="imogi-ts-topbar">
					<div class="imogi-kds-topbar-left">
						<div class="imogi-kds-brand">
							<div class="imogi-ts-brand-icon"><i class="fa fa-th"></i></div>
							<div>
								<div class="imogi-ts-brand-title">${__("Table Service")}</div>
								<div class="imogi-ts-brand-sub">${__("Meja, reservasi, dan antrian tamu")}</div>
							</div>
						</div>
					</div>
					<div class="imogi-kds-topbar-right">
						<span class="imogi-ts-stat-pill">${__("Meja")} <span class="imogi-ts-stat-num imogi-ts-stat-tables">0</span></span>
						<span class="imogi-ts-stat-pill imogi-ts-stat-pill--reserved">${__("Reservasi")} <span class="imogi-ts-stat-num imogi-ts-stat-reservations">0</span></span>
						<span class="imogi-ts-stat-pill imogi-ts-stat-pill--waiting">${__("Antrian")} <span class="imogi-ts-stat-num imogi-ts-stat-waiting">0</span></span>
						<button type="button" class="imogi-kds-refresh imogi-ts-refresh">
							<i class="fa fa-refresh"></i>
							<span class="imogi-ts-refresh-label">${__("Refresh")} 30s</span>
						</button>
					</div>
				</div>`;

		this.wrapper.html(`
			<div class="imogi-ts-shell ${this.dedicated_waiter ? "imogi-ts-shell--desk" : ""}">
				${topbar}
				<div class="imogi-ts-layout">
					<section class="imogi-ts-panel imogi-ts-panel--tables">
						<div class="imogi-ts-panel-head">
							<h4>${__("Denah Meja")}</h4>
							<button type="button" class="btn btn-xs btn-default imogi-ts-new-table">${__("Kelola Meja")}</button>
						</div>
						<div class="imogi-ts-table-grid"></div>
					</section>
					<section class="imogi-ts-panel imogi-ts-panel--reservations">
						<div class="imogi-ts-panel-head">
							<h4>${__("Reservasi")}</h4>
							<button type="button" class="btn btn-xs btn-primary imogi-ts-add-reservation">${__("Tambah")}</button>
						</div>
						<div class="imogi-ts-reservation-list"></div>
					</section>
					<section class="imogi-ts-panel imogi-ts-panel--waiting">
						<div class="imogi-ts-panel-head">
							<h4>${__("Waiting List")}</h4>
							<button type="button" class="btn btn-xs btn-primary imogi-ts-add-waiting">${__("Tambah")}</button>
						</div>
						<div class="imogi-ts-waiting-list"></div>
					</section>
				</div>
			</div>
		`);

		this.$table_grid = this.wrapper.find(".imogi-ts-table-grid");
		this.$reservation_list = this.wrapper.find(".imogi-ts-reservation-list");
		this.$waiting_list = this.wrapper.find(".imogi-ts-waiting-list");

		this.wrapper.find(".imogi-ts-refresh").on("click", () => this.refresh());
		this.wrapper.find(".imogi-ts-logout-btn").on("click", () => {
			frappe.confirm(__("Logout dari Table Service?"), () => {
				frappe.call({ method: "logout", callback: () => (window.location.href = "/login") });
			});
		});
		this.wrapper.find(".imogi-ts-new-table").on("click", () => this.prompt_manage_tables());
		this.wrapper.find(".imogi-ts-add-reservation").on("click", () => this.prompt_reservation());
		this.wrapper.find(".imogi-ts-add-waiting").on("click", () => this.prompt_waiting_guest());
		imogi_ts_paint_desk_topbar(this.wrapper[0]);
	}

	refresh() {
		frappe.call({
			method: "imogi_pos.api.table_api.get_table_service_board",
			callback: (r) => {
				this.board = r.message || this.board;
				this.render();
				this._apply_refresh_timer(this.board.refresh_seconds);
			},
		});
	}

	_apply_refresh_timer(seconds) {
		if (this._timer) clearInterval(this._timer);
		this.refresh_interval = cint(seconds) || 30;
		this.wrapper.find(".imogi-ts-refresh-label").text(`${__("Refresh")} ${this.refresh_interval}s`);
		this._timer = setInterval(() => this.refresh(), this.refresh_interval * 1000);
	}

	render() {
		const { tables = [], reservations = [], waiting = [], features = {} } = this.board;
		this.wrapper.find(".imogi-ts-stat-tables").text(tables.length);
		this.wrapper.find(".imogi-ts-stat-reservations").text(reservations.length);
		this.wrapper.find(".imogi-ts-stat-waiting").text(waiting.length);

		this.wrapper.find(".imogi-ts-add-reservation").toggle(!!features.table_reservation);
		this.wrapper.find(".imogi-ts-panel--reservations").toggle(!!features.table_reservation);
		this.wrapper.find(".imogi-ts-add-waiting").toggle(!!features.waiting_list);
		this.wrapper.find(".imogi-ts-panel--waiting").toggle(!!features.waiting_list);

		this.render_tables(tables, features);
		this.render_reservations(reservations, features);
		this.render_waiting(waiting, features);
	}

	render_tables(tables, features) {
		this.$table_grid.empty();
		if (!tables.length) {
			this.$table_grid.html(`
				<div class="imogi-ts-empty">
					<i class="fa fa-th-large"></i>
					<h4>${__("Belum ada meja")}</h4>
					<p>${__("Buat meja restoran terlebih dahulu.")}</p>
				</div>`);
			return;
		}

		tables.forEach((table) => {
			const status_class = IMOGI_TABLE_STATUS_CLASS[table.status] || "";
			const $card = $(`
				<article class="imogi-ts-table-card ${status_class}">
					<div class="imogi-ts-table-num">${frappe.utils.escape_html(table.table_number || table.name)}</div>
					<div class="imogi-ts-table-meta">${frappe.utils.escape_html(table.location || __("Tanpa zona"))} · ${table.capacity || 0} ${__("org")}</div>
					<div class="imogi-ts-table-status">${frappe.utils.escape_html(table.status || "Available")}</div>
					<div class="imogi-ts-table-order"></div>
					<div class="imogi-ts-table-actions"></div>
				</article>
			`);

			if (table.open_order) {
				$card.find(".imogi-ts-table-order").html(`
					<div class="imogi-ts-order-ref">${frappe.utils.escape_html(table.open_order)}</div>
					<div class="imogi-ts-order-meta">${frappe.utils.escape_html(table.open_order_customer || __("Walk-in"))} · ${format_currency(table.open_order_total || 0)}</div>
				`);
			}

			const $actions = $card.find(".imogi-ts-table-actions");
			if (table.open_order) {
				$actions.append(`<button type="button" class="btn btn-xs btn-default" data-action="open-order">${__("Order")}</button>`);
				if (features.move_table) {
					$actions.append(`<button type="button" class="btn btn-xs btn-default" data-action="move">${__("Pindah")}</button>`);
				}
			} else if (table.status === "Available" || table.status === "Reserved") {
				$actions.append(`<button type="button" class="btn btn-xs btn-primary" data-action="new-order">${__("Order Baru")}</button>`);
			}

			$card.on("click", "[data-action='open-order']", (e) => {
				e.stopPropagation();
				frappe.set_route("Form", "Riwayat Order", table.open_order);
			});
			$card.on("click", "[data-action='move']", (e) => {
				e.stopPropagation();
				this.prompt_move_table(table);
			});
			$card.on("click", "[data-action='new-order']", (e) => {
				e.stopPropagation();
				this.open_cashier_for_table(table);
			});

			this.$table_grid.append($card);
		});
	}

	render_reservations(reservations) {
		this.$reservation_list.empty();
		if (!reservations.length) {
			this.$reservation_list.html(`<div class="imogi-ts-list-empty">${__("Tidak ada reservasi aktif")}</div>`);
			return;
		}

		reservations.forEach((row, idx) => {
			const when = frappe.datetime.str_to_user(row.reservation_datetime);
			const $item = $(`
				<div class="imogi-ts-list-item imogi-ts-list-item--reservation">
					<div class="imogi-ts-list-head">
						<strong><i class="fa fa-calendar-o" style="margin-right:6px;color:#fb923c;"></i>${frappe.utils.escape_html(row.customer_name)}</strong>
						<span class="imogi-ts-list-badge imogi-ts-list-badge--reserved">${row.party_size} ${__("org")}</span>
					</div>
					<div class="imogi-ts-list-meta">${frappe.utils.escape_html(when)}${row.restaurant_table ? ` · ${frappe.utils.escape_html(row.restaurant_table)}` : ""}${row.phone ? ` · ${frappe.utils.escape_html(row.phone)}` : ""}</div>
					${row.notes ? `<div class="imogi-ts-list-meta" style="margin-top:4px;font-style:italic;">${frappe.utils.escape_html(row.notes)}</div>` : ""}
					<div class="imogi-ts-list-actions"></div>
				</div>
			`);
			const $actions = $item.find(".imogi-ts-list-actions");
			$actions.append(`<button type="button" class="btn btn-xs btn-primary" data-action="seat">${__("Datang")}</button>`);
			$actions.append(`<button type="button" class="btn btn-xs btn-default" data-action="cancel">${__("Batal")}</button>`);
			$item.on("click", "[data-action='seat']", () => this.seat_reservation(row));
			$item.on("click", "[data-action='cancel']", () => this.cancel_reservation(row));
			this.$reservation_list.append($item);
		});
	}

	render_waiting(waiting, features) {
		this.$waiting_list.empty();
		if (!waiting.length) {
			this.$waiting_list.html(`<div class="imogi-ts-list-empty">${__("Antrian kosong")}</div>`);
			return;
		}

		waiting.forEach((row, idx) => {
			const when = row.queued_at ? frappe.datetime.str_to_user(row.queued_at) : "";
			const $item = $(`
				<div class="imogi-ts-list-item imogi-ts-list-item--waiting">
					<div class="imogi-ts-list-head">
						<strong><i class="fa fa-users" style="margin-right:6px;color:#3b82f6;"></i>${frappe.utils.escape_html(row.customer_name)}</strong>
						<span class="imogi-ts-list-badge imogi-ts-list-badge--waiting">#${idx + 1} · ${row.party_size} ${__("org")}</span>
					</div>
					<div class="imogi-ts-list-meta">${when ? `${frappe.utils.escape_html(when)} · ` : ""}${__("Menunggu meja")}${row.phone ? ` · ${frappe.utils.escape_html(row.phone)}` : ""}</div>
					${row.notes ? `<div class="imogi-ts-list-meta" style="margin-top:4px;font-style:italic;">${frappe.utils.escape_html(row.notes)}</div>` : ""}
					<div class="imogi-ts-list-actions"></div>
				</div>
			`);
			const $actions = $item.find(".imogi-ts-list-actions");
			$actions.append(`<button type="button" class="btn btn-xs btn-primary" data-action="seat">${__("Tempatkan")}</button>`);
			$actions.append(`<button type="button" class="btn btn-xs btn-default" data-action="cancel">${__("Batal")}</button>`);
			$item.on("click", "[data-action='seat']", () => this.prompt_seat_waiting(row, features));
			$item.on("click", "[data-action='cancel']", () => this.cancel_waiting(row));
			this.$waiting_list.append($item);
		});
	}

	open_cashier_for_table(table) {
		try {
			localStorage.setItem(
				"_imogi_pos_cashier_prefill",
				JSON.stringify({ order_type: "Dine-in", restaurant_table: table.name, table_number: table.table_number })
			);
		} catch (e) {
			/* ignore */
		}
		frappe.set_route("imogi-pos-cashier");
	}

	prompt_move_table(table) {
		const available = (this.board.tables || []).filter(
			(t) => t.name !== table.name && (t.status === "Available" || t.status === "Reserved")
		);
		if (!available.length) {
			frappe.msgprint(__("Tidak ada meja tujuan yang tersedia"));
			return;
		}
		imogi_ts_open_form_dialog({
			title: __("Pindah Meja"),
			subtitle: __("Pindahkan order dari {0} ke meja lain", [table.table_number || table.name]),
			icon: "fa-arrows-h",
			fields: [
				{
					fieldname: "new_table",
					fieldtype: "Select",
					label: __("Meja tujuan"),
					options: available.map((t) => t.name),
					reqd: 1,
				},
			],
			primary_label: __("Pindahkan"),
			on_submit: (values) => {
				frappe.call({
					method: "imogi_pos.api.table_api.move_restaurant_table",
					args: { order_name: table.open_order, new_table: values.new_table },
					freeze: true,
					callback: () => {
						frappe.show_alert({ message: __("Meja dipindahkan"), indicator: "green" });
						this.refresh();
					},
				});
			},
		});
	}

	prompt_manage_tables() {
		const tables = this.board.tables || [];
		const dialog = imogi_ts_open_form_dialog({
			title: __("Kelola Meja"),
			subtitle: __("Lihat meja yang ada dan tambahkan meja baru untuk layanan"),
			icon: "fa-th-large",
			wide: true,
			fields: [
				{
					fieldname: "tables_html",
					fieldtype: "HTML",
					options: imogi_ts_build_manage_tables_html(tables),
				},
				{ fieldtype: "Section Break", label: __("Tambah Meja Baru") },
				{
					fieldname: "table_number",
					fieldtype: "Data",
					label: __("Nomor Meja"),
					reqd: 1,
					description: __("Contoh: TS-04, A1, VIP-01"),
				},
				{
					fieldname: "capacity",
					fieldtype: "Int",
					label: __("Kapasitas"),
					default: 4,
					reqd: 1,
				},
				{
					fieldname: "location",
					fieldtype: "Data",
					label: __("Zona / Lokasi"),
					default: "Indoor",
				},
			],
			primary_label: __("Simpan Meja"),
			on_submit: (values) => {
				if (!values.table_number?.trim()) {
					frappe.msgprint(__("Nomor meja wajib diisi"));
					return false;
				}
				frappe.call({
					method: "imogi_pos.api.table_api.create_restaurant_table",
					args: {
						table_number: values.table_number.trim(),
						capacity: values.capacity,
						location: values.location,
						company: this.board.company,
					},
					freeze: true,
					callback: () => {
						frappe.show_alert({ message: __("Meja {0} berhasil ditambahkan", [values.table_number.trim()]), indicator: "green" });
						this.refresh();
					},
				});
			},
		});
		dialog.set_secondary_action_label(__("Tutup"));
		dialog.set_secondary_action(() => dialog.hide());
	}

	prompt_reservation() {
		const tables = this.board.tables || [];
		imogi_ts_open_form_dialog({
			title: __("Reservasi Baru"),
			subtitle: __("Catat tamu yang akan datang pada waktu tertentu"),
			icon: "fa-calendar-check-o",
			fields: [
				{ fieldname: "customer_name", fieldtype: "Data", label: __("Nama Tamu"), reqd: 1 },
				{ fieldname: "phone", fieldtype: "Data", label: __("Telepon") },
				{ fieldname: "party_size", fieldtype: "Int", label: __("Jumlah Tamu"), default: 2, reqd: 1 },
				{
					fieldname: "reservation_datetime",
					fieldtype: "Datetime",
					label: __("Waktu Reservasi"),
					default: imogi_ts_default_reservation_datetime(),
					reqd: 1,
				},
				{
					fieldname: "restaurant_table",
					fieldtype: "Select",
					label: __("Meja (opsional)"),
					options: imogi_ts_table_select_options(tables),
				},
				{ fieldname: "notes", fieldtype: "Small Text", label: __("Catatan") },
			],
			primary_label: __("Simpan Reservasi"),
			on_submit: (values) => {
				frappe.call({
					method: "imogi_pos.api.planned_features_api.create_table_reservation",
					args: { ...values, company: this.board.company },
					freeze: true,
					callback: () => {
						frappe.show_alert({ message: __("Reservasi dibuat"), indicator: "green" });
						this.refresh();
					},
				});
			},
		});
	}

	seat_reservation(row) {
		frappe.call({
			method: "imogi_pos.api.planned_features_api.seat_table_reservation_api",
			args: { name: row.name },
			freeze: true,
			callback: () => {
				frappe.show_alert({ message: __("Tamu reservasi hadir"), indicator: "green" });
				this.refresh();
			},
		});
	}

	cancel_reservation(row) {
		frappe.confirm(__("Batalkan reservasi {0}?", [row.customer_name]), () => {
			frappe.call({
				method: "imogi_pos.api.planned_features_api.cancel_table_reservation_api",
				args: { name: row.name },
				freeze: true,
				callback: () => {
					frappe.show_alert({ message: __("Reservasi dibatalkan"), indicator: "orange" });
					this.refresh();
				},
			});
		});
	}

	prompt_waiting_guest() {
		imogi_ts_open_form_dialog({
			title: __("Tambah Antrian"),
			subtitle: __("Daftarkan tamu walk-in yang sedang menunggu meja"),
			icon: "fa-clock-o",
			fields: [
				{ fieldname: "customer_name", fieldtype: "Data", label: __("Nama Tamu"), reqd: 1 },
				{ fieldname: "phone", fieldtype: "Data", label: __("Telepon") },
				{ fieldname: "party_size", fieldtype: "Int", label: __("Jumlah Tamu"), default: 2, reqd: 1 },
				{ fieldname: "notes", fieldtype: "Small Text", label: __("Catatan") },
			],
			primary_label: __("Simpan Antrian"),
			on_submit: (values) => {
				frappe.call({
					method: "imogi_pos.api.planned_features_api.add_waiting_guest",
					args: { ...values, company: this.board.company },
					freeze: true,
					callback: () => {
						frappe.show_alert({ message: __("Tamu ditambahkan ke antrian"), indicator: "green" });
						this.refresh();
					},
				});
			},
		});
	}

	prompt_seat_waiting(row) {
		const available = (this.board.tables || []).filter((t) => t.status === "Available" || t.status === "Reserved");
		const fields = [
			{
				fieldname: "restaurant_table",
				fieldtype: available.length ? "Select" : "Link",
				label: __("Meja"),
				options: available.length ? ["", ...available.map((t) => t.name)] : "IMOGI Restaurant Table",
			},
		];
		frappe.prompt(
			fields,
			(values) => {
				frappe.call({
					method: "imogi_pos.api.planned_features_api.seat_waiting_guest",
					args: { name: row.name, restaurant_table: values.restaurant_table || null },
					freeze: true,
					callback: () => {
						frappe.show_alert({ message: __("Tamu ditempatkan"), indicator: "green" });
						this.refresh();
					},
				});
			},
			__("Tempatkan Tamu"),
			__("Simpan")
		);
	}

	cancel_waiting(row) {
		frappe.confirm(__("Batalkan antrian {0}?", [row.customer_name]), () => {
			frappe.call({
				method: "imogi_pos.api.planned_features_api.cancel_waiting_guest",
				args: { name: row.name },
				freeze: true,
				callback: () => {
					frappe.show_alert({ message: __("Antrian dibatalkan"), indicator: "orange" });
					this.refresh();
				},
			});
		});
	}
};
