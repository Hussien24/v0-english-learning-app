"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, MoreHorizontal, Check, Volume2, Star, Clock, Bookmark } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PronunciationButton } from "@/components/pronunciation-button"
import { ArchaicWordBadge } from "@/components/archaic-word-badge"
import { motion, AnimatePresence } from "framer-motion"

export interface Flashcard {
  id: string
  word: string
  meaning: string
  categoryId?: string
  createdAt: number
  reviewCount?: number
  correctCount?: number
  lastReviewed?: number
}

export interface Category {
  id: string
  name: string
  color: string
}

interface FlashcardItemProps {
  flashcard: Flashcard
  categories: Category[]
  onDelete: () => void
  onEdit: (flashcard: Flashcard) => void
  isSelectMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (word: string) => void
  onReview?: (id: string) => void
}

export function FlashcardItem({
  flashcard,
  categories,
  onDelete,
  onEdit,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
  onReview,
}: FlashcardItemProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // تأثير لإضافة تفاعل لمس للبطاقات على الأجهزة المحمولة
  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleTouchStart = () => {
      setIsHovering(true)
    }

    const handleTouchEnd = () => {
      setTimeout(() => setIsHovering(false), 500)
    }

    card.addEventListener("touchstart", handleTouchStart)
    card.addEventListener("touchend", handleTouchEnd)

    return () => {
      card.removeEventListener("touchstart", handleTouchStart)
      card.removeEventListener("touchend", handleTouchEnd)
    }
  }, [])

  // الحصول على معلومات الفئة
  const category = flashcard.categoryId ? categories.find((cat) => cat.id === flashcard.categoryId) : null

  // حساب نسبة النجاح
  const successRate =
    flashcard.reviewCount && flashcard.reviewCount > 0
      ? Math.round(((flashcard.correctCount || 0) / flashcard.reviewCount) * 100)
      : null

  // تحديد حالة البطاقة
  const getCardStatus = () => {
    if (!flashcard.reviewCount || flashcard.reviewCount === 0) {
      return { label: "جديدة", color: "bg-blue-500", icon: <Bookmark className="h-3 w-3" /> }
    }

    const rate = (flashcard.correctCount || 0) / flashcard.reviewCount
    if (rate >= 0.9) {
      return { label: "متقن", color: "bg-green-500", icon: <Star className="h-3 w-3" /> }
    } else if (rate >= 0.4) {
      return { label: "قيد التعلم", color: "bg-yellow-500", icon: <Clock className="h-3 w-3" /> }
    } else {
      return { label: "تحتاج مراجعة", color: "bg-red-500", icon: <Volume2 className="h-3 w-3" /> }
    }
  }

  const status = getCardStatus()

  // تنسيق التاريخ
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString()
  }

  // تنسيق الوقت المنقضي
  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)

    let interval = Math.floor(seconds / 31536000)
    if (interval >= 1) {
      return `منذ ${interval} ${interval === 1 ? "سنة" : "سنوات"}`
    }
    interval = Math.floor(seconds / 2592000)
    if (interval >= 1) {
      return `منذ ${interval} ${interval === 1 ? "شهر" : "أشهر"}`
    }
    interval = Math.floor(seconds / 86400)
    if (interval >= 1) {
      return `منذ ${interval} ${interval === 1 ? "يوم" : "أيام"}`
    }
    interval = Math.floor(seconds / 3600)
    if (interval >= 1) {
      return `منذ ${interval} ${interval === 1 ? "ساعة" : "ساعات"}`
    }
    interval = Math.floor(seconds / 60)
    if (interval >= 1) {
      return `منذ ${interval} ${interval === 1 ? "دقيقة" : "دقائق"}`
    }
    return "منذ لحظات"
  }

  // معالجة النقر على البطاقة
  const handleCardClick = () => {
    if (isSelectMode && onToggleSelect) {
      onToggleSelect(flashcard.word)
    } else {
      setIsFlipped(!isFlipped)
      if (!isFlipped && onReview) {
        onReview(flashcard.id)
      }
    }
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -5 }}
      className="perspective"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        className={`relative w-full h-full cursor-pointer ${
          isSelectMode ? "ring-2 ring-offset-2 " + (isSelected ? "ring-primary" : "ring-transparent") : ""
        }`}
        onClick={handleCardClick}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={isFlipped ? "back" : "front"}
            initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="preserve-3d backface-hidden"
          >
            <Card
              className={`border-2 overflow-hidden ${
                isFlipped ? "bg-primary/5 border-primary/20" : "bg-card border-border"
              } transition-all duration-300 hover:shadow-lg`}
            >
              {/* شريط الحالة */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${status.color} transition-all duration-300 ${
                  isHovering ? "opacity-100" : "opacity-70"
                }`}
              ></div>

              <CardContent className="p-5">
                {isFlipped ? (
                  // الجانب الخلفي - المعنى
                  <div className="flex flex-col space-y-3">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="mb-2 flex items-center gap-1">
                        {status.icon}
                        <span>{status.label}</span>
                      </Badge>
                      {category && (
                        <Badge className={`${category.color} text-white`} variant="secondary">
                          {category.name}
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-primary">{flashcard.word}</h3>
                    <p className="text-lg" dir="rtl">
                      {flashcard.meaning}
                    </p>

                    <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                      <span>أضيفت {getTimeAgo(flashcard.createdAt)}</span>
                      {flashcard.reviewCount ? (
                        <span>
                          تمت المراجعة {flashcard.reviewCount} مرة ({successRate}%)
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  // الجانب الأمامي - الكلمة
                  <div className="flex flex-col items-center justify-center min-h-[180px] text-center">
                    <div className="absolute top-3 left-3 flex items-center space-x-1 rtl:space-x-reverse">
                      <Badge variant="outline" className="flex items-center gap-1">
                        {status.icon}
                        <span>{status.label}</span>
                      </Badge>
                    </div>

                    {category && (
                      <Badge className={`${category.color} text-white absolute top-3 right-3`} variant="secondary">
                        {category.name}
                      </Badge>
                    )}

                    <div className="flex flex-col items-center justify-center flex-grow py-6">
                      <h3 className="text-2xl font-bold mb-2">{flashcard.word}</h3>
                      <div className="mt-2">{flashcard.word && <ArchaicWordBadge word={flashcard.word} />}</div>
                      <div className="mt-3">
                        <PronunciationButton text={flashcard.word} />
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground absolute bottom-3 left-0 right-0 text-center">
                      انقر للكشف عن المعنى
                    </div>
                  </div>
                )}
              </CardContent>

              {/* أزرار التحكم */}
              <AnimatePresence>
                {isHovering && !isSelectMode && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-2 right-2 z-10"
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>خيارات البطاقة</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit(flashcard)
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          <span>تعديل</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete()
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>حذف</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* أيقونة التحديد في وضع الاختيار */}
              {isSelectMode && (
                <div className="absolute top-2 left-2 z-10">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-background border-muted-foreground/30"
                    }`}
                  >
                    {isSelected && <Check className="h-4 w-4" />}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
