# Copyright (c) 2026, Your Name and contributors
# For license information, please see license.txt

import json

import frappe

# Shown when no navigation items are configured yet in DocFlow Settings.
DEFAULTS = [
    {"doctype_name": "Sales Invoice", "label": "Sales Invoice", "icon": "SI"},
    {"doctype_name": "Customer", "label": "Customer", "icon": "CU"},
    {"doctype_name": "Item", "label": "Item", "icon": "IT"},
]


@frappe.whitelist()
def get_nav():
    """Return the enabled navigation items, in order.

    Readable by any logged-in user (the config itself is non-sensitive — it is
    just a list of DocType names). Falls back to sensible defaults when nothing
    has been configured in DocFlow Settings yet.
    """
    rows = frappe.get_all(
        "DocFlow Entry",
        filters={"parenttype": "DocFlow Settings", "enabled": 1},
        fields=["doctype_name", "label", "icon", "idx"],
        order_by="idx asc",
        ignore_permissions=True,
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
    """Replace the navigation items. System Manager only."""
    if "System Manager" not in frappe.get_roles():
        frappe.throw(
            "You need the System Manager role to change DocFlow navigation.",
            frappe.PermissionError,
        )

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
