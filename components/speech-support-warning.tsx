"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { VolumeX } from "lucide-react"

export function SpeechSupportWarning() {
  const [isSupported, setIsSupported] = useState(true)
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    // تحقق من دعم المتصفح للـ Speech Synthesis
    if (typeof window !== "undefined") {
      const supported = "speechSynthesis" in window
      setIsSupported(supported)

      // عرض التحذير فقط إذا كان المتصفح لا يدعم الخاصية
      if (!supported) {
        setShowWarning(true)

        // إخفاء التحذير بعد 10 ثوانٍ
        const timer = setTimeout(() => {
          setShowWarning(false)
        }, 10000)

        return () => clearTimeout(timer)
      }
    }
  }, [])

  if (isSupported || !showWarning) {
    return null
  }

  return (
    <Alert variant="warning" className="mb-4">
      <VolumeX className="h-4 w-4" />
      <AlertTitle>متصفحك لا يدعم خاصية النطق</AlertTitle>
      <AlertDescription>
        يبدو أن متصفحك لا يدعم خاصية نطق الكلمات. يرجى تجربة متصفح آخر مثل Chrome أو Edge أو Firefox للاستفادة من هذه
        الميزة.
      </AlertDescription>
    </Alert>
  )
}
