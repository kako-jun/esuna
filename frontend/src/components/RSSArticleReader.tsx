import { createSignal, onMount } from 'solid-js'
import { RSSReader, RSSItem } from '../lib/rss'
import { SpeechManager } from '../lib/speech'
import { useAutoNavigation } from '../lib/useAutoNavigation'
import GridSystem, { GridAction } from './GridSystem'
import {
  FORMAL_SERVICE_NAMES,
  previewText,
  loadingMessage,
  failureSpeech,
} from '../lib/service-copy'
import { createGuideAction } from '../lib/grid-guide'

interface RSSArticleReaderProps {
  speech: SpeechManager
  onBack: () => void
}

export default function RSSArticleReader(props: RSSArticleReaderProps) {
  const [articles, setArticles] = createSignal<RSSItem[]>([])
  const [currentIndex, setCurrentIndex] = createSignal(0)
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [feedName, setFeedName] = createSignal('')
  const rssReader = new RSSReader()

  onMount(() => {
    loadArticles()
  })

  const loadArticles = async () => {
    const feedJson =
      typeof window !== 'undefined' ? sessionStorage.getItem('selectedRSSFeed') : null
    if (!feedJson) {
      props.speech.speak('フィードが選択されていません。1番で戻ってください。')
      props.onBack()
      return
    }
    const feed = JSON.parse(feedJson)
    setFeedName(feed.name)
    setLoading(true)
    setError(null)
    try {
      const rssFeed = await rssReader.fetchRSS(feed.url)
      setArticles(rssFeed.items)
      const first = rssFeed.items[0]
      const texts = [
        `${feed.name} の記事を${rssFeed.items.length}件読み込みました。最新の記事から読み上げます`,
      ]
      if (first) texts.push(`記事 1。${first.title}。${first.description}`)
      props.speech.speakQueue(texts)
    } catch (err) {
      console.error('Failed to load RSS:', err)
      const msg = failureSpeech(
        `${feed.name}`,
        '外部サイトの都合で取得に失敗することがあります。',
        false,
      )
      setError(msg)
      props.speech.speak(msg)
    } finally {
      setLoading(false)
    }
  }

  const speakArticle = () => {
    const article = articles()[currentIndex()]
    if (!article) return
    props.speech.speak(`記事 ${currentIndex() + 1}。${article.title}。${article.description}`, {
      interrupt: true,
    })
  }

  useAutoNavigation({
    enabled: false,
    speech: props.speech,
    onNext: () => {
      if (currentIndex() < articles().length - 1) {
        setCurrentIndex(currentIndex() + 1)
        speakArticle()
      } else {
        props.speech.speak('最後の記事です')
      }
    },
    delay: 2000,
  })

  const centerCell = (): GridAction => {
    if (loading()) {
      return {
        label: `取得中…\n${feedName() || FORMAL_SERVICE_NAMES.rss}`,
        action: () =>
          props.speech.speak(
            `${loadingMessage(feedName() ? `${feedName()}の記事` : `${FORMAL_SERVICE_NAMES.rss}の記事`)}。外部ニュースサイトから記事一覧を取得しています。しばらく待っても進まない場合は、1番で戻って別のサイトを試してください。`,
          ),
      }
    }
    if (error()) {
      return {
        label: `取得失敗\n${feedName() || FORMAL_SERVICE_NAMES.rss}`,
        action: () =>
          props.speech.speak(`${error()!} 1番で戻り、別のニュースサイトを試してください。`),
      }
    }
    return {
      label: articles()[currentIndex()]
        ? `${articles()[currentIndex()]!.title}\n${previewText(articles()[currentIndex()]!.description || articles()[currentIndex()]!.content, 58)}`
        : '記事なし',
      action: speakArticle,
    }
  }

  const speakBody = () => {
    const a = articles()[currentIndex()]
    if (a?.content) {
      props.speech.speak(`本文。${a.content}`, { interrupt: true })
    } else {
      props.speech.speak('本文が取得できませんでした。見出しと概要のみです。')
    }
  }

  const actions = () => {
    // 規約: 1=戻る 2=前 3=次 4=リロード 5=主対象 6=読み上げ 7=位置 8=停止 9=画面案内
    const actionList: GridAction[] = [
      {
        label: '戻る',
        action: () => {
          props.speech.stop()
          props.onBack()
        },
      },
      {
        label: '前の記事',
        action: () => {
          if (currentIndex() > 0) {
            setCurrentIndex(currentIndex() - 1)
            speakArticle()
          } else {
            props.speech.speak('最初の記事です')
          }
        },
      },
      {
        label: '次の記事',
        action: () => {
          if (currentIndex() < articles().length - 1) {
            setCurrentIndex(currentIndex() + 1)
            speakArticle()
          } else {
            props.speech.speak('最後の記事です')
          }
        },
      },
      {
        label: 'リロード',
        action: () => {
          props.speech.speak('再読み込みします')
          loadArticles()
        },
      },
      centerCell(),
      { label: '読み上げ', action: speakBody },
      {
        label: '位置',
        action: () => {
          const a = articles()[currentIndex()]
          const pos = `全${articles().length}記事中、${currentIndex() + 1}番目の記事です`
          if (a) {
            props.speech.speak(`${pos}。公開日時：${a.pubDate}`)
          } else {
            props.speech.speak(pos)
          }
        },
      },
      {
        label: '停止',
        action: () => {
          props.speech.stop()
        },
      },
      createGuideAction('RSSニュース記事一覧', props.speech, () => actionList),
    ]

    return actionList
  }

  return <GridSystem actions={actions()} speech={props.speech} />
}
