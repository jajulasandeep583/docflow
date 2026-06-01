<template>
  <div>
    <div class="mb-2 flex items-center justify-between">
      <label class="flex items-center gap-1 text-sm font-medium text-gray-700">
        {{ field.label || field.fieldname }}
        <span v-if="field.reqd" class="text-red-500">*</span>
      </label>
      <span class="text-xs text-gray-400">{{ rows.length }} row{{ rows.length === 1 ? '' : 's' }}</span>
    </div>

    <div v-if="childMeta.loading" class="h-10 animate-pulse rounded-lg bg-gray-100" />

    <template v-else>
      <!-- Rows -->
      <div
        v-for="(row, idx) in rows"
        :key="idx"
        class="mb-2 rounded-xl border border-gray-200 bg-gray-50 p-3"
      >
        <div class="mb-2 flex items-center justify-between">
          <span class="text-xs font-semibold text-gray-400">#{{ idx + 1 }}</span>
          <button
            type="button"
            class="rounded px-2 py-0.5 text-xs text-gray-400 hover:bg-red-50 hover:text-red-600"
            @click="removeRow(idx)"
          >
            Remove
          </button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <FormField
            v-for="cf in cellFields"
            :key="cf.fieldname"
            :field="cf"
            :model-value="row[cf.fieldname]"
            @update:model-value="updateCell(idx, cf.fieldname, $event)"
          />
        </div>
      </div>

      <button
        type="button"
        class="w-full rounded-lg border border-dashed border-gray-300 py-2 text-sm font-medium text-gray-500 hover:border-gray-900 hover:text-gray-900"
        @click="addRow"
      >
        + Add row
      </button>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { createResource } from 'frappe-ui'
import FormField from '@/components/FormField.vue'

const props = defineProps({
  field: { type: Object, required: true },
  rows: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:rows'])

const childMeta = createResource({
  url: 'frappe.client.get',
  params: { doctype: 'DocType', name: props.field.options },
  auto: true,
})

// Show the columns marked for the list view, plus any mandatory ones.
const cellFields = computed(() => {
  const fields = childMeta.data?.fields || []
  const chosen = fields.filter(
    (f) =>
      (f.in_list_view || f.reqd) &&
      !f.hidden &&
      !f.read_only &&
      !['Section Break', 'Column Break', 'Tab Break', 'HTML', 'Button', 'Table'].includes(
        f.fieldtype
      )
  )
  return chosen.length ? chosen : fields.filter((f) => f.in_list_view)
})

function addRow() {
  const blank = {}
  for (const f of cellFields.value) {
    if (f.default !== undefined && f.default !== null && f.default !== '') {
      blank[f.fieldname] = f.fieldtype === 'Check' ? Number(f.default) : f.default
    }
  }
  emit('update:rows', [...props.rows, blank])
}

function removeRow(idx) {
  const next = props.rows.slice()
  next.splice(idx, 1)
  emit('update:rows', next)
}

function updateCell(idx, fieldname, value) {
  const next = props.rows.map((r, i) => (i === idx ? { ...r, [fieldname]: value } : r))
  emit('update:rows', next)
}
</script>
