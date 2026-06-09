#!/usr/bin/env bash
# Contoh tes IMOGI POS Order API dengan cURL
#
# Setup:
#   1. IMOGI POS Settings → aktifkan Order API → Save (catat API Key & Secret)
#   2. export variabel di bawah, lalu jalankan perintah contoh
#
# Usage:
#   chmod +x apps/imogi_pos/scripts/test_order_api.sh
#   source apps/imogi_pos/scripts/test_order_api.env   # atau set manual
#   ./apps/imogi_pos/scripts/test_order_api.sh create
#   ./apps/imogi_pos/scripts/test_order_api.sh status ORD-2026-00001

set -euo pipefail

BASE_URL="${IMOGI_API_URL:-http://localhost:8003}"
API_KEY="${IMOGI_API_KEY:?Set IMOGI_API_KEY}"
API_SECRET="${IMOGI_API_SECRET:?Set IMOGI_API_SECRET}"
ITEM_CODE="${IMOGI_ITEM_CODE:-Item Makanan 1}"
MOP="${IMOGI_MODE_OF_PAYMENT:-Cash}"

AUTH_KEY="X-Imogi-Api-Key: ${API_KEY}"
AUTH_SECRET="X-Imogi-Api-Secret: ${API_SECRET}"

api_call() {
	local method="$1"
	local endpoint="$2"
	shift 2
	if [[ "$method" == "GET" ]]; then
		curl -sS -G "${BASE_URL}${endpoint}" \
			-H "${AUTH_KEY}" \
			-H "${AUTH_SECRET}" \
			"$@"
	else
		curl -sS -X POST "${BASE_URL}${endpoint}" \
			-H "${AUTH_KEY}" \
			-H "${AUTH_SECRET}" \
			-H "Content-Type: application/x-www-form-urlencoded" \
			"$@"
	fi
}

pretty() {
	if command -v jq >/dev/null 2>&1; then
		jq .
	else
		python3 -m json.tool
	fi
}

cmd="${1:-help}"
ORDER_NAME="${2:-}"

case "$cmd" in
create)
	# Buat order + bayar sekaligus (auto_pay=1)
	api_call POST "/api/method/imogi_pos.api.order.create_order" \
		--data-urlencode "items=[{\"item_code\":\"${ITEM_CODE}\",\"qty\":1,\"rate\":15000}]" \
		--data-urlencode "order_channel=Web" \
		--data-urlencode "order_type=Takeaway" \
		--data-urlencode "auto_pay=1" \
		--data-urlencode "payments=[{\"mode_of_payment\":\"${MOP}\",\"amount\":15000}]" \
		| pretty
	;;

create-unpaid)
	# Buat order saja (belum bayar)
	api_call POST "/api/method/imogi_pos.api.order.create_order" \
		--data-urlencode "items=[{\"item_code\":\"${ITEM_CODE}\",\"qty\":2,\"rate\":15000}]" \
		--data-urlencode "order_channel=Web" \
		| pretty
	;;

pay)
	if [[ -z "$ORDER_NAME" ]]; then
		echo "Usage: $0 pay ORD-2026-00001" >&2
		exit 1
	fi
	api_call POST "/api/method/imogi_pos.api.order.pay_order" \
		--data-urlencode "order_name=${ORDER_NAME}" \
		--data-urlencode "payments=[{\"mode_of_payment\":\"${MOP}\",\"amount\":30000}]" \
		| pretty
	;;

status)
	if [[ -z "$ORDER_NAME" ]]; then
		echo "Usage: $0 status ORD-2026-00001" >&2
		exit 1
	fi
	api_call GET "/api/method/imogi_pos.api.order.get_order_status" \
		--data-urlencode "order_name=${ORDER_NAME}" \
		| pretty
	;;

void)
	if [[ -z "$ORDER_NAME" ]]; then
		echo "Usage: $0 void ORD-2026-00001" >&2
		exit 1
	fi
	api_call POST "/api/method/imogi_pos.api.order.void_order" \
		--data-urlencode "order_name=${ORDER_NAME}" \
		--data-urlencode "reason=Test void via API" \
		| pretty
	;;

refund)
	if [[ -z "$ORDER_NAME" ]]; then
		echo "Usage: $0 refund ORD-2026-00001" >&2
		exit 1
	fi
	api_call POST "/api/method/imogi_pos.api.order.refund_order" \
		--data-urlencode "order_name=${ORDER_NAME}" \
		--data-urlencode "reason=Test refund via API" \
		| pretty
	;;

help|*)
	cat <<EOF
IMOGI POS Order API — contoh cURL

Variabel wajib:
  IMOGI_API_KEY       API Key dari IMOGI POS Settings
  IMOGI_API_SECRET    API Secret dari IMOGI POS Settings

Variabel opsional:
  IMOGI_API_URL       default: http://localhost:8003
  IMOGI_ITEM_CODE     default: Item Makanan 1
  IMOGI_MODE_OF_PAYMENT  default: Cash

Perintah:
  create              Buat order + bayar (auto_pay)
  create-unpaid       Buat order tanpa bayar
  pay <order>         Bayar order yang awaiting payment
  status <order>      Cek status order
  void <order>        Batalkan order belum/sedang unpaid
  refund <order>      Refund order yang sudah dibayar

Contoh:
  export IMOGI_API_KEY=abc IMOGI_API_SECRET=xyz
  $0 create
  $0 status ORD-2026-00012
  $0 refund ORD-2026-00012
EOF
	;;
esac
