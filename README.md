# DocFlow

A mobile-friendly **PWA frontend for Frappe**, built with **Vue 3 + frappe-ui +
Vite**. It reads your DocTypes (Sales Invoice, Customer, Item, or anything you
add) and renders a clean, app-like browser for their records — installable to a
phone home screen.

- 🔐 Logs in against your Frappe site (same credentials as Desk)
- 📄 **Meta-driven UI** — point it at any DocType and it auto-builds the list &
  detail views from that DocType's own fields. Add a new DocType in Frappe and
  it just works, no frontend changes needed.
- ⚙️ **Configured from the ERP side** — a `DocFlow Settings` DocType in Frappe
  Desk controls which DocTypes appear and in what order. You can also edit it
  in-app (with drag-to-reorder) if you're a System Manager.
- 📱 Installable PWA (manifest + service worker)
- 🎯 Built and tested against **Frappe v16, Node 18+, Vue 3**

> ✅ The frontend has been compiled with `vite build` to verify it builds
> cleanly. You still run the build yourself on your machine/server (below) —
> compiled output is intentionally not committed to git.

---

## 1. Prerequisites

- A working **Frappe v16 bench** with at least one site (e.g. `mysite.test`)
- **Node 18+** and **Yarn** (`npm i -g yarn`) — npm also works

---

## 2. Push this to GitHub

Create a repo named **`docflow`** (keeping the name simple avoids rename work)
and push:

```bash
cd docflow
git init
git add .
git commit -m "Initial DocFlow app"
git branch -M main
git remote add origin https://github.com/<your-username>/docflow.git
git push -u origin main
```

---

## 3. Install on your site

From your **bench** directory:

```bash
bench get-app https://github.com/<your-username>/docflow.git
bench --site mysite.test install-app docflow
bench --site mysite.test migrate          # creates the DocFlow Settings DocType
```

---

## 4. Build the frontend

```bash
cd apps/docflow/frontend
yarn install        # or: npm install
yarn build          # or: npm run build
```

This compiles the Vue app into `docflow/public/frontend/` and writes
`docflow/www/docflow.html` (the page served at `/docflow`). The official
`frappe-ui` Vite plugin injects the CSRF token + boot data into that HTML
automatically.

Then, from the bench root, refresh assets + cache:

```bash
cd ../../..
bench build
bench --site mysite.test clear-cache
```

Open **`https://mysite.test/docflow`** and log in. 🎉

---

## 5. Configure which DocTypes appear

**From Frappe Desk (the ERP side):** go to **DocFlow Settings**, add rows to the
*Navigation Items* table — pick a DocType, an optional label and icon, tick
*Enabled*, and drag rows to set the order. Save. Every logged-in user sees this.

**From the app:** open **Settings** inside DocFlow. System Managers can add,
remove, reorder (drag-and-drop) and save — it writes back to the same
DocFlow Settings DocType.

If nothing is configured yet, the app falls back to sensible defaults
(Sales Invoice, Customer, Item).

---

## 6. Local development (hot reload)

**a)** Add this to `sites/mysite.test/site_config.json` so the Vite dev server
doesn't hit CSRF errors (the dev server isn't Jinja-rendered, so the token
isn't injected in dev):

```json
{ "ignore_csrf": 1 }
```

> ⚠️ Development only — don't set this in production.

**b)** Run both servers:

```bash
# Terminal 1
bench start

# Terminal 2
cd apps/docflow/frontend
yarn dev
```

The dev server runs on port 8080 and proxies API calls to your bench
automatically. Open the app at **`http://mysite.test:8080/docflow`**.

---

## 7. Making the PWA fully offline-capable (optional)

Out of the box the app is **installable** (Add to Home Screen) and caches its
assets. The service worker is served from `/assets/docflow/frontend/`, so its
scope is limited to that path — enough for installation + asset caching. For
full offline navigation of `/docflow`, widen the scope in your site's Nginx
config and reload Nginx:

```nginx
location /assets/docflow/frontend/sw.js {
    add_header Service-Worker-Allowed "/";
}
```

This is a refinement — skip it and everything still works online.

---

## 8. How it's wired (for the curious)

- `docflow/hooks.py` — `website_route_rules` maps `/docflow/<path>` to the SPA
  so deep links survive a refresh.
- `docflow/api.py` — `get_nav()` (any logged-in user) and `save_nav()`
  (System Manager) read/write the navigation config.
- `docflow/docflow/doctype/docflow_settings` + `docflow_entry` — the config
  DocType you manage in Desk.
- `frontend/` — the Vue 3 app. `vite.config.js` uses `frappe-ui/vite` for the
  dev proxy, Lucide icons, CSRF/boot injection, and the production build output.

---

## What's included vs. next steps

**Included:** login/logout, home dashboard with record counts, meta-driven list
view (search + paging), meta-driven read view (grouped by section), server-side
configurable DocType list with drag-and-drop, PWA manifest + service worker.

**Natural next steps:** creating/editing records (frappe-ui form helpers +
`frappe.client.insert` / `.set_value`), child-table rendering, per-DocType
filters, and push notifications.

---

## Renaming the app

If you want a name other than `docflow`, change it in: `pyproject.toml`,
`docflow/hooks.py` (`app_name` + route), `docflow/modules.txt`, the
`docflow/docflow/` module folder, `frontend/vite.config.js` (`BASE`,
`frontendRoute`, build paths, PWA `start_url`/`scope`), and
`frontend/src/router.js` + `frontend/src/data/session.js` (the `/docflow` base).

---

MIT licensed. Built on [Frappe](https://frappeframework.com) and
[frappe-ui](https://github.com/frappe/frappe-ui).
