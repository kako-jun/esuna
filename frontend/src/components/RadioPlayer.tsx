import { createSignal, onMount, onCleanup } from 'solid-js';
import { RadioStation, getStreamUrl } from '../lib/radio';
import { SpeechManager } from '../lib/speech';
import GridSystem from './GridSystem';
import StatusMessage from './StatusMessage';
import { FORMAL_SERVICE_NAMES } from '../lib/service-copy';

interface RadioPlayerProps {
  station: RadioStation;
  speech: SpeechManager;
  onBack: () => void;
}

export default function RadioPlayer(props: RadioPlayerProps) {
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [volume, setVolume] = createSignal(1.0);
  let audioRef: HTMLAudioElement | null = null;

  onMount(async () => {
    try {
      setIsLoading(true); setError(null);
      const streamUrl = await getStreamUrl(props.station.id);
      const audio = new Audio(streamUrl);
      audio.volume = volume();
      audioRef = audio;

      audio.addEventListener('canplay', () => {
        setIsLoading(false);
        props.speech.speak(`${props.station.name} の再生を開始します`);
        audio.play().then(() => { setIsPlaying(true); }).catch((err) => { console.error('Play error:', err); setError('再生に失敗しました'); props.speech.speak('再生に失敗しました'); });
      });
      audio.addEventListener('error', () => { setIsLoading(false); setError('ストリーミングの読み込みに失敗しました'); props.speech.speak('ストリーミングの読み込みに失敗しました'); });
      audio.addEventListener('ended', () => { setIsPlaying(false); });
    } catch (err) {
      console.error('Init error:', err);
      setIsLoading(false); setError('ラジオ局への接続に失敗しました');
      props.speech.speak('ラジオ局への接続に失敗しました。ブラウザや取得先の都合で再生できない場合があります');
    }
  });

  onCleanup(() => {
    if (audioRef) { audioRef.pause(); audioRef.src = ''; audioRef = null; }
  });

  const togglePlay = () => {
    if (!audioRef) return;
    if (isPlaying()) { audioRef.pause(); setIsPlaying(false); props.speech.speak('一時停止しました'); }
    else { audioRef.play().then(() => { setIsPlaying(true); props.speech.speak('再生を再開しました'); }).catch(() => { props.speech.speak('再生に失敗しました'); }); }
  };

  const changeVolume = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef) { audioRef.volume = newVolume; }
    props.speech.speak(`音量を${Math.round(newVolume * 100)}パーセントに設定しました`);
  };

  const actions = () => [
    { label: '戻る', action: () => { if (audioRef) { audioRef.pause(); } props.speech.stop(); props.onBack(); } },
    { label: isPlaying() ? '一時停止' : '再生', action: togglePlay },
    { label: '音量：大', action: () => changeVolume(1.0) },
    { label: '音量：中', action: () => changeVolume(0.7) },
    { label: '音量：小', action: () => changeVolume(0.4) },
    { label: '音量：最小', action: () => changeVolume(0.1) },
    { label: '局情報', action: () => { props.speech.speak(`現在再生中：${props.station.name}。${props.station.description}。状態：${isPlaying() ? '再生中' : '一時停止中'}。音量：${Math.round(volume() * 100)}パーセント`); } },
    { label: '停止', action: () => { props.speech.stop(); } },
    { label: isPlaying() ? '再生中' : '停止中', action: () => { if (isLoading()) { props.speech.speak('読み込み中です'); } else if (error()) { props.speech.speak(`エラー：${error()}`); } else { props.speech.speak(isPlaying() ? `${props.station.name} を再生中です` : '一時停止中です'); } } },
  ];

  if (isLoading()) {
    return (
      <StatusMessage
        title={`${FORMAL_SERVICE_NAMES.radio} を開いています`}
        message={`${props.station.name} の再生準備をしています。ブラウザや取得先の都合で失敗する場合があります。`}
        hint="しばらく待っても始まらない場合は、前の画面に戻って別の局を試してください。"
      />
    );
  }

  if (error()) {
    return (
      <StatusMessage
        title="ラジオを再生できません"
        message={error()!}
        hint="前の画面に戻って別の局を試してください。radiko と書かれた局はまだ未対応です。"
      />
    );
  }

  return <GridSystem actions={actions()} speech={props.speech} />;
}
