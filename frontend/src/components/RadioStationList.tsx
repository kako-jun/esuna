import { createSignal, onMount } from 'solid-js';
import { getAllStations, RadioStation } from '../lib/radio';
import { SpeechManager } from '../lib/speech';
import GridSystem from './GridSystem';
import { FORMAL_SERVICE_NAMES } from '../lib/service-copy';

interface RadioStationListProps {
  speech: SpeechManager;
  onBack: () => void;
  onSelectStation: (station: RadioStation) => void;
}

export default function RadioStationList(props: RadioStationListProps) {
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const allStations = getAllStations();

  onMount(() => {
    setTimeout(() => {
      props.speech.speak(`${FORMAL_SERVICE_NAMES.radio} の一覧です。${allStations.length}局あります。NHK は一部環境で不安定、radiko は未対応です。`);
      setTimeout(speakStation, 2000);
    }, 500);
  });

  const speakStation = () => {
    const station = allStations[currentIndex()];
    if (!station) return;
    props.speech.speak(`${station.name}。${station.description}。ラジオ局番号 ${currentIndex() + 1}`, { interrupt: true });
  };

  const getServiceName = (service: string) => {
    switch (service) { case 'nhk': return 'NHKらじるらじる'; case 'radiko': return 'radiko'; case 'other': return 'その他'; default: return service; }
  };

  const actions = () => [
    { label: '戻る', action: () => { props.speech.stop(); props.onBack(); } },
    { label: '前の局', action: () => { if (currentIndex() > 0) { setCurrentIndex(currentIndex() - 1); setTimeout(() => { props.speech.speak(`${allStations[currentIndex()].name}`, { interrupt: true }); }, 100); } else { props.speech.speak('最初のラジオ局です'); } } },
    { label: '次の局', action: () => { if (currentIndex() < allStations.length - 1) { setCurrentIndex(currentIndex() + 1); setTimeout(() => { props.speech.speak(`${allStations[currentIndex()].name}`, { interrupt: true }); }, 100); } else { props.speech.speak('最後のラジオ局です'); } } },
    { label: '読み上げ', action: speakStation },
    {
      label: '再生',
      action: () => {
        const station = allStations[currentIndex()];
        if (station.service === 'radiko') {
          props.speech.speak(`${station.name} は未対応です。まだ再生できません`);
          return;
        }
        props.speech.speak(`${station.name} を開いています。ブラウザによっては再生できない場合があります`);
        props.onSelectStation(station);
      },
    },
    { label: '局情報', action: () => { const s = allStations[currentIndex()]; props.speech.speak(`ラジオ局番号 ${currentIndex() + 1}。名前：${s.name}。サービス：${getServiceName(s.service)}。説明：${s.description}`); } },
    { label: '局数', action: () => { props.speech.speak(`全${allStations.length}局中、${currentIndex() + 1}番目のラジオ局です`); } },
    { label: '停止', action: () => { props.speech.stop(); } },
    { label: '先頭', action: () => { setCurrentIndex(0); setTimeout(() => { props.speech.speak(`最初のラジオ局に戻りました。${allStations[0].name}`, { interrupt: true }); }, 100); } },
  ];

  return <GridSystem actions={actions()} speech={props.speech} />;
}
