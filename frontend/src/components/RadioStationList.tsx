'use client'

import { useEffect, useState } from 'react'
import { getAllStations, RadioStation } from '../lib/radio'
import { SpeechManager } from '../lib/speech'
import GridSystem from './GridSystem'

interface RadioStationListProps {
  speech: SpeechManager
  onBack: () => void
  onSelectStation: (station: RadioStation) => void
}

export default function RadioStationList({ speech, onBack, onSelectStation }: RadioStationListProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const allStations = getAllStations()
  const currentStation = allStations[currentIndex]

  // 局を読み上げ
  const speakStation = () => {
    if (!currentStation) return
    speech.speak(
      `${currentStation.name}。${currentStation.description}。ラジオ局番号 ${currentIndex + 1}`,
      { interrupt: true }
    )
  }

  // 初回読み上げ
  useEffect(() => {
    setTimeout(() => {
      speech.speak(`ラジオ、${allStations.length}のラジオ局を用意しています`)
      setTimeout(speakStation, 2000)
    }, 500)
  }, [])

  // 次の局
  const nextStation = () => {
    if (currentIndex < allStations.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setTimeout(() => {
        const station = allStations[currentIndex + 1]
        speech.speak(`${station.name}`, { interrupt: true })
      }, 100)
    } else {
      speech.speak('最後のラジオ局です')
    }
  }

  // 前の局
  const prevStation = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setTimeout(() => {
        const station = allStations[currentIndex - 1]
        speech.speak(`${station.name}`, { interrupt: true })
      }, 100)
    } else {
      speech.speak('最初のラジオ局です')
    }
  }

  // 局を選択して再生開始
  const selectStation = () => {
    speech.speak(`${currentStation.name} を起動しています`)
    onSelectStation(currentStation)
  }

  // サービス名を日本語で取得
  const getServiceName = (service: string) => {
    switch (service) {
      case 'nhk':
        return 'NHKらじるらじる'
      case 'radiko':
        return 'radiko'
      case 'other':
        return 'その他'
      default:
        return service
    }
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
      label: '前の局',
      action: prevStation,
    },
    {
      label: '次の局',
      action: nextStation,
    },
    {
      label: '読み上げ',
      action: speakStation,
    },
    {
      label: '再生',
      action: selectStation,
    },
    {
      label: '局情報',
      action: () => {
        speech.speak(
          `ラジオ局番号 ${currentIndex + 1}。` +
          `名前：${currentStation.name}。` +
          `サービス：${getServiceName(currentStation.service)}。` +
          `説明：${currentStation.description}`
        )
      },
    },
    {
      label: '局数',
      action: () => {
        speech.speak(`全${allStations.length}局中、${currentIndex + 1}番目のラジオ局です`)
      },
    },
    {
      label: '停止',
      action: () => {
        speech.stop()
      },
    },
    {
      label: '先頭',
      action: () => {
        setCurrentIndex(0)
        setTimeout(() => {
          const station = allStations[0]
          speech.speak(
            `最初のラジオ局に戻りました。${station.name}`,
            { interrupt: true }
          )
        }, 100)
      },
    },
  ]

  return <GridSystem actions={actions} speech={speech} />
}
