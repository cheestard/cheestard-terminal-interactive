<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Badge from 'primevue/badge'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const toast = useToast()

const terminalId = route.params.id as string
const terminal = ref<any>(null)
const commandInput = ref('')
const terminalOutput = ref<string[]>([])
const isLoading = ref(true)
const isConnected = ref(false)

let ws: WebSocket | null = null

const fetchTerminalDetails = async () => {
  try {
    const response = await fetch(`/api/terminals/${terminalId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch terminal details')
    }
    const data = await response.json()
    terminal.value = data
  } catch (error) {
    console.error('Error fetching terminal details:', error)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('messages.fetchTerminalDetailsError'),
      life: 3000
    })
    router.push('/')
  } finally {
    isLoading.value = false
  }
}

const connectWebSocket = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//${window.location.host}/ws/terminal/${terminalId}`

  ws = new WebSocket(wsUrl)

  ws.onopen = () => {
    console.log('Terminal WebSocket connected')
    isConnected.value = true
    toast.add({
      severity: 'success',
      summary: t('terminal.connected'),
      detail: t('terminal.connectedTo', { id: terminalId.substring(0, 8) }),
      life: 3000
    })
  }

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data)
    if (message.type === 'output') {
      terminalOutput.value.push(message.data)
      // Auto-scroll to bottom
      setTimeout(() => {
        const outputElement = document.getElementById('terminal-output')
        if (outputElement) {
          outputElement.scrollTop = outputElement.scrollHeight
        }
      }, 100)
    }
  }

  ws.onerror = (error) => {
    console.error('Terminal WebSocket error:', error)
    isConnected.value = false
    toast.add({
      severity: 'error',
      summary: t('terminal.connectionError'),
      detail: t('terminal.terminalConnectionError'),
      life: 3000
    })
  }

  ws.onclose = () => {
    console.log('Terminal WebSocket disconnected')
    isConnected.value = false
    toast.add({
      severity: 'warn',
      summary: t('terminal.connectionLost'),
      detail: t('terminal.terminalConnectionLost'),
      life: 3000
    })
  }
}

const sendCommand = () => {
  if (!commandInput.value.trim() || !isConnected.value || !ws) return

  const command = commandInput.value
  commandInput.value = ''
  
  // Add command to output for better UX
  terminalOutput.value.push(`$ ${command}`)
  
  ws.send(JSON.stringify({
    type: 'command',
    data: command
  }))
}

const clearOutput = () => {
  terminalOutput.value = []
}

const reconnect = () => {
  if (ws) {
    ws.close()
  }
  connectWebSocket()
}

onMounted(() => {
  fetchTerminalDetails()
  connectWebSocket()
})

onUnmounted(() => {
  if (ws) {
    ws.close()
  }
})
</script>

<template>
  <div class="min-h-screen bg-surface-50 dark:bg-surface-900 p-4">
    <Toast />
    
    <!-- Header -->
    <div class="flex justify-between items-center mb-6 bg-surface-0 dark:bg-surface-800 p-4 rounded-lg shadow-md">
      <div class="flex items-center gap-3">
        <Button 
          icon="pi pi-arrow-left" 
          :label="t('terminal.backToList')" 
          severity="secondary" 
          size="small"
          @click="$router.push('/')"
        />
      </div>
      <div class="flex items-center gap-2">
        <Badge :severity="isConnected ? 'success' : 'danger'" :value="isConnected ? t('terminal.connected') : t('terminal.disconnected')" />
        <Button 
          icon="pi pi-trash" 
          :label="t('terminal.clear')" 
          severity="secondary" 
          size="small"
          @click="clearOutput"
        />
        <Button 
          icon="pi pi-refresh" 
          :label="t('terminal.reconnect')" 
          severity="secondary" 
          size="small"
          @click="reconnect" 
          :disabled="isConnected"
        />
        <LanguageSwitcher />
      </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center h-64">
        <div class="text-center">
          <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
          <p class="mt-2">{{ t('common.loading') }}</p>
        </div>
      </div>

      <!-- Terminal Interface -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <!-- Terminal Info Panel -->
        <div class="lg:col-span-1">
          <Card>
            <template #title>
              {{ t('terminal.terminalInfo') }}
            </template>
            <template #content>
              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-surface-600 dark:text-surface-400">ID:</span>
                  <span class="font-mono">{{ terminal?.id?.substring(0, 8) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-surface-600 dark:text-surface-400">{{ t('home.pid') }}:</span>
                  <span class="font-mono">{{ terminal?.pid }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-surface-600 dark:text-surface-400">{{ t('home.shell') }}:</span>
                  <span class="font-mono">{{ terminal?.shell || t('home.default') }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-surface-600 dark:text-surface-400">{{ t('home.directory') }}:</span>
                  <span class="font-mono truncate" :title="terminal?.cwd">{{ terminal?.cwd || t('home.defaultDirectory') }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-surface-600 dark:text-surface-400">{{ t('home.created') }}:</span>
                  <span>{{ new Date(terminal?.created).toLocaleString() }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-surface-600 dark:text-surface-400">{{ t('home.status') }}:</span>
                  <Badge :severity="terminal?.status === 'active' ? 'success' : 'warning'" :value="terminal?.status" />
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Terminal Output -->
        <div class="lg:col-span-3">
          <Card>
            <template #content>
              <div class="flex flex-col h-[600px]">
                <!-- Output Display -->
                <div 
                  id="terminal-output"
                  class="flex-1 bg-surface-900 text-surface-0 p-4 rounded-t-lg font-mono text-sm overflow-auto"
                  style="min-height: 500px;"
                >
                  <div v-if="terminalOutput.length === 0" class="text-surface-500">
                    {{ t('terminal.noOutput') }}
                  </div>
                  <div v-else>
                    <div v-for="(line, index) in terminalOutput" :key="index" class="mb-1">
                      {{ line }}
                    </div>
                  </div>
                </div>

                <!-- Command Input -->
                <div class="flex gap-2 p-3 bg-surface-100 dark:bg-surface-800 rounded-b-lg">
                  <span class="text-surface-600 dark:text-surface-400 font-mono">$</span>
                  <input
                    v-model="commandInput"
                    @keyup.enter="sendCommand"
                    :disabled="!isConnected"
                    :placeholder="isConnected ? t('terminal.commandPlaceholder') : t('terminal.disconnected')"
                    class="flex-1 bg-transparent border-none outline-none font-mono text-sm"
                  />
                  <Button 
                    icon="pi pi-send" 
                    severity="primary" 
                    size="small"
                    @click="sendCommand"
                    :disabled="!isConnected || !commandInput.trim()"
                  />
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>