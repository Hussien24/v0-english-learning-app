"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Pencil, AlertTriangle } from "lucide-react"
import { OldEnglishDetector } from "@/components/old-english-detector"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Category } from "@/components/category-manager"
import type { Flashcard } from "@/components/flashcard-item"

interface FlashcardFormProps {
  categories: Category[]
  onAddFlashcard: (flashcard: Omit<Flashcard, "id" | "createdAt" | "reviewCount" | "correctCount">) => void
  editingFlashcard: Flashcard | null
  onUpdateFlashcard: (flashcard: Flashcard) => void
  onCancelEdit: () => void
  existingFlashcards: Flashcard[]
}

export function FlashcardForm({
  categories,
  onAddFlashcard,
  editingFlashcard,
  onUpdateFlashcard,
  onCancelEdit,
  existingFlashcards,
}: FlashcardFormProps) {
  const [word, setWord] = useState("")
  const [meaning, setMeaning] = useState("")
  const [categoryId, setCategoryId] = useState<string>("")
  const [wordDebounced, setWordDebounced] = useState("")
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [duplicateCard, setDuplicateCard] = useState<Flashcard | null>(null)

  // Set up debounce for word checking
  useEffect(() => {
    const timer = setTimeout(() => {
      setWordDebounced(word)
      checkForDuplicate(word)
    }, 500)

    return () => clearTimeout(timer)
  }, [word, existingFlashcards])

  // Check if the word already exists in flashcards
  const checkForDuplicate = (wordToCheck: string) => {
    if (!wordToCheck.trim()) {
      setIsDuplicate(false)
      setDuplicateCard(null)
      return
    }

    const normalizedWord = wordToCheck.trim().toLowerCase()

    // Skip checking against the current card being edited
    const cardsToCheck = editingFlashcard
      ? existingFlashcards.filter((card) => card.id !== editingFlashcard.id)
      : existingFlashcards

    const duplicate = cardsToCheck.find((card) => card.word.toLowerCase() === normalizedWord)

    setIsDuplicate(!!duplicate)
    setDuplicateCard(duplicate || null)
  }

  // Handle editing mode
  useEffect(() => {
    if (editingFlashcard) {
      setWord(editingFlashcard.word)
      setMeaning(editingFlashcard.meaning)
      setCategoryId(editingFlashcard.categoryId || "")
      setIsDuplicate(false)
      setDuplicateCard(null)
    } else {
      setWord("")
      setMeaning("")
      // Don't reset category to make it easier to add multiple cards to the same category
    }
  }, [editingFlashcard])

  const handleSubmit = () => {
    if (!word.trim() || !meaning.trim()) {
      return
    }

    // Prevent adding duplicates
    if (isDuplicate && !editingFlashcard) {
      return
    }

    if (editingFlashcard) {
      onUpdateFlashcard({
        ...editingFlashcard,
        word: word.trim(),
        meaning: meaning.trim(),
        categoryId: categoryId || undefined,
      })
    } else {
      onAddFlashcard({
        word: word.trim(),
        meaning: meaning.trim(),
        categoryId: categoryId || undefined,
      })

      // Clear form for new entry but keep the category
      setWord("")
      setMeaning("")
      setIsDuplicate(false)
      setDuplicateCard(null)
    }
  }

  return (
    <Card className="card-gradient">
      <CardHeader>
        <CardTitle>{editingFlashcard ? "تعديل البطاقة التعليمية" : "إنشاء بطاقة تعليمية جديدة"}</CardTitle>
        <CardDescription>
          {editingFlashcard
            ? "قم بتعديل الكلمة والمعنى والمجموعة"
            : "أدخل الكلمة الإنجليزية ومعناها لإنشاء بطاقة جديدة"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="word" className="text-base">
              الكلمة الإنجليزية
            </Label>
            <Input
              id="word"
              placeholder="أدخل كلمة أو عبارة"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              className={`text-lg ${isDuplicate ? "border-red-500 dark:border-red-400" : ""}`}
            />

            {/* Duplicate word warning */}
            {isDuplicate && !editingFlashcard && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  هذه الكلمة موجودة بالفعل في البطاقات التعليمية.
                  {duplicateCard && (
                    <span className="block mt-1">
                      المعنى الحالي: <strong>{duplicateCard.meaning}</strong>
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Old English word detector */}
            <OldEnglishDetector word={wordDebounced} />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="meaning" className="text-base">
              المعنى
            </Label>
            <Textarea
              id="meaning"
              placeholder="أدخل التعريف أو الترجمة"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              className="min-h-[120px] text-lg"
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="category" className="text-base">
              المجموعة (اختياري)
            </Label>
            <Select value={categoryId} onValueChange={(value) => setCategoryId(value)}>
              <SelectTrigger id="category">
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
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {editingFlashcard && (
          <Button variant="outline" onClick={onCancelEdit}>
            إلغاء
          </Button>
        )}
        <Button onClick={handleSubmit} className="btn-primary-gradient" disabled={isDuplicate && !editingFlashcard}>
          {editingFlashcard ? (
            <>
              <Pencil className="w-4 h-4 ml-2" />
              تحديث البطاقة
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 ml-2" />
              إضافة بطاقة
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
