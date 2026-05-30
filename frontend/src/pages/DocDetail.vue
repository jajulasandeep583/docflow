<template>
  <div>
    <div class="mb-4 flex items-center gap-2">
      <button
        class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
        @click="router.back()"
      >
        &larr;
      </button>
      <div class="min-w-0">
        <div class="text-xs uppercase tracking-wide text-gray-400">{{ doctype }}</div>
        <h1 class="truncate font-display text-xl font-bold tracking-tight">
          {{ title }}
        </h1>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="n in 6" :key="n" class="h-12 animate-pulse rounded-lg bg-gray-100" />
    </div>

    <!-- Error -->
    <div
      v-else-if="doc.error"
      class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
    >
      Couldn't load this record.
    </div>

    <!-- Fields -->
    <div v-else class="space-y-5">
      <section
        v-for="(group, gi) in groups"
        :key="gi"
        class="overflow-hidden rounded-2xl border border-gray-200 bg-white"
      >
        <h2
          v-if="group.label"
          class="border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500"
        >
          {{ group.label }}
        </h2>
        <dl class="divide-y divide-gray-100">
          <div
            v-for="f in group.fields"
            :key="f.fieldname"
            class="flex items-start justify-between gap-4 px-4 py-3"
          >
            <dt class="shrink-0 text-sm text-gray-500">{{ f.label }}</dt>
            <dd class="text-right text-sm font-medium text-gray-900">
              <FieldValue :fieldtype="f.fieldtype" :fieldname="f.fieldname" :value="doc.data[f.fieldname]" />
            </dd>
          </div>
        </dl>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { createResource } from 'frappe-ui'
import FieldValue from '@/components/FieldValue.vue'

const props = defineProps({
  doctype: { type: String, required: true },
  name: { type: String, required: true },
})
const router = useRouter()

const meta = createResource({
  url: 'frappe.client.get',
  params: { doctype: 'DocType', name: props.doctype },
  auto: true,
})

const doc = createResource({
  url: 'frappe.client.get',
  params: { doctype: props.doctype, name: props.name },
  auto: true,
})

const loading = computed(() => meta.loading || doc.loading || !doc.data)

const title = computed(() => {
  if (!doc.data) return props.name
  const tf = meta.data?.title_field
  return (tf && doc.data[tf]) || props.name
})

// Build display groups from the DocType layout, using Section Breaks as headers
// and skipping layout-only / empty fields for a clean read view.
const SKIP = new Set([
  'Column Break',
  'Tab Break',
  'HTML',
  'Button',
  'Fold',
  'Heading',
  'Table',
  'Table MultiSelect',
])

const groups = computed(() => {
  if (!meta.data || !doc.data) return []
  const result = []
  let current = { label: '', fields: [] }

  for (const f of meta.data.fields || []) {
    if (f.fieldtype === 'Section Break') {
      if (current.fields.length) result.push(current)
      current = { label: f.label || '', fields: [] }
      continue
    }
    if (SKIP.has(f.fieldtype)) continue
    if (f.hidden) continue

    const value = doc.data[f.fieldname]
    if (value === null || value === undefined || value === '') continue

    current.fields.push({
      fieldname: f.fieldname,
      label: f.label || f.fieldname,
      fieldtype: f.fieldtype,
    })
  }
  if (current.fields.length) result.push(current)
  return result
})
</script>
