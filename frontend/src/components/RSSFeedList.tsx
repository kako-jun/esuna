'use client'

import { useEffect, useState } from 'react'
import { RSSReader } from '../lib/rss'
import { SpeechManager } from '../lib/speech'
import GridSystem from './GridSystem'

interface RSSFeedListProps {
  speech: SpeechManager
  onBack: () => void
  onSelectFeed: () => void
}

export default function RSSFeedList({ speech, onBack, onSelectFeed }: RSSFeedListProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [rssReader] = useState(() => new RSSReader())
  const defaultFeeds = rssReader.getDefaultFeeds()

  const currentFeed = defaultFeeds[currentIndex]

  // フィードを読み上げ
  const speakFeed = () => {
    if (!currentFeed) return
    speech.speak(
      `${currentFeed.name}。フィード番号 ${currentIndex + 1}`,
      { interrupt: true }
    )
  }

  // 初回読み上げ
  useEffect(() => {
    setTimeout(() => {
      speech.speak(`RSSフィード、${defaultFeeds.length}個のニュースサイトを用意しています`)
      setTimeout(speakFeed, 2000)
    }, 500)
  }, [])

  // 次のフィード
  const nextFeed = () => {
    if (currentIndex < defaultFeeds.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setTimeout(() => {
        const feed = defaultFeeds[currentIndex + 1]
        speech.speak(`${feed.name}`, { interrupt: true })
      }, 100)
    } else {
      speech.speak('最後のフィードです')
    }
  }

  // 前のフィード
  const prevFeed = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setTimeout(() => {
        const feed = defaultFeeds[currentIndex - 1]
        speech.speak(`${feed.name}`, { interrupt: true })
      }, 100)
    } else {
      speech.speak('最初のフィードです')
    }
  }

  // フィードを選択
  const selectFeed = () => {
    // グローバルステートに選択したフィードを保存
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('selectedRSSFeed', JSON.stringify(currentFeed))
    }
    speech.speak(`${currentFeed.name} の記事一覧を読み込んでいます`)
    onSelectFeed()
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
      label: '前のフィード',
      action: prevFeed,
    },
    {
      label: '次のフィード',
      action: nextFeed,
    },
    {
      label: '読み上げ',
      action: speakFeed,
    },
    {
      label: '記事一覧',
      action: selectFeed,
    },
    {
      label: 'フィード情報',
      action: () => {
        speech.speak(
          `フィード番号 ${currentIndex + 1}。` +
          `名前：${currentFeed.name}。`
        )
      },
    },
    {
      label: 'フィード数',
      action: () => {
        speech.speak(`全${defaultFeeds.length}フィード中、${currentIndex + 1}番目のフィードです`)
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
        setTimeout(() => {
          const feed = defaultFeeds[0]
          speech.speak(
            `最初のフィードに戻りました。${feed.name}`,
            { interrupt: true }
          )
        }, 100)
      },
    },
  ]

  return <GridSystem actions={actions} speech={speech} />
}
