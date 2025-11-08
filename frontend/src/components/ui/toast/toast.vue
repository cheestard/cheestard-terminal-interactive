<script setup lang="ts">
import { computed } from 'vue'
import ToastClose from './toast-close.vue'
import ToastTitle from './toast-title.vue'
import ToastDescription from './toast-description.vue'
import type { ToastProps } from './types'

const props = withDefaults(defineProps<ToastProps>(), {
  variant: 'default',
  duration: 3000,
})

const classes = computed(() => {
  return [
    'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--swipe-duration)] data-[swipe=begin]:translate-x-[var(--swipe-duration)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
    props.variant === 'default' ? 'border bg-background text-foreground' : '',
    props.variant === 'destructive' ? 'destructive group border-destructive bg-destructive text-destructive-foreground' : '',
  ]
})
</script>

<template>
  <div :class="classes">
    <div class="grid gap-1">
      <ToastTitle v-if="title">{{ title }}</ToastTitle>
      <ToastDescription v-if="description">{{ description }}</ToastDescription>
    </div>
    <ToastClose />
  </div>
</template>