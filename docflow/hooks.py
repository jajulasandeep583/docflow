app_name = "docflow"
app_title = "DocFlow"
app_publisher = "Your Name"
app_description = "A mobile-friendly PWA frontend for Frappe DocTypes"
app_email = "you@example.com"
app_license = "MIT"

# ------------------------------------------------------------------
# Serve the Vue single-page app
# ------------------------------------------------------------------
# The frontend builds its index.html into docflow/www/docflow.html, which
# Frappe serves at the route /docflow. The rule below makes sure that
# deep links like /docflow/list/Sales%20Invoice also load the SPA so the
# Vue router can take over (otherwise a hard refresh would 404).
website_route_rules = [
    {"from_route": "/docflow/<path:app_path>", "to_route": "docflow"},
]
