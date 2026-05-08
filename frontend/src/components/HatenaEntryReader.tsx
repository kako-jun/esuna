import { createSignal, onMount } from 'solid-js';
import { useAppStore } from '../lib/store';
import { fetchHatenaHot, fetchHatenaLatest } from '../lib/api-client';
import { SpeechManager } from '../lib/speech';
import { useAutoNavigation } from '../lib/useAutoNavigation';
import GridSystem from './GridSystem';
import { previewText } from '../lib/service-copy';
import { createGuideAction } from '../lib/grid-guide';

interface HatenaEntryReaderProps {
  speech: SpeechManager;
  onBack: () => void;
  onViewComments: () => void;
  type: 'hot' | 'latest';
}

export default function HatenaEntryReader(props: HatenaEntryReaderProps) {
  const store = useAppStore();
  const [loading, setLoading] = createSignal(false);

  onMount(() => {
    if (store.state.hatenaEntries.length === 0) {
      loadEntries();
    }
  });

  const loadEntries = async () => {
    setLoading(true);
    try {
      const entries = props.type === 'hot'
        ? await fetchHatenaHot()
        : await fetchHatenaLatest();
      store.setHatenaEntries(entries);
      props.speech.speak(`${entries.length}件のエントリーを読み込みました`);
    } catch (err) {
      console.error('Failed to load entries:', err);
      props.speech.speak('エントリーの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const speakEntry = () => {
    const currentEntry = store.getCurrentEntry();
    if (!currentEntry) return;

    props.speech.speak(currentEntry.title, { interrupt: true });

    if (currentEntry.description) {
      setTimeout(() => {
        const description = currentEntry.description.slice(0, 200);
        props.speech.speak(description);
      }, 1500);
    }

    if (currentEntry.bookmark_count > 0) {
      setTimeout(() => {
        props.speech.speak(`${currentEntry.bookmark_count}ブックマーク`);
      }, currentEntry.description ? 3000 : 1500);
    }
  };

  useAutoNavigation({
    get enabled() { return store.state.autoNavigationEnabled; },
    speech: props.speech,
    onNext: () => {
      if (store.state.currentEntryIndex < store.state.hatenaEntries.length - 1) {
        store.nextEntry();
        setTimeout(speakEntry, 100);
      } else {
        props.speech.speak('最後のエントリーです');
      }
    },
    delay: 3000,
  });

  const actions = () => {
    const actionList = [
    {
      label: '戻る',
      action: () => {
        props.speech.stop();
        props.onBack();
      },
    },
    {
      label: 'リロード',
      action: () => {
        setLoading(true);
        const loadFn = props.type === 'hot' ? fetchHatenaHot : fetchHatenaLatest;
        loadFn()
          .then((entries) => {
            store.setHatenaEntries(entries);
            props.speech.speak(`${entries.length}件のエントリーを再読み込みしました`);
          })
          .catch(() => {
            props.speech.speak('再読み込みに失敗しました');
          })
          .finally(() => setLoading(false));
      },
    },
    {
      label: '未実装',
      action: () => props.speech.speak('この枠の機能はまだありません'),
    },
    {
      label: '前のエントリー',
      action: () => {
        if (store.state.currentEntryIndex > 0) {
          store.prevEntry();
          setTimeout(speakEntry, 100);
        } else {
          props.speech.speak('最初のエントリーです');
        }
      },
    },
    {
      label: loading()
        ? '取得中'
        : store.getCurrentEntry()
          ? `${store.getCurrentEntry()!.title}\n${previewText(store.getCurrentEntry()!.description, 56)}`
          : 'エントリーなし',
      action: speakEntry,
    },
    {
      label: '次のエントリー',
      action: () => {
        if (store.state.currentEntryIndex < store.state.hatenaEntries.length - 1) {
          store.nextEntry();
          setTimeout(speakEntry, 100);
        } else {
          props.speech.speak('最後のエントリーです');
        }
      },
    },
    {
      label: `${store.state.currentEntryIndex + 1}/${store.state.hatenaEntries.length}`,
      action: () => props.speech.speak(`${store.state.hatenaEntries.length}件中、${store.state.currentEntryIndex + 1}件目です`),
    },
    {
      label: 'コメント表示',
      action: () => {
        const currentEntry = store.getCurrentEntry();
        if (currentEntry && currentEntry.comments_url) {
          props.speech.speak('コメント一覧を表示します');
          props.onViewComments();
        } else {
          props.speech.speak('コメントがありません');
        }
      },
    },
    {
      label: '停止',
      action: () => props.speech.stop(),
    },
    ];

    actionList[8] = createGuideAction('はてなブックマーク人気エントリー', props.speech, () => actionList);
    return actionList;
  };

  return (
    <div class="h-screen w-screen">
      <GridSystem
        actions={actions()}
        speech={props.speech}
        onInit={() => {
          props.speech.speak(props.type === 'hot' ? 'はてなブックマーク 人気エントリー' : 'はてなブックマーク 新着エントリー');
          if (store.state.hatenaEntries.length > 0) {
            props.speech.speak(`${store.state.hatenaEntries.length}件のエントリーがあります`);
          }
        }}
      />
    </div>
  );
}
