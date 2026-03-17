import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Esuna - 視覚障害者向けアクセシブルアプリ',
  description: '視覚障害者の方が安心して使える統一操作インターフェースを持つWebアプリケーション',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        {/* Press Start 2P — pixel/retro monospace font for FC FF aesthetic */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}