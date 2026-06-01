<template>
  <div>
    <!-- Header -->
    <div class="mb-4 flex items-center gap-2">
      <button
        class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
        @click="router.push('/')"
      >
        &larr;
      </button>
      <h1 class="flex-1 font-display text-xl font-bold tracking-tight">{{ heading }}</h1>
      <button
        class="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-gray-800"
        @click="router.push(`/new/${encodeURIComponent(doctype)}`)"
      >
        + New
      </button>
    </div>

    <!-- Search -->
    <div class="mb-4">
      <input
        v-model="search"
        type="search"
        placeholder="Search contacts…"
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
      />
    </div>

    <!-- Loading -->
    <div v-if="list.loading && !records.length" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div v-for="n in 6" :key="n" class="h-32 animate-pulse rounded-2xl bg-gray-100" />
    </div>

    <!-- Empty -->
    <div
      v-else-if="!records.length"
      class="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500"
    >
      No contacts found.
    </div>

    <!-- Business cards -->
    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div
        v-for="row in records"
        :key="row.name"
        class="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
      >
        <!-- accent bar -->
        <div
          class="absolute inset-x-0 top-0 h-1"
          :style="{ background: accent(row) }"
        />
        <div class="flex items-start gap-3 pt-1">
          <span
            class="grid h-12 w-12 shrink-0 place-items-center rounded-full font-display text-base font-bold text-white"
            :style="{ background: accent(row) }"
          >
            {{ initials(row) }}
          </span>
          <div class="min-w-0 flex-1">
            <button
              class="truncate text-left font-semibold leading-tight hover:underline"
              @click="open(row)"
            >
              {{ fullName(row) }}
            </button>
            <div v-if="row.designation || row.company_name" class="truncate text-xs text-gray-500">
              {{ [row.designation, row.company_name].filter(Boolean).join(' · ') }}
            </div>
          </div>
        </div>

        <!-- contact actions -->
        <div class="mt-3 space-y-1.5 border-t border-gray-100 pt-3 text-sm">
          <a
            v-if="row.email_id"
            :href="`mailto:${row.email_id}`"
            class="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <span class="text-gray-400">✉</span>
            <span class="truncate">{{ row.email_id }}</span>
          </a>
          <a
            v-if="phone(row)"
            :href="`tel:${phone(row)}`"
            class="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <span class="text-gray-400">📞</span>
            <span class="truncate">{{ phone(row) }}</span>
          </a>
          <p v-if="!row.email_id && !phone(row)" class="text-xs text-gray-400">
            No contact details
          </p>
        </div>
      </div>
    </div>

    <button
      v-if="records.length && records.length >= pageLength * page"
      class="mt-4 w-full rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
      :disabled="list.loading"
      @click="loadMore"
    >
      {{ list.loading ? 'Loading…' : 'Load more' }}
    </button>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createResource } from 'frappe-ui'

const props = defineProps({ doctype: { type: String, default: 'Contact' } })
const router = useRouter()

const heading = computed(() => (props.doctype === 'Contact' ? 'Business Cards' : props.doctype))

const pageLength = 30
const page = ref(1)
const search = ref('')

const list = createResource({
  url: 'frappe.client.get_list',
  makeParams() {
    const params = {
      doctype: props.doctype,
      fields: [
        'name',
        'first_name',
        'last_name',
        'email_id',
        'mobile_no',
        'phone',
        'company_name',
        'designation',
      ],
      limit_page_length: pageLength * page.value,
      order_by: 'modified desc',
    }
    const term = search.value.trim()
    if (term) {
      const like = `%${term}%`
      params.or_filters = [
        ['first_name', 'like', like],
        ['last_name', 'like', like],
        ['email_id', 'like', like],
        ['company_name', 'like', like],
      ]
    }
    return params
  },
  auto: true,
})

const records = computed(() => list.data || [])

function fullName(row) {
  return [row.first_name, row.last_name].filter(Boolean).join(' ') || row.name
}
function initials(row) {
  const n = fullName(row)
  return n
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
function phone(row) {
  return row.mobile_no || row.phone || ''
}
function open(row) {
  router.push(`/view/${encodeURIComponent(props.doctype)}/${encodeURIComponent(row.name)}`)
}
function loadMore() {
  page.value += 1
  list.reload()
}

// Deterministic accent colour per contact, so cards feel distinct but stable.
const PALETTE = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6']
function accent(row) {
  const key = row.name || fullName(row)
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

let timer = null
watch(search, () => {
  page.value = 1
  clearTimeout(timer)
  timer = setTimeout(() => list.reload(), 300)
})
</script>
