<template>
  <div>
    <div class="mb-6">
      <h1 class="font-display text-2xl font-bold tracking-tight">Settings</h1>
      <p class="mt-1 text-sm text-gray-500">
        These DocTypes appear on the home screen, in order. Drag to reorder.
        Saved centrally for everyone (also editable in Frappe Desk &rarr;
        <span class="font-medium">DocFlow Settings</span>).
      </p>
    </div>

    <div v-if="navResource.loading" class="space-y-2">
      <div v-for="n in 3" :key="n" class="h-14 animate-pulse rounded-xl bg-gray-100" />
    </div>

    <template v-else>
      <!-- Add row -->
      <div class="mb-5 grid grid-cols-12 gap-2">
        <input
          v-model="form.doctype_name"
          placeholder="DocType (e.g. Sales Invoice)"
          class="col-span-6 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
          @keyup.enter="add"
        />
        <input
          v-model="form.label"
          placeholder="Label (optional)"
          class="col-span-3 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
          @keyup.enter="add"
        />
        <input
          v-model="form.icon"
          placeholder="Icon"
          class="col-span-1 rounded-lg border border-gray-300 px-2 py-2 text-center text-sm outline-none focus:border-gray-900"
          @keyup.enter="add"
        />
        <button
          class="col-span-2 rounded-lg bg-gray-900 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          :disabled="!form.doctype_name.trim()"
          @click="add"
        >
          Add
        </button>
      </div>

      <!-- Reorderable list -->
      <draggable
        v-model="local"
        :item-key="(el) => el._id"
        handle=".handle"
        class="space-y-2"
        ghost-class="opacity-40"
      >
        <template #item="{ element, index }">
          <div class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
            <span class="handle cursor-grab select-none text-gray-300 active:cursor-grabbing">
              &#x2630;
            </span>
            <span
              class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gray-100 text-sm font-bold text-gray-600"
            >
              {{ (element.icon || element.label || element.doctype_name).slice(0, 2) }}
            </span>
            <div class="min-w-0 flex-1">
              <div class="truncate font-medium">{{ element.doctype_name }}</div>
              <div class="truncate text-xs text-gray-400">{{ element.label }}</div>
            </div>
            <button
              class="rounded-lg px-2 py-1 text-sm text-gray-400 hover:bg-red-50 hover:text-red-600"
              @click="local.splice(index, 1)"
            >
              Remove
            </button>
          </div>
        </template>
      </draggable>

      <!-- Save -->
      <div class="mt-6 flex items-center gap-3">
        <button
          class="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          :disabled="saveNavResource.loading"
          @click="save"
        >
          {{ saveNavResource.loading ? 'Saving…' : 'Save changes' }}
        </button>
        <span v-if="saved" class="text-sm text-green-600">Saved.</span>
        <span v-if="saveNavResource.error" class="text-sm text-red-600">
          Couldn't save — you may need the System Manager role.
        </span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import draggable from 'vuedraggable'
import { navResource, saveNavResource } from '@/data/config'

let uid = 0
const local = ref([])
const saved = ref(false)
const form = reactive({ doctype_name: '', label: '', icon: '' })

function hydrate(data) {
  local.value = (data || []).map((d) => ({ ...d, _id: ++uid }))
}

// Initialise the editable copy when server data arrives.
watch(() => navResource.data, hydrate, { immediate: true })

function add() {
  const name = form.doctype_name.trim()
  if (!name) return
  local.value.push({
    _id: ++uid,
    doctype_name: name,
    label: form.label.trim() || name,
    icon: form.icon.trim(),
  })
  form.doctype_name = ''
  form.label = ''
  form.icon = ''
}

function save() {
  saved.value = false
  const payload = local.value.map(({ doctype_name, label, icon }) => ({
    doctype_name,
    label,
    icon,
  }))
  saveNavResource.submit(payload).then(() => {
    saved.value = true
    setTimeout(() => (saved.value = false), 2500)
  })
}
</script>
