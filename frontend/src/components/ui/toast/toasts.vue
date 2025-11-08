<script setup lang="ts">
import { useToast } from './use-toast'
import Toast from './toast.vue'
import ToastViewport from './toast-viewport.vue'
import ToastProvider from './toast-provider.vue'

const { toasts } = useToast()
</script>

<template>
  <ToastProvider>
    <Toast v-for="toast in toasts" :key="toast.id" v-bind="toast" />
    <ToastViewport />
  </ToastProvider>
</template>