import { createSignal, onMount } from 'solid-js';
import { useAppStore } from '../lib/store';
import { fetch5chPosts } from '../lib/api-client';
import { SpeechManager } from '../lib/speech';
import { useAutoNavigation } from '../lib/useAutoNavigation';
import GridSystem from './GridSystem';
import { previewText } from '../lib/service-copy';

interface FivechPostReaderProps {
  speech: SpeechManager;
  onBack: () => void;
}

export default function FivechPostReader(props: FivechPostReaderProps) {
  const store = useAppStore();
  const [loading, setLoading] = createSignal(false);

  onMount(() => {
    if (store.state.fivechPosts.length === 0) loadPosts();
  });

  const loadPosts = async () => {
    const thread = store.getCurrentThread();
    if (!thread) { props.speech.speak('スレッドが選択されていません'); return; }
    setLoading(true);
    try {
      const posts = await fetch5chPosts(thread.url, 1, 100);
      store.set5chPosts(posts);
      props.speech.speak(`${posts.length}件のレスを読み込みました`);
    } catch (err) {
      console.error('Failed to load posts:', err);
      props.speech.speak('レスの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const speakPost = () => {
    const currentPost = store.getCurrentPost();
    if (!currentPost) return;
    props.speech.speak(`${currentPost.number}番 ${currentPost.name}`, { interrupt: true });
    setTimeout(() => { props.speech.speak(currentPost.text); }, 1000);
  };

  useAutoNavigation({
    get enabled() { return store.state.autoNavigationEnabled; },
    speech: props.speech,
    onNext: () => {
      if (store.state.currentPostIndex < store.state.fivechPosts.length - 1) { store.nextPost(); setTimeout(speakPost, 100); }
      else { props.speech.speak('最後のレスです'); }
    },
    delay: 3000,
  });

  const actions = () => [
    { label: '戻る', action: () => { props.speech.stop(); props.onBack(); } },
    {
      label: 'リロード',
      action: () => {
        const thread = store.getCurrentThread();
        if (thread) {
          setLoading(true);
          fetch5chPosts(thread.url, 1, 100)
            .then((posts) => { store.set5chPosts(posts); props.speech.speak(`${posts.length}件のレスを再読み込みしました`); })
            .catch(() => { props.speech.speak('再読み込みに失敗しました'); })
            .finally(() => setLoading(false));
        }
      },
    },
    { label: '設定', action: () => props.speech.speak('設定画面は未実装です') },
    { label: '前のレス', action: () => { if (store.state.currentPostIndex > 0) { store.prevPost(); setTimeout(speakPost, 100); } else { props.speech.speak('最初のレスです'); } } },
    {
      label: loading()
        ? '取得中'
        : store.getCurrentPost()
          ? `${store.getCurrentPost()!.number}番\n${previewText(store.getCurrentPost()!.text, 58)}`
          : 'レスなし',
      action: speakPost,
    },
    { label: '次のレス', action: () => { if (store.state.currentPostIndex < store.state.fivechPosts.length - 1) { store.nextPost(); setTimeout(speakPost, 100); } else { props.speech.speak('最後のレスです'); } } },
    { label: `${store.state.currentPostIndex + 1}/${store.state.fivechPosts.length}`, action: () => props.speech.speak(`${store.state.fivechPosts.length}件中、${store.state.currentPostIndex + 1}件目です`) },
    { label: '全文読み上げ', action: speakPost },
    { label: '停止', action: () => props.speech.stop() },
  ];

  return (
    <div class="h-screen w-screen">
      <GridSystem actions={actions()} speech={props.speech} onInit={() => {
        const thread = store.getCurrentThread();
        props.speech.speak(`5ちゃんねる レス表示 ${thread?.title || ''}`);
        if (store.state.fivechPosts.length > 0) props.speech.speak(`${store.state.fivechPosts.length}件のレスがあります`);
      }} />
    </div>
  );
}
