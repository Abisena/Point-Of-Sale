frappe.provide("imogi_pos");

imogi_pos.format_local_date_long = function () {
	const days = [__("Minggu"), __("Senin"), __("Selasa"), __("Rabu"), __("Kamis"), __("Jumat"), __("Sabtu")];
	const months = [
		__("Januari"),
		__("Februari"),
		__("Maret"),
		__("April"),
		__("Mei"),
		__("Juni"),
		__("Juli"),
		__("Agustus"),
		__("September"),
		__("Oktober"),
		__("November"),
		__("Desember"),
	];
	const d = new Date();
	return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

imogi_pos.format_local_time = function () {
	const d = new Date();
	const h = String(d.getHours()).padStart(2, "0");
	const m = String(d.getMinutes()).padStart(2, "0");
	const s = String(d.getSeconds()).padStart(2, "0");
	return `${h}:${m}:${s}`;
};

imogi_pos.close_shift = function (opening) {
	if (!opening || !opening.name) {
		frappe.msgprint({
			message: __("Tidak ada shift terbuka."),
			indicator: "orange",
		});
		return;
	}

	frappe.route_options = {
		imogi_return_to_cashier: 1,
		pos_opening_entry: opening.name,
	};
	frappe.set_route("imogi-pos-close-shift");
};
