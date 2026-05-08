import { createSignal, onMount } from 'solid-js';
import { useAppStore } from '../lib/store';
import { POPULAR_NOVELS } from '../lib/novels';
import { SpeechManager } from '../lib/speech';
import GridSystem from './GridSystem';
import { FORMAL_SERVICE_NAMES, previewText } from '../lib/service-copy';
import { createGuideAction } from '../lib/grid-guide';

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
      props.speech.speak(`${FORMAL_SERVICE_NAMES.aozora} の作品一覧です。${POPULAR_NOVELS.length}作品を並べています。現在この機能は不安定で、作品を開けないことがあります。`);
      setTimeout(speakNovel, 2000);
    }, 500);
  });

  const speakNovel = () => {
    const novel = POPULAR_NOVELS[currentIndex()];
    if (!novel) return;
    props.speech.speak(`${novel.author} 作、${novel.title}。${novel.description}`, { interrupt: true });
  };

  const actions = () => {
    const actionList = [
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
      {
        label: '説明',
        action: speakNovel,
      },
      {
        label: POPULAR_NOVELS[currentIndex()] ? `${POPULAR_NOVELS[currentIndex()].title}\n${previewText(`${POPULAR_NOVELS[currentIndex()].author}。${POPULAR_NOVELS[currentIndex()].description}`, 44)}` : '作品なし',
        action: () => {
          const novel = POPULAR_NOVELS[currentIndex()];
          store.setSelectedNovel(novel);
          props.speech.speak(`${FORMAL_SERVICE_NAMES.aozora} の「${novel.title}」を開いています。現在この機能は不安定です。少し待ってください`);
          props.onSelectNovel();
        },
      },
      { label: '作品情報', action: () => { const novel = POPULAR_NOVELS[currentIndex()]; props.speech.speak(`作品番号 ${currentIndex() + 1}。タイトル：${novel.title}。著者：${novel.author}。${novel.description}`); } },
      { label: '作品数', action: () => { props.speech.speak(`全${POPULAR_NOVELS.length}作品中、${currentIndex() + 1}番目の作品です`); } },
      { label: '停止', action: () => { props.speech.stop(); } },
      createGuideAction('青空文庫作品一覧', props.speech, () => actionList),
    ];

    return actionList;
  };

  return <GridSystem actions={actions()} speech={props.speech} />;
}
