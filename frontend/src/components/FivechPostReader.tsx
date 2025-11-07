'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '../lib/store'
import { fetch5chPosts } from '../lib/api-client'
import { SpeechManager } from '../lib/speech'
import GridSystem from './GridSystem'

interface FivechPostReaderProps {
  speech: SpeechManager
  onBack: () => void
}

export default function FivechPostReader({ speech, onBack }: FivechPostReaderProps) {
  const {
    fivechPosts,
    currentPostIndex,
    set5chPosts,
    nextPost,
    prevPost,
    getCurrentPost,
    getCurrentThread,
  } = useAppStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 投稿を取得
  useEffect(() => {
    const loadPosts = async () => {
      const thread = getCurrentThread()
      if (!thread) {
        setError('スレッドが選択されていません')
        speech.speak('スレッドが選択されていません')
        return
      }

      setLoading(true)
      setError(null)

      try {
        const posts = await fetch5chPosts(thread.url, 1, 100)
        set5chPosts(posts)
        speech.speak(`${posts.length}件のレスを読み込みました`)
      } catch (err) {
        console.error('Failed to load posts:', err)
        setError('レスの読み込みに失敗しました')
        speech.speak('レスの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    if (fivechPosts.length === 0) {
      loadPosts()
    }
  }, [])

  // 現在の投稿を取得
  const currentPost = getCurrentPost()

  // 投稿を読み上げ
  const speakPost = () => {
    if (!currentPost) return

    speech.speak(`${currentPost.number}番 ${currentPost.name}`, { interrupt: true })
    setTimeout(() => {
      speech.speak(currentPost.text)
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
        const thread = getCurrentThread()
        if (thread) {
          setLoading(true)
          fetch5chPosts(thread.url, 1, 100)
            .then((posts) => {
              set5chPosts(posts)
              speech.speak(`${posts.length}件のレスを再読み込みしました`)
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
      label: '前のレス',
      action: () => {
        if (currentPostIndex > 0) {
          prevPost()
          setTimeout(speakPost, 100)
        } else {
          speech.speak('最初のレスです')
        }
      },
    },
    {
      label: loading ? '読み込み中...' : currentPost ? `${currentPost.number}番` : 'レスなし',
      action: speakPost,
    },
    {
      label: '次のレス',
      action: () => {
        if (currentPostIndex < fivechPosts.length - 1) {
          nextPost()
          setTimeout(speakPost, 100)
        } else {
          speech.speak('最後のレスです')
        }
      },
    },
    {
      label: `${currentPostIndex + 1}/${fivechPosts.length}`,
      action: () => speech.speak(`${fivechPosts.length}件中、${currentPostIndex + 1}件目です`),
    },
    {
      label: '全文読み上げ',
      action: speakPost,
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
          const thread = getCurrentThread()
          speech.speak(`5ちゃんねる レス表示 ${thread?.title || ''}`)
          if (fivechPosts.length > 0) {
            speech.speak(`${fivechPosts.length}件のレスがあります`)
          }
        }}
      />
    </div>
  )
}
