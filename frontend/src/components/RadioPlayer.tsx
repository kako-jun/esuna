'use client'

import { useEffect, useState, useRef } from 'react'
import { RadioStation, getStreamUrl } from '../lib/radio'
import { SpeechManager } from '../lib/speech'
import GridSystem from './GridSystem'

interface RadioPlayerProps {
  station: RadioStation
  speech: SpeechManager
  onBack: () => void
}

export default function RadioPlayer({ station, speech, onBack }: RadioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [volume, setVolume] = useState(1.0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 初期化とストリーミング開始
  useEffect(() => {
    const initAudio = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // ストリーミングURLを取得
        const streamUrl = await getStreamUrl(station.id)

        // Audio要素を作成
        const audio = new Audio(streamUrl)
        audio.volume = volume
        audioRef.current = audio

        // イベントリスナー
        audio.addEventListener('canplay', () => {
          setIsLoading(false)
          speech.speak(`${station.name} の再生を開始します`)
          audio.play().then(() => {
            setIsPlaying(true)
          }).catch((err) => {
            console.error('Play error:', err)
            setError('再生に失敗しました')
            speech.speak('再生に失敗しました')
          })
        })

        audio.addEventListener('error', (e) => {
          console.error('Audio error:', e)
          setIsLoading(false)
          setError('ストリーミングの読み込みに失敗しました')
          speech.speak('ストリーミングの読み込みに失敗しました')
        })

        audio.addEventListener('ended', () => {
          setIsPlaying(false)
        })

      } catch (err) {
        console.error('Init error:', err)
        setIsLoading(false)
        setError('ラジオ局への接続に失敗しました')
        speech.speak('ラジオ局への接続に失敗しました。この局は現在利用できません')
      }
    }

    initAudio()

    // クリーンアップ
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
    }
  }, [station.id])

  // 再生/一時停止
  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      speech.speak('一時停止しました')
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true)
        speech.speak('再生を再開しました')
      }).catch((err) => {
        console.error('Play error:', err)
        speech.speak('再生に失敗しました')
      })
    }
  }

  // 音量調整
  const changeVolume = (newVolume: number) => {
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    speech.speak(`音量を${Math.round(newVolume * 100)}パーセントに設定しました`)
  }

  // 戻る
  const handleBack = () => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    speech.stop()
    onBack()
  }

  // グリッドアクション
  const actions = [
    {
      label: '戻る',
      action: handleBack,
    },
    {
      label: isPlaying ? '一時停止' : '再生',
      action: togglePlay,
    },
    {
      label: '音量：大',
      action: () => changeVolume(1.0),
    },
    {
      label: '音量：中',
      action: () => changeVolume(0.7),
    },
    {
      label: '音量：小',
      action: () => changeVolume(0.4),
    },
    {
      label: '音量：最小',
      action: () => changeVolume(0.1),
    },
    {
      label: '局情報',
      action: () => {
        speech.speak(
          `現在再生中：${station.name}。` +
          `${station.description}。` +
          `状態：${isPlaying ? '再生中' : '一時停止中'}。` +
          `音量：${Math.round(volume * 100)}パーセント`
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
      label: isPlaying ? '再生中' : '停止中',
      action: () => {
        if (isLoading) {
          speech.speak('読み込み中です')
        } else if (error) {
          speech.speak(`エラー：${error}`)
        } else {
          speech.speak(
            isPlaying ? `${station.name} を再生中です` : '一時停止中です'
          )
        }
      },
    },
  ]

  return <GridSystem actions={actions} speech={speech} />
}
