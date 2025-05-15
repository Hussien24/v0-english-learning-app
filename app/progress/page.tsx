"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Calendar, CheckCircle, Award, Star } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Flashcard {
  id: string
  word: string
  meaning: string
  createdAt: number
  reviewCount?: number
  correctCount?: number
  lastReviewed?: number
}

export default function ProgressPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [totalReviews, setTotalReviews] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [mostReviewed, setMostReviewed] = useState<Flashcard[]>([])
  const [needsReview, setNeedsReview] = useState<Flashcard[]>([])
  const [recentlyAdded, setRecentlyAdded] = useState<Flashcard[]>([])

  useEffect(() => {
    const savedFlashcards = localStorage.getItem("flashcards")
    if (savedFlashcards) {
      try {
        const cards = JSON.parse(savedFlashcards)
        setFlashcards(cards)

        // Calculate total reviews and correct answers
        let reviews = 0
        let correct = 0
        cards.forEach((card: Flashcard) => {
          reviews += card.reviewCount || 0
          correct += card.correctCount || 0
        })
        setTotalReviews(reviews)
        setCorrectAnswers(correct)

        // Get most reviewed cards
        const sortedByReviews = [...cards]
          .filter((card) => (card.reviewCount || 0) > 0)
          .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
          .slice(0, 5)
        setMostReviewed(sortedByReviews)

        // Get cards that need review (low success rate)
        const needsReviewCards = [...cards]
          .filter((card) => (card.reviewCount || 0) > 0)
          .sort((a, b) => {
            const aRate = (a.correctCount || 0) / (a.reviewCount || 1)
            const bRate = (b.correctCount || 0) / (b.reviewCount || 1)
            return aRate - bRate
          })
          .slice(0, 5)
        setNeedsReview(needsReviewCards)

        // Get recently added cards
        const sortedByDate = [...cards].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
        setRecentlyAdded(sortedByDate)
      } catch (error) {
        console.error("Failed to parse saved flashcards:", error)
      }
    }
  }, [])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString()
  }

  const getSuccessRate = (card: Flashcard) => {
    if (!card.reviewCount || card.reviewCount === 0) return 0
    return Math.round(((card.correctCount || 0) / card.reviewCount) * 100)
  }

  const getOverallSuccessRate = () => {
    if (totalReviews === 0) return 0
    return Math.round((correctAnswers / totalReviews) * 100)
  }

  const getProgressLevel = () => {
    const rate = getOverallSuccessRate()
    if (rate >= 90) return "Master"
    if (rate >= 75) return "Advanced"
    if (rate >= 60) return "Intermediate"
    if (rate >= 40) return "Beginner"
    return "Novice"
  }

  const getLevelIcon = () => {
    const rate = getOverallSuccessRate()
    if (rate >= 90) return <Star className="w-6 h-6 text-yellow-500" />
    if (rate >= 75) return <Star className="w-6 h-6 text-blue-500" />
    if (rate >= 60) return <Star className="w-6 h-6 text-green-500" />
    if (rate >= 40) return <Star className="w-6 h-6 text-orange-500" />
    return <Star className="w-6 h-6 text-gray-500" />
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex items-center h-16 px-4 mx-auto">
          <Link href="/" className="flex items-center mr-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Link>
          <h1 className="text-2xl font-bold">Learning Progress</h1>
        </div>
      </header>

      <main className="container px-4 py-8 mx-auto">
        <div className="max-w-4xl mx-auto">
          {/* Overview Cards */}
          <div className="grid gap-6 mb-8 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Words</CardTitle>
                <Award className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{flashcards.length}</div>
                <p className="text-xs text-muted-foreground">
                  {flashcards.length === 1 ? "Word" : "Words"} in your collection
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getOverallSuccessRate()}%</div>
                <p className="text-xs text-muted-foreground">
                  {correctAnswers} correct out of {totalReviews} reviews
                </p>
                <Progress className="mt-2" value={getOverallSuccessRate()} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Current Level</CardTitle>
                <Award className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">{getProgressLevel()}</div>
                  {getLevelIcon()}
                </div>
                <p className="text-xs text-muted-foreground">Based on your quiz performance</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="most-reviewed" className="mb-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="most-reviewed">Most Reviewed</TabsTrigger>
              <TabsTrigger value="needs-review">Needs Review</TabsTrigger>
              <TabsTrigger value="recently-added">Recently Added</TabsTrigger>
            </TabsList>

            <TabsContent value="most-reviewed" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Most Reviewed Words</CardTitle>
                  <CardDescription>Words you've practiced the most</CardDescription>
                </CardHeader>
                <CardContent>
                  {mostReviewed.length > 0 ? (
                    <div className="space-y-4">
                      {mostReviewed.map((card) => (
                        <div key={card.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{card.word}</p>
                            <p className="text-sm text-muted-foreground">{card.meaning}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="mb-1">
                              {card.reviewCount} {card.reviewCount === 1 ? "review" : "reviews"}
                            </Badge>
                            <p className="text-sm">Success rate: {getSuccessRate(card)}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">
                      No review data available yet. Take some quizzes!
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="needs-review" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Words That Need Review</CardTitle>
                  <CardDescription>Focus on these words to improve your score</CardDescription>
                </CardHeader>
                <CardContent>
                  {needsReview.length > 0 ? (
                    <div className="space-y-4">
                      {needsReview.map((card) => (
                        <div key={card.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{card.word}</p>
                            <p className="text-sm text-muted-foreground">{card.meaning}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm mb-1">
                              <span className="text-green-500">{card.correctCount || 0} correct</span> /
                              <span className="text-red-500">
                                {" "}
                                {(card.reviewCount || 0) - (card.correctCount || 0)} wrong
                              </span>
                            </p>
                            <Progress value={getSuccessRate(card)} className="h-2 w-24" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">
                      No review data available yet. Take some quizzes!
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recently-added" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recently Added Words</CardTitle>
                  <CardDescription>Your newest flashcards</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentlyAdded.length > 0 ? (
                    <div className="space-y-4">
                      {recentlyAdded.map((card) => (
                        <div key={card.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{card.word}</p>
                            <p className="text-sm text-muted-foreground">{card.meaning}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="mb-1">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(card.createdAt)}
                            </Badge>
                            {card.reviewCount ? (
                              <p className="text-xs text-muted-foreground">
                                Reviewed {card.reviewCount} {card.reviewCount === 1 ? "time" : "times"}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground">Not reviewed yet</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">No flashcards added yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>Learning Statistics</CardTitle>
              <CardDescription>Your overall learning progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Words Mastered</p>
                    <p className="text-sm text-muted-foreground">
                      {
                        flashcards.filter(
                          (card) =>
                            (card.reviewCount || 0) > 0 && (card.correctCount || 0) / (card.reviewCount || 1) >= 0.9,
                        ).length
                      }{" "}
                      / {flashcards.length}
                    </p>
                  </div>
                  <Progress
                    value={
                      (flashcards.filter(
                        (card) =>
                          (card.reviewCount || 0) > 0 && (card.correctCount || 0) / (card.reviewCount || 1) >= 0.9,
                      ).length /
                        Math.max(1, flashcards.length)) *
                      100
                    }
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Words Reviewed</p>
                    <p className="text-sm text-muted-foreground">
                      {flashcards.filter((card) => (card.reviewCount || 0) > 0).length} / {flashcards.length}
                    </p>
                  </div>
                  <Progress
                    value={
                      (flashcards.filter((card) => (card.reviewCount || 0) > 0).length /
                        Math.max(1, flashcards.length)) *
                      100
                    }
                  />
                </div>

                <div className="pt-4 mt-4 border-t">
                  <p className="mb-4 font-medium">Learning Tips:</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Review words regularly to improve retention</li>
                    <li>• Focus on words with low success rates</li>
                    <li>• Try to use new words in sentences</li>
                    <li>• Take quizzes frequently to track your progress</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
