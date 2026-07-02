frappe.pages["imogi-pos-order-management"].on_page_load = function (wrapper) {
	imogi_pos.init_order_surface(wrapper, {
		pageName: "imogi-pos-order-management",
		pageClass: "imogi-pos-order-surface imogi-pos-order-management",
		title: __("Manajemen Order"),
		surface: "management",
		isManagement: true,
		backHref: "/app/imogi-pos-dashboard",
		backLabel: __("Kembali ke Dashboard"),
		showLogout: false,
		shellInit: "desk",
	});
};

frappe.pages["imogi-pos-order-management"].on_page_show = function () {
	imogi_pos.sync_desk_theme?.();
};

frappe.pages["imogi-pos-order-management"].on_page_hide = function () {
	imogi_pos.sync_desk_theme?.();
};
