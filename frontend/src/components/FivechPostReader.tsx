import { onMount } from 'solid-js';
import { SpeechManager } from '../lib/speech';
import StatusMessage from './StatusMessage';

interface FivechPostReaderProps {
  speech: SpeechManager;
  onBack: () => void;
}

export default function FivechPostReader(props: FivechPostReaderProps) {
  onMount(() => {
    props.speech.speak(
      '5ちゃんねるのレス取得は、現在未対応です。いまの取得方式では成立していません。9で戻ってください'
    );
  });

  return (
    <StatusMessage
      title="5ちゃんねる レス取得は未対応です"
      message="スレッド本文の取得方式は、まだ成立していません。いまはレスを開けません。"
      hint="9で戻ってください。現状の方式では Cloudflare Workers から dat を取得できません。"
    />
  );
}
