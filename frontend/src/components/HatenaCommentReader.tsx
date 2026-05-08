import { createSignal, onMount } from 'solid-js';
import { useAppStore } from '../lib/store';
import { fetchHatenaComments } from '../lib/api-client';
import { SpeechManager } from '../lib/speech';
import { useAutoNavigation } from '../lib/useAutoNavigation';
import GridSystem, { GridAction } from './GridSystem';
import { previewText } from '../lib/service-copy';
import { createGuideAction } from '../lib/grid-guide';

interface HatenaCommentReaderProps {
  speech: SpeechManager;
  onBack: () => void;
}

export default function HatenaCommentReader(props: HatenaCommentReaderProps) {
  const store = useAppStore();
  const [loading, setLoading] = createSignal(false);

  onMount(() => {
    const entry = store.getCurrentEntry();
    // 別エントリーへ遷移して入り直したときも再ロードする。
    // hatenaCommentsSourceUrl とエントリー URL が一致するときだけ、前回のコメントを再利用する。
    const cachedFor = store.state.hatenaCommentsSourceUrl;
    if (entry && cachedFor === entry.comments_url && store.state.hatenaComments.length > 0) {
      return;
    }
    loadComments();
  });

  const loadComments = async () => {
    const entry = store.getCurrentEntry();
    if (!entry || !entry.comments_url) {
      props.speech.speak('コメントのURLが見つかりません。1番で戻ってください。');
      return;
    }

    setLoading(true);
    try {
      const comments = await fetchHatenaComments(entry.comments_url);
      store.setHatenaComments(comments, entry.comments_url);
      if (comments.length === 0) {
        props.speech.speak('コメントがありません');
      } else {
        props.speech.speak(`${comments.length}件のコメントを読み込みました`);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
      props.speech.speak('はてなブックマークのコメントを取得できませんでした。外部サービスへの接続に失敗しました。1番で戻るか、4番でもう一度試せます。');
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

  const reload = () => {
    const entry = store.getCurrentEntry();
    if (entry && entry.comments_url) {
      setLoading(true);
      fetchHatenaComments(entry.comments_url)
        .then((comments) => { store.setHatenaComments(comments, entry.comments_url); props.speech.speak(`${comments.length}件のコメントを再読み込みしました`); })
        .catch(() => { props.speech.speak('はてなブックマークのコメントを再取得できませんでした。外部サービスへの接続に失敗しました。1番で戻ってください。'); })
        .finally(() => setLoading(false));
    }
  };

  const actions = () => {
    // 規約: 1=戻る 2=前 3=次 4=リロード（はてな特例） 5=主対象 6=主アクション 7=補助情報 8=停止 9=画面案内
    const actionList: GridAction[] = [
    { label: '戻る', action: () => { props.speech.stop(); props.onBack(); } },
    {
      label: '前のコメント',
      action: () => {
        if (store.state.currentCommentIndex > 0) { store.prevComment(); setTimeout(speakComment, 100); }
        else { props.speech.speak('最初のコメントです'); }
      },
    },
    {
      label: '次のコメント',
      action: () => {
        if (store.state.currentCommentIndex < store.state.hatenaComments.length - 1) { store.nextComment(); setTimeout(speakComment, 100); }
        else { props.speech.speak('最後のコメントです'); }
      },
    },
    { label: 'リロード', action: reload },
    {
      label: loading()
        ? 'コメント\n取得中…'
        : store.getCurrentComment()
          ? `${store.getCurrentComment()!.user_name}\n${previewText(store.getCurrentComment()!.text, 58)}`
          : 'コメントなし',
      action: speakComment,
    },
    { label: '全文\n読み上げ', action: speakComment },
    { label: `${store.state.currentCommentIndex + 1}/${store.state.hatenaComments.length}`, action: () => props.speech.speak(`${store.state.hatenaComments.length}件中、${store.state.currentCommentIndex + 1}件目です`) },
    { label: '停止', action: () => props.speech.stop() },
    createGuideAction('はてなブックマークコメント一覧', props.speech, () => actionList),
  ];

    return actionList;
  };

  return (
    <div class="h-screen w-screen">
      <GridSystem actions={actions()} speech={props.speech} onInit={() => {
        props.speech.speak('はてなブックマーク コメント一覧');
        if (store.state.hatenaComments.length > 0) props.speech.speak(`${store.state.hatenaComments.length}件のコメントがあります`);
      }} />
    </div>
  );
}
