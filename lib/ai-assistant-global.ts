"use client"

// تعريف النافذة العالمية لإضافة وظائف المساعد
declare global {
  interface Window {
    aiAssistantSetInput?: (text: string) => void
  }
}

export {}
