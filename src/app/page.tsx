'use client'

import { useState, useEffect, useCallback } from 'react'
import GridSystem from '@/components/GridSystem'
import ContentReader from '@/components/ContentReader'
import { SpeechManager } from '@/lib/speech'

export default function Home() {
  const [speechManager, setSpeechManager] = useState<SpeechManager | null>(null)
  const [currentPage, setCurrentPage] = useState('main')

  useEffect(() => {
    const manager = new SpeechManager()
    setSpeechManager(manager)
    
    setTimeout(() => {
      manager.speak('Esuna へようこそ。視覚障害者向けアクセシブルアプリケーションです。キーボードの任意のキーを押してキーボードモードに切り替えるか、画面をタップして操作してください。')
    }, 1000)

    return () => {
      manager.stop()
    }
  }, [])

  const handleSpeak = useCallback((text: string) => {
    speechManager?.speak(text)
  }, [speechManager])

  const mainMenuItems = [
    {
      id: 1,
      label: 'ニュース',
      ariaLabel: '1番、ニュースを読む',
      action: () => {
        setCurrentPage('news')
        handleSpeak('ニュースページに移動しました')
      }
    },
    {
      id: 2,
      label: 'SNS',
      ariaLabel: '2番、SNSの投稿を読む',
      action: () => {
        setCurrentPage('sns')
        handleSpeak('SNSページに移動しました')
      }
    },
    {
      id: 3,
      label: '設定',
      ariaLabel: '3番、設定画面を開く',
      action: () => {
        setCurrentPage('settings')
        handleSpeak('設定ページに移動しました')
      }
    },
    {
      id: 4,
      label: '読み上げ\nテスト',
      ariaLabel: '4番、読み上げ機能をテストする',
      action: () => {
        handleSpeak('これは読み上げ機能のテストです。正常に動作しています。')
      }
    },
    {
      id: 5,
      label: 'ヘルプ',
      ariaLabel: '5番、ヘルプを表示する',
      action: () => {
        setCurrentPage('help')
        handleSpeak('ヘルプページに移動しました')
      }
    },
    {
      id: 6,
      label: '停止',
      ariaLabel: '6番、読み上げを停止する',
      action: () => {
        speechManager?.stop()
        handleSpeak('読み上げを停止しました')
      }
    }
  ]

  const newsItems = [
    {
      id: 1,
      label: '戻る',
      ariaLabel: '1番、メインメニューに戻る',
      action: () => {
        setCurrentPage('main')
        handleSpeak('メインメニューに戻りました')
      }
    },
    {
      id: 2,
      label: '最新\nニュース',
      ariaLabel: '2番、最新ニュースを読む',
      action: () => {
        handleSpeak('最新ニュースを読み上げます。現在、サンプルニュースです。本日は晴天なり。')
      }
    },
    {
      id: 3,
      label: '天気',
      ariaLabel: '3番、天気予報を聞く',
      action: () => {
        handleSpeak('今日の天気予報です。晴れ、最高気温25度、最低気温15度の予報です。')
      }
    }
  ]

  const getCurrentItems = () => {
    switch (currentPage) {
      case 'news':
        return []
      case 'sns':
        return []
      case 'settings':
        return [
          {
            id: 1,
            label: '戻る',
            ariaLabel: '1番、メインメニューに戻る',
            action: () => {
              setCurrentPage('main')
              handleSpeak('メインメニューに戻りました')
            }
          },
          {
            id: 2,
            label: '読み上げ\n速度調整',
            ariaLabel: '2番、読み上げ速度を調整する',
            action: () => {
              speechManager?.speak('読み上げ速度の調整機能は今後実装予定です。', { rate: 0.8 })
            }
          }
        ]
      case 'help':
        return [
          {
            id: 1,
            label: '戻る',
            ariaLabel: '1番、メインメニューに戻る',
            action: () => {
              setCurrentPage('main')
              handleSpeak('メインメニューに戻りました')
            }
          },
          {
            id: 2,
            label: '操作方法',
            ariaLabel: '2番、操作方法を聞く',
            action: () => {
              handleSpeak('操作方法を説明します。画面は9つのエリアに分かれています。数字の1から9のキーで直接選択するか、矢印キーで移動してEnterキーで決定できます。Escapeキーで読み上げを停止できます。')
            }
          }
        ]
      default:
        return mainMenuItems
    }
  }

  if (!speechManager) {
    return <div>読み込み中...</div>
  }

  // コンテンツリーダーページの場合
  if (currentPage === 'news' || currentPage === 'sns') {
    return (
      <main>
        <ContentReader
          type={currentPage}
          onSpeak={handleSpeak}
          onBack={() => {
            setCurrentPage('main')
            handleSpeak('メインメニューに戻りました')
          }}
        />
      </main>
    )
  }

  return (
    <main>
      <GridSystem 
        items={getCurrentItems()}
        onSpeak={handleSpeak}
      />
    </main>
  )
}