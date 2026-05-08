import { createSignal, onMount, Show } from 'solid-js';
import { RSSReader, RSSItem } from '../lib/rss';
import { SpeechManager } from '../lib/speech';
import { useAutoNavigation } from '../lib/useAutoNavigation';
import GridSystem, { GridAction } from './GridSystem';
import StatusMessage from './StatusMessage';
import { FORMAL_SERVICE_NAMES, previewText, loadingMessage, failureSpeech } from '../lib/service-copy';
import { createGuideAction } from '../lib/grid-guide';

interface RSSArticleReaderProps {
  speech: SpeechManager;
  onBack: () => void;
}

export default function RSSArticleReader(props: RSSArticleReaderProps) {
  const [articles, setArticles] = createSignal<RSSItem[]>([]);
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [feedName, setFeedName] = createSignal('');
  const rssReader = new RSSReader();

  onMount(() => { loadArticles(); });

  const loadArticles = async () => {
    const feedJson = typeof window !== 'undefined' ? sessionStorage.getItem('selectedRSSFeed') : null;
    if (!feedJson) {
      props.speech.speak('フィードが選択されていません。1番で戻ってください。');
      props.onBack();
      return;
    }
    const feed = JSON.parse(feedJson);
    setFeedName(feed.name);
    setLoading(true); setError(null);
    try {
      const rssFeed = await rssReader.fetchRSS(feed.url);
      setArticles(rssFeed.items);
      setTimeout(() => {
        props.speech.speak(`${feed.name} の記事を${rssFeed.items.length}件読み込みました。最新の記事から読み上げます`);
        setTimeout(() => speakArticle(), 2000);
      }, 500);
    } catch (err) {
      console.error('Failed to load RSS:', err);
      const msg = failureSpeech(
        `${feed.name}`,
        '外部サイトの都合で取得に失敗することがあります。',
        false,
      );
      setError(msg);
      props.speech.speak(msg);
    } finally {
      setLoading(false);
    }
  };

  const speakArticle = () => {
    const article = articles()[currentIndex()];
    if (!article) return;
    props.speech.speak(`記事 ${currentIndex() + 1}。${article.title}。${article.description}`, { interrupt: true });
  };

  useAutoNavigation({
    enabled: false,
    speech: props.speech,
    onNext: () => {
      if (currentIndex() < articles().length - 1) { setCurrentIndex(currentIndex() + 1); setTimeout(speakArticle, 100); }
      else { props.speech.speak('最後の記事です'); }
    },
    delay: 2000,
  });

  const actions = () => {
    const actionList: GridAction[] = [
      { label: '戻る', action: () => { props.speech.stop(); props.onBack(); } },
      { label: '前の記事', action: () => { if (currentIndex() > 0) { setCurrentIndex(currentIndex() - 1); setTimeout(speakArticle, 100); } else { props.speech.speak('最初の記事です'); } } },
      { label: '次の記事', action: () => { if (currentIndex() < articles().length - 1) { setCurrentIndex(currentIndex() + 1); setTimeout(speakArticle, 100); } else { props.speech.speak('最後の記事です'); } } },
      { label: '本文', action: () => { const a = articles()[currentIndex()]; if (a?.content) { props.speech.speak(`本文。${a.content}`, { interrupt: true }); } else { props.speech.speak('本文が取得できませんでした。見出しと概要のみです。'); } } },
      {
        label: articles()[currentIndex()]
          ? `${articles()[currentIndex()]!.title}\n${previewText(articles()[currentIndex()]!.description || articles()[currentIndex()]!.content, 58)}`
          : '記事なし',
        action: speakArticle,
      },
      { label: '位置', action: () => { props.speech.speak(`全${articles().length}記事中、${currentIndex() + 1}番目の記事です`); } },
      { label: '日時', action: () => { const a = articles()[currentIndex()]; if (a) { props.speech.speak(`公開日時：${a.pubDate}`); } } },
      { label: '停止', action: () => { props.speech.stop(); } },
      createGuideAction('RSSニュース記事一覧', props.speech, () => actionList),
    ];

    return actionList;
  };

  return (
    <Show
      when={!loading()}
      fallback={
        <StatusMessage
          type="loading"
          title={loadingMessage(feedName() ? `${feedName()}の記事` : `${FORMAL_SERVICE_NAMES.rss}の記事`)}
          message="外部ニュースサイトから記事一覧を取得しています。"
          hint="しばらく待っても進まない場合は、1番で戻って別のサイトを試してください。"
        />
      }
    >
      <Show
        when={!error()}
        fallback={
          <StatusMessage
            type="failure"
            title={`${feedName() || FORMAL_SERVICE_NAMES.rss}の記事を開けませんでした`}
            message={error()!}
            hint="1番で戻り、別のニュースサイトを試してください。"
          />
        }
      >
        <GridSystem actions={actions()} speech={props.speech} />
      </Show>
    </Show>
  );
}

