'use client'

import { useEffect, useState } from 'react'
import { RSSReader, RSSItem } from '../lib/rss'
import { SpeechManager } from '../lib/speech'
import { useAutoNavigation } from '../lib/useAutoNavigation'
import GridSystem from './GridSystem'

interface RSSArticleReaderProps {
  speech: SpeechManager
  onBack: () => void
}

export default function RSSArticleReader({ speech, onBack }: RSSArticleReaderProps) {
  const [articles, setArticles] = useState<RSSItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rssReader] = useState(() => new RSSReader())
  const [autoNavEnabled] = useState(false) // 自動ナビゲーション（将来的に設定から取得）

  // 記事を読み込み
  useEffect(() => {
    const loadArticles = async () => {
      // sessionStorageから選択したフィードを取得
      const feedJson = typeof window !== 'undefined'
        ? sessionStorage.getItem('selectedRSSFeed')
        : null

      if (!feedJson) {
        speech.speak('フィードが選択されていません')
        onBack()
        return
      }

      const feed = JSON.parse(feedJson)
      setLoading(true)
      setError(null)

      try {
        const rssFeed = await rssReader.fetchRSS(feed.url)
        setArticles(rssFeed.items)
        setTimeout(() => {
          speech.speak(
            `${feed.name}の記事、${rssFeed.items.length}件を読み込みました。最新の記事から読み上げます`
          )
          setTimeout(() => speakArticle(), 2000)
        }, 500)
      } catch (err) {
        console.error('Failed to load RSS:', err)
        setError('記事の読み込みに失敗しました')
        speech.speak('記事の読み込みに失敗しました。戻ります')
        setTimeout(onBack, 2000)
      } finally {
        setLoading(false)
      }
    }

    loadArticles()
  }, [])

  const currentArticle = articles[currentIndex]

  // 記事を読み上げ
  const speakArticle = () => {
    if (!currentArticle) return

    const text = `記事 ${currentIndex + 1}。${currentArticle.title}。${currentArticle.description}`

    speech.speak(text, { interrupt: true })
  }

  // 自動ナビゲーション
  useAutoNavigation({
    enabled: autoNavEnabled,
    speech,
    onNext: () => {
      if (currentIndex < articles.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setTimeout(speakArticle, 100)
      } else {
        speech.speak('最後の記事です')
      }
    },
    delay: 2000,
  })

  // 次の記事
  const nextArticle = () => {
    if (currentIndex < articles.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setTimeout(speakArticle, 100)
    } else {
      speech.speak('最後の記事です')
    }
  }

  // 前の記事
  const prevArticle = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setTimeout(speakArticle, 100)
    } else {
      speech.speak('最初の記事です')
    }
  }

  // グリッドアクション
  const actions = [
    {
      label: '戻る',
      action: () => {
        speech.stop()
        onBack()
      },
    },
    {
      label: '前の記事',
      action: prevArticle,
    },
    {
      label: '次の記事',
      action: nextArticle,
    },
    {
      label: '読み上げ',
      action: speakArticle,
    },
    {
      label: '本文',
      action: () => {
        if (currentArticle?.content) {
          speech.speak(`本文。${currentArticle.content}`, { interrupt: true })
        } else {
          speech.speak('本文が取得できませんでした')
        }
      },
    },
    {
      label: '位置',
      action: () => {
        speech.speak(
          `全${articles.length}記事中、${currentIndex + 1}番目の記事です`
        )
      },
    },
    {
      label: '日時',
      action: () => {
        if (currentArticle) {
          speech.speak(`公開日時：${currentArticle.pubDate}`)
        }
      },
    },
    {
      label: '停止',
      action: () => {
        speech.stop()
      },
    },
    {
      label: '先頭',
      action: () => {
        setCurrentIndex(0)
        setTimeout(speakArticle, 100)
      },
    },
  ]

  if (loading) {
    return <div className="p-4 text-center">記事を読み込んでいます...</div>
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        エラー: {error}
      </div>
    )
  }

  return <GridSystem actions={actions} speech={speech} />
}
