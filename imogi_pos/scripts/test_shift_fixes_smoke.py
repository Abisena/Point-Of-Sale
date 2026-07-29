# Copyright (c) 2026, Imogi and contributors
"""Smoke test for the Shift-category fixes (2026-07-20):
  1. Buka Shift — race-condition lock + user field can't be spoofed
  2. Cash In/Out — user field can't be spoofed + mandatory approval
  3. Shift Closing Report — branch/company scoping

Run with:
    bench --site <site> execute imogi_pos.scripts.test_shift_fixes_smoke.run
"""

import frappe
from frappe.utils import cint, flt


def run():
	frappe.set_user("Administrator")
	print("Running Shift fix smoke tests...\n")

	test_shift_open_lock()
	test_shift_opening_user_not_spoofable()
	test_cash_movement_user_not_spoofable_and_requires_approval()
	test_shift_closing_report_scoped()

	print("\nAll Shift fix smoke tests passed.")


def test_shift_open_lock():
	from imogi_pos.imogi_pos.utils.shift_opening import _acquire_shift_open_lock, _release_shift_open_lock

	fake_user = "smoke-test-lock-user@example.com"
	_release_shift_open_lock(fake_user)  # clean slate in case a previous run died mid-lock

	first = _acquire_shift_open_lock(fake_user)
	if not first:
		raise AssertionError("shift-open-lock: first acquire should succeed on a clean key")

	second = _acquire_shift_open_lock(fake_user)
	if second:
		raise AssertionError("shift-open-lock: concurrent acquire while held should fail — race condition still open")
	print("[PASS] buka-shift: second concurrent open attempt is blocked while the first is in flight")

	_release_shift_open_lock(fake_user)
	third = _acquire_shift_open_lock(fake_user)
	if not third:
		raise AssertionError("shift-open-lock: acquire after release should succeed again")
	_release_shift_open_lock(fake_user)
	print("[PASS] buka-shift: lock releases cleanly, doesn't strand future opens")


def test_shift_opening_user_not_spoofable():
	other_user = frappe.db.get_value(
		"User", {"enabled": 1, "name": ["not in", ["Administrator", "Guest", frappe.session.user]]}, "name"
	)
	if not other_user:
		print("[SKIP] buka-shift: need a second enabled user on this site to test spoofing")
		return

	doc = frappe.get_doc(
		{
			"doctype": "IMOGI POS Shift Opening",
			"user": other_user,  # attacker-supplied — must be overwritten
			"payments": [{"mode_of_payment": "Cash", "opening_amount": 10000}],
		}
	)
	doc.apply_defaults()
	if doc.user != "Administrator":
		raise AssertionError(f"buka-shift: user field was not forced to session user, got {doc.user!r}")
	print("[PASS] buka-shift: spoofed 'user' field on Shift Opening is overwritten with the real session user")


def test_cash_movement_user_not_spoofable_and_requires_approval():
	from imogi_pos.imogi_pos.utils.flow import get_settings
	from imogi_pos.imogi_pos.utils.shift_opening import create_and_submit_shift_opening
	from imogi_pos.imogi_pos.utils.shift_closing import create_cash_movement

	cashier = frappe.db.get_value("Has Role", {"role": "IMOGI Cashier", "parenttype": "User"}, "parent")
	if not cashier or not cint(frappe.db.get_value("User", cashier, "enabled")):
		print("[SKIP] cash-movement: no enabled IMOGI Cashier user on this site to test with")
		return
	if frappe.db.exists("POS Opening Entry", {"user": cashier, "docstatus": 1, "pos_closing_entry": ["is", "not set"]}):
		print(f"[SKIP] cash-movement: {cashier} already has an open shift, won't touch it")
		return

	settings = get_settings()
	was_enabled = cint(settings.enable_approval_workflow)
	prev_threshold = settings.approval_cash_movement_threshold_amount
	prev_pin = settings.approval_supervisor_pin
	test_pin = "135790"
	settings.enable_approval_workflow = 1
	settings.approval_cash_movement_threshold_amount = 0  # always require approval
	settings.approval_supervisor_pin = test_pin
	settings.save(ignore_permissions=True)
	frappe.db.commit()

	pos_opening_entry = None
	cash_movement_name = None
	try:
		frappe.set_user(cashier)
		opened = create_and_submit_shift_opening([{"mode_of_payment": "Cash", "opening_amount": 100000}])
		pos_opening_entry = opened["pos_opening_entry"]

		# --- user spoof check ---
		doc = frappe.get_doc(
			{
				"doctype": "IMOGI POS Cash Movement",
				"pos_opening_entry": pos_opening_entry,
				"movement_type": "Cash Out",
				"amount": 5000,
				"reason": "smoke test",
				"user": "Administrator",  # attacker-supplied — must be overwritten
			}
		)
		doc.apply_defaults()
		if doc.user != cashier:
			raise AssertionError(f"cash-movement: user field not forced to session user, got {doc.user!r}")
		print("[PASS] cash-in-out: spoofed 'user' field on Cash Movement is overwritten with the real session user")

		# --- approval requirement check ---
		# create_cash_movement() deliberately returns a normal "needs approval"
		# payload instead of raising — frappe.call()'s success `callback` never
		# fires on a thrown exception (only `error`, and with zero arguments
		# for a 403/PermissionError), so the frontend can't act on a thrown
		# error here. See the comment in shift_closing.py for the full reasoning.
		blocked = create_cash_movement(pos_opening_entry, "Cash Out", 5000, "smoke test tanpa approval")
		if not blocked.get("approval_request"):
			raise AssertionError("cash-movement: Cash Out proceeded without approval — gate is not wired")
		print("[PASS] cash-in-out: Cash Out without approval_code returns a pending-approval response (no longer a no-op)")

		request_name = blocked["approval_request"]

		from imogi_pos.imogi_pos.utils.approval import approve_request

		frappe.set_user("Administrator")
		approve_request(request_name, pin=test_pin)
		frappe.db.commit()

		frappe.set_user(cashier)
		result = create_cash_movement(
			pos_opening_entry, "Cash Out", 5000, "smoke test dengan approval", approval_code=request_name
		)
		cash_movement_name = result["name"]
		print("[PASS] cash-in-out: approved code lets the same Cash Out through")
	finally:
		frappe.set_user("Administrator")
		if cash_movement_name:
			doc = frappe.get_doc("IMOGI POS Cash Movement", cash_movement_name)
			if cint(doc.docstatus) == 1:
				doc.cancel()
			frappe.delete_doc("IMOGI POS Cash Movement", cash_movement_name, force=True, ignore_permissions=True)
		frappe.db.delete("IMOGI POS Approval Request", {"approval_type": ["in", ["Cash In", "Cash Out"]]})
		if pos_opening_entry:
			# IMOGI POS Shift Opening links to the POS Opening Entry, so it has
			# to be cancelled/deleted first or the link-exists check blocks
			# cancelling the opening entry below.
			shift_opening_name = frappe.db.get_value(
				"IMOGI POS Shift Opening", {"pos_opening_entry": pos_opening_entry}, "name"
			)
			if shift_opening_name:
				shift_opening = frappe.get_doc("IMOGI POS Shift Opening", shift_opening_name)
				if cint(shift_opening.docstatus) == 1:
					shift_opening.cancel()
				frappe.delete_doc("IMOGI POS Shift Opening", shift_opening_name, force=True, ignore_permissions=True)
			opening = frappe.get_doc("POS Opening Entry", pos_opening_entry)
			if cint(opening.docstatus) == 1:
				opening.cancel()
			frappe.delete_doc("POS Opening Entry", pos_opening_entry, force=True, ignore_permissions=True)
		settings.enable_approval_workflow = was_enabled
		settings.approval_cash_movement_threshold_amount = prev_threshold
		settings.approval_supervisor_pin = prev_pin
		settings.save(ignore_permissions=True)
		frappe.db.commit()


def test_shift_closing_report_scoped():
	from imogi_pos.imogi_pos.report.imogi_shift_closing_report.imogi_shift_closing_report import get_data

	all_rows, _ = get_data({})
	scoped_rows, _ = get_data({"company": "NONEXISTENT-TEST-CO-XYZ"})

	if scoped_rows:
		raise AssertionError(
			f"shift-closing-report: filtering by a company with no accessible branches still returned "
			f"{len(scoped_rows)} row(s) — branch scoping is not applied"
		)
	print("[PASS] shift-closing-report: a company with no accessible branches returns zero rows (scoping applied)")
	print(f"       (Administrator/unscoped view returned {len(all_rows)} row(s) for comparison)")
