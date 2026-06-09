# Panduan Kasir IMOGI POS (UMKM)

## Buka kasir

1. Login ERPNext
2. Menu **Imogi POS** → **IMOGI Kasir**  
   Atau langsung: `/app/imogi-pos-cashier`

## Menjual

| Aksi | Cara |
|------|------|
| Tambah produk | Tap kartu produk |
| Cari nama | Ketik di kolom search |
| Scan barcode | Arahkan scanner ke kolom search → otomatis Enter |
| Fokus search | Tekan **F2** |
| Ubah qty | Tombol **−** / **+** di keranjang |
| Kosongkan | **Kosongkan** |
| Tahan order | **Tahan** → isi label (opsional) → order tersimpan di server |
| Lihat / ambil ditahan | Bar kuning **Lihat** → pilih **Ambil** atau **Hapus** (max 5 order) |
| Buka shift | **Buka Shift** → form **POS Opening Entry** (isi saldo awal per metode bayar) → Submit |
| Tutup shift | **Tutup Shift** → **POS Closing Entry** (rekonsiliasi kas) |

## Customer & diskon

- **Cari customer** di kolom bawah keranjang (opsional)
- **Diskon**: pilih Tanpa diskon / Diskon % / Diskon Rp

## Pembayaran

1. Klik **Bayar Sekarang**
2. Pilih metode bayar
3. **Cash**: isi *Uang Diterima* → lihat **Kembalian** (tombol cepat: Pas, bulat 1rb/5rb/10rb/50rb/100rb)
4. **Selesaikan Pembayaran**
5. Opsional: **Cetak Struk** (jika diaktifkan admin)

## Tips

- Order ditahan tersimpan di **server** (per user login), maksimal **5 order**
- Nama produk panjang dipotong dengan `...` — tap tetap menambah item yang benar
- Stok habis: kartu produk redup, tidak bisa ditap
- Setelah sukses, keranjang otomatis kosong untuk transaksi berikutnya

## Masalah umum

| Gejala | Solusi |
|--------|--------|
| Produk tidak muncul | Cek POS Profile item group & price list |
| Barcode tidak ketemu | Pastikan barcode terdaftar di Item Barcode |
| Checkout gagal | Cek stok warehouse; jika shift aktif, **Buka Shift** dulu |
| Struk tidak muncul | Admin aktifkan *Enable Receipt Print* di Settings |
