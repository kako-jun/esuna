'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '../lib/store'
import { fetch5chThreads } from '../lib/api-client'
import { SpeechManager } from '../lib/speech'
import GridSystem from './GridSystem'

interface FivechThreadListProps {
  speech: SpeechManager
  onBack: () => void
  onSelectThread: () => void
}

export default function FivechThreadList({ speech, onBack, onSelectThread }: FivechThreadListProps) {
  const {
    fivechThreads,
    currentThreadIndex,
    set5chThreads,
    nextThread,
    prevThread,
    getCurrentThread,
    getCurrentBoard,
  } = useAppStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // スレッド一覧を取得
  useEffect(() => {
    const loadThreads = async () => {
      const board = getCurrentBoard()
      if (!board) {
        setError('板が選択されていません')
        speech.speak('板が選択されていません')
        return
      }

      setLoading(true)
      setError(null)

      try {
        const threads = await fetch5chThreads(board.url, 50)
        set5chThreads(threads)
        speech.speak(`${threads.length}個のスレッドを読み込みました`)
      } catch (err) {
        console.error('Failed to load threads:', err)
        setError('スレッドの読み込みに失敗しました')
        speech.speak('スレッドの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    if (fivechThreads.length === 0) {
      loadThreads()
    }
  }, [])

  // 現在のスレッドを取得
  const currentThread = getCurrentThread()

  // スレッドを読み上げ
  const speakThread = () => {
    if (!currentThread) return
    speech.speak(`${currentThread.title} レス数 ${currentThread.response_count}`, { interrupt: true })
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
      label: 'リロード',
      action: () => {
        const board = getCurrentBoard()
        if (board) {
          setLoading(true)
          fetch5chThreads(board.url, 50)
            .then((threads) => {
              set5chThreads(threads)
              speech.speak(`${threads.length}個のスレッドを再読み込みしました`)
            })
            .catch(() => {
              speech.speak('再読み込みに失敗しました')
            })
            .finally(() => setLoading(false))
        }
      },
    },
    {
      label: '設定',
      action: () => speech.speak('設定画面は未実装です'),
    },
    {
      label: '前のスレッド',
      action: () => {
        if (currentThreadIndex > 0) {
          prevThread()
          setTimeout(speakThread, 100)
        } else {
          speech.speak('最初のスレッドです')
        }
      },
    },
    {
      label: loading ? '読み込み中...' : currentThread ? currentThread.title.slice(0, 20) : 'スレッドなし',
      action: speakThread,
    },
    {
      label: '次のスレッド',
      action: () => {
        if (currentThreadIndex < fivechThreads.length - 1) {
          nextThread()
          setTimeout(speakThread, 100)
        } else {
          speech.speak('最後のスレッドです')
        }
      },
    },
    {
      label: `${currentThreadIndex + 1}/${fivechThreads.length}`,
      action: () => speech.speak(`${fivechThreads.length}個中、${currentThreadIndex + 1}個目です`),
    },
    {
      label: 'レス表示',
      action: () => {
        if (currentThread) {
          speech.speak('レスを表示します')
          onSelectThread()
        } else {
          speech.speak('スレッドを選択してください')
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
          const board = getCurrentBoard()
          speech.speak(`5ちゃんねる スレッド一覧 ${board?.title || ''}`)
          if (fivechThreads.length > 0) {
            speech.speak(`${fivechThreads.length}個のスレッドがあります`)
          }
        }}
      />
    </div>
  )
}
