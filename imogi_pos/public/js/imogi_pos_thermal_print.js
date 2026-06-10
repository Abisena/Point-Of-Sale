// Copyright (c) 2026, Imogi and contributors
/** ESC/POS helpers for 58mm thermal printers (Web Serial or file download). */

frappe.provide("imogi_pos.thermal");

const ESC = "\x1b";
const GS = "\x1d";

function _money(amount, currency) {
	return format_currency(flt(amount), currency);
}

function _pad_line(left, right, width) {
	const l = String(left || "");
	const r = String(right || "");
	const space = Math.max(1, width - l.length - r.length);
	return l + " ".repeat(space) + r;
}

function _center(text, width) {
	const t = String(text || "").trim();
	if (t.length >= width) return t.slice(0, width);
	const pad = width - t.length;
	return " ".repeat(Math.floor(pad / 2)) + t;
}

imogi_pos.thermal.build_receipt = function (order, options = {}) {
	const width = cint(options.width) || 32;
	const store = (options.store_name || __("Toko")).toUpperCase();
	const lines = [];
	const push = (text, align = "left", style = "normal") =>
		lines.push({ text: String(text || ""), align, style });

	push(store, "center", "bold");
	if (options.branch_name) push(options.branch_name, "center");
	push("=".repeat(width), "center");
	push(_pad_line(__("No. Order"), order.name || ""), "left");
	push(
		_pad_line(
			__("Tanggal"),
			frappe.datetime.str_to_user(order.creation || frappe.datetime.now_datetime())
		),
		"left"
	);
	if (order.customer) push(_pad_line(__("Customer"), order.customer), "left");
	if (order.order_type) push(_pad_line(__("Tipe"), order.order_type), "left");
	push("-".repeat(width), "center");

	(order.items || []).forEach((row) => {
		const name = (row.item_name || row.item_code || "").slice(0, width);
		const qty = flt(row.qty);
		const amount = _money(flt(row.amount || qty * flt(row.rate)), order.currency);
		push(name);
		push(_pad_line(`  ${qty} x ${_money(flt(row.rate), order.currency)}`, amount), "right");
	});

	push("-".repeat(width), "center");
	if (flt(order.discount_amount) > 0) {
		push(_pad_line(__("Subtotal"), _money(order.subtotal, order.currency)), "right");
		push(_pad_line(__("Diskon"), `-${_money(order.discount_amount, order.currency)}`), "right");
	}
	push(_pad_line(__("TOTAL"), _money(flt(order.grand_total), order.currency)), "right", "bold");

	const payments = order.payments || [];
	if (payments.length) {
		push("-".repeat(width), "center");
		payments.forEach((pay) => {
			push(
				_pad_line(pay.mode_of_payment || __("Bayar"), _money(pay.amount, order.currency)),
				"right"
			);
		});
	}
	const change = flt(options.change);
	if (change > 0) {
		push(_pad_line(__("Kembalian"), _money(change, order.currency)), "right", "bold");
	}
	push("=".repeat(width), "center");
	if (options.footer) push(options.footer, "center");
	push("\n\n\n");

	return imogi_pos.thermal._to_escpos(lines, width);
};

imogi_pos.thermal.build_receipt_html = function (order, options = {}) {
	const store = frappe.utils.escape_html(options.store_name || __("Toko"));
	const branch = options.branch_name
		? `<div class="sub">${frappe.utils.escape_html(options.branch_name)}</div>`
		: "";
	const items = (order.items || [])
		.map((row) => {
			const qty = flt(row.qty);
			const amount = _money(flt(row.amount || qty * flt(row.rate)), order.currency);
			return `<tr>
				<td>
					<div class="name">${frappe.utils.escape_html(row.item_name || row.item_code || "")}</div>
					<div class="qty">${qty} x ${_money(flt(row.rate), order.currency)}</div>
				</td>
				<td class="amt">${amount}</td>
			</tr>`;
		})
		.join("");

	const discount =
		flt(order.discount_amount) > 0
			? `<div class="row"><span>${__("Diskon")}</span><strong>-${_money(
					order.discount_amount,
					order.currency
			  )}</strong></div>`
			: "";

	const payments = (order.payments || [])
		.map(
			(pay) =>
				`<div class="row"><span>${frappe.utils.escape_html(
					pay.mode_of_payment || ""
				)}</span><strong>${_money(pay.amount, order.currency)}</strong></div>`
		)
		.join("");

	const change =
		flt(options.change) > 0
			? `<div class="change">${__("Kembalian")}: ${_money(options.change, order.currency)}</div>`
			: "";

	const header = options.header
		? `<div class="sub imogi-rcpt-header">${frappe.utils.escape_html(options.header)}</div>`
		: "";
	const footer = options.footer
		? `<div class="foot">${frappe.utils.escape_html(options.footer)}</div>`
		: "";

	return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${frappe.utils.escape_html(
		order.name || "Receipt"
	)}</title>
<style>
* { box-sizing: border-box; }
body { margin: 0; padding: 12px; font-family: "Segoe UI", Arial, sans-serif; background: #f1f5f9; }
.receipt { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; color: #111; font-size: 12px; margin: 0 auto; max-width: 280px; padding: 14px 12px 18px; }
.head { border-bottom: 2px solid #111; margin-bottom: 10px; padding-bottom: 10px; text-align: center; }
.store { font-size: 16px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; }
.sub { color: #666; font-size: 10px; margin-top: 4px; }
.meta { border-bottom: 1px dashed #ccc; margin-bottom: 10px; padding-bottom: 8px; }
.meta-row { display: flex; font-size: 10px; justify-content: space-between; margin-bottom: 3px; }
.meta-row span:last-child { font-weight: 700; }
table { border-collapse: collapse; margin-bottom: 8px; width: 100%; }
thead th { border-bottom: 1px solid #ddd; color: #666; font-size: 9px; padding-bottom: 4px; text-align: left; text-transform: uppercase; }
thead th:last-child { text-align: right; }
tbody td { border-bottom: 1px dotted #eee; padding: 6px 0; vertical-align: top; }
.name { font-size: 11px; font-weight: 700; line-height: 1.25; }
.qty { color: #666; font-size: 10px; margin-top: 2px; }
.amt { font-size: 11px; font-weight: 700; text-align: right; white-space: nowrap; }
.totals { border-top: 1px solid #111; padding-top: 8px; }
.row { display: flex; font-size: 11px; justify-content: space-between; margin-bottom: 4px; }
.row.grand { font-size: 14px; font-weight: 800; margin-top: 4px; }
.pay { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 8px; padding: 8px; }
.change { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; color: #047857; font-size: 12px; font-weight: 800; margin-top: 8px; padding: 8px; text-align: center; }
.foot { border-top: 1px dashed #ccc; color: #666; font-size: 10px; margin-top: 12px; padding-top: 10px; text-align: center; }
@media print { body { background: #fff; padding: 0; } .receipt { border: none; border-radius: 0; max-width: 72mm; } }
</style></head><body>
<div class="receipt">
  <div class="head"><div class="store">${store}</div>${branch}${header}</div>
  <div class="meta">
    <div class="meta-row"><span>${__("No. Order")}</span><span>${frappe.utils.escape_html(
		order.name || ""
	)}</span></div>
    <div class="meta-row"><span>${__("Tanggal")}</span><span>${frappe.datetime.str_to_user(
		order.creation || frappe.datetime.now_datetime()
	)}</span></div>
    ${
		order.customer
			? `<div class="meta-row"><span>${__("Customer")}</span><span>${frappe.utils.escape_html(
					order.customer
			  )}</span></div>`
			: ""
	}
  </div>
  <table><thead><tr><th>${__("Item")}</th><th>${__("Subtotal")}</th></tr></thead><tbody>${items}</tbody></table>
  <div class="totals">
    ${discount}
    <div class="row grand"><span>${__("TOTAL")}</span><strong>${_money(
		order.grand_total,
		order.currency
	)}</strong></div>
  </div>
  ${payments ? `<div class="pay">${payments}${change}</div>` : change}
  ${footer}
</div>
<script>
window.onload = function () {
	window.focus();
	setTimeout(function () {
		window.print();
		setTimeout(function () {
			try { window.close(); } catch (e) {}
		}, 500);
	}, 250);
};
<\/script>
</body></html>`;
};

imogi_pos.thermal._to_escpos = function (lines, width) {
	const chunks = [ESC + "@"]; // init
	lines.forEach((line) => {
		if (line.align === "center") chunks.push(ESC + "a" + "\x01");
		else if (line.align === "right") chunks.push(ESC + "a" + "\x02");
		else chunks.push(ESC + "a" + "\x00");

		if (line.style === "bold") chunks.push(ESC + "E" + "\x01");

		const text = line.text.length > width ? line.text.slice(0, width) : line.text;
		chunks.push(text + "\n");

		if (line.style === "bold") chunks.push(ESC + "E" + "\x00");
	});
	chunks.push(GS + "V" + "\x00"); // cut
	return chunks.join("");
};

function _resolve_thermal_mode(mode) {
	const raw = String(mode || frappe.boot?.imogi_pos_thermal_mode || "Browser").toLowerCase();
	if (raw.includes("serial")) return "serial";
	if (raw.includes("download")) return "download";
	return "browser";
}

imogi_pos.thermal.resolve_mode = _resolve_thermal_mode;

function _escpos_to_bytes(data) {
	const bytes = new Uint8Array(data.length);
	for (let i = 0; i < data.length; i++) {
		bytes[i] = data.charCodeAt(i) & 0xff;
	}
	return bytes;
}

imogi_pos.thermal._print_browser = function (order, options = {}) {
	const html = imogi_pos.thermal.build_receipt_html(order, options);
	const paper = options.width >= 40 ? "80mm" : "58mm";

	// Hidden iframe avoids popup blockers (common reason print "does nothing").
	let $frame = $("#imogi-thermal-print-frame");
	
	if (!$frame.length) {
		$frame = $(
			'<iframe id="imogi-thermal-print-frame" title="IMOGI Receipt Print" style="position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;"></iframe>'
		);
		$("body").append($frame);
	}

	const win = $frame[0].contentWindow;
	win.document.open();
	win.document.write(html);
	win.document.close();

	setTimeout(() => {
		try {
			win.focus();
			win.print();
			frappe.show_alert({
				message: __("Dialog cetak dibuka — pilih printer Epson Anda"),
				indicator: "blue",
			});
		} catch (e) {
			frappe.msgprint({
				title: __("Gagal membuka dialog cetak"),
				indicator: "red",
				message: __("Izinkan pop-up/cetak di browser, lalu coba lagi. ({0})", [e.message || e]),
			});
		}
	}, 350);

	return true;
};

imogi_pos.thermal.print_order = async function (order, options = {}) {
	const mode = _resolve_thermal_mode(options.mode);

	if (mode === "serial") {
		if (!navigator.serial) {
			frappe.msgprint({
				title: __("Mode Serial tidak didukung"),
				indicator: "orange",
				message: __(
					"Printer USB Epson TM-T82X sebaiknya pakai mode <b>Browser</b>. Beralih ke cetak browser sekarang."
				),
			});
			return imogi_pos.thermal._print_browser(order, options);
		}
		const data = imogi_pos.thermal.build_receipt(order, options);
		try {
			const port = await navigator.serial.requestPort();
			await port.open({ baudRate: cint(options.baud_rate) || 9600 });
			const writer = port.writable.getWriter();
			await writer.write(_escpos_to_bytes(data));
			writer.releaseLock();
			await port.close();
			frappe.show_alert({ message: __("Struk thermal terkirim"), indicator: "green" });
			return true;
		} catch (e) {
			const cancelled = String(e.message || e).toLowerCase().includes("cancel");
			if (!cancelled) {
				frappe.msgprint({
					title: __("Gagal kirim ke printer serial"),
					indicator: "orange",
					message: __(
						"{0}<br><br>Untuk Epson TM-T82X via USB, ubah <b>Mode Cetak Thermal</b> ke <b>Browser</b> di Settings → Printer & Struk.",
						[e.message || e]
					),
				});
			}
			return imogi_pos.thermal._print_browser(order, options);
		}
	}

	if (mode === "download") {
		const data = imogi_pos.thermal.build_receipt(order, options);
		const blob = new Blob([_escpos_to_bytes(data)], { type: "application/octet-stream" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${order.name || "receipt"}.escpos`;
		a.click();
		URL.revokeObjectURL(url);
		frappe.show_alert({ message: __("File ESC/POS diunduh"), indicator: "green" });
		return true;
	}

	return imogi_pos.thermal._print_browser(order, options);
};

imogi_pos.thermal.get_print_options = function (context, payment_info = {}) {
	const ctx = context || {};
	return {
		mode: ctx.thermal_print_mode || frappe.boot?.imogi_pos_thermal_mode || "Browser",
		width: ctx.thermal_printer_width === "80mm" ? 42 : 32,
		store_name:
			ctx.receipt_store_name ||
			frappe.boot.imogi_pos_default_company ||
			frappe.boot.sysdefaults?.company ||
			ctx.company,
		branch_name: ctx.active_branch?.branch_name,
		header: ctx.receipt_header || frappe.boot.imogi_pos_receipt_header || "",
		footer: ctx.receipt_footer || frappe.boot.imogi_pos_receipt_footer || __("Terima kasih"),
		change: flt(payment_info.change),
	};
};
