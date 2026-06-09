# Panduan Lengkap IMOGI POS

Dokumen ini menjelaskan cara menggunakan aplikasi **IMOGI POS** dari awal setup hingga operasional harian, integrasi, dan troubleshooting.

**Versi panduan:** sesuai codebase IMOGI POS (ERPNext/Frappe).

---

## Daftar isi

1. [Pengenalan](#1-pengenalan)
2. [Persyaratan & peran pengguna](#2-persyaratan--peran-pengguna)
3. [Instalasi singkat](#3-instalasi-singkat)
4. [Setup pertama kali (Wizard)](#4-setup-pertama-kali-wizard)
5. [Pengaturan IMOGI POS Settings](#5-pengaturan-imogi-pos-settings)
6. [Mode bisnis: Restaurant vs UMKM](#6-mode-bisnis-restaurant-vs-umkm)
7. [Manajemen cabang](#7-manajemen-cabang)
8. [Import data produk & menu](#8-import-data-produk--menu)
9. [Alur harian kasir](#9-alur-harian-kasir)
10. [Shift kasir (buka & tutup)](#10-shift-kasir-buka--tutup)
11. [Variant, BOM & stok](#11-variant-bom--stok)
12. [Customer, diskon, voucher & poin](#12-customer-diskon-voucher--poin)
13. [Pembayaran & struk](#13-pembayaran--struk)
14. [Order marketplace (Grab/GoFood/ShopeeFood)](#14-order-marketplace-grabgofoodshopeefood)
15. [Mode offline](#15-mode-offline)
16. [Kitchen Display & Fulfillment (Restaurant)](#16-kitchen-display--fulfillment-restaurant)
17. [Dashboard owner](#17-dashboard-owner)
18. [Back-office: order, refund & void](#18-back-office-order-refund--void)
19. [Integrasi website (Order API)](#19-integrasi-website-order-api)
20. [Payment gateway QRIS](#20-payment-gateway-qris)
21. [Franchise & royalty](#21-franchise--royalty)
22. [Daftar halaman & URL](#22-daftar-halaman--url)
23. [Troubleshooting](#23-troubleshooting)
24. [Dokumen terkait](#24-dokumen-terkait)

---

## 1. Pengenalan

**IMOGI POS** adalah modul Point of Sale di atas **ERPNext/Frappe** yang dirancang untuk:

- **UMKM / retail** — kasir cepat, stok langsung berkurang, invoice ERPNext otomatis
- **Restaurant / Cafe** — alur dapur, fulfillment, tipe order dine-in/takeaway/delivery

Setiap transaksi kasir menghasilkan:

- **IMOGI POS Order** — dokumen order internal IMOGI
- **POS Invoice** — invoice resmi ERPNext (stok & akuntansi)

---

## 2. Persyaratan & peran pengguna

### Peran utama

| Peran | Kegunaan |
|--------|----------|
| **System Manager / Administrator** | Setup, settings, import, cabang, laporan |
| **IMOGI Cashier** | Kasir harian; login langsung ke halaman kasir/shift |
| **IMOGI Kitchen Staff** | Kitchen Display |
| Staff ERPNext lainnya | Sesuai permission DocType |

### Akses kasir

User dengan role **IMOGI Cashier** (bukan manager) setelah login diarahkan ke:

- **Buka shift** — jika shift wajib dan belum ada shift terbuka
- **IMOGI Kasir** — jika shift sudah dibuka atau shift dinonaktifkan

Manager/Admin bisa membuka semua halaman dari menu **Imogi POS**.

---

## 3. Instalasi singkat

```bash
cd /path/to/bench
bench get-app <url-repo-imogi_pos>
bench --site <nama-site> install-app imogi_pos
bench --site <nama-site> migrate
bench build --app imogi_pos
bench restart
```

Setelah install, buka situs ERPNext dan jalankan **Setup Wizard** (lihat bagian 4).

---

## 4. Setup pertama kali (Wizard)

**Menu:** Imogi POS → **IMOGI POS Setup**  
**URL:** `/app/imogi-pos-setup`

### Langkah wizard (ringkas)

1. **Pilih tipe bisnis**
   - *Restaurant / Cafe* — aktifkan alur kitchen & fulfillment
   - *UMKM* — kasir langsung selesai setelah bayar

2. **Pilih template usaha** (Kafe/F&B, Retail, Jasa, dll.)

3. **Identitas toko** — nama, kota, kontak

4. **Perusahaan & akun** — company ERPNext, chart of accounts (jika baru)

5. **POS Profile & gudang** — profil kasir default, warehouse stok

6. **Metode pembayaran** — Cash, QRIS, transfer, dll.

7. **Selesai** — `setup_complete` tercatat di IMOGI POS Settings

Jika setup sudah selesai, halaman setup mengarahkan ke workspace IMOGI POS.

### Setelah wizard

1. Buka **IMOGI POS Settings** → lengkapi field yang masih kosong
2. Import produk/menu (bagian 8)
3. Isi stok awal di warehouse
4. Buat user kasir + assign role **IMOGI Cashier**
5. Uji transaksi percobaan

Checklist go-live: lihat [GO_LIVE_CHECKLIST.md](GO_LIVE_CHECKLIST.md).

---

## 5. Pengaturan IMOGI POS Settings

**Menu:** Imogi POS → **IMOGI POS Settings**  
Form tunggal (Single DocType) dengan tab:

### Tab Dasar

| Pengaturan | Fungsi |
|------------|--------|
| Tipe bisnis / Template | Hasil wizard (read-only); ubah via Run Setup Wizard |
| Kota, WA Owner | Identitas toko |
| Multi Cabang | Aktifkan fitur cabang |
| Master Price List | Harga pusat untuk sync ke cabang |
| Target Omzet Bulanan | Progress bar di kasir & dashboard |
| Default Company / POS Profile / Warehouse | Default operasional |
| **Enable POS Shift** | Wajib buka/tutup shift kasir |
| Enable Kitchen Display | Layar dapur (Restaurant) |
| Enable Fulfillment | Antrian takeaway/delivery |

### Tab Stok

- Interval cek stok rendah
- Role yang menerima alert stok menipis
- Field reorder level

### Tab Struk

| Pengaturan | Fungsi |
|------------|--------|
| Enable Receipt Print | Tombol cetak setelah bayar |
| Thermal Print Mode | HTML browser atau ESC/POS |
| Lebar kertas | 58mm / 80mm |
| Print Format | IMOGI POS Receipt |
| Header / Footer struk | Teks custom |

### Tab Import

Tombol untuk:

- **Import Menu** — Excel/CSV menu F&B + variant
- **Import Produk** — produk retail
- **Import BOM** — resep bahan
- **Import Stok** — stok bahan baku

### Tab Dashboard

- Enable realtime notifications
- Interval refresh dashboard (detik)

### Tab Loyalty

| Fitur | Pengaturan |
|--------|------------|
| **Poin loyalty** | Enable, poin per Rp X, nilai 1 poin, minimum tukar |
| **Stamp card** | Enable, target stamp, reward diskon/voucher |
| **Promo rules** | Enable aturan promo otomatis di keranjang |

DocType terkait: IMOGI POS Loyalty Member, Voucher, Promo Rule, Loyalty Tier.

### Tab Bayar (Payment Gateway)

- Enable payment gateway
- Provider: Midtrans / Xendit
- Sandbox mode, server key, client key
- Digunakan untuk **QRIS** dari kasir

### Tab Integrasi

| Fitur | Fungsi |
|--------|--------|
| **Order API** | API untuk website/app eksternal |
| API Key & Secret | Kredensial (generate dari settings) |
| Order API Webhook | Kirim event ke URL Anda |
| **Offline Cashier** | Checkout antre saat internet putus |
| **Marketplace Orders** | Terima order GrabFood/GoFood/ShopeeFood via webhook |
| Marketplace Webhook Secret | Verifikasi signature HMAC |

### Tab Franchise

- Generate royalty per order franchise
- Post jurnal royalty otomatis (akun expense & payable)

---

## 6. Mode bisnis: Restaurant vs UMKM

### UMKM

```
Kasir → Tambah produk → Bayar → Selesai (POS Invoice + stok)
```

- Kitchen Display & Fulfillment **tidak** dipakai
- Cocok untuk toko retail, warung, minimarket

### Restaurant / Cafe

```
Kasir → Order → Bayar → Kitchen → Fulfillment → Completed
```

| Status order | Arti |
|--------------|------|
| Draft | Baru dibuat |
| Awaiting Payment | Menunggu bayar |
| Paid | Sudah dibayar, invoice terbuat |
| In Kitchen | Sedang dimasak |
| Kitchen Ready | Siap diambil/diantar |
| In Fulfillment | Proses takeaway/delivery |
| Fulfilled | Sudah diserahkan |
| Completed | Selesai |
| Cancelled | Dibatalkan |

**Tipe order:** Dine-in, Takeaway, Delivery — mempengaruhi apakah masuk fulfillment.

---

## 7. Manajemen cabang

Aktifkan **Multi Cabang** di Settings.

### IMOGI Branch

Setiap cabang punya:

- Kode cabang unik
- Company (bisa sama atau beda)
- Warehouse
- POS Profile
- Price list / menu khusus (opsional)

### Halaman tambah cabang

**Menu:** Imogi POS → **Tambah Cabang** (`/app/imogi-pos-add-branch`)

Wizard provisioning: warehouse, POS profile, price list cabang.

### Operasional multi cabang

- Kasir memilih **cabang** di toolbar atas (jika lebih dari satu cabang accessible)
- Ganti cabang **mengosongkan keranjang**
- HQ bisa **sync harga** dan **push menu** dari cabang template ke cabang lain (tombol di Settings)

---

## 8. Import data produk & menu

Semua import diakses dari **IMOGI POS Settings → tab Import**.

### Import Menu (F&B)

- Format Excel/CSV sesuai template wizard import
- Mendukung **item template + variant** (Hot/Ice, Size, dll.)
- Otomatis set flag `has_variants`, BOM, kategori POS (Food/Beverage/Dessert/Service)

### Import Produk (Retail)

- Item jual langsung tanpa BOM
- Barcode, harga, item group

### Import BOM

- Resep bahan per item jual
- Stok menu dihitung dari ketersediaan bahan (lihat bagian 11)

### Import Stok

- Saldo awal bahan baku / produk di warehouse

### Setelah import

1. Cek **Item Price** pada price list POS Profile
2. Cek stok di **Bin** / Stock Balance
3. Refresh kasir (hard refresh `Ctrl+Shift+R`)
4. Jika multi cabang: jalankan **Sync Harga ke Cabang**

---

## 9. Alur harian kasir

**Halaman:** IMOGI Kasir — `/app/imogi-pos-cashier`

### Layout

| Area | Fungsi |
|------|--------|
| Kiri — Produk | Grid produk, search, filter kategori |
| Kanan — Keranjang | Item, qty, tipe order, customer, total, bayar |
| Atas | Info shift, target omzet, badge marketplace |

### Menambah produk

| Cara | Langkah |
|------|---------|
| Tap kartu | Klik produk di grid |
| Cari nama | Ketik di kolom search (debounce otomatis) |
| Scan barcode | Scan ke kolom search → Enter |
| Variant | Modal pilih atribut (Hot/Ice, dll.) |
| Satu variant saja | Langsung masuk keranjang tanpa modal |

### Keranjang

- **− / +** — ubah qty
- **Kosongkan** — hapus semua item
- **Tahan** — simpan order ke server (max **5** order per user)
- **Lihat** (bar kuning) — ambil atau hapus order ditahan

### Tipe order

- **Dine-in** — makan di tempat
- **Takeaway** — bawa pulang
- **Delivery** — antar (penting untuk order marketplace)

### Customer

- Ketik nama di kolom customer → pilih dari daftar
- Tombol **+** — buat customer baru
- Tombol **×** — hapus pilihan customer
- Diperlukan untuk **tukar poin loyalty**

### Stok di kartu produk

- `X stok tersisa` — hijau/oranye sesuai jumlah
- `Habis` — kartu redup, tidak bisa diklik
- Item BOM — stok dari bahan resep

### Mobile

- Dock bawah: ikon keranjang + total + Bayar
- Keranjang full-screen sheet dari bawah

### Shortcut

| Tombol | Aksi |
|--------|------|
| F2 | Fokus ke kolom search |

Panduan ringkas kasir: [KASIR_GUIDE.md](KASIR_GUIDE.md).

---

## 10. Shift kasir (buka & tutup)

Aktifkan **Enable POS Shift** di Settings.

### Siapa wajib shift?

User dengan role **IMOGI Cashier** (bukan System Manager/Admin) wajib buka shift sebelum jual.

### Buka shift

**Halaman:** Opening Shift Kasir — `/app/imogi-pos-open-shift`

1. Isi **saldo awal kas** per denominasi (Rp 100 … Rp 100.000)
2. Opsional: catatan
3. **Buka Shift** → membuat IMOGI POS Shift Opening + POS Opening Entry ERPNext

Setelah berhasil, diarahkan ke **IMOGI Kasir**.

### Selama shift

- Bar atas kasir menampilkan: `Shift POS-OPE-xxxx - sejak ...`
- Tombol **Tutup Shift** di kanan atas

### Tutup shift

**Halaman:** Closing Shift Kasir — `/app/imogi-pos-close-shift`

1. **Ringkasan transaksi** — jumlah transaksi & penjualan
2. **Saldo kas** — saldo awal + penjualan tunai − pengeluaran
3. **Hitung uang tunai aktual** — input per lembar uang
4. **Verifikasi kas** — selisih (kurang/lebih/seimbang)
5. **Tutup shift** atau **Tutup dengan selisih**
6. Sinkron ke **POS Closing Entry** ERPNext

### Shift nonaktif

Jika **Enable POS Shift** tidak dicentang, kasir langsung jual tanpa buka/tutup shift.

---

## 11. Variant, BOM & stok

### Item variant (template)

- Contoh: `LATTE DIRNO COFFEE` (template) → `LATTE-HOT`, `LATTE-ICE`
- Harga di grid = **harga variant terendah**
- Jika hanya 1 variant → otomatis ditambahkan tanpa modal

### BOM (Bill of Materials)

- Item menu bisa pakai resep bahan
- Stok jual = min(stok bahan ÷ kebutuhan resep)
- Saat POS Invoice submit → bahan dikeluarkan via Stock Entry (Material Issue)

### Tips data

- BOM aktif (`is_active`) dan submit (`docstatus` 1) agar stok akurat
- Jalankan script perbaikan flag menu jika perlu: `bench --site <site> execute imogi_pos.scripts.fix_menu_bom_flags.run`

---

## 12. Customer, diskon, voucher & poin

### Diskon manual (modal bayar)

- Tanpa diskon / Diskon % / Diskon Rp

### Voucher

1. Aktifkan promo/loyalty di Settings
2. Saat bayar → panel **Voucher & Poin**
3. Masukkan kode voucher → **Pakai**

### Poin loyalty

1. Pilih customer yang punya member
2. Masukkan jumlah poin ditukar
3. Preview total otomatis terupdate

### Stamp card

- Setiap transaksi eligible menambah stamp
- Saat stamp penuh → voucher reward otomatis (muncul di modal sukses)

### Promo rules

- Aturan promo (mis. beli X diskon Y) dipreview di keranjang
- Hint promo muncul di atas daftar item keranjang

---

## 13. Pembayaran & struk

### Modal bayar

1. Klik **Bayar Sekarang**
2. Pilih metode: Cash, QRIS, transfer, dll. (dari POS Profile)
3. **Cash:** isi uang diterima → lihat kembalian; numpad di mobile
4. **QRIS (gateway):** scan/tunggu konfirmasi jika gateway aktif
5. **Selesaikan Pembayaran**

### Setelah sukses

Modal **Transaksi Berhasil** dengan:

- Nomor order & invoice
- Kembalian (jika cash)
- Tombol: **Cetak Struk**, **Struk Baru**, **Transaksi Baru**, dll.

Keranjang otomatis dikosongkan.

### Cetak struk

- Aktifkan di Settings → tab Struk
- Mode thermal: browser print atau ESC/POS ke printer thermal
- Format: IMOGI POS Receipt (logo, item, total, footer custom)

---

## 14. Order marketplace (Grab/GoFood/ShopeeFood)

### Aktivasi

1. Settings → Integrasi → centang **Enable Marketplace Orders**
2. Isi **Marketplace Webhook Secret** (opsional, untuk HMAC signature)
3. Simpan

### Webhook endpoint

```
POST /api/method/imogi_pos.api.marketplace_api.marketplace_webhook
Header: X-IMOGI-Signature: <hmac-sha256 body>  (jika secret diisi)
```

### Payload minimal

```json
{
  "platform": "GrabFood",
  "external_order_id": "GRAB-12345",
  "order_type": "Delivery",
  "customer": "CUST-00001",
  "delivery_address": "Jl. ...",
  "items": [
    { "item_code": "LATTE-DIRNO-COFFEE-HOT", "qty": 1, "rate": 16000 }
  ]
}
```

Platform yang didukung: `GrabFood`, `GoFood`, `ShopeeFood`.

### Alur di kasir

1. Order masuk → status **Awaiting Payment**
2. Badge hijau **N order marketplace** di header kasir
3. Klik badge → pilih order → item masuk **keranjang**
4. Tipe order otomatis **Delivery**
5. **Bayar Sekarang** → order marketplace diselesaikan (bukan order duplikat baru)
6. Badge hilang setelah terbayar

> Integrasi ini **webhook-based**. IMOGI tidak terhubung langsung ke API partner Grab; perlu middleware (Zapier, backend sendiri, dll.) yang meneruskan payload dari platform ke webhook IMOGI.

---

## 15. Mode offline

Aktifkan **Enable Offline Cashier** di Settings.

### Perilaku

- Katalog terakhir disimpan di **IndexedDB** browser
- Saat offline: tampilkan katalog cache, checkout antre di queue lokal
- Saat online kembali: sync otomatis (tombol/chip offline di kasir)
- Hanya metode bayar tertentu yang diizinkan offline (biasanya Cash)

### Persiapan

1. Buka kasir **saat online** minimal sekali (agar katalog tersimpan)
2. Pastikan user tidak clear site data browser

---

## 16. Kitchen Display & Fulfillment (Restaurant)

Aktifkan di Settings → **Enable Kitchen Display** dan **Enable Fulfillment**.

### Kitchen Display

**URL:** `/app/kitchen-display`

- Menampilkan antrian masak per **Kitchen Station**
- Staff dapur update status item/order
- Terhubung ke IMOGI POS Order status **In Kitchen**

### Fulfillment Queue

**URL:** `/app/fulfillment-queue`

- Antrian takeaway & delivery
- Update status hingga **Fulfilled** → **Completed**

### Role

Assign **IMOGI Kitchen Staff** untuk akses layar dapur.

---

## 17. Dashboard owner

**URL:** `/app/imogi-pos-dashboard`

### Ringkasan

- Penjualan hari ini / periode
- Order menunggu pembayaran
- Top produk
- Alert stok rendah
- Status shift kasir terbuka
- Progress target omzet bulanan

### Realtime

Jika diaktifkan, dashboard refresh otomatis dan menerima notifikasi realtime (order selesai, dll.).

---

## 18. Back-office: order, refund & void

### IMOGI POS Order

**Menu:** Imogi POS → **IMOGI POS Order**

Setiap transaksi kasir tercatat di sini dengan link ke **POS Invoice**.

### Aksi dari form order

| Aksi | Kapan |
|------|-------|
| Confirm / Process Payment | Dari API atau flow restaurant |
| Void | Batalkan order yang belum/sudah bayar (sesuai aturan) |
| Refund penuh | Kembalikan seluruh nilai |
| Partial refund | Kembalikan item tertentu saja |

### Partial refund

1. Buka IMOGI POS Order (status Paid/Completed)
2. Gunakan aksi **Partial Refund**
3. Pilih item & qty refund
4. Sistem buat return POS Invoice

### POS Closing Entry

Shift tutup tercatat di **POS Closing Entry** (ERPNext standard) — rekonsiliasi pembayaran & konsolidasi invoice.

---

## 19. Integrasi website (Order API)

Dokumen teknis: [WEBSITE_INTEGRATION.md](WEBSITE_INTEGRATION.md)

### Aktivasi

Settings → Integrasi → **Enable Order API** → generate API Key & Secret

### Autentikasi

```
X-Imogi-Api-Key: <key>
X-Imogi-Api-Secret: <secret>
```

### Endpoint utama

| Aksi | Method |
|------|--------|
| Buat order | `imogi_pos.api.order.create_order` |
| Bayar order | `imogi_pos.api.order.pay_order` |
| Status | `imogi_pos.api.order.get_order_status` |
| Void | `imogi_pos.api.order.void_order` |
| Refund | `imogi_pos.api.order.refund_order` |
| Partial refund | `imogi_pos.api.order.partial_refund_order` |
| Katalog | `imogi_pos.api.catalog.get_items` |
| Detail item | `imogi_pos.api.catalog.get_item` |
| Customer | `imogi_pos.api.customer_api.*` |

### Webhook keluar

Set **Order API Webhook URL** → IMOGI mengirim event:

- `order.created`
- `order.completed`
- `order.cancelled`
- `order.refunded`

### Tes lokal

```bash
export IMOGI_API_URL="http://localhost:8000"
export IMOGI_API_KEY="..."
export IMOGI_API_SECRET="..."
python apps/imogi_pos/scripts/test_order_api.py flow
```

---

## 20. Payment gateway QRIS

### Setup

1. Settings → tab **Bayar**
2. Centang **Enable Payment Gateway**
3. Pilih provider: **Midtrans** atau **Xendit**
4. Isi Server Key & Client Key
5. Sandbox mode untuk testing

### Di kasir

1. Pilih metode bayar yang terhubung gateway (mis. QRIS)
2. QR / payment link ditampilkan
3. Sistem polling status hingga paid atau timeout
4. Checkout selesai otomatis

---

## 21. Franchise & royalty

Untuk jaringan franchise:

1. Settings → tab **Franchise**
2. Centang **Generate Franchise Royalty**
3. Centang **Post Franchise Royalty Journals**
4. Set akun **Royalty Expense** & **Royalty Payable**
5. Setiap order eligible mengakumulasi royalty
6. Jurnal ERPNext terbuat otomatis saat posting

---

## 22. Daftar halaman & URL

| Halaman | URL | Pengguna |
|---------|-----|----------|
| IMOGI POS Setup | `/app/imogi-pos-setup` | Admin (sekali) |
| IMOGI Kasir | `/app/imogi-pos-cashier` | Kasir |
| Opening Shift | `/app/imogi-pos-open-shift` | Kasir |
| Closing Shift | `/app/imogi-pos-close-shift` | Kasir |
| IMOGI Dashboard | `/app/imogi-pos-dashboard` | Owner/Manager |
| Kitchen Display | `/app/kitchen-display` | Dapur |
| Fulfillment Queue | `/app/fulfillment-queue` | Kasir/Runner |
| Tambah Cabang | `/app/imogi-pos-add-branch` | Admin HQ |
| IMOGI POS Settings | `/app/imogi-pos-settings` | Admin |
| IMOGI POS Order (list) | `/app/imogi-pos-order` | Manager |

---

## 23. Troubleshooting

### Produk tidak muncul di kasir

- Cek **POS Profile** → item group yang diizinkan
- Cek **Item Price** pada price list profil
- Item `disabled` atau bukan `is_sales_item`
- Hard refresh kasir (`Ctrl+Shift+R`)

### Harga Rp 0

- Template variant tanpa harga sendiri → harus ada **Item Price** di variant atau `standard_rate`
- Cek price list POS Profile = price list yang dipakai Item Price

### Barcode tidak ketemu

- Daftarkan di **Item Barcode** pada master Item
- Scan harus memicu Enter di kolom search

### Stok selalu Habis padahal ada bahan

- Cek BOM aktif & submitted
- Cek stok bahan di warehouse POS Profile
- Item BOM: stok dihitung dari komponen, bukan item jadi

### Checkout gagal: shift belum dibuka

- Buka shift di `/app/imogi-pos-open-shift`
- Atau nonaktifkan **Enable POS Shift** jika tidak dipakai

### Error tutup shift "User None"

- Login ulang sebagai kasir
- Pastikan patch shift closing terbaru sudah di-deploy

### Order marketplace tidak hilang setelah bayar

- Pastikan order diambil dari badge marketplace lalu dibayar (bukan buat order baru manual)
- Hard refresh setelah update aplikasi

### Struk tidak muncul

- Aktifkan **Enable Receipt Print** di Settings
- Cek print format **IMOGI POS Receipt** terinstall

### Katalog lambat

- Setelah optimasi batch, load kedua kali lebih cepat (cache)
- Prefetch kategori berjalan di background setelah load pertama

### Perintah berguna (admin server)

```bash
bench --site <site> migrate
bench build --app imogi_pos
bench --site <site> clear-cache
bench restart
bench --site <site> execute imogi_pos.scripts.test_wave4_smoke.run
```

---

## 24. Dokumen terkait

| File | Isi |
|------|-----|
| [KASIR_GUIDE.md](KASIR_GUIDE.md) | Panduan singkat kasir (1 halaman) |
| [GO_LIVE_CHECKLIST.md](GO_LIVE_CHECKLIST.md) | Checklist sebelum operasional |
| [WEBSITE_INTEGRATION.md](WEBSITE_INTEGRATION.md) | Order API & webhook teknis |
| [README.md](../README.md) | Instalasi & contributing |

---

*Dokumen ini dibuat untuk tim operasional IMOGI POS. Untuk pertanyaan fitur spesifik atau customisasi, hubungi administrator sistem Anda.*
