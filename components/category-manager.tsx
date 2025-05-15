"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Pencil, Trash, X, Check, FolderPlus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
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
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

export interface Category {
  id: string
  name: string
  color: string
}

interface CategoryManagerProps {
  categories: Category[]
  onCategoriesChange: (categories: Category[]) => void
  flashcardCount?: Record<string, number>
}

const DEFAULT_COLORS = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-cyan-500",
]

export function CategoryManager({ categories, onCategoriesChange, flashcardCount = {} }: CategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState(DEFAULT_COLORS[0])
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const { toast } = useToast()

  const addCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم للمجموعة",
        variant: "destructive",
      })
      return
    }

    // التحقق من عدم وجود مجموعة بنفس الاسم
    if (categories.some((cat) => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      toast({
        title: "خطأ",
        description: "توجد مجموعة بهذا الاسم بالفعل",
        variant: "destructive",
      })
      return
    }

    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      color: newCategoryColor,
    }

    onCategoriesChange([...categories, newCategory])
    setNewCategoryName("")
    setNewCategoryColor(DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)])

    toast({
      title: "تم بنجاح",
      description: `تم إنشاء مجموعة "${newCategory.name}" بنجاح`,
    })
  }

  const updateCategory = () => {
    if (!editingCategory) return
    if (!editingCategory.name.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم للمجموعة",
        variant: "destructive",
      })
      return
    }

    // التحقق من عدم وجود مجموعة أخرى بنفس الاسم
    if (
      categories.some(
        (cat) => cat.id !== editingCategory.id && cat.name.toLowerCase() === editingCategory.name.trim().toLowerCase(),
      )
    ) {
      toast({
        title: "خطأ",
        description: "توجد مجموعة بهذا الاسم بالفعل",
        variant: "destructive",
      })
      return
    }

    const updatedCategories = categories.map((cat) =>
      cat.id === editingCategory.id ? { ...cat, name: editingCategory.name.trim(), color: editingCategory.color } : cat,
    )

    onCategoriesChange(updatedCategories)
    setEditingCategory(null)

    toast({
      title: "تم بنجاح",
      description: `تم تحديث مجموعة "${editingCategory.name}" بنجاح`,
    })
  }

  const deleteCategory = (categoryId: string) => {
    const categoryToDelete = categories.find((cat) => cat.id === categoryId)
    if (!categoryToDelete) return

    const updatedCategories = categories.filter((cat) => cat.id !== categoryId)
    onCategoriesChange(updatedCategories)

    toast({
      title: "تم الحذف",
      description: `تم حذف مجموعة "${categoryToDelete.name}" بنجاح`,
    })
  }

  const startEditing = (category: Category) => {
    setEditingCategory({ ...category })
  }

  const cancelEditing = () => {
    setEditingCategory(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <h3 className="text-lg font-medium">المجموعات</h3>
        <p className="text-sm text-muted-foreground">قم بإنشاء وإدارة مجموعات البطاقات التعليمية</p>
      </div>

      <div className="grid gap-2">
        {categories.length === 0 ? (
          <div className="p-4 text-center border rounded-lg bg-muted/30">
            <p className="text-muted-foreground">لا توجد مجموعات بعد. قم بإنشاء مجموعة جديدة.</p>
          </div>
        ) : (
          categories.map((category) =>
            editingCategory && editingCategory.id === category.id ? (
              <div key={category.id} className="flex items-center gap-2 p-2 border rounded-lg">
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex gap-2">
                    {DEFAULT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-5 h-5 rounded-full ${color} ${
                          editingCategory.color === color ? "ring-2 ring-offset-2" : ""
                        }`}
                        onClick={() => setEditingCategory({ ...editingCategory, color })}
                        aria-label={`اختر اللون ${color}`}
                      />
                    ))}
                  </div>
                  <Input
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={cancelEditing}>
                    <X className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={updateCategory}>
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div key={category.id} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${category.color}`} />
                  <span>{category.name}</span>
                  {flashcardCount[category.id] !== undefined && (
                    <Badge variant="outline" className="ml-2">
                      {flashcardCount[category.id]} بطاقة
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => startEditing(category)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash className="w-4 h-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>حذف المجموعة</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من رغبتك في حذف مجموعة "{category.name}"؟ لن يتم حذف البطاقات الموجودة في هذه
                          المجموعة، ولكن سيتم إزالة تصنيفها.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteCategory(category.id)}>حذف</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ),
          )
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <div className="flex gap-2 flex-1">
          <div className="flex gap-2">
            {DEFAULT_COLORS.slice(0, 5).map((color) => (
              <button
                key={color}
                type="button"
                className={`w-5 h-5 rounded-full ${color} ${newCategoryColor === color ? "ring-2 ring-offset-2" : ""}`}
                onClick={() => setNewCategoryColor(color)}
                aria-label={`اختر اللون ${color}`}
              />
            ))}
          </div>
          <Input
            placeholder="اسم المجموعة الجديدة"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="flex-1"
          />
        </div>
        <Button onClick={addCategory} className="gap-1">
          <Plus className="w-4 h-4" />
          إضافة
        </Button>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full gap-1">
            <FolderPlus className="w-4 h-4" />
            إدارة المجموعات
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إدارة المجموعات</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${category.color}`} />
                    <span>{category.name}</span>
                    {flashcardCount[category.id] !== undefined && (
                      <Badge variant="outline" className="ml-2">
                        {flashcardCount[category.id]} بطاقة
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEditing(category)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash className="w-4 h-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف المجموعة</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من رغبتك في حذف مجموعة "{category.name}"؟ لن يتم حذف البطاقات الموجودة في هذه
                            المجموعة، ولكن سيتم إزالة تصنيفها.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteCategory(category.id)}>حذف</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="flex gap-2 flex-1">
                <div className="flex gap-2">
                  {DEFAULT_COLORS.slice(0, 5).map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-5 h-5 rounded-full ${color} ${
                        newCategoryColor === color ? "ring-2 ring-offset-2" : ""
                      }`}
                      onClick={() => setNewCategoryColor(color)}
                      aria-label={`اختر اللون ${color}`}
                    />
                  ))}
                </div>
                <Input
                  placeholder="اسم المجموعة الجديدة"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1"
                />
              </div>
              <Button onClick={addCategory} className="gap-1">
                <Plus className="w-4 h-4" />
                إضافة
              </Button>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button>تم</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
