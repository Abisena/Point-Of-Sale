frappe.listview_settings["Riwayat Order"] = {
	hide_name_column: false,
	add_fields: [
		"status",
		"grand_total",
		"customer_name",
		"pos_invoice",
		"order_channel",
		"order_type",
		"order_source",
		"creation",
		"pos_profile",
	],
	onload(listview) {
		listview.page.btn_primary?.hide();
		listview.page.set_title(__("Riwayat Order"));
	},
	get_indicator(doc) {
		const colors = {
			Draft: "orange",
			"Awaiting Payment": "yellow",
			Paid: "blue",
			"In Kitchen": "purple",
			"Kitchen Ready": "purple",
			"In Fulfillment": "cyan",
			Fulfilled: "cyan",
			"In Service": "green",
			Completed: "green",
			Cancelled: "red",
			Refunded: "red",
		};
		const color = colors[doc.status] || "grey";
		const source = imogi_pos_get_source_short(doc.order_source);
		return [__(doc.status) + " · " + source, color, `status,=,${doc.status}`];
	},
	formatters: {
		name(value) {
			return imogi_pos_format_order_id(value);
		},
		order_source(value) {
			return imogi_pos_get_source_short(value);
		},
		grand_total(value) {
			return value ? format_currency(value) : "";
		},
		creation(value) {
			return value ? frappe.datetime.str_to_user(value) : "";
		},
	},
};

function imogi_pos_format_order_id(name) {
	if (!name) return name;
	return name.replace(/^IMO-ORD-/, "ORD-");
}

function imogi_pos_get_source_short(order_source) {
	return order_source === "ERPNext POS" ? __("ERPNext") : __("IMOGI");
}

function imogi_pos_is_riwayat_order_admin() {
	return frappe.user.has_role("System Manager") || frappe.user.has_role("Administrator");
}
