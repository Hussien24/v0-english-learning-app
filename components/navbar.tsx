"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, Brain, BarChart, Settings, Calendar, Palette, WifiOff, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

export function Navbar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [offlineMode, setOfflineMode] = useState(false)
  const { toast } = useToast()

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)

    // تحميل إعداد وضع عدم الاتصال
    const savedOfflineMode = localStorage.getItem("offlineMode")
    if (savedOfflineMode) {
      try {
        setOfflineMode(JSON.parse(savedOfflineMode))
      } catch (error) {
        console.error("Failed to parse offline mode setting:", error)
      }
    }
  }, [])

  // تبديل وضع عدم الاتصال
  const toggleOfflineMode = () => {
    const newMode = !offlineMode
    setOfflineMode(newMode)

    localStorage.setItem("offlineMode", JSON.stringify(newMode))

    toast({
      title: newMode ? "تم تفعيل وضع عدم الاتصال" : "تم إلغاء وضع عدم الاتصال",
      description: newMode ? "سيتم تخزين جميع البيانات محليًا فقط." : "سيتم مزامنة البيانات عند توفر اتصال.",
    })
  }

  if (!mounted) return null

  // Don't show navbar on the home page
  if (pathname === "/") return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16 bg-background border-t md:hidden">
      <Link
        href="/flashcards"
        className={`flex flex-col items-center justify-center w-full h-full ${
          pathname.includes("/flashcards") ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <BookOpen className="w-5 h-5" />
        <span className="mt-1 text-xs">البطاقات</span>
      </Link>
      <Link
        href="/quiz"
        className={`flex flex-col items-center justify-center w-full h-full ${
          pathname.includes("/quiz") && !pathname.includes("/daily-quiz") ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <Brain className="w-5 h-5" />
        <span className="mt-1 text-xs">الاختبار</span>
      </Link>
      <Link
        href="/daily-quiz"
        className={`flex flex-col items-center justify-center w-full h-full ${
          pathname.includes("/daily-quiz") ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <Calendar className="w-5 h-5" />
        <span className="mt-1 text-xs">اليومي</span>
        <Badge variant="outline" className="absolute top-2 right-1/2 translate-x-1/2 text-[10px] px-1 py-0">
          جديد
        </Badge>
      </Link>

      <Link
        href="/paragraph-quiz"
        className={`flex flex-col items-center justify-center w-full h-full ${
          pathname.includes("/paragraph-quiz") ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <FileText className="w-5 h-5" />
        <span className="mt-1 text-xs">الفقرات</span>
        <Badge variant="outline" className="absolute top-2 right-1/2 translate-x-1/2 text-[10px] px-1 py-0">
          جديد
        </Badge>
      </Link>

      <Link
        href="/progress"
        className={`flex flex-col items-center justify-center w-full h-full ${
          pathname.includes("/progress") ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <BarChart className="w-5 h-5" />
        <span className="mt-1 text-xs">التقدم</span>
      </Link>
      <div className="relative group">
        <Link
          href="/settings"
          className={`flex flex-col items-center justify-center w-full h-full ${
            pathname.includes("/settings") || pathname.includes("/appearance")
              ? "text-primary"
              : "text-muted-foreground"
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="mt-1 text-xs">الإعدادات</span>
        </Link>

        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover border rounded-lg shadow-lg p-2 w-48 hidden group-hover:block">
          <div className="space-y-2">
            <Link href="/settings" className="flex items-center gap-2 p-2 hover:bg-muted rounded-md">
              <Settings className="w-4 h-4" />
              <span className="text-sm">الإعدادات العامة</span>
            </Link>
            <Link href="/appearance" className="flex items-center gap-2 p-2 hover:bg-muted rounded-md">
              <Palette className="w-4 h-4" />
              <span className="text-sm">تخصيص المظهر</span>
            </Link>
            <div className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm">وضع عدم الاتصال</span>
              </div>
              <Switch checked={offlineMode} onCheckedChange={toggleOfflineMode} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
