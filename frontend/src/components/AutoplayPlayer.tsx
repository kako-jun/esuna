import { createSignal, onMount, onCleanup, Show } from 'solid-js';
import { generateRandomPlaylist, loadAutoplaySettings, AutoplayItem, getContentTypeName } from '../lib/autoplay';
import { SpeechManager } from '../lib/speech';
import GridSystem from './GridSystem';

interface AutoplayPlayerProps {
  speech: SpeechManager;
  onBack: () => void;
  onNavigateToContent: (item: AutoplayItem) => void;
}

export default function AutoplayPlayer(props: AutoplayPlayerProps) {
  const [playlist, setPlaylist] = createSignal<AutoplayItem[]>([]);
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [timeRemaining, setTimeRemaining] = createSignal(0);
  const settings = loadAutoplaySettings();
  let timerInterval: ReturnType<typeof setInterval> | null = null;

  onMount(() => {
    const newPlaylist = generateRandomPlaylist(settings, 20);
    setPlaylist(newPlaylist);
    setCurrentIndex(0);
    if (newPlaylist.length > 0) {
      props.speech.speak(`おまかせモードを開始します。${newPlaylist.length}個のコンテンツを用意しました。最初は${getContentTypeName(newPlaylist[0].type)}、${newPlaylist[0].title}です`);
      setIsPlaying(true);
      setTimeRemaining(settings.playDuration * 60);
    } else {
      props.speech.speak('おまかせモードで再生するコンテンツがありません。設定を確認してください');
    }
  });

  // Use a separate effect-like approach with setInterval for the timer
  onMount(() => {
    timerInterval = setInterval(() => {
      if (!isPlaying()) return;
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          nextContent();
          return settings.playDuration * 60;
        }
        return newTime;
      });
    }, 1000);
  });

  onCleanup(() => { if (timerInterval) { clearInterval(timerInterval); } });

  const nextContent = () => {
    const idx = currentIndex();
    const pl = playlist();
    if (idx < pl.length - 1) {
      const nextIndex = idx + 1;
      setCurrentIndex(nextIndex);
      const nextItem = pl[nextIndex];
      props.speech.speak(`次のコンテンツ：${getContentTypeName(nextItem.type)}、${nextItem.title}`, { interrupt: true });
      setTimeRemaining(settings.playDuration * 60);
    } else {
      props.speech.speak('プレイリストの最後に到達しました');
      setIsPlaying(false);
    }
  };

  const prevContent = () => {
    if (currentIndex() > 0) {
      const prevIndex = currentIndex() - 1;
      setCurrentIndex(prevIndex);
      const prevItem = playlist()[prevIndex];
      props.speech.speak(`前のコンテンツ：${getContentTypeName(prevItem.type)}、${prevItem.title}`, { interrupt: true });
      setTimeRemaining(settings.playDuration * 60);
    } else {
      props.speech.speak('最初のコンテンツです');
    }
  };

  const fmtTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  const currentItem = () => playlist()[currentIndex()];

  return (
    <Show when={currentItem()} fallback={
      <div class="grid-container" role="status" aria-live="polite">
        <div class="grid-item" style={{ "grid-column": '1 / -1', "grid-row": '1 / -1' }}>プレイリストが空です</div>
      </div>
    }>
      <GridSystem actions={[
        { label: '戻る', action: () => { setIsPlaying(false); props.speech.stop(); props.onBack(); } },
        { label: '前へ', action: prevContent },
        { label: '次へ', action: nextContent },
        { label: isPlaying() ? '一時停止' : '再生', action: () => { setIsPlaying(!isPlaying()); props.speech.speak(isPlaying() ? '一時停止しました' : '再生を再開しました'); } },
        { label: '開く', action: () => { const item = currentItem(); if (item) { props.speech.speak(`${item.title} を開きます`); props.onNavigateToContent(item); } } },
        { label: '現在の情報', action: () => { const item = currentItem()!; props.speech.speak(`現在：${getContentTypeName(item.type)}、${item.title}。${item.description}。残り時間：${fmtTime(timeRemaining())}。プレイリスト：${currentIndex() + 1}/${playlist().length}`); } },
        { label: 'プレイリスト', action: () => { props.speech.speak(`プレイリスト：全${playlist().length}個のコンテンツ。現在は${currentIndex() + 1}番目です`); } },
        { label: '停止', action: () => { props.speech.stop(); } },
        { label: '残り時間', action: () => { props.speech.speak(`残り時間：${fmtTime(timeRemaining())}`); } },
      ]} speech={props.speech} />
    </Show>
  );
}
