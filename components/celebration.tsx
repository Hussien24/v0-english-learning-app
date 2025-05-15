"use client"

import { useEffect, useRef } from "react"
import confetti from "canvas-confetti"
import { Trophy, Star, Award } from "lucide-react"

interface CelebrationProps {
  score: number
}

export function Celebration({ score }: CelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    })

    // تشغيل الاحتفال
    const duration = 3 * 1000
    const end = Date.now() + duration

    const colors = ["#ffd700", "#0099ff", "#ff4081", "#00e676", "#651fff"]
    ;(function frame() {
      myConfetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      })
      myConfetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    })()

    // تشغيل احتفال كبير في البداية
    myConfetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors,
    })

    return () => {
      // تنظيف
    }
  }, [])

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-50 pointer-events-none"
        style={{ width: "100%", height: "100%" }}
      />
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-primary/10">
          {score >= 100 ? (
            <Trophy className="w-12 h-12 text-yellow-500" />
          ) : (
            <Award className="w-12 h-12 text-primary" />
          )}
        </div>
        <h2 className="mb-2 text-3xl font-bold">رائع! 🎉</h2>
        <div className="flex items-center justify-center mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-8 h-8 ${i < Math.ceil(score / 20) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
            />
          ))}
        </div>
        <p className="mb-6 text-xl">
          لقد أكملت الاختبار بنتيجة <span className="font-bold text-primary">{score.toFixed(0)}%</span>
        </p>
        <p className="text-muted-foreground">استمر في التعلم للحفاظ على هذا المستوى الرائع!</p>
      </div>
    </div>
  )
}
