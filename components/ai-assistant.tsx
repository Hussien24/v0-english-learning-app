"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar } from "@/components/ui/avatar"
import { Bot, Send, User, X, Minimize2, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { PronunciationButton } from "./pronunciation-button"
import type { Flashcard } from "./flashcard-item"

interface AIAssistantProps {
  flashcards?: Flashcard[]
}

export function AIAssistant({ flashcards }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [englishWords, setEnglishWords] = useState<Record<string, string[]>>({})

  // تحسين الأداء: استخدام useCallback لمنع إعادة إنشاء الدالة في كل تحديث
  const extractEnglishWords = useCallback((text: string): string[] => {
    const englishWordPattern = /\b[a-zA-Z]+\b/g
    return text.match(englishWordPattern) || []
  }, [])

  // استخدام hook الدردشة من AI SDK مع تحسين الأداء
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: chatLoading,
    setInput,
  } = useChat({
    api: "/api/ai-assistant",
    initialMessages: [
      {
        id: "welcome-message",
        role: "assistant",
        content: "مرحبًا! أنا مساعدك لتعلم اللغة الإنجليزية. كيف يمكنني مساعدتك اليوم؟",
      },
    ],
    body: {
      context: {
        flashcards: flashcards?.slice(0, 50) || [], // تحديد عدد البطاقات المرسلة لتحسين الأداء
      },
    },
    onResponse: () => {
      setIsLoading(false)
    },
    onError: (error) => {
      console.error("Chat error:", error)
      setIsLoading(false)
    },
  })

  // تحسين الأداء: استخراج الكلمات الإنجليزية مرة واحدة فقط عند تغيير الرسائل
  useEffect(() => {
    const newEnglishWords: Record<string, string[]> = {}

    messages.forEach((message) => {
      if (message.role === "assistant") {
        newEnglishWords[message.id] = Array.from(new Set(extractEnglishWords(message.content)))
      }
    })

    setEnglishWords(newEnglishWords)
  }, [messages, extractEnglishWords])

  // التمرير إلى أسفل عند إضافة رسائل جديدة
  useEffect(() => {
    if (messagesEndRef.current && isOpen && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen, isMinimized])

  // معالجة الإرسال مع إضافة حالة التحميل
  const handleChatSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return
    setIsLoading(true)
    handleSubmit(e)
  }

  // تصدير وظيفة تعيين النص للاستخدام العالمي
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.aiAssistantSetInput = (text: string) => {
        setInput(text)
        setIsOpen(true)
        setIsMinimized(false)
      }
    }

    return () => {
      if (typeof window !== "undefined") {
        delete window.aiAssistantSetInput
      }
    }
  }, [setInput])

  // تحسين الأداء: عدم عرض المساعد إذا كان مغلقًا
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-8 md:right-8 rounded-full w-14 h-14 shadow-lg"
      >
        <Bot className="w-6 h-6" />
      </Button>
    )
  }

  return (
    <Card
      className={cn(
        "fixed z-50 transition-all duration-300 shadow-lg border-primary/20",
        isMinimized
          ? "bottom-20 right-4 md:bottom-8 md:right-8 w-auto h-auto"
          : "bottom-20 right-4 md:bottom-8 md:right-8 w-[90vw] max-w-md h-[70vh] max-h-[600px]",
      )}
    >
      <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2 bg-primary/20">
            <Bot className="h-4 w-4 text-primary" />
          </Avatar>
          <div>
            <CardTitle className="text-base">مساعد تعلم اللغة الإنجليزية</CardTitle>
            {!isMinimized && <CardDescription className="text-xs">مدعوم بالذكاء الاصطناعي</CardDescription>}
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsMinimized(!isMinimized)}
            aria-label={isMinimized ? "توسيع" : "تصغير"}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)} aria-label="إغلاق">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          <ScrollArea className="flex-1 p-4 h-[calc(70vh-120px)] max-h-[480px]">
            <div className="space-y-4">
              {messages.map((message) => {
                const isUser = message.role === "user"
                const messageWords = englishWords[message.id] || []

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      isUser ? "justify-end" : "justify-start",
                      "animate-in fade-in-0 slide-in-from-bottom-3",
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 max-w-[85%] text-sm",
                        isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted border border-border/50 text-foreground",
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {isUser ? <User className="h-4 w-4 shrink-0" /> : <Bot className="h-4 w-4 shrink-0" />}
                        <span className="text-xs font-medium">{isUser ? "أنت" : "المساعد"}</span>
                      </div>
                      <div className="whitespace-pre-wrap">{message.content}</div>

                      {/* إضافة أزرار النطق للكلمات الإنجليزية - تحسين الأداء */}
                      {!isUser && messageWords.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {messageWords.slice(0, 10).map((word, index) => (
                            <div key={index} className="flex items-center bg-background/50 rounded px-1.5 py-0.5">
                              <span className="text-xs mr-1">{word}</span>
                              <PronunciationButton text={word} size="sm" variant="ghost" className="h-5 w-5 p-0" />
                            </div>
                          ))}
                          {messageWords.length > 10 && (
                            <span className="text-xs text-muted-foreground">+{messageWords.length - 10} كلمة أخرى</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <CardFooter className="p-3 pt-0 border-t">
            <form onSubmit={handleChatSubmit} className="flex w-full gap-2">
              <Input
                placeholder="اكتب سؤالك هنا..."
                value={input}
                onChange={handleInputChange}
                className="flex-1"
                disabled={isLoading || chatLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || chatLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </>
      )}
    </Card>
  )
}
