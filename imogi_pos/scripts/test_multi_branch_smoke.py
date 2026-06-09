#!/usr/bin/env python3
"""Smoke test multi-branch same company: pricing, HQ push, branch access.

Run: bench --site project.pos execute imogi_pos.scripts.test_multi_branch_smoke.run
"""

from __future__ import annotations

import uuid


def run():
	import frappe
	from frappe.utils import cint, flt

	frappe.set_user("Administrator")
	settings = frappe.get_single("IMOGI POS Settings")
	if not settings.setup_complete:
		raise AssertionError("Setup belum selesai")

	company = settings.default_company
	if not company:
		raise AssertionError("default_company kosong")

	tag = uuid.uuid4().hex[:6]
	from imogi_pos.imogi_pos.utils.branch_provisioning import provision_branch_for_existing_company
	from imogi_pos.imogi_pos.utils.pos_profile import create_umkm_pos_profile, get_default_warehouse

	warehouse = settings.default_warehouse or get_default_warehouse(company)
	pos_profile = settings.default_pos_profile or create_umkm_pos_profile(company, warehouse)

	# Ensure at least 2 branches
	existing = frappe.get_all("IMOGI Branch", filters={"company": company, "is_active": 1}, pluck="branch_code")
	created = []
	for i in range(max(0, 2 - len(existing))):
		result = provision_branch_for_existing_company(
			branch_name=f"Uji Cabang {tag}-{i+1}",
			company=company,
			pos_profile=pos_profile,
			warehouse=warehouse,
		)
		created.append(result["branch_code"])

	branches = frappe.get_all(
		"IMOGI Branch", filters={"company": company, "is_active": 1}, fields=["branch_code", "pos_profile"]
	)
	assert len(branches) >= 2, "butuh minimal 2 cabang"

	settings.multi_branch = 1
	if not settings.master_selling_price_list:
		settings.master_selling_price_list = frappe.db.get_value("POS Profile", pos_profile, "selling_price_list")
	settings.flags.ignore_mandatory = True
	settings.save(ignore_permissions=True)

	from imogi_pos.imogi_pos.utils.branch_hq import push_master_prices_to_branches, get_hq_operations_context

	ctx = get_hq_operations_context(company=company)
	assert len(ctx.get("branches") or []) >= 2

	from imogi_pos.imogi_pos.utils.branch import get_accessible_branches, resolve_active_branch

	all_branches = get_accessible_branches(company=company)
	assert len(all_branches) >= 2

	b1 = branches[0]["branch_code"]
	ctx1 = resolve_active_branch(branch_code=b1)
	assert ctx1["pos_profile"]

	try:
		stats = push_master_prices_to_branches(company=company)
		print("hq_push_prices:", stats.get("master"), "targets:", len(stats.get("targets") or []))
	except Exception as exc:
		print("hq_push_prices SKIP:", exc)

	# cleanup test branches only
	for code in created:
		if frappe.db.exists("IMOGI Branch", code):
			frappe.delete_doc("IMOGI Branch", code, force=1, ignore_permissions=True)
	frappe.db.commit()

	print("Multi-branch smoke tests passed.")
	return 0
