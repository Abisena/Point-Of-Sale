// Copyright (c) 2026, Imogi and contributors

frappe.provide("imogi_pos.loyalty");

imogi_pos.loyalty.is_enabled = function (page) {
	return !!(page?.context?.loyalty_enabled);
};

imogi_pos.loyalty.build_promo_html = function () {
	return `<div class="imogi-pay-promo-wrap">
		<button type="button" class="imogi-pay-promo-toggle">
			<span class="imogi-pay-section-icon"><i class="fa fa-gift"></i></span>
			<span class="imogi-pay-section-text">
				<strong>${__("Voucher & Poin")}</strong>
				<small>${__("Opsional — pelanggan terdaftar")}</small>
			</span>
			<i class="fa fa-chevron-down imogi-pay-section-chevron"></i>
		</button>
		<div class="imogi-pay-promo-panel">
			<div class="imogi-pay-voucher-row">
				<input type="text" class="form-control input-sm imogi-pay-voucher-code" placeholder="${__(
					"Kode voucher"
				)}" autocomplete="off" />
				<button type="button" class="btn btn-default btn-sm imogi-pay-voucher-apply">${__("Pakai")}</button>
			</div>
			<div class="imogi-pay-voucher-hint text-muted small"></div>
			<div class="imogi-pay-loyalty-row">
				<label class="small text-muted">${__("Tukar poin")}</label>
				<div class="imogi-pay-loyalty-input-row">
					<input type="number" min="0" step="1" inputmode="numeric" class="form-control input-sm imogi-pay-loyalty-points" placeholder="0" />
					<span class="imogi-pay-loyalty-balance small text-muted"></span>
				</div>
			</div>
		</div>
	</div>`;
};

imogi_pos.loyalty.get_promo_state = function (dialog) {
	const $wrap = dialog.$wrapper;
	return {
		voucher_code: ($wrap.find(".imogi-pay-voucher-code").val() || "").trim(),
		loyalty_points_redeem: cint($wrap.find(".imogi-pay-loyalty-points").val()),
	};
};

imogi_pos.loyalty.load_customer = function (page, customer) {
	if (!imogi_pos.loyalty.is_enabled(page) || !customer) {
		page.customer_loyalty = null;
		page.render_customer_label?.();
		return;
	}
	frappe.call({
		method: "imogi_pos.api.loyalty_api.get_loyalty_status",
		args: { customer },
		callback(r) {
			page.customer_loyalty = r.message || null;
			page.render_customer_label?.();
		},
	});
};

imogi_pos.loyalty.setup_payment_ui = function (page, dialog, subtotal) {
	if (!imogi_pos.loyalty.is_enabled(page)) return;

	const me = page;
	const $wrap = dialog.$wrapper;
	const $toggle = $wrap.find(".imogi-pay-promo-toggle");
	const $panel = $wrap.find(".imogi-pay-promo-panel");
	const $points = $wrap.find(".imogi-pay-loyalty-points");
	const $balance = $wrap.find(".imogi-pay-loyalty-balance");
	const $hint = $wrap.find(".imogi-pay-voucher-hint");

	const sync_balance = () => {
		const loyalty = me.customer_loyalty || {};
		const points = cint(loyalty.points);
		if (points > 0) {
			$balance.text(`${points} ${__("poin")}`);
		} else if (me.selected_customer) {
			$balance.text(__("0 poin"));
		} else {
			$balance.text(__("Pilih customer untuk poin"));
		}
		$points.prop("disabled", !me.selected_customer);
	};

	$toggle.off("click.imogiPromo").on("click.imogiPromo", () => {
		$panel.toggleClass("is-open");
		$toggle.toggleClass("is-open", $panel.hasClass("is-open"));
	});

	$wrap.find(".imogi-pay-voucher-apply").off("click.imogiPromo").on("click.imogiPromo", () => {
		me.refresh_payment_preview(dialog, subtotal);
	});

	$points.off("input change.imogiPromo").on("input change.imogiPromo", () => {
		clearTimeout(me._loyalty_preview_timer);
		me._loyalty_preview_timer = setTimeout(() => me.refresh_payment_preview(dialog, subtotal), 250);
	});

	$wrap.find(".imogi-pay-voucher-code").off("keydown.imogiPromo").on("keydown.imogiPromo", (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			me.refresh_payment_preview(dialog, subtotal);
		}
	});

	sync_balance();
	$hint.text(__("Voucher dan poin bisa digabung dengan diskon manual."));
};

imogi_pos.loyalty.refresh_preview = function (page, dialog, subtotal) {
	const promo_enabled = !!page.context?.enable_promo_rules;
	const loyalty_enabled = imogi_pos.loyalty.is_enabled(page);
	if (!promo_enabled && !loyalty_enabled) {
		page.payment_preview = null;
		page.refresh_payment_dialog(dialog, subtotal);
		return;
	}

	const promo = imogi_pos.loyalty.get_promo_state(dialog);
	const discount = page.get_payment_discount_state(dialog);
	const args = {
		items: JSON.stringify(
			(page.get_checkout_cart ? page.get_checkout_cart() : page.cart).map((row) => ({
				item_code: row.item_code,
				qty: row.qty,
				rate: row.rate,
				uom: row.uom || undefined,
			}))
		),
		discount_type: discount.type || undefined,
		discount_value: discount.value || undefined,
		voucher_code: promo.voucher_code || undefined,
		loyalty_points_redeem: promo.loyalty_points_redeem || 0,
		...page.branch_api_args(),
	};
	if (page.selected_customer) args.customer = page.selected_customer;

	frappe.call({
		method: "imogi_pos.api.loyalty_api.preview_promotions",
		args,
		callback(r) {
			if (r.exc) {
				page.payment_preview = null;
			} else {
				page.payment_preview = r.message || null;
				page.voucher_code = page.payment_preview?.voucher_code || promo.voucher_code || "";
				page.loyalty_points_redeem = cint(page.payment_preview?.loyalty_points_redeemed);
			}
			page.refresh_payment_dialog(dialog, subtotal);
		},
	});
};
