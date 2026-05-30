<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <!-- Top bar -->
    <header
      class="safe-top sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur"
    >
      <div class="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <button
          class="flex items-center gap-2"
          @click="router.push('/')"
        >
          <span
            class="grid h-8 w-8 place-items-center rounded-lg bg-gray-900 font-display text-sm font-bold text-white"
          >
            DF
          </span>
          <span class="font-display text-lg font-bold tracking-tight">DocFlow</span>
        </button>

        <div class="flex items-center gap-1">
          <button
            class="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            @click="router.push('/settings')"
          >
            Settings
          </button>
          <button
            class="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            :disabled="session.logout.loading"
            @click="session.logout.submit()"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>

    <!-- Page content -->
    <main class="mx-auto max-w-3xl px-4 pb-28 pt-5">
      <slot />
    </main>

    <!-- Mobile bottom nav -->
    <nav
      class="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white sm:hidden"
    >
      <div class="mx-auto flex max-w-3xl">
        <button
          v-for="item in nav"
          :key="item.name"
          class="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs"
          :class="isActive(item) ? 'text-gray-900' : 'text-gray-400'"
          @click="router.push(item.to)"
        >
          <span class="text-lg leading-none">{{ item.icon }}</span>
          {{ item.label }}
        </button>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { session } from '@/data/session'

const router = useRouter()
const route = useRoute()

const nav = [
  { name: 'Home', label: 'Home', icon: '\u25C6', to: '/' },
  { name: 'Settings', label: 'Settings', icon: '\u2699', to: '/settings' },
]

function isActive(item) {
  if (item.name === 'Home') {
    return ['Home', 'DocList', 'DocDetail'].includes(route.name)
  }
  return route.name === item.name
}
</script>
