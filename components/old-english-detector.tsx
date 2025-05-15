"use client"

import { useState, useEffect } from "react"
import { checkOldEnglishWord, findOldEnglishWords } from "@/lib/old-english-checker"
import { ArchaicWordBadge } from "@/components/archaic-word-badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History } from "lucide-react"

interface OldEnglishDetectorProps {
  word: string
  showAlert?: boolean
}

export function OldEnglishDetector({ word, showAlert = true }: OldEnglishDetectorProps) {
  const [result, setResult] = useState<ReturnType<typeof checkOldEnglishWord> | null>(null)
  const [multipleResults, setMultipleResults] = useState<ReturnType<typeof findOldEnglishWords>>([])

  useEffect(() => {
    if (!word.trim()) {
      setResult(null)
      setMultipleResults([])
      return
    }

    // Check if it's a single word or multiple words
    const words = word.trim().split(/\s+/)
    if (words.length === 1) {
      setResult(checkOldEnglishWord(word))
      setMultipleResults([])
    } else {
      setResult(null)
      setMultipleResults(findOldEnglishWords(word))
    }
  }, [word])

  // If no archaic words found, don't render anything
  if ((!result || !result.isArchaic) && multipleResults.length === 0) {
    return null
  }

  // For a single archaic word
  if (result && result.isArchaic && !showAlert) {
    return <ArchaicWordBadge category={result.category || "Archaic"} meaning={result.meaning || ""} />
  }

  // For multiple words or when showing an alert
  return (
    <Alert
      variant="warning"
      className="mt-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50"
    >
      <History className="h-4 w-4" />
      <AlertTitle>Archaic Word{multipleResults.length > 1 ? "s" : ""} Detected</AlertTitle>
      <AlertDescription>
        {result && result.isArchaic ? (
          <div className="mt-2">
            <p>
              <span className="font-medium">{word}</span> is considered a{" "}
              <ArchaicWordBadge
                category={result.category || "Archaic"}
                meaning={result.meaning || ""}
                className="ml-1"
              />{" "}
              word.
            </p>
            <p className="text-sm mt-1">Meaning: {result.meaning}</p>
          </div>
        ) : multipleResults.length > 0 ? (
          <div className="mt-2">
            <p>The following archaic words were detected:</p>
            <ScrollArea className="h-[100px] mt-2">
              <div className="space-y-2">
                {multipleResults.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <span className="font-medium mr-2">{item.word}:</span>
                    <ArchaicWordBadge category={item.category || "Archaic"} meaning={item.meaning || ""} />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : null}
        <p className="text-sm mt-3">
          These words are not commonly used in modern English. Consider using a more contemporary alternative if you're
          learning everyday English.
        </p>
      </AlertDescription>
    </Alert>
  )
}
