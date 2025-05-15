"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Palette, Layout, Type, Eye, Monitor, Moon, Sun, Check } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"

interface AppearanceSettings {
  fontSize: number
  cardAnimation: boolean
  cardStyle: string
  borderRadius: number
  colorScheme: string
  rtl: boolean
}

const DEFAULT_SETTINGS: AppearanceSettings = {
  fontSize: 16,
  cardAnimation: true,
  cardStyle: "gradient",
  borderRadius: 0.5,
  colorScheme: "blue",
  rtl: true,
}

export default function AppearancePage() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [settings, setSettings] = useState<AppearanceSettings>(DEFAULT_SETTINGS)
  const [mounted, setMounted] = useState(false)

  // تحميل الإعدادات من التخزين المحلي
  useEffect(() => {
    const savedSettings = localStorage.getItem("appearanceSettings")
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (error) {
        console.error("Failed to parse saved appearance settings:", error)
      }
    }
    setMounted(true)
  }, [])

  // حفظ الإعدادات عند تغييرها
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("appearanceSettings", JSON.stringify(settings))
      applySettings()
    }
  }, [settings, mounted])

  // تطبيق الإعدادات على الصفحة
  const applySettings = () => {
    // تطبيق حجم الخط
    document.documentElement.style.setProperty("--base-font-size", `${settings.fontSize}px`)

    // تطبيق نمط البطاقات
    document.documentElement.classList.remove("card-style-flat", "card-style-gradient", "card-style-solid")
    document.documentElement.classList.add(`card-style-${settings.cardStyle}`)

    // تطبيق نصف قطر الحواف
    document.documentElement.style.setProperty("--radius", `${settings.borderRadius}rem`)

    // تطبيق نظام الألوان
    document.documentElement.classList.remove("theme-blue", "theme-green", "theme-purple", "theme-orange", "theme-red")
    document.documentElement.classList.add(`theme-${settings.colorScheme}`)

    // تطبيق اتجاه النص
    document.documentElement.dir = settings.rtl ? "rtl" : "ltr"
  }

  // إعادة تعيين الإعدادات إلى الافتراضية
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
    toast({
      title: "تم إعادة التعيين",
      description: "تم إعادة تعيين إعدادات المظهر إلى الإعدادات الافتراضية.",
    })
  }

  // تحديث إعداد معين
  const updateSetting = <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex items-center h-16 px-4 mx-auto">
          <Link href="/" className="flex items-center mr-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            العودة
          </Link>
          <h1 className="text-2xl font-bold">تخصيص المظهر</h1>
        </div>
      </header>

      <main className="container px-4 py-8 mx-auto">
        <div className="max-w-3xl mx-auto">
          <Tabs defaultValue="theme">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="theme" className="text-base py-3">
                <Palette className="w-4 h-4 mr-2" />
                السمة
              </TabsTrigger>
              <TabsTrigger value="layout" className="text-base py-3">
                <Layout className="w-4 h-4 mr-2" />
                التخطيط
              </TabsTrigger>
              <TabsTrigger value="text" className="text-base py-3">
                <Type className="w-4 h-4 mr-2" />
                النص
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-base py-3">
                <Eye className="w-4 h-4 mr-2" />
                معاينة
              </TabsTrigger>
            </TabsList>

            <TabsContent value="theme">
              <Card>
                <CardHeader>
                  <CardTitle>السمة والألوان</CardTitle>
                  <CardDescription>تخصيص سمة التطبيق ونظام الألوان</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>وضع السمة</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        className={`flex flex-col items-center justify-center gap-2 p-4 ${
                          theme === "light" ? "bg-primary/10 border-primary" : ""
                        }`}
                        onClick={() => setTheme("light")}
                      >
                        <Sun className="h-6 w-6" />
                        <span>فاتح</span>
                        {theme === "light" && <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />}
                      </Button>
                      <Button
                        variant="outline"
                        className={`flex flex-col items-center justify-center gap-2 p-4 ${
                          theme === "dark" ? "bg-primary/10 border-primary" : ""
                        }`}
                        onClick={() => setTheme("dark")}
                      >
                        <Moon className="h-6 w-6" />
                        <span>داكن</span>
                        {theme === "dark" && <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />}
                      </Button>
                      <Button
                        variant="outline"
                        className={`flex flex-col items-center justify-center gap-2 p-4 ${
                          theme === "system" ? "bg-primary/10 border-primary" : ""
                        }`}
                        onClick={() => setTheme("system")}
                      >
                        <Monitor className="h-6 w-6" />
                        <span>تلقائي</span>
                        {theme === "system" && <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>نظام الألوان</Label>
                    <RadioGroup
                      value={settings.colorScheme}
                      onValueChange={(value) => updateSetting("colorScheme", value)}
                      className="grid grid-cols-2 gap-2"
                    >
                      <Label
                        htmlFor="color-blue"
                        className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-blue-600" />
                          <span>أزرق</span>
                        </div>
                        <RadioGroupItem value="blue" id="color-blue" className="sr-only" />
                      </Label>
                      <Label
                        htmlFor="color-green"
                        className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-green-600" />
                          <span>أخضر</span>
                        </div>
                        <RadioGroupItem value="green" id="color-green" className="sr-only" />
                      </Label>
                      <Label
                        htmlFor="color-purple"
                        className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-purple-600" />
                          <span>بنفسجي</span>
                        </div>
                        <RadioGroupItem value="purple" id="color-purple" className="sr-only" />
                      </Label>
                      <Label
                        htmlFor="color-orange"
                        className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-orange-600" />
                          <span>برتقالي</span>
                        </div>
                        <RadioGroupItem value="orange" id="color-orange" className="sr-only" />
                      </Label>
                      <Label
                        htmlFor="color-red"
                        className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-red-600" />
                          <span>أحمر</span>
                        </div>
                        <RadioGroupItem value="red" id="color-red" className="sr-only" />
                      </Label>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout">
              <Card>
                <CardHeader>
                  <CardTitle>تخطيط الواجهة</CardTitle>
                  <CardDescription>تخصيص تخطيط وشكل عناصر الواجهة</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="card-animation">تأثيرات حركية للبطاقات</Label>
                      <Switch
                        id="card-animation"
                        checked={settings.cardAnimation}
                        onCheckedChange={(checked) => updateSetting("cardAnimation", checked)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      تفعيل التأثيرات الحركية عند التفاعل مع البطاقات التعليمية
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>نمط البطاقات</Label>
                    <RadioGroup
                      value={settings.cardStyle}
                      onValueChange={(value) => updateSetting("cardStyle", value)}
                      className="grid grid-cols-3 gap-2"
                    >
                      <Label
                        htmlFor="style-gradient"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <div className="h-20 w-full rounded-md bg-gradient-to-br from-primary/20 to-primary/5 mb-2" />
                        <span>متدرج</span>
                        <RadioGroupItem value="gradient" id="style-gradient" className="sr-only" />
                      </Label>
                      <Label
                        htmlFor="style-solid"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <div className="h-20 w-full rounded-md bg-primary/10 mb-2" />
                        <span>صلب</span>
                        <RadioGroupItem value="solid" id="style-solid" className="sr-only" />
                      </Label>
                      <Label
                        htmlFor="style-flat"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <div className="h-20 w-full rounded-md bg-background border-2 mb-2" />
                        <span>مسطح</span>
                        <RadioGroupItem value="flat" id="style-flat" className="sr-only" />
                      </Label>
                    </RadioGroup>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="border-radius">استدارة الحواف</Label>
                      <span className="text-sm">{settings.borderRadius} rem</span>
                    </div>
                    <Slider
                      id="border-radius"
                      min={0}
                      max={2}
                      step={0.1}
                      value={[settings.borderRadius]}
                      onValueChange={(value) => updateSetting("borderRadius", value[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>مربع</span>
                      <span>دائري</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="rtl-switch">اتجاه النص</Label>
                      <Switch
                        id="rtl-switch"
                        checked={settings.rtl}
                        onCheckedChange={(checked) => updateSetting("rtl", checked)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {settings.rtl ? "من اليمين إلى اليسار (RTL)" : "من اليسار إلى اليمين (LTR)"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="text">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات النص</CardTitle>
                  <CardDescription>تخصيص حجم ونوع الخط</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="font-size">حجم الخط</Label>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{settings.fontSize}px</span>
                      <Slider
                        id="font-size"
                        min={12}
                        max={24}
                        step={1}
                        value={[settings.fontSize]}
                        onValueChange={(value) => updateSetting("fontSize", value[0])}
                        className="w-full mx-4"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>صغير</span>
                      <span>كبير</span>
                    </div>
                  </div>

                  <Separator />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <CardTitle>معاينة المظهر</CardTitle>
                  <CardDescription>معاينة التغييرات على مظهر التطبيق</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border rounded-md p-6 space-y-4">
                    <h3 className="text-xl font-bold">معاينة البطاقة التعليمية</h3>
                    <div
                      className={`p-6 rounded-md border-2 ${
                        settings.cardStyle === "gradient"
                          ? "bg-gradient-to-br from-primary/20 to-primary/5"
                          : settings.cardStyle === "solid"
                            ? "bg-primary/10"
                            : "bg-background"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center h-32">
                        <h4 className="text-2xl font-bold mb-2">Example</h4>
                        <p className="text-muted-foreground">مثال / نموذج</p>
                      </div>
                    </div>
                    <p>
                      هذا نص تجريبي لمعاينة حجم ونوع الخط المختار. يمكنك رؤية كيف سيظهر النص في التطبيق بناءً على
                      الإعدادات التي اخترتها.
                    </p>
                    <div className="flex gap-2">
                      <Button>زر أساسي</Button>
                      <Button variant="outline">زر ثانوي</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={resetSettings}>
              إعادة تعيين الإعدادات
            </Button>
            <Link href="/">
              <Button>حفظ والعودة</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
