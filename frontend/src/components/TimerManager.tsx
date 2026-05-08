import { createSignal, onMount, onCleanup } from 'solid-js';
import { SpeechManager } from '../lib/speech';
import { getAllTimers, createTimer, startTimer, pauseTimer, deleteTimer, updateTimerRemaining, Timer, formatTime } from '../lib/timer';
import GridSystem from './GridSystem';
import { createGuideAction } from '../lib/grid-guide';

interface TimerManagerProps {
  speech: SpeechManager;
  onBack: () => void;
}

const PRESET_TIMERS = [
  { title: '10秒（テスト用）', seconds: 10 },
  { title: '1分', seconds: 60 },
  { title: '3分', seconds: 180 },
  { title: '5分', seconds: 300 },
  { title: '10分', seconds: 600 },
  { title: '15分', seconds: 900 },
  { title: '30分', seconds: 1800 },
  { title: '1時間', seconds: 3600 },
];

export default function TimerManager(props: TimerManagerProps) {
  const [timers, setTimers] = createSignal<Timer[]>([]);
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [presetIndex, setPresetIndex] = createSignal(0);
  const [mode, setMode] = createSignal<'list' | 'preset'>('list');
  let intervalRef: ReturnType<typeof setInterval> | null = null;

  onMount(() => {
    loadTimers();
    intervalRef = setInterval(() => { updateAllTimers(); }, 1000);
  });

  onCleanup(() => { if (intervalRef) { clearInterval(intervalRef); } });

  const loadTimers = () => {
    const allTimers = getAllTimers();
    setTimers(allTimers);
    setTimeout(() => {
      if (allTimers.length === 0) { props.speech.speak('タイマーはまだ設定されていません。プリセットボタンから設定できます'); }
      else { props.speech.speak(`タイマー、${allTimers.length}件が設定されています`); if (allTimers.length > 0) { setTimeout(() => speakTimer(), 2000); } }
    }, 500);
  };

  const updateAllTimers = () => {
    const allTimers = getAllTimers();
    let updated = false;
    allTimers.forEach((timer) => {
      if (timer.isActive && timer.remainingSeconds > 0) {
        timer.remainingSeconds -= 1;
        updateTimerRemaining(timer.id, timer.remainingSeconds);
        updated = true;
        if (timer.remainingSeconds === 0) { pauseTimer(timer.id); props.speech.speak(`タイマー「${timer.title}」が完了しました`, { interrupt: false }); }
      }
    });
    if (updated) { setTimers([...allTimers]); }
  };

  const speakTimer = () => {
    const timer = timers()[currentIndex()];
    if (!timer) return;
    const status = timer.isActive ? '動作中' : '停止中';
    props.speech.speak(`タイマー ${currentIndex() + 1}。${timer.title}。残り時間：${formatTime(timer.remainingSeconds)}。${status}`, { interrupt: true });
  };

  const speakPreset = () => {
    const preset = PRESET_TIMERS[presetIndex()];
    props.speech.speak(`プリセット ${presetIndex() + 1}。${preset.title}`, { interrupt: true });
  };

  const listActions = () => {
    const actionList = [
      { label: '戻る', action: () => { props.speech.stop(); props.onBack(); } },
      { label: '前', action: () => { if (currentIndex() > 0) { setCurrentIndex(currentIndex() - 1); setTimeout(speakTimer, 100); } else { props.speech.speak('最初のタイマーです'); } } },
      { label: '次', action: () => { if (currentIndex() < timers().length - 1) { setCurrentIndex(currentIndex() + 1); setTimeout(speakTimer, 100); } else { props.speech.speak('最後のタイマーです'); } } },
      { label: '情報', action: speakTimer },
      {
        label: timers()[currentIndex()]?.isActive ? '停止' : '開始',
        action: () => {
          const timer = timers()[currentIndex()];
          if (!timer) { props.speech.speak('タイマーがありません'); return; }
          if (timer.isActive) { pauseTimer(timer.id); props.speech.speak('タイマーを一時停止しました'); }
          else { startTimer(timer.id); props.speech.speak('タイマーを開始しました'); }
          loadTimers();
        },
      },
      {
        label: '削除',
        action: () => {
          const timer = timers()[currentIndex()];
          if (!timer) { props.speech.speak('削除するタイマーがありません'); return; }
          deleteTimer(timer.id);
          props.speech.speak('タイマーを削除しました');
          const updated = getAllTimers();
          setTimers(updated);
          if (currentIndex() >= updated.length && updated.length > 0) { setCurrentIndex(updated.length - 1); }
          else if (updated.length === 0) { setCurrentIndex(0); }
        },
      },
      { label: 'プリセット', action: () => { setMode('preset'); props.speech.speak('プリセットタイマー選択モードに切り替えました'); setTimeout(speakPreset, 1000); } },
      { label: '停止音声', action: () => { props.speech.stop(); } },
      createGuideAction('タイマー一覧', props.speech, () => actionList),
    ];

    return actionList;
  };

  const presetActions = () => {
    const actionList = [
      { label: '戻る', action: () => { setMode('list'); props.speech.speak('タイマー一覧モードに切り替えました'); if (timers().length > 0) { setTimeout(speakTimer, 1000); } } },
      { label: '前', action: () => { if (presetIndex() > 0) { setPresetIndex(presetIndex() - 1); setTimeout(speakPreset, 100); } else { props.speech.speak('最初のプリセットです'); } } },
      { label: '次', action: () => { if (presetIndex() < PRESET_TIMERS.length - 1) { setPresetIndex(presetIndex() + 1); setTimeout(speakPreset, 100); } else { props.speech.speak('最後のプリセットです'); } } },
      { label: '読み上げ', action: speakPreset },
      {
        label: '作成',
        action: () => {
          const preset = PRESET_TIMERS[presetIndex()];
          createTimer(preset.title, preset.seconds);
          props.speech.speak(`${preset.title}のタイマーを作成しました`);
          loadTimers();
          setMode('list');
          props.speech.speak('タイマー一覧モードに切り替えました');
        },
      },
      { label: '', action: () => {} },
      { label: 'プリセット数', action: () => { props.speech.speak(`全${PRESET_TIMERS.length}プリセット中、${presetIndex() + 1}番目です`); } },
      { label: '停止', action: () => { props.speech.stop(); } },
      createGuideAction('タイマープリセット一覧', props.speech, () => actionList),
    ];

    return actionList;
  };

  return <GridSystem actions={mode() === 'list' ? listActions() : presetActions()} speech={props.speech} />;
}
