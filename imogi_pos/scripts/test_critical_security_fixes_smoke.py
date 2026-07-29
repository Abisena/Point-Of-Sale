# Copyright (c) 2026, Imogi and contributors
"""Smoke test for the 5 Critical security fixes (2026-07-20 audit):
  1. Approval Request self-approval bypass
  2. Discount/Void/Refund/Complimentary approval no-op
  3. QRIS/payment gateway webhook signature verification
  4. Loyalty Member arbitrary points write
  5. Shift Closing ownership bypass

Run with:
    bench --site <site> execute imogi_pos.scripts.test_critical_security_fixes_smoke.run

Each check prints [PASS]/[FAIL] and raises AssertionError on the first failure
so a non-zero exit code is easy to spot in CI/manual runs. Test data created
along the way is cleaned up at the end of each check.
"""

import frappe
from frappe.utils import cint, flt


def run():
	frappe.set_user("Administrator")
	print("Running critical security fix smoke tests...\n")

	test_approval_self_approval_blocked()
	test_approval_void_requires_pin()
	test_qris_webhook_signature_enforced()
	test_loyalty_points_cannot_be_forced()
	test_shift_closing_ownership_enforced()

	print("\nAll critical security fix smoke tests passed.")


def test_approval_self_approval_blocked():
	"""Fix #1: writing status=Approved directly (bypassing approve_request()) must be rejected."""
	from imogi_pos.imogi_pos.utils.approval import create_approval_request

	name = create_approval_request(approval_type="Waste", reference_name=None, amount=1000)
	frappe.db.commit()
	try:
		doc = frappe.get_doc("IMOGI POS Approval Request", name)
		doc.status = "Approved"
		try:
			doc.save(ignore_permissions=True)
		except frappe.PermissionError:
			print("[PASS] approval: direct status=Approved write is blocked")
		else:
			raise AssertionError(
				"approval: direct status edit to Approved was NOT blocked — self-approval bypass still open"
			)
	finally:
		frappe.delete_doc("IMOGI POS Approval Request", name, force=True, ignore_permissions=True)
		frappe.db.commit()


def test_approval_void_requires_pin():
	"""Fix #2: Void must actually block and create a pending request when the
	workflow toggle is on — it must no longer be a silent no-op."""
	from imogi_pos.imogi_pos.utils.flow import get_settings

	settings = get_settings()
	was_enabled = cint(settings.enable_approval_workflow)
	if not was_enabled:
		settings.enable_approval_workflow = 1
		settings.save(ignore_permissions=True)
		frappe.db.commit()

	fake_reference = "TEST-VOID-DOES-NOT-EXIST"
	try:
		from imogi_pos.imogi_pos.utils.approval import require_supervisor_approval

		try:
			require_supervisor_approval("Void", reference_name=fake_reference, amount=50000)
		except frappe.PermissionError:
			print("[PASS] approval: Void without approval_code is blocked (no longer a no-op)")
		else:
			raise AssertionError("approval: Void proceeded without approval — bypass still open")
	finally:
		frappe.db.delete(
			"IMOGI POS Approval Request",
			{"approval_type": "Void", "reference_name": fake_reference},
		)
		if not was_enabled:
			settings.enable_approval_workflow = 0
			settings.save(ignore_permissions=True)
		frappe.db.commit()


def test_qris_webhook_signature_enforced():
	"""Fix #3: a webhook payload with a forged/missing signature must be rejected."""
	from imogi_pos.imogi_pos.utils.payment_gateway import handle_gateway_webhook, is_gateway_enabled

	if not is_gateway_enabled():
		print("[SKIP] integrasi: payment gateway is not configured on this site — nothing to verify")
		return

	fake_payload = {
		"order_id": "IMOGI-does-not-exist",
		"transaction_status": "settlement",
		"status_code": "200",
		"gross_amount": "10000.00",
		"signature_key": "forged-invalid-signature",
	}
	result = handle_gateway_webhook("Midtrans", fake_payload)
	if result.get("ok"):
		raise AssertionError(f"integrasi: forged QRIS webhook was accepted: {result}")
	print("[PASS] integrasi: forged QRIS webhook is rejected:", result)


def test_loyalty_points_cannot_be_forced():
	"""Fix #4: points must always be recomputed from total_earned - total_redeemed."""
	from imogi_pos.imogi_pos.utils.loyalty import get_or_create_member

	customer = frappe.db.get_value("Customer", {}, "name")
	company = frappe.db.get_value("Company", {}, "name")
	if not customer or not company:
		print("[SKIP] loyalty: no Customer/Company on this site to test with")
		return

	member = get_or_create_member(customer, company)
	expected = cint(member.total_earned) - cint(member.total_redeemed)

	member.points = 999999
	member.save(ignore_permissions=True)
	member.reload()

	if member.points == 999999:
		raise AssertionError("loyalty: points was NOT recalculated — arbitrary write still works")
	if member.points != expected:
		raise AssertionError(f"loyalty: points recalculated to {member.points}, expected {expected}")
	print(f"[PASS] loyalty: points forced to 999999 was reset to {member.points} (total_earned - total_redeemed)")


def test_shift_closing_ownership_enforced():
	"""Fix #5: validating a Shift Closing against someone else's open shift must be rejected."""
	from imogi_pos.imogi_pos.utils.shift_closing import validate_shift_closing

	opening = frappe.db.get_value(
		"POS Opening Entry",
		{"docstatus": 1, "pos_closing_entry": ["is", "not set"]},
		["name", "user"],
		as_dict=True,
	)
	if not opening:
		print("[SKIP] shift: no open POS Opening Entry on this site to test with")
		return

	other_user = frappe.db.get_value(
		"User",
		{"enabled": 1, "name": ["not in", [opening.user, "Administrator", "Guest"]]},
		"name",
	)
	if not other_user or "System Manager" in frappe.get_roles(other_user):
		print("[SKIP] shift: no non-owning, non-admin user available on this site to test with")
		return

	fake_doc = frappe._dict(pos_opening_entry=opening.name, actual_cash=0, expenses=0)
	frappe.set_user(other_user)
	try:
		try:
			validate_shift_closing(fake_doc)
		except frappe.PermissionError:
			print(f"[PASS] shift: {other_user} is blocked from closing {opening.user}'s shift ({opening.name})")
		else:
			raise AssertionError(
				f"shift: {other_user} was able to validate a close for {opening.user}'s shift — bypass still open"
			)
	finally:
		frappe.set_user("Administrator")
