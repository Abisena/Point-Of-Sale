# Copyright (c) 2026, Imogi and contributors
"""Loyalty points and voucher promotions for IMOGI POS."""

import re

import frappe
from frappe import _
from frappe.utils import cint, flt, getdate, now_datetime, today

from imogi_pos.imogi_pos.utils.flow import get_settings, resolve_company


def normalize_phone(phone):
	"""Normalisasi No. HP untuk pencocokan (hilangkan format, 62/+62 -> 0)."""
	digits = re.sub(r"\D", "", phone or "")
	if not digits:
		return ""
	if digits.startswith("62"):
		digits = "0" + digits[2:]
	return digits


def _resolve_customer_phone_for_voucher(customer):
	if not customer:
		return ""
	from imogi_pos.api.customer_api import _contact_phone, _get_customer_contact

	contact = _get_customer_contact(customer)
	return _contact_phone(contact) if contact else ""


def get_loyalty_config(settings=None):
	from imogi_pos.imogi_pos.utils.feature_gating import is_setting_enabled

	settings = settings or get_settings()
	return {
		"enabled": is_setting_enabled("enable_loyalty", settings),
		"points_per_amount": flt(settings.loyalty_points_per_amount) or 10000,
		"point_value": flt(settings.loyalty_point_value) or 100,
		"min_redeem_points": max(1, cint(settings.loyalty_min_redeem_points) or 1),
	}


def is_loyalty_enabled(settings=None):
	return bool(get_loyalty_config(settings)["enabled"])


def get_or_create_member(customer, company=None):
	if not customer:
		frappe.throw(_("Customer is required for loyalty member"))

	company = resolve_company(company)
	existing = frappe.db.get_value(
		"IMOGI POS Loyalty Member",
		{"customer": customer, "company": company},
		"name",
	)
	if existing:
		return frappe.get_doc("IMOGI POS Loyalty Member", existing)

	member = frappe.get_doc(
		{
			"doctype": "IMOGI POS Loyalty Member",
			"customer": customer,
			"company": company,
			"points": 0,
			"total_earned": 0,
			"total_redeemed": 0,
		}
	)
	member.insert(ignore_permissions=True)
	from imogi_pos.imogi_pos.utils.loyalty_tiers import sync_member_tier

	sync_member_tier(member)
	member.save(ignore_permissions=True)
	return member


def serialize_member(member, config=None):
	config = config or get_loyalty_config()
	points = cint(member.points)
	from imogi_pos.imogi_pos.utils.loyalty_tiers import get_tier_for_points, serialize_tier

	tier = None
	if member.loyalty_tier and frappe.db.exists("IMOGI POS Loyalty Tier", member.loyalty_tier):
		tier = frappe.get_doc("IMOGI POS Loyalty Tier", member.loyalty_tier)
	else:
		tier = get_tier_for_points(member.total_earned, member.company)
	return {
		"name": member.name,
		"customer": member.customer,
		"company": member.company,
		"points": points,
		"total_earned": cint(member.total_earned),
		"total_redeemed": cint(member.total_redeemed),
		"redeemable_amount": flt(points * config["point_value"]),
		"point_value": config["point_value"],
		"min_redeem_points": config["min_redeem_points"],
		"tier": serialize_tier(tier),
		"tier_multiplier": flt(member.tier_multiplier) or (flt(tier.point_multiplier) if tier else 1),
		"date_of_birth": str(member.date_of_birth) if member.date_of_birth else None,
	}


def get_customer_loyalty(customer, company=None):
	from imogi_pos.imogi_pos.utils.planned_features import get_birthday_promo_status

	company = resolve_company(company)
	birthday = get_birthday_promo_status(customer, company=company)

	if not customer or not is_loyalty_enabled():
		return {
			"enabled": False,
			"customer": customer,
			"birthday": birthday,
		}

	member = get_or_create_member(customer, company)
	config = get_loyalty_config()
	from imogi_pos.imogi_pos.utils.stamp_card import serialize_stamp

	result = {"enabled": True, **serialize_member(member, config)}
	result["stamp"] = serialize_stamp(member)
	result["birthday"] = birthday
	result["date_of_birth"] = birthday.get("date_of_birth")
	return result


def set_member_birthday(customer, date_of_birth, company=None):
	"""Simpan tanggal lahir di loyalty member (+ sync Customer.imogi_birthday)."""
	if not customer:
		frappe.throw(_("Customer wajib diisi"))
	company = resolve_company(company)
	member = get_or_create_member(customer, company)
	dob = getdate(date_of_birth) if date_of_birth else None
	member.date_of_birth = dob
	member.save(ignore_permissions=True)
	if frappe.get_meta("Customer").has_field("imogi_birthday"):
		frappe.db.set_value("Customer", customer, "imogi_birthday", dob, update_modified=False)
	return get_customer_loyalty(customer, company=company)


def _manual_discount(subtotal, discount_type=None, discount_value=None):
	discount_value = flt(discount_value)
	if discount_type == "Percent" and discount_value:
		return subtotal * discount_value / 100
	if discount_type == "Amount" and discount_value:
		return min(discount_value, subtotal)
	return 0


def _resolve_checkout_phone(customer=None, customer_phone=None):
	"""No. HP saat checkout: input kasir dulu, lalu Contact customer."""
	phone = normalize_phone(customer_phone)
	if phone:
		return phone
	if customer:
		return normalize_phone(_resolve_customer_phone_for_voucher(customer))
	return ""


def _validate_voucher_owner(voucher, customer=None, customer_phone=None):
	"""Voucher tanpa pemilik = bisa dipakai siapa saja."""
	owner_customer = (voucher.customer or "").strip()
	owner_mobile = normalize_phone(voucher.customer_mobile)
	if not owner_customer and not owner_mobile:
		return

	checkout_customer = (customer or "").strip()
	checkout_phone = _resolve_checkout_phone(customer, customer_phone)
	code = voucher.voucher_code

	if owner_mobile:
		if not checkout_phone:
			frappe.throw(
				_("Voucher {0} khusus untuk pemilik. Isi No. HP customer terlebih dahulu.").format(code)
			)
		if checkout_phone != owner_mobile:
			frappe.throw(_("Voucher {0} tidak berlaku untuk No. HP ini").format(code))

	if owner_customer:
		if not checkout_customer:
			frappe.throw(
				_("Voucher {0} khusus untuk customer tertentu. Pilih customer pemilik voucher.").format(code)
			)
		if checkout_customer != owner_customer:
			frappe.throw(_("Voucher {0} hanya bisa dipakai oleh pemiliknya").format(code))


def validate_voucher(voucher_code, company=None, subtotal=0, customer=None, customer_phone=None):
	code = (voucher_code or "").strip().upper()
	if not code:
		frappe.throw(_("Kode voucher wajib diisi"))

	company = resolve_company(company)
	name = frappe.db.get_value(
		"IMOGI POS Voucher",
		{"voucher_code": code, "company": company, "is_active": 1},
		"name",
	)
	if not name:
		frappe.throw(_("Voucher {0} tidak ditemukan atau tidak aktif").format(code))

	voucher = frappe.get_doc("IMOGI POS Voucher", name)
	today_date = getdate(today())
	if voucher.valid_from and getdate(voucher.valid_from) > today_date:
		frappe.throw(_("Voucher {0} belum berlaku").format(code))
	if voucher.valid_upto and getdate(voucher.valid_upto) < today_date:
		frappe.throw(_("Voucher {0} sudah kedaluwarsa").format(code))

	max_redemptions = cint(voucher.max_redemptions)
	if max_redemptions and cint(voucher.redemption_count) >= max_redemptions:
		frappe.throw(_("Voucher {0} sudah habis digunakan").format(code))

	subtotal = flt(subtotal)
	min_order = flt(voucher.min_order_amount)
	if min_order and subtotal < min_order:
		frappe.throw(
			_("Minimal belanja {0} untuk voucher {1}").format(
				frappe.format_value(min_order, {"fieldtype": "Currency"}),
				code,
			)
		)

	_validate_voucher_owner(voucher, customer=customer, customer_phone=customer_phone)

	discount_amount = 0
	if voucher.discount_type == "Percent":
		discount_amount = subtotal * flt(voucher.discount_value) / 100
	elif voucher.discount_type == "Amount":
		discount_amount = min(flt(voucher.discount_value), subtotal)

	return {
		"name": voucher.name,
		"voucher_code": voucher.voucher_code,
		"discount_type": voucher.discount_type,
		"discount_value": flt(voucher.discount_value),
		"discount_amount": flt(discount_amount),
		"customer": voucher.customer or "",
		"customer_mobile": voucher.customer_mobile or "",
	}


def compute_redeem_discount(points, config=None):
	config = config or get_loyalty_config()
	return flt(cint(points) * flt(config["point_value"]))


def max_redeemable_points(customer, payable_subtotal, config=None, company=None):
	config = config or get_loyalty_config()
	if not customer or not config["enabled"] or payable_subtotal <= 0:
		return 0

	member = get_or_create_member(customer, company)
	points = cint(member.points)
	if points < config["min_redeem_points"]:
		return 0

	max_by_amount = int(payable_subtotal // flt(config["point_value"])) if config["point_value"] > 0 else 0
	return max(0, min(points, max_by_amount))


def compute_checkout_totals(
	items,
	discount_type=None,
	discount_value=None,
	voucher_code=None,
	loyalty_points_redeem=0,
	customer=None,
	customer_phone=None,
	company=None,
	settings=None,
	branch=None,
):
	settings = settings or get_settings()
	company = resolve_company(company, settings)
	config = get_loyalty_config(settings)

	from imogi_pos.imogi_pos.utils.promo_rules import apply_promo_rules, serialize_applied_promos

	promo_result = apply_promo_rules(items, company=company, branch=branch)
	items = promo_result["items"]
	promo_discount = flt(promo_result["promo_discount"])
	applied_promos = list(promo_result["applied_promos"] or [])

	subtotal = 0
	for row in items or []:
		subtotal += flt(row.get("qty")) * flt(row.get("rate"))
	subtotal = flt(subtotal)

	manual_discount = _manual_discount(subtotal, discount_type, discount_value)

	birthday_discount = 0
	from imogi_pos.imogi_pos.utils.feature_gating import is_setting_enabled
	from imogi_pos.imogi_pos.utils.planned_features import apply_birthday_promo, get_birthday_promo_status

	if customer and is_setting_enabled("enable_birthday_promo", settings):
		# Base birthday on cart after rules, before manual/voucher — use subtotal - promo_rules
		birthday_base = max(0, subtotal - promo_discount)
		birthday_discount = apply_birthday_promo(
			customer, birthday_base, settings=settings, company=company
		)
		if birthday_discount > 0:
			status = get_birthday_promo_status(customer, company=company, settings=settings)
			pct = flt(status.get("discount_percent"))
			applied_promos.append(
				{
					"promo": "BIRTHDAY_PROMO",
					"label": _("Promo ulang tahun ({0}%)").format(pct),
					"discount": flt(birthday_discount),
				}
			)
			promo_discount = flt(promo_discount) + flt(birthday_discount)

	after_manual = max(0, subtotal - manual_discount - promo_discount)

	voucher_discount = 0
	voucher_meta = None
	if voucher_code:
		voucher_meta = validate_voucher(
			voucher_code,
			company=company,
			subtotal=after_manual,
			customer=customer,
			customer_phone=customer_phone,
		)
		voucher_discount = flt(voucher_meta["discount_amount"])

	after_voucher = max(0, after_manual - voucher_discount)

	loyalty_points_redeem = cint(loyalty_points_redeem)
	loyalty_discount = 0
	if loyalty_points_redeem and config["enabled"]:
		if not customer:
			frappe.throw(_("Pilih customer untuk menukar poin"))
		if loyalty_points_redeem < config["min_redeem_points"]:
			frappe.throw(
				_("Minimal penukaran {0} poin").format(config["min_redeem_points"])
			)
		max_points = max_redeemable_points(customer, after_voucher, config=config, company=company)
		if loyalty_points_redeem > max_points:
			frappe.throw(_("Poin yang ditukar melebihi saldo atau nilai belanja"))
		loyalty_discount = compute_redeem_discount(loyalty_points_redeem, config)

	net_before_tax = max(0, after_voucher - loyalty_discount)
	from imogi_pos.imogi_pos.utils.sales_tax import compute_sales_tax

	tax_result = compute_sales_tax(net_before_tax, settings=settings)
	grand_total = flt(tax_result["grand_total"])
	total_discount = subtotal - net_before_tax

	return {
		"items": items,
		"subtotal": subtotal,
		"promo_discount": promo_discount,
		"birthday_discount": flt(birthday_discount),
		"applied_promos": applied_promos,
		"applied_promo_json": serialize_applied_promos(applied_promos),
		"manual_discount": flt(manual_discount),
		"voucher_discount": flt(voucher_discount),
		"loyalty_discount": flt(loyalty_discount),
		"discount_amount": flt(total_discount),
		"net_before_tax": flt(net_before_tax),
		"taxable_amount": flt(tax_result["taxable_amount"]),
		"tax_amount": flt(tax_result["tax_amount"]),
		"tax_rate": flt(tax_result["tax_rate"]),
		"prices_include_tax": cint(tax_result["prices_include_tax"]),
		"grand_total": grand_total,
		"voucher_code": voucher_meta["voucher_code"] if voucher_meta else "",
		"loyalty_points_redeemed": loyalty_points_redeem if loyalty_discount else 0,
		"loyalty_points_earned": compute_earn_points(grand_total, config, customer=customer, company=company)
		if config["enabled"]
		else 0,
	}


def compute_earn_points(grand_total, config=None, customer=None, company=None):
	config = config or get_loyalty_config()
	if not config["enabled"] or grand_total <= 0 or config["points_per_amount"] <= 0:
		return 0
	base = int(grand_total // config["points_per_amount"])
	if not customer:
		return base
	member = get_or_create_member(customer, company)
	from imogi_pos.imogi_pos.utils.loyalty_tiers import get_member_multiplier

	return int(base * get_member_multiplier(member))


def apply_promotions_to_order(order, totals):
	order.discount_type = order.discount_type or ""
	order.discount_value = flt(order.discount_value)
	order.promo_discount_amount = flt(totals.get("promo_discount"))
	order.taxable_amount = flt(totals.get("taxable_amount"))
	order.tax_amount = flt(totals.get("tax_amount"))
	order.applied_promo = totals.get("applied_promo_json") or ""
	order.voucher_code = totals.get("voucher_code") or ""
	order.voucher_discount_amount = flt(totals.get("voucher_discount"))
	order.loyalty_points_redeemed = cint(totals.get("loyalty_points_redeemed"))
	order.loyalty_discount_amount = flt(totals.get("loyalty_discount"))
	order.loyalty_points_earned = cint(totals.get("loyalty_points_earned"))


def apply_loyalty_after_payment(order):
	if not is_loyalty_enabled() or not order.customer:
		return

	company = order.company
	member = get_or_create_member(order.customer, company)
	redeemed = cint(order.loyalty_points_redeemed)
	earned = cint(order.loyalty_points_earned)

	if redeemed:
		if cint(member.points) < redeemed:
			frappe.throw(_("Saldo poin customer tidak mencukupi"))
		member.points = cint(member.points) - redeemed
		member.total_redeemed = cint(member.total_redeemed) + redeemed
		_log_transaction(member, order, "Redeem", redeemed, order.loyalty_discount_amount)

	if earned:
		member.points = cint(member.points) + earned
		member.total_earned = cint(member.total_earned) + earned
		_log_transaction(member, order, "Earn", earned, order.grand_total)

	from imogi_pos.imogi_pos.utils.feature_gating import is_setting_enabled
	from imogi_pos.imogi_pos.utils.planned_features import apply_cashback_amount

	if is_setting_enabled("enable_cashback"):
		config = get_loyalty_config()
		cashback_amount = apply_cashback_amount(order.grand_total)
		if cashback_amount > 0 and flt(config["point_value"]) > 0:
			cashback_points = int(flt(cashback_amount) / flt(config["point_value"]))
			if cashback_points > 0:
				member.points = cint(member.points) + cashback_points
				member.total_earned = cint(member.total_earned) + cashback_points
				_log_transaction(member, order, "Cashback", cashback_points, cashback_amount)

	from imogi_pos.imogi_pos.utils.loyalty_tiers import sync_member_tier

	sync_member_tier(member)

	stamp_reward = None
	from imogi_pos.imogi_pos.utils.stamp_card import apply_stamp_after_payment

	stamp_reward = apply_stamp_after_payment(order, member)
	if stamp_reward:
		frappe.flags.imogi_stamp_reward = stamp_reward

	try:
		member.save(ignore_permissions=True)
	except frappe.TimestampMismatchError:
		member.reload()
		member.save(ignore_permissions=True)

	if order.voucher_code:
		voucher_name = frappe.db.get_value(
			"IMOGI POS Voucher",
			{"voucher_code": order.voucher_code, "company": company},
			"name",
		)
		if voucher_name:
			frappe.db.sql(
				"""
				UPDATE `tabIMOGI POS Voucher`
				SET redemption_count = redemption_count + 1, modified = %s
				WHERE name = %s
				""",
				(now_datetime(), voucher_name),
			)


def _log_transaction(member, order, txn_type, points, amount):
	frappe.get_doc(
		{
			"doctype": "IMOGI POS Loyalty Transaction",
			"member": member.name,
			"customer": member.customer,
			"company": member.company,
			"order": order.name,
			"transaction_type": txn_type,
			"points": cint(points),
			"amount": flt(amount),
		}
	).insert(ignore_permissions=True)
