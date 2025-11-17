<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Badge from 'primevue/badge'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'

const router = useRouter()
const { t } = useI18n()
const toast = useToast()

const terminals = ref<any[]>([])
const isLoading = ref(true)
const showCreateModal = ref(false)
const newTerminalShell = ref('')
const newTerminalCwd = ref('')

const fetchTerminals = async () => {
  try {
    const response = await fetch('/api/terminals')
    if (!response.ok) {
      throw new Error('Failed to fetch terminals')
    }
    const data = await response.json()
    terminals.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching terminals:', error)
    terminals.value = []
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('messages.fetchTerminalsError'),
      life: 3000
    })
  } finally {
    isLoading.value = false
  }
}

const createTerminal = async () => {
  try {
    const response = await fetch('/api/terminals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shell: newTerminalShell.value || undefined,
        cwd: newTerminalCwd.value || undefined,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create terminal')
    }

    const newTerminal = await response.json()
    terminals.value.push(newTerminal)
    
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('messages.terminalCreated'),
      life: 3000
    })

    // Reset form and close modal
    newTerminalShell.value = ''
    newTerminalCwd.value = ''
    showCreateModal.value = false
  } catch (error) {
    console.error('Error creating terminal:', error)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('messages.createTerminalError'),
      life: 3000
    })
  }
}

const deleteTerminal = async (id: string) => {
  try {
    const response = await fetch(`/api/terminals/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete terminal')
    }

    terminals.value = terminals.value.filter(t => t.id !== id)
    
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('messages.terminalDeleted'),
      life: 3000
    })
  } catch (error) {
    console.error('Error deleting terminal:', error)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('messages.deleteTerminalError'),
      life: 3000
    })
  }
}

const openTerminal = (id: string) => {
  router.push(`/terminal/${id}`)
}

const getStatusSeverity = (status: string) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'warning'
    case 'terminated':
      return 'danger'
    default:
      return 'info'
  }
}

onMounted(() => {
  fetchTerminals()
})
</script>

<template>
  <div class="min-h-screen bg-surface-50 dark:bg-surface-900 p-4">
    <Toast />
    
    <!-- Header -->
    <div class="flex justify-between items-center mb-6 bg-surface-0 dark:bg-surface-800 p-4 rounded-lg shadow-md">
      <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
        🖥️ {{ t('home.title') }}
      </h1>
      <div class="flex items-center gap-3">
        <Button 
          icon="pi pi-refresh" 
          :label="t('home.refresh')" 
          severity="secondary" 
          @click="fetchTerminals"
        />
        <Button 
          icon="pi pi-plus" 
          :label="t('home.createNewTerminal')" 
          severity="primary" 
          @click="showCreateModal = true"
        />
        <LanguageSwitcher />
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Card>
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-surface-600 dark:text-surface-400 text-sm">{{ t('home.totalTerminals') }}</div>
              <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ terminals.length }}</div>
            </div>
            <div class="text-3xl">📊</div>
          </div>
        </template>
      </Card>
      <Card>
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-surface-600 dark:text-surface-400 text-sm">{{ t('home.activeTerminals') }}</div>
              <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                {{ terminals.filter(t => t.status === 'active').length }}
              </div>
            </div>
            <div class="text-3xl">⚡</div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="text-center">
        <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
        <p class="mt-2">{{ t('common.loading') }}</p>
      </div>
    </div>

    <!-- Terminal List -->
    <div v-else-if="terminals.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card v-for="terminal in terminals" :key="terminal.id" class="hover:shadow-lg transition-shadow">
        <template #title>
          <div class="flex justify-between items-center">
            <span class="font-mono text-sm">{{ terminal.id.substring(0, 8) }}</span>
            <Badge :severity="getStatusSeverity(terminal.status)" :value="terminal.status" />
          </div>
        </template>
        <template #content>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-surface-600 dark:text-surface-400">{{ t('home.pid') }}:</span>
              <span class="font-mono">{{ terminal.pid }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-surface-600 dark:text-surface-400">{{ t('home.shell') }}:</span>
              <span class="font-mono">{{ terminal.shell || t('home.default') }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-surface-600 dark:text-surface-400">{{ t('home.directory') }}:</span>
              <span class="font-mono truncate" :title="terminal.cwd">{{ terminal.cwd || t('home.defaultDirectory') }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-surface-600 dark:text-surface-400">{{ t('home.created') }}:</span>
              <span>{{ new Date(terminal.created).toLocaleString() }}</span>
            </div>
          </div>
        </template>
        <template #footer>
          <div class="flex gap-2">
            <Button 
              icon="pi pi-external-link" 
              :label="t('home.open')" 
              severity="primary" 
              size="small"
              @click="openTerminal(terminal.id)"
            />
            <Button
              icon="pi pi-trash"
              :label="t('home.terminate')"
              severity="danger"
              size="small"
              @click="deleteTerminal(terminal.id)"
            />
          </div>
        </template>
      </Card>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="text-6xl mb-4">🖥️</div>
      <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">
        {{ t('home.noTerminals') }}
      </h3>
      <p class="text-surface-600 dark:text-surface-400 mb-6">
        {{ t('home.createFirstTerminal') }}
      </p>
      <Button 
        icon="pi pi-plus" 
        :label="t('home.createNewTerminal')" 
        severity="primary" 
        @click="showCreateModal = true"
      />
    </div>

    <!-- Create Terminal Modal -->
    <Dialog 
      v-model:visible="showCreateModal" 
      :header="t('home.createNewTerminal')" 
      :style="{ width: '450px' }"
      :modal="true"
    >
      <div class="space-y-4">
        <div>
          <label for="shell" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            {{ t('home.shell') }} ({{ t('home.optional') }}):
          </label>
          <InputText 
            id="shell"
            v-model="newTerminalShell" 
            :placeholder="t('home.shellPlaceholder')"
            class="w-full"
          />
        </div>
        <div>
          <label for="cwd" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            {{ t('home.workingDirectory') }} ({{ t('home.optional') }}):
          </label>
          <InputText 
            id="cwd"
            v-model="newTerminalCwd" 
            :placeholder="t('home.directoryPlaceholder')"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button 
          :label="t('common.cancel')" 
          severity="secondary" 
          @click="showCreateModal = false"
        />
        <Button 
          :label="t('home.create')" 
          severity="primary" 
          @click="createTerminal"
        />
      </template>
    </Dialog>
  </div>
</template>