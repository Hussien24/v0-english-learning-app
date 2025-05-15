import { NextResponse } from "next/server"
import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { arabicText, englishTranslation, words } = await req.json()

    if (!arabicText || !englishTranslation) {
      return NextResponse.json({ error: "يجب توفير النص العربي والترجمة الإنجليزية" }, { status: 400 })
    }

    // إنشاء طلب للنموذج
    const prompt = `
    أنت مساعد لغوي متخصص في تقييم الترجمات من العربية إلى الإنجليزية.
    
    النص العربي:
    ${arabicText}
    
    الترجمة الإنجليزية المقدمة:
    ${englishTranslation}
    
    الكلمات الإنجليزية التي يجب استخدامها في الترجمة:
    ${words ? words.join(", ") : "لا توجد كلمات محددة"}
    
    مهمتك: تقييم الترجمة المقدمة وتقديم تعليقات مفصلة باللغة العربية. قم بتقديم النتائج بتنسيق JSON كالتالي:
    
    {
      "score": [درجة من 0 إلى 100 بناءً على دقة الترجمة واستخدام الكلمات المطلوبة],
      "corrections": [مصفوفة من التصحيحات المحددة للأخطاء في الترجمة باللغة العربية],
      "suggestions": [مصفوفة من النصائح لتحسين الترجمة باللغة العربية],
      "modelParagraph": [ترجمة نموذجية للنص العربي تستخدم الكلمات المطلوبة باللغة الإنجليزية]
    }
    
    ملاحظات مهمة:
    1. يجب أن تكون جميع التصحيحات والنصائح باللغة العربية فقط.
    2. قدم نصائح مفيدة وعملية لتحسين مهارات الترجمة.
    3. تأكد من أن الترجمة النموذجية تستخدم جميع الكلمات المطلوبة بشكل صحيح.
    4. قيّم استخدام القواعد النحوية والمفردات والأسلوب.
    
    قدم النتائج بتنسيق JSON فقط، بدون أي نص إضافي.
    `

    // استخدام نموذج Groq لتقييم الترجمة
    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt,
      temperature: 0.3,
      maxTokens: 1000,
    })

    // استخراج JSON من النص
    let jsonData
    try {
      // البحث عن أول تنسيق JSON صالح في النص
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("لم يتم العثور على JSON صالح في الاستجابة")
      }
    } catch (error) {
      console.error("Error parsing JSON from response:", error)

      // إنشاء تقييم بسيط في حالة الفشل
      jsonData = {
        score: 70,
        corrections: ["تأكد من استخدام جميع الكلمات المطلوبة في ترجمتك."],
        suggestions: [
          "حاول استخدام جمل أكثر تنوعًا.",
          "تأكد من صحة القواعد النحوية.",
          "انتبه إلى ترتيب الكلمات في الجملة الإنجليزية.",
        ],
        modelParagraph: `Here is a model translation that uses all the required words: ${words ? words.join(", ") : ""}`,
      }
    }

    return NextResponse.json(jsonData)
  } catch (error) {
    console.error("Error evaluating translation:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء تقييم الترجمة" }, { status: 500 })
  }
}
