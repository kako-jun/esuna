'use client'

import { useState, useEffect } from 'react'
import GridSystem from '@/components/GridSystem'
import HatenaEntryReader from '@/components/HatenaEntryReader'
import HatenaCommentReader from '@/components/HatenaCommentReader'
import SNSPostReader from '@/components/SNSPostReader'
import FivechBoardList from '@/components/FivechBoardList'
import FivechThreadList from '@/components/FivechThreadList'
import FivechPostReader from '@/components/FivechPostReader'
import NovelList from '@/components/NovelList'
import NovelReader from '@/components/NovelReader'
import PodcastList from '@/components/PodcastList'
import PodcastPlayer from '@/components/PodcastPlayer'
import RSSFeedList from '@/components/RSSFeedList'
import RSSArticleReader from '@/components/RSSArticleReader'
import FavoritesList from '@/components/FavoritesList'
import ContinueReading from '@/components/ContinueReading'
import VoiceMemoRecorder from '@/components/VoiceMemoRecorder'
import TimerManager from '@/components/TimerManager'
import RadioStationList from '@/components/RadioStationList'
import RadioPlayer from '@/components/RadioPlayer'
import AutoplaySettings from '@/components/AutoplaySettings'
import AutoplayPlayer from '@/components/AutoplayPlayer'
import { SpeechManager } from '@/lib/speech'
import { useAppStore } from '@/lib/store'
import { loadSettings, updateSetting } from '@/lib/storage'
import { fetchWeather, getCurrentTimeText, getWeatherText, getGreeting } from '@/lib/weather'
import { Favorite } from '@/lib/favorites'
import { Progress } from '@/lib/progress'
import { RadioStation } from '@/lib/radio'
import { AutoplayItem } from '@/lib/autoplay'

type Page = 'main' | 'news' | 'sns' | 'settings' | 'help' | 'tools' | 'audio' |
            'hatena-comments' | '5ch-boards' | '5ch-threads' | '5ch-posts' |
            'novel-list' | 'novel-content' | 'podcast-list' | 'podcast-episodes' |
            'rss-feeds' | 'rss-articles' | 'favorites' | 'continue-reading' |
            'voice-memo' | 'timer' | 'radio-stations' | 'radio-player' |
            'autoplay-settings' | 'autoplay-player'

export default function Home() {
  const [speechManager, setSpeechManager] = useState<SpeechManager | null>(null)
  const [currentPage, setCurrentPage] = useState<Page>('main')
  const [selectedRadioStation, setSelectedRadioStation] = useState<RadioStation | null>(null)
  const { setPage, setContentType, setAutoNavigation, autoNavigationEnabled } = useAppStore()

  useEffect(() => {
    const manager = new SpeechManager()

    // 設定を読み込んで適用
    const settings = loadSettings()
    if (settings.speech.voice) {
      manager.setVoiceByName(settings.speech.voice)
    }

    // 自動ナビゲーション設定を反映
    setAutoNavigation(settings.ui.autoNavigation)

    setSpeechManager(manager)

    // 起動時の読み上げ
    setTimeout(async () => {
      let message = getGreeting() + '。Esuna へようこそ。';

      // 時刻読み上げ
      if (settings.ui.speakTimeOnStart) {
        message += getCurrentTimeText() + '。';
      }

      // 天気予報読み上げ
      if (settings.ui.speakWeatherOnStart && settings.weather.enabled) {
        try {
          const weather = await fetchWeather(settings.weather.city);
          message += getWeatherText(weather) + '。';
        } catch (error) {
          console.error('Weather fetch error:', error);
          // 天気予報取得失敗時はスキップ
        }
      }

      message += 'キーボードの任意のキーを押してキーボードモードに切り替えるか、画面をタップして操作してください。';

      manager.speak(message, {
        rate: settings.speech.rate,
        pitch: settings.speech.pitch,
        volume: settings.speech.volume,
      });
    }, 1000)

    return () => {
      manager.stop()
    }
  }, [])

  const navigateTo = (page: Page) => {
    setCurrentPage(page)
    setPage(page as any)
  }

  const mainMenuActions = [
    {
      label: 'はてブ',
      action: () => {
        navigateTo('news')
        setContentType('hatena-hot')
        speechManager?.speak('はてなブックマーク 人気エントリーに移動しました')
      },
    },
    {
      label: 'SNS',
      action: () => {
        navigateTo('sns')
        setContentType('sns')
        speechManager?.speak('SNS投稿に移動しました')
      },
    },
    {
      label: '5ch',
      action: () => {
        navigateTo('5ch-boards')
        speechManager?.speak('5ちゃんねる 板一覧に移動しました')
      },
    },
    {
      label: 'ニュース',
      action: () => {
        navigateTo('rss-feeds')
        speechManager?.speak('RSSニュース フィード一覧に移動しました')
      },
    },
    {
      label: '小説',
      action: () => {
        navigateTo('novel-list')
        setContentType('novel')
        speechManager?.speak('青空文庫 小説一覧に移動しました')
      },
    },
    {
      label: 'オーディオ',
      action: () => {
        navigateTo('audio')
        speechManager?.speak('オーディオメニューに移動しました。Podcastとラジオが利用できます')
      },
    },
    {
      label: 'ツール',
      action: () => {
        navigateTo('tools')
        speechManager?.speak('ツールメニューに移動しました。お気に入り、続きから再生、音声メモ、タイマーが利用できます')
      },
    },
    {
      label: '設定',
      action: () => {
        navigateTo('settings')
        speechManager?.speak('設定ページに移動しました')
      },
    },
    {
      label: '停止',
      action: () => {
        speechManager?.stop()
      },
    },
  ]

  const toolsMenuActions = [
    {
      label: '戻る',
      action: () => {
        navigateTo('main')
        speechManager?.speak('メインメニューに戻りました')
      },
    },
    {
      label: 'お気に入り',
      action: () => {
        navigateTo('favorites')
        speechManager?.speak('お気に入り一覧に移動しました')
      },
    },
    {
      label: '続きから',
      action: () => {
        navigateTo('continue-reading')
        speechManager?.speak('続きから再生に移動しました')
      },
    },
    {
      label: 'メモ',
      action: () => {
        navigateTo('voice-memo')
        speechManager?.speak('音声メモに移動しました')
      },
    },
    {
      label: 'タイマー',
      action: () => {
        navigateTo('timer')
        speechManager?.speak('タイマーに移動しました')
      },
    },
    {
      label: 'おまかせ',
      action: () => {
        navigateTo('autoplay-settings')
        speechManager?.speak('おまかせモード設定に移動しました')
      },
    },
    {
      label: 'ヘルプ',
      action: () => {
        navigateTo('help')
        speechManager?.speak('ヘルプページに移動しました')
      },
    },
    {
      label: '情報',
      action: () => {
        speechManager?.speak(
          'Esuna バージョン 0.6.0。' +
          '視覚障害者向けアクセシブルWebアプリケーション。' +
          'はてなブックマーク、SNS、5ちゃんねる、RSSニュース、青空文庫、Podcast、ラジオ、' +
          'お気に入り、続きから再生、音声メモ、タイマー、おまかせモードが利用できます。'
        )
      },
    },
    {
      label: '読み上げ',
      action: () => {
        speechManager?.speak('ツールメニュー。お気に入り、続きから再生、音声メモ、タイマー、おまかせ、ヘルプ、情報、読み上げ、停止が利用できます')
      },
    },
    {
      label: '停止',
      action: () => {
        speechManager?.stop()
      },
    },
  ]

  const audioMenuActions = [
    {
      label: '戻る',
      action: () => {
        navigateTo('main')
        speechManager?.speak('メインメニューに戻りました')
      },
    },
    {
      label: 'Podcast',
      action: () => {
        navigateTo('podcast-list')
        setContentType('podcast')
        speechManager?.speak('Podcast一覧に移動しました')
      },
    },
    {
      label: 'ラジオ',
      action: () => {
        navigateTo('radio-stations')
        speechManager?.speak('ラジオ局一覧に移動しました')
      },
    },
    {
      label: '読み上げ',
      action: () => {
        speechManager?.speak('オーディオメニュー。Podcast、ラジオ、読み上げ、停止が利用できます')
      },
    },
    {
      label: '停止',
      action: () => {
        speechManager?.stop()
      },
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
      label: '',
      action: () => {},
    },
    {
      label: '',
      action: () => {},
    },
  ]

  const settingsActions = [
    {
      label: '戻る',
      action: () => {
        navigateTo('main')
        speechManager?.speak('メインメニューに戻りました')
      },
    },
    {
      label: '速度：遅',
      action: () => {
        updateSetting('speech', { rate: 0.7 })
        speechManager?.speak('読み上げ速度を遅くしました。設定を保存しました', { rate: 0.7 })
      },
    },
    {
      label: '速度：標準',
      action: () => {
        updateSetting('speech', { rate: 1.0 })
        speechManager?.speak('読み上げ速度を標準にしました。設定を保存しました', { rate: 1.0 })
      },
    },
    {
      label: '速度：速',
      action: () => {
        updateSetting('speech', { rate: 1.5 })
        speechManager?.speak('読み上げ速度を速くしました。設定を保存しました', { rate: 1.5 })
      },
    },
    {
      label: 'ピッチ：低',
      action: () => {
        updateSetting('speech', { pitch: 0.7 })
        speechManager?.speak('ピッチを低くしました。設定を保存しました', { pitch: 0.7 })
      },
    },
    {
      label: 'ピッチ：標準',
      action: () => {
        updateSetting('speech', { pitch: 1.0 })
        speechManager?.speak('ピッチを標準にしました。設定を保存しました', { pitch: 1.0 })
      },
    },
    {
      label: 'ピッチ：高',
      action: () => {
        updateSetting('speech', { pitch: 1.5 })
        speechManager?.speak('ピッチを高くしました。設定を保存しました', { pitch: 1.5 })
      },
    },
    {
      label: '音量：小',
      action: () => {
        updateSetting('speech', { volume: 0.5 })
        speechManager?.speak('音量を小さくしました。設定を保存しました', { volume: 0.5 })
      },
    },
    {
      label: autoNavigationEnabled ? '自動OFF' : '自動ON',
      action: () => {
        const newValue = !autoNavigationEnabled
        setAutoNavigation(newValue)
        updateSetting('ui', { autoNavigation: newValue })
        speechManager?.speak(
          newValue
            ? '自動ナビゲーションを有効にしました。音声読み上げ後、自動的に次のコンテンツに移動します'
            : '自動ナビゲーションを無効にしました'
        )
      },
    },
  ]

  const helpActions = [
    {
      label: '戻る',
      action: () => {
        navigateTo('main')
        speechManager?.speak('メインメニューに戻りました')
      },
    },
    {
      label: '操作方法',
      action: () => {
        speechManager?.speak(
          '操作方法を説明します。画面は9つのエリアに分かれています。' +
          '数字の1から9のキーで直接選択するか、矢印キーで移動してEnterキーで決定できます。' +
          'Escapeキーで読み上げを停止できます。'
        )
      },
    },
    {
      label: '機能説明',
      action: () => {
        speechManager?.speak(
          '利用可能な機能を説明します。' +
          'はてブ：はてなブックマークの人気エントリーとコメントを閲覧できます。' +
          'SNS：Twitter、Mastodon、Blueskyの投稿を閲覧できます。' +
          '5ch：5ちゃんねるの板、スレッド、投稿を閲覧できます。'
        )
      },
    },
    {
      label: 'キーボード',
      action: () => {
        speechManager?.speak(
          'キーボード操作を説明します。' +
          '1から9キー：各エリアを直接選択。' +
          '矢印キー：エリア間を移動。' +
          'Enterキー：選択したエリアを実行。' +
          'Escapeキー：読み上げ停止または前のページに戻る。'
        )
      },
    },
    {
      label: 'タッチ',
      action: () => {
        speechManager?.speak(
          'タッチ操作を説明します。' +
          '画面をタップ：そのエリアを選択して実行。' +
          'ダブルタップ：再度実行。'
        )
      },
    },
    {
      label: '音声',
      action: () => {
        speechManager?.speak(
          '音声機能を説明します。' +
          'すべての操作は音声でガイダンスされます。' +
          '設定から読み上げ速度とピッチを調整できます。' +
          '停止ボタンでいつでも読み上げを停止できます。'
        )
      },
    },
    {
      label: '自動ナビゲーション',
      action: () => {
        speechManager?.speak(
          '自動ナビゲーション機能を説明します。' +
          '設定で有効にすると、音声読み上げ完了後、自動的に次のコンテンツに移動します。' +
          'ハンズフリーで連続閲覧ができます。'
        )
      },
    },
    {
      label: 'バージョン',
      action: () => {
        speechManager?.speak('Esuna バージョン 0.6.0')
      },
    },
    {
      label: '停止',
      action: () => {
        speechManager?.stop()
      },
    },
  ]

  if (!speechManager) {
    return <div>読み込み中...</div>
  }

  // ページごとの表示
  switch (currentPage) {
    case 'news':
      return (
        <main>
          <HatenaEntryReader
            type="hot"
            speech={speechManager}
            onBack={() => {
              navigateTo('main')
              speechManager.speak('メインメニューに戻りました')
            }}
            onViewComments={() => {
              navigateTo('hatena-comments')
            }}
          />
        </main>
      )

    case 'sns':
      return (
        <main>
          <SNSPostReader
            speech={speechManager}
            onBack={() => {
              navigateTo('main')
              speechManager.speak('メインメニューに戻りました')
            }}
          />
        </main>
      )

    case 'hatena-comments':
      return (
        <main>
          <HatenaCommentReader
            speech={speechManager}
            onBack={() => {
              navigateTo('news')
              speechManager.speak('はてなブックマークに戻りました')
            }}
          />
        </main>
      )

    case '5ch-boards':
      return (
        <main>
          <FivechBoardList
            speech={speechManager}
            onBack={() => {
              navigateTo('main')
              speechManager.speak('メインメニューに戻りました')
            }}
            onSelectBoard={() => {
              navigateTo('5ch-threads')
            }}
          />
        </main>
      )

    case '5ch-threads':
      return (
        <main>
          <FivechThreadList
            speech={speechManager}
            onBack={() => {
              navigateTo('5ch-boards')
              speechManager.speak('板一覧に戻りました')
            }}
            onSelectThread={() => {
              navigateTo('5ch-posts')
            }}
          />
        </main>
      )

    case '5ch-posts':
      return (
        <main>
          <FivechPostReader
            speech={speechManager}
            onBack={() => {
              navigateTo('5ch-threads')
              speechManager.speak('スレッド一覧に戻りました')
            }}
          />
        </main>
      )

    case 'novel-list':
      return (
        <main>
          <NovelList
            speech={speechManager}
            onBack={() => {
              navigateTo('main')
              speechManager.speak('メインメニューに戻りました')
            }}
            onSelectNovel={() => {
              navigateTo('novel-content')
            }}
          />
        </main>
      )

    case 'novel-content':
      return (
        <main>
          <NovelReader
            speech={speechManager}
            onBack={() => {
              navigateTo('novel-list')
              speechManager.speak('小説一覧に戻りました')
            }}
          />
        </main>
      )

    case 'podcast-list':
      return (
        <main>
          <PodcastList
            speech={speechManager}
            onBack={() => {
              navigateTo('audio')
              speechManager.speak('オーディオメニューに戻りました')
            }}
            onSelectPodcast={() => {
              navigateTo('podcast-episodes')
            }}
          />
        </main>
      )

    case 'podcast-episodes':
      return (
        <main>
          <PodcastPlayer
            speech={speechManager}
            onBack={() => {
              navigateTo('podcast-list')
              speechManager.speak('Podcast一覧に戻りました')
            }}
          />
        </main>
      )

    case 'rss-feeds':
      return (
        <main>
          <RSSFeedList
            speech={speechManager}
            onBack={() => {
              navigateTo('main')
              speechManager.speak('メインメニューに戻りました')
            }}
            onSelectFeed={() => {
              navigateTo('rss-articles')
            }}
          />
        </main>
      )

    case 'rss-articles':
      return (
        <main>
          <RSSArticleReader
            speech={speechManager}
            onBack={() => {
              navigateTo('rss-feeds')
              speechManager.speak('フィード一覧に戻りました')
            }}
          />
        </main>
      )

    case 'favorites':
      return (
        <main>
          <FavoritesList
            speech={speechManager}
            onBack={() => {
              navigateTo('main')
              speechManager.speak('メインメニューに戻りました')
            }}
            onSelectFavorite={(favorite: Favorite) => {
              // お気に入りの種類に応じて適切なページに遷移
              // 今回はシンプルにメッセージのみ
              speechManager.speak(`${favorite.title} を開く機能は今後実装予定です`)
            }}
          />
        </main>
      )

    case 'continue-reading':
      return (
        <main>
          <ContinueReading
            speech={speechManager}
            onBack={() => {
              navigateTo('main')
              speechManager.speak('メインメニューに戻りました')
            }}
            onSelectProgress={(progress: Progress) => {
              // 進捗の種類に応じて適切なページに遷移
              // 今回はシンプルにメッセージのみ
              speechManager.speak(`${progress.title} の続きから再生する機能は今後実装予定です`)
            }}
          />
        </main>
      )

    case 'voice-memo':
      return (
        <main>
          <VoiceMemoRecorder
            speech={speechManager}
            onBack={() => {
              navigateTo('main')
              speechManager.speak('メインメニューに戻りました')
            }}
          />
        </main>
      )

    case 'timer':
      return (
        <main>
          <TimerManager
            speech={speechManager}
            onBack={() => {
              navigateTo('main')
              speechManager.speak('メインメニューに戻りました')
            }}
          />
        </main>
      )

    case 'tools':
      return (
        <main>
          <GridSystem actions={toolsMenuActions} speech={speechManager} />
        </main>
      )

    case 'audio':
      return (
        <main>
          <GridSystem actions={audioMenuActions} speech={speechManager} />
        </main>
      )

    case 'radio-stations':
      return (
        <main>
          <RadioStationList
            speech={speechManager}
            onBack={() => {
              navigateTo('audio')
              speechManager.speak('オーディオメニューに戻りました')
            }}
            onSelectStation={(station: RadioStation) => {
              setSelectedRadioStation(station)
              navigateTo('radio-player')
            }}
          />
        </main>
      )

    case 'radio-player':
      if (!selectedRadioStation) {
        navigateTo('radio-stations')
        return null
      }
      return (
        <main>
          <RadioPlayer
            station={selectedRadioStation}
            speech={speechManager}
            onBack={() => {
              navigateTo('radio-stations')
              speechManager.speak('ラジオ局一覧に戻りました')
            }}
          />
        </main>
      )

    case 'autoplay-settings':
      return (
        <main>
          <AutoplaySettings
            speech={speechManager}
            onBack={() => {
              navigateTo('tools')
              speechManager.speak('ツールメニューに戻りました')
            }}
            onStartAutoplay={() => {
              navigateTo('autoplay-player')
            }}
          />
        </main>
      )

    case 'autoplay-player':
      return (
        <main>
          <AutoplayPlayer
            speech={speechManager}
            onBack={() => {
              navigateTo('autoplay-settings')
              speechManager.speak('おまかせ設定に戻りました')
            }}
            onNavigateToContent={(item: AutoplayItem) => {
              // コンテンツタイプに応じて適切なページに遷移
              switch (item.type) {
                case 'novel':
                  navigateTo('novel-list')
                  break
                case 'podcast':
                  navigateTo('podcast-list')
                  break
                case 'radio':
                  setSelectedRadioStation(item.data)
                  navigateTo('radio-player')
                  break
                case 'rss-news':
                  navigateTo('rss-feeds')
                  break
                case 'hatena':
                  navigateTo('news')
                  setContentType('hatena-hot')
                  break
              }
            }}
          />
        </main>
      )

    case 'settings':
      return (
        <main>
          <GridSystem actions={settingsActions} speech={speechManager} />
        </main>
      )

    case 'help':
      return (
        <main>
          <GridSystem actions={helpActions} speech={speechManager} />
        </main>
      )

    default:
      return (
        <main>
          <GridSystem actions={mainMenuActions} speech={speechManager} />
        </main>
      )
  }
}
