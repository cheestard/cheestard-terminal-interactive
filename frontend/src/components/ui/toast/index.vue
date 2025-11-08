<script setup lang="ts">
import { useToast } from './use-toast'
import { Toasts } from './toasts'

const { toast } = useToast()
</script>

<template>
  <Toasts />
</template>