// Copyright (c) 2026, Imogi and contributors
//
// Native ERPNext desk "Submit" on Purchase Order calls doc.submit() raw, so
// once approval is required it surfaces as a red PermissionError dialog —
// looks like a failure even though it's expected. `before_submit` is a
// framework-level hook that fires no matter how submit was triggered (button
// click, Ctrl+Enter, menu item) — setting frappe.validated = false inside it
// reliably blocks the native raw submit in every case, then we redirect to
// the same graceful wrapper the Purchasing Hub already uses
// (imogi_pos.api.planned_features_api.submit_purchasing_order_api), which
// catches that exact block and returns a calm "Pending Approval" status
// instead of raising it to the caller. Overriding just the primary button
// (frm.page.set_primary_action) was tried first but didn't cover every
// trigger path, which is why the raw error dialog could still slip through.

frappe.ui.form.on("Purchase Order", {
	refresh(frm) {
		hide_unused_po_fields(frm);
		setup_item_taxes_column(frm);

		if (frm.is_new() || cint(frm.doc.docstatus) !== 0) return;

		// Frappe's own show_submit_message() (core refresh_header, runs before
		// this handler) appends its blue "Submit this document to confirm" hint
		// into the same message container our banners use — layout.show_message()
		// appends rather than replaces, so it stacks instead of getting replaced.
		// Clear it first so only our own banner (if any) is visible.
		frm.dashboard.clear_headline();

		if (frm.doc.imogi_approval_status === "Menunggu Approval") {
			// set_headline_alert() sudah bikin kotak pesannya sendiri — jangan
			// bungkus lagi pakai <div class="alert ..."> manual, nanti jadi
			// kotak di dalam kotak. Warna cukup lewat argumen ke-2.
			frm.dashboard.set_headline_alert(
				__("Menunggu approval supervisor. Cek IMOGI POS Approval Request untuk detail & approve."),
				"orange"
			);
			// Badge bawaan Frappe di sebelah judul dokumen selalu nunjukin "Draft"
			// selama docstatus masih 0 — timpa tampilannya (bukan data-nya) biar
			// keliatan "Pending Approval", sesuai status approval custom kita.
			frm.page.set_indicator(__("Pending Approval"), "orange");
			// PO yang lagi nunggu approval dikunci total — requester gak boleh
			// ubah apa pun sampai approver approve/reject.
			lock_po_form(frm);
			add_approval_action_buttons(frm);
		} else {
			unlock_po_form(frm);
			if (frm.doc.imogi_approval_status === "Ditolak") {
				frm.dashboard.set_headline_alert(
					__("Approval PO ini ditolak. Cek IMOGI POS Approval Request untuk alasannya."),
					"red"
				);
				frm.page.set_indicator(__("Approval Ditolak"), "red");
				// Ditolak -> requester boleh revisi & submit ulang, form tetap bisa diedit.
			}
		}
	},

	before_submit(frm) {
		// Block the native raw submit unconditionally — our whitelisted
		// wrapper decides what actually happens (submit straight through,
		// or park it as Pending Approval) and never lets the raw
		// PermissionError reach the browser.
		frappe.validated = false;

		frappe.call({
			method: "imogi_pos.api.planned_features_api.submit_purchasing_order_api",
			args: { name: frm.doc.name },
			freeze: true,
			callback: (r) => {
				if (r.exc) return;
				if (!r.message || r.message.status !== "Pending Approval") {
					frappe.show_alert({ message: __("PO disubmit"), indicator: "green" });
				}
				// Kalau Pending Approval: gak ada notifikasi apa pun — cukup reload,
				// badge oranye + banner + form terkunci (lihat refresh() di atas)
				// yang jadi satu-satunya tanda, gak perlu popup/toast tambahan.
				frm.reload_doc();
			},
		});
	},

	items_add(frm) {
		// New rows don't trigger a full form refresh, so the "+ Pilih Tax"
		// placeholder hint wouldn't show on them until something else does.
		refresh_item_taxes_placeholders(frm);
	},
});

// Table MultiSelect nested inside the Items grid (child table of a child
// table) looked fine but silently never saved — Frappe drops grandchild
// tables on insert/save entirely. Taxes per item are stored as plain JSON
// (imogi_item_tax_templates) instead and edited through this dialog. Same
// MultiSelectPills control core uses for the "Assign To" dialog — just not
// asked to render inside a grid cell this time.
frappe.ui.form.on("Purchase Order Item", {
	imogi_edit_taxes_button(frm, cdt, cdn) {
		open_item_tax_dialog(frm, cdt, cdn);
	},
});

function open_item_tax_dialog(frm, cdt, cdn) {
	const row = locals[cdt][cdn];
	let current = [];
	try {
		current = JSON.parse(row.imogi_item_tax_templates || "[]");
	} catch (e) {
		current = [];
	}

	const dialog = new frappe.ui.Dialog({
		title: __("Pilih Tax — {0}", [row.item_code || ""]),
		fields: [
			{
				fieldtype: "MultiSelectPills",
				fieldname: "templates",
				label: __("Item Tax Template"),
				get_data: (txt) =>
					frappe.db.get_link_options("Item Tax Template", txt, {
						company: frm.doc.company,
					}),
			},
		],
		primary_action_label: __("Simpan"),
		primary_action: (values) => {
			const templates = values.templates || [];
			frappe.model.set_value(cdt, cdn, "imogi_item_tax_templates", JSON.stringify(templates));
			frappe.model.set_value(cdt, cdn, "imogi_item_taxes_display", templates.join(", "));
			dialog.hide();
			refresh_item_taxes_placeholders(frm);
		},
	});
	dialog.set_value("templates", current);
	dialog.show();
}

// Makes the "Taxes" grid column itself clickable — opens the same dialog as
// the "Pilih Tax" button, without needing to expand the row first. Grid
// rows are re-created as the grid re-renders (paging, edits, reload), so
// the click listener is delegated on the grid wrapper (bound once, matched
// by selector) rather than attached per-cell.
function setup_item_taxes_column(frm) {
	const grid = frm.fields_dict.items && frm.fields_dict.items.grid;
	if (!grid) return;

	inject_item_taxes_column_style();

	// A freshly added row auto-activates into Frappe's "editable row" mode,
	// which swaps the static (clickable) text for the field's real control —
	// read_only here, so it renders as a disabled input. Browsers never fire
	// "click" on a disabled form element (not even to bubble up to us), so a
	// delegated "click" listener silently does nothing right when it matters
	// most (right after Add Row). "mousedown" still fires on disabled
	// elements and reaches ancestor listeners, so bind on that instead.
	grid.wrapper.off("mousedown.imogi_item_taxes").on(
		"mousedown.imogi_item_taxes",
		'.grid-static-col[data-fieldname="imogi_item_taxes_display"]',
		function (e) {
			const cdn = $(e.currentTarget).closest("[data-name]").attr("data-name");
			if (!cdn) return;
			open_item_tax_dialog(frm, "Purchase Order Item", cdn);
		}
	);

	refresh_item_taxes_placeholders(frm);
}

// Plain comma-joined text reads badly and gives no hint the cell is
// clickable. Render each selected tax as a colored pill (Frappe's own
// .indicator-pill, same style used for status badges elsewhere in desk)
// instead, and a muted "+ Pilih Tax" hint when nothing's picked yet.
function refresh_item_taxes_placeholders(frm) {
	const grid = frm.fields_dict.items && frm.fields_dict.items.grid;
	if (!grid || !grid.grid_rows) return;
	grid.grid_rows.forEach((row) => {
		if (!row.doc || !row.row) return;
		const $cell = row.row.find('[data-fieldname="imogi_item_taxes_display"]');
		if (!$cell.length) return;

		const display = row.doc.imogi_item_taxes_display || "";
		const templates = display
			.split(",")
			.map((t) => t.trim())
			.filter(Boolean);

		if (!templates.length) {
			$cell.html(`<span class="text-muted">${__("+ Pilih Tax")}</span>`);
			return;
		}

		const badges = templates
			.map(
				(t) =>
					`<span class="indicator-pill blue no-indicator-dot" style="margin: 1px 3px 1px 0;">${frappe.utils.escape_html(
						t
					)}</span>`
			)
			.join("");
		$cell.html(`<div style="display:flex; flex-wrap:wrap; align-items:center;">${badges}</div>`);
	});
}

function inject_item_taxes_column_style() {
	const style_id = "imogi-po-item-taxes-column-style";
	if (document.getElementById(style_id)) return;
	const style = document.createElement("style");
	style.id = style_id;
	style.textContent = `
		.grid-static-col[data-fieldname="imogi_item_taxes_display"] {
			cursor: pointer;
		}
		.grid-static-col[data-fieldname="imogi_item_taxes_display"]:hover {
			background-color: var(--bg-light-gray, #f5f5f5);
		}
	`;
	document.head.appendChild(style);
}

// Generic ERPNext fields not used by our purchasing flow (kita beli barang
// jadi langsung dari supplier, semua transaksi IDR, cabang dilacak lewat
// IMOGI Branch bukan Cost Center) — disembunyikan biar form PO gak bikin
// bingung user. Cuma hidden (client-side), datanya tetap ada di doctype asli;
// kalau nanti perlu dipakai lagi, tinggal hapus fieldname-nya dari daftar ini.
function hide_unused_po_fields(frm) {
	[
		"apply_tds", // Apply Tax Withholding Amount (PPh 23) — gak dipakai
		"is_subcontracted", // alur maklon/titip-olah — gak dipakai
		"accounting_dimensions_section", // Cost Center / Project
		"currency_and_price_list", // Currency / Buying Price List
		"scan_barcode", // kasir gak scan barcode pas bikin PO
	].forEach((fieldname) => frm.set_df_property(fieldname, "hidden", 1));
}

// frm.disable_form() has no counterpart in Frappe core to undo itself: it
// overwrites frm.perm (via set_read_only) and force-sets read_only "1" on
// every field's df via set_df_property, which mutates the shared in-memory
// docfield object and survives frm.reload_doc() (that only refreshes doc
// data, not field metadata). Without an explicit unlock, a PO that leaves
// Pending Approval (e.g. requester hits Cancel and it reverts to Draft)
// stays permanently read-only, including the Items grid ("Add Row" gone).
function lock_po_form(frm) {
	if (!frm.__imogi_locked_fields) {
		// Snapshot each field's read_only state once, before we stomp on it,
		// so unlock_po_form can restore fields that were read_only by design
		// (formulas, fetch_from, etc.) instead of force-unlocking everything.
		frm.__imogi_locked_fields = {};
		frm.fields.forEach((field) => {
			frm.__imogi_locked_fields[field.df.fieldname] = field.df.read_only;
		});
	}
	frm.disable_form();
}

function unlock_po_form(frm) {
	if (!frm.__imogi_locked_fields) return;
	const original = frm.__imogi_locked_fields;
	delete frm.__imogi_locked_fields;

	// Restore real write/create/submit permissions (disable_form's
	// set_read_only() had stripped frm.perm down to read/cancel/share/print/email only).
	frm.fetch_permissions();
	Object.keys(original).forEach((fieldname) => {
		frm.set_df_property(fieldname, "read_only", original[fieldname]);
	});
	frm.enable_save();
	frm.refresh_fields();
}

function add_approval_action_buttons(frm) {
	frappe.call({
		method: "imogi_pos.api.planned_features_api.get_po_pending_approval_api",
		args: { name: frm.doc.name },
		callback: (r) => {
			const info = r.message || {};
			if (!info.request_name) return;
			const request_name = info.request_name;
			const required_role = info.required_role;

			if (info.requested_by && info.requested_by === frappe.session.user) {
				// Yang lihat ini pemohonnya sendiri — dia bukan approver PO
				// miliknya sendiri (kalau dia sudah qualified, PO ini gak akan
				// pernah nyangkut di Pending Approval sama sekali). Cukup kasih
				// jalan buat narik lagi pengajuannya, bukan Approve/Reject.
				frm.add_custom_button(__("Cancel"), () => {
					frappe.confirm(
						__("Batalkan pengajuan approval PO ini? PO akan kembali ke Draft dan bisa diedit lagi."),
						() => {
							frappe.call({
								method: "imogi_pos.api.planned_features_api.cancel_purchasing_order_request_api",
								args: { name: frm.doc.name },
								freeze: true,
								callback: (res) => {
									if (res.exc) return;
									frappe.show_alert({ message: __("Pengajuan approval dibatalkan"), indicator: "orange" });
									frm.reload_doc();
								},
							});
						}
					);
				});
				return;
			}

			const doApprove = (pin) => {
				frappe.call({
					method: "imogi_pos.api.planned_features_api.approve_purchasing_order_api",
					args: { request_name, pin: pin || null },
					freeze: true,
					callback: (res) => {
						if (res.exc) return;
						frappe.show_alert({ message: __("PO disetujui"), indicator: "green" });
						frm.reload_doc();
					},
				});
			};

			frm.add_custom_button(
				__("Approve"),
				() => {
					if (required_role) {
						// Role-based tier: dicek pakai user login sendiri di server, tanpa PIN.
						frappe.confirm(__("Approve PO ini sebagai role {0}?", [required_role]), () => doApprove(null));
						return;
					}
					frappe.prompt(
						[{ fieldname: "pin", fieldtype: "Password", label: __("PIN Supervisor"), reqd: 1 }],
						(values) => doApprove(values.pin),
						__("Approve"),
						__("Approve")
					);
				},
				__("Approval")
			);

			frm.add_custom_button(__("Reject"), () => {
				const fields = [{ fieldname: "reason", fieldtype: "Small Text", label: __("Alasan reject"), reqd: 1 }];
				if (!required_role) {
					fields.push({ fieldname: "pin", fieldtype: "Password", label: __("PIN Supervisor"), reqd: 1 });
				}
				frappe.prompt(
					fields,
					(values) => {
						frappe.call({
							method: "imogi_pos.api.planned_features_api.reject_purchasing_order_api",
							args: { request_name, pin: values.pin || null, reason: values.reason },
							freeze: true,
							callback: (res) => {
								if (res.exc) return;
								frappe.show_alert({ message: __("PO ditolak"), indicator: "orange" });
								frm.reload_doc();
							},
						});
					},
					__("Reject"),
					__("Reject")
				);
			}, __("Approval"));

			// Grup "Approval" jadi satu dropdown — tonjolkan sebagai tombol utama.
			frm.page.set_inner_btn_group_as_primary(__("Approval"));
		},
	});
}
