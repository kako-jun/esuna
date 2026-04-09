import { createSignal, onMount, Show } from 'solid-js';
import { useAppStore } from '../lib/store';
import { fetchNovelContent } from '../lib/api-client';
import { SpeechManager } from '../lib/speech';
import { useAutoNavigation } from '../lib/useAutoNavigation';
import GridSystem from './GridSystem';

interface NovelReaderProps {
  speech: SpeechManager;
  onBack: () => void;
}

export default function NovelReader(props: NovelReaderProps) {
  const store = useAppStore();
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  onMount(() => {
    if (!store.state.novelContent && store.state.selectedNovel) {
      loadNovel();
    }
  });

  const loadNovel = async () => {
    const selectedNovel = store.state.selectedNovel;
    if (!selectedNovel) { props.speech.speak('小説が選択されていません'); props.onBack(); return; }
    setLoading(true); setError(null);
    try {
      const content = await fetchNovelContent(selectedNovel.authorId, selectedNovel.fileId);
      store.setNovelContent(content);
      setTimeout(() => {
        props.speech.speak(`${content.title} を読み込みました。全${content.sections.length}セクションあります。最初のセクションから読み上げます`);
        setTimeout(() => speakSection(), 2000);
      }, 500);
    } catch (err) {
      console.error('Failed to load novel:', err);
      setError('小説の読み込みに失敗しました');
      props.speech.speak('小説の読み込みに失敗しました。戻ります');
      setTimeout(props.onBack, 2000);
    } finally {
      setLoading(false);
    }
  };

  const speakSection = (sectionOverride?: { title: string; content: string }, indexOverride?: number) => {
    const section = sectionOverride ?? store.getCurrentSection();
    const idx = indexOverride ?? store.state.currentSectionIndex;
    if (!section) return;
    const sectionTitle = section.title || `セクション ${idx + 1}`;
    props.speech.speak(`${sectionTitle}。${section.content}`, { interrupt: true });
  };

  useAutoNavigation({
    get enabled() { return store.state.autoNavigationEnabled; },
    speech: props.speech,
    onNext: () => {
      if (store.state.novelContent && store.state.currentSectionIndex < store.state.novelContent.sections.length - 1) { store.nextSection(); setTimeout(speakSection, 100); }
      else { props.speech.speak('最後のセクションです'); }
    },
    delay: 2000,
  });

  const actions = () => [
    { label: '戻る', action: () => { props.speech.stop(); store.setNovelContent(null); props.onBack(); } },
    { label: '前のセクション', action: () => { if (store.state.currentSectionIndex > 0) { store.prevSection(); setTimeout(speakSection, 100); } else { props.speech.speak('最初のセクションです'); } } },
    { label: '次のセクション', action: () => { if (store.state.novelContent && store.state.currentSectionIndex < store.state.novelContent.sections.length - 1) { store.nextSection(); setTimeout(speakSection, 100); } else { props.speech.speak('最後のセクションです'); } } },
    { label: '読み上げ', action: () => speakSection() },
    { label: '位置', action: () => { if (store.state.novelContent) { props.speech.speak(`全${store.state.novelContent.sections.length}セクション中、${store.state.currentSectionIndex + 1}番目のセクションです`); } } },
    { label: '作品情報', action: () => { if (store.state.novelContent && store.state.selectedNovel) { props.speech.speak(`タイトル：${store.state.novelContent.title}。著者：${store.state.novelContent.author}。全${store.state.novelContent.sections.length}セクション`); } } },
    {
      label: '先頭',
      action: () => {
        if (store.state.currentSectionIndex !== 0) {
          store.setCurrentSectionIndex(0);
          setTimeout(() => { const firstSection = store.state.novelContent?.sections[0]; if (firstSection) speakSection(firstSection, 0); }, 100);
        } else { props.speech.speak('すでに最初のセクションです'); }
      },
    },
    { label: '停止', action: () => { props.speech.stop(); } },
    {
      label: 'リロード',
      action: () => {
        props.speech.speak('再読み込みします');
        store.setNovelContent(null);
        setTimeout(() => {
          const selectedNovel = store.state.selectedNovel;
          if (selectedNovel) {
            fetchNovelContent(selectedNovel.authorId, selectedNovel.fileId)
              .then((content) => { store.setNovelContent(content); props.speech.speak('再読み込みしました'); })
              .catch(() => { props.speech.speak('再読み込みに失敗しました'); });
          }
        }, 500);
      },
    },
  ];

  return (
    <Show when={!loading()} fallback={<div class="p-4 text-center">小説を読み込んでいます...</div>}>
      <Show when={!error()} fallback={
        <div class="grid-container" role="alert" aria-live="assertive">
          <div class="grid-item" style={{ "grid-column": '1 / -1', "grid-row": '1 / -1' }}>
            エラー: {error()}
          </div>
        </div>
      }>
        <GridSystem actions={actions()} speech={props.speech} />
      </Show>
    </Show>
  );
}
