// هذا الملف يجب أن يكون في المجلد العام (public) في مشروع Next.js
// ولكن لأغراض العرض، سنضعه هنا

// تعريف الإصدار للتحكم في التخزين المؤقت
const CACHE_VERSION = "v1"
const CACHE_NAME = `lingualearn-${CACHE_VERSION}`

// قائمة الملفات التي سيتم تخزينها مؤقتًا للاستخدام في وضع عدم الاتصال
const STATIC_ASSETS = ["/", "/flashcards", "/quiz", "/daily-quiz", "/progress", "/settings", "/appearance"]

// تثبيت خدمة العامل وتخزين الأصول الثابتة
self.addEventListener("install", (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    }),
  )
})

// تنشيط خدمة العامل وحذف التخزينات المؤقتة القديمة
self.addEventListener("activate", (event: any) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith("lingualearn-") && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      )
    }),
  )
})

// اعتراض طلبات الشبكة وتقديم الاستجابات المخزنة مؤقتًا عند الحاجة
self.addEventListener("fetch", (event: any) => {
  // تجاهل طلبات API وطلبات غير GET
  if (
    event.request.method !== "GET" ||
    event.request.url.includes("/api/") ||
    event.request.url.includes("chrome-extension")
  ) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // إذا كان الطلب موجودًا في التخزين المؤقت، أعد الاستجابة المخزنة
      if (cachedResponse) {
        return cachedResponse
      }

      // إذا لم يكن موجودًا، حاول جلبه من الشبكة
      return fetch(event.request)
        .then((response) => {
          // تأكد من أن الاستجابة صالحة
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          // استنساخ الاستجابة لأنها يمكن استخدامها مرة واحدة فقط
          const responseToCache = response.clone()

          // تخزين الاستجابة في التخزين المؤقت
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // إذا فشل الطلب، حاول تقديم صفحة الخطأ المخزنة مؤقتًا
          return caches.match("/offline")
        })
    }),
  )
})

// معالجة رسائل من التطبيق
self.addEventListener("message", (event: any) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

export {}
