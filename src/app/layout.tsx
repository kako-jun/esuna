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
      <body>
        {children}
      </body>
    </html>
  )
}