'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '../lib/store'
import { fetchSNSPosts } from '../lib/api-client'
import { SpeechManager } from '../lib/speech'
import { useAutoNavigation } from '../lib/useAutoNavigation'
import GridSystem from './GridSystem'

interface SNSPostReaderProps {
  speech: SpeechManager
  onBack: () => void
}

export default function SNSPostReader({ speech, onBack }: SNSPostReaderProps) {
  const {
    snsPosts,
    currentSNSPostIndex,
    setSNSPosts,
    nextSNSPost,
    prevSNSPost,
    getCurrentSNSPost,
    autoNavigationEnabled,
  } = useAppStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [platform, setPlatform] = useState<'twitter' | 'mastodon' | 'bluesky'>('twitter')

  // 投稿を取得
  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true)
      setError(null)

      try {
        const posts = await fetchSNSPosts(platform, undefined, 20)
        setSNSPosts(posts)
        speech.speak(`${posts.length}件の投稿を読み込みました`)
      } catch (err) {
        console.error('Failed to load posts:', err)
        setError('投稿の読み込みに失敗しました')
        speech.speak('投稿の読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    if (snsPosts.length === 0) {
      loadPosts()
    }
  }, [platform])

  // 現在の投稿を取得
  const currentPost = getCurrentSNSPost()

  // 投稿を読み上げ
  const speakPost = () => {
    if (!currentPost) return

    speech.speak(`${currentPost.author}さん`, { interrupt: true })
    setTimeout(() => {
      speech.speak(currentPost.text)
    }, 1000)
  }

  // 自動ナビゲーション
  useAutoNavigation({
    enabled: autoNavigationEnabled,
    speech,
    onNext: () => {
      if (currentSNSPostIndex < snsPosts.length - 1) {
        nextSNSPost()
        setTimeout(speakPost, 100)
      } else {
        speech.speak('最後の投稿です')
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
        fetchSNSPosts(platform, undefined, 20)
          .then((posts) => {
            setSNSPosts(posts)
            speech.speak(`${posts.length}件の投稿を再読み込みしました`)
          })
          .catch(() => {
            speech.speak('再読み込みに失敗しました')
          })
          .finally(() => setLoading(false))
      },
    },
    {
      label: 'プラットフォーム切替',
      action: () => {
        const platforms: Array<'twitter' | 'mastodon' | 'bluesky'> = ['twitter', 'mastodon', 'bluesky']
        const currentIndex = platforms.indexOf(platform)
        const nextPlatform = platforms[(currentIndex + 1) % platforms.length]
        setPlatform(nextPlatform)
        speech.speak(`${nextPlatform}に切り替えました`)
      },
    },
    {
      label: '前の投稿',
      action: () => {
        if (currentSNSPostIndex > 0) {
          prevSNSPost()
          setTimeout(speakPost, 100)
        } else {
          speech.speak('最初の投稿です')
        }
      },
    },
    {
      label: loading ? '読み込み中...' : currentPost ? currentPost.author : '投稿なし',
      action: speakPost,
    },
    {
      label: '次の投稿',
      action: () => {
        if (currentSNSPostIndex < snsPosts.length - 1) {
          nextSNSPost()
          setTimeout(speakPost, 100)
        } else {
          speech.speak('最後の投稿です')
        }
      },
    },
    {
      label: `${currentSNSPostIndex + 1}/${snsPosts.length}`,
      action: () => speech.speak(`${snsPosts.length}件中、${currentSNSPostIndex + 1}件目です`),
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
          speech.speak(`SNS投稿 現在${platform}を表示中`)
          if (snsPosts.length > 0) {
            speech.speak(`${snsPosts.length}件の投稿があります`)
          }
        }}
      />
    </div>
  )
}
