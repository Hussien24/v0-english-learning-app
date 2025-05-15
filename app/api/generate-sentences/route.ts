import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { words } = await req.json()

    if (!words || !Array.isArray(words) || words.length === 0) {
      return new Response(JSON.stringify({ error: "يجب توفير مصفوفة من الكلمات" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // تحديد عدد الكلمات التي سيتم معالجتها (بحد أقصى 10 كلمات في كل مرة)
    const wordsToProcess = words.slice(0, 10)

    const prompt = `
    أنشئ جملة إنجليزية واضحة وبسيطة لكل كلمة من الكلمات التالية. 
    يجب أن تكون الجملة مفيدة وتوضح معنى الكلمة في سياق واقعي.
    
    أعط الإجابة بتنسيق JSON فقط بالشكل التالي، بدون أي نص إضافي قبل أو بعد JSON:
    [
      {
        "word": "الكلمة",
        "sentence": "الجملة التي تستخدم الكلمة"
      }
    ]

    الكلمات:
    ${wordsToProcess.join(", ")}
    `

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt,
      temperature: 0.7,
      maxTokens: 1000,
    })

    // تحليل النص إلى JSON
    try {
      // تنظيف استجابة الذكاء الاصطناعي
      let cleanedResponse = text.trim()

      // البحث عن بداية ونهاية JSON
      const jsonStartIndex = cleanedResponse.indexOf("[")
      const jsonEndIndex = cleanedResponse.lastIndexOf("]") + 1

      if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
        // استخراج JSON فقط
        cleanedResponse = cleanedResponse.substring(jsonStartIndex, jsonEndIndex)
      }

      // محاولة تحليل JSON
      const sentences = JSON.parse(cleanedResponse)

      return new Response(JSON.stringify({ sentences }), {
        headers: { "Content-Type": "application/json" },
      })
    } catch (error) {
      console.error("Error parsing AI response:", error, text)

      // محاولة إنشاء جمل بسيطة كحل بديل
      const fallbackSentences = wordsToProcess.map((word) => ({
        word,
        sentence: `This is a sentence containing the word "${word}".`,
      }))

      return new Response(
        JSON.stringify({
          sentences: fallbackSentences,
          warning: "تم إنشاء جمل بسيطة بسبب خطأ في تحليل استجابة الذكاء الاصطناعي",
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      )
    }
  } catch (error) {
    console.error("Error generating sentences:", error)
    return new Response(JSON.stringify({ error: "حدث خطأ في معالجة طلبك" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
