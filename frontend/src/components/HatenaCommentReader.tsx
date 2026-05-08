import { createSignal, onMount } from 'solid-js';
import { useAppStore } from '../lib/store';
import { fetchHatenaComments } from '../lib/api-client';
import { SpeechManager } from '../lib/speech';
import { useAutoNavigation } from '../lib/useAutoNavigation';
import GridSystem from './GridSystem';
import { previewText } from '../lib/service-copy';

interface HatenaCommentReaderProps {
  speech: SpeechManager;
  onBack: () => void;
}

export default function HatenaCommentReader(props: HatenaCommentReaderProps) {
  const store = useAppStore();
  const [loading, setLoading] = createSignal(false);

  onMount(() => {
    if (store.state.hatenaComments.length === 0) {
      loadComments();
    }
  });

  const loadComments = async () => {
    const entry = store.getCurrentEntry();
    if (!entry || !entry.comments_url) {
      props.speech.speak('コメントURLが見つかりません');
      return;
    }

    setLoading(true);
    try {
      const comments = await fetchHatenaComments(entry.comments_url);
      store.setHatenaComments(comments);
      if (comments.length === 0) {
        props.speech.speak('コメントがありません');
      } else {
        props.speech.speak(`${comments.length}件のコメントを読み込みました`);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
      props.speech.speak('コメントの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const speakComment = () => {
    const currentComment = store.getCurrentComment();
    if (!currentComment) return;
    props.speech.speak(`${currentComment.user_name}さん`, { interrupt: true });
    setTimeout(() => {
      props.speech.speak(currentComment.text);
    }, 1000);
  };

  useAutoNavigation({
    get enabled() { return store.state.autoNavigationEnabled; },
    speech: props.speech,
    onNext: () => {
      if (store.state.currentCommentIndex < store.state.hatenaComments.length - 1) {
        store.nextComment();
        setTimeout(speakComment, 100);
      } else {
        props.speech.speak('最後のコメントです');
      }
    },
    delay: 3000,
  });

  const actions = () => [
    { label: '戻る', action: () => { props.speech.stop(); props.onBack(); } },
    {
      label: 'リロード',
      action: () => {
        const entry = store.getCurrentEntry();
        if (entry && entry.comments_url) {
          setLoading(true);
          fetchHatenaComments(entry.comments_url)
            .then((comments) => { store.setHatenaComments(comments); props.speech.speak(`${comments.length}件のコメントを再読み込みしました`); })
            .catch(() => { props.speech.speak('再読み込みに失敗しました'); })
            .finally(() => setLoading(false));
        }
      },
    },
    { label: '設定', action: () => props.speech.speak('設定画面は未実装です') },
    {
      label: '前のコメント',
      action: () => {
        if (store.state.currentCommentIndex > 0) { store.prevComment(); setTimeout(speakComment, 100); }
        else { props.speech.speak('最初のコメントです'); }
      },
    },
    {
      label: loading()
        ? '取得中'
        : store.getCurrentComment()
          ? `${store.getCurrentComment()!.user_name}\n${previewText(store.getCurrentComment()!.text, 58)}`
          : 'コメントなし',
      action: speakComment,
    },
    {
      label: '次のコメント',
      action: () => {
        if (store.state.currentCommentIndex < store.state.hatenaComments.length - 1) { store.nextComment(); setTimeout(speakComment, 100); }
        else { props.speech.speak('最後のコメントです'); }
      },
    },
    { label: `${store.state.currentCommentIndex + 1}/${store.state.hatenaComments.length}`, action: () => props.speech.speak(`${store.state.hatenaComments.length}件中、${store.state.currentCommentIndex + 1}件目です`) },
    { label: '全文読み上げ', action: speakComment },
    { label: '停止', action: () => props.speech.stop() },
  ];

  return (
    <div class="h-screen w-screen">
      <GridSystem actions={actions()} speech={props.speech} onInit={() => {
        props.speech.speak('はてなブックマーク コメント一覧');
        if (store.state.hatenaComments.length > 0) props.speech.speak(`${store.state.hatenaComments.length}件のコメントがあります`);
      }} />
    </div>
  );
}
