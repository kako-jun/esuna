import { createSignal, onMount, onCleanup } from 'solid-js';
import { RadioStation, getStreamUrl } from '../lib/radio';
import { SpeechManager } from '../lib/speech';
import GridSystem, { GridAction } from './GridSystem';
import StatusMessage from './StatusMessage';
import { FORMAL_SERVICE_NAMES, loadingMessage } from '../lib/service-copy';
import { createGuideAction } from '../lib/grid-guide';

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
        audio.play().then(() => { setIsPlaying(true); }).catch((err) => {
          console.error('Play error:', err);
          setError('音声の再生に失敗しました。ブラウザの設定で自動再生が制限されている可能性があります。');
          props.speech.speak('音声の再生に失敗しました。ブラウザの設定で自動再生が制限されている可能性があります。6番で再生を試みるか、1番で戻ってください。');
        });
      });
      audio.addEventListener('error', () => {
        setIsLoading(false);
        setError('ストリーミングの読み込みに失敗しました。この局は現在利用できないか、ブラウザが対応していません。');
        props.speech.speak('ストリーミングの読み込みに失敗しました。この局は現在利用できないか、ブラウザが対応していません。1番で戻って別の局を試してください。');
      });
      audio.addEventListener('ended', () => { setIsPlaying(false); });
    } catch (err) {
      console.error('Init error:', err);
      setIsLoading(false);
      setError('ラジオ局への接続に失敗しました。ブラウザや取得先の都合で再生できない場合があります。');
      props.speech.speak('ラジオ局への接続に失敗しました。ブラウザや取得先の都合で再生できない場合があります。1番で戻って別の局を試してください。');
    }
  });

  onCleanup(() => {
    props.speech.stop();
    if (audioRef) { audioRef.pause(); audioRef.src = ''; audioRef = null; }
  });

  const togglePlay = () => {
    if (!audioRef) return;
    if (isPlaying()) { audioRef.pause(); setIsPlaying(false); props.speech.speak('一時停止しました'); }
    else {
      audioRef.play()
        .then(() => { setIsPlaying(true); props.speech.speak('再生を再開しました'); })
        .catch(() => { props.speech.speak('再生に失敗しました。ブラウザの設定を確認するか、1番で戻って別の局を試してください。'); });
    }
  };

  const changeVolume = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef) { audioRef.volume = newVolume; }
    props.speech.speak(`音量を${Math.round(newVolume * 100)}パーセントに設定しました`);
  };

  const actions = () => {
    const actionList: GridAction[] = [
      { label: '戻る', action: () => { if (audioRef) { audioRef.pause(); } props.speech.stop(); props.onBack(); } },
      { label: '', action: () => {} },
      { label: '', action: () => {} },
      { label: '局情報', action: () => { props.speech.speak(`現在再生中：${props.station.name}。${props.station.description}。状態：${isPlaying() ? '再生中' : '一時停止中'}`); } },
      { label: `${props.station.name}\n${isPlaying() ? '再生中' : '一時停止中'}`, action: () => { props.speech.speak(`${props.station.name}。${isPlaying() ? '再生中' : '一時停止中'}`); } },
      { label: isPlaying() ? '一時停止' : '再生', action: togglePlay },
      { label: `${props.station.name}`, action: () => { props.speech.speak(`${props.station.name}。${props.station.description}`); } },
      { label: '停止', action: () => { props.speech.stop(); } },
      createGuideAction('ラジオ再生画面', props.speech, () => actionList),
    ];

    return actionList;
  };

  if (isLoading()) {
    return (
      <StatusMessage
        type="loading"
        title={loadingMessage(props.station.name)}
        message="ストリーミングの準備をしています。ブラウザや局の都合で失敗する場合があります。"
        hint="しばらく待っても始まらない場合は、1番で戻って別の局を試してください。"
      />
    );
  }

  if (error()) {
    return (
      <StatusMessage
        type="failure"
        title={`${props.station.name} を再生できません`}
        message={error()!}
        hint="1番で戻って別の局を試してください。「radiko」と書かれた局はまだ未対応です。"
      />
    );
  }

  return <GridSystem actions={actions()} speech={props.speech} />;
}
