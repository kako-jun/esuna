import { createSignal, onMount } from 'solid-js';
import { useAppStore } from '../lib/store';
import { POPULAR_PODCASTS } from '../lib/podcasts';
import { SpeechManager } from '../lib/speech';
import GridSystem from './GridSystem';

interface PodcastListProps {
  speech: SpeechManager;
  onBack: () => void;
  onSelectPodcast: () => void;
}

export default function PodcastList(props: PodcastListProps) {
  const store = useAppStore();
  const [currentIndex, setCurrentIndex] = createSignal(0);

  onMount(() => {
    setTimeout(() => {
      props.speech.speak(`人気Podcast、${POPULAR_PODCASTS.length}番組を用意しています`);
      setTimeout(speakPodcast, 2000);
    }, 500);
  });

  const speakPodcast = () => {
    const podcast = POPULAR_PODCASTS[currentIndex()];
    if (!podcast) return;
    props.speech.speak(`${podcast.category}カテゴリ、${podcast.title}。${podcast.description}`, { interrupt: true });
  };

  const actions = () => [
    { label: '戻る', action: () => { props.speech.stop(); props.onBack(); } },
    {
      label: '前の番組',
      action: () => {
        if (currentIndex() > 0) {
          setCurrentIndex(currentIndex() - 1);
          setTimeout(() => { const p = POPULAR_PODCASTS[currentIndex()]; props.speech.speak(`${p.category}カテゴリ、${p.title}。${p.description}`, { interrupt: true }); }, 100);
        } else { props.speech.speak('最初の番組です'); }
      },
    },
    {
      label: '次の番組',
      action: () => {
        if (currentIndex() < POPULAR_PODCASTS.length - 1) {
          setCurrentIndex(currentIndex() + 1);
          setTimeout(() => { const p = POPULAR_PODCASTS[currentIndex()]; props.speech.speak(`${p.category}カテゴリ、${p.title}。${p.description}`, { interrupt: true }); }, 100);
        } else { props.speech.speak('最後の番組です'); }
      },
    },
    { label: '読み上げ', action: speakPodcast },
    {
      label: 'エピソード',
      action: () => {
        const podcast = POPULAR_PODCASTS[currentIndex()];
        store.setSelectedPodcast(podcast);
        props.speech.speak(`${podcast.title} のエピソード一覧を読み込んでいます`);
        props.onSelectPodcast();
      },
    },
    { label: '番組情報', action: () => { const p = POPULAR_PODCASTS[currentIndex()]; props.speech.speak(`番組番号 ${currentIndex() + 1}。タイトル：${p.title}。カテゴリ：${p.category}。${p.description}`); } },
    { label: '番組数', action: () => { props.speech.speak(`全${POPULAR_PODCASTS.length}番組中、${currentIndex() + 1}番目の番組です`); } },
    { label: '停止', action: () => { props.speech.stop(); } },
    {
      label: '先頭',
      action: () => {
        setCurrentIndex(0);
        setTimeout(() => { const p = POPULAR_PODCASTS[0]; props.speech.speak(`最初の番組に戻りました。${p.title}`, { interrupt: true }); }, 100);
      },
    },
  ];

  return <GridSystem actions={actions()} speech={props.speech} />;
}
