'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '../lib/store'
import { POPULAR_PODCASTS } from '../lib/podcasts'
import { SpeechManager } from '../lib/speech'
import GridSystem from './GridSystem'

interface PodcastListProps {
  speech: SpeechManager
  onBack: () => void
  onSelectPodcast: () => void
}

export default function PodcastList({ speech, onBack, onSelectPodcast }: PodcastListProps) {
  const { setSelectedPodcast } = useAppStore()
  const [currentIndex, setCurrentIndex] = useState(0)

  const currentPodcast = POPULAR_PODCASTS[currentIndex]

  // Podcastを読み上げ
  const speakPodcast = () => {
    if (!currentPodcast) return
    speech.speak(
      `${currentPodcast.category}カテゴリ、${currentPodcast.title}。${currentPodcast.description}`,
      { interrupt: true }
    )
  }

  // 初回読み上げ
  useEffect(() => {
    setTimeout(() => {
      speech.speak(`人気Podcast、${POPULAR_PODCASTS.length}番組を用意しています`)
      setTimeout(speakPodcast, 2000)
    }, 500)
  }, [])

  // 次のPodcast
  const nextPodcast = () => {
    if (currentIndex < POPULAR_PODCASTS.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setTimeout(() => {
        const podcast = POPULAR_PODCASTS[currentIndex + 1]
        speech.speak(
          `${podcast.category}カテゴリ、${podcast.title}。${podcast.description}`,
          { interrupt: true }
        )
      }, 100)
    } else {
      speech.speak('最後の番組です')
    }
  }

  // 前のPodcast
  const prevPodcast = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setTimeout(() => {
        const podcast = POPULAR_PODCASTS[currentIndex - 1]
        speech.speak(
          `${podcast.category}カテゴリ、${podcast.title}。${podcast.description}`,
          { interrupt: true }
        )
      }, 100)
    } else {
      speech.speak('最初の番組です')
    }
  }

  // Podcastを選択
  const selectPodcast = () => {
    setSelectedPodcast(currentPodcast)
    speech.speak(`${currentPodcast.title} のエピソード一覧を読み込んでいます`)
    onSelectPodcast()
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
      label: '前の番組',
      action: prevPodcast,
    },
    {
      label: '次の番組',
      action: nextPodcast,
    },
    {
      label: '読み上げ',
      action: speakPodcast,
    },
    {
      label: 'エピソード',
      action: selectPodcast,
    },
    {
      label: '番組情報',
      action: () => {
        speech.speak(
          `番組番号 ${currentIndex + 1}。` +
          `タイトル：${currentPodcast.title}。` +
          `カテゴリ：${currentPodcast.category}。` +
          `${currentPodcast.description}`
        )
      },
    },
    {
      label: '番組数',
      action: () => {
        speech.speak(`全${POPULAR_PODCASTS.length}番組中、${currentIndex + 1}番目の番組です`)
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
          const podcast = POPULAR_PODCASTS[0]
          speech.speak(
            `最初の番組に戻りました。${podcast.title}`,
            { interrupt: true }
          )
        }, 100)
      },
    },
  ]

  return <GridSystem actions={actions} speech={speech} />
}
