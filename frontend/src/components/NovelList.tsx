import { createSignal, onMount } from 'solid-js';
import { useAppStore } from '../lib/store';
import { POPULAR_NOVELS } from '../lib/novels';
import { SpeechManager } from '../lib/speech';
import GridSystem from './GridSystem';

interface NovelListProps {
  speech: SpeechManager;
  onBack: () => void;
  onSelectNovel: () => void;
}

export default function NovelList(props: NovelListProps) {
  const store = useAppStore();
  const [currentIndex, setCurrentIndex] = createSignal(0);

  onMount(() => {
    setTimeout(() => {
      props.speech.speak(`青空文庫の人気作品、${POPULAR_NOVELS.length}作品を用意しています`);
      setTimeout(speakNovel, 2000);
    }, 500);
  });

  const speakNovel = () => {
    const novel = POPULAR_NOVELS[currentIndex()];
    if (!novel) return;
    props.speech.speak(`${novel.author} 作、${novel.title}。${novel.description}`, { interrupt: true });
  };

  const actions = () => [
    { label: '戻る', action: () => { props.speech.stop(); props.onBack(); } },
    {
      label: '前の作品',
      action: () => {
        if (currentIndex() > 0) {
          setCurrentIndex(currentIndex() - 1);
          setTimeout(() => { const novel = POPULAR_NOVELS[currentIndex()]; props.speech.speak(`${novel.author} 作、${novel.title}。${novel.description}`, { interrupt: true }); }, 100);
        } else { props.speech.speak('最初の作品です'); }
      },
    },
    {
      label: '次の作品',
      action: () => {
        if (currentIndex() < POPULAR_NOVELS.length - 1) {
          setCurrentIndex(currentIndex() + 1);
          setTimeout(() => { const novel = POPULAR_NOVELS[currentIndex()]; props.speech.speak(`${novel.author} 作、${novel.title}。${novel.description}`, { interrupt: true }); }, 100);
        } else { props.speech.speak('最後の作品です'); }
      },
    },
    { label: '読み上げ', action: speakNovel },
    {
      label: '読む',
      action: () => {
        const novel = POPULAR_NOVELS[currentIndex()];
        store.setSelectedNovel(novel);
        props.speech.speak(`${novel.title} を読み込んでいます`);
        props.onSelectNovel();
      },
    },
    { label: '作品情報', action: () => { const novel = POPULAR_NOVELS[currentIndex()]; props.speech.speak(`作品番号 ${currentIndex() + 1}。タイトル：${novel.title}。著者：${novel.author}。${novel.description}`); } },
    { label: '作品数', action: () => { props.speech.speak(`全${POPULAR_NOVELS.length}作品中、${currentIndex() + 1}番目の作品です`); } },
    { label: '停止', action: () => { props.speech.stop(); } },
    {
      label: '先頭',
      action: () => {
        setCurrentIndex(0);
        setTimeout(() => { const novel = POPULAR_NOVELS[0]; props.speech.speak(`最初の作品に戻りました。${novel.author} 作、${novel.title}`, { interrupt: true }); }, 100);
      },
    },
  ];

  return <GridSystem actions={actions()} speech={props.speech} />;
}
