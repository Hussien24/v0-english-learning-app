import { groq } from "@ai-sdk/groq"
import { streamText } from "ai"

export const maxDuration = 30 // السماح بالاستجابات المتدفقة حتى 30 ثانية

export async function POST(req: Request) {
  try {
    // استخراج الرسائل من طلب POST
    const { messages, context } = await req.json()

    // تحديد عدد الرسائل التي سيتم إرسالها للنموذج (للتحسين)
    const lastMessages = messages.slice(-5) // فقط آخر 5 رسائل

    // إنشاء سياق المساعد
    let systemPrompt = `أنت مساعد لتعلم اللغة الإنجليزية، مهمتك مساعدة المستخدمين على تعلم اللغة الإنجليزية.
    
    قم بتقديم:
    - شرح مختصر للكلمات والعبارات
    - أمثلة بسيطة على استخدام الكلمات
    - نصائح للتعلم والحفظ
    
    أجب باللغة العربية عندما يسأل المستخدم بالعربية، وبالإنجليزية عندما يسأل بالإنجليزية.
    كن مختصرًا ومباشرًا في إجاباتك.`

    // إذا كان هناك سياق إضافي (مثل بطاقات تعليمية)، أضفه إلى السياق
    if (context?.flashcards && context.flashcards.length > 0) {
      // تحديد عدد البطاقات التي سيتم إضافتها للسياق (للتحسين)
      const limitedFlashcards = context.flashcards.slice(0, 20) // فقط أول 20 بطاقة

      systemPrompt += `\n\nالمستخدم لديه البطاقات التعليمية التالية في مجموعته:
      ${limitedFlashcards.map((card: any) => `- ${card.word}: ${card.meaning}`).join("\n")}`
    }

    // استدعاء نموذج Groq مع إعدادات محسنة
    const result = streamText({
      model: groq("llama-3.1-8b-instant"), // استخدام نموذج أسرع
      messages: [{ role: "system", content: systemPrompt }, ...lastMessages],
      temperature: 0.7, // تقليل درجة الحرارة لاستجابات أسرع
      maxTokens: 500, // تحديد الحد الأقصى للرموز للحصول على استجابات أقصر
    })

    // إرجاع الاستجابة كتدفق
    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in AI assistant:", error)
    return new Response(JSON.stringify({ error: "حدث خطأ في معالجة طلبك" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
