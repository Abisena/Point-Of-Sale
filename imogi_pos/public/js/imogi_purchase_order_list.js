// Copyright (c) 2026, Imogi and contributors
//
// ERPNext's core purchase_order_list.js derives the List View indicator
// purely from `status`/`per_received`/`per_billed`, which has no concept of
// our custom "Menunggu Approval" / "Ditolak" state (the PO is still Draft
// underneath). Wrap the existing get_indicator so rows sitting in our
// approval flow show that clearly in the list, not just on the single doc.
//
// IMPORTANT: frappe.get_indicator() (frappe/public/js/frappe/model/indicator.js)
// hardcodes "if is_submittable && docstatus==0 -> return 'Draft'" and returns
// BEFORE ever calling listview_settings.get_indicator, unless
// has_indicator_for_draft is set on the settings object. Since our Pending
// Approval / Ditolak rows are docstatus 0 by design, that shortcut was
// swallowing them every time — has_indicator_for_draft is what lets our
// get_indicator run at all for Draft-state rows.

(function () {
	const settings = frappe.listview_settings["Purchase Order"] || {};
	const original_get_indicator = settings.get_indicator;

	settings.add_fields = [...(settings.add_fields || []), "imogi_approval_status"];
	settings.has_indicator_for_draft = true;

	settings.get_indicator = function (doc) {
		if (doc.imogi_approval_status === "Menunggu Approval") {
			return [__("Pending Approval"), "orange", "imogi_approval_status,=,Menunggu Approval"];
		}
		if (doc.imogi_approval_status === "Ditolak") {
			return [__("Approval Ditolak"), "red", "imogi_approval_status,=,Ditolak"];
		}

		// Core ERPNext's own get_indicator (per_received/per_billed based) was
		// written assuming it only ever runs for docstatus==1 rows — that
		// guarantee normally comes from the framework's hardcoded Draft
		// shortcut, which has_indicator_for_draft deliberately bypasses here.
		// Without checking docstatus ourselves FIRST, a plain fresh Draft
		// (per_received=0, per_billed=0, both "< 100") gets misread by core's
		// logic as "To Receive and Bill". Handle Draft/Cancelled before ever
		// calling into core's function.
		if (cint(doc.docstatus) === 0) {
			return [__("Draft"), "red", "docstatus,=,0"];
		}
		if (cint(doc.docstatus) === 2) {
			return [__("Cancelled"), "red", "docstatus,=,2"];
		}

		if (original_get_indicator) {
			const indicator = original_get_indicator(doc);
			if (indicator) return indicator;
		}
	};

	frappe.listview_settings["Purchase Order"] = settings;
})();
