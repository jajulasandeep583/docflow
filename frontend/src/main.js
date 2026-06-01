import './index.css'

import { createApp } from 'vue'
import { setConfig, frappeRequest } from 'frappe-ui'

import App from './App.vue'
import router from './router'
import { sessionUser } from './data/session'

const app = createApp(App)

setConfig('resourceFetcher', frappeRequest)

// Fetch and cache the CSRF token before the app fires any POST requests.
// Frappe generates the token lazily; this ensures window.csrf_token is set
// to the real value so save operations aren't rejected with CSRFTokenError.
if (sessionUser()) {
  frappeRequest({ url: 'docflow.api.get_csrf_token', method: 'GET' })
    .then((token) => {
      if (token) window.csrf_token = token
    })
    .catch(() => {})
}

app.use(router)
app.mount('#app')
