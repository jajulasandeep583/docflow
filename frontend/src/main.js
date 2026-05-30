import './index.css'

import { createApp } from 'vue'
import { setConfig, frappeRequest } from 'frappe-ui'

import App from './App.vue'
import router from './router'

const app = createApp(App)

// Route all frappe-ui resource calls through Frappe's request helper.
// This handles cookies, the CSRF token, and the /api/method/* plumbing,
// and lets us drop the "/api/method/" prefix on resource URLs.
setConfig('resourceFetcher', frappeRequest)

app.use(router)
app.mount('#app')
