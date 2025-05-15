"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Volume2, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface PronunciationDetailsProps {
  word: string
  voiceType?: string
}

interface PronunciationData {
  word: string
  ipa: string
  syllables: string
  stress: string
  tips: string
  similar: string[]
}

// إنشاء كاش للبيانات الصوتية لتحسين الأداء
const pronunciationCache = new Map<string, PronunciationData>()

export function PronunciationDetails({ word, voiceType = "default" }: PronunciationDetailsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [pronunciationData, setPronunciationData] = useState<PronunciationData | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    if (word) {
      fetchPronunciationData()
    }
  }, [word, voiceType])

  const fetchPronunciationData = async () => {
    // التحقق من وجود البيانات في الكاش
    const cacheKey = `${word}-${voiceType}`
    if (pronunciationCache.has(cacheKey)) {
      setPronunciationData(pronunciationCache.get(cacheKey)!)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/ai-pronunciation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: word, voice: voiceType }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()

      // التحقق من صحة البيانات المستلمة
      if (data && data.word) {
        setPronunciationData(data)
        // تخزين البيانات في الكاش
        pronunciationCache.set(cacheKey, data)
      } else {
        throw new Error("Invalid data format")
      }
    } catch (error) {
      console.error("Error fetching pronunciation data:", error)
      // تعيين بيانات افتراضية في حالة الخطأ
      const fallbackData = {
        word: word,
        ipa: "غير متاح",
        syllables: "غير متاح",
        stress: "غير متاح",
        tips: "غير متاح",
        similar: [],
      }
      setPronunciationData(fallbackData)
    } finally {
      setIsLoading(false)
    }
  }

  const speak = () => {
    if (!word || isSpeaking) return

    // إيقاف أي نطق سابق
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = "en-US"

    // الاستماع لأحداث النطق
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    // بدء النطق
    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  if (!word) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>معلومات النطق</span>
          <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={speak} disabled={isSpeaking}>
            {isSpeaking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
            <span>استماع</span>
          </Button>
        </CardTitle>
        <CardDescription>تفاصيل نطق كلمة "{word}"</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-5/6" />
            <Skeleton className="h-6 w-2/3" />
          </div>
        ) : pronunciationData ? (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">النطق الصوتي (IPA):</h4>
              <Badge variant="outline" className="text-lg font-mono">
                {pronunciationData.ipa}
              </Badge>
            </div>
            <div>
              <h4 className="font-medium mb-1">تقسيم المقاطع:</h4>
              <p>{pronunciationData.syllables}</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">النبر:</h4>
              <p>{pronunciationData.stress}</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">نصائح للنطق:</h4>
              <p>{pronunciationData.tips}</p>
            </div>
            {pronunciationData.similar && pronunciationData.similar.length > 0 && (
              <div>
                <h4 className="font-medium mb-1">كلمات مشابهة:</h4>
                <div className="flex flex-wrap gap-2">
                  {pronunciationData.similar.map((word, index) => (
                    <Badge key={index} variant="secondary">
                      {word}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">لا توجد معلومات متاحة</p>
        )}
      </CardContent>
    </Card>
  )
}
