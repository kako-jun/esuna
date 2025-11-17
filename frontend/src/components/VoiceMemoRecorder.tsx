'use client'

import { useEffect, useState, useRef } from 'react'
import { SpeechManager } from '../lib/speech'
import { saveMemo, getAllMemos, deleteMemo, VoiceMemo, blobToBase64, base64ToBlob } from '../lib/voice-memo'
import GridSystem from './GridSystem'

interface VoiceMemoRecorderProps {
  speech: SpeechManager
  onBack: () => void
}

export default function VoiceMemoRecorder({ speech, onBack }: VoiceMemoRecorderProps) {
  const [memos, setMemos] = useState<VoiceMemo[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  // メモ一覧を読み込み
  useEffect(() => {
    loadMemos()

    return () => {
      // クリーンアップ
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  const loadMemos = () => {
    const allMemos = getAllMemos()
    setMemos(allMemos)

    setTimeout(() => {
      if (allMemos.length === 0) {
        speech.speak('音声メモはまだ録音されていません。録音ボタンで録音を開始できます')
      } else {
        speech.speak(`音声メモ、${allMemos.length}件が保存されています`)
        if (allMemos.length > 0) {
          setTimeout(() => speakMemo(), 2000)
        }
      }
    }, 500)
  }

  const currentMemo = memos[currentIndex]

  // メモ情報を読み上げ
  const speakMemo = () => {
    if (!currentMemo) return

    const createdDate = new Date(currentMemo.createdAt).toLocaleString('ja-JP')
    const minutes = Math.floor(currentMemo.duration / 60)
    const seconds = Math.floor(currentMemo.duration % 60)

    speech.speak(
      `メモ ${currentIndex + 1}。タイトル：${currentMemo.title}。` +
      `長さ：${minutes}分${seconds}秒。録音日時：${createdDate}`,
      { interrupt: true }
    )
  }

  // 録音開始
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      setRecordingTime(0)

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const base64Data = await blobToBase64(audioBlob)

        // メモを保存
        const now = new Date()
        const title = `音声メモ ${now.toLocaleString('ja-JP')}`

        saveMemo({
          title,
          audioData: base64Data,
          duration: recordingTime,
          tags: [],
        })

        speech.speak(`音声メモを保存しました。長さは${recordingTime}秒です`)

        // メモ一覧を再読み込み
        loadMemos()

        // ストリームを停止
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      speech.speak('録音を開始しました')

      // タイマー開始
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Failed to start recording:', error)
      speech.speak('録音の開始に失敗しました。マイクの許可を確認してください')
    }
  }

  // 録音停止
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      speech.speak('録音を停止しました')

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
    }
  }

  // 再生
  const playMemo = () => {
    if (!currentMemo) {
      speech.speak('再生するメモがありません')
      return
    }

    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
      speech.speak('再生を一時停止しました')
      return
    }

    try {
      const audioBlob = base64ToBlob(currentMemo.audioData)
      const audioUrl = URL.createObjectURL(audioBlob)

      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl)
        audioRef.current.addEventListener('ended', () => {
          setIsPlaying(false)
          speech.speak('再生が終了しました')
        })
      } else {
        audioRef.current.src = audioUrl
      }

      audioRef.current.play()
      setIsPlaying(true)
      speech.speak('再生を開始します')
    } catch (error) {
      console.error('Failed to play memo:', error)
      speech.speak('再生に失敗しました')
    }
  }

  // 削除
  const deleteCurrent = () => {
    if (!currentMemo) {
      speech.speak('削除するメモがありません')
      return
    }

    deleteMemo(currentMemo.id)
    speech.speak('メモを削除しました')

    const updated = getAllMemos()
    setMemos(updated)

    if (currentIndex >= updated.length && updated.length > 0) {
      setCurrentIndex(updated.length - 1)
    } else if (updated.length === 0) {
      setCurrentIndex(0)
    }
  }

  // グリッドアクション
  const actions = [
    {
      label: '戻る',
      action: () => {
        speech.stop()
        if (isRecording) {
          stopRecording()
        }
        if (isPlaying) {
          audioRef.current?.pause()
        }
        onBack()
      },
    },
    {
      label: '前のメモ',
      action: () => {
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1)
          setTimeout(speakMemo, 100)
        } else {
          speech.speak('最初のメモです')
        }
      },
    },
    {
      label: '次のメモ',
      action: () => {
        if (currentIndex < memos.length - 1) {
          setCurrentIndex(currentIndex + 1)
          setTimeout(speakMemo, 100)
        } else {
          speech.speak('最後のメモです')
        }
      },
    },
    {
      label: '情報',
      action: speakMemo,
    },
    {
      label: isRecording ? '録音停止' : '録音開始',
      action: isRecording ? stopRecording : startRecording,
    },
    {
      label: isPlaying ? '停止' : '再生',
      action: playMemo,
    },
    {
      label: '削除',
      action: deleteCurrent,
    },
    {
      label: '件数',
      action: () => {
        if (memos.length === 0) {
          speech.speak('メモはまだ保存されていません')
        } else {
          speech.speak(`全${memos.length}件中、${currentIndex + 1}番目のメモです`)
        }
      },
    },
    {
      label: '停止',
      action: () => {
        speech.stop()
        if (isPlaying) {
          audioRef.current?.pause()
          setIsPlaying(false)
        }
      },
    },
  ]

  return (
    <div>
      {isRecording && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded">
          録音中... {recordingTime}秒
        </div>
      )}
      <GridSystem actions={actions} speech={speech} />
    </div>
  )
}
