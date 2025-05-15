"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import {
  BookOpen,
  Brain,
  Calendar,
  Clock,
  FileText,
  Settings,
  Star,
  Sparkles,
  Zap,
  Palette,
  Wifi,
  WifiOff,
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { useToast } from "@/hooks/use-toast"

export default function HomePage() {
  const [flashcardCount, setFlashcardCount] = useState(0)
  const [lastStudied, setLastStudied] = useState<string | null>(null)
  const [streak, setStreak] = useState(0)
  const [isOnline, setIsOnline] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // تحميل البيانات من التخزين المحلي
    const loadData = () => {
      try {
        // تحميل البطاقات
        const savedFlashcards = localStorage.getItem("flashcards")
        if (savedFlashcards) {
          const flashcards = JSON.parse(savedFlashcards)
          setFlashcardCount(flashcards.length)
        }

        // تحميل بيانات الاختبار اليومي
        const dailyQuizState = localStorage.getItem("dailyQuizState")
        if (dailyQuizState) {
          const quizState = JSON.parse(dailyQuizState)
          setStreak(quizState.streak || 0)

          // تحديد آخر وقت للدراسة
          if (quizState.lastQuizDate) {
            const date = new Date(quizState.lastQuizDate)
            setLastStudied(date.toLocaleDateString())
          }
        }
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }

    loadData()

    // التحقق من حالة الاتصال
    const handleOnlineStatusChange = () => {
      setIsOnline(navigator.onLine)
      if (!navigator.onLine) {
        toast({
          title: "أنت الآن في وضع عدم الاتصال",
          description: "سيتم حفظ جميع التغييرات محليًا حتى تعود للاتصال بالإنترنت.",
          variant: "default",
        })
      }
    }

    window.addEventListener("online", handleOnlineStatusChange)
    window.addEventListener("offline", handleOnlineStatusChange)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnlineStatusChange)
      window.removeEventListener("offline", handleOnlineStatusChange)
    }
  }, [toast])

  // تأثيرات الحركة للعناصر
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container px-4 py-8 mx-auto">
        {/* قسم الترحيب */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-bold mb-4 hero-text-glow">تطبيق تعلم اللغة الإنجليزية</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            طريقة سهلة وفعالة لتعلم وحفظ الكلمات الإنجليزية وتحسين مهاراتك اللغوية
          </p>
        </motion.div>

        {/* شريط الإحصائيات */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium mb-1">البطاقات التعليمية</h3>
                <p className="text-3xl font-bold">{flashcardCount}</p>
              </div>
              <BookOpen className="h-10 w-10 text-primary opacity-80" />
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium mb-1">آخر دراسة</h3>
                <p className="text-xl font-bold">{lastStudied || "لم تبدأ بعد"}</p>
              </div>
              <Calendar className="h-10 w-10 text-primary opacity-80" />
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium mb-1">سلسلة الأيام</h3>
                <p className="text-3xl font-bold">{streak} يوم</p>
              </div>
              <Sparkles className="h-10 w-10 text-yellow-500 opacity-80" />
            </CardContent>
          </Card>
        </motion.div>

        {/* الميزات الرئيسية */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          <motion.div variants={itemVariants}>
            <Link href="/flashcards" className="block h-full">
              <Card className="h-full card-hover card-style-gradient card-shine">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    البطاقات التعليمية
                  </CardTitle>
                  <CardDescription>إنشاء وإدارة البطاقات التعليمية الخاصة بك</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    قم بإنشاء وتنظيم وحفظ الكلمات الإنجليزية باستخدام البطاقات التعليمية التفاعلية. يمكنك تصنيف البطاقات
                    في مجموعات وتتبع تقدمك في حفظها.
                  </p>
                </CardContent>
                <CardFooter>
                  <Badge variant="outline" className="mr-auto">
                    {flashcardCount} بطاقة
                  </Badge>
                </CardFooter>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link href="/quiz" className="block h-full">
              <Card className="h-full card-hover card-style-gradient card-shine">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    الاختبارات
                  </CardTitle>
                  <CardDescription>اختبر معرفتك بالكلمات الإنجليزية</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    قم باختبار معرفتك بالكلمات الإنجليزية من خلال اختبارات تفاعلية متنوعة. يمكنك تخصيص الاختبارات حسب
                    المجموعات والمستويات.
                  </p>
                </CardContent>
                <CardFooter>
                  <Badge variant="outline" className="mr-auto">
                    اختبارات متنوعة
                  </Badge>
                </CardFooter>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link href="/daily-quiz" className="block h-full">
              <Card className="h-full card-hover card-style-gradient card-shine">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    الاختبار اليومي
                  </CardTitle>
                  <CardDescription>تعلم بانتظام للحفاظ على سلسلة أيامك</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    قم بإجراء اختبار يومي للحفاظ على سلسلة أيامك المتتالية وتعزيز عملية التعلم. يمكنك اختيار نوع
                    الاختبار وعدد الكلمات.
                  </p>
                </CardContent>
                <CardFooter>
                  <Badge variant="outline" className="mr-auto">
                    {streak} يوم متتالي
                  </Badge>
                </CardFooter>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link href="/paragraph-quiz" className="block h-full">
              <Card className="h-full card-hover card-style-gradient card-shine">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    امتحان الفقرات
                  </CardTitle>
                  <CardDescription>ترجم فقرات كاملة وتعلم الكلمات في سياقها</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    قم بترجمة فقرات عربية إلى الإنجليزية باستخدام الكلمات التي تتعلمها. يساعدك هذا على فهم استخدام
                    الكلمات في سياقها الصحيح.
                  </p>
                </CardContent>
                <CardFooter>
                  <Badge variant="outline" className="mr-auto">
                    تعلم في سياق
                  </Badge>
                </CardFooter>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link href="/progress" className="block h-full">
              <Card className="h-full card-hover card-style-gradient card-shine">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    التقدم
                  </CardTitle>
                  <CardDescription>تتبع تقدمك في تعلم اللغة الإنجليزية</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    تتبع تقدمك في تعلم اللغة الإنجليزية من خلال إحصائيات ورسوم بيانية توضح مستوى إتقانك للكلمات
                    والمجموعات المختلفة.
                  </p>
                </CardContent>
                <CardFooter>
                  <Badge variant="outline" className="mr-auto">
                    إحصائيات مفصلة
                  </Badge>
                </CardFooter>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link href="/settings" className="block h-full">
              <Card className="h-full card-hover card-style-gradient card-shine">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    الإعدادات
                  </CardTitle>
                  <CardDescription>تخصيص التطبيق حسب تفضيلاتك</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    قم بتخصيص التطبيق حسب تفضيلاتك من خلال تغيير المظهر واللغة وإعدادات الإشعارات وغيرها من الخيارات.
                  </p>
                </CardContent>
                <CardFooter>
                  <div className="flex gap-2 mr-auto">
                    <Badge variant="outline" className="bg-blue-500/10">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                      <span>أزرق</span>
                    </Badge>
                    <Badge variant="outline" className="bg-green-500/10">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                      <span>أخضر</span>
                    </Badge>
                    <Badge variant="outline" className="bg-purple-500/10">
                      <div className="w-2 h-2 rounded-full bg-purple-500 mr-1"></div>
                      <span>بنفسجي</span>
                    </Badge>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          </motion.div>
        </motion.div>

        {/* قسم الميزات الإضافية */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            ميزات إضافية
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  التعلم المنتظم
                </h3>
                <p className="text-sm text-muted-foreground">
                  تعلم بانتظام للحفاظ على سلسلة أيامك المتتالية وتعزيز عملية التعلم.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" />
                  تخصيص المظهر
                </h3>
                <p className="text-sm text-muted-foreground">
                  قم بتخصيص مظهر التطبيق حسب تفضيلاتك من خلال تغيير الألوان والخطوط.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                  {isOnline ? <Wifi className="h-4 w-4 text-primary" /> : <WifiOff className="h-4 w-4 text-primary" />}
                  وضع عدم الاتصال
                </h3>
                <p className="text-sm text-muted-foreground">
                  استخدم التطبيق بدون اتصال بالإنترنت وسيتم مزامنة البيانات عند عودة الاتصال.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* زر البدء */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center"
        >
          <Link href="/flashcards">
            <Button size="lg" className="btn-primary-gradient btn-glow">
              <Sparkles className="mr-2 h-5 w-5" />
              ابدأ التعلم الآن
            </Button>
          </Link>
        </motion.div>
      </main>
    </div>
  )
}
