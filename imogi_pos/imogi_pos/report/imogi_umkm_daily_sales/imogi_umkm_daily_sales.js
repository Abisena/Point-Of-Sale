frappe.query_reports["IMOGI UMKM Daily Sales"] = {
	filters: [
		{
			fieldname: "date",
			label: __("Tanggal"),
			fieldtype: "Date",
			default: frappe.datetime.get_today(),
			reqd: 1,
		},
		{
			fieldname: "company",
			label: __("Perusahaan"),
			fieldtype: "Link",
			options: "Company",
			default: frappe.defaults.get_user_default("Company"),
		},
		{
			fieldname: "branch",
			label: __("Cabang"),
			fieldtype: "Link",
			options: "IMOGI Branch",
		},
	],
};
