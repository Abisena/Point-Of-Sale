// Copyright (c) 2026, Imogi and contributors

frappe.ui.form.on("IMOGI POS Approval Request", {
	refresh(frm) {
		if (frm.doc.status !== "Pending") return;

		const isPoType = frm.doc.approval_type === "Purchase Order";
		const roleTiered = isPoType && frm.doc.required_role;

		const approveMethod = isPoType
			? "imogi_pos.api.planned_features_api.approve_purchasing_order_api"
			: "imogi_pos.api.approval_api.approve_with_pin";
		const rejectMethod = isPoType
			? "imogi_pos.api.planned_features_api.reject_purchasing_order_api"
			: "imogi_pos.api.approval_api.reject_with_pin";

		const doApprove = (pin) => {
			frappe.call({
				method: approveMethod,
				args: { request_name: frm.doc.name, pin: pin || null },
				freeze: true,
				callback: (r) => {
					if (r.exc) return;
					frappe.show_alert({ message: __("Disetujui"), indicator: "green" });
					frm.reload_doc();
				},
			});
		};

		frm.add_custom_button(
			__("Approve"),
			() => {
				if (roleTiered) {
					// Role-based tier: dicek pakai user login sendiri di server, tanpa PIN.
					frappe.confirm(__("Approve sebagai role {0}?", [frm.doc.required_role]), () => doApprove(null));
					return;
				}
				frappe.prompt(
					[{ fieldname: "pin", fieldtype: "Password", label: __("PIN Supervisor"), reqd: 1 }],
					(values) => doApprove(values.pin),
					__("Approve"),
					__("Approve")
				);
			},
			null,
			"primary"
		);

		frm.add_custom_button(__("Reject"), () => {
			const fields = [{ fieldname: "reason", fieldtype: "Small Text", label: __("Alasan reject"), reqd: 1 }];
			if (!roleTiered) {
				fields.push({ fieldname: "pin", fieldtype: "Password", label: __("PIN Supervisor"), reqd: 1 });
			}
			frappe.prompt(
				fields,
				(values) => {
					frappe.call({
						method: rejectMethod,
						args: { request_name: frm.doc.name, pin: values.pin || null, reason: values.reason },
						freeze: true,
						callback: (r) => {
							if (r.exc) return;
							frappe.show_alert({ message: __("Ditolak"), indicator: "orange" });
							frm.reload_doc();
						},
					});
				},
				__("Reject"),
				__("Reject")
			);
		});
	},
});
