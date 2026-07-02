frappe.pages["imogi-pos-order-history"].on_page_load = function (wrapper) {
	imogi_pos.init_order_surface(wrapper, {
		pageName: "imogi-pos-order-history",
		pageClass: "imogi-pos-order-surface imogi-pos-order-history",
		title: __("Riwayat Order"),
		surface: "history",
		isManagement: false,
		backHref: "/app/imogi-pos-cashier",
		backLabel: __("Kembali ke Kasir"),
		showLogout: true,
		shellInit: "cashier",
	});
};

frappe.pages["imogi-pos-order-history"].on_page_show = function () {
	imogi_pos.sync_desk_theme?.();
};

frappe.pages["imogi-pos-order-history"].on_page_hide = function () {
	imogi_pos.sync_desk_theme?.();
};
