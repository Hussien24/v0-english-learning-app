"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Calendar, CheckCircle, XCircle, Trophy, Clock, Sparkles } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { PronunciationButton } from "@/components/pronunciation-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Celebration } from "@/components/celebration"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Flashcard } from "@/components/flashcard-item"
import type { Category } from "@/components/category-manager"

interface DailyQuizState {
  lastQuizDate: string
  completed: boolean
  streak: number
  longestStreak: number
  history: {
    date: string
    score: number
    totalCards: number
    quizType: string
  }[]
}

interface SentenceQuizQuestion {
  id: string
  word: string
  sentence: string
  options: string[]
  correctIndex: number
}

export default function DailyQuizPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizFinished, setQuizFinished] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [quizCards, setQuizCards] = useState<Flashcard[]>([])
  const [results, setResults] = useState<{ card: Flashcard; correct: boolean }[]>([])
  const [showCelebration, setShowCelebration] = useState(false)
  const [quizState, setQuizState] = useState<DailyQuizState>({
    lastQuizDate: "",
    completed: false,
    streak: 0,
    longestStreak: 0,
    history: [],
  })
  const [quizType, setQuizType] = useState<"standard" | "sentence" | "custom">("standard")
  const [quizSize, setQuizSize] = useState(10)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all")
  const [sentenceQuestions, setSentenceQuestions] = useState<SentenceQuizQuestion[]>([])
  const [isGeneratingSentences, setIsGeneratingSentences] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const { toast } = useToast()

  // تحميل البطاقات وحالة الاختبار اليومي من التخزين المحلي
  useEffect(() => {
    const savedFlashcards = localStorage.getItem("flashcards")
    if (savedFlashcards) {
      try {
        setFlashcards(JSON.parse(savedFlashcards))
      } catch (error) {
        console.error("Failed to parse saved flashcards:", error)
      }
    }

    const savedCategories = localStorage.getItem("flashcardCategories")
    if (savedCategories) {
      try {
        setCategories(JSON.parse(savedCategories))
      } catch (error) {
        console.error("Failed to parse saved categories:", error)
      }
    }

    const savedQuizState = localStorage.getItem("dailyQuizState")
    if (savedQuizState) {
      try {
        setQuizState(JSON.parse(savedQuizState))
      } catch (error) {
        console.error("Failed to parse saved quiz state:", error)
      }
    }
  }, [])

  // التحقق من حالة الاختبار اليومي - تم تعديله للسماح بإجراء الاختبار عدة مرات
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]

    // نعرض فقط نتائج آخر اختبار دون منع المستخدم من إجراء اختبار جديد
    if (quizState.lastQuizDate === today && quizState.completed) {
      // لا نقوم بتعيين quizFinished إلى true لكي يتمكن المستخدم من إجراء الاختبار مرة أخرى
    }
  }, [quizState])

  // حفظ حالة الاختبار اليومي عند تغييرها
  useEffect(() => {
    localStorage.setItem("dailyQuizState", JSON.stringify(quizState))
  }, [quizState])

  // توليد جمل للكلمات باستخدام الذكاء الاصطناعي
  const generateSentences = async (selectedCards: Flashcard[]) => {
    setIsGeneratingSentences(true)
    setGenerationError(null)

    try {
      const words = selectedCards.map((card) => card.word)

      // محاولة استخدام API إذا كان متصلاً بالإنترنت
      try {
        const response = await fetch("/api/generate-sentences", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ words }),
        })

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        // التحقق من وجود البيانات المطلوبة
        if (!data.sentences || !Array.isArray(data.sentences) || data.sentences.length === 0) {
          throw new Error("لم يتم استلام بيانات صالحة من الخادم")
        }

        // تنسيق الأسئلة
        const generatedQuestions: SentenceQuizQuestion[] = data.sentences
          .map((item: any, index: number) => {
            // التحقق من وجود الكلمة والجملة
            if (!item.word || !item.sentence) {
              console.warn(`Missing word or sentence for item at index ${index}`, item)
              return null
            }

            // الحصول على 3 كلمات عشوائية أخرى للخيارات الخاطئة
            const otherWords = selectedCards
              .filter((card) => card.word !== item.word)
              .sort(() => 0.5 - Math.random())
              .slice(0, 3)
              .map((card) => card.word)

            // إنشاء مصفوفة الخيارات مع الإجابة الصحيحة
            const options = [...otherWords, item.word].sort(() => 0.5 - Math.random())

            return {
              id: selectedCards.find((card) => card.word === item.word)?.id || `sentence-${index}`,
              word: item.word,
              sentence: item.sentence.replace(new RegExp(`\\b${item.word}\\b`, "gi"), "______"),
              options,
              correctIndex: options.indexOf(item.word),
            }
          })
          .filter(Boolean) // إزالة العناصر الفارغة

        // التحقق من وجود أسئلة كافية
        if (generatedQuestions.length === 0) {
          throw new Error("لم يتم إنشاء أسئلة كافية")
        }

        setSentenceQuestions(generatedQuestions)

        // إذا كان هناك تحذير، عرضه للمستخدم
        if (data.warning) {
          toast({
            title: "تنبيه",
            description: data.warning,
          })
        }

        return true
      } catch (error) {
        console.error("Error with API, using fallback method:", error)

        // استخدام طريقة احتياطية لتوليد جمل بسيطة في حالة عدم الاتصال
        const generatedQuestions: SentenceQuizQuestion[] = selectedCards.map((card, index) => {
          // إنشاء جملة بسيطة
          const simpleSentence = `This is a ______ that you need to learn.`

          // الحصول على 3 كلمات عشوائية أخرى للخيارات الخاطئة
          const otherWords = selectedCards
            .filter((c) => c.id !== card.id)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)
            .map((c) => c.word)

          // إنشاء مصفوفة الخيارات مع الإجابة الصحيحة
          const options = [...otherWords, card.word].sort(() => 0.5 - Math.random())

          return {
            id: card.id,
            word: card.word,
            sentence: simpleSentence,
            options,
            correctIndex: options.indexOf(card.word),
          }
        })

        setSentenceQuestions(generatedQuestions)

        toast({
          title: "تم استخدام الوضع البديل",
          description: "تم إنشاء جمل بسيطة بسبب مشكلة في الاتصال أو الخادم.",
        })

        return true
      }
    } catch (error) {
      console.error("Error generating sentences:", error)
      setGenerationError(error instanceof Error ? error.message : "حدث خطأ أثناء توليد الجمل")
      return false
    } finally {
      setIsGeneratingSentences(false)
    }
  }

  // تصفية البطاقات حسب المجموعة المختارة
  const getFilteredFlashcards = () => {
    if (selectedCategoryId === "all") {
      return flashcards
    } else if (selectedCategoryId === "uncategorized") {
      return flashcards.filter((card) => !card.categoryId)
    } else {
      return flashcards.filter((card) => card.categoryId === selectedCategoryId)
    }
  }

  // بدء الاختبار
  const startQuiz = async () => {
    const filteredFlashcards = getFilteredFlashcards()

    if (filteredFlashcards.length < 3) {
      toast({
        title: "عدد البطاقات غير كافٍ",
        description: "تحتاج إلى 3 بطاقات على الأقل في المجموعة المختارة لبدء الاختبار.",
        variant: "destructive",
      })
      return
    }

    // تحديد عدد البطاقات للاختبار
    const actualQuizSize = Math.min(quizSize, filteredFlashcards.length)

    // اختيار البطاقات العشوائية للاختبار
    const selectedCards = [...filteredFlashcards].sort(() => 0.5 - Math.random()).slice(0, actualQuizSize)

    if (quizType === "sentence") {
      // توليد جمل للكلمات المختارة
      const success = await generateSentences(selectedCards)
      if (!success) {
        return
      }
    }

    setQuizCards(selectedCards)
    setQuizStarted(true)
    setQuizFinished(false)
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setSelectedOption(null)
    setResults([])
  }

  // معالجة اختيار الإجابة في الاختبار القياسي
  const handleAnswer = (isCorrect: boolean) => {
    setSelectedAnswer(isCorrect)

    // إضافة النتيجة
    setResults([...results, { card: quizCards[currentQuestionIndex], correct: isCorrect }])
  }

  // معالجة اختيار الإجابة في اختبار الجمل
  const handleSentenceAnswer = (optionIndex: number) => {
    setSelectedOption(optionIndex)
    const isCorrect = optionIndex === sentenceQuestions[currentQuestionIndex].correctIndex

    // إضافة النتيجة
    setResults([
      ...results,
      {
        card:
          quizCards.find((card) => card.id === sentenceQuestions[currentQuestionIndex].id) ||
          quizCards[currentQuestionIndex],
        correct: isCorrect,
      },
    ])
  }

  // الانتقال إلى السؤال التالي
  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizCards.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
      setSelectedOption(null)
    } else {
      endQuiz()
    }
  }

  // إنهاء الاختبار
  const endQuiz = () => {
    setQuizFinished(true)
    setQuizStarted(false)

    const today = new Date().toISOString().split("T")[0]
    const correctAnswers = results.filter((r) => r.correct).length
    const score = Math.round((correctAnswers / results.length) * 100)

    // تحديث البطاقات بنتائج الاختبار
    const updatedFlashcards = [...flashcards]
    results.forEach((result) => {
      const cardIndex = updatedFlashcards.findIndex((card) => card.id === result.card.id)
      if (cardIndex !== -1) {
        updatedFlashcards[cardIndex] = {
          ...updatedFlashcards[cardIndex],
          reviewCount: (updatedFlashcards[cardIndex].reviewCount || 0) + 1,
          correctCount: (updatedFlashcards[cardIndex].correctCount || 0) + (result.correct ? 1 : 0),
          lastReviewed: Date.now(),
        }
      }
    })

    setFlashcards(updatedFlashcards)
    localStorage.setItem("flashcards", JSON.stringify(updatedFlashcards))

    // تحديث حالة الاختبار اليومي
    const newStreak = quizState.lastQuizDate === getPreviousDay(today) ? quizState.streak + 1 : 1

    const newQuizState = {
      lastQuizDate: today,
      completed: true,
      streak: newStreak,
      longestStreak: Math.max(newStreak, quizState.longestStreak),
      history: [
        ...quizState.history,
        {
          date: today,
          score,
          totalCards: results.length,
          quizType: quizType,
        },
      ].slice(-30), // الاحتفاظ فقط بآخر 30 يوم
    }

    setQuizState(newQuizState)

    // عرض الاحتفال إذا كانت النتيجة ممتازة
    if (score >= 80) {
      setShowCelebration(true)
    }
  }

  // الحصول على تاريخ اليوم السابق
  const getPreviousDay = (dateString: string) => {
    const date = new Date(dateString)
    date.setDate(date.getDate() - 1)
    return date.toISOString().split("T")[0]
  }

  // حساب النتيجة
  const calculateScore = () => {
    const correctAnswers = results.filter((r) => r.correct).length
    return Math.round((correctAnswers / results.length) * 100)
  }

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // الحصول على أحدث نتائج الاختبار
  const getRecentResults = () => {
    return quizState.history.slice(-7).reverse()
  }

  // الحصول على اسم المجموعة
  const getCategoryName = (categoryId: string | undefined) => {
    if (!categoryId) return "بدون مجموعة"
    const category = categories.find((cat) => cat.id === categoryId)
    return category ? category.name : "بدون مجموعة"
  }

  // حساب عدد البطاقات في كل مجموعة
  const getCategoryStats = () => {
    const stats: Record<string, number> = {}

    // حساب عدد البطاقات في كل مجموعة
    flashcards.forEach((card) => {
      if (card.categoryId) {
        stats[card.categoryId] = (stats[card.categoryId] || 0) + 1
      }
    })

    // حساب عدد البطاقات التي ليس لها مجموعة
    const uncategorized = flashcards.filter((card) => !card.categoryId).length
    if (uncategorized > 0) {
      stats["uncategorized"] = uncategorized
    }

    return stats
  }

  const categoryStats = getCategoryStats()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex items-center h-16 px-4 mx-auto">
          <Link href="/" className="flex items-center mr-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            العودة
          </Link>
          <h1 className="text-2xl font-bold">الاختبار اليومي</h1>
          {quizState.streak > 0 && (
            <Badge variant="outline" className="mr-3 py-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>{quizState.streak} يوم متتالي</span>
            </Badge>
          )}
        </div>
      </header>

      <main className="container px-4 py-8 mx-auto">
        <div className="max-w-2xl mx-auto">
          {!quizStarted && !quizFinished ? (
            <Card>
              <CardHeader>
                <CardTitle>الاختبار اليومي</CardTitle>
                <CardDescription>اختبر معرفتك اليومية بالكلمات الإنجليزية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="font-medium">اليوم: {formatDate(new Date().toISOString())}</span>
                  </div>
                  {quizState.streak > 0 && (
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{quizState.streak} يوم متتالي</span>
                    </div>
                  )}
                </div>

                {quizState.lastQuizDate === new Date().toISOString().split("T")[0] && quizState.completed ? (
                  <div className="p-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">لقد أكملت الاختبار اليومي!</span>
                    </div>
                    <p className="mt-2 text-sm">يمكنك إجراء الاختبار مرة أخرى أو تجربة أنواع أخرى من الاختبارات.</p>
                    <p className="mt-2 text-sm">استمر في التعلم للحفاظ على سلسلة أيامك المتتالية.</p>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg">
                    <p>اختر نوع الاختبار المناسب لك وعدد البطاقات التي تريد اختبارها.</p>
                    <p className="mt-2 text-sm">
                      أكمل الاختبار اليومي للحفاظ على سلسلة أيامك المتتالية وتعزيز عملية التعلم.
                    </p>
                  </div>
                )}

                <div className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label>نوع الاختبار:</Label>
                    <RadioGroup defaultValue="standard" onValueChange={(value) => setQuizType(value as any)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="standard" id="r1" />
                        <Label htmlFor="r1">اختبار قياسي (معرفة المعاني)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sentence" id="r2" />
                        <Label htmlFor="r2">اختبار الجمل (ملء الفراغات)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="r3" />
                        <Label htmlFor="r3">اختبار مخصص</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quizSize">عدد البطاقات:</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="quizSize"
                        type="number"
                        min="3"
                        max={flashcards.length}
                        value={quizSize}
                        onChange={(e) => setQuizSize(Number(e.target.value))}
                        className="w-20"
                      />
                      <span>(الحد الأقصى: {flashcards.length}, الحد الأدنى: 3)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categorySelect">اختر المجموعة:</Label>
                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                      <SelectTrigger id="categorySelect">
                        <SelectValue placeholder="جميع المجموعات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع المجموعات ({flashcards.length})</SelectItem>
                        <SelectItem value="uncategorized">
                          بدون مجموعة ({categoryStats["uncategorized"] || 0})
                        </SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${category.color}`}></div>
                              <span>
                                {category.name} ({categoryStats[category.id] || 0})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {quizState.history.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-3">آخر النتائج</h3>
                    <div className="space-y-2">
                      {getRecentResults().map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <span>{formatDate(result.date)}</span>
                            <Badge variant="outline" className="ml-2">
                              {result.quizType === "standard"
                                ? "قياسي"
                                : result.quizType === "sentence"
                                  ? "جمل"
                                  : "مخصص"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={result.score} className="w-24 h-2" />
                            <span className="text-sm font-medium">{result.score}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={startQuiz} className="w-full" disabled={isGeneratingSentences}>
                  {isGeneratingSentences ? "جاري إنشاء الاختبار..." : "بدء الاختبار"}
                </Button>
              </CardFooter>
            </Card>
          ) : quizStarted && !quizFinished ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    السؤال {currentQuestionIndex + 1} / {quizCards.length}
                  </CardTitle>
                  <Badge variant="outline">
                    <Clock className="mr-1 h-3 w-3" />
                    <span>
                      {results.length} / {quizCards.length}
                    </span>
                  </Badge>
                </div>
                <Progress value={((currentQuestionIndex + 1) / quizCards.length) * 100} className="mt-2" />
              </CardHeader>
              <CardContent className="space-y-6">
                {quizType === "standard" ? (
                  // اختبار قياسي
                  <>
                    <div className="flex flex-col items-center justify-center p-6 border-2 rounded-lg">
                      <h3 className="text-xl font-bold mb-2">ما معنى:</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-primary">{quizCards[currentQuestionIndex].word}</p>
                        <PronunciationButton text={quizCards[currentQuestionIndex].word} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={() => handleAnswer(true)}
                        className={`w-full p-4 h-auto justify-start text-left ${
                          selectedAnswer === true ? "bg-green-100 dark:bg-green-900/30 border-green-500" : ""
                        }`}
                        variant="outline"
                        disabled={selectedAnswer !== null}
                      >
                        <div className="flex items-center gap-2">
                          {selectedAnswer === true && <CheckCircle className="h-5 w-5 text-green-500" />}
                          <span>أعرف هذه الكلمة</span>
                        </div>
                      </Button>

                      <Button
                        onClick={() => handleAnswer(false)}
                        className={`w-full p-4 h-auto justify-start text-left ${
                          selectedAnswer === false ? "bg-red-100 dark:bg-red-900/30 border-red-500" : ""
                        }`}
                        variant="outline"
                        disabled={selectedAnswer !== null}
                      >
                        <div className="flex items-center gap-2">
                          {selectedAnswer === false && <XCircle className="h-5 w-5 text-red-500" />}
                          <span>لا أعرف هذه الكلمة</span>
                        </div>
                      </Button>
                    </div>

                    {selectedAnswer !== null && (
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="font-medium">المعنى:</p>
                        <p className="text-lg">{quizCards[currentQuestionIndex].meaning}</p>
                      </div>
                    )}
                  </>
                ) : quizType === "sentence" ? (
                  // اختبار الجمل
                  <>
                    <div className="flex flex-col items-center justify-center p-6 border-2 rounded-lg">
                      <h3 className="text-xl font-bold mb-2">اختر الكلمة المناسبة:</h3>
                      <p className="text-lg text-center my-4">{sentenceQuestions[currentQuestionIndex].sentence}</p>
                      <div className="flex items-center gap-2">
                        <PronunciationButton
                          text={sentenceQuestions[currentQuestionIndex].sentence.replace(
                            "______",
                            sentenceQuestions[currentQuestionIndex].word,
                          )}
                          showText={false}
                        />
                        <span className="text-xs text-muted-foreground">(استمع للجملة كاملة)</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {sentenceQuestions[currentQuestionIndex].options.map((option, index) => (
                        <Button
                          key={index}
                          onClick={() => handleSentenceAnswer(index)}
                          className={`w-full p-4 h-auto justify-start text-left ${
                            selectedOption === index
                              ? index === sentenceQuestions[currentQuestionIndex].correctIndex
                                ? "bg-green-100 dark:bg-green-900/30 border-green-500"
                                : "bg-red-100 dark:bg-red-900/30 border-red-500"
                              : ""
                          }`}
                          variant="outline"
                          disabled={selectedOption !== null}
                        >
                          <div className="flex items-center gap-2">
                            {selectedOption === index &&
                              (index === sentenceQuestions[currentQuestionIndex].correctIndex ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              ))}
                            <span>{option}</span>
                          </div>
                        </Button>
                      ))}
                    </div>

                    {selectedOption !== null && (
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="font-medium">الكلمة الصحيحة:</p>
                        <p className="text-lg">{sentenceQuestions[currentQuestionIndex].word}</p>
                        <p className="font-medium mt-2">الجملة الكاملة:</p>
                        <p className="text-lg">
                          {sentenceQuestions[currentQuestionIndex].sentence.replace(
                            "______",
                            sentenceQuestions[currentQuestionIndex].word,
                          )}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  // اختبار مخصص (يستخدم نفس منطق الاختبار القياسي)
                  <>
                    <div className="flex flex-col items-center justify-center p-6 border-2 rounded-lg">
                      <Badge variant="outline" className="mb-2">
                        {getCategoryName(quizCards[currentQuestionIndex].categoryId)}
                      </Badge>
                      <h3 className="text-xl font-bold mb-2">ما معنى:</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-primary">{quizCards[currentQuestionIndex].word}</p>
                        <PronunciationButton text={quizCards[currentQuestionIndex].word} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={() => handleAnswer(true)}
                        className={`w-full p-4 h-auto justify-start text-left ${
                          selectedAnswer === true ? "bg-green-100 dark:bg-green-900/30 border-green-500" : ""
                        }`}
                        variant="outline"
                        disabled={selectedAnswer !== null}
                      >
                        <div className="flex items-center gap-2">
                          {selectedAnswer === true && <CheckCircle className="h-5 w-5 text-green-500" />}
                          <span>أعرف هذه الكلمة</span>
                        </div>
                      </Button>

                      <Button
                        onClick={() => handleAnswer(false)}
                        className={`w-full p-4 h-auto justify-start text-left ${
                          selectedAnswer === false ? "bg-red-100 dark:bg-red-900/30 border-red-500" : ""
                        }`}
                        variant="outline"
                        disabled={selectedAnswer !== null}
                      >
                        <div className="flex items-center gap-2">
                          {selectedAnswer === false && <XCircle className="h-5 w-5 text-red-500" />}
                          <span>لا أعرف هذه الكلمة</span>
                        </div>
                      </Button>
                    </div>

                    {selectedAnswer !== null && (
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="font-medium">المعنى:</p>
                        <p className="text-lg">{quizCards[currentQuestionIndex].meaning}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleNextQuestion}
                  className="w-full"
                  disabled={
                    quizType === "standard" || quizType === "custom" ? selectedAnswer === null : selectedOption === null
                  }
                >
                  {currentQuestionIndex < quizCards.length - 1 ? "السؤال التالي" : "إنهاء الاختبار"}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>نتائج الاختبار اليومي</CardTitle>
                <CardDescription>{formatDate(new Date().toISOString())}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {showCelebration && (
                  <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm">
                    <Celebration score={calculateScore()} />
                    <Button
                      className="absolute top-4 right-4"
                      variant="ghost"
                      onClick={() => setShowCelebration(false)}
                    >
                      إغلاق
                    </Button>
                  </div>
                )}

                <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary/10">
                    <Trophy className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">النتيجة: {calculateScore()}%</h3>
                  <p className="text-muted-foreground">
                    أجبت على {results.filter((r) => r.correct).length} من أصل {results.length} بشكل صحيح
                  </p>
                  <Badge variant="outline" className="mt-2">
                    {quizType === "standard"
                      ? "اختبار قياسي"
                      : quizType === "sentence"
                        ? "اختبار الجمل"
                        : "اختبار مخصص"}
                  </Badge>

                  {quizState.streak > 1 && (
                    <div className="mt-4 flex items-center gap-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-lg">
                      <Sparkles className="h-5 w-5" />
                      <span>سلسلة متتالية: {quizState.streak} يوم!</span>
                    </div>
                  )}
                </div>

                <Tabs defaultValue="all">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">جميع الكلمات</TabsTrigger>
                    <TabsTrigger value="correct">الإجابات الصحيحة</TabsTrigger>
                    <TabsTrigger value="incorrect">الإجابات الخاطئة</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="mt-4 space-y-3">
                    {results.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          {result.correct ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <div>
                            <p className="font-medium">{result.card.word}</p>
                            <p className="text-sm text-muted-foreground">{result.card.meaning}</p>
                          </div>
                        </div>
                        <PronunciationButton text={result.card.word} />
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="correct" className="mt-4 space-y-3">
                    {results
                      .filter((r) => r.correct)
                      .map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="font-medium">{result.card.word}</p>
                              <p className="text-sm text-muted-foreground">{result.card.meaning}</p>
                            </div>
                          </div>
                          <PronunciationButton text={result.card.word} />
                        </div>
                      ))}
                  </TabsContent>

                  <TabsContent value="incorrect" className="mt-4 space-y-3">
                    {results
                      .filter((r) => !r.correct)
                      .map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-500" />
                            <div>
                              <p className="font-medium">{result.card.word}</p>
                              <p className="text-sm text-muted-foreground">{result.card.meaning}</p>
                            </div>
                          </div>
                          <PronunciationButton text={result.card.word} />
                        </div>
                      ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Link href="/" className="w-full">
                  <Button className="w-full" variant="outline">
                    العودة للصفحة الرئيسية
                  </Button>
                </Link>
                <Link href="/flashcards" className="w-full">
                  <Button className="w-full">الذهاب إلى البطاقات التعليمية</Button>
                </Link>
                <Button
                  onClick={() => {
                    setQuizFinished(false)
                    setQuizStarted(false)
                    setResults([])
                  }}
                  className="w-full"
                  variant="secondary"
                >
                  إعادة الاختبار مرة أخرى
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
