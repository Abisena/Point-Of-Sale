__version__ = "0.0.1"

from imogi_pos.auth import patch_default_path, patch_login_home_page
from imogi_pos.overrides.pos_consolidation_patch import apply_pos_consolidation_patches
from imogi_pos.website import patch_app_favicon

patch_login_home_page()
patch_default_path()
patch_app_favicon()
apply_pos_consolidation_patches()
