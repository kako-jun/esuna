'use client'

import { useEffect, useState } from 'react'
import { SpeechManager } from '../lib/speech'
import { getRecentProgress, removeProgress, Progress, ProgressType } from '../lib/progress'
import GridSystem from './GridSystem'

interface ContinueReadingProps {
  speech: SpeechManager
  onBack: () => void
  onSelectProgress: (progress: Progress) => void
}

export default function ContinueReading({ speech, onBack, onSelectProgress }: ContinueReadingProps) {
  const [progressList, setProgressList] = useState<Progress[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  // 進捗を読み込み
  useEffect(() => {
    const loadProgress = () => {
      const recent = getRecentProgress(20)
      setProgressList(recent)

      setTimeout(() => {
        if (recent.length === 0) {
          speech.speak('続きから再生できるコンテンツはまだありません')
        } else {
          speech.speak(`続きから再生、${recent.length}件あります`)
          setTimeout(() => speakProgress(), 2000)
        }
      }, 500)
    }

    loadProgress()
  }, [])

  const currentProgress = progressList[currentIndex]

  // 進捗を読み上げ
  const speakProgress = () => {
    if (!currentProgress) return

    const typeText = getTypeText(currentProgress.type)
    const percent = Math.round((currentProgress.currentIndex / currentProgress.totalCount) * 100)

    speech.speak(
      `${typeText}、${currentProgress.title}。進捗は${percent}パーセント、` +
      `${currentProgress.currentIndex + 1}番目、全${currentProgress.totalCount}件中です`,
      { interrupt: true }
    )
  }

  // タイプを日本語に変換
  const getTypeText = (type: ProgressType): string => {
    switch (type) {
      case 'novel':
        return '小説'
      case 'podcast':
        return 'Podcast'
      case 'rss-article':
        return 'RSSニュース'
      case '5ch-thread':
        return '5ちゃんねるスレッド'
      default:
        return 'コンテンツ'
    }
  }

  // 次の進捗
  const nextProgress = () => {
    if (currentIndex < progressList.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setTimeout(speakProgress, 100)
    } else {
      speech.speak('最後の進捗です')
    }
  }

  // 前の進捗
  const prevProgress = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setTimeout(speakProgress, 100)
    } else {
      speech.speak('最初の進捗です')
    }
  }

  // 続きから再生
  const continueReading = () => {
    if (!currentProgress) {
      speech.speak('進捗がありません')
      return
    }

    speech.speak(`${currentProgress.title} の続きから再生します`)
    onSelectProgress(currentProgress)
  }

  // 進捗を削除
  const deleteProgress = () => {
    if (!currentProgress) {
      speech.speak('進捗がありません')
      return
    }

    removeProgress(currentProgress.type, currentProgress.id)
    speech.speak(`${currentProgress.title} の進捗を削除しました`)

    // リストを更新
    const updated = getRecentProgress(20)
    setProgressList(updated)

    // インデックスを調整
    if (currentIndex >= updated.length && updated.length > 0) {
      setCurrentIndex(updated.length - 1)
    } else if (updated.length === 0) {
      setCurrentIndex(0)
      setTimeout(() => {
        speech.speak('進捗がすべて削除されました')
      }, 1500)
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
      label: '前',
      action: prevProgress,
    },
    {
      label: '次',
      action: nextProgress,
    },
    {
      label: '読み上げ',
      action: speakProgress,
    },
    {
      label: '続きから',
      action: continueReading,
    },
    {
      label: '削除',
      action: deleteProgress,
    },
    {
      label: '件数',
      action: () => {
        if (progressList.length === 0) {
          speech.speak('進捗はまだ記録されていません')
        } else {
          speech.speak(`全${progressList.length}件中、${currentIndex + 1}番目の進捗です`)
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
        if (progressList.length > 0) {
          setCurrentIndex(0)
          setTimeout(speakProgress, 100)
        } else {
          speech.speak('進捗がありません')
        }
      },
    },
  ]

  return <GridSystem actions={actions} speech={speech} />
}
