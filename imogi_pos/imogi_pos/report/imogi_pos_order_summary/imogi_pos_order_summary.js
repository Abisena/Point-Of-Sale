frappe.query_reports["IMOGI POS Order Summary"] = {
	filters: [
		{
			fieldname: "from_date",
			label: __("From Date"),
			fieldtype: "Date",
			default: frappe.datetime.get_today(),
		},
		{
			fieldname: "to_date",
			label: __("To Date"),
			fieldtype: "Date",
			default: frappe.datetime.get_today(),
		},
		{
			fieldname: "status",
			label: __("Status"),
			fieldtype: "Select",
			options: [
				"",
				"Draft",
				"Awaiting Payment",
				"Paid",
				"In Kitchen",
				"Kitchen Ready",
				"In Fulfillment",
				"Fulfilled",
				"In Service",
				"Completed",
				"Cancelled",
			],
		},
		{
			fieldname: "order_channel",
			label: __("Order Channel"),
			fieldtype: "Select",
			options: ["", "Walk-in", "Mobile", "Web", "QR"],
		},
		{
			fieldname: "branch",
			label: __("Cabang"),
			fieldtype: "Link",
			options: "IMOGI Branch",
		},
	],
};
