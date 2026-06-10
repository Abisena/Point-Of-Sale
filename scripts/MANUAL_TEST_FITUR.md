# Checklist Uji Manual — Fitur Penting IMOGI POS

Panduan ini untuk menguji **manual di browser** fitur yang baru dibuat/diperbaiki.  
Site contoh: `http://localhost:8003` (sesuaikan dengan bench Anda).

---

## Sebelum mulai

### 1. Pastikan kode terbaru jalan

```bash
cd /path/to/bench
bench --site project.pos migrate
bench build --app imogi_pos --force
bench --site project.pos clear-cache
bench restart   # atau refresh worker jika pakai honcho
```

### 2. Smoke test backend (opsional, ~30 detik)

```bash
bench --site project.pos execute imogi_pos.scripts.test_wave4_smoke.run
```

Harus muncul: `Wave 4 smoke tests passed.`

### 3. Aktifkan fitur di Settings

Buka **IMOGI POS Settings** (`/app/imogi-pos-settings`):

| Fitur | Field |
|--------|--------|
| Shift kasir | **Enable POS Shift** ✓ |
| Marketplace | **Enable Marketplace Orders** ✓ |
| Loyalty (opsional) | **Enable Loyalty** ✓ |
| Struk | **Enable Receipt Print** ✓ |

Save.

### 4. User & shift

- Login sebagai **kasir** (role `IMOGI Cashier`), mis. `gunawan@gmail.com`
- Jika shift wajib: **buka shift** dulu di `/app/imogi-pos-open-shift`

---

## A. Katalog & harga produk

**URL:** `/app/imogi-pos-cashier`  
**Hard refresh:** `Ctrl+Shift+R`

| # | Langkah | Hasil yang diharapkan |
|---|---------|------------------------|
| A1 | Buka kasir, tunggu grid produk | Produk muncul; tidak lama spinner |
| A2 | Cek item template (mis. LATTE, AMERICANO) | Harga **bukan Rp 0** (mis. Rp 16.000, Rp 11.000) |
| A3 | Cek label stok di setiap kartu | Ada `X stok tersisa` atau `Habis` (seragam) |
| A4 | Item BOM (menu resep) yang ada bahannya | **Tidak** stuck `Habis` kalau bahan cukup |
| A5 | Klik tab Food / Beverage | Kategori ganti; setelah prefetch kedua kali cenderung instan |
| A6 | Tap item **1 variant saja** (mis. DECAFF) | Langsung masuk keranjang tanpa modal kosong |
| A7 | Tap item **banyak variant** (mis. AMERICANO) | Modal variant muncul, pilih → masuk keranjang |

---

## B. Keranjang & pembayaran

| # | Langkah | Hasil yang diharapkan |
|---|---------|------------------------|
| B1 | Tambah 2–3 produk | Keranjang & total update |
| B2 | **Tahan** order → isi label → simpan | Bar kuning “order ditahan” |
| B3 | **Lihat** → **Ambil** order ditahan | Item kembali ke keranjang |
| B4 | **Bayar Sekarang** → Cash → bayar | Modal **Transaksi Berhasil** |
| B5 | Cek toast sukses | Muncul **atas** layar (bukan mentok bawah di mobile) |
| B6 | Klik **Cetak Struk** | Preview/print struk thermal/HTML |
| B7 | Setelah sukses | Keranjang kosong, siap transaksi baru |

---

## C. Marketplace (GrabFood / webhook)

### C.1 Buat order masuk (via terminal)

Ganti `ITEM_CODE` dengan item yang ada (mis. `COFFEE-BEAN-GRINDING-SERVICE`):

```bash
bench --site project.pos execute "
import frappe
from imogi_pos.imogi_pos.utils.marketplace import ingest_marketplace_order
from imogi_pos.imogi_pos.utils.flow import get_settings
s = get_settings()
frappe.set_user('Administrator')
r = ingest_marketplace_order({
    'platform': 'GrabFood',
    'external_order_id': 'MANUAL-TEST-001',
    'items': [{'item_code': 'COFFEE-BEAN-GRINDING-SERVICE', 'qty': 1, 'rate': 15000}],
})
print(r)
"
```

Atau curl (tanpa secret):

```bash
curl -X POST "http://localhost:8003/api/method/imogi_pos.api.marketplace_api.marketplace_webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "GrabFood",
    "external_order_id": "MANUAL-TEST-002",
    "items": [{"item_code": "COFFEE-BEAN-GRINDING-SERVICE", "qty": 1, "rate": 15000}]
  }'
```

### C.2 Uji di kasir

| # | Langkah | Hasil yang diharapkan |
|---|---------|------------------------|
| C1 | Refresh kasir | Badge hijau **「1 order marketplace」** (atau lebih) |
| C2 | Klik badge → pilih order | **Item langsung muncul di keranjang** + total terupdate |
| C3 | Cek tipe order | Otomatis **Delivery** |
| C4 | **Bayar Sekarang** → selesaikan | Transaksi sukses |
| C5 | Refresh / badge | Order itu **hilang** dari list marketplace |
| C6 | Buka **IMOGI POS Order** | Order marketplace status **Paid/Completed**, ada POS Invoice |

---

## D. Tutup shift (fix error User None)

**URL:** `/app/imogi-pos-close-shift`

| # | Langkah | Hasil yang diharapkan |
|---|---------|------------------------|
| D1 | Layout halaman | Konten **di tengah** (tidak nempel kiri) |
| D2 | Isi hitungan uang / pengeluaran | Verifikasi kas update |
| D3 | Klik **Tutup shift** / **Tutup dengan selisih** | **Tidak** muncul error `User None is disabled` |
| D4 | Setelah sukses | Redirect / pesan buka shift baru; POS Closing Entry terbuat |

---

## E. Buka shift (regresi)

**URL:** `/app/imogi-pos-open-shift`

| # | Langkah | Hasil yang diharapkan |
|---|---------|------------------------|
| E1 | Isi denominasi saldo awal | Total saldo terhitung |
| E2 | **Buka Shift** | Sukses → masuk kasir |
| E3 | Bar shift di kasir | Tampil `Shift POS-OPE-...` |

---

## F. Settings UI (Wave reorganisasi)

**URL:** `/app/imogi-pos-settings`

| # | Langkah | Hasil yang diharapkan |
|---|---------|------------------------|
| F1 | Buka form | Tab: Dasar, Stok, Struk, Import, Dashboard, Loyalty, Bayar, Integrasi, Franchise |
| F2 | Klik tiap tab | Section terkait tampil rapi (bukan satu form panjang) |

---

## G. Cek cepat di database (jika ragu)

```bash
# Order marketplace masih menunggu?
bench --site project.pos mariadb -e "
SELECT name, status, external_order_id FROM \`tabIMOGI POS Order\`
WHERE order_source='Marketplace' ORDER BY creation DESC LIMIT 5;"

# Shift masih terbuka?
bench --site project.pos mariadb -e "
SELECT name, user, status FROM \`tabPOS Opening Entry\`
WHERE docstatus=1 AND (pos_closing_entry IS NULL OR pos_closing_entry='')
ORDER BY creation DESC LIMIT 3;"
```

---

## Ringkasan pass/fail

Centang jika OK:

- [ ] A — Katalog, harga ≠ 0, stok label, variant
- [ ] B — Hold, bayar, toast atas, struk
- [ ] C — Marketplace masuk keranjang → bayar → hilang dari list
- [ ] D — Tutup shift tanpa error User None, layout center
- [ ] E — Buka shift normal
- [ ] F — Settings tab

---

## Jika gagal

| Gejala | Cek |
|--------|-----|
| Harga Rp 0 | Hard refresh; cek Item Price variant di price list POS Profile |
| Marketplace tidak muncul | Settings → Enable Marketplace; cek order `Awaiting Payment` |
| Keranjang kosong setelah import | Hard refresh (`Ctrl+Shift+R`) |
| Tutup shift error | Login ulang kasir; `bench restart` |
| Produk Habis semua | BOM draft? jalankan `fix_menu_bom_flags` / submit BOM |

Lihat juga [PANDUAN_LENGKAP.md](PANDUAN_LENGKAP.md) bagian Troubleshooting.
