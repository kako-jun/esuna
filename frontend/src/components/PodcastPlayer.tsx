import { createSignal, onMount, onCleanup, Show } from 'solid-js';
import { useAppStore } from '../lib/store';
import { fetchPodcastEpisodes } from '../lib/api-client';
import { SpeechManager } from '../lib/speech';
import GridSystem, { GridAction } from './GridSystem';
import StatusMessage from './StatusMessage';
import { FORMAL_SERVICE_NAMES, previewText, loadingMessage, failureSpeech, retryFailureSpeech } from '../lib/service-copy';
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
    if (!selectedPodcast) {
      props.speech.speak(`${FORMAL_SERVICE_NAMES.podcast} の番組が選択されていません。1番で戻ってください。`);
      props.onBack();
      return;
    }
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
      const msg = failureSpeech(
        `${selectedPodcast.title}`,
        '番組によっては外部フィードの取得に失敗します。',
        false,
      );
      setError(msg);
      props.speech.speak(msg);
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
      audioRef.addEventListener('error', () => { setIsPlaying(false); props.speech.speak('音声の再生に失敗しました。ファイル形式か接続に問題があります。'); });
    }
    if (isPlaying()) { audioRef.pause(); setIsPlaying(false); props.speech.speak('再生を一時停止しました'); }
    else { audioRef.play(); setIsPlaying(true); props.speech.speak('再生を開始します'); }
  };

  const stopAudio = () => {
    if (audioRef) { audioRef.pause(); audioRef.currentTime = 0; setIsPlaying(false); props.speech.speak('再生を停止しました'); }
  };

  const actions = () => {
    const actionList: GridAction[] = [
      // 規約: 1=戻る 2=前 3=次 4=情報/リロード 5=主対象 6=主アクション 7=補助情報 8=停止 9=画面案内
      { label: '戻る', action: () => { props.speech.stop(); stopAudio(); store.setPodcastEpisodes([]); props.onBack(); } },
      { label: '前のエピソード', action: () => { if (store.state.currentEpisodeIndex > 0) { stopAudio(); audioRef = null; store.prevEpisode(); setTimeout(speakEpisode, 100); } else { props.speech.speak('最初のエピソードです'); } } },
      { label: '次のエピソード', action: () => { if (store.state.currentEpisodeIndex < store.state.podcastEpisodes.length - 1) { stopAudio(); audioRef = null; store.nextEpisode(); setTimeout(speakEpisode, 100); } else { props.speech.speak('最後のエピソードです'); } } },
      { label: '読み上げ', action: speakEpisode },
      {
        label: store.getCurrentEpisode()
          ? `${store.getCurrentEpisode()!.title}\n${previewText(store.getCurrentEpisode()!.description, 58)}`
          : 'エピソードなし',
        action: speakEpisode,
      },
      { label: isPlaying() ? '一時停止' : '再生', action: playAudio },
      { label: '位置', action: () => { props.speech.speak(`全${store.state.podcastEpisodes.length}エピソード中、${store.state.currentEpisodeIndex + 1}番目のエピソードです`); } },
      { label: '停止', action: () => { props.speech.stop(); } },
      createGuideAction('Podcastエピソード一覧', props.speech, () => actionList),
    ];

    return actionList;
  };

  return (
    <Show
      when={!loading()}
      fallback={
        <StatusMessage
          type="loading"
          title={loadingMessage(`${store.state.selectedPodcast?.title || '番組'}のエピソード`)}
          message="外部の番組フィードを取得しています。番組によっては時間がかかります。"
          hint="しばらく待っても進まない場合は、1番で戻って別の番組を試してください。"
        />
      }
    >
      <Show
        when={!error()}
        fallback={
          <StatusMessage
            type="failure"
            title={`${store.state.selectedPodcast?.title || '番組'}のエピソードを開けませんでした`}
            message={error()!}
            hint="1番で戻り、別の番組を試してください。"
          />
        }
      >
        <GridSystem actions={actions()} speech={props.speech} />
      </Show>
    </Show>
  );
}
