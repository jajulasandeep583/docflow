<template>
  <div>
    <div class="mb-6">
      <h1 class="font-display text-2xl font-bold tracking-tight">
        {{ greeting }}
      </h1>
      <p class="mt-1 text-sm text-gray-500">Pick a DocType to browse its records.</p>
    </div>

    <!-- Loading nav -->
    <div v-if="navResource.loading" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div v-for="n in 4" :key="n" class="h-20 animate-pulse rounded-2xl bg-gray-100" />
    </div>

    <!-- Error -->
    <div
      v-else-if="navResource.error"
      class="rounded-xl border border-dashed border-red-300 p-8 text-center"
    >
      <p class="text-sm font-semibold text-red-600">Failed to load navigation</p>
      <p class="mt-1 text-xs text-gray-500">{{ navResource.error.message }}</p>
      <button
        class="mt-3 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
        @click="navResource.reload()"
      >
        Retry
      </button>
    </div>

    <!-- Empty -->
    <div
      v-else-if="items.length === 0"
      class="rounded-xl border border-dashed border-gray-300 p-8 text-center"
    >
      <p class="text-sm text-gray-500">No DocTypes configured yet.</p>
      <button
        class="mt-3 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
        @click="router.push('/settings')"
      >
        Configure
      </button>
    </div>

    <!-- Cards -->
    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <button
        v-for="item in items"
        :key="item.doctype_name"
        class="group flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-gray-900 hover:shadow-sm"
        @click="open(item)"
      >
        <div class="flex items-center gap-3">
          <span
            class="grid h-10 w-10 place-items-center rounded-xl bg-gray-100 font-display text-base font-bold text-gray-700 group-hover:bg-gray-900 group-hover:text-white"
          >
            {{ icon(item) }}
          </span>
          <div>
            <div class="font-semibold leading-tight">{{ item.label }}</div>
            <div class="text-xs text-gray-400">{{ countLabel(item.doctype_name) }}</div>
          </div>
        </div>
        <span class="text-gray-300 group-hover:text-gray-900">&rarr;</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createResource } from 'frappe-ui'
import { navResource } from '@/data/config'
import { session } from '@/data/session'

const router = useRouter()
const items = computed(() => navResource.data || [])

const greeting = computed(() => {
  const h = new Date().getHours()
  const part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  const name = (session.user || '').split('@')[0]
  return name ? `${part}, ${name}` : part
})

function icon(item) {
  if (item.icon) return item.icon
  return item.label
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function open(item) {
  router.push(`/list/${encodeURIComponent(item.doctype_name)}`)
}

// Per-DocType record counts for the subtitle.
const counts = reactive({})

function loadCount(dt) {
  if (counts[dt] !== undefined) return
  counts[dt] = null
  createResource({
    url: 'frappe.client.get_count',
    params: { doctype: dt },
    auto: true,
    onSuccess(value) {
      counts[dt] = value
    },
    onError() {
      counts[dt] = 'error'
    },
  })
}

function countLabel(dt) {
  const c = counts[dt]
  if (c === undefined || c === null) return 'Loading…'
  if (c === 'error') return 'No access'
  return `${c} record${c === 1 ? '' : 's'}`
}

watch(
  items,
  (list) => list.forEach((i) => loadCount(i.doctype_name)),
  { immediate: true }
)
</script>
