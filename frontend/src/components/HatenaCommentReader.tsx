'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '../lib/store'
import { fetchHatenaComments } from '../lib/api-client'
import { SpeechManager } from '../lib/speech'
import GridSystem from './GridSystem'

interface HatenaCommentReaderProps {
  speech: SpeechManager
  onBack: () => void
}

export default function HatenaCommentReader({ speech, onBack }: HatenaCommentReaderProps) {
  const {
    hatenaComments,
    currentCommentIndex,
    setHatenaComments,
    nextComment,
    prevComment,
    getCurrentComment,
    getCurrentEntry,
  } = useAppStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // コメント取得
  useEffect(() => {
    const loadComments = async () => {
      const entry = getCurrentEntry()
      if (!entry || !entry.comments_url) {
        setError('コメントURLが見つかりません')
        speech.speak('コメントURLが見つかりません')
        return
      }

      setLoading(true)
      setError(null)

      try {
        const comments = await fetchHatenaComments(entry.comments_url)
        setHatenaComments(comments)

        if (comments.length === 0) {
          speech.speak('コメントがありません')
        } else {
          speech.speak(`${comments.length}件のコメントを読み込みました`)
        }
      } catch (err) {
        console.error('Failed to load comments:', err)
        setError('コメントの読み込みに失敗しました')
        speech.speak('コメントの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    if (hatenaComments.length === 0) {
      loadComments()
    }
  }, [])

  // 現在のコメントを取得
  const currentComment = getCurrentComment()

  // コメントを読み上げ
  const speakComment = () => {
    if (!currentComment) return

    speech.speak(`${currentComment.user_name}さん`, { interrupt: true })
    setTimeout(() => {
      speech.speak(currentComment.text)
    }, 1000)
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
        const entry = getCurrentEntry()
        if (entry && entry.comments_url) {
          setLoading(true)
          fetchHatenaComments(entry.comments_url)
            .then((comments) => {
              setHatenaComments(comments)
              speech.speak(`${comments.length}件のコメントを再読み込みしました`)
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
      label: '前のコメント',
      action: () => {
        if (currentCommentIndex > 0) {
          prevComment()
          setTimeout(speakComment, 100)
        } else {
          speech.speak('最初のコメントです')
        }
      },
    },
    {
      label: loading ? '読み込み中...' : currentComment ? `${currentComment.user_name}` : 'コメントなし',
      action: speakComment,
    },
    {
      label: '次のコメント',
      action: () => {
        if (currentCommentIndex < hatenaComments.length - 1) {
          nextComment()
          setTimeout(speakComment, 100)
        } else {
          speech.speak('最後のコメントです')
        }
      },
    },
    {
      label: `${currentCommentIndex + 1}/${hatenaComments.length}`,
      action: () => speech.speak(`${hatenaComments.length}件中、${currentCommentIndex + 1}件目です`),
    },
    {
      label: '全文読み上げ',
      action: speakComment,
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
          speech.speak('はてなブックマーク コメント一覧')
          if (hatenaComments.length > 0) {
            speech.speak(`${hatenaComments.length}件のコメントがあります`)
          }
        }}
      />
    </div>
  )
}
