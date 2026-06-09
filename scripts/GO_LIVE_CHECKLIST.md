# IMOGI POS — Go-Live Checklist (UMKM)

Gunakan checklist ini sebelum operasional harian / pilot toko.

## 1. Setup dasar

- [ ] **Setup Wizard** selesai (mode UMKM)
- [ ] **IMOGI POS Settings**: Company, POS Profile, Warehouse terisi
- [ ] **POS Profile**: metode bayar (Cash, QRIS, dll), default customer, price list
- [ ] **Item** sudah di-import atau dibuat (gunakan CSV sample di `scripts/sample_products_import.csv`)
- [ ] **Stok awal** di warehouse default sudah benar
- [ ] **User kasir** punya role yang bisa akses IMOGI Kasir + IMOGI POS Order

## 2. Shift kasir (opsional)

- [ ] Tentukan di **IMOGI POS Settings** → centang **Wajib Shift Kasir** jika toko pakai buka/tutup kas
- [ ] Jika aktif: buka **IMOGI Kasir** → **Buka Shift** sebelum jual
- [ ] Jika aktif: akhir hari **Tutup Shift** via POS Closing Entry
- [ ] Jika nonaktif: langsung jual tanpa buka shift (cocok banyak UMKM)

## 3. Uji kasir (IMOGI Kasir)

- [ ] Tap produk → keranjang → qty +/- → total sejajar
- [ ] **Scan barcode** (Enter di kolom search) → item masuk keranjang
- [ ] **Diskon** % dan Rp
- [ ] **Bayar Cash** → uang diterima → kembalian benar
- [ ] **Bayar non-cash** (QRIS/Bank) → checkout sukses
- [ ] **Tahan** order (label opsional) → **Lihat** → Ambil / Hapus (max 5 order)
- [ ] **Cetak struk** (aktifkan di Settings → Receipt)
- [ ] POS Invoice terbuat & stok berkurang

## 4. Uji back-office

- [ ] Dashboard UMKM: angka harian, top produk, alert stok rendah, status shift
- [ ] **Partial refund** dari IMOGI POS Order
- [ ] Import CSV produk baru dari Settings

## 5. Uji integrasi website (opsional)

- [ ] Order API aktif di Settings (API Key + Secret)
- [ ] Buka `scripts/website_order_demo.html` di browser
- [ ] `python apps/imogi_pos/scripts/test_order_api.py flow`
- [ ] Webhook URL (jika dipakai) menerima event `order.completed`

## 6. Production

- [ ] **HTTPS** di server live (jangan expose API key lewat HTTP)
- [ ] Backup database rutin (`bench backup`)
- [ ] Redis queue + cache jalan (`bench start` / supervisor)
- [ ] SOP kasir: lihat `KASIR_GUIDE.md`

## Perintah berguna

```bash
cd /path/to/bench
bench --site project.pos migrate
bench build --app imogi_pos
bench restart
bash apps/imogi_pos/scripts/run_pilot_tests.sh
bench --site project.pos backup
```
