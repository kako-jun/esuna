import { onMount } from 'solid-js';
import { SpeechManager } from '../lib/speech';
import StatusMessage from './StatusMessage';

interface FivechThreadListProps {
  speech: SpeechManager;
  onBack: () => void;
  onSelectThread?: () => void;
}

export default function FivechThreadList(props: FivechThreadListProps) {
  onMount(() => {
    props.speech.speak(
      '5ちゃんねるのスレッド一覧は、現在未対応です。いまの取得方式では成立していません。9で戻ってください'
    );
  });

  return (
    <StatusMessage
      title="5ちゃんねる スレッド一覧は未対応です"
      message="板名の確認まではできますが、スレッド一覧の取得方式はまだ成立していません。"
      hint="9で戻ってください。現状の方式では Cloudflare Workers から subject.txt を取得できません。"
    />
  );
}
