# Copyright (c) 2026, Imogi and contributors
"""Smoke test: two-stage Purchase Order approval (tier -> mandatory Owner sign-off).

Business rule (2026-07-20): the tier hierarchy in IMOGI POS Settings.po_approval_tiers
only decides who reviews a PO *first*. Once that stage is approved, the PO must
still get a final, mandatory approval from IMOGI Owner before it actually
submits (moves out of Draft toward To Receive and Bill) — Owner always ends up
aware of every PO that needed approval, even ones a lower-tier approver already
cleared, and even when the original submitter already held the tier role
themselves (which used to skip approval entirely).

Requires on the target site: enable_approval_workflow=1, at least one
po_approval_tiers row below Owner, and enabled users holding "IMOGI Owner" and
the tier's role (e.g. "IMOGI Supervisor") plus a third user who creates POs but
holds neither role. Skips with a clear message if the site isn't set up that way
instead of mutating Settings/users on someone's live config.

Run with:
    bench --site <site> execute imogi_pos.scripts.test_po_two_stage_approval_smoke.run
"""

import frappe
from frappe.utils import cint, flt

from imogi_pos.imogi_pos.utils.approval import PO_FINAL_APPROVER_ROLE


def run():
	frappe.set_user("Administrator")
	print("Running PO two-stage approval smoke tests...\n")

	ctx = _load_context()
	if not ctx:
		return

	test_tier_then_owner_escalation(ctx)
	test_self_qualified_tier_still_needs_owner(ctx)

	print("\nAll PO two-stage approval smoke tests passed.")


def _load_context():
	from imogi_pos.imogi_pos.utils.flow import get_settings

	settings = get_settings()
	if not cint(settings.enable_approval_workflow):
		print("[SKIP] po-approval: Enable Approval Workflow is off on this site")
		return None

	tiers = [row for row in (settings.po_approval_tiers or []) if row.approver_role != PO_FINAL_APPROVER_ROLE]
	if not tiers:
		print("[SKIP] po-approval: no non-Owner tier configured in po_approval_tiers")
		return None
	tier_role = tiers[0].approver_role

	tier_user = _find_user_with_role(tier_role)
	owner_user = _find_user_with_role(PO_FINAL_APPROVER_ROLE)
	submitter = _find_user_without_roles({tier_role, PO_FINAL_APPROVER_ROLE, "System Manager"})
	self_qualified_user = _find_user_who_can_create_po_and_satisfy_tier(tier_role)

	if not (tier_user and owner_user and submitter and self_qualified_user):
		print(
			f"[SKIP] po-approval: need enabled users for tier role '{tier_role}' ({tier_user}), "
			f"'{PO_FINAL_APPROVER_ROLE}' ({owner_user}), a plain submitter ({submitter}), and "
			f"someone who can both create a PO and self-qualify for the tier ({self_qualified_user})"
		)
		return None

	supplier = frappe.db.get_value("Supplier", {"disabled": 0}, "name")
	item = frappe.db.sql(
		"SELECT item_code FROM `tabItem` WHERE disabled = 0 AND is_purchase_item = 1 ORDER BY modified DESC LIMIT 1",
		as_dict=True,
	)
	if not supplier or not item:
		print("[SKIP] po-approval: no active Supplier/purchasable Item on this site to build a test PO")
		return None

	return {
		"tier_role": tier_role,
		"tier_user": tier_user,
		"owner_user": owner_user,
		"submitter": submitter,
		"self_qualified_user": self_qualified_user,
		"supplier": supplier,
		"item_code": item[0].item_code,
	}


def _find_user_with_role(role):
	for user in frappe.get_all("Has Role", filters={"role": role, "parenttype": "User"}, pluck="parent"):
		if user not in ("Administrator", "Guest") and cint(frappe.db.get_value("User", user, "enabled")):
			return user
	return None


def _find_user_without_roles(excluded_roles):
	for user in frappe.get_all("User", filters={"enabled": 1, "name": ["not in", ["Administrator", "Guest"]]}, pluck="name"):
		if not (set(frappe.get_roles(user)) & excluded_roles):
			return user
	return None


def _find_user_who_can_create_po_and_satisfy_tier(tier_role):
	"""Someone who both has Purchase Order create permission AND already
	qualifies as an approver for tier_role (directly or via role escalation) —
	the case that used to skip tier-stage approval entirely."""
	from imogi_pos.imogi_pos.utils.approval import user_can_approve_po_tier

	for user in frappe.get_all("User", filters={"enabled": 1, "name": ["not in", ["Administrator", "Guest"]]}, pluck="name"):
		if not user_can_approve_po_tier(tier_role, user=user):
			continue
		frappe.set_user(user)
		try:
			if frappe.has_permission("Purchase Order", "create"):
				return user
		finally:
			frappe.set_user("Administrator")
	return None


def _new_draft_po(ctx, as_user):
	from imogi_pos.imogi_pos.utils.purchasing_hub import create_purchase_order

	frappe.set_user(as_user)
	try:
		result = create_purchase_order(
			ctx["supplier"],
			[{"item_code": ctx["item_code"], "qty": 1, "rate": 500000}],
		)
	finally:
		frappe.set_user("Administrator")
	return result["name"]


def _submit_as(po_name, as_user):
	frappe.set_user(as_user)
	try:
		frappe.get_doc("Purchase Order", po_name).submit()
		return None
	except frappe.PermissionError as exc:
		return exc
	finally:
		frappe.set_user("Administrator")


def _pending_request_for(po_name, required_role=None):
	filters = {"approval_type": "Purchase Order", "reference_name": po_name, "status": "Pending"}
	if required_role:
		filters["required_role"] = required_role
	return frappe.db.get_value("IMOGI POS Approval Request", filters, "name")


def _approve_as(request_name, as_user):
	from imogi_pos.imogi_pos.utils.approval import approve_request

	frappe.set_user(as_user)
	try:
		approve_request(request_name)
		frappe.db.commit()
	finally:
		frappe.set_user("Administrator")


def _cleanup(po_name):
	frappe.db.delete("IMOGI POS Approval Request", {"approval_type": "Purchase Order", "reference_name": po_name})
	po = frappe.get_doc("Purchase Order", po_name)
	if cint(po.docstatus) == 1:
		po.cancel()
	frappe.delete_doc("Purchase Order", po_name, force=True, ignore_permissions=True)
	frappe.db.commit()


def test_tier_then_owner_escalation(ctx):
	"""Plain submitter (no tier role) -> tier approver approves -> must NOT submit
	yet -> Owner approves -> now it submits."""
	po_name = _new_draft_po(ctx, ctx["submitter"])
	try:
		err = _submit_as(po_name, ctx["submitter"])
		if not err:
			raise AssertionError("po-approval: PO submitted immediately without any approval — gate is not wired")

		tier_request = _pending_request_for(po_name, ctx["tier_role"])
		if not tier_request:
			raise AssertionError(f"po-approval: no pending request for tier role {ctx['tier_role']} was created")

		_approve_as(tier_request, ctx["tier_user"])

		docstatus = cint(frappe.db.get_value("Purchase Order", po_name, "docstatus"))
		if docstatus != 0:
			raise AssertionError(
				f"po-approval: PO was submitted right after tier approval (docstatus={docstatus}) "
				"— Owner escalation is not happening"
			)

		owner_request = _pending_request_for(po_name, PO_FINAL_APPROVER_ROLE)
		if not owner_request:
			raise AssertionError("po-approval: tier approval did not open a second Owner-level request")
		print(f"[PASS] po-approval: tier approval by {ctx['tier_role']} escalates to Owner, PO stays in Draft")

		_approve_as(owner_request, ctx["owner_user"])
		docstatus = cint(frappe.db.get_value("Purchase Order", po_name, "docstatus"))
		if docstatus != 1:
			raise AssertionError(f"po-approval: PO did not submit after Owner approval (docstatus={docstatus})")
		print("[PASS] po-approval: Owner approval submits the PO (To Receive and Bill)")
	finally:
		_cleanup(po_name)


def test_self_qualified_tier_still_needs_owner(ctx):
	"""Submitter who already qualifies for the tier role themselves used to skip
	approval entirely — must now still require the mandatory Owner step."""
	submitter = ctx["self_qualified_user"]
	po_name = _new_draft_po(ctx, submitter)
	try:
		err = _submit_as(po_name, submitter)
		if not err:
			raise AssertionError(
				"po-approval: self-qualified tier submitter's PO submitted with no Owner review at all"
			)

		tier_stage_request = _pending_request_for(po_name, ctx["tier_role"])
		if tier_stage_request:
			raise AssertionError(
				"po-approval: a redundant tier-stage request was created for a self-qualified submitter"
			)

		owner_request = _pending_request_for(po_name, PO_FINAL_APPROVER_ROLE)
		if not owner_request:
			raise AssertionError(
				"po-approval: self-qualified tier submit did not go straight to a mandatory Owner request"
			)
		print(f"[PASS] po-approval: {ctx['tier_role']} submitting their own PO skips straight to Owner (no self-approve bypass)")

		_approve_as(owner_request, ctx["owner_user"])
		docstatus = cint(frappe.db.get_value("Purchase Order", po_name, "docstatus"))
		if docstatus != 1:
			raise AssertionError(f"po-approval: PO did not submit after Owner approval (docstatus={docstatus})")
		print("[PASS] po-approval: Owner approval submits the PO in the self-qualified case too")
	finally:
		_cleanup(po_name)
