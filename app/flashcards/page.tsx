"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Plus,
  Upload,
  Download,
  BarChart,
  Search,
  X,
  BookOpen,
  FileText,
  Sparkles,
  Filter,
} from "lucide-react"
import Link from "next/link"
import { FlashcardItem, type Flashcard } from "@/components/flashcard-item"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CategoryManager, type Category } from "@/components/category-manager"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SpeechSupportWarning } from "@/components/speech-support-warning"
import { AIFlashcardHelper } from "@/components/ai-flashcard-helper"
import { FlashcardForm } from "@/components/flashcard-form"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

export default function FlashcardsPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [filteredCards, setFilteredCards] = useState<Flashcard[]>([])
  const [newWord, setNewWord] = useState("")
  const [newMeaning, setNewMeaning] = useState("")
  const [newCategoryId, setNewCategoryId] = useState<string>("none")
  const [bulkImport, setBulkImport] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOption, setSortOption] = useState<string>("newest")
  const [filterOption, setFilterOption] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [categories, setCategories] = useState<Category[]>([])
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null)
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const newWordInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSelectMode = searchParams.get("selectMode") === "true"

  // استخدام useCallback لتحسين الأداء
  const loadFlashcards = useCallback(() => {
    setIsLoading(true)
    try {
      const savedFlashcards = localStorage.getItem("flashcards")
      if (savedFlashcards) {
        const parsedCards = JSON.parse(savedFlashcards)
        const updatedCards = parsedCards.map((card: any) => {
          const { exampleSentence, ...rest } = card
          return rest
        })
        setFlashcards(updatedCards)
      }

      const savedCategories = localStorage.getItem("flashcardCategories")
      if (savedCategories) {
        setCategories(JSON.parse(savedCategories))
      }
    } catch (error) {
      console.error("Failed to load data:", error)
      toast({
        title: "خطأ في التحميل",
        description: "حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // تحميل البيانات عند تحميل الصفحة
  useEffect(() => {
    loadFlashcards()
  }, [loadFlashcards])

  // تطبيق البحث والفلترة والترتيب على البطاقات - تحسين باستخدام useMemo
  const applyFilters = useCallback(() => {
    let result = [...flashcards]

    // تطبيق البحث
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(
        (card) => card.word.toLowerCase().includes(query) || card.meaning.toLowerCase().includes(query),
      )
    }

    // تطبيق فلتر المجموعة
    if (categoryFilter !== "all") {
      if (categoryFilter === "uncategorized") {
        result = result.filter((card) => !card.categoryId)
      } else {
        result = result.filter((card) => card.categoryId === categoryFilter)
      }
    }

    // تطبيق الفلترة
    if (filterOption !== "all") {
      switch (filterOption) {
        case "new":
          result = result.filter((card) => !card.reviewCount || card.reviewCount === 0)
          break
        case "mastered":
          result = result.filter((card) => {
            if (!card.reviewCount || card.reviewCount === 0) return false
            const successRate = (card.correctCount || 0) / card.reviewCount
            return successRate >= 0.9
          })
          break
        case "learning":
          result = result.filter((card) => {
            if (!card.reviewCount || card.reviewCount === 0) return false
            const successRate = (card.correctCount || 0) / card.reviewCount
            return successRate >= 0.4 && successRate < 0.9
          })
          break
        case "needsReview":
          result = result.filter((card) => {
            if (!card.reviewCount || card.reviewCount === 0) return false
            const successRate = (card.correctCount || 0) / card.reviewCount
            return successRate < 0.4
          })
          break
      }
    }

    // تطبيق الترتيب
    switch (sortOption) {
      case "newest":
        result.sort((a, b) => b.createdAt - a.createdAt)
        break
      case "oldest":
        result.sort((a, b) => a.createdAt - b.createdAt)
        break
      case "alphabetical":
        result.sort((a, b) => a.word.localeCompare(b.word))
        break
      case "mostReviewed":
        result.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
        break
      case "leastReviewed":
        result.sort((a, b) => (a.reviewCount || 0) - (b.reviewCount || 0))
        break
      case "successRate":
        result.sort((a, b) => {
          const rateA = a.reviewCount ? (a.correctCount || 0) / a.reviewCount : 0
          const rateB = b.reviewCount ? (b.correctCount || 0) / b.reviewCount : 0
          return rateB - rateA
        })
        break
    }

    setFilteredCards(result)
  }, [flashcards, searchQuery, sortOption, filterOption, categoryFilter])

  // تطبيق الفلاتر عند تغيير أي من المعايير
  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  // حفظ البيانات عند تغييرها
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("flashcards", JSON.stringify(flashcards))
    }
  }, [flashcards, isLoading])

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("flashcardCategories", JSON.stringify(categories))
    }
  }, [categories, isLoading])

  // تحميل الكلمات المختارة من URL عند تفعيل وضع الاختيار
  useEffect(() => {
    if (isSelectMode) {
      const selectedWordsParam = searchParams.get("selected")
      if (selectedWordsParam) {
        try {
          const initialSelectedWords = decodeURIComponent(selectedWordsParam).split(",")
          setSelectedWords(initialSelectedWords)
        } catch (e) {
          console.error("Error parsing selected words from URL:", e)
        }
      }
    }
  }, [isSelectMode, searchParams])

  // إضافة بطاقة جديدة - تحسين باستخدام useCallback
  const addFlashcard = useCallback(() => {
    if (newWord.trim() === "" || newMeaning.trim() === "") {
      toast({
        title: "خطأ",
        description: "يجب إدخال الكلمة والمعنى.",
        variant: "destructive",
      })
      return
    }

    // التحقق من وجود الكلمة مسبقًا
    const isDuplicate = flashcards.some((card) => card.word.toLowerCase() === newWord.trim().toLowerCase())
    if (isDuplicate) {
      toast({
        title: "الكلمة موجودة بالفعل",
        description: "هذه الكلمة موجودة بالفعل في البطاقات التعليمية.",
        variant: "destructive",
      })
      return
    }

    const newFlashcard: Flashcard = {
      id: Date.now().toString(),
      word: newWord.trim(),
      meaning: newMeaning.trim(),
      categoryId: newCategoryId === "none" ? undefined : newCategoryId,
      createdAt: Date.now(),
      reviewCount: 0,
      correctCount: 0,
    }

    setFlashcards((prev) => [newFlashcard, ...prev])
    setNewWord("")
    setNewMeaning("")

    toast({
      title: "تم بنجاح",
      description: "تمت إضافة البطاقة بنجاح!",
      action: (
        <Button variant="outline" size="sm" onClick={() => newWordInputRef.current?.focus()}>
          إضافة أخرى
        </Button>
      ),
    })
  }, [newWord, newMeaning, newCategoryId, flashcards, toast])

  // تحديث بطاقة - تحسين باستخدام useCallback
  const updateFlashcard = useCallback(() => {
    if (!editingFlashcard) return
    if (editingFlashcard.word.trim() === "" || editingFlashcard.meaning.trim() === "") {
      toast({
        title: "خطأ",
        description: "يجب إدخال الكلمة والمعنى.",
        variant: "destructive",
      })
      return
    }

    setFlashcards((prev) => prev.map((card) => (card.id === editingFlashcard.id ? { ...editingFlashcard } : card)))
    setEditingFlashcard(null)

    toast({
      title: "تم بنجاح",
      description: "تم تحديث البطاقة بنجاح!",
    })
  }, [editingFlashcard, toast])

  // حذف بطاقة - تحسين باستخدام useCallback
  const deleteFlashcard = useCallback(
    (id: string) => {
      setFlashcards((prev) => prev.filter((card) => card.id !== id))
      toast({
        title: "تم الحذف",
        description: "تمت إزالة البطاقة بنجاح.",
      })
    },
    [toast],
  )

  // استيراد بطاقات بالجملة - تحسين باستخدام useCallback
  const handleBulkImport = useCallback(() => {
    if (!bulkImport.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال محتوى للاستيراد.",
        variant: "destructive",
      })
      return
    }

    try {
      const lines = bulkImport.trim().split(/\r?\n/)
      const newCards: Flashcard[] = []
      const duplicates: string[] = []

      toast({
        title: "جاري الاستيراد",
        description: "يتم معالجة البطاقات...",
      })

      for (const line of lines) {
        let parts = line.split("::")
        if (parts.length !== 2) {
          parts = line.split("\t")
        }

        if (parts.length === 2) {
          const word = parts[0].trim()
          const meaning = parts[1].trim()

          if (word && meaning) {
            const normalizedWord = word.toLowerCase()
            const isDuplicate = flashcards.some((card) => card.word.toLowerCase() === normalizedWord)

            if (isDuplicate) {
              duplicates.push(word)
            } else {
              newCards.push({
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                word,
                meaning,
                categoryId: newCategoryId === "none" ? undefined : newCategoryId,
                createdAt: Date.now(),
                reviewCount: 0,
                correctCount: 0,
              })
            }
          }
        }
      }

      if (newCards.length > 0) {
        setFlashcards((prev) => [...newCards, ...prev])
        setBulkImport("")

        if (duplicates.length > 0) {
          toast({
            title: "تم الاستيراد مع تجاهل التكرارات",
            description: `تم استيراد ${newCards.length} بطاقة بنجاح! تم تجاهل ${duplicates.length} كلمات مكررة.`,
          })
        } else {
          toast({
            title: "تم بنجاح",
            description: `تم استيراد ${newCards.length} بطاقة بنجاح!`,
          })
        }
      } else {
        if (duplicates.length > 0) {
          toast({
            title: "تم تجاهل جميع الكلمات",
            description: `جميع الكلمات (${duplicates.length}) موجودة بالفعل في البطاقات التعليمية.`,
            variant: "destructive",
          })
        } else {
          toast({
            title: "خطأ",
            description: "لم يتم العثور على بطاقات صالحة. استخدم التنسيق: 'كلمة :: معنى' أو 'كلمة [tab] معنى'",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل استيراد البطاقات. يرجى التحقق من التنسيق.",
        variant: "destructive",
      })
    }
  }, [bulkImport, flashcards, newCategoryId, toast])

  // تصدير البطاقات - تحسين باستخدام useCallback
  const exportFlashcards = useCallback(() => {
    if (flashcards.length === 0) {
      toast({
        title: "خطأ",
        description: "لا توجد بطاقات للتصدير.",
        variant: "destructive",
      })
      return
    }

    const cardsToExport = [...filteredCards]
    const content = cardsToExport.map((card) => `${card.word} :: ${card.meaning}`).join("\n")
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "flashcards-export.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "تم التصدير",
      description: `تم تصدير ${cardsToExport.length} بطاقة بنجاح!`,
    })
  }, [flashcards.length, filteredCards, toast])

  // مسح البحث - تحسين باستخدام useCallback
  const clearSearch = useCallback(() => {
    setSearchQuery("")
    setFilterOption("all")
    setCategoryFilter("all")
  }, [])

  // الحصول على إحصائيات الفلتر - تحسين باستخدام useMemo
  const stats = useMemo(() => {
    const total = flashcards.length
    const newCards = flashcards.filter((card) => !card.reviewCount || card.reviewCount === 0).length
    const mastered = flashcards.filter((card) => {
      if (!card.reviewCount || card.reviewCount === 0) return false
      const successRate = (card.correctCount || 0) / card.reviewCount
      return successRate >= 0.9
    }).length
    const learning = flashcards.filter((card) => {
      if (!card.reviewCount || card.reviewCount === 0) return false
      const successRate = (card.correctCount || 0) / card.reviewCount
      return successRate >= 0.4 && successRate < 0.9
    }).length
    const needsReview = flashcards.filter((card) => {
      if (!card.reviewCount || card.reviewCount === 0) return false
      const successRate = (card.correctCount || 0) / card.reviewCount
      return successRate < 0.4
    }).length

    return { total, newCards, mastered, learning, needsReview }
  }, [flashcards])

  // الحصول على إحصائيات المجموعات - تحسين باستخدام useMemo
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {}

    flashcards.forEach((card) => {
      if (card.categoryId) {
        stats[card.categoryId] = (stats[card.categoryId] || 0) + 1
      }
    })

    const uncategorized = flashcards.filter((card) => !card.categoryId).length
    if (uncategorized > 0) {
      stats["uncategorized"] = uncategorized
    }

    return stats
  }, [flashcards])

  // تعديل بطاقة - تحسين باستخدام useCallback
  const handleEditFlashcard = useCallback((flashcard: Flashcard) => {
    setEditingFlashcard({ ...flashcard })
  }, [])

  // تبديل حالة اختيار الكلمة - تحسين باستخدام useCallback
  const toggleWordSelection = useCallback((word: string) => {
    setSelectedWords((prev) => {
      if (prev.includes(word)) {
        return prev.filter((w) => w !== word)
      } else {
        return [...prev, word]
      }
    })
  }, [])

  // إرسال الكلمات المختارة إلى امتحان الفقرات - تحسين باستخدام useCallback
  const sendSelectedWordsToQuiz = useCallback(() => {
    if (selectedWords.length === 0) {
      toast({
        title: "لم يتم اختيار أي كلمات",
        description: "يرجى اختيار كلمة واحدة على الأقل للاستمرار.",
        variant: "destructive",
      })
      return
    }

    const encodedWords = encodeURIComponent(selectedWords.join(","))
    router.push(`/paragraph-quiz?words=${encodedWords}`)
  }, [selectedWords, router, toast])

  // الخروج من وضع الاختيار - تحسين باستخدام useCallback
  const exitSelectMode = useCallback(() => {
    router.push("/flashcards")
  }, [router])

  // تسجيل مراجعة البطاقة - تحسين باستخدام useCallback
  const handleReviewFlashcard = useCallback((id: string) => {
    setFlashcards((prev) =>
      prev.map((card) => {
        if (card.id === id) {
          return {
            ...card,
            reviewCount: (card.reviewCount || 0) + 1,
            lastReviewed: Date.now(),
          }
        }
        return card
      }),
    )
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center h-16 px-4 mx-auto">
          <Link href="/" className="flex items-center mr-4 hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">العودة</span>
          </Link>
          <h1 className="text-2xl font-bold">البطاقات التعليمية</h1>
          <Badge variant="outline" className="mr-3 py-1">
            {flashcards.length} {flashcards.length === 1 ? "كلمة" : "كلمات"}
          </Badge>
          <div className="flex items-center gap-2 mr-auto">
            {isSelectMode ? (
              <>
                <Badge variant="outline" className="text-sm">
                  وضع اختيار الكلمات
                </Badge>
                <Button
                  variant="default"
                  size="sm"
                  onClick={sendSelectedWordsToQuiz}
                  disabled={selectedWords.length === 0}
                  className="btn-glow"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  استخدام في امتحان الفقرات ({selectedWords.length})
                </Button>
                <Button variant="outline" size="sm" onClick={exitSelectMode}>
                  إلغاء
                </Button>
              </>
            ) : (
              <>
                <Link href="/progress">
                  <Button variant="outline" size="sm" className="gap-1 hover:bg-primary/10">
                    <BarChart className="w-4 h-4" />
                    التقدم
                  </Button>
                </Link>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1 hover:bg-primary/10">
                      <Upload className="w-4 h-4" />
                      استيراد
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>استيراد البطاقات بالجملة</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-200 dark:border-amber-800">
                        <p className="text-sm text-amber-800 dark:text-amber-300">
                          أدخل بطاقة واحدة في كل سطر بالتنسيق: <br />
                          <code className="bg-white/50 dark:bg-black/20 px-1 py-0.5 rounded">كلمة :: معنى</code> أو{" "}
                          <code className="bg-white/50 dark:bg-black/20 px-1 py-0.5 rounded">كلمة [tab] معنى</code>
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>المجموعة (اختياري)</Label>
                        <Select value={newCategoryId} onValueChange={setNewCategoryId}>
                          <SelectTrigger>
                            <SelectValue placeholder="بدون مجموعة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">بدون مجموعة</SelectItem>
                            {categories &&
                              categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <ScrollArea className="h-72">
                        <Textarea
                          placeholder="apple :: فاكهة تنمو على الأشجار
book [tab] كتاب مطبوع أو مكتوب"
                          value={bulkImport}
                          onChange={(e) => setBulkImport(e.target.value)}
                          rows={10}
                          className="min-h-[200px]"
                        />
                      </ScrollArea>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">إلغاء</Button>
                      </DialogClose>
                      <Button onClick={handleBulkImport} className="btn-primary-gradient">
                        استيراد
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" className="gap-1 hover:bg-primary/10" onClick={exportFlashcards}>
                  <Download className="w-4 h-4" />
                  تصدير
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 mx-auto">
        <Tabs defaultValue="view" className="max-w-5xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="view" className="text-base py-3">
              عرض البطاقات
            </TabsTrigger>
            <TabsTrigger value="create" className="text-base py-3" disabled={isSelectMode}>
              إنشاء جديد
            </TabsTrigger>
            <TabsTrigger value="categories" className="text-base py-3" disabled={isSelectMode}>
              المجموعات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="mt-2">
            <SpeechSupportWarning />
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : flashcards.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="p-12 text-center border rounded-lg bg-muted/30"
              >
                <div className="flex justify-center mb-4">
                  <BookOpen className="w-16 h-16 text-muted-foreground/60" />
                </div>
                <h3 className="text-xl font-bold mb-2">لا توجد بطاقات بعد</h3>
                <p className="text-muted-foreground mb-6">
                  قم بإنشاء أول بطاقة تعليمية للبدء في رحلة تعلم اللغة الإنجليزية!
                </p>
                <Button
                  className="btn-primary-gradient"
                  onClick={() => document.querySelector('[data-value="create"]')?.click()}
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء بطاقة
                </Button>
              </motion.div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={filterOption === "all" ? "default" : "outline"}
                      className="cursor-pointer py-1 px-3"
                      onClick={() => setFilterOption("all")}
                    >
                      الكل ({stats.total})
                    </Badge>
                    <Badge
                      variant={filterOption === "new" ? "default" : "outline"}
                      className="cursor-pointer py-1 px-3"
                      onClick={() => setFilterOption("new")}
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                      جديدة ({stats.newCards})
                    </Badge>
                    <Badge
                      variant={filterOption === "mastered" ? "default" : "outline"}
                      className="cursor-pointer py-1 px-3"
                      onClick={() => setFilterOption("mastered")}
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                      متقن ({stats.mastered})
                    </Badge>
                    <Badge
                      variant={filterOption === "learning" ? "default" : "outline"}
                      className="cursor-pointer py-1 px-3"
                      onClick={() => setFilterOption("learning")}
                    >
                      <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div>
                      قيد التعلم ({stats.learning})
                    </Badge>
                    <Badge
                      variant={filterOption === "needsReview" ? "default" : "outline"}
                      className="cursor-pointer py-1 px-3"
                      onClick={() => setFilterOption("needsReview")}
                    >
                      <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                      تحتاج مراجعة ({stats.needsReview})
                    </Badge>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="بحث عن كلمة أو معنى..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value)
                          if (e.target.value === "") {
                            clearSearch()
                          }
                        }}
                        className="pl-10 pr-10 input-focus-effect"
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 hover:bg-gray-200 dark:hover:bg-gray-700"
                          onClick={() => {
                            clearSearch()
                            setSearchQuery("")
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {searchQuery && (
                      <Button variant="outline" className="gap-1 self-start" onClick={clearSearch}>
                        <X className="h-4 w-4" />
                        مسح البحث
                      </Button>
                    )}

                    <Button variant="outline" className="gap-2" onClick={() => setShowFilters(!showFilters)}>
                      <Filter className="h-4 w-4" />
                      <span className="hidden sm:inline">الفلاتر</span>
                    </Button>

                    <AnimatePresence>
                      {showFilters && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="absolute top-full right-0 mt-2 z-10 bg-card border rounded-md shadow-lg p-4 w-72"
                        >
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>المجموعة:</Label>
                              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger>
                                  <SelectValue placeholder="جميع المجموعات" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">جميع المجموعات</SelectItem>
                                  <SelectItem value="uncategorized">بدون مجموعة</SelectItem>
                                  {categories &&
                                    categories.map((category) => (
                                      <SelectItem key={category.id} value={category.id}>
                                        <div className="flex items-center gap-2">
                                          <div className={`w-2 h-2 rounded-full ${category.color}`}></div>
                                          <span>{category.name}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>ترتيب:</Label>
                              <Select value={sortOption} onValueChange={setSortOption}>
                                <SelectTrigger>
                                  <SelectValue placeholder="الأحدث أولاً" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="newest">الأحدث أولاً</SelectItem>
                                  <SelectItem value="oldest">الأقدم أولاً</SelectItem>
                                  <SelectItem value="alphabetical">أبجدياً</SelectItem>
                                  <SelectItem value="mostReviewed">الأكثر مراجعة</SelectItem>
                                  <SelectItem value="leastReviewed">الأقل مراجعة</SelectItem>
                                  <SelectItem value="successRate">نسبة النجاح</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {filteredCards.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="p-8 text-center border rounded-lg bg-muted/30"
                  >
                    <p className="text-muted-foreground">لا توجد بطاقات تطابق معايير البحث أو التصفية.</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSearchQuery("")
                        setFilterOption("all")
                        setCategoryFilter("all")
                      }}
                    >
                      إعادة ضبط البحث والتصفية
                    </Button>
                  </motion.div>
                ) : (
                  <div className="responsive-grid">
                    <AnimatePresence>
                      {filteredCards.map((card) => (
                        <FlashcardItem
                          key={card.id}
                          flashcard={card}
                          categories={categories || []}
                          onDelete={() => deleteFlashcard(card.id)}
                          onEdit={handleEditFlashcard}
                          isSelectMode={isSelectMode}
                          isSelected={isSelectMode ? selectedWords.includes(card.word) : false}
                          onToggleSelect={toggleWordSelection}
                          onReview={handleReviewFlashcard}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="create" className="mt-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <FlashcardForm
                categories={categories || []}
                existingFlashcards={flashcards}
                onAddFlashcard={(newCard) => {
                  const flashcard: Flashcard = {
                    id: Date.now().toString(),
                    createdAt: Date.now(),
                    reviewCount: 0,
                    correctCount: 0,
                    ...newCard,
                  }
                  setFlashcards([flashcard, ...flashcards])
                  toast({
                    title: "تم بنجاح",
                    description: "تمت إضافة البطاقة بنجاح!",
                  })
                }}
                editingFlashcard={editingFlashcard}
                onUpdateFlashcard={(updatedCard) => {
                  const updatedFlashcards = flashcards.map((card) => (card.id === updatedCard.id ? updatedCard : card))
                  setFlashcards(updatedFlashcards)
                  setEditingFlashcard(null)
                  toast({
                    title: "تم بنجاح",
                    description: "تم تحديث البطاقة بنجاح!",
                  })
                }}
                onCancelEdit={() => setEditingFlashcard(null)}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="categories" className="mt-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card className="card-gradient card-shine">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    إدارة المجموعات
                  </CardTitle>
                  <CardDescription>قم بإنشاء وتعديل وحذف مجموعات البطاقات التعليمية</CardDescription>
                </CardHeader>
                <CardContent>
                  <CategoryManager
                    categories={categories || []}
                    onCategoriesChange={setCategories}
                    flashcardCount={categoryStats}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialog for editing flashcard */}
      <Dialog open={!!editingFlashcard} onOpenChange={(open) => !open && setEditingFlashcard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل البطاقة التعليمية</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-word">الكلمة الإنجليزية</Label>
              <Input
                id="edit-word"
                value={editingFlashcard?.word || ""}
                onChange={(e) =>
                  setEditingFlashcard(editingFlashcard ? { ...editingFlashcard, word: e.target.value } : null)
                }
                className="input-focus-effect"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-meaning">المعنى</Label>
              <Textarea
                id="edit-meaning"
                value={editingFlashcard?.meaning || ""}
                onChange={(e) =>
                  setEditingFlashcard(editingFlashcard ? { ...editingFlashcard, meaning: e.target.value } : null)
                }
                className="input-focus-effect"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">المجموعة</Label>
              <Select
                value={editingFlashcard?.categoryId || "none"}
                onValueChange={(value) =>
                  setEditingFlashcard(
                    editingFlashcard
                      ? {
                          ...editingFlashcard,
                          categoryId: value === "none" ? undefined : value,
                        }
                      : null,
                  )
                }
              >
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="بدون مجموعة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون مجموعة</SelectItem>
                  {categories &&
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${category.color}`}></div>
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFlashcard(null)}>
              إلغاء
            </Button>
            <Button onClick={updateFlashcard} className="btn-primary-gradient">
              تحديث
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {flashcards.length > 0 && <AIFlashcardHelper />}
    </div>
  )
}
