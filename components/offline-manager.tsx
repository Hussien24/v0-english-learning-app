"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Wifi, WifiOff } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export function OfflineManager() {
  const [isOnline, setIsOnline] = useState(true)
  const [showAlert, setShowAlert] = useState(false)
  const [offlineMode, setOfflineMode] = useState(false)
  const { toast } = useToast()

  // التحقق من حالة الاتصال عند تحميل المكون
  useEffect(() => {
    // تعيين الحالة الأولية
    const initialOnlineStatus = navigator.onLine
    setIsOnline(initialOnlineStatus)

    // إذا كان غير متصل بالإنترنت عند التحميل، فعّل وضع عدم الاتصال تلقائيًا
    if (!initialOnlineStatus) {
      setOfflineMode(true)
      localStorage.setItem("offlineMode", JSON.stringify(true))
      setShowAlert(true)
    } else {
      // تحميل إعداد وضع عدم الاتصال من التخزين المحلي
      const savedOfflineMode = localStorage.getItem("offlineMode")
      if (savedOfflineMode) {
        try {
          setOfflineMode(JSON.parse(savedOfflineMode))
        } catch (error) {
          console.error("Failed to parse offline mode setting:", error)
        }
      }
    }

    // إعداد المستمعين لأحداث الاتصال
    const handleOnline = () => {
      setIsOnline(true)
      setShowAlert(true)

      // إخفاء التنبيه بعد 5 ثوانٍ
      setTimeout(() => setShowAlert(false), 5000)

      // لا نقوم بإلغاء تفعيل وضع عدم الاتصال تلقائيًا عند استعادة الاتصال
      // لكن نعرض رسالة للمستخدم
      toast({
        title: "تم استعادة الاتصال",
        description: "أنت متصل بالإنترنت الآن. يمكنك إلغاء وضع عدم الاتصال إذا كنت ترغب في ذلك.",
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowAlert(true)

      // تفعيل وضع عدم الاتصال تلقائيًا عند فقدان الاتصال
      setOfflineMode(true)
      localStorage.setItem("offlineMode", JSON.stringify(true))

      toast({
        title: "انقطع الاتصال",
        description: "تم تفعيل وضع عدم الاتصال تلقائيًا. سيتم حفظ التغييرات محليًا.",
        variant: "destructive",
      })
    }

    // إضافة المستمعين
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // إزالة المستمعين عند تفكيك المكون
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [toast])

  // تبديل وضع عدم الاتصال يدويًا
  const toggleOfflineMode = () => {
    const newMode = !offlineMode
    setOfflineMode(newMode)

    localStorage.setItem("offlineMode", JSON.stringify(newMode))

    toast({
      title: newMode ? "تم تفعيل وضع عدم الاتصال" : "تم إلغاء وضع عدم الاتصال",
      description: newMode ? "سيتم تخزين جميع البيانات محليًا فقط." : "سيتم مزامنة البيانات عند توفر اتصال.",
    })
  }

  if (!showAlert && !offlineMode) {
    return null
  }

  return (
    <div className="fixed bottom-20 left-4 z-50 md:bottom-8 md:left-8 max-w-md">
      {!isOnline && showAlert && (
        <Alert variant="destructive" className="mb-2">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>انقطع الاتصال</AlertTitle>
          <AlertDescription>
            أنت غير متصل بالإنترنت حاليًا. تم تفعيل وضع عدم الاتصال تلقائيًا وسيتم حفظ جميع التغييرات محليًا.
          </AlertDescription>
        </Alert>
      )}

      {isOnline && showAlert && (
        <Alert
          variant="default"
          className="mb-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800/50"
        >
          <Wifi className="h-4 w-4" />
          <AlertTitle>تم استعادة الاتصال</AlertTitle>
          <AlertDescription>أنت متصل بالإنترنت الآن. يمكنك إلغاء وضع عدم الاتصال إذا كنت ترغب في ذلك.</AlertDescription>
        </Alert>
      )}

      {offlineMode && (
        <Alert
          variant="default"
          className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50"
        >
          <WifiOff className="h-4 w-4" />
          <AlertTitle>وضع عدم الاتصال مفعل</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>أنت تستخدم التطبيق في وضع عدم الاتصال. جميع البيانات محفوظة محليًا فقط.</p>
            {isOnline && (
              <Button size="sm" variant="outline" onClick={toggleOfflineMode} className="self-end">
                إلغاء وضع عدم الاتصال
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
