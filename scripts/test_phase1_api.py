#!/usr/bin/env python3
"""
Test IMOGI POS Phase 1 API: catalog, customer, order integration.

Usage:
  export IMOGI_API_URL=http://localhost:8003
  export IMOGI_API_KEY=...
  export IMOGI_API_SECRET=...
  python apps/imogi_pos/scripts/test_phase1_api.py
  python apps/imogi_pos/scripts/test_phase1_api.py catalog
  python apps/imogi_pos/scripts/test_phase1_api.py customer
  python apps/imogi_pos/scripts/test_phase1_api.py integration
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from typing import Any

try:
	import requests
except ImportError:
	print("Install requests: pip install requests", file=sys.stderr)
	sys.exit(1)


BASE_URL = os.environ.get("IMOGI_API_URL", "http://localhost:8003").rstrip("/")
API_KEY = os.environ.get("IMOGI_API_KEY", "")
API_SECRET = os.environ.get("IMOGI_API_SECRET", "")


class ImogiAPI:
	ENDPOINTS = {
		"items": "/api/method/imogi_pos.api.catalog.get_items",
		"item": "/api/method/imogi_pos.api.catalog.get_item",
		"search_customers": "/api/method/imogi_pos.api.customer_api.search_customers",
		"create_customer": "/api/method/imogi_pos.api.customer_api.create_customer",
		"get_customer": "/api/method/imogi_pos.api.customer_api.get_customer",
		"create_order": "/api/method/imogi_pos.api.order.create_order",
	}

	def __init__(self, base_url: str, api_key: str, api_secret: str):
		if not api_key or not api_secret:
			raise SystemExit("Set IMOGI_API_KEY and IMOGI_API_SECRET")
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

		payload = response.json()
		if response.status_code >= 400 or payload.get("exc_type"):
			message = payload.get("message") or payload.get("exc") or payload
			raise SystemExit(f"API error ({response.status_code}): {message}")

		return payload.get("message", payload)


def print_json(data: Any) -> None:
	print(json.dumps(data, indent=2, ensure_ascii=False))


def test_catalog(api: ImogiAPI) -> str:
	print("=== get_items ===")
	items = api.call("GET", api.ENDPOINTS["items"], limit=5)
	print_json(items)
	if not items.get("items"):
		raise SystemExit("No items returned")

	item_code = items["items"][0]["item_code"]
	print(f"\n=== get_item ({item_code}) ===")
	item = api.call("GET", api.ENDPOINTS["item"], item_code=item_code)
	print_json(item)
	return item_code


def test_customer(api: ImogiAPI) -> str:
	print("=== search_customers ===")
	found = api.call("GET", api.ENDPOINTS["search_customers"], search="", limit=5)
	print_json(found)

	name = f"API Test {int(time.time())}"
	print(f"\n=== create_customer ({name}) ===")
	created = api.call(
		"POST",
		api.ENDPOINTS["create_customer"],
		customer_name=name,
		customer_type="Individual",
		mobile_no="081234567890",
	)
	print_json(created)

	print(f"\n=== get_customer ({created['name']}) ===")
	customer = api.call("GET", api.ENDPOINTS["get_customer"], customer=created["name"])
	print_json(customer)
	return created["name"]


def test_integration(api: ImogiAPI) -> None:
	item_code = test_catalog(api)
	customer = test_customer(api)

	print("\n=== create_order with catalog item + customer ===")
	items = json.dumps([{"item_code": item_code, "qty": 1, "rate": 15000}])
	payments = json.dumps([{"mode_of_payment": "Cash", "amount": 15000}])
	order = api.call(
		"POST",
		api.ENDPOINTS["create_order"],
		items=items,
		customer=customer,
		auto_pay=1,
		payments=payments,
	)
	print_json(order)
	print("\nIntegration OK:", order.get("name"), order.get("status"))


def main() -> None:
	parser = argparse.ArgumentParser(description="Test IMOGI POS Phase 1 API")
	parser.add_argument(
		"command",
		nargs="?",
		default="all",
		choices=["all", "catalog", "customer", "integration"],
	)
	args = parser.parse_args()
	api = ImogiAPI(BASE_URL, API_KEY, API_SECRET)

	if args.command in ("all", "catalog"):
		test_catalog(api)
	if args.command in ("all", "customer"):
		test_customer(api)
	if args.command in ("all", "integration"):
		test_integration(api)

	print("\nAll Phase 1 tests passed.")


if __name__ == "__main__":
	main()
