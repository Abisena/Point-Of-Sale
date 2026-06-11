#!/usr/bin/env python3
"""
Contoh tes Riwayat Order API (Python + requests).

Setup:
  1. IMOGI POS Settings → aktifkan Order API → Save
  2. Isi credential di environment atau file .env lokal

Install dependency (di luar bench):
  pip install requests

Usage:
  export IMOGI_API_KEY=... IMOGI_API_SECRET=...
  python apps/imogi_pos/scripts/test_order_api.py create --auto-pay
  python apps/imogi_pos/scripts/test_order_api.py status ORD-2026-00001
  python apps/imogi_pos/scripts/test_order_api.py flow   # create → pay → status
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from typing import Any

try:
	import requests
except ImportError:
	print("Install requests: pip install requests", file=sys.stderr)
	sys.exit(1)


BASE_URL = os.environ.get("IMOGI_API_URL", "http://localhost:8003").rstrip("/")
API_KEY = os.environ.get("IMOGI_API_KEY", "")
API_SECRET = os.environ.get("IMOGI_API_SECRET", "")
DEFAULT_ITEM = os.environ.get("IMOGI_ITEM_CODE", "Item Makanan 1")
DEFAULT_MOP = os.environ.get("IMOGI_MODE_OF_PAYMENT", "Cash")

ENDPOINTS = {
	"create": "/api/method/imogi_pos.api.order.create_order",
	"pay": "/api/method/imogi_pos.api.order.pay_order",
	"status": "/api/method/imogi_pos.api.order.get_order_status",
	"void": "/api/method/imogi_pos.api.order.void_order",
	"refund": "/api/method/imogi_pos.api.order.refund_order",
}


class ImogiOrderAPI:
	def __init__(self, base_url: str, api_key: str, api_secret: str):
		if not api_key or not api_secret:
			raise SystemExit(
				"Set IMOGI_API_KEY and IMOGI_API_SECRET (from IMOGI POS Settings → Order API)"
			)
		self.base_url = base_url
		self.session = requests.Session()
		self.session.headers.update(
			{
				"X-Imogi-Api-Key": api_key,
				"X-Imogi-Api-Secret": api_secret,
			}
		)

	def call(self, method: str, path: str, **params) -> dict[str, Any]:
		url = f"{self.base_url}{path}"
		if method.upper() == "GET":
			response = self.session.get(url, params=params, timeout=60)
		else:
			response = self.session.post(url, data=params, timeout=60)

		try:
			payload = response.json()
		except ValueError:
			response.raise_for_status()
			raise SystemExit(f"Non-JSON response: {response.text[:500]}")

		if response.status_code >= 400 or payload.get("exc_type"):
			message = payload.get("message") or payload.get("exc") or payload
			raise SystemExit(f"API error ({response.status_code}): {message}")

		return payload.get("message", payload)

	def create_order(
		self,
		item_code: str,
		qty: float = 1,
		rate: float = 15000,
		auto_pay: bool = False,
		mode_of_payment: str | None = None,
		customer: str | None = None,
	) -> dict[str, Any]:
		items = json.dumps([{"item_code": item_code, "qty": qty, "rate": rate}])
		params: dict[str, Any] = {
			"items": items,
			"order_channel": "Web",
			"order_type": "Takeaway",
		}
		if customer:
			params["customer"] = customer
		if auto_pay:
			mop = mode_of_payment or DEFAULT_MOP
			total = qty * rate
			params["auto_pay"] = 1
			params["payments"] = json.dumps(
				[{"mode_of_payment": mop, "amount": total}]
			)
		return self.call("POST", ENDPOINTS["create"], **params)

	def pay_order(
		self,
		order_name: str,
		amount: float,
		mode_of_payment: str | None = None,
	) -> dict[str, Any]:
		mop = mode_of_payment or DEFAULT_MOP
		return self.call(
			"POST",
			ENDPOINTS["pay"],
			order_name=order_name,
			payments=json.dumps([{"mode_of_payment": mop, "amount": amount}]),
		)

	def get_status(self, order_name: str) -> dict[str, Any]:
		return self.call("GET", ENDPOINTS["status"], order_name=order_name)

	def void_order(self, order_name: str, reason: str = "Void via test script") -> dict[str, Any]:
		return self.call(
			"POST",
			ENDPOINTS["void"],
			order_name=order_name,
			reason=reason,
		)

	def refund_order(self, order_name: str, reason: str = "Refund via test script") -> dict[str, Any]:
		return self.call(
			"POST",
			ENDPOINTS["refund"],
			order_name=order_name,
			reason=reason,
		)


def print_json(data: Any) -> None:
	print(json.dumps(data, indent=2, ensure_ascii=False))


def main() -> None:
	parser = argparse.ArgumentParser(description="Test Riwayat Order API")
	sub = parser.add_subparsers(dest="command", required=True)

	p_create = sub.add_parser("create", help="Create order (optional auto pay)")
	p_create.add_argument("--item", default=DEFAULT_ITEM)
	p_create.add_argument("--qty", type=float, default=1)
	p_create.add_argument("--rate", type=float, default=15000)
	p_create.add_argument("--auto-pay", action="store_true")
	p_create.add_argument("--mop", default=DEFAULT_MOP, help="Mode of Payment")
	p_create.add_argument("--customer", default=None)

	p_pay = sub.add_parser("pay", help="Pay existing order")
	p_pay.add_argument("order_name")
	p_pay.add_argument("--amount", type=float, required=True)
	p_pay.add_argument("--mop", default=DEFAULT_MOP)

	p_status = sub.add_parser("status", help="Get order status")
	p_status.add_argument("order_name")

	p_void = sub.add_parser("void", help="Void unpaid order")
	p_void.add_argument("order_name")
	p_void.add_argument("--reason", default="Void via test script")

	p_refund = sub.add_parser("refund", help="Refund paid order")
	p_refund.add_argument("order_name")
	p_refund.add_argument("--reason", default="Refund via test script")

	p_flow = sub.add_parser("flow", help="Demo: create unpaid → pay → status")
	p_flow.add_argument("--item", default=DEFAULT_ITEM)
	p_flow.add_argument("--qty", type=float, default=1)
	p_flow.add_argument("--rate", type=float, default=15000)
	p_flow.add_argument("--mop", default=DEFAULT_MOP)

	args = parser.parse_args()
	api = ImogiOrderAPI(BASE_URL, API_KEY, API_SECRET)

	if args.command == "create":
		result = api.create_order(
			item_code=args.item,
			qty=args.qty,
			rate=args.rate,
			auto_pay=args.auto_pay,
			mode_of_payment=args.mop,
			customer=args.customer,
		)
		print_json(result)

	elif args.command == "pay":
		result = api.pay_order(args.order_name, args.amount, args.mop)
		print_json(result)

	elif args.command == "status":
		result = api.get_status(args.order_name)
		print_json(result)

	elif args.command == "void":
		result = api.void_order(args.order_name, args.reason)
		print_json(result)

	elif args.command == "refund":
		result = api.refund_order(args.order_name, args.reason)
		print_json(result)

	elif args.command == "flow":
		print("1) Create order (unpaid)...")
		order = api.create_order(
			item_code=args.item,
			qty=args.qty,
			rate=args.rate,
			auto_pay=False,
		)
		print_json(order)
		order_name = order["name"]
		total = order["grand_total"]

		print(f"\n2) Pay order {order_name}...")
		paid = api.pay_order(order_name, total, args.mop)
		print_json(paid)

		print(f"\n3) Final status {order_name}...")
		status = api.get_status(order_name)
		print_json(status)


if __name__ == "__main__":
	main()
