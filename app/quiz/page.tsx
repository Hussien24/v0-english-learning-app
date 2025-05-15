"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Timer, BookOpen } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Category } from "@/components/category-manager"
import type { Flashcard } from "@/components/flashcard-item"
import { Celebration } from "@/components/celebration"
import { PronunciationButton } from "@/components/pronunciation-button"
import { SpeechSupportWarning } from "@/components/speech-support-warning"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface QuizQuestion {
  id: string
  word: string
  meaning: string
  options: string[]
  correctIndex: number
}

interface SentenceQuizQuestion {
  id: string
  word: string
  sentence: string
  options: string[]
  correctIndex: number
}

interface QuizResult {
  id: string
  word: string
  meaning: string
  userAnswer: string
  isCorrect: boolean
}

export default function QuizPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizFinished, setQuizFinished] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [sentenceQuestions, setSentenceQuestions] = useState<SentenceQuizQuestion[]>([])
  const [results, setResults] = useState<QuizResult[]>([])
  const [timeLeft, setTimeLeft] = useState(30)
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)
  const [showMistakes, setShowMistakes] = useState(false)
  const { toast } = useToast()
  const [quizSize, setQuizSize] = useState(5)
  const [quizDifficulty, setQuizDifficulty] = useState("medium")
  const [timePerQuestion, setTimePerQuestion] = useState(30)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all")
  const [showCelebration, setShowCelebration] = useState(false)
  const [quizType, setQuizType] = useState<"meaning" | "sentence">("meaning")
  const [isGeneratingSentences, setIsGeneratingSentences] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  // Load flashcards and categories from localStorage on component mount
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
  }, [])

  // Timer countdown
  useEffect(() => {
    if (quizStarted && !quizFinished && timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
      setTimer(interval)
      return () => clearInterval(interval)
    } else if (timeLeft === 0 && quizStarted && !quizFinished) {
      handleTimeUp()
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [quizStarted, quizFinished, timeLeft])

  const handleTimeUp = () => {
    if (timer) clearInterval(timer)

    // Record this question as incorrect if no answer was selected
    if (selectedOption === null) {
      if (quizType === "meaning") {
        const currentQuestion = questions[currentQuestionIndex]
        setResults([
          ...results,
          {
            id: currentQuestion.id,
            word: currentQuestion.word,
            meaning: currentQuestion.meaning,
            userAnswer: "انتهى الوقت",
            isCorrect: false,
          },
        ])
      } else {
        const currentQuestion = sentenceQuestions[currentQuestionIndex]
        setResults([
          ...results,
          {
            id: currentQuestion.id,
            word: currentQuestion.word,
            meaning: currentQuestion.sentence,
            userAnswer: "انتهى الوقت",
            isCorrect: false,
          },
        ])
      }
    }

    // Move to next question or end quiz
    if (currentQuestionIndex < (quizType === "meaning" ? questions.length : sentenceQuestions.length) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedOption(null) // تأكيد إعادة تعيين الاختيار
      setTimeLeft(timePerQuestion)
    } else {
      endQuiz()
    }
  }

  // توليد جمل للكلمات باستخدام الذكاء الاصطناعي
  const generateSentences = async (selectedCards: Flashcard[]) => {
    setIsGeneratingSentences(true)
    setGenerationError(null)

    try {
      const words = selectedCards.map((card) => card.word)

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

      // تنسيق الأسئلة
      const generatedQuestions: SentenceQuizQuestion[] = data.sentences.map((item: any, index: number) => {
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

      setSentenceQuestions(generatedQuestions)
      return true
    } catch (error) {
      console.error("Error generating sentences:", error)
      setGenerationError(error instanceof Error ? error.message : "حدث خطأ أثناء توليد الجمل")
      return false
    } finally {
      setIsGeneratingSentences(false)
    }
  }

  const startQuiz = async () => {
    // تصفية البطاقات حسب المجموعة المختارة
    let filteredFlashcards = [...flashcards]

    if (selectedCategoryId === "uncategorized") {
      filteredFlashcards = flashcards.filter((card) => !card.categoryId)
    } else if (selectedCategoryId !== "all") {
      filteredFlashcards = flashcards.filter((card) => card.categoryId === selectedCategoryId)
    }

    if (filteredFlashcards.length < 3) {
      toast({
        title: "عدد البطاقات غير كافٍ",
        description: "تحتاج إلى 3 بطاقات على الأقل في المجموعة المختارة لبدء الاختبار.",
        variant: "destructive",
      })
      return
    }

    // Make sure quizSize is not larger than available flashcards
    const actualQuizSize = Math.min(quizSize, filteredFlashcards.length)

    // Set time per question based on difficulty
    let timeLimit = 30
    switch (quizDifficulty) {
      case "easy":
        timeLimit = 45
        break
      case "medium":
        timeLimit = 30
        break
      case "hard":
        timeLimit = 15
        break
      case "custom":
        timeLimit = timePerQuestion
        break
    }
    setTimeLeft(timeLimit)

    // Shuffle and select up to the specified number of flashcards for the quiz
    let selectedCards: Flashcard[] = []

    if (quizDifficulty === "hard") {
      // For hard difficulty, prioritize words with lower success rates
      selectedCards = [...filteredFlashcards]
        .filter((card) => card.reviewCount && card.reviewCount > 0)
        .sort((a, b) => {
          const aRate = (a.correctCount || 0) / (a.reviewCount || 1)
          const bRate = (b.correctCount || 0) / (b.reviewCount || 1)
          return aRate - bRate
        })
        .slice(0, actualQuizSize)

      // If we don't have enough reviewed cards, add some random ones
      if (selectedCards.length < actualQuizSize) {
        const remainingCards = [...filteredFlashcards]
          .filter((card) => !selectedCards.some((sc) => sc.id === card.id))
          .sort(() => 0.5 - Math.random())
          .slice(0, actualQuizSize - selectedCards.length)

        selectedCards = [...selectedCards, ...remainingCards]
      }
    } else {
      // For other difficulties, just shuffle
      selectedCards = [...filteredFlashcards].sort(() => 0.5 - Math.random()).slice(0, actualQuizSize)
    }

    if (quizType === "sentence") {
      // توليد جمل للكلمات المختارة
      const success = await generateSentences(selectedCards)
      if (!success) {
        return
      }
    } else {
      // Generate questions with options for meaning quiz
      const generatedQuestions = selectedCards.map((card) => {
        // Get 3 random meanings from other cards for wrong options
        const otherMeanings = flashcards
          .filter((f) => f.id !== card.id)
          .map((f) => f.meaning)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)

        // Create options array with correct answer at random position
        const options = [...otherMeanings.slice(0, 3), card.meaning].sort(() => 0.5 - Math.random())

        return {
          id: card.id,
          word: card.word,
          meaning: card.meaning,
          options: options,
          correctIndex: options.indexOf(card.meaning),
        }
      })

      setQuestions(generatedQuestions)
    }

    setQuizStarted(true)
    setQuizFinished(false)
    setCurrentQuestionIndex(0)
    setSelectedOption(null)
    setResults([])
    setTimeLeft(timeLimit)
    setTimer(null)
  }

  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex)
  }

  const handleNextQuestion = () => {
    if (selectedOption !== null) {
      let isCorrect = false
      let currentQuestion: any

      if (quizType === "meaning") {
        currentQuestion = questions[currentQuestionIndex]
        isCorrect = selectedOption === currentQuestion.correctIndex
      } else {
        currentQuestion = sentenceQuestions[currentQuestionIndex]
        isCorrect = selectedOption === currentQuestion.correctIndex
      }

      setResults([
        ...results,
        {
          id: currentQuestion.id,
          word: currentQuestion.word,
          meaning: quizType === "meaning" ? currentQuestion.meaning : currentQuestion.sentence,
          userAnswer:
            quizType === "meaning" ? currentQuestion.options[selectedOption] : currentQuestion.options[selectedOption],
          isCorrect: isCorrect,
        },
      ])

      if (currentQuestionIndex < (quizType === "meaning" ? questions.length : sentenceQuestions.length) - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        setSelectedOption(null) // إعادة تعيين الاختيار
        setTimeLeft(timePerQuestion)
      } else {
        endQuiz()
      }
    } else {
      toast({
        title: "الرجاء اختيار إجابة",
        description: "يجب عليك اختيار إجابة قبل المتابعة.",
        variant: "destructive",
      })
    }
  }

  const endQuiz = () => {
    setQuizFinished(true)
    setQuizStarted(false)
    if (timer) clearInterval(timer)

    // Update flashcard stats
    const updatedFlashcards = [...flashcards]

    results.forEach((result) => {
      const cardIndex = updatedFlashcards.findIndex((card) => card.id === result.id)
      if (cardIndex !== -1) {
        const card = updatedFlashcards[cardIndex]
        updatedFlashcards[cardIndex] = {
          ...card,
          reviewCount: (card.reviewCount || 0) + 1,
          correctCount: (card.correctCount || 0) + (result.isCorrect ? 1 : 0),
          lastReviewed: Date.now(),
        }
      }
    })

    setFlashcards(updatedFlashcards)
    localStorage.setItem("flashcards", JSON.stringify(updatedFlashcards))

    // عرض الاحتفال إذا كانت النتيجة ممتازة
    const score = (results.filter((result) => result.isCorrect).length / results.length) * 100
    if (score >= 90) {
      setShowCelebration(true)
    }
  }

  const resetQuiz = () => {
    setQuizStarted(false)
    setQuizFinished(false)
    setCurrentQuestionIndex(0)
    setSelectedOption(null)
    setQuestions([])
    setSentenceQuestions([])
    setResults([])
    setTimeLeft(timePerQuestion)
    setTimer(null)
    setGenerationError(null)
  }

  const calculateScore = () => {
    const correctAnswers = results.filter((result) => result.isCorrect).length
    return (correctAnswers / results.length) * 100
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
    <div className="container relative m-auto flex h-screen max-w-4xl flex-col p-4">
      <Link href="/" className="absolute left-4 top-4">
        <Button variant="ghost">
          <ArrowLeft className="mr-2 h-4 w-4" />
          العودة
        </Button>
      </Link>

      <Card className="col-span-2 my-auto flex flex-col justify-between">
        <CardHeader>
          <CardTitle className="text-2xl">اختبار البطاقات التعليمية</CardTitle>
          <CardDescription>اختبر معلوماتك</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <SpeechSupportWarning />
          {!quizStarted && !quizFinished ? (
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="quizSize">حجم الاختبار:</Label>
                <Input
                  id="quizSize"
                  type="number"
                  min="3"
                  max={flashcards.length}
                  defaultValue={quizSize.toString()}
                  onChange={(e) => setQuizSize(Number.parseInt(e.target.value))}
                  className="w-20"
                />
                <p>(Max: {flashcards.length}, Min: 3)</p>
              </div>

              <div className="flex flex-col space-y-2">
                <Label>نوع الاختبار:</Label>
                <Tabs defaultValue="meaning" onValueChange={(value) => setQuizType(value as "meaning" | "sentence")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="meaning">اختبار المعاني</TabsTrigger>
                    <TabsTrigger value="sentence">اختبار الجمل</TabsTrigger>
                  </TabsList>
                  <TabsContent value="meaning" className="mt-2">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        في هذا النوع من الاختبار، ستظهر لك كلمة وعليك اختيار المعنى الصحيح لها من بين عدة خيارات.
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="sentence" className="mt-2">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        في هذا النوع من الاختبار، ستظهر لك جملة بها كلمة مفقودة وعليك اختيار الكلمة المناسبة من بين عدة
                        خيارات.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="flex flex-col space-y-2">
                <Label>مستوى الصعوبة:</Label>
                <RadioGroup defaultValue={quizDifficulty} onValueChange={setQuizDifficulty}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="easy" id="r1" />
                    <Label htmlFor="r1">سهل</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="r2" />
                    <Label htmlFor="r2">متوسط</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hard" id="r3" />
                    <Label htmlFor="r3">صعب</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="r4" />
                    <Label htmlFor="r4">مخصص</Label>
                  </div>
                </RadioGroup>
              </div>

              {quizDifficulty === "custom" && (
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="timePerQuestion">الوقت لكل سؤال (ثانية):</Label>
                  <Slider
                    id="timePerQuestion"
                    defaultValue={[timePerQuestion]}
                    max={60}
                    min={5}
                    step={5}
                    onValueChange={(value) => setTimePerQuestion(value[0])}
                  />
                  <p className="text-sm text-muted-foreground">{timePerQuestion} ثانية</p>
                </div>
              )}

              <div className="flex flex-col space-y-2">
                <Label htmlFor="categorySelect">اختر المجموعة:</Label>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger id="categorySelect">
                    <SelectValue placeholder="جميع المجموعات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المجموعات ({flashcards.length})</SelectItem>
                    <SelectItem value="uncategorized">بدون مجموعة ({categoryStats["uncategorized"] || 0})</SelectItem>
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

              {generationError && (
                <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg">
                  <p className="text-sm">{generationError}</p>
                </div>
              )}

              <Button onClick={startQuiz} disabled={isGeneratingSentences}>
                {isGeneratingSentences ? "جاري إنشاء الاختبار..." : "ابدأ الاختبار"}
              </Button>
            </div>
          ) : quizStarted && !quizFinished ? (
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  السؤال {currentQuestionIndex + 1} /{" "}
                  {quizType === "meaning" ? questions.length : sentenceQuestions.length}
                </h2>
                <div className="flex items-center space-x-2">
                  <Timer className="h-4 w-4 ml-1" />
                  <span className={timeLeft < 10 ? "text-red-500 font-bold" : ""}>{timeLeft}</span>
                </div>
              </div>
              <Progress
                value={
                  ((currentQuestionIndex + 1) /
                    (quizType === "meaning" ? questions.length : sentenceQuestions.length)) *
                  100
                }
              />

              {quizType === "meaning" ? (
                // اختبار المعاني
                <Card className="p-6 mb-4 border-2">
                  <CardContent className="p-0 flex flex-col items-center">
                    <h3 className="text-xl font-bold mb-2">ما معنى:</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-primary">{questions[currentQuestionIndex].word}</p>
                      <PronunciationButton text={questions[currentQuestionIndex].word} />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // اختبار الجمل
                <Card className="p-6 mb-4 border-2">
                  <CardContent className="p-0 flex flex-col items-center">
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
                  </CardContent>
                </Card>
              )}

              <div className="flex flex-col space-y-3">
                {(quizType === "meaning"
                  ? questions[currentQuestionIndex].options
                  : sentenceQuestions[currentQuestionIndex].options
                ).map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleOptionSelect(index)}
                    className={`p-4 text-right rounded-lg border-2 transition-all ${
                      selectedOption === index
                        ? "border-primary bg-primary/10 font-medium"
                        : "border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <Button
                onClick={handleNextQuestion}
                disabled={selectedOption === null}
                className="mt-4 w-full btn-primary-gradient"
              >
                السؤال التالي
              </Button>
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              {showCelebration && (
                <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm">
                  <Celebration score={calculateScore()} />
                  <Button className="absolute top-4 right-4" variant="ghost" onClick={() => setShowCelebration(false)}>
                    إغلاق
                  </Button>
                </div>
              )}
              <h2 className="text-xl font-semibold">انتهى الاختبار!</h2>
              <p className="text-2xl font-bold">النتيجة: {calculateScore().toFixed(0)}%</p>
              <Button onClick={() => setShowMistakes(!showMistakes)}>
                {showMistakes ? "إخفاء الأخطاء" : "عرض الأخطاء"}
              </Button>
              {showMistakes && (
                <div className="flex flex-col space-y-2">
                  {results.map((result) => (
                    <Card key={result.id} className="border-2">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm font-medium">{result.word}</CardTitle>
                          <PronunciationButton text={result.word} size="sm" />
                        </div>
                        {result.isCorrect ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {quizType === "meaning" ? "المعنى الصحيح: " : "الجملة: "}
                          {result.meaning}
                        </p>
                        <p className="text-sm text-muted-foreground">إجابتك: {result.userAnswer}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              <Button variant="outline" onClick={resetQuiz}>
                إعادة الاختبار
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Badge variant="secondary">
            <Clock className="mr-2 h-4 w-4" />
            {quizType === "meaning" && questions.length > 0
              ? questions.length * timePerQuestion
              : quizType === "sentence" && sentenceQuestions.length > 0
                ? sentenceQuestions.length * timePerQuestion
                : quizSize * timePerQuestion}{" "}
            ثانية
          </Badge>
          <Badge variant="outline">
            <BookOpen className="mr-2 h-4 w-4" />
            {flashcards.length} بطاقات تعليمية
          </Badge>
        </CardFooter>
      </Card>
    </div>
  )
}
