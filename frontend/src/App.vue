<script setup lang="ts">
import Toaster from '@/components/ui/toast/toasts.vue'
import ToastProvider from '@/components/ui/toast/toast-provider.vue'
</script>

<template>
  <ToastProvider>
    <router-view />
    <Toaster />
  </ToastProvider>
</template>