<script setup lang="ts">
import { provide, ref } from 'vue'
import { TOAST_KEY } from './constants'
import type { ToastMethods, ToastProps } from './types'

const toasts = ref<ToastProps[]>([])
let count = 0

const toast = (props: ToastProps) => {
  const id = String(count++)
  toasts.value.push({ ...props, id })

  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
    props.onClose?.()
  }, props.duration || 3000)
}

provide(TOAST_KEY, { toast, toasts })
</script>

<template>
  <slot />
</template>