import { createSignal, onMount } from 'solid-js';
import { SpeechManager } from '../lib/speech';
import { getRecentProgress, removeProgress, Progress, ProgressType } from '../lib/progress';
import GridSystem from './GridSystem';
import { getFormalProgressTypeName, previewText } from '../lib/service-copy';

interface ContinueReadingProps {
  speech: SpeechManager;
  onBack: () => void;
  onSelectProgress: (progress: Progress) => void;
}

export default function ContinueReading(props: ContinueReadingProps) {
  const [progressList, setProgressList] = createSignal<Progress[]>([]);
  const [currentIndex, setCurrentIndex] = createSignal(0);

  onMount(() => {
    const recent = getRecentProgress(20);
    setProgressList(recent);
    setTimeout(() => {
      if (recent.length === 0) { props.speech.speak('続きから再生できるコンテンツはまだありません'); }
      else { props.speech.speak(`続きから再生、${recent.length}件あります`); setTimeout(() => speakProgress(), 2000); }
    }, 500);
  });

  const getTypeText = (type: ProgressType): string => {
    return getFormalProgressTypeName(type);
  };

  const speakProgress = () => {
    const p = progressList()[currentIndex()];
    if (!p) return;
    const percent = Math.round((p.currentIndex / p.totalCount) * 100);
    props.speech.speak(`${getTypeText(p.type)}、${p.title}。進捗は${percent}パーセント、${p.currentIndex + 1}番目、全${p.totalCount}件中です`, { interrupt: true });
  };

  const actions = () => [
    { label: '戻る', action: () => { props.speech.stop(); props.onBack(); } },
    { label: '前', action: () => { if (currentIndex() > 0) { setCurrentIndex(currentIndex() - 1); setTimeout(speakProgress, 100); } else { props.speech.speak('最初の進捗です'); } } },
    { label: '次', action: () => { if (currentIndex() < progressList().length - 1) { setCurrentIndex(currentIndex() + 1); setTimeout(speakProgress, 100); } else { props.speech.speak('最後の進捗です'); } } },
    { label: '読み上げ', action: speakProgress },
    {
      label: progressList()[currentIndex()]
        ? `${progressList()[currentIndex()]!.title}\n${previewText(progressList()[currentIndex()]!.description, 58)}`
        : '進捗なし',
      action: () => { const p = progressList()[currentIndex()]; if (!p) { props.speech.speak('進捗がありません'); return; } props.speech.speak(`${p.title} の続きから再生します`); props.onSelectProgress(p); },
    },
    {
      label: '削除',
      action: () => {
        const p = progressList()[currentIndex()];
        if (!p) { props.speech.speak('進捗がありません'); return; }
        removeProgress(p.type, p.id);
        props.speech.speak(`${p.title} の進捗を削除しました`);
        const updated = getRecentProgress(20);
        setProgressList(updated);
        if (currentIndex() >= updated.length && updated.length > 0) { setCurrentIndex(updated.length - 1); }
        else if (updated.length === 0) { setCurrentIndex(0); setTimeout(() => { props.speech.speak('進捗がすべて削除されました'); }, 1500); }
      },
    },
    { label: '件数', action: () => { if (progressList().length === 0) { props.speech.speak('進捗はまだ記録されていません'); } else { props.speech.speak(`全${progressList().length}件中、${currentIndex() + 1}番目の進捗です`); } } },
    { label: '停止', action: () => { props.speech.stop(); } },
    { label: '先頭', action: () => { if (progressList().length > 0) { setCurrentIndex(0); setTimeout(speakProgress, 100); } else { props.speech.speak('進捗がありません'); } } },
  ];

  return <GridSystem actions={actions()} speech={props.speech} />;
}
