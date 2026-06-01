<template>
  <div>
    <!-- Header -->
    <div class="mb-5 flex items-center gap-2">
      <button
        class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
        @click="router.back()"
      >
        &larr;
      </button>
      <div class="min-w-0">
        <div class="text-xs uppercase tracking-wide text-gray-400">{{ doctype }}</div>
        <h1 class="truncate font-display text-xl font-bold tracking-tight">
          {{ isEdit ? `Edit ${name}` : `New ${doctype}` }}
        </h1>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="n in 6" :key="n" class="h-12 animate-pulse rounded-lg bg-gray-100" />
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="save">
      <div class="space-y-5">
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
          <div class="space-y-4 p-4">
            <template v-for="f in group.fields" :key="f.fieldname">
              <!-- Child table -->
              <ChildTable
                v-if="f.fieldtype === 'Table'"
                :field="f"
                :rows="model[f.fieldname] || []"
                @update:rows="model[f.fieldname] = $event"
              />
              <!-- Scalar field -->
              <FormField
                v-else
                :field="f"
                :model-value="model[f.fieldname]"
                @update:model-value="model[f.fieldname] = $event"
              />
            </template>
          </div>
        </section>
      </div>

      <!-- Error -->
      <p v-if="errorMessage" class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ errorMessage }}
      </p>

      <!-- Actions -->
      <div class="sticky bottom-0 mt-6 flex gap-3 border-t border-gray-100 bg-gray-50/80 py-4 backdrop-blur">
        <button
          type="submit"
          class="flex-1 rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
          :disabled="saving"
        >
          {{ saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create' }}
        </button>
        <button
          type="button"
          class="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          @click="router.back()"
        >
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createResource } from 'frappe-ui'
import FormField from '@/components/FormField.vue'
import ChildTable from '@/components/ChildTable.vue'

const props = defineProps({
  doctype: { type: String, required: true },
  name: { type: String, default: '' },
})
const router = useRouter()
const isEdit = computed(() => !!props.name)

const model = reactive({})
const saving = ref(false)
const errorMessage = ref('')

// Fieldtypes that are purely layout or that we don't render in the form.
const SKIP = new Set([
  'Column Break',
  'Tab Break',
  'HTML',
  'Button',
  'Fold',
  'Heading',
  'Image',
  'Geolocation',
  'Signature',
  'Table MultiSelect',
  'Attach',
  'Attach Image',
  'Read Only',
])

function isEditable(f) {
  if (f.fieldtype === 'Section Break') return false
  if (SKIP.has(f.fieldtype)) return false
  if (f.hidden || f.read_only || f.is_virtual) return false
  return true
}

// ----- Meta -----
const meta = createResource({
  url: 'frappe.client.get',
  params: { doctype: 'DocType', name: props.doctype },
  auto: true,
  onSuccess() {
    if (!isEdit.value) seedDefaults()
  },
})

function seedDefaults() {
  for (const f of meta.data?.fields || []) {
    if (!isEditable(f) && f.fieldtype !== 'Table') continue
    if (f.fieldtype === 'Table') {
      model[f.fieldname] = []
    } else if (f.default !== undefined && f.default !== null && f.default !== '') {
      model[f.fieldname] = f.fieldtype === 'Check' ? Number(f.default) : f.default
    }
  }
}

// ----- Existing doc (edit) -----
const existing = ref(null)
const doc = createResource({
  url: 'frappe.client.get',
  params: isEdit.value ? { doctype: props.doctype, name: props.name } : null,
  auto: isEdit.value,
  onSuccess(d) {
    existing.value = d
    for (const [k, v] of Object.entries(d)) model[k] = v
  },
})

const loading = computed(
  () => meta.loading || !meta.data || (isEdit.value && (doc.loading || !doc.data))
)

// ----- Grouped fields, like the read view -----
const groups = computed(() => {
  if (!meta.data) return []
  const result = []
  let current = { label: '', fields: [] }
  for (const f of meta.data.fields || []) {
    if (f.fieldtype === 'Section Break') {
      if (current.fields.length) result.push(current)
      current = { label: f.label || '', fields: [] }
      continue
    }
    if (f.fieldtype === 'Table') {
      current.fields.push(f)
      continue
    }
    if (!isEditable(f)) continue
    current.fields.push(f)
  }
  if (current.fields.length) result.push(current)
  return result
})

// ----- Save -----
const insertRes = createResource({ url: 'frappe.client.insert' })
const saveRes = createResource({ url: 'frappe.client.save' })

function validate() {
  for (const f of meta.data?.fields || []) {
    if (!f.reqd || f.hidden || f.read_only) continue
    if (f.fieldtype === 'Table') {
      if (!(model[f.fieldname] || []).length) {
        return `${f.label || f.fieldname} needs at least one row.`
      }
      continue
    }
    if (!isEditable(f)) continue
    const v = model[f.fieldname]
    if (v === undefined || v === null || v === '') {
      return `${f.label || f.fieldname} is required.`
    }
  }
  return ''
}

async function save() {
  errorMessage.value = ''
  const v = validate()
  if (v) {
    errorMessage.value = v
    return
  }
  saving.value = true
  try {
    let saved
    if (isEdit.value) {
      const payload = { ...existing.value, ...model, doctype: props.doctype, name: props.name }
      saved = await saveRes.submit({ doc: payload })
    } else {
      saved = await insertRes.submit({ doc: { doctype: props.doctype, ...model } })
    }
    const newName = saved?.name || props.name
    router.replace(
      `/view/${encodeURIComponent(props.doctype)}/${encodeURIComponent(newName)}`
    )
  } catch (e) {
    errorMessage.value = friendlyError(e)
  } finally {
    saving.value = false
  }
}

function friendlyError(e) {
  const raw =
    e?.messages?.[0] ||
    e?.message ||
    (e?._server_messages && JSON.parse(e._server_messages)[0]) ||
    'Could not save. Please check the fields and try again.'
  try {
    const parsed = typeof raw === 'string' && raw.startsWith('{') ? JSON.parse(raw) : raw
    return String(parsed?.message || parsed).replace(/<[^>]*>/g, ' ').trim()
  } catch {
    return String(raw).replace(/<[^>]*>/g, ' ').trim()
  }
}
</script>
