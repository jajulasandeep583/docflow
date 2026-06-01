# Copyright (c) 2026, Your Name and contributors
# For license information, please see license.txt

import json

import frappe
from frappe import _
from frappe.sessions import get_csrf_token as _frappe_get_csrf_token
from frappe.utils.password import check_password, update_password as _update_password

# Shown when no navigation items are configured yet in DocFlow Settings.
DEFAULTS = [
    {"doctype_name": "Sales Order", "label": "Sales Orders", "icon": "SO"},
    {"doctype_name": "Customer", "label": "Customers", "icon": "CU"},
    {"doctype_name": "Contact", "label": "Contacts", "icon": "CN"},
    {"doctype_name": "Item", "label": "Items", "icon": "IT"},
]


@frappe.whitelist()
def get_csrf_token():
    """Return (and lazily generate) the CSRF token for the current session."""
    return _frappe_get_csrf_token()


@frappe.whitelist()
def change_password(old_password, new_password):
    """Change the logged-in user's own password after verifying the current one."""
    user = frappe.session.user
    if user == "Guest":
        frappe.throw(_("You must be logged in to change your password."))

    if not new_password or len(new_password) < 6:
        frappe.throw(_("New password must be at least 6 characters."))

    try:
        check_password(user, old_password)
    except frappe.AuthenticationError:
        frappe.throw(_("Your current password is incorrect."))

    # Enforces the site's password policy (raises if too weak).
    from frappe.core.doctype.user.user import test_password_strength

    user_doc = frappe.get_doc("User", user)
    result = test_password_strength(
        new_password,
        user_data=[user_doc.first_name, user_doc.last_name, user_doc.email],
    )
    feedback = (result or {}).get("feedback") or {}
    if feedback.get("password_policy_validation_passed") is False:
        suggestions = " ".join(feedback.get("suggestions") or [])
        frappe.throw(_("Password is too weak. {0}").format(suggestions or ""))

    _update_password(user, new_password)
    frappe.db.commit()
    return {"ok": True}


@frappe.whitelist()
def get_nav():
    """Return the enabled navigation items, in order."""
    rows = frappe.get_all(
        "DocFlow Entry",
        filters={"parenttype": "DocFlow Settings", "enabled": 1},
        fields=["doctype_name", "label", "icon", "idx"],
        order_by="idx asc",
    )

    items = [
        {
            "doctype_name": r.doctype_name,
            "label": r.label or r.doctype_name,
            "icon": r.icon or "",
        }
        for r in rows
        if r.doctype_name
    ]

    return items or DEFAULTS


@frappe.whitelist()
def save_nav(items):
    """Replace the navigation items."""
    if isinstance(items, str):
        items = json.loads(items)

    settings = frappe.get_single("DocFlow Settings")
    settings.set("items", [])
    for it in items:
        name = (it.get("doctype_name") or "").strip()
        if not name:
            continue
        settings.append(
            "items",
            {
                "doctype_name": name,
                "label": (it.get("label") or "").strip(),
                "icon": (it.get("icon") or "").strip(),
                "enabled": 1,
            },
        )
    settings.save()
    frappe.db.commit()
    return get_nav()
