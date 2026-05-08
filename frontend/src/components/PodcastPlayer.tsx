import { createSignal, onMount, onCleanup, Show } from 'solid-js';
import { useAppStore } from '../lib/store';
import { fetchPodcastEpisodes } from '../lib/api-client';
import { SpeechManager } from '../lib/speech';
import GridSystem from './GridSystem';
import StatusMessage from './StatusMessage';
import { FORMAL_SERVICE_NAMES, previewText } from '../lib/service-copy';
import { createGuideAction } from '../lib/grid-guide';

interface PodcastPlayerProps {
  speech: SpeechManager;
  onBack: () => void;
}

export default function PodcastPlayer(props: PodcastPlayerProps) {
  const store = useAppStore();
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [isPlaying, setIsPlaying] = createSignal(false);
  let audioRef: HTMLAudioElement | null = null;

  onMount(() => {
    if (store.state.podcastEpisodes.length === 0 && store.state.selectedPodcast) {
      loadEpisodes();
    }
  });

  onCleanup(() => {
    if (audioRef) { audioRef.pause(); audioRef = null; }
  });

  const loadEpisodes = async () => {
    const selectedPodcast = store.state.selectedPodcast;
    if (!selectedPodcast) { props.speech.speak(`${FORMAL_SERVICE_NAMES.podcast} が選択されていません`); props.onBack(); return; }
    setLoading(true); setError(null);
    try {
      const episodes = await fetchPodcastEpisodes(selectedPodcast.feedUrl, 10);
      store.setPodcastEpisodes(episodes);
      setTimeout(() => {
        props.speech.speak(`${selectedPodcast.title} のエピソードを${episodes.length}件読み込みました。最新のエピソードから説明します`);
        setTimeout(() => speakEpisode(), 2000);
      }, 500);
    } catch (err) {
      console.error('Failed to load episodes:', err);
      setError(`${selectedPodcast.title} のエピソードを取得できませんでした。番組によっては失敗します。前の画面に戻ります`);
      props.speech.speak(`${selectedPodcast.title} のエピソードを取得できませんでした。番組によっては失敗します。前の画面に戻ります`);
      setTimeout(props.onBack, 2000);
    } finally {
      setLoading(false);
    }
  };

  const speakEpisode = () => {
    const ep = store.getCurrentEpisode();
    if (!ep) return;
    const durationText = ep.duration > 0 ? `再生時間は約${Math.floor(ep.duration / 60)}分です。` : '';
    props.speech.speak(`エピソード ${store.state.currentEpisodeIndex + 1}。${ep.title}。${ep.description}${durationText}`, { interrupt: true });
  };

  const playAudio = () => {
    const ep = store.getCurrentEpisode();
    if (!ep?.audio_url) { props.speech.speak('音声ファイルが見つかりません'); return; }
    if (!audioRef) {
      audioRef = new Audio(ep.audio_url);
      audioRef.addEventListener('ended', () => { setIsPlaying(false); props.speech.speak('再生が終了しました'); });
      audioRef.addEventListener('error', () => { setIsPlaying(false); props.speech.speak('音声の再生に失敗しました'); });
    }
    if (isPlaying()) { audioRef.pause(); setIsPlaying(false); props.speech.speak('再生を一時停止しました'); }
    else { audioRef.play(); setIsPlaying(true); props.speech.speak('再生を開始します'); }
  };

  const stopAudio = () => {
    if (audioRef) { audioRef.pause(); audioRef.currentTime = 0; setIsPlaying(false); props.speech.speak('再生を停止しました'); }
  };

  const actions = () => {
    const actionList = [
      { label: '戻る', action: () => { props.speech.stop(); stopAudio(); store.setPodcastEpisodes([]); props.onBack(); } },
      { label: '前のエピソード', action: () => { if (store.state.currentEpisodeIndex > 0) { stopAudio(); audioRef = null; store.prevEpisode(); setTimeout(speakEpisode, 100); } else { props.speech.speak('最初のエピソードです'); } } },
      { label: '次のエピソード', action: () => { if (store.state.currentEpisodeIndex < store.state.podcastEpisodes.length - 1) { stopAudio(); audioRef = null; store.nextEpisode(); setTimeout(speakEpisode, 100); } else { props.speech.speak('最後のエピソードです'); } } },
      { label: isPlaying() ? '一時停止' : '再生', action: playAudio },
      {
        label: store.getCurrentEpisode()
          ? `${store.getCurrentEpisode()!.title}\n${previewText(store.getCurrentEpisode()!.description, 58)}`
          : 'エピソードなし',
        action: speakEpisode,
      },
      { label: '音声停止', action: stopAudio },
      { label: '位置', action: () => { props.speech.speak(`全${store.state.podcastEpisodes.length}エピソード中、${store.state.currentEpisodeIndex + 1}番目のエピソードです`); } },
      { label: '番組情報', action: () => { const p = store.state.selectedPodcast; if (p) { props.speech.speak(`番組名：${p.title}。カテゴリ：${p.category}。全${store.state.podcastEpisodes.length}エピソード`); } } },
      createGuideAction('Podcastエピソード一覧', props.speech, () => actionList),
    ];

    return actionList;
  };

  return (
    <Show
      when={!loading()}
      fallback={
        <StatusMessage
          title={`${FORMAL_SERVICE_NAMES.podcast} を開いています`}
          message={`${store.state.selectedPodcast?.title || '番組'} のエピソード一覧を取得しています。番組によっては取得に失敗します。`}
          hint="しばらく待っても進まない場合は、前の画面に戻って別の番組を試してください。"
        />
      }
    >
      <Show when={!error()} fallback={
        <div class="grid-container" role="alert" aria-live="assertive">
          <div class="grid-item" style={{ "grid-column": '1 / -1', "grid-row": '1 / -1' }}>エラー: {error()}</div>
        </div>
      }>
        <GridSystem actions={actions()} speech={props.speech} />
      </Show>
    </Show>
  );
}
