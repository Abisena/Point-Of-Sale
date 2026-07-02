// Batasi daftar checkbox role di form User ke role IMOGI POS saja (+ System Manager).
// Tidak destruktif: role non-IMOGI yang sudah menempel pada user tetap dipertahankan,
// hanya disembunyikan dari daftar pilihan agar admin tidak salah memberi role ERPNext acak.

function imogi_user_role_allowed(role) {
	return role === "System Manager" || /^IMOGI /.test(role || "");
}

function imogi_apply_user_role_filter(frm, attempt = 0) {
	const editor = frm.roles_editor;
	if (!editor || !editor.multicheck) {
		// Editor dibuat oleh core saat form existing system user; coba lagi sebentar.
		if (attempt < 10) {
			setTimeout(() => imogi_apply_user_role_filter(frm, attempt + 1), 200);
		}
		return;
	}

	const mc = editor.multicheck;
	if (editor._imogi_role_filtered) return;
	editor._imogi_role_filtered = true;

	const original_get_data = mc.df.get_data;
	mc.df.get_data = () => {
		const result = original_get_data();
		const apply = (list) => (list || []).filter((opt) => imogi_user_role_allowed(opt.value));
		if (result && typeof result.then === "function") {
			return result.then(apply);
		}
		return apply(result);
	};

	// Hanya rekonsiliasi role yang diizinkan; biarkan role lain yang sudah ada apa adanya.
	editor.set_roles_in_table = function () {
		const checked = this.multicheck.get_checked_options();
		(this.get_role_rows() || []).forEach((role_doc) => {
			const role = this.get_role_value(role_doc);
			if (imogi_user_role_allowed(role) && !checked.includes(role)) {
				frappe.model.clear_doc(role_doc.doctype, role_doc.name);
			}
		});
		checked.forEach((role) => {
			if (!(this.get_role_rows() || []).find((d) => this.get_role_value(d) === role)) {
				const role_doc = frappe.model.add_child(this.frm.doc, this.child_doctype, this.table_fieldname);
				this.set_role_value(role_doc, role);
			}
		});
	};

	mc.set_options();
}

frappe.ui.form.on("User", {
	refresh(frm) {
		imogi_apply_user_role_filter(frm);
	},
});
