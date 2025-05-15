import type React from "react"
import "@/app/globals.css"
import { Inter, Cairo, Tajawal, Roboto, Amiri, Noto_Kufi_Arabic } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Navbar } from "@/components/navbar"
import { AIAssistant } from "@/components/ai-assistant"
import { OfflineManager } from "@/components/offline-manager"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const cairo = Cairo({ subsets: ["arabic"], variable: "--font-cairo" })
const tajawal = Tajawal({ weight: ["400", "500", "700"], variable: "--font-tajawal", subsets: ["arabic"] })
const roboto = Roboto({ weight: ["400", "500", "700"], variable: "--font-roboto", subsets: ["latin"] })
const amiri = Amiri({ weight: ["400", "700"], variable: "--font-amiri", subsets: ["arabic"] })
const notoKufiArabic = Noto_Kufi_Arabic({
  weight: ["400", "500", "700"],
  variable: "--font-noto-kufi",
  subsets: ["arabic"],
})

export const metadata = {
  title: "LinguaLearn - English Language Learning App",
  description: "Master English with flashcards and quizzes",
  manifest: "/manifest.json",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#4285f4" />
      </head>
      <body
        className={`${inter.variable} ${cairo.variable} ${tajawal.variable} ${roboto.variable} ${amiri.variable} ${notoKufiArabic.variable} font-sans`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Navbar />
          <AIAssistant />
          <OfflineManager />
          <Toaster />
        </ThemeProvider>

        {/* تسجيل خدمة العامل لدعم وضع عدم الاتصال */}
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/service-worker.js').then(
                    function(registration) {
                      console.log('Service Worker registration successful with scope: ', registration.scope);
                      
                      // التحقق من وجود تحديثات لخدمة العامل
                      registration.addEventListener('updatefound', function() {
                        // إذا وجد تحديث، احصل على خدمة العامل الجديدة
                        const newWorker = registration.installing;
                        
                        newWorker.addEventListener('statechange', function() {
                          // عندما تكون خدمة العامل الجديدة جاهزة
                          if (newWorker.state === 'activated') {
                            console.log('New service worker activated');
                          }
                        });
                      });
                      
                      // التحقق من حالة الاتصال عند التحميل
                      if (!navigator.onLine) {
                        // تفعيل وضع عدم الاتصال تلقائيًا
                        localStorage.setItem("offlineMode", JSON.stringify(true));
                        console.log('Offline mode automatically enabled');
                      }
                    },
                    function(err) {
                      console.log('Service Worker registration failed: ', err);
                    }
                  );
                });
                
                // الاستماع لأحداث الاتصال
                window.addEventListener('online', function() {
                  console.log('App is online');
                });
                
                window.addEventListener('offline', function() {
                  console.log('App is offline');
                  // تفعيل وضع عدم الاتصال تلقائيًا
                  localStorage.setItem("offlineMode", JSON.stringify(true));
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
