"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Loader2, X, RefreshCw, BookOpen, Save, Bookmark, Share2, Copy } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"

// تعريف أنواع البيانات
interface Flashcard {
  id: string
  word: string
  meaning: string
  categoryId?: string
  createdAt: number
  reviewCount?: number
  correctCount?: number
  lastReviewed?: number
}

interface ParagraphQuizState {
  isLoading: boolean
  isGenerating: boolean
  isEvaluating: boolean
  selectedWords: string[]
  arabicParagraph: string
  userTranslation: string
  feedback: {
    score: number
    corrections: string[]
    suggestions: string[]
    modelParagraph: string
  } | null
  wordInput: string
  availableWords: Flashcard[]
  quizStarted: boolean
  quizCompleted: boolean
  savedParagraphs: SavedParagraph[]
  difficultyLevel: "easy" | "medium" | "hard"
}

interface SavedParagraph {
  id: string
  arabicText: string
  englishTranslation?: string
  words: string[]
  createdAt: number
  score?: number
}

export default function ParagraphQuizPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [state, setState] = useState<ParagraphQuizState>({
    isLoading: true,
    isGenerating: false,
    isEvaluating: false,
    selectedWords: [],
    arabicParagraph: "",
    userTranslation: "",
    feedback: null,
    wordInput: "",
    availableWords: [],
    quizStarted: false,
    quizCompleted: false,
    savedParagraphs: [],
    difficultyLevel: "medium",
  })

  // استخدام useState للتحقق من تحميل البيانات مرة واحدة فقط
  const [initialWordsLoaded, setInitialWordsLoaded] = useState(false)
  const [initialParagraphsLoaded, setInitialParagraphsLoaded] = useState(false)

  // تحميل البطاقات عند تحميل الصفحة - تم تعديل هذه الدالة لتجنب التحديثات المتكررة
  const loadFlashcards = useCallback(() => {
    if (initialWordsLoaded) return

    try {
      // محاولة استرداد البطاقات من التخزين المحلي
      const storedFlashcards = localStorage.getItem("flashcards")
      if (!storedFlashcards) {
        setState((prev) => ({ ...prev, isLoading: false, availableWords: [] }))
        setInitialWordsLoaded(true)
        return
      }

      const flashcards: Flashcard[] = JSON.parse(storedFlashcards)

      // التحقق من وجود كلمات مختارة في عنوان URL
      const selectedWordsParam = searchParams.get("words")
      let initialSelectedWords: string[] = []

      if (selectedWordsParam) {
        try {
          // فك تشفير الكلمات المختارة من URL
          initialSelectedWords = decodeURIComponent(selectedWordsParam).split(",")

          // التحقق من صحة الكلمات
          initialSelectedWords = initialSelectedWords.filter((word) => flashcards.some((card) => card.word === word))

          // إظهار رسالة تأكيد
          if (initialSelectedWords.length > 0) {
            toast({
              title: "تم استيراد الكلمات",
              description: `تم استيراد ${initialSelectedWords.length} كلمات من البطاقات التعليمية.`,
              variant: "default",
            })
          }
        } catch (e) {
          console.error("Error parsing selected words from URL:", e)
        }
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        availableWords: flashcards,
        selectedWords: initialSelectedWords,
      }))

      setInitialWordsLoaded(true)
    } catch (error) {
      console.error("Error loading flashcards:", error)
      toast({
        title: "خطأ في تحميل البطاقات",
        description: "حدث خطأ أثناء محاولة تحميل البطاقات التعليمية.",
        variant: "destructive",
      })
      setState((prev) => ({ ...prev, isLoading: false }))
      setInitialWordsLoaded(true)
    }
  }, [searchParams, toast, initialWordsLoaded])

  // تحميل الفقرات المحفوظة
  const loadSavedParagraphs = useCallback(() => {
    if (initialParagraphsLoaded) return

    try {
      const storedParagraphs = localStorage.getItem("savedParagraphs")
      if (storedParagraphs) {
        const paragraphs: SavedParagraph[] = JSON.parse(storedParagraphs)
        setState((prev) => ({ ...prev, savedParagraphs: paragraphs }))
      }
      setInitialParagraphsLoaded(true)
    } catch (error) {
      console.error("Error loading saved paragraphs:", error)
      setInitialParagraphsLoaded(true)
    }
  }, [initialParagraphsLoaded])

  // استخدام useEffect مع مصفوفة تبعيات محدودة
  useEffect(() => {
    loadFlashcards()
    loadSavedParagraphs()
  }, [loadFlashcards, loadSavedParagraphs])

  // إضافة كلمة إلى القائمة المختارة
  const addWord = () => {
    if (!state.wordInput.trim()) return

    if (state.selectedWords.includes(state.wordInput.trim())) {
      toast({
        title: "الكلمة موجودة بالفعل",
        description: "هذه الكلمة موجودة بالفعل في قائمة الكلمات المختارة.",
        variant: "destructive",
      })
      return
    }

    setState((prev) => ({
      ...prev,
      selectedWords: [...prev.selectedWords, prev.wordInput.trim()],
      wordInput: "",
    }))
  }

  // إزالة كلمة من القائمة المختارة
  const removeWord = (word: string) => {
    setState((prev) => ({
      ...prev,
      selectedWords: prev.selectedWords.filter((w) => w !== word),
    }))
  }

  // اختيار كلمات عشوائية
  const selectRandomWords = (count = 5) => {
    const availableWords = state.availableWords

    // إذا لم تكن هناك كلمات كافية، استخدم كل الكلمات المتاحة
    if (availableWords.length <= count) {
      setState((prev) => ({
        ...prev,
        selectedWords: availableWords.map((card) => card.word),
      }))
      return
    }

    // اختيار كلمات عشوائية
    const randomWords: string[] = []
    const wordsCopy = [...availableWords]

    for (let i = 0; i < count; i++) {
      if (wordsCopy.length === 0) break

      const randomIndex = Math.floor(Math.random() * wordsCopy.length)
      randomWords.push(wordsCopy[randomIndex].word)
      wordsCopy.splice(randomIndex, 1)
    }

    setState((prev) => ({
      ...prev,
      selectedWords: randomWords,
    }))
  }

  // حفظ الكلمات الجديدة إلى البطاقات التعليمية
  const saveNewWords = () => {
    if (!state.selectedWords.length) {
      toast({
        title: "لا توجد كلمات للحفظ",
        description: "يرجى اختيار كلمات أولاً قبل محاولة الحفظ.",
        variant: "destructive",
      })
      return
    }

    try {
      // الحصول على البطاقات الحالية
      const storedFlashcards = localStorage.getItem("flashcards")
      const existingFlashcards: Flashcard[] = storedFlashcards ? JSON.parse(storedFlashcards) : []

      // تحديد الكلمات الجديدة التي لم يتم حفظها بعد
      const existingWords = existingFlashcards.map((card) => card.word.toLowerCase())
      const newWords = state.selectedWords.filter((word) => !existingWords.includes(word.toLowerCase()))

      if (newWords.length === 0) {
        toast({
          title: "جميع الكلمات محفوظة بالفعل",
          description: "جميع الكلمات المحددة موجودة بالفعل في البطاقات التعليمية.",
          variant: "default",
        })
        return
      }

      // إنشاء بطاقات جديدة للكلمات الجديدة
      const newFlashcards: Flashcard[] = newWords.map((word) => ({
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        word,
        meaning: "", // يمكن للمستخدم إضافة المعنى لاحقًا
        createdAt: Date.now(),
        reviewCount: 0,
        correctCount: 0,
      }))

      // حفظ البطاقات المحدثة
      const updatedFlashcards = [...existingFlashcards, ...newFlashcards]
      localStorage.setItem("flashcards", JSON.stringify(updatedFlashcards))

      toast({
        title: "تم الحفظ بنجاح",
        description: `تم حفظ ${newFlashcards.length} كلمات جديدة إلى البطاقات التعليمية.`,
        variant: "success",
      })
    } catch (error) {
      console.error("Error saving new words:", error)
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء محاولة حفظ الكلمات الجديدة.",
        variant: "destructive",
      })
    }
  }

  // حفظ الفقرة الحالية
  const saveParagraph = () => {
    if (!state.arabicParagraph) {
      toast({
        title: "لا توجد فقرة للحفظ",
        description: "يرجى توليد فقرة أولاً قبل محاولة الحفظ.",
        variant: "destructive",
      })
      return
    }

    try {
      const newParagraph: SavedParagraph = {
        id: Date.now().toString(),
        arabicText: state.arabicParagraph,
        englishTranslation: state.userTranslation || undefined,
        words: state.selectedWords,
        createdAt: Date.now(),
        score: state.feedback?.score,
      }

      const updatedParagraphs = [...state.savedParagraphs, newParagraph]
      localStorage.setItem("savedParagraphs", JSON.stringify(updatedParagraphs))

      setState((prev) => ({
        ...prev,
        savedParagraphs: updatedParagraphs,
      }))

      toast({
        title: "تم حفظ الفقرة",
        description: "تم حفظ الفقرة بنجاح ويمكنك الوصول إليها لاحقًا.",
        variant: "success",
      })
    } catch (error) {
      console.error("Error saving paragraph:", error)
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء محاولة حفظ الفقرة.",
        variant: "destructive",
      })
    }
  }

  // مشاركة الفقرة الحالية
  const shareParagraph = () => {
    if (!state.arabicParagraph) {
      toast({
        title: "لا توجد فقرة للمشاركة",
        description: "يرجى توليد فقرة أولاً قبل محاولة المشاركة.",
        variant: "destructive",
      })
      return
    }

    try {
      // إنشاء نص المشاركة
      const shareText = `
🔤 تمرين ترجمة:

${state.arabicParagraph}

🔠 الكلمات: ${state.selectedWords.join(", ")}

#تعلم_الإنجليزية #LinguaLearn
      `.trim()

      // نسخ النص إلى الحافظة
      navigator.clipboard.writeText(shareText)

      toast({
        title: "تم نسخ الفقرة",
        description: "تم نسخ الفقرة إلى الحافظة ويمكنك مشاركتها الآن.",
        variant: "success",
      })
    } catch (error) {
      console.error("Error sharing paragraph:", error)
      toast({
        title: "خطأ في المشاركة",
        description: "حدث خطأ أثناء محاولة مشاركة الفقرة.",
        variant: "destructive",
      })
    }
  }

  // توليد فقرة عربية باستخدام الكلمات المختارة
  const generateArabicParagraph = async () => {
    if (state.selectedWords.length < 3) {
      toast({
        title: "عدد الكلمات غير كافٍ",
        description: "يرجى اختيار 3 كلمات على الأقل لتوليد فقرة.",
        variant: "destructive",
      })
      return
    }

    setState((prev) => ({ ...prev, isGenerating: true, arabicParagraph: "" }))

    try {
      // الحصول على ترجمات الكلمات المختارة
      const wordTranslations = state.selectedWords.map((word) => {
        const flashcard = state.availableWords.find((card) => card.word === word)
        return {
          word,
          translation: flashcard?.meaning || word,
        }
      })

      console.log("Generating paragraph with words:", wordTranslations)

      // استخدام API لتوليد فقرة عربية
      const response = await fetch("/api/generate-paragraph", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          words: wordTranslations,
          language: "arabic",
          fullArabic: true,
          difficultyLevel: state.difficultyLevel,
        }),
      })

      if (!response.ok) {
        throw new Error("فشل في توليد الفقرة")
      }

      const data = await response.json()
      console.log("Generated paragraph:", data.paragraph)

      setState((prev) => ({
        ...prev,
        arabicParagraph: data.paragraph,
        quizStarted: true,
        isGenerating: false,
      }))
    } catch (error) {
      console.error("Error generating paragraph:", error)

      // في حالة الفشل، قم بإنشاء فقرة بسيطة
      const simpleArabicParagraph = generateSimpleParagraph(state.selectedWords)
      console.log("Generated simple paragraph:", simpleArabicParagraph)

      setState((prev) => ({
        ...prev,
        arabicParagraph: simpleArabicParagraph,
        quizStarted: true,
        isGenerating: false,
      }))

      toast({
        title: "تم إنشاء فقرة بسيطة",
        description: "لم نتمكن من الاتصال بالخادم، لذا قمنا بإنشاء فقرة بسيطة.",
        variant: "default",
      })
    }
  }

  // توليد فقرة بسيطة في حالة عدم الاتصال بالإنترنت
  const generateSimpleParagraph = (words: string[]): string => {
    // الحصول على ترجمات الكلمات
    const translations = words.map((word) => {
      const flashcard = state.availableWords.find((card) => card.word === word)
      return flashcard?.meaning || word
    })

    // إنشاء فقرة بسيطة تستخدم جميع الكلمات
    return `في هذا التمرين، سنتعلم استخدام الكلمات التالية: ${translations.join("، ")}. 
    حاول كتابة فقرة باللغة الإنجليزية تستخدم هذه الكلمات بشكل صحيح في سياق مناسب. 
    تذكر أن تراعي قواعد اللغة الإنجليزية وترتيب الكلمات المناسب.`
  }

  // تقييم ترجمة المستخدم
  const evaluateTranslation = async () => {
    if (!state.userTranslation.trim()) {
      toast({
        title: "الترجمة فارغة",
        description: "يرجى كتابة ترجمتك قبل التقييم.",
        variant: "destructive",
      })
      return
    }

    setState((prev) => ({ ...prev, isEvaluating: true }))

    try {
      // استخدام API لتقييم الترجمة
      const response = await fetch("/api/evaluate-translation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          arabicText: state.arabicParagraph,
          englishTranslation: state.userTranslation,
          words: state.selectedWords,
          difficultyLevel: state.difficultyLevel,
        }),
      })

      if (!response.ok) {
        throw new Error("فشل في تقييم الترجمة")
      }

      const data = await response.json()

      setState((prev) => ({
        ...prev,
        feedback: data,
        quizCompleted: true,
        isEvaluating: false,
      }))
    } catch (error) {
      console.error("Error evaluating translation:", error)

      // في حالة الفشل، قم بإنشاء تقييم بسيط
      const simpleFeedback = {
        score: 70,
        corrections: ["تأكد من استخدام جميع الكلمات المطلوبة في ترجمتك."],
        suggestions: [
          "حاول استخدام جمل أكثر تنوعًا.",
          "تأكد من صحة القواعد النحوية.",
          "انتبه إلى ترتيب الكلمات في الجملة الإنجليزية.",
        ],
        modelParagraph: generateSimpleModelParagraph(state.selectedWords),
      }

      setState((prev) => ({
        ...prev,
        feedback: simpleFeedback,
        quizCompleted: true,
        isEvaluating: false,
      }))

      toast({
        title: "تم إنشاء تقييم بسيط",
        description: "لم نتمكن من الاتصال بالخادم، لذا قمنا بإنشاء تقييم بسيط.",
        variant: "default",
      })
    }
  }

  // توليد فقرة نموذجية بسيطة في حالة عدم الاتصال بالإنترنت
  const generateSimpleModelParagraph = (words: string[]): string => {
    return `In this exercise, we are learning to use the following words: ${words.join(", ")}. 
    These words are important for expanding our vocabulary and improving our language skills. 
    Practice using these words in different contexts to better understand their meanings and usage.`
  }

  // إعادة تعيين الامتحان
  const resetQuiz = () => {
    setState((prev) => ({
      ...prev,
      selectedWords: [],
      arabicParagraph: "",
      userTranslation: "",
      feedback: null,
      quizStarted: false,
      quizCompleted: false,
    }))
  }

  // توليد فقرة عشوائية بكلمات جديدة
  const generateRandomParagraph = async () => {
    setState((prev) => ({ ...prev, isGenerating: true, arabicParagraph: "" }))

    try {
      // استخدام API لتوليد فقرة عربية بكلمات عشوائية جديدة
      const response = await fetch("/api/generate-paragraph", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          randomWords: true,
          language: "arabic",
          fullArabic: true,
          excludeWords: state.availableWords.map((card) => card.word),
          difficultyLevel: state.difficultyLevel,
        }),
      })

      if (!response.ok) {
        throw new Error("فشل في توليد الفقرة العشوائية")
      }

      const data = await response.json()

      setState((prev) => ({
        ...prev,
        arabicParagraph: data.paragraph,
        selectedWords: data.usedWords || [],
        quizStarted: true,
        isGenerating: false,
      }))
    } catch (error) {
      console.error("Error generating random paragraph:", error)

      toast({
        title: "خطأ في توليد الفقرة",
        description: "حدث خطأ أثناء محاولة توليد فقرة عشوائية.",
        variant: "destructive",
      })

      setState((prev) => ({ ...prev, isGenerating: false }))
    }
  }

  // تغيير مستوى الصعوبة
  const changeDifficultyLevel = (level: "easy" | "medium" | "hard") => {
    setState((prev) => ({ ...prev, difficultyLevel: level }))

    toast({
      title: `تم تغيير مستوى الصعوبة إلى ${level === "easy" ? "سهل" : level === "medium" ? "متوسط" : "صعب"}`,
      description: "سيتم تطبيق المستوى الجديد عند توليد الفقرة التالية.",
      variant: "default",
    })
  }

  // نسخ الفقرة العربية
  const copyArabicParagraph = () => {
    if (!state.arabicParagraph) return

    navigator.clipboard.writeText(state.arabicParagraph)
    toast({
      title: "تم النسخ",
      description: "تم نسخ الفقرة العربية إلى الحافظة.",
      variant: "success",
    })
  }

  // نسخ الترجمة الإنجليزية
  const copyEnglishTranslation = () => {
    if (!state.userTranslation) return

    navigator.clipboard.writeText(state.userTranslation)
    toast({
      title: "تم النسخ",
      description: "تم نسخ الترجمة الإنجليزية إلى الحافظة.",
      variant: "success",
    })
  }

  // تصفية الكلمات المتاحة حسب البحث
  const filteredWords = useMemo(() => {
    if (!state.wordInput.trim()) return []

    return state.availableWords
      .filter(
        (card) =>
          card.word.toLowerCase().includes(state.wordInput.toLowerCase()) ||
          (card.meaning && card.meaning.toLowerCase().includes(state.wordInput.toLowerCase())),
      )
      .slice(0, 5)
  }, [state.wordInput, state.availableWords])

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">امتحان الفقرات</h1>
        <Link href="/">
          <Button variant="outline" size="sm">
            <X className="h-4 w-4 mr-2" />
            خروج
          </Button>
        </Link>
      </div>

      {state.isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="mr-2">جاري التحميل...</span>
        </div>
      ) : state.availableWords.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>لا توجد بطاقات تعليمية</CardTitle>
            <CardDescription>يجب إضافة بطاقات تعليمية أولاً قبل بدء امتحان الفقرات.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/flashcards" className="w-full">
              <Button className="w-full">إضافة بطاقات تعليمية</Button>
            </Link>
          </CardFooter>
        </Card>
      ) : !state.quizStarted ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle>اختيار الكلمات</CardTitle>
              <CardDescription>اختر الكلمات التي تريد استخدامها في الفقرة أو اختر كلمات عشوائية.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-4">
                <Button
                  onClick={generateRandomParagraph}
                  variant="secondary"
                  className="w-full"
                  disabled={state.isGenerating}
                >
                  {state.isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      جاري توليد فقرة عشوائية...
                    </>
                  ) : (
                    "توليد فقرة عشوائية بكلمات جديدة للتعلم"
                  )}
                </Button>

                <Link href="/flashcards?selectMode=true" className="w-full">
                  <Button variant="outline" className="w-full">
                    <BookOpen className="mr-2 h-4 w-4" />
                    اختيار كلمات من البطاقات التعليمية
                  </Button>
                </Link>
              </div>

              <Separator className="my-4" />

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => selectRandomWords(5)} variant="outline" size="sm">
                  5 كلمات عشوائية
                </Button>
                <Button onClick={() => selectRandomWords(8)} variant="outline" size="sm">
                  8 كلمات عشوائية
                </Button>
                <Button onClick={() => selectRandomWords(10)} variant="outline" size="sm">
                  10 كلمات عشوائية
                </Button>
              </div>

              <Separator className="my-4" />

              <div className="flex flex-col space-y-2">
                <label htmlFor="word-input" className="text-sm font-medium">
                  أضف كلمات يدويًا:
                </label>
                <div className="flex space-x-2 rtl:space-x-reverse">
                  <div className="relative w-full">
                    <Input
                      id="word-input"
                      value={state.wordInput}
                      onChange={(e) => setState((prev) => ({ ...prev, wordInput: e.target.value }))}
                      placeholder="أدخل كلمة"
                      onKeyDown={(e) => e.key === "Enter" && addWord()}
                      className="w-full"
                    />
                    {filteredWords.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
                        {filteredWords.map((card) => (
                          <div
                            key={card.id}
                            className="px-3 py-2 hover:bg-muted cursor-pointer flex justify-between"
                            onClick={() => {
                              setState((prev) => ({
                                ...prev,
                                wordInput: "",
                                selectedWords: [...prev.selectedWords, card.word],
                              }))
                            }}
                          >
                            <span>{card.word}</span>
                            {card.meaning && <span className="text-muted-foreground">{card.meaning}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button onClick={addWord} type="button">
                    إضافة
                  </Button>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">الكلمات المختارة:</h3>
                <div className="flex flex-wrap gap-2">
                  {state.selectedWords.length > 0 ? (
                    state.selectedWords.map((word) => (
                      <Badge key={word} variant="secondary" className="flex items-center gap-1">
                        {word}
                        <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => removeWord(word)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">لم يتم اختيار أي كلمات بعد.</p>
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <h3 className="text-sm font-medium">مستوى الصعوبة:</h3>
                <div className="flex space-x-2 rtl:space-x-reverse">
                  <Button
                    variant={state.difficultyLevel === "easy" ? "default" : "outline"}
                    size="sm"
                    onClick={() => changeDifficultyLevel("easy")}
                  >
                    سهل
                  </Button>
                  <Button
                    variant={state.difficultyLevel === "medium" ? "default" : "outline"}
                    size="sm"
                    onClick={() => changeDifficultyLevel("medium")}
                  >
                    متوسط
                  </Button>
                  <Button
                    variant={state.difficultyLevel === "hard" ? "default" : "outline"}
                    size="sm"
                    onClick={() => changeDifficultyLevel("hard")}
                  >
                    صعب
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                onClick={generateArabicParagraph}
                disabled={state.selectedWords.length < 3 || state.isGenerating}
                className="w-full"
              >
                {state.isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري توليد الفقرة...
                  </>
                ) : (
                  "بدء الامتحان"
                )}
              </Button>
              {state.selectedWords.length > 0 && (
                <Button onClick={saveNewWords} variant="outline" className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  حفظ الكلمات إلى البطاقات التعليمية
                </Button>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      ) : !state.quizCompleted ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle>ترجمة الفقرة</CardTitle>
              <CardDescription>
                اقرأ الفقرة العربية التالية وقم بترجمتها إلى اللغة الإنجليزية. تأكد من استخدام جميع الكلمات المختارة
                بشكل صحيح.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-md relative">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium">الفقرة العربية:</h3>
                  <Button variant="ghost" size="sm" onClick={copyArabicParagraph}>
                    <Copy className="h-4 w-4 mr-1" />
                    نسخ
                  </Button>
                </div>
                <AnimatePresence>
                  {state.isGenerating ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[90%]" />
                      <Skeleton className="h-4 w-[80%]" />
                    </div>
                  ) : (
                    <motion.p
                      className="paragraph-arabic font-medium text-base"
                      dir="rtl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      {state.arabicParagraph || "سيظهر هنا النص العربي بعد توليد الفقرة"}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="translation-input" className="text-sm font-medium">
                    ترجمتك باللغة الإنجليزية:
                  </label>
                  {state.userTranslation && (
                    <Button variant="ghost" size="sm" onClick={copyEnglishTranslation}>
                      <Copy className="h-4 w-4 mr-1" />
                      نسخ
                    </Button>
                  )}
                </div>
                <Textarea
                  id="translation-input"
                  value={state.userTranslation}
                  onChange={(e) => setState((prev) => ({ ...prev, userTranslation: e.target.value }))}
                  placeholder="اكتب ترجمتك هنا..."
                  rows={6}
                  dir="ltr"
                  className="font-roboto"
                />
              </div>

              <div className="bg-muted p-4 rounded-md">
                <h3 className="text-sm font-medium mb-2">الكلمات المطلوب استخدامها:</h3>
                <div className="flex flex-wrap gap-2">
                  {state.selectedWords.map((word) => (
                    <Badge key={word} variant="secondary">
                      {word}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                onClick={evaluateTranslation}
                disabled={!state.userTranslation.trim() || state.isEvaluating}
                className="w-full"
              >
                {state.isEvaluating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري تقييم الترجمة...
                  </>
                ) : (
                  "تقييم الترجمة"
                )}
              </Button>
              <div className="flex gap-2 w-full">
                <Button onClick={saveParagraph} variant="outline" className="flex-1">
                  <Bookmark className="mr-2 h-4 w-4" />
                  حفظ الفقرة
                </Button>
                <Button onClick={shareParagraph} variant="outline" className="flex-1">
                  <Share2 className="mr-2 h-4 w-4" />
                  مشاركة
                </Button>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle>نتيجة التقييم</CardTitle>
              <CardDescription>إليك تقييم ترجمتك والنصائح لتحسينها.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">الدرجة:</h3>
                <Badge
                  variant={state.feedback?.score && state.feedback.score >= 80 ? "success" : "secondary"}
                  className="text-lg px-3 py-1"
                >
                  {state.feedback?.score || 0}%
                </Badge>
              </div>

              <Tabs defaultValue="feedback" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="feedback">التصحيحات</TabsTrigger>
                  <TabsTrigger value="suggestions">النصائح</TabsTrigger>
                  <TabsTrigger value="model">النموذج</TabsTrigger>
                </TabsList>

                <TabsContent value="feedback" className="space-y-4">
                  <div className="bg-muted p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2">ترجمتك:</h3>
                    <p dir="ltr" className="text-left font-roboto">
                      {state.userTranslation}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">التصحيحات:</h3>
                    {state.feedback?.corrections && state.feedback.corrections.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {state.feedback.corrections.map((correction, index) => (
                          <li key={index}>{correction}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">لا توجد تصحيحات مهمة.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="suggestions" className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">نصائح للتحسين:</h3>
                    {state.feedback?.suggestions && state.feedback.suggestions.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {state.feedback.suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">لا توجد نصائح إضافية.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="model" className="space-y-4">
                  <div className="bg-muted p-4 rounded-md">
                    <h3 className="text-sm font-medium mb-2">الفقرة النموذجية:</h3>
                    <p dir="ltr" className="text-left font-roboto">
                      {state.feedback?.modelParagraph}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button onClick={resetQuiz} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                امتحان جديد
              </Button>
              <div className="flex gap-2 w-full">
                <Button onClick={saveParagraph} variant="outline" className="flex-1">
                  <Bookmark className="mr-2 h-4 w-4" />
                  حفظ الفقرة
                </Button>
                <Button onClick={shareParagraph} variant="outline" className="flex-1">
                  <Share2 className="mr-2 h-4 w-4" />
                  مشاركة
                </Button>
              </div>
              <Link href="/" className="w-full">
                <Button variant="outline" className="w-full">
                  العودة للصفحة الرئيسية
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
