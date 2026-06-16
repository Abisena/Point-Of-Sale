# QA Kasir — Checklist 30 Menit (Desktop + Mobile)

Checklist cepat untuk menilai **Role IMOGI Cashier** sebelum go-live atau setelah deploy besar.  
Target waktu: **~30 menit** (15 menit desktop + 15 menit mobile).

Site contoh: `http://localhost:8003` — sesuaikan dengan bench Anda.

---

## Persiapan (5 menit)

### Environment

```bash
cd /path/to/bench
bench --site project.pos migrate
bench build --app imogi_pos --force
bench --site project.pos clear-cache
bench restart
```

### Akun uji

| Item | Nilai |
|------|--------|
| Role | `IMOGI Cashier` (bukan System Manager) |
| Shift | **Enable POS Shift** aktif di IMOGI POS Settings |
| Shift status | Buka shift baru jika belum ada |

### Device

- **Desktop:** Chrome, lebar ≥ 1200px
- **Mobile:** iPhone Safari **atau** Chrome DevTools (≤ 390px) + uji 1x di device asli jika memungkinkan

### Hard refresh

- Desktop: `Ctrl+Shift+R`
- iOS Safari: tutup tab → buka lagi, atau clear cache

---

## Bagian 1 — Desktop (~15 menit)

**URL utama:** `/app/imogi-pos-cashier`

### 1.1 Akses & shift (3 menit)

| # | Langkah | ✅ / ❌ | Catatan |
|---|---------|---------|---------|
| D1 | Login sebagai kasir → landing ke Kasir atau Buka Shift | | |
| D2 | Buka shift (jika wajib) → redirect ke Kasir | | |
| D3 | Header: logo, nama shift, tombol Logout / Riwayat / Tutup Shift | | |
| D4 | Coba buka `/app/home` atau workspace lain | Harus diarahkan kembali ke flow kasir | |

### 1.2 Katalog & keranjang (4 menit)

| # | Langkah | ✅ / ❌ | Catatan |
|---|---------|---------|---------|
| D5 | Grid produk muncul < 5 detik | | |
| D6 | Harga produk **bukan Rp 0** | | |
| D7 | Search produk — icon **tidak** menimpa placeholder | | |
| D8 | Tap produk 1 variant → langsung masuk keranjang | | |
| D9 | Tap produk multi-variant → modal variant → masuk keranjang | | |
| D10 | Qty +/-, total update benar | | |

### 1.3 Pembayaran & struk (4 menit)

| # | Langkah | ✅ / ❌ | Catatan |
|---|---------|---------|---------|
| D11 | **Bayar Sekarang** tanpa shift → pesan error jelas | Lewati jika shift sudah buka | |
| D12 | Bayar Cash → modal sukses | | |
| D13 | Toast sukses muncul di **atas** layar | | |
| D14 | **Cetak Struk** → preview/tab baru terbuka | | |
| D15 | Setelah sukses keranjang kosong | | |

### 1.4 Hold & riwayat (4 menit)

| # | Langkah | ✅ / ❌ | Catatan |
|---|---------|---------|---------|
| D16 | **Tahan** order → badge jumlah hold naik | Skip jika tier Free (fitur terkunci) | |
| D17 | **Lihat** → **Ambil** → item kembali ke keranjang | | |
| D18 | Klik **Riwayat** → halaman order history | | |
| D19 | Riwayat **full-width** (tidak mengecil di tengah) | | |
| D20 | **Refresh** halaman riwayat → layout tetap full-width | | |
| D21 | Tabel transaksi muncul, pagination jalan | | |
| D22 | Klik detail order + **Cetak ulang struk** | | |
| D23 | **Kembali ke Kasir** → kembali normal | | |

---

## Bagian 2 — Mobile (~15 menit)

Uji di lebar ≤ 390px (iPhone) atau DevTools responsive.

### 2.1 Layout kasir (4 menit)

| # | Langkah | ✅ / ❌ | Catatan |
|---|---------|---------|---------|
| M1 | Header: logo + **IMOGI Kasir** + 3 tombol icon (logout, riwayat, tutup) **satu baris** | | |
| M2 | Status shift di kartu putih **di bawah** header (bukan dot hijau acak di logo) | | |
| M3 | Search produk — icon **tidak** menimpa teks "Cari produk..." | | |
| M4 | Kategori dropdown + tipe order (Dine-in / Takeaway / Delivery) bisa dipilih | | |
| M5 | Dock bawah: ikon keranjang + total + tombol Bayar | | |

### 2.2 Keranjang mobile (4 menit)

| # | Langkah | ✅ / ❌ | Catatan |
|---|---------|---------|---------|
| M6 | Tap dock keranjang → sheet naik dari bawah | | |
| M7 | Tombol **X** tutup — posisi stabil (tidak loncat saat hover/tap) | | |
| M8 | Header keranjang: **Keranjang** + Tahan + Kosongkan rapi | | |
| M9 | Tambah item dari sheet → qty & total update | | |
| M10 | Scroll daftar item di keranjang (jika > 3 item) | | |

### 2.3 Bayar & sukses mobile (4 menit)

| # | Langkah | ✅ / ❌ | Catatan |
|---|---------|---------|---------|
| M11 | **Bayar Sekarang** → dialog payment fullscreen | | |
| M12 | Numpad cash (jika mode Cash) responsif | | |
| M13 | Selesaikan bayar → modal sukses mobile | | |
| M14 | Tombol cetak / order baru bisa diakses | | |

### 2.4 Riwayat mobile (3 menit)

| # | Langkah | ✅ / ❌ | Catatan |
|---|---------|---------|---------|
| M15 | Dari kasir → **Riwayat** | | |
| M16 | Halaman bisa **di-scroll** sampai daftar transaksi | |
| M17 | Search riwayat — icon tidak menimpa placeholder | | |
| M18 | Scroll horizontal tabel jika kolom lebar (opsional) | | |
| M19 | **Refresh** halaman → masih bisa scroll & layout tidak pecah | | |
| M20 | **Kembali ke Kasir** | | |

---

## Bagian 3 — Regresi shift (opsional +5 menit)

Lakukan jika ada waktu atau sebelum tutup hari operasional.

| # | Langkah | ✅ / ❌ | Catatan |
|---|---------|---------|---------|
| S1 | `/app/imogi-pos-close-shift` — layout center, tidak error | | |
| S2 | Tutup shift sukses → redirect buka shift | | |
| S3 | Buka shift baru → masuk kasir | | |
| S4 | Logout sementara → login lagi → shift masih terbuka | | |

---

## Skor cepat

Hitung: **(jumlah ✅) / (total item yang diuji) × 10**

| Skor | Interpretasi |
|------|----------------|
| **9–10** | Siap go-live kasir |
| **7–8** | Layak dengan catatan minor (dokumentasikan di bawah) |
| **5–6** | Perlu perbaikan sebelum produksi |
| **< 5** | Blokir go-live |

### Ringkasan pass/fail

- [ ] Desktop — akses, katalog, bayar, hold, riwayat (D1–D23)
- [ ] Mobile — header, keranjang sheet, bayar, riwayat scroll (M1–M20)
- [ ] Shift — buka/tutup/logout (S1–S4, opsional)

---

## Catatan bug (isi saat uji)

| ID | Device | Langkah | Gejala | Severity (B/M/L) |
|----|--------|---------|--------|------------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## Troubleshooting cepat

| Gejala | Cek |
|--------|-----|
| Layout riwayat mengecil setelah refresh | Hard refresh; pastikan cache `_imogi_pos_page_cache_version` terbaru |
| Riwayat tidak bisa scroll (mobile) | Pastikan `imogi-order-history-css-v11` ter-load; cek di DevTools → Elements → `<style id="imogi-order-history-css-v11">` |
| Search icon menimpa teks | Pastikan `imogi-cashier-inline-css-v63` ter-load |
| Tombol X keranjang loncat | Idem v63+; hover tidak boleh mengubah `transform` tombol X |
| Kasir redirect terus ke buka shift | Normal jika shift wajib & belum buka; buka shift dulu |
| Hold tidak bisa | Tier Free — fitur `hold_order` butuh Starter+ |
| Harga Rp 0 | Cek Item Price di price list POS Profile |

---

## Referensi

- Checklist fitur lengkap: [MANUAL_TEST_FITUR.md](MANUAL_TEST_FITUR.md)
- Panduan kasir harian: [KASIR_GUIDE.md](KASIR_GUIDE.md)
- Panduan lengkap: [PANDUAN_LENGKAP.md](PANDUAN_LENGKAP.md)

**Tester:** _______________  
**Tanggal:** _______________  
**Build / commit:** _______________  
**Skor akhir:** _____ / 10
