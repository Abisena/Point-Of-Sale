# Copyright (c) 2026, Imogi and contributors
"""Temporary aggregate runner for re-audit smoke tests.

Wraps each test in try/except so `bench execute` never hits the
NameError eval-fallback that masks real errors.
"""

import traceback


TESTS = [
	"imogi_pos.scripts.test_subscription_billing.run",
	"imogi_pos.scripts.test_feature_registry.run",
	"imogi_pos.scripts.test_feature_gating.run",
	"imogi_pos.scripts.test_voucher_owner_smoke.run",
	"imogi_pos.scripts.test_loyalty_smoke.run",
	"imogi_pos.scripts.test_imogi_full_suite.run",
]


QUICK_TESTS = [
	"imogi_pos.scripts.test_subscription_billing.run",
	"imogi_pos.scripts.test_feature_registry.run",
	"imogi_pos.scripts.test_feature_gating.run",
	"imogi_pos.scripts.test_voucher_owner_smoke.run",
	"imogi_pos.scripts.test_loyalty_smoke.run",
]


def run_quick():
	return _run(QUICK_TESTS)


def run():
	return _run(TESTS)


def _run(test_list):
	import frappe

	results = {}
	for dotted in test_list:
		mod_path, func_name = dotted.rsplit(".", 1)
		print(f"\n===== {dotted} =====")
		try:
			frappe.set_user("Administrator")
			module = frappe.get_module(mod_path)
			func = getattr(module, func_name)
			ret = func()
			if isinstance(ret, dict) and ret.get("ok") is False:
				issues = ret.get("issues") or ret.get("errors") or []
				results[dotted] = f"FAIL: ok=False {issues}"
				print(f"[FAIL] {dotted}: ok=False {issues}")
			else:
				results[dotted] = "OK"
				print(f"[PASS] {dotted}")
		except Exception as exc:  # noqa: BLE001
			results[dotted] = f"FAIL: {exc}"
			print(f"[FAIL] {dotted}: {exc}")
			traceback.print_exc()

	print("\n===== AUDIT SUMMARY =====")
	for dotted, status in results.items():
		print(f"  {status.split(':')[0]:5} {dotted}")
	failed = [d for d, s in results.items() if s != "OK"]
	print(f"\nTotal: {len(results)}  Passed: {len(results) - len(failed)}  Failed: {len(failed)}")
	return results
