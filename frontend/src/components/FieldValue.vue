<template>
  <!-- Select / status fields render as a coloured badge, like Frappe list views -->
  <span
    v-if="isBadge"
    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
    :class="badgeClass"
  >
    {{ formatted }}
  </span>

  <!-- Check fields render as a small yes/no pill -->
  <span
    v-else-if="fieldtype === 'Check'"
    class="inline-flex items-center gap-1 text-sm"
    :class="value ? 'text-green-600' : 'text-gray-400'"
  >
    <span
      class="inline-block h-1.5 w-1.5 rounded-full"
      :class="value ? 'bg-green-500' : 'bg-gray-300'"
    />
    {{ value ? 'Yes' : 'No' }}
  </span>

  <span v-else>{{ formatted }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  fieldtype: { type: String, default: 'Data' },
  value: { default: null },
  // pass the field's label so we can detect "status"-like fields for badges
  fieldname: { type: String, default: '' },
})

const isEmpty = computed(
  () => props.value === null || props.value === undefined || props.value === ''
)

// Treat Select fields (and any "status" field) as badges.
const isBadge = computed(
  () =>
    !isEmpty.value &&
    (props.fieldtype === 'Select' || /status|state/i.test(props.fieldname))
)

function pad(n) {
  return String(n).padStart(2, '0')
}

// Frappe stores dates as 'YYYY-MM-DD' and datetimes as 'YYYY-MM-DD HH:MM:SS'.
function formatDate(v) {
  const d = new Date(String(v).replace(' ', 'T'))
  if (isNaN(d)) return String(v)
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(v) {
  const d = new Date(String(v).replace(' ', 'T'))
  if (isNaN(d)) return String(v)
  return (
    d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) +
    ', ' +
    pad(d.getHours()) + ':' + pad(d.getMinutes())
  )
}

const formatted = computed(() => {
  const v = props.value
  if (isEmpty.value) return '—'

  switch (props.fieldtype) {
    case 'Date':
      return formatDate(v)
    case 'Datetime':
      return formatDateTime(v)
    case 'Currency':
    case 'Float':
      return Number(v).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    case 'Int':
      return Number(v).toLocaleString()
    case 'Percent':
      return `${Number(v).toLocaleString()}%`
    case 'Duration':
      return formatDuration(Number(v))
    case 'Check':
      return v ? 'Yes' : 'No'
    case 'Text Editor':
    case 'HTML Editor':
    case 'Long Text':
    case 'Small Text':
    case 'Code':
    case 'Text':
      // strip HTML for a clean read view
      return String(v).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    default:
      return String(v)
  }
})

function formatDuration(seconds) {
  if (!seconds) return '0s'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return [h && `${h}h`, m && `${m}m`, s && `${s}s`].filter(Boolean).join(' ')
}

// Light, generic colour heuristics for status badges. Unknown values stay grey.
const badgeClass = computed(() => {
  const t = String(props.value).toLowerCase()
  if (/(paid|completed|complete|approved|success|active|submitted|delivered)/.test(t))
    return 'bg-green-100 text-green-700'
  if (/(overdue|cancelled|canceled|rejected|failed|error|expired|unpaid)/.test(t))
    return 'bg-red-100 text-red-700'
  if (/(draft|pending|open|to |in progress|partly|partial|hold)/.test(t))
    return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-600'
})
</script>
