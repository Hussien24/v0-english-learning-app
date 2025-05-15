"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, Settings, Info, Loader2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

interface PronunciationButtonProps {
  text: string
  size?: "default" | "sm" | "lg" | "icon"
  variant?: "default" | "outline" | "ghost"
  showText?: boolean
  className?: string
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

export function PronunciationButton({
  text,
  size = "icon",
  variant = "ghost",
  showText = false,
  className,
}: PronunciationButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [useAI, setUseAI] = useState(true)
  const [voiceType, setVoiceType] = useState<string>("default")
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [pronunciationData, setPronunciationData] = useState<PronunciationData | null>(null)
  const [showPronunciationInfo, setShowPronunciationInfo] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // تحقق من دعم المتصفح للـ Speech Synthesis
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!("speechSynthesis" in window)) {
        setIsSupported(false)
        return
      }

      // الحصول على الأصوات المتاحة
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices()
        // تصفية الأصوات الإنجليزية فقط
        const englishVoices = voices.filter((voice) => voice.lang.includes("en") || voice.lang.includes("EN"))
        setAvailableVoices(englishVoices)

        // اختيار صوت افتراضي (الأول باللغة الإنجليزية إن وجد)
        if (englishVoices.length > 0 && !selectedVoice) {
          setSelectedVoice(englishVoices[0])
        }
      }

      // تحميل الأصوات المتاحة
      loadVoices()

      // بعض المتصفحات تحتاج إلى الاستماع لحدث onvoiceschanged
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices
      }

      // إنشاء عنصر الصوت
      if (!audioRef.current) {
        audioRef.current = new Audio()
        audioRef.current.onended = () => setIsSpeaking(false)
        audioRef.current.onerror = () => {
          setIsSpeaking(false)
          console.error("Audio playback error")
        }
      }
    }
  }, [selectedVoice])

  // وظيفة للحصول على بيانات النطق من الذكاء الاصطناعي
  const fetchAIPronunciation = async (word: string) => {
    // التحقق من وجود البيانات في الكاش
    if (pronunciationCache.has(word)) {
      setPronunciationData(pronunciationCache.get(word)!)
      return
    }

    setIsLoadingAI(true)
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
        pronunciationCache.set(word, data)
      } else {
        console.error("Invalid pronunciation data received:", data)
      }
    } catch (error) {
      console.error("Error fetching AI pronunciation:", error)
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
      setIsLoadingAI(false)
    }
  }

  // وظيفة نطق النص
  const speak = () => {
    if (!isSupported || !text.trim()) return

    if (useAI) {
      // استخدام الذكاء الاصطناعي للنطق
      fetchAIPronunciation(text)
    }

    // إيقاف أي نطق سابق
    if (audioRef.current) {
      audioRef.current.pause()
    }
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)

    // تعيين الصوت المحدد إذا كان متاحًا
    if (selectedVoice) {
      utterance.voice = selectedVoice
    }

    // تعيين معدل السرعة والنبرة
    utterance.rate = rate
    utterance.pitch = pitch

    // تعيين اللغة الإنجليزية إذا لم يتم تحديد صوت
    if (!selectedVoice) {
      utterance.lang = "en-US"
    }

    // الاستماع لأحداث النطق
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    // بدء النطق
    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  // إيقاف النطق
  const stopSpeaking = () => {
    if (isSupported) {
      window.speechSynthesis.cancel()
      if (audioRef.current) {
        audioRef.current.pause()
      }
      setIsSpeaking(false)
    }
  }

  // تنفيذ النطق أو الإيقاف عند النقر على الزر
  const handleClick = () => {
    if (isSpeaking) {
      stopSpeaking()
    } else {
      speak()
    }
  }

  return (
    <div className="flex items-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleClick}
              variant={variant}
              size={size}
              className={cn(
                "transition-all",
                isSpeaking && "animate-pulse text-primary",
                !isSupported && "opacity-50 cursor-not-allowed",
                className,
              )}
              disabled={!isSupported || isLoadingAI}
            >
              {isLoadingAI ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSpeaking ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
              {showText && <span className="ml-2">{isSpeaking ? "إيقاف" : "استماع"}</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isSupported ? (isSpeaking ? "إيقاف النطق" : "استمع إلى النطق") : "متصفحك لا يدعم خاصية النطق"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isSupported && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-1">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>إعدادات النطق</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <div className="px-2 py-1.5">
                <div className="flex items-center space-x-2 mb-2">
                  <Label htmlFor="use-ai" className="flex-1">
                    استخدام الذكاء الاصطناعي
                  </Label>
                  <Switch id="use-ai" checked={useAI} onCheckedChange={setUseAI} />
                </div>
              </div>

              {useAI && (
                <DropdownMenuRadioGroup value={voiceType} onValueChange={setVoiceType}>
                  <DropdownMenuRadioItem value="default">صوت افتراضي</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="american">لهجة أمريكية</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="british">لهجة بريطانية</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="slow">نطق بطيء للمتعلمين</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              )}

              <DropdownMenuSeparator />

              <div className="px-2 py-1.5">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm">السرعة: {rate.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[rate]}
                  min={0.5}
                  max={2}
                  step={0.1}
                  onValueChange={(value) => setRate(value[0])}
                  className="mb-3"
                />

                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm">النبرة: {pitch.toFixed(1)}</span>
                </div>
                <Slider value={[pitch]} min={0.5} max={2} step={0.1} onValueChange={(value) => setPitch(value[0])} />
              </div>

              {!useAI && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>الأصوات المتاحة</DropdownMenuLabel>
                  <div className="max-h-40 overflow-y-auto">
                    {availableVoices.length > 0 ? (
                      availableVoices.map((voice) => (
                        <DropdownMenuItem
                          key={voice.name}
                          className={cn("cursor-pointer", selectedVoice?.name === voice.name && "bg-primary/10")}
                          onClick={() => setSelectedVoice(voice)}
                        >
                          {voice.name} ({voice.lang})
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">لا توجد أصوات متاحة</div>
                    )}
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {useAI && (
            <Dialog open={showPronunciationInfo} onOpenChange={setShowPronunciationInfo}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-1"
                  onClick={() => {
                    if (!pronunciationData && !isLoadingAI) {
                      fetchAIPronunciation(text)
                    }
                  }}
                >
                  <Info className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>معلومات النطق</DialogTitle>
                  <DialogDescription>تفاصيل نطق الكلمة باستخدام الذكاء الاصطناعي</DialogDescription>
                </DialogHeader>

                {isLoadingAI ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-5/6" />
                    <Skeleton className="h-6 w-2/3" />
                  </div>
                ) : pronunciationData ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-1">الكلمة:</h4>
                      <p className="text-lg">{pronunciationData.word}</p>
                    </div>
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

                <DialogFooter>
                  <DialogClose asChild>
                    <Button>إغلاق</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </div>
  )
}
