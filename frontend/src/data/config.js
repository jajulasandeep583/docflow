import { createResource } from 'frappe-ui'

// Navigation is configured server-side in the "DocFlow Settings" DocType
// (Frappe Desk). The app reads it through a whitelisted method so every
// logged-in user gets the same, centrally-managed list.
export const navResource = createResource({
  url: 'docflow.api.get_nav',
  auto: true,
})

// Saving requires the System Manager role (enforced on the server).
export const saveNavResource = createResource({
  url: 'docflow.api.save_nav',
  makeParams(items) {
    return { items: JSON.stringify(items) }
  },
  onSuccess() {
    navResource.reload()
  },
})

export function navItems() {
  return navResource.data || []
}
