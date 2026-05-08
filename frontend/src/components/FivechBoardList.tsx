import { createSignal, onMount } from 'solid-js';
import { useAppStore } from '../lib/store';
import { fetch5chBoards } from '../lib/api-client';
import { SpeechManager } from '../lib/speech';
import { useAutoNavigation } from '../lib/useAutoNavigation';
import GridSystem from './GridSystem';
import { previewText } from '../lib/service-copy';
import { createGuideAction } from '../lib/grid-guide';

interface FivechBoardListProps {
  speech: SpeechManager;
  onBack: () => void;
  onSelectBoard: () => void;
}

export default function FivechBoardList(props: FivechBoardListProps) {
  const store = useAppStore();
  const [loading, setLoading] = createSignal(false);

  onMount(() => {
    if (store.state.fivechBoards.length === 0) loadBoards();
  });

  const loadBoards = async () => {
    setLoading(true);
    try {
      const boards = await fetch5chBoards();
      store.set5chBoards(boards);
      props.speech.speak(`${boards.length}個の板名を表示しました。ただし現在、スレッド一覧とレス取得は未対応です。`);
    } catch (err) {
      console.error('Failed to load boards:', err);
      props.speech.speak('板の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const speakBoard = () => {
    const currentBoard = store.getCurrentBoard();
    if (!currentBoard) return;
    props.speech.speak(`${currentBoard.category} ${currentBoard.title}`, { interrupt: true });
  };

  useAutoNavigation({
    get enabled() { return store.state.autoNavigationEnabled; },
    speech: props.speech,
    onNext: () => {
      if (store.state.currentBoardIndex < store.state.fivechBoards.length - 1) { store.nextBoard(); setTimeout(speakBoard, 100); }
      else { props.speech.speak('最後の板です'); }
    },
    delay: 3000,
  });

  const actions = () => {
    const actionList = [
    { label: '戻る', action: () => { props.speech.stop(); props.onBack(); } },
    {
      label: 'リロード',
      action: () => {
        setLoading(true);
        fetch5chBoards()
          .then((boards) => { store.set5chBoards(boards); props.speech.speak(`${boards.length}個の板を再読み込みしました`); })
          .catch(() => { props.speech.speak('再読み込みに失敗しました'); })
          .finally(() => setLoading(false));
      },
    },
    { label: '未実装', status: 'unimplemented', action: () => props.speech.speak('この枠の機能はまだありません') },
    {
      label: '前の板',
      action: () => {
        if (store.state.currentBoardIndex > 0) { store.prevBoard(); setTimeout(speakBoard, 100); }
        else { props.speech.speak('最初の板です'); }
      },
    },
    {
      label: loading()
        ? '取得中'
        : store.getCurrentBoard()
          ? `${store.getCurrentBoard()!.title}\n${previewText(store.getCurrentBoard()!.category, 58)}`
          : '板なし',
      action: speakBoard,
    },
    {
      label: '次の板',
      action: () => {
        if (store.state.currentBoardIndex < store.state.fivechBoards.length - 1) { store.nextBoard(); setTimeout(speakBoard, 100); }
        else { props.speech.speak('最後の板です'); }
      },
    },
    { label: `${store.state.currentBoardIndex + 1}/${store.state.fivechBoards.length}`, action: () => props.speech.speak(`${store.state.fivechBoards.length}個中、${store.state.currentBoardIndex + 1}個目です`) },
    {
      label: 'スレッド一覧\n未対応',
      status: 'unimplemented',
      action: () => {
        if (store.getCurrentBoard()) {
          props.speech.speak('現在、5ちゃんねるのスレッド一覧は未対応です。この先へは進めません');
        } else { props.speech.speak('板を選択してください'); }
      },
    },
    { label: '停止', action: () => props.speech.stop() },
    createGuideAction('5ちゃんねる板名一覧', props.speech, () => actionList),
  ];

    return actionList;
  };

  return (
    <div class="h-screen w-screen">
      <GridSystem actions={actions()} speech={props.speech} onInit={() => {
        props.speech.speak('5ちゃんねるの板名一覧です。現在この機能は未対応で、板名の確認までしかできません');
        if (store.state.fivechBoards.length > 0) props.speech.speak(`${store.state.fivechBoards.length}個の板名があります`);
      }} />
    </div>
  );
}
