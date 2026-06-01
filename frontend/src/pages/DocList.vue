<template>
  <div>
    <div class="mb-4 flex items-center gap-2">
      <button
        class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
        @click="router.back()"
      >
        &larr;
      </button>
      <h1 class="flex-1 font-display text-xl font-bold tracking-tight">{{ doctype }}</h1>
      <button
        class="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-gray-800"
        @click="router.push(`/new/${encodeURIComponent(doctype)}`)"
      >
        + New
      </button>
    </div>

    <div class="mb-4">
      <input
        v-model="search"
        type="search"
        :placeholder="`Search ${doctype}…`"
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
      />
    </div>

    <!-- Loading -->
    <div v-if="list.loading && !records.length" class="space-y-2">
      <div
        v-for="n in 5"
        :key="n"
        class="h-16 animate-pulse rounded-xl bg-gray-100"
      />
    </div>

    <!-- Error -->
    <div
      v-else-if="list.error"
      class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
    >
      Couldn't load records. Check that "{{ doctype }}" exists and that you have
      read access.
    </div>

    <!-- Empty -->
    <div
      v-else-if="!records.length"
      class="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500"
    >
      No records found.
    </div>

    <!-- List -->
    <ul v-else class="space-y-2">
      <li
        v-for="row in records"
        :key="row.name"
        class="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition hover:border-gray-900 hover:shadow-sm"
        @click="open(row)"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="truncate font-semibold">{{ primary(row) }}</span>
              <FieldValue
                v-if="statusField && row[statusField.fieldname]"
                :fieldtype="statusField.fieldtype"
                :fieldname="statusField.fieldname"
                :value="row[statusField.fieldname]"
              />
            </div>
            <div class="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
              <span v-for="f in secondaryFields" :key="f.fieldname">
                <span class="text-gray-400">{{ f.label }}:</span>
                <FieldValue
                  class="text-gray-600"
                  :fieldtype="f.fieldtype"
                  :fieldname="f.fieldname"
                  :value="row[f.fieldname]"
                />
              </span>
            </div>
          </div>
          <span class="shrink-0 text-gray-300">&rarr;</span>
        </div>
      </li>
    </ul>

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
import FieldValue from '@/components/FieldValue.vue'

const props = defineProps({ doctype: { type: String, required: true } })
const router = useRouter()

const pageLength = 20
const page = ref(1)
const search = ref('')

// ----- DocType meta: figure out which fields to show -----
const titleField = ref('name')
const listViewFields = ref([])
const statusField = ref(null)

const meta = createResource({
  url: 'frappe.client.get',
  params: { doctype: 'DocType', name: props.doctype },
  auto: true,
  onSuccess(doc) {
    titleField.value = doc.title_field || 'name'

    const usable = (doc.fields || []).filter(
      (f) =>
        !['Section Break', 'Column Break', 'Tab Break', 'HTML', 'Table'].includes(
          f.fieldtype
        )
    )

    // A "status"/"state" field gets pulled out and shown as a badge.
    statusField.value =
      usable.find((f) => /status|state/i.test(f.fieldname)) || null

    listViewFields.value = usable
      .filter((f) => f.in_list_view)
      .slice(0, 3)
      .map((f) => ({ fieldname: f.fieldname, label: f.label, fieldtype: f.fieldtype }))

    list.reload()
  },
  onError() {
    // DocType might not exist or be inaccessible — still try the list so the
    // user gets a clear error message instead of a silent empty state.
    list.reload()
  },
})

const secondaryFields = computed(() =>
  listViewFields.value.filter(
    (f) =>
      f.fieldname !== titleField.value &&
      (!statusField.value || f.fieldname !== statusField.value.fieldname)
  )
)

const fetchFields = computed(() => {
  const fields = new Set(['name'])
  if (titleField.value && titleField.value !== 'name') fields.add(titleField.value)
  if (statusField.value) fields.add(statusField.value.fieldname)
  listViewFields.value.forEach((f) => fields.add(f.fieldname))
  return [...fields]
})

// ----- Records -----
const list = createResource({
  url: 'frappe.client.get_list',
  makeParams() {
    const params = {
      doctype: props.doctype,
      fields: fetchFields.value,
      limit_page_length: pageLength * page.value,
      order_by: 'modified desc',
    }
    const term = search.value.trim()
    if (term) {
      const like = `%${term}%`
      params.or_filters = [['name', 'like', like]]
      if (titleField.value && titleField.value !== 'name') {
        params.or_filters.push([titleField.value, 'like', like])
      }
    }
    return params
  },
})

const records = computed(() => list.data || [])

function primary(row) {
  if (titleField.value && row[titleField.value]) return row[titleField.value]
  return row.name
}

function open(row) {
  router.push(
    `/view/${encodeURIComponent(props.doctype)}/${encodeURIComponent(row.name)}`
  )
}

function loadMore() {
  page.value += 1
  list.reload()
}

// Debounced search
let timer = null
watch(search, () => {
  page.value = 1
  clearTimeout(timer)
  timer = setTimeout(() => list.reload(), 300)
})
</script>
