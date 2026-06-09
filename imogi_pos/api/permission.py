import frappe


def has_app_permission():
	if frappe.session.user == "Administrator":
		return True

	user_type = frappe.get_cached_value("User", frappe.session.user, "user_type")
	if user_type == "Website User":
		return False

	allowed_roles = {"Sales User", "Sales Manager", "Accounts User", "Accounts Manager", "Stock User"}
	if set(frappe.get_roles()) & allowed_roles:
		return True

	return frappe.has_permission("POS Invoice", ptype="read")
