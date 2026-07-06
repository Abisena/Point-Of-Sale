(function () {
	const params = new URLSearchParams(window.location.search);
	const TABLE = params.get("table") || "";
	const TOKEN = params.get("token") || "";
	const $app = document.getElementById("imogi-qr-app");
	let pollTimer = null;

	function stopPoll() {
		if (pollTimer) {
			clearInterval(pollTimer);
			pollTimer = null;
		}
	}

	function showSuccess(orderName, phone) {
		stopPoll();
		state.cart = [];
		$app.innerHTML = `
			${renderHeader()}
			<div class="imogi-qr-success">
				<h2>Pesanan berhasil!</h2>
				<p>Order <strong>${orderName || ""}</strong> sudah dikirim ke dapur.</p>
				<p>Notifikasi WhatsApp akan segera dikirim ke <strong>${phone}</strong>.</p>
			</div>`;
	}

	function startQrisPoll(paymentName, phone, gateway) {
		const $qris = document.getElementById("imogi-qr-qris");
		const $pay = document.getElementById("imogi-qr-pay");
		if ($pay) {
			$pay.disabled = true;
			$pay.textContent = "Menunggu pembayaran...";
		}
		if ($qris) {
			let html = `<p class="imogi-qr-qris-status"><strong>Scan QRIS untuk bayar</strong></p>`;
			html += `<p class="imogi-qr-qris-hint">Setelah bayar, halaman ini otomatis lanjut. Jangan tutup.</p>`;
			if (gateway.qr_image) {
				html += `<img src="${gateway.qr_image}" alt="QRIS" class="imogi-qr-qris-img" />`;
			} else if (gateway.qr_url) {
				html += `<p><a href="${gateway.qr_url}" target="_blank">Buka pembayaran</a></p>`;
			}
			html += `<div class="imogi-qr-qris-wait"><span class="imogi-qr-spinner"></span> Menunggu konfirmasi pembayaran...</div>`;
			$qris.innerHTML = html;
		}

		stopPoll();
		pollTimer = setInterval(async () => {
			try {
				const row = await api("imogi_pos.api.qr_order_api.poll_qr_gateway_payment", {
					payment_name: paymentName,
				});
				if (row.status === "Paid") {
					const orderName = row.order || row.order_detail?.name || "";
					showSuccess(orderName, phone);
				} else if (row.status === "Failed") {
					stopPoll();
					alert("Pembayaran gagal atau kedaluwarsa. Silakan coba lagi.");
					if ($pay) {
						$pay.disabled = false;
						$pay.textContent = `Bayar ${money(cartTotal())}`;
					}
				}
			} catch (e) {
				/* keep polling */
			}
		}, 3000);
	}

	if (!TABLE || !TOKEN) {
		$app.innerHTML = `<div class="imogi-qr-error">QR tidak valid. Scan ulang QR di meja Anda.</div>`;
		return;
	}

	const state = {
		table: null,
		items: [],
		cart: [],
		payment: {},
		search: "",
	};

	function money(val) {
		try {
			return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
				Number(val || 0)
			);
		} catch (e) {
			return "Rp " + Number(val || 0).toLocaleString("id-ID");
		}
	}

	async function api(method, args) {
		const body = new URLSearchParams({ ...args, table: TABLE, token: TOKEN });
		const res = await fetch(`/api/method/${method}`, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body,
		});
		const data = await res.json();
		if (data.exc) {
			const msg = data._server_messages ? JSON.parse(data._server_messages).map((m) => JSON.parse(m).message).join(" ") : data.message;
			throw new Error(msg || "Request gagal");
		}
		return data.message;
	}

	function cartTotal() {
		return state.cart.reduce((sum, row) => sum + Number(row.qty) * Number(row.rate), 0);
	}

	function cartCount() {
		return state.cart.reduce((sum, row) => sum + Number(row.qty), 0);
	}

	function addToCart(item) {
		const existing = state.cart.find((r) => r.item_code === item.item_code);
		if (existing) {
			existing.qty += 1;
		} else {
			state.cart.push({
				item_code: item.item_code,
				item_name: item.item_name || item.item_code,
				qty: 1,
				rate: item.rate || item.price_list_rate || 0,
			});
		}
		render();
	}

	function renderHeader() {
		const t = state.table || {};
		return `
			<header class="imogi-qr-header">
				<h1>${t.store_name || "IMOGI POS"}</h1>
				<p>Meja <strong>${t.table_number || TABLE}</strong>${t.area ? ` · ${t.area}` : ""}${t.floor ? ` · ${t.floor}` : ""}</p>
			</header>`;
	}

	function renderGrid() {
		const q = state.search.trim().toLowerCase();
		const items = (state.items || []).filter((item) => {
			if (!q) return true;
			return (item.item_name || item.item_code || "").toLowerCase().includes(q);
		});
		if (!items.length) {
			return `<div class="imogi-qr-empty">Tidak ada produk ditemukan.</div>`;
		}
		return `<div class="imogi-qr-grid">${items
			.map(
				(item) => `
			<article class="imogi-qr-item">
				<h3>${item.item_name || item.item_code}</h3>
				<div class="price">${money(item.rate || item.price_list_rate || 0)}</div>
				<button type="button" data-add="${item.item_code}">+ Tambah</button>
			</article>`
			)
			.join("")}</div>`;
	}

	function renderCartBar() {
		const count = cartCount();
		if (!count) return "";
		return `
			<div class="imogi-qr-cart-bar">
				<div><strong>${count}</strong> item · <strong>${money(cartTotal())}</strong></div>
				<button type="button" id="imogi-qr-open-checkout">Checkout</button>
			</div>`;
	}

	function renderCheckoutSheet() {
		return `
			<div class="imogi-qr-sheet" id="imogi-qr-sheet">
				<div class="imogi-qr-sheet-panel">
					<h2>Checkout</h2>
					${state.cart
						.map(
							(row, idx) => `
						<div class="imogi-qr-line" data-idx="${idx}">
							<div>
								<strong>${row.item_name}</strong><br>
								<span>${money(row.rate)}</span>
							</div>
							<div class="qty">
								<button type="button" data-qty="-1">-</button>
								<span>${row.qty}</span>
								<button type="button" data-qty="1">+</button>
							</div>
						</div>`
						)
						.join("")}
					<div class="imogi-qr-line" style="font-weight:800;border-bottom:0;">
						<span>Total</span><span>${money(cartTotal())}</span>
					</div>
					<div class="imogi-qr-field">
						<label>Nama (opsional)</label>
						<input id="imogi-qr-name" type="text" placeholder="Nama tamu" />
					</div>
					<div class="imogi-qr-field">
						<label>No. WhatsApp *</label>
						<input id="imogi-qr-phone" type="tel" placeholder="08xxxxxxxxxx" required />
					</div>
					<p style="font-size:11px;color:#64748b;margin:0 0 8px;">Notifikasi status pesanan akan dikirim ke WhatsApp ini.</p>
					<button type="button" class="imogi-qr-pay-btn" id="imogi-qr-pay">Bayar ${money(cartTotal())}</button>
					<div id="imogi-qr-qris" class="imogi-qr-qris"></div>
				</div>
			</div>`;
	}

	function render() {
		$app.innerHTML = `
			${renderHeader()}
			<div class="imogi-qr-search">
				<input id="imogi-qr-search" type="search" placeholder="Cari menu..." value="${state.search.replace(/"/g, "&quot;")}" />
			</div>
			${renderGrid()}
			${renderCartBar()}
			${renderCheckoutSheet()}
		`;

		$app.querySelectorAll("[data-add]").forEach((btn) => {
			btn.addEventListener("click", () => {
				const code = btn.getAttribute("data-add");
				const item = state.items.find((i) => i.item_code === code);
				if (item) addToCart(item);
			});
		});

		const $search = document.getElementById("imogi-qr-search");
		if ($search) {
			$search.addEventListener("input", (e) => {
				state.search = e.target.value;
				const pos = e.target.selectionStart;
				render();
				const next = document.getElementById("imogi-qr-search");
				if (next) {
					next.focus();
					next.setSelectionRange(pos, pos);
				}
			});
		}

		const $open = document.getElementById("imogi-qr-open-checkout");
		if ($open) {
			$open.addEventListener("click", () => {
				document.getElementById("imogi-qr-sheet")?.classList.add("is-open");
			});
		}

		const $sheet = document.getElementById("imogi-qr-sheet");
		if ($sheet) {
			$sheet.addEventListener("click", (e) => {
				if (e.target === $sheet) $sheet.classList.remove("is-open");
			});
			$sheet.querySelectorAll("[data-qty]").forEach((btn) => {
				btn.addEventListener("click", () => {
					const idx = Number(btn.closest(".imogi-qr-line")?.getAttribute("data-idx"));
					const delta = Number(btn.getAttribute("data-qty"));
					const row = state.cart[idx];
					if (!row) return;
					row.qty += delta;
					if (row.qty <= 0) state.cart.splice(idx, 1);
					render();
					document.getElementById("imogi-qr-sheet")?.classList.add("is-open");
				});
			});
		}

		const $pay = document.getElementById("imogi-qr-pay");
		if ($pay) {
			$pay.addEventListener("click", submitOrder);
		}
	}

	async function submitOrder() {
		const phone = (document.getElementById("imogi-qr-phone")?.value || "").trim();
		const name = (document.getElementById("imogi-qr-name")?.value || "").trim();
		if (!phone) {
			alert("Nomor WhatsApp wajib diisi.");
			return;
		}
		if (!state.cart.length) {
			alert("Keranjang kosong.");
			return;
		}
		const $pay = document.getElementById("imogi-qr-pay");
		if ($pay) {
			$pay.disabled = true;
			$pay.textContent = "Memproses...";
		}
		try {
			const result = await api("imogi_pos.api.qr_order_api.submit_qr_table_order", {
				items: JSON.stringify(
					state.cart.map((r) => ({ item_code: r.item_code, qty: r.qty, rate: r.rate }))
				),
				customer_phone: phone,
				customer_name: name,
				payment_mode: state.payment.default_mode || "Cash",
			});

			if (result.payment_type === "qris" && result.gateway) {
				document.getElementById("imogi-qr-sheet")?.classList.add("is-open");
				startQrisPoll(result.gateway.name, phone, result.gateway);
				return;
			}

			showSuccess(result.order?.name || "", phone);
		} catch (err) {
			alert(err.message || "Gagal memproses pesanan");
			if ($pay) {
				$pay.disabled = false;
				$pay.textContent = `Bayar ${money(cartTotal())}`;
			}
		}
	}

	async function boot() {
		try {
			const board = await api("imogi_pos.api.qr_order_api.get_qr_menu_board", {});
			state.table = board.table;
			state.items = board.catalog?.items || [];
			state.payment = board.payment || {};
			if (!state.table?.can_order) {
				$app.innerHTML = `<div class="imogi-qr-error">Meja ini sedang tidak tersedia untuk pesan mandiri. Silakan panggil waiter.</div>`;
				return;
			}
			render();
		} catch (err) {
			$app.innerHTML = `<div class="imogi-qr-error">${err.message || "Gagal memuat menu"}</div>`;
		}
	}

	boot();
})();
