import { Html, Head, Main, NextScript } from "next/document"

export default function Document() {
  return (
    <Html lang="ar" dir="rtl">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#4285f4" />
        <meta name="application-name" content="LinguaLearn" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LinguaLearn" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#4285f4" />
        <meta name="msapplication-tap-highlight" content="no" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
