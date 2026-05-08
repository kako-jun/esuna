import { createSignal, onMount } from 'solid-js';
import { useAppStore } from '../lib/store';
import { fetchSNSPosts } from '../lib/api-client';
import { SpeechManager } from '../lib/speech';
import { useAutoNavigation } from '../lib/useAutoNavigation';
import GridSystem from './GridSystem';
import { FORMAL_SERVICE_NAMES, previewText } from '../lib/service-copy';
import { createGuideAction } from '../lib/grid-guide';

interface SNSPostReaderProps {
  speech: SpeechManager;
  onBack: () => void;
}

export default function SNSPostReader(props: SNSPostReaderProps) {
  const store = useAppStore();
  const [loading, setLoading] = createSignal(false);
  const [platform, setPlatform] = createSignal<'mastodon' | 'bluesky'>('mastodon');

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
      props.speech.speak(`${platform() === 'mastodon' ? 'Mastodon' : 'Bluesky'} の投稿を${posts.length}件読み込みました。現在は試験表示です。`);
    } catch (err) {
      console.error('Failed to load posts:', err);
      props.speech.speak(`${platform() === 'mastodon' ? 'Mastodon' : 'Bluesky'} の投稿を取得できませんでした。現在この機能は試験中です。`);
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

  const actions = () => {
    const actionList = [
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
        label: '切替',
        action: () => {
          const platforms: Array<'mastodon' | 'bluesky'> = ['mastodon', 'bluesky'];
          const currentIndex = platforms.indexOf(platform());
          const nextPlatform = platforms[(currentIndex + 1) % platforms.length];
          setPlatform(nextPlatform);
          props.speech.speak(`${nextPlatform === 'mastodon' ? 'Mastodon' : 'Bluesky'} に切り替えました。現在は試験表示です。X には未対応です。`);
        },
      },
      {
        label: '前の投稿',
        action: () => {
          if (store.state.currentSNSPostIndex > 0) { store.prevSNSPost(); setTimeout(speakPost, 100); }
          else { props.speech.speak('最初の投稿です'); }
        },
      },
      {
        label: loading()
          ? '取得中'
          : store.getCurrentSNSPost()
            ? `${store.getCurrentSNSPost()!.author}\n${previewText(store.getCurrentSNSPost()!.text, 58)}`
            : '投稿なし',
        action: speakPost,
      },
      {
        label: '次の投稿',
        action: () => {
          if (store.state.currentSNSPostIndex < store.state.snsPosts.length - 1) { store.nextSNSPost(); setTimeout(speakPost, 100); }
          else { props.speech.speak('最後の投稿です'); }
        },
      },
      { label: `${store.state.currentSNSPostIndex + 1}/${store.state.snsPosts.length}`, action: () => props.speech.speak(`${store.state.snsPosts.length}件中、${store.state.currentSNSPostIndex + 1}件目です`) },
      { label: '停止', action: () => props.speech.stop() },
      createGuideAction('公開投稿の試験表示', props.speech, () => actionList),
    ];

    return actionList;
  };

  return (
    <div class="h-screen w-screen">
      <GridSystem actions={actions()} speech={props.speech} onInit={() => {
        props.speech.speak(`${FORMAL_SERVICE_NAMES.sns} の画面です。現在は試験表示です。X には未対応です。`);
        if (store.state.snsPosts.length > 0) props.speech.speak(`${store.state.snsPosts.length}件の投稿があります`);
      }} />
    </div>
  );
}
