<template>
  <router-view v-if="$route.name === 'Login'" />
  <AppShell v-else>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </AppShell>
</template>

<script setup>
import AppShell from '@/components/AppShell.vue'
</script>
