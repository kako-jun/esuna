import { createSignal, onMount, Show } from 'solid-js';
import { RSSReader, RSSItem } from '../lib/rss';
import { SpeechManager } from '../lib/speech';
import { useAutoNavigation } from '../lib/useAutoNavigation';
import GridSystem from './GridSystem';

interface RSSArticleReaderProps {
  speech: SpeechManager;
  onBack: () => void;
}

export default function RSSArticleReader(props: RSSArticleReaderProps) {
  const [articles, setArticles] = createSignal<RSSItem[]>([]);
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const rssReader = new RSSReader();

  onMount(() => { loadArticles(); });

  const loadArticles = async () => {
    const feedJson = typeof window !== 'undefined' ? sessionStorage.getItem('selectedRSSFeed') : null;
    if (!feedJson) { props.speech.speak('フィードが選択されていません'); props.onBack(); return; }
    const feed = JSON.parse(feedJson);
    setLoading(true); setError(null);
    try {
      const rssFeed = await rssReader.fetchRSS(feed.url);
      setArticles(rssFeed.items);
      setTimeout(() => {
        props.speech.speak(`${feed.name}の記事、${rssFeed.items.length}件を読み込みました。最新の記事から読み上げます`);
        setTimeout(() => speakArticle(), 2000);
      }, 500);
    } catch (err) {
      console.error('Failed to load RSS:', err);
      setError('記事の読み込みに失敗しました');
      props.speech.speak('記事の読み込みに失敗しました。戻ります');
      setTimeout(props.onBack, 2000);
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

  const actions = () => [
    { label: '戻る', action: () => { props.speech.stop(); props.onBack(); } },
    { label: '前の記事', action: () => { if (currentIndex() > 0) { setCurrentIndex(currentIndex() - 1); setTimeout(speakArticle, 100); } else { props.speech.speak('最初の記事です'); } } },
    { label: '次の記事', action: () => { if (currentIndex() < articles().length - 1) { setCurrentIndex(currentIndex() + 1); setTimeout(speakArticle, 100); } else { props.speech.speak('最後の記事です'); } } },
    { label: '読み上げ', action: speakArticle },
    { label: '本文', action: () => { const a = articles()[currentIndex()]; if (a?.content) { props.speech.speak(`本文。${a.content}`, { interrupt: true }); } else { props.speech.speak('本文が取得できませんでした'); } } },
    { label: '位置', action: () => { props.speech.speak(`全${articles().length}記事中、${currentIndex() + 1}番目の記事です`); } },
    { label: '日時', action: () => { const a = articles()[currentIndex()]; if (a) { props.speech.speak(`公開日時：${a.pubDate}`); } } },
    { label: '停止', action: () => { props.speech.stop(); } },
    { label: '先頭', action: () => { setCurrentIndex(0); setTimeout(speakArticle, 100); } },
  ];

  return (
    <Show when={!loading()} fallback={<div class="p-4 text-center">記事を読み込んでいます...</div>}>
      <Show when={!error()} fallback={
        <div class="grid-container" role="alert" aria-live="assertive">
          <div class="grid-item" style={{ "grid-column": '1 / -1', "grid-row": '1 / -1' }}>エラー: {error()}</div>
        </div>
      }>
        <GridSystem actions={actions()} speech={props.speech} />
      </Show>
    </Show>
  );
}
