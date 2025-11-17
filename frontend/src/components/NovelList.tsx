'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '../lib/store'
import { POPULAR_NOVELS } from '../lib/novels'
import { SpeechManager } from '../lib/speech'
import GridSystem from './GridSystem'

interface NovelListProps {
  speech: SpeechManager
  onBack: () => void
  onSelectNovel: () => void
}

export default function NovelList({ speech, onBack, onSelectNovel }: NovelListProps) {
  const { setSelectedNovel } = useAppStore()
  const [currentIndex, setCurrentIndex] = useState(0)

  const currentNovel = POPULAR_NOVELS[currentIndex]

  // 小説を読み上げ
  const speakNovel = () => {
    if (!currentNovel) return
    speech.speak(
      `${currentNovel.author} 作、${currentNovel.title}。${currentNovel.description}`,
      { interrupt: true }
    )
  }

  // 初回読み上げ
  useEffect(() => {
    setTimeout(() => {
      speech.speak(`青空文庫の人気作品、${POPULAR_NOVELS.length}作品を用意しています`)
      setTimeout(speakNovel, 2000)
    }, 500)
  }, [])

  // 次の小説
  const nextNovel = () => {
    if (currentIndex < POPULAR_NOVELS.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setTimeout(() => {
        const novel = POPULAR_NOVELS[currentIndex + 1]
        speech.speak(
          `${novel.author} 作、${novel.title}。${novel.description}`,
          { interrupt: true }
        )
      }, 100)
    } else {
      speech.speak('最後の作品です')
    }
  }

  // 前の小説
  const prevNovel = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setTimeout(() => {
        const novel = POPULAR_NOVELS[currentIndex - 1]
        speech.speak(
          `${novel.author} 作、${novel.title}。${novel.description}`,
          { interrupt: true }
        )
      }, 100)
    } else {
      speech.speak('最初の作品です')
    }
  }

  // 小説を選択
  const selectNovel = () => {
    setSelectedNovel(currentNovel)
    speech.speak(`${currentNovel.title} を読み込んでいます`)
    onSelectNovel()
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
      label: '前の作品',
      action: prevNovel,
    },
    {
      label: '次の作品',
      action: nextNovel,
    },
    {
      label: '読み上げ',
      action: speakNovel,
    },
    {
      label: '読む',
      action: selectNovel,
    },
    {
      label: '作品情報',
      action: () => {
        speech.speak(
          `作品番号 ${currentIndex + 1}。` +
          `タイトル：${currentNovel.title}。` +
          `著者：${currentNovel.author}。` +
          `${currentNovel.description}`
        )
      },
    },
    {
      label: '作品数',
      action: () => {
        speech.speak(`全${POPULAR_NOVELS.length}作品中、${currentIndex + 1}番目の作品です`)
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
          const novel = POPULAR_NOVELS[0]
          speech.speak(
            `最初の作品に戻りました。${novel.author} 作、${novel.title}`,
            { interrupt: true }
          )
        }, 100)
      },
    },
  ]

  return <GridSystem actions={actions} speech={speech} />
}
