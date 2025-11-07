'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '../lib/store'
import { fetch5chBoards } from '../lib/api-client'
import { SpeechManager } from '../lib/speech'
import GridSystem from './GridSystem'

interface FivechBoardListProps {
  speech: SpeechManager
  onBack: () => void
  onSelectBoard: () => void
}

export default function FivechBoardList({ speech, onBack, onSelectBoard }: FivechBoardListProps) {
  const {
    fivechBoards,
    currentBoardIndex,
    set5chBoards,
    nextBoard,
    prevBoard,
    getCurrentBoard,
  } = useAppStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 板一覧を取得
  useEffect(() => {
    const loadBoards = async () => {
      setLoading(true)
      setError(null)

      try {
        const boards = await fetch5chBoards()
        set5chBoards(boards)
        speech.speak(`${boards.length}個の板を読み込みました`)
      } catch (err) {
        console.error('Failed to load boards:', err)
        setError('板の読み込みに失敗しました')
        speech.speak('板の読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    if (fivechBoards.length === 0) {
      loadBoards()
    }
  }, [])

  // 現在の板を取得
  const currentBoard = getCurrentBoard()

  // 板を読み上げ
  const speakBoard = () => {
    if (!currentBoard) return
    speech.speak(`${currentBoard.category} ${currentBoard.title}`, { interrupt: true })
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
        setLoading(true)
        fetch5chBoards()
          .then((boards) => {
            set5chBoards(boards)
            speech.speak(`${boards.length}個の板を再読み込みしました`)
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
      label: '前の板',
      action: () => {
        if (currentBoardIndex > 0) {
          prevBoard()
          setTimeout(speakBoard, 100)
        } else {
          speech.speak('最初の板です')
        }
      },
    },
    {
      label: loading ? '読み込み中...' : currentBoard ? currentBoard.title : '板なし',
      action: speakBoard,
    },
    {
      label: '次の板',
      action: () => {
        if (currentBoardIndex < fivechBoards.length - 1) {
          nextBoard()
          setTimeout(speakBoard, 100)
        } else {
          speech.speak('最後の板です')
        }
      },
    },
    {
      label: `${currentBoardIndex + 1}/${fivechBoards.length}`,
      action: () => speech.speak(`${fivechBoards.length}個中、${currentBoardIndex + 1}個目です`),
    },
    {
      label: 'スレッド一覧',
      action: () => {
        if (currentBoard) {
          speech.speak('スレッド一覧を表示します')
          onSelectBoard()
        } else {
          speech.speak('板を選択してください')
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
          speech.speak('5ちゃんねる 板一覧')
          if (fivechBoards.length > 0) {
            speech.speak(`${fivechBoards.length}個の板があります`)
          }
        }}
      />
    </div>
  )
}
