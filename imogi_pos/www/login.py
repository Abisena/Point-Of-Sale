from frappe.www.login import get_context as frappe_get_context

from imogi_pos.website import IMOGI_POS_APP_NAME, IMOGI_POS_FAVICON, IMOGI_POS_LOGIN_LOGO

no_cache = True


def get_context(context):
	frappe_get_context(context)
	context.update(
		{
			"app_name": IMOGI_POS_APP_NAME,
			"logo": IMOGI_POS_LOGIN_LOGO,
			"favicon": IMOGI_POS_FAVICON,
			"title": f"Login - {IMOGI_POS_APP_NAME}",
		}
	)
	return context
