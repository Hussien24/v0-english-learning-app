"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { WifiOff, Home, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 mx-auto mb-4">
            <WifiOff className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-center text-xl">لا يوجد اتصال بالإنترنت</CardTitle>
          <CardDescription className="text-center">يبدو أنك غير متصل بالإنترنت حاليًا</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            يمكنك الاستمرار في استخدام التطبيق في وضع عدم الاتصال، ولكن بعض الميزات قد لا تعمل بشكل صحيح.
          </p>
          <p className="text-sm text-muted-foreground">
            سيتم حفظ جميع التغييرات محليًا وستتم مزامنتها عند استعادة الاتصال.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            إعادة المحاولة
          </Button>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full">
              <Home className="mr-2 h-4 w-4" />
              العودة للصفحة الرئيسية
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
