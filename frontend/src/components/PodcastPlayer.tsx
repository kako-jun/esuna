'use client'

import { useEffect, useState, useRef } from 'react'
import { useAppStore } from '../lib/store'
import { fetchPodcastEpisodes } from '../lib/api-client'
import { SpeechManager } from '../lib/speech'
import GridSystem from './GridSystem'

interface PodcastPlayerProps {
  speech: SpeechManager
  onBack: () => void
}

export default function PodcastPlayer({ speech, onBack }: PodcastPlayerProps) {
  const {
    selectedPodcast,
    podcastEpisodes,
    currentEpisodeIndex,
    setPodcastEpisodes,
    nextEpisode,
    prevEpisode,
    getCurrentEpisode,
  } = useAppStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // エピソード一覧を取得
  useEffect(() => {
    const loadEpisodes = async () => {
      if (!selectedPodcast) {
        speech.speak('Podcastが選択されていません')
        onBack()
        return
      }

      setLoading(true)
      setError(null)

      try {
        const episodes = await fetchPodcastEpisodes(selectedPodcast.feedUrl, 10)
        setPodcastEpisodes(episodes)
        setTimeout(() => {
          speech.speak(
            `${selectedPodcast.title}のエピソード、${episodes.length}件を読み込みました。最新のエピソードから説明します`
          )
          setTimeout(() => speakEpisode(), 2000)
        }, 500)
      } catch (err) {
        console.error('Failed to load episodes:', err)
        setError('エピソードの読み込みに失敗しました')
        speech.speak('エピソードの読み込みに失敗しました。戻ります')
        setTimeout(onBack, 2000)
      } finally {
        setLoading(false)
      }
    }

    if (podcastEpisodes.length === 0 && selectedPodcast) {
      loadEpisodes()
    }
  }, [selectedPodcast])

  // 現在のエピソードを取得
  const currentEpisode = getCurrentEpisode()

  // エピソードを読み上げ
  const speakEpisode = () => {
    if (!currentEpisode) return

    const durationText = currentEpisode.duration > 0
      ? `再生時間は約${Math.floor(currentEpisode.duration / 60)}分です。`
      : ''

    speech.speak(
      `エピソード ${currentEpisodeIndex + 1}。${currentEpisode.title}。${currentEpisode.description}${durationText}`,
      { interrupt: true }
    )
  }

  // 音声を再生
  const playAudio = () => {
    if (!currentEpisode?.audio_url) {
      speech.speak('音声ファイルが見つかりません')
      return
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(currentEpisode.audio_url)
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false)
        speech.speak('再生が終了しました')
      })
      audioRef.current.addEventListener('error', () => {
        setIsPlaying(false)
        speech.speak('音声の再生に失敗しました')
      })
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      speech.speak('再生を一時停止しました')
    } else {
      audioRef.current.play()
      setIsPlaying(true)
      speech.speak('再生を開始します')
    }
  }

  // 音声を停止
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
      speech.speak('再生を停止しました')
    }
  }

  // 前のエピソード
  const goPrevEpisode = () => {
    if (currentEpisodeIndex > 0) {
      stopAudio()
      audioRef.current = null
      prevEpisode()
      setTimeout(speakEpisode, 100)
    } else {
      speech.speak('最初のエピソードです')
    }
  }

  // 次のエピソード
  const goNextEpisode = () => {
    if (podcastEpisodes && currentEpisodeIndex < podcastEpisodes.length - 1) {
      stopAudio()
      audioRef.current = null
      nextEpisode()
      setTimeout(speakEpisode, 100)
    } else {
      speech.speak('最後のエピソードです')
    }
  }

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // グリッドアクション
  const actions = [
    {
      label: '戻る',
      action: () => {
        speech.stop()
        stopAudio()
        setPodcastEpisodes([])
        onBack()
      },
    },
    {
      label: '前のエピソード',
      action: goPrevEpisode,
    },
    {
      label: '次のエピソード',
      action: goNextEpisode,
    },
    {
      label: '説明',
      action: speakEpisode,
    },
    {
      label: isPlaying ? '一時停止' : '再生',
      action: playAudio,
    },
    {
      label: '停止',
      action: stopAudio,
    },
    {
      label: '位置',
      action: () => {
        if (podcastEpisodes) {
          speech.speak(
            `全${podcastEpisodes.length}エピソード中、` +
            `${currentEpisodeIndex + 1}番目のエピソードです`
          )
        }
      },
    },
    {
      label: '番組情報',
      action: () => {
        if (selectedPodcast) {
          speech.speak(
            `番組名：${selectedPodcast.title}。` +
            `カテゴリ：${selectedPodcast.category}。` +
            `全${podcastEpisodes.length}エピソード`
          )
        }
      },
    },
    {
      label: '先頭',
      action: () => {
        if (currentEpisodeIndex !== 0) {
          stopAudio()
          audioRef.current = null
          useAppStore.getState().setCurrentEpisodeIndex(0)
          setTimeout(speakEpisode, 100)
        } else {
          speech.speak('すでに最初のエピソードです')
        }
      },
    },
  ]

  if (loading) {
    return <div className="p-4 text-center">エピソードを読み込んでいます...</div>
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
