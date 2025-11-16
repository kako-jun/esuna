'use client'

import { useEffect, useState, useRef } from 'react'
import { SpeechManager } from '../lib/speech'
import {
  getAllTimers,
  createTimer,
  startTimer,
  pauseTimer,
  deleteTimer,
  updateTimerRemaining,
  Timer,
  formatTime,
} from '../lib/timer'
import GridSystem from './GridSystem'

interface TimerManagerProps {
  speech: SpeechManager
  onBack: () => void
}

// 事前定義されたタイマー設定
const PRESET_TIMERS = [
  { title: '10秒（テスト用）', seconds: 10 },
  { title: '1分', seconds: 60 },
  { title: '3分', seconds: 180 },
  { title: '5分', seconds: 300 },
  { title: '10分', seconds: 600 },
  { title: '15分', seconds: 900 },
  { title: '30分', seconds: 1800 },
  { title: '1時間', seconds: 3600 },
]

export default function TimerManager({ speech, onBack }: TimerManagerProps) {
  const [timers, setTimers] = useState<Timer[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [presetIndex, setPresetIndex] = useState(0)
  const [mode, setMode] = useState<'list' | 'preset'>('list') // リスト表示またはプリセット選択
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // タイマー一覧を読み込み
  useEffect(() => {
    loadTimers()

    // 1秒ごとにタイマーを更新
    intervalRef.current = setInterval(() => {
      updateAllTimers()
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const loadTimers = () => {
    const allTimers = getAllTimers()
    setTimers(allTimers)

    setTimeout(() => {
      if (allTimers.length === 0) {
        speech.speak('タイマーはまだ設定されていません。プリセットボタンから設定できます')
      } else {
        speech.speak(`タイマー、${allTimers.length}件が設定されています`)
        if (allTimers.length > 0) {
          setTimeout(() => speakTimer(), 2000)
        }
      }
    }, 500)
  }

  // すべてのアクティブなタイマーを更新
  const updateAllTimers = () => {
    const allTimers = getAllTimers()
    let updated = false

    allTimers.forEach((timer) => {
      if (timer.isActive && timer.remainingSeconds > 0) {
        timer.remainingSeconds -= 1
        updateTimerRemaining(timer.id, timer.remainingSeconds)
        updated = true

        // タイマー完了
        if (timer.remainingSeconds === 0) {
          pauseTimer(timer.id)
          // アラーム音を鳴らす（speech使用）
          speech.speak(`タイマー「${timer.title}」が完了しました`, { interrupt: false })
        }
      }
    })

    if (updated) {
      setTimers([...allTimers])
    }
  }

  const currentTimer = timers[currentIndex]
  const currentPreset = PRESET_TIMERS[presetIndex]

  // タイマー情報を読み上げ
  const speakTimer = () => {
    if (!currentTimer) return

    const status = currentTimer.isActive ? '動作中' : '停止中'
    speech.speak(
      `タイマー ${currentIndex + 1}。${currentTimer.title}。` +
      `残り時間：${formatTime(currentTimer.remainingSeconds)}。${status}`,
      { interrupt: true }
    )
  }

  // プリセットを読み上げ
  const speakPreset = () => {
    speech.speak(`プリセット ${presetIndex + 1}。${currentPreset.title}`, { interrupt: true })
  }

  // プリセットモードに切り替え
  const switchToPreset = () => {
    setMode('preset')
    speech.speak('プリセットタイマー選択モードに切り替えました')
    setTimeout(speakPreset, 1000)
  }

  // リストモードに切り替え
  const switchToList = () => {
    setMode('list')
    speech.speak('タイマー一覧モードに切り替えました')
    if (timers.length > 0) {
      setTimeout(speakTimer, 1000)
    }
  }

  // タイマーを作成
  const createFromPreset = () => {
    const timer = createTimer(currentPreset.title, currentPreset.seconds)
    speech.speak(`${currentPreset.title}のタイマーを作成しました`)
    loadTimers()
    switchToList()
  }

  // タイマー開始/停止
  const toggleTimer = () => {
    if (!currentTimer) {
      speech.speak('タイマーがありません')
      return
    }

    if (currentTimer.isActive) {
      pauseTimer(currentTimer.id)
      speech.speak('タイマーを一時停止しました')
    } else {
      startTimer(currentTimer.id)
      speech.speak('タイマーを開始しました')
    }

    loadTimers()
  }

  // タイマー削除
  const deleteCurrent = () => {
    if (!currentTimer) {
      speech.speak('削除するタイマーがありません')
      return
    }

    deleteTimer(currentTimer.id)
    speech.speak('タイマーを削除しました')

    const updated = getAllTimers()
    setTimers(updated)

    if (currentIndex >= updated.length && updated.length > 0) {
      setCurrentIndex(updated.length - 1)
    } else if (updated.length === 0) {
      setCurrentIndex(0)
    }
  }

  // グリッドアクション（リストモード）
  const listActions = [
    {
      label: '戻る',
      action: () => {
        speech.stop()
        onBack()
      },
    },
    {
      label: '前',
      action: () => {
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1)
          setTimeout(speakTimer, 100)
        } else {
          speech.speak('最初のタイマーです')
        }
      },
    },
    {
      label: '次',
      action: () => {
        if (currentIndex < timers.length - 1) {
          setCurrentIndex(currentIndex + 1)
          setTimeout(speakTimer, 100)
        } else {
          speech.speak('最後のタイマーです')
        }
      },
    },
    {
      label: '情報',
      action: speakTimer,
    },
    {
      label: currentTimer?.isActive ? '停止' : '開始',
      action: toggleTimer,
    },
    {
      label: '削除',
      action: deleteCurrent,
    },
    {
      label: 'プリセット',
      action: switchToPreset,
    },
    {
      label: '件数',
      action: () => {
        if (timers.length === 0) {
          speech.speak('タイマーはまだ設定されていません')
        } else {
          speech.speak(`全${timers.length}件中、${currentIndex + 1}番目のタイマーです`)
        }
      },
    },
    {
      label: '停止音声',
      action: () => {
        speech.stop()
      },
    },
  ]

  // グリッドアクション（プリセットモード）
  const presetActions = [
    {
      label: '戻る',
      action: switchToList,
    },
    {
      label: '前',
      action: () => {
        if (presetIndex > 0) {
          setPresetIndex(presetIndex - 1)
          setTimeout(speakPreset, 100)
        } else {
          speech.speak('最初のプリセットです')
        }
      },
    },
    {
      label: '次',
      action: () => {
        if (presetIndex < PRESET_TIMERS.length - 1) {
          setPresetIndex(presetIndex + 1)
          setTimeout(speakPreset, 100)
        } else {
          speech.speak('最後のプリセットです')
        }
      },
    },
    {
      label: '読み上げ',
      action: speakPreset,
    },
    {
      label: '作成',
      action: createFromPreset,
    },
    {
      label: '',
      action: () => {},
    },
    {
      label: '',
      action: () => {},
    },
    {
      label: 'プリセット数',
      action: () => {
        speech.speak(`全${PRESET_TIMERS.length}プリセット中、${presetIndex + 1}番目です`)
      },
    },
    {
      label: '停止',
      action: () => {
        speech.stop()
      },
    },
  ]

  return <GridSystem actions={mode === 'list' ? listActions : presetActions} speech={speech} />
}
