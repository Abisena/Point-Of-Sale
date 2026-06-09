frappe.provide("frappe.ui.form");

function imogi_umkm_customer_variant_fields() {
	const show_contact = "eval:doc.imogi_show_contact_details";
	const show_address = "eval:doc.imogi_show_address_details";

	return [
		{
			fieldtype: "Check",
			fieldname: "imogi_show_contact_details",
			label: __("Tambah detail kontak (opsional)"),
			default: 0,
		},
		{
			fieldtype: "Section Break",
			label: __("Primary Contact Details"),
			collapsible: 1,
			depends_on: show_contact,
		},
		{
			label: __("First Name"),
			fieldname: "map_to_first_name",
			fieldtype: "Data",
			depends_on: show_contact,
		},
		{
			label: __("Last Name"),
			fieldname: "map_to_last_name",
			fieldtype: "Data",
			depends_on: show_contact,
		},
		{
			fieldtype: "Column Break",
			depends_on: show_contact,
		},
		{
			label: __("Email Id"),
			fieldname: "email_address",
			fieldtype: "Data",
			options: "Email",
			depends_on: show_contact,
		},
		{
			label: __("Mobile Number"),
			fieldname: "mobile_number",
			fieldtype: "Data",
			depends_on: show_contact,
		},
		{
			fieldtype: "Check",
			fieldname: "imogi_show_address_details",
			label: __("Tambah alamat (opsional)"),
			default: 0,
		},
		{
			fieldtype: "Section Break",
			label: __("Primary Address Details"),
			collapsible: 1,
			depends_on: show_address,
		},
		{
			label: __("Address Line 1"),
			fieldname: "address_line1",
			fieldtype: "Data",
			depends_on: show_address,
		},
		{
			label: __("Address Line 2"),
			fieldname: "address_line2",
			fieldtype: "Data",
			depends_on: show_address,
		},
		{
			label: __("ZIP Code"),
			fieldname: "pincode",
			fieldtype: "Data",
			depends_on: show_address,
		},
		{
			fieldtype: "Column Break",
			depends_on: show_address,
		},
		{
			label: __("City"),
			fieldname: "city",
			fieldtype: "Data",
			depends_on: show_address,
		},
		{
			label: __("State/Province"),
			fieldname: "state",
			fieldtype: "Data",
			depends_on: show_address,
		},
		{
			label: __("Country"),
			fieldname: "country",
			fieldtype: "Link",
			options: "Country",
			depends_on: show_address,
		},
		{
			label: __("Customer POS Id"),
			fieldname: "customer_pos_id",
			fieldtype: "Data",
			hidden: 1,
		},
	];
}

function imogi_strip_umkm_optional_fields(doc) {
	if (!doc.imogi_show_contact_details) {
		["map_to_first_name", "map_to_last_name", "email_address", "mobile_number"].forEach(
			(field) => delete doc[field]
		);
	}

	if (!doc.imogi_show_address_details) {
		["address_line1", "address_line2", "pincode", "city", "state", "country"].forEach(
			(field) => delete doc[field]
		);
	}

	delete doc.imogi_show_contact_details;
	delete doc.imogi_show_address_details;
}

function imogi_is_umkm_customer_quick_entry(quick_entry) {
	return (
		frappe.boot.imogi_pos_business_type === "UMKM" && quick_entry?.doctype === "Customer"
	);
}

function imogi_patch_umkm_customer_quick_entry() {
	if (frappe.ui.form._imogi_umkm_customer_qe_patched) {
		return true;
	}

	const BaseForm = frappe.ui.form.ContactAddressQuickEntryForm;
	if (!BaseForm?.prototype?.get_variant_fields) {
		return false;
	}

	const original_get_variant_fields = BaseForm.prototype.get_variant_fields;
	const original_render_dialog = BaseForm.prototype.render_dialog;
	const original_insert = BaseForm.prototype.insert;

	BaseForm.prototype.get_variant_fields = function () {
		if (imogi_is_umkm_customer_quick_entry(this)) {
			return imogi_umkm_customer_variant_fields();
		}
		return original_get_variant_fields.call(this);
	};

	BaseForm.prototype.render_dialog = function () {
		if (imogi_is_umkm_customer_quick_entry(this) && !this.doc.customer_type) {
			this.doc.customer_type = "Individual";
		}
		return original_render_dialog.call(this);
	};

	BaseForm.prototype.insert = function () {
		if (imogi_is_umkm_customer_quick_entry(this)) {
			imogi_strip_umkm_optional_fields(this.dialog.doc);
		}
		return original_insert.call(this);
	};

	frappe.ui.form._imogi_umkm_customer_qe_patched = true;
	return true;
}

function imogi_try_patch_customer_quick_entry() {
	if (!imogi_patch_umkm_customer_quick_entry()) {
		setTimeout(imogi_try_patch_customer_quick_entry, 100);
	}
}

imogi_try_patch_customer_quick_entry();
