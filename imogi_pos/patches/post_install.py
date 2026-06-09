import frappe

from imogi_pos.install import after_install


def setup_imogi_pos_defaults():
	after_install()
