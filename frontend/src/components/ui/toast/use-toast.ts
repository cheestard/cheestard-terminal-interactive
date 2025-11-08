import { inject } from 'vue'
import type { App } from 'vue'
import { TOAST_KEY } from './constants'
import type { ToastMethods } from './types'

export const useToast = () => {
  const methods = inject(TOAST_KEY)

  if (!methods) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return methods
}

export const provideToast = (app: App, methods: ToastMethods) => {
  app.provide(TOAST_KEY, methods)
}