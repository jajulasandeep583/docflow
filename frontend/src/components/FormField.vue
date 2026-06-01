<template>
  <div>
    <label v-if="showLabel" class="mb-1 flex items-center gap-1 text-sm font-medium text-gray-700">
      {{ field.label || field.fieldname }}
      <span v-if="field.reqd" class="text-red-500">*</span>
    </label>

    <!-- Check -> toggle -->
    <button
      v-if="field.fieldtype === 'Check'"
      type="button"
      class="relative inline-flex h-6 w-11 items-center rounded-full transition"
      :class="boolValue ? 'bg-gray-900' : 'bg-gray-300'"
      @click="emitVal(boolValue ? 0 : 1)"
    >
      <span
        class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition"
        :class="boolValue ? 'translate-x-5' : 'translate-x-1'"
      />
    </button>

    <!-- Select -->
    <select
      v-else-if="field.fieldtype === 'Select'"
      :value="modelValue ?? ''"
      class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
      @change="emitVal($event.target.value)"
    >
      <option v-for="opt in selectOptions" :key="opt" :value="opt">
        {{ opt === '' ? '— Select —' : opt }}
      </option>
    </select>

    <!-- Link -> autocomplete -->
    <div v-else-if="field.fieldtype === 'Link'" class="relative">
      <input
        type="text"
        :value="modelValue ?? ''"
        :placeholder="`Search ${field.options}…`"
        autocomplete="off"
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
        @input="onLinkInput($event.target.value)"
        @focus="onLinkFocus"
        @blur="onLinkBlur"
      />
      <ul
        v-if="linkOpen && linkResults.length"
        class="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
      >
        <li
          v-for="r in linkResults"
          :key="r.value"
          class="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100"
          @mousedown.prevent="pickLink(r.value)"
        >
          <div class="font-medium text-gray-900">{{ r.value }}</div>
          <div v-if="r.description" class="truncate text-xs text-gray-400">{{ r.description }}</div>
        </li>
      </ul>
    </div>

    <!-- Long text / text editor -->
    <textarea
      v-else-if="isTextArea"
      :value="modelValue ?? ''"
      rows="3"
      class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
      @input="emitVal($event.target.value)"
    />

    <!-- Date -->
    <input
      v-else-if="field.fieldtype === 'Date'"
      type="date"
      :value="modelValue ?? ''"
      class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
      @input="emitVal($event.target.value)"
    />

    <!-- Datetime -->
    <input
      v-else-if="field.fieldtype === 'Datetime'"
      type="datetime-local"
      :value="toLocalDatetime(modelValue)"
      class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
      @input="emitVal($event.target.value.replace('T', ' ') + ':00')"
    />

    <!-- Time -->
    <input
      v-else-if="field.fieldtype === 'Time'"
      type="time"
      :value="modelValue ?? ''"
      class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
      @input="emitVal($event.target.value)"
    />

    <!-- Numbers -->
    <input
      v-else-if="isNumber"
      type="number"
      :step="numberStep"
      :value="modelValue ?? ''"
      class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
      @input="emitVal($event.target.value === '' ? null : Number($event.target.value))"
    />

    <!-- Default: text -->
    <input
      v-else
      type="text"
      :value="modelValue ?? ''"
      class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
      @input="emitVal($event.target.value)"
    />

    <p v-if="field.description" class="mt-1 text-xs text-gray-400">{{ field.description }}</p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { createResource } from 'frappe-ui'

const props = defineProps({
  field: { type: Object, required: true },
  modelValue: { default: null },
  showLabel: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue'])

function emitVal(v) {
  emit('update:modelValue', v)
}

const boolValue = computed(() => !!props.modelValue && props.modelValue !== '0')

const isNumber = computed(() =>
  ['Int', 'Float', 'Currency', 'Percent'].includes(props.field.fieldtype)
)
const numberStep = computed(() => (props.field.fieldtype === 'Int' ? '1' : '0.01'))

const isTextArea = computed(() =>
  ['Small Text', 'Text', 'Long Text', 'Code', 'Text Editor', 'HTML Editor'].includes(
    props.field.fieldtype
  )
)

const selectOptions = computed(() => {
  const raw = String(props.field.options || '').split('\n')
  // Ensure a blank choice exists for non-required selects.
  if (!props.field.reqd && raw[0] !== '') return ['', ...raw]
  return raw
})

// ----- Link autocomplete -----
const linkOpen = ref(false)
const linkResults = ref([])
let linkTimer = null

const linkSearch = createResource({
  url: 'frappe.desk.search.search_link',
  makeParams({ txt }) {
    return { doctype: props.field.options, txt: txt || '', page_length: 20 }
  },
  onSuccess(data) {
    // Frappe returns [{value, description}] in newer versions; normalise.
    linkResults.value = (data || []).map((r) =>
      typeof r === 'string' ? { value: r, description: '' } : r
    )
  },
})

function runLinkSearch(txt) {
  clearTimeout(linkTimer)
  linkTimer = setTimeout(() => linkSearch.submit({ txt }), 200)
}

function onLinkInput(v) {
  emitVal(v)
  linkOpen.value = true
  runLinkSearch(v)
}
function onLinkFocus() {
  linkOpen.value = true
  if (!linkResults.value.length) runLinkSearch(props.modelValue || '')
}
function onLinkBlur() {
  // Delay so a click on a result registers first.
  setTimeout(() => (linkOpen.value = false), 150)
}
function pickLink(v) {
  emitVal(v)
  linkOpen.value = false
}

// datetime-local needs 'YYYY-MM-DDTHH:MM'
function toLocalDatetime(v) {
  if (!v) return ''
  return String(v).slice(0, 16).replace(' ', 'T')
}
</script>
