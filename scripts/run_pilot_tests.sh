#!/usr/bin/env bash
# Pilot smoke tests — jalankan dari root bench setelah setup API credential.

set -euo pipefail
cd "$(dirname "$0")/../.."

SITE="${IMOGI_SITE:-project.pos}"
echo "=== IMOGI POS pilot tests (site: $SITE) ==="

echo "[1/3] Cashier API smoke..."
bench --site "$SITE" console <<< "
import frappe
frappe.set_user('Administrator')
from imogi_pos.api.cashier import get_cashier_context, create_pos_opening, get_pos_opening_status
from imogi_pos.api.hold import list_holds, save_hold, take_hold, delete_hold
ctx = get_cashier_context()
print('  context OK:', ctx['pos_profile'])
if not ctx.get('pos_opening'):
    create_pos_opening()
    print('  opening created')
print('  holds:', len(list_holds()['holds']))
print('  cashier OK')
" 2>&1 | tail -8

if [[ -n "${IMOGI_API_KEY:-}" && -n "${IMOGI_API_SECRET:-}" ]]; then
	echo "[2/3] Order API flow..."
	python apps/imogi_pos/scripts/test_order_api.py flow || true
else
	echo "[2/3] Order API skipped (set IMOGI_API_KEY + IMOGI_API_SECRET)"
fi

echo "[3/3] Done. Manual: buka /app/imogi-pos-cashier dan /app/imogi-pos-dashboard"
