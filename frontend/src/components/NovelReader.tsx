'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '../lib/store'
import { fetchNovelContent } from '../lib/api-client'
import { SpeechManager } from '../lib/speech'
import { useAutoNavigation } from '../lib/useAutoNavigation'
import GridSystem from './GridSystem'

interface NovelReaderProps {
  speech: SpeechManager
  onBack: () => void
}

export default function NovelReader({ speech, onBack }: NovelReaderProps) {
  const {
    selectedNovel,
    novelContent,
    currentSectionIndex,
    setNovelContent,
    nextSection,
    prevSection,
    getCurrentSection,
    autoNavigationEnabled,
  } = useAppStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 小説の内容を取得
  useEffect(() => {
    const loadNovel = async () => {
      if (!selectedNovel) {
        speech.speak('小説が選択されていません')
        onBack()
        return
      }

      setLoading(true)
      setError(null)

      try {
        const content = await fetchNovelContent(selectedNovel.authorId, selectedNovel.fileId)
        setNovelContent(content)
        setTimeout(() => {
          speech.speak(
            `${content.title} を読み込みました。` +
            `全${content.sections.length}セクションあります。最初のセクションから読み上げます`
          )
          setTimeout(() => speakSection(), 2000)
        }, 500)
      } catch (err) {
        console.error('Failed to load novel:', err)
        setError('小説の読み込みに失敗しました')
        speech.speak('小説の読み込みに失敗しました。戻ります')
        setTimeout(onBack, 2000)
      } finally {
        setLoading(false)
      }
    }

    if (!novelContent && selectedNovel) {
      loadNovel()
    }
  }, [selectedNovel])

  // 現在のセクションを取得
  const currentSection = getCurrentSection()

  // セクションを読み上げ
  const speakSection = () => {
    if (!currentSection) return

    const sectionTitle = currentSection.title || `セクション ${currentSectionIndex + 1}`
    const text = `${sectionTitle}。${currentSection.content}`

    speech.speak(text, { interrupt: true })
  }

  // 自動ナビゲーション
  useAutoNavigation({
    enabled: autoNavigationEnabled,
    speech,
    onNext: () => {
      if (novelContent && currentSectionIndex < novelContent.sections.length - 1) {
        nextSection()
        setTimeout(speakSection, 100)
      } else {
        speech.speak('最後のセクションです')
      }
    },
    delay: 2000,
  })

  // グリッドアクション
  const actions = [
    {
      label: '戻る',
      action: () => {
        speech.stop()
        setNovelContent(null)
        onBack()
      },
    },
    {
      label: '前のセクション',
      action: () => {
        if (currentSectionIndex > 0) {
          prevSection()
          setTimeout(speakSection, 100)
        } else {
          speech.speak('最初のセクションです')
        }
      },
    },
    {
      label: '次のセクション',
      action: () => {
        if (novelContent && currentSectionIndex < novelContent.sections.length - 1) {
          nextSection()
          setTimeout(speakSection, 100)
        } else {
          speech.speak('最後のセクションです')
        }
      },
    },
    {
      label: '読み上げ',
      action: speakSection,
    },
    {
      label: '位置',
      action: () => {
        if (novelContent) {
          speech.speak(
            `全${novelContent.sections.length}セクション中、` +
            `${currentSectionIndex + 1}番目のセクションです`
          )
        }
      },
    },
    {
      label: '作品情報',
      action: () => {
        if (novelContent && selectedNovel) {
          speech.speak(
            `タイトル：${novelContent.title}。` +
            `著者：${novelContent.author}。` +
            `全${novelContent.sections.length}セクション`
          )
        }
      },
    },
    {
      label: '先頭',
      action: () => {
        if (currentSectionIndex !== 0) {
          useAppStore.getState().setCurrentSectionIndex(0)
          setTimeout(speakSection, 100)
        } else {
          speech.speak('すでに最初のセクションです')
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
      label: 'リロード',
      action: () => {
        speech.speak('再読み込みします')
        setNovelContent(null)
        setTimeout(() => {
          if (selectedNovel) {
            fetchNovelContent(selectedNovel.authorId, selectedNovel.fileId)
              .then((content) => {
                setNovelContent(content)
                speech.speak('再読み込みしました')
              })
              .catch(() => {
                speech.speak('再読み込みに失敗しました')
              })
          }
        }, 500)
      },
    },
  ]

  if (loading) {
    return <div className="p-4 text-center">小説を読み込んでいます...</div>
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
