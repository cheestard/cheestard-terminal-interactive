import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并Tailwind CSS类名的工具函数
 * Utility function to merge Tailwind CSS class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}