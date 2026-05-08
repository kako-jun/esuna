import { createSignal, onMount } from 'solid-js'
import { useAppStore } from '../lib/store'
import { fetchNovelContent } from '../lib/api-client'
import { SpeechManager } from '../lib/speech'
import { useAutoNavigation } from '../lib/useAutoNavigation'
import GridSystem, { GridAction } from './GridSystem'
import {
  FORMAL_SERVICE_NAMES,
  previewText,
  loadingMessage,
  failureSpeech,
  retryFailureSpeech,
} from '../lib/service-copy'
import { createGuideAction } from '../lib/grid-guide'

interface NovelReaderProps {
  speech: SpeechManager
  onBack: () => void
}

export default function NovelReader(props: NovelReaderProps) {
  const store = useAppStore()
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  onMount(() => {
    if (!store.state.novelContent && store.state.selectedNovel) {
      loadNovel()
    }
  })

  const loadNovel = async () => {
    const selectedNovel = store.state.selectedNovel
    if (!selectedNovel) {
      props.speech.speak(
        `${FORMAL_SERVICE_NAMES.aozora} の作品が選択されていません。1番で戻ってください。`,
      )
      props.onBack()
      return
    }
    setLoading(true)
    setError(null)
    try {
      const content = await fetchNovelContent(selectedNovel.authorId, selectedNovel.fileId)
      store.setNovelContent(content)
      setTimeout(() => {
        props.speech.speak(
          `${FORMAL_SERVICE_NAMES.aozora} の「${content.title}」を開きました。全${content.sections.length}個の区切りがあります。最初から読み上げます`,
        )
        setTimeout(() => speakSection(), 2000)
      }, 500)
    } catch (err) {
      console.error('Failed to load novel:', err)
      const msg = failureSpeech(
        `${FORMAL_SERVICE_NAMES.aozora} の「${selectedNovel.title}」`,
        '外部サイトへの接続に失敗しました。',
        false,
      )
      setError(msg)
      props.speech.speak(msg)
    } finally {
      setLoading(false)
    }
  }

  const speakSection = (
    sectionOverride?: { title: string; content: string },
    indexOverride?: number,
  ) => {
    const section = sectionOverride ?? store.getCurrentSection()
    const idx = indexOverride ?? store.state.currentSectionIndex
    if (!section) return
    const sectionTitle = section.title || `セクション ${idx + 1}`
    props.speech.speak(`${sectionTitle}。${section.content}`, { interrupt: true })
  }

  useAutoNavigation({
    get enabled() {
      return store.state.autoNavigationEnabled
    },
    speech: props.speech,
    onNext: () => {
      if (
        store.state.novelContent &&
        store.state.currentSectionIndex < store.state.novelContent.sections.length - 1
      ) {
        store.nextSection()
        setTimeout(speakSection, 100)
      } else {
        props.speech.speak('最後のセクションです')
      }
    },
    delay: 2000,
  })

  const centerCell = (): GridAction => {
    if (loading()) {
      return {
        label: `取得中…\n${store.state.selectedNovel?.title ?? '作品'}`,
        action: () =>
          props.speech.speak(
            `${loadingMessage(`${FORMAL_SERVICE_NAMES.aozora} の「${store.state.selectedNovel?.title ?? '作品'}」`)}。外部サイトから本文を取得しています。しばらく待っても進まない場合は、1番で戻って別の作品を試してください。`,
          ),
      }
    }
    if (error()) {
      return {
        label: `取得失敗\n${store.state.selectedNovel?.title ?? '作品'}`,
        action: () =>
          props.speech.speak(
            `${error()!} 1番で戻り、別の作品を試してください。 7番でリロードもできます。`,
          ),
      }
    }
    return {
      label: store.getCurrentSection()
        ? `${store.getCurrentSection()!.title || `区切り ${store.state.currentSectionIndex + 1}`}\n${previewText(store.getCurrentSection()!.content, 58)}`
        : '本文なし',
      action: () => speakSection(),
    }
  }

  const actions = () => {
    // 規約: 1=戻る 2=前 3=次 4=リロード 5=主対象 6=主アクション(読み上げ) 7=補助情報 8=停止 9=画面案内
    const actionList: GridAction[] = [
      {
        label: '戻る',
        action: () => {
          props.speech.stop()
          store.setNovelContent(null)
          props.onBack()
        },
      },
      {
        label: '前のセクション',
        action: () => {
          if (store.state.currentSectionIndex > 0) {
            store.prevSection()
            setTimeout(speakSection, 100)
          } else {
            props.speech.speak('最初のセクションです')
          }
        },
      },
      {
        label: '次のセクション',
        action: () => {
          if (
            store.state.novelContent &&
            store.state.currentSectionIndex < store.state.novelContent.sections.length - 1
          ) {
            store.nextSection()
            setTimeout(speakSection, 100)
          } else {
            props.speech.speak('最後のセクションです')
          }
        },
      },
      {
        label: 'リロード',
        action: () => {
          props.speech.speak('再読み込みします')
          store.setNovelContent(null)
          setTimeout(() => {
            const selectedNovel = store.state.selectedNovel
            if (selectedNovel) {
              fetchNovelContent(selectedNovel.authorId, selectedNovel.fileId)
                .then((content) => {
                  store.setNovelContent(content)
                  props.speech.speak('再読み込みしました')
                })
                .catch(() => {
                  props.speech.speak(retryFailureSpeech(FORMAL_SERVICE_NAMES.aozora))
                })
            }
          }, 500)
        },
      },
      centerCell(),
      { label: '本文を\n読み上げ', action: () => speakSection() },
      {
        label: '作品情報',
        action: () => {
          if (store.state.novelContent && store.state.selectedNovel) {
            props.speech.speak(
              `タイトル：${store.state.novelContent.title}。著者：${store.state.novelContent.author}。全${store.state.novelContent.sections.length}セクション中、${store.state.currentSectionIndex + 1}番目のセクションです`,
            )
          }
        },
      },
      {
        label: '停止',
        action: () => {
          props.speech.stop()
        },
      },
      createGuideAction('青空文庫本文表示', props.speech, () => actionList),
    ]

    return actionList
  }

  return <GridSystem actions={actions()} speech={props.speech} />
}
