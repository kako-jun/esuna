'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '../lib/store'
import { fetchHatenaHot, fetchHatenaLatest } from '../lib/api-client'
import { SpeechManager } from '../lib/speech'
import { useAutoNavigation } from '../lib/useAutoNavigation'
import GridSystem from './GridSystem'

interface HatenaEntryReaderProps {
  speech: SpeechManager
  onBack: () => void
  onViewComments: () => void
  type: 'hot' | 'latest'
}

export default function HatenaEntryReader({ speech, onBack, onViewComments, type }: HatenaEntryReaderProps) {
  const {
    hatenaEntries,
    currentEntryIndex,
    setHatenaEntries,
    nextEntry,
    prevEntry,
    getCurrentEntry,
    autoNavigationEnabled,
  } = useAppStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // エントリー取得
  useEffect(() => {
    const loadEntries = async () => {
      setLoading(true)
      setError(null)

      try {
        const entries = type === 'hot'
          ? await fetchHatenaHot()
          : await fetchHatenaLatest()

        setHatenaEntries(entries)
        speech.speak(`${entries.length}件のエントリーを読み込みました`)
      } catch (err) {
        console.error('Failed to load entries:', err)
        setError('エントリーの読み込みに失敗しました')
        speech.speak('エントリーの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    if (hatenaEntries.length === 0) {
      loadEntries()
    }
  }, [type])

  // 現在のエントリーを取得
  const currentEntry = getCurrentEntry()

  // エントリーを読み上げ
  const speakEntry = () => {
    if (!currentEntry) return

    speech.speak(currentEntry.title, { interrupt: true })

    if (currentEntry.description) {
      setTimeout(() => {
        // 説明文の最初の200文字のみ
        const description = currentEntry.description.slice(0, 200)
        speech.speak(description)
      }, 1500)
    }

    if (currentEntry.bookmark_count > 0) {
      setTimeout(() => {
        speech.speak(`${currentEntry.bookmark_count}ブックマーク`)
      }, currentEntry.description ? 3000 : 1500)
    }
  }

  // 自動ナビゲーション
  useAutoNavigation({
    enabled: autoNavigationEnabled,
    speech,
    onNext: () => {
      if (currentEntryIndex < hatenaEntries.length - 1) {
        nextEntry()
        setTimeout(speakEntry, 100)
      } else {
        speech.speak('最後のエントリーです')
      }
    },
    delay: 3000,
  })

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
      label: 'リロード',
      action: () => {
        setLoading(true)
        const loadFn = type === 'hot' ? fetchHatenaHot : fetchHatenaLatest
        loadFn()
          .then((entries) => {
            setHatenaEntries(entries)
            speech.speak(`${entries.length}件のエントリーを再読み込みしました`)
          })
          .catch(() => {
            speech.speak('再読み込みに失敗しました')
          })
          .finally(() => setLoading(false))
      },
    },
    {
      label: '設定',
      action: () => speech.speak('設定画面は未実装です'),
    },
    {
      label: '前のエントリー',
      action: () => {
        if (currentEntryIndex > 0) {
          prevEntry()
          setTimeout(speakEntry, 100)
        } else {
          speech.speak('最初のエントリーです')
        }
      },
    },
    {
      label: loading ? '読み込み中...' : currentEntry ? currentEntry.title.slice(0, 15) : 'エントリーなし',
      action: speakEntry,
    },
    {
      label: '次のエントリー',
      action: () => {
        if (currentEntryIndex < hatenaEntries.length - 1) {
          nextEntry()
          setTimeout(speakEntry, 100)
        } else {
          speech.speak('最後のエントリーです')
        }
      },
    },
    {
      label: `${currentEntryIndex + 1}/${hatenaEntries.length}`,
      action: () => speech.speak(`${hatenaEntries.length}件中、${currentEntryIndex + 1}件目です`),
    },
    {
      label: 'コメント表示',
      action: () => {
        if (currentEntry && currentEntry.comments_url) {
          speech.speak('コメント一覧を表示します')
          onViewComments()
        } else {
          speech.speak('コメントがありません')
        }
      },
    },
    {
      label: '停止',
      action: () => speech.stop(),
    },
  ]

  return (
    <div className="h-screen w-screen">
      <GridSystem
        actions={actions}
        speech={speech}
        onInit={() => {
          speech.speak(type === 'hot' ? 'はてなブックマーク 人気エントリー' : 'はてなブックマーク 新着エントリー')
          if (hatenaEntries.length > 0) {
            speech.speak(`${hatenaEntries.length}件のエントリーがあります`)
          }
        }}
      />
    </div>
  )
}
