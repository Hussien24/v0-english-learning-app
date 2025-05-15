"use client"

import { useState, useEffect } from "react"
import { AIAssistant } from "./ai-assistant"
import type { Flashcard } from "./flashcard-item"

export function AIFlashcardHelper() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])

  // تحميل البطاقات التعليمية من التخزين المحلي بطريقة محسنة
  useEffect(() => {
    // استخدام setTimeout لتأخير تحميل البطاقات حتى تكتمل عملية تحميل الصفحة
    const timer = setTimeout(() => {
      const savedFlashcards = localStorage.getItem("flashcards")
      if (savedFlashcards) {
        try {
          // تحميل البطاقات وتحديد عددها للتحسين
          const allFlashcards = JSON.parse(savedFlashcards)
          // فقط أحدث 50 بطاقة للتحسين
          setFlashcards(allFlashcards.slice(0, 50))
        } catch (error) {
          console.error("Failed to parse saved flashcards:", error)
        }
      }
    }, 1000) // تأخير التحميل لمدة ثانية واحدة

    return () => clearTimeout(timer)
  }, [])

  return <AIAssistant flashcards={flashcards} />
}
