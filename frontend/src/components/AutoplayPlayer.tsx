'use client'

import { useEffect, useRef, useState } from 'react'
import {
  generateRandomPlaylist,
  loadAutoplaySettings,
  AutoplayItem,
  getContentTypeName,
} from '../lib/autoplay'
import { SpeechManager } from '../lib/speech'
import GridSystem from './GridSystem'

interface AutoplayPlayerProps {
  speech: SpeechManager
  onBack: () => void
  onNavigateToContent: (item: AutoplayItem) => void
}

export default function AutoplayPlayer({
  speech,
  onBack,
  onNavigateToContent,
}: AutoplayPlayerProps) {
  const [playlist, setPlaylist] = useState<AutoplayItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0) // 秒

  const currentItem = playlist[currentIndex]
  const settings = loadAutoplaySettings()

  // プレイリスト生成
  useEffect(() => {
    const newPlaylist = generateRandomPlaylist(settings, 20)
    setPlaylist(newPlaylist)
    setCurrentIndex(0)

    if (newPlaylist.length > 0) {
      speech.speak(
        `おまかせモードを開始します。${newPlaylist.length}個のコンテンツを用意しました。` +
        `最初は${getContentTypeName(newPlaylist[0].type)}、${newPlaylist[0].title}です`
      )
      setIsPlaying(true)
      setTimeRemaining(settings.playDuration * 60)
    } else {
      speech.speak('おまかせモードで再生するコンテンツがありません。設定を確認してください')
    }
  }, [])

  // Refs to avoid stale closures inside setInterval
  const currentIndexRef = useRef(currentIndex)
  currentIndexRef.current = currentIndex
  const playlistRef = useRef(playlist)
  playlistRef.current = playlist

  // 次のコンテンツ（ref 経由で最新の値を参照）
  const nextContent = () => {
    const idx = currentIndexRef.current
    const pl = playlistRef.current
    if (idx < pl.length - 1) {
      const nextIndex = idx + 1
      setCurrentIndex(nextIndex)
      const nextItem = pl[nextIndex]
      speech.speak(
        `次のコンテンツ：${getContentTypeName(nextItem.type)}、${nextItem.title}`,
        { interrupt: true }
      )
      setTimeRemaining(settings.playDuration * 60)
    } else {
      speech.speak('プレイリストの最後に到達しました')
      setIsPlaying(false)
    }
  }

  // タイマー管理
  useEffect(() => {
    if (!isPlaying) {
      return
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1
        if (newTime <= 0) {
          // 次のコンテンツへ（nextContent は ref 経由なので最新の状態を参照できる）
          nextContent()
          return settings.playDuration * 60
        }
        return newTime
      })
    }, 1000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying])

  // 前のコンテンツ
  const prevContent = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      setCurrentIndex(prevIndex)
      const prevItem = playlist[prevIndex]
      speech.speak(
        `前のコンテンツ：${getContentTypeName(prevItem.type)}、${prevItem.title}`,
        { interrupt: true }
      )
      setTimeRemaining(settings.playDuration * 60)
    } else {
      speech.speak('最初のコンテンツです')
    }
  }

  // 再生/一時停止
  const togglePlay = () => {
    setIsPlaying(!isPlaying)
    speech.speak(isPlaying ? '一時停止しました' : '再生を再開しました')
  }

  // コンテンツを開く
  const openCurrentContent = () => {
    if (!currentItem) return
    speech.speak(`${currentItem.title} を開きます`)
    onNavigateToContent(currentItem)
  }

  // 時間を読みやすい形式に変換
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}分${secs}秒`
  }

  if (!currentItem) {
    return (
      <div className="grid-container" role="status" aria-live="polite">
        <div className="grid-item" style={{ gridColumn: '1 / -1', gridRow: '1 / -1' }}>
          プレイリストが空です
        </div>
      </div>
    )
  }

  // グリッドアクション
  const actions = [
    {
      label: '戻る',
      action: () => {
        setIsPlaying(false)
        speech.stop()
        onBack()
      },
    },
    {
      label: '前へ',
      action: prevContent,
    },
    {
      label: '次へ',
      action: nextContent,
    },
    {
      label: isPlaying ? '一時停止' : '再生',
      action: togglePlay,
    },
    {
      label: '開く',
      action: openCurrentContent,
    },
    {
      label: '現在の情報',
      action: () => {
        speech.speak(
          `現在：${getContentTypeName(currentItem.type)}、${currentItem.title}。` +
          `${currentItem.description}。` +
          `残り時間：${formatTime(timeRemaining)}。` +
          `プレイリスト：${currentIndex + 1}/${playlist.length}`
        )
      },
    },
    {
      label: 'プレイリスト',
      action: () => {
        speech.speak(
          `プレイリスト：全${playlist.length}個のコンテンツ。` +
          `現在は${currentIndex + 1}番目です`
        )
      },
    },
    {
      label: '停止',
      action: () => {
        speech.stop()
      },
    },
    {
      label: '残り時間',
      action: () => {
        speech.speak(`残り時間：${formatTime(timeRemaining)}`)
      },
    },
  ]

  return <GridSystem actions={actions} speech={speech} />
}
