import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTerminalStore = defineStore('terminal', () => {
  // 状态
  const refreshTrigger = ref(0)
  const createTrigger = ref(0)
  const showCreateModal = ref(false)
  const terminals = ref<any[]>([])

  // 计算属性 - 统计数据
  const stats = computed(() => ({
    total: terminals.value.length,
    active: terminals.value.filter(t => t.status === 'active').length,
    inactive: terminals.value.filter(t => t.status === 'inactive').length,
    terminated: terminals.value.filter(t => t.status === 'terminated').length
  }))

  // 动作
  const refreshTerminals = () => {
    refreshTrigger.value++
  }

  const createNewTerminal = () => {
    createTrigger.value++
    showCreateModal.value = true
  }

  const closeCreateModal = () => {
    showCreateModal.value = false
  }

  const updateTerminals = (newTerminals: any[]) => {
    terminals.value = newTerminals
  }

  return {
    // 状态
    refreshTrigger,
    createTrigger,
    showCreateModal,
    terminals,
    // 计算属性
    stats,
    // 动作
    refreshTerminals,
    createNewTerminal,
    closeCreateModal,
    updateTerminals
  }
})