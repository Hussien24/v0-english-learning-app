"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { InfoIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { checkOldEnglishWord } from "@/lib/old-english-checker"

interface ArchaicWordBadgeProps {
  category?: string
  meaning?: string
  word?: string
  className?: string
}

export function ArchaicWordBadge({ category, meaning, word, className }: ArchaicWordBadgeProps) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)
  const [wordInfo, setWordInfo] = useState<{ isArchaic: boolean; category: string; meaning: string } | null>(null)

  useEffect(() => {
    if (word) {
      const result = checkOldEnglishWord(word)
      if (result.isArchaic) {
        setWordInfo(result)
      }
    } else if (category && meaning) {
      setWordInfo({
        isArchaic: true,
        category,
        meaning,
      })
    }
  }, [word, category, meaning])

  // Si no hay información de palabra arcaica, no renderizar nada
  if (!wordInfo || !wordInfo.isArchaic) {
    return null
  }

  const getBadgeColor = () => {
    if (wordInfo.category === "Old English") {
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50"
    }
    return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50"
  }

  return (
    <TooltipProvider>
      <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={cn("cursor-help transition-colors", getBadgeColor(), className)}>
            <InfoIcon className="w-3 h-3 mr-1" />
            {wordInfo.category}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium">This word is considered {wordInfo.category.toLowerCase()}</p>
          <p className="text-sm mt-1">Meaning: {wordInfo.meaning}</p>
          <p className="text-xs mt-2 text-muted-foreground">
            {wordInfo.category === "Old English"
              ? "Old English words are from the historical period (450-1150 CE)"
              : "Archaic words are no longer in common use in modern English"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
