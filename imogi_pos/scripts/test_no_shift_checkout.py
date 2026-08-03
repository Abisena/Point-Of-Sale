"""One-off repro/verification script for the enable_pos_shift=0 checkout gap.

Run: bench --site imogi.pos execute imogi_pos.scripts.test_no_shift_checkout.run
"""

import frappe


def run():
	frappe.set_user("Administrator")

	def sep(t):
		print(f"\n=== {t} ===")

	from imogi_pos.imogi_pos.utils.flow import get_settings

	settings = get_settings()
	company = settings.default_company
	warehouse = settings.default_warehouse

	import imogi_pos.imogi_pos.utils.feature_gating as fg

	orig_is_setting_enabled = fg.is_setting_enabled

	def patched(key, settings=None):
		if key == "enable_pos_shift":
			return False
		return orig_is_setting_enabled(key, settings)

	fg.is_setting_enabled = patched
	print("simulating enable_pos_shift=0 (Warung/Fashion/Jasa/Custom default), in-memory only")

	test_profile_name = "TEST-NO-SHIFT-DIRECT"
	if frappe.db.exists("POS Profile", test_profile_name):
		frappe.delete_doc("POS Profile", test_profile_name, force=True, ignore_permissions=True)

	order = None
	try:
		base = frappe.get_doc("POS Profile", settings.default_pos_profile)
		profile = frappe.copy_doc(base)
		profile.name = test_profile_name
		profile.insert(ignore_permissions=True)
		frappe.db.commit()

		sep("Confirm zero open POS Opening Entry for this fresh profile")
		existing = frappe.get_all(
			"POS Opening Entry",
			filters={"pos_profile": profile.name, "status": "Open", "docstatus": 1},
			fields=["name"],
		)
		print("open entries:", existing)
		assert not existing, "test setup invalid — profile already has an open entry"

		sep("Create a real Riwayat Order pinned to this profile, then checkout")
		from imogi_pos.imogi_pos.utils.flow import create_pos_invoice_from_order

		order = frappe.new_doc("Riwayat Order")
		order.company = company
		order.pos_profile = profile.name
		order.cashier = frappe.session.user
		order.order_channel = "Walk-in"
		order.order_type = "Takeaway"
		order.order_source = "IMOGI POS"
		order.customer = frappe.db.get_value("POS Profile", profile.name, "customer") or "Umum"
		order.append(
			"items",
			{
				"item_code": "TEST-KOPI-SUSU",
				"item_name": "Test Kopi Susu",
				"qty": 1,
				"rate": 18000,
				"warehouse": warehouse,
				"uom": "Nos",
			},
		)
		order.append("payments", {"mode_of_payment": "Cash", "amount": 18000})
		order.insert(ignore_permissions=True)
		order.flags.ignore_permissions = True
		order.submit()
		print("order created:", order.name)

		invoice = create_pos_invoice_from_order(order)
		sep("NO ERROR — invoice created")
		print("invoice:", invoice.name, invoice.grand_total)

		opening = frappe.get_all(
			"POS Opening Entry",
			filters={"pos_profile": profile.name, "status": "Open", "docstatus": 1},
			fields=["name", "user"],
		)
		print("auto-created opening entry:", opening)
	except Exception:
		sep("FAILED")
		import traceback

		traceback.print_exc()
	finally:
		fg.is_setting_enabled = orig_is_setting_enabled
		sep("Cleanup")
		try:
			if order and order.name and frappe.db.exists("Riwayat Order", order.name):
				order.reload()
				if order.docstatus == 1:
					order.cancel()
				frappe.delete_doc("Riwayat Order", order.name, force=True, ignore_permissions=True)
				print("cleaned up test Riwayat Order")
		except Exception as ce:
			print("order cleanup failed (leftover test data):", ce)

		for opening_name in frappe.get_all(
			"POS Opening Entry", filters={"pos_profile": test_profile_name}, pluck="name"
		):
			try:
				doc = frappe.get_doc("POS Opening Entry", opening_name)
				if doc.docstatus == 1:
					doc.cancel()
				frappe.delete_doc("POS Opening Entry", opening_name, force=True, ignore_permissions=True)
				print("cleaned up test POS Opening Entry", opening_name)
			except Exception as ce:
				print("opening entry cleanup failed:", ce)

		if frappe.db.exists("POS Profile", test_profile_name):
			try:
				frappe.delete_doc("POS Profile", test_profile_name, force=True, ignore_permissions=True)
				frappe.db.commit()
				print("cleaned up test POS Profile")
			except Exception as ce:
				print("cleanup failed (leftover test data):", ce)
