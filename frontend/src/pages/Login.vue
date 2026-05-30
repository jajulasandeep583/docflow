<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-sm">
      <div class="mb-8 text-center">
        <span
          class="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gray-900 font-display text-lg font-bold text-white"
        >
          DF
        </span>
        <h1 class="font-display text-2xl font-bold tracking-tight">DocFlow</h1>
        <p class="mt-1 text-sm text-gray-500">Sign in to your Frappe site</p>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              v-model="email"
              type="email"
              autocomplete="username"
              placeholder="you@example.com"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              @keyup.enter="doLogin"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              @keyup.enter="doLogin"
            />
          </div>

          <p v-if="errorMessage" class="text-sm text-red-600">
            {{ errorMessage }}
          </p>

          <button
            class="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
            :disabled="session.login.loading || !email || !password"
            @click="doLogin"
          >
            {{ session.login.loading ? 'Signing in…' : 'Sign in' }}
          </button>
        </div>
      </div>

      <p class="mt-4 text-center text-xs text-gray-400">
        Use the same credentials as your Frappe Desk login.
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { session } from '@/data/session'

const email = ref('')
const password = ref('')

const errorMessage = computed(() => {
  const err = session.login.error
  if (!err) return ''
  // Frappe returns a generic auth failure; surface something readable.
  return 'Invalid email or password. Please try again.'
})

function doLogin() {
  if (!email.value || !password.value) return
  session.login.submit({ email: email.value, password: password.value })
}
</script>
