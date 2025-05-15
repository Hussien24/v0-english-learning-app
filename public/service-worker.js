// تعريف الإصدار للتحكم في التخزين المؤقت
const CACHE_VERSION = "v2"
const CACHE_NAME = `lingualearn-${CACHE_VERSION}`

// قائمة الملفات التي سيتم تخزينها مؤقتًا للاستخدام في وضع عدم الاتصال
const STATIC_ASSETS = [
  "/",
  "/flashcards",
  "/quiz",
  "/daily-quiz",
  "/progress",
  "/settings",
  "/appearance",
  "/offline",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
]

// تثبيت خدمة العامل وتخزين الأصول الثابتة
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    }),
  )
  // تنشيط خدمة العامل الجديدة فورًا
  self.skipWaiting()
})

// تنشيط خدمة العامل وحذف التخزينات المؤقتة القديمة
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith("lingualearn-") && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      )
    }),
  )
  // السيطرة على جميع العملاء بدون إعادة تحميل
  event.waitUntil(self.clients.claim())
})

// اعتراض طلبات الشبكة وتقديم الاستجابات المخزنة مؤقتًا عند الحاجة
self.addEventListener("fetch", (event) => {
  // تجاهل طلبات غير GET
  if (event.request.method !== "GET") {
    return
  }

  // تجاهل طلبات chrome-extension
  if (event.request.url.includes("chrome-extension")) {
    return
  }

  // استراتيجية الشبكة أولاً، ثم التخزين المؤقت
  const networkFirst = async () => {
    try {
      // محاولة جلب من الشبكة
      const networkResponse = await fetch(event.request)

      // تخزين الاستجابة في التخزين المؤقت
      const cache = await caches.open(CACHE_NAME)
      cache.put(event.request, networkResponse.clone())

      return networkResponse
    } catch (error) {
      // إذا فشل الطلب، استخدم التخزين المؤقت
      const cachedResponse = await caches.match(event.request)

      if (cachedResponse) {
        return cachedResponse
      }

      // إذا لم يكن موجودًا في التخزين المؤقت، حاول تقديم صفحة عدم الاتصال
      if (event.request.headers.get("Accept")?.includes("text/html")) {
        return caches.match("/offline")
      }

      throw error
    }
  }

  // استراتيجية التخزين المؤقت أولاً، ثم الشبكة
  const cacheFirst = async () => {
    const cachedResponse = await caches.match(event.request)

    if (cachedResponse) {
      return cachedResponse
    }

    try {
      // إذا لم يكن موجودًا في التخزين المؤقت، حاول جلبه من الشبكة
      const networkResponse = await fetch(event.request)

      // تخزين الاستجابة في التخزين المؤقت
      const cache = await caches.open(CACHE_NAME)
      cache.put(event.request, networkResponse.clone())

      return networkResponse
    } catch (error) {
      // إذا فشل الطلب وكان طلب HTML، قدم صفحة عدم الاتصال
      if (event.request.headers.get("Accept")?.includes("text/html")) {
        return caches.match("/offline")
      }

      throw error
    }
  }

  // تحديد الاستراتيجية بناءً على نوع الطلب
  if (event.request.url.includes("/api/")) {
    // استخدم استراتيجية الشبكة أولاً لطلبات API
    event.respondWith(networkFirst())
  } else if (STATIC_ASSETS.some((asset) => event.request.url.endsWith(asset))) {
    // استخدم استراتيجية التخزين المؤقت أولاً للأصول الثابتة
    event.respondWith(cacheFirst())
  } else {
    // استخدم استراتيجية الشبكة أولاً للطلبات الأخرى
    event.respondWith(networkFirst())
  }
})

// معالجة رسائل من التطبيق
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
