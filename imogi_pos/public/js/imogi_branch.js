frappe.ui.form.on("IMOGI Branch", {
	refresh(frm) {
		if (frm.is_new()) {
			if (imogi_branch_can_manage_provisioning()) {
				frm.add_custom_button(__("Wizard Company & Cabang"), () => {
					frappe.set_route("imogi-pos-add-branch");
				});
			}
			return;
		}
		if (imogi_branch_can_manage_provisioning()) {
			frm.add_custom_button(__("Transfer Stok"), () => open_branch_transfer_dialog(frm), __("Aksi"));
			frm.add_custom_button(__("Assign Kasir"), () => open_assign_cashiers_dialog(frm), __("Aksi"));
		}
		if (!frm.doc.selling_price_list) {
			frm.add_custom_button(__("Buat Price List Cabang"), () => create_branch_price_list(frm), __("Harga"));
		} else {
			frm.add_custom_button(__("Sync Harga dari Master"), () => sync_branch_prices(frm), __("Harga"));
		}
		if (frm.doc.pos_profile) {
			frm.add_custom_button(
				__("POS Profile"),
				() => frappe.set_route("Form", "POS Profile", frm.doc.pos_profile),
				__("Lihat")
			);
		}
	},
	use_custom_menu(frm) {
		frm.toggle_display("item_groups", cint(frm.doc.use_custom_menu));
	},
});

function imogi_branch_can_manage_provisioning() {
	return (
		frappe.user.has_role("Administrator") ||
		frappe.user.has_role("System Manager") ||
		frappe.user.has_role("Sales Manager") ||
		frappe.user.has_role("IMOGI Owner") ||
		frappe.user.has_role("IMOGI Area Manager")
	);
}

function open_assign_cashiers_dialog(frm) {
	frappe.call({
		method: "imogi_pos.api.branch_provisioning_api.get_branch_cashier_assignments",
		args: { branch_code: frm.doc.branch_code },
		callback: (r) => {
			const current = (r.message?.cashiers || []).map((row) => row.user).join("\n");
			const dialog = new frappe.ui.Dialog({
				title: __("Assign Kasir ke Cabang"),
				fields: [
					{
						fieldname: "users",
						fieldtype: "Small Text",
						label: __("User (email)"),
						description: __("Satu email per baris atau pisahkan koma. Otomatis menambah User Permission Company + POS Profile."),
						default: current,
						reqd: 1,
					},
				],
				primary_action_label: __("Simpan"),
				primary_action(values) {
					frappe.call({
						method: "imogi_pos.api.branch_provisioning_api.assign_cashiers_to_branch",
						args: {
							branch_code: frm.doc.branch_code,
							users: values.users,
						},
						freeze: true,
						callback(res) {
							dialog.hide();
							if (res.exc) return;
							frappe.show_alert({
								message: __("Permission kasir diperbarui"),
								indicator: "green",
							});
						},
					});
				},
			});
			dialog.show();
		},
	});
}

function create_branch_price_list(frm) {
	frappe.call({
		method: "imogi_pos.api.branch_pricing_api.create_branch_price_list",
		args: { branch_code: frm.doc.branch_code, copy_from_master: 1 },
		freeze: true,
		freeze_message: __("Membuat price list cabang..."),
		callback(r) {
			if (r.exc) return;
			const msg = r.message || {};
			frappe.show_alert({
				message: __("Price list {0} dibuat", [msg.price_list]),
				indicator: "green",
			});
			frm.reload_doc();
		},
	});
}

function sync_branch_prices(frm) {
	frappe.call({
		method: "imogi_pos.api.branch_pricing_api.sync_branch_prices",
		args: { branch_code: frm.doc.branch_code },
		freeze: true,
		freeze_message: __("Menyinkronkan harga..."),
		callback(r) {
			if (r.exc) return;
			const msg = r.message || {};
			frappe.msgprint({
				title: __("Sync Harga Selesai"),
				indicator: "green",
				message: `${__("Master")}: ${frappe.utils.escape_html(msg.master || "-")}<br>${__(
					"Updated"
				)}: ${msg.updated || 0}<br>${__("Created")}: ${msg.created || 0}`,
			});
		},
	});
}

function open_branch_transfer_dialog(frm) {
	frappe.call({
		method: "imogi_pos.api.stock_import_api.get_branch_transfer_context",
		args: { from_branch_code: frm.doc.branch_code },
		callback: (r) => {
			const branches = (r.message || {}).branches || [];
			if (branches.length < 2) {
				frappe.msgprint(__("Butuh minimal 2 cabang aktif untuk transfer stok."));
				return;
			}

			const branch_options = branches.map((row) => {
				const label = row.city ? `${row.branch_name} (${row.city})` : row.branch_name || row.branch_code;
				return { label, value: row.branch_code };
			});

			const dialog = new frappe.ui.Dialog({
				title: __("Transfer Stok Antar Cabang"),
				fields: [
					{
						fieldname: "from_branch_code",
						fieldtype: "Select",
						label: __("Dari Cabang"),
						options: branch_options,
						default: frm.doc.branch_code,
						reqd: 1,
					},
					{
						fieldname: "to_branch_code",
						fieldtype: "Select",
						label: __("Ke Cabang"),
						options: branch_options.filter((row) => row.value !== frm.doc.branch_code),
						reqd: 1,
					},
					{
						fieldname: "items",
						fieldtype: "Table",
						label: __("Item"),
						reqd: 1,
						fields: [
							{
								fieldname: "item_code",
								fieldtype: "Link",
								label: __("Item"),
								options: "Item",
								in_list_view: 1,
								reqd: 1,
							},
							{
								fieldname: "qty",
								fieldtype: "Float",
								label: __("Qty"),
								in_list_view: 1,
								reqd: 1,
							},
						],
					},
				],
				primary_action_label: __("Transfer"),
				primary_action(values) {
					const items = (values.items || []).filter((row) => row.item_code && flt(row.qty) > 0);
					if (!items.length) {
						frappe.msgprint(__("Tambahkan minimal satu item dengan qty > 0"));
						return;
					}
					frappe.call({
						method: "imogi_pos.api.stock_import_api.create_branch_stock_transfer",
						args: {
							from_branch_code: values.from_branch_code,
							to_branch_code: values.to_branch_code,
							items: JSON.stringify(items),
						},
						freeze: true,
						freeze_message: __("Memproses transfer stok..."),
						callback(res) {
							dialog.hide();
							const msg = res.message || {};
							frappe.msgprint({
								title: __("Transfer Berhasil"),
								indicator: "green",
								message: `${__("Stock Entry")}: <a href="/app/stock-entry/${encodeURIComponent(
									msg.stock_entry || ""
								)}">${frappe.utils.escape_html(msg.stock_entry || "")}</a><br>${__(
									"Dari"
								)}: ${frappe.utils.escape_html(msg.from_branch || "")}<br>${__(
									"Ke"
								)}: ${frappe.utils.escape_html(msg.to_branch || "")}`,
							});
						},
					});
				},
			});
			dialog.show();
		},
	});
}
