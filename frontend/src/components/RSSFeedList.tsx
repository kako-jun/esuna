import { createSignal, onMount } from 'solid-js';
import { RSSReader } from '../lib/rss';
import { SpeechManager } from '../lib/speech';
import GridSystem from './GridSystem';

interface RSSFeedListProps {
  speech: SpeechManager;
  onBack: () => void;
  onSelectFeed: () => void;
}

export default function RSSFeedList(props: RSSFeedListProps) {
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const rssReader = new RSSReader();
  const defaultFeeds = rssReader.getDefaultFeeds();

  onMount(() => {
    setTimeout(() => {
      props.speech.speak(`RSSフィード、${defaultFeeds.length}個のニュースサイトを用意しています`);
      setTimeout(speakFeed, 2000);
    }, 500);
  });

  const speakFeed = () => {
    const feed = defaultFeeds[currentIndex()];
    if (!feed) return;
    props.speech.speak(`${feed.name}。フィード番号 ${currentIndex() + 1}`, { interrupt: true });
  };

  const actions = () => [
    { label: '戻る', action: () => { props.speech.stop(); props.onBack(); } },
    {
      label: '前のフィード',
      action: () => {
        if (currentIndex() > 0) { setCurrentIndex(currentIndex() - 1); setTimeout(() => { props.speech.speak(`${defaultFeeds[currentIndex()].name}`, { interrupt: true }); }, 100); }
        else { props.speech.speak('最初のフィードです'); }
      },
    },
    {
      label: '次のフィード',
      action: () => {
        if (currentIndex() < defaultFeeds.length - 1) { setCurrentIndex(currentIndex() + 1); setTimeout(() => { props.speech.speak(`${defaultFeeds[currentIndex()].name}`, { interrupt: true }); }, 100); }
        else { props.speech.speak('最後のフィードです'); }
      },
    },
    { label: '読み上げ', action: speakFeed },
    {
      label: '記事一覧',
      action: () => {
        const feed = defaultFeeds[currentIndex()];
        if (typeof window !== 'undefined') { sessionStorage.setItem('selectedRSSFeed', JSON.stringify(feed)); }
        props.speech.speak(`${feed.name} の記事一覧を読み込んでいます`);
        props.onSelectFeed();
      },
    },
    { label: 'フィード情報', action: () => { const feed = defaultFeeds[currentIndex()]; props.speech.speak(`フィード番号 ${currentIndex() + 1}。名前：${feed.name}。`); } },
    { label: 'フィード数', action: () => { props.speech.speak(`全${defaultFeeds.length}フィード中、${currentIndex() + 1}番目のフィードです`); } },
    { label: '停止', action: () => { props.speech.stop(); } },
    {
      label: '先頭',
      action: () => { setCurrentIndex(0); setTimeout(() => { props.speech.speak(`最初のフィードに戻りました。${defaultFeeds[0].name}`, { interrupt: true }); }, 100); },
    },
  ];

  return <GridSystem actions={actions()} speech={props.speech} />;
}
