### Imogi POS

Custom POS module for Imogi — UMKM cashier, dashboard, order API, kitchen/fulfillment (restaurant mode).

### Dokumentasi operasional

| Dokumen | Isi |
|---------|-----|
| **[PANDUAN_LENGKAP.md](scripts/PANDUAN_LENGKAP.md)** | **Panduan lengkap** — setup, kasir, shift, integrasi, troubleshooting |
| [GO_LIVE_CHECKLIST.md](scripts/GO_LIVE_CHECKLIST.md) | Checklist sebelum go-live |
| [KASIR_GUIDE.md](scripts/KASIR_GUIDE.md) | Panduan singkat untuk kasir (1 halaman) |
| [WEBSITE_INTEGRATION.md](scripts/WEBSITE_INTEGRATION.md) | Order API untuk website |

### Installation

You can install this app using the [bench](https://github.com/frappe/bench) CLI:

```bash
cd $PATH_TO_YOUR_BENCH
bench get-app $URL_OF_THIS_REPO --branch develop
bench install-app imogi_pos
```

### Contributing

This app uses `pre-commit` for code formatting and linting. Please [install pre-commit](https://pre-commit.com/#installation) and enable it for this repository:

```bash
cd apps/imogi_pos
pre-commit install
```

Pre-commit is configured to use the following tools for checking and formatting your code:

- ruff
- eslint
- prettier
- pyupgrade

### License

mit
