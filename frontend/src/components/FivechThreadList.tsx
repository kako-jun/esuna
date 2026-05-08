import { createSignal, onMount } from 'solid-js';
import { useAppStore } from '../lib/store';
import { fetch5chThreads } from '../lib/api-client';
import { SpeechManager } from '../lib/speech';
import { useAutoNavigation } from '../lib/useAutoNavigation';
import GridSystem from './GridSystem';
import { previewText } from '../lib/service-copy';

interface FivechThreadListProps {
  speech: SpeechManager;
  onBack: () => void;
  onSelectThread: () => void;
}

export default function FivechThreadList(props: FivechThreadListProps) {
  const store = useAppStore();
  const [loading, setLoading] = createSignal(false);

  onMount(() => {
    if (store.state.fivechThreads.length === 0) loadThreads();
  });

  const loadThreads = async () => {
    const board = store.getCurrentBoard();
    if (!board) { props.speech.speak('板が選択されていません'); return; }
    setLoading(true);
    try {
      const threads = await fetch5chThreads(board.url, 50);
      store.set5chThreads(threads);
      props.speech.speak(`${threads.length}個のスレッドを読み込みました`);
    } catch (err) {
      console.error('Failed to load threads:', err);
      props.speech.speak('スレッドの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const speakThread = () => {
    const currentThread = store.getCurrentThread();
    if (!currentThread) return;
    props.speech.speak(`${currentThread.title} レス数 ${currentThread.response_count}`, { interrupt: true });
  };

  useAutoNavigation({
    get enabled() { return store.state.autoNavigationEnabled; },
    speech: props.speech,
    onNext: () => {
      if (store.state.currentThreadIndex < store.state.fivechThreads.length - 1) { store.nextThread(); setTimeout(speakThread, 100); }
      else { props.speech.speak('最後のスレッドです'); }
    },
    delay: 3000,
  });

  const actions = () => [
    { label: '戻る', action: () => { props.speech.stop(); props.onBack(); } },
    {
      label: 'リロード',
      action: () => {
        const board = store.getCurrentBoard();
        if (board) {
          setLoading(true);
          fetch5chThreads(board.url, 50)
            .then((threads) => { store.set5chThreads(threads); props.speech.speak(`${threads.length}個のスレッドを再読み込みしました`); })
            .catch(() => { props.speech.speak('再読み込みに失敗しました'); })
            .finally(() => setLoading(false));
        }
      },
    },
    { label: '未実装', action: () => props.speech.speak('この枠の機能はまだありません') },
    { label: '前のスレッド', action: () => { if (store.state.currentThreadIndex > 0) { store.prevThread(); setTimeout(speakThread, 100); } else { props.speech.speak('最初のスレッドです'); } } },
    {
      label: loading()
        ? '取得中'
        : store.getCurrentThread()
          ? `${store.getCurrentThread()!.title}\n${previewText(`レス数 ${store.getCurrentThread()!.response_count}`, 58)}`
          : 'スレッドなし',
      action: speakThread,
    },
    { label: '次のスレッド', action: () => { if (store.state.currentThreadIndex < store.state.fivechThreads.length - 1) { store.nextThread(); setTimeout(speakThread, 100); } else { props.speech.speak('最後のスレッドです'); } } },
    { label: `${store.state.currentThreadIndex + 1}/${store.state.fivechThreads.length}`, action: () => props.speech.speak(`${store.state.fivechThreads.length}個中、${store.state.currentThreadIndex + 1}個目です`) },
    { label: 'レス表示', action: () => { if (store.getCurrentThread()) { props.speech.speak('レスを表示します'); props.onSelectThread(); } else { props.speech.speak('スレッドを選択してください'); } } },
    { label: '停止', action: () => props.speech.stop() },
  ];

  return (
    <div class="h-screen w-screen">
      <GridSystem actions={actions()} speech={props.speech} onInit={() => {
        const board = store.getCurrentBoard();
        props.speech.speak(`5ちゃんねる スレッド一覧 ${board?.title || ''}`);
        if (store.state.fivechThreads.length > 0) props.speech.speak(`${store.state.fivechThreads.length}個のスレッドがあります`);
      }} />
    </div>
  );
}
