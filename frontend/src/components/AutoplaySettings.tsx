'use client'

import { useEffect, useState } from 'react'
import {
  loadAutoplaySettings,
  saveAutoplaySettings,
  AutoplaySettings,
  AutoplayContentType,
  getContentTypeName,
} from '../lib/autoplay'
import { SpeechManager } from '../lib/speech'
import GridSystem from './GridSystem'

interface AutoplaySettingsProps {
  speech: SpeechManager
  onBack: () => void
  onStartAutoplay: () => void
}

export default function AutoplaySettingsComponent({
  speech,
  onBack,
  onStartAutoplay,
}: AutoplaySettingsProps) {
  const [settings, setSettings] = useState<AutoplaySettings>(loadAutoplaySettings())

  const allContentTypes: AutoplayContentType[] = [
    'novel',
    'podcast',
    'radio',
    'rss-news',
    'hatena',
  ]

  // 初回読み上げ
  useEffect(() => {
    setTimeout(() => {
      speech.speak(
        'おまかせモード設定。' +
        '再生するコンテンツの種類を選択してください。' +
        `現在、${settings.enabledTypes.length}種類が有効です`
      )
    }, 500)
  }, [])

  // コンテンツタイプのトグル
  const toggleContentType = (type: AutoplayContentType) => {
    const newSettings = { ...settings }
    const index = newSettings.enabledTypes.indexOf(type)

    if (index >= 0) {
      // 無効化
      newSettings.enabledTypes = newSettings.enabledTypes.filter((t) => t !== type)
      speech.speak(`${getContentTypeName(type)}を無効にしました`)
    } else {
      // 有効化
      newSettings.enabledTypes.push(type)
      speech.speak(`${getContentTypeName(type)}を有効にしました`)
    }

    setSettings(newSettings)
    saveAutoplaySettings(newSettings)
  }

  // 再生時間変更
  const setPlayDuration = (duration: number) => {
    const newSettings = { ...settings, playDuration: duration }
    setSettings(newSettings)
    saveAutoplaySettings(newSettings)
    speech.speak(`各コンテンツの再生時間を${duration}分に設定しました`)
  }

  // シャッフル切り替え
  const toggleShuffle = () => {
    const newSettings = { ...settings, shuffle: !settings.shuffle }
    setSettings(newSettings)
    saveAutoplaySettings(newSettings)
    speech.speak(newSettings.shuffle ? 'シャッフル再生を有効にしました' : 'シャッフル再生を無効にしました')
  }

  // おまかせ開始
  const startAutoplay = () => {
    if (settings.enabledTypes.length === 0) {
      speech.speak('再生するコンテンツが選択されていません')
      return
    }
    speech.speak('おまかせモードを開始します')
    onStartAutoplay()
  }

  // 有効なコンテンツタイプの説明
  const getEnabledTypesDescription = (): string => {
    if (settings.enabledTypes.length === 0) {
      return 'なし'
    }
    return settings.enabledTypes.map((t) => getContentTypeName(t)).join('、')
  }

  // グリッドアクション
  const actions = [
    {
      label: '戻る',
      action: onBack,
    },
    {
      label: '小説：' + (settings.enabledTypes.includes('novel') ? 'ON' : 'OFF'),
      action: () => toggleContentType('novel'),
    },
    {
      label: 'Podcast：' + (settings.enabledTypes.includes('podcast') ? 'ON' : 'OFF'),
      action: () => toggleContentType('podcast'),
    },
    {
      label: 'ラジオ：' + (settings.enabledTypes.includes('radio') ? 'ON' : 'OFF'),
      action: () => toggleContentType('radio'),
    },
    {
      label: 'ニュース：' + (settings.enabledTypes.includes('rss-news') ? 'ON' : 'OFF'),
      action: () => toggleContentType('rss-news'),
    },
    {
      label: 'はてブ：' + (settings.enabledTypes.includes('hatena') ? 'ON' : 'OFF'),
      action: () => toggleContentType('hatena'),
    },
    {
      label: '時間：5分',
      action: () => setPlayDuration(5),
    },
    {
      label: '時間：10分',
      action: () => setPlayDuration(10),
    },
    {
      label: '開始',
      action: startAutoplay,
    },
  ]

  return <GridSystem actions={actions} speech={speech} />
}
