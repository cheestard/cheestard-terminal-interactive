import type { InjectionKey } from 'vue'
import type { ToastMethods } from './types'

export const TOAST_KEY: InjectionKey<ToastMethods> = Symbol('TOAST_KEY')