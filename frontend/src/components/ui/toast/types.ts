import type { ComponentPublicInstance } from 'vue'

export type ToastProps = {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
  onClose?: () => void
}

export type ToastMethods = {
  toast: (props: ToastProps) => void
}

export type ToastComponent = ComponentPublicInstance<ToastProps>