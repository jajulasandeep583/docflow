import { createResource } from 'frappe-ui'
import { computed, reactive } from 'vue'

// Frappe sets a `user_id` cookie once logged in ("Guest" when not).
export function sessionUser() {
  const cookies = new URLSearchParams(document.cookie.replace(/;\s*/g, '&'))
  let user = cookies.get('user_id')
  if (!user || user === 'Guest') return null
  return decodeURIComponent(user)
}

// App base path (must match createWebHistory in router.js / hooks.py route).
const APP_BASE = '/docflow'

export const session = reactive({
  user: sessionUser(),
  redirectRoute: null,

  isLoggedIn: computed(() => !!session.user),

  login: createResource({
    url: 'login',
    makeParams({ email, password }) {
      return { usr: email, pwd: password }
    },
    onSuccess() {
      // Hard reload to the target route. After login Frappe issues a fresh
      // CSRF token + boot data; reloading re-renders them into the page so
      // later POSTs (e.g. saving settings) are authorized.
      const target = session.redirectRoute || '/'
      session.redirectRoute = null
      window.location.href = APP_BASE + target
    },
  }),

  logout: createResource({
    url: 'logout',
    onSuccess() {
      session.user = null
      window.location.href = APP_BASE + '/login'
    },
  }),
})
