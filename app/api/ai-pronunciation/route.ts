import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { text, voice = "default" } = await req.json()

    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "يجب توفير نص للنطق" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // تحديد نوع الصوت المطلوب
    let voicePrompt = "أنت خبير في نطق اللغة الإنجليزية."
    switch (voice) {
      case "american":
        voicePrompt = "أنت متحدث أمريكي أصلي للغة الإنجليزية مع نطق واضح ومثالي."
        break
      case "british":
        voicePrompt = "أنت متحدث بريطاني أصلي للغة الإنجليزية مع نطق واضح ومثالي."
        break
      case "slow":
        voicePrompt = "أنت معلم لغة إنجليزية يتحدث ببطء وبوضوح لمساعدة المتعلمين."
        break
      default:
        voicePrompt = "أنت متحدث أصلي للغة الإنجليزية مع نطق واضح ومثالي."
    }

    // إنشاء الطلب للحصول على معلومات النطق
    const prompt = `
    ${voicePrompt}
    
    قم بتوفير معلومات النطق التالية للنص: "${text}"
    
    1. النطق الصوتي (IPA): كيف ينطق النص باستخدام الأبجدية الصوتية الدولية
    2. تقسيم المقاطع: كيف يتم تقسيم الكلمة إلى مقاطع صوتية
    3. النبر: أين يقع النبر في الكلمة
    4. نصائح للنطق: أي نصائح خاصة لنطق هذه الكلمة بشكل صحيح (تجنب استخدام علامات الاقتباس داخل النص)
    5. كلمات مشابهة: كلمات تشبه هذه الكلمة في النطق للمساعدة في التعلم
    
    أعط الإجابة بتنسيق JSON فقط بالشكل التالي، وتأكد من عدم استخدام علامات الاقتباس داخل النصوص:
    {
      "word": "الكلمة الأصلية",
      "ipa": "النطق الصوتي",
      "syllables": "تقسيم-المقاطع",
      "stress": "موقع النبر",
      "tips": "نصائح للنطق مفصولة بفواصل منقوطة",
      "similar": ["كلمة مشابهة 1", "كلمة مشابهة 2"]
    }
    `

    const { text: aiResponse } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt,
      temperature: 0.2,
      maxTokens: 500,
    })

    // تحليل النص إلى JSON
    try {
      // تنظيف استجابة الذكاء الاصطناعي
      let cleanedResponse = aiResponse.trim()

      // إزالة أي أكواد ماركداون محتملة
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse.replace(/```json\s*/, "")
        cleanedResponse = cleanedResponse.replace(/\s*```\s*$/, "")
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.replace(/```\s*/, "")
        cleanedResponse = cleanedResponse.replace(/\s*```\s*$/, "")
      }

      // إزالة أي أحرف غير مرغوب فيها في بداية النص
      cleanedResponse = cleanedResponse.replace(/^[^{[]+/, "")

      // محاولة إنشاء كائن JSON من الصفر بناءً على المحتوى
      try {
        // استخراج البيانات باستخدام تعبيرات منتظمة
        const wordMatch = cleanedResponse.match(/"word"\s*:\s*"([^"]+)"/)
        const ipaMatch = cleanedResponse.match(/"ipa"\s*:\s*"([^"]+)"/)
        const syllablesMatch = cleanedResponse.match(/"syllables"\s*:\s*"([^"]+)"/)
        const stressMatch = cleanedResponse.match(/"stress"\s*:\s*"([^"]+)"/)
        const tipsMatch = cleanedResponse.match(/"tips"\s*:\s*"([^"]*)"/)

        // استخراج الكلمات المشابهة
        const similarMatch = cleanedResponse.match(/"similar"\s*:\s*\[(.*?)\]/s)
        let similar = []
        if (similarMatch && similarMatch[1]) {
          // استخراج الكلمات من مصفوفة النص
          const similarWords = similarMatch[1].match(/"([^"]*)"/g)
          if (similarWords) {
            similar = similarWords.map((word) => word.replace(/"/g, ""))
          }
        }

        // إنشاء كائن البيانات
        const pronunciationData = {
          word: wordMatch && wordMatch[1] ? wordMatch[1] : text,
          ipa: ipaMatch && ipaMatch[1] ? ipaMatch[1] : "غير متاح",
          syllables: syllablesMatch && syllablesMatch[1] ? syllablesMatch[1] : "غير متاح",
          stress: stressMatch && stressMatch[1] ? stressMatch[1] : "غير متاح",
          tips: tipsMatch && tipsMatch[1] ? tipsMatch[1] : "غير متاح",
          similar: similar.length > 0 ? similar : [],
        }

        return new Response(JSON.stringify(pronunciationData), {
          headers: { "Content-Type": "application/json" },
        })
      } catch (regexError) {
        console.error("Error extracting data with regex:", regexError)

        // إنشاء استجابة منظمة يدويًا كخطة بديلة
        const fallbackResponse = {
          word: text,
          ipa: "غير متاح",
          syllables: "غير متاح",
          stress: "غير متاح",
          tips: "غير متاح",
          similar: [],
        }

        return new Response(JSON.stringify(fallbackResponse), {
          headers: { "Content-Type": "application/json" },
        })
      }
    } catch (error) {
      console.error("Error parsing AI response:", error, aiResponse)

      // إنشاء استجابة منظمة يدويًا
      const fallbackResponse = {
        word: text,
        ipa: "غير متاح",
        syllables: "غير متاح",
        stress: "غير متاح",
        tips: "غير متاح",
        similar: [],
      }

      return new Response(JSON.stringify(fallbackResponse), {
        headers: { "Content-Type": "application/json" },
      })
    }
  } catch (error) {
    console.error("Error generating pronunciation:", error)
    return new Response(JSON.stringify({ error: "حدث خطأ في معالجة طلبك" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
