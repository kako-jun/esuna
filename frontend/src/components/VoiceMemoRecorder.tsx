import { createSignal, onMount, onCleanup, Show } from 'solid-js';
import { SpeechManager } from '../lib/speech';
import { saveMemo, getAllMemos, deleteMemo, VoiceMemo, blobToBase64, base64ToBlob } from '../lib/voice-memo';
import GridSystem, { GridAction } from './GridSystem';
import { createGuideAction } from '../lib/grid-guide';

interface VoiceMemoRecorderProps {
  speech: SpeechManager;
  onBack: () => void;
}

export default function VoiceMemoRecorder(props: VoiceMemoRecorderProps) {
  const [memos, setMemos] = createSignal<VoiceMemo[]>([]);
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [isRecording, setIsRecording] = createSignal(false);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [recordingTime, setRecordingTime] = createSignal(0);

  let mediaRecorderRef: MediaRecorder | null = null;
  let audioChunksRef: Blob[] = [];
  let audioRef: HTMLAudioElement | null = null;
  let recordingTimerRef: ReturnType<typeof setInterval> | null = null;
  let recordingTimeRef = 0;
  let currentAudioUrlRef: string | null = null;

  onMount(() => { void loadMemos(); });

  onCleanup(() => {
    if (recordingTimerRef) { clearInterval(recordingTimerRef); }
    if (audioRef) { audioRef.pause(); }
    if (currentAudioUrlRef) { URL.revokeObjectURL(currentAudioUrlRef); currentAudioUrlRef = null; }
  });

  const loadMemos = async () => {
    const allMemos = await getAllMemos();
    setMemos(allMemos);
    setTimeout(() => {
      if (allMemos.length === 0) { props.speech.speak('音声メモはまだ録音されていません。録音ボタンで録音を開始できます'); }
      else { props.speech.speak(`音声メモ、${allMemos.length}件が保存されています`); if (allMemos.length > 0) { setTimeout(() => speakMemo(), 2000); } }
    }, 500);
  };

  const speakMemo = () => {
    const memo = memos()[currentIndex()];
    if (!memo) return;
    const createdDate = new Date(memo.createdAt).toLocaleString('ja-JP');
    const minutes = Math.floor(memo.duration / 60);
    const seconds = Math.floor(memo.duration % 60);
    props.speech.speak(`メモ ${currentIndex() + 1}。タイトル：${memo.title}。長さ：${minutes}分${seconds}秒。録音日時：${createdDate}`, { interrupt: true });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef = mediaRecorder;
      audioChunksRef = [];
      setRecordingTime(0);
      recordingTimeRef = 0;

      mediaRecorder.ondataavailable = (event) => { audioChunksRef.push(event.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef, { type: 'audio/webm' });
        const base64Data = await blobToBase64(audioBlob);
        const finalDuration = recordingTimeRef;
        const now = new Date();
        const { result } = await saveMemo({ title: `音声メモ ${now.toLocaleString('ja-JP')}`, audioData: base64Data, duration: finalDuration, tags: [] });
        if (result.ok) {
          props.speech.speak(`音声メモを保存しました。長さは${finalDuration}秒です`);
        } else if (result.reason === 'quota_exceeded') {
          props.speech.speak(`音声メモの保存に失敗しました。ストレージ容量が不足しています。不要なメモを削除してから再試行してください。`);
        } else {
          props.speech.speak('音声メモの保存に失敗しました。1番で戻るか、4番でもう一度試せます。');
        }
        await loadMemos();
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      props.speech.speak('録音を開始しました');

      recordingTimerRef = setInterval(() => {
        setRecordingTime((prev) => { const next = prev + 1; recordingTimeRef = next; return next; });
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      props.speech.speak('録音の開始に失敗しました。マイクへのアクセスが許可されていません。ブラウザの設定でマイクを許可してから再試行してください。');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef && isRecording()) {
      mediaRecorderRef.stop();
      setIsRecording(false);
      props.speech.speak('録音を停止しました');
      if (recordingTimerRef) { clearInterval(recordingTimerRef); recordingTimerRef = null; }
    }
  };

  const playMemo = () => {
    const memo = memos()[currentIndex()];
    if (!memo) { props.speech.speak('再生するメモがありません'); return; }
    if (isPlaying()) { audioRef?.pause(); setIsPlaying(false); props.speech.speak('再生を一時停止しました'); return; }
    try {
      const audioBlob = base64ToBlob(memo.audioData);
      if (currentAudioUrlRef) { URL.revokeObjectURL(currentAudioUrlRef); }
      const audioUrl = URL.createObjectURL(audioBlob);
      currentAudioUrlRef = audioUrl;
      if (!audioRef) {
        audioRef = new Audio(audioUrl);
        audioRef.addEventListener('ended', () => { setIsPlaying(false); props.speech.speak('再生が終了しました'); });
      } else { audioRef.src = audioUrl; }
      audioRef.play();
      setIsPlaying(true);
      props.speech.speak('再生を開始します');
    } catch (error) {
      console.error('Failed to play memo:', error);
      props.speech.speak('音声メモの再生に失敗しました。データが壊れている可能性があります。');
    }
  };

  const deleteCurrent = async () => {
    const memo = memos()[currentIndex()];
    if (!memo) { props.speech.speak('削除するメモがありません'); return; }
    await deleteMemo(memo.id);
    props.speech.speak('メモを削除しました');
    const updated = await getAllMemos();
    setMemos(updated);
    if (currentIndex() >= updated.length && updated.length > 0) { setCurrentIndex(updated.length - 1); }
    else if (updated.length === 0) { setCurrentIndex(0); }
  };

  const actions = () => {
    const actionList: GridAction[] = [
      { label: '戻る', action: () => { props.speech.stop(); if (isRecording()) { stopRecording(); } if (isPlaying()) { audioRef?.pause(); } props.onBack(); } },
      { label: '前のメモ', action: () => { if (currentIndex() > 0) { setCurrentIndex(currentIndex() - 1); speakMemo(); } else { props.speech.speak('最初のメモです'); } } },
      { label: '次のメモ', action: () => { if (currentIndex() < memos().length - 1) { setCurrentIndex(currentIndex() + 1); speakMemo(); } else { props.speech.speak('最後のメモです'); } } },
      { label: '情報', action: speakMemo },
      { label: isRecording() ? '録音停止' : '録音開始', action: isRecording() ? stopRecording : startRecording },
      { label: isPlaying() ? '再生停止' : '再生', action: playMemo },
      { label: '削除', action: deleteCurrent },
      { label: '停止', action: () => { props.speech.stop(); if (isPlaying()) { audioRef?.pause(); setIsPlaying(false); } } },
      createGuideAction('音声メモ一覧', props.speech, () => actionList),
    ];

    return actionList;
  };

  return (
    <div>
      <Show when={isRecording()}>
        <div class="ff-status-bar ff-status-bar--recording" role="status" aria-live="polite">
          ● REC {recordingTime()}秒
        </div>
      </Show>
      <GridSystem actions={actions()} speech={props.speech} />
    </div>
  );
}
