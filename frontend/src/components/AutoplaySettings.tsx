import { createSignal, onMount } from 'solid-js';
import { loadAutoplaySettings, saveAutoplaySettings, AutoplaySettings, AutoplayContentType, getContentTypeName } from '../lib/autoplay';
import { SpeechManager } from '../lib/speech';
import GridSystem from './GridSystem';
import { FORMAL_SERVICE_NAMES } from '../lib/service-copy';

interface AutoplaySettingsProps {
  speech: SpeechManager;
  onBack: () => void;
  onStartAutoplay: () => void;
}

export default function AutoplaySettingsComponent(props: AutoplaySettingsProps) {
  const [settings, setSettings] = createSignal<AutoplaySettings>(loadAutoplaySettings());

  onMount(() => {
    setTimeout(() => {
      props.speech.speak(
        'おまかせモード設定です。再生するサービスを選択してください。' +
        `現在、${settings().enabledTypes.length}種類が有効です`
      );
    }, 500);
  });

  const toggleContentType = (type: AutoplayContentType) => {
    const newSettings = { ...settings() };
    const index = newSettings.enabledTypes.indexOf(type);
    if (index >= 0) {
      newSettings.enabledTypes = newSettings.enabledTypes.filter((t) => t !== type);
      props.speech.speak(`${getContentTypeName(type)}を無効にしました`);
    } else {
      newSettings.enabledTypes.push(type);
      props.speech.speak(`${getContentTypeName(type)}を有効にしました`);
    }
    setSettings(newSettings);
    saveAutoplaySettings(newSettings);
  };

  const setPlayDuration = (duration: number) => {
    const newSettings = { ...settings(), playDuration: duration };
    setSettings(newSettings);
    saveAutoplaySettings(newSettings);
    props.speech.speak(`各コンテンツの再生時間を${duration}分に設定しました`);
  };

  const actions = () => [
    { label: '戻る', action: props.onBack },
    { label: `${FORMAL_SERVICE_NAMES.aozora}：` + (settings().enabledTypes.includes('novel') ? 'ON' : 'OFF'), action: () => toggleContentType('novel') },
    { label: 'Podcast：' + (settings().enabledTypes.includes('podcast') ? 'ON' : 'OFF'), action: () => toggleContentType('podcast') },
    { label: 'ラジオ：' + (settings().enabledTypes.includes('radio') ? 'ON' : 'OFF'), action: () => toggleContentType('radio') },
    { label: `${FORMAL_SERVICE_NAMES.rss}：` + (settings().enabledTypes.includes('rss-news') ? 'ON' : 'OFF'), action: () => toggleContentType('rss-news') },
    { label: `${FORMAL_SERVICE_NAMES.hatena}：` + (settings().enabledTypes.includes('hatena') ? 'ON' : 'OFF'), action: () => toggleContentType('hatena') },
    { label: '時間：5分', action: () => setPlayDuration(5) },
    { label: '時間：10分', action: () => setPlayDuration(10) },
    {
      label: '開始',
      action: () => {
        if (settings().enabledTypes.length === 0) { props.speech.speak('再生するコンテンツが選択されていません'); return; }
        props.speech.speak('おまかせモードを開始します');
        props.onStartAutoplay();
      },
    },
  ];

  return <GridSystem actions={actions()} speech={props.speech} />;
}
