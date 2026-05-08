import { createSignal, onMount } from 'solid-js'
import { useAppStore } from '../lib/store'
import { fetchHatenaHot, fetchHatenaLatest } from '../lib/api-client'
import { SpeechManager } from '../lib/speech'
import { useAutoNavigation } from '../lib/useAutoNavigation'
import GridSystem, { GridAction } from './GridSystem'
import { previewText } from '../lib/service-copy'
import { createGuideAction } from '../lib/grid-guide'

interface HatenaEntryReaderProps {
  speech: SpeechManager
  onBack: () => void
  onViewComments: () => void
  type: 'hot' | 'latest'
}

export default function HatenaEntryReader(props: HatenaEntryReaderProps) {
  const store = useAppStore()
  const [loading, setLoading] = createSignal(false)

  onMount(() => {
    if (store.state.hatenaEntries.length === 0) {
      loadEntries()
    }
  })

  const loadEntries = async () => {
    setLoading(true)
    try {
      const entries = props.type === 'hot' ? await fetchHatenaHot() : await fetchHatenaLatest()
      store.setHatenaEntries(entries)
      props.speech.speak(`${entries.length}件のエントリーを読み込みました`)
    } catch (err) {
      console.error('Failed to load entries:', err)
      props.speech.speak(
        'はてなブックマークのエントリーを取得できませんでした。外部サービスへの接続に失敗しました。1番で戻るか、4番でもう一度試せます。',
      )
    } finally {
      setLoading(false)
    }
  }

  const speakEntry = () => {
    const currentEntry = store.getCurrentEntry()
    if (!currentEntry) return

    const texts: string[] = [currentEntry.title]
    if (currentEntry.description) {
      texts.push(currentEntry.description.slice(0, 200))
    }
    if (currentEntry.bookmark_count > 0) {
      texts.push(`${currentEntry.bookmark_count}ブックマーク`)
    }
    props.speech.speakQueue(texts)
  }

  useAutoNavigation({
    get enabled() {
      return store.state.autoNavigationEnabled
    },
    speech: props.speech,
    onNext: () => {
      if (store.state.currentEntryIndex < store.state.hatenaEntries.length - 1) {
        store.nextEntry()
        setTimeout(speakEntry, 100)
      } else {
        props.speech.speak('最後のエントリーです')
      }
    },
    delay: 3000,
  })

  const actions = () => {
    const pageName =
      props.type === 'hot'
        ? 'はてなブックマーク 人気エントリー'
        : 'はてなブックマーク 新着エントリー'
    const actionList: GridAction[] = [
      {
        label: '戻る',
        action: () => {
          props.speech.stop()
          props.onBack()
        },
      },
      {
        label: '前のエントリー',
        action: () => {
          if (store.state.currentEntryIndex > 0) {
            store.prevEntry()
            setTimeout(speakEntry, 100)
          } else {
            props.speech.speak('最初のエントリーです')
          }
        },
      },
      {
        label: '次のエントリー',
        action: () => {
          if (store.state.currentEntryIndex < store.state.hatenaEntries.length - 1) {
            store.nextEntry()
            setTimeout(speakEntry, 100)
          } else {
            props.speech.speak('最後のエントリーです')
          }
        },
      },
      {
        label: 'リロード',
        action: () => {
          setLoading(true)
          const loadFn = props.type === 'hot' ? fetchHatenaHot : fetchHatenaLatest
          loadFn()
            .then((entries) => {
              store.setHatenaEntries(entries)
              props.speech.speak(`${entries.length}件のエントリーを再読み込みしました`)
            })
            .catch(() => {
              props.speech.speak(
                'はてなブックマークのエントリーを再取得できませんでした。外部サービスへの接続に失敗しました。1番で戻ってください。',
              )
            })
            .finally(() => setLoading(false))
        },
      },
      {
        label: loading()
          ? 'エントリー\n取得中…'
          : store.getCurrentEntry()
            ? `${store.getCurrentEntry()!.title}\n${previewText(store.getCurrentEntry()!.description, 56)}`
            : 'エントリーなし',
        action: speakEntry,
      },
      {
        label: 'コメント表示',
        action: () => {
          const currentEntry = store.getCurrentEntry()
          if (currentEntry && currentEntry.comments_url) {
            props.speech.speak('コメント一覧を表示します')
            props.onViewComments()
          } else {
            props.speech.speak('コメントがありません')
          }
        },
      },
      {
        label: '位置',
        action: () =>
          props.speech.speak(
            `${store.state.hatenaEntries.length}件中、${store.state.currentEntryIndex + 1}件目です`,
          ),
      },
      {
        label: '停止',
        action: () => props.speech.stop(),
      },
      createGuideAction(pageName, props.speech, () => actionList),
    ]

    return actionList
  }

  return (
    <div class="h-screen w-screen">
      <GridSystem
        actions={actions()}
        speech={props.speech}
        onInit={() => {
          props.speech.speak(
            props.type === 'hot'
              ? 'はてなブックマーク 人気エントリー'
              : 'はてなブックマーク 新着エントリー',
          )
          if (store.state.hatenaEntries.length > 0) {
            props.speech.speak(`${store.state.hatenaEntries.length}件のエントリーがあります`)
          }
        }}
      />
    </div>
  )
}
