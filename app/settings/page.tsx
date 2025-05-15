"use client"

import { Badge } from "@/components/ui/badge"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Upload, Trash, Palette, Calendar } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { OfflineManager } from "@/components/offline-manager"

export default function SettingsPage() {
  const { setTheme, theme } = useTheme()
  const { toast } = useToast()
  const [flashcardCount, setFlashcardCount] = useState(0)
  const [offlineMode, setOfflineMode] = useState(false)

  useEffect(() => {
    const savedFlashcards = localStorage.getItem("flashcards")
    if (savedFlashcards) {
      try {
        const cards = JSON.parse(savedFlashcards)
        setFlashcardCount(cards.length)
      } catch (error) {
        console.error("Failed to parse saved flashcards:", error)
      }
    }

    const savedOfflineMode = localStorage.getItem("offlineMode")
    if (savedOfflineMode) {
      try {
        setOfflineMode(JSON.parse(savedOfflineMode))
      } catch (error) {
        console.error("Failed to parse offline mode setting:", error)
      }
    }
  }, [])

  const exportData = () => {
    try {
      const data = {
        flashcards: JSON.parse(localStorage.getItem("flashcards") || "[]"),
        preferences: {
          theme: theme,
          // Add other preferences here
        },
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "lingualearn-backup.json"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: "Your data has been exported successfully.",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting your data.",
        variant: "destructive",
      })
    }
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)

        if (data.flashcards) {
          localStorage.setItem("flashcards", JSON.stringify(data.flashcards))
          setFlashcardCount(data.flashcards.length)
        }

        if (data.preferences?.theme) {
          setTheme(data.preferences.theme)
        }

        toast({
          title: "Import Successful",
          description: `Imported ${data.flashcards.length} flashcards and preferences.`,
        })
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "The file format is invalid. Please select a valid backup file.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)

    // Reset the input
    event.target.value = ""
  }

  const clearAllData = () => {
    localStorage.removeItem("flashcards")
    setFlashcardCount(0)
    toast({
      title: "Data Cleared",
      description: "All flashcards have been deleted.",
    })
  }

  const toggleOfflineMode = () => {
    const newMode = !offlineMode
    setOfflineMode(newMode)
    localStorage.setItem("offlineMode", JSON.stringify(newMode))

    toast({
      title: newMode ? "تم تفعيل وضع عدم الاتصال" : "تم إلغاء وضع عدم الاتصال",
      description: newMode ? "سيتم تخزين جميع البيانات محليًا فقط." : "سيتم مزامنة البيانات عند توفر اتصال.",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex items-center h-16 px-4 mx-auto">
          <Link href="/" className="flex items-center mr-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </header>

      <main className="container px-4 py-8 mx-auto">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-bold">المظهر والتخصيص</h2>
            <Separator className="my-4" />

            <div className="flex items-center justify-between mb-4">
              <div>
                <Label htmlFor="dark-mode" className="text-base">
                  الوضع الداكن
                </Label>
                <p className="text-sm text-muted-foreground">التبديل بين السمات الفاتحة والداكنة</p>
              </div>
              <Switch
                id="dark-mode"
                checked={theme === "dark"}
                onCheckedChange={(checked) => {
                  setTheme(checked ? "dark" : "light")
                }}
              />
            </div>

            <Link href="/appearance">
              <Button variant="outline" className="w-full gap-2">
                <Palette className="w-4 h-4" />
                تخصيص المظهر
              </Button>
            </Link>
          </Card>

          <Card className="p-6 mb-6">
            <h2 className="text-xl font-bold">الميزات الإضافية</h2>
            <Separator className="my-4" />

            <div className="grid gap-4">
              <Link href="/daily-quiz">
                <Button variant="outline" className="w-full gap-2 justify-start">
                  <Calendar className="w-4 h-4" />
                  الاختبار اليومي
                  <Badge className="mr-auto" variant="secondary">
                    جديد
                  </Badge>
                </Button>
              </Link>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="offline-mode" className="text-base">
                    وضع عدم الاتصال
                  </Label>
                  <p className="text-sm text-muted-foreground">استخدام التطبيق بدون اتصال بالإنترنت</p>
                </div>
                <Switch id="offline-mode" checked={offlineMode} onCheckedChange={toggleOfflineMode} />
              </div>
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <h2 className="text-xl font-bold">Data Management</h2>
            <Separator className="my-4" />

            <div className="mb-6">
              <p className="text-sm text-muted-foreground">You currently have {flashcardCount} flashcards stored.</p>
            </div>

            <div className="grid gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="outline" className="gap-2" onClick={exportData}>
                  <Download className="w-4 h-4" />
                  Export Data
                </Button>

                <div className="relative">
                  <input
                    type="file"
                    id="import-file"
                    className="absolute inset-0 w-0 h-0 opacity-0"
                    accept=".json"
                    onChange={importData}
                  />
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => document.getElementById("import-file")?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    Import Data
                  </Button>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash className="w-4 h-4" />
                      Clear All Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will permanently delete all your flashcards and cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clearAllData}>Delete All</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold">About</h2>
            <Separator className="my-4" />

            <p className="text-muted-foreground">
              LinguaLearn is an English language learning application designed to help you improve your vocabulary
              through flashcards and quizzes.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">Version 1.0.0</p>
          </Card>
        </div>
      </main>

      <OfflineManager />
    </div>
  )
}
