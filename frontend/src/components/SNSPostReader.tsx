import { createSignal, onMount } from 'solid-js';
import { useAppStore } from '../lib/store';
import { fetchSNSPosts } from '../lib/api-client';
import { SpeechManager } from '../lib/speech';
import { useAutoNavigation } from '../lib/useAutoNavigation';
import GridSystem from './GridSystem';

interface SNSPostReaderProps {
  speech: SpeechManager;
  onBack: () => void;
}

export default function SNSPostReader(props: SNSPostReaderProps) {
  const store = useAppStore();
  const [loading, setLoading] = createSignal(false);
  const [platform, setPlatform] = createSignal<'twitter' | 'mastodon' | 'bluesky'>('twitter');

  onMount(() => {
    if (store.state.snsPosts.length === 0) {
      loadPosts();
    }
  });

  const loadPosts = async () => {
    setLoading(true);
    try {
      const posts = await fetchSNSPosts(platform(), undefined, 20);
      store.setSNSPosts(posts);
      props.speech.speak(`${posts.length}件の投稿を読み込みました`);
    } catch (err) {
      console.error('Failed to load posts:', err);
      props.speech.speak('投稿の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const speakPost = () => {
    const currentPost = store.getCurrentSNSPost();
    if (!currentPost) return;
    props.speech.speak(`${currentPost.author}さん`, { interrupt: true });
    setTimeout(() => { props.speech.speak(currentPost.text); }, 1000);
  };

  useAutoNavigation({
    get enabled() { return store.state.autoNavigationEnabled; },
    speech: props.speech,
    onNext: () => {
      if (store.state.currentSNSPostIndex < store.state.snsPosts.length - 1) { store.nextSNSPost(); setTimeout(speakPost, 100); }
      else { props.speech.speak('最後の投稿です'); }
    },
    delay: 3000,
  });

  const actions = () => [
    { label: '戻る', action: () => { props.speech.stop(); props.onBack(); } },
    {
      label: 'リロード',
      action: () => {
        setLoading(true);
        fetchSNSPosts(platform(), undefined, 20)
          .then((posts) => { store.setSNSPosts(posts); props.speech.speak(`${posts.length}件の投稿を再読み込みしました`); })
          .catch(() => { props.speech.speak('再読み込みに失敗しました'); })
          .finally(() => setLoading(false));
      },
    },
    {
      label: 'プラットフォーム切替',
      action: () => {
        const platforms: Array<'twitter' | 'mastodon' | 'bluesky'> = ['twitter', 'mastodon', 'bluesky'];
        const currentIndex = platforms.indexOf(platform());
        const nextPlatform = platforms[(currentIndex + 1) % platforms.length];
        setPlatform(nextPlatform);
        props.speech.speak(`${nextPlatform}に切り替えました`);
      },
    },
    {
      label: '前の投稿',
      action: () => {
        if (store.state.currentSNSPostIndex > 0) { store.prevSNSPost(); setTimeout(speakPost, 100); }
        else { props.speech.speak('最初の投稿です'); }
      },
    },
    { label: loading() ? '読み込み中...' : store.getCurrentSNSPost() ? `${store.getCurrentSNSPost()!.author}（サンプル）` : '投稿なし', action: speakPost },
    {
      label: '次の投稿',
      action: () => {
        if (store.state.currentSNSPostIndex < store.state.snsPosts.length - 1) { store.nextSNSPost(); setTimeout(speakPost, 100); }
        else { props.speech.speak('最後の投稿です'); }
      },
    },
    { label: `${store.state.currentSNSPostIndex + 1}/${store.state.snsPosts.length}`, action: () => props.speech.speak(`${store.state.snsPosts.length}件中、${store.state.currentSNSPostIndex + 1}件目です`) },
    { label: '全文読み上げ', action: speakPost },
    { label: '停止', action: () => props.speech.stop() },
  ];

  return (
    <div class="h-screen w-screen">
      <GridSystem actions={actions()} speech={props.speech} onInit={() => {
        props.speech.speak(`SNS投稿 現在${platform()}を表示中。※現在はサンプルデータを表示しています`);
        if (store.state.snsPosts.length > 0) props.speech.speak(`${store.state.snsPosts.length}件の投稿があります`);
      }} />
    </div>
  );
}
