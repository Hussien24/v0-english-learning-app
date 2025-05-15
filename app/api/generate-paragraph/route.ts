import { NextResponse } from "next/server"
import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const {
      words,
      language = "arabic",
      fullArabic = false,
      randomWords = false,
      excludeWords = [],
      difficultyLevel = "medium",
    } = await req.json()

    // تحديد اللغة المطلوبة
    const targetLanguage = language === "arabic" ? "العربية" : "الإنجليزية"

    let prompt = ""
    let usedWords: string[] = []

    // تحديد مستوى الصعوبة
    const complexityLevel =
      difficultyLevel === "easy"
        ? "بسيطة جداً ومناسبة للمبتدئين"
        : difficultyLevel === "medium"
          ? "متوسطة الصعوبة"
          : "متقدمة ومعقدة نسبياً"

    if (randomWords) {
      // توليد فقرة بكلمات عشوائية جديدة
      const randomWordCount =
        difficultyLevel === "easy"
          ? Math.floor(Math.random() * 3) + 3 // 3-5 كلمات للمستوى السهل
          : difficultyLevel === "medium"
            ? Math.floor(Math.random() * 3) + 5 // 5-7 كلمات للمستوى المتوسط
            : Math.floor(Math.random() * 3) + 8 // 8-10 كلمات للمستوى الصعب

      prompt = `
      أنت مساعد لغوي متخصص في تعليم اللغة الإنجليزية للناطقين بالعربية.
      
      مهمتك: إنشاء فقرة باللغة العربية تستخدم ${randomWordCount} كلمات إنجليزية مفيدة وشائعة الاستخدام للمتعلمين.
      
      قواعد مهمة:
      1. يجب أن تكون الفقرة كاملة باللغة العربية، مع ذكر الترجمة العربية للكلمات الإنجليزية.
      2. لا تكتب أي كلمة إنجليزية في النص، فقط استخدم المعنى العربي للكلمات.
      3. اختر كلمات إنجليزية مفيدة ومتنوعة (أفعال، أسماء، صفات) مناسبة لمستوى ${complexityLevel}.
      4. يجب أن تكون الفقرة مترابطة ومنطقية وذات معنى.
      5. يجب أن تكون الفقرة بين ${difficultyLevel === "easy" ? "2-3" : difficultyLevel === "medium" ? "3-4" : "4-6"} جمل.
      6. في نهاية الفقرة، قدم قائمة بالكلمات الإنجليزية المستخدمة وترجمتها بتنسيق JSON كالتالي:
      
      {
        "paragraph": "النص العربي هنا بدون أي كلمات إنجليزية...",
        "usedWords": ["كلمة1", "كلمة2", "كلمة3"]
      }
      
      ملاحظة: تجنب استخدام هذه الكلمات: ${excludeWords.join(", ")}
      `
    } else if (words && Array.isArray(words)) {
      // تحضير قائمة الكلمات مع ترجماتها
      const wordsList = words
        .map((item) => {
          if (typeof item === "string") {
            return item
          } else if (item.word && item.translation) {
            return `${item.word} (${item.translation})`
          }
          return item.word || item.translation || item
        })
        .join(", ")

      // إنشاء طلب للنموذج
      prompt = `
      أنت مساعد لغوي متخصص في إنشاء فقرات تعليمية.
      
      مهمتك: إنشاء فقرة باللغة ${targetLanguage} تستخدم معاني جميع الكلمات التالية بطريقة طبيعية ومترابطة:
      ${wordsList}
      
      قواعد مهمة:
      1. يجب أن تستخدم معاني جميع الكلمات المذكورة أعلاه في الفقرة.
      2. يجب أن تكون الفقرة مترابطة ومنطقية وذات معنى.
      3. يجب أن تكون الفقرة مناسبة لمتعلمي اللغة الإنجليزية بمستوى ${complexityLevel}.
      4. الفقرة يجب أن تكون بين ${difficultyLevel === "easy" ? "2-3" : difficultyLevel === "medium" ? "3-4" : "4-6"} جمل.
      5. يجب أن تكون الفقرة كاملة باللغة العربية، ولا تستخدم أي كلمات إنجليزية مطلقاً.
      6. استخدم المعنى العربي للكلمات الإنجليزية في الفقرة.
      7. أرجع الفقرة فقط بدون أي مقدمات أو تعليقات إضافية.
      
      الفقرة:
      `
    } else {
      return NextResponse.json({ error: "يجب توفير مصفوفة من الكلمات" }, { status: 400 })
    }

    // استخدام نموذج Groq لإنشاء الفقرة
    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt,
      temperature: 0.7,
      maxTokens: 800,
    })

    // تنظيف النص وإزالة أي علامات اقتباس زائدة
    let cleanedText = text.trim().replace(/^["']|["']$/g, "")

    // إذا كان النص يحتوي على JSON، استخرج البيانات منه
    if (randomWords && cleanedText.includes('"paragraph"')) {
      try {
        // استخراج الجزء JSON من النص
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const jsonData = JSON.parse(jsonMatch[0])
          cleanedText = jsonData.paragraph || cleanedText
          usedWords = jsonData.usedWords || []
        }
      } catch (error) {
        console.error("Error parsing JSON from response:", error)
      }
    }

    // تنظيف النص من أي كلمات إنجليزية متبقية
    cleanedText = cleanedText.replace(/\[.*?\]/g, "") // إزالة أي نص بين أقواس مربعة
    cleanedText = cleanedText.replace(/$$.*?$$/g, "") // إزالة أي نص بين أقواس

    // إزالة أي كلمات إنجليزية متبقية (الحروف اللاتينية)
    cleanedText = cleanedText.replace(/[a-zA-Z]+/g, "")

    // إزالة الفراغات المتكررة
    cleanedText = cleanedText.replace(/\s+/g, " ").trim()

    return NextResponse.json({
      paragraph: cleanedText,
      usedWords: usedWords.length > 0 ? usedWords : undefined,
    })
  } catch (error) {
    console.error("Error generating paragraph:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء الفقرة" }, { status: 500 })
  }
}
